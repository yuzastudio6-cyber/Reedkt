import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  MotionStudioProviderAttemptConsumptionExpectationV1,
} from './canonical-provider-attempt-port'

export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_HANDOFF_BINDING_VERSION =
  'motion-studio.canonical-backend-provider-handoff-binding.v1' as const

export const CANONICAL_BACKEND_PROVIDER_LIFECYCLE_COMMIT =
  'fb66bc4444752065a2e6390bc6e1333744199ad9' as const
export const CANONICAL_BACKEND_PROVIDER_LIFECYCLE_TREE =
  'f5f14f3e9f69fb8f04ca93d4118022b648a876d5' as const
export const CANONICAL_BACKEND_PROVIDER_AUTHORITY_SOURCE_SHA256 =
  'c83ca2949fd8df05594aae0b37786c5292d2ee4b2c229394c64c8b30ebbf2c3f' as const
export const CANONICAL_BACKEND_PROVIDER_LIFECYCLE_VERIFICATION_SHA256 =
  '5b0540fa906bee956cc793f5750db9e5cacde220825918c941a214fd26bdaa5e' as const

export const CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_COMMIT =
  '35f5d716b02d21fc02d6cc770b41b95ada2d9b36' as const
export const CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_TREE =
  '7deec37a868661b46ea24bee965e8e5713c1118e' as const
export const CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_SOURCE_SHA256 =
  'a6c3be537c1b1fee0720b689dcce73845624f4b499234fdc8d794e3a307aaa7b' as const
export const CANONICAL_BACKEND_WORKER_RESOURCE_VERIFICATION_SHA256 =
  'c3c5e8fab261929f33d811a483f04d488297ca0efa0ebcb32869ee0c570088f5' as const

export const CANONICAL_LYRIA_PROVIDER_OPERATION_ID =
  'provider.lyria.generate_music_candidate.v1' as const
export const CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID =
  'lyria_3_pro_provider_boundary' as const
export const CANONICAL_LYRIA_PROVIDER_MODEL_ID = 'lyria-3-pro-preview' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const commitSchema = z.string().regex(/^[a-f0-9]{40}$/u)
const identitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

const frozenLyriaOperationSchema = z.object({
  state: z.literal('frozen'),
  intent: z.literal('generated_music_candidate'),
  registryOwner: z.literal('canonical_backend'),
  registryVersion: z.literal('canonical-provider-operation-registry-v1'),
  providerOperationId: z.literal(CANONICAL_LYRIA_PROVIDER_OPERATION_ID),
  providerBoundaryProfileId: z.literal(CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID),
  providerRouteId: z.literal(CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID),
  providerModelId: z.literal(CANONICAL_LYRIA_PROVIDER_MODEL_ID),
  workItemType: z.literal('generate_music_candidate'),
  workerClass: z.literal('audio_processing_worker'),
  expectedOutputRole: z.literal('generated_instrumental_score_candidate'),
  expectedMimeType: z.literal('audio/wav'),
  maximumProviderRequests: z.literal(1),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumRedirects: z.literal(0),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

const pendingFoleyOperationSchema = z.object({
  state: z.literal('backend_owned_pending_freeze'),
  intent: z.literal('synchronized_foley_candidate'),
  registryOwner: z.literal('canonical_backend'),
  providerOperationId: z.null(),
  pendingReason: z.literal('canonical_synchronized_foley_provider_operation_not_admitted'),
}).strict()

export const motionStudioCanonicalBackendProviderHandoffBindingV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_HANDOFF_BINDING_VERSION),
  bindingId: identitySchema,
  createdAt: timestampSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  sharedSources: z.object({
    providerLifecycle: z.object({
      commit: commitSchema,
      tree: commitSchema,
      authoritySourceSha256: digestSchema,
      verificationRecordSha256: digestSchema,
      verdict: z.literal(
        'CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED',
      ),
    }).strict(),
    workerResourceEvidence: z.object({
      commit: commitSchema,
      tree: commitSchema,
      evidenceSourceSha256: digestSchema,
      verificationRecordSha256: digestSchema,
      verdict: z.literal(
        'PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_CONTRACT_ACCEPTED_RUNTIME_ADAPTER_BLOCKED',
      ),
    }).strict(),
  }).strict(),
  operation: z.discriminatedUnion('state', [
    frozenLyriaOperationSchema,
    pendingFoleyOperationSchema,
  ]),
  lifecycle: z.object({
    canonicalPackageQueueClaimLeaseContractFrozen: z.boolean(),
    siblingOneUseProviderDispatchContractFrozen: z.boolean(),
    privateCreateOnlyCandidateContractFrozen: z.boolean(),
    failedAndUnknownAttemptCostRetentionFrozen: z.boolean(),
    injectedProofNonPromotable: z.literal(true),
    realProviderTransportActivated: z.literal(false),
    canonicalMotionReceiptIssued: z.literal(false),
    distributedPersistenceProven: z.literal(false),
  }).strict(),
  resourceCost: z.object({
    providerNeutralEvidenceContractFrozen: z.literal(true),
    providerCostRemainsSeparate: z.literal(true),
    observedCpuMemoryGpuRepresented: z.literal(true),
    installedObserverAdapterPresent: z.literal(false),
    officialCloudRateApproved: z.literal(false),
    invoiceReconciled: z.literal(false),
    historicalSyntheticAttemptsMayBeRewritten: z.literal(false),
  }).strict(),
  motionConsumer: z.object({
    exactOperationBindingConsumable: z.boolean(),
    canonicalBackendRuntimeReceiptVerifierIntegrated: z.literal(false),
    actualCanonicalProviderReceiptPresent: z.literal(false),
    privateCandidateIngestActivated: z.literal(false),
    duplicateQueueCreated: z.literal(false),
    duplicateProviderRegistryCreated: z.literal(false),
    duplicateWorkerMeterCreated: z.literal(false),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  bindingDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const music = value.intent === 'generated_music_candidate'
  if (
    value.operation.intent !== value.intent ||
    value.motionConsumer.exactOperationBindingConsumable !== music ||
    value.lifecycle.canonicalPackageQueueClaimLeaseContractFrozen !== music ||
    value.lifecycle.siblingOneUseProviderDispatchContractFrozen !== music ||
    value.lifecycle.privateCreateOnlyCandidateContractFrozen !== music ||
    value.lifecycle.failedAndUnknownAttemptCostRetentionFrozen !== music
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical backend handoff readiness must match the exact admitted operation.',
    })
  }
})

export type MotionStudioCanonicalBackendProviderHandoffBindingV1 =
  z.infer<typeof motionStudioCanonicalBackendProviderHandoffBindingV1Schema>

export function createMotionStudioCanonicalBackendProviderHandoffBinding(input: {
  intent: MotionStudioCanonicalBackendProviderHandoffBindingV1['intent']
  createdAt: string
}): MotionStudioCanonicalBackendProviderHandoffBindingV1 {
  const createdAt = canonicalIso(input.createdAt)
  const music = input.intent === 'generated_music_candidate'
  const operation = music
    ? {
        state: 'frozen' as const,
        intent: 'generated_music_candidate' as const,
        registryOwner: 'canonical_backend' as const,
        registryVersion: 'canonical-provider-operation-registry-v1' as const,
        providerOperationId: CANONICAL_LYRIA_PROVIDER_OPERATION_ID,
        providerBoundaryProfileId: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
        providerRouteId: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
        providerModelId: CANONICAL_LYRIA_PROVIDER_MODEL_ID,
        workItemType: 'generate_music_candidate' as const,
        workerClass: 'audio_processing_worker' as const,
        expectedOutputRole: 'generated_instrumental_score_candidate' as const,
        expectedMimeType: 'audio/wav' as const,
        maximumProviderRequests: 1 as const,
        maximumRetries: 0 as const,
        maximumFallbacks: 0 as const,
        maximumRedirects: 0 as const,
        automaticSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
      }
    : {
        state: 'backend_owned_pending_freeze' as const,
        intent: 'synchronized_foley_candidate' as const,
        registryOwner: 'canonical_backend' as const,
        providerOperationId: null,
        pendingReason: 'canonical_synchronized_foley_provider_operation_not_admitted' as const,
      }
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_HANDOFF_BINDING_VERSION,
    bindingId: `ms012d-canonical-backend-handoff-${music ? 'music' : 'foley'}-v1`,
    createdAt,
    intent: input.intent,
    sharedSources: {
      providerLifecycle: {
        commit: CANONICAL_BACKEND_PROVIDER_LIFECYCLE_COMMIT,
        tree: CANONICAL_BACKEND_PROVIDER_LIFECYCLE_TREE,
        authoritySourceSha256: CANONICAL_BACKEND_PROVIDER_AUTHORITY_SOURCE_SHA256,
        verificationRecordSha256: CANONICAL_BACKEND_PROVIDER_LIFECYCLE_VERIFICATION_SHA256,
        verdict:
          'CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED' as const,
      },
      workerResourceEvidence: {
        commit: CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_COMMIT,
        tree: CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_TREE,
        evidenceSourceSha256: CANONICAL_BACKEND_WORKER_RESOURCE_EVIDENCE_SOURCE_SHA256,
        verificationRecordSha256: CANONICAL_BACKEND_WORKER_RESOURCE_VERIFICATION_SHA256,
        verdict:
          'PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_CONTRACT_ACCEPTED_RUNTIME_ADAPTER_BLOCKED' as const,
      },
    },
    operation,
    lifecycle: {
      canonicalPackageQueueClaimLeaseContractFrozen: music,
      siblingOneUseProviderDispatchContractFrozen: music,
      privateCreateOnlyCandidateContractFrozen: music,
      failedAndUnknownAttemptCostRetentionFrozen: music,
      injectedProofNonPromotable: true as const,
      realProviderTransportActivated: false as const,
      canonicalMotionReceiptIssued: false as const,
      distributedPersistenceProven: false as const,
    },
    resourceCost: {
      providerNeutralEvidenceContractFrozen: true as const,
      providerCostRemainsSeparate: true as const,
      observedCpuMemoryGpuRepresented: true as const,
      installedObserverAdapterPresent: false as const,
      officialCloudRateApproved: false as const,
      invoiceReconciled: false as const,
      historicalSyntheticAttemptsMayBeRewritten: false as const,
    },
    motionConsumer: {
      exactOperationBindingConsumable: music,
      canonicalBackendRuntimeReceiptVerifierIntegrated: false as const,
      actualCanonicalProviderReceiptPresent: false as const,
      privateCandidateIngestActivated: false as const,
      duplicateQueueCreated: false as const,
      duplicateProviderRegistryCreated: false as const,
      duplicateWorkerMeterCreated: false as const,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioCanonicalBackendProviderHandoffBindingV1Schema.parse({
    ...base,
    bindingDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalBackendProviderHandoffBinding(
  input: MotionStudioCanonicalBackendProviderHandoffBindingV1,
): MotionStudioCanonicalBackendProviderHandoffBindingV1 {
  const parsed = motionStudioCanonicalBackendProviderHandoffBindingV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.bindingDigest
  if (sha256CanonicalJson(base) !== parsed.bindingDigest) {
    blocked('Canonical backend provider handoff binding failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

export function motionStudioProviderAttemptOperationBindingFromCanonicalHandoff(
  input: MotionStudioCanonicalBackendProviderHandoffBindingV1,
): MotionStudioProviderAttemptConsumptionExpectationV1['operationBinding'] {
  const binding = assertMotionStudioCanonicalBackendProviderHandoffBinding(input)
  return binding.operation.state === 'frozen'
    ? {
        state: 'frozen',
        providerOperationId: binding.operation.providerOperationId,
      }
    : {
        state: 'backend_owned_pending_freeze',
        providerOperationId: null,
      }
}

function canonicalIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Canonical backend handoff binding time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_backend_provider_handoff',
  })
}
