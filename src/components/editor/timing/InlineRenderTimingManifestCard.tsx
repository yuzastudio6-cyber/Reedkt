import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { RenderTimingManifestRecord } from '../../../types/storytiming'
import { formatTimingLabel, formatTimingSeconds, timingTrackLabels } from './timingChatUiData'

type InlineRenderTimingManifestCardProps = {
  manifest?: RenderTimingManifestRecord
}

export function InlineRenderTimingManifestCard({ manifest }: InlineRenderTimingManifestCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-manifest-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{manifest ? formatTimingLabel(manifest.status) : 'Missing manifest'}</span>
          <span className="compact-summary-chip">{manifest?.tracks.length ?? 0} tracks</span>
          <span className="compact-summary-chip">{manifest?.events.length ?? 0} events</span>
          <span className="compact-summary-chip">Render: {formatTimingLabel(Boolean(manifest?.readyForRender))}</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Render manifest"
      helper="The render timing manifest is a worker-ready plan derived from StoryTiming."
      priority="advanced_plan_detail"
      status={manifest?.readyForRender ? 'ready' : 'warning'}
      title="Render timing manifest"
    >
      {!manifest ? (
        <p className="timing-warning">Render timing manifest placeholder is missing in this mock review.</p>
      ) : (
        <>
          <div className="timing-pill-row">
            <Badge accent={manifest.readyForRender ? 'success' : 'warning'}>Ready for render: {formatTimingLabel(manifest.readyForRender)}</Badge>
            <Badge accent="cyan">{formatTimingSeconds(manifest.durationSeconds)}</Badge>
            <Badge accent="blue">{manifest.frameRate}fps</Badge>
            <Badge accent={manifest.conflictsResolved.length > 0 ? 'success' : 'muted'}>
              Resolved conflicts: {manifest.conflictsResolved.length}
            </Badge>
          </div>

          <div className="timing-score-grid">
            <span><strong>Status</strong>{formatTimingLabel(manifest.status)}</span>
            <span><strong>Duration</strong>{formatTimingSeconds(manifest.durationSeconds)}</span>
            <span><strong>Frame rate</strong>{manifest.frameRate}fps</span>
            <span><strong>Tracks</strong>{manifest.tracks.length}</span>
            <span><strong>Events</strong>{manifest.events.length}</span>
            <span><strong>Dependencies</strong>{manifest.dependencies.length}</span>
          </div>

          <div className="timing-muted-note">
            Render timing manifest is a worker-ready plan. No rendering happens in this mock UI.
          </div>

          <details className="compact-card-details">
            <summary>Show tracks and worker notes</summary>
            <div className="timing-list">
              {manifest.tracks.map((track) => (
                <article className="timing-mini-row" key={track.id}>
                  <strong>{track.label}</strong>
                  <span>{timingTrackLabels[track.trackType] ?? formatTimingLabel(track.trackType)} / layer {track.layerOrder}</span>
                  <small>{track.eventIds.length} event IDs / {formatTimingLabel(track.sourceSystem)}</small>
                </article>
              ))}
              {manifest.workerNotes.map((note) => <small key={note}>{note}</small>)}
            </div>
          </details>
        </>
      )}
    </InlinePlanCardShell>
  )
}
