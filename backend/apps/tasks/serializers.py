from rest_framework import serializers

from apps.categories.models import Category
from apps.tasks.models import Task


class TaskSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Category.objects.none(),
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "completed",
            "priority",
            "due_date",
            "category",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")

        if request is not None and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(
                owner=request.user
            )
