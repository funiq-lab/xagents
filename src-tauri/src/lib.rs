mod commands;
mod services;
mod types;

use commands::{config, filesystem, launcher, notification, process, window};
use services::process_monitor::ProcessMonitor;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
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
            window::focus_window_by_pid,
            config::backup_config_file,
            config::apply_config_to_file,
            config::read_config_file,
            config::restore_config_from_backup,
            config::list_config_backups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
