'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProjectStore } from '../../stores'

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
  onConfirm: () => Promise<void>
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  onConfirm,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation(['global', 'projects'])
  const { projects } = useProjectStore()

  const project = useMemo(
    () => projects.find(item => item.id === projectId),
    [projects, projectId],
  )

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  // Prevent hydration mismatch by stabilizing the description text
  const description = project?.name
    ? t('projects.tip.delete_description', { name: project.name })
    : ''

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('projects.tip.delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <div>
            {description}
          </div>
          <div className="text-sm">
            {t('projects.tip.delete_note')}
          </div>
          <div className="text-sm text-destructive font-medium">
            {t('projects.tip.warning')}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('global.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t('global.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
