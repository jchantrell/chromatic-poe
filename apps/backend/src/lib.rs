// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn hi(value: &str) -> String {
    format!("hi from rust. you entered {}", value)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![hi])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
