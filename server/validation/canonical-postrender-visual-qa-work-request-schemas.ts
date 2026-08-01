import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
} from '../../src/types/canonical-postrender-visual-qa-lifecycle'
import {
  CANONICAL_POSTRENDER_VISUAL_QA_SAMPLE_PLAN_VERSION,
  CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION,
  type CanonicalPostrenderVisualQaWorkRequest,
  type CanonicalPostrenderVisualQaWorkRequestInput,
} from '../../src/types/canonical-postrender-visual-qa-work-request'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegativeSafeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const evidenceRef = z.object({
  id: identity,
  version: positiveSafeInteger,
  contentHash: prefixedSha256,
}).strict()

const sampleSchema = z.object({
  sampleId: identity,
  segmentId: identity,
  sourceRenderKind: z.enum(['full_motion', 'reduced_motion']),
  frameNumber: nonnegativeSafeInteger,
  startFrame: nonnegativeSafeInteger,
  endFrameExclusive: positiveSafeInteger,
  width: positiveSafeInteger.max(8_192),
  height: positiveSafeInteger.max(8_192),
  pixelFormat: z.literal('rgb24'),
  frameArtifactRef: evidenceRef,
  frameSha256: rawSha256,
  createOnlyPersistenceVerified: z.literal(true),
  exactRereadVerified: z.literal(true),
  independentArtifactQaPassed: z.literal(true),
}).strict()

const canonicalPostrenderVisualQaWorkRequestCoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION),
  workRequestId: identity,
  workRequestDigestSha256: prefixedSha256,
  sharedProviderCapabilityId: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  ),
  sharedProviderOperationId: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  ),
  sharedProviderOperationVersion: z.literal(
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  ),
  providerBoundary: z.literal(CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY),
  canonicalProviderModel: z.literal(CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL),
  requestedModelUse: z.literal('visual_understanding'),
  scope: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedSnapshotId: identity,
  }).strict(),
  approvedSnapshotRef: evidenceRef,
  executionPackageRef: evidenceRef,
  approvedWorkItemRef: evidenceRef,
  creditReservationRef: evidenceRef,
  privateRenderArtifactRef: evidenceRef,
  deterministicQaRef: evidenceRef,
  estimateCostBindingRef: evidenceRef,
  sampleCollectionRef: evidenceRef,
  render: z.object({
    artifactId: identity,
    artifactVersion: positiveSafeInteger,
    contentHash: prefixedSha256,
    width: positiveSafeInteger.max(8_192),
    height: positiveSafeInteger.max(8_192),
    fpsNumerator: positiveSafeInteger.max(240_000),
    fpsDenominator: positiveSafeInteger.max(10_000),
    frameCount: positiveSafeInteger,
    durationFrames: positiveSafeInteger,
    privateCreateOnlyVerified: z.literal(true),
    exactRereadVerified: z.literal(true),
    deterministicQaPassed: z.literal(true),
  }).strict(),
  samplePlan: z.object({
    schemaVersion: z.literal(CANONICAL_POSTRENDER_VISUAL_QA_SAMPLE_PLAN_VERSION),
    coverageScope: z.enum(['complete', 'bounded_representative']),
    canonicalSegmentCount: positiveSafeInteger.max(100_000),
    sampledSegmentIds: z.array(identity).min(1).max(100_000),
    sampledSegmentCount: positiveSafeInteger.max(100_000),
    unsampledSegmentCount: nonnegativeSafeInteger.max(100_000),
    modelInspectsOnlyProvidedSampleArtifacts: z.literal(true),
    unsampledContentInspectionClaimAllowed: z.literal(false),
    completeTimeCoverageClaimAllowed: z.boolean(),
    samples: z.array(sampleSchema).min(1).max(4_096),
  }).strict(),
  inspectionProfile: z.object({
    profileId: identity,
    profileVersion: positiveSafeInteger,
    profileDigestSha256: rawSha256,
    normalizedResponseSchemaId: identity,
    normalizedResponseSchemaDigestSha256: rawSha256,
    serverOwnedInstructions: z.literal(true),
    rawPromptSerialized: z.literal(false),
    callerProvidedPromptAccepted: z.literal(false),
  }).strict(),
  replay: z.object({
    idempotencyKey: identity,
    requestOrdinal: z.number().int().min(1).max(2),
    maximumAttempts: z.literal(2),
  }).strict(),
  boundaries: z.object({
    requestAdmissionOnly: z.literal(true),
    providerDispatchGranted: z.literal(false),
    providerCallMade: z.literal(false),
    modelInferenceExecuted: z.literal(false),
    resultPersisted: z.literal(false),
    qaApprovalGranted: z.literal(false),
    repairGranted: z.literal(false),
    assetMutationGranted: z.literal(false),
    customerChargeCreated: z.literal(false),
    walletMutationMade: z.literal(false),
    publicDeliveryCreated: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
}).strict()

export const canonicalPostrenderVisualQaWorkRequestSchema =
  canonicalPostrenderVisualQaWorkRequestCoreSchema.superRefine(
    (value, context) => {
      const sampledSegmentIds = value.samplePlan.sampledSegmentIds
      const sampleIds = value.samplePlan.samples.map((sample) => sample.sampleId)
      const sampledFrames = value.samplePlan.samples.map((sample) => [
        sample.sourceRenderKind,
        sample.frameNumber,
      ].join(':'))
      const everySegmentSampled = sampledSegmentIds.every((segmentId) =>
        value.samplePlan.samples.some((sample) => sample.segmentId === segmentId))
      const complete = value.samplePlan.coverageScope === 'complete'
      if (
        value.workRequestDigestSha256 !==
          digestCanonicalPostrenderVisualQaWorkRequest(value) ||
        value.scope.approvedSnapshotId !== value.approvedSnapshotRef.id ||
        value.render.artifactId !== value.privateRenderArtifactRef.id ||
        value.render.artifactVersion !== value.privateRenderArtifactRef.version ||
        value.render.contentHash !== value.privateRenderArtifactRef.contentHash ||
        value.render.durationFrames !== value.render.frameCount ||
        new Set(sampledSegmentIds).size !== sampledSegmentIds.length ||
        value.samplePlan.sampledSegmentCount !== sampledSegmentIds.length ||
        value.samplePlan.canonicalSegmentCount !==
          value.samplePlan.sampledSegmentCount +
            value.samplePlan.unsampledSegmentCount ||
        (complete && (
          value.samplePlan.unsampledSegmentCount !== 0 ||
          !value.samplePlan.completeTimeCoverageClaimAllowed
        )) ||
        (!complete && value.samplePlan.completeTimeCoverageClaimAllowed) ||
        new Set(sampleIds).size !== sampleIds.length ||
        new Set(sampledFrames).size !== sampledFrames.length ||
        !everySegmentSampled ||
        value.samplePlan.samples.some((sample) =>
          !sampledSegmentIds.includes(sample.segmentId) ||
          sample.frameNumber >= value.render.frameCount ||
          sample.startFrame >= sample.endFrameExclusive ||
          sample.frameNumber < sample.startFrame ||
          sample.frameNumber >= sample.endFrameExclusive ||
          sample.width !== value.render.width ||
          sample.height !== value.render.height ||
          sample.frameArtifactRef.contentHash !== `sha256:${sample.frameSha256}`
        )
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Canonical post-render visual-QA work request is inconsistent.',
        })
      }
    },
  )

export function createCanonicalPostrenderVisualQaWorkRequest(
  input: CanonicalPostrenderVisualQaWorkRequestInput,
): CanonicalPostrenderVisualQaWorkRequest {
  const fixed = {
    schemaVersion: CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION,
    sharedProviderCapabilityId:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
    sharedProviderOperationId:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
    sharedProviderOperationVersion:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
    providerBoundary: CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
    canonicalProviderModel: CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
    requestedModelUse: 'visual_understanding' as const,
    ...input,
    boundaries: {
      requestAdmissionOnly: true as const,
      providerDispatchGranted: false as const,
      providerCallMade: false as const,
      modelInferenceExecuted: false as const,
      resultPersisted: false as const,
      qaApprovalGranted: false as const,
      repairGranted: false as const,
      assetMutationGranted: false as const,
      customerChargeCreated: false as const,
      walletMutationMade: false as const,
      publicDeliveryCreated: false as const,
      productionAuthority: false as const,
    },
  }
  const identityDigest = rawDigest({
    domain: 'reeditpro:canonical-postrender-visual-qa-work-request-id:v1',
    ...fixed,
  })
  const withoutDigest = {
    ...fixed,
    workRequestId: `postrender_visual_qa_request_${identityDigest.slice(0, 32)}`,
  }
  return canonicalPostrenderVisualQaWorkRequestSchema.parse({
    ...withoutDigest,
    workRequestDigestSha256: digestCanonicalPostrenderVisualQaWorkRequest({
      ...withoutDigest,
      workRequestDigestSha256: 'sha256:'.padEnd(71, '0'),
    }),
  })
}

export function parseCanonicalPostrenderVisualQaWorkRequest(
  value: unknown,
): CanonicalPostrenderVisualQaWorkRequest {
  return canonicalPostrenderVisualQaWorkRequestSchema.parse(value)
}

export function digestCanonicalPostrenderVisualQaWorkRequest(
  request: CanonicalPostrenderVisualQaWorkRequest,
): string {
  return `sha256:${rawDigest({
    ...request,
    workRequestDigestSha256: null,
  })}`
}

function rawDigest(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
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
