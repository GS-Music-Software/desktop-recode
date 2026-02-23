import { ChevronLeft } from "lucide-react";
import { c } from "@/theme";

type Props = { on_click: () => void };

export function BackBtn({ on_click }: Props) {
  return (
    <button
      onClick={on_click}
      style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4, color: c.w35, fontSize: 13, background: "none", border: "none", marginBottom: -16 }}
      onMouseEnter={e => (e.currentTarget.style.color = c.w70)}
      onMouseLeave={e => (e.currentTarget.style.color = c.w35)}
    >
      <ChevronLeft size={14} /> Back
    </button>
  );
}
