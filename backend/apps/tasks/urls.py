from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.tasks.views import TaskShareViewSet, TaskViewSet

router = DefaultRouter()
router.register("", TaskViewSet, basename="task")

task_share_collection = TaskShareViewSet.as_view({"get": "list", "post": "create"})
task_share_detail = TaskShareViewSet.as_view(
    {"patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("<int:task_id>/shares/", task_share_collection, name="task-share-list"),
    path(
        "<int:task_id>/shares/<int:pk>/",
        task_share_detail,
        name="task-share-detail",
    ),
    *router.urls,
]
