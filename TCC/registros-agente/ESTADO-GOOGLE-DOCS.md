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

Critério único de classificação (AP-3 quando a instrução manda parar e a atividade só prossegue com
decisão do pesquisador) está na rubrica, na Seção 6.3 e no Apêndice F do Docs.

## Onde cada coisa está no Docs (ordem)

- **Quadro 2:** 4 linhas do piloto (AGT-001 a 005) e depois as do principal, em ordem; a nova linha entra no fim.
- **Seção 5.3:** um parágrafo por atividade do principal, em ordem; o parágrafo novo entra depois do último
  (hoje AGT-006), separado por um parágrafo em branco.
- **Apêndice E:** fichas do principal (AGT-001 a 006) antes das fichas do piloto; a nova ficha entra antes de
  "Ficha — Piloto (Codex), AGT-001".
- **Apêndice D:** uma linha por atividade ("AGT-00X (planejada): ..." vira "AGT-00X (principal, AP-3): ...").

## Checklist ao transcrever a próxima atividade (AGT-007), com os textos atuais

Substituições por texto (`replaceAllText`, sem ler o documento), trocando o trecho atual pelo novo:

1. Resumo: `seis das 18 atividades previstas foram concluídas e classificadas (as seis aprovadas com intervenção humana,` → "sete ... as sete".
2. Abstract: `six of the 18 planned activities have been completed and classified (all six approved with human intervention,` → "seven ... all seven".
3. Seção 5.1: `e a AGT-006 foi executada em uma tentativa e classificada como AP-3; as demais atividades (AGT-007 a AGT-018) ainda não foram iniciadas.` → incluir a AGT-007 e passar a "AGT-008 a AGT-018".
4. Seção 6.1: `seis atividades foram concluídas e classificadas: a AGT-001` → "sete"; o trecho final da lista (`, e a AGT-006, como AP-3, com uma tentativa e intervenção humana do tipo decisão sobre o que o público vê (três decisões previstas na instrução).`) ganha a AGT-007.
5. Seção 6.1: `reaplicada nas AGT-001 a AGT-006 do experimento principal` → "a AGT-007".
6. Seção 6.1: `(n = 5 no piloto e n = 6 no experimento principal)` → "n = 7".
7. Seção 6.2: acrescentar a frase da AGT-007 antes de `Esses tempos não devem ser interpretados isoladamente`.
8. Seção 6.3: acrescentar a frase da AGT-007 antes de `Também foram encaminhados` (âncora atual: `e a atividade foi classificada como AP-3. Também foram encaminhados`).
9. Seção 6.4: `cinco atividades no piloto e seis classificadas no experimento principal` → "sete classificadas"; frase da AGT-007 ao fim das limitações (depois de `e as imagens reais dependem do pesquisador.`).
10. Capítulo 7: `tem, até o momento, seis atividades concluídas:` → "sete", acrescentando a AGT-007.
11. Apêndice D: `AGT-007 (planejada): RF-018 a RF-020; RN-009 e RN-010.` → linha "principal" com evidência.

Itens com posição (exigem uma única leitura do documento, só para obter os índices):
- nova linha do Quadro 2 (última linha da tabela; hoje a AGT-006);
- novo parágrafo da Seção 5.3 (depois do parágrafo da AGT-006, que termina em "... e a classificação foi decidida pelo pesquisador.");
- nova ficha do Apêndice E (antes de "Ficha — Piloto (Codex), AGT-001").

Atenção ao inserir expressões regulares por script: a barra invertida se perdeu duas vezes (AGT-005 e AGT-006); conferir com grep.
Depois de cada lote: reler e conferir só os trechos alterados, e listar a conferência ao pesquisador.
Se algum texto âncora não for único, o lote para sem alterar nada (aconteceu zero vezes até a AGT-006).

Última transcrição: 19/11/2026, AGT-006 (13 substituições, parágrafo da 5.3, ficha do Apêndice E e linha do Quadro 2, tudo conferido).

## Pendências suas (pesquisador)

Atualizar o sumário do Docs (clique); escopo da AGT-005 em diante (corte proposto 24/11/2026); verificação real
do telefone e envio do token; DOIs das referências 1 e 8; segundo avaliador.
