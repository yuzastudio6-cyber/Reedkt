import { Badge } from '../Badge'
import type {
  CaptionReadabilityRisk,
  ChatPlanningCardDescriptor,
  EditPlan,
  TimingQaCheck,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineCaptionVisualCueTimingCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function frameRange(startFrame: number, endFrame: number) {
  return `${startFrame}-${endFrame}f`
}

function riskAccent(risk: CaptionReadabilityRisk | TimingQaCheck['riskLevel']) {
  if (risk === 'blocking') return 'danger'
  if (risk === 'high') return 'warning'
  if (risk === 'medium') return 'blue'
  return 'success'
}

export function InlineCaptionVisualCueTimingCard({ descriptor, plan }: InlineCaptionVisualCueTimingCardProps) {
  const timingPlan = plan.captionVisualCueTimingPlan

  if (!timingPlan) {
    return null
  }

  const blocked = timingPlan.status === 'blocked'
  const hasCollisionWarning = timingPlan.collisionPlans.some((item) => item.risk === 'high' || item.risk === 'blocking')

  return (
    <InlinePlanCardShell
      className="caption-visual-cue-timing-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{timingPlan.status.replaceAll('_', ' ')}</span>
          <span className="compact-summary-chip">{timingPlan.refinedCaptionTimings.length} captions</span>
          <span className="compact-summary-chip">{timingPlan.visualCueTimings.length} visual cues</span>
          <span className="compact-summary-chip">{timingPlan.collisionPlans.length} collisions</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? (blocked || hasCollisionWarning)}
      eyebrow="StoryTiming"
      helper="ReeditPro times captions and visuals to speech, meaning, readability, and SoundSync cues. This is mock timing only; no real transcript alignment has run."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Caption + visual cue timing"
    >
      <div className="renderer-badge-row">
        <Badge accent={blocked ? 'danger' : timingPlan.status === 'synced' ? 'success' : 'warning'}>{timingPlan.status.replaceAll('_', ' ')}</Badge>
        <Badge accent="cyan">{timingPlan.captionPolicy.chunkingMode.replaceAll('_', ' ')}</Badge>
        <Badge accent="blue">{timingPlan.captionPolicy.animationStyle.replaceAll('_', ' ')}</Badge>
        {hasCollisionWarning && <Badge accent="warning">Collision warning</Badge>}
        <Badge accent="violet">Speech first</Badge>
        <Badge accent="muted">Mock only</Badge>
      </div>

      <div className="timing-summary-grid">
        <span><strong>Status</strong>{timingPlan.status.replaceAll('_', ' ')}</span>
        <span><strong>Chunking</strong>{timingPlan.captionPolicy.chunkingMode.replaceAll('_', ' ')}</span>
        <span><strong>Animation</strong>{timingPlan.captionPolicy.animationStyle.replaceAll('_', ' ')}</span>
        <span><strong>Caption phrases</strong>{timingPlan.captionPhraseTimings.length}</span>
        <span><strong>Refined captions</strong>{timingPlan.refinedCaptionTimings.length}</span>
        <span><strong>Visual cues</strong>{timingPlan.visualCueTimings.length}</span>
        <span><strong>Collisions</strong>{timingPlan.collisionPlans.length}</span>
        <span><strong>Max words</strong>{timingPlan.captionPolicy.maxWordsPerCaption}</span>
      </div>

      <div className="caption-visual-mock-note">
        {timingPlan.summary}
      </div>

      <div className="caption-policy-summary">
        <h4>Caption policy</h4>
        <span><strong>Min / max duration</strong>{timingPlan.captionPolicy.minDurationFrames}-{timingPlan.captionPolicy.maxDurationFrames}f</span>
        <span><strong>Lead / lag</strong>{timingPlan.captionPolicy.leadInFrames}/{timingPlan.captionPolicy.lagFrames}f</span>
        <span><strong>Emphasis</strong>{timingPlan.captionPolicy.emphasisAllowed ? `${timingPlan.captionPolicy.maxEmphasisWordsPerCaption} word(s)` : 'restrained'}</span>
        <span><strong>Avoid</strong>{timingPlan.captionPolicy.avoidRules.slice(0, 2).join(' ')}</span>
      </div>

      <div>
        <h4>Caption phrases</h4>
        <div className="caption-phrase-list">
          {timingPlan.captionPhraseTimings.slice(0, 6).map((phrase) => (
            <article className="caption-phrase-item" key={phrase.id}>
              <strong>{phrase.text}</strong>
              <span>{frameRange(phrase.timeRange.startFrame, phrase.timeRange.endFrame)} / {phrase.phraseRole.replaceAll('_', ' ')}</span>
              <small>{phrase.words.length} mock word timing item(s), low confidence until transcript alignment.</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Refined captions</h4>
        <div className="refined-caption-list">
          {timingPlan.refinedCaptionTimings.slice(0, 6).map((caption) => (
            <article className="refined-caption-item" key={caption.id}>
              <strong>{caption.captionText}</strong>
              <span>{frameRange(caption.timeRange.startFrame, caption.timeRange.endFrame)}</span>
              <div className="compact-summary-row">
                <span className="caption-animation-badge">{caption.animationStyle.replaceAll('_', ' ')}</span>
                <span className="caption-readability-badge">{caption.readabilityRisk}</span>
              </div>
              <small>{caption.emphasisWords.length ? `Emphasis: ${caption.emphasisWords.join(', ')}` : 'No aggressive emphasis.'}</small>
              <small>{caption.safeZoneNotes[0]}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Visual cues</h4>
        <div className="visual-cue-timing-list">
          {timingPlan.visualCueTimings.slice(0, 7).map((cue) => (
            <article className="visual-cue-timing-item" key={cue.id}>
              <strong>{cue.label}</strong>
              <span>{frameRange(cue.timeRange.startFrame, cue.timeRange.endFrame)}</span>
              <div className="compact-summary-row">
                <span className="visual-cue-trigger-badge">{cue.triggerType.replaceAll('_', ' ')}</span>
                <span className="visual-cue-status-badge">{cue.status.replaceAll('_', ' ')}</span>
              </div>
              <small>{cue.cueType.replaceAll('_', ' ')} / reveal {cue.revealFrames}f, hold {cue.holdFrames}f, exit {cue.exitFrames}f</small>
              <small>{cue.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Collision plans</h4>
        <div className="caption-collision-list">
          {timingPlan.collisionPlans.length ? timingPlan.collisionPlans.map((collision) => (
            <article className="caption-collision-item" key={collision.id}>
              <strong>{collision.label}</strong>
              <Badge accent={riskAccent(collision.risk)}>{collision.risk}</Badge>
              <span>{collision.issue}</span>
              <small>{collision.recommendation}</small>
            </article>
          )) : (
            <article className="caption-collision-item">
              <strong>No high-risk caption/visual collision planned</strong>
              <span>Safe-zone notes still travel with each cue.</span>
            </article>
          )}
        </div>
      </div>

      <div>
        <h4>QA</h4>
        <div className="timing-qa-list">
          {timingPlan.qaChecks.map((qaCheck) => (
            <article className="timing-cue-item" key={qaCheck.id}>
              <strong>{qaCheck.label}</strong>
              <Badge accent={riskAccent(qaCheck.riskLevel)}>{qaCheck.riskLevel}</Badge>
              <small>{qaCheck.message}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="caption-visual-mock-note">
        {timingPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
