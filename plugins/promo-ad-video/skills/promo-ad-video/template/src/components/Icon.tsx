import React from "react";
import type { IconName } from "../types";

// Simple line icons (24x24 grid). Generic shapes only — no brand logos.
const PATHS: Record<IconName, string> = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  truck: "M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7zM7 18.5a1.8 1.8 0 100-.01M17 18.5a1.8 1.8 0 100-.01",
  clock: "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5V12l3 2",
  shield: "M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5",
  phone: "M6.5 3.5h3l1.5 4-2 1.5a11 11 0 006 6l1.5-2 4 1.5v3a2 2 0 01-2 2A16.5 16.5 0 014.5 5.5a2 2 0 012-2z",
  chat: "M4 5.5h16v10H9l-5 4z",
  globe: "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z",
  tag: "M3.5 12.5V4h8.5l8.5 8.5-8 8zM8 8.2a.4.4 0 100 .01",
  spark: "M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3",
  heart: "M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0112 7.5 4.3 4.3 0 0119.5 10c0 5.5-7.5 10-7.5 10z",
  location: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  cash: "M2.5 6.5h19v11h-19zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM5.5 9.5v5M18.5 9.5v5",
  bolt: "M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z",
  gift: "M3.5 8.5h17v4h-17zM5 12.5h14v8H5zM12 8.5v12M12 8.5C10 4 6.5 5 7.5 7.5c.5 1 4.5 1 4.5 1s4-0 4.5-1C17.5 5 14 4 12 8.5z",
};

export const Icon: React.FC<{ name: IconName; size: number; color: string; stroke?: number; fill?: boolean }> = ({
  name,
  size,
  color,
  stroke = 2.2,
  fill = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d={PATHS[name] ?? PATHS.check}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill ? color : "none"}
    />
  </svg>
);
