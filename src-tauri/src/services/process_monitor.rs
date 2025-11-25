use crate::types::common::{ProcessStatusChangedEvent, ResourceUpdateEvent};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use sysinfo::System;
use tauri::{async_runtime, Emitter};
use tokio::sync::RwLock;

/// ProcessMonitor: watches monitored processes and emits events on status changes and resource usage.
///
/// Simplified design:
/// - Only tracks PID (no start_time validation)
/// - Emits resource updates for alive processes
/// - Notifies frontend when PID disappears
/// - Frontend is responsible for session lifecycle management
pub struct ProcessMonitor {
    monitored_pids: Arc<RwLock<HashSet<u32>>>,
    app_handle: tauri::AppHandle,
}

impl ProcessMonitor {
    /// Creates a new ProcessMonitor instance.
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self {
            monitored_pids: Arc::new(RwLock::new(HashSet::new())),
            app_handle,
        }
    }

    /// Add a new PID to monitor
    pub async fn add_session(&self, pid: u32, _start_time: i64) {
        let mut pids = self.monitored_pids.write().await;

        if pids.contains(&pid) {
            println!("[ProcessMonitor] PID {} already being monitored", pid);
            return;
        }

        pids.insert(pid);
        println!("[ProcessMonitor] Started monitoring PID {}", pid);
    }

    /// Remove a PID from monitoring (called when frontend manually closes session)
    pub async fn remove_session(&self, pid: u32) {
        let mut pids = self.monitored_pids.write().await;
        if pids.remove(&pid) {
            println!("[ProcessMonitor] Stopped monitoring PID {}", pid);
        }
    }

    /// Starts the monitoring loop
    pub fn start(&self) {
        let monitored_pids = Arc::clone(&self.monitored_pids);
        let app_handle = self.app_handle.clone();

        async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(1));

            // Create and maintain a System instance for accurate CPU usage calculation
            let mut sys = System::new_all();

            loop {
                interval.tick().await;

                // Take a snapshot of monitored PIDs
                let pids_snapshot: Vec<u32> = monitored_pids.read().await.iter().copied().collect();

                // Refresh process information
                sys.refresh_processes();

                // Check each monitored PID
                for pid in pids_snapshot {
                    let sysinfo_pid = sysinfo::Pid::from_u32(pid);

                    if let Some(process) = sys.process(sysinfo_pid) {
                        // Process is alive, emit resource update
                        let _ = app_handle.emit(
                            "resource-update",
                            ResourceUpdateEvent {
                                pid,
                                cpu_usage: process.cpu_usage(),
                                memory_usage: process.memory() / 1024 / 1024,
                            },
                        );
                    } else {
                        // Process does not exist, notify frontend
                        println!("[ProcessMonitor] PID {} no longer exists", pid);
                        let _ = app_handle.emit(
                            "process-status-changed",
                            ProcessStatusChangedEvent {
                                pid,
                                new_status: "closed".to_string(),
                                close_reason: Some("process-exited".to_string()),
                            },
                        );

                        // Remove from monitoring
                        monitored_pids.write().await.remove(&pid);
                    }
                }
            }
        });
    }
}

