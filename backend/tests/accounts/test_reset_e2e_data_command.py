import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.categories.models import Category
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_reset_e2e_data_recreates_technical_users_and_preserves_others():
    unrelated_user = User.objects.create_user(
        username="unrelated",
        email="unrelated@example.com",
        password="safe-password-123",
    )
    User.objects.create_user(
        username="selenium_e2e",
        email="old.selenium@taskboard.local",
        password="old-password-123",
    )
    User.objects.create_user(
        username="selenium_signup_previous",
        email="selenium.signup.previous@taskboard.local",
        password="old-password-123",
    )

    call_command("reset_e2e_data", verbosity=0)

    e2e_user = User.objects.get(username="selenium_e2e")
    assert e2e_user.email == "selenium.e2e@taskboard.local"
    assert e2e_user.check_password("TaskBoard-E2E-2026!")
    assert User.objects.filter(username="selenium_recipient").exists() is True
    signup_users_exist = User.objects.filter(
        username__startswith="selenium_signup_"
    ).exists()
    assert signup_users_exist is False
    assert User.objects.filter(pk=unrelated_user.pk).exists() is True
    assert Category.objects.filter(owner=e2e_user).count() == 2
    assert Task.objects.filter(owner=e2e_user).count() == 2
    assert Task.objects.filter(owner=e2e_user, completed=True).count() == 1
