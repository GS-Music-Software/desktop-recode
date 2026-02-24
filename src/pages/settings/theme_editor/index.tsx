import { useState } from "react";
import { use_lib, use_theme, DEFAULT_THEME } from "@/ctx";
import type { CustomTheme } from "@/ctx";
import { ChevronLeft, RotateCcw, Upload, Download } from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { c } from "@/theme";
import { Toggle } from "../toggle";
import { ColorRow } from "./color_row";
import { PresetGrid } from "./preset_grid";

type OpenPicker = "accent" | "bg1" | "bg2" | "font" | null;

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: "0 20px",
  background: c.w04,
  border: `1px solid ${c.w07}`,
};

const sep: React.CSSProperties = {
  height: 1,
  background: c.w06,
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: c.w30,
  marginBottom: 10,
};

export function ThemeEditor() {
  const { set_view } = use_lib();
  const { theme, set_theme, reset_theme, custom_presets, save_preset, delete_preset } = use_theme();
  const [local, set_local] = useState<CustomTheme>({ ...theme });
  const [open, set_open] = useState<OpenPicker>(null);

  const update = (partial: Partial<CustomTheme>) => {
    const next = { ...local, ...partial };
    set_local(next);
    set_theme(next);
  };

  const apply_preset = (t: CustomTheme) => {
    set_local({ ...t });
    set_theme({ ...t });
    set_open(null);
  };

  const handle_reset = () => {
    reset_theme();
    set_local({ ...DEFAULT_THEME });
    set_open(null);
  };

  const handle_import = async () => {
    const path = await open({ filters: [{ name: "Theme", extensions: ["json"] }] });
    if (!path || typeof path !== "string") return;
    try {
      const raw = await readTextFile(path);
      const data = JSON.parse(raw);
      const keys = ["accent", "bg1", "bg2", "font", "bg2_enabled"] as const;
      if (!keys.every((k) => k in data)) return;
      apply_preset({
        accent: data.accent,
        bg1: data.bg1,
        bg2: data.bg2,
        font: data.font,
        bg2_enabled: !!data.bg2_enabled,
      });
    } catch {}
  };

  const handle_export = async () => {
    const path = await save({
      filters: [{ name: "Theme", extensions: ["json"] }],
      defaultPath: "my_theme.json",
    });
    if (!path) return;
    await writeTextFile(path, JSON.stringify(local, null, 2));
  };

  const toggle = (p: OpenPicker) => set_open(open === p ? null : p);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 16px 0 8px",
        gap: 4,
        flexShrink: 0,
        borderBottom: `1px solid ${c.w07}`,
      }}>
        <button
          onClick={() => set_view("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderRadius: 8,
            color: c.w50,
            fontSize: 13,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--font)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w50)}
        >
          <ChevronLeft size={16} />
          Settings
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text, marginLeft: 4 }}>Theme</h1>
        <div style={{ flex: 1 }} />
        <button
          onClick={handle_import}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            color: c.w40,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--font)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w40)}
        >
          <Upload size={13} />
          Import
        </button>
        <button
          onClick={handle_export}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            color: c.w40,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--font)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w40)}
        >
          <Download size={13} />
          Export
        </button>
        <button
          onClick={handle_reset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            color: c.w40,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--font)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w40)}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={lbl}>Accent</p>
              <div style={card}>
                <ColorRow
                  label="Accent Color"
                  description="Buttons, highlights, active states"
                  value={local.accent}
                  on_change={(hex) => update({ accent: hex })}
                  open={open === "accent"}
                  on_toggle={() => toggle("accent")}
                />
              </div>
            </div>

            <div>
              <p style={lbl}>Background</p>
              <div style={card}>
                <ColorRow
                  label="Background"
                  description="Main background color"
                  value={local.bg1}
                  on_change={(hex) => update({ bg1: hex })}
                  open={open === "bg1"}
                  on_toggle={() => toggle("bg1")}
                />
                <div style={sep} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Gradient</p>
                    <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Blend two background colors</p>
                  </div>
                  <Toggle on={local.bg2_enabled} set_on={(v) => update({ bg2_enabled: v })} />
                </div>
                {local.bg2_enabled && (
                  <>
                    <div style={sep} />
                    <ColorRow
                      label="Background 2"
                      description="Second gradient color"
                      value={local.bg2}
                      on_change={(hex) => update({ bg2: hex })}
                      open={open === "bg2"}
                      on_toggle={() => toggle("bg2")}
                    />
                    <div style={{
                      height: 24,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, ${local.bg1}, ${local.bg2})`,
                      border: `1px solid ${c.w08}`,
                      marginBottom: 14,
                    }} />
                  </>
                )}
              </div>
            </div>

            <div>
              <p style={lbl}>Font</p>
              <div style={card}>
                <ColorRow
                  label="Font Color"
                  description="Text and icon color"
                  value={local.font}
                  on_change={(hex) => update({ font: hex })}
                  open={open === "font"}
                  on_toggle={() => toggle("font")}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 0, alignSelf: "start" }}>
            <PresetGrid
              on_select={apply_preset}
              custom_presets={custom_presets}
              on_save_preset={save_preset}
              on_delete_preset={delete_preset}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
