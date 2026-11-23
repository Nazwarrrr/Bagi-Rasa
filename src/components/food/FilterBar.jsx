import { useState, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

const CATEGORIES = ['Semua', 'Makanan Berat', 'Roti & Kue', 'Bahan Masak']

export default function FilterBar({ filters, onChange, districts = [] }) {
  const { isDark } = useTheme()
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onChange({ search: searchTerm })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, filters.search, onChange])

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-teal-500/40 ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-slate-400'
      : 'bg-white/85 border-slate-200 text-slate-800 placeholder-slate-500'
  }`

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Cari makanan atau alamat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9 pr-8`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                onChange({ search: '' })
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* District dropdown */}
        <div className="relative">
          <select
            value={filters.district}
            onChange={e => onChange({ district: e.target.value })}
            className={`${inputCls} pr-8 appearance-none cursor-pointer min-w-[160px]`}
          >
            <option value="all">Semua Kecamatan</option>
            {districts.map(d => (
              <option key={d.district} value={d.district}>{d.district}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
        </div>
        <div className="relative">
          <select
            aria-label="Urutkan makanan"
            value={filters.sort || 'newest'}
            onChange={e => onChange({ sort: e.target.value })}
            className={`${inputCls} pr-8 appearance-none cursor-pointer min-w-[150px]`}
          >
            <option value="newest">Terbaru</option>
            <option value="expiring">Segera habis</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
        </div>
      </div>

      {/* Category tabs */}
      <div className={`flex gap-1 overflow-x-auto rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100/80'}`}>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat}
            type="button"
            onClick={() => onChange({ category: cat })}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filters.category === cat
                ? 'text-teal-800 dark:text-emerald-300'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {filters.category === cat && <motion.span layoutId="activeCategory" className="absolute inset-0 -z-0 rounded-lg border border-[#92EEFF]/40 bg-[#92EEFF]/35 shadow-sm dark:bg-teal-500/20" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative z-10">{cat}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
