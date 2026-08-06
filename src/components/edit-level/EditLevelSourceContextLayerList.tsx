import type {
  EditLevelSourceContextLayerListModel,
  EditLevelSourceUnderstandingLayerRoute,
} from '../../types'

type EditLevelSourceContextLayerListProps = {
  model: EditLevelSourceContextLayerListModel
}

export function EditLevelSourceContextLayerList({ model }: EditLevelSourceContextLayerListProps) {
  return (
    <details className="edit-level-source-layer-list" data-testid="edit-level-source-layer-list">
      <summary>Source context layers</summary>
      <div className="edit-level-source-layer-groups">
        <LayerGroup title="Required" routes={model.required} />
        <LayerGroup title="Recommended" routes={model.recommended} />
        <LayerGroup title="Targeted" routes={model.targeted} />
        <LayerGroup title="Future-gated" routes={model.futureGated} />
      </div>
    </details>
  )
}

function LayerGroup({ routes, title }: { routes: EditLevelSourceUnderstandingLayerRoute[]; title: string }) {
  return (
    <section>
      <h4>{title}</h4>
      {routes.length === 0 ? (
        <p className="inline-helper">No source context layers in this group.</p>
      ) : (
        <ul>
          {routes.map((route) => (
            <li key={`${title}-${route.layerId}`}>
              <span>
                <strong>{route.displayName}</strong>
                <small>{route.userFacingSummary}</small>
              </span>
              <span className="edit-level-source-badge-set" aria-label={`${route.requiredness} ${route.status}`}>
                <em>{formatSourceBadge(route.requiredness)}</em>
                <em>{formatSourceBadge(route.status)}</em>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatSourceBadge(value: string) {
  if (value === 'available_mock') return 'local ready'
  if (value === 'available_beta') return 'beta ready'
  if (value === 'provider_required') return 'AI service approval required'
  if (value === 'worker_required') return 'private processing required'
  if (value === 'runtime_disabled') return 'approval gated'
  if (value === 'future_gated') return 'future gated'
  if (value === 'not_required') return 'not required'
  return value.replaceAll('_', ' ')
}
