use crate::services::process_monitor::ProcessMonitor;
use crate::types::common::{CliLaunchResult, ToolConfig};
use std::collections::HashSet;
use std::path::Path;
use std::process::Command;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};
use sysinfo::System;

/// Launch tool (IDE/CLI) using unified configuration
#[tauri::command]
pub async fn launch_tool(
    tool_config: ToolConfig,
    project_path: String,
    monitor: tauri::State<'_, Arc<ProcessMonitor>>,
) -> Result<CliLaunchResult, String> {
    if !Path::new(&project_path).exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    let resolved_command = resolve_command(&tool_config.command, &project_path);
    let baseline = collect_process_ids(&tool_config.process_name);

    spawn_command(&resolved_command)?;

    let (pid, process_start_time) =
        wait_for_target_process(&tool_config.process_name, &baseline).map_err(|err| {
            format!(
                "Failed to locate process '{}': {}. Please verify the tool is installed.",
                tool_config.process_name, err
            )
        })?;

    let session_id = uuid::Uuid::new_v4().to_string();
    monitor
        .add_session(session_id.clone(), pid, process_start_time)
        .await;

    Ok(CliLaunchResult {
        pid,
        session_id,
        process_start_time,
    })
}

fn resolve_command(template: &str, project_path: &str) -> String {
    template.replace("{path}", project_path)
}

fn spawn_command(command: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let result = Command::new("cmd").args(["/C", command]).spawn();

    #[cfg(not(target_os = "windows"))]
    let result = Command::new("sh").arg("-c").arg(command).spawn();

    result
        .map(|_| ())
        .map_err(|e| format!("Failed to execute command '{}': {}", command, e))
}

fn collect_process_ids(process_name: &str) -> HashSet<u32> {
    let mut sys = System::new_all();
    sys.refresh_processes();

    sys.processes()
        .iter()
        .filter(|(_, process)| process.name().eq_ignore_ascii_case(process_name))
        .map(|(pid, _)| pid.as_u32())
        .collect()
}

fn wait_for_target_process(
    process_name: &str,
    baseline: &HashSet<u32>,
) -> Result<(u32, i64), String> {
    if process_name.trim().is_empty() {
        return Err("process name is empty".to_string());
    }

    let timeout = Duration::from_secs(10);
    let interval = Duration::from_millis(250);
    let mut sys = System::new_all();
    let start = Instant::now();

    while start.elapsed() <= timeout {
        sys.refresh_processes();

        for (pid, process) in sys.processes() {
            if process.name().eq_ignore_ascii_case(process_name)
                && !baseline.contains(&pid.as_u32())
            {
                return Ok((pid.as_u32(), process.start_time() as i64));
            }
        }

        thread::sleep(interval);
    }

    if !baseline.is_empty() {
        sys.refresh_processes();
        for pid in baseline {
            let sys_pid = sysinfo::Pid::from_u32(*pid);
            if let Some(process) = sys.process(sys_pid) {
                return Ok((*pid, process.start_time() as i64));
            }
        }
    }

    Err("process not detected within timeout".to_string())
}
