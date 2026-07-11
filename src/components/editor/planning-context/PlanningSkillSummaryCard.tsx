import { Badge } from '../../Badge'
import type { ProfessionalSkillPlan } from '../../../types'
import {
  createProfessionalSkillDisplayModel,
  professionalSkillShortStatusLabel,
} from '../../../lib/professional-skills'

type PlanningSkillSummaryCardProps = {
  skillPlan: ProfessionalSkillPlan
}

function statusLabel(status: ProfessionalSkillPlan['status']) {
  return professionalSkillShortStatusLabel(status)
}

function badgeAccent(status: ProfessionalSkillPlan['status']) {
  if (status === 'ready_for_plan') return 'success'
  if (status === 'needs_review') return 'warning'
  return 'warning'
}

export function PlanningSkillSummaryCard({ skillPlan }: PlanningSkillSummaryCardProps) {
  const skillDisplay = createProfessionalSkillDisplayModel(skillPlan, {
    activityLimit: 6,
    evidenceLimit: 4,
    preparationLimit: 4,
  })

  return (
    <section className="inline-chat-card planning-skill-summary" data-testid="planning-skill-summary-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit approach</span>
          <h3>Editing activities planned</h3>
        </div>
        <Badge accent={badgeAccent(skillPlan.status)}>{statusLabel(skillPlan.status)}</Badge>
      </div>

      <p className="inline-helper">{skillDisplay.summary}</p>

      <div className="planning-context-stat-grid">
        <span><strong>{skillDisplay.selectedActivityCount}</strong><small>Activities</small></span>
        <span><strong>{skillDisplay.areaCount}</strong><small>Edit areas</small></span>
        <span><strong>{skillDisplay.reviewCheckCount}</strong><small>Review checks</small></span>
        <span><strong>{skillDisplay.editBriefLabel}</strong><small>Edit Brief</small></span>
      </div>

      <ul className="planning-skill-activity-list">
        {skillDisplay.activityItems.map((item) => (
          <li key={item.id}>
            <strong>{item.label}</strong>
            {item.summary && <span>{item.summary}</span>}
          </li>
        ))}
      </ul>

      {skillDisplay.preparationItems.length > 0 && (
        <div className="planning-skill-preparation-list" aria-label="Private preparation summary">
          <strong>Preparation path</strong>
          <ul>
            {skillDisplay.preparationItems.map((summary) => (
              <li key={summary.id}>
                <span>{summary.label}</span>
                <small>{summary.summary}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skillDisplay.evidenceItems.length > 0 && (
        <div className="planning-skill-preparation-list" aria-label="Why these activities are planned">
          <strong>Why these activities are planned</strong>
          <ul>
            {skillDisplay.evidenceItems.map((evidence) => (
              <li key={evidence.id}>
                <span>{evidence.label}</span>
                <small>{evidence.summary}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skillDisplay.warning && (
        <p className="inline-helper">{skillDisplay.warning}</p>
      )}
    </section>
  )
}
