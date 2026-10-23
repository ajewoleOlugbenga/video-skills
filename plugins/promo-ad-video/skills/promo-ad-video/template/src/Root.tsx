import React from "react";
import { Composition, staticFile, continueRender, delayRender } from "remotion";
import { Ad, sceneFrames } from "./Ad";
import type { Brief } from "./types";
import example from "../briefs/example.json";

const DIMENSIONS: Record<string, [number, number]> = {
  "9:16": [1080, 1920],
  "4:5": [1080, 1350],
  "1:1": [1080, 1080],
  "16:9": [1920, 1080],
};

// Load bundled fonts so renders look identical on every machine.
const fontHandle = delayRender("fonts");
const faces = [
  ["Poppins", "Poppins-Regular.ttf", "400"],
  ["Poppins", "Poppins-Medium.ttf", "500"],
  ["Poppins", "Poppins-Bold.ttf", "700"],
  // Inter covers symbols Poppins lacks (e.g. the naira sign ₦)
  ["InterFallback", "Inter-Regular.otf", "400"],
  ["InterFallback", "Inter-Medium.otf", "500"],
  ["InterFallback", "Inter-Bold.otf", "700"],
] as const;
Promise.all(
  faces.map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight });
    return f.load().then((loaded) => document.fonts.add(loaded));
  })
)
  .then(() => continueRender(fontHandle))
  .catch(() => continueRender(fontHandle));

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Ad"
      component={Ad}
      defaultProps={example as Brief}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={300}
      calculateMetadata={({ props }) => {
        const fps = props.fps ?? 30;
        const [width, height] = DIMENSIONS[props.format ?? "9:16"] ?? DIMENSIONS["9:16"];
        const total = props.scenes.reduce((s, sc) => s + sceneFrames(sc, fps), 0);
        return { fps, width, height, durationInFrames: Math.max(total, fps) };
      }}
    />
  );
};
