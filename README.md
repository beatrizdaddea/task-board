# TaskBoard

Aplicação full stack de gerenciamento de tarefas.

## Stack

- Backend: Python, Django e Django REST Framework
- Frontend: React, TypeScript e Vite
- Banco de dados: PostgreSQL
- Infraestrutura local: Docker e Docker Compose
- Qualidade: Ruff, Black, pytest, pytest-django e ESLint

## Estrutura inicial

```text
.
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── integrations/
│   │   └── tasks/
│   ├── config/
│   └── manage.py
├── frontend/
│   └── src/
│       └── app/
├── docs/
│   └── adr/
└── .github/
    └── workflows/
```

O backend segue um monólito modular baseado em Django Apps. O frontend começa somente com a camada de composição em `src/app`; diretórios de features serão adicionados conforme as funcionalidades forem implementadas.

## Execução com Docker Compose

Pré-requisitos: Docker com o plugin Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Após a inicialização:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- PostgreSQL: disponível internamente para o backend no serviço `db`

Para encerrar os serviços, execute `docker compose down`.

## Integração contínua

[![CI](https://github.com/beatrizdaddea/task-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/beatrizdaddea/task-flow/actions/workflows/ci.yml)

Em cada `push` e `pull request`, o GitHub Actions valida o backend (Ruff, Black e pytest com PostgreSQL), o frontend (ESLint e build de produção) e os builds dos Dockerfiles.

## Status

Em desenvolvimento. Autenticação JWT e o CRUD privado de categorias estão
implementados, assim como o CRUD privado de tarefas. A documentação dos
endpoints está em `docs/api/`.

## Decisões do domínio de tarefas

- A conclusão e a reabertura alteram `completed` via `PATCH` no próprio recurso;
  não há endpoint específico para essa transição.
- O proprietário é sempre obtido do token JWT e não pode ser escolhido pelo
  payload.
- Categoria, descrição e data de vencimento são opcionais. Quando informada, a
  categoria precisa pertencer ao proprietário da tarefa. A exclusão de uma
  categoria não exclui suas tarefas; elas permanecem sem categoria.
