/**
 * Meio de pagamento (AGT-009, decisao 1 do pesquisador): nesta fase o projeto so tem um provedor simulado interno, sem
 * dado real de pagamento (CLAUDE.md, regra 7). A interface existe para que um provedor real possa substitui-lo depois,
 * sem mexer no registro e na confirmacao (server/pagamentos/confirmacao.ts). Em producao nao ha provedor: o pagamento
 * responde 503 e as rotas de simulacao nao existem.
 */
export interface ProvedorPagamento {
  readonly nome: string;
  /** Verdadeiro so para o provedor simulado, que libera as rotas de aprovar e recusar. */
  readonly simulado: boolean;
}

export const provedorSimulado: ProvedorPagamento = { nome: 'simulado', simulado: true };

/**
 * Provedor do ambiente: o simulado fora de producao (desligavel com PAGAMENTO_SIMULADO=false) e nenhum em producao,
 * mesmo que a variavel peca o contrario.
 */
export function provedorDoAmbiente(env: NodeJS.ProcessEnv = process.env): ProvedorPagamento | undefined {
  if (env['NODE_ENV'] === 'production') return undefined;
  const pedido = env['PAGAMENTO_SIMULADO']?.trim().toLowerCase();
  if (pedido === 'false') return undefined;
  return provedorSimulado;
}
