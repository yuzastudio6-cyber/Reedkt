import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const BrandKitPage = lazy(() => import('./pages/BrandKitPage').then((module) => ({ default: module.BrandKitPage })))
const CreateProjectPage = lazy(() => import('./pages/CreateProjectPage').then((module) => ({ default: module.CreateProjectPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then((module) => ({ default: module.EditorPage })))
const ExportQueuePage = lazy(() => import('./pages/ExportQueuePage').then((module) => ({ default: module.ExportQueuePage })))
const InternalTestingPage = lazy(() => import('./pages/InternalTestingPage').then((module) => ({ default: module.InternalTestingPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })))
const PricingPage = lazy(() => import('./pages/PricingPage').then((module) => ({ default: module.PricingPage })))
const ProjectHomePage = lazy(() => import('./pages/ProjectHomePage').then((module) => ({ default: module.ProjectHomePage })))
const ProjectEditSessionChatPage = lazy(() => import('./pages/ProjectEditSessionChatPage').then((module) => ({ default: module.ProjectEditSessionChatPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const WalletPage = lazy(() => import('./pages/WalletPage').then((module) => ({ default: module.WalletPage })))

function RouteLoadingFallback() {
  return (
    <div aria-label="Loading ReeditPro workspace" aria-live="polite" className="route-loading-shell" role="status">
      <div className="route-loading-card">
        <span aria-hidden="true" className="route-loading-mark" />
        <div>
          <strong>Loading ReeditPro</strong>
          <p>Preparing the workspace without starting generation.</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectHomePage />} />
        <Route path="/projects/:projectId/edits/:editSessionId" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/chat" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/brief" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/history" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/versions" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/preview" element={<ProjectEditSessionChatPage />} />
        <Route path="/projects/:projectId/edits/:editSessionId/details" element={<ProjectEditSessionChatPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/brand-kit" element={<BrandKitPage />} />
        <Route path="/exports" element={<ExportQueuePage />} />
        <Route path="/internal-testing" element={<InternalTestingPage />} />
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="/create" element={<Navigate to="/projects/new" replace />} />
        <Route path="/upload" element={<Navigate to="/projects/new" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
