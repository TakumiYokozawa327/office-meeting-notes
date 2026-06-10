'use client'

import { useState } from 'react'
import { AIInsight, TranscriptEntry } from '@/types/meeting'
import { Brain, AlertCircle, ChevronDown, Mic } from 'lucide-react'

interface AIInsightPanelProps {
  insight: AIInsight | null
  transcript: TranscriptEntry[]
  isRecording: boolean
  isLoading: boolean
}

const FIELDS: { key: keyof Omit<AIInsight, 'missingItems'>; label: string }[] = [
  { key: 'purpose',       label: '移転目的' },
  { key: 'budget',        label: '予算感' },
  { key: 'decisionMaker', label: '意思決定者' },
  { key: 'moveDate',      label: '移転時期' },
  { key: 'companySize',   label: '人数・規模' },
]

export default function AIInsightPanel({
  insight,
  transcript,
  isRecording,
  isLoading,
}: AIInsightPanelProps) {
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Brain size={15} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">AIの理解</h2>
        {isLoading && (
          <span className="text-xs text-indigo-400 ml-1 animate-pulse">更新中…</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!insight && transcript.length === 0 && (
          <div className="text-center py-10 text-slate-300">
            <Brain size={32} className="mx-auto mb-3" />
            <p className="text-sm leading-relaxed">
              会話が始まると<br />理解した内容を表示します
            </p>
          </div>
        )}

        {FIELDS.map(({ key, label }) => {
          const value = insight?.[key]
          return (
            <div key={key}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                {label}
              </p>
              <p className={`text-sm leading-snug ${value ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>
                {value ?? '未確認'}
              </p>
            </div>
          )
        })}

        {insight?.missingItems && insight.missingItems.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1 mb-2">
              <AlertCircle size={11} /> 未取得の重要情報
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insight.missingItems.map((item, i) => (
                <span
                  key={i}
                  className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full"
                >
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
          <ChevronDown
            size={12}
            className={`ml-auto transition-transform ${showTranscript ? 'rotate-180' : ''}`}
          />
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
