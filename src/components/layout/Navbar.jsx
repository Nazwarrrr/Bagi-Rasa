import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Trophy, LayoutDashboard, LogIn, LogOut, ChefHat } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  return (
    <nav className={`sticky top-0 z-50 theme-transition ${
      isDark
        ? 'bg-[#090D16]/80 border-white/10'
        : 'bg-white/80 border-slate-200'
    } border-b backdrop-blur-xl`}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={16} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            BagiRasa
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/leaderboard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Trophy size={15} />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <LayoutDashboard size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                }`}
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90 transition-opacity"
            >
              <ChefHat size={15} />
              <span>Donatur</span>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
