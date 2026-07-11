import type {
  EditLevelQAGateListModel,
  EditLevelQAGateRoute,
} from '../../types'
import { EditLevelQAGateBadge } from './EditLevelQAGateBadge'

type EditLevelQAGateListProps = {
  model: EditLevelQAGateListModel
}

export function EditLevelQAGateList({ model }: EditLevelQAGateListProps) {
  return (
    <details className="edit-level-qa-gate-list" data-testid="edit-level-qa-gate-list">
      <summary>
        <span>
          <strong>{model.displayName} QA gate groups</strong>
          <small>Required, warning, blocking, future-gated, and degraded checks.</small>
        </span>
      </summary>
      <div className="edit-level-qa-gate-groups">
        <GateGroup label="Required" routes={model.required} />
        <GateGroup label="Recommended" routes={model.recommended} />
        <GateGroup label="Warning checks" routes={model.warningOnly} />
        <GateGroup label="Blocking checks" routes={model.blocking} />
        <GateGroup label="Future render / revision / credit" routes={model.futureGated} />
        <GateGroup label="Fallback / degraded" routes={model.degradedOrFallback} />
      </div>
    </details>
  )
}

function GateGroup({
  label,
  routes,
}: {
  label: string
  routes: EditLevelQAGateRoute[]
}) {
  if (routes.length === 0) return null

  return (
    <section>
      <h4>{label}</h4>
      <ul>
        {routes.slice(0, 8).map((route) => (
          <li key={`${label}-${route.gateId}`}>
            <span>
              <strong>{route.displayName}</strong>
              <small>{route.userFacingSummary}</small>
            </span>
            <EditLevelQAGateBadge requiredness={route.requiredness} status={route.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}
