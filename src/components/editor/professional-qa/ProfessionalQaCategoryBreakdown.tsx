import type { ProfessionalQaSummary } from '../../../types'
import { getQaCategoryLabel } from '../../../lib/professional-qa'

type ProfessionalQaCategoryBreakdownProps = {
  summary: ProfessionalQaSummary
}

export function ProfessionalQaCategoryBreakdown({
  summary,
}: ProfessionalQaCategoryBreakdownProps) {
  return (
    <section className="inline-chat-card professional-qa-category-breakdown">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Category breakdown</span>
          <h3>{summary.categories.length === 0 ? 'No categories yet' : 'Where QA found issues'}</h3>
        </div>
      </div>
      {summary.categories.length === 0 ? (
        <p className="inline-helper">Run QA to see category-level readiness.</p>
      ) : (
        <div className="professional-qa-category-grid">
          {summary.categories.map((category) => (
            <span key={category.category}>
              <strong>{getQaCategoryLabel(category.category)}</strong>
              <small>{category.total} total</small>
              <small>{category.blocking} blocking</small>
              <small>{category.warning} warning</small>
              <small>{category.passed} passed</small>
              <small>{category.info} info</small>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
