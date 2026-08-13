import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category

pytestmark = pytest.mark.django_db

CATEGORIES_URL = "/api/v1/categories/"


def category_detail_url(category: Category) -> str:
    return f"{CATEGORIES_URL}{category.pk}/"


def test_create_category(authenticated_client: APIClient, owner) -> None:
    response = authenticated_client.post(
        CATEGORIES_URL, {"name": "Pessoal"}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Pessoal"
    assert set(response.json()) == {"id", "name", "created_at", "updated_at"}
    assert Category.objects.filter(name="Pessoal", owner=owner).exists()


def test_list_only_authenticated_user_categories(
    authenticated_client: APIClient, owner, other_user
) -> None:
    own_category = Category.objects.create(name="Pessoal", owner=owner)
    Category.objects.create(name="Privada", owner=other_user)

    response = authenticated_client.get(CATEGORIES_URL)

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [own_category.pk]


def test_retrieve_category(authenticated_client: APIClient, category: Category) -> None:
    response = authenticated_client.get(category_detail_url(category))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == category.pk
    assert response.json()["name"] == category.name


def test_update_category(authenticated_client: APIClient, category: Category) -> None:
    response = authenticated_client.patch(
        category_detail_url(category), {"name": "Estudos"}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    category.refresh_from_db()
    assert category.name == "Estudos"


def test_delete_category(authenticated_client: APIClient, category: Category) -> None:
    response = authenticated_client.delete(category_detail_url(category))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Category.objects.filter(pk=category.pk).exists() is False


@pytest.mark.parametrize(
    ("method", "url", "payload"),
    [
        ("get", CATEGORIES_URL, None),
        ("post", CATEGORIES_URL, {"name": "Pessoal"}),
    ],
)
def test_authentication_is_required(
    api_client: APIClient, method: str, url: str, payload: dict | None
) -> None:
    response = getattr(api_client, method)(url, payload, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_authentication_is_required_for_detail_endpoints(
    api_client: APIClient, category: Category, method: str
) -> None:
    payload = {"name": "Estudos"} if method == "patch" else None

    response = getattr(api_client, method)(
        category_detail_url(category), payload, format="json"
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_user_cannot_access_another_users_category_by_id(
    api_client: APIClient,
    category: Category,
    other_user,
    method: str,
) -> None:
    api_client.force_authenticate(user=other_user)
    payload = {"name": "Invadida"} if method == "patch" else None

    response = getattr(api_client, method)(
        category_detail_url(category), payload, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert category.name not in str(response.json())
    category.refresh_from_db()
    assert category.name == "Trabalho"


@pytest.mark.parametrize("invalid_name", ["", "   "])
def test_rejects_invalid_name(
    authenticated_client: APIClient, invalid_name: str
) -> None:
    response = authenticated_client.post(
        CATEGORIES_URL, {"name": invalid_name}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "name" in response.json()
    assert Category.objects.exists() is False


def test_rejects_duplicate_name_for_same_owner_case_insensitively(
    authenticated_client: APIClient, category: Category
) -> None:
    response = authenticated_client.post(
        CATEGORIES_URL, {"name": "trabalho"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "name" in response.json()
    assert Category.objects.filter(owner=category.owner).count() == 1


def test_allows_same_name_for_different_owners(
    api_client: APIClient, category: Category, other_user
) -> None:
    api_client.force_authenticate(user=other_user)

    response = api_client.post(CATEGORIES_URL, {"name": category.name}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Category.objects.filter(name=category.name).count() == 2
