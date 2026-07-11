import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  CloudOff,
  FileSearch,
  FolderKanban,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ProjectResourceState } from '../components/ProjectResourceState'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import {
  listLocalInternalProjectHandoffs,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import {
  listLocalInternalProjectHandoffsFromBackendWithRetryResult,
  type InternalEditStateBackendListResult,
} from '../lib/internal-edit-state-backend-sync'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'
import type { EditingCategory } from '../types/reeditpro'

type HomeTone = 'active' | 'attention' | 'neutral' | 'success'

type HomeStagePresentation = {
  actionLabel: string
  nextStep: string
  statusLabel: string
  tone: HomeTone
}

const stagePresentation: Record<LocalInternalProjectHandoff['stage'], HomeStagePresentation> = {
  created: {
    actionLabel: 'Upload source',
    nextStep: 'Add the source footage so ReeditPro can prepare this edit.',
    statusLabel: 'Source needed',
    tone: 'attention',
  },
  source_uploaded: {
    actionLabel: 'Prepare footage',
    nextStep: 'Review the source, complete setup, and create the edit plan.',
    statusLabel: 'Ready to prepare',
    tone: 'active',
  },
  plan_approved: {
    actionLabel: 'View progress',
    nextStep: 'The approved direction is moving through the private workflow.',
    statusLabel: 'Approved work underway',
    tone: 'active',
  },
  private_review_ready: {
    actionLabel: 'Open review',
    nextStep: 'The latest private review is ready for your decision.',
    statusLabel: 'Review ready',
    tone: 'attention',
  },
  private_review_verified: {
    actionLabel: 'Approve or revise',
    nextStep: 'Playback is verified. Approve the review or request changes.',
    statusLabel: 'Decision needed',
    tone: 'attention',
  },
  private_review_accepted: {
    actionLabel: 'Open edit',
    nextStep: 'The private review is approved for this internal workspace.',
    statusLabel: 'Review approved',
    tone: 'success',
  },
  internal_edit_complete: {
    actionLabel: 'Open edit',
    nextStep: 'This edit completed its current private workflow.',
    statusLabel: 'Complete',
    tone: 'success',
  },
  revision_requested: {
    actionLabel: 'Review changes',
    nextStep: 'A revision request is ready to be shaped into a fresh plan.',
    statusLabel: 'Changes requested',
    tone: 'attention',
  },
  revision_preview_ready: {
    actionLabel: 'Open revision',
    nextStep: 'The updated private review is ready to check.',
    statusLabel: 'Revision ready',
    tone: 'attention',
  },
}

const categoryPresentation: Partial<Record<EditingCategory, { icon: LucideIcon; label: string }>> = {
  storytelling: { icon: BookOpenText, label: 'Storytelling' },
  lifestyle: { icon: Camera, label: 'Lifestyle' },
  business_brand: { icon: BriefcaseBusiness, label: 'Business / Brand' },
  education_explainer: { icon: GraduationCap, label: 'Education / Explainer' },
  documentary_case_study: { icon: FileSearch, label: 'Documentary / Case Study' },
}

function resolveCategoryPresentation(category: EditingCategory): { icon: LucideIcon; label: string } {
  return categoryPresentation[category] ?? {
    icon: BookOpenText,
    label: category.split('_').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' '),
  }
}

const attentionStages = new Set<LocalInternalProjectHandoff['stage']>([
  'created',
  'source_uploaded',
  'private_review_ready',
  'private_review_verified',
  'revision_requested',
  'revision_preview_ready',
])

const firstProjectSteps = [
  { icon: FolderKanban, label: 'Create a project' },
  { icon: MessageCircle, label: 'Start a named edit' },
  { icon: UploadCloud, label: 'Upload and shape the plan' },
]

export function DashboardPage() {
  const projectPersistenceScope = useProjectPersistenceScope()
  const [handoffs, setHandoffs] = useState<LocalInternalProjectHandoff[]>(() =>
    listLocalInternalProjectHandoffs(projectPersistenceScope),
  )
  const [recoveryResult, setRecoveryResult] = useState<InternalEditStateBackendListResult | { status: 'loading' }>({
    status: 'loading',
  })
  const [recoveryGeneration, setRecoveryGeneration] = useState(0)

  useEffect(() => {
    let cancelled = false

    void listLocalInternalProjectHandoffsFromBackendWithRetryResult(projectPersistenceScope)
      .then((result) => {
        if (cancelled) return
        if (result.status === 'access_denied') {
          setHandoffs([])
          setRecoveryResult(result)
          return
        }

        if (result.status === 'ready') {
          setHandoffs(mergeRecoveredDashboardHandoffs(projectPersistenceScope, result.handoffs))
        } else {
          setHandoffs(listLocalInternalProjectHandoffs(projectPersistenceScope))
        }
        setRecoveryResult(result)
      })
      .catch(() => {
        if (cancelled) return
        setHandoffs(listLocalInternalProjectHandoffs(projectPersistenceScope))
        setRecoveryResult({
          status: 'unavailable',
          backendConfigured: true,
          errorMessage: 'Saved edits could not be recovered from the account connection.',
          retryable: true,
          warnings: [],
        })
      })

    return () => {
      cancelled = true
    }
  }, [projectPersistenceScope, recoveryGeneration])

  const latestEdit = handoffs[0]
  const recentEdits = useMemo(() => handoffs.slice(1, 4), [handoffs])
  const attentionEdits = useMemo(
    () => handoffs.filter((handoff) => handoff !== latestEdit && attentionStages.has(handoff.stage)).slice(0, 3),
    [handoffs, latestEdit],
  )
  const retryRecovery = () => {
    setRecoveryResult({ status: 'loading' })
    setRecoveryGeneration((current) => current + 1)
  }
  const recoveryState = dashboardRecoveryState(recoveryResult, handoffs.length, retryRecovery)
  const isLoadingWithoutTrustedEdit = recoveryResult.status === 'loading' && !latestEdit
  const isAccessDeniedWithoutTrustedEdit = recoveryResult.status === 'access_denied' && !latestEdit

  return (
    <AppShell
      description="Pick up an edit or start something new."
      eyebrow="Workspace"
      primaryAction="New project"
      title="Home"
    >
      <div className="home-dashboard" data-testid="testing-home-hero">
        {isLoadingWithoutTrustedEdit ? (
          <HomeLoadingState />
        ) : isAccessDeniedWithoutTrustedEdit ? (
          recoveryState
        ) : latestEdit ? (
          <HomeReturningState
            attentionEdits={attentionEdits}
            latestEdit={latestEdit}
            recentEdits={recentEdits}
          />
        ) : (
          <HomeFirstProjectState />
        )}

        {!isLoadingWithoutTrustedEdit && !isAccessDeniedWithoutTrustedEdit && recoveryState}
        {!isAccessDeniedWithoutTrustedEdit && <HomePreferencesShortcut />}
      </div>
    </AppShell>
  )
}

function HomeReturningState({
  attentionEdits,
  latestEdit,
  recentEdits,
}: {
  attentionEdits: LocalInternalProjectHandoff[]
  latestEdit: LocalInternalProjectHandoff
  recentEdits: LocalInternalProjectHandoff[]
}) {
  const latestStage = stagePresentation[latestEdit.stage]
  const category = resolveCategoryPresentation(latestEdit.category)
  const CategoryIcon = category.icon

  return (
    <>
      <section className="home-primary-grid" aria-label="Continue and attention">
        <article className="home-continue-card" data-testid="testing-home-latest-edit">
          <div className="home-edit-visual" data-category={latestEdit.category}>
            <span className="home-edit-visual-icon" aria-hidden="true">
              <CategoryIcon size={26} />
            </span>
            <div className="home-edit-visual-copy">
              <span>{category.label}</span>
              <strong>{latestEdit.sourceFileCount > 0 ? `${latestEdit.sourceFileCount} source ${latestEdit.sourceFileCount === 1 ? 'file' : 'files'}` : 'Waiting for source'}</strong>
            </div>
          </div>

          <div className="home-continue-copy">
            <span className="section-eyebrow">Continue editing</span>
            <p className="home-project-breadcrumb">
              <FolderKanban aria-hidden="true" size={15} />
              <span>{latestEdit.projectName}</span>
            </p>
            <h2>{latestEdit.editName ?? latestEdit.projectName}</h2>
            <p>{latestStage.nextStep}</p>
            <div className="home-edit-metadata">
              <HomeStatus label={latestStage.statusLabel} tone={latestStage.tone} />
              <span><Clock3 aria-hidden="true" size={14} />{formatRelativeUpdate(latestEdit.updatedAt)}</span>
            </div>
            <Button icon={ArrowRight} to={latestEdit.editorPath} variant="primary">
              {latestStage.actionLabel}
            </Button>
          </div>
        </article>

        <aside className="home-attention-panel" aria-labelledby="home-attention-title">
          <div className="home-section-heading home-section-heading-compact">
            <div>
              <span className="section-eyebrow">Right now</span>
              <h2 id="home-attention-title">Needs your attention</h2>
            </div>
            {attentionEdits.length > 0 && <span className="home-count" aria-label={`${attentionEdits.length} items`}>{attentionEdits.length}</span>}
          </div>

          {attentionEdits.length > 0 ? (
            <div className="home-attention-list">
              {attentionEdits.map((handoff) => (
                <HomeAttentionItem handoff={handoff} key={handoff.editSessionId} />
              ))}
            </div>
          ) : (
            <div className="home-attention-clear">
              <CheckCircle2 aria-hidden="true" size={20} />
              <div>
                <strong>Nothing else needs you.</strong>
                <p>Your current edit already shows the next useful action.</p>
              </div>
            </div>
          )}
        </aside>
      </section>

      {recentEdits.length > 0 && (
        <section className="home-recent-section" aria-labelledby="home-recent-title">
          <div className="home-section-heading">
            <div>
              <span className="section-eyebrow">Recent work</span>
              <h2 id="home-recent-title">Your latest edits</h2>
            </div>
            <Link className="home-text-link" to="/projects">
              View all projects <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="home-recent-grid">
            {recentEdits.map((handoff) => (
              <HomeRecentEdit handoff={handoff} key={handoff.editSessionId} />
            ))}
          </div>
        </section>
      )}

    </>
  )
}

function HomeFirstProjectState() {
  return (
    <section className="home-first-project" aria-labelledby="home-first-project-title">
      <div className="home-first-project-copy">
        <span className="section-eyebrow">Your first edit</span>
        <h2 id="home-first-project-title">Create your first project.</h2>
        <p>
          Keep the source, creative direction, plan, and private review together. ReeditPro will show the exact plan and credit estimate before any editing begins.
        </p>
        <Button icon={FolderKanban} to="/projects/new" variant="primary">
          Create project
        </Button>
      </div>
      <ol className="home-first-steps" aria-label="How to start">
        {firstProjectSteps.map((step, index) => (
          <li key={step.label}>
            <span className="home-first-step-index">{index + 1}</span>
            <step.icon aria-hidden="true" size={19} />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function HomeLoadingState() {
  return (
    <section aria-busy="true" aria-label="Loading your editing workspace" className="home-loading-state" data-testid="home-loading-focal">
      <div className="home-loading-visual" />
      <div className="home-loading-copy">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  )
}

function HomeRecoveryNotice({
  message,
  onRetry,
  testId,
  title,
  tone = 'neutral',
}: {
  message: string
  onRetry?: () => void
  testId: string
  title: string
  tone?: 'attention' | 'neutral'
}) {
  return (
    <section className={`home-recovery-notice home-recovery-notice-${tone}`} data-testid={testId}>
      <span className="home-recovery-icon" aria-hidden="true"><CloudOff size={18} /></span>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      {onRetry && (
        <Button icon={RefreshCw} onClick={onRetry} size="sm" variant="ghost">
          Retry recovery
        </Button>
      )}
    </section>
  )
}

function HomeAttentionItem({ handoff }: { handoff: LocalInternalProjectHandoff }) {
  const presentation = stagePresentation[handoff.stage]

  return (
    <Link aria-label={`${presentation.actionLabel}: ${handoff.editName ?? handoff.projectName}`} className="home-attention-item" to={handoff.editorPath}>
      <HomeStatus label={presentation.statusLabel} tone={presentation.tone} />
      <strong>{handoff.editName ?? handoff.projectName}</strong>
      <span>{handoff.projectName}</span>
      <ArrowRight aria-hidden="true" size={16} />
    </Link>
  )
}

function HomeRecentEdit({ handoff }: { handoff: LocalInternalProjectHandoff }) {
  const presentation = stagePresentation[handoff.stage]
  const category = resolveCategoryPresentation(handoff.category)
  const CategoryIcon = category.icon

  return (
    <article className="home-recent-card">
      <div className="home-recent-card-topline">
        <span className="home-recent-icon" aria-hidden="true"><CategoryIcon size={18} /></span>
        <HomeStatus label={presentation.statusLabel} tone={presentation.tone} />
      </div>
      <div>
        <h3>{handoff.editName ?? handoff.projectName}</h3>
        <p>{handoff.projectName}</p>
      </div>
      <div className="home-recent-footer">
        <span>{formatRelativeUpdate(handoff.updatedAt)}</span>
        <Link aria-label={`Open ${handoff.editName ?? handoff.projectName}`} to={handoff.editorPath}>
          Open <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </article>
  )
}

function HomePreferencesShortcut() {
  return (
    <section className="home-preferences-shortcut" aria-labelledby="home-preferences-title">
      <span className="home-preferences-icon" aria-hidden="true"><SlidersHorizontal size={20} /></span>
      <div>
        <h2 id="home-preferences-title">Edit defaults</h2>
        <p>Choose the starting style, cleanup, and creative direction copied into each new edit.</p>
      </div>
      <Link className="home-text-link" to="/preferences">
        Edit Preferences <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  )
}

function HomeStatus({ label, tone }: { label: string; tone: HomeTone }) {
  return (
    <span className={`home-status home-status-${tone}`}>
      <span aria-hidden="true" />
      {label}
    </span>
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

function mergeRecoveredDashboardHandoffs(
  scope: ProjectPersistenceScope,
  backendHandoffs: LocalInternalProjectHandoff[],
): LocalInternalProjectHandoff[] {
  const localHandoffs = listLocalInternalProjectHandoffs(scope)
  const localByEdit = new Map(localHandoffs.map((handoff) => [dashboardEditKey(handoff), handoff]))
  const recoverable = backendHandoffs
    .filter((handoff) => {
      const local = localByEdit.get(dashboardEditKey(handoff))
      return !local || handoff.updatedAt.localeCompare(local.updatedAt) > 0
    })
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))

  for (const handoff of recoverable) {
    saveLocalInternalProjectHandoff(scope, handoff, { syncBackend: false })
  }
  return listLocalInternalProjectHandoffs(scope)
}

function dashboardRecoveryState(
  result: InternalEditStateBackendListResult | { status: 'loading' },
  handoffCount: number,
  onRetry: () => void,
) {
  const hasLocalHandoff = handoffCount > 0

  if (result.status === 'ready' || result.status === 'loading') return null
  if (result.status === 'access_denied') {
    return (
      <ProjectResourceState
        kind="access_denied"
        message="ReeditPro did not expose saved edit details. Revalidate this workspace or use the session menu to sign out."
        testId="home-recovery-access-denied"
        title="Edit access denied"
      />
    )
  }

  if (result.status === 'not_configured') {
    return (
      <HomeRecoveryNotice
        message={hasLocalHandoff
          ? 'Account recovery is not connected for this session. The last trusted browser copy remains available.'
          : 'No saved edit is available in this browser, and account recovery is not connected for this session.'}
        testId="home-recovery-not-configured"
        title={hasLocalHandoff ? 'Showing this browser’s saved edit' : 'Account recovery is not connected'}
        tone={hasLocalHandoff ? 'neutral' : 'attention'}
      />
    )
  }

  if (result.status === 'invalid_response') {
    return (
      <HomeRecoveryNotice
        message={hasLocalHandoff
          ? 'ReeditPro ignored an unexpected account response and kept the last trusted browser copy available.'
          : 'ReeditPro could not safely match the account response, so it is not treating this workspace as empty.'}
        onRetry={onRetry}
        testId="home-recovery-invalid-response"
        title={hasLocalHandoff ? 'Showing the last trusted edit' : 'Edit recovery needs another try'}
        tone={hasLocalHandoff ? 'neutral' : 'attention'}
      />
    )
  }

  return (
    <HomeRecoveryNotice
      message={hasLocalHandoff
        ? 'The account connection could not be reached. The last trusted browser copy remains available.'
        : 'ReeditPro could not reach account recovery and will not treat that failure as an empty workspace.'}
      onRetry={onRetry}
      testId="home-recovery-unavailable"
      title={hasLocalHandoff ? 'Showing the saved edit' : 'Edit recovery is temporarily unavailable'}
      tone={hasLocalHandoff ? 'neutral' : 'attention'}
    />
  )
}

function dashboardEditKey(handoff: LocalInternalProjectHandoff): string {
  return JSON.stringify([handoff.projectId, handoff.editSessionId])
}
