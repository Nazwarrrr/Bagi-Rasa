import { Clock } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'

export default function CountdownTimer({ expiresAt, compact = false }) {
  const { formatted, isExpired, isUrgent } = useCountdown(expiresAt)

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg">
        <Clock size={12} />
        Kedaluwarsa
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-lg ${
      isUrgent
        ? 'bg-[#F59E0B]/15 text-amber-700 urgency-pulse dark:bg-[#F59E0B]/10 dark:text-amber-300'
        : 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10'
    }`}>
      <Clock size={12} className={isUrgent ? 'text-[#F59E0B]' : 'text-teal-500'} />
      {compact ? formatted.slice(0, 5) : formatted}
    </span>
  )
}
