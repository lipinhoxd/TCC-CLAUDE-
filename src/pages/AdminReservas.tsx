import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import type { PassageiroDetalhe, PassageiroResumo, Pendencia, ReservaDetalhe, ReservaResumo, Resultado } from '../admin/reservas-admin-api.ts';
import {
  MENSAGEM_ADMIN,
  ROTULO_ACAO_AUDITORIA,
  ROTULO_MODALIDADE,
  ROTULO_PAGAMENTO,
  ROTULO_PARCELA,
  ROTULO_SITUACAO,
  ROTULO_SITUACAO_REEMBOLSO,
  ROTULO_TIPO_PENDENCIA,
  adminReservasApi,
} from '../admin/reservas-admin-api.ts';
import type { ResumoExcursao } from '../admin/excursoes-api.ts';
import { excursoesApi } from '../admin/excursoes-api.ts';
import { dataBr } from '../formato.ts';
import { Link } from '../router.tsx';
import { useSession } from '../session.tsx';
import { Notice, usePageTitle } from '../ui.tsx';

/**
 * Administracao de reservas e passageiros (AGT-012). O servidor decide o acesso e as regras; aqui so se mostra. Dados pessoais:
 * a lista de passageiros traz CPF e telefone mascarados; o detalhe os traz completos e a consulta e auditada no servidor.
 */

const instanteBr = (iso: string): string => {
  const { data, hora } = utcParaBrasilia(iso);
  return `${dataBr(data)} ${hora.slice(0, 5)}`;
};

export function Restrito({ visitante }: { visitante: boolean }) {
  return (
    <>
      <h1>Área administrativa</h1>
      {visitante ? (
        <Notice kind="info">
          Acesso restrito. Entre como administrador para continuar. <Link to="/login">Ir para o login</Link>
        </Notice>
      ) : (
        <Notice kind="error">Acesso restrito a administradores.</Notice>
      )}
    </>
  );
}

/** Mostra o conteudo so para o administrador; visitante e passageiro veem aviso de acesso restrito, sem consultar a API. */
export function SoAdministrador({ children, negado }: { children: ReactNode; negado?: boolean }) {
  const { status, user } = useSession();
  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante />;
  if (user.perfil !== 'administrador' || negado === true) return <Restrito visitante={false} />;
  return <>{children}</>;
}

export function SubMenu() {
  return (
    <nav aria-label="Administração" className="actions">
      <Link to="/admin/excursoes">Excursões</Link>
      <Link to="/admin/reservas">Reservas</Link>
      <Link to="/admin/passageiros">Passageiros</Link>
      <Link to="/admin/pendencias">Pendências</Link>
      <Link to="/admin/reembolsos">Reembolsos</Link>
    </nav>
  );
}

export function mensagemDeFalha(r: Extract<Resultado<unknown>, { ok: false }>): string {
  if (r.motivo === 'rede') return 'Sem conexão com o servidor. Tente novamente.';
  if (r.motivo === 'recusa') return MENSAGEM_ADMIN[r.codigo] ?? 'Não foi possível concluir. Confira os dados e tente de novo.';
  return 'Não foi possível carregar agora.';
}

/** Carrega um recurso e guarda o resultado; `acesso` indica sessao sem permissao. */
export function useCarga<T>(carregar: () => Promise<Resultado<T>>, dependencias: unknown[], ativo: boolean) {
  const [dados, setDados] = useState<T | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [negado, setNegado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(() => {
    let vivo = true;
    setCarregando(true);
    void carregar().then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setDados(r.dados);
        setFalha(null);
      } else if (r.motivo === 'acesso') setNegado(true);
      else if (r.motivo === 'nao_encontrada') setNaoEncontrada(true);
      else setFalha(mensagemDeFalha(r));
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, dependencias);
  useEffect(() => {
    if (!ativo) return;
    return recarregar();
  }, [ativo, recarregar]);
  return { dados, setDados, falha, naoEncontrada, negado, carregando };
}

export function Paginacao({ pagina, limite, total, aoMudar }: { pagina: number; limite: number; total: number; aoMudar: (pagina: number) => void }) {
  const ultima = Math.max(1, Math.ceil(total / limite));
  return (
    <nav aria-label="Paginação" className="actions">
      <button type="button" className="btn btn-secondary" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
        Anterior
      </button>
      <span>
        Página {pagina} de {ultima} ({total} {total === 1 ? 'resultado' : 'resultados'})
      </span>
      <button type="button" className="btn btn-secondary" disabled={pagina >= ultima} onClick={() => aoMudar(pagina + 1)}>
        Próxima
      </button>
    </nav>
  );
}

const rotuloSituacao = (situacao: keyof typeof ROTULO_SITUACAO, motivo: 'inadimplencia' | null): string =>
  situacao === 'cancelada' && motivo === 'inadimplencia' ? `${ROTULO_SITUACAO[situacao]} (segunda parcela não paga)` : ROTULO_SITUACAO[situacao];

/* ------------------------------------------------------------------ reservas */

export function AdminReservas() {
  usePageTitle('Administração de reservas');
  return (
    <SoAdministrador>
      <ListaReservas />
    </SoAdministrador>
  );
}

function ListaReservas() {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const [rascunho, setRascunho] = useState({ excursao_id: '', situacao: '', modalidade: '', q: '' });
  const [filtros, setFiltros] = useState({ excursao_id: '', situacao: '', modalidade: '', q: '', pagina: 1 });
  const [excursoes, setExcursoes] = useState<ResumoExcursao[]>([]);
  const carga = useCarga(() => adminReservasApi.listarReservas(filtros), [filtros], ativo);

  useEffect(() => {
    if (!ativo) return;
    void excursoesApi.listar().then((r) => {
      if (r.ok) setExcursoes(r.dados);
    });
  }, [ativo]);

  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setFiltros({ ...rascunho, pagina: 1 });
  };
  const limpar = () => {
    setRascunho({ excursao_id: '', situacao: '', modalidade: '', q: '' });
    setFiltros({ excursao_id: '', situacao: '', modalidade: '', q: '', pagina: 1 });
  };

  if (carga.negado) return <Restrito visitante={false} />;
  const d = carga.dados;
  return (
    <>
      <h1>Reservas</h1>
      <SubMenu />
      <form onSubmit={aplicar} aria-label="Filtros de reservas" className="panel">
        <div className="field">
          <label htmlFor="f-excursao">Excursão</label>
          <select id="f-excursao" value={rascunho.excursao_id} onChange={(e) => setRascunho({ ...rascunho, excursao_id: e.target.value })}>
            <option value="">Todas</option>
            {excursoes.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-situacao">Situação</label>
          <select id="f-situacao" value={rascunho.situacao} onChange={(e) => setRascunho({ ...rascunho, situacao: e.target.value })}>
            <option value="">Todas</option>
            {Object.entries(ROTULO_SITUACAO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-modalidade">Forma de pagamento</label>
          <select id="f-modalidade" value={rascunho.modalidade} onChange={(e) => setRascunho({ ...rascunho, modalidade: e.target.value })}>
            <option value="">Todas</option>
            {Object.entries(ROTULO_MODALIDADE).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-busca">Passageiro (nome, e-mail ou CPF)</label>
          <input id="f-busca" type="search" maxLength={100} value={rascunho.q} onChange={(e) => setRascunho({ ...rascunho, q: e.target.value })} />
        </div>
        <p className="actions">
          <button type="submit" className="btn btn-primary">
            Filtrar
          </button>
          <button type="button" className="btn btn-secondary" onClick={limpar}>
            Limpar filtros
          </button>
        </p>
      </form>
      {carga.falha ? <Notice kind="error">{carga.falha}</Notice> : null}
      {d === null && carga.carregando ? <p aria-busy="true">Carregando reservas…</p> : null}
      {d !== null && d.reservas.length === 0 ? <p>Nenhuma reserva encontrada.</p> : null}
      {d !== null && d.reservas.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Reservas</caption>
              <thead>
                <tr>
                  <th scope="col">Reserva</th>
                  <th scope="col">Passageiro</th>
                  <th scope="col">Excursão</th>
                  <th scope="col">Pagamento</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Total</th>
                  <th scope="col">Pendência</th>
                </tr>
              </thead>
              <tbody>
                {d.reservas.map((r: ReservaResumo) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <Link to={`/admin/reservas/${r.id}`}>Reserva nº {r.id}</Link>
                    </th>
                    <td>
                      {r.passageiro.nome_completo}
                      <span className="hint"> {r.passageiro.email}</span>
                    </td>
                    <td>{r.excursao.nome}</td>
                    <td>{ROTULO_MODALIDADE[r.modalidade]}</td>
                    <td>{rotuloSituacao(r.situacao, r.motivo_cancelamento)}</td>
                    <td>{formatarReais(r.total_centavos)}</td>
                    <td>{r.tem_pendencia ? 'Sim' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao pagina={d.pagina} limite={d.limite} total={d.total} aoMudar={(pagina) => setFiltros({ ...filtros, pagina })} />
        </>
      ) : null}
    </>
  );
}

export function AdminReservaDetalhe({ id }: { id: number }) {
  usePageTitle('Reserva');
  return (
    <SoAdministrador>
      <DetalheReserva id={id} />
    </SoAdministrador>
  );
}

function DetalheReserva({ id }: { id: number }) {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const carga = useCarga(() => adminReservasApi.obterReserva(id), [id], ativo);
  const [reserva, setReserva] = useState<ReservaDetalhe | null>(null);
  const [alvo, setAlvo] = useState<'cancelada' | 'concluida' | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const atual = reserva ?? (carga.dados === null ? null : carga.dados.reserva);

  if (carga.negado) return <Restrito visitante={false} />;
  if (carga.naoEncontrada) {
    return (
      <>
        <h1>Reserva não encontrada</h1>
        <p>
          <Link to="/admin/reservas" className="btn btn-primary">
            Voltar às reservas
          </Link>
        </p>
      </>
    );
  }
  if (carga.falha !== null && atual === null) {
    return (
      <>
        <h1>Reserva</h1>
        <Notice kind="error">{carga.falha}</Notice>
      </>
    );
  }
  if (atual === null) return <p aria-busy="true">Carregando reserva…</p>;

  const alterar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (alvo === null) return;
    setAviso(null);
    setErroCampo(null);
    setOcupado(true);
    const r = await adminReservasApi.alterarSituacao(id, alvo, justificativa);
    setOcupado(false);
    if (r.ok) {
      setReserva(r.dados.reserva);
      setAlvo(null);
      setJustificativa('');
      setAviso({ tipo: 'success', texto: alvo === 'cancelada' ? 'Reserva cancelada e registrada na auditoria.' : 'Reserva marcada como concluída e registrada na auditoria.' });
    } else if (r.motivo === 'recusa' && r.codigo === 'validacao') {
      setErroCampo(r.campos['justificativa'] === 'obrigatorio' ? 'Informe a justificativa.' : 'A justificativa deve ter até 300 caracteres.');
    } else if (r.motivo === 'acesso') {
      setAviso({ tipo: 'error', texto: 'Sua sessão expirou ou não tem permissão. Entre novamente.' });
    } else {
      setAviso({ tipo: 'error', texto: mensagemDeFalha(r) });
    }
  };

  const disponiveis = atual.alteracoes_permitidas.filter((a) => a.disponivel);
  const rotuloAlteracao = { cancelada: 'Cancelar reserva', concluida: 'Marcar como concluída' } as const;
  return (
    <>
      <h1>Reserva nº {atual.id}</h1>
      <SubMenu />
      {aviso ? <Notice kind={aviso.tipo}>{aviso.texto}</Notice> : null}
      {atual.pendencias.length > 0 ? (
        <Notice kind="info">Pendência administrativa: {atual.pendencias.map((p) => ROTULO_TIPO_PENDENCIA[p]).join('; ')}. O reembolso é feito na página de pendências.</Notice>
      ) : null}
      <dl className="detalhes">
        <dt>Passageiro</dt>
        <dd>
          <Link to={`/admin/passageiros/${atual.passageiro.id}`}>{atual.passageiro.nome_completo}</Link> ({atual.passageiro.email})
        </dd>
        <dt>Excursão</dt>
        <dd>
          {atual.excursao.nome} — {atual.excursao.local} ({dataBr(atual.excursao.data_inicial)} a {dataBr(atual.excursao.data_final)})
        </dd>
        <dt>Forma de pagamento</dt>
        <dd>{ROTULO_MODALIDADE[atual.modalidade]}</dd>
        <dt>Situação</dt>
        <dd>{rotuloSituacao(atual.situacao, atual.motivo_cancelamento)}</dd>
        <dt>Criada em</dt>
        <dd>{instanteBr(atual.criada_em)}</dd>
        <dt>Atualizada em</dt>
        <dd>{instanteBr(atual.atualizada_em)}</dd>
      </dl>

      <h2>Parcelas e pagamentos</h2>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Parcelas da reserva e seus pagamentos</caption>
          <thead>
            <tr>
              <th scope="col">Parcela</th>
              <th scope="col">Valor</th>
              <th scope="col">Vencimento</th>
              <th scope="col">Pagamento</th>
              <th scope="col">Confirmado em</th>
            </tr>
          </thead>
          <tbody>
            {atual.valores.parcelas.map((p) => {
              const pag = atual.pagamentos.find((x) => x.parcela === p.parcela);
              return (
                <tr key={p.parcela}>
                  <th scope="row">{ROTULO_PARCELA[p.parcela]}</th>
                  <td>{formatarReais(p.valor_centavos)}</td>
                  <td>{p.vencimento === null ? '—' : dataBr(p.vencimento)}</td>
                  <td>
                    {pag === undefined ? 'Sem pagamento' : ROTULO_PAGAMENTO[pag.situacao]}
                    {pag?.pendencia === 'confirmado_sem_vaga' ? ' (sem vaga)' : ''}
                  </td>
                  <td>{pag?.confirmado_em ? instanteBr(pag.confirmado_em) : '—'}</td>
                </tr>
              );
            })}
            <tr>
              <th scope="row">Total</th>
              <td>
                <strong>{formatarReais(atual.valores.total_centavos)}</strong>
              </td>
              <td />
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Retenção de vaga</h2>
      {atual.retencoes.length === 0 ? (
        <p>Nenhuma retenção.</p>
      ) : (
        <ul>
          {atual.retencoes.map((r) => (
            <li key={r.id}>
              {r.situacao === 'ativa' ? 'Ativa' : r.situacao === 'confirmada' ? 'Confirmada' : r.situacao === 'expirada' ? 'Expirada' : 'Cancelada'}: criada em {instanteBr(r.criada_em)}, expira em {instanteBr(r.expira_em)}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="alterar-titulo" className="panel">
        <h2 id="alterar-titulo">Alterar situação</h2>
        {disponiveis.length === 0 ? (
          <p>
            Nenhuma alteração manual está disponível para esta reserva
            {atual.alteracoes_permitidas.some((a) => a.motivo === 'reserva_com_pagamento') ? ': ela tem pagamento pendente ou confirmado' : ''}.
          </p>
        ) : (
          <p className="actions">
            {disponiveis.map((a) => (
              <button key={a.para} type="button" className="btn btn-danger" disabled={ocupado} onClick={() => { setAlvo(a.para); setAviso(null); setErroCampo(null); }}>
                {rotuloAlteracao[a.para]}
              </button>
            ))}
          </p>
        )}
        {alvo !== null ? (
          <form onSubmit={(e) => void alterar(e)} role="alertdialog" aria-labelledby="confirma-titulo" className="confirm">
            <p id="confirma-titulo">
              <strong>{alvo === 'cancelada' ? 'Cancelar esta reserva?' : 'Marcar esta reserva como concluída?'}</strong> A alteração fica registrada na auditoria, com o seu usuário e a justificativa.
            </p>
            <div className="field">
              <label htmlFor="justificativa">Justificativa (obrigatória)</label>
              <textarea id="justificativa" rows={3} maxLength={300} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} aria-invalid={erroCampo !== null} aria-describedby={erroCampo === null ? undefined : 'justificativa-erro'} />
              {erroCampo ? (
                <span className="field-error" id="justificativa-erro" role="alert">
                  {erroCampo}
                </span>
              ) : null}
            </div>
            <p className="actions">
              <button type="submit" className="btn btn-danger" disabled={ocupado}>
                {alvo === 'cancelada' ? 'Confirmar cancelamento' : 'Confirmar conclusão'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setAlvo(null)}>
                Voltar
              </button>
            </p>
          </form>
        ) : null}
      </section>

      <h2>Histórico de auditoria</h2>
      {atual.auditoria.length === 0 ? (
        <p>Nenhum evento registrado.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Eventos de auditoria da reserva</caption>
            <thead>
              <tr>
                <th scope="col">Quando</th>
                <th scope="col">Evento</th>
                <th scope="col">Ator</th>
                <th scope="col">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {atual.auditoria.map((e) => (
                <tr key={e.id}>
                  <td>{instanteBr(e.ocorrido_em)}</td>
                  <td>{ROTULO_ACAO_AUDITORIA[e.acao] ?? e.acao}</td>
                  <td>{e.ator_usuario_id === null ? 'Sistema' : `Usuário nº ${e.ator_usuario_id}`}</td>
                  <td>{typeof e.estado_novo?.['justificativa'] === 'string' ? e.estado_novo['justificativa'] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        <Link to="/admin/reservas">← Reservas</Link>
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- pendencias */

export function AdminPendencias() {
  usePageTitle('Pendências administrativas');
  return (
    <SoAdministrador>
      <ListaPendencias />
    </SoAdministrador>
  );
}

function ListaPendencias() {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const [tipo, setTipo] = useState('');
  const [versao, setVersao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [erroReembolso, setErroReembolso] = useState<string | null>(null);
  const carga = useCarga(() => adminReservasApi.listarPendencias(tipo === '' ? undefined : tipo), [tipo, versao], ativo);
  const reembolsar = async (pagamentoId: number) => {
    setOcupado(true);
    setErroReembolso(null);
    const r = await adminReservasApi.reembolsarPendencia(pagamentoId);
    setOcupado(false);
    if (r.ok) setVersao((v) => v + 1);
    else setErroReembolso(mensagemDeFalha(r));
  };
  if (carga.negado) return <Restrito visitante={false} />;
  const d = carga.dados;
  return (
    <>
      <h1>Pendências administrativas</h1>
      <SubMenu />
      <p className="hint">Pagamentos confirmados que dependem da organização. O reembolso é integral e entra na fila de reembolsos.</p>
      {erroReembolso ? <Notice kind="error">{erroReembolso}</Notice> : null}
      <div className="field">
        <label htmlFor="f-tipo">Tipo</label>
        <select id="f-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(ROTULO_TIPO_PENDENCIA).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>
      {carga.falha ? <Notice kind="error">{carga.falha}</Notice> : null}
      {d === null && carga.carregando ? <p aria-busy="true">Carregando pendências…</p> : null}
      {d !== null && d.pendencias.length === 0 ? <p>Nenhuma pendência.</p> : null}
      {d !== null && d.pendencias.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Pendências administrativas</caption>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Reserva</th>
                <th scope="col">Passageiro</th>
                <th scope="col">Excursão</th>
                <th scope="col">Pagamento</th>
                <th scope="col">Reembolso</th>
              </tr>
            </thead>
            <tbody>
              {d.pendencias.map((p: Pendencia) => (
                <tr key={p.pagamento.id}>
                  <td>{ROTULO_TIPO_PENDENCIA[p.tipo]}</td>
                  <th scope="row">
                    <Link to={`/admin/reservas/${p.reserva.id}`}>Reserva nº {p.reserva.id}</Link>
                  </th>
                  <td>{p.passageiro.nome_completo}</td>
                  <td>{p.excursao.nome}</td>
                  <td>
                    {ROTULO_PARCELA[p.pagamento.parcela]}: {formatarReais(p.pagamento.valor_centavos)}, pago em {instanteBr(p.pagamento.confirmado_em)}
                  </td>
                  <td>
                    {p.reembolso === null ? (
                      <button type="button" className="btn btn-secondary" disabled={ocupado} onClick={() => void reembolsar(p.pagamento.id)}>
                        Reembolsar
                      </button>
                    ) : (
                      <Link to="/admin/reembolsos">Reembolso: {ROTULO_SITUACAO_REEMBOLSO[p.reembolso.situacao]}</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

/* --------------------------------------------------------------- passageiros */

export function AdminPassageiros() {
  usePageTitle('Passageiros');
  return (
    <SoAdministrador>
      <ListaPassageiros />
    </SoAdministrador>
  );
}

function ListaPassageiros() {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const [rascunho, setRascunho] = useState('');
  const [filtros, setFiltros] = useState({ q: '', pagina: 1 });
  const carga = useCarga(() => adminReservasApi.listarPassageiros(filtros), [filtros], ativo);
  if (carga.negado) return <Restrito visitante={false} />;
  const d = carga.dados;
  return (
    <>
      <h1>Passageiros</h1>
      <SubMenu />
      <form
        aria-label="Busca de passageiros"
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          setFiltros({ q: rascunho, pagina: 1 });
        }}
      >
        <div className="field">
          <label htmlFor="f-busca-passageiro">Buscar (nome, e-mail ou CPF)</label>
          <input id="f-busca-passageiro" type="search" maxLength={100} value={rascunho} onChange={(e) => setRascunho(e.target.value)} />
        </div>
        <p className="actions">
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </p>
      </form>
      <p className="hint">CPF e telefone aparecem mascarados na lista; os dados completos estão no detalhe, e cada consulta ao detalhe é registrada na auditoria.</p>
      {carga.falha ? <Notice kind="error">{carga.falha}</Notice> : null}
      {d === null && carga.carregando ? <p aria-busy="true">Carregando passageiros…</p> : null}
      {d !== null && d.passageiros.length === 0 ? <p>Nenhum passageiro encontrado.</p> : null}
      {d !== null && d.passageiros.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Passageiros</caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Reservas</th>
                </tr>
              </thead>
              <tbody>
                {d.passageiros.map((p: PassageiroResumo) => (
                  <tr key={p.id}>
                    <th scope="row">
                      <Link to={`/admin/passageiros/${p.id}`}>{p.nome_completo}</Link>
                    </th>
                    <td>{p.email}</td>
                    <td>{p.cpf_mascarado}</td>
                    <td>{p.telefone_mascarado}</td>
                    <td>{p.total_reservas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao pagina={d.pagina} limite={d.limite} total={d.total} aoMudar={(pagina) => setFiltros({ ...filtros, pagina })} />
        </>
      ) : null}
    </>
  );
}

export function AdminPassageiroDetalhe({ id }: { id: number }) {
  usePageTitle('Passageiro');
  return (
    <SoAdministrador>
      <DetalhePassageiro id={id} />
    </SoAdministrador>
  );
}

function DetalhePassageiro({ id }: { id: number }) {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const carga = useCarga(() => adminReservasApi.obterPassageiro(id), [id], ativo);
  if (carga.negado) return <Restrito visitante={false} />;
  if (carga.naoEncontrada) {
    return (
      <>
        <h1>Passageiro não encontrado</h1>
        <p>
          <Link to="/admin/passageiros" className="btn btn-primary">
            Voltar aos passageiros
          </Link>
        </p>
      </>
    );
  }
  if (carga.falha !== null) {
    return (
      <>
        <h1>Passageiro</h1>
        <Notice kind="error">{carga.falha}</Notice>
      </>
    );
  }
  if (carga.dados === null) return <p aria-busy="true">Carregando passageiro…</p>;
  const p: PassageiroDetalhe = carga.dados.passageiro;
  return (
    <>
      <h1>{p.nome_completo}</h1>
      <SubMenu />
      <Notice kind="info">Dados pessoais completos. Esta consulta foi registrada na auditoria.</Notice>
      <dl className="detalhes">
        <dt>E-mail</dt>
        <dd>{p.email}</dd>
        <dt>CPF</dt>
        <dd>{p.cpf}</dd>
        <dt>Telefone</dt>
        <dd>{p.telefone}</dd>
        <dt>Data de nascimento</dt>
        <dd>{dataBr(p.data_nascimento)}</dd>
        <dt>Cadastrado em</dt>
        <dd>{instanteBr(p.criado_em)}</dd>
      </dl>
      <h2>Reservas</h2>
      {p.reservas.length === 0 ? (
        <p>Este passageiro ainda não tem reservas.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Reservas do passageiro</caption>
            <thead>
              <tr>
                <th scope="col">Reserva</th>
                <th scope="col">Excursão</th>
                <th scope="col">Pagamento</th>
                <th scope="col">Situação</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {p.reservas.map((r) => (
                <tr key={r.id}>
                  <th scope="row">
                    <Link to={`/admin/reservas/${r.id}`}>Reserva nº {r.id}</Link>
                  </th>
                  <td>{r.excursao.nome}</td>
                  <td>{ROTULO_MODALIDADE[r.modalidade]}</td>
                  <td>{rotuloSituacao(r.situacao, r.motivo_cancelamento)}</td>
                  <td>{formatarReais(r.total_centavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        <Link to="/admin/passageiros">← Passageiros</Link>
      </p>
    </>
  );
}
