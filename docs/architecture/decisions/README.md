# Architecture Decision Records

Architecture Decision Records (ADRs) registram decisões técnicas relevantes,
seu contexto e seus trade-offs. Nesta pasta, ADRs com status **Aceito** representam
as decisões atuais do TaskBoard.

Um ADR aceito não deve ser reescrito para esconder a evolução do sistema. Quando
uma decisão mudar, um novo ADR deve substituir explicitamente o anterior.

## Índice

- [ADR-0001: Monólito modular com Django REST Framework](./0001-modular-django-rest-api.md)
- [ADR-0002: Modelo de usuário customizado](./0002-custom-user-model.md)
- [ADR-0003: Autenticação com JWT (substituído)](./0003-jwt-authentication.md)
- [ADR-0004: Autorização e compartilhamento de tarefas](./0004-task-authorization-and-sharing.md)
- [ADR-0005: Exclusão em cascata de categorias](./0005-category-cascade-deletion.md)
- [ADR-0006: JWT em cookies HttpOnly](./0006-jwt-http-only-cookies.md)
- [ADR-0007: Refresh automático reativo no frontend](./0007-reactive-session-refresh.md)
- [ADR-0008: Processamento de vencimentos por management command](./0008-due-notifications-management-command.md)
