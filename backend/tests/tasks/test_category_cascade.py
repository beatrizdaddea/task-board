import pytest

from apps.categories.models import Category
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_category_deletion_cascades_to_associated_tasks(owner) -> None:
    category = Category.objects.create(name="Trabalho", owner=owner)
    first_task = Task.objects.create(
        title="Primeira tarefa", owner=owner, category=category
    )
    second_task = Task.objects.create(
        title="Segunda tarefa", owner=owner, category=category
    )

    category.delete()

    assert Task.objects.filter(pk__in=(first_task.pk, second_task.pk)).exists() is False


def test_category_deletion_does_not_affect_other_categories(owner) -> None:
    deleted_category = Category.objects.create(name="Temporária", owner=owner)
    remaining_category = Category.objects.create(name="Permanente", owner=owner)
    deleted_task = Task.objects.create(
        title="Tarefa removida", owner=owner, category=deleted_category
    )
    remaining_task = Task.objects.create(
        title="Tarefa mantida", owner=owner, category=remaining_category
    )

    deleted_category.delete()

    assert Task.objects.filter(pk=deleted_task.pk).exists() is False
    assert Category.objects.filter(pk=remaining_category.pk).exists()
    assert Task.objects.filter(pk=remaining_task.pk).exists()


def test_category_deletion_does_not_affect_uncategorized_tasks(owner) -> None:
    category = Category.objects.create(name="Temporária", owner=owner)
    categorized_task = Task.objects.create(
        title="Com categoria", owner=owner, category=category
    )
    uncategorized_task = Task.objects.create(
        title="Sem categoria", owner=owner, category=None
    )

    category.delete()

    assert Task.objects.filter(pk=categorized_task.pk).exists() is False
    assert Task.objects.filter(pk=uncategorized_task.pk).exists()
