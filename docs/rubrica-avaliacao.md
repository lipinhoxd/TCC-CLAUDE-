# Rubrica de avaliação das atividades AGT

Base: Seções 3.5 a 3.7 do TCC e `TCC/MODELO-REGISTRO-AGT.md`. Esta rubrica torna explícitos os
critérios usados para classificar. A classificação final é do pesquisador; a rubrica serve para
que outro avaliador chegue à mesma conclusão a partir dos mesmos fatos.

## 1. Definições operacionais

**Atividade.** Unidade experimental com identificador AGT-XXX, objetivo técnico delimitado e
instrução original preservada, sem alterações, no registro.

**Tentativa.** Uma execução da instrução pelo agente, do envio da instrução até o relatório final
do agente, a partir de um estado conhecido do repositório. Conta como nova tentativa:
- uma interação adicional do pesquisador com o objetivo de corrigir o resultado (nova instrução);
- uma execução refeita do zero, com o estado anterior preservado no Git.

Não conta como nova tentativa: interrupção por limite de uso ou indisponibilidade da ferramenta,
com retomada sem reiniciar (TCC, Seção 5.5); respostas do pesquisador a perguntas do agente
dentro da mesma execução.

*Casos já registrados:* AGT-001 do piloto, 2 tentativas (segunda interação corretiva sobre a
extensão dos arquivos metodológicos; classificação AP-1 mantida pelo pesquisador, com a interação
nas métricas). AGT-001 do principal, 2 tentativas (a segunda refeita a pedido, com a mesma
instrução).

**Intervenção humana.** Ato direto do pesquisador, durante a execução ou depois dela, necessário
para a atividade atingir os critérios de aceitação. Tipos: esclarecimento de requisito, correção
de regra de negócio, decisão de arquitetura, alteração manual de código, segurança, banco de
dados, interface, integração, testes, configuração e outro.

*Caso-limite registrado:* na AGT-001 do principal, o pesquisador decidiu entre opções de
arquitetura apresentadas pelo agente, porque a instrução manda levar essas decisões à avaliação
humana. O pesquisador registrou como intervenção do tipo decisão de arquitetura (AP-3). Outro
avaliador deve registrar se concorda com essa leitura.

**Tempo.** Duração cronológica pelo relógio do sistema, do início da execução da instrução até a
conclusão do relatório do agente. Inclui a latência das ferramentas; exclui a revisão humana. Pausas
combinadas com o pesquisador são informadas à parte quando mensuráveis. O tempo é descritivo e não
prova ganho de produtividade.

## 2. Verificações mínimas (todas as atividades)

| # | Verificação | Evidência |
| --- | --- | --- |
| 1 | A instrução original está preservada e não foi alterada. | Seção 5 do registro |
| 2 | Cada critério de aceitação foi avaliado individualmente. | Seção 4 do registro |
| 3 | Lint, verificação de tipos, testes e build foram executados e o resultado é real. | Comandos e saída |
| 4 | Nenhuma funcionalidade fora do escopo foi implementada. | Revisão das alterações |
| 5 | Nenhuma credencial ou dado real foi versionado. | Verificação de arquivos |
| 6 | Regras de negócio não foram alteradas pelo agente. | Comparação com a especificação |
| 7 | Tentativas, tempos, intervenções e commits estão registrados. | Registro e Git |
| 8 | O relatório do agente está separado da avaliação humana. | Seções 10 e 11 |

## 3. Classificação

| Classe | Condição |
| --- | --- |
| **AP-1** | Verificações atendidas na primeira execução, sem nova instrução corretiva e sem intervenção direta. |
| **AP-2** | Verificações atendidas após correções feitas pelo próprio agente em nova interação, sem intervenção direta. |
| **AP-3** | As verificações só foram atendidas com intervenção direta do pesquisador. |
| **RP** | As verificações não foram atendidas pela abordagem utilizada. |

## 4. Ficha de avaliação (preencher por atividade)

| Campo | Avaliador 1 (pesquisador) | Avaliador 2 (independente) |
| --- | --- | --- |
| Nome e data | | **[A DEFINIR]** |
| Verificações 1 a 8 (sim/não e observação) | | |
| Classificação | | |
| Justificativa | | |
| Concorda com o avaliador 1? | — | |

Divergências entre avaliadores: registrar a causa e a decisão final, sem apagar a classificação
original de cada um. Se não houver segundo avaliador, registrar a ausência como ameaça à validade
(TCC, Seção 3.9).

## 5. Observação sobre o papel do agente

A avaliação humana pode ser redigida pelo agente a pedido do pesquisador, mas só vale depois de
confirmada por ele, e a redação deve indicar a autoria. A orientação do agente sobre qual classe
adotar é permitida somente por pedido expresso e fica registrada como possível influência.
