import { useState } from "react";
import { BackBtn } from "../migrate/back_btn";
import { c } from "@/theme";

type Props = {
  on_back: () => void;
  on_save: (client_id: string) => void;
};

export function SpSetupView({ on_back, on_save }: Props) {
  const [input, set_input] = useState("");

  return (
    <>
      <BackBtn on_click={on_back} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Connect Spotify
        </h2>
        <div style={{ fontSize: 13, color: c.w40, lineHeight: 1.8, maxWidth: 380 }}>
          <p>
            1. Go to{" "}
            <span style={{ color: c.text, fontWeight: 500 }}>
              developer.spotify.com/dashboard
            </span>
          </p>
          <p>2. Create an app (any name)</p>
          <p>3. Set redirect URI to:</p>
          <p style={{
            fontFamily: "monospace", fontSize: 12, color: c.spotify,
            background: c.w04, padding: "6px 10px",
            borderRadius: 6, margin: "4px 0", display: "inline-block",
          }}>
            http://127.0.0.1:18492/callback
          </p>
          <p>4. Copy the Client ID and paste it below</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          value={input}
          onChange={(e) => set_input(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && input.trim() && on_save(input.trim())}
          placeholder="Paste Client ID here..."
          style={{
            width: 320, padding: "12px 16px", borderRadius: 10, fontSize: 14,
            background: c.w06,
            border: `1px solid ${c.w10}`,
            color: c.text, outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = c.spotify_50;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = c.w10;
          }}
        />
        <button
          onClick={() => input.trim() && on_save(input.trim())}
          disabled={!input.trim()}
          style={{
            alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, background: c.spotify, color: c.white,
            opacity: input.trim() ? 1 : 0.35, transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => {
            if (input.trim()) e.currentTarget.style.opacity = "0.82";
          }}
          onMouseLeave={(e) =>
            (e.currentTarget.style.opacity = input.trim() ? "1" : "0.35")
          }
        >
          Connect
        </button>
      </div>
    </>
  );
}
