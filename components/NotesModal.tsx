'use client'

import { useState } from 'react'
import { X, Copy, Download, Check, Star, TrendingUp, FileText, ChevronRight, CheckCircle2, HelpCircle } from 'lucide-react'
import { MeetingFeedback, CoverageDepth } from '@/types/meeting'

interface NotesModalProps {
  notes: string
  feedback: MeetingFeedback | null
  keyDecisions: string[]
  openQuestions: string[]
  onClose: () => void
}

type Tab = 'notes' | 'feedback' | 'decisions'

const depthConfig: Record<CoverageDepth, { label: string; color: string; bg: string }> = {
  none:     { label: '未確認',   color: 'text-slate-500',   bg: 'bg-slate-100'   },
  surface:  { label: '表面的',   color: 'text-amber-600',   bg: 'bg-amber-50'    },
  moderate: { label: 'ある程度', color: 'text-blue-600',    bg: 'bg-blue-50'     },
  deep:     { label: '深い',     color: 'text-emerald-600', bg: 'bg-emerald-50'  },
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-blue-500' : 'text-amber-500'
  const ring = score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-blue-500' : 'stroke-amber-500'
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            className={ring}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-600">総合スコア</span>
    </div>
  )
}

export default function NotesModal({ notes, feedback, keyDecisions, openQuestions, onClose }: NotesModalProps) {
  const [tab, setTab] = useState<Tab>(feedback ? 'feedback' : 'decisions')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(notes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const now = new Date()
    const filename = `議事録_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.md`
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-slate-800 mt-4 mb-2">{line.slice(2)}</h1>
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-slate-700 mt-4 mb-2 border-b border-slate-200 pb-1">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-slate-700 mt-3 mb-1">{line.slice(4)}</h3>
      if (line.startsWith('| ')) {
        const cells = line.split('|').filter(Boolean).map((c) => c.trim())
        const isSep = line.match(/^\|[-|: ]+\|$/)
        if (isSep) return null
        const isHeader = i > 0 && lines[i - 1]?.startsWith('|') && lines[i + 1]?.match(/^\|[-|: ]+\|$/)
        return (
          <div key={i} className={`flex gap-2 text-sm py-1 border-b border-slate-100 ${isHeader ? 'font-semibold text-slate-600 bg-slate-50' : 'text-slate-700'}`}>
            {cells.map((cell, j) => <span key={j} className="flex-1 px-2">{cell}</span>)}
          </div>
        )
      }
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-sm text-slate-700 ml-4 list-disc leading-relaxed">{line.slice(2)}</li>
      if (line === '') return <div key={i} className="h-2" />
      return <p key={i} className="text-sm text-slate-700 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('feedback')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === 'feedback'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Star size={14} /> フィードバック
            </button>
            <button
              onClick={() => setTab('decisions')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === 'decisions'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <CheckCircle2 size={14} /> 確定・宿題
            </button>
            <button
              onClick={() => setTab('notes')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === 'notes'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <FileText size={14} /> 議事録
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {tab === 'notes' && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'コピー済み' : 'コピー'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={14} /> ダウンロード
                </button>
              </>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'decisions' && (
            <div className="px-6 py-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-600 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> 確定事項
                </p>
                {keyDecisions.length > 0 ? (
                  <ul className="space-y-2">
                    {keyDecisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">確定事項は検出されませんでした</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 mb-3 flex items-center gap-1.5">
                  <HelpCircle size={13} /> 未確認・宿題
                </p>
                {openQuestions.length > 0 ? (
                  <ul className="space-y-2">
                    {openQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-400 mt-0.5 shrink-0">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">未確認事項は検出されませんでした</p>
                )}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="px-6 py-4">{renderMarkdown(notes)}</div>
          )}

          {tab === 'feedback' && feedback && (
            <div className="px-6 py-6 space-y-6">
              {/* スコア + サマリー */}
              <div className="flex items-center gap-8">
                <ScoreCircle score={feedback.score} />
                <p className="flex-1 text-sm text-slate-700 leading-relaxed">{feedback.summary}</p>
              </div>

              {/* できたこと / 改善点 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 mb-3 flex items-center gap-1.5">
                    <Check size={13} /> できたこと
                  </p>
                  <ul className="space-y-2">
                    {feedback.positives.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-600 mb-3 flex items-center gap-1.5">
                    <TrendingUp size={13} /> 次回の改善点
                  </p>
                  <ul className="space-y-2">
                    {feedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ChevronRight size={14} className="text-amber-400 mt-0.5 shrink-0" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* テーマ別評価 */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-3">テーマ別評価</p>
                <div className="space-y-2">
                  {feedback.themeResults.map((t) => {
                    const dc = depthConfig[t.depth] ?? depthConfig.none
                    return (
                      <div key={t.themeId} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${dc.bg} ${dc.color}`}>
                          {dc.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">{t.themeName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.comment}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'feedback' && !feedback && (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              フィードバックを生成できませんでした
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
