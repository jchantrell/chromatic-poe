#[cfg(debug_assertions)]
use tauri::Manager;

mod filter;

/// Ensure GStreamer can find its plugins when running inside an AppImage.
///
/// The AppImage's library isolation can hide the host system's GStreamer
/// plugin directory. We set `GST_PLUGIN_SYSTEM_PATH_1_0` to common host
/// paths so WebKitGTK can initialise its audio pipeline (needed for any
/// sound playback via the Web Audio API or HTMLAudioElement).
#[cfg(target_os = "linux")]
fn ensure_gstreamer_plugins() {
    if std::env::var_os("GST_PLUGIN_SYSTEM_PATH_1_0").is_some() {
        return;
    }

    let candidates = [
        "/usr/lib/gstreamer-1.0",
        "/usr/lib64/gstreamer-1.0",
        "/usr/lib/x86_64-linux-gnu/gstreamer-1.0",
        "/usr/lib/aarch64-linux-gnu/gstreamer-1.0",
    ];

    let paths: Vec<&str> = candidates
        .iter()
        .filter(|p| std::path::Path::new(p).is_dir())
        .copied()
        .collect();

    if !paths.is_empty() {
        let joined = paths.join(":");
        std::env::set_var("GST_PLUGIN_SYSTEM_PATH_1_0", &joined);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    ensure_gstreamer_plugins();

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();
            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![filter::reload])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
