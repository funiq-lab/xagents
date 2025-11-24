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
    updateSessionInfo,
    closeSession,
    findSessionById,
    loadActiveSessions,
  } = useSessionStore()

  const { t } = useTranslation(['global'])

  useEffect(() => {
    const setupListeners = async () => {
      try {
        // 1. Listen for resource update events
        const unlistenResource = await listenResourceUpdate((event) => {
          console.info('[EventListeners] Resource update:', event)

          // Update resource data
          updateResource(event.sessionId, {
            pid: event.pid,
            cpuUsage: event.cpuUsage,
            memoryUsage: event.memoryUsage,
          })

          // Update session info
          const session = findSessionById(event.sessionId)
          if (session) {
            updateSessionInfo(session.id!, {
              cpuUsage: event.cpuUsage,
              memoryUsage: event.memoryUsage,
            })
          }
        })

        // 2. Listen for process status changed events
        const unlistenStatus = await listenProcessStatusChanged((event) => {
          console.info('[EventListeners] Process status changed:', event)

          const session = findSessionById(event.sessionId)
          if (!session) {
            console.error('[EventListeners] Session not found:', event.sessionId)
            return
          }

          // If the process is closed, update the session status
          if (event.newStatus === 'closed') {
            closeSession(session.id!, event.closeReason)

            // Show a toast notification
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
  }, [t, updateResource, updateSessionInfo, closeSession, findSessionById, loadActiveSessions])

  // This component does not render any content
  return null
}
