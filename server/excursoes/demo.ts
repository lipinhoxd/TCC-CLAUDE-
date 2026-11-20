import type { DatabaseSync } from 'node:sqlite';
import { brasiliaParaUtc, somarDias, utcParaBrasilia } from '../../shared/fuso.ts';
import { ExcursaoService } from './service.ts';

/**
 * Dados de demonstracao (AGT-006, decisao 3): excursoes ficticias criadas pelo servico existente, para
 * ver a consulta publica funcionando. So para desenvolvimento; nunca contem dado real.
 */

export const PREFIXO_DEMO = '[Demonstração] ';

export class DemoError extends Error {
  code: 'sem_administrador';
  constructor(code: 'sem_administrador', message: string) {
    super(message);
    this.name = 'DemoError';
    this.code = code;
  }
}

interface ModeloDemo {
  nome: string;
  descricao: string;
  imagem: string | null;
  local: string;
  embarque: string;
  diasAteInicio: number;
  duracaoDias: number;
  capacidade: number;
  precoCentavos: number;
  parcelamento: boolean;
  ocupadas: number;
  situacao: 'rascunho' | 'publicada' | 'encerrada';
}

const MODELOS: ModeloDemo[] = [
  { nome: 'Serra Ficticia', descricao: 'Passeio ficticio com trilhas leves e vista panoramica. Texto de demonstracao.', imagem: 'imagens/demo-serra.jpg', local: 'Serra Ficticia', embarque: 'Praca Ficticia, portao 1', diasAteInicio: 20, duracaoDias: 3, capacidade: 30, precoCentavos: 189000, parcelamento: true, ocupadas: 11, situacao: 'publicada' },
  { nome: 'Praia Ficticia', descricao: 'Fim de semana ficticio na praia, sem imagem cadastrada. Texto de demonstracao.', imagem: null, local: 'Praia Ficticia', embarque: 'Terminal Ficticio', diasAteInicio: 35, duracaoDias: 5, capacidade: 40, precoCentavos: 320000, parcelamento: false, ocupadas: 0, situacao: 'publicada' },
  { nome: 'Cidade Historica Ficticia', descricao: 'Bate-volta ficticio, com todas as vagas ocupadas. Texto de demonstracao.', imagem: null, local: 'Cidade Historica Ficticia', embarque: 'Rodoviaria Ficticia', diasAteInicio: 17, duracaoDias: 1, capacidade: 25, precoCentavos: 15000, parcelamento: false, ocupadas: 25, situacao: 'publicada' },
  { nome: 'Cachoeira Ficticia', descricao: 'Passeio ficticio com poucas vagas e imagem que ainda nao existe no projeto. Texto de demonstracao.', imagem: 'imagens/demo-cachoeira.png', local: 'Cachoeira Ficticia', embarque: 'Praca Ficticia, portao 2', diasAteInicio: 28, duracaoDias: 2, capacidade: 20, precoCentavos: 89990, parcelamento: true, ocupadas: 18, situacao: 'publicada' },
  { nome: 'Em Preparacao Ficticia', descricao: 'Rascunho: nao aparece na consulta publica.', imagem: null, local: 'Local Ficticio', embarque: 'Ponto Ficticio', diasAteInicio: 45, duracaoDias: 2, capacidade: 15, precoCentavos: 50000, parcelamento: false, ocupadas: 0, situacao: 'rascunho' },
  { nome: 'Vendas Fechadas Ficticia', descricao: 'Encerrada: nao aparece na consulta publica.', imagem: null, local: 'Local Ficticio', embarque: 'Ponto Ficticio', diasAteInicio: 25, duracaoDias: 2, capacidade: 15, precoCentavos: 50000, parcelamento: false, ocupadas: 15, situacao: 'encerrada' },
];

/** Cria as excursoes de demonstracao se ainda nao existirem. Devolve quantas criou. */
export function semearDemonstracao(db: DatabaseSync, agora: Date = new Date()): { criadas: number; jaExistia: boolean } {
  const admin = db.prepare("SELECT id FROM usuario WHERE perfil = 'administrador' ORDER BY id LIMIT 1").get();
  if (admin === undefined) {
    throw new DemoError('sem_administrador', 'Crie o administrador antes (npm run admin:create).');
  }
  const existente = db.prepare('SELECT 1 AS x FROM excursao WHERE nome LIKE ? LIMIT 1').get(`${PREFIXO_DEMO}%`);
  if (existente !== undefined) {
    return { criadas: 0, jaExistia: true };
  }
  const servico = new ExcursaoService(db, () => agora);
  const hoje = utcParaBrasilia(agora).data;
  for (const modelo of MODELOS) {
    const inicio = somarDias(hoje, modelo.diasAteInicio);
    const partida = brasiliaParaUtc(inicio, '07:00');
    if (partida === null) throw new Error('data de demonstracao invalida');
    const criada = servico.criar(Number(admin['id']), {
      nome: `${PREFIXO_DEMO}${modelo.nome}`,
      descricao: modelo.descricao,
      ...(modelo.imagem === null ? {} : { imagem_ref: modelo.imagem }),
      local: modelo.local,
      ponto_embarque: modelo.embarque,
      data_inicial: inicio,
      data_final: somarDias(inicio, modelo.duracaoDias - 1),
      partida_utc: partida.toISOString(),
      capacidade: modelo.capacidade,
      preco_centavos: modelo.precoCentavos,
      parcelamento_habilitado: modelo.parcelamento,
      ...(modelo.parcelamento ? { prazo_segunda_parcela: somarDias(inicio, -5) } : {}),
    });
    if (modelo.situacao !== 'rascunho') {
      servico.mudarSituacao(Number(admin['id']), criada.id, { situacao: 'publicada' });
    }
    if (modelo.situacao === 'encerrada') {
      servico.mudarSituacao(Number(admin['id']), criada.id, { situacao: 'encerrada' });
    }
    // Ocupacao fixada direto no banco, so para a demonstracao (nao existe fluxo de reserva ainda); a restricao do banco vale.
    if (modelo.ocupadas > 0) {
      db.prepare('UPDATE excursao SET vagas_ocupadas = ? WHERE id = ?').run(modelo.ocupadas, criada.id);
    }
  }
  return { criadas: MODELOS.length, jaExistia: false };
}
