import { c } from "@/theme";

export function Toggle({ on, set_on }: { on: boolean; set_on: (v: boolean) => void }) {
  return (
    <button
      onClick={() => set_on(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0, position: "relative",
        background: on ? c.accent : c.w12,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%", background: c.white,
        transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 1px 4px ${c.b40}`,
      }} />
    </button>
  );
}
