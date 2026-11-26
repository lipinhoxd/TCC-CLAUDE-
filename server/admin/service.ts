import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import { calcularParcelas } from '../reservas/service.ts';
import type { Modalidade } from '../reservas/service.ts';
import { concluirReservas } from '../vagas/conclusao.ts';
import { vencerSegundasParcelas } from '../vagas/vencimento.ts';

/**
 * Administracao de reservas e passageiros (AGT-012, RF-037, RF-038, RF-039, RF-026, RN-034, RN-035). Decisoes do pesquisador
 * (24/11/2026, "recomendadas"):
 * 1. Dados pessoais: a lista de passageiros mostra nome e e-mail inteiros e CPF e telefone mascarados; os dados completos aparecem so
 *    no detalhe do passageiro, e cada consulta ao detalhe e auditada (quem consultou quem e quando, sem gravar o dado consultado).
 * 2. Alteracoes manuais de situacao: so transicoes sem efeito financeiro, com justificativa obrigatoria e auditoria com o
 *    administrador como ator: cancelar reserva em Aguardando pagamento sem pagamento pendente ou confirmado (libera a retencao) e
 *    marcar Concluida a reserva Pronta para embarque cuja excursao terminou. Cancelar com pagamento confirmado e da AGT-013.
 * 3. Pendencias administrativas: so listar e filtrar, sem acao e sem migracao.
 * As leituras efetivam antes, em transacao propria, o vencimento da segunda parcela e a conclusao automatica (AGT-010, AGT-011), para
 * que a situacao gravada seja a situacao mostrada.
 */

type Row = Record<string, unknown>;
const modalidadeDe = (valor: unknown): Modalidade => (valor === 'parcelada' ? 'parcelada' : 'integral');
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const n = (valor: unknown): number => Number(valor);

export const SITUACOES = ['aguardando_pagamento', 'pronto_para_embarque', 'concluida', 'cancelada'] as const;
const MODALIDADES = ['integral', 'parcelada'] as const;
const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;
const JUSTIFICATIVA_MAX = 300;

export type TipoPendencia = 'confirmado_sem_vaga' | 'segunda_parcela_apos_vencimento';
const TIPOS_PENDENCIA: readonly TipoPendencia[] = ['confirmado_sem_vaga', 'segunda_parcela_apos_vencimento'];

export interface Pagina {
  total: number;
  pagina: number;
  limite: number;
}

function inteiro(valor: string | undefined, campo: string, padrao: number, minimo: number, maximo: number, erros: Record<string, string>): number {
  if (valor === undefined || valor === '') return padrao;
  if (!/^[0-9]{1,9}$/.test(valor)) {
    erros[campo] = 'invalido';
    return padrao;
  }
  const v = Number(valor);
  if (v < minimo || v > maximo) {
    erros[campo] = 'invalido';
    return padrao;
  }
  return v;
}

/** Mascara o CPF mostrando so os dois ultimos digitos: ***.***.***-25. */
export function mascararCpf(cpf: string): string {
  return `***.***.***-${cpf.slice(-2)}`;
}

/** Mascara o telefone mostrando so os quatro ultimos digitos. */
export function mascararTelefone(telefone: string): string {
  const digitos = telefone.replace(/[^0-9]/g, '');
  return digitos.length >= 4 ? `(**) *****-${digitos.slice(-4)}` : '(**) *****-****';
}

export interface ReservaResumoAdmin {
  id: number;
  situacao: string;
  modalidade: Modalidade;
  criada_em: string;
  motivo_cancelamento: 'inadimplencia' | null;
  passageiro: { id: number; nome_completo: string; email: string };
  excursao: { id: number; nome: string; data_inicial: string; data_final: string };
  total_centavos: number;
  tem_pendencia: boolean;
}

export interface AlteracaoPermitida {
  para: 'cancelada' | 'concluida';
  disponivel: boolean;
  motivo: string | null;
}

export class AdminService {
  private readonly db: DatabaseSync;
  private readonly relogio: () => Date;

  constructor(db: DatabaseSync, now?: () => Date) {
    this.db = db;
    this.relogio = now ?? (() => new Date());
  }

  /** Efetiva o vencimento e (se pedido) a conclusao pendentes de todo o sistema, em transacao propria, antes de ler. */
  private efetivarPendentes(concluir = true): void {
    const agora = this.relogio();
    withTransaction(this.db, () => {
      vencerSegundasParcelas(this.db, agora);
      if (concluir) concluirReservas(this.db, agora);
    });
  }

  private pendenciasDaReserva(reserva: Row, pagamentos: Row[]): TipoPendencia[] {
    const tipos: TipoPendencia[] = [];
    const inadimplente = t(reserva['situacao']) === 'cancelada' && reserva['motivo_cancelamento'] === 'inadimplencia';
    for (const p of pagamentos) {
      if (p['pendencia_administrativa'] === null || p['situacao'] !== 'confirmado') continue;
      tipos.push(p['parcela'] === 'segunda' && inadimplente ? 'segunda_parcela_apos_vencimento' : 'confirmado_sem_vaga');
    }
    return tipos;
  }

  /* ------------------------------------------------------------ reservas */

  listarReservas(consulta: Record<string, string | undefined>): { reservas: ReservaResumoAdmin[] } & Pagina {
    const erros: Record<string, string> = {};
    const pagina = inteiro(consulta['pagina'], 'pagina', 1, 1, 1_000_000, erros);
    const limite = inteiro(consulta['limite'], 'limite', LIMITE_PADRAO, 1, LIMITE_MAXIMO, erros);
    const filtros: string[] = [];
    const parametros: Array<string | number> = [];
    if (consulta['excursao_id'] !== undefined && consulta['excursao_id'] !== '') {
      const id = inteiro(consulta['excursao_id'], 'excursao_id', 0, 1, 999_999_999, erros);
      if (id > 0) {
        filtros.push('r.excursao_id = ?');
        parametros.push(id);
      }
    }
    const situacao = consulta['situacao'];
    if (situacao !== undefined && situacao !== '') {
      if ((SITUACOES as readonly string[]).includes(situacao)) {
        filtros.push('r.situacao = ?');
        parametros.push(situacao);
      } else erros['situacao'] = 'invalido';
    }
    const modalidade = consulta['modalidade'];
    if (modalidade !== undefined && modalidade !== '') {
      if ((MODALIDADES as readonly string[]).includes(modalidade)) {
        filtros.push('r.modalidade = ?');
        parametros.push(modalidade);
      } else erros['modalidade'] = 'invalido';
    }
    const busca = (consulta['q'] ?? '').trim();
    if (busca.length > 100) erros['q'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    if (busca !== '') {
      const digitos = busca.replace(/[^0-9]/g, '');
      const partes = ['instr(lower(u.nome_completo), lower(?)) > 0', 'instr(u.email, lower(?)) > 0'];
      parametros.push(busca, busca);
      if (digitos.length >= 3) {
        partes.push('instr(u.cpf, ?) > 0');
        parametros.push(digitos);
      }
      filtros.push(`(${partes.join(' OR ')})`);
    }
    this.efetivarPendentes();
    const onde = filtros.length === 0 ? '' : `WHERE ${filtros.join(' AND ')}`;
    const base = `FROM reserva r JOIN usuario u ON u.id = r.usuario_id JOIN excursao e ON e.id = r.excursao_id ${onde}`;
    const total = n(this.db.prepare(`SELECT COUNT(*) AS n ${base}`).get(...parametros)?.['n']);
    const linhas = this.db
      .prepare(
        `SELECT r.*, u.nome_completo AS u_nome, u.email AS u_email, e.nome AS e_nome, e.data_inicial AS e_inicial, e.data_final AS e_final, e.preco_centavos AS e_preco
         ${base} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      )
      .all(...parametros, limite, (pagina - 1) * limite);
    const reservas = linhas.map((l) => {
      const pagamentos = this.pagamentosDe(n(l['id']));
      return {
        id: n(l['id']),
        situacao: t(l['situacao']),
        modalidade: modalidadeDe(l['modalidade']),
        criada_em: t(l['criado_em']),
        motivo_cancelamento: l['motivo_cancelamento'] === 'inadimplencia' ? ('inadimplencia' as const) : null,
        passageiro: { id: n(l['usuario_id']), nome_completo: t(l['u_nome']), email: t(l['u_email']) },
        excursao: { id: n(l['excursao_id']), nome: t(l['e_nome']), data_inicial: t(l['e_inicial']), data_final: t(l['e_final']) },
        total_centavos: n(l['e_preco']),
        tem_pendencia: this.pendenciasDaReserva(l, pagamentos).length > 0,
      };
    });
    return { reservas, total, pagina, limite };
  }

  private pagamentosDe(reservaId: number): Row[] {
    return this.db
      .prepare('SELECT id, parcela, situacao, valor_centavos, confirmado_em, criado_em, atualizado_em, pendencia_administrativa FROM pagamento WHERE reserva_id = ? ORDER BY id')
      .all(reservaId);
  }

  /** Alteracoes manuais possiveis agora, com o motivo da indisponibilidade (decisao 2). */
  private alteracoesPermitidas(reserva: Row, pagamentos: Row[], excursao: Row): AlteracaoPermitida[] {
    const situacao = t(reserva['situacao']);
    const comPagamento = pagamentos.some((p) => p['situacao'] === 'pendente' || p['situacao'] === 'confirmado');
    const hoje = utcParaBrasilia(this.relogio()).data;
    let cancelar: AlteracaoPermitida;
    if (situacao === 'cancelada') cancelar = { para: 'cancelada', disponivel: false, motivo: 'ja_cancelada' };
    else if (situacao !== 'aguardando_pagamento') cancelar = { para: 'cancelada', disponivel: false, motivo: 'transicao_nao_autorizada' };
    else if (comPagamento) cancelar = { para: 'cancelada', disponivel: false, motivo: 'reserva_com_pagamento' };
    else cancelar = { para: 'cancelada', disponivel: true, motivo: null };
    let concluir: AlteracaoPermitida;
    if (situacao === 'concluida') concluir = { para: 'concluida', disponivel: false, motivo: 'ja_concluida' };
    else if (situacao !== 'pronto_para_embarque') concluir = { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' };
    else if (!(t(excursao['data_final']) < hoje)) concluir = { para: 'concluida', disponivel: false, motivo: 'excursao_nao_terminou' };
    else concluir = { para: 'concluida', disponivel: true, motivo: null };
    return [cancelar, concluir];
  }

  obterReserva(reservaId: number) {
    this.efetivarPendentes();
    const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ?').get(reservaId);
    if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
    const usuario = this.db.prepare('SELECT id, nome_completo, email FROM usuario WHERE id = ?').get(n(reserva['usuario_id']));
    const excursao = this.db.prepare('SELECT * FROM excursao WHERE id = ?').get(n(reserva['excursao_id']));
    if (usuario === undefined || excursao === undefined) throw new HttpError(404, 'nao_encontrada');
    const pagamentos = this.pagamentosDe(reservaId);
    const modalidade: Modalidade = reserva['modalidade'] === 'parcelada' ? 'parcelada' : 'integral';
    const prazo = excursao['prazo_segunda_parcela_utc'];
    const retencoes = this.db.prepare('SELECT id, situacao, criado_em, expira_em FROM retencao_vaga WHERE reserva_id = ? ORDER BY id').all(reservaId);
    const idsPagamento = pagamentos.map((p) => n(p['id']));
    const idsRetencao = retencoes.map((r) => n(r['id']));
    const lista = (ids: number[]) => (ids.length === 0 ? '(-1)' : `(${ids.join(',')})`);
    const eventos = this.db
      .prepare(
        `SELECT id, ator_usuario_id, acao, entidade, registro_id, estado_anterior, estado_novo, ocorrido_em FROM auditoria
         WHERE (entidade = 'reserva' AND registro_id = ?) OR (entidade = 'pagamento' AND registro_id IN ${lista(idsPagamento)})
            OR (entidade = 'retencao_vaga' AND registro_id IN ${lista(idsRetencao)}) ORDER BY id DESC`,
      )
      .all(reservaId);
    const lerJson = (valor: unknown): unknown => (valor === null ? null : JSON.parse(t(valor)));
    return {
      id: reservaId,
      situacao: t(reserva['situacao']),
      modalidade,
      criada_em: t(reserva['criado_em']),
      atualizada_em: t(reserva['atualizado_em']),
      motivo_cancelamento: reserva['motivo_cancelamento'] === 'inadimplencia' ? ('inadimplencia' as const) : null,
      passageiro: { id: n(usuario['id']), nome_completo: t(usuario['nome_completo']), email: t(usuario['email']) },
      excursao: {
        id: n(excursao['id']),
        nome: t(excursao['nome']),
        local: t(excursao['local']),
        situacao: t(excursao['situacao']),
        data_inicial: t(excursao['data_inicial']),
        data_final: t(excursao['data_final']),
      },
      valores: {
        total_centavos: n(excursao['preco_centavos']),
        parcelas: calcularParcelas(n(excursao['preco_centavos']), modalidade, modalidade === 'parcelada' && prazo !== null ? utcParaBrasilia(t(prazo)).data : null),
      },
      pagamentos: pagamentos.map((p) => ({
        id: n(p['id']),
        parcela: t(p['parcela']),
        situacao: t(p['situacao']),
        valor_centavos: n(p['valor_centavos']),
        confirmado_em: p['confirmado_em'] === null ? null : t(p['confirmado_em']),
        criado_em: t(p['criado_em']),
        pendencia: p['pendencia_administrativa'] === null ? null : ('confirmado_sem_vaga' as const),
      })),
      retencoes: retencoes.map((r) => ({ id: n(r['id']), situacao: t(r['situacao']), criada_em: t(r['criado_em']), expira_em: t(r['expira_em']) })),
      pendencias: this.pendenciasDaReserva(reserva, pagamentos),
      alteracoes_permitidas: this.alteracoesPermitidas(reserva, pagamentos, excursao),
      auditoria: eventos.map((e) => ({
        id: n(e['id']),
        ator_usuario_id: e['ator_usuario_id'] === null ? null : n(e['ator_usuario_id']),
        acao: t(e['acao']),
        entidade: t(e['entidade']),
        registro_id: e['registro_id'] === null ? null : n(e['registro_id']),
        estado_anterior: lerJson(e['estado_anterior']),
        estado_novo: lerJson(e['estado_novo']),
        ocorrido_em: t(e['ocorrido_em']),
      })),
    };
  }

  /**
   * Alteracao manual de situacao (RF-039, RN-035; decisao 2). Corpo: { situacao: 'cancelada' | 'concluida', justificativa }. So as
   * transicoes autorizadas; idempotente (repetir devolve a reserva sem novo efeito nem nova auditoria).
   */
  alterarSituacao(adminId: number, reservaId: number, entrada: unknown) {
    if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) throw new HttpError(400, 'validacao', { fields: { corpo: 'invalido' } });
    const corpo = entrada as Record<string, unknown>;
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) if (chave !== 'situacao' && chave !== 'justificativa') erros[chave] = 'campo_nao_permitido';
    const destino = corpo['situacao'];
    if (typeof destino !== 'string' || destino === '') erros['situacao'] = destino === undefined ? 'obrigatorio' : 'invalido';
    const justificativa = typeof corpo['justificativa'] === 'string' ? corpo['justificativa'].trim() : '';
    if (corpo['justificativa'] === undefined || justificativa === '') erros['justificativa'] = 'obrigatorio';
    else if (typeof corpo['justificativa'] !== 'string' || justificativa.length > JUSTIFICATIVA_MAX) erros['justificativa'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    if (destino !== 'cancelada' && destino !== 'concluida') throw new HttpError(409, 'transicao_nao_autorizada');

    if (this.db.prepare('SELECT 1 AS x FROM reserva WHERE id = ?').get(reservaId) === undefined) throw new HttpError(404, 'nao_encontrada');
    // Sem a conclusao automatica aqui: a alteracao manual pedida e que decide; so o vencimento da segunda parcela e efetivado antes.
    this.efetivarPendentes(false);
    const agora = this.relogio();
    withTransaction(this.db, () => {
      const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ?').get(reservaId);
      if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
      const situacao = t(reserva['situacao']);
      if (situacao === destino) return; // idempotente: ja esta no estado pedido
      const iso = agora.toISOString();
      if (destino === 'cancelada') {
        if (situacao !== 'aguardando_pagamento') throw new HttpError(409, 'transicao_nao_autorizada');
        if (this.db.prepare("SELECT 1 AS x FROM pagamento WHERE reserva_id = ? AND situacao IN ('pendente', 'confirmado') LIMIT 1").get(reservaId) !== undefined) {
          throw new HttpError(409, 'reserva_com_pagamento');
        }
        const ativa = this.db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
        if (ativa !== undefined) {
          this.db.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(n(ativa['id']));
          registrarAuditoria(this.db, {
            atorUsuarioId: adminId,
            acao: 'retencao.cancelada',
            entidade: 'retencao_vaga',
            registroId: n(ativa['id']),
            estadoAnterior: { situacao: 'ativa' },
            estadoNovo: { situacao: 'cancelada', reserva_id: reservaId },
            ocorridoEm: agora,
          });
        }
        this.db.prepare("UPDATE reserva SET situacao = 'cancelada', atualizado_em = ? WHERE id = ? AND situacao = 'aguardando_pagamento'").run(iso, reservaId);
        registrarAuditoria(this.db, {
          atorUsuarioId: adminId,
          acao: 'reserva.cancelamento_manual',
          entidade: 'reserva',
          registroId: reservaId,
          estadoAnterior: { situacao: 'aguardando_pagamento' },
          estadoNovo: { situacao: 'cancelada', justificativa },
          ocorridoEm: agora,
        });
        return;
      }
      // concluida: so a reserva Pronta para embarque cuja excursao terminou
      if (situacao !== 'pronto_para_embarque') throw new HttpError(409, 'transicao_nao_autorizada');
      const excursao = this.db.prepare('SELECT data_final FROM excursao WHERE id = ?').get(n(reserva['excursao_id']));
      if (excursao === undefined || !(t(excursao['data_final']) < utcParaBrasilia(agora).data)) throw new HttpError(409, 'excursao_nao_terminou');
      this.db.prepare("UPDATE reserva SET situacao = 'concluida', atualizado_em = ? WHERE id = ? AND situacao = 'pronto_para_embarque'").run(iso, reservaId);
      registrarAuditoria(this.db, {
        atorUsuarioId: adminId,
        acao: 'reserva.conclusao_manual',
        entidade: 'reserva',
        registroId: reservaId,
        estadoAnterior: { situacao: 'pronto_para_embarque' },
        estadoNovo: { situacao: 'concluida', justificativa },
        ocorridoEm: agora,
      });
    });
    return this.obterReserva(reservaId);
  }

  /* ---------------------------------------------------------- pendencias */

  /** Pagamentos confirmados que dependem da administracao (decisao 3): so listar e filtrar, sem acao. */
  listarPendencias(consulta: Record<string, string | undefined>) {
    const erros: Record<string, string> = {};
    const tipo = consulta['tipo'];
    if (tipo !== undefined && tipo !== '' && !(TIPOS_PENDENCIA as readonly string[]).includes(tipo)) erros['tipo'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    this.efetivarPendentes();
    const linhas = this.db
      .prepare(
        `SELECT p.id AS p_id, p.parcela, p.valor_centavos, p.confirmado_em, r.id AS r_id, r.situacao AS r_situacao, r.motivo_cancelamento,
                u.id AS u_id, u.nome_completo, e.id AS e_id, e.nome AS e_nome
         FROM pagamento p JOIN reserva r ON r.id = p.reserva_id JOIN usuario u ON u.id = r.usuario_id JOIN excursao e ON e.id = r.excursao_id
         WHERE p.situacao = 'confirmado' AND p.pendencia_administrativa IS NOT NULL ORDER BY p.id DESC`,
      )
      .all();
    const todas = linhas.map((l) => {
      const inadimplente = t(l['r_situacao']) === 'cancelada' && l['motivo_cancelamento'] === 'inadimplencia';
      const tipoLinha: TipoPendencia = l['parcela'] === 'segunda' && inadimplente ? 'segunda_parcela_apos_vencimento' : 'confirmado_sem_vaga';
      return {
        tipo: tipoLinha,
        pagamento: { id: n(l['p_id']), parcela: t(l['parcela']), situacao: 'confirmado', valor_centavos: n(l['valor_centavos']), confirmado_em: t(l['confirmado_em']) },
        reserva: { id: n(l['r_id']), situacao: t(l['r_situacao']) },
        passageiro: { id: n(l['u_id']), nome_completo: t(l['nome_completo']) },
        excursao: { id: n(l['e_id']), nome: t(l['e_nome']) },
      };
    });
    const pendencias = tipo === undefined || tipo === '' ? todas : todas.filter((p) => p.tipo === tipo);
    return { pendencias, total: pendencias.length };
  }

  /* ---------------------------------------------------------- passageiros */

  listarPassageiros(consulta: Record<string, string | undefined>): { passageiros: Array<Record<string, unknown>> } & Pagina {
    const erros: Record<string, string> = {};
    const pagina = inteiro(consulta['pagina'], 'pagina', 1, 1, 1_000_000, erros);
    const limite = inteiro(consulta['limite'], 'limite', LIMITE_PADRAO, 1, LIMITE_MAXIMO, erros);
    const busca = (consulta['q'] ?? '').trim();
    if (busca.length > 100) erros['q'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    const parametros: Array<string | number> = [];
    let onde = "WHERE u.perfil = 'passageiro'";
    if (busca !== '') {
      const digitos = busca.replace(/[^0-9]/g, '');
      const partes = ['instr(lower(u.nome_completo), lower(?)) > 0', 'instr(u.email, lower(?)) > 0'];
      parametros.push(busca, busca);
      if (digitos.length >= 3) {
        partes.push('instr(u.cpf, ?) > 0');
        parametros.push(digitos);
      }
      onde += ` AND (${partes.join(' OR ')})`;
    }
    const total = n(this.db.prepare(`SELECT COUNT(*) AS n FROM usuario u ${onde}`).get(...parametros)?.['n']);
    const linhas = this.db
      .prepare(
        `SELECT u.id, u.nome_completo, u.email, u.cpf, u.telefone, u.criado_em,
                (SELECT COUNT(*) FROM reserva r WHERE r.usuario_id = u.id) AS reservas
         FROM usuario u ${onde} ORDER BY u.nome_completo COLLATE NOCASE, u.id LIMIT ? OFFSET ?`,
      )
      .all(...parametros, limite, (pagina - 1) * limite);
    return {
      passageiros: linhas.map((l) => ({
        id: n(l['id']),
        nome_completo: t(l['nome_completo']),
        email: t(l['email']),
        cpf_mascarado: mascararCpf(t(l['cpf'])),
        telefone_mascarado: mascararTelefone(t(l['telefone'])),
        criado_em: t(l['criado_em']),
        total_reservas: n(l['reservas']),
      })),
      total,
      pagina,
      limite,
    };
  }

  /** Detalhe com os dados completos (decisao 1): cada consulta e auditada, sem gravar o dado consultado. */
  obterPassageiro(adminId: number, passageiroId: number) {
    this.efetivarPendentes();
    return withTransaction(this.db, () => {
      const u = this.db.prepare("SELECT id, nome_completo, email, cpf, telefone, data_nascimento, criado_em FROM usuario WHERE id = ? AND perfil = 'passageiro'").get(passageiroId);
      if (u === undefined) throw new HttpError(404, 'nao_encontrada');
      registrarAuditoria(this.db, {
        atorUsuarioId: adminId,
        acao: 'passageiro.consultado',
        entidade: 'usuario',
        registroId: passageiroId,
        estadoAnterior: null,
        estadoNovo: null,
        ocorridoEm: this.relogio(),
      });
      const reservas = this.db
        .prepare(
          `SELECT r.id, r.situacao, r.modalidade, r.criado_em, r.motivo_cancelamento, e.id AS e_id, e.nome AS e_nome, e.data_inicial, e.data_final, e.preco_centavos
           FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE r.usuario_id = ? ORDER BY r.id DESC`,
        )
        .all(passageiroId);
      return {
        id: n(u['id']),
        nome_completo: t(u['nome_completo']),
        email: t(u['email']),
        cpf: t(u['cpf']),
        telefone: t(u['telefone']),
        data_nascimento: t(u['data_nascimento']),
        criado_em: t(u['criado_em']),
        reservas: reservas.map((r) => ({
          id: n(r['id']),
          situacao: t(r['situacao']),
          modalidade: t(r['modalidade']),
          criada_em: t(r['criado_em']),
          motivo_cancelamento: r['motivo_cancelamento'] === 'inadimplencia' ? 'inadimplencia' : null,
          excursao: { id: n(r['e_id']), nome: t(r['e_nome']), data_inicial: t(r['data_inicial']), data_final: t(r['data_final']) },
          total_centavos: n(r['preco_centavos']),
        })),
      };
    });
  }
}
