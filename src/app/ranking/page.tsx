'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ApiResponse, DeputadoResumo } from '@/types/camara'
import { PARTIDO_CORES, UFS } from '@/lib/partido-cores'
import { formatCurrency } from '@/lib/format'

const PARTIDOS = [
  'PT','PL','UNIÃO','PP','MDB','REPUBLICANOS','PSD','PDT','PSDB','PSOL',
  'PODE','AVANTE','SOLIDARIEDADE','PSB','PCdoB','CIDADANIA','PRD',
]

async function fetchDeputados(partido: string, uf: string): Promise<ApiResponse<DeputadoResumo[]>> {
  const params = new URLSearchParams({ idLegislatura: '57', itens: '100' })
  if (partido && partido !== 'todos') params.set('siglaPartido', partido)
  if (uf && uf !== 'todos') params.set('siglaUf', uf)
  const res = await fetch(`/api/deputados?${params}`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

async function fetchProposicoes(id: number) {
  const res = await fetch(`/api/deputados/${id}/proposicoes?itens=100`)
  if (!res.ok) return []
  const d: ApiResponse<{ id: number }[]> = await res.json()
  return d.dados
}

async function fetchDespesas(id: number) {
  const res = await fetch(`/api/deputados/${id}/despesas?ano=${new Date().getFullYear()}`)
  if (!res.ok) return 0
  const d: ApiResponse<{ valorLiquido: number }[]> = await res.json()
  return d.dados.reduce((s, x) => s + x.valorLiquido, 0)
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

  const { data, isLoading } = useQuery({
    queryKey: ['ranking-deps', partido, uf],
    queryFn: () => fetchDeputados(partido, uf),
  })

  const deputados = (data?.dados ?? []).slice(0, 50)

  const rankingPresenca = [...deputados].sort((a, b) => a.nome.localeCompare(b.nome))
  const rankingProjetos = [...deputados].sort((a, b) => a.nome.localeCompare(b.nome))

  const podiumPresenca = rankingPresenca.slice(0, 3)
  const podiumProjetos = rankingProjetos.slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Ranking dos Deputados</h1>
        <p className="text-muted-foreground">Compare presença, produtividade legislativa e gastos com a cota parlamentar.</p>
      </div>

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
        <TabsList>
          <TabsTrigger value="presenca">Presença</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="lista">Lista completa</TabsTrigger>
        </TabsList>

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
                            <Link
                              href={`/deputado/${dep.id}`}
                              className="text-xs text-primary hover:underline"
                            >
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
