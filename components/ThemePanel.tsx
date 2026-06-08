'use client'

import { useState } from 'react'
import { Theme, ThemeStatus, ThemeCoverage } from '@/types/meeting'
import { cn } from '@/lib/utils'
import { STEPS, calcProgress, getStep, stepColor } from '@/lib/themeUtils'
import { CheckCircle2, MinusCircle, Circle, ChevronDown, BookOpen, Sparkles, Check } from 'lucide-react'

interface ThemePanelProps {
  themes: Theme[]
  coverage: ThemeCoverage[]
  onStatusChange: (themeId: string, status: ThemeStatus) => void
  onRequestSuggestion?: (themeId: string) => void
}

const statusConfig = {
  pending:   { icon: Circle,       color: 'text-slate-400', bg: 'bg-slate-50',   border: 'border-slate-200'  },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  skipped:   { icon: MinusCircle,  color: 'text-slate-300',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
}

export default function ThemePanel({ themes, coverage, onStatusChange, onRequestSuggestion }: ThemePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const confirmed = themes.filter((t) => t.status === 'confirmed').length
  const total = themes.length
  const progress = calcProgress(coverage, total)
  const step = getStep(progress)
  const color = stepColor(step)

  const getCoverage = (themeId: string) =>
    coverage.find((c) => c.themeId === themeId)

  const toggleExpand = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation()
    setExpandedId((prev) => (prev === themeId ? null : themeId))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">会議テーマ</h2>
          <span className={`text-2xl font-bold tabular-nums leading-none ${color.text}`}>
            {step > 0 ? `${step}%` : '0%'}
          </span>
        </div>

        {/* ステップバー */}
        <div className="flex gap-0.5">
          {STEPS.map((s) => {
            const filled = s <= step
            const active = s === step
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={cn(
                  'h-2 w-full rounded-sm transition-all duration-500',
                  filled ? color.bar : 'bg-slate-200',
                  active && 'ring-1 ring-offset-0 ring-current'
                )} />
                <span className={cn(
                  'text-[9px] tabular-nums leading-none',
                  active ? `${color.text} font-bold` : filled ? 'text-slate-400' : 'text-slate-300'
                )}>
                  {s}%
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">テーマ確認済み</span>
          <span className="text-xs font-medium text-slate-500">{confirmed} / {total}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {themes.map((theme) => {
          const { icon: Icon, color, bg, border } = statusConfig[theme.status]
          const cov = getCoverage(theme.id)
          const themeStep = cov ? getStep(cov.coveredPercent) : 0
          const tc = stepColor(themeStep)
          const isSkipped = theme.status === 'skipped'

          return (
            <div
              key={theme.id}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-all',
                bg, border,
                isSkipped && 'opacity-50'
              )}
            >
              {/* テーマ名行 */}
              <div className="flex items-start gap-2">
                <Icon size={16} className={cn('mt-0.5 shrink-0', color)} />
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isSkipped ? 'text-slate-400 line-through' : 'text-slate-700'
                      )}>
                        {theme.name}
                      </p>
                      {theme.priority >= 4 && (
                        <span className={cn(
                          'text-[9px] font-bold shrink-0 leading-none',
                          theme.priority === 5 ? 'text-red-400' : 'text-amber-400'
                        )}>
                          {'★'.repeat(theme.priority)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        'text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md',
                        stepColor(themeStep).badge
                      )}>
                        {themeStep > 0 ? `${themeStep}%` : '0%'}
                      </span>
                      {onRequestSuggestion && !isSkipped && (
                        <button
                          onClick={() => onRequestSuggestion(theme.id)}
                          title="このテーマで質問を生成"
                          className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Sparkles size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {theme.description}
                  </p>

                  {cov && themeStep > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', tc.bar)}
                          style={{ width: `${cov.coveredPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ステータスアクション行 */}
              {!isSkipped ? (
                <div className="mt-2.5 flex items-center gap-2">
                  {theme.status === 'pending' ? (
                    <button
                      onClick={() => onStatusChange(theme.id, 'confirmed')}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      <Check size={11} /> 確定にする
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium flex-1">
                      <CheckCircle2 size={12} /> 確定済み
                    </span>
                  )}
                  <button
                    onClick={() => onStatusChange(theme.id, theme.status === 'confirmed' ? 'pending' : 'skipped')}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5"
                  >
                    {theme.status === 'confirmed' ? '取り消し' : 'スキップ'}
                  </button>
                </div>
              ) : (
                <div className="mt-2.5">
                  <button
                    onClick={() => onStatusChange(theme.id, 'pending')}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    ↩ 未確定に戻す
                  </button>
                </div>
              )}

              {/* 質問例アコーディオン */}
              <button
                onClick={(e) => toggleExpand(e, theme.id)}
                className="mt-2 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <BookOpen size={11} />
                質問例を見る
                <ChevronDown
                  size={11}
                  className={cn('transition-transform duration-200', expandedId === theme.id && 'rotate-180')}
                />
              </button>

              {/* アニメーション付きアコーディオン */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: expandedId === theme.id ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.2s ease-out',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <ul className="mt-2 space-y-1.5 border-t border-slate-200 pt-2">
                    {theme.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                        <span className="text-indigo-300 shrink-0 mt-0.5">Q</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
