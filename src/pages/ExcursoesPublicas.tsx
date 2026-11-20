import { useEffect, useState } from 'react';
import { centavosParaReais } from '../../shared/dinheiro.ts';
import { dataBr, parcelamentoTexto, vagasTexto } from '../formato.ts';
import type { ExcursaoPublica } from '../publico/excursoes-publicas-api.ts';
import { IMAGEM_VALIDA, consultaPublica } from '../publico/excursoes-publicas-api.ts';
import { Link } from '../router.tsx';
import { Notice, usePageTitle } from '../ui.tsx';

/** Consulta publica de excursoes (AGT-006, RF-015 a RF-017). So leitura; nenhum fluxo de reserva. */

const reais = (centavos: number): string => `R$ ${centavosParaReais(centavos)}`;

/** Imagem da excursao; sem imagem, ou se o arquivo nao carregar, mostra um bloco de cor com o nome (decisao 3). */
function ImagemExcursao({ excursao, grande = false }: { excursao: ExcursaoPublica; grande?: boolean }) {
  const [falhou, setFalhou] = useState(false);
  const classe = grande ? 'excursao-imagem excursao-imagem-grande' : 'excursao-imagem';
  const valida = excursao.imagem_ref !== null && IMAGEM_VALIDA.test(excursao.imagem_ref);
  if (!valida || falhou) {
    return (
      <div className={`${classe} img-placeholder cor-${excursao.id % 4}`} aria-hidden="true">
        <span>{excursao.nome}</span>
      </div>
    );
  }
  return <img className={classe} src={`/${excursao.imagem_ref ?? ''}`} alt="" loading="lazy" onError={() => setFalhou(true)} />;
}

function Vagas({ vagas }: { vagas: number }) {
  return <span className={vagas <= 0 ? 'vagas vagas-esgotada' : 'vagas'}>{vagasTexto(vagas)}</span>;
}

type Estado<T> = { fase: 'carregando' } | { fase: 'pronto'; dados: T } | { fase: 'falha'; motivo: 'nao_encontrada' | 'rede' | 'erro' };

export function ListaPublica() {
  usePageTitle('Excursões');
  const [estado, setEstado] = useState<Estado<ExcursaoPublica[]>>({ fase: 'carregando' });

  useEffect(() => {
    let ativo = true;
    void consultaPublica.listar().then((r) => {
      if (!ativo) return;
      setEstado(r.ok ? { fase: 'pronto', dados: r.dados } : { fase: 'falha', motivo: r.motivo });
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <>
      <h1>Excursões</h1>
      {estado.fase === 'carregando' ? <p aria-busy="true">Carregando excursões…</p> : null}
      {estado.fase === 'falha' ? (
        <Notice kind="error">
          {estado.motivo === 'rede' ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' : 'Não foi possível carregar as excursões agora. Tente novamente em instantes.'}
        </Notice>
      ) : null}
      {estado.fase === 'pronto' && estado.dados.length === 0 ? (
        <section className="empty-state" aria-labelledby="excursoes-vazio">
          <h2 id="excursoes-vazio">Nenhuma excursão disponível no momento</h2>
          <p>Quando houver excursões publicadas, elas aparecerão aqui, com datas, preço e vagas.</p>
          <p>
            <Link to="/como-funciona">Veja como funciona a reserva</Link>
          </p>
        </section>
      ) : null}
      {estado.fase === 'pronto' && estado.dados.length > 0 ? (
        <ul className="excursao-lista">
          {estado.dados.map((e) => (
            <li key={e.id}>
              <article className="excursao-card">
                <ImagemExcursao excursao={e} />
                <div className="excursao-corpo">
                  <h2>
                    <Link to={`/excursoes/${e.id}`}>{e.nome}</Link>
                  </h2>
                  <p className="excursao-meta">
                    {e.local} · {dataBr(e.data_inicial)}
                    {e.data_final !== e.data_inicial ? ` a ${dataBr(e.data_final)}` : ''}
                  </p>
                  <p className="excursao-preco">
                    <strong>{reais(e.preco_centavos)}</strong>
                    {e.parcelamento_habilitado ? <span className="hint"> ou em 2x</span> : null}
                  </p>
                  <p>
                    <Vagas vagas={e.vagas_disponiveis} />
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function DetalhePublico({ id }: { id: number }) {
  const [estado, setEstado] = useState<Estado<ExcursaoPublica>>({ fase: 'carregando' });
  usePageTitle(estado.fase === 'pronto' ? estado.dados.nome : 'Excursão');

  useEffect(() => {
    let ativo = true;
    void consultaPublica.obter(id).then((r) => {
      if (!ativo) return;
      setEstado(r.ok ? { fase: 'pronto', dados: r.dados } : { fase: 'falha', motivo: r.motivo });
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  if (estado.fase === 'carregando') return <p aria-busy="true">Carregando excursão…</p>;
  if (estado.fase === 'falha') {
    if (estado.motivo === 'nao_encontrada') {
      return (
        <>
          <h1>Excursão não encontrada</h1>
          <p>Esta excursão não existe ou não está disponível para consulta.</p>
          <p>
            <Link to="/excursoes" className="btn btn-primary">
              Ver todas as excursões
            </Link>
          </p>
        </>
      );
    }
    return (
      <>
        <h1>Excursão</h1>
        <Notice kind="error">
          {estado.motivo === 'rede' ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' : 'Não foi possível carregar a excursão agora. Tente novamente em instantes.'}
        </Notice>
        <p>
          <Link to="/excursoes">Voltar para a lista</Link>
        </p>
      </>
    );
  }

  const e = estado.dados;
  return (
    <>
      <p>
        <Link to="/excursoes">← Todas as excursões</Link>
      </p>
      <h1>{e.nome}</h1>
      <ImagemExcursao excursao={e} grande />
      <p className="excursao-destaque">
        <strong>{reais(e.preco_centavos)}</strong> · <Vagas vagas={e.vagas_disponiveis} />
      </p>
      {e.descricao !== '' ? <p className="excursao-descricao">{e.descricao}</p> : null}
      <dl className="detalhes">
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
        <dd>{parcelamentoTexto(e.parcelamento_habilitado, e.prazo_segunda_parcela)}</dd>
        <dt>Disponibilidade</dt>
        <dd>{vagasTexto(e.vagas_disponiveis)}</dd>
      </dl>
      <p className="notice notice-provisional">
        Reserva: será habilitada em uma próxima etapa. Este texto é provisório.
      </p>
    </>
  );
}
