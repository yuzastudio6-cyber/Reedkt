import type {
  ProfessionalSkillPlan,
  ProfessionalSkillReadinessStatus,
} from '../../types/professional-skills'
import { hideInternalToolNamesInCopy } from '../tool-display-labels'
import {
  summarizeProfessionalBackendPreparation,
  type ProfessionalBackendPreparationIntentLike,
} from './backend-intent-display'

export type ProfessionalSkillDisplayStage =
  | 'upload_required'
  | 'planning_setup'
  | 'plan_review'
  | 'approved_review_building'
  | 'review_ready'
  | 'revision_requested'
  | 'blocked'

export type ProfessionalSkillDisplayItem = {
  id: string
  label: string
  summary: string
}

export type ProfessionalSkillDisplayModel = {
  activityItems: ProfessionalSkillDisplayItem[]
  areaCount: number
  blocker?: string
  briefSourceLabel: 'Brief included' | 'Prompt-led'
  editBriefLabel: 'Included' | 'Optional'
  evidenceItems: ProfessionalSkillDisplayItem[]
  preparationItems: ProfessionalSkillDisplayItem[]
  reviewCheckCount: number
  selectedActivityCount: number
  status: ProfessionalSkillReadinessStatus
  statusLabel: string
  summary: string
  warning?: string
}

function clean(value: string): string {
  return hideInternalToolNamesInCopy(value)
}

export function professionalSkillStatusLabel(status: ProfessionalSkillReadinessStatus): string {
  if (status === 'ready_for_plan') return 'Ready for review'
  if (status === 'needs_review') return 'Review needed'
  return 'Blocked'
}

export function professionalSkillShortStatusLabel(status: ProfessionalSkillReadinessStatus): string {
  if (status === 'ready_for_plan') return 'Ready'
  if (status === 'needs_review') return 'Review'
  return 'Blocked'
}

export function professionalSkillBriefSourceLabel(plan: ProfessionalSkillPlan): 'Brief included' | 'Prompt-led' {
  return plan.editBriefUsed ? 'Brief included' : 'Prompt-led'
}

export function professionalSkillEditBriefLabel(plan: ProfessionalSkillPlan): 'Included' | 'Optional' {
  return plan.editBriefUsed ? 'Included' : 'Optional'
}

export function professionalSkillStageSummary(
  stage: ProfessionalSkillDisplayStage,
  plan: ProfessionalSkillPlan,
): string {
  const activityCount = plan.selectedSkillCount
  const areaCount = plan.selectedFamilies.length
  const reviewCheckCount = plan.qaGateSummary.length

  if (stage === 'approved_review_building') {
    return clean(`Preparing ${activityCount} approved editing activities across ${areaCount} edit area${areaCount === 1 ? '' : 's'} for private review.`)
  }

  if (stage === 'review_ready') {
    return clean(`Private review keeps ${activityCount} planned editing activities and ${reviewCheckCount} review check${reviewCheckCount === 1 ? '' : 's'} attached to the approved plan.`)
  }

  if (stage === 'revision_requested') {
    return clean('Revision planning will reuse the selected editing direction, then update the plan before any new approval.')
  }

  if (stage === 'blocked') {
    return clean('The selected editing direction is preserved while the blocker is resolved.')
  }

  return clean(`The plan selected ${activityCount} editing activities across ${areaCount} edit area${areaCount === 1 ? '' : 's'}. Nothing starts until approval.`)
}

export function professionalSkillReviewContextSummary(plan: ProfessionalSkillPlan): string {
  return clean(`${plan.selectedSkillCount} approved editing activities remain attached to this review workspace across ${plan.selectedFamilies.length} edit area${plan.selectedFamilies.length === 1 ? '' : 's'}.`)
}

export function createProfessionalPreparationDisplayItems(
  intents: readonly ProfessionalBackendPreparationIntentLike[] | undefined,
  limit = 4,
): ProfessionalSkillDisplayItem[] {
  return summarizeProfessionalBackendPreparation(intents, limit)
    .map((item) => ({
      id: item.id,
      label: clean(item.label),
      summary: clean(item.summary),
    }))
}

export function createProfessionalSkillDisplayModel(
  plan: ProfessionalSkillPlan,
  options: {
    activityLimit?: number
    evidenceLimit?: number
    preparationLimit?: number
  } = {},
): ProfessionalSkillDisplayModel {
  const activityLimit = options.activityLimit ?? 5
  const evidenceLimit = options.evidenceLimit ?? 4
  const preparationLimit = options.preparationLimit ?? 4
  const activityItems = (plan.activityGroups.length > 0
    ? plan.activityGroups.slice(0, activityLimit).map((group) => ({
      id: group.id,
      label: clean(group.label),
      summary: clean(group.userFacingSummary),
    }))
    : plan.userFacingActivities.slice(0, activityLimit).map((activity) => ({
      id: activity,
      label: clean(activity),
      summary: '',
    }))
  )
  const evidenceItems = plan.selectedSkills
    .flatMap((skill) => skill.selectionEvidence.map((evidence) => ({
      id: `${skill.skillId}-${evidence.source}`,
      label: clean(evidence.label),
      summary: clean(evidence.summary),
    })))
    .slice(0, evidenceLimit)
  const preparationItems = createProfessionalPreparationDisplayItems(plan.backendIntents, preparationLimit)

  return {
    activityItems,
    areaCount: plan.selectedFamilies.length,
    blocker: plan.blockers[0] ? clean(plan.blockers[0]) : undefined,
    briefSourceLabel: professionalSkillBriefSourceLabel(plan),
    editBriefLabel: professionalSkillEditBriefLabel(plan),
    evidenceItems,
    preparationItems,
    reviewCheckCount: plan.qaGateSummary.length,
    selectedActivityCount: plan.selectedSkillCount,
    status: plan.status,
    statusLabel: professionalSkillStatusLabel(plan.status),
    summary: clean(plan.userFacingSummary),
    warning: plan.warnings[0] ? clean(plan.warnings[0]) : undefined,
  }
}
