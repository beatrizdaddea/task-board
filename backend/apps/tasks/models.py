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
        on_delete=models.SET_NULL,
        related_name="tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")

    def __str__(self):
        return self.title
