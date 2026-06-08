import { ThemeCoverage } from '@/types/meeting'

export const STEPS = [10, 30, 50, 80, 90, 100] as const

export function calcProgress(coverage: ThemeCoverage[], total: number): number {
  if (total === 0 || coverage.length === 0) return 0
  const sum = coverage.reduce((acc, c) => acc + c.coveredPercent, 0)
  return Math.round(sum / total)
}

export function getStep(percent: number): number {
  let step = 0
  for (const s of STEPS) {
    if (percent >= s) step = s
  }
  return step
}

export function stepColor(step: number) {
  if (step >= 90) return { text: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' }
  if (step >= 50) return { text: 'text-orange-500',  bar: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700'  }
  if (step >= 10) return { text: 'text-red-500',     bar: 'bg-red-400',     badge: 'bg-red-100 text-red-700'       }
  return           { text: 'text-slate-400',          bar: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500'   }
}
