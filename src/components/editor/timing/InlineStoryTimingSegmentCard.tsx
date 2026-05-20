import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { StoryTimingSegmentRecord } from '../../../types/storytiming'
import { formatTimingLabel, formatTimingRange } from './timingChatUiData'

type InlineStoryTimingSegmentCardProps = {
  segments: StoryTimingSegmentRecord[]
}

function yesNo(value: boolean) {
  return value ? 'yes' : 'no'
}

export function InlineStoryTimingSegmentCard({ segments }: InlineStoryTimingSegmentCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-segment-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{segments.length} segments</span>
          <span className="compact-summary-chip">{segments.filter((segment) => segment.hasSpeech).length} speech</span>
          <span className="compact-summary-chip">{segments.filter((segment) => segment.hasCaptions).length} captions</span>
          <span className="compact-summary-chip">{segments.filter((segment) => segment.hasSignatureOverlay).length} signature</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Timing segments"
      helper="Segments stay compact in chat. Details expand only when a timing decision needs review."
      priority="user_summary"
      status="ready"
      title="Key story timing segments"
    >
      <div className="timing-list">
        {segments.slice(0, 5).map((segment) => (
          <article className="timing-list-item" key={segment.id}>
            <div className="timing-list-heading">
              <div>
                <strong>Segment {segment.segmentOrder}: {segment.purpose}</strong>
                <small>{formatTimingRange(segment.outputTimeRange)} output</small>
              </div>
              <Badge accent={segment.preserveEmotionalPause ? 'success' : 'muted'}>
                Pause: {yesNo(segment.preserveEmotionalPause)}
              </Badge>
            </div>
            <div className="timing-pill-row">
              <span className="timing-chip">Authority: {formatTimingLabel(segment.primaryAuthority)}</span>
              <span className="timing-chip">Speech: {yesNo(segment.hasSpeech)}</span>
              <span className="timing-chip">Music: {yesNo(segment.hasMusic)}</span>
              <span className="timing-chip">SFX: {yesNo(segment.hasSFX)}</span>
              <span className="timing-chip">Captions: {yesNo(segment.hasCaptions)}</span>
              <span className="timing-chip">Signature: {yesNo(segment.hasSignatureOverlay)}</span>
            </div>
            <details className="compact-card-details">
              <summary>Segment timing details</summary>
              <div className="timing-detail-stack">
                <span>Source range: {formatTimingRange(segment.sourceTimeRange)}</span>
                <span>Output range: {formatTimingRange(segment.outputTimeRange)}</span>
                <span>Pacing style: {formatTimingLabel(segment.pacingStyle)}</span>
                {segment.notes.map((note) => <small key={note}>{note}</small>)}
              </div>
            </details>
          </article>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
