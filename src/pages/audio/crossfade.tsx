import { useRef } from "react";
import { use_settings } from "@/ctx";
import { MAX_CROSSFADE } from "@/lib";
import { c } from "@/theme";

const MAX = MAX_CROSSFADE;

export function Crossfade() {
  const { crossfade, set_crossfade } = use_settings();
  const track_ref = useRef<HTMLDivElement>(null);

  const pct = crossfade / MAX;
  const active = crossfade > 0;
  const color = active ? c.accent : c.w30;

  function update(v: number) {
    set_crossfade(Math.max(0, Math.min(MAX, Math.round(v))));
  }

  function on_track_click(e: React.MouseEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    update(((e.clientX - r.left) / r.width) * MAX);
  }

  function on_thumb_down(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const start_x = e.clientX;
    const start_pct = pct;
    const track_w = track_ref.current?.getBoundingClientRect().width ?? 600;

    function on_move(ev: MouseEvent) {
      update(Math.max(0, Math.min(1, start_pct + (ev.clientX - start_x) / track_w)) * MAX);
    }

    function on_up() {
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    }

    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
  }

  return (
    <div style={{
      background: c.w03, border: `1px solid ${c.w07}`,
      borderRadius: 14, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.w70 }}>Crossfade</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color, transition: "color 0.15s",
          }}>
            {crossfade === 0 ? "Off" : `${crossfade}s`}
          </span>
          {active && (
            <button
              onClick={() => set_crossfade(0)}
              style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
                background: c.w07, color: c.w40,
              }}
            >
              Off
            </button>
          )}
        </div>
      </div>

      <div
        ref={track_ref}
        style={{ position: "relative", height: 20, cursor: "pointer", display: "flex", alignItems: "center" }}
        onClick={on_track_click}
      >
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, background: c.w08 }} />
        <div style={{
          position: "absolute", left: 0, height: 3, borderRadius: 2,
          width: `${pct * 100}%`, background: color,
          transition: "width 0.05s, background 0.15s",
        }} />
        <div
          onMouseDown={on_thumb_down}
          style={{
            position: "absolute", left: `${pct * 100}%`, top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14, height: 14, borderRadius: "50%",
            background: color,
            boxShadow: active ? `0 0 8px ${c.accent_glow}` : "none",
            transition: "background 0.15s, box-shadow 0.15s",
            cursor: "ew-resize", zIndex: 1,
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: c.w20 }}>Off</span>
        <span style={{ fontSize: 10, color: c.w20 }}>6s</span>
        <span style={{ fontSize: 10, color: c.w20 }}>12s</span>
      </div>
    </div>
  );
}
