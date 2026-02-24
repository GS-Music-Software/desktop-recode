import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { c } from "@/theme";

export function ShufflePlayBtn({ icon: Icon, label, on_click, filled = true }: { icon: LucideIcon; label: string; on_click: () => void; filled?: boolean }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
        borderRadius: 20, fontSize: 12, fontWeight: 600, color: c.white,
        background: hov ? c.accent_90 : c.accent_75,
        transition: "background 0.15s",
      }}
    >
      <Icon size={14} {...(filled ? { fill: "currentColor", strokeWidth: 0 } : { strokeWidth: 2.5 })} />
      {label}
    </button>
  );
}
