import { z } from 'zod'

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

export interface ProjectEditBriefOwnerEvidenceSafetyScan {
  safe: boolean
  secretLikeEvidence: string[]
  signedUrlEvidence: string[]
  rawPromptEvidence: string[]
  privateArtifactEvidence: string[]
  findings: string[]
}

export type ProjectEditBriefOwnerEvidenceParseResult = {
  success: true
  intake: ProjectEditBriefOwnerEvidenceIntake
} | {
  success: false
  errors: string[]
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
const secretLikePattern =
  /\b(api[_-]?key|secret[_-]?(key|token|value)|password|credential|authorization|bearer|access[_-]?token|refresh[_-]?token|private[_-]?key|service[_-]?role(?:[_\s-]?(key|token|secret)))\b|sk-[A-Za-z0-9_-]{12,}/i
const signedUrlPattern = /\b(X-Amz-Signature|X-Goog-Signature|signature=|sig=|signedUrl=|signed_url=)\b/i
const rawPromptPattern = /\b(raw prompt|raw_prompt|unredacted prompt|full prompt transcript|provider prompt)\b/i
const privateArtifactPattern = /\.(mp4|mov|mkv|webm|avi|wav|mp3|flac|aac|srt|vtt|png|jpe?g|heic|gif|zip|tar|gz|7z)(\?|#|$)/i

const ownerEvidenceInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.string().min(1),
  owner: z.string().nullable(),
  evidenceRef: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  notes: z.array(z.string()),
}).strict()

const ownerEvidenceIntakeSchema = z.object({
  id: z.string().min(1),
  milestone: z.string().min(1),
  status: z.string().min(1),
  decision: z.string().min(1),
  allowedStatuses: z.array(z.enum(['missing', 'approved', 'rejected', 'waived'])),
  requiredOwnerInputs: z.array(ownerEvidenceInputSchema),
  gateState: z.object({
    readyForRpEditBrief16: z.boolean(),
    externalBetaAllowed: z.boolean(),
    realUserMediaBetaAllowed: z.boolean(),
    paidProductionAllowed: z.boolean(),
    supabasePersistenceImplementationAllowed: z.boolean(),
  }).strict(),
  nextMilestoneWhenComplete: z.string().min(1),
}).strict()

function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasIsoTimestamp(value: string | null | undefined): value is string {
  return hasText(value) && !Number.isNaN(Date.parse(value))
}

export function parseProjectEditBriefOwnerEvidenceIntake(value: unknown): ProjectEditBriefOwnerEvidenceParseResult {
  const parsed = ownerEvidenceIntakeSchema.safeParse(value)
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
        return `${path}: ${issue.message}`
      }),
    }
  }

  return {
    success: true,
    intake: parsed.data,
  }
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

export function scanProjectEditBriefOwnerEvidenceSafety(
  intake: ProjectEditBriefOwnerEvidenceIntake,
): ProjectEditBriefOwnerEvidenceSafetyScan {
  const secretLikeEvidence: string[] = []
  const signedUrlEvidence: string[] = []
  const rawPromptEvidence: string[] = []
  const privateArtifactEvidence: string[] = []

  function scan(value: unknown, path: string) {
    if (typeof value !== 'string') {
      return
    }
    if (secretLikePattern.test(value)) {
      secretLikeEvidence.push(path)
    }
    if (signedUrlPattern.test(value)) {
      signedUrlEvidence.push(path)
    }
    if (rawPromptPattern.test(value)) {
      rawPromptEvidence.push(path)
    }
    if (privateArtifactPattern.test(value)) {
      privateArtifactEvidence.push(path)
    }
  }

  scan(intake.id, 'intake.id')
  scan(intake.milestone, 'intake.milestone')
  scan(intake.status, 'intake.status')
  scan(intake.decision, 'intake.decision')
  scan(intake.nextMilestoneWhenComplete, 'intake.nextMilestoneWhenComplete')

  intake.requiredOwnerInputs.forEach((input, inputIndex) => {
    const prefix = `requiredOwnerInputs[${inputIndex}:${input.id}]`
    scan(input.id, `${prefix}.id`)
    scan(input.label, `${prefix}.label`)
    scan(input.status, `${prefix}.status`)
    scan(input.owner, `${prefix}.owner`)
    scan(input.evidenceRef, `${prefix}.evidenceRef`)
    scan(input.reviewedAt, `${prefix}.reviewedAt`)
    if (Array.isArray(input.notes)) {
      input.notes.forEach((note, noteIndex) => scan(note, `${prefix}.notes[${noteIndex}]`))
    }
  })

  const findings = [
    ...secretLikeEvidence.map((path) => `${path} contains secret-like evidence.`),
    ...signedUrlEvidence.map((path) => `${path} contains signed URL-like evidence.`),
    ...rawPromptEvidence.map((path) => `${path} contains raw prompt-like evidence.`),
    ...privateArtifactEvidence.map((path) => `${path} references private/media artifact-like evidence.`),
  ]

  return {
    safe: findings.length === 0,
    secretLikeEvidence,
    signedUrlEvidence,
    rawPromptEvidence,
    privateArtifactEvidence,
    findings,
  }
}
