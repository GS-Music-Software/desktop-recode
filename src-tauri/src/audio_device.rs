use std::process::Command;

#[tauri::command]
pub fn get_audio_device() -> (String, String) {
    get_device().unwrap_or_else(|| ("Speakers".into(), String::new()))
}

#[cfg(target_os = "linux")]
fn get_device() -> Option<(String, String)> {
    let default = Command::new("pactl")
        .args(["get-default-sink"])
        .output()
        .ok()?;
    let sink_name = String::from_utf8_lossy(&default.stdout).trim().to_string();
    if sink_name.is_empty() {
        return None;
    }

    let info = Command::new("pactl")
        .args(["list", "sinks"])
        .output()
        .ok()?;
    let output = String::from_utf8_lossy(&info.stdout);

    let mut in_sink = false;
    let mut description = String::new();
    let mut form_factor = String::new();

    for line in output.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("Name:") {
            in_sink = rest.trim() == sink_name;
            if in_sink {
                description.clear();
                form_factor.clear();
            }
            continue;
        }
        if !in_sink {
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("Description:") {
            description = rest.trim().to_string();
        } else if let Some(v) = trimmed.strip_prefix("device.form_factor = ") {
            form_factor = v.trim_matches('"').to_string();
        }
    }

    if description.is_empty() {
        return None;
    }

    Some((description, form_factor))
}

#[cfg(target_os = "windows")]
fn get_device() -> Option<(String, String)> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps = Command::new("powershell")
        .args(["-NoProfile", "-Command",
            r#"Get-CimInstance Win32_SoundDevice | Where-Object { $_.StatusInfo -eq 3 } | Select-Object -First 1 -ExpandProperty Name"#
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let mut name = String::from_utf8_lossy(&ps.stdout).trim().to_string();
    if name.is_empty() {
        let fallback = Command::new("powershell")
            .args(["-NoProfile", "-Command",
                r#"Get-CimInstance Win32_SoundDevice | Select-Object -First 1 -ExpandProperty Name"#
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .ok()?;
        name = String::from_utf8_lossy(&fallback.stdout).trim().to_string();
    }
    if name.is_empty() {
        return None;
    }
    Some((name, String::new()))
}

#[cfg(target_os = "macos")]
fn get_device() -> Option<(String, String)> {
    let out = Command::new("system_profiler")
        .args(["SPAudioDataType", "-json"])
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&out.stdout);
    let parsed: serde_json::Value = serde_json::from_str(&text).ok()?;
    let items = parsed.get("SPAudioDataType")?.as_array()?;
    for item in items {
        let name = item.get("_name")?.as_str()?;
        if item.get("coreaudio_default_audio_output_device")
            .and_then(|v| v.as_str())
            .map_or(false, |v| v == "spaudio_yes")
        {
            return Some((name.to_string(), String::new()));
        }
    }
    None
}
