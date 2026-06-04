'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FileCheck2, FileText } from 'lucide-react'
import type { ApiResponse, Proposicao } from '@/types/camara'

const TIPOS = ['PL', 'PEC', 'MPV', 'PDC', 'PRC', 'REQ', 'INC']

const STATUS_VIROU_LEI = [
  'transformada em norma jurídica',
  'transformada em lei',
  'promulgada',
  'aprovada',
]

function getStatusInfo(desc: string = '') {
  const lower = desc.toLowerCase()
  if (STATUS_VIROU_LEI.some((s) => lower.includes(s))) {
    return { label: 'Virou Lei ✓', class: 'bg-green-100 text-green-800 border-green-200' }
  }
  if (lower.includes('arquivad') || lower.includes('rejeitad')) {
    return { label: 'Arquivado', class: 'bg-red-100 text-red-800 border-red-200' }
  }
  if (lower.includes('aprovad')) {
    return { label: 'Aprovado', class: 'bg-blue-100 text-blue-800 border-blue-200' }
  }
  return { label: 'Em tramitação', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
}

async function fetchProposicoes(id: string, tipo?: string): Promise<ApiResponse<Proposicao[]>> {
  const params = new URLSearchParams()
  if (tipo && tipo !== 'todos') params.set('siglaTipo', tipo)
  const res = await fetch(`/api/deputados/${id}/proposicoes?${params}`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

export default function ProjetosPage() {
  const { id } = useParams<{ id: string }>()
  const [tipo, setTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['proposicoes', id, tipo],
    queryFn: () => fetchProposicoes(id, tipo),
  })

  const proposicoes = data?.dados ?? []

  const virouLei = proposicoes.filter((p) => {
    const status = (p as unknown as { statusProposicao?: { descricaoSituacao?: string } }).statusProposicao
    return STATUS_VIROU_LEI.some((s) => status?.descricaoSituacao?.toLowerCase().includes(s))
  }).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{proposicoes.length}</p>
              <p className="text-xs text-muted-foreground">projetos apresentados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-green-700" />
            <div>
              <p className="text-2xl font-bold text-green-800">{virouLei}</p>
              <p className="text-xs text-green-700">viraram lei</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : proposicoes.map((p) => {
              const statusDesc = (p as unknown as { statusProposicao?: { descricaoSituacao?: string } }).statusProposicao?.descricaoSituacao ?? ''
              const statusInfo = getStatusInfo(statusDesc)
              const isLei = statusInfo.label === 'Virou Lei ✓'

              if (filtroStatus === 'lei' && !isLei) return null
              if (filtroStatus === 'tramitacao' && statusInfo.label !== 'Em tramitação') return null
              if (filtroStatus === 'arquivado' && statusInfo.label !== 'Arquivado') return null

              return (
                <Card key={p.id} className={isLei ? 'border-green-300 bg-green-50/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {p.siglaTipo} {p.numero}/{p.ano}
                          </Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed line-clamp-3">{p.ementa}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
