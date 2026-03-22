O problema real é que o Tauri/WebView2 no Windows tem um bug conhecido: ele pode exibir o frame da janela por alguns milissegundos antes de aplicar o visible(false), porque o processo de criação do WebView2 passa pelo Win32 internamente.
A solução definitiva é forçar a ocultação via Win32 nativo logo após a criação, combinando SW_HIDE + opacidade 0 + WS_EX_NOACTIVATE:
rust// src-tauri/src/lib.rs

// Adicionar no topo com os outros imports
#[cfg(target_os = "windows")]
use windows::Win32::{
    Foundation::HWND,
    UI::WindowsAndMessaging::{
        ShowWindow, SetWindowLongW, GetWindowLongW,
        SW_HIDE, GWL_EXSTYLE,
        WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW, WS_EX_LAYERED,
        SetLayeredWindowAttributes, LWA_ALPHA,
    },
};

// Função que força silêncio total via Win32
#[cfg(target_os = "windows")]
fn force_silent_background(window: &tauri::WebviewWindow) {
    use tauri::Manager;
    let hwnd = HWND(window.hwnd().unwrap().0);
    unsafe {
        // 1. Força ocultação imediata no nível Win32 (ignora o Tauri)
        let _ = ShowWindow(hwnd, SW_HIDE);

        // 2. Aplica estilos de "janela fantasma": sem ativação, sem taskbar, layered
        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        SetWindowLongW(
            hwnd,
            GWL_EXSTYLE,
            ex_style
                | WS_EX_NOACTIVATE.0 as i32
                | WS_EX_TOOLWINDOW.0 as i32
                | WS_EX_LAYERED.0 as i32,
        );

        // 3. Opacidade ZERO via Win32 (dupla garantia)
        let _ = SetLayeredWindowAttributes(hwnd, None, 0, LWA_ALPHA);
    }
}

// Função para revelar a janela quando estiver realmente pronta
#[cfg(target_os = "windows")]
pub fn reveal_window(window: &tauri::WebviewWindow) {
    use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE, SetLayeredWindowAttributes, LWA_ALPHA};
    let hwnd = HWND(window.hwnd().unwrap().0);
    unsafe {
        // Restaura opacidade total antes de mostrar
        let _ = SetLayeredWindowAttributes(hwnd, None, 255, LWA_ALPHA);
        // Mostra sem roubar foco
        let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);
    }
}
Depois, logo após criar cada janela secundária, chame imediatamente:
rust// Após criar search_global:
let search = WebviewWindowBuilder::new(...).build().unwrap();
#[cfg(target_os = "windows")]
force_silent_background(&search);

// Após criar handle_win:
let handle_win = WebviewWindowBuilder::new(...).build().unwrap();
#[cfg(target_os = "windows")]
force_silent_background(&handle_win);

// Após criar context_menu:
let context_menu = WebviewWindowBuilder::new(...).build().unwrap();
#[cfg(target_os = "windows")]
force_silent_background(&context_menu);

// Após criar browser_loader:
let loader_win = WebviewWindowBuilder::new(...).build().unwrap();
#[cfg(target_os = "windows")]
force_silent_background(&loader_win);
E quando for revelar o handle_win (que aparece junto com a main), substitua o .show() por:
rust// No evento "app-ready" ou onde você exibe a alça:
#[cfg(target_os = "windows")]
reveal_window(&handle_win);

Por que isso funciona onde o .visible(false) falha:
AbordagemNívelProblema.visible(false) TauriTauri APIWebView2 já criou o HWND antesposition(-10000,-10000)Tauri APIJanela ainda é registrada no WindowsShowWindow(SW_HIDE) + WS_EX_LAYERED alpha=0Win32 nativoIntercepta antes do compositor do Windows renderizar
O WS_EX_LAYERED com alpha=0 é a chave: mesmo que o Windows tente compor a janela, ela é tratada como totalmente transparente no nível do DWM (Desktop Window Manager), sem nenhum pixel visível ao usuário.