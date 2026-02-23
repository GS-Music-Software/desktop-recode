mod client;
mod cover;

pub use client::{RpcState, init};

use tauri::State;

#[tauri::command]
pub fn rpc_on(rpc: State<'_, RpcState>) -> bool {
    let mut r = rpc.lock().unwrap();
    r.on()
}

#[tauri::command]
pub fn rpc_off(rpc: State<'_, RpcState>) {
    let mut r = rpc.lock().unwrap();
    r.off();
}

#[tauri::command]
pub fn rpc_set(
    rpc: State<'_, RpcState>,
    detail: String,
    state: String,
    large_txt: String,
    cover_url: Option<String>,
    playing: bool,
    show_ts: bool,
    elapsed: f64,
    duration: f64,
) {
    let mut r = rpc.lock().unwrap();
    r.set(&detail, &state, &large_txt, cover_url.as_deref(), playing, show_ts, elapsed, duration);
}

#[tauri::command]
pub fn rpc_clr(rpc: State<'_, RpcState>) {
    let mut r = rpc.lock().unwrap();
    r.clr();
}

#[tauri::command]
pub async fn rpc_cover(artist: String, title: String) -> Option<String> {
    cover::fetch(&artist, &title).await
}
