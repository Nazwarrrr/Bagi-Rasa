import { HandHeart, Leaf, PackageCheck, Users } from 'lucide-react'
import AnimatedCounter from '../motion/AnimatedCounter'
import Reveal from '../motion/Reveal'

export default function CommunityImpactBanner({ totalPortions = 0, donorCount = 0, heroCount = 0 }) {
  const stats = [
    { label: 'Porsi terselamatkan', value: totalPortions, icon: PackageCheck, suffix: '' },
    { label: 'Sampah dicegah', value: Math.round(totalPortions * 0.4 * 10) / 10, icon: Leaf, suffix: ' kg' },
    { label: 'Mitra donatur', value: donorCount, icon: HandHeart, suffix: '' },
    { label: 'Warga penyelamat', value: heroCount, icon: Users, suffix: '' },
  ]

  return (
    <Reveal>
      <section aria-label="Dampak komunitas" className="impact-bar rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
        <div className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Dampak bersama</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Setiap porsi menyumbang perubahan nyata.</p>
          </div>
          <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> Data komunitas
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, suffix }) => (
            <div key={label} className="flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 transition-colors hover:border-teal-500/40 dark:border-white/5 dark:bg-white/[0.03] sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-emerald-400">
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-lg font-extrabold leading-tight tracking-tight text-teal-700 dark:text-emerald-400 sm:text-2xl">
                  <AnimatedCounter value={value} suffix={suffix} />
                </p>
                <p className="mt-1 whitespace-normal text-[11px] font-medium leading-snug text-slate-600 dark:text-slate-300 sm:text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  )
}
