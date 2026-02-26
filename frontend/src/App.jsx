import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ItemDetail from './pages/ItemDetail'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import NotFound from './pages/NotFound'
import PageWrapper from './components/PageWrapper'
import ErrorBoundary from './components/ErrorBoundary'
import SplashScreen from './components/SplashScreen'

// ✅ ProtectedRoute
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
    </div>
  )

  return user ? children : <Navigate to="/" />
}

// ✅ Share handler
function SaveFromShare({ user }) {
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const url = params.get('url')
    const title = params.get('title')
    const text = params.get('text')
    if ((url || text) && user) {
      sessionStorage.setItem('sharedContent', JSON.stringify({ url, title, content: text }))
      window.location.href = '/dashboard?openSave=true'
    }
  }, [])

  return <Navigate to="/dashboard" />
}

// ✅ Main App
function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ✅ Show splash until BOTH splash animation is done AND auth is resolved
  const showApp = splashDone && !authLoading

  return (
    <ErrorBoundary>
      {/* Splash always mounts first, calls onDone after ~2s */}
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}

      {/* App renders underneath once both are ready */}
      {showApp && (
        <BrowserRouter>
          <Routes>
            <Route path="/"
              element={user ? <Navigate to="/dashboard" /> : <Landing />} />

            <Route path="/dashboard"
              element={user
                ? <PageWrapper><Dashboard user={user} /></PageWrapper>
                : <Navigate to="/" />} />

            <Route path="/item/:id"
              element={user ? <ItemDetail /> : <Navigate to="/" />} />

            <Route path="/profile"
              element={
                <ProtectedRoute>
                  <PageWrapper><Profile /></PageWrapper>
                </ProtectedRoute>
              } />

            <Route path="/analytics"
              element={user
                ? <PageWrapper><Analytics /></PageWrapper>
                : <Navigate to="/" />} />

            <Route path="/save"
              element={user ? <SaveFromShare user={user} /> : <Navigate to="/" />} />

            {/* ✅ 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      )}
    </ErrorBoundary>
  )
}

export default App