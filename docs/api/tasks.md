# API de tarefas

Todas as rotas exigem o header `Authorization: Bearer <access_token>`. Cada
usuário visualiza e manipula somente as próprias tarefas. Um ID inexistente ou
pertencente a outro usuário retorna `404 Not Found`.

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
- Parâmetros: nenhum
- Request: sem corpo
- Response `200 OK`: lista de representações das tarefas do usuário
- Principal erro: `401 Unauthorized` sem access token válido

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
  `404 Not Found` para tarefa inexistente ou pertencente a outro usuário

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
- Principais erros: `401 Unauthorized` sem access token válido; `404 Not Found`
  para tarefa inexistente ou pertencente a outro usuário
