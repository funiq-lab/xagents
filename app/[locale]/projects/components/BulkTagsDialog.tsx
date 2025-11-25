'use client'

import type { Tag } from '@/plugins/db'
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

interface BulkTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  count: number
  onSubmit: (tagIds: number[]) => Promise<void>
}

export function BulkTagsDialog({
  open,
  onOpenChange,
  tags,
  count,
  onSubmit,
}: BulkTagsDialogProps) {
  const { t } = useTranslation(['global', 'projects'])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedTags([])
      setIsSubmitting(false)
    }
  }, [open])

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId))
        return prev.filter(id => id !== tagId)
      return [...prev, tagId]
    })
  }

  const handleSubmit = async () => {
    if (isSubmitting)
      return
    setIsSubmitting(true)
    try {
      await onSubmit(selectedTags)
      onOpenChange(false)
    }
    catch (error) {
      console.error('[BulkTagsDialog] Failed to apply tags:', error)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.tip.bulk_tags_title')}</DialogTitle>
          <DialogDescription>
            {t('projects.tip.bulk_tags_description', { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {tags.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  {t('projects.tip.bulk_tags_empty')}
                </p>
              )
            : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {tags.map(tag => (
                    <Button
                      key={tag.id}
                      type="button"
                      size="sm"
                      variant={selectedTags.includes(tag.id!) ? 'default' : 'outline'}
                      style={selectedTags.includes(tag.id!)
                        ? {
                            backgroundColor: `${tag.color}`,
                            color: '#fff',
                          }
                        : undefined}
                      onClick={() => toggleTag(tag.id!)}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              )}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={selectedTags.length === 0}
              onClick={() => setSelectedTags([])}
            >
              {t('projects.tip.bulk_tags_clear')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {selectedTags.length > 0
                ? t('projects.tip.tag_selected_count', { count: selectedTags.length })
                : t('projects.tip.bulk_tags_placeholder')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('global.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || tags.length === 0}>
            {isSubmitting ? t('global.loading') : t('projects.tip.bulk_apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
