// Supabase Edge Function: dispara notificações push para hábitos com lembrete
// no horário atual que ainda não foram concluídos hoje.
//
// Precisa rodar em um agendamento (a cada minuto) — veja instruções no README.
// Secrets necessários (Project Settings > Edge Functions > Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// timezone fixo (Brasil, UTC-3) para manter o cálculo simples, já que o app é de uso pessoal.
const TIMEZONE_OFFSET_HOURS = -3

webpush.setVapidDetails('mailto:tracker-app@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const nowUtc = new Date()
  const localNow = new Date(nowUtc.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000)
  const currentTime = `${String(localNow.getUTCHours()).padStart(2, '0')}:${String(
    localNow.getUTCMinutes(),
  ).padStart(2, '0')}`
  const today = localNow.toISOString().slice(0, 10)

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, user_id, name, reminder_time')
    .eq('archived', false)
    .not('reminder_time', 'is', null)

  if (habitsError) {
    return new Response(JSON.stringify({ error: habitsError.message }), { status: 500 })
  }

  const due = (habits ?? []).filter((h) => h.reminder_time?.slice(0, 5) === currentTime)
  let sent = 0

  for (const habit of due) {
    const { data: entry } = await supabase
      .from('habit_entries')
      .select('completed')
      .eq('habit_id', habit.id)
      .eq('entry_date', today)
      .maybeSingle()

    if (entry?.completed) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', habit.user_id)

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: 'Tracker',
            body: `Não esqueça: ${habit.name}`,
            habitId: habit.id,
            url: '/',
          }),
        )
        sent += 1
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return new Response(JSON.stringify({ checked: habits?.length ?? 0, due: due.length, sent }), {
    headers: { 'content-type': 'application/json' },
  })
})
