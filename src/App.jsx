import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LeaderboardPage from './pages/LeaderboardPage'

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
  return (
    <div className={`min-h-screen theme-transition ${isDark ? 'dark bg-[#090D16] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      <Navbar />
      <Routes>
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
    </div>
  )
}
