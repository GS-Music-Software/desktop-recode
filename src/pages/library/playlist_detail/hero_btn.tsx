import { useState } from "react";
import type { Play } from "lucide-react";
import { c } from "@/theme";

export function HeroBtn({ label, icon: Icon, on_click, fill }: { label: string; icon: typeof Play; on_click: () => void; fill?: boolean }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 24px", borderRadius: 24,
        fontSize: 14, fontWeight: 600, color: c.white,
        background: hov ? c.accent_90 : c.accent_75,
        transition: "background 0.15s",
      }}
    >
      <Icon size={16} fill={fill ? c.white : "none"} />
      {label}
    </button>
  );
}
