import { Gavel } from 'lucide-react'
import { EmBreveSection } from '@/components/EmBreveSection'

export default function SenadoPage() {
  return (
    <EmBreveSection
      titulo="Senadores"
      descricao="Composição e atuação do Senado Federal."
      icon={Gavel}
    />
  )
}
