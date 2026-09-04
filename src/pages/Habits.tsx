import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createHabit, deleteHabit, fetchHabits, updateHabit } from '../lib/api'
import { HabitFormModal } from '../components/HabitFormModal'
import type { Habit, NewHabit } from '../types'

export function Habits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    setHabits(await fetchHabits(user.id))
    setLoading(false)
  }

  async function handleSubmit(data: NewHabit) {
    if (!user) return
    if (editing) {
      await updateHabit(editing.id, data)
    } else {
      await createHabit(user.id, data)
    }
    setShowForm(false)
    setEditing(null)
    await load()
  }

  async function handleArchiveToggle(habit: Habit) {
    await updateHabit(habit.id, { archived: !habit.archived })
    await load()
  }

  async function handleDelete(habit: Habit) {
    if (!confirm(`Excluir "${habit.name}" e todo o histórico dele? Essa ação não pode ser desfeita.`)) return
    await deleteHabit(habit.id)
    await load()
  }

  const active = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) => h.archived)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hábitos</h1>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Novo
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Carregando…</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {active.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: habit.color }} />
                  <div>
                    <p className="text-sm font-medium">{habit.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {habit.category} · {habit.kind === 'positive' ? 'manter' : 'evitar'} · meta{' '}
                      {habit.target_per_week}x/semana
                      {habit.reminder_time ? ` · lembrete ${habit.reminder_time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 text-xs">
                  <button
                    onClick={() => {
                      setEditing(habit)
                      setShowForm(true)
                    }}
                    className="rounded-lg border border-[var(--color-border)] px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleArchiveToggle(habit)}
                    className="rounded-lg border border-[var(--color-border)] px-2 py-1"
                  >
                    Arquivar
                  </button>
                  <button
                    onClick={() => handleDelete(habit)}
                    className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-bad)]"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {active.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">Nenhum hábito ativo ainda.</p>
            )}
          </div>

          {archived.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-muted)]">Arquivados</h2>
              <div className="flex flex-col gap-2">
                {archived.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 opacity-70"
                  >
                    <p className="text-sm">{habit.name}</p>
                    <button
                      onClick={() => handleArchiveToggle(habit)}
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs"
                    >
                      Reativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <HabitFormModal
          initial={editing}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
