'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import type { ApiResponse, Votacao } from '@/types/camara'
import { formatDate } from '@/lib/format'

const VOTO_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
  Sim:        { label: 'Sim',        color: '#22c55e', badgeClass: 'bg-green-100 text-green-800' },
  'Não':      { label: 'Não',        color: '#ef4444', badgeClass: 'bg-red-100 text-red-800' },
  Abstenção:  { label: 'Abstenção',  color: '#f59e0b', badgeClass: 'bg-yellow-100 text-yellow-800' },
  Obstrução:  { label: 'Obstrução',  color: '#8b5cf6', badgeClass: 'bg-purple-100 text-purple-800' },
  '-':        { label: 'Ausente',    color: '#6b7280', badgeClass: 'bg-gray-100 text-gray-600' },
}

async function fetchVotacoes(id: string): Promise<ApiResponse<Votacao[]>> {
  const res = await fetch(`/api/deputados/${id}/votacoes`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

export default function VotosPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['votacoes', id],
    queryFn: () => fetchVotacoes(id),
    retry: false,
  })

  const votacoes = data?.dados ?? []

  const contagem = Object.entries(
    votacoes.reduce<Record<string, number>>((acc, v) => {
      const tipo = (v as unknown as { tipoVoto?: string }).tipoVoto ?? '-'
      acc[tipo] = (acc[tipo] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  if (!isLoading && (isError || votacoes.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p className="text-base font-medium">Dados de votações indisponíveis</p>
        <p className="text-sm text-center max-w-sm">
          O endpoint de votações por deputado foi removido da API da Câmara (v2).
          Os registros individuais de voto não estão acessíveis via API pública no momento.
        </p>
        <a
          href={`https://www.camara.leg.br/deputados/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Ver perfil oficial na Câmara →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição dos votos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={contagem} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {contagem.map((entry) => (
                      <Cell key={entry.name} fill={VOTO_CONFIG[entry.name]?.color ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contagem.map((c) => {
                const cfg = VOTO_CONFIG[c.name]
                return (
                  <div key={c.name} className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg?.badgeClass ?? 'bg-gray-100 text-gray-600'}`}>
                      {cfg?.label ?? c.name}
                    </span>
                    <span className="font-semibold">{c.value}</span>
                  </div>
                )
              })}
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold">{votacoes.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico de votações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-0">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 mx-4 mb-2 rounded-lg" />)
            : votacoes.map((v) => {
                const tipoVoto = (v as unknown as { tipoVoto?: string }).tipoVoto ?? '-'
                const cfg = VOTO_CONFIG[tipoVoto]
                return (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${cfg?.badgeClass ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {cfg?.label ?? tipoVoto}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug line-clamp-2">
                        {v.proposicaoObjeto || v.descricao || 'Votação sem descrição'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(v.dataHoraRegistro)} · {v.siglaOrgao}
                      </p>
                    </div>
                  </div>
                )
              })}
        </CardContent>
      </Card>
    </div>
  )
}
