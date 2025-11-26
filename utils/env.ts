interface TauriWindow extends Window {
  __TAURI__?: unknown
}

/**
 * Detect if current runtime is the Tauri desktop app.
 */
export function isTauriEnvironment(): boolean {
  console.log('Checking Tauri environment:', typeof window !== 'undefined' && Boolean((window as TauriWindow).__TAURI__))
  return typeof window !== 'undefined' && Boolean((window as TauriWindow).__TAURI__)
}
