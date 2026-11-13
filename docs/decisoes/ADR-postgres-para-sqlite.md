# ADR — Do PostgreSQL planejado para SQLite com `node:sqlite` (estudo piloto)

Data do registro: 13/11/2026. Elaborado pelo agente (Claude Code, Claude Sonnet 5.5), por pedido dos
pesquisadores. Fontes: TCC (Seções 3.3, 4.8 e 5), `docs/especificacao/01-VISAO-GERAL.md`. O
repositório do piloto **não foi reaberto**; o que ele poderia informar está marcado.

## Escopo

Esta decisão pertence ao **estudo piloto com o Codex**. No **experimento principal**, a tecnologia
de banco **ainda não foi decidida**: será apresentada ao pesquisador na AGT-002 (instrução aprovada,
`TCC/registros-agente/AGT-002.md`), e deve gerar um novo ADR.

## Contexto

O planejamento inicial considerava PostgreSQL. Na etapa de persistência do piloto (AGT-002 do piloto,
classificada AP-1), a implementação passou a usar SQLite por meio de `node:sqlite`, sem ORM (TCC,
Seções 3.3 e 4.8). O TCC registra a mudança como parte da evolução real do experimento, para que não
seja ocultada retroativamente.

## Decisão

Usar SQLite via `node:sqlite` (módulo integrado do Node.js), sem ORM, na persistência do piloto.

## Dados que o TCC não traz e que dependem do registro do piloto

| Item | Valor |
| --- | --- |
| Atividade em que ocorreu | AGT-002 do piloto |
| Quem decidiu (agente ou pesquisador) e em que momento | **[DADO NÃO REGISTRADO]** |
| Justificativa registrada na época | **[DADO NÃO REGISTRADO]** |
| Versão do Node.js do piloto | **[DADO NÃO REGISTRADO]** |
| Versão do agente (Codex e modelo) do piloto | **[DADO NÃO REGISTRADO]** |
| Condições de execução do piloto (sistema, extensão do VS Code) | **[DADO NÃO REGISTRADO]**; o TCC cita Codex integrado ao Visual Studio Code |
| Hash do commit da AGT-002 do piloto | **[DADO NÃO REGISTRADO]** |

## Consequências técnicas (análise do agente, não medida)

Estas observações são conhecimento técnico geral sobre SQLite e **não foram testadas no projeto**.
Devem ser conferidas na documentação oficial do SQLite e do Node.js ([A CONFERIR]) antes de
citadas no TCC.

- **Concorrência de escrita:** o SQLite permite um único escritor por vez no mesmo banco; escritas
  concorrentes são serializadas. Isso simplifica a garantia de consistência, mas limita o
  paralelismo de escrita.
- **Transações:** operações críticas (retenção e confirmação de vagas) precisam ficar dentro de
  transações com o modo de bloqueio adequado, para atender RN-021 (capacidade), RN-040
  (concorrência) e RNF-009 (consistência). A estratégia exata é objeto da AGT-008.
- **Implantação:** banco em arquivo local, sem servidor separado; adequado ao ambiente de
  desenvolvimento e de pesquisa, e a avaliar para um ambiente de produção com várias instâncias.
- **Disponibilidade do módulo:** `node:sqlite` é módulo integrado do Node.js; a versão mínima e o
  estágio de estabilidade devem ser conferidos na documentação do Node.js para a versão usada
  ([A CONFERIR]).

## Relação com o experimento principal

Como o experimento principal recomeçou do zero, esta decisão **não é herdada**. A AGT-002 do
principal exige que o agente apresente opções (por exemplo SQLite ou PostgreSQL) e pare para
decisão do pesquisador.
