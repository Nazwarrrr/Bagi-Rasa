import { useEffect, useState } from 'react'
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion'
import { useRef } from 'react'

export default function AnimatedCounter({ value = 0, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 'some' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => Math.round(latest).toLocaleString('id-ID'))
  const [display, setDisplay] = useState('0')

  useEffect(() => rounded.on('change', setDisplay), [rounded])

  useEffect(() => {
    if (!inView) return
    count.set(0)
    const controls = animate(count, Number(value) || 0, { duration: 1.4, ease: 'easeOut' })
    return () => controls.stop()
  }, [count, inView, value])

  return <span ref={ref}><motion.span>{display}</motion.span>{suffix}</span>
}
