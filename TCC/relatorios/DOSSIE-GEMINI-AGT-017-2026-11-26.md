# Dossiê bruto da AGT-017 para o Gemini (26/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-017.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-017.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/validacao-das-regras.md`, `docs/especificacao/04-REGRAS-DE-NEGOCIO.md`, `git log` (commits e85d169 e 9d0dc49) e o relatório em página privada (https://claude.ai/artifact/R3vJs9XtJHeogM3Vt1DCQr).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Classes (revisão metodológica confirmada pelos pesquisadores em 26/11/2026).** São cinco: AP-1 (verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta), AP-2 (atendidas após correções do próprio agente, sem intervenção direta), AP-3 (atendidas com intervenção planejada de governança e coplanejamento prevista na instrução), AP-4 (atendidas mediante intervenção corretiva do desenvolvedor para reparar falhas de execução, erros de código, alucinações ou desvios de escopo não corrigidos pelo agente) e RP (não atendidas pela abordagem utilizada). No experimento principal, AP-3: 17; AP-4: 0. Não criar outras classes.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. "43 de 46 regras atendidas" é resultado desta verificação sobre este sistema: **não é taxa de qualidade** e não deve virar percentual nem generalização. Não inferir causalidade, produtividade ou qualidade geral; não há grupo de controle. Os valores em reais são de **dados fictícios de teste**, com pagamento simulado.
3. **Não usar "validação independente" nem "revisão independente".** A verificação foi feita **pelo mesmo agente que implementou o sistema** e não substitui a revisão humana. O título da atividade ("Testes integrados e validação das regras") é o do plano e pode ser usado.
4. **Não inventar decisões, testes, telas, funções ou limitações.** As decisões são exatamente as da seção B.
5. **Não apagar texto existente** (salvo as substituições das seções G e J) e **não duplicar parágrafos**. Ao inserir a ficha, não alterar as fichas anteriores.
6. **Não mudar data de corte, escopo ou cronograma.**
7. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 17** de 18; piloto **n = 5**; nunca somados.
8. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
9. **A ficha da AGT-017 é obrigatória** e **as regras RN-045 e RN-046 precisam entrar na lista de regras de negócio** (seção G). Ao final, informar uma linha por trecho alterado.

## Ordem em relação aos envios anteriores

1. Se ainda não enviados: a **Parte A** de `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md` e os dossiês das AGT-013 a AGT-016, nesta ordem.
2. Este dossiê. A seção J **substitui as seções J dos dossiês das AGT-014, 015 e 016 e as Partes B e C** do pedido de correção.

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-017 (Testes integrados e validação das regras) é a 17.ª das 18 atividades do experimento principal com o Claude Code (Claude Sonnet 5.5). Foi executada em 26/11/2026, em uma tentativa, sem nova instrução corretiva, e classificada como AP-3 pelos pesquisadores no mesmo dia (resposta "ap 3", 21:50:40). A instrução foi escrita pelo agente a partir da especificação e aprovada pelo pesquisador às 19:51:28; as três decisões foram respondidas às 19:53:14 ("recomendadas"); uma segunda pergunta, sobre um teste instável, foi apresentada às 20:27:56 e respondida às 20:34:06. Duração nas métricas: 62,52 min (19:53:14 a 21:01:55, descontada a segunda espera; 68,68 min de relógio no intervalo). O relatório do agente foi concluído às 21:03:10.

Contexto: cada atividade anterior havia testado principalmente a própria parte. A matriz de rastreabilidade registrava, das 44 regras de então, 32 evidenciadas, 3 parciais (RN-005, RN-021 e RN-040) e 9 sem evidência registrada (RN-009, RN-010, RN-033, RN-038, RN-039 e RN-041 a RN-044).

Resultado: das **46** regras, **43 atendidas**, **1 atendida em parte** (RN-005), **0 não atendidas ao fim** e **2 não verificáveis por teste** (RN-043 e RN-044, conferidas nos registros, com ressalva). No início da atividade, a RN-001 (com a RN-039) não era atendida entre 21:00 e 23:59 de Brasília.

Números: 796 testes automatizados aprovados em 41 arquivos (720 ao final da AGT-016; 76 novos: 69 por regra, 6 cenários de fluxos encadeados e 1 de interface); lint, verificação de tipos e build aprovados; 44 alterações propositais no código (uma por regra verificável), todas detectadas e restauradas; suíte completa executada 70 vezes; percurso em aplicação e navegador reais com dados fictícios; nenhuma migração e nenhuma dependência nova.

## B. Decisões dos pesquisadores e razões

As razões são as das recomendações do agente, aceitas pelo pesquisador sem texto próprio.

### B1. Três paradas previstas na instrução (19:53:14, "recomendadas")

1. **Forma de verificação e critérios.** Testes integrados pela API, com a aplicação completa, e navegador só no percurso manual (descartados: automação de navegador no repositório, que exigiria dependência nova; ambos). Quatro resultados: atendida, atendida em parte, não atendida e não verificável por teste (descartado: só atendida ou não). Uma alteração proposital por regra verificável (descartadas: só pagamentos, vagas e cancelamentos; nenhuma). RN-043 e RN-044 como não verificáveis por teste, conferidas nos registros e com ressalva (descartado: marcá-las como atendidas).
2. **Tratamento do encontrado.** Corrigir os defeitos que não mudem regra de negócio, interromper nos que dependam de interpretação e relatar todos (descartados: só relatar; corrigir tudo).
3. **Pontos abertos.** (a) Confirmação financeira recebida depois da partida **não ocupa vaga** e é registrada para o administrador reembolsar (descartados: recusar a confirmação; deixar como estava). (b) Acrescentar a RN-045 e a RN-046 ao documento de regras. (c) Retirar as marcas "[confirmar]" (RN-007, RN-036, RN-037 e situações da excursão), citando decisões já tomadas. (d) Excursão continua **sem** situação "Concluída" (limitação e trabalho futuro). (e) RN-005 registrada como atendida em parte.

### B2. Pergunta durante a execução (20:34:06, "Esperar 20 s no comando")

Um teste da AGT-014 (duas rotinas simultâneas) falhou na repetição da suíte. O agente reproduziu a falha sob carga artificial (um processo esperava mais de 5 s pelo banco e registrava "database is locked", sem dado incorreto) e apresentou três opções: o comando `npm run rotina` esperar até 20 s (**adotada**, recomendada); ajustar o teste antigo (descartada, por alterar teste existente); deixar e relatar (descartada, por não atender ao critério de teste estável).

### B3. Feito pelo agente sem pergunta própria

Um segundo teste instável (AGT-006, título da aba) foi corrigido na tela, sem alterar o teste, seguindo a escolha feita em B2. A fronteira da RN-046 no **instante exato** da partida foi escolha do agente (o texto diz "depois da partida"); foi apresentada para confirmação e o pesquisador respondeu apenas com a classificação.

## C. O que foi feito e onde

- Plataforma de testes (`tests/helpers/plataforma.ts`): aplicação completa por HTTP, relógio do negócio controlado (separado do relógio da sessão), provedores simulados capturados e invariantes.
- `tests/regras-negocio.test.ts`: um bloco por regra verificável. `tests/fluxos-integrados.test.ts`: fluxos 1 a 9 encadeados, última vaga, confirmação tardia, depois da partida e rotina parada por muito tempo.
- Invariantes ao fim de cada cenário: ocupação entre zero e a capacidade e igual às reservas que ocupam vaga; uma reserva não cancelada por passageiro e excursão; nenhum reembolso acima do pago; auditoria sem exclusão e sem dados sensíveis.
- Correções: (C1) RN-001/RN-039, idade calculada pelo dia UTC passou a usar o dia de Brasília (`server/auth/validation.ts`); (C2) RN-046, confirmação a partir da partida não ocupa vaga, vira pendência e gera aviso próprio (`server/pagamentos/confirmacao.ts`, `server/comunicacao/textos.ts`); (C3) `npm run rotina` espera 20 s pelo banco (`server/processos/rotina-cli.ts`); (C4) título da aba definido junto com o conteúdo (`src/ui.tsx`).
- Especificação (somente texto aprovado): `04-REGRAS-DE-NEGOCIO.md`, `05-FLUXOS-E-ESTADOS.md` e a cópia `docs/requisitos/RN.md`.
- Documento novo: `docs/validacao-das-regras.md`; README e cinco documentos atualizados. Nenhum teste existente alterado ou removido; nenhuma migração (versões 1 a 5 permanecem) e nenhuma dependência.

## D. Verificações (resultados reais)

- `npm run check` (lint, testes, tipos e build): aprovado às 20:02:01 (795), 20:41:53 (795), 20:51:18 (796, código final) e no fechamento, 21:53:16 (796 em 41 arquivos).
- Testes novos antes das correções C1 e C2 (19:56:46): 64 aprovados e 5 reprovados.
- Repetição da suíte completa: 29 rodadas antes de C3 (1 falha, teste da AGT-014); 18 depois de C3 e antes de C4 (1 falha, teste da AGT-006); 23 sobre o código final (nenhuma falha). Total de 70.
- Teste da AGT-014 sob carga artificial: 2 falhas em 3 tentativas antes da correção; nenhuma em 13 depois (7 com alteração temporária, 6 com a final). Em 40 execuções paralelas sem carga artificial não houve falha.
- Teste novo do título: falhou 5 de 5 antes da correção e passou 5 de 5 depois.

### D1. Alterações propositais no código (20:06:00; 44 de 44 detectadas)

| Regra | Alteração | Arquivo | Testes que falharam |
| --- | --- | --- | --- |
| RN-001 | maioridade aos 17 | `server/auth/validation.ts` | 2 |
| RN-002 | CPF fora da verificacao de duplicidade | `server/auth/service.ts` | 1 |
| RN-003 | e-mail fora da verificacao de duplicidade | `server/auth/service.ts` | 1 |
| RN-004 | telefone em branco sem aviso de obrigatorio | `server/auth/service.ts` | 1 |
| RN-005 | DDD nao conferido | `server/auth/validation.ts` | 1 |
| RN-006 | senha nao conferida no login | `server/auth/service.ts` | 1 |
| RN-007 | validade do token ignorada | `server/auth/service.ts` | 1 |
| RN-008 | sessao revogada aceita | `server/auth/service.ts` | 1 |
| RN-009 | reserva de outra pessoa visivel | `server/reservas/service.ts` | 1 |
| RN-010 | pagamento sem checkout | `server/pagamentos/service.ts` | 1 |
| RN-011 | padrao parcelado | `server/reservas/service.ts` | 1 |
| RN-012 | segunda parcela igual a primeira | `shared/dinheiro.ts` | 1 |
| RN-013 | prazo no dia da partida aceito | `server/excursoes/validation.ts` | 1 |
| RN-014 | retencao com o dobro do prazo | `server/reservas/service.ts` | 1 |
| RN-015 | retencao vencida continua contando | `server/vagas/disponibilidade.ts` | 1 |
| RN-016 | integral paga nao fica pronta | `server/pagamentos/confirmacao.ts` | 1 |
| RN-017 | primeira parcela deixa a reserva pronta | `server/pagamentos/confirmacao.ts` | 1 |
| RN-018 | segunda parcela nao e confirmada | `server/pagamentos/confirmacao.ts` | 1 |
| RN-019 | vencimento so depois do instante do prazo | `server/vagas/vencimento.ts` | 1 |
| RN-020 | cancelamento da excursao alcanca canceladas | `server/cancelamentos/service.ts` | 1 |
| RN-021 | checkout sem vaga livre | `server/reservas/service.ts` | 1 |
| RN-022 | confirmacao sem vaga sem sinalizacao | `server/pagamentos/confirmacao.ts` | 1 |
| RN-023 | quinta situacao aceita pelo banco | `server/db/migrations.ts` | 1 |
| RN-024 | quitacao sem Pronto para embarque | `server/pagamentos/confirmacao.ts` | 1 |
| RN-025 | conclui no proprio dia final | `server/vagas/conclusao.ts` | 1 |
| RN-026 | concluida fora do historico | `server/reservas/service.ts` | 1 |
| RN-027 | 14 dias exatos sem 100% | `server/cancelamentos/regra.ts` | 1 |
| RN-028 | 7 dias exatos sem 50% | `server/cancelamentos/regra.ts` | 1 |
| RN-029 | menos de 7 dias com 50% | `server/cancelamentos/regra.ts` | 1 |
| RN-030 | pagamento pendente no calculo | `server/cancelamentos/service.ts` | 1 |
| RN-031 | organizacao devolve metade | `server/cancelamentos/service.ts` | 1 |
| RN-032 | primeira parcela nao quitada elegivel | `server/cancelamentos/regra.ts` | 1 |
| RN-033 | passageiro configura excursao | `server/excursoes/routes.ts` | 1 |
| RN-034 | passageiro consulta a administracao | `server/admin/routes.ts` | 1 |
| RN-035 | conclusao manual antes do fim | `server/admin/service.ts` | 1 |
| RN-036 | campos protegidos liberados | `server/excursoes/service.ts` | 7 |
| RN-037 | excursao nasce publicada | `server/excursoes/service.ts` | 1 |
| RN-038 | preco fracionado aceito | `server/excursoes/validation.ts` | 1 |
| RN-039 | fuso trocado para UTC | `shared/fuso.ts` | 1 |
| RN-040 | transacao sem bloqueio imediato | `server/db/transaction.ts` | 1 |
| RN-041 | conclusao automatica sem o registro esperado | `server/vagas/conclusao.ts` | 1 |
| RN-042 | e-mail gravado na auditoria | `server/auth/service.ts` | 1 |
| RN-045 | pagamento pendente nao protege | `server/vagas/encerramento.ts` | 1 |
| RN-046 | no instante da partida ainda ocupa | `server/pagamentos/confirmacao.ts` | 2 |

As alterações são anteriores às correções C3 e C4, que não são alvo de nenhuma delas.

### D2. Percurso em aplicação e navegador reais (20:51:22 a 20:54:20)

API com a rotina ligada (a cada 2 s), front-end e Microsoft Edge sem janela, banco temporário, dados fictícios. Parte pela interface (cadastro, entrada, reserva, pagamento, cancelamento, consultas) e parte por chamadas à API dentro do navegador (criar, publicar e cancelar excursão, uma reserva sem checkout, reembolsos e pendência). **Três ajustes no banco:** prazo da segunda parcela para a véspera; partida há 1 hora; excursão terminada há 2 dias. Saída do roteiro:

- admin-cli: Administrador criado (id 1).
- seed:demo: Excursoes de demonstracao criadas: 6 (4 visiveis ao publico, 1 rascunho e 1 encerrada).
- 1 admin cria (rascunho) e publica: [201,"rascunho",200]
- 2 visitante: excursao na lista: true
- 2 visitante: detalhe: ["R$ 150,01 · 3 vagas disponíveis","3 vagas disponíveis"]
- 3 Davi reserva sem abrir o checkout (API): 201
- 4 Ana paga integral na tela: true
- 4 Ana: tela da reserva: ["Pronto para embarque","Pagamento confirmado. Sua reserva está pronta para embarque."]
- 5 Beatriz paga a primeira parcela: true
- 3 Caio abre o pagamento e nao conclui: true
- 3 ocupadas e livres com 2 pagas e 1 retida: [2,0]
- 3 ultima vaga: tela para quem chega depois: ["R$ 150,01 · Esgotada","Esgotada","Reservar","Esta excursão está esgotada. Não é possível reservar agora."]
- 3 ultima vaga: pedido direto: {"error":"sem_vagas"}
- 7 Ana: previa na tela: ["Parcela única\tR$ 150,01\tAo pagar\tPago","Total\tR$ 150,01\t\t","Pago: R$ 150,01. Reembolso: R$ 150,01 (100% do valor elegível)."]
- 7 vaga volta: [1,1]
- 4 Eva ocupa a vaga liberada: [true,2,0]
- 9 admin processa o reembolso da Ana: 200
- AJUSTE 1 no banco: prazo da segunda parcela movido para ontem
- 5 rotina: Beatriz vence e a vaga volta: ["3:cancelada(inadimplencia)",1]
- AJUSTE 2 no banco: excursao com partida ha 1 hora e data final hoje
- RN-046: aprovacao pelo botao da tela: true
- RN-046: tela do Caio: ["Recebemos o seu pagamento, mas a vaga não está mais disponível. A organização vai tratar o caso.","Pagamento","Pagamento integral","Aguardando pagamento","Parcela\tValor\tVencimento\tPagamento"]
- RN-046: banco: [[{"situacao":"confirmado","p":"confirmacao_sem_vaga"}],1,"4:aguardando_pagamento"]
- avisos do Caio: ["Confirmamos o pagamento de R$ 150,01 depois da partida da excursão. A vaga não foi ocupada e a organização vai tratar o caso."]
- 9 admin: pendencias: [1,["confirmado_sem_vaga"]]
- 9 admin: reembolsa a pendencia e processa: [200,200,"4:cancelada"]
- AJUSTE 3 no banco: excursao terminada ha 2 dias
- 6 e RN-045: Davi, Ana, Beatriz, Caio, Eva: ["1:cancelada","2:cancelada","3:cancelada(inadimplencia)","4:cancelada","5:concluida"]
- 8 Eva paga a segunda excursao: true
- 8 admin cancela a excursao: {"excursao_id":2,"situacao":"cancelada","ja_cancelada":false,"reservas_canceladas":1,"reembolsos_criados":1,"valor_total_centavos":320000}
- 8 admin processa o reembolso: 200
- comando avulso com a rotina da API ligada: 0
- 9 painel na tela: ["Pendências","R$ 3.725,03 Todos os pagamentos confirmados, inclusive os depois estornados.","R$ 3.500,02 Reembolsos processados.","R$ 225,01 Recebido menos devolvido. Inclui valores que ainda aguardam análise.","R$ 0,00 Reembolsos pendentes ou recusados.","R$ 0,00 Segundas parcelas em aberto, dentro do prazo.","Concluída","Cancelada"]
- painel: reservas e valores: [{"aguardando_pagamento":0,"pronto_para_embarque":0,"concluida":1,"cancelada":5,"total":6},{"recebido_centavos":372503,"devolvido_centavos":350002,"liquido_centavos":22501,"a_devolver_centavos":0,"a_receber_centavos":0},0]
- 9 historico: primeira pagina: Página 1 de 2 (29 resultados)
- Eva: minhas reservas: ["Histórico","Reservas concluídas e canceladas. As concluídas permanecem aqui.","Histórico de reservas","Excursão\tDatas\tPagamento\tSituação\tTotal\tAções","[Demonstração] Praia Ficticia Reserva nº 6\t31/12/2026 a 04/01/2027\tPagamento integral\tCancelada\tR$ 3.200,00\tVer detalhe","Excursao Ficticia Integrada Reserva nº 5\t24/11/2026 a 24/11/2026\tPagamento integral\tConcluída\tR$ 150,01\tVer detalhe"]
- celular: avisos com rolagem horizontal?: false
- INVARIANTE ocupacao fora de 0..capacidade: 0
- INVARIANTE ocupacao x reservas (excursoes do cenario): [[1,1]]
- diferencas nas excursoes de demonstracao (ocupacao fixada pelo seed): [[1,11,0],[3,25,0],[4,18,0],[6,15,0]]
- INVARIANTE reserva ativa duplicada: 0
- INVARIANTE reembolso acima do pago: 0
- INVARIANTE auditoria aceita exclusao?: nao
- INVARIANTE auditoria: dados sensiveis: []
- auditoria: eventos: 94
- encerramento controlado da API: 0
- console da API: dados sensiveis?: []
- console da API: falhas da rotina: []
- mensagens de console do navegador: []
- excecoes no navegador: 0
- hosts contatados: ["127.0.0.1:5173",""]

## E. Erros e dificuldades do agente, e correções

1. Defeito anterior (RN-001 à noite) e comportamento não definido (confirmação depois da partida), encontrados e tratados.
2. Dois testes instáveis de atividades anteriores, escritos pelo próprio agente, encontrados só pela repetição da suíte.
3. Nos testes novos, corrigidos antes do fim: o caso de capacidade da RN-021 não testava a regra; uma verificação sem efeito e comentários errados nos fluxos; a RN-018 e a RN-040 reforçadas (o agente avaliou que a versão anterior da RN-040 não detectaria a troca do modo da transação; isso não foi executado).
4. Um ajuste no cenário da RN-025 quebrou o teste (o banco exige prazo anterior à partida) e foi desfeito, com explicação.
5. Uma sonda inicial falhou por dados curtos; um CPF fictício inválido no roteiro do navegador e uma pontuação na cópia dos requisitos foram corrigidos.
6. Na auditoria do fechamento: uma frase imprecisa na tabela de divergências da matriz ("três comportamentos") foi corrigida.

## F. Limitações, pontos abertos, influência e revisão humana (RN-044)

Limitações: verificação pelo agente que implementou o sistema; sem segundo avaliador; uma alteração proposital por regra não cobre todas as violações; RN-005 só confere o formato; RN-043 e RN-044 dependem de registros redigidos em grande parte pelo agente; RN-025 e RN-031 usam ajuste artificial no banco; sob carga extrema o teste das duas rotinas ainda pode falhar; a repetição não prova ausência de outro teste instável; tela do passageiro e rótulos administrativos dizem "sem vaga" no caso depois da partida; excursão sem situação "Concluída"; menu do administrador em mais de uma linha; sem carga, desempenho, acessibilidade por ferramenta, outro navegador ou provedor real.

Ressalva da RN-044: AGT-001 e AGT-002 têm a avaliação confirmada pelo pesquisador (a da AGT-001 anota que o agente não declarou revisão do código); a AGT-003 registra aprovação posterior da revisão do código de segurança; AGT-004 a AGT-013 registram a revisão como aprovada pelo pesquisador; AGT-014 a AGT-017, pela autorização permanente de 19/11/2026. Desde a AGT-006 a aprovação decorre, em geral, da resposta de classificação, **sem observações próprias do pesquisador sobre o código**. As Seções 11 foram redigidas pelo agente.

Pontos sem resposta (**perguntas ao autor**): (1) os nomes das situações da retenção diferem entre a especificação ("Convertida", "Liberada") e o sistema (confirmada, cancelada); (2) a RN-046 aplicada no instante exato da partida não foi confirmada expressamente.

Possível influência sobre a classificação: a pedido permanente do pesquisador, o agente recomendou AP-3 no relatório e apresentou a leitura contrária (AP-4), pela qual a pergunta sobre o teste instável escrito pelo agente seria reparo de falha não corrigida por ele. O pesquisador respondeu "ap 3", sem justificativa escrita.

## G. Regras de negócio, quadros, contagens e referências cruzadas

### G1. Lista de regras de negócio do TCC (apêndice e menções)

Acrescentar, com este texto exato (origem na última coluna):

| RN-045 | A reserva em Aguardando pagamento, sem pagamento pendente ou confirmado, de excursão já terminada é cancelada automaticamente. | Decisão do pesquisador (AGT-014, 26/11/2026) |
| RN-046 | A confirmação financeira recebida depois da partida da excursão não ocupa vaga e é registrada para tratamento administrativo. | Decisão do pesquisador (AGT-017, 26/11/2026) |

Se o Docs trouxer marcas "[confirmar]" em RN-007, RN-036 ou RN-037, retirá-las, conforme as linhas atuais:

| RN-007 | A recuperação de acesso usa token de uso único e validade limitada. | Nova; duração de 30 minutos decidida na AGT-003 |
| RN-036 | Com reserva ou retenção ativa, condições comerciais e temporais da excursão não podem ser editadas; nome, imagem e descrição continuam editáveis. | Piloto/AGT-005; confirmada na AGT-005 |
| RN-037 | A excursão é criada em Rascunho; a publicação é ação distinta. | Piloto/AGT-005; confirmada na AGT-005 |

Situações da excursão: quatro implementadas (Rascunho, Publicada, Encerrada e Cancelada); "Concluída" fica como trabalho futuro. Onde o texto **descreve a especificação atual** como "44 regras" ou "RN-001 a RN-044", passar a **46** e "RN-001 a RN-046". Não alterar textos que citam instruções ou registros antigos.

### G2. Dados para quadros

- Experimento principal: 17 das 18 atividades concluídas e classificadas (n = 17), todas AP-3; AGT-018 não iniciada. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-017 | AP-3 | 1 | 796 (76 novos) | Sim (decisão sobre verificação, correções e pontos abertos de regras; e sobre teste instável) | e85d169. Data da fonte do quadro: 26/11/2026.
- Duração: 62,52 min (19:53:14 a 21:01:55 de 26/11/2026, descontados 6 min 10 s de espera).
- Próxima atividade: revisão técnica final (AGT-018). Data de corte da execução experimental: 30/11/2026.
- Apêndice D: AGT-017 (principal, AP-3): todas as RN; documento docs/validacao-das-regras.md; pastas tests, server e src; 796 testes; commit e85d169.
- Linha das métricas: AGT-017,Claude Code (Claude Sonnet 5.5),Qualidade / Testes integrados e validacao de regras,62.52,1,796,796,0,defeito anterior na maioridade a noite (dia em UTC) corrigido; confirmacao apos a partida ocupava vaga (decidida e corrigida); dois testes instaveis de atividades anteriores corrigidos; testes novos fracos reforcados pelo agente (duracao sem a espera pela segunda decisao; inclui repeticoes da suite mutacoes carga e percurso em execucao real; esperas por aprovacao primeiras decisoes e classificacao nao contadas),Nao,Sim,Decisao sobre verificacao correcoes e pontos abertos de regras (3 paradas previstas) e sobre teste instavel,AP-3,e85d169

## H. Ficha AGT-017 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-017 — Testes integrados e validação das regras
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Testar de forma integrada os fluxos principais do sistema e verificar cada uma das regras de negócio, registrando o que é atendido, atendido em parte, não atendido ou não verificável por teste, conforme as decisões do pesquisador.
- **Requisitos relacionados:** Todas as regras de negócio (RN-001 a RN-044 na instrução; RN-045 e RN-046 acrescentadas durante a atividade); RNF-007 a RNF-009, RNF-021 a RNF-024 e RNF-029.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-017.md (escrita pelo agente e aprovada pelo pesquisador em 26/11/2026 às 19:51:28; usada sem alterações).
- **Critérios de aceitação:** 16 critérios na Seção 4 do registro, todos marcados, com as ressalvas da Seção 11. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação; a revisão do código foi registrada como aprovada pela autorização permanente de 19/11/2026.
- **Testes:** 796 testes em 41 arquivos, todos aprovados, 0 reprovados (76 novos: 69 por regra, 6 de fluxos encadeados e 1 de interface). 44 alterações propositais, uma por regra verificável, detectadas. Suíte completa executada 70 vezes, com 2 falhas em testes instáveis de atividades anteriores, corrigidos; últimas 23 rodadas sem falha. Percurso em aplicação e navegador reais (Microsoft Edge sem cabeça) com dados fictícios.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 62,52 min (decisões respondidas às 19:53:14 e verificação final às 21:01:55, de 26/11/2026, descontada a espera de 6 min 10 s pela segunda decisão), incluindo repetições da suíte, alterações propositais, investigação sob carga e percurso em execução real. A espera pela aprovação, pelas primeiras decisões e pela classificação não é contada. Exclui a revisão humana.
- **Pausas ou interrupções:** Uma parada obrigatória prevista na instrução, com três decisões, e uma segunda pergunta durante a execução (6 min 10 s). O contexto da sessão foi resumido automaticamente pela ferramenta, sem reinício.
- **Intervenção humana:** Sim: decisão sobre a forma de verificação, o tratamento do encontrado e os pontos abertos de regras; e sobre o tratamento de um teste instável.
- **Decisão técnica:** Testes integrados pela API; quatro categorias de resultado; uma alteração proposital por regra; corrigir defeitos sem mudar regra; confirmação depois da partida não ocupa vaga; RN-045 e RN-046 acrescentadas e marcas "[confirmar]" retiradas; excursão sem situação "Concluída"; RN-005 atendida em parte; comando da rotina espera 20 s pelo banco.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
- **Commits:** e85d169 (atividade e registro).
- **Evidências:** Registro (Seções 6 a 10); diário (Entradas 123 a 128); METRICAS.csv; docs/validacao-das-regras.md, tests/regras-negocio.test.ts, tests/fluxos-integrados.test.ts, tests/helpers/plataforma.ts e tests/web-titulo.test.tsx.
- **Classificação final:** AP-3 (decisão do pesquisador, 26/11/2026; intervenção planejada de governança prevista na instrução). O agente recomendou a classe no relatório (possível influência).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado).
- **Limitações:** Verificação feita pelo agente que implementou o sistema; uma alteração proposital por regra; RN-005 só no formato; RN-043 e RN-044 conferidas nos registros, com ressalva; ajustes artificiais no banco em cenários; teste das duas rotinas ainda pode falhar sob carga extrema; nomes das situações da retenção diferentes entre especificação e sistema; rótulos "sem vaga" no caso depois da partida; excursão sem "Concluída"; menu do administrador em mais de uma linha; sem carga, desempenho, outro navegador ou provedor real. A avaliação humana foi redigida pelo agente a pedido do pesquisador.

## I. Matriz de validação das regras (cópia literal de docs/validacao-das-regras.md)


> Verificação feita em 26/11/2026 pelo mesmo agente que implementou o sistema. **Não substitui a revisão humana** (RN-044) e não é
> revisão independente. Os pagamentos, reembolsos e e-mails são **simulados** e os dados são fictícios.

### Como foi verificado

- **Um bloco de testes por regra** em `tests/regras-negocio.test.ts`, pela API, com a aplicação completa e relógio controlado
  (`tests/helpers/plataforma.ts`). Exceções com acesso direto ao banco ou às funções: restrições do esquema (RN-021, RN-023, RN-038,
  RN-039) e concorrência entre conexões (RN-040); alguns cenários ajustam o banco, como indicado na tabela.
- **Fluxos encadeados** em `tests/fluxos-integrados.test.ts` (fluxos 1 a 9 de `05-FLUXOS-E-ESTADOS.md`).
- **Invariantes** ao fim de cada cenário: ocupação entre zero e a capacidade e igual às reservas que ocupam vaga; uma reserva não
  cancelada por passageiro e excursão; nenhum reembolso acima do pago; auditoria sem exclusão e sem dados sensíveis.
- **Alteração proposital** (uma por regra verificável): o código é alterado, os testes da regra são executados, devem falhar, e o
  arquivo é restaurado e conferido byte a byte. As 44 foram detectadas. Uma alteração por regra mostra que o teste reage àquela
  violação, não a todas as possíveis.

Resultados usados: **atendida**, **atendida em parte**, **não atendida** e **não verificável por teste** (decisão do pesquisador).

### Resumo

| Resultado | Regras | n (de 46) |
| --- | --- | --- |
| Atendida | RN-001 a RN-004, RN-006 a RN-042, RN-045 e RN-046 | 43 |
| Atendida em parte | RN-005 | 1 |
| Não atendida | nenhuma ao fim da atividade | 0 |
| Não verificável por teste | RN-043 e RN-044 | 2 |

Antes das correções, os testes novos mostraram a RN-001 (com a RN-039) **não atendida** entre 21:00 e 23:59 de Brasília, e a
confirmação depois da partida ocupava vaga, comportamento que a especificação não definia e que passou a ser a RN-046.

### Matriz

| Regra | Texto | Resultado | Como foi verificada e limites | Alteração proposital detectada |
| --- | --- | --- | --- | --- |
| RN-001 | Apenas usuários com 18 anos ou mais podem concluir o cadastro. | Atendida | Cadastro pela API no limite dos 18 anos, inclusive às 22h de Brasília da véspera. Usa a data declarada; nenhum documento é conferido. **Defeito corrigido nesta atividade.** | maioridade aos 17 (`server/auth/validation.ts`): 2 teste(s) falharam |
| RN-002 | O CPF deve ser único. | Atendida | Segundo cadastro com o mesmo CPF em outro formato. O banco também impede (restrição de unicidade). | CPF fora da verificacao de duplicidade (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-003 | O e-mail deve ser único. | Atendida | Segundo cadastro com o mesmo e-mail em maiúsculas e com espaços. O banco também impede. | e-mail fora da verificacao de duplicidade (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-004 | São obrigatórios: nome completo, CPF, data de nascimento, telefone ou WhatsApp, e-mail e senha. | Atendida | Cadastro sem cada um dos seis campos. | telefone em branco sem aviso de obrigatorio (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-005 | O telefone ou WhatsApp deve passar pelo mecanismo de validação definido. | **Atendida em parte** | Formatos inválidos recusados e número gravado normalizado. **Em parte** (decisão 3.5): só o formato é conferido; a posse do número não é comprovada. | DDD nao conferido (`server/auth/validation.ts`): 1 teste(s) falharam |
| RN-006 | O login ocorre por e-mail e senha. | Atendida | Entrada com senha certa, errada, e-mail inexistente e CPF no lugar do e-mail. | senha nao conferida no login (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-007 | A recuperação de acesso usa token de uso único e validade limitada. | Atendida | Reuso do token e uso após 30 minutos. Entrega do token simulada. A alteração proposital testou a validade; o uso único tem duas travas no código. | validade do token ignorada (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-008 | A sessão expira e pode ser revogada; o acesso protegido é revalidado no servidor. | Atendida | Saída revoga; sessão vence em 8 horas; perfil trocado no banco passa a ser recusado. | sessao revogada aceita (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-009 | Cada reserva é individual e vinculada a um único passageiro autenticado. | Atendida | Visitante, administrador, tentativa de escolher o passageiro, reserva alheia e segunda reserva ativa. | reserva de outra pessoa visivel (`server/reservas/service.ts`): 1 teste(s) falharam |
| RN-010 | O checkout é obrigatório. | Atendida | Pagamento sem checkout recusado, sem pagamento nem vaga. | pagamento sem checkout (`server/pagamentos/service.ts`): 1 teste(s) falharam |
| RN-011 | O pagamento integral é a modalidade padrão. | Atendida | Reserva sem informar a modalidade. | padrao parcelado (`server/reservas/service.ts`): 1 teste(s) falharam |
| RN-012 | O pagamento em duas parcelas de 50% pode ser habilitado individualmente por excursão. | Atendida | Excursão sem parcelamento recusa; parcelas de R$ 75,00 e R$ 75,01 para R$ 150,01. Com total ímpar, as parcelas diferem em um centavo. | segunda parcela igual a primeira (`shared/dinheiro.ts`): 1 teste(s) falharam |
| RN-013 | A data limite da segunda parcela é configurada por excursão e é anterior à partida (23:59:59 da data configurada). | Atendida | Data no dia da partida ou depois recusada; prazo gravado como 23:59:59 de Brasília, por excursão. | prazo no dia da partida aceito (`server/excursoes/validation.ts`): 1 teste(s) falharam |
| RN-014 | Durante o checkout há retenção temporária de vaga. | Atendida | Checkout cria retenção ativa de 15 minutos. | retencao com o dobro do prazo (`server/reservas/service.ts`): 1 teste(s) falharam |
| RN-015 | A retenção não representa ocupação definitiva. | Atendida | Retenção reduz a disponibilidade sem ocupar; vencida, a vaga volta. | retencao vencida continua contando (`server/vagas/disponibilidade.ts`): 1 teste(s) falharam |
| RN-016 | No pagamento integral, a confirmação financeira converte a retenção em ocupação efetiva e a reserva fica "Pronto para embarque". | Atendida | Pagamento integral aprovado: retenção confirmada, vaga ocupada, reserva pronta. Provedor de pagamento simulado. | integral paga nao fica pronta (`server/pagamentos/confirmacao.ts`): 1 teste(s) falharam |
| RN-017 | No parcelamento, a confirmação da primeira parcela ocupa a vaga e mantém obrigação financeira pendente. | Atendida | Primeira parcela ocupa a vaga e deixa a segunda pendente. Provedor simulado. | primeira parcela deixa a reserva pronta (`server/pagamentos/confirmacao.ts`): 1 teste(s) falharam |
| RN-018 | A confirmação da segunda parcela conclui a quitação. | Atendida | Segunda parcela quita sem ocupar outra vaga. Provedor simulado. | segunda parcela nao e confirmada (`server/pagamentos/confirmacao.ts`): 1 teste(s) falharam |
| RN-019 | Se a segunda parcela não for paga no prazo, a vaga é liberada. | Atendida | Vaga ocupada até o último milissegundo e liberada no prazo; outra pessoa ocupa. A gravação depende da rotina ou de uma operação; a leitura já considera o prazo. | vencimento so depois do instante do prazo (`server/vagas/vencimento.ts`): 1 teste(s) falharam |
| RN-020 | Nesse caso, a primeira parcela permanece não reembolsável. | Atendida | Primeira parcela continua paga e sem reembolso, também após o cancelamento da excursão. | cancelamento da excursao alcanca canceladas (`server/cancelamentos/service.ts`): 1 teste(s) falharam |
| RN-021 | Nenhuma operação pode resultar em vagas ocupadas acima da capacidade da excursão. | Atendida | Cinco checkouts simultâneos para duas vagas; redução de capacidade recusada; restrição do banco. Um servidor e um banco SQLite; sem teste de carga. | checkout sem vaga livre (`server/reservas/service.ts`): 1 teste(s) falharam |
| RN-022 | Confirmação financeira recebida após a expiração da retenção, sem disponibilidade, é registrada para tratamento administrativo, sem criar vaga adicional. | Atendida | Confirmação com retenção vencida e sem vaga: pendência, sem vaga adicional. Provedor simulado. | confirmacao sem vaga sem sinalizacao (`server/pagamentos/confirmacao.ts`): 1 teste(s) falharam |
| RN-023 | As situações da reserva são: Aguardando pagamento, Pronto para embarque, Concluída e Cancelada. | Atendida | O banco aceita as quatro situações e recusa uma quinta; filtro administrativo recusa. | quinta situacao aceita pelo banco (`server/db/migrations.ts`): 1 teste(s) falharam |
| RN-024 | Reservas integralmente pagas ou com segunda parcela quitada ficam "Pronto para embarque". | Atendida | Integral paga e parcelada quitada prontas; só com a primeira, não. | quitacao sem Pronto para embarque (`server/pagamentos/confirmacao.ts`): 1 teste(s) falharam |
| RN-025 | Um dia após a data final da excursão, reservas elegíveis ficam automaticamente "Concluída". | Atendida | Muda a partir de 00:00 de Brasília do dia seguinte, pela rotina; a parcelada não quitada não muda. Com a rotina desligada, a gravação só ocorre em uma consulta. Um ajuste artificial no banco cria a parcelada não quitada. | conclui no proprio dia final (`server/vagas/conclusao.ts`): 1 teste(s) falharam |
| RN-026 | Reservas concluídas permanecem no histórico do passageiro. | Atendida | Concluída no histórico anos depois; não pode ser desfeita pelo passageiro. | concluida fora do historico (`server/reservas/service.ts`): 1 teste(s) falharam |
| RN-027 | Cancelamento pelo passageiro com antecedência de pelo menos duas semanas: reembolso de 100% do valor elegível. | Atendida | Exatamente 14 dias antes: 100%. Antecedência em períodos exatos até a partida (decisão da AGT-013). | 14 dias exatos sem 100% (`server/cancelamentos/regra.ts`): 1 teste(s) falharam |
| RN-028 | Com menos de duas semanas e pelo menos uma semana: reembolso de 50% do valor elegível. | Atendida | Um milissegundo a menos que 14 dias e exatamente 7 dias antes: 50%. Metade arredondada para baixo (AGT-013). | 7 dias exatos sem 50% (`server/cancelamentos/regra.ts`): 1 teste(s) falharam |
| RN-029 | Com menos de uma semana: sem reembolso. | Atendida | Um milissegundo a menos que 7 dias: sem reembolso e vaga liberada. | menos de 7 dias com 50% (`server/cancelamentos/regra.ts`): 1 teste(s) falharam |
| RN-030 | O reembolso incide sobre o valor efetivamente pago e elegível. | Atendida | Parcelada quitada considera as duas parcelas; pagamento pendente fica de fora. | pagamento pendente no calculo (`server/cancelamentos/service.ts`): 1 teste(s) falharam |
| RN-031 | Cancelamento pela organização: reembolso integral dos valores pagos aos passageiros afetados. | Atendida | Cancelamento da excursão a três dias: 100% para a integral e para a parcelada só com a primeira. Um ajuste artificial no banco aproxima o prazo da segunda parcela. O reembolso depende do processamento pelo administrador (simulado). | organizacao devolve metade (`server/cancelamentos/service.ts`): 1 teste(s) falharam |
| RN-032 | A primeira parcela de reserva parcelada não quitada permanece não reembolsável (inadimplência). | Atendida | Cancelamento pelo passageiro com muita antecedência: sem reembolso. | primeira parcela nao quitada elegivel (`server/cancelamentos/regra.ts`): 1 teste(s) falharam |
| RN-033 | O administrador configura capacidade, preço, parcelamento e prazo da segunda parcela de cada excursão. | Atendida | Administrador cria e altera capacidade, preço, parcelamento e prazo; visitante e passageiro recusados. | passageiro configura excursao (`server/excursoes/routes.ts`): 1 teste(s) falharam |
| RN-034 | O administrador consulta passageiros e reservas. | Atendida | Quatro consultas: administrador 200, passageiro 403, visitante 401. | passageiro consulta a administracao (`server/admin/routes.ts`): 1 teste(s) falharam |
| RN-035 | Alterações manuais de situação só ocorrem quando autorizadas e ficam registradas na auditoria. | Atendida | Alterações não autorizadas recusadas; a autorizada exige justificativa e fica na auditoria. | conclusao manual antes do fim (`server/admin/service.ts`): 1 teste(s) falharam |
| RN-036 | Com reserva ou retenção ativa, condições comerciais e temporais da excursão não podem ser editadas; nome, imagem e descrição continuam editáveis. | Atendida | Os sete campos protegidos bloqueados com reserva ativa; livres editáveis; sem reserva ativa, liberados. O caso "só retenção ativa" não ocorre sem reserva ativa. | campos protegidos liberados (`server/excursoes/service.ts`): 7 teste(s) falharam |
| RN-037 | A excursão é criada em Rascunho; a publicação é ação distinta. | Atendida | Nasce em Rascunho, invisível e sem reserva até publicar. | excursao nasce publicada (`server/excursoes/service.ts`): 1 teste(s) falharam |
| RN-038 | Valores monetários são guardados em centavos inteiros (BRL). | Atendida | Preço fracionado ou em texto recusado; parcelas e reembolso inteiros; banco recusa decimal. A conversão de reais na interface é coberta pelos testes de interface. | preco fracionado aceito (`server/excursoes/validation.ts`): 1 teste(s) falharam |
| RN-039 | Instantes são guardados em UTC e interpretados no fuso America/Sao_Paulo. | Atendida | Instante sem fuso recusado; amostra de colunas gravadas em UTC; virada do dia em Brasília. O esquema exige o formato UTC em todas as colunas de instante. **Defeito de data corrigido (ver RN-001).** | fuso trocado para UTC (`shared/fuso.ts`): 1 teste(s) falharam |
| RN-040 | Retenção, confirmação e expiração usam mecanismos que preservam a capacidade sob processamento concorrente. | Atendida | Duas conexões ao mesmo arquivo: a segunda não inicia transação enquanto a primeira grava; confirmações simultâneas. Uma máquina; não há teste com mais de um servidor. | transacao sem bloqueio imediato (`server/db/transaction.ts`): 1 teste(s) falharam |
| RN-041 | Operações administrativas e automáticas relevantes geram histórico de auditoria. | Atendida | Sete ações administrativas com o autor e quatro automáticas sem autor. "Relevantes": a lista verificada é a do teste. | conclusao automatica sem o registro esperado (`server/vagas/conclusao.ts`): 1 teste(s) falharam |
| RN-042 | Logs e auditoria não contêm senhas, tokens ou dados cadastrais desnecessários. | Atendida | Fluxos de conta, reserva, pagamento, consulta administrativa e rotina, com auditoria e console inspecionados. Só os fluxos exercitados. Os provedores simulados de recuperação e de e-mail gravam token e endereço em arquivos locais fora do Git: são o canal de entrega, não registro. | e-mail gravado na auditoria (`server/auth/service.ts`): 1 teste(s) falharam |
| RN-045 | A reserva em Aguardando pagamento, sem pagamento pendente ou confirmado, de excursão já terminada é cancelada automaticamente. | Atendida | Antes e depois do fim; reserva com pagamento pendente preservada. Aplicada só pela rotina. | pagamento pendente nao protege (`server/vagas/encerramento.ts`): 1 teste(s) falharam |
| RN-046 | A confirmação financeira recebida depois da partida da excursão não ocupa vaga e é registrada para tratamento administrativo. | Atendida | Um milissegundo antes ocupa; na partida, durante e depois não ocupa; reembolso cancela a reserva. Regra **implementada nesta atividade** (decisões 3.1 e 3.2). Provedor simulado. | no instante da partida ainda ocupa (`server/pagamentos/confirmacao.ts`): 2 teste(s) falharam |

### Regras não verificáveis por teste

| Regra | Texto | Por que não há teste | Conferência nos registros | Ressalva |
| --- | --- | --- | --- | --- |
| RN-043 | A IA não pode alterar autonomamente regras de negócio aprovadas. | É conduta do agente durante o desenvolvimento, não comportamento do sistema. | O histórico do Git mostra `04-REGRAS-DE-NEGOCIO.md` sem alteração desde o commit da linha de base até a AGT-017, quando entraram a RN-045 e a RN-046 e saíram as marcas "[confirmar]", com textos e decisão do pesquisador (Seção 6 do registro). Os pontos sem definição aparecem nos registros como decisões do pesquisador. | A conferência foi feita pelo próprio agente, sobre registros que ele redigiu; não prova a inexistência de interpretação não percebida no código. |
| RN-044 | Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana. | É um ato humano. | Seção 11 de cada registro: AGT-001 e AGT-002 têm a avaliação confirmada pelo pesquisador (a da AGT-001 anota que o agente não declarou revisão do código); a AGT-003 registra a aprovação posterior da revisão do código de segurança; AGT-004 a AGT-013 registram "Revisão do código: aprovada pelo pesquisador"; AGT-014 a AGT-016, "registrada como aprovada pela autorização permanente de 19/11/2026". A revisão desta atividade está pendente. | As Seções 11 foram redigidas pelo agente a pedido do pesquisador; desde a AGT-006 a aprovação decorre, em geral, da resposta de classificação sob a autorização permanente, **sem observações próprias do pesquisador sobre o código**. Não há segundo avaliador. O registro comprova a aprovação declarada, não a profundidade da revisão. |

### Divergências e pontos encontrados

| Nº | Encontrado | Tratamento |
| --- | --- | --- |
| 1 | RN-001/RN-039: a idade e a data futura eram calculadas pelo dia UTC; das 21:00 às 23:59 de Brasília, quem completaria 18 anos no dia seguinte conseguia se cadastrar. | Corrigido (`server/auth/validation.ts`). |
| 2 | Pagamento pendente aprovado depois da partida, ou depois do fim, ocupava a vaga e a reserva seguia para Pronto para embarque e Concluída. | Decisão do pesquisador (RN-046), implementada. |
| 3 | Teste da AGT-014 (duas rotinas simultâneas) instável: um processo esperava mais de 5 s pelo banco e terminava com erro, sem dado incorreto. | Decisão do pesquisador: o comando `npm run rotina` passa a esperar 20 s. Sob carga extrema a falha continua possível. |
| 4 | Comportamentos sem texto na especificação (hoje RN-045 e RN-046) e pontos marcados "[confirmar]". | RN-045 e RN-046 acrescentadas e marcas retiradas, por decisão. |
| 5 | RN-005: não há comprovação de posse do telefone. | Registrada como atendida em parte; trabalho futuro. |
| 6 | A excursão não tem a situação "Concluída" do desenho em `05-FLUXOS-E-ESTADOS.md`. | Mantida a decisão de não implementar; trabalho futuro. |
| 7 | Nomes das situações da retenção: a especificação diz "Convertida" e "Expirada/Liberada"; o sistema grava `confirmada`, `expirada` e `cancelada`. | Só relatado (**pergunta ao autor**); nenhum comportamento divergente. |
| 8 | A tela e os rótulos administrativos continuam dizendo "sem vaga" para a confirmação depois da partida; o aviso ao passageiro já distingue o caso. | Só relatado. |
| 9 | Teste da AGT-006 (título da aba no detalhe público) instável: 1 falha em 17 rodadas. A tela definia o título um instante depois de mostrar o conteúdo. | Corrigido na tela (`src/ui.tsx`), sem alterar o teste antigo; teste novo `tests/web-titulo.test.tsx`. Escolha do agente, seguindo a decisão tomada no item 3. |
| 10 | Em 1280 px, o menu do administrador ocupa duas ou três linhas (já registrado na AGT-016). | Só relatado. |

### Percurso em execução real

API com a rotina ligada (a cada 2 s), front-end e Microsoft Edge sem janela, banco temporário e dados fictícios, em um cenário contínuo
pelos fluxos 1 a 9. Partes feitas pela interface (cadastro, entrada, reserva, pagamento, cancelamento, consultas) e partes por chamadas à
API dentro da sessão do navegador (criar, publicar e cancelar excursão, uma reserva sem checkout, reembolsos e pendência). **Ajustes
artificiais no banco**, para o tempo passar: (1) prazo da segunda parcela para a véspera; (2) partida há 1 hora e data final no dia;
(3) excursão terminada há 2 dias. Ao fim: ocupação válida e, na excursão do cenário, igual às reservas (as excursões de demonstração têm
ocupação fixada pelo script de dados, sem reservas), nenhuma reserva ativa duplicada, nenhum reembolso acima do pago, auditoria sem
exclusão e sem os dados sensíveis procurados; valores do painel conferidos à mão (recebido R$ 3.725,03; devolvido R$ 3.500,02; líquido
R$ 225,01).

### Execuções

`npm run check` aprovado sobre o código final em 26/11/2026 (796 testes em 41 arquivos, lint, tipos e build). A suíte completa foi repetida
70 vezes durante a atividade: 2 falhas em testes antigos instáveis (itens 3 e 9), corrigidos; as últimas 23 rodadas, sobre o código final,
não tiveram falha.

### O que não foi verificado

- Carga, volume, desempenho e os requisitos não funcionais da revisão técnica final (AGT-018).
- Provedor real de pagamento, de e-mail ou de verificação de telefone; mais de um servidor ou outro banco.
- Navegadores além do usado no percurso; acessibilidade por ferramenta; a virada do dia da RN-001 no navegador (só por teste).
- Situações fora dos cenários descritos: a aprovação nos testes não prova a ausência de defeitos.


## J. Quadro 3, análise e Seção 5.4 atualizados (substituem versões anteriores)

### J1. Substituir o parágrafo de introdução, o título, a tabela e a fonte do Quadro 3 por:

> A síntese dos registros dos dois conjuntos é apresentada no Quadro 3, que os mantém em colunas separadas e não os soma.

**Quadro 3 — Síntese dos registros por conjunto de atividades**

| Registro | Piloto (Codex, n = 5) | Experimento principal (Claude Code, n = 17) |
| --- | --- | --- |
| Atividades concluídas e classificadas | 5 de 5 executadas | 17 de 18 previstas |
| AP-1 | 4 | 0 |
| AP-2 | 0 | 0 |
| AP-3 | 1 | 17 |
| AP-4 | 0 | 0 |
| RP | 0 | 0 |
| Atividades com 1 tentativa | 3 | 16 |
| Atividades com 2 tentativas | 1 | 1 |
| Atividades com número de tentativas não registrado | 1 | 0 |
| Testes aprovados na primeira e na última atividade avaliada | 6 (AGT-001) e 198 (AGT-005) | 15 (AGT-001) e 796 (AGT-017) |
| Atividades com intervenção humana registrada | 1 | 17 |

Fonte: elaborado pelos autores, a partir dos registros AGT e das planilhas de métricas (26/11/2026). As classificações são as registradas; a distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010.

### J2. Substituir o parágrafo que começa com "Sob uma perspectiva analítica" (ou a versão anterior desta substituição) por:

> No subconjunto avaliado do experimento principal (n = 17), as 17 atividades foram classificadas como AP-3 e nenhuma como AP-4. As instruções dessas atividades previam paradas para decisão dos pesquisadores, e a classificação AP-3 registra essas intervenções planejadas. A distribuição descreve somente as atividades avaliadas: não permite concluir sobre o desempenho do agente nem estabelecer relação de causa, e não há grupo de controle. A distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010, o que constitui uma limitação a considerar na leitura desses números. O piloto com o Codex (n = 5) é apresentado em coluna própria e não é somado nem comparado estatisticamente ao experimento principal.

### J3. Seção 5.4: substituir o parágrafo que começa com "As próximas atividades do experimento principal incluem" por:

> A próxima atividade do experimento principal é a revisão técnica final (AGT-018). Resta 1 atividade planejada para a conclusão do ciclo experimental. A data de corte da execução experimental é 30/11/2026; a atividade não concluída até essa data será tratada e registrada como trabalho futuro.

## K. Registro completo da atividade (cópia literal)

### 1. Identificação

ID da atividade: AGT-017

Título: Testes integrados e validação das regras

Categoria: Qualidade / Testes integrados e validação de regras de negócio

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 26/11/2026

Requisitos relacionados:
- Todas as regras de negócio (RN-001 a RN-044), conforme o plano de atividades
- RNF-007 a RNF-009, RNF-021 a RNF-024 e RNF-029

Marcado "[confirmar]" na especificação: RN-007 (duração), RN-036, RN-037 e as situações da excursão (`05-FLUXOS-E-ESTADOS.md`).

### 2. Objetivo

Testar de forma integrada os fluxos principais do sistema e verificar cada uma das regras de negócio, registrando com fidelidade o que é
atendido, atendido em parte, não atendido ou não verificável por teste, conforme as decisões do pesquisador.

### 3. Resultado esperado

Ao final, os fluxos principais devem estar cobertos por testes encadeados; cada regra deve ter resultado, evidência ou justificativa em uma
matriz de validação; as divergências encontradas devem estar relatadas e tratadas conforme as decisões.

Não deverão ser implementados: funcionalidades novas, a revisão técnica final e os requisitos não funcionais da AGT-018, provedor real nem
mudança nas regras de negócio.

### 4. Critérios de aceitação

- [x] Decisões do pesquisador (forma de verificação e critérios; tratamento do que for encontrado; pontos abertos) tomadas e registradas com justificativa.
- [x] Testes integrados encadeando os fluxos de 05-FLUXOS-E-ESTADOS.md sobre a aplicação completa e a rotina, com relógio controlado, dados fictícios e concorrência pela última vaga.
- [x] Invariantes do banco verificados ao fim de cada cenário: ocupação válida e coerente, uma reserva não cancelada por passageiro e excursão, nenhum reembolso acima do pago, auditoria somente de inclusão e sem dados sensíveis.
- [x] Matriz de validação com todas as regras: texto, forma de verificação, testes, resultado e evidência.
- [x] Nenhuma regra marcada como atendida sem teste executado que falharia se ela fosse violada; as não verificáveis com justificativa e forma de conferência.
- [x] Detecção de violações comprovada por alterações propositais no código para a amostra declarada, com os arquivos restaurados e conferidos.
- [x] Nenhum teste existente removido, ignorado ou enfraquecido; sem teste instável.
- [x] O que foi encontrado tratado conforme a decisão 2; toda divergência relatada, mesmo que corrigida.
- [x] Pontos abertos tratados conforme a decisão 3; docs/especificacao alterado somente com texto aprovado pelo pesquisador.
- [x] Cada correção descrita com a regra afetada, o comportamento antes e depois e o teste que a comprova (RN-044).
- [x] Lint, verificação de tipos, testes e build aprovados; suíte completa executada repetidas vezes.
- [x] Percurso em execução real com um cenário contínuo pelos fluxos principais, com cada ajuste no banco declarado e os invariantes conferidos.
- [x] Documentação da validação em docs/, com o que foi e o que não foi verificado.
- [x] Nenhuma funcionalidade fora do escopo e nenhuma dependência nova sem decisão.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

### 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-017 — Testes integrados e validação das regras.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. As AGT-001 a AGT-016 criaram a fundação técnica, a persistência, o acesso, as áreas pública, do passageiro e administrativa, as reservas, as vagas, os pagamentos com provedor simulado, os cancelamentos e reembolsos, os processos automáticos, os avisos simulados e o painel. Cada atividade testou principalmente a própria parte. A matriz de rastreabilidade registra, das 44 regras de negócio, 32 evidenciadas, 3 parciais (RN-005, RN-021 e RN-040) e 9 ainda sem evidência registrada (RN-009, RN-010, RN-033, RN-038, RN-039 e RN-041 a RN-044).

Há pontos abertos registrados pelas atividades anteriores: o cancelamento automático da reserva sem pagamento de excursão terminada foi adotado por decisão do pesquisador e não consta do documento de regras; pela leitura do código, sem teste, a confirmação de um pagamento pendente de excursão já terminada não é recusada; a situação "Concluída" da excursão não foi criada; e há marcações "[confirmar]" na especificação.

Leia o CLAUDE.md, toda a especificação em docs/especificacao/, docs/matriz-rastreabilidade.md e os documentos em docs/ antes de começar.

OBJETIVO DA ATIVIDADE

Testar de forma integrada os fluxos principais do sistema e verificar cada uma das regras de negócio RN-001 a RN-044, registrando com fidelidade o que é atendido, o que é atendido em parte, o que não é atendido e o que não pode ser verificado por teste, conforme as decisões do pesquisador.

O resultado é uma verificação feita pelo mesmo agente que implementou o sistema e não substitui a revisão humana. Nesta atividade, não implemente funcionalidades novas, a revisão técnica final e os requisitos não funcionais da AGT-018, provedor real nem mudança nas regras de negócio.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- todas as regras de negócio de RN-001 a RN-044, com o texto de docs/especificacao/04-REGRAS-DE-NEGOCIO.md;
- 05-FLUXOS-E-ESTADOS.md: um fluxo é avaliado pelo comportamento resultante quando as operações são encadeadas, e não pela presença de telas isoladas;
- RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana.

REQUISITOS DESTA ATIVIDADE

- testes integrados que encadeiem os fluxos de 05-FLUXOS-E-ESTADOS.md sobre a aplicação montada com todos os serviços e a rotina automática, com relógio controlado e dados fictícios, inclusive concorrência pela última vaga;
- verificação, ao fim de cada cenário, de invariantes do banco: ocupação entre zero e a capacidade e coerente com as reservas, no máximo uma reserva não cancelada por passageiro e excursão, nenhum reembolso acima do pago, auditoria somente de inclusão e sem dados sensíveis;
- uma matriz de validação com todas as 44 regras: texto da regra, como foi verificada, testes que a cobrem, resultado e evidência. Nenhuma regra é marcada como atendida sem um teste executado que falharia se ela fosse violada, ou, quando não for verificável por teste, sem a justificativa e a forma de conferência;
- comprovação de que os testes novos detectam violações, com alterações propositais no código para uma amostra declarada das regras, restaurando e conferindo os arquivos;
- os testes existentes não podem ser removidos, ignorados nem enfraquecidos; testes instáveis não são aceitos;
- o que for encontrado é tratado conforme a decisão 2, e os pontos abertos conforme a decisão 3. Toda divergência encontrada é relatada, mesmo que corrigida;
- documentação da validação em docs/, com o que foi e o que não foi verificado. Nenhuma dependência nova sem decisão do pesquisador.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem o método de verificação, correções em código crítico e regras de negócio. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria.

1. Forma de verificação e critérios. Apresente: testes integrados pela API, automação de navegador mantida no repositório (que exigiria dependência nova) ou ambos; as categorias de resultado de cada regra e o que é preciso para cada uma; o alcance das alterações propositais no código; e como tratar as regras de governança (RN-043 e RN-044), que nenhum teste de código comprova.
2. Tratamento do que for encontrado. Apresente: corrigir nesta atividade os defeitos que não mudem regra de negócio e interromper nos que dependam de interpretação; apenas relatar, sem alterar o código; ou corrigir tudo. Indique o efeito sobre a classificação da atividade e sobre o prazo.
3. Pontos abertos de regras. Apresente, para cada um, as opções e a de não fazer nada: a confirmação de pagamento pendente de excursão já terminada; a inclusão da regra do cancelamento automático no documento de regras, com o texto proposto; as marcações "[confirmar]" que já têm decisão registrada em atividades anteriores (duração do token, RN-036 e RN-037) e a das situações da excursão; a situação "Concluída" da excursão; e a RN-005, atendida em parte.

RESTRIÇÕES

1. Não implemente funcionalidades fora do escopo.
2. Não altere os requisitos ou regras de negócio definidos pelo projeto; dúvidas ou conflitos na especificação são para o pesquisador (CLAUDE.md, regra 2).
3. Não inclua credenciais, tokens, senhas, números de cartão, dados bancários ou outros dados sensíveis no repositório, nos logs ou na auditoria. Use somente dados fictícios.
4. Não reutilize código funcional de projetos anteriores nem consulte o repositório do estudo piloto.
5. Não altere ou remova os arquivos existentes dentro das pastas TCC e docs/especificacao, exceto para preencher os campos de execução deste registro e, somente se a decisão 3 o determinar, para aplicar em docs/especificacao o texto aprovado expressamente pelo pesquisador.
6. Não modifique os registros experimentais existentes.
7. Caso exista uma decisão relevante que não possa ser tomada tecnicamente sem alterar significativamente arquitetura, dependências, segurança, custos, integrações externas, regras de negócio ou escopo do produto, interrompa e apresente a decisão ao pesquisador.
8. Você pode tomar decisões técnicas de baixo impacto necessárias, desde que as documente no relatório final, com o motivo e a versão exata de cada dependência adicionada.
9. Não realize commit Git. O commit será realizado somente após revisão humana.
10. Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana (RN-044): descreva no relatório cada correção feita, a regra afetada, o comportamento antes e depois e o teste que a comprova.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- execute a suíte completa repetidas vezes e relate qualquer falha intermitente;
- coloque API, front-end e rotina em execução, com dados fictícios, percorra no navegador um cenário contínuo que passe pelos fluxos principais, declarando cada ajuste no banco, e confira os invariantes;
- confira que cada regra da matriz tem resultado e evidência ou justificativa;
- corrija somente o que a decisão 2 e a decisão 3 permitirem.

RELATÓRIO OBRIGATÓRIO

Ao finalizar, apresente um relatório contendo:

1. resumo do que foi verificado e o resultado por regra;
2. decisões técnicas tomadas e respectivas justificativas;
3. tecnologias e versões efetivamente utilizadas;
4. arquivos e diretórios relevantes criados ou modificados;
5. dependências adicionadas;
6. comandos relevantes executados;
7. testes e verificações executados;
8. resultados dos testes, análise estática, verificação de tipos e build;
9. erros, defeitos e divergências encontrados;
10. correções realizadas durante a execução;
11. limitações ou pendências identificadas, inclusive o que não foi verificado e as regras não atendidas ou atendidas em parte;
12. qualquer ponto que considere necessário para revisão humana.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-017.

### 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-26T19:51:28-03:00. Início da execução: 2026-11-26T19:51:28-03:00. Início da implementação (decisões respondidas): 2026-11-26T19:53:14-03:00.

Decisões do pesquisador (resposta "recomendadas", 2026-11-26T19:53:14-03:00), tomadas depois da apresentação das opções com recomendação, antes de qualquer arquivo do projeto. Antes da apresentação, o agente confirmou em memória, sem criar arquivo, o ponto do pagamento: aprovar um pagamento pendente depois da partida, ou depois do fim, ocupava a vaga, e a reserva seguia para Pronto para embarque e Concluída.

1. **Forma de verificação e critérios.**
   - 1.1 A: testes integrados encadeados pela API, com a aplicação completa; navegador só no percurso manual. Recusadas: automação de navegador no repositório (dependência nova); ambos.
   - 1.2 A: resultados **atendida**, **atendida em parte**, **não atendida** e **não verificável por teste**. Recusada: só atendida ou não.
   - 1.3 A: uma alteração proposital por regra verificável. Recusadas: só pagamentos, vagas e cancelamentos; nenhuma.
   - 1.4 A: RN-043 e RN-044 como **não verificáveis por teste**, conferidas nos registros e com ressalva (várias revisões da RN-044 foram registradas pela autorização permanente, sem observações do pesquisador). Recusada: marcá-las como atendidas.
2. **Tratamento do encontrado (2 A).** Corrigir os defeitos que não mudem regra de negócio, interromper nos que dependam de interpretação e relatar todos. Recusadas: só relatar; corrigir tudo.
3. **Pontos abertos.**
   - 3.1 A: a confirmação financeira recebida **depois da partida não ocupa vaga** e fica registrada para o administrador reembolsar. Recusadas: recusar a confirmação; deixar como está.
   - 3.2 A: acrescentar a `04-REGRAS-DE-NEGOCIO.md` as regras, com estes textos aprovados: **RN-045** "A reserva em Aguardando pagamento, sem pagamento pendente ou confirmado, de excursão já terminada é cancelada automaticamente." (origem: decisão da AGT-014); **RN-046** "A confirmação financeira recebida depois da partida da excursão não ocupa vaga e é registrada para tratamento administrativo." (origem: decisão da AGT-017). Recusada: manter só nos documentos das atividades.
   - 3.3 A: retirar as marcas "[confirmar]" (RN-007, RN-036, RN-037 e situações da excursão), citando as decisões já tomadas. Recusada: manter.
   - 3.4 A: a excursão continua **sem** situação "Concluída", como limitação e trabalho futuro. Recusada: criar agora.
   - 3.5 A: a RN-005 é registrada como **atendida em parte** (só o formato é conferido). Recusada: registrá-la como atendida.

Justificativas (as das recomendações do agente, aceitas sem texto próprio do pesquisador): 1.1 A não exige dependência; 1.2 A e 1.4 A evitam declarar atendido o que não foi comprovado; 1.3 A comprova cada regra; 2 A corrige sem decidir regra; 3.1 A não registra ocupação que não ocorrerá e preserva o registro do dinheiro (como na RN-022); 3.2 A faz o documento descrever o comportamento do sistema; 3.3 A atualiza o documento com o já decidido; 3.4 A respeita o escopo; 3.5 A é fiel à verificação feita.

Segunda decisão do pesquisador (resposta "Esperar 20 s no comando", registrada em 2026-11-26T20:40:13-03:00, pela caixa de pergunta do agente): o teste
da AGT-014 "dois comandos ao mesmo tempo liberam cada vaga uma unica vez" falhou na repetição da suíte. O agente reproduziu a falha sob
carga artificial (um dos processos esperava mais de 5 s pelo banco e registrava "database is locked") e apresentou três opções: **o comando
`npm run rotina` esperar até 20 s (adotada, recomendada pelo agente)**; ajustar o teste antigo (recusada, por alterar teste existente);
deixar e relatar (recusada, por não atender ao critério de teste estável). Justificativa da recomendação, aceita sem texto próprio do
pesquisador: não muda regra de negócio nem o teste, e o comando não atende ninguém enquanto espera.

### 7. Alterações realizadas pelo agente

Arquivos novos:
- `tests/helpers/plataforma.ts` (aplicação completa por HTTP, relógio controlado, provedores simulados capturados e invariantes);
- `tests/regras-negocio.test.ts` (69 testes, um bloco por regra verificável: RN-001 a RN-042, RN-045 e RN-046);
- `tests/fluxos-integrados.test.ts` (6 cenários encadeados dos fluxos 1 a 9);
- `tests/web-titulo.test.tsx` (1 teste);
- `docs/validacao-das-regras.md` (matriz de validação, divergências e o que não foi verificado).

Alterados (código de outras atividades):
- `server/auth/validation.ts`: dia atual de Brasília no cálculo da idade e da data futura;
- `server/pagamentos/confirmacao.ts`: confirmação a partir da partida não ocupa vaga (RN-046);
- `server/comunicacao/textos.ts`: aviso próprio para a confirmação depois da partida;
- `server/processos/rotina-cli.ts`: o comando espera até 20 s pelo banco;
- `src/ui.tsx`: o título da aba é definido antes de a tela ser desenhada.

Especificação (somente o texto aprovado na decisão 3): `docs/especificacao/04-REGRAS-DE-NEGOCIO.md` (RN-045, RN-046 e retirada das marcas
"[confirmar]"), `docs/especificacao/05-FLUXOS-E-ESTADOS.md` (retirada da marca das situações da excursão) e a cópia
`docs/requisitos/RN.md`.

Documentação: `README.md`, `docs/autenticacao.md`, `docs/banco-de-dados.md`, `docs/comunicacao.md`, `docs/processos-automaticos.md` e
`docs/reservas.md`.

Sem migração e sem dependência nova. Nenhum arquivo de teste existente foi alterado ou removido.

Correções, para revisão (RN-044):

| Nº | Regra | Antes | Depois | Teste que comprova |
| --- | --- | --- | --- | --- |
| C1 | RN-001, RN-039 | Idade e data futura calculadas pelo dia UTC: das 21:00 às 23:59 de Brasília, quem completaria 18 anos no dia seguinte era aceito. | Dia de Brasília. | RN-001, "o hoje e o de Brasilia": falhou antes e passa depois. |
| C2 | RN-046 (nova, por decisão) | Pagamento pendente aprovado depois da partida ocupava vaga; a reserva ficava Pronta para embarque e depois Concluída. | Não ocupa vaga; pagamento confirmado com pendência "confirmacao_sem_vaga", marca `apos_partida` na auditoria e aviso próprio. Vale para a parcela única e a primeira; a segunda, depois da partida, já é posterior ao prazo. | Bloco RN-046: 4 testes falharam antes e passam depois. |
| C3 | nenhuma (estabilidade; AGT-014) | `npm run rotina` desistia de um passo após 5 s de banco ocupado, e o teste de duas execuções simultâneas falhava sob carga. | Espera até 20 s, só neste comando (decisão do pesquisador). | Sob carga artificial: 2 falhas em 3 tentativas antes; nenhuma em 13 depois (7 com a alteração temporária, 6 com a final). |
| C4 | nenhuma (estabilidade; AGT-006) | O título da aba mudava um instante depois do conteúdo, e um teste antigo falhava às vezes. | Muda junto com o conteúdo (`useLayoutEffect`). | `web-titulo`: falhou 5 de 5 antes e passou 5 de 5 depois. |

### 8. Comandos e testes

- Testes antes da atividade: 720 em 38 arquivos. Ao fim: **796 em 41 arquivos** (76 novos: 69 de regras, 6 de fluxos e 1 de título).
- `npm run check` (lint sem avisos, testes, `tsc --noEmit` e build) aprovado às 20:02:01 (795), 20:41:53 (795) e **20:51:18 (796, código final)**.
- Testes novos antes das correções C1 e C2 (19:56:46): 64 aprovados e 5 reprovados (1 da RN-001 e 4 da RN-046).
- **Alterações propositais** (20:06:00): 44, uma por regra verificável, sobre `tests/regras-negocio.test.ts` filtrado pela regra; **44 de 44
  detectadas** e arquivos restaurados e conferidos byte a byte. A lista, com arquivo e número de falhas, está na matriz. O código alterado depois
  disso (C3 e C4) não é alvo de nenhuma das 44.
- **Repetição da suíte completa** (inclui as execuções de `npm run check`):

| Código | Rodadas | Falhas |
| --- | --- | --- |
| Antes de C3 (795 testes) | 29 (20:02 a 20:18) | 1: teste de duas rotinas (AGT-014) |
| Depois de C3, antes de C4 (795) | 18 (20:41 a 20:49) | 1: título do detalhe público (AGT-006) |
| Final (796) | 23 (20:51 a 21:01) | **nenhuma** |

- Investigação do teste da AGT-014: 40 execuções em 8 cópias paralelas sem falha; falha reproduzida com carga artificial de processador e
  disco (20:21:49 e 20:23:10, esta com a saída dos processos: "database is locked"). As alterações temporárias no teste e no comando foram
  desfeitas e conferidas pelo Git.
- **Percurso em execução real** (20:51:22 a 20:54:20; API com rotina a cada 2 s, Vite e Microsoft Edge sem janela, banco temporário, dados
  fictícios), um cenário contínuo:
  - administrador cria e publica excursão de 3 vagas (API dentro do navegador); visitante vê na lista e no detalhe;
  - Davi reserva sem checkout (API); Ana paga integral e Beatriz a primeira parcela (tela); Caio abre o pagamento; quarta pessoa vê
    "Esgotada" e o pedido direto responde `sem_vagas`;
  - Ana cancela com prévia de 100% (tela); a vaga volta e Eva a ocupa (tela); administrador processa o reembolso (API);
  - **ajuste 1 no banco** (prazo da segunda parcela para a véspera): a rotina cancela Beatriz por inadimplência e libera a vaga;
  - **ajuste 2** (partida há 1 hora, data final no dia): Caio aprova pelo botão; pagamento sinalizado, sem vaga ocupada, reserva
    aguardando, aviso próprio; administrador reembolsa a pendência e a reserva é cancelada;
  - **ajuste 3** (excursão terminada há 2 dias): a rotina conclui Eva e cancela Davi (RN-045);
  - Eva paga outra excursão; administrador a cancela e processa o reembolso; `npm run rotina` com a API ligada saiu com código 0;
  - painel: recebido R$ 3.725,03, devolvido R$ 3.500,02 e líquido R$ 225,01, conferidos à mão; 1 concluída e 5 canceladas; histórico com 29
    eventos; 390 px sem rolagem horizontal nos avisos;
  - invariantes: ocupação válida e igual às reservas na excursão do cenário (as de demonstração têm ocupação fixada pelo script, sem
    reservas), nenhuma reserva ativa duplicada, nenhum reembolso acima do pago, auditoria (94 eventos) sem exclusão; auditoria e console da
    API sem os dados sensíveis procurados; navegador sem mensagens nem exceções e só com o endereço local.

### 9. Erros e dificuldades

1. **Defeito de código anterior (C1)** e **comportamento não definido (C2)**, descritos na Seção 7.
2. **Dois testes instáveis de atividades anteriores** (C3 e C4), encontrados só pela repetição da suíte. O primeiro gerou uma pergunta ao
   pesquisador (Seção 6). No segundo, o agente não perguntou: corrigiu a tela, sem tocar no teste, seguindo a escolha feita no primeiro.
3. Na revisão dos próprios testes novos, antes do fim, o agente corrigiu: o caso de capacidade da RN-021, que usava capacidade zero e não
   testava a regra; uma verificação sem efeito e comentários errados nos fluxos; a RN-018, que passou a conferir a situação da reserva; e a
   RN-040, que passou a conferir que a segunda conexão nem inicia a transação (o agente avaliou que a versão anterior não detectaria a troca
   do modo; isso não foi executado).
4. Na RN-025, ao retirar do ajuste artificial a mudança da data de partida, o teste falhou porque o banco exige prazo anterior à partida; a
   mudança foi restaurada e explicada em comentário.
5. A sonda inicial em memória falhou por dados curtos demais e foi repetida; um CPF fictício inválido no roteiro do navegador foi corrigido
   antes da execução; um ponto trocado por ponto e vírgula na cópia dos requisitos foi corrigido.

### 10. Relatório do agente

1. **Verificação:** das 46 regras, **43 atendidas** (RN-001 a RN-004, RN-006 a RN-042, RN-045 e RN-046), **1 atendida em parte** (RN-005),
   **nenhuma não atendida ao fim** e **2 não verificáveis por teste** (RN-043 e RN-044, conferidas nos registros, com ressalva). A RN-001
   (com a RN-039) não era atendida no início. Resultado, forma de verificação, limite e evidência de cada uma:
   `docs/validacao-das-regras.md`. A instrução fala em 44 regras; a RN-045 e a RN-046 foram acrescentadas durante a atividade.
2. **Decisões técnicas** (as do pesquisador estão na Seção 6). Escolhas do agente: relógio do negócio separado do relógio da sessão nos
   testes; ocupação esperada definida como reservas não canceladas com parcela única ou primeira confirmada sem pendência; **a RN-046 vale a
   partir do instante exato da partida** (mesma convenção do cancelamento e do encerramento das reservas; o texto da regra diz "depois da
   partida"); reaproveitamento da pendência existente, sem migração; texto do aviso novo; correção do título na tela; alterações propositais
   e roteiro do navegador na pasta temporária da sessão, fora do repositório.
3. **Tecnologias:** Node.js v26.13.0, npm 11.20.0, `node:sqlite`, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0.
4. **Arquivos:** Seção 7.
5. **Dependências adicionadas:** nenhuma.
6. **Comandos:** `npm run check`, `npx vitest run`, `npm run rotina` (no percurso), scripts de edição, mutação, carga e navegador na pasta
   temporária.
7. e 8. **Testes e resultados:** Seção 8.
9. e 10. **Erros, divergências e correções:** Seções 7 e 9 e a tabela de divergências da matriz.
11. **Limitações e pendências:**
    - verificação feita pelo agente que implementou o sistema; sem segundo avaliador;
    - uma alteração proposital por regra não cobre todas as formas de violação;
    - RN-005 só confere o formato; RN-043 e RN-044 dependem dos registros, redigidos em grande parte pelo próprio agente;
    - RN-025 e RN-031 usam ajuste artificial no banco em um cenário;
    - os nomes das situações da retenção diferem entre a especificação ("Convertida", "Liberada") e o sistema (`confirmada`, `cancelada`):
      **pergunta ao autor**;
    - tela do passageiro e rótulos administrativos continuam dizendo "sem vaga" na confirmação depois da partida;
    - excursão sem situação "Concluída";
    - sob carga extrema, o teste das duas rotinas ainda pode falhar; a repetição não prova que não haja outro teste instável;
    - menu do administrador em mais de uma linha em tela larga;
    - sem carga, desempenho, acessibilidade por ferramenta, outro navegador ou provedor real (AGT-018 e trabalhos futuros);
    - a matriz de rastreabilidade será atualizada no fechamento; o apêndice de regras do TCC traz 44 regras e passa a 46.
12. **Para revisão humana (RN-044):** as correções C1 e C2; a fronteira no instante exato da partida; o texto do aviso novo; os textos da
    RN-045 e RN-046; a ressalva da RN-044; as alterações C3 e C4.

O agente não declara aprovação nem classifica a atividade.

### 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador (2026-11-26T21:50:40-03:00), com base nos registros e nas execuções.** O pesquisador respondeu "ap 3", lido pelo agente como a classificação AP-3; vale a autorização permanente que ele deu em 19/11/2026 para o fechamento padrão de cada atividade (critérios, revisão do código, commit e transcrição no Docs). O pesquisador não escreveu observações sobre o código nem sobre os pontos de atenção do relatório, e **não confirmou nem alterou expressamente** a fronteira da RN-046 no instante da partida, apresentada para confirmação. As marcações abaixo refletem as evidências.

Atendeu ao objetivo: Proposta: sim. Os fluxos principais foram testados de forma integrada e cada uma das 46 regras de negócio tem resultado registrado: 43 atendidas, 1 atendida em parte (RN-005) e 2 não verificáveis por teste (RN-043 e RN-044), sem regra não atendida ao fim.

Atendeu aos critérios de aceitação: Proposta: sim para os 16 critérios da Seção 4, todos marcados. Evidências: 796 testes aprovados em 41 arquivos (76 novos); lint, tipos e build sem erros; 44 alterações propositais, uma por regra verificável, todas detectadas e restauradas; 23 rodadas seguidas da suíte sobre o código final sem falha; percurso em aplicação e navegador reais. Ressalvas: (1) o critério "sem teste instável" foi atendido depois de corrigidas duas instabilidades de atividades anteriores; sob carga extrema o teste das duas rotinas ainda pode falhar, e a repetição não prova que não haja outro; (2) uma alteração proposital por regra não cobre todas as formas de violação; (3) cenários com ajustes diretos no banco; (4) a verificação foi feita pelo agente que implementou o sistema; (5) sem teste de carga.

Atendeu às regras de negócio: Proposta: sim, com a RN-005 em parte e a RN-043 e a RN-044 conferidas nos registros, com ressalva. A RN-001 (com a RN-039) não era atendida no início e foi corrigida. A RN-045 e a RN-046 foram acrescentadas por decisão do pesquisador; nenhuma regra anterior teve o texto alterado, salvo a retirada das marcas "[confirmar]".

Comportamento esperado confirmado: Proposta: sim, no percurso real e nos testes, com as ressalvas acima.

Testes considerados suficientes: Proposta: suficientes para os fluxos encadeados, as regras verificáveis, as fronteiras de data e hora, a concorrência pela última vaga e os invariantes; sem carga, mais de um servidor, outro navegador ou provedor real.

Problemas não identificados pelo agente: Proposta: nenhum identificado; os defeitos encontrados e os erros do próprio agente estão na Seção 9.

Revisão do código: registrada como aprovada pela autorização permanente de 19/11/2026, com a classificação dada depois da apresentação do relatório, que indicava para revisão server/auth/validation.ts, server/pagamentos/confirmacao.ts e src/ui.tsx. As limitações da Seção 10 (item 11), incluída a pergunta ao autor sobre os nomes das situações da retenção, continuam registradas.

### 12. Intervenção humana

Houve intervenção humana: Sim.

1. **Planejada na instrução** (três paradas da Seção 5): forma de verificação e critérios, tratamento do encontrado e pontos abertos de
   regras. Resposta "recomendadas" (2026-11-26T19:53:14-03:00). Tipos: decisão sobre testes e regra de negócio (RN-045 e RN-046 e retirada
   das marcas "[confirmar]").
2. **Durante a execução**, com base na decisão 2 (parar no que depender de interpretação): tratamento do teste instável da AGT-014, escrito
   pelo próprio agente naquela atividade. Pergunta apresentada às 20:27:56 e respondida às 20:34:06 (-03:00). Tipo: decisão sobre testes e
   configuração.

Nenhum código foi alterado manualmente pelo pesquisador. A natureza das intervenções para a classificação é decisão do pesquisador.

### 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-26T21:50:40-03:00: "ap 3". Tentativa a que se aplica: 1. Critério da rubrica: AP-3 é a intervenção planejada de governança prevista na instrução; AP-4, a intervenção corretiva para reparar falhas não corrigidas pelo agente. O pesquisador não escreveu justificativa.)

Possível influência (rubrica, Seção 5): a pedido permanente do pesquisador (13/11/2026), o agente recomendou AP-3 no relatório e apresentou a leitura contrária, AP-4, pela qual a pergunta sobre o teste instável escrito pelo agente na AGT-014 seria reparo de falha não corrigida por ele.

### 14. Controle de versão

Commit relacionado: e85d169

---

### 16. Observações finais

- Execução: início 2026-11-26T19:51:28-03:00; fim do relatório do agente 2026-11-26T21:03:10-03:00. O intervalo inclui as esperas pelas duas decisões (até
  19:53:14, junto com a preparação das opções; e cerca de 6 minutos na segunda) e as repetições da suíte.
- O contexto da sessão foi resumido automaticamente pela ferramenta durante a atividade; a execução continuou sem reinício.
- Pontos para a avaliação: C2 e a fronteira da partida; a correção C4 feita sem pergunta própria; a ressalva da RN-044.
- Duração registrada nas métricas: 62,52 min, de 19:53:14 (decisões respondidas) a 21:01:55 (verificação final), descontada a espera de 6 min 10 s pela segunda decisão (68,68 min de relógio no intervalo). Inclui repetições da suíte, alterações propositais, investigação sob carga e percurso em execução real. A espera pela aprovação, pelas primeiras decisões e pela classificação e a redação do relatório não são contadas.
- A versão da ferramenta (extensão 2.1.332, a mais recente instalada) não pôde ser confirmada como a que executou a atividade.
