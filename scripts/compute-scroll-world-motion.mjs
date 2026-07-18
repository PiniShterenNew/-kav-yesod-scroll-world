// Computes a per-transition "motion profile" and injects it into the frame
// manifests. motion[i] is the normalized cumulative visual change (0..1) from
// frame 0 up to frame i, measured as mean-absolute-difference on downscaled
// grayscale frames.
//
// The engine uses this to map scroll progress to CUMULATIVE MOTION instead of
// time: source-video speed lurches get stretched over more scroll and frozen
// stretches are passed quickly, so scrubbing feels uniform even when the
// renders' camera speed isn't.
//
// Requires sharp (dev-only): npm i -D sharp
// Run after (re)extracting frames:  node scripts/compute-scroll-world-motion.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sharp = (await import("sharp").catch(() => {
  console.error("sharp is required: npm i -D sharp");
  process.exit(1);
})).default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const W = 96, H = 54;

const gray = (p) => sharp(p).resize(W, H, { fit: "fill" }).grayscale().raw().toBuffer();
const mad = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
};

for (const target of ["desktop", "mobile"]) {
  const framesRoot = path.join(root, "public", "assets", "scroll-world", "frames", target);
  const manifestPath = path.join(framesRoot, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  for (const transition of manifest.transitions) {
    const dir = path.join(framesRoot, transition.id);
    const files = readdirSync(dir).filter((f) => /^frame-\d{4}\.webp$/u.test(f)).sort();
    const bufs = [];
    for (const f of files) bufs.push(await gray(path.join(dir, f)));
    const cum = [0];
    for (let i = 1; i < bufs.length; i++) cum.push(cum[i - 1] + mad(bufs[i - 1], bufs[i]));
    const total = cum[cum.length - 1] || 1;
    transition.motion = cum.map((v) => +(v / total).toFixed(4));
    console.log(target + "/" + transition.id + ": motion profile over " + files.length + " frames");
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("updated " + path.relative(root, manifestPath));
}
