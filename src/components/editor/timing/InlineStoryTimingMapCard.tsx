import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import {
  formatTimingLabel,
  formatTimingSeconds,
  readinessAccent,
  readinessLabel,
  type TimingReviewChatData,
} from './timingChatUiData'

type InlineStoryTimingMapCardProps = {
  data: TimingReviewChatData
}

export function InlineStoryTimingMapCard({ data }: InlineStoryTimingMapCardProps) {
  const { masterTimingMap, qaReport } = data
  const approved = Boolean(masterTimingMap.approvedAt || masterTimingMap.approvedByUserId)

  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-map-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{formatTimingLabel(masterTimingMap.status)}</span>
          <span className="compact-summary-chip">{formatTimingSeconds(masterTimingMap.durationSeconds)}</span>
          <span className="compact-summary-chip">{masterTimingMap.frameRate}fps</span>
          <span className="compact-summary-chip">{data.segments.length} segments</span>
          <span className="compact-summary-chip">{data.conflictCount} conflicts</span>
          <span className="compact-summary-chip">{readinessLabel(qaReport.readinessDecision)}</span>
        </div>
      )}
      defaultExpanded
      eyebrow="StoryTiming"
      helper="StoryTiming coordinates captions, cuts, music, SFX, Stroke Motion, Graphic Design, Real Motion, transitions, and render markers so the edit lands on speech meaning, story beats, music rhythm, and viewer comprehension."
      priority="user_summary"
      status={qaReport.blocksRender ? 'blocking' : data.warningCount > 0 ? 'warning' : 'ready'}
      title="StoryTiming map"
    >
      <div className="timing-pill-row">
        <Badge accent={readinessAccent(qaReport.readinessDecision)}>{readinessLabel(qaReport.readinessDecision)}</Badge>
        <Badge accent={masterTimingMap.lockedForGeneration ? 'success' : 'muted'}>
          Locked: {formatTimingLabel(masterTimingMap.lockedForGeneration)}
        </Badge>
        <Badge accent={approved ? 'success' : 'warning'}>Approved: {formatTimingLabel(approved)}</Badge>
        <Badge accent="cyan">Authority: {formatTimingLabel(masterTimingMap.primaryTimingAuthority)}</Badge>
      </div>

      <div className="timing-score-grid timing-map-summary-grid">
        <span><strong>Version</strong>{masterTimingMap.version}</span>
        <span><strong>Status</strong>{formatTimingLabel(masterTimingMap.status)}</span>
        <span><strong>Duration</strong>{formatTimingSeconds(masterTimingMap.durationSeconds)}</span>
        <span><strong>Frame rate</strong>{masterTimingMap.frameRate}fps</span>
        <span><strong>Warnings</strong>{data.warningCount}</span>
        <span><strong>Conflicts</strong>{data.conflictCount}</span>
        <span><strong>Anchors</strong>{data.allAnchors.length}</span>
        <span><strong>Events</strong>{data.events.length}</span>
      </div>

      <div className="timing-muted-note">
        StoryTiming consolidates existing timing. It does not replace edit plans, music cues, SFX plans, captions, or signature systems.
      </div>

      <div className="timing-muted-note">
        Timing review is mock-only here. ReeditPro has not rendered the video yet.
      </div>

      <details className="compact-card-details">
        <summary>Show timing hierarchy and source systems</summary>
        <div className="timing-detail-stack">
          <div>
            <strong>Timing hierarchy</strong>
            <div className="timing-pill-row">
              {masterTimingMap.timingHierarchy.map((authority) => (
                <span className="timing-chip" key={authority}>{formatTimingLabel(authority)}</span>
              ))}
            </div>
          </div>
          <div>
            <strong>Source systems included</strong>
            <div className="timing-pill-row">
              {masterTimingMap.sourceSystemsIncluded.map((system) => (
                <span className="timing-chip" key={system}>{formatTimingLabel(system)}</span>
              ))}
            </div>
          </div>
          <p>{masterTimingMap.summary}</p>
          {masterTimingMap.notes.map((note) => <small key={note}>{note}</small>)}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
