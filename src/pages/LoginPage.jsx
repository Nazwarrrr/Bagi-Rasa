import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { UtensilsCrossed, Mail, Lock, ChefHat, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-teal-500/40 transition-all ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'
  }`

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Email dan password wajib diisi')
    if (password.length < 6) return toast.error('Password minimal 6 karakter')

    setLoading(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email, password)
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email atau password salah')
      } else if (error.message.includes('already registered')) {
        toast.error('Email sudah terdaftar, silakan login')
      } else {
        toast.error(error.message)
      }
    } else {
      if (mode === 'register') {
        toast.success('Registrasi berhasil! Silakan lengkapi profil Anda.')
      } else {
        toast.success('Selamat datang kembali!')
      }
      navigate('/dashboard')
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 items-center justify-center mb-4 shadow-lg">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="font-bold text-2xl">Portal Donatur</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">BagiRasa — Bagikan Rezeki, Selamatkan Makanan</p>
        </div>

        {/* Tab toggle */}
        <div className={`flex p-1 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow'
                  : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {m === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email" placeholder="Email donatur" value={email}
              onChange={e => setEmail(e.target.value)} className={`${inputCls} pl-9`}
            />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password" placeholder="Password (min. 6 karakter)" value={password}
              onChange={e => setPassword(e.target.value)} className={`${inputCls} pl-9`}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
          >
            {loading
              ? <><Loader size={16} className="animate-spin" /> Memproses...</>
              : <><ChefHat size={16} /> {mode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Sekarang'}</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          <Link to="/" className="text-teal-500 hover:underline">Kembali ke Katalog Makanan</Link>
        </p>
      </div>
    </main>
  )
}
