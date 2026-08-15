import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  SKILL_SUPPORT_REQUEST_VERSION,
  type OrchestraSkillCall,
  type OrchestraSkillJobResult,
  type SkillQualificationSnapshot,
  type SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  assertClosedContractTree,
  compareUtf16Lexical,
} from '../../src/lib/closed-contract-validation'

const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeSummary = z.string().min(1).max(500)
const keyList = z.array(safeKey).max(256)

const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()

const artifactRefSchema = refSchema.extend({
  artifactType: safeKey,
  producerSkillKey: safeKey,
  privateArtifact: z.literal(true),
  byteFreeRef: z.literal(true),
  sourceSupportRequestRef: refSchema.nullable(),
}).strict()

const frameRangeSchema = z.object({
  startFrame: z.number().int().min(0),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Frame range must have positive duration.',
    })
  }
})

const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict().superRefine((scope, context) => {
  let lastEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < lastEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Authorized frame ranges must be ordered and non-overlapping.',
      })
      return
    }
    lastEnd = range.endFrameExclusive
  }
})

const authoritySchema = z.object({
  scopeExpansionGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerCallGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const requestedModeSchema = z.enum([
  'planning', 'fixture', 'private_internal', 'production',
])
const scopeLevelSchema = z.enum([
  'clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video',
])

export const skillQualificationSnapshotSchema:
z.ZodType<SkillQualificationSnapshot> = z.object({
  schemaVersion: z.literal(SKILL_QUALIFICATION_SNAPSHOT_VERSION),
  snapshotId: safeKey,
  snapshotDigestSha256: sha256,
  skillKey: safeKey,
  manifestRef: refSchema,
  observedAt: z.string().datetime({ offset: true }),
  releaseRef: refSchema,
  jobEntries: z.array(z.object({
    jobType: safeKey,
    status: z.enum(['qualified', 'blocked', 'disabled']),
    qualifiedModes: z.array(requestedModeSchema).max(4),
    blockerCodes: keyList,
    routeRefs: z.array(refSchema).max(64),
    evidenceRefs: z.array(refSchema).max(256),
    requiredEvidenceTypes: keyList,
    contractDigestSha256: sha256,
    manifestDigestSha256: sha256,
  }).strict()).min(1).max(512),
  wholeSkillQualificationClaimed: z.literal(false),
  productionQualificationClaimed: z.literal(false),
}).strict().superRefine((snapshot, context) => {
  const seen = new Set<string>()
  for (const entry of snapshot.jobEntries) {
    if (seen.has(entry.jobType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate qualification job ${entry.jobType}.`,
      })
    }
    seen.add(entry.jobType)
    if (entry.manifestDigestSha256 !== snapshot.manifestRef.contentHash) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Qualification job ${entry.jobType} has stale manifest lineage.`,
      })
    }
    if (entry.status !== 'qualified' && entry.qualifiedModes.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Blocked qualification job ${entry.jobType} cannot expose qualified modes.`,
      })
    }
    if (entry.status === 'qualified' && entry.qualifiedModes.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Qualified job ${entry.jobType} requires an explicit mode.`,
      })
    }
  }
})

export const orchestraSkillCallSchema: z.ZodType<OrchestraSkillCall> = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_CALL_VERSION),
  callId: safeKey,
  callDigestSha256: sha256,
  idempotencyKey: safeKey,
  caller: z.object({
    callerKind: z.enum([
      'head_of_orchestra', 'internal_test_harness',
      'approved_recovery_controller',
    ]),
    callerId: safeKey,
  }).strict(),
  assigneeSkillKey: safeKey,
  job: z.object({
    jobId: safeKey,
    jobType: safeKey,
    requestedMode: requestedModeSchema,
    scopeLevel: scopeLevelSchema,
  }).strict(),
  canonicalScope: scopeSchema,
  manifestRef: refSchema,
  qualificationSnapshotRef: refSchema,
  inputArtifactRefs: z.array(artifactRefSchema).max(512),
  injectedSupportArtifactRefs: z.array(artifactRefSchema).max(512),
  resumeOfSupportRequestRef: refSchema.nullable(),
  resumeOriginCallRef: refSchema.nullable(),
  authorityBoundary: authoritySchema,
  privateArtifactPolicy: z.object({
    tenantScoped: z.literal(true),
    byteFreeCoordinationOnly: z.literal(true),
    rawChatAllowed: z.literal(false),
    mediaBytesAllowed: z.literal(false),
    urlOrPathAllowed: z.literal(false),
  }).strict(),
}).strict().superRefine((call, context) => {
  if (call.job.scopeLevel === 'scene' && call.canonicalScope.sceneId === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Scene jobs require sceneId.' })
  }
  if (call.job.scopeLevel === 'boundary' && call.canonicalScope.boundaryId === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Boundary jobs require boundaryId.' })
  }
  if (call.resumeOfSupportRequestRef === null
    && call.injectedSupportArtifactRefs.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Support artifacts require an exact support-request resume binding.',
    })
  }
  if ((call.resumeOfSupportRequestRef === null)
    !== (call.resumeOriginCallRef === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Resume request and original-call bindings must appear together.',
    })
  }
  if (call.inputArtifactRefs.some((ref) => ref.sourceSupportRequestRef !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Initial input artifacts cannot claim a support-request source.',
    })
  }
  if (call.injectedSupportArtifactRefs.some((ref) =>
    ref.sourceSupportRequestRef === null
    || call.resumeOfSupportRequestRef === null
    || refKey(ref.sourceSupportRequestRef) !== refKey(call.resumeOfSupportRequestRef))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Every injected support artifact must bind the exact resume request.',
    })
  }
  const refs = [...call.inputArtifactRefs, ...call.injectedSupportArtifactRefs]
  if (new Set(refs.map(refKey)).size !== refs.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Artifact refs must be unique.' })
  }
})

export const skillSupportRequestSchema: z.ZodType<SkillSupportRequest> = z.object({
  schemaVersion: z.literal(SKILL_SUPPORT_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  originalCallRef: refSchema,
  requestingSkillKey: safeKey,
  targetSkillKey: z.enum([
    'visual_intelligence', 'track_all', 'living_frame', 'soundsync',
    'transitions', 'broll_owner', 'canonical_timing_owner',
    'canonical_layout_owner',
  ]),
  reasonCode: safeKey,
  requestedArtifactTypes: keyList,
  canonicalScope: scopeSchema,
  typedPayloadType: safeKey,
  typedPayload: z.unknown(),
  mediationPolicy: z.object({
    hqMediated: z.literal(true),
    directPeerDispatchAllowed: z.literal(false),
    assigneeMayOnlyResumeAfterInjection: z.literal(true),
  }).strict(),
  authorityBoundary: authoritySchema,
}).strict()

export const orchestraSkillJobResultSchema:
z.ZodType<OrchestraSkillJobResult> = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_JOB_RESULT_VERSION),
  resultId: safeKey,
  resultDigestSha256: sha256,
  disposition: z.enum([
    'completed', 'needs_followup', 'blocked', 'unsupported', 'failed',
  ]),
  originalCallRef: refSchema,
  producerSkillKey: safeKey,
  jobType: safeKey,
  manifestRef: refSchema,
  qualificationSnapshotRef: refSchema,
  canonicalScope: scopeSchema,
  producedArtifactRefs: z.array(artifactRefSchema).max(512),
  supportRequests: z.array(skillSupportRequestSchema).max(64),
  reasonCodes: keyList,
  safeUserSummary: safeSummary,
  replayBinding: z.object({
    idempotencyKey: safeKey,
    resumedFromSupportRequestRef: refSchema.nullable(),
    resumeOriginCallRef: refSchema.nullable(),
  }).strict(),
  authorityBoundary: authoritySchema,
}).strict().superRefine((result, context) => {
  if (result.disposition === 'needs_followup' && result.supportRequests.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'needs_followup requires at least one support request.',
    })
  }
  if (result.disposition !== 'needs_followup' && result.supportRequests.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only needs_followup may carry support requests.',
    })
  }
  if ((result.replayBinding.resumedFromSupportRequestRef === null)
    !== (result.replayBinding.resumeOriginCallRef === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Result replay bindings must appear together.',
    })
  }
})

function refKey(ref: { id: string; version: string; contentHash: string }): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function findUnsafeText(value: unknown): string | null {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu.test(current)) {
        return current
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
  return null
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareUtf16Lexical(left, right))
        .map(([key, child]) => [key, stableValue(child)]),
    )
  }
  return Object.is(value, -0) ? 0 : value
}

function digestContract(value: Record<string, unknown>, digestField: string): string {
  const body = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== digestField),
  )
  return createHash('sha256')
    .update(JSON.stringify(stableValue(body)), 'utf8')
    .digest('hex')
}

function parseAndVerify<T>(
  value: unknown,
  label: string,
  schema: z.ZodType<T>,
  digestField: string,
): T {
  assertClosedContractTree(value, label)
  const unsafe = findUnsafeText(value)
  if (unsafe !== null) throw new Error(`${label} contains unsafe text.`)
  const parsed = schema.parse(value)
  const actual = (parsed as Record<string, unknown>)[digestField]
  const expected = digestContract(parsed as Record<string, unknown>, digestField)
  if (actual !== expected) throw new Error(`${label} digest verification failed.`)
  return parsed
}

export function calculateSkillContractDigest(
  value: Record<string, unknown>,
  digestField: string,
): string {
  assertClosedContractTree(value, 'Skill contract digest input')
  return digestContract(value, digestField)
}

export function parseSkillQualificationSnapshot(
  value: unknown,
): SkillQualificationSnapshot {
  return parseAndVerify(
    value,
    'Skill qualification snapshot',
    skillQualificationSnapshotSchema,
    'snapshotDigestSha256',
  )
}

export function parseOrchestraSkillCall(value: unknown): OrchestraSkillCall {
  return parseAndVerify(
    value, 'Orchestra skill call', orchestraSkillCallSchema, 'callDigestSha256',
  )
}

export function parseSkillSupportRequest(value: unknown): SkillSupportRequest {
  return parseAndVerify(
    value, 'Skill support request', skillSupportRequestSchema, 'requestDigestSha256',
  )
}

export function parseOrchestraSkillJobResult(
  value: unknown,
): OrchestraSkillJobResult {
  return parseAndVerify(
    value, 'Orchestra skill job result', orchestraSkillJobResultSchema, 'resultDigestSha256',
  )
}
