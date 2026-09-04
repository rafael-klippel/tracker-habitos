import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Hoje', icon: '✅' },
  { to: '/habits', label: 'Hábitos', icon: '📋' },
  { to: '/stats', label: 'Estatísticas', icon: '📈' },
  { to: '/export', label: 'Análise IA', icon: '🧠' },
  { to: '/settings', label: 'Ajustes', icon: '⚙️' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)] md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] font-bold text-[var(--color-accent-contrast)]">
            T
          </div>
          <span className="text-lg font-semibold">Tracker</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
          <p className="mb-2 truncate" title={user?.email ?? ''}>
            {user?.email}
          </p>
          <button
            onClick={() => signOut()}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-2)]"
          >
            Sair
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-contrast)]">
            T
          </div>
          <span className="font-semibold">Tracker</span>
        </div>
        <button onClick={() => signOut()} className="text-sm text-[var(--color-text-muted)]">
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
