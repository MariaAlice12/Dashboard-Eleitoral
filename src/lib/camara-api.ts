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

const BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2'

async function apiFetch<T>(path: string, params?: Record<string, string>, revalidate = 3600): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate },
  })

  if (!res.ok) throw new Error(`Câmara API error: ${res.status} ${path}`)
  return res.json()
}

export async function listarDeputados(params?: {
  nome?: string
  siglaPartido?: string
  siglaUf?: string
  idLegislatura?: string
  pagina?: string
}): Promise<ApiResponse<DeputadoResumo[]>> {
  return apiFetch<DeputadoResumo[]>('/deputados', {
    ordem: 'ASC',
    ordenarPor: 'nome',
    ...params,
  })
}

export async function buscarDeputado(id: number): Promise<DeputadoDetalhe> {
  const res = await apiFetch<DeputadoDetalhe>(`/deputados/${id}`, {}, 3600)
  return res.dados
}

export async function listarVotacoesDeputado(id: number, params?: { dataInicio?: string; dataFim?: string; pagina?: string }): Promise<ApiResponse<Votacao[]>> {
  return apiFetch<Votacao[]>(`/deputados/${id}/votacoes`, {
    ordenarPor: 'dataHoraVoto',
    ordem: 'DESC',
    itens: '100',
    ...params,
  })
}

export async function listarProposicoesDeputado(id: number, params?: { ano?: string; siglaTipo?: string; pagina?: string }): Promise<ApiResponse<Proposicao[]>> {
  return apiFetch<Proposicao[]>(`/deputados/${id}/proposicoes`, {
    ordenarPor: 'ano',
    ordem: 'DESC',
    itens: '100',
    ...params,
  })
}

export async function listarEventosDeputado(id: number, params?: { dataInicio?: string; dataFim?: string; pagina?: string }): Promise<ApiResponse<Evento[]>> {
  return apiFetch<Evento[]>(`/deputados/${id}/eventos`, {
    ordenarPor: 'dataHoraInicio',
    ordem: 'DESC',
    itens: '100',
    ...params,
  })
}

export async function listarDespesasDeputado(id: number, params?: { ano?: string; mes?: string; pagina?: string }): Promise<ApiResponse<Despesa[]>> {
  return apiFetch<Despesa[]>(
    `/deputados/${id}/despesas`,
    { ordenarPor: 'ano', ordem: 'DESC', itens: '100', ...params },
    86400,
  )
}

export async function buscarProposicao(id: number): Promise<ProposicaoDetalhe> {
  const res = await apiFetch<ProposicaoDetalhe>(`/proposicoes/${id}`, {}, 3600)
  return res.dados
}

export async function listarPartidos(): Promise<ApiResponse<{ id: number; sigla: string; nome: string; uri: string }[]>> {
  return apiFetch('/partidos', { ordem: 'ASC', ordenarPor: 'sigla', itens: '100' }, 86400)
}
