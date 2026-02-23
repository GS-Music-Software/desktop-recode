import { useEffect, useRef, useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { use_toast, type Toast } from "@/ctx";
import { c } from "@/theme";

function ProgressRing({ pct }: { pct: number }) {
  const r = 10;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="28" height="28" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke={c.w12} strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={c.accent} strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 0.3s linear" }}
      />
    </svg>
  );
}

function ToastItem({ toast, on_dismiss }: { toast: Toast; on_dismiss: () => void }) {
  const [exiting, set_exiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handle_dismiss() {
    set_exiting(true);
    timer.current = setTimeout(on_dismiss, 220);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const is_done = toast.type === "success" || toast.type === "error";

  useEffect(() => {
    if (is_done) {
      const t = setTimeout(handle_dismiss, toast.type === "error" ? 6000 : 4000);
      return () => clearTimeout(t);
    }
  }, [is_done, toast.type]);

  const accent = toast.type === "success" ? c.success : toast.type === "error" ? c.accent : c.accent;

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        borderRadius: 14,
        background: c.w08,
        backdropFilter: "blur(40px) saturate(1.8) brightness(1.1)",
        WebkitBackdropFilter: "blur(40px) saturate(1.8) brightness(1.1)",
        border: `1px solid ${c.w14}`,
        boxShadow: `0 8px 32px ${c.b35}, 0 1px 0 ${c.w12} inset`,
        width: 320, minWidth: 320,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {toast.type === "progress" && toast.pct !== undefined && (
        <div style={{ flexShrink: 0, position: "relative", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ProgressRing pct={toast.pct} />
          <span style={{ position: "absolute", fontSize: 7, color: c.w60, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(toast.pct)}
          </span>
        </div>
      )}
      {toast.type === "success" && <Check size={18} color={accent} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
      {toast.type === "error" && <AlertCircle size={18} color={accent} style={{ flexShrink: 0 }} />}

      {toast.cover_url && toast.type !== "progress" && (
        <img src={toast.cover_url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      )}
      {toast.cover_url && toast.type === "progress" && (
        <img src={toast.cover_url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.title}</p>
        {toast.sub && <p style={{ fontSize: 11, color: c.w45, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.sub}</p>}
      </div>

      <button onClick={handle_dismiss} style={{ flexShrink: 0, color: c.w30, transition: "color 0.15s", padding: 2 }}
        onMouseEnter={e => (e.currentTarget.style.color = c.white)}
        onMouseLeave={e => (e.currentTarget.style.color = c.w30)}
      >
        <X size={14} />
      </button>

      {toast.type === "progress" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          height: 2, borderRadius: "0 0 14px 14px",
          width: `${toast.pct ?? 0}%`,
          background: c.accent_gradient_h,
          transition: "width 0.3s linear",
        }} />
      )}
    </div>
  );
}

export function Toasts() {
  const { toasts, dismiss } = use_toast();

  return (
    <div style={{
      position: "fixed", bottom: 72, right: 16,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} on_dismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
