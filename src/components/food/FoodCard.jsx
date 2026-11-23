import { MapPin, Users, ExternalLink } from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import { useTheme } from '../../contexts/ThemeContext'

export default function FoodCard({ post, onClaim, onDetails }) {
  const { isDark } = useTheme()
  const isAvailable = post.remaining_portions > 0

  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-900/5 dark:border-white/10 dark:bg-slate-900/75 ${
      !isAvailable ? 'opacity-50 pointer-events-none' : ''
    }`}>
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-600 dark:text-slate-300">Foto belum tersedia</div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {post.is_halal && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
              HALAL
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-white/20 text-white' : 'bg-black/30 text-white'
          }`}>
            {post.category}
          </span>
        </div>
        {/* Countdown top-right */}
        <div className="absolute top-2 right-2">
          <CountdownTimer expiresAt={post.expires_at} compact />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-base leading-tight line-clamp-2">{post.title}</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            oleh {post.profiles?.full_name || 'Donatur'}
            {post.profiles?.district && <span> · {post.profiles.district}</span>}
          </p>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300">
            <span>Sisa porsi</span><span>{post.remaining_portions} / {post.initial_portions}</span>
          </div>
          <div role="progressbar" aria-label="Sisa porsi makanan" aria-valuenow={post.remaining_portions} aria-valuemin={0} aria-valuemax={post.initial_portions}
            className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${Math.min(100, (post.remaining_portions / post.initial_portions) * 100)}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 font-semibold text-emerald-500">
            <Users size={12} />
            {post.remaining_portions}/{post.initial_portions} porsi
          </span>
          <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-300">
            <MapPin size={12} />
            <span className="truncate">{post.pickup_address}</span>
          </span>
        </div>

        {post.maps_url && (
          <a
            href={post.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              isDark ? 'text-teal-300 hover:text-emerald-300' : 'text-teal-700 hover:text-teal-800'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={11} />
            Lihat di Google Maps
          </a>
        )}

        {/* CTA */}
        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={() => onClaim(post)}
            disabled={!isAvailable}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAvailable ? 'Klaim Porsi' : 'Stok Habis'}
          </button>
          <button type="button" onClick={() => onDetails(post)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-500/50 hover:text-teal-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-emerald-300">
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  )
}
