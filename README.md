# Dashboard Eleitoral

Aplicação web para acompanhar deputados federais brasileiros — votos, projetos de lei, presença em eventos e gastos com a cota parlamentar (CEAP). Dados obtidos em tempo real pela [API de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/swagger/api.html).

## Funcionalidades

**Página inicial** — lista todos os deputados da 57ª legislatura com busca por nome, filtro por partido e por estado. Exibe contadores de deputados encontrados, partidos e estados representados.

**Perfil do deputado** — página dedicada a cada deputado com:
- Resumo: votações registradas, projetos apresentados, taxa de presença e total gasto no CEAP no ano
- Informações do gabinete (prédio, sala, telefone)
- Aba **Votos** — histórico de votações com distribuição em gráfico de pizza e lista filtrável
- Aba **Projetos** — proposições apresentadas na legislatura
- Aba **Presença** — eventos parlamentares com situação
- Aba **Gastos** — despesas CEAP com gráfico de área mensal, breakdown por categoria e tabela de lançamentos recentes

**Ranking** — comparativo entre deputados filtráveis por partido/UF, com pódio de presença, pódio de produtividade legislativa e lista completa.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Gráficos | Recharts |
| Fetching / cache | TanStack Query v5 |
| Ícones | Lucide React |
| Tipagem | TypeScript 5 |

## Pré-requisitos

- Node.js 20+
- npm (ou pnpm/yarn)

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

```bash
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # linting
```

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx                          # Listagem de deputados (home)
│   ├── layout.tsx                        # Layout raiz com providers
│   ├── ranking/
│   │   └── page.tsx                      # Página de ranking
│   ├── deputado/[id]/
│   │   ├── layout.tsx                    # Layout com header e tabs do deputado
│   │   ├── page.tsx                      # Aba resumo (overview)
│   │   ├── votos/page.tsx                # Aba de votações
│   │   ├── projetos/page.tsx             # Aba de proposições
│   │   ├── presenca/page.tsx             # Aba de eventos/presença
│   │   └── gastos/page.tsx               # Aba de despesas CEAP
│   └── api/
│       ├── deputados/route.ts            # GET /api/deputados
│       └── deputados/[id]/
│           ├── route.ts                  # GET /api/deputados/:id
│           ├── votacoes/route.ts         # GET /api/deputados/:id/votacoes
│           ├── proposicoes/route.ts      # GET /api/deputados/:id/proposicoes
│           ├── eventos/route.ts          # GET /api/deputados/:id/eventos
│           └── despesas/route.ts         # GET /api/deputados/:id/despesas
├── components/
│   ├── DeputadoCard.tsx                  # Card da listagem principal
│   ├── DeputadoHeader.tsx                # Foto, nome, partido e UF no topo do perfil
│   ├── DeputadoTabs.tsx                  # Navegação por abas do perfil
│   ├── Navbar.tsx                        # Barra de navegação global
│   ├── providers.tsx                     # QueryClientProvider
│   └── ui/                               # Componentes shadcn/ui
├── lib/
│   ├── camara-api.ts                     # Funções de acesso à API da Câmara
│   ├── partido-cores.ts                  # Mapa de cores por partido e lista de UFs
│   ├── format.ts                         # Formatadores de moeda, data e percentual
│   ├── use-debounce.ts                   # Hook de debounce para busca
│   └── utils.ts                          # Utilitário cn() do Tailwind
└── types/
    └── camara.ts                         # Tipos TypeScript dos recursos da API
```

## API Routes

As rotas de API atuam como proxy para a API pública da Câmara, adicionando cache HTTP e ocultando parâmetros internos do cliente.

| Método | Rota | Cache | Descrição |
|---|---|---|---|
| GET | `/api/deputados` | 1 h / revalidate 24 h | Lista deputados com filtros opcionais |
| GET | `/api/deputados/:id` | 1 h | Detalhes de um deputado |
| GET | `/api/deputados/:id/votacoes` | 1 h | Histórico de votações |
| GET | `/api/deputados/:id/proposicoes` | 1 h | Proposições apresentadas |
| GET | `/api/deputados/:id/eventos` | 1 h | Eventos/presença |
| GET | `/api/deputados/:id/despesas` | 24 h | Despesas CEAP |

**Parâmetros aceitos em `GET /api/deputados`:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `nome` | string | Filtra por nome do deputado |
| `siglaPartido` | string | Filtra por sigla do partido (ex: `PT`, `PL`) |
| `siglaUf` | string | Filtra por estado (ex: `SP`, `MG`) |
| `idLegislatura` | string | Número da legislatura (padrão: `57`) |
| `pagina` | string | Paginação |

## Fonte de dados

Todos os dados vêm da [API v2 de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/swagger/api.html) — uma API pública sem necessidade de autenticação.

O módulo `src/lib/camara-api.ts` centraliza todos os acessos, usando `next: { revalidate }` para cache incremental no servidor (ISR). No cliente, o TanStack Query mantém os dados em cache por `staleTime: 5min` para evitar requisições redundantes durante a navegação.

## Tipos principais

| Tipo | Descrição |
|---|---|
| `DeputadoResumo` | Dados básicos retornados na listagem |
| `DeputadoDetalhe` | Dados completos incluindo gabinete e dados pessoais |
| `Votacao` | Registro de uma votação na Câmara |
| `Proposicao` / `ProposicaoDetalhe` | Projeto de lei ou proposição legislativa |
| `Evento` | Sessão, audiência ou reunião com situação e local |
| `Despesa` | Lançamento de cota parlamentar (CEAP) com fornecedor e valor |
| `ApiResponse<T>` | Envelope padrão da API: `{ dados: T, links: [...] }` |
