use crate::commands::window;
use crate::commands::window::focus_cli_window_public;
use crate::types::common::{CliLaunchResult, ToolConfig};
use std::path::Path;
use std::process::Command;
use std::thread;
use std::time::Duration;
use sysinfo::System;

#[cfg(target_os = "macos")]
fn escape_applescript_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
}

/// Launch tool (IDE/CLI) with appropriate method
///
/// IDE tools (vscode/cursor):
/// - Always launched via command line
/// - Try to get window PID via --status command for resource monitoring
///
/// CLI tools:
/// - macOS: Use AppleScript (launchMethod: "applescript")
/// - Windows/Linux: Use command line (launchMethod: "command")
/// - Cannot get stable PID for monitoring
#[tauri::command]
pub async fn launch_tool(
    tool_config: ToolConfig,
    project_path: String,
) -> Result<CliLaunchResult, String> {
    if !Path::new(&project_path).exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    log::info!(
        "[launcher] Launching {} ({}) for project: {}",
        tool_config.display_name,
        tool_config.tool_type,
        project_path
    );

    let mut existing_process_pid: Option<u32> = None;

    // Launch based on tool type
    if tool_config.tool_type == "ide" {
        if let Some(pid) = check_existing_ide_window(&tool_config.id, &project_path) {
            log::info!(
                "[launcher] Reusing existing IDE window (PID {}) for project: {}",
                pid,
                project_path
            );
            existing_process_pid = Some(pid);

            // Focus the existing IDE window by executing: code/cursor <project_path>
            match window::focus_ide_window_public(&tool_config.id, &project_path) {
                Ok(_) => log::info!(
                    "[launcher] Focused existing IDE window for project: {}",
                    project_path
                ),
                Err(err) => log::warn!("[launcher] Could not focus existing IDE window: {}", err),
            }

            // Don't launch a new IDE, just return with the existing PID
            let current_time = chrono::Utc::now().timestamp();
            return Ok(CliLaunchResult {
                start_time: current_time,
                pid: Some(pid),
                is_existing_window: true,
            });
        } else {
            launch_ide(&tool_config, &project_path)?;
        }
    } else if tool_config.tool_type == "cli" {
        // For CLI tools, check if there's already a process running for this project
        let cli_tool_name = &tool_config.display_name; // "claude", "codex", "gemini"

        if let Some(pid) = check_existing_cli_process(cli_tool_name, &project_path) {
            log::info!(
                "[launcher] Found existing CLI process (PID {}) for project: {}",
                pid,
                project_path
            );
            existing_process_pid = Some(pid);

            // Try to focus the existing CLI terminal window
            match focus_cli_window_public(pid) {
                Ok(_) => log::info!(
                    "[launcher] Focused existing CLI terminal window for PID {}",
                    pid
                ),
                Err(err) => log::warn!(
                    "[launcher] Could not focus CLI terminal window {}: {}",
                    pid,
                    err
                ),
            }

            // Don't launch a new process, just return with the existing PID
            let current_time = chrono::Utc::now().timestamp();
            return Ok(CliLaunchResult {
                start_time: current_time,
                pid: Some(pid),
                is_existing_window: true,
            });
        } else {
            // No existing process, launch new one
            launch_cli_tool(&tool_config, &project_path)?;
        }
    }

    let current_time = chrono::Utc::now().timestamp();

    // For IDE tools, try to get window PID for resource monitoring
    let pid = if tool_config.tool_type == "ide" {
        if let Some(pid) = existing_process_pid {
            log::info!("[launcher] Using existing IDE window PID: {}", pid);
            Some(pid)
        } else {
            match tool_config.id.as_str() {
                "vscode" | "cursor" => {
                    // Wait for IDE to open the window (increased from 2s to 3s)
                    thread::sleep(Duration::from_millis(5000));

                    match get_ide_window_pid(&tool_config.id, &project_path) {
                        Ok(window_pid) => {
                            log::info!("[launcher] Found IDE window PID: {}", window_pid);
                            Some(window_pid)
                        }
                        Err(e) => {
                            log::warn!("[launcher] Could not find IDE window PID: {}", e);
                            None
                        }
                    }
                }
                _ => None,
            }
        }
    } else if tool_config.tool_type == "cli" {
        // CLI tools: use existing process PID if found, otherwise try to find it
        if let Some(pid) = existing_process_pid {
            log::info!("[launcher] Using existing CLI process PID: {}", pid);
            Some(pid)
        } else {
            // Wait for process to start
            thread::sleep(Duration::from_millis(5000));

            // Use the actual tool name from config
            let tool_name = &tool_config.display_name;

            match find_cli_process_by_path(&project_path, tool_name) {
                Some(cli_pid) => {
                    log::info!("[launcher] Found CLI process PID: {}", cli_pid);
                    Some(cli_pid)
                }
                None => {
                    log::warn!("[launcher] Could not find CLI process, monitoring disabled");
                    None
                }
            }
        }
    } else {
        None
    };

    let is_existing_window = existing_process_pid.is_some();

    log::info!(
        "[launcher] Launch completed - PID: {:?}, Existing: {}",
        pid,
        is_existing_window
    );

    Ok(CliLaunchResult {
        start_time: current_time,
        pid,
        is_existing_window,
    })
}

/// Launch IDE tool via command line
fn launch_ide(tool_config: &ToolConfig, project_path: &str) -> Result<(), String> {
    log::info!("[launcher] Launching IDE: {}", tool_config.command);

    #[cfg(target_os = "macos")]
    {
        // On macOS, use 'open -a' for better compatibility in production
        // Extract IDE name from command
        let app_name = if tool_config.command.contains("cursor") {
            "Cursor"
        } else if tool_config.command.contains("code") {
            "Visual Studio Code"
        } else {
            // Fallback to original command
            return spawn_command(&tool_config.command).map(|_| ());
        };

        log::info!(
            "[launcher] Using 'open -a {}' for production compatibility",
            app_name
        );
        let output = Command::new("open")
            .arg("-a")
            .arg(app_name)
            .arg(project_path)
            .output()
            .map_err(|e| format!("Failed to execute open command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to launch IDE: {}", stderr));
        }

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        spawn_command(&tool_config.command)?;
        Ok(())
    }
}

/// Launch CLI tool (via terminal with auto-execution)
fn launch_cli_tool(tool_config: &ToolConfig, project_path: &str) -> Result<(), String> {
    log::info!(
        "[launcher] Launching CLI tool: {}",
        tool_config.display_name
    );

    // For CLI tools, we need to launch via terminal
    // Use AppleScript on macOS or command line on other platforms
    if tool_config.launch_method == "applescript" {
        #[cfg(target_os = "macos")]
        {
            launch_cli_with_applescript(tool_config, project_path)?;
        }
        #[cfg(not(target_os = "macos"))]
        {
            return Err("AppleScript launch method is only supported on macOS".to_string());
        }
    } else {
        // Command line launch for Windows/Linux
        spawn_command(&tool_config.command)?;
    }

    Ok(())
}

/// Check if a CLI process is already running for this project
///
/// Search for processes by:
/// 1. Process name matches the tool name (claude, codex, gemini)
/// 2. Process CWD (current working directory) matches the project path
fn check_existing_cli_process(tool_name: &str, project_path: &str) -> Option<u32> {
    log::info!(
        "[launcher] Checking for existing CLI process: {} in {}",
        tool_name,
        project_path
    );

    find_cli_process_by_path(project_path, tool_name)
}

/// Execute shell command
fn spawn_command(command: &str) -> Result<std::process::Child, String> {
    #[cfg(target_os = "windows")]
    let result = Command::new("cmd").args(["/C", command]).spawn();

    #[cfg(not(target_os = "windows"))]
    let result = Command::new("sh").arg("-c").arg(command).spawn();

    result.map_err(|e| format!("Failed to execute command '{}': {}", command, e))
}

/// Check if IDE window for project already exists and return its PID if found
///
/// This checks if there's already an open window for the project before launching a new one.
/// Uses retry mechanism because IDE windows may take time to fully load and appear in --status output.
fn check_existing_ide_window(ide_id: &str, project_path: &str) -> Option<u32> {
    // Try up to 3 times with delays, as IDE windows may not immediately appear in --status
    for attempt in 1..=3 {
        match get_ide_window_pid(ide_id, project_path) {
            Ok(pid) => {
                log::info!(
                    "[launcher] Found existing window for project: PID {} (attempt {})",
                    pid,
                    attempt
                );
                return Some(pid);
            }
            Err(e) => {
                if attempt < 3 {
                    log::debug!(
                        "[launcher] Attempt {}: Could not find window yet: {}",
                        attempt,
                        e
                    );
                    thread::sleep(Duration::from_millis(1000));
                } else {
                    log::debug!(
                        "[launcher] No existing window found after {} attempts",
                        attempt
                    );
                }
            }
        }
    }
    None
}
/// Get IDE window PID using --status command
///
/// This only works for VSCode and Cursor, which support the --status flag
/// to list all open windows with their PIDs.
fn get_ide_window_pid(ide_id: &str, project_path: &str) -> Result<u32, String> {
    let command = match ide_id {
        "vscode" => "code",
        "cursor" => "cursor",
        _ => return Err(format!("Unsupported IDE: {}", ide_id)),
    };

    log::info!("[launcher] Running {} --status to find window PID", command);

    // Try direct command first
    let mut result = Command::new(command).arg("--status").output();

    // If command not found in PATH, try common installation locations on macOS
    #[cfg(target_os = "macos")]
    if result.is_err() {
        let full_path = match ide_id {
            "vscode" => "/usr/local/bin/code",
            "cursor" => "/usr/local/bin/cursor",
            _ => command,
        };

        log::info!(
            "[launcher] Command not in PATH, trying full path: {}",
            full_path
        );
        result = Command::new(full_path).arg("--status").output();
    }

    let output = result.map_err(|e| format!("Failed to execute {} --status: {}", command, e))?;

    if !output.status.success() {
        return Err(format!(
            "{} --status failed with status: {}",
            command, output.status
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse the output to find matching window
    // Example line: "    0       360     89807    window [2] (.env — project-name)"

    // Extract project folder name from path
    let project_name = Path::new(project_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    log::info!(
        "[launcher] Looking for windows with project: {}",
        project_name
    );

    // Find all window lines containing the project name
    let mut candidate_pids = Vec::new();

    for line in stdout.lines() {
        // Match lines like: "    0       360     89807    window [2] (.env — project-name)"
        if line.contains("window [") && line.contains(project_name) {
            // Extract PID (3rd column)
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                if let Ok(pid) = parts[2].parse::<u32>() {
                    log::info!(
                        "[launcher] Found candidate window PID: {} for line: {}",
                        pid,
                        line.trim()
                    );
                    candidate_pids.push(pid);
                }
            }
        }
    }

    if candidate_pids.is_empty() {
        return Err(format!(
            "No window found for project '{}' in {} --status output",
            project_name, command
        ));
    }

    // Return the first matching PID
    Ok(candidate_pids[0])
}

/// Launch CLI tool using AppleScript (macOS only)
///
/// Different terminal applications require different AppleScript approaches:
/// - Terminal: Native AppleScript support
/// - iTerm2: Native AppleScript support
/// - Warp: Use System Events to send keystrokes
///
/// For AI CLI tools (claude, codex, gemini), auto-execute the command
#[cfg(target_os = "macos")]
fn launch_cli_with_applescript(tool_config: &ToolConfig, project_path: &str) -> Result<(), String> {
    let app_name = &tool_config.command; // For AppleScript, command field contains app name

    // Check if this is an AI CLI tool launch (display_name will be the AI tool command)
    let is_ai_cli = tool_config.display_name == "claude"
        || tool_config.display_name == "codex"
        || tool_config.display_name == "gemini";

    // Build the shell command to execute in the terminal
    // Note: We need to escape the path for both AppleScript AND shell
    let shell_command = if is_ai_cli {
        // For AI CLI tools, auto-execute the command
        format!("cd '{}' && {}", project_path, tool_config.display_name)
    } else {
        // For regular terminals, just cd and clear
        format!("cd '{}' && clear", project_path)
    };

    // Now escape this entire command for AppleScript
    let command_to_execute = escape_applescript_string(&shell_command);

    // Generate AppleScript based on tool ID
    let script = match tool_config.id.as_str() {
        "terminal" => {
            format!(
                r#"
tell application "Terminal"
    do script "{}"
    activate
end tell
"#,
                command_to_execute
            )
        }
        "iterm2" => {
            format!(
                r#"
tell application "iTerm"
    create window with default profile
    tell current session of current window
        write text "{}"
    end tell
    activate
end tell
"#,
                command_to_execute
            )
        }
        "warp" => {
            format!(
                r#"
tell application "Warp"
    activate
    tell application "System Events"
        keystroke "t" using {{command down}}
        delay 0.5
        keystroke "{}"
        keystroke return
    end tell
end tell
"#,
                command_to_execute
            )
        }
        _ => {
            // Generic AppleScript for unknown terminals
            return Err(format!("Unsupported macOS CLI tool: {}", tool_config.id));
        }
    };

    log::info!("[launcher] Executing AppleScript for {}", app_name);
    if is_ai_cli {
        log::info!(
            "[launcher] Auto-executing AI CLI command: {}",
            tool_config.display_name
        );
    }

    // Execute AppleScript
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("AppleScript execution failed: {}", stderr));
    }

    log::info!(
        "[launcher] Successfully launched {} via AppleScript",
        app_name
    );
    Ok(())
}

/// Find CLI process by tool name and project path
///
/// Strictly match BOTH:
/// 1. Tool name: Process name/executable/command matches the specific tool
/// 2. Project path: Process CWD or command line contains the project path
///
/// This ensures we only find the exact tool running in the exact project,
/// avoiding false matches when multiple tools are used in the same project.
///
/// Supported AI coding assistant CLI tools:
/// - claude: Claude Code CLI
/// - codex: GitHub Codex CLI
/// - gemini: Google Gemini CLI
fn find_cli_process_by_path(project_path: &str, tool_name: &str) -> Option<u32> {
    log::info!(
        "[launcher] Searching for CLI process: {} in path: {}",
        tool_name,
        project_path
    );

    let mut sys = System::new_all();
    sys.refresh_processes();

    let normalized_path = Path::new(project_path).canonicalize().ok()?;
    let normalized_path_str = normalized_path.to_string_lossy().to_string();

    let tool_lower = tool_name.to_lowercase();

    // Find the first matching process
    for (pid, process) in sys.processes() {
        let process_name = process.name().to_lowercase();
        let pid_u32 = pid.as_u32();
        let exe_lower = process
            .exe()
            .map(|path| path.to_string_lossy().to_lowercase());
        let cmd_line = process.cmd();
        let cmd_line_joined = cmd_line.join(" ");

        // Step 1: Check if this process matches the tool name
        let matches_tool =
            // Exact match: process name equals tool name
            process_name == tool_lower
            // OR executable path ends with the tool name
            || exe_lower
                .as_ref()
                .map(|exe| {
                    exe.ends_with(&format!("/{}", tool_lower))
                        || exe.ends_with(&format!("\\{}", tool_lower))
                        || exe == &tool_lower
                })
                .unwrap_or(false)
            // OR command line contains the tool as a standalone argument
            // (e.g., "node /path/to/claude" or just "claude")
            || cmd_line.iter().any(|arg| {
                let arg_lower = arg.to_lowercase();
                arg_lower == tool_lower
                    || arg_lower.ends_with(&format!("/{}", tool_lower))
                    || arg_lower.ends_with(&format!("\\{}", tool_lower))
            });

        if !matches_tool {
            continue;
        }

        log::info!(
            "[launcher] Found tool process PID={}, name={}, checking path...",
            pid_u32,
            process_name
        );

        // Step 2: Check if this process is running in the target project path
        // Method 1: Check CWD (current working directory) - most reliable
        if let Some(cwd) = process.cwd() {
            if let Ok(cwd_canonical) = cwd.canonicalize() {
                if cwd_canonical == normalized_path {
                    log::info!(
                        "[launcher] ✅ MATCHED by CWD: PID={}, tool={}, cwd={}",
                        pid_u32,
                        tool_name,
                        cwd.display()
                    );
                    return Some(pid_u32);
                }
            }
        }

        // Method 2: Check command line arguments (fallback)
        // Some CLIs might have the path in their arguments
        if cmd_line_joined.contains(&normalized_path_str) || cmd_line_joined.contains(project_path)
        {
            log::info!(
                "[launcher] ✅ MATCHED by cmd: PID={}, tool={}, cmd={}",
                pid_u32,
                tool_name,
                cmd_line_joined
            );
            return Some(pid_u32);
        }

        log::debug!(
            "[launcher] ❌ Tool matched but path mismatch: PID={}, tool={}",
            pid_u32,
            tool_name
        );
    }

    log::warn!(
        "[launcher] No matching process found for tool={} in path={}",
        tool_name,
        project_path
    );
    None
}
