'use client'

import type { Group } from '../../db'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BulkGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: Group[]
  count: number
  onSubmit: (groupId?: number) => Promise<void>
}

export function BulkGroupDialog({
  open,
  onOpenChange,
  groups,
  count,
  onSubmit,
}: BulkGroupDialogProps) {
  const { t } = useTranslation(['global', 'projects'])
  const [selectedGroup, setSelectedGroup] = useState<'none' | number>('none')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedGroup('none')
      setIsSubmitting(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (isSubmitting)
      return
    setIsSubmitting(true)
    try {
      await onSubmit(selectedGroup === 'none' ? undefined : Number(selectedGroup))
      onOpenChange(false)
    }
    catch (error) {
      console.error('[BulkGroupDialog] Failed to apply group:', error)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.tip.bulk_group_title')}</DialogTitle>
          <DialogDescription>
            {t('projects.tip.bulk_group_description', { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Select
            value={selectedGroup === 'none' ? 'none' : selectedGroup.toString()}
            onValueChange={(value) => {
              setSelectedGroup(value === 'none' ? 'none' : Number(value))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('projects.tip.bulk_group_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('projects.no_group')}</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id!.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                    {group.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('global.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('global.loading') : t('projects.tip.bulk_apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
