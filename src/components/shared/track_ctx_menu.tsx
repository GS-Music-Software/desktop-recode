import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { use_lib } from "@/ctx";
import { TTrack } from "@/types";
import { Plus, Heart } from "lucide-react";
import { c } from "@/theme";

type Props = {
  x: number;
  y: number;
  track: TTrack;
  on_close: () => void;
};

function MenuItem({ label, icon: Icon, on_click, danger }: { label: string; icon: typeof Plus; on_click: () => void; danger?: boolean }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); on_click(); }}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "7px 10px", borderRadius: 6,
        fontSize: 13, fontWeight: 500, textAlign: "left",
        background: hov ? (danger ? c.accent_15 : c.w08) : "transparent",
        color: danger ? c.accent : c.text,
        transition: "background 0.1s",
      }}
    >
      <Icon size={14} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

export function TrackCtxMenu({ x, y, track, on_close }: Props) {
  const { playlists, load_playlists, is_fav, toggle_fav } = use_lib();
  const fav = is_fav(track.path);

  useEffect(() => {
    const close = () => on_close();
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [on_close]);

  const add_to = async (pl_id: string) => {
    await invoke("pl_add_track", { id: pl_id, trackPath: track.path }).catch(e => console.error("pl_add_track:", e));
    load_playlists();
    on_close();
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menu_w = 200;
  const est_h = 36 + 9 + 32 + playlists.length * 36;
  const left = x + menu_w > vw ? vw - menu_w - 8 : x;
  const top = y + est_h > vh ? Math.max(8, vh - est_h - 8) : y;

  return createPortal(
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "fixed", left, top, zIndex: 10000,
      background: c.dropdown,
      border: `1px solid ${c.w10}`,
      borderRadius: 10, padding: 4, width: menu_w,
      boxShadow: `0 8px 32px ${c.b50}`,
      backdropFilter: "blur(20px)",
    }}>
      <MenuItem
        label={fav ? "Remove from Favorites" : "Add to Favorites"}
        icon={Heart}
        on_click={() => { toggle_fav(track.path); on_close(); }}
      />
      <div style={{ height: 1, background: c.w08, margin: "4px 6px" }} />
      <p style={{
        fontSize: 11, fontWeight: 600, color: c.w30,
        padding: "6px 10px 4px", textTransform: "uppercase", letterSpacing: "0.04em",
      }}>Add to Playlist</p>
      {playlists.length === 0 && (
        <p style={{ fontSize: 12, color: c.w25, padding: "8px 10px" }}>No playlists yet</p>
      )}
      {playlists.map(pl => (
        <MenuItem key={pl.id} label={pl.name} icon={Plus} on_click={() => add_to(pl.id)} />
      ))}
    </div>,
    document.body,
  );
}
