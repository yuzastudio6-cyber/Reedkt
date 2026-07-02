import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  VideoUnderstandingConfidence,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineVideoUnderstandingCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function confidenceTone(confidence: VideoUnderstandingConfidence) {
  if (confidence === 'high') return 'confidence-badge confidence-badge-high'
  if (confidence === 'medium') return 'confidence-badge confidence-badge-medium'
  return 'confidence-badge confidence-badge-low'
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

export function InlineVideoUnderstandingCard({ descriptor, plan }: InlineVideoUnderstandingCardProps) {
  const report = plan.videoUnderstandingReport

  if (!report) {
    return null
  }

  const clips = report.clips.slice(0, 5)
  const hiddenClipCount = Math.max(0, report.clips.length - clips.length)
  const topStrategyItems = report.suggestedStrategy.items.slice(0, 5)
  const opportunityTypes = unique(report.visualSupportOpportunities.map((opportunity) => opportunity.opportunityType))
  const qualityIssues = unique([
    ...report.visualUnderstanding.colorLightingIssues,
    ...report.audioUnderstanding.audioIssues,
  ].filter((issue) => issue !== 'none'))

  return (
    <InlinePlanCardShell
      className="video-understanding-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{report.clips.length} clips</span>
          <span className="compact-summary-chip">{report.visualSupportOpportunities.length} opportunities</span>
          <span className="compact-summary-chip">{report.sourceOrderConfirmed ? 'source confirmed' : 'source unconfirmed'}</span>
          <span className={confidenceTone(report.confidence)}>{report.confidence} confidence</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Video understanding"
      helper="Before planning visuals, ReeditPro analyzes what the video appears to contain. This mock report explains what the edit needs without using a rigid template."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Video understanding"
    >
      <div className="video-understanding-summary">
        <span><strong>Summary</strong>{report.overallSummary}</span>
        <span><strong>Confidence</strong>{report.confidence}</span>
        <span><strong>Source order</strong>{report.sourceOrderConfirmed ? 'Confirmed' : 'Needs confirmation'}</span>
        <span><strong>Opportunities</strong>{opportunityTypes.map(label).join(', ')}</span>
        <span><strong>Limitations</strong>{report.limitations.length} mock limitation notes</span>
      </div>

      <div className="understanding-chip-row">
        {opportunityTypes.slice(0, 8).map((type) => (
          <span className="opportunity-chip" key={type}>{label(type)}</span>
        ))}
        {qualityIssues.slice(0, 6).map((issue) => (
          <span className="quality-issue-chip" key={issue}>{label(issue)}</span>
        ))}
      </div>

      <p className="understanding-limitations-note">{report.limitations.join(' ')}</p>

      <details className="understanding-section">
        <summary>Clip understanding</summary>
        <div className="clip-understanding-list">
          {clips.map((clip) => (
            <article className="clip-understanding-item" key={clip.clipId}>
              <div>
                <span className="section-eyebrow">Order {clip.uploadedOrder} / {clip.duration}</span>
                <h4>{clip.fileName}</h4>
                <p>{clip.transcriptSummary}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="opportunity-chip">{label(clip.detectedRole)}</span>
                <span className={confidenceTone(clip.roleConfidence)}>{clip.roleConfidence}</span>
                {clip.visualSupportOpportunities.slice(0, 4).map((opportunity) => (
                  <span className="opportunity-chip" key={opportunity}>{label(opportunity)}</span>
                ))}
                {[...clip.visualQualityIssues, ...clip.audioQualityIssues]
                  .filter((issue) => issue !== 'none')
                  .slice(0, 4)
                  .map((issue) => (
                    <span className="quality-issue-chip" key={issue}>{label(issue)}</span>
                  ))}
              </div>
              <div className="layout-mode-meta">
                <span><strong>Visual</strong>{clip.visualSummary}</span>
                <span><strong>Audio</strong>{clip.audioSummary}</span>
              </div>
            </article>
          ))}
        </div>
        {hiddenClipCount > 0 && <p className="inline-helper">{hiddenClipCount} additional clip{hiddenClipCount === 1 ? '' : 's'} summarized in the report.</p>}
      </details>

      <details className="understanding-section">
        <summary>Transcript meaning</summary>
        <p>{report.transcriptMeaning.summary}</p>
        <div className="layout-mode-meta">
          <span><strong>Hook lines</strong>{report.transcriptMeaning.hookLines.join(' ') || 'None'}</span>
          <span><strong>Emotional lines</strong>{report.transcriptMeaning.emotionalLines.join(' ') || 'None'}</span>
          <span><strong>Explanation lines</strong>{report.transcriptMeaning.explanationLines.join(' ') || 'None'}</span>
          <span><strong>Proof/claim lines</strong>{report.transcriptMeaning.proofOrClaimLines.join(' ') || 'None'}</span>
          <span><strong>CTA lines</strong>{report.transcriptMeaning.ctaLines.join(' ') || 'None'}</span>
          <span><strong>Caption density</strong>{report.transcriptMeaning.captionDensityRecommendation}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Visual understanding</summary>
        <p>{report.visualUnderstanding.sceneTypeSummary}</p>
        <div className="layout-mode-meta">
          <span><strong>Speaker framing</strong>{report.visualUnderstanding.speakerFraming}</span>
          <span><strong>Safe zones</strong>{report.visualUnderstanding.faceSafeZoneNotes.join(' ')}</span>
          <span><strong>Empty space</strong>{report.visualUnderstanding.emptySpaceOpportunities.join(' ') || 'None'}</span>
          <span><strong>Depth</strong>{report.visualUnderstanding.depthCompositionOpportunities.join(' ') || 'None'}</span>
          <span><strong>Contact objects</strong>{report.visualUnderstanding.contactObjectOpportunities.join(' ') || 'None'}</span>
          <span><strong>Color/lighting</strong>{report.visualUnderstanding.colorLightingIssues.map(label).join(', ')}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Audio understanding</summary>
        <div className="layout-mode-meta">
          <span><strong>Voice clarity</strong>{report.audioUnderstanding.voiceClarity}</span>
          <span><strong>Cleanup</strong>{report.audioUnderstanding.cleanupNeeded ? 'Needed' : 'Not flagged'}</span>
          <span><strong>Noise</strong>{report.audioUnderstanding.noiseLevel}</span>
          <span><strong>Loudness</strong>{report.audioUnderstanding.loudnessConsistency}</span>
          <span><strong>SoundSync</strong>{report.audioUnderstanding.soundSyncOpportunities.join(' ')}</span>
          <span><strong>Issues</strong>{report.audioUnderstanding.audioIssues.map(label).join(', ')}</span>
        </div>
      </details>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Adaptive strategy</summary>
        <p>{report.suggestedStrategy.summary}</p>
        <div className="adaptive-strategy-list">
          {topStrategyItems.map((item) => (
            <article className="adaptive-strategy-item" key={item.id}>
              <div>
                <h4>{item.label}</h4>
                <p>{item.decision}</p>
                <p>{item.reason}</p>
              </div>
              <div className="understanding-chip-row">
                <Badge accent="cyan">{label(item.recommendedVisualSupport)}</Badge>
                {item.recommendedLayoutMode && <Badge accent="blue">{label(item.recommendedLayoutMode)}</Badge>}
                {item.recommendedToolHints.slice(0, 4).map((hint) => (
                  <span className="opportunity-chip" key={hint}>{label(hint)}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
