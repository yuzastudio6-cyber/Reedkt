import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
  type LivingFrameControlledIllustrationActualCostAttribution,
  type LivingFrameControlledIllustrationAttemptCostAttribution,
} from '../../src/types/living-frame-controlled-illustration-actual-cost-attribution'
import {
  compileLivingFrameControlledIllustrationSettlementContribution,
  verifyLivingFrameControlledIllustrationSettlementContribution,
} from '../living-frame/living-frame-controlled-illustration-settlement-contribution'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  TOOL_COST_RATE_CARD_VERSION,
} from '../tool-cost-metering/rate-card'

const sha = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex')

const gpuCapabilities = [
  'comfyui_execution_host',
  'comfyui_controlnet_aux_preprocessing',
  'controlnet_conditioning',
  'ipadapter_reference_conditioning',
  'peft_lora_adapter_loading',
] as const

const attempts = [
  attempt('evidence-completed-gpu', 'completed', 'gpu', 40_000),
  attempt('evidence-completed-aura', 'completed', 'auraface', 40_000),
  attempt('evidence-failed-gpu', 'failed', 'gpu', 40_000),
  attempt('evidence-unknown-aura', 'unknown', 'auraface', 40_000),
] as const

const attributionDraft = {
  contractVersion:
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION,
  resultClass:
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS,
  attributionId: 'lfcost_settlement_fixture',
  canonicalScope: {
    ownerUserId: 'owner-settlement',
    workspaceId: 'workspace-settlement',
    projectId: 'project-settlement',
    editSessionId: 'edit-settlement',
    approvedPlanSnapshotId: 'snapshot-settlement',
    approvedPlanSnapshotHashSha256: sha('snapshot'),
    packageRecordId: 'package-settlement',
    packageHashSha256: sha('package'),
  },
  sourceBindings: {
    attemptEvidenceSourceClass:
      'controlled_non_promotable_attempt_cost_source',
    operationPreflightDigestSha256: sha('preflight'),
    approvedLineageBindingDigestSha256: sha('lineage'),
    selectedSceneAdmissionDigestSha256: sha('scene'),
    estimateProjectionDigestSha256: sha('estimate'),
    workGraphProjectionDigestSha256: sha('work-graph'),
  },
  attemptAttributions: attempts,
  exactReuseAttributions: [{
    reuseId: 'reuse-settlement',
    order: 0,
    costComponentId:
      'shared_controlled_illustration_gpu_host',
    capabilityIds: gpuCapabilities,
    reusedAssetId: 'asset-reused',
    reusedAssetHashSha256: sha('asset-reused'),
    sourceAttemptEvidenceId: 'prior-evidence',
    sourceAttemptEvidenceHashSha256: sha('prior-evidence'),
    approvedReuseDecisionDigestSha256: sha('reuse-decision'),
    newWorkerAttemptCreated: false,
    incrementalInternalCostMicros: 0,
    originalAttemptCostErased: false,
    customerBillabilityDecisionPresent: false,
    customerCreditAllocationPresent: false,
  }],
  aggregate: {
    completedAttemptCount: 2,
    failedAttemptCount: 1,
    unknownAttemptCount: 1,
    exactReuseCount: 1,
    sharedGpuHostAttemptCount: 2,
    auraFaceCpuMeasurementAttemptCount: 2,
    totalObservedAttemptInternalCostMicros: 160_000,
    exactReuseIncrementalInternalCostMicros: 0,
    sharedGpuHostChargedOncePerObservedAttempt: true,
    capabilityIdsAreAttributionNotIndependentCharges: true,
    auraFaceCostSeparatedFromGpuHost: true,
    failedAndUnknownAttemptCostRetained: true,
  },
  openGateCodes: [
    ...LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
  ],
  authorityBoundary: {
    controlledInternalCostAttributionOnly: true,
    officialRateAuthority: false,
    invoiceAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    customerBillabilityAuthority: false,
    serviceFeeAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    reservationAuthority: false,
    walletAuthority: false,
    refundAuthority: false,
    settlementAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  },
  existingCanonicalEstimateRemainsAuthority: true,
  existingCanonicalSettlementRemainsAuthority: true,
  callerSuppliedCostAccepted: false,
  customerChargeCalculated: false,
  settlementEventCreated: false,
  productionReady: false,
} as const

const attribution = {
  ...attributionDraft,
  attributionDigestSha256:
    sha256AuthorityValue(attributionDraft),
} satisfies LivingFrameControlledIllustrationActualCostAttribution

const contribution =
  compileLivingFrameControlledIllustrationSettlementContribution({
    contributionId: 'lf-settlement-contribution-fixture',
    actualCostAttribution: attribution,
    approvedCustomerEstimateDigestSha256:
      sha('approved-customer-estimate'),
    canonicalBillabilityPolicyDigestSha256:
      sha('billability-policy'),
    approvedLivingFrameToolCostCreditCeiling: 1,
  })

assert.equal(
  verifyLivingFrameControlledIllustrationSettlementContribution(
    contribution,
  ),
  true,
)
assert.equal(
  contribution.aggregate.totalObservedInternalCostMicros,
  160_000,
)
assert.equal(
  contribution.aggregate.billableCandidateInternalCostMicros,
  80_000,
)
assert.equal(
  contribution.aggregate.absorbedInternalCostMicros,
  80_000,
)
assert.equal(
  contribution.aggregate.billableCandidateToolCostCredits,
  1,
)
assert.equal(
  contribution.events.reduce(
    (sum, event) =>
      sum + event.allocatedBillableToolCostCredits,
    0,
  ),
  1,
)
assert.equal(
  contribution.events.filter((event) =>
    event.includedInBillableToolCostCandidate).length,
  2,
)
assert.equal(
  contribution.events.filter((event) =>
    !event.includedInBillableToolCostCandidate).every((event) =>
      event.allocatedBillableToolCostCredits === 0),
  true,
)
assert.equal(
  contribution.events.length,
  attribution.attemptAttributions.length,
)
assert.equal(
  contribution.events.some((event) =>
    event.sourceEvidenceId === 'prior-evidence'),
  false,
)
assert.equal(contribution.aggregate.exactReuseCount, 1)
assert.equal(contribution.serviceFeeLinePresent, false)
assert.equal(contribution.finalCustomerChargePresent, false)

const overage =
  compileLivingFrameControlledIllustrationSettlementContribution({
    contributionId: 'lf-settlement-overage-fixture',
    actualCostAttribution: attribution,
    approvedCustomerEstimateDigestSha256:
      sha('approved-customer-estimate'),
    canonicalBillabilityPolicyDigestSha256:
      sha('billability-policy'),
    approvedLivingFrameToolCostCreditCeiling: 0,
  })
assert.equal(
  overage.aggregate.withinApprovedLivingFrameToolCostCeiling,
  false,
)
assert.equal(
  overage.aggregate.projectedUnapprovedOverageCredits,
  1,
)
assert.equal(
  overage.authorityBoundary.overageDecisionAuthority,
  false,
)

const perAttemptRounded = structuredClone(contribution) as unknown as
  Record<string, unknown> & {
    events: Array<{
      allocatedBillableToolCostCredits: number
    }>
    aggregate: {
      billableCandidateToolCostCredits: number
    }
    contributionDigestSha256: string
  }
perAttemptRounded.events[0]!.allocatedBillableToolCostCredits = 1
perAttemptRounded.events[1]!.allocatedBillableToolCostCredits = 1
perAttemptRounded.aggregate.billableCandidateToolCostCredits = 2
perAttemptRounded.contributionDigestSha256 =
  sha256AuthorityValue(withoutDigest(perAttemptRounded))
assert.equal(
  verifyLivingFrameControlledIllustrationSettlementContribution(
    perAttemptRounded,
  ),
  false,
)

const forgedServiceFee = {
  ...structuredClone(contribution),
  serviceFeeLinePresent: true,
  serviceFeeCredits: 9,
} as Record<string, unknown>
forgedServiceFee.contributionDigestSha256 =
  sha256AuthorityValue(withoutDigest(forgedServiceFee))
assert.equal(
  verifyLivingFrameControlledIllustrationSettlementContribution(
    forgedServiceFee,
  ),
  false,
)

const tamperedAttribution = structuredClone(attribution) as unknown as {
  aggregate: {
    totalObservedAttemptInternalCostMicros: number
  }
}
tamperedAttribution.aggregate.totalObservedAttemptInternalCostMicros += 1
await assert.rejects(
  async () =>
    compileLivingFrameControlledIllustrationSettlementContribution({
      contributionId: 'lf-settlement-tampered',
      actualCostAttribution: tamperedAttribution as unknown as
        LivingFrameControlledIllustrationActualCostAttribution,
      approvedCustomerEstimateDigestSha256:
        sha('approved-customer-estimate'),
      canonicalBillabilityPolicyDigestSha256:
        sha('billability-policy'),
      approvedLivingFrameToolCostCreditCeiling: 1,
    }),
  /Actual-cost attribution is invalid/u,
)

console.log(
  'Living Frame settlement contribution passed aggregate-before-rounding, '
  + 'completed-only billable candidates, failed/unknown absorption, '
  + 'exact-reuse exclusion, overage deferral, no service-fee duplication, '
  + 'and forged/tampered rejection checks.',
)

function attempt(
  evidenceId: string,
  outcome: 'completed' | 'failed' | 'unknown',
  component: 'gpu' | 'auraface',
  micros: number,
): LivingFrameControlledIllustrationAttemptCostAttribution {
  const gpu = component === 'gpu'
  return {
    order: attemptsOrder(evidenceId),
    evidenceClass: 'private_injected_observed_usage_test',
    costComponentId: gpu
      ? 'shared_controlled_illustration_gpu_host'
      : 'auraface_cpu_continuity_measurement',
    capabilityIds: gpu
      ? gpuCapabilities
      : ['auraface_identity_measurement'],
    evidenceId,
    evidenceHashSha256: sha(evidenceId),
    executionAttemptId: `attempt-${evidenceId}`,
    approvedWorkItemId: `work-${evidenceId}`,
    attemptOrdinal: 1,
    operation: {
      canonicalToolId: gpu ? 'comfyui' : 'transformers',
      operationId: gpu
        ? 'tool.comfyui.generate_controlled_image.v1'
        : 'tool.transformers.measure_auraface_identity_continuity.v1',
      operationProfileHashSha256:
        sha(`operation-${component}`),
    },
    observedUsage: {
      wallTimeMilliseconds: 1_000,
      allocatedVcpuMilliseconds: gpu ? 8_000 : 2_000,
      allocatedMemoryMibMilliseconds:
        gpu ? 32_768_000 : 4_096_000,
      allocatedGpuMilliseconds: gpu ? 1_000 : 0,
      observedGpuActiveMilliseconds: gpu ? 800 : 0,
      networkEgressBytes: 0,
    },
    rateCard: {
      rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
      rateCardDigestSha256: sha('rate-card'),
      rateAuthorityClass:
        'mock_safe_placeholder_not_cloud_invoice',
      officialCloudRateApproved: false,
      invoiceReconciled: false,
    },
    actualInternalCostMicros: micros,
    outcome,
    failureCategory: outcome === 'completed'
      ? 'none'
      : outcome === 'failed'
        ? 'timeout'
        : 'unknown',
    failedOrUnknownAttemptCostRetained: true,
    serviceFeeIncluded: false,
    customerBillabilityDecisionPresent: false,
    customerCreditAllocationPresent: false,
  }
}

function attemptsOrder(evidenceId: string): number {
  return [
    'evidence-completed-gpu',
    'evidence-completed-aura',
    'evidence-failed-gpu',
    'evidence-unknown-aura',
  ].indexOf(evidenceId)
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const clone = structuredClone(value)
  delete clone.contributionDigestSha256
  return clone
}
