import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  readInternalTestingAuthProjectAccessReadiness,
  type InternalTestingAuthProjectAccessReadiness,
  type InternalTestingAuthProjectAccessStatus,
} from '../lib/internal-testing-auth-project-access-readiness'
import {
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
} from '../lib/project-edit-session-backend-persistence-plan'
import { getMockSafeDurableProjectSessionBackendSkeleton } from '../lib/project-edit-session-backend-skeleton'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE,
  getDurableProjectSessionSupabaseRouteContractPlan,
} from '../lib/project-session-supabase-route-contract-plan'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE,
  getDurableProjectSessionSupabaseSchemaRlsDraft,
} from '../lib/project-session-supabase-schema-rls-draft'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE,
  getDurableProjectSessionSupabaseMigrationSqlDraft,
} from '../lib/project-session-supabase-migration-sql-draft'
import { PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE } from '../lib/project-edit-session-access-policy'
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
const DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION =
  'internal_testing_durable_project_session_backend_route_integration_passed_ready_for_readback_qa'
const DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA'
const DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION =
  'internal_testing_durable_project_session_backend_readback_qa_passed_ready_for_durable_supabase_route_contract_plan'
const DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN'

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

function getAuthReadinessAccent(status?: InternalTestingAuthProjectAccessStatus) {
  if (status === 'signed_in_auth_only') return 'success'
  if (status === 'signed_out') return 'cyan'
  if (status === 'error') return 'warning'
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
    'approval-credit-gate-readiness',
    'credit-lifecycle-readiness',
    'repeated-local-operator-harness',
    'auth-project-access-readiness',
    'auth-project-session-membership-policy',
    'durable-auth-project-session-backend-persistence-plan',
    'mock-safe-durable-project-session-backend-skeleton',
    'durable-project-session-backend-route-integration',
    'durable-project-session-backend-readback-qa',
    'durable-project-session-supabase-route-contract-plan',
    'durable-project-session-supabase-schema-rls-draft',
    'durable-project-session-supabase-migration-sql-draft',
    'feedback-export',
  ])

  return internalTestingScenarios.filter((scenario) => prioritizedIds.has(scenario.id)).slice(0, 24)
}

export function InternalTestingPage() {
  const [records, setRecords] = useState<FeedbackRecord[]>(readFeedback)
  const [scenarioId, setScenarioId] = useState(getScenarioHighlights()[0]?.id ?? internalTestingScenarios[0]?.id ?? '')
  const [result, setResult] = useState<FeedbackRecord['result']>('passed')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [authReadiness, setAuthReadiness] = useState<InternalTestingAuthProjectAccessReadiness | null>(null)
  const [authReadinessLoading, setAuthReadinessLoading] = useState(false)

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
  const backendSkeleton = useMemo(getMockSafeDurableProjectSessionBackendSkeleton, [])
  const supabaseRouteContractPlan = useMemo(getDurableProjectSessionSupabaseRouteContractPlan, [])
  const supabaseSchemaRlsDraft = useMemo(getDurableProjectSessionSupabaseSchemaRlsDraft, [])
  const supabaseMigrationSqlDraft = useMemo(getDurableProjectSessionSupabaseMigrationSqlDraft, [])
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
      authProjectAccessReadiness: authReadiness
        ? {
            status: authReadiness.status,
            configured: authReadiness.configured,
            projectId: authReadiness.projectId,
            editSessionId: authReadiness.editSessionId,
            source: authReadiness.source,
            blockedScope: authReadiness.blockedScope,
          }
        : null,
      records,
    },
    null,
    2,
  )

  const refreshAuthReadiness = useCallback(async () => {
    setAuthReadinessLoading(true)
    const nextReadiness = await readInternalTestingAuthProjectAccessReadiness()
    setAuthReadiness(nextReadiness)
    setAuthReadinessLoading(false)
  }, [])

  useEffect(() => {
    void refreshAuthReadiness()
  }, [refreshAuthReadiness])

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

        <section className="internal-testing-limitations" data-testid="internal-testing-approval-credit-gates">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Approval and credit gates</span>
            <h2>Expensive work stays blocked until the approved snapshot and reservation are present</h2>
          </div>
          <p>
            Internal testing now names the same gate contract that future backend workers must enforce: approved plan snapshot, approved credit
            estimate, and reserved credits. This makes the path testable without turning on live billing, providers, workers, or render/export.
          </p>
          <dl className="internal-testing-gate-list" data-testid="internal-testing-approval-credit-gate-list">
            <div>
              <dt>approvedPlanSnapshotId</dt>
              <dd>Required before worker/provider/render execution can read an immutable edit plan.</dd>
            </div>
            <div>
              <dt>creditEstimateId</dt>
              <dd>Required to prove the user saw and approved the estimate for the exact plan version.</dd>
            </div>
            <div>
              <dt>creditReservationId</dt>
              <dd>Required before any expensive job can reserve capacity or later spend credits.</dd>
            </div>
          </dl>
          <div className="internal-testing-limit-grid">
            <article>
              <Badge accent="success">Mock evidence accepted</Badge>
              <ul>
                <li>Browser-visible status for approved snapshot and credit gate readiness.</li>
                <li>Smoke coverage for allowed mock credit-gate and approved-snapshot validation paths.</li>
                <li>Smoke coverage proving expensive jobs block when IDs are missing.</li>
              </ul>
            </article>
            <article>
              <Badge accent="warning">Still blocked until backend gates</Badge>
              <ul>
                <li>No credit reservation spend, ledger write, Stripe flow, or silent billing.</li>
                <li>No provider call, worker dispatch, tool execution, render/export, media processing, or Supabase write.</li>
                <li>No external beta, paid production, or product-ready local OSS claim.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-credit-lifecycle-readiness">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Credit lifecycle</span>
            <h2>Reserved credits have explicit success, release, and refund paths</h2>
          </div>
          <p>
            Internal testing now tracks the post-reservation lifecycle separately from approval. A successful run spends the reservation, cancelled
            or blocked work releases it, and a ReEditPro-side failed run creates a credit refund record. All three paths are mock/local evidence
            only until backend transactional persistence is approved.
          </p>
          <div className="internal-testing-lifecycle-grid" data-testid="internal-testing-credit-lifecycle-list">
            <article>
              <Badge accent="success">Success</Badge>
              <strong>Spend reserved credits</strong>
              <span>Only after approved work completes successfully.</span>
            </article>
            <article>
              <Badge accent="cyan">Cancel or block</Badge>
              <strong>Release reservation</strong>
              <span>Unused credits return to the available mock balance.</span>
            </article>
            <article>
              <Badge accent="warning">ReEditPro failure</Badge>
              <strong>Refund credits</strong>
              <span>Failure caused by ReEditPro creates refund metadata, not a money refund.</span>
            </article>
          </div>
          <div className="internal-testing-pill-row" data-testid="internal-testing-credit-lifecycle-boundaries">
            {['No silent billing', 'No Stripe', 'No ledger write', 'No worker dispatch', 'No Supabase write', 'No production claim'].map((item) => (
              <Badge accent="muted" key={item}>
                {item}
              </Badge>
            ))}
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-repeated-local-operator-harness">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Operator harness</span>
            <h2>One local loop proves the current testable path before a pass is filed</h2>
          </div>
          <p>
            Internal testers now have a single repeatable sequence: run the QA command, open the same mock project routes, verify approval and credit
            gates, record browser-local notes, and export JSON evidence for the next PR. The loop is production-shaped, but it still keeps all live
            execution and release gates closed by default.
          </p>
          <div className="internal-testing-operator-grid" data-testid="internal-testing-operator-sequence">
            {[
              ['Run QA', 'npm run qa:internal-testing'],
              ['Open routes', 'Project home, Edit Chat, Edit Brief'],
              ['Check gates', 'Approval IDs and credit lifecycle'],
              ['Export notes', 'Browser-local JSON only'],
            ].map(([title, detail]) => (
              <article key={title}>
                <Badge accent="cyan">{title}</Badge>
                <span>{detail}</span>
              </article>
            ))}
          </div>
          <div className="internal-testing-pill-row" data-testid="internal-testing-operator-boundaries">
            {['No live backend', 'No tool execution', 'No media work', 'No real billing', 'No external beta', 'No product-ready claim'].map((item) => (
              <Badge accent="muted" key={item}>
                {item}
              </Badge>
            ))}
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-auth-project-access-readiness">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Auth and project access</span>
            <h2>Sign-in state can be checked before project/session testing graduates</h2>
          </div>
          <p>
            Internal testing now includes a read-only Auth readiness check for the browser session and the mock project/session routes. It does not
            run profile or workspace bootstrap, read or write project rows, create Storage objects, spend credits, dispatch workers, or mark the
            product ready.
          </p>
          <div className="internal-testing-auth-grid">
            <article>
              <div className="internal-testing-card-heading">
                <Badge accent={getAuthReadinessAccent(authReadiness?.status)}>
                  {authReadiness?.status ? authReadiness.status.replace(/_/g, ' ') : 'checking'}
                </Badge>
                <Button disabled={authReadinessLoading} icon={RefreshCw} onClick={refreshAuthReadiness} size="sm" variant="secondary">
                  Refresh
                </Button>
              </div>
              <strong data-testid="internal-testing-auth-status">
                {authReadinessLoading
                  ? 'Checking auth state'
                  : authReadiness?.message ?? 'Auth readiness has not been checked yet.'}
              </strong>
              <span>
                {authReadiness?.userEmail
                  ? `Signed in as ${authReadiness.userEmail}`
                  : authReadiness?.configured
                    ? 'No signed-in browser user is required for mock route checks.'
                    : 'Public Supabase Auth env is not configured in this local run.'}
              </span>
            </article>
            <article data-testid="internal-testing-auth-project-routes">
              <Badge accent="cyan">Mock project/session</Badge>
              <dl className="internal-testing-rc-status-list">
                <div>
                  <dt>Project</dt>
                  <dd>{authReadiness?.projectId ?? PROJECT_ID}</dd>
                </div>
                <div>
                  <dt>Edit session</dt>
                  <dd>{authReadiness?.editSessionId ?? EDIT_SESSION_ID}</dd>
                </div>
              </dl>
              <div className="internal-testing-auth-routes">
                {[
                  ['Project home', authReadiness?.routes.projectHome ?? createProjectHomePath(PROJECT_ID)],
                  ['Edit Chat', authReadiness?.routes.editChat ?? createProjectEditSessionChatPath(PROJECT_ID, EDIT_SESSION_ID)],
                  ['Edit Brief', authReadiness?.routes.editBrief ?? createProjectEditSessionBriefPath(PROJECT_ID, EDIT_SESSION_ID)],
                ].map(([label, route]) => (
                  <Link className="internal-testing-route-link" key={route} to={route}>
                    {label}
                    <ExternalLink aria-hidden="true" size={15} />
                  </Link>
                ))}
              </div>
            </article>
            <article data-testid="internal-testing-auth-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>No service-role, profile/workspace bootstrap writes, table reads/writes, Storage, SQL, or migrations.</li>
                <li>No provider/model calls, worker dispatch, media processing, render/export, credit spend, or product-ready claim.</li>
                <li>Durable project membership and backend persistence remain separate release gates.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-auth-project-session-membership-policy">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Membership policy</span>
            <h2>Durable project/session access has a named evidence contract</h2>
          </div>
          <p>
            Project Home, Edit Chat, and Edit Brief now display the same access policy notice. Mock internal route access is allowed for repeated
            testing, but durable authenticated access stays pending until membership, RLS, Data API grant, and backend persistence evidence exists.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-membership-required-evidence">
              <Badge accent="cyan">Required evidence</Badge>
              <ul>
                {PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE.map((item) => (
                  <li key={item}>{item.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-membership-route-surfaces">
              <Badge accent="success">Route surfaces</Badge>
              <ul>
                <li>Project Home access policy notice.</li>
                <li>Edit Chat access policy notice.</li>
                <li>Edit Brief access policy notice.</li>
                <li>Internal Testing source-truth scenario.</li>
              </ul>
            </article>
            <article data-testid="internal-testing-membership-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>No profile/workspace bootstrap writes or service-role fallback.</li>
                <li>No Supabase Data API table access, Storage, SQL, or migration.</li>
                <li>No production route, real media, worker, render, credit, external beta, or product-ready unlock.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-auth-project-session-backend-persistence-plan">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Backend persistence plan</span>
            <h2>Durable access graduates through server-side membership checks</h2>
          </div>
          <p>
            The next backend milestone should turn the route policy into a mock-safe server seam first: Supabase Auth identifies the signed-in user,
            workspace membership scopes the project, project membership scopes the edit session, and explicit Data API grants plus RLS must be proven
            before table-backed route access can be called durable.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-durable-backend-required-gates">
              <Badge accent="cyan">Required gates</Badge>
              <ul>
                {DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES.map((item) => (
                  <li key={item}>{item.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-durable-backend-route-contracts">
              <Badge accent="success">Route contract</Badge>
              <ul>
                {DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS.map((contract) => (
                  <li key={contract.surface}>
                    {contract.path}: {contract.accessCheck}
                  </li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-durable-backend-tables">
              <Badge accent="warning">Planned tables only</Badge>
              <ul>
                {DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES.map((table) => (
                  <li key={table}>{table}</li>
                ))}
              </ul>
              <p>No migration, SQL, Storage, service-role browser path, or Supabase write is enabled by this plan.</p>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-mock-safe-durable-project-session-backend-skeleton">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Backend skeleton</span>
            <h2>Mock project/session access can pass while durable Supabase stays fail-closed</h2>
          </div>
          <p>
            The backend skeleton now evaluates a server-shaped project/session access request with request id, idempotency key, workspace
            membership, project membership, and edit-session membership. It is ready for internal route integration, but live table-backed access
            remains blocked until RLS, explicit Data API grants, migrations, and backend-only service-role boundaries are proven.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-backend-skeleton-decision">
              <Badge accent="success">Route integration ready</Badge>
              <strong>{backendSkeleton.decision}</strong>
              <span>Current mode: {backendSkeleton.currentMode.replace(/_/g, ' ')}</span>
              <span>Next gate: {backendSkeleton.nextGate}</span>
            </article>
            <article data-testid="internal-testing-backend-skeleton-required-evidence">
              <Badge accent="cyan">Durable evidence still required</Badge>
              <ul>
                {backendSkeleton.requiredEvidence.map((item) => (
                  <li key={item}>{item.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-backend-skeleton-boundaries">
              <Badge accent="warning">Durable path disabled</Badge>
              <ul>
                <li>Mock internal route access can pass for seeded internal testing fixtures.</li>
                <li>Durable Supabase access still fails closed without RLS and explicit Data API grant evidence.</li>
                <li>No Supabase migration, table read/write, Storage, worker, media, render, credit, external beta, or product-ready unlock.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-project-session-backend-route-integration">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Route integration</span>
            <h2>Edit Session and Edit Brief route responses now carry access metadata</h2>
          </div>
          <p>
            The mock API route families now attach <code>projectSessionAccess</code> metadata from the backend skeleton. Internal testing can verify
            the exact project/session access decision that future durable routes must enforce before any worker, tool, render, or credit execution
            is allowed.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-route-integration-decision">
              <Badge accent="success">Readback QA ready</Badge>
              <strong>{DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION}</strong>
              <span>Next gate: {DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE}</span>
            </article>
            <article data-testid="internal-testing-route-integration-families">
              <Badge accent="cyan">Route families</Badge>
              <ul>
                <li>Project Edit Session mock routes.</li>
                <li>Project Edit Brief mock routes.</li>
                <li>Responses include access status, durable Supabase status, and audit/idempotency envelope.</li>
              </ul>
            </article>
            <article data-testid="internal-testing-route-integration-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>Mock route metadata is accepted for internal testing only.</li>
                <li>Durable Supabase access remains false until RLS, explicit Data API grants, and migrations are verified.</li>
                <li>No table read/write, Storage, worker, media, render, credit, external beta, production, or product-ready unlock.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-project-session-backend-readback-qa">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Readback QA</span>
            <h2>Project/session access metadata reads back on success and failure envelopes</h2>
          </div>
          <p>
            Internal testing now verifies that Project Edit Session and Project Edit Brief responses expose <code>projectSessionAccess</code> in
            successful <code>data</code> envelopes and failed <code>error.details</code> envelopes. This accepts the mock-safe route metadata while
            keeping durable Supabase and runtime execution gated.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-readback-qa-decision">
              <Badge accent="success">Contract plan ready</Badge>
              <strong>{DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION}</strong>
              <span>Next gate: {DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE}</span>
            </article>
            <article data-testid="internal-testing-readback-qa-envelope-kinds">
              <Badge accent="cyan">Readback envelopes</Badge>
              <ul>
                <li>Project Edit Session success and failure responses.</li>
                <li>Project Edit Brief success and failure responses.</li>
                <li>Access metadata includes status, durable Supabase state, and idempotency audit details.</li>
              </ul>
            </article>
            <article data-testid="internal-testing-readback-qa-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>No durable Supabase table read/write or service-role browser path.</li>
                <li>No worker, tool, media, render, credit, external beta, production, or product-ready unlock.</li>
                <li>Next work is a route contract plan, not a migration or live data path.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-project-session-supabase-route-contract-plan">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Supabase route contract</span>
            <h2>Durable project/session routes need grants and RLS before live access</h2>
          </div>
          <p>
            This plan converts the readback QA into a future Supabase route contract. Project Home, Project Edit Session, and Project Edit Brief
            access must chain through <code>workspace_members</code> and <code>auth.uid()</code>, with explicit Data API grants and
            authenticated-role RLS verified together before any durable table-backed route can pass.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-supabase-route-contract-decision">
              <Badge accent="success">Schema/RLS draft ready</Badge>
              <strong>{DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION}</strong>
              <span>Next gate: {DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE}</span>
            </article>
            <article data-testid="internal-testing-supabase-route-contract-families">
              <Badge accent="cyan">Route families</Badge>
              <ul>
                {supabaseRouteContractPlan.routeFamilies.map((route) => (
                  <li key={route.routeFamily}>
                    {route.path}: {route.accessChain}
                  </li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-route-contract-grants">
              <Badge accent="cyan">Grant and RLS requirements</Badge>
              <ul>
                {supabaseRouteContractPlan.requiredDataApiGrants.map((grant) => (
                  <li key={grant}>{grant.replace(/_/g, ' ')}</li>
                ))}
                {supabaseRouteContractPlan.rlsPolicyIntents.slice(0, 3).map((policy) => (
                  <li key={policy.table}>
                    {policy.table}: {policy.intent}
                  </li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-route-contract-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>No Supabase migration, SQL, Data API read/write, Storage, signed URL, grant application, or RLS policy application.</li>
                <li>No service-role browser path, worker, tool, media, render, credit, external beta, production, or product-ready unlock.</li>
                <li>Next work is a schema/RLS draft, not live route access.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-project-session-supabase-schema-rls-draft">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Schema/RLS draft</span>
            <h2>Table-backed access needs a migration SQL draft before it can run</h2>
          </div>
          <p>
            This draft names the core tables, route data tables, index intent, RLS intent, Data API grant intent, and verification checks needed
            before durable project/session access can move toward a migration. It still writes no SQL and applies no Supabase policy.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-supabase-schema-rls-draft-decision">
              <Badge accent="success">Migration SQL draft ready</Badge>
              <strong>{DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION}</strong>
              <span>Next gate: {DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE}</span>
            </article>
            <article data-testid="internal-testing-supabase-schema-rls-draft-tables">
              <Badge accent="cyan">Core tables</Badge>
              <ul>
                {supabaseSchemaRlsDraft.coreTables.map((table) => (
                  <li key={table.table}>
                    {table.table}: {table.requiredColumns.join(', ')}
                  </li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-schema-rls-draft-verification">
              <Badge accent="cyan">Verification checks</Badge>
              <ul>
                {supabaseSchemaRlsDraft.verificationChecks.slice(0, 5).map((check) => (
                  <li key={check}>{check.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-schema-rls-draft-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>No migration SQL is written, applied, or validated.</li>
                <li>No local Supabase reset, remote validation, generated types, Data API read/write, Storage, or signed URL path.</li>
                <li>No table-backed route implementation, service-role browser path, worker, media, render, credit, beta, production, or product-ready unlock.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="internal-testing-limitations" data-testid="internal-testing-durable-project-session-supabase-migration-sql-draft">
          <div className="internal-testing-section-heading">
            <span className="section-eyebrow">Migration SQL draft</span>
            <h2>Reviewable SQL exists, but no executable migration is applied</h2>
          </div>
          <p>
            This draft writes the review artifact at <code>{supabaseMigrationSqlDraft.draftSqlFile}</code> and keeps it outside
            <code> supabase/migrations</code>. It preserves the <code>workspace_members</code> and <code>auth.uid()</code> access chain
            while requiring a later migration review before any real Supabase CLI migration can run.
          </p>
          <div className="internal-testing-auth-grid">
            <article data-testid="internal-testing-supabase-migration-sql-draft-decision">
              <Badge accent="success">Migration review ready</Badge>
              <strong>{DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION}</strong>
              <span>Next gate: {DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE}</span>
            </article>
            <article data-testid="internal-testing-supabase-migration-sql-draft-statements">
              <Badge accent="cyan">Draft statement groups</Badge>
              <ul>
                {supabaseMigrationSqlDraft.draftStatements.map((statement) => (
                  <li key={statement.id}>
                    {statement.kind}: {statement.target}
                  </li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-migration-sql-draft-review-checks">
              <Badge accent="cyan">Review checks</Badge>
              <ul>
                {supabaseMigrationSqlDraft.reviewChecks.map((check) => (
                  <li key={check}>{check.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </article>
            <article data-testid="internal-testing-supabase-migration-sql-draft-boundaries">
              <Badge accent="warning">Still gated</Badge>
              <ul>
                <li>Draft SQL is review metadata only. No executable migration is created or applied.</li>
                <li>No local Supabase reset, remote validation, generated types, Data API read/write, Storage, or signed URL path.</li>
                <li>No table-backed route implementation, service-role browser path, worker, media, render, credit, beta, production, or product-ready unlock.</li>
              </ul>
            </article>
          </div>
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
