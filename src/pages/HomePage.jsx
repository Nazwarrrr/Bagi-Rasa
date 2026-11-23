import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, Clock3, HeartHandshake, Leaf, MapPin, ShieldCheck, Sparkles, Soup, Wheat } from 'lucide-react'
import { useRealtimePosts } from '../hooks/useRealtimePosts'
import { supabase } from '../lib/supabaseClient'
import CommunityImpactBanner from '../components/layout/CommunityImpactBanner'
import FilterBar from '../components/food/FilterBar'
import FoodCard from '../components/food/FoodCard'
import FoodDetailModal from '../components/food/FoodDetailModal'
import ClaimModal from '../components/claim/ClaimModal'
import DigitalTicketModal from '../components/claim/DigitalTicketModal'
import Reveal from '../components/motion/Reveal'
import { Loader, PackageOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = [
  { title: 'Donatur berbagi', text: 'Mitra memposting makanan berlebih yang masih aman dikonsumsi.', icon: HeartHandshake },
  { title: 'Warga mengklaim', text: 'Pilih makanan dan jumlah porsi yang bisa diambil.', icon: ArrowDown },
  { title: 'Tunjukkan kode', text: 'Gunakan tiket digital berkode unik saat tiba di lokasi.', icon: MapPin },
  { title: 'Pangan terselamatkan', text: 'Donatur memverifikasi pengambilan dan komunitas mendapat dampak.', icon: ShieldCheck },
]

const FAQS = [
  { question: 'Siapa yang boleh mengambil makanan?', answer: 'Warga yang memiliki akun BagiRasa dan profil lengkap dapat mengklaim maksimal dua porsi per donasi.' },
  { question: 'Bagaimana menjaga keamanan pangan?', answer: 'Donatur mencantumkan batas waktu pengambilan yang singkat. Pastikan makanan diambil sebelum hitung mundur berakhir dan ikuti informasi penyimpanan dari donatur.' },
  { question: 'Apakah mengambil makanan dikenakan biaya?', answer: 'Tidak. BagiRasa menghubungkan makanan layak konsumsi yang dibagikan komunitas secara cuma-cuma.' },
  { question: 'Bagaimana jika saya tidak bisa mengambil pesanan?', answer: 'Batalkan klaim sesegera mungkin melalui dashboard agar stok dapat tersedia kembali untuk warga lain.' },
]

const FOOD_CATEGORIES = [
  { title: 'Hidangan siap santap', category: 'Makanan Berat', image: '/images/food-share-hero.webp', icon: Soup },
  { title: 'Sayur & bahan segar', category: 'Bahan Masak', image: '/images/fresh-bowl.webp', icon: Leaf },
  { title: 'Roti & kudapan', category: 'Roti & Kue', image: '/images/shared-bread.webp', icon: Wheat },
]

export default function HomePage() {
  const [filters, setFilters] = useState({ search: '', district: 'all', category: 'Semua', sort: 'newest' })
  const [districts, setDistricts] = useState([])
  const [impact, setImpact] = useState({ totalPortions: 0, donorCount: 0, heroCount: 0 })
  const [claimTarget, setClaimTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [ticketData, setTicketData] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)
  const { posts, loading, error } = useRealtimePosts(filters)

  const handleFilterChange = useCallback(patch => {
    setFilters(prev => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    let active = true
    async function loadLandingData() {
      const [districtResult, profileResult] = await Promise.all([
        supabase.from('active_districts').select('district'),
        supabase.from('community_impact').select('total_portions, donor_count, hero_count').single(),
      ])
      if (!active) return
      if (districtResult.error) toast.error(`Gagal memuat kecamatan: ${districtResult.error.message}`)
      else setDistricts(districtResult.data || [])
      if (profileResult.error) {
        toast.error(`Gagal memuat statistik komunitas: ${profileResult.error.message}`)
        return
      }
      setImpact({
        totalPortions: profileResult.data.total_portions || 0,
        donorCount: profileResult.data.donor_count || 0,
        heroCount: profileResult.data.hero_count || 0,
      })
    }
    loadLandingData()
    return () => { active = false }
  }, [])

  function handleClaim(post) {
    setDetailTarget(null)
    setClaimTarget(post)
  }

  function handleClaimSuccess(claimData) {
    setClaimTarget(null)
    setTicketData(claimData)
  }

  return (
    <main className="home-page relative isolate">
      <section className="home-shell home-hero relative isolate mx-auto mt-4 max-w-7xl overflow-hidden rounded-[26px] border border-white/90 bg-white/75 bg-gradient-to-br from-white/95 via-teal-50/40 to-[#92EEFF]/25 shadow-[0_20px_50px_rgba(13,148,136,0.08)] backdrop-blur-xl sm:mt-6 sm:rounded-[32px] dark:border-white/10 dark:bg-slate-900/65 dark:from-slate-900/90 dark:via-teal-950/35 dark:to-cyan-950/20 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-14 lg:py-16">
          <motion.div initial="hidden" animate="show" variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}>
            <motion.div variants={heroItem} className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-700/15 bg-white/65 px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm backdrop-blur dark:bg-slate-900/70 dark:text-teal-300">
              <Sparkles size={14} /> Gerakan berbagi pangan di sekitar kita
            </motion.div>
            <motion.h1 variants={heroItem} className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Makanan baik,
              <span className="block text-teal-600 dark:text-emerald-400">jangan sampai terbuang.</span>
            </motion.h1>
            <motion.p variants={heroItem} className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              BagiRasa mempertemukan makanan layak konsumsi dengan warga sekitar. Bagikan yang berlebih, kurangi yang terbuang, dan tumbuhkan kepedulian bersama.
            </motion.p>
            <motion.div variants={heroItem} className="mt-7 flex flex-wrap items-center gap-3.5 sm:flex-nowrap">
              <motion.a href="#catalog" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-teal-600 px-5 py-3 font-bold text-white shadow-lg shadow-teal-600/20 transition-colors hover:bg-teal-700 sm:w-auto">
                Jelajahi Makanan <ArrowRight size={17} />
              </motion.a>
              <motion.div className="w-full sm:w-auto" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white/90 px-5 py-3 font-bold text-slate-700 backdrop-blur transition-colors hover:border-teal-500/50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 sm:w-auto">
                  Mulai Donasi <HeartHandshake size={17} />
                </Link>
              </motion.div>
            </motion.div>
            <motion.div variants={heroItem} className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheck size={15} className="text-teal-600 dark:text-teal-400" /> Klaim memakai akun dan kode pengambilan unik
            </motion.div>
          </motion.div>

          <Reveal className="relative mx-auto w-full max-w-xl" delay={0.2}>
            <motion.div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10"
              whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
              <div className="relative aspect-[1.08/1] overflow-hidden sm:aspect-[1.18/1]">
                <img
                  src={posts[0]?.image_url || '/images/food-share-hero.webp'}
                  alt={posts[0]?.image_url ? `Makanan donasi: ${posts[0].title}` : 'Hidangan beragam yang dibagikan untuk komunitas'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-slate-950/10" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/25 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md sm:left-5 sm:top-5">
                  <Leaf size={14} /> Pangan baik, manfaat nyata
                </div>
                <div className="absolute bottom-28 left-5 right-5 text-white sm:bottom-5 sm:left-7 sm:right-60">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                    {posts[0] ? 'Donasi komunitas' : 'Berbagi dimulai dari sekitar'}
                  </p>
                  <p className="mt-2 max-w-md text-xl font-extrabold leading-tight sm:text-3xl">
                    {posts[0]?.title || 'Satu hidangan, banyak kebaikan.'}
                  </p>
                  {posts[0] && <p className="mt-2 flex items-center gap-1.5 text-sm text-white/85"><MapPin size={14} /> {posts[0].profiles?.district || 'Di sekitar Anda'}</p>}
                </div>
                {posts[0] && (
                  <motion.div className="absolute right-4 top-4 rounded-2xl border border-white/50 bg-white/90 px-3 py-2 text-center shadow-lg backdrop-blur sm:right-5 sm:top-5"
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <span className="block text-lg font-black leading-none text-teal-700">{posts[0].remaining_portions}</span>
                    <span className="mt-1 block text-[10px] font-bold text-slate-600">porsi tersedia</span>
                  </motion.div>
                )}
                <motion.div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-3 py-2.5 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-100 sm:px-4"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700/10 text-teal-700 dark:text-teal-300"><HeartHandshake size={16} /></span>
                  Dari warga, untuk warga
                </motion.div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      <div className="home-shell mx-auto mt-8 max-w-7xl space-y-20 px-4 pb-20 sm:mt-10 sm:px-6">
        <CommunityImpactBanner {...impact} />

        <section aria-labelledby="food-highlights-title">
          <Reveal className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Beragam, tetap berarti</p>
              <h2 id="food-highlights-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Berbagi dalam banyak rasa</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">Pilih kategori untuk melihat donasi yang tersedia di sekitar Anda.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {FOOD_CATEGORIES.map(({ title, category, image, icon: Icon }, index) => (
              <Reveal key={category} delay={index * 0.07}>
                <motion.button type="button" whileHover={{ y: -4 }} whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    handleFilterChange({ category })
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="group relative block aspect-[1.5/1] w-full overflow-hidden rounded-3xl text-left shadow-md shadow-slate-900/5 focus-visible:outline-teal-600">
                  <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur"><Icon size={17} /></span>
                  <span className="absolute bottom-4 left-4 right-4">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Lihat kategori</span>
                    <span className="mt-1 block text-lg font-extrabold text-white">{title}</span>
                  </span>
                </motion.button>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24">
          <Reveal className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Mudah dan bermakna</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Cara kerja BagiRasa</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">Empat langkah sederhana untuk menghubungkan makanan berlebih dengan warga yang membutuhkan.</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, text, icon: Icon }, index) => (
              <Reveal key={title} delay={index * 0.08}>
                <article className="glass-card relative h-full rounded-3xl p-6">
                  <span className="absolute right-4 top-4 text-xs font-black text-teal-600/50 dark:text-teal-300/50">0{index + 1}</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400"><Icon size={20} /></div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="glass-card mt-5 flex items-start gap-3 rounded-3xl p-5">
            <Clock3 size={19} className="mt-0.5 shrink-0 text-teal-600 dark:text-emerald-400" />
            <div><p className="text-sm font-bold">Utamakan keamanan pangan</p><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Ambil makanan sebelum batas waktu aman yang dicantumkan donatur (2–4 jam). Periksa kondisi makanan sebelum dikonsumsi.</p></div>
          </Reveal>
        </section>

        <section id="catalog" className="scroll-mt-24">
          <Reveal className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Dari tetangga untuk tetangga</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Katalog makanan</h2>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">Donasi aktif di sekitar Anda</span>
          </Reveal>
          <FilterBar filters={filters} onChange={handleFilterChange} districts={districts} />

          {loading && <div className="flex justify-center py-16"><Loader size={28} className="animate-spin text-teal-500" /></div>}
          {error && <p role="alert" className="py-10 text-center text-sm text-red-500">Gagal memuat data: {error}</p>}
          {!loading && !error && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <PackageOpen size={48} className="text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada donasi makanan aktif</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Coba ubah filter atau periksa lagi nanti.</p>
            </div>
          )}
          {!loading && posts.length > 0 && (
            <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {posts.map(post => (
                  <motion.div key={post.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}>
                    <FoodCard post={post} onClaim={handleClaim} onDetails={setDetailTarget} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <section id="faq" className="scroll-mt-24">
          <Reveal className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Yang sering ditanyakan</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Tanya jawab</h2>
          </Reveal>
          <div className="mx-auto max-w-3xl space-y-4">
            {FAQS.map(({ question, answer }, index) => (
              <Reveal key={question} delay={index * 0.04}>
                <div className="glass-card overflow-hidden rounded-3xl">
                  <button type="button" className="flex w-full items-center justify-between gap-4 p-4 text-left font-semibold"
                    aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    {question}<span className="text-xl text-teal-600">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{answer}</p>
                    </motion.div>}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
          <footer className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 pt-7 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div><p className="font-black text-teal-700 dark:text-emerald-400">BagiRasa</p><p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300">Bagikan rezeki, selamatkan makanan. Gerakan komunitas untuk mengurangi pangan layak konsumsi yang terbuang.</p></div>
              <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <a href="#catalog" className="hover:text-teal-600">Katalog</a><a href="#how-it-works" className="hover:text-teal-600">Cara kerja</a><Link to="/leaderboard" className="hover:text-teal-600">Leaderboard</Link><a href="#faq" className="hover:text-teal-600">FAQ</a>
              </nav>
            </div>
            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-300">© {new Date().getFullYear()} BagiRasa · Bersama selamatkan makanan.</p>
          </footer>
        </Reveal>
      </div>

      <AnimatePresence>
        {detailTarget && <FoodDetailModal post={detailTarget} onClose={() => setDetailTarget(null)} onClaim={handleClaim} />}
      </AnimatePresence>
      <AnimatePresence>
        {claimTarget && <ClaimModal post={claimTarget} onClose={() => setClaimTarget(null)} onSuccess={handleClaimSuccess} />}
      </AnimatePresence>
      <AnimatePresence>
        {ticketData && <DigitalTicketModal claimData={ticketData} onClose={() => setTicketData(null)} />}
      </AnimatePresence>
    </main>
  )
}

const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
