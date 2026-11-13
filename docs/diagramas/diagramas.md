# Diagramas (Mermaid)

Todos os diagramas derivam de documentos reais do projeto. Nenhum esquema físico foi inventado:
o banco do experimento principal **ainda não existe** (AGT-002 não executada).

## 1. Modelo entidade-relacionamento **conceitual**

Fonte: `docs/especificacao/06-MODELO-DE-DADOS.md` (TCC, Seção 4.7). **É conceitual, não o esquema do
banco.** O ER do esquema real será gerado depois da AGT-002.

```mermaid
erDiagram
    USUARIO ||--o{ RESERVA : "possui"
    EXCURSAO ||--o{ RESERVA : "recebe"
    RESERVA ||--o{ PAGAMENTO : "tem"
    RESERVA ||--o{ RETENCAO_VAGA : "gera"
    RESERVA ||--o{ REEMBOLSO : "pode gerar"
    USUARIO ||--o{ SESSAO_TOKEN : "possui"
    HISTORICO_AUDITORIA }o..o{ USUARIO : "referencia"
    HISTORICO_AUDITORIA }o..o{ EXCURSAO : "referencia"
    HISTORICO_AUDITORIA }o..o{ RESERVA : "referencia"

    USUARIO {
        texto nome_completo
        texto cpf "unico"
        texto email "unico"
        data data_nascimento
        texto telefone_whatsapp
        texto hash_senha
        texto perfil
    }
    EXCURSAO {
        texto nome
        texto local
        data datas_inicial_final
        inteiro capacidade
        inteiro preco_centavos
        booleano parcelamento
        texto situacao
    }
    RESERVA {
        texto modalidade
        texto situacao
    }
    PAGAMENTO {
        texto parcela
        inteiro valor_centavos
        texto situacao
    }
    RETENCAO_VAGA {
        instante criacao
        instante expiracao
        texto situacao
    }
    REEMBOLSO {
        inteiro valor_centavos
        decimal percentual
        texto situacao
    }
```

Restrições conceituais: ocupação nunca excede a capacidade (RN-021); valores em centavos (RN-038);
instantes em UTC (RN-039).

## 2. Arquitetura por áreas

Fonte: `docs/especificacao/01-VISAO-GERAL.md` e estado atual do código (AGT-001, `d65d64f`).

```mermaid
flowchart LR
    V[Visitante] --> P[Área pública]
    PA[Passageiro autenticado] --> AP[Área do passageiro]
    AD[Administrador] --> AA[Área administrativa]
    subgraph FE["Front-end (React + Vite + TypeScript)"]
        P
        AP
        AA
    end
    FE -->|"/api (proxy em desenvolvimento)"| API["API Node.js (node:http)"]
    API --> DB[("Banco relacional<br/>tecnologia a decidir na AGT-002")]
```

Hoje existe apenas a fundação: uma página inicial e a rota `GET /api/health`. As áreas e o banco são
atividades futuras.

## 3. Fluxo experimental

Fonte: Seção 3.5 do TCC e `TCC/MODELO-REGISTRO-AGT.md`.

```mermaid
flowchart TD
    A[Instrução original escrita e aprovada pelo pesquisador] --> B[Registro AGT-XXX criado]
    B --> C[Execução pelo agente: tentativa]
    C --> D[Lint, tipos, testes e build]
    D --> E[Relatório do agente]
    E --> F[Avaliação humana]
    F -->|correção pelo agente| C
    F --> G{Classificação<br/>AP-1, AP-2, AP-3 ou RP}
    G --> H[Registro em METRICAS.csv e ficha AGT]
    H --> I[Commit]
```

## 4. Fluxos críticos (planejados)

Fonte: `docs/especificacao/05-FLUXOS-E-ESTADOS.md` e `04-REGRAS-DE-NEGOCIO.md`. Ainda **não
implementados** no experimento principal.

### 4.1 Reserva e retenção de vagas

```mermaid
flowchart TD
    A[Passageiro autenticado escolhe a excursão] --> B{Há vaga disponível?}
    B -- não --> X[Reserva não criada]
    B -- sim --> C[Escolhe a modalidade de pagamento]
    C --> D[Checkout com retenção temporária de vaga]
    D --> E{Pagamento confirmado<br/>antes da expiração?}
    E -- sim --> F[Retenção convertida em ocupação]
    E -- não --> G[Retenção expirada; vaga liberada]
```

Situações da reserva: `Aguardando pagamento` → `Pronto para embarque` → `Concluída`; `Cancelada` a
partir de qualquer situação não final.

### 4.2 Pagamento

```mermaid
flowchart TD
    A[Modalidade] --> B{Integral ou parcelado?}
    B -- integral --> C[Confirmação do pagamento]
    C --> D[Pronto para embarque]
    B -- parcelado --> E[Confirmação da 1ª parcela: vaga ocupada]
    E --> F{2ª parcela paga<br/>até a data-limite?}
    F -- sim --> D
    F -- não --> G[Vaga liberada; 1ª parcela não reembolsável]
```

### 4.3 Cancelamento e reembolso

```mermaid
flowchart TD
    A[Cancelamento] --> B{Quem cancela?}
    B -- organização --> C[Reembolso integral dos valores pagos]
    B -- passageiro --> D{Antecedência}
    D -- "2 semanas ou mais" --> E[100% do valor elegível]
    D -- "entre 1 e 2 semanas" --> F[50% do valor elegível]
    D -- "menos de 1 semana" --> G[Sem reembolso]
```

Percentuais: TCC, Seção 4.5.4. A primeira parcela de reserva parcelada não quitada permanece não
reembolsável.
