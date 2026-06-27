import type {
  EditLevelToolCapabilityListModel,
  EditLevelToolRoute,
} from '../../types'
import { EditLevelToolCapabilityBadge } from './EditLevelToolCapabilityBadge'

type EditLevelToolCapabilityListProps = {
  model: EditLevelToolCapabilityListModel
}

export function EditLevelToolCapabilityList({ model }: EditLevelToolCapabilityListProps) {
  return (
    <details className="edit-level-tool-capability-list" data-testid="edit-level-tool-capability-list">
      <summary>Tool capabilities for this level</summary>
      <div className="edit-level-tool-capability-groups">
        <CapabilityGroup title="Available now" routes={model.availableNow} />
        <CapabilityGroup title="Beta-ready" routes={model.betaReady} />
        <CapabilityGroup title="Future-gated" routes={model.futureGated} />
        <CapabilityGroup title="Fallbacks" routes={model.degradedOrFallback} />
      </div>
    </details>
  )
}

function CapabilityGroup({ routes, title }: { routes: EditLevelToolRoute[]; title: string }) {
  return (
    <section>
      <h4>{title}</h4>
      {routes.length === 0 ? (
        <p className="inline-helper">No capabilities in this group.</p>
      ) : (
        <ul>
          {routes.map((route) => (
            <li key={`${title}-${route.capabilityId}`}>
              <span>
                <strong>{route.displayName}</strong>
                <small>{route.userFacingSummary}</small>
              </span>
              <EditLevelToolCapabilityBadge requiredness={route.requiredness} status={route.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
