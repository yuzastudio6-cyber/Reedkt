import type { DemoScenario } from '../../lib/demo-scenarios'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import { Badge } from '../Badge'

type InlineDemoScenarioSummaryCardProps = {
  scenario: DemoScenario
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function listPreview(items: string[]) {
  return items.slice(0, 4)
}

export function InlineDemoScenarioSummaryCard({ scenario }: InlineDemoScenarioSummaryCardProps) {
  return (
    <section className="inline-chat-card demo-scenario-summary-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Scenario summary</span>
          <h3>{scenario.label}</h3>
        </div>
        <Badge accent={scenario.editLevel === 'premium' ? 'warning' : 'blue'}>{scenario.editLevel}</Badge>
      </div>
      <p className="inline-helper">
        This internal scenario checks whether chat, intent, visual planning, AI routing, composition planning, QA, prompt preview, and credit estimates stay connected.
      </p>
      <p className="inline-helper">{hideInternalToolNamesInCopy(scenario.description)}</p>

      <div className="demo-scenario-meta">
        <span><strong>Category</strong>{formatLabel(scenario.editingCategory)}</span>
        <span><strong>Platform</strong>{formatLabel(scenario.targetPlatform)}</span>
        <span><strong>Ratio</strong>{scenario.aspectRatio}</span>
        <span><strong>Frame</strong>{formatLabel(scenario.frameTemplateType)}</span>
      </div>

      <details className="compact-card-details">
        <summary>Expected planning behavior</summary>
        <div className="segment-chip-row">
          {listPreview(scenario.expectedSignatureSystems).map((item) => <span key={item}>{hideInternalToolNamesInCopy(item)}</span>)}
          {listPreview(scenario.expectedAssetBehavior).map((item) => <span key={item}>{hideInternalToolNamesInCopy(item)}</span>)}
          {listPreview(scenario.expectedProviderPolicy).map((item) => <span key={item}>{hideInternalToolNamesInCopy(item)}</span>)}
          {listPreview(scenario.expectedSafetyNotes).map((item) => <span key={item}>{hideInternalToolNamesInCopy(item)}</span>)}
        </div>
      </details>
    </section>
  )
}
