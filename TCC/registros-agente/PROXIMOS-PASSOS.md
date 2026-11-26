# Próximos passos (atualizado em 26/11/2026)

## Onde parou
- **AGT-009 concluída e classificada AP-3 pelos pesquisadores (20/11/2026)**; commits c051823 e 8b1b1cf. **Transcrita e conferida no Docs em 21/11/2026** (17 trocas e 3 inserções). Próxima atividade: AGT-010 (pagamento parcelado; RF-024, RF-027, RF-028; RN-012, RN-013, RN-017 a RN-020), sem instrução redigida.
- **AGT-013 concluída e classificada AP-3 pelos pesquisadores (26/11/2026)**; commits b27f70e e 49a512e. Dossiê para o Gemini (`TCC/relatorios/DOSSIE-GEMINI-AGT-013-2026-11-26.md`) e auditoria gerados; aguarda envio ao Gemini e conferência. Experimento principal: 13 das 18 (n = 13). Próxima atividade: AGT-014 (processos automáticos), sem instrução redigida.
- Decidido em 26/11/2026: a reserva aguardando pagamento é cancelada quando o reembolso da pendência é processado (implementado e commitado). Classe AP-4 confirmada pelo pesquisador (rubrica e `CLAUDE.md` atualizados).
- **Data de corte da execução experimental: 30/11/2026** (definida pelo agente em 26/11/2026, por delegação do pesquisador: "coloque você mesmo"; substitui a proposta de 24/11/2026).
- **AGT-012 concluída e classificada AP-3 pelos pesquisadores (26/11/2026)**; commits 482f981 e a797a32. Dossiê para o Gemini (`TCC/relatorios/DOSSIE-GEMINI-AGT-012-2026-11-26.md`) e auditoria gerados; aguarda envio ao Gemini e conferência por releitura.
- Experimento principal: AGT-001 a AGT-012 concluídas e classificadas (AP-3): 12 das 18 (n = 12). Próxima atividade: AGT-013 (cancelamentos e reembolsos), sem instrução redigida.
- **Pendente de aprovação:** correções do Docs da AGT-011 (`PEDIDO-CORRECAO-GEMINI-AGT-011-2026-11-24.md`), com as decisões sobre o Quadro 3 e a Seção 5.4.
- Repositório: ramo `main` e remoto `origin` configurados fora da sessão do agente (24/11/2026); nada enviado pelo agente; enviar só a pedido.
- **AGT-011 concluída e classificada AP-3 pelos pesquisadores (24/11/2026)**; commits c8ed387 e ee1aca0. **Dossiê bruto para o Gemini gerado** (`TCC/relatorios/DOSSIE-GEMINI-AGT-011-2026-11-24.md`) e auditoria (`AUDITORIA-SINCRONIA-AGT-011-2026-11-24.md`); aguarda o pesquisador enviar ao Gemini e, depois, a conferência por releitura do Docs. Desde 24/11/2026 o Docs é atualizado pelo Gemini (dossiê bruto, sem trocas exatas).
- Experimento principal: AGT-001 a AGT-011 concluídas e classificadas (AP-3): 11 das 18 (n = 11). AGT-001 a AGT-010 transcritas e conferidas no Docs; AGT-011 pendente. Próxima atividade: AGT-012 (administração de reservas e passageiros), sem instrução redigida.
- **AGT-010 concluída e classificada AP-3 pelos pesquisadores (21/11/2026)**; commits f983b15 e ac63597. **Prompt do Docs gerado** (`TCC/relatorios/PROMPT-DOCS-AGT-010-2026-11-21.md`) e auditoria (`AUDITORIA-SINCRONIA-AGT-010-2026-11-21.md`); transcrita e conferida no Docs em 21/11/2026.
- Experimento principal: AGT-001 a AGT-010 concluídas e classificadas pelos pesquisadores (AP-3): 10 das 18 (n = 10). AGT-001 a AGT-009 transcritas e conferidas no Docs; AGT-010 também transcrita e conferida. Piloto com o Codex (n = 5) é separado e nunca somado.
- Próxima atividade: AGT-014 (processos automáticos). Não existe `AGT-014.md`: não há instrução redigida nem aprovada. O agente só redige a instrução quando os pesquisadores disserem "vamos".
- Nada em andamento. Último commit de atividade: `b27f70e` (AGT-013), com o hash em `49a512e`.
- Auditoria de sincronia do Docs contra o repositório feita em 20/11/2026: `TCC/relatorios/AUDITORIA-SINCRONIA-2026-11-20.md` (69 itens: 48 OK, 13 DIVERGE, 6 perguntas ao autor, 2 fora do alcance). O Docs não foi alterado pelo agente.

## Já aplicado no Docs (fora da sessão do agente)
- "n = 5" e "n = 7" no Resumo, Abstract, Seções 5.1, 6.1, 6.4 e Capítulo 7.
- Datas da Seção 5.1 e da fonte do Quadro 2 em 19/11/2026; Seção 5.4 reescrita a partir da AGT-008.
- "pesquisadores" (plural) nas classificações; fichas AGT-001 e AGT-005 com 20 campos; "[DADO NÃO REGISTRADO]" padronizado no Quadro 2; "independente" removido das fichas do piloto (resta uma ocorrência, apontada na auditoria).

## Depende do orientador/autor
- Sumário do Docs: atualizado pelo pesquisador em 20/11/2026. Atualizar de novo ao final, se o texto mudar.
- Escopo a partir da AGT-005, com corte proposto em 24/11/2026: confirmar (11 atividades restantes).
- Verificação real do telefone e do token de recuperação.
- DOIs das referências 1 e 8.
- Campos [INFORMAR]: orientador, examinadores, data de aprovação. O pesquisador preencherá no final (examinadores) e a data só após a defesa.
- Auditoria de 20/11/2026: as 12 correções do Docs (11 do primeiro lote e a da Seção 3.5) estão aplicadas e conferidas por releitura; nenhuma divergência aberta no Docs.

## Depende dos pesquisadores
- Classificação de cada atividade nova (sempre dos pesquisadores).
- Segundo avaliador (não designado).
- Versão da ferramenta Claude Code das AGT-001 a AGT-008: [DADO NÃO REGISTRADO]; nenhum arquivo do repositório a registra (a extensão instalada em 20/11/2026 é a 2.1.325, mas isso não prova a versão das execuções anteriores). A partir da AGT-009, o agente registra no `AGT-XXX.md` e na ficha a versão da extensão vista na pasta de extensões do VS Code no início da atividade (hoje 2.1.325).
- Aprovação da instrução da AGT-008.
- Confirmar (ou corrigir) a leitura do "ok" de 20/11/2026 como "recomendadas" em P1 a P6 (primeira opção de cada).

## Decisões dos pesquisadores já registradas
- 20/11/2026, "ok" (lido pelo agente como aval): P1 a P6 da auditoria pela primeira opção de cada (P1 manter "[a confirmar]"; P2 manter RNF-018 a 026 e 029; P3 só o commit da atividade; P4 manter o ambiente das fichas AGT-002 e 003; P5 manter a lista e acrescentar "20 campos, entre os quais"; P6 manter as entradas do diário). Só a P5 gera correção no Docs (Correção 11 do prompt). Correções do repositório autorizadas e feitas: matriz de rastreabilidade (cabeçalho e RN-001 a RN-008, RN-036, RN-037), data do quadro de resultados, ficha AGT-003 (20 critérios), ficha AGT-005 (20 campos) e formato da Entrada 74.
- Critério único de classificação: se a instrução manda parar e a atividade só prossegue com decisão dos pesquisadores, a atividade é AP-3; AP-2 fica para correções do próprio agente (AGT-001 a AGT-007 em AP-3, a AGT-002 reclassificada de AP-2).
- Fechamento padrão de cada AGT (autorizado em 19/11/2026): ao receber a classificação, o agente marca os critérios, redige as Seções 11 a 13, atualiza métricas, quadro, matriz e ficha, roda a checagem completa, commita em dois passos e transcreve no Docs.
- Escolhas técnicas: SQLite por `node:sqlite` com SQL direto (AGT-002); scrypt, cookie de sessão e token de recuperação de 30 min (AGT-003); roteador próprio e CSS puro (AGT-004).
