# ADR-0002: Modelo de usuário customizado

## Status

Aceito

## Contexto

Relacionamentos de categorias, tarefas e compartilhamentos dependem do usuário.
Substituir o model de autenticação depois dessas migrations seria complexo.

## Decisão

Usar `accounts.User`, baseado em `AbstractUser`, desde a migration inicial. O
`username` permanece como identificador do login e o `email` também é único.
Relacionamentos referenciam `settings.AUTH_USER_MODEL`.

## Motivos

- preserva o sistema de autenticação e os validadores do Django;
- permite acrescentar campos de usuário sem trocar o model no futuro;
- a unicidade do e-mail permite identificar destinatários do compartilhamento.

## Consequências

### Positivas

- extensão futura do usuário permanece possível;
- não existe uma implementação própria de senha ou autenticação.

### Negativas / Trade-offs

- login continua baseado em `username`, embora compartilhamentos usem e-mail;
- todos os apps devem usar `AUTH_USER_MODEL` ou `get_user_model()`.

## Alternativas consideradas

### Usuário padrão do Django

Atenderia ao estado inicial, mas tornaria uma substituição posterior mais difícil.

### Autenticação por e-mail

Não foi escolhida porque exigiria alterar explicitamente `USERNAME_FIELD` e o
contrato de login; o sistema atual autentica por username.
