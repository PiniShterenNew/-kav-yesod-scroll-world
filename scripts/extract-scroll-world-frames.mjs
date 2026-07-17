import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
// 24 matches the source renders 1:1 — every source frame ships, and the
// renderer's temporal blending fills the sub-frame remainder. Override per
// run with a second CLI arg (e.g. `node … desktop 12`) for lighter builds.
const fps = Number(process.argv[3] || 24);

const sharedIds = [
  "01-opening-to-planning",
  "02-planning-to-foundations",
  "03-foundations-to-structure",
  "04-structure-to-systems",
  "05-systems-to-finishes",
  "06-finishes-to-handover"
];

const targets = {
  desktop: {
    width: 1280,
    height: 720,
    videoDir: path.join(root, "public", "assets", "scroll-world", "video", "desktop"),
    framesRoot: path.join(root, "public", "assets", "scroll-world", "frames", "desktop"),
    transitions: sharedIds.map((id) => [id, id + "-v1.mp4"])
  },
  mobile: {
    width: 720,
    height: 1280,
    videoDir: path.join(root, "public", "assets", "scroll-world", "video", "mobile"),
    framesRoot: path.join(root, "public", "assets", "scroll-world", "frames", "mobile"),
    transitions: sharedIds.map((id) => [id, id + "-mobile-v1.mp4"])
  }
};

const requested = process.argv[2] || "desktop";
const target = targets[requested];
if (!target) throw new Error('Unknown target "' + requested + '". Use desktop or mobile.');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(command + " failed:\n" + (result.stderr || result.stdout));
  }
  return result.stdout;
}

function probe(file, expected) {
  const json = run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,avg_frame_rate,r_frame_rate",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    file
  ]);
  const data = JSON.parse(json);
  const stream = data.streams?.[0];
  if (!stream) throw new Error("No video stream found in " + path.basename(file));
  const duration = Number(data.format?.duration);
  if (!Number.isFinite(duration)) throw new Error("No readable duration for " + path.basename(file));
  if (stream.width !== expected.width || stream.height !== expected.height) {
    throw new Error(path.basename(file) + " is " + stream.width + "x" + stream.height + ", expected " + expected.width + "x" + expected.height);
  }
  if (Math.abs(duration - 5) > 0.35) {
    throw new Error(path.basename(file) + " duration is not approximately 5 seconds (" + duration + "s)");
  }
  return {
    width: stream.width,
    height: stream.height,
    frameRate: stream.avg_frame_rate || stream.r_frame_rate,
    duration
  };
}

function cleanGeneratedFrames(dir) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    if (/^frame-\d{4}\.webp$/u.test(name)) {
      rmSync(path.join(dir, name), { force: true });
    }
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  target: requested,
  fps,
  width: target.width,
  height: target.height,
  transitions: []
};

for (const [id, sourceVideo] of target.transitions) {
  const sourcePath = path.join(target.videoDir, sourceVideo);
  if (!existsSync(sourcePath)) throw new Error("Missing required source video: " + sourceVideo);
  const properties = probe(sourcePath, target);
  const outDir = path.join(target.framesRoot, id);
  cleanGeneratedFrames(outDir);

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    sourcePath,
    "-an",
    "-vf",
    "fps=" + fps + ",scale=" + target.width + ":" + target.height + ":flags=lanczos",
    "-c:v",
    "libwebp",
    "-quality",
    "76",
    "-compression_level",
    "6",
    path.join(outDir, "frame-%04d.webp")
  ]);

  const frames = readdirSync(outDir)
    .filter((name) => /^frame-\d{4}\.webp$/u.test(name))
    .sort();

  if (!frames.length) throw new Error("No frames generated for " + id);

  manifest.transitions.push({
    id,
    sourceVideo,
    source: {
      width: properties.width,
      height: properties.height,
      frameRate: properties.frameRate,
      duration: Number(properties.duration.toFixed(6))
    },
    fps,
    width: target.width,
    height: target.height,
    frameCount: frames.length,
    bytes: frames.reduce((sum, name) => sum + statSync(path.join(outDir, name)).size, 0),
    frames: frames.map((name) => "/assets/scroll-world/frames/" + requested + "/" + id + "/" + name)
  });

  console.log(requested + "/" + id + ": " + properties.width + "x" + properties.height + " " + properties.frameRate + " " + properties.duration.toFixed(3) + "s -> " + frames.length + " frames");
}

mkdirSync(target.framesRoot, { recursive: true });
writeFileSync(path.join(target.framesRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest: " + path.relative(root, path.join(target.framesRoot, "manifest.json")));
