# API de autenticação

O navegador autentica por cookies JWT. Access e refresh são `HttpOnly`, portanto não podem ser lidos pelo frontend. Os endpoints que alteram estado exigem o cookie `csrftoken` e o header `X-CSRFToken` correspondente.

Por padrão do SimpleJWT utilizado no projeto, o access dura cinco minutos e o refresh dura um dia. Rotação não está habilitada na configuração atual; quando habilitada pela biblioteca, o endpoint atualiza também o refresh cookie. A blacklist está instalada e o logout invalida o refresh apresentado.

## Preparar CSRF

- Método: `GET`
- Rota: `/api/v1/auth/csrf/`
- Autenticação: pública
- Response `200 OK`: `{"detail": "CSRF cookie set."}` e `Set-Cookie: csrftoken=...`

O cookie CSRF não é `HttpOnly` porque o padrão double-submit do Django requer que o cliente copie seu valor para `X-CSRFToken`.

## Registrar usuário

- Método: `POST`
- Rota: `/api/v1/auth/register/`
- Autenticação: pública
- Request:

```json
{
  "username": "beatriz",
  "email": "beatriz@example.com",
  "password": "safe-password-123"
}
```

- Response `201 Created`: `id`, `username` e `email`
- Erros: `400` para dados inválidos, senha rejeitada ou identificador duplicado

`password` é somente de escrita.

## Login

- Método: `POST`
- Rota: `/api/v1/auth/login/`
- Autenticação: pública; CSRF obrigatório
- Request: `username` e `password`
- Response `200 OK`:

```json
{
  "detail": "Login successful."
}
```

A resposta define `taskboard_access` no path `/api/` e `taskboard_refresh` no path `/api/v1/auth/`. Ambos usam `HttpOnly`, `SameSite` configurável e `Secure` conforme o ambiente. Nenhum JWT aparece no JSON.

## Usuário atual

- Método: `GET`
- Rota: `/api/v1/auth/me/`
- Autenticação: access cookie ou Bearer
- Response `200 OK`: `id`, `username` e `email`
- Erro: `401` sem access JWT válido

## Refresh

- Método: `POST`
- Rota: `/api/v1/auth/refresh/`
- Autenticação: refresh exclusivamente do cookie; CSRF obrigatório
- Request: sem corpo
- Response `200 OK`: `{"detail": "Token refreshed."}` e novo access cookie
- Erro: `401` para refresh ausente, inválido, expirado ou em blacklist

O corpo não aceita refresh token. Quando a rotação do SimpleJWT estiver habilitada, o novo refresh também é gravado no cookie.

## Logout

- Método: `POST`
- Rota: `/api/v1/auth/logout/`
- Autenticação: refresh cookie; CSRF obrigatório
- Response `204 No Content`

O endpoint tenta colocar o refresh na blacklist e expira os cookies de access e refresh nos mesmos paths usados na criação.

## Exemplo com curl

```bash
curl -c cookies.txt http://localhost:8000/api/v1/auth/csrf/
```

Copie o valor de `csrftoken` de `cookies.txt`:

```bash
curl -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: <csrf-token>" \
  -d '{"username":"beatriz","password":"safe-password-123"}' \
  http://localhost:8000/api/v1/auth/login/

curl -b cookies.txt http://localhost:8000/api/v1/auth/me/
```
