mod commands;
mod services;
mod types;

use commands::{launcher, notification, process, window};
use services::process_monitor::ProcessMonitor;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            process::get_process_status,
            process::kill_process,
            window::check_window_exists,
            window::focus_window,
            notification::send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
