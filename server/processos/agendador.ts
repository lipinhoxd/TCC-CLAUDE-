import type { DatabaseSync } from 'node:sqlite';
import { descreverErro, executarRotina, houveNovidade, linhasDoResultado } from './rotina.ts';
import type { ResultadoRotina } from './rotina.ts';

/**
 * Temporizador da rotina dentro do processo da API (AGT-014, decisao 1A): executa na inicializacao e a cada intervalo. A execucao e
 * sincrona (node:sqlite), entao uma nunca se sobrepoe a outra no mesmo processo. A primeira execucao sempre e escrita no console; as
 * seguintes, so quando alteram algo ou falham.
 */
export interface OpcoesAgendador {
  db: DatabaseSync;
  /** Intervalo em milissegundos; 0 desliga a rotina neste processo. */
  intervaloMs: number;
  relogio?: () => Date;
  registrar?: (linha: string) => void;
  executar?: (db: DatabaseSync, agora: Date) => ResultadoRotina;
}

export interface Agendador {
  /** Para o temporizador; chamar antes de fechar o banco. Pode ser chamado mais de uma vez. */
  parar: () => void;
}

export function iniciarAgendador(opcoes: OpcoesAgendador): Agendador {
  const registrar = opcoes.registrar ?? ((linha: string) => console.log(linha));
  const relogio = opcoes.relogio ?? (() => new Date());
  const executar = opcoes.executar ?? executarRotina;
  if (opcoes.intervaloMs <= 0) {
    registrar('Rotina automática desligada (ROTINA_INTERVALO_SEGUNDOS=0).');
    return { parar: () => undefined };
  }

  let primeira = true;
  const rodar = (): void => {
    try {
      const resultado = executar(opcoes.db, relogio());
      if (primeira || houveNovidade(resultado)) for (const linha of linhasDoResultado(resultado)) registrar(linha);
      primeira = false;
    } catch (erro) {
      // Defesa: uma falha inesperada nunca derruba a API.
      registrar(`Rotina automática: falha inesperada (${descreverErro(erro)}); será tentada de novo.`);
    }
  };

  rodar();
  const temporizador = setInterval(rodar, opcoes.intervaloMs);
  return { parar: () => clearInterval(temporizador) };
}
