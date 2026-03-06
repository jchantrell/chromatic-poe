use tauri::webview::WebviewWindowBuilder;
use tauri::Manager;

mod filter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = rustls::crypto::ring::default_provider().install_default();

    tauri::Builder::<tauri::Cef>::new()
        .command_line_args([("--ozone-platform", Some("x11"))])
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let url = tauri::WebviewUrl::App("index.html".into());
            let win = WebviewWindowBuilder::new(app, "main", url)
                .title("Chromatic")
                .inner_size(1280.0, 800.0)
                .min_inner_size(1100.0, 800.0)
                .decorations(false)
                .browser_runtime_style(tauri_runtime_cef::RuntimeStyle::Alloy)
                .build()?;

            #[cfg(debug_assertions)]
            win.open_devtools();

            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![filter::reload])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
