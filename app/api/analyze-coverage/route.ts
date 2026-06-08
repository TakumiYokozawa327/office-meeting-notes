import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Theme, TranscriptEntry, ThemeCoverage } from '@/types/meeting'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { transcript, themes } = await req.json() as {
      transcript: TranscriptEntry[]
      themes: Theme[]
    }

    if (transcript.length < 2) {
      return NextResponse.json({ coverage: [] })
    }

    const transcriptText = transcript.map((e) => e.text).join('\n')
    const themeList = themes
      .map((t) => {
        const stars = '★'.repeat(t.priority) + '☆'.repeat(5 - t.priority)
        return `- id="${t.id}" | [優先度${stars}] ${t.name}: ${t.description}`
      })
      .join('\n')

    const prompt = `あなたはオフィス移転コンサルタントの会議コーチです。若手営業マンが行った会議を分析し、各テーマがどれだけ深く掘り下げられたかを評価してください。

テーマ一覧（優先度★5が最重要）:
${themeList}

会議の書き起こし:
"""
${transcriptText}
"""

各テーマについて以下を評価してください:
- coveredPercent: カバー度合い (0〜100の整数)
- depth:
  - "none" : 全く触れていない
  - "surface" : 話題に出たが表面的（具体的な数字・条件・背景まで確認できていない）
  - "moderate" : ある程度確認できた
  - "deep" : 具体的な数字・背景・条件まで深く掘り下げられた
- alert: 以下の場合にのみ若手営業向けに1文でアラートを出す。それ以外は null。
  - depth が "surface" のとき（何を確認できていないか）
  - depth が "none" かつ優先度が★4以上のとき（このテーマがまだ未確認であることの警告）

JSON配列のみ返してください（説明不要）:
[
  { "themeId": "...", "coveredPercent": 0, "depth": "none", "alert": null },
  ...
]`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ coverage: [] })

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ coverage: [] })

    const raw = JSON.parse(jsonMatch[0]) as Array<{
      themeId: string
      coveredPercent: number
      depth: string
      alert: string | null
    }>

    const coverage: ThemeCoverage[] = raw.map((r) => ({
      themeId: r.themeId,
      coveredPercent: Math.min(100, Math.max(0, r.coveredPercent)),
      depth: (['none', 'surface', 'moderate', 'deep'].includes(r.depth)
        ? r.depth
        : 'none') as ThemeCoverage['depth'],
      alert: r.alert ?? undefined,
    }))

    return NextResponse.json({ coverage })
  } catch (error) {
    console.error('Coverage analysis error:', error)
    return NextResponse.json({ coverage: [] })
  }
}
