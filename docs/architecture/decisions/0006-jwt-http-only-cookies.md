# ADR-0006: JWT em cookies HttpOnly

## Status

Aceito

## Contexto

O TaskBoard já utilizava SimpleJWT, mas o frontend persistia o access token em `localStorage`. Esse armazenamento permite que JavaScript leia a credencial e amplia o impacto de uma vulnerabilidade XSS. A migração precisava manter JWT e preservar clientes Bearer sem expor access ou refresh no corpo das respostas do navegador.

Cookies enviados automaticamente introduzem risco de CSRF. A solução também precisa funcionar entre frontend e API em origens locais distintas, sem liberar CORS indiscriminadamente.

## Decisão

Armazenar access e refresh JWT em cookies separados com `HttpOnly`. O access cookie usa path `/api/`; o refresh fica restrito a `/api/v1/auth/`. `Secure` vem de `JWT_COOKIE_SECURE` e deve ser habilitado sob HTTPS. `SameSite` vem de `JWT_COOKIE_SAMESITE`, com `Lax` no desenvolvimento atual.

`CookieJWTAuthentication` lê o access cookie e delega assinatura, expiração e usuário ao SimpleJWT. Bearer permanece aceito como compatibilidade. Login, refresh e logout usam a proteção CSRF do Django. O frontend obtém o cookie CSRF e envia `X-CSRFToken` nas operações inseguras. CORS permite credenciais somente para `CORS_ALLOWED_ORIGINS`, e as origens confiáveis de CSRF são explícitas.

Login e refresh não retornam JWT no corpo. Logout remove os dois cookies e coloca o refresh na blacklist quando ele é válido.

## Motivos

- reduzir a exposição direta dos tokens ao JavaScript;
- manter emissão e validação na biblioteca existente;
- separar escopo e duração de access e refresh;
- manter CSRF e CORS explícitos em vez de desativar proteções globais.

## Consequências

### Positivas

- scripts do frontend não leem os JWTs;
- o refresh pode permanecer disponível sem ser persistido pelo código React;
- logout invalida o refresh apresentado e expira as credenciais do navegador.

### Negativas / Trade-offs

- `HttpOnly` não elimina XSS: scripts injetados ainda podem emitir ações usando a sessão;
- autenticação por cookie exige CSRF correto, origens CORS explícitas e `credentials: include`;
- produção exige HTTPS e `Secure=true`; cenários cross-site podem exigir rever `SameSite` e, consequentemente, a exposição a CSRF.

## Alternativas consideradas

### localStorage

Era a alternativa anterior e simplificava Bearer, mas deixava o token acessível a JavaScript. Não foi mantida.

### Sessão Django

Ofereceria cookie de sessão e integração madura com CSRF, mas mudaria o mecanismo de autenticação e o contrato existente. JWT foi preservado conforme o escopo.

### JWT somente no header Authorization

Continua disponível para compatibilidade, mas exigiria que o cliente JavaScript tivesse acesso ao token para montar o header.
