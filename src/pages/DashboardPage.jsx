import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import AddFoodForm from '../components/donor/AddFoodForm'
import ClaimQueueList from '../components/donor/ClaimQueueList'
import DonorPostList from '../components/donor/DonorPostList'
import MyClaimsList from '../components/claim/MyClaimsList'
import { User, Phone, MapPin, PlusCircle, Inbox, Utensils, Loader, CheckCircle, Ticket, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { isValidIndonesianPhone, normalizeWhatsApp } from '../lib/formatters'
import { AnimatePresence, motion } from 'framer-motion'

function ProfileSetupForm({ onDone }) {
  const { updateProfile } = useAuth()
  const { isDark } = useTheme()
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [district, setDistrict] = useState('')
  const [loading, setLoading] = useState(false)

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-teal-500/40 ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'
  }`

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || !whatsapp.trim() || !district.trim()) {
      return toast.error('Semua field wajib diisi')
    }
    if (!isValidIndonesianPhone(whatsapp)) return toast.error('Nomor WhatsApp tidak valid')
    setLoading(true)
    const { error } = await updateProfile({ full_name: fullName.trim(), whatsapp_number: normalizeWhatsApp(whatsapp), district: district.trim() })
    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success('Profil berhasil disimpan!'); onDone?.() }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="glass-card rounded-3xl p-6">
        <h2 className="font-bold text-lg mb-1">Lengkapi Profil</h2>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Profil diperlukan sebelum Anda bisa memposting donasi makanan.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
            <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={e => setFullName(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
            <input type="tel" placeholder="Nomor WhatsApp (08xx...)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
            <input type="text" placeholder="Nama Kecamatan (cth. Garut Kota)" value={district} onChange={e => setDistrict(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Simpan Profil
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, refetchProfile } = useAuth()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('claims')
  const [refreshKey, setRefreshKey] = useState(0)

  if (!profile?.full_name || !profile?.whatsapp_number || !profile?.district) {
    return <ProfileSetupForm onDone={refetchProfile} />
  }

  const tabCls = (t) => `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
    activeTab === t
      ? 'relative z-10 text-white'
      : isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
  }`

  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6 sm:py-12">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="glass-card relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#92EEFF]/25 blur-3xl dark:bg-teal-500/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-xl font-black text-white shadow-lg shadow-teal-700/20">
              {(profile.full_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-emerald-300"><Sparkles size={12} /> Ruang komunitas</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Halo, {profile.full_name}!</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.district} · Kelola berbagi dan pengambilan Anda.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
              <p className="text-xl font-black text-teal-700 dark:text-emerald-400">{profile.total_portions_saved || 0}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Porsi didonasikan</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{profile.rescue_points || 0}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Poin penyelamatan</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <div className={`mb-8 flex flex-wrap gap-3 rounded-2xl border p-1.5 backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/70'}`}>
        {[
          { key: 'claims', label: 'Tiket & Riwayat', icon: Ticket },
          { key: 'post', label: 'Posting Donasi', icon: PlusCircle },
          { key: 'queue', label: 'Antrean Klaim', icon: Inbox },
          { key: 'my_posts', label: 'Donasi Saya', icon: Utensils },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} className={tabCls(key)} onClick={() => setActiveTab(key)}>
            {activeTab === key && <motion.span layoutId="dashboard-tab" className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow" />}
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="glass-card rounded-3xl p-5 sm:p-7">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
        {activeTab === 'claims' && <MyClaimsList />}
        {activeTab === 'post' && (
          <AddFoodForm onSuccess={() => {
            setRefreshKey(k => k + 1)
            setActiveTab('my_posts')
          }} />
        )}
        {activeTab === 'queue' && (
          <ClaimQueueList key={refreshKey} />
        )}
        {activeTab === 'my_posts' && (
          <DonorPostList key={refreshKey} onPostUpdated={() => setRefreshKey(k => k + 1)} />
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
