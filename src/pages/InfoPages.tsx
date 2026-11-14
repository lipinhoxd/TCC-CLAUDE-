import { Link } from '../router.tsx';
import { ProvisionalNotice, useAppName, usePageTitle } from '../ui.tsx';

/** Paginas institucionais (RF-007). Os textos sao provisorios e identificados como tais. */

export function Home() {
  const appName = useAppName();
  usePageTitle(appName);
  return (
    <>
      <section className="hero">
        <h1>{appName}</h1>
        <p className="lead">Excursões organizadas em um só lugar: consulte, reserve e acompanhe sua viagem.</p>
        <p className="actions">
          <Link to="/excursoes" className="btn btn-primary">
            Ver excursões
          </Link>
          <Link to="/como-funciona" className="btn btn-secondary">
            Como funciona
          </Link>
        </p>
      </section>
      <section aria-labelledby="home-destaques">
        <h2 id="home-destaques">O que você encontra aqui</h2>
        <ul className="cards">
          <li>
            <h3>Consulta de excursões</h3>
            <p>Veja as excursões publicadas e a disponibilidade de vagas.</p>
          </li>
          <li>
            <h3>Reserva e pagamento</h3>
            <p>Reserve sua vaga e escolha pagar de uma vez ou em duas parcelas, quando a excursão permitir.</p>
          </li>
          <li>
            <h3>Acompanhamento</h3>
            <p>Acompanhe suas reservas e pagamentos pela sua conta.</p>
          </li>
        </ul>
      </section>
      <ProvisionalNotice />
    </>
  );
}

export function Excursoes() {
  usePageTitle('Excursões');
  return (
    <>
      <h1>Excursões</h1>
      <section className="empty-state" aria-labelledby="excursoes-vazio">
        <h2 id="excursoes-vazio">Nenhuma excursão para mostrar ainda</h2>
        <p>
          As excursões publicadas aparecerão aqui, com datas, preço e vagas disponíveis. Esta página ainda não consulta
          excursões.
        </p>
        <p>
          <Link to="/como-funciona">Veja como funciona a reserva</Link>
        </p>
      </section>
    </>
  );
}

export function Sobre() {
  const appName = useAppName();
  usePageTitle('Sobre');
  return (
    <>
      <h1>Sobre</h1>
      <p>
        {appName} é uma plataforma para centralizar a gestão de excursões: usuários, excursões, reservas, pagamentos,
        vagas, cancelamentos e reembolsos.
      </p>
      <p>
        Há três perfis: o visitante consulta o conteúdo público, o passageiro tem conta e reservas, e o administrador
        configura as excursões e acompanha a operação.
      </p>
      <ProvisionalNotice />
    </>
  );
}

export function ComoFunciona() {
  usePageTitle('Como funciona');
  return (
    <>
      <h1>Como funciona</h1>
      <ol className="steps">
        <li>
          <strong>Crie sua conta.</strong> Informe seus dados e entre com e-mail e senha.
        </li>
        <li>
          <strong>Escolha uma excursão.</strong> Consulte as excursões publicadas e a disponibilidade de vagas.
        </li>
        <li>
          <strong>Reserve.</strong> A vaga fica retida por um tempo limitado enquanto você faz o pagamento.
        </li>
        <li>
          <strong>Pague.</strong> Pagamento integral ou, quando habilitado, em duas parcelas.
        </li>
        <li>
          <strong>Embarque.</strong> Com o pagamento confirmado, a reserva fica pronta para embarque.
        </li>
        <li>
          <strong>Precisou cancelar?</strong> O reembolso depende da antecedência do cancelamento.
        </li>
      </ol>
      <p>
        <Link to="/cadastro" className="btn btn-primary">
          Criar conta
        </Link>
      </p>
      <ProvisionalNotice />
    </>
  );
}

export function Contato() {
  usePageTitle('Contato');
  return (
    <>
      <h1>Contato</h1>
      <p className="notice notice-provisional">Os dados abaixo são fictícios e existem apenas para demonstração.</p>
      <dl className="contact-list">
        <dt>E-mail</dt>
        <dd>contato@exemplo.com.br</dd>
        <dt>Telefone</dt>
        <dd>(00) 0000-0000</dd>
        <dt>Atendimento</dt>
        <dd>Dias úteis, em horário a definir</dd>
      </dl>
    </>
  );
}

export function NaoEncontrada() {
  usePageTitle('Página não encontrada');
  return (
    <>
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe nesta plataforma.</p>
      <p>
        <Link to="/" className="btn btn-primary">
          Voltar para a Home
        </Link>
      </p>
    </>
  );
}
