mod commands;
mod services;
mod types;

use commands::{filesystem, launcher, notification, process};
use services::process_monitor::ProcessMonitor;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let monitor = ProcessMonitor::new(app.handle().clone());
            monitor.start();

            app.manage(Arc::new(monitor));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            launcher::launch_tool,
            process::register_session,
            process::unregister_session,
            process::get_process_status,
            process::kill_process,
            notification::send_notification,
            filesystem::select_directory,
            filesystem::list_subdirectories,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
