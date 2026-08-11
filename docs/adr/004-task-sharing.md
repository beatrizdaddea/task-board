# ADR 004: Compartilhamento explícito de tarefas

## Contexto

Tarefas precisam ser compartilhadas com usuários específicos sem transferir a
propriedade e sem conceder implicitamente poderes de administração.

## Decisão

Representar o acesso por uma entidade intermediária `TaskShare`, única para cada
par de tarefa e usuário. A entidade registra o nível `read` ou `edit` e a data
de criação. O owner continua armazenado diretamente na tarefa e não recebe um
registro de compartilhamento.

Somente o owner gerencia compartilhamentos. `read` concede visualização e
`edit` acrescenta edição dos campos comuns e mudança de status. Exclusão,
compartilhamento e alteração de categoria permanecem exclusivas do owner.

O destinatário é informado por email exato, que já é único no model de usuário.
Não será oferecida pesquisa pública de usuários nesta etapa.

## Motivo

A entidade explícita permite armazenar permissão e evoluir metadados sem um
ManyToMany implícito. Dois níveis cobrem os casos atuais e evitam uma matriz de
papéis desnecessária.

## Consequências

A listagem de tarefas combina propriedade e compartilhamento e elimina
duplicidades. A autorização de detalhe considera o nível do `TaskShare`,
enquanto operações de compartilhamento validam exclusivamente o owner. Uma
constraint no banco impede compartilhamentos duplicados.
