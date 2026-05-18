import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  ToolChainId,
  ToolStrategyPlanItem,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolStrategyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const chainLabels: Record<ToolChainId, string> = {
  ai_animation_asset_chain: 'AI asset chain',
  audio_pipeline_chain: 'Audio pipeline',
  browser_capture_chain: 'Browser capture',
  chart_diagram_chain: 'Chart/diagram',
  color_pipeline_chain: 'Color pipeline',
  custom: 'Custom',
  map_route_chain: 'Map route',
  premium_rescue_chain: 'Premium rescue',
  remotion_layout_chain: 'Remotion layout',
  visual_qa_chain: 'Visual QA',
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function chainBadge(item: ToolStrategyPlanItem) {
  return chainLabels[item.chainId] ?? label(item.chainId)
}

function settingValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

export function InlineToolStrategyCard({ descriptor, plan }: InlineToolStrategyCardProps) {
  const toolStrategyPlan = plan.toolStrategyPlan

  if (!toolStrategyPlan) {
    return null
  }

  const visibleItems = toolStrategyPlan.items.slice(0, 6)
  const hiddenCount = Math.max(0, toolStrategyPlan.items.length - visibleItems.length)

  return (
    <InlinePlanCardShell
      className="tool-strategy-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{toolStrategyPlan.items.length} items</span>
          <span className="compact-summary-chip">{toolStrategyPlan.chainIdsUsed.length} chains</span>
          <span className="compact-summary-chip">{toolStrategyPlan.toolIdsUsed.length} tools</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Controlled tool planning"
      helper="ReeditPro chooses controlled tools for maps, charts, browser captures, color, audio, and QA when they are better than AI generation. This is planning only; no tools run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Tool strategy"
    >
      <div className="tool-strategy-summary-grid">
        <span><strong>{toolStrategyPlan.items.length}</strong>tool strategy items</span>
        <span><strong>{toolStrategyPlan.chainIdsUsed.length}</strong>chains used</span>
        <span><strong>{toolStrategyPlan.toolIdsUsed.length}</strong>tools used</span>
        <span><strong>{toolStrategyPlan.presetsUsed.length}</strong>presets</span>
        <span><strong>{toolStrategyPlan.launchCoreToolsUsed.length}</strong>launch-core tools</span>
        <span><strong>{toolStrategyPlan.futureToolsReferenced.length}</strong>future/planned tools</span>
        <span><strong>{toolStrategyPlan.toolsNeedingLicenseReview.length}</strong>license review</span>
        <span><strong>{toolStrategyPlan.aiGenerationAvoidedReasons.length}</strong>AI-video avoids</span>
      </div>

      <div className="understanding-chip-row">
        {toolStrategyPlan.chainIdsUsed.map((chainId) => (
          <span className="tool-chain-badge" key={chainId}>{chainLabels[chainId]}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        {toolStrategyPlan.toolIdsUsed.map((toolId) => (
          <span className="tool-primary-badge" key={toolId}>{label(toolId)}</span>
        ))}
        <span className="tool-planning-only-note">No package install</span>
        <span className="tool-planning-only-note">No tool execution</span>
        <span className="tool-planning-only-note">Approval required</span>
      </div>

      {toolStrategyPlan.aiGenerationAvoidedReasons.length > 0 && (
        <div className="why-not-ai-video-note">
          {toolStrategyPlan.aiGenerationAvoidedReasons.slice(0, 3).join(' ')}
        </div>
      )}

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Tool strategy items</summary>
        <div className="tool-chain-list">
          {visibleItems.map((item) => (
            <article className="tool-chain-item" key={item.id}>
              <div>
                <span className="section-eyebrow">{label(item.purpose)} / {label(item.creditImpact)}</span>
                <h4>{item.label}</h4>
                <p>{item.userFacingSummary}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="tool-chain-badge">{chainBadge(item)}</span>
                <span className="tool-primary-badge">Primary: {label(item.primaryToolId)}</span>
                <span className="tool-status-badge">{label(item.status)}</span>
                <Badge accent={item.status === 'needs_license_review' ? 'warning' : 'cyan'}>{label(item.adoptionStage)}</Badge>
              </div>
              <div className="tool-chain-meta">
                <span><strong>Selected</strong>{item.selectedToolIds.map(label).join(', ')}</span>
                <span><strong>Fallback</strong>{item.fallbackToolIds.map(label).join(', ') || 'none'}</span>
                <span><strong>Inputs</strong>{item.expectedInputs.map(label).join(', ')}</span>
                <span><strong>Outputs</strong>{item.expectedOutputs.map(label).join(', ')}</span>
                <span><strong>Settings</strong>{item.settingsSummary}</span>
              </div>
              <p>{item.reason}</p>
              {item.whyNotAiVideo && <p className="why-not-ai-video-note">{item.whyNotAiVideo}</p>}
              {item.whyNotRemotionOnly && <p className="why-not-remotion-only-note">{item.whyNotRemotionOnly}</p>}

              <details className="tool-step-list">
                <summary>Steps and settings</summary>
                {item.steps.map((step) => (
                  <div className="tool-step-item" key={step.id}>
                    <div className="understanding-chip-row">
                      <span className="tool-primary-badge">{step.order}. {label(step.toolId)}</span>
                      <span className="tool-status-badge">{label(step.executionMode)}</span>
                      <span className="tool-status-badge">{label(step.status)}</span>
                    </div>
                    <p>{step.reason}</p>
                    <div className="tool-setting-list">
                      {step.settings.slice(0, 8).map((setting) => (
                        <span className="tool-setting-item" key={`${step.id}-${setting.settingId}`}>
                          <strong>{setting.settingId}</strong>{settingValue(setting.value)}
                        </span>
                      ))}
                    </div>
                    <ul>
                      {step.workerNotes.slice(0, 3).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>

              <ul>
                {item.qaChecks.slice(0, 4).map((qaCheck) => (
                  <li key={qaCheck}>{qaCheck}</li>
                ))}
              </ul>
              {item.licenseNotes.length > 0 && (
                <p className="license-review-note">{item.licenseNotes.join(' ')}</p>
              )}
            </article>
          ))}
        </div>
        {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional tool strateg{hiddenCount === 1 ? 'y' : 'ies'} summarized in the plan.</p>}
      </details>

      <details className="understanding-section">
        <summary>Global tool rules</summary>
        <div className="layout-mode-meta">
          <span><strong>Summary</strong>{toolStrategyPlan.summary}</span>
          <span><strong>Rules</strong>{toolStrategyPlan.globalRules.join(' ')}</span>
          <span><strong>QA</strong>{toolStrategyPlan.qaChecks.join(' ')}</span>
          <span><strong>Notes</strong>{toolStrategyPlan.notes.join(' ')}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
