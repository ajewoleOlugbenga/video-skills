import React from "react";
import { Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import type { Focus, Scene } from "../types";
import { Sfx, useTheme, useUnit } from "../theme";
import { Words } from "../components/Words";
import { Label, SceneWrap } from "../components/Frame";

type P<T extends Scene["type"]> = { scene: Extract<Scene, { type: T }>; duration: number };

const useSpringAt = (delay: number, config = { damping: 15, stiffness: 140 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};
const useLandscape = () => {
  const { width, height } = useVideoConfig();
  return width > height * 1.2;
};

// ---------- Device frames ----------
const BrowserFrame: React.FC<{ w: number; h: number; url?: string; children: React.ReactNode }> = ({ w, h, url, children }) => {
  const u = useUnit();
  const { c, font } = useTheme();
  const bar = 44 * u;
  return (
    <div style={{ width: w, borderRadius: 18 * u, overflow: "hidden", background: "#ffffff",
      boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.35), 0 0 0 ${1.5 * u}px ${c.text}22` }}>
      <div style={{ height: bar, background: "#EDEEF1", display: "flex", alignItems: "center", gap: 9 * u, padding: `0 ${18 * u}px` }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => (
          <div key={col} style={{ width: 13 * u, height: 13 * u, borderRadius: 99, background: col }} />
        ))}
        {url && (
          <div style={{ marginLeft: 18 * u, flex: 1, maxWidth: w * 0.55, height: 26 * u, borderRadius: 8 * u, background: "#ffffff",
            fontFamily: font, fontSize: 15 * u, color: "#555", display: "flex", alignItems: "center", padding: `0 ${14 * u}px`,
            overflow: "hidden", whiteSpace: "nowrap" }}>
            {url}
          </div>
        )}
      </div>
      <div style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff" }}>{children}</div>
    </div>
  );
};

const PhoneFrame: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => {
  const u = useUnit();
  const bez = 16 * u;
  return (
    <div style={{ padding: bez, borderRadius: 64 * u, background: "#111", boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.4), inset 0 0 0 ${3 * u}px #333` }}>
      <div style={{ width: w, height: h, borderRadius: 50 * u, overflow: "hidden", position: "relative", background: "#fff" }}>
        {children}
        <div style={{ position: "absolute", top: 12 * u, left: "50%", width: 110 * u, height: 32 * u, marginLeft: -55 * u, borderRadius: 99, background: "#000" }} />
      </div>
    </div>
  );
};

// ---------- Camera: zoom into the focus region of a screenshot/clip ----------
const camera = (focus: Focus | undefined, maxZoom: number, W: number, H: number, p: number) => {
  if (!focus || focus.w <= 0 || focus.h <= 0) return { s: 1, tx: 0, ty: 0, fx: W / 2, fy: H / 2 };
  // zoom so the focus region fills ~80% of the screen, capped at maxZoom
  const sFull = Math.max(1, Math.min(maxZoom, 0.8 / focus.w, 0.8 / focus.h));
  const s = 1 + (sFull - 1) * p;
  const cx = focus.x + focus.w / 2, cy = focus.y + focus.h / 2;
  const lim = (n: number, L: number) => Math.max(-L, Math.min(L, n));
  const tx = lim((0.5 - cx) * W * s, ((s - 1) * W) / 2);
  const ty = lim((0.5 - cy) * H * s, ((s - 1) * H) / 2);
  return { s, tx, ty, fx: W / 2 + (cx - 0.5) * W * s + tx, fy: H / 2 + (cy - 0.5) * H * s + ty };
};

const Cursor: React.FC<{ x: number; y: number; click: number }> = ({ x, y, click }) => {
  const u = useUnit();
  return (
    <>
      {click > 0 && click < 1 && (
        <div style={{ position: "absolute", left: x - 30 * u, top: y - 30 * u, width: 60 * u, height: 60 * u, borderRadius: 99,
          background: "rgba(59,130,246,0.35)", transform: `scale(${0.4 + 1.8 * click})`, opacity: 1 - click }} />
      )}
      <svg width={40 * u} height={40 * u} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 5 * u, top: y - 3 * u,
        transform: `scale(${click > 0 && click < 0.3 ? 0.85 : 1})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }}>
        <path d="M4 2l16 9.5-7 1.8L9.5 21z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

// The device + media + camera + cursor + callout, as one block.
const Screen: React.FC<{ scene: Extract<Scene, { type: "feature" }>; duration: number; maxW: number; maxH: number }> = ({ scene, duration, maxW, maxH }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const { c, font } = useTheme();
  const kind = scene.frame ?? "browser";
  const srcW = scene.width ?? (kind === "phone" ? 390 : 1440);
  const srcH = scene.height ?? (kind === "phone" ? 844 : 900);
  const chrome = kind === "browser" ? 44 * u : kind === "phone" ? 32 * u : 0;
  const fit = Math.min(maxW / srcW, (maxH - chrome) / srcH);
  const W = srcW * fit, H = srcH * fit;

  const isVideo = !!scene.video;
  const speed = scene.speed ?? 1;
  const clipFrames = scene.clipSeconds ? (scene.clipSeconds * fps) / speed : duration * 0.62;
  // Stills: zoom in early and hold. Clips: play at full view, then zoom into the final state.
  const z0 = isVideo ? clipFrames + 4 : 18, z1 = isVideo ? clipFrames + 26 : 42;
  const p = interpolate(frame, [z0, z1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const cam = camera(scene.focus, scene.zoom ?? (kind === "phone" ? 1.6 : 2.2), W, H, p);

  // The final screenshot sits under the clip, so the frame never goes blank after the recording ends.
  const mediaStyle: React.CSSProperties = { position: "absolute", inset: 0, width: W, height: H, objectFit: "cover", objectPosition: "top" };
  const media = (
    <div style={{ position: "relative", width: W, height: H }}>
      {scene.media && <Img src={staticFile(scene.media)} style={mediaStyle} />}
      {isVideo && frame < clipFrames && <OffthreadVideo src={staticFile(scene.video!)} muted playbackRate={speed} style={mediaStyle} />}
    </div>
  );

  // cursor travels to the focus point during the zoom, then clicks (stills only; clips have their own cursor)
  const showCursor = !isVideo && !!scene.focus && scene.cursor !== false;
  const travel = interpolate(frame, [z0 - 4, z1 + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const curX = interpolate(travel, [0, 1], [W * 0.92, cam.fx]);
  const curY = interpolate(travel, [0, 1], [H * 1.05, cam.fy]);
  const click = interpolate(frame, [z1 + 6, z1 + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const call = spring({ frame: frame - (z1 + 10), fps, config: { damping: 12, stiffness: 170 } });
  const callAbove = cam.fy > H * 0.3;

  const content = (
    <>
      <div style={{ width: W, height: H, transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`, transformOrigin: "center center" }}>{media}</div>
      {showCursor && <Cursor x={curX} y={curY} click={click} />}
      {scene.callout && scene.focus && (
        <div style={{ position: "absolute", left: Math.max(16 * u, Math.min(W - 16 * u, cam.fx)), top: cam.fy + (callAbove ? -70 * u : 70 * u),
          transform: `translate(-50%, -50%) scale(${call})`, padding: `${12 * u}px ${24 * u}px`, borderRadius: 99, background: c.primary,
          color: c.onPrimary, fontFamily: font, fontWeight: 700, fontSize: 26 * u, whiteSpace: "nowrap", boxShadow: `0 ${8 * u}px ${24 * u}px rgba(0,0,0,.3)` }}>
          {scene.callout}
        </div>
      )}
    </>
  );

  if (kind === "phone") return <PhoneFrame w={W} h={H}>{content}</PhoneFrame>;
  if (kind === "none") return <div style={{ width: W, height: H, position: "relative", overflow: "hidden", borderRadius: 20 * u, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,.35)` }}>{content}</div>;
  return <BrowserFrame w={W} h={H} url={scene.url}>{content}</BrowserFrame>;
};

// FEATURE — one feature of the app, shown on screen with a title.
export const Feature: React.FC<P<"feature">> = ({ scene, duration }) => {
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const { c, font } = useTheme();
  const land = useLandscape();
  const enter = useSpringAt(0, { damping: 16, stiffness: 110 });
  const cap = useSpringAt(12);
  const phone = scene.frame === "phone";

  const text = (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 * u, alignItems: land ? "flex-start" : "center", maxWidth: land ? 560 * u : "100%" }}>
      {scene.step && <Label text={scene.step} />}
      <Words text={scene.title} size={land ? 72 : 76} align={land ? "left" : "center"} stagger={3} />
      {scene.caption && (
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 38 * u, color: c.muted, textAlign: land ? "left" : "center", lineHeight: 1.35,
          opacity: cap, transform: `translateY(${(1 - cap) * 20 * u}px)` }}>
          {scene.caption}
        </div>
      )}
    </div>
  );

  const maxW = land ? (phone ? 520 * u : width * 0.6) : width - (phone ? 320 : 100) * u;
  const maxH = land ? height * 0.74 : height * (phone ? 0.47 : 0.42);
  const screen = (
    <div style={{ transform: `translateY(${(1 - enter) * 300 * u}px) scale(${0.85 + 0.15 * enter})`, opacity: enter }}>
      <Screen scene={scene} duration={duration} maxW={maxW} maxH={maxH} />
    </div>
  );

  return (
    <SceneWrap duration={duration} gap={land ? 0 : 56}>
      <Sfx name="whoosh" />
      {scene.focus && !scene.video && <Sfx name="pop" at={50} volume={0.4} />}
      {land ? (
        <div style={{ display: "flex", alignItems: "center", gap: 70 * u, flexDirection: scene.flip ? "row-reverse" : "row", width: "100%", justifyContent: "center" }}>
          {text}
          {screen}
        </div>
      ) : (
        <>
          {text}
          {screen}
        </>
      )}
    </SceneWrap>
  );
};

// INTRO — "Meet <App>": logo, name, one-line pitch, optional tilted hero screenshot.
export const Intro: React.FC<P<"intro">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const { c, font, brief } = useTheme();
  const land = useLandscape();
  const logo = useSpringAt(4, { damping: 10, stiffness: 160 });
  const hero = useSpringAt(16, { damping: 18, stiffness: 90 });
  const name = scene.name ?? brief.brand.name;
  const heroW = land ? width * 0.42 : width * 0.86;
  return (
    <SceneWrap duration={duration} gap={land && scene.media ? 22 : 34}>
      <Sfx name="impact" volume={0.7} at={4} />
      <Label text={scene.label ?? "Meet"} />
      <div style={{ display: "flex", alignItems: "center", gap: 30 * u, transform: `scale(${logo})` }}>
        {brief.brand.logo && <Img src={staticFile(brief.brand.logo)} style={{ height: 120 * u, borderRadius: 24 * u }} />}
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: (name.length > 12 ? 100 : land && scene.media ? 116 : 140) * u, color: c.text, letterSpacing: -4 * u }}>{name}</div>
      </div>
      <Words text={scene.tagline} size={54} weight={500} delay={12} stagger={2} />
      {scene.media && (
        <div style={{ perspective: 1600 * u, marginTop: 20 * u }}>
          <Img src={staticFile(scene.media)} style={{ width: heroW, maxHeight: height * (land ? 0.32 : 0.3), objectFit: "cover", objectPosition: "top",
            borderRadius: 18 * u, boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,.45)`,
            transform: `rotateX(${interpolate(hero, [0, 1], [38, 14]) + Math.sin(frame / 30) * 1.5}deg) translateY(${(1 - hero) * 200 * u}px)`,
            opacity: hero }} />
        </div>
      )}
    </SceneWrap>
  );
};

// MONTAGE — several screens fanned out quickly: "and much more".
export const Montage: React.FC<P<"montage">> = ({ scene, duration }) => {
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const land = useLandscape();
  const n = scene.media.length;
  const cardW = land ? width * 0.36 : width * 0.62;
  return (
    <SceneWrap duration={duration} gap={60}>
      <Sfx name="whoosh" />
      <Words text={scene.title} size={land ? 76 : 80} />
      <div style={{ position: "relative", width: land ? width * 0.8 : width * 0.9, height: land ? height * 0.45 : height * 0.36 }}>
        {scene.media.map((m, i) => (
          <MontageCard key={i} src={m} i={i} n={n} cardW={cardW} land={land} u={u} />
        ))}
      </div>
    </SceneWrap>
  );
};
const MontageCard: React.FC<{ src: string; i: number; n: number; cardW: number; land: boolean; u: number }> = ({ src, i, n, cardW, land, u }) => {
  const s = useSpringAt(6 + i * 7, { damping: 13, stiffness: 140 });
  const mid = (n - 1) / 2;
  const off = i - mid;
  return (
    <>
      <Sfx name="pop" at={6 + i * 7} volume={0.35} />
      <Img src={staticFile(src)} style={{ position: "absolute", left: "50%", top: "50%", width: cardW, borderRadius: 16 * u,
        boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,.4)`, zIndex: 10 - Math.abs(Math.round(off)),
        transform: `translate(-50%, -50%) translate(${off * (land ? 300 : 150) * u * s}px, ${Math.abs(off) * 40 * u + (1 - s) * 500 * u}px) rotate(${off * 6 * s}deg) scale(${0.8 + 0.2 * s - Math.abs(off) * 0.06})`,
        opacity: s }} />
    </>
  );
};
