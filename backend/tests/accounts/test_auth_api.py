import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.views import APIView

pytestmark = pytest.mark.django_db

User = get_user_model()

REGISTER_URL = "/api/v1/auth/register/"
LOGIN_URL = "/api/v1/auth/login/"
REFRESH_URL = "/api/v1/auth/refresh/"
VALID_PASSWORD = "safe-password-123"


class ProtectedTestView(APIView):
    def get(self, request):
        return Response({"username": request.user.username})


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        username="beatriz",
        email="beatriz@example.com",
        password=VALID_PASSWORD,
    )


def login(api_client: APIClient) -> dict:
    response = api_client.post(
        LOGIN_URL,
        {"username": "beatriz", "password": VALID_PASSWORD},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    return response.json()


def request_protected_endpoint(authorization: str | None = None):
    headers = {"HTTP_AUTHORIZATION": authorization} if authorization else {}
    request = APIRequestFactory().get("/protected/", **headers)
    return ProtectedTestView.as_view()(request)


def test_register_user(api_client: APIClient) -> None:
    response = api_client.post(
        REGISTER_URL,
        {
            "username": "beatriz",
            "email": "beatriz@example.com",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {
        "id": User.objects.get(username="beatriz").pk,
        "username": "beatriz",
        "email": "beatriz@example.com",
    }
    assert User.objects.get(username="beatriz").check_password(VALID_PASSWORD)


@pytest.mark.parametrize("duplicate_field", ["username", "email"])
def test_register_rejects_duplicate_identifier(
    api_client: APIClient, user, duplicate_field: str
) -> None:
    payload = {
        "username": "other-user",
        "email": "other@example.com",
        "password": VALID_PASSWORD,
        duplicate_field: getattr(user, duplicate_field),
    }

    response = api_client.post(REGISTER_URL, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert duplicate_field in response.json()


def test_register_rejects_missing_fields(api_client: APIClient) -> None:
    response = api_client.post(
        REGISTER_URL,
        {"username": "beatriz"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert set(response.json()) == {"email", "password"}


def test_register_rejects_invalid_password(api_client: APIClient) -> None:
    response = api_client.post(
        REGISTER_URL,
        {
            "username": "beatriz",
            "email": "beatriz@example.com",
            "password": "123",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in response.json()
    assert User.objects.exists() is False


def test_login_returns_access_and_refresh_tokens(api_client: APIClient, user) -> None:
    tokens = login(api_client)

    assert set(tokens) == {"access", "refresh"}
    assert all(isinstance(token, str) and token for token in tokens.values())


def test_login_rejects_invalid_credentials(api_client: APIClient, user) -> None:
    response = api_client.post(
        LOGIN_URL,
        {"username": user.username, "password": "wrong-password"},
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert set(response.json()) == {"detail"}


def test_access_protected_endpoint_with_access_token(
    api_client: APIClient, user
) -> None:
    access_token = login(api_client)["access"]

    response = request_protected_endpoint(f"Bearer {access_token}")

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"username": user.username}


def test_access_protected_endpoint_without_token() -> None:
    response = request_protected_endpoint()

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_access_protected_endpoint_with_invalid_token() -> None:
    response = request_protected_endpoint("Bearer invalid-token")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.data


def test_refresh_returns_new_access_token(api_client: APIClient, user) -> None:
    tokens = login(api_client)

    response = api_client.post(
        REFRESH_URL,
        {"refresh": tokens["refresh"]},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert set(response.json()) == {"access"}
    assert response.json()["access"] != tokens["access"]


def test_refresh_rejects_invalid_token(api_client: APIClient) -> None:
    response = api_client.post(
        REFRESH_URL,
        {"refresh": "invalid-token"},
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert set(response.json()) == {"detail", "code"}
