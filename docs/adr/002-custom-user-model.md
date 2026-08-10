# ADR 002: Modelo de usuário customizado

## Contexto

O TaskBoard precisa permitir a evolução dos dados de autenticação sem substituir o
modelo de usuário depois que outras tabelas já dependerem dele.

## Decisão

Usar `accounts.User`, baseado em `AbstractUser`, desde a migration inicial. O
`username` permanece como identificador de autenticação e tanto ele quanto o
`email` são únicos.

## Motivo

Essa abordagem mantém compatibilidade com a autenticação do Django, evita uma
migração futura complexa e permite extensões pontuais sem criar uma solução de
autenticação própria.

## Consequências

Todos os relacionamentos com usuários devem usar `settings.AUTH_USER_MODEL` ou
`get_user_model()`. O login continua baseado em `username`; a unicidade do email
impede contas diferentes de compartilharem o mesmo endereço.
