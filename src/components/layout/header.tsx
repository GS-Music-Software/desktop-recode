import { SearchBar } from "./search_bar";
import type { ReactNode } from "react";
import { c } from "@/theme";

export function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div
      className="page-header"
      style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, borderBottom: `1px solid ${c.w07}` }}
      data-tauri-drag-region
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", color: c.text }}>{title}</h1>
        {actions}
      </div>
      <SearchBar />
    </div>
  );
}
