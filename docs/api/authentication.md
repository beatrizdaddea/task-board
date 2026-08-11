# API de autenticação

As rotas de autenticação são públicas. As demais rotas da API exigem, por
padrão, o header `Authorization: Bearer <access_token>`.

## Registrar usuário

- Método: `POST`
- Rota: `/api/v1/auth/register/`
- Autenticação: não necessária
- Parâmetros: nenhum
- Request:

```json
{
  "username": "beatriz",
  "email": "beatriz@example.com",
  "password": "safe-password-123"
}
```

- Response `201 Created`:

```json
{
  "id": 1,
  "username": "beatriz",
  "email": "beatriz@example.com"
}
```

- Principais erros: `400 Bad Request` para campos ausentes, dados inválidos,
  senha que não atende aos validadores ou username/email duplicados.

O campo `password` é somente de escrita e nunca integra a resposta.

## Login

- Método: `POST`
- Rota: `/api/v1/auth/login/`
- Autenticação: não necessária
- Parâmetros: nenhum
- Request:

```json
{
  "username": "beatriz",
  "password": "safe-password-123"
}
```

- Response `200 OK`:

```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>"
}
```

- Principal erro: `401 Unauthorized` para credenciais inválidas.

## Renovar access token

- Método: `POST`
- Rota: `/api/v1/auth/refresh/`
- Autenticação: não necessária; requer um refresh token válido
- Parâmetros: nenhum
- Request:

```json
{
  "refresh": "<refresh_token>"
}
```

- Response `200 OK`:

```json
{
  "access": "<novo_access_token>"
}
```

- Principais erros: `400 Bad Request` quando o campo `refresh` está ausente e
  `401 Unauthorized` quando o token é inválido ou expirou.
