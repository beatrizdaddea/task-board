# ADR-0004: Autorização e compartilhamento de tarefas

## Status

Aceito

## Contexto

Tarefas são privadas por padrão, mas precisam ser compartilhadas com usuários
específicos sem transferir propriedade ou permitir administração indevida.

## Decisão

Manter o owner diretamente em `Task` e representar acessos adicionais por
`TaskShare`, único para cada par de tarefa e usuário. A permissão `read` concede
consulta; `edit` também permite editar campos comuns e mudar o status.

Querysets retornam apenas tarefas próprias ou compartilhadas. Permissions do DRF
validam cada objeto: somente o owner exclui, muda categoria e administra
compartilhamentos. O destinatário é localizado por e-mail exato, sem endpoint de
pesquisa pública de usuários.

## Motivos

- uma entidade explícita armazena permissão e data do acesso;
- autorização no backend impede que controles visuais sejam a única proteção;
- dois níveis atendem aos fluxos existentes sem uma matriz genérica de papéis.

## Consequências

### Positivas

- ownership permanece inequívoco;
- constraint de banco impede compartilhamentos duplicados;
- tarefas sem relação com o usuário não aparecem nos querysets.

### Negativas / Trade-offs

- consultas precisam combinar ownership e shares e eliminar duplicidades;
- novas capacidades podem exigir ampliar os níveis ou o modelo de permissão.

## Alternativas consideradas

### ManyToMany implícito

Não armazenaria o nível de acesso nem metadados do compartilhamento.

### Permissões somente no frontend

Não protegeriam a API contra requisições diretas ou IDs manipulados.
