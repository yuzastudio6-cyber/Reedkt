import { Badge } from '../../Badge'
import type {
  SFXGeneratedAssetRecord,
  SFXTimingAlignmentRecord,
  SFXTimingValidationResult,
  SFXTrimPlanRecord,
} from '../../../types'
import { formatSFXLabel, formatSFXMs, formatSFXSeconds } from './sfxChatUiData'

type InlineSFXTimingTrimCardProps = {
  generatedAsset: SFXGeneratedAssetRecord
  timingAlignment: SFXTimingAlignmentRecord
  trimPlan: SFXTrimPlanRecord
  validation?: SFXTimingValidationResult
}

export function InlineSFXTimingTrimCard({
  generatedAsset,
  timingAlignment,
  trimPlan,
  validation,
}: InlineSFXTimingTrimCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-timing-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Timing / trim / hit alignment</span>
          <h3>Hit lands on {formatSFXLabel(timingAlignment.anchorType)}</h3>
        </div>
        <Badge accent={validation?.ok === false ? 'warning' : 'success'}>{validation?.ok === false ? 'Review' : 'Frame planned'}</Badge>
      </div>

      <p className="sfx-success">The hit point is more important than the file start.</p>

      <div className="sfx-score-grid">
        <span><strong>Anchor time</strong>{formatSFXSeconds(timingAlignment.anchorTimeSeconds)}</span>
        <span><strong>Start</strong>{formatSFXSeconds(timingAlignment.startTimeSeconds)}</span>
        <span><strong>Hit</strong>{formatSFXSeconds(timingAlignment.hitTimeSeconds)}</span>
        <span><strong>End</strong>{formatSFXSeconds(timingAlignment.endTimeSeconds)}</span>
        <span><strong>Generated</strong>{formatSFXSeconds(generatedAsset.fullGeneratedDurationSeconds)}</span>
        <span><strong>Needed</strong>{formatSFXSeconds(trimPlan.neededDurationSeconds)}</span>
        <span><strong>Pre-roll</strong>{formatSFXMs(timingAlignment.preRollMs)}</span>
        <span><strong>Tail</strong>{formatSFXMs(timingAlignment.tailMs)}</span>
      </div>

      <details className="sfx-details">
        <summary>Trim and fade details</summary>
        <div className="sfx-score-grid">
          <span><strong>Trim start</strong>{formatSFXSeconds(trimPlan.trimStartSeconds)}</span>
          <span><strong>Trim end</strong>{formatSFXSeconds(trimPlan.trimEndSeconds)}</span>
          <span><strong>Hit offset</strong>{formatSFXMs(trimPlan.hitOffsetInsideTrimMs)}</span>
          <span><strong>Fade in/out</strong>{formatSFXMs(trimPlan.fadeInMs)} / {formatSFXMs(trimPlan.fadeOutMs)}</span>
          <span><strong>Priority</strong>{formatSFXLabel(timingAlignment.timingPriority)}</span>
          <span><strong>Speech safe</strong>{formatSFXLabel(timingAlignment.speechSafePlacement)}</span>
        </div>
      </details>

      {(validation?.warnings.length ?? 0) > 0 && (
        <p className="sfx-warning">{validation?.warnings.join(' ')}</p>
      )}
    </section>
  )
}
