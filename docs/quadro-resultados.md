# Quadro de resultados por atividade

Atualizado em 26/11/2026. Os dois estudos são apresentados separados e **não se somam**.
Fontes: TCC (Seção 5), `TCC/registros-agente/`, `TCC/metricas/METRICAS.csv` e Git.
Células sem dado verificável contêm **[DADO NÃO REGISTRADO]**.

## 1. Estudo piloto (Codex)

n = 5 atividades concluídas e classificadas (de 5 executadas no piloto). Fonte: registros do piloto
(`TCC-IA-EXCURSOES`, tag `piloto-codex`; leitura apenas de documentos de registro, planilha de
métricas e `git log`, em 13/11/2026, com autorização do pesquisador; ver Entrada 34 do diário) e TCC.
Durações são o **tempo de trabalho informado pelo Codex** quando não há horário de fim registrado.

| AGT | Atividade | Classe | Tentativas | Testes aprovados | Duração | Intervenção | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Fundação técnica | AP-1 | 2 (segunda: instrução corretiva sobre extensão dos arquivos metodológicos) | 6 | 8,52 min (início 10/09/2026 12:48:06) | Não (nova instrução registrada) | `7971f06` |
| 002 | Modelo de dados e persistência | AP-1 | 1 | 48 (47 na 1.ª execução) | 4,47 min (início 13:25:35) | Não | `08075d2` |
| 003 | Cadastro, autenticação e controle de acesso | AP-1 | 1 | 103 | 18,58 min (início 13:57:02) | Não | `9f5c038` |
| 004 | Estrutura pública | AP-1 | 1 (interrupção por limite de uso não contada) | 118 | [DADO NÃO REGISTRADO] (início 14:39:24) | Não | `41fba49` |
| 005 | Gerenciamento administrativo de excursões | AP-3 | [DADO NÃO REGISTRADO] (uma execução com retomadas) | 198 (80 novos) | [DADO NÃO REGISTRADO] (início 19:16:25) | Sim: esclarecimento de requisito e decisão de arquitetura | `c66cd36` |

Todas as execuções do piloto ocorreram em 10/09/2026. Dados que o registro do piloto deixou
pendentes (fim e duração da AGT-004 e da AGT-005; tentativas da AGT-005) permanecem
**[DADO NÃO REGISTRADO]**; a versão do Node.js e o modelo do Codex nas execuções também não constam.

Distribuição descritiva: 4 AP-1 (4/5), 1 AP-3 (1/5), 0 AP-2, 0 RP. **A contagem é do subconjunto
avaliado, com n = 5, e não é uma taxa generalizável.** Perfil das tarefas: predominantemente
fundacionais (preparação, persistência, autenticação, interface pública e administração básica).
Não há inferência estatística.

## 2. Experimento principal (Claude Code)

n = 16 atividades concluídas e classificadas (de 18 previstas).

| AGT | Atividade | Estado | Classe | Tentativas | Testes | Duração | Intervenção | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Fundação técnica | Concluída | AP-3 | 2 | 13 (T1) e 15 (T2), todos aprovados | T1 3 min 13 s; T2 8 min 8 s (≈ 3 min 18 s sem pausas) | Sim: decisão de arquitetura | `4cd310c`, `d65d64f` |
| 002 | Modelo de dados e persistência | Concluída | AP-3 | 1 | 57 (15 anteriores + 42 novos), todos aprovados | ≈ 4,2 min de implementação (espera de ≈ 1 h 15 min pela decisão do banco não contada) | Sim: decisão de arquitetura (escolha do banco; antes registrada como AP-2 e sem intervenção) | `1c59330` |
| 003 | Cadastro, autenticação e controle de acesso | Concluída | AP-3 | 1 | 100 (57 anteriores + 43 novos), todos aprovados | ≈ 6 min de implementação (espera pelas quatro decisões não contada) | Sim: decisão de arquitetura e segurança (quatro paradas previstas) | `0f6ba34` |
| 004 | Estrutura pública | Concluída | AP-3 | 1 | 140 (100 anteriores + 40 novos), todos aprovados | ≈ 6,5 min de implementação (espera pelas quatro decisões não contada) | Sim: decisão de arquitetura, dependências e conteúdo (quatro paradas previstas) | `e05db42` |
| 005 | Gerenciamento administrativo de excursões | Concluída | AP-3 | 1 | 238 (140 anteriores + 98 novos), todos aprovados | ≈ 13,5 min de implementação (espera pelas três decisões não contada) | Sim: decisão de regras de negócio e arquitetura (três paradas previstas) | `614e11d` |
| 006 | Consulta e detalhamento | Concluída | AP-3 | 1 | 277 (238 anteriores + 39 novos; 1 reescrito), todos aprovados | ≈ 7 min de implementação (espera pelas decisões não contada) | Sim: decisão sobre o que o público vê (três paradas previstas) | `a9d06a1` |
| 007 | Reservas | Concluída | AP-3 | 1 | 326 (277 anteriores + 49 novos; 1 reescrito), todos aprovados | ≈ 5,3 min de implementação (espera pelas decisões não contada) | Sim: decisão sobre reservas, vagas e dinheiro (três paradas previstas) | `5c86513` |
| 008 | Capacidade e retenção temporária de vagas | Concluída | AP-3 | 1 | 372 (326 anteriores + 46 novos; 1 reescrito de outra atividade e 3 ajustados), todos aprovados | ≈ 17,6 min (inclui documentação, mutações e percurso em navegador; espera pelas decisões não contada) | Sim: decisão sobre vagas e concorrência (três paradas previstas) | `23e87fb` |
| 009 | Pagamento integral | Concluída | AP-3 | 1 | 420 (372 anteriores + 48 novos; 2 atualizados de outras atividades), todos aprovados | ≈ 14,8 min (inclui documentação, mutações e percurso em navegador; espera pelas decisões não contada) | Sim: decisão sobre pagamento e vagas (três paradas previstas) | `c051823` |
| 010 | Pagamento parcelado e vencimento | Concluída | AP-3 | 1 | 463 (420 anteriores + 43 novos; atualizados testes de outras atividades), todos aprovados | ≈ 396,5 min em relógio (inclui pausas e a interrupção da sessão; tempo ativo **[DADO NÃO REGISTRADO]**) | Sim: decisão sobre pagamentos, vagas e inadimplência (três paradas previstas) | `f983b15` |
| 011 | Área do passageiro | Concluída | AP-3 | 1 | 502 (463 anteriores + 39 novos), todos aprovados | ≈ 9,4 min (inclui documentação, mutações e percurso em navegador; espera pelas decisões não contada) | Sim: decisão sobre situação da reserva e dados do passageiro (três paradas previstas) | `c8ed387` |
| 012 | Administração de reservas e passageiros | Concluída | AP-3 | 1 | 557 (502 anteriores + 55 novos), todos aprovados | ≈ 15,5 min (inclui documentação, mutações e percurso em navegador; espera pelas decisões não contada) | Sim: decisão sobre dados pessoais, situação de reserva e pendências (três paradas previstas) | `482f981` |
| 013 | Cancelamentos e reembolsos | Concluída | AP-3 | 1 | 610 (557 anteriores + 53 novos), todos aprovados | ≈ 16,3 min (inclui documentação, mutações e percurso em navegador; espera pelas decisões não contada) | Sim: decisão sobre cancelamentos, reembolsos e pagamentos (três paradas previstas) | `b27f70e` |
| 014 | Processos automáticos | Concluída | AP-3 | 1 | 647 (612 anteriores + 35 novos), todos aprovados | ≈ 12 min (inclui documentação, mutações e percurso em execução real; espera pelas decisões não contada) | Sim: decisão sobre execução da rotina, situações sem regra e situação da excursão (três paradas previstas) | `ce9cf5e` |
| 015 | Comunicação | Concluída | AP-3 | 1 | 685 (647 anteriores + 38 novos), todos aprovados | ≈ 14,4 min (inclui documentação, mutações e percurso em execução real; espera pelas decisões não contada) | Sim: decisão sobre canal, eventos, dados pessoais e entrega (três paradas previstas) | `8e486ff` |
| 016 | Painel administrativo | Concluída | AP-3 | 1 | 720 (685 anteriores + 35 novos), todos aprovados | ≈ 14,5 min (inclui documentação, mutações e percurso em execução real; espera pelas decisões não contada) | Sim: decisão sobre conteúdo do painel, histórico e leitura e acesso (três paradas previstas) | `8b4bbef` |
| 017 e 018 | Ver `docs/especificacao/07-PLANO-DE-ATIVIDADES.md` | Planejada | — | — | — | — | — | — |

Distribuição descritiva: 16 AP-3 (n = 16) no subconjunto avaliado, o que **não permite concluir
nada sobre o desempenho do agente**. As atividades seguem um critério único (decisão do pesquisador exigida pela instrução = AP-3; ver `docs/rubrica-avaliacao.md`). Perfil: tarefas fundacionais. Não há inferência estatística nem grupo
de controle.

## 3. Como atualizar

A cada atividade concluída: preencher a ficha em `docs/fichas-agt/`, a linha de
`TCC/metricas/METRICAS.csv` e este quadro, na mesma data, sem alterar linhas antigas.
