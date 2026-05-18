import { Badge } from '../../Badge'
import type { runMockMusicQAFlow } from '../../../backend/orchestrators/mock-music-qa-orchestrator'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import { formatMusicLabel } from './musicChatUiData'

type MusicQAFlowResult = ReturnType<typeof runMockMusicQAFlow>

type InlineMusicQACardProps = {
  primaryResult: MusicQAFlowResult
  warningResult: MusicQAFlowResult
}

export function InlineMusicQACard({ primaryResult, warningResult }: InlineMusicQACardProps) {
  const report = primaryResult.qaReport
  const warningReport = warningResult.qaReport
  const lyricsUnderSpeech = warningReport.issues.some((issue) => issue.category === 'lyrics_policy')

  return (
    <InlinePlanCardShell
      className="music-inline-card music-qa-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">Score {report.overallScore}/100</span>
          <span className="compact-summary-chip">{report.status}</span>
          <span className="compact-summary-chip">{formatMusicLabel(report.recommendedAction)}</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Music QA"
      priority="safety_detail"
      status={report.status === 'passed' ? 'complete' : report.status === 'warning' ? 'warning' : 'blocking'}
      title="Music QA result"
    >
      <div className="music-score-grid">
        <span><strong>Overall</strong>{report.overallScore}</span>
        <span><strong>Speech safety</strong>{report.speechSafetyScore}</span>
        <span><strong>Context fit</strong>{report.contextFitScore}</span>
        <span><strong>Culture fit</strong>{report.cultureFitScore}</span>
        <span><strong>Mood fit</strong>{report.moodFitScore}</span>
        <span><strong>Mix readiness</strong>{report.mixReadinessScore}</span>
        <span><strong>Status</strong>{report.status}</span>
        <span><strong>Action</strong>{formatMusicLabel(report.recommendedAction)}</span>
      </div>
      <div className="music-pill-row">
        <Badge accent="success">Approved for project: {report.status === 'failed' ? 'No' : 'Yes'}</Badge>
        <Badge accent={primaryResult.libraryCandidate.status === 'candidate' ? 'success' : 'muted'}>
          Library candidate: {formatMusicLabel(primaryResult.libraryCandidate.status)}
        </Badge>
        <Badge accent={primaryResult.regenerationDecision.shouldRegenerate ? 'warning' : 'success'}>
          Regeneration: {primaryResult.regenerationDecision.shouldRegenerate ? 'Needed' : 'Not needed'}
        </Badge>
      </div>
      {lyricsUnderSpeech && (
        <p className="music-warning">
          Lyrics were detected under dialogue. ReeditPro recommends regenerating this cue as instrumental-only.
        </p>
      )}
      <details className="compact-card-details">
        <summary>Show QA issues</summary>
        <div className="music-issue-list">
          {[...report.issues, ...warningReport.issues].map((issue) => (
            <div key={issue.id}>
              <strong>{formatMusicLabel(issue.category)}</strong>
              <span>{issue.message}</span>
              <small>{issue.recommendation}</small>
            </div>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
