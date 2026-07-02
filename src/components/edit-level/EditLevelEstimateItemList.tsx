import type {
  EditLevelEstimateItem,
  EditLevelEstimateItemListModel,
} from '../../types'

type EditLevelEstimateItemListProps = {
  model: EditLevelEstimateItemListModel
}

export function EditLevelEstimateItemList({ model }: EditLevelEstimateItemListProps) {
  return (
    <details className="edit-level-estimate-item-list" data-testid="edit-level-estimate-item-list">
      <summary>
        <span>
          <strong>{model.displayName} estimate items</strong>
          <small>Time, credits, analysis, future budgets, and degraded capability policy.</small>
        </span>
      </summary>
      <div className="edit-level-estimate-item-groups">
        <EstimateGroup label="Core estimate" items={model.estimateItems.slice(0, 9)} />
        <EstimateGroup label="Future-gated budget" items={model.futureGatedItems} />
        <EstimateGroup label="Needs product value" items={model.needsProductValueItems} />
        <EstimateGroup label="Degraded capability" items={model.degradedItems} />
      </div>
    </details>
  )
}

function EstimateGroup({
  items,
  label,
}: {
  items: EditLevelEstimateItem[]
  label: string
}) {
  if (items.length === 0) return null

  return (
    <section>
      <h4>{label}</h4>
      <ul>
        {items.slice(0, 8).map((item) => (
          <li key={`${label}-${item.estimateId}`}>
            <span>
              <strong>{item.displayName}</strong>
              <small>{item.userFacingSummary}</small>
            </span>
            <span className="edit-level-estimate-badge-set">
              <em>{formatValue(item)}</em>
              {item.futureGated && <em>future-gated</em>}
              {item.needsProductValue && <em>needs product value</em>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatValue(item: EditLevelEstimateItem) {
  if (item.estimateRange) return item.estimateRange.label
  if (item.unit === 'none') return String(item.estimateValue).replaceAll('_', ' ')
  return `${String(item.estimateValue).replaceAll('_', ' ')} ${item.unit}`
}
