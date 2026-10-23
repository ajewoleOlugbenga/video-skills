import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Brief, Scene } from "./types";
import { ThemeProvider } from "./theme";
import { Background, BrandChip } from "./components/Frame";
import { Subtitles, type Line } from "./components/Subtitles";
import { Benefits, Cta, Hook, Price, Problem, Product, Stat, Testimonial } from "./scenes/Scenes";
import { Feature, Intro, Montage } from "./scenes/AppScenes";

// Voice timing: each spoken line starts VOICE_LEAD s into its scene and the scene holds VOICE_TAIL s after it.
// Keep in sync with scripts/scene-frames.mjs.
export const VOICE_LEAD = 0.25;
export const VOICE_TAIL = 0.45;

const baseSeconds = (s: Scene): number => {
  const a = s as any;
  switch (s.type) {
    case "hook": return 2.4;
    case "problem": return 1.6 + 0.6 * a.lines.length;
    case "product": return 3.2;
    case "benefits": return 1.2 + 0.75 * a.items.length;
    case "stat": return 2.6;
    case "price": return 3.2;
    case "testimonial": return 4.2;
    case "cta": return 4.5;
    case "intro": return a.media ? 4.2 : 3.4;
    // clips: play the recording, then hold ~2s on the zoomed final state
    case "feature": return a.video ? (a.clipSeconds ?? 5) / (a.speed ?? 1) + 2.2 : 4.6;
    case "montage": return 3.2;
  }
  return 3;
};

// Default scene length, overridden by "seconds", and never shorter than its spoken line.
export const sceneFrames = (s: Scene, fps: number) => {
  let sec = s.seconds ?? baseSeconds(s);
  if (s.voice && s.voiceSeconds) sec = Math.max(sec, VOICE_LEAD + s.voiceSeconds + VOICE_TAIL);
  return Math.round(sec * fps);
};

const SCENES: Record<Scene["type"], React.FC<{ scene: any; duration: number }>> = {
  hook: Hook,
  problem: Problem,
  product: Product,
  benefits: Benefits,
  stat: Stat,
  price: Price,
  testimonial: Testimonial,
  cta: Cta,
  intro: Intro,
  feature: Feature,
  montage: Montage,
};

export const Ad: React.FC<Brief> = (brief) => {
  const { fps, durationInFrames } = useVideoConfig();
  const audio = brief.audio ?? {};
  const music = audio.music === false ? null : audio.music ?? "sfx/starter-beat.mp3";
  const hasVoice = !!audio.voiceover || brief.scenes.some((s) => s.voice);
  const musicVol = audio.musicVolume ?? (hasVoice ? 0.3 : 0.35);
  const lead = Math.round(VOICE_LEAD * fps);

  // Lay out scenes and collect spoken lines (for ducking + subtitles).
  let at = 0;
  const placed = brief.scenes.map((scene) => {
    const d = sceneFrames(scene, fps);
    const p = { scene, from: at, d };
    at += d;
    return p;
  });
  const lines: Line[] = placed
    .filter((p) => p.scene.voice && p.scene.voiceSeconds)
    .map((p) => ({ start: p.from + lead, frames: Math.round(p.scene.voiceSeconds! * fps), text: (p.scene.say ?? "").replace(/\*/g, "") }));

  // Music dips to ~30% while someone is speaking, with short ramps.
  const duck = (f: number) =>
    lines.reduce(
      (m, l) =>
        Math.max(m, interpolate(f, [l.start - 6, l.start, l.start + l.frames, l.start + l.frames + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
      0
    );
  const showSubs = lines.length > 0 && audio.subtitles !== false;

  return (
    <ThemeProvider brief={brief} subtitles={showSubs}>
      <AbsoluteFill>
        <Background />
        {placed.map(({ scene, from, d }, i) => {
          const Comp = SCENES[scene.type];
          if (!Comp) return null;
          return (
            <Sequence key={i} from={from} durationInFrames={d} name={`${i + 1}. ${scene.type}`}>
              <Comp scene={scene} duration={d} />
              {scene.voice && (
                <Sequence from={lead} layout="none">
                  <Audio src={staticFile(scene.voice)} volume={1} />
                </Sequence>
              )}
            </Sequence>
          );
        })}
        <BrandChip />
        {showSubs && <Subtitles lines={lines} />}
        {music && (
          <Audio
            src={staticFile(music)}
            volume={(f) =>
              musicVol *
              (1 - 0.7 * duck(f)) *
              interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        )}
        {audio.voiceover && <Audio src={staticFile(audio.voiceover)} volume={1} />}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
