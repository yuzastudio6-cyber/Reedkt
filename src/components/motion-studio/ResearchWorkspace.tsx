import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileQuestion,
  FileSearch,
  Images,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { UseMotionStudioResearchWorkspaceResult } from '../../hooks/useMotionStudioResearchWorkspace'
import type {
  MotionStudioResearchWorkspaceDto,
  MotionStudioWorkspaceMode,
} from '../../types/motion-studio'
import { safeMotionStudioResourceMessage } from '../../lib/motion-studio/user-facing-resource-message'
import { Button } from '../Button'

interface ResearchWorkspaceProps {
  editPath: string
  focus?: 'research' | 'sources'
  mode: MotionStudioWorkspaceMode
  research: UseMotionStudioResearchWorkspaceResult
}

export function ResearchWorkspace({ editPath, focus = 'research', mode, research }: ResearchWorkspaceProps) {
  if (research.state === 'inactive') return null
  if (research.state === 'loading' && !research.workspace) return <ResearchLoading />
  if (!research.workspace) {
    return (
      <ResearchUnavailable
        message={research.message}
        operation={research.operation}
        retry={research.retry}
        state={research.state}
      />
    )
  }

  const workspace = research.workspace
  if (workspace.state === 'empty') return <ResearchEmpty editPath={editPath} workspace={workspace} />

  return (
    <div
      className={`motion-studio-research motion-studio-research-${mode}`}
      data-research-production-id={workspace.productionId}
      data-testid="motion-studio-research-workspace"
    >
      <ResearchStateBanner operation={research.operation} retry={research.retry} workspace={workspace} />
      <ResearchBoundaryNotice workspace={workspace} />
      {mode === 'guided' ? (
        <GuidedResearch editPath={editPath} workspace={workspace} />
      ) : (
        <StudioResearch editPath={editPath} focus={focus} workspace={workspace} />
      )}
    </div>
  )
}

function ResearchLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading Storytelling research"
      className="motion-studio-research-state motion-studio-research-loading"
      data-testid="motion-studio-research-state-loading"
    >
      <span className="motion-studio-research-skeleton is-heading" />
      <span className="motion-studio-research-skeleton" />
      <span className="motion-studio-research-skeleton is-short" />
      <div className="motion-studio-research-skeleton-grid">
        <span /><span /><span /><span />
      </div>
    </section>
  )
}

function ResearchUnavailable({
  message,
  operation,
  retry,
  state,
}: Pick<UseMotionStudioResearchWorkspaceResult, 'message' | 'operation' | 'retry' | 'state'>) {
  const denied = state === 'permission_denied'
  const invalid = state === 'invalid'
  return (
    <section
      className="motion-studio-research-state is-danger"
      data-testid={`motion-studio-research-state-${state.replace('_', '-')}`}
      role="alert"
    >
      <span aria-hidden="true" className="motion-studio-research-state-icon">
        {denied ? <ShieldAlert size={22} /> : invalid ? <FileQuestion size={22} /> : <AlertTriangle size={22} />}
      </span>
      <div>
        <h3>{denied ? 'Research access is unavailable' : invalid ? 'Research could not be verified' : 'Research could not be loaded'}</h3>
        <p>{safeMotionStudioResourceMessage(
          message,
          'The current research state is unavailable. No empty result was assumed.',
        )}</p>
      </div>
      {!denied ? (
        <Button
          disabled={operation !== 'idle'}
          icon={RefreshCw}
          onClick={() => { void retry() }}
          variant="secondary"
        >
          {operation === 'refreshing' ? 'Checking…' : 'Try again'}
        </Button>
      ) : null}
    </section>
  )
}

function ResearchEmpty({ editPath, workspace }: { editPath: string; workspace: MotionStudioResearchWorkspaceDto }) {
  return (
    <section className="motion-studio-research-state is-empty" data-testid="motion-studio-research-state-empty">
      <span aria-hidden="true" className="motion-studio-research-state-icon"><FileSearch size={22} /></span>
      <div>
        <h3>No research package exists yet</h3>
        <p>This exact Storytelling production has no sources, claims, chronology, or visual coverage to review.</p>
      </div>
      <Button icon={MessageCircle} to={editPath} variant="secondary">Continue with Director</Button>
      <span className="sr-only">Production {workspace.productionId}</span>
    </section>
  )
}

function ResearchStateBanner({
  operation,
  retry,
  workspace,
}: {
  operation: UseMotionStudioResearchWorkspaceResult['operation']
  retry: UseMotionStudioResearchWorkspaceResult['retry']
  workspace: MotionStudioResearchWorkspaceDto
}) {
  const copy = researchStateCopy(workspace.state)
  return (
    <section
      aria-live={workspace.state === 'failure' || workspace.state === 'blocked' ? 'assertive' : 'polite'}
      className={`motion-studio-research-banner is-${copy.tone}`}
      data-testid={`motion-studio-research-state-${workspace.state.replace('_', '-')}`}
      role={workspace.state === 'failure' || workspace.state === 'blocked' ? 'alert' : 'status'}
    >
      <ResearchStateIcon state={workspace.state} />
      <div><strong>{copy.title}</strong><span>{copy.body}</span></div>
      {workspace.state === 'failure' ? (
        <Button disabled={operation !== 'idle'} icon={RefreshCw} onClick={() => { void retry() }} size="sm" variant="ghost">
          {operation === 'refreshing' ? 'Checking…' : 'Refresh'}
        </Button>
      ) : null}
    </section>
  )
}

function ResearchBoundaryNotice({ workspace }: { workspace: MotionStudioResearchWorkspaceDto }) {
  const external = workspace.externalEvidence.state !== 'not_requested'
  return (
    <div className="motion-studio-research-boundary" data-testid="motion-studio-research-boundary">
      <ShieldCheck aria-hidden="true" size={16} />
      <p><strong>Review-only research preview.</strong> {external
        ? 'The bounded public-evidence route is server-controlled; the browser cannot choose a URL or run it. Captures cannot become final assets or timeline media.'
        : 'The browser cannot start external retrieval, call generation models, spend credits, or execute instructions found in sources.'}</p>
    </div>
  )
}

function GuidedResearch({ editPath, workspace }: { editPath: string; workspace: MotionStudioResearchWorkspaceDto }) {
  const focalItem = [...workspace.reviewQueue].sort((left, right) => severityRank(right.severity) - severityRank(left.severity))[0]
  return (
    <div className="motion-studio-research-guided" data-testid="motion-studio-research-guided">
      <ResearchSummary workspace={workspace} />
      <ExternalEvidencePanel workspace={workspace} />
      <section className={`motion-studio-research-focal ${focalItem ? `is-${focalItem.severity}` : 'is-complete'}`}>
        <span aria-hidden="true" className="motion-studio-research-focal-icon">
          {focalItem ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        </span>
        <div>
          <span className="section-eyebrow">{focalItem ? 'Next review decision' : 'Research review'}</span>
          <h3>{focalItem?.label ?? 'No unresolved review item'}</h3>
          <p>{focalItem?.reason ?? 'The current projection contains no source, claim, chronology, rights, or visual-coverage decision awaiting review.'}</p>
        </div>
        <Button icon={MessageCircle} to={editPath} variant="secondary">Review with Director</Button>
      </section>

      <div className="motion-studio-research-guided-columns">
        <QuietList
          icon={Archive}
          items={workspace.sources.map((source) => ({
            id: source.sourceVersionId,
            title: source.title,
            meta: `${humanize(source.sourceKind)} · ${humanize(source.trustStatus)} · ${humanize(source.rightsStatus)}`,
          }))}
          title="Source picture"
        />
        <QuietList
          icon={Scale}
          items={workspace.claims.map((claim) => ({
            id: claim.claimId,
            title: claim.claimText,
            meta: `${humanize(claim.classification)} · ${claim.supportCount} supporting · ${claim.contradictionCount} contradicting`,
          }))}
          title="Claim picture"
        />
      </div>

      <section className="motion-studio-research-coverage-snapshot" aria-labelledby="research-coverage-snapshot-heading">
        <div className="motion-studio-research-section-title">
          <Images aria-hidden="true" size={18} />
          <div><h3 id="research-coverage-snapshot-heading">Visual coverage</h3><p>What the story needs to show, before any asset is acquired or generated.</p></div>
        </div>
        <ul>
          {workspace.visualNeeds.map((need) => (
            <li key={need.visualNeedId}>
              <div><strong>{need.narrativePurpose}</strong><span>{humanize(need.kind)} · {humanize(need.route)}</span></div>
              <ResearchStatus label={statusLabel(need.status)} tone={need.blockingReason ? 'attention' : 'neutral'} />
              {need.blockingReason ? <p>{need.blockingReason}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function StudioResearch({
  editPath,
  focus,
  workspace,
}: {
  editPath: string
  focus: NonNullable<ResearchWorkspaceProps['focus']>
  workspace: MotionStudioResearchWorkspaceDto
}) {
  const sourcesFocused = focus === 'sources'
  return (
    <div className="motion-studio-research-studio" data-testid="motion-studio-research-studio">
      <ResearchSummary workspace={workspace} />
      <ExternalEvidencePanel workspace={workspace} />
      <div className="motion-studio-research-studio-grid">
        <ResearchDisclosure count={workspace.sources.length} icon={Archive} open title="Source Library">
          <ul className="motion-studio-research-record-list">
            {workspace.sources.map((source) => (
              <li key={source.sourceVersionId}>
                <div><strong>{source.title}</strong><span>{source.displayOrigin} · {humanize(source.sourceKind)}</span></div>
                <div className="motion-studio-research-record-statuses">
                  <ResearchStatus label={humanize(source.trustStatus)} tone={source.trustStatus === 'disputed' ? 'attention' : 'neutral'} />
                  <ResearchStatus label={humanize(source.rightsStatus)} tone={blockedRights(source.rightsStatus) ? 'danger' : 'neutral'} />
                </div>
              </li>
            ))}
          </ul>
        </ResearchDisclosure>

        <ResearchDisclosure count={workspace.claims.length} icon={Scale} open={!sourcesFocused} title="Claim Ledger">
          <ul className="motion-studio-research-record-list is-claims">
            {workspace.claims.map((claim) => (
              <li key={claim.claimId}>
                <div>
                  <strong>{claim.claimText}</strong>
                  <span>{humanize(claim.classification)} · {humanize(claim.confidence)} confidence · {humanize(claim.materiality)}</span>
                  <small>{claim.supportCount} supporting / {claim.contradictionCount} contradicting</small>
                  {claim.blockingReason ? <p>{claim.blockingReason}</p> : null}
                </div>
                <ResearchStatus label={statusLabel(claim.status)} tone={claim.blockingReason ? 'danger' : 'attention'} />
              </li>
            ))}
          </ul>
        </ResearchDisclosure>

        <ResearchDisclosure count={workspace.chronology.length} icon={Clock3} title="Chronology">
          <ol className="motion-studio-research-timeline">
            {workspace.chronology.map((event) => (
              <li key={event.chronologyEventId}>
                <span aria-hidden="true" />
                <div><strong>{event.title}</strong><time>{event.timeLabel}</time></div>
                <ResearchStatus label={humanize(event.contradictionStatus)} tone={event.contradictionStatus === 'unresolved' ? 'danger' : 'neutral'} />
              </li>
            ))}
          </ol>
        </ResearchDisclosure>

        <ResearchDisclosure count={workspace.evidence.length} icon={BookOpenCheck} title="Evidence Fragments">
          <ul className="motion-studio-research-evidence-list">
            {workspace.evidence.map((evidence) => (
              <li key={evidence.evidenceFragmentId}>
                <span>{evidence.locatorLabel}</span>
                <p>{evidence.normalizedParaphrase}</p>
                <ResearchStatus label={humanize(evidence.relationship)} tone={evidence.relationship === 'contradicts' ? 'attention' : 'neutral'} />
              </li>
            ))}
          </ul>
        </ResearchDisclosure>

        <ResearchDisclosure count={workspace.visualNeeds.length} icon={Images} open={!sourcesFocused} title="Visual Coverage Plan">
          <div className="motion-studio-research-visual-stack">
            {workspace.visualNeeds.map((need) => (
              <article key={need.visualNeedId}>
                <div><strong>{need.narrativePurpose}</strong><span>{humanize(need.kind)} · {humanize(need.route)}</span></div>
                <dl><div><dt>Candidates</dt><dd>{need.candidateCount}</dd></div><div><dt>Selected assets</dt><dd>{need.selectedAssetCount}</dd></div></dl>
                {need.blockingReason ? <p>{need.blockingReason}</p> : null}
              </article>
            ))}
            <ul className="motion-studio-research-candidate-list" aria-label="Visual candidates">
              {workspace.candidates.map((candidate) => (
                <li key={candidate.candidateId}>
                  <div><strong>{candidate.label}</strong><span>{humanize(candidate.candidateType)} · {humanize(candidate.authenticityClass)}</span></div>
                  <div className="motion-studio-research-record-statuses">
                    <ResearchStatus label={humanize(candidate.rightsStatus)} tone={blockedRights(candidate.rightsStatus) ? 'danger' : 'neutral'} />
                    <ResearchStatus label={humanize(candidate.selectionStatus)} tone={candidate.selectionStatus === 'rejected' ? 'danger' : 'attention'} />
                  </div>
                  {candidate.blockingReason ? <p>{candidate.blockingReason}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </ResearchDisclosure>

        <ResearchDisclosure count={workspace.techniqueBlueprints.length} icon={Waypoints} title="Technique Blueprints">
          <ul className="motion-studio-research-record-list">
            {workspace.techniqueBlueprints.map((blueprint) => (
              <li key={blueprint.techniqueBlueprintId}>
                <div><strong>{blueprint.title}</strong><span>{blueprint.stepCount} steps · {blueprint.failureCaseCount} known failure cases</span></div>
                <ResearchStatus label="Instructions isolated" tone="good" />
              </li>
            ))}
          </ul>
          <p className="motion-studio-research-blueprint-note"><ShieldCheck aria-hidden="true" size={15} /> Source instructions are reference data only and cannot run tools or authorize spend.</p>
        </ResearchDisclosure>

        <ResearchDisclosure
          count={workspace.reviewQueue.length}
          icon={ListChecks}
          open={!sourcesFocused || workspace.reviewQueue.length > 0}
          title="Review Queue"
        >
          {workspace.reviewQueue.length ? (
            <ol className="motion-studio-research-review-list">
              {workspace.reviewQueue.map((item) => (
                <li className={`is-${item.severity}`} key={`${item.subjectType}:${item.subjectId}`}>
                  <AlertTriangle aria-hidden="true" size={16} />
                  <div><strong>{item.label}</strong><p>{item.reason}</p><span>{humanize(item.subjectType)} · {humanize(item.severity)}</span></div>
                </li>
              ))}
            </ol>
          ) : <p className="motion-studio-research-quiet-empty">No item currently requires review.</p>}
          <Button icon={MessageCircle} to={editPath} variant="secondary">Review with Director</Button>
        </ResearchDisclosure>
      </div>
    </div>
  )
}

function ExternalEvidencePanel({ workspace }: { workspace: MotionStudioResearchWorkspaceDto }) {
  const external = workspace.externalEvidence
  if (external.state === 'not_requested') return null
  return (
    <section
      className="motion-studio-research-external"
      data-external-evidence-state={external.state}
      data-testid="motion-studio-research-external-evidence"
    >
      <div className="motion-studio-research-section-title">
        <ShieldCheck aria-hidden="true" size={18} />
        <div>
          <h3>Bounded public evidence</h3>
          <p>Server-captured evidence is private, review-only, and independent from factual or rights approval.</p>
        </div>
      </div>
      <dl>
        <div><dt>State</dt><dd>{statusLabel(external.state)}</dd></div>
        <div><dt>Requests</dt><dd>{external.requestCount}</dd></div>
        <div><dt>Private captures</dt><dd>{external.capturedRecordCount}</dd></div>
        <div><dt>Review-only visuals</dt><dd>{external.reviewOnlyCandidateCount}</dd></div>
      </dl>
      {external.openQuestions.length ? (
        <div className="motion-studio-research-external-questions">
          <strong>Open corroboration</strong>
          <ul>{external.openQuestions.map((question, index) => <li key={`${index}:${question}`}>{question}</li>)}</ul>
        </div>
      ) : null}
      <p className="motion-studio-research-blueprint-note">
        <ShieldCheck aria-hidden="true" size={15} /> No capture is eligible for final asset registration or timeline placement.
      </p>
    </section>
  )
}

function ResearchSummary({ workspace }: { workspace: MotionStudioResearchWorkspaceDto }) {
  const items = [
    ['Sources', workspace.summary.sourceCount],
    ['Claims', workspace.summary.claimCount],
    ['Open conflicts', workspace.summary.unresolvedContradictionCount],
    ['Visual needs', workspace.summary.visualNeedCount],
  ] as const
  return (
    <dl className="motion-studio-research-summary" aria-label="Research summary">
      {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  )
}

function QuietList({
  icon: Icon,
  items,
  title,
}: {
  icon: LucideIcon
  items: readonly { id: string; title: string; meta: string }[]
  title: string
}) {
  return (
    <section className="motion-studio-research-quiet-list">
      <div className="motion-studio-research-section-title"><Icon aria-hidden="true" size={18} /><h3>{title}</h3></div>
      <ul>{items.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.meta}</span></li>)}</ul>
    </section>
  )
}

function ResearchDisclosure({
  children,
  count,
  icon: Icon,
  open = false,
  title,
}: {
  children: React.ReactNode
  count: number
  icon: LucideIcon
  open?: boolean
  title: string
}) {
  return (
    <details className="motion-studio-research-disclosure" open={open}>
      <summary>
        <span><Icon aria-hidden="true" size={18} /><strong>{title}</strong></span>
        <span>{count}</span>
      </summary>
      <div className="motion-studio-research-disclosure-body">{children}</div>
    </details>
  )
}

function ResearchStatus({ label, tone }: { label: string; tone: 'neutral' | 'attention' | 'danger' | 'good' }) {
  return <span className={`motion-studio-research-status is-${tone}`}><span aria-hidden="true" />{label}</span>
}

function researchStateCopy(state: MotionStudioResearchWorkspaceDto['state']) {
  const copy = {
    empty: ['Research has not started', 'Continue with Director to prepare the exact research scope.', 'neutral'],
    partial: ['Research is partially available', 'Available evidence is shown; missing coverage remains explicit.', 'attention'],
    processing: ['Research evidence is being prepared', 'The view remains read-only while confined server work is reconciled into safe records.', 'neutral'],
    reconciliation: ['Research state needs reconciliation', 'Existing evidence is preserved while record identity is checked.', 'attention'],
    needs_review: ['Research needs review', 'Resolve the highlighted evidence, claim, chronology, rights, or coverage decision.', 'attention'],
    blocked: ['Research is blocked', 'A blocking evidence, rights, or chronology issue prevents approval.', 'danger'],
    failure: ['Research could not complete', 'Existing safe records remain visible. Refresh before relying on this state.', 'danger'],
    cancelled: ['Research was cancelled', 'Any completed attempts remain immutable and reviewable; no model, timeline, render, or export work is authorized.', 'attention'],
    approved: ['Research is approved', 'The reviewed source, claim, chronology, and visual-coverage records are current.', 'good'],
  } as const
  const [title, body, tone] = copy[state]
  return { title, body, tone }
}

function ResearchStateIcon({ state }: { state: MotionStudioResearchWorkspaceDto['state'] }) {
  if (state === 'approved') return <CheckCircle2 aria-hidden="true" size={18} />
  if (state === 'blocked' || state === 'failure') return <ShieldAlert aria-hidden="true" size={18} />
  if (state === 'processing') return <FileSearch aria-hidden="true" size={18} />
  return <AlertTriangle aria-hidden="true" size={18} />
}

function statusLabel(value: string): string {
  return humanize(value)
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function blockedRights(value: string): boolean {
  return ['unknown', 'restricted', 'expired'].includes(value)
}

function severityRank(value: string): number {
  return value === 'blocking' ? 3 : value === 'warning' ? 2 : 1
}
