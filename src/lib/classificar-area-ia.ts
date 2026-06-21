import { redis } from './redis'
import { AREAS, classificarProposicao } from './classificar-proposicao'

const AREA_IDS = AREAS.map((a) => a.id)
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const CACHE_TTL = 60 * 60 * 24 * 90 // 90 dias — a ementa de uma proposição não muda
const BATCH_SIZE = 30

type ProposicaoMinima = { id: number; ementa: string }

async function classificarLoteComGemini(lote: ProposicaoMinima[]): Promise<Map<number, string>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const prompt = `Classifique cada proposição legislativa abaixo em UMA das áreas: ${AREA_IDS.join(', ')}.
Responda em JSON: uma lista de objetos {"id": <id da proposição>, "area": <um dos ids de área listados>}.

Proposições:
${lote.map((p) => `${p.id}: ${p.ementa.slice(0, 500)}`).join('\n')}`

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER' },
              area: { type: 'STRING', enum: AREA_IDS },
            },
            required: ['id', 'area'],
          },
        },
      },
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Resposta vazia da Gemini')

  const parsed: { id: number; area: string }[] = JSON.parse(text)
  const result = new Map<number, string>()
  for (const item of parsed) {
    if (AREA_IDS.includes(item.area)) result.set(item.id, item.area)
  }
  return result
}

export async function classificarProposicoesComIA(
  proposicoes: ProposicaoMinima[],
): Promise<Map<number, string>> {
  const resultado = new Map<number, string>()
  if (proposicoes.length === 0) return resultado

  let cached: (string | null)[]
  try {
    cached = await redis.mget<string[]>(...proposicoes.map((p) => `area-ia:${p.id}`))
  } catch {
    cached = proposicoes.map(() => null)
  }

  const pendentes: ProposicaoMinima[] = []
  proposicoes.forEach((p, i) => {
    if (cached[i]) resultado.set(p.id, cached[i] as string)
    else pendentes.push(p)
  })

  for (let i = 0; i < pendentes.length; i += BATCH_SIZE) {
    const lote = pendentes.slice(i, i + BATCH_SIZE)
    let classificadas: Map<number, string>
    try {
      classificadas = await classificarLoteComGemini(lote)
    } catch {
      classificadas = new Map()
    }

    await Promise.all(
      lote.map(async (p) => {
        const areaId = classificadas.get(p.id) ?? classificarProposicao(p.ementa)
        resultado.set(p.id, areaId)
        try {
          await redis.setex(`area-ia:${p.id}`, CACHE_TTL, areaId)
        } catch {
          // cache indisponível, segue sem persistir
        }
      }),
    )
  }

  return resultado
}
