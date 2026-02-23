import { c } from "@/theme";

export function Loading() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div className="dot-bounce" style={{ display: "flex", gap: 6 }}>
          <span /><span /><span />
        </div>
        <p style={{ fontSize: 14, color: c.w50 }}>Scanning library...</p>
      </div>
    </div>
  );
}
