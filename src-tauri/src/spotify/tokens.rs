use super::types::Tokens;

fn data_dir() -> std::path::PathBuf {
    crate::ytdlp_setup::data_dir()
}

pub fn save_tokens(tokens: &Tokens) {
    let path = data_dir().join("spotify_tokens.json");
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(&path, serde_json::to_string(tokens).unwrap_or_default());
}

pub fn load_tokens() -> Option<Tokens> {
    let data = std::fs::read_to_string(data_dir().join("spotify_tokens.json")).ok()?;
    serde_json::from_str(&data).ok()
}

pub fn clear_tokens() {
    let _ = std::fs::remove_file(data_dir().join("spotify_tokens.json"));
}

pub fn save_client_id(id: &str) {
    let path = data_dir().join("spotify_client_id");
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(&path, id);
}

pub fn load_client_id() -> Option<String> {
    let s = std::fs::read_to_string(data_dir().join("spotify_client_id")).ok()?;
    let s = s.trim().to_string();
    if s.is_empty() { None } else { Some(s) }
}
