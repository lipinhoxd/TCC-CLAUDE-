# Plano de adequação ao relatório do orientador (PASSO 0: diagnóstico)

Data: 13/11/2026
Elaborado por: Claude Code (Claude Sonnet 5.5), por pedido dos pesquisadores.
Base: o prompt `prompt_tcc_vscode.md` e o resumo do relatório do orientador nele contido; o TCC
no Google Docs (lido em 13/11/2026, após as edições da Entrada 26 do diário); o repositório
`TCC-IA-EXCURSOES-CLAUDE` no estado do commit `7158c36`.

> **Status: plano proposto. Nada foi editado** no Google Docs nem no repositório (além deste
> arquivo e do diário). Os dois arquivos do orientador mencionados pelo pesquisador (o relatório e
> o .docx com as marcas em vermelho) **não foram lidos**: só o resumo contido no prompt. Os dados
> abaixo valem para o que o prompt diz.

## 1. Divergências entre o prompt e o estado real do projeto

| O prompt assume | Estado real em 13/11/2026 | Consequência |
| --- | --- | --- |
| Estudo com 3 atividades concluídas (AGT-001 a AGT-003, todas AP-1) e 15 planejadas. | O TCC atual tem o **piloto com o Codex** (5 atividades: 4 AP-1 e 1 AP-3) e o **experimento principal** com o Claude Code (AGT-001 concluída, AP-3, 2 tentativas). | A delimitação "3 de 18" (Resumo, Abstract, Cap. 6) **não vale mais** como está. Proposta: "piloto: 5 atividades; principal: 1 de 18 atividades". |
| O repositório de trabalho contém as fichas AGT-001 a AGT-003. | Este repositório só tem a AGT-001 do **principal**. As AGT-001 a AGT-005 do piloto estão no repositório `TCC-IA-EXCURSOES` (tag `piloto-codex`), que o agente **não abriu** (regra 8 do `CLAUDE.md`). | Fichas do piloto só podem ser feitas com dados já presentes no TCC; o resto fica "[DADO NÃO REGISTRADO]", ou o pesquisador fornece/autoriza a leitura dos registros. |
| Banco de dados e esquema reais existem para gerar o ER. | No principal, a AGT-002 **ainda não foi executada**; não há esquema. O SQLite foi decisão do **piloto**. | ER "gerado do schema real" é impossível agora. Só um ER **conceitual** (de `06-MODELO-DE-DADOS.md`), identificado como tal. |
| As correções do orientador foram feitas sobre `TCC_NP1_revisado (1).docx` (38 páginas). | O Google Docs foi reescrito em 13/11/2026 (Caps. 3.3, 4.8, 5, 6 e 7 e 3.9). | Parte das 35 correções incide sobre texto que já não existe (ver seção 2). |

## 2. Situação das correções textuais (35 itens, conferidas por busca de texto no Google Docs)

Conferência feita com 41 verificações (alguns itens têm duas ou três trocas):
- **0 já aplicadas** no Google Docs.
- **33 pendentes**: o texto original ainda existe e a troca pode ser aplicada como o orientador
  indicou (itens 1 a 3, 6 a 18, 20 a 27, 29 e 29b, 32b, 34 e 35, e partes dos demais).
- **8 em trechos que o agente reescreveu em 13/11/2026** (itens 27b, 28, 30, 31, 31b, 32, 33 e 35b):
  o texto original não existe mais. Proposta: **adaptar a intenção do orientador ao texto atual**
  (por exemplo, "mecanismos de validação" → "procedimentos de validação" onde aparecer), listando
  cada adaptação para aprovação.
- **Item 29** ("três primeiras atividades" → "A aprovação das três primeiras…"): o texto atual diz
  "quatro primeiras" (piloto AGT-001 a AGT-004); a troca de redação se aplica mantendo "quatro".
- **Item 31** (vírgula em "foi até o momento, classificada"): o prompt já alerta que está incorreta.
  Proposta: escrever "nenhuma atividade foi, até o momento, classificada como AP-2 ou RP" (vírgulas
  fechando o adjunto). **Decisão do pesquisador.**
- **Itens 1 a 3 (pré-textuais):** "[INFORMAR NOME DO(A) ORIENTADOR(A)]", "[INFORMAR DATA APÓS A DEFESA]",
  "[INFORMAR NOME DO(A) EXAMINADOR(A)]" (2 ocorrências). Aplicados como placeholders, sem
  inventar nomes ou datas.

## 3. Evidências que existem hoje, por atividade

| Atividade | Fonte | O que existe | O que falta |
| --- | --- | --- | --- |
| **Principal AGT-001** | `TCC/registros-agente/AGT-001.md`, `METRICAS.csv`, Git (`4cd310c`, `d65d64f`, tag), diário | Instrução original, 2 tentativas com início, fim e duração, comandos, testes (13 e 15), commits, intervenção, AP-3, avaliação humana, critérios (12 de 15 marcados) | Versão do agente por tentativa já registrada (Claude Sonnet 5.5); falta só a decisão dos 3 critérios sem marca. |
| **Piloto AGT-001 a AGT-005** | Apenas o texto do TCC | Classificações; AGT-004: 118 testes, commit `41fba49`, início 10/09/2026; AGT-005: 80 novos testes, 198 no total, commit `c66cd36`; AGT-001: 2 tentativas | Comando inicial, duração, tentativas das demais, versões (Node, Codex), hashes de AGT-001 a AGT-003, evidências: **[DADO NÃO REGISTRADO]** neste repositório. |
| **Principal AGT-002 em diante** | `AGT-002.md` (instrução aprovada) | Instrução aprovada, não executada | Tudo (a atividade não foi feita). |
| **Especificação** | `docs/especificacao/` | Listas completas: 42 RF, 33 RNF, 44 RN (contagem conferida por busca) | 5 itens ainda marcados **[confirmar]**; a especificação foi escrita pelo agente (já registrado como ameaça à validade). |

## 4. Ordem de execução proposta

Cada fase termina com resumo do que mudou e **só avança com a sua aprovação**. Nada é aplicado no
Google Docs sem aprovação do texto específico e sem backup (ver pergunta 3).

1. **Fase 1: artefatos no repositório** (sem Docs): modelo em branco de ficha AGT; ficha da AGT-001
   do principal (a partir do registro); rubrica de avaliação com definições operacionais de
   tentativa, intervenção e tempo e campo para segundo avaliador; quadro de resultados (piloto e
   principal separados, n e denominador explícitos, linhas "planejada" até a AGT-018); listas
   completas de RF, RNF e RN (cópia organizada da especificação); matriz de rastreabilidade
   (preenchida só até onde há evidência); ADR da decisão PostgreSQL → SQLite (do piloto; versão do
   Node do piloto "[DADO NÃO REGISTRADO]" se não houver); diagramas Mermaid (ER conceitual, arquitetura
   por áreas, fluxo experimental, fluxos críticos), sem inventar esquema.
2. **Fase 2: correções textuais no Docs** (as 35, por capítulo, com a lista de adaptações dos 8
   itens reescritos), mais as recomendações curtas: Resumo e Abstract com a nova delimitação,
   contribuição esperada na Introdução, regra "3/3 não é taxa" aplicada às contagens reais.
3. **Fase 3: conteúdo novo no Docs:** síntese comparativa assistentes × agentes (Cap. 2, só com
   fontes conferidas), ficha-modelo, protocolo e critérios (Cap. 3), tabelas de evidências (Caps. 5 e
   6), apêndices A a F com título, fonte e remissão no texto.
4. **Fase 4: Referências:** conferência individual de DOI, autoria, ano, título e veículo **por busca
   na web**; padronização NBR 6023; correspondência com as citações no texto; tabela de verificação.
   Fontes que não puderem ser conferidas ficam como "[A CONFERIR]".
5. **Fase 5: relatório final** com o que mudou por capítulo, as pendências dependentes dos
   pesquisadores e o que não foi possível verificar.

## 5. Decisões e dados que dependem dos pesquisadores

1. Aprovar o tratamento da divergência "3 de 18" × estado real (Seção 1).
2. Autorizar (ou não) a leitura dos **registros** do piloto (não do código) para completar as
   fichas, ou fornecer os dados; ameaça à validade já registrada.
3. Fazer a **cópia de segurança** do Google Docs (Arquivo → Fazer uma cópia); o agente não consegue.
4. Decidir a redação do item 31.
5. Decidir o ER: conceitual agora, real depois da AGT-002.
6. Decidir o ADR: do piloto agora e do principal depois da AGT-002.
7. Decisão formal sobre as AGT-004 a AGT-018: concluir ou justificar redução de escopo (data de corte
   proposta: 24/11/2026).
8. Indicar quem seria o **segundo avaliador** independente (se houver).
9. Informar se os dois arquivos do orientador ainda serão enviados.
