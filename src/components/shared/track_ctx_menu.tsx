import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { use_lib } from "@/ctx";
import { TTrack } from "@/types";
import { Plus, Heart, Trash2, Disc3, User } from "lucide-react";
import { DeleteConfirm } from "./delete_confirm";
import { c } from "@/theme";

type Props = {
  x: number;
  y: number;
  track: TTrack;
  on_close: () => void;
  on_immersive_close?: () => void;
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

const SKIP_DELETE_KEY = "skip_delete_confirm";

export function TrackCtxMenu({ x, y, track, on_close, on_immersive_close }: Props) {
  const { playlists, load_playlists, is_fav, toggle_fav, music_dir, load_library, albums, artists, set_album, set_artist, set_view } = use_lib();
  const fav = is_fav(track.path);
  const [show_confirm, set_show_confirm] = useState(false);

  useEffect(() => {
    if (show_confirm) return;
    const close = () => on_close();
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [on_close, show_confirm]);

  const add_to = async (pl_id: string) => {
    await invoke("pl_add_track", { id: pl_id, trackPath: track.path }).catch(e => console.error("pl_add_track:", e));
    load_playlists();
    on_close();
  };

  const do_delete = async () => {
    await invoke("delete_track", { path: track.path }).catch(e => console.error("delete_track:", e));
    if (music_dir) await load_library(music_dir);
    on_close();
  };

  const handle_delete_click = () => {
    if (localStorage.getItem(SKIP_DELETE_KEY) === "1") {
      do_delete();
      return;
    }
    set_show_confirm(true);
  };

  const handle_confirm = (dont_ask_again: boolean) => {
    if (dont_ask_again) localStorage.setItem(SKIP_DELETE_KEY, "1");
    do_delete();
  };

  const go_album = () => {
    const al = albums.find(a => a.name === track.album && a.artist === track.artist);
    if (al) { set_album(al); set_view("album_detail"); on_immersive_close?.(); on_close(); }
  };

  const go_artist = () => {
    const ar = artists.find(a => a.name === track.artist);
    if (ar) { set_artist(ar); set_view("artist_detail"); on_immersive_close?.(); on_close(); }
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menu_w = 200;
  const est_h = 36 + 9 + 36 + 36 + 8 + 32 + playlists.length * 36 + 9 + 36;
  const left = x + menu_w > vw ? vw - menu_w - 8 : x;
  const top = y + est_h > vh ? Math.max(8, vh - est_h - 8) : y;

  return (
    <>
      {createPortal(
        <>
          <div
            onClick={on_close}
            onContextMenu={e => { e.preventDefault(); on_close(); }}
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          />
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
            <MenuItem label="Go to Album" icon={Disc3} on_click={go_album} />
            <MenuItem label="Go to Artist" icon={User} on_click={go_artist} />
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
            <div style={{ height: 1, background: c.w08, margin: "4px 6px" }} />
            <MenuItem label="Delete Song" icon={Trash2} on_click={handle_delete_click} danger />
          </div>
        </>,
        document.body,
      )}
      {show_confirm && (
        <DeleteConfirm
          track_title={track.title}
          on_confirm={handle_confirm}
          on_cancel={() => { set_show_confirm(false); on_close(); }}
        />
      )}
    </>
  );
}
