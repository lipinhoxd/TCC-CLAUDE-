# Administração de reservas e passageiros (AGT-012)

Consulta de reservas (RF-037), consulta de passageiros (RF-038) e alteração manual de situação, quando autorizada (RF-039), com a lista de
pendências administrativas (RF-026). Regras: RN-034, RN-035, RN-041 a RN-044. Código em `server/admin/` e `src/pages/AdminReservas.tsx`.

## Decisões do pesquisador (24/11/2026, "recomendadas")

| Ponto | Decisão |
| --- | --- |
| Dados pessoais (RF-038, RN-044) | A **lista** de passageiros mostra nome e e-mail inteiros e **CPF e telefone mascarados** (últimos dígitos). Os dados completos (CPF, telefone, data de nascimento) aparecem só no **detalhe** do passageiro, e **cada consulta ao detalhe é auditada** (`passageiro.consultado`: quem consultou e quando, com estados nulos, sem gravar o dado consultado). A busca aceita nome, e-mail e CPF (completo ou parcial, a partir de 3 dígitos). A lista e a busca não geram auditoria. |
| Alterações manuais (RF-039, RN-035) | **Só transições sem efeito financeiro**, com justificativa obrigatória (até 300 caracteres) e auditoria com o administrador como ator: **cancelar** a reserva em Aguardando pagamento **sem pagamento pendente ou confirmado** (cancela a retenção ativa; não mexe em `vagas_ocupadas`) e **marcar Concluída** a reserva Pronta para embarque cuja excursão terminou. Cancelar com pagamento confirmado é da AGT-013 (reembolso). |
| Pendências (RF-026, RN-022) | **Só listar e filtrar**, sem ação e sem migração: pagamento confirmado sem vaga e segunda parcela confirmada depois do vencimento. O tratamento e o reembolso são da AGT-013. |

## Rotas (só o perfil administrador; visitante 401 e passageiro 403, antes de ler o corpo; o administrador vem da sessão)

| Método e caminho | Resultado |
| --- | --- |
| `GET /api/admin/reservas` | Lista paginada (`pagina`, `limite` até 50, padrão 20) de reservas, da mais nova para a mais antiga, com filtros `excursao_id`, `situacao`, `modalidade` e `q` (nome, e-mail ou CPF do passageiro). Cada item traz passageiro (id, nome e e-mail), excursão, modalidade, situação, total e `tem_pendencia`. Parâmetro inválido: 400 `validacao` por campo. |
| `GET /api/admin/reservas/:id` | Detalhe: passageiro, excursão, valores e parcelas, pagamentos de cada parcela, retenções, pendências, `alteracoes_permitidas` (cada uma com `disponivel` e o motivo) e o histórico de auditoria da reserva, dos pagamentos e das retenções (só ids de ator). 404 `nao_encontrada`. |
| `POST /api/admin/reservas/:id/situacao` | Corpo com `situacao` (`cancelada` ou `concluida`) e `justificativa`, só esses dois campos. Transação `BEGIN IMMEDIATE`; idempotente (repetir devolve a reserva, sem novo efeito nem auditoria). Erros: 400 `validacao` (justificativa obrigatória ou longa, campo não permitido), 409 `transicao_nao_autorizada`, 409 `reserva_com_pagamento`, 409 `excursao_nao_terminou`, 404. |
| `GET /api/admin/pendencias` | Pagamentos confirmados e sinalizados (`tipo`: `confirmado_sem_vaga` ou `segunda_parcela_apos_vencimento`), filtro `tipo`. Sem rota de ação. |
| `GET /api/admin/passageiros` | Lista paginada com busca `q`; só passageiros (o administrador não aparece); CPF e telefone mascarados; `total_reservas`. |
| `GET /api/admin/passageiros/:id` | Detalhe com os dados completos e as reservas do passageiro. **Audita a consulta.** Administrador e id inexistente: 404. |

Nunca saem nas respostas: hash de senha, tokens, sessões, conteúdo de e-mails de recuperação nem dados de cartão. As rotas do passageiro
(`/api/reservas`) continuam recusando o administrador (403).

## Leitura com efeito (decisões das AGT-008, AGT-010 e AGT-011)

As leituras de administração efetivam antes, em transação própria, o **vencimento da segunda parcela** e a **conclusão automática** pendentes de todo o
sistema, para que a situação gravada seja a mostrada. A alteração manual efetiva só o vencimento antes de decidir; a conclusão automática **não** roda
nela, para que o pedido do administrador seja o que conclui (auditoria `reserva.conclusao_manual`, ator administrador).

## Auditoria

`reserva.cancelamento_manual` e `reserva.conclusao_manual` (ator administrador; estado novo com a justificativa), `retencao.cancelada` (ator administrador)
e `passageiro.consultado`. A justificativa é texto livre do administrador: a tela pede que não inclua dados pessoais, mas o servidor não o verifica.

## Interface

`/admin/reservas` (lista com filtros e paginação), `/admin/reservas/:id` (detalhe, alteração com confirmação e justificativa, auditoria),
`/admin/pendencias`, `/admin/passageiros` e `/admin/passageiros/:id`; itens "Reservas" e "Passageiros" no menu do administrador. Visitante e passageiro veem
acesso restrito sem consultar a API de administração.

## Limitações conhecidas

1. **Conclusão manual quase sempre desnecessária:** a conclusão automática (AGT-011) roda em qualquer leitura de administração e na do passageiro; por isso a
   reserva elegível costuma já estar Concluída quando o administrador a abre, e o botão "Marcar como concluída" só aparece se ninguém leu antes (a rota
   direta continua funcionando). Registrado para revisão humana.
2. **Sem tratamento de pendência** (marcar como tratada) nem reembolso: AGT-013. **Tarefa agendada:** implementada depois, na AGT-014 (`docs/processos-automaticos.md`); com ela, a conclusão manual só tem efeito antes da execução seguinte ou com a rotina desligada.
3. **Justificativa livre** não é filtrada quanto a dados pessoais.
4. **Leitura com escrita:** abrir o detalhe de um passageiro grava a auditoria da consulta; qualquer leitura de administração efetiva vencimento e conclusão.
5. A busca por CPF parcial (3 dígitos ou mais) pode revelar a existência de um CPF; o administrador já vê os dados completos no detalhe, mas a lista continua mascarada.
6. Concorrência testada com duas conexões e requisições simultâneas, sem teste de carga; os campos de seleção usam o estilo padrão do navegador; um navegador, sem leitor de tela.
