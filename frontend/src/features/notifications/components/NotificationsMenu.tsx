import { BellIcon, CheckCheckIcon, CheckIcon } from 'lucide-react'

import { useNotificationMutations } from '@/features/notifications/hooks/useNotificationMutations'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import type { Notification } from '@/features/notifications/types/notificationTypes'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Spinner } from '@/shared/components/ui/spinner'
import { cn } from '@/shared/lib/utils'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function NotificationItem({
  notification,
  onRead,
  isPending,
}: {
  notification: Notification
  onRead: (notificationId: number) => void
  isPending: boolean
}) {
  const isUnread = notification.read_at === null

  return (
    <DropdownMenuItem
      className={cn(
        'items-start gap-2 px-2 py-2.5',
        isUnread && 'bg-primary/5',
      )}
      disabled={!isUnread || isPending}
      onClick={() => onRead(notification.id)}
    >
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          isUnread ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1 whitespace-normal">
        <span className={cn('leading-snug', isUnread && 'font-medium')}>
          {notification.message}
        </span>
        <span className="text-muted-foreground text-xs">
          {dateFormatter.format(new Date(notification.created_at))}
          {notification.task ? ` · Tarefa #${notification.task}` : ''}
        </span>
      </span>
      {!isUnread ? (
        <CheckIcon className="text-muted-foreground mt-0.5" />
      ) : null}
    </DropdownMenuItem>
  )
}

export function NotificationsMenu() {
  const notificationsQuery = useNotifications()
  const { markAsRead, markAllAsRead } = useNotificationMutations()
  const notifications = notificationsQuery.data ?? []
  const unreadCount = notifications.filter(
    (notification) => notification.read_at === null,
  ).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notificações: ${unreadCount} não lidas`
                : 'Notificações'
            }
            title="Notificações"
            data-testid="notifications-trigger"
          />
        }
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <Badge
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
            aria-hidden="true"
            data-testid="notifications-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] p-1.5"
      >
        <div className="flex items-center justify-between gap-3 px-1.5 py-1">
          <DropdownMenuLabel className="text-foreground p-0 text-sm">
            Notificações
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={markAllAsRead.isPending}
              onClick={() => markAllAsRead.mutate()}
              data-testid="notifications-read-all"
            >
              {markAllAsRead.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <CheckCheckIcon data-icon="inline-start" />
              )}
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {notificationsQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 px-2 py-6 text-sm">
            <Spinner /> Carregando notificações...
          </div>
        ) : notificationsQuery.isError ? (
          <div className="flex flex-col items-start gap-2 px-2 py-4 text-sm">
            <p className="text-destructive">
              Não foi possível carregar as notificações.
            </p>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void notificationsQuery.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Nenhuma notificação.
          </p>
        ) : (
          <DropdownMenuGroup className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isPending={
                  markAsRead.isPending &&
                  markAsRead.variables === notification.id
                }
                onRead={(notificationId) => markAsRead.mutate(notificationId)}
              />
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
