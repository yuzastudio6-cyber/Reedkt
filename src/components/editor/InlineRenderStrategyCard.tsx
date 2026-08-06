import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  RenderStrategyPlanItem,
  RenderStrategyType,
} from '../../types/reeditpro'
import { hideInternalToolNamesInCopy, userFacingActivityLabel } from '../../lib/tool-display-labels'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineRenderStrategyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const strategyLabels: Record<RenderStrategyType, string> = {
  ai_video_then_remotion: 'AI video asset then composition',
  gpt_image_then_remotion: 'AI image asset then composition',
  hybrid_generation_then_remotion: 'Hybrid',
  none: 'None',
  open_source_tool_then_remotion: 'Controlled activity then composition',
  qa_tool_only: 'QA only',
  remotion_only: 'Composition only',
  remotion_then_worker_postprocess: 'Composition then processing polish',
  worker_preprocess_then_remotion: 'Private prep then composition',
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

function strategyBadge(item: RenderStrategyPlanItem) {
  if (item.strategyType === 'remotion_only') return 'Composition only'
  if (item.strategyType === 'gpt_image_then_remotion') return 'AI image asset then composition'
  if (item.strategyType === 'open_source_tool_then_remotion') return 'Controlled activity then composition'
  if (item.strategyType === 'ai_video_then_remotion') return 'AI video asset then composition'
  if (item.strategyType === 'hybrid_generation_then_remotion') return 'Hybrid'
  if (item.strategyType === 'worker_preprocess_then_remotion') return 'Private prep then composition'
  if (item.strategyType === 'remotion_then_worker_postprocess') return 'Composition then processing polish'
  if (item.strategyType === 'qa_tool_only') return 'QA only'
  return 'No render'
}

function tierText(tier: RenderStrategyPlanItem['tierAllowed']) {
  return [
    tier.basic ? 'Basic safe' : undefined,
    tier.pro ? 'Pro' : undefined,
    tier.premium ? 'Premium' : undefined,
  ].filter(Boolean).join(' / ')
}

export function InlineRenderStrategyCard({ descriptor, plan }: InlineRenderStrategyCardProps) {
  const renderStrategyPlan = plan.renderStrategyPlan

  if (!renderStrategyPlan) {
    return null
  }

  const visibleItems = renderStrategyPlan.items.slice(0, 6)
  const hiddenCount = Math.max(0, renderStrategyPlan.items.length - visibleItems.length)
  const strategyCounts = Object.entries(renderStrategyPlan.strategyCounts).filter(([, count]) => count > 0)

  return (
    <InlinePlanCardShell
      className="render-strategy-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{renderStrategyPlan.items.length} items</span>
          <span className="compact-summary-chip">{renderStrategyPlan.remotionCapabilitiesUsed.length} composition capabilities</span>
          <span className="compact-summary-chip">{renderStrategyPlan.openSourceToolsUsed.length} readiness checks</span>
          <span className="compact-summary-chip">execution gated</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Review assembly"
      helper="ReeditPro decides whether composition can build a visual directly, whether AI-generated assets are needed, whether controlled preparation should handle maps/charts/screenshots, or whether AI video is actually useful."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Composition strategy"
    >
      <div className="render-strategy-summary-grid">
        {strategyCounts.map(([strategyType, count]) => (
          <span key={strategyType}><strong>{count}</strong>{strategyLabels[strategyType as RenderStrategyType]}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        {renderStrategyPlan.remotionCapabilitiesUsed.slice(0, 8).map((capability) => (
          <span className="remotion-capability-list" key={capability}>{label(capability)}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        {renderStrategyPlan.openSourceToolsUsed.map((toolId) => (
          <span className="tool-id-list" key={toolId}>{userFacingActivityLabel(toolId)}</span>
        ))}
        {renderStrategyPlan.providerModelsReferenced.map((model) => (
          <span className="provider-model-list" key={model}>{model.includes('image') ? 'image generation route' : 'AI asset route'}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        <span className="render-no-execution-note">Readiness gate pending</span>
        <span className="render-no-execution-note">Browser execution blocked</span>
        <span className="render-no-execution-note">Rendering gated</span>
        <span className="render-no-execution-note">Approval still required</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Composition strategy items</summary>
        <div className="render-strategy-list">
          {visibleItems.map((item) => (
            <article className="render-strategy-item" key={item.id}>
              <div>
                <span className="section-eyebrow">{label(item.complexity)} / {label(item.creditImpact)}</span>
                <h4>{item.label}</h4>
                <p>{hideInternalToolNamesInCopy(item.purpose)}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="strategy-type-badge">{strategyBadge(item)}</span>
                <span className="render-no-execution-note">Execution gated</span>
                <Badge accent={item.tierAllowed.basic ? 'success' : 'violet'}>{tierText(item.tierAllowed)}</Badge>
              </div>
              <div className="render-strategy-meta">
                <span><strong>AI image asset</strong>{yesNo(item.needsGptImage)}</span>
                <span><strong>AI video</strong>{yesNo(item.needsAiVideo)}</span>
                <span><strong>Controlled activity</strong>{yesNo(item.needsOpenSourceTool)}</span>
                <span><strong>Private prep</strong>{yesNo(item.needsWorkerPreprocess)}</span>
                <span><strong>Private polish</strong>{yesNo(item.needsWorkerPostprocess)}</span>
                <span><strong>Final composition</strong>{yesNo(item.remotionOwnsFinalComposition)}</span>
              </div>
              <div className="understanding-chip-row">
                {item.selectedRemotionCapabilities.slice(0, 6).map((capability) => (
                  <span className="remotion-capability-list" key={capability}>{hideInternalToolNamesInCopy(label(capability))}</span>
                ))}
                {item.selectedOpenSourceTools.map((toolId) => (
                  <span className="tool-id-list" key={toolId}>{userFacingActivityLabel(toolId)}</span>
                ))}
                {item.selectedProviderModels.map((model) => (
                  <span className="provider-model-list" key={model}>{model.includes('image') ? 'image generation route' : 'AI asset route'}</span>
                ))}
              </div>
              <p>{hideInternalToolNamesInCopy(item.reason)}</p>
              {item.fallbackStrategyType && (
                <p className="render-fallback-note">
                  Fallback: {label(item.fallbackStrategyType)}. {hideInternalToolNamesInCopy(item.fallbackReason ?? '')}
                </p>
              )}
              <ul>
                {item.qaChecks.slice(0, 4).map((qaCheck) => (
                  <li key={qaCheck}>{hideInternalToolNamesInCopy(qaCheck)}</li>
                ))}
              </ul>
              <ul>
                {item.workerNotes.slice(0, 3).map((workerNote) => (
                  <li className="render-worker-note" key={workerNote}>{hideInternalToolNamesInCopy(workerNote)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional render strateg{hiddenCount === 1 ? 'y' : 'ies'} summarized in the plan.</p>}
      </details>

      <details className="understanding-section">
        <summary>Global composition rules</summary>
        <div className="layout-mode-meta">
          <span><strong>Summary</strong>{hideInternalToolNamesInCopy(renderStrategyPlan.summary)}</span>
          <span><strong>Rules</strong>{hideInternalToolNamesInCopy(renderStrategyPlan.globalRules.join(' '))}</span>
          <span><strong>QA</strong>{hideInternalToolNamesInCopy(renderStrategyPlan.qaChecks.join(' '))}</span>
          <span><strong>Notes</strong>{hideInternalToolNamesInCopy(renderStrategyPlan.notes.join(' '))}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
