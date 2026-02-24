export function hex_to_hsv(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  const sat = max === 0 ? 0 : d / max;
  return [hue, sat * 100, max * 100];
}

export function hsv_to_hex(h: number, s: number, v: number): string {
  const s1 = s / 100;
  const v1 = v / 100;
  const c = v1 * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v1 - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to_hex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${to_hex(r)}${to_hex(g)}${to_hex(b)}`;
}

export function is_valid_hex(s: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(s);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
