import { SessionRecord, CoverageDepth } from '@/types/meeting'

const DEPTH_LABEL: Record<CoverageDepth, string> = {
  none: '未確認',
  surface: '表面的',
  moderate: 'ある程度',
  deep: '深い',
}

const DEPTH_ORDER: CoverageDepth[] = ['none', 'surface', 'moderate', 'deep']

export function buildPriorContextSection(priorHistory: SessionRecord[]): string {
  if (!priorHistory?.length) return ''

  const allDecisions = priorHistory.flatMap((s) => s.keyDecisions ?? []).filter(Boolean)
  const lastOpenQuestions = priorHistory[priorHistory.length - 1].openQuestions ?? []

  const maxDepth: Record<string, CoverageDepth> = {}
  for (const session of priorHistory) {
    for (const cov of session.coverage ?? []) {
      const curr = maxDepth[cov.themeId] ?? 'none'
      if (DEPTH_ORDER.indexOf(cov.depth) > DEPTH_ORDER.indexOf(curr)) {
        maxDepth[cov.themeId] = cov.depth
      }
    }
  }

  const confirmedThemeIds = [...new Set(priorHistory.flatMap((s) => s.confirmedThemeIds ?? []))]

  const coverageLines = Object.entries(maxDepth)
    .filter(([, d]) => d !== 'none')
    .map(([id, d]) => `  - ${id}: ${DEPTH_LABEL[d]}`)
    .join('\n')

  return `
## 過去の商談履歴（${priorHistory.length}回分）

### 確認済み・合意済み事項（繰り返し質問不要）
${allDecisions.length > 0 ? allDecisions.map((d) => `- ${d}`).join('\n') : '（なし）'}

### 前回の積み残し・宿題（今回最優先でフォローアップすること）
${lastOpenQuestions.length > 0 ? lastOpenQuestions.map((q) => `- ${q}`).join('\n') : '（なし）'}

### 過去のテーマカバレッジ
${coverageLines || '（データなし）'}

確認済みテーマID: ${confirmedThemeIds.join(', ') || 'なし'}

【重要】確認済み事項を繰り返し質問しないこと。積み残しのフォローアップを最優先し、次に未カバーテーマを提案すること。
`
}
