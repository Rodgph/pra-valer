use tauri::{Manager, Runtime, Window, WebviewWindow, Listener};
use window_vibrancy::{apply_mica, clear_vibrancy};

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

#[tauri::command]
fn apply_window_effect<R: Runtime>(app: tauri::AppHandle<R>, effect: BackdropType) {
    let effect_val = match effect { BackdropType::Acrylic => 3, BackdropType::Mica => 2, BackdropType::None => 1 };
    CURRENT_BACKDROP_TYPE.store(effect_val, Ordering::SeqCst);
    for window in app.webview_windows().values() {
        #[cfg(target_os = "windows")]
        apply_visual_dna(&window.as_ref().window(), effect);
    }
}

#[tauri::command]
fn trigger_context_menu<R: Runtime>(app: tauri::AppHandle<R>) {
    if let Some(menu) = app.get_webview_window("context_menu") {
        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            let _ = GetCursorPos(&mut point);
            let _ = menu.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: point.x, y: point.y }));
            let _ = menu.set_resizable(false); // Garantir resize false ao mostrar
            let _ = menu.show();
            let _ = menu.set_focus();
        }
    }
}

#[tauri::command]
fn start_drag_main<R: Runtime>(app: tauri::AppHandle<R>) {
    if let Some(main) = app.get_webview_window("main") { let _ = main.start_dragging(); }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::Focused(true) => {
                    #[cfg(target_os = "windows")]
                    {
                        let effect_val = CURRENT_BACKDROP_TYPE.load(Ordering::Relaxed);
                        let effect = match effect_val { 3 => BackdropType::Acrylic, 2 => BackdropType::Mica, _ => BackdropType::None };
                        apply_visual_dna(window, effect);
                    }
                }
                tauri::WindowEvent::Moved(pos) => {
                    #[cfg(target_os = "windows")]
                    if window.label() == "main" {
                        if let Some(h) = window.app_handle().get_webview_window("handle_win") {
                            let main_size = window.outer_size().unwrap();
                            let h_size = h.outer_size().unwrap();
                            let cx = pos.x + (main_size.width as i32 / 2) - (h_size.width as i32 / 2);
                            let ty = pos.y - h_size.height as i32 - 5;
                            let _ = h.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: cx, y: ty }));
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
            let handle = app.handle().clone();
            app.listen("drag-main-window", move |_| {
                if let Some(main_win) = handle.get_webview_window("main") { let _ = main_win.start_dragging(); }
            });

            // 1. PRINCIPAL
            let main = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&main.as_ref().window(), BackdropType::Mica);

            // 2. TESTE
            let test = tauri::WebviewWindowBuilder::new(app, "test_dna", tauri::WebviewUrl::App("index.html".into()))
                .title("Teste").inner_size(400.0, 300.0).decorations(false).transparent(true).shadow(false).build().unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&test.as_ref().window(), BackdropType::Mica);

            // 3. ALÇA
            let m_pos = main.outer_position().unwrap();
            let m_size = main.outer_size().unwrap();
            let h_size = tauri::PhysicalSize { width: 100, height: 24 };
            let cx = m_pos.x + (m_size.width as i32 / 2) - (h_size.width as i32 / 2);
            let ty = m_pos.y - h_size.height as i32 - 5;

            let handle_win = tauri::WebviewWindowBuilder::new(app, "handle_win", tauri::WebviewUrl::App("index.html?type=handle".into()))
                .title("Handle").inner_size(h_size.width as f64, h_size.height as f64)
                .position(cx as f64, ty as f64).decorations(false).transparent(true).shadow(false).always_on_top(true).resizable(false).build().unwrap();
            let _ = handle_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: cx, y: ty }));
            #[cfg(target_os = "windows")]
            apply_visual_dna(&handle_win.as_ref().window(), BackdropType::Mica);

            // 4. MENU (RESIZE FALSE)
            let context_menu = tauri::WebviewWindowBuilder::new(app, "context_menu", tauri::WebviewUrl::App("index.html?type=menu".into()))
                .title("Menu").inner_size(180.0, 240.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false)
                .resizable(false) // Desativar resize aqui
                .build().unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&context_menu.as_ref().window(), BackdropType::Mica);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![apply_window_effect, trigger_context_menu, start_drag_main])
        .run(tauri::generate_context!())
        .expect("error");
}
