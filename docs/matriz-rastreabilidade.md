# Matriz de rastreabilidade (requisito → atividade → evidência)

Atualizada em 13/11/2026. Fonte dos requisitos: `docs/requisitos/`. Atividade prevista: `docs/especificacao/07-PLANO-DE-ATIVIDADES.md` (e a coluna AGT dos RF). **Evidência** só existe para o que foi executado no experimento principal (AGT-001, commits `4cd310c` e `d65d64f`); o restante está **Planejada**. Não há, aqui, evidência do piloto (repositório não reaberto): **[DADO NÃO REGISTRADO]**.

Cadeia (TCC, Seção 3.8): requisito → atividade AGT → instrução → execução → alterações → testes → revisão humana → classificação → commit.

## Requisitos funcionais

| RF | Requisito | AGT prevista | Estado | Evidência |
| --- | --- | --- | --- | --- |
| RF-001 | Cadastro de usuário | 003 | Planejada | — |
| RF-002 | Validação dos dados de cadastro | 003 | Planejada | — |
| RF-003 | Autenticação por e-mail e senha | 003 | Planejada | — |
| RF-004 | Controle de acesso por perfil | 003 | Planejada | — |
| RF-005 | Perfil do usuário (consulta e edição) | 003 | Planejada | — |
| RF-006 | Recuperação de acesso | 003 | Planejada | — |
| RF-007 | Estrutura pública: Home, Excursões, Sobre, Como funciona e Contato | 004 | Planejada | — |
| RF-008 | Navegação pública (cabeçalho, rodapé, Cadastro e Login visíveis, estado autenticado) | 004 | Planejada | — |
| RF-009 | Cadastro de excursão | 005 | Planejada | — |
| RF-010 | Edição de excursão | 005 | Planejada | — |
| RF-011 | Configuração de capacidade | 005 | Planejada | — |
| RF-012 | Configuração de preço | 005 | Planejada | — |
| RF-013 | Habilitação de pagamento em duas parcelas e prazo da segunda | 005 | Planejada | — |
| RF-014 | Publicação e situação da excursão | 005/006 | Planejada | — |
| RF-015 | Listagem pública de excursões | 006 | Planejada | — |
| RF-016 | Detalhamento da excursão | 006 | Planejada | — |
| RF-017 | Exibição de disponibilidade de vagas | 006/008 | Planejada | — |
| RF-018 | Solicitação de reserva individual | 007 | Planejada | — |
| RF-019 | Verificação de disponibilidade na reserva | 007/008 | Planejada | — |
| RF-020 | Checkout obrigatório | 007 | Planejada | — |
| RF-021 | Retenção temporária de vaga durante o checkout | 008 | Planejada | — |
| RF-022 | Expiração da retenção | 008/014 | Planejada | — |
| RF-023 | Pagamento integral | 009 | Planejada | — |
| RF-024 | Pagamento em duas parcelas de 50% | 010 | Planejada | — |
| RF-025 | Confirmação financeira e ocupação efetiva da vaga | 009/010 | Planejada | — |
| RF-026 | Registro de confirmação financeira após expiração da retenção, para tratamento administrativo | 009/013 | Planejada | — |
| RF-027 | Quitação pela confirmação da segunda parcela | 010 | Planejada | — |
| RF-028 | Liberação da vaga por segunda parcela não paga no prazo | 010/014 | Planejada | — |
| RF-029 | Área do passageiro: minhas reservas | 011 | Planejada | — |
| RF-030 | Detalhe e situação da reserva | 011 | Planejada | — |
| RF-031 | Histórico de reservas concluídas | 011 | Planejada | — |
| RF-032 | Cancelamento solicitado pelo passageiro | 013 | Planejada | — |
| RF-033 | Cálculo do reembolso conforme a antecedência | 013 | Planejada | — |
| RF-034 | Cancelamento da excursão pela organização | 013 | Planejada | — |
| RF-035 | Reembolso integral dos valores pagos em cancelamento pela organização | 013 | Planejada | — |
| RF-036 | Conclusão automática de reservas elegíveis | 014 | Planejada | — |
| RF-037 | Administração de reservas | 012 | Planejada | — |
| RF-038 | Consulta de passageiros | 012 | Planejada | — |
| RF-039 | Alteração manual de situação, quando autorizada | 012 | Planejada | — |
| RF-040 | Comunicação transacional ao passageiro (simulada/configurável) | 015 | Planejada | — |
| RF-041 | Painel administrativo consolidado | 016 | Planejada | — |
| RF-042 | Histórico e auditoria de operações administrativas e automáticas | 005/016 | Planejada | — |

## Requisitos não funcionais

| RNF | Requisito | AGT prevista | Estado | Evidência (principal) |
| --- | --- | --- | --- | --- |
| RNF-001 | Hash seguro de senha | a definir | Planejada | — |
| RNF-002 | Proteção de rotas administrativas | a definir | Planejada | — |
| RNF-003 | Validação de dados | a definir | Planejada | — |
| RNF-004 | Autorização verificada no servidor | a definir | Planejada | — |
| RNF-005 | Proteção de dados pessoais | a definir | Planejada | — |
| RNF-006 | Segurança de sessão | a definir | Planejada | — |
| RNF-007 | Integridade dos dados | 002 | Evidenciada na AGT-002 | `server/db/migrations.ts` (restrições, chaves estrangeiras); `tests/db-schema.test.ts` |
| RNF-008 | Prevenção de excedente de capacidade | 002 | Evidenciada na AGT-002 (estrutura; fluxo na AGT-008) | `CHECK` em `excursao`; `tests/db-schema.test.ts`, `tests/db-concorrencia.test.ts` |
| RNF-009 | Consistência em operações críticas | 002 | Evidenciada na AGT-002 | `server/db/transaction.ts`; `tests/db-transaction-audit.test.ts` |
| RNF-010 | Tratamento de falhas | a definir | Planejada | — |
| RNF-011 | Desempenho das consultas públicas | a definir | Planejada | — |
| RNF-012 | Desempenho das operações de reserva e pagamento | a definir | Planejada | — |
| RNF-013 | Interface compreensível | a definir | Planejada | — |
| RNF-014 | Consistência visual | a definir | Planejada | — |
| RNF-015 | Feedback ao usuário | a definir | Planejada | — |
| RNF-016 | Responsividade | a definir | Planejada | — |
| RNF-017 | Compatibilidade com navegadores modernos | a definir | Planejada | — |
| RNF-018 | Organização do código | 001 | Evidenciada na AGT-001 | Pastas `src/`, `server/`, `tests/` |
| RNF-019 | Padronização | 001 | Evidenciada na AGT-001 | `eslint.config.mjs`, `tsconfig.json`, `.editorconfig`; lint sem avisos |
| RNF-020 | Modularidade | 001 | Evidenciada na AGT-001 | `server/config.ts`, `server/app.ts`, `server/main.ts`; `src/config/env.ts` |
| RNF-021 | Documentação técnica | 001 | Evidenciada na AGT-001 | `README.md` |
| RNF-022 | Testes automatizados | 001 | Evidenciada na AGT-001 | `tests/*.test.ts(x)`: 15 testes aprovados |
| RNF-023 | Validação antes da integração | 001 | Evidenciada na AGT-001 | `npm run check` (lint, testes, build) |
| RNF-024 | Prevenção de regressões | 001 | Evidenciada na AGT-001 | Suíte automatizada (15 testes), de fundação |
| RNF-025 | Controle de versão | 001 | Evidenciada na AGT-001 | Commits `4cd310c`, `d65d64f`; tag `agt-001-tentativa-1` |
| RNF-026 | Rastreabilidade experimental | 001 | Evidenciada na AGT-001 | `TCC/registros-agente/AGT-001.md`, diário, `METRICAS.csv` |
| RNF-027 | Registro (logs) de operações sem dados sensíveis | 001 | Prevista na AGT-001; sem evidência registrada | — |
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
| RN-001 | Apenas usuários com 18 anos ou mais podem concluir o cadastro. | 003 | Planejada | — |
| RN-002 | O CPF deve ser único. | 003 | Planejada | — |
| RN-003 | O e-mail deve ser único. | 003 | Planejada | — |
| RN-004 | São obrigatórios: nome completo, CPF, data de nascimento, telefone ou WhatsApp, e-mail e senha. | 003 | Planejada | — |
| RN-005 | O telefone ou WhatsApp deve passar pelo mecanismo de validação definido. | 003 | Planejada | — |
| RN-006 | O login ocorre por e-mail e senha. | 003 | Planejada | — |
| RN-007 | A recuperação de acesso usa token de uso único e validade limitada. | 003 | Planejada | — |
| RN-008 | A sessão expira e pode ser revogada; o acesso protegido é revalidado no servidor. | 003 | Planejada | — |
| RN-009 | Cada reserva é individual e vinculada a um único passageiro autenticado. | 007 | Planejada | — |
| RN-010 | O checkout é obrigatório. | 007 | Planejada | — |
| RN-011 | O pagamento integral é a modalidade padrão. | 009 | Planejada | — |
| RN-012 | O pagamento em duas parcelas de 50% pode ser habilitado individualmente por excursão. | 010 | Planejada | — |
| RN-013 | A data limite da segunda parcela é configurada por excursão e é anterior à partida (23:59:59 da data configurada). | 010 | Planejada | — |
| RN-014 | Durante o checkout há retenção temporária de vaga. | 008 | Planejada | — |
| RN-015 | A retenção não representa ocupação definitiva. | 008 | Planejada | — |
| RN-016 | No pagamento integral, a confirmação financeira converte a retenção em ocupação efetiva e a reserva fica "Pronto para embarque". | 009 | Planejada | — |
| RN-017 | No parcelamento, a confirmação da primeira parcela ocupa a vaga e mantém obrigação financeira pendente. | 010 | Planejada | — |
| RN-018 | A confirmação da segunda parcela conclui a quitação. | 010 | Planejada | — |
| RN-019 | Se a segunda parcela não for paga no prazo, a vaga é liberada. | 010 | Planejada | — |
| RN-020 | Nesse caso, a primeira parcela permanece não reembolsável. | 010 | Planejada | — |
| RN-021 | Nenhuma operação pode resultar em vagas ocupadas acima da capacidade da excursão. | 008 | Planejada | — |
| RN-022 | Confirmação financeira recebida após a expiração da retenção, sem disponibilidade, é registrada para tratamento administrativo, sem criar vaga adicional. | 009 | Planejada | — |
| RN-023 | As situações da reserva são: Aguardando pagamento, Pronto para embarque, Concluída e Cancelada. | 011 | Planejada | — |
| RN-024 | Reservas integralmente pagas ou com segunda parcela quitada ficam "Pronto para embarque". | 011 | Planejada | — |
| RN-025 | Um dia após a data final da excursão, reservas elegíveis ficam automaticamente "Concluída". | 011, 014 | Planejada | — |
| RN-026 | Reservas concluídas permanecem no histórico do passageiro. | 011 | Planejada | — |
| RN-027 | Cancelamento pelo passageiro com antecedência de pelo menos duas semanas: reembolso de 100% do valor elegível. | 013 | Planejada | — |
| RN-028 | Com menos de duas semanas e pelo menos uma semana: reembolso de 50% do valor elegível. | 013 | Planejada | — |
| RN-029 | Com menos de uma semana: sem reembolso. | 013 | Planejada | — |
| RN-030 | O reembolso incide sobre o valor efetivamente pago e elegível. | 013 | Planejada | — |
| RN-031 | Cancelamento pela organização: reembolso integral dos valores pagos aos passageiros afetados. | 013 | Planejada | — |
| RN-032 | A primeira parcela de reserva parcelada não quitada permanece não reembolsável (inadimplência). | 013 | Planejada | — |
| RN-033 | O administrador configura capacidade, preço, parcelamento e prazo da segunda parcela de cada excursão. | 005 | Planejada | — |
| RN-034 | O administrador consulta passageiros e reservas. | 012 | Planejada | — |
| RN-035 | Alterações manuais de situação só ocorrem quando autorizadas e ficam registradas na auditoria. | 012 | Planejada | — |
| RN-036 | Com reserva ou retenção ativa, condições comerciais e temporais da excursão não podem ser editadas; nome, imagem e descrição continuam editáveis. | 005 | Planejada | — |
| RN-037 | A excursão é criada em Rascunho; a publicação é ação distinta. | 005 | Planejada | — |
| RN-038 | Valores monetários são guardados em centavos inteiros (BRL). | 005 | Planejada | — |
| RN-039 | Instantes são guardados em UTC e interpretados no fuso America/Sao_Paulo. | 005 | Planejada | — |
| RN-040 | Retenção, confirmação e expiração usam mecanismos que preservam a capacidade sob processamento concorrente. | 008 | Planejada | — |
| RN-041 | Operações administrativas e automáticas relevantes geram histórico de auditoria. | 017 (validação geral) | Planejada | — |
| RN-042 | Logs e auditoria não contêm senhas, tokens ou dados cadastrais desnecessários. | 017 (validação geral) | Planejada | — |
| RN-043 | A IA não pode alterar autonomamente regras de negócio aprovadas. | 017 (validação geral) | Planejada | — |
| RN-044 | Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana. | 017 (validação geral) | Planejada | — |
