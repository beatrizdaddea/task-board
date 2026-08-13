from django.core.management.base import BaseCommand

from apps.notifications.services import process_due_notifications


class Command(BaseCommand):
    help = "Cria notificações para tarefas próximas do vencimento ou atrasadas."

    def handle(self, *args, **options):
        created_count = process_due_notifications()
        self.stdout.write(self.style.SUCCESS(f"Notificações criadas: {created_count}"))
