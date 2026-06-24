'use client'

import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

type Presidente = {
  id: number
  ordem: number
  nome: string
  partido: string | null
  vice: string | null
  periodoInicio: string
  periodoFim: string | null
  condicao: string
  observacoes: string | null
}

const CONDICAO_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  eleito: { label: 'Eleito', variant: 'default' },
  eleito_indireto: { label: 'Eleito (indireto)', variant: 'secondary' },
  vice_assumiu: { label: 'Vice que assumiu', variant: 'outline' },
  interino: { label: 'Interino', variant: 'outline' },
  golpe: { label: 'Golpe/Revolução', variant: 'destructive' },
}

async function fetchPresidentes(): Promise<{ dados: Presidente[] }> {
  const res = await fetch('/api/presidentes')
  if (!res.ok) return { dados: [] }
  return res.json()
}

function formatPeriodo(inicio: string, fim: string | null) {
  const anoInicio = new Date(inicio).getFullYear()
  if (!fim) return `${anoInicio} — atual`
  return `${anoInicio} — ${new Date(fim).getFullYear()}`
}

export default function PresidencialPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['presidentes'],
    queryFn: fetchPresidentes,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const presidentes = data?.dados ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Linha do Tempo Presidencial</h1>
        </div>
        <p className="text-muted-foreground">
          Todos os presidentes do Brasil desde a Proclamação da República (1889), em ordem cronológica.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <ol className="relative border-l pl-6 space-y-6">
          {presidentes.map((p) => {
            const condicao = CONDICAO_LABEL[p.condicao] ?? { label: p.condicao, variant: 'outline' as const }
            return (
              <li key={p.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                <div className="rounded-xl border bg-card p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h2 className="font-semibold">{p.nome}</h2>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatPeriodo(p.periodoInicio, p.periodoFim)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={condicao.variant}>{condicao.label}</Badge>
                    {p.partido && <Badge variant="secondary">{p.partido}</Badge>}
                  </div>
                  {p.vice && (
                    <p className="text-sm text-muted-foreground">Vice: {p.vice}</p>
                  )}
                  {p.observacoes && (
                    <p className="text-sm text-muted-foreground">{p.observacoes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.periodoInicio)} até {p.periodoFim ? formatDate(p.periodoFim) : 'o momento'}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
