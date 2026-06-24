import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary hover:opacity-80 transition-opacity">
          <BarChart2 className="h-5 w-5" />
          <span>Dashboard Eleitoral</span>
        </Link>
      </div>
    </header>
  )
}
