import { describe, it, expect } from 'vitest'
import { buildPriorContextSection } from '@/lib/priorContext'
import type { SessionRecord } from '@/types/meeting'

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    sessionId: 'session-1',
    date: '2026-05-01T10:00:00Z',
    keyDecisions: [],
    openQuestions: [],
    coverage: [],
    confirmedThemeIds: [],
    ...overrides,
  }
}

describe('buildPriorContextSection', () => {
  it('履歴が空なら空文字を返す', () => {
    expect(buildPriorContextSection([])).toBe('')
  })

  it('null/undefined でも空文字を返す（防御的処理）', () => {
    expect(buildPriorContextSection(null as unknown as SessionRecord[])).toBe('')
    expect(buildPriorContextSection(undefined as unknown as SessionRecord[])).toBe('')
  })

  it('確認済み事項が含まれる', () => {
    const history = [makeSession({ keyDecisions: ['予算上限3000万で確定', 'ABW導入方針を決定'] })]
    const result = buildPriorContextSection(history)
    expect(result).toContain('予算上限3000万で確定')
    expect(result).toContain('ABW導入方針を決定')
  })

  it('前回の積み残しが含まれる', () => {
    const history = [makeSession({ openQuestions: ['移転時期は次回確認', '出社率の目標値を確認'] })]
    const result = buildPriorContextSection(history)
    expect(result).toContain('移転時期は次回確認')
    expect(result).toContain('出社率の目標値を確認')
  })

  it('前回の積み残しは最後のセッションのみ参照する', () => {
    const history = [
      makeSession({ sessionId: 's1', openQuestions: ['古い積み残し'] }),
      makeSession({ sessionId: 's2', openQuestions: ['最新の積み残し'] }),
    ]
    const result = buildPriorContextSection(history)
    expect(result).toContain('最新の積み残し')
    expect(result).not.toContain('古い積み残し')
  })

  it('複数セッションのカバレッジを集約し最深値を使う', () => {
    const history = [
      makeSession({
        coverage: [{ themeId: 'budget', depth: 'surface', coveredPercent: 20 }],
      }),
      makeSession({
        coverage: [{ themeId: 'budget', depth: 'deep', coveredPercent: 90 }],
      }),
    ]
    const result = buildPriorContextSection(history)
    expect(result).toContain('budget: 深い')
    expect(result).not.toContain('surface')
  })

  it('カバレッジが none のテーマは出力しない', () => {
    const history = [
      makeSession({
        coverage: [{ themeId: 'design', depth: 'none', coveredPercent: 0 }],
      }),
    ]
    const result = buildPriorContextSection(history)
    expect(result).not.toContain('design')
  })

  it('確認済みテーマIDが重複なく出力される', () => {
    const history = [
      makeSession({ confirmedThemeIds: ['budget', 'work_style'] }),
      makeSession({ confirmedThemeIds: ['budget', 'communication'] }), // budget は重複
    ]
    const result = buildPriorContextSection(history)
    // 重複なしで3つのみ
    const matches = result.match(/budget/g) ?? []
    expect(matches.length).toBe(1)
    expect(result).toContain('work_style')
    expect(result).toContain('communication')
  })

  it('セッション数がヘッダーに表示される', () => {
    const history = [makeSession(), makeSession({ sessionId: 's2' }), makeSession({ sessionId: 's3' })]
    const result = buildPriorContextSection(history)
    expect(result).toContain('3回分')
  })

  it('keyDecisions が undefined のセッションでも落ちない（不完全なデータ対応）', () => {
    const history = [{ ...makeSession(), keyDecisions: undefined as unknown as string[] }]
    expect(() => buildPriorContextSection(history)).not.toThrow()
  })

  it('coverage が undefined のセッションでも落ちない', () => {
    const history = [{ ...makeSession(), coverage: undefined as unknown as [] }]
    expect(() => buildPriorContextSection(history)).not.toThrow()
  })
})
