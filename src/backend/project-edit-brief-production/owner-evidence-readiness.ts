export type ProjectEditBriefOwnerEvidenceStatus = 'missing' | 'approved' | 'rejected' | 'waived'

export interface ProjectEditBriefOwnerEvidenceInput {
  id: string
  label: string
  status: ProjectEditBriefOwnerEvidenceStatus | string
  owner: string | null
  evidenceRef: string | null
  reviewedAt: string | null
  notes: string[]
}

export interface ProjectEditBriefOwnerEvidenceIntake {
  id: string
  milestone: string
  status: string
  decision: string
  allowedStatuses: ProjectEditBriefOwnerEvidenceStatus[]
  requiredOwnerInputs: ProjectEditBriefOwnerEvidenceInput[]
  gateState: {
    readyForRpEditBrief16: boolean
    externalBetaAllowed: boolean
    realUserMediaBetaAllowed: boolean
    paidProductionAllowed: boolean
    supabasePersistenceImplementationAllowed: boolean
  }
  nextMilestoneWhenComplete: string
}

export interface ProjectEditBriefOwnerEvidenceReadiness {
  decision: 'project_edit_brief_owner_evidence_readiness_blocked_pending_inputs'
    | 'project_edit_brief_owner_evidence_readiness_passed_ready_for_rp_editbrief_16'
  readyForRpEditBrief16: boolean
  supabasePersistenceImplementationAllowed: boolean
  externalBetaAllowed: false
  realUserMediaBetaAllowed: false
  paidProductionAllowed: false
  approvedOrWaivedInputs: string[]
  missingInputs: string[]
  rejectedInputs: string[]
  invalidInputs: string[]
  blockedReasons: string[]
  nextMilestone: string
}

export const PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS = [
  'canonical_workflow_approval',
  'durable_root_schema_approval',
  'auth_access_policy_approval',
  'supabase_security_approval',
  'media_lifecycle_approval',
  'planner_integration_approval',
  'credit_cost_approval',
  'provider_model_approval',
  'worker_render_approval',
  'operations_approval',
] as const

const allowedStatuses = new Set<ProjectEditBriefOwnerEvidenceStatus>(['missing', 'approved', 'rejected', 'waived'])

function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasIsoTimestamp(value: string | null | undefined): value is string {
  return hasText(value) && !Number.isNaN(Date.parse(value))
}

export function evaluateProjectEditBriefOwnerEvidenceReadiness(
  intake: ProjectEditBriefOwnerEvidenceIntake,
): ProjectEditBriefOwnerEvidenceReadiness {
  const expectedIds = new Set<string>(PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS)
  const seenIds = new Set<string>()
  const approvedOrWaivedInputs: string[] = []
  const missingInputs: string[] = []
  const rejectedInputs: string[] = []
  const invalidInputs: string[] = []
  const blockedReasons: string[] = []

  for (const input of intake.requiredOwnerInputs) {
    if (!expectedIds.has(input.id)) {
      invalidInputs.push(input.id)
      blockedReasons.push(`${input.id} is not an expected Project Edit Brief owner input.`)
      continue
    }
    if (seenIds.has(input.id)) {
      invalidInputs.push(input.id)
      blockedReasons.push(`${input.id} appears more than once.`)
      continue
    }
    seenIds.add(input.id)

    if (!allowedStatuses.has(input.status as ProjectEditBriefOwnerEvidenceStatus)) {
      invalidInputs.push(input.id)
      blockedReasons.push(`${input.id} has unsupported status ${input.status}.`)
      continue
    }

    if (input.status === 'missing') {
      missingInputs.push(input.id)
      blockedReasons.push(`${input.id} is missing owner evidence.`)
      continue
    }
    if (input.status === 'rejected') {
      rejectedInputs.push(input.id)
      blockedReasons.push(`${input.id} was rejected by its owner.`)
      continue
    }

    const evidenceMissing = [
      hasText(input.owner) ? undefined : 'owner',
      hasText(input.evidenceRef) ? undefined : 'evidenceRef',
      hasIsoTimestamp(input.reviewedAt) ? undefined : 'reviewedAt',
      Array.isArray(input.notes) && input.notes.length > 0 ? undefined : 'notes',
    ].filter(Boolean)

    if (evidenceMissing.length > 0) {
      invalidInputs.push(input.id)
      blockedReasons.push(`${input.id} is ${input.status} but missing ${evidenceMissing.join(', ')}.`)
      continue
    }

    approvedOrWaivedInputs.push(input.id)
  }

  for (const expectedId of expectedIds) {
    if (!seenIds.has(expectedId)) {
      missingInputs.push(expectedId)
      blockedReasons.push(`${expectedId} is not present in the owner evidence intake.`)
    }
  }

  const readyForRpEditBrief16 = blockedReasons.length === 0

  return {
    decision: readyForRpEditBrief16
      ? 'project_edit_brief_owner_evidence_readiness_passed_ready_for_rp_editbrief_16'
      : 'project_edit_brief_owner_evidence_readiness_blocked_pending_inputs',
    readyForRpEditBrief16,
    supabasePersistenceImplementationAllowed: readyForRpEditBrief16,
    externalBetaAllowed: false,
    realUserMediaBetaAllowed: false,
    paidProductionAllowed: false,
    approvedOrWaivedInputs,
    missingInputs: [...new Set(missingInputs)],
    rejectedInputs,
    invalidInputs,
    blockedReasons: [...new Set(blockedReasons)],
    nextMilestone: intake.nextMilestoneWhenComplete,
  }
}
