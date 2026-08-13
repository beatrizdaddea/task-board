from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

from django.contrib.auth.models import AbstractBaseUser
from django.utils import timezone

from apps.notifications.models import Notification

if TYPE_CHECKING:
    from apps.tasks.models import Task


def notify_task_shared(*, task: "Task", recipient: AbstractBaseUser) -> Notification:
    return Notification.objects.create(
        recipient=recipient,
        type=Notification.Type.TASK_SHARED,
        task=task,
        message=f'A tarefa "{task.title}" foi compartilhada com você.',
    )


def get_due_notification_type(
    due_date: date, *, current_time: datetime
) -> Notification.Type | None:
    current_date = timezone.localdate(current_time)
    if due_date < current_date:
        return Notification.Type.TASK_OVERDUE

    due_soon_limit = timezone.localdate(current_time + timedelta(hours=24))
    if due_date <= due_soon_limit:
        return Notification.Type.TASK_DUE_SOON

    return None


def process_due_notifications(*, current_time: datetime | None = None) -> int:
    from apps.tasks.models import Task

    current_time = current_time or timezone.now()
    due_soon_limit = timezone.localdate(current_time + timedelta(hours=24))
    tasks = Task.objects.filter(
        completed=False,
        due_date__isnull=False,
        due_date__lte=due_soon_limit,
    ).select_related("owner")
    created_count = 0

    for task in tasks:
        notification_type = get_due_notification_type(
            task.due_date, current_time=current_time
        )
        if notification_type is None:
            continue

        _, created = Notification.objects.get_or_create(
            recipient=task.owner,
            task=task,
            type=notification_type,
            defaults={"message": get_due_notification_message(task, notification_type)},
        )
        created_count += int(created)

    return created_count


def get_due_notification_message(
    task: "Task", notification_type: Notification.Type
) -> str:
    if notification_type == Notification.Type.TASK_OVERDUE:
        return f'A tarefa "{task.title}" está atrasada.'
    return f'A tarefa "{task.title}" vence em breve.'
