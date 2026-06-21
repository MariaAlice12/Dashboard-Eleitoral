import { NextRequest, NextResponse } from 'next/server'
import { listarProposicoesDeputado } from '@/lib/camara-api'
import { classificarProposicoesComIA } from '@/lib/classificar-area-ia'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = req.nextUrl
  const { id } = await params
  const idDeputado = Number(id)
  const ano = searchParams.get('ano') ?? undefined
  const siglaTipo = searchParams.get('siglaTipo') ?? undefined
  const pagina = Number(searchParams.get('pagina') ?? '1')
  const itens = Number(searchParams.get('itens') ?? '100')

  try {
    const where = {
      idDeputadoAutor: idDeputado,
      ...(ano && { ano: Number(ano) }),
      ...(siglaTipo && { siglaTipo }),
    }

    const totalNoBanco = await prisma.proposicao.count({ where })

    if (totalNoBanco > 0) {
      const proposicoes = await prisma.proposicao.findMany({
        where,
        orderBy: { ano: 'desc' },
        skip: (pagina - 1) * itens,
        take: itens,
      })

      const dados = proposicoes.map((p) => ({
        id: p.id,
        uri: '',
        siglaTipo: p.siglaTipo,
        codTipo: 0,
        numero: p.numero,
        ano: p.ano,
        ementa: p.ementa,
        areaId: p.areaId,
      }))

      const temProxima = pagina * itens < totalNoBanco
      const links = temProxima ? [{ rel: 'next', href: '' }] : []

      return NextResponse.json({ dados, links })
    }

    const data = await listarProposicoesDeputado(idDeputado, { ano, siglaTipo, pagina: String(pagina) })
    const areas = await classificarProposicoesComIA(data.dados)
    const dados = data.dados.map((p) => ({ ...p, areaId: areas.get(p.id) }))

    return NextResponse.json({ ...data, dados })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
