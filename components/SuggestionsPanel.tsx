'use client'

import { useState, useEffect, useRef } from 'react'
import { Suggestion, ThemeCoverage, SessionRecord } from '@/types/meeting'
import { Sparkles, Check, Loader2, Clock, SkipForward, Lightbulb } from 'lucide-react'

interface SuggestionsPanelProps {
  suggestions: Suggestion[]
  coverage: ThemeCoverage[]
  isLoading: boolean
  priorHistory?: SessionRecord[]
  hasContext: boolean
  onUse: (id: string) => void
  onSkip: (id: string) => void
  onLinkProject: () => void
}

export default function SuggestionsPanel({
  suggestions,
  isLoading,
  priorHistory,
  hasContext,
  onUse,
  onSkip,
  onLinkProject,
}: SuggestionsPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
  const prevPendingIdsRef = useRef<Set<string>>(new Set())

  const pending = suggestions.filter((s) => s.status === 'pending')
  const used = suggestions.filter((s) => s.status === 'used')
  const current = pending[activeIndex] ?? pending[0]

  const firstPendingId = pending[0]?.id
  useEffect(() => {
    setActiveIndex(0)
  }, [firstPendingId])

  useEffect(() => {
    if (activeIndex >= pending.length && pending.length > 0) {
      setActiveIndex(pending.length - 1)
    }
  }, [pending.length, activeIndex])

  // 新着IDにアニメーションフラグを付ける
  useEffect(() => {
    const currentIds = new Set(pending.map((s) => s.id))
    const newIds = [...currentIds].filter((id) => !prevPendingIdsRef.current.has(id))
    prevPendingIdsRef.current = currentIds

    if (newIds.length === 0) return
    setAnimatingIds(new Set(newIds))
    const t = setTimeout(() => setAnimatingIds(new Set()), 600)
    return () => clearTimeout(t)
  }, [pending.map((s) => s.id).join(',')])

  const advance = (currentId: string) => {
    const idx = pending.findIndex((s) => s.id === currentId)
    const next = pending.length > 1 ? Math.min(idx, pending.length - 2) : 0
    setActiveIndex(next)
  }

  const handleUse = () => {
    if (!current) return
    advance(current.id)
    onUse(current.id)
  }

  const handleSkip = () => {
    if (!current) return
    advance(current.id)
    onSkip(current.id)
  }

  const lastOpenQuestions =
    priorHistory && priorHistory.length > 0
      ? (priorHistory[priorHistory.length - 1].openQuestions ?? [])
      : []

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <style>{`
        @keyframes suggestionFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .suggestion-new {
          animation: suggestionFadeIn 0.3s ease-out;
        }
      `}</style>

      {/* ヘッダー */}
      <div className="border-b border-slate-200 bg-white shrink-0">
        <div className="px-5 py-3 flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700">AI 提案</h2>
          {isLoading && (
            <span className="flex items-center gap-1 text-xs text-indigo-400 ml-1">
              <Loader2 size={12} className="animate-spin" />
              生成中…
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {used.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <Check size={11} /> {used.length}件採用済み
              </span>
            )}
            {pending.length > 0 && (
              <span className="text-xs text-slate-400">{activeIndex + 1} / {pending.length}</span>
            )}
          </div>
        </div>
        {/* 前回の積み残し — ヘッダー内に固定。ボディのカードレイアウトに影響させない */}
        {lastOpenQuestions.length > 0 && (
          <div className="px-5 pb-3">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-violet-600 flex items-center gap-1.5 mb-2">
                <Clock size={11} /> 前回の積み残し
              </p>
              <ul className="space-y-1">
                {lastOpenQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-violet-700 flex items-start gap-1.5">
                    <span className="text-violet-300 shrink-0">?</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">

        {/* 空・ローディング中 */}
        {pending.length === 0 && isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
        {pending.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 px-2">
            {!hasContext && (
              <div className="w-full max-w-[240px] bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center mb-6">
                <p className="text-xs font-semibold text-indigo-700 mb-1">📎 案件を紐付けると</p>
                <p className="text-xs text-indigo-500 leading-relaxed mb-3">
                  前回の積み残し・顧客文脈を活かした質問提案ができます
                </p>
                <button
                  onClick={onLinkProject}
                  className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors w-full"
                >
                  案件を紐付ける
                </button>
              </div>
            )}
            <Sparkles size={32} className="opacity-20 mb-3" />
            <p className="text-sm">録音を開始すると</p>
            <p className="text-sm">次の質問を提案します</p>
            <p className="text-xs mt-3 text-slate-300">左のテーマ ✨ からも生成できます</p>
          </div>
        )}

        {/* メイン提案カード */}
        {current && (
          <div className="flex-1 flex flex-col">
            <div
              className={`rounded-2xl shadow-sm border p-5 flex flex-col gap-3 ${
                current.isFallback
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-indigo-100'
              } ${animatingIds.has(current.id) ? 'suggestion-new' : ''}`}
            >
              {/* テーマタグ */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center self-start text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {current.themeName}
                </span>
                {current.isFallback && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                    <Lightbulb size={10} /> ヒント
                  </span>
                )}
              </div>

              {/* 質問（主役） */}
              <p className={`text-xl font-bold leading-snug ${current.isFallback ? 'text-slate-600' : 'text-slate-800'}`}>
                {current.question}
              </p>

              {/* なぜ今聞く？ AI生成時のみ表示 */}
              {current.reason && !current.isFallback && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold text-amber-600 mb-1">なぜ今聞く？</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{current.reason}</p>
                </div>
              )}

              {/* アクション */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleUse}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
                    current.isFallback
                      ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-100'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100'
                  }`}
                >
                  <Check size={15} /> 採用して質問
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <SkipForward size={14} />
                </button>
              </div>
            </div>

            {/* ドットナビゲーション（常時スペース確保してカードがガクつかないようにする） */}
            <div className="flex justify-center gap-2 mt-4 min-h-[8px]">
              {pending.length > 1 && pending.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all ${
                    i === activeIndex
                      ? 'w-5 h-2 bg-indigo-500'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
