import { useEffect, useState } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { dataBr } from '../formato.ts';
import type { ListaReservas, Reserva } from '../reservas/reservas-api.ts';
import { MENSAGEM_RESERVA, ROTULO_SITUACAO_RESERVA, reservasApi } from '../reservas/reservas-api.ts';
import { Link } from '../router.tsx';
import { useSession } from '../session.tsx';
import { Notice, usePageTitle } from '../ui.tsx';
import { ROTULO_PAGAMENTO, ROTULO_PARCELA, vagaOcupada } from './Reservas.tsx';

/**
 * Area do passageiro (AGT-011): lista de reservas (em andamento e historico) e detalhe da reserva. O servidor decide tudo (situacao,
 * conclusao, motivo do cancelamento); aqui so se mostra. O pagamento continua no checkout (AGT-007 a AGT-010).
 */

function Restrito({ visitante, titulo }: { visitante: boolean; titulo: string }) {
  return (
    <>
      <h1>{titulo}</h1>
      {visitante ? (
        <Notice kind="info">
          Entre na sua conta para ver suas reservas. <Link to="/login">Ir para o login</Link>
        </Notice>
      ) : (
        <Notice kind="error">Acesso restrito a passageiros.</Notice>
      )}
    </>
  );
}

const MODALIDADE = { integral: 'Pagamento integral', parcelada: 'Em 2 parcelas de 50%' } as const;

/** Situacao com o motivo, quando a reserva foi cancelada pelo sistema por falta da segunda parcela. */
function rotuloSituacao(reserva: Reserva): string {
  const base = ROTULO_SITUACAO_RESERVA[reserva.situacao];
  return reserva.situacao === 'cancelada' && reserva.motivo_cancelamento === 'inadimplencia' ? `${base} (segunda parcela não paga)` : base;
}

function LinhaReserva({ reserva }: { reserva: Reserva }) {
  const e = reserva.excursao;
  return (
    <tr>
      <th scope="row">
        <Link to={`/reservas/${reserva.id}`}>{e.nome}</Link>
        <span className="hint"> Reserva nº {reserva.id}</span>
      </th>
      <td>
        {dataBr(e.data_inicial)} a {dataBr(e.data_final)}
      </td>
      <td>{MODALIDADE[reserva.modalidade]}</td>
      <td>{rotuloSituacao(reserva)}</td>
      <td>{formatarReais(reserva.valores.total_centavos)}</td>
      <td>
        <Link to={`/reservas/${reserva.id}`}>Ver detalhe</Link>
        {reserva.situacao === 'aguardando_pagamento' ? (
          <>
            {' · '}
            <Link to={`/reservas/${reserva.id}/checkout`}>Continuar o pagamento</Link>
          </>
        ) : null}
      </td>
    </tr>
  );
}

function TabelaReservas({ titulo, reservas }: { titulo: string; reservas: Reserva[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Excursão</th>
            <th scope="col">Datas</th>
            <th scope="col">Pagamento</th>
            <th scope="col">Situação</th>
            <th scope="col">Total</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <LinhaReserva key={r.id} reserva={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pagina "Minhas reservas": bloco "Em andamento" e bloco "Historico" (concluidas e canceladas). */
export function MinhasReservas() {
  usePageTitle('Minhas reservas');
  const { status, user } = useSession();
  const [lista, setLista] = useState<ListaReservas | null>(null);
  const [falha, setFalha] = useState<'rede' | 'erro' | null>(null);
  const [negado, setNegado] = useState(false);
  const pode = status === 'ready' && user?.perfil === 'passageiro';

  useEffect(() => {
    if (!pode) return;
    let ativo = true;
    void reservasApi.listar().then((r) => {
      if (!ativo) return;
      if (r.ok) setLista(r.lista);
      else if (r.motivo === 'acesso') setNegado(true);
      else setFalha(r.motivo);
    });
    return () => {
      ativo = false;
    };
  }, [pode]);

  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante titulo="Minhas reservas" />;
  if (user.perfil !== 'passageiro' || negado) return <Restrito visitante={false} titulo="Minhas reservas" />;
  if (falha !== null) {
    return (
      <>
        <h1>Minhas reservas</h1>
        <Notice kind="error">{falha === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar suas reservas agora.'}</Notice>
      </>
    );
  }
  if (lista === null) return <p aria-busy="true">Carregando reservas…</p>;

  const vazio = lista.em_andamento.length === 0 && lista.historico.length === 0;
  return (
    <>
      <h1>Minhas reservas</h1>
      {vazio ? (
        <>
          <p>Você ainda não tem reservas.</p>
          <p>
            <Link to="/excursoes" className="btn btn-primary">
              Ver excursões
            </Link>
          </p>
        </>
      ) : null}
      {!vazio ? (
        <section aria-labelledby="andamento-titulo">
          <h2 id="andamento-titulo">Em andamento</h2>
          {lista.em_andamento.length === 0 ? <p>Nenhuma reserva em andamento.</p> : <TabelaReservas titulo="Reservas em andamento" reservas={lista.em_andamento} />}
        </section>
      ) : null}
      {!vazio ? (
        <section aria-labelledby="historico-titulo">
          <h2 id="historico-titulo">Histórico</h2>
          <p className="hint">Reservas concluídas e canceladas. As concluídas permanecem aqui.</p>
          {lista.historico.length === 0 ? <p>Nenhuma reserva no histórico.</p> : <TabelaReservas titulo="Histórico de reservas" reservas={lista.historico} />}
        </section>
      ) : null}
    </>
  );
}

/** Pagina de detalhe da reserva do passageiro (RF-030). Aguardando pagamento leva ao checkout; as demais so informam. */
export function DetalheReserva({ id }: { id: number }) {
  usePageTitle('Reserva');
  const { status, user } = useSession();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [falha, setFalha] = useState<'nao_encontrada' | 'rede' | 'erro' | null>(null);
  const [negado, setNegado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const pode = status === 'ready' && user?.perfil === 'passageiro';

  useEffect(() => {
    if (!pode) return;
    let ativo = true;
    void reservasApi.obter(id).then((r) => {
      if (!ativo) return;
      if (r.ok) setReserva(r.reserva);
      else if (r.motivo === 'acesso') setNegado(true);
      else setFalha(r.motivo === 'nao_encontrada' ? 'nao_encontrada' : r.motivo === 'rede' ? 'rede' : 'erro');
    });
    return () => {
      ativo = false;
    };
  }, [id, pode]);

  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante titulo="Reserva" />;
  if (user.perfil !== 'passageiro' || negado) return <Restrito visitante={false} titulo="Reserva" />;
  if (falha === 'nao_encontrada') {
    return (
      <>
        <h1>Reserva não encontrada</h1>
        <p>Esta reserva não existe ou não é sua.</p>
        <p>
          <Link to="/reservas" className="btn btn-primary">
            Minhas reservas
          </Link>
        </p>
      </>
    );
  }
  if (falha !== null) {
    return (
      <>
        <h1>Reserva</h1>
        <Notice kind="error">{falha === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar a reserva agora.'}</Notice>
      </>
    );
  }
  if (reserva === null) return <p aria-busy="true">Carregando reserva…</p>;

  const desistir = async () => {
    setConfirmar(false);
    setAviso(null);
    setOcupado(true);
    const r = await reservasApi.desistir(id);
    setOcupado(false);
    if (r.ok) {
      setReserva(r.reserva);
      setAviso({ tipo: 'success', texto: 'Reserva cancelada. Você pode reservar de novo quando quiser.' });
    } else if (r.motivo === 'recusa') {
      setAviso({ tipo: 'error', texto: MENSAGEM_RESERVA[r.codigo] ?? 'Não foi possível desistir da reserva.' });
    } else if (r.motivo === 'acesso') {
      setNegado(true);
    } else {
      setAviso({ tipo: 'error', texto: r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.' });
    }
  };

  const e = reserva.excursao;
  const pag = reserva.pagamento;
  const aguardando = reserva.situacao === 'aguardando_pagamento';
  const inadimplente = reserva.situacao === 'cancelada' && reserva.motivo_cancelamento === 'inadimplencia';
  const semVagaAdm = pag?.situacao === 'confirmado' && pag.requer_tratamento_administrativo;
  const segundaTardia = inadimplente && pag?.parcela === 'segunda' && pag.situacao === 'confirmado';
  const prazoSegunda = reserva.valores.parcelas.find((p) => p.parcela === 'segunda')?.vencimento ?? null;

  return (
    <>
      <h1>Reserva nº {reserva.id}</h1>
      {aviso ? <Notice kind={aviso.tipo}>{aviso.texto}</Notice> : null}
      {reserva.situacao === 'pronto_para_embarque' ? <Notice kind="success">Pagamento confirmado. Sua reserva está pronta para embarque.</Notice> : null}
      {reserva.situacao === 'concluida' ? <Notice kind="info">Esta reserva foi concluída e permanece no seu histórico.</Notice> : null}
      {reserva.situacao === 'cancelada' && !inadimplente ? <Notice kind="info">Esta reserva está cancelada.</Notice> : null}
      {inadimplente ? <Notice kind="info">O prazo da segunda parcela venceu: a vaga foi liberada e a primeira parcela não é reembolsável.</Notice> : null}
      {segundaTardia ? (
        <Notice kind="info">Recebemos o pagamento da segunda parcela depois do prazo. A organização vai tratar o caso.</Notice>
      ) : semVagaAdm ? (
        <Notice kind="info">Recebemos o seu pagamento, mas a vaga não está mais disponível. A organização vai tratar o caso.</Notice>
      ) : null}
      {aguardando && !semVagaAdm && reserva.modalidade === 'parcelada' && vagaOcupada(reserva) ? (
        <Notice kind="success">
          Primeira parcela confirmada: a vaga é sua. Falta a segunda parcela{prazoSegunda === null ? '' : `, até ${dataBr(prazoSegunda)}`}.
        </Notice>
      ) : null}
      <dl className="detalhes">
        <dt>Excursão</dt>
        <dd>
          <Link to={`/excursoes/${e.id}`}>{e.nome}</Link>
        </dd>
        <dt>Local</dt>
        <dd>{e.local}</dd>
        <dt>Ponto de embarque</dt>
        <dd>{e.ponto_embarque}</dd>
        <dt>Datas</dt>
        <dd>
          {dataBr(e.data_inicial)} a {dataBr(e.data_final)}
        </dd>
        <dt>Partida</dt>
        <dd>
          {dataBr(e.partida_brasilia.data)} às {e.partida_brasilia.hora} (horário de Brasília)
        </dd>
        <dt>Pagamento</dt>
        <dd>{MODALIDADE[reserva.modalidade]}</dd>
        <dt>Situação</dt>
        <dd>{rotuloSituacao(reserva)}</dd>
      </dl>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Valores da reserva</caption>
          <thead>
            <tr>
              <th scope="col">Parcela</th>
              <th scope="col">Valor</th>
              <th scope="col">Vencimento</th>
              <th scope="col">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {reserva.valores.parcelas.map((p) => (
              <tr key={p.parcela}>
                <th scope="row">{ROTULO_PARCELA[p.parcela]}</th>
                <td>{formatarReais(p.valor_centavos)}</td>
                <td>{p.vencimento === null ? (p.parcela === 'segunda' ? '—' : 'Ao pagar') : dataBr(p.vencimento)}</td>
                <td>{p.situacao_pagamento ? ROTULO_PAGAMENTO[p.situacao_pagamento] : '—'}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th>
              <td>
                <strong>{formatarReais(reserva.valores.total_centavos)}</strong>
              </td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {aguardando && !semVagaAdm ? (
        <p>
          <Link to={`/reservas/${reserva.id}/checkout`} className="btn btn-primary">
            Continuar o pagamento
          </Link>
        </p>
      ) : null}
      {reserva.pode_desistir ? (
        <section aria-labelledby="desistir-titulo" className="panel">
          <h2 id="desistir-titulo">Desistir da reserva</h2>
          <p>Enquanto não houver pagamento, você pode desistir. A reserva é cancelada e você pode reservar de novo depois.</p>
          <button type="button" className="btn btn-danger" disabled={ocupado} onClick={() => setConfirmar(true)}>
            Desistir da reserva
          </button>
          {confirmar ? (
            <div className="confirm" role="alertdialog" aria-labelledby="confirma-desistencia">
              <p id="confirma-desistencia">
                <strong>Desistir desta reserva?</strong> Ela será cancelada.
              </p>
              <button type="button" className="btn btn-danger" onClick={() => void desistir()} disabled={ocupado}>
                Confirmar desistência
              </button>{' '}
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmar(false)}>
                Voltar
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
      <p>
        <Link to="/reservas">← Minhas reservas</Link>
      </p>
    </>
  );
}
