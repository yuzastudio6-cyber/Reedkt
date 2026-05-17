import { demoScenarios } from '../../lib/demo-scenarios'
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
          <span className="section-eyebrow">Demo scenario</span>
          <h3>Demo scenario</h3>
        </div>
        <Badge accent="cyan">Mock prototype</Badge>
      </div>
      <p className="inline-helper">
        Use these mock scenarios to test ReeditPro's planning engine. This does not call real providers.
      </p>

      <div className="demo-scenario-grid">
        {demoScenarios.map((scenario) => {
          const active = scenario.id === selectedScenarioId

          return (
            <button
              className={`demo-scenario-option${active ? ' demo-scenario-option-active' : ''}`}
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              type="button"
            >
              <span>{scenario.label}</span>
              <small>{scenario.description}</small>
              <em>{formatLabel(scenario.editingCategory)} / {scenario.editLevel}</em>
            </button>
          )
        })}
      </div>
    </section>
  )
}
