import { useState } from "react";
import { use_lib } from "@/ctx";
import { check_server_health } from "@/lib/server";
import { c } from "@/theme";

type Props = { on_back: () => void; on_next: () => void };

export function ServerConnect({ on_back, on_next }: Props) {
  const { connect_server, library_mode, server_url } = use_lib();
  const [url, set_url] = useState(server_url ?? "");
  const [connecting, set_connecting] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  const connected = library_mode === "server";

  async function try_connect() {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) return;
    set_connecting(true);
    set_error(null);
    try {
      await check_server_health(trimmed);
      await connect_server(trimmed);
    } catch (e) {
      set_error("Couldn't connect. Check the URL and make sure the server is running.");
    } finally {
      set_connecting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 64px", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Connect to<br />Server
        </h2>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 360, fontWeight: 400, margin: 0 }}>
          Enter the URL of your GS Music server to stream your library remotely.
        </p>
      </div>

      {connected ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: c.w30, margin: 0 }}>Connected to</p>
            <p style={{ fontSize: 14, color: c.w70, margin: 0 }}>{server_url}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={on_back} style={sec_btn} onMouseEnter={hover_in} onMouseLeave={hover_out}>Back</button>
            <button
              onClick={on_next}
              style={{ padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, transition: "opacity 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="text"
            value={url}
            onChange={e => set_url(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") try_connect(); }}
            placeholder="http://192.168.1.100:7700"
            style={{
              padding: "12px 16px", borderRadius: 10, fontSize: 14,
              background: c.w04, border: `1px solid ${error ? "rgba(239,68,68,0.5)" : c.w10}`,
              color: c.text, outline: "none", width: 320,
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = c.w20)}
            onBlur={e => (e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : c.w10)}
          />
          {error && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={on_back} style={sec_btn} onMouseEnter={hover_in} onMouseLeave={hover_out}>Back</button>
            <button
              onClick={try_connect}
              disabled={connecting || !url.trim()}
              style={{
                padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: c.accent, color: c.white,
                opacity: connecting || !url.trim() ? 0.5 : 1,
                transition: "opacity 0.12s",
              }}
              onMouseEnter={e => { if (!connecting && url.trim()) e.currentTarget.style.opacity = "0.82"; }}
              onMouseLeave={e => (e.currentTarget.style.opacity = connecting || !url.trim() ? "0.5" : "1")}
            >
              {connecting ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const sec_btn: React.CSSProperties = {
  padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500,
  background: c.w07, color: c.w55, border: `1px solid ${c.w08}`, transition: "opacity 0.12s",
};

const hover_in = (e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = "0.7");
const hover_out = (e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = "1");
