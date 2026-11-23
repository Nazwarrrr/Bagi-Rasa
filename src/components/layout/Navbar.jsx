import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChefHat,
  CircleHelp,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Trophy,
  Utensils,
  UtensilsCrossed,
  Workflow,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'

const NAV_LINKS = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/#catalog', label: 'Katalog', icon: Utensils },
  { to: '/#how-it-works', label: 'Cara kerja', icon: Workflow },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/#faq', label: 'FAQ', icon: CircleHelp },
]

function isActiveLink(to, pathname, hash) {
  if (to === '/') return pathname === '/' && !hash
  if (to.startsWith('/#')) return pathname === '/' && hash === to.slice(1)
  return pathname === to
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeClaims, setActiveClaims] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    if (location.pathname === '/' && location.hash) {
      const timeoutId = window.setTimeout(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 240)
      return () => window.clearTimeout(timeoutId)
    }
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!user) {
      setActiveClaims(0)
      return
    }

    async function fetchActiveClaims() {
      const { count, error } = await supabase.from('claims')
        .select('id', { count: 'exact', head: true })
        .eq('claimer_id', user.id)
        .eq('status', 'pending')
      if (error) toast.error(`Gagal memuat tiket aktif: ${error.message}`)
      else setActiveClaims(count || 0)
    }

    fetchActiveClaims()
    const channel = supabase.channel(`nav-claims-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `claimer_id=eq.${user.id}` }, fetchActiveClaims)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Berhasil keluar')
    navigate('/')
  }

  const navLinkClass = (active, compact = false) => `group flex items-center gap-2 rounded-xl font-semibold transition-colors ${
    compact ? 'px-3 py-3 text-sm' : 'px-3 py-2.5 text-xs'
  } ${active
    ? 'bg-teal-500/10 text-teal-700 dark:bg-teal-500/10 dark:text-emerald-300'
    : isDark
      ? 'text-slate-300 hover:bg-white/10 hover:text-white'
      : 'text-slate-600 hover:bg-teal-700/5 hover:text-teal-800'
  }`

  const renderNavLink = ({ to, label, icon: Icon }, compact = false) => {
    const active = isActiveLink(to, location.pathname, location.hash)
    return (
      <Link key={to} to={to} aria-current={active ? 'page' : undefined} onClick={() => setMenuOpen(false)} className={navLinkClass(active, compact)}>
        <Icon size={compact ? 17 : 15} strokeWidth={active ? 2.4 : 2} className="shrink-0 transition-transform group-hover:-translate-y-0.5" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl theme-transition ${
      isDark ? 'border-white/10 bg-[#090D16]/75' : 'border-slate-200/70 bg-white/75'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-[72px] items-center justify-between gap-3">
          <Link to="/" aria-label="BagiRasa — Beranda" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#10B981] text-white shadow-md shadow-teal-900/15 transition-transform group-hover:-rotate-3 group-hover:scale-105">
              <UtensilsCrossed size={19} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#0D9488] dark:text-[#92EEFF] sm:text-xl">BagiRasa</span>
          </Link>

          <div className={`hidden items-center gap-1 rounded-2xl border p-1 lg:flex ${
            isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/70 bg-slate-50/80'
          }`}>
            {NAV_LINKS.map(link => renderNavLink(link))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  aria-label={`Dashboard${activeClaims > 0 ? `, ${activeClaims} tiket aktif` : ''}`}
                  className={`relative flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors ${
                    isDark
                      ? 'border-white/10 text-slate-200 hover:bg-white/10'
                      : 'border-slate-200 bg-white/70 text-slate-700 hover:border-teal-600/30 hover:bg-teal-700/5'
                  }`}
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                  {activeClaims > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-extrabold text-white shadow-sm shadow-teal-600/20">{activeClaims}</span>}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition-colors sm:px-3 ${
                    isDark ? 'text-slate-300 hover:bg-red-500/15 hover:text-red-300' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#10B981] px-3.5 text-sm font-bold text-white shadow-md shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-lg sm:px-4"
              >
                <ChefHat size={16} />
                <span className="hidden sm:inline">Masuk / Daftar</span>
                <span className="sm:hidden">Masuk</span>
              </Link>
            )}

            <span className="hidden h-7 w-px bg-slate-200 dark:bg-white/10 sm:block" aria-hidden="true" />
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(open => !open)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors lg:hidden ${
                isDark ? 'border-white/10 text-slate-200 hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden lg:hidden"
            >
              <div className={`grid grid-cols-2 gap-2 border-t py-3 ${
                isDark ? 'border-white/10' : 'border-slate-200/80'
              }`}>
                {NAV_LINKS.map(link => renderNavLink(link, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
