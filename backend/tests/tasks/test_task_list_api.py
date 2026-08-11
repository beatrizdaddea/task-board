import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db

TASKS_URL = "/api/v1/tasks/"


@pytest.fixture
def categories(owner) -> tuple[Category, Category]:
    return (
        Category.objects.create(name="Trabalho", owner=owner),
        Category.objects.create(name="Pessoal", owner=owner),
    )


@pytest.fixture
def tasks(owner, categories) -> tuple[Task, Task, Task]:
    work, personal = categories
    return (
        Task.objects.create(
            title="Preparar relatório",
            description="Consolidar resultados trimestrais.",
            completed=False,
            priority=Task.Priority.HIGH,
            due_date="2026-08-20",
            owner=owner,
            category=work,
        ),
        Task.objects.create(
            title="Comprar café",
            description="Ir ao supermercado.",
            completed=True,
            priority=Task.Priority.LOW,
            due_date="2026-08-18",
            owner=owner,
            category=personal,
        ),
        Task.objects.create(
            title="Ligar para cliente",
            description="Revisar o relatório antes da ligação.",
            completed=False,
            priority=Task.Priority.MEDIUM,
            due_date="2026-08-22",
            owner=owner,
            category=work,
        ),
    )


def result_ids(response) -> list[int]:
    return [item["id"] for item in response.json()["results"]]


@pytest.mark.parametrize(
    ("value", "expected_indexes"),
    [("true", (1,)), ("false", (2, 0))],
)
def test_filter_by_completed(
    authenticated_client: APIClient,
    tasks: tuple[Task, Task, Task],
    value: str,
    expected_indexes: tuple[int, ...],
) -> None:
    response = authenticated_client.get(TASKS_URL, {"completed": value})

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[index].pk for index in expected_indexes]


def test_filter_by_category(
    authenticated_client: APIClient,
    tasks: tuple[Task, Task, Task],
    categories: tuple[Category, Category],
) -> None:
    response = authenticated_client.get(TASKS_URL, {"category": categories[0].pk})

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[2].pk, tasks[0].pk]


def test_filter_by_priority(
    authenticated_client: APIClient, tasks: tuple[Task, Task, Task]
) -> None:
    response = authenticated_client.get(TASKS_URL, {"priority": Task.Priority.HIGH})

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[0].pk]


def test_searches_title_and_description(
    authenticated_client: APIClient, tasks: tuple[Task, Task, Task]
) -> None:
    response = authenticated_client.get(TASKS_URL, {"search": "relatório"})

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[2].pk, tasks[0].pk]


@pytest.mark.parametrize(
    ("ordering", "expected_indexes"),
    [
        ("created_at", (0, 1, 2)),
        ("-created_at", (2, 1, 0)),
        ("due_date", (1, 0, 2)),
    ],
)
def test_ordering(
    authenticated_client: APIClient,
    tasks: tuple[Task, Task, Task],
    ordering: str,
    expected_indexes: tuple[int, ...],
) -> None:
    response = authenticated_client.get(TASKS_URL, {"ordering": ordering})

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[index].pk for index in expected_indexes]


def test_combines_filters(
    authenticated_client: APIClient,
    tasks: tuple[Task, Task, Task],
    categories: tuple[Category, Category],
) -> None:
    response = authenticated_client.get(
        TASKS_URL,
        {
            "completed": "false",
            "category": categories[0].pk,
            "priority": Task.Priority.HIGH,
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[0].pk]


def test_paginates_tasks(authenticated_client: APIClient, owner) -> None:
    Task.objects.bulk_create(
        [Task(title=f"Tarefa {index}", owner=owner) for index in range(11)]
    )

    first_page = authenticated_client.get(TASKS_URL)
    second_page = authenticated_client.get(TASKS_URL, {"page": 2})

    assert first_page.status_code == status.HTTP_200_OK
    assert first_page.json()["count"] == 11
    assert first_page.json()["previous"] is None
    assert first_page.json()["next"] is not None
    assert len(first_page.json()["results"]) == 10
    assert second_page.status_code == status.HTTP_200_OK
    assert second_page.json()["previous"] is not None
    assert second_page.json()["next"] is None
    assert len(second_page.json()["results"]) == 1


def test_filters_do_not_reveal_other_users_tasks(
    authenticated_client: APIClient, tasks, other_user
) -> None:
    foreign_category = Category.objects.create(name="Privada", owner=other_user)
    Task.objects.create(
        title="Relatório confidencial",
        description="Não expor.",
        completed=False,
        priority=Task.Priority.HIGH,
        owner=other_user,
        category=foreign_category,
    )

    response = authenticated_client.get(
        TASKS_URL,
        {"completed": "false", "priority": "high", "search": "relatório"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert result_ids(response) == [tasks[0].pk]
    assert response.json()["count"] == 1


@pytest.mark.parametrize(
    "query_params",
    [
        {"priority": "urgent"},
        {"category": "not-a-number"},
    ],
)
def test_rejects_invalid_filters(
    authenticated_client: APIClient, tasks, query_params: dict
) -> None:
    response = authenticated_client.get(TASKS_URL, query_params)

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_ignores_unrecognized_boolean_filter(
    authenticated_client: APIClient, tasks
) -> None:
    default_response = authenticated_client.get(TASKS_URL)
    invalid_response = authenticated_client.get(TASKS_URL, {"completed": "invalid"})

    assert invalid_response.status_code == status.HTTP_200_OK
    assert result_ids(invalid_response) == result_ids(default_response)


def test_ignores_invalid_ordering(authenticated_client: APIClient, tasks) -> None:
    default_response = authenticated_client.get(TASKS_URL)
    invalid_response = authenticated_client.get(TASKS_URL, {"ordering": "title"})

    assert invalid_response.status_code == status.HTTP_200_OK
    assert result_ids(invalid_response) == result_ids(default_response)


def test_returns_not_found_for_nonexistent_page(
    authenticated_client: APIClient, tasks
) -> None:
    response = authenticated_client.get(TASKS_URL, {"page": 999})

    assert response.status_code == status.HTTP_404_NOT_FOUND
