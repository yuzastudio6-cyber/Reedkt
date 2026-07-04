import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardCheck, Download, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { internalTestingScenarios, type InternalTestingScenarioStatus } from '../lib/internal-testing-scenarios'
import {
  createProjectEditSessionBriefPath,
  createProjectEditSessionChatPath,
  createProjectHomePath,
} from '../lib/project-edit-session-navigation'

type FeedbackRecord = {
  id: string
  scenarioId: string
  result: 'passed' | 'blocked' | 'needs_review'
  note: string
  createdAt: string
}

const FEEDBACK_STORAGE_KEY = 'reeditpro:internal-testing-feedback:v1'
const PROJECT_ID = 'mock-project-edit-chat-foundation'
const EDIT_SESSION_ID = 'edit-session-youtube-wide'

const startCards = [
  {
    id: 'project-home',
    title: 'Project home',
    detail: 'Open the mock project and verify session cards before entering the editor.',
    route: createProjectHomePath(PROJECT_ID),
  },
  {
    id: 'edit-chat',
    title: 'Edit Chat',
    detail: 'Use the session-aware chat shell with route tabs and approval-safe boundaries.',
    route: createProjectEditSessionChatPath(PROJECT_ID, EDIT_SESSION_ID),
  },
  {
    id: 'edit-brief',
    title: 'Edit Brief',
    detail: 'Test markers, Marker Chat, metadata-only attachments, export settings, QA, and plan hints.',
    route: createProjectEditSessionBriefPath(PROJECT_ID, EDIT_SESSION_ID),
  },
]

const checklist = [
  {
    title: 'Use the session route, not legacy-only editor paths.',
    detail: 'Start with the project home, then move through Edit Chat and Brief tabs.',
  },
  {
    title: 'Confirm every edit stays approval-safe.',
    detail: 'No progress, preview, worker dispatch, render/export, or credit movement should appear before approval gates.',
  },
  {
    title: 'Record blockers as source-truth feedback.',
    detail: 'Use browser-local feedback export so the next PR can preserve exact repro notes without storing private media.',
  },
  {
    title: 'Keep release gates explicit.',
    detail: 'Internal testing can pass while external beta, real-user-media beta, live Supabase, and paid production remain gated.',
  },
]

function readFeedback(): FeedbackRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FeedbackRecord[]) : []
  } catch {
    return []
  }
}

function writeFeedback(records: FeedbackRecord[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(records, null, 2))
}

function getStatusAccent(status: InternalTestingScenarioStatus) {
  if (status === 'ready') return 'success'
  if (status === 'mock_local') return 'cyan'
  if (status === 'blocked') return 'warning'
  return 'muted'
}

function getScenarioHighlights() {
  const prioritizedIds = new Set([
    'project-home-edit-chat-cards',
    'project-home-new-edit-placeholder',
    'edit-brief-shell-route-tab',
    'edit-brief-shell-no-runtime-effects',
    'edit-brief-marker-add-at-playhead',
    'edit-brief-marker-chat-send',
    'edit-brief-attachments-add-broll',
    'edit-brief-export-settings-save',
    'edit-brief-qa-run-brief',
    'edit-brief-plan-prepare-hints',
    'preference-video-mock-only-limits',
    'feedback-export',
  ])

  return internalTestingScenarios.filter((scenario) => prioritizedIds.has(scenario.id)).slice(0, 12)
}

export function InternalTestingPage() {
  const [records, setRecords] = useState<FeedbackRecord[]>(readFeedback)
  const [scenarioId, setScenarioId] = useState(getScenarioHighlights()[0]?.id ?? internalTestingScenarios[0]?.id ?? '')
  const [result, setResult] = useState<FeedbackRecord['result']>('passed')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  const statusCounts = useMemo(() => {
    return internalTestingScenarios.reduce<Record<InternalTestingScenarioStatus, number>>(
      (counts, scenario) => {
        counts[scenario.status] += 1
        return counts
      },
      { ready: 0, partial: 0, future: 0, mock_local: 0, blocked: 0 },
    )
  }, [])

  const highlightedScenarios = useMemo(getScenarioHighlights, [])
  const exportJson = JSON.stringify(
    {
      source: 'reeditpro-internal-testing-entrypoint',
      mockOnly: true,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      boundary: {
        providerCalls: false,
        workerDispatch: false,
        mediaProcessing: false,
        renderExport: false,
        creditSpend: false,
        supabaseWrites: false,
      },
      records,
    },
    null,
    2,
  )

  function saveFeedback() {
    const cleanNote = note.trim()
    if (!scenarioId || cleanNote.length < 3) {
      setMessage('Add a scenario and a short testing note before saving.')
      return
    }

    const nextRecords = [
      {
        id: `internal-feedback-${Date.now()}`,
        scenarioId,
        result,
        note: cleanNote,
        createdAt: new Date().toISOString(),
      },
      ...records,
    ]

    setRecords(nextRecords)
    writeFeedback(nextRecords)
    setNote('')
    setMessage('Feedback saved in this browser only. Export JSON before clearing local records.')
  }

  function clearFeedback() {
    setRecords([])
    writeFeedback([])
    setMessage('Local feedback cleared from this browser.')
  }

  return (
    <AppShell
      description="Production-shaped mock/internal testing console for route coverage, source-truth notes, and release-gate discipline."
      eyebrow="Internal testing"
      primaryAction="Open Edit Brief"
      title="Internal testing console"
    >
      <div className="internal-testing-page" data-testid="internal-testing-page">
        <section className="internal-testing-hero" aria-label="Internal testing status">
          <Card className="internal-testing-status-card" data-testid="internal-testing-status-card">
            <div className="internal-testing-card-heading">
              <span className="internal-testing-status-icon">
                <ShieldCheck aria-hidden="true" size={22} />
              </span>
              <Badge accent="success">Production-shaped mock</Badge>
            </div>
            <h2>Repeated internal testing is wired</h2>
            <p>
              Use the same project, edit-session, brief, feedback, and QA seams that later release work can graduate with evidence.
            </p>
            <dl className="internal-testing-rc-status-list" data-testid="internal-testing-status-list">
              <div>
                <dt>Scenario registry</dt>
                <dd>{internalTestingScenarios.length} checks</dd>
              </div>
              <div>
                <dt>Project route</dt>
                <dd>{PROJECT_ID}</dd>
              </div>
              <div>
                <dt>Release gates</dt>
                <dd>Still explicit</dd>
              </div>
            </dl>
          </Card>

          <Card className="internal-testing-status-card" data-testid="internal-testing-boundary-card">
            <div className="internal-testing-card-heading">
              <span className="internal-testing-status-icon">
                <ClipboardCheck aria-hidden="true" size={22} />
              </span>
              <Badge accent="cyan">No runtime side effects</Badge>
            </div>
            <h2>Testing does not start production work</h2>
            <p>
              This page opens browser-safe mock flows only. It does not upload files, call providers, dispatch workers, render/export, write
              Supabase rows, or spend credits.
            </p>
            <div className="internal-testing-pill-row" data-testid="internal-testing-boundary-list">
              {['No upload', 'No provider', 'No worker', 'No render', 'No credits', 'No Supabase write'].map((item) => (
                <Badge accent="muted" key={item}>
                  {item}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="internal-testing-status-card" data-testid="internal-testing-scenario-summary">
            <div className="internal-testing-card-heading">
              <span className="internal-testing-status-icon">
                <CheckCircle2 aria-hidden="true" size={22} />
              </span>
              <Badge accent="violet">Registry summary</Badge>
            </div>
            <h2>Scenario readiness</h2>
            <dl className="internal-testing-rc-status-list">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <dt>{status.replace(/_/g, ' ')}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        <section className="internal-testing-hero" aria-label="Start points">
          {startCards.map((card) => (
            <Card className="internal-testing-start-card" data-testid={`internal-testing-start-${card.id}`} key={card.route}>
              <div className="internal-testing-card-heading">
                <h3>{card.title}</h3>
                <Badge accent="cyan">Mock route</Badge>
              </div>
              <p>{card.detail}</p>
              <div className="internal-testing-start-actions">
                <Button icon={ArrowRight} to={card.route} variant="primary">
                  Open
                </Button>
                <Link className="internal-testing-route-link" to={card.route}>
                  {card.route}
                  <ExternalLink aria-hidden="true" size={15} />
                </Link>
              </div>
            </Card>
          ))}
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-preference-video-limits">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Preference Video limits</span>
            <h2>Mock-local Preference DNA is visible, not executable media analysis</h2>
          </div>
          <p>
            Preference Video scenarios are now closeout-ready for internal testing because the referenced route is mounted and the limitations are
            explicit. This does not authorize real reference media analysis, URL fetches, provider calls, workers, render/export, credit movement,
            Supabase persistence, external beta, or product-ready behavior.
          </p>
          <div className="internal-testing-limit-grid">
            <article>
              <Badge accent="success">Allowed in internal testing</Badge>
              <ul>
                <li>Inspect seeded and browser-local Edit Preference records.</li>
                <li>Record reference labels or URL text without fetching the URL.</li>
                <li>Verify do-not-copy, adapted-not-copied, and QA boundary copy.</li>
              </ul>
            </article>
            <article>
              <Badge accent="warning">Still blocked until later gates</Badge>
              <ul>
                <li>Reference upload, file-byte reads, URL fetch, or real media analysis.</li>
                <li>Qwen, DeepSeek, provider, worker, media, render/export, or credit execution.</li>
                <li>Supabase persistence, Storage, signed URLs, external beta, paid production, or product-ready claims.</li>
              </ul>
            </article>
          </div>
          <Link className="internal-testing-route-link" to="/edit-preferences">
            Open /edit-preferences
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        </section>

        <section className="internal-testing-content-grid">
          <Card className="internal-testing-checklist" data-testid="internal-testing-checklist">
            <div className="internal-testing-section-heading">
              <span className="section-eyebrow">Testing discipline</span>
              <h3>Before filing a pass</h3>
            </div>
            <div className="internal-testing-checklist-list">
              {checklist.map((item) => (
                <label className="internal-testing-checklist-row" key={item.title}>
                  <input aria-label={item.title} type="checkbox" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <div className="internal-testing-scenarios" data-testid="internal-testing-scenarios">
            <div className="internal-testing-section-heading">
              <span className="section-eyebrow">High-signal scenarios</span>
              <h2>Use these first when checking the Edit Brief flow</h2>
            </div>
            <div className="internal-testing-scenario-grid">
              {highlightedScenarios.map((scenario) => (
                <Card className="internal-testing-scenario-card" data-testid="internal-testing-scenario-card" key={scenario.id}>
                  <div className="internal-testing-card-heading">
                    <h3>{scenario.title}</h3>
                    <Badge accent={getStatusAccent(scenario.status)}>{scenario.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p>{scenario.description}</p>
                  <ol>
                    {scenario.steps.slice(0, 3).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="internal-testing-expected">{scenario.expectedResult}</p>
                  <Link className="internal-testing-route-link" to={scenario.route}>
                    Open {scenario.route}
                    <ExternalLink aria-hidden="true" size={15} />
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="internal-testing-feedback-grid" aria-label="Internal feedback">
          <Card className="internal-testing-feedback-card" data-testid="internal-testing-feedback-form">
            <div className="internal-testing-section-heading">
              <span className="section-eyebrow">Browser-local feedback</span>
              <h3>Record one source-truth note</h3>
            </div>
            <div className="internal-testing-form-grid">
              <label>
                Scenario
                <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
                  {highlightedScenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Result
                <select value={result} onChange={(event) => setResult(event.target.value as FeedbackRecord['result'])}>
                  <option value="passed">Passed</option>
                  <option value="blocked">Blocked</option>
                  <option value="needs_review">Needs review</option>
                </select>
              </label>
              <label className="internal-testing-field-wide">
                Note
                <textarea
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What did you verify, what failed, or what should the next PR fix?"
                  rows={5}
                  value={note}
                />
              </label>
            </div>
            {message && (
              <p className={`internal-testing-form-message ${message.startsWith('Add') ? 'internal-testing-form-message-error' : ''}`.trim()}>
                {message}
              </p>
            )}
            <div className="internal-testing-feedback-actions">
              <Button icon={ClipboardCheck} onClick={saveFeedback} variant="primary">
                Save local note
              </Button>
              <Button icon={Trash2} onClick={clearFeedback} variant="secondary">
                Clear local notes
              </Button>
            </div>
          </Card>

          <Card className="internal-testing-feedback-list-card" data-testid="internal-testing-feedback-list">
            <div className="internal-testing-section-heading">
              <span className="section-eyebrow">Recorded notes</span>
              <h3>{records.length} browser-local records</h3>
            </div>
            <div className="internal-testing-feedback-records">
              {records.length ? (
                records.slice(0, 4).map((record) => (
                  <article className="internal-testing-feedback-record" key={record.id}>
                    <div>
                      <strong>{record.scenarioId}</strong>
                      <span>
                        {record.result.replace(/_/g, ' ')} - {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{record.note}</p>
                  </article>
                ))
              ) : (
                <p className="internal-testing-empty-state">No feedback saved in this browser yet.</p>
              )}
            </div>
          </Card>

          <Card className="internal-testing-feedback-list-card" data-testid="internal-testing-feedback-export">
            <div className="internal-testing-section-heading">
              <span className="section-eyebrow">Manual export</span>
              <h3>Copy JSON into the next issue or PR</h3>
            </div>
            <textarea aria-label="Internal testing feedback JSON export" className="internal-testing-feedback-json" readOnly value={exportJson} />
            <div className="internal-testing-feedback-actions">
              <Button icon={Download} onClick={() => navigator.clipboard?.writeText(exportJson)} variant="secondary">
                Copy JSON
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
