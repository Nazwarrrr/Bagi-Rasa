import { useState, useEffect, useCallback } from 'react'
import { formatCountdown } from '../lib/formatters'

/**
 * Returns { secondsLeft, formatted, isExpired, isUrgent (< 30 min) }
 */
export function useCountdown(expiresAt) {
  const getSecondsLeft = useCallback(() => {
    if (!expiresAt) return 0
    const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000)
    return Math.max(0, diff)
  }, [expiresAt])

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft)

  useEffect(() => {
    setSecondsLeft(getSecondsLeft())
    if (getSecondsLeft() === 0) return
    const interval = setInterval(() => {
      const s = getSecondsLeft()
      setSecondsLeft(s)
      if (s === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [getSecondsLeft])

  return {
    secondsLeft,
    formatted: formatCountdown(secondsLeft),
    isExpired: secondsLeft <= 0,
    isUrgent: secondsLeft > 0 && secondsLeft <= 30 * 60,
  }
}
