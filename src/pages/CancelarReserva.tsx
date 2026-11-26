import { useState } from 'react';
import { formatarReais } from '../../shared/dinheiro.ts';
import type { PreviaCancelamento, Reserva } from '../reservas/reservas-api.ts';
import { MENSAGEM_RESERVA, reservasApi } from '../reservas/reservas-api.ts';
import { Notice } from '../ui.tsx';

/**
 * Cancelamento da reserva pelo passageiro (AGT-013, RF-032, RF-033). Antes de confirmar, mostra o que o servidor calculou: quanto
 * sera devolvido e o que nao e reembolsavel. O reembolso e processado depois pela organizacao; a tela nao promete prazo.
 */

const SITUACAO = { pendente: 'pendente', processado: 'processado', recusado: 'recusado' } as const;
const MOTIVO = {
  cancelamento_passageiro: 'pelo seu cancelamento',
  cancelamento_organizacao: 'pelo cancelamento da excursão pela organização',
  pendencia: 'pelo pagamento que não pôde ser atendido',
} as const;

/** Reembolsos registrados na reserva. */
export function Reembolsos({ reserva }: { reserva: Reserva }) {
  if (reserva.reembolsos.length === 0) return null;
  return (
    <section aria-labelledby="reembolsos-titulo" className="panel">
      <h2 id="reembolsos-titulo">Reembolso</h2>
      <ul>
        {reserva.reembolsos.map((r, i) => (
          <li key={i}>
            {formatarReais(r.valor_centavos)} ({r.percentual_aplicado}%), {MOTIVO[r.motivo]}: <strong>{SITUACAO[r.situacao]}</strong>.
          </li>
        ))}
      </ul>
      <p className="hint">O reembolso é processado pela organização.</p>
    </section>
  );
}

function Previa({ previa }: { previa: PreviaCancelamento }) {
  return (
    <>
      <p>
        Pago: <strong>{formatarReais(previa.valor_pago_centavos)}</strong>. Reembolso: <strong>{formatarReais(previa.valor_reembolso_centavos)}</strong>
        {previa.valor_elegivel_centavos > 0 ? ` (${previa.percentual}% do valor elegível)` : ''}.
      </p>
      {previa.parcelada_nao_quitada ? <p>A primeira parcela de uma reserva parcelada que não foi quitada não é reembolsável.</p> : null}
      {!previa.parcelada_nao_quitada && previa.valor_pago_centavos > 0 && previa.percentual === 0 ? <p>Com menos de uma semana até a partida, não há reembolso.</p> : null}
      {previa.tem_pagamento_a_tratar ? <p>Há um pagamento que a organização vai tratar à parte.</p> : null}
      <p className="hint">A regra considera a antecedência até o horário da partida: 100% com 14 dias ou mais, 50% de 7 a menos de 14 dias.</p>
    </>
  );
}

export function CancelarReserva({ id, aoCancelar, aoNegar }: { id: number; aoCancelar: (reserva: Reserva) => void; aoNegar: () => void }) {
  const [previa, setPrevia] = useState<PreviaCancelamento | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const consultar = async (mensagem: string | null = null) => {
    setErro(mensagem);
    setOcupado(true);
    const r = await reservasApi.previaCancelamento(id);
    setOcupado(false);
    if (r.ok) setPrevia(r.previa);
    else if (r.motivo === 'acesso') aoNegar();
    else setErro(r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível consultar o reembolso agora.');
  };

  const confirmar = async () => {
    if (previa === null) return;
    setErro(null);
    setOcupado(true);
    const r = await reservasApi.cancelar(id, previa.percentual);
    setOcupado(false);
    if (r.ok) {
      setPrevia(null);
      aoCancelar(r.reserva);
    } else if (r.motivo === 'recusa' && r.codigo === 'reembolso_mudou') {
      await consultar(MENSAGEM_RESERVA['reembolso_mudou'] ?? null);
    } else if (r.motivo === 'recusa') {
      setErro(MENSAGEM_RESERVA[r.codigo] ?? 'Não foi possível cancelar a reserva.');
    } else if (r.motivo === 'acesso') {
      aoNegar();
    } else {
      setErro(r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.');
    }
  };

  return (
    <section aria-labelledby="cancelar-titulo" className="panel">
      <h2 id="cancelar-titulo">Cancelar a reserva</h2>
      {erro ? <Notice kind="error">{erro}</Notice> : null}
      {previa === null ? (
        <button type="button" className="btn btn-danger" disabled={ocupado} onClick={() => void consultar()}>
          Cancelar reserva
        </button>
      ) : !previa.permitido ? (
        <>
          <Notice kind="info">{MENSAGEM_RESERVA[previa.motivo_impedimento ?? 'reserva_nao_cancelavel'] ?? 'Esta reserva não pode ser cancelada.'}</Notice>
          <button type="button" className="btn btn-secondary" onClick={() => setPrevia(null)}>
            Voltar
          </button>
        </>
      ) : (
        <div className="confirm" role="alertdialog" aria-labelledby="confirma-cancelamento">
          <p id="confirma-cancelamento">
            <strong>Cancelar esta reserva?</strong> A vaga é liberada e não é possível desfazer.
          </p>
          <Previa previa={previa} />
          <button type="button" className="btn btn-danger" disabled={ocupado} onClick={() => void confirmar()}>
            Confirmar cancelamento
          </button>{' '}
          <button type="button" className="btn btn-secondary" onClick={() => setPrevia(null)}>
            Voltar
          </button>
        </div>
      )}
    </section>
  );
}
