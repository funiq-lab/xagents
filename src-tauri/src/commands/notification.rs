use tauri_plugin_notification::NotificationExt;

/// Send system notification
#[tauri::command]
pub fn send_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
    notification_type: String,
) -> Result<(), String> {
    // Build notification with optional icon based on type
    let mut builder = app.notification().builder();

    builder = builder.title(title).body(body);

    // Add icon based on notification type (if supported by platform)
    builder = match notification_type.as_str() {
        "success" => builder.icon("success"),
        "error" => builder.icon("error"),
        "warning" => builder.icon("warning"),
        "info" => builder.icon("info"),
        _ => builder,
    };

    // Show the notification
    builder
        .show()
        .map_err(|e| format!("Failed to send notification: {}", e))?;

    Ok(())
}
