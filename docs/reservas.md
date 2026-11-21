# Reservas (AGT-007, AGT-008 e AGT-009)

Solicitação de reserva individual do passageiro e checkout (RF-018 a RF-020), sobre as tabelas `reserva`, `excursao`,
`retencao_vaga` e `auditoria`. **O pagamento em duas parcelas ainda não existe** (AGT-010): criar a
reserva não altera `vagas_ocupadas` e não cria linhas em `pagamento`; o pagamento integral (AGT-009) só nasce no checkout. Desde a AGT-008, **abrir o checkout inicia a retenção
temporária da vaga** (seção "Retenção temporária de vaga" abaixo).

## Decisões do pesquisador (19/11/2026, "todas as recomendadas")

| Ponto | Decisão |
| --- | --- |
| Quando a reserva existe | Ao solicitar: nasce em "Aguardando pagamento" (RN-023). O checkout é a página seguinte. |
| Desistência | O passageiro pode desistir enquanto a reserva aguardar pagamento **e** não houver nenhum pagamento. Ela vira "Cancelada" (auditada), e o índice único deixa de bloqueá-lo. |
| Reservas pendentes | No máximo **3** em "Aguardando pagamento" por passageiro (a 4ª recebe 409). Uma reserva abandonada fica até o passageiro desistir ou até a expiração das AGT-008 e AGT-014. |
| Parcelas | Primeira = metade do total arredondada para baixo; segunda = total menos a primeira. O centavo que sobra de um total ímpar fica na última parcela, e a soma é sempre igual ao total (R$ 150,01 vira R$ 75,00 e R$ 75,01). |
| Modalidade | Escolhida na solicitação (integral por padrão) e **sem troca** depois; para mudar, desiste e reserva de novo. Parcelada só se a excursão a habilita e o prazo da segunda parcela (23:59:59 da data configurada, em Brasília) ainda não passou. |
| Disponibilidade | Solicitação recusada (409 `sem_vagas`) com zero vagas livres. Várias reservas pendentes podem existir para a mesma última vaga; a pendente não segura vaga, quem abre o checkout primeiro a retém (AGT-008). |

## Quem pode o quê

Só o perfil **passageiro**, verificado no servidor a cada requisição e **antes** de ler o corpo (função `authorize` da
AGT-003): visitante recebe 401 e administrador 403. O passageiro vem da sessão; o corpo não escolhe o passageiro, a
situação nem valores (`campo_nao_permitido`).

## Rotas

| Método e caminho | Resultado |
| --- | --- |
| `POST /api/reservas` | Corpo `{ "excursao_id": 7, "modalidade": "integral" \| "parcelada" }` (modalidade opcional). 201 com a reserva. |
| `GET /api/reservas/:id` | A própria reserva, com o resumo de valores. De outra pessoa ou inexistente: 404 `nao_encontrada` (a mesma resposta). |
| `POST /api/reservas/:id/checkout` | (AGT-008) Inicia ou retoma a retenção temporária da vaga. 200 com a reserva e a `retencao`. |
| `POST /api/reservas/:id/pagamento` | (AGT-009) Inicia ou retoma o pagamento integral. Exige retenção ativa. 200 com a reserva e o `pagamento`. |
| `POST /api/reservas/:id/pagamento/simulacao` | (AGT-009) Corpo `{ "resultado": "aprovado" \| "recusado" }`. **Só existe fora de produção** (provedor simulado); com o provedor ausente responde 404 como qualquer rota inexistente. |
| `POST /api/reservas/:id/desistir` | Cancela a reserva sem pagamento pendente ou confirmado e a retenção ativa. 200 com a reserva. |

Não há `GET /api/reservas` (lista): "minhas reservas" é a AGT-011.

Resposta da reserva: `id`, `situacao`, `modalidade`, `criada_em`, `excursao` (`id`, `nome`, datas, `partida_brasilia`),
`valores` (`total_centavos` e `parcelas`, cada uma com `valor_centavos` e `vencimento`), `pode_desistir` e `retencao`
(`situacao`, `expira_em` e `segundos_restantes`, ou `null` se o checkout não foi iniciado), `pagamento` (`situacao`, `valor_centavos`,
`confirmado_em` e `requer_tratamento_administrativo`, ou `null`), `pagamento_disponivel` e `pagamento_simulado`. Não traz dados do passageiro,
capacidade nem ocupação, nem dado de cartão (não existe).

Erros: `{ "error": "<codigo>" }`, com `fields` quando houver. Códigos: `validacao` (400; campos `excursao_id`,
`modalidade`: `parcelamento_indisponivel`, `prazo_da_segunda_parcela_vencido`), `excursao_nao_encontrada` (404: não
publicada, já terminada ou inexistente, como na consulta pública), `reservas_encerradas` (409: a partida já passou),
`reserva_ativa_existente` (409, com `fields.reserva_id`), `limite_de_reservas_pendentes`, `sem_vagas`,
`reserva_nao_cancelavel` e `reserva_com_pagamento` (409). No checkout: `reserva_nao_pendente` (409), `reservas_encerradas` (409) e
`sem_vagas` (409). No pagamento: `retencao_inativa`, `pagamento_parcelado_indisponivel`, `pagamento_ja_confirmado`, `pagamento_nao_iniciado` e
`pagamento_nao_pendente` (409), `pagamento_indisponivel` (503, sem provedor) e `validacao` (400, campo `resultado`). Se o banco estiver ocupado além do `busy_timeout` de 5 s, qualquer rota responde 503 `banco_ocupado` com `Retry-After: 1`.

## Regras aplicadas na solicitação (dentro de uma transação `BEGIN IMMEDIATE`)

1. Excursão publicada e não terminada (mesma visibilidade da consulta pública) e partida no futuro.
2. Uma reserva não cancelada por passageiro e excursão (RN-009): pedido repetido ou simultâneo recebe 409 com o número da
   reserva existente. A violação do índice `uq_reserva_ativa` é tratada como o mesmo 409, caso a verificação seja contornada.
3. Limite de 3 pendentes por passageiro.
4. Vagas livres (capacidade menos ocupadas menos retenções ativas e não expiradas) maiores que zero (RF-019, AGT-008).
5. Modalidade parcelada permitida pela excursão e dentro do prazo.

## Retenção temporária de vaga (AGT-008, RF-021, RF-022, RN-014, RN-015, RN-021, RN-040)

Decisões do pesquisador (20/11/2026, "tudo que é recomendado"):

| Ponto | Decisão |
| --- | --- |
| Início | A retenção começa **ao abrir o checkout** (`POST /api/reservas/:id/checkout`, chamado pela página). A reserva pendente, sozinha, não segura vaga. |
| Duração | **15 minutos**, configurável por `RETENCAO_MINUTOS` (1 a 1440). Repetir o checkout com a retenção ativa devolve a mesma, sem prorrogar. |
| Renovação | Depois de expirada, o passageiro **retoma** o checkout; se houver vaga, nasce outra retenção. Sem vaga, 409 `sem_vagas`. |
| Disponibilidade | Capacidade menos `vagas_ocupadas` menos retenções com situação `ativa` e `expira_em` no futuro. Calculada pelas linhas de `retencao_vaga`, **sem coluna nova nem migração**; `vagas_ocupadas` guarda só a ocupação definitiva (RN-015). A consulta pública usa a mesma conta. |
| Concorrência | A retenção é criada dentro de `BEGIN IMMEDIATE`, que reavalia a disponibilidade na gravação; dois pedidos pela última vaga resultam em uma retenção e um 409 (RN-040). Banco ocupado além do `busy_timeout` de 5 s: 503 `banco_ocupado`, sem laço de nova tentativa. |
| Expiração | Avaliada na leitura e na gravação, **sem tarefa em segundo plano**. Retenção vencida não conta na disponibilidade; quem grava (solicitar, checkout, desistir) a marca como `expirada`, com auditoria do sistema (`retencao.expirada`, sem ator). A leitura da reserva mostra `expirada` sem gravar. A rotina agendada completa é da AGT-014. |
| Reserva ao expirar | Continua "Aguardando pagamento" e pode ser retomada ou desfeita. Nenhum cancelamento automático. |
| Desistência | Cancela a retenção ativa (`retencao.cancelada`, com o passageiro como ator). |

Mecanismo de ocupar e liberar vaga (`server/vagas/disponibilidade.ts`), **sem rota pública**, para a AGT-009 usar:
`ocuparVaga` (`UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ? AND vagas_ocupadas < capacidade`, depois de
conferir que não há retenção de outra pessoa sobre a última vaga; a retenção que está sendo convertida pode ser informada para
não bloquear a si mesma), `liberarVaga` (nunca abaixo de zero) e `expirarVencidas`. Exigem transação aberta (`withTransaction`).
A conversão da retenção em ocupação (RN-016) e a marcação como `confirmada` são da AGT-009.

Auditoria: `retencao.criada`, `retencao.expirada` e `retencao.cancelada`, só com situação, reserva e excursão (sem dados pessoais).

## Pagamento integral (AGT-009, RF-023, RF-025, RF-026, RN-011, RN-016, RN-021, RN-022, RN-040)

Decisões do pesquisador (20/11/2026, "recomendadas"):

| Ponto | Decisão |
| --- | --- |
| Meio de pagamento | **Provedor simulado interno** (`server/pagamentos/provedor.ts`), atrás de uma interface trocável. Existe só fora de produção (desligável com `PAGAMENTO_SIMULADO=false`). Em produção não há provedor: o pagamento responde 503 `pagamento_indisponivel` e as rotas de simulação não existem. Nenhum dado de cartão, conta ou dado pessoal de pagamento é recebido ou guardado. |
| Início | A linha de `pagamento` (parcela `unica`, valor em centavos, situação `pendente`) nasce **ao clicar em Pagar**. O valor é o preço da excursão no servidor; o cliente não informa valor. Só reserva integral em "Aguardando pagamento"; parcelada recebe 409 `pagamento_parcelado_indisponivel` (AGT-010). |
| Retenção | O pagamento **exige retenção ativa** (409 `retencao_inativa`). |
| Recusado | A situação vira `falhou`; o passageiro pode tentar de novo enquanto a retenção estiver ativa, **reaproveitando a mesma linha** (`uq_pagamento_parcela` impede uma segunda). |
| Pendente nunca confirmado | Continua `pendente` (a rotina que o fecha é da AGT-014). |
| Confirmação | `confirmarPagamento` (`server/pagamentos/confirmacao.ts`), em **uma única transação `BEGIN IMMEDIATE`**: marca o pagamento `confirmado`, converte a retenção (`confirmada`), ocupa a vaga com `ocuparVaga` (AGT-008) e coloca a reserva em "Pronto para embarque" (RN-016). **Idempotente**: repetir devolve o resultado anterior, sem ocupar outra vaga. Uma falha no meio desfaz tudo. |
| Depois da expiração, com vaga livre | A confirmação ocupa a vaga normalmente. |
| Depois da expiração, sem vaga (RN-022, RF-026) | O pagamento fica `confirmado` e **sinalizado** na coluna nova `pendencia_administrativa = 'confirmacao_sem_vaga'` (migração 2), mais auditoria `pagamento.confirmado_sem_vaga`. A reserva **continua "Aguardando pagamento"**, nenhuma vaga é criada e `vagas_ocupadas` não passa da capacidade. O passageiro vê que a organização vai tratar o caso, sem promessa de reembolso (estorno e reembolso são da AGT-013). |

Interpretação registrada para revisão: a desistência (AGT-007) passa a ser bloqueada por pagamento **pendente ou confirmado**; um
pagamento recusado (`falhou`) não impede desistir. Antes, qualquer linha de pagamento bloqueava.

Em demonstração, o passageiro clica em "Simular pagamento aprovado" ou "recusado" (rota de simulação). A simulação usa o passageiro
como ator na auditoria; um provedor real usaria o sistema (ator nulo) e chamaria `confirmarPagamento` e `recusarPagamento`.

Auditoria: `pagamento.criado`, `pagamento.reiniciado`, `pagamento.recusado`, `pagamento.confirmado`, `pagamento.confirmado_sem_vaga`,
`retencao.confirmada` e `reserva.pronta_para_embarque`, só com situação, reserva, excursão e valor em centavos.

## Interface

| Caminho | O que mostra |
| --- | --- |
| `/excursoes/:id` | Bloco **Reservar**: o passageiro escolhe a forma de pagamento e reserva; o visitante vê "Entrar" e "Criar conta"; o administrador não vê o bloco; excursão esgotada mostra um aviso, sem botão. |
| `/reservas/:id/checkout` | Resumo (excursão, datas, partida, modalidade, situação), tabela de parcelas com vencimento e total, **o tempo restante da retenção (mm:ss)** e o aviso de que a vaga só é garantida após o pagamento confirmado, o bloco **Pagamento** (botão Pagar com o valor do servidor; pendente com os botões de simulação em demonstração; recusado com nova tentativa; parcelada com aviso; sem provedor com aviso) e o botão de desistir (com confirmação). Reserva paga mostra "Pagamento confirmado. Sua reserva está pronta para embarque." e some com o tempo, o Pagar e o desistir. Pagamento confirmado sem vaga mostra que a organização vai tratar o caso. Ao abrir, inicia a retenção. Sem vaga: explica e oferece "Tentar novamente". Tempo esgotado: avisa que a vaga foi liberada e oferece "Retomar checkout". |

## Efeitos em outras atividades

- **RN-036 (AGT-005):** com uma reserva em "Aguardando pagamento", a excursão passa a ter reserva ativa: preço, capacidade, parcelamento,
  prazo, datas e partida ficam bloqueados, e cancelar ou despublicar a excursão fica recusado (testado).
- **Consulta pública (AGT-006):** desde a AGT-008, as vagas mostradas descontam as retenções ativas e não expiradas (reservas pendentes sem checkout não descontam).
- **Mudanças em código de outras atividades:** nenhuma regra alterada. `app.ts` e `main.ts` ligam o serviço; `server/excursoes/publico.ts`
  e `server/excursoes/validation.ts` têm funções reaproveitadas (`vagasDisponiveis`, `instantePrazo`); `shared/dinheiro.ts` ganhou `dividirEmDuas`;
  o bloco de reserva substituiu o texto provisório do detalhe da excursão.

## Limitações conhecidas

1. **Vagas:** a reserva pendente não segura a vaga; só o checkout a retém, por 15 minutos. Duas pessoas ainda podem solicitar a última vaga, e a segunda
   recebe `sem_vagas` ao abrir o checkout. Uma retenção expirada libera a vaga, e a confirmação financeira tardia é tratada na AGT-009 (RF-026, RN-022).
2. **Pagamento:** só o integral e só com provedor simulado fora de produção; não há provedor real, parcelamento (AGT-010), estorno nem reembolso (AGT-013).
2a. **Pagamento pendente que nunca confirma** fica pendente, bloqueia a desistência e só é fechado pela rotina da AGT-014.
2b. **Confirmação para reserva que deixou de aguardar** (por exemplo, cancelada pela organização no futuro) é recusada com 409 `reserva_nao_pendente`; o tratamento é da AGT-013.
3. **Reserva abandonada:** continua pendente (e ocupa um dos 3 lugares do passageiro) até ele desistir. A retenção dela expira, mas a reserva não é cancelada automaticamente (AGT-013 e AGT-014).
3a. **Expiração sem tarefa em segundo plano:** a retenção vencida só é marcada como `expirada` quando alguém grava ou lê vagas; a disponibilidade já a ignora pelo prazo. A rotina periódica é da AGT-014.
3b. **Relógio:** o servidor decide o prazo; a contagem na tela usa o relógio do navegador a partir dos segundos restantes informados e pode divergir poucos segundos.
4. **Sem troca de modalidade:** para mudar, é preciso desistir e reservar de novo.
5. **Sem lista de reservas** do passageiro (AGT-011) e sem administração de reservas (AGT-012).
6. **Reserva de excursão que depois deixa de ser publicada:** o passageiro ainda vê a própria reserva; as consequências (cancelamento da excursão) são da AGT-013.
7. Sem limite de requisições nas rotas e verificação em navegador só no Microsoft Edge (Chromium), sem leitor de tela.
