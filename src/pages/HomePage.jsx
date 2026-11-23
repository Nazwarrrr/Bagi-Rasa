import { useState } from 'react'
import { useRealtimePosts } from '../hooks/useRealtimePosts'
import { supabase } from '../lib/supabaseClient'
import { useEffect } from 'react'
import CommunityImpactBanner from '../components/layout/CommunityImpactBanner'
import FilterBar from '../components/food/FilterBar'
import FoodCard from '../components/food/FoodCard'
import ClaimModal from '../components/claim/ClaimModal'
import DigitalTicketModal from '../components/claim/DigitalTicketModal'
import { isPostClaimedLocally } from '../lib/formatters'
import { Loader, PackageOpen } from 'lucide-react'

export default function HomePage() {
  const [filters, setFilters] = useState({ search: '', district: 'all', category: 'Semua' })
  const [districts, setDistricts] = useState([])
  const [totalPortions, setTotalPortions] = useState(0)
  const [claimTarget, setClaimTarget] = useState(null)
  const [ticketData, setTicketData] = useState(null)

  const { posts, loading, error } = useRealtimePosts(filters)

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  useEffect(() => {
    // Fetch districts from view
    supabase.from('active_districts').select('district').then(({ data }) => {
      setDistricts(data || [])
    })
    // Fetch total portions saved
    supabase.from('profiles').select('total_portions_saved').then(({ data }) => {
      const total = (data || []).reduce((sum, p) => sum + (p.total_portions_saved || 0), 0)
      setTotalPortions(total)
    })
  }, [])

  function handleClaim(post) {
    setClaimTarget(post)
  }

  function handleViewTicket(post, localClaim) {
    setTicketData({
      ...localClaim,
      post_title: post.title,
      donor_whatsapp: post.profiles?.whatsapp_number || localClaim.donor_whatsapp,
      maps_url: post.maps_url || localClaim.maps_url,
    })
  }

  function handleClaimSuccess(claimData) {
    setClaimTarget(null)
    setTicketData(claimData)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <CommunityImpactBanner totalPortions={totalPortions} />
      <FilterBar filters={filters} onChange={handleFilterChange} districts={districts} />

      {loading && (
        <div className="flex justify-center py-16">
          <Loader size={28} className="animate-spin text-teal-500" />
        </div>
      )}

      {error && (
        <p className="text-center text-red-500 py-10 text-sm">Gagal memuat data: {error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <PackageOpen size={48} className="text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">Belum ada donasi makanan aktif</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Coba ubah filter atau periksa lagi nanti</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <FoodCard
              key={post.id}
              post={post}
              onClaim={handleClaim}
              onViewTicket={handleViewTicket}
            />
          ))}
        </div>
      )}

      {claimTarget && (
        <ClaimModal
          post={claimTarget}
          onClose={() => setClaimTarget(null)}
          onSuccess={handleClaimSuccess}
        />
      )}

      {ticketData && (
        <DigitalTicketModal
          claimData={ticketData}
          onClose={() => setTicketData(null)}
        />
      )}
    </main>
  )
}
