import { useState, type FormEvent } from 'react'
import type { Habit, HabitKind, NewHabit } from '../types'

const COLORS = ['#4f46e5', '#16a34a', '#dc2626', '#d97706', '#0891b2', '#c026d3']

interface Props {
  initial?: Habit | null
  onCancel: () => void
  onSubmit: (data: NewHabit) => Promise<void>
}

export function HabitFormModal({ initial, onCancel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'geral')
  const [kind, setKind] = useState<HabitKind>(initial?.kind ?? 'positive')
  const [targetPerWeek, setTargetPerWeek] = useState(initial?.target_per_week ?? 7)
  const [reminderTime, setReminderTime] = useState(initial?.reminder_time?.slice(0, 5) ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSubmit({
      name: name.trim(),
      category: category.trim() || 'geral',
      kind,
      target_per_week: targetPerWeek,
      reminder_time: reminderTime ? `${reminderTime}:00` : null,
      color,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg md:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold">{initial ? 'Editar hábito' : 'Novo hábito'}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            Nome
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Beber 2L de água"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex-1 text-sm font-medium">
              Categoria
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="saúde, produtividade…"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="flex-1 text-sm font-medium">
              Meta/semana
              <input
                type="number"
                min={1}
                max={7}
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <fieldset className="text-sm font-medium">
            Tipo
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setKind('positive')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  kind === 'positive'
                    ? 'border-[var(--color-good)] bg-[var(--color-good)]/10 text-[var(--color-good)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                Quero manter/fazer mais
              </button>
              <button
                type="button"
                onClick={() => setKind('negative')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  kind === 'negative'
                    ? 'border-[var(--color-bad)] bg-[var(--color-bad)]/10 text-[var(--color-bad)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                Quero evitar/reduzir
              </button>
            </div>
          </fieldset>

          <label className="text-sm font-medium">
            Lembrete diário (opcional)
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="text-sm font-medium">
            Cor
            <div className="mt-1 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2"
                  style={{ background: c, borderColor: color === c ? c : 'transparent' }}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
