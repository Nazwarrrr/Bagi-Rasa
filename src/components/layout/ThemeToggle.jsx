import { Sun, Moon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
        isDark
          ? 'border-white/10 bg-white/10 text-[#92EEFF] hover:bg-white/20'
          : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-100'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={isDark ? 'sun' : 'moon'} initial={{ opacity: 0, rotate: -90, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.7 }} transition={{ duration: 0.2 }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
