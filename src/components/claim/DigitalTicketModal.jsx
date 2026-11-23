import { X, MapPin, MessageCircle, Ticket, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { buildWhatsAppUrl } from '../../lib/formatters'
import { useTheme } from '../../contexts/ThemeContext'

export default function DigitalTicketModal({ claimData, onClose }) {
  const { isDark } = useTheme()
  const {
    pickup_code, portions_claimed, claimer_name, post_title,
    donor_whatsapp, maps_url,
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94, rotateX: -4 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className={`w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl theme-transition ${
        isDark ? 'border border-white/10 bg-slate-900' : 'border border-slate-200/80 bg-white'
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
            <p className="mb-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Ticket size={12} />
              KODE AMBIL
            </p>
            <p className="text-4xl font-black tracking-widest text-teal-500 font-mono">
              #{pickup_code}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="rounded-xl bg-white p-2 shadow-sm" aria-label={`QR code tiket ${pickup_code}`}>
              <QRCodeSVG value={`BagiRasa:${pickup_code}`} size={104} level="M" />
            </div>
          </div>

          {/* Details */}
          <div className={`rounded-xl p-4 text-sm space-y-2 ${
            isDark ? 'bg-white/5' : 'bg-slate-50'
          }`}>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Nama</span>
              <span className="font-semibold">{claimer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Makanan</span>
              <span className="font-semibold text-right max-w-[180px] leading-tight">{post_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Jumlah</span>
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
                className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-700"
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
      </motion.div>
    </motion.div>
  )
}
