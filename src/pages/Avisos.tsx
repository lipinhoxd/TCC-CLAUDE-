import { useEffect, useState } from 'react';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { listarAvisos } from '../avisos/avisos-api.ts';
import type { ResultadoAvisos } from '../avisos/avisos-api.ts';
import { dataBr } from '../formato.ts';
import { Link } from '../router.tsx';
import { useSession } from '../session.tsx';
import { Notice, usePageTitle } from '../ui.tsx';

/**
 * Avisos do passageiro (AGT-015, RF-040). So mostra o que o servidor gerou; o texto entra como texto simples (o React nao o interpreta
 * como HTML). O servidor decide quem pode ler.
 */

const instanteBr = (iso: string): string => {
  const { data, hora } = utcParaBrasilia(iso);
  return `${dataBr(data)} ${hora.slice(0, 5)}`;
};

function Restrito({ visitante }: { visitante: boolean }) {
  return (
    <>
      <h1>Avisos</h1>
      {visitante ? (
        <Notice kind="info">
          Entre na sua conta para ver seus avisos. <Link to="/login">Ir para o login</Link>
        </Notice>
      ) : (
        <Notice kind="error">Acesso restrito a passageiros.</Notice>
      )}
    </>
  );
}

export function Avisos() {
  usePageTitle('Avisos');
  const { status, user } = useSession();
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [resposta, setResposta] = useState<{ chave: string; resultado: ResultadoAvisos } | null>(null);
  const pode = status === 'ready' && user?.perfil === 'passageiro';
  const chave = `${pagina}:${versao}`;

  useEffect(() => {
    if (!pode) return;
    let ativo = true;
    void listarAvisos(pagina).then((resultado) => {
      if (ativo) setResposta({ chave: `${pagina}:${versao}`, resultado });
    });
    return () => {
      ativo = false;
    };
  }, [pode, pagina, versao]);

  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante />;
  if (user.perfil !== 'passageiro') return <Restrito visitante={false} />;
  // A resposta de outra pagina nao e mostrada enquanto a nova nao chega.
  const resultado = resposta?.chave === chave ? resposta.resultado : null;
  if (resultado === null) return <p aria-busy="true">Carregando avisos…</p>;
  if (!resultado.ok) {
    if (resultado.motivo === 'acesso') return <Restrito visitante={false} />;
    return (
      <>
        <h1>Avisos</h1>
        <Notice kind="error">{resultado.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar seus avisos agora.'}</Notice>
        <p>
          <button type="button" className="btn btn-secondary" onClick={() => setVersao((v) => v + 1)}>
            Tentar de novo
          </button>
        </p>
      </>
    );
  }

  const { avisos, total, limite } = resultado.dados;
  const paginas = Math.max(1, Math.ceil(total / limite));
  return (
    <>
      <h1>Avisos</h1>
      <p className="hint">Mudanças nas suas reservas, pagamentos e reembolsos. Um aviso pode levar alguns instantes para aparecer.</p>
      {avisos.length === 0 ? (
        <p>Você ainda não tem avisos.</p>
      ) : (
        <ul className="avisos">
          {avisos.map((a) => (
            <li key={a.id}>
              <h2>{a.assunto}</h2>
              <p className="hint">{instanteBr(a.evento_em)} (horário de Brasília)</p>
              {a.corpo.split('\n').map((linha, i) => (
                <p key={i}>{linha}</p>
              ))}
              <p>
                <Link to={`/reservas/${a.reserva_id}`}>Ver a reserva nº {a.reserva_id}</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
      {paginas > 1 ? (
        <nav aria-label="Páginas de avisos" className="actions">
          <button type="button" className="btn btn-secondary" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
            Mais recentes
          </button>
          <span>
            Página {pagina} de {paginas}
          </span>
          <button type="button" className="btn btn-secondary" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
            Mais antigos
          </button>
        </nav>
      ) : null}
    </>
  );
}
