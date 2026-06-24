import { buscarDeputado, listarVotacoesDeputado, listarProposicoesDeputado, listarDespesasDeputado, listarEventosDeputado } from '@/lib/camara-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, FileText, Calendar, Wallet } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/format'

interface Props {
  params: Promise<{ id: string }>
}

async function calcPresenca(id: number) {
  try {
    const eventos = await listarEventosDeputado(id, { dataInicio: '2023-02-01' })
    const total = eventos.dados.length
    if (total === 0) return null
    const presente = eventos.dados.filter((e) => e.situacao && !e.situacao.toLowerCase().includes('cancelad')).length
    return Math.round((presente / total) * 100)
  } catch { return null }
}

async function calcTotalCEAP(id: number) {
  try {
    const despesas = await listarDespesasDeputado(id, { ano: String(new Date().getFullYear()) })
    return despesas.dados.reduce((sum, d) => sum + d.valorLiquido, 0)
  } catch { return null }
}

function ScoreCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode
  title: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default async function DeputadoPage({ params }: Props) {
  const { id } = await params
  const [deputado, votacoes, proposicoes, presenca, ceap] = await Promise.allSettled([
    buscarDeputado(Number(id)),
    listarVotacoesDeputado(Number(id)),
    listarProposicoesDeputado(Number(id)),
    calcPresenca(Number(id)),
    calcTotalCEAP(Number(id)),
  ])

  const totalVotos = votacoes.status === 'fulfilled' ? votacoes.value.dados.length : 0
  const totalProjetos = proposicoes.status === 'fulfilled' ? proposicoes.value.dados.length : 0
  const pctPresenca = presenca.status === 'fulfilled' && presenca.value !== null
    ? formatPercent(presenca.value)
    : '—'
  const totalCeap = ceap.status === 'fulfilled' && ceap.value !== null
    ? formatCurrency(ceap.value)
    : '—'

  const dep = deputado.status === 'fulfilled' ? deputado.value : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          icon={<CheckCircle className="h-4 w-4" />}
          title="Votações registradas"
          value={String(totalVotos)}
          sub="últimas disponíveis"
        />
        <ScoreCard
          icon={<FileText className="h-4 w-4" />}
          title="Projetos apresentados"
          value={String(totalProjetos)}
          sub="na legislatura atual"
        />
        <ScoreCard
          icon={<Calendar className="h-4 w-4" />}
          title="Taxa de presença"
          value={pctPresenca}
          sub="desde fev/2023"
        />
        <ScoreCard
          icon={<Wallet className="h-4 w-4" />}
          title="CEAP (ano atual)"
          value={totalCeap}
          sub="cota parlamentar"
        />
      </div>

      {dep && dep.ultimoStatus.gabinete && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gabinete</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {dep.ultimoStatus.gabinete.predio && (
              <p>Prédio {dep.ultimoStatus.gabinete.predio}, sala {dep.ultimoStatus.gabinete.sala}, {dep.ultimoStatus.gabinete.andar}º andar</p>
            )}
            {dep.ultimoStatus.gabinete.telefone && (
              <p>Telefone: {dep.ultimoStatus.gabinete.telefone}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
