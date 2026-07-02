import { Badge } from '../Badge'
import { launchEditingCategories } from '../../lib/product-taxonomy'
import type { EditingCategory } from '../../types/reeditpro'

type InlineEditingCategoryCardProps = {
  selectedCategory: EditingCategory
  onSelect: (value: EditingCategory) => void
}

export function InlineEditingCategoryCard({ onSelect, selectedCategory }: InlineEditingCategoryCardProps) {
  return (
    <section className="inline-chat-card category-choice-card-shell">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Planning context</span>
          <h3>Choose the editing category</h3>
        </div>
        <Badge accent="cyan">Context only</Badge>
      </div>
      <p className="inline-helper">
        This gives ReeditPro planning context. The AI still decides which signature systems improve each segment.
      </p>

      <div className="category-choice-grid">
        {launchEditingCategories.map((category) => (
          <button
            aria-pressed={selectedCategory === category.value}
            className={`category-choice-card ${selectedCategory === category.value ? 'active' : ''}`.trim()}
            key={category.value}
            onClick={() => onSelect(category.value)}
            type="button"
          >
            <span className="choice-card-title">{category.label}</span>
            <span>{category.description}</span>
            <small>{category.bestUseCases.slice(0, 4).join(' / ')}</small>
            <em>{category.defaultSignatureMix}</em>
          </button>
        ))}
      </div>
    </section>
  )
}
