import { z } from 'zod'

import type {
  ProjectCanonicalPrivateProviderAttemptConsumerReceiptInput,
} from '../../services/canonical-private-provider-attempt-consumer-receipt-service'
import {
  projectCanonicalPrivateProviderAttemptConsumerReceipt,
} from '../../services/canonical-private-provider-attempt-consumer-receipt-service'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  consumeMotionStudioCanonicalBackendProviderAttemptReceipt,
  motionStudioCanonicalBackendProviderAttemptConsumerReceiptV2Schema,
  motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema,
} from './canonical-backend-provider-attempt-consumer'
import type {
  MotionStudioProviderAttemptConsumptionExpectationV1,
} from './canonical-provider-attempt-port'

export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_BRIDGE_VERSION =
  'motion-studio.canonical-backend-provider-source-bridge.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const remainingBlockerSchema = z.enum([
  'source_evidence_private_injected_nonprovider_test',
  'source_evidence_canonical_backend_runtime_unreleased',
  'canonical_backend_runtime_receipt_release_required',
  'provider_transport_qualification_required',
  'consumer_owned_production_authority_release_required',
  'provider_attempt_failed',
  'provider_attempt_unknown_reconciliation_required',
  'provider_or_infrastructure_cost_reconciliation_required',
  'provider_or_infrastructure_cost_exceeds_authorized_ceiling',
])

export const motionStudioCanonicalBackendProviderSourceBridgeV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_BRIDGE_VERSION,
  ),
  bridgeId: stableIdSchema,
  authorityClass: z.literal('direct_same_tree_canonical_source_projection'),
  sourceProjection: z.object({
    service: z.literal('projectCanonicalPrivateProviderAttemptConsumerReceipt'),
    source: z.literal('verified_private_canonical_provider_attempt_stores'),
    receiptId: stableIdSchema,
    receiptHash: digestSchema,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
    ]),
    terminalState: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    queueAggregateHash: digestSchema,
    dispatchAggregateHash: digestSchema,
    providerAttemptCostEvidenceHash: digestSchema,
    workerResourceEvidenceHash: digestSchema,
    privateOutputSetDigest: digestSchema,
  }).strict(),
  motionConsumption:
    motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema,
  verification: z.object({
    canonicalProjectionServiceInvokedDirectly: z.literal(true),
    canonicalQueueStoreVerified: z.literal(true),
    canonicalDispatchStoreVerified: z.literal(true),
    canonicalProviderCostStoreVerified: z.literal(true),
    canonicalWorkerResourceStoreVerified: z.literal(true),
    canonicalPrivateOutputReadbackVerifiedWhenPresent: z.literal(true),
    canonicalBackendSourceProvenanceVerifierIntegrated: z.literal(true),
    canonicalBackendRuntimeReceiptVerifierIntegrated: z.literal(true),
    receiptHashAndMotionExpectationVerified: z.literal(true),
    sourceReceiptCanonicalBackendVerifiedRuntime: z.literal(false),
    sourceReceiptPromotionAuthorized: z.literal(false),
    productionPromotionPerformed: z.literal(false),
  }).strict(),
  resolvedLowerLevelBlockers: z.tuple([
    z.literal('canonical_backend_source_provenance_verifier_required'),
  ]).readonly(),
  remainingBlockers: z.array(remainingBlockerSchema).min(3).max(9).readonly(),
  readiness: z.object({
    directSameTreeSourceProjectionReady: z.literal(true),
    actualProviderCandidatePresent: z.literal(false),
    privateCandidateIngestAuthorized: z.literal(false),
    objectiveQaAuthorized: z.literal(false),
    humanReviewAuthorized: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    canonicalSourceProjectionCount: z.literal(1),
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    costMutationCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  bridgeDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const consumption = value.motionConsumption
  const expectedRemaining = consumption.blockers.filter((blocker) =>
    blocker !== 'canonical_backend_source_provenance_verifier_required')
  if (
    !consumption.blockers.includes(
      'canonical_backend_source_provenance_verifier_required',
    ) ||
    JSON.stringify(value.remainingBlockers) !== JSON.stringify(expectedRemaining) ||
    value.sourceProjection.receiptId !== consumption.sourceReceipt.receiptId ||
    value.sourceProjection.receiptHash !== consumption.sourceReceipt.receiptHash ||
    value.sourceProjection.evidenceClass !==
      consumption.sourceReceipt.evidenceClass ||
    value.sourceProjection.promotionClass !==
      consumption.sourceReceipt.promotionClass ||
    value.sourceProjection.terminalState !==
      consumption.sourceReceipt.terminalState ||
    value.sourceProjection.providerAttemptCostEvidenceHash !==
      consumption.sourceReceipt.providerAttemptEvidenceHash ||
    value.sourceProjection.workerResourceEvidenceHash !==
      consumption.sourceReceipt.workerResourceEvidenceHash ||
    value.sourceProjection.privateOutputSetDigest !==
      consumption.sourceReceipt.outputSetDigest ||
    consumption.readiness.actualProviderCandidatePresent ||
    consumption.readiness.privateCandidateIngestAuthorized ||
    consumption.motionPortReceipt !== null ||
    consumption.motionAdmission !== null
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider source bridge lineage is inconsistent.',
    })
  }
})

export type MotionStudioCanonicalBackendProviderSourceBridgeV1 =
  z.infer<typeof motionStudioCanonicalBackendProviderSourceBridgeV1Schema>

/**
 * The only Motion-owned entry point that may claim canonical source
 * verification. It asks the shared backend to reread and verify every source
 * store, then feeds that returned DTO into Motion's defensive consumer.
 *
 * It is deliberately read-only and cannot activate provider transport,
 * promote injected/unreleased evidence, admit an asset, or mutate cost,
 * selection, timeline, render, export, billing, or remote state.
 */
export async function consumeMotionStudioCanonicalProviderAttemptFromSourceStores(
  input: {
    authorizedOwnerUserId: string
    expectation: MotionStudioProviderAttemptConsumptionExpectationV1
    sourceProjection:
      ProjectCanonicalPrivateProviderAttemptConsumerReceiptInput
  },
): Promise<MotionStudioCanonicalBackendProviderSourceBridgeV1> {
  const sourceReceipt =
    motionStudioCanonicalBackendProviderAttemptConsumerReceiptV2Schema.parse(
      await projectCanonicalPrivateProviderAttemptConsumerReceipt(
        input.sourceProjection,
      ),
    )
  const motionConsumption =
    consumeMotionStudioCanonicalBackendProviderAttemptReceipt({
      authorizedOwnerUserId: input.authorizedOwnerUserId,
      expectation: input.expectation,
      sourceReceipt,
    })
  const remainingBlockers = motionConsumption.blockers.filter((blocker) =>
    blocker !== 'canonical_backend_source_provenance_verifier_required')
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_BRIDGE_VERSION,
    bridgeId: `provider-source-bridge-${sourceReceipt.receiptHash.slice(0, 40)}`,
    authorityClass: 'direct_same_tree_canonical_source_projection' as const,
    sourceProjection: {
      service: 'projectCanonicalPrivateProviderAttemptConsumerReceipt' as const,
      source: sourceReceipt.source,
      receiptId: sourceReceipt.receiptId,
      receiptHash: sourceReceipt.receiptHash,
      evidenceClass: sourceReceipt.evidenceClass,
      promotionClass: sourceReceipt.promotionClass,
      terminalState: sourceReceipt.dispatch.terminalState,
      queueAggregateHash: sourceReceipt.queue.aggregateHash,
      dispatchAggregateHash: sourceReceipt.dispatch.aggregateHash,
      providerAttemptCostEvidenceHash:
        sourceReceipt.internalCost.providerAttemptEvidenceHash,
      workerResourceEvidenceHash:
        sourceReceipt.internalCost.workerResourceEvidenceHash,
      privateOutputSetDigest: sourceReceipt.outputSet.outputSetDigest,
    },
    motionConsumption,
    verification: {
      canonicalProjectionServiceInvokedDirectly: true as const,
      canonicalQueueStoreVerified: true as const,
      canonicalDispatchStoreVerified: true as const,
      canonicalProviderCostStoreVerified: true as const,
      canonicalWorkerResourceStoreVerified: true as const,
      canonicalPrivateOutputReadbackVerifiedWhenPresent: true as const,
      canonicalBackendSourceProvenanceVerifierIntegrated: true as const,
      canonicalBackendRuntimeReceiptVerifierIntegrated: true as const,
      receiptHashAndMotionExpectationVerified: true as const,
      sourceReceiptCanonicalBackendVerifiedRuntime: false as const,
      sourceReceiptPromotionAuthorized: false as const,
      productionPromotionPerformed: false as const,
    },
    resolvedLowerLevelBlockers: [
      'canonical_backend_source_provenance_verifier_required',
    ] as const,
    remainingBlockers,
    readiness: {
      directSameTreeSourceProjectionReady: true as const,
      actualProviderCandidatePresent: false as const,
      privateCandidateIngestAuthorized: false as const,
      objectiveQaAuthorized: false as const,
      humanReviewAuthorized: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    sideEffects: {
      canonicalSourceProjectionCount: 1 as const,
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      costMutationCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return assertMotionStudioCanonicalBackendProviderSourceBridge({
    ...base,
    bridgeDigest: sha256CanonicalJson(base),
  })
}

export function assertMotionStudioCanonicalBackendProviderSourceBridge(
  input: MotionStudioCanonicalBackendProviderSourceBridgeV1,
): MotionStudioCanonicalBackendProviderSourceBridgeV1 {
  const parsed = motionStudioCanonicalBackendProviderSourceBridgeV1Schema
    .parse(input)
  const unsigned = { ...parsed } as Record<string, unknown>
  delete unsigned.bridgeDigest
  if (sha256CanonicalJson(unsigned) !== parsed.bridgeDigest) {
    blocked('Canonical provider source bridge failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_backend_provider_source_bridge',
  })
}
