from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from apps.tasks.models import Task, TaskShare


def share_task(*, task: Task, user, permission: str) -> TaskShare:
    if task.owner_id == user.pk:
        raise ValidationError(
            {"user_email": "Uma tarefa não pode ser compartilhada com o owner."}
        )

    if TaskShare.objects.filter(task=task, user=user).exists():
        raise ValidationError(
            {"user_email": "A tarefa já foi compartilhada com este usuário."}
        )

    try:
        with transaction.atomic():
            return TaskShare.objects.create(
                task=task,
                user=user,
                permission=permission,
            )
    except IntegrityError as error:
        raise ValidationError(
            {"user_email": "A tarefa já foi compartilhada com este usuário."}
        ) from error


def update_share_permission(*, share: TaskShare, permission: str) -> TaskShare:
    share.permission = permission
    share.save(update_fields=("permission",))
    return share


def remove_share(*, share: TaskShare) -> None:
    share.delete()
