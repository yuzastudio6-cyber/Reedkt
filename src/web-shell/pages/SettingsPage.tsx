import { disabledExecutionControls, webShellSafetyPolicy } from '../web-shell-policy'
import { StatusBadge } from '../components/StatusBadge'

export function SettingsPage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Settings</p>
          <h2>Launch and execution controls remain locked.</h2>
          <p>
            These controls document the current safety posture. They do not enable desktop runtime, local workers,
            provider calls, public delivery, or production launch.
          </p>
        </div>
        <StatusBadge tone="blocked">Locked</StatusBadge>
      </section>
      <section className="web-shell-grid two">
        {disabledExecutionControls.map((control) => (
          <article key={control.controlId} className="web-shell-panel">
            <div className="web-shell-panel-heading compact">
              <h3>{control.label}</h3>
              <StatusBadge tone="blocked">Disabled</StatusBadge>
            </div>
            <p>{control.reason}</p>
            <button className="web-shell-button" type="button" disabled>
              Unavailable
            </button>
          </article>
        ))}
      </section>
      <section className="web-shell-panel">
        <h2>Safety policy</h2>
        <dl className="web-shell-meta-grid">
          <div>
            <dt>Production ready</dt>
            <dd>{String(webShellSafetyPolicy.productionReadyAllowed)}</dd>
          </div>
          <div>
            <dt>External beta</dt>
            <dd>{String(webShellSafetyPolicy.externalBetaAllowed)}</dd>
          </div>
          <div>
            <dt>Broad real media</dt>
            <dd>{String(webShellSafetyPolicy.broadRealMediaAllowed)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
