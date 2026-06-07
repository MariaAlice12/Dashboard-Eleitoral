import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados } from '@/lib/camara-api'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  try {
    const data = await listarDeputados({
      nome: searchParams.get('nome') ?? undefined,
      siglaPartido: searchParams.get('siglaPartido') ?? undefined,
      siglaUf: searchParams.get('siglaUf') ?? undefined,
      itens: searchParams.get('itens') ?? undefined,
      pagina: searchParams.get('pagina') ?? undefined,
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
