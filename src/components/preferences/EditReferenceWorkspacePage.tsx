import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  Archive,
  BookOpen,
  BrainCircuit,
  CircleAlert,
  Database,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import type {
  EditReferenceDetail,
  EditReferenceListItem,
  EditReferenceStudyGoal,
} from '../../types/edit-reference'
import { EDIT_REFERENCE_STUDY_GOALS } from '../../types/edit-reference'
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
      <InspectorState icon={Sparkles} label="Preference DNA" value={view.dnaStatus} />
      <InspectorState icon={ShieldCheck} label="Quality review" value={view.qaStatus} />
      <InspectorState icon={MessageSquareText} label="Next required action" value={view.nextAction} />
      <div className="edit-reference-inspector-section">
        <span>Study goals</span>
        <div className="edit-reference-goal-chips">
          {detail.reference.initialGoals.map((goal) => <small key={goal}>{goal.replaceAll('_', ' ')}</small>)}
        </div>
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
  const orderedMessages = useMemo(() => detail.messages.slice().sort((left, right) => left.sequence - right.sequence), [detail.messages])

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

  return (
    <div className="edit-reference-chat-shell" data-testid="edit-reference-study-chat">
      <header>
        <div>
          <span>Preference Study Chat</span>
          <h3>{detail.study.title}</h3>
        </div>
        <Badge accent={detail.reference.status === 'active' ? 'cyan' : 'muted'}>{detail.study.status.replaceAll('_', ' ')}</Badge>
      </header>
      <div className="edit-reference-message-list" aria-live="polite">
        {orderedMessages.map((item) => (
          <article className={`edit-reference-message ${item.role}`} data-testid={`study-message-${item.role}`} key={item.id}>
            <span>{item.role === 'assistant' ? 'Study Director' : item.role}</span>
            <p>{item.content}</p>
            <small>{item.runtimeSource === 'deterministic_setup' ? 'Study setup' : 'Saved user direction'}</small>
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
