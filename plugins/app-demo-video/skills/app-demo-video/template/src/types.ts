// The brief is the single source of truth for an ad.
// Claude writes a brief JSON (see briefs/example.json), then renders it.

export type IconName =
  | "check" | "star" | "truck" | "clock" | "shield" | "phone" | "chat"
  | "globe" | "tag" | "spark" | "heart" | "location" | "cash" | "bolt" | "gift" | "x"
  | "code" | "lock" | "users" | "chart" | "search" | "cloud";

// Fractions (0-1) of the screenshot: the region to zoom into. capture.mjs computes this from a CSS selector.
export type Focus = { x: number; y: number; w: number; h: number };

// Fields every scene can have when a voiceover is used (scripts/voiceover.py fills voice + voiceSeconds).
export type SceneVoice = { say?: string; voice?: string; voiceSeconds?: number };

export type Scene = SceneVoice & (
  | { type: "intro"; name?: string; tagline: string; label?: string; media?: string; seconds?: number }
  | {
      type: "feature";
      title: string;
      caption?: string;
      step?: string; // small label above the title, e.g. "Step 1" or "Invoices"
      media?: string; // screenshot, e.g. "assets/shots/dashboard.png"
      video?: string; // screen recording, e.g. "assets/shots/create-invoice.webm"; keep media = its final screenshot
      clipSeconds?: number; // recording length (manifest "seconds"); zoom starts after it
      speed?: number; // playback speed for the recording, e.g. 1.5
      width?: number; // source size in CSS px (from manifest), defaults 1440x900 / 390x844
      height?: number;
      frame?: "browser" | "phone" | "none";
      url?: string; // shown in the browser address bar
      focus?: Focus;
      zoom?: number; // max zoom, default 2.2 (browser) / 1.6 (phone)
      callout?: string; // short label that pops next to the focus point
      cursor?: boolean; // animated cursor on screenshots, default true when focus is set
      flip?: boolean; // landscape: screen on the left, text on the right
      seconds?: number;
    }
  | { type: "montage"; title: string; media: string[]; seconds?: number }
  | { type: "hook"; text: string; sub?: string; seconds?: number }
  | { type: "problem"; title?: string; lines: string[]; seconds?: number }
  | { type: "product"; title: string; subtitle?: string; image?: string; badge?: string; seconds?: number }
  | { type: "benefits"; title?: string; items: { icon?: IconName; text: string }[]; seconds?: number }
  | { type: "stat"; value: string; label: string; seconds?: number }
  | { type: "price"; label?: string; price: string; oldPrice?: string; note?: string; seconds?: number }
  | { type: "testimonial"; quote: string; name: string; role?: string; stars?: number; seconds?: number }
  | {
      type: "cta";
      text: string;
      button?: string;
      contacts?: { icon?: IconName; text: string }[];
      urgency?: string;
      seconds?: number;
    }
);

export type Brief = {
  brand: {
    name: string;
    logo?: string; // file in public/assets, e.g. "assets/logo.png"
    colors: {
      background: string;
      primary: string;
      accent: string;
      text: string;
      muted?: string;
    };
    font?: string; // family name; Poppins is bundled
    style?: "bold" | "soft" | "dark-luxe";
  };
  format?: "9:16" | "1:1" | "4:5" | "16:9";
  fps?: number;
  scenes: Scene[];
  audio?: {
    music?: string | false; // file in public/, default "sfx/starter-beat.mp3"
    musicVolume?: number; // 0-1, default 0.35 (0.12 under voiceover)
    voiceover?: string; // one pre-recorded track for the whole video (alternative to per-scene "say")
    voice?: { name: "norman" | "cori"; speed?: number }; // offline AI voice used by scripts/voiceover.py
    pronounce?: Record<string, string>; // e.g. { "Ledgerly": "Ledger lee" }
    subtitles?: boolean; // captions of the spoken lines, default true when scenes have "say"
    sfx?: boolean; // default true
  };
};
