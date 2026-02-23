import type { RpcField, RpcOpts } from "@/ctx";
import { Select } from "./select";
import { Toggle } from "./toggle";
import { c } from "@/theme";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0",
};

const sep: React.CSSProperties = {
  height: 1,
  background: c.w06,
};

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: "0 20px",
  background: c.w04,
  border: `1px solid ${c.w07}`,
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: c.w30,
  marginBottom: 10,
};

const FIELD_LABELS: Record<RpcField, string> = {
  title: "Song Title",
  artist: "Artist",
  album: "Album",
  title_artist: "Title - Artist",
  artist_album: "Artist - Album",
  none: "Hidden",
};

const FIELD_OPTIONS = Object.entries(FIELD_LABELS).map(([value, label]) => ({ value, label }));

export function RpcSettings({ opts, set_opts }: { opts: RpcOpts; set_opts: (o: RpcOpts) => void }) {
  return (
    <div>
      <p style={lbl}>Rich Presence</p>
      <div style={card}>
        <div style={row}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Top Line</p>
            <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>First line shown in Discord</p>
          </div>
          <Select value={opts.detail} on_change={(v) => set_opts({ ...opts, detail: v as RpcField })} options={FIELD_OPTIONS} />
        </div>

        <div style={sep} />

        <div style={row}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Bottom Line</p>
            <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>Second line shown in Discord</p>
          </div>
          <Select value={opts.state} on_change={(v) => set_opts({ ...opts, state: v as RpcField })} options={FIELD_OPTIONS} />
        </div>

        <div style={sep} />

        <div style={row}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Show Timestamp</p>
            <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>Elapsed and remaining time</p>
          </div>
          <Toggle on={opts.show_ts} set_on={(v) => set_opts({ ...opts, show_ts: v })} />
        </div>

        <div style={sep} />

        <div style={row}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Show Album Art</p>
            <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>Fetch cover from Deezer</p>
          </div>
          <Toggle on={opts.show_art} set_on={(v) => set_opts({ ...opts, show_art: v })} />
        </div>
      </div>
    </div>
  );
}
