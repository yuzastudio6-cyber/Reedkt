import { Badge } from '../Badge'
import { getLaunchCoreTools, getPreset, getToolProfile, getToolRegistrySummary } from '../../lib/tool-registry'
import { hideInternalToolNamesInCopy, userFacingActivityLabel, userFacingActivityList } from '../../lib/tool-display-labels'
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
  'audioflux',
  'signalsmith_stretch',
  'maplibre',
  'turf',
  'd3',
  'echarts',
  'playwright',
  'opencv',
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

function statusText(value: string) {
  return label(value)
    .replace(/\btool\b/gi, 'activity')
    .replace(/\bworker\b/gi, 'private processing')
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
          <span className="compact-summary-chip">{summary.launchCoreToolCount} launch checks</span>
          <span className="compact-summary-chip">{summary.plannedToolCount + summary.futureToolCount} roadmap checks</span>
          <span className="compact-summary-chip">{summary.needsLicenseReviewCount} license review</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Editing activity planning"
      helper="ReeditPro can prepare controlled editing activities for maps, data visuals, browser captures, color, audio, and QA instead of relying on generative AI for everything. This is readiness planning only; no heavy work starts from this page."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Editing capability readiness"
    >
      <div className="tool-registry-summary-grid">
        <span><strong>{summary.launchCoreToolCount}</strong>Launch checks</span>
        <span><strong>{summary.plannedToolCount}</strong>Planned checks</span>
        <span><strong>{summary.futureToolCount}</strong>Future checks</span>
        <span><strong>{summary.needsLicenseReviewCount}</strong>License review</span>
      </div>

      <div className="tool-category-list">
        {summary.categories.map((category) => (
          <span key={category}>{label(category)}</span>
        ))}
      </div>

      <div className="understanding-chip-row">
        <span className="not-installed-badge">Package checks pending</span>
        <span className="not-installed-badge">No page-side processing</span>
        <span className="not-installed-badge">Approval gate pending</span>
        <span className="not-installed-badge">AI asset services separate</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Primary editing activities ({launchCoreCount})</summary>
        <div className="tool-profile-list">
          {launchTools.map((tool) => (
            <article className="tool-profile-item" key={tool.id}>
              <div>
                <span className="section-eyebrow">{label(tool.category)}</span>
                <h4>{userFacingActivityLabel(tool.id)}</h4>
                <p>{hideInternalToolNamesInCopy(tool.description)}</p>
              </div>
              <div className="tool-profile-meta">
                <span><strong>Mode</strong><em className="tool-execution-badge">{statusText(tool.executionMode)}</em></span>
                <span><strong>Readiness</strong><em className="tool-adoption-badge">{statusText(tool.adoptionStage)}</em></span>
                <span><strong>Tier</strong><em className="tool-tier-row">{tierText(tool.tierAvailability)}</em></span>
                <span><strong>Best for</strong>{hideInternalToolNamesInCopy(tool.bestFor.slice(0, 3).join(', '))}</span>
              </div>
              <div className="understanding-chip-row">
                <span className="not-installed-badge">package check pending</span>
                {tool.licenseNotes.slice(0, 1).map((note) => (
                  <span className="license-review-note" key={note}>{hideInternalToolNamesInCopy(note)}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Common edit recipes</summary>
        <div className="tool-preset-list">
          {presets.map((preset) => (
            <article className="tool-preset-item" key={preset.id}>
              <div>
                <strong>{label(preset.id)}</strong>
                <p>{hideInternalToolNamesInCopy(preset.description)}</p>
              </div>
              <div className="understanding-chip-row">
                <Badge accent="cyan">{userFacingActivityList(preset.toolIds)}</Badge>
                <Badge accent={preset.tierFit.basic ? 'success' : 'violet'}>
                  {tierText(preset.tierFit)}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Activity boundaries</summary>
        <div className="layout-mode-meta">
          {summary.notes.map((note) => (
            <span key={note}><strong>Rule</strong>{hideInternalToolNamesInCopy(note)}</span>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
