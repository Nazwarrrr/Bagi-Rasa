import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChefHat, Eye, EyeOff, HeartHandshake, Lock, Mail, ShieldCheck, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-teal-500/20 ${
    isDark ? 'border-white/10 bg-white/5 text-white placeholder-slate-400' : 'border-slate-200 bg-white/80 placeholder-slate-500'
  }`

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email || !password) return toast.error('Email dan password wajib diisi')
    if (password.length < 6) return toast.error('Password minimal 6 karakter')

    setLoading(true)
    const { error } = await (mode === 'login' ? signIn(email, password) : signUp(email, password))
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login credentials')) toast.error('Email atau password salah')
      else if (error.message.includes('already registered')) toast.error('Email sudah terdaftar, silakan masuk')
      else toast.error(error.message)
      return
    }

    if (mode === 'register') toast.success('Registrasi berhasil! Lengkapi profil untuk mulai berbagi.')
    else toast.success('Selamat datang kembali!')
    navigate('/dashboard')
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-8 h-64 w-64 rounded-full bg-[#92EEFF]/25 blur-3xl dark:bg-teal-500/10" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.85fr] lg:gap-16">
        <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}
          className="hidden px-2 py-8 lg:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/75 px-3 py-1.5 text-xs font-bold text-teal-700 backdrop-blur dark:bg-white/5 dark:text-emerald-300">
            <Sparkles size={14} /> Satu komunitas, banyak kebaikan
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.08] tracking-tight">
            Berbagi pangan,
            <span className="mt-1 block text-teal-600 dark:text-emerald-400">dimulai dari sini.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Masuk sebagai warga penyelamat atau donatur. Setiap porsi yang dibagikan membantu makanan layak konsumsi sampai ke tetangga.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="glass-card rounded-3xl p-5"><HeartHandshake size={20} className="text-teal-600 dark:text-emerald-400" /><p className="mt-3 text-sm font-bold">Berbagi dengan mudah</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Temukan atau bagikan makanan di sekitar.</p></div>
            <div className="glass-card rounded-3xl p-5"><ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" /><p className="mt-3 text-sm font-bold">Tiket terverifikasi</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Klaim aman dengan kode pengambilan unik.</p></div>
          </div>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-card mt-6 flex max-w-lg items-center gap-3 rounded-3xl p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white"><UtensilsCrossed size={19} /></div>
            <div><p className="text-sm font-bold">BagiRasa</p><p className="text-xs text-slate-600 dark:text-slate-300">Bagikan rezeki, selamatkan makanan.</p></div>
            <HeartHandshake className="ml-auto text-teal-500" size={20} />
          </motion.div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          className="glass-card mx-auto w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-teal-950/10 sm:p-9">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-teal-700 dark:text-slate-300 dark:hover:text-emerald-300">
            <ArrowLeft size={14} /> Kembali ke beranda
          </Link>
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
              <ChefHat size={22} />
            </div>
            <h2 className="text-2xl font-black">{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun BagiRasa'}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Akses tiket, donasi, dan riwayat berbagi Anda.</p>
          </div>

          <div className={`mb-5 flex rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} role="tablist">
            {['login', 'register'].map(tab => (
              <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-bold transition ${mode === tab ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {mode === tab && <motion.span layoutId="auth-mode" className="absolute inset-0 -z-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 shadow-md shadow-teal-500/20" />}
                <span className="relative z-10">{tab === 'login' ? 'Masuk' : 'Daftar'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form key={mode} onSubmit={handleSubmit} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Email
                <span className="relative mt-1.5 block"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                  <input required autoComplete="email" type="email" placeholder="nama@email.com" value={email} onChange={event => setEmail(event.target.value)} className={`${inputCls} pl-9`} />
                </span>
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Password
                <span className="relative mt-1.5 block"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                  <input required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={password} onChange={event => setPassword(event.target.value)} className={`${inputCls} pl-9 pr-11`} />
                  <button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword(value => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-teal-700 dark:text-slate-300 dark:hover:text-emerald-300">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              <button type="submit" disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-teal-700/20 transition hover:shadow-teal-600/35 disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Mohon tunggu...' : mode === 'login' ? 'Masuk ke akun' : 'Buat akun'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Dengan melanjutkan, Anda bergabung dalam gerakan berbagi pangan BagiRasa.
          </p>
        </motion.section>
      </div>
    </main>
  )
}
