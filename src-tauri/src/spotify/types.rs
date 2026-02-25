use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tokens {
    pub access_token: String,
    pub refresh_token: String,
    pub display_name: String,
    #[serde(default)]
    pub expires_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub nb_tracks: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: u64,
    pub cover_url: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenRes {
    pub access_token: String,
    pub refresh_token: Option<String>,
    #[serde(default = "default_expires_in")]
    pub expires_in: u64,
}

fn default_expires_in() -> u64 { 3600 }

#[derive(Debug, Deserialize)]
pub struct ProfileRes {
    #[serde(default)]
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistsRes {
    #[serde(default)]
    pub items: Vec<RawPlaylist>,
    pub next: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RawPlaylist {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub tracks: PlaylistTracksRef,
}

#[derive(Debug, Deserialize, Default)]
pub struct PlaylistTracksRef {
    #[serde(default)]
    pub total: u32,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistTracksRes {
    #[serde(default)]
    pub items: Vec<PlaylistItem>,
    pub next: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistItem {
    pub track: Option<RawTrack>,
}

#[derive(Debug, Deserialize)]
pub struct SavedTracksRes {
    #[serde(default)]
    pub items: Vec<SavedTrack>,
    pub next: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SavedTrack {
    pub track: RawTrack,
}

#[derive(Debug, Deserialize)]
pub struct RawTrack {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub duration_ms: f64,
    #[serde(default)]
    pub track_number: Option<u32>,
    #[serde(default)]
    pub artists: Vec<RawArtist>,
    #[serde(default)]
    pub album: Option<RawAlbum>,
}

#[derive(Debug, Deserialize)]
pub struct RawArtist {
    #[serde(default)]
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct RawAlbum {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub images: Vec<Image>,
}

#[derive(Debug, Deserialize)]
pub struct Image {
    #[serde(default)]
    pub url: String,
}
