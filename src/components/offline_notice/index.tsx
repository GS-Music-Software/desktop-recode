import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { c } from "@/theme";

export function OfflineNotice() {
  const [offline, set_offline] = useState(!navigator.onLine);
  const [dismissed, set_dismissed] = useState(false);

  useEffect(() => {
    const go_offline = () => { set_offline(true); set_dismissed(false); };
    const go_online = () => set_offline(false);
    window.addEventListener("offline", go_offline);
    window.addEventListener("online", go_online);
    return () => {
      window.removeEventListener("offline", go_offline);
      window.removeEventListener("online", go_online);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      background: c.b35,
    }}>
      <div style={{
        width: 420, padding: "32px 36px",
        borderRadius: 18,
        background: c.modal,
        border: `1px solid ${c.w08}`,
        boxShadow: `0 24px 80px ${c.b70}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 20, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: c.accent_10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <WifiOff size={26} color={c.accent} />
        </div>

        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: 0, marginBottom: 10 }}>
            No Internet Connection
          </h2>
          <p style={{ fontSize: 14, color: c.w50, lineHeight: 1.6, margin: 0 }}>
            GS Music has detected your system does not have an active internet connection.
          </p>
          <p style={{ fontSize: 13, color: c.w35, lineHeight: 1.6, margin: 0, marginTop: 10 }}>
            Some features like downloading music, listening to radio, and migrating will be unavailable during this time. You will only be able to use your downloaded music.
          </p>
        </div>

        <button
          onClick={() => set_dismissed(true)}
          style={{
            padding: "10px 32px", borderRadius: 10,
            background: c.w10,
            color: c.text, fontSize: 14, fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = c.w15)}
          onMouseLeave={e => (e.currentTarget.style.background = c.w10)}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
