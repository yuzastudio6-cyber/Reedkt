import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './web-shell/components/AppShell'
import { ArtifactLibraryPage } from './web-shell/pages/ArtifactLibraryPage'
import { ComputeRoutesPage } from './web-shell/pages/ComputeRoutesPage'
import { EditorWorkspacePage } from './web-shell/pages/EditorWorkspacePage'
import { JobQueuePage } from './web-shell/pages/JobQueuePage'
import { NotFoundPage } from './web-shell/pages/NotFoundPage'
import { ProjectDashboardPage } from './web-shell/pages/ProjectDashboardPage'
import { ProjectIntakePage } from './web-shell/pages/ProjectIntakePage'
import { SettingsPage } from './web-shell/pages/SettingsPage'
import { SystemReadinessPage } from './web-shell/pages/SystemReadinessPage'
import { WebHomePage } from './web-shell/pages/WebHomePage'
import { getProjectRoutePath, getWebShellRoute } from './web-shell/web-shell-routes'

function inShell(element: ReactElement) {
  return <AppShell>{element}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route path={getWebShellRoute('home').path} element={inShell(<WebHomePage />)} />
      <Route path={getWebShellRoute('projects').path} element={inShell(<ProjectDashboardPage />)} />
      <Route path={getWebShellRoute('project_intake').path} element={inShell(<ProjectIntakePage />)} />
      <Route path={getWebShellRoute('project_overview').path} element={inShell(<ProjectDashboardPage />)} />
      <Route path={getWebShellRoute('editor_workspace').path} element={inShell(<EditorWorkspacePage />)} />
      <Route path={getWebShellRoute('job_queue').path} element={inShell(<JobQueuePage />)} />
      <Route path={getWebShellRoute('artifact_library').path} element={inShell(<ArtifactLibraryPage />)} />
      <Route path={getWebShellRoute('system_readiness').path} element={inShell(<SystemReadinessPage />)} />
      <Route path={getWebShellRoute('compute_routes').path} element={inShell(<ComputeRoutesPage />)} />
      <Route path={getWebShellRoute('settings').path} element={inShell(<SettingsPage />)} />
      <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
      <Route path="/editor" element={<Navigate to={getProjectRoutePath('editor_workspace')} replace />} />
      <Route path="/exports" element={<Navigate to={getProjectRoutePath('artifact_library')} replace />} />
      <Route path="/app" element={<Navigate to="/" replace />} />
      <Route path="/upload" element={<Navigate to="/projects/new" replace />} />
      <Route path={getWebShellRoute('not_found').path} element={inShell(<NotFoundPage />)} />
    </Routes>
  )
}
