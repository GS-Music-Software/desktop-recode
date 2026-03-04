export type SearchMode = "tracks" | "albums" | "artists" | "recs" | "spotify" | "youtube";

export type DzTrack = {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  duration: number;
};

export type DzAlbum = {
  id: number;
  title: string;
  artist: string;
  cover_url: string;
  nb_tracks: number;
};

export type DzArtist = {
  id: number;
  name: string;
  nb_album: number;
  picture_url: string;
};

export type { DlState } from "@/types";

export type DrillState =
  | { kind: "artist_albums"; artist: DzArtist; albums: DzAlbum[] | null }
  | { kind: "album_tracks"; album: DzAlbum; tracks: DzTrack[] | null };
