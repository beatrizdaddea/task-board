from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.categories.models import Category
from apps.tasks.models import Task


class Command(BaseCommand):
    help = "Recria os dados determinísticos usados pelos testes E2E."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="selenium_e2e")
        parser.add_argument("--email", default="selenium.e2e@taskboard.local")
        parser.add_argument("--password", default="TaskBoard-E2E-2026!")
        parser.add_argument("--category", default="Categoria E2E")
        parser.add_argument("--disposable-category", default="Categoria E2E removível")
        parser.add_argument("--open-task", default="Tarefa E2E em aberto")
        parser.add_argument("--completed-task", default="Tarefa E2E concluída")
        parser.add_argument("--recipient-username", default="selenium_recipient")
        parser.add_argument(
            "--recipient-email", default="selenium.recipient@taskboard.local"
        )
        parser.add_argument("--recipient-password", default="Recipient-E2E-2026!")
        parser.add_argument("--signup-username-prefix", default="selenium_signup_")
        parser.add_argument("--signup-email-prefix", default="selenium.signup.")

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()
        user_model.objects.filter(
            username__startswith=options["signup_username_prefix"]
        ).delete()
        user_model.objects.filter(
            email__startswith=options["signup_email_prefix"]
        ).delete()
        user_model.objects.filter(username=options["username"]).delete()
        user_model.objects.filter(email=options["email"]).delete()
        user_model.objects.filter(username=options["recipient_username"]).delete()
        user_model.objects.filter(email=options["recipient_email"]).delete()

        user = user_model.objects.create_user(
            username=options["username"],
            email=options["email"],
            password=options["password"],
        )
        user_model.objects.create_user(
            username=options["recipient_username"],
            email=options["recipient_email"],
            password=options["recipient_password"],
        )
        category = Category.objects.create(
            owner=user,
            name=options["category"],
        )
        Category.objects.create(
            owner=user,
            name=options["disposable_category"],
        )
        Task.objects.create(
            owner=user,
            category=category,
            title=options["open_task"],
            description="Tarefa aberta criada pelo reset E2E.",
            priority=Task.Priority.MEDIUM,
        )
        Task.objects.create(
            owner=user,
            category=category,
            title=options["completed_task"],
            description="Tarefa concluída criada pelo reset E2E.",
            priority=Task.Priority.HIGH,
            completed=True,
        )

        self.stdout.write(self.style.SUCCESS("Dados E2E recriados com sucesso."))
