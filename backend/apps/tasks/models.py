from django.conf import settings
from django.db import models

from apps.categories.models import Category


class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Baixa"
        MEDIUM = "medium", "Média"
        HIGH = "high", "Alta"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    completed = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=6,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    due_date = models.DateField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    category = models.ForeignKey(
        Category,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")

    def __str__(self):
        return self.title


class TaskShare(models.Model):
    class Permission(models.TextChoices):
        READ = "read", "Leitura"
        EDIT = "edit", "Edição"

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="shares",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_shares",
    )
    permission = models.CharField(max_length=4, choices=Permission.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        constraints = (
            models.UniqueConstraint(
                fields=("task", "user"),
                name="unique_task_share_per_user",
            ),
        )
