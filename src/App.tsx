import { Navigate, Route, Routes } from 'react-router-dom'
import { BrandKitPage } from './pages/BrandKitPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { ExportQueuePage } from './pages/ExportQueuePage'
import { LandingPage } from './pages/LandingPage'
import { PricingPage } from './pages/PricingPage'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { WalletPage } from './pages/WalletPage'
import { E2ERuntimeStatusMarker } from './components/E2ERuntimeStatusMarker'

export default function App() {
  return (
    <>
      <E2ERuntimeStatusMarker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/brand-kit" element={<BrandKitPage />} />
        <Route path="/exports" element={<ExportQueuePage />} />
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="/upload" element={<Navigate to="/projects/new" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
