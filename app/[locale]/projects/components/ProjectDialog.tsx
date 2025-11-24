'use client'

import type { Group, Project, Tag } from '../../db'
import { zodResolver } from '@hookform/resolvers/zod'
import { FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  groups: Group[]
  tags: Tag[]
  onSave: (data: {
    name: string
    description?: string
    path: string
    groupId?: number
    tagIds: number[]
  }) => Promise<void>
}

const formSchema = z.object({
  name: z.string().trim().min(1, 'projects.tip.name_required'),
  description: z
    .string()
    .max(1000, 'projects.tip.description_max')
    .optional(),
  path: z.string().trim().min(1, 'projects.tip.path_required'),
  groupId: z.number().int().positive().optional(),
  tagIds: z.array(z.number().int()).default([]),
})

type ProjectFormValues = z.infer<typeof formSchema>

const DEFAULT_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  path: '',
  groupId: undefined,
  tagIds: [],
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  groups,
  tags,
  onSave,
}: ProjectDialogProps) {
  const isEditMode = !!project

  const [isSaving, setIsSaving] = useState(false)
  const { t } = useTranslation(['global', 'projects'])

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? '',
        path: project.path,
        groupId: project.groupId,
        tagIds: project.tagIds ?? [],
      })
    }
    else {
      form.reset(DEFAULT_VALUES)
    }
  }, [project, open, form])

  const tagIds = form.watch('tagIds') ?? []

  const handleSelectFolder = async () => {
    try {
      toast.info(t('projects.create_project'), {
        description: t('projects.tip.folder_description'),
      })
    }
    catch (error) {
      console.error('Select folder failed:', error)
      toast.error(t('projects.tip.folder_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const toggleTag = (tagId: number) => {
    const current = form.getValues('tagIds') ?? []
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    form.setValue('tagIds', next, { shouldDirty: true })
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true)
    try {
      await onSave({
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : undefined,
        path: values.path.trim(),
        groupId: values.groupId,
        tagIds: values.tagIds,
      })
      onOpenChange(false)
    }
    catch (error) {
      console.error('Save project failed:', error)
      toast.error(t('projects.tip.save_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
    finally {
      setIsSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('projects.edit_project') : t('projects.create_project')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('projects.tip.edit_project')
              : t('projects.tip.create_project_tip')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projects.project_name')}
                    {' '}
                    *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('projects.project_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.project_description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('projects.project_description_placeholder')}
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projects.project_path')}
                    {' '}
                    *
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder={t('projects.project_path_placeholder')}
                        className="flex-1"
                        {...field}
                      />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={handleSelectFolder}>
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.project_group')}</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : 'none'}
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? undefined : Number(value))
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('projects.project_group_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('projects.no_group')}</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id!.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t('projects.project_tags')}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={tagIds.includes(tag.id!) ? 'default' : 'outline'}
                    className="cursor-pointer gap-1"
                    style={
                      tagIds.includes(tag.id!)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : { color: tag.color, borderColor: tag.color }
                    }
                    onClick={() => toggleTag(tag.id!)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('global.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isEditMode
                  ? t('global.save')
                  : t('global.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
