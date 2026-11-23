import { X, MapPin, MessageCircle, Ticket, CheckCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '../../lib/formatters'
import { useTheme } from '../../contexts/ThemeContext'

export default function DigitalTicketModal({ claimData, onClose }) {
  const { isDark } = useTheme()
  const {
    pickup_code, portions_claimed, claimer_name, post_title,
    donor_whatsapp, maps_url,
    claimer_whatsapp
  } = claimData

  const waUrl = donor_whatsapp
    ? buildWhatsAppUrl(donor_whatsapp, {
        claimerName: claimer_name,
        pickupCode: pickup_code,
        foodTitle: post_title,
        portions: portions_claimed,
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl theme-transition ${
        isDark ? 'bg-[#0F172A] border border-white/10' : 'bg-white'
      }`}>
        {/* Success header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-5 text-white text-center">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <CheckCircle size={28} className="text-white" />
            </div>
          </div>
          <p className="font-bold text-lg">Klaim Berhasil!</p>
          <p className="text-sm opacity-80 mt-0.5">Tunjukkan tiket ini ke donatur</p>
        </div>

        {/* Ticket body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Pickup Code */}
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-center gap-1">
              <Ticket size={12} />
              KODE AMBIL
            </p>
            <p className="text-4xl font-black tracking-widest text-teal-500 font-mono">
              {pickup_code}
            </p>
          </div>

          {/* Details */}
          <div className={`rounded-xl p-4 text-sm space-y-2 ${
            isDark ? 'bg-white/5' : 'bg-slate-50'
          }`}>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Nama</span>
              <span className="font-semibold">{claimer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Makanan</span>
              <span className="font-semibold text-right max-w-[180px] leading-tight">{post_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Jumlah</span>
              <span className="font-semibold">{portions_claimed} porsi</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {maps_url && (
              <a
                href={maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <MapPin size={15} />
                Buka Rute Google Maps
              </a>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <MessageCircle size={15} />
                Chat WhatsApp Donatur
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
