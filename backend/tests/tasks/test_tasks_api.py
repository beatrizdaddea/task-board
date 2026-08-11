import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db

User = get_user_model()
TASKS_URL = "/api/v1/tasks/"


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def owner():
    return User.objects.create_user(
        username="owner",
        email="owner@example.com",
        password="safe-password-123",
    )


@pytest.fixture
def other_user():
    return User.objects.create_user(
        username="other",
        email="other@example.com",
        password="safe-password-123",
    )


@pytest.fixture
def authenticated_client(api_client: APIClient, owner) -> APIClient:
    api_client.force_authenticate(user=owner)
    return api_client


@pytest.fixture
def category(owner) -> Category:
    return Category.objects.create(name="Trabalho", owner=owner)


@pytest.fixture
def task(owner, category) -> Task:
    return Task.objects.create(
        title="Preparar relatório",
        description="Consolidar os resultados do mês.",
        priority=Task.Priority.HIGH,
        due_date="2026-08-20",
        owner=owner,
        category=category,
    )


def task_detail_url(task: Task) -> str:
    return f"{TASKS_URL}{task.pk}/"


def test_create_task_with_defaults(authenticated_client: APIClient, owner) -> None:
    response = authenticated_client.post(
        TASKS_URL, {"title": "Comprar café"}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {
        "id": Task.objects.get().pk,
        "title": "Comprar café",
        "description": "",
        "completed": False,
        "priority": Task.Priority.MEDIUM,
        "due_date": None,
        "category": None,
        "created_at": response.json()["created_at"],
        "updated_at": response.json()["updated_at"],
    }
    assert Task.objects.get().owner == owner


def test_create_task_with_category(
    authenticated_client: APIClient, owner, category: Category
) -> None:
    response = authenticated_client.post(
        TASKS_URL,
        {
            "title": "Preparar relatório",
            "description": "Consolidar resultados.",
            "priority": Task.Priority.HIGH,
            "due_date": "2026-08-20",
            "category": category.pk,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    created_task = Task.objects.get()
    assert created_task.owner == owner
    assert created_task.category == category
    assert response.json()["category"] == category.pk


def test_list_only_authenticated_users_tasks(
    authenticated_client: APIClient, owner, other_user
) -> None:
    own_task = Task.objects.create(title="Minha tarefa", owner=owner)
    Task.objects.create(title="Tarefa privada", owner=other_user)

    response = authenticated_client.get(TASKS_URL)

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [own_task.pk]


def test_retrieve_task(authenticated_client: APIClient, task: Task) -> None:
    response = authenticated_client.get(task_detail_url(task))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == task.pk
    assert response.json()["title"] == task.title
    assert response.json()["category"] == task.category_id


def test_update_task(authenticated_client: APIClient, task: Task) -> None:
    response = authenticated_client.patch(
        task_detail_url(task),
        {"title": "Relatório revisado", "priority": Task.Priority.LOW},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    task.refresh_from_db()
    assert task.title == "Relatório revisado"
    assert task.priority == Task.Priority.LOW


def test_complete_task(authenticated_client: APIClient, task: Task) -> None:
    response = authenticated_client.patch(
        task_detail_url(task), {"completed": True}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    task.refresh_from_db()
    assert task.completed is True


def test_reopen_task(authenticated_client: APIClient, task: Task) -> None:
    task.completed = True
    task.save(update_fields=("completed",))

    response = authenticated_client.patch(
        task_detail_url(task), {"completed": False}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    task.refresh_from_db()
    assert task.completed is False


def test_delete_task(authenticated_client: APIClient, task: Task) -> None:
    response = authenticated_client.delete(task_detail_url(task))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Task.objects.filter(pk=task.pk).exists() is False


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"title": ""},
        {"title": "   "},
        {"title": "Tarefa", "priority": "urgent"},
        {"title": "Tarefa", "due_date": "amanhã"},
        {"title": "x" * 201},
    ],
)
def test_rejects_invalid_task_data(
    authenticated_client: APIClient, payload: dict
) -> None:
    response = authenticated_client.post(TASKS_URL, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Task.objects.exists() is False


@pytest.mark.parametrize(
    ("method", "url", "payload"),
    [
        ("get", TASKS_URL, None),
        ("post", TASKS_URL, {"title": "Tarefa"}),
    ],
)
def test_authentication_is_required_for_collection(
    api_client: APIClient, method: str, url: str, payload: dict | None
) -> None:
    response = getattr(api_client, method)(url, payload, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_authentication_is_required_for_detail(
    api_client: APIClient, task: Task, method: str
) -> None:
    payload = {"title": "Alterada"} if method == "patch" else None

    response = getattr(api_client, method)(
        task_detail_url(task), payload, format="json"
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_user_cannot_access_another_users_task_by_id(
    api_client: APIClient, task: Task, other_user, method: str
) -> None:
    api_client.force_authenticate(user=other_user)
    payload = {"title": "Invadida"} if method == "patch" else None

    response = getattr(api_client, method)(
        task_detail_url(task), payload, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert task.title not in str(response.json())
    task.refresh_from_db()
    assert task.title == "Preparar relatório"


def test_rejects_category_owned_by_another_user(
    authenticated_client: APIClient, other_user
) -> None:
    foreign_category = Category.objects.create(name="Privada", owner=other_user)

    response = authenticated_client.post(
        TASKS_URL,
        {"title": "Tarefa", "category": foreign_category.pk},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "category" in response.json()
    assert str(foreign_category.name) not in str(response.json())
    assert Task.objects.exists() is False


def test_rejects_updating_task_with_another_users_category(
    authenticated_client: APIClient, task: Task, other_user
) -> None:
    foreign_category = Category.objects.create(name="Privada", owner=other_user)

    response = authenticated_client.patch(
        task_detail_url(task),
        {"category": foreign_category.pk},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    task.refresh_from_db()
    assert task.category_id != foreign_category.pk


def test_ignores_owner_sent_in_payload(
    authenticated_client: APIClient, owner, other_user
) -> None:
    response = authenticated_client.post(
        TASKS_URL,
        {"title": "Tarefa segura", "owner": other_user.pk},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    created_task = Task.objects.get()
    assert created_task.owner == owner
    assert created_task.owner != other_user
    assert "owner" not in response.json()


def test_deleting_category_keeps_task_without_category(task: Task) -> None:
    task.category.delete()

    task.refresh_from_db()
    assert task.category is None
