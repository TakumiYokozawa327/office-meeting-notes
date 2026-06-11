'use client'

import { useState } from 'react'
import { AIInsight, InsightField, TranscriptEntry, DealScore } from '@/types/meeting'
import { Brain, AlertCircle, ChevronDown, Mic, Target, CheckCircle, AlertTriangle } from 'lucide-react'

interface AIInsightPanelProps {
  insight: AIInsight | null
  transcript: TranscriptEntry[]
  isRecording: boolean
  isLoading: boolean
  dealScore: DealScore | null
}

const FIELDS: { key: keyof Omit<AIInsight, 'missingItems' | 'aiAlert'>; label: string }[] = [
  { key: 'purpose',       label: '移転目的' },
  { key: 'budget',        label: '予算感' },
  { key: 'decisionMaker', label: '意思決定者' },
  { key: 'moveDate',      label: '移転時期' },
  { key: 'companySize',   label: '人数・規模' },
]

function ConfidenceDot({ level }: { level: InsightField['level'] }) {
  if (level === 'confirmed') return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
  if (level === 'estimated') return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 inline-block" />
  return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 inline-block" />
}

function FieldValue({ field }: { field: InsightField | undefined }) {
  if (!field) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 inline-block" />
        <span className="text-sm text-red-400 font-medium">未取得</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-1.5">
      <ConfidenceDot level={field.level} />
      <div>
        <span className={`text-sm font-semibold leading-snug ${
          field.level === 'confirmed' ? 'text-emerald-700' :
          field.level === 'estimated' ? 'text-amber-700' : 'text-slate-600'
        }`}>
          {field.value}
        </span>
        <span className={`ml-1.5 text-xs ${
          field.level === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'
        }`}>
          {field.level === 'confirmed' ? `確度${field.confidence}%` : `推定${field.confidence}%`}
        </span>
      </div>
    </div>
  )
}

export default function AIInsightPanel({
  insight,
  transcript,
  isRecording,
  isLoading,
  dealScore,
}: AIInsightPanelProps) {
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">

      {/* 商談成功スコア */}
      {dealScore && dealScore.score > 40 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Target size={13} className="text-indigo-500" />
              商談成功確率
            </span>
            <span className={`text-2xl font-bold tabular-nums ${
              dealScore.score >= 70 ? 'text-emerald-600' :
              dealScore.score >= 50 ? 'text-amber-500' : 'text-slate-500'
            }`}>
              {dealScore.score}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                dealScore.score >= 70 ? 'bg-emerald-500' :
                dealScore.score >= 50 ? 'bg-amber-400' : 'bg-slate-400'
              }`}
              style={{ width: `${dealScore.score}%` }}
            />
          </div>
          <div className="space-y-0.5">
            {dealScore.positives.map((p, i) => (
              <p key={i} className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle size={10} className="shrink-0" /> {p}
              </p>
            ))}
            {dealScore.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={10} className="shrink-0" /> {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI理解ヘッダー */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
        <Brain size={14} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">AIの理解</h2>
        {isLoading && <span className="text-xs text-indigo-400 ml-1 animate-pulse">更新中…</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!insight && transcript.length === 0 && (
          <div className="text-center py-8 text-slate-300">
            <Brain size={28} className="mx-auto mb-2" />
            <p className="text-xs leading-relaxed">
              会話が始まると<br />理解した内容を表示します
            </p>
          </div>
        )}

        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <FieldValue field={insight?.[key] as InsightField | undefined} />
          </div>
        ))}

        {insight?.missingItems && insight.missingItems.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-red-400 flex items-center gap-1 mb-2 uppercase tracking-wider">
              <AlertCircle size={10} /> 未取得の重要情報
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insight.missingItems.map((item, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 折りたたみ文字起こし */}
      <div className="border-t border-slate-100 shrink-0">
        <button
          onClick={() => setShowTranscript((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Mic size={12} className={isRecording ? 'text-red-400 animate-pulse' : ''} />
          文字起こし（{transcript.length}件）
          <ChevronDown size={12} className={`ml-auto transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
        </button>
        {showTranscript && (
          <div className="max-h-48 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {transcript.length === 0 && (
              <p className="text-xs text-slate-300 text-center py-2">まだ発話がありません</p>
            )}
            {transcript.slice(-15).map((entry) => (
              <p key={entry.id} className="text-xs text-slate-600 leading-relaxed">{entry.text}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
