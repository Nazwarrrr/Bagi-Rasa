import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import CountdownTimer from '../food/CountdownTimer'
import { Utensils, Users, Check, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DonorPostList({ onPostUpdated }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  async function fetchMyPosts() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('food_posts')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMyPosts()
  }, [user])

  async function handleClosePost(postId) {
    setActionId(postId)
    try {
      const { error } = await supabase
        .from('food_posts')
        .update({ status: 'completed', remaining_portions: 0 })
        .eq('id', postId)
        .eq('donor_id', user.id)

      if (error) throw error
      toast.success('Donasi ditandai selesai')
      fetchMyPosts()
      onPostUpdated?.()
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status')
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader size={24} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-10 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
        <Utensils size={36} className="mx-auto mb-2 text-slate-400 opacity-50" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Anda belum pernah memposting donasi makanan</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map(post => {
        const isLive = post.status === 'available' && post.remaining_portions > 0 && new Date(post.expires_at) > new Date()
        return (
          <div
            key={post.id}
            className={`glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
              isLive ? 'border-teal-500/30' : 'opacity-70 border-white/5'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isLive
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : post.status === 'completed'
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                    : 'bg-red-500/10 text-red-500 border border-red-500/30'
                }`}>
                  {isLive ? 'AKTIF' : post.status === 'completed' ? 'SELESAI' : 'KEDALUWARSA'}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {post.category}
                </span>
                {post.is_halal && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    HALAL
                  </span>
                )}
              </div>

              <h4 className="font-bold text-base leading-tight">{post.title}</h4>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
                  <Users size={12} />
                  Sisa {post.remaining_portions} dari {post.initial_portions} porsi
                </span>
                {isLive && (
                  <span>
                    Batas: <CountdownTimer expiresAt={post.expires_at} compact />
                  </span>
                )}
              </div>
            </div>

            {isLive && (
              <button
                onClick={() => handleClosePost(post.id)}
                disabled={actionId === post.id}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-slate-600 dark:text-slate-300"
              >
                {actionId === post.id ? 'Memproses...' : 'Tandai Selesai'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
