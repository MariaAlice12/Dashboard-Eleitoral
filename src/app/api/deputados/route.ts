import { NextRequest, NextResponse } from 'next/server'
import { contarDeputados, listarDeputados } from '@/lib/camara-api'
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

    // total real do universo de deputados (não depende do progresso do sync no banco)
    const total = await contarDeputados({ nome, siglaPartido, siglaUf })

    const dbCount = await prisma.deputado.count({ where })

    if (dbCount === 0) {
      const data = await listarDeputados({ nome, siglaPartido, siglaUf, itens: String(itens), pagina: String(pagina) })
      return NextResponse.json({ ...data, total }, {
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

    // a navegação por página segue o que já está sincronizado no banco;
    // "total" acima reflete o universo real, mesmo com o sync em andamento
    const temProxima = pagina * itens < dbCount
    const links = temProxima ? [{ rel: 'next', href: '' }] : []

    return NextResponse.json({ dados, links, total }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
