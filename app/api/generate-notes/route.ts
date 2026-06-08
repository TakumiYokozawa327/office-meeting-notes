import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Theme, TranscriptEntry } from '@/types/meeting'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { transcript, themes } = await req.json() as {
      transcript: TranscriptEntry[]
      themes: Theme[]
    }

    const transcriptText = transcript
      .map((e) => `[${new Date(e.timestamp).toLocaleTimeString('ja-JP')}] ${e.text}`)
      .join('\n')

    const themeStatus = themes
      .map((t) => `- ${t.name}: ${t.status === 'confirmed' ? '✓ 確認済み' : t.status === 'skipped' ? '— スキップ' : '未確認'}`)
      .join('\n')

    const prompt = `あなたはオフィス移転・リデザインの専門コンサルタントです。
以下の会議の文字起こしから、議事録と構造化データを日本語で作成してください。

## 会議テキスト
${transcriptText}

## テーマカバレッジ
${themeStatus}

## 出力形式
以下のJSON形式のみで返答してください（説明不要）:
{
  "notes": "# 会議議事録\n\n## 会議概要\n（日時・参加者・目的の簡潔な要約）\n\n## テーマ別サマリー\n（各テーマの議論内容・決定事項・課題）\n\n## アクションアイテム\n| No | タスク | 担当 | 期限 |\n|---|---|---|---|\n（具体的なアクション）\n\n## 次のステップ\n（スケジュール・進め方）\n\n## 補足・懸念事項\n（その他の重要情報）",
  "keyDecisions": [
    "会議中に確定した具体的な事実・数字・決定事項を1文で（例：予算上限は3,000万円で確定）"
  ],
  "openQuestions": [
    "まだ答えが出ていない課題・宿題・次回確認事項を1文で（例：移転時期は次回までに確認）"
  ]
}

keyDecisionsは会議中に明確に決まったこと（数字・合意事項）を3〜6個。
openQuestionsはまだ未決・要確認の事項を3〜5個。
notesフィールドは完全なMarkdown文字列として記述してください。`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Invalid response' }, { status: 500 })
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ notes: content.text, keyDecisions: [], openQuestions: [] })
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      notes: string
      keyDecisions: string[]
      openQuestions: string[]
    }

    return NextResponse.json({
      notes: parsed.notes ?? content.text,
      keyDecisions: parsed.keyDecisions ?? [],
      openQuestions: parsed.openQuestions ?? [],
    })
  } catch (error) {
    console.error('Generate notes error:', error)
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 })
  }
}
