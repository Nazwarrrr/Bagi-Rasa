import { motion } from 'framer-motion'
import { Clock, MapPin, X } from 'lucide-react'
import CountdownTimer from './CountdownTimer'

export default function FoodDetailModal({ post, onClose, onClaim }) {
  if (!post) return null

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-detail-title"
        className="glass-card w-full max-w-lg overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      >
        <div className="relative h-52 bg-slate-100 dark:bg-slate-800">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-300">Foto belum tersedia</div>
          )}
          <button type="button" onClick={onClose} aria-label="Tutup detail"
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">{post.category}{post.is_halal ? ' · Halal' : ''}</p>
              <h2 id="food-detail-title" className="mt-1 text-xl font-bold">{post.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Donatur: {post.profiles?.full_name || 'Komunitas'}{post.profiles?.district ? ` · ${post.profiles.district}` : ''}
              </p>
            </div>
            <CountdownTimer expiresAt={post.expires_at} />
          </div>
          {post.description && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{post.description}</p>}
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MapPin size={16} className="mt-0.5 shrink-0 text-teal-500" />
            <span>{post.pickup_address}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Clock size={14} /> Sisa {post.remaining_portions} dari {post.initial_portions} porsi
            </span>
            {post.maps_url && (
              <a href={post.maps_url} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-white/10 dark:text-teal-300 dark:hover:bg-white/5">
                Buka Google Maps
              </a>
            )}
          </div>
          <button type="button" onClick={() => onClaim(post)}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 font-bold text-white transition hover:brightness-105 active:scale-[0.99]">
            Klaim Porsi
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}
