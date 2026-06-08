export interface DeepgramWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: number
}

export function getMajoritySpeaker(words: DeepgramWord[], fallback = 0): number {
  if (!words?.length) return fallback
  const counts = words.reduce<Record<number, number>>((acc, w) => {
    const s = w.speaker ?? 0
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const sorted = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))
  const topCount = Number(sorted[0][1])
  if (words.length >= 4 && topCount / words.length < 0.5) return fallback
  return Number(sorted[0][0])
}

export function resolvePhantomSpeaker(
  speakerId: number,
  sessionCounts: Record<number, number>
): number {
  const total = Object.values(sessionCounts).reduce((a, b) => a + b, 0)
  if (total < 30) return speakerId
  const ratio = (sessionCounts[speakerId] ?? 0) / total
  if (ratio < 0.05) {
    const dominant = Object.entries(sessionCounts)
      .filter(([id]) => Number(id) !== speakerId)
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0]
    return dominant ? Number(dominant[0]) : speakerId
  }
  return speakerId
}

export function removeFillers(text: string): string {
  return text
    .replace(/(えー+と?|えっと|あー+|うー+ん?|あのー?|まー+|そのー?)[、。！？\s]*/g, '')
    .replace(/^[、。！？\s]+/, '')
    .trim()
}
