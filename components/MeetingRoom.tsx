'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Theme, ThemeStatus, TranscriptEntry, Suggestion, ThemeCoverage, MeetingFeedback, MeetingContext, SessionRecord, AIInsight, DealScore, DEFAULT_THEMES } from '@/types/meeting'
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription'
import { loadProjectHistory, saveSessionRecord } from '@/lib/projectHistory'
import { Flame, Brain, Sparkles } from 'lucide-react'
import RecordingControls, { RecordingMode } from './RecordingControls'
import HearingProgress from './HearingProgress'
import HeroSuggestion from './HeroSuggestion'
import AIInsightPanel from './AIInsightPanel'
import NotesModal from './NotesModal'
import QuestionPromptOverlay from './QuestionPromptOverlay'
import ProjectSelector from './ProjectSelector'

type MobileTab = 'progress' | 'suggestion' | 'insight'

function buildFallbackSuggestions(themes: Theme[], targetThemeId?: string): Suggestion[] {
  if (targetThemeId) {
    const theme = themes.find((t) => t.id === targetThemeId)
    if (!theme || theme.questions.length === 0) return []
    return theme.questions.slice(0, 3).map((q, i) => ({
      id: `fallback-${Date.now()}-${i}`,
      themeId: theme.id,
      themeName: theme.name,
      question: q,
      status: 'pending' as const,
      isFallback: true,
    }))
  }
  return themes
    .filter((t) => t.status === 'pending' && t.questions.length > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((theme, i) => ({
      id: `fallback-${Date.now()}-${i}`,
      themeId: theme.id,
      themeName: theme.name,
      question: theme.questions[0],
      status: 'pending' as const,
      isFallback: true,
    }))
}

export default function MeetingRoom() {
  const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [notes, setNotes] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<MeetingFeedback | null>(null)
  const [keyDecisions, setKeyDecisions] = useState<string[]>([])
  const [openQuestions, setOpenQuestions] = useState<string[]>([])
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [promptQuestion, setPromptQuestion] = useState<string | null>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [duration, setDuration] = useState(0)
  const [coverage, setCoverage] = useState<ThemeCoverage[]>([])
  const [insight, setInsight] = useState<AIInsight | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const [mode, setMode] = useState<RecordingMode>('normal')
  const [meetingContext, setMeetingContext] = useState<MeetingContext | null>(null)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [activeTab, setActiveTab] = useState<MobileTab>('suggestion')

  const themesRef = useRef<Theme[]>(themes)
  themesRef.current = themes

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const coverageDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const periodicSuggestionRef = useRef<NodeJS.Timeout | null>(null)
  const recentTranscriptRef = useRef<string>('')
  const lastSuggestionContentRef = useRef<string>('')
  const isFetchingSuggestionsRef = useRef(false)
  const fullTranscriptRef = useRef<TranscriptEntry[]>([])
  const meetingContextRef = useRef<MeetingContext | null>(null)

  const handleFinalResult = useCallback((text: string, speakerId: number) => {
    const entry: TranscriptEntry = {
      id: `entry-${Date.now()}`,
      text,
      speakerId,
      timestamp: new Date(),
    }
    fullTranscriptRef.current = [...fullTranscriptRef.current, entry]
    setTranscript(fullTranscriptRef.current)

    const combined = recentTranscriptRef.current ? `${recentTranscriptRef.current}\n${text}` : text
    recentTranscriptRef.current = combined.length > 1500 ? combined.slice(-1500) : combined

    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current)
    suggestionDebounceRef.current = setTimeout(() => {
      fetchSuggestions(recentTranscriptRef.current)
    }, 1000)

    if (coverageDebounceRef.current) clearTimeout(coverageDebounceRef.current)
    coverageDebounceRef.current = setTimeout(() => {
      fetchCoverage(fullTranscriptRef.current)
    }, 5000)
  }, [])

  const { isListening, interimTranscript, interimSpeakerId, start, stop, isSupported } =
    useDeepgramTranscription(handleFinalResult, mode)

  const fetchSuggestions = async (recentTranscript: string, targetThemeId?: string) => {
    if (isFetchingSuggestionsRef.current) return
    isFetchingSuggestionsRef.current = true
    lastSuggestionContentRef.current = recentTranscript

    setSuggestions((prev) => {
      if (prev.some((s) => s.status === 'pending' && !s.isFallback)) return prev
      const fallbacks = buildFallbackSuggestions(themesRef.current, targetThemeId)
      return [...prev.filter((s) => s.status !== 'pending'), ...fallbacks]
    })

    setIsLoadingSuggestions(true)
    let firstArrived = false

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentTranscript,
          themes,
          priorHistory: meetingContextRef.current?.priorHistory ?? [],
          targetThemeId,
        }),
      })

      if (!res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const suggestion = JSON.parse(trimmed) as Suggestion
            if (!firstArrived) {
              firstArrived = true
              setSuggestions((prev) => [...prev.filter((s) => s.status !== 'pending'), suggestion])
              setActiveTab('suggestion')
            } else {
              setSuggestions((prev) => [...prev, suggestion])
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    } finally {
      isFetchingSuggestionsRef.current = false
      setIsLoadingSuggestions(false)
    }
  }

  const handleRequestSuggestion = (themeId: string) => {
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current)
    fetchSuggestions(recentTranscriptRef.current, themeId)
  }

  const fetchCoverage = async (currentTranscript: TranscriptEntry[]) => {
    try {
      const res = await fetch('/api/analyze-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: currentTranscript.slice(-40), themes }),
      })
      const data = await res.json()
      if (data.coverage?.length > 0) setCoverage(data.coverage)
    } catch (err) {
      console.error('Failed to fetch coverage:', err)
    }

    if (fullTranscriptRef.current.length >= 3) {
      fetchInsight(fullTranscriptRef.current)
    }
  }

  const fetchInsight = async (currentTranscript: TranscriptEntry[]) => {
    setIsLoadingInsight(true)
    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: currentTranscript }),
      })
      const data = await res.json()
      if (data.insight) setInsight(data.insight)
    } catch (err) {
      console.error('Failed to fetch insight:', err)
    } finally {
      setIsLoadingInsight(false)
    }
  }

  const handleToggleRecording = async () => {
    if (isListening) {
      stop()
      if (timerRef.current) clearInterval(timerRef.current)
      if (periodicSuggestionRef.current) clearInterval(periodicSuggestionRef.current)
    } else {
      try {
        await start()
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
        periodicSuggestionRef.current = setInterval(() => {
          const current = recentTranscriptRef.current
          if (current && current !== lastSuggestionContentRef.current) {
            fetchSuggestions(current)
          }
        }, 20000)
      } catch (err) {
        console.error('Failed to start recording:', err)
      }
    }
  }

  const handleProjectSelected = (context: MeetingContext) => {
    const priorHistory = loadProjectHistory(context.project.id)
    const contextWithHistory = { ...context, priorHistory }
    meetingContextRef.current = contextWithHistory
    setMeetingContext(contextWithHistory)
    setShowProjectSelector(false)
  }

  const handleThemeStatusChange = (themeId: string, status: ThemeStatus) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, status } : t))
    )
  }

  const handleUseSuggestion = (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id)
    if (suggestion) setPromptQuestion(suggestion.question)
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'used' } : s))
    )
  }

  const handleDeferSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'deferred' } : s))
    )
  }

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'skipped' } : s))
    )
  }

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true)
    try {
      const [notesRes, feedbackRes] = await Promise.all([
        fetch('/api/generate-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, themes }),
        }),
        fetch('/api/generate-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, themes, coverage }),
        }),
      ])
      const [notesData, feedbackData] = await Promise.all([notesRes.json(), feedbackRes.json()])
      if (notesData.notes) setNotes(notesData.notes)
      if (notesData.keyDecisions) setKeyDecisions(notesData.keyDecisions)
      if (notesData.openQuestions) setOpenQuestions(notesData.openQuestions)
      if (feedbackData.feedback) setFeedback(feedbackData.feedback)

      const ctx = meetingContextRef.current
      if (ctx) {
        const record: SessionRecord = {
          sessionId: `session-${Date.now()}`,
          date: new Date().toISOString(),
          keyDecisions: notesData.keyDecisions ?? [],
          openQuestions: notesData.openQuestions ?? [],
          coverage,
          confirmedThemeIds: themes.filter((t) => t.status === 'confirmed').map((t) => t.id),
        }
        saveSessionRecord(ctx.project.id, record)
        const updated = { ...ctx, priorHistory: [...(ctx.priorHistory ?? []), record] }
        meetingContextRef.current = updated
        setMeetingContext(updated)
      }
    } catch (err) {
      console.error('Failed to generate notes/feedback:', err)
    } finally {
      setIsGeneratingNotes(false)
    }
  }

  useEffect(() => {
    if (isListening) setActiveTab('suggestion')
  }, [isListening])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current)
      if (coverageDebounceRef.current) clearTimeout(coverageDebounceRef.current)
      if (periodicSuggestionRef.current) clearInterval(periodicSuggestionRef.current)
    }
  }, [])

  const usedCount = suggestions.filter((s) => s.status === 'used').length

  const dealScore: DealScore | null = (() => {
    if (transcript.length < 5) return null
    const essential = themes.filter((t) => t.priority === 5)
    const confirmedEssential = essential.filter((t) => t.status === 'confirmed')
    const uncoveredEssential = essential.filter((t) => t.status !== 'confirmed')
    const coveredCount = coverage.filter((c) => c.coveredPercent >= 50).length
    let score = 40
    score += confirmedEssential.length * 15
    score += Math.min(20, coveredCount * 4)
    score = Math.min(92, score)
    const positives = confirmedEssential.map((t) => `${t.name}を把握`)
    const warnings = uncoveredEssential.slice(0, 2).map((t) => `${t.name}未取得`)
    return { score, positives, warnings }
  })()

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <RecordingControls
        isRecording={isListening}
        duration={duration}
        transcriptCount={transcript.length}
        isGeneratingNotes={isGeneratingNotes}
        isSupported={isSupported}
        mode={mode}
        context={meetingContext}
        onModeChange={setMode}
        onToggleRecording={handleToggleRecording}
        onGenerateNotes={handleGenerateNotes}
        onOpenProjectSelector={() => setShowProjectSelector(true)}
      />

      {/* デスクトップ */}
      <div className="hidden md:grid flex-1 overflow-hidden grid-cols-[240px_1fr_260px]" style={{ minHeight: 0 }}>
        <div className="border-r border-slate-200 bg-white overflow-hidden">
          <HearingProgress
            themes={themes}
            coverage={coverage}
            onStatusChange={handleThemeStatusChange}
            onRequestSuggestion={handleRequestSuggestion}
          />
        </div>
        <div className="overflow-hidden">
          <HeroSuggestion
            suggestions={suggestions}
            themes={themes}
            isLoading={isLoadingSuggestions}
            hasContext={meetingContext !== null}
            usedCount={usedCount}
            aiAlert={insight?.aiAlert}
            onUse={handleUseSuggestion}
            onDefer={handleDeferSuggestion}
            onDismiss={handleDismissSuggestion}
            onLinkProject={() => setShowProjectSelector(true)}
          />
        </div>
        <div className="overflow-hidden">
          <AIInsightPanel
            insight={insight}
            transcript={transcript}
            isRecording={isListening}
            isLoading={isLoadingInsight}
            dealScore={dealScore}
          />
        </div>
      </div>

      {/* モバイル */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'progress' && (
            <HearingProgress
              themes={themes}
              coverage={coverage}
              onStatusChange={handleThemeStatusChange}
              onRequestSuggestion={isListening ? handleRequestSuggestion : undefined}
            />
          )}
          {activeTab === 'suggestion' && (
            <HeroSuggestion
              suggestions={suggestions}
              themes={themes}
              isLoading={isLoadingSuggestions}
              hasContext={meetingContext !== null}
              usedCount={usedCount}
              aiAlert={insight?.aiAlert}
              onUse={handleUseSuggestion}
              onDefer={handleDeferSuggestion}
              onDismiss={handleDismissSuggestion}
              onLinkProject={() => setShowProjectSelector(true)}
            />
          )}
          {activeTab === 'insight' && (
            <AIInsightPanel
              insight={insight}
              transcript={transcript}
              isRecording={isListening}
              isLoading={isLoadingInsight}
              dealScore={dealScore}
            />
          )}
        </div>

        <div className="border-t border-slate-200 bg-white grid grid-cols-3 shrink-0 safe-bottom">
          {([
            { id: 'progress' as MobileTab,   icon: Flame,    label: '充実度',   badge: null },
            { id: 'suggestion' as MobileTab, icon: Sparkles, label: '次の質問', badge: suggestions.filter((s) => s.status === 'pending').length > 0 ? String(suggestions.filter((s) => s.status === 'pending').length) : null },
            { id: 'insight' as MobileTab,    icon: Brain,    label: 'AI理解',   badge: insight?.missingItems?.length ? String(insight.missingItems.length) : null },
          ]).map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors relative ${
                activeTab === id ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {activeTab === id && (
                <span className="absolute top-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
              )}
              <Icon size={18} />
              <span>{label}</span>
              {badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                  activeTab === id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {notes && (
        <NotesModal
          notes={notes}
          feedback={feedback}
          keyDecisions={keyDecisions}
          openQuestions={openQuestions}
          onClose={() => { setNotes(null); setFeedback(null); setKeyDecisions([]); setOpenQuestions([]) }}
        />
      )}
      {promptQuestion && (
        <QuestionPromptOverlay
          question={promptQuestion}
          onClose={() => setPromptQuestion(null)}
        />
      )}
      {showProjectSelector && (
        <ProjectSelector
          onStart={handleProjectSelected}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
    </div>
  )
}
