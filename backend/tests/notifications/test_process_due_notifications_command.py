from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.notifications.models import Notification
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_command_processes_eligible_tasks_and_reports_created_count(owner) -> None:
    today = timezone.localdate(timezone.now())
    Task.objects.create(title="Vence hoje", owner=owner, due_date=today)
    Task.objects.create(
        title="Atrasada",
        owner=owner,
        due_date=today - timedelta(days=1),
    )
    Task.objects.create(
        title="Concluída",
        owner=owner,
        completed=True,
        due_date=today - timedelta(days=1),
    )
    first_output = StringIO()
    second_output = StringIO()

    call_command("process_due_notifications", stdout=first_output)
    call_command("process_due_notifications", stdout=second_output)

    assert "Notificações criadas: 2" in first_output.getvalue()
    assert "Notificações criadas: 0" in second_output.getvalue()
    assert Notification.objects.count() == 2
