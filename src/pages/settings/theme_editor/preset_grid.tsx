import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { PRESETS } from "./presets";
import type { ThemePreset } from "./presets";
import type { CustomTheme } from "@/ctx";
import { c } from "@/theme";

type Props = {
  on_select: (t: CustomTheme) => void;
  custom_presets: ThemePreset[];
  on_save_preset: (name: string) => void;
  on_delete_preset: (name: string) => void;
};

function PresetCard({
  preset,
  hovered,
  on_hover,
  on_leave,
  on_click,
  on_delete,
}: {
  preset: ThemePreset;
  hovered: boolean;
  on_hover: () => void;
  on_leave: () => void;
  on_click: () => void;
  on_delete?: () => void;
}) {
  const bg = preset.theme.bg2_enabled
    ? `linear-gradient(135deg, ${preset.theme.bg1}, ${preset.theme.bg2})`
    : preset.theme.bg1;

  return (
    <button
      onClick={on_click}
      onMouseEnter={on_hover}
      onMouseLeave={on_leave}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: 10,
        borderRadius: 10,
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.15s",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {on_delete && hovered && (
        <div
          onClick={(e) => { e.stopPropagation(); on_delete(); }}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={10} color={c.w60} />
        </div>
      )}
      <div style={{
        width: "100%",
        height: 32,
        borderRadius: 6,
        background: bg,
        border: "1px solid rgba(255,255,255,0.08)",
      }} />
      <p style={{ fontSize: 10, fontWeight: 500, color: c.w45 }}>{preset.name}</p>
    </button>
  );
}

export function PresetGrid({ on_select, custom_presets, on_save_preset, on_delete_preset }: Props) {
  const [hov, set_hov] = useState<string | null>(null);
  const [naming, set_naming] = useState(false);
  const [preset_name, set_preset_name] = useState("");
  const input_ref = useRef<HTMLInputElement>(null);

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = preset_name.trim();
    if (trimmed) {
      on_save_preset(trimmed);
      set_preset_name("");
      set_naming(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: c.w50, textTransform: "uppercase", letterSpacing: "0.06em" }}>Presets</p>
        {naming ? (
          <form onSubmit={handle_submit} style={{ display: "flex" }}>
            <input
              ref={input_ref}
              autoFocus
              value={preset_name}
              onChange={(e) => set_preset_name(e.target.value)}
              onBlur={() => { if (!preset_name.trim()) { set_naming(false); set_preset_name(""); } }}
              onKeyDown={(e) => { if (e.key === "Escape") { set_naming(false); set_preset_name(""); } }}
              placeholder="Name"
              style={{
                width: 100,
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                background: c.w07,
                color: c.text,
                border: `1px solid ${c.w15}`,
                outline: "none",
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => set_naming(true)}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: c.w07,
              border: `1px solid ${c.w08}`,
              cursor: "pointer",
              color: c.w40,
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--font)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = c.w40)}
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {PRESETS.map((p) => (
          <PresetCard
            key={p.name}
            preset={p}
            hovered={hov === p.name}
            on_hover={() => set_hov(p.name)}
            on_leave={() => set_hov(null)}
            on_click={() => on_select(p.theme)}
          />
        ))}
        {custom_presets.map((p) => (
          <PresetCard
            key={`custom-${p.name}`}
            preset={p}
            hovered={hov === `custom-${p.name}`}
            on_hover={() => set_hov(`custom-${p.name}`)}
            on_leave={() => set_hov(null)}
            on_click={() => on_select(p.theme)}
            on_delete={() => on_delete_preset(p.name)}
          />
        ))}
      </div>
    </div>
  );
}
