# Atualização do TCC após a avaliação da AGT-001 (experimento principal)

Data: 13/11/2026
Elaborado por: Claude Code (Claude Sonnet 5.5), por pedido dos pesquisadores.
Base: registro `TCC/registros-agente/AGT-001.md` (Tentativas 1 e 2, Seções 11 a 14, confirmadas
pelo pesquisador em 13/11/2026) e `TCC/metricas/METRICAS.csv`. Versão do TCC de referência: a
publicada no Google Docs após a adequação de 13/11/2026.

> **Status: APROVADO pelo pesquisador e APLICADO no Google Docs em 13/11/2026** (Seções 3.9, 5.1,
> 5.3, 6.1, 6.2, 6.3, 6.4 e 7), conforme o fluxo combinado (o agente escreve no projeto, o
> pesquisador aprova, o agente altera o documento). A classificação AP-3 e a justificativa são do
> pesquisador e foram transcritas; a redação das seções abaixo é do agente.

## Parte A — Seções afetadas

| Seção | O que muda |
| --- | --- |
| 5.1 Estado atual | AGT-001 já avaliada: AP-3. |
| 5.3 Experimento principal | Parágrafos da AGT-001 passam a relatar as duas tentativas, a intervenção e a classificação; some o marcador "[Avaliação humana ... a preencher]". |
| 6.1 Conjunto de dados | Experimento principal: 1 atividade classificada (AP-3). |
| 6.2 Contribuições | Remove a ressalva "só terá valor após a classificação". |
| 6.3 Papel da supervisão humana | Acrescenta o fato da intervenção na AGT-001. |
| 6.4 Limitações | Atualiza o tamanho do conjunto e acrescenta a não independência da Tentativa 2. |
| 7 Considerações parciais | Atualiza o estado do experimento principal. |
| 3.9 Ameaças à validade | Acrescenta a orientação do agente sobre a classificação. |

## Parte B — Textos propostos

### B.1 — Seção 5.1 (substitui o último período)

Substituir "Na data de 13/11/2026, a AGT-001 do experimento principal foi executada pelo agente e
aguarda avaliação humana; as demais atividades (AGT-002 a AGT-018) ainda não foram iniciadas." por:

Na data de 13/11/2026, a AGT-001 do experimento principal foi executada em duas tentativas,
avaliada e classificada como AP-3 pelo pesquisador; as demais atividades (AGT-002 a AGT-018) ainda
não foram iniciadas.

### B.2 — Seção 5.3, parágrafo "AGT-001 — Fundação técnica do projeto" (substitui o parágrafo, do "A atividade foi executada" em diante)

A atividade foi executada pelo Claude Code (modelo Claude Sonnet 5.5) em duas tentativas, com a
mesma instrução, em 11/11/2026 e 13/11/2026. A Tentativa 1 durou 3 min 13 s (de 23:29:11 a 23:32:24
de 11/11/2026). A Tentativa 2 foi refeita a pedido do pesquisador, para acompanhar a execução e
entender o que o agente faz antes de avaliá-la, e durou 8 min 8 s (de 16:16:20 a 16:24:28 de
13/11/2026), dos quais cerca de 4 min 50 s foram pausas combinadas com o pesquisador para decisões e
autorizações. Os valores incluem a latência das chamadas de ferramenta e não incluem a revisão
humana. A Tentativa 1 foi preservada no Git (commit 4cd310c e marcação agt-001-tentativa-1) e a
Tentativa 2 no commit d65d64f.

Na Tentativa 2, o agente apresentou ao pesquisador, antes de criar arquivos, as opções de
arquitetura (front-end com Vite sem framework, Vite com React ou Next.js; servidor com node:http ou
Fastify), com recomendação, e o pesquisador decidiu por Vite com React e servidor node:http, que
coincidiram com as opções recomendadas pelo agente. O agente criou a fundação técnica (front-end
React com Vite e TypeScript, servidor Node.js mínimo com a rota /api/health, ESLint, verificação de
tipos, Vitest, variáveis de ambiente com arquivo de exemplo e documentação de execução). O
TypeScript foi fixado na versão 6.0.3, porque a versão mais recente (7.0.2) não era aceita pelo
typescript-eslint.

Na Tentativa 2, lint, verificação de tipos e build passaram, e os 15 testes automatizados (4
arquivos) foram aprovados; as rotas da API e o servidor de desenvolvimento responderam como
esperado, mas não houve verificação visual em navegador. O npm audit aponta 10 vulnerabilidades de
severidade moderada, restritas a ferramentas de desenvolvimento, não corrigidas por exigirem
rebaixamento de versão maior. A Tentativa 2 não é independente da Tentativa 1, pois foi feita pelo
mesmo agente na mesma sessão. O agente não realizou commit nem classificou a atividade.

O pesquisador classificou a AGT-001 como AP-3 (aprovada com intervenção humana), com a
justificativa de que a atividade exigiu decisão de arquitetura do pesquisador (framework do
front-end e servidor) durante a execução. A avaliação humana foi redigida pelo agente a pedido do
pesquisador e confirmada por ele, sem alterações. Na planilha de métricas, a atividade consta com
duas tentativas e sem nova instrução, já que a instrução original foi mantida.

(Remover o parágrafo com o marcador "[Avaliação humana, intervenção humana, classificação ...
a preencher exclusivamente pelos pesquisadores ...]".)

### B.3 — Seção 6.1 (substitui o primeiro parágrafo)

Os dados são apresentados em dois conjuntos que não se misturam. No piloto com o Codex existem
cinco atividades concluídas e classificadas (AGT-001 a AGT-005): quatro AP-1 e uma AP-3, sem AP-2
nem RP. No experimento principal com o Claude Code, uma atividade foi concluída e classificada: a
AGT-001, como AP-3, com duas tentativas e uma intervenção humana do tipo decisão de arquitetura.
Esse quadro descreve apenas o conjunto parcial de dados, insuficiente para responder ao problema de
pesquisa.

### B.4 — Seção 6.2 (substitui o segundo período do primeiro parágrafo, a partir de "No experimento principal")

No experimento principal, a fundação técnica foi produzida pelo agente em cerca de 3 min 13 s na
primeira tentativa e, na segunda, em cerca de 3 min 18 s de execução, descontadas as pausas para o
pesquisador, com lint, verificação de tipos, testes e build aprovados. Esses tempos não devem ser
interpretados isoladamente como ganho de produtividade, pois a atividade foi classificada como AP-3
e não há grupo de controle.

### B.5 — Seção 6.3 (substitui o trecho "Na AGT-001 do experimento principal ... relevantes.")

Na AGT-001 do experimento principal, o agente levou à decisão do pesquisador a escolha de
framework e servidor, antes de criar arquivos, e o pesquisador decidiu entre as opções
apresentadas, o que resultou em AP-3. Também foram encaminhados à decisão humana o tratamento das
vulnerabilidades moderadas do npm audit e a leitura da instrução do piloto pelo agente ao adaptar
a instrução da AGT-001. O caso mostra que a necessidade de decisão humana pode surgir da própria instrução
(que manda levar decisões de arquitetura à avaliação), e não de um erro do agente.

### B.6 — Seção 6.4 (substitui o primeiro período)

A principal limitação é o tamanho do conjunto de dados: cinco atividades no piloto e uma
classificada no experimento principal, esta com a ressalva de que a segunda tentativa foi feita
pelo mesmo agente na mesma sessão da primeira e, portanto, não é independente dela.

### B.7 — Seção 7, segundo período do primeiro parágrafo (substitui "e o experimento principal tem, até o momento, a AGT-001 executada e pendente de avaliação humana")

e o experimento principal tem, até o momento, a AGT-001 concluída e classificada como AP-3.

### B.8 — Seção 3.9 (acrescentar ao fim do primeiro parágrafo)

Também constitui ameaça à validade o fato de o agente orientar o pesquisador, a pedido deste, na
escolha da classificação de cada atividade, explicando o que cada categoria significa e
recomendando uma opção; a decisão e a responsabilidade permanecem do pesquisador, mas a orientação
pode influenciar a classificação.

## Parte C — Pendências dos pesquisadores

1. Aprovar ou ajustar os textos da Parte B. Após a aprovação, o agente os aplica no Google Docs.
2. Confirmar a marcação dos critérios de aceitação da Seção 4 do `AGT-001.md` e decidir os três
   itens deixados sem marca.
3. Atualizar o número de página do sumário depois da edição, se necessário (o sumário é automático
   e é atualizado no Docs).
