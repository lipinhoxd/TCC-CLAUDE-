# Quadro de resultados por atividade

Atualizado em 13/11/2026. Os dois estudos são apresentados separados e **não se somam**.
Fontes: TCC (Seção 5), `TCC/registros-agente/`, `TCC/metricas/METRICAS.csv` e Git.
Células sem dado verificável contêm **[DADO NÃO REGISTRADO]**.

## 1. Estudo piloto (Codex)

n = 5 atividades concluídas e classificadas (de 5 executadas no piloto). Dados do repositório do
piloto (`TCC-IA-EXCURSOES`, tag `piloto-codex`) não foram reabertos para este quadro.

| AGT | Atividade | Classe | Tentativas | Testes | Duração | Intervenção | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Fundação técnica | AP-1 | 2 (segunda: instrução corretiva sobre extensão dos arquivos metodológicos) | [DADO NÃO REGISTRADO] | [DADO NÃO REGISTRADO] | Não | [DADO NÃO REGISTRADO] |
| 002 | Modelo de dados e persistência | AP-1 | [DADO NÃO REGISTRADO] | [DADO NÃO REGISTRADO] | [DADO NÃO REGISTRADO] | Não | [DADO NÃO REGISTRADO] |
| 003 | Cadastro, autenticação e controle de acesso | AP-1 | [DADO NÃO REGISTRADO] | [DADO NÃO REGISTRADO] | [DADO NÃO REGISTRADO] | Não | [DADO NÃO REGISTRADO] |
| 004 | Estrutura pública | AP-1 | 1 (inferido: AP-1; o TCC informa que a interrupção por limite de uso não foi contada como nova tentativa) | 118 aprovados | [DADO NÃO REGISTRADO] (início em 10/09/2026) | Não | `41fba49` |
| 005 | Gerenciamento administrativo de excursões | AP-3 | [DADO NÃO REGISTRADO] | 198 na suíte (80 novos) aprovados | [DADO NÃO REGISTRADO] | Sim: esclarecimento de requisito e decisão de arquitetura | `c66cd36` |

Nota: "Não" na coluna Intervenção para AGT-001 a AGT-004 é **inferido da definição de AP-1** (sem
intervenção direta), não de um registro individual de intervenção; a conferir nas fichas do piloto.

Distribuição descritiva: 4 AP-1 (4/5), 1 AP-3 (1/5), 0 AP-2, 0 RP. **A contagem é do subconjunto
avaliado, com n = 5, e não é uma taxa generalizável.** Perfil das tarefas: predominantemente
fundacionais (preparação, persistência, autenticação, interface pública e administração básica).
Não há inferência estatística.

## 2. Experimento principal (Claude Code)

n = 1 atividade concluída e classificada (de 18 previstas).

| AGT | Atividade | Estado | Classe | Tentativas | Testes | Duração | Intervenção | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Fundação técnica | Concluída | AP-3 | 2 | 13 (T1) e 15 (T2), todos aprovados | T1 3 min 13 s; T2 8 min 8 s (≈ 3 min 18 s sem pausas) | Sim: decisão de arquitetura | `4cd310c`, `d65d64f` |
| 002 | Modelo de dados e persistência | Instrução aprovada; não executada | — | — | — | — | — | — |
| 003 a 018 | Ver `docs/especificacao/07-PLANO-DE-ATIVIDADES.md` | Planejada | — | — | — | — | — | — |

Distribuição descritiva: 1 AP-3 (1/1) no subconjunto avaliado, o que **não permite concluir nada
sobre o desempenho do agente**. Perfil: tarefa fundacional. Não há inferência estatística nem grupo
de controle.

## 3. Como atualizar

A cada atividade concluída: preencher a ficha em `docs/fichas-agt/`, a linha de
`TCC/metricas/METRICAS.csv` e este quadro, na mesma data, sem alterar linhas antigas.
