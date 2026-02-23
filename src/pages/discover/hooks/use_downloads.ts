import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { use_lib, use_toast } from "@/ctx";
import type { DlState, DzTrack } from "../types";
import type { SpTrack } from "@/components/spotify/types";
import type { YtTrack, YtPlaylistResult } from "@/components/youtube/types";

export function use_downloads() {
  const { music_dir, load_library, load_playlists } = use_lib();
  const { push, update } = use_toast();

  const [downloads, set_downloads] = useState<Map<number, DlState>>(new Map());
  const [sp_dl_keys, set_sp_dl_keys] = useState<Map<string, DlState>>(
    new Map(),
  );
  const [yt_dl_keys, set_yt_dl_keys] = useState<Map<string, DlState>>(
    new Map(),
  );
  const [yt_tracks, set_yt_tracks] = useState<YtTrack[]>([]);
  const [yt_loading, set_yt_loading] = useState(false);
  const [yt_progress, set_yt_progress] = useState<{
    phase: string;
    done: number;
    total: number;
    title: string;
  } | null>(null);

  const dl_id_ref = useRef(0);
  const id_map = useRef<Map<number, number>>(new Map());
  const sp_id_map = useRef<Map<number, string>>(new Map());
  const yt_id_map = useRef<Map<number, string>>(new Map());
  const dl_meta = useRef<
    Map<number, { title: string; artist: string; cover_url: string }>
  >(new Map());
  const sp_dl_all_running = useRef(false);
  const sp_batch = useRef<{
    ids: Set<number>;
    total: number;
    done: number;
    toast_id: string;
  } | null>(null);
  const yt_batch = useRef<{
    ids: Set<number>;
    total: number;
    done: number;
    toast_id: string;
    pl_name: string;
    paths: string[];
  } | null>(null);
  const yt_pl_name = useRef("");

  const lib_ref = useRef({ music_dir, load_library, load_playlists });
  lib_ref.current = { music_dir, load_library, load_playlists };
  const toast_ref = useRef({ push, update });
  toast_ref.current = { push, update };

  const rescan_timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function rescan() {
    const { music_dir: dir, load_library: load } = lib_ref.current;
    if (!dir) return;
    load(dir);

    if (rescan_timer.current) clearTimeout(rescan_timer.current);
    rescan_timer.current = setTimeout(() => load(dir), 1500);
  }

  useEffect(() => {
    const u1 = listen<{ id: number; pct: number }>(
      "dl_progress",
      ({ payload }) => {
        set_downloads((prev) => {
          const next = new Map(prev);
          const track_id = id_map.current.get(payload.id);
          if (track_id !== undefined)
            next.set(track_id, { pct: payload.pct, done: false, err: null });
          return next;
        });
        const sp_key = sp_id_map.current.get(payload.id);
        if (sp_key) {
          set_sp_dl_keys((prev) =>
            new Map(prev).set(sp_key, {
              pct: payload.pct,
              done: false,
              err: null,
            }),
          );
        }
        const yt_key = yt_id_map.current.get(payload.id);
        if (yt_key) {
          set_yt_dl_keys((prev) =>
            new Map(prev).set(yt_key, {
              pct: payload.pct,
              done: false,
              err: null,
            }),
          );
        }
        const batch = sp_batch.current ?? yt_batch.current;
        if (batch && batch.ids.has(payload.id)) return;
        const meta = dl_meta.current.get(payload.id);
        if (meta) {
          toast_ref.current.update(`dl_${payload.id}`, {
            type: "progress",
            pct: payload.pct,
            title: meta.title,
            sub: meta.artist,
            cover_url: meta.cover_url,
          });
        }
      },
    );
    const u2 = listen<{ id: number; path: string | null; err: string | null }>(
      "dl_done",
      ({ payload }) => {
        set_downloads((prev) => {
          const next = new Map(prev);
          const track_id = id_map.current.get(payload.id);
          if (track_id !== undefined)
            next.set(track_id, {
              pct: 100,
              done: !payload.err,
              err: payload.err,
            });
          return next;
        });
        const sp_key = sp_id_map.current.get(payload.id);
        if (sp_key) {
          set_sp_dl_keys((prev) =>
            new Map(prev).set(sp_key, {
              pct: 100,
              done: !payload.err,
              err: payload.err,
            }),
          );
        }
        const yt_key_done = yt_id_map.current.get(payload.id);
        if (yt_key_done) {
          set_yt_dl_keys((prev) =>
            new Map(prev).set(yt_key_done, {
              pct: 100,
              done: !payload.err,
              err: payload.err,
            }),
          );
        }
        if (sp_batch.current && sp_batch.current.ids.has(payload.id)) {
          const batch = sp_batch.current;
          batch.done++;
          const pct = Math.round((batch.done / batch.total) * 100);
          toast_ref.current.update(batch.toast_id, {
            type: batch.done >= batch.total ? "success" : "progress",
            pct,
            title:
              batch.done >= batch.total
                ? `Downloaded ${batch.total} tracks`
                : `Downloading`,
            sub: `${batch.done} / ${batch.total} tracks`,
          });
          if (batch.done >= batch.total) {
            rescan();
            sp_batch.current = null;
          }
          return;
        }
        if (yt_batch.current && yt_batch.current.ids.has(payload.id)) {
          const batch = yt_batch.current;
          batch.done++;
          if (payload.path && !payload.err) batch.paths.push(payload.path);
          const pct = Math.round((batch.done / batch.total) * 100);
          toast_ref.current.update(batch.toast_id, {
            type: batch.done >= batch.total ? "success" : "progress",
            pct,
            title:
              batch.done >= batch.total
                ? `Downloaded ${batch.total} tracks`
                : `Downloading`,
            sub: `${batch.done} / ${batch.total} tracks`,
          });
          if (batch.done >= batch.total) {
            rescan();
            if (batch.paths.length > 0) {
              const name = batch.pl_name || "YouTube Playlist";
              (async () => {
                try {
                  const pl = await invoke<{ id: string }>("pl_create", {
                    name,
                    description: null,
                    cover: null,
                  });
                  for (const p of batch.paths) {
                    await invoke("pl_add_track", { id: pl.id, trackPath: p });
                  }
                  await lib_ref.current.load_playlists();
                } catch (e) {
                  console.error("yt_batch playlist create:", e);
                }
              })();
            }
            yt_batch.current = null;
          }
          return;
        }
        const meta = dl_meta.current.get(payload.id);
        if (meta) {
          toast_ref.current.update(`dl_${payload.id}`, {
            type: payload.err ? "error" : "success",
            pct: 100,
            title: payload.err ? "Download failed" : `Downloaded`,
            sub: payload.err ? meta.title : `${meta.title} · ${meta.artist}`,
            cover_url: meta.cover_url,
          });
        }
        if (!payload.err) rescan();
      },
    );
    const u3 = listen<{
      phase: string;
      done: number;
      total: number;
      title: string;
    }>("yt_import_progress", ({ payload }) => set_yt_progress(payload));
    return () => {
      u1.then((f) => f());
      u2.then((f) => f());
      u3.then((f) => f());
    };
  }, []);

  function dl_track(track: DzTrack) {
    const existing = downloads.get(track.id);
    if (existing && !existing.err) return;
    const dl_id = dl_id_ref.current++;
    id_map.current.set(dl_id, track.id);
    dl_meta.current.set(dl_id, {
      title: track.title,
      artist: track.artist,
      cover_url: track.cover_url,
    });
    set_downloads((prev) =>
      new Map(prev).set(track.id, { pct: 0, done: false, err: null }),
    );
    push({
      id: `dl_${dl_id}`,
      type: "progress",
      pct: 0,
      title: track.title,
      sub: track.artist,
      cover_url: track.cover_url,
    });
    invoke("download_track", {
      id: dl_id,
      artist: track.artist,
      title: track.title,
      album: track.album,
      coverUrl: track.cover_url,
      duration: track.duration,
      saveDir: music_dir ?? undefined,
    }).catch((e) => {
      set_downloads((prev) =>
        new Map(prev).set(track.id, { pct: 0, done: false, err: String(e) }),
      );
    });
  }

  function sp_track_key(t: SpTrack, i: number) {
    return `${t.title}::${t.artist}::${i}`;
  }

  function dl_sp_track(t: SpTrack, idx: number, batch = false) {
    const key = sp_track_key(t, idx);
    const existing = sp_dl_keys.get(key);
    if (existing && !existing.err) return;
    const dl_id = dl_id_ref.current++;
    sp_id_map.current.set(dl_id, key);
    dl_meta.current.set(dl_id, {
      title: t.title,
      artist: t.artist,
      cover_url: t.cover_url,
    });
    set_sp_dl_keys((prev) =>
      new Map(prev).set(key, { pct: 0, done: false, err: null }),
    );
    if (batch) {
      sp_batch.current?.ids.add(dl_id);
    } else {
      push({
        id: `dl_${dl_id}`,
        type: "progress",
        pct: 0,
        title: t.title,
        sub: t.artist,
        cover_url: t.cover_url,
      });
    }
    invoke("download_track", {
      id: dl_id,
      artist: t.artist,
      title: t.title,
      album: t.album,
      coverUrl: t.cover_url,
      duration: t.duration,
      saveDir: music_dir ?? undefined,
    }).catch((e) => {
      console.error("dl_sp_track:", e);
      set_sp_dl_keys((prev) =>
        new Map(prev).set(key, { pct: 0, done: false, err: "failed" }),
      );
    });
  }

  async function dl_sp_all(tracks: SpTrack[]) {
    if (sp_dl_all_running.current) return;
    sp_dl_all_running.current = true;
    const to_dl = tracks.filter((t, i) => {
      const key = sp_track_key(t, i);
      const existing = sp_dl_keys.get(key);
      return !existing || existing.err;
    });
    if (!to_dl.length) {
      sp_dl_all_running.current = false;
      return;
    }
    const toast_id = `sp_batch_${Date.now()}`;
    sp_batch.current = {
      ids: new Set(),
      total: to_dl.length,
      done: 0,
      toast_id,
    };
    push({
      id: toast_id,
      type: "progress",
      pct: 0,
      title: "Downloading",
      sub: `0 / ${to_dl.length} tracks`,
    });
    for (const t of to_dl) {
      const idx = tracks.indexOf(t);
      dl_sp_track(t, idx, true);
      await new Promise((r) => setTimeout(r, 300));
    }
    sp_dl_all_running.current = false;
  }

  async function yt_import(url: string) {
    set_yt_loading(true);
    set_yt_tracks([]);
    set_yt_progress(null);
    try {
      const res = await invoke<YtPlaylistResult>("yt_playlist_tracks", { url });
      yt_pl_name.current = res.name;
      set_yt_tracks(res.tracks);
    } catch {
      set_yt_tracks([]);
    } finally {
      set_yt_loading(false);
      set_yt_progress(null);
    }
  }

  function yt_track_key(t: YtTrack, i: number) {
    return `yt::${t.title}::${t.artist}::${i}`;
  }

  function dl_yt_track(t: YtTrack, idx: number, batch = false) {
    const key = yt_track_key(t, idx);
    const existing = yt_dl_keys.get(key);
    if (existing && !existing.err) return;
    const dl_id = dl_id_ref.current++;
    yt_id_map.current.set(dl_id, key);
    dl_meta.current.set(dl_id, {
      title: t.title,
      artist: t.artist,
      cover_url: t.cover_url,
    });
    set_yt_dl_keys((prev) =>
      new Map(prev).set(key, { pct: 0, done: false, err: null }),
    );
    if (batch) {
      yt_batch.current?.ids.add(dl_id);
    } else {
      push({
        id: `dl_${dl_id}`,
        type: "progress",
        pct: 0,
        title: t.title,
        sub: t.artist,
        cover_url: t.cover_url,
      });
    }
    invoke("download_track", {
      id: dl_id,
      artist: t.artist,
      title: t.title,
      album: t.album || "",
      coverUrl: t.cover_url,
      duration: t.duration,
      saveDir: music_dir ?? undefined,
    }).catch((e) => {
      console.error("dl_yt_track:", e);
      set_yt_dl_keys((prev) =>
        new Map(prev).set(key, { pct: 0, done: false, err: "failed" }),
      );
    });
  }

  async function dl_yt_all(tracks: YtTrack[]) {
    const to_dl = tracks.filter((t, i) => {
      const key = yt_track_key(t, i);
      const existing = yt_dl_keys.get(key);
      return !existing || existing.err;
    });
    if (!to_dl.length) return;
    const toast_id = `yt_batch_${Date.now()}`;
    yt_batch.current = {
      ids: new Set(),
      total: to_dl.length,
      done: 0,
      toast_id,
      pl_name: yt_pl_name.current,
      paths: [],
    };
    push({
      id: toast_id,
      type: "progress",
      pct: 0,
      title: "Downloading",
      sub: `0 / ${to_dl.length} tracks`,
    });
    for (const t of to_dl) {
      const idx = tracks.indexOf(t);
      dl_yt_track(t, idx, true);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return {
    downloads,
    dl_track,
    sp_dl_keys,
    dl_sp_track,
    dl_sp_all,
    yt_tracks,
    yt_loading,
    yt_progress,
    yt_dl_keys,
    yt_import,
    dl_yt_track,
    dl_yt_all,
  };
}
