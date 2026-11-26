# Pedido de correção ao Gemini (26/11/2026) — depois da aplicação da AGT-012

**Destino:** Gemini (Google Docs "VERSÃO BASE DO TCC"). Substitui o pedido de 24/11/2026.
**Status:** proposta do agente. Enviar só depois da aprovação dos pesquisadores. A Parte A pode ser enviada de imediato; a Parte B só se a classe "AP-4" **não** foi uma decisão dos pesquisadores.

## Regras para o Gemini

Aplicar somente o que está nesta lista, com os textos exatos. Não criar classes, quadros, métricas, contagens, análises ou citações. Não apagar nem duplicar outros trechos. Manter a formatação do vizinho equivalente. Ao final, informar uma linha por item: aplicado, ou não aplicado com o motivo.

---

## PARTE A — correções de registro (independem de decisão)

### A1. Apêndice E: falta a ficha da AGT-012
Inserir imediatamente antes do título "Ficha — Piloto (Codex), AGT-001" um título "Ficha — Experimento principal, AGT-012" seguido desta tabela, no mesmo formato da ficha da AGT-010:

| Campo | Registro |
| --- | --- |
| ID e título | AGT-012 — Administração de reservas e passageiros |
| Estudo | Principal (Claude Code) |
| Objetivo | Implementar a consulta de reservas e de passageiros pelo administrador e a alteração manual de situação, quando autorizada, sempre registrada na auditoria, com a consulta das pendências administrativas. |
| Requisitos relacionados | RF-037, RF-038 e RF-039; RF-026 (em parte); RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-034, RN-035, RN-023 a RN-026, RN-009, RN-010, RN-014, RN-015, RN-019 a RN-022, RN-032 e RN-040 a RN-044. |
| Comando inicial | Instrução original na Seção 5 de TCC/registros-agente/AGT-012.md (escrita pelo agente e aprovada pelo pesquisador em 24/11/2026 às 21:47:37; usada sem alterações). |
| Critérios de aceitação | 25 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código. |
| Testes | 557 testes em 30 arquivos, todos aprovados, 0 reprovados (55 novos: 34 de API e 21 de interface). Cinco mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios. |
| Lint, tipos e build | Aprovados. |
| Número de tentativas | 1. |
| Duração | 15,53 min em relógio (decisões respondidas e início da implementação às 21:49:20 e verificação final às 22:04:52, de 24/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões e pela classificação não é contada. Exclui a revisão humana. |
| Pausas ou interrupções | Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação; a classificação foi dada em 26/11/2026. |
| Intervenção humana | Sim: decisão sobre dados pessoais, situação de reserva e pendências financeiras (dados pessoais visíveis ao administrador; alterações manuais autorizadas; pendências administrativas). |
| Decisão técnica | Lista de passageiros com CPF e telefone mascarados e dados completos só no detalhe, com auditoria de cada consulta; alterações manuais só sem efeito financeiro (cancelar reserva aguardando sem pagamento; concluir reserva pronta de excursão terminada), com justificativa obrigatória, transação única, idempotência e auditoria com o administrador; pendências apenas para consulta. Sem migração e sem dependência nova. |
| Versão do agente | Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO]. |
| Ambiente | Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0. |
| Commits | 482f981 (atividade e registro). |
| Evidências | Registro (Seções 6 a 10); diário (Entradas 96 a 100); METRICAS.csv; server/admin/, src/pages/AdminReservas.tsx, src/admin/reservas-admin-api.ts, tests/ e docs/administracao-reservas.md. |
| Classificação final | AP-3 (decisão do pesquisador, 26/11/2026; critério único: decisão exigida pela instrução = AP-3). |
| Segundo avaliador | [DADO NÃO REGISTRADO] (não designado). |
| Limitações | Conclusão manual quase sempre redundante com a conclusão automática; sem tratamento de pendência nem reembolso (AGT-013); sem tarefa agendada (AGT-014); justificativa livre sem filtro de dados pessoais; leituras que gravam (vencimento, conclusão e auditoria da consulta); busca por CPF parcial; pendência e datas ajustadas no banco para a demonstração em navegador; tabela com rolagem dentro do quadro no celular; um navegador, sem leitor de tela; concorrência sem teste de carga. A avaliação humana foi redigida pelo agente a pedido do pesquisador. |

### A2. Apêndice E: ficha da AGT-011 com erros
Substituir a tabela inteira da ficha "Ficha — Experimento principal, AGT-011" por esta (a última linha está sem o rótulo "Limitações"):

| Campo | Registro |
| --- | --- |
| ID e título | AGT-011 — Área do passageiro |
| Estudo | Principal (Claude Code) |
| Objetivo | Implementar a área do passageiro: lista de minhas reservas (Em andamento e Histórico), detalhe e situação da reserva e histórico de reservas concluídas; a reserva pronta passa a Concluída um dia após a data final da excursão, com auditoria e sem alterar vagas nem pagamentos; cada passageiro vê somente as próprias reservas. |
| Requisitos relacionados | RF-029, RF-030 e RF-031; RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-023, RN-024, RN-025, RN-026, RN-009, RN-010, RN-020, RN-032, RN-038, RN-039, RN-041 a RN-044. |
| Comando inicial | Instrução original na Seção 5 de TCC/registros-agente/AGT-011.md (escrita pelo agente e aprovada pelo pesquisador em 23/11/2026 às 11:14:03; usada sem alterações). |
| Critérios de aceitação | 23 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código. |
| Testes | 502 testes em 28 arquivos, todos aprovados, 0 reprovados (39 novos: 21 de API e 18 de interface; 1 teste da AGT-007 atualizado). Cinco mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios. |
| Lint, tipos e build | Aprovados. |
| Número de tentativas | 1. |
| Duração | 9,37 min em relógio (decisões respondidas e início da implementação às 21:17:19 e verificação final às 21:26:41, de 24/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões não é contada. Exclui a revisão humana. |
| Pausas ou interrupções | Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação. |
| Intervenção humana | Sim: decisão sobre situação da reserva e dados do passageiro (como a reserva vira Concluída; composição da lista e do histórico; conteúdo e ações do detalhe). |
| Decisão técnica | Conclusão avaliada na leitura e na gravação, sem tarefa em segundo plano, gravada com auditoria do sistema (só reserva em Pronto para embarque, a partir de 00:00 de Brasília do dia seguinte à data final; sem efeito em vagas e pagamentos); uma página com os blocos Em andamento e Histórico (concluídas e canceladas); página de detalhe própria com o checkout mantido como página de pagamento; isolamento por passageiro (404 igual para reserva alheia e inexistente). Sem migração e sem dependência nova. |
| Versão do agente | Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO]. |
| Ambiente | Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0. |
| Commits | c8ed387 (atividade e registro). |
| Evidências | Registro (Seções 6 a 10); diário (Entradas 92 e 93); METRICAS.csv; server/vagas/conclusao.ts, server/reservas/, src/pages/MinhasReservas.tsx, tests/ e docs/reservas.md. |
| Classificação final | AP-3 (decisão do pesquisador, 24/11/2026; critério único: decisão exigida pela instrução = AP-3). |
| Segundo avaliador | [DADO NÃO REGISTRADO] (não designado). |
| Limitações | A passagem para Concluída só é gravada quando o passageiro consulta (rotina periódica na AGT-014); reserva em Aguardando pagamento depois do fim da excursão não é concluída nem cancelada; conclusão demonstrada no navegador alterando as datas da excursão no banco; lista com cancelada por inadimplência só em teste automatizado; no celular a tabela da lista rola dentro do quadro; aviso ao passageiro só na tela; sem paginação; concorrência da conclusão sem teste com duas conexões; um navegador, sem leitor de tela. A avaliação humana foi redigida pelo agente a pedido do pesquisador. |

### A3. Seção 5.3: parágrafo da AGT-011
Substituir o parágrafo inteiro que começa com "AGT-011 — Área do passageiro." por:

> AGT-011 — Área do passageiro. A instrução, escrita pelo agente a partir da especificação e aprovada pelo pesquisador em 23/11/2026, às 11:14, está preservada em TCC/registros-agente/AGT-011.md. Por tocar na situação das reservas e em dados do passageiro, a instrução determinou que o agente parasse antes de criar arquivos para apresentar, com vantagens, desvantagens e recomendação, três decisões: como a reserva passa a Concluída antes da rotina automática; a composição da lista e do histórico; e o conteúdo e as ações do detalhe. O pesquisador aceitou, em 24/11/2026, às 21:17, todas as opções recomendadas: a conclusão é avaliada na leitura e na gravação, sem tarefa em segundo plano, que fica para a AGT-014, gravada com auditoria e restrita à reserva Pronta para embarque a partir de 00:00 do dia seguinte à data final da excursão, no horário de Brasília, sem alterar vagas nem pagamentos; uma única página reúne os blocos Em andamento e Histórico, este com as reservas concluídas e canceladas; e o detalhe tem página própria, com o checkout mantido como página de pagamento. O agente criou a rotina de conclusão, a lista e o detalhe das próprias reservas, com isolamento entre passageiros, e o item Minhas reservas no menu do passageiro, sem migração e sem dependência nova. Lint, verificação de tipos e build passaram, e os 502 testes automatizados (463 anteriores e 39 novos) foram aprovados; cinco verificações por mutação do código foram detectadas. Em execução real, com dados fictícios, o agente percorreu no Microsoft Edge a lista, o detalhe, o isolamento entre duas passageiras, o bloqueio do visitante e da administradora e a conclusão, demonstrada com a alteração das datas da excursão diretamente no banco; a lista com reserva cancelada por inadimplência foi verificada apenas em testes automatizados. Após as decisões, a checagem completa passou em cerca de 9,4 min. As limitações conhecidas (conclusão gravada apenas quando há consulta; reserva que aguarda pagamento depois do fim da excursão não é concluída nem cancelada; aviso ao passageiro apenas na tela; tabela com rolagem dentro do quadro no celular; ausência de paginação; um único navegador, sem leitor de tela) estão documentadas. Os pesquisadores classificaram a atividade como AP-3, sem registrar justificativa, a revisão do código foi aprovada no fechamento autorizado por eles, e a atividade consta com uma tentativa e sem nova instrução (commit c8ed387). A avaliação humana foi redigida pelo agente, e a classificação foi decidida pelos pesquisadores.

### A4. Quadro 2: linha "Principal, AGT-011"
Na coluna de intervenção humana, trocar "Sim (decisão sobre área do passageiro e conclusão)" por "Sim (decisão sobre situação da reserva e dados do passageiro)".

### A5. Seção 6.1
No trecho sobre a AGT-011, trocar "decisão sobre área do passageiro e conclusão" por "decisão sobre situação da reserva e dados do passageiro".

### A6. Seção 4.8
No parágrafo que começa com "No experimento principal, a tecnologia de persistência", acrescentar ao final: "Desde o esquema inicial (versão 1), apenas as AGT-009 e AGT-010 criaram migrações (versões 2 e 3)."

---

## PARTE B — somente se a "AP-4" NÃO foi decisão dos pesquisadores

A rubrica do repositório tem quatro classes (AP-1, AP-2, AP-3 e RP). O Docs passou a ter cinco e redefiniu o AP-3.

### B0. Tabela das classes
Na tabela das classificações, remover a linha "AP-4 — Aprovado com intervenção corretiva" e voltar o rótulo "AP-3 — Aprovado com intervenção planejada de governança" para "AP-3 — Aprovado com intervenção humana".

### B1. Seção das classificações (parágrafo que começa com "São utilizadas cinco classificações")
Substituir o parágrafo inteiro por:

> São utilizadas quatro classificações. AP-1 indica atividade aprovada na primeira execução, sem nova instrução corretiva ou intervenção direta. AP-2 indica atividade aprovada após uma ou mais correções realizadas pelo próprio agente mediante nova interação. AP-3 indica atividade que necessitou de intervenção direta do desenvolvedor para atingir os critérios de aceitação. RP representa atividade não concluída satisfatoriamente pela abordagem utilizada.

### B2. Parágrafo que começa com "Para tornar a classificação reproduzível"
Substituir o parágrafo inteiro por:

> Para tornar a classificação reproduzível, adotam-se definições operacionais. Tentativa é uma execução da instrução pelo agente, do envio da instrução ao relatório final, a partir de um estado conhecido do repositório; conta como nova tentativa uma nova instrução corretiva ou uma execução refeita, e não conta a interrupção por limite de uso retomada sem reinício. Intervenção humana é o ato direto do pesquisador, necessário para a atividade atingir os critérios, como esclarecimento de requisito, decisão de arquitetura ou alteração de código. Tempo é a duração cronológica pelo relógio do sistema, da execução da instrução ao relatório do agente, sem a revisão humana, com as pausas combinadas informadas à parte. A rubrica completa e o campo para um segundo avaliador independente constam do Apêndice F; até o momento não há segundo avaliador designado, o que é registrado como ameaça à validade.

### B3. Parágrafo dos indicadores ("Os indicadores quantitativos previstos incluem")
Substituir o parágrafo inteiro por:

> Os indicadores quantitativos previstos incluem distribuição das classificações, taxa de AP-1, taxa de AP-2, taxa de intervenção humana, taxa de conclusão, número de tentativas e duração das atividades. Também são considerados a quantidade e os resultados dos testes quando aplicáveis. Esses indicadores são descritivos e devem ser interpretados em conjunto.

### B4. Parágrafo das limitações do método ("Os resultados estão sujeitos a limitações")
Substituir o parágrafo inteiro por:

> Os resultados estão sujeitos a limitações. O estudo utiliza um único projeto, um único agente e um domínio específico; o desenvolvimento foi reiniciado após um piloto com outro agente; o agente, além de executar as tarefas, redige parte da documentação do trabalho, inclusive a especificação do experimento principal, sob revisão dos pesquisadores; as atividades possuem níveis de complexidade diferentes; a forma de redigir instruções e a quantidade de contexto podem influenciar as respostas; o pesquisador acumula os papéis de desenvolvedor e avaliador; e ferramentas de IA podem sofrer atualizações durante o período experimental. Também constitui ameaça à validade o fato de o agente orientar o pesquisador, a pedido deste, na escolha da classificação de cada atividade, explicando o que cada categoria significa e recomendando uma opção; a decisão e a responsabilidade permanecem do pesquisador, mas a orientação pode influenciar a classificação.

### B5. Parágrafo "Após a ampliação da amostra do experimento principal" (Capítulo 7)
Substituir o parágrafo inteiro por:

> Após a ampliação da amostra do experimento principal, serão calculadas frequências e proporções de AP-1, AP-2, AP-3 e RP, taxa de conclusão, número de tentativas, duração e ocorrência de intervenção humana. As dificuldades serão agrupadas por categoria e relacionadas ao tipo de tarefa, e atividades representativas serão analisadas qualitativamente. O piloto com o Codex será descrito à parte, sem composição estatística com o experimento principal. A discussão final confrontará os resultados com a literatura e responderá à questão de pesquisa.

### B6. Apêndice F, parágrafo "Classes."
Substituir o parágrafo inteiro por:

> Classes. AP-1: verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta. AP-2: atendidas após correções do próprio agente, sem intervenção direta (no experimento principal, a decisão do pesquisador exigida pela instrução conta como intervenção direta e leva a AP-3). AP-3: atendidas somente com intervenção direta do pesquisador. RP: não atendidas pela abordagem utilizada.

### B7. Trocas de trecho (Resumo, Abstract, Seções 6.1 e outras)
- Trocar `(as doze aprovadas com intervenção planejada de governança, AP-3, e nenhuma exigindo intervenção corretiva, AP-4)` por `(as doze aprovadas com intervenção humana, segundo o critério único adotado pelo pesquisador)` (todas as ocorrências).
- Trocar `(all twelve approved with planned governance intervention, AP-3, and zero requiring corrective intervention, AP-4)` por `(all twelve approved with human intervention, under a single criterion adopted by the researcher)` (todas as ocorrências).
- Trocar `aprovada com intervenção planejada de governança (AP-3)` por `aprovada com intervenção humana (AP-3)` (todas as ocorrências).
- Trocar `approved with planned governance intervention (AP-3)` por `approved with human intervention (AP-3)` (todas as ocorrências).
- Trocar `AP-2, AP-4 ou RP` por `AP-2 ou RP` (todas as ocorrências).
- Trocar `(intervenção planejada de governança) e nenhuma exigiu a classificação AP-4 (intervenção corretiva) ou RP` por `e nenhuma foi classificada como RP` (todas as ocorrências).
- Trocar `(intervenção planejada de governança) e nenhuma registrada como AP-4 (intervenção corretiva) ou RP` por `e nenhuma registrada como RP` (todas as ocorrências).
- Trocar `(intervenção planejada de governança) e registrada no commit` por `e registrada no commit` (todas as ocorrências).

### B8. Quadro 3 e análise "Sob uma perspectiva analítica"
Remover o parágrafo de introdução do Quadro 3, o título, a tabela e a fonte do Quadro 3, e o parágrafo que começa com "Sob uma perspectiva analítica". Eles trazem percentuais, "34 decisões", dados do piloto não conferidos, afirmações de causalidade e as palavras inglesas "controlled" e "established". (Se os pesquisadores quiserem manter um quadro de síntese, ele deve ser refeito só com dados de `METRICAS.csv`, sem AP-4 e sem inferência.)

### B9. Trechos restantes a conferir depois das trocas
- AP-3 — Aprovado com intervenção planejada de governança
- AP-4 — Aprovado com intervenção corretiva
- | AP-3 (Intervenção planejada de governança) | 1 (20,0%) | 12 (100,0%) |
- | AP-4 (Intervenção corretiva) | 0 (0,0%) | 0 (0,0%) |
- Sob uma perspectiva analítica, a predominância absoluta da classificação AP-3 (12 de 12 atividades) e a ausência da classificação AP-4 (0 de 12 atividades) no experimento principal refletem diretamente o desenho rigoroso e controlled do protocolo experimental, e não a ocorrência de falhas técnicas do agente / Esse comportamento evidencia a relevância de diferenciar conceitualmente as intervenções 

---

## PARTE C — decisão dos pesquisadores

**Seção 5.4:** o Docs diz que a data de corte "será definida ao término da execução experimental". Confirmar esse texto ou informar a nova data. Os registros do repositório traziam a proposta de 24/11/2026, já passada, com 12 das 18 atividades concluídas.
