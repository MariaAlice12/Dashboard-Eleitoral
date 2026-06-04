import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DeputadoResumo } from '@/types/camara'
import { PARTIDO_CORES } from '@/lib/partido-cores'

interface Props {
  deputado: DeputadoResumo
}

export function DeputadoCard({ deputado }: Props) {
  const cor = PARTIDO_CORES[deputado.siglaPartido] ?? '#6b7280'

  return (
    <Link href={`/deputado/${deputado.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="relative h-14 w-14 flex-shrink-0 rounded-full overflow-hidden bg-muted">
            <Image
              src={deputado.urlFoto}
              alt={deputado.nome}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{deputado.nome}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge
                style={{ backgroundColor: cor, color: '#fff' }}
                className="text-xs px-1.5 py-0"
              >
                {deputado.siglaPartido}
              </Badge>
              <span className="text-xs text-muted-foreground">{deputado.siglaUf}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
