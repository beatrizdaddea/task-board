# ADR-0007: Refresh automático reativo no frontend

## Status

Aceito

## Contexto

O access JWT tem vida curta. Como o cookie é HttpOnly, o frontend não deve ler o token nem calcular sua expiração. Requisições simultâneas podem receber `401` ao mesmo tempo e disparar refreshes redundantes.

## Decisão

Centralizar no wrapper de `fetch` o fluxo `401 → POST /auth/refresh/ → repetir a requisição original`. Cada request pode ser repetido no máximo uma vez.

Uma `refreshPromise` compartilhada representa o refresh em andamento. O primeiro `401` inicia a operação; os demais aguardam a mesma Promise. Em sucesso, cada request é repetido. Em falha, o estado autenticado e o cache remoto são limpos. A referência é removida em `finally`.

Login, refresh e logout são chamados com refresh automático desabilitado. Na inicialização, o app prepara CSRF e consulta `/auth/me/`; um `401` nesse endpoint participa do mesmo fluxo antes de o usuário ser tratado como visitante.

## Motivos

- reagir à resposta real do servidor sem ler JWTs ou manter timers;
- impedir múltiplos refreshes simultâneos;
- concentrar autenticação no cliente HTTP, não nos componentes;
- limitar retries e evitar loops.

## Consequências

### Positivas

- componentes e hooks não implementam renovação;
- requisições concorrentes compartilham uma única tentativa;
- recarregar a aplicação restaura a sessão a partir do backend.

### Negativas / Trade-offs

- a primeira chamada após expiração recebe `401` antes de ser repetida;
- todas as requisições aguardando falham juntas quando o refresh falha;
- não há renovação preventiva em períodos sem atividade.

## Alternativas consideradas

### Timer baseado na expiração

Exigiria expor ou duplicar metadados do token e coordenar timers. Não é necessário para o fluxo atual.

### Refresh independente por request

É mais simples localmente, mas provoca chamadas concorrentes e possíveis conflitos caso rotação seja habilitada.
