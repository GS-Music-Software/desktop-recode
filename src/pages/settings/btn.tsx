import { useState } from "react";
import { c } from "@/theme";

export function Btn({ label, danger, on_click }: { label: string; danger?: boolean; on_click: () => void }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, flexShrink: 0,
        transition: "background 0.1s",
        ...(danger
          ? { background: hov ? c.accent_20 : c.accent_10, color: c.accent, border: `1px solid ${c.accent_15}` }
          : { background: hov ? c.card_alt_hover : c.card_alt, color: c.text }),
      }}
    >
      {label}
    </button>
  );
}
