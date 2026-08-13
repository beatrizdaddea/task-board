# API de notificações

Todas as rotas exigem autenticação. O destinatário é sempre derivado de `request.user`; a API não aceita `recipient_id` ou outro seletor de usuário.

## Representação

```json
{
  "id": 12,
  "type": "TASK_SHARED",
  "task": 7,
  "message": "A tarefa \"Revisar relatório\" foi compartilhada com você.",
  "created_at": "2026-08-13T10:00:00-03:00",
  "read_at": null
}
```

Tipos atuais: `TASK_SHARED`, `TASK_DUE_SOON` e `TASK_OVERDUE`. `task` pode ser `null` se a tarefa relacionada for removida. `read_at = null` significa não lida.

## Listar

- Método: `GET`
- Rota: `/api/v1/notifications/`
- Query opcional: `unread=true`
- Response `200 OK`: lista de notificações do usuário atual, da mais recente para a mais antiga

A API não aplica paginação a esse ViewSet porque não há paginação global configurada no projeto.

## Marcar como lida

- Método: `PATCH`
- Rota: `/api/v1/notifications/{id}/read/`
- Request: sem corpo
- Response `200 OK`: notificação com `read_at` preenchido
- Erro: `404` para notificação inexistente ou de outro usuário

A operação é idempotente: uma notificação já lida preserva a data existente.

## Marcar todas como lidas

- Método: `POST`
- Rota: `/api/v1/notifications/read-all/`
- Request: sem corpo
- Response `200 OK`: `{"updated": 3}`

Somente notificações não lidas do usuário atual são atualizadas.

## Criação das notificações

Um novo `TaskShare` cria uma `TASK_SHARED` para o destinatário. Repetir uma operação que não cria um novo compartilhamento não cria outra notificação.

Notificações de prazo são criadas pelo comando idempotente:

```bash
python backend/manage.py process_due_notifications
```

Ele ignora tarefas concluídas, usa `django.utils.timezone.now()` e informa quantas notificações foram criadas.
