import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/modal";
import { c } from "@/theme";

type Props = {
  current_name: string;
  on_rename: (name: string) => void;
  on_close: () => void;
};

export function PlRenameModal({ current_name, on_rename, on_close }: Props) {
  const [name, set_name] = useState(current_name);
  const input_ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input_ref.current) {
      input_ref.current.focus();
      input_ref.current.select();
    }
  }, []);

  return (
    <Modal on_close={on_close} width={380}>
      {(close) => {
        const handle_rename = () => {
          const trimmed = name.trim();
          if (!trimmed || trimmed === current_name) {
            close();
            return;
          }
          on_rename(trimmed);
          close();
        };

        return (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text }}>Rename Playlist</h2>
              <button
                onClick={close}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "transparent",
                  border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w06)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <X size={18} color={c.w50} />
              </button>
            </div>

            <input
              ref={input_ref}
              value={name}
              onChange={e => set_name(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle_rename()}
              placeholder="Playlist name"
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 8, fontSize: 13,
                background: c.w06,
                border: `1px solid ${c.w10}`,
                color: c.text, outline: "none",
                marginBottom: 24,
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={close} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.w06, color: c.w50,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
              >Cancel</button>
              <button onClick={handle_rename} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.accent, color: c.white,
                transition: "opacity 0.15s", opacity: name.trim() && name.trim() !== current_name ? 1 : 0.5,
              }}
                onMouseEnter={e => { if (name.trim() && name.trim() !== current_name) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => (e.currentTarget.style.opacity = name.trim() && name.trim() !== current_name ? "1" : "0.5")}
              >Rename</button>
            </div>
          </>
        );
      }}
    </Modal>
  );
}
