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

各フィールドのルール:
- 会話から明確に判明: level="confirmed", confidence=80-95
- 発言から推測できる: level="estimated", confidence=50-79
- まだ不明: そのフィールドはnullにする
- aiAlert: 今すぐ営業が聞くべき最重要事項を1文（20文字以内）で。何も優先事項がなければ省略。

{"purpose":{"value":"移転目的","confidence":85,"level":"confirmed"},"budget":null,"decisionMaker":{"value":"総務部長","confidence":70,"level":"estimated"},"moveDate":null,"companySize":null,"missingItems":["予算感","意思決定プロセス"],"aiAlert":"予算の話をするタイミングです"}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
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
