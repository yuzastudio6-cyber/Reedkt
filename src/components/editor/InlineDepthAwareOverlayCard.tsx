import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  DepthCompositingMode,
  EditPlan,
  MaskRiskLevel,
  MaskStrategy,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineDepthAwareOverlayCardProps = {
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

function riskTone(riskLevel: MaskRiskLevel) {
  if (riskLevel === 'high' || riskLevel === 'premium') {
    return 'mask-risk-badge mask-risk-badge-high'
  }

  if (riskLevel === 'medium') {
    return 'mask-risk-badge mask-risk-badge-medium'
  }

  return 'mask-risk-badge mask-risk-badge-low'
}

function depthBadges(modes: Set<DepthCompositingMode>, strategies: Set<MaskStrategy>, hasContactObject: boolean, hasFallback: boolean, basicSafe: boolean) {
  const badges: { label: string; accent: 'blue' | 'cyan' | 'violet' | 'success' | 'warning' | 'muted' }[] = []

  if (modes.has('graphic_behind_subject')) badges.push({ label: 'Graphic behind subject', accent: 'cyan' })
  if (modes.has('graphic_behind_subject_and_contact_objects') || strategies.has('subject_plus_contact_object_mask')) badges.push({ label: 'Subject + contact object', accent: 'warning' })
  if (hasContactObject) badges.push({ label: 'Contact object preserved', accent: 'cyan' })
  badges.push({ label: 'Caption above all', accent: 'success' })
  badges.push({ label: 'Future mask worker', accent: 'violet' })
  if (hasFallback) badges.push({ label: 'Fallback planned', accent: 'success' })
  if (basicSafe) badges.push({ label: 'Basic safe', accent: 'success' })
  if (modes.has('object_anchored_overlay')) badges.push({ label: 'Pro', accent: 'blue' })
  if (modes.has('subject_cutout_overlay') || strategies.has('multi_object_depth_mask') || strategies.has('full_cutout_composition')) badges.push({ label: 'Premium', accent: 'warning' })

  return badges
}

export function InlineDepthAwareOverlayCard({ descriptor, plan }: InlineDepthAwareOverlayCardProps) {
  const depthPlan = plan.depthAwareOverlayPlan

  if (!depthPlan?.active) {
    return null
  }

  const items = depthPlan.items
  const modes = new Set(items.map((item) => item.depthCompositingMode))
  const strategies = new Set(items.map((item) => item.maskStrategy))
  const modeMix = countBy(items.map((item) => item.depthCompositingMode))
  const strategyMix = countBy(items.map((item) => item.maskStrategy))
  const riskMix = countBy(items.map((item) => item.maskRisk))
  const contactObjects = items.flatMap((item) => item.foregroundObjects).filter((object) => object.kind === 'contact_object')
  const fallbackCount = items.filter((item) => item.fallbackLayoutMode).length
  const visibleItems = items.slice(0, 3)
  const hiddenCount = Math.max(0, items.length - visibleItems.length)
  const basicSafe = items.every((item) => item.tierAllowed.basic && item.maskStrategy === 'none')
  const badges = depthBadges(modes, strategies, contactObjects.length > 0, fallbackCount > 0, basicSafe)

  return (
    <InlinePlanCardShell
      className="depth-aware-overlay-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">active</span>
          <span className="compact-summary-chip">{items.length} depth items</span>
          <span className="compact-summary-chip">{contactObjects.length} contact objects</span>
          <span className="compact-summary-chip">{fallbackCount} fallback planned</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Depth-aware overlay plan"
      helper="ReeditPro can plan premium overlays where maps, cards, or graphics sit behind selected foreground subjects or important objects. This is planning only; real masking is not implemented in this frontend demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Depth-aware overlay plan"
    >
      <div className="qa-badge-row">
        {badges.map((badge) => (
          <Badge accent={badge.accent} key={badge.label}>{badge.label}</Badge>
        ))}
      </div>

      <div className="depth-overlay-summary-grid">
        <span><strong>Active</strong>{depthPlan.active ? 'Yes' : 'No'}</span>
        <span><strong>Items</strong>{items.length}</span>
        <span><strong>Depth modes</strong>{countSummary(modeMix)}</span>
        <span><strong>Mask strategies</strong>{countSummary(strategyMix)}</span>
        <span><strong>Risk</strong>{countSummary(riskMix)}</span>
        <span><strong>Contact objects</strong>{contactObjects.map((object) => object.label).join(', ') || 'None'}</span>
        <span><strong>Fallbacks</strong>{fallbackCount} planned</span>
      </div>

      <p className="inline-helper">{depthPlan.summary}</p>

      <div className="layout-mode-list">
        {visibleItems.map((item) => (
          <article className="depth-overlay-item" key={item.id}>
            <div className="visual-asset-header">
              <div>
                <span className="section-eyebrow">{item.trackingRequirement.replaceAll('_', ' ')}</span>
                <h4>{label(item.depthCompositingMode)}</h4>
                <p>{item.reason}</p>
              </div>
              <div className="visual-asset-badges">
                <span className="depth-mode-badge">{label(item.depthCompositingMode)}</span>
                <span className="mask-strategy-badge">{label(item.maskStrategy)}</span>
                <span className={riskTone(item.maskRisk)}>{label(item.maskRisk)}</span>
              </div>
            </div>

            <div className="depth-overlay-meta">
              <span><strong>Behind</strong>{item.overlayShouldSitBehind.join(', ') || 'None'}</span>
              <span><strong>In front of</strong>{item.overlayShouldSitInFrontOf.join(', ') || 'None'}</span>
              <span><strong>Tier</strong>{Object.entries(item.tierAllowed).filter(([, allowed]) => allowed).map(([tier]) => tier).join(', ')}</span>
              <span><strong>Credit impact</strong>{label(item.complexityCreditImpact)}</span>
            </div>

            <p className="future-mask-worker-note">{item.captionLayerRule}</p>

            {item.fallbackLayoutMode && (
              <p className="depth-fallback-note">Fallback layout: {label(item.fallbackLayoutMode)}</p>
            )}

            <div className="foreground-object-list">
              <strong>Foreground objects</strong>
              {item.foregroundObjects.map((object) => (
                <span className="foreground-object-item" key={object.id}>
                  <span className={object.kind === 'contact_object' ? 'contact-object-badge' : 'depth-mode-badge'}>{label(object.kind)}</span>
                  {object.label}: {object.reason}
                </span>
              ))}
            </div>

            {item.foregroundDepthGroups.map((group) => (
              <div className="foreground-depth-group" key={group.id}>
                <strong>{group.label}</strong>
                <span>{group.reason}</span>
                <span>Mask: {label(group.maskStrategy)} / risk {label(group.maskRisk)}</span>
              </div>
            ))}

            <div className="layout-prompt-implication-list">
              <strong>Prompt implications</strong>
              {item.promptImplications.slice(0, 4).map((implication) => (
                <span key={implication}>{implication}</span>
              ))}
            </div>

            <div className="layout-prompt-implication-list">
              <strong>Remotion layer notes</strong>
              {item.remotionLayerNotes.slice(0, 4).map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>

            <div className="qa-check-list">
              <strong>QA checks</strong>
              {item.qaChecks.slice(0, 5).map((qaCheck) => (
                <span key={qaCheck}>{qaCheck}</span>
              ))}
            </div>

            <div className="layout-prompt-implication-list">
              <strong>Worker notes</strong>
              {item.workerNotes.slice(0, 4).map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional depth item{hiddenCount === 1 ? '' : 's'} summarized in the approved depth-aware overlay plan.</p>}
    </InlinePlanCardShell>
  )
}
