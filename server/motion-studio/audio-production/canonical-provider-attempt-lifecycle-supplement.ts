import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioCanonicalProviderAttemptPort,
  type MotionStudioCanonicalProviderAttemptPortV1,
} from './canonical-provider-attempt-port'

export const MOTION_STUDIO_PROVIDER_ATTEMPT_LIFECYCLE_SUPPLEMENT_VERSION =
  'motion-studio.provider-attempt-lifecycle-supplement.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const countSchema = z.number().int().min(0).max(32)

export const motionStudioProviderLifecycleRequestCountsSchema = z.object({
  privateInputUploadCount: countSchema,
  generationSubmissionCount: countSchema,
  statusReadCount: countSchema,
  resultReadCount: countSchema,
  binaryDownloadCount: countSchema,
  cancellationCount: countSchema,
  totalLifecycleHttpRequestCount: countSchema,
}).strict().superRefine((value, context) => {
  const total = value.privateInputUploadCount + value.generationSubmissionCount +
    value.statusReadCount + value.resultReadCount + value.binaryDownloadCount +
    value.cancellationCount
  if (total !== value.totalLifecycleHttpRequestCount) {
    context.addIssue({
      code: 'custom',
      path: ['totalLifecycleHttpRequestCount'],
      message: 'Provider lifecycle HTTP request counts must reconcile exactly.',
    })
  }
})

export type MotionStudioProviderLifecycleRequestCounts = z.infer<
  typeof motionStudioProviderLifecycleRequestCountsSchema
>

export const motionStudioProviderAttemptLifecycleSupplementV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_ATTEMPT_LIFECYCLE_SUPPLEMENT_VERSION),
  supplementId: stableIdSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  sourceV1: z.object({
    receiptDigest: digestSchema,
    authorityClass: z.enum(['contract_fixture', 'canonical_backend_verified_runtime']),
    terminalState: z.enum(['succeeded', 'failed', 'unknown_reconciliation_required']),
    legacyProviderRequestCount: z.union([z.literal(0), z.literal(1)]),
    legacyMaximumProviderRequests: z.literal(1),
    legacySemantic: z.literal('generation_submission_count_not_total_http_requests'),
  }).strict(),
  canonicalBackendProjection: z.object({
    receiptSchemaVersion: stableIdSchema,
    receiptHash: digestSchema,
    lifecyclePolicyVersion: stableIdSchema,
    lifecyclePolicyHash: digestSchema,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
      'canonical_backend_verified_runtime',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
      'verified_runtime_private_candidate_ingest_only',
    ]),
    sourceVerified: z.literal(true),
    runtimeVerifierReleased: z.boolean(),
  }).strict(),
  requestAccounting: z.object({
    providerRequestStarted: z.boolean(),
    accountedGenerationSubmissionCount: z.union([z.literal(0), z.literal(1)]),
    injectedSimulationGenerationSubmissionCount: z.union([z.literal(0), z.literal(1)]),
    observedTransport: motionStudioProviderLifecycleRequestCountsSchema,
    ceilings: motionStudioProviderLifecycleRequestCountsSchema,
    continuationRequestsBelongToSameAttempt: z.literal(true),
    retriesAllowed: z.literal(false),
    fallbacksAllowed: z.literal(false),
    redirectsAllowed: z.literal(false),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
    resubmissionWithinAttemptAllowed: z.literal(false),
    unknownOutcomeBlocksNewSubmission: z.literal(true),
    newSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  authorityBoundary: z.object({
    supplementOnly: z.literal(true),
    admissionAuthority: z.literal('none'),
    privateCandidateIngestAuthorized: z.literal(false),
    automaticSelectionAllowed: z.literal(false),
    finalMixAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    browserMaySupplyBackendAuthority: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    costMutationCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  supplementDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const observed = value.requestAccounting.observedTransport
  const ceilings = value.requestAccounting.ceilings
  const countKeys = [
    'privateInputUploadCount',
    'generationSubmissionCount',
    'statusReadCount',
    'resultReadCount',
    'binaryDownloadCount',
    'cancellationCount',
    'totalLifecycleHttpRequestCount',
  ] as const
  const expectedCeilings = canonicalMotionStudioProviderLifecycleCeilings(value.intent)
  const evidence = value.canonicalBackendProjection
  const injected = evidence.evidenceClass === 'private_injected_nonprovider_test'
  const unreleased = evidence.evidenceClass === 'canonical_backend_runtime_unreleased'
  const verified = evidence.evidenceClass === 'canonical_backend_verified_runtime'

  if (
    value.sourceV1.legacyProviderRequestCount !==
      value.requestAccounting.accountedGenerationSubmissionCount ||
    countKeys.some((key) => ceilings[key] !== expectedCeilings[key]) ||
    countKeys.some((key) => observed[key] > ceilings[key]) ||
    observed.generationSubmissionCount !==
      (value.requestAccounting.providerRequestStarted
        ? value.requestAccounting.accountedGenerationSubmissionCount
        : 0) ||
    (injected && (
      evidence.promotionClass !== 'non_promotable_private_injected' ||
      evidence.runtimeVerifierReleased ||
      observed.totalLifecycleHttpRequestCount !== 0 ||
      value.requestAccounting.injectedSimulationGenerationSubmissionCount !==
        value.requestAccounting.accountedGenerationSubmissionCount
    )) ||
    (unreleased && (
      evidence.promotionClass !== 'unreleased_runtime_not_production' ||
      evidence.runtimeVerifierReleased ||
      value.requestAccounting.injectedSimulationGenerationSubmissionCount !== 0
    )) ||
    (verified && (
      evidence.promotionClass !== 'verified_runtime_private_candidate_ingest_only' ||
      !evidence.runtimeVerifierReleased ||
      value.requestAccounting.injectedSimulationGenerationSubmissionCount !== 0
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt lifecycle supplement is inconsistent with its V1 receipt or backend evidence class.',
    })
  }
})

export type MotionStudioProviderAttemptLifecycleSupplementV1 = z.infer<
  typeof motionStudioProviderAttemptLifecycleSupplementV1Schema
>

export function createMotionStudioProviderAttemptLifecycleSupplement(input: {
  sourceReceipt: MotionStudioCanonicalProviderAttemptPortV1
  canonicalBackendProjection: MotionStudioProviderAttemptLifecycleSupplementV1['canonicalBackendProjection']
  requestAccounting: Omit<
    MotionStudioProviderAttemptLifecycleSupplementV1['requestAccounting'],
    'ceilings' |
    'continuationRequestsBelongToSameAttempt' |
    'retriesAllowed' |
    'fallbacksAllowed' |
    'redirectsAllowed' |
    'addressFallbackAllowed' |
    'proxyOrPacAllowed' |
    'resubmissionWithinAttemptAllowed' |
    'unknownOutcomeBlocksNewSubmission' |
    'newSubmissionRequiresFreshApprovedPackageAndAttempt'
  >
}): MotionStudioProviderAttemptLifecycleSupplementV1 {
  const source = assertMotionStudioCanonicalProviderAttemptPort(input.sourceReceipt)
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_ATTEMPT_LIFECYCLE_SUPPLEMENT_VERSION,
    supplementId: `provider-attempt-lifecycle-${source.receiptDigest.slice(0, 48)}`,
    intent: source.intent,
    sourceV1: {
      receiptDigest: source.receiptDigest,
      authorityClass: source.authorityClass,
      terminalState: source.terminalOutcome.state,
      legacyProviderRequestCount: source.terminalOutcome.providerRequestCount,
      legacyMaximumProviderRequests: 1 as const,
      legacySemantic: 'generation_submission_count_not_total_http_requests' as const,
    },
    canonicalBackendProjection: input.canonicalBackendProjection,
    requestAccounting: {
      ...input.requestAccounting,
      ceilings: canonicalMotionStudioProviderLifecycleCeilings(source.intent),
      continuationRequestsBelongToSameAttempt: true as const,
      retriesAllowed: false as const,
      fallbacksAllowed: false as const,
      redirectsAllowed: false as const,
      addressFallbackAllowed: false as const,
      proxyOrPacAllowed: false as const,
      resubmissionWithinAttemptAllowed: false as const,
      unknownOutcomeBlocksNewSubmission: true as const,
      newSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
    },
    authorityBoundary: {
      supplementOnly: true as const,
      admissionAuthority: 'none' as const,
      privateCandidateIngestAuthorized: false as const,
      automaticSelectionAllowed: false as const,
      finalMixAllowed: false as const,
      timelineMutationAllowed: false as const,
      browserMaySupplyBackendAuthority: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      costMutationCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioProviderAttemptLifecycleSupplementV1Schema.parse({
    ...base,
    supplementDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioProviderAttemptLifecycleSupplement(
  input: MotionStudioProviderAttemptLifecycleSupplementV1,
): MotionStudioProviderAttemptLifecycleSupplementV1 {
  const parsed = motionStudioProviderAttemptLifecycleSupplementV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.supplementDigest
  if (sha256CanonicalJson(base) !== parsed.supplementDigest) {
    blocked('Provider-attempt lifecycle supplement failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

export function canonicalMotionStudioProviderLifecycleCeilings(
  intent: MotionStudioProviderAttemptLifecycleSupplementV1['intent'],
): MotionStudioProviderLifecycleRequestCounts {
  return intent === 'generated_music_candidate'
    ? requestCounts({ generationSubmissionCount: 1 })
    : requestCounts({
        privateInputUploadCount: 1,
        generationSubmissionCount: 1,
        statusReadCount: 12,
        resultReadCount: 1,
        binaryDownloadCount: 1,
        cancellationCount: 1,
      })
}

function requestCounts(
  overrides: Partial<MotionStudioProviderLifecycleRequestCounts>,
): MotionStudioProviderLifecycleRequestCounts {
  const counts = {
    privateInputUploadCount: 0,
    generationSubmissionCount: 0,
    statusReadCount: 0,
    resultReadCount: 0,
    binaryDownloadCount: 0,
    cancellationCount: 0,
    totalLifecycleHttpRequestCount: 0,
    ...overrides,
  }
  counts.totalLifecycleHttpRequestCount = counts.privateInputUploadCount +
    counts.generationSubmissionCount + counts.statusReadCount +
    counts.resultReadCount + counts.binaryDownloadCount + counts.cancellationCount
  return motionStudioProviderLifecycleRequestCountsSchema.parse(counts)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_provider_attempt_lifecycle_supplement',
  })
}
