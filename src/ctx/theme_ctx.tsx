import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ThemePreset } from "@/pages/settings/theme_editor/presets";

export type CustomTheme = {
  accent: string;
  bg1: string;
  bg2: string;
  font: string;
  bg2_enabled: boolean;
};

const DEFAULT_THEME: CustomTheme = {
  accent: "#fc3c44",
  bg1: "#09090b",
  bg2: "#09090b",
  font: "#fafafa",
  bg2_enabled: false,
};

type ThemeState = {
  theme: CustomTheme;
  set_theme: (t: CustomTheme) => void;
  reset_theme: () => void;
  custom_presets: ThemePreset[];
  save_preset: (name: string) => void;
  delete_preset: (name: string) => void;
};

const Ctx = createContext<ThemeState | null>(null);

function hex_to_rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function lighten(r: number, g: number, b: number, amount: number): string {
  const l = (n: number) => Math.min(255, Math.round(n + amount));
  return `rgb(${l(r)},${l(g)},${l(b)})`;
}

function apply_vars(t: CustomTheme) {
  const root = document.documentElement;
  const [ar, ag, ab] = hex_to_rgb(t.accent);
  const [fr, fg, fb] = hex_to_rgb(t.font);
  const [br, bg, bb] = hex_to_rgb(t.bg1);

  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-r", String(ar));
  root.style.setProperty("--accent-g", String(ag));
  root.style.setProperty("--accent-b", String(ab));

  root.style.setProperty("--font", t.font);
  root.style.setProperty("--font-r", String(fr));
  root.style.setProperty("--font-g", String(fg));
  root.style.setProperty("--font-b", String(fb));

  root.style.setProperty("--bg1", t.bg1);
  root.style.setProperty("--bg2", t.bg2);
  root.style.setProperty("--bg2-on", t.bg2_enabled ? "1" : "0");

  if (t.bg2_enabled) {
    root.style.setProperty("--surface", `rgba(${br + 10},${bg + 10},${bb + 10},0.55)`);
    root.style.setProperty("--surface-raised", `rgba(${br + 15},${bg + 15},${bb + 15},0.6)`);
  } else {
    root.style.setProperty("--surface", lighten(br, bg, bb, 10));
    root.style.setProperty("--surface-raised", lighten(br, bg, bb, 15));
  }
  root.style.setProperty("--surface-input", lighten(br, bg, bb, 22));
  root.style.setProperty("--card", lighten(br, bg, bb, 30));
  root.style.setProperty("--card-alt", lighten(br, bg, bb, 36));
  root.style.setProperty("--card-alt-hover", lighten(br, bg, bb, 54));
  root.style.setProperty("--modal", `rgba(${br + 14},${bg + 14},${bb + 14},0.92)`);
  root.style.setProperty("--dropdown", `rgba(${br + 22},${bg + 22},${bb + 22},0.95)`);

  if (t.bg2_enabled) {
    root.style.setProperty("--bg", `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`);
    root.style.setProperty("--bg-flat", t.bg1);
  } else {
    root.style.setProperty("--bg", t.bg1);
    root.style.setProperty("--bg-flat", t.bg1);
  }
}

function load_custom_presets(): ThemePreset[] {
  try {
    const s = localStorage.getItem("theme_custom_presets");
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  return [];
}

function load_theme(): CustomTheme {
  try {
    const s = localStorage.getItem("custom_theme");
    if (s) return { ...DEFAULT_THEME, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULT_THEME };
}

export function ThemeProv({ children }: { children: ReactNode }) {
  const [theme, _set_theme] = useState<CustomTheme>(load_theme);
  const [custom_presets, _set_custom_presets] = useState<ThemePreset[]>(load_custom_presets);

  useEffect(() => {
    apply_vars(theme);
  }, [theme]);

  function set_theme(t: CustomTheme) {
    localStorage.setItem("custom_theme", JSON.stringify(t));
    _set_theme(t);
  }

  function reset_theme() {
    localStorage.removeItem("custom_theme");
    _set_theme({ ...DEFAULT_THEME });
  }

  function save_preset(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [
      ...custom_presets.filter((p) => p.name !== trimmed),
      { name: trimmed, theme: { ...theme } },
    ];
    localStorage.setItem("theme_custom_presets", JSON.stringify(next));
    _set_custom_presets(next);
  }

  function delete_preset(name: string) {
    const next = custom_presets.filter((p) => p.name !== name);
    localStorage.setItem("theme_custom_presets", JSON.stringify(next));
    _set_custom_presets(next);
  }

  return (
    <Ctx.Provider value={{ theme, set_theme, reset_theme, custom_presets, save_preset, delete_preset }}>
      {children}
    </Ctx.Provider>
  );
}

export function use_theme(): ThemeState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_theme outside provider");
  return ctx;
}

export { DEFAULT_THEME };
