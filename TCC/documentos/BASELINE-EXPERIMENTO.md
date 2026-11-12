# Linha de base do experimento principal

Data: 11/11/2026

## Identificação

Projeto: plataforma web para gerenciamento de excursões.
Agente: Claude Code (Anthropic), com os modelos Claude Opus 5.5 e Claude Sonnet 5.5; o modelo
efetivamente usado é registrado em cada AGT.
Estado experimental: anterior à AGT-001.

## Origem e relação com o piloto

- Este repositório reinicia o desenvolvimento do sistema, após o estudo piloto com o Codex
  (AGT-001 a AGT-005; AGT-001 a AGT-004 como AP-1 e AGT-005 como AP-3). O piloto está
  preservado no repositório `TCC-IA-EXCURSOES`, tag `piloto-codex`.
- Nenhum código do piloto nem do sistema BPM Trip foi incorporado.
- **Contato prévio:** o agente leu o código, os registros e os relatórios do piloto durante a
  preparação do reinício. Isso é uma ameaça à validade (TCC, Seção 3.2).

## Especificação

A especificação original do piloto (dez documentos da pasta BPMTRIP) não estava disponível.
A especificação deste experimento foi **escrita pelo agente em 11/11/2026 a partir do Capítulo 4
do TCC** e dos IDs usados nos registros do piloto. Está em `docs/especificacao/`, com a origem
de cada requisito. Contagens: 42 RF, 33 RNF e 44 RN, iguais às do Capítulo 4.

Pontos que o agente definiu e que os pesquisadores devem confirmar:
- RF-007 a RF-042 e RN-007 a RN-042 (exceto os já citados no piloto) foram reescritos a partir
  do texto do TCC;
- RNF-011, RNF-012, RNF-027, RNF-028 e RNF-029 são novos;
- itens marcados **[confirmar]** em `04-REGRAS-DE-NEGOCIO.md` e `05-FLUXOS-E-ESTADOS.md`.

Esta especificação só vale como linha de base depois da aprovação dos pesquisadores.

## Estado inicial do repositório

Não existe código funcional. A estrutura contém apenas a especificação e a organização do
registro do experimento. Controle de versão: Git, branch `master`.

Commit da linha de base: ver `git log` (mensagem iniciada por "BASELINE").
