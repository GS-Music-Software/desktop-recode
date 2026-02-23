import { Heart, ListMusic } from "lucide-react";
import type { SpPlaylist } from "@/components/spotify/discover";
import { BackBtn } from "../migrate/back_btn";
import { CheckRow } from "../migrate/check_row";
import { c } from "@/theme";

type Props = {
  sp_tokens: { display_name: string } | null;
  sp_loading: boolean;
  sp_pls_loading: boolean;
  playlists: SpPlaylist[] | null;
  checked: Set<string>;
  liked_checked: boolean;
  on_back: () => void;
  on_toggle_pl: (id: string) => void;
  on_toggle_liked: () => void;
  on_migrate: () => void;
};

export function SpPlaylistsView({
  sp_tokens,
  sp_loading,
  sp_pls_loading,
  playlists,
  checked,
  liked_checked,
  on_back,
  on_toggle_pl,
  on_toggle_liked,
  on_migrate,
}: Props) {
  return (
    <>
      <BackBtn on_click={on_back} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Select playlists
        </h2>
        {sp_tokens && (
          <p style={{ fontSize: 13, color: c.w35, margin: 0 }}>
            Connected as{" "}
            <span style={{ color: c.spotify }}>{sp_tokens.display_name}</span>
          </p>
        )}
      </div>

      {(sp_loading || sp_pls_loading) && (
        <div style={{ display: "flex", gap: 6 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}

      {!sp_loading && !sp_pls_loading && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 4,
          maxHeight: 280, overflowY: "auto", marginRight: -8, paddingRight: 8,
        }}>
          <CheckRow
            checked={liked_checked}
            on_toggle={on_toggle_liked}
            icon={<Heart size={16} color={c.white} fill={c.white} />}
            icon_bg={c.liked_gradient}
            label="Liked Songs"
            sub="Your saved tracks → GS Music Favorites"
          />
          {playlists?.map((pl) => (
            <CheckRow
              key={pl.id}
              checked={checked.has(pl.id)}
              on_toggle={() => on_toggle_pl(pl.id)}
              icon={<ListMusic size={16} color={c.w50} />}
              icon_bg={c.w06}
              label={pl.name}
              sub={`${pl.nb_tracks} tracks`}
            />
          ))}
        </div>
      )}

      {!sp_loading && !sp_pls_loading && (liked_checked || checked.size > 0) && (
        <button
          onClick={on_migrate}
          style={{
            alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, background: c.spotify, color: c.white,
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Migrate Selected
        </button>
      )}
    </>
  );
}
