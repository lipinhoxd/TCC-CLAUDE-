# Reservas (AGT-007 a AGT-011)

Cancelamento e reembolso (AGT-013): ver [cancelamentos.md](cancelamentos.md).

Solicitação de reserva individual do passageiro e checkout (RF-018 a RF-020), sobre as tabelas `reserva`, `excursao`,
`retencao_vaga` e `auditoria`. criar a
reserva não altera `vagas_ocupadas` e não cria linhas em `pagamento`; o pagamento integral (AGT-009) e o parcelado (AGT-010) só nascem no checkout, com provedor simulado fora de produção. Desde a AGT-008, **abrir o checkout inicia a retenção
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
| `GET /api/reservas` | (AGT-011) As próprias reservas do passageiro: `{ "em_andamento": [...], "historico": [...] }`. Efetiva antes a conclusão das reservas elegíveis dele. |
| `GET /api/reservas/:id` | A própria reserva, com o resumo de valores (desde a AGT-011 também efetiva a conclusão das reservas elegíveis do passageiro). De outra pessoa ou inexistente: 404 `nao_encontrada` (a mesma resposta). |
| `POST /api/reservas/:id/checkout` | (AGT-008) Inicia ou retoma a retenção temporária da vaga. 200 com a reserva e a `retencao`. |
| `POST /api/reservas/:id/pagamento` | (AGT-009 e AGT-010) Inicia ou retoma o pagamento da **próxima parcela**, que o servidor decide (integral: a única; parcelada: a primeira e depois a segunda). A única e a primeira exigem retenção ativa; a segunda não. 200 com a reserva e o `pagamento`. O corpo, se houver, é ignorado. |
| `POST /api/reservas/:id/pagamento/simulacao` | (AGT-009) Corpo `{ "resultado": "aprovado" \| "recusado" }`. **Só existe fora de produção** (provedor simulado); com o provedor ausente responde 404 como qualquer rota inexistente. |
| `POST /api/reservas/:id/desistir` | Cancela a reserva sem pagamento pendente ou confirmado e a retenção ativa. 200 com a reserva. |

Não há `GET /api/reservas` (lista): "minhas reservas" é a AGT-011.

Resposta da reserva: `id`, `situacao`, `modalidade`, `criada_em`, `excursao` (`id`, `nome`, datas, `partida_brasilia`),
`valores` (`total_centavos` e `parcelas`, cada uma com `valor_centavos` e `vencimento`), `pode_desistir` e `retencao`
(`situacao`, `expira_em` e `segundos_restantes`, ou `null` se o checkout não foi iniciado), `pagamento` (`parcela`, `situacao`, `valor_centavos`,
`confirmado_em` e `requer_tratamento_administrativo`, ou `null`; é o da parcela em andamento), `proxima_parcela` (decidida pelo servidor, ou `null`),
`motivo_cancelamento` (`inadimplencia` ou `null`), `pagamento_disponivel` e `pagamento_simulado`; cada item de `valores.parcelas` traz `situacao_pagamento`. Não traz dados do passageiro,
capacidade nem ocupação, nem dado de cartão (não existe).

Erros: `{ "error": "<codigo>" }`, com `fields` quando houver. Códigos: `validacao` (400; campos `excursao_id`,
`modalidade`: `parcelamento_indisponivel`, `prazo_da_segunda_parcela_vencido`), `excursao_nao_encontrada` (404: não
publicada, já terminada ou inexistente, como na consulta pública), `reservas_encerradas` (409: a partida já passou),
`reserva_ativa_existente` (409, com `fields.reserva_id`), `limite_de_reservas_pendentes`, `sem_vagas`,
`reserva_nao_cancelavel` e `reserva_com_pagamento` (409). No checkout: `reserva_nao_pendente` (409), `reservas_encerradas` (409) e
`sem_vagas` (409). No pagamento: `retencao_inativa`, `prazo_da_segunda_parcela_vencido`, `primeira_parcela_nao_confirmada`, `pagamento_ja_confirmado`, `pagamento_nao_iniciado` e
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

## Pagamento em duas parcelas (AGT-010, RF-024, RF-027, RF-028, RN-012, RN-013, RN-017 a RN-020, RN-024, RN-032)

Decisões do pesquisador (21/11/2026, "recomendadas"):

| Ponto | Decisão |
| --- | --- |
| Primeira parcela | Metade do total arredondada para baixo (`dividirEmDuas`). Mesmo ciclo do integral: exige retenção ativa; a confirmação ocupa a vaga (`ocuparVaga`), converte a retenção e **mantém a reserva em "Aguardando pagamento"** (RN-017): não há situação nova (RN-023 intacta). A vaga ocupada fica identificada pelo pagamento da primeira parcela confirmado. |
| Segunda parcela | O restante, de modo que a soma é sempre igual ao total. Pode ser paga **da confirmação da primeira até 23:59:59 da data limite, em Brasília**, **sem retenção** (a vaga já está ocupada). Recusada, vira `falhou` e se tenta de novo, na mesma linha, até o prazo. A confirmação conclui a quitação (RN-018) e deixa a reserva em "Pronto para embarque" (RN-024), sem ocupar outra vaga. |
| Ordem e valores | Decididos pelo servidor (`server/pagamentos/parcelas.ts`): a primeira vem antes da segunda; o cliente não informa parcela nem valor. |
| Primeira confirmada sem vaga (RN-022) | Igual ao integral: pagamento confirmado e sinalizado, reserva aguardando e nada mais a pagar. |
| Vencimento (RN-019, RN-020, RN-032, RF-028) | **Na leitura e na gravação, sem tarefa em segundo plano** (`server/vagas/vencimento.ts`). Reserva parcelada em "Aguardando pagamento", com a primeira parcela confirmada com vaga e sem a segunda confirmada, cujo prazo chegou: a gravação seguinte da excursão a deixa **Cancelada** com `motivo_cancelamento = 'inadimplencia'` (migração 3) e **libera uma vaga, uma única vez**, com auditoria `reserva.vencimento_segunda_parcela` (ator nulo). A primeira parcela permanece `confirmado` e **não reembolsável** (a AGT-013 decide o que fazer com ela). Na leitura, a resposta da reserva já mostra "Cancelada" por inadimplência e a disponibilidade pública já conta a vaga como livre, sem gravar nada. O pedido de reserva, o checkout, o pagamento e a desistência efetivam o vencimento **antes** das suas verificações e em transação própria, para o efeito não se perder se o pedido for recusado. |
| Segunda parcela depois do prazo | Se a confirmação chega depois da liberação da vaga, o pagamento fica `confirmado` e sinalizado (`pendencia_administrativa = 'confirmacao_sem_vaga'`, reaproveitando o valor da AGT-009), a reserva continua Cancelada e **nenhuma vaga é recriada**. |
| Desistência | Com a primeira parcela confirmada continua recusada (`reserva_com_pagamento`); o reembolso é da AGT-013. |
| Limite de 3 pendentes | A reserva com a primeira parcela paga continua em "Aguardando pagamento" e, por isso, **conta** no limite de 3 do passageiro (consequência da decisão 1). |

Auditoria (só situação, reserva, excursão, parcela e valor em centavos): `pagamento.criado`, `pagamento.reiniciado`, `pagamento.recusado`,
`pagamento.confirmado` (com `quitacao` na segunda), `pagamento.confirmado_sem_vaga`, `retencao.confirmada`, `reserva.pronta_para_embarque` e
`reserva.vencimento_segunda_parcela`.

## Área do passageiro (AGT-011, RF-029 a RF-031, RN-023 a RN-026)

Decisões do pesquisador (24/11/2026, "recomendadas"):

| Ponto | Decisão |
| --- | --- |
| Conclusão (RN-025) | **Na leitura e na gravação, sem tarefa em segundo plano** (`server/vagas/conclusao.ts`; a rotina agendada é da AGT-014). A lista e o detalhe efetivam, em transação própria e só das reservas do passageiro que consulta, a passagem para **Concluída**, com auditoria `reserva.concluida` (ator nulo, sem dados pessoais). A resposta de qualquer rota já mostra a reserva elegível como Concluída. |
| Elegibilidade | Só a reserva em **Pronto para embarque**, a partir de 00:00 (Brasília) do dia seguinte à data final da excursão. Reserva em Aguardando pagamento depois do fim da excursão não é elegível e continua em andamento (limitação 8). |
| Efeitos | A conclusão **não altera vagas nem pagamentos**: a vaga de uma reserva concluída continua ocupada. Acontece uma única vez por reserva (idempotente). |
| Lista (RF-029, RF-031, RN-026) | Uma página com dois blocos: **Em andamento** (Aguardando pagamento e Pronto para embarque; da excursão mais próxima para a mais distante) e **Histórico** (Concluídas e Canceladas, estas com o motivo "segunda parcela não paga" quando for o caso; da excursão mais recente para a mais antiga). A reserva concluída nunca sai do histórico. |
| Detalhe (RF-030) | Página própria `/reservas/:id`: excursão, local, ponto de embarque, datas, partida, forma de pagamento, situação e parcelas. O pagamento continua no checkout (`/reservas/:id/checkout`). Ações: Aguardando pagamento: continuar o pagamento e desistir (quando permitido); as demais situações não têm ação. O pagamento confirmado sem vaga é descrito como "a organização vai tratar o caso", sem campos internos; a primeira parcela de uma reserva vencida é "não reembolsável", sem prometer devolução. |

Privacidade: o passageiro vem da sessão (parâmetros de URL e corpo não o escolhem); a lista nunca traz reserva de outra pessoa; reserva alheia e inexistente respondem o mesmo 404; as respostas não trazem CPF, telefone, e-mail, hash, token nem dados de outro passageiro. A resposta da reserva ganhou `excursao.local` e `excursao.ponto_embarque`.

## Interface

| Caminho | O que mostra |
| --- | --- |
| `/excursoes/:id` | Bloco **Reservar**: o passageiro escolhe a forma de pagamento e reserva; o visitante vê "Entrar" e "Criar conta"; o administrador não vê o bloco; excursão esgotada mostra um aviso, sem botão. |
| `/reservas` | (AGT-011) **Minhas reservas**: blocos "Em andamento" e "Histórico", com situação, valor e ações (ver detalhe e, se aguarda pagamento, continuar o pagamento); item "Minhas reservas" no menu do passageiro; visitante vê convite ao login e administrador vê acesso restrito. |
| `/reservas/:id` | (AGT-011) **Detalhe da reserva**: dados da excursão, forma de pagamento, situação, parcelas, avisos por situação e, quando permitido, desistir. Inexistente ou de outra pessoa: "Reserva não encontrada". |
| `/reservas/:id/checkout` | Resumo (excursão, datas, partida, modalidade, situação), tabela de parcelas com vencimento e total, **o tempo restante da retenção (mm:ss)** e o aviso de que a vaga só é garantida após o pagamento confirmado, a coluna **Pagamento** da tabela de parcelas (Pago, Aguardando confirmação, Recusado) e o bloco **Pagamento** (botão Pagar, Pagar a primeira parcela ou Pagar a segunda parcela, com o valor do servidor; pendente com os botões de simulação em demonstração; recusado com nova tentativa; parcelada com aviso; sem provedor com aviso) e o botão de desistir (com confirmação). Reserva paga mostra "Pagamento confirmado. Sua reserva está pronta para embarque." e some com o tempo, o Pagar e o desistir. Pagamento confirmado sem vaga mostra que a organização vai tratar o caso. Ao abrir, inicia a retenção. Sem vaga: explica e oferece "Tentar novamente". Tempo esgotado: avisa que a vaga foi liberada e oferece "Retomar checkout". |

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
2. **Pagamento:** só com provedor simulado fora de produção; não há provedor real, estorno nem reembolso (AGT-013). A primeira parcela de uma reserva vencida fica não reembolsável, mas nada a devolve ainda.
2a. **Pagamento pendente que nunca confirma** fica pendente, bloqueia a desistência e só é fechado pela rotina da AGT-014.
2c. **Vencimento sem tarefa agendada:** a liberação da vaga só é gravada quando alguém grava na excursão (reserva, checkout, pagamento, desistência); a leitura e a disponibilidade pública já tratam a vaga como livre. A rotina periódica é da AGT-014.
2d. **Reserva com a primeira parcela paga** continua contando entre as 3 pendentes do passageiro até a quitação ou o vencimento.
2b. **Confirmação para reserva que deixou de aguardar** (por exemplo, cancelada pela organização no futuro) é recusada com 409 `reserva_nao_pendente`; o tratamento é da AGT-013.
3. **Reserva abandonada:** continua pendente (e ocupa um dos 3 lugares do passageiro) até ele desistir. A retenção dela expira, mas a reserva não é cancelada automaticamente (AGT-013 e AGT-014).
3a. **Expiração sem tarefa em segundo plano:** a retenção vencida só é marcada como `expirada` quando alguém grava ou lê vagas; a disponibilidade já a ignora pelo prazo. A rotina periódica é da AGT-014.
3b. **Relógio:** o servidor decide o prazo; a contagem na tela usa o relógio do navegador a partir dos segundos restantes informados e pode divergir poucos segundos.
4. **Sem troca de modalidade:** para mudar, é preciso desistir e reservar de novo.
5. Sem administração de reservas (AGT-012).
6. **Reserva de excursão que depois deixa de ser publicada:** o passageiro ainda vê a própria reserva; as consequências (cancelamento da excursão) são da AGT-013.
7. Sem limite de requisições nas rotas e verificação em navegador só no Microsoft Edge (Chromium), sem leitor de tela.
8. **Conclusão sem tarefa agendada (AGT-011):** a passagem para Concluída só é gravada quando o passageiro consulta a lista ou o detalhe; antes disso o banco ainda guarda "Pronto para embarque", embora as respostas já mostrem "Concluída". A rotina periódica é da AGT-014. A reserva em Aguardando pagamento que passa do fim da excursão não é concluída nem cancelada por esta atividade.
9. **Aviso e tabela (AGT-011):** o aviso ao passageiro é só a tela; no celular a tabela da lista rola na horizontal dentro do quadro (as colunas Situação e Ações ficam à direita), sem rolagem horizontal da página; sem paginação da lista; sem leitor de tela testado.
