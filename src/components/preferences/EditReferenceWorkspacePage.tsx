import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  Archive,
  ArrowLeft,
  BrainCircuit,
  ClipboardList,
  CircleAlert,
  FileCheck2,
  FileVideo2,
  History,
  LockKeyhole,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useSearchParams } from 'react-router'
import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  CreatePreferenceEvidenceRequest,
  EditReferenceDetail,
  EditReferenceLongFormStudyControlAction,
  EditReferenceListItem,
  PreferenceAssetRecord,
  PreferenceApplicationRecord,
  PreferenceEvidenceCategory,
  PreferenceEvidenceRecord,
  PreferenceEvidenceTransferability,
  PreferenceLongFormStudySummary,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
} from '../../types/edit-reference'
import { EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES, EDIT_REFERENCE_STUDY_GOALS } from '../../types/edit-reference'
import type {
  ApplyEditReferenceLongFormStudyReviewRequest,
  EditReferenceLongFormStudyReviewData,
} from '../../types/edit-reference-long-form-review'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import { createEditReferenceDeterministicHash, stableEditReferenceJson } from '../../lib/edit-reference-deterministic-hash'
import { uploadEditReferenceMedia } from '../../lib/edit-reference-media-upload-client'
import {
  clearEditReferenceMediaUploadRecovery,
  readPendingEditReferenceMediaUploadRecovery,
  type EditReferenceMediaUploadRecoverySummary,
} from '../../lib/edit-reference-media-upload-recovery'
import {
  preferenceSkillRunBlockerMessage,
  preferenceSkillRunCanRetry,
  preferenceSkillRunDisplaySummary,
  preferenceSkillRunResultStateLabel,
  resolvePreferenceSkillRunResultState,
} from '../../lib/edit-reference-skill-result-state'
import { toEditReferenceInspectorView, toEditReferenceSavedCardView } from '../../lib/edit-reference-ui-adapter'
import { AppShell } from '../AppShell'
import { Badge } from '../Badge'
import { Button } from '../Button'
import {
  EditReferenceLongFormReviewPanel,
  type EditReferenceLongFormReviewSaveResult,
} from './EditReferenceLongFormReviewPanel'
import { WorkspaceDefaultsPanel } from './WorkspaceDefaultsPanel'

const tabs = [
  { id: 'edit-references', label: 'Library', secondary: false },
  { id: 'workspace-defaults', label: 'Defaults', secondary: true },
  { id: 'applied-edits', label: 'Usage', secondary: true },
  { id: 'safety-privacy', label: 'Privacy', secondary: true },
] as const
type TabId = typeof tabs[number]['id']

const api = createEditReferenceApiClient()
const defaultWorkspaceId = (import.meta.env.VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID as string | undefined)?.trim()
  || 'workspace-private-beta'
const EditReferenceWorkspaceContext = createContext(defaultWorkspaceId)

function useEditReferenceWorkspaceId() {
  return useContext(EditReferenceWorkspaceContext)
}

export function EditReferenceWorkspacePage({ workspaceId = defaultWorkspaceId }: { workspaceId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const requestedReferenceId = searchParams.get('reference')?.trim() || undefined
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab) ? requestedTab as TabId : 'edit-references'
  const studyFocused = activeTab === 'edit-references' && Boolean(requestedReferenceId)

  const setActiveTab = (tab: TabId) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'edit-references') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const setSelectedReferenceId = (referenceId?: string) => {
    const next = new URLSearchParams(searchParams)
    if (referenceId) next.set('reference', referenceId)
    else next.delete('reference')
    setSearchParams(next, { replace: true })
  }

  const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, currentTab: TabId) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab)
    const nextIndex = event.key === 'ArrowRight'
      ? (currentIndex + 1) % tabs.length
      : event.key === 'ArrowLeft'
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextTab = tabs[nextIndex]
    setActiveTab(nextTab.id)
    document.getElementById(`edit-reference-tab-${nextTab.id}`)?.focus()
  }

  return (
    <EditReferenceWorkspaceContext.Provider value={workspaceId}>
      <AppShell
        description="Teach ReEditPro how you want videos edited."
        eyebrow="Your editing style"
        primaryAction={false}
        title="Edit Preferences"
      >
        <section
          className="edit-reference-workspace"
          data-edit-reference-workspace="true"
          data-study-focused={studyFocused ? 'true' : 'false'}
          data-testid="edit-preferences-page"
          data-workspace-id={workspaceId}
        >
          <div className="edit-reference-tabs" role="tablist" aria-label="Edit Preferences workspace">
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                aria-controls={`edit-reference-panel-${tab.id}`}
                className={`${activeTab === tab.id ? 'active' : ''} ${tab.secondary ? 'secondary' : 'primary'}`.trim()}
                data-testid={`edit-preference-tab-${tab.id}`}
                id={`edit-reference-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => moveTabFocus(event, tab.id)}
                role="tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            aria-label={studyFocused ? 'Preference study workspace' : undefined}
            aria-labelledby={studyFocused ? undefined : `edit-reference-tab-${activeTab}`}
            id={`edit-reference-panel-${activeTab}`}
            role="tabpanel"
          >
            {activeTab === 'edit-references' && (
              <EditReferencesTab
                onReferenceSelected={setSelectedReferenceId}
                preferredReferenceId={requestedReferenceId}
              />
            )}
            {activeTab === 'workspace-defaults' && (
              <section aria-label="Workspace Defaults" data-testid="workspace-defaults-panel">
                <WorkspaceDefaultsPanel />
              </section>
            )}
            {activeTab === 'applied-edits' && <AppliedEditsTab onOpenLibrary={() => setActiveTab('edit-references')} />}
            {activeTab === 'safety-privacy' && <SafetyPrivacyTab />}
          </div>
        </section>
      </AppShell>
    </EditReferenceWorkspaceContext.Provider>
  )
}

function EditReferencesTab({
  onReferenceSelected,
  preferredReferenceId,
}: {
  onReferenceSelected: (referenceId?: string) => void
  preferredReferenceId?: string
}) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [references, setReferences] = useState<EditReferenceListItem[]>([])
  const [detail, setDetail] = useState<EditReferenceDetail>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [showCreate, setShowCreate] = useState(false)
  const createReturnFocusRef = useRef<HTMLElement | null>(null)
  const requestEpoch = useRef(0)
  const blockingLibraryError = Boolean(error && !loading && references.length === 0 && !showCreate)

  const loadList = useCallback(async (referenceIdOverride?: string) => {
    const epoch = ++requestEpoch.current
    setLoading(true)
    setError(undefined)
    const response = await api.list(workspaceId)
    if (epoch !== requestEpoch.current) return
    if (!response.ok) {
      setError(response.message)
      setLoading(false)
      return
    }
    setReferences(response.data.references)
    const selectedId = referenceIdOverride
      ?? preferredReferenceId
      ?? detail?.reference.id
    if (selectedId) {
      const selected = await api.get(workspaceId, selectedId)
      if (epoch !== requestEpoch.current) return
      if (selected.ok) setDetail(selected.data.detail)
      else setError(selected.message)
    } else {
      setDetail(undefined)
    }
    setLoading(false)
  }, [detail?.reference.id, preferredReferenceId, workspaceId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadList() }, 0)
    return () => {
      requestEpoch.current += 1
      window.clearTimeout(timeoutId)
    }
    // The first load deliberately does not refetch when selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeoutId = window.setTimeout(() => setNotice(undefined), 5_000)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const selectReference = async (referenceId: string) => {
    const epoch = ++requestEpoch.current
    setBusy(true)
    setError(undefined)
    const response = await api.get(workspaceId, referenceId)
    if (epoch !== requestEpoch.current) return
    if (response.ok) {
      setDetail(response.data.detail)
      onReferenceSelected(response.data.detail.reference.id)
    }
    else setError(response.message)
    setBusy(false)
  }

  const handleCreated = async (created: EditReferenceDetail) => {
    setDetail(created)
    onReferenceSelected(created.reference.id)
    setShowCreate(false)
    setNotice('Preference created. Tell ReEditPro how you want videos edited or add a reference video.')
    await loadList(created.reference.id)
  }

  const openCreate = () => {
    createReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setShowCreate(true)
  }

  const closeCreate = () => {
    setShowCreate(false)
    window.requestAnimationFrame(() => createReturnFocusRef.current?.focus())
  }

  const closeReference = () => {
    setDetail(undefined)
    onReferenceSelected(undefined)
  }

  const archiveSelected = async () => {
    if (!detail || detail.reference.status === 'archived') return
    setBusy(true)
    setError(undefined)
    const archiveRequest: UpdateEditReferenceRequest = {
      workspaceId,
      expectedReferenceRevision: detail.reference.revision,
      status: 'archived',
    }
    const archiveIdempotencyKey = `edit-reference-archive-${createEditReferenceDeterministicHash({
      editReferenceId: detail.reference.id,
      ...archiveRequest,
    })}`
    const response = await api.update(detail.reference.id, archiveRequest, archiveIdempotencyKey)
    const archiveFailureMessage = response.ok
      ? 'The archived preference could not be verified. Check its saved state before retrying.'
      : response.message
    let archivedDetail = response.ok ? response.data.detail : undefined
    if (!archivedDetail) {
      const readback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
      if (
        readback?.reference.id === detail.reference.id
        && readback.reference.workspaceId === workspaceId
        && readback.reference.status === 'archived'
        && readback.reference.revision > archiveRequest.expectedReferenceRevision
      ) archivedDetail = readback
    }
    if (archivedDetail) {
      setDetail(archivedDetail)
      setNotice('Preference archived. Its private history remains available.')
      await loadList(archivedDetail.reference.id)
    } else setError(archiveFailureMessage)
    setBusy(false)
  }

  return (
    <div aria-busy={loading || busy} className="edit-reference-tab-panel" data-testid="edit-references-panel">
      {(error || notice) && !blockingLibraryError && (
        <div className={`edit-reference-alert ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
          {error ? <CircleAlert aria-hidden="true" size={18} /> : <FileCheck2 aria-hidden="true" size={18} />}
          <span>{error ?? notice}</span>
        </div>
      )}

      {loading ? (
        <section className="edit-reference-loading-state" role="status">
          <RefreshCw aria-hidden="true" size={22} />
          <div><strong>Loading your Edit Preferences…</strong><span>Restoring saved studies and their latest verified state.</span></div>
        </section>
      ) : blockingLibraryError ? (
        <EditReferenceUnavailableState busy={busy} onRetry={() => void loadList()} />
      ) : references.length === 0 ? (
        <EditReferenceEmptyState onCreate={openCreate} />
      ) : detail ? (
        <section className="edit-reference-detail" data-testid="edit-reference-detail">
          <header className="edit-reference-detail-heading">
            <button className="edit-reference-back" onClick={closeReference} type="button">
              <ArrowLeft aria-hidden="true" size={17} />
              All preferences
            </button>
            <div>
              <div>
                <span className="section-eyebrow">Edit preference</span>
                <h1>{detail.reference.name}</h1>
              </div>
              <span className="edit-reference-detail-status" role="status">{preferenceProgressLabel(detail)}</span>
            </div>
          </header>

          <div className="edit-reference-three-panel edit-reference-detail-layout">
            <section className="edit-reference-chat-panel" aria-label="Preference study">
              <StudyChat detail={detail} disabled={busy} onChanged={async (next) => {
                setDetail(next)
                setReferences((current) => current.map((item) => item.reference.id === next.reference.id
                  ? {
                      reference: next.reference,
                      currentStudy: next.study,
                      messageCount: next.messages.length,
                      applicationCount: next.applications.length,
                    }
                  : item))
              }} setBusy={setBusy} setError={setError} />
            </section>

            <aside className="edit-reference-inspector" aria-label="Study details">
              <details className="edit-reference-progress-disclosure">
                <summary>
                  <span>Study progress</span>
                  <strong>{preferenceProgressLabel(detail)}</strong>
                </summary>
                <div className="edit-reference-progress-disclosure-content">
                  <EditReferenceInspector busy={busy} detail={detail} onArchive={archiveSelected} />
                </div>
              </details>
            </aside>
          </div>
        </section>
      ) : (
        <section className="edit-reference-library" aria-label="Saved Edit Preferences">
          <div className="edit-reference-library-toolbar">
            <div>
              <strong>{references.length} saved preference{references.length === 1 ? '' : 's'}</strong>
            </div>
            <div>
              <button aria-label="Reload saved preferences" disabled={loading || busy} onClick={() => void loadList()} type="button">
                <RefreshCw aria-hidden="true" size={16} />
              </button>
              <Button data-testid="new-edit-reference" icon={Plus} onClick={openCreate} variant="primary">
                New preference
              </Button>
            </div>
          </div>
          <div className="edit-reference-library-list">
            {references.map((item) => (
              <SavedPreferenceButton item={item} key={item.reference.id} onSelect={selectReference} selected={false} />
            ))}
          </div>
        </section>
      )}
      {showCreate ? (
        <CreateReferenceDialog
          busy={busy}
          onCancel={closeCreate}
          onCreated={handleCreated}
          setBusy={setBusy}
          setError={setError}
        />
      ) : null}
    </div>
  )
}

function EditReferenceUnavailableState({ busy, onRetry }: { busy: boolean; onRetry: () => void }) {
  return (
    <section className="edit-reference-unavailable-state" data-testid="edit-reference-library-unavailable" role="alert">
      <span className="edit-reference-empty-icon"><CircleAlert aria-hidden="true" size={26} /></span>
      <span className="section-eyebrow">Library unavailable</span>
      <h2>We couldn’t load your Edit Preferences</h2>
      <p>Your saved preferences have not been changed. Check the connection, then try again.</p>
      <Button
        data-testid="retry-edit-reference-library"
        disabled={busy}
        icon={RefreshCw}
        onClick={onRetry}
        variant="primary"
      >
        {busy ? 'Trying again…' : 'Try again'}
      </Button>
    </section>
  )
}

function EditReferenceEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="edit-reference-empty-state" data-testid="edit-reference-empty-state">
      <div className="edit-reference-empty-copy">
        <span className="edit-reference-empty-icon"><FileVideo2 aria-hidden="true" size={26} /></span>
        <span className="section-eyebrow">No saved preferences</span>
        <h2>Teach ReEditPro your editing style</h2>
        <p>Add a reference video or an approved edit. ReEditPro studies it deeply, then lets you review the guidance before anything can be used.</p>
        <div className="edit-reference-empty-actions">
          <Button data-testid="new-edit-reference" icon={Plus} onClick={onCreate} variant="primary">New preference</Button>
          <span><LockKeyhole aria-hidden="true" size={15} /> Private and never applied automatically</span>
        </div>
      </div>
    </section>
  )
}

function SavedPreferenceButton({ compact = false, item, onSelect, selected }: {
  compact?: boolean
  item: EditReferenceListItem
  onSelect: (referenceId: string) => Promise<void>
  selected: boolean
}) {
  const view = toEditReferenceSavedCardView(item)
  return (
    <button
      aria-label={`${view.name}${selected ? ', selected' : ''}`}
      aria-pressed={selected}
      className={`edit-reference-saved-card ${compact ? 'compact' : ''} ${selected ? 'active' : ''}`.trim()}
      data-testid={`edit-reference-card-${item.reference.id}`}
      onClick={() => void onSelect(item.reference.id)}
      type="button"
    >
      <strong>{view.name}</strong>
      <span>{preferenceProgressLabel(item)}</span>
      {!compact && view.applicationCount > 0 ? (
        <small>Used in {view.applicationCount} edit{view.applicationCount === 1 ? '' : 's'}</small>
      ) : null}
      <time dateTime={view.latestActivityAt}>{new Date(view.latestActivityAt).toLocaleDateString()}</time>
    </button>
  )
}

function preferenceProgressLabel(record: EditReferenceListItem | EditReferenceDetail): string {
  const study = 'currentStudy' in record ? record.currentStudy : record.study
  if (record.reference.status === 'archived' || study.status === 'archived') return 'Archived'
  if (record.reference.dnaStatus === 'approved' || ['approved', 'applied'].includes(study.status)) return 'Ready to use'
  if ('assets' in record) {
    const longFormStudies = record.assets
      .map((asset) => asset.longFormStudy)
      .filter((summary): summary is NonNullable<typeof summary> => Boolean(summary))
    if (longFormStudies.some((summary) => summary.operatorReviewRequired || summary.state === 'needs_operator_review')) return 'Study needs attention'
    if (longFormStudies.some((summary) => summary.state === 'paused')) return 'Study paused'
  }
  if (study.status === 'failed' || ['qa_blocked', 'needs_clarification', 'needs_user_review'].includes(study.status)) return 'Needs review'
  if (study.status === 'studying') return 'Studying video'
  if (study.status === 'ready_to_study') return 'Ready to study'
  if (['evidence_ready', 'dna_ready'].includes(study.status)) return 'Ready to review'
  return 'Add a reference'
}

function userFacingStudyAction(value: string): string {
  if (value === 'Answer the setup questions') return 'Add a reference'
  return value
    .replaceAll('Preference DNA', 'editing guidance')
    .replaceAll('DNA', 'guidance')
    .replaceAll('QA', 'quality check')
    .replace('reference evidence', 'an example or direction')
    .replace('saved evidence', 'saved inputs')
}

function CreateReferenceDialog({ busy, onCancel, onCreated, setBusy, setError }: {
  busy: boolean
  onCancel: () => void
  onCreated: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [name, setName] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const createIdempotencyKeyRef = useRef(`edit-reference-create-${crypto.randomUUID()}`)
  const dirty = Boolean(name.trim())

  useEffect(() => {
    if (!dirty) return
    const protectDraft = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [dirty])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (confirmDiscard) setConfirmDiscard(false)
        else if (dirty) setConfirmDiscard(true)
        else onCancel()
        return
      }
      if (event.key !== 'Tab' || confirmDiscard) return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmDiscard, dirty, onCancel])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const createRequest = {
      workspaceId,
      name,
      description: '',
      initialGoals: [...EDIT_REFERENCE_STUDY_GOALS],
    }
    const response = await api.create(createRequest, createIdempotencyKeyRef.current)
    if (response.ok) await onCreated(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  return (
    <div
      className="edit-reference-dialog-backdrop"
      data-testid="edit-reference-create-dialog"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (dirty) setConfirmDiscard(true)
        else onCancel()
      }}
    >
      <div
        aria-describedby="edit-reference-create-description"
        aria-labelledby="edit-reference-create-title"
        aria-modal="true"
        className="edit-reference-create-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <form className="edit-reference-create-card" data-testid="edit-reference-create-form" onSubmit={submit}>
          <div>
            <span className="section-eyebrow">New Edit Preference</span>
            <h2 id="edit-reference-create-title">Name this preference</h2>
            <p id="edit-reference-create-description">You can describe the style or upload a reference video in the Study Chat next.</p>
          </div>
          <label>
            <span>Preference name</span>
            <input autoFocus data-testid="edit-reference-name" maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Documentary storytelling" required value={name} />
          </label>
          <div className="edit-reference-form-actions">
            <Button disabled={busy} onClick={() => dirty ? setConfirmDiscard(true) : onCancel()} variant="ghost">Cancel</Button>
            <Button data-testid="save-edit-reference" disabled={busy || !name.trim()} icon={Plus} type="submit" variant="primary">
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
        {confirmDiscard ? (
          <div className="edit-reference-discard-confirmation" role="alertdialog" aria-label="Discard Edit Preference draft">
            <div><strong>Discard this preference?</strong><span>The name has not been saved.</span></div>
            <div>
              <Button autoFocus onClick={() => setConfirmDiscard(false)} size="sm" variant="secondary">Keep editing</Button>
              <Button onClick={onCancel} size="sm" variant="ghost">Discard</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function EditReferenceInspector({ busy, detail, onArchive }: {
  busy: boolean
  detail: EditReferenceDetail
  onArchive: () => Promise<void>
}) {
  const view = toEditReferenceInspectorView(detail)
  const sourceEvidence = detail.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const correctedEvidenceIds = new Set(sourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const activeSourceEvidence = sourceEvidence.filter((record) => !correctedEvidenceIds.has(record.id))
  const currentDNA = detail.dnaVersions
    .filter((record) => record.status !== 'superseded')
    .sort((left, right) => right.version - left.version)[0]
  const currentQA = currentDNA ? detail.dnaQaResults.find((record) => record.dnaVersionId === currentDNA.id) : undefined
  const approved = currentDNA?.status === 'approved'
  const studyComplete = ['evidence_ready', 'dna_ready', 'qa_blocked', 'needs_user_review', 'approved', 'applied'].includes(detail.study.status)

  return (
    <>
      <div className="edit-reference-next-action" role="status">
        <span>Next step</span>
        <strong>{userFacingStudyAction(view.nextAction)}</strong>
      </div>
      <div aria-label="Edit Preference progress" className="edit-reference-progress-path" role="list">
        <StudyPathRow
          label="Reference"
          state={activeSourceEvidence.length ? 'complete' : 'current'}
          value={activeSourceEvidence.length ? `${activeSourceEvidence.length} saved` : 'Add a video or approved edit'}
        />
        <StudyPathRow
          label="Study"
          state={studyComplete ? 'complete' : activeSourceEvidence.length ? 'current' : 'upcoming'}
          value={studyComplete
            ? 'Reference studied'
            : activeSourceEvidence.length
              ? userFacingStudyAction(view.nextAction)
              : 'Starts after a reference'}
        />
        <StudyPathRow
          label="Guidance"
          state={approved ? 'complete' : currentDNA ? 'current' : 'upcoming'}
          value={approved
            ? `Version ${currentDNA.version} approved`
            : currentQA
              ? 'Quality review complete; your approval is next'
              : currentDNA
                ? 'Ready for quality review'
                : 'Created after the study'}
        />
      </div>
      <div className="edit-reference-inspector-section">
        <span>Study coverage</span>
        <div className="edit-reference-goal-chips">
          {detail.reference.initialGoals.map((goal) => <small key={goal}>{goal.replaceAll('_', ' ')}</small>)}
        </div>
      </div>
      <div className="edit-reference-inspector-section">
        <span>Reference record</span>
        <p className="edit-reference-inspector-copy">{view.sourceEvidenceCount} saved input{view.sourceEvidenceCount === 1 ? '' : 's'} · {view.findingCount} study finding{view.findingCount === 1 ? '' : 's'}</p>
      </div>
      <div className="edit-reference-safety-mini">
        <LockKeyhole aria-hidden="true" size={17} />
        <p>Your original reference stays private and unchanged.</p>
      </div>
      <Button disabled={busy || detail.reference.status === 'archived'} icon={Archive} onClick={() => void onArchive()} size="sm" variant="ghost">
        Archive reference
      </Button>
    </>
  )
}

function StudyPathRow({ label, state, value }: {
  label: string
  state: 'complete' | 'current' | 'upcoming'
  value: string
}) {
  return (
    <div className="edit-reference-progress-row" data-state={state} role="listitem">
      <span aria-hidden="true" className="edit-reference-progress-marker">{state === 'complete' ? '✓' : ''}</span>
      <div><strong>{label}</strong><span>{value}</span></div>
    </div>
  )
}

async function readEditReferenceAfterUncertainMutation(
  workspaceId: string,
  editReferenceId: string,
): Promise<EditReferenceDetail | undefined> {
  const readback = await api.get(workspaceId, editReferenceId)
  return readback.ok ? readback.data.detail : undefined
}

function exactStudyMessageCommitted(
  before: EditReferenceDetail,
  after: EditReferenceDetail,
  request: AppendPreferenceStudyMessageRequest,
): boolean {
  if (
    after.reference.id !== before.reference.id
    || after.study.id !== before.study.id
    || after.study.revision <= request.expectedStudyRevision
  ) return false
  const matchingMessages = after.messages.filter((record) => (
    record.studySessionId === before.study.id
    && record.role === 'user'
    && record.clientMessageId === request.clientMessageId
    && record.content === request.content
  ))
  if (matchingMessages.length !== 1) return false
  const savedMessage = matchingMessages[0]
  const hasAssistantResponse = after.messages.some((record) => (
    record.studySessionId === before.study.id
    && record.role === 'assistant'
    && record.sequence === savedMessage.sequence + 1
  ))
  const hasDurableReasoningStatus = (after.studyChatReasoning ?? []).some((record) => (
    record.userMessageId === savedMessage.id
    && ['queued', 'thinking', 'waiting', 'answered', 'needs_review', 'failed', 'cancelled'].includes(record.state)
  ))
  if (!hasAssistantResponse && !hasDurableReasoningStatus) return false
  const previousEvidenceIds = new Set(before.evidence.map((record) => record.id))
  return after.evidence.some((record) => (
    !previousEvidenceIds.has(record.id)
    && record.studySessionId === before.study.id
    && record.sourceType === 'manual_user_evidence'
    && record.summary === request.content
    && (request.findingCorrectionEvidenceId
      ? record.supersedesEvidenceId === request.findingCorrectionEvidenceId
      : !record.supersedesEvidenceId)
  ))
}

function exactEvidenceCommitted(
  before: EditReferenceDetail,
  after: EditReferenceDetail,
  request: CreatePreferenceEvidenceRequest,
): boolean {
  if (
    after.reference.id !== before.reference.id
    || after.study.id !== before.study.id
    || after.study.revision <= request.expectedStudyRevision
  ) return false
  const previousEvidenceIds = new Set(before.evidence.map((record) => record.id))
  return after.evidence.some((record) => {
    if (
      previousEvidenceIds.has(record.id)
      || record.workspaceId !== request.workspaceId
      || record.studySessionId !== before.study.id
      || record.sourceType !== request.sourceType
      || record.title !== request.title.trim()
    ) return false
    if (request.sourceType === 'manual_user_evidence') {
      return record.category === request.category
        && record.summary === request.summary.trim()
        && record.transferability === request.intendedUse
        && (record.supersedesEvidenceId ?? '') === (request.supersedesEvidenceId ?? '')
    }
    if (request.sourceType === 'previous_approved_edit_snapshot') {
      return record.provenance.projectId === request.projectId
        && record.provenance.editSessionId === request.editSessionId
        && record.provenance.approvedSnapshotId === request.approvedSnapshotId
        && record.provenance.rightsBasis === request.rightsBasis
        && (!request.summary?.trim() || record.summary === request.summary.trim())
    }
    const linkedAsset = record.provenance.privateAssetId
      ? after.assets.find((asset) => asset.privateAssetId === record.provenance.privateAssetId)
      : undefined
    return record.provenance.sourceLabel === request.sourceLabel.trim()
      && record.provenance.rightsBasis === request.rightsBasis
      && (!request.storageObjectRecordId || linkedAsset?.storageObjectRecordId === request.storageObjectRecordId)
      && (!request.mediaAssetId || linkedAsset?.mediaAssetId === request.mediaAssetId)
  })
}

function exactEvidenceStudyCommitted(before: EditReferenceDetail, after: EditReferenceDetail): boolean {
  if (
    after.reference.id !== before.reference.id
    || after.study.id !== before.study.id
    || after.study.revision <= before.study.revision
    || after.study.status === 'ready_to_study'
    || after.reference.evidenceStatus !== after.study.evidenceStatus
  ) return false
  const previousRunIds = new Set(before.skillRuns.map((record) => record.id))
  const newRuns = after.skillRuns.filter((record) => (
    record.studySessionId === before.study.id && !previousRunIds.has(record.id)
  ))
  const newOrchestrationIds = new Set(newRuns.map((record) => record.orchestrationId))
  const previousEvidenceIds = new Set(before.evidence.map((record) => record.id))
  const hasNewDerivedEvidence = after.evidence.some((record) => (
    !previousEvidenceIds.has(record.id)
    && record.studySessionId === before.study.id
    && record.sourceType === 'derived_skill_evidence'
    && Boolean(record.orchestrationId && newOrchestrationIds.has(record.orchestrationId))
  ))
  const previousMessageIds = new Set(before.messages.map((record) => record.id))
  const hasNewAssistantResult = after.messages.some((record) => (
    record.studySessionId === before.study.id
    && record.role === 'assistant'
    && !previousMessageIds.has(record.id)
  ))
  return newRuns.length > 0
    && newOrchestrationIds.size === 1
    && hasNewDerivedEvidence
    && hasNewAssistantResult
}

function exactDNASynthesisCommitted(before: EditReferenceDetail, after: EditReferenceDetail): boolean {
  if (
    after.reference.id !== before.reference.id
    || after.study.id !== before.study.id
    || after.study.revision <= before.study.revision
    || after.reference.dnaStatus !== 'review_required'
    || after.study.dnaStatus !== 'review_required'
  ) return false
  const previousVersionIds = new Set(before.dnaVersions.map((record) => record.id))
  const expectedVersion = before.dnaVersions.reduce((maximum, record) => Math.max(maximum, record.version), 0) + 1
  return after.dnaVersions.some((record) => (
    !previousVersionIds.has(record.id)
    && record.studySessionId === before.study.id
    && record.version === expectedVersion
    && record.status === 'review_required'
    && record.qaStatus === 'not_run'
    && record.adaptedNotCopied === true
    && record.inputEvidenceRevisions.length > 0
    && new Set(record.inputEvidenceRevisions.map((binding) => binding.evidenceId)).size === record.inputEvidenceRevisions.length
    && record.inputEvidenceRevisions.every((binding) => after.evidence.some((evidence) => (
      evidence.id === binding.evidenceId && evidence.revision === binding.revision
    )))
    && /^[a-f0-9]{64}$/.test(record.inputEvidenceDigest)
    && /^[a-f0-9]{64}$/.test(record.contentDigest)
  ))
}

function exactDNAQACommitted(
  before: EditReferenceDetail,
  after: EditReferenceDetail,
  dnaVersionId: string,
  request: RunEditReferenceDNAQARequest,
): boolean {
  if (
    after.reference.id !== before.reference.id
    || after.study.id !== before.study.id
    || after.study.revision <= request.expectedStudyRevision
  ) return false
  const version = after.dnaVersions.find((record) => (
    record.id === dnaVersionId
    && record.studySessionId === before.study.id
    && record.contentDigest === request.expectedDNAContentDigest
    && record.qaStatus !== 'not_run'
    && Boolean(record.qaResultId)
  ))
  if (!version?.qaResultId) return false
  const previousQAResultIds = new Set(before.dnaQaResults.map((record) => record.id))
  return after.dnaQaResults.some((record) => (
    record.id === version.qaResultId
    && !previousQAResultIds.has(record.id)
    && record.studySessionId === before.study.id
    && record.dnaVersionId === version.id
    && record.dnaContentDigest === request.expectedDNAContentDigest
    && record.status === version.qaStatus
  ))
}

function exactLongFormReviewCommitted(
  before: EditReferenceLongFormStudyReviewData,
  after: EditReferenceLongFormStudyReviewData,
  request: ApplyEditReferenceLongFormStudyReviewRequest,
): boolean {
  const exactDecisions = (decisions: ApplyEditReferenceLongFormStudyReviewRequest['decisions']) => (
    stableEditReferenceJson([...decisions].sort((left, right) => left.findingId.localeCompare(right.findingId)))
  )
  return after.editReferenceId === before.editReferenceId
    && after.studySessionId === before.studySessionId
    && after.referenceAssetId === before.referenceAssetId
    && after.reviewPackageId === before.reviewPackageId
    && after.reviewPackageDigestSha256 === request.expectedReviewPackageDigestSha256
    && after.studyRevision > request.expectedStudyRevision
    && after.selection.status === 'selected'
    && Boolean(after.selection.selectionReceiptId?.trim())
    && exactDecisions(after.selection.decisions) === exactDecisions(request.decisions)
}

function StudyChat({ detail, disabled, onChanged, setBusy, setError }: {
  detail: EditReferenceDetail
  disabled: boolean
  onChanged: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [message, setMessage] = useState('')
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)
  const [evidenceFormMode, setEvidenceFormMode] = useState<EvidenceFormMode>('manual_user_evidence')
  const [findingCorrectionEvidenceId, setFindingCorrectionEvidenceId] = useState('')
  const [acknowledgedApprovalKey, setAcknowledgedApprovalKey] = useState('')
  const [acknowledgedReasoningReviewKey, setAcknowledgedReasoningReviewKey] = useState('')
  const orderedMessages = useMemo(() => detail.messages.slice().sort((left, right) => left.sequence - right.sequence), [detail.messages])
  const visibleMessages = useMemo(() => orderedMessages.filter((item) => item.role !== 'system'), [orderedMessages])
  const studyChatReasoning = useMemo(
    () => detail.studyChatReasoning ?? [],
    [detail.studyChatReasoning],
  )
  const reasoningByUserMessageId = useMemo(() => new Map(
    studyChatReasoning.map((status) => [status.userMessageId, status] as const),
  ), [studyChatReasoning])
  const activeReasoningKey = useMemo(() => createEditReferenceDeterministicHash(
    studyChatReasoning
      .filter((status) => ['queued', 'thinking', 'waiting'].includes(status.state))
      .map((status) => ({ attemptId: status.attemptId, state: status.state, updatedAt: status.updatedAt })),
  ), [studyChatReasoning])
  const sourceEvidence = useMemo(() => detail.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence'), [detail.evidence])
  const supersededSourceIds = useMemo(() => new Set(sourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean)), [sourceEvidence])
  const activeSourceEvidence = useMemo(() => sourceEvidence.filter((record) => !supersededSourceIds.has(record.id)), [sourceEvidence, supersededSourceIds])
  const correctableChatEvidence = useMemo(() => activeSourceEvidence.filter((record) => record.sourceType === 'manual_user_evidence'), [activeSourceEvidence])
  const latestOrchestrationId = detail.skillRuns.at(-1)?.orchestrationId
  const latestSkillRuns = useMemo(() => detail.skillRuns.filter((record) => (
    latestOrchestrationId && record.orchestrationId === latestOrchestrationId
  )), [detail.skillRuns, latestOrchestrationId])
  const blockedSkillRuns = useMemo(() => latestSkillRuns.filter((record) => (
    ['blocked', 'needs_more_evidence'].includes(resolvePreferenceSkillRunResultState(record))
  )), [latestSkillRuns])
  const currentDNAVersion = useMemo(() => detail.reference.dnaStatus === 'not_generated'
    ? undefined
    : detail.dnaVersions
      .filter((record) => record.status !== 'superseded')
      .sort((left, right) => right.version - left.version)[0], [detail.dnaVersions, detail.reference.dnaStatus])
  const currentQAResult = useMemo(() => currentDNAVersion
    ? detail.dnaQaResults.find((record) => record.id === currentDNAVersion.qaResultId)
    : undefined, [currentDNAVersion, detail.dnaQaResults])
  const approvalKey = currentDNAVersion && currentQAResult ? `${currentDNAVersion.id}:${currentQAResult.id}` : ''
  const approvalAcknowledged = Boolean(approvalKey) && acknowledgedApprovalKey === approvalKey
  const reasoningReviewKey = currentDNAVersion?.reasoningReview && approvalKey
    ? `${approvalKey}:${currentDNAVersion.reasoningReview.approvalBindingDigestSha256}`
    : ''

  useEffect(() => {
    const hasActiveReasoning = studyChatReasoning.some(
      (status) => ['queued', 'thinking', 'waiting'].includes(status.state),
    )
    if (!hasActiveReasoning) return undefined
    let cancelled = false
    let reading = false
    const timer = window.setInterval(() => {
      if (cancelled || reading) return
      reading = true
      void api.get(workspaceId, detail.reference.id).then(async (response) => {
        if (!cancelled && response.ok) {
          const nextKey = createEditReferenceDeterministicHash({
            messages: response.data.detail.messages.map((record) => record.id),
            reasoning: response.data.detail.studyChatReasoning ?? [],
          })
          const currentKey = createEditReferenceDeterministicHash({
            messages: detail.messages.map((record) => record.id),
            reasoning: studyChatReasoning,
          })
          if (nextKey !== currentKey) await onChanged(response.data.detail)
        }
      }).finally(() => {
        reading = false
      })
    }, 3_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [activeReasoningKey, detail.messages, detail.reference.id, onChanged, studyChatReasoning, workspaceId])
  const reasoningReviewAcknowledged = !reasoningReviewKey || acknowledgedReasoningReviewKey === reasoningReviewKey
  const findings = useMemo(() => detail.evidence.filter((record) => (
    record.sourceType === 'derived_skill_evidence'
    && (!latestOrchestrationId || record.orchestrationId === latestOrchestrationId)
  )), [detail.evidence, latestOrchestrationId])
  const studyRunReady = detail.study.status === 'ready_to_study'
  const retryStudyAvailable = !currentDNAVersion
    && latestSkillRuns.some(preferenceSkillRunCanRetry)
    && ['evidence_ready', 'needs_clarification', 'needs_user_review'].includes(detail.study.status)
  const assetByPrivateId = useMemo(() => new Map(detail.assets.map((asset) => [asset.privateAssetId, asset])), [detail.assets])
  const videoAssets = useMemo(() => detail.assets.filter((asset) => asset.assetKind === 'reference_video_metadata'), [detail.assets])
  const activeLongFormStudy = videoAssets.some((asset) => asset.longFormStudy
    && ['queued', 'running', 'paused'].includes(asset.longFormStudy.state))
  const pausedLongFormStudy = videoAssets.some((asset) => asset.longFormStudy?.state === 'paused')
  const longFormStudyNeedsRecovery = videoAssets.some((asset) => asset.longFormStudy?.operatorReviewRequired)

  const openEvidenceForm = (mode: EvidenceFormMode) => {
    setEvidenceFormMode(mode)
    setShowEvidenceForm(true)
  }

  const focusStudyChat = () => {
    setShowEvidenceForm(false)
    window.requestAnimationFrame(() => messageRef.current?.focus())
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const content = message.trim()
    if (!content) return
    setBusy(true)
    setError(undefined)
    const clientMessageId = `study-chat-${createEditReferenceDeterministicHash({
      studyId: detail.study.id,
      expectedStudyRevision: detail.study.revision,
      content,
      findingCorrectionEvidenceId: findingCorrectionEvidenceId || null,
    })}`
    const appendRequest: AppendPreferenceStudyMessageRequest = {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
      clientMessageId,
      content,
      ...(findingCorrectionEvidenceId ? { findingCorrectionEvidenceId } : {}),
    }
    const response = await api.appendMessage(
      detail.study.id,
      appendRequest,
      `edit-reference-message-${clientMessageId}`,
    )
    const appendFailureMessage = response.ok
      ? 'The Study Chat message could not be verified. It remains here so you can retry safely.'
      : response.message
    let savedDetail = response.ok ? response.data.detail : undefined
    if (!savedDetail) {
      const readback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
      if (readback && exactStudyMessageCommitted(detail, readback, appendRequest)) savedDetail = readback
    }
    if (savedDetail) {
      setMessage('')
      setFindingCorrectionEvidenceId('')
      await onChanged(savedDetail)
    } else setError(appendFailureMessage)
    setBusy(false)
  }

  const runEvidenceStudy = async (retryBlockedSkills = false) => {
    setBusy(true)
    setError(undefined)
    const studyRequest: RunPreferenceEvidenceStudyRequest = {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
      ...(retryBlockedSkills ? { retryBlockedSkills: true as const } : {}),
    }
    const studyIdempotencyKey = `edit-reference-study-${createEditReferenceDeterministicHash({
      studyId: detail.study.id,
      ...studyRequest,
    })}`
    const response = await api.runEvidenceStudy(detail.study.id, studyRequest, studyIdempotencyKey)
    const studyFailureMessage = response.ok
      ? 'The evidence study result could not be verified. Check the saved study state before retrying.'
      : response.message
    let studiedDetail = response.ok ? response.data.detail : undefined
    if (!studiedDetail) {
      const readback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
      if (readback && exactEvidenceStudyCommitted(detail, readback)) studiedDetail = readback
    }
    if (studiedDetail) await onChanged(studiedDetail)
    else setError(studyFailureMessage)
    setBusy(false)
  }

  const synthesizePreferenceDNA = async () => {
    setBusy(true)
    setError(undefined)
    const synthesisRequest: SynthesizePreferenceDNARequest = {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
    }
    const synthesisIdempotencyKey = `edit-reference-dna-${createEditReferenceDeterministicHash({
      studyId: detail.study.id,
      ...synthesisRequest,
    })}`
    const response = await api.synthesizePreferenceDNA(detail.study.id, synthesisRequest, synthesisIdempotencyKey)
    const synthesisFailureMessage = response.ok
      ? 'The new guidance version could not be verified. Check the saved study state before retrying.'
      : response.message
    let synthesizedDetail = response.ok ? response.data.detail : undefined
    if (!synthesizedDetail) {
      const readback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
      if (readback && exactDNASynthesisCommitted(detail, readback)) synthesizedDetail = readback
    }
    if (synthesizedDetail) await onChanged(synthesizedDetail)
    else setError(synthesisFailureMessage)
    setBusy(false)
  }

  const runPreferenceDNAQA = async () => {
    if (!currentDNAVersion) return
    setBusy(true)
    setError(undefined)
    const qaRequest: RunEditReferenceDNAQARequest = {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
      expectedDNAContentDigest: currentDNAVersion.contentDigest,
    }
    const qaIdempotencyKey = `edit-reference-dna-qa-${createEditReferenceDeterministicHash({
      studyId: detail.study.id,
      dnaVersionId: currentDNAVersion.id,
      ...qaRequest,
    })}`
    const response = await api.runPreferenceDNAQA(
      detail.study.id,
      currentDNAVersion.id,
      qaRequest,
      qaIdempotencyKey,
    )
    const qaFailureMessage = response.ok
      ? 'The quality-review result could not be verified. Check the saved study state before retrying.'
      : response.message
    let reviewedDetail = response.ok ? response.data.detail : undefined
    if (!reviewedDetail) {
      const readback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
      if (
        readback
        && exactDNAQACommitted(detail, readback, currentDNAVersion.id, qaRequest)
      ) reviewedDetail = readback
    }
    if (reviewedDetail) await onChanged(reviewedDetail)
    else setError(qaFailureMessage)
    setBusy(false)
  }

  const approvePreferenceDNA = async () => {
    if (!currentDNAVersion || !currentQAResult || !approvalAcknowledged || !reasoningReviewAcknowledged) return
    setBusy(true)
    setError(undefined)
    const approvalRequest: ApproveEditReferenceDNAVersionRequest = {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
      expectedDNAContentDigest: currentDNAVersion.contentDigest,
      qaResultId: currentQAResult.id,
      acknowledgeAdaptNotCopy: true,
      acknowledgeQAReview: currentQAResult.status === 'requires_user_review',
      ...(currentDNAVersion.reasoningReview ? {
        reasoningReviewAcknowledgement: {
          schemaVersion: 'edit-reference-qwen-dna-approval-request-v1' as const,
          expectedApprovalBindingDigestSha256: currentDNAVersion.reasoningReview.approvalBindingDigestSha256,
          acknowledgeAiAssistedSynthesis: true as const,
          acknowledgeConfidenceAndLimitations: true as const,
        },
      } : {}),
    }
    const approvalIdempotencyKey = `edit-reference-approve-${currentDNAVersion.id}-${createEditReferenceDeterministicHash(approvalRequest)}`.slice(0, 200)
    const response = await api.approvePreferenceDNA(
      detail.study.id,
      currentDNAVersion.id,
      approvalRequest,
      approvalIdempotencyKey,
    )
    if (response.ok) {
      await onChanged(response.data.detail)
    } else {
      const readback = await api.get(workspaceId, detail.reference.id)
      const committedVersion = readback.ok
        ? readback.data.detail.dnaVersions.find((version) => (
            version.id === currentDNAVersion.id
            && version.status === 'approved'
            && version.contentDigest === currentDNAVersion.contentDigest
            && version.approval?.qaResultId === currentQAResult.id
            && (
              !currentDNAVersion.reasoningReview
              || version.approval?.reasoningReview?.approvalBindingDigestSha256
                === currentDNAVersion.reasoningReview.approvalBindingDigestSha256
            )
          ))
        : undefined
      if (readback.ok && committedVersion) await onChanged(readback.data.detail)
      else setError(response.message)
    }
    setBusy(false)
  }

  return (
    <div className={`edit-reference-chat-shell ${showEvidenceForm ? 'is-focused-form' : ''}`} data-testid="edit-reference-study-chat">
      {!showEvidenceForm ? (
        <div className="edit-reference-message-list" aria-label="Preference study conversation">
          {visibleMessages.map((item) => (
            <article className={`edit-reference-message ${item.role}`} data-testid={`study-message-${item.role}`} key={item.id}>
              <span>{item.role === 'assistant' ? 'ReEditPro' : 'You'}</span>
              <p>{item.content}</p>
              {item.role === 'user' && reasoningByUserMessageId.get(item.id)?.state !== 'answered' ? (
                <small
                  className="edit-reference-reasoning-status"
                  data-state={reasoningByUserMessageId.get(item.id)?.state}
                  role="status"
                >
                  {reasoningByUserMessageId.get(item.id)?.statusText}
                </small>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {!showEvidenceForm ? (
        <p aria-atomic="true" aria-live="polite" className="sr-only">
          {visibleMessages.at(-1)?.role === 'assistant' ? visibleMessages.at(-1)?.content : ''}
        </p>
      ) : null}
      <section className="edit-reference-evidence-workspace" aria-label="Study evidence">
        {showEvidenceForm ? (
          <div className="edit-reference-focused-source-step">
            <header>
              <div>
                <span className="section-eyebrow">Add to this preference</span>
                <strong>{evidenceFormMode === 'reference_video_metadata'
                  ? 'Add a reference video'
                  : evidenceFormMode === 'previous_approved_edit_snapshot'
                    ? 'Choose an approved edit'
                    : 'Add a creative note'}</strong>
                <p>Nothing is studied or applied until you save this step.</p>
              </div>
              <Button icon={ArrowLeft} onClick={() => setShowEvidenceForm(false)} size="sm" variant="ghost">Back</Button>
            </header>
            <EvidenceForm
              detail={detail}
              disabled={disabled}
              initialMode={evidenceFormMode}
              key={`${detail.study.id}:${evidenceFormMode}`}
              onAdded={async (next) => {
                setShowEvidenceForm(false)
                await onChanged(next)
              }}
              setBusy={setBusy}
              setError={setError}
            />
          </div>
        ) : (
          <>
        {activeSourceEvidence.length === 0 ? (
          <div className="edit-reference-start-study" data-testid="edit-reference-start-study">
            <div>
              <strong>Add a reference when it helps</strong>
              <p>You can keep talking, upload a video you like, or use one of your approved edits.</p>
            </div>
            <div>
              <Button icon={FileVideo2} onClick={() => openEvidenceForm('reference_video_metadata')} size="sm" variant="primary">Upload video</Button>
              <Button icon={History} onClick={() => openEvidenceForm('previous_approved_edit_snapshot')} size="sm" variant="ghost">Use approved edit</Button>
            </div>
          </div>
        ) : null}
        {activeSourceEvidence.length > 0 ? <div className="edit-reference-evidence-toolbar">
          <div>
            <ClipboardList aria-hidden="true" size={18} />
            <div className="edit-reference-findings-list">
              <strong>{activeSourceEvidence.length} study input{activeSourceEvidence.length === 1 ? '' : 's'} saved</strong>
              <span>{userFacingStudyAction(toEditReferenceInspectorView(detail).nextAction)}</span>
            </div>
          </div>
          <div>
            <Button data-testid="add-edit-reference-source" disabled={disabled || detail.reference.status === 'archived'} icon={Plus} onClick={() => openEvidenceForm('reference_video_metadata')} size="sm" variant="ghost">
              Add reference
            </Button>
            <Button
              data-testid="run-edit-reference-evidence-study"
              disabled={disabled || activeSourceEvidence.length === 0 || (!studyRunReady && !retryStudyAvailable) || detail.reference.status === 'archived'}
              icon={SearchCheck}
              onClick={() => void runEvidenceStudy(retryStudyAvailable)}
              size="sm"
              variant={activeSourceEvidence.length > 0 && (studyRunReady || retryStudyAvailable) ? 'primary' : 'ghost'}
            >
              {disabled
                ? 'Studying…'
                : longFormStudyNeedsRecovery
                  ? 'Video study needs attention'
                  : activeLongFormStudy
                    ? pausedLongFormStudy ? 'Video study paused' : 'Video study in progress'
                    : studyRunReady
                      ? 'Start study'
                      : retryStudyAvailable
                        ? 'Retry study'
                        : 'Study complete'}
            </Button>
          </div>
        </div> : null}
        {sourceEvidence.length > 0 && (
          <details className="edit-reference-evidence-disclosure">
            <summary>
              <span>Review study inputs</span>
              <small>{sourceEvidence.length} saved</small>
            </summary>
            <div className="edit-reference-evidence-list" data-testid="edit-reference-evidence-list">
              {sourceEvidence.map((record) => (
                <article className={supersededSourceIds.has(record.id) ? 'superseded' : ''} key={record.id}>
                  <span>{record.supersedesEvidenceId ? 'Correction' : evidenceSourceLabel(record.sourceType)}</span>
                  <strong>{record.title}</strong>
                  <p>{record.summary}</p>
                  <small>{supersededSourceIds.has(record.id) ? 'Superseded by a correction' : `${record.category.replaceAll('_', ' ')} · ${sourceEvidenceStudyLabel(record, assetByPrivateId.get(record.provenance.privateAssetId ?? ''))}`}</small>
                </article>
              ))}
            </div>
          </details>
        )}
        {videoAssets.length > 0 && (
          <div className="edit-reference-long-form-list" data-testid="edit-reference-long-form-list">
            {videoAssets.map((asset) => (
              <LongFormVideoStudyCard
                asset={asset}
                detail={detail}
                disabled={disabled}
                key={asset.id}
                onChanged={onChanged}
                setBusy={setBusy}
              />
            ))}
          </div>
        )}
        {findings.length > 0 && (
          <details className="edit-reference-findings" data-testid="edit-reference-study-findings" open={!currentDNAVersion}>
            <summary>
              <SearchCheck aria-hidden="true" size={18} />
              <span>
                <strong>{studyRunReady ? 'Previous findings need refresh' : 'Latest study findings'}</strong>
                <small>{studyRunReady
                  ? 'A saved correction changed the reference. Study it again before using the guidance.'
                  : 'Review the evidence and study limits.'}</small>
              </span>
              <small>{findings.length} finding{findings.length === 1 ? '' : 's'}</small>
            </summary>
            <div>
              {findings.map((record) => (
                <article className={record.transferability === 'do_not_copy' ? 'risk' : ''} key={record.id}>
                  <span>{record.category.replaceAll('_', ' ')}</span>
                  <p>{record.summary}</p>
                  <small>{evidenceRuntimeLabel(record.provenance.runtimeSource)}</small>
                </article>
              ))}
            </div>
            {blockedSkillRuns.length > 0 && (
              <div className="edit-reference-study-limits">
                <strong>What needs attention</strong>
                {blockedSkillRuns.map((run) => (
                  <p key={run.id}>
                    <span>{skillRunLabel(run.skillId)}</span>
                    <small>{preferenceSkillRunResultStateLabel(run)}</small>
                    {preferenceSkillRunBlockerMessage(run) ?? 'This part of the study is not available yet.'}
                  </p>
                ))}
              </div>
            )}
            {latestSkillRuns.length > 0 && (
              <div className="edit-reference-skill-provenance" data-testid="edit-reference-skill-provenance">
                <strong>How this study was prepared</strong>
                {latestSkillRuns.map((run) => (
                  <article data-result-state={resolvePreferenceSkillRunResultState(run)} key={run.id}>
                    <div>
                      <span>{skillRunLabel(run.skillId)}</span>
                      <small>{preferenceSkillRunResultStateLabel(run)}</small>
                    </div>
                    <p>{preferenceSkillRunDisplaySummary(run)}</p>
                    {preferenceSkillRunBlockerMessage(run) ? <small>{preferenceSkillRunBlockerMessage(run)}</small> : null}
                  </article>
                ))}
              </div>
            )}
          </details>
        )}
        {!currentDNAVersion && detail.study.status === 'evidence_ready' && (
          <div className="edit-reference-dna-action" data-testid="edit-reference-dna-action">
            <BrainCircuit aria-hidden="true" size={20} />
            <div>
              <strong>Your editing guidance is ready</strong>
              <p>Create a reviewable version from the studied evidence. Nothing is approved or applied yet.</p>
            </div>
            <Button data-testid="generate-edit-reference-dna" disabled={disabled} icon={Sparkles} onClick={() => void synthesizePreferenceDNA()} size="sm" variant="primary">
              {disabled ? 'Preparing…' : 'Review guidance'}
            </Button>
          </div>
        )}
        {currentDNAVersion && (
          <PreferenceDNAReview
            approvalAcknowledged={approvalAcknowledged}
            disabled={disabled}
            onApprovalAcknowledged={(value) => setAcknowledgedApprovalKey(value ? approvalKey : '')}
            onReasoningReviewAcknowledged={(value) => setAcknowledgedReasoningReviewKey(value ? reasoningReviewKey : '')}
            onApprove={() => void approvePreferenceDNA()}
            onCorrect={focusStudyChat}
            onRunQA={() => void runPreferenceDNAQA()}
            qaResult={currentQAResult}
            reasoningReviewAcknowledged={reasoningReviewAcknowledged}
            version={currentDNAVersion}
          />
        )}
          </>
        )}
      </section>
      {!showEvidenceForm ? <form className="edit-reference-chat-composer" onSubmit={send}>
        {findings.length > 0 && correctableChatEvidence.length > 0 ? (
          <details className="edit-reference-chat-correction">
            <summary>Correct a saved direction</summary>
            <label>
              <span className="sr-only">Finding to correct</span>
              <select
                data-testid="edit-reference-study-correction-source"
                disabled={disabled}
                onChange={(event) => setFindingCorrectionEvidenceId(event.target.value)}
                value={findingCorrectionEvidenceId}
              >
                <option value="">Save as new direction</option>
                {correctableChatEvidence.map((record) => (
                  <option key={record.id} value={record.id}>Correct “{record.title}”</option>
                ))}
              </select>
            </label>
          </details>
        ) : null}
        <label className="sr-only" htmlFor="edit-reference-study-message">Message ReEditPro</label>
        <textarea
          data-testid="edit-reference-study-message"
          disabled={disabled || detail.reference.status === 'archived'}
          id="edit-reference-study-message"
          maxLength={8_000}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell ReEditPro how you want videos edited…"
          ref={messageRef}
          rows={2}
          value={message}
        />
        <Button data-testid="send-edit-reference-study-message" disabled={disabled || !message.trim() || detail.reference.status === 'archived'} icon={Send} type="submit" variant="primary">
          {disabled ? 'Sending…' : findingCorrectionEvidenceId ? 'Save correction' : 'Send'}
        </Button>
      </form> : null}
    </div>
  )
}

function LongFormVideoStudyCard({ asset, detail, disabled, onChanged, setBusy }: {
  asset: PreferenceAssetRecord
  detail: EditReferenceDetail
  disabled: boolean
  onChanged: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
}) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [summary, setSummary] = useState<PreferenceLongFormStudySummary | undefined>(asset.longFormStudy)
  const [refreshing, setRefreshing] = useState(false)
  const [statusError, setStatusError] = useState<string>()
  const [controlNotice, setControlNotice] = useState<string>()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [review, setReview] = useState<EditReferenceLongFormStudyReviewData>()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const finalizedVideoAvailable = Boolean(asset.storageObjectRecordId && asset.mediaAssetId)
  const pollingRunId = summary?.runId
  const pollingState = summary?.state

  useEffect(() => {
    if (!pollingRunId || !pollingState || !(
      ['queued', 'running'].includes(pollingState)
      || (pollingState === 'paused' && (summary?.runningWorkItemCount ?? 0) > 0)
    )) return
    let disposed = false
    let timeoutId: number | undefined

    const schedule = (delayMs: number) => {
      if (!disposed) timeoutId = window.setTimeout(() => { void poll() }, delayMs)
    }
    const poll = async () => {
      const response = await api.getLongFormStudy(workspaceId, detail.study.id, asset.id)
      if (disposed) return
      if (!response.ok) {
        setStatusError('Progress could not be refreshed. Completed study sections remain saved; ReEditPro will try again.')
        schedule(document.visibilityState === 'visible' ? 12_000 : 30_000)
        return
      }
      setSummary(response.data.study)
      setStatusError(undefined)
      if (
        ['queued', 'running'].includes(response.data.study.state)
        || (response.data.study.state === 'paused' && response.data.study.runningWorkItemCount > 0)
      ) {
        schedule(document.visibilityState === 'visible' ? 3_500 : 15_000)
      }
    }

    schedule(1_500)
    return () => {
      disposed = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [asset.id, detail.study.id, pollingRunId, pollingState, summary?.runningWorkItemCount, workspaceId])

  const startStudy = async () => {
    setBusy(true)
    setRefreshing(true)
    setStatusError(undefined)
    setControlNotice(undefined)
    const response = await api.startLongFormStudy(detail.study.id, asset.id, {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
    })
    let confirmedSummary = response.ok ? response.data.study : undefined
    let recoveredLostResponse = false
    if (!confirmedSummary) {
      const readback = await api.getLongFormStudy(workspaceId, detail.study.id, asset.id)
      if (readback.ok) {
        confirmedSummary = readback.data.study
        recoveredLostResponse = true
      }
    }
    if (!confirmedSummary) {
      if (response.ok) {
        setStatusError('The study start could not be read back safely. Check progress before trying again.')
      } else {
        setStatusError(response.message)
      }
      setRefreshing(false)
      setBusy(false)
      return
    }
    setSummary(confirmedSummary)
    if (recoveredLostResponse) {
      setControlNotice('Study start confirmed after the connection interrupted. No second study run was created.')
    }
    const refreshedDetail = await api.get(workspaceId, detail.reference.id)
    if (refreshedDetail.ok) await onChanged(refreshedDetail.data.detail)
    else setStatusError('The study started, but the page could not refresh its saved reference details. Check progress again safely.')
    setRefreshing(false)
    setBusy(false)
  }

  const refreshStudy = async () => {
    if (!summary) return
    setRefreshing(true)
    setStatusError(undefined)
    const response = await api.getLongFormStudy(workspaceId, detail.study.id, asset.id)
    if (response.ok) setSummary(response.data.study)
    else setStatusError('Progress could not be refreshed. Completed study sections remain saved; try again when the connection returns.')
    setRefreshing(false)
  }

  const controlStudy = async (action: EditReferenceLongFormStudyControlAction) => {
    if (!summary) return
    setBusy(true)
    setRefreshing(true)
    setStatusError(undefined)
    setControlNotice(undefined)
    const priorSummary = summary
    let response = await api.controlLongFormStudy(detail.study.id, asset.id, {
      workspaceId,
      expectedRunRevision: summary.runRevision,
      action,
    }, `long-form-control-${action}-${crypto.randomUUID()}`)
    let confirmedReadback: PreferenceLongFormStudySummary | undefined
    if (!response.ok) {
      const current = await api.getLongFormStudy(workspaceId, detail.study.id, asset.id)
      if (current.ok) {
        setSummary(current.data.study)
        if (longFormStudyControlWasApplied(priorSummary, current.data.study, action)) {
          confirmedReadback = current.data.study
        } else if (response.code === 'VERSION_CONFLICT' && longFormStudyControlIsAllowed(current.data.study, action)) {
          response = await api.controlLongFormStudy(detail.study.id, asset.id, {
            workspaceId,
            expectedRunRevision: current.data.study.runRevision,
            action,
          }, `long-form-control-${action}-${crypto.randomUUID()}`)
        }
      }
    }
    if (confirmedReadback) {
      setSummary(confirmedReadback)
      setConfirmCancel(false)
      setControlNotice(longFormStudyLostResponseNotice(action))
    } else if (!response.ok) {
      setStatusError(response.message)
      setRefreshing(false)
      setBusy(false)
      return
    } else {
      setSummary(response.data.study)
      setConfirmCancel(false)
      setControlNotice(action === 'pause'
        ? response.data.control.activeWorkFinishesBeforePause
          ? 'Pause saved. The active bounded step will finish, then the study will remain paused.'
          : 'Study paused. Completed checkpoints are safe.'
        : action === 'resume'
          ? 'Study resumed from the last verified checkpoint.'
          : action === 'recover'
            ? `${response.data.control.recoveredWorkItemCount} blocked study step${response.data.control.recoveredWorkItemCount === 1 ? '' : 's'} authorized for a bounded retry.`
            : 'Study cancelled. No new step will start.')
    }
    const refreshedDetail = await api.get(workspaceId, detail.reference.id)
    if (refreshedDetail.ok) await onChanged(refreshedDetail.data.detail)
    else setStatusError('The study action was saved, but the page could not refresh its reference details. Check progress again safely.')
    setRefreshing(false)
    setBusy(false)
  }

  const openReview = async () => {
    if (review) {
      setReviewOpen(true)
      return
    }
    setReviewLoading(true)
    setStatusError(undefined)
    const response = await api.getLongFormStudyReview(workspaceId, detail.study.id, asset.id)
    if (!response.ok) {
      setStatusError(response.code === 'LONG_FORM_STUDY_REVIEW_NOT_READY'
        ? 'The complete study review is still being prepared. Check progress, then try again without restarting the study.'
        : response.message)
      setReviewLoading(false)
      return
    }
    setReview(response.data)
    setReviewOpen(true)
    setReviewLoading(false)
  }

  const saveReview = async (input: Pick<
    ApplyEditReferenceLongFormStudyReviewRequest,
    'decisions' | 'acknowledgeAdaptNotCopy' | 'acknowledgeFactSafetyReview'
  >): Promise<EditReferenceLongFormReviewSaveResult> => {
    if (!review) return { ok: false, message: 'The saved study review is no longer available. Close it and open the review again.' }
    setBusy(true)
    try {
      const reviewRequest: ApplyEditReferenceLongFormStudyReviewRequest = {
        workspaceId,
        expectedStudyRevision: review.studyRevision,
        expectedReviewPackageDigestSha256: review.reviewPackageDigestSha256,
        ...input,
      }
      const reviewIdempotencyKey = `long-form-review-${createEditReferenceDeterministicHash({
        studyId: detail.study.id,
        referenceAssetId: asset.id,
        ...reviewRequest,
      })}`
      const response = await api.applyLongFormStudyReview(
        detail.study.id,
        asset.id,
        reviewRequest,
        reviewIdempotencyKey,
      )
      let savedReview = response.ok ? response.data.review : undefined
      let savedDetail = response.ok ? response.data.detail.detail : undefined
      if (!savedReview) {
        const readback = await api.getLongFormStudyReview(workspaceId, detail.study.id, asset.id)
        if (readback.ok && exactLongFormReviewCommitted(review, readback.data, reviewRequest)) {
          savedReview = readback.data
          const detailReadback = await readEditReferenceAfterUncertainMutation(workspaceId, detail.reference.id)
          if (detailReadback) savedDetail = detailReadback
          else setStatusError('Your study choices were saved, but this page could not refresh the new guidance yet. Refresh safely to continue.')
        }
      }
      if (!savedReview) return { ok: false, message: response.ok ? 'The saved review could not be verified.' : response.message }
      setReview(savedReview)
      if (savedDetail) await onChanged(savedDetail)
      return { ok: true }
    } catch {
      return { ok: false, message: 'The review could not be saved. Your choices remain available in this page.' }
    } finally {
      setBusy(false)
    }
  }

  const durationLabel = summary ? formatStudyDuration(summary.sourceDurationSeconds) : undefined
  const sizeLabel = summary ? formatStudyBytes(summary.sourceSizeBytes) : undefined
  const stateLabel = summary ? longFormStudyStateLabel(summary) : 'Ready to prepare'
  const progressLabel = summary
    ? `${formatStudyPercent(summary.progressPercent)} · ${summary.completedWorkItemCount} of ${summary.totalWorkItemCount} study steps complete`
    : 'No whole-video study has started yet.'

  return (
    <article
      className="edit-reference-long-form-card"
      data-state={summary?.state ?? 'not_started'}
      data-testid={`edit-reference-long-form-study-${asset.id}`}
    >
      <header>
        <div>
          <FileVideo2 aria-hidden="true" size={18} />
          <div>
            <span>Whole-video study</span>
            <strong>{asset.label}</strong>
          </div>
        </div>
        <Badge accent={summary?.fullyStudied ? 'success' : summary?.operatorReviewRequired ? 'warning' : summary ? 'cyan' : 'muted'}>
          {stateLabel}
        </Badge>
      </header>

      {reviewOpen && review ? (
        <EditReferenceLongFormReviewPanel
          disabled={disabled}
          key={`${review.reviewPackageDigestSha256}:${review.selection.status}`}
          onClose={() => setReviewOpen(false)}
          onSave={saveReview}
          review={review}
        />
      ) : summary ? (
        <>
          <div className="edit-reference-long-form-progress" aria-live="polite">
            <div>
              <strong>{summary.phaseLabel}</strong>
              <span>{progressLabel}</span>
            </div>
            <progress aria-label={`Whole-video study ${formatStudyPercent(summary.progressPercent)}`} max="100" value={summary.progressPercent} />
          </div>
          <div className="edit-reference-long-form-metrics">
            <span><strong>{durationLabel}</strong> source</span>
            <span><strong>{sizeLabel}</strong> original</span>
            <span><strong>{summary.chunkCount}</strong> checkpointed section{summary.chunkCount === 1 ? '' : 's'}</span>
            <span><strong>{formatStudyPercent(summary.temporalCoverageRatio * 100)}</strong> timeline coverage</span>
          </div>
          <div className="edit-reference-long-form-eta">
            <strong>{summary.fullyStudied ? 'Full-video study verified' : `Estimated time remaining: ${formatStudyEtaRange(summary.etaLowerRemainingSeconds, summary.etaUpperRemainingSeconds)}`}</strong>
            <span>{summary.fullyStudied
              ? 'Every required section, whole-story reconciliation, and coverage check passed.'
              : summary.state === 'running' && summary.runningWorkItemCount === 0 && summary.retryWaitWorkItemCount === 0
                ? 'Planning range for the remaining work. Timing resumes when the next required analysis step is available.'
                : summary.etaConfidence === 'planning'
                  ? 'Planning range based on source duration. It will update from completed sections.'
                  : 'Range updated from completed sections; difficult footage can take longer.'}</span>
          </div>
          <div className="edit-reference-long-form-safety">
            <ShieldCheck aria-hidden="true" size={17} />
            <span>The original stays unchanged. ReEditPro studies a smaller analysis copy in bounded sections and saves each verified checkpoint. You can leave this page and return without restarting completed work.</span>
          </div>
          {summary.durationClass !== 'short' && (
            <p className="edit-reference-long-form-standard">
              {summary.durationClass === 'extended'
                ? 'Extended-video standard'
                : summary.durationClass === 'long'
                  ? 'Long-video standard'
                  : 'Standard-video study'}: the full timeline is divided into roughly 10-minute sections, then reconciled as one story. Sampling alone cannot mark this video fully studied.
            </p>
          )}
          {summary.retryWaitWorkItemCount > 0 && (
            <p className="edit-reference-long-form-notice">{summary.retryWaitWorkItemCount} study step{summary.retryWaitWorkItemCount === 1 ? '' : 's'} will resume from the last verified checkpoint.</p>
          )}
          {summary.state === 'paused' && summary.runningWorkItemCount > 0 && (
            <p className="edit-reference-long-form-notice">Pause is saved. The active bounded step is finishing safely; no new step will start afterward.</p>
          )}
          {summary.state === 'running' && summary.runningWorkItemCount === 0 && summary.retryWaitWorkItemCount === 0 && !summary.fullyStudied && (
            <p className="edit-reference-long-form-notice">No study step is running right now. The checkpoint is safe, and ReEditPro will continue from completed work when the next required analysis step is available.</p>
          )}
          {summary.operatorReviewRequired && (
            <p className="edit-reference-long-form-notice warning">Completed sections are safe. A recovery review is required before the remaining work can continue; ReEditPro will not discard the source or start over silently.</p>
          )}
          {controlNotice && <p className="edit-reference-long-form-notice success" role="status">{controlNotice}</p>}
          {statusError && <p className="edit-reference-long-form-notice warning" role="status">{statusError}</p>}
          {confirmCancel && (
            <div className="edit-reference-long-form-cancel-confirmation" role="alert">
              <div>
                <strong>Cancel this study?</strong>
                <span>The original video and completed checkpoints stay retained, but this study cannot be resumed after cancellation.</span>
              </div>
              <div>
                <Button disabled={disabled || refreshing} onClick={() => setConfirmCancel(false)} size="sm" variant="ghost">Keep studying</Button>
                <Button disabled={disabled || refreshing} icon={XCircle} onClick={() => void controlStudy('cancel')} size="sm" variant="danger">Cancel study</Button>
              </div>
            </div>
          )}
          <div className="edit-reference-long-form-actions">
            <Button disabled={disabled || refreshing} icon={RefreshCw} onClick={() => void refreshStudy()} size="sm" variant="ghost">
              {refreshing ? 'Checking…' : 'Check progress'}
            </Button>
            {summary.controls.canPause && (
              <Button data-testid={`pause-edit-reference-long-form-study-${asset.id}`} disabled={disabled || refreshing} icon={Pause} onClick={() => void controlStudy('pause')} size="sm" variant="secondary">
                Pause safely
              </Button>
            )}
            {summary.controls.canResume && (
              <Button data-testid={`resume-edit-reference-long-form-study-${asset.id}`} disabled={disabled || refreshing} icon={Play} onClick={() => void controlStudy('resume')} size="sm" variant="primary">
                Resume study
              </Button>
            )}
            {summary.controls.canRecover && (
              <Button data-testid={`recover-edit-reference-long-form-study-${asset.id}`} disabled={disabled || refreshing} icon={RotateCcw} onClick={() => void controlStudy('recover')} size="sm" variant="primary">
                Retry blocked steps
              </Button>
            )}
            {summary.controls.canCancel && !confirmCancel && (
              <Button data-testid={`cancel-edit-reference-long-form-study-${asset.id}`} disabled={disabled || refreshing} icon={XCircle} onClick={() => setConfirmCancel(true)} size="sm" variant="ghost">
                Cancel
              </Button>
            )}
            {summary.fullyStudied && (
              <Button
                aria-expanded={reviewOpen}
                data-testid={`review-edit-reference-long-form-study-${asset.id}`}
                disabled={disabled || refreshing || reviewLoading}
                icon={FileCheck2}
                onClick={() => void openReview()}
                size="sm"
                variant="primary"
              >
                {reviewLoading ? 'Opening review…' : 'Review findings'}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="edit-reference-long-form-intro">
            ReEditPro will verify the exact private upload, create a smaller analysis copy, and study the complete timeline in recoverable sections. Large file size changes the transfer and analysis route—it does not reduce study coverage.
          </p>
          {!finalizedVideoAvailable && (
            <p className="edit-reference-long-form-notice warning">This entry contains video details only. Add the private video file as new evidence before starting the whole-video study.</p>
          )}
          {statusError && <p className="edit-reference-long-form-notice warning" role="status">{statusError}</p>}
          <div className="edit-reference-long-form-actions">
            <Button
              data-testid={`start-edit-reference-long-form-study-${asset.id}`}
              disabled={disabled || refreshing || !finalizedVideoAvailable || detail.reference.status === 'archived'}
              icon={SearchCheck}
              onClick={() => void startStudy()}
              size="sm"
              variant="primary"
            >
              {refreshing ? 'Preparing…' : 'Start whole-video study'}
            </Button>
          </div>
        </>
      )}
    </article>
  )
}

function longFormStudyControlIsAllowed(
  summary: PreferenceLongFormStudySummary,
  action: EditReferenceLongFormStudyControlAction,
): boolean {
  if (action === 'pause') return summary.controls.canPause
  if (action === 'resume') return summary.controls.canResume
  if (action === 'recover') return summary.controls.canRecover
  return summary.controls.canCancel
}

function longFormStudyControlWasApplied(
  before: PreferenceLongFormStudySummary,
  after: PreferenceLongFormStudySummary,
  action: EditReferenceLongFormStudyControlAction,
): boolean {
  if (after.runId !== before.runId || after.runRevision <= before.runRevision) return false
  if (action === 'pause') return after.state === 'paused'
  if (action === 'resume') return after.state === 'running' || after.state === 'completed'
  if (action === 'recover') {
    return (after.state === 'running' || after.state === 'completed')
      && !after.operatorReviewRequired
      && after.blockedWorkItemCount < before.blockedWorkItemCount
  }
  return after.state === 'cancelled'
}

function longFormStudyLostResponseNotice(action: EditReferenceLongFormStudyControlAction): string {
  if (action === 'pause') return 'Pause confirmed after the connection interrupted. Completed checkpoints remain safe.'
  if (action === 'resume') return 'Resume confirmed after the connection interrupted. The study continues from its saved checkpoint.'
  if (action === 'recover') return 'Recovery confirmed after the connection interrupted. Only the authorized blocked steps will retry.'
  return 'Cancellation confirmed after the connection interrupted. No new study step will start.'
}

function longFormStudyStateLabel(summary: PreferenceLongFormStudySummary): string {
  if (summary.fullyStudied) return 'Ready for review'
  if (summary.operatorReviewRequired || summary.state === 'needs_operator_review') return 'Recovery review'
  if (summary.state === 'queued') return 'Queued safely'
  if (summary.state === 'running' && summary.retryWaitWorkItemCount > 0) return 'Retry scheduled'
  if (summary.state === 'running' && summary.runningWorkItemCount === 0) return 'Waiting safely'
  if (summary.state === 'running') return 'Studying'
  if (summary.state === 'paused') return 'Paused safely'
  if (summary.state === 'cancelled') return 'Cancelled'
  return 'Verifying coverage'
}

function formatStudyPercent(value: number): string {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const displayed = safe === 100 ? 100 : Math.floor(safe * 10) / 10
  return `${Number.isInteger(displayed) ? displayed.toFixed(0) : displayed.toFixed(1)}%`
}

function formatStudyBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

function formatStudyDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const remainingSeconds = total % 60
  if (days) return `${days}d ${hours}h`
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${remainingSeconds}s`
  return `${remainingSeconds}s`
}

function formatStudyEtaRange(lowerSeconds: number, upperSeconds: number): string {
  const lower = formatStudyDuration(lowerSeconds)
  const upper = formatStudyDuration(Math.max(lowerSeconds, upperSeconds))
  return lower === upper ? lower : `${lower}–${upper}`
}

type EvidenceFormMode = 'manual_user_evidence' | 'reference_video_metadata' | 'previous_approved_edit_snapshot'
type EvidenceUploadStage = 'preparing' | 'uploading' | 'finalizing' | 'paused'

interface EvidenceUploadStatus {
  stage: EvidenceUploadStage
  progressPercent: number
  acceptedBytes: number
  totalBytes: number
  resumed: boolean
  recoveryState?: 'uploading' | 'recovering_integrity' | 'waiting_for_storage'
  message?: string
}

function EvidenceForm({ detail, disabled, initialMode = 'manual_user_evidence', onAdded, setBusy, setError }: {
  detail: EditReferenceDetail
  disabled: boolean
  initialMode?: EvidenceFormMode
  onAdded: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [mode, setMode] = useState<EvidenceFormMode>(initialMode)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState<Exclude<PreferenceEvidenceCategory, 'media_structure' | 'copy_safety'>>('all_goals')
  const [intendedUse, setIntendedUse] = useState<Exclude<PreferenceEvidenceTransferability, 'unknown'>>('transferable')
  const [supersedesEvidenceId, setSupersedesEvidenceId] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [rightsBasis, setRightsBasis] = useState<'user_owned' | 'licensed_or_authorized' | 'reference_only'>('reference_only')
  const [referenceFile, setReferenceFile] = useState<File>()
  const [uploadStatus, setUploadStatus] = useState<EvidenceUploadStatus>()
  const [pendingUploadRecovery, setPendingUploadRecovery] = useState<EditReferenceMediaUploadRecoverySummary>()
  const [projectId, setProjectId] = useState('')
  const [editSessionId, setEditSessionId] = useState('')
  const [approvedSnapshotId, setApprovedSnapshotId] = useState('')
  const correctedIds = new Set(detail.evidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const correctableEvidence = detail.evidence.filter((record) => record.sourceType === 'manual_user_evidence' && !correctedIds.has(record.id))

  useEffect(() => {
    let cancelled = false
    void readPendingEditReferenceMediaUploadRecovery({
      workspaceId,
      editReferenceId: detail.reference.id,
      studySessionId: detail.study.id,
    }).then((recovery) => {
      if (!cancelled) setPendingUploadRecovery(recovery)
    })
    return () => {
      cancelled = true
    }
  }, [detail.reference.id, detail.study.id, workspaceId])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    let input: CreatePreferenceEvidenceRequest
    let completedUploadRecovery: EditReferenceMediaUploadRecoverySummary | undefined
    if (mode === 'manual_user_evidence') {
      input = {
        workspaceId,
        expectedStudyRevision: detail.study.revision,
        sourceType: mode,
        title,
        category,
        summary,
        intendedUse,
        ...(supersedesEvidenceId ? { supersedesEvidenceId } : {}),
      }
    } else if (mode === 'reference_video_metadata') {
      let privateUpload: Awaited<ReturnType<typeof uploadEditReferenceMedia>> | undefined
      if (referenceFile) {
        setUploadStatus({
          stage: 'preparing',
          progressPercent: 0,
          acceptedBytes: 0,
          totalBytes: referenceFile.size,
          resumed: false,
        })
        privateUpload = await uploadEditReferenceMedia({
          editReferenceId: detail.reference.id,
          file: referenceFile,
          studySessionId: detail.study.id,
          workspaceId,
          onStageChange: (stage) => setUploadStatus((current) => ({
            stage,
            progressPercent: stage === 'finalizing' ? 100 : current?.progressPercent ?? 0,
            acceptedBytes: stage === 'finalizing' ? referenceFile.size : current?.acceptedBytes ?? 0,
            totalBytes: referenceFile.size,
            resumed: current?.resumed ?? false,
          })),
          onProgress: (progress) => setUploadStatus({
            stage: 'uploading',
            progressPercent: progress.progressPercent,
            acceptedBytes: progress.acceptedBytes,
            totalBytes: progress.totalBytes,
            resumed: progress.resumed,
            recoveryState: progress.state,
            message: progress.message,
          }),
        })
        if (!privateUpload.ok || !privateUpload.storageObjectRecordId || !privateUpload.mediaAssetId) {
          setError(privateUpload.message)
          if (privateUpload.recovery?.available) {
            setPendingUploadRecovery(privateUpload.recovery)
            setUploadStatus({
              stage: 'paused',
              progressPercent: privateUpload.recovery.totalBytes > 0
                ? Number(((privateUpload.recovery.acceptedBytes / privateUpload.recovery.totalBytes) * 100).toFixed(2))
                : 0,
              acceptedBytes: privateUpload.recovery.acceptedBytes,
              totalBytes: privateUpload.recovery.totalBytes,
              resumed: privateUpload.recovery.recovered || privateUpload.recovery.acceptedBytes > 0,
              recoveryState: 'waiting_for_storage',
              message: privateUpload.recovery.persistedInSession
                ? 'Your recovery record is safe in this tab. Choose Resume upload to recheck the server checkpoint.'
                : 'This browser could not retain the recovery record. Keep this page open and try again.',
            })
          } else {
            setUploadStatus(undefined)
          }
          setBusy(false)
          return
        }
        completedUploadRecovery = privateUpload.recovery
      }
      input = {
        workspaceId,
        expectedStudyRevision: detail.study.revision,
        sourceType: mode,
        title,
        sourceLabel,
        rightsBasis,
        ...(privateUpload?.storageObjectRecordId && privateUpload.mediaAssetId ? {
          storageObjectRecordId: privateUpload.storageObjectRecordId,
          mediaAssetId: privateUpload.mediaAssetId,
        } : {}),
      }
    } else {
      input = {
        workspaceId,
        expectedStudyRevision: detail.study.revision,
        sourceType: mode,
        title,
        projectId,
        editSessionId,
        approvedSnapshotId,
        ...(summary.trim() ? { summary } : {}),
        rightsBasis: 'workspace_approved_edit',
      }
    }
    const evidenceIdempotencyKey = `edit-reference-evidence-${createEditReferenceDeterministicHash({
      studyId: detail.study.id,
      ...input,
    })}`
    const response = await api.addEvidence(detail.study.id, input, evidenceIdempotencyKey)
    let savedDetail = response.ok ? response.data.detail : undefined
    if (!savedDetail) {
      const readback = await api.get(workspaceId, detail.reference.id)
      if (readback.ok && exactEvidenceCommitted(detail, readback.data.detail, input)) {
        savedDetail = readback.data.detail
      }
    }
    if (savedDetail) {
      if (mode === 'reference_video_metadata') {
        await clearEditReferenceMediaUploadRecovery({
          workspaceId,
          editReferenceId: detail.reference.id,
          studySessionId: detail.study.id,
        }).catch(() => undefined)
        setPendingUploadRecovery(undefined)
      }
      await onAdded(savedDetail)
    } else {
      setError(response.ok ? 'The saved evidence could not be read back.' : response.message)
      if (completedUploadRecovery) setPendingUploadRecovery(completedUploadRecovery)
    }
    setUploadStatus(undefined)
    setBusy(false)
  }

  const uploadInProgress = Boolean(uploadStatus && uploadStatus.stage !== 'paused')
  const submitDisabled = disabled || !title.trim()
    || (mode === 'manual_user_evidence' && !summary.trim())
    || (mode === 'reference_video_metadata' && (!sourceLabel.trim() || !referenceFile))
    || (mode === 'previous_approved_edit_snapshot' && (!projectId.trim() || !editSessionId.trim() || !approvedSnapshotId.trim()))
  const hasSavedSource = detail.evidence.some((record) => record.sourceType !== 'derived_skill_evidence')

  return (
    <form className="edit-reference-evidence-form" data-testid="edit-reference-evidence-form" onSubmit={submit}>
      <div className="edit-reference-evidence-mode" aria-label="Evidence type">
        <EvidenceModeButton active={mode === 'reference_video_metadata'} icon={FileVideo2} label="Upload video" onClick={() => setMode('reference_video_metadata')} />
        <EvidenceModeButton active={mode === 'previous_approved_edit_snapshot'} icon={History} label="Approved edit" onClick={() => setMode('previous_approved_edit_snapshot')} />
        {hasSavedSource || mode === 'manual_user_evidence' ? (
          <EvidenceModeButton active={mode === 'manual_user_evidence'} icon={ClipboardList} label="Creative note" onClick={() => setMode('manual_user_evidence')} />
        ) : null}
      </div>
      {mode !== 'reference_video_metadata' ? <label>
        <span>{mode === 'manual_user_evidence' ? 'Note title' : 'Edit label'}</span>
        <input autoFocus data-testid="edit-reference-evidence-title" maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder={mode === 'manual_user_evidence' ? 'Example: Restrained pacing' : 'Name this approved edit'} required value={title} />
      </label> : null}
      {mode === 'manual_user_evidence' && (
        <>
          <div className="edit-reference-evidence-grid">
            <label>
              <span>What does this describe?</span>
              <select data-testid="edit-reference-evidence-category" onChange={(event) => setCategory(event.target.value as typeof category)} value={category}>
                {EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span>How should it be treated?</span>
              <select data-testid="edit-reference-evidence-intended-use" onChange={(event) => setIntendedUse(event.target.value as typeof intendedUse)} value={intendedUse}>
                <option value="transferable">Transferable principle</option>
                <option value="non_transferable">Reference-specific detail</option>
                <option value="do_not_copy">Do not copy</option>
                <option value="requires_user_review">Needs my review</option>
              </select>
            </label>
          </div>
          <label>
            <span>Your evidence</span>
            <textarea data-testid="edit-reference-evidence-summary" maxLength={4_000} onChange={(event) => setSummary(event.target.value)} placeholder="Describe the choice, why it works, where it applies, and any boundaries…" required rows={4} value={summary} />
          </label>
          {correctableEvidence.length > 0 && (
            <label>
              <span>Correct an earlier creative note (optional)</span>
              <select data-testid="edit-reference-evidence-correction" onChange={(event) => setSupersedesEvidenceId(event.target.value)} value={supersedesEvidenceId}>
                <option value="">This is new evidence</option>
                {correctableEvidence.map((record) => <option key={record.id} value={record.id}>{record.title}</option>)}
              </select>
            </label>
          )}
        </>
      )}
      {mode === 'reference_video_metadata' && (
        <>
          <div className="edit-reference-form-boundary"><LockKeyhole aria-hidden="true" size={16} /><span>When secure storage confirms resumable transfer, ReEditPro uploads large videos in verified parts, keeps the original unchanged, and prepares a smaller copy only for study.</span></div>
          {pendingUploadRecovery && !uploadStatus ? (
            <div className="edit-reference-upload-progress is-paused" aria-live="polite" data-testid="edit-reference-video-upload-recovery">
              <div>
                <strong>{pendingUploadRecovery.stage === 'finalized' ? 'Verified upload waiting to attach' : 'Unfinished upload found'}</strong>
                <span>{pendingUploadRecovery.stage === 'finalized'
                  ? 'Choose the same file to attach the verified private upload without sending it again.'
                  : 'Choose the same file to request recovery from the last server-verified checkpoint.'}</span>
              </div>
              <progress aria-label="Recovered private reference video upload" max="100" value={pendingUploadRecovery.totalBytes > 0 ? (pendingUploadRecovery.acceptedBytes / pendingUploadRecovery.totalBytes) * 100 : 0} />
            </div>
          ) : null}
          <label>
            <span>Reference video</span>
            <input
              accept="video/mp4,video/quicktime,video/webm"
              autoFocus
              data-testid="edit-reference-video-file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setReferenceFile(file)
                if (file) {
                  setSourceLabel(file.name)
                  setTitle(file.name)
                }
              }}
              required
              type="file"
            />
            <small>{referenceFile ? `${referenceFile.name} is ready to upload.` : 'MP4, MOV, or WebM. ReEditPro checks secure resumable capacity before sending a large file.'}</small>
          </label>
          {uploadStatus && (
            <div className={`edit-reference-upload-progress${uploadStatus.stage === 'paused' ? ' is-paused' : ''}`} aria-live="polite" data-testid="edit-reference-video-upload-progress">
              <div>
                <strong>{uploadStatus.stage === 'preparing'
                  ? 'Preparing secure upload'
                  : uploadStatus.stage === 'finalizing'
                    ? 'Verifying the private upload'
                    : uploadStatus.recoveryState === 'waiting_for_storage'
                      ? 'Upload paused safely'
                      : uploadStatus.recoveryState === 'recovering_integrity'
                        ? 'Repairing the upload checkpoint'
                        : uploadStatus.resumed
                          ? 'Resuming private upload'
                          : 'Uploading privately'}</strong>
                <span>{uploadStatus.message
                  ?? (uploadStatus.stage === 'uploading'
                    ? `${formatStudyPercent(uploadStatus.progressPercent)} · ${formatStudyBytes(uploadStatus.acceptedBytes)} of ${formatStudyBytes(uploadStatus.totalBytes)}`
                    : uploadStatus.stage === 'finalizing'
                      ? 'Checking the exact size and retained object before study.'
                      : 'Large videos automatically use checkpointed transfer.')}</span>
              </div>
              <progress aria-label="Private reference video upload" max="100" value={uploadStatus.progressPercent} />
            </div>
          )}
          <fieldset className="edit-reference-rights-choice">
            <legend>How may ReEditPro use this reference?</legend>
            <label><input checked={rightsBasis === 'reference_only'} name="reference-rights" onChange={() => setRightsBasis('reference_only')} type="radio" /><span><strong>Study only</strong><small>Learn editing choices without reusing the media.</small></span></label>
            <label><input checked={rightsBasis === 'user_owned'} name="reference-rights" onChange={() => setRightsBasis('user_owned')} type="radio" /><span><strong>I own it</strong><small>Record that you own this reference.</small></span></label>
            <label><input checked={rightsBasis === 'licensed_or_authorized'} name="reference-rights" onChange={() => setRightsBasis('licensed_or_authorized')} type="radio" /><span><strong>Authorized</strong><small>Record that you have permission to use it.</small></span></label>
          </fieldset>
        </>
      )}
      {mode === 'previous_approved_edit_snapshot' && (
        <>
          <div className="edit-reference-form-boundary"><LockKeyhole aria-hidden="true" size={16} /><span>Choose the exact approved version you want ReEditPro to study. Its media and approval history remain unchanged.</span></div>
          <div className="edit-reference-evidence-grid three">
            <label><span>Project</span><input data-testid="edit-reference-evidence-project-id" maxLength={200} onChange={(event) => setProjectId(event.target.value)} placeholder="Project reference" required value={projectId} /></label>
            <label><span>Edit</span><input data-testid="edit-reference-evidence-edit-id" maxLength={200} onChange={(event) => setEditSessionId(event.target.value)} placeholder="Named edit reference" required value={editSessionId} /></label>
            <label><span>Approved version</span><input data-testid="edit-reference-evidence-snapshot-id" maxLength={200} onChange={(event) => setApprovedSnapshotId(event.target.value)} placeholder="Approved version reference" required value={approvedSnapshotId} /></label>
          </div>
          <label><span>Why this edit matters (optional)</span><textarea maxLength={2_000} onChange={(event) => setSummary(event.target.value)} rows={3} value={summary} /></label>
        </>
      )}
      <div className="edit-reference-form-actions">
        <Button data-testid="save-edit-reference-evidence" disabled={submitDisabled || uploadInProgress} icon={uploadStatus?.stage === 'paused' ? RotateCcw : Plus} type="submit" variant="primary">
          {uploadStatus
            ? uploadStatus.stage === 'paused'
              ? 'Resume upload'
              : uploadStatus.stage === 'finalizing'
              ? 'Verifying…'
              : uploadStatus.recoveryState === 'waiting_for_storage'
                ? 'Waiting safely…'
                : 'Uploading…'
            : disabled ? 'Saving…'
              : mode === 'reference_video_metadata' ? 'Upload reference'
                : mode === 'previous_approved_edit_snapshot' ? 'Add approved edit'
                  : 'Save note'}
        </Button>
      </div>
    </form>
  )
}

function EvidenceModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof ClipboardList; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className={active ? 'active' : ''} onClick={onClick} type="button"><Icon aria-hidden="true" size={17} /><span>{label}</span></button>
}

function PreferenceDNAReview({
  version,
  qaResult,
  disabled,
  approvalAcknowledged,
  reasoningReviewAcknowledged,
  onApprovalAcknowledged,
  onReasoningReviewAcknowledged,
  onRunQA,
  onCorrect,
  onApprove,
}: {
  version: EditReferenceDetail['dnaVersions'][number]
  qaResult?: EditReferenceDetail['dnaQaResults'][number]
  disabled: boolean
  approvalAcknowledged: boolean
  reasoningReviewAcknowledged: boolean
  onApprovalAcknowledged: (value: boolean) => void
  onReasoningReviewAcknowledged: (value: boolean) => void
  onRunQA: () => void
  onCorrect: () => void
  onApprove: () => void
}) {
  const heading = version.status === 'approved'
    ? 'Approved reusable guidance'
    : !qaResult
      ? 'Ready for quality review'
      : qaResult.status === 'blocked'
        ? 'Blocked by quality review'
        : qaResult.status === 'requires_user_review'
          ? 'Quality limits need your review'
          : 'Ready for approval'
  return (
    <section className="edit-reference-dna-review" data-testid="edit-reference-dna-review">
      <header>
        <div>
          <span>Guidance version {version.version}</span>
          <strong>{heading}</strong>
        </div>
        <Badge accent={version.status === 'approved'
          ? 'success'
          : qaResult?.status === 'passed'
            ? 'success'
            : qaResult?.status === 'blocked'
              ? 'danger'
              : qaResult?.status === 'requires_user_review'
                ? 'warning'
                : 'muted'}>
          {version.status === 'approved' ? 'Approved' : qaResult ? qaResult.status.replaceAll('_', ' ') : 'Not checked'}
        </Badge>
      </header>
      <div className="edit-reference-dna-metrics">
        <span><strong>{version.layers.length}</strong> editing areas</span>
        <span><strong>{version.rules.length}</strong> guidance rules</span>
        <span><strong>{version.doNotCopyRuleCount}</strong> copy boundaries</span>
        <span><strong>{Math.round(version.overallConfidence * 100)}%</strong> evidence confidence</span>
      </div>
      {version.reasoningReview && (
        <section className="edit-reference-dna-reasoning-review" data-testid="edit-reference-dna-reasoning-review">
          <header>
            <div>
              <BrainCircuit aria-hidden="true" size={18} />
              <div>
                <span>{version.reasoningReview.sourceLabel}</span>
                <strong>Review confidence and limits</strong>
              </div>
            </div>
            <Badge accent={version.reasoningReview.requiresUserReview ? 'warning' : 'cyan'}>
              {version.reasoningReview.requiresUserReview ? 'Needs your review' : 'Evidence checked'}
            </Badge>
          </header>
          <p>ReEditPro created this guidance from the studied reference. Review its confidence and limits before approval.</p>
          {version.reasoningReview.missingEvidenceKinds.length > 0 && (
            <div>
              <strong>Evidence still missing</strong>
              <ul>{version.reasoningReview.missingEvidenceKinds.map((kind) => <li key={kind}>{kind.replaceAll('_', ' ')}</li>)}</ul>
            </div>
          )}
          <div>
            <strong>Important limits</strong>
            {version.reasoningReview.limitations.length > 0
              ? <ul>{version.reasoningReview.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
              : <p>No additional limits were reported beyond the quality review and adapt-not-copy rules.</p>}
          </div>
        </section>
      )}
      {version.conflicts.length > 0 && (
        <div className="edit-reference-dna-conflicts">
          <strong>Review required</strong>
          {version.conflicts.map((conflict) => <p key={conflict.id}>{conflict.title}: {conflict.summary}</p>)}
        </div>
      )}
      <details className="edit-reference-dna-guidance">
        <summary>
          <span>Review editing guidance</span>
          <small>{version.layers.length} areas · {version.rules.length} rules</small>
        </summary>
        <div className="edit-reference-dna-layers">
          {version.layers.map((layer) => {
            const rules = version.rules.filter((rule) => layer.ruleIds.includes(rule.id))
            return (
              <details key={layer.layerId} open={layer.layerId === 'do_not_copy_rules'}>
                <summary>
                  <span>{layer.title}</span>
                  <small>{rules.length} rule{rules.length === 1 ? '' : 's'} · {Math.round(layer.confidence * 100)}%</small>
                </summary>
                <p>{layer.summary}</p>
                <ul>{rules.map((rule) => <li key={rule.id}>{rule.statement}</li>)}</ul>
                <small>{layer.evidenceIds.length} linked evidence record{layer.evidenceIds.length === 1 ? '' : 's'} · {layer.coverage.replaceAll('_', ' ')}</small>
              </details>
            )
          })}
        </div>
      </details>
      {!qaResult && version.status === 'review_required' && (
        <div className="edit-reference-dna-review-action">
          <div><ShieldCheck aria-hidden="true" size={18} /><span>Check the guidance, confidence, copy boundaries, and possible side effects.</span></div>
          <Button data-testid="run-edit-reference-dna-qa" disabled={disabled} icon={SearchCheck} onClick={onRunQA} size="sm" variant="primary">
            {disabled ? 'Reviewing…' : 'Run quality review'}
          </Button>
        </div>
      )}
      {qaResult && <PreferenceDNAQAReview qaResult={qaResult} />}
      {qaResult?.status === 'blocked' && version.status === 'review_required' && (
        <div className="edit-reference-dna-resolution">
          <div><CircleAlert aria-hidden="true" size={18} /><span>Blocking findings cannot be acknowledged away. Correct the evidence and create a new immutable version.</span></div>
          <Button data-testid="correct-blocked-edit-reference-dna" disabled={disabled} icon={Plus} onClick={onCorrect} size="sm" variant="ghost">Correct evidence</Button>
        </div>
      )}
      {qaResult && qaResult.status !== 'blocked' && version.status === 'review_required' && (
        <div className="edit-reference-dna-approval" data-testid="edit-reference-dna-approval">
          <div className="edit-reference-dna-approval-checks">
            <label>
              <input
                checked={approvalAcknowledged}
                data-testid="acknowledge-edit-reference-dna-approval"
                disabled={disabled}
                onChange={(event) => onApprovalAcknowledged(event.target.checked)}
                type="checkbox"
              />
                <span>I reviewed this version and will use it as adaptable guidance—not copy its shots, timing, media, identity, or layouts.</span>
            </label>
            {version.reasoningReview && (
              <label>
                <input
                  checked={reasoningReviewAcknowledged}
                  data-testid="acknowledge-edit-reference-dna-reasoning-review"
                  disabled={disabled}
                  onChange={(event) => onReasoningReviewAcknowledged(event.target.checked)}
                  type="checkbox"
                />
                <span>I reviewed the evidence confidence, missing evidence, and limitations shown for this AI-assisted version.</span>
              </label>
            )}
          </div>
          <Button data-testid="approve-edit-reference-dna" disabled={disabled || !approvalAcknowledged || !reasoningReviewAcknowledged} icon={FileCheck2} onClick={onApprove} size="sm" variant="primary">
            {disabled ? 'Approving…' : `Approve version ${version.version}`}
          </Button>
        </div>
      )}
      {version.status === 'approved' && (
        <div className="edit-reference-target-ready" data-testid="edit-reference-target-ready">
          <div>
            <FileCheck2 aria-hidden="true" size={18} />
            <span>Choose this reference from a project edit to create target-specific guidance. The edit will stay unchanged until that guidance is connected and reviewed.</span>
          </div>
          <Button icon={FileVideo2} size="sm" to="/edit-videos" variant="secondary">Choose a project edit</Button>
        </div>
      )}
      <div className="edit-reference-form-boundary"><ShieldCheck aria-hidden="true" size={16} /><span>{version.status === 'approved'
        ? 'This exact version is approved as reusable guidance. It has not been applied to a target edit and no production work has started.'
        : 'This version is immutable and evidence-linked. Quality review and your explicit approval are required before it can guide an edit.'}</span></div>
    </section>
  )
}

function PreferenceDNAQAReview({ qaResult }: { qaResult: EditReferenceDetail['dnaQaResults'][number] }) {
  const findings = qaResult.checks.filter((check) => check.status !== 'passed')
  const passed = qaResult.checks.filter((check) => check.status === 'passed')
  return (
    <section className={`edit-reference-dna-qa ${qaResult.status}`} data-testid="edit-reference-dna-qa-review">
      <header>
        <div>
          <span>Quality review</span>
          <strong>{qaResult.summary}</strong>
        </div>
        <small>{qaResult.blockingCheckIds.length} blocking · {qaResult.reviewCheckIds.length} to review · {passed.length} passed</small>
      </header>
      {findings.length > 0 && (
        <div className="edit-reference-dna-qa-findings">
          {findings.map((check) => (
            <article className={check.status} key={check.id}>
              <CircleAlert aria-hidden="true" size={16} />
              <div>
                <strong>{check.title}</strong>
                <p>{check.summary}</p>
                <small>{check.recommendation}</small>
              </div>
            </article>
          ))}
        </div>
      )}
      <details>
        <summary>{passed.length} passed check{passed.length === 1 ? '' : 's'}</summary>
        <ul>{passed.map((check) => <li key={check.id}><strong>{check.title}</strong><span>{check.summary}</span></li>)}</ul>
      </details>
    </section>
  )
}

function evidenceSourceLabel(sourceType: string): string {
  if (sourceType === 'manual_user_evidence') return 'Creative note'
  if (sourceType === 'reference_video_metadata') return 'Video details'
  return 'Approved edit identity'
}

function evidenceRuntimeLabel(runtimeSource: string): string {
  if (runtimeSource === 'verified_local' || runtimeSource === 'verified_live') return 'Analyzed'
  if (runtimeSource === 'verified_mock') return 'Safety check'
  if (runtimeSource === 'fallback') return 'Manual evidence'
  if (runtimeSource === 'blocked') return 'Blocked'
  return runtimeSource.replaceAll('_', ' ')
}

function skillRunLabel(skillId: string): string {
  if (skillId === 'edit_reference.media_structure.representative_frame_plan') return 'Representative-frame plan'
  if (skillId === 'edit_reference.visual_language.qwen_visual_analysis') return 'Visual-language analysis'
  if (skillId === 'edit_reference.caption_design.evidence') return 'Caption analysis'
  if (skillId === 'edit_reference.color_treatment.technical_signal') return 'Color signal check'
  if (skillId === 'edit_reference.color_treatment.evidence') return 'Color treatment analysis'
  if (skillId === 'edit_reference.audio_sound_design.technical_loudness') return 'Audio level check'
  if (skillId === 'edit_reference.audio_sound_design.technical_low_level_intervals') return 'Low-level audio check'
  if (skillId === 'edit_reference.audio_sound_design.evidence') return 'Audio and sound-design analysis'
  if (skillId === 'edit_reference.graphics_motion.evidence') return 'Graphics and motion analysis'
  if (skillId === 'edit_reference.speech_pacing.evidence') return 'Speech and pause analysis'
  if (skillId === 'edit_reference.media_structure.metadata_map') return 'Media structure'
  if (skillId === 'edit_reference.story_editorial.qwen_reasoning') return 'Story and pacing review'
  if (skillId === 'edit_reference.transferability.copy_safety') return 'Copy-safety review'
  return 'Evidence analysis'
}

function sourceEvidenceStudyLabel(
  record: PreferenceEvidenceRecord,
  asset?: EditReferenceDetail['assets'][number],
): string {
  if (asset?.mediaStudyStatus === 'media_studied_local_partial') {
    const visualChangeSummary = asset.technicalSceneBoundaryStatus === 'verified_local_bounded'
      ? ` · ${asset.technicalSceneBoundaryCount ?? 0} visual change point${asset.technicalSceneBoundaryCount === 1 ? '' : 's'}`
      : ''
    return `media details analyzed${visualChangeSummary} · ${asset.representativeFrameCount ?? 0} temporary frame sample${asset.representativeFrameCount === 1 ? '' : 's'}`
  }
  if (asset?.mediaStudyStatus === 'media_study_blocked') return 'media study blocked'
  if (record.provenance.mediaStudyStatus === 'media_not_studied') return 'video not studied'
  if (record.provenance.mediaStudyStatus === 'approved_edit_identity_not_verified') return 'approved edit not opened'
  return record.confidenceBasis.replaceAll('_', ' ')
}

function AppliedEditsTab({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const workspaceId = useEditReferenceWorkspaceId()
  const [applications, setApplications] = useState<PreferenceApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    const response = await api.listApplications(workspaceId)
    if (response.ok) setApplications(response.data.applications)
    else setError(response.message)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadApplications() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadApplications])

  if (loading) {
    return (
      <section className="edit-reference-static-panel" data-testid="applied-edits-panel">
        <RefreshCw aria-hidden="true" size={28} />
        <h2>Loading target guidance…</h2>
        <p>Checking the private application history for this workspace.</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="edit-reference-static-panel" data-testid="applied-edits-panel">
        <CircleAlert aria-hidden="true" size={28} />
        <h2>Target guidance is unavailable</h2>
        <p>{error}</p>
        <Button icon={RefreshCw} onClick={() => void loadApplications()} variant="secondary">Try again</Button>
      </section>
    )
  }

  if (applications.length === 0) {
    return (
      <section className="edit-reference-static-panel" data-testid="applied-edits-panel">
        <FileCheck2 aria-hidden="true" size={28} />
        <h2>No applied guidance yet</h2>
        <p>Approve a studied preference, then choose it for an exact edit.</p>
        <Button onClick={onOpenLibrary} variant="secondary">Open library</Button>
      </section>
    )
  }

  return (
    <section className="edit-reference-applications-panel" data-testid="applied-edits-panel">
      <header>
        <div>
          <span className="section-eyebrow">Application history</span>
          <h2>Applied guidance by version</h2>
          <p>Connected, replaced, and removed versions remain visible without changing approved guidance or rewriting prior history.</p>
        </div>
        <div className="edit-reference-application-header-actions">
          <Badge accent="cyan">{applications.length} application{applications.length === 1 ? '' : 's'}</Badge>
          <Button icon={RefreshCw} onClick={() => void loadApplications()} size="sm" variant="ghost">Refresh</Button>
        </div>
      </header>
      <div className="edit-reference-application-list">
        {[...applications].sort((left, right) => (
          left.projectId === right.projectId && left.editSessionId === right.editSessionId
            ? right.version - left.version
            : right.createdAt.localeCompare(left.createdAt)
        )).map((application) => {
          const adaptedCount = application.decisions.filter((decision) => decision.decision === 'applied' || decision.decision === 'adapted').length
          const heldBackCount = application.decisions.length - adaptedCount
          const lifecycle = preferenceApplicationLifecycleView(application)
          const replacement = application.replacedByApplicationId
            ? applications.find((candidate) => candidate.id === application.replacedByApplicationId)
            : undefined
          return (
            <article className={`is-${application.status}`} data-testid="preference-application-card" key={application.id}>
              <header>
                <div>
                  <span>{application.editReferenceName} · Guidance v{application.dnaVersionNumber} · Application v{application.version}</span>
                  <h3>{application.targetContext.editName}</h3>
                  <p>{application.targetContext.projectName}</p>
                </div>
                <Badge accent={lifecycle.accent}>
                  {lifecycle.label}
                </Badge>
              </header>
              <div className="edit-reference-application-context" aria-label="Target context">
                <span>{application.applicationSource === 'chat_tag' ? 'Edit Chat' : application.applicationSource === 'setup_selector' ? 'New Edit setup' : 'Edit preferences'}</span>
                <span>{application.targetContext.contentType.replaceAll('_', ' ')}</span>
                <span>{application.targetContext.sourceMode.replaceAll('_', ' ')}</span>
                <span>{application.targetContext.aspectRatio}</span>
                <span>{application.targetContext.platformTarget.replaceAll('_', ' ')}</span>
                <span>{application.targetContext.selectedEditLevel.replaceAll('_', ' ')}</span>
              </div>
              <p className="edit-reference-application-summary">{application.summary}</p>
              {replacement ? (
                <p className="edit-reference-application-history-note">
                  Replaced by application version {replacement.version} using {replacement.editReferenceName}.
                </p>
              ) : application.replacesApplicationId ? (
                <p className="edit-reference-application-history-note">This version replaced the prior connected guidance for the same edit.</p>
              ) : null}
              <div className="edit-reference-application-metrics">
                <span><strong>{adaptedCount}</strong> adapted</span>
                <span><strong>{heldBackCount}</strong> held back</span>
                <span><strong>{application.hintGroups.length}</strong> guidance areas</span>
              </div>
              <details>
                <summary>Review target-specific guidance</summary>
                <div className="edit-reference-application-guidance">
                  {application.hintGroups.map((group) => {
                    const decisions = application.decisions.filter((decision) => group.decisionIds.includes(decision.id))
                    return (
                      <section key={group.id}>
                        <strong>{group.title}</strong>
                        <small>{group.summary}</small>
                        <ul>{decisions.filter((decision) => decision.decision === 'applied' || decision.decision === 'adapted').map((decision) => <li key={decision.id}>{decision.targetInstruction}</li>)}</ul>
                      </section>
                    )
                  })}
                  <section className="edit-reference-application-boundaries">
                    <strong>Protected boundaries</strong>
                    <small>These reference-specific details never transfer to the target edit.</small>
                    <ul>{application.doNotCopyRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
                  </section>
                </div>
              </details>
              <div className={`edit-reference-form-boundary${application.status === 'prepared' ? '' : ' is-history'}`}>
                <LockKeyhole aria-hidden="true" size={16} />
                <span>{lifecycle.boundary}</span>
              </div>
              <time dateTime={lifecycle.timestamp}>{lifecycle.timestampLabel} {new Date(lifecycle.timestamp).toLocaleString()}</time>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function preferenceApplicationLifecycleView(application: PreferenceApplicationRecord): {
  accent: 'success' | 'cyan' | 'muted'
  boundary: string
  label: string
  timestamp: string
  timestampLabel: string
} {
  if (application.status === 'replaced') {
    return {
      accent: 'muted',
      boundary: 'This version is inactive and preserved as immutable history. Replacement did not change its approved guidance or start production.',
      label: 'Replaced',
      timestamp: application.invalidatedAt ?? application.createdAt,
      timestampLabel: 'Replaced',
    }
  }
  if (application.status === 'cleared') {
    return {
      accent: 'muted',
      boundary: 'This version was removed from the edit and remains available only as history. No approved guidance was deleted.',
      label: 'Removed',
      timestamp: application.clearedAt ?? application.createdAt,
      timestampLabel: 'Removed',
    }
  }
  if (application.targetIntegrationStatus === 'connected') {
    return {
      accent: 'success',
      boundary: 'This target-adapted guidance is active as lower-priority planning context. The approved plan and production state remain unchanged.',
      label: 'Connected',
      timestamp: application.connectedAt ?? application.createdAt,
      timestampLabel: 'Connected',
    }
  }
  return {
    accent: 'cyan',
    boundary: 'This guidance is prepared for review but is not active. The target edit, its approved plan, and production state have not changed.',
    label: 'Prepared',
    timestamp: application.createdAt,
    timestampLabel: 'Prepared',
  }
}

function SafetyPrivacyTab() {
  const rules = [
    {
      title: 'You choose the evidence',
      description: 'A video is studied only after you deliberately add it to a preference.',
    },
    {
      title: 'Style is adapted, not copied',
      description: 'Identity, footage, exact layouts, music, captions, and timing stay protected.',
    },
    {
      title: 'Nothing applies automatically',
      description: 'You review and approve guidance before it can shape an exact edit.',
    },
  ]
  return (
    <section className="edit-reference-safety-panel" data-testid="safety-privacy-panel">
      <header>
        <ShieldCheck aria-hidden="true" size={24} />
        <div>
          <span className="section-eyebrow">Safety &amp; privacy</span>
          <h2>How your references are handled</h2>
          <p>Private by default, with your approval at every application step.</p>
        </div>
      </header>
      <div className="edit-reference-safety-list">
        {rules.map((rule) => (
          <div key={rule.title}>
            <LockKeyhole aria-hidden="true" size={16} />
            <span>
              <strong>{rule.title}</strong>
              <small>{rule.description}</small>
            </span>
          </div>
        ))}
      </div>
      <p className="edit-reference-safety-boundary">
        Adding or discussing a reference never starts production or changes your balance.
      </p>
    </section>
  )
}
