import { useState } from 'react'

import { ShareForm } from '@/features/sharing/components/ShareForm'
import { ShareList } from '@/features/sharing/components/ShareList'
import { useShareMutations } from '@/features/sharing/hooks/useShareMutations'
import { useShares } from '@/features/sharing/hooks/useShares'
import type {
  SharePermission,
  TaskShare,
} from '@/features/sharing/types/shareTypes'
import type { Task } from '@/features/tasks/types/taskTypes'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Spinner } from '@/shared/components/ui/spinner'
import { useToast } from '@/shared/hooks/useToast'

const TOAST_DURATION = 10_000

type ShareDialogProps = {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ task, open, onOpenChange }: ShareDialogProps) {
  const { add: showToast } = useToast()
  const sharesQuery = useShares(task.id)
  const { updateShare, deleteShare } = useShareMutations(task.id)
  const [shareToRemove, setShareToRemove] = useState<TaskShare | null>(null)
  const canManage = task.permissions.can_manage_shares

  const showError = (error: unknown) => {
    showToast({
      type: 'error',
      title: 'Não foi possível concluir a ação',
      description:
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.',
      timeout: TOAST_DURATION,
    })
  }

  const changePermission = async (
    share: TaskShare,
    permission: SharePermission,
  ) => {
    try {
      await updateShare.mutateAsync({ shareId: share.id, permission })
      showToast({
        type: 'info',
        title: 'Permissão atualizada',
        description: 'A permissão de compartilhamento foi atualizada.',
        timeout: TOAST_DURATION,
      })
    } catch (error: unknown) {
      showError(error)
    }
  }

  const confirmRemove = async () => {
    if (!shareToRemove) return
    try {
      await deleteShare.mutateAsync(shareToRemove.id)
      setShareToRemove(null)
      showToast({
        type: 'error',
        title: 'Compartilhamento removido',
        description: 'O acesso à tarefa foi removido com sucesso.',
        timeout: TOAST_DURATION,
      })
    } catch (error: unknown) {
      setShareToRemove(null)
      showError(error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl"
          data-testid="share-dialog"
        >
          <DialogHeader>
            <DialogTitle>Compartilhar “{task.title}”</DialogTitle>
            <DialogDescription>
              Convide usuários por e-mail e defina acesso de leitura ou edição.
            </DialogDescription>
          </DialogHeader>

          {canManage ? (
            <ShareForm
              taskId={task.id}
              onSuccess={() =>
                showToast({
                  type: 'share',
                  title: 'Tarefa compartilhada',
                  description: 'Tarefa compartilhada com sucesso!',
                  timeout: TOAST_DURATION,
                })
              }
            />
          ) : null}

          <section
            className="flex flex-col gap-3"
            aria-labelledby="shares-heading"
          >
            <div>
              <h3 id="shares-heading" className="font-medium">
                Pessoas com acesso
              </h3>
              <p className="text-muted-foreground text-sm">
                {canManage
                  ? 'Altere permissões ou remova acessos existentes.'
                  : 'Você pode consultar os acessos desta tarefa.'}
              </p>
            </div>
            <ShareList
              shares={sharesQuery.data}
              canManage={canManage}
              isLoading={sharesQuery.isLoading}
              isError={sharesQuery.isError}
              updatingShareId={
                updateShare.isPending
                  ? updateShare.variables?.shareId
                  : undefined
              }
              deletingShareId={
                deleteShare.isPending ? deleteShare.variables : undefined
              }
              onRetry={() => void sharesQuery.refetch()}
              onPermissionChange={(share, permission) =>
                void changePermission(share, permission)
              }
              onRemove={setShareToRemove}
            />
          </section>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(shareToRemove)}
        onOpenChange={(nextOpen) => !nextOpen && setShareToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover compartilhamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o acesso de{' '}
              {shareToRemove?.user_email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteShare.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={deleteShare.isPending}
              onClick={() => void confirmRemove()}
            >
              {deleteShare.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {deleteShare.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
