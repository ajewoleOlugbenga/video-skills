import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useTheme, useUnit } from "../theme";

// Kinetic typography: words spring up one by one.
// Wrap words in *asterisks* to highlight them with a brand-colored marker.
export const Words: React.FC<{
  text: string;
  size: number;
  delay?: number;
  stagger?: number;
  weight?: number;
  color?: string;
  align?: "center" | "left";
  lineHeight?: number;
}> = ({ text, size, delay = 0, stagger = 3, weight = 700, color, align = "center", lineHeight = 1.12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const { c, font } = useTheme();

  const tokens: { w: string; hl: boolean }[] = [];
  let inHl = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw;
    const starts = w.startsWith("*");
    if (starts) { inHl = true; w = w.slice(1); }
    const ends = w.endsWith("*") || /\*[.,!?]$/.test(w);
    w = w.replace(/\*/g, "");
    tokens.push({ w, hl: inHl });
    if (ends) inHl = false;
  }

  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size * u,
        fontWeight: weight,
        lineHeight,
        color: color ?? c.text,
        textAlign: align,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        letterSpacing: -0.02 * size * u,
      }}
    >
      {tokens.map((t, i) => {
        const s = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
        const mark = spring({ frame: frame - delay - i * stagger - 6, fps, config: { damping: 20 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              position: "relative",
              margin: `0 ${0.14 * size * u}px`,
              opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${(1 - s) * 0.6 * size * u}px) scale(${0.85 + 0.15 * s})`,
              color: t.hl && mark > 0.35 ? c.onPrimary : undefined,
              zIndex: 1,
            }}
          >
            {t.hl && (
              <span
                style={{
                  position: "absolute",
                  // extend over the word gap when the next/previous word is also highlighted
                  left: (tokens[i - 1]?.hl ? -0.15 : -0.1) * size * u,
                  right: (tokens[i + 1]?.hl ? -0.15 : -0.1) * size * u,
                  top: "8%",
                  bottom: "2%",
                  background: c.primary,
                  borderRadius: 0.14 * size * u,
                  transform: `scaleX(${mark})`,
                  transformOrigin: "left center",
                  zIndex: -1,
                }}
              />
            )}
            {t.w}
          </span>
        );
      })}
    </div>
  );
};
