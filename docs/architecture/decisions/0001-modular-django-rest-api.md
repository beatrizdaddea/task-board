# ADR-0001: Monólito modular com Django REST Framework

## Status

Aceito

## Contexto

O TaskBoard precisa entregar autenticação, categorias, tarefas e
compartilhamento em um teste técnico, mantendo baixo custo operacional e
fronteiras de código compreensíveis.

## Decisão

Adotar um monólito modular em Django, com apps por domínio e uma API REST criada
com Django REST Framework. O frontend React permanece uma aplicação separada no
mesmo repositório e consome a API por HTTP/JSON.

## Motivos

- Django e DRF oferecem ORM, migrations, autenticação, serializers, permissions
  e routers adequados ao CRUD do sistema;
- apps `accounts`, `categories`, `tasks` e `integrations` mantêm limites claros
  sem impor comunicação distribuída;
- uma única implantação de backend é proporcional ao volume e ao escopo atuais.

## Consequências

### Positivas

- configuração, testes e transações permanecem simples;
- convenções do framework reduzem código de infraestrutura;
- domínios podem evoluir em apps separados sem antecipação de microserviços.

### Negativas / Trade-offs

- todos os domínios compartilham processo, banco e ciclo de implantação;
- um crescimento substancial pode exigir rever limites e acoplamentos entre apps.

## Alternativas consideradas

### Microserviços

Não foram escolhidos porque acrescentariam descoberta, comunicação, consistência
distribuída e múltiplas implantações sem demanda atual.

### Django sem Django REST Framework

Exigiria implementar manualmente serialização, validação e contratos HTTP já
cobertos pelo DRF.
