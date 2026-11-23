import { MapPin, Users, Leaf, ExternalLink } from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import { useTheme } from '../../contexts/ThemeContext'
import { isPostClaimedLocally } from '../../lib/formatters'

export default function FoodCard({ post, onClaim, onViewTicket }) {
  const { isDark } = useTheme()
  const localClaim = isPostClaimedLocally(post.id)
  const isAvailable = post.remaining_portions > 0

  return (
    <div className={`glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">🍱</span>
          </div>
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
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            oleh {post.profiles?.full_name || 'Donatur'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 font-semibold text-emerald-500">
            <Users size={12} />
            {post.remaining_portions}/{post.initial_portions} porsi
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate">
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
              isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-600 hover:text-teal-700'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={11} />
            Lihat di Google Maps
          </a>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          {localClaim ? (
            <button
              onClick={() => onViewTicket(post, localClaim)}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
            >
              Lihat Tiket Saya
            </button>
          ) : (
            <button
              onClick={() => onClaim(post)}
              disabled={!isAvailable}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isAvailable ? 'Ambil Porsi' : 'Stok Habis'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
