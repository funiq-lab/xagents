'use client'

import type { Group, Project, Tag } from '../../db'
import { zodResolver } from '@hookform/resolvers/zod'
import { FolderOpen, Plus, X } from 'lucide-react'
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
  onCreateGroup?: (name: string, color: string) => Promise<number>
  onCreateTag?: (name: string, color: string) => Promise<number>
  onDeleteGroup?: (id: number) => Promise<void>
  onDeleteTag?: (id: number) => Promise<void>
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

// Generate a random color
function getRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]!
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  groups,
  tags,
  onSave,
  onCreateGroup,
  onCreateTag,
  onDeleteGroup,
  onDeleteTag,
}: ProjectDialogProps) {
  const isEditMode = !!project

  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !onCreateGroup)
      return

    try {
      const newId = await onCreateGroup(newGroupName.trim(), getRandomColor())
      form.setValue('groupId', newId)
      setNewGroupName('')
      setIsCreatingGroup(false)
      toast.success(t('projects.tip.group_created'))
    }
    catch (error) {
      console.error('Create group failed:', error)
      toast.error(t('projects.tip.group_create_failed'))
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag)
      return

    try {
      const newId = await onCreateTag(newTagName.trim(), getRandomColor())
      const current = form.getValues('tagIds') ?? []
      form.setValue('tagIds', [...current, newId])
      setNewTagName('')
      setIsCreatingTag(false)
      toast.success(t('projects.tip.tag_created'))
    }
    catch (error) {
      console.error('Create tag failed:', error)
      toast.error(t('projects.tip.tag_create_failed'))
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (!onDeleteGroup)
      return

    try {
      await onDeleteGroup(groupId)
      // If current selected group is deleted, reset to undefined
      if (form.getValues('groupId') === groupId) {
        form.setValue('groupId', undefined)
      }
      toast.success(t('projects.tip.group_deleted'))
    }
    catch (error) {
      console.error('Delete group failed:', error)
      toast.error(t('projects.tip.group_delete_failed'))
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    if (!onDeleteTag)
      return

    try {
      await onDeleteTag(tagId)
      // Remove from current selected tags
      const current = form.getValues('tagIds') ?? []
      form.setValue('tagIds', current.filter(id => id !== tagId))
      toast.success(t('projects.tip.tag_deleted'))
    }
    catch (error) {
      console.error('Delete tag failed:', error)
      toast.error(t('projects.tip.tag_delete_failed'))
    }
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
                  {isCreatingGroup
                    ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('projects.tip.group_name_placeholder')}
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateGroup()
                              }
                              else if (e.key === 'Escape') {
                                setIsCreatingGroup(false)
                                setNewGroupName('')
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="default"
                            onClick={handleCreateGroup}
                            disabled={!newGroupName.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setIsCreatingGroup(false)
                              setNewGroupName('')
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    : (
                        <div className="flex gap-2">
                          <Select
                            value={field.value ? field.value.toString() : 'none'}
                            onValueChange={(value) => {
                              field.onChange(value === 'none' ? undefined : Number(value))
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={t('projects.project_group_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t('projects.no_group')}</SelectItem>
                              {groups.map(group => (
                                <SelectItem key={group.id} value={group.id!.toString()}>
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                                      {group.name}
                                    </div>
                                    {onDeleteGroup && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-50 hover:opacity-100"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteGroup(group.id!)
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {onCreateGroup && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsCreatingGroup(true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t('projects.project_tags')}</FormLabel>
              {isCreatingTag
                ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('projects.tip.tag_name_placeholder')}
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateTag()
                          }
                          else if (e.key === 'Escape') {
                            setIsCreatingTag(false)
                            setNewTagName('')
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="default"
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsCreatingTag(false)
                          setNewTagName('')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant={tagIds.includes(tag.id!) ? 'default' : 'outline'}
                            className="cursor-pointer gap-1 group"
                            style={
                              tagIds.includes(tag.id!)
                                ? { backgroundColor: tag.color, borderColor: tag.color }
                                : { color: tag.color, borderColor: tag.color }
                            }
                          >
                            <span onClick={() => toggleTag(tag.id!)}>
                              {tag.name}
                            </span>
                            {onDeleteTag && (
                              <X
                                className="h-3 w-3 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTag(tag.id!)
                                }}
                              />
                            )}
                          </Badge>
                        ))}
                        {onCreateTag && (
                          <Badge
                            variant="outline"
                            className="cursor-pointer gap-1"
                            onClick={() => setIsCreatingTag(true)}
                          >
                            <Plus className="h-3 w-3" />
                            {t('projects.tip.create_tag')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
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
