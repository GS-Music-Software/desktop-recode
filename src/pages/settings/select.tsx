import { ChevronDown } from "lucide-react";
import { c } from "@/theme";

export function Select({ value, on_change, options }: { value: string; on_change: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <select
        value={value}
        onChange={(e) => on_change(e.target.value)}
        style={{
          appearance: "none",
          padding: "6px 28px 6px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          background: c.card_alt,
          color: c.text,
          border: `1px solid ${c.w08}`,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: c.w30 }} />
    </div>
  );
}
