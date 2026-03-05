import { useRef } from "react";
import { use_settings } from "@/ctx";
import { MIN_PITCH, MAX_PITCH } from "@/lib";
import { c } from "@/theme";

const MIN = MIN_PITCH;
const MAX = MAX_PITCH;
const DEFAULT = 1;
const SNAPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SNAP_THRESHOLD = 0.02;

function val_to_pct(v: number): number {
  if (v <= DEFAULT) return ((v - MIN) / (DEFAULT - MIN)) * 0.5;
  return 0.5 + ((v - DEFAULT) / (MAX - DEFAULT)) * 0.5;
}

function pct_to_val(p: number): number {
  if (p <= 0.5) return MIN + (p / 0.5) * (DEFAULT - MIN);
  return DEFAULT + ((p - 0.5) / 0.5) * (MAX - DEFAULT);
}

function snap(v: number): number {
  for (const s of SNAPS) {
    if (Math.abs(v - s) < SNAP_THRESHOLD) return s;
  }
  return Math.round(v * 100) / 100;
}

export function Pitch() {
  const { pitch, set_pitch } = use_settings();
  const track_ref = useRef<HTMLDivElement>(null);

  const pct = val_to_pct(pitch);
  const is_default = pitch === DEFAULT;
  const color = is_default ? c.w30 : c.accent;

  function update(raw: number) {
    set_pitch(snap(Math.max(MIN, Math.min(MAX, raw))));
  }

  function on_track_click(e: React.MouseEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    update(pct_to_val(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))));
  }

  function on_thumb_down(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const start_x = e.clientX;
    const start_pct = pct;
    const track_w = track_ref.current?.getBoundingClientRect().width ?? 600;

    function on_move(ev: MouseEvent) {
      update(pct_to_val(Math.max(0, Math.min(1, start_pct + (ev.clientX - start_x) / track_w))));
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
        <span style={{ fontSize: 13, fontWeight: 600, color: c.w70 }}>Pitch</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color, transition: "color 0.15s",
          }}>
            {pitch.toFixed(2)}x
          </span>
          {!is_default && (
            <button
              onClick={() => set_pitch(DEFAULT)}
              style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
                background: c.w07, color: c.w40,
              }}
            >
              Reset
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
        {SNAPS.map(s => (
          <div key={s} style={{
            position: "absolute", left: `${val_to_pct(s) * 100}%`, top: "50%",
            transform: "translate(-50%, -50%)",
            width: s === DEFAULT ? 6 : 3, height: s === DEFAULT ? 6 : 3,
            borderRadius: "50%", background: s === DEFAULT ? c.w25 : c.w10,
          }} />
        ))}
        <div
          onMouseDown={on_thumb_down}
          style={{
            position: "absolute", left: `${pct * 100}%`, top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14, height: 14, borderRadius: "50%",
            background: color,
            boxShadow: is_default ? "none" : `0 0 8px ${c.accent_glow}`,
            transition: "background 0.15s, box-shadow 0.15s",
            cursor: "ew-resize", zIndex: 1,
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: c.w20 }}>0.25x</span>
        <span style={{ fontSize: 10, color: c.w20 }}>1x</span>
        <span style={{ fontSize: 10, color: c.w20 }}>2x</span>
      </div>
    </div>
  );
}
