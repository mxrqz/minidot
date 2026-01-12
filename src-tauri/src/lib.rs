// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_autostart::MacosLauncher;

// Store tray position for fallback when positioner doesn't have it
static TRAY_POSITION: Mutex<Option<(i32, i32)>> = Mutex::new(None);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn toggle_window_visibility(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            // Emit event so frontend can play close animation then hide
            let _ = app.emit("window-will-hide", ());
        } else {
            // Position window below tray icon using stored position
            if let Ok(guard) = TRAY_POSITION.lock() {
                if let Some((x, y)) = *guard {
                    let window_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 400, height: 500 });
                    let centered_x = x - (window_size.width as i32 / 2);
                    let _ = window.set_position(PhysicalPosition::new(centered_x, y));
                } else {
                    // No tray position yet, use top center as fallback
                    let _ = window.as_ref().window().move_window(Position::TopCenter);
                }
            }

            let _ = window.show();
            let _ = window.set_focus();
            // Emit event so frontend can play open animation
            let _ = app.emit("window-did-show", ());
        }
    }
}

fn store_tray_position(x: i32, y: i32, height: u32) {
    if let Ok(mut guard) = TRAY_POSITION.lock() {
        // Store position below tray icon
        *guard = Some((x, y + height as i32 + 4));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            // Load tray icon from the icons directory (template image for macOS)
            let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))
                .expect("Failed to load tray icon");

            // Create menu items
            let show_hide = MenuItemBuilder::with_id("show_hide", "Show/Hide")
                .build(app)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit")
                .build(app)?;

            // Build the menu
            let menu = MenuBuilder::new(app)
                .items(&[&show_hide, &separator, &quit])
                .build()?;

            // Build the tray icon (icon_as_template for proper macOS dark/light mode)
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show_hide" => {
                        toggle_window_visibility(app);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Required for tray-relative positions to work
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    match &event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            rect,
                            ..
                        } => {
                            // Store position for fallback
                            if let (tauri::Position::Physical(pos), tauri::Size::Physical(size)) = (&rect.position, &rect.size) {
                                store_tray_position(pos.x + (size.width as i32 / 2), pos.y, size.height);
                            }
                            let app = tray.app_handle();
                            toggle_window_visibility(app);
                        }
                        TrayIconEvent::Enter { rect, .. } => {
                            // Store position when mouse hovers
                            if let (tauri::Position::Physical(pos), tauri::Size::Physical(size)) = (&rect.position, &rect.size) {
                                store_tray_position(pos.x + (size.width as i32 / 2), pos.y, size.height);
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Register global shortcut (Option+Shift+Space)
            let shortcut = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::Space);
            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    toggle_window_visibility(&app_handle);
                }
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
