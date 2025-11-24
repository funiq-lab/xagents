use crate::types::common::ToolConfig;
use std::process::Command;

/// Check if window exists for given application and project
#[tauri::command]
pub fn check_window_exists(tool_config: ToolConfig, project_path: String) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        check_window_exists_macos(&tool_config, &project_path)
    }

    #[cfg(target_os = "windows")]
    {
        check_window_exists_windows(&tool_config, &project_path)
    }

    #[cfg(target_os = "linux")]
    {
        check_window_exists_linux(&tool_config, &project_path)
    }
}

/// Focus on existing window for given application
#[tauri::command]
pub fn focus_window(tool_config: ToolConfig, project_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        focus_window_macos(&tool_config, &project_path)
    }

    #[cfg(target_os = "windows")]
    {
        focus_window_windows(&tool_config, &project_path)
    }

    #[cfg(target_os = "linux")]
    {
        focus_window_linux(&tool_config, &project_path)
    }
}

// ============ macOS Implementation ============

#[cfg(target_os = "macos")]
fn check_window_exists_macos(tool_config: &ToolConfig, project_path: &str) -> Result<bool, String> {
    let app_name = &tool_config.display_name;

    let script = format!(
        r#"
        tell application "System Events"
            if exists (processes whose name is "{}") then
                tell process "{}"
                    set windowList to name of every window
                    repeat with windowName in windowList
                        if windowName contains "{}" then
                            return true
                        end if
                    end repeat
                end tell
            end if
            return false
        end tell
        "#,
        app_name, app_name, project_path
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout);
    Ok(result.trim() == "true")
}

#[cfg(target_os = "macos")]
fn focus_window_macos(tool_config: &ToolConfig, _project_path: &str) -> Result<(), String> {
    let app_name = &tool_config.display_name;

    let script = format!(
        r#"
        tell application "{}" to activate
        "#,
        app_name
    );

    Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .spawn()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    Ok(())
}

// ============ Windows Implementation ============

#[cfg(target_os = "windows")]
fn check_window_exists_windows(tool_config: &ToolConfig, _project_path: &str) -> Result<bool, String> {
    // Get all windows and check for matching process
    let output = Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {}.exe", tool_config.process_name)])
        .output()
        .map_err(|e| format!("Failed to execute tasklist: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout);

    // Check if the process is running
    // This is a simplified implementation - for full functionality, would need Win32 API
    Ok(result.contains(&tool_config.process_name) && result.lines().count() > 3)
}

#[cfg(target_os = "windows")]
fn focus_window_windows(tool_config: &ToolConfig, _project_path: &str) -> Result<(), String> {
    // Use PowerShell to focus window by process name
    let script = format!(
        r#"$proc = Get-Process -Name '{}' -ErrorAction SilentlyContinue; if ($proc) {{ Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id) }}"#,
        tool_config.process_name
    );

    Command::new("powershell")
        .args(["-Command", &script])
        .spawn()
        .map_err(|e| format!("Failed to focus window: {}", e))?;

    Ok(())
}

// ============ Linux Implementation ============

#[cfg(target_os = "linux")]
fn check_window_exists_linux(tool_config: &ToolConfig, project_path: &str) -> Result<bool, String> {
    // Try wmctrl first (most common)
    let wmctrl_result = Command::new("wmctrl")
        .args(["-l", "-x"])
        .output();

    if let Ok(output) = wmctrl_result {
        let result = String::from_utf8_lossy(&output.stdout);
        // Check if any window contains both process name and project path
        return Ok(result.lines().any(|line| {
            line.to_lowercase().contains(&tool_config.process_name.to_lowercase())
                && line.contains(project_path)
        }));
    }

    // Fallback to xdotool
    let xdotool_result = Command::new("xdotool")
        .args(["search", "--name", project_path])
        .output();

    if let Ok(output) = xdotool_result {
        return Ok(!output.stdout.is_empty());
    }

    // If neither tool is available, return false
    Ok(false)
}

#[cfg(target_os = "linux")]
fn focus_window_linux(_tool_config: &ToolConfig, project_path: &str) -> Result<(), String> {
    // Try wmctrl first
    let wmctrl_result = Command::new("wmctrl")
        .args(["-a", project_path])
        .spawn();

    if wmctrl_result.is_ok() {
        return Ok(());
    }

    // Fallback to xdotool
    let xdotool_result = Command::new("xdotool")
        .args(["search", "--name", project_path, "windowactivate"])
        .spawn();

    xdotool_result
        .map(|_| ())
        .map_err(|e| format!("Failed to focus window: {}. Please install wmctrl or xdotool", e))
}


