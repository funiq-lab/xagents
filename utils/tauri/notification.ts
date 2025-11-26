import { invoke } from '@tauri-apps/api/core'

/**
 * send notification
 */
export async function sendNotification(
  title: string,
  body: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
): Promise<void> {
  return await invoke<void>('send_notification', {
    title,
    body,
    notificationType: type,
  })
}
