'use client'

import type { Group, Tag } from '@/plugins/db'
import type { SortOption } from '@/types/project'
import { FolderOpen, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProjectHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortOption: SortOption
  onSortChange: (option: SortOption) => void
  groupFilter: 'all' | number
  onGroupFilterChange: (value: 'all' | number) => void
  tagFilter: 'all' | number
  onTagFilterChange: (value: 'all' | number) => void
  groups: Group[]
  tags: Tag[]
  onCreateProject: () => void
  onBulkImport: () => void
  isBulkImporting: boolean
  selectAllChecked: boolean
  selectAllDisabled: boolean
  onToggleSelectAll: () => void
}

export function ProjectHeader({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  groupFilter,
  onGroupFilterChange,
  tagFilter,
  onTagFilterChange,
  groups,
  tags,
  onCreateProject,
  onBulkImport,
  isBulkImporting,
  selectAllChecked,
  selectAllDisabled,
  onToggleSelectAll,
}: ProjectHeaderProps) {
  const { t } = useTranslation(['global', 'projects'])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('projects.tip.search_placeholder')}
            className="w-full pl-9"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Label
            htmlFor="projects-select-all"
            className={`flex shrink-0 items-center gap-2 text-sm text-muted-foreground select-none ${selectAllDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            title={t('projects.select_all') ?? undefined}
          >
            <Checkbox
              id="projects-select-all"
              className="border-muted-foreground/40"
              checked={selectAllChecked}
              onChange={() => {
                if (!selectAllDisabled)
                  onToggleSelectAll()
              }}
              disabled={selectAllDisabled}
            />
            <span>{t('projects.select_all')}</span>
          </Label>

          <Button onClick={onCreateProject}>
            <Plus className="w-4 h-4" />
            {t('projects.create_project')}
          </Button>
          <Button variant="outline" onClick={onBulkImport} disabled={isBulkImporting}>
            <FolderOpen className="w-4 h-4" />
            {t('projects.bulk_import')}
          </Button>
        </div>
      </div>

      <div className="flex items-center w-full gap-3">
        <Select value={sortOption} onValueChange={value => onSortChange(value as SortOption)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('global.sort_by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('global.newest')}</SelectItem>
            <SelectItem value="oldest">{t('global.oldest')}</SelectItem>
            <SelectItem value="name">{t('global.name')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={groupFilter === 'all' ? 'all' : groupFilter.toString()}
          onValueChange={(value) => {
            onGroupFilterChange(value === 'all' ? 'all' : Number(value))
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('projects.all_groups')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('projects.all_groups')}</SelectItem>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id!.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tagFilter === 'all' ? 'all' : tagFilter.toString()}
          onValueChange={(value) => {
            onTagFilterChange(value === 'all' ? 'all' : Number(value))
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('projects.all_tags')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('projects.all_tags')}</SelectItem>
            {tags.map(tag => (
              <SelectItem key={tag.id} value={tag.id!.toString()}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
