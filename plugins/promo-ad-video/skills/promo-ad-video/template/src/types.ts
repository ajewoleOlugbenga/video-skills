// The brief is the single source of truth for an ad.
// Claude writes a brief JSON (see briefs/example.json), then renders it.

export type IconName =
  | "check" | "star" | "truck" | "clock" | "shield" | "phone" | "chat"
  | "globe" | "tag" | "spark" | "heart" | "location" | "cash" | "bolt" | "gift" | "x";

export type Scene =
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
    };

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
    voiceover?: string; // file in public/, e.g. "assets/vo.mp3"
    sfx?: boolean; // default true
  };
};
