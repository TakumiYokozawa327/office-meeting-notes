'use client'

import { useEffect, useState } from 'react'
import { X, Pin, PinOff } from 'lucide-react'

interface QuestionPromptOverlayProps {
  question: string
  onClose: () => void
}

const DISPLAY_SECONDS = 30

export default function QuestionPromptOverlay({ question, onClose }: QuestionPromptOverlayProps) {
  const [remaining, setRemaining] = useState(DISPLAY_SECONDS)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (pinned) return
    if (remaining <= 0) {
      onClose()
      return
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onClose, pinned])

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] animate-slide-up-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">

        {/* ヘッダー */}
        <div className="bg-indigo-600 px-4 py-2.5 flex items-center justify-between">
          <span className="text-white text-[11px] font-semibold tracking-widest uppercase">
            次の質問
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPinned(p => !p)}
              title={pinned ? '固定を解除' : '固定する（自動で消えなくなります）'}
              className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              {pinned
                ? <PinOff size={13} className="text-yellow-300" />
                : <Pin size={13} className="text-indigo-300" />
              }
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <X size={13} className="text-indigo-200" />
            </button>
          </div>
        </div>

        {/* 質問本文 */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[17px] font-bold text-slate-800 leading-snug">{question}</p>
          <p className="mt-2.5 text-xs text-slate-400">
            {pinned ? '📌 固定中 — 手動で閉じてください' : '会話のタイミングで使ってください'}
          </p>
        </div>

        {/* タイマーバー */}
        {!pinned && (
          <div className="px-4 pb-3">
            <div className="h-[3px] bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${(remaining / DISPLAY_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        )}
        {pinned && <div className="pb-1" />}
      </div>
    </div>
  )
}
