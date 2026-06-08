import { SessionRecord } from '@/types/meeting'

const KEY_PREFIX = 'om_history_'

export function loadProjectHistory(projectId: string): SessionRecord[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(`${KEY_PREFIX}${projectId}`)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SessionRecord[]
  } catch {
    return []
  }
}

export function saveSessionRecord(projectId: string, record: SessionRecord): void {
  if (typeof window === 'undefined') return
  const existing = loadProjectHistory(projectId)
  localStorage.setItem(`${KEY_PREFIX}${projectId}`, JSON.stringify([...existing, record]))
}
