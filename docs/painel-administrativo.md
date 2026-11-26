# Painel administrativo e histórico (AGT-016)

Painel consolidado (RF-041) em `/admin` e histórico das operações administrativas e automáticas (RF-042) em `/admin/historico`. Só para o
administrador. Os pagamentos do sistema são simulados: os valores não correspondem a dinheiro movimentado. Código em `server/admin/painel.ts`
e `src/pages/AdminPainel.tsx`.

## Rotas (só o perfil administrador; visitante 401 e passageiro 403, antes de qualquer leitura ou efeito)

| Método e caminho | Resultado |
| --- | --- |
| `GET /api/admin/painel` | `painel` com os indicadores abaixo. Não aceita parâmetros (400 `validacao`). |
| `GET /api/admin/historico` | `eventos`, `total`, `pagina`, `limite` (20) e `acoes` (tipos existentes). Filtros: `origem` (`administrador` ou `sistema`), `acao`, `entidade`, `registro` (exige `entidade`), `de` e `ate` (datas de Brasília) e `pagina`. Parâmetro inválido ou desconhecido: 400 por campo. |

## Indicadores e definições

| Indicador | Definição |
| --- | --- |
| Recebido | Soma de todos os pagamentos `confirmado` ou `estornado`, de todo o histórico. Inclui valores que aguardam análise. |
| Devolvido | Soma dos reembolsos `processado`. |
| Líquido | Recebido menos devolvido. |
| A devolver | Soma dos reembolsos `pendente` ou `recusado`. |
| A receber | Segunda parcela das reservas parceladas em "Aguardando pagamento", com a primeira confirmada com vaga, sem a segunda confirmada, de excursão não cancelada e com o prazo ainda por vir. |
| Reservas por situação | Contagem de todas as reservas nas quatro situações (RN-023). |
| Pendências administrativas | Pagamentos `confirmado` com sinalização, o mesmo critério da tela de pendências. |
| E-mails que falharam | Quantidade de mensagens com o e-mail `falhou`. Nenhum conteúdo ou destinatário. |
| Excursões a realizar | Publicadas ou encerradas com data final não anterior a hoje (Brasília), da mais próxima para a mais distante, até 100, com o total. |
| Capacidade, ocupadas, retidas, livres | A mesma função usada nas reservas; retidas são as retenções ativas e no prazo. |

Valores em centavos inteiros (RN-038). Todos os números de uma resposta vêm de uma única transação de leitura.

## Efeito da leitura

Abrir o painel efetiva antes, em transação própria, o **vencimento da segunda parcela** e a **conclusão** pendentes de todo o sistema, como
as demais telas administrativas. É a única gravação do painel. O cancelamento da reserva sem pagamento de excursão terminada continua
exclusivo da rotina automática. O histórico não grava nada e a consulta não é auditada.

## Histórico

Mostra os registros de auditoria cujo autor é um administrador ou o sistema, exceto os de acesso (`auth.*`). Ações de passageiros não
aparecem. De cada evento saem apenas: data, ação, autor (número do administrador ou "Sistema"), registro e reserva relacionada, situação
anterior e nova, valores, percentual e justificativa. A auditoria continua somente de inclusão. Os históricos dentro da excursão e da reserva
continuam como estavam.

## Decisões do pesquisador (26/11/2026, "recomendadas")

Indicadores com cinco linhas de valores, totais de todo o histórico, sem exportação; histórico do administrador e do sistema, com filtros,
autor por número e sem auditar a consulta; painel efetivando prazos, sem situação da rotina, com "Painel" e "Histórico" na administração.

## Limitações

1. Sem filtro de período no painel, sem exportação, relatórios ou gráficos; atualização só ao abrir ou pelo botão.
2. Os valores são de pagamentos simulados e não substituem conciliação financeira.
3. A situação da rotina automática não aparece, porque ela não registra execuções.
4. O reembolso recusado continua em "A devolver" por tempo indeterminado.
5. O histórico não cria índice novo: filtros e contagem percorrem a auditoria, sem teste de volume.
6. A justificativa é texto livre do administrador e pode conter dados pessoais; a auditoria não a filtra.
7. Eventos sem autor são tratados como do sistema.
8. Autor apenas pelo número; sem busca por nome de excursão ou de passageiro.
9. Abrir um evento de consulta a passageiro leva ao detalhe, o que registra nova consulta.
