import { ArrowRight, FolderKanban, Plus, Search, UploadCloud } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ProjectResourceState } from '../components/ProjectResourceState'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import {
  listLocalInternalProjectHandoffs,
  privateReviewMatchesCurrentSourceSet,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import {
  listLocalInternalProjectHandoffsFromBackendWithRetry,
  recoverLocalInternalProjectEditHandoffsFromBackend,
} from '../lib/internal-edit-state-backend-sync'
import {
  listLocalProjectRecords,
  saveLocalProjectRecord,
  type LocalProjectRecord,
} from '../lib/local-projects'
import {
  listLocalProjectRecordsFromBackendResult,
  type ProjectBackendListResult,
} from '../lib/project-backend-sync'
import { launchEditingCategories } from '../lib/product-taxonomy'

type ProjectFilter = 'all' | 'attention' | 'in_progress' | 'complete'

type ProjectListItem = {
  editCount: number
  latestEdit?: LocalInternalProjectHandoff
  project: LocalProjectRecord
  stale: boolean
}

const stageLabels: Record<LocalInternalProjectHandoff['stage'], string> = {
  created: 'Ready for upload',
  source_uploaded: 'Sources attached',
  plan_approved: 'Plan approved',
  private_review_ready: 'Review ready',
  private_review_verified: 'Review verified',
  private_review_accepted: 'Review approved',
  internal_edit_complete: 'Edit complete',
  revision_requested: 'Changes requested',
  revision_preview_ready: 'Revision ready',
}

function hasStalePrivateReviewTrace(handoff: LocalInternalProjectHandoff) {
  return Boolean(handoff.privateReview) &&
    (
      handoff.stage === 'private_review_ready' ||
      handoff.stage === 'private_review_verified' ||
      handoff.stage === 'private_review_accepted' ||
      handoff.stage === 'internal_edit_complete' ||
      handoff.stage === 'revision_requested' ||
      handoff.stage === 'revision_preview_ready'
    ) &&
    !privateReviewMatchesCurrentSourceSet(handoff)
}

function projectSummary(latestEdit: LocalInternalProjectHandoff | undefined, editCount: number) {
  if (!latestEdit) {
    return 'Create a named edit to start the upload and planning flow.'
  }

  if (hasStalePrivateReviewTrace(latestEdit)) {
    return 'The previous review belongs to an older source set. Open the edit and create a fresh review.'
  }

  if (latestEdit.stage === 'created') return 'Open the project and upload source video inside the edit.'
  if (latestEdit.stage === 'source_uploaded') return 'Sources are attached. Continue planning inside the edit.'
  if (latestEdit.stage === 'plan_approved') return 'Plan is approved. Continue to the private review.'
  if (latestEdit.stage === 'revision_requested') return 'A revision was requested. Continue the revised review.'
  if (latestEdit.stage === 'revision_preview_ready') return 'A revised private review is ready.'
  if (latestEdit.stage === 'internal_edit_complete') return 'Internal review is complete. Public release remains gated.'
  if (editCount > 1) return 'Multiple edits are ready inside this project.'

  return 'Private review is ready for playback, approval, or changes.'
}

export function ProjectsPage() {
  const projectPersistenceScope = useProjectPersistenceScope()
  const [localHandoffs, setLocalHandoffs] = useState<LocalInternalProjectHandoff[]>(() =>
    listLocalInternalProjectHandoffs(projectPersistenceScope),
  )
  const [localProjects, setLocalProjects] = useState<LocalProjectRecord[]>(() =>
    listLocalProjectRecords(projectPersistenceScope),
  )
  const [backendListResult, setBackendListResult] = useState<ProjectBackendListResult | { status: 'loading' }>({
    status: 'loading',
  })
  const [readGeneration, setReadGeneration] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all')

  useEffect(() => {
    let cancelled = false
    const initialProjects = listLocalProjectRecords(projectPersistenceScope)

    void listLocalProjectRecordsFromBackendResult(projectPersistenceScope)
      .then(async (projectResult) => {
        if (cancelled) return
        if (projectResult.status === 'access_denied') {
          setLocalProjects([])
          setLocalHandoffs([])
          setBackendListResult(projectResult)
          return
        }

        if (projectResult.status === 'unavailable' && projectResult.backendConfigured === false) {
          setLocalProjects(listLocalProjectRecords(projectPersistenceScope))
          setLocalHandoffs(listLocalInternalProjectHandoffs(projectPersistenceScope))
          setBackendListResult(projectResult)
          return
        }

        const backendProjects = projectResult.status === 'ready' ? projectResult.projects : []
        const backendHandoffs = await listBackendHandoffsWithOneRetry(projectPersistenceScope)
        if (cancelled) return
        const recoveredHandoffs = await recoverMissingProjectHandoffs(projectPersistenceScope, [
          ...initialProjects,
          ...backendProjects,
        ], backendHandoffs)
        if (cancelled) return
        const mergedBackendHandoffs = mergeProjectHandoffs(backendHandoffs, recoveredHandoffs)

        for (const project of backendProjects) {
          saveLocalProjectRecord(projectPersistenceScope, project)
        }
        for (const handoff of mergedBackendHandoffs) {
          saveLocalInternalProjectHandoff(projectPersistenceScope, handoff, { syncBackend: false })
          saveLocalProjectRecord(projectPersistenceScope, projectRecordFromHandoff(handoff))
        }
        setLocalProjects(listLocalProjectRecords(projectPersistenceScope))
        setLocalHandoffs(listLocalInternalProjectHandoffs(projectPersistenceScope))
        setBackendListResult(projectResult)
      })
      .catch(() => {
        if (cancelled) return
        setLocalProjects(listLocalProjectRecords(projectPersistenceScope))
        setLocalHandoffs(listLocalInternalProjectHandoffs(projectPersistenceScope))
        setBackendListResult({
          status: 'unavailable',
          backendConfigured: true,
          errorMessage: 'Projects could not be recovered from the account connection.',
          retryable: true,
          warnings: [],
        })
      })

    return () => {
      cancelled = true
    }
  }, [projectPersistenceScope, readGeneration])

  const projects = useMemo(() => {
    const records = new Map<string, LocalProjectRecord>()
    for (const project of localProjects) {
      records.set(project.id, project)
    }
    for (const handoff of localHandoffs) {
      if (!records.has(handoff.projectId)) {
        records.set(handoff.projectId, projectRecordFromHandoff(handoff))
      }
    }
    return [...records.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }, [localHandoffs, localProjects])

  const projectItems = useMemo<ProjectListItem[]>(() => projects.map((project) => {
    const edits = localHandoffs
      .filter((handoff) => handoff.projectId === project.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    const latestEdit = edits[0]
    return {
      editCount: edits.length,
      latestEdit,
      project,
      stale: latestEdit ? hasStalePrivateReviewTrace(latestEdit) : false,
    }
  }), [localHandoffs, projects])

  const filteredProjectItems = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
    return projectItems.filter((item) => {
      const matchesQuery = !normalizedQuery || [
        item.project.name,
        item.latestEdit?.editName,
        item.latestEdit?.projectName,
      ].filter(Boolean).some((value) => value?.toLowerCase().includes(normalizedQuery))
      return matchesQuery && projectMatchesFilter(item, projectFilter)
    })
  }, [deferredSearchQuery, projectFilter, projectItems])

  const retryRecovery = () => {
    setBackendListResult({ status: 'loading' })
    setReadGeneration((current) => current + 1)
  }
  const recoveryState = projectRecoveryState(backendListResult, projects.length, retryRecovery)
  const showProjectContent = backendListResult.status !== 'access_denied' &&
    !(projects.length === 0 && (
      backendListResult.status === 'loading' ||
      backendListResult.status === 'invalid_response' ||
      (backendListResult.status === 'unavailable' && backendListResult.backendConfigured !== false)
    ))

  return (
    <AppShell
      description="Organize projects and continue the edit that needs you."
      eyebrow="Workspace"
      primaryAction="New project"
      title="Projects"
    >
      <div className="projects-page">
        {projectItems.length > 0 && (
          <section aria-label="Find and filter projects" className="projects-toolbar">
            <label className="projects-search">
              <span className="sr-only">Search projects</span>
              <Search aria-hidden="true" size={18} />
              <input
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="Search projects or edits"
                type="search"
                value={searchQuery}
              />
            </label>
            <div aria-label="Filter projects" className="projects-filter-group" role="group">
              {projectFilters.map((filter) => (
                <button
                  aria-pressed={projectFilter === filter.value}
                  key={filter.value}
                  onClick={() => setProjectFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="projects-result-count">
              {filteredProjectItems.length} of {projectItems.length} project{projectItems.length === 1 ? '' : 's'}
            </p>
          </section>
        )}

        {recoveryState}

        {showProjectContent && projectItems.length > 0 && filteredProjectItems.length > 0 ? (
          <section aria-label="Projects" className="projects-grid">
            {filteredProjectItems.map((item) => (
              <ProjectCard item={item} key={item.project.id} />
            ))}
          </section>
        ) : showProjectContent && projectItems.length > 0 ? (
          <section className="projects-no-results">
            <Search aria-hidden="true" size={24} />
            <h2>No projects match.</h2>
            <p>Try another name or clear the current filter.</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setProjectFilter('all')
              }}
              variant="secondary"
            >
              Clear filters
            </Button>
          </section>
        ) : showProjectContent ? (
          <section className="projects-empty-state">
            <span className="projects-empty-icon" aria-hidden="true"><UploadCloud size={26} /></span>
            <div>
              <span className="section-eyebrow">Your first project</span>
              <h2>No projects yet.</h2>
              <p>Create a project, add a named edit, then upload the source inside its focused workspace.</p>
            </div>
            <Button icon={Plus} to="/projects/new" variant="primary">
              Create project
            </Button>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}

const projectFilters: { label: string; value: ProjectFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Needs action', value: 'attention' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Complete', value: 'complete' },
]

function ProjectCard({ item }: { item: ProjectListItem }) {
  const { editCount, latestEdit, project, stale } = item
  const category = launchEditingCategories.find((candidate) => candidate.value === project.category)
  const status = stale ? 'Refresh review' : latestEdit ? stageLabels[latestEdit.stage] : 'No edits yet'
  const tone = stale || !latestEdit || latestEdit.stage === 'created' || latestEdit.stage === 'revision_requested'
    ? 'attention'
    : latestEdit.stage === 'private_review_accepted' || latestEdit.stage === 'internal_edit_complete'
      ? 'success'
      : 'active'

  return (
    <article className="projects-card">
      <div className="projects-card-visual" data-category={project.category}>
        <span aria-hidden="true"><FolderKanban size={21} /></span>
        <small>{category?.label ?? 'Project'}</small>
      </div>
      <div className="projects-card-heading">
        <ProjectStatus label={status} tone={tone} />
        <h2>{project.name}</h2>
      </div>
      <p>{projectSummary(latestEdit, editCount)}</p>
      <div className="projects-card-latest">
        <span>{editCount} edit{editCount === 1 ? '' : 's'}</span>
        {latestEdit && <span>Latest: {latestEdit.editName ?? latestEdit.projectName}</span>}
      </div>
      <Button icon={ArrowRight} to={`/projects/${encodeURIComponent(project.id)}`} variant="secondary">
        Open project
      </Button>
    </article>
  )
}

function ProjectStatus({ label, tone }: { label: string; tone: 'active' | 'attention' | 'success' }) {
  return (
    <span className={`projects-status projects-status-${tone}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  )
}

function projectMatchesFilter(item: ProjectListItem, filter: ProjectFilter): boolean {
  if (filter === 'all') return true
  const stage = item.latestEdit?.stage
  if (filter === 'complete') return stage === 'private_review_accepted' || stage === 'internal_edit_complete'
  if (filter === 'in_progress') return stage === 'plan_approved'
  return item.stale || !stage || stage === 'created' || stage === 'source_uploaded' ||
    stage === 'private_review_ready' || stage === 'private_review_verified' ||
    stage === 'revision_requested' || stage === 'revision_preview_ready'
}

function projectRecoveryState(
  result: ProjectBackendListResult | { status: 'loading' },
  projectCount: number,
  onRetry: () => void,
) {
  const compact = projectCount > 0

  if (result.status === 'ready') return null
  if (result.status === 'loading') {
    return (
      <ProjectResourceState
        compact={compact}
        kind="loading"
        message={compact
          ? 'Your saved projects are available while ReeditPro checks account recovery.'
          : 'Checking this signed-in workspace before showing an empty project list.'}
        testId="projects-recovery-loading"
        title="Checking project recovery"
      />
    )
  }

  if (result.status === 'access_denied') {
    return (
      <ProjectResourceState
        kind="access_denied"
        message="ReeditPro did not expose saved project details. Revalidate the signed-in workspace or return home."
        parentLabel="Go home"
        parentTo="/dashboard"
        testId="projects-recovery-access-denied"
        title="Project access denied"
      />
    )
  }

  if (result.status === 'invalid_response') {
    return (
      <ProjectResourceState
        compact={compact}
        kind="invalid_response"
        message={compact
          ? 'ReeditPro ignored an unexpected account response and kept the last trusted browser copy visible.'
          : 'ReeditPro could not safely match the account response to this workspace, so no empty state is being inferred.'}
        parentLabel={compact ? undefined : 'Go home'}
        parentTo={compact ? undefined : '/dashboard'}
        testId="projects-recovery-invalid-response"
        title={compact ? 'Showing the last trusted copy' : 'Project response needs review'}
      />
    )
  }

  if (result.backendConfigured === false) {
    return (
      <ProjectResourceState
        compact
        kind="local_only"
        message="Projects created in this signed-in browser remain available. Account recovery is not configured for this session."
        testId="projects-recovery-local-only"
        title="This browser is the recovery source"
      />
    )
  }

  return (
    <ProjectResourceState
      compact={compact}
      kind="unavailable"
      message={compact
        ? 'The account connection could not be reached. Your last trusted browser copy remains available.'
        : 'ReeditPro could not reach account project recovery and will not present that failure as an empty workspace.'}
      onRetry={result.retryable ? onRetry : undefined}
      parentLabel={!compact && !result.retryable ? 'Go home' : undefined}
      parentTo={!compact && !result.retryable ? '/dashboard' : undefined}
      testId="projects-recovery-unavailable"
      title={compact ? 'Showing saved projects' : 'Projects are temporarily unavailable'}
    />
  )
}

async function listBackendHandoffsWithOneRetry(
  scope: import('../lib/project-persistence-scope').ProjectPersistenceScope,
): Promise<LocalInternalProjectHandoff[]> {
  return listLocalInternalProjectHandoffsFromBackendWithRetry(scope)
}

async function recoverMissingProjectHandoffs(
  scope: import('../lib/project-persistence-scope').ProjectPersistenceScope,
  projects: LocalProjectRecord[],
  listedHandoffs: LocalInternalProjectHandoff[],
): Promise<LocalInternalProjectHandoff[]> {
  const uniqueProjects = new Map(projects.map((project) => [project.id, project]))
  const listedProjectIds = new Set(listedHandoffs.map((handoff) => handoff.projectId))
  const recovered: LocalInternalProjectHandoff[] = []

  for (const project of uniqueProjects.values()) {
    if (listedProjectIds.has(project.id)) continue
    const projectHandoffs = await recoverLocalInternalProjectEditHandoffsFromBackend(scope, project.id)
    recovered.push(...projectHandoffs)
  }

  return recovered
}

function mergeProjectHandoffs(
  listedHandoffs: LocalInternalProjectHandoff[],
  recoveredHandoffs: LocalInternalProjectHandoff[],
): LocalInternalProjectHandoff[] {
  const byEditSession = new Map<string, LocalInternalProjectHandoff>()
  for (const handoff of [...listedHandoffs, ...recoveredHandoffs]) {
    const current = byEditSession.get(handoff.editSessionId)
    if (!current || handoff.updatedAt.localeCompare(current.updatedAt) >= 0) {
      byEditSession.set(handoff.editSessionId, handoff)
    }
  }

  return [...byEditSession.values()]
}

function projectRecordFromHandoff(handoff: LocalInternalProjectHandoff): LocalProjectRecord {
  return {
    id: handoff.projectId,
    workspaceId: handoff.workspaceId,
    name: handoff.projectName,
    category: handoff.category,
    createdAt: handoff.createdAt,
    updatedAt: handoff.updatedAt,
    persistence: 'browser_scoped_project_registry',
  }
}
