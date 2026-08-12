import { PencilIcon, TagIcon, Trash2Icon } from 'lucide-react'

import type { Category } from '@/features/categories/types/categoryTypes'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

type CategoryItemProps = {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryItem({
  category,
  onEdit,
  onDelete,
}: CategoryItemProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon />
          <span className="truncate">{category.name}</span>
        </CardTitle>
        <CardDescription>
          Criada em{' '}
          {new Intl.DateTimeFormat('pt-BR').format(
            new Date(category.created_at),
          )}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar categoria ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <PencilIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Excluir categoria ${category.name}`}
            onClick={() => onDelete(category)}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
