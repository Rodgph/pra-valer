use tauri::{Manager, Runtime, Window, Emitter, PhysicalPosition, PhysicalSize, WebviewWindowBuilder, WebviewUrl};
use window_vibrancy::{apply_mica, clear_vibrancy};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use serde::Deserialize;
use sysinfo::{System, Networks};
use windows::Win32::Graphics::Dxgi::*;
use dlopen2::wrapper::{Container, WrapperApi};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::str::FromStr;
use std::collections::{HashSet, HashMap};

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicI32, Ordering};
#[cfg(target_os = "windows")]
use windows::{
    core::w,
    Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM, HANDLE, POINT, COLORREF},
    Win32::Graphics::Dwm::*,
    Win32::UI::WindowsAndMessaging::*,
    Win32::Graphics::Gdi::InvalidateRect,
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
static DOMAIN_CSS_CACHE: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

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

#[derive(serde::Serialize, Default, Clone, Hash, Eq, PartialEq, Debug)]
struct SteamGame {
    appid: String,
    name: String,
}

#[derive(serde::Serialize, Default, Debug)]
struct SteamProfile {
    steamid: String,
    name: String,
    avatar_url: String,
}

#[derive(serde::Serialize, Default)]
struct DownloadInfo {
    appid: String,
    progress: f32,
    bytes_per_sec: u64,
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

// Função que força silêncio total via Win32
#[cfg(target_os = "windows")]
fn force_silent_background<R: Runtime>(window: &tauri::WebviewWindow<R>) {
    if let Ok(hwnd_ptr) = window.hwnd() {
        let hwnd = HWND(hwnd_ptr.0 as *mut _);
        unsafe {
            // 1. Força ocultação imediata no nível Win32
            let _ = ShowWindow(hwnd, SW_HIDE);

            // 2. Aplica estilos de "janela fantasma"
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            let _ = SetWindowLongW(
                hwnd,
                GWL_EXSTYLE,
                ex_style
                    | WS_EX_NOACTIVATE.0 as i32
                    | WS_EX_TOOLWINDOW.0 as i32
                    | WS_EX_LAYERED.0 as i32,
            );

            // 3. Opacidade ZERO via Win32
            let _ = SetLayeredWindowAttributes(hwnd, COLORREF(0), 0, LWA_ALPHA);
        }
    }
}

// Função para revelar a janela quando estiver realmente pronta
#[cfg(target_os = "windows")]
pub fn reveal_window<R: Runtime>(window: &tauri::WebviewWindow<R>) {
    if let Ok(hwnd_ptr) = window.hwnd() {
        let hwnd = HWND(hwnd_ptr.0 as *mut _);
        unsafe {
            // Restaura opacidade total antes de mostrar
            let _ = SetLayeredWindowAttributes(hwnd, COLORREF(0), 255, LWA_ALPHA);
            // Mostra sem roubar foco
            let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);
        }
    }
}

#[cfg(target_os = "windows")]
pub fn apply_visual_dna<R: Runtime>(window: &Window<R>, effect: BackdropType) {
    let hwnd_raw = window.hwnd().unwrap().0 as isize;
    let hwnd = HWND(hwnd_raw as *mut _);
    unsafe {
        // Atributos base imutáveis
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &1i32 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &DWMWCP_DONOTROUND.0 as *const _ as *const _, 4);
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &0xFFFFFFFEu32 as *const _ as *const _, 4);

        // Aplicação do material
        let backdrop_type = match effect {
            BackdropType::Mica => { let _ = apply_mica(window, None); 2i32 },
            BackdropType::Acrylic => { let _ = clear_vibrancy(window); 3i32 }, // 3 = Acrylic no Win11
            BackdropType::None => { let _ = clear_vibrancy(window); 1i32 },
        };
        
        let _ = DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &backdrop_type as *const _ as *const _, 4);
        
        // Força o Windows a processar a mudança visual
        let _ = InvalidateRect(Some(hwnd), None, true);
        
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
fn calculate_handle_pos_absolute<R: Runtime>(main_win: &Window<R>, handle_win: &Window<R>, side: i32) -> (i32, i32) {
    let m_pos = main_win.outer_position().unwrap_or(PhysicalPosition { x: 0, y: 0 });
    let m_size = main_win.outer_size().unwrap_or_default();
    let h_size = handle_win.outer_size().unwrap_or_default();
    
    let h_w = h_size.width as i32;
    let h_h = h_size.height as i32;
    let m_w = m_size.width as i32;
    let m_h = m_size.height as i32;

    match side {
        1 => (m_pos.x + (m_w / 2) - (h_w / 2), m_pos.y + m_h + 5), // Baixo
        2 => (m_pos.x - h_w - 5, m_pos.y + (m_h / 2) - (h_h / 2)), // Esquerda
        3 => (m_pos.x + m_w + 5, m_pos.y + (m_h / 2) - (h_h / 2)), // Direita
        _ => (m_pos.x + (m_w / 2) - (h_w / 2), m_pos.y - h_h - 5), // Topo (5px acima)
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
    let _ = unsafe {
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
    };
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
        *cache = Some(MenuConfig { menu_type: args.menu_type.clone(), target_id: Option::from(args.target_id.clone()) });
    }
    if let Some(menu) = app.get_webview_window("context_menu") {
        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            let _ = GetCursorPos(&mut point);
            
            // VIEWPORT PROTECTION: Ajusta se estiver muito perto das bordas (estimativa de 200x300)
            let monitor = menu.current_monitor().unwrap().unwrap();
            let screen = monitor.size();
            
            let mut final_x = point.x;
            let mut final_y = point.y;

            if final_x + 200 > screen.width as i32 { final_x -= 200; }
            if final_y + 300 > screen.height as i32 { final_y -= 300; }

            let _ = menu.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: final_x, y: final_y }));
            #[cfg(target_os = "windows")]
            reveal_window(&menu);
            let _ = app.emit("setup-menu", serde_json::json!({ "type": args.menu_type, "targetId": args.target_id }));
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
            if side >= 2 { let _ = handle.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 10, height: 150 })); }
            else { let _ = handle.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 150, height: 10 })); }
            let (nx, ny) = calculate_handle_pos_absolute(&main.as_ref().window(), &handle.as_ref().window(), side);
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
            #[cfg(target_os = "windows")]
            reveal_window(&search);
            let _ = search.show();
            let _ = search.set_focus();
        }
    }
}

#[cfg(target_os = "windows")]
fn get_steam_path() -> Option<PathBuf> {
    use winreg::enums::*;
    use winreg::RegKey;
    let hklm = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hklm.open_subkey("Software\\Valve\\Steam") {
        if let Ok(path) = key.get_value::<String, &str>("SteamPath") {
            let p = PathBuf::from(path);
            if p.exists() { return Some(p); }
        }
    }
    for drive in ["C", "D", "E", "F", "G"].iter() {
        let p = PathBuf::from(format!("{}:\\Program Files (x86)\\Steam", drive));
        if p.exists() { return Some(p); }
        let p2 = PathBuf::from(format!("{}:\\Steam", drive));
        if p2.exists() { return Some(p2); }
    }
    None
}

#[tauri::command]
fn get_steam_user_profile() -> SteamProfile {
    let mut profile = SteamProfile::default();
    if let Some(steam_root) = get_steam_path() {
        let login_vdf = steam_root.join("config").join("loginusers.vdf");
        if let Ok(content) = fs::read_to_string(&login_vdf) {
            let re_user = regex::Regex::new(r#"(?s)"(\d{17})".*?\{.*?"PersonaName"\s+"([^"]+)".*?"mostrecent"\s+"1".*?\}"#).unwrap();
            if let Some(cap) = re_user.captures(&content) {
                profile.steamid = cap[1].to_string();
                profile.name = cap[2].to_string();
                let url = format!("https://steamcommunity.com/profiles/{}/?xml=1", profile.steamid);
                if let Ok(resp) = reqwest::blocking::get(&url) {
                    if let Ok(xml) = resp.text() {
                        let re_avatar = regex::Regex::new(r#"<avatarFull><!\[CDATA\[(.*?)\]\]></avatarFull>"#).unwrap();
                        if let Some(c) = re_avatar.captures(&xml) {
                            profile.avatar_url = c[1].to_string();
                        }
                    }
                }
            }
        }
    }
    profile
}

#[tauri::command]
fn get_steam_library() -> Vec<SteamGame> {
    let mut name_map: HashMap<String, String> = HashMap::new();
    let mut owned_ids: HashSet<String> = HashSet::new();

    if let Some(steam_root) = get_steam_path() {
        let mut disks = vec![steam_root.clone()];
        let vdf = steam_root.join("steamapps").join("libraryfolders.vdf");
        if let Ok(c) = fs::read_to_string(vdf) {
            let re = regex::Regex::new(r#""path"\s+"([^"]+)""#).unwrap();
            for cap in re.captures_iter(&c) {
                let p = PathBuf::from(&cap[1]);
                if p.exists() { disks.push(p); }
            }
        }
        for d in disks {
            let apps = d.join("steamapps");
            if let Ok(entries) = fs::read_dir(apps) {
                for entry in entries.flatten() {
                    let fname = entry.file_name().to_string_lossy().to_string();
                    if fname.starts_with("appmanifest_") && fname.ends_with(".acf") {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            let id_re = regex::Regex::new(r#""appid"\s+"(\d+)""#).unwrap();
                            let name_re = regex::Regex::new(r#""name"\s+"([^"]+)""#).unwrap();
                            if let (Some(i), Some(n)) = (id_re.captures(&content), name_re.captures(&content)) {
                                name_map.insert(i[1].to_string(), n[1].to_string());
                            }
                        }
                    }
                }
            }
        }

        let userdata = steam_root.join("userdata");
        if let Ok(user_entries) = fs::read_dir(&userdata) {
            for user_entry in user_entries.flatten() {
                let local_p = user_entry.path().join("config").join("localconfig.vdf");
                if let Ok(c) = fs::read_to_string(local_p) {
                    let re = regex::Regex::new(r#""(\d+)"\s*\{\s*"name"\s*"([^"]+)"#).unwrap();
                    for cap in re.captures_iter(&c) {
                        name_map.entry(cap[1].to_string()).or_insert(cap[2].to_string());
                    }
                }

                let shared_p = user_entry.path().join("7").join("remote").join("sharedconfig.vdf");
                if let Ok(content) = fs::read_to_string(shared_p) {
                    for line in content.lines() {
                        let trimmed = line.trim();
                        if trimmed.starts_with('"') && trimmed.ends_with('"') {
                            let inner = &trimmed[1..trimmed.len()-1];
                            if inner.chars().all(|c| c.is_ascii_digit()) && inner.len() >= 4 {
                                owned_ids.insert(inner.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    let mut result = Vec::new();
    for id in owned_ids {
        let name = name_map.get(&id).cloned().unwrap_or_else(|| format!("App {}", id));
        result.push(SteamGame { appid: id, name });
    }
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    result
}

#[tauri::command]
fn get_steam_download_info() -> Vec<DownloadInfo> {
    Vec::new()
}

#[tauri::command]
fn get_steam_library_manual(steam_id: String) -> Vec<SteamGame> {
    let mut games = HashSet::new();
    let url = if steam_id.chars().all(|c| c.is_ascii_digit()) && steam_id.len() == 17 {
        format!("https://steamcommunity.com/profiles/{}/games?xml=1", steam_id)
    } else {
        format!("https://steamcommunity.com/id/{}/games?xml=1", steam_id)
    };

    if let Ok(response) = reqwest::blocking::get(&url) {
        if let Ok(xml) = response.text() {
            let re_game = regex::Regex::new(r#"(?s)<game>.*?<appID>(\d+)</appID>.*?<name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</name>"#).unwrap();
            for cap in re_game.captures_iter(&xml) {
                games.insert(SteamGame { appid: cap[1].to_string(), name: cap[2].to_string() });
            }
        }
    }

    let mut result: Vec<SteamGame> = games.into_iter().collect();
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    result
}

#[tauri::command]
async fn toggle_css_injector<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("css_injector_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.close();
    } else {
        let _ = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(format!("index.html?type=css_injector&target={}", pane_id).into()))
            .title("CSS_INJECTOR")
            .inner_size(400.0, 500.0)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .build()
            .unwrap();
    }
}

#[tauri::command]
async fn apply_browser_css<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String, css: String) {
    let label = format!("browser_{}", pane_id);
    
    // Atualiza o Cache Global do Backend
    if let Some(win) = app.get_webview_window(&label) {
        if let Ok(url) = win.url() {
            let domain = url.host_str().unwrap_or("GLOBAL").to_string();
            let mut cache = DOMAIN_CSS_CACHE.lock().unwrap();
            if cache.is_none() { *cache = Some(HashMap::new()); }
            
            if let Some(map) = cache.as_mut() {
                if css.trim().is_empty() {
                    map.remove(&domain);
                } else {
                    map.insert(domain, css.clone());
                }
            }
        }

        let js = if css.trim().is_empty() {
            r#"
            (function() {
                const style = document.getElementById('social-os-custom-css');
                if (style) style.remove();
                if (window.__social_os_css_observer) window.__social_os_css_observer.disconnect();
                window.__social_os_css_observer = null;
                document.documentElement.style.backgroundColor = '';
                document.body.style.backgroundColor = '';
            })();
            "#.to_string()
        } else {
            let escaped_css = css.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${");
            format!(
                r#"
                (function() {{
                    const css = `{}`;
                    let style = document.getElementById('social-os-custom-css');
                    if (!style) {{
                        style = document.createElement('style');
                        style.id = 'social-os-custom-css';
                        document.head.appendChild(style);
                    }}
                    style.innerHTML = css;
                    
                    if (!window.__social_os_css_observer) {{
                        window.__social_os_css_observer = new MutationObserver(() => {{
                            if (!document.getElementById('social-os-custom-css')) {{
                                document.head.appendChild(style);
                            }}
                        }});
                        window.__social_os_css_observer.observe(document.head, {{ childList: true }});
                    }}

                    if (css.includes('transparent')) {{
                        document.documentElement.style.setProperty('background-color', 'transparent', 'important');
                        document.body.style.setProperty('background-color', 'transparent', 'important');
                    }}
                }})();
                "#,
                escaped_css
            )
        };
        let _ = win.eval(&js);
    }
}

#[tauri::command]
async fn browser_go_back<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.eval("window.history.back()");
    }
}

#[tauri::command]
async fn browser_go_forward<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.eval("window.history.forward()");
    }
}

#[tauri::command]
async fn browser_reload<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.eval("window.location.reload()");
    }
}

#[tauri::command]
async fn mount_browser_child<R: Runtime>(
    app: tauri::AppHandle<R>, 
    pane_id: String,
    url: String, 
    x: i32, y: i32, 
    width: u32, height: u32
) {
    let label = format!("browser_{}", pane_id);
    
    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.navigate(url.parse().unwrap());
        let _ = existing.set_size(PhysicalSize { width, height });
        let _ = existing.set_position(PhysicalPosition { x, y });
        let _ = existing.show();
        return;
    }

    let main_win = app.get_webview_window("main").unwrap();
    let main_hwnd = main_win.hwnd().unwrap().0 as isize;
    
    // CONTROLE AUTOMÁTICO DO LOADER VIA BUILDER
    let app_handle = app.clone();
    let app_handle_load = app.clone();
    let pane_id_nav = pane_id.clone();
    let pane_id_load = pane_id.clone();

    // Busca CSS no cache para este domínio
    let mut initial_css_script = "".to_string();
    if let Ok(parsed_url) = tauri::Url::parse(&url) {
        if let Some(domain) = parsed_url.host_str() {
            let cache = DOMAIN_CSS_CACHE.lock().unwrap();
            if let Some(map) = cache.as_ref() {
                if let Some(css) = map.get(domain) {
                    let escaped_css = css.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${");
                    initial_css_script = format!(
                        r#"
                        (function() {{
                            const inject = () => {{
                                let style = document.getElementById('social-os-custom-css');
                                if (!style) {{
                                    style = document.createElement('style');
                                    style.id = 'social-os-custom-css';
                                    document.head.appendChild(style);
                                }}
                                style.innerHTML = `{}`;
                                if (`{}`.includes('transparent')) {{
                                    document.documentElement.style.setProperty('background-color', 'transparent', 'important');
                                    document.body.style.setProperty('background-color', 'transparent', 'important');
                                }};
                            }};
                            inject();
                            window.addEventListener('DOMContentLoaded', inject);
                        }})();
                        "#,
                        escaped_css, escaped_css
                    );
                }
            }
        }
    }

    let browser_win = WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(url.parse().unwrap()))
        .position(x as f64, y as f64)
        .inner_size(width as f64, height as f64)
        .decorations(false)
        .shadow(false)
        .transparent(true) 
        .skip_taskbar(true)
        .resizable(false)
        .background_color((0, 0, 0, 0).into())
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .initialization_script(&format!(r#"
            window.chrome = window.chrome || {{}};
            window.chrome.runtime = window.chrome.runtime || {{ 
                sendMessage: function() {{}}, 
                connect: function() {{}},
                onMessage: {{ addListener: function() {{}} }}
            }};
            {}
        "#, initial_css_script))

        .on_navigation(move |url| {
            let _ = app_handle.emit(&format!("browser-url-changed-{}", pane_id_nav), serde_json::json!({ "url": url.to_string() }));
            if let Some(loader) = app_handle.get_webview_window("browser_loader") {
                #[cfg(target_os = "windows")]
                reveal_window(&loader);
                let _ = loader.show();
                let _ = loader.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 31, height: 31 }));
                let _ = loader.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 30, height: 30 }));
            }
            true
        })
        .on_page_load(move |window, _| {
            if let Ok(url) = window.url() {
                let _ = app_handle_load.emit(&format!("browser-url-changed-{}", pane_id_load), serde_json::json!({ "url": url.as_str() }));
            }
            if let Some(loader) = app_handle_load.get_webview_window("browser_loader") {
                let _ = loader.hide();
            }
        })
        .build()
        .unwrap();

        
    let _ = browser_win.eval("document.documentElement.style.backgroundColor = 'transparent'; document.body.style.backgroundColor = 'transparent';");
    
    let browser_hwnd = browser_win.hwnd().unwrap().0 as isize;
    unsafe {
        let _ = SetParent(HWND(browser_hwnd as *mut _), Some(HWND(main_hwnd as *mut _)));
        
        // PROTOCOLO DE BLINDAGEM (REPLICADO DA ALÇA)
        let current_style = GetWindowLongW(HWND(browser_hwnd as *mut _), GWL_STYLE);
        let clean_style = (current_style as u32) & !(WS_CAPTION.0 | WS_THICKFRAME.0 | WS_BORDER.0 | WS_DLGFRAME.0 | WS_SYSMENU.0 | WS_POPUP.0);
        let _ = SetWindowLongW(HWND(browser_hwnd as *mut _), GWL_STYLE, (clean_style | WS_CHILD.0 | WS_VISIBLE.0) as i32);
        
        let current_ex_style = GetWindowLongW(HWND(browser_hwnd as *mut _), GWL_EXSTYLE);
        let clean_ex_style = (current_ex_style as u32) & !(WS_EX_DLGMODALFRAME.0 | WS_EX_CLIENTEDGE.0 | WS_EX_STATICEDGE.0 | WS_EX_WINDOWEDGE.0);
        let _ = SetWindowLongW(HWND(browser_hwnd as *mut _), GWL_EXSTYLE, clean_ex_style as i32);

        let _ = SetWindowPos(HWND(browser_hwnd as *mut _), Some(HWND_TOP), x, y, width as i32, height as i32, SWP_SHOWWINDOW | SWP_FRAMECHANGED);
        
        // Força Repaint para transparência
        let _ = InvalidateRect(Some(HWND(browser_hwnd as *mut _)), None, true);
    }
}

#[tauri::command]
async fn update_browser_bounds<R: Runtime>(
    app: tauri::AppHandle<R>, 
    pane_id: String,
    x: i32, y: i32, 
    width: u32, height: u32
) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let hwnd = win.hwnd().unwrap().0 as isize;
        unsafe {
            let _ = MoveWindow(HWND(hwnd as *mut _), x, y, width as i32, height as i32, true);
        }
    }
}

#[tauri::command]
async fn hide_browser_child<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.hide();
    }
}

#[tauri::command]
async fn destroy_browser_child<R: Runtime>(app: tauri::AppHandle<R>, pane_id: String) {
    let label = format!("browser_{}", pane_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.close();
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
                                #[cfg(target_os = "windows")]
                                reveal_window(&search);
                                let _ = search.show();
                                let _ = search.set_focus();
                            }
                            ShortcutState::Released => {}
                        }
                    }
                }
            })
            .build())
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                    #[cfg(target_os = "windows")]
                    if window.label() == "main" {
                        if let (Some(h), Some(l)) = (
                            window.app_handle().get_webview_window("handle_win"),
                            window.app_handle().get_webview_window("browser_loader")
                        ) {
                            let side = HANDLE_SIDE.load(Ordering::Relaxed);
                            let (nx, ny) = calculate_handle_pos_absolute(window, &h.as_ref().window(), side);
                            let _ = h.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: nx, y: ny }));
                            
                            // Loader continua filho (relativo)
                            let l_hwnd = l.hwnd().unwrap().0 as isize;
                            unsafe {
                                let _ = SetWindowPos(HWND(l_hwnd as *mut _), Some(HWND_TOP), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);
                            }
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
            let main_hwnd = main.hwnd().unwrap().0 as isize;
            #[cfg(target_os = "windows")]
            apply_visual_dna(&main.as_ref().window(), effect);
            let _ = main.set_shadow(false);
            
            let search_global = WebviewWindowBuilder::new(app, "search_global", WebviewUrl::App("index.html?type=search".into()))
                .title("Spotlight").inner_size(1.0, 1.0).position(-10000.0, -10000.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false).resizable(false).skip_taskbar(true).build().unwrap();
            #[cfg(target_os = "windows")]
            force_silent_background(&search_global);

            let handle_win = WebviewWindowBuilder::new(app, "handle_win", WebviewUrl::App("index.html?type=handle".into()))
                .title("").inner_size(1.0, 1.0).position(-10000.0, -10000.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false).resizable(false).skip_taskbar(true).build().unwrap();
            #[cfg(target_os = "windows")]
            force_silent_background(&handle_win);
            
            #[cfg(target_os = "windows")]
            {
                let (nx, ny) = calculate_handle_pos_absolute(&main.as_ref().window(), &handle_win.as_ref().window(), side);
                apply_visual_dna(&handle_win.as_ref().window(), effect);
                let _ = handle_win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 150, height: 10 }));
                let _ = handle_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: nx, y: ny }));
                reveal_window(&handle_win);
            }

            let context_menu = WebviewWindowBuilder::new(app, "context_menu", WebviewUrl::App("index.html?type=menu".into()))
                .title("Menu").inner_size(1.0, 1.0).position(-10000.0, -10000.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false).resizable(false).skip_taskbar(true).build().unwrap();
            #[cfg(target_os = "windows")]
            force_silent_background(&context_menu);
            
            let loader_win = WebviewWindowBuilder::new(app, "browser_loader", WebviewUrl::App("index.html?type=browser_loader".into()))
                .title("").inner_size(30.0, 30.0).decorations(false).transparent(true).shadow(false).always_on_top(true).visible(false).skip_taskbar(true)
                .background_color((0, 0, 0, 0).into())
                .build().unwrap();
            #[cfg(target_os = "windows")]
            force_silent_background(&loader_win);
            
            let loader_hwnd = loader_win.hwnd().unwrap().0 as isize;
            unsafe {
                let _ = SetParent(HWND(loader_hwnd as *mut _), Some(HWND(main_hwnd as *mut _)));
                
                // REMOÇÃO AGRESSIVA DE BORDAS, TÍTULO E ÍCONE (WIN32)
                let current_style = GetWindowLongW(HWND(loader_hwnd as *mut _), GWL_STYLE);
                let clean_style = (current_style as u32) & !(WS_CAPTION.0 | WS_THICKFRAME.0 | WS_BORDER.0 | WS_DLGFRAME.0 | WS_SYSMENU.0 | WS_MINIMIZEBOX.0 | WS_MAXIMIZEBOX.0 | WS_VISIBLE.0);
                let _ = SetWindowLongW(HWND(loader_hwnd as *mut _), GWL_STYLE, (clean_style | WS_CHILD.0) as i32);
                
                let current_ex_style = GetWindowLongW(HWND(loader_hwnd as *mut _), GWL_EXSTYLE);
                let clean_ex_style = (current_ex_style as u32) & !(WS_EX_DLGMODALFRAME.0 | WS_EX_CLIENTEDGE.0 | WS_EX_STATICEDGE.0 | WS_EX_WINDOWEDGE.0 | WS_EX_APPWINDOW.0);
                let _ = SetWindowLongW(HWND(loader_hwnd as *mut _), GWL_EXSTYLE, (clean_ex_style | WS_EX_LAYERED.0 | WS_EX_TOOLWINDOW.0) as i32);

                let _ = SetWindowPos(HWND(loader_hwnd as *mut _), Some(HWND_TOP), 0, 0, 30, 30, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);

                // FIX: Força repaint imediato para aplicar transparência
                let _ = InvalidateRect(
                    Some(HWND(loader_hwnd as *mut _)), 
                    None, 
                    true
                );
            }

            #[cfg(target_os = "windows")]
            apply_visual_dna(&loader_win.as_ref().window(), BackdropType::None);

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
            toggle_search_window,
            get_steam_library,
            get_steam_download_info,
            get_steam_user_profile,
            get_steam_library_manual,
            mount_browser_child,
            update_browser_bounds,
            destroy_browser_child,
            hide_browser_child,
            toggle_css_injector,
            apply_browser_css,
            browser_go_back,
            browser_go_forward,
            browser_reload
        ])
        .run(tauri::generate_context!())
        .expect("error");
}
