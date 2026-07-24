import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'

const CreateProjectPage = lazy(() => import('./pages/CreateProjectPage').then((module) => ({ default: module.CreateProjectPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const EditVideosPage = lazy(() => import('./pages/EditVideosPage').then((module) => ({ default: module.EditVideosPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then((module) => ({ default: module.EditorPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })))
const MotionStudioPage = lazy(() => import('./pages/MotionStudioPage').then((module) => ({ default: module.MotionStudioPage })))
const MotionStudioStorytellingLibraryPage = lazy(() => import('./pages/MotionStudioPage').then((module) => ({ default: module.MotionStudioStorytellingLibraryPage })))
const MotionStudioStorytellingWorkspacePage = lazy(() => import('./pages/MotionStudioStorytellingWorkspacePage').then((module) => ({ default: module.MotionStudioStorytellingWorkspacePage })))
const PreferencesPage = lazy(() => import('./pages/PreferencesPage').then((module) => ({ default: module.PreferencesPage })))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then((module) => ({ default: module.ProjectDetailPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const SignInPage = lazy(() => import('./pages/SignInPage').then((module) => ({ default: module.SignInPage })))

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

function RouteScrollReset() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function LegacyNamedEditRedirect({ view }: { view?: 'brief' }) {
  const { editSessionId, projectId } = useParams()

  if (!editSessionId || !projectId) {
    return <Navigate replace to="/projects" />
  }

  const editPath = `/projects/${encodeURIComponent(projectId)}/edits/${encodeURIComponent(editSessionId)}`
  return <Navigate replace to={view === 'brief' ? `${editPath}?view=brief` : editPath} />
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <RouteScrollReset />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/edit-videos" element={<EditVideosPage />} />
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/motion-studio" element={<MotionStudioPage />} />
          <Route path="/motion-studio/storytelling" element={<MotionStudioStorytellingLibraryPage />} />
          <Route
            path="/motion-studio/storytelling/projects/:projectId/edits/:editSessionId"
            element={<MotionStudioStorytellingWorkspacePage />}
          />
          <Route path="/projects/:projectId/edits/:editSessionId" element={<EditorPage />} />
          <Route path="/projects/:projectId/edits/:editSessionId/chat" element={<LegacyNamedEditRedirect />} />
          <Route path="/projects/:projectId/edits/:editSessionId/brief" element={<LegacyNamedEditRedirect view="brief" />} />
          <Route path="/projects/:projectId/edits/:editSessionId/history" element={<LegacyNamedEditRedirect />} />
          <Route path="/projects/:projectId/edits/:editSessionId/versions" element={<LegacyNamedEditRedirect />} />
          <Route path="/projects/:projectId/edits/:editSessionId/preview" element={<LegacyNamedEditRedirect />} />
          <Route path="/projects/:projectId/edits/:editSessionId/details" element={<LegacyNamedEditRedirect />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/edit-preferences" element={<Navigate to="/preferences" replace />} />
          <Route path="/settings" element={<Navigate to="/preferences" replace />} />
          <Route path="/wallet" element={<Navigate to="/preferences" replace />} />
          <Route path="/pricing" element={<Navigate to="/projects" replace />} />
          <Route path="/brand-kit" element={<Navigate to="/preferences" replace />} />
          <Route path="/exports" element={<Navigate to="/projects" replace />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/upload" element={<Navigate to="/projects/new" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
