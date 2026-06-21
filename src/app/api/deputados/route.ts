import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados } from '@/lib/camara-api'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nome = searchParams.get('nome') ?? undefined
  const siglaPartido = searchParams.get('siglaPartido') ?? undefined
  const siglaUf = searchParams.get('siglaUf') ?? undefined
  const itens = Number(searchParams.get('itens') ?? '100')
  const pagina = Number(searchParams.get('pagina') ?? '1')

  try {
    const where = {
      ...(nome && { nome: { contains: nome, mode: 'insensitive' as const } }),
      ...(siglaPartido && { siglaPartido }),
      ...(siglaUf && { siglaUf }),
    }

    const total = await prisma.deputado.count({ where })

    if (total === 0) {
      const data = await listarDeputados({ nome, siglaPartido, siglaUf, itens: String(itens), pagina: String(pagina) })
      return NextResponse.json({ ...data, total: data.dados.length }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
      })
    }

    const deputados = await prisma.deputado.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip: (pagina - 1) * itens,
      take: itens,
    })

    const dados = deputados.map((d) => ({
      id: d.id,
      nome: d.nome,
      siglaPartido: d.siglaPartido,
      siglaUf: d.siglaUf,
      idLegislatura: 0,
      urlFoto: d.urlFoto,
      email: d.email ?? '',
    }))

    const temProxima = pagina * itens < total
    const links = temProxima ? [{ rel: 'next', href: '' }] : []

    return NextResponse.json({ dados, links, total }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
