import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  TimingRiskLevel,
  TransitionRiskLevel,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSoundSyncTransitionTimingCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function frameRange(startFrame: number, endFrame: number) {
  return `${startFrame}-${endFrame}f`
}

function riskAccent(risk: TimingRiskLevel | TransitionRiskLevel) {
  if (risk === 'blocking') return 'danger'
  if (risk === 'high') return 'warning'
  if (risk === 'medium') return 'blue'
  return 'success'
}

export function InlineSoundSyncTransitionTimingCard({ descriptor, plan }: InlineSoundSyncTransitionTimingCardProps) {
  const timingPlan = plan.soundSyncTransitionTimingPlan

  if (!timingPlan) {
    return null
  }

  const blocked = timingPlan.status === 'blocked'
  const hasRisk = timingPlan.qaChecks.some((item) => item.riskLevel === 'high' || item.riskLevel === 'blocking')

  return (
    <InlinePlanCardShell
      className="soundsync-transition-timing-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{timingPlan.status.replaceAll('_', ' ')}</span>
          <span className="compact-summary-chip">{timingPlan.beatGridPlan.beatItems.length} beats</span>
          <span className="compact-summary-chip">{timingPlan.refinedTransitionTimings.length} transitions</span>
          <span className="compact-summary-chip">{timingPlan.refinedSfxTimings.length} SFX</span>
          <span className="compact-summary-chip">{timingPlan.refinedMusicDuckingTimings.length} ducks</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? (blocked || hasRisk)}
      eyebrow="SoundSync"
      helper="ReeditPro plans beat-aware transitions, SFX, and music ducking with speech-first timing. This is mock timing only; no real AudioFlux analysis has run."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="SoundSync + transition timing"
    >
      <div className="renderer-badge-row">
        <Badge accent={blocked ? 'danger' : timingPlan.status === 'needs_audioflux_analysis' ? 'warning' : 'success'}>{timingPlan.status.replaceAll('_', ' ')}</Badge>
        <Badge accent="violet">Speech first</Badge>
        <Badge accent="cyan">Beat aware</Badge>
        <Badge accent="blue">SFX justified</Badge>
        <Badge accent="muted">AudioFlux planned</Badge>
        <Badge accent="muted">No real audio analysis</Badge>
      </div>

      <div className="soundsync-summary-grid">
        <span><strong>Status</strong>{timingPlan.status.replaceAll('_', ' ')}</span>
        <span><strong>BPM</strong>{timingPlan.beatGridPlan.bpm ?? 'voice-led'}</span>
        <span><strong>Beats</strong>{timingPlan.beatGridPlan.beatItems.length}</span>
        <span><strong>Music phrases</strong>{timingPlan.beatGridPlan.musicPhrases.length}</span>
        <span><strong>Transitions</strong>{timingPlan.refinedTransitionTimings.length}</span>
        <span><strong>SFX</strong>{timingPlan.refinedSfxTimings.length}</span>
        <span><strong>Ducking</strong>{timingPlan.refinedMusicDuckingTimings.length}</span>
        <span><strong>SFX density</strong>{timingPlan.sfxDensityLevel.replaceAll('_', ' ')}</span>
      </div>

      <div className="no-real-audio-analysis-note">
        {timingPlan.summary}
      </div>

      <div className="beat-grid-summary">
        <h4>Beat grid</h4>
        <span><strong>Confidence</strong>{timingPlan.beatGridPlan.confidence}</span>
        <span><strong>Snap tolerance</strong>{timingPlan.beatGridPlan.snapToleranceFrames}f</span>
        <span><strong>Planned analysis</strong>{timingPlan.beatGridPlan.analysisToolPlanned.join(', ') || 'none'}</span>
        <span><strong>Downbeats / drops</strong>{timingPlan.beatGridPlan.beatItems.filter((item) => item.isDownbeat).length} / {timingPlan.beatGridPlan.beatItems.filter((item) => item.isDropMoment).length}</span>
      </div>

      <div>
        <h4>Music phrases</h4>
        <div className="music-phrase-list">
          {timingPlan.beatGridPlan.musicPhrases.map((phrase) => (
            <article className="music-phrase-item" key={phrase.id}>
              <strong>{phrase.label}</strong>
              <span>{frameRange(phrase.timeRange.startFrame, phrase.timeRange.endFrame)}</span>
              <small>{phrase.energy} energy / {phrase.confidence} confidence</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Beat snap decisions</h4>
        <div className="beat-snap-decision-list">
          {timingPlan.beatSnapDecisions.slice(0, 8).map((decision) => (
            <article className="beat-snap-decision-item" key={decision.id}>
              <strong>{decision.snapDecision.replaceAll('_', ' ')}</strong>
              <span>{decision.requestedFrame}f to {decision.snappedFrame}f</span>
              <span className="speech-safe-badge">{decision.speechSafe ? 'speech safe' : 'needs fallback'}</span>
              <small>{decision.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Refined transitions</h4>
        <div className="refined-transition-list">
          {timingPlan.refinedTransitionTimings.map((transition) => (
            <article className="refined-transition-item" key={transition.id}>
              <strong>{transition.transitionType.replaceAll('_', ' ')}</strong>
              <span>{frameRange(transition.timeRange.startFrame, transition.timeRange.endFrame)} / {transition.durationFrames}f</span>
              <div className="compact-summary-row">
                <span className="transition-risk-badge">{transition.riskLevel}</span>
                <span className="beat-sync-status-badge">{transition.beatAligned || transition.downbeatAligned ? 'beat aligned' : 'phrase aligned'}</span>
              </div>
              <small>{transition.reason}</small>
              {transition.fallbackTransitionType && <small>Fallback: {transition.fallbackTransitionType.replaceAll('_', ' ')}</small>}
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>SFX timing</h4>
        <div className="refined-sfx-list">
          {timingPlan.refinedSfxTimings.length ? timingPlan.refinedSfxTimings.map((sfx) => (
            <article className="refined-sfx-item" key={sfx.id}>
              <strong>{sfx.label}</strong>
              <span>{frameRange(sfx.timeRange.startFrame, sfx.timeRange.endFrame)}</span>
              <div className="compact-summary-row">
                <span className="sfx-density-badge">{sfx.densityLevel.replaceAll('_', ' ')}</span>
                <span>{sfx.intensity}</span>
              </div>
              <small>{sfx.reason}</small>
            </article>
          )) : (
            <article className="refined-sfx-item">
              <strong>No SFX needed</strong>
              <span>Voice-led or restrained timing does not invent random SFX.</span>
            </article>
          )}
        </div>
      </div>

      <div>
        <h4>Music ducking</h4>
        <div className="music-ducking-list">
          {timingPlan.refinedMusicDuckingTimings.slice(0, 6).map((ducking) => (
            <article className="music-ducking-item" key={ducking.id}>
              <strong>{ducking.reasonType.replaceAll('_', ' ')}</strong>
              <span>{frameRange(ducking.timeRange.startFrame, ducking.timeRange.endFrame)}</span>
              <div className="compact-summary-row">
                <span className="ducking-strength-badge">{ducking.duckingStrength}</span>
                <span>{ducking.voicePriority ? 'voice priority' : 'review voice priority'}</span>
              </div>
              <small>{ducking.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>QA</h4>
        <div className="soundsync-qa-list">
          {timingPlan.qaChecks.map((qaCheck) => (
            <article className="timing-cue-item" key={qaCheck.id}>
              <strong>{qaCheck.label}</strong>
              <Badge accent={riskAccent(qaCheck.riskLevel)}>{qaCheck.riskLevel}</Badge>
              <small>{qaCheck.message}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="no-real-audio-analysis-note">
        {timingPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
