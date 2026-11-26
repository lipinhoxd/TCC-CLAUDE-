export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * Migracoes versionadas, aplicadas em ordem crescente de versao.
 * Regra: uma migracao ja aplicada nunca e editada; mudancas viram nova versao.
 * Convencoes (RN-038, RN-039): dinheiro em centavos inteiros; instantes em texto ISO 8601 UTC
 * ("AAAA-MM-DDTHH:MM:SS.sssZ"); datas de calendario em "AAAA-MM-DD".
 */
export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'esquema_inicial',
    sql: `
CREATE TABLE usuario (
  id INTEGER PRIMARY KEY,
  nome_completo TEXT NOT NULL CHECK (length(trim(nome_completo)) > 0),
  cpf TEXT NOT NULL CHECK (length(cpf) = 11 AND cpf NOT GLOB '*[^0-9]*'),
  email TEXT NOT NULL CHECK (length(email) > 0 AND email = lower(email)),
  data_nascimento TEXT NOT NULL CHECK (data_nascimento GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  telefone TEXT NOT NULL CHECK (length(trim(telefone)) > 0),
  senha_hash TEXT NOT NULL CHECK (length(senha_hash) > 0),
  perfil TEXT NOT NULL DEFAULT 'passageiro' CHECK (perfil IN ('passageiro', 'administrador')),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  atualizado_em TEXT NOT NULL CHECK (atualizado_em GLOB '????-??-??T??:??:??*Z'),
  CONSTRAINT uq_usuario_cpf UNIQUE (cpf),
  CONSTRAINT uq_usuario_email UNIQUE (email)
) STRICT;

CREATE TABLE excursao (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL CHECK (length(trim(nome)) > 0),
  descricao TEXT NOT NULL DEFAULT '',
  imagem_ref TEXT,
  local TEXT NOT NULL CHECK (length(trim(local)) > 0),
  ponto_embarque TEXT NOT NULL CHECK (length(trim(ponto_embarque)) > 0),
  data_inicial TEXT NOT NULL CHECK (data_inicial GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  data_final TEXT NOT NULL CHECK (data_final GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  partida_utc TEXT NOT NULL CHECK (partida_utc GLOB '????-??-??T??:??:??*Z'),
  capacidade INTEGER NOT NULL CHECK (capacidade > 0),
  vagas_ocupadas INTEGER NOT NULL DEFAULT 0,
  preco_centavos INTEGER NOT NULL CHECK (preco_centavos >= 0),
  parcelamento_habilitado INTEGER NOT NULL DEFAULT 0 CHECK (parcelamento_habilitado IN (0, 1)),
  prazo_segunda_parcela_utc TEXT CHECK (prazo_segunda_parcela_utc GLOB '????-??-??T??:??:??*Z'),
  situacao TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (situacao IN ('rascunho', 'publicada', 'encerrada', 'cancelada')),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  atualizado_em TEXT NOT NULL CHECK (atualizado_em GLOB '????-??-??T??:??:??*Z'),
  -- RN-021 / RNF-008: a ocupacao nunca ultrapassa a capacidade, garantido pelo proprio banco.
  CONSTRAINT ck_excursao_ocupacao CHECK (vagas_ocupadas >= 0 AND vagas_ocupadas <= capacidade),
  CONSTRAINT ck_excursao_datas CHECK (data_final >= data_inicial),
  CONSTRAINT ck_excursao_parcelamento CHECK (
    parcelamento_habilitado = 0
    OR (prazo_segunda_parcela_utc IS NOT NULL AND prazo_segunda_parcela_utc < partida_utc)
  )
) STRICT;

CREATE TABLE reserva (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  excursao_id INTEGER NOT NULL REFERENCES excursao (id) ON DELETE RESTRICT,
  modalidade TEXT NOT NULL DEFAULT 'integral' CHECK (modalidade IN ('integral', 'parcelada')),
  situacao TEXT NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (situacao IN ('aguardando_pagamento', 'pronto_para_embarque', 'concluida', 'cancelada')),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  atualizado_em TEXT NOT NULL CHECK (atualizado_em GLOB '????-??-??T??:??:??*Z')
) STRICT;
-- RN-009: no maximo uma reserva nao cancelada por passageiro e excursao.
CREATE UNIQUE INDEX uq_reserva_ativa ON reserva (usuario_id, excursao_id) WHERE situacao <> 'cancelada';
CREATE INDEX ix_reserva_excursao ON reserva (excursao_id, situacao);

CREATE TABLE pagamento (
  id INTEGER PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reserva (id) ON DELETE RESTRICT,
  parcela TEXT NOT NULL CHECK (parcela IN ('unica', 'primeira', 'segunda')),
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
  situacao TEXT NOT NULL DEFAULT 'pendente'
    CHECK (situacao IN ('pendente', 'confirmado', 'falhou', 'estornado')),
  confirmado_em TEXT CHECK (confirmado_em GLOB '????-??-??T??:??:??*Z'),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  atualizado_em TEXT NOT NULL CHECK (atualizado_em GLOB '????-??-??T??:??:??*Z'),
  CONSTRAINT uq_pagamento_parcela UNIQUE (reserva_id, parcela),
  CONSTRAINT ck_pagamento_confirmacao CHECK (situacao <> 'confirmado' OR confirmado_em IS NOT NULL)
) STRICT;

CREATE TABLE retencao_vaga (
  id INTEGER PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reserva (id) ON DELETE RESTRICT,
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  expira_em TEXT NOT NULL CHECK (expira_em GLOB '????-??-??T??:??:??*Z'),
  situacao TEXT NOT NULL DEFAULT 'ativa'
    CHECK (situacao IN ('ativa', 'confirmada', 'expirada', 'cancelada')),
  CONSTRAINT ck_retencao_validade CHECK (expira_em > criado_em)
) STRICT;
CREATE UNIQUE INDEX uq_retencao_ativa ON retencao_vaga (reserva_id) WHERE situacao = 'ativa';
CREATE INDEX ix_retencao_expiracao ON retencao_vaga (situacao, expira_em);

CREATE TABLE reembolso (
  id INTEGER PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reserva (id) ON DELETE RESTRICT,
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos >= 0),
  percentual_aplicado INTEGER NOT NULL CHECK (percentual_aplicado BETWEEN 0 AND 100),
  motivo TEXT NOT NULL CHECK (length(trim(motivo)) > 0),
  situacao TEXT NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'processado', 'recusado')),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  atualizado_em TEXT NOT NULL CHECK (atualizado_em GLOB '????-??-??T??:??:??*Z')
) STRICT;

-- RN-041 / RN-042: trilha de auditoria apenas de inclusao, sem senhas, tokens ou dados cadastrais.
CREATE TABLE auditoria (
  id INTEGER PRIMARY KEY,
  ator_usuario_id INTEGER REFERENCES usuario (id) ON DELETE SET NULL,
  acao TEXT NOT NULL CHECK (length(trim(acao)) > 0),
  entidade TEXT NOT NULL CHECK (length(trim(entidade)) > 0),
  registro_id INTEGER,
  estado_anterior TEXT CHECK (estado_anterior IS NULL OR json_valid(estado_anterior)),
  estado_novo TEXT CHECK (estado_novo IS NULL OR json_valid(estado_novo)),
  ocorrido_em TEXT NOT NULL CHECK (ocorrido_em GLOB '????-??-??T??:??:??*Z')
) STRICT;
CREATE INDEX ix_auditoria_registro ON auditoria (entidade, registro_id);
CREATE TRIGGER tg_auditoria_sem_update BEFORE UPDATE ON auditoria
BEGIN SELECT RAISE(ABORT, 'auditoria e somente de inclusao'); END;
CREATE TRIGGER tg_auditoria_sem_delete BEFORE DELETE ON auditoria
BEGIN SELECT RAISE(ABORT, 'auditoria e somente de inclusao'); END;

-- Sessao e token: guardam apenas o hash do segredo, nunca o valor em claro.
CREATE TABLE sessao (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL CHECK (length(token_hash) > 0),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  expira_em TEXT NOT NULL CHECK (expira_em GLOB '????-??-??T??:??:??*Z'),
  revogada_em TEXT CHECK (revogada_em GLOB '????-??-??T??:??:??*Z'),
  CONSTRAINT uq_sessao_token UNIQUE (token_hash),
  CONSTRAINT ck_sessao_validade CHECK (expira_em > criado_em)
) STRICT;
CREATE INDEX ix_sessao_usuario ON sessao (usuario_id);

CREATE TABLE token_acesso (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  finalidade TEXT NOT NULL CHECK (finalidade IN ('recuperacao_acesso')),
  token_hash TEXT NOT NULL CHECK (length(token_hash) > 0),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  expira_em TEXT NOT NULL CHECK (expira_em GLOB '????-??-??T??:??:??*Z'),
  usado_em TEXT CHECK (usado_em GLOB '????-??-??T??:??:??*Z'),
  CONSTRAINT uq_token_acesso_hash UNIQUE (token_hash),
  CONSTRAINT ck_token_acesso_validade CHECK (expira_em > criado_em)
) STRICT;
CREATE INDEX ix_token_acesso_usuario ON token_acesso (usuario_id);
`,
  },
  {
    // AGT-009 (decisao 3 do pesquisador): confirmacao financeira recebida sem vaga disponivel (RN-022, RF-026) fica
    // sinalizada no proprio pagamento, para a fila administrativa (AGT-012 e AGT-013). Nao altera linhas existentes.
    version: 2,
    name: 'pagamento_pendencia_administrativa',
    sql: `
ALTER TABLE pagamento ADD COLUMN pendencia_administrativa TEXT
  CHECK (pendencia_administrativa IS NULL OR pendencia_administrativa = 'confirmacao_sem_vaga');
CREATE INDEX ix_pagamento_pendencia ON pagamento (pendencia_administrativa) WHERE pendencia_administrativa IS NOT NULL;
`,
  },
  {
    // AGT-010 (decisao 3 do pesquisador): a reserva parcelada cuja segunda parcela nao foi paga no prazo fica Cancelada, com o
    // motivo gravado aqui, e a primeira parcela permanece nao reembolsavel (RN-019, RN-020, RN-032). A AGT-013 reaproveita o motivo.
    // Nao altera linhas existentes (motivo nulo).
    version: 3,
    name: 'reserva_motivo_cancelamento',
    sql: `
ALTER TABLE reserva ADD COLUMN motivo_cancelamento TEXT
  CHECK (motivo_cancelamento IS NULL OR motivo_cancelamento = 'inadimplencia');
`,
  },
  {
    // AGT-013: um reembolso por cancelamento de reserva e no maximo um por pagamento sinalizado (idempotencia no banco).
    version: 4,
    name: 'reembolso_por_pagamento',
    sql: `
ALTER TABLE reembolso ADD COLUMN pagamento_id INTEGER REFERENCES pagamento (id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX uq_reembolso_cancelamento ON reembolso (reserva_id) WHERE pagamento_id IS NULL;
CREATE UNIQUE INDEX uq_reembolso_pagamento ON reembolso (pagamento_id) WHERE pagamento_id IS NOT NULL;
`,
  },
  {
    // AGT-015 (decisoes 1A e 3.1 a 3.3 do pesquisador): avisos ao passageiro gerados pela rotina a partir da auditoria, um por
    // evento, so para eventos posteriores a esta migracao (o marco comeca no ultimo registro existente). Nao altera linhas existentes.
    version: 5,
    name: 'comunicacao',
    sql: `
CREATE TABLE comunicacao_marco (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ultima_auditoria_id INTEGER NOT NULL CHECK (ultima_auditoria_id >= 0)
) STRICT;
INSERT INTO comunicacao_marco (id, ultima_auditoria_id) SELECT 1, COALESCE(MAX(id), 0) FROM auditoria;
CREATE TABLE mensagem (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  reserva_id INTEGER NOT NULL REFERENCES reserva (id) ON DELETE RESTRICT,
  auditoria_id INTEGER NOT NULL REFERENCES auditoria (id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('pagamento_confirmado', 'pagamento_em_analise', 'cancelada_inadimplencia', 'cancelada_passageiro', 'cancelada_organizacao', 'cancelada_administracao', 'cancelada_excursao_terminada', 'cancelada_apos_reembolso', 'reembolso_processado')),
  assunto TEXT NOT NULL CHECK (length(trim(assunto)) > 0),
  corpo TEXT NOT NULL CHECK (length(trim(corpo)) > 0),
  evento_em TEXT NOT NULL CHECK (evento_em GLOB '????-??-??T??:??:??*Z'),
  criado_em TEXT NOT NULL CHECK (criado_em GLOB '????-??-??T??:??:??*Z'),
  email_situacao TEXT NOT NULL DEFAULT 'pendente' CHECK (email_situacao IN ('pendente', 'enviado', 'falhou')),
  email_tentativas INTEGER NOT NULL DEFAULT 0 CHECK (email_tentativas BETWEEN 0 AND 3),
  email_enviado_em TEXT CHECK (email_enviado_em GLOB '????-??-??T??:??:??*Z'),
  CONSTRAINT uq_mensagem_evento UNIQUE (auditoria_id),
  CONSTRAINT ck_mensagem_envio CHECK ((email_situacao = 'enviado') = (email_enviado_em IS NOT NULL))
) STRICT;
CREATE INDEX ix_mensagem_usuario ON mensagem (usuario_id, id);
CREATE INDEX ix_mensagem_envio ON mensagem (id) WHERE email_situacao = 'pendente';
`,
  },
];
