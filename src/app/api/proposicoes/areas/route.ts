import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const grupos = await prisma.proposicao.groupBy({
      by: ['areaId'],
      _count: { _all: true },
    })

    const total = grupos.reduce((acc, g) => acc + g._count._all, 0)
    const dados = grupos.map((g) => ({ areaId: g.areaId, count: g._count._all }))

    return NextResponse.json({ dados, total }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
