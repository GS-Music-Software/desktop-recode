export type Action =
  | "play_pause"
  | "next"
  | "prev"
  | "vol_up"
  | "vol_down"
  | "mute"
  | "seek_fwd"
  | "seek_back"
  | "shuffle"
  | "repeat";

export type Binds = Record<Action, string>;

export type Group = { label: string; actions: Action[] };

export const GROUPS: Group[] = [
  { label: "Playback", actions: ["play_pause", "next", "prev", "shuffle", "repeat"] },
  { label: "Volume", actions: ["vol_up", "vol_down", "mute"] },
  { label: "Seeking", actions: ["seek_fwd", "seek_back"] },
];

export const LABELS: Record<Action, string> = {
  play_pause: "Play / Pause",
  next: "Next Track",
  prev: "Previous Track",
  vol_up: "Volume Up",
  vol_down: "Volume Down",
  mute: "Mute",
  seek_fwd: "Seek Forward",
  seek_back: "Seek Backward",
  shuffle: "Shuffle",
  repeat: "Repeat",
};

export const DEFAULTS: Binds = {
  play_pause: "Space",
  next: "Ctrl+ArrowRight",
  prev: "Ctrl+ArrowLeft",
  vol_up: "Ctrl+ArrowUp",
  vol_down: "Ctrl+ArrowDown",
  mute: "Ctrl+m",
  seek_fwd: "ArrowRight",
  seek_back: "ArrowLeft",
  shuffle: "Ctrl+s",
  repeat: "Ctrl+r",
};

const KEY = "keybinds";

export function load(): Binds {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(binds: Binds) {
  localStorage.setItem(KEY, JSON.stringify(binds));
}

export function combo_from_event(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (!["Control", "Meta", "Alt", "Shift"].includes(e.key)) {
    parts.push(e.key);
  }
  return parts.join("+");
}

const DISPLAY: Record<string, string> = {
  ArrowUp: "\u2191",
  ArrowDown: "\u2193",
  ArrowLeft: "\u2190",
  ArrowRight: "\u2192",
  Space: "Space",
};

export function combo_label(combo: string): string {
  return combo
    .split("+")
    .map((k) => DISPLAY[k] ?? k.charAt(0).toUpperCase() + k.slice(1))
    .join(" + ");
}
