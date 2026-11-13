# Diário passo a passo do agente

Registro cronológico das ações do agente (Claude Code, modelo Claude Sonnet 5.5,
`claude-sonnet-5-5`) neste repositório. Serve como fonte de dados para a documentação do TCC.

Convenções:
- Horários vêm do relógio do sistema (fuso -03:00). Entradas 1 a 3 foram escritas depois dos
  fatos, numa única gravação às 15:08; por isso não têm horário individual medido, só a ordem.
- Cada entrada descreve apenas o que o agente fez e observou. Avaliação humana e classificação
  (AP-1, AP-2, AP-3, RP) são exclusivas dos pesquisadores e não aparecem aqui.
- Este diário não substitui os registros `AGT-XXX.md`.
- **Local da documentação (decisão do pesquisador, 13/11/2026):** toda a documentação fica
  dentro do projeto, no padrão já existente (`TCC/registros-agente/`, `TCC/documentos/`,
  `TCC/metricas/`, `TCC/evidencias/`, `TCC/relatorios/`). A transcrição para o TCC é feita
  depois, pelos pesquisadores. Não há espelhamento no Google Docs.

Formato de cada entrada: pedido, ações, arquivos lidos, arquivos criados/alterados, comandos,
resultado, pendências.

---

## Entrada 1 — Pedido de verificação do que já existe
**Horário:** não medido (retroativo; antes de 15:08 de 13/11/2026)

**Pedido do pesquisador:** verificar o que já está desenvolvido; o arquivo do TCC seria enviado
depois, com mais instruções.

**Ações:**
- Listou os arquivos versionados e não versionados do repositório (git e `find`).
- Leu `package.json` e o histórico de commits (`git log`).
- Leu `README.md`, `CLAUDE.md`, `TCC/registros-agente/AGT-001.md`,
  `docs/especificacao/07-PLANO-DE-ATIVIDADES.md` e `TCC/metricas/METRICAS.csv`.

**Arquivos criados/alterados:** nenhum.

**Resultado (o que o agente informou):**
- Um único commit (`BASELINE`). Código da AGT-001 presente, mas não commitado.
- O registro AGT-001 tem as seções 11 a 13 (avaliação, intervenção, classificação) em branco e
  os checkboxes da seção 4 desmarcados. `METRICAS.csv` só tem cabeçalho.
- O agente não executou lint, testes nem build; repassou apenas os resultados registrados em
  AGT-001.

**Pendências:** envio do arquivo do TCC pelo pesquisador.

---

## Entrada 2 — Contexto e pedido de registro passo a passo
**Horário:** não medido (retroativo)

**Pedido do pesquisador:** o projeto é o TCC; a plataforma se chama BPM Trip; tudo que o agente
fizer deve gerar um arquivo passo a passo, conectado ao Gmail, para servir de dados e ser
transcrito no TCC.

**Ações:**
- Não executou ferramentas. Respondeu que não há conector de Gmail nesta sessão; só Google Docs
  (editar documento existente) e Claude Docs. Propôs registro local no repositório mais
  espelhamento no Google Docs e pediu o link do documento.

**Arquivos lidos/criados/alterados:** nenhum.

**Pendências:** link do documento do Google Docs (não informado até agora).

---

## Entrada 3 — Formato do registro confirmado
**Horário:** não medido (retroativo)

**Pedido do pesquisador:** confirmou o formato (horário pelo relógio do sistema, o que foi
pedido, o que o agente fez, arquivos lidos e demais ações). Explicou que a pesquisa é de
desenvolvimento prático de plataforma web com IA generativa, e o diário será documentado no TCC.

**Ações:** nenhuma além da resposta; seguiu para a Entrada 4.

---

## Entrada 4 — Criação deste diário
**Horário:** 2026-11-13T15:08:05-03:00 (leitura do relógio do sistema, comando `date`)

**Pedido do pesquisador:** o mesmo da Entrada 3; começar a gerar o arquivo.

**Ações:**
- Leu o relógio do sistema com `date`.
- Criou este arquivo e registrou retroativamente as Entradas 1 a 3.

**Arquivos criados:** `TCC/registros-agente/DIARIO-PASSO-A-PASSO.md`.
**Arquivos alterados:** nenhum. Nenhum commit realizado.

**Pendências:**
- (Superada na Entrada 5) Espelhar o diário no Google Docs.
- Receber o arquivo do TCC e as próximas instruções.

---

## Entrada 5 — Documentação apenas dentro do projeto
**Horário:** 2026-11-13T15:09:48-03:00 (comando `date`)

**Pedido do pesquisador:** fazer toda a documentação dentro do projeto, seguindo o padrão que já
existe, e transcrever depois para o TCC.

**Ações:**
- Leu `TCC/MODELO-REGISTRO-AGT.md` e `TCC/documentos/BASELINE-EXPERIMENTO.md` para identificar
  o padrão: texto em português, datas no formato DD/MM/AAAA, registros de atividade em
  `TCC/registros-agente/`, documentos metodológicos em `TCC/documentos/`.
- Leu o relógio do sistema com `date`.
- Alterou o cabeçalho deste diário para registrar a decisão de manter a documentação só no
  projeto, sem espelho no Google Docs.

**Arquivos lidos:** `TCC/MODELO-REGISTRO-AGT.md`, `TCC/documentos/BASELINE-EXPERIMENTO.md`.
**Arquivos alterados:** `TCC/registros-agente/DIARIO-PASSO-A-PASSO.md` (arquivo criado por este
agente na Entrada 4; nenhum registro anterior do experimento foi modificado).

**Observação para revisão:** o modelo `MODELO-REGISTRO-AGT.md` menciona o Codex nas seções 5 e
10 (herança do piloto). Não foi alterado; apenas registrado aqui.

**Pendências:** receber o arquivo do TCC e as próximas instruções. Nenhum commit realizado.

---

## Entrada 6 — Leitura do TCC (Google Docs) e comparação com o estado do projeto
**Horário:** 2026-11-13T15:10:59-03:00 (comando `date`, no início da leitura)

**Pedido do pesquisador:** a partir do link do Google Docs com o TCC, verificar até onde a parte
escrita está e em que ponto o projeto está. O desenvolvimento passa a ser feito só com o Claude
Code; não recomeçar o projeto do zero; refazer a documentação da parte de desenvolvimento sem o
Codex.

**Ações:**
- Primeira chamada ao conector Google Docs (`read_doc`) com o parâmetro errado (`url`): erro HTTP
  400. Corrigida para `documentId`.
- A leitura devolveu um JSON grande (451 mil caracteres) salvo em arquivo temporário. O agente
  extraiu o texto puro com um script Node (Python não está instalado) para o diretório de
  trabalho temporário da sessão e leu o texto inteiro (472 linhas, cerca de 58 mil caracteres).
- Comparou o texto do TCC com o estado do repositório levantado nas Entradas 1 e 5.

**Arquivos lidos:** documento Google Docs "VERSÃO BASE DO TCC 1" (aba única "TCC"), somente
leitura. O documento não foi alterado.
**Arquivos criados fora do projeto (temporários):** `ext.mjs` e `tcc.txt` no diretório
temporário da sessão.
**Arquivos do projeto alterados:** apenas este diário. Nenhum commit.

**Resultado (o que o agente informou ao pesquisador):** ver a resposta da sessão. Em resumo:
- Capítulos 1 a 4 e a Seção 2.8, 3.2, 3.3 e 3.9 já mencionam o reinício com o Claude Code em
  11/11/2026. Os Capítulos 5, 6 e 7 ainda descrevem apenas o piloto com o Codex (AGT-001 a
  AGT-005) como "estágio atual".
- Projeto: AGT-001 do experimento principal executada (Claude Sonnet 5.5, 3 min 13 s), aguardando
  avaliação humana; AGT-002 a AGT-018 não iniciadas.

**Pendências:** decisões do pesquisador sobre como reorganizar os Capítulos 5 a 7 (ver resposta).

---

## Entrada 7 — Adequação do TCC ao estado do projeto
**Horário:** 2026-11-13T15:17:59-03:00 (comando `date`, durante as verificações); texto final
gravado logo em seguida, sem nova leitura do relógio.

**Pedido do pesquisador:** deixar o TCC e o projeto 100% alinhados, fazer o que o agente
propôs e perguntar o que precisar.

**Ações:**
- Contou os requisitos e regras da especificação (`docs/especificacao/02`, `03`, `04`) por
  `grep`: 42 RF, 33 RNF e 44 RN, iguais ao Capítulo 4 do TCC.
- Procurou menções a banco de dados na especificação: `01-VISAO-GERAL.md` deixa a escolha para a
  AGT-001/AGT-002; o TCC (Seções 3.3 e 4.8) afirma SQLite, que vem do piloto.
- Listou os itens **[confirmar]** abertos (RN-007, RN-036, RN-037, situações da excursão).
- Escreveu `TCC/relatorios/ADEQUACAO-TCC-AO-PROJETO.md`: tabela de divergências (Parte A), textos
  propostos para as Seções 3.3, 4.8 e Capítulos 5, 6 e 7 (Parte B) e pendências dos
  pesquisadores (Parte C). Decisão do agente: manter o piloto como seção curta do Capítulo 5
  (opção que o agente recomendou e o pesquisador autorizou ao dizer "faz o que você está
  propondo").

**Arquivos lidos:** `docs/especificacao/01` a `05` (parcialmente, por busca).
**Arquivos criados:** `TCC/relatorios/ADEQUACAO-TCC-AO-PROJETO.md`.
**Arquivos alterados:** este diário. O Google Docs do TCC não foi alterado. Nenhum commit.

**Limites:** os textos propostos não foram aprovados. A AGT-001 do experimento principal não foi
avaliada nem classificada pelo agente. Os dados do piloto foram copiados do próprio TCC, sem
conferência com o repositório do piloto, que o agente não abriu (regra 8 do `CLAUDE.md`).

**Pendências:** ver Parte C do arquivo de adequação.

---

## Entrada 8 — Fluxo combinado: desenvolver, relatar, aprovar, alterar o documento
**Horário:** 2026-11-13T15:24:47-03:00 (comando `date`)

**Pedido do pesquisador:** (a) aplicar os textos direto no Google Docs, já que o link foi
enviado; (b) em mensagem seguinte, definiu o fluxo de trabalho: o agente desenvolve, faz o
relatório, o pesquisador aprova e só então o agente altera o documento.

**Ações:**
- Carregou o esquema da ferramenta `update_doc` do Google Docs e mapeou os índices dos
  parágrafos (seções 3.3, 4.8, Capítulos 5, 6 e 7) a partir da leitura já feita, somente para
  preparar a edição.
- Ao receber o fluxo (b), **não aplicou nenhuma alteração** no Google Docs: os textos de
  `TCC/relatorios/ADEQUACAO-TCC-AO-PROJETO.md` ainda não foram aprovados.

**Arquivos do projeto alterados:** este diário. Google Docs: nenhuma alteração. Nenhum commit.

**Pendências:** aprovação (ou ajustes) dos textos da Parte B do relatório de adequação; depois
disso, o agente aplica no documento.

---

## Entrada 9 — Aplicação dos textos aprovados no Google Docs
**Horário:** 2026-11-13T15:29:23-03:00 (comando `date`, ao final da aplicação)

**Pedido do pesquisador:** aprovou todos os textos da Parte B de
`TCC/relatorios/ADEQUACAO-TCC-AO-PROJETO.md`, aprovou a atualização do sumário e confirmou a
data de corte (24/11/2026); autorizou alterar o documento.

**Ações (documento Google Docs "VERSÃO BASE DO TCC 1", aba t.0):**
- Releu o documento (revisão idêntica à da primeira leitura) e remapeou os índices.
- Gerou por script os pedidos de edição a partir do texto aprovado e aplicou, de baixo para cima,
  em 4 chamadas ao `update_doc`: (1) Capítulos 7 e 6; (2) Capítulo 5; (3) Seção 4.8 (2º
  parágrafo), Seção 3.3 (2º parágrafo) e as linhas do sumário do Capítulo 5; (4) correção de
  formatação dos títulos novos (fonte 12 pt Times New Roman, negrito), que haviam perdido o
  tamanho de fonte ao receber o estilo de título. Todas retornaram sem erros.
- Releu o documento e conferiu: títulos 5.1 a 5.4 e 6.1 a 6.5 como HEADING_2, Capítulos 5, 6 e 7
  e demais seções sem alteração fora do pretendido.
- Removeu do texto aplicado as notas editoriais "[Atualizar ...]" e "[Confirmar a data de
  corte.]"; manteve o marcador "[Avaliação humana ... a preencher ...]" da Seção 5.3, porque a
  AGT-001 ainda não foi avaliada.

**Arquivos do projeto alterados:** este diário. O relatório de adequação não foi reescrito; a
diferença acima está registrada aqui.
**Google Docs alterado:** sim, nos trechos listados. Histórico de versões do Docs permite
reverter.

**Pendências:**
- Números de página do sumário: 5.2, 5.3 e 5.4 ficaram em branco; os demais mantiveram os
  valores antigos, que podem estar desatualizados. Conferir no Google Docs.
- Avaliação, classificação, commit e `METRICAS.csv` da AGT-001 (pesquisadores).
- Itens **[confirmar]** da especificação.

---

## Entrada 10 — Explicação das pendências e novo envio do link
**Horário:** 2026-11-13T15:33:34-03:00 (comando `date`)

**Pedido do pesquisador:** (a) explicar, uma de cada vez e em detalhe, o que o agente precisa que
ele responda sobre o sumário, a AGT-001 e a especificação; (b) em seguida, reenviou só o link do
Google Docs, sem texto.

**Ações:**
- Explicou o primeiro item (sumário): o sumário é texto digitado, o agente não enxerga a
  paginação, e os números de página precisam vir do pesquisador (ou ele mesmo ajusta no Docs).
  A AGT-001 e a especificação ainda não foram explicadas (aguardando o pesquisador).
- Reabriu o documento pelo link. A revisão é idêntica à gravada ao final da Entrada 9, ou seja,
  nada foi alterado no documento desde então. Linhas 5.2, 5.3 e 5.4 do sumário continuam sem
  número de página.

**Arquivos alterados:** este diário. Google Docs: nenhuma alteração. Nenhum commit.

**Pendências:** o pesquisador informar os números de página (ou dizer que ajusta sozinho).

---

## Entrada 11 — Sumário colado pelo pesquisador
**Horário:** 2026-11-13T15:35:33-03:00 (comando `date`)

**Pedido do pesquisador:** colou no chat uma lista de títulos com números de página, depois dos
passos de inserir um sumário temporário no Docs.

**Ações:** comparou a lista com o sumário manual do documento. É idêntica a ele: mesmos números
antigos e as linhas 5.2, 5.3 e 5.4 ainda em branco. Concluiu que a lista colada veio do sumário
manual existente, não do sumário temporário. Nada foi alterado no Google Docs.

**Arquivos alterados:** este diário. Nenhum commit.

**Pendências:** obter os números de página reais (sumário temporário) ou o ajuste feito pelo
pesquisador.

---

## Entrada 12 — Números de página informados e erro do agente no sumário
**Horário:** 2026-11-13T15:39:17-03:00 (comando `date`)

**Pedido do pesquisador:** informou que 5 e 5.2 estão na página 30, 6 na 34, 7 na 36 e Referências
"provavelmente" na 38.

**Ações:**
- Enviou 6 substituições de texto no Google Docs (`replaceAllText`) para colocar esses números
  no sumário manual. Só a do item 5.2 teve efeito (1 ocorrência); as outras 5 não encontraram
  texto.
- Releu o documento e viu que o pesquisador já havia substituído o sumário manual por um sumário
  automático do Google Docs. A substituição do item 5.2 atingiu a linha desse sumário
  automático, que já continha "30", e produziu "3030".
- **Erro do agente:** o agente não verificou, antes de enviar as substituições, se o documento
  tinha mudado desde a última leitura. Corrigiu "3030" para "30" com nova substituição (1
  ocorrência alterada).
- O sumário automático, como lido, mostrava: 5 → 30, 5.1 → 30, 5.3 → 31, 5.4 → 33, 6 → 34,
  7 → 36, Referências sem número, e "1. ITRODUÇÃO" (sem o N). O corpo do documento tem o título
  correto "1. INTRODUÇÃO"; a linha do sumário deve ser regenerada pelo Docs.

**Arquivos alterados:** este diário. Google Docs: apenas a linha 5.2 do sumário (erro e correção).
Nenhum commit.

**Pendências:** o pesquisador clicar em "Atualizar sumário" no Docs (atualiza números e o erro de
digitação na linha 1) e conferir Referências.

---

## Entrada 13 — Referências no sumário e explicação da AGT-001
**Horário:** 2026-11-13T16:10:56-03:00 (comando `date`)

**Pedido do pesquisador:** informou que, após atualizar o sumário, Referências aparece na página 37
e perguntou por que não tem número de capítulo (como "8.").

**Ações:** respondeu que Referências é elemento pós-textual sem numeração, prática usual em
trabalhos acadêmicos brasileiros (ABNT), e que o título está centralizado e sem número no corpo,
como esperado. Explicou em seguida o que o pesquisador deve responder sobre a AGT-001. Nenhum
arquivo ou documento alterado, exceto este diário. Nenhum commit.

**Pendências:** respostas do pesquisador sobre a AGT-001 (avaliação, três decisões, intervenção,
classificação, commit).

---

## Entrada 14 — Reexecução das verificações da AGT-001
**Horário:** 2026-11-13T16:11:52-03:00 (início, comando `date`) a 2026-11-13T16:12:07-03:00 (fim
dos testes, build) mais a verificação da API e do `npm audit` logo em seguida.

**Pedido do pesquisador:** "fazer de novo" a AGT-001 para ter uma noção mais clara. O agente
interpretou como reexecutar as verificações técnicas (opção oferecida na Entrada 13), sem refazer
a atividade nem alterar código; o sentido exato do pedido foi confirmado depois com o pesquisador.

**Comandos executados** (ambiente: Node.js v26.13.0, npm 11.20.0, Windows 11): `npm run lint`;
`npm run typecheck`; `npm test`; `npm run build`; `node server/main.ts` com `curl` em
`/api/health` e `/api/x`; `npm audit`; `npm audit --omit=dev`; `git check-ignore`; `git ls-files
--others --exclude-standard`.

| Verificação | Resultado observado |
| --- | --- |
| Lint | Passou, sem avisos. |
| Verificação de tipos | Passou. |
| Testes | 3 arquivos, 13 testes, todos aprovados (426 ms). |
| Build | Passou (6 módulos). |
| API `/api/health` | 200, `{"status":"ok"}`, `Cache-Control: no-store`. |
| Rota inexistente | 404. |
| `npm audit` | 10 vulnerabilidades moderadas (ferramentas de desenvolvimento). |
| `npm audit --omit=dev` | 0 vulnerabilidades. |
| Arquivos ignorados pelo Git | `.env`, `.env.local`, `node_modules`, `dist` ignorados; só `.env.example` aparece como não rastreado. |

Os resultados coincidem com os registrados no `AGT-001.md`. O servidor da API iniciado pelo agente
para o teste foi encerrado ao final (a porta 3001 deixou de responder).

**Arquivos alterados:** este diário. O código não foi alterado. A pasta `dist` foi regenerada pelo
build (ignorada pelo Git). Nenhum commit.

**Limites:** esta reexecução não é uma nova tentativa da AGT-001 e não altera o registro nem as
métricas. Não houve verificação visual no navegador.

---

## Entrada 15 — Pedido para refazer a AGT-001 (aguardando decisões)
**Horário:** 2026-11-13T16:14:05-03:00 (comando `date`)

**Pedido do pesquisador:** refazer a atividade AGT-001 para acompanhar e entender o que o agente
faz, a fim de poder avaliá-la. A mensagem chegou cortada ("Olha,").

**Ações:** nenhuma alteração no projeto. O agente não iniciou a nova execução, porque ela
(a) apagaria ou sobrescreveria arquivos da Tentativa 1 que ainda não foram commitados; (b) cria
uma Tentativa 2 que afeta as métricas; e (c) exige definir qual instrução será usada (regra 1 do
`CLAUDE.md`: a instrução da Seção 5 não é alterada). Perguntou ao pesquisador como preservar a
Tentativa 1, qual instrução usar, como acompanhar a execução e o que a mensagem cortada dizia.

**Registro de ameaça à validade a considerar:** a Tentativa 2 será feita pelo mesmo agente, na
mesma sessão, que já viu o resultado da Tentativa 1.

**Arquivos alterados:** este diário. Nenhum commit.

---

## Entrada 16 — Preservação da Tentativa 1 da AGT-001 no Git
**Horário:** 2026-11-13T16:15:28-03:00 (início, comando `date`); fechamento deste registro: 2026-11-13T16:15:51-03:00

**Pedido do pesquisador:** refazer a AGT-001 com (1A) commit da Tentativa 1 antes de refazer,
(2A) a mesma instrução da Seção 5 do registro, sem alterações, e (3A) acompanhamento passo a
passo, com pausas nos pontos-chave.

**Ações:**
- Conferiu o estado do Git: 17 itens não commitados da Tentativa 1 mais 3 arquivos de
  documentação.
- Verificou que não há `user.name`/`user.email` configurados no Git. Para não alterar a
  configuração do pesquisador, usou `-c user.name` e `-c user.email` apenas nos comandos de
  commit, com o mesmo autor do commit de linha de base (Felipe Othon Tenório).
- Commit do código da Tentativa 1: `4cd310c` "AGT-001: tentativa 1 - fundacao tecnica do
  projeto" (apenas os arquivos de código e configuração; `.env` e similares não entram).
- Commit de documentação e tag, descritos abaixo.

**Arquivos lidos:** nenhum conteúdo de código. **Arquivos criados/alterados:** este diário.

**Decisão registrada:** a Tentativa 2 será feita sem reabrir os arquivos da Tentativa 1 (o agente
não leu o código dela nesta etapa, mas já viu os resultados e o relatório na mesma sessão; isso é
ameaça à validade).
