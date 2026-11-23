import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-xl transition-all duration-300 ${
        isDark
          ? 'bg-white/10 hover:bg-white/20 text-yellow-300'
          : 'bg-black/5 hover:bg-black/10 text-slate-700'
      }`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
