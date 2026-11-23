import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import { Trophy, Medal, Star, Loader, Users } from 'lucide-react'

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy size={18} className="text-yellow-400" />
  if (rank === 2) return <Medal size={18} className="text-slate-400" />
  if (rank === 3) return <Medal size={18} className="text-amber-600" />
  return <span className="text-sm font-bold text-slate-400 w-[18px] text-center">{rank}</span>
}

export default function LeaderboardPage() {
  const { isDark } = useTheme()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('donor_leaderboard')
      .select('*')
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setLeaders(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 items-center justify-center mb-4 shadow-lg">
          <Trophy size={28} className="text-white" />
        </div>
        <h1 className="font-black text-3xl">Papan Apresiasi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Top 10 donatur paling dermawan — dihitung dari porsi yang sudah terverifikasi diambil
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size={28} className="animate-spin text-teal-500" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada data donatur</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {leaders.map((leader, i) => {
            const rank = i + 1
            return (
              <div
                key={leader.id || i}
                className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all ${
                  rank <= 3 ? 'ring-1 ring-amber-300/40 dark:ring-amber-500/20' : ''
                }`}
              >
                <div className="w-10 flex items-center justify-center shrink-0">
                  <RankIcon rank={rank} />
                </div>

                {/* Avatar initial */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  rank === 1 ? 'bg-yellow-400/20 text-yellow-500'
                  : rank === 2 ? 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  : rank === 3 ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600'
                  : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {(leader.full_name || '?')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{leader.full_name || 'Donatur Anonim'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{leader.district || '—'}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-lg text-emerald-500">{leader.total_portions_saved || 0}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                    <Users size={10} /> porsi
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8">
        Poin bertambah setelah donatur memverifikasi pengambilan di lokasi
      </p>
    </main>
  )
}
