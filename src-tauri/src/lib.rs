use tauri::{Manager, Runtime, Window, WebviewWindow, Emitter};
use window_vibrancy::{apply_mica, clear_vibrancy};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicI32, Ordering};
#[cfg(target_os = "windows")]
use windows::{
    core::w,
    Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM, HANDLE, POINT},
    Win32::Graphics::Dwm::*,
    Win32::UI::WindowsAndMessaging::*,
};

#[derive(serde::Deserialize, Clone, Copy, Debug)]
pub enum BackdropType { Mica, Acrylic, None }

#[cfg(target_os = "windows")]
static CURRENT_BACKDROP_TYPE: AtomicI32 = AtomicI32::new(2);
#[cfg(target_os = "windows")]
static HANDLE_SIDE: AtomicI32 = AtomicI32::new(0); 

struct MenuConfig {
    menu_type: String,
    target_id: Option<String>,
}
static ACTIVE_MENU_CONFIG: Mutex<Option<MenuConfig>> = Mutex::new(None);

fn get_config_dir<R: Runtime>(app: &tauri::AppHandle<R>) -> PathBuf {
    let path = app.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
    if !path.exists() { let _ = fs::create_dir_all(&path); }
    path
}

fn save_setting<R: Runtime>(app: &tauri::AppHandle<R>, filename: &str, value: i32) {
    let mut path = get_config_dir(app);
    path.push(filename);
    let _ = fs::write(path, value.to_string());
}

fn load_setting<R: Runtime>(app: &tauri::AppHandle<R>, filename: &str, default: i32) -> i32 {
    let mut path = get_config_dir(app);
    path.push(filename);
    fs::read_to_string(path).unwrap_or_default().parse().unwrap_or(default)
}

#[cfg(target_os = "windows")]
pub fn apply_visual_dna<R: Runtime>(window: &Window<R>, effect: BackdropType) {
    let hwnd = window.hwnd().unwrap().0 as isize;
    let hwnd = HWND(hwnd as *mut _);
    unsafe {
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &1i32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &0xFFFFFFFEu32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &DWMWCP_DONOTROUND.0 as *const _ as *const _, 4);
        let backdrop_type = match effect {
            BackdropType::Mica => { let _ = apply_mica(window, None); 2i32 },
            BackdropType::Acrylic => { let _ = clear_vibrancy(window); 3i32 },
            BackdropType::None => { let _ = clear_vibrancy(window); 1i32 },
        };
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &backdrop_type as *const _ as *const _, 4);
        setup_backdrop_persistence(hwnd);
    }
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn window_proc(hwnd: HWND, msg: u32, w_param: WPARAM, l_param: LPARAM) -> LRESULT {
    let prop = GetPropW(hwnd, w!("original_wndproc"));
    if prop.is_invalid() { return DefWindowProcW(hwnd, msg, w_param, l_param); }
    let original_proc: WNDPROC = std::mem::transmute(prop.0);
    match msg {
        WM_NCACTIVATE => (original_proc.unwrap())(hwnd, msg, WPARAM(1), l_param),
        WM_ACTIVATE => {
            let res = (original_proc.unwrap())(hwnd, msg, w_param, l_param);
            reapply_raw_attributes(hwnd);
            res
        }
        WM_NCDESTROY => {
            let _ = RemovePropW(hwnd, w!("original_wndproc"));
            (original_proc.unwrap())(hwnd, msg, w_param, l_param)
        }
        _ => (original_proc.unwrap())(hwnd, msg, w_param, l_param),
    }
}

#[cfg(target_os = "windows")]
fn reapply_raw_attributes(hwnd: HWND) {
    unsafe {
        let effect_val = CURRENT_BACKDROP_TYPE.load(Ordering::Relaxed);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &1i32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &0xFFFFFFFEu32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, &0xFFFFFFFEu32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &DWMWCP_DONOTROUND.0 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &effect_val as *const _ as *const _, 4);
    }
}

#[cfg(target_os = "windows")]
fn setup_backdrop_persistence(hwnd: HWND) {
    unsafe {
        let prop = GetPropW(hwnd, w!("original_wndproc"));
        if prop.is_invalid() {
            let original_proc = GetWindowLongPtrW(hwnd, GWLP_WNDPROC);
            let _ = SetPropW(hwnd, w!("original_wndproc"), Some(HANDLE(original_proc as *mut _)));
            SetWindowLongPtrW(hwnd, GWLP_WNDPROC, window_proc as *const () as isize);
        }
    }
}

#[cfg(target_os = "windows")]
fn calculate_handle_pos<R: Runtime>(main_win: &Window<R>, handle_win: &Window<R>, side: i32) -> (i32, i32) {
    let m_pos = main_win.outer_position().unwrap_or_default();
    let m_size = main_win.outer_size().unwrap_or_default();
    let h_size = handle_win.outer_size().unwrap_or_default();
    match side {
        1 => (m_pos.x + (m_size.width as i32 / 2) - (h_size.width as i32 / 2), m_pos.y + m_size.height as i32 + 5),
        2 => (m_pos.x - h_size.width as i32 - 5, m_pos.y + (m_size.height as i32 / 2) - (h_size.height as i32 / 2)),
        3 => (m_pos.x + m_size.width as i32 + 5, m_pos.y + (m_size.height as i32 / 2) - (h_size.height as i32 / 2)),
        _ => (m_pos.x + (m_size.width as i32 / 2) - (h_size.width as i32 / 2), m_pos.y - h_size.height as i32 - 5),
    }
}

#[tauri::command]
fn apply_window_effect<R: Runtime>(app: tauri::AppHandle<R>, effect: BackdropType) {
    let effect_val = match effect { BackdropType::Acrylic => 3, BackdropType::Mica => 2, BackdropType::None => 1 };
    CURRENT_BACKDROP_TYPE.store(effect_val, Ordering::SeqCst);
    save_setting(&app, "backdrop_type.txt", effect_val);
    for window in app.webview_windows().values() {
        #[cfg(target_os = "windows")]
        apply_visual_dna(&window.as_ref().window(), effect);
    }
}

#[tauri::command]
fn trigger_context_menu<R: Runtime>(app: tauri::AppHandle<R>, menu_type: String, target_id: Option<String>) {
    {
        let mut cache = ACTIVE_MENU_CONFIG.lock().unwrap();
        *cache = Some(MenuConfig { menu_type: menu_type.clone(), target_id: target_id.clone() });
    }
    if let Some(menu) = app.get_webview_window("context_menu") {
        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            let _ = GetCursorPos(&mut point);
            let _ = menu.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: point.x, y: point.y }));
            let _ = app.emit("setup-menu", serde_json::json!({ "type": menu_type, "targetId": target_id }));
            let _ = menu.show();
            let _ = menu.set_focus();
        }
    }
}

#[tauri::command]
fn get_active_menu_config() -> serde_json::Value {
    let cache = ACTIVE_MENU_CONFIG.lock().unwrap();
    if let Some(config) = cache.as_ref() {
        serde_json::json!({ "type": config.menu_type, "targetId": config.target_id })
    } else {
        serde_json::json!({ "type": "NONE" })
    }
}

// COMANDO PARA SINCRONIZAR EVENTOS ENTRE JANELAS (BYPASS PERMISSÕES JS)
#[tauri::command]
fn emit_global_event<R: Runtime>(app: tauri::AppHandle<R>, event: String) {
    let _ = app.emit(&event, serde_json::json!({}));
}

#[tauri::command]
fn start_drag_main<R: Runtime>(app: tauri::AppHandle<R>) {
    if let Some(main) = app.get_webview_window("main") { let _ = main.start_dragging(); }
}

#[tauri::command]
fn set_handle_side<R: Runtime>(app: tauri::AppHandle<R>, side: i32) {
    #[cfg(target_os = "windows")]
    {
        HANDLE_SIDE.store(side, Ordering::SeqCst);
        save_setting(&app, "handle_side.txt", side);
        if let (Some(main), Some(handle)) = (app.get_webview_window("main"), app.get_webview_window("handle_win")) {
            if side >= 2 { let _ = handle.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 20, height: 150 })); }
            else { let _ = handle.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 150, height: 20 })); }
            let (nx, ny) = calculate_handle_pos(&main.as_ref().window(), &handle.as_ref().window(), side);
            let _ = handle.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: nx, y: ny }));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::Moved(_) => {
                    #[cfg(target_os = "windows")]
                    if window.label() == "main" {
                        if let Some(h) = window.app_handle().get_webview_window("handle_win") {
                            let side = HANDLE_SIDE.load(Ordering::Relaxed);
                            let (nx, ny) = calculate_handle_pos(window, &h.as_ref().window(), side);
                            let _ = h.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: nx, y: ny }));
                        }
                    }
                }
                tauri::WindowEvent::Focused(false) => {
                    if window.label() == "context_menu" { let _ = window.hide(); }
                }
                _ => {}
            }
        })
        .setup(|app| {
            let h_handle = app.handle();
            let side = load_setting(&h_handle, "handle_side.txt", 0);
            let effect_val = load_setting(&h_handle, "backdrop_type.txt", 2);
            #[cfg(target_os = "windows")]
            {
                HANDLE_SIDE.store(side, Ordering::SeqCst);
                CURRENT_BACKDROP_TYPE.store(effect_val, Ordering::SeqCst);
            }
            let effect = match effect_val { 3 => BackdropType::Acrylic, 2 => BackdropType::Mica, _ => BackdropType::None };
            let main = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&main.as_ref().window(), effect);
            let test = tauri::WebviewWindowBuilder::new(app, "test_dna", tauri::WebviewUrl::App("index.html".into()))
                .title("Teste").inner_size(400.0, 300.0).decorations(false).transparent(true).shadow(false).build().unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&test.as_ref().window(), effect);
            let h_w = if side >= 2 { 20 } else { 150 };
            let h_h = if side >= 2 { 150 } else { 20 };
            let handle_win = tauri::WebviewWindowBuilder::new(app, "handle_win", tauri::WebviewUrl::App("index.html?type=handle".into()))
                .title("Handle").inner_size(h_w as f64, h_h as f64).decorations(false).transparent(true).shadow(false).always_on_top(true).resizable(false).build().unwrap();
            #[cfg(target_os = "windows")]
            {
                let (nx, ny) = calculate_handle_pos(&main.as_ref().window(), &handle_win.as_ref().window(), side);
                let _ = handle_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: nx, y: ny }));
                apply_visual_dna(&handle_win.as_ref().window(), effect);
            }
            let context_menu = tauri::WebviewWindowBuilder::new(app, "context_menu", tauri::WebviewUrl::App("index.html?type=menu".into()))
                .title("Menu").inner_size(180.0, 320.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false).resizable(false).build().unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&context_menu.as_ref().window(), effect);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![apply_window_effect, trigger_context_menu, start_drag_main, set_handle_side, get_active_menu_config, emit_global_event])
        .run(tauri::generate_context!())
        .expect("error");
}
