import { supabase } from './supabase'
import type { DailyNote, Habit, HabitEntry, NewHabit } from '../types'

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Habit[]
}

export async function createHabit(userId: string, habit: NewHabit): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...habit, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Habit
}

export async function updateHabit(
  id: string,
  changes: Partial<NewHabit & { archived: boolean }>,
): Promise<Habit> {
  const { data, error } = await supabase.from('habits').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data as Habit
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function fetchEntries(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<HabitEntry[]> {
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
  if (error) throw error
  return data as HabitEntry[]
}

export async function upsertEntry(
  userId: string,
  habitId: string,
  entryDate: string,
  completed: boolean,
  note?: string | null,
): Promise<HabitEntry> {
  const { data, error } = await supabase
    .from('habit_entries')
    .upsert(
      { user_id: userId, habit_id: habitId, entry_date: entryDate, completed, note: note ?? null },
      { onConflict: 'habit_id,entry_date' },
    )
    .select()
    .single()
  if (error) throw error
  return data as HabitEntry
}

export async function fetchDailyNote(userId: string, date: string): Promise<DailyNote | null> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('note_date', date)
    .maybeSingle()
  if (error) throw error
  return data as DailyNote | null
}

export async function fetchDailyNotesRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DailyNote[]> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .gte('note_date', startDate)
    .lte('note_date', endDate)
  if (error) throw error
  return data as DailyNote[]
}

export async function upsertDailyNote(
  userId: string,
  date: string,
  mood: number | null,
  note: string,
): Promise<DailyNote> {
  const { data, error } = await supabase
    .from('daily_notes')
    .upsert(
      { user_id: userId, note_date: date, mood, note },
      { onConflict: 'user_id,note_date' },
    )
    .select()
    .single()
  if (error) throw error
  return data as DailyNote
}
