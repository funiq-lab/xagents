use std::fs;
use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryDialogOptions {
    pub title: Option<String>,
    pub default_path: Option<String>,
}

#[tauri::command]
pub async fn select_directory(
    app: AppHandle,
    options: Option<DirectoryDialogOptions>,
) -> Result<Option<String>, String> {
    let DirectoryDialogOptions {
        title,
        default_path,
    } = options.unwrap_or(DirectoryDialogOptions {
        title: None,
        default_path: None,
    });

    tauri::async_runtime::spawn_blocking(move || {
        let mut builder = app.dialog().file();

        if let Some(title) = title {
            builder = builder.set_title(&title);
        }

        if let Some(default_path) = default_path {
            builder = builder.set_directory(PathBuf::from(default_path));
        }

        Ok::<_, String>(builder.blocking_pick_folder().map(|path| path.to_string()))
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn list_subdirectories(root_path: String) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || -> Result<Vec<String>, String> {
        let mut directories: Vec<String> = Vec::new();
        let root: PathBuf = PathBuf::from(root_path);

        if !root.exists() || !root.is_dir() {
            return Err("Root path is not a directory".to_string());
        }

        for entry in fs::read_dir(root).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            if entry
                .file_type()
                .map_err(|error| error.to_string())?
                .is_dir()
            {
                directories.push(entry.path().to_string_lossy().to_string());
            }
        }

        Ok(directories)
    })
    .await
    .map_err(|error| error.to_string())?
}
