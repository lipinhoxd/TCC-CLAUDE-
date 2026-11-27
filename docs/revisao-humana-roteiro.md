# Roteiro de revisão humana (AGT-018, RNF-030)

Para o pesquisador. Cada item pode ser respondido com **ok**, **problema** (dizendo qual) ou **não revisei**. Só o que for respondido é
registrado como revisado. "No navegador" não exige ler código; "No código" é para quem quiser conferir a implementação.

**Preparação:** `npm run dev:api` e `npm run dev`, com o administrador e os dados de demonstração (README, "Primeiro acesso").

| Item | O que conferir | No navegador | Esperado | No código |
| --- | --- | --- | --- | --- |
| 1 | Limite de tentativas de entrada (alterado) | Errar a senha 6 vezes seguidas no mesmo e-mail | As 5 primeiras dizem que o e-mail ou a senha estão incorretos; a 6ª pede para aguardar | `server/auth/service.ts` (login) e `support.ts` |
| 2 | Recuperação de acesso e banco ocupado (alterados) | Sem tela | Token falso é recusado sem calcular a senha nova | `server/auth/service.ts` (confirmRecovery) e `routes.ts` (sendError) |
| 3 | Acesso por perfil | Entrar como passageiro e abrir `/admin` | Acesso negado | `server/auth/routes.ts` (authorize) |
| 4 | Dados pessoais | Como administrador, abrir **Passageiros** e um detalhe | CPF e telefone mascarados na lista; completos só no detalhe | `server/admin/service.ts` |
| 5 | Pagamento e vaga | Reservar, abrir o checkout, pagar; tentar uma excursão esgotada | Reserva pronta para embarque; a esgotada não aceita reserva | `server/pagamentos/confirmacao.ts`, `server/vagas/disponibilidade.ts` |
| 6 | Pagamento depois da partida (RN-046, AGT-017) | Sem como provocar pela tela sem alterar o banco | Não ocupa vaga e vira pendência | `server/pagamentos/confirmacao.ts` |
| 7 | Cancelamento e reembolso | Cancelar uma reserva paga e ver a prévia; como administrador, processar o reembolso | 100% com 14 dias ou mais, 50% entre 7 e 14, nada abaixo de 7 | `server/cancelamentos/regra.ts` e `service.ts` |
| 8 | Painel e histórico | Como administrador, abrir **Painel** e **Histórico** | Valores coerentes com o que foi feito; ações registradas | `server/admin/painel.ts` |
| 9 | Idade mínima (corrigida na AGT-017) | Cadastrar alguém com menos de 18 anos | Recusado | `server/auth/validation.ts` |
| 10 | Instalação em outro computador | Seguir o README do começo | Sistema abre e aceita entrada | `README.md` |

## Respostas

Dadas em 27/11/2026: itens 1, 3, 4, 5, 7, 8, 9 e 10 "ok"; itens 2 e 6 "não revisei". Detalhes na Seção 11 do registro da AGT-018.
