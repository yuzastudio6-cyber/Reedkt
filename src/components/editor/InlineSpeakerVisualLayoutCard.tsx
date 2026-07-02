import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  LayoutComplexity,
  LayoutRiskLevel,
  SpeakerPresenceMode,
  SpeakerVisualLayoutMode,
  VisualDominanceMode,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSpeakerVisualLayoutCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1
    return counts
  }, {} as Record<T, number>)
}

function countSummary<T extends string>(counts: Record<T, number>) {
  return Object.entries(counts)
    .map(([key, count]) => `${label(key)} ${count}`)
    .join(', ')
}

function riskTone(riskLevel: LayoutRiskLevel) {
  if (riskLevel === 'high' || riskLevel === 'premium') {
    return 'layout-risk-badge layout-risk-badge-high'
  }

  if (riskLevel === 'medium') {
    return 'layout-risk-badge layout-risk-badge-medium'
  }

  return 'layout-risk-badge layout-risk-badge-low'
}

function complexityTone(complexity: LayoutComplexity) {
  if (complexity === 'advanced' || complexity === 'premium') {
    return 'layout-complexity-badge layout-complexity-badge-advanced'
  }

  if (complexity === 'moderate') {
    return 'layout-complexity-badge layout-complexity-badge-moderate'
  }

  return 'layout-complexity-badge layout-complexity-badge-simple'
}

function layoutBadges(modes: Set<SpeakerVisualLayoutMode>, speakerModes: Set<SpeakerPresenceMode>, dominanceModes: Set<VisualDominanceMode>, hasFallback: boolean) {
  const badges: { label: string; accent: 'blue' | 'cyan' | 'violet' | 'success' | 'warning' | 'muted' }[] = []

  if (speakerModes.has('full_speaker') || modes.has('full_speaker')) badges.push({ label: 'Full speaker', accent: 'cyan' })
  if (speakerModes.has('voice_only') || modes.has('voiceover_visual_takeover')) badges.push({ label: 'Voiceover visual', accent: 'blue' })
  if (speakerModes.has('picture_in_picture') || modes.has('picture_in_picture_speaker') || modes.has('screen_capture_with_speaker_pip')) badges.push({ label: 'PIP', accent: 'violet' })
  if (modes.has('side_by_side_speaker_visual')) badges.push({ label: 'Side-by-side', accent: 'cyan' })
  if (modes.has('lower_visual_panel')) badges.push({ label: 'Lower panel', accent: 'blue' })
  if (dominanceModes.has('full_takeover')) badges.push({ label: 'Full takeover', accent: 'warning' })
  if (modes.has('full_map_takeover')) badges.push({ label: 'Map', accent: 'cyan' })
  if (modes.has('full_evidence_board')) badges.push({ label: 'Evidence board', accent: 'warning' })
  if (modes.has('screen_capture_with_speaker_pip')) badges.push({ label: 'Screen capture', accent: 'violet' })
  if (modes.has('speaker_cutout_overlay') || modes.has('object_anchored_callout')) badges.push({ label: 'Pro/Premium advanced', accent: 'warning' })
  if (hasFallback) badges.push({ label: 'Fallback planned', accent: 'success' })

  if (!modes.has('speaker_cutout_overlay') && !modes.has('object_anchored_callout')) {
    badges.push({ label: 'Basic safe', accent: 'success' })
  }

  return badges
}

export function InlineSpeakerVisualLayoutCard({ descriptor, plan }: InlineSpeakerVisualLayoutCardProps) {
  const speakerVisualLayoutPlan = plan.speakerVisualLayoutPlan

  if (!speakerVisualLayoutPlan) {
    return null
  }

  const items = speakerVisualLayoutPlan.items
  const modes = new Set(items.map((item) => item.layoutMode))
  const speakerModes = new Set(items.map((item) => item.speakerPresence))
  const dominanceModes = new Set(items.map((item) => item.visualDominance))
  const speakerMix = countBy(items.map((item) => item.speakerPresence))
  const visualMix = countBy(items.map((item) => item.visualDominance))
  const highRiskCount = items.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'premium').length
  const fallbackCount = items.filter((item) => item.fallbackLayoutMode).length
  const visibleItems = items.slice(0, 4)
  const hiddenCount = Math.max(0, items.length - visibleItems.length)
  const badges = layoutBadges(modes, speakerModes, dominanceModes, fallbackCount > 0)

  return (
    <InlinePlanCardShell
      className="speaker-visual-layout-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{items.length} layout items</span>
          <span className="compact-summary-chip">{modes.size} modes</span>
          <span className="compact-summary-chip">{highRiskCount} high-risk</span>
          <span className="compact-summary-chip">{fallbackCount} fallback planned</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Speaker + visual layout"
      helper="ReeditPro decides when the viewer should see the speaker, the visual, or both. This keeps each segment from feeling like the same template."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Speaker + visual layout"
    >
      <div className="qa-badge-row">
        {badges.map((badge) => (
          <Badge accent={badge.accent} key={badge.label}>{badge.label}</Badge>
        ))}
      </div>

      <div className="layout-summary-grid">
        <span><strong>Items</strong>{items.length}</span>
        <span><strong>Modes used</strong>{Array.from(modes).map(label).join(', ')}</span>
        <span><strong>Speaker mix</strong>{countSummary(speakerMix)}</span>
        <span><strong>Visual mix</strong>{countSummary(visualMix)}</span>
        <span><strong>Risk</strong>{highRiskCount} high-risk layout{highRiskCount === 1 ? '' : 's'}</span>
        <span><strong>Fallbacks</strong>{fallbackCount} planned fallback{fallbackCount === 1 ? '' : 's'}</span>
      </div>

      <p className="inline-helper">{speakerVisualLayoutPlan.summary}</p>

      <div className="layout-mode-list">
        {visibleItems.map((item) => (
          <article className="layout-mode-item" key={item.id}>
            <div className="visual-asset-header">
              <div>
                <span className="section-eyebrow">{item.platformFit} / {item.recommendedForAspectRatio}</span>
                <h4>{label(item.layoutMode)}</h4>
                <p>{item.reason}</p>
              </div>
              <div className="visual-asset-badges">
                <span className="speaker-presence-chip">{label(item.speakerPresence)}</span>
                <span className="visual-dominance-chip">{label(item.visualDominance)}</span>
                <span className={complexityTone(item.complexity)}>{label(item.complexity)}</span>
                <span className={riskTone(item.riskLevel)}>{label(item.riskLevel)}</span>
              </div>
            </div>

            <div className="layout-mode-meta">
              <span><strong>Frame</strong>{label(item.frameTemplateType)}</span>
              <span><strong>Tools</strong>{item.preferredTools.join(', ')}</span>
              <span><strong>Aspect/platform</strong>{item.recommendedForAspectRatio} / {item.platformFit}</span>
            </div>

            {item.fallbackLayoutMode && (
              <p className="layout-fallback-note">Fallback layout: {label(item.fallbackLayoutMode)}</p>
            )}

            <div className="layout-prompt-implication-list">
              <strong>Prompt implications</strong>
              {item.promptImplications.slice(0, 4).map((implication) => (
                <span key={implication}>{implication}</span>
              ))}
            </div>

            <div className="qa-check-list">
              <strong>QA checks</strong>
              {item.qaChecks.slice(0, 5).map((qaCheck) => (
                <span key={qaCheck}>{qaCheck}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional segment layout decision{hiddenCount === 1 ? '' : 's'} summarized in the approved layout plan.</p>}
    </InlinePlanCardShell>
  )
}
