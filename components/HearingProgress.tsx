'use client'

import { Theme, ThemeCoverage, ThemeStatus } from '@/types/meeting'
import { CheckCircle2, Circle, Sparkles, Flame, Star, Lightbulb } from 'lucide-react'

interface HearingProgressProps {
  themes: Theme[]
  coverage: ThemeCoverage[]
  onStatusChange: (themeId: string, status: ThemeStatus) => void
  onRequestSuggestion?: (themeId: string) => void
}

function calcHearingScore(themes: Theme[], coverage: ThemeCoverage[]): number {
  let totalWeight = 0
  let score = 0
  for (const theme of themes) {
    const w = theme.priority
    totalWeight += w
    if (theme.status === 'confirmed') {
      score += w
    } else {
      const cov = coverage.find((c) => c.themeId === theme.id)
      if (cov) score += w * (cov.coveredPercent / 100) * 0.7
    }
  }
  return totalWeight === 0 ? 0 : Math.round((score / totalWeight) * 100)
}

export default function HearingProgress({
  themes,
  coverage,
  onStatusChange,
  onRequestSuggestion,
}: HearingProgressProps) {
  const score = calcHearingScore(themes, coverage)
  const confirmed = themes.filter((t) => t.status === 'confirmed').length
  const essential = themes.filter((t) => t.priority === 5)
  const preferred = themes.filter((t) => t.priority >= 3 && t.priority < 5)
  const optional = themes.filter((t) => t.priority < 3)
  const uncoveredEssential = essential.filter((t) => t.status !== 'confirmed').length

  const stage =
    score >= 85 ? { label: '詳細提案可能', color: 'text-emerald-600', dot: 'bg-emerald-500' } :
    score >= 60 ? { label: '概算提案可能', color: 'text-emerald-600', dot: 'bg-emerald-500' } :
    score >= 40 ? { label: '深掘り中',     color: 'text-indigo-600',  dot: 'bg-indigo-500'  } :
    score >= 20 ? { label: '情報収集中',   color: 'text-amber-600',   dot: 'bg-amber-500'   } :
                  { label: '商談開始',     color: 'text-slate-500',   dot: 'bg-slate-400'   }

  const barColor =
    score >= 60 ? 'bg-emerald-500' :
    score >= 40 ? 'bg-indigo-500'  :
    score >= 20 ? 'bg-amber-500'   : 'bg-slate-300'

  const ThemeRow = ({ theme }: { theme: Theme }) => {
    const cov = coverage.find((c) => c.themeId === theme.id)
    const isConfirmed = theme.status === 'confirmed'
    return (
      <div className={`flex items-center gap-2 py-1.5 ${isConfirmed ? 'opacity-50' : ''}`}>
        <button
          onClick={() => onStatusChange(theme.id, isConfirmed ? 'pending' : 'confirmed')}
          className="shrink-0 transition-colors"
        >
          {isConfirmed
            ? <CheckCircle2 size={16} className="text-emerald-500" />
            : <Circle size={16} className="text-slate-300 hover:text-emerald-400" />
          }
        </button>
        <span className={`text-sm flex-1 truncate ${isConfirmed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {theme.name}
        </span>
        {cov && cov.coveredPercent > 0 && !isConfirmed && (
          <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${cov.coveredPercent}%` }}
            />
          </div>
        )}
        {onRequestSuggestion && !isConfirmed && (
          <button
            onClick={() => onRequestSuggestion(theme.id)}
            className="p-1 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors shrink-0"
            title="このテーマで質問を生成"
          >
            <Sparkles size={12} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">提案準備状況</p>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
          <span className={`text-base font-bold ${stage.color}`}>{stage.label}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.max(score, 3)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {uncoveredEssential > 0
            ? `あと${uncoveredEssential}項目で概算提案可能`
            : `${confirmed}項目確認済み`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {essential.length > 0 && (
          <div>
            <p className="text-xs font-bold text-red-500 flex items-center gap-1 mb-2">
              <Flame size={12} /> 今回必須
            </p>
            {essential.map((t) => <ThemeRow key={t.id} theme={t} />)}
          </div>
        )}
        {preferred.length > 0 && (
          <div>
            <p className="text-xs font-bold text-amber-500 flex items-center gap-1 mb-2">
              <Star size={12} /> できれば聞く
            </p>
            {preferred.map((t) => <ThemeRow key={t.id} theme={t} />)}
          </div>
        )}
        {optional.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
              <Lightbulb size={12} /> 余裕があれば
            </p>
            {optional.map((t) => <ThemeRow key={t.id} theme={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
