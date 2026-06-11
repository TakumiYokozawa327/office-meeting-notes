'use client'

import { Suggestion, Theme } from '@/types/meeting'
import { Check, Clock, X, Loader2, Sparkles, Lightbulb, Bell } from 'lucide-react'

interface HeroSuggestionProps {
  suggestions: Suggestion[]
  themes: Theme[]
  isLoading: boolean
  hasContext: boolean
  usedCount: number
  aiAlert?: string
  onUse: (id: string) => void
  onDefer: (id: string) => void
  onDismiss: (id: string) => void
  onLinkProject: () => void
}

function getImpactMessage(themeId: string, themes: Theme[]): { name: string; improvement: number; urgent: boolean } {
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) return { name: 'この情報', improvement: 10, urgent: false }
  if (theme.priority === 5) return { name: theme.name, improvement: 30, urgent: true }
  if (theme.priority === 4) return { name: theme.name, improvement: 25, urgent: true }
  if (theme.priority === 3) return { name: theme.name, improvement: 15, urgent: false }
  return { name: theme.name, improvement: 10, urgent: false }
}

export default function HeroSuggestion({
  suggestions,
  themes,
  isLoading,
  hasContext,
  usedCount,
  aiAlert,
  onUse,
  onDefer,
  onDismiss,
  onLinkProject,
}: HeroSuggestionProps) {
  const pending = suggestions.filter((s) => s.status === 'pending')
  const deferred = suggestions.filter((s) => s.status === 'deferred')
  const hero = pending[0]

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-4 h-10 flex items-center">
        {usedCount > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check size={14} /> {usedCount}問 採用済み
          </span>
        )}
        {isLoading && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 ml-auto">
            <Loader2 size={12} className="animate-spin" /> 質問を生成中…
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-6 gap-4 overflow-y-auto">

        {/* 空状態 */}
        {!hero && !isLoading && (
          <div className="text-center py-12">
            {!hasContext && (
              <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-left">
                <p className="text-sm font-semibold text-indigo-700 mb-1">📎 案件を紐付けると</p>
                <p className="text-sm text-indigo-500 mb-3">前回の積み残しを踏まえた提案ができます</p>
                <button
                  onClick={onLinkProject}
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl transition-colors w-full"
                >
                  案件を紐付ける
                </button>
              </div>
            )}
            <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm">録音を開始すると次の質問を提案します</p>
          </div>
        )}

        {/* ローディング中 */}
        {!hero && isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-300" />
            <p className="text-sm text-slate-400">質問を考えています…</p>
          </div>
        )}

        {/* ヒーローカード */}
        {hero && (() => {
          const impact = getImpactMessage(hero.themeId, themes)
          return (
            <div className={`rounded-3xl border flex flex-col gap-5 p-7 shadow-lg ${
              hero.isFallback
                ? 'bg-slate-100 border-slate-200 shadow-slate-100'
                : 'bg-white border-indigo-100 shadow-indigo-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {hero.themeName}
                </span>
                {hero.isFallback && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-200 px-2.5 py-1 rounded-full font-medium">
                    <Lightbulb size={11} /> ヒント
                  </span>
                )}
              </div>

              {/* インパクトバナー */}
              {!hero.isFallback && (
                <div className={`rounded-2xl px-4 py-3 ${
                  impact.urgent
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-100'
                    : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100'
                }`}>
                  <p className={`text-sm font-bold mb-0.5 ${impact.urgent ? 'text-red-500' : 'text-indigo-500'}`}>
                    {impact.urgent ? '🔥' : '💡'} 次は{impact.name}を聞くと
                  </p>
                  <p className={`font-black leading-none ${impact.urgent ? 'text-red-600' : 'text-indigo-600'}`}>
                    <span className="text-3xl tabular-nums">{impact.improvement}%</span>
                    <span className="text-lg ml-1">提案精度が向上します</span>
                  </p>
                </div>
              )}

              {/* 質問（主役） */}
              <p className={`text-2xl font-bold leading-snug ${hero.isFallback ? 'text-slate-600' : 'text-slate-800'}`}>
                {hero.question}
              </p>

              {/* AIの理由 */}
              {hero.reason && !hero.isFallback && (
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold text-sm mt-0.5 shrink-0">✓</span>
                  <p className="text-sm text-slate-500 leading-relaxed">{hero.reason}</p>
                </div>
              )}

              <button
                onClick={() => onUse(hero.id)}
                className="w-full py-4 rounded-2xl text-lg font-bold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Check size={20} /> この質問をする
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => onDefer(hero.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Clock size={14} /> あとで聞く
                </button>
                <button
                  onClick={() => onDismiss(hero.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <X size={14} /> 今回は不要
                </button>
              </div>
            </div>
          )
        })()}

        {/* AIからの通知（次の候補の代わり） */}
        {aiAlert && hero && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100">
            <Bell size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-600 mb-0.5">AIからの提案</p>
              <p className="text-sm text-amber-800">{aiAlert}</p>
            </div>
          </div>
        )}

        {/* あとで聞くリスト */}
        {deferred.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1">
              <Clock size={11} /> あとで聞く（{deferred.length}件）
            </p>
            <div className="space-y-1.5">
              {deferred.map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 flex-1 truncate">{s.question}</p>
                  <button
                    onClick={() => onUse(s.id)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium shrink-0 transition-colors"
                  >
                    使う
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
