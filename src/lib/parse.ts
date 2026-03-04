import { TTrack, TAlbum, TArtist } from "@/types";

export function make_albums(tracks: TTrack[]): TAlbum[] {
  const map = new Map<string, TAlbum>();

  for (const t of tracks) {
    const key = `${t.artist}::${t.album}`;
    if (!map.has(key)) {
      map.set(key, { name: t.album, artist: t.artist, cover_path: t.cover ?? t.path, year: t.year, tracks: [] });
    }
    map.get(key)!.tracks.push(t);
  }

  const albums = Array.from(map.values());
  for (const a of albums) a.tracks.sort((x, y) => x.track_no - y.track_no);
  return albums.sort((a, b) => a.name.localeCompare(b.name));
}

export function make_artists(tracks: TTrack[]): TArtist[] {
  const map = new Map<string, TArtist>();

  for (const t of tracks) {
    if (!map.has(t.artist)) {
      map.set(t.artist, { name: t.artist, cover_path: t.cover ?? t.path, albums: [], tracks: [] });
    }
    map.get(t.artist)!.tracks.push(t);
  }

  const artists = Array.from(map.values());
  for (const a of artists) a.albums = make_albums(a.tracks);
  return artists.sort((a, b) => a.name.localeCompare(b.name));
}
