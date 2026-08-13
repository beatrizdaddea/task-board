# Arquitetura do TaskBoard

## Visão geral

O TaskBoard é uma aplicação full stack organizada como monólito modular. Frontend React e API Django são aplicações separadas no mesmo repositório e se comunicam por HTTP/JSON.

```text
React + TypeScript
        |
        | HTTP/REST, cookies JWT e CSRF
        v
Django REST Framework
        |
        | serializers, permissions e services pontuais
        v
    Django ORM
        |
        v
    PostgreSQL
```

Docker Compose orquestra frontend, backend e PostgreSQL no desenvolvimento. Os E2E usam uma configuração Django isolada com SQLite.

## Componentes principais

### Frontend

`src/app` concentra providers e rotas; `src/features` separa `auth`, `tasks`, `categories`, `sharing` e `notifications`; `src/shared` contém UI e infraestrutura reutilizável.

TanStack Query gerencia estado remoto. O wrapper central de `fetch` inclui credenciais e CSRF, trata erros e coordena refresh. O frontend mantém apenas os dados públicos do usuário autenticado em memória e restaura a sessão consultando `/auth/me/`; JWTs não ficam disponíveis ao JavaScript.

### Accounts e autenticação

O app `accounts` contém o usuário derivado de `AbstractUser`, cadastro e endpoints de CSRF, login, refresh, logout e usuário atual. O SimpleJWT continua emitindo e validando os tokens.

`CookieJWTAuthentication` preserva Bearer para clientes compatíveis e, na ausência do header, lê o access cookie, delega a validação ao SimpleJWT e aplica a checagem CSRF do Django. Login e refresh enviam tokens somente em cookies HttpOnly. A blacklist instalada permite invalidar o refresh no logout.

### Categorias

`CategoryViewSet.get_queryset()` restringe consultas ao owner. O serializer impede nomes repetidos por usuário, sem diferenciar maiúsculas. Excluir uma categoria remove em cascata as tarefas associadas.

### Tarefas e compartilhamento

O app `tasks` implementa CRUD, filtros, busca, ordenação e paginação de dez itens. A listagem combina tarefas próprias e compartilhadas e carrega os relacionamentos usados na resposta com consultas otimizadas.

`TaskShare` registra um acesso `read` ou `edit`. Services concentram criação, alteração e remoção desses acessos; permissions do DRF são a autoridade de autorização. Um compartilhamento efetivamente criado chama o serviço de notificação na mesma transação.

### Notificações

O app `notifications` registra destinatário, tipo, tarefa opcional, mensagem, criação e `read_at`. A API sempre filtra por `request.user` e permite listar, marcar uma e marcar todas como lidas.

O service de vencimentos classifica tarefas abertas usando `due_date` e `timezone.now()`. `process_due_notifications` é idempotente por `get_or_create` e por uma constraint parcial para destinatário, tarefa e tipo. O management command de mesmo propósito apenas chama esse service e informa a contagem criada.

### Persistência e integrações

PostgreSQL é o banco principal. Migrations mantêm schema, constraints e relacionamentos. O app `integrations` não possui serviço externo implementado. Não há Celery, Redis, envio de e-mail ou scheduler interno.

## Fluxos principais

### Requisição autenticada

```text
Componente React
  -> hook TanStack Query
  -> httpClient (credentials + X-CSRFToken quando necessário)
  -> View/ViewSet e permission
  -> Serializer
  -> service, quando aplicável
  -> Django ORM
```

### Expiração do access token

```text
Request -> 401 -> refreshPromise compartilhada -> POST /auth/refresh/
  -> sucesso: repetir cada request uma vez
  -> falha: limpar usuário/cache e apresentar login
```

Login, refresh e logout são excluídos do refresh automático para impedir recursão.

### Processamento de vencimentos

```text
Agendador externo ou operador
  -> manage.py process_due_notifications
  -> notifications.services.process_due_notifications
  -> tarefas abertas elegíveis
  -> Notification.get_or_create
  -> quantidade criada
```

## Segurança

- cookies HttpOnly reduzem a exposição direta dos JWTs ao JavaScript, mas não eliminam XSS;
- access e refresh possuem cookies, durações e paths separados; `Secure` e `SameSite` são configuráveis por ambiente;
- operações inseguras autenticadas por cookie passam pela proteção CSRF do Django;
- CORS permite credenciais somente para origens explicitamente configuradas;
- querysets e permissions restringem Task, Category, TaskShare e Notification;
- owner e recipient não são selecionáveis pelo payload;
- o refresh token é removido e, quando válido, colocado na blacklist durante logout;
- segredos e origens são lidos do ambiente.

## Trade-offs

- cookies HttpOnly reduzem o acesso ao token por scripts, mas exigem configuração coordenada de CSRF, CORS, HTTPS e `SameSite`;
- o refresh reativo simplifica a sessão sem timers, ao custo de uma primeira resposta `401` quando o access expira;
- o comando de vencimentos é simples, testável e adequado ao escopo, mas depende de execução externa periódica e não oferece garantias próprias de agendamento;
- um monólito modular e o Django ORM mantêm baixo custo operacional, compartilhando processo, banco e implantação;
- REST atende aos contratos atuais sem introduzir GraphQL ou comunicação distribuída.

As decisões aceitas estão em [Architecture Decision Records](./decisions/README.md).
