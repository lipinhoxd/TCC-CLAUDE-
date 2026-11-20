# Consulta pública de excursões (AGT-006)

Rotas públicas de leitura e páginas de lista e de detalhe (RF-015, RF-016 e a parte do RF-017 que depende
só de capacidade e vagas ocupadas), sobre a tabela `excursao` da AGT-002 e o cadastro da AGT-005. Não há
reserva, retenção de vaga, pagamento, busca nem filtros.

## Decisões do pesquisador (19/11/2026, "todas as recomendadas")

| Ponto | Decisão |
| --- | --- |
| Quais excursões | Só as **publicadas**. Encerradas, rascunhos e canceladas não aparecem. Publicadas cuja data final já passou (em Brasília) ficam ocultas. |
| Ordem e limite | Da data inicial mais próxima para a mais distante, desempatando pelo id. Até 100 por resposta, sem paginação. |
| Disponibilidade | Número exato de vagas livres ("12 vagas disponíveis"); "Esgotada" quando zero, e a excursão esgotada continua na lista. A capacidade total e a ocupação não são expostas. |
| Parcelamento | Mostrado só quando habilitado: "Em até 2x de 50%. A segunda parcela vence em DD/MM/AAAA." Senão, "Pagamento integral." |
| Imagens | Pasta `public/imagens/`, servida pelo Vite. Sem imagem, com caminho inválido ou se o arquivo não carregar, a tela mostra um bloco de cor com o nome. As imagens reais são fornecidas pelo pesquisador. |
| Dados de demonstração | `npm run seed:demo` (ver abaixo). |
| Reserva | Nenhum botão nem fluxo; a página de detalhe traz um texto provisório avisando que a reserva virá depois. |

## Rotas públicas

Só `GET`, sem login e sem ler a sessão. Outros métodos respondem 405 com `Allow: GET`.

| Rota | Resultado |
| --- | --- |
| `GET /api/excursoes` | `{ "excursoes": [...] }` com as excursões visíveis, nesta ordem, até 100. |
| `GET /api/excursoes/:id` | `{ "excursao": {...} }`, ou 404 `nao_encontrada` se a excursão não existir **ou** não estiver visível (a resposta é a mesma, para não revelar rascunhos e canceladas). |

Campos da resposta (a lista exata, RNF-028): `id`, `nome`, `descricao`, `imagem_ref`, `local`, `ponto_embarque`,
`data_inicial`, `data_final`, `partida_utc`, `partida_brasilia` (`data` e `hora`), `preco_centavos`,
`parcelamento_habilitado`, `prazo_segunda_parcela` (data, ou `null`) e `vagas_disponiveis`.
**Não são expostos:** capacidade, vagas ocupadas, situação, versão, datas de criação e atualização, bloqueios de edição,
transições, instante UTC do prazo, identificadores de auditoria nem dados de pessoas. `imagem_ref` só sai se ainda
seguir o formato validado na AGT-005 (`imagens/nome.jpg`, `.jpeg`, `.png` ou `.webp`); qualquer outro valor sai como `null`.

`vagas_disponiveis` = capacidade menos vagas ocupadas, nunca negativa (`server/excursoes/publico.ts`).
**Limitação:** a retenção temporária de vaga (RN-014, RN-015) só existe na AGT-008; até lá ela não reduz o número exibido.

## Interface

| Caminho | Página |
| --- | --- |
| `/excursoes` | Lista em cartões: imagem ou bloco de cor, nome (link), local, datas, preço, "ou em 2x" e vagas. Estados de carregamento, vazio, erro do servidor e falha de rede. |
| `/excursoes/:id` | Detalhe: imagem, preço e vagas em destaque, descrição, local, ponto de embarque, datas, partida em Brasília, pagamento e disponibilidade. Excursão inexistente ou não visível: "Excursão não encontrada". |

Datas `AAAA-MM-DD` são formatadas como texto, sem `Date`, para não sofrerem deslocamento de fuso. O preço vem de
centavos inteiros (`shared/dinheiro.ts`) e a partida de Brasília já vem pronta da API (`shared/fuso.ts`).

## Imagens

Coloque os arquivos em `public/imagens/` e informe `imagens/nome.jpg` no cadastro da excursão (tela de administração).
Não há envio de arquivo. Na implantação, o servidor que entregar o front-end precisa servir essa pasta (o `vite build`
a copia para `dist/imagens/`). Nenhuma imagem de terceiros é versionada.

## Dados de demonstração

`npm run seed:demo` cria seis excursões fictícias, todas com o prefixo "[Demonstração]", pelo serviço de excursões
existente: quatro visíveis (uma com parcelamento e imagem inexistente, uma sem imagem, uma esgotada, uma com 2 vagas) e
duas que a consulta pública esconde (um rascunho e uma encerrada). Exige o administrador (`npm run admin:create`),
recusa rodar com `NODE_ENV=production`, não apaga nada e, se os dados já existirem, não altera nada. A ocupação das
excursões de demonstração é fixada direto no banco, só para a demonstração (ainda não há fluxo de reserva); a restrição
do banco que impede ocupação acima da capacidade continua valendo.

## Limitações conhecidas

1. A retenção temporária de vaga não entra na disponibilidade (AGT-008).
2. Lista limitada a 100 excursões, sem paginação, busca nem filtros.
3. A pasta `public/imagens/` está vazia; as imagens reais dependem do pesquisador.
4. Não há cache: cada visita consulta o banco (`Cache-Control: no-store`). Para a escala atual basta (RNF-011 não foi medido).
5. As rotas públicas não têm limite de requisições.
6. O texto sobre a reserva é provisório.
7. Verificação em navegador só no Microsoft Edge (Chromium), sem leitor de tela.
