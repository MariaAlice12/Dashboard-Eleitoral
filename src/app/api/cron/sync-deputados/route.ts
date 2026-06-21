import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados, listarProposicoesDeputado } from '@/lib/camara-api'
import { classificarProposicoesComIA } from '@/lib/classificar-area-ia'
import { prisma } from '@/lib/prisma'
import type { DeputadoResumo, Proposicao } from '@/types/camara'

export const maxDuration = 800

async function listarTodosDeputados(): Promise<DeputadoResumo[]> {
  const todos: DeputadoResumo[] = []
  let pagina = 1
  while (true) {
    const res = await listarDeputados({ itens: '100', pagina: String(pagina) })
    todos.push(...res.dados)
    if (!res.links.some((l) => l.rel === 'next')) break
    pagina += 1
  }
  return todos
}

async function listarTodasProposicoes(idDeputado: number): Promise<Proposicao[]> {
  const todas: Proposicao[] = []
  let pagina = 1
  while (true) {
    const res = await listarProposicoesDeputado(idDeputado, { pagina: String(pagina) })
    todas.push(...res.dados)
    if (!res.links.some((l) => l.rel === 'next')) break
    pagina += 1
  }
  return todas
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let deputadosProcessados = 0
  let proposicoesProcessadas = 0

  try {
    const deputados = await listarTodosDeputados()

    for (const dep of deputados) {
      await prisma.deputado.upsert({
        where: { id: dep.id },
        create: {
          id: dep.id,
          nome: dep.nome,
          siglaPartido: dep.siglaPartido,
          siglaUf: dep.siglaUf,
          urlFoto: dep.urlFoto,
          email: dep.email || null,
        },
        update: {
          nome: dep.nome,
          siglaPartido: dep.siglaPartido,
          siglaUf: dep.siglaUf,
          urlFoto: dep.urlFoto,
          email: dep.email || null,
        },
      })
      deputadosProcessados += 1

      const proposicoes = await listarTodasProposicoes(dep.id)
      if (proposicoes.length === 0) continue

      const areas = await classificarProposicoesComIA(proposicoes)

      for (const p of proposicoes) {
        const areaId = areas.get(p.id) ?? 'outros'
        await prisma.proposicao.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            idDeputadoAutor: dep.id,
            siglaTipo: p.siglaTipo,
            numero: p.numero,
            ano: p.ano,
            ementa: p.ementa,
            areaId,
          },
          update: {
            siglaTipo: p.siglaTipo,
            numero: p.numero,
            ano: p.ano,
            ementa: p.ementa,
            areaId,
          },
        })
        proposicoesProcessadas += 1
      }
    }

    await prisma.ingestaoLog.create({
      data: { status: 'sucesso', deputadosProcessados, proposicoesProcessadas },
    })

    return NextResponse.json({ deputadosProcessados, proposicoesProcessadas })
  } catch (err) {
    await prisma.ingestaoLog.create({
      data: {
        status: 'erro',
        deputadosProcessados,
        proposicoesProcessadas,
        erro: String(err),
      },
    })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
