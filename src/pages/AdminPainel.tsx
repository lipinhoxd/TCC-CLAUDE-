import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { ROTULO_SITUACAO as ROTULO_SITUACAO_EXCURSAO } from '../admin/excursoes-api.ts';
import { ROTULO_ACAO_AUDITORIA, ROTULO_SITUACAO, adminReservasApi } from '../admin/reservas-admin-api.ts';
import type { EventoDoHistorico, Painel } from '../admin/reservas-admin-api.ts';
import { dataBr } from '../formato.ts';
import { Link } from '../router.tsx';
import { useSession } from '../session.tsx';
import { Notice, usePageTitle } from '../ui.tsx';
import { Paginacao, Restrito, SoAdministrador, SubMenu, useCarga } from './AdminReservas.tsx';

/** Painel consolidado e historico administrativo (AGT-016, RF-041, RF-042). O servidor calcula e decide o acesso; aqui so se mostra. */

const instanteBr = (iso: string): string => {
  const { data, hora } = utcParaBrasilia(iso);
  return `${dataBr(data)} ${hora.slice(0, 5)}`;
};

/* ------------------------------------------------------------------ painel */

const LINHAS_DE_VALOR: Array<{ campo: keyof Painel['valores']; rotulo: string; definicao: string }> = [
  { campo: 'recebido_centavos', rotulo: 'Recebido', definicao: 'Todos os pagamentos confirmados, inclusive os depois estornados.' },
  { campo: 'devolvido_centavos', rotulo: 'Devolvido', definicao: 'Reembolsos processados.' },
  { campo: 'liquido_centavos', rotulo: 'Líquido', definicao: 'Recebido menos devolvido. Inclui valores que ainda aguardam análise.' },
  { campo: 'a_devolver_centavos', rotulo: 'A devolver', definicao: 'Reembolsos pendentes ou recusados.' },
  { campo: 'a_receber_centavos', rotulo: 'A receber', definicao: 'Segundas parcelas em aberto, dentro do prazo.' },
];

export function AdminPainel() {
  usePageTitle('Painel administrativo');
  return (
    <SoAdministrador>
      <PainelConsolidado />
    </SoAdministrador>
  );
}

function PainelConsolidado() {
  const { status, user } = useSession();
  const [versao, setVersao] = useState(0);
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const carga = useCarga(() => adminReservasApi.painel(), [versao], ativo);
  if (carga.negado) return <Restrito visitante={false} />;
  const p = carga.dados?.painel;

  return (
    <>
      <h1>Painel</h1>
      <SubMenu />
      <p className="actions">
        <button type="button" className="btn btn-secondary" disabled={carga.carregando} onClick={() => setVersao((v) => v + 1)}>
          {carga.carregando ? 'Atualizando…' : 'Atualizar'}
        </button>
        {p ? <span className="hint">Dados de {instanteBr(p.gerado_em)} (horário de Brasília).</span> : null}
      </p>
      {carga.falha !== null ? <Notice kind="error">{carga.falha}</Notice> : null}
      {!p ? (
        carga.falha === null ? <p aria-busy="true">Carregando o painel…</p> : null
      ) : (
        <>
          <h2>Valores</h2>
          <p className="hint">Totais de todo o histórico. Os pagamentos são simulados: nenhum dinheiro é movimentado.</p>
          <dl className="detalhes">
            {LINHAS_DE_VALOR.map((l) => (
              <div key={l.campo} className="linha-de-valor">
                <dt>{l.rotulo}</dt>
                <dd>
                  <strong>{formatarReais(p.valores[l.campo])}</strong> <span className="hint">{l.definicao}</span>
                </dd>
              </div>
            ))}
          </dl>

          <h2>Reservas por situação</h2>
          <dl className="detalhes">
            {(Object.keys(ROTULO_SITUACAO) as Array<keyof typeof ROTULO_SITUACAO>).map((s) => (
              <div key={s} className="linha-de-valor">
                <dt>{ROTULO_SITUACAO[s]}</dt>
                <dd>{p.reservas[s]}</dd>
              </div>
            ))}
            <div className="linha-de-valor">
              <dt>Total</dt>
              <dd>{p.reservas.total}</dd>
            </div>
          </dl>
          <p>
            <Link to="/admin/reservas">Ver as reservas</Link>
          </p>

          <h2>Pontos de atenção</h2>
          <dl className="detalhes">
            <div className="linha-de-valor">
              <dt>Pendências administrativas</dt>
              <dd>
                {p.pendencias} <Link to="/admin/pendencias">Ver pendências</Link>
              </dd>
            </div>
            <div className="linha-de-valor">
              <dt>E-mails que falharam</dt>
              <dd>
                {p.emails_com_falha} <span className="hint">Somente a quantidade; as mensagens são do passageiro.</span>
              </dd>
            </div>
          </dl>

          <h2>Excursões a realizar</h2>
          {p.excursoes.itens.length === 0 ? (
            <p>Nenhuma excursão publicada ou encerrada por terminar.</p>
          ) : (
            <>
              {p.excursoes.total > p.excursoes.itens.length ? (
                <p className="hint">
                  Mostrando as {p.excursoes.itens.length} mais próximas de {p.excursoes.total}.
                </p>
              ) : null}
              <div className="table-wrap">
                <table className="table">
                  <caption className="sr-only">Ocupação das excursões a realizar</caption>
                  <thead>
                    <tr>
                      <th scope="col">Excursão</th>
                      <th scope="col">Datas</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Capacidade</th>
                      <th scope="col">Ocupadas</th>
                      <th scope="col">Retidas</th>
                      <th scope="col">Livres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.excursoes.itens.map((e) => (
                      <tr key={e.id}>
                        <th scope="row">
                          <Link to={`/admin/excursoes/${e.id}`}>{e.nome}</Link>
                        </th>
                        <td>
                          {dataBr(e.data_inicial)} a {dataBr(e.data_final)}
                        </td>
                        <td>{ROTULO_SITUACAO_EXCURSAO[e.situacao]}</td>
                        <td>{e.capacidade}</td>
                        <td>{e.ocupadas}</td>
                        <td>{e.retidas}</td>
                        <td>{e.livres === 0 ? '0 (esgotada)' : e.livres}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ historico */

const ENTIDADES: Record<string, string> = {
  excursao: 'Excursão',
  reserva: 'Reserva',
  pagamento: 'Pagamento',
  reembolso: 'Reembolso',
  retencao_vaga: 'Retenção',
  usuario: 'Usuário',
  mensagem: 'Mensagem',
};

const ESTADOS: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pronto_para_embarque: 'Pronto para embarque',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  encerrada: 'Encerrada',
  ativa: 'Ativa',
  expirada: 'Expirada',
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  falhou: 'Falhou',
  estornado: 'Estornado',
  processado: 'Processado',
  recusado: 'Recusado',
};
const estado = (v: string): string => ESTADOS[v] ?? v;

const VAZIO = { origem: '', acao: '', entidade: '', registro: '', de: '', ate: '' };

const ERRO_DE_FILTRO: Record<string, string> = {
  entidade: 'Para filtrar pelo número, escolha também o tipo de registro.',
  registro: 'O número do registro deve ser um inteiro maior que zero.',
  de: 'Data inicial inválida.',
  ate: 'A data final é inválida ou anterior à inicial.',
};

function Registro({ e }: { e: EventoDoHistorico }) {
  const nome = `${ENTIDADES[e.entidade] ?? e.entidade}${e.registro_id === null ? '' : ` nº ${e.registro_id}`}`;
  if (e.registro_id !== null && e.entidade === 'excursao') return <Link to={`/admin/excursoes/${e.registro_id}`}>{nome}</Link>;
  // Abrir o passageiro e uma consulta auditada (AGT-012), por isso o link so existe no proprio evento de consulta.
  if (e.registro_id !== null && e.acao === 'passageiro.consultado') return <Link to={`/admin/passageiros/${e.registro_id}`}>Passageiro nº {e.registro_id}</Link>;
  if (e.entidade === 'reserva' && e.registro_id !== null) return <Link to={`/admin/reservas/${e.registro_id}`}>{nome}</Link>;
  return (
    <>
      {nome}
      {e.reserva_id === null ? null : (
        <>
          {' · '}
          <Link to={`/admin/reservas/${e.reserva_id}`}>Reserva nº {e.reserva_id}</Link>
        </>
      )}
    </>
  );
}

function detalhes(e: EventoDoHistorico): string[] {
  const linhas: string[] = [];
  if (e.valor_centavos !== null) linhas.push(`Valor: ${formatarReais(e.valor_centavos)}`);
  if (e.valor_reembolso_centavos !== null) linhas.push(`Reembolso: ${formatarReais(e.valor_reembolso_centavos)}${e.percentual === null ? '' : ` (${e.percentual}%)`}`);
  else if (e.percentual !== null) linhas.push(`Percentual: ${e.percentual}%`);
  if (e.valor_total_centavos !== null) linhas.push(`Total a reembolsar: ${formatarReais(e.valor_total_centavos)}`);
  if (e.justificativa !== null) linhas.push(`Justificativa: ${e.justificativa}`);
  return linhas;
}

export function AdminHistorico() {
  usePageTitle('Histórico administrativo');
  return (
    <SoAdministrador>
      <Historico />
    </SoAdministrador>
  );
}

function Historico() {
  const { status, user } = useSession();
  const [campos, setCampos] = useState(VAZIO);
  const [aplicados, setAplicados] = useState<{ filtros: typeof VAZIO; pagina: number; versao: number }>({ filtros: VAZIO, pagina: 1, versao: 0 });
  const [erros, setErros] = useState<string[]>([]);
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const carga = useCarga(
    async () => {
      const r = await adminReservasApi.historico({ ...aplicados.filtros, pagina: aplicados.pagina });
      setErros(!r.ok && r.motivo === 'recusa' ? Object.keys(r.campos).map((c) => ERRO_DE_FILTRO[c] ?? 'Confira os filtros.') : []);
      return r;
    },
    [aplicados],
    ativo,
  );
  if (carga.negado) return <Restrito visitante={false} />;
  const dados = carga.dados;

  const filtrar = (evento: FormEvent) => {
    evento.preventDefault();
    setAplicados((a) => ({ filtros: campos, pagina: 1, versao: a.versao + 1 }));
  };
  const limpar = () => {
    setCampos(VAZIO);
    setAplicados((a) => ({ filtros: VAZIO, pagina: 1, versao: a.versao + 1 }));
  };
  const mudar = (campo: keyof typeof VAZIO) => (e: { target: { value: string } }) => setCampos((c) => ({ ...c, [campo]: e.target.value }));

  return (
    <>
      <h1>Histórico</h1>
      <SubMenu />
      <p className="hint">Operações feitas por administradores e pelo sistema. Entradas, saídas e ações dos passageiros não aparecem aqui.</p>
      <form onSubmit={filtrar} className="filtros" noValidate>
        <div className="field">
          <label htmlFor="h-origem">Origem</label>
          <select id="h-origem" value={campos.origem} onChange={mudar('origem')}>
            <option value="">Todas</option>
            <option value="administrador">Administrador</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="h-acao">Ação</label>
          <select id="h-acao" value={campos.acao} onChange={mudar('acao')}>
            <option value="">Todas</option>
            {(dados?.acoes ?? []).map((a) => (
              <option key={a} value={a}>
                {ROTULO_ACAO_AUDITORIA[a] ?? a}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="h-entidade">Tipo de registro</label>
          <select id="h-entidade" value={campos.entidade} onChange={mudar('entidade')}>
            <option value="">Todos</option>
            {Object.entries(ENTIDADES).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="h-registro">Número do registro</label>
          <input id="h-registro" inputMode="numeric" value={campos.registro} onChange={mudar('registro')} />
        </div>
        <div className="field">
          <label htmlFor="h-de">De</label>
          <input id="h-de" type="date" value={campos.de} onChange={mudar('de')} />
        </div>
        <div className="field">
          <label htmlFor="h-ate">Até</label>
          <input id="h-ate" type="date" value={campos.ate} onChange={mudar('ate')} />
        </div>
        <p className="actions">
          <button type="submit" className="btn btn-primary" disabled={carga.carregando}>
            Filtrar
          </button>
          <button type="button" className="btn btn-secondary" onClick={limpar}>
            Limpar filtros
          </button>
        </p>
      </form>
      {erros.length > 0 ? <Notice kind="error">{[...new Set(erros)].join(' ')}</Notice> : carga.falha !== null ? <Notice kind="error">{carga.falha}</Notice> : null}
      {carga.carregando ? <p aria-busy="true">Carregando o histórico…</p> : null}
      {!carga.carregando && carga.falha === null && dados ? (
        dados.eventos.length === 0 ? (
          <p>Nenhum evento encontrado.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Histórico de operações</caption>
                <thead>
                  <tr>
                    <th scope="col">Quando</th>
                    <th scope="col">Ação</th>
                    <th scope="col">Autor</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.eventos.map((e) => (
                    <tr key={e.id}>
                      <td>{instanteBr(e.ocorrido_em)}</td>
                      <th scope="row">{ROTULO_ACAO_AUDITORIA[e.acao] ?? e.acao}</th>
                      <td>{e.ator_usuario_id === null ? 'Sistema' : `Administrador nº ${e.ator_usuario_id}`}</td>
                      <td>
                        <Registro e={e} />
                      </td>
                      <td>
                        {e.situacao_nova === null ? '—' : e.situacao_anterior === null ? estado(e.situacao_nova) : `${estado(e.situacao_anterior)} → ${estado(e.situacao_nova)}`}
                      </td>
                      <td className="texto-longo">
                        {detalhes(e).length === 0 ? '—' : detalhes(e).map((linha) => <div key={linha}>{linha}</div>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao pagina={dados.pagina} limite={dados.limite} total={dados.total} aoMudar={(pagina) => setAplicados((a) => ({ ...a, pagina }))} />
          </>
        )
      ) : null}
    </>
  );
}
