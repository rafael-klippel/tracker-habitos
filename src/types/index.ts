export type HabitKind = 'positive' | 'negative'

export interface Habit {
  id: string
  user_id: string
  name: string
  category: string
  kind: HabitKind
  target_per_week: number
  reminder_time: string | null // 'HH:MM:SS'
  color: string
  archived: boolean
  created_at: string
}

export type NewHabit = Pick<
  Habit,
  'name' | 'category' | 'kind' | 'target_per_week' | 'reminder_time' | 'color'
>

export interface HabitEntry {
  id: string
  habit_id: string
  user_id: string
  entry_date: string // 'YYYY-MM-DD'
  completed: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface DailyNote {
  id: string
  user_id: string
  note_date: string
  mood: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}
