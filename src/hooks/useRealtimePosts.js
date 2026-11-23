import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimePosts(filters = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let districtDonorIds = null
      if (filters.district && filters.district !== 'all') {
        const { data: districtProfiles, error: districtError } = await supabase
          .from('donor_profiles')
          .select('id')
          .eq('district', filters.district)
        if (districtError) throw districtError
        districtDonorIds = (districtProfiles || []).map(profile => profile.id)
        if (districtDonorIds.length === 0) {
          setPosts([])
          return
        }
      }

      let query = supabase
        .from('food_posts')
        .select('*')
        .eq('status', 'available')
        .gt('remaining_portions', 0)
        .gt('expires_at', new Date().toISOString())
        .order(filters.sort === 'expiring' ? 'expires_at' : 'created_at', { ascending: filters.sort === 'expiring' })

      if (districtDonorIds) query = query.in('donor_id', districtDonorIds)
      if (filters.category && filters.category !== 'Semua') {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%`)
      }

      const { data, error: err } = await query
      if (err) throw err
      if (!data?.length) {
        setPosts([])
        return
      }
      const { data: donorProfiles, error: profilesError } = await supabase
        .from('donor_profiles')
        .select('id, full_name, district, avatar_url')
        .in('id', [...new Set(data.map(post => post.donor_id))])
      if (profilesError) throw profilesError
      const profilesById = new Map((donorProfiles || []).map(profile => [profile.id, profile]))
      setPosts(data.map(post => ({ ...post, profiles: profilesById.get(post.donor_id) || null })))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.district, filters.category, filters.search, filters.sort])

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('food_posts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_posts' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setPosts(prev =>
              prev
                .map(p => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
                .filter(
                  p =>
                    p.status === 'available' &&
                    p.remaining_portions > 0 &&
                    new Date(p.expires_at) > new Date()
                )
            )
          } else if (payload.eventType === 'INSERT') {
            if (payload.new.status === 'available' && payload.new.remaining_portions > 0) {
              fetchPosts()
            }
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchPosts])

  return { posts, loading, error, refetch: fetchPosts }
}
