'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { ApiResponse, DeputadoResumo } from '@/types/camara'
import { PARTIDO_CORES, UFS } from '@/lib/partido-cores'
import { classificarProposicao, getArea } from '@/lib/classificar-proposicao'

const PARTIDOS = [
  'PT','PL','UNIÃO','PP','MDB','REPUBLICANOS','PSD','PDT','PSDB','PSOL',
  'PODE','AVANTE','SOLIDARIEDADE','PSB','PCdoB','CIDADANIA','PRD',
]

const ANOS = Array.from(
  { length: new Date().getFullYear() - 2018 },
  (_, i) => String(new Date().getFullYear() - i),
)

type ProposicaoResumo = {
  id: number
  ementa: string
  siglaTipo: string
  numero: number
  ano: number
}

async function fetchDeputados(partido: string, uf: string): Promise<ApiResponse<DeputadoResumo[]>> {
  const params = new URLSearchParams({ idLegislatura: '57', itens: '100' })
  if (partido && partido !== 'todos') params.set('siglaPartido', partido)
  if (uf && uf !== 'todos') params.set('siglaUf', uf)
  const res = await fetch(`/api/deputados?${params}`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

async function fetchProposicoes(id: number, ano?: string): Promise<ProposicaoResumo[]> {
  const params = new URLSearchParams({ itens: '100' })
  if (ano && ano !== 'todos') params.set('ano', ano)
  const res = await fetch(`/api/deputados/${id}/proposicoes?${params}`)
  if (!res.ok) return []
  const d: ApiResponse<ProposicaoResumo[]> = await res.json()
  return d.dados ?? []
}

function PodiumCard({ dep, pos, value, sub }: { dep: DeputadoResumo; pos: number; value: string; sub: string }) {
  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
  return (
    <Link href={`/deputado/${dep.id}`}>
      <Card className="hover:shadow-md transition-shadow text-center p-4">
        <span className={`text-2xl font-black ${medalColors[pos]}`}>{pos + 1}º</span>
        <div className="relative h-14 w-14 rounded-full overflow-hidden bg-muted mx-auto mt-2">
          <Image src={dep.urlFoto} alt={dep.nome} fill className="object-cover" sizes="56px" unoptimized />
        </div>
        <p className="text-sm font-semibold mt-2 line-clamp-2">{dep.nome}</p>
        <Badge style={{ backgroundColor: PARTIDO_CORES[dep.siglaPartido] ?? '#6b7280', color: '#fff' }} className="mt-1 text-xs">
          {dep.siglaPartido}
        </Badge>
        <p className="text-lg font-bold mt-2">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </Card>
    </Link>
  )
}

export default function RankingPage() {
  const [partido, setPartido] = useState('')
  const [uf, setUf] = useState('')
  const [tab, setTab] = useState('presenca')

  // filtros da aba "Por Área"
  const [anoArea, setAnoArea] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ranking-deps', partido, uf],
    queryFn: () => fetchDeputados(partido, uf),
  })

  const deputados = (data?.dados ?? []).slice(0, 50)
  const podiumPresenca = deputados.slice(0, 3)
  const podiumProjetos = deputados.slice(0, 3)

  // ── Aba "Por Área" ──────────────────────────────────────────────────────────
  const areaDeputados = tab === 'areas' ? deputados : []

  const propostasAreaQueries = useQueries({
    queries: areaDeputados.map((dep) => ({
      queryKey: ['proposicoes-area', dep.id, anoArea],
      queryFn: () => fetchProposicoes(dep.id, anoArea),
      staleTime: 10 * 60 * 1000,
    })),
  })

  const isLoadingAreas = propostasAreaQueries.some((q) => q.isLoading)
  const loadedCountArea = propostasAreaQueries.filter((q) => !q.isLoading).length

  const areaRanking = useMemo(() => {
    if (areaDeputados.length === 0 || isLoadingAreas) return []
    const counts: Record<string, { total: number; deps: Record<number, { dep: DeputadoResumo; count: number }> }> = {}
    propostasAreaQueries.forEach((q, i) => {
      const dep = areaDeputados[i]
      if (!dep || !q.data) return
      q.data.forEach((p) => {
        const areaId = classificarProposicao(p.ementa)
        if (!counts[areaId]) counts[areaId] = { total: 0, deps: {} }
        counts[areaId].total += 1
        if (!counts[areaId].deps[dep.id]) counts[areaId].deps[dep.id] = { dep, count: 0 }
        counts[areaId].deps[dep.id].count += 1
      })
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([areaId, d]) => ({
        area: getArea(areaId),
        total: d.total,
        topDeps: Object.values(d.deps).sort((a, b) => b.count - a.count).slice(0, 3),
      }))
  }, [isLoadingAreas, areaDeputados.length, loadedCountArea]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = areaRanking.map((r) => ({ name: r.area.label, total: r.total, color: r.area.color }))
  const totalProjetosArea = areaRanking.reduce((s, r) => s + r.total, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Ranking dos Deputados</h1>
        <p className="text-muted-foreground">Compare presença, produtividade legislativa e gastos com a cota parlamentar.</p>
      </div>

      {/* Filtros globais: partido e estado */}
      <div className="flex flex-wrap gap-3">
        <Select value={partido} onValueChange={(v) => setPartido(v ?? '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Partido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os partidos</SelectItem>
            {PARTIDOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={uf} onValueChange={(v) => setUf(v ?? '')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="presenca">Presença</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="areas">Por Área</TabsTrigger>
          <TabsTrigger value="lista">Lista completa</TabsTrigger>
        </TabsList>

        {/* ── Presença ── */}
        <TabsContent value="presenca" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Maiores presenças</h2>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {podiumPresenca.map((dep, i) => (
                  <PodiumCard key={dep.id} dep={dep} pos={i} value="—" sub="presença" />
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Nota: os dados de presença requerem chamadas individuais por deputado. Use a página de cada deputado para ver o percentual exato.
          </p>
        </TabsContent>

        {/* ── Produtividade ── */}
        <TabsContent value="produtividade" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Mais projetos apresentados</h2>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {podiumProjetos.map((dep, i) => (
                  <PodiumCard key={dep.id} dep={dep} pos={i} value="—" sub="projetos" />
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Nota: os dados de projetos requerem chamadas individuais. Acesse o perfil de cada deputado para o número exato.
          </p>
        </TabsContent>

        {/* ── Por Área ── */}
        <TabsContent value="areas" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="text-lg font-semibold">Ranking por área temática</h2>
              <p className="text-sm text-muted-foreground">
                {isLoadingAreas
                  ? `Carregando proposições… ${loadedCountArea}/${areaDeputados.length} deputados`
                  : areaRanking.length > 0
                  ? `${areaDeputados.length} deputados · ${totalProjetosArea.toLocaleString('pt-BR')} projetos classificados (primeiros 100 por deputado)`
                  : 'Projetos classificados por palavras-chave da ementa.'}
              </p>
            </div>
            <Select value={anoArea} onValueChange={(v) => setAnoArea(v ?? '')}>
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading || (tab === 'areas' && isLoadingAreas) ? (
            <div className="space-y-4">
              <Skeleton className="h-72 rounded-xl" />
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : areaRanking.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhum dado disponível. Selecione um filtro e aguarde o carregamento.
            </p>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projetos por área (total)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 140 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                      <Tooltip formatter={(v) => [v, 'projetos']} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {areaRanking.map(({ area, total, topDeps }) => (
                  <Card key={area.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
                          <span className="font-semibold text-sm">{area.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{total} projeto{total !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {topDeps.map(({ dep, count }, i) => (
                          <Link key={dep.id} href={`/deputado/${dep.id}`}
                            className="flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors">
                            <span className="text-xs text-muted-foreground font-bold w-4">{i + 1}º</span>
                            <div className="relative h-7 w-7 rounded-full overflow-hidden bg-muted shrink-0">
                              <Image src={dep.urlFoto} alt={dep.nome} fill className="object-cover" sizes="28px" unoptimized />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium leading-tight line-clamp-1">{dep.nome}</p>
                              <p className="text-xs text-muted-foreground">{count} proj.</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Lista completa ── */}
        <TabsContent value="lista" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos os deputados ({deputados.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Partido</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead className="text-right">Perfil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}
                        </TableRow>
                      ))
                    : deputados.map((dep, i) => (
                        <TableRow key={dep.id} className="hover:bg-muted/40">
                          <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                <Image src={dep.urlFoto} alt={dep.nome} fill className="object-cover" sizes="32px" unoptimized />
                              </div>
                              <span className="text-sm font-medium">{dep.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: PARTIDO_CORES[dep.siglaPartido] ?? '#6b7280', color: '#fff' }} className="text-xs">
                              {dep.siglaPartido}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{dep.siglaUf}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/deputado/${dep.id}`} className="text-xs text-primary hover:underline">
                              Ver perfil →
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
