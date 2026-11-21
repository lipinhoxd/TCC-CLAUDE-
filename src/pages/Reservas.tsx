import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import { dataBr } from '../formato.ts';
import type { Modalidade, Reserva } from '../reservas/reservas-api.ts';
import { MENSAGEM_MODALIDADE, MENSAGEM_RESERVA, ROTULO_SITUACAO_RESERVA, reservasApi } from '../reservas/reservas-api.ts';
import { Link, useRouter } from '../router.tsx';
import { useSession } from '../session.tsx';
import type { ExcursaoPublica } from '../publico/excursoes-publicas-api.ts';
import { Notice, usePageTitle } from '../ui.tsx';

/**
 * Reserva do passageiro (AGT-007): botao no detalhe da excursao e pagina de checkout. Sem pagamento ainda.
 * AGT-008: abrir o checkout inicia a retencao temporaria da vaga; a tela mostra o tempo restante e, expirada, oferece retomar.
 * AGT-009: pagamento integral no checkout (provedor simulado fora de producao); reserva paga fica pronta para embarque.
 */

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

/** Tempo restante no formato mm:ss. */
export function formatarRestante(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Pagina de checkout: resumo da reserva, retencao da vaga e pagamento integral. O parcelado e da AGT-010. */
export function Checkout({ id }: { id: number }) {
  usePageTitle('Checkout');
  const { status, user } = useSession();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [fimLocal, setFimLocal] = useState<number | null>(null);
  const [restante, setRestante] = useState(0);
  const [semVaga, setSemVaga] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const autoIniciou = useRef(false);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState<'nao_encontrada' | 'rede' | 'erro' | null>(null);
  const [negado, setNegado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [pagando, setPagando] = useState(false);
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

  const iniciar = async () => {
    setIniciando(true);
    setSemVaga(false);
    setAviso(null);
    const r = await reservasApi.iniciarCheckout(id);
    setIniciando(false);
    if (r.ok) setReserva(r.reserva);
    else if (r.motivo === 'recusa' && r.codigo === 'sem_vagas') setSemVaga(true);
    else if (r.motivo === 'recusa') setAviso({ tipo: 'error', texto: MENSAGEM_RESERVA[r.codigo] ?? 'Não foi possível iniciar o checkout.' });
    else if (r.motivo === 'acesso') setNegado(true);
    else setAviso({ tipo: 'error', texto: r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.' });
  };

  // Ao abrir o checkout de uma reserva pendente sem retencao ativa, inicia a retencao uma vez (RF-021).
  useEffect(() => {
    if (reserva === null || autoIniciou.current) return;
    autoIniciou.current = true;
    if (reserva.situacao === 'aguardando_pagamento' && reserva.pagamento?.situacao !== 'confirmado' && reserva.retencao?.situacao !== 'ativa') void iniciar();
  }, [reserva]);

  // O servidor informa os segundos restantes; a contagem na tela usa o relogio local a partir dessa medida.
  useEffect(() => {
    const ativa = reserva?.retencao?.situacao === 'ativa' ? reserva.retencao.segundos_restantes : null;
    setFimLocal(ativa === null ? null : Date.now() + ativa * 1000);
  }, [reserva]);

  useEffect(() => {
    if (fimLocal === null) {
      setRestante(0);
      return;
    }
    const atualizar = () => setRestante(Math.max(0, Math.ceil((fimLocal - Date.now()) / 1000)));
    atualizar();
    const timer = setInterval(atualizar, 1000);
    return () => clearInterval(timer);
  }, [fimLocal]);

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

  /** Resposta comum do pagamento: atualiza a reserva ou explica a recusa, sem vazar detalhes. */
  const tratarPagamento = (r: Awaited<ReturnType<typeof reservasApi.pagar>>, aoSucesso?: string) => {
    if (r.ok) {
      setReserva(r.reserva);
      setSemVaga(false);
      if (aoSucesso !== undefined) setAviso({ tipo: 'success', texto: aoSucesso });
    } else if (r.motivo === 'recusa') {
      setAviso({ tipo: 'error', texto: MENSAGEM_RESERVA[r.codigo] ?? 'Não foi possível concluir o pagamento.' });
    } else if (r.motivo === 'acesso') {
      setNegado(true);
    } else {
      setAviso({ tipo: 'error', texto: r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.' });
    }
  };

  const pagar = async () => {
    setAviso(null);
    setPagando(true);
    tratarPagamento(await reservasApi.pagar(id));
    setPagando(false);
  };

  const simular = async (resultado: 'aprovado' | 'recusado') => {
    setAviso(null);
    setPagando(true);
    tratarPagamento(await reservasApi.simular(id, resultado));
    setPagando(false);
  };

  const e = reserva.excursao;
  const aguardandoPagamento = reserva.situacao === 'aguardando_pagamento';
  const pag = reserva.pagamento;
  const confirmado = pag?.situacao === 'confirmado';
  // O bloco da retencao so aparece enquanto o pagamento nao foi confirmado.
  const aguardando = aguardandoPagamento && !confirmado;
  const retida = aguardando && fimLocal !== null && restante > 0;
  const expirou = aguardando && !retida && !iniciando && !semVaga && (reserva.retencao?.situacao === 'expirada' || (fimLocal !== null && restante <= 0));
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
          {iniciando ? (
            <p className="notice notice-info" aria-busy="true">
              Reservando a vaga para você…
            </p>
          ) : null}
          {retida ? (
            <p className="notice notice-info">
              Vaga retida para você por <strong role="timer">{formatarRestante(restante)}</strong>. {AVISO_VAGA}
            </p>
          ) : null}
          {semVaga ? (
            <div>
              <Notice kind="error">{MENSAGEM_RESERVA['sem_vagas']}</Notice>
              <p>
                <button type="button" className="btn btn-primary" disabled={iniciando} onClick={() => void iniciar()}>
                  Tentar novamente
                </button>
              </p>
            </div>
          ) : null}
          {expirou ? (
            <div>
              <Notice kind="info">O tempo da retenção acabou e a vaga foi liberada. Se ainda houver vaga, você pode retomar o checkout.</Notice>
              <p>
                <button type="button" className="btn btn-primary" disabled={iniciando} onClick={() => void iniciar()}>
                  Retomar checkout
                </button>
              </p>
            </div>
          ) : null}
          {!retida && !iniciando && !semVaga && !expirou ? (
            <p>
              <button type="button" className="btn btn-primary" onClick={() => void iniciar()}>
                Iniciar checkout
              </button>
            </p>
          ) : null}
        </>
      ) : null}
      {reserva.situacao === 'pronto_para_embarque' ? <Notice kind="success">Pagamento confirmado. Sua reserva está pronta para embarque.</Notice> : null}
      {aguardandoPagamento && confirmado ? (
        <Notice kind="info">Recebemos o seu pagamento, mas a vaga não está mais disponível. A organização vai tratar o caso.</Notice>
      ) : null}
      {aguardando ? (
        <section aria-labelledby="pagamento-titulo" className="panel">
          <h2 id="pagamento-titulo">Pagamento</h2>
          {reserva.modalidade === 'parcelada' ? (
            <Notice kind="info">O pagamento em duas parcelas ainda não está disponível.</Notice>
          ) : !reserva.pagamento_disponivel ? (
            <Notice kind="info">O pagamento não está disponível neste ambiente.</Notice>
          ) : (
            <>
              {pag?.situacao === 'falhou' ? <Notice kind="error">O pagamento foi recusado. Você pode tentar de novo enquanto a vaga estiver retida.</Notice> : null}
              {pag?.situacao === 'pendente' ? (
                <>
                  <Notice kind="info">Pagamento de {formatarReais(pag.valor_centavos)} iniciado. Aguardando a confirmação.</Notice>
                  {reserva.pagamento_simulado ? (
                    <div className="opcoes">
                      <p className="hint">Ambiente de demonstração: o provedor de pagamento é simulado. Escolha o resultado.</p>
                      <button type="button" className="btn btn-primary" disabled={pagando} onClick={() => void simular('aprovado')}>
                        Simular pagamento aprovado
                      </button>{' '}
                      <button type="button" className="btn btn-secondary" disabled={pagando} onClick={() => void simular('recusado')}>
                        Simular pagamento recusado
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p>
                    Valor a pagar: <strong>{formatarReais(reserva.valores.total_centavos)}</strong>
                  </p>
                  <button type="button" className="btn btn-primary" disabled={pagando || !retida} onClick={() => void pagar()}>
                    {pagando ? 'Pagando…' : 'Pagar'}
                  </button>
                  {!retida ? <p className="hint">Para pagar, a vaga precisa estar retida. Retome o checkout acima.</p> : null}
                </>
              )}
            </>
          )}
        </section>
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
