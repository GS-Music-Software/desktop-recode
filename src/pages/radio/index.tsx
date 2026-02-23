import { useState, useEffect, useCallback } from "react";
import { use_pl } from "@/ctx";
import { TRadioStation } from "@/types";
import { Radio, RefreshCw } from "lucide-react";
import { c } from "@/theme";

const API = "https://de1.api.radio-browser.info/json/stations/topvote/80?hidebroken=true&has_geo_info=false";

type ApiStation = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  votes: number;
};

function tag_to_genre(tags: string): string {
  if (!tags) return "Other";
  const t = tags.split(",")[0].trim();
  if (!t) return "Other";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function map_station(s: ApiStation): TRadioStation {
  return {
    id: s.stationuuid,
    name: s.name.trim(),
    url: s.url_resolved,
    genre: tag_to_genre(s.tags),
    favicon: s.favicon || "",
    color: c.accent,
  };
}

function StationIcon({ s, playing }: { s: TRadioStation; playing: boolean }) {
  const [err, set_err] = useState(false);

  if (playing) {
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: c.accent_15, border: `1px solid ${c.accent_30}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <LiveDots />
      </div>
    );
  }

  if (s.favicon && !err) {
    return (
      <img
        src={s.favicon}
        alt=""
        onError={() => set_err(true)}
        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: c.w06 }}
      />
    );
  }

  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
      background: c.w07, border: `1px solid ${c.w10}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Radio size={18} color={c.w35} />
    </div>
  );
}

function StationCard({ s, playing }: { s: TRadioStation; playing: boolean }) {
  const { play_station, toggle } = use_pl();
  const [hov, set_hov] = useState(false);

  function handle_click() {
    if (playing) toggle();
    else play_station(s);
  }

  return (
    <button
      onClick={handle_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 14px", borderRadius: 10, textAlign: "left", width: "100%",
        background: playing
          ? c.accent_12
          : hov ? c.w06 : c.w03,
        border: playing
          ? `1px solid ${c.accent_30}`
          : `1px solid ${c.w07}`,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <StationIcon s={s} playing={playing} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: playing ? c.text : c.w80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
        <p style={{ fontSize: 12, color: c.w40, marginTop: 2 }}>{s.genre}</p>
      </div>
      {playing && (
        <span style={{ fontSize: 11, fontWeight: 600, color: c.accent, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>Live</span>
      )}
    </button>
  );
}

function LiveDots() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="radio-bar" style={{
          width: 3, borderRadius: 2, background: c.accent,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

export function RadioPage() {
  const { current_station, playing } = use_pl();
  const [stations, set_stations] = useState<TRadioStation[]>([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState(false);
  const [genre, set_genre] = useState("All");
  const [search, set_search] = useState("");

  const fetch_stations = useCallback(async () => {
    set_loading(true);
    set_error(false);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("fetch failed");
      const data: ApiStation[] = await res.json();
      set_stations(data.map(map_station));
    } catch {
      set_error(true);
    } finally {
      set_loading(false);
    }
  }, []);

  useEffect(() => { fetch_stations(); }, [fetch_stations]);

  const genres = ["All", ...Array.from(new Set(stations.map(s => s.genre))).sort()];

  const filtered = stations.filter(s => {
    const match_genre = genre === "All" || s.genre === genre;
    const match_search = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.genre.toLowerCase().includes(search.toLowerCase());
    return match_genre && match_search;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, borderBottom: `1px solid ${c.w07}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Radio</h1>
          <button onClick={fetch_stations} style={{ opacity: loading ? 0.4 : 0.5, display: "flex", alignItems: "center" }} title="Refresh stations">
            <RefreshCw size={14} color={c.white} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
        <input
          value={search}
          onChange={e => set_search(e.target.value)}
          placeholder="Search stations…"
          style={{
            width: 200, padding: "7px 14px", borderRadius: 8, fontSize: 13,
            background: c.w06, border: `1px solid ${c.w10}`,
            color: c.text, outline: "none",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = c.accent_45)}
          onBlur={e => (e.currentTarget.style.borderColor = c.w10)}
        />
      </div>

      {!loading && !error && (
        <div style={{ padding: "12px 24px", flexShrink: 0, display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${c.w07}` }}>
          {genres.map(g => (
            <button
              key={g}
              onClick={() => set_genre(g)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: genre === g ? c.accent : c.w06,
                color: genre === g ? c.white : c.w50,
                border: genre === g ? "none" : `1px solid ${c.w08}`,
                transition: "background 0.12s, color 0.12s",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <Radio size={32} color={c.w15} />
            <p style={{ fontSize: 13, color: c.w30 }}>Loading stations…</p>
          </div>
        )}
        {error && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <p style={{ fontSize: 14, color: c.w40 }}>Couldn't load stations</p>
            <button
              onClick={fetch_stations}
              style={{ fontSize: 13, color: c.accent, textDecoration: "underline" }}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>
            {filtered.map(s => (
              <StationCard
                key={s.id}
                s={s}
                playing={current_station?.id === s.id && playing}
              />
            ))}
            {filtered.length === 0 && (
              <p style={{ fontSize: 14, color: c.w30, textAlign: "center", marginTop: 60, gridColumn: "1 / -1" }}>No stations found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
