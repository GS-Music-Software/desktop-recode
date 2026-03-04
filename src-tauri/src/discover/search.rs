use super::util::{enc, dz_get};
use super::types::*;

#[tauri::command]
pub async fn search_tracks(q: String) -> Result<Vec<DzTrack>, String> {
    let url = format!("https://api.deezer.com/search/track?q={}&limit=25", enc(&q));
    let res: TrackSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|t| DzTrack {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        album: t.album.title,
        cover_url: t.album.cover_medium,
        duration: t.duration,
    }).collect())
}

#[tauri::command]
pub async fn search_albums(q: String) -> Result<Vec<DzAlbumResult>, String> {
    let url = format!("https://api.deezer.com/search/album?q={}&limit=25", enc(&q));
    let res: AlbumSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzAlbumResult {
        id: a.id,
        title: a.title,
        artist: a.artist.map_or(String::new(), |ar| ar.name),
        cover_url: a.cover_medium,
        nb_tracks: a.nb_tracks,
    }).collect())
}

#[tauri::command]
pub async fn search_artists(q: String) -> Result<Vec<DzArtistResult>, String> {
    let url = format!("https://api.deezer.com/search/artist?q={}&limit=25", enc(&q));
    let res: ArtistSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzArtistResult {
        id: a.id,
        name: a.name,
        nb_album: a.nb_album,
        picture_url: a.picture_medium,
    }).collect())
}

#[tauri::command]
pub async fn get_album_tracks(album_id: u64, album_title: String, album_artist: String, cover_url: String) -> Result<Vec<DzTrack>, String> {
    let url = format!("https://api.deezer.com/album/{}/tracks?limit=100", album_id);
    let res: AlbumTracksRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|t| DzTrack {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        album: album_title.clone(),
        cover_url: cover_url.clone(),
        duration: t.duration,
    }).collect())
}

#[tauri::command]
pub async fn get_artist_albums(artist_id: u64) -> Result<Vec<DzAlbumResult>, String> {
    let url = format!("https://api.deezer.com/artist/{}/albums?limit=100", artist_id);
    let res: AlbumSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzAlbumResult {
        id: a.id,
        title: a.title,
        artist: a.artist.map_or(String::new(), |ar| ar.name),
        cover_url: a.cover_medium,
        nb_tracks: a.nb_tracks,
    }).collect())
}
