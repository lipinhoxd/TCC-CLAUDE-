import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Meio de envio do e-mail (AGT-015, decisao 1A do pesquisador): nesta fase so existe o provedor simulado, que grava a mensagem em um
 * arquivo local nao versionado. Nada e enviado e nao ha conexao externa. Em producao nao ha provedor: o aviso aparece na plataforma e o
 * e-mail fica pendente. A interface e sincrona, como o restante da rotina; um provedor real, assincrono, exigira adapta-la.
 */
export interface EmailASair {
  mensagemId: number;
  para: string;
  assunto: string;
  corpo: string;
}

export interface ProvedorEmail {
  readonly nome: string;
  /** Lanca quando a entrega falha. */
  enviar: (email: EmailASair, agora: Date) => void;
}

export const OUTBOX_PADRAO = 'data/outbox/comunicacao.jsonl';

export function provedorEmailEmArquivo(caminho: string): ProvedorEmail {
  return {
    nome: 'simulado',
    enviar: (email, agora) => {
      mkdirSync(dirname(caminho), { recursive: true });
      const linha = { mensagem_id: email.mensagemId, para: email.para, assunto: email.assunto, corpo: email.corpo, enviado_em: agora.toISOString() };
      appendFileSync(caminho, `${JSON.stringify(linha)}\n`, { encoding: 'utf8', mode: 0o600 });
    },
  };
}

export class ComunicacaoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComunicacaoConfigError';
  }
}

/**
 * Provedor do ambiente: o simulado fora de producao (desligavel com EMAIL_SIMULADO=false; arquivo em COMUNICACAO_OUTBOX_PATH) e nenhum
 * em producao, mesmo que a variavel peca o contrario.
 */
export function emailDoAmbiente(env: NodeJS.ProcessEnv = process.env): ProvedorEmail | undefined {
  const pedido = env['EMAIL_SIMULADO']?.trim().toLowerCase();
  if (pedido !== undefined && pedido !== '' && pedido !== 'true' && pedido !== 'false') {
    throw new ComunicacaoConfigError(`EMAIL_SIMULADO invalida: "${pedido}". Use true ou false.`);
  }
  if (env['NODE_ENV'] === 'production' || pedido === 'false') return undefined;
  return provedorEmailEmArquivo(env['COMUNICACAO_OUTBOX_PATH']?.trim() || OUTBOX_PADRAO);
}
