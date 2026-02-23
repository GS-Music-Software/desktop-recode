export function format_duration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function format_count(n: number, label: string): string {
  return `${n} ${label}${n === 1 ? "" : "s"}`;
}
