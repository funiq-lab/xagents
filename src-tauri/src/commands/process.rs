use crate::services::process_monitor::ProcessMonitor;
use crate::types::common::ProcessStatus;
use std::sync::Arc;
use sysinfo::System;
use tauri::State;

/// Register a session to the process monitor
#[tauri::command]
pub async fn register_session(
    monitor: State<'_, Arc<ProcessMonitor>>,
    pid: u32,
    start_time: i64,
) -> Result<(), String> {
    println!(
        "[process] Registering session to monitor: pid={}, start_time={}",
        pid, start_time
    );

    monitor.add_session(pid, start_time).await;

    println!("[process] Session registered successfully");
    Ok(())
}

/// Unregister a session from the process monitor
#[tauri::command]
pub async fn unregister_session(
    monitor: State<'_, Arc<ProcessMonitor>>,
    pid: u32,
) -> Result<(), String> {
    println!("[process] Unregistering session from monitor: pid={}", pid);

    monitor.remove_session(pid).await;

    println!("[process] Session unregistered successfully");
    Ok(())
}

/// Get process status with CPU and memory usage
#[tauri::command]
pub fn get_process_status(pid: u32, expected_start_time: i64) -> Result<ProcessStatus, String> {
    let mut sys = System::new_all();
    sys.refresh_processes();

    let pid = sysinfo::Pid::from_u32(pid);

    if let Some(process) = sys.process(pid) {
        let actual_start_time = process.start_time() as i64;

        // Verify start time to prevent PID reuse (allow ±1 seconds tolerance)
        if (actual_start_time - expected_start_time).abs() > 1 {
            return Ok(ProcessStatus {
                is_alive: false,
                cpu_usage: 0.0,
                memory_usage: 0,
                name: String::new(),
            });
        }

        Ok(ProcessStatus {
            is_alive: true,
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory() / 1024 / 1024, // Convert to MB
            name: process.name().to_string(),
        })
    } else {
        Ok(ProcessStatus {
            is_alive: false,
            cpu_usage: 0.0,
            memory_usage: 0,
            name: String::new(),
        })
    }
}

/// Kill process by PID
#[tauri::command]
pub fn kill_process(pid: u32) -> Result<(), String> {
    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;

        kill(Pid::from_raw(pid as i32), Signal::SIGTERM)
            .map_err(|e| format!("Failed to kill process: {}", e))
    }

    #[cfg(windows)]
    {
        use std::process::Command;

        Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F"])
            .output()
            .map_err(|e| format!("Failed to kill process: {}", e))?;

        Ok(())
    }
}
