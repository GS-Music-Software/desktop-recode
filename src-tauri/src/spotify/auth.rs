use sha2::{Sha256, Digest};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use std::time::Duration;

use super::types::{Tokens, TokenRes, ProfileRes};

const AUTH_URL: &str = "https://accounts.spotify.com/authorize";
const TOKEN_URL: &str = "https://accounts.spotify.com/api/token";
const API: &str = "https://api.spotify.com/v1";
const PORT: u16 = 18492;
const REDIRECT: &str = "http://127.0.0.1:18492/callback";
const SCOPES: &str = "playlist-read-private playlist-read-collaborative user-library-read";

fn gen_verifier() -> String {
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"
        .chars()
        .collect();
    let mut rng = rand::thread_rng();
    (0..64).map(|_| chars[rng.gen_range(0..chars.len())]).collect()
}

fn pkce_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

fn open_browser(url: &str) {
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).spawn();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd").args(["/C", "start", "", url]).spawn();
}

async fn listen_callback() -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{PORT}"))
        .await
        .map_err(|e| format!("bind: {e}"))?;

    let (mut stream, _) = tokio::time::timeout(Duration::from_secs(120), listener.accept())
        .await
        .map_err(|_| String::from("auth timeout"))?
        .map_err(|e| format!("accept: {e}"))?;

    let mut buf = vec![0u8; 4096];
    let n = stream.read(&mut buf).await.map_err(|e| format!("read: {e}"))?;
    let req = String::from_utf8_lossy(&buf[..n]);

    let code = req
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|path| path.split('?').nth(1))
        .and_then(|qs| qs.split('&').find(|p| p.starts_with("code=")))
        .map(|p| p.trim_start_matches("code=").to_string())
        .ok_or_else(|| String::from("no code in callback"))?;

    let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
                <html><body><h3>connected, you can close this tab</h3></body></html>";
    let _ = stream.write_all(html.as_bytes()).await;

    Ok(code)
}

pub async fn authorize(client_id: &str) -> Result<Tokens, String> {
    let verifier = gen_verifier();
    let challenge = pkce_challenge(&verifier);

    let auth_url = format!(
        "{AUTH_URL}?client_id={client_id}&response_type=code&redirect_uri={REDIRECT}\
         &code_challenge={challenge}&code_challenge_method=S256&scope={SCOPES}"
    );

    open_browser(&auth_url);
    let code = listen_callback().await?;

    let client = reqwest::Client::new();
    let token_res: TokenRes = client
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", &code),
            ("redirect_uri", REDIRECT),
            ("client_id", client_id),
            ("code_verifier", &verifier),
        ])
        .send()
        .await
        .map_err(|e| format!("token req: {e}"))?
        .json()
        .await
        .map_err(|e| format!("token parse: {e}"))?;

    let profile: ProfileRes = reqwest::Client::new()
        .get(format!("{API}/me"))
        .header("Authorization", format!("Bearer {}", token_res.access_token))
        .send()
        .await
        .map_err(|e| format!("profile req: {e}"))?
        .json()
        .await
        .map_err(|e| format!("profile parse: {e}"))?;

    Ok(Tokens {
        access_token: token_res.access_token,
        refresh_token: token_res.refresh_token.unwrap_or_default(),
        display_name: profile.display_name.unwrap_or_else(|| String::from("spotify user")),
    })
}
