use std::process::Command;

/// Focus window by PID and tool type
///
/// This function attempts to bring a window to the foreground by its process ID.
/// The tool_type parameter specifies whether it's an IDE window or CLI terminal.
///
/// # Arguments
/// * `pid` - Process ID of the window to focus
/// * `tool_type` - Type of tool: "ide" for IDE windows, "cli" for CLI terminal windows
/// * `ide_id` - IDE identifier (e.g., "vscode", "cursor"), only used for IDE windows
/// * `project_path` - Project path, used for IDE windows to reopen in the same window
#[tauri::command]
pub async fn focus_window_by_pid(
    pid: u32,
    tool_type: String,
    ide_id: String,
    project_path: String,
) -> Result<(), String> {
    println!(
        "[window] Focusing {} window for PID: {} (IDE ID: {}, Path: {})",
        tool_type, pid, ide_id, project_path
    );

    if tool_type == "ide" {
        focus_ide_window(&ide_id, &project_path)
    } else {
        focus_cli_window(pid)
    }
}

// ============ Public API for window module ============

/// Focus IDE window by project path (cross-platform wrapper)
pub fn focus_ide_window_public(ide_id: &str, project_path: &str) -> Result<(), String> {
    focus_ide_window(ide_id, project_path)
}

/// Focus CLI window by PID (cross-platform wrapper)
pub fn focus_cli_window_public(pid: u32) -> Result<(), String> {
    focus_cli_window(pid)
}

/// Focus IDE window by running the IDE command with project path
///
/// The IDE application (VSCode/Cursor) handles window reuse automatically,
/// so we simply execute: `code <path>` or `cursor <path>`
#[cfg(target_os = "macos")]
fn focus_ide_window(ide_id: &str, project_path: &str) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[window] Focusing IDE window: {} with project path: {}",
        ide_id, project_path
    );

    let command = match ide_id {
        "vscode" | "code" => "code",
        "cursor" => "cursor",
        _ => return Err(format!("Unsupported IDE: {}", ide_id)),
    };

    let output = Command::new(command)
        .arg(project_path)
        .output()
        .map_err(|e| format!("Failed to execute {} command: {}", command, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Failed to focus IDE window via {} command: {}",
            command, stderr
        ));
    }

    println!(
        "[window] ✅ Successfully focused IDE window with {} command",
        command
    );
    Ok(())
}

#[cfg(target_os = "windows")]
fn focus_ide_window(ide_id: &str, project_path: &str) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[window] Focusing IDE window: {} with project path: {}",
        ide_id, project_path
    );

    let command = match ide_id {
        "vscode" | "code" => "code",
        "cursor" => "cursor",
        _ => return Err(format!("Unsupported IDE: {}", ide_id)),
    };

    let output = Command::new(command)
        .arg(project_path)
        .output()
        .map_err(|e| format!("Failed to execute {} command: {}", command, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Failed to focus IDE window via {} command: {}",
            command, stderr
        ));
    }

    println!(
        "[window] ✅ Successfully focused IDE window with {} command",
        command
    );
    Ok(())
}

#[cfg(target_os = "linux")]
fn focus_ide_window(ide_id: &str, project_path: &str) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[window] Focusing IDE window: {} with project path: {}",
        ide_id, project_path
    );

    let command = match ide_id {
        "vscode" | "code" => "code",
        "cursor" => "cursor",
        _ => return Err(format!("Unsupported IDE: {}", ide_id)),
    };

    let output = Command::new(command)
        .arg(project_path)
        .output()
        .map_err(|e| format!("Failed to execute {} command: {}", command, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Failed to focus IDE window via {} command: {}",
            command, stderr
        ));
    }

    println!(
        "[window] ✅ Successfully focused IDE window with {} command",
        command
    );
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn focus_ide_window(_ide_id: &str, _project_path: &str) -> Result<(), String> {
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

    println!("[window] Focusing CLI terminal window for PID: {}", pid);

    // Walk up the process tree using ps command to find the terminal application
    let (terminal_pid, terminal_name) = find_terminal_process_macos(pid)?;

    println!(
        "[window] ✅ Found terminal: {} (PID: {})",
        terminal_name, terminal_pid
    );

    println!(
        "[window] ✅ Found terminal: {} (PID: {})",
        terminal_name, terminal_pid
    );

    // Map terminal process/executable names to AppleScript application names
    // Based on BUILTIN_CLI_TOOLS configuration
    let app_name = if terminal_name.contains("iterm") || terminal_name.contains("iTerm") {
        "iTerm" // iTerm2
    } else if terminal_name.contains("terminal") || terminal_name.contains("Terminal") {
        "Terminal" // macOS Terminal
    } else if terminal_name.contains("warp") || terminal_name.contains("Warp") {
        "Warp" // Warp
    } else {
        // For unsupported terminals, try generic focus approach
        println!(
            "[window] ⚠️ Unsupported terminal '{}', trying generic focus",
            terminal_name
        );
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

        println!(
            "[window] ✅ Successfully focused terminal window with PID {}",
            terminal_pid
        );
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
        app_name, terminal_pid, app_name
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
        "[window] ✅ Successfully focused terminal window '{}' with PID {}",
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
            "[window] [{}] PID {} -> parent PID {}, command: {}",
            depth, current_pid, parent_pid, command
        );

        // Check if this is a supported terminal application
        // Strict matching: check if the command ends with the terminal name
        // Supported terminals: Terminal, iTerm, Warp
        let command_lower = command.to_lowercase();
        let is_terminal = command_lower.ends_with("terminal")      // /Applications/Utilities/Terminal.app/Contents/MacOS/Terminal
                       || command_lower.ends_with("iterm")         // /Applications/iTerm.app/Contents/MacOS/iTerm
                       || command_lower.ends_with("iterm2")        // Some versions may use iTerm2
                       || command_lower.ends_with("warp"); // /Applications/Warp.app/Contents/MacOS/Warp

        if is_terminal {
            println!("[window] ✅ Matched terminal: {}", command);
            return Ok((current_pid, command.to_string()));
        }

        // Move to parent process
        if parent_pid == 0 || parent_pid == 1 {
            break;
        }

        current_pid = parent_pid;
    }

    Err(
        "Could not find supported terminal application (Terminal/iTerm/Warp) in process tree"
            .to_string(),
    )
}

#[cfg(target_os = "windows")]
fn focus_cli_window(pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[window] Focusing CLI terminal window on Windows for PID {}",
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
        "[window] Successfully focused terminal window for PID {}",
        pid
    );
    Ok(())
}

#[cfg(target_os = "linux")]
fn focus_cli_window(pid: u32) -> Result<(), String> {
    use std::process::Command;

    println!(
        "[window] Focusing CLI terminal window on Linux for PID {}",
        pid
    );

    // Walk up the process tree using ps command to find the terminal application
    let (terminal_pid, _terminal_name) = find_terminal_process_linux(pid)?;

    println!("[window] ✅ Found terminal PID: {}", terminal_pid);

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
                        "[window] ✅ Successfully focused terminal window with PID {}",
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
            "[window] [{}] PID {} -> parent PID {}, command: {}",
            depth, current_pid, parent_pid, command
        );

        // Check if this is a supported terminal application
        // Strict matching: check if the command ends with gnome-terminal
        let command_lower = command.to_lowercase();
        let is_terminal = command_lower.ends_with("gnome-terminal");

        if is_terminal {
            println!("[window] ✅ Matched terminal: {}", command);
            return Ok((current_pid, command.to_string()));
        }

        // Move to parent process
        if parent_pid == 0 || parent_pid == 1 {
            break;
        }

        current_pid = parent_pid;
    }

    Err(
        "Could not find supported terminal application (GNOME Terminal) in process tree"
            .to_string(),
    )
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn focus_cli_window(_pid: u32) -> Result<(), String> {
    Err("CLI window focusing is not supported on this platform".to_string())
}
