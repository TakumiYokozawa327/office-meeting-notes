'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { RecordingMode } from '@/components/RecordingControls'
import { getMajoritySpeaker, resolvePhantomSpeaker, removeFillers, DeepgramWord } from '@/lib/transcriptionUtils'

interface DeepgramResult {
  type: string
  is_final: boolean
  channel: {
    alternatives: Array<{
      transcript: string
      confidence: number
      words: DeepgramWord[]
    }>
  }
}


interface UseDeepgramTranscriptionReturn {
  isListening: boolean
  interimTranscript: string
  interimSpeakerId: number
  start: () => Promise<void>
  stop: () => void
  isSupported: boolean
}

const DOMAIN_KEYWORDS = [
  'オフィス', 'テナント', '移転', 'レイアウト', '坪', '坪数',
  '会議室', 'フロア', '賃貸', '内装', '設備', '契約',
  'リモートワーク', 'ハイブリッド', 'フリーアドレス',
  '予算', '工期', 'スケジュール', '入居', '退去',
  'デスク', '席数', '収容人数', '組織', '採用計画',
  'コンペ', 'パートナー', '選定', 'チェンジマネジメント',
  'ABW', 'ワークスタイル', '出社率', 'BCP',
  'A工事', 'B工事', 'C工事', '坪単価',
  'ゾーニング', '部門間', 'シナジー', 'ブランディング',
  'イノベーション', '創造性', 'コラボエリア', 'セレンディピティ',
  'エンゲージメント', 'ウェルビーイング', '心理的安全',
  'カルチャー', 'トップダウン', 'ボトムアップ', '自律分散',
  'バイオフィリック', 'インダストリアル', 'シンプルモダン',
]

function buildParams(): string {
  const params = new URLSearchParams({
    model: 'nova-2',
    language: 'ja',
    diarize: 'true',
    smart_format: 'true',
    interim_results: 'true',
    punctuate: 'true',
    filler_words: 'false',
    utterance_end_ms: '1500',
    vad_events: 'true',
  })
  DOMAIN_KEYWORDS.forEach((kw) => params.append('keywords', `${kw}:2`))
  return params.toString()
}

export function useDeepgramTranscription(
  onFinalResult: (text: string, speakerId: number) => void,
  mode: RecordingMode
): UseDeepgramTranscriptionReturn {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [interimSpeakerId, setInterimSpeakerId] = useState(0)
  const [isSupported, setIsSupported] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const displayStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const utteranceRef = useRef<{ text: string; speakerId: number; allWords: DeepgramWord[] }>({ text: '', speakerId: 0, allWords: [] })
  const sessionSpeakerWordsRef = useRef<Record<number, number>>({})
  const onFinalResultRef = useRef(onFinalResult)
  const isActiveRef = useRef(false)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const setupWebSocketRef = useRef<((key: string) => void) | null>(null)

  useEffect(() => { onFinalResultRef.current = onFinalResult }, [onFinalResult])
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  const flushUtterance = useCallback(() => {
    const { text, speakerId, allWords } = utteranceRef.current
    const cleaned = removeFillers(text.trim())
    if (cleaned) {
      allWords.forEach((w) => {
        const s = w.speaker ?? 0
        sessionSpeakerWordsRef.current[s] = (sessionSpeakerWordsRef.current[s] ?? 0) + 1
      })
      const resolved = resolvePhantomSpeaker(speakerId, sessionSpeakerWordsRef.current)
      onFinalResultRef.current(cleaned, resolved)
    }
    utteranceRef.current = { text: '', speakerId: 0, allWords: [] }
    setInterimTranscript('')
  }, [])

  const buildAudioStream = useCallback(async (): Promise<MediaStream> => {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    })
    micStreamRef.current = micStream

    if (mode === 'normal') return micStream

    // オンラインMTGモード: タブ音声をミックス
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true, // ブラウザ仕様上 video も要求し、取得後すぐ停止する
    })
    // 映像トラックは不要なので即停止
    displayStream.getVideoTracks().forEach((t) => t.stop())
    displayStreamRef.current = displayStream

    const audioCtx = new AudioContext()
    audioContextRef.current = audioCtx
    const destination = audioCtx.createMediaStreamDestination()

    audioCtx.createMediaStreamSource(micStream).connect(destination)

    if (displayStream.getAudioTracks().length > 0) {
      audioCtx.createMediaStreamSource(displayStream).connect(destination)
    }

    return destination.stream
  }, [mode])

  const setupWebSocket = useCallback((key: string) => {
    const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${buildParams()}`, ['token', key])
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data: DeepgramResult = JSON.parse(event.data)

      if ((data as unknown as { type: string }).type === 'UtteranceEnd') {
        flushUtterance()
        return
      }
      if ((data as unknown as { type: string }).type !== 'Results') return

      const alt = data.channel?.alternatives?.[0]
      if (!alt?.transcript) return

      if (data.is_final) {
        // 発話全体の累積単語で多数決（フラグメント単位より精度が高い）
        const allWords = [...utteranceRef.current.allWords, ...(alt.words ?? [])]
        const speakerId = getMajoritySpeaker(allWords, utteranceRef.current.speakerId)
        utteranceRef.current = {
          text: utteranceRef.current.text + alt.transcript,
          speakerId,
          allWords,
        }
        setInterimTranscript(utteranceRef.current.text)
        setInterimSpeakerId(speakerId)
      } else {
        const interimSpeakerId = getMajoritySpeaker(
          [...utteranceRef.current.allWords, ...(alt.words ?? [])],
          utteranceRef.current.speakerId
        )
        setInterimTranscript(utteranceRef.current.text + alt.transcript)
        setInterimSpeakerId(interimSpeakerId)
      }
    }

    ws.onerror = (e) => console.error('Deepgram WebSocket error:', e)

    ws.onclose = () => {
      if (!isActiveRef.current) return
      // 意図しない切断 → 1秒後に再接続
      reconnectTimerRef.current = setTimeout(async () => {
        if (!isActiveRef.current) return
        try {
          const res = await fetch('/api/deepgram-token')
          const { key: newKey, error } = await res.json()
          if (!error && newKey && isActiveRef.current) {
            setupWebSocketRef.current?.(newKey)
          }
        } catch (e) {
          console.error('Deepgram reconnect failed:', e)
        }
      }, 1000)
    }

    return ws
  }, [flushUtterance])

  useEffect(() => { setupWebSocketRef.current = setupWebSocket }, [setupWebSocket])

  const start = useCallback(async () => {
    isActiveRef.current = true

    const res = await fetch('/api/deepgram-token')
    const { key, error } = await res.json()
    if (error || !key) throw new Error(error ?? 'Failed to get Deepgram token')

    const audioStream = await buildAudioStream()

    const ws = setupWebSocket(key)

    ws.onopen = () => {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')
        ? 'audio/mp4;codecs=aac'
        : 'audio/mp4'
      const recorder = new MediaRecorder(audioStream, { mimeType })
      mediaRecorderRef.current = recorder

      // wsRef.current 経由で送ることで再接続後も自動的に新しい接続に切り替わる
      recorder.ondataavailable = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && e.data.size > 0) {
          wsRef.current.send(e.data)
        }
      }

      recorder.start(250)
      setIsListening(true)
    }
  }, [buildAudioStream, setupWebSocket])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    sessionSpeakerWordsRef.current = {}
    flushUtterance()
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'CloseStream' }))
      wsRef.current.close()
      wsRef.current = null
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    displayStreamRef.current?.getTracks().forEach((t) => t.stop())
    displayStreamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    setIsListening(false)
    setInterimTranscript('')
  }, [flushUtterance])

  return { isListening, interimTranscript, interimSpeakerId, start, stop, isSupported }
}
