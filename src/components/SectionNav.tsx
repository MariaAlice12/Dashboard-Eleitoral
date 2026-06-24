'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Lista', href: '/federais' },
  { label: 'Ranking', href: '/federais/ranking' },
  { label: 'Projetos', href: '/federais/projetos' },
]

export function SectionNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b overflow-x-auto mb-6">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
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
