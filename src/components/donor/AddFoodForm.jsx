import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../lib/supabaseClient'
import { calculateExpiresAt } from '../../lib/formatters'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Image, Loader, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Makanan Berat', 'Roti & Kue', 'Bahan Masak']
const DURATIONS = [
  { label: '2 jam', value: 2 },
  { label: '3 jam', value: 3 },
  { label: '4 jam', value: 4 },
]

export default function AddFoodForm({ onSuccess }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [form, setForm] = useState({
    title: '', category: 'Makanan Berat', is_halal: true,
    initial_portions: 4, duration: 2,
    pickup_address: '', maps_url: '',
  })

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      })
      setImageFile(compressed)
      setImagePreview(URL.createObjectURL(compressed))
      toast.success(`Foto dikompres: ${(compressed.size / 1024).toFixed(0)} KB`)
    } catch {
      toast.error('Gagal memproses foto')
    } finally {
      setCompressing(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Judul wajib diisi')
    if (!form.pickup_address.trim()) return toast.error('Alamat pengambilan wajib diisi')

    setLoading(true)
    try {
      let image_url = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      const { error } = await supabase.from('food_posts').insert({
        donor_id: user.id,
        title: form.title.trim(),
        category: form.category,
        is_halal: form.is_halal,
        initial_portions: form.initial_portions,
        remaining_portions: form.initial_portions,
        pickup_address: form.pickup_address.trim(),
        maps_url: form.maps_url.trim() || null,
        image_url,
        expires_at: calculateExpiresAt(form.duration),
        status: 'available',
      })
      if (error) throw error

      toast.success('Donasi berhasil diposting!')
      setForm({ title: '', category: 'Makanan Berat', is_halal: true, initial_portions: 4, duration: 2, pickup_address: '', maps_url: '' })
      setImageFile(null)
      setImagePreview(null)
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Gagal memposting donasi')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-teal-500/40 transition-all ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'
  }`
  const labelCls = 'block text-sm font-semibold mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className={labelCls}>Judul Makanan</label>
        <input type="text" placeholder="cth. Nasi Gudeg + Ayam Sisa Event" value={form.title}
          onChange={e => handleChange('title', e.target.value)} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className={labelCls}>Kategori</label>
          <select value={form.category} onChange={e => handleChange('category', e.target.value)} className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Portions */}
        <div>
          <label className={labelCls}>Jumlah Porsi</label>
          <input type="number" min={1} max={50} value={form.initial_portions}
            onChange={e => handleChange('initial_portions', parseInt(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className={labelCls}>Batas Waktu Aman Konsumsi</label>
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button key={d.value} type="button" onClick={() => handleChange('duration', d.value)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                form.duration === d.value
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Halal toggle */}
      <div className="flex items-center justify-between">
        <label className={labelCls + ' mb-0'}>Status Halal</label>
        <button type="button" onClick={() => handleChange('is_halal', !form.is_halal)}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.is_halal ? 'bg-emerald-500' : isDark ? 'bg-white/20' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_halal ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>Patokan Alamat Pengambilan</label>
        <input type="text" placeholder="cth. Depan Alfamart Jl. Ciledug No.12" value={form.pickup_address}
          onChange={e => handleChange('pickup_address', e.target.value)} className={inputCls} />
      </div>

      {/* Maps URL */}
      <div>
        <label className={labelCls}>Link Google Maps (opsional)</label>
        <input type="url" placeholder="https://maps.app.goo.gl/..." value={form.maps_url}
          onChange={e => handleChange('maps_url', e.target.value)} className={inputCls} />
      </div>

      {/* Photo */}
      <div>
        <label className={labelCls}>Foto Makanan (opsional)</label>
        <label className={`flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          isDark ? 'border-white/20 hover:border-teal-500/50' : 'border-slate-200 hover:border-teal-400'
        }`}>
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="h-full w-full object-cover rounded-xl" />
          ) : compressing ? (
            <Loader size={24} className="animate-spin text-teal-500" />
          ) : (
            <>
              <Image size={24} className="text-slate-400" />
              <span className="text-xs text-slate-400">Klik untuk unggah foto</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
        <p className="text-xs text-slate-400 mt-1">Dikompres otomatis maks. 250 KB</p>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Loader size={16} className="animate-spin" /> Memposting...</> : <><CheckCircle size={16} /> Posting Donasi</>}
      </button>
    </form>
  )
}
