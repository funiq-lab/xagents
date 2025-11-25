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

    println!(
        "[launcher] Launching {} ({}) for project: {}",
        tool_config.display_name, tool_config.tool_type, project_path
    );

    let mut existing_process_pid: Option<u32> = None;

    // Launch based on tool type
    if tool_config.tool_type == "ide" {
        if let Some(pid) = check_existing_ide_window(&tool_config.id, &project_path) {
            println!(
                "[launcher] Reusing existing IDE window (PID {}) for project: {}",
                pid, project_path
            );
            existing_process_pid = Some(pid);

            match focus_ide_window(&tool_config.id, pid) {
                Ok(_) => println!("[launcher] Focused existing window {}", pid),
                Err(err) => println!(
                    "[launcher] Could not focus existing window {}: {}",
                    pid, err
                ),
            }
        } else {
            launch_ide(&tool_config, &project_path)?;
        }
    } else if tool_config.tool_type == "cli" {
        // For CLI tools, check if there's already a process running for this project
        let cli_tool_name = &tool_config.display_name; // "claude", "codex", "gemini"

        if let Some(pid) = check_existing_cli_process(cli_tool_name, &project_path) {
            println!(
                "[launcher] Found existing CLI process (PID {}) for project: {}",
                pid, project_path
            );
            existing_process_pid = Some(pid);

            // Try to focus the CLI terminal window
            match focus_cli_window(pid) {
                Ok(_) => println!("[launcher] Focused existing CLI terminal window {}", pid),
                Err(err) => println!(
                    "[launcher] Could not focus CLI terminal window {}: {}",
                    pid, err
                ),
            }
        } else {
            // No existing process, launch new one
            launch_cli_tool(&tool_config, &project_path)?;
        }
    }

    let current_time = chrono::Utc::now().timestamp();

    // For IDE tools, try to get window PID for resource monitoring
    let pid = if tool_config.tool_type == "ide" {
        if let Some(pid) = existing_process_pid {
            println!("[launcher] Using existing IDE window PID: {}", pid);
            Some(pid)
        } else {
            match tool_config.id.as_str() {
                "vscode" | "cursor" => {
                    // Wait for IDE to open the window
                    thread::sleep(Duration::from_millis(2000));

                    match get_ide_window_pid(&tool_config.id, &project_path) {
                        Ok(window_pid) => {
                            println!("[launcher] Found IDE window PID: {}", window_pid);
                            Some(window_pid)
                        }
                        Err(e) => {
                            println!("[launcher] Could not find IDE window PID: {}", e);
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
            println!("[launcher] Using existing CLI process PID: {}", pid);
            Some(pid)
        } else {
            // Wait for process to start
            thread::sleep(Duration::from_millis(1500));

            // Define known CLI tool process names to search for
            // These are AI coding assistants that can be launched from terminal
            let tool_names = vec!["claude", "codex", "gemini"];

            match find_cli_process_by_path(&project_path, &tool_names) {
                Some(cli_pid) => {
                    println!("[launcher] Found CLI process PID: {}", cli_pid);
                    Some(cli_pid)
                }
                None => {
                    println!("[launcher] Could not find CLI process, monitoring disabled");
                    None
                }
            }
        }
    } else {
        None
    };

    let is_existing_window = existing_process_pid.is_some();

    println!(
        "[launcher] Launch completed - PID: {:?}, Existing: {}",
        pid, is_existing_window
    );

    Ok(CliLaunchResult {
        start_time: current_time,
        pid,
        is_existing_window,
    })
}

/// Launch IDE tool via command line
fn launch_ide(tool_config: &ToolConfig, _project_path: &str) -> Result<(), String> {
    println!("[launcher] Launching IDE: {}", tool_config.command);
    spawn_command(&tool_config.command)?;
    Ok(())
}

/// Launch CLI tool (via terminal with auto-execution)
fn launch_cli_tool(tool_config: &ToolConfig, project_path: &str) -> Result<(), String> {
    println!(
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
    println!(
        "[launcher] Checking for existing CLI process: {} in {}",
        tool_name, project_path
    );

    let tool_names = vec![tool_name];
    find_cli_process_by_path(project_path, &tool_names)
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
fn check_existing_ide_window(ide_id: &str, project_path: &str) -> Option<u32> {
    match get_ide_window_pid(ide_id, project_path) {
        Ok(pid) => {
            println!("[launcher] Found existing window for project: PID {}", pid);
            Some(pid)
        }
        Err(_) => None,
    }
}

/// Focus IDE window by PID
#[cfg(target_os = "macos")]
fn focus_ide_window(ide_id: &str, pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[launcher] Focusing window with PID: {} for IDE id {}",
        pid, ide_id
    );

    let app_name = match ide_id {
        "vscode" => "Visual Studio Code",
        "cursor" => "Cursor",
        _ => "",
    };

    // Activate the IDE first, then ensure the process is frontmost via System Events
    let script = if app_name.is_empty() {
        format!(
            r#"
tell application "System Events"
    set frontmost of first process whose unix id is {} to true
end tell
"#,
            pid
        )
    } else {
        format!(
            r#"
tell application "{}"
    activate
end tell
delay 0.1
tell application "System Events"
    set frontmost of first process whose unix id is {} to true
end tell
"#,
            app_name, pid
        )
    };

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to focus window: {}", stderr));
    }

    println!("[launcher] Successfully focused window with PID {}", pid);
    Ok(())
}

#[cfg(target_os = "windows")]
fn focus_ide_window(_ide_id: &str, pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!("[launcher] Focusing window on Windows for PID {}", pid);

    let script = format!(
        r#"
$ErrorActionPreference = 'Stop'
$process = Get-Process -Id {pid}
$hWnd = $process.MainWindowHandle
if ($hWnd -eq 0) {{
    $process.WaitForInputIdle() | Out-Null
    $process.Refresh()
    $hWnd = $process.MainWindowHandle
}}
if ($hWnd -eq 0) {{
    exit 1
}}
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {{
    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}}
"@
[Win32]::ShowWindowAsync($hWnd, 9) | Out-Null
[Win32]::SetForegroundWindow($hWnd) | Out-Null
"#,
        pid = pid
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Failed to focus window via PowerShell (status {}): {}",
            output.status, stderr
        ));
    }

    println!("[launcher] Successfully focused window with PID {}", pid);
    Ok(())
}

#[cfg(target_os = "linux")]
fn focus_ide_window(_ide_id: &str, pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!("[launcher] Focusing window on Linux for PID {}", pid);

    let wmctrl_output = Command::new("wmctrl")
        .arg("-lp")
        .output()
        .map_err(|e| format!("Failed to execute wmctrl: {}", e))?;

    if !wmctrl_output.status.success() {
        let stderr = String::from_utf8_lossy(&wmctrl_output.stderr);
        return Err(format!("wmctrl -lp failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&wmctrl_output.stdout);
    for line in stdout.lines() {
        let mut parts = line.split_whitespace();
        let window_id = match parts.next() {
            Some(id) => id,
            None => continue,
        };
        // Skip desktop column
        if parts.next().is_none() {
            continue;
        }

        if let Some(pid_str) = parts.next() {
            if let Ok(line_pid) = pid_str.parse::<u32>() {
                if line_pid == pid {
                    let output = Command::new("wmctrl")
                        .args(["-ia", window_id])
                        .output()
                        .map_err(|e| format!("Failed to focus window via wmctrl: {}", e))?;

                    if !output.status.success() {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        return Err(format!("wmctrl -ia failed: {}", stderr));
                    }

                    println!("[launcher] Successfully focused window with PID {}", pid);
                    return Ok(());
                }
            }
        }
    }

    Err(format!(
        "Could not find window for PID {} using wmctrl. Ensure wmctrl is installed.",
        pid
    ))
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn focus_ide_window(_ide_id: &str, _pid: u32) -> Result<(), String> {
    Err("Window focusing is not supported on this platform".to_string())
}

/// Focus CLI terminal window by PID
///
/// Unlike IDE windows, CLI tools run inside terminal applications (Terminal, iTerm, Warp, etc).
/// We need to find the parent terminal window and bring it to front.
///
/// Process hierarchy is typically:
/// CLI tool (claude/codex) -> shell (zsh/bash) -> login -> terminal app (Terminal/iTerm/Warp)
#[cfg(target_os = "macos")]
fn focus_cli_window(pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!("[launcher] Focusing CLI terminal window for PID: {}", pid);

    // Walk up the process tree using ps command to find the terminal application
    let (terminal_pid, terminal_name) = find_terminal_process_macos(pid)?;

    println!("[launcher] ✅ Found terminal: {} (PID: {})", terminal_name, terminal_pid);

    println!("[launcher] ✅ Found terminal: {} (PID: {})", terminal_name, terminal_pid);

    // Map terminal process/executable names to AppleScript application names
    // Based on BUILTIN_CLI_TOOLS configuration
    let app_name = if terminal_name.contains("iterm") || terminal_name.contains("iTerm") {
        "iTerm"  // iTerm2
    } else if terminal_name.contains("terminal") || terminal_name.contains("Terminal") {
        "Terminal"  // macOS Terminal
    } else if terminal_name.contains("warp") || terminal_name.contains("Warp") {
        "Warp"  // Warp
    } else {
        // For unsupported terminals, try generic focus approach
        println!("[launcher] ⚠️ Unsupported terminal '{}', trying generic focus", terminal_name);
        let script = format!(
            r#"
tell application "System Events"
    set frontmost of first process whose unix id is {} to true
end tell
"#,
            terminal_pid
        );

        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to focus terminal window: {}", stderr));
        }

        println!("[launcher] ✅ Successfully focused terminal window with PID {}", terminal_pid);
        return Ok(());
    };

    // For known terminal applications, activate by name first, then focus by PID
    let script = format!(
        r#"
tell application "{}"
    activate
end tell
delay 0.1
tell application "System Events"
    try
        set frontmost of first process whose unix id is {} to true
    on error errMsg
        -- If PID lookup fails, just activate by name
        tell process "{}" to set frontmost to true
    end try
end tell
"#,
        app_name,
        terminal_pid,
        app_name
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to focus terminal window: {}", stderr));
    }

    println!(
        "[launcher] ✅ Successfully focused terminal window '{}' with PID {}",
        app_name, terminal_pid
    );
    Ok(())
}

/// Find terminal application process by walking up the process tree using ps command (macOS)
///
/// Returns: (terminal_pid, terminal_name_or_path)
#[cfg(target_os = "macos")]
fn find_terminal_process_macos(start_pid: u32) -> Result<(u32, String), String> {
    let mut current_pid = start_pid;
    let max_depth = 10;

    for depth in 0..max_depth {
        // Get parent PID and command using ps
        let output = Command::new("ps")
            .args(["-p", &current_pid.to_string(), "-o", "ppid=,comm="])
            .output()
            .map_err(|e| format!("Failed to execute ps command: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "ps command failed for PID {}: {}",
                current_pid,
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = output_str.trim().split_whitespace().collect();

        if parts.len() < 2 {
            return Err(format!(
                "Invalid ps output format for PID {}: {}",
                current_pid, output_str
            ));
        }

        let parent_pid: u32 = parts[0]
            .parse()
            .map_err(|e| format!("Failed to parse parent PID: {}", e))?;
        let command = parts[1..].join(" ");

        println!(
            "[launcher] [{}] PID {} -> parent PID {}, command: {}",
            depth, current_pid, parent_pid, command
        );

        // Check if this is a supported terminal application
        // Strict matching: check if the command ends with the terminal name
        // Supported terminals: Terminal, iTerm, Warp
        let command_lower = command.to_lowercase();
        let is_terminal = command_lower.ends_with("terminal")      // /Applications/Utilities/Terminal.app/Contents/MacOS/Terminal
                       || command_lower.ends_with("iterm")         // /Applications/iTerm.app/Contents/MacOS/iTerm
                       || command_lower.ends_with("iterm2")        // Some versions may use iTerm2
                       || command_lower.ends_with("warp");         // /Applications/Warp.app/Contents/MacOS/Warp

        if is_terminal {
            println!("[launcher] ✅ Matched terminal: {}", command);
            return Ok((current_pid, command.to_string()));
        }

        // Move to parent process
        if parent_pid == 0 || parent_pid == 1 {
            break;
        }

        current_pid = parent_pid;
    }

    Err("Could not find supported terminal application (Terminal/iTerm/Warp) in process tree".to_string())
}

#[cfg(target_os = "windows")]
fn focus_cli_window(pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[launcher] Focusing CLI terminal window on Windows for PID {}",
        pid
    );

    // Find the parent process (terminal window) of the CLI process
    let script = format!(
        r#"
$ErrorActionPreference = 'Stop'
try {{
    $process = Get-Process -Id {pid}
    $parentId = (Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)").ParentProcessId
    if ($parentId -eq $null) {{
        exit 1
    }}
    $parentProcess = Get-Process -Id $parentId
    $hWnd = $parentProcess.MainWindowHandle
    if ($hWnd -eq 0) {{
        $parentProcess.WaitForInputIdle() | Out-Null
        $parentProcess.Refresh()
        $hWnd = $parentProcess.MainWindowHandle
    }}
    if ($hWnd -eq 0) {{
        exit 1
    }}
    Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {{
    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}}
"@
    [Win32]::ShowWindowAsync($hWnd, 9) | Out-Null
    [Win32]::SetForegroundWindow($hWnd) | Out-Null
}} catch {{
    exit 1
}}
"#,
        pid = pid
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Failed to focus terminal window via PowerShell (status {}): {}",
            output.status, stderr
        ));
    }

    println!(
        "[launcher] Successfully focused terminal window for PID {}",
        pid
    );
    Ok(())
}

#[cfg(target_os = "linux")]
fn focus_cli_window(pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[launcher] Focusing CLI terminal window on Linux for PID {}",
        pid
    );

    // Walk up the process tree using ps command to find the terminal application
    let (terminal_pid, _terminal_name) = find_terminal_process_linux(pid)?;

    println!("[launcher] ✅ Found terminal PID: {}", terminal_pid);

    // Use wmctrl to focus the terminal window
    let wmctrl_output = Command::new("wmctrl")
        .arg("-lp")
        .output()
        .map_err(|e| format!("Failed to execute wmctrl: {}", e))?;

    if !wmctrl_output.status.success() {
        let stderr = String::from_utf8_lossy(&wmctrl_output.stderr);
        return Err(format!("wmctrl -lp failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&wmctrl_output.stdout);
    for line in stdout.lines() {
        let mut parts = line.split_whitespace();
        let window_id = match parts.next() {
            Some(id) => id,
            None => continue,
        };
        // Skip desktop column
        if parts.next().is_none() {
            continue;
        }

        if let Some(pid_str) = parts.next() {
            if let Ok(line_pid) = pid_str.parse::<u32>() {
                if line_pid == terminal_pid {
                    let output = Command::new("wmctrl")
                        .args(["-ia", window_id])
                        .output()
                        .map_err(|e| format!("Failed to focus window via wmctrl: {}", e))?;

                    if !output.status.success() {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        return Err(format!("wmctrl -ia failed: {}", stderr));
                    }

                    println!(
                        "[launcher] ✅ Successfully focused terminal window with PID {}",
                        terminal_pid
                    );
                    return Ok(());
                }
            }
        }
    }

    Err(format!(
        "Could not find terminal window for PID {} using wmctrl",
        terminal_pid
    ))
}

/// Find terminal application process by walking up the process tree using ps command (Linux)
///
/// Returns: (terminal_pid, terminal_name_or_path)
#[cfg(target_os = "linux")]
fn find_terminal_process_linux(start_pid: u32) -> Result<(u32, String), String> {
    let mut current_pid = start_pid;
    let max_depth = 10;

    for depth in 0..max_depth {
        // Get parent PID and command using ps
        let output = Command::new("ps")
            .args(["-p", &current_pid.to_string(), "-o", "ppid=,comm="])
            .output()
            .map_err(|e| format!("Failed to execute ps command: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "ps command failed for PID {}: {}",
                current_pid,
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = output_str.trim().split_whitespace().collect();

        if parts.len() < 2 {
            return Err(format!(
                "Invalid ps output format for PID {}: {}",
                current_pid, output_str
            ));
        }

        let parent_pid: u32 = parts[0]
            .parse()
            .map_err(|e| format!("Failed to parse parent PID: {}", e))?;
        let command = parts[1..].join(" ");

        println!(
            "[launcher] [{}] PID {} -> parent PID {}, command: {}",
            depth, current_pid, parent_pid, command
        );

        // Check if this is a supported terminal application
        // Strict matching: check if the command ends with gnome-terminal
        let command_lower = command.to_lowercase();
        let is_terminal = command_lower.ends_with("gnome-terminal");

        if is_terminal {
            println!("[launcher] ✅ Matched terminal: {}", command);
            return Ok((current_pid, command.to_string()));
        }

        // Move to parent process
        if parent_pid == 0 || parent_pid == 1 {
            break;
        }

        current_pid = parent_pid;
    }

    Err("Could not find supported terminal application (GNOME Terminal) in process tree".to_string())
}

#[cfg(target_os = "linux")]
fn focus_cli_window(_pid: u32) -> Result<(), String> {
    Err("CLI window focusing is not supported on this platform".to_string())
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

    println!("[launcher] Running {} --status to find window PID", command);

    let output = Command::new(command)
        .arg("--status")
        .output()
        .map_err(|e| format!("Failed to execute {} --status: {}", command, e))?;

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

    println!(
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
                    println!(
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
    activate
    do script "{}"
end tell
"#,
                command_to_execute
            )
        }
        "iterm2" => {
            format!(
                r#"
tell application "iTerm"
    activate
    create window with default profile
    tell current session of current window
        write text "{}"
    end tell
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

    println!("[launcher] Executing AppleScript for {}", app_name);
    if is_ai_cli {
        println!(
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

    println!(
        "[launcher] Successfully launched {} via AppleScript",
        app_name
    );
    Ok(())
}

/// Find CLI process by project path
///
/// After launching a CLI tool, search for processes that have the project path
/// in their command line arguments or working directory.
///
/// Supported AI coding assistant CLI tools:
/// - claude: Claude Code CLI
/// - codex: GitHub Codex CLI
/// - gemini: Google Gemini CLI
fn find_cli_process_by_path(project_path: &str, tool_names: &[&str]) -> Option<u32> {
    println!(
        "[launcher] Searching for CLI process with path: {}",
        project_path
    );
    println!("[launcher] Looking for tool names: {:?}", tool_names);

    let mut sys = System::new_all();
    sys.refresh_processes();

    let normalized_path = Path::new(project_path)
        .canonicalize()
        .ok()?
        .to_string_lossy()
        .to_string();

    // Find the first matching process
    for (pid, process) in sys.processes() {
        let process_name = process.name().to_lowercase();
        let pid_u32 = pid.as_u32();
        let exe_lower = process
            .exe()
            .map(|path| path.to_string_lossy().to_lowercase());
        let cmd_line = process.cmd();
        let cmd_line_joined = cmd_line.join(" ");
        let cmd_line_lower = cmd_line_joined.to_lowercase();

        // Check if the process corresponds to any of the CLI tools by inspecting
        // the process name, executable path or full command line. Some CLIs
        // (e.g. claude) run under `node`, so the process name alone is not
        // sufficient.
        let matches_tool = tool_names.iter().any(|tool| {
            let tool_lower = tool.to_lowercase();

            process_name.contains(&tool_lower)
                || exe_lower
                    .as_ref()
                    .map(|exe| exe.contains(&tool_lower))
                    .unwrap_or(false)
                || cmd_line_lower.contains(&tool_lower)
        });

        if !matches_tool {
            continue;
        }

        // Method 1: Check CWD (current working directory)
        if let Some(cwd) = process.cwd() {
            let cwd_str = cwd.to_string_lossy().to_string();
            if cwd_str == normalized_path || cwd_str == project_path {
                println!(
                    "[launcher] ✅ MATCHED by CWD: PID={}, cwd={}",
                    pid_u32, cwd_str
                );
                return Some(pid_u32);
            }
        }

        // Method 2: Check command line arguments (fallback)
        if cmd_line_joined.contains(&normalized_path) || cmd_line_joined.contains(project_path) {
            println!(
                "[launcher] ✅ MATCHED by cmd: PID={}, cmd={}",
                pid_u32, cmd_line_joined
            );
            return Some(pid_u32);
        }

        println!("[launcher] ❌ NO PATH MATCH for PID={}", pid_u32);
    }

    println!("[launcher] No matching CLI process found");
    None
}
