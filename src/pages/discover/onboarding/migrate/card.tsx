import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { c } from "@/theme";

type Props = {
  label: string;
  sub: string;
  color: string;
  icon: React.ReactNode;
  on_click: () => void;
};

export function Card({ label, sub, color, icon, on_click }: Props) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        borderRadius: 12, textAlign: "left", width: "100%",
        background: hov ? c.w06 : c.w03,
        border: `1px solid ${hov ? `${color}33` : c.w08}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{label}</p>
        <p style={{ fontSize: 12, color: c.w35, marginTop: 2 }}>{sub}</p>
      </div>
      <ChevronLeft size={16} color={c.w20} style={{ transform: "rotate(180deg)", flexShrink: 0 }} />
    </button>
  );
}
