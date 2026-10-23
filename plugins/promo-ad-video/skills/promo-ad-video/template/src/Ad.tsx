import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Brief, Scene } from "./types";
import { ThemeProvider } from "./theme";
import { Background, BrandChip } from "./components/Frame";
import { Benefits, Cta, Hook, Price, Problem, Product, Stat, Testimonial } from "./scenes/Scenes";

// Default scene lengths in seconds (override per scene with "seconds").
export const sceneFrames = (s: Scene, fps: number) => {
  const base: Record<Scene["type"], number> = {
    hook: 2.4,
    problem: 1.6 + 0.6 * ("lines" in s ? s.lines.length : 0),
    product: 3.2,
    benefits: 1.2 + 0.75 * ("items" in s ? s.items.length : 0),
    stat: 2.6,
    price: 3.2,
    testimonial: 4.2,
    cta: 4.5,
  };
  return Math.round((s.seconds ?? base[s.type]) * fps);
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
};

export const Ad: React.FC<Brief> = (brief) => {
  const { fps, durationInFrames } = useVideoConfig();
  const audio = brief.audio ?? {};
  const music = audio.music === false ? null : audio.music ?? "sfx/starter-beat.mp3";
  const musicVol = audio.musicVolume ?? (audio.voiceover ? 0.12 : 0.35);

  let from = 0;
  return (
    <ThemeProvider brief={brief}>
      <AbsoluteFill>
        <Background />
        {brief.scenes.map((scene, i) => {
          const d = sceneFrames(scene, fps);
          const Comp = SCENES[scene.type];
          const el = (
            <Sequence key={i} from={from} durationInFrames={d} name={`${i + 1}. ${scene.type}`}>
              <Comp scene={scene} duration={d} />
            </Sequence>
          );
          from += d;
          return Comp ? el : null;
        })}
        <BrandChip />
        {music && (
          <Audio
            src={staticFile(music)}
            volume={(f) =>
              musicVol *
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
