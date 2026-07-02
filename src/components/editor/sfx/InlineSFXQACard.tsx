import { Badge } from '../../Badge'
import type { SFXQAReportRecord } from '../../../types'
import { formatSFXLabel } from './sfxChatUiData'

type InlineSFXQACardProps = {
  qaReport: SFXQAReportRecord
  warningReport?: SFXQAReportRecord
}

export function InlineSFXQACard({ qaReport, warningReport }: InlineSFXQACardProps) {
  const visibleIssues = qaReport.issues.length > 0 ? qaReport.issues : warningReport?.issues ?? []

  return (
    <section className="inline-chat-card sfx-inline-card sfx-qa-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">SFX QA</span>
          <h3>{formatSFXLabel(qaReport.status)} - {qaReport.overallScore}/100</h3>
        </div>
        <Badge accent={qaReport.status === 'passed' ? 'success' : 'warning'}>{formatSFXLabel(qaReport.recommendedAction)}</Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Timing</strong>{qaReport.timingScore}</span>
        <span><strong>Volume</strong>{qaReport.volumeScore}</span>
        <span><strong>Style fit</strong>{qaReport.styleFitScore}</span>
        <span><strong>Voice safety</strong>{qaReport.voiceSafetyScore}</span>
        <span><strong>Music fit</strong>{qaReport.musicFitScore}</span>
        <span><strong>Artifacts</strong>{qaReport.artifactScore}</span>
        <span><strong>Project approved</strong>{formatSFXLabel(qaReport.approvedForProject)}</span>
        <span><strong>Library candidate</strong>{formatSFXLabel(qaReport.approvedForLibraryCandidate)}</span>
        <span><strong>Regenerate</strong>{formatSFXLabel(qaReport.requiresRegeneration)}</span>
        <span><strong>Trim adjust</strong>{formatSFXLabel(qaReport.requiresTrimAdjustment)}</span>
        <span><strong>Mix adjust</strong>{formatSFXLabel(qaReport.requiresMixAdjustment)}</span>
      </div>

      {visibleIssues.length > 0 ? (
        <details className="sfx-details">
          <summary>QA issues and warnings</summary>
          <div className="sfx-issue-list">
            {visibleIssues.slice(0, 5).map((issue) => (
              <div key={issue.id}>
                <strong>{formatSFXLabel(issue.issueType)}</strong>
                <span>{issue.description}</span>
                <small>{issue.recommendedFix}</small>
              </div>
            ))}
          </div>
        </details>
      ) : (
        <p className="sfx-success">This SFX passed QA in the mock flow. It is subtle, timed, and safe for project preview.</p>
      )}
    </section>
  )
}
