import { c } from "@/theme";

type Props = {
  on_migrate_more: () => void;
  on_continue: () => void;
};

export function DoneView({ on_migrate_more, on_continue }: Props) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Migration<br />complete.
        </h2>
        <p style={{ fontSize: 15, color: c.w40, margin: 0, maxWidth: 340 }}>
          Your playlists have been imported. You can always add more later from the Discover page.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={on_migrate_more}
          style={{
            padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: c.w07, color: c.w55,
            border: `1px solid ${c.w08}`, transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Migrate more
        </button>
        <button
          onClick={on_continue}
          style={{
            padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: c.accent, color: c.white, transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Continue
        </button>
      </div>
    </>
  );
}
