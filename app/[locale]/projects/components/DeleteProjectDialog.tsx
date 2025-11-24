'use client'

import type { Project } from '../../db'
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

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onConfirm: () => Promise<void>
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  onConfirm,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation(['global', 'projects'])
  if (!project)
    return null

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('projects.tip.delete_title')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {t('projects.tip.delete_description', { name: project.name })}
            </p>
            <p className="text-sm">
              {t('projects.tip.delete_note')}
            </p>
            <p className="text-sm text-destructive font-medium">
              {t('projects.tip.warning')}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
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
