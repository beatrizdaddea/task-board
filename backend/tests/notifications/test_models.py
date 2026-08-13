from datetime import timedelta

import pytest
from django.utils import timezone

from apps.notifications.models import Notification
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_notification_stores_task_and_starts_unread(owner) -> None:
    task = Task.objects.create(title="Preparar entrega", owner=owner)

    notification = Notification.objects.create(
        recipient=owner,
        type=Notification.Type.TASK_DUE_SOON,
        task=task,
        message="A tarefa vence em breve.",
    )

    assert notification.recipient == owner
    assert notification.task == task
    assert notification.type == Notification.Type.TASK_DUE_SOON
    assert notification.message == "A tarefa vence em breve."
    assert notification.created_at is not None
    assert notification.read_at is None


def test_notification_allows_no_task_and_records_read_date(owner) -> None:
    read_at = timezone.now() - timedelta(minutes=1)

    notification = Notification.objects.create(
        recipient=owner,
        type=Notification.Type.TASK_OVERDUE,
        task=None,
        message="Uma tarefa removida estava atrasada.",
        read_at=read_at,
    )

    assert notification.task is None
    assert notification.read_at == read_at
