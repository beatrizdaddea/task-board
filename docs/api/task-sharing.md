# API de compartilhamento de tarefas

O compartilhamento concede acesso explícito a uma tarefa sem transferir sua
propriedade. Todas as rotas exigem um access JWT válido por cookie ou Bearer. O
owner administra os acessos; usuários com `read` ou `edit` podem apenas listar
os compartilhamentos da tarefa que já conseguem acessar.

O destinatário é identificado por email porque este campo é único no domínio de
usuários. Não existe endpoint de pesquisa de usuários, evitando exposição de
listas, IDs ou outros dados pessoais. As respostas exibem apenas o email que o
owner informou, sem expor o ID do usuário.

## Níveis de permissão

| Ação                                        | Owner | `read` | `edit` |
| ------------------------------------------- | ----- | ------ | ------ |
| Visualizar a tarefa                         | Sim   | Sim    | Sim    |
| Editar campos da tarefa                     | Sim   | Não    | Sim    |
| Concluir ou reabrir                         | Sim   | Não    | Sim    |
| Alterar categoria                           | Sim   | Não    | Não    |
| Excluir a tarefa                            | Sim   | Não    | Não    |
| Listar compartilhamentos                    | Sim   | Sim    | Sim    |
| Criar, alterar ou remover compartilhamentos | Sim   | Não    | Não    |

Usuários com `edit` podem alterar `title`, `description`, `completed`,
`priority` e `due_date`. A categoria permanece exclusiva do owner porque deve
pertencer a ele.

## Representação

```json
{
  "id": 5,
  "task": 12,
  "user_email": "colaborador@example.com",
  "permission": "read",
  "created_at": "2026-08-11T14:30:00-03:00"
}
```

`id`, `task`, `user_email` e `created_at` são somente de leitura.

## Listar compartilhamentos

- Método: `GET`
- Rota: `/api/v1/tasks/{task_id}/shares/`
- Autenticação: obrigatória
- Autorização: owner ou usuário com compartilhamento `read`/`edit` na tarefa
- Parâmetro de rota: `task_id`, identificador inteiro da tarefa
- Request: sem corpo
- Response `200 OK`: lista de representações dos compartilhamentos
- Principais erros: `401 Unauthorized` sem token válido; `404 Not Found` para
  tarefa inexistente ou sem relação com o usuário

## Compartilhar tarefa

- Método: `POST`
- Rota: `/api/v1/tasks/{task_id}/shares/`
- Autenticação: obrigatória
- Autorização: somente o owner da tarefa
- Parâmetro de rota: `task_id`, identificador inteiro da tarefa
- Request:

```json
{
  "user_email": "colaborador@example.com",
  "permission": "read"
}
```

- Response `201 Created`: representação do compartilhamento criado
- Principais erros:
  - `400 Bad Request`: email inexistente, compartilhamento com o próprio owner,
    permissão inválida ou compartilhamento duplicado;
  - `401 Unauthorized`: token ausente ou inválido;
  - `404 Not Found`: tarefa inexistente ou que não pertence ao usuário.

Os valores aceitos para `permission` são `read` e `edit`.

Um compartilhamento criado também gera uma notificação interna `TASK_SHARED`
para o destinatário. Atualizar a tarefa ou repetir uma operação que não cria um
novo `TaskShare` não gera uma notificação adicional.

## Alterar permissão

- Método: `PATCH`
- Rota: `/api/v1/tasks/{task_id}/shares/{share_id}/`
- Autenticação: obrigatória
- Autorização: somente o owner da tarefa
- Parâmetros de rota: `task_id` e `share_id`, identificadores inteiros
- Request:

```json
{
  "permission": "edit"
}
```

- Response `200 OK`: representação atualizada do compartilhamento
- Principais erros: `400 Bad Request` para permissão ausente ou inválida;
  `401 Unauthorized` sem token válido; `404 Not Found` para tarefa não acessível
  ou compartilhamento que não pertence à tarefa indicada na URL

## Remover compartilhamento

- Método: `DELETE`
- Rota: `/api/v1/tasks/{task_id}/shares/{share_id}/`
- Autenticação: obrigatória
- Autorização: somente o owner da tarefa
- Parâmetros de rota: `task_id` e `share_id`, identificadores inteiros
- Request: sem corpo
- Response `204 No Content`: sem corpo
- Principais erros: `401 Unauthorized` sem token válido; `404 Not Found` para
  tarefa não acessível ou compartilhamento que não pertence à tarefa indicada
  na URL
