# 01 — Visão geral

> **Origem desta especificação.** Escrita em 11/11/2026 a partir do Capítulo 4 do TCC e dos
> identificadores usados no estudo piloto com o Codex (tag `piloto-codex` do repositório
> anterior). A especificação original do piloto (dez documentos da pasta BPMTRIP) não estava
> disponível. Cada requisito indica a origem na coluna "Origem". Esta versão precisa ser
> **revisada e aprovada pelos pesquisadores** antes da AGT-001.

## Objetivo da plataforma

Centralizar o gerenciamento administrativo de excursões: usuários, excursões, reservas,
pagamentos, disponibilidade de vagas, cancelamentos, reembolsos e operações administrativas.

## Perfis

| Perfil | Descrição |
| --- | --- |
| Visitante | Acessa o conteúdo público e consulta excursões. |
| Passageiro | Usuário cadastrado e autenticado, com perfil, reservas e excursões vinculadas à conta. |
| Administrador | Cadastra e configura excursões, acompanha passageiros, reservas, pagamentos e ocupação, e executa ações administrativas autorizadas. |

## Áreas da aplicação

Área pública, área do passageiro e área administrativa. O controle de acesso segue essa separação.

## Tecnologias de partida

Node.js, TypeScript, Git, Visual Studio Code, banco de dados relacional e ferramentas
automatizadas de validação e testes (TCC, Seção 3.3). A escolha concreta de framework e
banco é decisão da AGT-001 e da AGT-002, e deve ser registrada nos respectivos registros.

## Fora do escopo

Integrações financeiras reais, envio real de e-mail/WhatsApp e upload de imagens são
tratados pelas atividades indicadas em `07-PLANO-DE-ATIVIDADES.md` apenas de forma
simulada ou configurável, salvo decisão registrada dos pesquisadores.

## Regra de governança do agente

O agente de IA **não altera regras de negócio aprovadas** (RN-043). Mudanças em pagamentos,
ocupação de vagas, autenticação, autorização, dados pessoais, cancelamentos, reembolsos ou
operações críticas dependem de decisão e revisão humana (RN-044).
