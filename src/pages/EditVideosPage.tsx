import { ArrowRight, Clock3, Clapperboard, FolderKanban, Search, Video } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ProjectResourceState } from '../components/ProjectResourceState'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import {
  listLocalInternalProjectHandoffsFromBackendWithRetryResult,
  type InternalEditStateBackendListResult,
} from '../lib/internal-edit-state-backend-sync'
import {
  isNormalVideoEditHandoff,
  listLocalInternalProjectHandoffs,
  privateReviewMatchesCurrentSourceSet,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import { launchEditingCategories } from '../lib/product-taxonomy'

type EditFilter = 'all' | 'attention' | 'in_progress' | 'complete'
type EditTone = 'active' | 'attention' | 'success'

type EditPresentation = {
  actionLabel: string
  description: string
  statusLabel: string
  tone: EditTone
}

const stagePresentation: Record<LocalInternalProjectHandoff['stage'], EditPresentation> = {
  created: {
    actionLabel: 'Open Edit Chat',
    description: 'Add source footage, then tell ReeditPro how this video should be edited.',
    statusLabel: 'Source needed',
    tone: 'attention',
  },
  source_uploaded: {
    actionLabel: 'Continue Edit Chat',
    description: 'Source footage is attached. Continue the normal edit setup and planning conversation.',
    statusLabel: 'Ready to plan',
    tone: 'active',
  },
  plan_approved: {
    actionLabel: 'View edit progress',
    description: 'The approved video-edit plan is moving through its private workflow.',
    statusLabel: 'Plan approved',
    tone: 'active',
  },
  private_review_ready: {
    actionLabel: 'Open private review',
    description: 'The latest private video result is ready for playback and a decision.',
    statusLabel: 'Review ready',
    tone: 'attention',
  },
  private_review_verified: {
    actionLabel: 'Approve or revise',
    description: 'Playback is verified. Approve this edit or request changes in Edit Chat.',
    statusLabel: 'Decision needed',
    tone: 'attention',
  },
  private_review_accepted: {
    actionLabel: 'Open video edit',
    description: 'The current private review is approved and retained with this named edit.',
    statusLabel: 'Review approved',
    tone: 'success',
  },
  internal_edit_complete: {
    actionLabel: 'Open video edit',
    description: 'This video completed its current private editing workflow.',
    statusLabel: 'Complete',
    tone: 'success',
  },
  revision_requested: {
    actionLabel: 'Continue revision',
    description: 'Requested changes are waiting for a fresh plan in the normal Edit Chat.',
    statusLabel: 'Changes requested',
    tone: 'attention',
  },
  revision_preview_ready: {
    actionLabel: 'Open revised review',
    description: 'The revised private video is ready to check.',
    statusLabel: 'Revision ready',
    tone: 'attention',
  },
}

export function EditVideosPage() {
  const scope = useProjectPersistenceScope()
  const [handoffs, setHandoffs] = useState<LocalInternalProjectHandoff[]>(() =>
    listLocalInternalProjectHandoffs(scope),
  )
  const [backendResult, setBackendResult] = useState<InternalEditStateBackendListResult | { status: 'loading' }>({
    status: 'loading',
  })
  const [readGeneration, setReadGeneration] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [filter, setFilter] = useState<EditFilter>('all')

  useEffect(() => {
    let cancelled = false

    void listLocalInternalProjectHandoffsFromBackendWithRetryResult(scope)
      .then((result) => {
        if (cancelled) return
        if (result.status === 'access_denied') {
          setHandoffs([])
          setBackendResult(result)
          return
        }

        if (result.status === 'ready') {
          for (const handoff of result.handoffs) {
            saveLocalInternalProjectHandoff(scope, handoff, { syncBackend: false })
          }
        }
        setHandoffs(listLocalInternalProjectHandoffs(scope))
        setBackendResult(result)
      })
      .catch(() => {
        if (cancelled) return
        setHandoffs(listLocalInternalProjectHandoffs(scope))
        setBackendResult({
          status: 'unavailable',
          backendConfigured: true,
          errorMessage: 'Video edits could not be recovered from the account connection.',
          retryable: true,
          warnings: [],
        })
      })

    return () => {
      cancelled = true
    }
  }, [readGeneration, scope])

  const videoEdits = useMemo(
    () => handoffs.filter(isNormalVideoEditHandoff).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [handoffs],
  )
  const filteredEdits = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    return videoEdits.filter((handoff) => {
      const category = launchEditingCategories.find((candidate) => candidate.value === handoff.category)?.label
      const matchesQuery = !query || [handoff.editName, handoff.projectName, category]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
      return matchesQuery && editMatchesFilter(handoff, filter)
    })
  }, [deferredSearchQuery, filter, videoEdits])

  const retryRecovery = () => {
    setBackendResult({ status: 'loading' })
    setReadGeneration((current) => current + 1)
  }
  const recoveryState = editVideoRecoveryState(backendResult, videoEdits.length, retryRecovery)
  const showLibrary = backendResult.status !== 'access_denied' && !(
    videoEdits.length === 0 && (
      backendResult.status === 'loading' ||
      backendResult.status === 'invalid_response' ||
      backendResult.status === 'unavailable'
    )
  )

  return (
    <AppShell
      description="Open a named video edit and continue its normal Edit Chat, planning, approval, and private-review workflow."
      eyebrow="Video editing"
      primaryAction="New video project"
      title="Edit Videos"
    >
      <div className="projects-page" data-testid="edit-videos-library">
        {videoEdits.length > 0 && (
          <section aria-label="Find and filter video edits" className="projects-toolbar">
            <label className="projects-search">
              <span className="sr-only">Search video edits</span>
              <Search aria-hidden="true" size={18} />
              <input
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="Search edits or projects"
                type="search"
                value={searchQuery}
              />
            </label>
            <div aria-label="Filter video edits" className="projects-filter-group" role="group">
              {editFilters.map((candidate) => (
                <button
                  aria-pressed={filter === candidate.value}
                  key={candidate.value}
                  onClick={() => setFilter(candidate.value)}
                  type="button"
                >
                  {candidate.label}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="projects-result-count">
              {filteredEdits.length} of {videoEdits.length} video edit{videoEdits.length === 1 ? '' : 's'}
            </p>
          </section>
        )}

        {recoveryState}

        {showLibrary && videoEdits.length > 0 && filteredEdits.length > 0 ? (
          <section aria-label="Video edits" className="project-edit-grid edit-videos-grid">
            {filteredEdits.map((handoff) => (
              <VideoEditCard handoff={handoff} key={`${handoff.projectId}:${handoff.editSessionId}`} />
            ))}
          </section>
        ) : showLibrary && videoEdits.length > 0 ? (
          <section className="projects-no-results">
            <Search aria-hidden="true" size={24} />
            <h2>No video edits match.</h2>
            <p>Try another edit or project name, or clear the current filter.</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setFilter('all')
              }}
              variant="secondary"
            >
              Clear filters
            </Button>
          </section>
        ) : showLibrary ? (
          <section className="projects-empty-state" data-testid="edit-videos-empty-state">
            <span className="projects-empty-icon" aria-hidden="true"><Clapperboard size={26} /></span>
            <div>
              <span className="section-eyebrow">Normal Edit Chat</span>
              <h2>No video edits yet.</h2>
              <p>Open a project and create a named edit. Motion Studio stories stay in their separate Storytelling workspace.</p>
            </div>
            <Button icon={FolderKanban} to="/projects" variant="primary">
              Choose a project
            </Button>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}

const editFilters: { label: string; value: EditFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Needs action', value: 'attention' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Complete', value: 'complete' },
]

function VideoEditCard({ handoff }: { handoff: LocalInternalProjectHandoff }) {
  const presentation = getEditPresentation(handoff)
  const category = launchEditingCategories.find((candidate) => candidate.value === handoff.category)?.label ?? 'Video edit'

  return (
    <article className="project-edit-card" data-testid="video-edit-card">
      <div className="project-edit-visual" data-category={handoff.category}>
        <span aria-hidden="true"><Video size={21} /></span>
        <small>{handoff.sourceFileCount > 0
          ? `${handoff.sourceFileCount} source ${handoff.sourceFileCount === 1 ? 'file' : 'files'}`
          : 'Waiting for source'}</small>
      </div>
      <div className="project-edit-copy">
        <EditStatus label={presentation.statusLabel} tone={presentation.tone} />
        <h2>{handoff.editName ?? handoff.projectName}</h2>
        <p>{presentation.description}</p>
        <div className="project-edit-metadata">
          <span><FolderKanban aria-hidden="true" size={14} />{handoff.projectName}</span>
          <span>{category}</span>
          <span><Clock3 aria-hidden="true" size={14} />{formatRelativeUpdate(handoff.updatedAt)}</span>
        </div>
        <Button icon={ArrowRight} to={handoff.editorPath} variant="secondary">
          {presentation.actionLabel}
        </Button>
      </div>
    </article>
  )
}

function EditStatus({ label, tone }: { label: string; tone: EditTone }) {
  return (
    <span className={`project-edit-status project-edit-status-${tone}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  )
}

function getEditPresentation(handoff: LocalInternalProjectHandoff): EditPresentation {
  if (hasStalePrivateReviewTrace(handoff)) {
    return {
      actionLabel: 'Refresh review in Edit Chat',
      description: 'The prior review belongs to an older source set. Open this edit and prepare a fresh private review.',
      statusLabel: 'Review needs refresh',
      tone: 'attention',
    }
  }
  return stagePresentation[handoff.stage]
}

function hasStalePrivateReviewTrace(handoff: LocalInternalProjectHandoff): boolean {
  const reviewStage = handoff.stage === 'private_review_ready' ||
    handoff.stage === 'private_review_verified' ||
    handoff.stage === 'private_review_accepted' ||
    handoff.stage === 'internal_edit_complete' ||
    handoff.stage === 'revision_requested' ||
    handoff.stage === 'revision_preview_ready'
  return reviewStage && Boolean(handoff.privateReview) && !privateReviewMatchesCurrentSourceSet(handoff)
}

function editMatchesFilter(handoff: LocalInternalProjectHandoff, filter: EditFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'complete') return handoff.stage === 'private_review_accepted' || handoff.stage === 'internal_edit_complete'
  if (filter === 'in_progress') return handoff.stage === 'source_uploaded' || handoff.stage === 'plan_approved'
  return hasStalePrivateReviewTrace(handoff) ||
    handoff.stage === 'created' ||
    handoff.stage === 'private_review_ready' ||
    handoff.stage === 'private_review_verified' ||
    handoff.stage === 'revision_requested' ||
    handoff.stage === 'revision_preview_ready'
}

function editVideoRecoveryState(
  result: InternalEditStateBackendListResult | { status: 'loading' },
  editCount: number,
  onRetry: () => void,
) {
  const compact = editCount > 0
  if (result.status === 'ready') return null
  if (result.status === 'loading') {
    return (
      <ProjectResourceState
        compact={compact}
        kind="loading"
        message={compact
          ? 'Your saved video edits remain visible while ReeditPro checks account recovery.'
          : 'Checking this signed-in workspace before showing an empty video-edit library.'}
        testId="edit-videos-recovery-loading"
        title="Checking video-edit recovery"
      />
    )
  }
  if (result.status === 'access_denied') {
    return (
      <ProjectResourceState
        kind="access_denied"
        message="ReeditPro did not expose saved video edits for this workspace. Revalidate the signed-in account or return home."
        parentLabel="Go home"
        parentTo="/dashboard"
        testId="edit-videos-recovery-access-denied"
        title="Video-edit access denied"
      />
    )
  }
  if (result.status === 'not_configured') {
    return (
      <ProjectResourceState
        compact
        kind="local_only"
        message="Video edits created in this signed-in browser remain available. Account recovery is not configured for this session."
        testId="edit-videos-recovery-local-only"
        title="This browser is the recovery source"
      />
    )
  }
  if (result.status === 'invalid_response') {
    return (
      <ProjectResourceState
        compact={compact}
        kind="invalid_response"
        message={compact
          ? 'ReeditPro ignored an unexpected account response and kept the last trusted video-edit copy visible.'
          : 'ReeditPro could not safely match the account response to this workspace, so no empty library is being inferred.'}
        parentLabel={compact ? undefined : 'Go home'}
        parentTo={compact ? undefined : '/dashboard'}
        testId="edit-videos-recovery-invalid-response"
        title={compact ? 'Showing the last trusted edits' : 'Video-edit response needs review'}
      />
    )
  }
  return (
    <ProjectResourceState
      compact={compact}
      kind="unavailable"
      message={compact
        ? 'The account connection could not be reached. Your last trusted video-edit copy remains available.'
        : 'ReeditPro could not reach account edit recovery and will not present that failure as an empty library.'}
      onRetry={result.retryable ? onRetry : undefined}
      parentLabel={!compact && !result.retryable ? 'Go home' : undefined}
      parentTo={!compact && !result.retryable ? '/dashboard' : undefined}
      testId="edit-videos-recovery-unavailable"
      title={compact ? 'Showing saved video edits' : 'Video edits are temporarily unavailable'}
    />
  )
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
