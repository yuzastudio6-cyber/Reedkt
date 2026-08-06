import { Badge } from '../../Badge'
import type {
  CleanAssembly,
  CleanAssemblySegment,
  SourceTimeMapping,
  WorkflowTimeRange,
} from '../../../types'

type CleanAssemblyPreviewCardProps = {
  cleanAssembly: CleanAssembly
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
}

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTime(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeRange(range: WorkflowTimeRange) {
  return `${formatTime(range.startMs)}-${formatTime(range.endMs)}`
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function CleanAssemblyPreviewCard({
  cleanAssembly,
  cleanAssemblySegments,
  sourceTimeMappings,
}: CleanAssemblyPreviewCardProps) {
  return (
    <section className="inline-chat-card footage-prep-clean-assembly-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Clean Assembly</span>
          <h3>Readable assistant-editor sequence</h3>
        </div>
        <div className="inline-plan-card-badges">
          <Badge accent="cyan">{formatDuration(cleanAssembly.durationMs)}</Badge>
          <Badge accent="muted">v{cleanAssembly.version}</Badge>
        </div>
      </div>

      <p className="inline-helper">{cleanAssembly.summary}</p>

      <div className="footage-prep-mapping-note">
        <strong>Raw -&gt; Clean</strong>
        <span>{sourceTimeMappings.length} source time mappings preserve the relationship between raw upload and clean assembly.</span>
      </div>

      <div className="footage-prep-segment-list">
        {cleanAssemblySegments.map((segment, index) => (
          <article className={`footage-prep-segment-item ${segment.userRestored ? 'footage-prep-segment-restored' : ''}`} key={segment.id}>
            <div className="footage-prep-segment-index">{index + 1}</div>
            <div className="footage-prep-segment-body">
              <div className="footage-prep-segment-header">
                <strong>{segment.label ?? 'Clean assembly segment'}</strong>
                <span>{formatLabel(segment.kind)}</span>
              </div>
              <div className="footage-prep-range-row">
                <span><strong>Raw</strong>{formatTimeRange(segment.rawSourceRange)}</span>
                <span><strong>Clean</strong>{formatTimeRange(segment.cleanAssemblyRange)}</span>
              </div>
              {segment.transcriptText && <p>{segment.transcriptText}</p>}
              <div className="compact-summary-row">
                {segment.userRestored && <span className="compact-summary-chip">Restored</span>}
                {segment.locked && <span className="compact-summary-chip">Important</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
