'use client'

import { useState, useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { Search, Users, Building2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeputadoCard } from '@/components/DeputadoCard'
import { BarChart, Bar, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { ApiResponse, DeputadoResumo } from '@/types/camara'
import { UFS } from '@/lib/partido-cores'
import { useDebounce } from '@/lib/use-debounce'
import { classificarProposicao, getArea } from '@/lib/classificar-proposicao'

const AMOSTRA_AREAS = 40

type ProposicaoResumo = { id: number; ementa: string }

async function fetchProposicoes(id: number): Promise<ProposicaoResumo[]> {
  const res = await fetch(`/api/deputados/${id}/proposicoes?itens=100`)
  if (!res.ok) return []
  const d: ApiResponse<ProposicaoResumo[]> = await res.json()
  return d.dados ?? []
}

const PARTIDOS = [
  'PT','PL','UNIÃO','PP','MDB','REPUBLICANOS','PSD','PDT','PSDB','PSOL',
  'PODE','AVANTE','SOLIDARIEDADE','PSB','PCdoB','CIDADANIA','PRD',
]

async function fetchDeputados(
  nome: string,
  partido: string,
  uf: string,
  pagina: number,
): Promise<ApiResponse<DeputadoResumo[]>> {
  const params = new URLSearchParams()
  if (nome) params.set('nome', nome)
  if (partido && partido !== 'todos') params.set('siglaPartido', partido)
  if (uf && uf !== 'todos') params.set('siglaUf', uf)
  params.set('itens', '100')
  params.set('pagina', String(pagina))
  const res = await fetch(`/api/deputados?${params}`)
  if (!res.ok) throw new Error('Erro ao buscar deputados')
  return res.json()
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 bg-card border rounded-xl px-5 py-4">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [nome, setNome] = useState('')
  const [partido, setPartido] = useState('')
  const [uf, setUf] = useState('')

  const debouncedNome = useDebounce(nome, 400)

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['deputados', debouncedNome, partido, uf],
      queryFn: ({ pageParam }) => fetchDeputados(debouncedNome, partido, uf, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _all, lastPageParam) =>
        lastPage.links.some((l) => l.rel === 'next') ? lastPageParam + 1 : undefined,
      staleTime: 5 * 60 * 1000,
    })

  const deputados = Array.from(
    new Map(
      (data?.pages ?? []).flatMap((p) => p.dados).map((d) => [d.id, d]),
    ).values(),
  )
  const totalPartidos = new Set(deputados.map((d) => d.siglaPartido)).size
  const totalUfs = new Set(deputados.map((d) => d.siglaUf)).size

  const deputadosAmostra = deputados.slice(0, AMOSTRA_AREAS)
  const propostasAreaQueries = useQueries({
    queries: deputadosAmostra.map((dep) => ({
      queryKey: ['proposicoes-home-area', dep.id],
      queryFn: () => fetchProposicoes(dep.id),
      staleTime: 10 * 60 * 1000,
    })),
  })
  const isLoadingAreas = propostasAreaQueries.some((q) => q.isLoading)

  const areaChartData = useMemo(() => {
    if (deputadosAmostra.length === 0 || isLoadingAreas) return []
    const counts: Record<string, number> = {}
    let total = 0
    propostasAreaQueries.forEach((q) => {
      q.data?.forEach((p) => {
        const areaId = classificarProposicao(p.ementa)
        counts[areaId] = (counts[areaId] ?? 0) + 1
        total += 1
      })
    })
    if (total === 0) return []
    return Object.entries(counts)
      .map(([areaId, count]) => {
        const area = getArea(areaId)
        return { name: area.label, value: count, pct: (count / total) * 100, color: area.color }
      })
      .sort((a, b) => b.value - a.value)
  }, [isLoadingAreas, propostasAreaQueries, deputadosAmostra.length])

  const handleClearFiltros = useCallback(() => {
    setNome('')
    setPartido('')
    setUf('')
  }, [])

  const temFiltro = nome || (partido && partido !== 'todos') || (uf && uf !== 'todos')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Deputados Federais</h1>
        <p className="text-muted-foreground">
          Acompanhe votos, projetos de lei, presença e gastos dos representantes federais.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="deputados encontrados" value={deputados.length} />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="partidos" value={totalPartidos} />
        <StatCard icon={<MapPin className="h-5 w-5" />} label="estados representados" value={totalUfs} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Representatividade dos projetos por área</CardTitle>
          <p className="text-sm text-muted-foreground">
            Classificação por palavras-chave da ementa, com base em uma amostra de até{' '}
            {AMOSTRA_AREAS} deputados.
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingAreas ? (
            <Skeleton className="h-72" />
          ) : areaChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sem dados suficientes para calcular a distribuição.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={areaChartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, item: any) =>
                    [`${value} (${item.payload.pct.toFixed(1)}%)`, item.payload.name]
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {areaChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <Select value={partido} onValueChange={(v) => setPartido(v ?? '')}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Partido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os partidos</SelectItem>
            {PARTIDOS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={uf} onValueChange={(v) => setUf(v ?? '')}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            {UFS.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {temFiltro && (
          <button
            onClick={handleClearFiltros}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {isFetching && !isFetchingNextPage && !isLoading && (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-1/2 rounded-full" />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : deputados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum deputado encontrado com esses filtros.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deputados.map((d) => (
              <DeputadoCard key={d.id} deputado={d} />
            ))}
          </div>

          {isFetchingNextPage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {hasNextPage && !isFetchingNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                className="px-6 py-2 rounded-lg border border-input bg-transparent text-sm hover:bg-muted transition-colors"
              >
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
