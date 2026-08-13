from django.contrib.auth.models import AbstractBaseUser
from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from apps.notifications.services import notify_task_shared
from apps.tasks.models import Task, TaskShare


def share_task(*, task: Task, user: AbstractBaseUser, permission: str) -> TaskShare:
    if task.owner_id == user.pk:
        raise ValidationError(
            {"user_email": "Uma tarefa não pode ser compartilhada com o owner."}
        )

    with transaction.atomic():
        try:
            with transaction.atomic():
                share = TaskShare.objects.create(
                    task=task,
                    user=user,
                    permission=permission,
                )
        except IntegrityError as error:
            raise ValidationError(
                {"user_email": "A tarefa já foi compartilhada com este usuário."}
            ) from error

        notify_task_shared(task=task, recipient=user)
        return share


def update_share_permission(*, share: TaskShare, permission: str) -> TaskShare:
    share.permission = permission
    share.save(update_fields=("permission",))
    return share


def remove_share(*, share: TaskShare) -> None:
    share.delete()
