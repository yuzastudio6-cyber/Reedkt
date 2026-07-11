import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  Archive,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  CircleAlert,
  Database,
  FileCheck2,
  FileVideo2,
  History,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RefreshCw,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import type {
  CreatePreferenceEvidenceRequest,
  EditReferenceDetail,
  EditReferenceListItem,
  EditReferenceStudyGoal,
  PreferenceEvidenceCategory,
  PreferenceEvidenceTransferability,
} from '../../types/edit-reference'
import { EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES, EDIT_REFERENCE_STUDY_GOALS } from '../../types/edit-reference'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import { toEditReferenceInspectorView, toEditReferenceSavedCardView } from '../../lib/edit-reference-ui-adapter'
import { AppShell } from '../AppShell'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { EditPreferenceLibraryPage } from './EditPreferenceLibraryPage'

const tabs = [
  { id: 'edit-references', label: 'Edit References' },
  { id: 'workspace-defaults', label: 'Workspace Defaults' },
  { id: 'applied-edits', label: 'Applied Edits' },
  { id: 'safety-privacy', label: 'Safety & Privacy' },
] as const
type TabId = typeof tabs[number]['id']

const api = createEditReferenceApiClient()
const workspaceId = (import.meta.env.VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID as string | undefined)?.trim()
  || 'workspace-private-beta'

export function EditReferenceWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab) ? requestedTab as TabId : 'edit-references'

  const setActiveTab = (tab: TabId) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'edit-references') next.delete('tab')
    else next.set('tab', tab)
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
    <AppShell
      description="Study references, preserve transferable editing judgment, and keep creative boundaries clear."
      eyebrow="Creative intelligence"
      primaryAction="Create project"
      title="Edit Preferences"
    >
      <section className="edit-reference-workspace" data-edit-reference-workspace="true" data-testid="edit-preferences-page">
        <div className="edit-reference-tabs" role="tablist" aria-label="Edit Preferences workspace">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              aria-controls={`edit-reference-panel-${tab.id}`}
              className={activeTab === tab.id ? 'active' : ''}
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
          aria-labelledby={`edit-reference-tab-${activeTab}`}
          id={`edit-reference-panel-${activeTab}`}
          role="tabpanel"
        >
          {activeTab === 'edit-references' && <EditReferencesTab />}
          {activeTab === 'workspace-defaults' && (
            <section aria-label="Workspace Defaults" data-testid="workspace-defaults-panel">
              <div className="edit-reference-context-note">
                <Database aria-hidden="true" size={18} />
                <div>
                  <strong>Your workspace defaults</strong>
                  <p>Use these reusable settings when you want a consistent starting point across projects.</p>
                </div>
              </div>
              <EditPreferenceLibraryPage embedded />
            </section>
          )}
          {activeTab === 'applied-edits' && <AppliedEditsTab />}
          {activeTab === 'safety-privacy' && <SafetyPrivacyTab />}
        </div>
      </section>
    </AppShell>
  )
}

function EditReferencesTab() {
  const [references, setReferences] = useState<EditReferenceListItem[]>([])
  const [detail, setDetail] = useState<EditReferenceDetail>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [showCreate, setShowCreate] = useState(false)

  const loadList = useCallback(async (preferredReferenceId?: string) => {
    setLoading(true)
    setError(undefined)
    const response = await api.list(workspaceId)
    if (!response.ok) {
      setError(response.message)
      setLoading(false)
      return
    }
    setReferences(response.data.references)
    const selectedId = preferredReferenceId
      ?? detail?.reference.id
      ?? response.data.references.find((item) => item.reference.status === 'active')?.reference.id
      ?? response.data.references[0]?.reference.id
    if (selectedId) {
      const selected = await api.get(workspaceId, selectedId)
      if (selected.ok) setDetail(selected.data.detail)
      else setError(selected.message)
    } else {
      setDetail(undefined)
    }
    setLoading(false)
  }, [detail?.reference.id])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadList() }, 0)
    return () => window.clearTimeout(timeoutId)
    // The first load deliberately does not refetch when selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectReference = async (referenceId: string) => {
    setBusy(true)
    setError(undefined)
    const response = await api.get(workspaceId, referenceId)
    if (response.ok) setDetail(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  const handleCreated = async (created: EditReferenceDetail) => {
    setDetail(created)
    setShowCreate(false)
    setNotice('Edit Reference and its first private Study Chat were saved.')
    await loadList(created.reference.id)
  }

  const archiveSelected = async () => {
    if (!detail || detail.reference.status === 'archived') return
    setBusy(true)
    const response = await api.update(detail.reference.id, {
      workspaceId,
      expectedReferenceRevision: detail.reference.revision,
      status: 'archived',
    })
    if (response.ok) {
      setDetail(response.data.detail)
      setNotice('Edit Reference archived. Its immutable private history remains available.')
      await loadList(response.data.detail.reference.id)
    } else setError(response.message)
    setBusy(false)
  }

  return (
    <div aria-busy={loading || busy} className="edit-reference-tab-panel" data-testid="edit-references-panel">
      <div className="edit-reference-gate-banner">
        <div>
          <span className="section-eyebrow">Reference study</span>
          <h2>Teach ReEditPro your editing judgment</h2>
          <p>Describe what is transferable, where it should apply, and what must never be copied. You will review evidence and Preference DNA before it can guide an edit.</p>
        </div>
        <div className="edit-reference-banner-actions">
          <Badge accent="cyan">Private by default</Badge>
          <Badge accent="muted">Analysis begins with evidence</Badge>
          <Button data-testid="new-edit-reference" icon={Plus} onClick={() => setShowCreate(true)} variant="primary">
            New Edit Reference
          </Button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`edit-reference-alert ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
          {error ? <CircleAlert aria-hidden="true" size={18} /> : <FileCheck2 aria-hidden="true" size={18} />}
          <span>{error ?? notice}</span>
        </div>
      )}

      {showCreate && <CreateReferenceCard busy={busy} onCancel={() => setShowCreate(false)} onCreated={handleCreated} setBusy={setBusy} setError={setError} />}

      <div className="edit-reference-three-panel">
        <aside className="edit-reference-saved-panel" aria-label="Saved Edit References">
          <div className="edit-reference-panel-heading">
            <div><span>Saved</span><strong>Edit References</strong></div>
            <button aria-label="Reload Edit References" disabled={loading || busy} onClick={() => void loadList()} type="button">
              <RefreshCw aria-hidden="true" size={16} />
            </button>
          </div>
          {loading ? <PanelPlaceholder label="Loading private references…" /> : references.length ? references.map((item) => {
            const view = toEditReferenceSavedCardView(item)
            return (
            <button
              className={`edit-reference-saved-card ${detail?.reference.id === item.reference.id ? 'active' : ''}`}
              data-testid={`edit-reference-card-${item.reference.id}`}
              key={item.reference.id}
              onClick={() => void selectReference(item.reference.id)}
              type="button"
            >
              <span>{view.referenceStatus}</span>
              <strong>{view.name}</strong>
              <small>{view.studyStatus} · {view.messageCount} messages</small>
              <small>{view.dnaStatus} · {view.appliedEditCount} applied edits</small>
              <time dateTime={view.latestActivityAt}>Updated {new Date(view.latestActivityAt).toLocaleString()}</time>
            </button>
            )
          }) : <PanelPlaceholder label="No Edit References yet. Create one to open a Study Chat." />}
        </aside>

        <main className="edit-reference-chat-panel" aria-label="Preference Study Chat">
          {detail ? (
            <StudyChat detail={detail} disabled={busy} onChanged={async (next) => {
              setDetail(next)
              await loadList(next.reference.id)
            }} setBusy={setBusy} setError={setError} />
          ) : <PanelPlaceholder icon={<MessageSquareText size={22} />} label="Select or create an Edit Reference to begin its private Study Chat." />}
        </main>

        <aside className="edit-reference-inspector" aria-label="Preference DNA and QA Inspector">
          <div className="edit-reference-panel-heading">
            <div><span>Inspector</span><strong>DNA & QA</strong></div>
            <BrainCircuit aria-hidden="true" size={18} />
          </div>
          {detail ? (
            <EditReferenceInspector busy={busy} detail={detail} onArchive={archiveSelected} />
          ) : <PanelPlaceholder label="DNA and QA stay locked until a saved study is selected." />}
        </aside>
      </div>
    </div>
  )
}

function CreateReferenceCard({ busy, onCancel, onCreated, setBusy, setError }: {
  busy: boolean
  onCancel: () => void
  onCreated: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState<EditReferenceStudyGoal[]>(['visual_language', 'story_and_pacing'])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const response = await api.create({ workspaceId, name, description, initialGoals: goals })
    if (response.ok) await onCreated(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  const toggleGoal = (goal: EditReferenceStudyGoal) => setGoals((current) => current.includes(goal)
    ? current.filter((candidate) => candidate !== goal)
    : [...current, goal])

  return (
    <form className="edit-reference-create-card" data-testid="edit-reference-create-form" onSubmit={submit}>
      <div>
        <span className="section-eyebrow">New private study</span>
        <h3>Name the editing intelligence you want to preserve</h3>
      </div>
      <label>
        <span>Name (required)</span>
        <input autoFocus data-testid="edit-reference-name" maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Example: Restrained investigative documentary" required value={name} />
      </label>
      <label>
        <span>What should ReEditPro learn?</span>
        <textarea data-testid="edit-reference-description" maxLength={2_000} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the creative judgment, intended use, and anything that must not be copied." rows={3} value={description} />
      </label>
      <fieldset>
        <legend>Study goals</legend>
        <div className="edit-reference-goal-picker">
          <label>
            <input
              checked={goals.length === EDIT_REFERENCE_STUDY_GOALS.length}
              onChange={() => setGoals(goals.length === EDIT_REFERENCE_STUDY_GOALS.length ? [] : [...EDIT_REFERENCE_STUDY_GOALS])}
              type="checkbox"
            />
            <span>everything</span>
          </label>
          {EDIT_REFERENCE_STUDY_GOALS.map((goal) => (
            <label key={goal}>
              <input checked={goals.includes(goal)} onChange={() => toggleGoal(goal)} type="checkbox" />
              <span>{goal.replaceAll('_', ' ')}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="edit-reference-form-actions">
        <Button disabled={busy} onClick={onCancel} variant="ghost">Cancel</Button>
        <Button data-testid="save-edit-reference" disabled={busy || !name.trim() || goals.length === 0} icon={Plus} type="submit" variant="primary">
          {busy ? 'Saving…' : 'Save and open study'}
        </Button>
      </div>
    </form>
  )
}

function EditReferenceInspector({ busy, detail, onArchive }: {
  busy: boolean
  detail: EditReferenceDetail
  onArchive: () => Promise<void>
}) {
  const view = toEditReferenceInspectorView(detail)
  return (
    <>
      <InspectorState icon={BookOpen} label="Study status" value={view.studyStatus} />
      <InspectorState icon={BookOpen} label="Study evidence" value={view.evidenceStatus} />
      <InspectorState icon={Sparkles} label="Analysis status" value={view.skillStatus} />
      <InspectorState icon={ShieldCheck} label="Copy safety" value={view.copySafetyStatus} />
      <InspectorState icon={Sparkles} label="Preference DNA" value={view.dnaStatus} />
      <InspectorState icon={ShieldCheck} label="Quality review" value={view.qaStatus} />
      <InspectorState icon={MessageSquareText} label="Next required action" value={view.nextAction} />
      <div className="edit-reference-inspector-section">
        <span>Study goals</span>
        <div className="edit-reference-goal-chips">
          {detail.reference.initialGoals.map((goal) => <small key={goal}>{goal.replaceAll('_', ' ')}</small>)}
        </div>
      </div>
      <div className="edit-reference-inspector-section">
        <span>Evidence record</span>
        <p className="edit-reference-inspector-copy">{view.sourceEvidenceCount} saved source{view.sourceEvidenceCount === 1 ? '' : 's'} · {view.findingCount} study finding{view.findingCount === 1 ? '' : 's'}</p>
      </div>
      <div className="edit-reference-safety-mini">
        <LockKeyhole aria-hidden="true" size={17} />
        <p>This setup stores only the reference details and creative direction you choose to save.</p>
      </div>
      <Button disabled={busy || detail.reference.status === 'archived'} icon={Archive} onClick={() => void onArchive()} size="sm" variant="ghost">
        Archive reference
      </Button>
    </>
  )
}

function StudyChat({ detail, disabled, onChanged, setBusy, setError }: {
  detail: EditReferenceDetail
  disabled: boolean
  onChanged: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const [message, setMessage] = useState('')
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)
  const orderedMessages = useMemo(() => detail.messages.slice().sort((left, right) => left.sequence - right.sequence), [detail.messages])
  const sourceEvidence = useMemo(() => detail.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence'), [detail.evidence])
  const supersededSourceIds = useMemo(() => new Set(sourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean)), [sourceEvidence])
  const activeSourceEvidence = useMemo(() => sourceEvidence.filter((record) => !supersededSourceIds.has(record.id)), [sourceEvidence, supersededSourceIds])
  const latestOrchestrationId = detail.skillRuns.at(-1)?.orchestrationId
  const latestSkillRuns = useMemo(() => detail.skillRuns.filter((record) => (
    latestOrchestrationId && record.orchestrationId === latestOrchestrationId
  )), [detail.skillRuns, latestOrchestrationId])
  const blockedSkillRuns = useMemo(() => latestSkillRuns.filter((record) => record.status === 'blocked'), [latestSkillRuns])
  const currentDNAVersion = useMemo(() => detail.dnaVersions
    .filter((record) => record.status === 'review_required')
    .sort((left, right) => right.version - left.version)[0], [detail.dnaVersions])
  const findings = useMemo(() => detail.evidence.filter((record) => (
    record.sourceType === 'derived_skill_evidence'
    && (!latestOrchestrationId || record.orchestrationId === latestOrchestrationId)
  )), [detail.evidence, latestOrchestrationId])
  const studyRunReady = detail.study.status === 'ready_to_study'

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return
    setBusy(true)
    setError(undefined)
    const response = await api.appendMessage(detail.study.id, {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
      clientMessageId: `study-chat-${crypto.randomUUID()}`,
      content: message,
    })
    if (response.ok) {
      setMessage('')
      await onChanged(response.data.detail)
    } else setError(response.message)
    setBusy(false)
  }

  const runEvidenceStudy = async () => {
    setBusy(true)
    setError(undefined)
    const response = await api.runEvidenceStudy(detail.study.id, {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
    })
    if (response.ok) await onChanged(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  const synthesizePreferenceDNA = async () => {
    setBusy(true)
    setError(undefined)
    const response = await api.synthesizePreferenceDNA(detail.study.id, {
      workspaceId,
      expectedStudyRevision: detail.study.revision,
    })
    if (response.ok) await onChanged(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  return (
    <div className="edit-reference-chat-shell" data-testid="edit-reference-study-chat">
      <header>
        <div>
          <span>Preference Study Chat</span>
          <h3>{detail.study.title}</h3>
        </div>
        <Badge accent={detail.reference.status === 'active' ? 'cyan' : 'muted'}>{detail.study.status.replaceAll('_', ' ')}</Badge>
      </header>
      <section className="edit-reference-evidence-workspace" aria-label="Study evidence">
        <div className="edit-reference-evidence-toolbar">
          <div>
            <ClipboardList aria-hidden="true" size={18} />
            <div>
              <strong>{activeSourceEvidence.length ? `${activeSourceEvidence.length} active evidence source${activeSourceEvidence.length === 1 ? '' : 's'}` : 'Add evidence to begin the study'}</strong>
              <span>Creative notes, safe video details, or an approved edit identity</span>
            </div>
          </div>
          <div>
            <Button data-testid="add-edit-reference-evidence" disabled={disabled || detail.reference.status === 'archived'} icon={Plus} onClick={() => setShowEvidenceForm((current) => !current)} size="sm" variant="ghost">
              {showEvidenceForm ? 'Close' : 'Add evidence'}
            </Button>
            <Button data-testid="run-edit-reference-evidence-study" disabled={disabled || activeSourceEvidence.length === 0 || !studyRunReady || detail.reference.status === 'archived'} icon={SearchCheck} onClick={() => void runEvidenceStudy()} size="sm" variant="primary">
              {disabled ? 'Studying…' : studyRunReady ? 'Study evidence' : 'Evidence reviewed'}
            </Button>
          </div>
        </div>
        {showEvidenceForm && (
          <EvidenceForm
            detail={detail}
            disabled={disabled}
            onAdded={async (next) => {
              setShowEvidenceForm(false)
              await onChanged(next)
            }}
            setBusy={setBusy}
            setError={setError}
          />
        )}
        {sourceEvidence.length > 0 && (
          <div className="edit-reference-evidence-list" data-testid="edit-reference-evidence-list">
            {sourceEvidence.map((record) => (
              <article className={supersededSourceIds.has(record.id) ? 'superseded' : ''} key={record.id}>
                <span>{record.supersedesEvidenceId ? 'Correction' : evidenceSourceLabel(record.sourceType)}</span>
                <strong>{record.title}</strong>
                <p>{record.summary}</p>
                <small>{supersededSourceIds.has(record.id) ? 'Superseded by a correction' : `${record.category.replaceAll('_', ' ')} · ${record.provenance.mediaStudyStatus === 'media_not_studied' ? 'video not studied' : record.confidenceBasis.replaceAll('_', ' ')}`}</small>
              </article>
            ))}
          </div>
        )}
        {findings.length > 0 && (
          <div className="edit-reference-findings" data-testid="edit-reference-study-findings">
            <div>
              <SearchCheck aria-hidden="true" size={18} />
              <strong>Latest study findings</strong>
              <span>These findings are evidence summaries—not Preference DNA.</span>
            </div>
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
                <strong>Not analyzed</strong>
                {blockedSkillRuns.map((run) => (
                  <p key={run.id}><span>{skillRunLabel(run.skillId)}</span>{run.blockedReasons[0] ?? 'This part of the study is not available yet.'}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {!currentDNAVersion && detail.study.status === 'evidence_ready' && (
          <div className="edit-reference-dna-action" data-testid="edit-reference-dna-action">
            <BrainCircuit aria-hidden="true" size={20} />
            <div>
              <strong>Evidence is ready for Preference DNA</strong>
              <p>Create an exact, evidence-linked version for quality review. Nothing will be approved or applied yet.</p>
            </div>
            <Button data-testid="generate-edit-reference-dna" disabled={disabled} icon={Sparkles} onClick={() => void synthesizePreferenceDNA()} size="sm" variant="primary">
              {disabled ? 'Preparing…' : 'Generate DNA'}
            </Button>
          </div>
        )}
        {currentDNAVersion && <PreferenceDNAReview version={currentDNAVersion} />}
      </section>
      <div className="edit-reference-message-list" aria-live="polite">
        {orderedMessages.map((item) => (
          <article className={`edit-reference-message ${item.role}`} data-testid={`study-message-${item.role}`} key={item.id}>
            <span>{item.role === 'assistant' ? 'Study Director' : item.role}</span>
            <p>{item.content}</p>
            <small>{item.runtimeSource === 'deterministic_setup' ? 'Study setup' : item.runtimeSource === 'deterministic_evidence' ? 'Evidence update' : item.runtimeSource === 'deterministic_dna' ? 'Preference DNA update' : 'Saved user direction'}</small>
          </article>
        ))}
      </div>
      <form className="edit-reference-chat-composer" onSubmit={send}>
        <label className="sr-only" htmlFor="edit-reference-study-message">Message Study Director</label>
        <textarea
          data-testid="edit-reference-study-message"
          disabled={disabled || detail.reference.status === 'archived'}
          id="edit-reference-study-message"
          maxLength={8_000}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Explain what is transferable, where it applies, and what must not be copied…"
          rows={3}
          value={message}
        />
        <Button data-testid="send-edit-reference-study-message" disabled={disabled || !message.trim() || detail.reference.status === 'archived'} icon={Send} type="submit" variant="primary">
          {disabled ? 'Saving…' : 'Save direction'}
        </Button>
      </form>
    </div>
  )
}

type EvidenceFormMode = 'manual_user_evidence' | 'reference_video_metadata' | 'previous_approved_edit_snapshot'

function EvidenceForm({ detail, disabled, onAdded, setBusy, setError }: {
  detail: EditReferenceDetail
  disabled: boolean
  onAdded: (detail: EditReferenceDetail) => Promise<void>
  setBusy: (value: boolean) => void
  setError: (value: string | undefined) => void
}) {
  const [mode, setMode] = useState<EvidenceFormMode>('manual_user_evidence')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState<Exclude<PreferenceEvidenceCategory, 'media_structure' | 'copy_safety'>>('all_goals')
  const [intendedUse, setIntendedUse] = useState<Exclude<PreferenceEvidenceTransferability, 'unknown'>>('transferable')
  const [supersedesEvidenceId, setSupersedesEvidenceId] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [rightsBasis, setRightsBasis] = useState<'user_owned' | 'licensed_or_authorized' | 'reference_only'>('reference_only')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [hasAudio, setHasAudio] = useState<'unknown' | 'yes' | 'no'>('unknown')
  const [projectId, setProjectId] = useState('')
  const [editSessionId, setEditSessionId] = useState('')
  const [approvedSnapshotId, setApprovedSnapshotId] = useState('')
  const correctedIds = new Set(detail.evidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const correctableEvidence = detail.evidence.filter((record) => record.sourceType === 'manual_user_evidence' && !correctedIds.has(record.id))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    let input: CreatePreferenceEvidenceRequest
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
      input = {
        workspaceId,
        expectedStudyRevision: detail.study.revision,
        sourceType: mode,
        title,
        sourceLabel,
        rightsBasis,
        ...(durationSeconds ? { durationSeconds: Number(durationSeconds) } : {}),
        ...(width ? { width: Number(width) } : {}),
        ...(height ? { height: Number(height) } : {}),
        ...(hasAudio === 'unknown' ? {} : { hasAudio: hasAudio === 'yes' }),
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
    const response = await api.addEvidence(detail.study.id, input)
    if (response.ok) await onAdded(response.data.detail)
    else setError(response.message)
    setBusy(false)
  }

  const submitDisabled = disabled || !title.trim()
    || (mode === 'manual_user_evidence' && !summary.trim())
    || (mode === 'reference_video_metadata' && !sourceLabel.trim())
    || (mode === 'previous_approved_edit_snapshot' && (!projectId.trim() || !editSessionId.trim() || !approvedSnapshotId.trim()))

  return (
    <form className="edit-reference-evidence-form" data-testid="edit-reference-evidence-form" onSubmit={submit}>
      <div className="edit-reference-evidence-mode" aria-label="Evidence type">
        <EvidenceModeButton active={mode === 'manual_user_evidence'} icon={ClipboardList} label="Creative note" onClick={() => setMode('manual_user_evidence')} />
        <EvidenceModeButton active={mode === 'reference_video_metadata'} icon={FileVideo2} label="Video details" onClick={() => setMode('reference_video_metadata')} />
        <EvidenceModeButton active={mode === 'previous_approved_edit_snapshot'} icon={History} label="Approved edit" onClick={() => setMode('previous_approved_edit_snapshot')} />
      </div>
      <label>
        <span>Evidence title</span>
        <input autoFocus data-testid="edit-reference-evidence-title" maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Give this evidence a clear name" required value={title} />
      </label>
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
          <div className="edit-reference-form-boundary"><LockKeyhole aria-hidden="true" size={16} /><span>This step saves only the details you enter. It does not upload, fetch, open, or analyze a video.</span></div>
          <label>
            <span>Reference label</span>
            <input data-testid="edit-reference-video-label" maxLength={240} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Example: 67-second editorial explainer" required value={sourceLabel} />
          </label>
          <div className="edit-reference-evidence-grid three">
            <label><span>Duration (seconds)</span><input min="0" max="86400" onChange={(event) => setDurationSeconds(event.target.value)} type="number" value={durationSeconds} /></label>
            <label><span>Width</span><input min="1" max="16384" onChange={(event) => setWidth(event.target.value)} type="number" value={width} /></label>
            <label><span>Height</span><input min="1" max="16384" onChange={(event) => setHeight(event.target.value)} type="number" value={height} /></label>
          </div>
          <div className="edit-reference-evidence-grid">
            <label><span>Rights basis</span><select onChange={(event) => setRightsBasis(event.target.value as typeof rightsBasis)} value={rightsBasis}><option value="reference_only">Reference only</option><option value="user_owned">I own it</option><option value="licensed_or_authorized">Licensed or authorized</option></select></label>
            <label><span>Audio</span><select onChange={(event) => setHasAudio(event.target.value as typeof hasAudio)} value={hasAudio}><option value="unknown">Not specified</option><option value="yes">Audio present</option><option value="no">No audio</option></select></label>
          </div>
        </>
      )}
      {mode === 'previous_approved_edit_snapshot' && (
        <>
          <div className="edit-reference-form-boundary"><LockKeyhole aria-hidden="true" size={16} /><span>Only the exact approved-edit identity is recorded here. Project history and media stay closed until private snapshot authority is connected.</span></div>
          <div className="edit-reference-evidence-grid three">
            <label><span>Project ID</span><input data-testid="edit-reference-evidence-project-id" maxLength={200} onChange={(event) => setProjectId(event.target.value)} required value={projectId} /></label>
            <label><span>Edit ID</span><input data-testid="edit-reference-evidence-edit-id" maxLength={200} onChange={(event) => setEditSessionId(event.target.value)} required value={editSessionId} /></label>
            <label><span>Approved snapshot ID</span><input data-testid="edit-reference-evidence-snapshot-id" maxLength={200} onChange={(event) => setApprovedSnapshotId(event.target.value)} required value={approvedSnapshotId} /></label>
          </div>
          <label><span>Why this edit matters (optional)</span><textarea maxLength={2_000} onChange={(event) => setSummary(event.target.value)} rows={3} value={summary} /></label>
        </>
      )}
      <div className="edit-reference-form-actions">
        <Button data-testid="save-edit-reference-evidence" disabled={submitDisabled} icon={Plus} type="submit" variant="primary">{disabled ? 'Saving…' : 'Save evidence'}</Button>
      </div>
    </form>
  )
}

function EvidenceModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof ClipboardList; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className={active ? 'active' : ''} onClick={onClick} type="button"><Icon aria-hidden="true" size={17} /><span>{label}</span></button>
}

function PreferenceDNAReview({ version }: { version: EditReferenceDetail['dnaVersions'][number] }) {
  return (
    <section className="edit-reference-dna-review" data-testid="edit-reference-dna-review">
      <header>
        <div>
          <span>Preference DNA version {version.version}</span>
          <strong>Ready for quality review</strong>
        </div>
        <Badge accent="muted">QA not run</Badge>
      </header>
      <div className="edit-reference-dna-metrics">
        <span><strong>{version.layers.length}</strong> layers</span>
        <span><strong>{version.rules.length}</strong> evidence-linked rules</span>
        <span><strong>{version.doNotCopyRuleCount}</strong> copy boundaries</span>
        <span><strong>{Math.round(version.overallConfidence * 100)}%</strong> evidence confidence</span>
      </div>
      {version.conflicts.length > 0 && (
        <div className="edit-reference-dna-conflicts">
          <strong>Review required</strong>
          {version.conflicts.map((conflict) => <p key={conflict.id}>{conflict.title}: {conflict.summary}</p>)}
        </div>
      )}
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
      <div className="edit-reference-form-boundary"><ShieldCheck aria-hidden="true" size={16} /><span>This version is immutable and evidence-linked. Quality review and your approval are still required before it can guide an edit.</span></div>
    </section>
  )
}

function evidenceSourceLabel(sourceType: string): string {
  if (sourceType === 'manual_user_evidence') return 'Creative note'
  if (sourceType === 'reference_video_metadata') return 'Video details'
  return 'Approved edit identity'
}

function evidenceRuntimeLabel(runtimeSource: string): string {
  if (runtimeSource === 'verified_local') return 'Safe metadata check'
  if (runtimeSource === 'verified_mock') return 'Deterministic safety check'
  if (runtimeSource === 'fallback') return 'Based on your saved direction'
  if (runtimeSource === 'blocked') return 'Analysis not available'
  return runtimeSource.replaceAll('_', ' ')
}

function skillRunLabel(skillId: string): string {
  if (skillId === 'edit_reference.speech_pacing.evidence') return 'Speech and pause analysis'
  if (skillId === 'edit_reference.media_structure.metadata_map') return 'Approved edit access'
  if (skillId === 'edit_reference.story_editorial.qwen_reasoning') return 'Story and pacing review'
  if (skillId === 'edit_reference.transferability.copy_safety') return 'Copy-safety review'
  return 'Evidence analysis'
}

function InspectorState({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <article className="edit-reference-inspector-state">
      <Icon aria-hidden="true" size={18} />
      <div><span>{label}</span><strong>{value}</strong></div>
    </article>
  )
}

function PanelPlaceholder({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return <div aria-live="polite" className="edit-reference-placeholder" role="status">{icon}<p>{label}</p></div>
}

function AppliedEditsTab() {
  return (
    <section className="edit-reference-static-panel" data-testid="applied-edits-panel">
      <FileCheck2 aria-hidden="true" size={28} />
      <h2>No approved Preference DNA has been applied</h2>
      <p>Applications appear only after evidence review, Preference DNA quality checks, your approval, and adaptation to the target video.</p>
      <Badge accent="muted">0 applications</Badge>
    </section>
  )
}

function SafetyPrivacyTab() {
  const rules = [
    'Reference style is adapted to the target video, never copied blindly.',
    'Only the reference details and creative direction you choose are saved during setup.',
    'Reference media is analyzed only after you deliberately add it as evidence.',
    'Saving a label, duration, or frame size does not mean the video itself was studied.',
    'Creating or discussing a reference never starts production or changes your balance.',
    'You review and approve Preference DNA before it can guide an edit.',
  ]
  return (
    <section className="edit-reference-static-panel safety" data-testid="safety-privacy-panel">
      <ShieldCheck aria-hidden="true" size={30} />
      <h2>Private by default, honest about readiness</h2>
      <div>{rules.map((rule) => <p key={rule}><LockKeyhole aria-hidden="true" size={16} />{rule}</p>)}</div>
    </section>
  )
}
