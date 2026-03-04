use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct DzTrack {
    pub id: u64,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub cover_url: String,
    pub duration: u64,
}

#[derive(Deserialize)]
pub struct RawArtistName { pub name: String }
#[derive(Deserialize)]
pub struct RawAlbumInfo { pub title: String, pub cover_medium: String }
#[derive(Deserialize)]
pub struct RawTrack { pub id: u64, pub title: String, pub artist: RawArtistName, pub album: RawAlbumInfo, pub duration: u64 }
#[derive(Deserialize)]
pub struct TrackSearchRes { pub data: Vec<RawTrack> }

#[derive(Serialize, Deserialize, Clone)]
pub struct DzAlbumResult {
    pub id: u64,
    pub title: String,
    pub artist: String,
    pub cover_url: String,
    pub nb_tracks: u32,
}

#[derive(Deserialize)]
pub struct RawAlbum {
    pub id: u64,
    pub title: String,
    #[serde(default)]
    pub cover_medium: String,
    #[serde(default)]
    pub nb_tracks: u32,
    #[serde(default)]
    pub artist: Option<RawArtistName>,
}
#[derive(Deserialize)]
pub struct AlbumSearchRes { pub data: Vec<RawAlbum> }

#[derive(Serialize, Deserialize, Clone)]
pub struct DzArtistResult {
    pub id: u64,
    pub name: String,
    pub nb_album: u32,
    pub picture_url: String,
}

#[derive(Deserialize)]
pub struct RawArtist {
    pub id: u64,
    pub name: String,
    #[serde(default)]
    pub nb_album: u32,
    #[serde(default)]
    pub picture_medium: String,
}
#[derive(Deserialize)]
pub struct ArtistSearchRes { pub data: Vec<RawArtist> }

#[derive(Deserialize)]
pub struct RawAlbumTrack { pub id: u64, pub title: String, pub artist: RawArtistName, pub duration: u64 }
#[derive(Deserialize)]
pub struct AlbumTracksRes { pub data: Vec<RawAlbumTrack> }
