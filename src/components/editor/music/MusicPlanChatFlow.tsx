import type { CanonicalMusicUiProjection } from '../../../types/canonical-music-ui'
import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'

type MusicPlanChatFlowProps = {
  projection?: CanonicalMusicUiProjection
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

export function MusicPlanChatFlow({ projection }: MusicPlanChatFlowProps) {
  if (!projection) {
    return (
      <section
        aria-label="Canonical Music department"
        className="soundflow-panel music-flow-panel"
        data-testid="music-flow"
      >
        <InlinePlanCardShell
          actions={<Badge accent="warning">Waiting for artifacts</Badge>}
          className="music-inline-card music-context-card"
          defaultExpanded
          eyebrow="Music"
          helper="This surface is read-only. It displays canonical Music artifacts and never simulates generation or QA."
          priority="user_summary"
          status="needs_input"
          title="Music department ready"
        >
          <p className="music-muted-note" role="status">
            No canonical Music plan has been published to this chat yet. Music generation, progress, QA, and approval are not inferred from local UI state.
          </p>
        </InlinePlanCardShell>
      </section>
    )
  }

  const qaAccent = projection.qa.status === 'pass' ? 'success'
    : projection.qa.status === 'blocking' ? 'danger' : 'warning'
  return (
    <section
      aria-label="Canonical Music department"
      className="soundflow-panel music-flow-panel"
      data-evidence={projection.executionEvidence}
      data-testid="music-flow"
    >
      <div className="soundflow-message-list">
        <InlinePlanCardShell
          actions={<Badge accent={projection.status === 'completed' ? 'success' : 'cyan'}>{label(projection.status)}</Badge>}
          className="music-inline-card music-context-card"
          defaultExpanded
          eyebrow="Canonical Music"
          helper="Read-only projection from versioned Music artifacts. Broad context does not expand write authority."
          priority="user_summary"
          status={projection.status === 'blocked' ? 'blocking' : 'ready'}
          title="Music supervision"
        >
          <div className="music-info-grid">
            <span><strong>Music decision</strong>{label(projection.musicNeed.decision)}</span>
            <span><strong>Confidence</strong>{projection.musicNeed.confidencePercent}%</span>
            <span><strong>Soundtrack strategy</strong>{label(projection.soundtrack.cueFamilyStrategy)}</span>
            <span><strong>Cues</strong>{projection.soundtrack.cueCount}</span>
            <span><strong>Speech evidence</strong>{label(projection.context.speechEvidence)}</span>
            <span><strong>Natural ambience</strong>{label(projection.context.naturalAmbience)}</span>
          </div>
          <p className="music-muted-note"><strong>Why:</strong> {projection.musicNeed.reason}</p>
          <p className="music-muted-note"><strong>Evidence:</strong> {projection.context.evidenceSummary}</p>
        </InlinePlanCardShell>

        <InlinePlanCardShell
          actions={<Badge accent="violet">{projection.soundtrack.cueCount} exact cues</Badge>}
          className="music-inline-card music-cue-sheet-card"
          defaultExpanded
          eyebrow="Cue sheet"
          helper="Frames are authoritative. Seconds and animated timers are not used as execution evidence."
          priority="required_user_action"
          status="ready"
          title="Music cue strategy"
        >
          {projection.cues.length === 0 ? (
            <p className="music-muted-note">No Music cues are planned for this assignment.</p>
          ) : (
            <ol className="music-cue-list">
              {projection.cues.map((cue) => (
                <li key={cue.cueId}>
                  <strong>{cue.cueId}</strong>
                  <span>
                    Frames {cue.startFrame}–{cue.endFrameExclusive} · {label(cue.narrativeFunction)} · {label(cue.acquisitionDecision)} · {label(cue.status)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {projection.soundtrack.overScoringWarnings.length > 0 ? (
            <p className="music-muted-note" role="status">
              <strong>Restraint review:</strong> {projection.soundtrack.overScoringWarnings.map(label).join(', ')}
            </p>
          ) : null}
        </InlinePlanCardShell>

        {projection.estimate ? (
          <InlinePlanCardShell
            actions={<Badge accent={projection.estimate.approvalRequired ? 'warning' : 'success'}>
              {projection.estimate.approvalRequired ? 'Approval required' : 'No paid action'}
            </Badge>}
            className="music-inline-card music-credit-card"
            eyebrow="Estimate"
            helper="Estimates do not reserve or spend credits. Nested Sound cost remains separately evidenced."
            priority="required_user_action"
            status={projection.estimate.approvalRequired ? 'needs_input' : 'ready'}
            title="Music cost range"
          >
            <div className="music-info-grid">
              <span><strong>Minimum</strong>{projection.estimate.minimumCredits} credits</span>
              <span><strong>Expected</strong>{projection.estimate.expectedCredits} credits</span>
              <span><strong>Maximum</strong>{projection.estimate.maximumCredits} credits</span>
            </div>
            <p className="music-muted-note"><strong>Lower-cost choices:</strong> {projection.estimate.lowerCostAlternatives.map(label).join(', ')}</p>
          </InlinePlanCardShell>
        ) : null}

        <InlinePlanCardShell
          actions={<Badge accent={qaAccent}>{label(projection.qa.status)}</Badge>}
          className="music-inline-card music-qa-card"
          defaultExpanded
          eyebrow="Evidence"
          helper="Progress and QA appear only when canonical unit receipts and output evidence exist."
          priority="user_summary"
          status={projection.qa.status === 'blocking' ? 'blocking' : projection.qa.status === 'pass' ? 'ready' : 'needs_input'}
          title="Execution and Music QA"
        >
          <p className="music-muted-note" role="status">{projection.progress.evidenceLabel}</p>
          <div className="music-info-grid">
            <span><strong>Evidence level</strong>{label(projection.executionEvidence)}</span>
            <span><strong>Provider evidence</strong>{label(projection.provider.evidence)}</span>
            <span><strong>Provider attempts</strong>{projection.provider.attemptCount}</span>
            <span><strong>Live activation</strong>{label(projection.provider.liveActivation)}</span>
            <span><strong>Selected assets</strong>{projection.handoff.selectedAssetCount}</span>
            <span><strong>Music stems</strong>{projection.handoff.musicStemCount}</span>
          </div>
          {projection.qa.reviewItems.length > 0 ? (
            <p className="music-muted-note"><strong>Review required:</strong> {projection.qa.reviewItems.map(label).join(', ')}</p>
          ) : null}
          <p className="music-muted-note">Final mux, render, export, delivery, and publishing remain outside Music.</p>
        </InlinePlanCardShell>
      </div>
    </section>
  )
}
