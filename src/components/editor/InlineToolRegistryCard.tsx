import { Badge } from '../Badge'
import { getLaunchCoreTools, getPreset, getToolProfile, getToolRegistrySummary } from '../../lib/tool-registry'
import type { ChatPlanningCardDescriptor, EditPlan, OpenSourceToolId } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolRegistryCardProps = {
  plan?: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const keyLaunchToolIds: OpenSourceToolId[] = [
  'remotion',
  'ffmpeg',
  'sharp',
  'maplibre',
  'turf',
  'd3',
  'echarts',
  'playwright',
  'opencv',
  'essentia',
]

const keyPresetIds = [
  'money_flow_diagram',
  'map_route_reveal',
  'browser_dashboard_capture',
  'premium_lower_panel',
  'clean_natural_color_pass',
  'voice_cleanup_basic',
]

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function tierText(tier: { basic: boolean; pro: boolean; premium: boolean }) {
  return [
    tier.basic ? 'Basic' : undefined,
    tier.pro ? 'Pro' : undefined,
    tier.premium ? 'Premium' : undefined,
  ].filter(Boolean).join(' / ')
}

export function InlineToolRegistryCard({ descriptor, plan }: InlineToolRegistryCardProps) {
  const summary = plan?.toolRegistrySummary ?? getToolRegistrySummary()
  const launchTools = keyLaunchToolIds
    .flatMap((toolId) => {
      const tool = getToolProfile(toolId)
      return tool ? [tool] : []
    })
  const presets = keyPresetIds
    .flatMap((presetId) => {
      const preset = getPreset(presetId)
      return preset ? [preset] : []
    })
  const launchCoreCount = getLaunchCoreTools().length

  return (
    <InlinePlanCardShell
      className="tool-registry-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{summary.launchCoreToolCount} launch core</span>
          <span className="compact-summary-chip">{summary.plannedToolCount + summary.futureToolCount} planned/future</span>
          <span className="compact-summary-chip">{summary.needsLicenseReviewCount} license review</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Tool intelligence"
      helper="ReeditPro can use controlled open-source tools for maps, charts, browser captures, color, audio, and QA instead of relying on generative AI for everything. This is a planning registry only; no tools run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Tool registry"
    >
      <div className="tool-registry-summary-grid">
        <span><strong>{summary.launchCoreToolCount}</strong>Launch-core tools</span>
        <span><strong>{summary.plannedToolCount}</strong>Planned tools</span>
        <span><strong>{summary.futureToolCount}</strong>Future/evaluate tools</span>
        <span><strong>{summary.needsLicenseReviewCount}</strong>License review</span>
      </div>

      <div className="tool-category-list">
        {summary.categories.map((category) => (
          <span key={category}>{label(category)}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        <span className="not-installed-badge">No packages installed</span>
        <span className="not-installed-badge">No tool execution</span>
        <span className="not-installed-badge">No backend worker yet</span>
        <span className="not-installed-badge">Provider models separate</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Key launch tools ({launchCoreCount})</summary>
        <div className="tool-profile-list">
          {launchTools.map((tool) => (
            <article className="tool-profile-item" key={tool.id}>
              <div>
                <span className="section-eyebrow">{label(tool.category)}</span>
                <h4>{tool.label}</h4>
                <p>{tool.description}</p>
              </div>
              <div className="tool-profile-meta">
                <span><strong>Execution</strong><em className="tool-execution-badge">{label(tool.executionMode)}</em></span>
                <span><strong>Adoption</strong><em className="tool-adoption-badge">{label(tool.adoptionStage)}</em></span>
                <span><strong>Tier</strong><em className="tool-tier-row">{tierText(tool.tierAvailability)}</em></span>
                <span><strong>Best for</strong>{tool.bestFor.slice(0, 3).join(', ')}</span>
              </div>
              <div className="understanding-chip-row">
                <span className="not-installed-badge">not installed yet</span>
                {tool.licenseNotes.slice(0, 1).map((note) => (
                  <span className="license-review-note" key={note}>{note}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Common ReeditPro presets</summary>
        <div className="tool-preset-list">
          {presets.map((preset) => (
            <article className="tool-preset-item" key={preset.id}>
              <div>
                <strong>{label(preset.id)}</strong>
                <p>{preset.description}</p>
              </div>
              <div className="understanding-chip-row">
                {preset.toolIds.map((toolId) => (
                  <Badge accent="cyan" key={toolId}>{label(toolId)}</Badge>
                ))}
                <Badge accent={preset.tierFit.basic ? 'success' : 'violet'}>
                  {tierText(preset.tierFit)}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Registry boundaries</summary>
        <div className="layout-mode-meta">
          {summary.notes.map((note) => (
            <span key={note}><strong>Rule</strong>{note}</span>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
