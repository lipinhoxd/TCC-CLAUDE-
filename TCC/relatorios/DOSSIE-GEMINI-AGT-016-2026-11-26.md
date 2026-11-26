# Dossiê bruto da AGT-016 para o Gemini (26/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-016.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-016.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/painel-administrativo.md`, `git log` (commits 8b4bbef e 1c96c0e) e o relatório em página privada (https://claude.ai/artifact/NtmRCiY9TWU3Cq5KtSAaQm).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Classes (revisão metodológica confirmada pelos pesquisadores em 26/11/2026).** São cinco: AP-1 (verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta), AP-2 (atendidas após correções do próprio agente, sem intervenção direta), AP-3 (atendidas com intervenção planejada de governança e coplanejamento prevista na instrução), AP-4 (atendidas mediante intervenção corretiva do desenvolvedor para reparar falhas de execução, erros de código, alucinações ou desvios de escopo não corrigidos pelo agente) e RP (não atendidas pela abordagem utilizada). No experimento principal, AP-3: 16; AP-4: 0. Não criar outras classes.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. Não inferir causalidade, produtividade, qualidade geral nem taxa generalizável; não há grupo de controle. Os valores em reais da seção D são de **dados fictícios de teste**, com pagamento simulado, e não são resultados do estudo.
3. **Não inventar decisões, telas, funções ou limitações.** As decisões são exatamente as da seção B. **Não há relatórios, exportação nem gráficos.**
4. **Não apagar texto existente** (salvo as substituições da seção J) e **não duplicar parágrafos**. Ao inserir a ficha, não alterar as fichas anteriores.
5. **Não mudar data de corte, escopo ou cronograma.**
6. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 16** de 18; piloto **n = 5**; nunca somados.
7. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
8. **A ficha da AGT-016 é obrigatória.** Ao final, informar uma linha por trecho alterado e confirmar que a ficha foi inserida.

## Ordem em relação aos envios anteriores

1. Se ainda não enviados: a **Parte A** de `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md` e os dossiês das AGT-013, AGT-014 e AGT-015, nesta ordem.
2. Este dossiê. A seção J **substitui as seções J dos dossiês das AGT-014 e AGT-015 e as Partes B e C** do pedido de correção.

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. Não usar "revisão independente" nem "validação independente". A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-016 (Painel administrativo) é a 16.ª das 18 atividades do experimento principal com o Claude Code (Claude Sonnet 5.5). Foi executada em 26/11/2026, em uma tentativa, sem nova instrução, e classificada como AP-3 pelos pesquisadores no mesmo dia (resposta "ap 3", 18:43:56). A instrução foi escrita pelo agente a partir da especificação e aprovada pelo pesquisador às 17:59:42; as três decisões foram respondidas às 18:27:18 ("recomendadas"). A implementação terminou, com a verificação final aprovada, às 18:41:46 (14,47 min de relógio, incluindo documentação, mutações e dois percursos em execução real; as esperas pela aprovação, pelas decisões e pela classificação não são contadas).

Contexto: até a AGT-015, a administração tinha telas separadas, sem totais, e o histórico só podia ser consultado dentro de uma excursão ou de uma reserva.

Entrega: painel administrativo consolidado (RF-041) e consulta do histórico das operações administrativas e automáticas (RF-042).

Números: 720 testes automatizados aprovados em 38 arquivos (685 ao final da AGT-015; 35 novos: 23 de servidor e 12 de interface); lint, verificação de tipos e build aprovados; 13 mutações de verificação no servidor, detectadas e restauradas; percurso em aplicação e navegador reais (Microsoft Edge sem interface) com dados fictícios; nenhuma migração e nenhuma dependência nova.

## B. As três decisões dos pesquisadores (26/11/2026, 18:27:18) e suas razões

As razões são as das recomendações do agente, aceitas pelo pesquisador sem texto próprio.

1. **Conteúdo do painel.** Escolhidas: excursões a realizar com ocupação (capacidade, ocupadas, retidas e livres), reservas por situação, valores, pendências e quantidade de e-mails que falharam; cinco linhas de valores (recebido, inclusive o depois estornado; devolvido; líquido, inclusive valores em análise; a devolver, de reembolsos pendentes ou recusados; a receber, das segundas parcelas em aberto no prazo); totais de todo o histórico; sem exportação. Razão: mostrar vagas e dinheiro sem misturar o que entrou, o que saiu e o que falta, sem criar critérios ou recursos não pedidos; a contagem de e-mails não expõe mensagens. Descartadas: só ocupação e reservas; só o líquido; só reservas prontas ou concluídas; filtro por datas; CSV.
2. **Histórico e auditoria.** Escolhidas: só eventos do administrador e do sistema, sem acessos; filtros de origem, ação, registro e período, 20 por página; data, ação, autor por número, registro, mudança de situação, valores e justificativa; a consulta não é auditada; os históricos da excursão e da reserva continuam. Razão: seguir o texto do RF-042 e limitar dados exibidos. Descartadas: todos os eventos; só paginação; autor pelo nome; conteúdo bruto; auditar a consulta; substituir os históricos existentes.
3. **Leitura, acompanhamento e acesso.** Escolhidas: abrir o painel efetiva vencimentos e conclusões, como as outras telas administrativas; sem situação da rotina automática; "Painel" como primeiro item da administração e "Histórico" ao lado, atualizados ao abrir e por botão. Razão: manter os números iguais aos das telas de detalhe e evitar migração. Descartadas: somente ler; registrar e mostrar a rotina; atualização automática.

Escolhas já adotadas no rascunho aprovado: painel de leitura; números calculados no servidor; minimização de dados; nenhuma dependência nova sem decisão.

Escolhas do agente não cobertas pelas decisões (declaradas no relatório): a lista traz excursões publicadas e encerradas por terminar, até 100; leitura em uma transação; o painel recusa parâmetros; o histórico informa a reserva relacionada e monta o filtro de ação com o que existe; o menu superior recebeu só "Painel", ficando "Histórico" no submenu; o link para o passageiro aparece apenas no evento de consulta.

## C. O que foi implementado e onde

- `server/admin/painel.ts`: indicadores e histórico; rotas `GET /api/admin/painel` e `GET /api/admin/historico`, só para o administrador.
- `src/pages/AdminPainel.tsx`: telas `/admin` e `/admin/historico`.
- Rótulos de todas as ações administrativas e automáticas da auditoria.
- Alterados: serviço e rotas de administração, menu, submenu, rotas da interface, estilos, README e documento da administração. Documento novo: `docs/painel-administrativo.md`.
- Sem migração e sem dependência nova; nenhum teste de atividade anterior foi alterado.

## D. Verificações (resultados reais)

- Verificação final (`npm run check`): lint sem avisos; `tsc --noEmit` sem erros; 720 de 720 testes em 38 arquivos; build concluído. Refeita no fechamento (26/11/2026, 18:44), com o mesmo resultado.
- Mutações no servidor (13, todas detectadas): recebido sem os estornados; líquido somando o devolvido; a devolver sem os recusados; a receber pela primeira parcela; pendências contando pagamentos sem sinalização; histórico com acessos; histórico com ações de passageiros; painel sem efetivar prazos; data final excluída do período; e-mails pendentes contados como falha; passageiro autorizado na administração; excursões terminadas na lista; histórico entregando o estado gravado inteiro.
- Execução real (26/11/2026; passageiras Ana, Beatriz e Carla; administradora fictícia; executada duas vezes): painel zerado sem reservas; os cinco valores (R$ 13.784,85; R$ 3.200,00; R$ 10.584,85; R$ 1.890,00; R$ 945,00) iguais aos calculados à mão; reservas, pendências, reembolsos e ocupação iguais aos das telas de detalhe; com a rotina desligada e prazos vencidos, abrir o painel concluiu 2 reservas e venceu 1; reabrir não alterou o banco; histórico com 21 eventos, a mesma quantidade obtida no banco, sem ações de passageiros ou acessos; filtros e paginação; passageira 403 e visitante 401; respostas e console sem os dados sensíveis procurados; 390 px sem rolagem horizontal.
- **Ajustes no banco para a demonstração:** excursão lotada e retenção vencida; excursão terminada e prazo da segunda parcela vencido; falha de e-mail provocada trocando o caminho de envio.
- **Não exercitado:** mutações nos testes de interface; volume de dados e carga; leitor de tela ou ferramenta de acessibilidade; outro navegador.

## E. Erros e dificuldades do agente, e correções

1. Um teste novo usava um nome de campo que a própria auditoria recusa; corrigido o teste.
2. A primeira rodada de mutações não executou testes, por erro no caminho da pasta; corrigida e repetida.
3. Defeito de interface introduzido pelo agente: na tela larga do histórico, uma caixa de filtro sobrepunha a outra; percebido pelo agente na captura do percurso, não pelos testes; corrigido no estilo e o percurso repetido. A correção é posterior às mutações.

## F. Limitações, pontos abertos e revisão humana (RN-044)

Limitações: abrir o painel grava vencimentos e conclusões já devidos; valores de pagamentos simulados, sem conciliação; reembolso recusado segue em "A devolver"; sem filtro de período no painel, exportação, relatórios, gráficos ou atualização automática; situação da rotina não exibida; histórico sem índice novo e sem teste de volume; justificativa em texto livre; autor só pelo número; eventos sem autor tratados como do sistema; telas de excursões sem o submenu da administração; menu do administrador em duas linhas em tela larga; sem teste de carga; um navegador, sem leitor de tela.

Revisão: a revisão do código foi registrada como aprovada pela autorização permanente de 19/11/2026 para o fechamento, com a classificação dada depois da apresentação do relatório; o pesquisador não escreveu observações próprias. A avaliação humana (Seção 11 do registro) foi redigida pelo agente a pedido dos pesquisadores; a classificação foi decidida por eles.

Pontos de atividades anteriores sem resposta: incluir ou não a regra do cancelamento automático no documento de regras de negócio (AGT-014); confirmação de pagamento pendente de excursão terminada não recusada (visto no código, não testado); situação "Concluída" da excursão não criada.

## G. Dados para quadros, contagens e referências cruzadas

- Experimento principal: 16 das 18 atividades concluídas e classificadas (n = 16), todas AP-3; AGT-017 e AGT-018 ainda não iniciadas. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-016 | AP-3 | 1 | 720 (35 novos) | Sim (decisão sobre conteúdo do painel, histórico e leitura e acesso) | 8b4bbef. Data da fonte do quadro: 26/11/2026.
- Duração: 14,47 min de relógio (18:27:18 a 18:41:46 de 26/11/2026).
- Esquema do banco: a AGT-016 não criou migração; permanecem as versões 1 a 5 (a 5 é da AGT-015).
- Próximas atividades: testes integrados e validação das regras (AGT-017) e revisão técnica final (AGT-018).
- Data de corte da execução experimental: 30/11/2026.
- Apêndice D: AGT-016 (principal, AP-3): RF-041 com evidência; RF-042 com evidência (com a AGT-005). Pastas server/admin e src; documento docs/painel-administrativo.md; 720 testes; commit 8b4bbef.
- Linha das métricas: AGT-016,Claude Code (Claude Sonnet 5.5),Administracao / Painel e auditoria,14.47,1,720,720,0,campo de filtro sobreposto no historico percebido na captura de tela e corrigido; teste usava campo recusado pela auditoria (corrigido); primeira rodada de mutacoes sem executar testes por erro no caminho (repetida) (duracao inclui documentacao mutacoes e dois percursos em execucao real; esperas por aprovacao decisoes e classificacao nao contadas),Nao,Sim,Decisao sobre conteudo do painel historico e leitura e acesso (3 paradas previstas),AP-3,8b4bbef

## H. Ficha AGT-016 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-016 — Painel administrativo
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Implementar o painel administrativo consolidado e completar o histórico e a auditoria das operações administrativas e automáticas, conforme as decisões do pesquisador, sem alterar regra de negócio.
- **Requisitos relacionados:** RF-041 e RF-042; RNF-002, RNF-004, RNF-005, RNF-007, RNF-010, RNF-013 a RNF-016, RNF-022 a RNF-024 e RNF-027 a RNF-029; RN-021, RN-023, RN-033 a RN-035, RN-038, RN-039 e RN-041 a RN-044.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-016.md (escrita pelo agente e aprovada pelo pesquisador em 26/11/2026 às 17:59:42; usada sem alterações).
- **Critérios de aceitação:** 19 critérios na Seção 4 do registro, todos marcados, com as ressalvas da Seção 11. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação; a revisão do código foi registrada como aprovada pela autorização permanente de 19/11/2026.
- **Testes:** 720 testes em 38 arquivos, todos aprovados, 0 reprovados (35 novos: 23 de servidor e 12 de interface). Treze mutações de verificação no servidor, detectadas. Percurso em aplicação e navegador reais (Microsoft Edge sem cabeça) com dados fictícios.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 14,47 min em relógio (decisões respondidas e início da implementação às 18:27:18 e verificação final às 18:41:46, de 26/11/2026), incluindo documentação, mutações e dois percursos em execução real. A espera pela aprovação, pelas decisões e pela classificação não é contada. Exclui a revisão humana.
- **Pausas ou interrupções:** Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação.
- **Intervenção humana:** Sim: decisão sobre o conteúdo do painel, o histórico e a auditoria, e a leitura e o acesso.
- **Decisão técnica:** Painel com ocupação, reservas por situação, cinco valores (recebido, devolvido, líquido, a devolver e a receber), pendências e quantidade de e-mails com falha, sem exportação; histórico somente de ações do administrador e do sistema, com filtros e autor por número, sem auditar a consulta; painel efetiva vencimentos e conclusões antes de ler; sem migração e sem dependência nova.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
- **Commits:** 8b4bbef (atividade e registro).
- **Evidências:** Registro (Seções 6 a 10); diário (Entradas 118 a 122); METRICAS.csv; server/admin/painel.ts, src/pages/AdminPainel.tsx, tests/painel.test.ts, tests/web-painel.test.tsx e docs/painel-administrativo.md.
- **Classificação final:** AP-3 (decisão do pesquisador, 26/11/2026; intervenção planejada de governança prevista na instrução).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado).
- **Limitações:** Abrir o painel grava vencimentos e conclusões devidos; valores de pagamentos simulados, sem conciliação; sem filtro de período, exportação, gráficos ou atualização automática; situação da rotina não exibida; histórico sem índice novo e sem teste de volume; justificativa em texto livre; autor só pelo número; "Histórico" fora do menu superior e telas de excursões sem o submenu; mutações só no servidor; lotação, datas e prazos ajustados no banco para a demonstração; sem teste de carga; um navegador, sem leitor de tela. A avaliação humana foi redigida pelo agente a pedido do pesquisador.

## I. Registro completo da atividade (cópia literal)

## 1. Identificação

ID da atividade: AGT-016

Título: Painel administrativo

Categoria: Administração / Painel e auditoria (servidor e interface)

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 26/11/2026

Requisitos relacionados:
- RF-041 — Painel administrativo consolidado
- RF-042 — Histórico e auditoria de operações administrativas e automáticas (parte desta atividade; iniciado na AGT-005)
- RNF-002, RNF-004, RNF-005, RNF-007, RNF-010, RNF-013 a RNF-016, RNF-022 a RNF-024 e RNF-027 a RNF-029

Regras de negócio relacionadas: RN-021, RN-023, RN-033 a RN-035, RN-038, RN-039 e RN-041 a RN-044.

## 2. Objetivo

Implementar o painel administrativo consolidado (RF-041) e completar o histórico e a auditoria das operações administrativas e automáticas
(RF-042), conforme as decisões do pesquisador, sem alterar regra de negócio nem os dados apresentados.

## 3. Resultado esperado

Ao final, o administrador deve ver, em um painel, os indicadores decididos, com definições documentadas e números iguais aos das telas de
detalhe, e consultar o histórico decidido com filtros e paginação; visitante e passageiro não têm acesso; nenhum dado sensível aparece.
Testes automatizados devem cobrir o servidor e a interface.

Não deverão ser implementados: testes integrados de todas as regras, revisão técnica final, provedor real, gerenciamento de contas de
administrador nem mudança nas regras de negócio.

## 4. Critérios de aceitação

- [x] Decisões do pesquisador (conteúdo do painel; histórico e auditoria; leitura, acompanhamento e acesso) tomadas e registradas com justificativa.
- [x] Rotas novas só para o administrador, com autorização no servidor antes de qualquer leitura ou efeito: visitante 401, passageiro 403 (RNF-002, RNF-004).
- [x] Painel com os indicadores da decisão 1, calculados no servidor em uma leitura consistente, com a definição de cada um documentada (RF-041).
- [x] Cada número confere com dados conhecidos em teste e com as telas de detalhe; valores em centavos inteiros e datas no horário de Brasília (RN-038, RN-039).
- [x] Situações sem dados apresentadas de forma clara.
- [x] Histórico conforme a decisão 2, paginado, com filtros validados no servidor e consultas parametrizadas, sem carregar a auditoria inteira (RF-042, RN-041).
- [x] A auditoria continua somente de inclusão.
- [x] Efeito da leitura, acompanhamento da rotina e acesso conforme a decisão 3.
- [x] Painel e histórico sem senha, hash, token, CPF, telefone, data de nascimento, texto de mensagens ou dados de pagamento além do valor (RNF-005, RNF-028, RN-042).
- [x] Respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010).
- [x] Interface responsiva, acessível (sem depender só de cor), sem recursos externos.
- [x] Testes automatizados do servidor e da interface cobrindo autorização, indicadores, valores zerados, coerência, filtros, paginação, parâmetros inválidos, dados sensíveis e ausência de regressão.
- [x] Lint, verificação de tipos, testes e build aprovados.
- [x] Percurso em execução real com dados fictícios, com cada ajuste no banco declarado, conferindo os números contra o banco e as telas, relatado com o que foi e o que não foi exercitado.
- [x] Confirmado que o painel não altera dados além do decidido e que respostas, console e auditoria não têm dados sensíveis.
- [x] Documentação atualizada, sem credenciais reais; apenas dados fictícios.
- [x] Nenhuma funcionalidade fora do escopo e nenhuma dependência nova sem decisão; o esquema só muda por migração nova, pequena e justificada, se necessário.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

## 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-016 — Painel administrativo.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. A AGT-001 criou a fundação técnica, a AGT-002 o modelo de dados e a persistência (SQLite por meio de node:sqlite, SQL direto, migrações versionadas, transações e auditoria somente de inclusão), a AGT-003 o cadastro, a autenticação e o controle de acesso, as AGT-004 a AGT-006 a área pública e a administração de excursões (com o histórico de cada excursão), as AGT-007 a AGT-010 a reserva, a retenção de vaga e os pagamentos com provedor simulado, a AGT-011 a área do passageiro, a AGT-012 a administração de reservas, passageiros e pendências (com o histórico de cada reserva), a AGT-013 os cancelamentos e reembolsos, a AGT-014 os processos automáticos e a AGT-015 os avisos ao passageiro (migração 5).

Hoje a administração tem telas separadas de excursões, reservas, passageiros, pendências e reembolsos. Não há uma visão consolidada, e o histórico só pode ser consultado dentro de uma excursão ou de uma reserva.

Leia o CLAUDE.md, a especificação em docs/especificacao/ e os documentos docs/excursoes-admin.md, docs/administracao-reservas.md, docs/cancelamentos.md, docs/processos-automaticos.md, docs/comunicacao.md e docs/banco-de-dados.md antes de começar.

OBJETIVO DA ATIVIDADE

Implementar o painel administrativo consolidado (RF-041) e completar o histórico e a auditoria das operações administrativas e automáticas (RF-042), conforme as decisões do pesquisador, sem alterar nenhuma regra de negócio nem os dados que o painel apresenta.

Reaproveite os serviços, a auditoria, a autorização e as telas já existentes, sem duplicar regras. Nesta atividade, não implemente testes integrados de todas as regras (AGT-017), revisão técnica final (AGT-018), provedor real de pagamento ou de comunicação, gerenciamento de contas de administrador nem qualquer mudança nas regras de negócio.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- RN-033 e RN-034: o administrador configura as excursões e consulta passageiros e reservas. RN-035: alterações manuais só quando autorizadas e registradas na auditoria.
- RN-021 e RN-023: ocupação nunca acima da capacidade; situações da reserva: Aguardando pagamento, Pronto para embarque, Concluída e Cancelada. RN-038 e RN-039: valores em centavos inteiros e instantes em UTC, apresentados no horário de Brasília.
- RN-041 e RN-042: operações administrativas e automáticas relevantes geram histórico de auditoria, sem senhas, tokens ou dados cadastrais desnecessários. RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em dados pessoais, autorização, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana.

REQUISITOS DESTA ATIVIDADE

- rotas novas somente para o perfil administrador, com autorização verificada no servidor a cada requisição e antes de qualquer leitura ou efeito (reutilize authorize): visitante 401 e passageiro 403;
- o conteúdo do painel segue a decisão 1; cada número é calculado no servidor a partir dos dados gravados, em uma leitura consistente, com a definição documentada, e confere com as telas de detalhe; situações sem dados são apresentadas de forma clara;
- o histórico segue a decisão 2: paginado, com filtros validados no servidor e consultas parametrizadas, sem carregar a auditoria inteira, mostrando apenas os campos aprovados; a auditoria continua somente de inclusão;
- o efeito da leitura, o acompanhamento da rotina e o acesso seguem a decisão 3;
- minimização de dados (RNF-005 e RNF-028): o painel e o histórico não mostram senha, hash, token, CPF, telefone, data de nascimento, texto das mensagens ao passageiro nem dados de pagamento além do valor;
- respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010);
- interface responsiva, acessível (inclusive sem depender só de cor), sem recursos externos e sem dependência nova de gráficos ou de qualquer outra natureza sem decisão do pesquisador;
- testes automatizados do servidor (autorização, cada indicador com dados conhecidos, valores zerados, coerência com os detalhes, filtros, paginação, parâmetros inválidos, dados sensíveis) e da interface, sem regressão nas atividades anteriores;
- atualização do README e da documentação (um documento do painel e os documentos que registram o painel como pendente). Se for necessária migração, que seja nova, pequena e justificada, sem alterar as migrações já aplicadas.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem o significado de valores financeiros e de ocupação, dados pessoais, autorização e arquitetura. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria.

1. Conteúdo do painel. Apresente: quais indicadores entram (ocupação por excursão, reservas por situação, valores confirmados, valores a receber da segunda parcela, reembolsos pendentes e processados, pendências administrativas, e-mails com falha); a definição de cada valor, em especial o que conta como valor arrecadado, que a especificação não define; o período considerado; e se há exportação ou relatório, que os requisitos desta atividade não pedem.
2. Histórico e auditoria. Apresente: quais eventos aparecem (somente administrativos e automáticos, como no RF-042, ou todos, inclusive os de passageiros e de acesso); quais filtros existem; o que é mostrado de cada evento (autor por número ou por nome, estados anterior e novo, justificativas, consultas a dados de passageiros); se a consulta ao histórico é registrada; e a relação com os históricos já existentes nas excursões e nas reservas.
3. Leitura, acompanhamento e acesso. Apresente: se abrir o painel efetiva vencimentos e conclusões, como as outras telas administrativas, ou somente lê; se mostra a situação da rotina automática, que hoje não registra suas execuções, e se isso exige migração; e onde o painel fica na navegação e como é atualizado.

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
10. Alterações críticas em autorização, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana (RN-044): descreva no relatório cada rota nova, a definição de cada valor apresentado, cada dado pessoal exibido, cada gravação feita por uma leitura, cada mudança em código de outra atividade e cada migração, se houver.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- coloque API e front-end em execução juntos, com dados fictícios, produza pela interface e pela rotina situações que alimentem cada indicador, declarando cada ajuste no banco, e confira cada número do painel contra o banco e contra as telas de detalhe;
- percorra o painel e o histórico no navegador, inclusive filtros, paginação, estado sem dados, os perfis barrados e a largura de celular;
- confirme que o painel não altera dados além do que a decisão 3 permitir e que respostas, console e auditoria não têm dados sensíveis;
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
11. limitações ou pendências identificadas, inclusive de valores apresentados, de dados pessoais, de desempenho, de histórico e de acessibilidade;
12. qualquer ponto que considere necessário para revisão humana.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-016.

## 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-26T17:59:42-03:00. Início da execução: 2026-11-26T17:59:42-03:00. Início da implementação (decisões respondidas): 2026-11-26T18:27:18-03:00. Fim (verificação final): 2026-11-26T18:41:46-03:00; duração em relógio de 14,47 min, sem contar a espera pela aprovação e pelas decisões nem a redação deste relatório.

Decisões do pesquisador (resposta "recomendadas", 2026-11-26T18:27:18-03:00), tomadas depois da apresentação das opções com recomendação, antes de qualquer arquivo de código:

1. **Conteúdo do painel.**
   - 1.1 A: excursões a realizar com ocupação (capacidade, ocupadas, retidas e livres), reservas por situação, valores, pendências e a quantidade de e-mails que falharam. Recusada: só ocupação e reservas.
   - 1.2 A: cinco linhas separadas: **recebido** (tudo o que foi confirmado, inclusive o depois estornado), **devolvido** (reembolsos processados), **líquido** (recebido menos devolvido, inclusive valores que aguardam análise), **a devolver** (reembolsos pendentes ou recusados) e **a receber** (segundas parcelas em aberto, dentro do prazo). Recusadas: só o líquido; só reservas prontas ou concluídas.
   - 1.3 A: totais de todo o histórico; ocupação só das excursões não terminadas. Recusada: filtro por datas.
   - 1.4 A: sem exportação. Recusada: CSV.
2. **Histórico e auditoria.**
   - 2.1 A: só os eventos do administrador e do sistema (RF-042); entradas, saídas e falhas de login ficam de fora. Recusada: todos os eventos.
   - 2.2 A: filtros de origem, tipo de ação, registro e período, 20 por página. Recusada: só paginação.
   - 2.3 A: data, ação, autor por número, registro com link, mudança de situação, valores e justificativa. Recusadas: autor pelo nome; conteúdo bruto.
   - 2.4 A: a consulta ao histórico **não** é auditada. Recusada: auditar cada consulta.
   - 2.5 A: os históricos da excursão e da reserva continuam. Recusada: substituí-los.
3. **Leitura, acompanhamento e acesso.**
   - 3.1 A: abrir o painel **efetiva vencimentos e conclusões** pendentes, como as outras telas administrativas. Recusada: somente ler.
   - 3.2 A: **não** mostrar a situação da rotina (ela não registra execuções). Recusada: registrar e mostrar, com migração.
   - 3.3 A: "Painel" como primeiro item da administração e "Histórico" ao lado, atualizados ao abrir e por botão. Recusada: atualização automática.

Justificativas (as das recomendações do agente, aceitas sem texto próprio do pesquisador): 1.1 A e 1.2 A mostram vagas e dinheiro sem misturar o que entrou, o que saiu e o que falta; a contagem de e-mails não expõe mensagens (decisão 3.4 da AGT-015); 1.3 A e 1.4 A evitam critérios e recursos que o requisito não pede; 2.1 A segue o texto do RF-042; 2.3 A e 2.4 A limitam dados exibidos; 3.1 A mantém os números iguais aos das telas de detalhe; 3.2 A evita migração; 3.3 A usa a navegação existente.

## 7. Alterações realizadas pelo agente

Arquivos novos:
- `server/admin/painel.ts` (cálculo dos indicadores e consulta do histórico);
- `src/pages/AdminPainel.tsx` (telas `/admin` e `/admin/historico`);
- `tests/painel.test.ts`, `tests/web-painel.test.tsx`, `docs/painel-administrativo.md`.

Alterados (código de outras atividades):
- `server/admin/service.ts`: métodos `painel` e `historico`;
- `server/admin/routes.ts`: rotas `GET /api/admin/painel` e `GET /api/admin/historico`;
- `src/admin/reservas-admin-api.ts`: tipos, chamadas e rótulos das ações de auditoria;
- `src/pages/AdminReservas.tsx`: "Painel" e "Histórico" no submenu; `src/Layout.tsx`: "Painel" no menu do administrador; `src/App.tsx`: rotas; `src/styles.css`;
- documentação: `README.md` e `docs/administracao-reservas.md`.
Sem migração e sem dependência nova. Nenhum teste de atividade anterior foi alterado.

Pontos para revisão (RN-044):
- rotas novas, só para o administrador, com `authorize` antes de qualquer leitura ou efeito;
- definição de cada valor em `painel.ts` e em `docs/painel-administrativo.md`;
- dados pessoais exibidos: nenhum; o histórico mostra a justificativa digitada pelo administrador e números de usuário e de registro;
- única gravação por leitura: abrir o painel efetiva o vencimento da segunda parcela e a conclusão (funções das AGT-010 e AGT-011).

## 8. Comandos e testes

- `npm run check` (lint sem avisos, `tsc --noEmit`, testes e build): **720 testes aprovados em 38 arquivos**, build aprovado (última execução antes de 2026-11-26T18:41:46-03:00). Antes da atividade: 685 em 36. Novos: 35 (23 em `painel`, 12 de interface).
- Cobertura nova: painel sem dados, cada valor com dados conhecidos, estorno e recusa, coerência com as telas de detalhe, pendências e e-mails com falha, efetivação no instante exato do prazo e na conclusão, ausência de outras gravações, lista de excursões (critérios, ordem e limite de 100), parâmetros recusados; histórico (autores incluídos e excluídos, campos entregues, filtros, período em Brasília, paginação, parâmetros inválidos e tentativa de injeção, auditoria somente de inclusão); rotas (401, 403, 405, sem efeito para quem não é administrador, sem dados pessoais); telas.
- Mutações (arquivos restaurados e conferidos byte a byte; sobre os 23 testes de `tests/painel.test.ts`), 13 de 13 detectadas: recebido sem os estornados (1 falha); líquido somando o devolvido (2); a devolver sem os recusados (1); a receber pela primeira parcela (2); pendências contando pagamentos sem sinalização (1); histórico com acessos (1); histórico com ações de passageiros (2); painel sem efetivar prazos (3); data final excluída do período (1); e-mails pendentes contados como falha (1); passageiro autorizado na administração (3); excursões terminadas na lista (1); histórico entregando o estado gravado inteiro (1). Os testes de interface não passaram por mutação.
- Percurso em execução real (API, Vite e Microsoft Edge sem janela, banco temporário, dados fictícios), executado duas vezes; os resultados abaixo são os da segunda, com a mesma sequência:
  - painel sem reservas com valores zerados;
  - pela interface: reservas parceladas e integrais, cancelamentos, reembolso aprovado e recusado, confirmação sem vaga, retenção ativa e uma falha definitiva de e-mail (comando com o caminho de envio trocado por uma pasta);
  - **ajustes no banco:** Cachoeira lotada e uma retenção vencida; Praia terminada há 3 dias e prazo da segunda parcela da Cachoeira para a véspera, com a rotina desligada;
  - abrir o painel concluiu 2 reservas e venceu 1; os cinco valores (R$ 13.784,85; R$ 3.200,00; R$ 10.584,85; R$ 1.890,00; R$ 945,00) iguais aos calculados à mão; reservas por situação, pendências, reembolsos e ocupação iguais aos das telas de detalhe; reabrir o painel e consultar o histórico não alterou o banco;
  - histórico: 21 eventos, a mesma quantidade obtida no banco, sem ações de passageiros ou de acesso; filtros, aviso de filtro incompleto, período vazio, segunda página e parâmetro inválido;
  - 390 px sem rolagem horizontal da página; passageira 403 e visitante 401; respostas e console sem os dados sensíveis procurados; navegador sem mensagens e só com o endereço local.

## 9. Erros e dificuldades

1. Um teste novo usava um nome de campo que a própria auditoria recusa; corrigido o teste.
2. A primeira rodada de mutações não executou nenhum teste, porque o script usava a letra da unidade em minúscula no caminho da pasta; corrigido e repetido. Nenhum resultado daquela rodada foi aproveitado.
3. **Defeito de interface introduzido pelo agente:** na tela larga do histórico, a caixa de seleção "Ação" ultrapassava a coluna e sobrepunha a caixa ao lado. Foi percebido pelo agente na captura de tela do percurso, não pelos testes; corrigido no estilo, com o percurso repetido e uma verificação de sobreposição sem ocorrência. A correção é posterior às mutações.

## 10. Relatório do agente

1. **Implementado:** painel consolidado e histórico das operações administrativas e automáticas.
2. **Decisões técnicas** (as do pesquisador estão na Seção 6). Escolhas do agente, não cobertas pelas decisões: a lista de excursões traz publicadas e encerradas por terminar (sem rascunhos e canceladas), até 100; leitura em uma transação; o painel recusa parâmetros; o histórico informa a reserva relacionada e monta o filtro de ação com o que existe; o menu superior recebeu só "Painel", e "Histórico" fica no submenu ao lado dele; o link para o passageiro aparece apenas no evento de consulta.
3. **Tecnologias:** Node.js v26.13.0, npm 11.20.0, `node:sqlite`, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
4. **Arquivos:** Seção 7.
5. **Dependências adicionadas:** nenhuma.
6. **Comandos:** `npm run check`, `npx vitest run`, `npx tsc --noEmit`, `npx eslint`, scripts de edição, mutação e navegador na pasta temporária da sessão.
7. e 8. **Testes e resultados:** Seção 8.
9. e 10. **Erros e correções:** Seção 9.
11. **Limitações e pendências:**
    - abrir o painel grava vencimentos e conclusões já devidos, o que a aplicação não desfaz;
    - sem filtro de período no painel, sem exportação, relatórios ou gráficos; atualização só ao abrir ou pelo botão;
    - valores de pagamentos simulados, sem conciliação; reembolso recusado segue em "A devolver";
    - a situação da rotina não aparece;
    - o histórico não tem índice novo e percorre a auditoria na contagem, no filtro e na lista de ações, sem teste de volume;
    - justificativa em texto livre, que pode conter dados pessoais; autor só pelo número;
    - eventos sem autor são tratados como do sistema, inclusive os efetivados durante a consulta de um passageiro;
    - as telas de excursões não têm o submenu da administração, e nelas o histórico é alcançado pelo "Painel";
    - o menu do administrador ocupa duas linhas em tela larga;
    - sem teste de carga; um navegador; sem leitor de tela.
12. **Para revisão humana (RN-044):** as definições dos valores; o critério de eventos do histórico; a gravação feita ao abrir o painel.

O agente não declara aprovação nem classifica a atividade.

## 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador (2026-11-26T18:43:56-03:00), com base nos registros e nas execuções.** O pesquisador respondeu "ap 3", lido pelo agente como a classificação AP-3; vale a autorização permanente que ele deu em 19/11/2026 para o fechamento padrão de cada atividade (critérios, revisão do código, commit e transcrição no Docs). O pesquisador não escreveu observações sobre o código nem sobre os pontos de atenção do relatório. As marcações abaixo refletem as evidências.

Atendeu ao objetivo: Proposta: sim. O administrador consulta o painel com os indicadores decididos e o histórico das operações administrativas e automáticas, sem mudança de regra de negócio.

Atendeu aos critérios de aceitação: Proposta: sim para os 19 critérios da Seção 4, todos marcados. Evidências: 720 testes aprovados em 38 arquivos (35 novos); lint, tipos e build sem erros; treze mutações de verificação (todas detectadas e restauradas); percurso em aplicação e navegador reais. Ressalvas: (1) a contagem, o filtro e a lista de ações do histórico percorrem a auditoria no banco, sem carregar todos os registros, e sem índice novo nem teste de volume; (2) as mutações cobriram o servidor, não os testes de interface; (3) a acessibilidade não foi verificada com leitor de tela nem com ferramenta própria; (4) cenários preparados com ajustes diretos no banco; (5) um defeito de interface foi percebido só no percurso em navegador (Seção 9, item 3); (6) sem teste de carga.

Atendeu às regras de negócio: Proposta: sim. Valores em centavos (RN-038), datas no horário de Brasília (RN-039), situações da reserva conforme a RN-023, ocupação pela mesma função das reservas (RN-021) e auditoria somente de inclusão e sem dados sensíveis (RN-041, RN-042). Nenhuma regra foi alterada.

Comportamento esperado confirmado: Proposta: sim, no percurso real e nos testes, com as ressalvas acima.

Testes considerados suficientes: Proposta: suficientes para autorização, indicadores, coerência com os detalhes, filtros, paginação, parâmetros inválidos, dados sensíveis e telas; sem teste de volume ou de carga.

Problemas não identificados pelo agente: Proposta: nenhum identificado; os erros do próprio agente estão na Seção 9.

Revisão do código: registrada como aprovada pela autorização permanente de 19/11/2026, com a classificação dada depois da apresentação do relatório, que indicava para revisão server/admin/painel.ts. As limitações da Seção 10 (item 11) continuam registradas.

## 12. Intervenção humana

Houve intervenção humana: Sim.

Tipo: decisão sobre valores apresentados, histórico e auditoria, leitura e acesso. A instrução (Seção 5) previa três paradas para decisão do pesquisador (conteúdo do painel; histórico e auditoria; leitura, acompanhamento e acesso); o pesquisador aceitou as opções recomendadas pelo agente ("recomendadas") em 2026-11-26T18:27:18-03:00. Não houve correção de código do agente por intervenção humana.

## 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-26T18:43:56-03:00: "ap 3". Tentativa a que se aplica: 1. Critério da rubrica: AP-3 é a intervenção planejada de governança prevista na instrução; AP-4, a intervenção corretiva para reparar falhas não corrigidas pelo agente. O pesquisador não escreveu justificativa.)

## 14. Controle de versão

Commit relacionado: 8b4bbef

---

## 16. Observações finais

A duração registrada (14,47 min, de 18:27:18 a 18:41:46 em 26/11/2026) é tempo de relógio da implementação depois das decisões e inclui a documentação, as verificações por mutação e os dois percursos em execução real; a espera pela aprovação, pelas decisões e pela classificação e a redação do relatório não são contadas. Sem interrupção da sessão durante a implementação. Sem migração e sem dependência nova. Registrado para o pesquisador: abrir o painel efetiva vencimentos e conclusões já devidos (decisão 3.1); os valores são de pagamentos simulados; o "Histórico" está no submenu da administração e não no menu superior (escolha do agente, com ajuste oferecido e não pedido). A versão da ferramenta (extensão 2.1.332, a mais recente instalada) não pôde ser confirmada como a que executou a atividade.

## J. Quadro 3, análise e Seção 5.4 atualizados (substituem versões anteriores)

### J1. Substituir o parágrafo de introdução, o título, a tabela e a fonte do Quadro 3 por:

> A síntese dos registros dos dois conjuntos é apresentada no Quadro 3, que os mantém em colunas separadas e não os soma.

**Quadro 3 — Síntese dos registros por conjunto de atividades**

| Registro | Piloto (Codex, n = 5) | Experimento principal (Claude Code, n = 16) |
| --- | --- | --- |
| Atividades concluídas e classificadas | 5 de 5 executadas | 16 de 18 previstas |
| AP-1 | 4 | 0 |
| AP-2 | 0 | 0 |
| AP-3 | 1 | 16 |
| AP-4 | 0 | 0 |
| RP | 0 | 0 |
| Atividades com 1 tentativa | 3 | 15 |
| Atividades com 2 tentativas | 1 | 1 |
| Atividades com número de tentativas não registrado | 1 | 0 |
| Testes aprovados na primeira e na última atividade avaliada | 6 (AGT-001) e 198 (AGT-005) | 15 (AGT-001) e 720 (AGT-016) |
| Atividades com intervenção humana registrada | 1 | 16 |

Fonte: elaborado pelos autores, a partir dos registros AGT e das planilhas de métricas (26/11/2026). As classificações são as registradas; a distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010.

### J2. Substituir o parágrafo que começa com "Sob uma perspectiva analítica" (ou a versão anterior desta substituição) por:

> No subconjunto avaliado do experimento principal (n = 16), as 16 atividades foram classificadas como AP-3 e nenhuma como AP-4. As instruções dessas atividades previam paradas para decisão dos pesquisadores, e a classificação AP-3 registra essas intervenções planejadas. A distribuição descreve somente as atividades avaliadas: não permite concluir sobre o desempenho do agente nem estabelecer relação de causa, e não há grupo de controle. A distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010, o que constitui uma limitação a considerar na leitura desses números. O piloto com o Codex (n = 5) é apresentado em coluna própria e não é somado nem comparado estatisticamente ao experimento principal.

### J3. Seção 5.4: substituir o parágrafo que começa com "As próximas atividades do experimento principal incluem" por:

> As próximas atividades do experimento principal incluem, a partir da AGT-017, testes integrados e revisão técnica. Restam 2 atividades planejadas (AGT-017 e AGT-018) para a conclusão do ciclo experimental. A data de corte da execução experimental é 30/11/2026; as atividades não concluídas até essa data serão tratadas e registradas como trabalhos futuros.
