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
│   ├── auth/                   # Sessão, login e cadastro
│   ├── tasks/                  # Listagem, filtros e CRUD de tarefas
│   └── categories/             # Listagem e CRUD de categorias
├── shared/
│   ├── components/             # shadcn/ui e reexportações padronizadas
│   ├── lib/                    # Client HTTP, tokens, QueryClient e helpers
│   └── types/                  # Tipos reutilizáveis entre features
└── main.tsx
```

As fronteiras `auth`, `tasks`, `categories` e `sharing` possuem implementação
funcional e mantêm serviços, hooks, componentes e contratos próximos de cada
domínio.

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

Os primitivos iniciais são `Button`, `Input`, `Textarea`, `Select`, `Dialog`,
`AlertDialog`, `Badge`, `Spinner`, `Skeleton`, `Empty`, `Pagination`, `Card`,
`Field` e `Alert`, além das dependências internas `Label` e `Separator`. Novos
componentes devem ser adicionados com a CLI oficial e mantidos dentro de
`shared/components/ui`.

## API e autenticação

Fluxos disponíveis no frontend:

- `/register`: envia `username`, `email` e `password` para
  `POST /api/v1/auth/register/`. Erros de validação do DRF são apresentados no
  campo correspondente. Após sucesso, redireciona para `/login`.
- `/login`: envia `username` e `password` para
  `POST /api/v1/auth/login/`, armazena somente o access token e redireciona para
  `/dashboard` ou para a rota protegida originalmente solicitada.
- `/dashboard`: rota protegida com o gerenciamento de tarefas. Sem token válido,
  redireciona para `/login`.
- `/categories`: rota protegida com o gerenciamento das categorias do usuário.
- `/login` e `/register`: rotas exclusivas para visitantes. Uma sessão válida
  redireciona diretamente para `/dashboard`.

Embora o cadastro também exija um e-mail único, o backend atual mantém
`username` como `USERNAME_FIELD` do Django e o endpoint JWT autentica por nome de
usuário. Login por e-mail requer uma alteração futura e explícita no backend.

O estado da sessão fica em `features/auth/context`, mutations ficam em
`features/auth/hooks` e chamadas HTTP em `features/auth/api`. Novas features
devem repetir essa separação apenas quando tiverem código real, mantendo UI,
schemas, tipos e serviços próximos do domínio que os utiliza.

### Gerenciamento de tarefas

A página protegida usa exclusivamente a API REST existente:

- `GET /api/v1/tasks/` lista tarefas com `search`, `completed`, `category`,
  `priority` e `page`. A busca possui debounce de 400 ms e os filtros são
  processados no backend.
- `POST /api/v1/tasks/` cria; `PATCH /api/v1/tasks/{id}/` edita ou alterna
  `completed`; `DELETE /api/v1/tasks/{id}/` exclui após confirmação.
- `GET /api/v1/categories/` fornece as opções do formulário e do filtro.
- A paginação usa `count`, `next`, `previous` e `results` do DRF, com 10 itens
  por página conforme a configuração atual do backend.

O TanStack Query mantém o cache e invalida as listas após mutações. O formulário
reutilizável de criação e edição usa React Hook Form e Zod e mapeia os erros de
campo retornados pelo DRF.

A resposta de tarefas inclui `category_name`, `is_shared` e capacidades em
`permissions`. O frontend usa essas capacidades para ocultar edição, mudança de
status e exclusão quando não autorizadas; o backend permanece como autoridade
final e continua validando cada operação.

### Compartilhamento de tarefas

O owner abre o fluxo pelo botão “Compartilhar” no card, convida um usuário pelo
e-mail e escolhe `read` ou `edit`. O diálogo lista acessos, permite alterar a
permissão e exige confirmação antes de remover. As mutations invalidam a lista
`['shares', taskId]` e o cache de tarefas.

O contrato de tarefa expõe `can_view_shares` e `can_manage_shares`. Colaboradores
podem abrir “Acessos” e consultar a lista, mas somente o owner recebe formulário
e ações administrativas. A UI apenas reflete essas capacidades; o backend
continua validando cada `GET`, `POST`, `PATCH` e `DELETE`.

### Gerenciamento de categorias

A rota protegida `/categories` consome o CRUD em `/api/v1/categories/` e oferece
listagem, criação, edição e exclusão com confirmação. O formulário valida nomes
entre 3 e 100 caracteres e apresenta erros de duplicidade retornados pelo DRF.

`useCategories` é o ponto público da feature para leitura e também abastece o
filtro e o formulário de tarefas. As mutations invalidam os caches de categorias
e tarefas para refletir renomes ou exclusões sem duplicar chamadas HTTP.

O modelo usa `CASCADE` ao excluir uma categoria: todas as tarefas associadas são
removidas, enquanto tarefas sem categoria e tarefas de outras categorias
permanecem. A confirmação da interface alerta sobre essa remoção permanente.

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

## Testes E2E do frontend

Os testes em `frontend/e2e/` usam Selenium WebDriver com Chrome e cobrem login
com persistência de sessão, cadastro válido, conflito de e-mail, validações do
cadastro, criação, edição, conclusão, reabertura, filtro, compartilhamento e
exclusão de tarefas. O gerenciamento de categorias cobre criação, edição e
exclusão. Page Objects concentram as interações e os títulos de `describe` e
`it` seguem o padrão do projeto em inglês. Antes de cada cenário, o helper
autentica pela própria API, limpa apenas os recursos do usuário `selenium_e2e`
e recria as fixtures. Os arquivos são executados serialmente para evitar
concorrência durante esse reset.

Requisitos locais:

- backend disponível localmente ou pelo Docker;
- Node.js 22 e `npm ci` executado em `frontend/`;
- Google Chrome instalado. O Selenium Manager incluído no `selenium-webdriver`
  resolve o driver compatível automaticamente.

Para usar o backend no Docker, suba ou recrie os serviços a partir da raiz. A
recriação é necessária após alterar o CORS porque as variáveis do container são
definidas no momento da criação:

```bash
docker compose up -d --build --force-recreate db backend
docker compose exec backend python manage.py reset_e2e_data
```

Como alternativa sem Docker, o perfil `config.settings_e2e` usa
`backend/e2e.sqlite3`, separado do PostgreSQL de desenvolvimento e ignorado pelo
Git. Com o ambiente virtual ativado, migre e suba esse backend:

```bash
DJANGO_SETTINGS_MODULE=config.settings_e2e python backend/manage.py migrate
DJANGO_SETTINGS_MODULE=config.settings_e2e python backend/manage.py runserver 127.0.0.1:8000
```

Em outro terminal, suba o frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Execute em outro terminal a partir de `frontend/`:

```bash
npm run test:e2e
```

O modo visual é o padrão local. Para executar como no CI:

```bash
HEADLESS=true npm run test:e2e
```

No PowerShell, use `$env:HEADLESS='true'` antes do comando. `E2E_BASE_URL`
define a URL do frontend e `E2E_API_BASE_URL` define a API usada tanto para o
reset quanto pelo ambiente sob teste. Os padrões são, respectivamente,
`http://127.0.0.1:5173` e `http://localhost:8000/api/v1`.
Ao apontar para outra API, use a mesma URL em `VITE_API_BASE_URL` antes de
iniciar o Vite e em `E2E_API_BASE_URL` antes de executar a suíte.

Em modo visual, as ações aguardam 700 ms por padrão para que o fluxo possa ser
acompanhado. Ajuste a velocidade com `E2E_ACTION_DELAY`, em milissegundos:

```powershell
$env:HEADLESS='false'
$env:E2E_ACTION_DELAY='1200'
npm run test:e2e
```

Use `E2E_ACTION_DELAY=0` para execução sem atraso. O CI usa `HEADLESS=true` e
mantém atraso zero, preservando a velocidade do pipeline.

O reset rápido, executado antes de cada teste, também pode ser chamado com
`npm run e2e:reset`; ele usa a API e recria categorias e tarefas do usuário
fixo. Para limpar também os usuários técnicos de cadastro, execute o comando
Django `reset_e2e_data` mostrado acima. Ele remove `selenium_e2e` e usuários
cujo nome começa com `selenium_signup_`, recria o usuário fixo e suas fixtures,
sem truncar tabelas nem alterar outras contas. No backend SQLite, use:

```bash
DJANGO_SETTINGS_MODULE=config.settings_e2e python backend/manage.py reset_e2e_data
```

O workflow executa esse reset completo antes de iniciar os serviços e usa o
reset rápido pela API entre cenários.

O workflow `Frontend E2E` prepara o SQLite isolado, sobe backend e frontend,
aguarda os dois serviços e roda a suíte com Chrome headless.

## Status

O backend possui autenticação JWT, CRUD privado de categorias e tarefas e
compartilhamento com permissões de leitura ou edição. O frontend possui login,
registro, persistência da sessão, guards de rota e gerenciamento de tarefas com
busca, filtros, paginação, criação, edição, conclusão e exclusão, além do CRUD de
categorias integrado aos formulários de tarefas.
O frontend também oferece compartilhamento por e-mail, visualização de acessos e
gerenciamento de permissões pelo owner.

## Decisões do domínio de tarefas

- Conclusão e reabertura alteram `completed` via `PATCH` no próprio recurso.
- O proprietário é sempre obtido do token JWT e não pode ser escolhido pelo
  payload.
- Categoria, descrição e data de vencimento são opcionais. A categoria precisa
  pertencer ao proprietário da tarefa; sua exclusão não remove as tarefas.
