'use client'

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

interface BulkDeleteProjectsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: () => Promise<void>
}

export function BulkDeleteProjectsDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: BulkDeleteProjectsDialogProps) {
  const { t } = useTranslation(['global', 'projects'])

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  // Prevent hydration mismatch by stabilizing the description text
  const description = count > 0
    ? t('projects.tip.bulk_delete_description', { count })
    : ''

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('projects.tip.bulk_delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <div>
            {description}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('projects.tip.delete_note')}
          </div>
          <div className="text-sm text-destructive font-medium">
            {t('projects.tip.warning')}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('global.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
          >
            {t('projects.delete_selected')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
