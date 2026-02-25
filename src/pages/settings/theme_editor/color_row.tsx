import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { c } from "@/theme";
import { ColorPicker } from "@/components/color_picker";

type Props = {
  label: string;
  description?: string;
  value: string;
  on_change: (hex: string) => void;
  open: boolean;
  on_toggle: () => void;
};

export function ColorRow({
  label,
  description,
  value,
  on_change,
  open,
  on_toggle,
}: Props) {
  const [hov, set_hov] = useState(false);
  const [visible, set_visible] = useState(false);
  const [closing, set_closing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      set_closing(false);
      set_visible(true);
    } else if (visible) {
      set_closing(true);
      timer.current = setTimeout(() => {
        set_visible(false);
        set_closing(false);
      }, 200);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [open]);

  return (
    <div>
      <button
        onClick={on_toggle}
        onMouseEnter={() => set_hov(true)}
        onMouseLeave={() => set_hov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 12,
          padding: "14px 0",
          cursor: "pointer",
          transition: "opacity 0.1s",
          opacity: hov ? 1 : 0.85,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: value,
            border: "1.5px solid rgba(255,255,255,0.12)",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
        <div style={{ flex: 1, textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
            {label}
          </p>
          {description && (
            <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
              {description}
            </p>
          )}
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: c.w30,
            fontFamily: "monospace",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginRight: 4,
          }}
        >
          {value}
        </p>
        <ChevronDown
          size={14}
          color={c.w25}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>
      {visible && (
        <div className={closing ? "picker-exit" : "picker-enter"}>
          <ColorPicker value={value} on_change={on_change} />
        </div>
      )}
    </div>
  );
}
