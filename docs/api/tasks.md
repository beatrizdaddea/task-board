# API de tarefas

Todas as rotas exigem o header `Authorization: Bearer <access_token>`. A
listagem inclui tarefas próprias e tarefas compartilhadas com o usuário. Um ID
sem relação de propriedade ou compartilhamento retorna `404 Not Found`.

O owner possui acesso completo. Um compartilhamento `read` permite somente
leitura; `edit` também permite alterar campos comuns e concluir ou reabrir. A
categoria e a exclusão permanecem exclusivas do owner. O gerenciamento de
compartilhamentos está documentado em `docs/api/task-sharing.md`.

## Representação

```json
{
  "id": 1,
  "title": "Preparar relatório",
  "description": "Consolidar os resultados do mês.",
  "completed": false,
  "priority": "high",
  "due_date": "2026-08-20",
  "category": 2,
  "created_at": "2026-08-11T14:30:00-03:00",
  "updated_at": "2026-08-11T14:30:00-03:00"
}
```

`id`, `created_at` e `updated_at` são somente de leitura. `owner` não integra o
payload nem a resposta e é sempre obtido do token autenticado.

- `title`: obrigatório, com no máximo 200 caracteres;
- `description`: opcional; quando omitida, usa uma string vazia;
- `completed`: opcional; o padrão é `false`;
- `priority`: `low`, `medium` ou `high`; o padrão é `medium`;
- `due_date`: opcional, no formato `YYYY-MM-DD`;
- `category`: opcional; aceita o ID de uma categoria do próprio usuário ou
  `null`.

## Listar tarefas

- Método: `GET`
- Rota: `/api/v1/tasks/`
- Autenticação: obrigatória
- Query params opcionais:
  - `completed`: `true` ou `false`;
  - `category`: ID inteiro da categoria;
  - `priority`: `low`, `medium` ou `high`;
  - `search`: texto pesquisado em `title` e `description`;
  - `ordering`: `created_at`, `-created_at` ou `due_date`;
  - `page`: número da página.
- Request: sem corpo
- Response `200 OK`:

```json
{
  "count": 23,
  "next": "http://localhost:8000/api/v1/tasks/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Preparar relatório",
      "description": "Consolidar os resultados do mês.",
      "completed": false,
      "priority": "high",
      "due_date": "2026-08-20",
      "category": 2,
      "created_at": "2026-08-11T14:30:00-03:00",
      "updated_at": "2026-08-11T14:30:00-03:00"
    }
  ]
}
```

A página contém até 10 tarefas. Filtros, pesquisa e ordenação podem ser
combinados, por exemplo:

```text
/api/v1/tasks/?completed=false&category=2&priority=high
```

Prioridade inválida e categoria não numérica retornam `400 Bad Request`. Um
valor de `completed` diferente de `true` ou `false` é tratado como filtro vazio
pelo `BooleanFilter`. Campos de ordenação não permitidos são ignorados pelo DRF
e mantêm a ordenação padrão. Uma página inexistente retorna `404 Not Found`.

- Principais erros: `400 Bad Request` para filtro inválido; `401 Unauthorized`
  sem access token válido; `404 Not Found` para página inexistente

## Criar tarefa

- Método: `POST`
- Rota: `/api/v1/tasks/`
- Autenticação: obrigatória
- Parâmetros: nenhum
- Request:

```json
{
  "title": "Preparar relatório",
  "description": "Consolidar os resultados do mês.",
  "priority": "high",
  "due_date": "2026-08-20",
  "category": 2
}
```

- Response `201 Created`: representação da tarefa criada
- Principais erros: `400 Bad Request` para campos inválidos ou categoria que
  não pertence ao usuário; `401 Unauthorized` sem access token válido

## Obter tarefa

- Método: `GET`
- Rota: `/api/v1/tasks/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da tarefa
- Request: sem corpo
- Response `200 OK`: representação da tarefa
- Principais erros: `401 Unauthorized` sem access token válido; `404 Not Found`
  para tarefa inexistente ou pertencente a outro usuário

## Atualizar tarefa

- Método: `PATCH`
- Rota: `/api/v1/tasks/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da tarefa
- Request: objeto somente com os campos que devem ser alterados

```json
{
  "title": "Revisar relatório",
  "priority": "medium"
}
```

- Response `200 OK`: representação atualizada da tarefa
- Principais erros: `400 Bad Request` para campos inválidos ou categoria que
  não pertence ao usuário; `401 Unauthorized` sem access token válido;
  `403 Forbidden` para compartilhamento somente leitura; `404 Not Found` para
  tarefa sem relação com o usuário

Conclusão e reabertura usam este mesmo endpoint:

```json
{
  "completed": true
}
```

Envie `false` para reabrir a tarefa.

## Excluir tarefa

- Método: `DELETE`
- Rota: `/api/v1/tasks/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da tarefa
- Request: sem corpo
- Response `204 No Content`: sem corpo
- Principais erros: `401 Unauthorized` sem access token válido; `403 Forbidden`
  para qualquer usuário compartilhado; `404 Not Found` para tarefa sem relação
  com o usuário
