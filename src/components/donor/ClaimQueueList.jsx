import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { CheckCircle, XCircle, Phone, Users, Ticket, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClaimQueueList() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchClaims = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        food_posts!inner (
          title,
          donor_id
        )
      `)
      .eq('food_posts.donor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) toast.error(`Gagal memuat antrean klaim: ${error.message}`)
    else setClaims(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchClaims()
    const channel = supabase.channel(`donor-claims-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, fetchClaims)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchClaims, user.id])

  async function handleConfirmPickup(claimId) {
    setActionLoading(claimId)
    try {
      const { error } = await supabase.rpc('confirm_pickup', { p_claim_id: claimId })
      if (error) throw error
      toast.success('Pengambilan terverifikasi!')
      fetchClaims()
    } catch (err) {
      toast.error(err.message || 'Gagal memverifikasi')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelClaim(claimId) {
    setActionLoading(claimId + '_cancel')
    try {
      const { error } = await supabase.rpc('cancel_claim', { p_claim_id: claimId })
      if (error) throw error
      toast.success('Klaim dibatalkan, stok dikembalikan')
      fetchClaims()
    } catch (err) {
      toast.error(err.message || 'Gagal membatalkan')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader size={24} className="animate-spin text-teal-500" />
    </div>
  )

  if (claims.length === 0) return (
    <div className={`rounded-3xl py-10 text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
      <p className="text-sm text-slate-600 dark:text-slate-300">Belum ada antrean klaim aktif</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {claims.map(claim => (
        <div key={claim.id} className="glass-card flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-1.5">
            <p className="font-bold text-sm">{claim.food_posts?.title}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                <Ticket size={12} />
                {claim.pickup_code}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {claim.portions_claimed} porsi
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{claim.claimer_name}</span>
              <a
                href={`https://wa.me/${claim.claimer_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-green-500 hover:underline"
              >
                <Phone size={12} />
                {claim.claimer_whatsapp}
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirmPickup(claim.id)}
              disabled={actionLoading === claim.id}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
            >
              {actionLoading === claim.id
                ? <Loader size={12} className="animate-spin" />
                : <CheckCircle size={12} />}
              Verifikasi
            </button>
            <button
              onClick={() => handleCancelClaim(claim.id)}
              disabled={actionLoading === claim.id + '_cancel'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-60"
            >
              {actionLoading === claim.id + '_cancel'
                ? <Loader size={12} className="animate-spin" />
                : <XCircle size={12} />}
              Batalkan
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
