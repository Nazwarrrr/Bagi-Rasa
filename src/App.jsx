import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LeaderboardPage from './pages/LeaderboardPage'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { isDark } = useTheme()
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-ambient relative isolate min-h-screen px-0 py-0 sm:px-4 sm:py-4 ${isDark ? 'dark bg-[#090D16] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <motion.div
            className={`absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full blur-3xl ${isDark ? 'bg-[#92EEFF]/10' : 'bg-[#92EEFF]/25'}`}
            animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute -right-36 top-[24%] h-[480px] w-[480px] rounded-full blur-3xl ${isDark ? 'bg-[#0D9488]/[0.12]' : 'bg-[#10B981]/[0.18]'}`}
            animate={{ y: [0, 20, 0], x: [0, -18, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute -bottom-48 left-[18%] h-[380px] w-[380px] rounded-full blur-3xl ${isDark ? 'bg-[#92EEFF]/[0.08]' : 'bg-[#92EEFF]/[0.18]'}`}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className={`app-panel relative z-10 mx-auto min-h-[calc(100vh-2rem)] max-w-[1440px] overflow-clip rounded-none shadow-2xl shadow-slate-900/10 backdrop-blur-sm sm:rounded-[28px] ${isDark ? 'bg-[#090D16]/55' : 'bg-white/35'}`}>
          <Navbar />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  )
}
