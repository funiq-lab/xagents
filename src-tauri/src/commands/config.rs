use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupResult {
    pub backup_path: String,
}

/// Get configuration file path
fn get_config_path(tool_type: &str) -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or("Unable to get user directory")?;

    let config_path = match tool_type {
        "claude" => home_dir.join(".claude").join("settings.json"),
        "codex_auth" => home_dir.join(".codex").join("auth.json"),
        "codex_config" => home_dir.join(".codex").join("config.toml"),
        "gemini" => home_dir.join(".gemini").join("settings.json"),
        _ => return Err(format!("Unsupported tool type: {}", tool_type)),
    };

    Ok(config_path)
}

/// Get backup file path
fn get_backup_path(config_path: &PathBuf) -> PathBuf {
    let filename = config_path
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_string();
    let backup_filename = format!("{}.backup.xagents", filename);
    config_path.with_file_name(backup_filename)
}

/// Backup configuration file
#[command]
pub async fn backup_config_file(tool_type: String) -> Result<BackupResult, String> {
    let config_path = get_config_path(&tool_type)?;

    // Return error if config file doesn't exist
    if !config_path.exists() {
        return Err(format!("Config file does not exist: {:?}", config_path));
    }

    // Get backup file path (use fixed suffix .backup.xagents)
    let backup_path = get_backup_path(&config_path);

    // Copy file for backup (will overwrite existing backup)
    fs::copy(&config_path, &backup_path).map_err(|e| format!("Failed to backup file: {}", e))?;

    Ok(BackupResult {
        backup_path: backup_path.to_string_lossy().to_string(),
    })
}

/// Apply configuration to file
#[command]
pub async fn apply_config_to_file(
    tool_type: String,
    content: String,
    auto_backup: bool,
) -> Result<Option<BackupResult>, String> {
    let config_path = get_config_path(&tool_type)?;

    // Backup first if auto_backup is enabled and file exists
    let backup_result = if auto_backup && config_path.exists() {
        Some(backup_config_file(tool_type.clone()).await?)
    } else {
        None
    };

    // Ensure config directory exists
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }

    // Write configuration file
    fs::write(&config_path, content).map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(backup_result)
}

/// Read configuration file
#[command]
pub async fn read_config_file(tool_type: String) -> Result<String, String> {
    let config_path = get_config_path(&tool_type)?;

    if !config_path.exists() {
        return Ok(String::new());
    }

    fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config file: {}", e))
}

/// Restore configuration file from backup
#[command]
pub async fn restore_config_from_backup(
    tool_type: String,
    backup_path: String,
) -> Result<(), String> {
    let config_path = get_config_path(&tool_type)?;
    let backup_file = PathBuf::from(backup_path);

    if !backup_file.exists() {
        return Err(format!("Backup file does not exist: {:?}", backup_file));
    }

    // Backup current config before restoring
    if config_path.exists() {
        let _ = backup_config_file(tool_type).await;
    }

    // Restore from backup
    fs::copy(&backup_file, &config_path).map_err(|e| format!("Failed to restore config file: {}", e))?;

    Ok(())
}

/// List all backup files
#[command]
pub async fn list_config_backups(tool_type: String) -> Result<Vec<String>, String> {
    let config_path = get_config_path(&tool_type)?;
    let backup_path = get_backup_path(&config_path);

    if backup_path.exists() {
        Ok(vec![backup_path.to_string_lossy().to_string()])
    } else {
        Ok(vec![])
    }
}
