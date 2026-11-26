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
3. **Não classifique** a atividade (AP-1, AP-2, AP-3, AP-4, RP) e não declare aprovação. A
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

## Padrão de escrita e formatação do TCC (Google Docs)

### Formatação
- Times New Roman 12, justificado, recuo de 1,25 cm na primeira linha, espaçamento 1,5.
- Títulos com os estilos do Docs (Título 1, 2 e 3). Título 1 em caixa alta e numerado; a numeração existente continua.
- Itens RF/RNF/RN dos apêndices e legendas em fonte 10 permanecem como estão.

### Escrita
- Linguagem acadêmica, impessoal, em terceira pessoa. Sem primeira pessoa e sem tom de log.
- Crase e regência corretas. Usar "projeto" (não "design"), "capacidades", "data-limite", "revisão humana" e números em algarismos.
- Não usar "revisão independente" nem "validação independente" enquanto não houver segundo avaliador.
- Termos padronizados: IA/Inteligência Artificial Generativa, agente, AGT-XXX, AP-1, AP-2, AP-3, AP-4, RP, RF, RNF, RN.

### Contagens e cautela
- Escrever "n = X" com denominador explícito. Experimento principal: 7 das 18 atividades; piloto com o Codex: n = 5. Nunca somar os dois conjuntos.
- Manter a mesma contagem no Resumo, no Abstract, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7.
- Sem inferência de produtividade, qualidade geral ou causalidade. Sem taxa generalizável. Não há grupo de controle.
- A classificação é sempre decisão dos pesquisadores. Atividade não iniciada ou suspensa é registrada à parte.

### Tabelas e quadros
- Título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

### Ficha AGT (Apêndice E): 20 campos, nesta ordem
1. ID e título; 2. Estudo; 3. Objetivo; 4. Requisitos relacionados; 5. Comando inicial; 6. Critérios de aceitação; 7. Testes; 8. Lint, tipos e build; 9. Número de tentativas; 10. Duração; 11. Pausas ou interrupções; 12. Intervenção humana; 13. Decisão técnica; 14. Versão do agente; 15. Ambiente; 16. Commits; 17. Evidências; 18. Classificação final; 19. Segundo avaliador; 20. Limitações.
- Dado ausente: "[DADO NÃO REGISTRADO]". Nunca inventar tempo, tentativa, commit, teste, versão ou referência.

## Padrão de escrita e formatação do TCC e sincronia

Formatação, escrita, contagens, tabelas e a ficha AGT de 20 campos seguem a seção anterior ("Padrão de escrita e formatação do TCC (Google Docs)"), sem repetição aqui. Complementos:

- O TCC deve descrever o que o repositório realmente contém. Se o Docs divergir do código, dos registros ou das métricas, o erro é do TCC. Se o Docs divergir da especificação e esta divergir do código, não decidir: registrar como "Pergunta ao autor".
- Expressões como "revisão independente", "validação independente" e "verificação independente" não são usadas sem segundo avaliador. Classificação é sempre atribuída aos pesquisadores.
- Itens do piloto que só se verificam lendo o código do piloto: marcar "fora do alcance da verificação".
- Passo obrigatório: ao fechar cada AGT, rodar a auditoria de sincronia (comparar os trechos tocados do TCC com os registros, `METRICAS.csv`, o diário, `package.json`, as migrações e `docs/especificacao/`) antes de encerrar, e gravar o resultado em `TCC/relatorios/`. A auditoria só relata; as correções do Docs dependem de aprovação.
