export type YtTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
  url?: string;
  metadata_found?: boolean;
};

export type YtPlaylistResult = {
  name: string;
  tracks: YtTrack[];
};
