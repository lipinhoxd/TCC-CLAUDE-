# Estado da transcrição para o Google Docs

Arquivo de trabalho do agente: registra o que já foi transcrito e o que falta, para continuar de onde
parou sem reler o TCC inteiro. Atualizar ao fim de cada transcrição.

**Documento:** "VERSÃO BASE DO TCC", ID `1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I`, aba única `t.0`
(link: https://docs.google.com/document/d/1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I/edit).
Último trecho do documento (confirmado pelo pesquisador em 13/11/2026): Apêndice F, "Texto integral e
campos de avaliação: docs/rubrica-avaliacao.md (repositório)".

## Já transcrito (principal)

| AGT | Classe | Commit | Quadro 2 | Seção 5.3 | Ficha (Apêndice E) | Apêndice D | Contagens no texto |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | AP-3 | 4cd310c; d65d64f | sim | sim | sim | sim | sim |
| 002 | AP-3 (inicialmente AP-2) | 1c59330 | sim | sim | sim | sim | sim |
| 003 | AP-3 | 0f6ba34 | sim | sim | sim | sim | sim |
| 004 | AP-3 | e05db42 | sim | sim | sim | sim | sim |
| 005 | AP-3 | 614e11d | sim | sim | sim | sim | sim |
| 006 | AP-3 | a9d06a1 | sim | sim | sim | sim | sim |
| 007 | AP-3 | 5c86513 | sim | sim | sim | sim | sim |
| 008 | AP-3 | 23e87fb | sim | sim | sim | sim | sim |
| 009 | AP-3 | c051823 | pendente | pendente | pendente | pendente | pendente (prompt gerado em 20/11/2026) |

Critério único de classificação (AP-3 quando a instrução manda parar e a atividade só prossegue com
decisão do pesquisador) está na rubrica, na Seção 6.3 e no Apêndice F do Docs.

## Onde cada coisa está no Docs (ordem)

- **Quadro 2:** 4 linhas do piloto (AGT-001 a 005) e depois as do principal, em ordem; a nova linha entra no fim.
- **Seção 5.3:** um parágrafo por atividade do principal, em ordem; o parágrafo novo entra depois do último
  (hoje AGT-007), separado por um parágrafo em branco.
- **Apêndice E:** fichas do principal (AGT-001 a 007) antes das fichas do piloto; a nova ficha entra antes de
  "Ficha — Piloto (Codex), AGT-001".
- **Apêndice D:** uma linha por atividade ("AGT-00X (planejada): ..." vira "AGT-00X (principal, AP-3): ...").

## Checklist ao transcrever a próxima atividade (AGT-008), com os textos atuais

Substituições por texto (`replaceAllText`, sem ler o documento), trocando o trecho atual pelo novo:

1. Resumo: `sete das 18 atividades previstas foram concluídas e classificadas (as sete aprovadas com intervenção humana,` → "oito ... as oito".
2. Abstract: `seven of the 18 planned activities have been completed and classified (all seven approved with human intervention,` → "eight ... all eight".
3. Seção 5.1: `e a AGT-007 foi executada em uma tentativa e classificada como AP-3; as demais atividades (AGT-008 a AGT-018) ainda não foram iniciadas.` → incluir a AGT-008 e passar a "AGT-009 a AGT-018".
4. Seção 6.1: `sete atividades foram concluídas e classificadas: a AGT-001` → "oito"; o trecho final da lista (`, e a AGT-007, como AP-3, com uma tentativa e intervenção humana do tipo decisão sobre reservas, vagas e dinheiro (três decisões previstas na instrução).`) ganha a AGT-008.
5. Seção 6.1: `reaplicada nas AGT-001 a AGT-007 do experimento principal` → "a AGT-008".
6. Seção 6.1: `(n = 5 no piloto e n = 7 no experimento principal)` → "n = 8".
7. Seção 6.2: acrescentar a frase da AGT-008 antes de `Esses tempos não devem ser interpretados isoladamente`.
8. Seção 6.3: acrescentar a frase da AGT-008 antes de `Também foram encaminhados` (âncora atual: `e a atividade foi classificada como AP-3. Também foram encaminhados`).
9. Seção 6.4: `cinco atividades no piloto e sete classificadas no experimento principal` → "oito classificadas"; frase da AGT-008 ao fim das limitações (depois de `até a desistência do passageiro.`).
10. Capítulo 7: `tem, até o momento, sete atividades concluídas:` → "oito", acrescentando a AGT-008.
11. Apêndice D: `AGT-008 (planejada): RF-019, RF-021 e RF-022; RN-014, RN-015, RN-021 e RN-040.` → linha "principal" com evidência.

Itens com posição (exigem uma única leitura do documento, só para obter os índices):
- nova linha do Quadro 2 (última linha da tabela; hoje a AGT-007);
- novo parágrafo da Seção 5.3 (depois do parágrafo da AGT-007, que termina em "... e a classificação foi decidida pelo pesquisador.");
- nova ficha do Apêndice E (antes de "Ficha — Piloto (Codex), AGT-001").

Método que funcionou nas AGT-005 a AGT-007: ler uma vez (o aviso "result exceeds maximum allowed tokens" é esperado; o tamanho igual ao da leitura anterior prova que o pesquisador não editou o documento no intervalo), montar o lote com os índices, aplicar com requiredRevisionId, ler de novo e conferir os trechos.
Atenção ao inserir expressões regulares por script: a barra invertida se perdeu três vezes (AGT-005, AGT-006 e AGT-007); usar a ferramenta de edição direta e conferir com grep.
Se algum texto âncora não for único, o lote para sem alterar nada (aconteceu zero vezes até a AGT-007).

Última transcrição: 19/11/2026, AGT-007 (13 substituições, parágrafo da 5.3, ficha do Apêndice E e linha do Quadro 2, tudo conferido).

## Alterações feitas no Docs fora da sessão (registradas em 20/11/2026)

Aplicadas no Docs por você ou pelo assistente do Docs, sem passar por esta sessão. O texto vigente é o do Docs; o agente não as reaplica.

- Datas da Seção 5.1 e da fonte do Quadro 2: passaram para 19/11/2026.
- "pesquisadores" (plural) onde há classificação (Seções 5.1, 5.3, 6.3, fichas e Apêndice F).
- Seção 5.4 reescrita a partir da AGT-008 ("As próximas atividades… incluem, a partir da AGT-008…").
- "n = 5" e "n = 7" no Resumo, no Abstract, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7.
- Fichas AGT-001 e AGT-005 com os mesmos 20 campos da AGT-007.
- "independente" removido das fichas do piloto (resta uma ocorrência: "verificação auxiliar independente", ficha do piloto AGT-005; ver a auditoria).
- "[DADO NÃO REGISTRADO]" padronizado no Quadro 2.

Leitura de conferência em 20/11/2026: revisão `AHj4eMQd0z6vUApFjyR4F_CUXIR5w420Td8o86gjtwnOUZlv3pqm2fheaGdoqqnlhjrsoWLeJUVlU6UNPyFZ-S3N0L2vHQM2WDKkguIbDV8`, 842 parágrafos. Resultado completo em `TCC/relatorios/AUDITORIA-SINCRONIA-2026-11-20.md` (69 itens: 48 OK, 13 DIVERGE, 6 perguntas, 2 fora do alcance).

### Âncoras do checklist da AGT-008 que mudaram (as demais continuam únicas)

Os itens 3 a 8 e 11 acima continuam com 1 ocorrência cada. Os itens 1, 2, 9 e 10 têm hoje estes textos:

1. Resumo: `sete das 18 atividades previstas (n = 7) foram concluídas e classificadas (as sete aprovadas com intervenção humana,` → "oito ... (n = 8) ... as oito".
2. Abstract: `seven of the 18 planned activities (n = 7) have been completed and classified (all seven approved with human intervention,` → "eight ... (n = 8) ... all eight".
9. Seção 6.4: `5 atividades no piloto (n = 5) e 7 das 18 previstas classificadas no experimento principal (n = 7)` → "8 das 18 ... (n = 8)".
10. Capítulo 7: `tem, até o momento, 7 das 18 atividades previstas concluídas e classificadas pelos pesquisadores (n = 7):` → "8 ... (n = 8)", acrescentando a AGT-008.
Seção 5.1: além do item 3, o texto atual dá "7 das 18 atividades previstas estão concluídas e classificadas pelos pesquisadores (n = 7)": também passa a 8.
Seção 5.4 já diz "a partir da AGT-008"; ao concluir a AGT-008, reescrever para "a partir da AGT-009".

### Pendências de texto apontadas pela auditoria (aguardam suas respostas P1 a P6)

Resíduo "$1" no campo 18 das fichas AGT-001, 003, 004, 005, 006 e 007; "19 critérios" na ficha AGT-003 (são 20); Seção 4.7 sem "Sessão e token"; Seção 4.8 sem as decisões das AGT-001 a AGT-007; faixas de entradas do diário nas fichas.

## Prompt de correções gerado em 20/11/2026

**Aplicado e conferido em 20/11/2026** (releitura: revisão `AHj4eMQ5tijOXHoxMOFrh_8aZMV9zWHBDFxEbRu1pjMTDg7DY6uMrBQ0KWYU_kInkfKuIU2ltnN6hgiqdCp8DMyYTZcSElhPfYMCokkhW6I`, 842 parágrafos, mesmo total de antes; exatamente 11 parágrafos mudaram; os 11 textos propostos estão no Docs; sem "$1"; 20 critérios na AGT-003). Ressalva resolvida: a Seção 3.5 foi corrigida (opção A) para "20 campos nas fichas do experimento principal e 16 nas do piloto" e conferida por releitura (revisão `AHj4eMSdsYIMzO-PZXzVZPnKpsj5yD704n7d5A7I31dO2qc6noljk6Wb0a4t1pWHNGXmaNTOtTO4T8NNfwB002Xhhin7UINu4RBvBBHR7As`, 842 parágrafos, 1 parágrafo alterado); as 5 fichas do piloto em `docs/fichas-agt/piloto/` têm 16 campos.

`TCC/relatorios/PROMPT-CORRECOES-DOCS-2026-11-20.md`: 11 correções para o assistente do Docs aplicar (resíduo "$1" nas 6 fichas, 20 critérios na ficha AGT-003, Seções 4.7, 4.8 e 3.5, "independente" na ficha do piloto AGT-005). Após aplicar, reler o Docs e conferir; atualizar este arquivo.

## Pendências suas (pesquisador)

Atualizar o sumário do Docs (clique); escopo da AGT-005 em diante (corte proposto 24/11/2026); verificação real
do telefone e envio do token; DOIs das referências 1 e 8; segundo avaliador.

## AGT-008 (20/11/2026)

Prompt gerado: `TCC/relatorios/PROMPT-DOCS-AGT-008-2026-11-20.md` (19 trocas de texto, com âncoras conferidas uma a uma no Docs, e 3 inserções: parágrafo da 5.3, linha do Quadro 2 e ficha do Apêndice E). **Aplicado e conferido por releitura em 20/11/2026** (as 19 trocas e as 3 inserções estão no Docs; o parágrafo da 5.3 é idêntico ao do prompt; os 20 campos da ficha batem; 8 linhas do principal no Quadro 2; sem "$1" e sem "n = 7"; 843 parágrafos de corpo contra 820 antes, ou seja, mais 23: parágrafo da 5.3, parágrafo em branco, título e 20 campos da ficha; formatação igual à dos vizinhos). O texto abaixo descreve o que foi feito e serve de modelo para a AGT-009. Para a AGT-009: aplicar o prompt, reler o Docs, conferir os textos propostos e a contagem de parágrafos de corpo (a base agora é 843), e atualizar a tabela acima. Âncoras do checklist da AGT-009 (textos de depois da aplicação): Resumo "oito das 18 atividades previstas (n = 8) foram concluídas e classificadas (as oito aprovadas com intervenção humana,"; Abstract "eight of the 18 planned activities (n = 8) have been completed and classified (all eight approved with human intervention,"; 5.1 "8 das 18 atividades previstas estão concluídas e classificadas pelos pesquisadores (n = 8)" e "(AGT-009 a AGT-018) ainda não foram iniciadas."; 6.1 "oito atividades foram concluídas e classificadas"; 6.4 "8 das 18 previstas classificadas no experimento principal (n = 8)"; Capítulo 7 "tem, até o momento, 8 das 18 atividades previstas"; Apêndice D "AGT-009 (planejada): RF-023, RF-025 e RF-026; RN-011, RN-016 e RN-022."; Seção 5.4 "a partir da AGT-009, pagamentos".

## AGT-009 (20/11/2026)

Prompt gerado: `TCC/relatorios/PROMPT-DOCS-AGT-009-2026-11-20.md` (17 trocas de texto, com âncoras conferidas uma a uma no Docs, e 3 inserções: parágrafo da 5.3, linha do Quadro 2 e ficha do Apêndice E). Ainda **não aplicado**. Depois de aplicar: reler o Docs, conferir os textos propostos e a contagem de parágrafos de corpo (base atual: 843; esperado: mais 23, ou seja, 866 contando os da ficha, o parágrafo em branco e o da 5.3), e atualizar a tabela acima. Âncoras do checklist da AGT-010 (textos de depois da aplicação): Resumo "nove das 18 atividades previstas (n = 9)"; Abstract "nine of the 18 planned activities (n = 9)"; 5.1 "9 das 18 atividades previstas estão concluídas e classificadas pelos pesquisadores (n = 9)" e "(AGT-010 a AGT-018) ainda não foram iniciadas."; 6.1 "nove atividades foram concluídas e classificadas"; 6.4 "9 das 18 previstas classificadas no experimento principal (n = 9)"; Capítulo 7 "tem, até o momento, 9 das 18 atividades previstas"; Apêndice D "AGT-010 (planejada): RF-024, RF-027 e RF-028; RN-012, RN-013 e RN-017 a RN-020."; Seção 5.4 "a partir da AGT-010, pagamento parcelado".
