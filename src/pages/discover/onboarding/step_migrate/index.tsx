import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import { use_lib, use_settings } from "@/ctx";
import type { SpPlaylist, SpTrack } from "@/components/spotify/discover";
import type { YtPlaylistResult, YtTrack } from "@/components/youtube/discover";
import { SpSetupView } from "../views/sp_setup";
import { SpPlaylistsView } from "../views/sp_playlists";
import { YtInputView } from "../views/yt_input";
import { YtTracksView } from "../views/yt_tracks";
import { MigratingView } from "../views/migrating";
import { DoneView } from "../views/done";
import { HomeView } from "../views/home";

type View =
  | "home"
  | "sp_setup"
  | "sp_playlists"
  | "sp_migrating"
  | "yt_input"
  | "yt_tracks"
  | "yt_migrating"
  | "done";

type Props = { on_next: () => void };

export function StepMigrate({ on_next }: Props) {
  const { music_dir, load_library, load_playlists, toggle_fav } = use_lib();
  const { sp_client_id, set_sp_client_id, sp_tokens, sp_token, sp_connect, sp_loading } =
    use_settings();

  const [view, set_view] = useState<View>("home");
  const [sp_pls, set_sp_pls] = useState<SpPlaylist[] | null>(null);
  const [sp_pls_loading, set_sp_pls_loading] = useState(false);
  const [sp_checked, set_sp_checked] = useState<Set<string>>(new Set());
  const [sp_liked_checked, set_sp_liked_checked] = useState(true);

  const [yt_url, set_yt_url] = useState("");
  const [yt_loading, set_yt_loading] = useState(false);
  const [yt_tracks, set_yt_tracks] = useState<YtTrack[]>([]);
  const [yt_pl_name, set_yt_pl_name] = useState("");
  const [yt_progress, set_yt_progress] = useState<{
    phase: string;
    done: number;
    total: number;
  } | null>(null);

  const [mig_total, set_mig_total] = useState(0);
  const [mig_done, set_mig_done] = useState(0);
  const [mig_current, set_mig_current] = useState("");
  const [did_migrate, set_did_migrate] = useState(false);

  const dl_id_ref = useRef(0);
  const batch_ids = useRef<Set<number>>(new Set());
  const batch_paths = useRef<Map<number, string>>(new Map());
  const batch_done_count = useRef(0);
  const batch_total_count = useRef(0);
  const batch_queued = useRef(0);
  const batch_resolve = useRef<(() => void) | null>(null);
  const mig_offset = useRef(0);
  const mig_start = useRef(0);
  const lib_ref = useRef({ music_dir, load_library, load_playlists, toggle_fav });
  lib_ref.current = { music_dir, load_library, load_playlists, toggle_fav };

  function check_batch_done() {
    if (
      batch_queued.current >= batch_total_count.current &&
      batch_done_count.current >= batch_total_count.current &&
      batch_resolve.current
    ) {
      batch_resolve.current();
      batch_resolve.current = null;
    }
  }

  useEffect(() => {
    const u1 = listen<{ id: number; pct: number }>("dl_progress", () => {});
    const u2 = listen<{ id: number; path: string | null; err: string | null }>(
      "dl_done",
      ({ payload }) => {
        if (!batch_ids.current.has(payload.id)) return;
        batch_done_count.current++;
        if (payload.path && !payload.err)
          batch_paths.current.set(payload.id, payload.path);
        set_mig_done(mig_offset.current + batch_done_count.current);
        check_batch_done();
      },
    );
    const u3 = listen<{
      phase: string;
      done: number;
      total: number;
      title: string;
    }>("yt_import_progress", ({ payload }) => {
      set_yt_progress({
        phase: payload.phase,
        done: payload.done,
        total: payload.total,
      });
    });
    return () => {
      u1.then((f) => f());
      u2.then((f) => f());
      u3.then((f) => f());
    };
  }, []);

  function download_batch(
    tracks: {
      artist: string;
      title: string;
      album: string;
      cover_url: string;
      duration: number;
    }[],
  ): Promise<Map<number, string>> {
    if (tracks.length === 0) return Promise.resolve(new Map());
    return new Promise((resolve) => {
      batch_ids.current = new Set();
      batch_paths.current = new Map();
      batch_done_count.current = 0;
      batch_queued.current = 0;
      batch_total_count.current = tracks.length;
      batch_resolve.current = () => {
        mig_offset.current += tracks.length;
        resolve(new Map(batch_paths.current));
      };

      let i = 0;
      function next() {
        if (i >= tracks.length) return;
        const t = tracks[i];
        const dl_id = dl_id_ref.current++;
        batch_ids.current.add(dl_id);
        batch_queued.current++;
        set_mig_current(`${t.title} — ${t.artist}`);
        invoke("download_track", {
          id: dl_id,
          artist: t.artist,
          title: t.title,
          album: t.album,
          coverUrl: t.cover_url,
          duration: t.duration,
          saveDir: music_dir ?? undefined,
        }).catch(e => {
          console.error("migrate download:", e);
          batch_done_count.current++;
          set_mig_done(mig_offset.current + batch_done_count.current);
          check_batch_done();
        });
        i++;
        if (i < tracks.length) setTimeout(next, 300);
      }
      next();
    });
  }

  async function open_spotify() {
    if (sp_tokens) {
      set_view("sp_playlists");
      load_sp_playlists();
    } else if (sp_client_id) {
      try {
        await sp_connect();
        set_view("sp_playlists");
        load_sp_playlists();
      } catch (e) {
        console.error("open_spotify:", e);
        set_view("sp_setup");
      }
    } else {
      set_view("sp_setup");
    }
  }

  async function sp_setup_save(client_id: string) {
    set_sp_client_id(client_id);
    try {
      await sp_connect(client_id);
      set_view("sp_playlists");
      load_sp_playlists();
    } catch (e) {
      console.error("sp_setup_save:", e);
      set_view("sp_setup");
    }
  }

  async function load_sp_playlists() {
    set_sp_pls_loading(true);
    try {
      const token = await sp_token();
      const pls = await invoke<SpPlaylist[]>("sp_playlists", {
        accessToken: token,
      });
      set_sp_pls(pls);
      set_sp_checked(new Set(pls.map((p) => p.id)));
    } catch (e) {
      set_sp_pls([]);
      message(`Failed to load playlists:\n${e}`, { title: "Spotify Error", kind: "error" });
    } finally {
      set_sp_pls_loading(false);
    }
  }

  function toggle_sp_pl(id: string) {
    set_sp_checked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start_sp_migration() {
    set_view("sp_migrating");
    mig_offset.current = 0;
    let token: string;
    try {
      token = await sp_token();
    } catch (e) {
      message(`Failed to get Spotify token:\n${e}`, { title: "Spotify Error", kind: "error" });
      return;
    }

    const items: {
      name: string;
      kind: "playlist" | "liked";
      tracks: SpTrack[];
    }[] = [];

    if (sp_liked_checked) {
      try {
        const tracks = await invoke<SpTrack[]>("sp_liked_tracks", {
          accessToken: token,
        });
        items.push({ name: "Liked Songs", kind: "liked", tracks });
      } catch (e) {
        console.error("sp_liked_tracks:", e);
        message(`Failed to load liked songs:\n${e}`, { title: "Spotify Error", kind: "error" });
      }
    }

    for (const id of sp_checked) {
      const pl = sp_pls?.find((p) => p.id === id);
      if (!pl) continue;
      try {
        const tracks = await invoke<SpTrack[]>("sp_playlist_tracks", {
          accessToken: token,
          id,
        });
        items.push({ name: pl.name, kind: "playlist", tracks });
      } catch (e) {
        console.error("sp_playlist_tracks:", e);
        message(`Failed to load playlist "${pl.name}":\n${e}`, { title: "Spotify Error", kind: "error" });
      }
    }

    const total = items.reduce((s, i) => s + i.tracks.length, 0);
    set_mig_total(total);
    set_mig_done(0);
    mig_start.current = Date.now();

    for (const item of items) {
      if (item.tracks.length === 0) continue;
      const dl_tracks = item.tracks.map((t) => ({
        artist: t.artist,
        title: t.title,
        album: t.album,
        cover_url: t.cover_url,
        duration: t.duration,
      }));
      const paths = await download_batch(dl_tracks);
      const downloaded = [...paths.values()];

      if (item.kind === "liked") {
        for (const p of downloaded) {
          await lib_ref.current.toggle_fav(p).catch(e => console.error("migrate toggle_fav:", e));
        }
      } else {
        if (downloaded.length > 0) {
          try {
            const pl = await invoke<{ id: string }>("pl_create", {
              name: item.name,
              description: null,
              cover: null,
            });
            for (const p of downloaded) {
              await invoke("pl_add_track", { id: pl.id, trackPath: p }).catch(
                e => console.error("migrate pl_add_track:", e),
              );
            }
          } catch (e) { console.error("migrate pl_create:", e); }
        }
      }
    }

    const {
      music_dir: dir,
      load_library: load,
      load_playlists: lp,
    } = lib_ref.current;
    if (dir) await load(dir);
    await lp();
    set_did_migrate(true);
    set_view("done");
  }

  async function yt_import() {
    const trimmed = yt_url.trim();
    if (!trimmed) return;
    set_yt_loading(true);
    set_yt_tracks([]);
    set_yt_progress(null);
    try {
      const res = await invoke<YtPlaylistResult>("yt_playlist_tracks", {
        url: trimmed,
      });
      set_yt_pl_name(res.name);
      set_yt_tracks(res.tracks);
      set_view("yt_tracks");
    } catch {
      set_yt_tracks([]);
    } finally {
      set_yt_loading(false);
      set_yt_progress(null);
    }
  }

  async function start_yt_migration() {
    set_view("yt_migrating");
    mig_offset.current = 0;
    set_mig_total(yt_tracks.length);
    set_mig_done(0);
    mig_start.current = Date.now();

    const dl_tracks = yt_tracks.map((t) => ({
      artist: t.artist,
      title: t.title,
      album: t.album || "",
      cover_url: t.cover_url,
      duration: t.duration,
    }));
    const paths = await download_batch(dl_tracks);
    const downloaded = [...paths.values()];

    if (downloaded.length > 0) {
      const name = yt_pl_name || "YouTube Playlist";
      try {
        const pl = await invoke<{ id: string }>("pl_create", {
          name,
          description: null,
          cover: null,
        });
        for (const p of downloaded) {
          await invoke("pl_add_track", { id: pl.id, trackPath: p }).catch(
            e => console.error("yt_migrate pl_add_track:", e),
          );
        }
      } catch (e) { console.error("yt_migrate pl_create:", e); }
    }

    const { music_dir: dir, load_library: load, load_playlists: lp } = lib_ref.current;
    if (dir) await load(dir);
    await lp();
    set_did_migrate(true);
    set_view("done");
  }

  const box: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    padding: "0 64px",
    gap: 32,
  };

  function render_view() {
    switch (view) {
      case "sp_setup":
        return (
          <SpSetupView
            on_back={() => set_view("home")}
            on_save={sp_setup_save}
          />
        );
      case "sp_playlists":
        return (
          <SpPlaylistsView
            sp_tokens={sp_tokens ? { display_name: sp_tokens.display_name } : null}
            sp_loading={sp_loading}
            sp_pls_loading={sp_pls_loading}
            playlists={sp_pls}
            checked={sp_checked}
            liked_checked={sp_liked_checked}
            on_back={() => set_view("home")}
            on_toggle_pl={toggle_sp_pl}
            on_toggle_liked={() => set_sp_liked_checked(!sp_liked_checked)}
            on_migrate={start_sp_migration}
          />
        );
      case "sp_migrating":
        return (
          <MigratingView
            source="spotify"
            total={mig_total}
            done={mig_done}
            current={mig_current}
            start_time={mig_start.current}
          />
        );
      case "yt_input":
        return (
          <YtInputView
            url={yt_url}
            set_url={set_yt_url}
            loading={yt_loading}
            progress={yt_progress}
            on_back={() => set_view("home")}
            on_import={yt_import}
          />
        );
      case "yt_tracks":
        return (
          <YtTracksView
            name={yt_pl_name}
            tracks={yt_tracks}
            on_back={() => set_view("yt_input")}
            on_migrate={start_yt_migration}
          />
        );
      case "yt_migrating":
        return (
          <MigratingView
            source="youtube"
            total={mig_total}
            done={mig_done}
            current={mig_current}
            start_time={mig_start.current}
          />
        );
      case "done":
        return (
          <DoneView
            on_migrate_more={() => set_view("home")}
            on_continue={on_next}
          />
        );
      default:
        return (
          <HomeView
            did_migrate={did_migrate}
            on_spotify={open_spotify}
            on_youtube={() => set_view("yt_input")}
            on_next={on_next}
          />
        );
    }
  }

  return <div style={box}>{render_view()}</div>;
}
