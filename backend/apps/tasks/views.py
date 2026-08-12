from django.db.models import Exists, OuterRef, Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, permissions, status, viewsets
from rest_framework.response import Response

from apps.tasks.filters import TaskFilter
from apps.tasks.models import Task, TaskShare
from apps.tasks.pagination import TaskPagination
from apps.tasks.permissions import IsTaskOwnerForSharing, TaskAccessPermission
from apps.tasks.serializers import (
    TaskSerializer,
    TaskShareCreateSerializer,
    TaskShareSerializer,
)
from apps.tasks.services import remove_share, share_task, update_share_permission


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated, TaskAccessPermission)
    http_method_names = ("get", "post", "patch", "delete", "head", "options")
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    filterset_class = TaskFilter
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "due_date")
    pagination_class = TaskPagination

    def get_queryset(self):
        return (
            Task.objects.filter(
                Q(owner=self.request.user) | Q(shares__user=self.request.user)
            )
            .annotate(
                has_shares=Exists(TaskShare.objects.filter(task_id=OuterRef("pk")))
            )
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "shares",
                    queryset=TaskShare.objects.filter(user=self.request.user),
                    to_attr="current_user_shares",
                )
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskShareViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (permissions.IsAuthenticated, IsTaskOwnerForSharing)
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        return TaskShare.objects.filter(task=self.task).select_related("user")

    def get_serializer_class(self):
        if self.action == "create":
            return TaskShareCreateSerializer
        return TaskShareSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        share = share_task(
            task=self.task,
            user=serializer.validated_data["user"],
            permission=serializer.validated_data["permission"],
        )
        response_serializer = TaskShareSerializer(
            share,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        share = update_share_permission(
            share=serializer.instance,
            permission=serializer.validated_data["permission"],
        )
        serializer.instance = share

    def perform_destroy(self, instance):
        remove_share(share=instance)
