import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Clock3,
  FolderKanban,
  Plus,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react'
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, IconButton } from '../components/Button'
import { ProjectResourceState } from '../components/ProjectResourceState'
import {
  createEditSetupSnapshotFromPreferences,
  summarizeLocalEditPreferences,
} from '../lib/edit-preferences'
import {
  createEditPreferenceRepository,
} from '../lib/edit-preference-repository'
import { useEditPreferenceScope } from '../hooks/useEditPreferenceScope'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import { recoverLocalInternalProjectEditHandoffsFromBackend } from '../lib/internal-edit-state-backend-sync'
import {
  createLocalInternalProjectHandoff,
  isNormalVideoEditHandoff,
  listLocalInternalProjectEditHandoffs,
  privateReviewMatchesCurrentSourceSet,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import { getLocalProjectRecord, saveLocalProjectRecord, type LocalProjectRecord } from '../lib/local-projects'
import {
  readLocalProjectRecordFromBackend,
  type ProjectBackendReadResult,
} from '../lib/project-backend-sync'
import { launchEditingCategories } from '../lib/product-taxonomy'
import {
  createStorytellingLibraryItems,
  type StorytellingLibraryItem,
} from '../lib/motion-studio/storytelling/library-model'

type ProjectEditTone = 'active' | 'attention' | 'success'

type ProjectEditPresentation = {
  actionLabel: string
  description: string
  statusLabel: string
  tone: ProjectEditTone
}

const stagePresentation: Record<LocalInternalProjectHandoff['stage'], ProjectEditPresentation> = {
  created: {
    actionLabel: 'Upload source',
    description: 'Add source footage before ReeditPro prepares the edit plan.',
    statusLabel: 'Source needed',
    tone: 'attention',
  },
  source_uploaded: {
    actionLabel: 'Continue setup',
    description: 'The source is attached. Complete the brief and prepare the plan.',
    statusLabel: 'Ready to prepare',
    tone: 'active',
  },
  plan_approved: {
    actionLabel: 'View progress',
    description: 'The plan is approved and moving through the private workflow.',
    statusLabel: 'Plan approved',
    tone: 'active',
  },
  private_review_ready: {
    actionLabel: 'Open review',
    description: 'The latest private review is ready for playback and a decision.',
    statusLabel: 'Review ready',
    tone: 'attention',
  },
  private_review_verified: {
    actionLabel: 'Approve or revise',
    description: 'Playback is verified. Approve the result or request changes.',
    statusLabel: 'Decision needed',
    tone: 'attention',
  },
  private_review_accepted: {
    actionLabel: 'Open edit',
    description: 'The private review is approved for this internal workspace.',
    statusLabel: 'Review approved',
    tone: 'success',
  },
  internal_edit_complete: {
    actionLabel: 'Open edit',
    description: 'This edit completed its current private workflow.',
    statusLabel: 'Complete',
    tone: 'success',
  },
  revision_requested: {
    actionLabel: 'Review changes',
    description: 'A revision request is ready to become a fresh approved plan.',
    statusLabel: 'Changes requested',
    tone: 'attention',
  },
  revision_preview_ready: {
    actionLabel: 'Open revision',
    description: 'The revised private review is ready to check.',
    statusLabel: 'Revision ready',
    tone: 'attention',
  },
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const projectPersistenceScope = useProjectPersistenceScope()
  const scopeKey = JSON.stringify([
    projectPersistenceScope.authMode,
    projectPersistenceScope.userId,
    projectPersistenceScope.workspaceId,
    projectId,
  ])
  return <ProjectDetailContent key={scopeKey} projectId={projectId} />
}

type ProjectDetailContentProps = {
  projectId: string
}

function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const navigate = useNavigate()
  const projectPersistenceScope = useProjectPersistenceScope()
  const [project, setProject] = useState<LocalProjectRecord | undefined>(() =>
    getProjectRecordWithHandoffFallback(projectPersistenceScope, projectId),
  )
  const [edits, setEdits] = useState<LocalInternalProjectHandoff[]>(() =>
    listLocalInternalProjectEditHandoffs(projectPersistenceScope, projectId),
  )
  const [backendReadResult, setBackendReadResult] = useState<ProjectBackendReadResult | { status: 'loading' }>({
    status: 'loading',
  })
  const [readGeneration, setReadGeneration] = useState(0)
  const preferenceScope = useEditPreferenceScope()
  const preferenceRepository = useMemo(
    () => createEditPreferenceRepository(preferenceScope),
    [preferenceScope],
  )
  const initialPreferenceResult = useMemo(
    () => preferenceRepository.getInitialResult(),
    [preferenceRepository],
  )
  const [preferenceResult, setPreferenceResult] = useState(initialPreferenceResult)
  const [preferenceLoadPending, setPreferenceLoadPending] = useState(preferenceRepository.requiresAsyncLoad)
  const preferenceDefaults = preferenceResult.preferences
  const preferenceSummary = useMemo(() => summarizeLocalEditPreferences(preferenceDefaults), [preferenceDefaults])
  const normalEdits = useMemo(() => edits.filter(isNormalVideoEditHandoff), [edits])
  const storytellingItems = useMemo(() => createStorytellingLibraryItems(edits), [edits])
  const [modalOpen, setModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNameError, setEditNameError] = useState<string | null>(null)
  const editNameInputRef = useRef<HTMLInputElement>(null)
  const modalPanelRef = useRef<HTMLFormElement>(null)
  const modalReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let active = true
    if (!preferenceRepository.requiresAsyncLoad) return () => {
      active = false
    }

    void preferenceRepository.load().then((result) => {
      if (!active) return
      setPreferenceResult(result)
      setPreferenceLoadPending(false)
    })

    return () => {
      active = false
    }
  }, [preferenceRepository])

  useEffect(() => {
    let cancelled = false
    const localEdits = listLocalInternalProjectEditHandoffs(projectPersistenceScope, projectId)
    const localProject = getProjectRecordWithHandoffFallback(projectPersistenceScope, projectId, localEdits)
    if (!getLocalProjectRecord(projectPersistenceScope, projectId) && localProject) {
      saveLocalProjectRecord(projectPersistenceScope, localProject)
    }

    void readLocalProjectRecordFromBackend(
      projectPersistenceScope,
      projectId,
      localProject?.category ?? localEdits[0]?.category,
    )
      .then(async (projectResult) => {
        if (cancelled) return
        if (projectResult.status === 'access_denied' || projectResult.status === 'not_found') {
          setProject(undefined)
          setEdits([])
          setBackendReadResult(projectResult)
          return
        }

        const backendProject = projectResult.status === 'found' ? projectResult.project : undefined
        if (backendProject) {
          saveLocalProjectRecord(projectPersistenceScope, backendProject)
        }

        const projectHandoffs = projectResult.status === 'unavailable' && projectResult.backendConfigured === false
          ? localEdits
          : await recoverLocalInternalProjectEditHandoffsFromBackend(projectPersistenceScope, projectId)
        if (cancelled) return

        for (const handoff of projectHandoffs) {
          saveLocalInternalProjectHandoff(projectPersistenceScope, handoff, { syncBackend: false })
          saveLocalProjectRecord(projectPersistenceScope, projectRecordFromHandoff(handoff))
        }

        const nextProject = getLocalProjectRecord(projectPersistenceScope, projectId) ??
          backendProject ??
          (projectHandoffs[0] ? projectRecordFromHandoff(projectHandoffs[0]) : undefined)
        setProject(nextProject)
        setEdits(listLocalInternalProjectEditHandoffs(projectPersistenceScope, projectId))
        setBackendReadResult(projectResult)
      })
      .catch(() => {
        if (cancelled) return
        setProject(getProjectRecordWithHandoffFallback(projectPersistenceScope, projectId))
        setEdits(listLocalInternalProjectEditHandoffs(projectPersistenceScope, projectId))
        setBackendReadResult({
          status: 'unavailable',
          backendConfigured: true,
          errorMessage: 'The project could not be recovered from the account connection.',
          retryable: true,
          warnings: [],
        })
      })

    return () => {
      cancelled = true
    }
  }, [projectId, projectPersistenceScope, readGeneration])

  useEffect(() => {
    if (!modalOpen) return
    const focusInput = () => editNameInputRef.current?.focus()
    const frameId = window.requestAnimationFrame(focusInput)
    const containFocus = (event: FocusEvent) => {
      if (modalPanelRef.current?.contains(event.target as Node)) return
      focusInput()
    }
    document.addEventListener('focusin', containFocus)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('focusin', containFocus)
    }
  }, [modalOpen])

  const retryProjectRecovery = () => {
    setBackendReadResult({ status: 'loading' })
    setReadGeneration((current) => current + 1)
  }
  const blockingProjectState = !project
    ? projectBlockingState(backendReadResult, retryProjectRecovery)
    : null

  if (blockingProjectState) {
    return (
      <AppShell
        description="Recovering the exact signed-in project before its edits are shown."
        eyebrow="Project"
        primaryAction={false}
        title="Project workspace"
      >
        {blockingProjectState}
      </AppShell>
    )
  }

  if (!project) {
    return null
  }

  const recoveryNotice = projectRecoveryNotice(backendReadResult, retryProjectRecovery)
  const category = launchEditingCategories.find((candidate) => candidate.value === project.category)

  function handleCreateEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!project) return
    const normalizedEditName = normalizeEditNameInput(editName)
    if (!normalizedEditName) {
      setEditNameError('Name this edit before creating it.')
      editNameInputRef.current?.focus()
      return
    }

    const handoff = createLocalInternalProjectHandoff({
      category: project.category,
      editName: normalizedEditName,
      productWorkflow: 'video_edit',
      projectId: project.id,
      projectName: project.name,
      workspaceId: projectPersistenceScope.workspaceId,
      setup: createEditSetupSnapshotFromPreferences(preferenceDefaults),
    })
    saveLocalInternalProjectHandoff(projectPersistenceScope, handoff)
    navigate(handoff.editorPath)
  }

  function openNewEditModal() {
    if (preferenceLoadPending) return
    modalReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setEditName('')
    setEditNameError(null)
    setModalOpen(true)
  }

  function closeNewEditModal() {
    setModalOpen(false)
    setEditName('')
    setEditNameError(null)
    window.requestAnimationFrame(() => modalReturnFocusRef.current?.focus())
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeNewEditModal()
      return
    }

    if (event.key !== 'Tab') return
    const focusable = getDialogFocusableElements(modalPanelRef.current)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const activeElement = document.activeElement
    if (event.shiftKey && (activeElement === first || !modalPanelRef.current?.contains(activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <AppShell
      description="Manage its edits, approvals, and private reviews."
      eyebrow="Project"
      primaryAction={false}
      title={project.name}
    >
      <div className="project-home-page">
        <div className="project-home-context">
          <Button icon={ArrowLeft} to="/projects" variant="ghost">
            All projects
          </Button>
          <div className="project-home-context-meta">
            <span>{category?.label ?? 'Project'}</span>
            <span>{normalEdits.length} video edit{normalEdits.length === 1 ? '' : 's'}</span>
            <span>{storytellingItems.length} Motion stor{storytellingItems.length === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>

        {recoveryNotice}

        <section className="project-home-defaults" aria-label="Defaults for new edits">
          <span aria-hidden="true"><SlidersHorizontal size={18} /></span>
          <div>
            <strong>{preferenceResult.persisted ? 'Saved edit preferences ready' : 'Safe edit defaults ready'}</strong>
            <p>New edits begin with {preferenceSummary}.</p>
          </div>
        </section>

        <section aria-labelledby="project-edits-heading" className="project-home-edits" data-testid="project-video-edits">
          <div className="project-home-section-heading">
            <div>
              <span className="section-eyebrow">Normal editing workflow</span>
              <h2 id="project-edits-heading">Video edits</h2>
            </div>
            {normalEdits.length > 0 && (
              <Button disabled={preferenceLoadPending} icon={Plus} onClick={openNewEditModal} variant="primary">
                {preferenceLoadPending ? 'Loading defaults…' : 'New video edit'}
              </Button>
            )}
          </div>

          {normalEdits.length > 0 ? (
            <div className="project-edit-grid" data-testid="project-edit-list">
              {normalEdits.map((edit, index) => (
                <ProjectEditCard edit={edit} featured={index === 0} key={edit.editSessionId} />
              ))}
            </div>
          ) : (
            <div className="project-home-empty">
              <span aria-hidden="true"><FolderKanban size={27} /></span>
              <div>
                <h3>No video edits yet.</h3>
                <p>Name the first video edit, then add source footage inside its normal Edit Chat.</p>
              </div>
              <Button disabled={preferenceLoadPending} icon={Plus} onClick={openNewEditModal} variant="primary">
                {preferenceLoadPending ? 'Loading defaults…' : 'New video edit'}
              </Button>
            </div>
          )}
        </section>

        <section aria-labelledby="project-motion-heading" className="project-home-edits" data-testid="project-motion-stories">
          <div className="project-home-section-heading">
            <div>
              <span className="section-eyebrow">Separate Motion Studio workflow</span>
              <h2 id="project-motion-heading">Storytelling stories</h2>
            </div>
            <Button icon={BookOpenText} to="/motion-studio/storytelling" variant="secondary">
              Storytelling library
            </Button>
          </div>

          {storytellingItems.length > 0 ? (
            <div className="project-edit-grid" data-testid="project-storytelling-list">
              {storytellingItems.map((item) => (
                <ProjectStorytellingCard item={item} key={item.editSessionId} />
              ))}
            </div>
          ) : (
            <div className="project-home-empty project-home-empty-secondary">
              <span aria-hidden="true"><BookOpenText size={27} /></span>
              <div>
                <h3>No Motion Studio stories in this project.</h3>
                <p>Create and manage idea-first stories in the separate Storytelling Director workflow.</p>
              </div>
              <Button to="/motion-studio/storytelling" variant="secondary">
                Open Motion Studio
              </Button>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div
          aria-labelledby="new-edit-dialog-title"
          aria-modal="true"
          className="clean-modal-backdrop"
          data-testid="new-edit-dialog"
          role="dialog"
        >
          <form
            className="clean-modal-panel"
            onKeyDown={handleDialogKeyDown}
            onSubmit={handleCreateEdit}
            ref={modalPanelRef}
          >
            <div className="clean-modal-heading">
              <div>
                <span className="section-eyebrow">New edit</span>
                <h2 id="new-edit-dialog-title">Name this edit</h2>
              </div>
              <IconButton icon={X} label="Close new edit panel" onClick={closeNewEditModal} />
            </div>
            <label className="planning-field">
              <span>Edit name</span>
              <input
                aria-describedby={editNameError ? 'new-edit-name-error' : undefined}
                aria-invalid={Boolean(editNameError)}
                onChange={(event) => {
                  setEditName(event.currentTarget.value)
                  if (editNameError && normalizeEditNameInput(event.currentTarget.value)) {
                    setEditNameError(null)
                  }
                }}
                placeholder="Launch cut v1"
                ref={editNameInputRef}
                value={editName}
              />
            </label>
            {editNameError && (
              <p className="clean-modal-error" id="new-edit-name-error" role="alert">
                {editNameError}
              </p>
            )}
            <div className="clean-create-actions">
              <Button icon={ArrowRight} type="submit" variant="primary">
                Create edit
              </Button>
              <span>
                Uses your saved edit preferences, then opens normal Edit Chat for source upload.
              </span>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}

function ProjectEditCard({ edit, featured }: { edit: LocalInternalProjectHandoff; featured: boolean }) {
  const presentation = getEditPresentation(edit)
  const title = edit.editName ?? edit.projectName

  return (
    <article className={`project-edit-card ${featured ? 'is-featured' : ''}`}>
      <div className="project-edit-visual" data-category={edit.category}>
        <span aria-hidden="true"><Video size={featured ? 24 : 20} /></span>
        <small>{edit.sourceFileCount > 0
          ? `${edit.sourceFileCount} source ${edit.sourceFileCount === 1 ? 'file' : 'files'}`
          : 'Waiting for source'}</small>
      </div>
      <div className="project-edit-copy">
        <ProjectEditStatus label={presentation.statusLabel} tone={presentation.tone} />
        <h3>{title}</h3>
        <p>{presentation.description}</p>
        <div className="project-edit-metadata">
          <span><Clock3 aria-hidden="true" size={14} />{formatRelativeUpdate(edit.updatedAt)}</span>
          {edit.setup?.preferenceDefaultsApplied && <span>Preferences applied</span>}
        </div>
        <Button icon={ArrowRight} to={edit.editorPath} variant={featured ? 'primary' : 'secondary'}>
          {presentation.actionLabel}
        </Button>
      </div>
    </article>
  )
}

function ProjectEditStatus({ label, tone }: { label: string; tone: ProjectEditTone }) {
  return (
    <span className={`project-edit-status project-edit-status-${tone}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  )
}

function getEditPresentation(edit: LocalInternalProjectHandoff): ProjectEditPresentation {
  const hasReviewStage = edit.stage === 'private_review_ready' ||
    edit.stage === 'private_review_verified' ||
    edit.stage === 'private_review_accepted' ||
    edit.stage === 'internal_edit_complete' ||
    edit.stage === 'revision_requested' ||
    edit.stage === 'revision_preview_ready'

  if (hasReviewStage && edit.privateReview && !privateReviewMatchesCurrentSourceSet(edit)) {
    return {
      actionLabel: 'Refresh review',
      description: 'The previous review belongs to an older source set. Prepare a fresh review before deciding.',
      statusLabel: 'Review needs refresh',
      tone: 'attention',
    }
  }

  return stagePresentation[edit.stage]
}

function ProjectStorytellingCard({ item }: { item: StorytellingLibraryItem }) {
  return (
    <article className="project-edit-card">
      <div className="project-edit-visual" data-category="storytelling">
        <span aria-hidden="true"><BookOpenText size={21} /></span>
        <small>{item.sourceFileCount > 0
          ? `${item.sourceFileCount} source ${item.sourceFileCount === 1 ? 'file' : 'files'}`
          : 'Idea-first or source-assisted'}</small>
      </div>
      <div className="project-edit-copy">
        <ProjectEditStatus label={item.statusLabel} tone={storytellingTone(item.tone)} />
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="project-edit-metadata">
          <span><Clock3 aria-hidden="true" size={14} />{formatRelativeUpdate(item.updatedAt)}</span>
          {item.preferenceDefaultsApplied && <span>Preferences applied</span>}
        </div>
        <Button icon={ArrowRight} to={item.editorPath} variant="secondary">
          Open Director Chat
        </Button>
      </div>
    </article>
  )
}

function storytellingTone(tone: StorytellingLibraryItem['tone']): ProjectEditTone {
  if (tone === 'verified') return 'success'
  if (tone === 'attention') return 'attention'
  return 'active'
}

function formatRelativeUpdate(value: string): string {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Updated recently'

  const elapsedSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (elapsedSeconds < 60) return 'Updated just now'
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `Updated ${elapsedHours}h ago`
  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `Updated ${elapsedDays}d ago`
  return `Updated ${new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(timestamp)}`
}

function normalizeEditNameInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80)
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

function getProjectRecordWithHandoffFallback(
  scope: import('../lib/project-persistence-scope').ProjectPersistenceScope,
  projectId: string,
  handoffs: LocalInternalProjectHandoff[] = listLocalInternalProjectEditHandoffs(scope, projectId),
): LocalProjectRecord | undefined {
  return getLocalProjectRecord(scope, projectId) ?? (handoffs[0] ? projectRecordFromHandoff(handoffs[0]) : undefined)
}

function projectBlockingState(
  result: ProjectBackendReadResult | { status: 'loading' },
  onRetry: () => void,
) {
  if (result.status === 'loading' || result.status === 'found') {
    return (
      <ProjectResourceState
        kind="loading"
        message="Checking the signed-in browser and account recovery before showing project edits."
        testId="project-recovery-loading"
        title="Loading project"
      />
    )
  }

  if (result.status === 'not_found') {
    return (
      <ProjectResourceState
        kind="not_found"
        message="The project may have been removed or the link may no longer be current. No edit workspace was opened."
        parentLabel="Back to projects"
        parentTo="/projects"
        testId="project-recovery-not-found"
        title="Project not found"
      />
    )
  }

  if (result.status === 'access_denied') {
    return (
      <ProjectResourceState
        kind="access_denied"
        message="ReeditPro did not expose project details. Return to the projects you can access or revalidate the workspace."
        parentLabel="Back to projects"
        parentTo="/projects"
        testId="project-recovery-access-denied"
        title="Project access denied"
      />
    )
  }

  if (result.status === 'invalid_response') {
    return (
      <ProjectResourceState
        kind="invalid_response"
        message="The recovered data did not safely match this signed-in project route, so ReeditPro kept the workspace closed."
        parentLabel="Back to projects"
        parentTo="/projects"
        testId="project-recovery-invalid-response"
        title="Project response could not be verified"
      />
    )
  }

  return (
    <ProjectResourceState
      kind="unavailable"
      message={result.backendConfigured === false
        ? 'This project is not saved in the signed-in browser and account recovery is not configured for this session.'
        : 'ReeditPro could not reach account recovery and will not redirect this failure into an empty project list.'}
      onRetry={result.retryable ? onRetry : undefined}
      parentLabel="Back to projects"
      parentTo="/projects"
      testId="project-recovery-unavailable"
      title="Project is unavailable"
    />
  )
}

function projectRecoveryNotice(
  result: ProjectBackendReadResult | { status: 'loading' },
  onRetry: () => void,
) {
  if (result.status === 'found' || result.status === 'not_found' || result.status === 'access_denied') return null

  if (result.status === 'loading') {
    return (
      <ProjectResourceState
        compact
        kind="loading"
        message="The saved browser copy is available while ReeditPro checks account recovery."
        testId="project-recovery-loading"
        title="Checking project recovery"
      />
    )
  }

  if (result.status === 'invalid_response') {
    return (
      <ProjectResourceState
        compact
        kind="invalid_response"
        message="ReeditPro ignored an unexpected account response and kept the last trusted browser copy visible."
        testId="project-recovery-invalid-response"
        title="Showing the last trusted copy"
      />
    )
  }

  if (result.backendConfigured === false) {
    return (
      <ProjectResourceState
        compact
        kind="local_only"
        message="This project's saved browser copy remains available. Account recovery is not configured for this session."
        testId="project-recovery-local-only"
        title="This browser is the recovery source"
      />
    )
  }

  return (
    <ProjectResourceState
      compact
      kind="unavailable"
      message="The account connection could not be reached. The last trusted browser copy remains available."
      onRetry={result.retryable ? onRetry : undefined}
      testId="project-recovery-unavailable"
      title="Showing the saved project"
    />
  )
}

function getDialogFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return [...container.querySelectorAll<HTMLElement>([
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(','))].filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}
