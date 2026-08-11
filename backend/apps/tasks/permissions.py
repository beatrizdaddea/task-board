from django.shortcuts import get_object_or_404
from rest_framework import permissions

from apps.tasks.models import Task, TaskShare


class TaskAccessPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: Task) -> bool:
        if obj.owner_id == request.user.pk:
            return True

        share_permission = (
            obj.shares.filter(user=request.user)
            .values_list("permission", flat=True)
            .first()
        )

        if request.method in permissions.SAFE_METHODS:
            return share_permission is not None

        return (
            request.method == "PATCH" and share_permission == TaskShare.Permission.EDIT
        )


class IsTaskOwnerForSharing(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        view.task = get_object_or_404(
            Task,
            pk=view.kwargs["task_id"],
            owner=request.user,
        )
        return True

    def has_object_permission(self, request, view, obj: TaskShare) -> bool:
        return obj.task_id == view.task.pk
