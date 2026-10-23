// Prints, for each scene in a brief, a frame number ~1.6s in (or near the end for short scenes).
// Also validates the brief and exits non-zero with a readable message if something is wrong.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const brief = JSON.parse(readFileSync(process.argv[2], "utf8"));
const fps = brief.fps ?? 30;
const TYPES = ["hook", "problem", "product", "benefits", "stat", "price", "testimonial", "cta", "intro", "feature", "montage"];
const errors = [];

const hex = /^#[0-9a-fA-F]{6}$/;
for (const k of ["background", "primary", "accent", "text"]) {
  if (!hex.test(brief.brand?.colors?.[k] ?? "")) errors.push(`brand.colors.${k} must be a 6-digit hex like #FF7A1A`);
}
if (brief.brand?.colors?.muted && !hex.test(brief.brand.colors.muted)) errors.push("brand.colors.muted must be 6-digit hex");
if (!Array.isArray(brief.scenes) || brief.scenes.length === 0) errors.push("scenes must be a non-empty array");

const base = (s) =>
  ({
    hook: 2.4,
    problem: 1.6 + 0.6 * (s.lines?.length ?? 0),
    product: 3.2,
    benefits: 1.2 + 0.75 * (s.items?.length ?? 0),
    stat: 2.6,
    price: 3.2,
    testimonial: 4.2,
    cta: 4.5,
    intro: s.media ? 4.2 : 3.4,
    feature: s.video ? (s.clipSeconds ?? 5) / (s.speed ?? 1) + 2.2 : 4.6,
    montage: 3.2,
  })[s.type];

let from = 0;
const frames = [];
(brief.scenes ?? []).forEach((s, i) => {
  if (!TYPES.includes(s.type)) errors.push(`scene ${i + 1}: unknown type "${s.type}"`);
  // every referenced file must exist in public/
  for (const f of [s.media, s.video, s.image, ...(Array.isArray(s.media) ? s.media : [])].filter((x) => typeof x === "string")) {
    if (!existsSync(join("public", f))) errors.push(`scene ${i + 1}: file not found: public/${f}`);
  }
  if (s.type === "feature" && !s.media && !s.video) errors.push(`scene ${i + 1}: feature needs "media" or "video"`);
  if (s.focus && [s.focus.x, s.focus.y, s.focus.w, s.focus.h].some((n) => typeof n !== "number" || n < 0 || n > 1)) errors.push(`scene ${i + 1}: focus values must be fractions 0-1`);
  let sec = s.seconds ?? base(s) ?? 3;
  // must match sceneFrames() in src/Ad.tsx: never shorter than the spoken line (0.25s lead + 0.45s tail)
  if (s.voice && s.voiceSeconds) sec = Math.max(sec, 0.25 + s.voiceSeconds + 0.45);
  if (s.voice && !existsSync(join("public", s.voice))) errors.push(`scene ${i + 1}: voice file missing, re-run scripts/voiceover.py`);
  if (s.say && !s.voice) console.error(`note: scene ${i + 1} has "say" but no voice yet (run scripts/voiceover.py)`);
  const d = Math.round(sec * fps);
  // app scenes: preview late in the scene, after the zoom/callout has landed
  const at = ["feature", "intro", "montage"].includes(s.type) ? Math.round(d * 0.75) : Math.round(1.6 * fps);
  frames.push(from + Math.min(at, d - 12));
  from += d;
});

if (errors.length) {
  console.error("Brief has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.error(`OK: ${brief.scenes.length} scenes, ${(from / fps).toFixed(1)}s total`);
console.log(frames.join(" "));
