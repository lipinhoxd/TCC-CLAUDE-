# Matriz de rastreabilidade (requisito → atividade → evidência)

Atualizada em 26/11/2026 (AGT-012). Fonte dos requisitos: `docs/requisitos/`. Atividade prevista: `docs/especificacao/07-PLANO-DE-ATIVIDADES.md` (e a coluna AGT dos RF). **Evidência** só existe para o que foi executado no experimento principal (AGT-001 a AGT-012; ver a coluna Estado de cada linha e os commits em `TCC/metricas/METRICAS.csv`); o restante está **Planejada**. Não há, aqui, evidência do piloto (repositório não reaberto): **[DADO NÃO REGISTRADO]**.

Cadeia (TCC, Seção 3.8): requisito → atividade AGT → instrução → execução → alterações → testes → revisão humana → classificação → commit.

## Requisitos funcionais

| RF | Requisito | AGT prevista | Estado | Evidência |
| --- | --- | --- | --- | --- |
| RF-001 | Cadastro de usuário | 003 | Evidenciada na AGT-003 | `server/auth/service.ts`; `tests/auth-api.test.ts` |
| RF-002 | Validação dos dados de cadastro | 003 | Evidenciada na AGT-003 | `server/auth/validation.ts`; `tests/auth-validation.test.ts` |
| RF-003 | Autenticação por e-mail e senha | 003 | Evidenciada na AGT-003 | `server/auth/service.ts, routes.ts`; `tests/auth-api.test.ts` |
| RF-004 | Controle de acesso por perfil | 003 | Evidenciada na AGT-003 | `server/auth/routes.ts`; `tests/auth-api.test.ts` |
| RF-005 | Perfil do usuário (consulta e edição) | 003 | Evidenciada na AGT-003 | `PATCH /api/me`; `tests/auth-api.test.ts` |
| RF-006 | Recuperação de acesso | 003 | Evidenciada na AGT-003 | `recovery/request e recovery/confirm`; `tests/auth-api.test.ts` |
| RF-007 | Estrutura pública: Home, Excursões, Sobre, Como funciona e Contato | 004 | Evidenciada na AGT-004 | `src/pages/InfoPages.tsx`; `tests/web-navegacao.test.tsx` |
| RF-008 | Navegação pública (cabeçalho, rodapé, Cadastro e Login visíveis, estado autenticado) | 004 | Evidenciada na AGT-004 | `src/Layout.tsx`, `src/session.tsx`; `tests/web-sessao.test.tsx` |
| RF-009 | Cadastro de excursão | 005 | Evidenciada na AGT-005 | `server/excursoes/service.ts`; `tests/excursoes-api.test.ts`, `tests/web-admin.test.tsx` |
| RF-010 | Edição de excursão | 005 | Evidenciada na AGT-005 | `server/excursoes/service.ts` (PATCH); `tests/excursoes-api.test.ts` |
| RF-011 | Configuração de capacidade | 005 | Evidenciada na AGT-005 | `server/excursoes/validation.ts`; `tests/excursoes-api.test.ts` |
| RF-012 | Configuração de preço | 005 | Evidenciada na AGT-005 | `server/excursoes/validation.ts`, `shared/dinheiro.ts`; `tests/excursoes-api.test.ts`, `tests/dinheiro-rota.test.ts` |
| RF-013 | Habilitação de pagamento em duas parcelas e prazo da segunda | 005 | Evidenciada na AGT-005 | `server/excursoes/validation.ts`, `shared/fuso.ts`; `tests/excursoes-api.test.ts`, `tests/fuso.test.ts` |
| RF-014 | Publicação e situação da excursão | 005/006 | Parcial na AGT-005 (parte administrativa; exibição pública é da AGT-006) | `server/excursoes/service.ts` (situações); `tests/excursoes-api.test.ts` |
| RF-015 | Listagem pública de excursões | 006 | Evidenciada na AGT-006 | `server/excursoes/publico.ts`, `src/pages/ExcursoesPublicas.tsx`; `tests/consulta-publica.test.ts`, `tests/web-publico.test.tsx` |
| RF-016 | Detalhamento da excursão | 006 | Evidenciada na AGT-006 | `GET /api/excursoes/:id`; `tests/consulta-publica.test.ts`, `tests/web-publico.test.tsx` |
| RF-017 | Exibição de disponibilidade de vagas | 006/008 | Evidenciada na AGT-008 (capacidade menos ocupadas menos retenções ativas; parcial na AGT-006) | `server/vagas/disponibilidade.ts`, `server/excursoes/publico.ts`; `tests/consulta-publica.test.ts`, `tests/vagas-concorrencia.test.ts` |
| RF-018 | Solicitação de reserva individual | 007 | Evidenciada na AGT-007 | `server/reservas/service.ts`, `src/pages/Reservas.tsx`; `tests/reservas-api.test.ts`, `tests/web-reservas.test.tsx` |
| RF-019 | Verificação de disponibilidade na reserva | 007/008 | Evidenciada na AGT-008 (a solicitação considera as retenções; parcial na AGT-007) | `solicitar` em `server/reservas/service.ts`; `tests/reservas-api.test.ts`, `tests/retencao-api.test.ts` |
| RF-020 | Checkout obrigatório | 007 | Evidenciada na AGT-007 (checkout sem pagamento) | `/reservas/:id/checkout`; `tests/web-reservas.test.tsx` |
| RF-021 | Retenção temporária de vaga durante o checkout | 008 | Evidenciada na AGT-008 | `iniciarCheckout` em `server/reservas/service.ts`; `tests/retencao-api.test.ts`, `tests/web-reservas.test.tsx` |
| RF-022 | Expiração da retenção | 008/014 | Parcial na AGT-008 (expiração na leitura e na gravação, sem tarefa em segundo plano; a rotina agendada é da AGT-014) | `expirarVencidas` em `server/vagas/disponibilidade.ts`; `tests/retencao-api.test.ts`, `tests/vagas-concorrencia.test.ts` |
| RF-023 | Pagamento integral | 009 | Evidenciada na AGT-009 (provedor simulado fora de produção) | `server/pagamentos/service.ts`, `src/pages/Reservas.tsx`; `tests/pagamento-api.test.ts`, `tests/web-reservas.test.tsx` |
| RF-024 | Pagamento em duas parcelas de 50% | 010 | Evidenciada na AGT-010 (provedor simulado fora de produção) | `server/pagamentos/parcelas.ts`, `server/pagamentos/service.ts`, `src/pages/Reservas.tsx`; `tests/parcelado-api.test.ts`, `tests/web-reservas.test.tsx` |
| RF-025 | Confirmação financeira e ocupação efetiva da vaga | 009/010 | Evidenciada nas AGT-009 e AGT-010 (integral e primeira parcela) | `confirmarPagamento` em `server/pagamentos/confirmacao.ts`; `tests/pagamento-confirmacao.test.ts`, `tests/pagamento-api.test.ts` |
| RF-026 | Registro de confirmação financeira após expiração da retenção, para tratamento administrativo | 009/013 | Parcial nas AGT-009 e AGT-012 (registro sinalizado e consulta administrativa das pendências; o tratamento e o estorno são da AGT-013) | `server/db/migrations.ts` (versão 2), `confirmarPagamento`; `tests/pagamento-confirmacao.test.ts`, `tests/pagamento-api.test.ts` |
| RF-027 | Quitação pela confirmação da segunda parcela | 010 | Evidenciada na AGT-010 | `confirmarSegunda` em `server/pagamentos/confirmacao.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RF-028 | Liberação da vaga por segunda parcela não paga no prazo | 010/014 | Parcial na AGT-010 (vencimento avaliado na leitura e na gravação, sem tarefa em segundo plano; a rotina agendada é da AGT-014) | `vencerSegundasParcelas` em `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RF-029 | Área do passageiro: minhas reservas | 011 | Evidenciada na AGT-011 | `server/reservas/service.ts`, `server/reservas/routes.ts`, `src/pages/MinhasReservas.tsx`; `tests/area-passageiro-api.test.ts`, `tests/web-area-passageiro.test.tsx` |
| RF-030 | Detalhe e situação da reserva | 011 | Evidenciada na AGT-011 | `server/reservas/service.ts`, `server/reservas/routes.ts`, `src/pages/MinhasReservas.tsx`; `tests/area-passageiro-api.test.ts`, `tests/web-area-passageiro.test.tsx` |
| RF-031 | Histórico de reservas concluídas | 011 | Evidenciada na AGT-011 (o histórico inclui também as canceladas) | `server/vagas/conclusao.ts`, `src/pages/MinhasReservas.tsx`; `tests/area-passageiro-api.test.ts` |
| RF-032 | Cancelamento solicitado pelo passageiro | 013 | Planejada | — |
| RF-033 | Cálculo do reembolso conforme a antecedência | 013 | Planejada | — |
| RF-034 | Cancelamento da excursão pela organização | 013 | Planejada | — |
| RF-035 | Reembolso integral dos valores pagos em cancelamento pela organização | 013 | Planejada | — |
| RF-036 | Conclusão automática de reservas elegíveis | 014 | Planejada | — |
| RF-037 | Administração de reservas | 012 | Evidenciada na AGT-012 | `server/admin/service.ts`, `server/admin/routes.ts`, `src/pages/AdminReservas.tsx`; `tests/admin-api.test.ts`, `tests/web-admin-reservas.test.tsx` |
| RF-038 | Consulta de passageiros | 012 | Evidenciada na AGT-012 | `server/admin/service.ts`, `server/admin/routes.ts`, `src/pages/AdminReservas.tsx`; `tests/admin-api.test.ts`, `tests/web-admin-reservas.test.tsx` |
| RF-039 | Alteração manual de situação, quando autorizada | 012 | Evidenciada na AGT-012 (só transições sem efeito financeiro) | `server/admin/service.ts`, `server/admin/routes.ts`, `src/pages/AdminReservas.tsx`; `tests/admin-api.test.ts`, `tests/web-admin-reservas.test.tsx` |
| RF-040 | Comunicação transacional ao passageiro (simulada/configurável) | 015 | Planejada | — |
| RF-041 | Painel administrativo consolidado | 016 | Planejada | — |
| RF-042 | Histórico e auditoria de operações administrativas e automáticas | 005/016 | Parcial na AGT-005 (excursões; auditoria de reservas e processos automáticos fica para as demais) | `GET /api/admin/excursoes/:id/historico`; `tests/excursoes-api.test.ts` |

## Requisitos não funcionais

| RNF | Requisito | AGT prevista | Estado | Evidência (principal) |
| --- | --- | --- | --- | --- |
| RNF-001 | Hash seguro de senha | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | server/auth/password.ts; tests/auth-validation.test.ts |
| RNF-002 | Proteção de rotas administrativas | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | GET /api/admin/ping; tests/auth-api.test.ts |
| RNF-003 | Validação de dados | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | server/auth/validation.ts; tests/auth-validation.test.ts |
| RNF-004 | Autorização verificada no servidor | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | server/auth/routes.ts; tests/auth-api.test.ts |
| RNF-005 | Proteção de dados pessoais | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | CPF mascarado; auditoria sem dados pessoais; tests/auth-api.test.ts |
| RNF-006 | Segurança de sessão | 003 | Evidenciada na AGT-003 (ver limitações em docs/autenticacao.md) | cookie HttpOnly e hash do token; tests/auth-api.test.ts |
| RNF-007 | Integridade dos dados | 002 | Evidenciada na AGT-002 | `server/db/migrations.ts` (restrições, chaves estrangeiras); `tests/db-schema.test.ts` |
| RNF-008 | Prevenção de excedente de capacidade | 002 | Evidenciada na AGT-002 (estrutura) e na AGT-008 (retenção e mecanismo de ocupar e liberar) | `CHECK` em `excursao`; `tests/db-schema.test.ts`, `tests/db-concorrencia.test.ts` |
| RNF-009 | Consistência em operações críticas | 002 | Evidenciada na AGT-002 | `server/db/transaction.ts`; `tests/db-transaction-audit.test.ts` |
| RNF-010 | Tratamento de falhas | 004 | Evidenciada na AGT-004 (ver limitações em docs/interface-publica.md) | estados de erro e de rede em `src/pages/AuthPages.tsx`; `tests/web-sessao.test.tsx` |
| RNF-011 | Desempenho das consultas públicas | a definir | Planejada | — |
| RNF-012 | Desempenho das operações de reserva e pagamento | a definir | Planejada | — |
| RNF-013 | Interface compreensível | 004 | Evidenciada na AGT-004 (ver limitações em docs/interface-publica.md) | rótulos, foco, link de pular; `tests/web-navegacao.test.tsx` |
| RNF-014 | Consistência visual | 004 | Evidenciada na AGT-004 (ver limitações em docs/interface-publica.md) | variáveis de CSS em `src/styles.css` |
| RNF-015 | Feedback ao usuário | 004 | Evidenciada na AGT-004 (ver limitações em docs/interface-publica.md) | avisos e mensagens por campo; `tests/web-sessao.test.tsx` |
| RNF-016 | Responsividade | 004 | Evidenciada na AGT-004 (ver limitações em docs/interface-publica.md) | verificada em 390 px e 1280 px no navegador |
| RNF-017 | Compatibilidade com navegadores modernos | 004 | Parcial na AGT-004: só Microsoft Edge (Chromium) verificado | verificação em navegador; ver docs/interface-publica.md |
| RNF-018 | Organização do código | 001 | Evidenciada na AGT-001 | Pastas `src/`, `server/`, `tests/` |
| RNF-019 | Padronização | 001 | Evidenciada na AGT-001 | `eslint.config.mjs`, `tsconfig.json`, `.editorconfig`; lint sem avisos |
| RNF-020 | Modularidade | 001 | Evidenciada na AGT-001 | `server/config.ts`, `server/app.ts`, `server/main.ts`; `src/config/env.ts` |
| RNF-021 | Documentação técnica | 001 | Evidenciada na AGT-001 | `README.md` |
| RNF-022 | Testes automatizados | 001 | Evidenciada na AGT-001 | `tests/*.test.ts(x)`: 15 testes aprovados |
| RNF-023 | Validação antes da integração | 001 | Evidenciada na AGT-001 | `npm run check` (lint, testes, build) |
| RNF-024 | Prevenção de regressões | 001 | Evidenciada na AGT-001 | Suíte automatizada (15 testes), de fundação |
| RNF-025 | Controle de versão | 001 | Evidenciada na AGT-001 | Commits `4cd310c`, `d65d64f`; tag `agt-001-tentativa-1` |
| RNF-026 | Rastreabilidade experimental | 001 | Evidenciada na AGT-001 | `TCC/registros-agente/AGT-001.md`, diário, `METRICAS.csv` |
| RNF-027 | Registro (logs) de operações sem dados sensíveis | 001 | Prevista na AGT-001; evidência parcial na AGT-003 (auditoria e log da autenticação sem dados sensíveis) | `tests/auth-api.test.ts` |
| RNF-028 | Minimização de dados pessoais coletados e exibidos | 001 | Prevista na AGT-001; sem evidência registrada | — |
| RNF-029 | Qualidade estática (lint e verificação de tipos sem erros) | 001 | Evidenciada na AGT-001 | `npm run lint` e `npm run typecheck` sem erros |
| RNF-030 | Revisão humana de implementações produzidas por IA | 018 | Planejada | — |
| RNF-031 | Validação independente da autoavaliação do agente | 018 | Planejada | — |
| RNF-032 | Preservação das especificações | 018 | Planejada | — |
| RNF-033 | Registro de intervenções humanas | 018 | Planejada | — |

## Regras de negócio

AGT prevista conforme o plano; regras sem AGT no plano ficam na AGT-017 (validação geral).

| RN | Regra | AGT prevista | Estado | Evidência |
| --- | --- | --- | --- | --- |
| RN-001 | Apenas usuários com 18 anos ou mais podem concluir o cadastro. | 003 | Evidenciada na AGT-003 | `tests/auth-validation.test.ts` (maioridade) |
| RN-002 | O CPF deve ser único. | 003 | Evidenciada na AGT-003 | `tests/auth-validation.test.ts` |
| RN-003 | O e-mail deve ser único. | 003 | Evidenciada na AGT-003 | `tests/auth-validation.test.ts` |
| RN-004 | São obrigatórios: nome completo, CPF, data de nascimento, telefone ou WhatsApp, e-mail e senha. | 003 | Evidenciada na AGT-003 | `tests/auth-api.test.ts` |
| RN-005 | O telefone ou WhatsApp deve passar pelo mecanismo de validação definido. | 003 | Parcial na AGT-003 (só formato; posse do número não verificada) | `tests/auth-validation.test.ts` |
| RN-006 | O login ocorre por e-mail e senha. | 003 | Evidenciada na AGT-003 | `tests/auth-api.test.ts` |
| RN-007 | A recuperação de acesso usa token de uso único e validade limitada. | 003 | Evidenciada na AGT-003 (duração de 30 min decidida pelo pesquisador; sem entrega real do token em produção) | `tests/auth-api.test.ts` |
| RN-008 | A sessão expira e pode ser revogada; o acesso protegido é revalidado no servidor. | 003 | Evidenciada na AGT-003 | `tests/auth-api.test.ts` |
| RN-009 | Cada reserva é individual e vinculada a um único passageiro autenticado. | 007 | Planejada | — |
| RN-010 | O checkout é obrigatório. | 007 | Planejada | — |
| RN-011 | O pagamento integral é a modalidade padrão. | 009 | Evidenciada na AGT-009 | `server/pagamentos/service.ts`; `tests/pagamento-api.test.ts` |
| RN-012 | O pagamento em duas parcelas de 50% pode ser habilitado individualmente por excursão. | 010 | Evidenciada nas AGT-005 e AGT-007 (configuração e exigência na reserva); aplicada na AGT-010 | `server/excursoes/service.ts`, `server/pagamentos/service.ts`; `tests/parcelado-api.test.ts` |
| RN-013 | A data limite da segunda parcela é configurada por excursão e é anterior à partida (23:59:59 da data configurada). | 010 | Evidenciada nas AGT-005 e AGT-007 (configuração); aplicada na AGT-010 ao pagamento e ao vencimento | `server/vagas/vencimento.ts`; `tests/parcelado-api.test.ts` |
| RN-014 | Durante o checkout há retenção temporária de vaga. | 008 | Evidenciada na AGT-008 | `iniciarCheckout`; `tests/retencao-api.test.ts` |
| RN-015 | A retenção não representa ocupação definitiva. | 008 | Evidenciada na AGT-008 | `vagas_ocupadas` inalterado pela retenção; `tests/retencao-api.test.ts` |
| RN-016 | No pagamento integral, a confirmação financeira converte a retenção em ocupação efetiva e a reserva fica "Pronto para embarque". | 009 | Evidenciada na AGT-009 | `confirmarPagamento`; `tests/pagamento-api.test.ts`, `tests/pagamento-confirmacao.test.ts` |
| RN-017 | No parcelamento, a confirmação da primeira parcela ocupa a vaga e mantém obrigação financeira pendente. | 010 | Evidenciada na AGT-010 | `server/pagamentos/confirmacao.ts`, `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RN-018 | A confirmação da segunda parcela conclui a quitação. | 010 | Evidenciada na AGT-010 | `server/pagamentos/confirmacao.ts`, `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RN-019 | Se a segunda parcela não for paga no prazo, a vaga é liberada. | 010 | Evidenciada na AGT-010 | `server/pagamentos/confirmacao.ts`, `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RN-020 | Nesse caso, a primeira parcela permanece não reembolsável. | 010 | Evidenciada na AGT-010 | `server/pagamentos/confirmacao.ts`, `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts`, `tests/parcelado-api.test.ts` |
| RN-021 | Nenhuma operação pode resultar em vagas ocupadas acima da capacidade da excursão. | 008 | Parcial na AGT-008 (restrição do banco da AGT-002, retenção e `ocuparVaga`; a ocupação por pagamento é da AGT-009) | `server/vagas/disponibilidade.ts`; `tests/vagas-concorrencia.test.ts`, `tests/db-schema.test.ts` |
| RN-022 | Confirmação financeira recebida após a expiração da retenção, sem disponibilidade, é registrada para tratamento administrativo, sem criar vaga adicional. | 009 | Evidenciada na AGT-009 (o registro; o tratamento administrativo é das AGT-012 e AGT-013) | `confirmarPagamento`; `tests/pagamento-confirmacao.test.ts`, `tests/pagamento-api.test.ts` |
| RN-023 | As situações da reserva são: Aguardando pagamento, Pronto para embarque, Concluída e Cancelada. | 011 | Evidenciada na AGT-011 (as quatro situações aparecem na lista e no detalhe) | `src/pages/MinhasReservas.tsx`, `server/vagas/conclusao.ts`; `tests/area-passageiro-api.test.ts`, `tests/web-area-passageiro.test.tsx` |
| RN-024 | Reservas integralmente pagas ou com segunda parcela quitada ficam "Pronto para embarque". | 011 | Evidenciada nas AGT-009, AGT-010 e AGT-011 (atribuída e exibida) | `confirmarPagamento`; `tests/parcelado-api.test.ts` |
| RN-025 | Um dia após a data final da excursão, reservas elegíveis ficam automaticamente "Concluída". | 011, 014 | Parcial na AGT-011 (conclusão na leitura e na gravação, sem tarefa em segundo plano; a rotina agendada é da AGT-014) | `concluirReservas` em `server/vagas/conclusao.ts`; `tests/area-passageiro-api.test.ts` |
| RN-026 | Reservas concluídas permanecem no histórico do passageiro. | 011 | Evidenciada na AGT-011 | `server/reservas/service.ts` (listar); `tests/area-passageiro-api.test.ts` |
| RN-027 | Cancelamento pelo passageiro com antecedência de pelo menos duas semanas: reembolso de 100% do valor elegível. | 013 | Planejada | — |
| RN-028 | Com menos de duas semanas e pelo menos uma semana: reembolso de 50% do valor elegível. | 013 | Planejada | — |
| RN-029 | Com menos de uma semana: sem reembolso. | 013 | Planejada | — |
| RN-030 | O reembolso incide sobre o valor efetivamente pago e elegível. | 013 | Planejada | — |
| RN-031 | Cancelamento pela organização: reembolso integral dos valores pagos aos passageiros afetados. | 013 | Planejada | — |
| RN-032 | A primeira parcela de reserva parcelada não quitada permanece não reembolsável (inadimplência). | 013 | Parcial na AGT-010 (a primeira parcela fica confirmada e a reserva cancelada por inadimplência; a devolução é da AGT-013) | `server/vagas/vencimento.ts`; `tests/parcelado-confirmacao.test.ts` |
| RN-033 | O administrador configura capacidade, preço, parcelamento e prazo da segunda parcela de cada excursão. | 005 | Planejada | — |
| RN-034 | O administrador consulta passageiros e reservas. | 012 | Evidenciada na AGT-012 | `server/admin/service.ts`, `server/admin/routes.ts`, `src/pages/AdminReservas.tsx`; `tests/admin-api.test.ts`, `tests/web-admin-reservas.test.tsx` |
| RN-035 | Alterações manuais de situação só ocorrem quando autorizadas e ficam registradas na auditoria. | 012 | Evidenciada na AGT-012 | `alterarSituacao` em `server/admin/service.ts`; `tests/admin-api.test.ts` |
| RN-036 | Com reserva ou retenção ativa, condições comerciais e temporais da excursão não podem ser editadas; nome, imagem e descrição continuam editáveis. | 005 | Evidenciada na AGT-005 (confirmada pela aprovação da instrução) | `tests/excursoes-api.test.ts` |
| RN-037 | A excursão é criada em Rascunho; a publicação é ação distinta. | 005 | Evidenciada na AGT-005 (confirmada pela aprovação da instrução) | `tests/excursoes-api.test.ts` |
| RN-038 | Valores monetários são guardados em centavos inteiros (BRL). | 005 | Planejada | — |
| RN-039 | Instantes são guardados em UTC e interpretados no fuso America/Sao_Paulo. | 005 | Planejada | — |
| RN-040 | Retenção, confirmação e expiração usam mecanismos que preservam a capacidade sob processamento concorrente. | 008 | Parcial na AGT-008 (retenção e expiração; a confirmação é da AGT-009) | `BEGIN IMMEDIATE` em `iniciarCheckout`; `tests/vagas-concorrencia.test.ts`, `tests/retencao-api.test.ts` |
| RN-041 | Operações administrativas e automáticas relevantes geram histórico de auditoria. | 017 (validação geral) | Planejada | — |
| RN-042 | Logs e auditoria não contêm senhas, tokens ou dados cadastrais desnecessários. | 017 (validação geral) | Planejada | — |
| RN-043 | A IA não pode alterar autonomamente regras de negócio aprovadas. | 017 (validação geral) | Planejada | — |
| RN-044 | Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana. | 017 (validação geral) | Planejada | — |
