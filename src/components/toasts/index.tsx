import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { use_toast, type Toast } from "@/ctx";
import { c } from "@/theme";

const tints = {
  success: { bg: "linear-gradient(135deg, rgba(16,30,20,0.97), rgba(20,24,20,0.97))", border: "rgba(74,222,128,0.18)", icon: c.success },
  error: { bg: "linear-gradient(135deg, rgba(35,16,16,0.97), rgba(24,18,18,0.97))", border: "rgba(239,68,68,0.2)", icon: "#ef4444" },
  progress: { bg: "linear-gradient(135deg, rgba(14,18,32,0.97), rgba(16,18,24,0.97))", border: "rgba(120,140,255,0.15)", icon: c.accent },
};

function ProgressRing({ pct }: { pct: number }) {
  const r = 9;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="24" height="24" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="12" cy="12" r={r} fill="none" stroke={c.accent} strokeWidth="2"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
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
    timer.current = setTimeout(on_dismiss, 200);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const is_done = toast.type === "success" || toast.type === "error";

  useEffect(() => {
    if (is_done) {
      const t = setTimeout(handle_dismiss, toast.type === "error" ? 6000 : 4000);
      return () => clearTimeout(t);
    }
  }, [is_done, toast.type]);

  const is_progress = toast.type === "progress";
  const tint = tints[toast.type];

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 14,
        background: tint.bg,
        border: `1px solid ${tint.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        width: 320,
        minWidth: 320,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {is_progress && (
        <div style={{ flexShrink: 0, position: "relative", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ProgressRing pct={toast.pct ?? 0} />
        </div>
      )}
      {toast.type === "success" && <CheckCircle2 size={18} color={tint.icon} style={{ flexShrink: 0 }} />}
      {toast.type === "error" && <AlertCircle size={18} color={tint.icon} style={{ flexShrink: 0 }} />}

      {toast.cover_url && (
        <img src={toast.cover_url} style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: c.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {toast.title}
        </p>
        {toast.sub && (
          <p style={{
            fontSize: 11, color: c.w45, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {toast.sub}
          </p>
        )}
      </div>

      <button
        onClick={handle_dismiss}
        style={{ flexShrink: 0, color: c.w30, padding: 2, display: "flex", alignItems: "center" }}
        onMouseEnter={e => (e.currentTarget.style.color = c.white)}
        onMouseLeave={e => (e.currentTarget.style.color = c.w30)}
      >
        <X size={14} />
      </button>

      {is_progress && (
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          height: 2, borderRadius: "0 0 14px 14px",
          width: `${toast.pct ?? 0}%`,
          background: c.accent,
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
      position: "fixed", bottom: 96, right: 16,
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
