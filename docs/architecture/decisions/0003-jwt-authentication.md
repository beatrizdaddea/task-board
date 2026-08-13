# ADR-0003: Autenticação com JWT

## Status

Substituído pelo [ADR-0006](./0006-jwt-http-only-cookies.md)

## Contexto

O frontend React consome uma API separada e precisa autenticar chamadas sem usar
a sessão de templates do Django.

## Decisão

Usar `djangorestframework-simplejwt`. O login emite access e refresh tokens, e o
DRF valida o access token enviado como Bearer. Sem configuração `SIMPLE_JWT`
específica, aplicam-se os tempos atuais da biblioteca: cinco minutos para access
e um dia para refresh, sem rotação ou blacklist.

O frontend persiste somente o access token em `localStorage`, verifica sua
expiração e encerra a sessão ao expirar ou receber `401`. Embora a API exponha
refresh, o cliente atual não o armazena nem renova tokens automaticamente.

## Motivos

- SimpleJWT integra autenticação Bearer ao DRF;
- tokens permitem que frontend e API permaneçam desacoplados de sessões Django;
- evita implementar emissão e validação criptográfica no projeto.

## Consequências

### Positivas

- cada requisição protegida carrega sua credencial;
- Swagger reconhece o esquema JWT e permite testar endpoints protegidos.

### Negativas / Trade-offs

- `localStorage` é acessível por JavaScript e amplia o impacto de uma falha XSS;
- sem refresh automático, o usuário precisa autenticar novamente ao fim do access;
- tokens emitidos não possuem revogação ou rotação configuradas.

## Alternativas consideradas

### Sessão do Django

Exigiria cookies e tratamento de CSRF coordenado com o frontend separado.

### Cookies HttpOnly para tokens

Reduziriam a exposição a JavaScript, mas exigiriam alterar o contrato atual,
configurar `Secure` e `SameSite` e definir proteção contra CSRF.
