'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { ProposicaoDetalhe } from '@/types/camara'

async function fetchProposicaoDetalhe(id: number): Promise<ProposicaoDetalhe> {
  const res = await fetch(`/api/proposicoes/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar projeto')
  return res.json()
}

export function ProjetoDetalheModal({
  proposicaoId,
  onOpenChange,
}: {
  proposicaoId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['proposicao-detalhe', proposicaoId],
    queryFn: () => fetchProposicaoDetalhe(proposicaoId as number),
    enabled: proposicaoId !== null,
    staleTime: 30 * 60 * 1000,
  })

  return (
    <Dialog open={proposicaoId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !data ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {data.siglaTipo} {data.numero}/{data.ano}
                </Badge>
                <span>{data.descricaoTipo}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <p className="font-medium leading-relaxed">{data.ementa}</p>

              {data.ementaDetalhada && (
                <p className="text-muted-foreground leading-relaxed">{data.ementaDetalhada}</p>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Apresentação</p>
                  <p className="font-medium">{formatDate(data.dataApresentacao)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Situação atual</p>
                  <p className="font-medium">{data.statusProposicao?.descricaoSituacao ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Última tramitação</p>
                  <p className="font-medium">
                    {data.statusProposicao?.descricaoTramitacao ?? '—'}
                    {data.statusProposicao?.siglaOrgao && ` · ${data.statusProposicao.siglaOrgao}`}
                  </p>
                  {data.statusProposicao?.despacho && (
                    <p className="text-muted-foreground mt-1">{data.statusProposicao.despacho}</p>
                  )}
                </div>
              </div>

              {data.justificativa && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Justificativa
                  </p>
                  <p className="leading-relaxed whitespace-pre-line">{data.justificativa}</p>
                </div>
              )}

              {data.keywords && (
                <div className="flex flex-wrap gap-1">
                  {data.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((k) => (
                    <Badge key={k} variant="outline" className="text-xs">
                      {k}
                    </Badge>
                  ))}
                </div>
              )}

              {data.urlInteiroTeor && (
                <a
                  href={data.urlInteiroTeor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Ler texto integral (PDF) <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
