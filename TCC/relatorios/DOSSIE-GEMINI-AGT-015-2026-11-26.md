# Dossiê bruto da AGT-015 para o Gemini (26/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-015.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-015.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/comunicacao.md`, `git log` (commits 8e486ff e dfafd89) e o relatório em página privada (https://claude.ai/artifact/3wXcx2LB8jSkuzixm4J3Zi).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Classes (revisão metodológica confirmada pelos pesquisadores em 26/11/2026).** São cinco: AP-1 (verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta), AP-2 (atendidas após correções do próprio agente, sem intervenção direta), AP-3 (atendidas com intervenção planejada de governança e coplanejamento prevista na instrução), AP-4 (atendidas mediante intervenção corretiva do desenvolvedor para reparar falhas de execução, erros de código, alucinações ou desvios de escopo não corrigidos pelo agente) e RP (não atendidas pela abordagem utilizada). No experimento principal, AP-3: 15; AP-4: 0. Não criar outras classes.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. Não inferir causalidade, produtividade, qualidade geral nem taxa generalizável; não há grupo de controle.
3. **Não inventar decisões, telas, funções ou limitações.** As decisões são exatamente as da seção B. **Não há envio real de e-mail nem de WhatsApp**: o e-mail é simulado em arquivo local e o WhatsApp não foi implementado.
4. **Não apagar texto existente** (salvo as substituições da seção J) e **não duplicar parágrafos**. Ao inserir a ficha, não alterar as fichas anteriores.
5. **Não mudar data de corte, escopo ou cronograma.**
6. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 15** de 18; piloto **n = 5**; nunca somados.
7. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
8. **A ficha da AGT-015 é obrigatória.** Ao final, informar uma linha por trecho alterado e confirmar que a ficha foi inserida.

## Ordem em relação aos envios anteriores

1. Se ainda não enviados: a **Parte A** de `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md`, o dossiê da AGT-013 e o dossiê da AGT-014, nesta ordem.
2. Este dossiê. A seção J **substitui a seção J do dossiê da AGT-014 e as Partes B e C** do pedido de correção (não enviar as Partes B e C; se algo disso já foi aplicado, a seção J atualiza o resultado).

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. Não usar "revisão independente" nem "validação independente". A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-015 (Comunicação) é a 15.ª das 18 atividades do experimento principal com o Claude Code (Claude Sonnet 5.5). Foi executada em 26/11/2026, em uma tentativa, sem nova instrução, e classificada como AP-3 pelos pesquisadores no mesmo dia (resposta "ap 3", 16:54:33). A instrução foi escrita pelo agente a partir da especificação e aprovada pelo pesquisador às 16:36:06; as três decisões foram respondidas às 16:37:52 ("recomendadas"). A implementação terminou, com a verificação final aprovada, às 16:52:16 (14,40 min de relógio, incluindo documentação, mutações e percurso em execução real; as esperas pela aprovação, pelas decisões e pela classificação não são contadas).

Contexto: até a AGT-014, o passageiro só conhecia uma mudança ao abrir as telas, inclusive nos cancelamentos feitos pela organização e pela rotina automática.

Entrega: avisos ao passageiro na plataforma (tela "Avisos") sobre pagamentos, cancelamentos e reembolsos, gerados pela rotina automática a partir da auditoria, com e-mail simulado em arquivo local. Nenhum envio real e nenhuma conexão com serviço externo.

Números: 685 testes automatizados aprovados em 36 arquivos (647 ao final da AGT-014; 38 novos: 32 de servidor e 6 de interface); lint, verificação de tipos e build aprovados; 11 mutações de verificação detectadas e restauradas; percurso em aplicação e navegador reais (Microsoft Edge sem interface) com dados fictícios; uma migração nova (versão 5) e nenhuma dependência nova.

## B. As três decisões dos pesquisadores (26/11/2026, 16:37:52) e suas razões

As razões são as das recomendações do agente, aceitas pelo pesquisador sem texto próprio.

1. **Canal e simulação.** Escolhida: aviso na plataforma e e-mail simulado; a mensagem fica no banco; fora de produção o envio grava um arquivo local não versionado; em produção o aviso aparece, o e-mail fica pendente e nada é enviado; interface de provedor para uso futuro. Razão: permite testar falha e nova tentativa sem envio real e sem usar o telefone sem posse comprovada. Descartadas: somente o aviso na plataforma; aviso, e-mail e WhatsApp.
2. **Eventos, conteúdo e dados pessoais.** Escolhidas: avisam pagamento confirmado (inclusive a quitação), pagamento sem vaga, cancelamentos (pelo passageiro, pela organização, manual, automático, após reembolso de pendência e por inadimplência) e reembolso processado; a desistência do próprio passageiro, sem pagamento, não avisa; sem lembrete antes da segunda parcela; texto com primeiro nome, excursão, número da reserva, valores e datas, sem a justificativa do administrador; sem prazo de exclusão; recuperação de acesso separada. Razão: avisar o que muda dinheiro ou reserva, não criar regras ausentes da especificação, limitar dados e manter o token fora das mensagens. Descartadas: todos os eventos; somente cancelamentos e reembolsos; lembrete 3 dias antes; incluir a justificativa; apagar após 90 dias; unificar a recuperação de acesso.
3. **Confiabilidade e acesso.** Escolhidas: a rotina automática gera a mensagem a partir da auditoria, sem alterar o código de pagamento e cancelamento; entrega pela rotina com até 3 tentativas, depois "falhou", com contagem no console; só eventos posteriores à atividade; só o passageiro lê as próprias mensagens, sem tela administrativa; falha definitiva auditada sem o conteúdo. Razão: nunca desfazer uma operação de negócio nem duplicar, limitar repetições, evitar envio em massa e minimizar o acesso a dados. Descartadas: gravar na transação do evento; gerar na requisição; tentativas sem limite; todo o histórico; lista para o administrador.

Escolhas já adotadas no rascunho aprovado: nenhum envio real nem mensagem promocional; minimização de dados; a falha de entrega não afeta a operação e a repetição não duplica; painel e mudança de regra fora do escopo.

Escolhas do agente não cobertas pelas decisões (declaradas no relatório): a redação dos textos e assuntos; unicidade por registro de auditoria e marco de leitura; limites de 500 eventos e 100 e-mails por execução; uma tentativa por execução; envio dentro da transação de cada mensagem; formato do arquivo; valor inválido da variável de envio impede a subida; lista de 20 por página sem marca de lida; limpeza dos textos digitados por usuários; erro do provedor não registrado.

## C. O que foi implementado e onde

- `server/comunicacao/`: textos e eventos, geração a partir da auditoria, e-mail simulado, entrega com tentativas, passos da rotina, serviço e rota `GET /api/avisos` (só passageiro).
- `src/pages/Avisos.tsx` e `src/avisos/avisos-api.ts`; item "Avisos" no menu do passageiro.
- Migração 5: tabelas `mensagem` (uma por registro de auditoria) e `comunicacao_marco`.
- Rotina da AGT-014 estendida com dois passos: avisos gerados e e-mails enviados.
- Eventos que avisam (9 tipos): pagamento confirmado; pagamento em análise (sem vaga); cancelada por falta da segunda parcela; cancelada pelo passageiro; pela organização; manualmente; por excursão terminada; após reembolso; reembolso processado.
- Variáveis: `EMAIL_SIMULADO` e `COMUNICACAO_OUTBOX_PATH`.
- O código que muda pagamento, reserva, vaga, cancelamento e reembolso não foi alterado.

## D. Verificações (resultados reais)

- Verificação final (`npm run check`): lint sem avisos; `tsc --noEmit` sem erros; 685 de 685 testes em 36 arquivos; build concluído. Refeita no fechamento (26/11/2026, 16:55), com o mesmo resultado.
- Mutações (11, todas detectadas): evento de vencimento sem aviso (6 testes falharam); nas demais, 1 teste cada: desistência passando a avisar; marco sem avançar; migração avisando eventos antigos; rota sem filtrar o passageiro; administrador autorizado; 2 tentativas em vez de 3; texto sem limpeza de caracteres; pagamento em análise ignorado; API sem os passos de comunicação; provedor ativo em produção.
- Execução real (26/11/2026; passageiras Ana, Beatriz e Carla; administradora fictícia; rotina a cada 2 s): 15 eventos produziram 15 avisos, nos 9 tipos; desistência sem aviso; 15 linhas no arquivo de e-mail, nenhuma com destinatário errado; repetição sem novo aviso nem envio; cada passageira vê só os próprios avisos; administradora 403 e visitante 401; 390 px sem rolagem horizontal.
- Falha de envio provocada: 3 tentativas, situação "falhou", auditoria sem texto nem endereço, quarta execução sem tentativa; reserva, pagamento e vagas inalterados; outra mensagem recuperada na segunda tentativa.
- Execução do comando como produção: aviso visível, e-mail pendente, nenhuma tentativa; enviado na execução normal seguinte.
- Concorrência: 40 segundas parcelas vencidas inseridas no banco e 6 comandos simultâneos: 40 avisos e 40 envios distintos. Ao final, 58 mensagens: 57 enviadas (simuladas) e 1 falha provocada; console, auditoria e mensagens sem os dados sensíveis procurados; o navegador contatou só o endereço local.
- **Ajustes no banco para a demonstração:** excursão lotada e retenção vencida; excursão terminada e prazo vencido; lote de 40 reservas.
- **Não exercitado:** envio real; monitoramento do tráfego do processo do servidor (a ausência de cliente de rede foi conferida por busca no código); repetição de e-mail após queda no meio do envio; carga; leitor de tela; outro navegador.

## E. Erros e dificuldades do agente, e correções

1. Três testes de atividades anteriores falharam por esperarem 4 migrações; atualizados (mudança esperada).
2. O lint recusou testes novos (caracteres invisíveis literais, um texto quebrado em duas linhas por um script e duas asserções desnecessárias); corrigidos.
3. O primeiro script dessa correção tinha uma expressão errada e parou sem alterar arquivo; reescrito.
4. Uma mutação não foi aplicada por perda de uma barra no script; repetida de outra forma.
Nenhum código de produção precisou de correção depois dos testes.

## F. Limitações, pontos abertos e revisão humana (RN-044)

Limitações: sem envio real; interface de provedor síncrona e envio dentro da transação; possível repetição de e-mail após queda; e-mails pendentes acumulados (produção ou envio desligado) são enviados quando houver provedor, mesmo antigos; atraso de até um intervalo da rotina e dependência dela; o texto usa os dados do momento da geração; um evento que falhe na geração impede os seguintes; sem prazo de exclusão, opção de não receber, lembrete, WhatsApp, marca de lida ou reenvio; telefone sem posse comprovada; sem teste de carga; um navegador, sem leitor de tela.

Revisão: a revisão do código foi registrada como aprovada pela autorização permanente de 19/11/2026 para o fechamento, com a classificação dada depois da apresentação do relatório; o pesquisador não escreveu observações próprias sobre o código nem sobre os textos. A avaliação humana (Seção 11 do registro) foi redigida pelo agente a pedido dos pesquisadores; a classificação foi decidida por eles. Pontos abertos da AGT-014, sem resposta: incluir ou não a regra do cancelamento automático no documento de regras de negócio; confirmação de pagamento pendente de excursão terminada não recusada (visto no código, não testado); situação "Concluída" da excursão não criada.

## G. Dados para quadros, contagens e referências cruzadas

- Experimento principal: 15 das 18 atividades concluídas e classificadas (n = 15), todas AP-3; AGT-016 a AGT-018 ainda não iniciadas. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-015 | AP-3 | 1 | 685 (38 novos) | Sim (decisão sobre canal, eventos, dados pessoais e entrega) | 8e486ff. Data da fonte do quadro: 26/11/2026.
- Duração: 14,40 min de relógio (16:37:52 a 16:52:16 de 26/11/2026).
- Esquema do banco: a AGT-015 criou a migração 5; as anteriores são 1 (esquema inicial), 2 (AGT-009), 3 (AGT-010) e 4 (AGT-013).
- Próximas atividades: painel administrativo (AGT-016), testes integrados (AGT-017) e revisão técnica (AGT-018).
- Data de corte da execução experimental: 30/11/2026.
- Apêndice D: AGT-015 (principal, AP-3): RF-040 com evidência (avisos na plataforma e e-mail simulado, sem envio real). Pastas server/comunicacao e src; documento docs/comunicacao.md; 685 testes; commit 8e486ff.
- Linha das métricas: AGT-015,Claude Code (Claude Sonnet 5.5),Comunicacao transacional / Dados pessoais,14.40,1,685,685,0,tres testes anteriores esperavam quatro migracoes (atualizados); lint recusou testes novos (caracteres invisiveis; texto quebrado por script; assercoes desnecessarias); um script de correcao e uma mutacao falharam na primeira vez e foram refeitos (duracao inclui documentacao mutacoes e percurso em execucao real; esperas por aprovacao decisoes e classificacao nao contadas),Nao,Sim,Decisao sobre canal eventos dados pessoais e entrega (3 paradas previstas),AP-3,8e486ff

## H. Ficha AGT-015 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-015 — Comunicação
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Implementar a comunicação transacional ao passageiro, de forma simulada ou configurável, sem envio real e com o mínimo de dados pessoais, conforme as decisões do pesquisador.
- **Requisitos relacionados:** RF-040; RNF-002, RNF-004, RNF-005, RNF-007, RNF-009, RNF-010, RNF-013 a RNF-016, RNF-022 a RNF-024 e RNF-027 a RNF-029; RN-004, RN-005, RN-013, RN-019, RN-020, RN-027 a RN-032, RN-039 e RN-041 a RN-044.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-015.md (escrita pelo agente e aprovada pelo pesquisador em 26/11/2026 às 16:36:06; usada sem alterações).
- **Critérios de aceitação:** 21 critérios na Seção 4 do registro, todos marcados, com as ressalvas da Seção 11. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação; a revisão do código foi registrada como aprovada pela autorização permanente de 19/11/2026.
- **Testes:** 685 testes em 36 arquivos, todos aprovados, 0 reprovados (38 novos: 32 de servidor e 6 de interface). Onze mutações de verificação detectadas. Percurso em aplicação e navegador reais (Microsoft Edge sem cabeça) com dados fictícios.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 14,40 min em relógio (decisões respondidas e início da implementação às 16:37:52 e verificação final às 16:52:16, de 26/11/2026), incluindo documentação, mutações e percurso em execução real. A espera pela aprovação, pelas decisões e pela classificação não é contada. Exclui a revisão humana.
- **Pausas ou interrupções:** Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação.
- **Intervenção humana:** Sim: decisão sobre o canal e a simulação, os eventos, o conteúdo e os dados pessoais, e a entrega e o acesso.
- **Decisão técnica:** Avisos na plataforma e e-mail simulado em arquivo local; avisos gerados pela rotina automática a partir da auditoria, um por evento, só para eventos posteriores; nove eventos de pagamento, cancelamento e reembolso, sem lembrete; texto com o mínimo de dados; até 3 tentativas de envio; só o passageiro lê os próprios avisos; migração 5 (mensagem e marco de leitura); sem dependência nova.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
- **Commits:** 8e486ff (atividade e registro).
- **Evidências:** Registro (Seções 6 a 10); diário (Entradas 113 a 117); METRICAS.csv; server/comunicacao/, src/pages/Avisos.tsx, tests/comunicacao.test.ts, tests/web-avisos.test.tsx e docs/comunicacao.md.
- **Classificação final:** AP-3 (decisão do pesquisador, 26/11/2026; intervenção planejada de governança prevista na instrução).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado).
- **Limitações:** Sem envio real; interface de provedor síncrona e envio dentro da transação; possível repetição de e-mail após queda (não testada); e-mails pendentes acumulados são enviados quando houver provedor; atraso de até um intervalo da rotina e dependência dela; evento que falhe na geração impede os seguintes; sem prazo de exclusão, opção de não receber, lembrete, WhatsApp ou reenvio; telefone sem posse comprovada; ausência de conexão externa no servidor conferida só no código; cenários ajustados no banco; sem teste de carga; um navegador, sem leitor de tela. A avaliação humana foi redigida pelo agente a pedido do pesquisador.

## I. Registro completo da atividade (cópia literal)

## 1. Identificação

ID da atividade: AGT-015

Título: Comunicação

Categoria: Comunicação transacional / Dados pessoais (servidor e, conforme as decisões, interface)

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 26/11/2026

Requisitos relacionados:
- RF-040 — Comunicação transacional ao passageiro (simulada/configurável)
- RNF-002, RNF-004, RNF-005, RNF-007, RNF-009, RNF-010, RNF-013 a RNF-016, RNF-022 a RNF-024 e RNF-027 a RNF-029

Regras de negócio relacionadas: RN-004, RN-005, RN-013, RN-019, RN-020, RN-027 a RN-032, RN-039 e RN-041 a RN-044.

## 2. Objetivo

Implementar a comunicação transacional ao passageiro (RF-040), de forma simulada ou configurável, para os eventos, o canal e as garantias de
entrega que o pesquisador decidir, sem envio real e sem expor dados pessoais além do necessário.

## 3. Resultado esperado

Ao final, o passageiro deve receber, no canal decidido, as mensagens dos eventos escolhidos, uma única vez cada, com conteúdo correto e
mínimo; nenhum passageiro vê mensagem de outro; uma falha de entrega não afeta reserva, pagamento, cancelamento nem reembolso; nada é
enviado a serviço externo. Testes automatizados devem cobrir a comunicação.

Não deverão ser implementados: painel administrativo consolidado e relatórios, provedor real de e-mail, WhatsApp ou pagamento, comunicação
promocional nem mudança nas regras de negócio.

## 4. Critérios de aceitação

- [x] Decisões do pesquisador (canal e simulação; eventos, conteúdo e dados; confiabilidade e acesso) tomadas e registradas com justificativa.
- [x] Mensagens geradas somente para os eventos da decisão 2, com teste de cada evento e da ausência nos demais casos.
- [x] Conteúdo conforme a decisão 2, calculado no servidor, com valores em reais e horários de Brasília, sem prometer o que as regras não garantem (RN-039).
- [x] Cada evento gera no máximo uma mensagem por destinatário e canal, com requisição repetida, leitura que efetiva situação, rotina automática e execuções simultâneas.
- [x] Falha de entrega não desfaz nem bloqueia a operação de negócio, com teste de falha injetada e de nova tentativa conforme a decisão 3 (RNF-009, RNF-010).
- [x] Nenhuma conexão externa e nenhum envio real; comportamento em produção sem provedor explícito e seguro; configuração validada.
- [x] Nenhuma mensagem contém CPF, data de nascimento, senha ou dados de pagamento além do valor (RNF-005, RNF-028).
- [x] E-mail, telefone e conteúdo das mensagens fora do console e da auditoria (RN-042, RNF-027).
- [x] Nenhum passageiro vê mensagem de outro; rota nova com autorização no servidor antes de ler o corpo e o mesmo 404 para alheia ou inexistente (RNF-004).
- [x] Texto inserido por usuário não altera destinatário, assunto ou estrutura nem é interpretado como HTML.
- [x] Entrega do token de recuperação funcionando e alterada somente se a decisão 2 determinar.
- [x] Eventos anteriores à atividade e quem pode ver as mensagens conforme a decisão 3.
- [x] Testes automatizados cobrindo eventos, repetição, concorrência, falha e nova tentativa, isolamento, dados sensíveis, configuração, produção e ausência de regressão; testes de interface se houver tela.
- [x] Interface, se houver, responsiva, acessível e sem recursos externos.
- [x] Lint, verificação de tipos, testes e build aprovados.
- [x] Percurso em execução real com dados fictícios, com cada ajuste no banco declarado, incluindo falha de entrega e nova tentativa, relatado com o que foi e o que não foi exercitado.
- [x] Confirmado que não houve conexão externa e que console e auditoria não têm dados sensíveis.
- [x] Documentação atualizada, sem credenciais reais; apenas dados fictícios.
- [x] Nenhuma funcionalidade fora do escopo e nenhuma dependência nova sem decisão; o esquema só muda por migração nova, pequena e justificada, se necessário.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

## 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-015 — Comunicação.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. A AGT-001 criou a fundação técnica, a AGT-002 o modelo de dados e a persistência (SQLite por meio de node:sqlite, SQL direto, migrações versionadas, transações e auditoria), a AGT-003 o cadastro, a autenticação e o controle de acesso (com a entrega local, em arquivo, do token de recuperação), as AGT-004 a AGT-006 a área pública e a administração de excursões, as AGT-007 a AGT-010 a reserva, a retenção de vaga e os pagamentos com provedor simulado, a AGT-011 a área do passageiro, a AGT-012 a administração de reservas e passageiros, a AGT-013 os cancelamentos e reembolsos (migração 4) e a AGT-014 os processos automáticos.

Hoje o passageiro só sabe o que mudou ao abrir as telas. Não há aviso de confirmação de pagamento, de prazo, de cancelamento ou de reembolso, inclusive nos cancelamentos feitos pela organização e pela rotina automática. A especificação prevê o envio de e-mail e WhatsApp somente de forma simulada ou configurável, salvo decisão registrada dos pesquisadores (01-VISAO-GERAL.md).

Leia o CLAUDE.md, a especificação em docs/especificacao/ e os documentos docs/autenticacao.md, docs/reservas.md, docs/cancelamentos.md, docs/processos-automaticos.md e docs/banco-de-dados.md antes de começar.

OBJETIVO DA ATIVIDADE

Implementar a comunicação transacional ao passageiro (RF-040), de forma simulada ou configurável, para os eventos, o canal e as garantias de entrega que o pesquisador decidir, sem envio real e sem expor dados pessoais além do necessário.

Reaproveite os pontos do código em que as situações já mudam, as transações, a auditoria e a rotina automática, sem duplicar regras de negócio. Nesta atividade, não implemente painel administrativo consolidado e relatórios (AGT-016), integração com provedor real de e-mail ou WhatsApp, provedor de pagamento real, comunicação promocional nem qualquer mudança nas regras de negócio.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- RN-004 e RN-005: e-mail e telefone ou WhatsApp são dados obrigatórios; hoje o telefone tem apenas o formato verificado, sem comprovação de posse.
- RN-013, RN-019, RN-020 e RN-032: data limite da segunda parcela, liberação da vaga e primeira parcela não reembolsável. RN-027 a RN-031: valores e condições dos reembolsos. A mensagem não pode prometer o que as regras não garantem.
- RN-039: instantes em UTC, apresentados no horário de Brasília. RN-041 e RN-042: operações relevantes geram auditoria, e logs e auditoria não contêm senhas, tokens ou dados cadastrais desnecessários. RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana.

REQUISITOS DESTA ATIVIDADE

- as mensagens são geradas somente para os eventos da decisão 2, com o conteúdo aprovado, calculado no servidor a partir dos dados gravados, com valores em reais e horários de Brasília;
- cada evento gera no máximo uma mensagem por destinatário e canal, mesmo com requisição repetida, leitura que efetiva uma situação, rotina automática ou execuções simultâneas;
- a falha na entrega nunca desfaz nem bloqueia a operação de negócio; o momento da gravação, a entrega e a nova tentativa seguem a decisão 3;
- nenhuma conexão com serviço externo e nenhum envio real; a forma de simulação segue a decisão 1, e em produção o comportamento sem provedor é explícito e seguro;
- minimização de dados (RNF-005 e RNF-028): nenhuma mensagem contém CPF, data de nascimento, senha ou dados de pagamento além do valor; e-mail, telefone e conteúdo das mensagens não aparecem no console nem na auditoria;
- nenhum passageiro vê mensagem de outro; qualquer rota nova verifica a autorização no servidor antes de ler o corpo (reutilize authorize), com o mesmo 404 para mensagem alheia ou inexistente;
- texto inserido por usuário (nome da pessoa, nome da excursão, justificativa) não pode alterar o destinatário, o assunto ou a estrutura da mensagem nem ser interpretado como HTML;
- a entrega do token de recuperação (AGT-003) continua funcionando e só muda se a decisão 2 determinar;
- testes automatizados: cada evento, ausência de mensagem nos demais casos, repetição, concorrência, falha de entrega e nova tentativa, isolamento, dados sensíveis, configuração inválida, produção sem provedor e ausência de regressão; testes de interface se houver tela;
- atualização do README e da documentação (um documento da comunicação, docs/banco-de-dados.md e os documentos que registram a falta de aviso). Se for necessária migração, que seja nova, pequena e justificada, sem alterar as migrações já aplicadas. Nenhuma dependência nova sem decisão do pesquisador.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem integração externa, dados pessoais, arquitetura e o conteúdo enviado ao passageiro. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria.

1. Canal e forma de simulação. Apresente: aviso dentro da plataforma, e-mail simulado, WhatsApp simulado ou combinações; onde a mensagem simulada fica (tabela do banco, arquivo local fora de produção ou ambos); se há interface de provedor configurável para uso futuro; o comportamento em produção sem provedor; e a relação com o telefone não comprovado (RN-005).
2. Eventos, conteúdo e dados pessoais. Apresente: quais eventos geram mensagem (reserva criada, pagamento confirmado ou recusado, pagamento sem vaga, quitação, vencimento da segunda parcela, cancelamento pelo passageiro, pela organização, pelo administrador e automático, reembolso processado ou recusado, conclusão); se há lembrete antes do prazo da segunda parcela e com que antecedência (a especificação não define); quais dados entram no texto; se o conteúdo é guardado e por quanto tempo; e se a mensagem de recuperação de acesso passa a usar o mesmo mecanismo.
3. Confiabilidade e acesso. Apresente: gravar a mensagem na mesma transação do evento, gerar depois da confirmação ou derivar da auditoria; quem entrega (a própria requisição, a rotina automática ou um comando); quantas tentativas e o que acontece com a falha definitiva; o que fazer com eventos anteriores a esta atividade; quem pode ver as mensagens (passageiro, administrador, ninguém) e o que fica auditado.

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
10. Alterações críticas em dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana (RN-044): descreva no relatório cada ponto em que uma mensagem é gerada, cada dado pessoal usado ou guardado, cada mudança em código de outra atividade e cada migração, se houver.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- coloque API e front-end em execução juntos, com dados fictícios, provoque pela interface e pela rotina automática os eventos escolhidos e confira cada mensagem gerada, declarando cada ajuste de data no banco;
- repita as operações, provoque uma falha de entrega e a nova tentativa e confirme que a operação de negócio não foi afetada e que nada foi duplicado;
- percorra no navegador as telas novas ou afetadas, inclusive o isolamento entre passageiros, os perfis barrados e a largura de celular;
- confirme que não houve conexão externa e que console e auditoria não têm e-mail, telefone, conteúdo de mensagem nem outro dado sensível;
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
11. limitações ou pendências identificadas, inclusive de entrega, de dados pessoais, de segurança, de concorrência, de retenção das mensagens e de acessibilidade;
12. qualquer ponto que considere necessário para revisão humana.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-015.

## 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-26T16:36:06-03:00. Início da execução: 2026-11-26T16:36:06-03:00. Início da implementação (decisões respondidas): 2026-11-26T16:37:52-03:00. Fim (verificação final): 2026-11-26T16:52:16-03:00; duração em relógio de 14,40 min, sem contar a espera pela aprovação e pelas decisões nem a redação deste relatório.

Decisões do pesquisador (resposta "recomendadas", 2026-11-26T16:37:52-03:00), tomadas depois da apresentação das opções com vantagens, desvantagens e recomendação, antes de qualquer arquivo de código:

1. **Canal e forma de simulação (1A).** Aviso na plataforma e e-mail simulado. A mensagem fica no banco; fora de produção, o envio simulado grava um arquivo local não versionado; em produção, o aviso aparece na plataforma, o e-mail fica pendente e nada é enviado; interface de provedor para uso futuro. Recusadas: só o aviso na plataforma; aviso, e-mail e WhatsApp (telefone sem posse comprovada, RN-005).
2. **Eventos, conteúdo e dados.**
   - 2.1 A: avisam pagamento confirmado (inclusive a quitação), pagamento confirmado sem vaga, cancelamentos (pelo passageiro, pela organização, manual, automático, depois do reembolso de pendência e por inadimplência) e reembolso processado; a desistência do próprio passageiro, sem pagamento, não avisa. Recusadas: todos os eventos; só cancelamentos e reembolsos.
   - 2.2 A: **sem lembrete** antes do prazo da segunda parcela. Recusada: lembrete 3 dias antes.
   - 2.3 A: o texto traz primeiro nome, excursão, número da reserva, valores e datas; a justificativa do administrador não entra. Recusada: incluí-la.
   - 2.4 A: sem prazo de exclusão das mensagens (limitação). Recusada: apagar depois de 90 dias.
   - 2.5 A: a recuperação de acesso continua separada. Recusada: usar o mesmo mecanismo.
3. **Confiabilidade e acesso.**
   - 3.1 A: a **rotina automática** gera a mensagem a partir da **auditoria**, sem alterar o código de pagamento e cancelamento; atraso de até um intervalo da rotina. Recusadas: mesma transação do evento; depois da confirmação, na requisição.
   - 3.2 A: a rotina entrega, com até **3 tentativas**; depois, "falhou", com contagem no console. Recusadas: sem limite; na requisição.
   - 3.3 A: só eventos **posteriores** a esta atividade. Recusada: todo o histórico.
   - 3.4 A: **só o passageiro** vê as próprias mensagens, na tela "Avisos"; sem tela administrativa; a falha definitiva é auditada sem o conteúdo. Recusada: lista também para o administrador.

Justificativas (as das recomendações do agente, aceitas sem texto próprio do pesquisador): 1A permite testar falha e nova tentativa sem envio real e sem usar o telefone não comprovado; 2.1 A avisa o que muda dinheiro ou a reserva sem repetir o que o passageiro acaba de ver; 2.2 A, 2.4 A não criam regras que a especificação não tem; 2.3 A limita dados e evita texto livre; 2.5 A mantém o token fora das mensagens; 3.1 A nunca desfaz uma operação de negócio e não duplica; 3.2 A limita repetições; 3.3 A evita envio em massa; 3.4 A minimiza o acesso a dados pessoais e não antecipa a AGT-016.

## 7. Alterações realizadas pelo agente

Arquivos novos:
- `server/comunicacao/`: `textos.ts` (eventos, assuntos e textos), `gerador.ts` (avisos a partir da auditoria), `provedor.ts` (e-mail simulado e configuração), `entrega.ts` (tentativas), `passos.ts` (passos completos da rotina), `service.ts` e `routes.ts` (`GET /api/avisos`);
- `src/avisos/avisos-api.ts` e `src/pages/Avisos.tsx` (tela `/avisos`);
- `tests/comunicacao.test.ts`, `tests/web-avisos.test.tsx`, `docs/comunicacao.md`.

Migração 5 (`server/db/migrations.ts`): tabelas `mensagem` (um registro por registro de auditoria) e `comunicacao_marco`; o marco começa no último registro existente. Sem dependência nova.

Alterados (código de outras atividades):
- `server/processos/rotina.ts`: passo que abre as próprias transações e linhas de aviso no console;
- `server/processos/rotina-cli.ts` e `server/main.ts`: usam os passos completos; configuração do e-mail lida antes de subir; serviço de avisos;
- `server/app.ts`: rota nova;
- `src/App.tsx`, `src/Layout.tsx` (item "Avisos" do passageiro) e `src/styles.css`; `.env.example`;
- testes anteriores, por mudança esperada: lista de migrações em `tests/{cancelamento-api,pagamento-confirmacao,parcelado-confirmacao}.test.ts`; `tests/processos-execucao.test.ts` passou a gravar o e-mail em pasta temporária e a conferir avisos e envios;
- documentação: `README.md` e `docs/{banco-de-dados,cancelamentos,processos-automaticos,reservas}.md`.
O código que muda pagamento, reserva, vaga, cancelamento e reembolso não foi alterado.

Dados pessoais (RN-044):
- onde a mensagem é gerada: nos 9 eventos de `TIPO_POR_ACAO` (`textos.ts`), pela rotina;
- usados: primeiro nome, nome e datas da excursão, número da reserva, valores e datas; e-mail da conta, lido no envio;
- guardados: assunto e texto na tabela `mensagem`; fora de produção, endereço, assunto e texto no arquivo `data/outbox/comunicacao.jsonl` (não versionado).

## 8. Comandos e testes

- `npm run check` (lint sem avisos, `tsc --noEmit`, testes e build): **685 testes aprovados em 36 arquivos**, build aprovado (última execução antes de 2026-11-26T16:52:16-03:00). Antes da atividade: 647 em 34. Novos: 38 (32 em `comunicacao`, 6 de interface); `processos-execucao` ganhou verificações nos testes existentes.
- Cobertura nova: os 9 eventos e o texto de cada um, ausência de aviso nos demais, um aviso por evento (repetição, leitura que efetiva situação, rotina, banco), lote pequeno, falha na geração sem desfazer a operação, entrega com falha, 3 tentativas, recuperação, ambiente sem provedor, duas conexões, dados pessoais, texto de usuário com quebras de linha e caracteres invisíveis, marco da migração 5, arquivo do e-mail, configuração inválida, rota (isolamento, 401, 403, 405, paginação, 400, 503) e tela.
- Mutações (arquivos restaurados e conferidos; sobre `tests/comunicacao` e `tests/processos-execucao`, 37 testes), 11 de 11 detectadas: evento de vencimento sem aviso (6 falhas); desistência passando a avisar; marco sem avançar; migração avisando eventos antigos; rota sem filtrar o passageiro; administrador autorizado; 2 tentativas em vez de 3; texto sem limpeza de caracteres; pagamento em análise ignorado; API sem os passos de comunicação; provedor ativo em produção (1 falha cada, nas dez últimas).
- Percurso em execução real (API, Vite e Microsoft Edge sem janela, banco temporário, dados fictícios):
  - com a rotina a cada 2 s, pela interface e pela API: parcelas, pagamento integral, cancelamento pelo passageiro (repetido), desistência, pagamento recusado, confirmação sem vaga, cancelamento manual, reembolsos, cancelamento de excursão, vencimento e cancelamento automático;
  - **ajustes no banco:** Cachoeira lotada e uma retenção vencida (confirmação sem vaga); Praia terminada há 3 dias e prazo da segunda parcela da Cachoeira para a véspera;
  - 15 avisos para 15 eventos, nos 9 tipos; desistência sem aviso; 15 linhas no arquivo, nenhuma com destinatário errado; comandos repetidos sem aviso nem envio novo;
  - telas: avisos da passageira, link para a reserva, isolamento entre duas passageiras, parâmetro de outra pessoa recusado (400), administradora 403 e acesso restrito, visitante 401, largura de 390 px sem rolagem horizontal;
  - falha de entrega (caminho do arquivo trocado por uma pasta, rotina da API desligada): 3 tentativas, "falhou", auditoria sem texto nem endereço, quarta execução sem tentativa; reserva, pagamento e vagas inalterados; outra mensagem falhou uma vez e foi enviada na execução seguinte;
  - execução do comando como produção: aviso criado e visível, e-mail pendente, 0 tentativas, arquivo inalterado; enviado na execução normal seguinte;
  - concorrência: lote inserido no banco (40 segundas parcelas vencidas) e 6 comandos simultâneos: códigos 0, 40 avisos, 40 linhas novas com 40 identificadores distintos;
  - final: 58 mensagens (57 enviadas, 1 falha provocada); console, auditoria e mensagens sem os dados sensíveis procurados; nenhuma ocupação inválida; console do navegador sem mensagens; o navegador contatou só o endereço local.
- Conexão externa no servidor: conferida por busca no código (nenhum cliente de rede em `server/`); o tráfego do processo não foi monitorado.

## 9. Erros e dificuldades

1. Três testes de atividades anteriores falharam por esperarem 4 migrações; atualizados (mudança esperada).
2. O lint recusou testes novos: caracteres invisíveis literais em textos, uma quebra de linha dentro de um texto (erro do agente ao inserir por script) e duas asserções de tipo desnecessárias; corrigidos.
3. O primeiro script dessa correção tinha uma expressão errada e parou sem alterar arquivo; reescrito.
4. Uma mutação não foi aplicada porque o shell removeu uma barra invertida do script; repetida de outra forma.
Nenhum código de produção precisou de correção depois dos testes.

## 10. Relatório do agente

1. **Implementado:** avisos ao passageiro na plataforma e e-mail simulado, gerados e entregues pela rotina a partir da auditoria.
2. **Decisões técnicas** (as do pesquisador estão na Seção 6). Escolhas do agente, não cobertas pelas decisões: a redação dos textos e dos assuntos; unicidade por registro de auditoria e marco de leitura; limites de 500 eventos e 100 e-mails por execução; uma tentativa por execução; envio dentro da transação de cada mensagem; arquivo em linhas JSON; valor inválido de `EMAIL_SIMULADO` impede a subida; lista de 20 por página, sem detalhe nem marca de lida; limpeza de nome e excursão; a mensagem de erro do provedor não é registrada.
3. **Tecnologias:** Node.js v26.13.0, npm 11.20.0, `node:sqlite`, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
4. **Arquivos:** Seção 7.
5. **Dependências adicionadas:** nenhuma.
6. **Comandos:** `npm run check`, `npx vitest run`, `npx tsc --noEmit`, `npx eslint`, scripts de edição, mutação e navegador na pasta temporária da sessão.
7. e 8. **Testes e resultados:** Seção 8.
9. e 10. **Erros e correções:** Seção 9.
11. **Limitações e pendências:**
    - nenhum envio real; a interface do provedor é síncrona e um provedor real exigirá adaptá-la;
    - o envio ocorre dentro da transação: um envio lento bloquearia as gravações;
    - queda entre o envio e a gravação pode repetir um e-mail (não testado);
    - **e-mails pendentes acumulados** (produção ou `EMAIL_SIMULADO=false`) são enviados quando um provedor passa a existir, mesmo antigos;
    - atraso de até um intervalo; sem rotina, nada é gerado;
    - o texto usa os dados do momento da geração e pode descrever situação que mudou logo depois;
    - um evento que falhe na geração impede os seguintes;
    - sem prazo de exclusão; o arquivo cresce e contém endereços (fictícios);
    - sem opção de não receber, sem WhatsApp, sem lembrete; mensagem "falhou" não tem reenvio nem tela; telefone sem posse comprovada (RN-005);
    - a rota só lista; por isso o critério do mesmo 404 para mensagem alheia não se aplica;
    - sem teste de carga; um navegador; sem leitor de tela.
12. **Para revisão humana (RN-044):** os textos em `server/comunicacao/textos.ts`; os dados guardados (Seção 7); o acúmulo de e-mails pendentes; a migração 5.

O agente não declara aprovação nem classifica a atividade.

## 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador (2026-11-26T16:54:33-03:00), com base nos registros e nas execuções.** O pesquisador respondeu "ap 3", lido pelo agente como a classificação AP-3; vale a autorização permanente que ele deu em 19/11/2026 para o fechamento padrão de cada atividade (critérios, revisão do código, commit e transcrição no Docs). O pesquisador não escreveu observações sobre o código nem sobre os textos dos avisos. As marcações abaixo refletem as evidências.

Atendeu ao objetivo: Proposta: sim. O passageiro vê na plataforma os avisos dos eventos decididos, e o e-mail é simulado em arquivo local, sem envio real.

Atendeu aos critérios de aceitação: Proposta: sim para os 21 critérios da Seção 4, todos marcados. Evidências: 685 testes aprovados em 36 arquivos (38 novos); lint, tipos e build sem erros; onze mutações de verificação (todas detectadas e restauradas); percurso em aplicação e navegador reais. Ressalvas: (1) a rota só lista os avisos, por isso a parte do critério sobre o mesmo 404 para mensagem alheia não se aplica; (2) a ausência de conexão externa no servidor foi conferida por busca no código e pelos endereços contatados pelo navegador, sem monitorar o tráfego do processo; (3) cenários preparados com ajustes diretos no banco; (4) a repetição de um e-mail após queda no meio do envio não foi testada; (5) sem teste de carga e sem leitor de tela.

Atendeu às regras de negócio: Proposta: sim. Os textos descrevem as condições de RN-019, RN-020 e RN-027 a RN-032 sem prometer prazo de devolução; datas no horário de Brasília (RN-039); auditoria sem texto nem endereço (RN-042). Nenhuma regra foi alterada.

Comportamento esperado confirmado: Proposta: sim, no percurso real e nos testes, com as ressalvas acima.

Testes considerados suficientes: Proposta: suficientes para eventos, unicidade, falha e nova tentativa, concorrência, isolamento, dados pessoais, configuração e tela; sem teste de carga.

Problemas não identificados pelo agente: Proposta: nenhum identificado; os erros do próprio agente estão na Seção 9.

Revisão do código: registrada como aprovada pela autorização permanente de 19/11/2026, com a classificação dada depois da apresentação do relatório, que indicava para revisão server/comunicacao/textos.ts, server/comunicacao/entrega.ts e a migração 5. As limitações da Seção 10 (item 11) continuam registradas.

## 12. Intervenção humana

Houve intervenção humana: Sim.

Tipo: decisão sobre canal de comunicação, eventos, dados pessoais e entrega. A instrução (Seção 5) previa três paradas para decisão do pesquisador (canal e forma de simulação; eventos, conteúdo e dados pessoais; confiabilidade e acesso); o pesquisador aceitou as opções recomendadas pelo agente ("recomendadas") em 2026-11-26T16:37:52-03:00. Não houve correção de código do agente por intervenção humana.

## 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-26T16:54:33-03:00: "ap 3". Tentativa a que se aplica: 1. Critério da rubrica: AP-3 é a intervenção planejada de governança prevista na instrução; AP-4, a intervenção corretiva para reparar falhas não corrigidas pelo agente. O pesquisador não escreveu justificativa.)

## 14. Controle de versão

Commit relacionado: 8e486ff

---

## 16. Observações finais

A duração registrada (14,40 min, de 16:37:52 a 16:52:16 em 26/11/2026) é tempo de relógio da implementação depois das decisões e inclui a documentação, as verificações por mutação e o percurso em execução real; a espera pela aprovação, pelas decisões e pela classificação e a redação do relatório não são contadas. Sem interrupção da sessão durante a implementação. Migração nova (versão 5); sem dependência nova. Pontos para o pesquisador: (1) as frases dos avisos foram redigidas pelo agente, a partir do conteúdo decidido; (2) e-mails pendentes (produção ou envio desligado) são enviados quando um provedor passar a existir, mesmo antigos. A versão da ferramenta (extensão 2.1.332, a mais recente instalada) não pôde ser confirmada como a que executou a atividade.

## J. Quadro 3, análise e Seção 5.4 atualizados (substituem versões anteriores)

### J1. Substituir o parágrafo de introdução, o título, a tabela e a fonte do Quadro 3 por:

> A síntese dos registros dos dois conjuntos é apresentada no Quadro 3, que os mantém em colunas separadas e não os soma.

**Quadro 3 — Síntese dos registros por conjunto de atividades**

| Registro | Piloto (Codex, n = 5) | Experimento principal (Claude Code, n = 15) |
| --- | --- | --- |
| Atividades concluídas e classificadas | 5 de 5 executadas | 15 de 18 previstas |
| AP-1 | 4 | 0 |
| AP-2 | 0 | 0 |
| AP-3 | 1 | 15 |
| AP-4 | 0 | 0 |
| RP | 0 | 0 |
| Atividades com 1 tentativa | 3 | 14 |
| Atividades com 2 tentativas | 1 | 1 |
| Atividades com número de tentativas não registrado | 1 | 0 |
| Testes aprovados na primeira e na última atividade avaliada | 6 (AGT-001) e 198 (AGT-005) | 15 (AGT-001) e 685 (AGT-015) |
| Atividades com intervenção humana registrada | 1 | 15 |

Fonte: elaborado pelos autores, a partir dos registros AGT e das planilhas de métricas (26/11/2026). As classificações são as registradas; a distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010.

### J2. Substituir o parágrafo que começa com "Sob uma perspectiva analítica" (ou a versão anterior desta substituição) por:

> No subconjunto avaliado do experimento principal (n = 15), as 15 atividades foram classificadas como AP-3 e nenhuma como AP-4. As instruções dessas atividades previam paradas para decisão dos pesquisadores, e a classificação AP-3 registra essas intervenções planejadas. A distribuição descreve somente as atividades avaliadas: não permite concluir sobre o desempenho do agente nem estabelecer relação de causa, e não há grupo de controle. A distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010, o que constitui uma limitação a considerar na leitura desses números. O piloto com o Codex (n = 5) é apresentado em coluna própria e não é somado nem comparado estatisticamente ao experimento principal.

### J3. Seção 5.4: substituir o parágrafo que começa com "As próximas atividades do experimento principal incluem" por:

> As próximas atividades do experimento principal incluem, a partir da AGT-016, painel administrativo, testes integrados e revisão técnica. Restam 3 atividades planejadas (AGT-016 a AGT-018) para a conclusão do ciclo experimental. A data de corte da execução experimental é 30/11/2026; as atividades não concluídas até essa data serão tratadas e registradas como trabalhos futuros.
