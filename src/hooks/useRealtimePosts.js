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
      let query = supabase
        .from('food_posts')
        .select(`
          *,
          profiles:donor_id!inner (
            full_name,
            whatsapp_number,
            district
          )
        `)
        .eq('status', 'available')
        .gt('remaining_portions', 0)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (filters.district && filters.district !== 'all') {
        query = query.eq('profiles.district', filters.district)
      }
      if (filters.category && filters.category !== 'Semua') {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%`)
      }

      const { data, error: err } = await query
      if (err) throw err
      setPosts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.district, filters.category, filters.search])

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
