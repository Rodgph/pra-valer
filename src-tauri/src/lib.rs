use tauri::{Manager, Runtime, Window};
use window_vibrancy::{apply_mica, clear_vibrancy};

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicI32, Ordering};
#[cfg(target_os = "windows")]
use windows::{
    core::w,
    Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM, HANDLE},
    Win32::Graphics::Dwm::*,
    Win32::UI::WindowsAndMessaging::*,
};

#[derive(serde::Deserialize, Clone, Copy, Debug)]
pub enum BackdropType {
    Mica,
    Acrylic,
    None,
}

#[cfg(target_os = "windows")]
static CURRENT_BACKDROP_TYPE: AtomicI32 = AtomicI32::new(2); // Default to Mica

#[cfg(target_os = "windows")]
pub fn apply_visual_dna<R: Runtime>(window: &Window<R>, effect: BackdropType) {
    let hwnd = window.hwnd().unwrap().0 as isize;
    let hwnd = HWND(hwnd as *mut _);

    unsafe {
        // 1. Dark Mode Imersivo
        let dark_mode = 1i32;
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark_mode as *const _ as *const _, 4);

        // 2. Remoção Total de Borda/Halo
        let border_color = 0xFFFFFFFEu32; 
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &border_color as *const _ as *const _, 4);

        // 3. Forçar Política de Non-Client Rendering
        let policy = DWMNCRP_ENABLED.0;
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_NCRENDERING_POLICY, &policy as *const _ as *const _, 4);

        // 4. Proibir Arredondamento (Brutalismo)
        let corner_preference = DWMWCP_DONOTROUND.0;
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &corner_preference as *const _ as *const _, 4);

        // 5. Aplicar Backdrop (Mica/Acrylic) via DWM Atributo 38 (Soberano no Win11)
        let backdrop_type = match effect {
            BackdropType::Mica => {
                let _ = apply_mica(window, None);
                2i32
            },
            BackdropType::Acrylic => {
                let _ = clear_vibrancy(window);
                3i32
            },
            BackdropType::None => {
                let _ = clear_vibrancy(window);
                1i32
            },
        };
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &backdrop_type as *const _ as *const _, 4);
        
        setup_backdrop_persistence(hwnd, effect);
    }
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn window_proc(hwnd: HWND, msg: u32, w_param: WPARAM, l_param: LPARAM) -> LRESULT {
    let prop = GetPropW(hwnd, w!("original_wndproc"));
    if prop.is_invalid() {
        return DefWindowProcW(hwnd, msg, w_param, l_param);
    }
    
    let original_proc: WNDPROC = std::mem::transmute(prop.0);

    match msg {
        WM_NCACTIVATE => {
            (original_proc.unwrap())(hwnd, msg, WPARAM(1), l_param)
        }
        WM_ACTIVATE => {
            let res = (original_proc.unwrap())(hwnd, msg, w_param, l_param);
            let effect_val = CURRENT_BACKDROP_TYPE.load(Ordering::Relaxed);
            let effect = match effect_val {
                3 => BackdropType::Acrylic,
                2 => BackdropType::Mica,
                _ => BackdropType::None,
            };
            reapply_raw_attributes(hwnd, effect);
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
fn reapply_raw_attributes(hwnd: HWND, effect: BackdropType) {
    unsafe {
        let dark_mode = 1i32;
        let border_color = 0xFFFFFFFEu32;
        let corner_preference = DWMWCP_DONOTROUND.0;
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark_mode as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &border_color as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &corner_preference as *const _ as *const _, 4);
        
        let backdrop_type = match effect {
            BackdropType::Mica => 2i32,
            BackdropType::Acrylic => 3i32,
            BackdropType::None => 1i32,
        };
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &backdrop_type as *const _ as *const _, 4);
    }
}

#[cfg(target_os = "windows")]
fn setup_backdrop_persistence(hwnd: HWND, effect: BackdropType) {
    let effect_val = match effect {
        BackdropType::Acrylic => 3,
        BackdropType::Mica => 2,
        BackdropType::None => 1,
    };
    CURRENT_BACKDROP_TYPE.store(effect_val, Ordering::SeqCst);

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
    #[cfg(target_os = "windows")]
    {
        let effect_val = match effect {
            BackdropType::Acrylic => 3,
            BackdropType::Mica => 2,
            BackdropType::None => 1,
        };
        CURRENT_BACKDROP_TYPE.store(effect_val, Ordering::SeqCst);

        for window in app.webview_windows().values() {
            apply_visual_dna(&window.as_ref().window(), effect);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::Focused(true) | tauri::WindowEvent::Moved { .. } => {
                    #[cfg(target_os = "windows")]
                    {
                        let effect_val = CURRENT_BACKDROP_TYPE.load(Ordering::Relaxed);
                        let effect = match effect_val {
                            3 => BackdropType::Acrylic,
                            2 => BackdropType::Mica,
                            _ => BackdropType::None,
                        };
                        apply_visual_dna(window, effect);
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            use tauri::Manager;
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                apply_visual_dna(&window.as_ref().window(), BackdropType::Mica);
            }

            let test_window = tauri::WebviewWindowBuilder::new(
                app,
                "test_dna",
                tauri::WebviewUrl::App("index.html".into())
            )
            .title("DNA Test Window")
            .inner_size(400.0, 300.0)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .build()
            .unwrap();

            #[cfg(target_os = "windows")]
            apply_visual_dna(&test_window.as_ref().window(), BackdropType::Mica);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![apply_window_effect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
