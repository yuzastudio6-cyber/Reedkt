import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
  type CanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../../src/types/canonical-postrender-visual-qa-lifecycle'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRef = z.object({
  id: identity,
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentHash: prefixedSha256,
}).strict()

const canonicalPostrenderVisualQaSharedLifecycleResultCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
  ),
  lifecycleResultId: identity,
  lifecycleResultDigestSha256: prefixedSha256,
  sharedProviderCapabilityId: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  ),
  sharedProviderOperationId: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  ),
  sharedProviderOperationVersion: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  ),
  scope: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedSnapshotId: identity,
  }).strict(),
  requestRef: evidenceRef,
  normalizedResultRef: evidenceRef,
  providerWorkPackageRef: evidenceRef,
  approvedSnapshotRef: evidenceRef,
  approvedWorkItemRef: evidenceRef,
  workerLeaseRef: evidenceRef,
  providerDispatchGrantRef: evidenceRef,
  providerAttemptRef: evidenceRef,
  providerRunRef: evidenceRef,
  estimateCostBindingRef: evidenceRef,
  resultRuntimeRecordRef: evidenceRef,
  modelQualificationRef: evidenceRef,
  sampleCollectionRef: evidenceRef,
  sampledFrameRefs: z.array(z.object({
    sampleId: identity,
    sourceRenderKind: z.enum(['full_motion', 'reduced_motion']),
    frameNumber: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    frameArtifactRef: evidenceRef,
    frameSha256: rawSha256,
  }).strict()).min(1).max(4_096),
  providerAuthorityHashSha256: rawSha256,
  providerRequestHashSha256: rawSha256,
  providerResponseHashSha256: rawSha256,
  executionAttestationHashSha256: rawSha256,
  executionAttemptId: identity,
  replayTuple: z.object({
    idempotencyKey: identity,
    requestDigestSha256: rawSha256,
    attemptOrdinal: z.number().int().positive().max(2),
    disposition: z.enum([
      'fresh_execution',
      'idempotent_result_replay',
    ]),
    replayOfAttemptId: identity.optional(),
  }).strict(),
  providerBoundary: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
  ),
  canonicalProviderModel: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
  ),
  modelRoleId: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  ),
  requestedModelUse: z.literal('visual_understanding'),
  startedAt: timestamp,
  finishedAt: timestamp,
  actualModelInferenceExecuted: z.literal(true),
  exactApprovedFramesInspected: z.literal(true),
  allSampleFrameDigestsMatched: z.literal(true),
  structuredOutputSchemaValidated: z.literal(true),
  providerResponseNormalizedByServer: z.literal(true),
  canonicalLifecycleAdmissionVerified: z.literal(true),
  workerLeaseVerified: z.literal(true),
  estimateCostBindingVerified: z.literal(true),
  resultRuntimePersistenceVerified: z.literal(true),
  executionAttestationVerified: z.literal(true),
  replayProtectionVerified: z.literal(true),
  responseContainsRawModelText: z.literal(false),
  providerSecretsIncluded: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  callerPromptOrExecutableTextAccepted: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalPostrenderVisualQaSharedLifecycleResultSchema =
  canonicalPostrenderVisualQaSharedLifecycleResultCoreSchema.superRefine(
    (value, context) => {
      const sampleIds = value.sampledFrameRefs.map((sample) => sample.sampleId)
      const frameIdentities = value.sampledFrameRefs.map((sample) => [
        sample.sourceRenderKind,
        sample.frameNumber,
      ].join(':'))
      const replayIsValid = value.replayTuple.disposition === 'fresh_execution'
        ? value.replayTuple.replayOfAttemptId === undefined
        : Boolean(value.replayTuple.replayOfAttemptId)
      if (
        value.lifecycleResultDigestSha256 !==
          digestCanonicalPostrenderVisualQaSharedLifecycleResult(value) ||
        value.scope.approvedSnapshotId !== value.approvedSnapshotRef.id ||
        value.executionAttemptId !== value.providerAttemptRef.id ||
        value.replayTuple.requestDigestSha256 !==
          value.providerRequestHashSha256 ||
        !replayIsValid ||
        new Set(sampleIds).size !== sampleIds.length ||
        new Set(frameIdentities).size !== frameIdentities.length ||
        value.sampledFrameRefs.some((sample) =>
          sample.frameArtifactRef.contentHash !== `sha256:${sample.frameSha256}`
        ) ||
        Date.parse(value.finishedAt) < Date.parse(value.startedAt)
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'Canonical post-render visual-QA shared lifecycle result is inconsistent.',
        })
      }
    },
  )

export function digestCanonicalPostrenderVisualQaSharedLifecycleResult(
  result: CanonicalPostrenderVisualQaSharedLifecycleResult,
): string {
  return `sha256:${createHash('sha256')
    .update(stableStringify({
      ...result,
      lifecycleResultDigestSha256: null,
    }))
    .digest('hex')}`
}

export function parseCanonicalPostrenderVisualQaSharedLifecycleResult(
  value: unknown,
): CanonicalPostrenderVisualQaSharedLifecycleResult {
  return canonicalPostrenderVisualQaSharedLifecycleResultSchema.parse(value)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableJsonValue(item)]),
  )
}
