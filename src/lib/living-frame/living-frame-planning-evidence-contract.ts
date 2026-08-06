import { z } from 'zod'

import {
  LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_SOURCE,
  LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_VERSION,
  LIVING_FRAME_PLANNING_EVIDENCE_RUNTIME_READINESS,
  type LivingFramePlanningEvidenceAuthorityBoundary,
  type LivingFramePlanningEvidenceBinding,
  type LivingFramePlanningEvidenceBindingDraft,
  type LivingFramePlanningEvidenceValidationResult,
} from '../../types/living-frame-planning-evidence'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const URL_OR_EXECUTABLE_URI =
  /(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/|www\.|data:|javascript:|blob:|mailto:)/iu
const FILESYSTEM_PATH_PREFIX =
  /(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/])/u
const SECRET_LIKE =
  /(?:\bBearer\s+[A-Za-z0-9._~+/-]+=*|\bsk-[A-Za-z0-9_-]{8,}|\bAIza[A-Za-z0-9_-]{8,}|BEGIN [A-Z ]*PRIVATE KEY|(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=])/iu

const safeIdSchema = z.string().min(1).max(240)
  .regex(SAFE_ID)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256Schema = z.string().regex(SHA256)
const safeSummarySchema = z.string().trim().min(1).max(1_000)
  .refine(
    (value) => !hasControlCharacter(value),
    'Control characters are forbidden.',
  )
  .refine(
    (value) =>
      !URL_OR_EXECUTABLE_URI.test(value)
      && !FILESYSTEM_PATH_PREFIX.test(value),
    'URLs and filesystem paths are forbidden.',
  )
  .refine((value) => !SECRET_LIKE.test(value), 'Secret-like content is forbidden.')

const observationCategorySchema = z.enum([
  'scene',
  'object',
  'person',
  'action',
  'camera_motion',
  'visible_text',
  'layout',
  'continuity',
  'broll_opportunity',
  'visual_risk',
  'color_or_lighting',
])

const authorityBoundarySchema = z.object({
  planningEvidenceOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  executionAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  costAuthority: z.literal(false),
  qaAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const canonicalBindingsSchema = z.object({
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  livingFrameComponentDigestSha256: sha256Schema,
  compiledIntentDigestSha256: sha256Schema,
  sourceSequenceDigestSha256: sha256Schema,
  outputFrameDigestSha256: sha256Schema,
  masterTimingDigestSha256: sha256Schema,
  ideaFirstAuthorityDigestSha256: sha256Schema.nullable(),
}).strict()

const observationProjectionSchema = z.object({
  observationId: safeIdSchema,
  order: z.number().int().nonnegative().max(49_999),
  startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  category: observationCategorySchema,
  summary: safeSummarySchema,
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  evidenceSampleCount: z.number().int().positive().max(20_000),
  evidenceSampleSetDigestSha256: sha256Schema,
}).strict().superRefine((observation, context) => {
  if (observation.endFrameExclusive <= observation.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endFrameExclusive'],
      message: 'Observation range must be positive.',
    })
  }
})

const sourceEvidenceProjectionSchema = z.object({
  sourceSequenceItemId: safeIdSchema,
  mediaAssetId: safeIdSchema,
  uploadedOrder: z.number().int().positive().max(10_000),
  sourceChecksumSha256: sha256Schema,
  planHashSha256: sha256Schema,
  evidencePackageHashSha256: sha256Schema,
  checkpointSha256: sha256Schema,
  coverageDigestSha256: sha256Schema,
  cacheKeySha256: sha256Schema,
  observationCount: z.number().int().positive().max(50_000),
  observations: z.array(observationProjectionSchema).min(1).max(50_000),
  observationSetDigestSha256: sha256Schema,
  reasoningConsumptionAllowed: z.literal(true),
  userReviewRequired: z.literal(false),
}).strict().superRefine((source, context) => {
  if (source.observationCount !== source.observations.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['observationCount'],
      message: 'Observation count must match the projected observations.',
    })
  }
  assertOrderedUnique(
    source.observations,
    (entry) => entry.order,
    (entry) => entry.observationId,
    ['observations'],
    context,
  )
})

export const LIVING_FRAME_PLANNING_EVIDENCE_AUTHORITY_BOUNDARY =
  Object.freeze({
    planningEvidenceOnly: true,
    liveEvidenceAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    executionAuthority: false,
    runtimeAuthority: false,
    queueAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    costAuthority: false,
    qaAuthority: false,
    productionReady: false,
  } satisfies LivingFramePlanningEvidenceAuthorityBoundary)

export const livingFramePlanningEvidenceBindingDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_VERSION,
  ),
  contractSource: z.literal(LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_SOURCE),
  status: z.enum([
    'available_for_preapproval_reasoning',
    'not_applicable_idea_first',
  ]),
  runtimeReadiness: z.literal(
    LIVING_FRAME_PLANNING_EVIDENCE_RUNTIME_READINESS,
  ),
  sourceMode: z.enum(['uploaded_media', 'idea_first_no_uploaded_media']),
  evidenceClass: z.enum([
    'private_source_bound_visual_observation_projection',
    'not_applicable_canonical_idea_first',
  ]),
  canonicalBindings: canonicalBindingsSchema,
  sourceEvidence: z.array(sourceEvidenceProjectionSchema).max(1_000),
  sourceEvidenceCount: z.number().int().nonnegative().max(1_000),
  evidenceSetDigestSha256: sha256Schema,
  authorityBoundary: authorityBoundarySchema,
}).strict().superRefine((binding, context) => {
  if (binding.sourceEvidenceCount !== binding.sourceEvidence.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceEvidenceCount'],
      message: 'Source evidence count must match the projected source set.',
    })
  }
  assertOrderedUnique(
    binding.sourceEvidence,
    (entry) => entry.uploadedOrder - 1,
    (entry) => `${entry.sourceSequenceItemId}\u0000${entry.mediaAssetId}`,
    ['sourceEvidence'],
    context,
  )
  if (binding.sourceMode === 'uploaded_media') {
    if (
      binding.status !== 'available_for_preapproval_reasoning'
      || binding.evidenceClass !==
        'private_source_bound_visual_observation_projection'
      || binding.sourceEvidence.length < 1
      || binding.canonicalBindings.ideaFirstAuthorityDigestSha256 !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceMode'],
        message: 'Uploaded-media evidence semantics are inconsistent.',
      })
    }
  } else if (
    binding.status !== 'not_applicable_idea_first'
    || binding.evidenceClass !== 'not_applicable_canonical_idea_first'
    || binding.sourceEvidence.length !== 0
    || binding.canonicalBindings.ideaFirstAuthorityDigestSha256 === null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceMode'],
      message: 'Idea-first evidence must be explicitly not applicable.',
    })
  }
})

export const livingFramePlanningEvidenceBindingSchema =
  livingFramePlanningEvidenceBindingDraftSchema.extend({
    contractDigestSha256: sha256Schema,
  }).strict()

export async function createLivingFramePlanningEvidenceBinding(
  input: LivingFramePlanningEvidenceBindingDraft,
): Promise<LivingFramePlanningEvidenceBinding> {
  const normalized = normalizeLivingFramePlanningEvidenceBindingDraft(input)
  return {
    ...normalized,
    contractDigestSha256:
      await calculateLivingFramePlanningEvidenceDigest(normalized),
  }
}

export function normalizeLivingFramePlanningEvidenceBindingDraft(
  input: LivingFramePlanningEvidenceBindingDraft,
): LivingFramePlanningEvidenceBindingDraft {
  const parsed = livingFramePlanningEvidenceBindingDraftSchema.parse(input)
  return {
    ...parsed,
    canonicalBindings: { ...parsed.canonicalBindings },
    sourceEvidence: parsed.sourceEvidence.map((source) => ({
      ...source,
      observations: source.observations.map((observation) => ({
        ...observation,
      })),
    })),
    authorityBoundary: { ...parsed.authorityBoundary },
  }
}

export async function validateLivingFramePlanningEvidenceBinding(
  input: unknown,
): Promise<LivingFramePlanningEvidenceValidationResult> {
  const parsed = livingFramePlanningEvidenceBindingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: 'schema_invalid' as const,
        path: issue.path.join('.'),
      })),
    }
  }
  const {
    contractDigestSha256: suppliedDigest,
    ...draft
  } = parsed.data
  void suppliedDigest
  const expectedDigest =
    await calculateLivingFramePlanningEvidenceDigest(draft)
  if (expectedDigest !== parsed.data.contractDigestSha256) {
    return {
      ok: false,
      issues: [{
        code: 'contract_digest_invalid',
        path: 'contractDigestSha256',
      }],
    }
  }
  const sourceDigests = await Promise.all(
    parsed.data.sourceEvidence.map((source) =>
      calculateLivingFramePlanningEvidenceDigest(source.observations)),
  )
  const invalidSourceIndex = parsed.data.sourceEvidence.findIndex(
    (source, index) =>
      source.observationSetDigestSha256 !== sourceDigests[index],
  )
  if (invalidSourceIndex >= 0) {
    return {
      ok: false,
      issues: [{
        code: 'semantic_invariant_invalid',
        path:
          `sourceEvidence.${invalidSourceIndex}.observationSetDigestSha256`,
      }],
    }
  }
  const evidenceSetDigest =
    await calculateLivingFramePlanningEvidenceDigest(
      parsed.data.sourceEvidence,
    )
  if (evidenceSetDigest !== parsed.data.evidenceSetDigestSha256) {
    return {
      ok: false,
      issues: [{
        code: 'semantic_invariant_invalid',
        path: 'evidenceSetDigestSha256',
      }],
    }
  }
  return { ok: true, binding: parsed.data }
}

export async function calculateLivingFramePlanningEvidenceDigest(
  value: unknown,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Living Frame planning evidence requires browser-safe SHA-256.',
    )
  }
  const canonicalJson = JSON.stringify(canonicalJsonValue(value, new Set()))
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalJson),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function assertOrderedUnique<T>(
  values: readonly T[],
  orderOf: (value: T) => number,
  identityOf: (value: T) => string,
  path: Array<string | number>,
  context: z.RefinementCtx,
): void {
  const identities = new Set<string>()
  values.forEach((value, index) => {
    const identity = identityOf(value)
    if (orderOf(value) !== index || identities.has(identity)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, index],
        message: 'Entries must be unique and in contiguous semantic order.',
      })
    }
    identities.add(identity)
  })
}

function canonicalJsonValue(
  value: unknown,
  ancestors: Set<object>,
): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Canonical JSON rejects non-finite numbers.')
    }
    return value
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new Error('Canonical JSON rejects cycles.')
    ancestors.add(value)
    const normalized = value.map((entry) =>
      canonicalJsonValue(entry, ancestors))
    ancestors.delete(value)
    return normalized
  }
  if (isPlainRecord(value)) {
    if (ancestors.has(value)) throw new Error('Canonical JSON rejects cycles.')
    ancestors.add(value)
    const normalized = Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => {
          if (entry === undefined) {
            throw new Error('Canonical JSON rejects undefined values.')
          }
          return [key, canonicalJsonValue(entry, ancestors)]
        }),
    )
    ancestors.delete(value)
    return normalized
  }
  throw new Error('Canonical JSON accepts plain JSON values only.')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}
