import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchHabits, fetchEntries, fetchDailyNotesRange } from '../lib/api'
import { addDays, toDateStr } from '../lib/habitStats'
import { buildAnalysisDocument, downloadTextFile } from '../lib/exportAnalysis'

const PERIODS = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 14 dias', value: 14 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 90 dias', value: 90 },
]

export function Export() {
  const { user } = useAuth()
  const [days, setDays] = useState(30)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleGenerate() {
    if (!user) return
    setGenerating(true)
    const start = toDateStr(addDays(new Date(), -(days - 1)))
    const end = toDateStr(new Date())
    const [habits, entries, notes] = await Promise.all([
      fetchHabits(user.id),
      fetchEntries(user.id, start, end),
      fetchDailyNotesRange(user.id, start, end),
    ])

    const entriesByHabit = new Map<string, typeof entries>()
    for (const habit of habits) entriesByHabit.set(habit.id, entries.filter((e) => e.habit_id === habit.id))

    const doc = buildAnalysisDocument({ habits, entriesByHabit, dailyNotes: notes, days })
    setPreview(doc)
    setGenerating(false)
  }

  function handleDownload() {
    if (!preview) return
    downloadTextFile(`tracker-analise-${toDateStr(new Date())}.md`, preview)
  }

  async function handleCopy() {
    if (!preview) return
    await navigator.clipboard.writeText(preview)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Análise com IA</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Gere um documento com seus dados de hábitos e um prompt pronto. Baixe ou copie, cole no Claude
          (claude.ai) e receba feedback, análise e sugestões personalizadas.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <label className="text-sm font-medium">
          Período
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-3 w-full rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
        >
          {generating ? 'Gerando…' : 'Gerar documento'}
        </button>
      </div>

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
            >
              ⬇️ Baixar arquivo (.md)
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
            >
              📋 Copiar texto
            </button>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs text-[var(--color-text)]">
            {preview}
          </pre>
        </div>
      )}
    </div>
  )
}
