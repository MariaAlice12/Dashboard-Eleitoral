import Link from 'next/link'
import { BarChart2, FileText } from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary hover:opacity-80 transition-opacity">
          <BarChart2 className="h-5 w-5" />
          <span>Dashboard Eleitoral</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Deputados
          </Link>
          <Link href="/ranking" className="hover:text-foreground transition-colors">
            Ranking
          </Link>
          <Link href="/ranking/projetos" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <FileText className="h-4 w-4" />
            Projetos
          </Link>
        </nav>
      </div>
    </header>
  )
}
