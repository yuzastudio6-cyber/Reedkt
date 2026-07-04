import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardList, Filter, Link as LinkIcon, MessageSquareText, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { listProjectEditSessionPreferenceOptionsForUI } from '../lib/project-edit-session-preference-ui-adapter'
import type { ProjectEditSessionPreferenceOption } from '../types/project-edit-session-preference'

type DraftPreference = {
  id: string
  handle: string
  name: string
  sourceMode: 'chat_description' | 'reference_label'
  description: string
  tags: string[]
  createdAt: string
}

type LibraryPreference = ProjectEditSessionPreferenceOption & {
  tags: string[]
  bestFor: string
  contractSummary: string
  sourceSummary: string
  signals: string[]
  version: string
}

const PROJECT_ID = 'mock-project-edit-chat-foundation'
const EDIT_SESSION_ID = 'edit-session-youtube-wide'
const DRAFT_STORAGE_KEY = 'reeditpro:edit-preferences:drafts:v1'

const fallbackPreference: LibraryPreference = {
  id: 'pref_lifestyle_travel_vlog',
  handle: '@lifestyle-travel-vlog',
  name: 'Lifestyle Travel Vlog',
  sourceKind: 'saved_edit_preference',
  description: 'Mock saved preference with safe Preference DNA-style hints for Edit Chat context only.',
  hasDNA: true,
  dnaStatusLabel: 'Preference DNA applied',
  dnaQAStatusLabel: 'approved mock',
  doNotCopyRulesActive: true,
  requiresUserReview: false,
  mockOnly: true,
  tags: ['travel', 'lifestyle', 'warm pacing'],
  bestFor: 'Talking-head travel, creator reels, and story-first social edits.',
  contractSummary: 'Adapt pacing, captions, color restraint, and SoundSync mood without copying reference media.',
  sourceSummary: 'Seeded mock Preference DNA; no source media or URL fetch required.',
  signals: ['voice-led pacing', 'clean warm captions', 'light b-roll rhythm'],
  version: 'mock-v1',
}

const localBoundary = {
  providerCalls: false,
  qwenCalls: false,
  deepseekCalls: false,
  urlFetch: false,
  fileBytesRead: false,
  mediaProcessing: false,
  workerDispatch: false,
  renderExport: false,
  creditSpend: false,
  supabaseWrites: false,
}

function readDrafts(): DraftPreference[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DraftPreference[]) : []
  } catch {
    return []
  }
}

function writeDrafts(drafts: DraftPreference[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts, null, 2))
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'draft-preference'
}

function tagFromText(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5)
}

function enrichOption(option: ProjectEditSessionPreferenceOption): LibraryPreference {
  if (option.handle === fallbackPreference.handle) return { ...fallbackPreference, ...option }

  return {
    ...option,
    tags: option.sourceKind === 'legacy_no_dna' ? ['legacy', 'clean edit', 'fallback'] : ['mock', option.sourceKind.replace(/_/g, ' ')],
    bestFor: option.sourceKind === 'legacy_no_dna'
      ? 'Simple clean edits that need reusable style guidance without Preference DNA.'
      : 'Planning-safe edit sessions that need reusable preference metadata.',
    contractSummary: option.hasDNA
      ? 'Use DNA as adapted-not-copied planning guidance after mock QA allows it.'
      : 'Use saved preference text as broad creative direction only.',
    sourceSummary: option.sourceKind === 'none'
      ? 'No reusable preference selected.'
      : `${option.sourceKind.replace(/_/g, ' ')}; mock metadata only.`,
    signals: option.hasDNA ? ['do-not-copy active', 'DNA QA visible', 'planning metadata only'] : ['manual style notes', 'no DNA package', 'approval-safe'],
    version: option.sourceKind === 'legacy_no_dna' ? 'legacy-v1' : 'mock-v1',
  }
}

function draftToPreference(draft: DraftPreference): LibraryPreference {
  return {
    id: draft.id,
    handle: draft.handle,
    name: draft.name,
    sourceKind: draft.sourceMode === 'reference_label' ? 'created_from_reference' : 'mock_fixture',
    description: draft.description,
    hasDNA: draft.sourceMode === 'reference_label',
    dnaStatusLabel: draft.sourceMode === 'reference_label' ? 'Reference DNA draft prepared' : 'Chat description draft',
    dnaQAStatusLabel: 'needs future QA',
    doNotCopyRulesActive: draft.sourceMode === 'reference_label',
    requiresUserReview: draft.sourceMode === 'reference_label',
    mockOnly: true,
    tags: draft.tags,
    bestFor: 'Internal testing of reusable edit direction before runtime persistence exists.',
    contractSummary: 'Browser-local draft only; can inform future owner review but cannot execute or mutate production records.',
    sourceSummary: draft.sourceMode === 'reference_label'
      ? 'Reference label/URL text was recorded without fetching the URL.'
      : 'Chat description text was compiled into a local preference draft.',
    signals: draft.sourceMode === 'reference_label'
      ? ['reference label only', 'do-not-copy required', 'future QA needed']
      : ['chat instruction draft', 'safe reusable wording', 'future QA needed'],
    version: 'browser-draft',
  }
}

export function EditPreferencesPage() {
  const [options, setOptions] = useState<LibraryPreference[]>([fallbackPreference])
  const [drafts, setDrafts] = useState<DraftPreference[]>(readDrafts)
  const [selectedId, setSelectedId] = useState(fallbackPreference.id)
  const [query, setQuery] = useState('')
  const [sourceMode, setSourceMode] = useState<DraftPreference['sourceMode']>('chat_description')
  const [name, setName] = useState('Clean teaching short')
  const [description, setDescription] = useState('Clear captions, calm pacing, voice-first music, and no flashy transitions.')
  const [tags, setTags] = useState('teaching, captions, calm')
  const [status, setStatus] = useState('Edit Preferences are mock/local and safe for internal testing.')

  useEffect(() => {
    let cancelled = false
    listProjectEditSessionPreferenceOptionsForUI({ projectId: PROJECT_ID, editSessionId: EDIT_SESSION_ID }).then((preferenceOptions) => {
      if (cancelled) return
      const enriched = preferenceOptions.filter((option) => option.sourceKind !== 'none').map(enrichOption)
      setOptions(enriched.length ? enriched : [fallbackPreference])
      setSelectedId((current) => (current ? current : enriched[0]?.id ?? fallbackPreference.id))
    })

    return () => {
      cancelled = true
    }
  }, [])

  const library = useMemo(() => [...options, ...drafts.map(draftToPreference)], [drafts, options])
  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return library
    return library.filter((preference) => {
      const text = [
        preference.name,
        preference.handle,
        preference.description,
        preference.bestFor,
        preference.tags.join(' '),
        preference.signals.join(' '),
      ].join(' ').toLowerCase()
      return text.includes(cleanQuery)
    })
  }, [library, query])
  const selected = library.find((preference) => preference.id === selectedId) ?? filtered[0] ?? fallbackPreference
  const dnaCount = library.filter((preference) => preference.hasDNA).length
  const draftCount = drafts.length

  function createDraft() {
    const cleanName = name.trim()
    const cleanDescription = description.trim()
    if (!cleanName || cleanDescription.length < 8) {
      setStatus('Add a name and a meaningful description before creating a local draft.')
      return
    }

    const draft: DraftPreference = {
      id: `pref_draft_${Date.now()}`,
      handle: `@${slugify(cleanName)}`,
      name: cleanName,
      sourceMode,
      description: cleanDescription,
      tags: tagFromText(tags),
      createdAt: new Date().toISOString(),
    }
    const next = [draft, ...drafts]
    setDrafts(next)
    writeDrafts(next)
    setSelectedId(draft.id)
    setStatus(`${draft.handle} created in browser-local storage only. Export or convert in a future approved persistence milestone.`)
  }

  return (
    <AppShell
      description="Reusable edit direction library for internal testing. Preferences guide planning metadata only until future persistence and runtime gates pass."
      eyebrow="Edit Preferences"
      title="Edit Preferences"
    >
      <div className="edit-preference-library-page" data-testid="edit-preferences-page">
        <section className="edit-preference-library-hero">
          <div>
            <span className="section-eyebrow">Reusable style direction</span>
            <h2>Saved preferences stay separate from Edit Chats</h2>
            <p>
              Use this mock/local library to inspect safe preference options, create browser-session drafts, and keep do-not-copy rules visible before
              any future production persistence or runtime wiring.
            </p>
          </div>
          <div className="edit-preference-hero-actions">
            <Button icon={Sparkles} onClick={createDraft} variant="primary">
              Create local draft
            </Button>
            <Button icon={ArrowRight} to={`/projects/${PROJECT_ID}/edits/${EDIT_SESSION_ID}`} variant="secondary">
              Open Edit Chat
            </Button>
          </div>
        </section>

        <section className="edit-preference-summary-strip" data-testid="edit-preference-summary-strip">
          <article>
            <span>Library records</span>
            <strong>{library.length}</strong>
            <small className="edit-preference-muted">Seeded plus browser-local drafts</small>
          </article>
          <article>
            <span>DNA-backed</span>
            <strong>{dnaCount}</strong>
            <small className="edit-preference-muted">Adapted-not-copied only</small>
          </article>
          <article>
            <span>Local drafts</span>
            <strong>{draftCount}</strong>
            <small className="edit-preference-muted">Stored in this browser</small>
          </article>
          <article>
            <span>Product-ready</span>
            <strong>0</strong>
            <small className="edit-preference-muted">Release gates still explicit</small>
          </article>
        </section>

        <section className="edit-preference-toolbar" data-testid="edit-preference-toolbar">
          <label className="edit-preference-search">
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search edit preferences"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search preferences, tags, signals"
              value={query}
            />
          </label>
          <label className="edit-preference-archive-toggle">
            <input checked readOnly type="checkbox" />
            Show mock/local records
          </label>
          <div className="edit-preference-tag-filter">
            <span>Safety boundary</span>
            <div>
              {Object.entries(localBoundary).map(([key, value]) => (
                <Badge accent="muted" key={key}>
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <p className="edit-preference-status-note" data-testid="edit-preference-status-note">
          <ShieldCheck aria-hidden="true" size={18} />
          {status}
        </p>

        <section className="edit-preference-library-layout">
          <div className="edit-preference-card-list" data-testid="edit-preference-card-list">
            {filtered.length ? (
              filtered.map((preference) => (
                <button
                  className={`edit-preference-card ${selected.id === preference.id ? 'active' : ''}`.trim()}
                  data-testid={`edit-preference-card-${preference.handle ?? preference.id}`}
                  key={preference.id}
                  onClick={() => setSelectedId(preference.id)}
                  type="button"
                >
                  <span className="edit-preference-card-topline">
                    <span>
                      <code>{preference.handle ?? preference.name}</code>
                      <strong>{preference.name}</strong>
                    </span>
                    <Badge accent={preference.hasDNA ? 'cyan' : 'muted'}>{preference.hasDNA ? 'DNA mock' : 'No DNA'}</Badge>
                  </span>
                  <span className="edit-preference-card-summary">{preference.description}</span>
                  <span className="edit-preference-card-tags">
                    {preference.tags.map((tag) => (
                      <small key={tag}>{tag}</small>
                    ))}
                  </span>
                  <span className="edit-preference-card-meta">
                    <span>{preference.sourceKind.replace(/_/g, ' ')}</span>
                    <span>{preference.version}</span>
                  </span>
                </button>
              ))
            ) : (
              <Card className="edit-preference-empty-state">
                <Filter aria-hidden="true" size={22} />
                <h3>No matching preference</h3>
                <p>Clear the search or create a browser-local draft for this internal testing session.</p>
              </Card>
            )}
          </div>

          <div className="edit-preference-detail-panel" data-testid="edit-preference-detail-panel">
            <div className="edit-preference-detail-header">
              <div>
                <code>{selected.handle ?? selected.id}</code>
                <h2>{selected.name}</h2>
              </div>
              <Badge accent={selected.requiresUserReview ? 'warning' : 'success'}>
                {selected.requiresUserReview ? 'Review before use' : 'Planning safe'}
              </Badge>
            </div>
            <p>{selected.bestFor}</p>
            <div className="edit-preference-detail-meta">
              <div>
                <span>Source</span>
                <strong>{selected.sourceKind.replace(/_/g, ' ')}</strong>
              </div>
              <div>
                <span>DNA QA</span>
                <strong>{selected.dnaQAStatusLabel ?? 'not available'}</strong>
              </div>
              <div>
                <span>Do not copy</span>
                <strong>{selected.doNotCopyRulesActive ? 'active' : 'not active'}</strong>
              </div>
            </div>
            <section className="edit-preference-detail-section">
              <div className="edit-preference-section-heading">
                <h3>Planning contract</h3>
                <Badge accent="cyan">Mock metadata</Badge>
              </div>
              <div className="edit-preference-contract-summary">
                <p>{selected.contractSummary}</p>
              </div>
            </section>
            <section className="edit-preference-video-dna-section">
              <div className="edit-preference-section-heading">
                <h3>Source and DNA policy</h3>
                <Badge accent="muted">No fetch</Badge>
              </div>
              <p>{selected.sourceSummary}</p>
              <div className="edit-preference-source-rule-grid">
                <section>
                  <span>Allowed now</span>
                  <ul>
                    <li>Browser-local preference inspection.</li>
                    <li>Session-only mock application inside Edit Chat.</li>
                    <li>Manual source-truth notes for future owner review.</li>
                  </ul>
                </section>
                <section>
                  <span>Blocked until later gates</span>
                  <ul>
                    <li>Reference URL fetch, upload, or media analysis.</li>
                    <li>Qwen, DeepSeek, provider, worker, render/export, or credit execution.</li>
                    <li>Supabase persistence, migration, Storage, signed URLs, external beta, or production release.</li>
                  </ul>
                </section>
              </div>
            </section>
            <section className="edit-preference-signal-summary">
              <div className="edit-preference-section-heading">
                <h3>Signals</h3>
              </div>
              <div className="edit-preference-signal-chip-row">
                {selected.signals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="preference-create-flow" data-testid="edit-preference-create-flow">
          <div className="preference-create-header">
            <div>
              <span className="section-eyebrow">Local draft creator</span>
              <h2>Create a browser-session preference</h2>
              <p>
                This captures reusable direction text only. Reference labels are not fetched, copied, analyzed, uploaded, or persisted remotely.
              </p>
            </div>
            <Badge accent="violet">Internal testing</Badge>
          </div>
          <div className="preference-create-mode-grid">
            <button
              className={`preference-create-mode-card ${sourceMode === 'chat_description' ? 'active' : ''}`.trim()}
              onClick={() => setSourceMode('chat_description')}
              type="button"
            >
              <MessageSquareText aria-hidden="true" size={22} />
              <strong>Chat description</strong>
              <span>Turn a written style note into browser-local reusable direction.</span>
            </button>
            <button
              className={`preference-create-mode-card ${sourceMode === 'reference_label' ? 'active' : ''}`.trim()}
              onClick={() => setSourceMode('reference_label')}
              type="button"
            >
              <LinkIcon aria-hidden="true" size={22} />
              <strong>Reference label or URL text</strong>
              <span>Record the label only. ReEditPro does not fetch, copy, or inspect the reference.</span>
            </button>
          </div>
          <div className="preference-create-basics">
            <label className="preference-create-field">
              Preference name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label className="preference-create-field">
              Tags
              <input onChange={(event) => setTags(event.target.value)} value={tags} />
              <small>Comma-separated, browser-local only.</small>
            </label>
            <label className="preference-create-field preference-create-wide-field">
              Direction
              <textarea onChange={(event) => setDescription(event.target.value)} value={description} />
            </label>
          </div>
          <div className="preference-create-validation">
            <ClipboardList aria-hidden="true" size={18} />
            Draft validation: no upload, no raw prompts, no media bytes, no provider calls, no Supabase writes, and no production
            persistence.
          </div>
          <div className="preference-create-actions">
            <Button icon={CheckCircle2} onClick={createDraft} variant="primary">
              Save browser-local draft
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
