import { ClipboardListIcon, LogOutIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { getCategoryDeleteErrorMessage } from '@/features/categories/api/categoryErrors'
import { CategoryForm } from '@/features/categories/components/CategoryForm'
import { CategoryList } from '@/features/categories/components/CategoryList'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { useCategoryMutations } from '@/features/categories/hooks/useCategoryMutations'
import type { Category } from '@/features/categories/types/categoryTypes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Spinner } from '@/shared/components/ui/spinner'
import { useToast } from '@/shared/hooks/useToast'
import { cn } from '@/shared/lib/utils'

const TOAST_DURATION = 10_000

export function CategoriesPage() {
  const { add: showToast } = useToast()
  const { logout } = useAuth()
  const categoriesQuery = useCategories()
  const { deleteCategory } = useCategoryMutations()
  const [formCategory, setFormCategory] = useState<Category | null | undefined>(
    undefined,
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id)
      setCategoryToDelete(null)
      showToast({
        type: 'error',
        title: 'Categoria removida',
        description: 'Categoria removida com sucesso!',
        timeout: TOAST_DURATION,
      })
    } catch (error: unknown) {
      setCategoryToDelete(null)
      showToast({
        type: 'error',
        title: 'Não foi possível remover a categoria',
        description: getCategoryDeleteErrorMessage(error),
        timeout: TOAST_DURATION,
      })
    }
  }

  const finishForm = (action: 'created' | 'updated') => {
    setFormCategory(undefined)
    showToast({
      type: action === 'created' ? 'success' : 'info',
      title: action === 'created' ? 'Categoria criada' : 'Categoria atualizada',
      description:
        action === 'created'
          ? 'Categoria criada com sucesso!'
          : 'Categoria atualizada com sucesso!',
      timeout: TOAST_DURATION,
    })
  }

  return (
    <main className="min-h-svh px-4 pt-4 pb-24 sm:px-6 md:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium md:text-sm">
              TaskBoard
            </p>
            <h1
              id="categories-heading"
              className="text-xl font-semibold tracking-tight whitespace-nowrap md:text-2xl"
            >
              Minhas categorias
            </h1>
          </div>
          <nav
            className="flex shrink-0 items-center gap-1 md:gap-2"
            aria-label="Navegação principal"
          >
            <Link
              to="/dashboard"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'md:hidden',
              )}
              aria-label="Abrir tarefas"
              title="Tarefas"
            >
              <ClipboardListIcon />
            </Link>
            <Link
              to="/dashboard"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'hidden md:inline-flex',
              )}
            >
              <ClipboardListIcon data-icon="inline-start" />
              Tarefas
            </Link>
            <Button
              type="button"
              className="text-destructive md:hidden"
              variant="ghost"
              size="icon"
              aria-label="Sair da conta"
              title="Sair"
              onClick={logout}
            >
              <LogOutIcon />
            </Button>
            <Button
              type="button"
              className="text-destructive hidden md:inline-flex"
              variant="ghost"
              onClick={logout}
            >
              <LogOutIcon data-icon="inline-start" />
              Sair
            </Button>
          </nav>
        </header>

        <section
          className="flex flex-col gap-6"
          aria-labelledby="categories-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Organize as tarefas em grupos fáceis de encontrar.
            </p>
            <Button
              type="button"
              className="hidden shrink-0 md:inline-flex"
              onClick={() => setFormCategory(null)}
            >
              <PlusIcon data-icon="inline-start" /> Nova categoria
            </Button>
          </div>

          <CategoryList
            categories={categoriesQuery.data}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            onRetry={() => void categoriesQuery.refetch()}
            onCreate={() => setFormCategory(null)}
            onEdit={setFormCategory}
            onDelete={setCategoryToDelete}
          />
        </section>
      </div>

      <Button
        type="button"
        size="icon"
        className="fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-xl md:hidden"
        aria-label="Criar nova categoria"
        title="Nova categoria"
        onClick={() => setFormCategory(null)}
      >
        <PlusIcon />
      </Button>

      <Dialog
        open={formCategory !== undefined}
        onOpenChange={(open) => !open && setFormCategory(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formCategory ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
            <DialogDescription>
              {formCategory
                ? 'Atualize o nome da categoria selecionada.'
                : 'Informe um nome para organizar suas tarefas.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key={formCategory?.id ?? 'new'}
            category={formCategory ?? undefined}
            onCancel={() => setFormCategory(undefined)}
            onSuccess={finishForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              “{categoryToDelete?.name}” será removida. As tarefas não serão
              excluídas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={deleteCategory.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteCategory.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {deleteCategory.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
