import { c } from "@/theme";

type Props = { on_next: () => void };

export function StepWelcome({ on_next }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 64px", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, color: c.text, margin: 0 }}>
          Welcome.
        </h1>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 340, fontWeight: 400, margin: 0 }}>
          Your music, beautifully organised.<br />Let's get you set up.
        </p>
      </div>
      <button
        onClick={on_next}
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: c.accent, color: c.white, border: "none",
          transition: "opacity 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        Get started
      </button>
    </div>
  );
}
