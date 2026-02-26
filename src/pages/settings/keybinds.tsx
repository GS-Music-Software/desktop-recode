import { useState, useEffect, useCallback } from "react";
import { use_lib } from "@/ctx";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { c } from "@/theme";
import { GROUPS, LABELS, DEFAULTS, load, save, combo_from_event, combo_label } from "@/lib/keybinds";
import type { Action, Binds } from "@/lib/keybinds";

function Key({ text }: { text: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 6,
      background: c.w07,
      border: `1px solid ${c.w10}`,
      fontSize: 12,
      fontWeight: 600,
      color: c.text,
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

function Row({ action, combo, recording, on_click }: {
  action: Action;
  combo: string;
  recording: boolean;
  on_click: () => void;
}) {
  const [hov, set_hov] = useState(false);

  return (
    <div
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 20px",
        margin: "0 -20px",
        cursor: "pointer",
        background: recording ? c.accent_15 : hov ? c.w06 : "transparent",
        transition: "background 0.12s",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{LABELS[action]}</p>
      {recording ? (
        <span style={{ fontSize: 12, color: c.accent, fontWeight: 600 }}>Press a key...</span>
      ) : (
        <div style={{ display: "flex", gap: 4 }}>
          {combo_label(combo).split(" + ").map((k, i) => <Key key={i} text={k} />)}
        </div>
      )}
    </div>
  );
}

export function Keybinds() {
  const { set_view } = use_lib();
  const [binds, set_binds] = useState<Binds>(load);
  const [recording, set_recording] = useState<Action | null>(null);

  const on_key = useCallback((e: KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") { set_recording(null); return; }
    if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) return;
    const combo = combo_from_event(e);
    const next = { ...binds, [recording]: combo };
    set_binds(next);
    save(next);
    window.dispatchEvent(new Event("keybinds_changed"));
    set_recording(null);
  }, [recording, binds]);

  useEffect(() => {
    window.addEventListener("keydown", on_key, true);
    return () => window.removeEventListener("keydown", on_key, true);
  }, [on_key]);

  function reset() {
    set_binds({ ...DEFAULTS });
    save({ ...DEFAULTS });
    window.dispatchEvent(new Event("keybinds_changed"));
    set_recording(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        height: 52, display: "flex", alignItems: "center",
        padding: "0 16px 0 8px", gap: 4, flexShrink: 0,
        borderBottom: `1px solid ${c.w07}`,
      }}>
        <button
          onClick={() => set_view("settings")}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 10px", borderRadius: 8,
            color: c.w50, fontSize: 13, transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w50)}
        >
          <ChevronLeft size={16} />
          Settings
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text, marginLeft: 4, flex: 1 }}>Keybinds</h1>
        <button
          onClick={reset}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 500, color: c.w40, transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w40)}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 24 }}>
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", color: c.w30, marginBottom: 10,
              }}>{g.label}</p>
              <div style={{
                borderRadius: 14, padding: "0 20px", overflow: "hidden",
                background: c.w04, border: `1px solid ${c.w07}`,
              }}>
                {g.actions.map((a, i) => (
                  <div key={a}>
                    {i > 0 && <div style={{ height: 1, background: c.w06 }} />}
                    <Row
                      action={a}
                      combo={binds[a]}
                      recording={recording === a}
                      on_click={() => set_recording(recording === a ? null : a)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
