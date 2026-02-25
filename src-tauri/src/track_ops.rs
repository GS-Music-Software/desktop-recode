use std::path::Path;

#[tauri::command]
pub fn delete_track(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("file not found".into());
    }
    std::fs::remove_file(p).map_err(|e| format!("failed to delete: {e}"))
}
