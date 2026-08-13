import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.notifications.models import Notification

pytestmark = pytest.mark.django_db

NOTIFICATIONS_URL = "/api/v1/notifications/"


def create_notification(*, recipient, task=None, read=False) -> Notification:
    return Notification.objects.create(
        recipient=recipient,
        type=Notification.Type.TASK_SHARED,
        task=task,
        message="Uma tarefa foi compartilhada com você.",
        read_at=timezone.now() if read else None,
    )


def notification_read_url(notification: Notification) -> str:
    return f"{NOTIFICATIONS_URL}{notification.pk}/read/"


def test_lists_only_authenticated_user_notifications(
    authenticated_client: APIClient, owner, other_user
) -> None:
    own_notification = create_notification(recipient=owner)
    create_notification(recipient=other_user)

    response = authenticated_client.get(
        NOTIFICATIONS_URL, {"recipient_id": other_user.pk}
    )

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [own_notification.pk]
    assert "recipient" not in response.json()[0]


def test_filters_unread_notifications(authenticated_client: APIClient, owner) -> None:
    unread = create_notification(recipient=owner)
    create_notification(recipient=owner, read=True)

    response = authenticated_client.get(NOTIFICATIONS_URL, {"unread": "true"})

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [unread.pk]


def test_marks_own_notification_as_read(authenticated_client: APIClient, owner) -> None:
    notification = create_notification(recipient=owner)

    response = authenticated_client.patch(notification_read_url(notification))

    assert response.status_code == status.HTTP_200_OK
    notification.refresh_from_db()
    assert notification.read_at is not None
    assert response.json()["read_at"] is not None


def test_cannot_mark_another_users_notification_as_read(
    authenticated_client: APIClient, other_user
) -> None:
    notification = create_notification(recipient=other_user)

    response = authenticated_client.patch(notification_read_url(notification))

    assert response.status_code == status.HTTP_404_NOT_FOUND
    notification.refresh_from_db()
    assert notification.read_at is None


def test_marks_all_and_only_own_notifications_as_read(
    authenticated_client: APIClient, owner, other_user
) -> None:
    own_notifications = [
        create_notification(recipient=owner),
        create_notification(recipient=owner),
    ]
    other_notification = create_notification(recipient=other_user)

    response = authenticated_client.post(f"{NOTIFICATIONS_URL}read-all/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"updated": 2}
    assert (
        Notification.objects.filter(
            pk__in=[item.pk for item in own_notifications], read_at__isnull=False
        ).count()
        == 2
    )
    other_notification.refresh_from_db()
    assert other_notification.read_at is None


def test_notifications_require_authentication(api_client: APIClient) -> None:
    response = api_client.get(NOTIFICATIONS_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
