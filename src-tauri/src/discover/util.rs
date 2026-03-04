#[cfg(target_os = "windows")]
pub const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn enc(s: &str) -> String {
    s.chars().map(|c| match c {
        ' ' => '+'.to_string(),
        c if c.is_alphanumeric() || "-_.~".contains(c) => c.to_string(),
        c => format!("%{:02X}", c as u32),
    }).collect()
}

pub async fn dz_get<T: serde::de::DeserializeOwned>(url: &str) -> Result<T, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("gs-music/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    client.get(url).send().await
        .map_err(|e| e.to_string())?
        .json().await
        .map_err(|e| e.to_string())
}
