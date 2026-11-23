import { useState } from 'react'
import { X, User, Phone, ChefHat, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { isValidIndonesianPhone, normalizeWhatsApp, saveClaimLocally } from '../../lib/formatters'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function ClaimModal({ post, onClose, onSuccess }) {
  const { isDark } = useTheme()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [portions, setPortions] = useState(1)
  const [loading, setLoading] = useState(false)

  const maxPortions = Math.min(2, post.remaining_portions)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Nama lengkap wajib diisi')
    if (!isValidIndonesianPhone(phone)) return toast.error('Nomor WhatsApp tidak valid (contoh: 081234567890)')

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('claim_food_portion', {
        p_post_id: post.id,
        p_claimer_name: name.trim(),
        p_claimer_whatsapp: normalizeWhatsApp(phone),
        p_portions: portions,
      })
      if (error) throw error

      const claimData = {
        claim_id: data.claim_id,
        pickup_code: data.pickup_code,
        portions_claimed: data.portions_claimed,
        claimer_name: name.trim(),
        claimer_whatsapp: normalizeWhatsApp(phone),
        post_title: post.title,
        donor_whatsapp: post.profiles?.whatsapp_number,
        maps_url: post.maps_url,
      }
      saveClaimLocally(post.id, claimData)
      toast.success('Klaim berhasil! Tiket digital siap.')
      onSuccess(claimData)
    } catch (err) {
      toast.error(err.message || 'Gagal mengklaim. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl theme-transition ${
        isDark ? 'bg-[#0F172A] border border-white/10' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg">Klaim Makanan</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{post.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-teal-500/40 ${
                  isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nomor WhatsApp Aktif</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="08xx-xxxx-xxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-teal-500/40 ${
                  isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Portions */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Jumlah Porsi</label>
            <div className="flex gap-3">
              {[1, 2].map(p => (
                <button
                  key={p}
                  type="button"
                  disabled={p > maxPortions}
                  onClick={() => setPortions(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    portions === p
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : isDark ? 'border-white/10 hover:border-white/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p} Porsi
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <AlertCircle size={11} />
              Maks. 2 porsi per perangkat per postingan
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 mt-1"
          >
            {loading ? 'Memproses...' : 'Konfirmasi Klaim'}
          </button>
        </form>
      </div>
    </div>
  )
}
