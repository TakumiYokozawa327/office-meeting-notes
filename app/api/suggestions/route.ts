import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Theme, SessionRecord, Suggestion } from '@/types/meeting'
import { buildPriorContextSection } from '@/lib/priorContext'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { recentTranscript, themes, priorHistory = [], targetThemeId } = await req.json() as {
    recentTranscript: string
    themes: Theme[]
    priorHistory?: SessionRecord[]
    targetThemeId?: string
  }

  const candidateThemes = targetThemeId
    ? themes.filter((t) => t.id === targetThemeId)
    : themes.filter((t) => t.status === 'pending')

  if (candidateThemes.length === 0) {
    return new Response('', { status: 200 })
  }

  const themeList = candidateThemes
    .map((t) => {
      const stars = '★'.repeat(t.priority)
      return `- id="${t.id}" | [優先度${stars}] ${t.name}（${t.nameEn}）: ${t.description}`
    })
    .join('\n')

  const priorContextSection = buildPriorContextSection(priorHistory)

  const prompt = targetThemeId
    ? `あなたはオフィス移転・リデザインの専門コンサルタントです。

クライアントとの会議でのリアルタイム会話を支援しています。
${priorContextSection}
直近の会話:
"""
${recentTranscript || '（まだ会話がありません）'}
"""

以下のテーマについて、今の会話の文脈に合った質問を3つ生成してください:
${themeList}

1提案を1行に出力してください。JSON配列は使わないこと。themeIdは必ず上記の id="" の値をそのまま使用してください。questionは15文字以内の短い問いかけにすること。reasonは「なぜ今この質問をすべきか」を若手営業向けに1文で説明してください:
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}`
    : `あなたはオフィス移転・リデザインの専門コンサルタントです。

クライアントとの会議でのリアルタイム会話を支援しています。
${priorContextSection}
直近の会話:
"""
${recentTranscript || '（まだ会話がありません）'}
"""

まだカバーできていないテーマ（★が多いほど重要度が高い）:
${themeList}

上記の会話の流れを踏まえ、未カバーのテーマに関して自然に質問できる内容を3つ提案してください。
過去の積み残しがある場合はそれを最優先してください。
優先度★★★★★や★★★★のテーマは未確認の場合、優先的に提案してください。
会話の文脈に合わせて、唐突にならない質問にしてください。

1提案を1行に出力してください。JSON配列は使わないこと。themeIdは必ず上記の id="" の値をそのまま使用してください。questionは15文字以内の短い問いかけにすること（例：「移転の本当の理由は？」「予算の上限はいくら？」）。reasonは「なぜ今この質問をすべきか」を若手営業向けに1文で説明してください:
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}
{"themeId": "テーマID", "question": "質問内容", "reason": "今聞くべき理由"}`

  const encoder = new TextEncoder()
  let suggestionIndex = 0

  const buildSuggestion = (raw: { themeId: string; question: string; reason?: string }): Suggestion => {
    const matchedTheme =
      themes.find((t) => t.id === raw.themeId) ??
      themes.find((t) => t.id.toLowerCase() === raw.themeId.toLowerCase()) ??
      themes.find((t) => raw.themeId.toLowerCase().includes(t.id.toLowerCase()))
    return {
      id: `sug-${Date.now()}-${suggestionIndex++}`,
      themeId: matchedTheme?.id ?? raw.themeId,
      themeName: matchedTheme?.name ?? raw.themeId,
      question: raw.question,
      reason: raw.reason,
      status: 'pending',
    }
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        })

        let buffer = ''

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            buffer += event.delta.text
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) continue
              try {
                const raw = JSON.parse(trimmed) as { themeId: string; question: string; reason?: string }
                controller.enqueue(encoder.encode(JSON.stringify(buildSuggestion(raw)) + '\n'))
              } catch {
                // malformed line, skip
              }
            }
          }
        }

        const trimmed = buffer.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const raw = JSON.parse(trimmed) as { themeId: string; question: string; reason?: string }
            controller.enqueue(encoder.encode(JSON.stringify(buildSuggestion(raw)) + '\n'))
          } catch {}
        }
      } catch (error) {
        console.error('Suggestions stream error:', error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}
