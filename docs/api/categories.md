# API de categorias

Todas as rotas exigem o header `Authorization: Bearer <access_token>`. Cada
usuário visualiza e manipula somente as próprias categorias. Tentativas de
acessar uma categoria de outro usuário pelo ID retornam `404 Not Found`.

## Representação

```json
{
  "id": 1,
  "name": "Trabalho",
  "created_at": "2026-08-11T14:30:00-03:00",
  "updated_at": "2026-08-11T14:30:00-03:00"
}
```

`id`, `created_at` e `updated_at` são somente de leitura. `owner` é definido
pelo token autenticado e não é aceito no payload. O nome tem no máximo 100
caracteres e deve ser único para o usuário, sem diferenciar maiúsculas de
minúsculas.

## Listar categorias

- Método: `GET`
- Rota: `/api/v1/categories/`
- Autenticação: obrigatória
- Parâmetros: nenhum
- Request: sem corpo
- Response `200 OK`: lista de representações de categoria
- Principal erro: `401 Unauthorized` sem access token válido

## Criar categoria

- Método: `POST`
- Rota: `/api/v1/categories/`
- Autenticação: obrigatória
- Parâmetros: nenhum
- Request:

```json
{
  "name": "Trabalho"
}
```

- Response `201 Created`: representação da categoria criada
- Principais erros: `400 Bad Request` para nome vazio, maior que 100 caracteres
  ou duplicado; `401 Unauthorized` sem access token válido

## Obter categoria

- Método: `GET`
- Rota: `/api/v1/categories/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da categoria
- Request: sem corpo
- Response `200 OK`: representação da categoria
- Principais erros: `401 Unauthorized` sem access token válido; `404 Not Found`
  para categoria inexistente ou pertencente a outro usuário

## Atualizar categoria

- Método: `PATCH`
- Rota: `/api/v1/categories/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da categoria
- Request:

```json
{
  "name": "Estudos"
}
```

- Response `200 OK`: representação atualizada da categoria
- Principais erros: `400 Bad Request` para nome inválido ou duplicado;
  `401 Unauthorized` sem access token válido; `404 Not Found` para categoria
  inexistente ou pertencente a outro usuário

## Excluir categoria

- Método: `DELETE`
- Rota: `/api/v1/categories/{id}/`
- Autenticação: obrigatória
- Parâmetro de rota: `id`, identificador inteiro da categoria
- Request: sem corpo
- Response `204 No Content`: sem corpo
- Principais erros: `401 Unauthorized` sem access token válido; `404 Not Found`
  para categoria inexistente ou pertencente a outro usuário
