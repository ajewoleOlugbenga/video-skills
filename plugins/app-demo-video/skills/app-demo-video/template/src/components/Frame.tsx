import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme, useUnit } from "../theme";

// Animated brand background: two soft color blobs drifting slowly + fine grid.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { c, brief } = useTheme();
  const strength = brief.brand.style === "soft" ? 0.22 : brief.brand.style === "dark-luxe" ? 0.18 : 0.38;
  const t = frame / 90;
  const blob = (color: string, x: number, y: number, r: number) => (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        opacity: strength,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: c.background, overflow: "hidden" }}>
      {blob(c.primary, width * (0.15 + 0.1 * Math.sin(t)), height * (0.22 + 0.06 * Math.cos(t * 0.8)), width * 0.75)}
      {blob(c.accent, width * (0.9 + 0.08 * Math.cos(t * 1.1)), height * (0.8 + 0.05 * Math.sin(t)), width * 0.7)}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${c.text}0d 1px, transparent 1px), linear-gradient(90deg, ${c.text}0d 1px, transparent 1px)`,
          backgroundSize: `${width / 12}px ${width / 12}px`,
          transform: `translateY(${(frame * 0.4) % (width / 12)}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Brand name / logo pinned near the top for the whole ad.
export const BrandChip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const u = useUnit();
  const { c, brief, font } = useTheme();
  const s = spring({ frame: frame - 4, fps, config: { damping: 18 } });
  const portrait = height > 1500;
  return (
    <div
      style={{
        position: "absolute",
        top: (portrait ? 150 : 50) * u,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${(1 - s) * -30 * u}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16 * u,
          padding: `${12 * u}px ${28 * u}px`,
          borderRadius: 999,
          background: `${c.text}14`,
          border: `${2 * u}px solid ${c.text}22`,
          fontFamily: font,
          fontWeight: 700,
          fontSize: 34 * u,
          color: c.text,
        }}
      >
        {brief.brand.logo ? (
          <Img src={staticFile(brief.brand.logo)} style={{ height: 52 * u, borderRadius: 10 * u }} />
        ) : (
          <div style={{ width: 18 * u, height: 18 * u, borderRadius: 999, background: c.primary }} />
        )}
        {brief.brand.name}
      </div>
    </div>
  );
};

// Wraps every scene: centers content in the platform-safe zone and animates the exit.
export const SceneWrap: React.FC<{ duration: number; children: React.ReactNode; gap?: number }> = ({
  duration,
  children,
  gap = 40,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const u = useUnit();
  const { subtitles } = useTheme();
  const exit = interpolate(frame, [duration - 9, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const portrait = height > 1500;
  return (
    <AbsoluteFill
      style={{
        // Instagram/TikTok UI covers ~14% top and ~22% bottom in 9:16
        paddingTop: (portrait ? 300 : 150) * u,
        paddingBottom: (portrait ? (subtitles ? 560 : 420) : subtitles ? 170 : 110) * u,
        paddingLeft: 80 * u,
        paddingRight: 80 * u,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: gap * u,
        opacity: 1 - exit,
        transform: `translateY(${-60 * u * exit}px) scale(${1 + 0.04 * exit})`,
        filter: `blur(${exit * 8}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Label: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const { c, font } = useTheme();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: 700,
        fontSize: 34 * u,
        letterSpacing: 6 * u,
        textTransform: "uppercase",
        color: c.accent,
        opacity: s,
        transform: `translateY(${(1 - s) * 20 * u}px)`,
      }}
    >
      {text}
    </div>
  );
};
