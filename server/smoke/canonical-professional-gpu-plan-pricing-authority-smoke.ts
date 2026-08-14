import assert from 'node:assert/strict'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
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
  assertCanonicalProfessionalGpuPlanDispatchEstimateSet,
  assertCanonicalProfessionalGpuPlanPricingBasis,
  createCanonicalProfessionalGpuPlanDispatchEstimateSet,
  createCanonicalProfessionalGpuPlanPreapprovalManifest,
  createCanonicalProfessionalGpuPlanPricingBasis,
  createCanonicalProfessionalGpuPlanPublicationBinding,
  createCanonicalProfessionalGpuPlanUsageQuote,
  type CanonicalProfessionalGpuPlanPricingBasis,
} from '../services/canonical-professional-gpu-plan-preapproval-authority-service'
import {
  canonicalPlanRequiresProfessionalGpuPricingAuthority,
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority,
  verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority,
} from '../services/canonical-professional-gpu-plan-approval-pricing-authority'
import {
  createCanonicalConfirmedOutputFrameAuthority,
} from '../services/canonical-confirmed-output-frame-authority'
import {
  admitCanonicalProfessionalGpuPlanFundedDispatch,
  admitCanonicalProfessionalGpuPlanFundedPrivateInternalDispatch,
  canonicalProfessionalGpuApprovedFundingObservationSchema,
  createCanonicalProfessionalGpuAttemptStartAuthority,
  createCanonicalProfessionalGpuPlanPricingAuthorityBundle,
} from '../services/canonical-professional-gpu-plan-funded-dispatch-service'
import {
  createCanonicalProfessionalGpuPricingAuthorityStore,
  createCanonicalProfessionalGpuPricingRepositoryRecordRef,
} from '../services/canonical-professional-gpu-pricing-authority-store'
import {
  assertCanonicalProfessionalGpuFundedTerminalBinding,
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  launchCanonicalProfessionalGpuPreparedPlanFundedJob,
  prepareCanonicalProfessionalGpuPlanFundedJob,
  recordCanonicalProfessionalGpuPlanFundedTerminal,
  startCanonicalProfessionalGpuPlanFundedJob,
} from '../services/canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  createCanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import {
  resolvedPlanningInputAuthorityBindingSchema,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'

const observedAt = '2026-08-03T14:00:00.000Z'
const createdAt = '2026-08-03T14:10:00.000Z'
const expiresAt = '2026-08-04T14:00:00.000Z'
const rates = {
  a100_80gb_heavy_primary:
    await observeRate('a100_80gb_heavy_primary'),
  l4_heavy_fallback: await observeRate('l4_heavy_fallback'),
  l4_standard_primary: await observeRate('l4_standard_primary'),
}
const planComponents = components()
const planningAuthority = planningInputAuthority()
const confirmedOutputFrameAuthority =
  createCanonicalConfirmedOutputFrameAuthority({
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningInputAuthority: planningAuthority,
    components: planComponents,
  })

const ffmpegWork = [toolWorkItem({
  workItemKey: 'ffmpeg-master',
  toolId: 'ffmpeg',
  operationId: exactOperation('ffmpeg'),
})]
const ffmpegBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg'),
  components: planComponents,
  workItems: ffmpegWork,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-release', 'b'),
    workload: workload(),
  }],
})
assert.equal(ffmpegBasis.pricingUnits.length, 1)
assert.equal(ffmpegBasis.pricingUnits[0]?.toolId, 'ffmpeg')
assert.equal(
  ffmpegBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'canonical_production_operation_registered',
)
assert.equal(ffmpegBasis.maximumCreditBudgetExcludedFromPricingBasis, true)
const changedCallerBudget = structuredClone(ffmpegWork)
changedCallerBudget[0]!.maximumCreditBudget = 9_999_999
const budgetIndependentBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg'),
  components: planComponents,
  workItems: changedCallerBudget,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-release', 'b'),
    workload: workload(),
  }],
})
assert.equal(
  budgetIndependentBasis.canonicalWorkGraphPricingStructureDigestSha256,
  ffmpegBasis.canonicalWorkGraphPricingStructureDigestSha256,
)

const ffmpegQuote = quoteFor({
  basis: ffmpegBasis,
  workItemKey: 'ffmpeg-master',
  primaryRouteId: 'l4_standard_primary',
})
let quoteReads = 0
let rateReads = 0
const ffmpegManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'ffmpeg-plan-pricing-manifest',
    manifestVersion: 1,
    pricingBasis: ffmpegBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
        quoteReads += 1
        return structuredClone(ffmpegQuote)
      },
    },
    currentRateReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        rateReads += 1
        return structuredClone(rates[input.routeId])
      },
    },
    createdAt,
  })
assert.equal(quoteReads, 1)
assert.equal(rateReads, 1)
assert.equal(ffmpegManifest.entries.length, 1)
assert.equal(ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  'l4_standard_primary')
assert.equal(ffmpegManifest.entries[0]?.costCalculation.fallback, null)
assert.equal(ffmpegManifest.serviceFeeIncluded, false)
assert.equal(ffmpegManifest.customerCreditsMutated, false)
assert.equal(ffmpegManifest.userTriggeredScaleFromZeroRequired, true)
assert.equal(ffmpegManifest.terminalAttemptScaleBackToZeroRequired, true)

const sourceEstimate: CanonicalEstimateInput = {
  lineItems: [{
    lineKey: 'base-edit-coordination',
    label: 'Base edit coordination',
    category: 'control_plane',
    estimatedCredits: 0,
    removable: false,
    metadata: {},
  }],
  fallbackAllowanceCredits: 3,
  validForSeconds: 3_600,
}
const applied = applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  sourceEstimate,
  workItems: ffmpegWork,
  at: createdAt,
})
assert.equal(applied.estimate.lineItems.length, 2)
assert.equal(applied.estimate.lineItems[1]?.category,
  'gpu_tool_infrastructure')
assert.equal(
  applied.workItems[0]?.maximumCreditBudget,
  ffmpegManifest.totalMaximumReservedToolCostCredits,
)

const estimateHash = sha256AuthorityValue(applied.estimate)
const binding = createCanonicalProfessionalGpuPlanPublicationBinding({
  bindingId: 'ffmpeg-plan-pricing-binding',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publishedPlanRef: ref('published-plan', 'c'),
  publishedCustomerEstimateRef:
    ref('published-customer-estimate', estimateHash),
  publishedWorkItems: applied.workItems,
  publishedCustomerEstimate: applied.estimate,
  boundAt: createdAt,
})
assert.equal(binding.exactGpuBudgetsAppliedToWorkItems, true)
assert.equal(binding.exactGpuLinesIncludedInCustomerEstimate, true)
assert.equal(binding.approvalGranted, false)
assert.equal(binding.dispatchAuthorized, false)
assert.throws(() => createCanonicalProfessionalGpuPlanPublicationBinding({
  bindingId: 'ffmpeg-plan-pricing-binding-tampered-estimate-ref',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publishedPlanRef: ref('published-plan', 'c'),
  publishedCustomerEstimateRef: ref('published-customer-estimate', 'd'),
  publishedWorkItems: applied.workItems,
  publishedCustomerEstimate: applied.estimate,
  boundAt: createdAt,
}), /exact estimate/u)

const approvalPricingAuthority =
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority({
    authorityId: 'ffmpeg-plan-approval-pricing-authority',
    workspaceId: ffmpegBasis.scope.workspaceId,
    editPlanId: binding.publishedPlanRef.id,
    pricingBasis: ffmpegBasis,
    preapprovalManifest: ffmpegManifest,
    publicationBinding: binding,
    sealedAt: createdAt,
  })
assert.equal(
  canonicalPlanRequiresProfessionalGpuPricingAuthority(ffmpegWork),
  true,
)
assert.equal(verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: structuredClone(approvalPricingAuthority),
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
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: applied.estimate,
  confirmedOutputFrameAuthority,
  at: createdAt,
}).authorityHash, approvalPricingAuthority.authorityHash)

const tamperedFrameAuthority = structuredClone(confirmedOutputFrameAuthority)
tamperedFrameAuthority.authorityDigestSha256 = hash('9')
assert.throws(() => verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: approvalPricingAuthority,
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
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: applied.estimate,
  confirmedOutputFrameAuthority: tamperedFrameAuthority,
  at: createdAt,
}), /confirmed-output authority digest/u)

const estimateWithoutGpuLine = structuredClone(applied.estimate)
estimateWithoutGpuLine.lineItems = estimateWithoutGpuLine.lineItems.filter(
  (line) => line.category !== 'gpu_tool_infrastructure',
)
assert.throws(() => verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: approvalPricingAuthority,
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
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: estimateWithoutGpuLine,
  confirmedOutputFrameAuthority,
  at: createdAt,
}), /immutable plan/u)

let approvalAccessorInvoked = false
const accessorApprovalInput: Record<string, unknown> = {
  authorityId: 'accessor-approval-pricing',
  workspaceId: ffmpegBasis.scope.workspaceId,
  editPlanId: binding.publishedPlanRef.id,
  preapprovalManifest: ffmpegManifest,
  publicationBinding: binding,
  sealedAt: createdAt,
}
Object.defineProperty(accessorApprovalInput, 'pricingBasis', {
  enumerable: true,
  get() {
    approvalAccessorInvoked = true
    return ffmpegBasis
  },
})
assert.throws(() =>
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority(
    accessorApprovalInput as never,
  ), /enumerable data properties/u)
assert.equal(approvalAccessorInvoked, false)

const dispatchSet = createCanonicalProfessionalGpuPlanDispatchEstimateSet({
  estimateSetId: 'ffmpeg-plan-dispatch-estimates',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publicationBinding: binding,
  approvedWorkItemRefs: [{
    workItemKey: 'ffmpeg-master',
    approvedWorkItemRef: ref('approved-work-ffmpeg-master', 'e'),
  }],
  createdAt,
})
assert.equal(dispatchSet.entries.length, 1)
assert.equal(
  dispatchSet.entries[0]?.estimate.maximumReservedToolCostCredits,
  ffmpegManifest.totalMaximumReservedToolCostCredits,
)
assert.equal(dispatchSet.dispatchAuthorized, false)
const forgedNestedEstimate = structuredClone(dispatchSet)
forgedNestedEstimate.entries[0]!.estimate.estimateHash = hash('f')
const forgedSetPayload = { ...forgedNestedEstimate }
Reflect.deleteProperty(forgedSetPayload, 'estimateSetHash')
forgedNestedEstimate.estimateSetHash = sha256AuthorityValue(forgedSetPayload)
assert.throws(() => assertCanonicalProfessionalGpuPlanDispatchEstimateSet(
  forgedNestedEstimate,
), /estimate hash/u)

const approvedMaximumCredits = applied.estimate.lineItems.reduce(
  (total, line) => total + line.estimatedCredits,
  applied.estimate.fallbackAllowanceCredits,
)
const approvedSnapshotRef = ref('approved-snapshot-ffmpeg', '1')
const userApprovalRecordRef = ref('approval-ffmpeg', '2')
const fundedReservationRef = ref('reservation-ffmpeg', '3')
const approvedWorkItemRef = dispatchSet.entries[0]!.approvedWorkItemRef
const fundingPayload = {
  schemaVersion:
    'canonical-professional-gpu-approved-funding-observation-v1' as const,
  source: 'canonical_edit_planning_authority_reread' as const,
  evidenceClass: 'canonical_private_reread' as const,
  observationId: 'ffmpeg-approved-funding-observation',
  scope: {
    ...ffmpegBasis.scope,
    editPlanId: binding.publishedPlanRef.id,
    editPlanVersion: binding.publishedPlanRef.version,
  },
  publishedPlanRef: binding.publishedPlanRef,
  publishedCustomerEstimateRef: binding.publishedCustomerEstimateRef,
  approvedSnapshotRef,
  userApprovalRecordRef,
  fundedReservationRef,
  confirmedOutputFrame: {
    outputFrameRef:
      confirmedOutputFrameAuthority.confirmedOutputBinding
        .confirmedOutputFrameRef,
    outputId: confirmedOutputFrameAuthority.confirmedOutputBinding.outputId,
    aspectRatio:
      confirmedOutputFrameAuthority.confirmedOutputBinding.aspectRatioLabel,
    width: confirmedOutputFrameAuthority.confirmedOutputBinding.width,
    height: confirmedOutputFrameAuthority.confirmedOutputBinding.height,
    fpsNumerator:
      confirmedOutputFrameAuthority.confirmedOutputBinding.fpsNumerator,
    fpsDenominator:
      confirmedOutputFrameAuthority.confirmedOutputBinding.fpsDenominator,
    confirmedByUser: true as const,
    confirmationRecordId:
      confirmedOutputFrameAuthority.confirmedOutputBinding
        .confirmationRecordId,
  },
  masterTimingRef: ref(
    'master-timing-plan',
    ffmpegBasis.masterTimingDigestSha256,
  ),
  approvedWorkItem: {
    workItemKey: 'ffmpeg-master',
    approvedWorkItemRef,
    canonicalWorkItemDigestSha256: sha256AuthorityValue(applied.workItems[0]),
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
  reservationExpiresAt: '2026-08-04T14:10:00.000Z',
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
const pricingBundle = createCanonicalProfessionalGpuPlanPricingAuthorityBundle({
  bundleId: 'ffmpeg-plan-pricing-authority-bundle',
  repositoryRecordRef: pricingRepositoryRecordRef,
  pricingBasis: ffmpegBasis,
  preapprovalManifest: ffmpegManifest,
  publicationBinding: binding,
  dispatchEstimateSet: dispatchSet,
  persistedAt: createdAt,
})
const privatePricingObjects = new Map<string, Buffer>()
const pricingObjectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly({ objectPath, body }) {
    const existing = privatePricingObjects.get(objectPath)
    if (existing) {
      if (!existing.equals(body)) {
        throw new Error('GPU pricing create-only collision.')
      }
      return 'already_exists'
    }
    privatePricingObjects.set(objectPath, Buffer.from(body))
    return 'created'
  },
  async readExact(objectPath) {
    const body = privatePricingObjects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}
const pricingStore = createCanonicalProfessionalGpuPricingAuthorityStore({
  objectPort: pricingObjectPort,
})
await pricingStore.persistPlanApprovalPricingAuthority({
  authority: approvalPricingAuthority,
})
assert.equal(stableAuthorityStringify(
  await pricingStore.rereadPublishedPlanPricingAuthority({
    workspaceId: ffmpegBasis.scope.workspaceId,
    editPlanId: binding.publishedPlanRef.id,
    at: createdAt,
  }),
), stableAuthorityStringify(approvalPricingAuthority))
const pricingLookup = await pricingStore.persistPricingAuthority({
  bundle: pricingBundle,
  approvedFunding,
  persistedAt: createdAt,
})
assert.equal(pricingLookup.repositoryRecordRef.contentHash,
  pricingRepositoryRecordRef.contentHash)
assert.equal(stableAuthorityStringify(
  await pricingStore.rereadPrivatePricingAuthority({
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: approvedFunding.approvedWorkItem.workItemKey,
    at: createdAt,
  }),
), stableAuthorityStringify(pricingBundle))
assert.equal(await pricingStore.rereadPrivatePricingAuthority({
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: 'unknown-snapshot',
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  at: createdAt,
}), null)

const attemptStart = createCanonicalProfessionalGpuAttemptStartAuthority({
  attemptAuthorityId: 'ffmpeg-attempt-start',
  scope: approvedFunding.scope,
  approvedSnapshotRef,
  approvedWorkItemRef,
  workerLeaseRef: ref('ffmpeg-worker-lease', '4'),
  userTriggerRecordRef: ref('ffmpeg-user-trigger', '5'),
  executionAttemptRef: ref('ffmpeg-execution-attempt', '6'),
  idempotencyKey: 'ffmpeg-execution-attempt-1',
  routeId: 'l4_standard_primary',
  triggeredAt: createdAt,
  expiresAt: '2026-08-03T14:20:00.000Z',
})
assert.throws(() => createCanonicalProfessionalGpuAttemptStartAuthority({
  attemptAuthorityId: 'unsafe-fallback-attempt',
  scope: approvedFunding.scope,
  approvedSnapshotRef,
  approvedWorkItemRef,
  workerLeaseRef: ref('fallback-worker-lease', '7'),
  userTriggerRecordRef: ref('fallback-user-trigger', '8'),
  executionAttemptRef: ref('fallback-execution-attempt', '9'),
  idempotencyKey: 'unsafe-fallback-attempt-2',
  routeId: 'l4_heavy_fallback',
  priorPrimaryTerminalReceiptRef: ref('primary-terminal', 'a'),
  priorPrimaryFailureClass:
    'a100_capacity_unavailable_before_attempt_start',
  priorPrimaryOutcomeKnownNotExecuted: false,
  triggeredAt: createdAt,
  expiresAt: '2026-08-03T14:20:00.000Z',
}), /safe trigger or fallback truth/u)

let runtimeReleaseReads = 0
let dispatchRateReads = 0
const fundedAdmission = await admitCanonicalProfessionalGpuPlanFundedDispatch({
  fundedAdmissionId: 'ffmpeg-funded-dispatch-admission',
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: approvedFunding.approvedSnapshotRef.id,
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  pricingAuthorityReadPort: pricingStore,
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
      runtimeReleaseReads += 1
      return runtimeRelease()
    },
    async rereadApprovedCurrentRate() {
      dispatchRateReads += 1
      return structuredClone(rates.l4_standard_primary)
    },
  },
  admittedAt: createdAt,
  expiresAt: '2026-08-03T14:15:00.000Z',
})
assert.equal(runtimeReleaseReads, 1)
assert.equal(dispatchRateReads, 1)
assert.equal(fundedAdmission.fullCustomerEstimateFundedBeforeDispatch, true)
assert.equal(fundedAdmission.currentWorkCeilingStillCovered, true)
assert.equal(fundedAdmission.authenticatedUserTriggeredScaleFromZero, true)
assert.equal(fundedAdmission.cloudJobCreated, false)
assert.equal(fundedAdmission.customerCreditsMutated, false)
assert.equal(fundedAdmission.toolDispatchAdmission.routeId,
  'l4_standard_primary')
await assert.rejects(() =>
  admitCanonicalProfessionalGpuPlanFundedPrivateInternalDispatch({
    fundedAdmissionId: 'ffmpeg-private-internal-admission-refused',
    workspaceId: approvedFunding.scope.workspaceId,
    snapshotId: approvedFunding.approvedSnapshotRef.id,
    workItemKey: approvedFunding.approvedWorkItem.workItemKey,
    pricingAuthorityReadPort: pricingStore,
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
        return runtimeRelease()
      },
      async rereadApprovedCurrentRate() {
        return structuredClone(rates.l4_standard_primary)
      },
    },
    privateInternalDispatchReadinessReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadCurrent() {
        throw new Error('Non-SAM work must not read SAM private readiness.')
      },
    },
    admittedAt: createdAt,
    expiresAt: '2026-08-03T14:15:00.000Z',
  }),
  /selected another tool/u,
)

const lifecycleObjects = new Map<string, Buffer>()
const durableLifecycleStore =
  createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: {
      async createOnly({ objectPath, body }) {
        const existing = lifecycleObjects.get(objectPath)
        if (existing) {
          if (!existing.equals(body)) {
            throw new Error('GPU lifecycle create-only collision.')
          }
          return 'already_exists'
        }
        lifecycleObjects.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = lifecycleObjects.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
    prefix: 'private/weeditpro/gpu-funded-lifecycle-v1',
  })
const lifecycleStore = durableLifecycleStore
const fundedLifecycleStore = durableLifecycleStore

const launchTarget = createCanonicalProfessionalGpuRuntimeLaunchTarget({
  runtimeRelease: runtimeRelease(),
  fixedServerTaskContractRef: ref('ffmpeg-fixed-task-contract', '7'),
  at: createdAt,
})
const fundedLifecycleIdentity =
  createCanonicalProfessionalGpuFundedLifecycleIdentity({
    attemptStartAuthority: attemptStart,
  })
let fundedCloudLaunchCount = 0
const fundedJobStartInput: Parameters<
  typeof startCanonicalProfessionalGpuPlanFundedJob
>[0] = {
  fundedAdmissionId: fundedLifecycleIdentity.fundedAdmissionId,
  prelaunchAuthorizationId:
    fundedLifecycleIdentity.prelaunchAuthorizationId,
  launchRecordId: fundedLifecycleIdentity.launchRecordId,
  launchBindingId: fundedLifecycleIdentity.launchBindingId,
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: approvedFunding.approvedSnapshotRef.id,
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  pricingAuthorityReadPort: pricingStore,
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
      runtimeReleaseReads += 1
      return runtimeRelease()
    },
    async rereadApprovedCurrentRate() {
      dispatchRateReads += 1
      return structuredClone(rates.l4_standard_primary)
    },
  },
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(launchTarget)
    },
  },
  launchPort: {
    async startOneShotJob(input) {
      fundedCloudLaunchCount += 1
      assert.ok(await durableLifecycleStore.rereadPrelaunchAuthorization({
        prelaunchAuthorizationId:
          fundedLifecycleIdentity.prelaunchAuthorizationId,
      }))
      assert.ok(await durableLifecycleStore.rereadAdmissionConsumption({
        admissionId: input.admission.admissionId,
      }))
      assert.ok(await durableLifecycleStore.rereadExecutionEnvelope({
        envelopeId: input.executionEnvelopeRef.id,
      }))
      return {
        disposition: 'accepted' as const,
        cloudJobExecutionRef: ref('ffmpeg-cloud-job', '8'),
        cloudJobCreateRequestRef: ref('ffmpeg-cloud-create', '9'),
        providerRequestIdDigestSha256: sha256AuthorityValue(
          'ffmpeg-cloud-provider-request',
        ),
        observedAt: '2026-08-03T14:12:01.000Z',
        providerInferenceOrSubstantiveWorkKnownExecuted:
          'not_executed' as const,
      }
    },
  },
  lifecycleStore,
  fundedLifecycleStore,
  admittedAt: '2026-08-03T14:11:00.000Z',
  admissionExpiresAt: '2026-08-03T14:15:00.000Z',
  startedAt: '2026-08-03T14:12:00.000Z',
}

const prepared = await prepareCanonicalProfessionalGpuPlanFundedJob({
  fundedAdmissionId: fundedLifecycleIdentity.fundedAdmissionId,
  prelaunchAuthorizationId:
    fundedLifecycleIdentity.prelaunchAuthorizationId,
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: approvedFunding.approvedSnapshotRef.id,
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  pricingAuthorityReadPort: pricingStore,
  approvedFundingReadPort: fundedJobStartInput.approvedFundingReadPort,
  attemptStartReadPort: fundedJobStartInput.attemptStartReadPort,
  runtimeContextReadPort: fundedJobStartInput.runtimeContextReadPort,
  fundedLifecycleStore,
  admittedAt: fundedJobStartInput.admittedAt,
  admissionExpiresAt: fundedJobStartInput.admissionExpiresAt,
  preparedAt: fundedJobStartInput.startedAt,
})
assert.equal(fundedCloudLaunchCount, 0)
assert.equal(lifecycleObjects.size, 1)
const splitStarted = await launchCanonicalProfessionalGpuPreparedPlanFundedJob({
  launchRecordId: fundedLifecycleIdentity.launchRecordId,
  launchBindingId: fundedLifecycleIdentity.launchBindingId,
  prelaunchAuthorization: prepared,
  releaseReadPort: fundedJobStartInput.releaseReadPort,
  launchPort: fundedJobStartInput.launchPort,
  lifecycleStore: durableLifecycleStore,
  fundedLifecycleStore,
  startedAt: fundedJobStartInput.startedAt,
})
assert.equal(splitStarted.launch.launchDisposition, 'job_created')
assert.equal(fundedCloudLaunchCount, 1)
assert.equal(
  (await launchCanonicalProfessionalGpuPreparedPlanFundedJob({
    launchRecordId: fundedLifecycleIdentity.launchRecordId,
    launchBindingId: fundedLifecycleIdentity.launchBindingId,
    prelaunchAuthorization: prepared,
    releaseReadPort: fundedJobStartInput.releaseReadPort,
    launchPort: fundedJobStartInput.launchPort,
    lifecycleStore: durableLifecycleStore,
    fundedLifecycleStore,
    startedAt: fundedJobStartInput.startedAt,
  })).launch.launchHash,
  splitStarted.launch.launchHash,
)
assert.equal(fundedCloudLaunchCount, 1)

// Use a fresh immutable lifecycle prefix for the original combined API proof.
const combinedObjects = new Map<string, Buffer>()
const combinedLifecycleStore =
  createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: {
      async createOnly({ objectPath, body }) {
        const existing = combinedObjects.get(objectPath)
        if (existing) {
          if (!existing.equals(body)) throw new Error('combined collision')
          return 'already_exists'
        }
        combinedObjects.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = combinedObjects.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
    prefix: 'private/weeditpro/gpu-funded-lifecycle-combined-v1',
  })
const combinedFundedJobStartInput = {
  ...fundedJobStartInput,
  lifecycleStore: combinedLifecycleStore,
  fundedLifecycleStore: combinedLifecycleStore,
}
fundedCloudLaunchCount = 0
const fundedJob = await startCanonicalProfessionalGpuPlanFundedJob(
  combinedFundedJobStartInput,
)
assert.equal(runtimeReleaseReads, 3)
assert.equal(dispatchRateReads, 3)
assert.equal(fundedCloudLaunchCount, 1)
assert.ok(await combinedLifecycleStore.rereadPrelaunchAuthorization({
  prelaunchAuthorizationId: fundedLifecycleIdentity.prelaunchAuthorizationId,
}))
assert.ok(await combinedLifecycleStore.rereadAdmissionConsumption({
  admissionId: fundedJob.prelaunchAuthorization
    .fundedDispatchAdmission.toolDispatchAdmission.admissionId,
}))
assert.ok(await combinedLifecycleStore.rereadExecutionEnvelope({
  envelopeId: fundedJob.prelaunchAuthorization.fundedDispatchAdmission
    .toolDispatchAdmission.admissionId + '.execution-envelope',
}))
assert.ok(await combinedLifecycleStore.rereadLaunchRecord({
  launchRecordId: fundedLifecycleIdentity.launchRecordId,
}))
assert.equal(fundedJob.launch.accelerator, 'nvidia_l4')
assert.equal(fundedJob.launch.launchDisposition, 'job_created')
assert.equal(fundedJob.launch.minimumIdleInstances, 0)
assert.equal(
  fundedJob.launchBinding.fundedPrelaunchRereadBeforeCloudJobCreation,
  true,
)
assert.equal(fundedJob.launchBinding.userTriggeredScaleFromZero, true)
assert.equal(
  fundedJob.launchBinding.retryAllowedWithoutCanonicalReconciliation,
  false,
)
assert.equal(fundedJob.launchBinding.unknownLaunchOutcomeBlocksRetry, false)
assert.equal(fundedJob.launchBinding.customerCreditsMutated, false)

await assert.rejects(() => startCanonicalProfessionalGpuPlanFundedJob({
  ...combinedFundedJobStartInput,
  fundedAdmissionId: 'caller-changed-funded-admission-id',
}), /IDs differ from the authenticated attempt identity/u)
assert.equal(combinedObjects.size, 5)
assert.equal(fundedCloudLaunchCount, 1)
await assert.rejects(() => startCanonicalProfessionalGpuPlanFundedJob(
  combinedFundedJobStartInput,
), /prelaunch authorization already exists/u)
assert.equal(fundedCloudLaunchCount, 1)

const attemptCostReceipt =
  createCanonicalProfessionalToolGpuAttemptCostReceipt({
    receiptId: 'ffmpeg-funded-attempt-cost',
    estimate: dispatchSet.entries[0]!.estimate,
    approvedSnapshotRef: approvedFunding.approvedSnapshotRef,
    approvalRecordRef: approvedFunding.userApprovalRecordRef,
    fundedReservationRef: approvedFunding.fundedReservationRef,
    executionAttemptId: attemptStart.executionAttemptRef.id,
    routeId: 'l4_standard_primary',
    rateAuthority: rates.l4_standard_primary,
    workerUsageEvidenceRef: ref('ffmpeg-worker-usage', 'a'),
    platformUsageRereadRef: ref('ffmpeg-platform-usage', 'b'),
    providerOrModelInferenceOutcome: 'executed',
    actualUsage: usage('l4', 40_000),
    terminalOutcome: 'completed',
    attemptStartedAt: fundedJob.launch.launchedAt,
    recordedAt: '2026-08-03T14:12:59.000Z',
  })
assert.equal(attemptCostReceipt.customerEligibleToolCostCredits > 0, true)
assert.equal(
  attemptCostReceipt.rateAuthorityRef.contentHash,
  `sha256:${rates.l4_standard_primary.rateAuthorityHash}`,
)

const terminalObservationPayload = {
  schemaVersion: 'canonical-professional-gpu-terminal-observation-v1' as const,
  source: 'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  launchRef: ref(
    fundedJob.launch.launchRecordId,
    fundedJob.launch.launchHash,
  ),
  cloudJobExecutionRef: fundedJob.launch.cloudJobExecutionRef,
  cloudTerminalObservationRef: ref('ffmpeg-cloud-terminal', 'c'),
  cloudCapacityTeardownObservationRef: ref('ffmpeg-cloud-stop', 'd'),
  workerUsageEvidenceRef: attemptCostReceipt.workerUsageEvidenceRef,
  currentAccountPriceAuthorityRef: ref(
    rates.l4_standard_primary.rateAuthorityId,
    rates.l4_standard_primary.rateAuthorityHash,
    rates.l4_standard_primary.rateAuthorityVersion,
  ),
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
  observedAt: '2026-08-03T14:13:00.000Z',
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
  fundedTerminal.terminalBinding.retryAllowedWithoutCanonicalReconciliation,
  false,
)
assert.equal(fundedTerminal.terminalBinding.unknownOutcomeBlocksRetry, false)
assert.deepEqual(
  fundedTerminal.terminalBinding.attemptCostReceiptRef,
  terminalObservationPayload.attemptCostReceiptRef,
)
assert.equal(
  fundedTerminal.terminalBinding.customerWalletOrLedgerMutated,
  false,
)
assert.ok(await durableLifecycleStore.rereadTerminalRecord({
  terminalRecordId: fundedLifecycleIdentity.terminalRecordId,
}))
assert.ok(await durableLifecycleStore.rereadTerminalBinding({
  terminalBindingId: fundedLifecycleIdentity.terminalBindingId,
}))

const unknownTerminalBindingPayload = {
  ...fundedTerminal.terminalBinding,
  providerInferenceOrSubstantiveWorkOutcome: 'unknown' as const,
  unknownOutcomeBlocksRetry: true,
}
Reflect.deleteProperty(unknownTerminalBindingPayload, 'terminalBindingHash')
const unknownTerminalBinding = {
  ...unknownTerminalBindingPayload,
  terminalBindingHash: sha256AuthorityValue(unknownTerminalBindingPayload),
}
assert.equal(
  assertCanonicalProfessionalGpuFundedTerminalBinding(
    unknownTerminalBinding,
  ).unknownOutcomeBlocksRetry,
  true,
)
const unsafeUnknownTerminalBindingPayload = {
  ...unknownTerminalBindingPayload,
  unknownOutcomeBlocksRetry: false,
}
assert.throws(() => assertCanonicalProfessionalGpuFundedTerminalBinding({
  ...unsafeUnknownTerminalBindingPayload,
  terminalBindingHash: sha256AuthorityValue(
    unsafeUnknownTerminalBindingPayload,
  ),
}), /unknown-outcome retry truth/u)

let fundedTerminalAccessorInvoked = false
const accessorTerminalBinding = structuredClone(
  fundedTerminal.terminalBinding,
) as Record<string, unknown>
Object.defineProperty(accessorTerminalBinding, 'terminalBindingHash', {
  enumerable: true,
  get() {
    fundedTerminalAccessorInvoked = true
    return fundedTerminal.terminalBinding.terminalBindingHash
  },
})
assert.throws(() => assertCanonicalProfessionalGpuFundedTerminalBinding(
  accessorTerminalBinding,
), /accessor/u)
assert.equal(fundedTerminalAccessorInvoked, false)
const symbolTerminalBinding = structuredClone(fundedTerminal.terminalBinding)
Object.defineProperty(symbolTerminalBinding, Symbol('hidden-authority'), {
  enumerable: true,
  value: true,
})
assert.throws(() => assertCanonicalProfessionalGpuFundedTerminalBinding(
  symbolTerminalBinding,
), /symbol key/u)

await assert.rejects(() => admitCanonicalProfessionalGpuPlanFundedDispatch({
  fundedAdmissionId: 'hostile-funding-admission',
  workspaceId: approvedFunding.scope.workspaceId,
  snapshotId: approvedFunding.approvedSnapshotRef.id,
  workItemKey: approvedFunding.approvedWorkItem.workItemKey,
  pricingAuthorityReadPort: pricingStore,
  approvedFundingReadPort: {
    async rereadApprovedFunding() {
      return new Proxy({}, {
        ownKeys() {
          throw new Error('hostile funding read')
        },
      })
    },
  },
  attemptStartReadPort: {
    async rereadCreateOnlyAttemptStart() {
      return structuredClone(attemptStart)
    },
  },
  runtimeContextReadPort: {
    async rereadQualifiedRuntimeRelease() {
      throw new Error('must not read runtime after hostile funding')
    },
    async rereadApprovedCurrentRate() {
      throw new Error('must not read rates after hostile funding')
    },
  },
  admittedAt: createdAt,
  expiresAt: '2026-08-03T14:15:00.000Z',
}), /cannot be inspected/u)

let accessorInvoked = false
const accessorBasis: Record<string, unknown> = {}
Object.defineProperty(accessorBasis, 'schemaVersion', {
  enumerable: true,
  get() {
    accessorInvoked = true
    return ffmpegBasis.schemaVersion
  },
})
assert.throws(() => assertCanonicalProfessionalGpuPlanPricingBasis(
  accessorBasis,
), /accessor/u)
assert.equal(accessorInvoked, false)
assert.throws(() => assertCanonicalProfessionalGpuPlanPricingBasis(
  new Proxy({}, {
    ownKeys() {
      throw new Error('hostile proxy payload')
    },
  }),
), /cannot be inspected/u)

const samWork = [toolWorkItem({
  workItemKey: 'sam31-mask',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
})]
const samBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('sam31'),
  components: planComponents,
  workItems: samWork,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'sam31-mask',
    exactToolOrModelReleaseRef: ref('sam31-model-release', '1'),
    workload: workload(),
  }],
})
assert.equal(
  samBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'sam3_1_candidate_operation_release_qualification_pending',
)
const samQuote = quoteFor({
  basis: samBasis,
  workItemKey: 'sam31-mask',
  primaryRouteId: 'a100_80gb_heavy_primary',
})
let samRateReads = 0
const samManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'sam31-plan-pricing-manifest',
    manifestVersion: 1,
    pricingBasis: samBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
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
assert.equal(samRateReads, 2)
assert.equal(samManifest.entries[0]?.costCalculation.primary.routeId,
  'a100_80gb_heavy_primary')
assert.equal(samManifest.entries[0]?.costCalculation.fallback?.routeId,
  'l4_heavy_fallback')
assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: samBasis,
  manifest: samManifest,
  sourceEstimate,
  workItems: samWork,
  at: createdAt,
}), /qualified and promoted/u)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-plan-pricing-authority',
  checks: 118,
  sourceFixtureOnly: true,
  liveCloudRateRead: false,
  liveGpuRuntimeExecuted: false,
  maximumCreditBudgetExcludedFromPricingBasis: true,
  ffmpegPrimaryRoute:
    ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  sam31PrimaryRoute:
    samManifest.entries[0]?.costCalculation.primary.routeId,
  sam31FallbackRoute:
    samManifest.entries[0]?.costCalculation.fallback?.routeId,
  sam31ApprovalBlockedUntilQualifiedAndPromoted: true,
  exactCustomerEstimateRefBinding: true,
  exactConfirmedOutputFrameAuthorityBinding: true,
  approvalPricingAuthorityRereadVerified: true,
  createOnlyPricingAuthorityPersistenceVerified: true,
  fundedReservationRereadBeforeDispatch: true,
  nonSamPrivateInternalAdmissionRefused: true,
  userTriggeredAttemptAuthorityRequired: true,
  unsafeHeavyFallbackRejected: true,
  fundedDispatchAdmissionCreatedCloudJob: fundedAdmission.cloudJobCreated,
  fundedLifecycleCloudLaunchCount: fundedCloudLaunchCount,
  fundedLifecycleScaleToZero:
    fundedTerminal.terminal.activeGpuInstancesAfterTerminalObservation === 0,
  fundedLifecycleRetryWithoutReconciliationAllowed:
    fundedTerminal.terminalBinding
      .retryAllowedWithoutCanonicalReconciliation,
  fundedLifecycleUnknownOutcomeBlocksRetry:
    unknownTerminalBinding.unknownOutcomeBlocksRetry,
  fundedLifecycleAccountRateReceiptBound: true,
  fundedLifecycleCustomerCreditsMutated:
    fundedTerminal.terminalBinding.customerWalletOrLedgerMutated,
  missingGpuEstimateLineRejected: true,
  nestedDispatchEstimateHashVerified: true,
  hostileAccessorInvoked: accessorInvoked || approvalAccessorInvoked,
  callerPriceAccepted: false,
  customerCreditsMutated: false,
  approvalGranted: false,
  dispatchAuthorized: false,
  productionAuthorityGranted: false,
  pricingBasisHash: ffmpegBasis.pricingBasisHash,
  manifestHash: ffmpegManifest.manifestHash,
  publicationBindingHash: binding.bindingHash,
  approvalPricingAuthorityHash: approvalPricingAuthority.authorityHash,
  dispatchEstimateSetHash: dispatchSet.estimateSetHash,
  pricingBundleHash: pricingBundle.bundleHash,
  fundedAdmissionHash: fundedAdmission.fundedAdmissionHash,
}))

function planningInputAuthority(): ResolvedPlanningInputAuthorityBinding {
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'talking_head_personal_brand' as const,
    cleanupPreference: 'balanced_cleanup' as const,
    visualPreference: 'balanced_visual_mix' as const,
    moodStyle: 'clean' as const,
    creditPreference: 'premium_best_result' as const,
    targetPlatform: 'client_review' as const,
  }
  const withoutHash = {
    schemaVersion: 'canonical-planning-input-authority-binding-v1' as const,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    exactEditPreference: {
      recordRevision: 1,
      preferenceRevision: 1,
      planningInputRevision: 1,
      preferenceFingerprintSha256: hash('2'),
      values,
      effectiveValues: values,
      instructionSource: 'current_edit_preferences' as const,
      explicitChatOverrideKeys: [],
      explicitChatOverrides: {},
      instructionHash: hash('7'),
      baseline: {
        preferenceSnapshotId: 'gpu-plan-pricing-preferences-v1',
        persistenceSource: 'authenticated_private_internal_backend' as const,
        provenance: 'saved_edit_preferences' as const,
      },
      sourcePreparationEvidenceHash: hash('8'),
      sourceCandidateHash: null,
      frameConfirmationId: 'confirmed-output-frame',
      confirmedAspectRatio: '9:16' as const,
      lifecyclePhase: 'planning' as const,
      locked: false,
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
      applicationHash: hash('a'),
    },
    editBrief: {
      status: 'not_used' as const,
      deterministicHash: hash('b'),
    },
    instructionPriority: [
      'explicit_user_request',
      'confirmed_edit_preferences',
      'approved_edit_brief',
      'professional_editing_rules',
      'workflow_defaults',
      'tier_policy',
      'safe_fallbacks',
    ],
    noRuntimeSideEffects: true as const,
  }
  return resolvedPlanningInputAuthorityBindingSchema.parse({
    ...withoutHash,
    bindingHash: sha256AuthorityValue(withoutHash),
  })
}

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
      preferenceFingerprintSha256: hash('2'),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'source-sequence-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: hash('3'),
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

function toolWorkItem(input: {
  workItemKey: string
  toolId: string
  operationId: string
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
    expectedOutputs: [{
      outputKey: `${input.workItemKey}-output`,
      artifactType: 'private_gpu_artifact',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/octet-stream',
      segmentIds: ['segment-complete-source'],
      timingIds: ['master-timing-gpu-plan-pricing'],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
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

function scope(suffix: string) {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningRequestId: `planning-${suffix}`,
    outputId:
      confirmedOutputFrameAuthority.confirmedOutputBinding.outputId,
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
}) {
  const unit = input.basis.pricingUnits.find((candidate) =>
    candidate.workItemKey === input.workItemKey)!
  const heavy = input.primaryRouteId === 'a100_80gb_heavy_primary'
  return createCanonicalProfessionalGpuPlanUsageQuote({
    quoteId: `quote-${input.workItemKey}`,
    quoteVersion: 1,
    pricingBasis: input.basis,
    workItemKey: input.workItemKey,
    primary: measuredRoute({
      routeId: input.primaryRouteId,
      toolReleaseRef: unit.exactToolOrModelReleaseRef,
      character: heavy ? '4' : '5',
      activeGpuMilliseconds: heavy
        ? [90_000, 150_000, 260_000]
        : [40_000, 70_000, 110_000],
    }),
    ...(heavy ? {
      fallback: measuredRoute({
        routeId: 'l4_heavy_fallback',
        toolReleaseRef: unit.exactToolOrModelReleaseRef,
        character: '6',
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
  toolReleaseRef:
    CanonicalProfessionalGpuPlanPricingBasis['pricingUnits'][number][
      'exactToolOrModelReleaseRef'
    ]
  character: string
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
    benchmarkRunSetRef: ref(`benchmark-${input.routeId}`, input.character),
    toolOrModelArtifactReleaseRef: input.toolReleaseRef,
    runtimeReleaseRef: ref(`runtime-${input.routeId}`, input.character),
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

function runtimeRelease() {
  const exactToolOrModelReleaseRef =
    ffmpegBasis.pricingUnits[0]!.exactToolOrModelReleaseRef
  const immutableImageRef = ref('ffmpeg-l4-qualified-image', 'b')
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v3' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: 'ffmpeg-l4-private-runtime-release',
    releaseVersion: 1,
    status: 'private_internal_qualified' as const,
    toolId: 'ffmpeg' as const,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: 'ffmpeg' as const,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: exactOperation('ffmpeg'),
    toolCostProfileId: 'gpu-tool-ffmpeg-v1',
    modelOrOperationCostProfileId:
      'l4_standard_media_render_and_qa_v1' as const,
    routeId: 'l4_standard_primary' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    serviceIdentityRef: ref('ffmpeg-l4-service-identity', 'c'),
    immutableImageRef,
    immutableImageDigest: immutableImageRef.contentHash,
    sourceAndDependencyClosureRef: ref('ffmpeg-l4-source-closure', 'd'),
    toolOrModelArtifactReleaseRef: exactToolOrModelReleaseRef,
    sbomRef: ref('ffmpeg-l4-sbom', 'e'),
    imageScanAndSignatureRef: ref('ffmpeg-l4-scan-signature', 'f'),
    cudaDriverRuntimeQualificationRef: ref('ffmpeg-l4-cuda', '1'),
    substantiveGpuExecutionQualificationRef:
      ref('ffmpeg-l4-substantive-gpu', '2'),
    scaleToZeroConfigurationRef: ref('ffmpeg-l4-scale-zero', '3'),
    privateNetworkAndArtifactTransportRef:
      ref('ffmpeg-l4-private-transport', '4'),
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
    qualifiedAt: '2026-08-03T13:00:00.000Z',
    expiresAt: '2026-09-03T13:00:00.000Z',
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
      billingAccountRefId: 'billing-account-scope',
      billingAccountCharacter: 'b',
      readerRefId: 'pricing-reader-config',
      readerCharacter: 'c',
    })
  }
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `current-rate-${routeId}`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawRate(routeId)
      },
    },
  })
}

function rawRate(
  routeId:
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('cloud_run_l4_gpu_second',
      'gpu_second', 186_700, '8'),
    component('cloud_run_vcpu_second',
      'vcpu_second', 18_000, '9'),
    component('cloud_run_memory_gib_second',
      'gib_second', 2_000, 'a'),
    ...commonComponents(),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-scope', 'b'),
    pricingReaderConfigurationRef: ref('pricing-reader-config', 'c'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, 'd'),
    pricingReadStartedAt: '2026-08-03T13:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib', 'gib', 120_000_000, 'f'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function component(
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
      billingAccountPriceRef: ref(
        `billing-account-price-${componentClass}`,
        character,
      ),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}

function ref(id: string, characterOrHash: string, version = 1) {
  const digest = characterOrHash.length === 64
    ? characterOrHash
    : hash(characterOrHash)
  return {
    id,
    version,
    contentHash: `sha256:${digest}` as const,
  }
}

function hash(character: string): string {
  return character.repeat(64)
}
