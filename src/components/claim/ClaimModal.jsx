import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Loader, MapPin, Phone, User, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { isValidIndonesianPhone, normalizeWhatsApp } from '../../lib/formatters'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ClaimModal({ post, onClose, onSuccess }) {
  const { isDark } = useTheme()
  const { user, profile, updateProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.whatsapp_number || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [portions, setPortions] = useState(1)
  const [loading, setLoading] = useState(false)
  const maxPortions = Math.min(2, post.remaining_portions)
  const needsProfile = !profile?.full_name || !profile?.whatsapp_number || !profile?.district

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    if (!name.trim()) return toast.error('Nama lengkap wajib diisi')
    if (!isValidIndonesianPhone(phone)) return toast.error('Nomor WhatsApp tidak valid (contoh: 081234567890)')
    if (!district.trim()) return toast.error('Kecamatan wajib diisi')

    setLoading(true)
    try {
      const whatsapp = normalizeWhatsApp(phone)
      if (needsProfile || profile.full_name !== name.trim() || profile.whatsapp_number !== whatsapp || profile.district !== district.trim()) {
        const { error: profileError } = await updateProfile({
          full_name: name.trim(),
          whatsapp_number: whatsapp,
          district: district.trim(),
        })
        if (profileError) throw profileError
      }

      const { data, error } = await supabase.rpc('claim_food_portion', {
        p_post_id: post.id,
        p_claimer_name: name.trim(),
        p_claimer_whatsapp: whatsapp,
        p_portions: portions,
      })
      if (error) throw error

      const claimData = {
        claim_id: data.claim_id,
        pickup_code: data.pickup_code,
        portions_claimed: data.portions_claimed,
        claimer_name: name.trim(),
        claimer_whatsapp: whatsapp,
        post_title: post.title,
        donor_name: data.donor_name,
        donor_whatsapp: data.donor_whatsapp,
        maps_url: post.maps_url,
      }
      toast.success('Klaim berhasil! Tiket digital siap.')
      onSuccess(claimData)
    } catch (err) {
      toast.error(err.message || 'Gagal mengklaim. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-teal-500/40 ${
    isDark ? 'border-white/10 bg-white/5 text-white placeholder-slate-500' : 'border-slate-200 bg-slate-50'
  }`

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <motion.section role="dialog" aria-modal="true" aria-labelledby="claim-title"
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/90' : 'border-slate-200/80 bg-white/95'}`}
        initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="claim-title" className="text-lg font-bold">Klaim Makanan</h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-600 dark:text-slate-300">{post.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        {!user ? (
          <div className="rounded-xl bg-teal-500/5 p-4 text-center">
            <p className="text-sm font-semibold">Masuk atau daftar untuk mengklaim makanan</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Tiket dan riwayat klaim tersimpan di akun Anda.</p>
            <Link to="/login" onClick={onClose} className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white">Masuk / Daftar</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {needsProfile && <p className="flex items-start gap-2 rounded-xl bg-teal-500/10 p-3 text-xs text-teal-800 dark:text-emerald-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />Lengkapi profil sebelum klaim. Data ini juga digunakan untuk menghubungi Anda terkait pengambilan.</p>}
            <label className="block text-sm font-semibold">Nama lengkap
              <span className="relative mt-1.5 block"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" /><input autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Nama lengkap" required /></span>
            </label>
            <label className="block text-sm font-semibold">Nomor WhatsApp
              <span className="relative mt-1.5 block"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" /><input autoComplete="tel" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="08xx-xxxx-xxxx" required /></span>
            </label>
            <label className="block text-sm font-semibold">Kecamatan
              <span className="relative mt-1.5 block"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" /><input value={district} onChange={e => setDistrict(e.target.value)} className={inputCls} placeholder="Kecamatan Anda" required /></span>
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Jumlah porsi</label>
              <div className="flex gap-3">
                {[1, 2].map(amount => <button key={amount} type="button" disabled={amount > maxPortions} onClick={() => setPortions(amount)}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${portions === amount ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' : 'border-slate-200 dark:border-white/10'}`}>{amount} porsi</button>)}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><AlertCircle size={11} />Maksimal dua porsi per donasi</p>
            </div>
            <button type="submit" disabled={loading} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 font-bold text-white transition hover:brightness-105 disabled:opacity-60">
              {loading && <Loader size={16} className="animate-spin" />}{loading ? 'Memproses...' : 'Konfirmasi Klaim'}
            </button>
          </form>
        )}
      </motion.section>
    </motion.div>
  )
}
