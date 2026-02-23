import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Music2 } from "lucide-react";
import { use_settings } from "@/ctx";
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
  const { sp_tokens } = use_settings();
  const {
    downloads, dl_track,
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

  async function do_search(query = q, m = mode) {
    if (!query.trim() || m === "spotify" || m === "youtube") return;
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
      const pls = await invoke<SpPlaylist[]>("sp_playlists", { accessToken: sp_tokens.access_token });
      set_sp_playlists(pls);
    } catch {
      set_sp_playlists([]);
    } finally {
      set_sp_loading(false);
    }
  }

  async function open_sp_playlist(pl: SpPlaylist) {
    if (!sp_tokens) return;
    set_sp_drill({ kind: "playlist", name: pl.name, tracks: null });
    try {
      const tracks = await invoke<SpTrack[]>("sp_playlist_tracks", { accessToken: sp_tokens.access_token, id: pl.id });
      set_sp_drill({ kind: "playlist", name: pl.name, tracks });
    } catch {
      set_sp_drill({ kind: "playlist", name: pl.name, tracks: [] });
    }
  }

  async function open_sp_liked() {
    if (!sp_tokens) return;
    set_sp_drill({ kind: "liked", name: "Liked Songs", tracks: null });
    try {
      const tracks = await invoke<SpTrack[]>("sp_liked_tracks", { accessToken: sp_tokens.access_token });
      set_sp_drill({ kind: "liked", name: "Liked Songs", tracks });
    } catch {
      set_sp_drill({ kind: "liked", name: "Liked Songs", tracks: [] });
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
  const show_empty = !has_results && !searching && !no_res && !drill && mode !== "spotify" && mode !== "youtube";

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
