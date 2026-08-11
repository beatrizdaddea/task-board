# ADR 003: Autenticação JWT

## Contexto

A API precisa autenticar clientes sem manter sessões no servidor e oferecer
renovação de credenciais.

## Decisão

Usar `djangorestframework-simplejwt` com access e refresh tokens. O DRF usa JWT
como autenticação padrão e exige usuário autenticado por padrão; registro, login
e refresh são explicitamente públicos.

## Motivo

A biblioteca é consolidada, integra-se ao Django REST Framework e evita uma
implementação própria de emissão e validação criptográfica de tokens.

## Consequências

Clientes devem enviar o access token como Bearer e renová-lo com o refresh token.
Revogação e rotação de refresh tokens não fazem parte desta etapa e podem ser
configuradas posteriormente se o risco do produto exigir.
