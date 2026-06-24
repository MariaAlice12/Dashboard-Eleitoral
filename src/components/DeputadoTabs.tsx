'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Perfil', href: '' },
  { label: 'Votos', href: '/votos' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Presença', href: '/presenca' },
  { label: 'Gastos', href: '/gastos' },
]

export function DeputadoTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const base = `/federais/${id}`

  return (
    <nav className="flex gap-1 border-b overflow-x-auto">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`
        const isActive = tab.href === ''
          ? pathname === base
          : pathname.startsWith(href)

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
