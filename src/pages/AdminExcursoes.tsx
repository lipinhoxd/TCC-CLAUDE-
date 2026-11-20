import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { brasiliaParaUtc, utcParaBrasilia } from '../../shared/fuso.ts';
import { centavosParaReais, formatarReais, reaisParaCentavos } from '../../shared/dinheiro.ts';
import type { EventoHistorico, ExcursaoCompleta, ResumoExcursao, Situacao } from '../admin/excursoes-api.ts';
import {
  CAMPO_DO_FORMULARIO,
  MENSAGEM_DE_ERRO,
  ROTULO_ACAO,
  ROTULO_CAMPO,
  ROTULO_SITUACAO,
  excursoesApi,
  mensagemDeCampo,
} from '../admin/excursoes-api.ts';
import { Link, useRouter } from '../router.tsx';
import { useSession } from '../session.tsx';
import { CheckboxField, Field, Notice, TextAreaField, usePageTitle } from '../ui.tsx';

/** Area administrativa minima de excursoes (AGT-005). O servidor decide o acesso; aqui so se mostra o resultado. */

const dataBr = (data: string): string => data.split('-').reverse().join('/');
const instanteBr = (iso: string): string => {
  const { data, hora } = utcParaBrasilia(iso);
  return `${dataBr(data)} ${hora.slice(0, 5)}`;
};

function Restrito({ visitante }: { visitante: boolean }) {
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

/** Mostra o conteudo so para o administrador; visitante e passageiro veem aviso de acesso restrito. */
function SoAdministrador({ children, negado }: { children: ReactNode; negado?: boolean }) {
  const { status, user } = useSession();
  if (status === 'loading') return <p aria-busy="true">Carregando…</p>;
  if (user === null) return <Restrito visitante />;
  if (user.perfil !== 'administrador' || negado === true) return <Restrito visitante={false} />;
  return <>{children}</>;
}

/* ------------------------------------------------------------------ lista */

export function AdminExcursoes() {
  usePageTitle('Administração de excursões');
  return (
    <SoAdministrador>
      <ListaExcursoes />
    </SoAdministrador>
  );
}

function ListaExcursoes() {
  const [itens, setItens] = useState<ResumoExcursao[] | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    let ativo = true;
    void excursoesApi.listar().then((r) => {
      if (!ativo) return;
      if (r.ok) setItens(r.dados);
      else if (r.motivo === 'acesso') setNegado(true);
      else setFalha(r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar as excursões.');
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (negado) return <Restrito visitante={false} />;
  return (
    <>
      <h1>Excursões</h1>
      <p className="actions">
        <Link to="/admin/excursoes/nova" className="btn btn-primary">
          Nova excursão
        </Link>
      </p>
      {falha ? <Notice kind="error">{falha}</Notice> : null}
      {itens === null && falha === null ? <p aria-busy="true">Carregando…</p> : null}
      {itens !== null && itens.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma excursão cadastrada ainda</h2>
          <p>Crie a primeira. Ela nasce em Rascunho e só aparece ao público depois de publicada.</p>
        </section>
      ) : null}
      {itens !== null && itens.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Excursões cadastradas</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Situação</th>
                <th scope="col">Datas</th>
                <th scope="col">Vagas</th>
                <th scope="col">Preço</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    <Link to={`/admin/excursoes/${e.id}`}>{e.nome}</Link>
                  </th>
                  <td>
                    <span className={`badge badge-${e.situacao}`}>{ROTULO_SITUACAO[e.situacao]}</span>
                  </td>
                  <td>
                    {dataBr(e.data_inicial)} a {dataBr(e.data_final)}
                  </td>
                  <td>
                    {e.vagas_ocupadas} de {e.capacidade}
                  </td>
                  <td>
                    {formatarReais(e.preco_centavos)}
                    {e.parcelamento_habilitado ? ' (em 2x)' : ''}
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

/* ------------------------------------------------------------- formulario */

interface Formulario {
  nome: string;
  descricao: string;
  imagem_ref: string;
  local: string;
  ponto_embarque: string;
  data_inicial: string;
  data_final: string;
  partida: string;
  capacidade: string;
  preco: string;
  parcelamento: boolean;
  prazo: string;
}

const VAZIO: Formulario = {
  nome: '',
  descricao: '',
  imagem_ref: '',
  local: '',
  ponto_embarque: '',
  data_inicial: '',
  data_final: '',
  partida: '',
  capacidade: '',
  preco: '',
  parcelamento: false,
  prazo: '',
};

const ORDEM: (keyof Formulario)[] = ['nome', 'descricao', 'imagem_ref', 'local', 'ponto_embarque', 'data_inicial', 'data_final', 'partida', 'capacidade', 'preco', 'parcelamento', 'prazo'];

/** Campos do formulario que o servidor bloqueia com reserva ou retencao ativa (RN-036). */
const BLOQUEAVEIS: (keyof Formulario)[] = ['data_inicial', 'data_final', 'partida', 'capacidade', 'preco', 'parcelamento', 'prazo'];

function doServidor(e: ExcursaoCompleta): Formulario {
  const p = utcParaBrasilia(e.partida_utc);
  return {
    nome: e.nome,
    descricao: e.descricao,
    imagem_ref: e.imagem_ref ?? '',
    local: e.local,
    ponto_embarque: e.ponto_embarque,
    data_inicial: e.data_inicial,
    data_final: e.data_final,
    partida: `${p.data}T${p.hora.slice(0, 5)}`,
    capacidade: String(e.capacidade),
    preco: centavosParaReais(e.preco_centavos),
    parcelamento: e.parcelamento_habilitado,
    prazo: e.prazo_segunda_parcela ?? '',
  };
}

/** Monta o corpo da requisicao a partir dos campos pedidos: reais viram centavos e a partida de Brasilia vira UTC. */
function montarCorpo(f: Formulario, campos: readonly (keyof Formulario)[]): { corpo: Record<string, unknown>; erros: Record<string, string> } {
  const corpo: Record<string, unknown> = {};
  const erros: Record<string, string> = {};
  for (const campo of campos) {
    switch (campo) {
      case 'nome':
      case 'descricao':
      case 'imagem_ref':
      case 'local':
      case 'ponto_embarque':
      case 'data_inicial':
      case 'data_final':
        corpo[campo] = f[campo];
        break;
      case 'partida': {
        if (f.partida.trim() === '') {
          erros['partida'] = 'Preencha este campo.';
          break;
        }
        const [data = '', hora = ''] = f.partida.split('T');
        const utc = brasiliaParaUtc(data, hora);
        if (utc === null) erros['partida'] = 'Data e hora inválidas.';
        else corpo['partida_utc'] = utc.toISOString();
        break;
      }
      case 'capacidade': {
        if (f.capacidade.trim() === '') erros['capacidade'] = 'Preencha este campo.';
        else if (!/^\d+$/.test(f.capacidade.trim())) erros['capacidade'] = 'Informe um número inteiro.';
        else corpo['capacidade'] = Number(f.capacidade.trim());
        break;
      }
      case 'preco': {
        if (f.preco.trim() === '') {
          erros['preco'] = 'Preencha este campo.';
          break;
        }
        const centavos = reaisParaCentavos(f.preco);
        if (centavos === null) erros['preco'] = 'Informe o preço em reais, por exemplo 1.500,00.';
        else corpo['preco_centavos'] = centavos;
        break;
      }
      case 'parcelamento':
        corpo['parcelamento_habilitado'] = f.parcelamento;
        break;
      case 'prazo':
        corpo['prazo_segunda_parcela'] = f.parcelamento && f.prazo !== '' ? f.prazo : null;
        break;
    }
  }
  return { corpo, erros };
}

function resumoDoEvento(e: EventoHistorico): string {
  if (e.acao === 'excursao.situacao_alterada') {
    const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
    const de = texto(e.estado_anterior?.['situacao']);
    const para = texto(e.estado_novo?.['situacao']);
    const rotulo = (s: string): string => (s in ROTULO_SITUACAO ? ROTULO_SITUACAO[s as Situacao] : s);
    return `${rotulo(de)} → ${rotulo(para)}`;
  }
  if (e.acao === 'excursao.editada') {
    const campos = Object.keys(e.estado_novo ?? {}).map((c) => ROTULO_CAMPO[c] ?? c);
    return `Campos: ${campos.join(', ')}`;
  }
  return 'Criada em Rascunho';
}

const ROTULO_BOTAO: Record<Situacao, string> = {
  publicada: 'Publicar',
  encerrada: 'Encerrar vendas',
  rascunho: 'Voltar para rascunho',
  cancelada: 'Cancelar excursão',
};

interface FormularioProps {
  /** Ausente: criacao de nova excursao. */
  id?: number;
}

export function FormularioExcursao({ id }: FormularioProps) {
  usePageTitle(id === undefined ? 'Nova excursão' : 'Editar excursão');
  return (
    <SoAdministrador>
      <EditorExcursao {...(id === undefined ? {} : { id })} />
    </SoAdministrador>
  );
}

function EditorExcursao({ id }: FormularioProps) {
  const { navigate, clearFlash } = useRouter();
  const [excursao, setExcursao] = useState<ExcursaoCompleta | null>(null);
  const [inicial, setInicial] = useState<Formulario>(VAZIO);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tipo: 'info' | 'success' | 'error'; texto: string; recarregar?: boolean } | null>(null);
  const [carregando, setCarregando] = useState(id !== undefined);
  const [falha, setFalha] = useState<'nao_encontrada' | 'rede' | 'erro' | null>(null);
  const [negado, setNegado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [historico, setHistorico] = useState<EventoHistorico[] | null>(null);
  const [foco, setFoco] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (id === undefined) return;
    setCarregando(true);
    const r = await excursoesApi.obter(id);
    if (r.ok) {
      setExcursao(r.dados);
      setInicial(doServidor(r.dados));
      setForm(doServidor(r.dados));
      setFalha(null);
    } else if (r.motivo === 'acesso') {
      setNegado(true);
    } else {
      setFalha(r.motivo === 'nao_encontrada' ? 'nao_encontrada' : r.motivo === 'rede' ? 'rede' : 'erro');
    }
    setCarregando(false);
    const h = await excursoesApi.historico(id);
    if (h.ok) setHistorico(h.dados);
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (foco !== null) {
      document.getElementById(foco)?.focus();
      setFoco(null);
    }
  }, [foco]);

  if (negado) return <Restrito visitante={false} />;
  if (carregando) return <p aria-busy="true">Carregando…</p>;
  if (falha === 'nao_encontrada') {
    return (
      <>
        <h1>Excursão não encontrada</h1>
        <p>
          <Link to="/admin/excursoes">Voltar para a lista</Link>
        </p>
      </>
    );
  }
  if (falha !== null) {
    return (
      <>
        <h1>Editar excursão</h1>
        <Notice kind="error">
          {falha === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível carregar a excursão.'}
        </Notice>
        <p>
          <button type="button" className="btn btn-secondary" onClick={() => void carregar()}>
            Tentar de novo
          </button>
        </p>
      </>
    );
  }

  const editando = excursao !== null;
  const cancelada = excursao?.situacao === 'cancelada';
  const restrita = excursao?.edicao_restrita === true;
  const alterado = ORDEM.some((c) => form[c] !== inicial[c]);
  const travado = (campo: keyof Formulario): boolean => cancelada === true || (restrita && BLOQUEAVEIS.includes(campo));

  const set = (campo: keyof Formulario) => (evento: { target: { value: string } }) => {
    setForm((atual) => ({ ...atual, [campo]: evento.target.value }));
  };
  const dica = (campo: keyof Formulario, texto?: string): { hint?: string } => {
    const base = restrita && BLOQUEAVEIS.includes(campo) ? 'Bloqueado: há reserva ou retenção ativa.' : texto;
    return base === undefined ? {} : { hint: base };
  };

  const recusar = (campos: Record<string, string>, codigo: string) => {
    const mapeados: Record<string, string> = {};
    for (const [campo, c] of Object.entries(campos)) {
      mapeados[CAMPO_DO_FORMULARIO[campo] ?? campo] = mensagemDeCampo(campo, c);
    }
    setErros(mapeados);
    setAviso({ tipo: 'error', texto: MENSAGEM_DE_ERRO[codigo] ?? 'Não foi possível salvar.', recarregar: codigo === 'conflito_de_edicao' });
    setFoco(ORDEM.find((c) => mapeados[c] !== undefined) ?? null);
  };

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    clearFlash();
    setAviso(null);
    setErros({});
    const campos = editando ? ORDEM.filter((c) => form[c] !== inicial[c] && !travado(c)) : ORDEM;
    if (editando && campos.length === 0) {
      setAviso({ tipo: 'info', texto: 'Nenhuma alteração para salvar.' });
      return;
    }
    const comPrazo = campos.includes('parcelamento') && !campos.includes('prazo') ? [...campos, 'prazo' as const] : campos;
    const { corpo, erros: locais } = montarCorpo(form, comPrazo);
    if (Object.keys(locais).length > 0) {
      setErros(locais);
      setAviso({ tipo: 'error', texto: MENSAGEM_DE_ERRO['validacao'] ?? '' });
      setFoco(ORDEM.find((c) => locais[c] !== undefined) ?? null);
      return;
    }
    setOcupado(true);
    const r =
      editando && id !== undefined && excursao !== null
        ? await excursoesApi.editar(id, { ...corpo, versao: excursao.versao })
        : await excursoesApi.criar(corpo);
    setOcupado(false);
    if (r.ok) {
      if (editando) {
        setExcursao(r.dados);
        setInicial(doServidor(r.dados));
        setForm(doServidor(r.dados));
        setAviso({ tipo: 'success', texto: 'Alterações salvas.' });
        if (id !== undefined) void excursoesApi.historico(id).then((h) => h.ok && setHistorico(h.dados));
      } else {
        navigate(`/admin/excursoes/${r.dados.id}`, { flash: 'Excursão criada em Rascunho. Publique quando estiver pronta.' });
      }
    } else if (r.motivo === 'recusa') {
      recusar(r.campos, r.codigo);
    } else if (r.motivo === 'acesso') {
      setNegado(true);
    } else {
      setAviso({ tipo: 'error', texto: r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.' });
    }
  };

  const mudar = async (para: Situacao) => {
    if (excursao === null || id === undefined) return;
    if (para === 'cancelada' && !confirmarCancelamento) {
      setConfirmarCancelamento(true);
      return;
    }
    setConfirmarCancelamento(false);
    clearFlash();
    setAviso(null);
    setOcupado(true);
    const r = await excursoesApi.mudarSituacao(id, para, excursao.versao);
    setOcupado(false);
    if (r.ok) {
      setExcursao(r.dados);
      setInicial(doServidor(r.dados));
      setForm(doServidor(r.dados));
      setAviso({ tipo: 'success', texto: `Situação alterada para ${ROTULO_SITUACAO[r.dados.situacao]}.` });
      void excursoesApi.historico(id).then((h) => h.ok && setHistorico(h.dados));
    } else if (r.motivo === 'recusa') {
      const detalhes = Object.entries(r.campos).map(([c, codigo]) => mensagemDeCampo(c, codigo));
      setAviso({
        tipo: 'error',
        texto: [MENSAGEM_DE_ERRO[r.codigo] ?? 'Não foi possível mudar a situação.', ...detalhes].join(' '),
        recarregar: r.codigo === 'conflito_de_edicao',
      });
    } else if (r.motivo === 'acesso') {
      setNegado(true);
    } else {
      setAviso({ tipo: 'error', texto: r.motivo === 'rede' ? 'Sem conexão com o servidor. Tente novamente.' : 'Algo deu errado. Tente novamente em instantes.' });
    }
  };

  return (
    <>
      <p>
        <Link to="/admin/excursoes">← Voltar para a lista</Link>
      </p>
      <h1>
        {editando ? 'Editar excursão' : 'Nova excursão'}
        {excursao ? <span className={`badge badge-${excursao.situacao}`}>{ROTULO_SITUACAO[excursao.situacao]}</span> : null}
      </h1>
      {aviso ? (
        <>
          <Notice kind={aviso.tipo}>{aviso.texto}</Notice>
          {aviso.recarregar ? (
            <p>
              <button type="button" className="btn btn-secondary" onClick={() => void carregar().then(() => setAviso(null))}>
                Recarregar
              </button>
            </p>
          ) : null}
        </>
      ) : null}
      {cancelada ? <Notice kind="info">Excursão cancelada: não pode mais ser editada nem mudar de situação.</Notice> : null}
      {restrita && !cancelada ? (
        <Notice kind="info">
          Há reserva ou retenção ativa. Preço, capacidade, parcelamento, prazo, datas e partida estão bloqueados. Nome, descrição, imagem, local e ponto de embarque podem ser editados.
        </Notice>
      ) : null}
      <form className="form form-wide" onSubmit={(e) => void salvar(e)} noValidate>
        <Field name="nome" label="Nome" value={form.nome} onChange={set('nome')} error={erros['nome']} disabled={travado('nome')} />
        <TextAreaField name="descricao" label="Descrição" value={form.descricao} onChange={set('descricao')} error={erros['descricao']} disabled={travado('descricao')} />
        <Field
          name="imagem_ref"
          label="Imagem (opcional)"
          hint="Caminho dentro da pasta de imagens do projeto, por exemplo imagens/serra.jpg. Não há envio de arquivo."
          value={form.imagem_ref}
          onChange={set('imagem_ref')}
          error={erros['imagem_ref']}
          disabled={travado('imagem_ref')}
        />
        <Field name="local" label="Local" value={form.local} onChange={set('local')} error={erros['local']} disabled={travado('local')} />
        <Field name="ponto_embarque" label="Ponto de embarque" value={form.ponto_embarque} onChange={set('ponto_embarque')} error={erros['ponto_embarque']} disabled={travado('ponto_embarque')} />
        <Field name="data_inicial" label="Data inicial" type="date" value={form.data_inicial} onChange={set('data_inicial')} error={erros['data_inicial']} disabled={travado('data_inicial')} {...dica('data_inicial')} />
        <Field name="data_final" label="Data final" type="date" value={form.data_final} onChange={set('data_final')} error={erros['data_final']} disabled={travado('data_final')} {...dica('data_final')} />
        <Field
          name="partida"
          label="Partida (horário de Brasília)"
          type="datetime-local"
          value={form.partida}
          onChange={set('partida')}
          error={erros['partida']}
          disabled={travado('partida')}
          {...dica('partida', 'Na data inicial ou no dia anterior.')}
        />
        <Field
          name="capacidade"
          label="Capacidade (vagas)"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={form.capacidade}
          onChange={set('capacidade')}
          error={erros['capacidade']}
          disabled={travado('capacidade')}
          {...dica('capacidade', editando && excursao ? `Vagas ocupadas: ${excursao.vagas_ocupadas}.` : 'De 1 a 1.000.')}
        />
        <Field
          name="preco"
          label="Preço (R$)"
          inputMode="decimal"
          value={form.preco}
          onChange={set('preco')}
          error={erros['preco']}
          disabled={travado('preco')}
          {...dica('preco', 'Em reais, por exemplo 1.500,00.')}
        />
        <CheckboxField
          name="parcelamento"
          label="Permitir pagamento em duas parcelas de 50%"
          checked={form.parcelamento}
          onChange={(e) => setForm((atual) => ({ ...atual, parcelamento: e.target.checked }))}
          error={erros['parcelamento']}
          disabled={travado('parcelamento')}
          {...dica('parcelamento')}
        />
        {form.parcelamento ? (
          <Field
            name="prazo"
            label="Prazo da segunda parcela"
            type="date"
            value={form.prazo}
            onChange={set('prazo')}
            error={erros['prazo_segunda_parcela'] ?? erros['prazo']}
            disabled={travado('prazo')}
            {...dica('prazo', 'Antes do dia da partida; vale até 23:59:59 desta data.')}
          />
        ) : null}
        {cancelada ? null : (
          <button type="submit" className="btn btn-primary" disabled={ocupado}>
            {ocupado ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar excursão'}
          </button>
        )}
      </form>

      {excursao && !cancelada ? (
        <section aria-labelledby="situacao-titulo" className="panel">
          <h2 id="situacao-titulo">Situação</h2>
          <p>
            Atual: <strong>{ROTULO_SITUACAO[excursao.situacao]}</strong>. Publicar é uma ação separada do cadastro.
          </p>
          {alterado ? <p className="hint">Salve ou descarte as alterações do formulário antes de mudar a situação.</p> : null}
          <ul className="actions-list">
            {excursao.transicoes.map((t) => (
              <li key={t.para}>
                <button
                  type="button"
                  className={t.para === 'cancelada' ? 'btn btn-danger' : 'btn btn-secondary'}
                  disabled={ocupado || alterado || !t.disponivel}
                  onClick={() => void mudar(t.para)}
                >
                  {ROTULO_BOTAO[t.para]}
                </button>
                {!t.disponivel ? <span className="hint"> Indisponível: há reservas ou retenções ativas.</span> : null}
              </li>
            ))}
          </ul>
          {confirmarCancelamento ? (
            <div className="confirm" role="alertdialog" aria-labelledby="confirma-titulo">
              <p id="confirma-titulo">
                <strong>Cancelar esta excursão?</strong> Ela deixa de aceitar alterações e não volta a outra situação.
              </p>
              <button type="button" className="btn btn-danger" onClick={() => void mudar('cancelada')} disabled={ocupado}>
                Confirmar cancelamento
              </button>{' '}
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmarCancelamento(false)}>
                Voltar
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {editando ? (
        <section aria-labelledby="historico-titulo" className="panel">
          <h2 id="historico-titulo">Histórico</h2>
          {historico === null ? <p aria-busy="true">Carregando…</p> : null}
          {historico !== null && historico.length === 0 ? <p>Sem eventos registrados.</p> : null}
          {historico !== null && historico.length > 0 ? (
            <ol className="history">
              {historico.map((h) => (
                <li key={h.id}>
                  <strong>{ROTULO_ACAO[h.acao] ?? h.acao}</strong> · {resumoDoEvento(h)}
                  <br />
                  <span className="hint">
                    {instanteBr(h.ocorrido_em)} (Brasília){h.ator_usuario_id === null ? '' : ` · administrador nº ${h.ator_usuario_id}`}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
