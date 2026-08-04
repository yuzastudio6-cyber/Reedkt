import { CheckCircle2, RotateCcw, ShieldOff } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type {
  AssetUsageRole,
  PriorityLevel,
  SourceLibraryAsset,
} from '../../../types'
import { SourceAssetNotesEditor } from './SourceAssetNotesEditor'
import { SourceAssetPriorityPicker } from './SourceAssetPriorityPicker'
import { SourceAssetRolePicker } from './SourceAssetRolePicker'

type SourceAssetCardProps = {
  asset: SourceLibraryAsset
  onAcceptSuggestion?: (assetId: string) => void
  onUpdateRole?: (assetId: string, role: AssetUsageRole) => void
  onUpdatePriority?: (assetId: string, priority: PriorityLevel) => void
  onUpdateNotes?: (assetId: string, notes: string) => void
  onMarkDoNotUse?: (assetId: string) => void
  onResetAsset?: (assetId: string) => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function reviewAccent(status: SourceLibraryAsset['reviewStatus']) {
  if (status === 'user_confirmed') return 'success'
  if (status === 'user_modified') return 'cyan'
  if (status === 'do_not_use') return 'danger'
  if (status === 'needs_review') return 'warning'
  return 'muted'
}

export function SourceAssetCard({
  asset,
  onAcceptSuggestion,
  onMarkDoNotUse,
  onResetAsset,
  onUpdateNotes,
  onUpdatePriority,
  onUpdateRole,
}: SourceAssetCardProps) {
  const doNotUse = asset.reviewStatus === 'do_not_use' || asset.userRole === 'do_not_use'

  return (
    <article className={`source-asset-card ${doNotUse ? 'source-asset-card--do-not-use' : ''}`}>
      <div className="source-asset-card-header">
        <div>
          <span className="section-eyebrow">{formatLabel(asset.mediaKind)}</span>
          <h4>{asset.label}</h4>
        </div>
        <div className="inline-plan-card-badges">
          <Badge accent={reviewAccent(asset.reviewStatus)}>{formatLabel(asset.reviewStatus)}</Badge>
          <Badge accent={doNotUse ? 'danger' : 'cyan'}>{formatLabel(asset.userRole)}</Badge>
        </div>
      </div>

      <div className="source-asset-meta-grid">
        <span><strong>AI suggested</strong>{formatLabel(asset.aiSuggestedRole)}</span>
        <span><strong>Priority</strong>{formatLabel(asset.priority)}</span>
        <span><strong>Audio</strong>{formatLabel(asset.audioPolicy)}</span>
      </div>

      {asset.aiSummary && <p className="inline-helper">{asset.aiSummary}</p>}

      <div className="source-asset-controls">
        <SourceAssetRolePicker value={asset.userRole} onChange={(role) => onUpdateRole?.(asset.id, role)} />
        <SourceAssetPriorityPicker value={asset.priority} onChange={(priority) => onUpdatePriority?.(asset.id, priority)} />
      </div>

      <SourceAssetNotesEditor value={asset.userNotes} onChange={(notes) => onUpdateNotes?.(asset.id, notes)} />

      <div className="compact-summary-row">
        {asset.tags.map((tag) => <span className="compact-summary-chip" key={tag}>{tag}</span>)}
      </div>

      <div className="source-asset-actions">
        <Button icon={CheckCircle2} onClick={() => onAcceptSuggestion?.(asset.id)} size="sm" variant="secondary">
          Accept suggestion
        </Button>
        <Button icon={ShieldOff} onClick={() => onMarkDoNotUse?.(asset.id)} size="sm" variant="danger">
          Do not use
        </Button>
        <Button icon={RotateCcw} onClick={() => onResetAsset?.(asset.id)} size="sm" variant="ghost">
          Reset
        </Button>
      </div>
    </article>
  )
}
