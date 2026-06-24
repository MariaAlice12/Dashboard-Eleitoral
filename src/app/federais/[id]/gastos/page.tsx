'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ApiResponse, Despesa } from '@/types/camara'
import { formatCurrency, formatDate } from '@/lib/format'

const CEAP_LIMITE = 44_008.76

const CATEGORIA_CORES: Record<string, string> = {
  'PASSAGENS AÉREAS': '#3b82f6',
  'COMBUSTÍVEIS E LUBRIFICANTES': '#f59e0b',
  'HOSPEDAGEM': '#8b5cf6',
  'ALIMENTAÇÃO': '#22c55e',
  'TELEFONIA': '#ef4444',
  'SERVIÇOS POSTAIS': '#ec4899',
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS': '#14b8a6',
  'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': '#f97316',
}

function getColor(index: number) {
  const colors = Object.values(CATEGORIA_CORES)
  return colors[index % colors.length]
}

async function fetchDespesas(id: string): Promise<ApiResponse<Despesa[]>> {
  const res = await fetch(`/api/deputados/${id}/despesas`)
  if (!res.ok) throw new Error('Erro')
  return res.json()
}

export default function GastosPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['despesas', id],
    queryFn: () => fetchDespesas(id),
  })

  const despesas = data?.dados ?? []
  const total = despesas.reduce((s, d) => s + d.valorLiquido, 0)

  const byMonth = despesas.reduce<Record<string, number>>((acc, d) => {
    const key = `${d.ano}-${String(d.mes).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + d.valorLiquido
    return acc
  }, {})

  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes, valor: Math.round(valor) }))

  const byCategory = despesas.reduce<Record<string, number>>((acc, d) => {
    acc[d.tipoDespesa] = (acc[d.tipoDespesa] ?? 0) + d.valorLiquido
    return acc
  }, {})

  const pieData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">total no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{despesas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">notas fiscais</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos mensais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52" />
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Sem dados de gastos disponíveis.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={1} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Gasto']} />
                <ReferenceLine y={CEAP_LIMITE} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Limite CEAP', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="#93c5fd" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={getColor(i)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)
              : pieData.map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(i) }} />
                      <span className="truncate text-xs">{c.name}</span>
                    </div>
                    <span className="font-medium flex-shrink-0 ml-2">{formatCurrency(c.value)}</span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançamentos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}
                    </TableRow>
                  ))
                : despesas.slice(0, 20).map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(d.dataDocumento)}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{d.tipoDespesa}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{d.nomeFornecedor}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{formatCurrency(d.valorLiquido)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
