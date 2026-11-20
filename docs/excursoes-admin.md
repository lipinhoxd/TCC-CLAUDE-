# Gerenciamento administrativo de excursões (AGT-005)

API e interface administrativa mínima para cadastrar, editar, publicar e mudar a situação de excursões
(RF-009 a RF-014 e a parte administrativa do RF-042), sobre a tabela `excursao` e a auditoria da AGT-002 e
a autorização da AGT-003. Não há exibição pública (AGT-006), reservas, pagamentos, reembolsos nem upload
de imagens.

## Decisões do pesquisador (13/11/2026, "todas as recomendadas")

| Ponto | Decisão |
| --- | --- |
| RN-036 e RN-037 | Confirmadas como escritas na especificação, ao aprovar a instrução. |
| Situações | Quatro: `rascunho`, `publicada`, `encerrada`, `cancelada`. "Concluída" fica para os processos automáticos (AGT-014), sem migração. **Encerrada** = o administrador fechou as vendas; as reservas existentes continuam. |
| Transições (todas pelo administrador) | rascunho → publicada, cancelada; publicada → encerrada, rascunho (despublicar), cancelada; encerrada → cancelada; cancelada → nenhuma. **Despublicar e cancelar são bloqueados** (409) enquanto houver reserva ou retenção ativa, até a AGT-013 tratar os reembolsos. |
| Campos protegidos (RN-036) | Com reserva ou retenção ativa ficam bloqueados: preço, parcelamento, prazo da 2ª parcela, capacidade, data inicial, data final e partida. Continuam editáveis: nome, descrição, imagem, local e ponto de embarque. |
| Validações | Preço de R$ 0,01 a R$ 100.000,00 (zero é recusado, porque o pagamento exige valor positivo); capacidade de 1 a 1.000 e nunca menor que as vagas ocupadas; data inicial não pode estar no passado (só é checada quando o campo muda); data final não anterior à inicial; partida na data inicial ou no dia anterior (Brasília); prazo da 2ª parcela anterior ao dia da partida (RN-013); publicar exige partida no futuro e, com parcelamento, prazo ainda por vir. |
| Imagem | Só caminho relativo `imagens/nome.(jpg|jpeg|png|webp)` (minúsculas, sem subpastas, sem `..`, sem protocolo). Não há upload nem pasta criada nesta atividade. |

## Quem pode o quê

Todas as rotas exigem o perfil **administrador**, verificado no servidor a cada requisição e **antes** de ler o corpo
ou tocar no banco: sem sessão, 401; passageiro, 403. A autorização usa a função `authorize` extraída de
`server/auth/routes.ts` nesta atividade (mudança sem alteração de comportamento; ver "Mudança em código da AGT-003").

## Rotas

| Método e caminho | Resultado |
| --- | --- |
| `GET /api/admin/excursoes` | Lista com situação, datas, capacidade, vagas ocupadas e preço. |
| `POST /api/admin/excursoes` | 201; cria sempre em `rascunho`. Obrigatórios: nome, local, ponto de embarque, data inicial, data final, `partida_utc`, capacidade e `preco_centavos`. Opcionais: descrição, imagem, parcelamento e prazo. |
| `GET /api/admin/excursoes/:id` | Dados completos, `versao`, `edicao_restrita`, `campos_bloqueados` e `transicoes` (cada uma com `disponivel` e `motivo`). |
| `PATCH /api/admin/excursoes/:id` | Edita só os campos enviados; exige `versao`. |
| `POST /api/admin/excursoes/:id/situacao` | Corpo `{ "situacao": "...", "versao": "..." }` (a versão é opcional aqui). Publicar é essa ação, separada do cadastro (RN-037). |
| `GET /api/admin/excursoes/:id/historico` | Eventos de auditoria da excursão, do mais recente ao mais antigo. |

Erros: `{ "error": "<codigo>" }`, com `fields` por campo nos erros de validação.
Códigos: `validacao` (400), `edicao_bloqueada`, `conflito_de_edicao`, `transicao_invalida`,
`excursao_com_reservas_ativas`, `excursao_cancelada` (409), `nao_encontrada` (404).

## Formatos (RN-038 e RN-039)

- **Preço:** `preco_centavos`, inteiro. A interface recebe em reais ("1.500,00") e converte; texto ambíguo
  ("1,234.56", "12,345") é recusado.
- **Partida:** `partida_utc`, ISO 8601 UTC terminado em `Z` (outro formato é recusado). A interface recebe o horário de
  Brasília e converte.
- **Prazo da 2ª parcela:** a API recebe uma data (`prazo_segunda_parcela`, AAAA-MM-DD) e guarda o instante 23:59:59 de
  Brasília dessa data, em UTC (`prazo_segunda_parcela_utc`). A conversão usa o banco de fusos (`shared/fuso.ts`), não um
  deslocamento fixo nem o fuso da máquina, e é a mesma no servidor e no navegador.

## Edição simultânea

Cada excursão tem uma `versao` (o `atualizado_em`, que cresce pelo menos 1 ms a cada alteração). O PATCH exige a versão
lida; se outra pessoa alterou antes, a resposta é 409 `conflito_de_edicao` e nada é sobrescrito. Edição e mudança de
situação ocorrem em transação (`BEGIN IMMEDIATE`). A interface oferece "Recarregar".

## "Reserva ou retenção ativa"

Conta como ativa: reserva em `aguardando_pagamento` ou `pronto_para_embarque`, ou retenção `ativa` de reserva da excursão
(mesmo que expirada pelo relógio, até um processo marcá-la). Reservas `concluida` ou `cancelada` e retenções
`expirada`, `confirmada` ou `cancelada` não contam. A regra consulta as tabelas `reserva` e `retencao_vaga`, então
as atividades de reserva já a encontram funcionando; foi testada com registros fictícios inseridos no banco.

## Auditoria (RF-042, RN-035, RN-041, RN-042)

`excursao.criada`, `excursao.editada` (valores antigos e novos só dos campos que mudaram) e `excursao.situacao_alterada`
(situação anterior e nova), sempre com o administrador como ator. Tentativas recusadas não deixam registro de alteração.
Não entram dados pessoais, senha, token nem hash.

## Interface

Rotas do front-end (só para o administrador): `/admin/excursoes` (lista), `/admin/excursoes/nova` e
`/admin/excursoes/:id` (edição, situação e histórico). O item "Administração" aparece no menu só para o administrador,
mas isso é conveniência: visitante e passageiro veem aviso de acesso restrito, e o servidor decide. Campos bloqueados
ficam desligados com explicação; cancelar pede confirmação; com alterações não salvas, os botões de situação ficam
desligados. O roteador ganhou parâmetros de URL (`:id`).

## Mudança em código da AGT-003 (RN-044)

Em `server/auth/routes.ts`: `readJson` passou a ser exportada; a verificação de sessão e de perfil foi extraída para
`authorize(req, service, roles)` e o tratamento de erro para `sendError(...)`; `handleAuthRoute` passou a usá-las. O
comportamento (401, 403, 500, corpo dos erros, `Retry-After`) não mudou, e os 43 testes da AGT-003 continuam passando
sem alteração. Revisar `authorize`.

## Limitações conhecidas

1. Não há reembolso: cancelar ou despublicar com reserva ou retenção ativa é bloqueado até a AGT-013.
2. "Concluída" não existe; excursões encerradas ficam como `encerrada` até a AGT-014.
3. A pasta `imagens/` não existe e nada serve os arquivos; a AGT-006 precisa decidir isso.
4. Os limites de preço e de capacidade, e a regra da partida (data inicial ou dia anterior), são escolhas do agente
   aprovadas pelo pesquisador, e a especificação não as define.
5. O controle de edição simultânea usa o `atualizado_em`; não há bloqueio otimista no banco além da transação.
6. Retenção `ativa` com prazo vencido continua bloqueando até um processo a marcar como expirada.
7. A lista não tem busca, filtro nem paginação; a tabela rola na horizontal em tela de celular.
8. Ainda não há exclusão de excursão (não faz parte do plano).
9. A auditoria mostra só o número do administrador, não o nome.
