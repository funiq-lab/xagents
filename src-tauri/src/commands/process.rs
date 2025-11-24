use crate::types::common::ProcessStatus;
use sysinfo::System;

/// Get process status with CPU and memory usage
#[tauri::command]
pub fn get_process_status(pid: u32, expected_start_time: i64) -> Result<ProcessStatus, String> {
    let mut sys = System::new_all();
    sys.refresh_processes();

    let pid = sysinfo::Pid::from_u32(pid);

    if let Some(process) = sys.process(pid) {
        let actual_start_time = process.start_time() as i64;

        // Verify start time to prevent PID reuse (allow ±5 seconds tolerance)
        if (actual_start_time - expected_start_time).abs() > 5 {
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
