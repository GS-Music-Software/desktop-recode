import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { c } from "@/theme";

export function ShufflePlayBtn({ icon: Icon, label, on_click }: { icon: LucideIcon; label: string; on_click: () => void }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
        borderRadius: 20, fontSize: 12, fontWeight: 600, color: c.white,
        background: hov ? c.accent_90 : c.accent_75,
        transition: "background 0.15s",
      }}
    >
      <Icon size={13} fill="currentColor" strokeWidth={0} />
      {label}
    </button>
  );
}
