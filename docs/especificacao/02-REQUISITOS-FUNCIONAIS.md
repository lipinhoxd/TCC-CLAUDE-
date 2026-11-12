# 02 — Requisitos funcionais (RF-001 a RF-042)

Origem: **Piloto** = ID e título usados nos registros do estudo piloto; **TCC** = derivado do
Capítulo 4 (Seções 4.3 e 4.6); **Nova** = definido nesta versão para completar a numeração.
Atividade = AGT prevista em `07-PLANO-DE-ATIVIDADES.md`.

| ID | Requisito | Perfil | AGT | Origem |
| --- | --- | --- | --- | --- |
| RF-001 | Cadastro de usuário | Visitante | 003 | Piloto |
| RF-002 | Validação dos dados de cadastro | Visitante | 003 | Piloto |
| RF-003 | Autenticação por e-mail e senha | Todos | 003 | Piloto |
| RF-004 | Controle de acesso por perfil | Todos | 003 | Piloto |
| RF-005 | Perfil do usuário (consulta e edição) | Passageiro | 003 | Piloto |
| RF-006 | Recuperação de acesso | Todos | 003 | Piloto |
| RF-007 | Estrutura pública: Home, Excursões, Sobre, Como funciona e Contato | Visitante | 004 | TCC |
| RF-008 | Navegação pública (cabeçalho, rodapé, Cadastro e Login visíveis, estado autenticado) | Visitante | 004 | TCC |
| RF-009 | Cadastro de excursão | Administrador | 005 | TCC |
| RF-010 | Edição de excursão | Administrador | 005 | TCC |
| RF-011 | Configuração de capacidade | Administrador | 005 | TCC |
| RF-012 | Configuração de preço | Administrador | 005 | TCC |
| RF-013 | Habilitação de pagamento em duas parcelas e prazo da segunda | Administrador | 005 | TCC |
| RF-014 | Publicação e situação da excursão | Administrador | 005/006 | Nova |
| RF-015 | Listagem pública de excursões | Visitante | 006 | TCC |
| RF-016 | Detalhamento da excursão | Visitante | 006 | TCC |
| RF-017 | Exibição de disponibilidade de vagas | Visitante | 006/008 | TCC |
| RF-018 | Solicitação de reserva individual | Passageiro | 007 | TCC |
| RF-019 | Verificação de disponibilidade na reserva | Passageiro | 007/008 | TCC |
| RF-020 | Checkout obrigatório | Passageiro | 007 | TCC |
| RF-021 | Retenção temporária de vaga durante o checkout | Passageiro | 008 | TCC |
| RF-022 | Expiração da retenção | Sistema | 008/014 | TCC |
| RF-023 | Pagamento integral | Passageiro | 009 | TCC |
| RF-024 | Pagamento em duas parcelas de 50% | Passageiro | 010 | TCC |
| RF-025 | Confirmação financeira e ocupação efetiva da vaga | Sistema | 009/010 | TCC |
| RF-026 | Registro de confirmação financeira após expiração da retenção, para tratamento administrativo | Sistema | 009/013 | TCC |
| RF-027 | Quitação pela confirmação da segunda parcela | Sistema | 010 | TCC |
| RF-028 | Liberação da vaga por segunda parcela não paga no prazo | Sistema | 010/014 | TCC |
| RF-029 | Área do passageiro: minhas reservas | Passageiro | 011 | TCC |
| RF-030 | Detalhe e situação da reserva | Passageiro | 011 | TCC |
| RF-031 | Histórico de reservas concluídas | Passageiro | 011 | TCC |
| RF-032 | Cancelamento solicitado pelo passageiro | Passageiro | 013 | TCC |
| RF-033 | Cálculo do reembolso conforme a antecedência | Sistema | 013 | TCC |
| RF-034 | Cancelamento da excursão pela organização | Administrador | 013 | TCC |
| RF-035 | Reembolso integral dos valores pagos em cancelamento pela organização | Sistema | 013 | TCC |
| RF-036 | Conclusão automática de reservas elegíveis | Sistema | 014 | TCC |
| RF-037 | Administração de reservas | Administrador | 012 | TCC |
| RF-038 | Consulta de passageiros | Administrador | 012 | TCC |
| RF-039 | Alteração manual de situação, quando autorizada | Administrador | 012 | TCC |
| RF-040 | Comunicação transacional ao passageiro (simulada/configurável) | Sistema | 015 | TCC |
| RF-041 | Painel administrativo consolidado | Administrador | 016 | TCC |
| RF-042 | Histórico e auditoria de operações administrativas e automáticas | Administrador | 005/016 | TCC |
