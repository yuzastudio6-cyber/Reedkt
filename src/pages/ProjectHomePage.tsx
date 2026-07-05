import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { NewEditSessionCreatePanel } from '../components/projects/NewEditSessionCreatePanel'
import { ProjectEditSessionCardGrid } from '../components/projects/ProjectEditSessionCardGrid'
import { ProjectEditSessionDetailPanel } from '../components/projects/ProjectEditSessionDetailPanel'
import { ProjectHomeHeader } from '../components/projects/ProjectHomeHeader'
import {
  createProjectBackendLocalConfig,
  readProjectBackendLocal,
} from '../lib/project-backend-local'
import type { NewEditSessionCreateResult } from '../lib/project-edit-session-create-flow-ui-adapter'
import {
  createProjectEditSessionProjectHomeClient,
  loadProjectEditSessionHomeDetail,
  loadProjectEditSessionProjectHomeModel,
  MOCK_PROJECT_HOME_PROJECT_ID,
  type ProjectEditSessionHomeCardViewModel,
  type ProjectEditSessionHomeDetailViewModel,
  type ProjectEditSessionProjectHomeModel,
} from '../lib/project-edit-session-project-home-ui-adapter'

export function ProjectHomePage() {
  const params = useParams<{ projectId: string }>()
  const location = useLocation()
  const projectId = params.projectId ?? MOCK_PROJECT_HOME_PROJECT_ID
  const projectConfig = useMemo(() => createProjectBackendLocalConfig(import.meta.env), [])
  const apiClient = useMemo(() => createProjectEditSessionProjectHomeClient(projectId), [projectId])
  const [homeModel, setHomeModel] = useState<ProjectEditSessionProjectHomeModel | undefined>()
  const [projectTitleReadback, setProjectTitleReadback] = useState<{ projectId: string; title: string } | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<ProjectEditSessionHomeDetailViewModel | undefined>()
  const [createPanelOpen, setCreatePanelOpen] = useState(() => new URLSearchParams(location.search).get('newEdit') === '1')

  useEffect(() => {
    let cancelled = false

    loadProjectEditSessionProjectHomeModel(projectId, apiClient).then((model) => {
      if (cancelled) return
      setHomeModel(model)
      setSelectedId(model.cardModels[0]?.id)
    })

    if (projectConfig.available && projectConfig.apiBaseUrl) {
      readProjectBackendLocal({
        apiBaseUrl: projectConfig.apiBaseUrl,
        projectId,
      }).then((result) => {
        if (cancelled) return
        setProjectTitleReadback({
          projectId,
          title: result.project.name,
        })
      }).catch(() => {
        // Keep the deterministic local project title when backend-local readback is unavailable.
      })
    }

    return () => {
      cancelled = true
    }
  }, [apiClient, projectConfig.apiBaseUrl, projectConfig.available, projectId])

  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    loadProjectEditSessionHomeDetail(selectedId, apiClient).then((model) => {
      if (cancelled) return
      setDetail(model)
    })

    return () => {
      cancelled = true
    }
  }, [apiClient, selectedId])

  const cards = homeModel?.cardModels ?? []
  const selectedCard = cards.find((card) => card.id === selectedId)
  const selectedDetail = detail?.editSessionId === selectedId ? detail : undefined
  const detailLoading = Boolean(selectedId && !selectedDetail)
  const projectTitle = projectTitleReadback?.projectId === projectId
    ? projectTitleReadback.title
    : homeModel?.projectTitle

  function handleSelect(cardId: string) {
    if (cardId === selectedId) return
    setDetail(undefined)
    setSelectedId(cardId)
  }

  function handleNewEditClick() {
    setCreatePanelOpen((current) => !current)
  }

  async function handleNewEditCreated(result: NewEditSessionCreateResult) {
    if (!result.session) return

    const refreshedModel = await loadProjectEditSessionProjectHomeModel(projectId, apiClient)
    setHomeModel(refreshedModel)
    setSelectedId(result.session.id)
    const createdDetail = await loadProjectEditSessionHomeDetail(result.session.id, apiClient)
    setDetail(createdDetail)
  }

  return (
    <AppShell
      description="Create edits inside this project, then open an edit to upload video, write the brief, review the plan, and preview results."
      eyebrow="Project"
      primaryAction={false}
      title="Project"
    >
      <section className="project-edit-session-home" data-testid="project-edit-session-home">
        <ProjectHomeHeader
          cardCount={cards.length}
          context="Create an edit for each video you want ReEditPro to work on."
          onNewEditClick={handleNewEditClick}
          projectTitle={projectTitle ?? 'Project Home'}
        />

        <NewEditSessionCreatePanel
          client={apiClient}
          onCancel={() => setCreatePanelOpen(false)}
          onCreated={handleNewEditCreated}
          open={createPanelOpen}
          projectId={projectId}
        />

        <div className="project-edit-session-home__layout">
          <section aria-label="Edit cards" className="project-edit-session-home__cards">
            <div className="project-edit-session-section-heading">
              <span className="section-eyebrow">Edits</span>
              <h2>Edits in this project</h2>
              <p>Select an edit to review its setup, or open it to continue with upload, brief, chat, preview, and review.</p>
            </div>
            <ProjectEditSessionCardGrid cards={cards} onSelect={handleSelect} selectedId={selectedId} />
          </section>

          <ProjectEditSessionDetailPanel card={selectedCard as ProjectEditSessionHomeCardViewModel | undefined} detail={selectedDetail} loading={detailLoading} />
        </div>
      </section>
    </AppShell>
  )
}
