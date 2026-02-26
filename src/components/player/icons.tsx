type P = { size?: number; color?: string };

export function SkipBackIcon({ size = 20, color = "#fff" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill={color}>
      <path d="M14.5,5.8 C14.5,4.6 13.8,4 13,4.8 L4,12.5 C2.8,13.4 2.8,14.6 4,15.5 L13,23.2 C13.8,24 14.5,23.4 14.5,22.2 Z" />
      <path d="M27,5.8 C27,4.6 26.3,4 25.5,4.8 L16.5,12.5 C15.3,13.4 15.3,14.6 16.5,15.5 L25.5,23.2 C26.3,24 27,23.4 27,22.2 Z" />
    </svg>
  );
}

export function SkipFwdIcon({ size = 20, color = "#fff" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill={color}>
      <path d="M13.5,5.8 C13.5,4.6 14.2,4 15,4.8 L24,12.5 C25.2,13.4 25.2,14.6 24,15.5 L15,23.2 C14.2,24 13.5,23.4 13.5,22.2 Z" />
      <path d="M1,5.8 C1,4.6 1.7,4 2.5,4.8 L11.5,12.5 C12.7,13.4 12.7,14.6 11.5,15.5 L2.5,23.2 C1.7,24 1,23.4 1,22.2 Z" />
    </svg>
  );
}

export function PlayIcon({ size = 16, color = "#000" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill={color}>
      <path d="M10,6.5 C10,4.8 10.8,4 12,4.7 L33,17.2 C34.3,18 34.3,20 33,20.8 L12,33.3 C10.8,34 10,33.2 10,31.5 Z" />
    </svg>
  );
}

export function PauseIcon({ size = 16, color = "#000" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill={color}>
      <rect x="7" y="5" width="8.5" height="28" rx="2.5" />
      <rect x="22.5" y="5" width="8.5" height="28" rx="2.5" />
    </svg>
  );
}
