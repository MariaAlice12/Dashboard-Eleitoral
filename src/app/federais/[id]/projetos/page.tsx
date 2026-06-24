'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FileCheck2, FileText } from 'lucide-react'
import type { ApiResponse, Proposicao } from '@/types/camara'
import { AREAS, getArea } from '@/lib/classificar-proposicao'
import { ProjetoDetalheModal } from '@/components/ProjetoDetalheModal'

const TIPOS = ['PL', 'PEC', 'MPV', 'PDC', 'PRC', 'REQ', 'INC']
const ANOS = Array.from(
  { length: new Date().getFullYear() - 2018 },
  (_, i) => String(new Date().getFullYear() - i),
)

const STATUS_VIROU_LEI = [
  'transformada em norma jurídica',
  'transformada em lei',
  'promulgada',
  'aprovada',
]

function getStatusInfo(desc: string = '') {
  const lower = desc.toLowerCase()
  if (STATUS_VIROU_LEI.some((s) => lower.includes(s)))
    return { label: 'Virou Lei ✓', class: 'bg-green-100 text-green-800 border-green-200' }
  if (lower.includes('arquivad') || lower.includes('rejeitad'))
    return { label: 'Arquivado', class: 'bg-red-100 text-red-800 border-red-200' }
  if (lower.includes('aprovad'))
    return { label: 'Aprovado', class: 'bg-blue-100 text-blue-800 border-blue-200' }
  return { label: 'Em tramitação', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
}

async function fetchTodasProposicoes(
  id: string,
  tipo?: string,
  ano?: string,
): Promise<Proposicao[]> {
  const buildParams = (pagina: number) => {
    const p = new URLSearchParams()
    if (tipo && tipo !== 'todos') p.set('siglaTipo', tipo)
    if (ano && ano !== 'todos') p.set('ano', ano)
    p.set('pagina', String(pagina))
    return p
  }

  const res = await fetch(`/api/deputados/${id}/proposicoes?${buildParams(1)}`)
  if (!res.ok) throw new Error('Erro ao buscar proposições')
  const first: ApiResponse<Proposicao[]> = await res.json()

  const lastLink = first.links?.find((l) => l.rel === 'last')
  let lastPage = 1
  if (lastLink) {
    try {
      lastPage = parseInt(new URL(lastLink.href).searchParams.get('pagina') ?? '1')
    } catch {
      const m = lastLink.href.match(/pagina=(\d+)/)
      if (m) lastPage = parseInt(m[1])
    }
  }

  if (lastPage <= 1) return first.dados

  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, i) =>
      fetch(`/api/deputados/${id}/proposicoes?${buildParams(i + 2)}`)
        .then((r) => r.json() as Promise<ApiResponse<Proposicao[]>>)
        .then((d) => d.dados ?? []),
    ),
  )

  return [...first.dados, ...rest.flat()]
}

export default function ProjetosPage() {
  const { id } = useParams<{ id: string }>()
  const [tipo, setTipo] = useState('')
  const [ano, setAno] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [projetoAberto, setProjetoAberto] = useState<number | null>(null)

  const { data: proposicoes = [], isLoading } = useQuery({
    queryKey: ['proposicoes', id, tipo, ano],
    queryFn: () => fetchTodasProposicoes(id, tipo, ano),
    staleTime: 5 * 60 * 1000,
  })

  const proposicoesComArea = useMemo(
    () => proposicoes.map((p) => ({ ...p, areaId: p.areaId ?? 'outros' })),
    [proposicoes],
  )

  // filtros client-side (status e área); tipo e ano são server-side
  const temFiltroCliente =
    (!!filtroStatus && filtroStatus !== 'todos') ||
    (!!filtroArea && filtroArea !== 'todas')

  const filtradas = useMemo(
    () =>
      proposicoesComArea.filter((p) => {
        const statusDesc =
          (p as unknown as { statusProposicao?: { descricaoSituacao?: string } })
            .statusProposicao?.descricaoSituacao ?? ''
        const statusInfo = getStatusInfo(statusDesc)
        if (filtroStatus === 'lei' && statusInfo.label !== 'Virou Lei ✓') return false
        if (filtroStatus === 'tramitacao' && statusInfo.label !== 'Em tramitação') return false
        if (filtroStatus === 'arquivado' && statusInfo.label !== 'Arquivado') return false
        if (filtroArea && filtroArea !== 'todas' && p.areaId !== filtroArea) return false
        return true
      }),
    [proposicoesComArea, filtroStatus, filtroArea],
  )

  const virouLei = useMemo(
    () =>
      filtradas.filter((p) => {
        const status = (p as unknown as { statusProposicao?: { descricaoSituacao?: string } })
          .statusProposicao
        return STATUS_VIROU_LEI.some((s) => status?.descricaoSituacao?.toLowerCase().includes(s))
      }).length,
    [filtradas],
  )

  // distribuição sempre calculada sobre o conjunto visível (filtradas)
  const distribuicao = useMemo(() => {
    const counts: Record<string, number> = {}
    filtradas.forEach((p) => {
      counts[p.areaId] = (counts[p.areaId] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([areaId, count]) => ({ area: getArea(areaId), count }))
  }, [filtradas])

  return (
    <div className="space-y-6">
      {/* big numbers */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{isLoading ? '—' : filtradas.length}</p>
              <p className="text-xs text-muted-foreground">
                {temFiltroCliente && !isLoading
                  ? `de ${proposicoes.length} total`
                  : 'projetos apresentados'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-green-700" />
            <div>
              <p className="text-2xl font-bold text-green-800">{isLoading ? '—' : virouLei}</p>
              <p className="text-xs text-green-700">viraram lei</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* distribuição por área — reflete os filtros ativos */}
      {!isLoading && distribuicao.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Distribuição por área
              {temFiltroCliente && (
                <span className="ml-1 normal-case font-normal">(filtro ativo)</span>
              )}
            </p>
            <div className="space-y-2">
              {distribuicao.map(({ area, count }) => {
                const pct = Math.round((count / filtradas.length) * 100)
                return (
                  <div key={area.id} className="flex items-center gap-2">
                    <span className="text-xs w-44 truncate shrink-0" style={{ color: area.color }}>
                      {area.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: area.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-7 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={tipo} onValueChange={(v) => setTipo(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ano} onValueChange={(v) => setAno(v ?? '')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {ANOS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v ?? '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="lei">Virou lei</SelectItem>
            <SelectItem value="tramitacao">Em tramitação</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroArea} onValueChange={(v) => setFiltroArea(v ?? '')}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as áreas</SelectItem>
            {AREAS.filter((a) => a.id !== 'outros').map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
            ))}
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* lista */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : filtradas.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">
            Nenhum projeto encontrado com esses filtros.
          </p>
        ) : (
          filtradas.map((p) => {
            const statusDesc =
              (p as unknown as { statusProposicao?: { descricaoSituacao?: string } })
                .statusProposicao?.descricaoSituacao ?? ''
            const statusInfo = getStatusInfo(statusDesc)
            const isLei = statusInfo.label === 'Virou Lei ✓'
            const area = getArea(p.areaId)

            return (
              <Card
                key={p.id}
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${isLei ? 'border-green-300 bg-green-50/50' : ''}`}
                onClick={() => setProjetoAberto(p.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-xs">
                      {p.siglaTipo} {p.numero}/{p.ano}
                    </Badge>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.class}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: area.color }}
                    >
                      {area.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3 hover:underline">{p.ementa}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <ProjetoDetalheModal
        proposicaoId={projetoAberto}
        onOpenChange={(open) => !open && setProjetoAberto(null)}
      />
    </div>
  )
}
