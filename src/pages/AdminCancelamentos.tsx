import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import type { ResumoCancelamento } from '../admin/reservas-admin-api.ts';
import { ROTULO_MOTIVO_REEMBOLSO, ROTULO_SITUACAO, ROTULO_SITUACAO_REEMBOLSO, adminReservasApi } from '../admin/reservas-admin-api.ts';
import { dataBr } from '../formato.ts';
import { Link } from '../router.tsx';
import { useSession } from '../session.tsx';
import { Notice, usePageTitle } from '../ui.tsx';
import { Paginacao, Restrito, SoAdministrador, SubMenu, mensagemDeFalha, useCarga } from './AdminReservas.tsx';

/** Reembolsos e cancelamento de excursao pela organizacao (AGT-013). O servidor decide tudo; o provedor e simulado. */

const instanteBr = (iso: string): string => {
  const { data, hora } = utcParaBrasilia(iso);
  return `${dataBr(data)} ${hora.slice(0, 5)}`;
};

export function AdminReembolsos() {
  usePageTitle('Reembolsos');
  return (
    <SoAdministrador>
      <ListaReembolsos />
    </SoAdministrador>
  );
}

function ListaReembolsos() {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const [filtros, setFiltros] = useState({ situacao: '', pagina: 1 });
  const [versao, setVersao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const carga = useCarga(() => adminReservasApi.listarReembolsos(filtros), [filtros, versao], ativo);
  if (carga.negado) return <Restrito visitante={false} />;
  const d = carga.dados;

  const processar = async (id: number, resultado: 'aprovado' | 'recusado') => {
    setOcupado(true);
    setAviso(null);
    const r = await adminReservasApi.processarReembolso(id, resultado);
    setOcupado(false);
    if (r.ok) {
      setAviso({ tipo: 'success', texto: resultado === 'aprovado' ? `Reembolso nº ${id} processado.` : `Reembolso nº ${id} recusado. É possível tentar de novo.` });
      setVersao((v) => v + 1);
    } else if (r.motivo === 'acesso') {
      setAviso({ tipo: 'error', texto: 'Sua sessão expirou ou não tem permissão. Entre novamente.' });
    } else {
      setAviso({ tipo: 'error', texto: mensagemDeFalha(r) });
    }
  };

  return (
    <>
      <h1>Reembolsos</h1>
      <SubMenu />
      <p className="hint">Ambiente de demonstração: o provedor é simulado e nenhum dinheiro é movimentado.</p>
      {aviso ? <Notice kind={aviso.tipo}>{aviso.texto}</Notice> : null}
      <div className="field">
        <label htmlFor="f-reembolso">Situação</label>
        <select id="f-reembolso" value={filtros.situacao} onChange={(e) => setFiltros({ situacao: e.target.value, pagina: 1 })}>
          <option value="">Todas</option>
          {Object.entries(ROTULO_SITUACAO_REEMBOLSO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>
      {carga.falha ? <Notice kind="error">{carga.falha}</Notice> : null}
      {d === null && carga.carregando ? <p aria-busy="true">Carregando reembolsos…</p> : null}
      {d !== null && !d.processamento_disponivel ? <Notice kind="info">O processamento de reembolso não está disponível neste ambiente.</Notice> : null}
      {d !== null && d.reembolsos.length === 0 ? <p>Nenhum reembolso encontrado.</p> : null}
      {d !== null && d.reembolsos.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Reembolsos</caption>
              <thead>
                <tr>
                  <th scope="col">Reembolso</th>
                  <th scope="col">Passageiro e excursão</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {d.reembolsos.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      nº {r.id} <span className="hint">{instanteBr(r.criado_em)}</span>
                    </th>
                    <td>
                      {r.passageiro}
                      <span className="hint">
                        {' '}
                        {r.excursao} · <Link to={`/admin/reservas/${r.reserva_id}`}>Reserva nº {r.reserva_id}</Link>
                      </span>
                    </td>
                    <td>
                      {formatarReais(r.valor_centavos)} ({r.percentual_aplicado}%)
                    </td>
                    <td>{ROTULO_MOTIVO_REEMBOLSO[r.motivo]}</td>
                    <td>{ROTULO_SITUACAO_REEMBOLSO[r.situacao]}</td>
                    <td>
                      {r.situacao !== 'processado' && d.processamento_disponivel ? (
                        <>
                          <button type="button" className="btn btn-primary" disabled={ocupado} onClick={() => void processar(r.id, 'aprovado')}>
                            Aprovar (simulado)
                          </button>{' '}
                          {r.situacao === 'pendente' ? (
                            <button type="button" className="btn btn-secondary" disabled={ocupado} onClick={() => void processar(r.id, 'recusado')}>
                              Recusar (simulado)
                            </button>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
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

export function AdminCancelamentoExcursao({ id }: { id: number }) {
  usePageTitle('Cancelar excursão');
  return (
    <SoAdministrador>
      <CancelamentoExcursao id={id} />
    </SoAdministrador>
  );
}

function CancelamentoExcursao({ id }: { id: number }) {
  const { status, user } = useSession();
  const ativo = status === 'ready' && user?.perfil === 'administrador';
  const carga = useCarga(() => adminReservasApi.previaExcursao(id), [id], ativo);
  const [justificativa, setJustificativa] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoCancelamento | null>(null);

  if (carga.negado) return <Restrito visitante={false} />;
  if (carga.naoEncontrada) {
    return (
      <>
        <h1>Excursão não encontrada</h1>
        <p>
          <Link to="/admin/excursoes" className="btn btn-primary">
            Voltar às excursões
          </Link>
        </p>
      </>
    );
  }
  if (carga.falha !== null) {
    return (
      <>
        <h1>Cancelar excursão</h1>
        <Notice kind="error">{carga.falha}</Notice>
      </>
    );
  }
  if (carga.dados === null) return <p aria-busy="true">Carregando…</p>;
  const previa = carga.dados.previa;

  const cancelar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setErroCampo(null);
    setOcupado(true);
    const r = await adminReservasApi.cancelarExcursao(id, justificativa);
    setOcupado(false);
    if (r.ok) {
      setResumo(r.dados.cancelamento);
      setConfirmando(false);
    } else if (r.motivo === 'recusa' && r.codigo === 'validacao') {
      setErroCampo(r.campos['justificativa'] === 'obrigatorio' ? 'Informe a justificativa.' : 'A justificativa deve ter até 300 caracteres.');
    } else if (r.motivo === 'acesso') {
      setErro('Sua sessão expirou ou não tem permissão. Entre novamente.');
    } else {
      setErro(mensagemDeFalha(r));
    }
  };

  return (
    <>
      <h1>Cancelar excursão: {previa.excursao.nome}</h1>
      <SubMenu />
      {erro ? <Notice kind="error">{erro}</Notice> : null}
      {resumo !== null ? (
        <>
          <Notice kind="success">
            Excursão cancelada. Reservas canceladas: {resumo.reservas_canceladas}. Reembolsos criados: {resumo.reembolsos_criados} ({formatarReais(resumo.valor_total_centavos)}).
          </Notice>
          <p>
            <Link to="/admin/reembolsos" className="btn btn-primary">
              Ver reembolsos
            </Link>
          </p>
        </>
      ) : !previa.permitido ? (
        <Notice kind="info">{previa.motivo_impedimento === 'excursao_ja_partiu' ? 'A excursão já partiu e não pode mais ser cancelada por aqui.' : 'Esta excursão já está cancelada.'}</Notice>
      ) : (
        <>
          <p>
            Partida: {instanteBr(previa.excursao.partida_utc)} (horário de Brasília). Serão canceladas as reservas abaixo, com reembolso integral do que foi pago. Total a reembolsar:{' '}
            <strong>{formatarReais(previa.valor_total_centavos)}</strong>.
          </p>
          {previa.reservas.length === 0 ? (
            <p>Nenhuma reserva ativa.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Reservas afetadas</caption>
                <thead>
                  <tr>
                    <th scope="col">Reserva</th>
                    <th scope="col">Passageiro</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Reembolso</th>
                  </tr>
                </thead>
                <tbody>
                  {previa.reservas.map((r) => (
                    <tr key={r.id}>
                      <th scope="row">nº {r.id}</th>
                      <td>{r.passageiro}</td>
                      <td>{ROTULO_SITUACAO[r.situacao]}</td>
                      <td>{formatarReais(r.valor_reembolso_centavos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {previa.pendencias.length > 0 ? <p>Pagamentos pendentes de tratamento também serão reembolsados: {previa.pendencias.length}.</p> : null}
          {!confirmando ? (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmando(true)}>
              Cancelar excursão
            </button>
          ) : (
            <form onSubmit={(e) => void cancelar(e)} role="alertdialog" aria-labelledby="confirma-excursao" className="confirm">
              <p id="confirma-excursao">
                <strong>Cancelar a excursão e todas as reservas acima?</strong> Não é possível desfazer. A ação fica registrada na auditoria.
              </p>
              <div className="field">
                <label htmlFor="justificativa-excursao">Justificativa (obrigatória, sem dados pessoais)</label>
                <textarea
                  id="justificativa-excursao"
                  rows={3}
                  maxLength={300}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  aria-invalid={erroCampo !== null}
                  aria-describedby={erroCampo === null ? undefined : 'justificativa-excursao-erro'}
                />
                {erroCampo ? (
                  <span className="field-error" id="justificativa-excursao-erro" role="alert">
                    {erroCampo}
                  </span>
                ) : null}
              </div>
              <p className="actions">
                <button type="submit" className="btn btn-danger" disabled={ocupado}>
                  Confirmar cancelamento da excursão
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmando(false)}>
                  Voltar
                </button>
              </p>
            </form>
          )}
        </>
      )}
      <p>
        <Link to={`/admin/excursoes/${id}`}>← Voltar à excursão</Link>
      </p>
    </>
  );
}
