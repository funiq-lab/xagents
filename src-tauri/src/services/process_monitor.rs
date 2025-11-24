use crate::types::common::{MonitoredSession, ProcessStatusChangedEvent, ResourceUpdateEvent};
use std::sync::Arc;
use std::time::Duration;
use sysinfo::System;
use tauri::{async_runtime, Emitter};
use tokio::sync::RwLock;

/// ProcessMonitor: watches monitored processes and emits events on status changes and resource usage.
pub struct ProcessMonitor {
    sessions: Arc<RwLock<Vec<MonitoredSession>>>,
    app_handle: tauri::AppHandle,
}

impl ProcessMonitor {
    /// Creates a new ProcessMonitor instance.
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(Vec::new())),
            app_handle,
        }
    }

    /// Add a new session to monitor
    pub async fn add_session(&self, session_id: String, pid: u32, start_time: i64) {
        let mut sessions = self.sessions.write().await;
        sessions.push(MonitoredSession {
            session_id,
            pid,
            start_time,
        });
    }

    /// Remove a monitored session
    pub async fn remove_session(&self, session_id: &str) {
        let mut sessions = self.sessions.write().await;
        sessions.retain(|s| s.session_id != session_id);
    }

    /// Starts the monitoring loop
    pub fn start(&self) {
        let sessions = Arc::clone(&self.sessions);
        let app_handle = self.app_handle.clone();

        async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));

            // Create and maintain a System instance for accurate CPU usage calculation
            let mut sys = System::new_all();

            loop {
                interval.tick().await;

                // Take a snapshot of the sessions
                let sessions_snapshot = sessions.read().await.clone();

                // Refresh process information (maintain the same System instance)
                sys.refresh_processes();

                // Check the status of each monitored session
                for session in &sessions_snapshot {
                    let pid = sysinfo::Pid::from_u32(session.pid);

                    if let Some(process) = sys.process(pid) {
                        let actual_start_time = process.start_time() as i64;

                        // Verify the start time to avoid PID reuse issues
                        if (actual_start_time - session.start_time).abs() <= 5 {
                            // Process is alive, emit resource update
                            let _ = app_handle.emit(
                                "resource-update",
                                ResourceUpdateEvent {
                                    session_id: session.session_id.clone(),
                                    pid: session.pid,
                                    cpu_usage: process.cpu_usage(),
                                    memory_usage: process.memory() / 1024 / 1024,
                                },
                            );
                        } else {
                            // PID was reused, mark as closed
                            emit_process_closed(&app_handle, &session.session_id, "killed");
                            remove_from_monitor(&sessions, &session.session_id).await;
                        }
                    } else {
                        // Process does not exist, mark as closed
                        emit_process_closed(&app_handle, &session.session_id, "manual");
                        remove_from_monitor(&sessions, &session.session_id).await;
                    }
                }
            }
        });
    }
}

/// Emit process closed event
fn emit_process_closed(app_handle: &tauri::AppHandle, session_id: &str, close_reason: &str) {
    let _ = app_handle.emit(
        "process-status-changed",
        ProcessStatusChangedEvent {
            session_id: session_id.to_string(),
            new_status: "closed".to_string(),
            close_reason: Some(close_reason.to_string()),
        },
    );
}

/// Remove session from monitor
async fn remove_from_monitor(sessions: &Arc<RwLock<Vec<MonitoredSession>>>, session_id: &str) {
    let mut sessions = sessions.write().await;
    sessions.retain(|s| s.session_id != session_id);
}
