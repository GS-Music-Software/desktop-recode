import { TTrack } from "./track";

export type TAlbum = {
  name: string;
  artist: string;
  cover_path: string | null;
  year: number | null;
  tracks: TTrack[];
};

export type TArtist = {
  name: string;
  cover_path: string | null;
  albums: TAlbum[];
  tracks: TTrack[];
};

export type TView = "songs" | "albums" | "artists" | "settings" | "album_detail" | "artist_detail" | "discover" | "audio" | "about" | "radio" | "playlist_detail" | "theme_editor" | "keybinds";

export type TPlaylist = {
  id: string;
  name: string;
  description: string;
  cover: string | null;
  tracks: string[];
};

export type TRadioStation = {
  id: string;
  name: string;
  url: string;
  genre: string;
  favicon: string;
  color: string;
};
