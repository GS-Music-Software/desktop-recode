import { invoke } from "@tauri-apps/api/core";
import type { Toast } from "@/ctx";

export type SpBatch = {
  ids: Set<number>;
  total: number;
  done: number;
  toast_id: string;
};

export type YtBatch = {
  ids: Set<number>;
  total: number;
  done: number;
  toast_id: string;
  pl_name: string;
  paths: string[];
};

export type AlbumBatch = {
  ids: Set<number>;
  total: number;
  done: number;
  toast_id: string;
  pl_name: string;
  cover_url: string;
  paths: string[];
};

type ToastRef = {
  push: (t: Omit<Toast, "id"> & { id?: string }) => string;
  update: (id: string, patch: Partial<Toast>) => void;
};

type LibRef = {
  music_dir: string | null;
  rescan_library: () => Promise<void>;
  load_playlists: () => Promise<void>;
};

export function handle_sp_batch_done(
  batch: SpBatch,
  toast: ToastRef,
  rescan: () => void,
): boolean {
  batch.done++;
  const pct = Math.round((batch.done / batch.total) * 100);
  toast.update(batch.toast_id, {
    type: batch.done >= batch.total ? "success" : "progress",
    pct,
    title: batch.done >= batch.total ? `Downloaded ${batch.total} tracks` : `Downloading`,
    sub: `${batch.done} / ${batch.total} tracks`,
  });
  if (batch.done >= batch.total) {
    rescan();
    return true;
  }
  return false;
}

export function handle_yt_batch_done(
  batch: YtBatch,
  payload_path: string | null,
  payload_err: string | null,
  toast: ToastRef,
  rescan: () => void,
  lib: LibRef,
): boolean {
  batch.done++;
  if (payload_path && !payload_err) batch.paths.push(payload_path);
  const pct = Math.round((batch.done / batch.total) * 100);
  toast.update(batch.toast_id, {
    type: batch.done >= batch.total ? "success" : "progress",
    pct,
    title: batch.done >= batch.total ? `Downloaded ${batch.total} tracks` : `Downloading`,
    sub: `${batch.done} / ${batch.total} tracks`,
  });
  if (batch.done >= batch.total) {
    rescan();
    if (batch.paths.length > 0) {
      const name = batch.pl_name || "YouTube Playlist";
      (async () => {
        try {
          const pl = await invoke<{ id: string }>("pl_create", { name, description: null, cover: null });
          for (const p of batch.paths) {
            await invoke("pl_add_track", { id: pl.id, trackPath: p });
          }
          await lib.load_playlists();
        } catch (e) {
          console.error("yt_batch playlist create:", e);
        }
      })();
    }
    return true;
  }
  return false;
}

export function handle_album_batch_done(
  batch: AlbumBatch,
  payload_path: string | null,
  payload_err: string | null,
  toast: ToastRef,
  rescan: () => void,
  lib: LibRef,
): boolean {
  batch.done++;
  if (payload_path && !payload_err) batch.paths.push(payload_path);
  const pct = Math.round((batch.done / batch.total) * 100);
  toast.update(batch.toast_id, {
    type: batch.done >= batch.total ? "success" : "progress",
    pct,
    title: batch.done >= batch.total ? `Downloaded ${batch.total} tracks` : `Downloading`,
    sub: `${batch.done} / ${batch.total} tracks`,
  });
  if (batch.done >= batch.total) {
    rescan();
    if (batch.pl_name && batch.paths.length > 0) {
      const name = batch.pl_name;
      const cover_url = batch.cover_url;
      (async () => {
        try {
          let cover: string | null = null;
          if (cover_url) {
            try {
              const resp = await fetch(cover_url);
              const blob = await resp.blob();
              cover = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              console.error("album_batch cover fetch:", e);
            }
          }
          const pl = await invoke<{ id: string }>("pl_create", { name, description: null, cover });
          for (const p of batch.paths) {
            await invoke("pl_add_track", { id: pl.id, trackPath: p });
          }
          await lib.load_playlists();
        } catch (e) {
          console.error("album_batch playlist create:", e);
        }
      })();
    }
    return true;
  }
  return false;
}
