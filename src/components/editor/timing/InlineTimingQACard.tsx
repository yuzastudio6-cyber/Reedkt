import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type {
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  TimingConflictRecord,
} from '../../../types/storytiming'
import {
  formatTimingLabel,
  formatTimingRange,
  qaStatusAccent,
  readinessAccent,
  readinessLabel,
  scoreAccent,
} from './timingChatUiData'

type InlineTimingQACardProps = {
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  qaReport: StoryTimingQAReportRecord
}

function scoreItems(report: StoryTimingQAReportRecord) {
  return [
    ['Overall', report.overallScore],
    ['Caption/cut', report.captionCutScore],
    ['Music/SFX', report.musicSfxScore],
    ['Signature timing', report.signatureTimingScore],
    ['Overlay safety', report.overlaySafetyScore],
    ['Emotional timing', report.emotionalTimingScore],
    ['Rhythm', report.overallRhythmScore],
    ['Render manifest', report.renderManifestScore],
  ] as const
}

export function InlineTimingQACard({ conflicts, qaChecks, qaReport }: InlineTimingQACardProps) {
  const topChecks = qaChecks.filter((check) => check.status !== 'passed').slice(0, 4)
  const topConflicts = conflicts.slice(0, 3)

  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-qa-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">Score {qaReport.overallScore}/100</span>
          <span className="compact-summary-chip">{readinessLabel(qaReport.readinessDecision)}</span>
          <span className="compact-summary-chip">{qaReport.recommendedActions.length} actions</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Timing QA"
      helper="Full Timing QA combines caption/cut, music/SFX, signature animation, overlay safety, rhythm, and render readiness checks."
      priority={qaReport.blocksRender || qaReport.blocksPreview ? 'required_user_action' : 'safety_detail'}
      status={qaReport.blocksRender ? 'blocking' : qaReport.blocksPreview ? 'warning' : 'ready'}
      title="Timing QA report"
    >
      <div className="timing-pill-row">
        <Badge accent={readinessAccent(qaReport.readinessDecision)}>{readinessLabel(qaReport.readinessDecision)}</Badge>
        <Badge accent={qaReport.blocksPreview ? 'warning' : 'success'}>Blocks preview: {formatTimingLabel(qaReport.blocksPreview)}</Badge>
        <Badge accent={qaReport.blocksRender ? 'danger' : 'success'}>Blocks render: {formatTimingLabel(qaReport.blocksRender)}</Badge>
        <Badge accent={qaReport.requiresUserReview ? 'info' : 'muted'}>User review: {formatTimingLabel(qaReport.requiresUserReview)}</Badge>
      </div>

      <div className="timing-score-grid">
        {scoreItems(qaReport).map(([label, score]) => (
          <span key={label}>
            <strong>{label}</strong>
            <em className={`timing-score-accent timing-score-${scoreAccent(score)}`}>{score}/100</em>
          </span>
        ))}
      </div>

      <div className="timing-muted-note">{qaReport.summary}</div>

      {(topConflicts.length > 0 || topChecks.length > 0) && (
        <div className="timing-list">
          {topConflicts.map((conflict) => (
            <article className="timing-mini-issue" key={conflict.id}>
              <strong>{formatTimingLabel(conflict.conflictType)}</strong>
              <span>{formatTimingRange(conflict.timeRange)} / {formatTimingLabel(conflict.severity)}</span>
            </article>
          ))}
          {topChecks.map((check) => (
            <article className="timing-mini-issue" key={check.id}>
              <strong>{check.summary}</strong>
              <span>{formatTimingLabel(check.checkType)} / {formatTimingLabel(check.status)}</span>
            </article>
          ))}
        </div>
      )}

      <div>
        <strong>Recommended actions</strong>
        <div className="timing-pill-row">
          {qaReport.recommendedActions.map((action) => (
            <span className="timing-chip" key={action}>{formatTimingLabel(action)}</span>
          ))}
        </div>
      </div>

      <details className="compact-card-details">
        <summary>Show individual QA checks</summary>
        <div className="timing-list">
          {qaChecks.map((check) => (
            <article className="timing-mini-row" key={check.id}>
              <strong>{formatTimingLabel(check.checkType)}</strong>
              <span>{check.summary}</span>
              <Badge accent={qaStatusAccent(check.status)}>{formatTimingLabel(check.status)}</Badge>
              {check.recommendedFix && <small>{check.recommendedFix}</small>}
            </article>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
