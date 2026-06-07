'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ArrowLeft } from 'lucide-react'
import type { ApiResponse, DeputadoResumo } from '@/types/camara'
import { PARTIDO_CORES, UFS } from '@/lib/partido-cores'
import { AREAS, classificarProposicao, getArea } from '@/lib/classificar-proposicao'

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

export default function ProjetosPage() {
  const [partido, setPartido] = useState('')
  const [uf, setUf] = useState('')
  const [ano, setAno] = useState('')
  const [area, setArea] = useState('')
  const [nomeDep, setNomeDep] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projetos-deps', partido, uf],
    queryFn: () => fetchDeputados(partido, uf),
  })

  const deputados = (data?.dados ?? []).slice(0, 50)

  const propostasQueries = useQueries({
    queries: deputados.map((dep) => ({
      queryKey: ['proposicoes-proj', dep.id, ano],
      queryFn: () => fetchProposicoes(dep.id, ano),
      staleTime: 10 * 60 * 1000,
    })),
  })

  const isLoadingProj = propostasQueries.some((q) => q.isLoading)
  const loadedCount = propostasQueries.filter((q) => !q.isLoading).length

  const projetosFlat = useMemo(() => {
    if (deputados.length === 0 || isLoadingProj) return []
    const items: (ProposicaoResumo & { areaId: string; dep: DeputadoResumo })[] = []
    propostasQueries.forEach((q, i) => {
      const dep = deputados[i]
      if (!dep || !q.data) return
      q.data.forEach((p) => items.push({ ...p, areaId: classificarProposicao(p.ementa), dep }))
    })
    return items.sort((a, b) => b.ano - a.ano || b.id - a.id)
  }, [isLoadingProj, deputados.length, loadedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const projetosFiltrados = useMemo(
    () =>
      projetosFlat.filter((p) => {
        if (area && area !== 'todas' && p.areaId !== area) return false
        if (nomeDep && !p.dep.nome.toLowerCase().includes(nomeDep.toLowerCase())) return false
        return true
      }),
    [projetosFlat, area, nomeDep],
  )

  const PROJ_LIMIT = 300
  const projetosExibidos = projetosFiltrados.slice(0, PROJ_LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link href="/ranking" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao ranking
        </Link>
        <h1 className="text-3xl font-bold">Projetos Legislativos</h1>
        <p className="text-muted-foreground">Explore os projetos apresentados pelos deputados federais.</p>
      </div>

      {/* Filtros */}
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

        <Select value={ano} onValueChange={(v) => setAno(v ?? '')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Todos os anos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={area} onValueChange={(v) => setArea(v ?? '')}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas as áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as áreas</SelectItem>
            {AREAS.filter((a) => a.id !== 'outros').map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
            ))}
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar deputado..."
            className="pl-9"
            value={nomeDep}
            onChange={(e) => setNomeDep(e.target.value)}
          />
        </div>
      </div>

      {/* Contador */}
      {!isLoadingProj && projetosFlat.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {projetosFiltrados.length !== projetosFlat.length
            ? `${projetosFiltrados.length.toLocaleString('pt-BR')} projetos filtrados de ${projetosFlat.length.toLocaleString('pt-BR')} total`
            : `${projetosFlat.length.toLocaleString('pt-BR')} projetos · ${deputados.length} deputados`}
          {projetosFiltrados.length > PROJ_LIMIT && ` · exibindo os primeiros ${PROJ_LIMIT}`}
        </p>
      )}

      {/* Lista */}
      {isLoading || isLoadingProj ? (
        <div className="space-y-3">
          {deputados.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Carregando projetos… {loadedCount}/{deputados.length} deputados
            </p>
          )}
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : projetosExibidos.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground text-sm">
          Nenhum projeto encontrado com esses filtros.
        </p>
      ) : (
        <div className="space-y-2">
          {projetosExibidos.map((p) => {
            const areaData = getArea(p.areaId)
            return (
              <div
                key={`${p.dep.id}-${p.id}`}
                className="flex items-start gap-3 p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {p.siglaTipo} {p.numero}/{p.ano}
                    </Badge>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-white shrink-0"
                      style={{ backgroundColor: areaData.color }}
                    >
                      {areaData.label}
                    </span>
                  </div>
                  <p className="text-sm leading-snug line-clamp-2">{p.ementa}</p>
                </div>
                <Link
                  href={`/deputado/${p.dep.id}`}
                  className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="relative h-9 w-9 rounded-full overflow-hidden bg-muted">
                    <Image src={p.dep.urlFoto} alt={p.dep.nome} fill className="object-cover" sizes="36px" unoptimized />
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium leading-tight line-clamp-1 max-w-28">{p.dep.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.dep.siglaPartido} · {p.dep.siglaUf}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
          {projetosFiltrados.length > PROJ_LIMIT && (
            <p className="text-center text-xs text-muted-foreground py-4">
              Use os filtros para refinar os resultados.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
