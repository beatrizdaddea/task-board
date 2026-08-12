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
    <Card
      size="sm"
      className="h-full transition-shadow focus-within:shadow-md hover:shadow-md"
    >
      <CardHeader className="min-w-0">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <TagIcon />
          <span className="truncate" title={category.name}>
            {category.name}
          </span>
        </CardTitle>
        <CardDescription>
          Criada em{' '}
          {new Intl.DateTimeFormat('pt-BR').format(
            new Date(category.created_at),
          )}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar categoria ${category.name}`}
            title="Editar categoria"
            onClick={() => onEdit(category)}
          >
            <PencilIcon />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Excluir categoria ${category.name}`}
            title="Excluir categoria"
            onClick={() => onDelete(category)}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
