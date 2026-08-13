# ADR-0009: Quality gates e smoke test na integração contínua

## Status

Aceito

## Contexto

O TaskBoard já executava lint, testes backend, build frontend, build das imagens Docker e fluxos Selenium no GitHub Actions. Alguns comandos documentados para execução local, porém, não faziam parte da CI: testes unitários do frontend, verificação explícita de tipos, validação OpenAPI, detecção de migrations ausentes e medição de cobertura.

Além disso, construir os Dockerfiles separadamente não comprovava que os serviços definidos no Docker Compose iniciavam e se comunicavam. Os workflows também não limitavam duração, concorrência ou permissões do `GITHUB_TOKEN` explicitamente.

## Decisão

Usar a CI como gate obrigatório e reprodutível para as seguintes verificações:

- backend: Ruff, Black, migrations pendentes, migrations aplicáveis, Django system check, OpenAPI sem warnings, pytest e cobertura mínima de 90%;
- frontend: testes unitários, ESLint, typecheck e build de produção;
- containers: validação da configuração, inicialização do Docker Compose e smoke test HTTP do backend e frontend;
- E2E: tipagem e fluxos críticos Selenium no workflow dedicado.

Os workflows terão somente `contents: read`, timeout por job e cancelamento de execuções anteriores da mesma branch. Logs do Compose serão exibidos em falhas e os containers serão encerrados com `if: always()`.

## Motivos

- aproximar os checks locais e remotos;
- detectar migrations e contratos OpenAPI quebrados antes do merge;
- garantir que os testes unitários do frontend não sejam ignorados;
- comprovar o funcionamento conjunto dos containers, não apenas sua construção;
- impedir regressões relevantes de cobertura sem exigir 100%;
- reduzir consumo desnecessário de minutos e aplicar menor privilégio.

## Consequências

### Positivas

- feedback mais completo e rastreável em cada push e pull request;
- falhas de integração do Compose passam a ser detectadas automaticamente;
- execução obsoleta é cancelada quando um commit mais novo chega à mesma branch;
- o token automático não recebe permissões de escrita.

### Negativas / Trade-offs

- a CI principal passa a consumir mais tempo por iniciar o ambiente Compose;
- a cobertura mínima pode exigir ajuste consciente quando código estrutural legítimo for adicionado;
- o smoke test verifica disponibilidade básica, não substitui os testes funcionais ou E2E;
- não há entrega contínua: publicação de imagens e deploy permanecem fora do escopo atual.

## Alternativas consideradas

### Manter somente o build das imagens

É mais rápido, mas não detecta erros em variáveis, dependências, healthchecks, portas ou inicialização conjunta dos serviços.

### Exigir cobertura de 100%

Criaria incentivo para testes de baixo valor e acoplados à implementação. O limite de 90% preserva uma margem pragmática e ainda bloqueia quedas relevantes.

### Adicionar deploy ao mesmo workflow

Transformaria a CI em CD e exigiria credenciais, ambiente e estratégia de rollback. Essa decisão deve ser tomada separadamente quando houver um destino de implantação definido.
