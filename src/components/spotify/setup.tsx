import { useState } from "react";
import { Modal } from "@/components/modal";
import { c } from "@/theme";

type Props = {
  initial_id: string;
  on_save: (id: string) => void;
  on_close: () => void;
};

export function SpotifySetup({ initial_id, on_save, on_close }: Props) {
  const [id, set_id] = useState(initial_id);

  return (
    <Modal on_close={on_close} width={440}>
      {(close) => {
        const handle_save = () => {
          const trimmed = id.trim();
          if (!trimmed) return;
          on_save(trimmed);
          close();
        };

        return (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20 }}>Spotify Setup</h2>

            <div style={{ fontSize: 13, color: c.w50, lineHeight: 1.8 }}>
              <p>1. Go to <span style={{ color: c.text, fontWeight: 500 }}>developer.spotify.com/dashboard</span></p>
              <p>2. Create an app (any name)</p>
              <p>3. Set redirect URI to:</p>
              <p style={{
                fontFamily: "monospace", fontSize: 12, color: c.accent,
                background: c.w04, padding: "6px 10px",
                borderRadius: 6, margin: "4px 0 4px 0", display: "inline-block",
              }}>http://127.0.0.1:18492/callback</p>
              <p>4. Copy the Client ID and paste it below</p>
            </div>

            <input
              value={id}
              onChange={e => set_id(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle_save()}
              placeholder="Paste Client ID here"
              style={{
                width: "100%", marginTop: 16, padding: "10px 12px",
                borderRadius: 8, fontSize: 13,
                background: c.w06,
                border: `1px solid ${c.w10}`,
                color: c.text, outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={close} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.w06, color: c.w50,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
              >Cancel</button>
              <button onClick={handle_save} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.spotify, color: c.white,
                transition: "opacity 0.15s", opacity: id.trim() ? 1 : 0.5,
              }}
                onMouseEnter={e => { if (id.trim()) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => (e.currentTarget.style.opacity = id.trim() ? "1" : "0.5")}
              >Save</button>
            </div>
          </>
        );
      }}
    </Modal>
  );
}
