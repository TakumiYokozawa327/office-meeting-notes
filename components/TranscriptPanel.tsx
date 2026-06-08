'use client'

import { useEffect, useRef } from 'react'
import { TranscriptEntry } from '@/types/meeting'
import { Mic, X } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface TranscriptPanelProps {
  transcript: TranscriptEntry[]
  interimTranscript: string
  interimSpeakerId: number
  isRecording: boolean
  onClose?: () => void
}

const SPEAKER_STYLES = [
  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  { bg: 'bg-violet-100', text: 'text-violet-700',  border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-100',text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-500'},
  { bg: 'bg-amber-100',  text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-500'  },
  { bg: 'bg-rose-100',   text: 'text-rose-700',    border: 'border-rose-200',   dot: 'bg-rose-500'   },
]

function getSpeakerStyle(speakerId: number) {
  return SPEAKER_STYLES[speakerId % SPEAKER_STYLES.length]
}

function getSpeakerLabel(speakerId: number) {
  return `話者 ${speakerId + 1}`
}

export default function TranscriptPanel({
  transcript,
  interimTranscript,
  interimSpeakerId,
  isRecording,
  onClose,
}: TranscriptPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [transcript, interimTranscript])

  const hasSpeakerInfo = transcript.some((e) => e.speakerId !== undefined)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Mic size={16} className={isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'} />
          <h2 className="text-sm font-semibold text-slate-700">音声テキスト</h2>
          <div className="ml-auto flex items-center gap-2">
            {transcript.length > 0 && (
              <span className="text-xs text-slate-400">{transcript.length} 件</span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                title="閉じる"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        {/* 常時スペース確保 - hasSpeakerInfo 初回表示でヘッダー高さが変わるのを防ぐ */}
        <div className="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
          {hasSpeakerInfo && [...new Set(transcript.map((e) => e.speakerId ?? 0))].sort().map((id) => {
            const style = getSpeakerStyle(id)
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {getSpeakerLabel(id)}
              </span>
            )
          })}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {transcript.length === 0 && !interimTranscript && (
          <div className="text-center py-8 text-slate-400">
            <Mic size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">録音ボタンを押して</p>
            <p className="text-sm">会議を開始してください</p>
          </div>
        )}

        {transcript.map((entry) => {
          const speakerId = entry.speakerId ?? 0
          const style = getSpeakerStyle(speakerId)
          return (
            <div
              key={entry.id}
              className={`rounded-lg p-2.5 border transition-all ${
                hasSpeakerInfo
                  ? `${style.bg} ${style.border}`
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400">{formatTime(new Date(entry.timestamp))}</p>
                {hasSpeakerInfo && (
                  <span className={`text-xs font-semibold ${style.text}`}>
                    {getSpeakerLabel(speakerId)}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{entry.text}</p>
            </div>
          )
        })}

        {interimTranscript && (
          <div className={`rounded-lg p-2.5 border border-dashed ${
            hasSpeakerInfo
              ? `${getSpeakerStyle(interimSpeakerId).bg} ${getSpeakerStyle(interimSpeakerId).border}`
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                <span className="flex gap-[2px] items-center">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <span
                      key={i}
                      className="inline-block w-[3px] bg-red-400 rounded-full audio-wave-bar"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </span>
                認識中...
              </p>
              {hasSpeakerInfo && (
                <span className={`text-xs font-semibold ${getSpeakerStyle(interimSpeakerId).text}`}>
                  {getSpeakerLabel(interimSpeakerId)}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 italic leading-relaxed">{interimTranscript}</p>
          </div>
        )}

      </div>
    </div>
  )
}
