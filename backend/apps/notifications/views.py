from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationSerializer,
    ReadAllNotificationsResponseSerializer,
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.none()
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ("get", "patch", "post", "head", "options")

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get("unread", "").lower() == "true":
            queryset = queryset.filter(read_at__isnull=True)
        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="unread",
                type=bool,
                location=OpenApiParameter.QUERY,
                description="Quando true, retorna apenas notificações não lidas.",
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(request=None, responses=NotificationSerializer)
    @action(detail=True, methods=("patch",), url_path="read")
    def read(self, request, *args, **kwargs):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=("read_at",))
        return Response(self.get_serializer(notification).data)

    @extend_schema(
        request=None,
        responses={status.HTTP_200_OK: ReadAllNotificationsResponseSerializer},
    )
    @action(detail=False, methods=("post",), url_path="read-all")
    def read_all(self, request, *args, **kwargs):
        updated = (
            self.get_queryset()
            .filter(read_at__isnull=True)
            .update(read_at=timezone.now())
        )
        return Response({"updated": updated})
