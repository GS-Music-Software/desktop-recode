import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { c } from "@/theme";

export function Select({ value, on_change, options }: { value: string; on_change: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, set_open] = useState(false);
  const [hov, set_hov] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) set_open(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => set_open(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          background: c.card_alt,
          color: c.text,
          border: `1px solid ${c.w08}`,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        {current?.label ?? value}
        <ChevronDown
          size={12}
          color={c.w30}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
          minWidth: 160,
          borderRadius: 12,
          background: c.dropdown,
          border: `1px solid ${c.w10}`,
          boxShadow: `0 8px 32px ${c.b40}`,
          padding: 4,
          animation: "select-open 0.18s cubic-bezier(0.4,0,0.2,1) forwards",
          transformOrigin: "top right",
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { on_change(opt.value); set_open(false); }}
              onMouseEnter={() => set_hov(opt.value)}
              onMouseLeave={() => set_hov(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "7px 10px",
                borderRadius: 8,
                fontSize: 12, fontWeight: 500,
                color: opt.value === value ? c.text : c.w60,
                background: hov === opt.value ? c.w08 : "transparent",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
            >
              {opt.label}
              {opt.value === value && <Check size={13} color={c.accent} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
