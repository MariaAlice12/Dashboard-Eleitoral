import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const siglaPartido = searchParams.get('siglaPartido') || undefined
    const siglaUf = searchParams.get('siglaUf') || undefined
    const anoParam = searchParams.get('ano')
    const ano = anoParam && anoParam !== 'todos' ? parseInt(anoParam) : undefined
    const itens = Math.min(parseInt(searchParams.get('itens') ?? '50'), 200)

    // Agrupa proposições por autor, filtrando por ano se informado.
    // O groupBy retorna no máximo ~600 linhas (um por deputado), então buscar
    // tudo e filtrar por partido/UF no passo seguinte é eficiente o suficiente.
    const grupos = await prisma.proposicao.groupBy({
      by: ['idDeputadoAutor'],
      _count: { idDeputadoAutor: true },
      where: ano ? { ano } : undefined,
      orderBy: { _count: { idDeputadoAutor: 'desc' } },
    })

    const ids = grupos.map((g) => g.idDeputadoAutor)

    const deputados = await prisma.deputado.findMany({
      where: {
        id: { in: ids },
        ...(siglaPartido ? { siglaPartido } : {}),
        ...(siglaUf ? { siglaUf } : {}),
      },
      select: { id: true, nome: true, siglaPartido: true, siglaUf: true, urlFoto: true },
    })

    const depMap = new Map(deputados.map((d) => [d.id, d]))

    const dados = grupos
      .map((g) => {
        const dep = depMap.get(g.idDeputadoAutor)
        if (!dep) return null
        return { ...dep, totalProposicoes: g._count.idDeputadoAutor }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, itens)

    return NextResponse.json(
      { dados },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
