use std::sync::Mutex;
use tauri::{
    Manager, AppHandle,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

const TRAY_ID: &str = "gs-tray";

pub type TrayFlag = Mutex<bool>;

pub fn init() -> TrayFlag {
    Mutex::new(false)
}

fn create(app: &AppHandle) -> Result<(), String> {
    if app.tray_by_id(TRAY_ID).is_some() { return Ok(()); }

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| -> Result<(), String> {
        let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>).map_err(|e| e.to_string())?;
        let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).map_err(|e| e.to_string())?;
        let menu = Menu::with_items(app, &[&show_i, &quit_i]).map_err(|e| e.to_string())?;

        TrayIconBuilder::with_id(TRAY_ID)
            .icon(app.default_window_icon().ok_or("no icon")?.clone())
            .tooltip("GS Music")
            .menu(&menu)
            .menu_on_left_click(false)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "show" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.unminimize();
                        let _ = w.set_focus();
                    }
                }
                "quit" => { app.exit(0); }
                _ => {}
            })
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event {
                    let app = tray.app_handle();
                    if let Some(w) = app.get_webview_window("main") {
                        if w.is_visible().unwrap_or(false) {
                            let _ = w.hide();
                        } else {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                }
            })
            .build(app)
            .map_err(|e| e.to_string())?;

        Ok(())
    }));

    match result {
        Ok(inner) => inner,
        Err(_) => Err("libayatana-appindicator3".into()),
    }
}

fn destroy(app: &AppHandle) {
    if let Some(tray) = app.remove_tray_by_id(TRAY_ID) {
        drop(tray);
    }
}

#[tauri::command]
pub fn tray_set(app: AppHandle, enabled: bool, flag: tauri::State<'_, TrayFlag>) -> Result<bool, String> {
    if enabled {
        create(&app)?;
        *flag.lock().unwrap() = true;
        Ok(true)
    } else {
        destroy(&app);
        *flag.lock().unwrap() = false;
        Ok(false)
    }
}
