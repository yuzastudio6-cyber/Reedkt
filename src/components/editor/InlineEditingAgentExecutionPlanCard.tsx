import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan } from '../../types/reeditpro'
import type {
  EditAssetManifestItem,
  EditWorkDependency,
  EditWorkExpectedOutput,
  EditWorkItem,
} from '../../types/editing-agent-runtime'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineEditingAgentExecutionPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function dependencySummary(dependencies: EditWorkDependency[]) {
  if (!dependencies.length) {
    return 'No dependencies'
  }

  return dependencies.map((dependency) => `${label(dependency.dependencyType)}${dependency.blocking ? ' blocks' : ' optional'}`).join(', ')
}

function outputSummary(outputs: EditWorkExpectedOutput[]) {
  if (!outputs.length) {
    return 'No outputs'
  }

  return outputs.map((output) => label(output.outputType)).join(', ')
}

function WorkItemCard({ item }: { item: EditWorkItem }) {
  return (
    <article className="edit-work-item">
      <div className="compact-summary-row">
        <strong>{item.label}</strong>
        <span className="work-item-status-badge">{label(item.status)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Type</strong>{label(item.workItemType)}</span>
        <span><strong>Layer</strong>{label(item.agentLayer)}</span>
        <span><strong>Priority</strong>{item.priority}</span>
        <span><strong>Parallel</strong>{item.canRunInParallel ? 'yes' : 'no'}</span>
        <span><strong>Retries</strong>{item.retryCount}/{item.maxRetries}</span>
        <span><strong>Idempotency</strong>{item.idempotencyKey}</span>
      </div>
      <p>{item.purpose}</p>
      <div className="edit-dependency-list">
        {item.dependencies.slice(0, 5).map((dependency) => (
          <span key={dependency.id}>
            <strong>{label(dependency.dependencyType)}</strong>
            {dependency.reason}
          </span>
        ))}
        {!item.dependencies.length && <span>No blocking dependencies.</span>}
      </div>
      <div className="edit-expected-output-list">
        {item.expectedOutputs.slice(0, 4).map((output) => (
          <span key={output.id}>
            <strong>{label(output.outputType)}</strong>
            {output.linkedAssetManifestId ?? output.linkedRendererLayerId ?? output.linkedTimingCueId ?? 'planned output'}
          </span>
        ))}
      </div>
      <small>Dependencies: {dependencySummary(item.dependencies)}</small>
      <small>Outputs: {outputSummary(item.expectedOutputs)}</small>
      <small>Fallback: {item.fallbackPolicy.slice(0, 2).join(' ')}</small>
      <small>Checkback: {item.checkbackPolicy.slice(0, 2).join(' ')}</small>
    </article>
  )
}

function AssetManifestCard({ asset }: { asset: EditAssetManifestItem }) {
  return (
    <article className="asset-manifest-item">
      <div className="compact-summary-row">
        <strong>{asset.label}</strong>
        <span className="asset-lifecycle-badge">{label(asset.lifecycleStatus)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Type</strong>{label(asset.assetType)}</span>
        <span><strong>Storage</strong>{label(asset.storageProvider)}</span>
        <span><strong>Path</strong>{asset.storagePath ?? 'pending'}</span>
        <span><strong>Parent</strong>{asset.parentWorkItemId ?? 'none'}</span>
        <span><strong>QA</strong>{label(asset.qaStatus)}</span>
        <span><strong>Version</strong>{asset.version}</span>
      </div>
      {asset.providerModel && <span className="agent-layer-badge">{label(asset.providerModel)}</span>}
      {asset.toolId && <span className="agent-layer-badge">{label(asset.toolId)}</span>}
      <small>Segments: {asset.linkedSegmentIds.join(', ') || 'none'}</small>
      <small>Timing: {asset.linkedTimingCueIds.join(', ') || 'none'}</small>
      <small>Layers: {asset.linkedRendererLayerIds.join(', ') || 'none'}</small>
    </article>
  )
}

export function InlineEditingAgentExecutionPlanCard({ descriptor, plan }: InlineEditingAgentExecutionPlanCardProps) {
  const executionPlan = plan.editingAgentExecutionPlan

  if (!executionPlan) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="editing-agent-execution-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{label(executionPlan.runMode)}</span>
          <span className="compact-summary-chip">{executionPlan.workItems.length} work items</span>
          <span className="compact-summary-chip">{executionPlan.assetManifest.length} manifest items</span>
          <span className="compact-summary-chip">{executionPlan.parallelGroups.length} parallel groups</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Execution planning"
      helper="ReeditPro uses an async work graph so independent editing tasks can continue while image, video, tool, or render jobs are pending. This is planning only; no workers run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Editing agent execution"
    >
      <div className="renderer-badge-row">
        <Badge accent="cyan">Async graph</Badge>
        <Badge accent="blue">Continue while waiting</Badge>
        <Badge accent="violet">Asset manifest</Badge>
        <Badge accent="cyan">Dependency tracked</Badge>
        <Badge accent="blue">Checkback policy</Badge>
        <Badge accent="muted">No real execution</Badge>
        <Badge accent="warning">Approved snapshot required</Badge>
        <Badge accent="success">Final render waits for QA</Badge>
      </div>

      <div className="agent-execution-summary-grid">
        <span><strong>Run mode</strong>{label(executionPlan.runMode)}</span>
        <span><strong>Work items</strong>{executionPlan.workItems.length}</span>
        <span><strong>Assets</strong>{executionPlan.assetManifest.length}</span>
        <span><strong>Parallel groups</strong>{executionPlan.parallelGroups.length}</span>
        <span><strong>Blocking</strong>{executionPlan.blockingWorkItemIds.length}</span>
        <span><strong>Ready</strong>{executionPlan.readyWorkItemIds.length}</span>
        <span><strong>Waiting</strong>{executionPlan.waitingWorkItemIds.length}</span>
        <span><strong>QA</strong>{executionPlan.qaWorkItemIds.length}</span>
        <span><strong>Planning model</strong>{executionPlan.planningModelLabel}</span>
        <span><strong>Supervisor</strong>{executionPlan.editingSupervisorModelLabel}</span>
      </div>

      <div className="async-graph-note">
        <strong>Execution rule</strong>
        <span>{executionPlan.summary}</span>
      </div>

      <div>
        <h4>Work graph</h4>
        <div className="edit-work-graph-list">
          {executionPlan.workItems.slice(0, 10).map((item) => (
            <WorkItemCard item={item} key={item.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Asset manifest</h4>
        <div className="asset-manifest-list">
          {executionPlan.assetManifest.slice(0, 10).map((asset) => (
            <AssetManifestCard asset={asset} key={asset.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Parallel groups</h4>
        <div className="parallel-group-list">
          {executionPlan.parallelGroups.map((group) => (
            <article className="parallel-group-item" key={group.id}>
              <strong>{group.label}</strong>
              <span>{group.workItemIds.join(', ')}</span>
              <small>{group.reason}</small>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Checkpoints</h4>
        <div className="execution-checkpoint-list">
          {executionPlan.checkpoints.map((checkpoint) => (
            <article className="execution-checkpoint-item" key={checkpoint.id}>
              <strong>{checkpoint.label}</strong>
              <span>{checkpoint.currentFocus}</span>
              <small>Pending: {checkpoint.pendingWorkItemIds.slice(0, 6).join(', ') || 'none'}</small>
              <small>Blocked: {checkpoint.blockedWorkItemIds.slice(0, 6).join(', ') || 'none'}</small>
              <small>Next: {checkpoint.nextActions.join(' ')}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="approved-snapshot-required-note">
        <strong>Global rules</strong>
        {executionPlan.globalRules.map((rule) => (
          <span key={rule}>{rule}</span>
        ))}
      </div>

      <div className="no-real-execution-note">
        <strong>Limitations</strong>
        {executionPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
