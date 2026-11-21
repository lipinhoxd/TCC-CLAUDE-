# Prompt para o assistente do Google Docs: correções de sincronia (20/11/2026)

Cole o texto abaixo, a partir de "Tarefa", no assistente do Google Docs ("VERSÃO BASE DO TCC"). Origem: `TCC/relatorios/AUDITORIA-SINCRONIA-2026-11-20.md` (itens C1, C4, E5, E9 e E17). Este prompt contém 11 correções: as 10 que não dependem de respostas dos autores e a do item P5 (opção A, adotada como "recomendada" a partir do "ok" de 20/11/2026).

---

## Tarefa

Aplique no documento exatamente as 11 correções listadas abaixo. Não faça nenhuma outra alteração.

## Regras

1. Aplique somente o que está na lista. Não reescreva, não reformate e não corrija mais nada, mesmo que perceba outro erro. Se perceber, apenas informe ao final.
2. Em cada correção, localize o "texto atual" exato dentro do local indicado. Se o texto não existir ou não puder ser identificado de forma única nesse local, não aplique e informe qual correção parou.
3. Troque somente o trecho indicado, mantendo o restante do parágrafo, a fonte, o tamanho, o alinhamento e o espaçamento do parágrafo. O símbolo `$1` das correções 1 a 6 é texto literal (não é variável nem referência): procure e substitua como caracteres.
4. Preserve o padrão do documento: Times New Roman, justificado, terceira pessoa, "pesquisadores" no plural, números em algarismos. Não use "independente" para revisão ou verificação.
5. Não altere a numeração, os títulos nem os itens RF/RNF/RN dos apêndices.
6. Ao final, informe uma linha por correção: aplicada, ou não aplicada com o motivo.

## Correções

### Correção 1 (Apêndice E, "Ficha — Experimento principal, AGT-001", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 13/11/2026).`

### Correção 2 (Apêndice E, "Ficha — Experimento principal, AGT-003", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 13/11/2026; critério único: decisão exigida pela instrução = AP-3).`
- Atenção: o texto atual é igual ao da Correção 1. Altere apenas o que estiver dentro da ficha da AGT-003.

### Correção 3 (Apêndice E, "Ficha — Experimento principal, AGT-004", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1; critério único: decisão exigida pela instrução = AP-3).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 13/11/2026; critério único: decisão exigida pela instrução = AP-3).`

### Correção 4 (Apêndice E, "Ficha — Experimento principal, AGT-005", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1; critério único: decisão exigida pela instrução = AP-3).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 19/11/2026; critério único: decisão exigida pela instrução = AP-3).`

### Correção 5 (Apêndice E, "Ficha — Experimento principal, AGT-006", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1; critério único: decisão exigida pela instrução = AP-3).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 19/11/2026; critério único: decisão exigida pela instrução = AP-3).`

### Correção 6 (Apêndice E, "Ficha — Experimento principal, AGT-007", campo "Classificação final")
- Texto atual: `AP-3 (decisão dos pesquisadores, $1; critério único: decisão exigida pela instrução = AP-3).`
- Texto proposto: `AP-3 (decisão dos pesquisadores, 19/11/2026; critério único: decisão exigida pela instrução = AP-3).`

### Correção 7 (Apêndice E, "Ficha — Experimento principal, AGT-003", campo "Critérios de aceitação")
- Texto atual: `19 critérios`
- Texto proposto: `20 critérios`
- Troque apenas esse trecho; o restante da frase ("na Seção 4 do registro, todos marcados. ...") permanece.

### Correção 8 (Seção 4.7 "Modelo conceitual de dados", primeiro parágrafo, primeira frase)
- Texto atual: `O modelo conceitual inclui Usuário, Excursão, Reserva, Pagamento, Retenção de Vaga, Reembolso e registros de histórico ou auditoria.`
- Texto proposto: `O modelo conceitual inclui Usuário, Excursão, Reserva, Pagamento, Retenção de Vaga, Reembolso, registros de histórico ou auditoria e Sessão e token de acesso, estes últimos usados na autenticação.`

### Correção 9 (Seção 4.8 "Evolução técnica da implementação", segundo parágrafo, final)
- Texto atual (final do parágrafo, que começa com "No experimento principal, a tecnologia de persistência foi definida na AGT-002"): `... acompanhada da justificativa e da atividade em que a mudança ocorreu.`
- Ação: acrescentar, logo depois desse ponto final e no mesmo parágrafo, este texto (começando com um espaço):
  ` Nas atividades seguintes, o registro técnico acrescentou: Vite com React e servidor node:http (AGT-001); scrypt, cookie de sessão HttpOnly com hash do token no banco e token de recuperação de 30 minutos (AGT-003); roteador próprio sobre a History API e CSS puro (AGT-004); valores em centavos inteiros e instantes em UTC (AGT-005); divisão em parcelas com o centavo restante na segunda (AGT-007). Desde o esquema inicial (versão 1), nenhuma atividade criou migração.`

### Correção 10 (Apêndice E, "Ficha — Piloto (Codex), AGT-005", campo "Testes executados e resultado")
- Texto atual: `verificação auxiliar independente em 11/11/2026`
- Texto proposto: `verificação auxiliar em 11/11/2026`
- Troque apenas esse trecho; o restante do campo ("(Node v26.13.0, outro assistente de IA): 198 testes e typecheck aprovados..." ) permanece.

### Correção 11 (Seção 3.5 "Protocolo de coleta e registro", terceiro parágrafo)
- Texto atual: `com os campos: objetivo, instrução original, critérios de aceitação, testes, tentativas, duração, intervenção humana, versão do agente, ambiente, commit, evidências e classificação.`
- Texto proposto: `com 20 campos, entre os quais objetivo, instrução original, critérios de aceitação, testes, tentativas, duração, intervenção humana, versão do agente, ambiente, commit, evidências e classificação.`
- Troque apenas esse trecho; o restante do parágrafo permanece.

## Ao terminar

Releia os trechos alterados e confirme que: (a) não restou nenhum `$1` no documento; (b) a ficha da AGT-003 diz "20 critérios"; (c) a ficha do piloto AGT-005 não tem mais "independente"; as demais ocorrências (Seção 3.6 e Apêndice F, sobre o campo do segundo avaliador, e Seções 5.3 e 6.4, sobre a Tentativa 2 não ser independente da Tentativa 1) permanecem como estão; (d) a Seção 3.5 diz "com 20 campos, entre os quais"; (e) o documento não ganhou nem perdeu parágrafos além do pedido.
