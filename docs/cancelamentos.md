# Cancelamentos e reembolsos (AGT-013)

Cancelamento pelo passageiro (RF-032), cálculo do reembolso (RF-033), cancelamento da excursão pela organização (RF-034) e reembolso
integral nesse caso (RF-035), com o tratamento das pendências financeiras (RF-026). Regras: RN-027 a RN-032, RN-038 a RN-044. Código em
`server/cancelamentos/`, `src/pages/CancelarReserva.tsx` e `src/pages/AdminCancelamentos.tsx`. **Nenhum dinheiro é movimentado:** o
provedor é simulado e não há provedor real.

## Decisões do pesquisador (26/11/2026, "recomendadas")

| Ponto | Decisão |
| --- | --- |
| Antecedência | Períodos **exatos até o instante da partida**: 14 dias x 24 h ou mais: **100%**; de 7 dias até menos de 14: **50%**; menos de 7 dias: **sem reembolso**. |
| Quem cancela | Reserva em Aguardando pagamento ou Pronto para embarque, **só antes da partida**. Concluída e Cancelada não. |
| Valor elegível | O pago e confirmado: a parcela única ou as duas parcelas quitadas. **Parcelada só com a primeira paga:** cancela, libera a vaga e **não reembolsa** (RN-032). Sem pagamento confirmado: cancela sem reembolso. Pagamento pendente vira recusado. |
| Centavos | 50% é metade arredondada para baixo. |
| Processamento | O reembolso nasce **pendente** e o administrador o confirma no provedor simulado. O pagamento vira **estornado** só quando o valor inteiro é devolvido (a 50% continua confirmado). Reembolso **recusado** pode ser tentado de novo, sem criar outro. |
| Pendências | Nas pendências (pagamento sem vaga e segunda parcela tardia), o administrador cria um reembolso de **100% do pagamento** na mesma fila. |
| Reserva após o reembolso da pendência | Decisão complementar do pesquisador (26/11/2026): **processado** o reembolso de uma pendência, a reserva que ainda aguardava pagamento é **cancelada** (auditoria `reserva.cancelamento_reembolso`, sem mexer em vagas). Reembolso recusado não cancela. |
| Excursão cancelada pela organização | **Uma única transação**, com justificativa, prévia e confirmação, **só antes da partida**. Afeta as reservas em Aguardando pagamento e Pronto para embarque, **inclusive a parcelada só com a primeira paga, com 100%** (RN-031), e as pendências da excursão (100%). Concluídas e já canceladas (inclusive por inadimplência) não são afetadas. Retenções canceladas, vagas liberadas, pagamentos pendentes recusados, excursão **Cancelada**. A rota comum de situação (AGT-005) continua bloqueando o cancelamento com reservas ativas. |

## Rotas

| Método e caminho | Perfil | Resultado |
| --- | --- | --- |
| `GET /api/reservas/:id/cancelamento` | passageiro (própria) | Prévia calculada no servidor: `percentual`, valores pago, elegível e a devolver, `parcelada_nao_quitada`, `tem_pagamento_a_tratar`, `permitido` e o motivo. |
| `POST /api/reservas/:id/cancelamento` | passageiro (própria) | Corpo com `percentual_previsto` (o que a prévia mostrou). Se a faixa mudou: 409 `reembolso_mudou`. Cancela em transação única; idempotente. Outros erros: 409 `reserva_nao_cancelavel`, 409 `excursao_ja_partiu`; alheia ou inexistente: 404. |
| `GET` e `POST /api/admin/excursoes/:id/cancelamento` | administrador | Prévia (afetados, pendências e total) e cancelamento com `justificativa` (até 300 caracteres). Repetir numa excursão cancelada não faz nada. |
| `GET /api/admin/reembolsos` | administrador | Fila paginada com filtro `situacao`; sem dados pessoais além do nome. |
| `POST /api/admin/reembolsos/:id/processar` | administrador | Corpo com `resultado` (`aprovado` ou `recusado`). Só com provedor simulado (em produção 503). Nunca devolve mais que o pago (409 `reembolso_excede_pago`). |
| `POST /api/admin/pendencias/:pagamentoId/reembolso` | administrador | Cria (ou devolve) o reembolso integral do pagamento sinalizado. |

Visitante recebe 401 e o perfil errado 403, antes de ler o corpo. A resposta da reserva ganhou `pode_cancelar` e `reembolsos`.

## Banco

Migração 4: `reembolso.pagamento_id` (nulo no reembolso de cancelamento) e índices únicos: um reembolso de cancelamento por reserva e um por
pagamento sinalizado. A reserva cancelada por passageiro ou organização não usa `motivo_cancelamento` (que segue só com `inadimplencia`); o motivo
fica em `reembolso.motivo` e na auditoria.

## Auditoria

`reserva.cancelamento_passageiro`, `reserva.cancelamento_organizacao`, `reserva.cancelamento_reembolso`, `excursao.cancelamento` (com a justificativa), `reembolso.criado`,
`reembolso.processado`, `reembolso.recusado`, `pagamento.recusado` (por cancelamento), `pagamento.estornado` e `retencao.cancelada`.
Só situações, ids e valores em centavos; sem dados pessoais nem de cartão.

## Limitações conhecidas

1. Sem provedor real: nenhum dinheiro é movimentado.
2. Entre a criação e o processamento do reembolso de uma pendência, a reserva continua em Aguardando pagamento.
3. Quem já estava cancelado por inadimplência não é reembolsado quando a organização cancela a excursão (decisão 3).
4. Reserva cancelada sem reembolso não tem linha em `reembolso`; o motivo está na auditoria.
5. Sem aviso ao passageiro além da tela (AGT-015); sem tarefa agendada (AGT-014).
6. A excursão cancelada deixa de aparecer na consulta pública; o passageiro vê a própria reserva cancelada.
7. A justificativa é texto livre, não filtrado quanto a dados pessoais.
8. Concorrência testada com duas conexões e pedidos simultâneos, sem teste de carga; um navegador, sem leitor de tela.
