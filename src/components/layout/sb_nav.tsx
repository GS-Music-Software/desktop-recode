import { useState } from "react";
import { use_lib } from "@/ctx";
import { TView } from "@/types";
import { Music, Disc3, Users, Settings, Download, SlidersHorizontal, Radio, type LucideIcon } from "lucide-react";
import { c } from "@/theme";

type NavItem = { id: TView; label: string; icon: LucideIcon; divider?: boolean };

export const NAV_LIB: NavItem[] = [
  { id: "songs", label: "Songs", icon: Music },
  { id: "albums", label: "Albums", icon: Disc3 },
  { id: "artists", label: "Artists", icon: Users },
];

export const NAV_OTHER: NavItem[] = [
  { id: "radio", label: "Radio", icon: Radio },
  { id: "discover", label: "Discover", icon: Download },
  { id: "audio", label: "Audio", icon: SlidersHorizontal },
  { id: "settings", label: "Settings", icon: Settings },
];

function NavBtn({ n, active, on_click }: { n: NavItem; active: boolean; on_click: () => void }) {
  const [hov, set_hov] = useState(false);

  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        width: "100%",
        textAlign: "left",
        background: active ? c.w10 : hov ? c.w05 : "transparent",
        color: active ? c.text : hov ? c.text : c.w50,
        transition: "background 0.1s, color 0.1s",
      }}
    >
      <n.icon size={16} strokeWidth={active ? 2 : 1.5} color={active ? c.accent : "currentColor"} />
      {n.label}
    </button>
  );
}

export function SbNav({ items }: { items: NavItem[] }) {
  const { view, set_view, set_album, set_artist } = use_lib();

  const on_nav = (v: TView) => {
    set_view(v);
    set_album(null);
    set_artist(null);
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map((n) => (
        <NavBtn key={n.id} n={n} active={view === n.id} on_click={() => on_nav(n.id)} />
      ))}
    </nav>
  );
}
