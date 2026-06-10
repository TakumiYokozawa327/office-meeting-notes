import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TranscriptEntry, AIInsight } from '@/types/meeting'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { transcript } = await req.json() as { transcript: TranscriptEntry[] }

  if (transcript.length < 3) {
    return Response.json({ insight: { missingItems: [] } })
  }

  const recentText = transcript.slice(-30).map((e) => e.text).join('\n')

  const prompt = `以下はオフィス移転商談の会話です。判明した情報をJSONで返してください。

会話:
"""
${recentText}
"""

判明していない項目はキーを省略してください。missingItemsには未取得の重要事項を最大5件列挙してください。

{"purpose":"移転目的","budget":"予算感","decisionMaker":"意思決定者","moveDate":"移転希望時期","companySize":"人数・規模","missingItems":["未取得事項"]}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ insight: { missingItems: [] } })

    const insight: AIInsight = JSON.parse(match[0])
    if (!insight.missingItems) insight.missingItems = []
    return Response.json({ insight })
  } catch {
    return Response.json({ insight: { missingItems: [] } })
  }
}
