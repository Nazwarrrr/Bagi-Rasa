import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HandHeart, Loader, Medal, Star, Trophy, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import Reveal from '../components/motion/Reveal'

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy size={18} className="text-[#F59E0B]" />
  if (rank === 2) return <Medal size={18} className="text-slate-500 dark:text-slate-300" />
  if (rank === 3) return <Medal size={18} className="text-teal-600 dark:text-teal-300" />
  return <span className="w-[18px] text-center text-sm font-bold text-slate-600 dark:text-slate-300">{rank}</span>
}

export default function LeaderboardPage() {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('donors')
  const [data, setData] = useState({ donors: [], heroes: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchLeaders() {
      const [donors, heroes] = await Promise.all([
        supabase.from('donor_leaderboard').select('*').limit(10),
        supabase.from('hero_leaderboard').select('*').limit(10),
      ])
      if (!active) return
      if (donors.error) toast.error(`Gagal memuat peringkat donatur: ${donors.error.message}`)
      if (heroes.error) toast.error(`Gagal memuat peringkat warga: ${heroes.error.message}`)
      setData({ donors: donors.data || [], heroes: heroes.data || [] })
      setLoading(false)
    }
    fetchLeaders()
    return () => { active = false }
  }, [])

  const leaders = activeTab === 'donors' ? data.donors : data.heroes
  const scoreLabel = activeTab === 'donors' ? 'porsi' : 'poin'
  const scoreField = activeTab === 'donors' ? 'total_portions_saved' : 'rescue_points'
  const tabs = [
    { key: 'donors', label: 'Donatur Dermawan', icon: HandHeart },
    { key: 'heroes', label: 'Warga Food Hero', icon: Star },
  ]

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <Reveal className="glass-card relative mb-10 overflow-hidden rounded-3xl p-8 text-center sm:p-11">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-[#92EEFF]/25 blur-3xl dark:bg-teal-500/10" />
        <div className="relative mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 shadow-lg shadow-teal-600/20">
          <Trophy size={28} className="text-white" />
        </div>
        <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-emerald-300">Kebaikan yang dirayakan</p>
        <h1 className="relative mt-2 text-3xl font-black tracking-tight sm:text-4xl">Papan Apresiasi</h1>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">Merayakan warga yang mengubah berbagi menjadi aksi nyata.</p>
      </Reveal>

      <div className={`mb-8 flex gap-2 rounded-2xl border p-1.5 backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/70'}`} role="tablist">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${activeTab === key ? 'text-teal-800 dark:text-emerald-300' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {activeTab === key && <motion.span layoutId="leader-tab" className="absolute inset-0 -z-0 rounded-xl border border-[#92EEFF]/40 bg-[#92EEFF]/35 dark:bg-teal-500/20" />}
            <Icon size={15} className="relative z-10" /><span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader size={28} className="animate-spin text-teal-500" /></div> : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {leaders.length === 0 ? (
              <div className="py-16 text-center text-slate-600 dark:text-slate-300"><Star size={40} className="mx-auto mb-3 opacity-30" /><p>Belum ada data peringkat</p></div>
            ) : (
              <>
                <div className="mb-7 grid grid-cols-3 items-end gap-3">
                  {[1, 0, 2].map((position, podiumIndex) => {
                    const leader = leaders[position]
                    if (!leader) return <div key={podiumIndex} />
                    const rank = position + 1
                    const height = rank === 1 ? 'h-36' : 'h-28'
                    return (
                      <motion.div key={leader.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIndex * 0.1 }}
                        className={`glass-card ${height} flex flex-col items-center justify-end rounded-3xl p-3 text-center ${rank === 1 ? 'border-[#F59E0B]/50' : ''}`}>
                        <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${rank === 1 ? 'bg-[#F59E0B]/20 text-amber-700 dark:text-amber-300' : 'bg-teal-500/10 text-teal-600 dark:text-teal-300'}`}>
                          {(leader.full_name || '?')[0].toUpperCase()}
                        </div>
                        <RankIcon rank={rank} />
                        <p className="mt-1 max-w-full truncate text-xs font-bold">{leader.full_name || 'Komunitas'}</p>
                        <p className="text-[11px] font-semibold text-emerald-500">{leader[scoreField] || 0} {scoreLabel}</p>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-4">
                  {leaders.map((leader, index) => {
                    const rank = index + 1
                    return (
                      <motion.div key={leader.id || index} layout className={`glass-card flex items-center gap-4 rounded-3xl p-5 ${rank === 1 ? 'ring-1 ring-[#F59E0B]/50' : ''}`}>
                        <div className="flex w-10 shrink-0 items-center justify-center"><RankIcon rank={rank} /></div>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{(leader.full_name || '?')[0].toUpperCase()}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{leader.full_name || 'Komunitas'}</p><p className="text-xs text-slate-600 dark:text-slate-300">{leader.district || '—'}</p></div>
                        <div className="shrink-0 text-right"><p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{leader[scoreField] || 0}</p><p className="flex items-center justify-end gap-1 text-xs text-slate-600 dark:text-slate-300"><Users size={10} />{scoreLabel}</p></div>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-300">Peringkat donatur dan warga bertambah setelah pengambilan terverifikasi.</p>
    </main>
  )
}
