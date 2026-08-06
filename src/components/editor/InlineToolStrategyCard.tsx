import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  ToolChainId,
  ToolStrategyPlanItem,
} from '../../types/reeditpro'
import {
  hideInternalToolNamesInCopy,
  userFacingActivityCount,
  userFacingActivityLabel,
  userFacingActivityList,
} from '../../lib/tool-display-labels'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolStrategyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const chainLabels: Partial<Record<ToolChainId, string>> = {
  ai_animation_asset_chain: 'AI asset chain',
  audio_pipeline_chain: 'Audio pipeline',
  browser_capture_chain: 'Browser capture',
  chart_diagram_chain: 'Chart/diagram',
  color_pipeline_chain: 'Color pipeline',
  custom: 'Custom',
  map_route_chain: 'Map route',
  premium_rescue_chain: 'Premium rescue',
  remotion_layout_chain: 'Composition layout',
  visual_qa_chain: 'Visual QA',
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function chainBadge(item: ToolStrategyPlanItem) {
  return chainLabels[item.chainId] ?? label(item.chainId)
}

function settingValue(value: unknown) {
  const scrub = (text: string) => hideInternalToolNamesInCopy(text)

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return scrub(String(value))
  }

  return scrub(JSON.stringify(value))
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
          <span className="compact-summary-chip">{userFacingActivityCount(toolStrategyPlan.items.length)}</span>
          <span className="compact-summary-chip">{toolStrategyPlan.chainIdsUsed.length} activity groups</span>
          <span className="compact-summary-chip">{userFacingActivityCount(toolStrategyPlan.toolIdsUsed.length, 'readiness check', 'readiness checks')}</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Controlled edit planning"
      helper="ReeditPro chooses controlled editing activities for maps, charts, browser captures, color, audio, and QA when they are better than generative AI. This is planning only; no heavy work starts from the browser."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Edit activity strategy"
    >
      <div className="tool-strategy-summary-grid">
        <span><strong>{toolStrategyPlan.items.length}</strong>activity items</span>
        <span><strong>{toolStrategyPlan.chainIdsUsed.length}</strong>activity groups</span>
        <span><strong>{toolStrategyPlan.toolIdsUsed.length}</strong>readiness checks</span>
        <span><strong>{toolStrategyPlan.presetsUsed.length}</strong>presets</span>
        <span><strong>{toolStrategyPlan.launchCoreToolsUsed.length}</strong>launch-ready checks</span>
        <span><strong>{toolStrategyPlan.futureToolsReferenced.length}</strong>future checks</span>
        <span><strong>{toolStrategyPlan.toolsNeedingLicenseReview.length}</strong>license review</span>
        <span><strong>{toolStrategyPlan.aiGenerationAvoidedReasons.length}</strong>AI-video avoids</span>
      </div>

      <div className="understanding-chip-row">
        {toolStrategyPlan.chainIdsUsed.map((chainId) => (
          <span className="tool-chain-badge" key={chainId}>{chainLabels[chainId] ?? label(chainId)}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        {toolStrategyPlan.toolIdsUsed.map((toolId) => (
          <span className="tool-primary-badge" key={toolId}>{userFacingActivityLabel(toolId)}</span>
        ))}
        <span className="tool-planning-only-note">Package gate pending</span>
        <span className="tool-planning-only-note">No browser execution</span>
        <span className="tool-planning-only-note">Approval required</span>
      </div>

      {toolStrategyPlan.aiGenerationAvoidedReasons.length > 0 && (
        <div className="why-not-ai-video-note">
          {toolStrategyPlan.aiGenerationAvoidedReasons.slice(0, 3).join(' ')}
        </div>
      )}

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Edit activity items</summary>
        <div className="tool-chain-list">
          {visibleItems.map((item) => (
            <article className="tool-chain-item" key={item.id}>
              <div>
                <span className="section-eyebrow">{label(item.purpose)} / {label(item.creditImpact)}</span>
                <h4>{item.label}</h4>
                <p>{hideInternalToolNamesInCopy(item.userFacingSummary)}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="tool-chain-badge">{chainBadge(item)}</span>
                <span className="tool-primary-badge">Primary: {userFacingActivityLabel(item.primaryToolId)}</span>
                <span className="tool-status-badge">{label(item.status)}</span>
                <Badge accent={item.status === 'needs_license_review' ? 'warning' : 'cyan'}>{label(item.adoptionStage)}</Badge>
              </div>
              <div className="tool-chain-meta">
                <span><strong>Selected</strong>{userFacingActivityList(item.selectedToolIds)}</span>
                <span><strong>Fallback</strong>{item.fallbackToolIds.length ? userFacingActivityList(item.fallbackToolIds) : 'none'}</span>
                <span><strong>Inputs</strong>{item.expectedInputs.map(label).join(', ')}</span>
                <span><strong>Outputs</strong>{item.expectedOutputs.map(label).join(', ')}</span>
                <span><strong>Settings</strong>{hideInternalToolNamesInCopy(item.settingsSummary)}</span>
              </div>
              <p>{hideInternalToolNamesInCopy(item.reason)}</p>
              {item.whyNotAiVideo && <p className="why-not-ai-video-note">{hideInternalToolNamesInCopy(item.whyNotAiVideo)}</p>}
              {item.whyNotRemotionOnly && <p className="why-not-remotion-only-note">{hideInternalToolNamesInCopy(item.whyNotRemotionOnly)}</p>}

              <details className="tool-step-list">
                <summary>Steps and settings</summary>
                {item.steps.map((step) => (
                  <div className="tool-step-item" key={step.id}>
                    <div className="understanding-chip-row">
                      <span className="tool-primary-badge">{step.order}. {userFacingActivityLabel(step.toolId)}</span>
                      <span className="tool-status-badge">{label(step.executionMode)}</span>
                      <span className="tool-status-badge">{label(step.status)}</span>
                    </div>
                    <p>{hideInternalToolNamesInCopy(step.reason)}</p>
                    <div className="tool-setting-list">
                      {step.settings.slice(0, 8).map((setting) => (
                        <span className="tool-setting-item" key={`${step.id}-${setting.settingId}`}>
                          <strong>{setting.settingId}</strong>{settingValue(setting.value)}
                        </span>
                      ))}
                    </div>
                    <ul>
                      {step.workerNotes.slice(0, 3).map((note) => (
                        <li key={note}>{hideInternalToolNamesInCopy(note)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>

              <ul>
                {item.qaChecks.slice(0, 4).map((qaCheck) => (
                  <li key={qaCheck}>{hideInternalToolNamesInCopy(qaCheck)}</li>
                ))}
              </ul>
              {item.licenseNotes.length > 0 && (
                <p className="license-review-note">{hideInternalToolNamesInCopy(item.licenseNotes.join(' '))}</p>
              )}
            </article>
          ))}
        </div>
        {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional activity strateg{hiddenCount === 1 ? 'y' : 'ies'} summarized in the plan.</p>}
      </details>

      <details className="understanding-section">
        <summary>Global activity rules</summary>
        <div className="layout-mode-meta">
          <span><strong>Summary</strong>{hideInternalToolNamesInCopy(toolStrategyPlan.summary)}</span>
          <span><strong>Rules</strong>{hideInternalToolNamesInCopy(toolStrategyPlan.globalRules.join(' '))}</span>
          <span><strong>QA</strong>{hideInternalToolNamesInCopy(toolStrategyPlan.qaChecks.join(' '))}</span>
          <span><strong>Notes</strong>{hideInternalToolNamesInCopy(toolStrategyPlan.notes.join(' '))}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
