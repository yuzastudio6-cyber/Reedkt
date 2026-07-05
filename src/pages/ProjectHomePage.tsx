import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { NewEditSessionCreatePanel } from '../components/projects/NewEditSessionCreatePanel'
import { ProjectEditSessionAccessPolicyNotice } from '../components/projects/ProjectEditSessionAccessPolicyNotice'
import { ProjectEditSessionCardGrid } from '../components/projects/ProjectEditSessionCardGrid'
import { ProjectEditSessionDetailPanel } from '../components/projects/ProjectEditSessionDetailPanel'
import { ProjectHomeHeader } from '../components/projects/ProjectHomeHeader'
import { NewEditSessionPlaceholder } from '../components/projects/NewEditSessionPlaceholder'
import type { NewEditSessionCreateResult } from '../lib/project-edit-session-create-flow-ui-adapter'
import { createProjectEditSessionPath } from '../lib/project-edit-session-navigation'
import {
  createProjectEditSessionProjectHomeClient,
  createNewEditSessionPlaceholderModel,
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
  const apiClient = useMemo(() => createProjectEditSessionProjectHomeClient(projectId), [projectId])
  const placeholderModel = useMemo(() => createNewEditSessionPlaceholderModel(), [])
  const [homeModel, setHomeModel] = useState<ProjectEditSessionProjectHomeModel | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<ProjectEditSessionHomeDetailViewModel | undefined>()
  const [createPanelOpen, setCreatePanelOpen] = useState(() => new URLSearchParams(location.search).get('newEdit') === '1')
  const [lastCreateResult, setLastCreateResult] = useState<NewEditSessionCreateResult | undefined>()

  useEffect(() => {
    let cancelled = false

    loadProjectEditSessionProjectHomeModel(projectId, apiClient).then((model) => {
      if (cancelled) return
      setHomeModel(model)
      setSelectedId(model.cardModels[0]?.id)
      setLastCreateResult(undefined)
    })

    return () => {
      cancelled = true
    }
  }, [apiClient, projectId])

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

  function handleSelect(cardId: string) {
    if (cardId === selectedId) return
    setDetail(undefined)
    setSelectedId(cardId)
  }

  function handleNewEditClick() {
    setCreatePanelOpen((current) => !current)
  }

  async function handleNewEditCreated(result: NewEditSessionCreateResult) {
    setLastCreateResult(result)
    if (!result.session) return

    const refreshedModel = await loadProjectEditSessionProjectHomeModel(projectId, apiClient)
    setHomeModel(refreshedModel)
    setSelectedId(result.session.id)
    const createdDetail = await loadProjectEditSessionHomeDetail(result.session.id, apiClient)
    setDetail(createdDetail)
  }

  return (
    <AppShell
      description="Review mock/local persistent Edit Chats for a project without starting editor routing, generation, rendering, or credits."
      eyebrow="Project Edit Sessions"
      title="Project Home"
    >
      <section className="project-edit-session-home" data-testid="project-edit-session-home">
        <ProjectHomeHeader
          cardCount={cards.length}
          context={homeModel?.projectContext ?? 'Loading mock Project Edit Session cards.'}
          onNewEditClick={handleNewEditClick}
          projectId={projectId}
          projectTitle={homeModel?.projectTitle ?? 'Project Home'}
        />

        <ProjectEditSessionAccessPolicyNotice projectId={projectId} />

        <NewEditSessionPlaceholder
          lastCreatedName={lastCreateResult?.session?.name}
          lastCreatedRoute={lastCreateResult?.session ? createProjectEditSessionPath(projectId, lastCreateResult.session.id) : undefined}
          model={placeholderModel}
          onToggle={handleNewEditClick}
          visible={createPanelOpen}
        />

        <NewEditSessionCreatePanel
          client={apiClient}
          onCancel={() => setCreatePanelOpen(false)}
          onCreated={handleNewEditCreated}
          open={createPanelOpen}
          projectId={projectId}
        />

        <div className="project-edit-session-home__layout">
          <section aria-label="Edit Chat cards" className="project-edit-session-home__cards">
            <div className="project-edit-session-section-heading">
              <span className="section-eyebrow">Edit Chats</span>
              <h2>Persistent editing conversations</h2>
              <p>Cards are fixture-backed mock API client projections. Selecting a card updates this page; Open Edit Chat enters the mock workspace.</p>
            </div>
            <ProjectEditSessionCardGrid cards={cards} onSelect={handleSelect} selectedId={selectedId} />
          </section>

          <ProjectEditSessionDetailPanel card={selectedCard as ProjectEditSessionHomeCardViewModel | undefined} detail={selectedDetail} loading={detailLoading} />
        </div>
      </section>
    </AppShell>
  )
}
