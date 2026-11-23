import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import AddFoodForm from '../components/donor/AddFoodForm'
import ClaimQueueList from '../components/donor/ClaimQueueList'
import DonorPostList from '../components/donor/DonorPostList'
import { User, Phone, MapPin, PlusCircle, Inbox, Utensils, Loader, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

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
    setLoading(true)
    const { error } = await updateProfile({ full_name: fullName, whatsapp_number: whatsapp, district })
    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success('Profil berhasil disimpan!'); onDone?.() }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className={`glass-card rounded-2xl p-6`}>
        <h2 className="font-bold text-lg mb-1">Lengkapi Profil Donatur</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Profil diperlukan sebelum Anda bisa memposting donasi makanan.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={e => setFullName(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" placeholder="Nomor WhatsApp (08xx...)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
  const [activeTab, setActiveTab] = useState('post') // 'post' | 'queue' | 'my_posts'
  const [refreshKey, setRefreshKey] = useState(0)

  if (!profile?.whatsapp_number || !profile?.district) {
    return <ProfileSetupForm onDone={refetchProfile} />
  }

  const tabCls = (t) => `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
    activeTab === t
      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow'
      : isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
  }`

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Halo, {profile.full_name}! 👋</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {profile.district} · {profile.total_portions_saved || 0} porsi terselamatkan
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 p-1 rounded-2xl mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
        <button className={tabCls('post')} onClick={() => setActiveTab('post')}>
          <PlusCircle size={15} /> Posting Donasi
        </button>
        <button className={tabCls('queue')} onClick={() => setActiveTab('queue')}>
          <Inbox size={15} /> Antrean Klaim
        </button>
        <button className={tabCls('my_posts')} onClick={() => setActiveTab('my_posts')}>
          <Utensils size={15} /> Donasi Saya
        </button>
      </div>

      {/* Panel */}
      <div className="glass-card rounded-2xl p-6">
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
      </div>
    </main>
  )
}
