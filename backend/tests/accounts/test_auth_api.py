from datetime import timedelta

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.views import APIView
from rest_framework_simplejwt import serializers as jwt_serializers
from rest_framework_simplejwt.tokens import RefreshToken

pytestmark = pytest.mark.django_db

User = get_user_model()

REGISTER_URL = "/api/v1/auth/register/"
CSRF_URL = "/api/v1/auth/csrf/"
LOGIN_URL = "/api/v1/auth/login/"
REFRESH_URL = "/api/v1/auth/refresh/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"
CATEGORIES_URL = "/api/v1/categories/"
VALID_PASSWORD = "safe-password-123"


class ProtectedTestView(APIView):
    def get(self, request):
        return Response({"username": request.user.username})


@pytest.fixture
def user():
    return User.objects.create_user(
        username="beatriz",
        email="beatriz@example.com",
        password=VALID_PASSWORD,
    )


def login(api_client: APIClient, **headers) -> Response:
    response = api_client.post(
        LOGIN_URL,
        {"username": "beatriz", "password": VALID_PASSWORD},
        format="json",
        **headers,
    )

    assert response.status_code == status.HTTP_200_OK
    return response


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


def test_login_sets_http_only_token_cookies(api_client: APIClient, user) -> None:
    response = login(api_client)

    assert response.json() == {"detail": "Login successful."}
    assert "access" not in response.json()
    assert "refresh" not in response.json()

    access_cookie = response.cookies[settings.JWT_ACCESS_COOKIE_NAME]
    refresh_cookie = response.cookies[settings.JWT_REFRESH_COOKIE_NAME]

    assert access_cookie.value
    assert refresh_cookie.value
    assert access_cookie["httponly"] is True
    assert refresh_cookie["httponly"] is True
    assert bool(access_cookie["secure"]) is settings.JWT_COOKIE_SECURE
    assert bool(refresh_cookie["secure"]) is settings.JWT_COOKIE_SECURE
    assert access_cookie["samesite"] == settings.JWT_COOKIE_SAMESITE
    assert refresh_cookie["samesite"] == settings.JWT_COOKIE_SAMESITE
    assert access_cookie["path"] == settings.JWT_ACCESS_COOKIE_PATH
    assert refresh_cookie["path"] == settings.JWT_REFRESH_COOKIE_PATH


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
    login_response = login(api_client)
    access_token = login_response.cookies[settings.JWT_ACCESS_COOKIE_NAME].value

    response = request_protected_endpoint(f"Bearer {access_token}")

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"username": user.username}


def test_access_protected_endpoint_with_access_cookie(
    api_client: APIClient, user
) -> None:
    login(api_client)

    response = api_client.get(CATEGORIES_URL)

    assert response.status_code == status.HTTP_200_OK


def test_authenticated_user_returns_only_public_identity(
    api_client: APIClient, user
) -> None:
    login(api_client)

    response = api_client.get(ME_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


def test_authenticated_user_rejects_visitor(api_client: APIClient) -> None:
    response = api_client.get(ME_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_real_protected_endpoint_without_authentication(api_client: APIClient) -> None:
    response = api_client.get(CATEGORIES_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_access_protected_endpoint_without_token() -> None:
    response = request_protected_endpoint()

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_access_protected_endpoint_with_invalid_token() -> None:
    response = request_protected_endpoint("Bearer invalid-token")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.data


def test_refresh_returns_new_access_token(api_client: APIClient, user) -> None:
    login_response = login(api_client)
    previous_access = login_response.cookies[settings.JWT_ACCESS_COOKIE_NAME].value

    response = api_client.post(REFRESH_URL, {}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"detail": "Token refreshed."}
    assert "access" not in response.json()
    assert response.cookies[settings.JWT_ACCESS_COOKIE_NAME].value != previous_access
    assert response.cookies[settings.JWT_ACCESS_COOKIE_NAME]["httponly"] is True


def test_refresh_rejects_invalid_token(api_client: APIClient) -> None:
    api_client.cookies[settings.JWT_REFRESH_COOKIE_NAME] = "invalid-token"

    response = api_client.post(REFRESH_URL, {}, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert set(response.json()) == {"detail", "code"}


def test_refresh_rejects_expired_token(api_client: APIClient, user) -> None:
    refresh_token = RefreshToken.for_user(user)
    refresh_token.set_exp(lifetime=timedelta(seconds=-1))
    api_client.cookies[settings.JWT_REFRESH_COOKIE_NAME] = str(refresh_token)

    response = api_client.post(REFRESH_URL, {}, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert set(response.json()) == {"detail", "code"}


def test_refresh_updates_refresh_cookie_when_rotation_is_enabled(
    api_client: APIClient, user, monkeypatch
) -> None:
    monkeypatch.setattr(jwt_serializers.api_settings, "ROTATE_REFRESH_TOKENS", True)
    monkeypatch.setattr(jwt_serializers.api_settings, "BLACKLIST_AFTER_ROTATION", True)
    login_response = login(api_client)
    previous_refresh = login_response.cookies[settings.JWT_REFRESH_COOKIE_NAME].value

    response = api_client.post(REFRESH_URL, {}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert settings.JWT_REFRESH_COOKIE_NAME in response.cookies
    assert response.cookies[settings.JWT_REFRESH_COOKIE_NAME].value != previous_refresh
    assert response.cookies[settings.JWT_REFRESH_COOKIE_NAME]["httponly"] is True


def test_login_requires_csrf_when_checks_are_enforced(user) -> None:
    csrf_client = APIClient(enforce_csrf_checks=True)

    response = csrf_client.post(
        LOGIN_URL,
        {"username": user.username, "password": VALID_PASSWORD},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_cookie_authenticated_write_requires_csrf(user) -> None:
    csrf_client = APIClient(enforce_csrf_checks=True)
    csrf_response = csrf_client.get(CSRF_URL)
    csrf_token = csrf_response.cookies[settings.CSRF_COOKIE_NAME].value
    login(csrf_client, HTTP_X_CSRFTOKEN=csrf_token)

    rejected_response = csrf_client.post(
        CATEGORIES_URL,
        {"name": "Without CSRF header"},
        format="json",
    )
    accepted_response = csrf_client.post(
        CATEGORIES_URL,
        {"name": "With CSRF header"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token,
    )

    assert rejected_response.status_code == status.HTTP_403_FORBIDDEN
    assert accepted_response.status_code == status.HTTP_201_CREATED


def test_logout_clears_authentication_cookies(api_client: APIClient, user) -> None:
    login(api_client)

    response = api_client.post(LOGOUT_URL)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.cookies[settings.JWT_ACCESS_COOKIE_NAME]["max-age"] == 0
    assert response.cookies[settings.JWT_REFRESH_COOKIE_NAME]["max-age"] == 0


def test_session_cannot_access_protected_endpoint_after_logout(
    api_client: APIClient, user
) -> None:
    login(api_client)
    api_client.post(LOGOUT_URL)

    response = api_client.get(CATEGORIES_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_blacklists_refresh_token(api_client: APIClient, user) -> None:
    login_response = login(api_client)
    refresh_token = login_response.cookies[settings.JWT_REFRESH_COOKIE_NAME].value

    logout_response = api_client.post(LOGOUT_URL)
    api_client.cookies[settings.JWT_REFRESH_COOKIE_NAME] = refresh_token
    refresh_response = api_client.post(REFRESH_URL, {}, format="json")

    assert logout_response.status_code == status.HTTP_204_NO_CONTENT
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
