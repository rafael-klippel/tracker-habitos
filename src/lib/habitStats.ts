import type { Habit, HabitEntry } from '../types'

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

// 'YYYY-MM-DD' -> Date local (evita o parsing de new Date(string), que trata como UTC
// e pode voltar um dia quando o fuso do usuário é negativo, ex: Brasil).
export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function entriesByDate(entries: HabitEntry[]): Map<string, HabitEntry> {
  const map = new Map<string, HabitEntry>()
  for (const e of entries) map.set(e.entry_date, e)
  return map
}

/**
 * Um dia conta como "sucesso" quando:
 * - hábito positivo: foi marcado como feito
 * - hábito negativo (vício/comportamento a evitar): NÃO foi marcado como feito
 *   (dia sem registro é tratado como sucesso, já que ausência de log = nada de ruim aconteceu)
 */
export function isSuccessDay(habit: Habit, entry: HabitEntry | undefined): boolean {
  if (habit.kind === 'negative') return entry?.completed !== true
  return entry?.completed === true
}

const MAX_STREAK_LOOKBACK_DAYS = 3650 // 10 anos — trava de segurança, nunca deve ser atingida na prática

export function currentStreak(habit: Habit, entries: HabitEntry[], today: Date = new Date()): number {
  const map = entriesByDate(entries)
  let streak = 0
  let cursor = new Date(today)

  // se hoje ainda não foi registrado (hábito positivo), não quebra a sequência, só não conta ainda
  const todayEntry = map.get(toDateStr(today))
  if (habit.kind === 'positive' && !todayEntry?.completed) {
    cursor = addDays(cursor, -1)
  }

  // hábitos negativos contam "sucesso" quando não há registro (nada de ruim aconteceu),
  // então a sequência não pode voltar antes da criação do hábito, senão nunca para.
  const earliestBound = parseDateStr(toDateStr(new Date(habit.created_at)))

  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS && cursor >= earliestBound; i++) {
    const key = toDateStr(cursor)
    const entry = map.get(key)
    if (isSuccessDay(habit, entry)) {
      streak += 1
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }
  return streak
}

export function bestStreak(habit: Habit, entries: HabitEntry[]): number {
  const map = entriesByDate(entries)
  const dates = entries.map((e) => e.entry_date).sort()
  if (dates.length === 0) return 0

  let best = 0
  let running = 0
  let cursor = parseDateStr(dates[0])
  const last = parseDateStr(dates[dates.length - 1])

  while (cursor <= last) {
    const key = toDateStr(cursor)
    const entry = map.get(key)
    if (isSuccessDay(habit, entry)) {
      running += 1
      best = Math.max(best, running)
    } else {
      running = 0
    }
    cursor = addDays(cursor, 1)
  }
  return best
}

export function completionRate(habit: Habit, entries: HabitEntry[], days: number): number {
  const map = entriesByDate(entries)
  const today = new Date()
  let successes = 0
  for (let i = 0; i < days; i++) {
    const day = addDays(today, -i)
    const entry = map.get(toDateStr(day))
    if (isSuccessDay(habit, entry)) successes += 1
  }
  return Math.round((successes / days) * 100)
}
