# TaskBoard

Aplicação full stack de gerenciamento de tarefas. O backend expõe uma API REST
privada por usuário e o frontend usa uma arquitetura Feature-Based para manter
as regras de cada domínio próximas de suas telas, hooks e serviços.

## Stack

- Backend: Python, Django e Django REST Framework
- Frontend: React 19, TypeScript, Vite e React Router
- UI: shadcn/ui (preset Nova/Base UI) e Tailwind CSS 4
- Dados remotos: TanStack Query
- Formulários: React Hook Form, Zod e `@hookform/resolvers`
- Banco de dados: PostgreSQL
- Infraestrutura local: Docker e Docker Compose
- Qualidade: Ruff, Black, pytest, pytest-django, ESLint e Prettier

## Arquitetura frontend

O frontend é organizado por responsabilidade global e por feature:

```text
frontend/src/
├── app/
│   ├── providers/              # Providers globais, como TanStack Query
│   ├── router/                 # Rotas e composição das páginas
│   └── App.tsx
├── features/
│   └── auth/
│       ├── api/                # Chamadas HTTP da feature
│       ├── components/         # UI específica de autenticação
│       ├── context/            # Estado da sessão e AuthProvider
│       ├── hooks/              # Mutations e queries da feature
│       ├── pages/              # Páginas ligadas ao router
│       ├── schemas/            # Schemas Zod e tipos inferidos
│       └── types/              # Contratos de resposta do domínio
├── shared/
│   ├── components/             # shadcn/ui e reexportações padronizadas
│   ├── lib/                    # Client HTTP, tokens, QueryClient e helpers
│   └── types/                  # Tipos reutilizáveis entre features
└── main.tsx
```

As fronteiras previstas são `auth`, `tasks`, `categories` e `sharing`. Somente
`auth` existe nesta fase porque é o exemplo funcional solicitado; as demais
pastas serão criadas quando tiverem componentes, hooks, serviços ou tipos reais,
evitando diretórios vazios e abstrações prematuras.

### Decisões técnicas

- `app/` contém apenas composição global. Regras de negócio permanecem nas
  features.
- O shadcn/ui é mantido como código-fonte em `shared/components/ui`; o arquivo
  `shared/components/index.ts` oferece a API padronizada para consumo interno.
- O tema usa tokens semânticos no `src/index.css`. No Tailwind CSS 4, a extensão
  do tema é feita com `@theme inline`, portanto não há `tailwind.config.js` vazio
  apenas por convenção de versões anteriores.
- O TanStack Query gerencia estado remoto. Estado transitório de formulário fica
  no React Hook Form e não há Redux.
- Serviços por feature usam o wrapper central baseado em `fetch`; componentes
  não fazem requisições diretamente.
- O client adiciona headers comuns e o JWT às requisições autenticadas. Uma
  resposta `401` encerra a sessão e faz os guards redirecionarem para o login.
- Somente o access token fica em `localStorage`. O frontend valida a estrutura e
  o campo `exp` do JWT na inicialização e agenda o logout para sua expiração. O
  refresh token retornado pelo backend não é persistido nesta implementação.
- `localStorage` mantém a sessão entre abas e reinicializações do navegador, mas
  é acessível a JavaScript. Uma evolução para cookies `HttpOnly` exige suporte
  coordenado no backend e revisão da proteção contra CSRF.
- TypeScript opera em modo estrito e validações de formulário usam schemas Zod
  próximos da feature.

## Executar localmente

Pré-requisitos: Node.js 20+, npm, Python 3.13+ e PostgreSQL, ou Docker com o
plugin Docker Compose.

### Com Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Serviços disponíveis:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- PostgreSQL: acessível internamente pelo serviço `db`

O backend aceita requisições do frontend somente para as origens listadas em
`CORS_ALLOWED_ORIGINS`. No ambiente local, o valor padrão do Compose é
`http://localhost:5173`. Após alterar dependências ou essa variável, recrie o
serviço com `docker compose up --build`.

Para encerrar, execute `docker compose down`.

### Frontend sem Docker

```bash
cd frontend
npm install
npm run dev
```

Copie as variáveis necessárias de `.env.example`. `VITE_API_BASE_URL` deve
apontar para a raiz versionada da API, por padrão
`http://localhost:8000/api/v1`.

Scripts disponíveis:

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run format
npm run format:check
npm run preview
```

## Componentes shadcn/ui

Os primitivos iniciais são `Button`, `Input`, `Select`, `Dialog`, `Spinner`,
`Skeleton`, `Empty`, `Pagination`, `Card`, `Field` e `Alert`, além das
dependências internas `Label` e `Separator`. Novos componentes devem ser
adicionados com a CLI oficial e mantidos dentro de `shared/components/ui`.

## API e autenticação

Fluxos disponíveis no frontend:

- `/register`: envia `username`, `email` e `password` para
  `POST /api/v1/auth/register/`. Erros de validação do DRF são apresentados no
  campo correspondente. Após sucesso, redireciona para `/login`.
- `/login`: envia `username` e `password` para
  `POST /api/v1/auth/login/`, armazena somente o access token e redireciona para
  `/dashboard` ou para a rota protegida originalmente solicitada.
- `/dashboard`: rota protegida. Sem token válido, redireciona para `/login`.
- `/login` e `/register`: rotas exclusivas para visitantes. Uma sessão válida
  redireciona diretamente para `/dashboard`.

Embora o cadastro também exija um e-mail único, o backend atual mantém
`username` como `USERNAME_FIELD` do Django e o endpoint JWT autentica por nome de
usuário. Login por e-mail requer uma alteração futura e explícita no backend.

O estado da sessão fica em `features/auth/context`, mutations ficam em
`features/auth/hooks` e chamadas HTTP em `features/auth/api`. Novas features
devem repetir essa separação apenas quando tiverem código real, mantendo UI,
schemas, tipos e serviços próximos do domínio que os utiliza.

A documentação completa dos endpoints está em `docs/api/`.

### CORS

`CORS_ALLOWED_ORIGINS` recebe uma lista separada por vírgulas contendo esquema,
host e porta completos, por exemplo:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://taskboard.example.com
```

A allowlist é aplicada somente às rotas `/api/`. Não use `*` em produção;
adicione explicitamente a origem em que o frontend estiver hospedado.

## Integração contínua

[![CI](https://github.com/beatrizdaddea/task-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/beatrizdaddea/task-flow/actions/workflows/ci.yml)

Em cada `push` e `pull request`, o GitHub Actions valida backend, frontend e os
builds dos Dockerfiles.

## Status

O backend possui autenticação JWT, CRUD privado de categorias e tarefas e
compartilhamento com permissões de leitura ou edição. O frontend possui login,
registro, persistência da sessão, logout e guards para rotas públicas e
protegidas.

## Decisões do domínio de tarefas

- Conclusão e reabertura alteram `completed` via `PATCH` no próprio recurso.
- O proprietário é sempre obtido do token JWT e não pode ser escolhido pelo
  payload.
- Categoria, descrição e data de vencimento são opcionais. A categoria precisa
  pertencer ao proprietário da tarefa; sua exclusão não remove as tarefas.
