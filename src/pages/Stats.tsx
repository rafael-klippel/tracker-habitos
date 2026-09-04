import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { fetchHabits, fetchEntries } from '../lib/api'
import { addDays, bestStreak, completionRate, currentStreak, entriesByDate, isSuccessDay, toDateStr } from '../lib/habitStats'
import type { Habit, HabitEntry } from '../types'

const WINDOW_DAYS = 30

export function Stats() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const start = toDateStr(addDays(new Date(), -WINDOW_DAYS))
    const end = toDateStr(new Date())
    const [habitsData, entriesData] = await Promise.all([fetchHabits(user.id), fetchEntries(user.id, start, end)])
    setHabits(habitsData.filter((h) => !h.archived))
    setEntries(entriesData)
    setLoading(false)
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Carregando…</p>

  const overallSeries = Array.from({ length: 14 }).map((_, i) => {
    const day = addDays(new Date(), -(13 - i))
    const key = toDateStr(day)
    const dayEntries = entries.filter((e) => e.entry_date === key)
    let successes = 0
    for (const habit of habits) {
      const entry = dayEntries.find((e) => e.habit_id === habit.id)
      if (isSuccessDay(habit, entry)) successes += 1
    }
    const rate = habits.length ? Math.round((successes / habits.length) * 100) : 0
    return { date: key.slice(5), rate }
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Estatísticas</h1>

      {habits.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Cadastre hábitos para ver estatísticas.</p>
      ) : (
        <>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold">Taxa geral de sucesso (últimos 14 dias)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={overallSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  width={32}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Taxa de sucesso']}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="rate" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            {habits.map((habit) => {
              const habitEntries = entries.filter((e) => e.habit_id === habit.id)
              const map = entriesByDate(habitEntries)
              const streak = currentStreak(habit, habitEntries)
              const best = bestStreak(habit, habitEntries)
              const rate = completionRate(habit, habitEntries, WINDOW_DAYS)

              const days = Array.from({ length: WINDOW_DAYS }).map((_, i) => {
                const date = addDays(new Date(), -(WINDOW_DAYS - 1 - i))
                const key = toDateStr(date)
                const entry = map.get(key)
                return { key, success: isSuccessDay(habit, entry), logged: entry !== undefined }
              })

              return (
                <div
                  key={habit.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: habit.color }} />
                      <p className="text-sm font-semibold">{habit.name}</p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{rate}% em {WINDOW_DAYS}d</p>
                  </div>

                  <div className="mb-2 flex gap-1">
                    {days.map((d) => (
                      <div
                        key={d.key}
                        title={d.key}
                        className="h-4 w-2 rounded-sm"
                        style={{
                          background: d.success ? habit.color : 'var(--color-surface-2)',
                          opacity: d.logged || d.success ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>🔥 sequência atual: {streak}d</span>
                    <span>🏆 melhor: {best}d</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
