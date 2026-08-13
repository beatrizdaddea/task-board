import { Trash2Icon } from 'lucide-react'

import type {
  SharePermission,
  TaskShare,
} from '@/features/sharing/types/shareTypes'
import { SHARE_PERMISSION_OPTIONS } from '@/features/sharing/types/shareTypes'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Spinner } from '@/shared/components/ui/spinner'

type ShareListItemProps = {
  share: TaskShare
  canManage: boolean
  isUpdating: boolean
  isDeleting: boolean
  onPermissionChange: (share: TaskShare, permission: SharePermission) => void
  onRemove: (share: TaskShare) => void
}

export function ShareListItem(props: ShareListItemProps) {
  const permissionLabel =
    SHARE_PERMISSION_OPTIONS.find(
      (option) => option.value === props.share.permission,
    )?.label ?? props.share.permission

  return (
    <li
      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid="share-list-item"
    >
      <div className="min-w-0">
        <p className="truncate font-medium" data-testid="share-user-email">
          {props.share.user_email}
        </p>
        {!props.canManage ? (
          <Badge variant="secondary" className="mt-1">
            {permissionLabel}
          </Badge>
        ) : null}
      </div>

      {props.canManage ? (
        <div className="flex items-center gap-2">
          <Select
            items={SHARE_PERMISSION_OPTIONS}
            value={props.share.permission}
            disabled={props.isUpdating || props.isDeleting}
            onValueChange={(value) => {
              if (value !== null && value !== props.share.permission) {
                props.onPermissionChange(props.share, value)
              }
            }}
          >
            <SelectTrigger
              className="w-28"
              aria-label={`Permissão de ${props.share.user_email}`}
            >
              <SelectValue>
                {(value: string | null) =>
                  SHARE_PERMISSION_OPTIONS.find(
                    (option) => option.value === value,
                  )?.label ?? 'Permissão'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SHARE_PERMISSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={props.isUpdating || props.isDeleting}
            aria-label={`Remover compartilhamento de ${props.share.user_email}`}
            onClick={() => props.onRemove(props.share)}
          >
            {props.isDeleting ? <Spinner /> : <Trash2Icon />}
          </Button>
        </div>
      ) : null}
    </li>
  )
}
