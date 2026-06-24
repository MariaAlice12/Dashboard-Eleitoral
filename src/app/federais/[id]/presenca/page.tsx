'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ApiResponse, Evento } from '@/types/camara'
import { formatDate, formatPercent } from '@/lib/format'

async function fetchEventos(id: string): Promise<ApiResponse<Evento[]>> {
  const res = await fetch(`/api/deputados/${id}/eventos`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

function buildChartData(eventos: Evento[]) {
  const byMonth: Record<string, { presente: number; total: number }> = {}
  eventos.forEach((e) => {
    const d = new Date(e.dataHoraInicio)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { presente: 0, total: 0 }
    byMonth[key].total += 1
    if (!e.situacao?.toLowerCase().includes('cancelad')) byMonth[key].presente += 1
  })
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, { presente, total }]) => ({
      mes,
      pct: total > 0 ? Math.round((presente / total) * 100) : 0,
    }))
}

export default function PresencaPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['eventos', id],
    queryFn: () => fetchEventos(id),
  })

  const eventos = data?.dados ?? []
  const total = eventos.length
  const presentes = eventos.filter((e) => !e.situacao?.toLowerCase().includes('cancelad')).length
  const ausentes = total - presentes
  const pctPresenca = total > 0 ? (presentes / total) * 100 : 0

  const chartData = buildChartData(eventos)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{formatPercent(pctPresenca)}</p>
            <p className="text-xs text-muted-foreground mt-1">taxa de presença</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-700">{presentes}</p>
              <p className="text-xs text-muted-foreground">presenças</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center flex items-center justify-center gap-2">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-600">{ausentes}</p>
              <p className="text-xs text-muted-foreground">ausências</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presença por mês</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52" />
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhum dado de presença disponível.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={1} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Presença']} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '75%', position: 'insideRight', fontSize: 11 }} />
                <Bar dataKey="pct" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 mx-4 mb-2 rounded-lg" />)
            : eventos.slice(0, 30).map((e) => {
                const cancelado = e.situacao?.toLowerCase().includes('cancelad')
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    {cancelado
                      ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      : <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm line-clamp-1">{e.descricao || e.descricaoTipo}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.dataHoraInicio)}</p>
                    </div>
                  </div>
                )
              })}
        </CardContent>
      </Card>
    </div>
  )
}
