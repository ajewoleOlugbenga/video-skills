// Prints, for each scene in a brief, a frame number ~1.6s in (or near the end for short scenes).
// Also validates the brief and exits non-zero with a readable message if something is wrong.
import { readFileSync } from "node:fs";

const brief = JSON.parse(readFileSync(process.argv[2], "utf8"));
const fps = brief.fps ?? 30;
const TYPES = ["hook", "problem", "product", "benefits", "stat", "price", "testimonial", "cta"];
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
  })[s.type];

let from = 0;
const frames = [];
(brief.scenes ?? []).forEach((s, i) => {
  if (!TYPES.includes(s.type)) errors.push(`scene ${i + 1}: unknown type "${s.type}"`);
  const d = Math.round((s.seconds ?? base(s) ?? 3) * fps);
  frames.push(from + Math.min(Math.round(1.6 * fps), d - 12));
  from += d;
});

if (errors.length) {
  console.error("Brief has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.error(`OK: ${brief.scenes.length} scenes, ${(from / fps).toFixed(1)}s total`);
console.log(frames.join(" "));
