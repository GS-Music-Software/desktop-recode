export type SpPlaylist = {
  id: string;
  name: string;
  nb_tracks: number;
};

export type SpTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
};

export type SpDrill = {
  kind: "playlist" | "liked";
  name: string;
  tracks: SpTrack[] | null;
};
