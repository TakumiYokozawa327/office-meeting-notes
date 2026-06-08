import { describe, it, expect, beforeEach } from 'vitest'
import { loadProjectHistory, saveSessionRecord } from '@/lib/projectHistory'
import type { SessionRecord } from '@/types/meeting'

function makeRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    sessionId: `session-${Date.now()}`,
    date: new Date().toISOString(),
    keyDecisions: ['予算3000万確定'],
    openQuestions: ['移転時期未定'],
    coverage: [{ themeId: 'budget', depth: 'moderate', coveredPercent: 60 }],
    confirmedThemeIds: ['budget'],
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('loadProjectHistory', () => {
  it('データなしなら空配列を返す', () => {
    expect(loadProjectHistory('project-1')).toEqual([])
  })

  it('別プロジェクトのデータは返さない', () => {
    saveSessionRecord('project-A', makeRecord({ sessionId: 'a' }))
    expect(loadProjectHistory('project-B')).toEqual([])
  })

  it('保存したレコードを正しく読み込む', () => {
    const record = makeRecord({ sessionId: 'test-1' })
    saveSessionRecord('project-1', record)
    const history = loadProjectHistory('project-1')
    expect(history).toHaveLength(1)
    expect(history[0].sessionId).toBe('test-1')
    expect(history[0].keyDecisions).toEqual(['予算3000万確定'])
  })

  it('複数レコードを追記できる', () => {
    saveSessionRecord('project-1', makeRecord({ sessionId: 'r1' }))
    saveSessionRecord('project-1', makeRecord({ sessionId: 'r2' }))
    saveSessionRecord('project-1', makeRecord({ sessionId: 'r3' }))
    const history = loadProjectHistory('project-1')
    expect(history).toHaveLength(3)
    expect(history.map((r) => r.sessionId)).toEqual(['r1', 'r2', 'r3'])
  })

  it('localStorage に破損した JSON があっても空配列を返す（クラッシュしない）', () => {
    localStorage.setItem('om_history_project-bad', 'this is not json {{{')
    expect(() => loadProjectHistory('project-bad')).not.toThrow()
    expect(loadProjectHistory('project-bad')).toEqual([])
  })

  it('localStorage が null を返しても空配列を返す', () => {
    // happy-dom では removeItem 後は null になる
    localStorage.removeItem('om_history_project-null')
    expect(loadProjectHistory('project-null')).toEqual([])
  })

  it('coverage データが正しく保持される', () => {
    const record = makeRecord({
      coverage: [
        { themeId: 'budget', depth: 'deep', coveredPercent: 90 },
        { themeId: 'work_style', depth: 'surface', coveredPercent: 20 },
      ],
    })
    saveSessionRecord('project-1', record)
    const history = loadProjectHistory('project-1')
    expect(history[0].coverage).toHaveLength(2)
    expect(history[0].coverage[0].depth).toBe('deep')
  })
})

describe('saveSessionRecord', () => {
  it('同じ sessionId を 2 回保存すると 2 件になる（重複チェックなし）', () => {
    // 現在の実装は重複排除しない。この挙動を記録する。
    const record = makeRecord({ sessionId: 'dup-1' })
    saveSessionRecord('project-1', record)
    saveSessionRecord('project-1', record)
    const history = loadProjectHistory('project-1')
    // 重複があることを確認（既知の挙動）
    expect(history).toHaveLength(2)
    // ↓ 重複排除を実装したら以下を有効化
    // expect(history).toHaveLength(1)
  })
})
