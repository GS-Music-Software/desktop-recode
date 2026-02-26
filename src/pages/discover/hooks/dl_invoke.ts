import { invoke } from "@tauri-apps/api/core";
import type { DzTrack } from "../types";
import type { SpTrack } from "@/components/spotify/types";
import type { YtTrack } from "@/components/youtube/types";

export type DlMeta = { title: string; artist: string; cover_url: string };

export function invoke_download(
  dl_id: number,
  artist: string,
  title: string,
  album: string,
  cover_url: string,
  duration: number,
  save_dir: string | undefined,
) {
  return invoke("download_track", {
    id: dl_id,
    artist,
    title,
    album,
    coverUrl: cover_url,
    duration,
    saveDir: save_dir,
  });
}

export function meta_from_dz(t: DzTrack): DlMeta {
  return { title: t.title, artist: t.artist, cover_url: t.cover_url };
}

export function meta_from_sp(t: SpTrack): DlMeta {
  return { title: t.title, artist: t.artist, cover_url: t.cover_url };
}

export function meta_from_yt(t: YtTrack): DlMeta {
  return { title: t.title, artist: t.artist, cover_url: t.cover_url };
}

export function sp_track_key(t: SpTrack, i: number): string {
  return `${t.title}::${t.artist}::${i}`;
}

export function yt_track_key(t: YtTrack, i: number): string {
  return `yt::${t.title}::${t.artist}::${i}`;
}
