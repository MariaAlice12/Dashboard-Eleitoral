import Link from 'next/link'
import { Landmark, Building2, Gavel, Vote, ScrollText, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Secao = {
  titulo: string
  descricao: string
  icon: LucideIcon
  href: string
  disponivel: boolean
}

const SECOES: Secao[] = [
  {
    titulo: 'Deputados Federais',
    descricao: 'Votações, projetos de lei, presença e gastos (CEAP) dos deputados federais.',
    icon: Landmark,
    href: '/federais',
    disponivel: true,
  },
  {
    titulo: 'Deputados Estaduais',
    descricao: 'Representantes nas Assembleias Legislativas dos estados.',
    icon: Building2,
    href: '/estaduais',
    disponivel: true,
  },
  {
    titulo: 'Senadores',
    descricao: 'Composição e atuação do Senado Federal.',
    icon: Gavel,
    href: '/senado',
    disponivel: true,
  },
  {
    titulo: 'Vereadores',
    descricao: 'Representantes nas Câmaras Municipais.',
    icon: Vote,
    href: '/vereadores',
    disponivel: true,
  },
  {
    titulo: 'Linha do Tempo Presidencial',
    descricao: 'Presidentes que já exerceram mandato no Brasil, em ordem cronológica.',
    icon: ScrollText,
    href: '/presidencial',
    disponivel: true,
  },
]

function SecaoCard({ secao }: { secao: Secao }) {
  const Icon = secao.icon

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <Icon className="h-8 w-8 text-primary" />
        {!secao.disponivel && <Badge variant="secondary">Em breve</Badge>}
      </div>
      <h2 className="text-lg font-semibold">{secao.titulo}</h2>
      <p className="text-sm text-muted-foreground">{secao.descricao}</p>
    </>
  )

  const className = cn(
    'flex flex-col gap-3 rounded-xl border bg-card p-6 text-left transition-colors h-full',
    secao.disponivel
      ? 'hover:border-primary hover:bg-muted/50 cursor-pointer'
      : 'opacity-60 cursor-not-allowed',
  )

  if (!secao.disponivel) {
    return <div className={className}>{conteudo}</div>
  }

  return (
    <Link href={secao.href} className={className}>
      {conteudo}
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Eleitoral</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transparência política consolidada: escolha um cargo para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECOES.map((secao) => (
          <SecaoCard key={secao.href} secao={secao} />
        ))}
      </div>
    </div>
  )
}
