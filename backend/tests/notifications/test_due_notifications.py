from datetime import timedelta

import pytest
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services import process_due_notifications
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_creates_due_soon_notification(owner) -> None:
    current_time = timezone.now()
    task = Task.objects.create(
        title="Entrega próxima",
        owner=owner,
        due_date=timezone.localdate(current_time + timedelta(hours=23)),
    )

    created_count = process_due_notifications(current_time=current_time)

    assert created_count == 1
    notification = Notification.objects.get()
    assert notification.recipient == owner
    assert notification.task == task
    assert notification.type == Notification.Type.TASK_DUE_SOON


def test_creates_overdue_notification(owner) -> None:
    current_time = timezone.now()
    task = Task.objects.create(
        title="Entrega atrasada",
        owner=owner,
        due_date=timezone.localdate(current_time) - timedelta(days=1),
    )

    created_count = process_due_notifications(current_time=current_time)

    assert created_count == 1
    notification = Notification.objects.get()
    assert notification.task == task
    assert notification.type == Notification.Type.TASK_OVERDUE


def test_does_not_notify_completed_task(owner) -> None:
    current_time = timezone.now()
    Task.objects.create(
        title="Entrega concluída",
        owner=owner,
        completed=True,
        due_date=timezone.localdate(current_time) - timedelta(days=1),
    )

    created_count = process_due_notifications(current_time=current_time)

    assert created_count == 0
    assert Notification.objects.exists() is False


def test_processing_due_notifications_is_idempotent(owner) -> None:
    current_time = timezone.now()
    Task.objects.create(
        title="Entrega única",
        owner=owner,
        due_date=timezone.localdate(current_time),
    )

    first_count = process_due_notifications(current_time=current_time)
    second_count = process_due_notifications(current_time=current_time)

    assert first_count == 1
    assert second_count == 0
    assert Notification.objects.count() == 1
