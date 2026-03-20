use tauri::{Manager, Runtime, Window, Emitter};
use window_vibrancy::{apply_mica, clear_vibrancy};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use serde::Deserialize;
use sysinfo::{System, Networks};
use windows::core::{Interface, w};
use windows::Win32::Graphics::Dxgi::*;
use windows::Win32::System::Performance::*;
use dlopen2::wrapper::{Container, WrapperApi};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::str::FromStr;

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicI32, Ordering};
#[cfg(target_os = "windows")]
use windows::{
    Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM, HANDLE, POINT},
    Win32::Graphics::Dwm::*,
    Win32::UI::WindowsAndMessaging::*,
};

#[derive(WrapperApi)]
struct NvmlApi {
    #[dlopen2_name = "nvmlInit_v2"]
    init: unsafe extern "C" fn() -> i32,
    #[dlopen2_name = "nvmlDeviceGetHandleByIndex_v2"]
    get_handle: unsafe extern "C" fn(index: u32, handle: *mut usize) -> i32,
    #[dlopen2_name = "nvmlDeviceGetUtilizationRates"]
    get_utilization: unsafe extern "C" fn(handle: usize, utilization: *mut NvmlUtilization) -> i32,
    #[dlopen2_name = "nvmlDeviceGetMemoryInfo"]
    get_memory: unsafe extern "C" fn(handle: usize, memory: *mut NvmlMemory) -> i32,
    #[dlopen2_name = "nvmlShutdown"]
    shutdown: unsafe extern "C" fn() -> i32,
}

#[repr(C)]
struct NvmlUtilization { gpu: u32, memory: u32 }
#[repr(C)]
struct NvmlMemory { total: u64, free: u64, used: u64 }

static NVML_CONTAINER: Mutex<Option<Container<NvmlApi>>> = Mutex::new(None);

#[derive(serde::Deserialize, Clone, Copy, Debug)]
pub enum BackdropType { Mica, Acrylic, None }

#[cfg(target_os = "windows")]
static CURRENT_BACKDROP_TYPE: AtomicI32 = AtomicI32::new(2);
#[cfg(target_os = "windows")]
static HANDLE_SIDE: AtomicI32 = AtomicI32::new(0); 

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ContextMenuArgs { menu_type: String, target_id: Option<String> }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GlobalEventArgs { event: String, payload: Option<serde_json::Value> }

struct MenuConfig { menu_type: String, target_id: Option<String> }
static ACTIVE_MENU_CONFIG: Mutex<Option<MenuConfig>> = Mutex::new(None);
static SYSTEM_STATS: Mutex<Option<System>> = Mutex::new(None);
static NETWORK_STATS: Mutex<Option<Networks>> = Mutex::new(None);

struct SendRaw<T>(T);
unsafe impl<T> Send for SendRaw<T> {}
unsafe impl<T> Sync for SendRaw<T> {}

static PDH_GPU_QUERY: Mutex<Option<SendRaw<PDH_HQUERY>>> = Mutex::new(None);
static PDH_GPU_USAGE_COUNTER: Mutex<Option<SendRaw<PDH_HCOUNTER>>> = Mutex::new(None);

const ERROR_SUCCESS: u32 = 0;

#[derive(serde::Serialize, Default, Clone)]
struct GpuStats {
    name: String,
    usage: f32,
    vram_used: f32,
    vram_total: f32,
}

#[derive(serde::Serialize)]
struct SystemStats {
    cpu_usage: f32,
    ram_usage: f32,
    net_usage: f32,
    gpu: GpuStats,
}

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
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, &0xFFFFFFFEu32 as *const _ as *const _, 4);
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

#[cfg(target_os = "windows")]
fn get_nvidia_telemetry() -> Option<GpuStats> {
    unsafe {
        let mut lock = NVML_CONTAINER.lock().unwrap();
        if lock.is_none() {
            if let Ok(container) = Container::<NvmlApi>::load("nvml.dll") {
                if (container.init)() == 0 { *lock = Some(container); }
            }
        }
        
        if let Some(api) = lock.as_ref() {
            let mut handle: usize = 0;
            if (api.get_handle)(0, &mut handle) == 0 {
                let mut util = NvmlUtilization { gpu: 0, memory: 0 };
                let mut mem = NvmlMemory { total: 0, free: 0, used: 0 };
                
                let res_u = (api.get_utilization)(handle, &mut util);
                let res_m = (api.get_memory)(handle, &mut mem);
                
                if res_u == 0 && res_m == 0 {
                    return Some(GpuStats {
                        name: "NVIDIA GPU".to_string(),
                        usage: util.gpu as f32,
                        vram_used: mem.used as f32 / (1024.0 * 1024.0 * 1024.0),
                        vram_total: mem.total as f32 / (1024.0 * 1024.0 * 1024.0),
                    });
                }
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn get_fallback_gpu_stats() -> GpuStats {
    let mut stats = GpuStats::default();
    unsafe {
        if let Ok(factory) = CreateDXGIFactory1::<IDXGIFactory1>() {
            let mut i = 0;
            while let Ok(adapter) = factory.EnumAdapters1(i) {
                i += 1;
                let desc = adapter.GetDesc1().unwrap_or_default();
                if (desc.Flags & DXGI_ADAPTER_FLAG_SOFTWARE.0 as u32) != 0 { continue; }
                let total = desc.DedicatedVideoMemory as f32 / (1024.0 * 1024.0 * 1024.0);
                if total > stats.vram_total {
                    stats.name = String::from_utf16_lossy(&desc.Description).trim_matches(char::from(0)).to_string();
                    stats.vram_total = total;
                }
            }
        }
    }
    stats
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
fn trigger_context_menu<R: Runtime>(app: tauri::AppHandle<R>, args: ContextMenuArgs) {
    {
        let mut cache = ACTIVE_MENU_CONFIG.lock().unwrap();
        *cache = Some(MenuConfig { menu_type: args.menu_type.clone(), target_id: args.target_id.clone() });
    }
    if let Some(menu) = app.get_webview_window("context_menu") {
        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            let _ = GetCursorPos(&mut point);
            let _ = menu.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: point.x, y: point.y }));
            let _ = app.emit("setup-menu", serde_json::json!({ "type": args.menu_type, "targetId": args.target_id }));
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

#[tauri::command]
fn emit_global_event<R: Runtime>(app: tauri::AppHandle<R>, args: GlobalEventArgs) {
    let _ = app.emit(&args.event, args.payload.unwrap_or(serde_json::json!({})));
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

#[tauri::command]
fn get_system_stats() -> SystemStats {
    let mut lock = SYSTEM_STATS.lock().unwrap();
    if lock.is_none() { *lock = Some(System::new_all()); }
    
    let mut net_lock = NETWORK_STATS.lock().unwrap();
    if net_lock.is_none() { *net_lock = Some(Networks::new_with_refreshed_list()); }

    let mut net_usage = 0.0;
    if let Some(nets) = net_lock.as_mut() {
        nets.refresh(true);
        for (_, data) in nets.iter() {
            net_usage += (data.received() as f32 + data.transmitted() as f32) / 1024.0;
        }
    }
    
    let gpu_stats = get_nvidia_telemetry().unwrap_or_else(|| get_fallback_gpu_stats());

    if let Some(sys) = lock.as_mut() {
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        
        SystemStats {
            cpu_usage: sys.global_cpu_usage(),
            ram_usage: (sys.used_memory() as f32 / sys.total_memory() as f32) * 100.0,
            net_usage,
            gpu: gpu_stats,
        }
    } else {
        SystemStats { cpu_usage: 0.0, ram_usage: 0.0, net_usage: 0.0, gpu: GpuStats::default() }
    }
}

#[tauri::command]
fn toggle_search_window<R: Runtime>(app: tauri::AppHandle<R>) {
    if let Some(search) = app.get_webview_window("search_global") {
        if search.is_visible().unwrap_or(false) {
            let _ = search.hide();
        } else {
            let _ = search.center();
            let _ = search.show();
            let _ = search.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let spotlight_shortcut = "CommandOrControl+Shift+Space";

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if shortcut.id() == Shortcut::from_str(spotlight_shortcut).unwrap().id() {
                    if let Some(search) = app.get_webview_window("search_global") {
                        match event.state() {
                            ShortcutState::Pressed => {
                                let _ = search.center();
                                let _ = search.show();
                                let _ = search.set_focus();
                            }
                            ShortcutState::Released => {
                                // Opcional: fechar ao soltar ou manter aberto
                            }
                        }
                    }
                }
            })
            .build())
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
                    if window.label() == "context_menu" || window.label() == "search_global" { 
                        let _ = window.hide(); 
                    }
                }
                _ => {}
            }
        })
        .setup(move |app| {
            // Tenta registrar o atalho global de forma segura
            let _ = app.global_shortcut().register(Shortcut::from_str(spotlight_shortcut).unwrap());

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
            
            // Warm-up
            let mut sys = System::new_all();
            sys.refresh_cpu_usage();
            *SYSTEM_STATS.lock().unwrap() = Some(sys);

            // Janela de Busca Global (Spotlight)
            let search_global = tauri::WebviewWindowBuilder::new(app, "search_global", tauri::WebviewUrl::App("index.html?type=search".into()))
                .title("Spotlight")
                .inner_size(600.0, 80.0)
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .always_on_top(true)
                .visible(false)
                .resizable(false)
                .build()
                .unwrap();
            #[cfg(target_os = "windows")]
            apply_visual_dna(&search_global.as_ref().window(), effect);

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
        .invoke_handler(tauri::generate_handler![
            apply_window_effect, 
            trigger_context_menu, 
            start_drag_main, 
            set_handle_side, 
            get_active_menu_config, 
            emit_global_event,
            get_system_stats,
            toggle_search_window
        ])
        .run(tauri::generate_context!())
        .expect("error");
}
