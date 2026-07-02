import { NextRequest, NextResponse } from 'next/server'
import { buscarProposicao } from '@/lib/camara-api'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await buscarProposicao(Number(id))
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
