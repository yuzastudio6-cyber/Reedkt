import type { MockFootagePrepResult } from '../../../lib/footage-prep'
import type {
  AssetUsageRole,
  PriorityLevel,
  SourceLibraryState,
  SourceLibrarySummary,
  WorkflowActivityEvent,
} from '../../../types'
import { SourceAssetCard } from './SourceAssetCard'
import { SourceLibrarySummaryCard } from './SourceLibrarySummaryCard'
import { SourceLibraryToolbar } from './SourceLibraryToolbar'

type SourceLibraryPanelProps = {
  result: MockFootagePrepResult | null
  sourceLibraryState?: SourceLibraryState | null
  summary?: SourceLibrarySummary | null
  activityEvents?: WorkflowActivityEvent[]
  onAcceptSuggestion?: (assetId: string) => void
  onUpdateRole?: (assetId: string, role: AssetUsageRole) => void
  onUpdatePriority?: (assetId: string, priority: PriorityLevel) => void
  onUpdateNotes?: (assetId: string, notes: string) => void
  onMarkDoNotUse?: (assetId: string) => void
  onResetAsset?: (assetId: string) => void
  onResetAll?: () => void
  onConfirmLibrary?: () => void
  className?: string
}

export function SourceLibraryPanel({
  className = '',
  onAcceptSuggestion,
  onConfirmLibrary,
  onMarkDoNotUse,
  onResetAll,
  onResetAsset,
  onUpdateNotes,
  onUpdatePriority,
  onUpdateRole,
  result,
  sourceLibraryState,
  summary,
}: SourceLibraryPanelProps) {
  if (!result || !sourceLibraryState || !summary) {
    return (
      <section className={`inline-chat-card source-library-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Source library</span>
            <h3>Source library will appear after source prep.</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`source-library-panel ${className}`.trim()}>
      <div className="source-library-intro inline-chat-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Source Library</span>
            <h3>Tell AI what each file is for before creative planning.</h3>
          </div>
        </div>
        <p className="inline-helper">Changing an asset role does not change or delete the source file.</p>
        <p className="inline-helper">Confirming this library helps ReeditPro plan more accurately. You can still continue and adjust later.</p>
      </div>

      <SourceLibrarySummaryCard
        confirmed={sourceLibraryState.sourceLibrary.status === 'confirmed'}
        status={sourceLibraryState.sourceLibrary.status}
        summary={summary}
      />

      <SourceLibraryToolbar
        onConfirmLibrary={onConfirmLibrary}
        onResetAll={onResetAll}
        operationCount={sourceLibraryState.operations.length}
        status={sourceLibraryState.sourceLibrary.status}
      />

      <div className="source-asset-list">
        {sourceLibraryState.assets.map((asset) => (
          <SourceAssetCard
            asset={asset}
            key={asset.id}
            onAcceptSuggestion={onAcceptSuggestion}
            onMarkDoNotUse={onMarkDoNotUse}
            onResetAsset={onResetAsset}
            onUpdateNotes={onUpdateNotes}
            onUpdatePriority={onUpdatePriority}
            onUpdateRole={onUpdateRole}
          />
        ))}
      </div>
    </section>
  )
}
