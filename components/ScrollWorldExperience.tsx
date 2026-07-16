"use client";

import { useEffect, useRef, useState } from "react";
import ContactPanel from "@/components/ContactPanel";
import { scrollWorldConfig } from "@/config/scroll-world-config";
import type { MountScrollWorld } from "@/types/scroll-world";

type Source = "header" | "final";

const pad = (n: number) => String(n).padStart(2, "0");

export default function ScrollWorldExperience() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeScene, setActiveScene] = useState("opening");

  const openPanel = (source: Source, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? null;
    setPanelOpen(true);
    document.body.dataset.contactSource = source;
  };

  const closePanel = () => {
    setPanelOpen(false);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;
    let cleanup: void | (() => void);

    import("@/lib/scroll-world.js").then((mod: { mountScrollWorld?: MountScrollWorld }) => {
      if (cancelled || !containerRef.current || containerRef.current.dataset.mounted === "true") return;
      containerRef.current.dataset.mounted = "true";
      cleanup = mod.mountScrollWorld?.(containerRef.current, scrollWorldConfig);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const syncActive = () => {
      setActiveScene(host.dataset.swScene || "opening");
    };

    const observer = new MutationObserver(syncActive);
    observer.observe(host, { attributes: true, attributeFilter: ["data-sw-scene"] });
    syncActive();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          footer.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href="#contact-demo"]');
      if (!link) return;
      event.preventDefault();
      openPanel("final", link);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The opening stays unnumbered — the NN/06 status appears only once a
  // numbered stage becomes active.
  const stageIndex = scrollWorldConfig.sections.findIndex((section) => section.id === activeScene);
  const activeStage = stageIndex >= 0 ? scrollWorldConfig.sections[stageIndex] : null;

  return (
    <>
      <header className="fixed-header" aria-label="ניווט ראשי">
        <a className="brand-link" href="#top" aria-label="קו יסוד - חזרה לראש העמוד">
          <img src="/brand/logo-full.svg" width="99" height="42" alt="קו יסוד" />
        </a>
        <button className="header-cta" type="button" onClick={(event) => openPanel("header", event.currentTarget)}>
          <span className="header-cta__desktop">מתחילים לתכנן</span>
          <span className="header-cta__mobile">דברו איתנו</span>
        </button>
      </header>

      <div ref={containerRef} className="scroll-world-host" aria-label="מסע בניית בית בגלילה" />

      <div className="mobile-stage-status" aria-live="polite">
        {activeStage && (
          <>
            <span>
              {pad(stageIndex + 1)}/{pad(scrollWorldConfig.sections.length)}
            </span>
            <strong>{activeStage.label}</strong>
          </>
        )}
      </div>

      <footer ref={footerRef} className="site-footer">
        <img src="/brand/logo-full.svg" width="89" height="38" alt="קו יסוד" />
        <p className="footer-concept">פרויקט קונספט</p>
        <p>קו יסוד · מהקרקע ועד המפתח</p>
        <p className="footer-credit">עיצוב ופיתוח: NorthSpark Studio</p>
        <a href="#top">חזרה להתחלה</a>
      </footer>

      <ContactPanel open={panelOpen} onClose={closePanel} />
    </>
  );
}
