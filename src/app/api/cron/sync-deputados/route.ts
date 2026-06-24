import { NextRequest, NextResponse } from 'next/server'
import { listarDeputados, listarProposicoesDeputado } from '@/lib/camara-api'
import { classificarProposicoesComIA } from '@/lib/classificar-area-ia'
import { prisma } from '@/lib/prisma'
import type { DeputadoResumo, Proposicao } from '@/types/camara'

export const maxDuration = 60

// Cada execução processa só um lote de deputados para caber no limite de
// duração da função serverless (60s no plano Hobby da Vercel). O progresso
// fica salvo em SyncState após CADA deputado (não só no fim do lote), porque
// um timeout mata o processo sem lançar exception — sem isso o cursor nunca
// avançava e o cron reprocessava sempre os mesmos primeiros deputados.
const TAMANHO_LOTE = 5

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

async function processarDeputado(dep: DeputadoResumo): Promise<number> {
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

  const proposicoes = await listarTodasProposicoes(dep.id)
  if (proposicoes.length === 0) return 0

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
  }

  return proposicoes.length
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const estado = await prisma.syncState.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })

  const todos = (await listarTodosDeputados()).sort((a, b) => a.id - b.id)
  const restantes = todos.filter(
    (d) => estado.cursorDeputadoId === null || d.id > estado.cursorDeputadoId,
  )

  // Lote vazio com cursor existente = a passada anterior terminou tudo;
  // reinicia do começo nesta mesma execução.
  const pendentes = restantes.length > 0 ? restantes : todos
  const inicioNovaPassada = restantes.length === 0
  const lote = pendentes.slice(0, TAMANHO_LOTE)

  let deputadosProcessados = inicioNovaPassada ? 0 : estado.deputadosProcessados
  let proposicoesProcessadas = inicioNovaPassada ? 0 : estado.proposicoesProcessadas

  try {
    for (const dep of lote) {
      proposicoesProcessadas += await processarDeputado(dep)
      deputadosProcessados += 1

      // Salva o cursor logo após cada deputado. Se a função for matada por
      // timeout no meio do lote, a próxima execução retoma a partir daqui
      // em vez de reprocessar os mesmos deputados do início.
      await prisma.syncState.update({
        where: { id: 1 },
        data: {
          cursorDeputadoId: dep.id,
          deputadosProcessados,
          proposicoesProcessadas,
        },
      })
    }

    const cursorAtual = lote.length > 0 ? lote[lote.length - 1].id : null
    const passaCompleta = todos.every(
      (d) => cursorAtual !== null && d.id <= cursorAtual,
    )

    if (passaCompleta) {
      await prisma.syncState.update({
        where: { id: 1 },
        data: { cursorDeputadoId: null, deputadosProcessados: 0, proposicoesProcessadas: 0 },
      })
      await prisma.ingestaoLog.create({
        data: { status: 'sucesso', deputadosProcessados, proposicoesProcessadas },
      })
    }

    return NextResponse.json({
      loteProcessado: lote.length,
      deputadosProcessados,
      proposicoesProcessadas,
      passaCompleta,
    })
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
