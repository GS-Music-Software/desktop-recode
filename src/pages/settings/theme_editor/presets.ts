import type { CustomTheme } from "@/ctx";

export type ThemePreset = {
  name: string;
  theme: CustomTheme;
};

export const PRESETS: ThemePreset[] = [
  {
    name: "Default",
    theme: { accent: "#fc3c44", bg1: "#09090b", bg2: "#09090b", font: "#fafafa", bg2_enabled: false },
  },
  {
    name: "Ocean",
    theme: { accent: "#0ea5e9", bg1: "#0c1222", bg2: "#0a1628", font: "#e0f2fe", bg2_enabled: false },
  },
  {
    name: "Emerald",
    theme: { accent: "#10b981", bg1: "#0a0f0d", bg2: "#071210", font: "#ecfdf5", bg2_enabled: false },
  },
  {
    name: "Purple",
    theme: { accent: "#a855f7", bg1: "#0f0a1a", bg2: "#150d24", font: "#f3e8ff", bg2_enabled: false },
  },
  {
    name: "Sunset",
    theme: { accent: "#f97316", bg1: "#1a0a00", bg2: "#1c0f0a", font: "#fff7ed", bg2_enabled: false },
  },
  {
    name: "Rose",
    theme: { accent: "#f43f5e", bg1: "#1a0a10", bg2: "#200d16", font: "#fff1f2", bg2_enabled: false },
  },
  {
    name: "Aurora",
    theme: { accent: "#06b6d4", bg1: "#0a0e1a", bg2: "#0f1a12", font: "#ecfeff", bg2_enabled: false },
  },
  {
    name: "Midnight",
    theme: { accent: "#6366f1", bg1: "#020214", bg2: "#0a0a20", font: "#eef2ff", bg2_enabled: false },
  },
];
