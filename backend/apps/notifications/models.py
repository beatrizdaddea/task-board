from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        TASK_SHARED = "TASK_SHARED", "Tarefa compartilhada"
        TASK_DUE_SOON = "TASK_DUE_SOON", "Tarefa próxima do vencimento"
        TASK_OVERDUE = "TASK_OVERDUE", "Tarefa atrasada"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    task = models.ForeignKey(
        "tasks.Task",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = (
            models.UniqueConstraint(
                fields=("recipient", "type", "task"),
                condition=models.Q(
                    task__isnull=False,
                    type__in=("TASK_DUE_SOON", "TASK_OVERDUE"),
                ),
                name="unique_due_notification_per_task_recipient_type",
            ),
        )

    def __str__(self) -> str:
        return self.message
