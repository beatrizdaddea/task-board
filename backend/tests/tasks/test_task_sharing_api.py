import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.tasks.models import Task, TaskShare

pytestmark = pytest.mark.django_db

User = get_user_model()
TASKS_URL = "/api/v1/tasks/"


@pytest.fixture
def third_user():
    return User.objects.create_user(
        username="third",
        email="third@example.com",
        password="safe-password-123",
    )


@pytest.fixture
def task(owner, category) -> Task:
    return Task.objects.create(
        title="Planejar entrega",
        owner=owner,
        category=category,
    )


def task_detail_url(task: Task) -> str:
    return f"{TASKS_URL}{task.pk}/"


def share_collection_url(task: Task) -> str:
    return f"{task_detail_url(task)}shares/"


def share_detail_url(share: TaskShare, task: Task | None = None) -> str:
    nested_task = task or share.task
    return f"{share_collection_url(nested_task)}{share.pk}/"


def authenticate(api_client: APIClient, user) -> APIClient:
    api_client.force_authenticate(user=user)
    return api_client


def create_share(
    *, task: Task, user, permission: str = TaskShare.Permission.READ
) -> TaskShare:
    return TaskShare.objects.create(task=task, user=user, permission=permission)


def test_owner_shares_task_by_email(
    authenticated_client: APIClient, task: Task, other_user
) -> None:
    response = authenticated_client.post(
        share_collection_url(task),
        {
            "user_email": other_user.email,
            "permission": TaskShare.Permission.READ,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    share = TaskShare.objects.get()
    assert share.task == task
    assert share.user == other_user
    assert response.json() == {
        "id": share.pk,
        "task": task.pk,
        "user_email": other_user.email,
        "permission": TaskShare.Permission.READ,
        "created_at": response.json()["created_at"],
    }
    assert "user" not in response.json()


def test_owner_lists_task_shares(
    authenticated_client: APIClient, task: Task, other_user, third_user
) -> None:
    first_share = create_share(task=task, user=other_user)
    second_share = create_share(
        task=task,
        user=third_user,
        permission=TaskShare.Permission.EDIT,
    )

    response = authenticated_client.get(share_collection_url(task))

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [
        first_share.pk,
        second_share.pk,
    ]


def test_owner_updates_share_permission(
    authenticated_client: APIClient, task: Task, other_user
) -> None:
    share = create_share(task=task, user=other_user)

    response = authenticated_client.patch(
        share_detail_url(share),
        {"permission": TaskShare.Permission.EDIT},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    share.refresh_from_db()
    assert share.permission == TaskShare.Permission.EDIT


def test_owner_removes_share(
    authenticated_client: APIClient, task: Task, other_user
) -> None:
    share = create_share(task=task, user=other_user)

    response = authenticated_client.delete(share_detail_url(share))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert TaskShare.objects.filter(pk=share.pk).exists() is False


def test_owner_cannot_share_task_with_self(
    authenticated_client: APIClient, task: Task, owner
) -> None:
    response = authenticated_client.post(
        share_collection_url(task),
        {"user_email": owner.email, "permission": TaskShare.Permission.READ},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "user_email" in response.json()
    assert TaskShare.objects.exists() is False


def test_rejects_unknown_user_email(
    authenticated_client: APIClient, task: Task
) -> None:
    response = authenticated_client.post(
        share_collection_url(task),
        {
            "user_email": "missing@example.com",
            "permission": TaskShare.Permission.READ,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "user_email" in response.json()
    assert TaskShare.objects.exists() is False


def test_rejects_duplicate_share(
    authenticated_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user)

    response = authenticated_client.post(
        share_collection_url(task),
        {
            "user_email": other_user.email,
            "permission": TaskShare.Permission.EDIT,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "user_email" in response.json()
    assert TaskShare.objects.count() == 1


def test_read_user_can_list_and_retrieve_shared_task(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user)
    authenticate(api_client, other_user)

    list_response = api_client.get(TASKS_URL)
    detail_response = api_client.get(task_detail_url(task))

    assert list_response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in list_response.json()["results"]] == [task.pk]
    assert detail_response.status_code == status.HTTP_200_OK
    assert detail_response.json()["id"] == task.pk
    assert detail_response.json()["is_shared"] is True
    assert detail_response.json()["permissions"] == {
        "can_edit": False,
        "can_edit_category": False,
        "can_delete": False,
        "can_change_status": False,
    }


@pytest.mark.parametrize(
    ("method", "payload"),
    [
        ("patch", {"title": "Alterada"}),
        ("patch", {"completed": True}),
        ("delete", None),
    ],
)
def test_read_user_cannot_modify_shared_task(
    api_client: APIClient,
    task: Task,
    other_user,
    method: str,
    payload: dict | None,
) -> None:
    create_share(task=task, user=other_user)
    authenticate(api_client, other_user)

    response = getattr(api_client, method)(
        task_detail_url(task), payload, format="json"
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    task.refresh_from_db()
    assert task.title == "Planejar entrega"
    assert task.completed is False


def test_read_user_cannot_manage_shares(
    api_client: APIClient, task: Task, other_user, third_user
) -> None:
    share = create_share(task=task, user=other_user)
    authenticate(api_client, other_user)

    list_response = api_client.get(share_collection_url(task))
    create_response = api_client.post(
        share_collection_url(task),
        {
            "user_email": third_user.email,
            "permission": TaskShare.Permission.READ,
        },
        format="json",
    )
    delete_response = api_client.delete(share_detail_url(share))

    assert list_response.status_code == status.HTTP_404_NOT_FOUND
    assert create_response.status_code == status.HTTP_404_NOT_FOUND
    assert delete_response.status_code == status.HTTP_404_NOT_FOUND


def test_edit_user_can_retrieve_and_edit_shared_task(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user, permission=TaskShare.Permission.EDIT)
    authenticate(api_client, other_user)

    detail_response = api_client.get(task_detail_url(task))
    update_response = api_client.patch(
        task_detail_url(task),
        {"title": "Entrega revisada", "priority": Task.Priority.HIGH},
        format="json",
    )

    assert detail_response.status_code == status.HTTP_200_OK
    assert detail_response.json()["permissions"] == {
        "can_edit": True,
        "can_edit_category": False,
        "can_delete": False,
        "can_change_status": True,
    }
    assert update_response.status_code == status.HTTP_200_OK
    task.refresh_from_db()
    assert task.title == "Entrega revisada"
    assert task.priority == Task.Priority.HIGH


def test_edit_user_can_complete_and_reopen_shared_task(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user, permission=TaskShare.Permission.EDIT)
    authenticate(api_client, other_user)

    complete_response = api_client.patch(
        task_detail_url(task), {"completed": True}, format="json"
    )
    reopen_response = api_client.patch(
        task_detail_url(task), {"completed": False}, format="json"
    )

    assert complete_response.status_code == status.HTTP_200_OK
    assert reopen_response.status_code == status.HTTP_200_OK
    task.refresh_from_db()
    assert task.completed is False


def test_edit_user_cannot_delete_shared_task(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user, permission=TaskShare.Permission.EDIT)
    authenticate(api_client, other_user)

    response = api_client.delete(task_detail_url(task))

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Task.objects.filter(pk=task.pk).exists()


def test_edit_user_cannot_manage_shares(
    api_client: APIClient, task: Task, other_user, third_user
) -> None:
    create_share(task=task, user=other_user, permission=TaskShare.Permission.EDIT)
    authenticate(api_client, other_user)

    response = api_client.post(
        share_collection_url(task),
        {
            "user_email": third_user.email,
            "permission": TaskShare.Permission.READ,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert TaskShare.objects.count() == 1


def test_edit_user_cannot_change_task_category(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user, permission=TaskShare.Permission.EDIT)
    editor_category = Category.objects.create(name="Editor", owner=other_user)
    authenticate(api_client, other_user)

    response = api_client.patch(
        task_detail_url(task),
        {"category": editor_category.pk},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    task.refresh_from_db()
    assert task.category.owner != other_user


def test_third_user_cannot_access_task(
    api_client: APIClient, task: Task, other_user, third_user
) -> None:
    create_share(task=task, user=other_user)
    authenticate(api_client, third_user)

    list_response = api_client.get(TASKS_URL)
    detail_response = api_client.get(task_detail_url(task))

    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json()["results"] == []
    assert detail_response.status_code == status.HTTP_404_NOT_FOUND


def test_non_owner_cannot_share_by_manipulating_task_id(
    api_client: APIClient, task: Task, other_user, third_user
) -> None:
    authenticate(api_client, other_user)

    response = api_client.post(
        share_collection_url(task),
        {
            "user_email": third_user.email,
            "permission": TaskShare.Permission.READ,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert TaskShare.objects.exists() is False


@pytest.mark.parametrize("method", ["patch", "delete"])
def test_share_id_must_belong_to_task_in_url(
    authenticated_client: APIClient,
    task: Task,
    owner,
    other_user,
    third_user,
    method: str,
) -> None:
    requested_share = create_share(task=task, user=other_user)
    other_task = Task.objects.create(title="Outra tarefa", owner=owner)
    other_share = create_share(task=other_task, user=third_user)
    payload = {"permission": TaskShare.Permission.EDIT} if method == "patch" else None

    response = getattr(authenticated_client, method)(
        share_detail_url(other_share, task=requested_share.task),
        payload,
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    other_share.refresh_from_db()
    assert other_share.permission == TaskShare.Permission.READ


def test_shared_task_appears_only_once_for_user(
    api_client: APIClient, task: Task, other_user
) -> None:
    create_share(task=task, user=other_user)
    Task.objects.create(title="Tarefa própria", owner=other_user)
    authenticate(api_client, other_user)

    response = api_client.get(TASKS_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["count"] == 2
    assert len({item["id"] for item in response.json()["results"]}) == 2
