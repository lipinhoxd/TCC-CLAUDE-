# Processos automáticos (AGT-014)

Efetiva no banco, sem depender de alguém consultar ou gravar, a expiração da retenção (RF-022), a liberação da vaga por segunda
parcela não paga no prazo (RF-028) e a conclusão das reservas elegíveis (RF-036, RN-025). Aplica também uma regra adotada por
decisão do pesquisador (ver "Decisões").

## Como roda

| Forma | Quando |
| --- | --- |
| Dentro da API (`npm run dev:api` ou `npm run start:api`) | Na inicialização e a cada `ROTINA_INTERVALO_SEGUNDOS` (padrão **60**; de 1 a 86400; **0 desliga**). Para antes de o banco ser fechado no encerramento. |
| `npm run rotina` | Uma execução avulsa sobre o banco de `DATABASE_PATH` (aplica migrações pendentes antes). Código de saída 1 se algum passo falhar. Pode ser agendado no sistema operacional; o repositório não configura isso. |

As duas formas chamam `executarRotina` (`server/processos/rotina.ts`).

## Passos, na ordem

| Passo | Regra | Função |
| --- | --- | --- |
| Retenções expiradas | `expira_em` menor ou igual ao instante atual passa a `expirada`. A reserva não muda. | `expirarVencidas` |
| Segundas parcelas vencidas | Prazo (23:59:59 de Brasília) atingido: reserva cancelada por `inadimplencia`, vaga liberada, primeira parcela não reembolsável. | `vencerSegundasParcelas` |
| Reservas concluídas | "Pronto para embarque" com data final anterior a hoje (Brasília) passa a Concluída; a vaga continua ocupada. | `concluirReservas` |
| Reservas sem pagamento canceladas | "Aguardando pagamento", excursão já terminada (mesmo critério da conclusão) e **nenhum pagamento pendente ou confirmado**: Cancelada, retenção ativa cancelada, sem mexer em vagas. `motivo_cancelamento` fica nulo; a auditoria `reserva.cancelamento_automatico` guarda o motivo. | `cancelarSemPagamentoDeExcursaoTerminada` |

Os três primeiros são as mesmas funções da avaliação na leitura e na gravação, que **continua valendo**: as respostas não dependem do
horário da rotina. O quarto é aplicado **somente pela rotina**.

## Integridade

- Cada passo em sua própria transação `BEGIN IMMEDIATE`: a falha de um desfaz só ele e não impede os outros; a execução seguinte tenta de novo.
- Repetir não tem efeito (o registro alterado deixa de atender a condição); com dois processos, o segundo espera o bloqueio de escrita e não
  encontra o que fazer.
- Banco ocupado além de 5 s (`busy_timeout`): o passo falha com `database is locked` e fica para a execução seguinte.
- Nenhuma rota HTTP dispara ou configura a rotina.

## Registro e acompanhamento

- Cada alteração gera auditoria sem ator (ação do sistema) e sem dados pessoais. O histórico da reserva no painel administrativo mostra
  os eventos como "Sistema".
- Console: a primeira execução da API é sempre escrita; as seguintes, só quando alteram algo ou falham. O comando avulso sempre escreve.
  As linhas têm apenas contagens, nomes dos passos e o texto genérico do erro. Não há tabela de execuções nem tela.

## Decisões do pesquisador (26/11/2026, "recomendadas")

| Ponto | Decisão |
| --- | --- |
| Forma de execução | Temporizador na API e comando avulso; 60 s; avaliação na leitura mantida; uma transação por passo; sem tabela nova. |
| Pagamento pendente que nunca confirma | Não é tratado: continua `pendente`; uma confirmação tardia segue registrada (RN-022). |
| Reserva abandonada antes do fim da excursão | Não é tratada. |
| Reserva aguardando, sem pagamento, de excursão terminada | **Cancelada pela rotina.** A especificação não define este caso; a regra é uma decisão do pesquisador e não foi incluída em `04-REGRAS-DE-NEGOCIO.md` pelo agente. |
| Situação da excursão | Sem "Concluída" e sem encerramento automático após a partida. |
| Acompanhamento | Auditoria e console; sem tela. |

## Limitações

1. A rotina só roda com a API ligada ou quando o comando é executado (ou agendado fora do repositório).
2. A execução é síncrona: enquanto espera um banco bloqueado (até 5 s por passo), a API não atende outras requisições.
3. Um registro com defeito impede o passo inteiro em que está, até ser corrigido; o console mostra o passo, não o registro.
4. Com a rotina desligada, a reserva sem pagamento de excursão terminada continua "Aguardando pagamento".
5. O passageiro não é avisado do cancelamento automático (comunicação é a AGT-015); a tela mostra apenas "Cancelada".
6. A excursão não ganha situação "Concluída" (previsão registrada na AGT-005 que ficou sem implementar).
7. Pagamento pendente e reserva abandonada antes do fim da excursão continuam sem prazo.
8. Como a conclusão passa a ser gravada pela rotina, a conclusão manual do administrador (AGT-012) só tem efeito antes da execução seguinte
   ou com a rotina desligada.
