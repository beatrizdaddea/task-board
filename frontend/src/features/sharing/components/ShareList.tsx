import { AlertCircleIcon, Share2Icon } from 'lucide-react'

import { ShareListItem } from '@/features/sharing/components/ShareListItem'
import type {
  SharePermission,
  TaskShare,
} from '@/features/sharing/types/shareTypes'
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

type ShareListProps = {
  shares?: TaskShare[]
  canManage: boolean
  isLoading: boolean
  isError: boolean
  updatingShareId?: number
  deletingShareId?: number
  onRetry: () => void
  onPermissionChange: (share: TaskShare, permission: SharePermission) => void
  onRemove: (share: TaskShare) => void
}

export function ShareList(props: ShareListProps) {
  if (props.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Não foi possível carregar os compartilhamentos</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          Tente novamente. Se o problema persistir, confirme se você ainda é o
          proprietário da tarefa.
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

  if (!props.shares?.length) {
    return (
      <Empty className="border py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Share2Icon />
          </EmptyMedia>
          <EmptyTitle>Nenhum compartilhamento ainda</EmptyTitle>
          <EmptyDescription>
            Compartilhe esta tarefa com outros usuários.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {props.shares.map((share) => (
        <ShareListItem
          key={share.id}
          share={share}
          canManage={props.canManage}
          isUpdating={props.updatingShareId === share.id}
          isDeleting={props.deletingShareId === share.id}
          onPermissionChange={props.onPermissionChange}
          onRemove={props.onRemove}
        />
      ))}
    </ul>
  )
}
