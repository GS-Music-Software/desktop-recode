import { useState } from "react";
import { Art } from "./art";
import { c } from "@/theme";

type Props = { title: string; sub: string; cover_path: string | null; on_click: () => void; circle?: boolean };

export function GridCard({ title, sub, cover_path, on_click, circle = false }: Props) {
  const [hov, set_hov] = useState(false);

  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: 10, borderRadius: 12, background: hov ? c.w05 : "transparent", transition: "background 0.1s", textAlign: "left", width: "100%" }}
    >
      <Art path={cover_path} w="100%" h="auto" radius={circle ? "50%" : 10} style={{ aspectRatio: "1" }} />
      <div style={{ minWidth: 0, paddingInline: 2 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        <p style={{ fontSize: 12, color: c.w50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{sub}</p>
      </div>
    </button>
  );
}
