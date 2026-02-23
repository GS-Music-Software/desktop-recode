import { Download, Check, X } from "lucide-react";
import type { DlState } from "../types";
import { c } from "@/theme";

export function DlButton({
  dl,
  on_click,
  on_retry,
}: {
  dl: DlState | undefined;
  on_click: () => void;
  on_retry: () => void;
}) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!dl && (
        <button
          onClick={on_click}
          style={{ color: c.w40, transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = c.white)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = c.w40)
          }
        >
          <Download size={16} />
        </button>
      )}
      {dl && !dl.done && !dl.err && (
        <div style={{ position: "relative", width: 28, height: 28 }}>
          <svg width="28" height="28" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke={c.w10}
              strokeWidth="2.5"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke={c.accent}
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - dl.pct / 100)}`}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              color: c.w60,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(dl.pct)}
          </span>
        </div>
      )}
      {dl?.done && <Check size={16} color={c.success} />}
      {dl?.err && (
        <button onClick={on_retry} title={dl.err ?? ""}>
          <X size={16} color={c.accent} />
        </button>
      )}
    </div>
  );
}
