import { demoScenarioIndex } from '../../lib/demo-scenario-index'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import { Badge } from '../Badge'

type InlineDemoScenarioSelectorProps = {
  selectedScenarioId: string
  onSelect: (scenarioId: string) => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function InlineDemoScenarioSelector({ onSelect, selectedScenarioId }: InlineDemoScenarioSelectorProps) {
  return (
    <section className="inline-chat-card demo-scenario-selector-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Scenario library</span>
          <h3>Internal scenario</h3>
        </div>
        <Badge accent="cyan">Internal</Badge>
      </div>
      <p className="inline-helper">
        Switch internal scenarios to review different planning flows. Provider calls remain gated.
      </p>

      <div className="demo-scenario-grid">
        {demoScenarioIndex.map((scenario) => {
          const active = scenario.id === selectedScenarioId

          return (
            <button
              className={`demo-scenario-option${active ? ' demo-scenario-option-active' : ''}`}
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              type="button"
            >
              <span>{scenario.label}</span>
              <small>{hideInternalToolNamesInCopy(scenario.description)}</small>
              <em>{formatLabel(scenario.editingCategory)} / {scenario.editLevel}</em>
            </button>
          )
        })}
      </div>
    </section>
  )
}
