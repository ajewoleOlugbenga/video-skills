import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme, useUnit } from "../theme";

export type Line = { start: number; frames: number; text: string };

// Split a spoken line into short caption chunks (≤ 7 words, preferring punctuation breaks),
// each timed by its share of the words.
const chunk = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    const punct = /[.,!?;:]$/.test(w);
    if (cur.length >= 7 || (punct && cur.length >= 3)) { out.push(cur); cur = []; }
  }
  if (cur.length) {
    if (cur.length < 3 && out.length) out[out.length - 1].push(...cur); else out.push(cur);
  }
  return out;
};

export const Subtitles: React.FC<{ lines: Line[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const { font } = useTheme();
  const portrait = height > width * 1.2;

  const line = lines.find((l) => frame >= l.start && frame < l.start + l.frames + 6);
  if (!line) return null;
  const chunks = chunk(line.text);
  const total = chunks.reduce((n, c) => n + c.length, 0);
  let acc = 0;
  let text = chunks[chunks.length - 1].join(" ");
  for (const c of chunks) {
    const end = line.start + (line.frames * (acc + c.length)) / total;
    if (frame < end) { text = c.join(" "); break; }
    acc += c.length;
  }
  const fade = interpolate(frame, [line.start, line.start + 4, line.start + line.frames + 2, line.start + line.frames + 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0,
        // 9:16: above the platform caption/buttons area. 16:9: near the bottom edge.
        bottom: (portrait ? 450 : 48) * u,
        display: "flex", justifyContent: "center", opacity: fade, pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: width * (portrait ? 0.86 : 0.7),
          padding: `${12 * u}px ${26 * u}px`,
          borderRadius: 16 * u,
          background: "rgba(0,0,0,0.72)",
          color: "#fff",
          fontFamily: font,
          fontWeight: 600,
          fontSize: (portrait ? 44 : 40) * u,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
};
