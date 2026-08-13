# Documentação da API

A especificação OpenAPI 3 é gerada com `drf-spectacular` a partir das rotas, serializers, filtros e permissions do Django REST Framework. Ela é a fonte principal do contrato HTTP; os documentos desta pasta complementam regras de negócio e segurança.

## Interfaces

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

## Autenticação

O SimpleJWT emite access e refresh JWT, armazenados em cookies separados com `HttpOnly`. Login e refresh não retornam tokens no corpo. O backend também aceita `Authorization: Bearer <access_token>` como compatibilidade para clientes não baseados em navegador.

Requisições autenticadas por cookie usam proteção CSRF nas operações inseguras. O cliente deve primeiro obter `/api/v1/auth/csrf/`, preservar os cookies e enviar `X-CSRFToken`. Chamadas cross-origin exigem uma origem explicitamente permitida e envio de credenciais.

## Recursos

- [Autenticação](./authentication.md)
- [Categorias](./categories.md)
- [Tarefas](./tasks.md)
- [Compartilhamento de tarefas](./task-sharing.md)
- [Notificações](./notifications.md)

## Desenvolvimento local

```bash
docker compose up --build
```

Sem Docker, configure PostgreSQL e as variáveis de `.env.example`:

```bash
python backend/manage.py migrate
python backend/manage.py runserver
```

Valide o schema sem versionar o artefato:

```bash
cd backend
python manage.py spectacular --file schema.yml --validate --fail-on-warn
```
