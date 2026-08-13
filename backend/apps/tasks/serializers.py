from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.categories.models import Category
from apps.tasks.models import Task, TaskShare

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    category = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Category.objects.none(),
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "completed",
            "priority",
            "due_date",
            "category",
            "category_name",
            "is_shared",
            "permissions",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_is_shared(self, task: Task) -> bool:
        if hasattr(task, "has_shares"):
            return task.has_shares
        return task.shares.exists()

    def get_category_name(self, task: Task) -> str | None:
        return task.category.name if task.category else None

    def get_permissions(self, task: Task) -> dict[str, bool]:
        user = self.context["request"].user
        is_owner = task.owner_id == user.pk
        shares = getattr(task, "current_user_shares", ())
        can_edit = is_owner or any(
            share.permission == TaskShare.Permission.EDIT for share in shares
        )

        return {
            "can_edit": can_edit,
            "can_edit_category": is_owner,
            "can_delete": is_owner,
            "can_change_status": can_edit,
            "can_view_shares": True,
            "can_manage_shares": is_owner,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")

        if request is not None and request.user.is_authenticated:
            category_owner_id = (
                self.instance.owner_id
                if isinstance(self.instance, Task)
                else request.user.pk
            )
            self.fields["category"].queryset = Category.objects.filter(
                owner_id=category_owner_id
            )

    def validate(self, attrs):
        request = self.context["request"]

        if (
            isinstance(self.instance, Task)
            and self.instance.owner_id != request.user.pk
            and "category" in self.initial_data
        ):
            raise serializers.ValidationError(
                {"category": "Somente o owner pode alterar a categoria."}
            )

        return attrs


class TaskShareCreateSerializer(serializers.Serializer):
    user_email = serializers.EmailField()
    permission = serializers.ChoiceField(choices=TaskShare.Permission.choices)

    def validate(self, attrs):
        try:
            attrs["user"] = User.objects.get(email=attrs["user_email"])
        except User.DoesNotExist as error:
            raise serializers.ValidationError(
                {"user_email": "Usuário não encontrado."}
            ) from error

        return attrs


class TaskShareSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = TaskShare
        fields = ("id", "task", "user_email", "permission", "created_at")
        read_only_fields = ("id", "task", "user_email", "created_at")

    def validate(self, attrs):
        if self.instance is not None and "permission" not in attrs:
            raise serializers.ValidationError(
                {"permission": "Este campo é obrigatório."}
            )

        return attrs
