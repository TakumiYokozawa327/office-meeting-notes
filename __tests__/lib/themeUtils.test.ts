import { describe, it, expect } from 'vitest'
import { getStep, calcProgress, stepColor, STEPS } from '@/lib/themeUtils'
import type { ThemeCoverage } from '@/types/meeting'

// ─── getStep ───────────────────────────────────────────────────────────────

describe('getStep', () => {
  it('0% → 0 (録音前)', () => {
    expect(getStep(0)).toBe(0)
  })

  it('ステップ境界値の下: 9% → 0', () => {
    expect(getStep(9)).toBe(0)
  })

  it('ステップ境界値ちょうど: 10% → 10', () => {
    expect(getStep(10)).toBe(10)
  })

  it('ステップ途中: 29% → 10', () => {
    expect(getStep(29)).toBe(10)
  })

  it('ステップ境界値ちょうど: 30% → 30', () => {
    expect(getStep(30)).toBe(30)
  })

  it('ステップ途中: 49% → 30', () => {
    expect(getStep(49)).toBe(30)
  })

  it('ステップ境界値ちょうど: 50% → 50', () => {
    expect(getStep(50)).toBe(50)
  })

  it('ステップ途中: 79% → 50', () => {
    expect(getStep(79)).toBe(50)
  })

  it('ステップ境界値ちょうど: 80% → 80', () => {
    expect(getStep(80)).toBe(80)
  })

  it('ステップ途中: 89% → 80', () => {
    expect(getStep(89)).toBe(80)
  })

  it('ステップ境界値ちょうど: 90% → 90', () => {
    expect(getStep(90)).toBe(90)
  })

  it('ステップ途中: 99% → 90', () => {
    expect(getStep(99)).toBe(90)
  })

  it('100% → 100', () => {
    expect(getStep(100)).toBe(100)
  })

  it('100超は100に丸められる（UI表示上の防御）', () => {
    expect(getStep(110)).toBe(100)
  })
})

// ─── calcProgress ──────────────────────────────────────────────────────────

describe('calcProgress', () => {
  it('coverage が空なら 0 を返す', () => {
    expect(calcProgress([], 11)).toBe(0)
  })

  it('total が 0 なら 0 を返す（ゼロ除算防御）', () => {
    const cov: ThemeCoverage[] = [{ themeId: 'a', depth: 'deep', coveredPercent: 100 }]
    expect(calcProgress(cov, 0)).toBe(0)
  })

  it('全テーマが coverage 100% なら 100 を返す', () => {
    const cov: ThemeCoverage[] = Array.from({ length: 11 }, (_, i) => ({
      themeId: `t${i}`,
      depth: 'deep',
      coveredPercent: 100,
    }))
    expect(calcProgress(cov, 11)).toBe(100)
  })

  it('全テーマが coverage 50% なら 50 を返す', () => {
    const cov: ThemeCoverage[] = Array.from({ length: 11 }, (_, i) => ({
      themeId: `t${i}`,
      depth: 'moderate',
      coveredPercent: 50,
    }))
    expect(calcProgress(cov, 11)).toBe(50)
  })

  it('カバーされたテーマが一部だけなら、未カバー分が 0% として計算される', () => {
    // 11テーマ中3テーマのみ coverage あり、各 90%
    const cov: ThemeCoverage[] = [
      { themeId: 'a', depth: 'deep', coveredPercent: 90 },
      { themeId: 'b', depth: 'deep', coveredPercent: 90 },
      { themeId: 'c', depth: 'deep', coveredPercent: 90 },
    ]
    // 270 / 11 ≈ 24.5 → 25
    expect(calcProgress(cov, 11)).toBe(25)
  })

  it('端数は Math.round で丸められる', () => {
    const cov: ThemeCoverage[] = [{ themeId: 'a', depth: 'surface', coveredPercent: 35 }]
    // 35 / 11 ≈ 3.18 → 3
    expect(calcProgress(cov, 11)).toBe(3)
  })
})

// ─── stepColor ─────────────────────────────────────────────────────────────

describe('stepColor', () => {
  it('0 → グレー（録音前）', () => {
    expect(stepColor(0).badge).toContain('slate')
  })

  it('10 → 赤', () => {
    expect(stepColor(10).badge).toContain('red')
  })

  it('30 → 赤', () => {
    expect(stepColor(30).badge).toContain('red')
  })

  it('50 → オレンジ', () => {
    expect(stepColor(50).badge).toContain('orange')
  })

  it('80 → オレンジ', () => {
    expect(stepColor(80).badge).toContain('orange')
  })

  it('90 → 緑', () => {
    expect(stepColor(90).badge).toContain('emerald')
  })

  it('100 → 緑', () => {
    expect(stepColor(100).badge).toContain('emerald')
  })

  it('各ステップで text / bar / badge の 3プロパティが揃っている', () => {
    for (const s of [...STEPS, 0]) {
      const c = stepColor(s)
      expect(c).toHaveProperty('text')
      expect(c).toHaveProperty('bar')
      expect(c).toHaveProperty('badge')
    }
  })
})
