import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TTrack, TAlbum, TArtist, TView, TPlaylist } from "@/types";
import { make_albums, make_artists } from "@/lib";

type NavEntry = { view: TView; album: TAlbum | null; artist: TArtist | null; playlist: TPlaylist | null };

type LibState = {
  tracks: TTrack[];
  albums: TAlbum[];
  artists: TArtist[];
  view: TView;
  selected_album: TAlbum | null;
  selected_artist: TArtist | null;
  music_dir: string | null;
  loading: boolean;
  err: string | null;
  search: string;
  can_back: boolean;
  can_fwd: boolean;
  playlists: TPlaylist[];
  selected_playlist: TPlaylist | null;
  favs: Set<string>;
  is_fav: (path: string) => boolean;
  toggle_fav: (path: string) => Promise<void>;
  set_view: (v: TView) => void;
  set_album: (a: TAlbum | null) => void;
  set_artist: (a: TArtist | null) => void;
  set_search: (s: string) => void;
  load_library: (path: string) => Promise<void>;
  load_playlists: () => Promise<void>;
  set_playlist: (p: TPlaylist | null) => void;
  nav_back: () => void;
  nav_fwd: () => void;
};

const Ctx = createContext<LibState | null>(null);

export function LibProv({ children }: { children: ReactNode }) {
  const [tracks, set_tracks] = useState<TTrack[]>([]);
  const [albums, set_albums] = useState<TAlbum[]>([]);
  const [artists, set_artists] = useState<TArtist[]>([]);
  const [view, _set_view] = useState<TView>("songs");
  const [selected_album, _set_album] = useState<TAlbum | null>(null);
  const [selected_artist, _set_artist] = useState<TArtist | null>(null);
  const [music_dir, set_dir] = useState<string | null>(() => localStorage.getItem("music_dir"));
  const [loading, set_loading] = useState(false);
  const [err, set_err] = useState<string | null>(null);
  const [search, set_search] = useState("");

  const hist = useRef<NavEntry[]>([{ view: "songs", album: null, artist: null, playlist: null }]);
  const hist_idx = useRef(0);
  const cur_album = useRef<TAlbum | null>(null);
  const cur_artist = useRef<TArtist | null>(null);
  const cur_playlist = useRef<TPlaylist | null>(null);
  const [can_back, set_can_back] = useState(false);
  const [can_fwd, set_can_fwd] = useState(false);
  const [playlists, set_playlists] = useState<TPlaylist[]>([]);
  const [selected_playlist, _set_selected_playlist] = useState<TPlaylist | null>(null);
  const [favs, set_favs] = useState<Set<string>>(new Set());

  function apply(entry: NavEntry) {
    _set_view(entry.view);
    _set_album(entry.album);
    _set_artist(entry.artist);
    _set_selected_playlist(entry.playlist);
    cur_album.current = entry.album;
    cur_artist.current = entry.artist;
    cur_playlist.current = entry.playlist;
  }

  function push_nav(entry: NavEntry) {
    hist.current = hist.current.slice(0, hist_idx.current + 1);
    hist.current.push(entry);
    hist_idx.current = hist.current.length - 1;
    set_can_back(hist_idx.current > 0);
    set_can_fwd(false);
    apply(entry);
  }

  function set_view(v: TView) {
    push_nav({ view: v, album: cur_album.current, artist: cur_artist.current, playlist: cur_playlist.current });
  }

  function set_album(a: TAlbum | null) {
    cur_album.current = a;
    _set_album(a);
  }

  function set_artist(a: TArtist | null) {
    cur_artist.current = a;
    _set_artist(a);
  }

  function nav_back() {
    if (hist_idx.current <= 0) return;
    hist_idx.current -= 1;
    apply(hist.current[hist_idx.current]);
    set_can_back(hist_idx.current > 0);
    set_can_fwd(true);
  }

  function nav_fwd() {
    if (hist_idx.current >= hist.current.length - 1) return;
    hist_idx.current += 1;
    apply(hist.current[hist_idx.current]);
    set_can_back(true);
    set_can_fwd(hist_idx.current < hist.current.length - 1);
  }

  const load_playlists = useCallback(async () => {
    try {
      const res = await invoke<TPlaylist[]>("pl_list");
      set_playlists(res);
    } catch (e) { console.error("load_playlists:", e); }
  }, []);

  function set_playlist(p: TPlaylist | null) {
    cur_playlist.current = p;
    _set_selected_playlist(p);
  }

  const ld_favs = useCallback(async () => {
    try {
      const res = await invoke<TPlaylist>("pl_favs");
      set_favs(new Set(res.tracks));
    } catch (e) { console.error("load_favs:", e); }
  }, []);

  const is_fav = useCallback((path: string) => favs.has(path), [favs]);

  const toggle_fav = useCallback(async (path: string) => {
    try {
      const now_fav = await invoke<boolean>("pl_fav_toggle", { trackPath: path });
      set_favs(prev => {
        const next = new Set(prev);
        if (now_fav) next.add(path);
        else next.delete(path);
        return next;
      });
    } catch (e) { console.error("toggle_fav:", e); }
  }, []);

  const load_library = useCallback(async (path: string) => {
    set_loading(true);
    set_err(null);
    set_dir(path);
    localStorage.setItem("music_dir", path);
    try {
      const res = await invoke<TTrack[]>("scan_dir", { path });
      set_tracks(res);
      set_albums(make_albums(res));
      set_artists(make_artists(res));
    } catch (e) {
      set_err(String(e));
      set_dir(null);
      localStorage.removeItem("music_dir");
    } finally {
      set_loading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("music_dir");
    if (saved) load_library(saved);
    load_playlists();
    ld_favs();
  }, [load_library, load_playlists, ld_favs]);

  return (
    <Ctx.Provider
      value={{
        tracks, albums, artists, view, selected_album, selected_artist,
        music_dir, loading, err, search, can_back, can_fwd,
        playlists, selected_playlist, favs, is_fav, toggle_fav,
        set_view, set_album, set_artist, set_search, load_library, load_playlists, set_playlist, nav_back, nav_fwd,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function use_lib(): LibState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_lib outside provider");
  return ctx;
}
