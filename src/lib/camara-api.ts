import type {
  ApiResponse,
  DeputadoDetalhe,
  DeputadoResumo,
  Despesa,
  Evento,
  Proposicao,
  ProposicaoDetalhe,
  Votacao,
} from '@/types/camara'
import { withCache } from './cache'

const BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2'

async function apiFetch<T>(path: string, params?: Record<string, string | undefined>): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) throw new Error(`Câmara API error: ${res.status} ${path}`)
  return res.json()
}

export async function listarDeputados(params?: {
  nome?: string
  siglaPartido?: string
  siglaUf?: string
  itens?: string
  pagina?: string
}): Promise<ApiResponse<DeputadoResumo[]>> {
  const key = `camara:deputados:${params?.nome ?? ''}:${params?.siglaPartido ?? ''}:${params?.siglaUf ?? ''}:${params?.pagina ?? '1'}`
  return withCache(key, 300, () =>
    apiFetch<DeputadoResumo[]>('/deputados', {
      ordem: 'ASC',
      ordenarPor: 'nome',
      ...params,
    }),
  )
}

export async function contarDeputados(params?: {
  nome?: string
  siglaPartido?: string
  siglaUf?: string
}): Promise<number> {
  const semFiltro = !params?.nome && !params?.siglaPartido && !params?.siglaUf
  const key = `camara:deputados:total:${params?.nome ?? ''}:${params?.siglaPartido ?? ''}:${params?.siglaUf ?? ''}`
  return withCache(key, semFiltro ? 86400 : 300, async () => {
    let total = 0
    let pagina = 1
    while (true) {
      const res = await listarDeputados({ ...params, itens: '100', pagina: String(pagina) })
      total += res.dados.length
      if (!res.links.some((l) => l.rel === 'next')) break
      pagina += 1
    }
    return total
  })
}

export async function buscarDeputado(id: number): Promise<DeputadoDetalhe> {
  const key = `camara:deputado:${id}`
  const res = await withCache(key, 3600, () =>
    apiFetch<DeputadoDetalhe>(`/deputados/${id}`),
  )
  return (res as ApiResponse<DeputadoDetalhe>).dados
}

export async function listarVotacoesDeputado(id: number, params?: { dataInicio?: string; dataFim?: string; pagina?: string }): Promise<ApiResponse<Votacao[]>> {
  const key = `camara:deputado:${id}:votacoes:${params?.pagina ?? '1'}`
  return withCache(key, 3600, () =>
    apiFetch<Votacao[]>(`/deputados/${id}/votacoes`, {
      ordenarPor: 'dataHoraVoto',
      ordem: 'DESC',
      itens: '100',
      ...params,
    }),
  )
}

export async function listarProposicoesDeputado(id: number, params?: { ano?: string; siglaTipo?: string; pagina?: string }): Promise<ApiResponse<Proposicao[]>> {
  const key = `camara:deputado:${id}:proposicoes:${params?.ano ?? ''}:${params?.siglaTipo ?? ''}:${params?.pagina ?? '1'}`
  return withCache(key, 3600, () =>
    apiFetch<Proposicao[]>('/proposicoes', {
      idDeputadoAutor: String(id),
      ordenarPor: 'ano',
      ordem: 'DESC',
      itens: '100',
      ...params,
    }),
  )
}

export async function listarEventosDeputado(id: number, params?: { dataInicio?: string; dataFim?: string; pagina?: string }): Promise<ApiResponse<Evento[]>> {
  const key = `camara:deputado:${id}:eventos:${params?.dataInicio ?? '2023-02-01'}:${params?.pagina ?? '1'}`
  return withCache(key, 3600, () =>
    apiFetch<Evento[]>(`/deputados/${id}/eventos`, {
      dataInicio: params?.dataInicio ?? '2023-02-01',
      dataFim: params?.dataFim,
      pagina: params?.pagina,
      ordenarPor: 'dataHoraInicio',
      ordem: 'DESC',
      itens: '100',
    }),
  )
}

export async function listarDespesasDeputado(id: number, params?: { ano?: string; mes?: string; pagina?: string }): Promise<ApiResponse<Despesa[]>> {
  const key = `camara:deputado:${id}:despesas:${params?.ano ?? ''}:${params?.mes ?? ''}:${params?.pagina ?? '1'}`
  return withCache(key, 86400, () =>
    apiFetch<Despesa[]>(`/deputados/${id}/despesas`, {
      ordenarPor: 'ano',
      ordem: 'DESC',
      itens: '100',
      ...params,
    }),
  )
}

export async function buscarProposicao(id: number): Promise<ProposicaoDetalhe> {
  const key = `camara:proposicao:${id}`
  const res = await withCache(key, 3600, () =>
    apiFetch<ProposicaoDetalhe>(`/proposicoes/${id}`),
  )
  return (res as ApiResponse<ProposicaoDetalhe>).dados
}

export async function listarPartidos(): Promise<ApiResponse<{ id: number; sigla: string; nome: string; uri: string }[]>> {
  return withCache('camara:partidos', 86400, () =>
    apiFetch('/partidos', { ordem: 'ASC', ordenarPor: 'sigla', itens: '100' }),
  )
}
