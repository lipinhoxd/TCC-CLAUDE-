# Comunicação com o passageiro (AGT-015)

Avisos transacionais (RF-040) na plataforma, com e-mail **simulado**. Nada é enviado de verdade e não há conexão com serviço externo.

## Como funciona

1. As operações do sistema já gravam a auditoria. A **rotina automática** (`docs/processos-automaticos.md`) lê os registros novos e cria um aviso
   para cada evento da tabela abaixo (`server/comunicacao/gerador.ts`). O código de pagamento, reserva e cancelamento não mudou.
2. O aviso fica na tabela `mensagem` e aparece para o passageiro em **Avisos** (`/avisos`, `GET /api/avisos`).
3. Na mesma execução, a rotina entrega o e-mail pelo provedor do ambiente (`server/comunicacao/entrega.ts`).

Um aviso aparece com atraso de até um intervalo da rotina (padrão 60 s). Com a rotina desligada, nada é gerado nem enviado até
`npm run rotina`.

## Eventos que avisam

| Registro de auditoria | Tipo | O texto informa |
| --- | --- | --- |
| `pagamento.confirmado` | `pagamento_confirmado` | Valor; na 1ª parcela, a data limite e a regra de não reembolso; na 2ª, a quitação. |
| `pagamento.confirmado_sem_vaga` | `pagamento_em_analise` | Valor e que a organização vai tratar o caso. |
| `reserva.vencimento_segunda_parcela` | `cancelada_inadimplencia` | Cancelamento, vaga liberada, 1ª parcela não reembolsável. |
| `reserva.cancelamento_passageiro` | `cancelada_passageiro` | Valor e percentual do reembolso registrado, ou por que não há. |
| `reserva.cancelamento_organizacao` | `cancelada_organizacao` | Cancelamento da excursão e valor do reembolso registrado. |
| `reserva.cancelamento_manual` | `cancelada_administracao` | Cancelamento pela organização. |
| `reserva.cancelamento_automatico` | `cancelada_excursao_terminada` | Excursão terminada sem pagamento confirmado. |
| `reserva.cancelamento_reembolso` | `cancelada_apos_reembolso` | Cancelamento depois do reembolso. |
| `reembolso.processado` | `reembolso_processado` | Valor processado. |

**Não avisam:** reserva criada, retenção, pagamento iniciado ou recusado, desistência do próprio passageiro, reembolso criado ou recusado,
estorno, conclusão e ações sobre excursões. Não há lembrete antes do prazo da segunda parcela.

## Conteúdo e dados pessoais

Primeiro nome, nome e datas da excursão, número da reserva, valores e datas (horário de Brasília), em texto simples. Não entram CPF, data de
nascimento, telefone, e-mail, dados de pagamento além do valor nem a justificativa do administrador. Nome e excursão são reduzidos a uma
linha, sem caracteres de controle ou invisíveis; o assunto não tem texto de usuário. O endereço é o da conta, lido no momento do envio. A
auditoria e o console não recebem o texto nem o endereço.

## E-mail simulado e entrega

| Ambiente | Comportamento |
| --- | --- |
| Fora de produção (padrão) | Grava uma linha JSON em `data/outbox/comunicacao.jsonl` (`COMUNICACAO_OUTBOX_PATH`), com o endereço e o texto. A pasta `data/` não é versionada. |
| `EMAIL_SIMULADO=false` | Nenhum envio; os e-mails ficam pendentes. |
| Produção (`NODE_ENV=production`) | Não há provedor: o aviso aparece na plataforma e o e-mail fica pendente. |

Uma tentativa por execução da rotina, até **3**; depois a mensagem fica `falhou`, com auditoria `comunicacao.falha_definitiva` (sem texto nem
endereço) e contagem no console. A falha nunca altera reserva, pagamento ou reembolso. Cada mensagem tem a própria transação, e o envio
ocorre dentro dela, para que dois processos não enviem a mesma.

## Banco (migração 5)

- `mensagem`: um registro por evento (`UNIQUE (auditoria_id)`), com texto, data do evento e situação do e-mail.
- `comunicacao_marco`: último registro de auditoria já lido. Começa no último existente quando a migração é aplicada, então **eventos
  anteriores não geram aviso**.

## Acesso

`GET /api/avisos` só para o perfil passageiro (visitante 401, administrador 403), sempre pela sessão, 20 por página. Não há consulta
administrativa.

## Decisões do pesquisador (26/11/2026, "recomendadas")

Aviso na plataforma e e-mail simulado; eventos de dinheiro e de reserva; sem lembrete; texto mínimo; sem prazo de exclusão; recuperação de
acesso separada; geração pela rotina a partir da auditoria; 3 tentativas; só eventos posteriores; só o passageiro vê.

## Limitações

1. Nenhum envio real. A interface do provedor é síncrona; um provedor real, assíncrono, exigirá adaptá-la.
2. O envio ocorre dentro da transação: um envio lento bloquearia as gravações do sistema.
3. Se o processo cair entre o envio e a gravação, o e-mail pode ser enviado de novo.
4. O atraso e a dependência da rotina; o texto usa os dados do momento da geração (por exemplo, o nome atual da excursão), e um aviso pode
   descrever uma situação que mudou logo depois.
5. As mensagens não têm prazo de exclusão nem marca de lida; o arquivo do e-mail simulado cresce sem limite e contém dados pessoais fictícios.
6. Sem opção de não receber, sem WhatsApp, sem lembretes; telefone sem posse comprovada (RN-005).
7. Um evento que falhe na geração impede os seguintes até ser corrigido.
8. Cada execução envia no máximo 100 e-mails e gera avisos para no máximo 500 eventos; o restante fica para as seguintes.
