import { NextRequest, NextResponse } from 'next/server'
import { listarVotacoesDeputado } from '@/lib/camara-api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = req.nextUrl
  try {
    const { id } = await params
    const data = await listarVotacoesDeputado(Number(id), {
      dataInicio: searchParams.get('dataInicio') ?? undefined,
      dataFim: searchParams.get('dataFim') ?? undefined,
      pagina: searchParams.get('pagina') ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
