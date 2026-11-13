# Regras de negócio (RN-001 a RN-044)

> Cópia organizada de `docs/especificacao/04-REGRAS-DE-NEGOCIO.md` (fonte única e versionada). A especificação foi escrita pelo agente em 11/11/2026 a partir do Capítulo 4 do TCC; os itens marcados **[confirmar]** aguardam decisão dos pesquisadores. Rastreabilidade: `docs/matriz-rastreabilidade.md`.

Origem: **Piloto** = ID e texto usados nos registros do piloto; **TCC 4.5.x** = Capítulo 4, seção
indicada; **Piloto/AGT-005** = regra aplicada no relatório da AGT-005; **Nova** = definida nesta
versão. Regras marcadas **[confirmar]** precisam de decisão dos pesquisadores.

## Cadastro e acesso (TCC 4.5.1)

| ID | Regra | Origem |
| --- | --- | --- |
| RN-001 | Apenas usuários com 18 anos ou mais podem concluir o cadastro. | Piloto |
| RN-002 | O CPF deve ser único. | Piloto |
| RN-003 | O e-mail deve ser único. | Piloto |
| RN-004 | São obrigatórios: nome completo, CPF, data de nascimento, telefone ou WhatsApp, e-mail e senha. | Piloto |
| RN-005 | O telefone ou WhatsApp deve passar pelo mecanismo de validação definido. | Piloto |
| RN-006 | O login ocorre por e-mail e senha. | Piloto |
| RN-007 | A recuperação de acesso usa token de uso único e validade limitada. **[confirmar a duração]** | Nova |
| RN-008 | A sessão expira e pode ser revogada; o acesso protegido é revalidado no servidor. | Nova |

## Reservas, pagamentos e vagas (TCC 4.5.2)

| ID | Regra | Origem |
| --- | --- | --- |
| RN-009 | Cada reserva é individual e vinculada a um único passageiro autenticado. | TCC 4.5.2 |
| RN-010 | O checkout é obrigatório. | TCC 4.5.2 |
| RN-011 | O pagamento integral é a modalidade padrão. | TCC 4.5.2 |
| RN-012 | O pagamento em duas parcelas de 50% pode ser habilitado individualmente por excursão. | TCC 4.5.2 |
| RN-013 | A data limite da segunda parcela é configurada por excursão e é anterior à partida (23:59:59 da data configurada). | TCC 4.5.2 / Piloto/AGT-005 |
| RN-014 | Durante o checkout há retenção temporária de vaga. | TCC 4.5.2 |
| RN-015 | A retenção não representa ocupação definitiva. | TCC 4.5.2 |
| RN-016 | No pagamento integral, a confirmação financeira converte a retenção em ocupação efetiva e a reserva fica "Pronto para embarque". | TCC 4.5.2 |
| RN-017 | No parcelamento, a confirmação da primeira parcela ocupa a vaga e mantém obrigação financeira pendente. | TCC 4.5.2 |
| RN-018 | A confirmação da segunda parcela conclui a quitação. | TCC 4.5.2 |
| RN-019 | Se a segunda parcela não for paga no prazo, a vaga é liberada. | TCC 4.5.2 |
| RN-020 | Nesse caso, a primeira parcela permanece não reembolsável. | TCC 4.5.2 |
| RN-021 | Nenhuma operação pode resultar em vagas ocupadas acima da capacidade da excursão. | TCC 4.5.2 |
| RN-022 | Confirmação financeira recebida após a expiração da retenção, sem disponibilidade, é registrada para tratamento administrativo, sem criar vaga adicional. | TCC 4.5.2 |

## Situações da reserva (TCC 4.5.3)

| ID | Regra | Origem |
| --- | --- | --- |
| RN-023 | As situações da reserva são: Aguardando pagamento, Pronto para embarque, Concluída e Cancelada. | TCC 4.5.3 |
| RN-024 | Reservas integralmente pagas ou com segunda parcela quitada ficam "Pronto para embarque". | TCC 4.5.3 |
| RN-025 | Um dia após a data final da excursão, reservas elegíveis ficam automaticamente "Concluída". | TCC 4.5.3 |
| RN-026 | Reservas concluídas permanecem no histórico do passageiro. | TCC 4.5.3 |

## Cancelamentos e reembolsos (TCC 4.5.4)

| ID | Regra | Origem |
| --- | --- | --- |
| RN-027 | Cancelamento pelo passageiro com antecedência de pelo menos duas semanas: reembolso de 100% do valor elegível. | TCC 4.5.4 |
| RN-028 | Com menos de duas semanas e pelo menos uma semana: reembolso de 50% do valor elegível. | TCC 4.5.4 |
| RN-029 | Com menos de uma semana: sem reembolso. | TCC 4.5.4 |
| RN-030 | O reembolso incide sobre o valor efetivamente pago e elegível. | TCC 4.5.4 |
| RN-031 | Cancelamento pela organização: reembolso integral dos valores pagos aos passageiros afetados. | TCC 4.5.4 |
| RN-032 | A primeira parcela de reserva parcelada não quitada permanece não reembolsável (inadimplência). | TCC 4.5.4 |

## Administração e integridade (TCC 4.5.5)

| ID | Regra | Origem |
| --- | --- | --- |
| RN-033 | O administrador configura capacidade, preço, parcelamento e prazo da segunda parcela de cada excursão. | TCC 4.5.5 |
| RN-034 | O administrador consulta passageiros e reservas. | TCC 4.5.5 |
| RN-035 | Alterações manuais de situação só ocorrem quando autorizadas e ficam registradas na auditoria. | TCC 4.5.5 |
| RN-036 | Com reserva ou retenção ativa, condições comerciais e temporais da excursão não podem ser editadas; nome, imagem e descrição continuam editáveis. **[confirmar]** | Piloto/AGT-005 |
| RN-037 | A excursão é criada em Rascunho; a publicação é ação distinta. **[confirmar]** | Piloto/AGT-005 |
| RN-038 | Valores monetários são guardados em centavos inteiros (BRL). | Piloto/AGT-005 |
| RN-039 | Instantes são guardados em UTC e interpretados no fuso America/Sao_Paulo. | Piloto/AGT-005 |
| RN-040 | Retenção, confirmação e expiração usam mecanismos que preservam a capacidade sob processamento concorrente. | TCC 4.5.5 |
| RN-041 | Operações administrativas e automáticas relevantes geram histórico de auditoria. | TCC 4.7 |
| RN-042 | Logs e auditoria não contêm senhas, tokens ou dados cadastrais desnecessários. | Nova |

## Governança do agente de IA

| ID | Regra | Origem |
| --- | --- | --- |
| RN-043 | A IA não pode alterar autonomamente regras de negócio aprovadas. | Piloto |
| RN-044 | Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana. | Piloto |
