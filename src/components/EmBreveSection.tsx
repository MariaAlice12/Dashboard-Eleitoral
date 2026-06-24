import Link from 'next/link'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

export function EmBreveSection({
  titulo,
  descricao,
  icon: Icon,
}: {
  titulo: string
  descricao: string
  icon: LucideIcon
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
      <Icon className="h-12 w-12 text-primary mx-auto" />
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="text-muted-foreground">{descricao}</p>
      <p className="text-sm text-muted-foreground">
        Essa seção ainda não tem dados — estamos avaliando as fontes oficiais para integrar.
      </p>
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para a home
      </Link>
    </div>
  )
}
