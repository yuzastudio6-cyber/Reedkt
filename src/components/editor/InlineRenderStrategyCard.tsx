import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  RenderStrategyPlanItem,
  RenderStrategyType,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineRenderStrategyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const strategyLabels: Record<RenderStrategyType, string> = {
  ai_video_then_remotion: 'AI video then Remotion',
  gpt_image_then_remotion: 'GPT-Image then Remotion',
  hybrid_generation_then_remotion: 'Hybrid',
  none: 'None',
  open_source_tool_then_remotion: 'Tool then Remotion',
  qa_tool_only: 'QA only',
  remotion_only: 'Remotion only',
  remotion_then_worker_postprocess: 'Worker postprocess',
  worker_preprocess_then_remotion: 'Worker preprocess',
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

function strategyBadge(item: RenderStrategyPlanItem) {
  if (item.strategyType === 'remotion_only') return 'Remotion only'
  if (item.strategyType === 'gpt_image_then_remotion') return 'GPT-Image then Remotion'
  if (item.strategyType === 'open_source_tool_then_remotion') return 'Tool then Remotion'
  if (item.strategyType === 'ai_video_then_remotion') return 'AI video then Remotion'
  if (item.strategyType === 'hybrid_generation_then_remotion') return 'Hybrid'
  if (item.strategyType === 'worker_preprocess_then_remotion') return 'Worker preprocess'
  if (item.strategyType === 'remotion_then_worker_postprocess') return 'Worker postprocess'
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
          <span className="compact-summary-chip">{renderStrategyPlan.remotionCapabilitiesUsed.length} Remotion caps</span>
          <span className="compact-summary-chip">{renderStrategyPlan.openSourceToolsUsed.length} tools</span>
          <span className="compact-summary-chip">no real execution</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Render intelligence"
      helper="ReeditPro decides whether Remotion can build a visual directly, whether GPT-Image-2 should create assets, whether open-source tools should generate maps/charts/screenshots, or whether AI video is actually needed."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Render strategy"
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
          <span className="tool-id-list" key={toolId}>{label(toolId)}</span>
        ))}
        {renderStrategyPlan.providerModelsReferenced.map((model) => (
          <span className="provider-model-list" key={model}>{label(model)}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        <span className="render-no-execution-note">No package install</span>
        <span className="render-no-execution-note">No tool execution</span>
        <span className="render-no-execution-note">No real rendering</span>
        <span className="render-no-execution-note">Approval still required</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Render strategy items</summary>
        <div className="render-strategy-list">
          {visibleItems.map((item) => (
            <article className="render-strategy-item" key={item.id}>
              <div>
                <span className="section-eyebrow">{label(item.complexity)} / {label(item.creditImpact)}</span>
                <h4>{item.label}</h4>
                <p>{item.purpose}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="strategy-type-badge">{strategyBadge(item)}</span>
                <span className="render-no-execution-note">No real execution</span>
                <Badge accent={item.tierAllowed.basic ? 'success' : 'violet'}>{tierText(item.tierAllowed)}</Badge>
              </div>
              <div className="render-strategy-meta">
                <span><strong>GPT-Image</strong>{yesNo(item.needsGptImage)}</span>
                <span><strong>AI video</strong>{yesNo(item.needsAiVideo)}</span>
                <span><strong>Open-source tool</strong>{yesNo(item.needsOpenSourceTool)}</span>
                <span><strong>Worker preprocess</strong>{yesNo(item.needsWorkerPreprocess)}</span>
                <span><strong>Worker postprocess</strong>{yesNo(item.needsWorkerPostprocess)}</span>
                <span><strong>Remotion final</strong>{yesNo(item.remotionOwnsFinalComposition)}</span>
              </div>
              <div className="understanding-chip-row">
                {item.selectedRemotionCapabilities.slice(0, 6).map((capability) => (
                  <span className="remotion-capability-list" key={capability}>{label(capability)}</span>
                ))}
                {item.selectedOpenSourceTools.map((toolId) => (
                  <span className="tool-id-list" key={toolId}>{label(toolId)}</span>
                ))}
                {item.selectedProviderModels.map((model) => (
                  <span className="provider-model-list" key={model}>{label(model)}</span>
                ))}
              </div>
              <p>{item.reason}</p>
              {item.fallbackStrategyType && (
                <p className="render-fallback-note">
                  Fallback: {label(item.fallbackStrategyType)}. {item.fallbackReason}
                </p>
              )}
              <ul>
                {item.qaChecks.slice(0, 4).map((qaCheck) => (
                  <li key={qaCheck}>{qaCheck}</li>
                ))}
              </ul>
              <ul>
                {item.workerNotes.slice(0, 3).map((workerNote) => (
                  <li className="render-worker-note" key={workerNote}>{workerNote}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional render strateg{hiddenCount === 1 ? 'y' : 'ies'} summarized in the plan.</p>}
      </details>

      <details className="understanding-section">
        <summary>Global render rules</summary>
        <div className="layout-mode-meta">
          <span><strong>Summary</strong>{renderStrategyPlan.summary}</span>
          <span><strong>Rules</strong>{renderStrategyPlan.globalRules.join(' ')}</span>
          <span><strong>QA</strong>{renderStrategyPlan.qaChecks.join(' ')}</span>
          <span><strong>Notes</strong>{renderStrategyPlan.notes.join(' ')}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
