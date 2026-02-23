use super::types::*;

const API: &str = "https://api.spotify.com/v1";

async fn authed_get<T: serde::de::DeserializeOwned>(token: &str, url: &str) -> Result<T, String> {
    reqwest::Client::new()
        .get(url)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await
        .map_err(|e| format!("req: {e}"))?
        .json()
        .await
        .map_err(|e| format!("parse: {e}"))
}

fn track_from_raw(raw: &RawTrack) -> SpTrack {
    SpTrack {
        title: raw.name.clone(),
        artist: raw.artists.first().map_or(String::new(), |a| a.name.clone()),
        album: raw.album.as_ref().map_or(String::new(), |a| a.name.clone()),
        duration: (raw.duration_ms / 1000.0) as u64,
        cover_url: raw
            .album
            .as_ref()
            .and_then(|a| a.images.first())
            .map_or(String::new(), |i| i.url.clone()),
    }
}

pub async fn playlists(access_token: &str) -> Result<Vec<Playlist>, String> {
    let mut all = Vec::new();
    let mut url = format!("{API}/me/playlists?limit=50");

    loop {
        let res: PlaylistsRes = authed_get(access_token, &url).await?;
        all.extend(res.items.iter().map(|p| Playlist {
            id: p.id.clone(),
            name: p.name.clone(),
            nb_tracks: p.tracks.total,
        }));
        match res.next {
            Some(next) => url = next,
            None => break,
        }
    }

    Ok(all)
}

pub async fn playlist_tracks(access_token: &str, id: &str) -> Result<Vec<SpTrack>, String> {
    let mut all = Vec::new();
    let mut url = format!("{API}/playlists/{id}/tracks?limit=50");

    loop {
        let res: PlaylistTracksRes = authed_get(access_token, &url).await?;
        all.extend(res.items.iter().filter_map(|i| i.track.as_ref()).map(track_from_raw));
        match res.next {
            Some(next) => url = next,
            None => break,
        }
    }

    Ok(all)
}

pub async fn liked_tracks(access_token: &str) -> Result<Vec<SpTrack>, String> {
    let mut all = Vec::new();
    let mut url = format!("{API}/me/tracks?limit=50");

    loop {
        let res: SavedTracksRes = authed_get(access_token, &url).await?;
        all.extend(res.items.iter().map(|i| track_from_raw(&i.track)));
        match res.next {
            Some(next) => url = next,
            None => break,
        }
    }

    Ok(all)
}
