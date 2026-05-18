import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan } from '../../types/reeditpro'
import type {
  AssetDependencyReadiness,
  AssetMergePlanItem,
  AssetVersionReconciliation,
  AsyncCheckbackItem,
} from '../../types/editing-agent-runtime'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineAsyncAssetReconciliationCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function CheckbackItemCard({ item }: { item: AsyncCheckbackItem }) {
  return (
    <article className="checkback-item">
      <div className="compact-summary-row">
        <strong>{label(item.trigger)}</strong>
        <span className="checkback-status-badge">{label(item.status)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Work item</strong>{item.workItemId}</span>
        <span><strong>Asset</strong>{item.assetManifestItemId ?? 'none'}</span>
        <span><strong>Idempotency</strong>{item.idempotencyKey}</span>
        <span><strong>Provider request</strong>{item.providerRequestId ?? 'future only'}</span>
        <span><strong>Worker job</strong>{item.workerJobId ?? 'future only'}</span>
      </div>
      <p>{item.nextCheckReason}</p>
      <small>Timeout: {item.timeoutPolicy}</small>
      <small>Retry: {item.retryPolicy}</small>
      <small>Fallback: {item.fallbackPolicy.slice(0, 2).join(' ') || 'none'}</small>
      <small>Expected outputs: {item.expectedOutputIds.join(', ') || 'none'}</small>
    </article>
  )
}

function DependencyReadinessCard({ item }: { item: AssetDependencyReadiness }) {
  return (
    <article className="dependency-readiness-item">
      <div className="compact-summary-row">
        <strong>{label(item.dependencyType)}</strong>
        <span className="dependency-readiness-badge">{label(item.status)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Required</strong>{item.required ? 'yes' : 'no'}</span>
        <span><strong>Placeholder</strong>{item.placeholderAllowed ? 'yes' : 'no'}</span>
        <span><strong>Blocks final</strong>{item.blocksFinalRender ? 'yes' : 'no'}</span>
        <span><strong>Blocks preview</strong>{item.blocksPreviewRender ? 'yes' : 'no'}</span>
        <span><strong>Work item</strong>{item.linkedWorkItemId ?? 'none'}</span>
        <span><strong>Asset</strong>{item.linkedAssetManifestItemId ?? 'none'}</span>
      </div>
      <p>{item.reason}</p>
      {item.fallbackIfMissing && <small>Fallback: {item.fallbackIfMissing}</small>}
    </article>
  )
}

function MergePlanItemCard({ item }: { item: AssetMergePlanItem }) {
  return (
    <article className="asset-merge-plan-item">
      <div className="compact-summary-row">
        <strong>{item.assetManifestItemId}</strong>
        <span className="asset-merge-status-badge">{label(item.status)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Decision</strong><span className="reconciliation-decision-badge">{label(item.reconciliationDecision)}</span></span>
        <span><strong>Replace placeholder</strong>{item.replacePlaceholder ? 'yes' : 'no'}</span>
        <span><strong>Update timing</strong>{item.updateTimingRequired ? 'yes' : 'no'}</span>
        <span><strong>Rerender</strong>{item.rerenderRequired ? 'yes' : 'no'}</span>
        <span><strong>QA</strong>{item.qaRequired ? 'yes' : 'no'}</span>
        <span><strong>Fallback</strong>{item.fallbackRequired ? 'yes' : 'no'}</span>
        <span><strong>User review</strong>{item.userReviewRequired ? 'yes' : 'no'}</span>
      </div>
      <p>{item.reason}</p>
      <small>Segments: {item.targetSegmentIds.join(', ') || 'none'}</small>
      <small>Timing: {item.targetTimingCueIds.join(', ') || 'none'}</small>
      <small>Layers: {item.targetRendererLayerIds.join(', ') || 'none'}</small>
    </article>
  )
}

function VersionCard({ item }: { item: AssetVersionReconciliation }) {
  return (
    <article className="asset-version-reconciliation-item">
      <div className="compact-summary-row">
        <strong>{item.assetManifestItemId}</strong>
        <span className="asset-lifecycle-badge">v{item.activeVersion}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Final selected</strong>{item.selectedForFinalRender ? 'yes' : 'no'}</span>
        <span><strong>Previous</strong>{item.previousVersionIds.join(', ') || 'none'}</span>
        <span><strong>Fallbacks</strong>{item.fallbackVersionIds.join(', ') || 'none'}</span>
        <span><strong>Replaces</strong>{item.replacedAssetIds.join(', ') || 'none'}</span>
      </div>
      <p>{item.reason}</p>
    </article>
  )
}

export function InlineAsyncAssetReconciliationCard({ descriptor, plan }: InlineAsyncAssetReconciliationCardProps) {
  const reconciliationPlan = plan.asyncAssetReconciliationPlan

  if (!reconciliationPlan) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="async-asset-reconciliation-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{reconciliationPlan.checkbackItems.length} checkbacks</span>
          <span className="compact-summary-chip">{reconciliationPlan.dependencyReadiness.length} readiness items</span>
          <span className="compact-summary-chip">{reconciliationPlan.mergePlanItems.length} merge items</span>
          <span className="compact-summary-chip">final {reconciliationPlan.finalRenderReadiness.ready ? 'ready' : 'blocked'}</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Execution planning"
      helper="ReeditPro tracks pending jobs, checks back later, merges ready assets into the correct segment/timing/layer, and prevents context loss. This is planning only; no providers or workers run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Async asset reconciliation"
    >
      <div className="renderer-badge-row">
        <Badge accent="cyan">Checkback planned</Badge>
        <Badge accent="blue">Waiting provider</Badge>
        <Badge accent="violet">Waiting worker</Badge>
        <Badge accent="success">Ready to merge</Badge>
        <Badge accent="warning">Placeholder preview</Badge>
        <Badge accent="warning">Final render blocked</Badge>
        <Badge accent="blue">QA pending</Badge>
        <Badge accent="violet">Fallback required</Badge>
        <Badge accent="warning">User review required</Badge>
        <Badge accent="muted">No real execution</Badge>
      </div>

      <div className="async-reconciliation-summary-grid">
        <span><strong>Checkbacks</strong>{reconciliationPlan.checkbackItems.length}</span>
        <span><strong>Readiness</strong>{reconciliationPlan.dependencyReadiness.length}</span>
        <span><strong>Merge plan</strong>{reconciliationPlan.mergePlanItems.length}</span>
        <span><strong>Versions</strong>{reconciliationPlan.versionReconciliations.length}</span>
        <span><strong>Final render</strong>{reconciliationPlan.finalRenderReadiness.ready ? 'ready' : 'blocked'}</span>
        <span><strong>Preview</strong>{reconciliationPlan.previewRenderReadiness.ready ? 'ready' : 'waiting'}</span>
      </div>

      <div className="render-readiness-summary">
        <strong>Render readiness</strong>
        <span className={reconciliationPlan.finalRenderReadiness.ready ? 'placeholder-preview-badge' : 'final-render-blocked-badge'}>
          Final: {reconciliationPlan.finalRenderReadiness.reason}
        </span>
        <span className="placeholder-preview-badge">
          Preview: {reconciliationPlan.previewRenderReadiness.reason}
        </span>
        <small>Missing required assets: {reconciliationPlan.finalRenderReadiness.missingRequiredAssetIds.join(', ') || 'none'}</small>
        <small>Placeholder assets: {reconciliationPlan.previewRenderReadiness.placeholderAssetIds.join(', ') || 'none'}</small>
        <small>QA pending: {reconciliationPlan.finalRenderReadiness.qaPendingAssetIds.join(', ') || 'none'}</small>
      </div>

      <div>
        <h4>Checkbacks</h4>
        <div className="checkback-item-list">
          {reconciliationPlan.checkbackItems.slice(0, 8).map((item) => (
            <CheckbackItemCard item={item} key={item.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Dependency readiness</h4>
        <div className="dependency-readiness-list">
          {reconciliationPlan.dependencyReadiness.slice(0, 8).map((item) => (
            <DependencyReadinessCard item={item} key={item.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Merge plan</h4>
        <div className="asset-merge-plan-list">
          {reconciliationPlan.mergePlanItems.slice(0, 8).map((item) => (
            <MergePlanItemCard item={item} key={item.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Version reconciliation</h4>
        <div className="asset-version-reconciliation-list">
          {reconciliationPlan.versionReconciliations.slice(0, 8).map((item) => (
            <VersionCard item={item} key={item.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Checkpoints</h4>
        <div className="execution-checkpoint-list">
          {reconciliationPlan.checkpoints.map((checkpoint) => (
            <article className="execution-checkpoint-item" key={checkpoint.id}>
              <strong>{checkpoint.label}</strong>
              <span>Ready: {checkpoint.readyToMergeAssetIds.join(', ') || 'none'}</span>
              <small>Waiting work: {checkpoint.waitingWorkItemIds.slice(0, 6).join(', ') || 'none'}</small>
              <small>Next checkbacks: {checkpoint.nextCheckbackIds.slice(0, 6).join(', ') || 'none'}</small>
              <small>{checkpoint.nextActions.join(' ')}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="no-real-checkback-note">
        <strong>Limitations</strong>
        {reconciliationPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
