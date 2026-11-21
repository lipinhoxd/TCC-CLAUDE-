# Próximos passos (atualizado em 20/11/2026)

## Onde parou
- Experimento principal: AGT-001 a AGT-007 concluídas, classificadas pelos pesquisadores (AP-3) e transcritas no Docs (7 das 18; n = 7). Piloto com o Codex (n = 5) é separado e nunca somado.
- Próxima atividade: AGT-008 (capacidade e retenção temporária de vagas; RF-019, RF-021, RF-022; RN-014, RN-015, RN-021, RN-040). Não existe `AGT-008.md`: não há instrução redigida nem aprovada. O agente só redige a instrução quando os pesquisadores disserem "vamos".
- Nada em andamento. Último commit de atividade: `5c86513` (AGT-007), com o hash em `b258e66`.
- Auditoria de sincronia do Docs contra o repositório feita em 20/11/2026: `TCC/relatorios/AUDITORIA-SINCRONIA-2026-11-20.md` (69 itens: 48 OK, 13 DIVERGE, 6 perguntas ao autor, 2 fora do alcance). O Docs não foi alterado pelo agente.

## Já aplicado no Docs (fora da sessão do agente)
- "n = 5" e "n = 7" no Resumo, Abstract, Seções 5.1, 6.1, 6.4 e Capítulo 7.
- Datas da Seção 5.1 e da fonte do Quadro 2 em 19/11/2026; Seção 5.4 reescrita a partir da AGT-008.
- "pesquisadores" (plural) nas classificações; fichas AGT-001 e AGT-005 com 20 campos; "[DADO NÃO REGISTRADO]" padronizado no Quadro 2; "independente" removido das fichas do piloto (resta uma ocorrência, apontada na auditoria).

## Depende do orientador/autor
- Sumário do Docs: atualizar.
- Escopo a partir da AGT-005, com corte proposto em 24/11/2026: confirmar (11 atividades restantes).
- Verificação real do telefone e do token de recuperação.
- DOIs das referências 1 e 8.
- Campos [INFORMAR]: orientador, examinadores, data de aprovação (só após a defesa).
- Auditoria de 20/11/2026: as 12 correções do Docs (11 do primeiro lote e a da Seção 3.5) estão aplicadas e conferidas por releitura; nenhuma divergência aberta no Docs.

## Depende dos pesquisadores
- Classificação de cada atividade nova (sempre dos pesquisadores).
- Segundo avaliador (não designado).
- Versão da ferramenta Claude Code: [DADO NÃO REGISTRADO]; nenhum arquivo do repositório a registra.
- Aprovação da instrução da AGT-008.
- Confirmar (ou corrigir) a leitura do "ok" de 20/11/2026 como "recomendadas" em P1 a P6 (primeira opção de cada).

## Decisões dos pesquisadores já registradas
- 20/11/2026, "ok" (lido pelo agente como aval): P1 a P6 da auditoria pela primeira opção de cada (P1 manter "[a confirmar]"; P2 manter RNF-018 a 026 e 029; P3 só o commit da atividade; P4 manter o ambiente das fichas AGT-002 e 003; P5 manter a lista e acrescentar "20 campos, entre os quais"; P6 manter as entradas do diário). Só a P5 gera correção no Docs (Correção 11 do prompt). Correções do repositório autorizadas e feitas: matriz de rastreabilidade (cabeçalho e RN-001 a RN-008, RN-036, RN-037), data do quadro de resultados, ficha AGT-003 (20 critérios), ficha AGT-005 (20 campos) e formato da Entrada 74.
- Critério único de classificação: se a instrução manda parar e a atividade só prossegue com decisão dos pesquisadores, a atividade é AP-3; AP-2 fica para correções do próprio agente (AGT-001 a AGT-007 em AP-3, a AGT-002 reclassificada de AP-2).
- Fechamento padrão de cada AGT (autorizado em 19/11/2026): ao receber a classificação, o agente marca os critérios, redige as Seções 11 a 13, atualiza métricas, quadro, matriz e ficha, roda a checagem completa, commita em dois passos e transcreve no Docs.
- Escolhas técnicas: SQLite por `node:sqlite` com SQL direto (AGT-002); scrypt, cookie de sessão e token de recuperação de 30 min (AGT-003); roteador próprio e CSS puro (AGT-004).
