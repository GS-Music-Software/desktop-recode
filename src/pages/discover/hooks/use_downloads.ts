import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { use_lib, use_toast } from "@/ctx";
import type { DlState, DzTrack } from "../types";
import type { SpTrack } from "@/components/spotify/types";
import type { YtTrack, YtPlaylistResult } from "@/components/youtube/types";
import {
  invoke_download,
  meta_from_dz,
  meta_from_sp,
  meta_from_yt,
  sp_track_key,
  yt_track_key,
  type DlMeta,
} from "./dl_invoke";
import {
  handle_sp_batch_done,
  handle_yt_batch_done,
  handle_album_batch_done,
  type SpBatch,
  type YtBatch,
  type AlbumBatch,
} from "./dl_batch";

export function use_downloads() {
  const { music_dir, rescan_library, load_playlists } = use_lib();
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
  const dl_meta = useRef<Map<number, DlMeta>>(new Map());
  const sp_dl_all_running = useRef(false);
  const sp_batch = useRef<SpBatch | null>(null);
  const yt_batch = useRef<YtBatch | null>(null);
  const album_batch = useRef<AlbumBatch | null>(null);
  const yt_pl_name = useRef("");

  const lib_ref = useRef({ music_dir, rescan_library, load_playlists });
  lib_ref.current = { music_dir, rescan_library, load_playlists };
  const toast_ref = useRef({ push, update });
  toast_ref.current = { push, update };

  const rescan_timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function rescan() {
    lib_ref.current.rescan_library();
    if (rescan_timer.current) clearTimeout(rescan_timer.current);
    rescan_timer.current = setTimeout(() => lib_ref.current.rescan_library(), 1500);
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
        if (sp_key)
          set_sp_dl_keys((prev) =>
            new Map(prev).set(sp_key, {
              pct: payload.pct,
              done: false,
              err: null,
            }),
          );
        const yt_key = yt_id_map.current.get(payload.id);
        if (yt_key)
          set_yt_dl_keys((prev) =>
            new Map(prev).set(yt_key, {
              pct: payload.pct,
              done: false,
              err: null,
            }),
          );

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
        if (sp_key)
          set_sp_dl_keys((prev) =>
            new Map(prev).set(sp_key, {
              pct: 100,
              done: !payload.err,
              err: payload.err,
            }),
          );
        const yt_key_done = yt_id_map.current.get(payload.id);
        if (yt_key_done)
          set_yt_dl_keys((prev) =>
            new Map(prev).set(yt_key_done, {
              pct: 100,
              done: !payload.err,
              err: payload.err,
            }),
          );

        if (sp_batch.current && sp_batch.current.ids.has(payload.id)) {
          if (handle_sp_batch_done(sp_batch.current, toast_ref.current, rescan))
            sp_batch.current = null;
          return;
        }
        if (yt_batch.current && yt_batch.current.ids.has(payload.id)) {
          if (
            handle_yt_batch_done(
              yt_batch.current,
              payload.path,
              payload.err,
              toast_ref.current,
              rescan,
              lib_ref.current,
            )
          )
            yt_batch.current = null;
          return;
        }
        if (album_batch.current && album_batch.current.ids.has(payload.id)) {
          if (
            handle_album_batch_done(
              album_batch.current,
              payload.path,
              payload.err,
              toast_ref.current,
              rescan,
              lib_ref.current,
            )
          )
            album_batch.current = null;
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
    dl_meta.current.set(dl_id, meta_from_dz(track));
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
    invoke_download(
      dl_id,
      track.artist,
      track.title,
      track.album,
      track.cover_url,
      track.duration,
      music_dir ?? undefined,
    ).catch((e) =>
      set_downloads((prev) =>
        new Map(prev).set(track.id, { pct: 0, done: false, err: String(e) }),
      ),
    );
  }

  function dl_track_batch(track: DzTrack, dl_id: number) {
    id_map.current.set(dl_id, track.id);
    dl_meta.current.set(dl_id, meta_from_dz(track));
    album_batch.current?.ids.add(dl_id);
    set_downloads((prev) =>
      new Map(prev).set(track.id, { pct: 0, done: false, err: null }),
    );
    invoke_download(
      dl_id,
      track.artist,
      track.title,
      track.album,
      track.cover_url,
      track.duration,
      music_dir ?? undefined,
    ).catch((e) =>
      set_downloads((prev) =>
        new Map(prev).set(track.id, { pct: 0, done: false, err: String(e) }),
      ),
    );
  }

  async function dl_album_all(
    tracks: DzTrack[],
    pl_name: string | null,
    cover_url?: string,
  ) {
    const to_dl = tracks.filter((t) => {
      const existing = downloads.get(t.id);
      return !existing || existing.err;
    });
    if (!to_dl.length) return;
    const toast_id = `album_batch_${Date.now()}`;
    album_batch.current = {
      ids: new Set(),
      total: to_dl.length,
      done: 0,
      toast_id,
      pl_name: pl_name ?? "",
      cover_url: cover_url ?? "",
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
      dl_track_batch(t, dl_id_ref.current++);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  function dl_sp_track(t: SpTrack, idx: number, batch = false) {
    const key = sp_track_key(t, idx);
    const existing = sp_dl_keys.get(key);
    if (existing && !existing.err) return;
    const dl_id = dl_id_ref.current++;
    sp_id_map.current.set(dl_id, key);
    dl_meta.current.set(dl_id, meta_from_sp(t));
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
    invoke_download(
      dl_id,
      t.artist,
      t.title,
      t.album,
      t.cover_url,
      t.duration,
      music_dir ?? undefined,
    ).catch((e) => {
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
      dl_sp_track(t, tracks.indexOf(t), true);
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

  function dl_yt_track(t: YtTrack, idx: number, batch = false) {
    const key = yt_track_key(t, idx);
    const existing = yt_dl_keys.get(key);
    if (existing && !existing.err) return;
    const dl_id = dl_id_ref.current++;
    yt_id_map.current.set(dl_id, key);
    dl_meta.current.set(dl_id, meta_from_yt(t));
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
    invoke_download(
      dl_id,
      t.artist,
      t.title,
      t.album || "",
      t.cover_url,
      t.duration,
      music_dir ?? undefined,
    ).catch((e) => {
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
      dl_yt_track(t, tracks.indexOf(t), true);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return {
    downloads,
    dl_track,
    dl_album_all,
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
