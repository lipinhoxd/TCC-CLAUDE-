# Interface pública (AGT-004)

Front-end em React que implementa a estrutura pública (RF-007 e RF-008) sobre a API de autenticação
da AGT-003 (`docs/autenticacao.md`). Não há listagem de excursões, reservas, pagamentos nem área do
passageiro ou administrativa.

## Decisões do pesquisador (13/11/2026)

| Ponto | Decisão |
| --- | --- |
| Roteamento | Roteador mínimo próprio sobre a History API (`src/router.tsx`), sem dependência. URLs limpas. |
| Estilização | CSS puro com variáveis, em `src/styles.css`. Fonte do sistema, nenhum recurso externo. |
| Identidade visual | Marca "BPM Trip" (configurável por `VITE_APP_NAME`), azul-petróleo como cor principal e laranja escuro nos botões de ação; sem logotipo nem imagens. |
| Textos | Provisórios e identificados como tais; contato fictício (`contato@exemplo.com.br`, `(00) 0000-0000`). |

## Rotas do front-end

| Caminho | Página |
| --- | --- |
| `/` | Home |
| `/excursoes` | Excursões (estado vazio explicativo; não consulta dados) |
| `/sobre` | Sobre |
| `/como-funciona` | Como funciona |
| `/contato` | Contato (dados fictícios; sem formulário de envio) |
| `/cadastro` | Cadastro |
| `/login` | Login |
| qualquer outra | Página não encontrada, com link para a Home |

Cada página tem título principal (`h1`) e título de aba próprios. A barra final da URL é ignorada.

## Estrutura do código

| Arquivo | Responsabilidade |
| --- | --- |
| `src/router.tsx` | Roteador (`RouterProvider`, `Link`, `useRouter`) e mensagem de aviso de uma só exibição. |
| `src/session.tsx` | Estado de sessão: consulta `GET /api/me` ao carregar; `login`, `register` e `logout` sobre a API. |
| `src/api.ts` | Cliente de `fetch` na mesma origem; trata falha de rede e `Retry-After`. |
| `src/Layout.tsx` | Cabeçalho, menu, rodapé, link para pular ao conteúdo e foco ao trocar de página. |
| `src/pages/` | `InfoPages.tsx` (páginas institucionais) e `AuthPages.tsx` (cadastro e login). |
| `src/ui.tsx` | Campo de formulário, avisos, título de aba e nome da aplicação. |

## Sessão e segurança

- O servidor é a autoridade: o front-end só mostra o estado que `GET /api/me` devolve e não decide autorização.
- O cookie `sid` é HttpOnly e SameSite=Strict e não é lido pelo front-end. O front-end não grava senha,
  token, CPF nem e-mail em `localStorage`, `sessionStorage` ou console; a senha existe só no estado do
  componente durante o envio.
- Depois de um cadastro bem-sucedido, o front-end chama o login com os mesmos dados para entrar na conta.
- Mensagens: credenciais inválidas têm texto único; excesso de tentativas (429) mostra o tempo do
  `Retry-After`; cadastro duplicado não diz qual dado repetiu; falha de rede tem aviso próprio.

## Como rodar

```
npm run dev:api    # terminal 1: API em http://127.0.0.1:3001 (cria e migra o banco local)
npm run dev        # terminal 2: front-end em http://127.0.0.1:5173
```

O Vite encaminha `/api` para a API (`vite.config.ts`), o que mantém front-end e API na **mesma origem**
no navegador. Isso é necessário porque o cookie é `SameSite=Strict`.

**Implantação futura:** o servidor web que entregar o front-end precisa (1) devolver `index.html` para
qualquer caminho que não seja arquivo estático, senão atualizar a página em `/sobre` dá erro 404, e
(2) servir `/api` na mesma origem, por proxy reverso. Nada disso foi configurado nesta atividade.

## Acessibilidade e responsividade

Link "Pular para o conteúdo", `main` focado a cada troca de página, páginas com `h1` único, rótulos e
dicas ligados aos campos por `aria-describedby`, `aria-invalid` nos campos com erro, foco visível,
`aria-current="page"` no menu e botão Menu com `aria-expanded` abaixo de 48 rem. Alvos de toque com
pelo menos 2,75 rem. Sem rolagem horizontal verificada em 390 px e 1280 px.

## Testes

- `tests/web-navegacao.test.tsx` (20 testes): páginas, rota desconhecida, menu, página atual, título,
  voltar, foco, link de pular, menu de celular, cliques com Ctrl, ausência de recursos externos.
- `tests/web-sessao.test.tsx` (20 testes): estado de visitante e autenticado, saída e sua falha, falha
  de verificação, login (sucesso, 401, 429, rede, vazio), cadastro (vazio, erros da API, duplicado,
  sucesso, login automático que falha, rede) e ausência de dados sensíveis no navegador.
- Ferramentas de teste de interface (dependências de desenvolvimento): `jsdom` 31.0.1,
  `@testing-library/react` 16.3.3 e `@testing-library/dom` 10.4.2. O ambiente `jsdom` é pedido só nos
  arquivos de teste de interface; o restante continua em `node`.

## Limitações conhecidas

1. Textos institucionais e contato são provisórios e fictícios; a identidade visual não tem logotipo.
2. Verificação em navegador feita só no Microsoft Edge (Chromium) sem cabeça; Firefox e Safari não foram
   testados (RNF-017). Não houve teste com leitor de tela.
3. O contraste das cores foi calculado à mão e registrado em comentário no CSS; não há verificação automática.
4. O cadastro não pede confirmação de senha, e a validação de CPF, telefone e idade é feita só no servidor.
5. A área de autenticação do cabeçalho fica vazia até a primeira resposta de `GET /api/me`.
6. Recuperação de acesso e edição de perfil não têm tela (AGT-011).
7. Sem configuração de implantação (servidor estático com fallback e proxy de `/api`).
8. Para sair, o front-end depende da resposta da API; se ela falhar, a sessão permanece e o erro é mostrado.
