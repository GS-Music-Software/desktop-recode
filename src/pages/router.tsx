import { use_lib } from "@/ctx";
import { Songs } from "./library/songs";
import { Albums } from "./library/albums";
import { AlbumDetail } from "./library/albums/detail";
import { Artists } from "./library/artists";
import { ArtistDetail } from "./library/artists/detail";
import { PlaylistDetail } from "./library/playlist_detail";
import { Settings } from "./settings";
import { About } from "./settings/about";
import { ThemeEditor } from "./settings/theme_editor";
import { Keybinds } from "./settings/keybinds";
import { Discover } from "./discover";
import { Audio } from "./audio";
import { RadioPage } from "./radio";

export function Router() {
  const { view } = use_lib();

  const page = (() => {
    switch (view) {
      case "songs": return <Songs />;
      case "albums": return <Albums />;
      case "artists": return <Artists />;
      case "album_detail": return <AlbumDetail />;
      case "artist_detail": return <ArtistDetail />;
      case "settings": return <Settings />;
      case "discover": return <Discover />;
      case "audio": return <Audio />;
      case "about": return <About />;
      case "radio": return <RadioPage />;
      case "playlist_detail": return <PlaylistDetail />;
      case "theme_editor": return <ThemeEditor />;
      case "keybinds": return <Keybinds />;
    }
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {page}
    </div>
  );
}
