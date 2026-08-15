import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  observeCanonicalVertexA100RateFixture,
} from './fixtures/canonical-vertex-a100-rate-fixture'
import {
  createCanonicalProfessionalToolGpuAttemptCostReceipt,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  applyCanonicalProfessionalGpuPlanPricing,
  createCanonicalProfessionalGpuPlanDispatchEstimateSet,
  createCanonicalProfessionalGpuPlanPreapprovalManifest,
  createCanonicalProfessionalGpuPlanPricingBasis,
  createCanonicalProfessionalGpuPlanPublicationBinding,
  createCanonicalProfessionalGpuPlanUsageQuote,
  type CanonicalProfessionalGpuPlanPricingBasis,
  type CanonicalProfessionalGpuPlanUsageQuote,
} from '../services/canonical-professional-gpu-plan-preapproval-authority-service'
import {
  admitCanonicalProfessionalGpuPlanFundedDispatch,
  canonicalProfessionalGpuApprovedFundingObservationSchema,
  createCanonicalProfessionalGpuAttemptStartAuthority,
  createCanonicalProfessionalGpuPlanPricingAuthorityBundle,
} from '../services/canonical-professional-gpu-plan-funded-dispatch-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuPricingAuthorityStore,
  createCanonicalProfessionalGpuPricingRepositoryRecordRef,
} from '../services/canonical-professional-gpu-pricing-authority-store'
import {
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority,
  verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority,
} from '../services/canonical-professional-gpu-plan-approval-pricing-authority'
import {
  createCanonicalConfirmedOutputBinding,
} from '../validation/canonical-confirmed-output-frame-schemas'
import type {
  CanonicalConfirmedOutputFrameAuthority,
} from '../services/canonical-confirmed-output-frame-authority'
import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome,
  settleCanonicalProfessionalGpuPlanFundedAttemptCredits,
} from '../services/canonical-professional-gpu-attempt-credit-settlement-service'
import {
  createCanonicalProfessionalGpuPlanFinalSettlementReadiness,
  settleCanonicalProfessionalGpuPlanFinalCredits,
} from '../services/canonical-professional-gpu-plan-final-credit-settlement-service'
import {
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  recordCanonicalProfessionalGpuPlanFundedTerminal,
  startCanonicalProfessionalGpuPlanFundedJob,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
  type CanonicalProfessionalGpuFundedLaunchBinding,
  type CanonicalProfessionalGpuFundedPrelaunchAuthorization,
  type CanonicalProfessionalGpuFundedTerminalBinding,
} from '../services/canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuAdmissionConsumption,
  CanonicalProfessionalGpuExecutionEnvelope,
  CanonicalProfessionalGpuJobLaunch,
  CanonicalProfessionalGpuJobLifecycleStore,
  CanonicalProfessionalGpuJobTerminal,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  putPrivateAuthorityJsonBlob,
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
  walletBalanceAfter,
  type AuthorityApprovedWorkItemRecord,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY,
} from '../../src/types/canonical-customer-estimate-authority'
import type { ServiceContext } from '../types'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'

const observedAt = '2026-08-02T16:00:00.000Z'
const createdAt = '2026-08-02T16:10:00.000Z'
const expiresAt = '2026-08-03T16:00:00.000Z'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, characterOrHash: string, version = 1) => ({
  id,
  version,
  contentHash: `sha256:${characterOrHash.length === 64
    ? characterOrHash
    : hash(characterOrHash)}`,
})

const rates = {
  a100_80gb_heavy_primary:
    await observeRate('a100_80gb_heavy_primary'),
  l4_heavy_fallback: await observeRate('l4_heavy_fallback'),
  l4_standard_primary: await observeRate('l4_standard_primary'),
}

assert.equal(resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome({
  terminalOutcome: 'canceled',
  providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
}), 'unknown_requires_reconciliation')
assert.equal(resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome({
  terminalOutcome: 'failed',
  providerInferenceOrSubstantiveWorkOutcome: 'unknown',
}), 'unknown_requires_reconciliation')
assert.equal(resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome({
  terminalOutcome: 'failed',
  providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
}), 'reeditpro_failed')

const ffmpegWorkItems = workItemsForFfmpeg()
const ffmpegBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg-plan'),
  components: components(),
  workItems: ffmpegWorkItems,
  confirmedOutputFrameRef: ref('confirmed-output-frame', 'a'),
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-gpu-release', 'b'),
    workload: workload(),
  }],
  helperParentBindings: [{
    helperWorkItemKey: 'ffprobe-helper',
    parentGpuWorkItemKey: 'ffmpeg-master',
  }],
})

assert.equal(ffmpegBasis.pricingUnits.length, 1)
assert.equal(ffmpegBasis.pricingUnits[0]?.toolId, 'ffmpeg')
assert.equal(ffmpegBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'canonical_production_operation_registered')
assert.deepEqual(ffmpegBasis.nonpricedToolUnits.map((unit) => [
  unit.toolId,
  unit.disposition,
]), [
  ['ffprobe', 'l4_colocated_helper_included_in_parent_attempt'],
  ['opentimelineio', 'control_plane_only_no_tool_charge'],
])
assert.equal(ffmpegBasis.maximumCreditBudgetExcludedFromPricingBasis, true)

const ffmpegQuote = quoteFor({
  basis: ffmpegBasis,
  workItemKey: 'ffmpeg-master',
  primaryRouteId: 'l4_standard_primary',
})
let ffmpegQuoteReads = 0
let ffmpegRateReads = 0
const ffmpegManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'ffmpeg-plan-gpu-pricing-v1',
    manifestVersion: 1,
    pricingBasis: ffmpegBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
        ffmpegQuoteReads += 1
        return structuredClone(ffmpegQuote)
      },
    },
    currentRateReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        ffmpegRateReads += 1
        return structuredClone(rates[input.routeId])
      },
    },
    createdAt,
  })

assert.equal(ffmpegQuoteReads, 1)
assert.equal(ffmpegRateReads, 1)
assert.equal(ffmpegManifest.entries.length, 1)
assert.equal(
  ffmpegManifest.entries[0]?.customerEstimateLine.metadata.serviceFeeIncluded,
  false,
)
assert.equal(ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  'l4_standard_primary')
assert.equal(ffmpegManifest.entries[0]?.costCalculation.fallback, null)
assert.equal(ffmpegManifest.totalMaximumReservedToolCostCredits > 0, true)
assert.equal(ffmpegManifest.customerCreditsMutated, false)

const sourceEstimate: CanonicalEstimateInput = {
  lineItems: [{
    lineKey: 'control-plane-coordination',
    label: 'Control-plane coordination',
    category: 'control_plane',
    estimatedCredits: 0,
    removable: false,
    metadata: {},
  }],
  fallbackAllowanceCredits: 5,
  validForSeconds: 3_600,
}
const applied = applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  sourceEstimate,
  workItems: ffmpegWorkItems,
  at: createdAt,
})
assert.equal(applied.estimate.lineItems.length, 2)
assert.equal(applied.estimate.lineItems[1]?.category,
  'gpu_tool_infrastructure')
assert.equal(applied.workItems.find((item) =>
  item.workItemKey === 'ffmpeg-master')?.maximumCreditBudget,
ffmpegManifest.totalMaximumReservedToolCostCredits)
assert.equal(applied.workItems.find((item) =>
  item.workItemKey === 'ffprobe-helper')?.maximumCreditBudget, 0)
assert.equal(applied.workItems.find((item) =>
  item.workItemKey === 'timeline-control')?.maximumCreditBudget, 0)

const customerEstimateCompilation =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: applied.estimate,
    components: components(),
    livingFrameProjection: undefined,
  })
const approvedCustomerEstimate = customerEstimateCompilation.estimate
const customerEstimateAuthorityRef = blobRef(
  customerEstimateCompilation.authority,
)

const binding = createCanonicalProfessionalGpuPlanPublicationBinding({
  bindingId: 'ffmpeg-plan-gpu-binding-v1',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publishedPlanRef: ref('published-plan', 'c'),
  publishedCustomerEstimateRef: ref(
    'published-estimate',
    sha256AuthorityValue(approvedCustomerEstimate),
  ),
  publishedWorkItems: applied.workItems,
  publishedCustomerEstimate: approvedCustomerEstimate,
  boundAt: createdAt,
})
assert.equal(binding.exactStructuralWorkGraphReread, true)
assert.equal(binding.exactGpuBudgetsAppliedToWorkItems, true)
assert.equal(binding.exactGpuLinesIncludedInCustomerEstimate, true)
assert.equal(binding.approvalGranted, false)
assert.equal(binding.creditReservationCreated, false)
assert.equal(binding.dispatchAuthorized, false)

const planApprovalPricingAuthority =
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority({
    authorityId: 'ffmpeg-plan-approval-pricing-v1',
    workspaceId: ffmpegBasis.scope.workspaceId,
    editPlanId: binding.publishedPlanRef.id,
    pricingBasis: ffmpegBasis,
    preapprovalManifest: ffmpegManifest,
    publicationBinding: binding,
    sealedAt: createdAt,
  })
const confirmedOutputFrameAuthorityPayloadForPricing: Omit<
  CanonicalConfirmedOutputFrameAuthority,
  'authorityDigestSha256'
> = {
  schemaVersion: 'canonical-confirmed-output-frame-authority-v1',
  source: 'canonical_backend_confirmed_output_frame_compiler',
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningInputBindingHash: hash('f'),
  planningInputRevision: 0,
  frameConfirmationId: 'confirmed-output-frame',
  confirmedAspectRatio: '9:16',
  confirmedOutputBinding: createCanonicalConfirmedOutputBinding({
    outputId: ffmpegBasis.confirmedOutputFrame.outputId,
    aspectRatioLabel: '9:16',
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    width: ffmpegBasis.confirmedOutputFrame.width,
    height: ffmpegBasis.confirmedOutputFrame.height,
    fpsNumerator: 30,
    fpsDenominator: 1,
    confirmedOutputFrameRef:
      ffmpegBasis.confirmedOutputFrame.outputFrameRef,
    confirmedByUser: true,
    confirmationRecordId: 'confirmed-output-frame',
  }),
  authorityBoundary: {
    serverDerivedFromCanonicalReread: true,
    browserFrameAuthorityAccepted: false,
    callerOutputIdAccepted: false,
    callerDimensionsAccepted: false,
    callerFpsAccepted: false,
    approvalGranted: false,
    workDispatched: false,
    providerCalled: false,
    mediaExecuted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  },
}
const confirmedOutputFrameAuthorityForPricing = {
  ...confirmedOutputFrameAuthorityPayloadForPricing,
  authorityDigestSha256: sha256AuthorityValue(
    confirmedOutputFrameAuthorityPayloadForPricing,
  ),
} satisfies CanonicalConfirmedOutputFrameAuthority
assert.equal(verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: planApprovalPricingAuthority,
  ownerUserId: ffmpegBasis.scope.ownerUserId,
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningRequestId: ffmpegBasis.scope.planningRequestId,
  editPlanId: binding.publishedPlanRef.id,
  editPlanVersion: binding.publishedPlanRef.version,
  editPlanHash: binding.publishedPlanRef.contentHash.slice(7),
  estimateId: binding.publishedCustomerEstimateRef.id,
  estimateVersion: binding.publishedCustomerEstimateRef.version,
  estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
  components: components(),
  workItems: applied.workItems,
  customerEstimate: approvedCustomerEstimate,
  confirmedOutputFrameAuthority: confirmedOutputFrameAuthorityForPricing,
  at: createdAt,
}).authorityHash, planApprovalPricingAuthority.authorityHash)
const approvalEstimateWithoutGpuLine = structuredClone(
  approvedCustomerEstimate,
)
approvalEstimateWithoutGpuLine.lineItems =
  approvalEstimateWithoutGpuLine.lineItems.filter((line) =>
    line.category !== 'gpu_tool_infrastructure')
assert.throws(() =>
  verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
    value: planApprovalPricingAuthority,
    ownerUserId: ffmpegBasis.scope.ownerUserId,
    workspaceId: ffmpegBasis.scope.workspaceId,
    projectId: ffmpegBasis.scope.projectId,
    editSessionId: ffmpegBasis.scope.editSessionId,
    planningRequestId: ffmpegBasis.scope.planningRequestId,
    editPlanId: binding.publishedPlanRef.id,
    editPlanVersion: binding.publishedPlanRef.version,
    editPlanHash: binding.publishedPlanRef.contentHash.slice(7),
    estimateId: binding.publishedCustomerEstimateRef.id,
    estimateVersion: binding.publishedCustomerEstimateRef.version,
    estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
    components: components(),
    workItems: applied.workItems,
    customerEstimate: approvalEstimateWithoutGpuLine,
    confirmedOutputFrameAuthority: confirmedOutputFrameAuthorityForPricing,
    at: createdAt,
  }), /immutable plan/u)

const approvedSnapshotId = 'approved-snapshot-ffmpeg'
const approvedWorkSource = applied.workItems[0]!
const approvedWorkItemRecord: AuthorityApprovedWorkItemRecord = {
  id: 'approved-work-ffmpeg-master',
  snapshotId: approvedSnapshotId,
  sourceWorkItemId: 'plan-work-ffmpeg-master',
  workItemKey: approvedWorkSource.workItemKey,
  workItemType: approvedWorkSource.workItemType,
  workerClass: approvedWorkSource.workerClass,
  executionInputRef: { sha256: hash('7'), byteLength: 1 },
  sourceSequenceItemIds: approvedWorkSource.sourceSequenceItemIds,
  sourceCleanupDecisionIds: approvedWorkSource.sourceCleanupDecisionIds,
  expectedOutputs: approvedWorkSource.expectedOutputs,
  dependencyKeys: approvedWorkSource.dependencyKeys,
  approvedToolIds: approvedWorkSource.approvedToolIds,
  approvedProviderRoute: approvedWorkSource.approvedProviderRoute,
  providerExecutionMode: approvedWorkSource.providerExecutionMode,
  fallbackPolicyRef: { sha256: hash('8'), byteLength: 1 },
  maxAttempts: approvedWorkSource.maxAttempts,
  attemptTimeoutSeconds: approvedWorkSource.attemptTimeoutSeconds,
  scheduledDelaySeconds: approvedWorkSource.scheduledDelaySeconds,
  maximumCreditBudget: approvedWorkSource.maximumCreditBudget,
  required: approvedWorkSource.required,
  executionInputHash: hash('9'),
  createdAt,
}
const exactApprovedWorkRef = ref(
  approvedWorkItemRecord.id,
  sha256AuthorityValue(approvedWorkItemRecord),
)

const dispatchEstimateSet =
  createCanonicalProfessionalGpuPlanDispatchEstimateSet({
    estimateSetId: 'ffmpeg-plan-dispatch-estimates-v1',
    pricingBasis: ffmpegBasis,
    manifest: ffmpegManifest,
    publicationBinding: binding,
    approvedWorkItemRefs: [{
      workItemKey: 'ffmpeg-master',
      approvedWorkItemRef: exactApprovedWorkRef,
    }],
    createdAt,
  })
assert.equal(dispatchEstimateSet.entries.length, 1)
assert.equal(dispatchEstimateSet.entries[0]?.estimate.scope.editPlanId,
  'published-plan')
assert.equal(dispatchEstimateSet.entries[0]?.estimate.scope.operationId,
  exactOperation('ffmpeg'))
assert.equal(dispatchEstimateSet.entries[0]?.estimate.scope.outputId,
  'output-9x16')
assert.equal(dispatchEstimateSet.entries[0]?.estimate
  .maximumReservedToolCostCredits,
ffmpegManifest.totalMaximumReservedToolCostCredits)
assert.equal(dispatchEstimateSet
  .exactPreapprovalCalculationsReusedWithoutRepricing, true)
assert.equal(dispatchEstimateSet.fundedReservationRequiredBeforeGpuJobCreation,
  true)
assert.equal(dispatchEstimateSet.dispatchAuthorized, false)

const approvedMaximumCredits = approvedCustomerEstimate.lineItems.reduce(
  (total, line) => total + line.estimatedCredits,
  approvedCustomerEstimate.fallbackAllowanceCredits,
)
const approvedPlanRecord = {
  id: binding.publishedPlanRef.id,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningRequestId: ffmpegBasis.scope.planningRequestId,
  planVersion: binding.publishedPlanRef.version,
  status: 'approved' as const,
  componentRefs: {
    [CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY]:
      customerEstimateAuthorityRef,
  },
  estimateId: binding.publishedCustomerEstimateRef.id,
  workItemIds: [approvedWorkItemRecord.sourceWorkItemId],
  planHash: binding.publishedPlanRef.contentHash.slice(7),
  workGraphHash: hash('0'),
  sourceSequenceHash: hash('1'),
  timingHash: hash('2'),
  createdAt,
  approvedAt: createdAt,
}
const approvedEstimateRecord = {
  id: binding.publishedCustomerEstimateRef.id,
  planId: approvedPlanRecord.id,
  estimateVersion: binding.publishedCustomerEstimateRef.version,
  status: 'approved' as const,
  lineItems: approvedCustomerEstimate.lineItems.map((line) => ({
    lineKey: line.lineKey,
    label: line.label,
    category: line.category,
    estimatedCredits: line.estimatedCredits,
    removable: line.removable,
    metadataRef: blobRef(line.metadata),
  })),
  estimatedCredits: approvedCustomerEstimate.lineItems.reduce(
    (total, line) => total + line.estimatedCredits,
    0,
  ),
  fallbackAllowanceCredits:
    approvedCustomerEstimate.fallbackAllowanceCredits,
  approvedMaximumCredits,
  estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
  validUntil: '2026-08-03T16:00:00.000Z',
  createdAt,
  approvedAt: createdAt,
}
const approvalRecord = {
  id: 'approval-ffmpeg',
  planId: approvedPlanRecord.id,
  estimateId: approvedEstimateRecord.id,
  snapshotId: approvedSnapshotId,
  reservationId: 'reservation-ffmpeg',
  approvedByUserId: ffmpegBasis.scope.ownerUserId,
  approvedAt: createdAt,
  requestHash: hash('6'),
  idempotencyKey: 'approve-ffmpeg-gpu-plan',
}
const reservationRecord = {
  id: approvalRecord.reservationId,
  approvalId: approvalRecord.id,
  snapshotId: approvedSnapshotId,
  estimateId: approvedEstimateRecord.id,
  planId: approvedPlanRecord.id,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  status: 'reserved' as const,
  reservedCredits: approvedMaximumCredits,
  spentCredits: 0,
  releasedCredits: 0,
  refundedCredits: 0,
  reservedAt: createdAt,
  expiresAt: '2026-08-04T16:00:00.000Z',
  updatedAt: createdAt,
}
const approvedSnapshotRecord = {
  schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
  snapshotId: approvedSnapshotId,
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planId: approvedPlanRecord.id,
  planVersion: approvedPlanRecord.planVersion,
  estimateId: approvedEstimateRecord.id,
  approvalId: approvalRecord.id,
  reservationId: reservationRecord.id,
  approvedByUserId: approvalRecord.approvedByUserId,
  approvedAt: createdAt,
  componentRefs: {
    [CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY]:
      customerEstimateAuthorityRef,
  },
  approvedWorkItemIds: [approvedWorkItemRecord.id],
  planHash: approvedPlanRecord.planHash,
  estimateHash: approvedEstimateRecord.estimateHash,
  workGraphHash: approvedPlanRecord.workGraphHash,
  sourceSequenceHash: approvedPlanRecord.sourceSequenceHash,
  timingHash: approvedPlanRecord.timingHash,
  approvedAssetManifestRef: { sha256: hash('a'), byteLength: 1 },
  approvedAssetManifestHash: hash('a'),
  approvedSourceAssetManifestRef: { sha256: hash('b'), byteLength: 1 },
  approvedSourceAssetManifestHash: hash('b'),
  snapshotHash: hash('a'),
}
const approvedWorkRef = dispatchEstimateSet.entries[0]!.approvedWorkItemRef
const fundingPayload = {
  schemaVersion:
    'canonical-professional-gpu-approved-funding-observation-v1' as const,
  source: 'canonical_edit_planning_authority_reread' as const,
  evidenceClass: 'canonical_private_reread' as const,
  observationId: 'ffmpeg-approved-funding-observation-v1',
  scope: {
    ...ffmpegBasis.scope,
    editPlanId: binding.publishedPlanRef.id,
    editPlanVersion: binding.publishedPlanRef.version,
  },
  publishedPlanRef: binding.publishedPlanRef,
  publishedCustomerEstimateRef: binding.publishedCustomerEstimateRef,
  approvedSnapshotRef: ref(approvedSnapshotId, approvedSnapshotRecord.snapshotHash),
  userApprovalRecordRef: ref(
    approvalRecord.id,
    sha256AuthorityValue(approvalRecord),
  ),
  fundedReservationRef: ref(
    reservationRecord.id,
    sha256AuthorityValue(reservationRecord),
  ),
  confirmedOutputFrame: {
    outputFrameRef: ffmpegBasis.confirmedOutputFrame.outputFrameRef,
    outputId: ffmpegBasis.confirmedOutputFrame.outputId,
    aspectRatio: ffmpegBasis.confirmedOutputFrame.aspectRatio,
    width: ffmpegBasis.confirmedOutputFrame.width,
    height: ffmpegBasis.confirmedOutputFrame.height,
    fpsNumerator: 30,
    fpsDenominator: 1,
    confirmedByUser: true as const,
    confirmationRecordId: 'confirmed-output-frame',
  },
  masterTimingRef: ref(
    'master-timing-plan',
    ffmpegBasis.masterTimingDigestSha256,
    binding.publishedPlanRef.version,
  ),
  approvedWorkItem: {
    workItemKey: 'ffmpeg-master',
    approvedWorkItemRef: approvedWorkRef,
    canonicalWorkItemDigestSha256:
      sha256AuthorityValue(applied.workItems[0]),
    pricingStructureDigestSha256:
      ffmpegBasis.pricingUnits[0]!.workItemPricingStructureDigestSha256,
    workItemType: applied.workItems[0]!.workItemType,
    workerClass: applied.workItems[0]!.workerClass,
    approvedToolIds: applied.workItems[0]!.approvedToolIds,
    maximumCreditBudget: applied.workItems[0]!.maximumCreditBudget,
    required: applied.workItems[0]!.required,
  },
  canonicalWorkGraphDigestSha256:
    binding.publishedCanonicalWorkGraphDigestSha256,
  canonicalWorkGraphPricingStructureDigestSha256:
    ffmpegBasis.canonicalWorkGraphPricingStructureDigestSha256,
  canonicalCustomerEstimateDigestSha256:
    binding.publishedCustomerEstimateDigestSha256,
  canonicalGpuEstimateLineSetDigestSha256: sha256AuthorityValue(
    ffmpegManifest.entries.map((entry) => entry.customerEstimateLine),
  ),
  canonicalGpuEstimateLineCount: ffmpegManifest.entries.length,
  approvedMaximumCredits,
  reservationStatus: 'reserved' as const,
  originallyReservedCredits: approvedMaximumCredits,
  remainingReservedCredits: approvedMaximumCredits,
  reservationExpiresAt: '2026-08-04T16:00:00.000Z',
  immutableSnapshotAndApprovalReread: true as const,
  exactCustomerEstimateReread: true as const,
  exactApprovedWorkAndFrameReread: true as const,
  activeFundedReservationReread: true as const,
  callerApprovalEstimateOrReservationAccepted: false as const,
  observedAt: createdAt,
}
const approvedFunding =
  canonicalProfessionalGpuApprovedFundingObservationSchema.parse({
    ...fundingPayload,
    observationHash: sha256AuthorityValue(fundingPayload),
  })
const pricingRepositoryRecordRef =
  createCanonicalProfessionalGpuPricingRepositoryRecordRef({
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: approvedFunding.approvedWorkItem.workItemKey,
    publishedPlanRef: approvedFunding.publishedPlanRef,
    approvedWorkItemRef: approvedFunding.approvedWorkItem.approvedWorkItemRef,
  })
const pricingAuthorityBundle =
  createCanonicalProfessionalGpuPlanPricingAuthorityBundle({
    bundleId: 'ffmpeg-plan-pricing-authority-bundle-v1',
    repositoryRecordRef: pricingRepositoryRecordRef,
    pricingBasis: ffmpegBasis,
    preapprovalManifest: ffmpegManifest,
    publicationBinding: binding,
    dispatchEstimateSet,
    persistedAt: createdAt,
  })
const pricingObjects = new Map<string, Buffer>()
const pricingObjectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly({ objectPath, body }) {
    const existing = pricingObjects.get(objectPath)
    if (existing) {
      if (!existing.equals(body)) {
        throw new Error('pricing object create-only collision')
      }
      return 'already_exists'
    }
    pricingObjects.set(objectPath, Buffer.from(body))
    return 'created'
  },
  async readExact(objectPath) {
    const value = pricingObjects.get(objectPath)
    return value ? Buffer.from(value) : null
  },
}
const pricingAuthorityStore =
  createCanonicalProfessionalGpuPricingAuthorityStore({
    objectPort: pricingObjectPort,
  })
await pricingAuthorityStore.persistPlanApprovalPricingAuthority({
  authority: planApprovalPricingAuthority,
})
assert.equal(stableAuthorityStringify(
  await pricingAuthorityStore.rereadPublishedPlanPricingAuthority({
    workspaceId: ffmpegBasis.scope.workspaceId,
    editPlanId: binding.publishedPlanRef.id,
    at: '2026-08-02T16:11:00.000Z',
  }),
), stableAuthorityStringify(planApprovalPricingAuthority))
const callerInventedRepositoryBundle =
  createCanonicalProfessionalGpuPlanPricingAuthorityBundle({
    bundleId: 'ffmpeg-caller-invented-pricing-bundle-v1',
    repositoryRecordRef: ref('caller-invented-pricing-record', '9'),
    pricingBasis: ffmpegBasis,
    preapprovalManifest: ffmpegManifest,
    publicationBinding: binding,
    dispatchEstimateSet,
    persistedAt: createdAt,
  })
await assert.rejects(() => pricingAuthorityStore.persistPricingAuthority({
  bundle: callerInventedRepositoryBundle,
  approvedFunding,
  persistedAt: createdAt,
}), /approved plan lineage/u)
const pricingLookup = await pricingAuthorityStore.persistPricingAuthority({
  bundle: pricingAuthorityBundle,
  approvedFunding,
  persistedAt: createdAt,
})
assert.equal(pricingLookup.cpuOnlySubstantiveExecutionAllowed, false)
assert.equal(pricingLookup.repositoryRecordRef.contentHash,
  pricingRepositoryRecordRef.contentHash)
assert.equal(stableAuthorityStringify(
  await pricingAuthorityStore.rereadPrivatePricingAuthority({
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: approvedFunding.approvedWorkItem.workItemKey,
    at: '2026-08-02T16:11:00.000Z',
  }),
), stableAuthorityStringify(pricingAuthorityBundle))
assert.equal(await pricingAuthorityStore.rereadPrivatePricingAuthority({
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: 'other-approved-snapshot',
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  at: '2026-08-02T16:11:00.000Z',
}), null)
const persistedBundlePath = [...pricingObjects.keys()].find((path) =>
  path.includes('/bundles/'))
assert.ok(persistedBundlePath)
const exactPersistedBundle = pricingObjects.get(persistedBundlePath)
assert.ok(exactPersistedBundle)
const tamperedPersistedBundle = JSON.parse(
  exactPersistedBundle.toString('utf8'),
) as Record<string, unknown>
tamperedPersistedBundle.browserOrCallerPricingArtifactAccepted = true
pricingObjects.set(
  persistedBundlePath,
  Buffer.from(stableAuthorityStringify(tamperedPersistedBundle), 'utf8'),
)
await assert.rejects(() =>
  pricingAuthorityStore.rereadPrivatePricingAuthority({
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: approvedFunding.approvedWorkItem.workItemKey,
    at: '2026-08-02T16:11:00.000Z',
  }))
pricingObjects.set(persistedBundlePath, exactPersistedBundle)
const attemptStart = createCanonicalProfessionalGpuAttemptStartAuthority({
  attemptAuthorityId: 'ffmpeg-attempt-start-v1',
  scope: approvedFunding.scope,
  approvedSnapshotRef: approvedFunding.approvedSnapshotRef,
  approvedWorkItemRef: approvedFunding.approvedWorkItem.approvedWorkItemRef,
  workerLeaseRef: ref('ffmpeg-worker-lease', 'd'),
  userTriggerRecordRef: ref('ffmpeg-user-trigger', 'e'),
  executionAttemptRef: ref('ffmpeg-execution-attempt', 'f'),
  idempotencyKey: 'ffmpeg-execution-attempt-idempotency',
  routeId: 'l4_standard_primary',
  triggeredAt: createdAt,
  expiresAt: '2026-08-02T16:20:00.000Z',
})
const ffmpegRuntimeRelease = runtimeRelease({
  toolId: 'ffmpeg',
  operationId: exactOperation('ffmpeg'),
  exactToolOrModelReleaseRef:
    ffmpegBasis.pricingUnits[0]!.exactToolOrModelReleaseRef,
  routeId: 'l4_standard_primary',
})
const fundedDispatchAdmission =
  await admitCanonicalProfessionalGpuPlanFundedDispatch({
    fundedAdmissionId: 'ffmpeg-funded-dispatch-v1',
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: 'ffmpeg-master',
    pricingAuthorityReadPort: pricingAuthorityStore,
    approvedFundingReadPort: {
      async rereadApprovedFunding() {
        return structuredClone(approvedFunding)
      },
    },
    attemptStartReadPort: {
      async rereadCreateOnlyAttemptStart() {
        return structuredClone(attemptStart)
      },
    },
    runtimeContextReadPort: {
      async rereadQualifiedRuntimeRelease() {
        return structuredClone(ffmpegRuntimeRelease)
      },
      async rereadApprovedCurrentRate() {
        return structuredClone(rates.l4_standard_primary)
      },
    },
    admittedAt: '2026-08-02T16:11:00.000Z',
    expiresAt: '2026-08-02T16:15:00.000Z',
  })
assert.equal(fundedDispatchAdmission.fullCustomerEstimateFundedBeforeDispatch,
  true)
assert.equal(fundedDispatchAdmission.currentWorkCeilingStillCovered, true)
assert.equal(fundedDispatchAdmission.cloudJobCreated, false)
assert.equal(fundedDispatchAdmission.toolDispatchAdmission.routeId,
  'l4_standard_primary')
assert.equal(fundedDispatchAdmission.approvedWorkItemGpuCeilingCredits,
  ffmpegManifest.totalMaximumReservedToolCostCredits)

const admissionConsumptions = new Map<
  string,
  CanonicalProfessionalGpuAdmissionConsumption
>()
const executionEnvelopes = new Map<
  string,
  CanonicalProfessionalGpuExecutionEnvelope
>()
const gpuLaunches = new Map<string, CanonicalProfessionalGpuJobLaunch>()
const gpuTerminals = new Map<string, CanonicalProfessionalGpuJobTerminal>()
const lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore = {
  async consumeAdmissionCreateOnly({ record }) {
    if (admissionConsumptions.has(record.admissionRef.id)) {
      return 'already_exists'
    }
    admissionConsumptions.set(record.admissionRef.id, structuredClone(record))
    return 'created'
  },
  async createExecutionEnvelopeOnly({ record }) {
    if (executionEnvelopes.has(record.envelopeId)) return 'already_exists'
    executionEnvelopes.set(record.envelopeId, structuredClone(record))
    return 'created'
  },
  async rereadExecutionEnvelope({ envelopeId }) {
    return structuredClone(executionEnvelopes.get(envelopeId) ?? null)
  },
  async createLaunchRecordOnly({ record }) {
    if (gpuLaunches.has(record.launchRecordId)) return 'already_exists'
    gpuLaunches.set(record.launchRecordId, structuredClone(record))
    return 'created'
  },
  async createTerminalRecordOnly({ record }) {
    if (gpuTerminals.has(record.terminalRecordId)) return 'already_exists'
    gpuTerminals.set(record.terminalRecordId, structuredClone(record))
    return 'created'
  },
}
const fundedPrelaunchRecords = new Map<
  string,
  CanonicalProfessionalGpuFundedPrelaunchAuthorization
>()
const fundedLaunchBindings = new Map<
  string,
  CanonicalProfessionalGpuFundedLaunchBinding
>()
const fundedTerminalBindings = new Map<
  string,
  CanonicalProfessionalGpuFundedTerminalBinding
>()
const fundedLifecycleStore: CanonicalProfessionalGpuFundedJobLifecycleStore = {
  async createPrelaunchAuthorizationOnly({ record }) {
    if (fundedPrelaunchRecords.has(record.prelaunchAuthorizationId)) {
      return 'already_exists'
    }
    fundedPrelaunchRecords.set(
      record.prelaunchAuthorizationId,
      structuredClone(record),
    )
    return 'created'
  },
  async rereadPrelaunchAuthorization({ prelaunchAuthorizationId }) {
    return structuredClone(
      fundedPrelaunchRecords.get(prelaunchAuthorizationId) ?? null,
    )
  },
  async createLaunchBindingOnly({ record }) {
    if (fundedLaunchBindings.has(record.launchBindingId)) {
      return 'already_exists'
    }
    fundedLaunchBindings.set(record.launchBindingId, structuredClone(record))
    return 'created'
  },
  async rereadLaunchBinding({ launchBindingId }) {
    return structuredClone(fundedLaunchBindings.get(launchBindingId) ?? null)
  },
  async createTerminalBindingOnly({ record }) {
    if (fundedTerminalBindings.has(record.terminalBindingId)) {
      return 'already_exists'
    }
    fundedTerminalBindings.set(
      record.terminalBindingId,
      structuredClone(record),
    )
    return 'created'
  },
  async rereadTerminalBinding({ terminalBindingId }) {
    return structuredClone(
      fundedTerminalBindings.get(terminalBindingId) ?? null,
    )
  },
}
const fundedLifecycleIdentity =
  createCanonicalProfessionalGpuFundedLifecycleIdentity({
    attemptStartAuthority: attemptStart,
  })
let fundedCloudLaunchCount = 0
const fundedJob = await startCanonicalProfessionalGpuPlanFundedJob({
  fundedAdmissionId: fundedLifecycleIdentity.fundedAdmissionId,
  prelaunchAuthorizationId:
    fundedLifecycleIdentity.prelaunchAuthorizationId,
  launchRecordId: fundedLifecycleIdentity.launchRecordId,
  launchBindingId: fundedLifecycleIdentity.launchBindingId,
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: approvedFunding.approvedSnapshotRef.id,
  workItemKey: 'ffmpeg-master',
  pricingAuthorityReadPort: pricingAuthorityStore,
  approvedFundingReadPort: {
    async rereadApprovedFunding() { return approvedFunding },
  },
  attemptStartReadPort: {
    async rereadCreateOnlyAttemptStart() { return attemptStart },
  },
  runtimeContextReadPort: {
    async rereadQualifiedRuntimeRelease() { return ffmpegRuntimeRelease },
    async rereadApprovedCurrentRate() {
      return rates.l4_standard_primary
    },
  },
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return {
        releaseRef: ref(
          ffmpegRuntimeRelease.releaseId,
          ffmpegRuntimeRelease.releaseHash,
          ffmpegRuntimeRelease.releaseVersion,
        ),
        releaseEvidenceClass: 'canonical_private_reread' as const,
        privateInternalQualified: true as const,
        toolId: 'ffmpeg',
        operationId: exactOperation('ffmpeg'),
        routeId: 'l4_standard_primary' as const,
        runtimeRegion: 'us-central1' as const,
        executionTarget: 'google_cloud_run_l4_job' as const,
        machineType: 'cloud_run_nvidia_l4' as const,
        accelerator: 'nvidia_l4' as const,
        immutableImageRef: ffmpegRuntimeRelease.immutableImageRef,
        immutableImageDigest: ffmpegRuntimeRelease.immutableImageDigest,
        fixedServerTaskContractRef: ref('ffmpeg-fixed-task', '8'),
        serviceIdentityRef: ffmpegRuntimeRelease.serviceIdentityRef,
        privateNetworkAndArtifactTransportRef:
          ffmpegRuntimeRelease.privateNetworkAndArtifactTransportRef,
        minimumIdleInstances: 0 as const,
        maximumConcurrentAttemptsPerInstance: 1 as const,
        runtimeNetworkDownloadAllowed: false as const,
        callerCommandImageModelOrEnvironmentAccepted: false as const,
        cpuOnlySubstantiveExecutionAllowed: false as const,
        startsOnlyFromConsumedApprovedAdmission: true as const,
        stopsAtTerminalAttempt: true as const,
      }
    },
  },
  launchPort: {
    async startOneShotJob() {
      fundedCloudLaunchCount += 1
      assert.equal(fundedPrelaunchRecords.size, 1)
      return {
        disposition: 'accepted' as const,
        cloudJobExecutionRef: ref('ffmpeg-cloud-job', '7'),
        cloudJobCreateRequestRef: ref('ffmpeg-cloud-create', '6'),
        providerRequestIdDigestSha256: hash('5'),
        observedAt: '2026-08-02T16:12:01.000Z',
        providerInferenceOrSubstantiveWorkKnownExecuted:
          'not_executed' as const,
      }
    },
  },
  lifecycleStore,
  fundedLifecycleStore,
  admittedAt: '2026-08-02T16:11:00.000Z',
  admissionExpiresAt: '2026-08-02T16:15:00.000Z',
  startedAt: '2026-08-02T16:12:00.000Z',
})
assert.equal(fundedCloudLaunchCount, 1)
assert.equal(fundedJob.launch.accelerator, 'nvidia_l4')
assert.equal(fundedJob.launch.minimumIdleInstances, 0)
assert.equal(fundedJob.launchBinding.fundedPrelaunchRereadBeforeCloudJobCreation,
  true)
assert.equal(fundedJob.launchBinding.cpuOnlySubstantiveExecutionAllowed, false)

const attemptCostReceipt =
  createCanonicalProfessionalToolGpuAttemptCostReceipt({
    receiptId: 'ffmpeg-attempt-cost',
    estimate: dispatchEstimateSet.entries[0]!.estimate,
    approvedSnapshotRef: approvedFunding.approvedSnapshotRef,
    approvalRecordRef: approvedFunding.userApprovalRecordRef,
    fundedReservationRef: approvedFunding.fundedReservationRef,
    executionAttemptId: attemptStart.executionAttemptRef.id,
    routeId: 'l4_standard_primary',
    rateAuthority: rates.l4_standard_primary,
    workerUsageEvidenceRef: ref('ffmpeg-worker-usage', '2'),
    platformUsageRereadRef: ref('ffmpeg-platform-usage-reread', '3'),
    providerOrModelInferenceOutcome: 'executed',
    actualUsage: usage('l4', 40_000),
    terminalOutcome: 'completed',
    attemptStartedAt: fundedJob.launch.launchedAt,
    recordedAt: '2026-08-02T16:12:59.000Z',
  })
assert.equal(attemptCostReceipt.customerEligibleToolCostCredits > 0, true)
assert.equal(attemptCostReceipt.walletOrLedgerMutationPerformed, false)

const terminalObservationPayload = {
  schemaVersion: 'canonical-professional-gpu-terminal-observation-v1' as const,
  source: 'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  launchRef: ref(fundedJob.launch.launchRecordId, fundedJob.launch.launchHash),
  cloudJobExecutionRef: fundedJob.launch.cloudJobExecutionRef,
  cloudTerminalObservationRef: ref('ffmpeg-cloud-terminal', '4'),
  cloudCapacityTeardownObservationRef: ref('ffmpeg-cloud-stop', '3'),
  workerUsageEvidenceRef: ref('ffmpeg-worker-usage', '2'),
  currentAccountPriceAuthorityRef: ref('ffmpeg-current-price', '1'),
  attemptCostReceiptRef: ref(
    attemptCostReceipt.receiptId,
    attemptCostReceipt.receiptHash,
  ),
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  cloudJobTerminalStateReread: true as const,
  workerStoppedVerified: true as const,
  activeGpuInstancesAfterTerminalObservation: 0 as const,
  exactPlatformUsageAndAccountPriceReread: true as const,
  costReceiptPersistedBeforeSettlement: true as const,
  systemFailureOrUnknownCostChargedToCustomer: false as const,
  unapprovedOverageChargedToCustomer: false as const,
  customerWalletOrLedgerMutated: false as const,
  callerOrPlanTerminalClaimAccepted: false as const,
  observedAt: '2026-08-02T16:13:00.000Z',
}
const fundedTerminal =
  await recordCanonicalProfessionalGpuPlanFundedTerminal({
    terminalRecordId: fundedLifecycleIdentity.terminalRecordId,
    terminalBindingId: fundedLifecycleIdentity.terminalBindingId,
    launch: fundedJob.launch,
    launchBindingId: fundedJob.launchBinding.launchBindingId,
    terminalObservationPort: {
      async rereadTerminalUsagePriceAndCost() {
        return {
          ...terminalObservationPayload,
          observationHash: sha256AuthorityValue(terminalObservationPayload),
        }
      },
    },
    lifecycleStore,
    fundedLifecycleStore,
  })
assert.equal(fundedTerminal.terminal.workerStoppedVerified, true)
assert.equal(
  fundedTerminal.terminal.activeGpuInstancesAfterTerminalObservation,
  0,
)
assert.equal(
  fundedTerminal.terminalBinding
    .terminalSettlementOwnerMustReconcileReservation,
  true,
)
assert.equal(fundedTerminal.terminalBinding.customerWalletOrLedgerMutated,
  false)

const settlementRoot = await mkdtemp(join(
  tmpdir(),
  'reeditpro-gpu-attempt-settlement-',
))
let settledCustomerCredits: number
let retainedPlanCredits: number
let finalServiceFeeCredits: number
let finalReleasedCredits: number
try {
  const settlementContext = {
    env: {
      localStorageRoot: settlementRoot,
      nodeEnv: 'development',
      mode: 'local',
    } as ServiceContext['env'],
    clients: {} as ServiceContext['clients'],
    requestId: 'gpu-attempt-settlement-smoke',
    auth: {
      userId: approvedFunding.scope.ownerUserId,
      isMockUser: true,
    },
  } as ServiceContext
  const persistedCustomerAuthorityRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: settlementRoot,
    value: customerEstimateCompilation.authority as unknown as
      Record<string, unknown>,
  })
  assert.deepEqual(
    persistedCustomerAuthorityRef,
    customerEstimateAuthorityRef,
  )
  for (const line of approvedCustomerEstimate.lineItems) {
    const persistedMetadataRef = await putPrivateAuthorityJsonBlob({
      localStorageRoot: settlementRoot,
      value: line.metadata,
    })
    assert.deepEqual(persistedMetadataRef, blobRef(line.metadata))
  }
  await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: settlementRoot,
      workspaceId: approvedFunding.scope.workspaceId,
      ownerUserId: approvedFunding.scope.ownerUserId,
    },
    now: createdAt,
    mutation: (aggregate) => {
      assert.equal(approvedMaximumCredits <= aggregate.wallet.availableCredits,
        true)
      aggregate.wallet.availableCredits -= approvedMaximumCredits
      aggregate.wallet.reservedCredits += approvedMaximumCredits
      aggregate.wallet.ledgerSequence += 1
      aggregate.plans.push(structuredClone(approvedPlanRecord))
      aggregate.estimates.push(structuredClone(approvedEstimateRecord))
      aggregate.approvals.push(structuredClone(approvalRecord))
      aggregate.snapshots.push(structuredClone(approvedSnapshotRecord))
      aggregate.approvedWorkItems.push(
        structuredClone(approvedWorkItemRecord),
      )
      aggregate.reservations.push(structuredClone(reservationRecord))
      aggregate.ledgerEntries.push({
        id: 'authority-ledger-gpu-plan-reserve',
        sequence: aggregate.wallet.ledgerSequence,
        entryType: 'reserve',
        sourceType: 'canonical_plan_approval',
        sourceId: reservationRecord.id,
        availableDelta: -approvedMaximumCredits,
        reservedDelta: approvedMaximumCredits,
        spentDelta: 0,
        balanceAfter: walletBalanceAfter(aggregate.wallet),
        idempotencyKey: approvalRecord.idempotencyKey,
        createdAt,
      })
      aggregate.reservationEvents.push({
        id: 'authority-reservation-event-gpu-plan-reserve',
        reservationId: reservationRecord.id,
        snapshotId: approvedSnapshotRecord.snapshotId,
        approvalId: approvalRecord.id,
        eventType: 'reserved',
        credits: approvedMaximumCredits,
        idempotencyKey: approvalRecord.idempotencyKey,
        createdAt,
      })
      return { result: undefined, changed: true }
    },
  })

  const settled =
    await settleCanonicalProfessionalGpuPlanFundedAttemptCredits({
      context: settlementContext,
      terminalBindingId: fundedTerminal.terminalBinding.terminalBindingId,
      fundedLifecycleStore,
      attemptCostReceiptReadPort: {
        async rereadAttemptCostReceipt() {
          return structuredClone(attemptCostReceipt)
        },
      },
      settledAt: '2026-08-02T16:13:01.000Z',
    })
  settledCustomerCredits = settled.settlement.customerChargedCredits
  retainedPlanCredits = settled.settlement
    .unusedToolCeilingCreditsRetainedInSharedPlanReservation
  assert.equal(settled.idempotentReplay, false)
  assert.equal(settled.exactPersistedSettlementReread, true)
  assert.equal(settledCustomerCredits,
    attemptCostReceipt.customerEligibleToolCostCredits)
  assert.equal(settled.settlement.reservationSpendApplied, true)
  assert.equal(settled.settlement.serviceFeeSettledHere, false)
  assert.equal(settled.settlement
    .creditsReleasedOrRefundedAtAttemptSettlement, 0)
  assert.equal(settled
    .sharedPlanReservationRetainedForRemainingApprovedWork, true)

  const afterFirst = await readPrivateEditAuthorityAggregate({
    localStorageRoot: settlementRoot,
    workspaceId: approvedFunding.scope.workspaceId,
    ownerUserId: approvedFunding.scope.ownerUserId,
  })
  assert.equal(afterFirst?.wallet.spentCredits, settledCustomerCredits)
  assert.equal(afterFirst?.wallet.reservedCredits,
    approvedMaximumCredits - settledCustomerCredits)
  assert.equal(afterFirst?.gpuAttemptCreditSettlements.length, 1)
  const reservationAfterAttempt = afterFirst?.reservations.find((record) =>
    record.id === reservationRecord.id)
  assert.ok(reservationAfterAttempt)
  const finalReadiness =
    createCanonicalProfessionalGpuPlanFinalSettlementReadiness({
      schemaVersion:
        'canonical-professional-gpu-plan-final-settlement-readiness-v1',
      source:
        'canonical_private_professional_edit_completion_readiness_owner',
      evidenceClass: 'canonical_private_reread',
      readinessObservationId: 'ffmpeg-final-settlement-readiness-v1',
      approvedSnapshotRef: ref(
        approvedSnapshotRecord.snapshotId,
        approvedSnapshotRecord.snapshotHash,
        approvedSnapshotRecord.planVersion,
      ),
      approvedPlanRef: binding.publishedPlanRef,
      approvedCustomerEstimateRef: binding.publishedCustomerEstimateRef,
      fundedReservationRef: ref(
        reservationAfterAttempt.id,
        sha256AuthorityValue(reservationAfterAttempt),
      ),
      finalArtifactRef: ref('ffmpeg-final-master', 'f'),
      deterministicQaRef: ref('ffmpeg-final-deterministic-qa', 'e'),
      completeTimeVisualQaRef: ref('ffmpeg-complete-time-qa', 'd'),
      qualifiedVisualQaRef: ref('ffmpeg-qualified-visual-qa', 'c'),
      privateReviewDecisionRef: ref('ffmpeg-private-review', 'b'),
      allRequiredApprovedWorkTerminal: true,
      allRequiredAssetsReconciled: true,
      deterministicQaPassed: true,
      completeTimeVisualQaPassed: true,
      qualifiedVisualQaPassed: true,
      privateReviewAccepted: true,
      activeGpuJobCount: 0,
      activeGpuInstances: 0,
      allGpuWorkersStoppedVerified: true,
      callerOrBrowserCompletionAccepted: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
      observedAt: '2026-08-02T16:13:02.000Z',
    })
  const finalSettlement =
    await settleCanonicalProfessionalGpuPlanFinalCredits({
      context: settlementContext,
      workspaceId: approvedFunding.scope.workspaceId,
      snapshotId: approvedSnapshotRecord.snapshotId,
      pricingAuthorityLookupWorkItemKey: 'ffmpeg-master',
      pricingAuthorityReadPort: pricingAuthorityStore,
      readinessReadPort: {
        async rereadPrivateCompletionReadiness() {
          return structuredClone(finalReadiness)
        },
      },
      settledAt: '2026-08-02T16:13:03.000Z',
    })
  finalServiceFeeCredits = finalSettlement.settlement
    .customerServiceFeeCreditsChargedAtFinalSettlement
  finalReleasedCredits = finalSettlement.settlement
    .unusedReservationCreditsReleased
  assert.equal(finalSettlement.idempotentReplay, false)
  assert.equal(finalSettlement.settlement
    .actualBillableGpuToolCostCredits, settledCustomerCredits)
  assert.equal(finalSettlement.settlement.customerTotalChargedCredits,
    settledCustomerCredits + finalServiceFeeCredits)
  assert.equal(finalSettlement.settlement
    .activeGpuInstancesAtFinalSettlement, 0)
  assert.equal(finalSettlement.settlement.externalCustomerWalletMutated,
    false)
  assert.equal(finalSettlement.settlement.publicBillingAuthorityGranted,
    false)
  const afterFinal = await readPrivateEditAuthorityAggregate({
    localStorageRoot: settlementRoot,
    workspaceId: approvedFunding.scope.workspaceId,
    ownerUserId: approvedFunding.scope.ownerUserId,
  })
  const finalReservation = afterFinal?.reservations.find((record) =>
    record.id === reservationRecord.id)
  assert.equal(afterFinal?.wallet.reservedCredits, 0)
  assert.equal(afterFinal?.wallet.spentCredits,
    settledCustomerCredits + finalServiceFeeCredits)
  assert.equal(finalReservation?.releasedCredits, finalReleasedCredits)
  assert.equal(finalReservation?.status,
    finalReleasedCredits > 0 ? 'released' : 'spent')
  assert.equal(afterFinal?.gpuPlanFinalCreditSettlements.length, 1)
  const revisionAfterFinal = afterFinal?.revision

  const finalReplay =
    await settleCanonicalProfessionalGpuPlanFinalCredits({
      context: settlementContext,
      workspaceId: approvedFunding.scope.workspaceId,
      snapshotId: approvedSnapshotRecord.snapshotId,
      pricingAuthorityLookupWorkItemKey: 'ffmpeg-master',
      pricingAuthorityReadPort: pricingAuthorityStore,
      readinessReadPort: {
        async rereadPrivateCompletionReadiness() { return finalReadiness },
      },
      settledAt: '2026-08-02T16:13:04.000Z',
    })
  assert.equal(finalReplay.idempotentReplay, true)
  const afterFinalReplay = await readPrivateEditAuthorityAggregate({
    localStorageRoot: settlementRoot,
    workspaceId: approvedFunding.scope.workspaceId,
    ownerUserId: approvedFunding.scope.ownerUserId,
  })
  assert.equal(afterFinalReplay?.revision, revisionAfterFinal)
  assert.equal(afterFinalReplay?.wallet.spentCredits,
    settledCustomerCredits + finalServiceFeeCredits)

  const tamperedReadiness = structuredClone(finalReadiness)
  tamperedReadiness.privateReviewAccepted = false as true
  await assert.rejects(
    () => settleCanonicalProfessionalGpuPlanFinalCredits({
      context: settlementContext,
      workspaceId: approvedFunding.scope.workspaceId,
      snapshotId: approvedSnapshotRecord.snapshotId,
      pricingAuthorityLookupWorkItemKey: 'ffmpeg-master',
      pricingAuthorityReadPort: pricingAuthorityStore,
      readinessReadPort: {
        async rereadPrivateCompletionReadiness() {
          return tamperedReadiness
        },
      },
      settledAt: '2026-08-02T16:13:05.000Z',
    }),
  )

  const replay =
    await settleCanonicalProfessionalGpuPlanFundedAttemptCredits({
      context: settlementContext,
      terminalBindingId: fundedTerminal.terminalBinding.terminalBindingId,
      fundedLifecycleStore,
      attemptCostReceiptReadPort: {
        async rereadAttemptCostReceipt() { return attemptCostReceipt },
      },
      settledAt: '2026-08-02T16:13:06.000Z',
    })
  assert.equal(replay.idempotentReplay, true)
  const afterReplay = await readPrivateEditAuthorityAggregate({
    localStorageRoot: settlementRoot,
    workspaceId: approvedFunding.scope.workspaceId,
    ownerUserId: approvedFunding.scope.ownerUserId,
  })
  assert.equal(afterReplay?.revision, revisionAfterFinal)
  assert.equal(afterReplay?.wallet.spentCredits,
    settledCustomerCredits + finalServiceFeeCredits)
  assert.equal(afterReplay?.gpuAttemptCreditSettlements.length, 1)

  const tamperedReceipt = structuredClone(attemptCostReceipt)
  tamperedReceipt.customerEligibleToolCostCredits += 1
  await assert.rejects(
    () => settleCanonicalProfessionalGpuPlanFundedAttemptCredits({
      context: settlementContext,
      terminalBindingId: fundedTerminal.terminalBinding.terminalBindingId,
      fundedLifecycleStore,
      attemptCostReceiptReadPort: {
        async rereadAttemptCostReceipt() { return tamperedReceipt },
      },
      settledAt: '2026-08-02T16:13:07.000Z',
    }),
    /receipt|reconciliation|invalid/u,
  )
} finally {
  await rm(settlementRoot, { recursive: true, force: true })
}

const underfunded = structuredClone(approvedFunding)
underfunded.originallyReservedCredits -= 1
underfunded.approvedMaximumCredits -= 1
const underfundedPayload = { ...underfunded }
Reflect.deleteProperty(underfundedPayload, 'observationHash')
underfunded.observationHash = sha256AuthorityValue(underfundedPayload)
await assert.rejects(() => admitCanonicalProfessionalGpuPlanFundedDispatch({
  fundedAdmissionId: 'ffmpeg-underfunded-dispatch-v1',
  workspaceId: underfunded.scope.workspaceId,
  snapshotId: underfunded.approvedSnapshotRef.id,
  workItemKey: 'ffmpeg-master',
  pricingAuthorityReadPort: {
    async rereadPrivatePricingAuthority() { return pricingAuthorityBundle },
  },
  approvedFundingReadPort: {
    async rereadApprovedFunding() { return underfunded },
  },
  attemptStartReadPort: {
    async rereadCreateOnlyAttemptStart() { return attemptStart },
  },
  runtimeContextReadPort: {
    async rereadQualifiedRuntimeRelease() { return ffmpegRuntimeRelease },
    async rereadApprovedCurrentRate() { return rates.l4_standard_primary },
  },
  admittedAt: '2026-08-02T16:11:00.000Z',
  expiresAt: '2026-08-02T16:15:00.000Z',
}), /funding observation|reservation lineage|plan or reservation coverage/u)

const samWorkItems = workItemsForSam()
const samBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('sam3-plan'),
  components: components(),
  workItems: samWorkItems,
  confirmedOutputFrameRef: ref('confirmed-output-frame-sam', 'e'),
  workloads: [{
    workItemKey: 'sam3-mask',
    exactToolOrModelReleaseRef: ref('sam3-1-candidate-release', 'f'),
    workload: workload(),
  }],
})
assert.equal(samBasis.pricingUnits[0]?.toolId, 'sam3_1')
assert.equal(samBasis.pricingUnits[0]?.operationId,
  'tool.sam3_1.segment_and_track_subject.v1')
assert.equal(samBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'sam3_1_candidate_operation_release_qualification_pending')

const samQuote = quoteFor({
  basis: samBasis,
  workItemKey: 'sam3-mask',
  primaryRouteId: 'a100_80gb_heavy_primary',
})
let samQuoteReads = 0
let samRateReads = 0
const samManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'sam3-plan-gpu-pricing-v1',
    manifestVersion: 1,
    pricingBasis: samBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
        samQuoteReads += 1
        return structuredClone(samQuote)
      },
    },
    currentRateReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        samRateReads += 1
        return structuredClone(rates[input.routeId])
      },
    },
    createdAt,
  })
assert.equal(samQuoteReads, 1)
assert.equal(samRateReads, 2)
assert.equal(samManifest.entries[0]?.costCalculation.primary.routeId,
  'a100_80gb_heavy_primary')
assert.equal(samManifest.entries[0]?.costCalculation.fallback?.routeId,
  'l4_heavy_fallback')
assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: samBasis,
  manifest: samManifest,
  sourceEstimate,
  workItems: samWorkItems,
  at: createdAt,
}), /qualified and promoted/u)

assert.throws(() => createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('historical-plan'),
  components: components(),
  workItems: [toolWorkItem({
    workItemKey: 'historical-sam2',
    toolId: 'sam2',
    operationId: 'tool.sam2.segment_and_track_subject.v1',
  })],
  confirmedOutputFrameRef: ref('confirmed-output-frame-historical', '1'),
  workloads: [{
    workItemKey: 'historical-sam2',
    exactToolOrModelReleaseRef: ref('historical-sam2-release', '2'),
    workload: workload(),
  }],
}), /Historical or replaced/u)

const successorBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('successor-pending-plan'),
  components: components(),
  workItems: [toolWorkItem({
    workItemKey: 'libass-gpu-successor-pending',
    toolId: 'libass',
    operationId: exactOperation('libass'),
  })],
  confirmedOutputFrameRef: ref('confirmed-output-frame-pending', '3'),
  workloads: [{
    workItemKey: 'libass-gpu-successor-pending',
    exactToolOrModelReleaseRef: ref('libass-gpu-release', '4'),
    workload: workload(),
  }],
})
assert.equal(successorBasis.pricingUnits.length, 1)
assert.equal(successorBasis.pricingUnits[0]?.toolId, 'libass')
assert.equal(successorBasis.pricingUnits[0]?.operationId,
  exactOperation('libass'))

assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  sourceEstimate: {
    ...sourceEstimate,
    lineItems: [
      ...sourceEstimate.lineItems,
      structuredClone(ffmpegManifest.entries[0]!.customerEstimateLine),
    ],
  },
  workItems: ffmpegWorkItems,
  at: createdAt,
}), /pre-populate/u)

const changedWork = structuredClone(ffmpegWorkItems)
changedWork[0]!.attemptTimeoutSeconds += 1
assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  sourceEstimate,
  workItems: changedWork,
  at: createdAt,
}), /changed work graph/u)

const tamperedManifest = structuredClone(ffmpegManifest)
tamperedManifest.entries[0]!.customerEstimateLine.estimatedCredits += 1
assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: tamperedManifest,
  sourceEstimate,
  workItems: ffmpegWorkItems,
  at: createdAt,
}))

const changedBudgetOnly = structuredClone(ffmpegWorkItems)
changedBudgetOnly[0]!.maximumCreditBudget = 999_999
const budgetIndependentBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg-plan'),
  components: components(),
  workItems: changedBudgetOnly,
  confirmedOutputFrameRef: ref('confirmed-output-frame', 'a'),
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-gpu-release', 'b'),
    workload: workload(),
  }],
  helperParentBindings: [{
    helperWorkItemKey: 'ffprobe-helper',
    parentGpuWorkItemKey: 'ffmpeg-master',
  }],
})
assert.equal(budgetIndependentBasis.pricingBasisHash,
  ffmpegBasis.pricingBasisHash)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-plan-preapproval-authority',
  checks: 113,
  sourceFixtureOnly: true,
  liveCloudRateRead: false,
  liveGpuRuntimeExecuted: false,
  nonCircularPricingBasisProven: true,
  maximumCreditBudgetExcludedFromPricingBasis: true,
  ffmpegPrimaryRoute:
    ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  sam31CandidatePrimaryRoute:
    samManifest.entries[0]?.costCalculation.primary.routeId,
  sam31CandidateFallbackRoute:
    samManifest.entries[0]?.costCalculation.fallback?.routeId,
  sam31ApprovalBlockedUntilQualifiedAndPromoted: true,
  quoteReadOncePerPricingUnit:
    ffmpegQuoteReads === 1 && samQuoteReads === 1,
  accountEffectiveRateRereadCount: ffmpegRateReads + samRateReads,
  helperCostIncludedInParentAttempt: true,
  controlPlaneHasNoToolCharge: true,
  exactCustomerEstimateAndWorkBudgetBinding: true,
  exactDispatchEstimateMaterialization: true,
  approvalRequiresExactPersistedGpuPricingAuthority: true,
  approvalGpuPricingAuthorityExactReread: true,
  approvalMissingGpuEstimateLineRejected: true,
  approvalCpuSubstantiveFallbackFalse: true,
  durableCreateOnlyPricingBundlePersisted: pricingObjects.size === 3,
  exactSnapshotWorkPricingLookupReread: true,
  callerInventedPricingRepositoryRefRejected: true,
  crossSnapshotPricingLookupReturnsNoAuthority: true,
  tamperedPersistedPricingBundleRejected: true,
  postApprovalFundedDispatchReconciliationProven: true,
  fullApprovedEstimateReservedBeforeDispatch:
    fundedDispatchAdmission.fullCustomerEstimateFundedBeforeDispatch,
  currentWorkGpuCeilingStillFunded:
    fundedDispatchAdmission.currentWorkCeilingStillCovered,
  cloudJobCreated:
    fundedDispatchAdmission.cloudJobCreated,
  fundedScaleFromZeroLaunchBound:
    fundedJob.launchBinding.userTriggeredScaleFromZero,
  terminalGpuInstances:
    fundedTerminal.terminal.activeGpuInstancesAfterTerminalObservation,
  terminalCostReceiptBoundBeforeSettlement:
    fundedTerminal.terminalBinding.costReceiptPersistedBeforeSettlement,
  terminalReservationReconciliationRequired:
    fundedTerminal.terminalBinding
      .terminalSettlementOwnerMustReconcileReservation,
  completedAttemptCustomerCreditsAppliedExactlyOnce:
    settledCustomerCredits,
  unusedGpuAttemptCeilingRetainedForRemainingApprovedPlan:
    retainedPlanCredits,
  attemptSettlementKeepsFinalPlanServiceFeeSeparate: true,
  idempotentAttemptCreditReplayProven: true,
  tamperedAttemptCostReceiptRejected: true,
  finalPlanServiceFeeCreditsAppliedExactlyOnce: finalServiceFeeCredits,
  finalPlanUnusedReservationCreditsReleasedExactlyOnce:
    finalReleasedCredits,
  finalPlanReservationReturnedToZero: true,
  finalSettlementRequiresAcceptedPrivateCompletionEvidence: true,
  externalCustomerWalletMutationStillFalse: true,
  approvalGranted: binding.approvalGranted,
  creditReservationCreated: binding.creditReservationCreated,
  dispatchAuthorized: binding.dispatchAuthorized,
  pricingBasisHash: ffmpegBasis.pricingBasisHash,
  manifestHash: ffmpegManifest.manifestHash,
  publicationBindingHash: binding.bindingHash,
  dispatchEstimateSetHash: dispatchEstimateSet.estimateSetHash,
  fundedDispatchAdmissionHash:
    fundedDispatchAdmission.fundedAdmissionHash,
}))

function components(): CanonicalPlanComponentsInput {
  const totalFrames = 14_400
  return {
    compiledIntent: { goal: 'Clean and professionally edit the whole source.' },
    professionalEditingDirective: {
      pacing: 'meaning_first',
      mustFollowRules: ['Watch the complete source before cutting.'],
    },
    confirmedSettings: {
      aspectRatio: '9:16',
      outputFrame: { width: 2_160, height: 3_840, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage: buildProfessionalExportCreditCoverage({
        durationSeconds: 480,
        outputFps: 30,
        approvedAspectRatio: '9:16',
      }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'private_review',
      preferenceSnapshotId: 'gpu-plan-pricing-preferences-v1',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256: hash('5'),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'source-sequence-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: hash('6'),
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'meaning_first_professional_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'preserve-source-before-full-analysis',
        sourceSequenceItemId: 'source-sequence-1',
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: totalFrames,
        reason: 'Preserve complete meaning before approved trim execution.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-gpu-plan-pricing',
      status: 'ready',
      timingBase: { fps: 30, totalFrames },
      totalFrames,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames,
    },
    segments: [{
      segmentId: 'segment-complete-source',
      startFrame: 0,
      endFrameExclusive: totalFrames,
      operationIds: ['operation-complete-source'],
    }],
    visualAssetPlan: { status: 'source_led' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
    toolStrategyPlan: { strategy: 'quality_first_gpu_only' },
    qaPlan: { checks: ['complete_source', 'meaning', 'visual', 'audio'] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  }
}

function blobRef(value: unknown) {
  const serialized = stableAuthorityStringify(value)
  return {
    sha256: sha256AuthorityValue(value),
    byteLength: Buffer.byteLength(serialized, 'utf8'),
  }
}

function workItemsForFfmpeg(): CanonicalWorkItemInput[] {
  return [
    toolWorkItem({
      workItemKey: 'ffmpeg-master',
      toolId: 'ffmpeg',
      operationId: exactOperation('ffmpeg'),
      dependencyKeys: ['ffprobe-helper'],
    }),
    toolWorkItem({
      workItemKey: 'ffprobe-helper',
      toolId: 'ffprobe',
      operationId: exactOperation('ffprobe'),
    }),
    toolWorkItem({
      workItemKey: 'timeline-control',
      toolId: 'opentimelineio',
      operationId: exactOperation('opentimelineio'),
    }),
    {
      workItemKey: 'private-reconciliation',
      workItemType: 'custom',
      workerClass: 'authority_worker',
      executionInput: { operation: 'reconcile_exact_gpu_evidence' },
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [output('private-reconciliation')],
      dependencyKeys: ['ffmpeg-master'],
      approvedToolIds: [],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 1,
      attemptTimeoutSeconds: 60,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 0,
      required: true,
    },
  ]
}

function workItemsForSam(): CanonicalWorkItemInput[] {
  return [toolWorkItem({
    workItemKey: 'sam3-mask',
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  })]
}

function toolWorkItem(input: {
  workItemKey: string
  toolId: string
  operationId: string
  dependencyKeys?: string[]
}): CanonicalWorkItemInput {
  return {
    workItemKey: input.workItemKey,
    workItemType: 'process_video_asset',
    workerClass: 'gpu_media_worker',
    executionInput: {
      operation: input.operationId,
      approvedToolOperationIds: [input.operationId],
    },
    sourceSequenceItemIds: ['source-sequence-1'],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [output(`${input.workItemKey}-output`)],
    dependencyKeys: input.dependencyKeys ?? [],
    approvedToolIds: [input.toolId],
    providerExecutionMode: 'none',
    fallbackPolicy: {},
    maxAttempts: 1,
    attemptTimeoutSeconds: 600,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 777,
    required: true,
  }
}

function output(outputKey: string) {
  return {
    outputKey,
    artifactType: 'private_gpu_artifact',
    assetRole: 'processed' as const,
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/octet-stream',
    segmentIds: ['segment-complete-source'],
    timingIds: ['master-timing-gpu-plan-pricing'],
    rendererLayerIds: [],
  }
}

function scope(suffix: string) {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningRequestId: `planning-${suffix}`,
    outputId: 'output-9x16',
  }
}

function workload() {
  const sourceFrameCount = 14_400
  const pixelCount = 2_160 * 3_840
  return {
    workloadClass: 'source_video' as const,
    inputByteLength: 384 * 1024 * 1024,
    sourceDurationMilliseconds: 480_000,
    sourceFrameCount,
    sourcePixelCount: sourceFrameCount * pixelCount,
    outputFrameCount: sourceFrameCount,
    outputPixelCount: sourceFrameCount * pixelCount,
    subjectAssetOrTrackCount: 1,
  }
}

function quoteFor(input: {
  basis: CanonicalProfessionalGpuPlanPricingBasis
  workItemKey: string
  primaryRouteId: 'a100_80gb_heavy_primary' | 'l4_standard_primary'
}): CanonicalProfessionalGpuPlanUsageQuote {
  const unit = input.basis.pricingUnits.find((candidate) =>
    candidate.workItemKey === input.workItemKey)!
  const primary = measuredRoute({
    routeId: input.primaryRouteId,
    toolReleaseRef: unit.exactToolOrModelReleaseRef,
    runtimeCharacter: input.primaryRouteId ===
      'a100_80gb_heavy_primary' ? '7' : '8',
    benchmarkCharacter: input.primaryRouteId ===
      'a100_80gb_heavy_primary' ? '9' : 'a',
    activeGpuMilliseconds: input.primaryRouteId ===
      'a100_80gb_heavy_primary'
      ? [90_000, 150_000, 260_000]
      : [40_000, 70_000, 110_000],
  })
  const heavy = input.primaryRouteId === 'a100_80gb_heavy_primary'
  return createCanonicalProfessionalGpuPlanUsageQuote({
    quoteId: `quote-${input.workItemKey}`,
    quoteVersion: 1,
    pricingBasis: input.basis,
    workItemKey: input.workItemKey,
    primary,
    ...(heavy ? {
      fallback: measuredRoute({
        routeId: 'l4_heavy_fallback',
        toolReleaseRef: unit.exactToolOrModelReleaseRef,
        runtimeCharacter: 'b',
        benchmarkCharacter: 'c',
        activeGpuMilliseconds: [180_000, 300_000, 450_000],
      }),
      primaryPreInferenceFailureHighUsage: usage('a100', 0),
    } : {}),
    observedAt,
    expiresAt,
  })
}

function measuredRoute(input: {
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  toolReleaseRef: ReturnType<typeof ref>
  runtimeCharacter: string
  benchmarkCharacter: string
  activeGpuMilliseconds: [number, number, number]
}) {
  const route = input.routeId === 'a100_80gb_heavy_primary'
    ? 'a100' as const
    : 'l4' as const
  return {
    routeId: input.routeId,
    usageRange: {
      low: usage(route, input.activeGpuMilliseconds[0]),
      expected: usage(route, input.activeGpuMilliseconds[1]),
      high: usage(route, input.activeGpuMilliseconds[2]),
    },
    benchmarkRunCount: 30,
    benchmarkRunSetRef:
      ref(`benchmark-${input.routeId}`, input.benchmarkCharacter),
    toolOrModelArtifactReleaseRef: input.toolReleaseRef,
    runtimeReleaseRef:
      ref(`runtime-${input.routeId}`, input.runtimeCharacter),
  }
}

function usage(route: 'a100' | 'l4', activeGpuMilliseconds: number) {
  const coldStartMilliseconds = 10_000
  const runtimeAndModelLoadMilliseconds = activeGpuMilliseconds === 0
    ? 0
    : 20_000
  const drainAndShutdownMilliseconds = 2_000
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: coldStartMilliseconds
      + runtimeAndModelLoadMilliseconds
      + activeGpuMilliseconds
      + drainAndShutdownMilliseconds,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: route === 'a100' ? 12 : 8,
    allocatedMemoryGiB: route === 'a100' ? 170 : 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: 128 * 1024 * 1024,
    privateArtifactRetentionMilliseconds: 24 * 60 * 60 * 1_000,
    networkEgressBytes: 0,
    classAOperationCount: 4,
    classBOperationCount: 8,
  }
}

function runtimeRelease(input: {
  toolId: 'ffmpeg'
  operationId: string
  exactToolOrModelReleaseRef: ReturnType<typeof ref>
  routeId: 'l4_standard_primary'
}) {
  const imageRef = ref('ffmpeg-l4-qualified-image', '1')
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v3' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: 'ffmpeg-l4-private-runtime-release-v1',
    releaseVersion: 1,
    status: 'private_internal_qualified' as const,
    toolId: input.toolId,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: input.toolId,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: input.operationId,
    toolCostProfileId: 'gpu-tool-ffmpeg-v1',
    modelOrOperationCostProfileId:
      'l4_standard_media_render_and_qa_v1' as const,
    routeId: input.routeId,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    serviceIdentityRef: ref('ffmpeg-l4-service-identity', '2'),
    immutableImageRef: imageRef,
    immutableImageDigest: imageRef.contentHash,
    sourceAndDependencyClosureRef: ref('ffmpeg-l4-source-closure', '3'),
    toolOrModelArtifactReleaseRef: input.exactToolOrModelReleaseRef,
    sbomRef: ref('ffmpeg-l4-sbom', '4'),
    imageScanAndSignatureRef: ref('ffmpeg-l4-scan-signature', '5'),
    cudaDriverRuntimeQualificationRef: ref('ffmpeg-l4-cuda', '6'),
    substantiveGpuExecutionQualificationRef:
      ref('ffmpeg-l4-substantive-gpu', '7'),
    scaleToZeroConfigurationRef: ref('ffmpeg-l4-scale-zero', '8'),
    privateNetworkAndArtifactTransportRef:
      ref('ffmpeg-l4-private-transport', '9'),
    substantiveGpuEvidenceClass:
      'nvenc_nvdec_hardware_codec_execution' as const,
    exactToolOrModelVersionReread: true as const,
    exactCudaAndNativeDependencyClosureReread: true as const,
    actualGpuKernelModelRenderOrHardwareCodecMeasured: true as const,
    cpuOnlySubstantiveExecutionObserved: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyQualification: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerImageModelToolOrCommandSelectionAllowed: false as const,
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
    stopsAtTerminalAttempt: true as const,
    qualificationRunCount: 30,
    qualifiedAt: '2026-08-02T16:05:00.000Z',
    expiresAt: '2026-09-01T16:05:00.000Z',
    privateInternalQualified: true as const,
    customerBillingAuthorityGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionQualified: false as const,
  }
  return canonicalProfessionalToolGpuRuntimeReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

function exactOperation(toolId: string): string {
  const operation = resolveCompleteProfessionalToolOperationSpec(toolId)
  assert.ok(operation)
  assert.equal(operation.allowedOperationIds.length, 1)
  return operation.allowedOperationIds[0]
}

async function observeRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  if (routeId === 'a100_80gb_heavy_primary') {
    return observeCanonicalVertexA100RateFixture({
      observedAt,
      rateAuthorityId: 'current-vertex-a100-rate-v1',
      billingAccountCharacter: '2',
      readerCharacter: '3',
    })
  }
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `current-rate-${routeId}-v1`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawRateObservation(routeId)
      },
    },
  })
}

function rawRateObservation(
  routeId:
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent('cloud_run_l4_gpu_second',
      'gpu_second', 186_700, 'e'),
    rateComponent('cloud_run_vcpu_second',
      'vcpu_second', 18_000, 'f'),
    rateComponent('cloud_run_memory_gib_second',
      'gib_second', 2_000, '1'),
    ...commonRateComponents(),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef:
      ref('billing-account-pricing-scope', '2'),
    pricingReaderConfigurationRef:
      ref('gpu-rate-reader-configuration', '3'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, '4'),
    pricingReadStartedAt: '2026-08-02T15:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...base,
    pricingReadDigestSha256: sha256AuthorityValue(base),
  }
}

function commonRateComponents() {
  return [
    rateComponent('private_object_storage_gib_month',
      'gib_month', 20_000_000, '5'),
    rateComponent('network_egress_gib',
      'gib', 120_000_000, '6'),
    rateComponent('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '7'),
    rateComponent('object_class_b_per_1000',
      'per_1000_operations', 400_000, '8'),
  ]
}

function rateComponent(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  maximumUsdNanosPerBillingUnit: number,
  character: string,
) {
  return {
    componentClass,
    cloudServiceName: 'google-cloud',
    skuRateBindingId: `sku-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId: 'services-google-cloud',
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'on-demand',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        ref(`billing-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}
