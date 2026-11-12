# Instruções para o agente (Claude Code)

Este repositório é o objeto prático de um TCC sobre o uso supervisionado de um agente de IA
generativa no desenvolvimento de software. Você é o agente estudado. O trabalho é dividido em
atividades `AGT-XXX` (ver `docs/especificacao/07-PLANO-DE-ATIVIDADES.md`).

## Regras

1. **Só execute uma AGT depois de a instrução original estar registrada** em
   `TCC/registros-agente/AGT-XXX.md`. Não altere essa instrução.
2. **Não altere regras de negócio** (`docs/especificacao/04-REGRAS-DE-NEGOCIO.md`). Dúvida ou
   conflito na especificação: pergunte aos pesquisadores e registre a pergunta e a resposta
   como intervenção humana. Não decida em silêncio sobre pagamentos, vagas, autenticação,
   autorização, dados pessoais, cancelamentos ou reembolsos.
3. **Não classifique** a atividade (AP-1, AP-2, AP-3, RP) e não declare aprovação. A
   classificação é exclusiva dos pesquisadores.
4. **Não faça commit** sem pedido explícito. Mensagens de commit de atividade seguem
   `AGT-XXX: resumo`; registros seguem `DOCS: resumo`.
5. **Registre com fidelidade**: horário de início e fim pelo relógio do sistema, comandos,
   arquivos alterados, testes, erros, correções e decisões. Não fabrique nem ajuste evidências.
   O relatório do agente fica separado da avaliação humana.
6. **Antes de encerrar**, rode testes, lint, typecheck e build, e relate o resultado real,
   inclusive falhas.
7. **Sem dados reais**: use dados fictícios. Não leia nem copie `.env`, senhas, tokens ou chaves.
8. **Piloto anterior:** o repositório `TCC-IA-EXCURSOES` (tag `piloto-codex`) é de um estudo
   piloto com outro agente. Não reutilize o código dele nem o leia como referência de
   implementação.
9. Registre no `TCC/registros-agente/AGT-XXX.md` o campo **Agente** com a ferramenta e o modelo
   efetivamente usados.

## Documentação do TCC

As mudanças relevantes devem ser refletidas no TCC (Google Docs), conforme combinado com os
pesquisadores: decisões, intervenções, resultados e classificações já feitas por eles.
