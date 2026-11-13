# Adequação do TCC ao estado do projeto (experimento principal com o Claude Code)

Data: 13/11/2026
Elaborado por: Claude Code (Claude Sonnet 5.5, `claude-sonnet-5-5`), por pedido dos pesquisadores.
Base de comparação: versão do TCC "VERSÃO BASE DO TCC 1" (Google Docs, lida em 13/11/2026) e
estado do repositório nesta data.

> **Natureza deste documento.** São textos propostos para substituir trechos do TCC. Foram
> escritos pelo agente a partir dos registros do repositório e do próprio texto do TCC. Não
> foram aprovados pelos pesquisadores. Nenhuma atividade do experimento principal foi
> classificada; as classificações são exclusivas dos pesquisadores. Os campos entre colchetes
> `[...]` dependem de decisão ou dado dos pesquisadores. O documento Google Docs não foi alterado.

## Parte A — O que mudou e por quê

| Seção do TCC | Situação encontrada | Ação proposta |
| --- | --- | --- |
| Resumo e Abstract | Já descrevem Claude Code como agente e o Codex como piloto. | Nenhuma. |
| 2.8, 3.2, 3.9 | Já tratam o reinício de 11/11/2026 e o contato prévio do agente com o piloto. | Nenhuma. |
| 3.3 (2º parágrafo) | Afirma que a persistência adotada é SQLite (`node:sqlite`). Isso vem do piloto; no repositório novo a persistência ainda não foi feita. A especificação (`01-VISAO-GERAL.md`) deixa o banco como decisão da AGT-001/AGT-002. | Substituir (Parte B.1). |
| 4.8 (2º parágrafo) | Mesma afirmação sobre SQLite. | Substituir (Parte B.2). |
| 4.3 a 4.7 | Contagens (42 RF, 33 RNF, 44 RN) conferem com `docs/especificacao/`. Quatro pontos da especificação ainda estão marcados **[confirmar]**. | Nenhuma no texto. Pendência dos pesquisadores (Parte C). |
| 5 (inteiro) | Relata apenas o piloto como "estágio atual". | Reescrever (Parte B.3). |
| 6 (inteiro) | Resultados parciais do piloto apresentados como resultados do estudo. | Reescrever (Parte B.4). |
| 7 | Considerações baseadas apenas no piloto. | Reescrever (Parte B.5). |
| Sumário | Itens 5.6 e 5.7 sem número de página; novos títulos nos Capítulos 5 e 6. | Atualizar o sumário depois da transcrição. |

Verificações feitas no repositório (13/11/2026): `docs/especificacao/02` contém 42 RF distintos,
`03` contém 33 RNF e `04` contém 44 RN. Itens **[confirmar]** abertos: duração do token de
recuperação de acesso (RN-007), edição de condições com reserva ativa (RN-036), criação de
excursão em rascunho (RN-037) e situações da excursão (`05-FLUXOS-E-ESTADOS.md`).

---

## Parte B — Textos propostos

### B.1 — Seção 3.3, segundo parágrafo (substitui o atual)

A persistência será implementada na AGT-002, com banco de dados relacional. A especificação
deixa a escolha da tecnologia para as atividades AGT-001 e AGT-002, e a decisão efetivamente
tomada será registrada no respectivo registro e neste trabalho. No estudo piloto com o Codex, a
etapa de persistência utilizou SQLite por meio de `node:sqlite`, sem ORM, divergindo do
planejamento inicial que previa PostgreSQL; essa decisão pertence ao piloto e não é
automaticamente herdada pelo experimento principal. Mudanças técnicas fazem parte do contexto
em que o desempenho do agente é observado e, por isso, são preservadas na documentação em vez de
retroativamente ocultadas.

### B.2 — Seção 4.8, segundo parágrafo (substitui o atual)

No experimento principal, a tecnologia de persistência será definida na AGT-002 e registrada
conforme efetivamente utilizada. No estudo piloto, a persistência adotou SQLite por meio de
`node:sqlite`, divergindo da previsão inicial de PostgreSQL. A divergência é relevante
metodologicamente porque mostra que o ambiente experimental pode evoluir e que a documentação
final deve refletir a implementação real, acompanhada da justificativa e da atividade em que a
mudança ocorreu.

### B.3 — Capítulo 5 (substitui o capítulo inteiro)

**5. EXECUÇÃO EXPERIMENTAL**

**5.1 Estado atual do experimento**

A execução empírica compreende duas partes distintas, que não são misturadas na análise. A
primeira é um estudo piloto com o OpenAI Codex, concluído nas atividades AGT-001 a AGT-005
(Seção 5.2). A segunda é o experimento principal, iniciado em 11/11/2026 em novo repositório,
com o Claude Code como único agente (Seção 5.3). Na data de 13/11/2026, a AGT-001 do
experimento principal foi executada pelo agente e aguarda avaliação humana; as demais atividades
(AGT-002 a AGT-018) ainda não foram iniciadas. `[Atualizar esta seção quando a AGT-001 for
avaliada e quando novas atividades forem concluídas.]`

**5.2 Estudo piloto com o Codex (AGT-001 a AGT-005)**

O piloto foi realizado em projeto criado especificamente para o estudo, com documentação prévia,
controle de versão e registros por atividade, e está preservado no repositório
`TCC-IA-EXCURSOES`, marcação `piloto-codex`. As atividades AGT-001 a AGT-004 foram classificadas
como AP-1 após testes e revisão humana, e a AGT-005 foi classificada como AP-3. Seus resultados
são descritos a seguir como dados históricos do piloto.

*AGT-001 — Fundação técnica.* Estabeleceu estrutura inicial, configurações de desenvolvimento e
mecanismos de qualidade. Houve uma segunda interação com o agente, com instrução corretiva
restrita à extensão dos arquivos metodológicos; como ela não tratou de requisito, código ou
critério de aceitação nem decorreu de erro de implementação, o pesquisador manteve a
classificação AP-1, e a interação permanece registrada nas métricas (duas tentativas e nova
instrução).

*AGT-002 — Modelo de dados e persistência.* Concentrou-se no modelo de dados e na persistência
das entidades principais. Foi adotado SQLite por meio de `node:sqlite`, substituindo a previsão
inicial de PostgreSQL. Classificada como AP-1.

*AGT-003 — Cadastro, autenticação e controle de acesso.* Abordou cadastro, autenticação e
controle de acesso, relacionando-se às regras de maioridade, unicidade dos dados cadastrais e
autenticação. Classificada como AP-1.

*AGT-004 — Estrutura pública da plataforma.* Implementou a área pública (Home, Excursões,
Sobre, Como funciona e Contato), cabeçalho, rodapé e integração com a autenticação. A execução
foi iniciada em 10/09/2026 e interrompida por uma limitação temporária de uso do Codex, sendo
retomada sem reinício da implementação; a interrupção não foi contabilizada como nova tentativa
nem como falha. Foram executados 118 testes automatizados, todos aprovados, além de lint,
verificação de tipos e build. Após inspeção visual, foi classificada como AP-1 e registrada no
commit 41fba49.

*AGT-005 — Gerenciamento administrativo de excursões.* Permitiu o cadastro e a edição de
excursões por administradores, com nova migração de banco de dados, serviço com autorização
verificada no servidor, auditoria, controle de concorrência por versão do registro, rotas de API
e interface administrativa, com 80 novos testes. Segundo o relatório do agente, a suíte completa
de 198 testes foi aprovada, resultado confirmado por verificação técnica posterior, que também
mostrou que o lint falhava enquanto permaneciam artefatos temporários da inspeção visual na pasta
de dados; o código-fonte em si passou no lint. A especificação detalhada consultada pelo agente
estava em pasta externa ao repositório e revelou divergências em relação à base aprovada (pilha
tecnológica e perfis administrativos); o pesquisador decidiu preservar a base. Houve
esclarecimento de requisito e decisão de arquitetura, e a atividade foi classificada como AP-3 e
registrada no commit c66cd36.

O fato de as quatro primeiras atividades terem sido aprovadas na primeira execução é registrado
como resultado observado, mas não constitui evidência suficiente para generalizar o
comportamento do agente: as etapas são predominantemente fundacionais e antecedem atividades
com maior densidade de regras de negócio.

**5.3 Experimento principal com o Claude Code**

*Linha de base.* Em 11/11/2026, por decisão dos pesquisadores, o desenvolvimento foi reiniciado
em um novo repositório, `TCC-IA-EXCURSOES-CLAUDE`, sem reutilização de código do piloto. A
especificação foi reescrita pelo agente a partir do Capítulo 4 deste trabalho, por não estar
disponível a especificação original, e preservada em `docs/especificacao/`. O estado anterior à
AGT-001 foi registrado em um commit de linha de base. O agente teve contato prévio com o código,
os registros e os relatórios do piloto durante a preparação do reinício, o que é registrado como
ameaça à validade (Seção 3.9).

*AGT-001 — Fundação técnica do projeto.* A instrução original, adaptada da AGT-001 do piloto e
aprovada pelos pesquisadores em 11/11/2026, está preservada em
`TCC/registros-agente/AGT-001.md`. A atividade foi executada pelo Claude Code (modelo Claude
Sonnet 5.5) em uma tentativa, com início às 23:29:11 e fim às 23:32:24 do dia 11/11/2026,
duração cronológica de 3 min 13 s, valor que inclui a latência das chamadas de ferramenta e não
inclui a revisão humana. O agente criou o front-end com Vite e TypeScript, um servidor Node.js
mínimo (`node:http`, TypeScript executado diretamente pelo Node) com a rota `/api/health`,
análise estática (ESLint), verificação de tipos, estrutura de testes (Vitest), configuração de
variáveis de ambiente com arquivo de exemplo e documentação mínima de execução. Todas as
dependências são de desenvolvimento, com versões exatas fixadas. Nenhuma funcionalidade de
negócio foi implementada.

Segundo o relatório do agente, o lint, a verificação de tipos e o build passaram, e os 13 testes
automatizados (3 arquivos) foram aprovados. O agente também verificou que a rota de saúde
responde 200 e que o servidor de desenvolvimento serve a página inicial; não houve verificação
visual em navegador. O relatório aponta ainda 10 vulnerabilidades de severidade moderada em
ferramentas de desenvolvimento (cadeia ESLint → `minimatch`), sem correção aplicada por exigir
rebaixamento de versão maior, e que o agente leu o texto da instrução da AGT-001 do piloto para
adaptá-la. O agente decidiu por Vite sem framework de componentes e por servidor `node:http`
sem etapa de build; esses pontos aguardam decisão dos pesquisadores. Não houve commit pelo
agente.

`[Avaliação humana, intervenção humana, classificação (AP-1, AP-2, AP-3 ou RP), hash do commit e
linha da METRICAS.csv: a preencher exclusivamente pelos pesquisadores. Não foram feitos pelo
agente.]`

**5.4 Continuidade prevista**

As próximas atividades do experimento principal incluem modelo de dados e persistência
(AGT-002), cadastro, autenticação e controle de acesso, estrutura pública, administração de
excursões, consulta, reservas, retenção de vagas, pagamentos, área do passageiro, cancelamentos,
reembolsos, processos automáticos, comunicação, painel administrativo, testes integrados e
revisão técnica. A data de corte proposta para o desenvolvimento é 24/11/2026; atividades não
concluídas até lá serão tratadas como trabalhos futuros. `[Confirmar a data de corte.]`

### B.4 — Capítulo 6 (substitui o capítulo inteiro)

**6. RESULTADOS PARCIAIS E DISCUSSÃO**

**6.1 Conjunto de dados disponível**

Os dados são apresentados em dois conjuntos que não se misturam. No piloto com o Codex existem
cinco atividades concluídas e classificadas (AGT-001 a AGT-005): quatro AP-1 e uma AP-3, sem
AP-2 nem RP. No experimento principal com o Claude Code, uma atividade foi executada (AGT-001)
e aguarda avaliação humana, e nenhuma foi classificada. `[Atualizar quando houver
classificações.]` Esse quadro descreve apenas o conjunto parcial de dados, insuficiente para
responder ao problema de pesquisa.

Os registros produzidos permitem relacionar objetivo, instrução, execução, testes, revisão humana,
classificação e controle de versão. Um primeiro resultado metodológico é a viabilidade prática do
protocolo de coleta, observada no piloto e reaplicada na AGT-001 do experimento principal.

**6.2 Contribuições observáveis no estágio atual**

No piloto, o agente participou da construção da fundação técnica, da persistência, do módulo
inicial de autenticação e da estrutura pública dentro dos critérios de aceitação aplicados, sem
nova tentativa corretiva ou intervenção direta nas quatro primeiras atividades. No experimento
principal, o relatório do agente indica que a fundação técnica foi produzida em 3 min 13 s com
verificações automatizadas aprovadas; essa informação é autodeclarada e só terá valor de
resultado após a revisão e a classificação pelos pesquisadores.

Esses resultados não devem ser convertidos em afirmação de superioridade ou de autonomia geral.
As tarefas futuras contêm relações de negócio e integrações mais complexas.

**6.3 Papel da supervisão humana**

Mesmo nas atividades AP-1, a supervisão humana permaneceu parte do método: o resultado somente
foi aceito após verificação e as decisões de domínio não foram delegadas ao agente. A AGT-005 do
piloto ilustra a situação oposta: a leitura da especificação revelou divergências em relação à
base aprovada, e a decisão de preservá-la coube ao pesquisador, o que resultou em AP-3. Na AGT-001
do experimento principal, o próprio agente encaminhou três pontos à decisão humana (a escolha de
Vite com servidor `node:http`, as vulnerabilidades moderadas apontadas pelo `npm audit` e a
leitura da instrução do piloto), em conformidade com a regra de não decidir sem revisão sobre
pontos relevantes. Isso é coerente com estudos que descrevem desenvolvedores profissionais
usando agentes sob controle e verificação (HUANG et al., 2025; DHANORKAR; PASSI; VORVOREANU,
2026).

**6.4 Limitações da análise parcial**

A principal limitação é o tamanho do conjunto de dados: cinco atividades no piloto e nenhuma
classificada no experimento principal. As atividades iniciais concentram-se em preparação
técnica, persistência, autenticação e interface pública, enquanto pagamento, concorrência,
reembolso e automação ainda não foram observados. A interrupção por limite de uso durante a
AGT-004 do piloto mostra que disponibilidade da ferramenta pode afetar o andamento sem
representar falha de implementação. Soma-se o contato prévio do agente com o piloto, que pode
ter influenciado o experimento principal.

**6.5 Análise final prevista**

Após a ampliação da amostra do experimento principal, serão calculadas frequências e proporções
de AP-1, AP-2, AP-3 e RP, taxa de conclusão, número de tentativas, duração e ocorrência de
intervenção humana. As dificuldades serão agrupadas por categoria e relacionadas ao tipo de
tarefa, e atividades representativas serão analisadas qualitativamente. O piloto com o Codex
será descrito à parte, sem composição estatística com o experimento principal. A discussão final
confrontará os resultados com a literatura e responderá à questão de pesquisa.

### B.5 — Capítulo 7 (substitui o capítulo inteiro)

**7. CONSIDERAÇÕES PARCIAIS**

O trabalho encontra-se em desenvolvimento. A definição da metodologia, a especificação da
plataforma e o protocolo de coleta estabelecem uma base para o registro consistente das próximas
etapas. O piloto com o Codex concluiu cinco atividades (quatro AP-1 e uma AP-3) e demonstrou que
o procedimento de registro e avaliação pode ser aplicado ao desenvolvimento real do projeto. O
desenvolvimento foi então reiniciado com o Claude Code como único agente, e o experimento
principal tem, até o momento, a AGT-001 executada e pendente de avaliação humana.

Os dados disponíveis não permitem afirmar que o agente terá o mesmo comportamento em tarefas
posteriores, nem comparar os dois agentes. A etapa final da pesquisa deverá consolidar as
atividades do experimento principal, analisar métricas e registros qualitativos, discutir casos de
sucesso, correção, intervenção e eventual reprovação e confrontar as evidências com a literatura.
Somente então esta seção deverá ser substituída por Considerações Finais que respondam ao
problema de pesquisa sem extrapolar os dados observados.

---

## Parte C — Pendências que dependem dos pesquisadores

1. Aprovar ou ajustar os textos da Parte B antes de levá-los ao Google Docs.
2. Avaliar a AGT-001 do experimento principal (Seções 4, 11, 12, 13 e 14 do registro, e
   `METRICAS.csv`) e decidir o commit.
3. Decidir os três pontos da AGT-001: Vite + `node:http`; `npm audit`; leitura da instrução do
   piloto (regra 8 do `CLAUDE.md`).
4. Resolver os quatro itens **[confirmar]** da especificação.
5. Confirmar a data de corte (24/11/2026).
6. Revisar o `TCC/MODELO-REGISTRO-AGT.md`, que ainda cita o Codex nas Seções 5 e 10.
