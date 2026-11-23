import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Clock3, Loader, MapPin, MessageCircle, Ticket, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { buildWhatsAppUrl } from '../../lib/formatters'
import toast from 'react-hot-toast'

export default function MyClaimsList() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const fetchClaims = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('claims')
      .select('*, food_posts!inner(title, maps_url)')
      .eq('claimer_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error(`Gagal memuat riwayat klaim: ${error.message}`)
      setLoading(false)
      return
    }
    setClaims(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchClaims()
    const channel = supabase.channel(`my-claims-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `claimer_id=eq.${user.id}` }, fetchClaims)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchClaims, user.id])

  async function cancelClaim(claimId) {
    setActionId(claimId)
    try {
      const { error } = await supabase.rpc('cancel_claim', { p_claim_id: claimId })
      if (error) throw error
      toast.success('Klaim dibatalkan dan stok dikembalikan')
      await fetchClaims()
    } catch (error) {
      toast.error(error.message || 'Gagal membatalkan klaim')
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-teal-500" /></div>
  if (claims.length === 0) return <div className={`rounded-3xl py-10 text-center text-sm text-slate-600 dark:text-slate-300 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>Belum ada tiket atau riwayat klaim.</div>

  return (
    <div className="flex flex-col gap-3">
      {claims.map(claim => {
        const post = claim.food_posts
        const donor = { full_name: claim.donor_name, whatsapp_number: claim.donor_whatsapp }
        const active = claim.status === 'pending'
        const statusText = active ? 'MENUNGGU PENGAMBILAN' : claim.status === 'picked_up' ? 'SELESAI DIAMBIL' : 'DIBATALKAN'
        const waUrl = active && donor?.whatsapp_number ? buildWhatsAppUrl(donor.whatsapp_number, {
          claimerName: claim.claimer_name,
          pickupCode: claim.pickup_code,
          foodTitle: post.title,
          portions: claim.portions_claimed,
        }) : null
        return (
          <article key={claim.id} className="glass-card rounded-3xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-teal-500/10 text-teal-700 dark:text-emerald-300' : claim.status === 'picked_up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>
                  {active ? <Clock3 size={11} /> : <CheckCircle size={11} />}{statusText}
                </span>
                <h3 className="mt-2 font-bold">{post?.title}</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Donatur: {donor?.full_name || 'Komunitas'} · {claim.portions_claimed} porsi</p>
              </div>
              <div className="rounded-xl bg-teal-500/10 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">KODE AMBIL</p>
                <p className="font-mono text-lg font-black tracking-wider text-teal-600 dark:text-teal-300">{claim.pickup_code}</p>
              </div>
            </div>
            {active && <div className="mt-4 flex flex-wrap gap-2">
              {post?.maps_url && <a href={post.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10"><MapPin size={13} />Maps</a>}
              {waUrl && <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300"><MessageCircle size={13} />WhatsApp donatur</a>}
              <button type="button" onClick={() => cancelClaim(claim.id)} disabled={actionId === claim.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-50">
                {actionId === claim.id ? <Loader size={13} className="animate-spin" /> : <XCircle size={13} />}Batalkan klaim
              </button>
            </div>}
            {!active && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><Ticket size={12} /> Tiket {claim.pickup_code}</p>}
          </article>
        )
      })}
    </div>
  )
}
