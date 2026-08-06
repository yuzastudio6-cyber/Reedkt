import { Badge } from '../../Badge'
import type { PlanningContext } from '../../../types'

type PlanningSourceSummaryCardProps = {
  planningContext: PlanningContext
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function PlanningSourceSummaryCard({ planningContext }: PlanningSourceSummaryCardProps) {
  const avoidAssets = planningContext.sourceAssets.filter((asset) => asset.status === 'avoid' || asset.status === 'do_not_use')
  const mustUseAssets = planningContext.sourceAssets.filter((asset) => asset.status === 'must_use' || asset.status === 'main_footage')
  const referenceAssets = planningContext.sourceAssets.filter((asset) => asset.status === 'reference_only')

  return (
    <section className="inline-chat-card planning-source-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Planning sources</span>
          <h3>Clean Assembly and Source Library</h3>
        </div>
        <Badge accent={planningContext.cleanAssembly.accepted ? 'success' : 'warning'}>
          {planningContext.cleanAssembly.accepted ? 'Cleanup accepted' : 'Cleanup reviewable'}
        </Badge>
      </div>

      <div className="planning-context-stat-grid">
        <span><strong>v{planningContext.cleanAssembly.version}</strong><small>Clean Assembly</small></span>
        <span><strong>{formatDuration(planningContext.cleanAssembly.durationMs)}</strong><small>Duration</small></span>
        <span><strong>{planningContext.cleanAssembly.segmentCount}</strong><small>Segments</small></span>
        <span><strong>{planningContext.cleanAssembly.sourceTimeMappingCount}</strong><small>Source mappings</small></span>
        <span><strong>{planningContext.sourceAssets.length}</strong><small>Total assets</small></span>
        <span><strong>{mustUseAssets.length}</strong><small>Must-use/main</small></span>
        <span><strong>{avoidAssets.length}</strong><small>Avoid/do-not-use</small></span>
        <span><strong>{referenceAssets.length}</strong><small>Reference-only</small></span>
      </div>

      <div className="planning-source-asset-list">
        {planningContext.sourceAssets.length === 0 ? (
          <p className="inline-helper">No Source Library assets are available yet.</p>
        ) : planningContext.sourceAssets.map((asset) => (
          <article className={`planning-source-asset planning-source-asset--${asset.status}`} key={asset.mediaAssetId}>
            <div>
              <strong>{asset.label}</strong>
              <span>{formatLabel(asset.role)} / {formatLabel(asset.status)}</span>
            </div>
            <small>{asset.explanation}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
