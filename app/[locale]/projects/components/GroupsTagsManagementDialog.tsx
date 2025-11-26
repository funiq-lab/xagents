'use client'

import type { Group, Tag } from '@/plugins/db'
import { Edit2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getRandomAccentColor } from '@/utils/colors'

interface GroupsTagsManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: Group[]
  tags: Tag[]
  onCreateGroup: (name: string, color: string) => Promise<number>
  onUpdateGroup: (id: number, updates: { name?: string, color?: string }) => Promise<void>
  onDeleteGroup: (id: number) => Promise<void>
  onCreateTag: (name: string, color: string) => Promise<number>
  onUpdateTag: (id: number, updates: { name?: string, color?: string }) => Promise<void>
  onDeleteTag: (id: number) => Promise<void>
}

export function GroupsTagsManagementDialog({
  open,
  onOpenChange,
  groups,
  tags,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: GroupsTagsManagementDialogProps) {
  const { t } = useTranslation(['global', 'projects'])
  const [activeTab, setActiveTab] = useState<'groups' | 'tags'>('groups')

  // Group state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  // Tag state
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editingTagName, setEditingTagName] = useState('')

  const handleCreateGroup = async () => {
    if (!newGroupName.trim())
      return

    try {
      await onCreateGroup(newGroupName.trim(), getRandomAccentColor())
      setNewGroupName('')
      setIsCreatingGroup(false)
      toast.success(t('projects.tip.group_created'))
    }
    catch (error) {
      console.error('Create group failed:', error)
      toast.error(t('projects.tip.group_create_failed'))
    }
  }

  const handleStartEditGroup = (group: Group) => {
    setEditingGroupId(group.id!)
    setEditingGroupName(group.name)
  }

  const handleSaveGroupEdit = async () => {
    if (!editingGroupId || !editingGroupName.trim())
      return

    try {
      await onUpdateGroup(editingGroupId, { name: editingGroupName.trim() })
      setEditingGroupId(null)
      setEditingGroupName('')
      toast.success(t('projects.tip.group_updated'))
    }
    catch (error) {
      console.error('Update group failed:', error)
      toast.error(t('projects.tip.group_update_failed'))
    }
  }

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null)
    setEditingGroupName('')
  }

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await onDeleteGroup(groupId)
      toast.success(t('projects.tip.group_deleted'))
    }
    catch (error) {
      console.error('Delete group failed:', error)
      toast.error(t('projects.tip.group_delete_failed'))
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim())
      return

    try {
      await onCreateTag(newTagName.trim(), getRandomAccentColor())
      setNewTagName('')
      setIsCreatingTag(false)
      toast.success(t('projects.tip.tag_created'))
    }
    catch (error) {
      console.error('Create tag failed:', error)
      toast.error(t('projects.tip.tag_create_failed'))
    }
  }

  const handleStartEditTag = (tag: Tag) => {
    setEditingTagId(tag.id!)
    setEditingTagName(tag.name)
  }

  const handleSaveTagEdit = async () => {
    if (!editingTagId || !editingTagName.trim())
      return

    try {
      await onUpdateTag(editingTagId, { name: editingTagName.trim() })
      setEditingTagId(null)
      setEditingTagName('')
      toast.success(t('projects.tip.tag_updated'))
    }
    catch (error) {
      console.error('Update tag failed:', error)
      toast.error(t('projects.tip.tag_update_failed'))
    }
  }

  const handleCancelTagEdit = () => {
    setEditingTagId(null)
    setEditingTagName('')
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      await onDeleteTag(tagId)
      toast.success(t('projects.tip.tag_deleted'))
    }
    catch (error) {
      console.error('Delete tag failed:', error)
      toast.error(t('projects.tip.tag_delete_failed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:w-[60vw] max-w-2xl h-[90vh]! flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('projects.manage_groups_tags')}</DialogTitle>
          <DialogDescription>
            {t('projects.tip.manage_groups_tags_description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'groups' | 'tags')} className="overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups">{t('projects.groups')}</TabsTrigger>
            <TabsTrigger value="tags">{t('projects.tags')}</TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="flex-1 flex flex-col space-y-4 mt-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('projects.all_groups')}
                {' '}
                (
                {groups.length}
                )
              </Label>
              {!isCreatingGroup && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreatingGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('projects.create_group')}
                </Button>
              )}
            </div>

            {isCreatingGroup && (
              <div className="flex gap-2 p-3 border rounded-md bg-muted/30">
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
                  size="icon"
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
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
            )}

            <div className="h-full space-y-2 flex-1 overflow-y-auto">
              {groups.length === 0
                ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('projects.tip.no_groups')}
                    </div>
                  )
                : groups.map(group => (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      {editingGroupId === group.id
                        ? (
                            <>
                              <Input
                                className="flex-1"
                                value={editingGroupName}
                                onChange={e => setEditingGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveGroupEdit()
                                  }
                                  else if (e.key === 'Escape') {
                                    handleCancelGroupEdit()
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveGroupEdit}
                                disabled={!editingGroupName.trim()}
                              >
                                {t('global.save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelGroupEdit}
                              >
                                {t('global.cancel')}
                              </Button>
                            </>
                          )
                        : (
                            <>
                              <span className="flex-1 font-medium">{group.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleStartEditGroup(group)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteGroup(group.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                    </div>
                  ))}
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="flex-1 flex flex-col space-y-4 mt-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('projects.all_tags')}
                {' '}
                (
                {tags.length}
                )
              </Label>
              {!isCreatingTag && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreatingTag(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('projects.tip.create_tag')}
                </Button>
              )}
            </div>

            {isCreatingTag && (
              <div className="flex gap-2 p-3 border rounded-md bg-muted/30">
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
                  size="icon"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
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
            )}

            <div className="h-full space-y-2 flex-1 overflow-y-auto">
              {tags.length === 0
                ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('projects.tip.no_tags')}
                    </div>
                  )
                : tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      {editingTagId === tag.id
                        ? (
                            <>
                              <Input
                                className="flex-1"
                                value={editingTagName}
                                onChange={e => setEditingTagName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveTagEdit()
                                  }
                                  else if (e.key === 'Escape') {
                                    handleCancelTagEdit()
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveTagEdit}
                                disabled={!editingTagName.trim()}
                              >
                                {t('global.save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelTagEdit}
                              >
                                {t('global.cancel')}
                              </Button>
                            </>
                          )
                        : (
                            <>
                              <Badge
                                className="flex-1"
                                style={{ backgroundColor: tag.color, borderColor: tag.color }}
                              >
                                {tag.name}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleStartEditTag(tag)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTag(tag.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                    </div>
                  ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
