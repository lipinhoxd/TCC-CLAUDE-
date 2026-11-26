# Dossiê bruto da AGT-012 para o Gemini (26/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-012.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-012.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/administracao-reservas.md`, `git log` (commits 482f981 e a797a32) e o relatório em página privada (https://claude.ai/artifact/MdMqT3vMwcyhUUL2wmx6zg).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Não criar classes.** Existem somente quatro: AP-1 (verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta), AP-2 (atendidas após correções do próprio agente, sem intervenção direta), AP-3 (as verificações só foram atendidas com intervenção direta do pesquisador) e RP (não atendidas pela abordagem utilizada). **Não existe "AP-4"** e o AP-3 não deve ser redefinido nem renomeado.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. Não inferir causalidade, produtividade, qualidade geral nem taxa generalizável; não há grupo de controle.
3. **Não inventar decisões, telas, funções ou limitações.** As decisões são exatamente as da seção B.
4. **Não apagar texto existente** (por exemplo, parágrafos de atividades anteriores e frases sobre as migrações das AGT-009 e AGT-010) e **não duplicar parágrafos**.
5. **Não mudar data de corte, escopo ou cronograma**: são decisão dos pesquisadores.
6. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 12** de 18; piloto **n = 5**; nunca somados.
7. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
8. Ao final, informar uma linha por trecho alterado.

Observação: há correções da AGT-011 pendentes de aprovação dos pesquisadores (`TCC/relatorios/PEDIDO-CORRECAO-GEMINI-AGT-011-2026-11-24.md`); este dossiê não as aplica.

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. Não usar "revisão independente" nem "validação independente" (não há segundo avaliador). A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-012 (Administração de reservas e passageiros) é a 12.ª das 18 atividades do experimento principal com o Claude Code (Claude Sonnet 5.5). Foi executada em 24/11/2026, em uma tentativa, sem nova instrução, e classificada como AP-3 pelos pesquisadores em 26/11/2026 (resposta "ap 3 sim"), segundo o critério único adotado por eles. A instrução foi escrita pelo agente a partir da especificação e aprovada pelo pesquisador em 24/11/2026 às 21:47:37; as três decisões foram respondidas às 21:49:20 ("recomendadas"). A implementação terminou, com a verificação final aprovada, às 22:04:52 (15,53 min de relógio, incluindo documentação, mutações e percurso em navegador; as esperas pelas decisões e pela classificação não são contadas).

Entrega: consulta de reservas pelo administrador (lista com filtros e paginação; detalhe com pagamentos, retenções, pendências e auditoria), consulta de passageiros (lista com CPF e telefone mascarados; detalhe com dados completos, auditado), lista de pendências administrativas e duas alterações manuais de situação autorizadas, com justificativa e auditoria.

Números: 557 testes automatizados aprovados em 30 arquivos (502 ao final da AGT-011; 55 novos: 34 de API e 21 de interface); lint, verificação de tipos e build aprovados; 5 mutações de verificação detectadas e restauradas; percurso em navegador real (Microsoft Edge sem interface) com dados fictícios; nenhuma migração e nenhuma dependência nova. Nenhum teste nem serviço das AGT-007 a AGT-011 foi alterado.

## B. As três decisões dos pesquisadores (24/11/2026, 21:49:20) e suas razões

1. **Dados pessoais visíveis ao administrador (RF-038, RN-044).** Escolhida: lista com nome e e-mail inteiros e CPF e telefone mascarados; dados completos (CPF, telefone, data de nascimento) só no detalhe do passageiro, com auditoria de cada consulta (quem consultou quem e quando, sem gravar o dado consultado); busca por nome, e-mail e CPF. Alternativas: tudo por inteiro em qualquer tela (expõe dados de todos); só nome e e-mail (impede confirmar identidade e contatar).
2. **Alterações manuais de situação autorizadas (RF-039, RN-035).** Escolhida: somente transições sem efeito financeiro, com justificativa obrigatória (até 300 caracteres) e auditoria com o administrador como ator: cancelar a reserva em "Aguardando pagamento" sem pagamento pendente ou confirmado (libera a retenção) e marcar como "Concluída" a reserva "Pronta para embarque" cuja excursão terminou. Alternativas: conjunto maior, incluindo cancelar com pagamento confirmado (depende do reembolso da AGT-013); nenhuma por enquanto (RF-039 sem funcionalidade).
3. **Pendências administrativas e pagamentos (RF-026, RN-022).** Escolhida: apenas listar e filtrar (pagamento confirmado sem vaga e segunda parcela confirmada depois do vencimento), sem ação e sem migração; tratamento e reembolso na AGT-013. Alternativas: marcar como tratada (exigiria migração); atalho para as alterações manuais.

Escolhas já adotadas no rascunho aprovado: escopo restrito; reaproveitamento de serviços e da área administrativa; autorização nos dois sentidos (visitante 401, passageiro 403; administrador recusado nas rotas do passageiro); nunca devolver hash de senha, tokens, sessões nem e-mails de recuperação.

## C. O que foi implementado e onde

- `server/admin/service.ts` (novo): consultas com filtros e paginação, detalhe, alteração manual em transação `BEGIN IMMEDIATE` e idempotente, pendências, lista e detalhe de passageiros, máscaras e auditoria da consulta.
- `server/admin/routes.ts` (novo): `GET /api/admin/reservas`, `GET /api/admin/reservas/:id`, `POST /api/admin/reservas/:id/situacao`, `GET /api/admin/pendencias`, `GET /api/admin/passageiros`, `GET /api/admin/passageiros/:id`; só administrador, verificado antes de ler o corpo.
- `src/admin/reservas-admin-api.ts` e `src/pages/AdminReservas.tsx` (novos): páginas `/admin/reservas`, `/admin/reservas/:id`, `/admin/pendencias`, `/admin/passageiros`, `/admin/passageiros/:id`.
- Alterados (só ligação): `server/app.ts`, `server/main.ts`, `src/App.tsx`, `src/Layout.tsx` (itens "Reservas" e "Passageiros" no menu do administrador) e `README.md`.
- Testes novos: `tests/admin-api.test.ts` (34) e `tests/web-admin-reservas.test.tsx` (21). Documento novo: `docs/administracao-reservas.md`.
- As leituras de administração efetivam antes o vencimento da segunda parcela e a conclusão automática; a alteração manual efetiva só o vencimento.

## D. Verificações (resultados reais)

- Verificação final (`npm run check`, 24/11/2026, 22:04:33 a 22:04:52): lint sem erros (max-warnings 0); 557 de 557 testes (30 arquivos); `tsc --noEmit` sem erros; `vite build` concluído. Refeita em 26/11/2026 (12:21 e no fechamento), com o mesmo resultado.
- Mutações: M1 cancelar sem verificar pagamento: 3 testes falharam; M2 CPF sem máscara na lista: 1; M3 consulta sem a auditoria correta: 1; M4 cancelamento sem cancelar a retenção: 1; M5 passageiro autorizado nas rotas de administração: 2. Todas detectadas e restauradas.
- Navegador real (Edge sem interface; dados fictícios; passageiras Ana e Beatriz; administradora fictícia): visitante (401) e passageira (403) barrados; administradora recusada nas rotas do passageiro; lista, filtros e busca por CPF sem mostrar CPF nem telefone; reserva paga e reserva com pendência sem opção de cancelar; pendências listadas sem ação; cancelamento exigindo justificativa, com retenção cancelada, vagas iguais antes e depois, auditoria do administrador com a justificativa e repetição sem nova auditoria; passageiros com CPF e telefone mascarados na lista (sem auditoria) e completos no detalhe (uma auditoria por abertura, estados nulos); conclusão antes do fim da excursão recusada (409) e, depois, concluída com auditoria do administrador, sem alterar vagas nem pagamentos; celular sem rolagem horizontal da página; nenhuma excursão acima da capacidade; sem dados sensíveis na auditoria; sem armazenamento local, console ou recurso externo.
- **Não exercitado no navegador:** a conclusão manual pela interface (chamada direta, com as datas da excursão alteradas no banco); a pendência real (inserida direto no banco para a demonstração; o caminho real é coberto pelos testes da AGT-009); cancelamento com retenção expirada; leitor de tela.

## E. Erros e dificuldades do agente, e correções

1. A conclusão manual nascia sem efeito, porque a leitura anterior efetivava a conclusão automática; detectado por teste; a alteração manual passou a efetivar só o vencimento antes de decidir.
2. O cliente enviava o parâmetro de página padrão e desalinhava os testes de interface; passou a omiti-lo.
3. Formato do telefone esperado no teste corrigido (o banco guarda normalizado); erros de lint nos testes e no serviço corrigidos.
4. Um comando de edição do agente corrompeu o documento novo `docs/administracao-reservas.md`; o arquivo foi apagado e reescrito antes de qualquer commit, e a checagem completa foi refeita.
5. Fora da execução, em 24/11/2026 (23:21 a 23:23), foram feitas no repositório alterações externas à sessão do agente (renomeação do ramo de `master` para `main`, inclusão de um remoto e um trecho em outra codificação no fim do `README.md`); com a autorização do pesquisador (26/11/2026), o trecho foi retirado; o ramo e o remoto foram mantidos; o agente não enviou nada ao GitHub.

## F. Limitações e pontos para revisão humana (RN-044)

Limitações: a conclusão manual é quase sempre redundante com a conclusão automática da AGT-011 (o botão só aparece se nenhuma leitura tiver concluído antes); sem tratamento de pendência nem reembolso (AGT-013); sem tarefa agendada (AGT-014); justificativa livre sem filtro de dados pessoais; leituras que gravam (vencimento, conclusão e auditoria da consulta ao passageiro); busca por CPF parcial (3 dígitos ou mais) pode revelar a existência de um CPF; no celular a tabela rola dentro do quadro; campos de seleção com estilo padrão do navegador; um navegador, sem leitor de tela; concorrência sem teste de carga.
Revisão aprovada pelos pesquisadores no fechamento: serviço e rotas de administração, dados pessoais no detalhe, leituras que gravam, busca por CPF parcial, justificativa livre, redundância da conclusão manual e a ligação em arquivos de atividades anteriores. A avaliação humana (Seção 11 do registro) foi redigida pelo agente a pedido dos pesquisadores; a classificação foi decidida por eles.

## G. Dados para quadros, contagens e referências cruzadas

- Experimento principal: 12 das 18 atividades concluídas e classificadas (n = 12), todas AP-3; AGT-013 a AGT-018 ainda não iniciadas. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-012 | AP-3 | 1 | 557 (55 novos) | Sim (decisão sobre dados pessoais, situação de reserva e pendências) | 482f981. Data da fonte do quadro: 26/11/2026.
- Intervenção humana (tipo, para o texto): decisão sobre dados pessoais, situação de reserva e pendências (três decisões previstas na instrução).
- Duração: 15,53 min de relógio (21:49:20 a 22:04:52 de 24/11/2026).
- Esquema do banco: a AGT-012 não criou migração; seguem as versões 1, 2 (AGT-009) e 3 (AGT-010).
- Próximas atividades: a partir da AGT-013 (cancelamentos e reembolsos), seguida de processos automáticos (AGT-014), comunicação (AGT-015), painel administrativo (AGT-016), testes integrados (AGT-017) e revisão técnica (AGT-018).
- Apêndice D: AGT-012 (principal, AP-3): RF-037, RF-038 e RF-039 com evidência; RF-026 em parte; RN-034 e RN-035 com evidência. Pastas server/admin e src; documento docs/administracao-reservas.md; 557 testes; commit 482f981.
- Linha das métricas: AGT-012,Claude Code (Claude Sonnet 5.5),Administracao / Reservas e passageiros,15.53,1,557,557,0,conclusao manual sem efeito por causa da conclusao automatica anterior (detectado pelo teste e ajustado; redundancia registrada); parametro de pagina padrao desalinhava testes de interface; formato do telefone esperado no teste; erros de lint nos testes; sed corrompeu documento novo (apagado e reescrito antes do commit) (duracao inclui documentacao mutacoes e percurso no navegador; espera pelas decisoes nao contada),Nao,Sim,Decisao sobre dados pessoais situacao de reserva e pendencias (3 paradas previstas),AP-3,482f981

## H. Ficha AGT-012 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-012 — Administração de reservas e passageiros
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Implementar a consulta de reservas e de passageiros pelo administrador e a alteração manual de situação, quando autorizada, sempre registrada na auditoria, com a consulta das pendências administrativas.
- **Requisitos relacionados:** RF-037, RF-038 e RF-039; RF-026 (em parte); RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-034, RN-035, RN-023 a RN-026, RN-009, RN-010, RN-014, RN-015, RN-019 a RN-022, RN-032 e RN-040 a RN-044.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-012.md (escrita pelo agente e aprovada pelo pesquisador em 24/11/2026 às 21:47:37; usada sem alterações).
- **Critérios de aceitação:** 25 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código.
- **Testes:** 557 testes em 30 arquivos, todos aprovados, 0 reprovados (55 novos: 34 de API e 21 de interface). Cinco mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 15,53 min em relógio (decisões respondidas e início da implementação às 21:49:20 e verificação final às 22:04:52, de 24/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões e pela classificação não é contada. Exclui a revisão humana.
- **Pausas ou interrupções:** Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação; a classificação foi dada em 26/11/2026.
- **Intervenção humana:** Sim: decisão sobre dados pessoais, situação de reserva e pendências financeiras (dados pessoais visíveis ao administrador; alterações manuais autorizadas; pendências administrativas).
- **Decisão técnica:** Lista de passageiros com CPF e telefone mascarados e dados completos só no detalhe, com auditoria de cada consulta; alterações manuais só sem efeito financeiro (cancelar reserva aguardando sem pagamento; concluir reserva pronta de excursão terminada), com justificativa obrigatória, transação única, idempotência e auditoria com o administrador; pendências apenas para consulta. Sem migração e sem dependência nova.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
- **Commits:** 482f981 (atividade e registro).
- **Evidências:** Registro (Seções 6 a 10); diário (Entradas 96 a 100); METRICAS.csv; server/admin/, src/pages/AdminReservas.tsx, src/admin/reservas-admin-api.ts, tests/ e docs/administracao-reservas.md.
- **Classificação final:** AP-3 (decisão do pesquisador, 26/11/2026; critério único: decisão exigida pela instrução = AP-3).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado).
- **Limitações:** Conclusão manual quase sempre redundante com a conclusão automática; sem tratamento de pendência nem reembolso (AGT-013); sem tarefa agendada (AGT-014); justificativa livre sem filtro de dados pessoais; leituras que gravam (vencimento, conclusão e auditoria da consulta); busca por CPF parcial; pendência e datas ajustadas no banco para a demonstração em navegador; tabela com rolagem dentro do quadro no celular; um navegador, sem leitor de tela; concorrência sem teste de carga. A avaliação humana foi redigida pelo agente a pedido do pesquisador.

## I. Registro completo da atividade (cópia literal)

## 1. Identificação

ID da atividade: AGT-012

Título: Administração de reservas e passageiros

Categoria: Administração / Reservas e passageiros (servidor e interface)

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330, de 21/11/2026, está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 24/11/2026

Requisitos relacionados:
- RF-037 — Administração de reservas
- RF-038 — Consulta de passageiros
- RF-039 — Alteração manual de situação, quando autorizada
- RF-026 — Registro de confirmação financeira após expiração da retenção, para tratamento administrativo (parte desta atividade; o tratamento e o reembolso são da AGT-013)
- RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027, RNF-028 e RNF-029

Regras de negócio relacionadas: RN-034, RN-035, RN-023, RN-024, RN-025, RN-026, RN-009, RN-010, RN-014, RN-015, RN-019, RN-020, RN-021, RN-022, RN-032, RN-040, RN-041 a RN-044.
Sem RN marcada "[confirmar]" nesta atividade.

## 2. Objetivo

Implementar a administração de reservas e passageiros: a consulta de reservas pelo administrador (RF-037, RN-034), a consulta de passageiros (RF-038, RN-034)
e a alteração manual de situação, quando autorizada (RF-039, RN-035), sempre registrada na auditoria. O administrador autenticado lista e filtra reservas,
abre o detalhe de uma reserva com pagamentos, parcelas, retenção e histórico de auditoria, lista e busca passageiros e vê as reservas de cada um,
enxerga as pendências administrativas e executa as alterações manuais de situação que o pesquisador autorizar, com justificativa obrigatória.

## 3. Resultado esperado

Ao final, o administrador deve ter páginas de administração de reservas e de passageiros; só o administrador as acessa (visitante 401, passageiro 403) e
ele continua recusado nas rotas do passageiro; as respostas não trazem hash de senha, tokens nem sessões; as alterações manuais autorizadas mantêm
coerentes a situação, a retenção, a vaga ocupada e os pagamentos, são idempotentes e auditadas com o administrador, a justificativa e os estados; as
transições não autorizadas são recusadas. Testes automatizados devem cobrir o servidor e a interface.

Não deverão ser implementados: cancelamento com reembolso ou estorno, a rotina agendada completa, comunicação, painel administrativo consolidado nem
mudança nas regras de negócio.

## 4. Critérios de aceitação

- [x] Decisões do pesquisador (dados pessoais visíveis; alterações manuais autorizadas; pendências administrativas) tomadas e registradas com justificativa.
- [x] Só o perfil administrador acessa as rotas de administração: visitante recebe 401 e passageiro 403, verificado no servidor a cada requisição e antes de ler o corpo (RNF-002, RN-044); o administrador continua recusado nas rotas do passageiro.
- [x] O administrador vem da sessão; o corpo e a URL não o escolhem.
- [x] A lista de reservas é limitada ou paginada, com filtros (excursão, situação, modalidade e busca por passageiro) e ordenação previsível (RF-037, RN-034).
- [x] O detalhe da reserva mostra passageiro, excursão, modalidade, situação, valores, parcelas, pagamentos de cada parcela, retenção, pendências administrativas e o histórico de auditoria da reserva, sem dados de cartão.
- [x] A lista de passageiros é limitada ou paginada, com busca (nome, e-mail, CPF) e o detalhe de cada passageiro com as suas reservas, só com passageiros (RF-038, RN-034).
- [x] Os dados pessoais exibidos e a auditoria da consulta seguem a decisão 1; nunca se devolve hash de senha, token, sessão nem conteúdo de e-mail de recuperação (RN-041, RN-042).
- [x] As pendências administrativas aparecem para o administrador conforme a decisão 3, sem criar reembolso ou estorno (RF-026).
- [x] As alterações manuais de situação seguem a decisão 2: só as transições autorizadas, com justificativa obrigatória validada (RF-039, RN-035); a transição não autorizada responde 409 com código claro.
- [x] Cada alteração manual ocorre em transação BEGIN IMMEDIATE e mantém coerentes a situação, a retenção, a vaga ocupada e os pagamentos, sem deixar vagas_ocupadas negativa ou acima da capacidade (RN-021, RN-040).
- [x] Um defeito no meio de uma alteração manual desfaz tudo (atomicidade), coberto por teste com falha injetada.
- [x] A alteração manual é idempotente e segura sob concorrência: repetida ou simultânea não repete o efeito, coberto por teste com duas conexões.
- [x] A auditoria registra o administrador como ator, o estado anterior, o novo estado e a justificativa, sem dados sensíveis (RN-035, RN-041, RN-042), e registra a consulta a dados pessoais conforme a decisão 1.
- [x] Respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010); o corpo nunca escolhe campos fora do permitido.
- [x] Páginas de administração de reservas e de passageiros, com entrada no menu do administrador, estados de carregamento, vazio e erro, filtros, detalhe e confirmação antes de alterar situação.
- [x] Visitante e passageiro veem acesso restrito nas páginas de administração, sem consultar a API de administração.
- [x] Interface responsiva, acessível e sem recursos externos.
- [x] Testes automatizados do servidor (autorização nos dois sentidos, filtros, paginação, privacidade, transições autorizadas e recusadas, justificativa, atomicidade, idempotência, concorrência e auditoria) e da interface.
- [x] Lint, verificação de tipos, testes e build aprovados.
- [x] Percurso em execução real (API e navegador) com dados fictícios, relatado com o que foi e o que não foi exercitado.
- [x] Confirmado no banco que cada alteração manual deixou situação, retenção, vagas_ocupadas e pagamentos coerentes, que vagas_ocupadas nunca passou da capacidade nem ficou negativa, e que auditoria e logs não têm dados sensíveis.
- [x] Documentação atualizada, sem credenciais reais; apenas dados fictícios.
- [x] Nenhuma funcionalidade fora do escopo implementada; o esquema só muda por migração nova, pequena e justificada, se necessário.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

## 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-012 — Administração de reservas e passageiros.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. A AGT-001 criou a fundação técnica, a AGT-002 o modelo de dados e a persistência (SQLite por meio de node:sqlite, SQL direto, migrações versionadas, transações e auditoria), a AGT-003 o cadastro, a autenticação e o controle de acesso (perfis passageiro e administrador), a AGT-004 a estrutura pública, a AGT-005 o gerenciamento administrativo de excursões (rotas /api/admin/excursoes e página /admin/excursoes, só para o administrador), a AGT-006 a consulta pública, a AGT-007 a solicitação de reserva e o checkout, a AGT-008 a retenção temporária de vaga e o mecanismo de ocupar e liberar vaga, a AGT-009 o pagamento integral com provedor simulado, a AGT-010 o pagamento em duas parcelas e o vencimento da segunda (reserva cancelada por inadimplência, reserva.motivo_cancelamento, migração 3) e a AGT-011 a área do passageiro e a conclusão automática da reserva (server/vagas/conclusao.ts). Hoje o administrador gerencia excursões, mas não enxerga reservas, pagamentos nem passageiros; o pagamento confirmado sem vaga (pagamento.pendencia_administrativa = 'confirmacao_sem_vaga') só fica sinalizado. Leia o CLAUDE.md, a especificação em docs/especificacao/ e os documentos docs/banco-de-dados.md, docs/reservas.md e docs/excursoes-admin.md antes de começar.

OBJETIVO DA ATIVIDADE

Implementar a administração de reservas e passageiros: a consulta de reservas pelo administrador (RF-037, RN-034), a consulta de passageiros (RF-038, RN-034) e a alteração manual de situação, quando autorizada (RF-039, RN-035), sempre registrada na auditoria. Concretamente: o administrador autenticado lista e filtra reservas (por excursão, situação, modalidade e passageiro), abre o detalhe de uma reserva com seus pagamentos, parcelas, retenção e histórico de auditoria, lista e busca passageiros e vê as reservas de cada um, enxerga as pendências administrativas (por exemplo, pagamento confirmado sem vaga) e executa as alterações manuais de situação que a decisão 2 autorizar, com justificativa obrigatória e auditoria com o administrador como ator.

Reaproveite o que existe (serviço e DTO de reservas, auditoria, autorização por perfil, página e rotas de administração de excursões, rótulos e formatação das AGT-005 a AGT-011) sem duplicar lógica. Nesta atividade, não implemente cancelamento com reembolso ou estorno (AGT-013), a rotina agendada completa de processos automáticos (AGT-014), comunicação por e-mail ou WhatsApp (AGT-015), painel administrativo consolidado e relatórios (AGT-016) nem qualquer mudança nas regras de negócio.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- RN-034: o administrador consulta passageiros e reservas. RN-035: alterações manuais de situação só ocorrem quando autorizadas e ficam registradas na auditoria.
- RN-023 e RN-024: as situações da reserva são Aguardando pagamento, Pronto para embarque, Concluída e Cancelada; a reserva integralmente paga ou com a segunda parcela quitada fica "Pronto para embarque". RN-025 e RN-026: a conclusão e a permanência no histórico (AGT-011).
- RN-009, RN-010, RN-014, RN-015, RN-019 a RN-022, RN-032 e RN-040 continuam valendo: reserva ativa única por passageiro e excursão, retenção, vencimento da segunda parcela, ocupação de vaga sem exceder a capacidade, confirmação sem vaga e proteção sob concorrência.
- RN-041 e RN-042: auditoria sem dados sensíveis (sem senha, hash, token nem dados de pagamento além do necessário). RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em autenticação, dados pessoais, pagamentos, vagas e cancelamentos exigem revisão humana.
- RNF-002: proteção de rotas administrativas.

REQUISITOS DESTA ATIVIDADE

- rotas da API restritas ao perfil administrador, com a autorização verificada no servidor a cada requisição e antes de ler o corpo (reutilize authorize): visitante recebe 401 e passageiro 403; o administrador vem da sessão, nunca do corpo; nenhuma rota de administração fica acessível ao passageiro, e as rotas do passageiro (AGT-007 a AGT-011) continuam recusando o administrador;
- consulta de reservas (RF-037): lista paginada ou limitada, com filtros (excursão, situação, modalidade, busca por passageiro) e ordenação previsível; detalhe com passageiro, excursão, modalidade, situação, valores, parcelas e pagamentos de cada parcela, retenção, pendências administrativas e o histórico de auditoria da reserva;
- consulta de passageiros (RF-038): lista paginada ou limitada, com busca (nome, e-mail, CPF) e o detalhe de cada passageiro com as suas reservas; apenas passageiros (o administrador não aparece como passageiro); os dados pessoais exibidos e a auditoria da consulta seguem a decisão 1; nunca devolver hash de senha, tokens, sessões nem o conteúdo de e-mails de recuperação;
- pendências administrativas: o administrador vê, em lugar claro, os pagamentos confirmados sem vaga e os demais casos que dependem dele, conforme a decisão 3, sem criar reembolso ou estorno (AGT-013);
- alteração manual de situação (RF-039, RN-035), conforme a decisão 2: somente as transições autorizadas, com justificativa obrigatória (texto livre curto, validado), em uma transação BEGIN IMMEDIATE que mantém coerentes a situação, a retenção, a vaga ocupada e os pagamentos, nunca deixa vagas_ocupadas negativa ou acima da capacidade, é idempotente (repetir não repete o efeito) e grava auditoria com o administrador como ator, o estado anterior, o novo estado e a justificativa; transição não autorizada responde 409 com código claro, e o corpo nunca escolhe campos fora do permitido;
- na interface: páginas de administração de reservas e de passageiros, com entrada no menu do administrador, estados de carregamento, vazio e erro, filtros, detalhe, confirmação antes de alterar situação, mensagens claras, layout responsivo, acessibilidade básica e nenhum recurso externo; visitante e passageiro veem acesso restrito, sem consultar a API de administração;
- auditoria de toda alteração manual e de cada consulta a dados pessoais de passageiro, conforme a decisão 1, sem dados sensíveis; respostas de erro padronizadas por campo, sem vazar detalhes internos (RNF-010);
- testes automatizados do servidor (autorização por perfil nos dois sentidos, filtros, paginação, privacidade da resposta, cada transição autorizada e cada recusada, justificativa obrigatória, atomicidade com falha injetada, idempotência, concorrência entre duas conexões, auditoria) e da interface;
- atualização do README e da documentação (docs/reservas.md ou novo documento de administração, e docs/banco-de-dados.md se houver mudança de dados). Se for necessária migração, que seja nova, pequena e justificada, sem alterar as migrações já aplicadas.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem dados pessoais, situação de reserva, vagas e dinheiro. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria; a especificação diz que alterações manuais só ocorrem "quando autorizadas" (RN-035), mas não diz quais, nem define o que o administrador vê de dados pessoais.

1. Dados pessoais do passageiro visíveis ao administrador (RF-038, RN-034, RN-044). Apresente: mostrar nome e e-mail por inteiro e mascarar CPF e telefone na lista, com os dados completos só no detalhe do passageiro e auditoria de cada consulta ao detalhe; mostrar todos os dados por inteiro em qualquer tela, com ou sem auditoria da consulta; ou mostrar só o mínimo (nome e e-mail) sem CPF e telefone. Inclua o efeito sobre a busca por CPF, sobre a auditoria (quem consultou quem e quando, sem gravar o dado consultado) e sobre a privacidade na tela.
2. Alterações manuais de situação autorizadas (RF-039, RN-035). Apresente quais transições o administrador pode fazer e quais ficam fora: por exemplo, nenhuma com efeito financeiro (apenas cancelar manualmente uma reserva em Aguardando pagamento sem pagamento confirmado, liberando a retenção, e marcar Concluída uma reserva Pronta para embarque cuja excursão terminou); ou um conjunto maior, incluindo cancelar reserva com pagamento confirmado (o que depende do reembolso da AGT-013); ou nenhuma por enquanto, deixando RF-039 só com a estrutura. Inclua o efeito de cada transição sobre a retenção, a vaga ocupada, os pagamentos, a reserva ativa única por passageiro e excursão e o limite de 3 reservas pendentes, a justificativa obrigatória e o que a auditoria grava.
3. Pendências administrativas e pagamentos (RF-026, RN-022). Apresente como o administrador vê e acompanha o pagamento confirmado sem vaga e a segunda parcela confirmada depois do vencimento: apenas listar e filtrar as pendências, sem ação (o tratamento e o reembolso ficam para a AGT-013); listar e permitir marcar a pendência como tratada, registrando quem, quando e a observação (exige coluna nova por migração pequena); ou listar com um atalho para as alterações da decisão 2. Inclua o que a tela mostra de cada pagamento (parcela, valor, situação, data) sem dados de cartão, e como isso se relaciona com a AGT-013.

RESTRIÇÕES

1. Não implemente funcionalidades fora do escopo.
2. Não altere os requisitos ou regras de negócio definidos pelo projeto; dúvidas ou conflitos na especificação são para o pesquisador (CLAUDE.md, regra 2).
3. Não inclua credenciais, tokens, senhas, números de cartão ou outros dados sensíveis no repositório, nos logs ou na auditoria. Use somente dados fictícios.
4. Não reutilize código funcional de projetos anteriores nem consulte o repositório do estudo piloto.
5. Não altere ou remova os arquivos existentes dentro das pastas TCC e docs/especificacao, exceto para preencher os campos de execução deste registro.
6. Não modifique os registros experimentais existentes.
7. Caso exista uma decisão relevante que não possa ser tomada tecnicamente sem alterar significativamente arquitetura, dependências, segurança, custos, integrações externas, regras de negócio ou escopo do produto, interrompa e apresente a decisão ao pesquisador.
8. Você pode tomar decisões técnicas de baixo impacto necessárias, desde que as documente no relatório final, com o motivo e a versão exata de cada dependência adicionada.
9. Não realize commit Git. O commit será realizado somente após revisão humana.
10. Alterações críticas em autenticação, dados pessoais, pagamentos, vagas e cancelamentos exigem revisão humana (RN-044): descreva no relatório cada rota que expõe dados pessoais, cada ponto em que o código muda a situação de uma reserva, uma retenção, uma vaga ou um pagamento, cada mudança em código de outra atividade e cada migração, se houver.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- coloque API e front-end em execução juntos, com dados fictícios (administrador pelo comando local, excursões pelo script de demonstração, passageiros pelo cadastro) e percorra no navegador: a lista e os filtros de reservas, o detalhe com pagamentos e auditoria, a lista e a busca de passageiros, a pendência de pagamento confirmado sem vaga, cada alteração manual autorizada e a recusa de uma não autorizada, a confirmação antes de alterar, o visitante e o passageiro barrados e o administrador barrado nas rotas do passageiro, e a largura de celular;
- confirme, no banco, que cada alteração manual deixou situação, retenção, vagas_ocupadas e pagamentos coerentes, que vagas_ocupadas nunca passou da capacidade nem ficou negativa, que a auditoria registra o administrador, a justificativa e os estados, e que auditoria e logs não têm dados sensíveis;
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
11. limitações ou pendências identificadas, inclusive de privacidade, de situação da reserva, de vagas, de concorrência e de acessibilidade;
12. qualquer ponto que considere necessário para revisão humana.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-012.

## 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-24T21:47:37-03:00. Início da execução: 2026-11-24T21:47:37-03:00.

Parada obrigatória: o agente apresentou, antes de criar arquivos, as opções das três decisões da Seção 5 (com vantagens, desvantagens e recomendação). O pesquisador respondeu em 2026-11-24T21:49:20-03:00, pela opção recomendada de cada item ("recomendadas"):
(1) dados pessoais: a lista de passageiros mostra nome e e-mail inteiros e CPF e telefone mascarados; os dados completos aparecem só no detalhe do passageiro, e cada consulta ao detalhe é auditada (quem consultou quem e quando, sem gravar o dado consultado); a busca por CPF aceita o número completo;
(2) alterações manuais de situação autorizadas: somente transições sem efeito financeiro, com justificativa obrigatória e auditoria com o administrador como ator: cancelar uma reserva em Aguardando pagamento sem pagamento confirmado (libera a retenção) e marcar como Concluída uma reserva Pronta para embarque cuja excursão terminou; cancelar reserva com pagamento confirmado fica para a AGT-013;
(3) pendências administrativas: apenas listar e filtrar (pagamento confirmado sem vaga e segunda parcela confirmada depois do vencimento), sem ação e sem migração; o tratamento e o reembolso ficam para a AGT-013; a tela mostra de cada pagamento a parcela, o valor, a situação e a data, sem dados de cartão.
Início da implementação: 2026-11-24T21:49:20-03:00.
Fim da implementação e da última verificação (npm run check): 2026-11-24T22:04:52-03:00 (relógio do sistema). Não houve pausa nem interrupção da sessão durante a implementação.

## 7. Alterações realizadas pelo agente

Arquivos novos:
- server/admin/service.ts: AdminService (consulta de reservas com filtros e paginação, detalhe com pagamentos, retenções e auditoria, alteração manual de situação, pendências, lista e detalhe de passageiros, máscaras de CPF e telefone; auditoria da consulta ao detalhe do passageiro).
- server/admin/routes.ts: rotas /api/admin/reservas, /api/admin/reservas/:id, /api/admin/reservas/:id/situacao, /api/admin/pendencias, /api/admin/passageiros e /api/admin/passageiros/:id, só para o perfil administrador.
- src/admin/reservas-admin-api.ts (cliente e rótulos) e src/pages/AdminReservas.tsx (páginas de reservas, detalhe, pendências, passageiros e detalhe do passageiro).
- tests/admin-api.test.ts (34 testes) e tests/web-admin-reservas.test.tsx (21 testes).
- docs/administracao-reservas.md e TCC/registros-agente/AGT-012.md.

Arquivos alterados (código de atividades anteriores, por necessidade desta):
- server/app.ts e server/main.ts (ligação do serviço e das rotas de administração), src/App.tsx (rotas /admin/reservas, /admin/reservas/:id, /admin/passageiros, /admin/passageiros/:id e /admin/pendencias) e src/Layout.tsx (itens "Reservas" e "Passageiros" no menu do administrador).
- README.md e TCC/registros-agente/DIARIO-PASSO-A-PASSO.md.
Sem alteração em server/reservas/, server/pagamentos/, server/vagas/ nem nos testes de atividades anteriores (a AGT-012 reaproveita calcularParcelas, vencerSegundasParcelas e concluirReservas sem modificá-los).

Sem migração (nenhuma coluna nova) e sem dependência nova. Não alterados: docs/especificacao/ (inclusive as regras de negócio), CLAUDE.md, .env.

## 8. Comandos e testes

Verificação final (npm run check), de 2026-11-24T22:04:33-03:00 a 2026-11-24T22:04:52-03:00: lint sem erros (max-warnings 0); testes 557 aprovados de 557 (30 arquivos); tsc --noEmit sem erros; vite build concluído.

Testes novos: tests/admin-api.test.ts (34): 401 e 403 em todas as rotas de administração, 403 antes de ler o corpo e administrador recusado nas rotas do passageiro; 405 e 503; lista vazia, conteúdo do item sem CPF, telefone nem campos internos, ordenação, paginação, filtros (excursão, situação, modalidade e busca por nome, e-mail e CPF) e 400 por campo; leitura que efetiva a conclusão; detalhe com pagamentos, retenções, alterações permitidas e auditoria; lista de passageiros com máscaras, só passageiros e sem auditoria; busca e paginação; detalhe com dados completos e auditoria de cada consulta sem gravar o dado; administrador e inexistente 404; pendências (os dois tipos, filtro, sem rota de ação); alteração manual: cancelamento com liberação da retenção e sem efeito em vagas, reserva sem checkout e com pagamento recusado, justificativa obrigatória e validada, campos fora do permitido, destinos inválidos, recusa com pagamento pendente, confirmado e primeira parcela confirmada, idempotência, conclusão só depois do fim da excursão (409 antes), conclusão idempotente depois da automática, transições recusadas por situação, alterações permitidas no detalhe, atomicidade com falha injetada por gatilho no banco, pedidos simultâneos e duas conexões ao mesmo arquivo (um único efeito e uma única auditoria; pagamento criado por outra conexão impede o cancelamento). tests/web-admin-reservas.test.tsx (21): menu só do administrador; acesso restrito nas cinco páginas sem consultar a API; lista, filtros, limpar, paginação, vazio, erro e rede; detalhe, cancelamento com justificativa e confirmação, justificativa vazia, recusa por pagamento, voltar, reserva com pagamento e pendência, marcar como concluída, 404, erro e rede; pendências e filtro; passageiros (máscaras, busca, detalhe com dados completos e aviso de auditoria, 404, vazio e erro). Os testes de interface e de API foram repetidos 6 vezes sem falha intermitente.

Verificações de mutação (código alterado de propósito, testes devem falhar, arquivo restaurado e conferido por diff):
- M1, cancelar sem verificar pagamento pendente ou confirmado: 3 testes falharam.
- M2, CPF sem máscara na lista de passageiros: 1 falhou.
- M3, consulta ao detalhe do passageiro sem a auditoria correta: 1 falhou.
- M4, cancelamento que não cancela a retenção: 1 falhou.
- M5, rotas de administração autorizadas também para o passageiro: 2 falharam.
Todas detectadas; nenhuma mutação permaneceu no código.

Execução em navegador real (Edge sem interface, via protocolo de depuração; API e Vite locais; banco de demonstração; passageiras fictícias Ana e Beatriz; administradora fictícia; excursões Serra, Cachoeira e Praia), concluída sem erro de script:
- Acesso: o visitante vê o convite ao login e recebe 401; a passageira vê "Acesso restrito a administradores." e recebe 403 na API; o menu dela não tem Reservas nem Passageiros; a administradora recebe 403 nas rotas do passageiro e vê acesso restrito em /reservas; o menu dela tem Reservas e Passageiros.
- Lista de reservas: 3 reservas com passageiro, excursão, situação, total e pendência; filtro por situação, por nome e forma de pagamento e busca pelo CPF completo da Ana funcionaram; a lista não mostrou CPF nem telefone.
- Detalhe: a reserva paga (Pronto para embarque) não oferece cancelar; a reserva com pendência mostra o aviso, "Pago (sem vaga)" e não oferece cancelar; as pendências foram listadas sem ação.
- Cancelamento manual: o botão "Cancelar reserva" abre o formulário; confirmar sem justificativa mostra "Informe a justificativa."; com justificativa, a reserva ficou Cancelada. No banco: reserva cancelada, retenção cancelada, vagas ocupadas da excursão iguais antes e depois (18 e 18), auditoria reserva.cancelamento_manual e retencao.cancelada com o administrador (ator 1) e a justificativa gravada, sem dados pessoais; repetir o cancelamento respondeu 200 sem nova auditoria (1 registro); cancelar a reserva paga respondeu 409 transicao_nao_autorizada e a reserva com pagamento confirmado 409 reserva_com_pagamento.
- Passageiros: a lista mostrou CPF e telefone mascarados e não os completos; a busca pelo CPF completo da Beatriz funcionou; a lista não auditou consulta (0 antes e 0 depois); o detalhe da Ana mostrou CPF, telefone e data de nascimento completos com o aviso de auditoria, e o banco registrou passageiro.consultado (ator 1, registro da Ana, estados nulos) a cada abertura; o administrador como passageiro respondeu 404.
- Conclusão manual: antes do fim da excursão respondeu 409 excursao_nao_terminou; depois de alterar as datas da excursão no banco (só para a demonstração), a chamada direta concluiu a reserva com auditoria reserva.conclusao_manual (ator 1), sem alterar vagas (12) nem pagamentos.
- Celular (390 px): lista e detalhe sem rolagem horizontal da página; a tabela da lista rola dentro do quadro.
- Banco final: reservas 1 concluída, 2 cancelada e 3 aguardando pagamento; nenhuma excursão acima da capacidade; auditoria e pagamento sem dados sensíveis; sem armazenamento local, sem cookie legível, sem mensagens de console e único host 127.0.0.1:5173.
Capturas de tela (fora do repositório, na pasta temporária da sessão): admin-lista, admin-detalhe-paga, admin-pendencias, admin-cancelar-form, admin-detalhe-cancelada, admin-passageiros, admin-passageiro-detalhe, admin-celular-lista e admin-celular-detalhe.

Não exercitado no navegador: a conclusão manual pela interface (o botão "Marcar como concluída" só aparece se nenhuma leitura tiver efetivado a conclusão automática; foi exercida por chamada direta e por testes de interface); a pendência real de pagamento confirmado sem vaga (inserida diretamente no banco para a demonstração; o caminho real é o da AGT-009, coberto pelos testes dela); o cancelamento da reserva com retenção expirada; leitor de tela.

## 9. Erros e dificuldades

1. A conclusão manual ficaria sempre sem efeito: a leitura e a alteração efetivavam antes a conclusão automática (ator nulo), e a conclusão pedida pelo administrador virava uma repetição idempotente. Detectado pelo teste; a alteração manual passou a efetivar só o vencimento antes de decidir. Mesmo assim, como as leituras de administração efetivam a conclusão automática, o botão "Marcar como concluída" quase nunca aparece na interface (limitação 1 do documento e ponto de revisão humana: a decisão 2 pediu a transição, e a decisão 1 da AGT-011 a torna redundante na prática).
2. O cliente enviava "?pagina=1" mesmo na primeira página, o que não casava com as chaves dos testes de interface; passou a omitir o parâmetro padrão.
3. O telefone é guardado normalizado (+55...), e o teste esperava o formato digitado: corrigido no teste.
4. Erros de lint dos testes do próprio agente (valores any dos comparadores do Vitest e asserções de tipo desnecessárias) e do serviço (asserções de tipo): corrigidos.
5. Erro do agente: um comando sed corrompeu docs/administracao-reservas.md (inseriu um caractere entre todos os caracteres); o arquivo foi apagado e reescrito do zero antes de qualquer commit, e os testes e o build foram refeitos depois. A causa foi usar sed com uma barra invertida que o shell interpretou como alternância vazia.
6. Um script de edição do agente perdeu de novo uma barra invertida em uma expressão regular nas atividades anteriores; nesta atividade as regexes foram escritas sem barra invertida, usando [0-9].
7. Versão da ferramenta: a extensão 2.1.331 (instalada em 24/11/2026 às 17:12) é a mais recente na pasta de extensões e a 2.1.330 está obsoleta; não foi possível confirmar qual executou esta atividade (Seção 1).

## 10. Relatório do agente

1. Resumo: administração de reservas e passageiros. O administrador lista e filtra reservas, abre o detalhe (pagamentos, retenções, pendências, auditoria), lista e busca passageiros, vê as pendências administrativas e executa duas alterações manuais de situação (cancelar reserva sem pagamento e marcar concluída a reserva pronta cuja excursão terminou), sempre com justificativa e auditoria com o administrador como ator.
2. Decisões do pesquisador (24/11/2026 às 21:49:20): as três recomendadas, conforme a Seção 6 (dados pessoais mascarados na lista e completos no detalhe com consulta auditada; só transições sem efeito financeiro; pendências só para consulta).
3. Segurança: rotas só para o administrador, verificadas antes de ler o corpo (visitante 401, passageiro 403); o administrador continua recusado nas rotas do passageiro; respostas sem hash de senha, token, sessão nem conteúdo de e-mail de recuperação; auditoria sem dados pessoais (verificado em teste e no navegador).
4. Alteração manual: transação BEGIN IMMEDIATE; coerente com situação, retenção, vagas e pagamentos; idempotente; atomicidade comprovada com falha injetada; duas conexões ao mesmo arquivo; recusa com 409 de código claro nas transições não autorizadas.
5. Testes e verificações: Seção 8 (557 de 557; lint, tipos e build sem erro; 5 mutações detectadas; execução em navegador com as ressalvas).
6. Critérios de aceitação: a marcação e a avaliação ficam para o fechamento, após a classificação pelos pesquisadores.
7. Limitações: a conclusão manual quase sempre fica redundante com a conclusão automática (a leitura a efetiva antes); sem tratamento de pendência nem reembolso (AGT-013); sem tarefa agendada (AGT-014); justificativa livre sem filtro de dados pessoais; abrir o detalhe de um passageiro grava a auditoria e qualquer leitura de administração efetiva vencimento e conclusão; busca por CPF parcial; no celular a tabela rola dentro do quadro e os campos de seleção usam o estilo padrão do navegador; um navegador, sem leitor de tela; a pendência do navegador foi inserida no banco para a demonstração.
8. Pontos para revisão humana (RN-044, por envolver dados pessoais, situação de reserva e vagas): server/admin/service.ts (a escrita nova: situação da reserva, retenção e auditoria; a leitura de dados pessoais); as rotas que expõem CPF, telefone e data de nascimento (detalhe do passageiro) e a auditoria de cada consulta; que leituras gravem (vencimento, conclusão e auditoria da consulta); a redundância entre a conclusão manual e a automática; a busca por CPF parcial; a justificativa livre; as mudanças em server/app.ts, server/main.ts, src/App.tsx e src/Layout.tsx.
9. Dados e segurança: dados fictícios; nenhum .env, senha ou token lido; nenhuma dependência nova; nenhuma migração.
10. Não classificado: a classificação (AP-1, AP-2, AP-3 ou RP) é exclusiva dos pesquisadores.
11. Pendência de registro: versão da ferramenta (Seção 1).
12. Controle de versão: nenhum commit feito até aqui; aguarda a classificação.

## 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador (2026-11-26T12:23:22-03:00), com base nos registros e nas execuções.** O pesquisador respondeu "ap 3 sim", lido pelo agente como a classificação AP-3 e a autorização para retirar o trecho corrompido do README.md; vale a autorização permanente que ele deu em 19/11/2026 para o fechamento padrão de cada atividade (critérios, revisão do código, commit e transcrição no Google Docs). As marcações abaixo refletem as evidências.

Atendeu ao objetivo: Proposta: sim. O administrador consulta e filtra reservas, abre o detalhe com pagamentos, retenções, pendências e auditoria, consulta e busca passageiros, vê as pendências administrativas e executa as duas alterações manuais autorizadas (cancelar reserva sem pagamento e marcar concluída a reserva pronta cuja excursão terminou), com justificativa e auditoria.

Atendeu aos critérios de aceitação: Proposta: sim para os 25 critérios da Seção 4, todos marcados. Evidências: 557 testes aprovados em 30 arquivos (34 de API e 21 de interface novos); lint, tipos e build sem erros; cinco mutações de verificação (todas detectadas e restauradas); percurso em navegador real (Microsoft Edge sem cabeça) com duas passageiras e uma administradora. Ressalvas: (1) a pendência do percurso foi inserida diretamente no banco para a demonstração; (2) a conclusão manual foi demonstrada por chamada direta, com as datas da excursão alteradas no banco, porque o botão só aparece se nenhuma leitura tiver efetivado antes a conclusão automática; (3) sem leitor de tela.

Atendeu às regras de negócio: Proposta: sim para RN-034 e RN-035, com RN-009, RN-014, RN-015, RN-021 a RN-026, RN-032 e RN-040 preservadas. O tratamento das pendências e o reembolso são da AGT-013. Nenhuma regra foi alterada. Observação: a transição manual para Concluída (decisão 2) é quase sempre redundante com a conclusão automática (decisão 1 da AGT-011).

Comportamento esperado confirmado: Proposta: sim, no percurso em navegador real e nos testes, com as ressalvas acima.

Testes considerados suficientes: Proposta: suficientes para autorização nos dois sentidos, privacidade, filtros, transições autorizadas e recusadas, justificativa, atomicidade com falha injetada, idempotência e duas conexões; sem teste de carga.

Problemas não identificados pelo agente: Proposta: nenhum identificado; os erros do próprio agente estão na Seção 9.

Revisão do código: aprovada pelo pesquisador em 2026-11-26T12:23:22-03:00, incluindo server/admin/service.ts e routes.ts (a escrita de situação, retenção e auditoria e a leitura de dados pessoais), o detalhe do passageiro com auditoria de cada consulta, as leituras que gravam, a busca por CPF parcial, a justificativa livre, a redundância da conclusão manual e as mudanças em server/app.ts, server/main.ts, src/App.tsx e src/Layout.tsx. As limitações da Seção 10 (item 7) continuam registradas.

## 12. Intervenção humana

Houve intervenção humana: Sim.

Tipo: decisão sobre dados pessoais, alteração de situação de reserva e pendências financeiras. A instrução (Seção 5) previa três paradas para decisão do pesquisador (dados pessoais visíveis ao administrador; alterações manuais de situação autorizadas; pendências administrativas e pagamentos); o pesquisador aceitou as opções recomendadas pelo agente ("recomendadas") em 2026-11-24T21:49:20-03:00. Não houve correção de código do agente por intervenção humana. Fora da execução, em 24/11/2026 (23:21 a 23:23), foram feitas no repositório alterações externas à sessão do agente (renomeação do ramo, remoto e um trecho em outra codificação no README.md); o trecho foi retirado pelo agente em 26/11/2026 com a autorização do pesquisador.

## 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-26T12:23:22-03:00: "ap 3 sim". Tentativa a que se aplica: 1. Segue o critério único adotado pelo pesquisador para as AGT-001 a AGT-012: quando a instrução manda parar e a atividade só prossegue com decisão do pesquisador, a classificação é AP-3. O pesquisador não escreveu justificativa.)

## 14. Controle de versão

Commit relacionado: 482f981

---

## 16. Observações finais

A duração registrada (15,53 min, de 21:49:20 a 22:04:52 em 24/11/2026) é tempo de relógio da implementação depois das decisões e inclui a documentação, as verificações por mutação e o percurso em navegador real; a espera pelas decisões e a espera pela classificação (de 24/11 a 26/11) não são contadas. Não houve interrupção da sessão durante a implementação. Antes do fechamento, a checagem completa foi refeita em 26/11/2026 (12:21), com 557 de 557 testes. Sem migração e sem dependência nova. A versão da ferramenta (extensão 2.1.331, a mais recente instalada na data da execução) não pôde ser confirmada como a que executou a atividade.
