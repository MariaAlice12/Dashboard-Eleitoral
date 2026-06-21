import { NextResponse } from 'next/server'
import { listarDeputados } from '@/lib/camara-api'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const dbCount = await prisma.deputado.count()

    if (dbCount === 0) {
      const partidos = new Set<string>()
      const ufs = new Set<string>()
      let total = 0
      let pagina = 1
      while (true) {
        const res = await listarDeputados({ itens: '100', pagina: String(pagina) })
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

    const [porPartido, porUf] = await Promise.all([
      prisma.deputado.groupBy({ by: ['siglaPartido'] }),
      prisma.deputado.groupBy({ by: ['siglaUf'] }),
    ])

    return NextResponse.json(
      { totalDeputados: dbCount, totalPartidos: porPartido.length, totalUfs: porUf.length },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
