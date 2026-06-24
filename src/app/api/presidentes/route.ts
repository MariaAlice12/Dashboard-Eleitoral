import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const presidentes = await prisma.presidente.findMany({ orderBy: { ordem: 'asc' } })
    return NextResponse.json(
      { dados: presidentes },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800' } },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
