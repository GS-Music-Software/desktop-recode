use sha2::{Sha256, Digest};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use super::types::{Tokens, TokenRes, ProfileRes};

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs()
}

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

fn extract_code(req: &str) -> Option<String> {
    req.lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|path| path.split('?').nth(1))
        .and_then(|qs| qs.split('&').find(|p| p.starts_with("code=")))
        .map(|p| p.trim_start_matches("code=").to_string())
}

async fn listen_callback() -> Result<String, String> {
    eprintln!("[spotify] binding to 127.0.0.1:{PORT}");
    let listener = TcpListener::bind(format!("127.0.0.1:{PORT}"))
        .await
        .map_err(|e| format!("bind: {e}"))?;

    let deadline = tokio::time::Instant::now() + Duration::from_secs(120);

    loop {
        let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
        if remaining.is_zero() {
            eprintln!("[spotify] auth timeout after 120s");
            return Err(String::from("auth timeout"));
        }

        let (mut stream, addr) = tokio::time::timeout(remaining, listener.accept())
            .await
            .map_err(|_| String::from("auth timeout"))?
            .map_err(|e| format!("accept: {e}"))?;

        let mut buf = vec![0u8; 4096];
        let n = stream.read(&mut buf).await.map_err(|e| format!("read: {e}"))?;
        let req = String::from_utf8_lossy(&buf[..n]);
        let first_line = req.lines().next().unwrap_or("");
        eprintln!("[spotify] request from {addr}: {first_line}");

        if let Some(code) = extract_code(&req) {
            eprintln!("[spotify] got auth code");
            let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
                        <html><body><h3>connected, you can close this tab</h3></body></html>";
            let _ = stream.write_all(html.as_bytes()).await;
            return Ok(code);
        }

        eprintln!("[spotify] no code in request, waiting for next...");
        let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n";
        let _ = stream.write_all(html.as_bytes()).await;
    }
}

pub async fn authorize(client_id: &str) -> Result<Tokens, String> {
    let verifier = gen_verifier();
    let challenge = pkce_challenge(&verifier);

    let auth_url = format!(
        "{AUTH_URL}?client_id={client_id}&response_type=code&redirect_uri={REDIRECT}\
         &code_challenge={challenge}&code_challenge_method=S256&scope={SCOPES}"
    );

    eprintln!("[spotify] opening browser for auth");
    open_browser(&auth_url);
    let code = listen_callback().await?;

    eprintln!("[spotify] exchanging code for tokens");
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
        .map_err(|e| { eprintln!("[spotify] token req failed: {e}"); format!("token req: {e}") })?
        .json()
        .await
        .map_err(|e| { eprintln!("[spotify] token parse failed: {e}"); format!("token parse: {e}") })?;

    eprintln!("[spotify] fetching profile");
    let profile_body = reqwest::Client::new()
        .get(format!("{API}/me"))
        .header("Authorization", format!("Bearer {}", token_res.access_token))
        .send()
        .await
        .map_err(|e| { eprintln!("[spotify] profile req failed: {e}"); format!("profile req: {e}") })?
        .text()
        .await
        .map_err(|e| { eprintln!("[spotify] profile read failed: {e}"); format!("profile read: {e}") })?;
    eprintln!("[spotify] profile response: {profile_body}");
    let profile: ProfileRes = serde_json::from_str(&profile_body)
        .map_err(|e| { eprintln!("[spotify] profile parse failed: {e}"); format!("profile parse: {e}") })?;

    eprintln!("[spotify] authorized as {}", profile.display_name.as_deref().unwrap_or("unknown"));
    Ok(Tokens {
        access_token: token_res.access_token,
        refresh_token: token_res.refresh_token.unwrap_or_default(),
        display_name: profile.display_name.unwrap_or_else(|| String::from("spotify user")),
        expires_at: now_secs() + token_res.expires_in.saturating_sub(60),
    })
}

pub async fn refresh(client_id: &str, tokens: &Tokens) -> Result<Tokens, String> {
    eprintln!("[spotify] refreshing access token");
    let client = reqwest::Client::new();
    let token_res: TokenRes = client
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", &tokens.refresh_token),
            ("client_id", client_id),
        ])
        .send()
        .await
        .map_err(|e| { eprintln!("[spotify] refresh req failed: {e}"); format!("refresh req: {e}") })?
        .json()
        .await
        .map_err(|e| { eprintln!("[spotify] refresh parse failed: {e}"); format!("refresh parse: {e}") })?;

    eprintln!("[spotify] token refreshed successfully");
    Ok(Tokens {
        access_token: token_res.access_token,
        refresh_token: token_res.refresh_token.unwrap_or_else(|| tokens.refresh_token.clone()),
        display_name: tokens.display_name.clone(),
        expires_at: now_secs() + token_res.expires_in.saturating_sub(60),
    })
}
