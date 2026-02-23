import { c } from "@/theme";

type Props = {
  source: "spotify" | "youtube";
  total: number;
  done: number;
  current: string;
  start_time: number;
};

export function MigratingView({ source, total, done, current, start_time }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = done > 0 ? Math.round(total - done) : total;
  let eta = "";
  if (done > 2 && start_time > 0) {
    const elapsed = (Date.now() - start_time) / 1000;
    const per_track = elapsed / done;
    const secs_left = Math.ceil(per_track * remaining);
    if (secs_left >= 60) {
      const mins = Math.floor(secs_left / 60);
      const secs = secs_left % 60;
      eta = `~${mins}m ${secs}s remaining`;
    } else {
      eta = `~${secs_left}s remaining`;
    }
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Migrating...
        </h2>
        <p style={{ fontSize: 15, color: c.w40, margin: 0 }}>
          {done} / {total} tracks
        </p>
      </div>
      <div style={{ maxWidth: 360 }}>
        <div style={{ height: 6, borderRadius: 3, background: c.w08, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: 3,
            background: source === "spotify" ? c.spotify : c.youtube,
            transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          {current ? (
            <p style={{
              fontSize: 12, color: c.w30, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1, minWidth: 0,
            }}>
              {current}
            </p>
          ) : <span />}
          {eta && (
            <p style={{ fontSize: 12, color: c.w25, margin: 0, flexShrink: 0, marginLeft: 12 }}>
              {eta}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
