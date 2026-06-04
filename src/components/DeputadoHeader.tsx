import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { DeputadoDetalhe } from '@/types/camara'
import { PARTIDO_CORES } from '@/lib/partido-cores'
import { Mail, Globe } from 'lucide-react'

interface Props {
  deputado: DeputadoDetalhe
}

export function DeputadoHeader({ deputado }: Props) {
  const status = deputado.ultimoStatus
  const cor = PARTIDO_CORES[status.siglaPartido] ?? '#6b7280'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative h-28 w-28 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
            <Image
              src={status.urlFoto}
              alt={status.nome}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{status.nome}</h1>
              <Badge style={{ backgroundColor: cor, color: '#fff' }}>
                {status.siglaPartido}
              </Badge>
              <Badge variant="outline">{status.siglaUf}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{status.situacao}</p>
            {deputado.escolaridade && (
              <p className="text-sm text-muted-foreground">Escolaridade: {deputado.escolaridade}</p>
            )}
            <div className="flex flex-wrap gap-4 pt-1">
              {status.gabinete?.telefone && (
                <span className="text-xs text-muted-foreground">
                  Tel: {status.gabinete.telefone}
                </span>
              )}
              {status.email && (
                <a
                  href={`mailto:${status.email}`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {status.email}
                </a>
              )}
              {deputado.urlWebsite && (
                <a
                  href={deputado.urlWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  Site pessoal
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
