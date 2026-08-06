import { CheckCircle2, ShieldOff, X } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { SourceLibraryAsset } from '../../../types'

type EditBriefAssetRulesSectionProps = {
  sourceAssets: SourceLibraryAsset[]
  mustUseAssetIds: string[]
  avoidAssetIds: string[]
  onAddMustUseAsset?: (mediaAssetId: string) => void
  onRemoveMustUseAsset?: (mediaAssetId: string) => void
  onAddAvoidAsset?: (mediaAssetId: string) => void
  onRemoveAvoidAsset?: (mediaAssetId: string) => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function EditBriefAssetRulesSection({
  avoidAssetIds,
  mustUseAssetIds,
  onAddAvoidAsset,
  onAddMustUseAsset,
  onRemoveAvoidAsset,
  onRemoveMustUseAsset,
  sourceAssets,
}: EditBriefAssetRulesSectionProps) {
  if (sourceAssets.length === 0) {
    return (
      <section className="inline-chat-card edit-brief-section">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Asset rules</span>
            <h3>Source Library assets will appear here.</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Asset rules</span>
          <h3>Choose must-use and avoid assets.</h3>
        </div>
      </div>

      <p className="inline-helper">
        These rules guide planning only. They do not change or delete source files.
      </p>

      <div className="edit-brief-asset-list">
        {sourceAssets.map((asset) => {
          const mustUse = mustUseAssetIds.includes(asset.mediaAssetId)
          const avoid = avoidAssetIds.includes(asset.mediaAssetId)
          const sourceMarkedAvoid = asset.userRole === 'do_not_use' || asset.priority === 'do_not_use'

          return (
            <article className={`edit-brief-asset-rule ${avoid || sourceMarkedAvoid ? 'edit-brief-asset-rule-avoid' : ''}`} key={asset.id}>
              <div>
                <h4>{asset.label}</h4>
                <div className="inline-plan-card-badges">
                  <Badge accent="cyan">{formatLabel(asset.userRole)}</Badge>
                  <Badge accent={sourceMarkedAvoid ? 'danger' : 'muted'}>{formatLabel(asset.priority)}</Badge>
                  {mustUse && <Badge accent="success">must use</Badge>}
                  {avoid && <Badge accent="warning">avoid</Badge>}
                </div>
              </div>

              {sourceMarkedAvoid && (
                <p className="inline-helper">Source Library recommends avoiding this asset.</p>
              )}

              <div className="edit-brief-asset-actions">
                <Button
                  disabled={mustUse}
                  icon={CheckCircle2}
                  onClick={() => onAddMustUseAsset?.(asset.mediaAssetId)}
                  size="sm"
                  variant="secondary"
                >
                  Must use
                </Button>
                <Button
                  disabled={!mustUse}
                  icon={X}
                  onClick={() => onRemoveMustUseAsset?.(asset.mediaAssetId)}
                  size="sm"
                  variant="ghost"
                >
                  Remove must-use
                </Button>
                <Button
                  disabled={avoid}
                  icon={ShieldOff}
                  onClick={() => onAddAvoidAsset?.(asset.mediaAssetId)}
                  size="sm"
                  variant="secondary"
                >
                  Avoid
                </Button>
                <Button
                  disabled={!avoid}
                  icon={X}
                  onClick={() => onRemoveAvoidAsset?.(asset.mediaAssetId)}
                  size="sm"
                  variant="ghost"
                >
                  Remove avoid
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
