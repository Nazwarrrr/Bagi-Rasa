import { useState, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
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
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
  }`

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Category tabs */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onChange({ category: cat })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filters.category === cat
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
