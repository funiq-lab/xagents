use serde::{Deserialize, Serialize};

/// Tool configuration for launching
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolConfig {
    pub id: String,            // Tool ID (e.g., "vscode", "cursor", "terminal")
    #[serde(rename = "type")]
    pub tool_type: String,     // Tool type: "ide" or "cli"
    pub command: String,       // Command to execute or app name for AppleScript
    pub display_name: String,  // Display name for UI
    pub launch_method: String, // Launch method: "command" or "applescript"
}

/// IDE/CLI launch result
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CliLaunchResult {
    pub start_time: i64, // Unix timestamp (seconds)
    pub pid: Option<u32>, // Window PID for supported IDEs (vscode/cursor)
    pub is_existing_window: bool, // True if focused existing window, false if new launch
}

/// Process status information
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatus {
    pub is_alive: bool,
    pub cpu_usage: f32,
    pub memory_usage: u64, // MB
    pub name: String,
}

/// Resource update event
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ResourceUpdateEvent {
    pub pid: u32,
    pub cpu_usage: f32,
    pub memory_usage: u64,
}

/// Process status changed event
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatusChangedEvent {
    pub pid: u32,
    pub new_status: String, // 'running' | 'completed' | 'failed' | 'closed'
    pub close_reason: Option<String>, // 'manual' | 'completed' | 'crashed' | 'killed'
}
