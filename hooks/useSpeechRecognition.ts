'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const webkitSpeechRecognition: any
declare const SpeechRecognition: any

interface UseSpeechRecognitionReturn {
  isListening: boolean
  finalTranscript: string
  interimTranscript: string
  start: () => void
  stop: () => void
  isSupported: boolean
}

export function useSpeechRecognition(
  onFinalResult: (text: string) => void
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  const start = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognitionAPI =
      typeof webkitSpeechRecognition !== 'undefined'
        ? webkitSpeechRecognition
        : SpeechRecognition

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ja-JP'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setInterimTranscript(interim)
      if (final) {
        setFinalTranscript(final)
        onFinalResult(final.trim())
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error)
      }
    }

    recognition.onend = () => {
      if (recognitionRef.current) {
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, onFinalResult])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  return { isListening, finalTranscript, interimTranscript, start, stop, isSupported }
}
