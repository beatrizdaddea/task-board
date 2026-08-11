import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.categories.models import Category

User = get_user_model()


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
