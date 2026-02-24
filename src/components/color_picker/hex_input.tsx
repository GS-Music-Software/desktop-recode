import { useState, useEffect } from "react";
import { is_valid_hex } from "./helpers";
import { c } from "@/theme";

type Props = {
  value: string;
  on_change: (hex: string) => void;
};

export function HexInput({ value, on_change }: Props) {
  const [text, set_text] = useState(value.replace("#", ""));
  const [focused, set_focused] = useState(false);

  useEffect(() => {
    if (!focused) set_text(value.replace("#", ""));
  }, [value, focused]);

  const commit = () => {
    const clean = text.trim();
    if (is_valid_hex(clean)) {
      on_change(clean.startsWith("#") ? clean : `#${clean}`);
    } else {
      set_text(value.replace("#", ""));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: value,
        border: "1.5px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }} />
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "0 10px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ fontSize: 13, color: c.w30, marginRight: 2, fontWeight: 600 }}>#</span>
        <input
          value={text}
          onChange={(e) => set_text(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
          onFocus={() => set_focused(true)}
          onBlur={() => { set_focused(false); commit(); }}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          style={{
            width: 72,
            background: "transparent",
            border: "none",
            outline: "none",
            color: c.text,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "monospace",
            padding: "6px 0",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        />
      </div>
    </div>
  );
}
