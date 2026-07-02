import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineAdaptiveEditStrategyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function decisionBadge(decision: string) {
  if (decision.includes('speaker')) return 'Speaker focus'
  if (decision.includes('voiceover') || decision.includes('graphic')) return 'Visual takeover'
  if (decision.includes('caption')) return 'Captions only'
  if (decision.includes('b_roll')) return 'B-roll'
  if (decision.includes('still')) return 'Card/still'
  if (decision.includes('map')) return 'Map'
  if (decision.includes('chart')) return 'Chart'
  if (decision.includes('screen')) return 'Screen capture'
  if (decision.includes('stroke')) return 'Stroke Motion'
  if (decision.includes('real')) return 'Real Motion'
  return label(decision)
}

export function InlineAdaptiveEditStrategyCard({ descriptor, plan }: InlineAdaptiveEditStrategyCardProps) {
  const strategyPlan = plan.adaptiveEditStrategyPlan

  if (!strategyPlan) {
    return null
  }

  const strategies = strategyPlan.segmentStrategies.slice(0, 6)
  const hiddenCount = Math.max(0, strategyPlan.segmentStrategies.length - strategies.length)
  const avoidGenerationCount = strategyPlan.segmentStrategies.filter((strategy) => strategy.generationRestraint === 'avoid_generation').length
  const controlledToolCount = strategyPlan.segmentStrategies.filter((strategy) =>
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool'),
  ).length

  return (
    <InlinePlanCardShell
      className="adaptive-edit-strategy-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{strategyPlan.segmentStrategies.length} strategies</span>
          <span className="compact-summary-chip">{avoidGenerationCount} avoid generation</span>
          <span className="compact-summary-chip">{controlledToolCount} controlled tool</span>
          <span className="compact-summary-chip">{strategyPlan.visualStrategySummary.aiVideoSegments} AI-video eligible</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Adaptive strategy"
      helper="ReeditPro does not use one template for every video. It chooses speaker focus, visuals, tools, pacing, and generation restraint based on your request and what the video needs."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Adaptive edit strategy"
    >
      <div className="adaptive-strategy-summary">
        <span><strong>Summary</strong>{strategyPlan.summary}</span>
        <span><strong>Hook</strong>{strategyPlan.hookStrategy.recommendation}</span>
        <span><strong>Pacing</strong>{label(strategyPlan.pacingStrategy.pacingStyle)} / {label(strategyPlan.pacingStrategy.cutIntensity)}</span>
        <span><strong>Visual mix</strong>{strategyPlan.visualStrategySummary.summary}</span>
      </div>

      <div className="adaptive-strategy-count-grid">
        <span><strong>{strategyPlan.visualStrategySummary.speakerLedSegments}</strong>Speaker led</span>
        <span><strong>{strategyPlan.visualStrategySummary.visualTakeoverSegments}</strong>Visual takeover</span>
        <span><strong>{strategyPlan.visualStrategySummary.brollSegments}</strong>B-roll</span>
        <span><strong>{strategyPlan.visualStrategySummary.graphicSegments}</strong>Graphics</span>
        <span><strong>{strategyPlan.visualStrategySummary.mapOrChartSegments}</strong>Map/chart</span>
        <span><strong>{strategyPlan.visualStrategySummary.aiVideoSegments}</strong>AI video</span>
        <span><strong>{strategyPlan.visualStrategySummary.stillCardSegments}</strong>Still/card</span>
        <span><strong>{strategyPlan.visualStrategySummary.noExtraVisualSegments}</strong>No extra</span>
      </div>

      <div className="understanding-chip-row">
        {strategyPlan.modelPolicyNotes.slice(0, 3).map((note) => (
          <span className="generation-restraint-badge" key={note}>{note}</span>
        ))}
        {strategyPlan.creditStrategyNotes.slice(0, 2).map((note) => (
          <span className="creative-intensity-badge" key={note}>{note}</span>
        ))}
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Hook and pacing strategy</summary>
        <div className="layout-mode-meta">
          <span><strong>Hook policy</strong>{label(strategyPlan.hookStrategy.policy)}</span>
          <span><strong>Selected line</strong>{strategyPlan.hookStrategy.selectedLine ?? 'Not selected'}</span>
          <span><strong>Hook reason</strong>{strategyPlan.hookStrategy.reason}</span>
          <span><strong>Pacing reason</strong>{strategyPlan.pacingStrategy.reason}</span>
          <span><strong>Keep pauses</strong>{strategyPlan.pacingStrategy.keepPausesWhere.join(' ')}</span>
          <span><strong>Tighten</strong>{strategyPlan.pacingStrategy.tightenWhere.join(' ')}</span>
        </div>
      </details>

      <details className="understanding-section" open>
        <summary>Segment strategy decisions</summary>
        <div className="adaptive-segment-strategy-list">
          {strategies.map((strategy) => (
            <article className="adaptive-segment-strategy-item" key={strategy.id}>
              <div>
                <span className="section-eyebrow">{label(strategy.segmentRole)} / {label(strategy.costComplexity)}</span>
                <h4>{strategy.label}</h4>
                <p>{strategy.reasons[0]?.explanation}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="adaptive-decision-badge">{decisionBadge(strategy.decisionKind)}</span>
                <span className="generation-restraint-badge">{label(strategy.generationRestraint)}</span>
                <span className="creative-intensity-badge">{label(strategy.creativeIntensity)}</span>
                <Badge accent="cyan">{label(strategy.recommendedVisualSupport)}</Badge>
                <Badge accent="blue">{label(strategy.recommendedSignatureSystem)}</Badge>
                {strategy.recommendedLayoutMode && <Badge accent="violet">{label(strategy.recommendedLayoutMode)}</Badge>}
              </div>
              <div className="layout-mode-meta">
                <span><strong>Asset</strong>{label(strategy.recommendedAssetType)}</span>
                <span><strong>Speaker</strong>{label(strategy.recommendedSpeakerPresence)}</span>
                <span><strong>Visual dominance</strong>{label(strategy.recommendedVisualDominance)}</span>
                <span><strong>Caption</strong>{label(strategy.recommendedCaptionStyle)}</span>
              </div>
              <div className="strategy-tool-hint-list">
                {strategy.recommendedToolHints.slice(0, 5).map((hint) => (
                  <span key={hint}>{label(hint)}</span>
                ))}
              </div>
              <ul className="strategy-reason-list">
                {strategy.reasons.slice(0, 3).map((reason) => (
                  <li key={reason.id}>{reason.source.replaceAll('_', ' ')}: {reason.explanation}</li>
                ))}
              </ul>
              <ul className="strategy-fallback-list">
                {strategy.fallbackStrategy.slice(0, 2).map((fallback) => (
                  <li key={fallback}>{fallback}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {hiddenCount > 0 && <p className="inline-helper">{hiddenCount} additional segment strateg{hiddenCount === 1 ? 'y' : 'ies'} summarized in the plan.</p>}
      </details>

      <details className="understanding-section">
        <summary>Rules and QA</summary>
        <div className="layout-mode-meta">
          <span><strong>Must follow</strong>{strategyPlan.globalMustFollowRules.join(' ')}</span>
          <span><strong>Avoid</strong>{strategyPlan.globalAvoidRules.join(' ')}</span>
          <span><strong>QA</strong>{strategyPlan.qaChecks.join(' ')}</span>
          <span><strong>Limitations</strong>{strategyPlan.limitations.join(' ')}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
