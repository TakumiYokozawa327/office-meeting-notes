'use client'

import { Mic, MicOff, FileText, Monitor, Building2, FolderOpen } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { MeetingContext } from '@/types/meeting'

export type RecordingMode = 'normal' | 'online'

interface RecordingControlsProps {
  isRecording: boolean
  duration: number
  transcriptCount: number
  isGeneratingNotes: boolean
  isSupported: boolean
  mode: RecordingMode
  context: MeetingContext | null
  onModeChange: (mode: RecordingMode) => void
  onToggleRecording: () => void
  onGenerateNotes: () => void
  onOpenProjectSelector: () => void
}

function AudioWave() {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {[0.0, 0.1, 0.2, 0.05, 0.15, 0.3, 0.1].map((delay, i) => (
        <div
          key={i}
          className="w-[3px] bg-red-400 rounded-full audio-wave-bar"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  )
}

export default function RecordingControls({
  isRecording,
  duration,
  transcriptCount,
  isGeneratingNotes,
  isSupported,
  mode,
  context,
  onModeChange,
  onToggleRecording,
  onGenerateNotes,
  onOpenProjectSelector,
}: RecordingControlsProps) {
  return (
    <header
      className={`border-b px-4 md:px-6 py-3 md:py-4 transition-all duration-500 ${
        isRecording
          ? 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* メイン行 */}
        <div className="flex items-center justify-between gap-3">
          {/* 左: ロゴ・タイトル・案件 */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div
              className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-500 ${
                isRecording ? 'bg-red-500' : 'bg-indigo-600'
              }`}
            >
              <Mic size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">
                <span className="hidden sm:inline">Office Meeting Notes AI</span>
                <span className="sm:hidden">Meeting Notes AI</span>
              </h1>
              {context ? (
                <button
                  onClick={onOpenProjectSelector}
                  className="flex items-center gap-1 mt-0.5 hover:opacity-70 transition-opacity max-w-[180px] md:max-w-none"
                >
                  <Building2 size={9} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] text-slate-500 truncate">{context.customer.name}</span>
                  <span className="text-[11px] text-slate-300">/</span>
                  <FolderOpen size={9} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] text-indigo-600 font-medium truncate">{context.project.name}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenProjectSelector}
                  className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <FolderOpen size={10} />
                  案件を紐付ける
                </button>
              )}
            </div>
          </div>

          {/* 右: コントロール */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* 録音中ステータス — デスクトップのみインライン表示 */}
            {isRecording && (
              <div className="hidden md:flex items-center gap-3 text-slate-600">
                <AudioWave />
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono text-sm font-semibold text-red-600 tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>
                <span className={`text-xs font-medium tracking-wide ${mode === 'online' ? 'text-indigo-500' : 'text-red-400'}`}>
                  {mode === 'online' ? 'オンライン録音中' : '音声認識中'}
                </span>
              </div>
            )}

            {/* モード切り替え — デスクトップのみ */}
            {!isRecording && (
              <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => onModeChange('normal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'normal'
                      ? 'bg-white shadow-sm text-slate-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Mic size={12} /> マイクのみ
                </button>
                <button
                  onClick={() => onModeChange('online')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'online'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Monitor size={12} /> オンラインMTG
                </button>
              </div>
            )}

            {!isSupported && (
              <span className="hidden md:inline text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                このブラウザは音声認識非対応
              </span>
            )}

            {/* 録音ボタン */}
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-lg bg-red-400 ripple-1" />
                  <span className="absolute inset-0 rounded-lg bg-red-300 ripple-2" />
                </>
              )}
              <button
                onClick={onToggleRecording}
                disabled={!isSupported}
                className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isRecording ? (
                  <><MicOff size={15} /> <span className="hidden sm:inline">録音停止</span><span className="sm:hidden">停止</span></>
                ) : (
                  <><Mic size={15} /> <span className="hidden sm:inline">録音開始</span><span className="sm:hidden">開始</span></>
                )}
              </button>
            </div>

            {/* 議事録生成ボタン */}
            {transcriptCount > 0 && !isRecording && (
              <button
                onClick={onGenerateNotes}
                disabled={isGeneratingNotes}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50"
              >
                <FileText size={15} />
                <span className="hidden sm:inline">{isGeneratingNotes ? '生成中...' : '議事録生成'}</span>
                <span className="sm:hidden">{isGeneratingNotes ? '...' : '議事録'}</span>
              </button>
            )}
          </div>
        </div>

        {/* モバイルのみ: 録音中ステータス行 */}
        {isRecording && (
          <div className="md:hidden mt-2 flex items-center gap-3">
            <AudioWave />
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-xs font-semibold text-red-600 tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
            <span className={`text-xs font-medium ${mode === 'online' ? 'text-indigo-500' : 'text-red-400'}`}>
              {mode === 'online' ? 'オンライン録音中' : '音声認識中'}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
