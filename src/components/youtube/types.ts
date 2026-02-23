export type YtTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
};

export type YtPlaylistResult = {
  name: string;
  tracks: YtTrack[];
};
