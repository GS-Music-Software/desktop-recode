import { useState } from "react";
import { Check } from "lucide-react";
import { c } from "@/theme";

type Props = {
  checked: boolean;
  on_toggle: () => void;
  icon: React.ReactNode;
  icon_bg: string;
  label: string;
  sub: string;
};

export function CheckRow({ checked, on_toggle, icon, icon_bg, label, sub }: Props) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_toggle}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
        borderRadius: 10, textAlign: "left", width: "100%",
        background: hov ? c.w04 : "transparent",
        transition: "background 0.1s",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: checked ? "none" : `1.5px solid ${c.w20}`,
        background: checked ? c.spotify : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && <Check size={13} color={c.white} strokeWidth={3} />}
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0, background: icon_bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>{sub}</p>
      </div>
    </button>
  );
}
