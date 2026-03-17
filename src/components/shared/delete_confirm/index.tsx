import { useState } from "react";
import { Modal } from "@/components/modal";
import { c } from "@/theme";

type Props = {
  track_title: string;
  on_confirm: (dont_ask_again: boolean) => void;
  on_cancel: () => void;
};

export function DeleteConfirm({ track_title, on_confirm, on_cancel }: Props) {
  const [dont_ask, set_dont_ask] = useState(false);

  return (
    <Modal on_close={on_cancel} portal>
      {(close) => (
        <>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 16 }}>Delete Song</h2>

          <p style={{ fontSize: 13, color: c.w50, lineHeight: 1.55, marginBottom: 20 }}>
            Are you sure you want to permanently delete{" "}
            <span style={{ color: c.text, fontWeight: 600 }}>{track_title}</span>?
            This cannot be undone.
          </p>

          <label style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 24, cursor: "pointer", fontSize: 13, color: c.w40,
          }}>
            <button
              onClick={() => set_dont_ask(v => !v)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                background: dont_ask ? c.accent : c.w06,
                border: `1px solid ${dont_ask ? c.accent : c.w15}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {dont_ask && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            Don't ask me again
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={close} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: c.w06, color: c.w50,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
              onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
            >Cancel</button>
            <button onClick={() => on_confirm(dont_ask)} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: c.accent, color: c.white,
              transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Delete</button>
          </div>
        </>
      )}
    </Modal>
  );
}
