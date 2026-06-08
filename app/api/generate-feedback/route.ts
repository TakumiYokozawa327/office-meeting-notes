import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Theme, TranscriptEntry, ThemeCoverage, MeetingFeedback } from '@/types/meeting'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { transcript, themes, coverage } = await req.json() as {
      transcript: TranscriptEntry[]
      themes: Theme[]
      coverage: ThemeCoverage[]
    }

    const transcriptText = transcript.map((e) => e.text).join('\n')
    const themeList = themes
      .map((t) => {
        const cov = coverage.find((c) => c.themeId === t.id)
        const depthLabel = cov
          ? { none: '未確認', surface: '表面的', moderate: 'ある程度', deep: '深い' }[cov.depth]
          : '未確認'
        const stars = '★'.repeat(t.priority)
        return `- id="${t.id}" | [優先度${stars}] ${t.name}: ${t.description}（深度: ${depthLabel} ${cov?.coveredPercent ?? 0}%）`
      })
      .join('\n')

    const prompt = `あなたはオフィス移転コンサルタントの営業コーチです。若手営業マンが行った会議を評価し、具体的で励みになるフィードバックを提供してください。

テーマ一覧（深度情報付き）:
${themeList}

会議の書き起こし:
"""
${transcriptText || '（書き起こしデータなし）'}
"""

以下の観点で評価してください:
- score: 総合点 (0〜100)
  - 優先度★★★★★のテーマの深度を最も重視してスコアリングしてください
  - 90以上: 優先度★★★★★テーマを深く確認し、多くのテーマをカバーできた
  - 70〜89: 重要テーマをカバーできたが一部浅い
  - 50〜69: 基本は押さえたが深掘り不足が目立つ
  - 49以下: 優先度の高いテーマの確認が不十分
- summary: 全体的な評価を若手営業向けに2文で（具体的・前向きなトーンで）
- positives: 良かった点を3つ（具体的に）
- improvements: 次回改善すべき点を3つ（具体的なアドバイス形式で）
- themeResults: 各テーマの評価
  - themeId, themeName, depth（none/surface/moderate/deep）, comment（1文）

JSON のみ返してください（説明不要）:
{
  "score": 75,
  "summary": "...",
  "positives": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "themeResults": [
    { "themeId": "...", "themeName": "...", "depth": "moderate", "comment": "..." }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ feedback: null })

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ feedback: null })

    const feedback: MeetingFeedback = JSON.parse(jsonMatch[0])
    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Feedback generation error:', error)
    return NextResponse.json({ feedback: null })
  }
}
