/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight engine
   ----------------------------------------------------------------------------
   Framework-agnostic. Vanilla JS, zero dependencies. It builds its own DOM and
   injects its own (namespaced) CSS into a container you give it, so it drops into
   plain HTML, Next.js (call from a ref/useEffect), Vue (onMounted), a server-
   rendered page, anything.

   USAGE
     mountScrollWorld(document.getElementById('world'), {
       brand: { name: 'Pearl & Co.', href: '#top' },
       diveScroll: 1.3,   // viewport-heights of scroll per dive clip
       connScroll: 0.9,   // ...per connector clip
       hint: 'scroll to fly in',
       nav: true,         // show the top section nav
       atmosphere: true,  // subtle gradient + drifting particles behind the clips
       opening: { … },    // optional hero scene (same shape as a section) shown before
                          // the numbered sections — no route dot, nav entry or NN/NN
       sections: [
         { id, label, still, stillMobile, clip, clipMobile, accent,
           scroll: 1.6,   // optional per-section override of diveScroll — more scroll
                          // distance = a slower, longer dwell in this scene
           linger: 0.5,   // optional 0..1 — remaps time so the camera settles mid-scene
                          // (exactly where the copy peaks) and moves quicker at the
                          // edges. 0 = linear (default). Keep ≤ 0.6; 1 = full pause.
           eyebrow, title, body, tags:[…],
           cta:{ primary:{label,href}, secondary:{label,href} } }, // last section only
         …
       ],
       connectors: [clipUrl, …],          // length = sections.length - 1 (nulls allowed)
       connectorsMobile: [clipUrl, …],    // optional lighter connectors for phones (same length)

   MOBILE (the clipMobile/connectorsMobile variants are the opt-in mobile version;
   the rest of the phone handling below is always on)
     The engine is phone-aware out of the box: on a coarse-pointer / ≤860px viewport it
       - loads `clipMobile` / `connectorsMobile` when provided (encode these smaller +
         tighter-GOP — seek cost on a phone decoder is dominated by frames-from-keyframe,
         so a 720p, -g 4 file scrubs far smoother than the 1080p desktop master; see
         pipeline.md). Falls back to the desktop `clip` if no mobile variant is given.
       - uses `stillMobile` as the scene poster when provided (pair it with native 9:16
         clipMobile renders so the poster matches the portrait video's first frame instead
         of flashing from a landscape crop). Posters load lazily (active segment +
         neighbours) and re-resolve when the 860px query flips, so a desktop resize
         into phone width swaps to the portrait sources without a reload.
       - coalesces seeks (never issues a new currentTime while the decoder is still
         `seeking`) so fast flicks can't pile up and freeze the video.
       - keeps the still as a live poster until the clip actually paints its first frame,
         and primes each video (muted play→pause) on first touch — this is what stops iOS
         from showing a blank scene before the first seek.
       - drops the drifting particles and ignores URL-bar-only resizes (no scroll jump).
     Nothing here is required — a config with only `clip`/`connectors` still works on
     phones; the mobile variants just make it lighter and smoother.

   THEME (CSS custom properties; set on the container or :root to override)
     --sw-bg         page background (match your scene bg for seamless posters)
     --sw-ink        primary text
     --sw-ink-soft   secondary text
     --sw-accent     default accent (each section overrides via its `accent`)
     --sw-font-display / --sw-font-body

   REQUIREMENTS ON YOUR ASSETS
     - clips encoded native-res, crf~20, -g 8, +faststart, no audio (see pipeline.md)
     - connectors' endpoints are the neighbouring dives' ACTUAL frames (see SKILL Step 5)
     - (optional) mobile variants at ~720p, -g 4 for smoother phone scrubbing
   The engine loads each clip as a Blob (always seekable) and scrubs currentTime; it does
   NOT depend on HTTP byte-range support.
   ========================================================================== */

function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phone detection. `coarse` is captured once (input type doesn't change mid-session);
  // the ≤860px query is read live via isMobile() so a desktop resize/DevTools toggle
  // switches sources and seek behaviour without a reload.
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;
  const OPENING = config.opening || null;
  const SECTIONS = config.sections || [];
  // Scenes = optional opening hero + the numbered sections. The opening
  // contributes a media segment and copy, but no route dot, nav entry or
  // NN/NN number — navigation stays 01/N over the sections alone.
  const SCENES = OPENING ? [OPENING].concat(SECTIONS) : SECTIONS;
  const OFF = OPENING ? 1 : 0;
  const CONNECTORS = config.connectors || [];
  const CONNECTORS_M = config.connectorsMobile || [];
  const DIVE_W = config.diveScroll || 1.3;
  const CONN_W = config.connScroll || 0.9;
  // Extra viewport-heights of hold after the last scene's flight completes,
  // before the footer (normal-flow content after the track) may enter. The
  // copy/route fade out during this window (see .sw-outro).
  const OUTRO = (config.outro != null) ? config.outro : 0.9;
  const CROSSFADE = (config.crossfade != null) ? config.crossfade : 0.12;  // seam dissolve width (vh)
  const N = SECTIONS.length;
  const NC = SCENES.length;
  if (!N) return;

  injectCSS();
  container.classList.add('sw-root');

  // ---- build the interleaved segment chain: dive0, conn0, dive1, … diveN-1 ----
  const SEGMENTS = [];
  SCENES.forEach((s, i) => {
    const dive = { kind: 'dive', si: i, clip: s.clip, clipM: s.clipMobile, still: s.still, stillM: s.stillMobile,
                   accent: s.accent, w: s.scroll || DIVE_W, linger: s.linger || 0 };
    SEGMENTS.push(dive);
    s._seg = dive;
    // A connector is optional: if connectors[k] is falsy, the two dives simply
    // crossfade directly (no fly-over). Lets a page complete even when a
    // connector can't be generated (e.g. a content-filter false-positive).
    // Connectors are indexed between the numbered sections; the opening hero
    // always hands over to the first section with a plain crossfade.
    const k = i - OFF;
    if (k >= 0 && k < N - 1 && CONNECTORS[k]) {
      SEGMENTS.push({ kind: 'conn', si: i, clip: CONNECTORS[k], clipM: CONNECTORS_M[k],
                      still: SCENES[i + 1].still, stillM: SCENES[i + 1].stillMobile,
                      accent: SCENES[i + 1].accent, w: CONN_W });
    }
  });
  const NSEG = SEGMENTS.length;

  // ---- DOM ----
  const sky = el('div', 'sw-sky');
  if (config.atmosphere !== false) {
    sky.appendChild(el('div', 'sw-sky__grad'));
    sky.appendChild(el('div', 'sw-sky__glow'));
  }
  const particles = el('div', 'sw-particles'); sky.appendChild(particles);

  const scrollbar = el('div', 'sw-scrollbar');
  const scrollbarFill = el('span'); scrollbar.appendChild(scrollbarFill);

  const topbar = el('div', 'sw-topbar');
  if (config.brand) {
    const brand = el('a', 'sw-brand'); brand.href = (config.brand.href || '#');
    brand.appendChild(el('span', 'sw-brand__mark'));
    const nm = el('span', 'sw-brand__name'); nm.textContent = config.brand.name || ''; brand.appendChild(nm);
    topbar.appendChild(brand);
  }
  const nav = el('nav', 'sw-nav'); if (config.nav !== false) topbar.appendChild(nav);
  if (config.cta && config.cta.label) {
    const c = el('a', 'sw-topcta'); c.href = config.cta.href || '#'; c.textContent = config.cta.label;
    topbar.appendChild(c);
  }

  const stage = el('div', 'sw-stage');
  const sequenceCanvas = el('canvas', 'sw-sequence-canvas');
  sequenceCanvas.setAttribute('aria-hidden', 'true');
  sequenceCanvas.tabIndex = -1;
  stage.appendChild(sequenceCanvas);
  const copylayer = el('div', 'sw-copylayer');
  const route = el('div', 'sw-route');
  const hint = el('div', 'sw-hint');
  const hintText = el('span'); hintText.textContent = config.hint || 'scroll'; hint.appendChild(hintText);
  hint.appendChild(el('i'));
  const track = el('div', 'sw-track');

  [sky, scrollbar, topbar, stage, copylayer, route, hint, track].forEach(n => container.appendChild(n));

  // segment scenes
  SEGMENTS.forEach(s => {
    const scene = el('div', 'sw-scene'); scene.style.setProperty('--sw-accent', s.accent || '');
    const img = el('img', 'sw-scene__still'); img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
    scene.appendChild(img); stage.appendChild(scene);
    s.el = scene; s.img = img; s.video = null; s.hasClip = false; s.stillVariant = null;
    s.loading = false; s.ready = false; s.cur = 0; s.target = 0; s.visible = false;
  });

  // Stills are full-resolution PNGs, so we never assign all of them up front:
  // read() calls loadStill() only for the active segment and its neighbours
  // (same scroll window as the clips). Crossing the 860px breakpoint swaps the
  // already-loaded posters to the matching desktop/mobile source.
  function loadStill(s) {
    const wantM = !!(isMobile() && s.stillM);
    const variant = wantM ? 'm' : 'd';
    if (s.stillVariant === variant) return;
    const src = wantM ? s.stillM : s.still;
    if (!src) return;
    s.stillVariant = variant;
    s.img.src = src;
  }
  function onSmallChange() {
    SEGMENTS.forEach(s => { if (s.stillVariant) loadStill(s); });
    sequenceRenderers.forEach(renderer => renderer.handleBreakpointChange());
    // A renderer may have just disabled itself (breakpoint flip) — re-run read()
    // so the DOM scenes come back with fresh opacity instead of stale values.
    read();
  }
  smallMQ.addEventListener('change', onSmallChange);

  // per-scene copy (the opening hero, when present, carries no NN/NN number)
  const copies = [], dots = [];
  SCENES.forEach((s, i) => {
    const c = el('article', 'sw-copy'); c.style.setProperty('--sw-accent', s.accent || '');
    // The opening hero carries the page's single h1; numbered stages are h2.
    const h = (OFF && i === 0) ? 'h1' : 'h2';
    c.innerHTML =
      (i >= OFF ? `<span class="sw-copy__num">${pad(i - OFF + 1)} / ${pad(N)}</span>` : '') +
      (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : '') +
      (s.title ? `<${h} class="sw-copy__title">${esc(s.title)}</${h}>` : '') +
      (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : '') +
      (s.tags && s.tags.length ? `<ul class="sw-copy__tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
      (s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : '');
    copylayer.appendChild(c); copies.push(c);
  });

  // route dots / nav — numbered sections only
  SECTIONS.forEach((s, i) => {
    const dot = el('button', 'sw-route__dot'); dot.type = 'button'; dot.setAttribute('aria-label', 'מעבר לשלב ' + pad(i + 1) + ': ' + (s.label || '')); dot.style.setProperty('--sw-accent', s.accent || '');
    dot.innerHTML = `<span class="sw-route__label">${esc(s.eyebrow || (pad(i + 1) + ' · ' + (s.label || '')))}</span><i></i>`;
    dot.addEventListener('click', () => jumpTo(i)); route.appendChild(dot); dots.push(dot);

    if (config.nav !== false) {
      const b = el('button', 'sw-nav__item'); b.textContent = s.label || '';
      b.addEventListener('click', () => jumpTo(i)); nav.appendChild(b);
    }
  });

  // ---- math ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  // Per-section dwell: monotone remap of scroll→time so the camera settles mid-scene
  // (where the copy peaks) and moves quicker near the seams. L=0 linear, L=1 full
  // mid-scene pause. f(0)=0, f(1)=1 always, so seam frames are untouched.
  const lingerEase = (x, L) => { L = clamp(L); const c = x - 0.5; return (1 - L) * x + L * (4 * c * c * c + 0.5); };
  let vh = window.innerHeight, stageX = 0, totalW = 0, activeIndex = -1, ticking = false, rafId = 0, readRafId = 0;
  let laidOutW = window.innerWidth;   // width the current layout was computed at (see onResize)
  // Footer + track metrics are measured once per layout(), not per scroll frame —
  // getBoundingClientRect/offsetHeight in the scroll handler forces a reflow per frame.
  let trackH = 0, footerEl = null, footerH = 0;
  const HAS_CLIPS = SEGMENTS.some(s => s.clip || s.clipM);
  const sequenceRenderers = [
    createFrameSequenceRenderer({
      label: 'mobile',
      manifestUrl: '/assets/scroll-world/frames/mobile/manifest.json',
      canvas: sequenceCanvas,
      container,
      scenes: SCENES,
      segments: SEGMENTS,
      reduce,
      isActiveViewport: () => isMobile(),
      stillUrl: (scene) => scene.stillMobile || scene.still,
      clamp
    }),
    createFrameSequenceRenderer({
      label: 'desktop',
      manifestUrl: '/assets/scroll-world/frames/desktop/manifest.json',
      canvas: sequenceCanvas,
      container,
      scenes: SCENES,
      segments: SEGMENTS,
      reduce,
      isActiveViewport: () => !isMobile(),
      stillUrl: (scene) => scene.still,
      clamp
    })
  ];
  let footerReveal = -1;

  function getFooter() {
    let node = container.nextElementSibling;
    while (node && !node.matches?.('.site-footer')) node = node.nextElementSibling;
    return node || document.querySelector('.site-footer');
  }

  function setFooterReveal(px) {
    const next = Math.max(0, Math.round(px));
    if (Math.abs(next - footerReveal) < 1) return;
    footerReveal = next;
    container.style.setProperty('--sw-footer-reveal', next + 'px');
    container.style.setProperty('--sw-copy-lift', (-Math.min(96, next * 0.35)) + 'px');
    sequenceRenderers.forEach(renderer => renderer.handleMediaResize(next));
  }

  function layout() {
    vh = window.innerHeight;
    laidOutW = window.innerWidth;
    stageX = window.innerWidth > 860 ? 4 : 0;
    let off = 0;
    SEGMENTS.forEach(s => { s.start = off * vh; off += s.w; s.end = off * vh; });
    totalW = off;
    trackH = totalW * vh + (1 + OUTRO) * vh;   // +1vh so the last flight completes, +OUTRO so the footer only enters after the final hold
    track.style.height = trackH + 'px';
    footerEl = getFooter();
    footerH = footerEl ? footerEl.getBoundingClientRect().height : 0;
    footerReveal = -1;
    setFooterReveal(0);
    sequenceRenderers.forEach(renderer => renderer.layout());
    read();
  }

  function jumpTo(i) {
    const seg = SECTIONS[i]._seg;
    // Instant on touch: native smooth-scroll fights the normalized scroller
    // there, and the renderer's glide loop animates the landing anyway.
    const behavior = (reduce || isMobile()) ? 'auto' : 'smooth';
    window.scrollTo({ top: seg.start + (seg.end - seg.start) * 0.08, behavior });
  }

  function loadClip(s) {
    // Under prefers-reduced-motion we never load the clips at all — the stills stay up
    // and simply cross-dissolve as you scroll. No scrubbed video motion, no decode cost.
    if (reduce || s.loading || !s.clip) return;
    s.loading = true;
    // Serve the lighter mobile encode on phones when one was provided.
    const url = (isMobile() && s.clipM) ? s.clipM : s.clip;
    fetch(url).then(r => r.ok ? r.blob() : Promise.reject(new Error('404')))
      .then(blob => {
        const v = document.createElement('video');
        v.className = 'sw-scene__video';
        v.muted = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.src = URL.createObjectURL(blob);
        v.addEventListener('loadedmetadata', () => { s.ready = true; read(); });
        // Reveal the video (hide the still poster) only once a real frame has
        // painted — on iOS a seeked-but-never-played muted video stays blank, so
        // hiding the still on metadata alone would flash an empty scene.
        v.addEventListener('seeked', () => { s.el.classList.add('has-clip'); }, { once: true });
        v.addEventListener('loadeddata', () => { try { v.pause(); } catch (e) {} if (userReady) primeVideo(v); });
        s.el.appendChild(v); s.video = v; s.hasClip = true;
      }).catch(() => { s.loading = false; });
  }

  function read() {
    const y = window.scrollY || window.pageYOffset;
    const fade = CROSSFADE * vh;
    // While the canvas frame-sequence is live the DOM scenes sit under
    // opacity:0!important — skip their per-frame style writes entirely so the
    // scroll handler isn't doing double rendering work.
    const seqActive = container.classList.contains('sw-has-sequence');
    let ci = 0;
    for (let i = 0; i < NSEG; i++) if (y >= SEGMENTS[i].start) ci = i;

    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (y > s.start - 1.6 * vh && y < s.end + 1.6 * vh) { loadStill(s); loadClip(s); }
      const local = clamp((y - s.start) / (s.end - s.start), 0, 1);
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      if (seqActive) continue;
      let outside = 0;
      // The last scene never fades past its end — it stays up through the outro
      // hold so the footer scrolls in over the final still, never over an empty
      // background.
      if (y < s.start) outside = s.start - y; else if (y > s.end && i < NSEG - 1) outside = y - s.end;
      const op = smooth(1 - outside / fade);
      s.el.style.opacity = op; s.visible = op > 0.001;
      s.el.style.zIndex = (i === ci) ? '120' : String(100 + Math.round(op * 10));
      if (!s.hasClip || !s.ready) {
        const sc = reduce ? 1 : 1.03 + local * 0.14;
        s.img.style.transform = `translateX(${stageX - 2}vw) scale(${sc.toFixed(3)})`;
      }
    }

    const cur = SEGMENTS[ci];
    const curLocal = clamp((y - cur.start) / (cur.end - cur.start), 0, 1);
    const transitionScene = cur.kind === 'dive' && cur.si < NC - 1 && curLocal > 0.78 ? cur.si + 1 : cur.si;
    const nearScene = clamp(cur.kind === 'dive' ? transitionScene
      : (curLocal > 0.5 ? cur.si + 1 : cur.si), 0, NC - 1);
    if (nearScene !== activeIndex) {
      activeIndex = nearScene;
      // Copy blocks enter/exit once per active-state change via CSS classes
      // (styled by the page), not per scroll frame.
      copies.forEach((c, k) => c.classList.toggle('is-active', k === nearScene));
      container.dataset.swScene = SCENES[nearScene].id || String(nearScene);
      // Dots/nav track the numbered sections; during the opening hero the
      // first section's dot stays highlighted (same as the pre-scroll state).
      const near = clamp(nearScene - OFF, 0, N - 1);
      dots.forEach((d, k) => d.classList.toggle('is-active', k === near));
      nav.querySelectorAll('.sw-nav__item').forEach((n, k) => n.classList.toggle('is-active', k === near));
      container.style.setProperty('--sw-accent', SCENES[nearScene].accent || '');
    }
    // Past the last scene's hold: fade copy layer + route rail as one CSS
    // transition (styled by the page via this class) before the footer enters.
    container.classList.toggle('sw-outro', y > SEGMENTS[NSEG - 1].end + 1);
    // Footer element/height are cached by layout(); re-resolve lazily only if the
    // footer wasn't in the DOM yet when layout() last ran.
    if (!footerEl) {
      footerEl = getFooter();
      if (footerEl) footerH = footerEl.getBoundingClientRect().height;
    }
    const footerVisible = footerH ? clamp((y + vh - trackH) / footerH, 0, 1) : 0;
    setFooterReveal(footerH * footerVisible);
    scrollbarFill.style.transform = `scaleX(${clamp(y / (totalW * vh))})`;
    hint.style.opacity = clamp(1 - y / (0.5 * vh));
    if (particles) particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
    ticking = false;
  }

  function raf() {
    const eps = isMobile() ? 0.02 : 0.008;   // coarser seek step on phones = fewer decodes
    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (!s.hasClip || !s.ready || !s.video) continue;
      // Never queue a seek while the decoder is still resolving the last one.
      // On phones a fast flick would otherwise pile up seeks and freeze the clip;
      // cur keeps lerping, so we snap to the latest target the moment it's free.
      if (s.video.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18);
      const dur = s.video.duration || 1;
      const t = clamp(s.cur, 0, 0.999) * dur;
      if (Math.abs(s.video.currentTime - t) > eps) { try { s.video.currentTime = t; } catch (e) {} }
    }
    rafId = requestAnimationFrame(raf);
  }

  // iOS needs a user gesture before a muted video will decode/paint reliably. On the
  // first touch we prime every loaded clip (muted play→pause) so the first seek is
  // instant instead of showing a blank frame. `userReady` also makes freshly-loaded
  // clips prime themselves (see loadClip).
  let userReady = false;
  function primeVideo(v) {
    if (!isMobile() || !v) return;
    try { const p = v.play(); if (p && p.then) p.then(() => { try { v.pause(); } catch (e) {} }).catch(() => {}); }
    catch (e) {}
  }
  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    SEGMENTS.forEach(s => primeVideo(s.video));
  }
  window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

  // Particles are a per-frame cost we can't afford alongside video scrubbing on a phone.
  seedParticles(particles, reduce || coarse || config.atmosphere === false);
  function onScroll() {
    if (!ticking) {
      ticking = true;
      readRafId = requestAnimationFrame(read);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // Mobile browsers fire `resize` every time the URL bar slides in/out. Re-running
  // layout() there rebuilds the track height and yanks the scroll position, so on
  // touch we ignore height-only changes and only relayout when the width actually
  // changes (rotation still comes through orientationchange). layout() records the
  // width it laid out at.
  function onResize() {
    if (coarse && window.innerWidth === laidOutW) return;
    layout();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);
  layout();
  // The video-scrub loop only runs when at least one segment actually has a clip;
  // a pure frame-sequence config shouldn't pay for an idle 60fps loop.
  if (HAS_CLIPS) rafId = requestAnimationFrame(raf);

  return function unmountScrollWorld() {
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(readRafId);
    sequenceRenderers.forEach(renderer => renderer.destroy());
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('touchstart', onFirstGesture);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', layout);
    window.removeEventListener('load', layout);
    smallMQ.removeEventListener('change', onSmallChange);
    container.replaceChildren();
    container.classList.remove('sw-root', 'sw-has-sequence', 'sw-outro');
    delete container.dataset.mounted;
    delete container.dataset.swScene;
  };

  // ---- helpers ----
  function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function ctaBtns(cta) {
    let h = '';
    if (cta.primary) h += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    if (cta.secondary) h += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    return h;
  }
}


function createFrameSequenceRenderer(opts) {
  const { label, manifestUrl, canvas, container, scenes, segments, reduce, isActiveViewport, stillUrl, clamp } = opts;
  const transitionIds = [
    '01-opening-to-planning',
    '02-planning-to-foundations',
    '03-foundations-to-structure',
    '04-structure-to-systems',
    '05-systems-to-finishes',
    '06-finishes-to-handover'
  ];
  const ctx = canvas.getContext('2d', { alpha: false });
  const state = { active: false, initialized: false, failed: false, manifest: null, gsap: null, ScrollTrigger: null,
    triggers: [], cache: new Map(), pending: new Map(), failedUrls: new Set(), stills: new Map(), current: null,
    fallbackScene: 0, renderRaf: 0, resizeRaf: 0, generation: 0, footerReveal: 0, viewW: 0, viewH: 0, warmedId: null,
    targetF: 0, displayF: 0, animRaf: 0, animLast: 0 };
  // Cache holds compressed Image objects (~60KB each); two full 24fps
  // transitions' worth so a scroll-back never refetches the sequence it
  // just played.
  const maxCache = 260;
  const warn = (msg) => { if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') console.warn('[scroll-world]', msg); };

  function canRun() { return !reduce && isActiveViewport(); }

  function handleBreakpointChange() {
    if (canRun()) init(); else disable();
  }

  // Viewport size is sampled here (layout/orientation changes) instead of via
  // getBoundingClientRect on every draw — a per-draw rect read forces layout, and
  // on phones the URL-bar slide would resize the canvas buffer mid-scroll.
  // The canvas is CSS-sized to 100lvh (largest viewport), so offsetHeight gives
  // the bar-collapsed height: the area under the browser bar is painted ahead
  // of time and the bar simply covers/uncovers it — no stretch, no repaint.
  function measure() {
    state.viewW = canvas.offsetWidth || window.innerWidth;
    state.viewH = canvas.offsetHeight || window.innerHeight;
  }

  function init() {
    if (state.initialized || state.failed || !canRun()) return;
    state.initialized = true;
    measure();
    state.generation += 1;
    const generation = state.generation;
    loadStill(0).then((img) => { if (generation === state.generation && img) drawImageCover(img); });
    Promise.all([
      fetch(manifestUrl).then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status)))),
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]).then(([manifest, gsapMod, triggerMod]) => {
      if (generation !== state.generation || !canRun()) return;
      state.manifest = normalizeManifest(manifest);
      state.gsap = gsapMod.gsap || gsapMod.default || gsapMod;
      state.ScrollTrigger = triggerMod.ScrollTrigger || triggerMod.default;
      state.gsap.registerPlugin(state.ScrollTrigger);
      // Mobile URL-bar show/hide fires resize; without this ScrollTrigger
      // refreshes mid-scroll and the page visibly jumps. Width changes
      // (rotation, real resizes) still refresh via the engine's layout().
      state.ScrollTrigger.config({ ignoreMobileResize: true });
      // On touch devices, take over scrolling entirely: scroll updates run on
      // GSAP's ticker (in sync with the glide loop) and iOS Safari's browser
      // bars stop sliding in and out mid-journey — the single biggest source
      // of whole-page jump on iPhone.
      if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        // allowNestedScroll keeps inner scrollables (the contact panel) usable.
        state.ScrollTrigger.normalizeScroll({ allowNestedScroll: true });
        state.normalized = true;
      }
      state.active = true;
      container.dataset.swSequence = label;
      container.classList.add('sw-has-sequence');
      createTriggers();
      // Warm the first flight so the very first scroll doesn't race the network.
      prefetchWindow(state.manifest.transitions[0], 0, 24);
      layout();
      state.ScrollTrigger.refresh();
    }).catch((error) => {
      state.failed = true;
      disable();
      warn(label + ' frame manifest or GSAP failed to load; using static PNG fallback. ' + (error && error.message ? error.message : error));
    });
  }

  function normalizeManifest(manifest) {
    const byId = new Map((manifest.transitions || []).map((item) => [item.id, item]));
    const transitions = transitionIds.map((id, index) => {
      const item = byId.get(id);
      if (!item || !Array.isArray(item.frames) || !item.frames.length) throw new Error('Missing frame sequence in manifest: ' + id);
      return { ...item, index };
    });
    return { transitions };
  }

  function createTriggers() {
    destroyTriggers();
    state.manifest.transitions.forEach((transition, index) => {
      const segment = segments[index];
      if (!segment) return;
      const hold = index === 0 ? 0.16 : 0.08;
      // The trigger reports the RAW scroll position — a wheel notch moves it
      // ~12 frames at once. Smoothing happens on our side: setTransition only
      // updates the target, and the renderer's animation loop (see animTick)
      // glides the displayed frame position toward it every display frame,
      // cross-blending adjacent frames along the way.
      // No onEnter/onEnterBack snaps: GSAP fires them AFTER onUpdate in the
      // same tick, so forcing progress 0/1 there rewinds the flight the moment
      // a section boundary is crossed. onUpdate alone always carries the true
      // clamped progress, including when a boundary is jumped past.
      const trigger = state.ScrollTrigger.create({
        start: () => segment.start + (segment.end - segment.start) * hold,
        end: () => segment.end,
        invalidateOnRefresh: true,
        onUpdate: (self) => setTransition(transition, self.progress)
      });
      state.triggers.push(trigger);
    });
  }

  function setTransition(transition, progress) {
    if (!state.active) return;
    const frameCount = transition.frameCount || transition.frames.length;
    const target = clamp(progress, 0, 1) * (frameCount - 1);
    // Crossing into a different transition snaps the displayed position: frame
    // indexes are per-transition, and the seam frames are visually identical
    // (last frame of one flight = first frame of the next), so there is
    // nothing to glide across.
    if (!state.current || state.current.transition !== transition) {
      state.current = { transition };
      state.displayF = target;
    }
    state.targetF = target;
    state.fallbackScene = Math.min(transition.index + (progress > 0.78 ? 1 : 0), scenes.length - 1);
    queueFrame(transition, Math.floor(target), true);
    queueFrame(transition, Math.ceil(target), true);
    prefetchWindow(transition, Math.round(target));
    // Once a transition becomes current, stream the rest of its frames at low
    // priority so a fast flick can't outrun the prefetch window mid-flight.
    if (state.warmedId !== transition.id) {
      state.warmedId = transition.id;
      prefetchWindow(transition, 0, transition.frames.length);
    }
    if (progress > 0.6 && state.manifest.transitions[transition.index + 1]) {
      prefetchWindow(state.manifest.transitions[transition.index + 1], 0, 16);
    }
    startAnim();
  }

  // Scroll smoothing lives here, not in ScrollTrigger: the displayed frame
  // position eases toward the scroll target with a ~180ms time constant every
  // display frame, so a wheel notch becomes a short glide through the frames
  // in between instead of a 12-frame snap. The loop parks itself once the
  // target is reached (no idle 60fps cost).
  function startAnim() {
    if (state.animRaf) return;
    state.animLast = performance.now();
    state.animRaf = requestAnimationFrame(animTick);
  }

  function animTick(now) {
    state.animRaf = 0;
    if (!state.active || !state.current) return;
    const dt = Math.min(100, now - (state.animLast || now));
    state.animLast = now;
    const diff = state.targetF - state.displayF;
    if (Math.abs(diff) < 0.02) {
      state.displayF = state.targetF;
      render();
      return;   // parked; next setTransition restarts the loop
    }
    state.displayF += diff * (1 - Math.exp(-dt / 180));
    // Keep the immediate neighbours of the moving position loading at
    // priority so the glide never waits on the network.
    queueFrame(state.current.transition, Math.floor(state.displayF), true);
    queueFrame(state.current.transition, Math.ceil(state.displayF), true);
    render();
    state.animRaf = requestAnimationFrame(animTick);
  }

  function prefetchWindow(transition, frameIndex, radius = 16) {
    for (let i = frameIndex - radius; i <= frameIndex + radius; i += 1) queueFrame(transition, i, false);
  }

  function queueFrame(transition, frameIndex, priority) {
    const frames = transition.frames;
    if (!frames || !frames.length) return;
    const index = Math.max(0, Math.min(frames.length - 1, frameIndex));
    const url = frames[index];
    if (state.cache.has(url) || state.pending.has(url) || state.failedUrls.has(url)) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // Decode off the hot path: without this the first drawImage of every new
      // frame does a synchronous WebP decode on the main thread (a per-frame
      // stutter, worst on phones). decode() failures still cache the image —
      // drawImage will decode it lazily as before.
      const finalize = () => {
        if (!state.pending.has(url)) return;   // destroyed while decoding
        state.pending.delete(url);
        state.cache.set(url, { img, transitionId: transition.id, index, lastUsed: performance.now() });
        pruneCache(url);
        if (priority) scheduleRender();
      };
      if (img.decode) img.decode().then(finalize, finalize); else finalize();
    };
    img.onerror = () => {
      state.pending.delete(url);
      state.failedUrls.add(url);
      if (priority) {
        warn(label + ' frame failed to load; holding nearest available frame: ' + url);
        scheduleRender();
      }
    };
    state.pending.set(url, img);
    img.src = url;
  }

  function pruneCache(protectedUrl) {
    if (state.cache.size <= maxCache) return;
    const entries = [...state.cache.entries()].filter(([url]) => url !== protectedUrl).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (state.cache.size > maxCache && entries.length) state.cache.delete(entries.shift()[0]);
  }

  function scheduleRender() {
    cancelAnimationFrame(state.renderRaf);
    state.renderRaf = requestAnimationFrame(render);
  }

  function render() {
    if (!state.active || !state.current) return;
    const transition = state.current.transition;
    const frameFloat = state.displayF;
    const frameIndex = Math.round(frameFloat);
    // Temporal blend: draw the frame below the fractional position, then the
    // frame above it at the remainder's alpha. Adjacent 24fps frames still
    // differ visibly; this dissolve is what turns the per-frame step into
    // fluid motion.
    const i0 = Math.floor(frameFloat);
    const i1 = Math.min(i0 + 1, transition.frames.length - 1);
    const mix = frameFloat - i0;
    const e0 = getCached(transition, i0);
    const e1 = i1 !== i0 ? getCached(transition, i1) : null;
    if (e0 && e1 && mix > 0.01 && mix < 0.99) {
      e0.lastUsed = e1.lastUsed = performance.now();
      drawImageCover(e0.img);
      blitCover(e1.img, mix);
      return;
    }
    const exact = mix >= 0.5 && e1 ? e1 : (e0 || e1);
    const entry = exact || nearestCached(transition, frameIndex);
    if (entry) {
      entry.lastUsed = performance.now();
      drawImageCover(entry.img);
      return;
    }
    loadStill(state.fallbackScene).then((img) => { if (img) drawImageCover(img); });
  }

  function getCached(transition, index) {
    const url = transition.frames[index];
    return url ? state.cache.get(url) : undefined;
  }

  function nearestCached(transition, frameIndex) {
    let best = null;
    let bestDistance = Infinity;
    for (const entry of state.cache.values()) {
      if (entry.transitionId !== transition.id) continue;
      const distance = Math.abs(entry.index - frameIndex);
      if (distance < bestDistance) { best = entry; bestDistance = distance; }
    }
    return best;
  }

  function loadStill(sceneIndex) {
    const scene = scenes[sceneIndex];
    const url = scene && stillUrl(scene);
    if (!url) return Promise.resolve(null);
    if (state.stills.has(url)) return state.stills.get(url);
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    state.stills.set(url, promise);
    return promise;
  }

  function canvasSize() {
    // The frames are 720p; a 2x buffer adds zero detail but doubles the blend
    // pass's fill cost on hidpi screens. 1.5 is visually identical here.
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    // Cached viewport size (see measure()) — no rect/getComputedStyle reads in
    // the draw path, and the canvas buffer stays stable through URL-bar resizes.
    const cssW = state.viewW || window.innerWidth;
    const cssH = state.viewH || window.innerHeight;
    const pixelW = Math.max(1, Math.round(cssW * dpr));
    const pixelH = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }
    return { pixelW, pixelH, cssH };
  }

  function coverRect(img, pixelW, pixelH, cssH) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(pixelW / iw, pixelH / ih);
    const sw = pixelW / scale;
    const sh = pixelH / scale;
    const sx = (iw - sw) / 2;
    // Ease the crop point down as the footer reveals instead of snapping from
    // 0.42 to 1 on the first revealed pixel (which read as a vertical jump).
    const t = clamp(state.footerReveal / (cssH * 0.35), 0, 1);
    const alignY = 0.42 + 0.58 * (t * t * (3 - 2 * t));
    const sy = Math.max(0, (ih - sh) * alignY);
    return { sx, sy, sw, sh };
  }

  // Base pass: opaque cover draw (fills every pixel — no clear needed).
  function drawImageCover(img) {
    if (!img || !ctx) return;
    const { pixelW, pixelH, cssH } = canvasSize();
    const r = coverRect(img, pixelW, pixelH, cssH);
    ctx.globalAlpha = 1;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, pixelW, pixelH);
    if (state.active) {
      container.dataset.swSequence = label;
      container.classList.add('sw-has-sequence');
    }
  }

  // Blend pass: draws a second frame over the base at the given alpha.
  function blitCover(img, alpha) {
    if (!img || !ctx) return;
    const { pixelW, pixelH, cssH } = canvasSize();
    const r = coverRect(img, pixelW, pixelH, cssH);
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, pixelW, pixelH);
    ctx.globalAlpha = 1;
  }

  function layout() {
    if (!canRun()) { disable(); return; }
    init();
    measure();
    if (!state.active) return;
    if (state.current) scheduleRender();
    clearTimeout(state.resizeRaf);
    state.resizeRaf = setTimeout(() => { if (state.ScrollTrigger) state.ScrollTrigger.refresh(); }, 80);
  }

  function destroyTriggers() {
    state.triggers.forEach((trigger) => trigger.kill());
    state.triggers = [];
  }

  function disable() {
    state.active = false;
    if (container.dataset.swSequence === label) {
      container.classList.remove('sw-has-sequence');
      delete container.dataset.swSequence;
    }
    destroyTriggers();
    cancelAnimationFrame(state.renderRaf);
    cancelAnimationFrame(state.animRaf);
    state.animRaf = 0;
    state.current = null;
  }

  function destroy() {
    state.generation += 1;
    if (state.normalized && state.ScrollTrigger) {
      state.ScrollTrigger.normalizeScroll(false);
      state.normalized = false;
    }
    disable();
    clearTimeout(state.resizeRaf);
    state.pending.forEach((img) => { img.onload = null; img.onerror = null; img.src = ''; });
    state.pending.clear();
    state.cache.clear();
    state.stills.clear();
  }

  function handleMediaResize(footerRevealPx) {
    if (typeof footerRevealPx === 'number') state.footerReveal = footerRevealPx;
    if (state.active && state.current) scheduleRender();
  }

  return { get active() { return state.active; }, layout, handleBreakpointChange, handleMediaResize, destroy };
}

function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97];
  for (let k = 0; k < 20; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.3) % 100) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const dur = 14 + (seeds[(k * 7) % seeds.length] % 22);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(seeds[(k * 2) % seeds.length] % dur)) + 's';
    host.appendChild(s);
  }
}

function injectCSS() {
  if (document.getElementById('sw-css')) return;
  const css = `
  .sw-root{--sw-bg:#F5EDE0;--sw-ink:#241d2b;--sw-ink-soft:#6a6072;--sw-accent:#8a7bb5;
    --sw-font-display:ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;
    --sw-font-body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;
    color:var(--sw-ink);font-family:var(--sw-font-body);}
  html,body{margin:0;background:var(--sw-bg,#F5EDE0);overflow-x:hidden;overscroll-behavior-y:none;}
  .sw-sky{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--sw-bg);}
  .sw-sky__grad{position:absolute;inset:-10%;background:linear-gradient(178deg,color-mix(in srgb,var(--sw-accent) 12%,var(--sw-bg)) 0%,var(--sw-bg) 55%,color-mix(in srgb,var(--sw-accent) 6%,var(--sw-bg)) 100%);}
  .sw-sky__glow{position:absolute;inset:0;background:radial-gradient(60% 42% at 74% 16%,color-mix(in srgb,var(--sw-accent) 22%,transparent),transparent 70%),radial-gradient(46% 34% at 50% 50%,color-mix(in srgb,#fff 45%,transparent),transparent 70%);}
  .sw-particles{position:absolute;inset:-6% -2%;will-change:transform;}
  .sw-pt{position:absolute;width:13px;height:13px;transform:scale(var(--sw-sc,1));opacity:0;animation:sw-drift linear infinite;}
  .sw-pt::before{content:"";position:absolute;inset:0;border-radius:50%;}
  .sw-pt--dot::before{background:radial-gradient(circle at 34% 30%,color-mix(in srgb,var(--sw-accent) 60%,#000),#000 82%);}
  .sw-pt--ring::before{background:transparent;border:2px solid color-mix(in srgb,var(--sw-accent) 55%,transparent);}
  @keyframes sw-drift{0%{opacity:0;transform:scale(var(--sw-sc)) translate(0,12vh) rotate(0)}12%{opacity:.5}88%{opacity:.45}100%{opacity:0;transform:scale(var(--sw-sc)) translate(4vw,-22vh) rotate(210deg)}}
  .sw-scrollbar{position:fixed;top:0;left:0;right:0;height:3px;z-index:60;background:color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-scrollbar span{display:block;height:100%;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--sw-accent);}
  .sw-topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(14px,2.4vw,26px) clamp(18px,5vw,64px);}
  .sw-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--sw-ink);}
  .sw-brand__mark{width:24px;height:28px;border-radius:7px 7px 10px 10px;background:linear-gradient(160deg,var(--sw-accent),color-mix(in srgb,var(--sw-accent) 60%,#000));box-shadow:0 6px 14px color-mix(in srgb,var(--sw-accent) 40%,transparent);}
  .sw-brand__name{font-family:var(--sw-font-display);font-weight:700;font-size:1.1rem;}
  .sw-nav{display:flex;gap:4px;padding:5px;background:color-mix(in srgb,#fff 55%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);border-radius:999px;}
  .sw-nav__item{font:inherit;font-size:.82rem;color:var(--sw-ink-soft);border:0;background:transparent;cursor:pointer;padding:7px 14px;border-radius:999px;transition:color .25s,background .25s;}
  .sw-nav__item:hover{color:var(--sw-ink);} .sw-nav__item.is-active{color:#fff;background:var(--sw-accent);}
  .sw-topcta{text-decoration:none;font-weight:600;font-size:.9rem;color:#fff;background:var(--sw-ink);padding:10px 20px;border-radius:999px;white-space:nowrap;}
  .sw-stage{position:fixed;inset:0;z-index:10;pointer-events:none;overflow:hidden;}
  .sw-sequence-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:140;display:none;pointer-events:none;}
  /* Paint the media layers at the LARGEST viewport height (browser bars
     collapsed) and let the stage clip them: when a mobile browser bar slides
     away it uncovers already-painted pixels instead of stretching the canvas
     or forcing a re-layout mid-scroll. */
  @supports (height: 100lvh){
    .sw-sequence-canvas,.sw-scene{height:100lvh;bottom:auto;}
  }
  .sw-root.sw-has-sequence .sw-sequence-canvas{display:block;}
  .sw-root.sw-has-sequence .sw-scene{opacity:0!important;}
  .sw-scene{position:absolute;inset:0;opacity:0;overflow:hidden;will-change:opacity;}
  .sw-scene__video,.sw-scene__still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
  .sw-scene__still{will-change:transform;} .sw-scene.has-clip .sw-scene__still{opacity:0;} .sw-scene__video{z-index:1;}
  .sw-copylayer{position:fixed;inset:0;z-index:20;pointer-events:none;}
  .sw-copylayer::before{content:"";position:absolute;inset:0;width:min(58vw,780px);background:linear-gradient(90deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
  .sw-copy{position:absolute;left:clamp(18px,5vw,64px);top:50%;transform:translateY(-50%);width:min(42vw,460px);opacity:0;will-change:opacity,transform;}
  .sw-copy__num{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.12em;color:var(--sw-ink-soft);}
  .sw-copy__eyebrow{display:block;margin-top:18px;font-family:var(--sw-font-display);font-weight:700;font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--sw-accent);}
  .sw-copy__title{font-family:var(--sw-font-display);font-weight:700;color:var(--sw-ink);font-size:clamp(2rem,4.4vw,3.5rem);line-height:1.03;margin:12px 0 0;letter-spacing:-.01em;text-shadow:0 2px 20px color-mix(in srgb,var(--sw-bg) 70%,transparent);}
  .sw-copy__body{margin-top:18px;font-size:clamp(1rem,1.25vw,1.14rem);line-height:1.55;color:color-mix(in srgb,var(--sw-ink) 78%,var(--sw-ink-soft));max-width:40ch;text-shadow:0 1px 12px color-mix(in srgb,var(--sw-bg) 90%,transparent);}
  .sw-copy__tags{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;}
  .sw-copy__tags li{font-size:.82rem;font-weight:600;color:color-mix(in srgb,var(--sw-accent) 70%,#000);padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--sw-accent) 14%,#fff);border:1px solid color-mix(in srgb,var(--sw-accent) 30%,transparent);}
  .sw-copy__cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;pointer-events:auto;}
  .sw-btn{text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 24px;border-radius:999px;transition:transform .2s;}
  .sw-btn--primary{color:#fff;background:var(--sw-ink);} .sw-btn--primary:hover{transform:translateY(-2px);}
  .sw-btn--ghost{color:var(--sw-ink);border:1.5px solid color-mix(in srgb,var(--sw-ink) 25%,transparent);} .sw-btn--ghost:hover{transform:translateY(-2px);}
  .sw-route{position:fixed;right:clamp(14px,2.4vw,30px);top:50%;z-index:40;transform:translateY(-50%);display:flex;flex-direction:column;gap:22px;padding:18px 10px;}
  .sw-route::before{content:"";position:absolute;left:50%;top:22px;bottom:22px;width:2px;transform:translateX(-50%);background:var(--sw-accent);opacity:.28;}
  .sw-route__dot{position:relative;border:0;background:transparent;cursor:pointer;width:14px;height:14px;display:grid;place-items:center;}
  .sw-route__dot i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--sw-accent) 40%,transparent);transition:transform .3s,background .3s,box-shadow .3s;}
  .sw-route__dot:hover i{transform:scale(1.25);background:var(--sw-accent);}
  .sw-route__dot.is-active i{background:var(--sw-accent);transform:scale(1.4);box-shadow:0 0 0 5px color-mix(in srgb,var(--sw-accent) 22%,transparent);}
  .sw-route__label{position:absolute;right:24px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;font-size:.78rem;font-weight:600;color:var(--sw-ink);background:color-mix(in srgb,#fff 85%,transparent);backdrop-filter:blur(6px);padding:5px 11px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;border:1px solid color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-route__dot:hover .sw-route__label,.sw-route__dot.is-active .sw-route__label{opacity:1;transform:translateY(-50%) translateX(0);}
  .sw-hint{position:fixed;left:50%;bottom:26px;z-index:30;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft);transition:opacity .3s;}
  .sw-hint i{width:22px;height:34px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sw-ink) 28%,transparent);position:relative;}
  .sw-hint i::after{content:"";position:absolute;left:50%;top:7px;width:4px;height:7px;border-radius:2px;background:var(--sw-accent);transform:translateX(-50%);animation:sw-wheel 1.7s ease-in-out infinite;}
  @keyframes sw-wheel{0%{opacity:0;top:6px}40%{opacity:1}100%{opacity:0;top:17px}}
  .sw-track{position:relative;z-index:1;width:100%;pointer-events:none;}
  @media (max-width:860px){
    .sw-nav{display:none;}
    .sw-copylayer::before{width:100%;height:60%;top:auto;bottom:0;background:linear-gradient(0deg,var(--sw-bg) 8%,color-mix(in srgb,var(--sw-bg) 70%,transparent) 46%,transparent 100%);}
    /* Anchor copy to the bottom, clear of the home indicator / collapsing URL bar.
       dvh + env() are progressive: browsers that lack them keep the vh fallback line. */
    .sw-copy{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
    .sw-copy{bottom:calc(clamp(56px,12dvh,110px) + env(safe-area-inset-bottom));}
    .sw-copy__title{font-size:clamp(1.9rem,7.5vw,2.7rem);}
    .sw-copy__body{max-width:none;font-size:clamp(.98rem,3.6vw,1.1rem);} .sw-scene__video,.sw-scene__still{object-position:center 46%;}
    .sw-hint{bottom:calc(20px + env(safe-area-inset-bottom));}
    .sw-route{gap:16px;right:6px;} .sw-route__label{display:none;}
  }
  /* Portrait phones crop a 16:9 clip hard; keep the framing centred so the focal
     subject (which the camera dives toward) stays in view. */
  @media (max-width:860px) and (orientation:portrait){
    .sw-scene__video,.sw-scene__still{object-position:center 44%;}
  }
  /* Touch: give the route dots a finger-sized hit area without growing the visible dot. */
  @media (hover:none) and (pointer:coarse){
    .sw-route{padding:14px 6px;}
    .sw-route__dot{width:28px;height:28px;}
    .sw-btn{padding:15px 26px;}
  }
  @media (prefers-reduced-motion:reduce){ .sw-hint i::after{animation:none;} .sw-pt{display:none;} }
  `;
  // Wrap in a cascade layer so the page's own theme tokens (unlayered
  // :root / .sw-root { --sw-bg / --sw-ink / --sw-accent … }) always win over
  // these defaults, regardless of injection order. Enables clean dark themes.
  const style = document.createElement('style'); style.id = 'sw-css';
  style.textContent = '@layer sw {\n' + css + '\n}';
  document.head.appendChild(style);
}

// Expose for module + global use.
if (typeof module !== 'undefined' && module.exports) module.exports = { mountScrollWorld };
if (typeof window !== 'undefined') window.mountScrollWorld = mountScrollWorld;

