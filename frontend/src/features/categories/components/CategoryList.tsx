import { AlertCircleIcon, TagsIcon } from 'lucide-react'

import { CategoryItem } from '@/features/categories/components/CategoryItem'
import type { Category } from '@/features/categories/types/categoryTypes'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty'
import { Skeleton } from '@/shared/components/ui/skeleton'

type CategoryListProps = {
  categories?: Category[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCreate: () => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryList(props: CategoryListProps) {
  if (props.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Não foi possível carregar as categorias</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          Verifique sua conexão e tente novamente.
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onRetry}
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!props.categories?.length) {
    return (
      <Empty className="border py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TagsIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhuma categoria cadastrada</EmptyTitle>
          <EmptyDescription>
            Crie uma categoria para organizar suas tarefas.
          </EmptyDescription>
        </EmptyHeader>
        <Button type="button" onClick={props.onCreate}>
          Nova categoria
        </Button>
      </Empty>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {props.categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />
      ))}
    </div>
  )
}
