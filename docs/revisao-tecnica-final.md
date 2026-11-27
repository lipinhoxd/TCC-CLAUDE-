# Revisão técnica final (AGT-018)

> Feita em 27/11/2026 pelo mesmo agente que implementou o sistema. **Não é independente, não substitui a revisão humana (RN-044) e não
> declara o sistema aprovado.** Pagamentos, reembolsos e e-mails são simulados; os dados são fictícios.

## Resultado por requisito não funcional

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

## Achados

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

## Desempenho (RNF-011 e RNF-012)

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

## Reprodução do zero

1. Cópia obtida do GitHub (commit `4e426cd`, antes desta atividade), com quebras de linha do Windows: instalação pelo arquivo de travamento
   e `npm run check` aprovados (796 testes); sistema executado conforme o README, com administrador, dados de demonstração, entrada, painel
   e rotina.
2. Cópia limpa do código final desta atividade (18:22:51): instalação pelo arquivo de travamento, `npm run check` aprovado (807 testes em 42
   arquivos) e execução conforme o README.
3. Instalação em outro computador: funcionou, **segundo relato do pesquisador**; o agente não a verificou.

## Registros (RNF-032 e RNF-033)

Conferidos: classe, intervenção, testes, commits e campos das fichas das AGT-001 a AGT-017 contra métricas, registros, quadro e Git; entradas
do diário; instrução preservada. A conferência é automática sobre esses campos e não avalia a veracidade das narrativas. Nenhum registro
anterior foi alterado.

## Limitações consolidadas e trabalhos futuros

| Tema | Limitação | Trabalho futuro |
| --- | --- | --- |
| Integrações | Pagamento, reembolso e e-mail simulados; posse do telefone não verificada (RN-005 em parte); recuperação de acesso sem entrega em produção. | Provedores reais e verificação de contato. |
| Implantação | Não há configuração de produção para o front-end, TLS, `Content-Security-Policy`, cópia de segurança ou monitoramento. | Plano de implantação. |
| Segurança | Limitador em memória e pelo endereço da conexão (atrás de proxy, todos compartilham o limite); sem token CSRF; cadastro sem limite de pedidos; sessões vencidas não apagadas; vulnerabilidades em ferramentas de desenvolvimento. | Endurecimento e atualização das dependências. |
| Privacidade | Sem exclusão ou anonimização, prazo de retenção ou proteção do banco em repouso. | Atendimento aos direitos do titular (LGPD). |
| Produto | Excursão sem situação "Concluída"; consulta pública sem paginação e sem busca; sem relatórios ou exportação; textos "sem vaga" também para a confirmação depois da partida; pasta de imagens vazia. | Evolução funcional. |
| Qualidade | Desempenho sem meta nem carga; somente navegadores do mesmo motor; sem avaliação de acessibilidade; sem integração contínua; um servidor e um banco. | Metas, testes de carga, outros navegadores, integração contínua. |
| Estudo | Um agente, sem grupo de controle e sem segundo avaliador; testes e verificações escritos pelo próprio agente; revisão do código aprovada em geral por autorização permanente; versão da ferramenta não registrada. | Segundo avaliador e réplica com protocolo fixado antes. |
