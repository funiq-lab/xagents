mod commands;
mod services;
mod types;

use commands::{config, filesystem, launcher, notification, process, window};
use services::process_monitor::ProcessMonitor;
use std::sync::Arc;
use tauri::Manager;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

// Log configuration constants
const MAX_LOG_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB

/// Initialize logging system, output logs to file
fn init_logger() {
    // Get log directory path
    let log_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("com.yellin.xagents")
        .join("logs");

    // Create log directory
    if let Err(e) = std::fs::create_dir_all(&log_dir) {
        eprintln!("Failed to create log directory: {}", e);
        return;
    }

    let log_file_path = log_dir.join("xagents.log");

    // Truncate log file if it exceeds size limit
    if let Err(e) = truncate_log_if_needed(&log_file_path) {
        eprintln!("Log truncation failed: {}", e);
    }

    // Open or create log file
    match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    {
        Ok(file) => {
            let target = Box::new(file);

            env_logger::Builder::new()
                .target(env_logger::Target::Pipe(target))
                .filter_level(log::LevelFilter::Debug)
                .format(|buf, record| {
                    writeln!(
                        buf,
                        "{} [{}] {}",
                        chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                        record.level(),
                        record.args()
                    )
                })
                .init();

            // Note: Cannot use log::info! because the logging system is not fully initialized yet
            // But the first log after initialization will be written to file
            eprintln!("Log file initialized successfully: {}", log_file_path.display());
        }
        Err(e) => {
            eprintln!("Failed to create log file: {}", e);
        }
    }
}

/// Truncate log file if it exceeds size limit
fn truncate_log_if_needed(log_file_path: &PathBuf) -> std::io::Result<()> {
    // Check current log file size
    if let Ok(metadata) = std::fs::metadata(log_file_path) {
        if metadata.len() > MAX_LOG_FILE_SIZE {
            eprintln!("Log file exceeds {}MB, truncating log file...", MAX_LOG_FILE_SIZE / 1024 / 1024);

            // Clear file
            std::fs::write(log_file_path, "")?;

            eprintln!("Log file truncated");
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging system - output to file
    init_logger();

    log::info!("======================================");
    log::info!("XAgents Application Started");
    log::info!("======================================");

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
