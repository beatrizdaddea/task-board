# TaskBoard

> Aplicação full stack para organizar e compartilhar tarefas, com autorização por usuário, autenticação JWT em cookies HttpOnly e notificações internas.

![Python 3.13](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Django 5.2](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![Django REST Framework 3.16](https://img.shields.io/badge/DRF-3.16-A30000?logo=django&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![CI](https://github.com/beatrizdaddea/task-board/actions/workflows/ci.yml/badge.svg)

**Status:** funcional. Cadastro, autenticação, categorias, tarefas, compartilhamento e notificações internas estão implementados.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Como executar localmente](#como-executar-localmente)
- [Notificações de vencimento](#notificações-de-vencimento)
- [Testes](#testes)
- [API](#api)
- [Security Considerations](#security-considerations)
- [Decisões de design](#decisões-de-design)
- [Documentação](#documentação)
- [Autoria e contato](#autoria-e-contato)

## Sobre o projeto

O TaskBoard permite cadastrar uma conta e administrar tarefas privadas com prioridade, prazo e categoria. Tarefas podem ser concluídas, reabertas, pesquisadas, filtradas e compartilhadas com permissões de leitura ou edição.

Notificações internas informam novos compartilhamentos e vencimentos. A aplicação foi construída como teste técnico para uma vaga de Desenvolvedor(a) Python I e prioriza as convenções do Django/DRF e uma arquitetura proporcional ao escopo.

### Limites atuais

Não há recuperação de senha, login por e-mail, anexos, notificações por e-mail ou processamento automático em background. O comando de vencimentos deve ser executado manualmente ou por um agendador externo. O app `integrations` existe, mas não possui serviço externo ativo.

## Funcionalidades

- [x] Cadastro de usuário com e-mail único e validação de senha.
- [x] Login, refresh, logout e restauração da sessão com JWT em cookies HttpOnly.
- [x] Proteção CSRF para autenticação por cookie e CORS com origens explícitas.
- [x] CRUD privado de categorias e tarefas.
- [x] Busca, filtros, ordenação e paginação de tarefas.
- [x] Conclusão, reabertura e compartilhamento com permissões `read` e `edit`.
- [x] Isolamento por ownership e autorização de recursos compartilhados.
- [x] Exclusão em cascata das tarefas de uma categoria removida.
- [x] Notificações de compartilhamento, próximo vencimento e atraso.
- [x] Lista de notificações e ações para marcar uma ou todas como lidas.
- [x] OpenAPI, Swagger UI e ReDoc.
- [x] Testes backend com pytest e fluxos críticos E2E com Selenium.

## Tecnologias

| Tecnologia                                       | Uso atual                                 |
| ------------------------------------------------ | ----------------------------------------- |
| Python 3.13 e Django 5.2                         | Backend, models, ORM e migrations.        |
| Django REST Framework 3.16                       | API, serializers, ViewSets e permissions. |
| SimpleJWT 5.5                                    | Emissão, validação e blacklist de JWTs.   |
| drf-spectacular 0.30                             | OpenAPI 3, Swagger UI e ReDoc.            |
| PostgreSQL 17                                    | Banco principal no Docker Compose.        |
| React 19, TypeScript 5.8 e Vite 7                | Interface, tipagem e build.               |
| TanStack Query 5                                 | Estado remoto e invalidação de cache.     |
| Tailwind CSS 4 e componentes shadcn/ui           | Estilos e interface.                      |
| pytest, Selenium, Ruff, Black, ESLint e Prettier | Testes e qualidade.                       |

## Arquitetura

O backend é um monólito modular em apps Django. O frontend é organizado por features:

```text
TaskBoard/
├── backend/
│   ├── config/                 # settings e URLs globais
│   ├── apps/
│   │   ├── accounts/           # usuário e autenticação
│   │   ├── categories/         # categorias privadas
│   │   ├── tasks/              # tarefas e compartilhamentos
│   │   ├── notifications/      # notificações e vencimentos
│   │   └── integrations/       # fronteira sem integração ativa
│   └── tests/
├── frontend/
│   ├── src/features/           # auth, tasks, categories, sharing, notifications
│   ├── src/shared/             # UI e infraestrutura HTTP
│   └── e2e/                    # Selenium Page Objects e specs
└── docs/
```

```text
React / TanStack Query
  -> fetch central com cookies e CSRF
  -> Django REST Framework
  -> ViewSet + permission + serializer
  -> service quando há regra entre domínios
  -> Django ORM
  -> PostgreSQL
```

O wrapper HTTP envia `credentials: "include"`. Ao receber `401`, uma única tentativa compartilhada de refresh é feita; requisições simultâneas aguardam a mesma Promise. O backend continua sendo a autoridade de autorização, mesmo quando a interface oculta ações indisponíveis.

Mais detalhes em [Arquitetura do TaskBoard](docs/architecture/README.md).

## Como executar localmente

### Pré-requisitos

- Git;
- Docker com Docker Compose;
- ou Python 3.13+, Node.js 22+, npm e PostgreSQL 17 para execução manual;
- Chrome para os testes E2E.

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

No PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Serviços locais:

- frontend: `http://localhost:5173`;
- backend: `http://localhost:8000`;
- Swagger UI: `http://localhost:8000/api/docs/`;
- ReDoc: `http://localhost:8000/api/redoc/`.

### Execução manual

```bash
python -m venv .venv
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver
```

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

`VITE_API_BASE_URL` deve apontar para `http://localhost:8000/api/v1`. Use o mesmo hostname (`localhost` ou `127.0.0.1`) no frontend, no backend e nas origens confiáveis para evitar incompatibilidades de cookie e CSRF.

## Notificações de vencimento

O campo real de prazo é `Task.due_date` (`DateField`). Uma tarefa aberta recebe:

- `TASK_DUE_SOON` quando vence na data local atual ou até a data local alcançada nas próximas 24 horas;
- `TASK_OVERDUE` quando a data já passou.

O owner da tarefa é o destinatário. Tarefas concluídas são ignoradas e uma constraint evita duplicar o mesmo tipo de notificação para a mesma tarefa e destinatário.

Execute a rotina idempotente com:

```bash
python backend/manage.py process_due_notifications
```

Em produção, esse comando pode ser chamado periodicamente pelo agendador da plataforma. O projeto não inclui Celery, Redis ou um scheduler embutido.

## Testes

### Backend

```bash
cd backend
pytest
python manage.py check
python manage.py spectacular --file schema.yml --validate --fail-on-warn
ruff check .
black --check .
```

`schema.yml` é um artefato local ignorado pelo Git.

### Frontend

```bash
cd frontend
npm test
npm run lint
npm run typecheck
npm run build
```

### Integração contínua

Os workflows executam os mesmos checks relevantes em pushes e pull requests. A CI principal valida lint e formatação, migrations, Django, OpenAPI, testes backend com cobertura mínima de 90%, testes e build frontend e a inicialização conjunta do Docker Compose. Um workflow separado executa os fluxos críticos com Selenium.

Execuções anteriores da mesma branch são canceladas quando um commit mais novo é enviado. Os jobs possuem timeout e acesso somente de leitura ao conteúdo do repositório. Publicação de imagens e deploy não fazem parte da automação atual.

### E2E com Selenium

Com o backend em execução, inicie o frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Em outro terminal, também em `frontend/`:

```bash
npm run test:e2e
```

O modo visual é o padrão local. Para desacelerar as ações no PowerShell:

```powershell
$env:HEADLESS='false'
$env:E2E_ACTION_DELAY='1200'
npm run test:e2e
```

Para CI:

```powershell
$env:HEADLESS='true'
$env:E2E_ACTION_DELAY='0'
npm run test:e2e
```

## API

Base local: `http://localhost:8000/api/v1`

| Método                   | Rota                            | Autenticação          | Descrição                                        |
| ------------------------ | ------------------------------- | --------------------- | ------------------------------------------------ |
| `GET`                    | `/auth/csrf/`                   | Pública               | Define o cookie CSRF legível pelo cliente.       |
| `POST`                   | `/auth/register/`               | Pública               | Cadastra um usuário.                             |
| `POST`                   | `/auth/login/`                  | Pública + CSRF        | Define cookies de access e refresh.              |
| `POST`                   | `/auth/refresh/`                | Refresh cookie + CSRF | Renova os cookies sem expor tokens no corpo.     |
| `POST`                   | `/auth/logout/`                 | Refresh cookie + CSRF | Revoga o refresh e remove os cookies.            |
| `GET`                    | `/auth/me/`                     | JWT                   | Retorna o usuário autenticado.                   |
| `GET`, `POST`            | `/categories/`                  | JWT                   | Lista ou cria categorias próprias.               |
| `GET`, `PATCH`, `DELETE` | `/categories/{id}/`             | JWT                   | Consulta, edita ou exclui uma categoria própria. |
| `GET`, `POST`            | `/tasks/`                       | JWT                   | Lista tarefas acessíveis ou cria uma tarefa.     |
| `GET`, `PATCH`, `DELETE` | `/tasks/{id}/`                  | JWT                   | Opera sobre uma tarefa conforme a permissão.     |
| `GET`, `POST`            | `/tasks/{task_id}/shares/`      | JWT                   | Lista ou cria compartilhamentos.                 |
| `PATCH`, `DELETE`        | `/tasks/{task_id}/shares/{id}/` | JWT                   | Altera ou remove um compartilhamento.            |
| `GET`                    | `/notifications/`               | JWT                   | Lista somente notificações do usuário atual.     |
| `PATCH`                  | `/notifications/{id}/read/`     | JWT                   | Marca uma notificação própria como lida.         |
| `POST`                   | `/notifications/read-all/`      | JWT                   | Marca todas as notificações próprias como lidas. |

Os JWTs não são retornados pelo login ou refresh. Para um exemplo completo com `curl`, consulte [Autenticação](docs/api/authentication.md).

### Documentação interativa

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

## Security Considerations

- access e refresh JWT são armazenados em cookies separados com `HttpOnly`; isso reduz a exposição direta dos tokens ao JavaScript, mas não elimina XSS;
- `Secure` é controlado por `JWT_COOKIE_SECURE` e deve ser `true` com HTTPS; `SameSite` é configurável por ambiente e usa `Lax` no desenvolvimento;
- autenticação por cookie exige CSRF nas requisições inseguras. O frontend obtém `csrftoken` e envia `X-CSRFToken` centralmente;
- CORS aceita somente `CORS_ALLOWED_ORIGINS`, permite credenciais e não usa wildcard;
- o refresh cookie é restrito a `/api/v1/auth/`; o access cookie é restrito a `/api/`;
- logout tenta colocar o refresh token na blacklist e remove ambos os cookies;
- owner e destinatário de notificação vêm de `request.user` ou da regra de domínio, nunca de campos controlados pelo cliente;
- querysets e permissions isolam `Task`, `Category`, `TaskShare` e `Notification` por usuário;
- segredos e origens são configurados por ambiente. Os valores de `.env.example` são apenas para desenvolvimento.

Riscos restantes: uma origem frontend comprometida ainda pode emitir ações em nome do usuário; CSP, endurecimento de cookies e HTTPS dependem do ambiente de implantação. A aplicação não deve ser descrita como livre de vulnerabilidades.

## Decisões de design

- monólito modular e Django ORM mantêm a solução simples e transacional;
- JWT permanece o mecanismo de autenticação, com transporte por cookies HttpOnly;
- o refresh automático usa `401 → refresh → uma repetição`, com uma Promise compartilhada;
- notificações de compartilhamento são criadas no service da operação, não nas views;
- notificações de vencimento são processadas por management command idempotente, sem Celery/Redis;
- a autorização continua obrigatoriamente no backend.

Os registros completos estão no [índice de ADRs](docs/architecture/decisions/README.md).

## Documentação

- [Documentação da API](docs/api/README.md)
- [Arquitetura](docs/architecture/README.md)
- [Architecture Decision Records](docs/architecture/decisions/README.md)
- [Autenticação](docs/api/authentication.md)
- [Categorias](docs/api/categories.md)
- [Tarefas](docs/api/tasks.md)
- [Compartilhamento](docs/api/task-sharing.md)
- [Notificações](docs/api/notifications.md)

## Autoria e contato

Desenvolvido por **Beatriz Chieffi**.

- [LinkedIn — Beatriz Chieffi](https://www.linkedin.com/in/beatriz-daddea/)
- [GitHub — Beatriz Chieffi](https://github.com/beatrizdaddea)
