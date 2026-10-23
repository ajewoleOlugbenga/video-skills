import React, { createContext, useContext } from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Brief } from "./types";

type Theme = {
  brief: Brief;
  c: Required<Brief["brand"]["colors"]> & { onPrimary: string };
  font: string;
  sfx: boolean;
};

const Ctx = createContext<Theme | null>(null);

// Pick black or white text for best contrast on a given background.
export const readableOn = (hex: string) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#111111" : "#ffffff";
};

export const ThemeProvider: React.FC<{ brief: Brief; children: React.ReactNode }> = ({ brief, children }) => {
  const col = brief.brand.colors;
  const value: Theme = {
    brief,
    c: {
      ...col,
      muted: col.muted ?? col.text,
      onPrimary: readableOn(col.primary),
    } as Theme["c"],
    font: `${brief.brand.font ? `'${brief.brand.font}', ` : ""}Poppins, InterFallback, sans-serif`,
    sfx: brief.audio?.sfx !== false,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTheme = () => {
  const t = useContext(Ctx);
  if (!t) throw new Error("ThemeProvider missing");
  return t;
};

// Size unit: 1u = 1px on a 1080px-wide portrait frame. Scales for other formats.
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

export const Sfx: React.FC<{ name: "whoosh" | "pop" | "ding" | "impact"; at?: number; volume?: number }> = ({
  name,
  at = 0,
  volume = 0.6,
}) => {
  const { sfx } = useTheme();
  if (!sfx) return null;
  return (
    <Sequence from={at} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};
