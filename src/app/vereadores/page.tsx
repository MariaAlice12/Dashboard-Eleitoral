import { Vote } from 'lucide-react'
import { EmBreveSection } from '@/components/EmBreveSection'

export default function VereadoresPage() {
  return (
    <EmBreveSection
      titulo="Vereadores"
      descricao="Representantes nas Câmaras Municipais."
      icon={Vote}
    />
  )
}
