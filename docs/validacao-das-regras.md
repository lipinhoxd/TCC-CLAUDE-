# Validação das regras de negócio (AGT-017)

> Verificação feita em 26/11/2026 pelo mesmo agente que implementou o sistema. **Não substitui a revisão humana** (RN-044) e não é
> revisão independente. Os pagamentos, reembolsos e e-mails são **simulados** e os dados são fictícios.

## Como foi verificado

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

## Resumo

| Resultado | Regras | n (de 46) |
| --- | --- | --- |
| Atendida | RN-001 a RN-004, RN-006 a RN-042, RN-045 e RN-046 | 43 |
| Atendida em parte | RN-005 | 1 |
| Não atendida | nenhuma ao fim da atividade | 0 |
| Não verificável por teste | RN-043 e RN-044 | 2 |

Antes das correções, os testes novos mostraram a RN-001 (com a RN-039) **não atendida** entre 21:00 e 23:59 de Brasília, e a
confirmação depois da partida ocupava vaga, comportamento que a especificação não definia e que passou a ser a RN-046.

## Matriz

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

## Regras não verificáveis por teste

| Regra | Texto | Por que não há teste | Conferência nos registros | Ressalva |
| --- | --- | --- | --- | --- |
| RN-043 | A IA não pode alterar autonomamente regras de negócio aprovadas. | É conduta do agente durante o desenvolvimento, não comportamento do sistema. | O histórico do Git mostra `04-REGRAS-DE-NEGOCIO.md` sem alteração desde o commit da linha de base até a AGT-017, quando entraram a RN-045 e a RN-046 e saíram as marcas "[confirmar]", com textos e decisão do pesquisador (Seção 6 do registro). Os pontos sem definição aparecem nos registros como decisões do pesquisador. | A conferência foi feita pelo próprio agente, sobre registros que ele redigiu; não prova a inexistência de interpretação não percebida no código. |
| RN-044 | Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana. | É um ato humano. | Seção 11 de cada registro: AGT-001 e AGT-002 têm a avaliação confirmada pelo pesquisador (a da AGT-001 anota que o agente não declarou revisão do código); a AGT-003 registra a aprovação posterior da revisão do código de segurança; AGT-004 a AGT-013 registram "Revisão do código: aprovada pelo pesquisador"; AGT-014 a AGT-016, "registrada como aprovada pela autorização permanente de 19/11/2026". A revisão desta atividade está pendente. | As Seções 11 foram redigidas pelo agente a pedido do pesquisador; desde a AGT-006 a aprovação decorre, em geral, da resposta de classificação sob a autorização permanente, **sem observações próprias do pesquisador sobre o código**. Não há segundo avaliador. O registro comprova a aprovação declarada, não a profundidade da revisão. |

## Divergências e pontos encontrados

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

## Percurso em execução real

API com a rotina ligada (a cada 2 s), front-end e Microsoft Edge sem janela, banco temporário e dados fictícios, em um cenário contínuo
pelos fluxos 1 a 9. Partes feitas pela interface (cadastro, entrada, reserva, pagamento, cancelamento, consultas) e partes por chamadas à
API dentro da sessão do navegador (criar, publicar e cancelar excursão, uma reserva sem checkout, reembolsos e pendência). **Ajustes
artificiais no banco**, para o tempo passar: (1) prazo da segunda parcela para a véspera; (2) partida há 1 hora e data final no dia;
(3) excursão terminada há 2 dias. Ao fim: ocupação válida e, na excursão do cenário, igual às reservas (as excursões de demonstração têm
ocupação fixada pelo script de dados, sem reservas), nenhuma reserva ativa duplicada, nenhum reembolso acima do pago, auditoria sem
exclusão e sem os dados sensíveis procurados; valores do painel conferidos à mão (recebido R$ 3.725,03; devolvido R$ 3.500,02; líquido
R$ 225,01).

## Execuções

`npm run check` aprovado sobre o código final em 26/11/2026 (796 testes em 41 arquivos, lint, tipos e build). A suíte completa foi repetida
70 vezes durante a atividade: 2 falhas em testes antigos instáveis (itens 3 e 9), corrigidos; as últimas 23 rodadas, sobre o código final,
não tiveram falha.

## O que não foi verificado

- Carga, volume, desempenho e os requisitos não funcionais da revisão técnica final (AGT-018).
- Provedor real de pagamento, de e-mail ou de verificação de telefone; mais de um servidor ou outro banco.
- Navegadores além do usado no percurso; acessibilidade por ferramenta; a virada do dia da RN-001 no navegador (só por teste).
- Situações fora dos cenários descritos: a aprovação nos testes não prova a ausência de defeitos.
