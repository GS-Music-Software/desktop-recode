import { useState, useEffect, useRef, useCallback } from "react";
import { use_lib } from "@/ctx";
import { invoke } from "@tauri-apps/api/core";
import { TPlaylist } from "@/types";
import { PlCreateModal } from "@/components/pl_create_modal";
import { PlRenameModal } from "@/components/pl_rename_modal";
import { Plus, ListMusic, Heart, Trash2, Pencil, type LucideIcon } from "lucide-react";
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

function CtxMenu({ x, y, on_rename, on_delete, on_close }: { x: number; y: number; on_rename: () => void; on_delete: () => void; on_close: () => void }) {
  const [hov_rename, set_hov_rename] = useState(false);
  const [hov_delete, set_hov_delete] = useState(false);

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
        onClick={(e) => { e.stopPropagation(); on_rename(); }}
        onMouseEnter={() => set_hov_rename(true)}
        onMouseLeave={() => set_hov_rename(false)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "7px 10px", borderRadius: 6,
          fontSize: 13, fontWeight: 500, textAlign: "left",
          background: hov_rename ? c.w08 : "transparent",
          color: c.text,
          transition: "background 0.1s",
        }}
      >
        <Pencil size={14} />
        Rename
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); on_delete(); }}
        onMouseEnter={() => set_hov_delete(true)}
        onMouseLeave={() => set_hov_delete(false)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "7px 10px", borderRadius: 6,
          fontSize: 13, fontWeight: 500, textAlign: "left",
          background: hov_delete ? c.accent_15 : "transparent",
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

type DragState = {
  idx: number;
  drop_idx: number;
};

export function SbPlaylists() {
  const { playlists, selected_playlist, view, set_view, set_album, set_artist, set_playlist, load_playlists, reorder_playlists } = use_lib();
  const [show_create, set_show_create] = useState(false);
  const [ctx, set_ctx] = useState<{ x: number; y: number; pl: TPlaylist } | null>(null);
  const [rename_modal, set_rename_modal] = useState<TPlaylist | null>(null);
  const [drag, set_drag] = useState<DragState | null>(null);
  const item_refs = useRef<(HTMLDivElement | null)[]>([]);
  const did_move = useRef(false);

  const get_drop_idx = useCallback((mouse_y: number) => {
    for (let i = 0; i < item_refs.current.length; i++) {
      const el = item_refs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (mouse_y < rect.top + rect.height / 2) return i;
    }
    return playlists.length;
  }, [playlists.length]);

  useEffect(() => {
    if (!drag) return;

    const on_move = (e: MouseEvent) => {
      did_move.current = true;
      set_drag(prev => prev ? { ...prev, drop_idx: get_drop_idx(e.clientY) } : null);
    };

    const on_up = () => {
      set_drag(prev => {
        if (!prev) return null;
        if (did_move.current) {
          let from = prev.idx;
          let to = prev.drop_idx;
          if (from !== to && from !== to - 1) {
            const ids = playlists.map(p => p.id);
            const [moved] = ids.splice(from, 1);
            if (to > from) to--;
            ids.splice(to, 0, moved);
            reorder_playlists(ids);
            invoke("pl_reorder", { ids }).catch(e => console.error("pl_reorder:", e));
          }
        }
        did_move.current = false;
        return null;
      });
    };

    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
    return () => {
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    };
  }, [drag, playlists, reorder_playlists, get_drop_idx]);

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

  const on_rename = async (name: string) => {
    if (!rename_modal) return;
    try {
      await invoke("pl_rename", { id: rename_modal.id, name });
      await load_playlists();
      if (selected_playlist?.id === rename_modal.id) {
        set_playlist({ ...rename_modal, name });
      }
    } catch (e) { console.error("pl_rename:", e); }
    set_rename_modal(null);
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
      <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
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
        {playlists.map((pl, i) => {
          const show_line_above = drag && drag.drop_idx === i && drag.idx !== i && drag.idx !== i - 1;
          const show_line_below = drag && drag.drop_idx === playlists.length && i === playlists.length - 1 && drag.idx !== i;

          return (
            <div
              key={pl.id}
              ref={(el) => { item_refs.current[i] = el; }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                did_move.current = false;
                set_drag({ idx: i, drop_idx: i });
              }}
              style={{
                position: "relative",
                userSelect: "none",
              }}
            >
              {show_line_above && (
                <div style={{
                  position: "absolute", top: -2, left: 12, right: 12, height: 2,
                  background: "var(--accent)", borderRadius: 1, zIndex: 5,
                }} />
              )}
              <PlItem
                name={pl.name}
                active={view === "playlist_detail" && selected_playlist?.id === pl.id}
                on_click={() => { if (!did_move.current) on_playlist(pl); }}
                on_ctx={(e) => on_right_click(e, pl)}
              />
              {show_line_below && (
                <div style={{
                  position: "absolute", bottom: -2, left: 12, right: 12, height: 2,
                  background: "var(--accent)", borderRadius: 1, zIndex: 5,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {ctx && (
        <CtxMenu
          x={ctx.x}
          y={ctx.y}
          on_rename={() => { set_rename_modal(ctx.pl); set_ctx(null); }}
          on_delete={on_delete}
          on_close={() => set_ctx(null)}
        />
      )}

      {rename_modal && (
        <PlRenameModal
          current_name={rename_modal.name}
          on_rename={on_rename}
          on_close={() => set_rename_modal(null)}
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
