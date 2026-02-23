import { useState, type ReactNode } from "react";
import { c } from "@/theme";

type Props = { icon: ReactNode; title: string; desc: string; action?: { label: string; on_click: () => void } };

export function Empty({ icon, title, desc, action }: Props) {
  const [hov, set_hov] = useState(false);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ color: c.w30 }}>{icon}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: c.text }}>{title}</h2>
        <p style={{ fontSize: 14, color: c.w50, textAlign: "center", maxWidth: 300 }}>{desc}</p>
      </div>
      {action && (
        <button
          onClick={action.on_click}
          onMouseEnter={() => set_hov(true)}
          onMouseLeave={() => set_hov(false)}
          style={{ marginTop: 12, padding: "10px 28px", borderRadius: 9999, fontSize: 14, fontWeight: 600, background: hov ? c.accent_hover : c.accent, color: c.white, transition: "background 0.15s" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
