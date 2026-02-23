import { useState, useEffect } from "react";
import { use_lib } from "@/ctx";
import { invoke } from "@tauri-apps/api/core";
import { TPlaylist } from "@/types";
import { PlCreateModal } from "@/components/pl_create_modal";
import { Plus, ListMusic, Heart, Trash2, type LucideIcon } from "lucide-react";
import { c } from "@/theme";

function PlNavBtn({ label, icon: Icon, active, on_click }: { label: string; icon: LucideIcon; active: boolean; on_click: () => void }) {
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
      <Icon size={16} strokeWidth={active ? 2 : 1.5} color={active ? c.accent : "currentColor"} />
      {label}
    </button>
  );
}

function CtxMenu({ x, y, on_delete, on_close }: { x: number; y: number; on_delete: () => void; on_close: () => void }) {
  const [hov, set_hov] = useState(false);

  useEffect(() => {
    const close = () => on_close();
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [on_close]);

  return (
    <div style={{
      position: "fixed", left: x, top: y, zIndex: 10000,
      background: c.dropdown,
      border: `1px solid ${c.w10}`,
      borderRadius: 10, padding: 4, minWidth: 140,
      boxShadow: `0 8px 32px ${c.b50}`,
      backdropFilter: "blur(20px)",
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); on_delete(); }}
        onMouseEnter={() => set_hov(true)}
        onMouseLeave={() => set_hov(false)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "7px 10px", borderRadius: 6,
          fontSize: 13, fontWeight: 500, textAlign: "left",
          background: hov ? c.accent_15 : "transparent",
          color: c.accent,
          transition: "background 0.1s",
        }}
      >
        <Trash2 size={14} />
        Delete Playlist
      </button>
    </div>
  );
}

function PlItem({ name, active, on_click, on_ctx }: { name: string; active: boolean; on_click: () => void; on_ctx: (e: React.MouseEvent) => void }) {
  const [hov, set_hov] = useState(false);

  return (
    <button
      onClick={on_click}
      onContextMenu={on_ctx}
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
      <ListMusic size={16} strokeWidth={active ? 2 : 1.5} color={active ? c.accent : "currentColor"} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
    </button>
  );
}

export function SbPlaylists() {
  const { playlists, selected_playlist, view, set_view, set_album, set_artist, set_playlist, load_playlists } = use_lib();
  const [show_create, set_show_create] = useState(false);
  const [ctx, set_ctx] = useState<{ x: number; y: number; pl: TPlaylist } | null>(null);

  const on_create = async (name: string, description: string, cover: string | null) => {
    try {
      const pl = await invoke<TPlaylist>("pl_create", { name, description, cover });
      await load_playlists();
      set_playlist(pl);
      set_album(null);
      set_artist(null);
      set_view("playlist_detail");
    } catch (e) { console.error("pl_create:", e); }
    set_show_create(false);
  };

  const on_delete = async () => {
    if (!ctx) return;
    try {
      await invoke("pl_delete", { id: ctx.pl.id });
      await load_playlists();
      if (selected_playlist?.id === ctx.pl.id) {
        set_view("songs");
      }
    } catch (e) { console.error("pl_delete:", e); }
    set_ctx(null);
  };

  const on_playlist = (pl: TPlaylist) => {
    set_playlist(pl);
    set_album(null);
    set_artist(null);
    set_view("playlist_detail");
  };

  const on_right_click = (e: React.MouseEvent, pl: TPlaylist) => {
    e.preventDefault();
    e.stopPropagation();
    set_ctx({ x: e.clientX, y: e.clientY, pl });
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PlNavBtn
          label="Create New"
          icon={Plus}
          active={false}
          on_click={() => set_show_create(true)}
        />
        <PlNavBtn
          label="Favorite Songs"
          icon={Heart}
          active={view === "playlist_detail" && selected_playlist?.id === "__favorites"}
          on_click={async () => {
            try {
              const fav_pl = await invoke<TPlaylist>("pl_favs");
              set_playlist(fav_pl);
              set_album(null);
              set_artist(null);
              set_view("playlist_detail");
            } catch (e) { console.error("pl_favs:", e); }
          }}
        />
        {playlists.map((pl) => (
          <PlItem
            key={pl.id}
            name={pl.name}
            active={view === "playlist_detail" && selected_playlist?.id === pl.id}
            on_click={() => on_playlist(pl)}
            on_ctx={(e) => on_right_click(e, pl)}
          />
        ))}
      </div>

      {ctx && (
        <CtxMenu
          x={ctx.x}
          y={ctx.y}
          on_delete={on_delete}
          on_close={() => set_ctx(null)}
        />
      )}

      {show_create && (
        <PlCreateModal
          on_create={on_create}
          on_close={() => set_show_create(false)}
        />
      )}
    </>
  );
}
