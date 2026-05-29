import { getDisabledExecutionControl } from '../web-shell-policy'
import { StatusBadge } from '../components/StatusBadge'

const renderControl = getDisabledExecutionControl('render')
const publicExportControl = getDisabledExecutionControl('public_export')

export function ExportReviewPanel() {
  return (
    <section className="web-shell-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Export review</h2>
        <StatusBadge tone="blocked">Public delivery blocked</StatusBadge>
      </div>
      <p>{renderControl?.reason}</p>
      <p>{publicExportControl?.reason}</p>
      <div className="web-shell-actions">
        <button className="web-shell-button primary" type="button" disabled>
          Render disabled
        </button>
        <button className="web-shell-button" type="button" disabled>
          Export disabled
        </button>
      </div>
    </section>
  )
}
