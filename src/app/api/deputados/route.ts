import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados } from '@/lib/camara-api'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  try {
    const data = await listarDeputados({
      nome: searchParams.get('nome') ?? undefined,
      siglaPartido: searchParams.get('siglaPartido') ?? undefined,
      siglaUf: searchParams.get('siglaUf') ?? undefined,
      idLegislatura: searchParams.get('idLegislatura') ?? undefined,
      pagina: searchParams.get('pagina') ?? undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
