import { useState, useRef } from "react";
import { use_settings, EQ_PRESETS } from "@/ctx";
import { EQ_FREQS } from "@/lib";
import { c } from "@/theme";

const MIN_DB = -12;
const MAX_DB = 12;
const TRACK_H = 160;

function fmt_freq(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function fmt_gain(db: number): string {
  return (db >= 0 ? "+" : "") + db.toFixed(1);
}

export function Eq() {
  const { eq_bands, set_eq_bands, eq_enabled } = use_settings();
  const [active_preset, set_active_preset] = useState<string | null>(() => {
    for (const p of EQ_PRESETS) {
      if (p.gains.every((g, i) => g === eq_bands[i])) return p.name;
    }
    return null;
  });
  const drag_ref = useRef<{ idx: number; start_y: number; start_gain: number } | null>(null);

  function apply_preset(name: string, gains: number[]) {
    set_active_preset(name);
    set_eq_bands([...gains]);
  }

  function on_band_change(idx: number, val: number) {
    const next = [...eq_bands];
    next[idx] = Math.round(val * 10) / 10;
    set_eq_bands(next);
    set_active_preset(null);
    for (const p of EQ_PRESETS) {
      if (p.gains.every((g, i) => g === next[i])) { set_active_preset(p.name); break; }
    }
  }

  function on_slider_mouse_down(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    drag_ref.current = { idx, start_y: e.clientY, start_gain: eq_bands[idx] };

    function on_move(ev: MouseEvent) {
      if (!drag_ref.current) return;
      const { idx, start_y, start_gain } = drag_ref.current;
      const dy = start_y - ev.clientY;
      const range = MAX_DB - MIN_DB;
      const delta = (dy / TRACK_H) * range;
      on_band_change(idx, Math.max(MIN_DB, Math.min(MAX_DB, start_gain + delta)));
    }

    function on_up() {
      drag_ref.current = null;
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    }

    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
  }

  function on_slider_dbl_click(idx: number) {
    on_band_change(idx, 0);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {EQ_PRESETS.map(p => (
          <button
            key={p.name}
            onClick={() => apply_preset(p.name, p.gains)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: active_preset === p.name ? c.accent : c.w07,
              color: active_preset === p.name ? c.white : c.w60,
              border: `1px solid ${active_preset === p.name ? "transparent" : c.w08}`,
              transition: "background 0.15s, color 0.15s",
              opacity: eq_enabled ? 1 : 0.4,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div style={{
        background: c.w03,
        border: `1px solid ${c.w07}`,
        borderRadius: 16,
        padding: "28px 24px 20px",
        opacity: eq_enabled ? 1 : 0.4,
        transition: "opacity 0.2s",
        pointerEvents: eq_enabled ? "auto" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: TRACK_H + 48, justifyContent: "space-around" }}>
          {EQ_FREQS.map((freq, i) => {
            const gain = eq_bands[i] ?? 0;
            const pct = (gain - MIN_DB) / (MAX_DB - MIN_DB);
            const thumb_top = (1 - pct) * TRACK_H;

            return (
              <div key={freq} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                <span style={{
                  fontSize: 9, color: gain !== 0 ? c.accent : c.w30,
                  fontVariantNumeric: "tabular-nums", fontWeight: 500,
                  transition: "color 0.15s", height: 14, lineHeight: "14px",
                }}>
                  {fmt_gain(gain)}
                </span>

                <div
                  style={{ position: "relative", width: 28, height: TRACK_H, cursor: "ns-resize", userSelect: "none" }}
                  onMouseDown={e => on_slider_mouse_down(e, i)}
                  onDoubleClick={() => on_slider_dbl_click(i)}
                >
                  <div style={{
                    position: "absolute", left: "50%", transform: "translateX(-50%)",
                    width: 2, top: 0, bottom: 0,
                    background: c.w08, borderRadius: 1,
                  }} />
                  <div style={{
                    position: "absolute", left: "50%", transform: "translateX(-50%)",
                    width: 2, borderRadius: 1,
                    background: gain >= 0 ? c.accent : c.indigo,
                    top: gain >= 0 ? thumb_top : TRACK_H / 2,
                    height: Math.abs(gain) / (MAX_DB - MIN_DB) * TRACK_H,
                    transition: "top 0.05s, height 0.05s",
                  }} />
                  <div style={{
                    position: "absolute", left: "50%", transform: "translateX(-50%)",
                    width: 14, height: 14, borderRadius: "50%",
                    background: gain !== 0 ? (gain >= 0 ? c.accent : c.indigo) : c.w30,
                    top: thumb_top - 7,
                    boxShadow: gain !== 0 ? `0 0 8px ${gain >= 0 ? c.accent_glow : c.indigo_glow}` : "none",
                    transition: "background 0.15s, box-shadow 0.15s, top 0.05s",
                    cursor: "ns-resize",
                  }} />
                </div>

                <span style={{ fontSize: 10, color: c.w30, marginTop: 2 }}>
                  {fmt_freq(freq)}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 12, borderTop: `1px solid ${c.w05}` }}>
          <span style={{ fontSize: 10, color: c.w20 }}>{MIN_DB} dB</span>
          <span style={{ fontSize: 10, color: c.w20 }}>0 dB</span>
          <span style={{ fontSize: 10, color: c.w20 }}>+{MAX_DB} dB</span>
        </div>
      </div>

      <p style={{ fontSize: 11, color: c.w20, textAlign: "center" }}>
        Drag bands up/down · Double-click to reset a band
      </p>
    </>
  );
}
