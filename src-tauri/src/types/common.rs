use serde::{Deserialize, Serialize};

/// Tool configuration for launching and window management
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolConfig {
    pub command: String,      // Command to execute (e.g., "code", "cursor")
    pub display_name: String, // Display name for window detection (e.g., "Visual Studio Code", "Cursor")
    pub process_name: String, // Process name for system checks (e.g., "Code", "Cursor")
}

/// IDE/CLI launch result
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CliLaunchResult {
    pub pid: u32,
    pub session_id: String,
    pub process_start_time: i64, // Unix timestamp (seconds)
}

/// Session tracked by process monitor
#[derive(Clone, Debug)]
pub struct MonitoredSession {
    pub session_id: String,
    pub pid: u32,
    pub start_time: i64,
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
    pub session_id: String,
    pub pid: u32,
    pub cpu_usage: f32,
    pub memory_usage: u64,
}

/// Process status changed event
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatusChangedEvent {
    pub session_id: String,
    pub new_status: String, // 'running' | 'completed' | 'failed' | 'closed'
    pub close_reason: Option<String>, // 'manual' | 'completed' | 'crashed' | 'killed'
}
