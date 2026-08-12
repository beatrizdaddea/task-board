import { FolderIcon, Layers3Icon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Category } from '@/features/categories/types/categoryTypes'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

type TaskCategoryNavProps = {
  categories: Category[]
  selectedCategory: string
  total?: number
  counts: Map<number, number | undefined>
  isLoading: boolean
  onCategoryChange: (category: string) => void
}

export function TaskCategoryNav({
  categories,
  selectedCategory,
  total,
  counts,
  isLoading,
  onCategoryChange,
}: TaskCategoryNavProps) {
  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center gap-2 overflow-hidden pb-2 lg:flex-col lg:items-stretch lg:pb-0">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-7 w-24 shrink-0 rounded-full lg:h-9 lg:w-full lg:rounded-lg"
          />
        ))}
      </div>
    )
  }

  return (
    <nav
      className="lg:[&::-webkit-scrollbar-thumb]:bg-border flex snap-x snap-mandatory [scrollbar-width:none] items-center gap-2 overflow-x-auto pb-2 whitespace-nowrap lg:max-h-64 lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--border)_transparent] lg:flex-col lg:items-stretch lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1 lg:pb-0 lg:whitespace-normal [&::-webkit-scrollbar]:hidden lg:[&::-webkit-scrollbar]:block lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-thumb]:rounded-full"
      aria-label="Filtrar por categoria"
    >
      <CategoryButton
        label="Todas"
        count={total}
        isSelected={selectedCategory === 'all'}
        icon={<Layers3Icon data-icon="inline-start" />}
        onClick={() => onCategoryChange('all')}
      />
      {categories.map((category) => (
        <CategoryButton
          key={category.id}
          label={category.name}
          count={counts.get(category.id)}
          isSelected={selectedCategory === String(category.id)}
          icon={<FolderIcon data-icon="inline-start" />}
          onClick={() => onCategoryChange(String(category.id))}
        />
      ))}
    </nav>
  )
}

type CategoryButtonProps = {
  label: string
  count?: number
  isSelected: boolean
  icon: ReactNode
  onClick: () => void
}

function CategoryButton({
  label,
  count,
  isSelected,
  icon,
  onClick,
}: CategoryButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? 'default' : 'ghost'}
      size="sm"
      className={cn(
        'shrink-0 snap-start rounded-full shadow-none transition-shadow hover:shadow-sm lg:w-full lg:justify-between lg:rounded-lg lg:px-3',
        !isSelected &&
          'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {icon}
        <span className="lg:text-left lg:whitespace-normal">{label}</span>
      </span>
      {count === undefined ? (
        <Skeleton className="size-4 shrink-0 rounded-full" />
      ) : (
        <Badge
          variant={isSelected ? 'secondary' : 'outline'}
          className={cn(
            'ml-1 h-4 min-w-4 rounded-full px-1 text-[10px] tabular-nums lg:ml-auto',
            isSelected &&
              'bg-primary-foreground/15 text-primary-foreground border-transparent',
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  )
}
