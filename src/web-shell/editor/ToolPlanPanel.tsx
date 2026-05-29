import { disabledExecutionControls } from '../web-shell-policy'
import { ComputeRouteBadge } from '../components/ComputeRouteBadge'
import { StatusBadge } from '../components/StatusBadge'

export function ToolPlanPanel() {
  return (
    <section className="web-shell-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Tool plan</h2>
        <StatusBadge tone="blocked">Execution disabled</StatusBadge>
      </div>
      <div className="web-shell-tool-list">
        {disabledExecutionControls
          .filter((control) => ['run_ai', 'render', 'public_export'].includes(control.controlId))
          .map((control) => (
            <article key={control.controlId}>
              <div>
                <strong>{control.label}</strong>
                <p>{control.reason}</p>
              </div>
              <button className="web-shell-button" type="button" disabled>
                Disabled
              </button>
            </article>
          ))}
      </div>
      <ComputeRouteBadge category="blocked_by_policy" />
    </section>
  )
}
