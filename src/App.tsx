import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AdSenseScript from '@/components/ads/AdSenseScript'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
import HomePage from '@/pages/HomePage'
import GamePage from '@/pages/GamePage'
import GuidePage from '@/pages/GuidePage'
import NotFoundPage from '@/pages/NotFoundPage'
import PoliciesPage from '@/pages/PoliciesPage'

function App() {
  return (
    <BrowserRouter>
      <AdSenseScript />
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.12),rgba(2,6,23,0)_40%),radial-gradient(circle_at_84%_10%,rgba(14,165,233,0.14),rgba(2,6,23,0)_42%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
        <SiteHeader />

        <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}

export default App
