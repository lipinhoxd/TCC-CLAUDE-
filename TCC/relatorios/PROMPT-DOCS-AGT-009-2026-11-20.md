# Prompt para o assistente do Google Docs: transcrição da AGT-009 (20/11/2026)

Cole o texto abaixo, a partir de "Tarefa", no assistente do Google Docs ("VERSÃO BASE DO TCC"). Todas as âncoras foram conferidas na leitura do Docs de 20/11/2026 (866 linhas extraídas, sem mudança desde a conferência da AGT-008): cada "texto atual" aparece uma única vez. Origem dos dados: `TCC/registros-agente/AGT-009.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-009.md` e `git log` (commits c051823 e 8b1b1cf).

---

## Tarefa

Aplique no documento as 17 trocas de texto e as 3 inserções descritas abaixo, na ordem, sem nenhuma outra alteração.

## Regras

1. Aplique somente o que está na lista. Não reescreva, não reformate e não corrija mais nada, mesmo que perceba outro erro; apenas informe ao final.
2. Em cada troca, localize o "texto atual" exato; se não existir ou não for único no local indicado, não aplique e informe qual item parou.
3. Troque somente o trecho indicado, mantendo o restante do parágrafo, a fonte, o tamanho, o alinhamento e o espaçamento.
4. Nas inserções, copie a formatação do elemento vizinho equivalente (parágrafo da Seção 5.3, linha do Quadro 2, ficha do Apêndice E).
5. Preserve o padrão do documento: Times New Roman, justificado, terceira pessoa, "pesquisadores" no plural, números em algarismos. Não use "independente" para revisão ou verificação. Não altere numeração nem títulos.
6. Ao final, informe uma linha por item: aplicado, ou não aplicado com o motivo.

## Parte 1 — Trocas de texto

### Troca 1 (Resumo)
- Texto atual: `oito das 18 atividades previstas (n = 8) foram concluídas e classificadas (as oito aprovadas com intervenção humana,`
- Texto proposto: `nove das 18 atividades previstas (n = 9) foram concluídas e classificadas (as nove aprovadas com intervenção humana,`

### Troca 2 (Abstract)
- Texto atual: `eight of the 18 planned activities (n = 8) have been completed and classified (all eight approved with human intervention,`
- Texto proposto: `nine of the 18 planned activities (n = 9) have been completed and classified (all nine approved with human intervention,`

### Troca 3 (Seção 5.1, 1.º parágrafo)
- Texto atual: `Nesse experimento, 8 das 18 atividades previstas estão concluídas e classificadas pelos pesquisadores (n = 8)`
- Texto proposto: `Nesse experimento, 9 das 18 atividades previstas estão concluídas e classificadas pelos pesquisadores (n = 9)`

### Troca 4 (Seção 5.1, 1.º parágrafo)
- Texto atual: `e a AGT-008 foi executada em uma tentativa e classificada como AP-3; as demais atividades (AGT-009 a AGT-018) ainda não foram iniciadas.`
- Texto proposto: `a AGT-008 foi executada em uma tentativa e classificada como AP-3, e a AGT-009 foi executada em uma tentativa e classificada como AP-3; as demais atividades (AGT-010 a AGT-018) ainda não foram iniciadas.`

### Troca 5 (Seção 5.4)
- Texto atual: `a partir da AGT-009, pagamentos`
- Texto proposto: `a partir da AGT-010, pagamento parcelado`

### Troca 6 (Seção 6.1, 1.º parágrafo)
- Texto atual: `oito atividades foram concluídas e classificadas: a AGT-001`
- Texto proposto: `nove atividades foram concluídas e classificadas: a AGT-001`

### Troca 7 (Seção 6.1, 1.º parágrafo)
- Texto atual: `, e a AGT-008, como AP-3, com uma tentativa e intervenção humana do tipo decisão sobre vagas e concorrência (três decisões previstas na instrução).`
- Texto proposto: `, a AGT-008, como AP-3, com uma tentativa e intervenção humana do tipo decisão sobre vagas e concorrência (três decisões previstas na instrução), e a AGT-009, como AP-3, com uma tentativa e intervenção humana do tipo decisão sobre pagamento e vagas (três decisões previstas na instrução).`

### Troca 8 (Seção 6.1, 2.º parágrafo)
- Texto atual: `reaplicada nas AGT-001 a AGT-008 do experimento principal`
- Texto proposto: `reaplicada nas AGT-001 a AGT-009 do experimento principal`

### Troca 9 (Seção 6.1, 3.º parágrafo)
- Texto atual: `(n = 5 no piloto e n = 8 no experimento principal)`
- Texto proposto: `(n = 5 no piloto e n = 9 no experimento principal)`

### Troca 10 (Seção 6.2)
- Texto atual: `Esses tempos não devem ser interpretados isoladamente`
- Texto proposto: `Na AGT-009, o pagamento integral (provedor simulado, confirmação atômica e idempotente, tratamento da confirmação tardia e página de checkout com pagamento) foi produzido em cerca de 14,8 min até a checagem completa, que incluem a documentação, as verificações por mutação e o percurso em navegador real, com 420 testes aprovados (48 novos), sem incluir a espera pelas decisões do pesquisador; esse tempo é comparável ao da AGT-008, mas não aos das atividades anteriores. Esses tempos não devem ser interpretados isoladamente`

### Troca 11 (Seção 6.3)
- Texto atual: `e a atividade foi classificada como AP-3. Também foram encaminhados`
- Texto proposto: `e a atividade foi classificada como AP-3. Na AGT-009, que toca em pagamento e vagas, o agente parou antes de criar arquivos para três decisões (meio de pagamento; ciclo do pagamento e da confirmação; confirmação depois da expiração), o pesquisador escolheu as opções recomendadas, e a atividade foi classificada como AP-3. Também foram encaminhados`

### Troca 12 (Seção 6.4, 1.º parágrafo)
- Texto atual: `5 atividades no piloto (n = 5) e 8 das 18 previstas classificadas no experimento principal (n = 8)`
- Texto proposto: `5 atividades no piloto (n = 5) e 9 das 18 previstas classificadas no experimento principal (n = 9)`

### Troca 13 (Seção 6.4, 1.º parágrafo)
- Texto atual: `e a concorrência foi testada sem carga.`
- Texto proposto: `e a concorrência foi testada sem carga; na AGT-009, o pagamento usa um provedor simulado e não há provedor real, o pagamento pendente que nunca é confirmado só será fechado pela rotina da AGT-014, a confirmação sem vaga fica sinalizada sem tela de administração nem reembolso e a confirmação tardia com vaga livre e sem retenção nova foi verificada apenas em teste automatizado.`

### Troca 14 (Capítulo 7)
- Texto atual: `tem, até o momento, 8 das 18 atividades previstas concluídas e classificadas pelos pesquisadores (n = 8):`
- Texto proposto: `tem, até o momento, 9 das 18 atividades previstas concluídas e classificadas pelos pesquisadores (n = 9):`

### Troca 15 (Capítulo 7)
- Texto atual: `, e a AGT-008, classificada como AP-3.`
- Texto proposto: `, a AGT-008, classificada como AP-3, e a AGT-009, classificada como AP-3.`

### Troca 16 (Seção 4.8)
- Texto atual: `e a expiração avaliada na leitura e na gravação (AGT-008). Desde o esquema inicial (versão 1), nenhuma atividade criou migração.`
- Texto proposto: `e a expiração avaliada na leitura e na gravação (AGT-008); pagamento integral com provedor simulado, confirmação atômica e idempotente e registro da confirmação sem vaga em coluna nova (AGT-009). Desde o esquema inicial (versão 1), só a AGT-009 criou migração (versão 2).`

### Troca 17 (Apêndice D)
- Texto atual: `AGT-009 (planejada): RF-023, RF-025 e RF-026; RN-011, RN-016 e RN-022.`
- Texto proposto: `AGT-009 (principal, AP-3): RF-023 com evidência e RF-025 e RF-026 em parte (pastas server/pagamentos, server/reservas, src e tests, documentos docs/reservas.md e docs/banco-de-dados.md; 420 testes; commit c051823; registro AGT); RN-011, RN-016 e RN-022 com evidência. O pagamento da primeira parcela fica para a AGT-010; a tela de administração e o estorno, para as AGT-012 e AGT-013.`

## Parte 2 — Inserções

### Inserção 1 (Seção 5.3): novo parágrafo da AGT-009
Insira um novo parágrafo logo depois do parágrafo que começa com "AGT-008 — Capacidade e retenção temporária de vagas.", separado dele por um parágrafo em branco, como os demais da seção. Texto exato do parágrafo:

AGT-009 — Pagamento integral. A instrução, escrita pelo agente a partir da especificação e aprovada pelo pesquisador em 20/11/2026, às 23:19, está preservada em TCC/registros-agente/AGT-009.md. Por tocar em pagamentos e vagas, a instrução declarou que toda decisão em aberto na especificação cabia ao pesquisador (RN-043 e RN-044) e determinou que o agente parasse antes de criar arquivos para apresentar, com vantagens, desvantagens e recomendação, três decisões: o meio de pagamento nesta fase; o ciclo do pagamento e da confirmação; e a confirmação depois da expiração da retenção. O pesquisador aceitou todas as opções recomendadas: o meio de pagamento é um provedor simulado interno, atrás de uma interface que permite trocá-lo, que existe só fora de produção, sem nenhum dado real de pagamento; a linha de pagamento nasce quando o passageiro clica em pagar, com o valor calculado no servidor, e o pagamento exige retenção ativa, sendo o pagamento recusado reaproveitado em nova tentativa e o pendente nunca confirmado mantido pendente; e a confirmação feita depois da expiração ocupa a vaga normalmente quando há vaga livre e, sem vaga, deixa o pagamento confirmado e sinalizado em uma coluna nova, sem criar vaga adicional, com a reserva ainda aguardando pagamento. Após as decisões, a checagem completa passou em cerca de 14,8 min (das 23:21 às 23:36), que incluem a documentação, quatro verificações por mutação do código e o percurso em navegador real, sem contar a espera pelas decisões. O agente criou o provedor simulado, o registro e a confirmação do pagamento integral em uma única transação atômica e idempotente, que converte a retenção, ocupa a vaga com o mecanismo da AGT-008 e coloca a reserva em Pronto para embarque, o tratamento da confirmação tardia, uma migração nova e pequena (versão 2, coluna de pendência administrativa) e o bloco de pagamento da página de checkout. Para isso, alterou a regra de desistência da AGT-007, que passou a ser bloqueada apenas por pagamento pendente ou confirmado, o que foi descrito para revisão humana. Lint, verificação de tipos e build passaram, e os 420 testes automatizados (372 anteriores e 48 novos, com dois testes de atividades anteriores atualizados) foram aprovados. Em execução real, com a API e o front-end juntos e dados fictícios, o agente percorreu no Microsoft Edge o pagamento aprovado, o recusado com nova tentativa, a reserva parcelada recusada, a disputa pela última vaga e a confirmação tardia com e sem vaga, e conferiu no banco que nenhuma excursão passou da capacidade e que a auditoria não tem dados pessoais nem de pagamento. As limitações conhecidas (ausência de provedor real, com o pagamento indisponível em produção; pagamento pendente que só será fechado pela rotina da AGT-014; confirmação sem vaga sem tela de administração nem reembolso, a cargo das AGT-012 e AGT-013; confirmação tardia com vaga livre e sem retenção nova verificada apenas em teste automatizado; concorrência sem teste de carga; um único navegador e ausência de teste com leitor de tela) estão documentadas. Os pesquisadores classificaram a atividade como AP-3, sem registrar justificativa, a revisão do código foi aprovada pelo fechamento padrão que eles autorizaram, e a atividade consta com uma tentativa e sem nova instrução (commit c051823). A avaliação humana foi redigida pelo agente, e a classificação foi decidida pelos pesquisadores.

### Inserção 2 (Quadro 2): nova linha
Acrescente uma linha ao fim do Quadro 2 (depois da linha "Principal, AGT-008"), com as mesmas colunas e a mesma formatação das linhas vizinhas:

| Estudo e atividade | Classe | Tentativas | Testes aprovados | Intervenção humana | Commit |
| --- | --- | --- | --- | --- | --- |
| Principal, AGT-009 | AP-3 | 1 | 420 (48 novos) | Sim (decisão sobre pagamento e vagas) | c051823 |

### Inserção 3 (Apêndice E): ficha da AGT-009
Insira a ficha logo antes do título "Ficha — Piloto (Codex), AGT-001", depois da última linha da ficha da AGT-008, no mesmo formato das fichas do experimento principal: um título "Ficha — Experimento principal, AGT-009" seguido de 20 parágrafos "Campo: valor", nesta ordem e com este texto exato:

Título: Ficha — Experimento principal, AGT-009

ID e título: AGT-009 — Pagamento integral

Estudo: Principal (Claude Code)

Objetivo: Implementar o pagamento integral e a confirmação financeira que ocupa a vaga: o passageiro paga a reserva integral; o pagamento é registrado (parcela única, valor em centavos); a confirmação converte a retenção, ocupa a vaga sem ultrapassar a capacidade e coloca a reserva em "Pronto para embarque"; a confirmação depois da expiração e sem vaga é registrada para tratamento administrativo, sem vaga adicional.

Requisitos relacionados: RF-023; RF-025 e RF-026 (em parte); RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-010, RN-011, RN-014, RN-015, RN-016, RN-021, RN-022, RN-023, RN-038, RN-039, RN-040 e RN-041 a RN-044.

Comando inicial: Instrução original na Seção 5 de TCC/registros-agente/AGT-009.md (escrita pelo agente e aprovada pelo pesquisador em 20/11/2026 às 23:19:55; usada sem alterações).

Critérios de aceitação: 24 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código.

Testes: 420 testes em 24 arquivos, todos aprovados (372 anteriores e 48 novos; 1 da AGT-007 e 1 da AGT-008 atualizados), 0 reprovados. Quatro mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios.

Lint, tipos e build: Aprovados.

Número de tentativas: 1.

Duração: Decisões respondidas e início às 23:21:54 de 20/11/2026; checagem completa aprovada às 23:36:40 (≈ 14,8 min), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões não é contada. Relógio do sistema; exclui a revisão humana.

Pausas ou interrupções: Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção por limite de uso.

Intervenção humana: Sim: decisão sobre pagamento e vagas (meio de pagamento; ciclo do pagamento e da confirmação; confirmação depois da expiração).

Decisão técnica: Provedor simulado interno só fora de produção (em produção, 503); linha de pagamento ao clicar em Pagar, com valor do servidor e retenção ativa; recusado vira falhou e reaproveita a linha; pendente permanece pendente; confirmação atômica e idempotente (BEGIN IMMEDIATE) usando ocuparVaga; depois da expiração, com vaga livre ocupa e sem vaga o pagamento fica confirmado e sinalizado (migração 2, coluna pendencia_administrativa) e a reserva continua aguardando pagamento. Nenhuma dependência. Alteração em código de outra atividade: server/reservas/service.ts (AGT-007 e AGT-008), a desistência passa a ser bloqueada por pagamento pendente ou confirmado; revisão humana aprovada (RN-044). Ver docs/reservas.md.

Versão do agente: Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista no início da atividade: 2.1.325. Versão da ferramenta nas atividades anteriores: [DADO NÃO REGISTRADO].

Ambiente: Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.

Commits: c051823 (atividade e registro).

Evidências: Registro (Seções 6 a 10); diário (Entradas 84 a 87); METRICAS.csv; server/pagamentos/, server/reservas/, src/pages/Reservas.tsx, tests/ e docs/reservas.md.

Classificação final: AP-3 (decisão do pesquisador, 20/11/2026; critério único: decisão exigida pela instrução = AP-3).

Segundo avaliador: [DADO NÃO REGISTRADO] (não designado).

Limitações: Sem provedor real (em produção, 503); pagamento pendente nunca confirmado fica pendente até a AGT-014; confirmação sem vaga sem tela de administração (AGT-012) nem reembolso (AGT-013); confirmação tardia com vaga livre e sem retenção verificada só em teste automatizado; concorrência sem teste de carga; pagamento em parcelas é da AGT-010; um navegador. A avaliação humana foi redigida pelo agente.

## Ao terminar

Releia os trechos alterados e confirme que: (a) o Resumo, o Abstract, as Seções 5.1, 6.1 e 6.4 e o Capítulo 7 dizem "n = 9" no experimento principal e "n = 5" no piloto, sem somar os dois; (b) a Seção 5.1 diz que as demais atividades são AGT-010 a AGT-018; (c) a Seção 5.4 diz "a partir da AGT-010"; (d) o Quadro 2 tem 9 linhas do experimento principal e a fonte cita 20/11/2026; (e) a ficha da AGT-009 tem 20 campos; (f) o documento ganhou apenas o novo parágrafo da Seção 5.3, a linha do Quadro 2 e a ficha (título e 20 campos); informe a contagem de parágrafos antes e depois.
