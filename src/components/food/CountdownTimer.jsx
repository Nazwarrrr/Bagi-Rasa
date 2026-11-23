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
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 urgency-pulse'
        : 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10'
    }`}>
      <Clock size={12} className={isUrgent ? 'text-amber-500' : 'text-teal-500'} />
      {compact ? formatted.slice(0, 5) : formatted}
    </span>
  )
}
