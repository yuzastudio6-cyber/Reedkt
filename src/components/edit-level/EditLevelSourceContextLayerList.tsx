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
                <em>{route.requiredness.replaceAll('_', ' ')}</em>
                <em>{route.status.replaceAll('_', ' ')}</em>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
