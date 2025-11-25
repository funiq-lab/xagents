'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useSessionStore } from '@/app/[locale]/stores'
import {
  listenProcessStatusChanged,
  listenResourceUpdate,
} from '@/utils/tauri'

/**
 * Global event listener component
 * Listens to all events pushed by the Tauri backend and updates the state
 */
export function EventListeners() {
  const {
    updateResource,
    closeSession,
    findSessionByPid,
    loadActiveSessions,
  } = useSessionStore()

  const { t } = useTranslation(['global'])

  useEffect(() => {
    const setupListeners = async () => {
      try {
        // 1. Listen for resource update events
        const unlistenResource = await listenResourceUpdate((event) => {
          console.info('[EventListeners] Resource update:', event)

          // Update resource data in memory only (NOT in database)
          // Resource data is real-time and should not be persisted
          updateResource(event.pid, {
            cpuUsage: event.cpuUsage,
            memoryUsage: event.memoryUsage,
          })
        })

        // 2. Listen for process status changed events
        const unlistenStatus = await listenProcessStatusChanged((event) => {
          console.info('[EventListeners] Process status changed:', event)

          const session = findSessionByPid(event.pid)
          if (!session) {
            console.error('[EventListeners] Session not found for PID:', event.pid)
            return
          }

          // If the process is closed, close the session
          // Note: Use 'auto-timeout' to indicate process exited naturally
          // (not manually killed by user)
          if (event.newStatus === 'closed') {
            const closeReason = event.closeReason === 'process-exited' ? 'auto-timeout' : 'manual'

            closeSession(session.id!, closeReason).catch((error) => {
              console.error('[EventListeners] Failed to close session:', error)
            })

            // Show a toast notification only for non-natural exits
            if (event.closeReason !== 'process-exited') {
              const reasonText
                = event.closeReason === 'manual'
                  ? t('global.manually_closed')
                  : event.closeReason === 'crashed'
                    ? t('global.crashed')
                    : event.closeReason === 'killed'
                      ? t('global.killed')
                      : t('global.completed')

              toast.info(t('global.close'), {
                description: t('global.tip.process', {
                  name: session.toolName,
                  reason: reasonText,
                }),
              })
            }
            else {
              // Process exited naturally, just log it
              console.info(`[EventListeners] Process ${event.pid} (${session.toolName}) exited naturally`)
            }
          }
        })

        console.info('[EventListeners] All listeners setup successfully')

        // clear listeners function
        return () => {
          unlistenResource()
          unlistenStatus()
          console.info('[EventListeners] All listeners cleaned up')
        }
      }
      catch (error) {
        console.error('[EventListeners] Setup failed:', error)
        // in browser environment, Tauri API will fail, this is normal
        if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
          console.info('[EventListeners] Not in Tauri environment, skipping event listeners')
        }
      }
    }

    const cleanup = setupListeners()

    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [t, updateResource, closeSession, findSessionByPid, loadActiveSessions])

  // This component does not render any content
  return null
}
