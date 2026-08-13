# ADR-0005: Exclusão em cascata de categorias

## Status

Aceito

## Contexto

Uma categoria organiza tarefas do mesmo owner. A regra atual determina que
remover essa categoria também remove definitivamente as tarefas associadas, sem
afetar tarefas sem categoria ou vinculadas a outras categorias.

## Decisão

Configurar `Task.category` com `on_delete=models.CASCADE`, preservando
`null=True` e `blank=True`. Assim, tarefas podem existir sem categoria, mas uma
categoria removida leva consigo apenas as tarefas que ainda a referenciam.

O frontend alerta sobre a consequência destrutiva e invalida os caches de
categorias e tarefas depois da exclusão.

## Motivos

- corresponde à regra de domínio implementada e apresentada ao usuário;
- delega integridade referencial ao ORM e ao banco;
- evita manter tarefas cuja categoria removida fazia parte do contexto esperado.

## Consequências

### Positivas

- a operação é atômica e não deixa tarefas associadas órfãs;
- não é necessário remover tarefas manualmente na view.

### Negativas / Trade-offs

- excluir uma categoria é destrutivo e exige confirmação clara;
- recuperar as tarefas exige backup ou outro mecanismo externo, inexistente hoje.

## Alternativas consideradas

### SET_NULL

Preservaria as tarefas removendo somente a associação. Não atende à regra atual
de que o conteúdo da categoria deve ser excluído junto dela.

### PROTECT

Impediria excluir categorias em uso e exigiria que o usuário removesse ou
movesse todas as tarefas antes, fluxo que a interface atual não implementa.
