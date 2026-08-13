# ADR-0008: Processamento de vencimentos por management command

## Status

Aceito

## Contexto

O TaskBoard precisa criar notificações para tarefas abertas próximas do vencimento ou atrasadas. `Task.due_date` é uma data, sem horário. A rotina deve ser reutilizável, testável e idempotente, mas o projeto não possui infraestrutura assíncrona.

## Decisão

Centralizar a classificação e criação em `apps.notifications.services.process_due_notifications`, usando `django.utils.timezone.now()` e a data local configurada.

Uma tarefa aberta recebe `TASK_OVERDUE` quando `due_date` é anterior à data local atual. Ela recebe `TASK_DUE_SOON` quando vence hoje ou até a data local alcançada nas próximas 24 horas. O owner é o destinatário. `get_or_create` e uma constraint parcial por destinatário, tarefa e tipo tornam execuções repetidas idempotentes.

Expor `python manage.py process_due_notifications` como adaptador operacional. O comando apenas chama o service e informa quantas notificações foram criadas. A periodicidade fica a cargo de cron ou do agendador da plataforma de implantação.

## Motivos

- manter a regra fora do comando e das views;
- aproveitar infraestrutura e observabilidade básicas do Django;
- permitir execução local e em CI sem novos serviços;
- manter a solução proporcional ao teste técnico.

## Consequências

### Positivas

- rotina determinística, idempotente e coberta por testes;
- nenhuma dependência adicional de fila ou broker;
- o mesmo service pode ser chamado por outro agendador no futuro.

### Negativas / Trade-offs

- o projeto não garante periodicidade por si só;
- falhas dependem do monitoramento do ambiente que executa o comando;
- como o prazo é `DateField`, a janela de 24 horas é interpretada em datas locais, não em um instante exato.

## Alternativas consideradas

### Celery e Redis

Ofereceriam scheduler, retries e workers, mas acrescentariam broker, processos e operação desproporcionais ao escopo atual.

### Criar notificações durante requisições HTTP

Acoplaria o resultado à navegação do usuário e espalharia comparações de data em views, sem garantir processamento para tarefas não acessadas.
