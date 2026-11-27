# Auditoria de sincronia dos dados da AGT-018 (27/11/2026)

Gerada em 2026-11-27T18:47:41-03:00. Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-018-2026-11-27.md` entrega ao Gemini, comparados com o registro `AGT-018.md`, `METRICAS.csv`, o diário, `git log`, a ficha, a matriz, o quadro, `package.json`, as migrações, o código e `docs/especificacao/`. O Docs não foi lido nem alterado (última leitura: 26/11/2026, depois da AGT-012). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| D1 | Contagem do experimento principal | n = 18 de 18, todas AP-3 | `METRICAS.csv`: 18 linhas, 18 AP-3; quadro: n = 18 | OK |
| D2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| D3 | Datas e horários | Aprovação 26/11 22:17:32; decisões 27/11 18:03:56; "ap 3" 18:27:30; revisão até 18:44:28 | Registro, Seções 6, 11, 13 e 16; diário | OK |
| D4 | Duração | 18,92 min | `METRICAS.csv`: 18.92 | OK |
| D5 | Testes | 807 em 42 arquivos; 11 novos | `npm run check` no fechamento: 807 em 42 | OK |
| D6 | RNF | 22, 10 e 1 | `docs/revisao-tecnica-final.md`: 22, 10 e 1 | OK |
| D7 | Relatório x resultado final | Relatório: 9 em parte e RNF-030 aguardando | Final: 10 em parte, depois da revisão | Declarada |
| D8 | Migração e dependências | Sem mudança | `git diff` de `package.json`, `package-lock.json` e migrações entre 4e426cd e edcdb90: vazio | OK |
| D9 | Commits | edcdb90 e b5fcb73 | `git log` | OK |
| D10 | Especificação | Situações da retenção com o texto aprovado | `05-FLUXOS-E-ESTADOS.md` | OK |
| D11 | Matriz | RF-014 e RNF conferidos | `docs/matriz-rastreabilidade.md` | OK |
| D12 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-018.md` | OK |
| D13 | Quadro 3 (seção J) | n = 18; tentativas 17 e 1; testes 15 e 807; intervenção 18 | Calculado de `METRICAS.csv` | OK |
| D14 | Revisão humana | 8 de 10 itens, pela tela | Registro, Seção 11; o banco temporário da revisão foi apagado depois, e a corroboração citada fica só no registro | OK (declarada) |
| D15 | RN-044 | Correções de acesso sem leitura humana do código | Seção 11 | **Pendência dos pesquisadores** |
| D16 | Repositório publicado | Commits da AGT-018 ainda não enviados | `origin/main` em 4e426cd | OK |

## Pendências

- Conferência no Docs: pendente até os pesquisadores informarem que o Gemini aplicou (dossiês das AGT-013 a 018 e Parte A, conforme o que já foi enviado).
- Revisão humana do código das correções de acesso (itens 2 e 6 do roteiro).
- Segundo avaliador até 30/11/2026.
- Vulnerabilidades em ferramentas de desenvolvimento: decisão sobre atualizar.
- Pendências humanas adiadas: DOIs das referências 1 e 8; campos [INFORMAR]; examinadores; versão da ferramenta.
- Fora do alcance: o piloto (nada tocado).
