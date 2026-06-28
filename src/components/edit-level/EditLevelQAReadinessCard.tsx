import type { EditLevelQAReadinessCardModel } from '../../types'

type EditLevelQAReadinessCardProps = {
  readiness: EditLevelQAReadinessCardModel
}

export function EditLevelQAReadinessCard({ readiness }: EditLevelQAReadinessCardProps) {
  return (
    <section className="edit-level-qa-readiness-card" data-testid="edit-level-qa-readiness-card">
      <span className="section-eyebrow">QA readiness</span>
      <h3>{readiness.displayName} readiness</h3>
      <div className="edit-level-qa-grid">
        <span><strong>{readiness.readinessLabel}</strong><small>Readiness status</small></span>
        <span><strong>{readiness.blockingGates.length}</strong><small>Planning blockers</small></span>
        <span><strong>{readiness.futureGatedChecks.length}</strong><small>Future render / credit checks</small></span>
      </div>
      <p className="inline-helper">{readiness.readinessSummary}</p>
      <p className="inline-helper">{readiness.noExecutionNotice}</p>
    </section>
  )
}
