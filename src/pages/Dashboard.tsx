import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchHabits, fetchEntries, upsertEntry, fetchDailyNote, upsertDailyNote } from '../lib/api'
import { currentStreak, toDateStr, entriesByDate } from '../lib/habitStats'
import type { DailyNote, Habit, HabitEntry } from '../types'

const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '🙁' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
]

export function Dashboard() {
  const { user } = useAuth()
  const today = toDateStr(new Date())
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [note, setNote] = useState<DailyNote | null>(null)
  const [noteText, setNoteText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const start = toDateStr(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
    const [habitsData, entriesData, noteData] = await Promise.all([
      fetchHabits(user.id),
      fetchEntries(user.id, start, today),
      fetchDailyNote(user.id, today),
    ])
    setHabits(habitsData.filter((h) => !h.archived))
    setEntries(entriesData)
    setNote(noteData)
    setNoteText(noteData?.note ?? '')
    setMood(noteData?.mood ?? null)
    setLoading(false)
  }

  async function toggleHabit(habit: Habit, entry: HabitEntry | undefined) {
    if (!user) return
    const next = !(entry?.completed ?? false)
    const updated = await upsertEntry(user.id, habit.id, today, next, entry?.note)
    setEntries((prev) => {
      const rest = prev.filter((e) => !(e.habit_id === habit.id && e.entry_date === today))
      return [...rest, updated]
    })
  }

  async function saveNote() {
    if (!user) return
    setSavingNote(true)
    const updated = await upsertDailyNote(user.id, today, mood, noteText)
    setNote(updated)
    setSavingNote(false)
  }

  const entryMap = entriesByDate(entries.filter((e) => e.entry_date === today))
  const entriesByHabitId = new Map<string, HabitEntry[]>()
  for (const h of habits) entriesByHabitId.set(h.id, entries.filter((e) => e.habit_id === h.id))

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Carregando…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold capitalize">Hoje</h1>
        <p className="text-sm text-[var(--color-text-muted)] capitalize">{dateLabel}</p>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          Você ainda não tem hábitos cadastrados. Vá em "Hábitos" para adicionar o primeiro.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map((habit) => {
            const entry = entryMap.get(today)
            const habitEntries = entriesByHabitId.get(habit.id) ?? []
            const streak = currentStreak(habit, habitEntries)
            const checked = entry?.completed ?? false
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit, entry)}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs"
                    style={{
                      borderColor: habit.color,
                      background: checked ? habit.color : 'transparent',
                      color: checked ? '#fff' : 'transparent',
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-medium">{habit.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {habit.category} · {habit.kind === 'positive' ? 'manter' : 'evitar'}
                    </p>
                  </div>
                </div>
                {streak > 0 && (
                  <span className="whitespace-nowrap text-xs font-semibold text-[var(--color-accent)]">
                    🔥 {streak}d
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-2 text-sm font-semibold">Como foi o dia?</h2>
        <div className="mb-3 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform ${
                mood === m.value ? 'scale-110 bg-[var(--color-accent)]/20' : ''
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Observações sobre o dia, contexto, o que ajudou ou atrapalhou…"
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          onClick={saveNote}
          disabled={savingNote}
          className="mt-2 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
        >
          {savingNote ? 'Salvando…' : note ? 'Atualizar nota' : 'Salvar nota'}
        </button>
      </div>
    </div>
  )
}
