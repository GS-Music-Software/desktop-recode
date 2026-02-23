export type Person = { name: string; handle: string; url: string; avatar: string };
export type Dep = { name: string; desc: string; url: string };

export const PEOPLE: Person[] = [
  {
    name: "GavinStrikes",
    handle: "GavinCoded",
    url: "https://github.com/GavinCoded",
    avatar: "https://avatars.githubusercontent.com/u/105064040?v=4",
  },
  {
    name: "Sage",
    handle: "sagevk",
    url: "https://github.com/sagevk",
    avatar: "https://avatars.githubusercontent.com/u/165743781?v=4",
  },
];

export const DEPS: Dep[] = [
  {
    name: "yt-dlp",
    desc: "Audio downloading from streaming platforms",
    url: "https://github.com/yt-dlp/yt-dlp",
  },
  {
    name: "FFmpeg",
    desc: "Audio processing and metadata embedding",
    url: "https://ffmpeg.org",
  },
  {
    name: "Tauri",
    desc: "Cross-platform desktop app framework",
    url: "https://tauri.app",
  },
  { name: "React", desc: "UI rendering", url: "https://react.dev" },
  {
    name: "Deezer API",
    desc: "Music search and metadata",
    url: "https://developers.deezer.com",
  },
];
