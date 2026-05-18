import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan, TimingQaCheck } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineMasterTimingPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function formatSeconds(seconds: number) {
  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`
}

function frameRange(startFrame: number, endFrame: number) {
  return `${startFrame}-${endFrame}f`
}

function riskAccent(riskLevel: TimingQaCheck['riskLevel']) {
  if (riskLevel === 'blocking') return 'danger'
  if (riskLevel === 'high') return 'warning'
  if (riskLevel === 'medium') return 'blue'
  return 'success'
}

export function InlineMasterTimingPlanCard({ descriptor, plan }: InlineMasterTimingPlanCardProps) {
  const timingPlan = plan.masterTimingPlan

  if (!timingPlan) {
    return null
  }

  const blocked = timingPlan.status === 'needs_frame_confirmation' || timingPlan.status === 'blocked'
  const beatAligned = timingPlan.beatGridPlan.beatItems.length > 0

  return (
    <InlinePlanCardShell
      className="master-timing-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{timingPlan.status.replaceAll('_', ' ')}</span>
          <span className="compact-summary-chip">{timingPlan.timingBase.fps}fps</span>
          <span className="compact-summary-chip">{timingPlan.timingBase.totalFrames} frames</span>
          <span className="compact-summary-chip">{timingPlan.finalTimelineSegments.length} segments</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? blocked}
      eyebrow="StoryTiming"
      helper="ReeditPro plans captions, visuals, transitions, SFX, music, AI clips, and Remotion layers on a frame-accurate timeline."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Master timing"
    >
      <div className="renderer-badge-row">
        <Badge accent="cyan">Frame accurate</Badge>
        <Badge accent={blocked ? 'warning' : 'success'}>{blocked ? 'Needs frame confirmation' : 'Timing ready'}</Badge>
        <Badge accent="blue">Speech first</Badge>
        {beatAligned && <Badge accent="violet">Beat aligned</Badge>}
        <Badge accent="success">Voice protected</Badge>
        <Badge accent="muted">No real audio analysis</Badge>
      </div>

      <div className="timing-summary-grid">
        <span><strong>Status</strong>{timingPlan.status.replaceAll('_', ' ')}</span>
        <span><strong>FPS</strong>{timingPlan.timingBase.fps}</span>
        <span><strong>Duration</strong>{formatSeconds(timingPlan.timingBase.totalDurationSeconds)}</span>
        <span><strong>Total frames</strong>{timingPlan.timingBase.totalFrames}</span>
        <span><strong>Source items</strong>{timingPlan.sourceTimingItems.length}</span>
        <span><strong>Caption cues</strong>{timingPlan.captionTimingItems.length}</span>
        <span><strong>Visual cues</strong>{timingPlan.visualTimingItems.length}</span>
        <span><strong>Provider clips</strong>{timingPlan.providerClipTimingItems.length}</span>
      </div>

      <div className={blocked ? 'timing-blocked-note' : 'timing-draft-note'}>
        {blocked
          ? 'Timing is draft and approval remains locked until output frame confirmation.'
          : 'Timing is mock-planned and ready for review; real transcript/audio/media timing still requires future workers.'}
      </div>

      <div className="timing-base-summary">
        <strong>Timing base</strong>
        <span>{timingPlan.timingBase.fps}fps / {formatSeconds(timingPlan.timingBase.finalDurationSeconds)} final / {timingPlan.timingBase.totalFrames} frames</span>
        <span>Aspect ratio confirmed: {timingPlan.timingBase.aspectRatioConfirmed ? 'yes' : 'no'}</span>
        <span>Source duration estimate: {formatSeconds(timingPlan.timingBase.sourceDurationSeconds)}</span>
      </div>

      <div>
        <h4>Final timeline</h4>
        <div className="timeline-segment-list">
          {timingPlan.finalTimelineSegments.map((segment) => (
            <article className="timeline-segment-item" key={segment.id}>
              <div>
                <strong>{segment.label}</strong>
                <small>{segment.role?.replaceAll('_', ' ') ?? 'segment'} / {formatSeconds(segment.finalRange.startSeconds)}-{formatSeconds(segment.finalRange.endSeconds)}</small>
              </div>
              <span className="frame-range-badge">{frameRange(segment.finalRange.startFrame, segment.finalRange.endFrame)}</span>
              <p>{segment.pacingNotes[0]}</p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Captions</h4>
        <div className="caption-timing-list">
          {timingPlan.captionTimingItems.slice(0, 6).map((caption) => (
            <article className="timing-cue-item" key={caption.id}>
              <strong>{caption.captionText}</strong>
              <span>{frameRange(caption.timeRange.startFrame, caption.timeRange.endFrame)}</span>
              <small>{caption.readabilityScore} readability</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Visual cues</h4>
        <div className="visual-timing-list">
          {timingPlan.visualTimingItems.slice(0, 6).map((visual) => (
            <article className="timing-cue-item" key={visual.id}>
              <strong>{visual.label}</strong>
              <span>{visual.visualType.replaceAll('_', ' ')} / {frameRange(visual.timeRange.startFrame, visual.timeRange.endFrame)}</span>
              <small>{visual.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="timing-cue-list">
        <h4>Beat grid / SoundSync</h4>
        <article className="timing-cue-item">
          <strong>{timingPlan.beatGridPlan.bpm ? `${timingPlan.beatGridPlan.bpm} BPM mock grid` : 'Voice-led timing'}</strong>
          <span>{timingPlan.beatGridPlan.confidence} confidence</span>
          <small>{timingPlan.beatGridPlan.limitations[0]}</small>
        </article>
      </div>

      <div className="transition-timing-list">
        <h4>Transitions + SFX</h4>
        {timingPlan.transitionTimingItems.slice(0, 4).map((transition) => (
          <article className="timing-cue-item" key={transition.id}>
            <strong>{transition.transitionType.replaceAll('_', ' ')}</strong>
            <span>{frameRange(transition.timeRange.startFrame, transition.timeRange.endFrame)}</span>
            <small>{transition.reason}</small>
          </article>
        ))}
        {timingPlan.sfxTimingItems.slice(0, 4).map((sfx) => (
          <article className="timing-cue-item" key={sfx.id}>
            <strong>{sfx.label}</strong>
            <span>{sfx.cueType.replaceAll('_', ' ')} / {frameRange(sfx.timeRange.startFrame, sfx.timeRange.endFrame)}</span>
            <small>{sfx.reason}</small>
          </article>
        ))}
      </div>

      <div>
        <h4>Provider clip timing</h4>
        <div className="provider-clip-timing-list">
          {timingPlan.providerClipTimingItems.slice(0, 6).map((clip) => (
            <article className="timing-cue-item" key={clip.id}>
              <strong>{clip.providerModel?.replaceAll('_', ' ') ?? 'Provider asset'}</strong>
              <span>{clip.expectedDurationFrames}f / {frameRange(clip.placementRange.startFrame, clip.placementRange.endFrame)}</span>
              <small>{clip.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Timing QA</h4>
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

      <div className="timing-no-real-analysis-note">
        {timingPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
