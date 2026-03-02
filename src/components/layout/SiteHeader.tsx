import { Link, NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: '홈', to: '/' },
  { label: '게임', to: '/game' },
  { label: '가이드', to: '/guide' },
  { label: '정책', to: '/policies' },
]

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/70 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="title-font text-xl font-black tracking-[0.16em] text-cyan-300">
          ZETRUN
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-300',
                  isActive && 'bg-slate-800 text-cyan-300',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link to="/game">레이스 시작</Link>
        </Button>
      </div>

      <nav className="mx-auto flex w-full max-w-7xl items-center gap-1 px-4 pb-3 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={`mobile-${item.to}`}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex-1 rounded-md py-2 text-center text-xs font-semibold text-slate-300 transition-colors',
                isActive ? 'bg-slate-800 text-cyan-300' : 'bg-slate-900/60',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default SiteHeader
