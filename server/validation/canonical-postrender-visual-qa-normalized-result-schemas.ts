import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_POSTRENDER_VISUAL_QA_NORMALIZED_RESULT_VERSION,
  type CanonicalPostrenderVisualQaNormalizedResult,
} from '../../src/types/canonical-postrender-visual-qa-normalized-result'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegativeInteger = z.number().int().nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
const evidenceRef = z.object({
  id: identity,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const domainRef = z.object({
  id: identity,
  version: identity,
  contentHash: rawSha256,
}).strict()
const safeSummary = z.string().trim().min(1).max(1_000).superRefine(
  (value, context) => {
    if (/(?:https?:\/\/|file:|data:|blob:|javascript:|\/Users\/|\/Volumes\/|\/tmp\/|\\|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,})/iu
      .test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Normalized visual-QA summary contains unsafe text.',
      })
    }
  },
)

const coreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_NORMALIZED_RESULT_VERSION),
  normalizedResultId: identity,
  normalizedResultDigestSha256: prefixedSha256,
  scope: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedSnapshotId: identity,
  }).strict(),
  output: z.object({
    outputId: identity,
    aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5', 'original', 'custom']),
    width: positiveInteger.max(8_192),
    height: positiveInteger.max(8_192),
    fpsNumerator: positiveInteger.max(240_000),
    fpsDenominator: positiveInteger.max(10_000),
    confirmedOutputFrameRef: domainRef,
    confirmedByUser: z.literal(true),
    confirmationRecordId: identity,
  }).strict(),
  requestRef: evidenceRef,
  providerExecutionReceiptRef: evidenceRef,
  persistedEvidenceArtifactRef: evidenceRef,
  independentArtifactQaRef: evidenceRef,
  assetManifestReconciliationRef: evidenceRef,
  decision: z.enum([
    'passed',
    'repair_required',
    'needs_human_review',
    'blocked_evidence_reconciliation',
  ]),
  userFacingSummary: safeSummary,
  deterministicQaPassed: z.literal(true),
  exactApprovedRenderBound: z.literal(true),
  actualModelInferenceVerified: z.literal(true),
  deterministicAndModelEvidenceAgree: z.boolean(),
  canonicalEvidenceReconciled: z.boolean(),
  modelInspectionCoverage: z.object({
    scope: z.enum([
      'complete_segment_coverage',
      'bounded_representative_segment_coverage',
    ]),
    sampledSegmentCount: positiveInteger,
    unsampledSegmentCount: nonnegativeInteger,
    modelInspectedOnlyPlannedSamples: z.literal(true),
    unsampledSegmentsNeverImpliedInspected: z.literal(true),
  }).strict(),
  smallestScopeRepairRequired: z.boolean(),
  privateHumanReviewRequired: z.boolean(),
  actualCompleteTimeVisualReviewPassed: z.boolean(),
  rawModelTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  browserLocalStateUsed: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalPostrenderVisualQaNormalizedResultSchema =
  coreSchema.superRefine((value, context) => {
    const completeCoverage = value.modelInspectionCoverage.scope ===
      'complete_segment_coverage'
      && value.modelInspectionCoverage.unsampledSegmentCount === 0
    const passed = value.decision === 'passed'
    const repair = value.decision === 'repair_required'
    const human = value.decision === 'needs_human_review'
    const blocked = value.decision === 'blocked_evidence_reconciliation'
    if (
      value.normalizedResultDigestSha256 !==
        digestCanonicalPostrenderVisualQaNormalizedResult(value)
      || !dimensionsMatch(value.output.aspectRatio,
        value.output.width, value.output.height)
      || passed !== value.actualCompleteTimeVisualReviewPassed
      || (passed && (!completeCoverage
        || !value.deterministicAndModelEvidenceAgree
        || !value.canonicalEvidenceReconciled
        || value.smallestScopeRepairRequired
        || value.privateHumanReviewRequired))
      || repair !== value.smallestScopeRepairRequired
      || human !== value.privateHumanReviewRequired
      || blocked === value.canonicalEvidenceReconciled
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical normalized post-render visual-QA result is inconsistent.',
      })
    }
  })

export function parseCanonicalPostrenderVisualQaNormalizedResult(
  value: unknown,
): CanonicalPostrenderVisualQaNormalizedResult {
  assertClosedContractTree(value,
    'Canonical normalized post-render visual-QA result')
  return structuredClone(canonicalPostrenderVisualQaNormalizedResultSchema.parse(
    value)) as CanonicalPostrenderVisualQaNormalizedResult
}

export function digestCanonicalPostrenderVisualQaNormalizedResult(
  value: CanonicalPostrenderVisualQaNormalizedResult,
): string {
  return `sha256:${createHash('sha256').update(stableStringify({
    ...value,
    normalizedResultDigestSha256: null,
  })).digest('hex')}`
}

function dimensionsMatch(
  ratio: CanonicalPostrenderVisualQaNormalizedResult['output']['aspectRatio'],
  width: number,
  height: number,
): boolean {
  if (ratio === 'custom' || ratio === 'original') return true
  const [x, y] = ratio.split(':').map(Number) as [number, number]
  return Math.abs(width / height - x / y) <= 0.01
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, stableJsonValue(item)]))
}
