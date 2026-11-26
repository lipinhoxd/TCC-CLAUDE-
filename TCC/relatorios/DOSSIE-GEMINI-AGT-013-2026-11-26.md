# Dossiê bruto da AGT-013 para o Gemini (26/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-013.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-013.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/cancelamentos.md`, `git log` (commits b27f70e e 49a512e) e o relatório em página privada (https://claude.ai/artifact/2q6yenwF9AhKDNNL3yyMBh).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Não criar classes.** Existem somente quatro: AP-1 (verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta), AP-2 (atendidas após correções do próprio agente, sem intervenção direta), AP-3 (as verificações só foram atendidas com intervenção direta do pesquisador) e RP (não atendidas pela abordagem utilizada). **Não existe "AP-4"** e o AP-3 não deve ser redefinido nem renomeado.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. Não inferir causalidade, produtividade, qualidade geral nem taxa generalizável; não há grupo de controle.
3. **Não inventar decisões, telas, funções ou limitações.** As decisões são exatamente as da seção B.
4. **Não apagar texto existente** e **não duplicar parágrafos**. Ao inserir a ficha, não alterar a ficha anterior (todas as linhas mantêm o rótulo do campo).
5. **Não mudar data de corte, escopo ou cronograma**: são decisão dos pesquisadores.
6. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 13** de 18; piloto **n = 5**; nunca somados.
7. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
8. **A ficha da AGT-013 é obrigatória** (a da AGT-012 não foi inserida na última aplicação). Ao final, informar uma linha por trecho alterado e confirmar que a ficha foi inserida.

Observação: há correções anteriores pendentes de aprovação dos pesquisadores (`TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md`); este dossiê não as aplica.

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. Não usar "revisão independente" nem "validação independente". A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-013 (Cancelamentos e reembolsos) é a 13.ª das 18 atividades do experimento principal com o Claude Code (Claude Sonnet 5.5). Foi executada em 26/11/2026, em uma tentativa, sem nova instrução, e classificada como AP-3 pelos pesquisadores no mesmo dia (resposta "ap 3"), segundo o critério único adotado por eles. A instrução foi escrita pelo agente a partir da especificação e aprovada pelo pesquisador em 26/11/2026 às 13:31:48; as três decisões foram respondidas às 13:34:02 ("recomendadas"). A implementação terminou, com a verificação final aprovada, às 13:50:20 (16,30 min de relógio, incluindo documentação, mutações e percurso em navegador; as esperas pelas decisões e pela classificação não são contadas).

Entrega: cancelamento da própria reserva pelo passageiro, com prévia do reembolso; cancelamento da excursão pela organização com reembolso integral aos afetados; fila de reembolsos confirmada pelo administrador em provedor simulado; e reembolso das pendências financeiras. Nenhum dinheiro é movimentado e não há provedor real.

Números: 610 testes automatizados aprovados em 32 arquivos (557 ao final da AGT-012; 53 novos: 40 de API e 13 de interface); lint, verificação de tipos e build aprovados; 6 mutações de verificação detectadas e restauradas; percurso em navegador real (Microsoft Edge sem interface) com dados fictícios; uma migração nova (versão 4) e nenhuma dependência nova.

## B. As três decisões dos pesquisadores (26/11/2026, 13:34:02) e suas razões

1. **Cálculo do reembolso (RN-027 a RN-030, RN-032).** Escolhida: antecedência em períodos exatos até a partida (14 dias x 24 h ou mais: 100%; de 7 a menos de 14: 50%; menos de 7: sem reembolso). Alternativa descartada: dias de calendário até a data inicial. Regras: cancelam reservas em Aguardando pagamento ou Pronto para embarque, só antes da partida; valor elegível é o pago e confirmado; parcelada só com a primeira paga cancela, libera a vaga e não é reembolsada; pagamento pendente vira recusado; 50% com metade arredondada para baixo; o passageiro vê a prévia antes de confirmar e, se a faixa mudar, nada é cancelado.
2. **Processamento (RN-030, RN-022).** Escolhida: o reembolso nasce pendente e o administrador o confirma no provedor simulado; o pagamento vira estornado só quando devolvido por inteiro; recusado pode ser tentado de novo; pendências (pagamento sem vaga e segunda parcela tardia) geram reembolso integral na mesma fila. Alternativas: processamento automático; apenas registrar para processamento externo.
3. **Cancelamento da excursão (RN-031).** Escolhida: uma única transação, com justificativa, prévia e confirmação, só antes da partida; reservas ativas canceladas com 100% do pago, inclusive a parcelada só com a primeira paga; pendências da excursão também 100%; concluídas e já canceladas (inclusive por inadimplência) não afetadas; vagas liberadas e excursão Cancelada; a rota comum continua bloqueando o cancelamento com reservas ativas. Alternativa: processar reserva por reserva, com retomada.

Escolhas já adotadas no rascunho aprovado: escopo restrito; valores sempre do servidor, em centavos, sem reembolso acima do pago; transação única, idempotente e auditada; provedor simulado e tela sem promessa de prazo.

**Pergunta aberta aos pesquisadores (não respondida):** depois de reembolsar uma pendência de uma reserva ainda aguardando pagamento, a reserva continua aguardando, sem novo pagamento nem retenção, cancelável pelo passageiro (comportamento implementado), ou deve ser cancelada automaticamente?

## C. O que foi implementado e onde

- `server/cancelamentos/regra.ts` (cálculo puro) e `server/cancelamentos/service.ts` (cancelamento, excursão, reembolsos e pendências), em transações `BEGIN IMMEDIATE`, idempotentes.
- Migração 4: `reembolso.pagamento_id` e índices únicos (um reembolso de cancelamento por reserva e um por pagamento sinalizado).
- Rotas: `GET` e `POST /api/reservas/:id/cancelamento`; `GET` e `POST /api/admin/excursoes/:id/cancelamento`; `GET /api/admin/reembolsos`; `POST /api/admin/reembolsos/:id/processar`; `POST /api/admin/pendencias/:pagamentoId/reembolso`.
- Telas: cancelamento no detalhe da reserva (`src/pages/CancelarReserva.tsx`); reembolsos e cancelamento de excursão (`src/pages/AdminCancelamentos.tsx`).
- Código de atividades anteriores alterado por necessidade: reservas, pagamentos, administração e telas correspondentes; testes antigos atualizados por mudança esperada.
- Testes novos: `tests/cancelamento-api.test.ts` (40) e `tests/web-cancelamento.test.tsx` (13). Documento novo: `docs/cancelamentos.md`.

## D. Verificações (resultados reais)

- Verificação final (`npm run check`, 26/11/2026, 13:49:25 a 13:50:20): lint sem erros; 610 de 610 testes (32 arquivos); `tsc --noEmit` sem erros; `vite build` concluído. Refeita no fechamento, com o mesmo resultado.
- Mutações: fronteira de 14 dias: 3 testes falharam; parcelada não quitada reembolsada: 2; cancelamento sem liberar a vaga: 6; reserva alheia acessível: 1; sem teto do valor pago: 1; cancelamento da excursão sem reembolsar pendências: 1. Feitas antes da correção do item 3 da seção E.
- Navegador real (13:44 a 13:47; passageiras Ana, Beatriz e Carla; administradora fictícia): 100% (R$ 1.890,00), 50% (R$ 1.600,00 de R$ 3.200,00), parcelada não quitada sem reembolso e menos de uma semana sem reembolso; vagas liberadas e repetição sem novo efeito; reserva alheia 404; rota comum recusando o cancelamento de excursão com reservas; cancelamento da excursão com 2 reservas e 2 reembolsos (R$ 2.835,00) e justificativa obrigatória; pendência reembolsada e retirada da lista; reembolso recusado e depois aprovado; banco com 5 reembolsos, nenhum acima do pago; sem dados sensíveis na auditoria; sem armazenamento local, console ou recurso externo; celular sem rolagem horizontal.
- **Não exercitado no navegador:** o bloqueio de novo pagamento depois do estorno (corrigido depois do percurso; só teste automatizado); as fronteiras exatas de 14 e 7 dias; o ambiente sem provedor; leitor de tela. As datas de partida foram ajustadas no banco e a pendência inserida no banco para a demonstração.

## E. Erros e dificuldades do agente, e correções

1. Dois testes do próprio agente estavam errados (ordem do vencimento e relógio avançado e depois voltado); ajustados sem mudar o código.
2. Testes de atividades anteriores atualizados por mudança esperada (campos novos, migração 4, botão de reembolso nas pendências).
3. Lacuna criada pela própria atividade: depois do estorno de uma pendência, a tela voltava a oferecer "Pagar", sem efeito; detectada na verificação e corrigida (sem novo pagamento nem retenção).
4. Falha de script de shell por aspas; script gravado em arquivo.

## F. Limitações e pontos para revisão humana (RN-044)

Limitações: sem provedor real; destino da reserva após reembolso de pendência não decidido; reserva sem reembolso sem linha em reembolso; excursão cancelada some da consulta pública; sem aviso fora da tela e sem tarefa agendada; justificativa livre; concorrência sem teste de carga; um navegador, sem leitor de tela.
Revisão aprovada pelos pesquisadores no fechamento: regra e serviço de cancelamentos, estorno, liberação de vaga, cancelamento da excursão, migração 4, o campo de percentual previsto, as interpretações das decisões 1 e 3 (100% da primeira parcela no cancelamento pela organização; nada para quem já estava cancelado por inadimplência) e as mudanças em código e testes anteriores. A avaliação humana (Seção 11 do registro) foi redigida pelo agente a pedido dos pesquisadores; a classificação foi decidida por eles.

## G. Dados para quadros, contagens e referências cruzadas

- Experimento principal: 13 das 18 atividades concluídas e classificadas (n = 13), todas AP-3; AGT-014 a AGT-018 ainda não iniciadas. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-013 | AP-3 | 1 | 610 (53 novos) | Sim (decisão sobre cancelamentos, reembolsos e pagamentos) | b27f70e. Data da fonte do quadro: 26/11/2026.
- Duração: 16,30 min de relógio (13:34:02 a 13:50:20 de 26/11/2026).
- Esquema do banco: a AGT-013 criou a migração 4; as anteriores são 1 (esquema inicial), 2 (AGT-009) e 3 (AGT-010).
- Próximas atividades: a partir da AGT-014 (processos automáticos), seguida de comunicação (AGT-015), painel administrativo (AGT-016), testes integrados (AGT-017) e revisão técnica (AGT-018).
- Apêndice D: AGT-013 (principal, AP-3): RF-032 a RF-035 com evidência; RF-026 com evidência (com as AGT-009 e AGT-012); RN-027 a RN-032 com evidência. Pastas server/cancelamentos e src; documento docs/cancelamentos.md; 610 testes; commit b27f70e.
- Linha das métricas: AGT-013,Claude Code (Claude Sonnet 5.5),Pagamentos / Cancelamentos e reembolsos,16.30,1,610,610,0,lacuna de novo pagamento apos estorno de pendencia detectada e corrigida pelo agente; 2 testes do agente errados (ordem do vencimento e relogio avancado e voltado) corrigidos; testes de atividades anteriores atualizados por campos novos e migracao 4; heredoc de shell falhou (duracao inclui documentacao mutacoes e percurso no navegador; espera pelas decisoes nao contada),Nao,Sim,Decisao sobre cancelamentos reembolsos e pagamentos (3 paradas previstas),AP-3,b27f70e

## H. Ficha AGT-013 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-013 — Cancelamentos e reembolsos
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Implementar o cancelamento pelo passageiro com reembolso conforme a antecedência, o cancelamento da excursão pela organização com reembolso integral e o tratamento das pendências financeiras, com provedor simulado e sem movimentar dinheiro.
- **Requisitos relacionados:** RF-032 a RF-035; RF-026 (tratamento das pendências); RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-027 a RN-032, RN-009, RN-014, RN-015, RN-020 a RN-023, RN-026, RN-035, RN-036 e RN-038 a RN-044.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-013.md (escrita pelo agente e aprovada pelo pesquisador em 26/11/2026 às 13:31:48; usada sem alterações).
- **Critérios de aceitação:** 25 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código.
- **Testes:** 610 testes em 32 arquivos, todos aprovados, 0 reprovados (53 novos: 40 de API e 13 de interface). Seis mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 16,30 min em relógio (decisões respondidas e início da implementação às 13:34:02 e verificação final às 13:50:20, de 26/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões e pela classificação não é contada. Exclui a revisão humana.
- **Pausas ou interrupções:** Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação.
- **Intervenção humana:** Sim: decisão sobre cancelamentos, reembolsos e pagamentos (regra de cálculo; processamento e pendências; cancelamento da excursão).
- **Decisão técnica:** Antecedência em períodos exatos até a partida (100%, 50% e 0%), metade arredondada para baixo, parcelada não quitada sem reembolso; reembolso pendente confirmado pelo administrador no provedor simulado, estorno só quando devolvido por inteiro; pendências com reembolso integral; cancelamento da excursão em uma única transação, com justificativa, 100% inclusive para a primeira parcela; migração 4 (reembolso.pagamento_id e índices únicos); sem dependência nova.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
- **Commits:** b27f70e (atividade e registro).
- **Evidências:** Registro (Seções 6 a 10); diário (Entradas 102 a 105); METRICAS.csv; server/cancelamentos/, src/pages/CancelarReserva.tsx, src/pages/AdminCancelamentos.tsx, tests/ e docs/cancelamentos.md.
- **Classificação final:** AP-3 (decisão do pesquisador, 26/11/2026; critério único: decisão exigida pela instrução = AP-3).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado).
- **Limitações:** Sem provedor real; destino da reserva após o reembolso de uma pendência não decidido; reserva sem reembolso sem linha em reembolso; excursão cancelada some da consulta pública; sem aviso fora da tela nem tarefa agendada; justificativa livre; datas de partida e pendência ajustadas no banco para a demonstração; correção do novo pagamento após estorno verificada só em teste automatizado; concorrência sem teste de carga; um navegador, sem leitor de tela. A avaliação humana foi redigida pelo agente a pedido do pesquisador.

## I. Registro completo da atividade (cópia literal)

## 1. Identificação

ID da atividade: AGT-013

Título: Cancelamentos e reembolsos

Categoria: Pagamentos / Cancelamentos e reembolsos (servidor e interface)

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 26/11/2026

Requisitos relacionados:
- RF-032 — Cancelamento solicitado pelo passageiro
- RF-033 — Cálculo do reembolso conforme a antecedência
- RF-034 — Cancelamento da excursão pela organização
- RF-035 — Reembolso integral dos valores pagos em cancelamento pela organização
- RF-026 — Tratamento administrativo do registro de confirmação financeira sem vaga (parte desta atividade)
- RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027, RNF-028 e RNF-029

Regras de negócio relacionadas: RN-027 a RN-032, RN-009, RN-014, RN-015, RN-020, RN-021, RN-022, RN-023, RN-026, RN-035, RN-036, RN-038, RN-039, RN-040, RN-041 a RN-044.
Marcada "[confirmar]" na especificação: RN-036.

## 2. Objetivo

Implementar o cancelamento solicitado pelo passageiro (RF-032), o cálculo do reembolso conforme a antecedência (RF-033), o cancelamento da excursão pela
organização (RF-034) e o reembolso integral dos valores pagos nesse caso (RF-035), tratando as pendências financeiras deixadas pelas atividades
anteriores, conforme as decisões do pesquisador, sem movimentar dinheiro real.

## 3. Resultado esperado

Ao final, o passageiro deve poder cancelar a própria reserva vendo antes quanto será devolvido; a organização deve poder cancelar uma excursão com
reembolso integral aos afetados; cada reembolso existe uma única vez e nunca passa do valor pago; a vaga é liberada exatamente uma vez; as operações são
atômicas, idempotentes e auditadas; o passageiro nunca vê nem cancela reserva alheia. Testes automatizados devem cobrir o servidor e a interface.

Não deverão ser implementados: a rotina agendada completa, comunicação, painel administrativo consolidado, provedor de pagamento real nem mudança nas
regras de negócio.

## 4. Critérios de aceitação

- [x] Decisões do pesquisador (regra de cálculo; processamento do reembolso e das pendências; cancelamento da excursão) tomadas e registradas com justificativa.
- [x] Autorização verificada no servidor antes de ler o corpo: o passageiro cancela só a própria reserva (alheia e inexistente: o mesmo 404); o administrador cancela a excursão; visitante 401 e perfil errado 403 (RN-044, RNF-004).
- [x] Valor, percentual e motivo do reembolso calculados no servidor, em centavos inteiros, com arredondamento documentado; o corpo não escolhe valores (RN-038).
- [x] A antecedência segue a decisão 1, com testes nas fronteiras exatas de 14 e de 7 dias no horário de Brasília (RF-033, RN-027 a RN-029, RN-039).
- [x] O reembolso incide só sobre o valor efetivamente pago e elegível; a primeira parcela de reserva parcelada não quitada não é reembolsada (RN-030, RN-032).
- [x] O passageiro vê a prévia do reembolso e do que não é reembolsável antes de confirmar.
- [x] O cancelamento, em transação BEGIN IMMEDIATE, muda a situação da reserva, cancela a retenção, libera a vaga ocupada exatamente uma vez, trata os pagamentos conforme as decisões e registra o reembolso (RN-021, RN-040).
- [x] Um defeito no meio desfaz tudo (atomicidade), coberto por teste com falha injetada.
- [x] O cancelamento é idempotente e seguro sob concorrência: repetido ou simultâneo não cria segundo reembolso nem libera vaga duas vezes, coberto por teste com duas conexões.
- [x] Nenhum reembolso ultrapassa o valor efetivamente pago da reserva.
- [x] O processamento do reembolso segue a decisão 2, com o provedor simulado, sem dados de cartão nem bancários.
- [x] As pendências financeiras (confirmação sem vaga e segunda parcela após o vencimento) recebem o tratamento da decisão 2.
- [x] O cancelamento da excursão segue a decisão 3: afeta as reservas indicadas, reembolsa integralmente os valores pagos, libera as vagas e deixa a excursão Cancelada sem estado incoerente (RF-034, RF-035, RN-031).
- [x] Auditoria de cada cancelamento, reembolso, estorno e cancelamento de excursão, com o ator e sem dados sensíveis (RN-041, RN-042).
- [x] Respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010).
- [x] Interface do passageiro (cancelar com prévia e confirmação, situação do reembolso) e da administração (cancelamento de excursão com prévia e confirmação, reembolsos e pendências).
- [x] Interface responsiva, acessível, sem recursos externos e sem prometer prazo de devolução.
- [x] Testes automatizados do servidor e da interface cobrindo autorização, cálculo e fronteiras, arredondamento, elegibilidade, parcelada, pendências, atomicidade, idempotência, concorrência, excursão e auditoria.
- [x] Lint, verificação de tipos, testes e build aprovados.
- [x] Percurso em execução real (API e navegador) com dados fictícios, relatado com o que foi e o que não foi exercitado.
- [x] Confirmado no banco que cada reembolso existe uma única vez e não passa do pago, que a vaga foi liberada uma vez, que pagamentos e reservas ficaram coerentes e que auditoria e logs não têm dados sensíveis.
- [x] Documentação atualizada, sem credenciais reais; apenas dados fictícios.
- [x] Nenhuma funcionalidade fora do escopo implementada; o esquema só muda por migração nova, pequena e justificada, se necessário.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

## 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-013 — Cancelamentos e reembolsos.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. A AGT-001 criou a fundação técnica, a AGT-002 o modelo de dados e a persistência (SQLite por meio de node:sqlite, SQL direto, migrações versionadas, transações e auditoria; o esquema já tem a tabela reembolso e a situação estornado em pagamento), a AGT-003 o cadastro, a autenticação e o controle de acesso, a AGT-004 a estrutura pública, a AGT-005 o gerenciamento administrativo de excursões (cancelar ou despublicar excursão com reserva ativa fica bloqueado), a AGT-006 a consulta pública, a AGT-007 a solicitação de reserva e o checkout (desistência só sem pagamento), a AGT-008 a retenção temporária e o mecanismo de ocupar e liberar vaga, a AGT-009 o pagamento integral com provedor simulado e o registro da confirmação sem vaga, a AGT-010 o pagamento em duas parcelas e o vencimento da segunda (reserva cancelada por inadimplência, primeira parcela não reembolsável, migração 3), a AGT-011 a área do passageiro e a conclusão automática, e a AGT-012 a administração de reservas e passageiros (pendências administrativas só para consulta; cancelamento manual só sem pagamento). Leia o CLAUDE.md, a especificação em docs/especificacao/ e os documentos docs/banco-de-dados.md, docs/reservas.md, docs/excursoes-admin.md e docs/administracao-reservas.md antes de começar.

OBJETIVO DA ATIVIDADE

Implementar o cancelamento solicitado pelo passageiro (RF-032), o cálculo do reembolso conforme a antecedência (RF-033), o cancelamento da excursão pela organização (RF-034) e o reembolso integral dos valores pagos nesse caso (RF-035), tratando também as pendências financeiras deixadas pelas atividades anteriores (pagamento confirmado sem vaga e segunda parcela confirmada depois do vencimento), conforme as decisões do pesquisador.

Reaproveite o provedor simulado, os serviços de reserva, pagamento e vagas, a auditoria e as telas das AGT-007 a AGT-012 sem duplicar lógica. Nesta atividade, não implemente a rotina agendada completa de processos automáticos (AGT-014), comunicação por e-mail ou WhatsApp (AGT-015), painel administrativo consolidado e relatórios (AGT-016) nem qualquer mudança nas regras de negócio. Não há provedor de pagamento real: nenhum dinheiro é movimentado.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- RN-027: cancelamento pelo passageiro com antecedência de pelo menos duas semanas: reembolso de 100% do valor elegível. RN-028: com menos de duas semanas e pelo menos uma semana: reembolso de 50% do valor elegível. RN-029: com menos de uma semana: sem reembolso.
- RN-030: o reembolso incide sobre o valor efetivamente pago e elegível. RN-031: cancelamento pela organização: reembolso integral dos valores pagos aos passageiros afetados. RN-032: a primeira parcela de reserva parcelada não quitada permanece não reembolsável (inadimplência).
- RN-020, RN-022, RN-023, RN-026 e RN-035 continuam valendo; situações finais: Concluída e Cancelada. RN-009, RN-014, RN-015, RN-021 e RN-040: reserva ativa única, retenção, ocupação de vaga sem exceder a capacidade e proteção sob concorrência.
- RN-036: com reserva ou retenção ativa, as condições da excursão não são editadas. [confirmar] na especificação.
- RN-038 e RN-039: valores em centavos inteiros; instantes em UTC, interpretados em America/Sao_Paulo. RN-041 e RN-042: auditoria sem dados sensíveis. RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana.

REQUISITOS DESTA ATIVIDADE

- rotas da API com autorização verificada no servidor a cada requisição e antes de ler o corpo (reutilize authorize): o passageiro consulta o valor do reembolso e cancela apenas a própria reserva (alheia ou inexistente: o mesmo 404); o administrador cancela a excursão e acompanha os reembolsos; visitante 401 e perfil errado 403;
- o valor, o percentual e o motivo do reembolso são sempre calculados no servidor, em centavos inteiros, com arredondamento documentado, e nunca vêm do cliente; antes de confirmar o cancelamento, o passageiro vê quanto será devolvido e o que não é reembolsável;
- o cálculo da antecedência segue a decisão 1, com testes nas fronteiras exatas de 14 e de 7 dias, no horário de Brasília;
- o cancelamento, em uma única transação BEGIN IMMEDIATE, muda a situação da reserva, cancela a retenção ativa, libera a vaga ocupada exatamente uma vez, trata os pagamentos pendentes e confirmados conforme as decisões e registra o reembolso na tabela reembolso; um defeito no meio desfaz tudo; repetir o pedido não repete o efeito nem cria segundo reembolso; nenhum reembolso ultrapassa o valor efetivamente pago;
- o processamento do reembolso segue a decisão 2, com o provedor simulado, sem dados de cartão nem dados bancários;
- o cancelamento da excursão pela organização segue a decisão 3: afeta as reservas indicadas, devolve integralmente os valores pagos (RN-031), libera as vagas e deixa a excursão Cancelada, sem deixar estado intermediário incoerente, mesmo com muitas reservas;
- na interface: na área do passageiro, a ação de cancelar com a prévia do reembolso e a confirmação, e a situação do reembolso; na administração, o cancelamento da excursão com a prévia dos afetados e confirmação, e a lista de reembolsos e pendências; mensagens claras, sem prometer prazo de dinheiro que não existe; layout responsivo, acessibilidade básica e nenhum recurso externo;
- auditoria de cada cancelamento, reembolso, estorno e cancelamento de excursão, com o ator e sem dados sensíveis; respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010);
- testes automatizados do servidor (autorização, cálculo e fronteiras, arredondamento, elegibilidade, inadimplência, parcelada, pendências, atomicidade com falha injetada, idempotência, concorrência entre duas conexões, cancelamento de excursão, auditoria) e da interface;
- atualização do README e da documentação (docs/reservas.md, docs/banco-de-dados.md e documento de cancelamentos). Se for necessária migração, que seja nova, pequena e justificada, sem alterar as migrações já aplicadas.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem dinheiro, cancelamentos e vagas. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria; a especificação define os percentuais, mas não define como contar a antecedência, o que é "valor elegível" em cada caso, quando o reembolso é processado nem o que acontece com as reservas quando a excursão é cancelada.

1. Regra de cálculo do reembolso pelo passageiro (RF-032, RF-033, RN-027 a RN-030, RN-032). Apresente: em relação a que instante se conta a antecedência (a partida da excursão ou o início do dia da data inicial) e como se contam "pelo menos duas semanas" e "pelo menos uma semana" (períodos exatos de 14 e 7 dias ou dias corridos de calendário em Brasília); quais situações permitem o cancelamento (Aguardando pagamento sem e com pagamento, Pronto para embarque, depois da partida); o que é o valor elegível, inclusive na reserva parcelada com apenas a primeira parcela paga (RN-032) e na quitada; o arredondamento dos 50% em centavos; e o que acontece com um pagamento ainda pendente.
2. Processamento do reembolso e das pendências financeiras (RN-030, RN-022). Apresente: registrar o reembolso como pendente para o administrador confirmar pelo provedor simulado; processar automaticamente no momento do cancelamento com o provedor simulado; ou apenas registrar para processamento externo. Inclua o estado do pagamento (por exemplo, estornado), o que fazer com recusa do provedor e nova tentativa, e como tratar as pendências da AGT-012 (pagamento confirmado sem vaga e segunda parcela confirmada depois do vencimento): reembolso integral, mesma fila de reembolsos ou continuar só consulta.
3. Cancelamento da excursão pela organização (RF-034, RF-035, RN-031). Apresente: quais reservas são afetadas (todas as não finais, ou também as já canceladas por inadimplência com a primeira parcela paga); se a reserva Concluída é afetada; como ficam as retenções, as vagas, os pagamentos pendentes e a excursão; se o cancelamento é feito em uma única transação para todas as reservas ou reserva por reserva com retomada; se a operação exige justificativa e confirmação; e a relação com o bloqueio atual de cancelar excursão com reserva ativa (AGT-005, RN-036).

RESTRIÇÕES

1. Não implemente funcionalidades fora do escopo.
2. Não altere os requisitos ou regras de negócio definidos pelo projeto; dúvidas ou conflitos na especificação são para o pesquisador (CLAUDE.md, regra 2).
3. Não inclua credenciais, tokens, senhas, números de cartão, dados bancários ou outros dados sensíveis no repositório, nos logs ou na auditoria. Use somente dados fictícios.
4. Não reutilize código funcional de projetos anteriores nem consulte o repositório do estudo piloto.
5. Não altere ou remova os arquivos existentes dentro das pastas TCC e docs/especificacao, exceto para preencher os campos de execução deste registro.
6. Não modifique os registros experimentais existentes.
7. Caso exista uma decisão relevante que não possa ser tomada tecnicamente sem alterar significativamente arquitetura, dependências, segurança, custos, integrações externas, regras de negócio ou escopo do produto, interrompa e apresente a decisão ao pesquisador.
8. Você pode tomar decisões técnicas de baixo impacto necessárias, desde que as documente no relatório final, com o motivo e a versão exata de cada dependência adicionada.
9. Não realize commit Git. O commit será realizado somente após revisão humana.
10. Alterações críticas em pagamentos, vagas, cancelamentos, reembolsos e dados pessoais exigem revisão humana (RN-044): descreva no relatório cada ponto em que o código calcula ou grava um reembolso, muda a situação de um pagamento, de uma reserva, de uma vaga ou de uma excursão, cada mudança em código de outra atividade e cada migração, se houver.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- coloque API e front-end em execução juntos, com dados fictícios (administrador pelo comando local, excursões pelo script de demonstração, passageiros pelo cadastro) e percorra no navegador: o cancelamento com 100%, 50% e sem reembolso (com datas de teste adequadas), a reserva parcelada não quitada e a quitada, a repetição do pedido, o cancelamento da excursão pela organização com os afetados, o processamento dos reembolsos, o isolamento entre passageiros, os perfis barrados e a largura de celular;
- confirme, no banco, que cada reembolso existe uma única vez, nunca passa do valor pago, que vagas_ocupadas foi liberada exatamente uma vez e nunca ficou negativa, que pagamentos e reservas ficaram coerentes e que auditoria e logs não têm dados sensíveis;
- corrija problemas encontrados quando estiverem dentro do escopo desta atividade.

RELATÓRIO OBRIGATÓRIO

Ao finalizar, apresente um relatório contendo:

1. resumo do que foi implementado;
2. decisões técnicas tomadas e respectivas justificativas;
3. tecnologias e versões efetivamente utilizadas;
4. arquivos e diretórios relevantes criados ou modificados;
5. dependências adicionadas;
6. comandos relevantes executados;
7. testes e verificações executados;
8. resultados dos testes, análise estática, verificação de tipos e build;
9. erros ou dificuldades encontrados;
10. correções realizadas durante a execução;
11. limitações ou pendências identificadas, inclusive de pagamento, de reembolso, de vagas, de concorrência, de privacidade e de acessibilidade;
12. qualquer ponto que considere necessário para revisão humana.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-013.

## 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-26T13:31:48-03:00. Início da execução: 2026-11-26T13:31:48-03:00.

Parada obrigatória: o agente apresentou, antes de criar arquivos, as opções das três decisões da Seção 5 (com vantagens, desvantagens e recomendação). O pesquisador respondeu em 2026-11-26T13:34:02-03:00, pela opção recomendada de cada item ("recomendadas"):
(1) cálculo do reembolso pelo passageiro: antecedência em períodos exatos até o instante da partida (14 dias x 24 h ou mais: 100%; de 7 dias até menos de 14: 50%; menos de 7 dias: sem reembolso); cancela quem está em Aguardando pagamento ou Pronto para embarque, só antes da partida (Concluída e Cancelada não); valor elegível é o pago e confirmado (integral, ou as duas parcelas quitadas); parcelada só com a primeira parcela paga é cancelada, libera a vaga e não é reembolsada (RN-032); sem pagamento confirmado, cancela sem reembolso; pagamento pendente vira recusado (falhou); os 50% são metade arredondada para baixo;
(2) processamento: o reembolso nasce pendente e o administrador o confirma no provedor simulado; o pagamento vira estornado só quando o valor inteiro dele é devolvido (com 50% continua pago); reembolso recusado pode ser tentado de novo, sem criar outro; nas pendências (pagamento sem vaga e segunda parcela tardia) o administrador cria um reembolso de 100% do pagamento na mesma fila;
(3) cancelamento da excursão pela organização: uma única transação, com justificativa, prévia e confirmação, só antes da partida; afeta as reservas em Aguardando pagamento e Pronto para embarque, inclusive a parcelada só com a primeira paga, que recebe 100% (RN-031), e as pendências da excursão também recebem 100%; concluídas e já canceladas antes (inclusive por inadimplência) não são afetadas; retenções canceladas, vagas liberadas, pagamentos pendentes recusados, reembolsos pendentes na fila e excursão Cancelada; o bloqueio da AGT-005 continua na rota comum.
Início da implementação: 2026-11-26T13:34:02-03:00.
Fim da implementação e da última verificação (npm run check): 2026-11-26T13:50:20-03:00 (relógio do sistema). Não houve pausa nem interrupção da sessão durante a implementação.

## 7. Alterações realizadas pelo agente

Arquivos novos:
- server/cancelamentos/regra.ts: cálculo do percentual (períodos exatos até a partida) e do valor do reembolso (funções puras).
- server/cancelamentos/service.ts: prévia e cancelamento pelo passageiro, prévia e cancelamento da excursão, lista e processamento de reembolsos e reembolso de pendência.
- src/pages/CancelarReserva.tsx e src/pages/AdminCancelamentos.tsx: telas do passageiro e da administração.
- tests/cancelamento-api.test.ts (40 testes) e tests/web-cancelamento.test.tsx (13 testes).
- docs/cancelamentos.md e TCC/registros-agente/AGT-013.md.

Banco: migração 4 em server/db/migrations.ts (reembolso.pagamento_id e dois índices únicos); migrações 1 a 3 intactas.

Arquivos alterados (código de atividades anteriores, por necessidade desta):
- server/reservas/service.ts e routes.ts (AGT-007 a AGT-011): rotas de cancelamento, campos pode_cancelar e reembolsos na resposta da reserva, e recusa de checkout com pagamento devolvido.
- server/pagamentos/parcelas.ts e service.ts (AGT-009/010): reserva com pagamento estornado não recebe novo pagamento (409 pagamento_estornado).
- server/admin/routes.ts e service.ts (AGT-012): rotas de excursão, reembolsos e reembolso de pendência; a lista de pendências informa o reembolso.
- server/app.ts e server/main.ts (ligação).
- src/App.tsx, src/admin/reservas-admin-api.ts, src/pages/AdminReservas.tsx (exporta auxiliares, botão Reembolsar e link Reembolsos), src/pages/AdminExcursoes.tsx (link para o cancelamento com reembolso), src/pages/MinhasReservas.tsx, src/pages/Reservas.tsx e src/reservas/reservas-api.ts.
- Testes de atividades anteriores atualizados: reservas-api (campos novos), admin-api (campo reembolso nas pendências), pagamento-confirmacao e parcelado-confirmacao (lista de migrações), web-admin-reservas (a pendência agora tem o botão Reembolsar; antes o teste exigia nenhum botão), web-reservas e web-area-passageiro (fixtures com os campos novos).
- README.md, docs/banco-de-dados.md, docs/reservas.md e TCC/registros-agente/DIARIO-PASSO-A-PASSO.md.

Sem dependência nova. Não alterados: docs/especificacao/ (inclusive as regras de negócio), CLAUDE.md, .env.

## 8. Comandos e testes

Verificação final (npm run check), de 2026-11-26T13:49:25-03:00 a 2026-11-26T13:50:20-03:00: lint sem erros (max-warnings 0); testes 610 aprovados de 610 (32 arquivos); tsc --noEmit sem erros; vite build concluído.

Testes novos: tests/cancelamento-api.test.ts (40): fronteiras de 14 e 7 dias no segundo exato; cálculo (integral, quitada, parcelada só com a primeira, arredondamento); 401 e 403; reserva alheia e inexistente com o mesmo 404; corpo sem valores; prévia sem gravar; 100%, 50% e sem reembolso; faixa que muda entre prévia e confirmação; depois da partida; concluída; parcelada não quitada e quitada; sem pagamento; pagamento pendente; inadimplência; repetição e pedidos simultâneos; atomicidade com falha injetada; nova reserva depois; cancelamento da excursão (bloqueio da rota comum, prévia, tudo ou nada, não afeta concluídas e canceladas, pendências, justificativa, depois da partida, idempotência, atomicidade); reembolsos (lista, aprovado a 100% e a 50%, recusa e nova tentativa, teto do valor pago, pendências, estorno seguido de bloqueio de novo pagamento, auditoria sem dados sensíveis); produção sem provedor (503); migração 4 e duas conexões. tests/web-cancelamento.test.tsx (13): prévia antes de confirmar, valor que mudou, voltar, erros, situações sem botão, reembolso exibido, fila de reembolsos e processamento, sem provedor, acesso restrito, pendência com reembolso e cancelamento da excursão com justificativa. Os testes de API e de interface relacionados foram repetidos 6 vezes sem falha intermitente (antes da correção do item 3 da Seção 9; a verificação final inclui a correção).

Verificações de mutação (código alterado de propósito, testes devem falhar, arquivo restaurado e conferido por diff), feitas antes da correção do item 3 da Seção 9:
- M1, fronteira de 14 dias (>= vira >): 3 testes falharam.
- M2, parcelada não quitada reembolsada: 2 falharam.
- M3, cancelamento sem liberar a vaga: 6 falharam.
- M4, reserva alheia acessível: 1 falhou.
- M5, sem o teto do valor pago: 1 falhou.
- M6, cancelamento da excursão sem reembolsar pendências: 1 falhou.
Todas detectadas; nenhuma mutação permaneceu no código.

Execução em navegador real (Edge sem interface, via protocolo de depuração; API e Vite locais; banco de demonstração; passageiras fictícias Ana, Beatriz e Carla; administradora fictícia), concluída sem erro de script, das 13:44:26 às 13:47:21:
- Ana: Serra paga; prévia de 100% (R$ 1.890,00); cancelou; reembolso pendente; vagas voltaram de 12 para 11; repetir o pedido respondeu 200 sem novo efeito.
- Beatriz: Praia com a partida ajustada no banco para 10 dias; prévia de 50% (R$ 1.600,00 de R$ 3.200,00); cancelou; a prévia da reserva da Ana respondeu 404.
- Carla: parcelada só com a primeira paga; prévia sem reembolso com a explicação; cancelou; vaga liberada (19 para 18), sem reembolso.
- Ana: Praia com a partida ajustada para 3 dias; prévia sem reembolso; cancelou.
- Administradora: a rota comum recusou cancelar a excursão com reservas (409); o link na excursão levou ao cancelamento; prévia com as duas reservas afetadas (Beatriz pronta R$ 1.890,00 e Carla com a primeira R$ 945,00); sem justificativa foi recusado; com justificativa, 2 reservas canceladas e 2 reembolsos (R$ 2.835,00); excursão cancelada e vagas 13 para 11; repetir não fez nada.
- Pendência (pagamento sinalizado inserido no banco para a demonstração): "Reembolsar" criou o reembolso; reembolso da Beatriz recusado, depois aprovado, repetir aprovado e depois tentar recusar (conflito); aprovação pela tela; pendências vazias depois do estorno.
- Banco final: 5 reembolsos (um por cancelamento ou pagamento), nenhum acima do pago; pagamentos estornados só nos devolvidos por inteiro (o de 50% continuou confirmado); vagas dentro da capacidade; auditoria e reembolso sem dados sensíveis; sem armazenamento local, cookie legível ou mensagem de console; único host 127.0.0.1:5173; celular sem rolagem horizontal da página.
Capturas (fora do repositório, na pasta temporária da sessão): canc-previa-100, canc-previa-50, canc-previa-parcelada, canc-previa-0, canc-excursao-confirmacao, canc-excursao-resultado, canc-reembolsos, canc-passageiro-reembolso, canc-celular-detalhe e canc-celular-reembolsos.

Não exercitado no navegador: o bloqueio de novo pagamento depois do estorno (item 3 da Seção 9, corrigido depois da execução no navegador e coberto por teste automatizado); a fronteira exata de 14 e 7 dias (coberta nos testes); o reembolso recusado pela tela (feito por chamada direta); o ambiente sem provedor; leitor de tela. As datas de partida foram ajustadas no banco e a pendência foi inserida no banco para a demonstração.

## 9. Erros e dificuldades

1. Dois testes do próprio agente estavam errados: um sinalizava a segunda parcela tardia antes de o vencimento ser efetivado (a reserva deixava de ser "vencida"), e outro avançava o relógio até a partida e voltava, o que fazia o vencimento cancelar uma reserva; ajustados os testes, sem mudar o código.
2. Testes de atividades anteriores atualizados por mudança esperada (campos novos, migração 4 e o botão Reembolsar nas pendências).
3. Lacuna criada por esta atividade e detectada pelo agente durante a verificação: depois do estorno de uma pendência, a reserva continuava aguardando pagamento e a tela oferecia "Pagar", sem efeito. Corrigido: não há novo pagamento nem retenção (409 pagamento_estornado) e a tela não oferece pagar; o destino da reserva ficou sem decisão (Seção 10, item 8).
4. Um here-document no shell falhou de novo por causa de aspas; o script foi gravado em arquivo.
5. Um script de edição da atividade falhou antes de rodar pelo mesmo motivo e foi refeito.
6. Versão da ferramenta: a extensão 2.1.332 (instalada em 26/11/2026 às 12:19) é a mais recente na pasta de extensões e a 2.1.331 está obsoleta; não foi possível confirmar qual executou esta atividade (Seção 1).

## 10. Relatório do agente

1. Resumo: cancelamento pelo passageiro com prévia e reembolso por antecedência, cancelamento da excursão pela organização com reembolso integral, fila de reembolsos processada no provedor simulado e reembolso das pendências financeiras.
2. Decisões do pesquisador (26/11/2026 às 13:34:02): as três recomendadas, conforme a Seção 6.
3. Dinheiro e vagas: valores sempre calculados no servidor, em centavos; nenhum reembolso acima do pago; um por cancelamento e por pagamento sinalizado (índices no banco); vaga liberada uma única vez; transações BEGIN IMMEDIATE, atômicas e idempotentes.
4. Segurança: autorização antes de ler o corpo; reserva alheia responde 404; auditoria sem dados pessoais nem de pagamento além de valores e situações; sem dados de cartão ou bancários.
5. Testes e verificações: Seção 8 (610 de 610; lint, tipos e build sem erro; 6 mutações detectadas; execução em navegador com as ressalvas).
6. Critérios de aceitação: a marcação e a avaliação ficam para o fechamento, após a classificação pelos pesquisadores.
7. Limitações: sem provedor real; reserva sem reembolso não tem linha em reembolso; excursão cancelada não aparece na consulta pública; sem aviso ao passageiro além da tela; justificativa livre sem filtro; sem tarefa agendada; concorrência sem teste de carga; um navegador, sem leitor de tela; datas e pendência ajustadas no banco para a demonstração.
8. Pergunta aos pesquisadores: depois de reembolsar uma pendência de uma reserva ainda aguardando pagamento, a reserva deve continuar assim (como está, podendo ser cancelada pelo passageiro) ou ser cancelada automaticamente? A especificação não define.
9. Pontos para revisão humana (RN-044): server/cancelamentos/regra.ts (percentuais, parcelada não quitada, arredondamento) e service.ts (quando cria e processa reembolso, estorno de pagamento, liberação de vaga, cancelamento da excursão); a interpretação de dar 100% da primeira parcela quando a organização cancela (RN-031 sobre a RN-032) e de não reembolsar quem já estava cancelado por inadimplência; a migração 4; o campo percentual_previsto no corpo, usado só para recusar mudança de faixa; as mudanças em código de outras atividades (Seção 7).
10. Dados e segurança: dados fictícios; nenhum .env, senha ou token lido; nenhuma dependência nova.
11. Não classificado: a classificação (AP-1, AP-2, AP-3 ou RP) é exclusiva dos pesquisadores. Pendência de registro: versão da ferramenta (Seção 1).
12. Controle de versão: nenhum commit feito até aqui; aguarda a classificação.

## 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador (2026-11-26T13:53:18-03:00), com base nos registros e nas execuções.** O pesquisador respondeu "ap 3", lido pelo agente como a classificação AP-3; vale a autorização permanente que ele deu em 19/11/2026 para o fechamento padrão de cada atividade (critérios, revisão do código, commit e transcrição no Google Docs). A pergunta sobre o destino da reserva depois do reembolso de uma pendência (Seção 10, item 8) **não foi respondida** e continua aberta. As marcações abaixo refletem as evidências.

Atendeu ao objetivo: Proposta: sim. O passageiro vê a prévia do reembolso e cancela a própria reserva; a organização cancela a excursão com reembolso integral aos afetados; os reembolsos são confirmados no provedor simulado e as pendências financeiras podem ser reembolsadas; nenhum dinheiro é movimentado.

Atendeu aos critérios de aceitação: Proposta: sim para os 25 critérios da Seção 4, todos marcados. Evidências: 610 testes aprovados em 32 arquivos (40 de API e 13 de interface novos); lint, tipos e build sem erros; seis mutações de verificação (todas detectadas e restauradas); percurso em navegador real (Microsoft Edge sem cabeça) com três passageiras e uma administradora. Ressalvas: (1) as datas de partida foram ajustadas e a pendência inserida diretamente no banco para a demonstração; (2) a correção do novo pagamento após o estorno (Seção 9, item 3) é posterior ao percurso no navegador e às mutações e foi verificada só em teste automatizado; (3) as fronteiras exatas de 14 e 7 dias foram verificadas só em testes; (4) sem leitor de tela.

Atendeu às regras de negócio: Proposta: sim para RN-027 a RN-032, com a interpretação, decidida pelo pesquisador, de que no cancelamento pela organização a primeira parcela de reserva parcelada ativa é devolvida integralmente (RN-031) e as reservas já canceladas por inadimplência não são reembolsadas; RN-009, RN-014, RN-015, RN-021, RN-023, RN-026, RN-036, RN-038 a RN-040 preservadas. Nenhuma regra foi alterada.

Comportamento esperado confirmado: Proposta: sim, no percurso em navegador real e nos testes, com as ressalvas acima.

Testes considerados suficientes: Proposta: suficientes para autorização, cálculo e fronteiras, atomicidade com falha injetada, idempotência, concorrência com duas conexões, cancelamento de excursão e reembolsos; sem teste de carga.

Problemas não identificados pelo agente: Proposta: nenhum identificado; os erros do próprio agente estão na Seção 9.

Revisão do código: aprovada pelo pesquisador em 2026-11-26T13:53:18-03:00, incluindo server/cancelamentos/regra.ts e service.ts (percentuais, criação e processamento de reembolso, estorno, liberação de vaga e cancelamento da excursão), a migração 4, o campo percentual_previsto, as interpretações das decisões 1 e 3 e as mudanças em código e testes de atividades anteriores (Seção 7). As limitações da Seção 10 (item 7) continuam registradas.

## 12. Intervenção humana

Houve intervenção humana: Sim.

Tipo: decisão sobre cancelamentos, reembolsos e pagamentos. A instrução (Seção 5) previa três paradas para decisão do pesquisador (regra de cálculo; processamento do reembolso e das pendências; cancelamento da excursão); o pesquisador aceitou as opções recomendadas pelo agente ("recomendadas") em 2026-11-26T13:34:02-03:00. Não houve correção de código do agente por intervenção humana.

## 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-26T13:53:18-03:00: "ap 3". Tentativa a que se aplica: 1. Segue o critério único adotado pelo pesquisador para as AGT-001 a AGT-013: quando a instrução manda parar e a atividade só prossegue com decisão do pesquisador, a classificação é AP-3. O pesquisador não escreveu justificativa.)

## 14. Controle de versão

Commit relacionado: b27f70e

---

## 16. Observações finais

A duração registrada (16,30 min, de 13:34:02 a 13:50:20 em 26/11/2026) é tempo de relógio da implementação depois das decisões e inclui a documentação, as verificações por mutação e o percurso em navegador real; a espera pelas decisões e pela classificação não é contada. Sem interrupção da sessão durante a implementação. Migração nova (versão 4), pequena e justificada; sem dependência nova. Pergunta aberta (Seção 10, item 8): o destino da reserva ainda aguardando pagamento depois do reembolso de uma pendência não foi decidido; o código mantém a reserva aguardando, sem novo pagamento nem retenção, cancelável pelo passageiro, até decisão. A versão da ferramenta (extensão 2.1.332, a mais recente instalada) não pôde ser confirmada como a que executou a atividade.
