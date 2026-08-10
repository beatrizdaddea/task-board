import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_create_user() -> None:
    user = User.objects.create_user(
        username="beatriz",
        email="beatriz@example.com",
        password="safe-password-123",
    )

    assert user.pk is not None
    assert user.username == "beatriz"
    assert user.email == "beatriz@example.com"
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False


def test_create_user_hashes_password() -> None:
    raw_password = "safe-password-123"

    user = User.objects.create_user(
        username="beatriz",
        email="beatriz@example.com",
        password=raw_password,
    )

    assert user.password != raw_password
    assert user.check_password(raw_password) is True


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("username", "beatriz"),
        ("email", "beatriz@example.com"),
    ],
)
def test_create_user_rejects_duplicate_identifiers(field: str, value: str) -> None:
    User.objects.create_user(
        username="beatriz",
        email="beatriz@example.com",
        password="safe-password-123",
    )
    duplicate_data = {
        "username": "other-user",
        "email": "other@example.com",
        "password": "safe-password-456",
        field: value,
    }

    with pytest.raises(IntegrityError):
        User.objects.create_user(**duplicate_data)


def test_create_user_rejects_empty_username() -> None:
    with pytest.raises(ValueError, match="username"):
        User.objects.create_user(
            username="",
            email="beatriz@example.com",
            password="safe-password-123",
        )
