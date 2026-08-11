from django.conf import settings
from django.db import models
from django.db.models.functions import Lower


class Category(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")
        constraints = (
            models.UniqueConstraint(
                Lower("name"),
                "owner",
                name="unique_category_name_per_owner",
            ),
        )

    def __str__(self):
        return self.name
