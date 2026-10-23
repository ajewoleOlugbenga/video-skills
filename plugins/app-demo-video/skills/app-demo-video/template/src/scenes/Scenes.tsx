import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types";
import { Sfx, readableOn, useTheme, useUnit } from "../theme";
import { Words } from "../components/Words";
import { Icon } from "../components/Icon";
import { Label, SceneWrap } from "../components/Frame";

type P<T extends Scene["type"]> = { scene: Extract<Scene, { type: T }>; duration: number };

const useSpring = (delay: number, config = { damping: 14, stiffness: 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// 1. HOOK — big punchy line with a punch-in zoom. First 2 seconds decide if people keep watching.
export const Hook: React.FC<P<"hook">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const { c, font } = useTheme();
  const punch = useSpring(0, { damping: 12, stiffness: 120 });
  const drift = interpolate(frame, [0, duration], [1, 1.06]);
  const sub = useSpring(14);
  return (
    <SceneWrap duration={duration}>
      <Sfx name="impact" volume={0.8} />
      <div style={{ transform: `scale(${(1.35 - 0.35 * punch) * drift})` }}>
        <Words text={scene.text} size={118} stagger={4} />
      </div>
      {scene.sub && (
        <div
          style={{
            fontFamily: font, fontWeight: 500, fontSize: 46 * u, color: c.muted, textAlign: "center",
            opacity: sub, transform: `translateY(${(1 - sub) * 30 * u}px)`,
          }}
        >
          {scene.sub}
        </div>
      )}
    </SceneWrap>
  );
};

// 2. PROBLEM — the pain points, each one crossed out.
export const Problem: React.FC<P<"problem">> = ({ scene, duration }) => {
  const u = useUnit();
  const { c, font } = useTheme();
  return (
    <SceneWrap duration={duration} gap={34}>
      <Sfx name="whoosh" />
      {scene.title && <Words text={scene.title} size={78} stagger={3} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 * u, width: "100%" }}>
        {scene.lines.map((line, i) => (
          <ProblemLine key={i} text={line} delay={10 + i * 14} />
        ))}
      </div>
    </SceneWrap>
  );

  function ProblemLine({ text, delay }: { text: string; delay: number }) {
    const s = useSpring(delay);
    const strike = useSpring(delay + 14, { damping: 22, stiffness: 120 });
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: 24 * u, padding: `${24 * u}px ${30 * u}px`,
          borderRadius: 28 * u, background: `${c.text}10`, border: `${2 * u}px solid ${c.text}1a`,
          opacity: s, transform: `translateX(${(1 - s) * -80 * u}px)`,
        }}
      >
        <Sfx name="pop" at={delay} volume={0.45} />
        <div style={{ width: 64 * u, height: 64 * u, borderRadius: 999, background: "#ff4d4f", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="x" size={34 * u} color="#ffffff" stroke={3} />
        </div>
        <div style={{ position: "relative", fontFamily: font, fontWeight: 500, fontSize: 46 * u, color: c.text }}>
          {text}
          <div style={{ position: "absolute", left: 0, top: "52%", height: 5 * u, width: `${strike * 100}%`, background: "#ff4d4f", borderRadius: 4 }} />
        </div>
      </div>
    );
  }
};

// 3. PRODUCT — the reveal. Uses a product photo if provided, otherwise a branded badge.
export const Product: React.FC<P<"product">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const { c, font, brief } = useTheme();
  const s = useSpring(0, { damping: 13, stiffness: 110 });
  const badge = useSpring(16, { damping: 9, stiffness: 180 });
  const float = Math.sin(frame / 14) * 10 * u;
  const sub = useSpring(22);
  return (
    <SceneWrap duration={duration} gap={50}>
      <Sfx name="whoosh" />
      <div
        style={{
          position: "relative",
          transform: `translateY(${(1 - s) * 400 * u + float}px) rotate(${(1 - s) * -8}deg) scale(${0.7 + 0.3 * s})`,
        }}
      >
        {scene.image ? (
          <Img
            src={staticFile(scene.image)}
            style={{
              width: 620 * u, height: 620 * u, objectFit: "cover", borderRadius: 48 * u,
              boxShadow: `0 ${40 * u}px ${90 * u}px rgba(0,0,0,0.35)`, border: `${6 * u}px solid ${c.text}22`,
            }}
          />
        ) : (
          <div
            style={{
              width: 520 * u, height: 520 * u, borderRadius: 120 * u, display: "grid", placeItems: "center",
              background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
              boxShadow: `0 ${40 * u}px ${90 * u}px rgba(0,0,0,0.3)`,
              fontFamily: font, fontWeight: 700, fontSize: 92 * u, color: c.onPrimary, textAlign: "center", padding: 40 * u,
              lineHeight: 1.05,
            }}
          >
            {brief.brand.name}
          </div>
        )}
        {scene.badge && (
          <div
            style={{
              position: "absolute", top: -30 * u, right: -40 * u, padding: `${14 * u}px ${30 * u}px`,
              borderRadius: 999, background: c.accent, color: "#111", fontFamily: font, fontWeight: 700,
              fontSize: 36 * u, transform: `scale(${badge}) rotate(8deg)`, boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.3)`,
            }}
          >
            <Sfx name="pop" at={16} />
            {scene.badge}
          </div>
        )}
      </div>
      <Words text={scene.title} size={84} delay={8} />
      {scene.subtitle && (
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 44 * u, color: c.muted, textAlign: "center", opacity: sub, marginTop: -20 * u }}>
          {scene.subtitle}
        </div>
      )}
    </SceneWrap>
  );
};

// 4. BENEFITS — why buy, as a checklist.
export const Benefits: React.FC<P<"benefits">> = ({ scene, duration }) => {
  const u = useUnit();
  const { c, font } = useTheme();
  const Row: React.FC<{ item: (typeof scene.items)[number]; delay: number }> = ({ item, delay }) => {
    const s = useSpring(delay);
    const ic = useSpring(delay + 4, { damping: 8, stiffness: 200 });
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 28 * u, opacity: s, transform: `translateX(${(1 - s) * 120 * u}px)` }}>
        <Sfx name="pop" at={delay} volume={0.45} />
        <div
          style={{
            width: 86 * u, height: 86 * u, borderRadius: 26 * u, background: c.primary, display: "grid",
            placeItems: "center", transform: `scale(${ic})`, flexShrink: 0,
          }}
        >
          <Icon name={item.icon ?? "check"} size={46 * u} color={c.onPrimary} stroke={2.6} />
        </div>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 52 * u, color: c.text, lineHeight: 1.15 }}>{item.text}</div>
      </div>
    );
  };
  return (
    <SceneWrap duration={duration} gap={56}>
      <Sfx name="whoosh" />
      {scene.title && <Label text={scene.title} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 * u, alignSelf: "stretch", paddingLeft: 20 * u }}>
        {scene.items.map((it, i) => (
          <Row key={i} item={it} delay={8 + i * 16} />
        ))}
      </div>
    </SceneWrap>
  );
};

// 5. STAT — social proof number that counts up.
export const Stat: React.FC<P<"stat">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const { c, font } = useTheme();
  const m = scene.value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const p = interpolate(frame, [4, Math.min(45, duration - 15)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const shown = m
    ? `${m[1]}${(target * p).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${m[3]}`
    : scene.value;
  const s = useSpring(0);
  return (
    <SceneWrap duration={duration} gap={20}>
      <Sfx name="whoosh" />
      <Sfx name="ding" at={45} volume={0.4} />
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 210 * u, color: c.primary, transform: `scale(${0.6 + 0.4 * s})`, letterSpacing: -6 * u, textShadow: `0 ${10 * u}px ${40 * u}px ${c.primary}55` }}>
        {shown}
      </div>
      <Words text={scene.label} size={58} delay={10} weight={500} />
    </SceneWrap>
  );
};

// 6. PRICE — the offer, with old price struck through and a burst behind the new one.
export const Price: React.FC<P<"price">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const { c, font } = useTheme();
  const old = useSpring(6);
  const strike = useSpring(16, { damping: 20, stiffness: 140 });
  const pop = useSpring(22, { damping: 7, stiffness: 160 });
  const note = useSpring(34);
  const burstPts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 40;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <SceneWrap duration={duration} gap={30}>
      <Sfx name="whoosh" />
      <Sfx name="ding" at={22} volume={0.5} />
      {scene.label && <Label text={scene.label} />}
      {scene.oldPrice && (
        <div style={{ position: "relative", fontFamily: font, fontWeight: 500, fontSize: 64 * u, color: c.muted, opacity: old * 0.8 }}>
          {scene.oldPrice}
          <div style={{ position: "absolute", left: -10 * u, top: "50%", height: 7 * u, width: `calc(${strike * 100}% + ${20 * u}px)`, background: "#ff4d4f", transform: "rotate(-6deg)", borderRadius: 4 }} />
        </div>
      )}
      <div style={{ position: "relative", width: 640 * u, height: 640 * u, display: "grid", placeItems: "center", transform: `scale(${pop})`, flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: `rotate(${frame * 0.6}deg)` }}>
          <polygon points={burstPts} fill={c.accent} opacity={0.95} />
        </svg>
        <div style={{ position: "relative", fontFamily: font, fontWeight: 700, fontSize: (scene.price.length > 7 ? 112 : 140) * u, color: readableOn(c.accent), letterSpacing: -4 * u }}>
          {scene.price}
        </div>
      </div>
      {scene.note && (
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 44 * u, color: c.text, opacity: note, textAlign: "center", transform: `translateY(${(1 - note) * 20 * u}px)` }}>
          {scene.note}
        </div>
      )}
    </SceneWrap>
  );
};

// 7. TESTIMONIAL — a real customer quote with stars.
export const Testimonial: React.FC<P<"testimonial">> = ({ scene, duration }) => {
  const u = useUnit();
  const { c, font } = useTheme();
  const n = scene.stars ?? 5;
  const Star: React.FC<{ i: number }> = ({ i }) => {
    const s = useSpring(4 + i * 5, { damping: 8, stiffness: 220 });
    return (
      <div style={{ transform: `scale(${s}) rotate(${(1 - s) * 90}deg)` }}>
        <Sfx name="pop" at={4 + i * 5} volume={0.35} />
        <Icon name="star" size={80 * u} color="#FFC531" fill stroke={1} />
      </div>
    );
  };
  const who = useSpring(40);
  return (
    <SceneWrap duration={duration} gap={44}>
      <Sfx name="whoosh" />
      <div style={{ display: "flex", gap: 12 * u }}>
        {Array.from({ length: n }, (_, i) => <Star key={i} i={i} />)}
      </div>
      <div style={{ padding: `${50 * u}px ${46 * u}px`, borderRadius: 40 * u, background: `${c.text}10`, border: `${2 * u}px solid ${c.text}1a` }}>
        <Words text={`“${scene.quote}”`} size={58} delay={20} stagger={2} weight={500} lineHeight={1.25} />
      </div>
      <div style={{ fontFamily: font, textAlign: "center", opacity: who }}>
        <div style={{ fontWeight: 700, fontSize: 44 * u, color: c.text }}>{scene.name}</div>
        {scene.role && <div style={{ fontWeight: 400, fontSize: 36 * u, color: c.muted }}>{scene.role}</div>}
      </div>
    </SceneWrap>
  );
};

// 8. CTA — what to do now. Pulsing button + contact details.
export const Cta: React.FC<P<"cta">> = ({ scene, duration }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const { c, font } = useTheme();
  const btn = useSpring(14, { damping: 10, stiffness: 160 });
  const pulse = 1 + 0.035 * Math.sin(frame / 5);
  const Contact: React.FC<{ item: NonNullable<typeof scene.contacts>[number]; delay: number }> = ({ item, delay }) => {
    const s = useSpring(delay);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20 * u, opacity: s, transform: `translateY(${(1 - s) * 30 * u}px)` }}>
        <Icon name={item.icon ?? "chat"} size={50 * u} color={c.primary} stroke={2.4} />
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 46 * u, color: c.text }}>{item.text}</div>
      </div>
    );
  };
  const urg = useSpring(40);
  return (
    <SceneWrap duration={duration + 20} gap={46}>
      <Sfx name="whoosh" />
      <Words text={scene.text} size={90} stagger={3} />
      {scene.button && (
        <div
          style={{
            padding: `${34 * u}px ${70 * u}px`, borderRadius: 999, background: c.primary, color: c.onPrimary,
            fontFamily: font, fontWeight: 700, fontSize: 54 * u, transform: `scale(${btn * pulse})`,
            boxShadow: `0 ${20 * u}px ${60 * u}px ${c.primary}66`,
          }}
        >
          <Sfx name="pop" at={14} />
          {scene.button}
        </div>
      )}
      {scene.contacts && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 * u, alignItems: "center" }}>
          {scene.contacts.map((ct, i) => <Contact key={i} item={ct} delay={26 + i * 8} />)}
        </div>
      )}
      {scene.urgency && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 * u, opacity: urg, fontFamily: font, fontWeight: 500, fontSize: 38 * u, color: c.muted }}>
          <div style={{ width: 18 * u, height: 18 * u, borderRadius: 999, background: "#ff4d4f", opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 8)) }} />
          {scene.urgency}
        </div>
      )}
    </SceneWrap>
  );
};
