import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { Music2, RefreshCw, ChevronDown } from "lucide-react";
import { use_settings, use_lib } from "@/ctx";
import { SpPlaylistList, SpTrackList } from "@/components/spotify/discover";
import type { SpPlaylist, SpTrack, SpDrill } from "@/components/spotify/discover";
import { YtUrlInput, YtTrackList } from "@/components/youtube/discover";
import type { SearchMode, DzTrack, DzAlbum, DzArtist, DrillState } from "./types";
import { DrillAlbums } from "./drill/drill_albums";
import { DrillTracks } from "./drill/drill_tracks";
import { TrackResults } from "./results/track_results";
import { AlbumResults } from "./results/album_results";
import { ArtistResults } from "./results/artist_results";
import { YtProgress } from "./results/yt_progress";
import { SearchHeader } from "./components/search_header";
import { ModeTabs } from "./components/mode_tabs";
import { use_downloads } from "./hooks/use_downloads";
import { c } from "@/theme";

export function Discover() {
  const { sp_tokens, sp_token } = use_settings();
  const { artists: lib_artists, tracks: lib_tracks, playlists, favs } = use_lib();
  const {
    downloads, dl_track, dl_album_all,
    sp_dl_keys, dl_sp_track, dl_sp_all,
    yt_tracks, yt_loading, yt_progress, yt_dl_keys, yt_import, dl_yt_track, dl_yt_all,
  } = use_downloads();

  const [q, set_q] = useState("");
  const [mode, set_mode] = useState<SearchMode>("tracks");
  const [track_results, set_track_results] = useState<DzTrack[]>([]);
  const [album_results, set_album_results] = useState<DzAlbum[]>([]);
  const [artist_results, set_artist_results] = useState<DzArtist[]>([]);
  const [searching, set_searching] = useState(false);
  const [no_res, set_no_res] = useState(false);
  const [drill, set_drill] = useState<DrillState | null>(null);
  const [drill_loading, set_drill_loading] = useState(false);

  const [sp_playlists, set_sp_playlists] = useState<SpPlaylist[] | null>(null);
  const [sp_loading, set_sp_loading] = useState(false);
  const [sp_drill, set_sp_drill] = useState<SpDrill | null>(null);

  const [rec_tracks, set_rec_tracks] = useState<DzTrack[]>([]);
  const [rec_loading, set_rec_loading] = useState(false);
  const [rec_source, set_rec_source] = useState("library");
  const [rec_open, set_rec_open] = useState(false);
  const rec_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (rec_ref.current && !rec_ref.current.contains(e.target as Node)) set_rec_open(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const rec_source_label = rec_source === "library" ? "All Library"
    : rec_source === "liked" ? "Liked Songs"
    : playlists.find((p) => p.id === rec_source)?.name ?? "All Library";

  function get_rec_artists(): string[] {
    let source_tracks;
    if (rec_source === "library") {
      const shuffled = [...lib_artists].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 8).map((a) => a.name);
    } else if (rec_source === "liked") {
      source_tracks = lib_tracks.filter((t) => favs.has(t.path));
    } else {
      const pl = playlists.find((p) => p.id === rec_source);
      if (!pl) return [];
      const paths = new Set(pl.tracks);
      source_tracks = lib_tracks.filter((t) => paths.has(t.path));
    }
    const unique = [...new Set(source_tracks.map((t) => t.artist))];
    const shuffled = unique.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }

  async function load_recs() {
    const names = get_rec_artists();
    if (!names.length) return;
    set_rec_loading(true);
    set_rec_tracks([]);
    try {
      const res = await invoke<DzTrack[]>("get_recommendations", { artists: names });
      set_rec_tracks(res);
    } catch {
      set_rec_tracks([]);
    } finally {
      set_rec_loading(false);
    }
  }

  async function do_search(query = q, m = mode) {
    if (!query.trim() || m === "spotify" || m === "youtube" || m === "recs") return;
    set_searching(true);
    set_no_res(false);
    set_drill(null);
    set_track_results([]);
    set_album_results([]);
    set_artist_results([]);
    try {
      if (m === "tracks") {
        const res = await invoke<DzTrack[]>("search_tracks", { q: query });
        set_track_results(res);
        if (!res.length) set_no_res(true);
      } else if (m === "albums") {
        const res = await invoke<DzAlbum[]>("search_albums", { q: query });
        set_album_results(res);
        if (!res.length) set_no_res(true);
      } else if (m === "artists") {
        const res = await invoke<DzArtist[]>("search_artists", { q: query });
        set_artist_results(res);
        if (!res.length) set_no_res(true);
      }
    } catch {
      set_no_res(true);
    } finally {
      set_searching(false);
    }
  }

  function switch_mode(m: SearchMode) {
    set_mode(m);
    set_drill(null);
    set_sp_drill(null);
    set_track_results([]);
    set_album_results([]);
    set_artist_results([]);
    set_no_res(false);
    if (m === "spotify") {
      load_sp_playlists();
    } else if (q.trim()) {
      do_search(q, m);
    }
  }

  async function load_sp_playlists() {
    if (!sp_tokens) return;
    set_sp_loading(true);
    try {
      const token = await sp_token();
      const pls = await invoke<SpPlaylist[]>("sp_playlists", { accessToken: token });
      set_sp_playlists(pls);
    } catch (e) {
      set_sp_playlists([]);
      message(`Failed to load playlists:\n${e}`, { title: "Spotify Error", kind: "error" });
    } finally {
      set_sp_loading(false);
    }
  }

  async function open_sp_playlist(pl: SpPlaylist) {
    if (!sp_tokens) return;
    set_sp_drill({ kind: "playlist", name: pl.name, tracks: null });
    try {
      const token = await sp_token();
      const tracks = await invoke<SpTrack[]>("sp_playlist_tracks", { accessToken: token, id: pl.id });
      set_sp_drill({ kind: "playlist", name: pl.name, tracks });
    } catch (e) {
      set_sp_drill({ kind: "playlist", name: pl.name, tracks: [] });
      message(`Failed to load playlist "${pl.name}":\n${e}`, { title: "Spotify Error", kind: "error" });
    }
  }

  async function open_sp_liked() {
    if (!sp_tokens) return;
    set_sp_drill({ kind: "liked", name: "Liked Songs", tracks: null });
    try {
      const token = await sp_token();
      const tracks = await invoke<SpTrack[]>("sp_liked_tracks", { accessToken: token });
      set_sp_drill({ kind: "liked", name: "Liked Songs", tracks });
    } catch (e) {
      set_sp_drill({ kind: "liked", name: "Liked Songs", tracks: [] });
      message(`Failed to load liked songs:\n${e}`, { title: "Spotify Error", kind: "error" });
    }
  }

  async function open_album(album: DzAlbum) {
    set_drill({ kind: "album_tracks", album, tracks: null });
    set_drill_loading(true);
    try {
      const tracks = await invoke<DzTrack[]>("get_album_tracks", {
        albumId: album.id,
        albumTitle: album.title,
        albumArtist: album.artist,
        coverUrl: album.cover_url,
      });
      set_drill({ kind: "album_tracks", album, tracks });
    } catch {
      set_drill({ kind: "album_tracks", album, tracks: [] });
    } finally {
      set_drill_loading(false);
    }
  }

  async function open_artist(artist: DzArtist) {
    set_drill({ kind: "artist_albums", artist, albums: null });
    set_drill_loading(true);
    try {
      const albums = await invoke<DzAlbum[]>("get_artist_albums", {
        artistId: artist.id,
      });
      set_drill({ kind: "artist_albums", artist, albums });
    } catch {
      set_drill({ kind: "artist_albums", artist, albums: [] });
    } finally {
      set_drill_loading(false);
    }
  }

  const has_results =
    track_results.length > 0 ||
    album_results.length > 0 ||
    artist_results.length > 0;
  const show_empty = !has_results && !searching && !no_res && !drill && mode !== "spotify" && mode !== "youtube" && mode !== "recs";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SearchHeader
        query={q}
        set_query={set_q}
        searching={searching}
        has_drill={!!(drill || sp_drill)}
        on_search={() => do_search()}
        on_back={() => { set_drill(null); set_sp_drill(null); }}
      />

      {!drill && !sp_drill && (
        <ModeTabs
          mode={mode}
          has_spotify={!!sp_tokens}
          on_switch={switch_mode}
        />
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {show_empty && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: c.w20,
            }}
          >
            <Music2 size={48} strokeWidth={1} />
            <p style={{ fontSize: 14 }}>Search for music to download</p>
          </div>
        )}
        {no_res && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: c.w25,
              fontSize: 14,
            }}
          >
            No results found
          </div>
        )}

        {mode === "recs" && (
          <>
            <div style={{ display: "flex", alignItems: "center", padding: "4px 24px 8px", gap: 8 }}>
              <div ref={rec_ref} style={{ position: "relative" }}>
                <button
                  onClick={() => set_rec_open(!rec_open)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: c.w06, color: c.text, border: `1px solid ${c.w08}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {rec_source_label}
                  <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </button>
                {rec_open && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, marginTop: 4,
                    background: c.card, border: `1px solid ${c.w10}`,
                    borderRadius: 12, padding: 4, zIndex: 50,
                    minWidth: 160, maxHeight: 240, overflowY: "auto",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}>
                    {[
                      { value: "library", label: "All Library" },
                      { value: "liked", label: "Liked Songs" },
                      ...playlists.map((p) => ({ value: p.id, label: p.name })),
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          set_rec_source(opt.value);
                          set_rec_tracks([]);
                          set_rec_open(false);
                        }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "7px 12px", borderRadius: 8, fontSize: 12,
                          color: rec_source === opt.value ? c.white : c.w60,
                          background: rec_source === opt.value ? c.w10 : "transparent",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          if (rec_source !== opt.value) e.currentTarget.style.background = c.w06;
                        }}
                        onMouseLeave={(e) => {
                          if (rec_source !== opt.value) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={load_recs}
                disabled={rec_loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: c.w06, color: c.w50, border: `1px solid ${c.w08}`,
                  opacity: rec_loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!rec_loading) e.currentTarget.style.color = c.white; }}
                onMouseLeave={(e) => (e.currentTarget.style.color = c.w50)}
              >
                <RefreshCw size={12} />
                {rec_tracks.length > 0 ? "Refresh" : "Go"}
              </button>
            </div>
            {rec_loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 10 }}>
                <div className="dot-bounce"><span /><span /><span /></div>
                <p style={{ color: c.w25, fontSize: 14 }}>Finding recommendations...</p>
              </div>
            )}
            {!rec_loading && rec_tracks.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12, color: c.w20 }}>
                <Music2 size={48} strokeWidth={1} />
                <p style={{ fontSize: 14 }}>Pick a source and hit Go</p>
              </div>
            )}
            {!rec_loading && rec_tracks.length > 0 && (
              <TrackResults tracks={rec_tracks} downloads={downloads} on_download={dl_track} />
            )}
          </>
        )}

        {mode === "youtube" && (
          <>
            <YtUrlInput loading={yt_loading} on_import={yt_import} />
            {yt_loading && <YtProgress progress={yt_progress} />}
            {!yt_loading && yt_tracks.length > 0 && (
              <YtTrackList
                tracks={yt_tracks}
                dl_keys={yt_dl_keys}
                on_download={dl_yt_track}
                on_download_all={dl_yt_all}
              />
            )}
          </>
        )}

        {mode === "spotify" && !sp_drill && (
          <SpPlaylistList
            playlists={sp_playlists}
            loading={sp_loading}
            on_open_playlist={open_sp_playlist}
            on_open_liked={open_sp_liked}
          />
        )}

        {mode === "spotify" && sp_drill && (
          <SpTrackList
            drill={sp_drill}
            dl_keys={sp_dl_keys}
            on_download={dl_sp_track}
            on_download_all={dl_sp_all}
          />
        )}

        {drill?.kind === "artist_albums" && (
          <DrillAlbums
            artist={drill.artist}
            albums={drill.albums}
            loading={drill_loading}
            on_open_album={open_album}
          />
        )}

        {drill?.kind === "album_tracks" && (
          <DrillTracks
            album={drill.album}
            tracks={drill.tracks}
            loading={drill_loading}
            downloads={downloads}
            on_download={dl_track}
            on_download_all={dl_album_all}
          />
        )}

        {!drill && mode === "tracks" && track_results.length > 0 && (
          <TrackResults tracks={track_results} downloads={downloads} on_download={dl_track} />
        )}

        {!drill && mode === "albums" && album_results.length > 0 && (
          <AlbumResults albums={album_results} on_open={open_album} />
        )}

        {!drill && mode === "artists" && artist_results.length > 0 && (
          <ArtistResults artists={artist_results} on_open={open_artist} />
        )}
      </div>
    </div>
  );
}
