import { TTrack } from "@/types";

export type LibMode = "local" | "server";

type ServerTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  track_no: number;
  year: number | null;
  has_cover: boolean;
};

type HealthResponse = {
  name: string;
  version: string;
  tracks: number;
  uptime_s: number;
};

function map_tracks(url: string, srv: ServerTrack[]): TTrack[] {
  return srv.map((t) => ({
    path: `${url}/api/stream/${t.id}`,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: t.duration,
    track_no: t.track_no,
    year: t.year,
    cover: t.has_cover ? `${url}/api/cover/${t.id}` : null,
  }));
}

export async function fetch_server_tracks(url: string): Promise<TTrack[]> {
  const res = await fetch(`${url}/api/tracks`);
  if (!res.ok) throw new Error(`server returned ${res.status}`);
  const srv: ServerTrack[] = await res.json();
  return map_tracks(url, srv);
}

export async function check_server_health(
  url: string,
): Promise<HealthResponse> {
  const res = await fetch(`${url}/api/health`);
  if (!res.ok) throw new Error(`server returned ${res.status}`);
  return res.json();
}

export function get_saved_mode(): LibMode {
  return (localStorage.getItem("library_mode") as LibMode) || "local";
}

export function get_saved_url(): string | null {
  return localStorage.getItem("server_url");
}

export function save_server(url: string) {
  localStorage.setItem("server_url", url);
  localStorage.setItem("library_mode", "server");
  localStorage.removeItem("music_dir");
}

export function clear_server() {
  localStorage.removeItem("server_url");
  localStorage.setItem("library_mode", "local");
}
