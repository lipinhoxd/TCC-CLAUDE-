import { brasiliaParaUtc, dataValida, somarDias, utcParaBrasilia } from '../../shared/fuso.ts';

/** Regras de campo e de combinacao da excursao (RF-009 a RF-013, RN-012, RN-013, RN-038, RN-039). */

export const LIMITES = {
  capacidadeMin: 1,
  capacidadeMax: 1000,
  /** Em centavos: de R$ 0,01 a R$ 100.000,00. Preco zero e recusado porque pagamento exige valor positivo. */
  precoMin: 1,
  precoMax: 10_000_000,
  nomeMin: 3,
  nomeMax: 120,
  descricaoMax: 2000,
  textoMin: 3,
  textoMax: 200,
} as const;

/** Condicoes comerciais e temporais bloqueadas pela RN-036 quando ha reserva ou retencao ativa. */
export const CAMPOS_PROTEGIDOS = [
  'preco_centavos',
  'parcelamento_habilitado',
  'prazo_segunda_parcela',
  'capacidade',
  'data_inicial',
  'data_final',
  'partida_utc',
] as const;

/** Campos que continuam editaveis mesmo com reserva ou retencao ativa. */
export const CAMPOS_LIVRES = ['nome', 'descricao', 'imagem_ref', 'local', 'ponto_embarque'] as const;

export type CampoProtegido = (typeof CAMPOS_PROTEGIDOS)[number];
export type Campo = CampoProtegido | (typeof CAMPOS_LIVRES)[number];

/** Referencia de imagem (decisao 3): so caminho relativo a pasta de imagens do projeto, sem upload. */
export const IMAGEM_FORMATO = /^imagens\/[a-z0-9][a-z0-9._-]{0,80}\.(jpg|jpeg|png|webp)$/;

export interface DadosExcursao {
  nome: string;
  descricao: string;
  imagem_ref: string | null;
  local: string;
  ponto_embarque: string;
  data_inicial: string;
  data_final: string;
  /** Instante UTC em ISO 8601 terminado em Z. */
  partida_utc: string;
  capacidade: number;
  preco_centavos: number;
  parcelamento_habilitado: boolean;
  /** Data (AAAA-MM-DD, Brasilia) limite da segunda parcela; vale ate 23:59:59 desse dia. */
  prazo_segunda_parcela: string | null;
}

export type Erros = Record<string, string>;

// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f]/;

function texto(valor: unknown, min: number, max: number, multilinha = false): string | null {
  if (typeof valor !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  if (multilinha ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(valor) : CONTROLE.test(valor)) return null;
  const limpo = multilinha ? valor.trim() : valor.trim().replace(/\s+/g, ' ');
  return limpo.length >= min && limpo.length <= max ? limpo : null;
}

function vazio(valor: unknown): boolean {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

/** Normaliza um instante UTC recebido (ISO com Z); retorna null se invalido. */
export function lerInstanteUtc(valor: unknown): string | null {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(valor)) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/** Valida cada campo informado, isoladamente. Campos ausentes nao geram erro aqui. */
export function lerCampos(corpo: Record<string, unknown>, campos: readonly Campo[]): { valores: Partial<DadosExcursao>; erros: Erros } {
  const valores: Record<string, unknown> = {};
  const erros: Erros = {};
  const falha = (campo: string, valor: unknown, codigo = 'invalido') => {
    erros[campo] = vazio(valor) ? 'obrigatorio' : codigo;
  };
  for (const campo of campos) {
    if (!(campo in corpo)) continue;
    const bruto = corpo[campo];
    switch (campo) {
      case 'nome': {
        const v = texto(bruto, LIMITES.nomeMin, LIMITES.nomeMax);
        if (v === null) falha(campo, bruto);
        else valores[campo] = v;
        break;
      }
      case 'descricao': {
        if (vazio(bruto)) {
          valores[campo] = '';
        } else {
          const v = texto(bruto, 0, LIMITES.descricaoMax, true);
          if (v === null) erros[campo] = 'invalido';
          else valores[campo] = v;
        }
        break;
      }
      case 'imagem_ref': {
        if (vazio(bruto)) {
          valores[campo] = null;
        } else if (typeof bruto === 'string' && IMAGEM_FORMATO.test(bruto.trim())) {
          valores[campo] = bruto.trim();
        } else {
          erros[campo] = 'invalido';
        }
        break;
      }
      case 'local':
      case 'ponto_embarque': {
        const v = texto(bruto, LIMITES.textoMin, LIMITES.textoMax);
        if (v === null) falha(campo, bruto);
        else valores[campo] = v;
        break;
      }
      case 'data_inicial':
      case 'data_final': {
        if (dataValida(bruto)) valores[campo] = bruto;
        else falha(campo, bruto);
        break;
      }
      case 'partida_utc': {
        const v = lerInstanteUtc(bruto);
        if (v === null) falha(campo, bruto);
        else valores[campo] = v;
        break;
      }
      case 'capacidade': {
        if (typeof bruto !== 'number' || !Number.isInteger(bruto)) falha(campo, bruto);
        else if (bruto < LIMITES.capacidadeMin || bruto > LIMITES.capacidadeMax) erros[campo] = 'fora_do_limite';
        else valores[campo] = bruto;
        break;
      }
      case 'preco_centavos': {
        if (typeof bruto !== 'number' || !Number.isSafeInteger(bruto)) falha(campo, bruto);
        else if (bruto < LIMITES.precoMin || bruto > LIMITES.precoMax) erros[campo] = 'fora_do_limite';
        else valores[campo] = bruto;
        break;
      }
      case 'parcelamento_habilitado': {
        if (typeof bruto === 'boolean') valores[campo] = bruto;
        else falha(campo, bruto);
        break;
      }
      case 'prazo_segunda_parcela': {
        if (vazio(bruto)) valores[campo] = null;
        else if (dataValida(bruto)) valores[campo] = bruto;
        else erros[campo] = 'invalido';
        break;
      }
    }
  }
  return { valores, erros };
}

/** Instante UTC do fim do prazo da segunda parcela: 23:59:59 de Brasilia da data configurada (RN-013). */
export function instantePrazo(data: string): string {
  const instante = brasiliaParaUtc(data, '23:59:59');
  if (instante === null) throw new Error('data de prazo invalida');
  return instante.toISOString();
}

/** Regras que dependem de mais de um campo. `alterados` limita a regra "nao no passado" ao que mudou. */
export function validarCombinacao(dados: DadosExcursao, alterados: ReadonlySet<string>, agora: Date): Erros {
  const erros: Erros = {};
  if (dados.data_final < dados.data_inicial) {
    erros['data_final'] = 'anterior_a_data_inicial';
  }
  if (alterados.has('data_inicial') && dados.data_inicial < utcParaBrasilia(agora).data) {
    erros['data_inicial'] = 'no_passado';
  }
  const partida = utcParaBrasilia(dados.partida_utc).data;
  if (partida > dados.data_inicial || partida < somarDias(dados.data_inicial, -1)) {
    erros['partida_utc'] = 'fora_da_data_inicial';
  }
  if (dados.parcelamento_habilitado) {
    if (dados.prazo_segunda_parcela === null) {
      erros['prazo_segunda_parcela'] = 'obrigatorio';
    } else if (dados.prazo_segunda_parcela >= partida) {
      erros['prazo_segunda_parcela'] = 'nao_anterior_a_partida';
    }
  }
  return erros;
}

/** Exigencias da publicacao: partida no futuro e, com parcelamento, prazo da segunda parcela ainda por vir. */
export function validarPublicacao(dados: DadosExcursao, agora: Date): Erros {
  const erros: Erros = {};
  if (new Date(dados.partida_utc).getTime() <= agora.getTime()) {
    erros['partida_utc'] = 'no_passado';
  }
  if (
    dados.parcelamento_habilitado &&
    dados.prazo_segunda_parcela !== null &&
    new Date(instantePrazo(dados.prazo_segunda_parcela)).getTime() <= agora.getTime()
  ) {
    erros['prazo_segunda_parcela'] = 'no_passado';
  }
  return erros;
}
