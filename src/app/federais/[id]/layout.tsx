import { buscarDeputado } from '@/lib/camara-api'
import { DeputadoHeader } from '@/components/DeputadoHeader'
import { DeputadoTabs } from '@/components/DeputadoTabs'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const dep = await buscarDeputado(Number(id))
    return { title: `${dep.ultimoStatus.nome} | Dashboard Eleitoral` }
  } catch {
    return { title: 'Deputado | Dashboard Eleitoral' }
  }
}

export default async function DeputadoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deputado = await buscarDeputado(Number(id))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <DeputadoHeader deputado={deputado} />
      <DeputadoTabs id={id} />
      {children}
    </div>
  )
}
