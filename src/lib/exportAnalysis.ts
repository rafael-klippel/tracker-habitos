import type { Habit, HabitEntry, DailyNote } from '../types'
import { bestStreak, completionRate, currentStreak, entriesByDate, toDateStr, addDays } from './habitStats'

interface BuildDocParams {
  habits: Habit[]
  entriesByHabit: Map<string, HabitEntry[]>
  dailyNotes: DailyNote[]
  days: number
}

export function buildAnalysisDocument({ habits, entriesByHabit, dailyNotes, days }: BuildDocParams): string {
  const today = new Date()
  const rangeStart = toDateStr(addDays(today, -(days - 1)))
  const rangeEnd = toDateStr(today)

  const prompt = `Você é um coach de hábitos empático e direto, especializado em mudança comportamental.
Abaixo estão os dados reais de acompanhamento de hábitos de uma pessoa, exportados do app "Tracker",
referentes ao período de ${rangeStart} a ${rangeEnd}.

Analise os dados e produza:
1. Um resumo geral do desempenho no período (pontos fortes e pontos de atenção).
2. Para cada hábito, um comentário específico (streaks, consistência, tendência de melhora ou piora).
3. Padrões ou correlações que você perceber entre os hábitos e as notas diárias (humor/contexto), se houver.
4. 3 a 5 sugestões práticas e específicas para a próxima semana, priorizadas pelo que teria mais impacto.
5. Uma mensagem curta de encorajamento, realista (sem exageros vazios).

Seja honesto mesmo quando o desempenho foi ruim — o objetivo é progresso real, não validação.

--- DADOS ---
`

  const habitSections = habits
    .filter((h) => !h.archived)
    .map((habit) => {
      const entries = entriesByHabit.get(habit.id) ?? []
      const map = entriesByDate(entries)
      const streak = currentStreak(habit, entries, today)
      const best = bestStreak(habit, entries)
      const rate7 = completionRate(habit, entries, 7)
      const rateFull = completionRate(habit, entries, days)

      const dayLines: string[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = addDays(today, -i)
        const key = toDateStr(date)
        const entry = map.get(key)
        const status = entry === undefined ? 'sem registro' : entry.completed ? 'feito' : 'não feito'
        const note = entry?.note ? ` — nota: "${entry.note}"` : ''
        dayLines.push(`  ${key}: ${status}${note}`)
      }

      const kindLabel = habit.kind === 'positive' ? 'hábito a manter/fortalecer' : 'hábito a evitar/reduzir'

      return [
        `### ${habit.name} (${kindLabel}, categoria: ${habit.category})`,
        `- Meta: ${habit.target_per_week}x por semana`,
        `- Sequência atual: ${streak} dia(s)`,
        `- Melhor sequência no período: ${best} dia(s)`,
        `- Taxa de sucesso (últimos 7 dias): ${rate7}%`,
        `- Taxa de sucesso (últimos ${days} dias): ${rateFull}%`,
        `- Registro diário:`,
        ...dayLines,
      ].join('\n')
    })
    .join('\n\n')

  const notesSection = dailyNotes.length
    ? dailyNotes
        .slice()
        .sort((a, b) => a.note_date.localeCompare(b.note_date))
        .map((n) => `  ${n.note_date}${n.mood ? ` (humor: ${n.mood}/5)` : ''}: ${n.note ?? ''}`)
        .join('\n')
    : '  (nenhuma nota registrada no período)'

  return `${prompt}\n## Hábitos\n\n${habitSections}\n\n## Notas diárias\n\n${notesSection}\n`
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
