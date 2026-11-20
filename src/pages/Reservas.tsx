import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { dataBr } from '../formato.ts';
import type { Modalidade, Reserva } from '../reservas/reservas-api.ts';
import { MENSAGEM_MODALIDADE, MENSAGEM_RESERVA, ROTULO_SITUACAO_RESERVA, reservasApi } from '../reservas/reservas-api.ts';
import { Link, useRouter } from '../router.tsx';
import { useSession } from '../session.tsx';
import type { ExcursaoPublica } from '../publico/excursoes-publicas-api.ts';
import { Notice, usePageTitle } from '../ui.tsx';

/** Reserva do passageiro (AGT-007): botao no detalhe da excursao e pagina de checkout. Sem pagamento ainda. */

const AVISO_VAGA = 'A vaga só é garantida após o pagamento confirmado.';

/** Bloco "Reservar" do detalhe da excursao: passageiro reserva, visitante entra ou cadastra, administrador nao ve. */
export function AcaoReservar({ excursao }: { excursao: ExcursaoPublica }) {
  const { status, user } = useSession();
  const { navigate } = useRouter();
  const [modalidade, setModalidade] = useState<Modalidade>('integral');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (status === 'loading') return null;
  if (user === null) {
    return (
      <section className="panel" aria-labelledby="reservar-titulo">
        <h2 id="reservar-titulo">Reservar</h2>
        <p>Para reservar, é preciso ter conta.</p>
        <p className="actions">
          <Link to="/login" className="btn btn-primary">
            Entrar
          </Link>
          <Link to="/cadastro" className="btn btn-secondary">
            Criar conta
          </Link>
        </p>
      </section>
    );
  }
  if (user.perfil !== 'passageiro') return null;
  if (excursao.vagas_disponiveis <= 0) {
    return (
      <section className="panel" aria-labelledby="reservar-titulo">
        <h2 id="reservar-titulo">Reservar</h2>
        <Notice kind="info">Esta excursão está esgotada. Não é possível reservar agora.</Notice>
      </section>
    );
  }

  const reservar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setOcupado(true);
    const r = await reservasApi.solicitar(excursao.id, modalidade);
    setOcupado(false);
    if (r.ok) {
      navigate(`/reservas/${r.reserva.id}/checkout`);
    } else if (r.motivo === 'recusa') {
      const existente = r.campos['reserva_id'];
      if (r.codigo === 'reserva_ativa_existente' && existente !== undefined) {
        navigate(`/reservas/${existente}/checkout`, { flash: 'Você já tem uma reserva para esta excursão.' });
        return;
      }
      const modalidadeErro = r.campos['modalidade'];
      setErro(
        (modalidadeErro !== undefined ? MENSAGEM_MODALIDADE[modalidadeErro] : undefined) ??
          MENSAGEM_RESERVA[r.codigo] ??
          'Não foi possível reservar. Confira os dados e tente de novo.',
      );
    } else if (r.motivo === 'acesso') {
      setErro('Sua sessão expirou. Entre novamente para reservar.');
    } else {
      setErro(r.motivo === 'rede' ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' : 'Algo deu errado. Tente novamente em instantes.');
    }
  };

  return (
    <section className="panel" aria-labelledby="reservar-titulo">
      <h2 id="reservar-titulo">Reservar</h2>
      {erro ? <Notice kind="error">{erro}</Notice> : null}
      <form onSubmit={(e) => void reservar(e)}>
        <fieldset className="opcoes">
          <legend>Forma de pagamento</legend>
          <label>
            <input type="radio" name="modalidade" value="integral" checked={modalidade === 'integral'} onChange={() => setModalidade('integral')} /> Pagamento integral
          </label>
          {excursao.parcelamento_habilitado ? (
            <label>
              <input type="radio" name="modalidade" value="parcelada" checked={modalidade === 'parcelada'} onChange={() => setModalidade('parcelada')} /> Em 2 parcelas de 50%
              {excursao.prazo_segunda_parcela ? ` (segunda parcela até ${dataBr(excursao.prazo_segunda_parcela)})` : ''}
            </label>
          ) : null}
        </fieldset>
        <p className="hint">{AVISO_VAGA}</p>
        <button type="submit" className="btn btn-primary" disabled={ocupado}>
          {ocupado ? 'Reservando…' : 'Reservar'}
        </button>
      </form>
    </section>
  );
}

const ROTULO_PARCELA = { unica: 'Parcela única', primeira: 'Primeira parcela', segunda: 'Segunda parcela' } as const;

function Restrito({ visitante }: { visitante: boolean }) {
  return (
    <>
      <h1>Checkout</h1>
      {visitante ? (
        <Notice kind="info">
          Entre na sua conta para ver a reserva. <Link to="/login">Ir para o login</Link>
        </Notice>
      ) : (
        <Notice kind="error">Acesso restrito a passageiros.</Notice>
      )}
    </>
  );
}

/** Pagina de checkout: resumo da reserva. O pagamento ainda nao existe (AGT-009 e AGT-010). */
export function Checkout({ id }: { id: number }) {
  usePageTitle('Checkout');
  const { status, user } = useSession();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [carregando, setCarregando] = useState(true);
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
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id, pode]);

  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante />;
  if (user.perfil !== 'passageiro' || negado) return <Restrito visitante={false} />;
  if (carregando) return <p aria-busy="true">Carregando reserva…</p>;
  if (falha === 'nao_encontrada') {
    return (
      <>
        <h1>Reserva não encontrada</h1>
        <p>Esta reserva não existe ou não é sua.</p>
        <p>
          <Link to="/excursoes" className="btn btn-primary">
            Ver excursões
          </Link>
        </p>
      </>
    );
  }
  if (falha !== null || reserva === null) {
    return (
      <>
        <h1>Checkout</h1>
        <Notice kind="error">{falha === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar a reserva agora.'}</Notice>
      </>
    );
  }

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
  const aguardando = reserva.situacao === 'aguardando_pagamento';
  return (
    <>
      <h1>Checkout da reserva nº {reserva.id}</h1>
      {aviso ? <Notice kind={aviso.tipo}>{aviso.texto}</Notice> : null}
      {reserva.situacao === 'cancelada' ? <Notice kind="info">Esta reserva está cancelada.</Notice> : null}
      <dl className="detalhes">
        <dt>Excursão</dt>
        <dd>
          <Link to={`/excursoes/${e.id}`}>{e.nome}</Link>
        </dd>
        <dt>Datas</dt>
        <dd>
          {dataBr(e.data_inicial)} a {dataBr(e.data_final)}
        </dd>
        <dt>Partida</dt>
        <dd>
          {dataBr(e.partida_brasilia.data)} às {e.partida_brasilia.hora} (horário de Brasília)
        </dd>
        <dt>Pagamento</dt>
        <dd>{reserva.modalidade === 'parcelada' ? 'Em 2 parcelas de 50%' : 'Pagamento integral'}</dd>
        <dt>Situação</dt>
        <dd>{ROTULO_SITUACAO_RESERVA[reserva.situacao]}</dd>
      </dl>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Valores da reserva</caption>
          <thead>
            <tr>
              <th scope="col">Parcela</th>
              <th scope="col">Valor</th>
              <th scope="col">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {reserva.valores.parcelas.map((p) => (
              <tr key={p.parcela}>
                <th scope="row">{ROTULO_PARCELA[p.parcela]}</th>
                <td>{formatarReais(p.valor_centavos)}</td>
                <td>{p.vencimento === null ? (p.parcela === 'segunda' ? '—' : 'Ao pagar') : dataBr(p.vencimento)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th>
              <td>
                <strong>{formatarReais(reserva.valores.total_centavos)}</strong>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {aguardando ? (
        <>
          <p className="notice notice-info">{AVISO_VAGA} Esta reserva ainda não segura a vaga.</p>
          <p className="notice notice-provisional">Pagamento: ainda não está disponível. Será habilitado em uma próxima etapa. Este texto é provisório.</p>
        </>
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
        <Link to={`/excursoes/${e.id}`}>← Voltar para a excursão</Link>
      </p>
    </>
  );
}
