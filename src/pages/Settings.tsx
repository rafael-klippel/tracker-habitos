import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPushPermissionState, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'

export function Settings() {
  const { user, signOut } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPushPermissionState().then(setPermission)
  }, [])

  async function handleEnable() {
    if (!user) return
    setBusy(true)
    setMessage(null)
    const { error } = await subscribeToPush(user.id)
    setBusy(false)
    if (error) setMessage(error)
    else {
      setMessage('Notificações ativadas neste dispositivo.')
      setPermission(await getPushPermissionState())
    }
  }

  async function handleDisable() {
    setBusy(true)
    await unsubscribeFromPush()
    setBusy(false)
    setMessage('Notificações desativadas neste dispositivo.')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-semibold">Conta</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user?.email}</p>
        <button
          onClick={() => signOut()}
          className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
        >
          Sair da conta
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-semibold">Notificações push</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Ative para receber lembretes no horário configurado em cada hábito, mesmo com o app fechado.
        </p>

        {!isPushSupported() ? (
          <p className="mt-3 text-sm text-[var(--color-warn)]">
            Este navegador/dispositivo não suporta notificações push (no iPhone, adicione o app à tela de
            início primeiro, pelo Safari).
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleEnable}
              disabled={busy || permission === 'denied'}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
            >
              Ativar neste dispositivo
            </button>
            <button
              onClick={handleDisable}
              disabled={busy}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
            >
              Desativar
            </button>
          </div>
        )}

        {permission === 'denied' && (
          <p className="mt-2 text-sm text-[var(--color-bad)]">
            As notificações estão bloqueadas para este site nas configurações do navegador.
          </p>
        )}
        {message && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{message}</p>}
      </div>
    </div>
  )
}
