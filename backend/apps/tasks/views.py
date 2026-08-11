from rest_framework import permissions, viewsets

from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
