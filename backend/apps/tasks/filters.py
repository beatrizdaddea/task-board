from django_filters import rest_framework as filters

from apps.tasks.models import Task


class TaskFilter(filters.FilterSet):
    completed = filters.BooleanFilter(field_name="completed")
    category = filters.NumberFilter(field_name="category_id")
    priority = filters.ChoiceFilter(
        field_name="priority",
        choices=Task.Priority.choices,
    )

    class Meta:
        model = Task
        fields = ("completed", "category", "priority")
