import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Signup() {
  const { session, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password)
    setSubmitting(false)
    if (error) setError(error)
    else setDone(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] font-bold text-[var(--color-accent-contrast)]">
            T
          </div>
          <h1 className="text-xl font-semibold">Criar conta</h1>
        </div>

        {done ? (
          <p className="text-sm text-[var(--color-text)]">
            Conta criada! Verifique seu email para confirmar (se a confirmação estiver ativada no seu
            projeto Supabase) e depois{' '}
            <Link to="/login" className="font-medium text-[var(--color-accent)]">
              faça login
            </Link>
            .
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="text-sm font-medium">
                Senha
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>

              {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
              >
                {submitting ? 'Criando…' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
              Já tem conta?{' '}
              <Link to="/login" className="font-medium text-[var(--color-accent)]">
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
