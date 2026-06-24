import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados } from '@/lib/camara-api'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const siglaPartido = searchParams.get('siglaPartido') || undefined
    const siglaUf = searchParams.get('siglaUf') || undefined

    const dbCount = await prisma.deputado.count()

    if (dbCount === 0) {
      const partidos = new Set<string>()
      const ufs = new Set<string>()
      let total = 0
      let pagina = 1
      while (true) {
        const res = await listarDeputados({ itens: '100', pagina: String(pagina), siglaPartido, siglaUf })
        res.dados.forEach((d) => {
          partidos.add(d.siglaPartido)
          ufs.add(d.siglaUf)
        })
        total += res.dados.length
        if (!res.links.some((l) => l.rel === 'next')) break
        pagina += 1
      }
      return NextResponse.json(
        { totalDeputados: total, totalPartidos: partidos.size, totalUfs: ufs.size },
        { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
      )
    }

    // O filtro de cada big number ignora o próprio campo que ele representa:
    // ao filtrar por UF, "partidos" deve contar os partidos só daquele UF
    // (e vice-versa), senão o número não muda quando o usuário aplica o filtro.
    const where = { siglaPartido, siglaUf }
    const [totalDeputados, porPartido, porUf] = await Promise.all([
      prisma.deputado.count({ where }),
      prisma.deputado.groupBy({ by: ['siglaPartido'], where: { siglaUf } }),
      prisma.deputado.groupBy({ by: ['siglaUf'], where: { siglaPartido } }),
    ])

    return NextResponse.json(
      { totalDeputados, totalPartidos: porPartido.length, totalUfs: porUf.length },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
