use serde::Deserialize;
use std::collections::HashSet;
use super::util::{enc, dz_get};
use super::types::*;

#[derive(Deserialize)]
struct RelatedArtistsRes { data: Vec<RawArtist> }

#[derive(Deserialize)]
struct TopTracksRes { data: Vec<RawTrack> }

#[tauri::command]
pub async fn get_recommendations(artists: Vec<String>) -> Result<Vec<DzTrack>, String> {
    let mut tracks = Vec::new();
    let mut seen_tracks: HashSet<u64> = HashSet::new();
    let mut seen_artists: HashSet<u64> = HashSet::new();
    let mut related_ids: Vec<u64> = Vec::new();
    let lib_names: HashSet<String> = artists.iter().map(|n| n.to_lowercase()).collect();

    for name in &artists {
        let url = format!("https://api.deezer.com/search/artist?q={}&limit=1", enc(name));
        let res: ArtistSearchRes = match dz_get(&url).await {
            Ok(r) => r,
            Err(_) => continue,
        };
        let artist = match res.data.into_iter().next() {
            Some(a) => a,
            None => continue,
        };
        let rel_url = format!("https://api.deezer.com/artist/{}/related?limit=10", artist.id);
        let related: RelatedArtistsRes = match dz_get(&rel_url).await {
            Ok(r) => r,
            Err(_) => continue,
        };
        for r in related.data {
            if seen_artists.insert(r.id) && !lib_names.contains(&r.name.to_lowercase()) {
                related_ids.push(r.id);
            }
        }
    }

    for id in related_ids.iter().take(20) {
        let url = format!("https://api.deezer.com/artist/{}/top?limit=10", id);
        let res: TopTracksRes = match dz_get(&url).await {
            Ok(r) => r,
            Err(_) => continue,
        };
        for t in res.data {
            if seen_tracks.insert(t.id) && !lib_names.contains(&t.artist.name.to_lowercase()) {
                tracks.push(DzTrack {
                    id: t.id,
                    title: t.title,
                    artist: t.artist.name,
                    album: t.album.title,
                    cover_url: t.album.cover_medium,
                    duration: t.duration,
                });
            }
        }
    }

    use rand::seq::SliceRandom;
    tracks.shuffle(&mut rand::thread_rng());
    tracks.truncate(50);
    Ok(tracks)
}
