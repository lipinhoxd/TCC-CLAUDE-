# Banco de dados (AGT-002)

## Decisão (registrada com justificativa)

- **Banco:** SQLite, via `node:sqlite` (módulo integrado ao Node.js 26; SQLite 3.54.0 na máquina de
  desenvolvimento). **Acesso:** SQL direto, sem ORM. Decisão do pesquisador em 13/11/2026, a partir das
  opções e da recomendação apresentadas pelo agente (a resposta foi "a"; o agente a interpretou como
  "A, SQL direto").
- **Motivos:** roda sem instalar servidor (Docker e PostgreSQL não existem no ambiente); atende ao
  esquema, às transações e aos testes desta atividade; o esquema é pequeno e o SQL explícito é fácil
  de revisar.
- **Limitações:** um único escritor por vez e banco em arquivo local, o que restringe produção com
  várias instâncias. Migrar para PostgreSQL fica como trabalho futuro. O módulo `node:sqlite` é
  recente: conferir seu estágio de estabilidade na documentação do Node.js [A CONFERIR].

## Como usar

```bash
npm run db:migrate   # cria e atualiza o banco local
npm run db:reset     # apaga e recria do zero
```

`DATABASE_PATH` define o arquivo (padrão `data/excursoes.sqlite`; `:memory:` para banco temporário).
Os arquivos `*.sqlite`, `*.db` e a pasta `data/` não são versionados.

## Migrações

`server/db/migrations.ts` lista as migrações em ordem. Cada uma roda em uma transação própria; a
tabela `schema_migrations` guarda versão, nome, checksum (SHA-256) e data de aplicação. Rodar de novo
não altera nada. Migração já aplicada **não é editada** (o checksum detecta); mudanças viram uma
nova versão.

**Versão 2 (AGT-009):** `pagamento.pendencia_administrativa` (texto, nulo ou `confirmacao_sem_vaga`) e o índice parcial
`ix_pagamento_pendencia`. Sinaliza a confirmação financeira recebida sem vaga disponível (RN-022, RF-026), para a fila da administração
(AGT-012 e AGT-013). Não altera linhas existentes; a migração 1 não foi editada.

**Versão 3 (AGT-010):** `reserva.motivo_cancelamento` (texto, nulo ou `inadimplencia`). Marca a reserva parcelada cancelada pelo sistema no
vencimento da segunda parcela (RN-019, RN-020, RN-032); a primeira parcela fica confirmada e não reembolsável. Não altera linhas existentes. A AGT-013
reaproveita o motivo e, para novos motivos, precisará reconstruir a tabela, porque o SQLite não altera uma restrição `CHECK` no lugar.

## Esquema (versão 1)

Tabelas `STRICT`, chaves estrangeiras ligadas em cada conexão (`PRAGMA foreign_keys = ON`).

| Tabela | Observações |
| --- | --- |
| `usuario` | CPF (11 dígitos) e e-mail (minúsculas) únicos; perfil `passageiro` ou `administrador`; guarda só `senha_hash`. |
| `excursao` | `capacidade`, `vagas_ocupadas`, `preco_centavos`; `CHECK (vagas_ocupadas BETWEEN 0 AND capacidade)`; prazo da 2.ª parcela obrigatório e anterior à partida se houver parcelamento. |
| `reserva` | Situações da RN-023; índice único parcial: uma reserva não cancelada por passageiro e excursão. |
| `pagamento` | Parcela `unica`/`primeira`/`segunda`, uma por reserva; valor em centavos maior que zero. |
| `retencao_vaga` | Validade posterior à criação; no máximo uma retenção ativa por reserva. |
| `reembolso` | Valor em centavos; percentual de 0 a 100. |
| `auditoria` | Somente inclusão (gatilhos bloqueiam alteração e exclusão); JSON válido. |
| `sessao`, `token_acesso` | Apenas `token_hash`, validade e revogação/uso; nunca o segredo em claro. |

Convenções: dinheiro em **centavos inteiros** (RN-038; `STRICT` recusa decimais); instantes em texto
ISO 8601 **UTC** terminado em `Z` (RN-039; `CHECK` de formato); datas de calendário `AAAA-MM-DD`.

Situações da excursão (`rascunho`, `publicada`, `encerrada`, `cancelada`), de pagamento, retenção e
reembolso não estão definidas na especificação (a RN-037 está como "[confirmar]"). São valores
**provisórios** escolhidos nesta atividade; o pesquisador os confirmou em 13/11/2026.

## Capacidade e concorrência (RN-021, RN-040, RNF-008)

- **Garantia no banco:** `CHECK (vagas_ocupadas >= 0 AND vagas_ocupadas <= capacidade)`. Nenhuma
  operação, nem uma com defeito, consegue gravar ocupação acima da capacidade.
- **Como a AGT-008 deve ocupar vaga:** dentro de `withTransaction(db, fn)` (modo `IMMEDIATE`), com
  `UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ? AND vagas_ocupadas < capacidade`;
  `changes = 0` significa "sem vaga". A condição é reavaliada na gravação, então uma leitura antiga
  não causa excedente. Liberar vaga usa o mesmo padrão com `vagas_ocupadas > 0`.
- **Por que funciona no SQLite:** `BEGIN IMMEDIATE` adquire o bloqueio de escrita no início; escritas
  concorrentes esperam (`busy_timeout`) ou falham com "database is locked". Testado em
  `tests/db-concorrencia.test.ts` com duas conexões ao mesmo arquivo.
- **Implementado na AGT-008:** `server/vagas/disponibilidade.ts` (`disponibilidade`, `ocuparVaga`, `liberarVaga`, `expirarVencidas`).
  A retenção não altera `vagas_ocupadas`: a disponibilidade é capacidade menos ocupadas menos retenções `ativa` com `expira_em` no futuro.
  O banco ocupado além do `busy_timeout` de 5 s vira 503 `banco_ocupado` na API, sem nova tentativa automática.
- **Implementado na AGT-009:** `server/pagamentos/confirmacao.ts` converte a retenção em ocupação (`ocuparVaga` com a retenção consumida) na
  mesma transação que marca o pagamento e a reserva. Detalhes em `docs/reservas.md`.
- **Implementado na AGT-015 (migração 5):** tabelas `mensagem` (um aviso por registro de auditoria) e `comunicacao_marco` (até onde a
  auditoria já foi lida). Ver `docs/comunicacao.md`.
- **Implementado na AGT-014:** a rotina automática (`server/processos/`), que executa cada passo em sua própria transação
  `IMMEDIATE`, sem migração (ver `docs/processos-automaticos.md`). O contador `vagas_ocupadas`
  é mantido pela aplicação (não há gatilho que o recalcule a partir de reservas e retenções).

## Camada de acesso

Sem ORM: `server/db/` traz `connection.ts` (abre e configura), `migrate.ts`, `migrations.ts`,
`transaction.ts` (`withTransaction`: confirma ou desfaz tudo, modo `IMMEDIATE` por padrão; não admite
aninhamento), `audit.ts` (`registrarAuditoria`, que **rejeita** campos como senha, token, hash, CPF,
e-mail, telefone e nascimento, inclusive aninhados) e `cli.ts`. Repositórios por entidade e fluxos de
negócio ficam para as atividades seguintes.

## Testes

`tests/db-schema.test.ts`, `tests/db-transaction-audit.test.ts` e `tests/db-concorrencia.test.ts`
cobrem migrações (inclusive do zero em arquivo), restrições, transações com rollback, auditoria e
concorrência entre conexões. Todos os dados são fictícios.

**Versão 4 (AGT-013):** `reembolso.pagamento_id` e dois índices únicos (um reembolso de cancelamento por reserva; um por pagamento sinalizado). Não altera linhas existentes; ver [cancelamentos.md](cancelamentos.md).
