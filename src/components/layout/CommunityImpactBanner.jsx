import { TrendingUp, Leaf } from 'lucide-react'
import { formatWeightSaved } from '../../lib/formatters'

export default function CommunityImpactBanner({ totalPortions = 0 }) {
  return (
    <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Porsi Terselamatkan</p>
          <p className="text-2xl font-bold text-emerald-500">{totalPortions.toLocaleString('id-ID')}</p>
        </div>
      </div>
      <div className="w-px h-10 bg-slate-200 dark:bg-white/10 hidden sm:block" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
          <Leaf size={20} className="text-teal-500" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sampah Pangan Dicegah</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatWeightSaved(totalPortions)}</p>
        </div>
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-xs text-slate-400 dark:text-slate-500">Bersama kita selamatkan</p>
        <p className="text-xs font-semibold text-emerald-500">lebih banyak makanan 🍛</p>
      </div>
    </div>
  )
}
