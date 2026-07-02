import type { EditLevelQwenPlanningDimensionListModel, EditLevelQwenPlanningDimensionRoute } from '../../types'

type EditLevelQwenPlanningDimensionListProps = {
  model: EditLevelQwenPlanningDimensionListModel
}

export function EditLevelQwenPlanningDimensionList({ model }: EditLevelQwenPlanningDimensionListProps) {
  return (
    <details className="edit-level-qwen-dimension-list" data-testid="edit-level-qwen-dimension-list">
      <summary>
        <span>
          <strong>{model.displayName} Qwen dimensions</strong>
          <small>Required, recommended, future-gated, and fallback planning dimensions.</small>
        </span>
      </summary>
      <div className="edit-level-qwen-dimension-groups">
        <DimensionGroup label="Required" routes={model.required} />
        <DimensionGroup label="Recommended" routes={model.recommended} />
        <DimensionGroup label="Future-gated" routes={model.futureGated} />
        <DimensionGroup label="Fallback / degraded" routes={model.degradedOrFallback} />
      </div>
    </details>
  )
}

function DimensionGroup({
  label,
  routes,
}: {
  label: string
  routes: EditLevelQwenPlanningDimensionRoute[]
}) {
  if (routes.length === 0) return null

  return (
    <section>
      <h4>{label}</h4>
      <ul>
        {routes.slice(0, 6).map((route) => (
          <li key={`${label}-${route.dimensionId}`}>
            <strong>{route.displayName}</strong>
            <span>{route.userFacingSummary}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
