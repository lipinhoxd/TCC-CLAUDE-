# Dossiê bruto da AGT-018 para o Gemini (27/11/2026)

**Destino:** Google Docs "VERSÃO BASE DO TCC" (ID 1AsQfKuB3HdHjJ8Pn2nGqc4VGmyJp-GqDr1z3o1KBH3I), por meio do Gemini.
**Origem dos dados:** `TCC/registros-agente/AGT-018.md`, `TCC/metricas/METRICAS.csv`, `docs/fichas-agt/principal/AGT-018.md`, `docs/quadro-resultados.md`, `docs/matriz-rastreabilidade.md`, `docs/revisao-tecnica-final.md`, `git log` (commits edcdb90 e b5fcb73) e o relatório em página privada (https://claude.ai/artifact/Edbi5Hhhyxo43yR8A57HRi).
**Natureza do arquivo:** conteúdo bruto, sem formatação final. O Gemini decide em que seções cada informação entra e como é escrita, **sem acrescentar nada que não esteja aqui**.

## ATENÇÃO — o que NÃO fazer (regras obrigatórias)

1. **Classes.** São cinco: AP-1, AP-2, AP-3 (intervenção planejada de governança prevista na instrução), AP-4 (intervenção corretiva para reparar falhas não corrigidas pelo agente) e RP. No experimento principal, AP-3: 18; AP-4: 0.
2. **Não criar métricas, percentuais, totais, tabelas, quadros, citações ou análises** que não estejam neste dossiê. "22 atendidos de 33" é resultado desta verificação: **não é taxa de qualidade**. Os tempos de resposta são medições sem meta, em uma máquina, com dados fictícios: não afirmar que o desempenho é adequado.
3. **Não afirmar que o sistema foi aprovado, validado de forma independente ou revisado por completo.** Não usar "revisão independente" nem "validação independente" como algo realizado: o **RNF-031 não foi atendido** (sem segundo avaliador). A revisão humana cobriu 8 de 10 itens, pela tela; **o código não foi lido**.
4. **Não inventar decisões, testes, telas, funções ou limitações.**
5. **Não apagar texto existente** (salvo as substituições da seção J e o texto indicado na seção G) e **não duplicar parágrafos**. Não alterar as fichas anteriores.
6. **Não mudar data de corte nem escopo.**
7. A contagem deve ser a mesma no **Resumo, no Abstract**, nas Seções 5.1, 6.1 e 6.4 e no Capítulo 7: experimento principal **n = 18 de 18**; piloto **n = 5**; nunca somados.
8. Dado ausente: "[DADO NÃO REGISTRADO]". Nada de palavras em inglês fora do Abstract e dos termos técnicos já usados.
9. **A ficha da AGT-018 é obrigatória.** Ao final, informar uma linha por trecho alterado.

## Ordem em relação aos envios anteriores

1. Se ainda não enviados: a **Parte A** de `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md` e os dossiês das AGT-013 a AGT-017, nesta ordem.
2. Este dossiê. A seção J **substitui todas as seções J anteriores e as Partes B e C** do pedido de correção.

## Regras de escrita do TCC

Linguagem acadêmica, impessoal, em terceira pessoa; sem primeira pessoa e sem tom de log; "projeto" (não "design"), "capacidades", "data-limite", "revisão humana", números em algarismos. A classificação é sempre dos pesquisadores. Tabelas e quadros: título acima, "Fonte: elaborado pelos autores" abaixo e remissão no texto.

## A. Resumo da atividade

A AGT-018 (Revisão técnica final) é a 18.ª e última atividade do experimento principal com o Claude Code (Claude Sonnet 5.5). A instrução foi escrita pelo agente e aprovada em 26/11/2026 às 22:17:32; as três decisões foram respondidas em 27/11/2026 às 18:03:56 ("recomendadas"); a verificação final terminou às 18:22:51 e o relatório às 18:23:32. Os pesquisadores classificaram a atividade como AP-3 às 18:27:30 ("ap 3"), **antes** da revisão pelo roteiro; em seguida, o pesquisador optou por revisar e conferiu os itens no navegador até 18:44:28, sem alterar a classificação. Uma tentativa, sem nova instrução corretiva. Duração nas métricas: 18,92 min.

Resultado dos 33 requisitos não funcionais: **22 atendidos**, **10 atendidos em parte** (005, 011, 012, 013, 014, 017, 023, 026, 030 e 032) e **1 não atendido** (031). O relatório do agente, entregue antes da revisão, indicava 9 em parte e o RNF-030 como aguardando; o número final é o desta seção.

Com a AGT-018, as **18 atividades planejadas foram concluídas em 27/11/2026**, antes da data de corte de 30/11/2026.

## B. Decisões dos pesquisadores (27/11/2026, 18:03:56) e razões

As razões são as das recomendações do agente, aceitas sem texto próprio do pesquisador.

1. **Alcance e critérios:** quatro resultados por requisito (descartado: só atendido ou não); desempenho medido sem meta e registrado como em parte (descartados: metas definidas pelo pesquisador; não medir); Google Chrome além do Edge (descartados: instalar Firefox; só Edge); consulta de vulnerabilidades com `npm audit` (descartado: não executar).
2. **Revisão humana e segundo avaliador:** roteiro em que só o respondido conta (descartadas: aprovação geral; nenhuma revisão); material do segundo avaliador preparado e RNF-031 registrado como não atendido (descartados: aguardar um avaliador; não preparar material).
3. **Encontrado e pontos abertos:** corrigir o que não muda regra, com teste antes (descartados: só relatar; corrigir tudo); **RN-046 mantida no instante exato da partida**, confirmando a fronteira da AGT-017; nomes das situações da retenção ajustados na especificação (descartados: renomear no sistema; deixar em aberto); textos "sem vaga" mantidos; menu do administrador ajustado no estilo; vulnerabilidades somente relatadas.

## C. O que foi feito

- Revisão do código de acesso, dados pessoais, pagamentos, vagas, cancelamentos, processos automáticos e rotas.
- Quatro defeitos corrigidos, cada um com teste que falhou antes: (A1) o limite de tentativas de entrada era contornável com pedidos simultâneos; (A2) banco ocupado respondia erro interno nas rotas de acesso e de excursões; (A3) o hash da senha nova era calculado antes de conferir o código de recuperação; (A4) endereço malformado respondia erro interno.
- Ajustes: documentação desatualizada (erro do agente na AGT-017), passos do primeiro acesso no README, texto da especificação e menu do administrador.
- Reprodução do zero a partir do repositório publicado e do código final; medição de desempenho; todas as páginas em dois navegadores; conferência das especificações e dos registros.
- Documentos: revisão técnica final, roteiro de revisão humana e material do segundo avaliador. Sem migração e sem dependência nova ou atualizada. Nenhum teste existente alterado.

## D. Verificações (resultados reais)

- `npm run check`: 807 testes em 42 arquivos aprovados, lint, tipos e build (18:17:24 e no fechamento, 18:46:21). Antes: 796 em 41.
- Suíte repetida 20 vezes sobre o código final, sem falha.
- `npm audit`: 9 vulnerabilidades moderadas em ferramentas de desenvolvimento; 0 nas dependências de produção.
- Revisão pelo roteiro (pesquisador): itens 1, 3, 4, 5, 7, 8, 9 e 10 "ok"; itens 2 e 6, somente no código, **não revisados**. Detalhe na seção K (Seção 11 do registro), inclusive um "ok" do item 9 que o banco não confirmava, apontado pelo agente e refeito.

## E. Erros e dificuldades

1. Defeitos A1 a A4, documentação desatualizada e passos ausentes no README.
2. Um roteiro de navegador e um roteiro de conferência dos registros falharam na primeira execução e foram corrigidos.
3. No fechamento, o roteiro de atualização parou no quadro de resultados por uma instrução incorreta; os passos restantes foram executados em seguida, e as contagens conferidas.

## F. Limitações, influência e revisão humana

- Correções de acesso (A2, A3 e o aspecto simultâneo da A1) **sem revisão humana** do código, embora a RN-044 a exija.
- Sem segundo avaliador (RNF-031 não atendido): ameaça à validade, pois classificações e avaliações não têm confirmação de outra pessoa.
- A revisão pelo roteiro foi guiada passo a passo pelo agente, em ambiente preparado por ele.
- Possível influência: o agente recomendou a classe AP-3, a pedido permanente do pesquisador.
- A instalação em outro computador é relato do pesquisador e precisou de ajuda do agente antes da correção do README.
- Demais limitações e trabalhos futuros: tabela "Limitações consolidadas e trabalhos futuros" na seção I.

## G. Dados para quadros, texto e referências cruzadas

- Experimento principal: **18 das 18** atividades concluídas e classificadas (n = 18), todas AP-3. Piloto com o Codex: n = 5 (4 AP-1 e 1 AP-3), separado.
- Quadro 2 (linha nova): Principal, AGT-018 | AP-3 | 1 | 807 (11 novos) | Sim (decisão sobre alcance, revisão humana e pontos abertos; revisão pelo roteiro) | edcdb90. Data da fonte do quadro: 27/11/2026.
- Apêndice D: AGT-018 (principal, AP-3): RNF-001 a RNF-033; documento docs/revisao-tecnica-final.md; 807 testes; commit edcdb90.
- Onde o TCC citar as situações da retenção de vaga com "Convertida" ou "Liberada", usar o texto atual: "Ativa → Confirmada (ocupação), Expirada (prazo vencido) ou Cancelada (liberada antes do prazo)."
- Onde o TCC apresentar a AGT-018 ou trabalhos como pendentes ou futuros do ciclo experimental, atualizar para concluído; os requisitos em parte ou não atendidos são limitações.
- Repositório: publicado em 26/11/2026 (github.com/lipinhoxd/TCC-CLAUDE-). Na data deste dossiê, os commits desta atividade **ainda não foram enviados** (2 commits à frente no momento da geração, antes do commit de documentação).
- Linha das métricas: AGT-018,Claude Code (Claude Sonnet 5.5),Qualidade / Revisao tecnica final e governanca,18.92,1,807,807,0,limite de tentativas contornavel por pedidos simultaneos corrigido; banco ocupado como erro interno corrigido; hash calculado antes do token corrigido; endereco malformado corrigido; documentacao desatualizada corrigida; dois roteiros de verificacao corrigidos (duracao das decisoes a verificacao final; inclui revisao do codigo testes reproducao do zero medicao navegadores e conferencia dos registros; esperas e revisao humana nao contadas),Nao,Sim,Decisao sobre alcance revisao humana e pontos abertos (3 paradas previstas) e revisao humana pelo roteiro,AP-3,edcdb90

## H. Ficha AGT-018 (Apêndice E), 20 campos, nesta ordem e com este conteúdo

- **ID e título:** AGT-018 — Revisão técnica final
- **Estudo:** Principal (Claude Code)
- **Objetivo:** Fazer a revisão técnica final do sistema e dos registros, verificando os requisitos não funcionais, o código das partes críticas e a coerência entre especificação, código, documentação e registros, e preparar o material para a revisão humana e para um segundo avaliador.
- **Requisitos relacionados:** RNF-030 a RNF-033, conforme o plano; verificação de RNF-001 a RNF-033, conforme a instrução.
- **Comando inicial:** Instrução original na Seção 5 de TCC/registros-agente/AGT-018.md (escrita pelo agente e aprovada pelo pesquisador em 26/11/2026 às 22:17:32; usada sem alterações).
- **Critérios de aceitação:** 16 critérios na Seção 4 do registro, todos marcados, com as ressalvas da Seção 11. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, com as respostas dele ao roteiro de revisão.
- **Testes:** 807 testes em 42 arquivos, todos aprovados, 0 reprovados (11 novos). Cinco testes novos falharam antes das correções. Suíte completa repetida 20 vezes sem falha. Reprodução do zero a partir do GitHub e do código final. Todas as páginas no Microsoft Edge e no Google Chrome, em 390 px e 1280 px.
- **Lint, tipos e build:** Aprovados.
- **Número de tentativas:** 1.
- **Duração:** 18,92 min (decisões respondidas às 18:03:56 e verificação final às 18:22:51, de 27/11/2026). A espera pela aprovação e pelas decisões, a classificação e a revisão humana não são contadas.
- **Pausas ou interrupções:** Uma parada obrigatória prevista na instrução, com três decisões, respondida no dia seguinte à aprovação; entre as duas, o pesquisador publicou o repositório e instalou o sistema em outro computador, sem alteração de código.
- **Intervenção humana:** Sim: decisão sobre alcance e critérios, revisão humana e segundo avaliador, tratamento do encontrado e pontos abertos; revisão pelo roteiro (8 de 10 itens).
- **Decisão técnica:** Quatro categorias de resultado; desempenho medido sem meta; Chrome além do Edge; npm audit; revisão guiada; segundo avaliador registrado como não atendido; corrigir defeitos sem mudar regra; RN-046 mantida no instante da partida; nomes das situações da retenção ajustados na especificação; textos "sem vaga" mantidos; menu ajustado no estilo; vulnerabilidades só relatadas.
- **Versão do agente:** Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO].
- **Ambiente:** Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0; Microsoft Edge 158 e Google Chrome 151.
- **Commits:** edcdb90 (atividade e registro).
- **Evidências:** Registro (Seções 6 a 12); diário (Entradas 129 a 135); METRICAS.csv; docs/revisao-tecnica-final.md, docs/revisao-humana-roteiro.md, docs/segundo-avaliador.md e tests/revisao-final.test.ts.
- **Classificação final:** AP-3 (decisão do pesquisador, 27/11/2026, anterior à revisão pelo roteiro; intervenção planejada de governança prevista na instrução). O agente recomendou a classe no relatório (possível influência).
- **Segundo avaliador:** [DADO NÃO REGISTRADO] (não designado; RNF-031 não atendido).
- **Limitações:** Revisão feita pelo agente que implementou o sistema; correções de acesso sem leitura humana do código (itens 2 e 6 não revisados); sem segundo avaliador; privacidade sem exclusão ou retenção de dados; desempenho sem meta nem carga; navegadores do mesmo motor; sem integração contínua; vulnerabilidades em ferramentas de desenvolvimento não atualizadas; preservação das instruções anterior à execução não comprovada pelo Git em nove atividades.

## I. Revisão técnica final (cópia literal de docs/revisao-tecnica-final.md)


> Feita em 27/11/2026 pelo mesmo agente que implementou o sistema. **Não é independente, não substitui a revisão humana (RN-044) e não
> declara o sistema aprovado.** Pagamentos, reembolsos e e-mails são simulados; os dados são fictícios.

### Resultado por requisito não funcional

| Resultado | n (de 33) |
| --- | --- |
| Atendido | 22 |
| Atendido em parte | 10 |
| Não verificável pelo agente | 0 |
| Não atendido | 1 |

| RNF | Requisito | Resultado | Como foi verificado e limites |
| --- | --- | --- | --- |
| RNF-001 | Hash seguro de senha | Atendido | Senha guardada com scrypt (N=65536, r=8, p=2) em produção, sal por senha, comparação em tempo constante. `revisao-final.test.ts`, `auth-validation.test.ts`, leitura de `server/auth/password.ts`. |
| RNF-002 | Proteção de rotas administrativas | Atendido | As 20 rotas administrativas respondem 401 a visitante e 403 a passageiro, sem alterar o banco. `revisao-final.test.ts`. |
| RNF-003 | Validação de dados | Atendido | Todas as rotas que recebem corpo respondem 4xx a dez corpos malformados; consultas parametrizadas. `revisao-final.test.ts` e testes de validação de cada área. |
| RNF-004 | Autorização verificada no servidor | Atendido | Autorização no servidor em todas as rotas do passageiro e administrativas; reserva alheia responde 404. `revisao-final.test.ts`, `regras-negocio.test.ts` (RN-008, RN-009, RN-033, RN-034). |
| RNF-005 | Proteção de dados pessoais | Atendido em parte | CPF mascarado ao próprio passageiro e nas listas; respostas sem dados de terceiros; auditoria sem dados pessoais. **Falta:** exclusão ou anonimização de dados, prazo de retenção e proteção do banco em repouso (dados em claro no arquivo local). |
| RNF-006 | Segurança de sessão | Atendido | Cookie HttpOnly e SameSite=Strict, Secure em produção, só o resumo do token no banco, expiração e revogação. Limitações: sem token CSRF; sessões vencidas não são apagadas. `revisao-final.test.ts`, `auth-api.test.ts`. |
| RNF-007 | Integridade dos dados | Atendido | Restrições e chaves estrangeiras; `foreign_key_check` e `integrity_check` sem apontamentos após os fluxos. `db-schema.test.ts`, `revisao-final.test.ts`. |
| RNF-008 | Prevenção de excedente de capacidade | Atendido | Restrição no banco e reavaliação na gravação, com disputa pela última vaga. `vagas-concorrencia.test.ts`, `regras-negocio.test.ts` (RN-021, RN-040). |
| RNF-009 | Consistência em operações críticas | Atendido | Transações imediatas, com falha injetada e duas conexões. `db-transaction-audit.test.ts`, `pagamento-confirmacao.test.ts`, `processos-execucao.test.ts`. |
| RNF-010 | Tratamento de falhas | Atendido | Erros viram respostas padronizadas sem detalhes; banco ocupado responde 503 em todas as áreas e endereço malformado responde 400 (**corrigidos nesta atividade**). Sem nova tentativa automática. |
| RNF-011 | Desempenho das consultas públicas | Atendido em parte | Medido sem meta (decisão do pesquisador). Ver "Desempenho". |
| RNF-012 | Desempenho das operações de reserva e pagamento | Atendido em parte | Medido sem meta (decisão do pesquisador). Ver "Desempenho". |
| RNF-013 | Interface compreensível | Atendido em parte | Em 56 visitas por navegador: um título principal por página, campos com rótulo, links e botões com nome, imagens com texto alternativo, idioma declarado. **Falta:** avaliação com usuários e leitor de tela. |
| RNF-014 | Consistência visual | Atendido em parte | Uma folha de estilos com variáveis de cor e componentes comuns; capturas conferidas pelo agente. A consistência não foi avaliada por pessoas. |
| RNF-015 | Feedback ao usuário | Atendido | Mensagens de sucesso, erro, carregamento e validação por campo nos testes de interface (`web-sessao`, `web-reservas`, `web-cancelamento`, `web-admin-reservas`). |
| RNF-016 | Responsividade | Atendido | Sem rolagem horizontal em 390 px e 1280 px nas 56 visitas, no Edge e no Chrome. Outras larguras não foram examinadas, salvo o menu em 1200 px e 1440 px. |
| RNF-017 | Compatibilidade com navegadores modernos | Atendido em parte | Microsoft Edge 158 e Google Chrome 151, sem erros no console. Os dois usam o mesmo motor; Firefox e Safari não foram verificados. |
| RNF-018 | Organização do código | Atendido | Separação em `src/`, `server/`, `shared/`, `tests/` e `docs/`. |
| RNF-019 | Padronização | Atendido | ESLint sem avisos, TypeScript estrito, `.editorconfig` e versões exatas (`.npmrc`). |
| RNF-020 | Modularidade | Atendido | Nenhuma importação cruzada entre `src/`, `server/` e `shared/` (busca no código); serviços separados por área. |
| RNF-021 | Documentação técnica | Atendido | README seguido em cópia limpa; um item desatualizado e a falta dos passos do primeiro acesso foram **corrigidos nesta atividade**. |
| RNF-022 | Testes automatizados | Atendido | 807 testes em 42 arquivos, aprovados. |
| RNF-023 | Validação antes da integração | Atendido em parte | `npm run check` registrado antes de cada commit de atividade. Não há verificação automática no repositório que impeça integrar sem ele. |
| RNF-024 | Prevenção de regressões | Atendido | A suíte cresceu de 15 para 807 testes; o histórico não mostra arquivo de teste removido. Algumas atividades reescreveram testes, com declaração no registro. |
| RNF-025 | Controle de versão | Atendido | Git, com commits identificados por atividade; repositório publicado em 26/11/2026. |
| RNF-026 | Rastreabilidade experimental | Atendido em parte | Cadeia requisito, atividade, instrução, testes, classificação e commit registrada. **Falta:** a versão da ferramenta nas atividades (não registrada ou não confirmável) e parte dos dados do piloto. |
| RNF-027 | Registro (logs) de operações sem dados sensíveis | Atendido | Quatro pontos de saída no console do servidor, sem dados pessoais, senhas ou tokens; conferido também no percurso da AGT-017. Os arquivos locais de entrega simulada contêm token e endereço. |
| RNF-028 | Minimização de dados pessoais coletados e exibidos | Atendido | Coletados somente os dados da RN-004; listas mascaradas; o detalhe completo do passageiro é auditado. `revisao-final.test.ts`. |
| RNF-029 | Qualidade estática (lint e verificação de tipos sem erros) | Atendido | Lint e verificação de tipos sem erros. |
| RNF-030 | Revisão humana de implementações produzidas por IA | Atendido em parte | Revisão do pesquisador em 27/11/2026 pelo roteiro: itens 1, 3, 4, 5, 7, 8, 9 e 10 "ok"; itens 2 e 6 (somente no código) **não revisados**; sem leitura do código. As correções A2 e A3 e o aspecto simultâneo da A1 não têm revisão humana. |
| RNF-031 | Validação independente da autoavaliação do agente | **Não atendido** | Não há segundo avaliador. Material preparado em `docs/segundo-avaliador.md`. Efeito: ameaça à validade, pois classificações e avaliações não têm confirmação de outra pessoa. |
| RNF-032 | Preservação das especificações | Atendido em parte | Especificação: desde a linha de base, três alterações, cada uma com decisão registrada (data de corte, AGT-014; RN-045, RN-046 e marcas, AGT-017; nomes da retenção, AGT-018). Instruções: a Seção 5 das 18 atividades é igual à primeira versão registrada no Git. **Limite:** em AGT-001 e AGT-003 a AGT-011, essa primeira versão é posterior à execução, e o Git não comprova que a instrução não mudou antes disso. |
| RNF-033 | Registro de intervenções humanas | Atendido | Métricas, registros, fichas, quadro e commits das 17 atividades concluídas conferidos por roteiro, sem divergência; diário com as entradas 1 a 133 sem falhas. Observações em "Registros". |

### Achados

| Nº | Gravidade | Onde | Achado | Evidência | Tratamento |
| --- | --- | --- | --- | --- | --- |
| A1 | Média | `server/auth/service.ts` (login) | O limite de tentativas era conferido antes da verificação da senha e contado depois: pedidos simultâneos passavam do limite. | Com limite 3, 12 pedidos simultâneos recebiam 401 | Corrigido: a tentativa é contada antes e descontada se a entrada der certo |
| A2 | Baixa | `server/auth/routes.ts` | Banco ocupado respondia 500 nas rotas de acesso e de excursões; a documentação dizia 503. | Cadastro com o banco bloqueado: 500 | Corrigido em um ponto central |
| A3 | Baixa | `server/auth/service.ts` (recuperação) | O hash caro da senha nova era calculado antes de conferir o token: pedidos com token falso consumiam processamento. | Teste com parâmetro de hash impossível | Corrigido: o token é conferido antes |
| A4 | Baixa | `server/app.ts` | Endereço que não pode ser interpretado respondia 500. | Pedido a `//[`: 500 | Corrigido: 400 |
| A5 | Documentação | `docs/autenticacao.md` | Uma limitação corrigida na AGT-017 (data de nascimento em UTC) continuava listada. Erro do agente na AGT-017. | Leitura | Corrigido |
| A6 | Documentação | `README.md` | Faltavam os passos do primeiro acesso e o comando equivalente no Windows; a instalação em outro computador precisou de ajuda (relato do pesquisador). | Cópia limpa | Corrigido |
| A7 | Interface | Menu do administrador | Duas ou três linhas em tela larga. | Registrado nas AGT-016 e AGT-017 | Corrigido só no estilo: uma linha em 1200, 1280 e 1440 px |
| A8 | Especificação | `05-FLUXOS-E-ESTADOS.md` | Nomes das situações da retenção diferentes dos do sistema. | AGT-017 | Texto ajustado, por decisão |
| A9 | Baixa | Dependências de desenvolvimento | 9 vulnerabilidades moderadas na cadeia do ESLint (`minimatch`); **nenhuma** nas dependências de produção. Há correção sem troca de versão principal (`eslint` 10.16.0 e `typescript-eslint` 8.74.0). | `npm audit` em 27/11/2026 | Só relatado, por decisão |
| A10 | Registro | AGT-013 | As métricas e o quadro mostram 610 testes; a decisão complementar posterior à classificação levou a 612 (commit `fdec2ba`), como consta no registro. | Conferência | Só relatado |
| A11 | Registro | Seções 13 | A anotação de que o agente recomendou a classe só aparece nas AGT-017 em diante; o acordo está no diário desde 13/11. | Conferência | Só relatado |

Alterações em acesso (A1 a A3) são críticas e **exigem revisão humana** (RN-044). O item 1 do roteiro foi respondido "ok" pela tela (limite em
tentativas em sequência); o item 2, que cobre A2 e A3, **não foi revisado**. Respostas na Seção 11 do registro.

### Desempenho (RNF-011 e RNF-012)

Volume fictício: 200 excursões publicadas, 2000 passageiros e 5000 reservas. Pedidos em sequência, um cliente, API e cliente na mesma
máquina (AMD Ryzen 5 5600 6-Core Processor, 16 GB, Node.js v26.13.0), em milissegundos. **Sem meta definida; não há teste de carga nem de concorrência, e os
valores não valem para outro ambiente.**

| Operação | n | Mediana | Percentil 95 | Máximo |
| --- | --- | --- | --- | --- |
| lista publica de excursoes | 200 | 2 | 2.7 | 5.8 |
| detalhe publico | 200 | 0.4 | 0.6 | 1.3 |
| entrada (inclui o hash da senha) | 20 | 307.6 | 362.1 | 362.1 |
| reservar | 100 | 5.3 | 8.8 | 9.9 |
| checkout | 100 | 5 | 6.1 | 7.6 |
| iniciar pagamento | 100 | 4.9 | 6.2 | 8 |
| confirmar pagamento | 100 | 5.3 | 7.6 | 10.5 |
| minhas reservas | 100 | 3.2 | 4.2 | 6.6 |

### Reprodução do zero

1. Cópia obtida do GitHub (commit `4e426cd`, antes desta atividade), com quebras de linha do Windows: instalação pelo arquivo de travamento
   e `npm run check` aprovados (796 testes); sistema executado conforme o README, com administrador, dados de demonstração, entrada, painel
   e rotina.
2. Cópia limpa do código final desta atividade (18:22:51): instalação pelo arquivo de travamento, `npm run check` aprovado (807 testes em 42
   arquivos) e execução conforme o README.
3. Instalação em outro computador: funcionou, **segundo relato do pesquisador**; o agente não a verificou.

### Registros (RNF-032 e RNF-033)

Conferidos: classe, intervenção, testes, commits e campos das fichas das AGT-001 a AGT-017 contra métricas, registros, quadro e Git; entradas
do diário; instrução preservada. A conferência é automática sobre esses campos e não avalia a veracidade das narrativas. Nenhum registro
anterior foi alterado.

### Limitações consolidadas e trabalhos futuros

| Tema | Limitação | Trabalho futuro |
| --- | --- | --- |
| Integrações | Pagamento, reembolso e e-mail simulados; posse do telefone não verificada (RN-005 em parte); recuperação de acesso sem entrega em produção. | Provedores reais e verificação de contato. |
| Implantação | Não há configuração de produção para o front-end, TLS, `Content-Security-Policy`, cópia de segurança ou monitoramento. | Plano de implantação. |
| Segurança | Limitador em memória e pelo endereço da conexão (atrás de proxy, todos compartilham o limite); sem token CSRF; cadastro sem limite de pedidos; sessões vencidas não apagadas; vulnerabilidades em ferramentas de desenvolvimento. | Endurecimento e atualização das dependências. |
| Privacidade | Sem exclusão ou anonimização, prazo de retenção ou proteção do banco em repouso. | Atendimento aos direitos do titular (LGPD). |
| Produto | Excursão sem situação "Concluída"; consulta pública sem paginação e sem busca; sem relatórios ou exportação; textos "sem vaga" também para a confirmação depois da partida; pasta de imagens vazia. | Evolução funcional. |
| Qualidade | Desempenho sem meta nem carga; somente navegadores do mesmo motor; sem avaliação de acessibilidade; sem integração contínua; um servidor e um banco. | Metas, testes de carga, outros navegadores, integração contínua. |
| Estudo | Um agente, sem grupo de controle e sem segundo avaliador; testes e verificações escritos pelo próprio agente; revisão do código aprovada em geral por autorização permanente; versão da ferramenta não registrada. | Segundo avaliador e réplica com protocolo fixado antes. |


## J. Quadro 3, análise e Seção 5.4 atualizados (substituem versões anteriores)

### J1. Substituir o parágrafo de introdução, o título, a tabela e a fonte do Quadro 3 por:

> A síntese dos registros dos dois conjuntos é apresentada no Quadro 3, que os mantém em colunas separadas e não os soma.

**Quadro 3 — Síntese dos registros por conjunto de atividades**

| Registro | Piloto (Codex, n = 5) | Experimento principal (Claude Code, n = 18) |
| --- | --- | --- |
| Atividades concluídas e classificadas | 5 de 5 executadas | 18 de 18 previstas |
| AP-1 | 4 | 0 |
| AP-2 | 0 | 0 |
| AP-3 | 1 | 18 |
| AP-4 | 0 | 0 |
| RP | 0 | 0 |
| Atividades com 1 tentativa | 3 | 17 |
| Atividades com 2 tentativas | 1 | 1 |
| Atividades com número de tentativas não registrado | 1 | 0 |
| Testes aprovados na primeira e na última atividade avaliada | 6 (AGT-001) e 198 (AGT-005) | 15 (AGT-001) e 807 (AGT-018) |
| Atividades com intervenção humana registrada | 1 | 18 |

Fonte: elaborado pelos autores, a partir dos registros AGT e das planilhas de métricas (27/11/2026). As classificações são as registradas; a distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010.

### J2. Substituir o parágrafo que começa com "Sob uma perspectiva analítica" (ou a versão anterior desta substituição) por:

> No experimento principal (n = 18), as 18 atividades foram classificadas como AP-3 e nenhuma como AP-4. As instruções dessas atividades previam paradas para decisão dos pesquisadores, e a classificação AP-3 registra essas intervenções planejadas. A distribuição descreve somente as atividades avaliadas: não permite concluir sobre o desempenho do agente nem estabelecer relação de causa, e não há grupo de controle nem segundo avaliador. A distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010, o que constitui uma limitação a considerar na leitura desses números. O piloto com o Codex (n = 5) é apresentado em coluna própria e não é somado nem comparado estatisticamente ao experimento principal.

### J3. Seção 5.4: substituir o parágrafo que começa com "As próximas atividades do experimento principal incluem" ou com "A próxima atividade do experimento principal" por:

> As 18 atividades planejadas do experimento principal foram concluídas em 27/11/2026, antes da data-limite de 30/11/2026. Os requisitos não funcionais atendidos em parte ou não atendidos na revisão técnica final são tratados como limitações e trabalhos futuros.

## K. Registro completo da atividade (cópia literal)

### 1. Identificação

ID da atividade: AGT-018

Título: Revisão técnica final

Categoria: Qualidade / Revisão técnica final e governança

Agente (ferramenta e modelo): Claude Code (Anthropic), modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code vista na pasta de extensões no início da atividade: 2.1.332 (instalada em 26/11/2026 às 12:19; a 2.1.331 está marcada como obsoleta). Não foi possível confirmar qual versão executou esta atividade.

Data: 26/11/2026

Requisitos relacionados:
- RNF-030 a RNF-033, conforme o plano de atividades
- Verificação de RNF-001 a RNF-033, conforme a instrução

### 2. Objetivo

Fazer a revisão técnica final do sistema e dos registros, verificando os requisitos não funcionais, o código das partes críticas e a
coerência entre especificação, código, documentação e registros, e preparar o material para a revisão humana e para um segundo avaliador.

### 3. Resultado esperado

Ao final, cada requisito não funcional deve ter resultado e evidência ou justificativa; os achados devem estar relatados e tratados
conforme as decisões; o roteiro de revisão humana, o material do segundo avaliador e a lista de limitações devem estar entregues.

Não deverão ser implementados: funcionalidades novas, provedor real nem mudança nas regras de negócio ou nos requisitos.

### 4. Critérios de aceitação

- [x] Decisões do pesquisador (alcance e critérios; revisão humana e segundo avaliador; tratamento do encontrado e pontos abertos) tomadas e registradas com justificativa.
- [x] Matriz de verificação com os 33 requisitos não funcionais: texto, forma de verificação, resultado e evidência.
- [x] Nenhum requisito marcado como atendido sem evidência executada ou conferida na atividade; o não verificável pelo agente registrado como tal.
- [x] Preservação das especificações conferida: cada alteração em docs/especificacao com a decisão que a autorizou e as instruções originais preservadas.
- [x] Registros, métricas, fichas, quadro e diário conferidos; divergências relatadas sem alterar registros anteriores.
- [x] Roteiro de revisão humana entregue; somente o respondido pelo pesquisador registrado como revisado.
- [x] Material para o segundo avaliador entregue; sem avaliador, requisito registrado como não atendido, com o efeito sobre a validade; nada chamado de independente.
- [x] Revisão do código crítico com arquivo, trecho, gravidade e evidência; defeito corrigido somente depois de teste que o reproduza.
- [x] Reprodução do zero em cópia limpa: instalação pelo arquivo de travamento, verificação completa e execução conforme o README.
- [x] Lista consolidada das limitações e dos trabalhos futuros.
- [x] Nenhum teste existente removido, ignorado ou enfraquecido; sem teste instável.
- [x] Achados e pontos abertos tratados conforme a decisão 3; docs/especificacao alterado somente com texto aprovado pelo pesquisador.
- [x] Lint, verificação de tipos, testes e build aprovados; suíte completa executada repetidas vezes.
- [x] Nenhuma funcionalidade fora do escopo e nenhuma dependência nova ou atualizada sem decisão.
- [x] Alterações realizadas pelo agente identificáveis.
- [x] Resultado submetido à revisão humana.

### 5. Instrução original enviada ao agente

Você está iniciando a atividade experimental AGT-018 — Revisão técnica final.

CONTEXTO

Este projeto faz parte de um Trabalho de Conclusão de Curso que investiga a utilização de um agente de Inteligência Artificial Generativa como ferramenta de apoio ao desenvolvimento de software sob supervisão humana.

O projeto experimental consiste no desenvolvimento de uma plataforma web para gerenciamento de excursões. As AGT-001 a AGT-017 implementaram o sistema e verificaram as regras de negócio. A AGT-018 é a última atividade prevista no plano, e a data de corte do desenvolvimento é 30/11/2026.

A matriz de rastreabilidade registra como planejados os requisitos RNF-030 a RNF-033, de governança, e o RNF-011 e o RNF-012, de desempenho, sem atividade definida. O RNF-017 está atendido em parte (somente o Microsoft Edge), o RNF-027 tem evidência parcial e o RNF-028 não tem evidência registrada. O RF-014 ainda aparece como parcial.

Há pontos abertos registrados pelas atividades anteriores: a RN-046 foi aplicada a partir do instante exato da partida, sem confirmação expressa; os nomes das situações da retenção diferem entre a especificação e o sistema; a tela do passageiro e os rótulos administrativos dizem "sem vaga" quando a confirmação chega depois da partida; o menu do administrador ocupa mais de uma linha em tela larga; e a AGT-001 registrou vulnerabilidades apontadas em ferramentas de desenvolvimento.

Leia o CLAUDE.md, toda a especificação em docs/especificacao/, docs/matriz-rastreabilidade.md, docs/rubrica-avaliacao.md e os documentos em docs/ antes de começar.

OBJETIVO DA ATIVIDADE

Fazer a revisão técnica final do sistema e dos registros: verificar os requisitos não funcionais, revisar o código das partes críticas, conferir a coerência entre especificação, código, documentação e registros, e preparar o material para a revisão humana e para um segundo avaliador, registrando com fidelidade o que é atendido e o que não é.

O resultado é uma verificação feita pelo mesmo agente que implementou o sistema. Ela não é independente, não substitui a revisão humana e não declara o sistema aprovado.

REGRAS DA ESPECIFICAÇÃO QUE VALEM NESTA ATIVIDADE

- RNF-001 a RNF-033, com o texto de docs/especificacao/03-REQUISITOS-NAO-FUNCIONAIS.md;
- RN-001 a RN-046, que não podem ser alteradas;
- RN-043: o agente não altera regras aprovadas. RN-044: alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana.

REQUISITOS DESTA ATIVIDADE

- uma matriz de verificação com os 33 requisitos não funcionais: texto, como foi verificado, resultado e evidência executada ou conferida nesta atividade. Nenhum requisito é marcado como atendido sem evidência, e o que o agente não puder verificar é registrado como tal;
- preservação das especificações (RNF-032): conferir no histórico do Git cada alteração em docs/especificacao e a decisão que a autorizou, e se a instrução original de cada atividade permanece igual à registrada;
- intervenções humanas (RNF-033): conferir a coerência entre os registros das atividades, as métricas, as fichas, o quadro de resultados e o diário. Divergências são relatadas, sem alterar registros anteriores;
- revisão humana (RNF-030): um roteiro para o pesquisador, com os arquivos críticos, o que observar e como conferir. Só é registrado como revisado o que o pesquisador responder;
- autoavaliação do agente (RNF-031): material para um segundo avaliador, conforme a rubrica. Sem segundo avaliador, o requisito é registrado como não atendido, com o efeito sobre a validade do estudo;
- revisão do código das partes críticas (acesso, dados pessoais, pagamentos, vagas, cancelamentos, reembolsos e processos automáticos), com arquivo, trecho, gravidade e evidência de cada achado; um defeito só é corrigido depois de um teste que o reproduza;
- reprodução do zero: cópia limpa do repositório em pasta temporária, instalação das dependências pelo arquivo de travamento, verificação completa e execução do sistema seguindo o README;
- lista consolidada das limitações e dos trabalhos futuros;
- nenhuma funcionalidade nova e nenhuma dependência nova sem decisão do pesquisador.

DECISÕES QUE EXIGEM AVALIAÇÃO HUMANA

Três decisões envolvem o alcance da revisão, a participação humana e o tratamento de problemas. Antes de criar arquivos, apresente para cada uma as opções viáveis com vantagens, desvantagens e uma recomendação, e interrompa para a decisão do pesquisador. Não escolha por conta própria.

1. Alcance e critérios. Apresente: as categorias de resultado de cada requisito; para o desempenho (RNF-011 e RNF-012), medir os tempos sem meta, medir contra metas definidas pelo pesquisador ou não medir; para a compatibilidade (RNF-017), verificar outro navegador já instalado, instalar um navegador de outro motor ou manter como está; e a consulta de vulnerabilidades das dependências, informando o que é enviado a serviço externo.
2. Revisão humana e segundo avaliador. Apresente: revisão guiada com respostas do pesquisador por item, aprovação geral ou nenhuma revisão nova; e a designação de um segundo avaliador ou o registro da ausência.
3. Tratamento do encontrado e pontos abertos. Apresente: corrigir os defeitos que não mudem regra e parar nos que dependam de interpretação, apenas relatar ou corrigir tudo, considerando a data de corte; e, para cada ponto aberto, as opções e a de não fazer nada, inclusive a fronteira da RN-046, os nomes das situações da retenção (com o texto proposto, se a opção for alterar a especificação), os rótulos "sem vaga", o menu do administrador e as vulnerabilidades.

RESTRIÇÕES

1. Não implemente funcionalidades fora do escopo.
2. Não altere os requisitos ou regras de negócio definidos pelo projeto; dúvidas ou conflitos na especificação são para o pesquisador (CLAUDE.md, regra 2).
3. Não inclua credenciais, tokens, senhas, números de cartão, dados bancários ou outros dados sensíveis no repositório, nos logs ou na auditoria. Use somente dados fictícios.
4. Não reutilize código funcional de projetos anteriores nem consulte o repositório do estudo piloto.
5. Não altere ou remova os arquivos existentes dentro das pastas TCC e docs/especificacao, exceto para preencher os campos de execução deste registro e, somente se a decisão 3 o determinar, para aplicar em docs/especificacao o texto aprovado expressamente pelo pesquisador.
6. Não modifique os registros experimentais existentes.
7. Os testes existentes não podem ser removidos, ignorados nem enfraquecidos; testes instáveis não são aceitos.
8. Caso exista uma decisão relevante que não possa ser tomada tecnicamente sem alterar significativamente arquitetura, dependências, segurança, custos, integrações externas, regras de negócio ou escopo do produto, interrompa e apresente a decisão ao pesquisador.
9. Você pode tomar decisões técnicas de baixo impacto necessárias, desde que as documente no relatório final, com o motivo e a versão exata de cada dependência adicionada.
10. Não realize commit Git. O commit será realizado somente após revisão humana.
11. Alterações críticas em autenticação, dados pessoais, pagamentos, vagas, cancelamentos e reembolsos exigem revisão humana (RN-044): descreva no relatório cada correção feita, o requisito ou a regra afetada, o comportamento antes e depois e o teste que a comprova.

VALIDAÇÃO

Ao concluir a implementação:

- execute a análise estática, a verificação de tipos, os testes e o build;
- execute a suíte completa repetidas vezes e relate qualquer falha intermitente;
- faça a reprodução do zero e a execução do sistema com dados fictícios;
- confira que cada um dos 33 requisitos da matriz tem resultado e evidência ou justificativa;
- corrija somente o que a decisão 3 permitir.

RELATÓRIO OBRIGATÓRIO

Ao finalizar, apresente um relatório contendo:

1. resumo do que foi verificado e o resultado por requisito não funcional;
2. decisões técnicas tomadas e respectivas justificativas;
3. tecnologias e versões efetivamente utilizadas;
4. arquivos e diretórios relevantes criados ou modificados;
5. dependências adicionadas ou atualizadas;
6. comandos relevantes executados;
7. testes e verificações executados;
8. resultados dos testes, análise estática, verificação de tipos e build;
9. achados, defeitos e divergências encontrados;
10. correções realizadas durante a execução;
11. limitações, pendências e trabalhos futuros, inclusive o que não foi verificado;
12. o roteiro de revisão humana, o material do segundo avaliador e qualquer ponto que considere necessário para revisão.

Não declare a atividade como aprovada. A aprovação e a classificação experimental serão realizadas exclusivamente pelo pesquisador após revisão humana.

Inicie a AGT-018.

### 6. Tentativas

Tentativa 1 (única até aqui). Aprovação da instrução: 2026-11-26T22:17:32-03:00. Início da execução: 2026-11-26T22:17:32-03:00. Início da
implementação (decisões respondidas): 2026-11-27T18:03:56-03:00.

Decisões do pesquisador (resposta "recomendadas", registrada em 2026-11-27T18:03:56-03:00), tomadas depois da apresentação das opções com recomendação (em
26/11/2026), antes de qualquer alteração do projeto. Entre a apresentação e a resposta, o pesquisador pediu a publicação do repositório
no GitHub e apoio para a instalação em outro computador (diário, Entradas 131 e 132), sem alteração de código.

1. **Alcance e critérios.**
   - 1.1 A: resultados **atendido**, **atendido em parte**, **não atendido** e **não verificável pelo agente**. Recusada: só atendido ou não.
   - 1.2 A: desempenho (RNF-011 e RNF-012) medido com dados fictícios e registrado **sem meta**, como atendido em parte. Recusadas: metas
     definidas pelo pesquisador; não medir.
   - 1.3 A: compatibilidade conferida no **Google Chrome** já instalado, além do Edge; como usam o mesmo motor, atendido em parte. Recusadas:
     instalar o Firefox; manter só o Edge.
   - 1.4 A: executar `npm audit`, que envia ao registro do npm a lista de dependências e versões, sem código nem dados pessoais. Recusada:
     não executar.
2. **Revisão humana e segundo avaliador.**
   - 2.1 A: revisão guiada por um roteiro curto; o pesquisador responde item por item "ok", "problema" ou "não revisei", e só o respondido
     conta. Recusadas: aprovação geral; nenhuma revisão nova.
   - 2.2 A: preparar o material do segundo avaliador e registrar o RNF-031 como **não atendido**, atualizando se uma avaliação for devolvida
     até 30/11/2026. Recusadas: aguardar um avaliador nomeado; não preparar material.
3. **Tratamento do encontrado e pontos abertos.**
   - 3.1 A: corrigir os defeitos que não mudem regra, com teste antes, e parar nos que dependam de interpretação. Recusadas: só relatar;
     corrigir tudo.
   - 3.2 A: **manter a RN-046 no instante exato da partida**, o que registra a confirmação do pesquisador sobre a fronteira adotada na
     AGT-017. Recusada: valer só depois do instante.
   - 3.3 A: ajustar a especificação com o texto aprovado: "`Ativa` → `Confirmada` (ocupação), `Expirada` (prazo vencido) ou `Cancelada`
     (liberada antes do prazo)." Recusadas: renomear no sistema; deixar em aberto.
   - 3.4 A: manter os textos "sem vaga", que continuam verdadeiros. Recusada: reescrever.
   - 3.5 A: ajustar somente o estilo do menu do administrador. Recusada: manter.
   - 3.6 A: vulnerabilidades apenas relatadas; qualquer atualização volta para decisão. Recusada: atualizar o que não quebrar os testes.

Justificativas (as das recomendações do agente, aceitas sem texto próprio do pesquisador): 1.2 A e 1.3 A evitam declarar atendido o que não
se comprova e não criam meta depois do resultado; 2.1 A registra o que de fato foi revisado e responde à ressalva da RN-044; 3.3 A e 3.4 A
não mexem no banco nem em testes com o comportamento correto e a data de corte próxima.

### 7. Alterações realizadas pelo agente

Arquivos novos:
- `tests/revisao-final.test.ts` (11 testes: acesso em todas as rotas, entradas inválidas, banco ocupado, limite de tentativas,
  recuperação, configuração de produção, dados pessoais e integridade do banco);
- `docs/revisao-tecnica-final.md` (matriz dos 33 requisitos, achados, desempenho, reprodução, registros e limitações);
- `docs/revisao-humana-roteiro.md` e `docs/segundo-avaliador.md`.

Alterados (código de outras atividades):
- `server/auth/service.ts` e `server/auth/support.ts`: tentativa contada antes da verificação da senha e descontada no acerto; token de
  recuperação conferido antes do cálculo do hash;
- `server/auth/routes.ts`: banco ocupado responde 503 em qualquer área;
- `server/app.ts`: endereço que não pode ser interpretado responde 400;
- `src/styles.css`: menu do administrador em uma linha em telas largas.

Documentos: `README.md`, `docs/autenticacao.md`, `docs/banco-de-dados.md` e, somente com o texto aprovado na decisão 3.3,
`docs/especificacao/05-FLUXOS-E-ESTADOS.md` (situações da retenção).

Sem migração, sem dependência nova ou atualizada. Nenhum teste existente alterado ou removido.

Correções, para revisão (RN-044):

| Nº | Requisito ou regra | Antes | Depois | Teste que comprova |
| --- | --- | --- | --- | --- |
| A1 | RNF-001, RNF-006 (acesso) | Pedidos simultâneos passavam do limite de tentativas (com limite 3, 12 recebiam 401). | Contagem antes da verificação, desfeita no acerto. Efeito colateral: entradas certas simultâneas contam enquanto estão em andamento. | Dois testes, que falharam antes e passam depois. |
| A2 | RNF-010 | Banco ocupado: 500 nas rotas de acesso e de excursões. | 503 `banco_ocupado` com `Retry-After`. | Falhou antes (cadastro com 500). |
| A3 | RNF-006, RN-007 | Hash da senha nova calculado antes de conferir o token. | Token conferido antes; a transação confere de novo. | Falhou antes. |
| A4 | RNF-010 | `//[` respondia 500. | 400. | Falhou antes. |

### 8. Comandos e testes

- Testes antes da atividade: 796 em 41 arquivos. Ao fim: **807 em 42** (11 novos).
- `npm audit` (18:05:10): 9 vulnerabilidades moderadas, todas em ferramentas de desenvolvimento (cadeia do ESLint, `minimatch`);
  `--omit=dev`: 0. Nada atualizado.
- Testes novos antes das correções (18:06:47): 5 reprovados e 5 aprovados.
- `npm run check`: 18:07:47 (806 em 42) e **18:17:24 (807 em 42, código final)**: lint, testes, tipos e build aprovados.
- Suíte completa repetida 20 vezes sobre o código final (18:17:31 a 18:21:51): 20 aprovadas, sem falha.
- Reprodução do zero: cópia obtida do GitHub (`4e426cd`, anterior à atividade) com quebras de linha do Windows, `npm ci` e
  `npm run check` (796) e execução conforme o README (18:08:49 a 18:09:11); cópia limpa do código final, `npm ci`, verificação (807) e
  execução (18:22:51). Em ambas: saúde da API, front-end e encaminhamento, administrador, dados de demonstração, entrada, painel e rotina.
- Desempenho sem meta (18:09:48; 200 excursões, 2.000 passageiros, 5.000 reservas; um cliente, em sequência): medianas de 0,4 a 5,3 ms nas
  consultas e operações de reserva e pagamento; entrada com hash da senha, 307,6 ms. Percentis e máximos no documento da revisão.
- Navegadores (18:15:26): Edge 158 e Chrome 151, 28 combinações de perfil e rota em 390 px e 1280 px (56 visitas por navegador), sem
  problema nas conferências feitas, sem erro no console, só o endereço local; menu do administrador em uma linha em 1200, 1280 e 1440 px.
- Registros (18:16:01): Seção 5 igual à primeira versão no Git nas 18 atividades; métricas, fichas, quadro, registros e commits das 17
  concluídas sem divergência nos campos conferidos; diário com as entradas 1 a 133; nenhum arquivo de teste removido no histórico.

### 9. Erros e dificuldades

1. Os defeitos A1 a A4, a documentação desatualizada (A5, erro do próprio agente na AGT-017) e a falta de passos no README (A6).
2. O primeiro roteiro do navegador falhou na preparação por esperar três excursões com mais de duas vagas; corrigido e repetido nos dois
   navegadores.
3. O primeiro roteiro de conferência dos registros falhou porque o interpretador do Windows tratou caracteres do comando; corrigido.

### 10. Relatório do agente

1. **Resultado por requisito:** dos 33 RNF, **22 atendidos**, **9 atendidos em parte** (005, 011, 012, 013, 014, 017, 023, 026 e 032),
   **1 não verificável pelo agente** (030, que aguarda o roteiro) e **1 não atendido** (031, sem segundo avaliador). Matriz em
   `docs/revisao-tecnica-final.md`.
2. **Decisões técnicas** (as do pesquisador estão na Seção 6). Escolhas do agente: contar a tentativa antes da verificação e descontar no
   acerto; tratar o banco ocupado em um ponto central, mantendo os tratamentos já existentes; menu ajustado apenas quando há o item do
   painel, em telas a partir de 1200 px; volume e método da medição de desempenho; resultado de cada requisito, com o critério descrito.
3. **Tecnologias:** Node.js v26.13.0, npm 11.20.0, `node:sqlite`, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0; Edge 158 e
   Chrome 151.
4. **Arquivos:** Seção 7.
5. **Dependências adicionadas ou atualizadas:** nenhuma.
6. **Comandos:** `npm audit`, `npm ci`, `npm run check`, `npx vitest run`, `git clone`, e roteiros de reprodução, medição, navegador e
   conferência na pasta temporária.
7. e 8. **Testes e resultados:** Seção 8.
9. e 10. **Achados e correções:** tabela de achados do documento da revisão e Seções 7 e 9.
11. **Limitações e trabalhos futuros:** tabela consolidada do documento da revisão. Em especial: sem segundo avaliador; privacidade sem
    exclusão nem retenção de dados; desempenho sem meta; navegadores do mesmo motor; sem integração contínua; instruções de nove atividades
    sem comprovação de preservação anterior à execução pelo Git.
12. **Para revisão humana:** o roteiro `docs/revisao-humana-roteiro.md` (itens 1 e 2 cobrem o código alterado); o material
    `docs/segundo-avaliador.md`; os resultados "em parte", que são julgamento do agente.

O agente não declara aprovação nem classifica a atividade.

### 11. Avaliação humana

> **TEXTO REDIGIDO PELO AGENTE, a pedido do pesquisador, com base nos registros, nas respostas e nas execuções.** O pesquisador respondeu "ap 3" (2026-11-27T18:27:30-03:00), lido pelo agente como a classificação AP-3. Como nenhum item do roteiro havia sido respondido, o agente perguntou como fechar; o pesquisador escolheu revisar antes (18:28:02) e fez a revisão no navegador, em um ambiente temporário com dados fictícios preparado pelo agente, com orientação passo a passo do agente.

### Revisão pelo roteiro (docs/revisao-humana-roteiro.md)

| Item | O que cobre | Resposta registrada | Como foi dada e o que corrobora |
| --- | --- | --- | --- |
| 1 | Limite de tentativas de entrada | ok | "Sim, apareceu" (18:42:34); o banco temporário registra 5 falhas seguidas. Só o limite em tentativas **em sequência**; a correção A1, de pedidos simultâneos, não é observável na tela. |
| 2 | Recuperação de acesso e banco ocupado (código) | **não revisei** | Resposta de 18:42:34. |
| 3 | Acesso por perfil | ok | Passageira: acesso restrito a administradores (18:30:46); antes, sem conta aberta, o acesso também foi negado (18:29:43). |
| 4 | Dados pessoais | ok | "4 e 8 ok" (18:37:52); o banco registra a consulta ao detalhe. |
| 5 | Pagamento e vaga esgotada | ok | "Está tudo certo" (18:31:28); o banco registra o segundo pagamento confirmado. |
| 6 | Pagamento depois da partida (código) | **não revisei** | Resposta de 18:42:34. |
| 7 | Cancelamento e reembolso | ok | "Confirmei, aí fica pendente" (18:31:52) e "check" (18:33:45), lido pelo agente como ok; a leitura foi informada ao pesquisador, que não a contestou. O banco registra reembolso de 100% (R$ 1.890,00) processado. |
| 8 | Painel e histórico | ok | "4 e 8 ok" (18:37:52). |
| 9 | Idade mínima | ok | Na primeira tentativa a conta foi criada com a data 01/01/2001 (maior de idade, comportamento correto). Um "ok" marcado às 18:42:34 não tinha correspondência no banco; o agente apontou e o pesquisador refez o teste: "É preciso ter 18 anos ou mais" (18:44:28); o banco registra a saída da conta e nenhuma conta nova. |
| 10 | Instalação em outro computador | ok | Relato do pesquisador (18:42:34). Durante a instalação o parceiro precisou da ajuda do agente (diário, Entrada 132), antes da correção do README. |

**Síntese:** 8 dos 10 itens revisados pelo pesquisador, todos "ok"; itens 2 e 6, que só existem no código, **não revisados**. Não houve leitura do código. Em consequência, as correções A2 e A3 e o aspecto simultâneo da A1, todas em acesso (RN-044), **não têm revisão humana**. Conforme a decisão 2.1, a autorização permanente de 19/11/2026 não é usada aqui para registrar como revisado o que não foi respondido. O RNF-030 passa a **atendido em parte**.

Atendeu ao objetivo: Proposta: sim. Os 33 requisitos não funcionais têm resultado registrado: 22 atendidos, 10 em parte e 1 não atendido (RNF-031).

Atendeu aos critérios de aceitação: Proposta: sim para os 16 critérios da Seção 4, todos marcados. Evidências: 807 testes aprovados em 42 arquivos (11 novos); lint, tipos e build sem erros; 20 rodadas seguidas sem falha; reprodução do zero; percurso de todas as páginas em dois navegadores. Ressalvas: (1) a revisão humana cobriu o comportamento em tela, não o código; (2) não há segundo avaliador; (3) os resultados "em parte" são julgamento do agente; (4) a verificação foi feita pelo agente que implementou o sistema.

Atendeu às regras de negócio: Proposta: sim; nenhuma regra foi alterada. A especificação mudou somente no texto aprovado das situações da retenção.

Comportamento esperado confirmado: Proposta: sim, nos testes, no percurso do agente e nos itens revisados pelo pesquisador.

Testes considerados suficientes: Proposta: suficientes para os defeitos corrigidos e para o acesso em todas as rotas; sem teste de carga ou de ataque simulado.

Problemas não identificados pelo agente: Proposta: nenhum identificado na revisão pelo roteiro.

### 12. Intervenção humana

Houve intervenção humana: Sim.

**Planejada na instrução** (três paradas da Seção 5): alcance e critérios, revisão humana e segundo avaliador, tratamento do encontrado e
pontos abertos. Resposta "recomendadas" (2026-11-27T18:03:56-03:00). Tipos: decisão sobre verificação, governança e especificação (nomes da
retenção; confirmação da fronteira da RN-046).

**Revisão prevista na decisão 2.1** (18:29:43 a 2026-11-27T18:44:28-03:00): o pesquisador conferiu no navegador 8 itens do roteiro (Seção 11). Tipo: revisão humana
(testes e interface), sem correção solicitada.

Nenhum código foi alterado manualmente pelo pesquisador. A natureza das intervenções para a classificação é decisão do pesquisador.

### 13. Classificação final

Classificação: AP-3.

(Decisão do pesquisador em 2026-11-27T18:27:30-03:00: "ap 3". Tentativa a que se aplica: 1. Critério da rubrica: AP-3 é a intervenção planejada de governança prevista na instrução; AP-4, a intervenção corretiva para reparar falhas não corrigidas pelo agente. A classificação foi dada **antes** da revisão pelo roteiro; a revisão não apontou problema, e o pesquisador não a alterou nem escreveu justificativa.)

Possível influência (rubrica, Seção 5): a pedido permanente do pesquisador (13/11/2026), o agente recomendou AP-3 no relatório.

### 14. Controle de versão

Commit relacionado: edcdb90

---

### 16. Observações finais

- Execução: aprovação da instrução em 2026-11-26T22:17:32-03:00; decisões respondidas em 2026-11-27T18:03:56-03:00; verificação final em
  2026-11-27T18:22:51-03:00; relatório do agente concluído em 2026-11-27T18:23:32-03:00. A espera entre a aprovação e as decisões não é tempo de execução.
- Pontos para a avaliação: A1 a A3 (acesso); os critérios dos resultados "em parte"; a ausência de segundo avaliador.
- Duração registrada nas métricas: 18,92 min, de 18:03:56 (decisões respondidas) a 18:22:51 (verificação final) de 27/11/2026. A espera pela
  aprovação e pelas decisões, a redação do relatório, a classificação e a revisão pelo roteiro não são contadas.
- A versão da ferramenta (extensão 2.1.332, a mais recente instalada) não pôde ser confirmada como a que executou a atividade.
