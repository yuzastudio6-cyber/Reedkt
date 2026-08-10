import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
  CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
  canonicalA100VertexCustomJobExecutionRecordSchema,
  canonicalA100VertexCustomJobLaunchAuthoritySchema,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
  canonicalA100VertexCustomJobTerminalReadSchema,
} from '../services/canonical-a100-vertex-custom-job-terminal-port'
import {
  settleCanonicalA100VertexAttemptCredits,
} from '../services/canonical-a100-vertex-attempt-credit-settlement-service'
import {
  CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION,
  CANONICAL_A100_VERTEX_TERMINAL_COST_CONTEXT_VERSION,
  CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION,
  assertCanonicalA100VertexTerminalCostContext,
  canonicalA100VertexPlatformUsageEvidenceSchema,
  canonicalA100VertexTerminalCostContextSchema,
  canonicalA100VertexWorkerUsageEvidenceSchema,
  createCanonicalA100VertexTerminalCostEvidenceReadPort,
} from '../services/canonical-a100-vertex-terminal-cost-evidence-service'
import {
  assertCanonicalA100VertexProviderAllocationCostReceipt,
  type CanonicalA100VertexProviderAllocationCostReceipt,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import {
  CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_VERSION,
  CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES,
  canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'

const OBSERVED_AT = '2026-08-06T20:00:00.000Z'
const CREATE_TIME = '2026-08-06T19:55:00.000Z'
const START_TIME = '2026-08-06T19:56:00.000Z'
const END_TIME = '2026-08-06T19:59:00.000Z'
const PROVIDER_TIMES = {
  createTime: CREATE_TIME,
  startTime: START_TIME,
  endTime: END_TIME,
  providerStartTimeObserved: true,
}

const settlementFixtures = buildSettlementFixtures()
const rate = buildRateAuthority()
const authority = buildAuthority(settlementFixtures)
const execution = buildExecution()
const executionRef = ref(execution.executionRecordId,
  execution.executionRecordHash)
const cloudTerminalObservationRef = ref('vertex-terminal', sha('terminal'))
const worker = buildWorker('executed')
const workerUsageEvidenceRef = ref(
  `vertex-a100-worker-usage.${execution.executionRecordHash.slice(0, 32)}`,
  worker.evidenceHash,
)
const platform = buildPlatform(workerUsageEvidenceRef)
const context = buildContext()
const receipts = new Map<
  string,
  CanonicalA100VertexProviderAllocationCostReceipt
>()
let rateReads = 0
let receiptCreates = 0

const port = createCanonicalA100VertexTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return structuredClone(context)
    },
  },
  workerUsageReadPort: {
    async rereadPrivateWorkerUsage() {
      return structuredClone(worker)
    },
  },
  platformUsageReadPort: {
    async rereadPlatformUsageAndStoppedCapacity() {
      return structuredClone(platform)
    },
  },
  rateAuthorityReadPort: {
    async reread(input) {
      rateReads += 1
      assert.deepEqual(input.rateAuthorityRef,
        authority.currentRateAuthorityRef)
      assert.equal(input.at, OBSERVED_AT)
      return structuredClone(rate)
    },
  },
  receiptStore: memoryReceiptStore(receipts, () => receiptCreates += 1),
  now: () => OBSERVED_AT,
})

const completedEvidence = await port.rereadUsageAccountPriceAndCost({
  execution,
  executionRef,
  cloudTerminalObservationRef,
  terminalOutcome: 'completed',
  providerTimes: PROVIDER_TIMES,
})
assert.equal(completedEvidence.exactVertexPlatformUsageReread, true)
assert.equal(completedEvidence.exactBillingAccountEffectivePriceReread, true)
assert.equal(completedEvidence.activeA100GpuInstancesAfterObservation, 0)
assert.equal(completedEvidence.customerWalletOrLedgerMutated, false)
assert.equal(rateReads, 1)
assert.equal(receiptCreates, 1)
assert.equal(receipts.size, 1)

const completedReceipt = assertCanonicalA100VertexProviderAllocationCostReceipt(
  receipts.values().next().value,
)
assert.equal(completedReceipt.actualUsage.actualWallClockMilliseconds, 240_000)
assert.equal(completedReceipt.actualUsage.allocatedGpuMilliseconds, 180_000)
assert.equal(completedReceipt.actualUsage.billableDurationMilliseconds, 180_000)
assert.equal(completedReceipt.actualUsage.coldStartMilliseconds, 60_000)
assert.equal(completedReceipt.actualUsage.allocatedVcpuCount, 12)
assert.equal(completedReceipt.actualUsage.allocatedMemoryGiB, 170)
assert.equal(completedReceipt.actualUsage.bootDiskSizeGb, 200)
assert.equal(
  completedReceipt.actualInfrastructureCost
    .vertexTrainingA10080GbUsdNanos,
  225_864_600,
)
assert.equal(
  completedReceipt.actualInfrastructureCost
    .vertexTrainingA2CoreUsdNanos,
  21_811_590,
)
assert.equal(
  completedReceipt.actualInfrastructureCost
    .vertexTrainingA2RamUsdNanos,
  41_416_675,
)
assert.equal(
  completedReceipt.actualInfrastructureCost
    .vertexTrainingPdSsdUsdNanos,
  2_715_278,
)
assert.equal(completedReceipt.actualInfrastructureCost
  .privateObjectStorageUsdNanos, 20_000_000)
assert.equal(completedReceipt.actualInfrastructureCost
  .networkEgressUsdNanos, 60_000_000)
assert.equal(completedReceipt.actualInfrastructureCost
  .objectClassAOperationsUsdNanos, 0)
assert.equal(completedReceipt.actualInfrastructureCost
  .objectClassBOperationsUsdNanos, 0)
assert.equal(completedReceipt.customerEligibleToolCostCredits, 4)
assert.equal(completedReceipt.serviceFeeIncluded, false)
assert.equal(completedReceipt.separateManagementFeeSkuSetCharged, false)
assert.equal(completedReceipt.computeEngineReservationOrSpotSkuSetCharged,
  false)
assert.equal(completedReceipt.mixedOrDoubleCountedPricingAccepted, false)
assert.equal(completedReceipt.billingAccountIdentifierIncluded, false)

const terminalReadPayload = {
  schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
  source: 'canonical_a100_vertex_custom_job_terminal_port' as const,
  executionRef,
  disposition: 'terminal' as const,
  providerState: 'JOB_STATE_SUCCEEDED' as const,
  terminalOutcome: 'completed' as const,
  cloudTerminalObservationRef,
  workerUsageEvidenceRef: completedEvidence.workerUsageEvidenceRef,
  currentAccountPriceAuthorityRef:
    completedEvidence.currentAccountPriceAuthorityRef,
  attemptCostReceiptRef: completedEvidence.attemptCostReceiptRef,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  createTime: CREATE_TIME,
  startTime: START_TIME,
  endTime: END_TIME,
  providerJobTerminalStateReread: true,
  workerStoppedVerified: true,
  activeA100GpuInstancesAfterObservation: 0 as const,
  zeroActiveA100ClaimScopedToThisOneShotAttempt: true as const,
  exactVertexPlatformUsageAndAccountEffectivePriceReread: true,
  costReceiptPersistedBeforeSettlement: true,
  checkbackAllowed: false,
  retryAllowedWithoutCanonicalReconciliation: false as const,
  minimumIdleInstances: 0 as const,
  persistentEndpointPresent: false as const,
  systemFailureOrUnknownCostChargedToCustomer: false as const,
  unapprovedOverageChargedToCustomer: false as const,
  customerWalletOrLedgerMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: OBSERVED_AT,
}
const terminalRead = canonicalA100VertexCustomJobTerminalReadSchema.parse({
  ...terminalReadPayload,
  terminalReadHash: sha256AuthorityValue(terminalReadPayload),
})

const settlementRoot = await mkdtemp(join(tmpdir(),
  'weeditpro-vertex-a100-settlement-'))
try {
  const ownerUserId = 'owner-user-1'
  const context = {
    env: {
      localStorageRoot: settlementRoot,
      nodeEnv: 'development',
      mode: 'local',
    } as ServiceContext['env'],
    clients: {} as ServiceContext['clients'],
    requestId: 'vertex-a100-settlement-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  } as ServiceContext
  await seedApprovedSettlementAuthority({
    root: settlementRoot,
    ownerUserId,
    fixtures: settlementFixtures,
  })
  const settlementInput = {
    context,
    executionRef,
    executionRepository: {
      async rereadExecution() { return structuredClone(execution) },
    },
    authorityReadPort: {
      async rereadLaunchAuthority() { return structuredClone(authority) },
    },
    terminalReadPort: {
      async reread() { return structuredClone(terminalRead) },
    },
    receiptReadPort: {
      async rereadAttemptCostReceipt() {
        return structuredClone(completedReceipt)
      },
    },
    settledAt: '2026-08-06T20:00:01.000Z',
  }
  const settled = await settleCanonicalA100VertexAttemptCredits(
    settlementInput,
  )
  assert.equal(settled.idempotentReplay, false)
  assert.equal(settled.settlement.customerChargedCredits, 4)
  assert.equal(settled.settlement.serviceFeeSettledHere, false)
  assert.equal(settled.externalCustomerWalletMutated, false)
  const replayed = await settleCanonicalA100VertexAttemptCredits(
    settlementInput,
  )
  assert.equal(replayed.idempotentReplay, true)
  assert.equal(replayed.settlement.settlementHash,
    settled.settlement.settlementHash)
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: settlementRoot,
    workspaceId: authority.workspaceId,
    ownerUserId,
  })
  assert.equal(aggregate?.wallet.spentCredits, 4)
  assert.equal(aggregate?.wallet.reservedCredits, 496)
  assert.equal(aggregate?.gpuAttemptCreditSettlements.length, 1)
} finally {
  await rm(settlementRoot, { recursive: true, force: true })
}

await port.rereadUsageAccountPriceAndCost({
  execution,
  executionRef,
  cloudTerminalObservationRef,
  terminalOutcome: 'completed',
  providerTimes: PROVIDER_TIMES,
})
assert.equal(receiptCreates, 2)
assert.equal(receipts.size, 1)

const failedReceipts = new Map<
  string,
  CanonicalA100VertexProviderAllocationCostReceipt
>()
const failedWorker = buildWorker('not_executed')
const failedWorkerRef = ref(
  `vertex-a100-worker-usage.${execution.executionRecordHash.slice(0, 32)}`,
  failedWorker.evidenceHash,
)
const failedEvidence = await createCanonicalA100VertexTerminalCostEvidenceReadPort({
  contextReadPort: fixedPort(context),
  workerUsageReadPort: fixedPort(failedWorker,
    'rereadPrivateWorkerUsage'),
  platformUsageReadPort: fixedPort(buildPlatform(failedWorkerRef),
    'rereadPlatformUsageAndStoppedCapacity'),
  rateAuthorityReadPort: { async reread() { return structuredClone(rate) } },
  receiptStore: memoryReceiptStore(failedReceipts),
  now: () => OBSERVED_AT,
}).rereadUsageAccountPriceAndCost({
  execution,
  executionRef,
  cloudTerminalObservationRef,
  terminalOutcome: 'failed',
  providerTimes: PROVIDER_TIMES,
})
assert.equal(failedEvidence.providerInferenceOrSubstantiveWorkOutcome,
  'not_executed')
const failedReceipt = assertCanonicalA100VertexProviderAllocationCostReceipt(
  failedReceipts.values().next().value,
)
assert.equal(failedReceipt.customerEligibleToolCostCredits, 0)
assert.equal(failedReceipt.customerEligibleInfrastructureCostUsdNanos, 0)
assert.equal(failedReceipt.weeditproAbsorbedInfrastructureCostUsdNanos,
  failedReceipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos)

const failedTerminalPayload = {
  ...terminalReadPayload,
  providerState: 'JOB_STATE_FAILED' as const,
  terminalOutcome: 'failed' as const,
  workerUsageEvidenceRef: failedEvidence.workerUsageEvidenceRef,
  currentAccountPriceAuthorityRef:
    failedEvidence.currentAccountPriceAuthorityRef,
  attemptCostReceiptRef: failedEvidence.attemptCostReceiptRef,
  providerInferenceOrSubstantiveWorkOutcome: 'not_executed' as const,
}
const failedTerminal = canonicalA100VertexCustomJobTerminalReadSchema.parse({
  ...failedTerminalPayload,
  terminalReadHash: sha256AuthorityValue(failedTerminalPayload),
})
const failureSettlementRoot = await mkdtemp(join(tmpdir(),
  'weeditpro-vertex-a100-failure-settlement-'))
try {
  const ownerUserId = 'owner-user-1'
  const failureContext = {
    env: {
      localStorageRoot: failureSettlementRoot,
      nodeEnv: 'development',
      mode: 'local',
    } as ServiceContext['env'],
    clients: {} as ServiceContext['clients'],
    requestId: 'vertex-a100-failure-settlement-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  } as ServiceContext
  await seedApprovedSettlementAuthority({
    root: failureSettlementRoot,
    ownerUserId,
    fixtures: settlementFixtures,
  })
  const failedSettlement = await settleCanonicalA100VertexAttemptCredits({
    context: failureContext,
    executionRef,
    executionRepository: {
      async rereadExecution() { return structuredClone(execution) },
    },
    authorityReadPort: {
      async rereadLaunchAuthority() { return structuredClone(authority) },
    },
    terminalReadPort: {
      async reread() { return structuredClone(failedTerminal) },
    },
    receiptReadPort: {
      async rereadAttemptCostReceipt() {
        return structuredClone(failedReceipt)
      },
    },
    settledAt: '2026-08-06T20:00:01.000Z',
  })
  assert.equal(failedSettlement.settlement.terminalOutcome,
    'reeditpro_failed')
  assert.equal(failedSettlement.settlement.customerChargedCredits, 0)
  assert.equal(failedSettlement.settlement.reservationSpendApplied, false)
  const failedAggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: failureSettlementRoot,
    workspaceId: authority.workspaceId,
    ownerUserId,
  })
  assert.equal(failedAggregate?.wallet.spentCredits, 0)
  assert.equal(failedAggregate?.wallet.reservedCredits, 500)
} finally {
  await rm(failureSettlementRoot, { recursive: true, force: true })
}

await assert.rejects(
  createCanonicalA100VertexTerminalCostEvidenceReadPort({
    contextReadPort: fixedPort(context),
    workerUsageReadPort: fixedPort(buildWorker('unknown'),
      'rereadPrivateWorkerUsage'),
    platformUsageReadPort: fixedPort(platform,
      'rereadPlatformUsageAndStoppedCapacity'),
    rateAuthorityReadPort: { async reread() { return rate } },
    receiptStore: memoryReceiptStore(new Map()),
    now: () => OBSERVED_AT,
  }).rereadUsageAccountPriceAndCost({
    execution,
    executionRef,
    cloudTerminalObservationRef,
    terminalOutcome: 'completed',
    providerTimes: PROVIDER_TIMES,
  }),
)

await assert.rejects(port.rereadUsageAccountPriceAndCost({
  execution,
  executionRef,
  cloudTerminalObservationRef: ref('crossed-terminal', sha('crossed')),
  terminalOutcome: 'completed',
  providerTimes: PROVIDER_TIMES,
}))
await assert.rejects(port.rereadUsageAccountPriceAndCost({
  execution,
  executionRef,
  cloudTerminalObservationRef,
  terminalOutcome: 'completed',
  providerTimes: { ...PROVIDER_TIMES, endTime: OBSERVED_AT },
}))

const tampered = structuredClone(completedReceipt)
tampered.actualInfrastructureCost.totalInfrastructureCostUsdNanos += 1
assert.throws(() =>
  assertCanonicalA100VertexProviderAllocationCostReceipt(tampered))

console.log(JSON.stringify({
  smoke: 'canonical-a100-vertex-terminal-cost-evidence',
  checks: {
    exactProviderAllocationMeteringSeparateFromWorkerPhases: true,
    thirtySecondBillingIncrementApplied: true,
    exactA100CoreRamAndPdSsdRatesApplied: true,
    privateStorageAndNetworkAppliedOperationsDeferredToInvoice: true,
    accountEffectiveUsageSkuSetOnly: true,
    managementAndReservationFeesNotDoubleCounted: true,
    completedCostConvertedToCreditsAtTenCents: true,
    approvedReservationSpentExactlyOnce: true,
    idempotentCreditSettlementExactReread: true,
    systemFailureCostAbsorbedByWeEditPro: true,
    receiptCreateOnlyAndExactReread: true,
    staleCrossedUnknownAndTamperedEvidenceRejected: true,
    workerStoppedAndActiveA100ZeroRequired: true,
    serviceFeeWalletQaPublicAndProductionRemainClosed: true,
  },
}, null, 2))

function buildRateAuthority() {
  const observedAt = '2026-08-06T18:00:00.000Z'
  const rates = {
    vertex_training_a100_80gb_hour: 4_517_292_000,
    vertex_training_a2_core_hour: 36_352_650,
    vertex_training_a2_ram_gib_hour: 4_872_550,
    vertex_training_pd_ssd_gib_month: 195_500_000,
    private_object_storage_gib_month: 20_000_000,
    network_egress_gib: 120_000_000,
    object_class_a_per_1000: 5_000_000,
    object_class_b_per_1000: 400_000,
  }
  const skuIds = [
    '8FFC-6CDE-24D7', '15A7-BDE1-23EB', 'E7EA-78F1-B4BA',
    'A005-98FE-36CC', 'E5F0-6A5D-7BAD', '22EB-AAE8-FBCD',
    '4DBF-185F-A415', '7870-010B-2763',
  ]
  const units = [
    ['h', 'gpu_hour', '1'], ['h', 'vcpu_hour', '1'],
    ['GiBy.h', 'gib_hour', '1'], ['GiBy.mo', 'gib_month', '1'],
    ['GiBy.mo', 'gib_month', '1'], ['GiBy', 'gib', '1'],
    ['count', 'per_1000_operations', '1000'],
    ['count', 'per_1000_operations', '1000'],
  ] as const
  const components = CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES.map(
    (componentClass, index) => {
      const rate = rates[componentClass]
      const skuId = skuIds[index]!
      const unit = units[index]!
      return {
        componentClass,
        cloudServiceName: index < 4 ? 'vertex-ai' : 'cloud-storage',
        skuRateBindingId: `binding-${index + 1}`,
        skuPriceTerm: {
          cloudServiceId: index < 4
            ? 'services/C7E2-9256-1C43'
            : 'services/95FF-2EF5-5EA1',
          skuId,
          consumptionModel: '7754-699E-0EBF',
          apiUnit: unit[0],
          apiUnitQuantity: unit[2],
          contractPriceTiers: [{
            startAmount: '0',
            contractPriceUsdNanos: rate,
          }],
          maximumContractPriceUsdNanos: rate,
          skuMetadataRef: ref(`metadata-${index + 1}`,
            sha(`metadata-${index + 1}`)),
          billingAccountPriceRef: ref(`account-price-${index + 1}`,
            sha(`account-price-${index + 1}`)),
        },
        skuDescriptionDigestSha256: sha(`description-${index + 1}`),
        skuRegion: 'us-central1' as const,
        billingUnit: unit[1],
        maximumUsdNanosPerBillingUnit: rate,
        currentPriceObservedAt: observedAt,
        skuRecordRef: ref(`sku-record-${index + 1}`,
          sha(`sku-record-${index + 1}`)),
      }
    },
  )
  const payload = {
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_VERSION,
    source:
      'server_owned_current_google_cloud_vertex_a100_billing_pricing_reread' as const,
    rateAuthorityId: 'vertex-a100-rate-test',
    rateAuthorityVersion: 1,
    routeId: 'a100_80gb_heavy_primary' as const,
    profileId: 'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
    routeRole: 'heavy_primary' as const,
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    acceleratorCount: 1 as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    bootDiskType: 'pd-ssd' as const,
    bootDiskSizeGb: 200 as const,
    replicaCount: 1 as const,
    pricingModel: 'vertex_ai_training_on_demand_payg' as const,
    pricingSetMode: 'vertex_training_payg_usage_skus' as const,
    separateVertexManagementFeeSkuSetIncluded: false as const,
    computeEngineReservationOrSpotSkuSetIncluded: false as const,
    mixedOrDoubleCountedPricingSetAccepted: false as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-pricing-scope',
      sha('billing-pricing-scope')),
    pricingReaderConfigurationRef: ref('pricing-reader',
      sha('pricing-reader')),
    components,
    priceRecordSetRef: ref('price-record-set', sha('price-record-set')),
    pricingReadStartedAt: '2026-08-06T17:59:59.000Z',
    pricingReadFinishedAt: observedAt,
    pricingReadDigestSha256: sha('pricing-read'),
    observedAt,
    expiresAt: '2026-08-07T18:00:00.000Z',
    maximumAuthorityAgeSeconds: 86_400 as const,
    vertexTrainingUsageBilledInThirtySecondIncrements: true as const,
    exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: true as const,
    actualAttemptCostRequiresTerminalUsageAndBillingReread: true as const,
    customerPricingOrServiceFeeAuthorityGranted: false as const,
    walletOrCreditMutationAuthorityGranted: false as const,
    providerOrGpuJobStarted: false as const,
    publicDeliveryAuthorityGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema.parse({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

function buildAuthority(fixtures: ReturnType<typeof buildSettlementFixtures>) {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
    source: 'canonical_professional_gpu_dispatch_owner' as const,
    authorityId: 'vertex-a100-authority-test',
    toolId: 'sam3_1' as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
    releaseRef: ref('vertex-a100-release', sha('release')),
    workspaceId: fixtures.snapshot.workspaceId,
    projectId: fixtures.snapshot.projectId,
    editSessionId: fixtures.snapshot.editSessionId,
    approvedSnapshotRef: ref(fixtures.snapshot.snapshotId,
      fixtures.snapshot.snapshotHash),
    confirmedOutputFrameRef: ref('frame', sha('frame')),
    masterTimingRef: ref('timing', sha('timing')),
    approvedWorkItemRef: ref(fixtures.approvedWork.id,
      sha256AuthorityValue(fixtures.approvedWork)),
    workerLeaseRef: ref('lease', sha('lease')),
    fundedReservationRef: ref(fixtures.reservation.id,
      sha256AuthorityValue(fixtures.reservation)),
    approvedEstimateRef: ref(fixtures.estimate.id,
      fixtures.estimate.estimateHash),
    userApprovalRecordRef: ref(fixtures.approval.id,
      sha256AuthorityValue(fixtures.approval)),
    userTriggerRecordRef: ref('trigger', sha('trigger')),
    executionAttemptRef: ref('attempt', sha('attempt')),
    executionEnvelopeRef: ref('envelope', sha('envelope')),
    currentRateAuthorityRef: ref(rate.rateAuthorityId,
      rate.rateAuthorityHash, rate.rateAuthorityVersion),
    maximumReservedToolCostCredits:
      fixtures.approvedWork.maximumCreditBudget,
    exactSnapshotWorkLeaseReservationTriggerReleaseAndRateReread:
      true as const,
    createOnlyDurableConsumptionRequiredBeforeProviderCall: true as const,
    oneAuthorityMayCreateAtMostOneCustomJob: true as const,
    retryAfterUnknownCreateOutcomeAllowed: false as const,
    userTriggeredScaleFromZero: true as const,
    noApprovedAuthorityMeansZeroGpuJobs: true as const,
    callerImageCommandArgsEnvironmentOrModelAccepted: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-06T19:50:00.000Z',
    expiresAt: '2026-08-06T21:00:00.000Z',
  }
  return canonicalA100VertexCustomJobLaunchAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function buildExecution() {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
    source: 'canonical_a100_vertex_custom_job_launch_port' as const,
    executionRecordId: 'vertex-a100-execution-test',
    authorityRef: ref(authority.authorityId, authority.authorityHash),
    releaseRef: authority.releaseRef,
    consumptionRef: ref('consumption', sha('consumption')),
    customJobCreateRequestRef: ref('create-request', sha('create-request')),
    customJobResourceName:
      'projects/reeditpro/locations/us-central1/customJobs/12345',
    displayName: 'weeditpro-sam31-a100-test',
    initialState: 'JOB_STATE_QUEUED' as const,
    providerResponseDigestSha256: sha('provider-response'),
    createResponsePersistedAndExactReread: true as const,
    terminalStateClaimed: false as const,
    customerCreditsMutated: false as const,
    persistedAt: CREATE_TIME,
  }
  return canonicalA100VertexCustomJobExecutionRecordSchema.parse({
    ...payload,
    executionRecordHash: sha256AuthorityValue(payload),
  })
}

function buildContext() {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_TERMINAL_COST_CONTEXT_VERSION,
    source:
      'canonical_server_a100_vertex_terminal_cost_context_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    executionRef,
    authority,
    releaseRef: authority.releaseRef,
    exactApprovalSnapshotFrameTimingWorkLeaseReservationEstimateTriggerEnvelopeReleaseAndRateReread:
      true as const,
    callerUsageOutcomePriceCostOrReceiptIdAccepted: false as const,
    customerWalletOrLedgerMutationAuthorityGranted: false as const,
    preparedAt: CREATE_TIME,
  }
  return assertCanonicalA100VertexTerminalCostContext(
    canonicalA100VertexTerminalCostContextSchema.parse({
    ...payload,
    contextHash: sha256AuthorityValue(payload),
    }),
  )
}

function buildWorker(outcome: 'executed' | 'not_executed' | 'unknown') {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION,
    source: 'canonical_a100_vertex_private_worker_usage_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    executionRef,
    authorityRef: ref(authority.authorityId, authority.authorityHash),
    cloudTerminalObservationRef,
    providerTimes: PROVIDER_TIMES,
    providerInferenceOrSubstantiveWorkOutcome: outcome,
    runtimeResponseStatus: outcome === 'executed'
      ? 'completed' as const
      : outcome === 'not_executed'
        ? 'not_created_before_worker_start' as const
        : 'failed' as const,
    runtimeTerminalStage: outcome === 'executed'
      ? 'completed' as const
      : outcome === 'not_executed'
        ? 'not_started' as const
        : 'propagation' as const,
    workerWallTimeMilliseconds: 170_000,
    modelLoadMilliseconds: 60_000,
    promptMilliseconds: 10_000,
    propagationMilliseconds: 80_000,
    outputPersistenceMilliseconds: 20_000,
    cudaEventInferenceMilliseconds: 89_000,
    peakCudaAllocatedBytes: 12_000_000_000,
    peakCudaReservedBytes: 16_000_000_000,
    outputFileCount: outcome === 'executed' ? 2 : 0,
    privateArtifactBytes: 1024 ** 3,
    privateArtifactRetentionMilliseconds: 30 * 24 * 60 * 60 * 1_000,
    networkEgressBytes: 512 * 1024 ** 2,
    classAOperationCount: 10,
    classBOperationCount: 20,
    exactImmutableTaskWorkerMetricsReread: true as const,
    workerWallTimeDoesNotDefineProviderAllocationOrBilling: true as const,
    providerAllocationIncludesUnobservableWorkerStartupAndDrain: true as const,
    workerSuppliedProviderTimesBillableDurationPriceOrCostAccepted:
      false as const,
    runtimeNetworkDownloadObserved: false as const,
    cpuOnlySubstantiveExecutionObserved: false as const,
    rawMediaPathsUrlsSecretsOrCredentialsIncluded: false as const,
    observedAt: OBSERVED_AT,
  }
  return canonicalA100VertexWorkerUsageEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function buildPlatform(workerRef: ReturnType<typeof ref>) {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION,
    source: 'canonical_server_vertex_platform_usage_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    executionRef,
    authorityRef: ref(authority.authorityId, authority.authorityHash),
    cloudTerminalObservationRef,
    providerTimes: PROVIDER_TIMES,
    workerUsageEvidenceRef: workerRef,
    platformUsageRereadRef: ref('platform-usage', sha('platform-usage')),
    providerJobTerminalStateReread: true as const,
    providerCapacityAndQuotaReread: true as const,
    workerStoppedVerified: true as const,
    activeA100GpuInstancesAfterObservation: 0 as const,
    persistentEndpointPresent: false as const,
    minimumIdleInstances: 0 as const,
    exactOneShotA2UltraAllocationReread: true as const,
    zeroActiveWorkerClaimScopedToThisOneShotCustomJob: true as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    bootDiskType: 'pd-ssd' as const,
    bootDiskSizeGb: 200 as const,
    callerCapacityStopUsageOrPriceClaimAccepted: false as const,
    observedAt: OBSERVED_AT,
  }
  return canonicalA100VertexPlatformUsageEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function memoryReceiptStore(
  records: Map<string, CanonicalA100VertexProviderAllocationCostReceipt>,
  onCreate: () => void = () => undefined,
) {
  return {
    async createAttemptCostReceiptOnly(input: {
      receipt: CanonicalA100VertexProviderAllocationCostReceipt
    }) {
      onCreate()
      const previous = records.get(input.receipt.receiptId)
      if (previous) {
        assert.deepEqual(previous, input.receipt)
        return 'already_exists' as const
      }
      records.set(input.receipt.receiptId,
        structuredClone(input.receipt))
      return 'created' as const
    },
    async rereadAttemptCostReceipt(input: { receiptId: string }) {
      return structuredClone(records.get(input.receiptId))
    },
  }
}

function buildSettlementFixtures() {
  const createdAt = '2026-08-06T19:40:00.000Z'
  const blobRef = (value: string) => ({
    sha256: sha(value),
    byteLength: 1,
  })
  const plan = {
    id: 'plan-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningRequestId: 'planning-request-1',
    planVersion: 1,
    status: 'approved' as const,
    componentRefs: {},
    estimateId: 'estimate-1',
    workItemIds: ['plan-work-1'],
    planHash: sha('plan'),
    workGraphHash: sha('work-graph'),
    sourceSequenceHash: sha('source-sequence'),
    timingHash: sha('timing'),
    createdAt,
    approvedAt: createdAt,
  }
  const estimate = {
    id: 'estimate-1',
    planId: plan.id,
    estimateVersion: 1,
    status: 'approved' as const,
    lineItems: [{
      lineKey: 'sam31-a100',
      label: 'SAM 3.1 A100 processing',
      category: 'gpu_tool',
      estimatedCredits: 500,
      removable: false,
      metadataRef: blobRef('estimate-metadata'),
    }],
    estimatedCredits: 500,
    fallbackAllowanceCredits: 0,
    approvedMaximumCredits: 500,
    estimateHash: sha('estimate'),
    validUntil: '2026-08-07T19:40:00.000Z',
    createdAt,
    approvedAt: createdAt,
  }
  const approval = {
    id: 'approval-1',
    planId: plan.id,
    estimateId: estimate.id,
    snapshotId: 'snapshot-1',
    reservationId: 'reservation-1',
    approvedByUserId: 'owner-user-1',
    approvedAt: createdAt,
    requestHash: sha('approval-request'),
    idempotencyKey: 'approval-idempotency-1',
  }
  const snapshot = {
    schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
    snapshotId: approval.snapshotId,
    workspaceId: 'workspace-1',
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    planId: plan.id,
    planVersion: plan.planVersion,
    estimateId: estimate.id,
    approvalId: approval.id,
    reservationId: approval.reservationId,
    approvedByUserId: approval.approvedByUserId,
    approvedAt: createdAt,
    componentRefs: {},
    approvedWorkItemIds: ['approved-work-1'],
    planHash: plan.planHash,
    estimateHash: estimate.estimateHash,
    workGraphHash: plan.workGraphHash,
    sourceSequenceHash: plan.sourceSequenceHash,
    timingHash: plan.timingHash,
    approvedAssetManifestRef: blobRef('asset-manifest'),
    approvedAssetManifestHash: sha('asset-manifest-hash'),
    approvedSourceAssetManifestRef: blobRef('source-asset-manifest'),
    approvedSourceAssetManifestHash: sha('source-asset-manifest-hash'),
    snapshotHash: sha('snapshot'),
  }
  const approvedWork = {
    id: snapshot.approvedWorkItemIds[0]!,
    snapshotId: snapshot.snapshotId,
    sourceWorkItemId: 'plan-work-1',
    workItemKey: 'sam31-track-all-work',
    workItemType: 'segment_and_track_subject',
    workerClass: 'gpu_model',
    executionInputRef: blobRef('execution-input'),
    sourceSequenceItemIds: ['source-1'],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'sam31-mask-track',
      artifactType: 'mask_track',
      assetRole: 'processed' as const,
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: ['segment-1'],
      timingIds: ['timing-1'],
      rendererLayerIds: ['layer-1'],
    }],
    dependencyKeys: [],
    approvedToolIds: ['sam3_1'],
    providerExecutionMode: 'none' as const,
    fallbackPolicyRef: blobRef('fallback-policy'),
    maxAttempts: 1,
    attemptTimeoutSeconds: 3600,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 500,
    required: true,
    executionInputHash: sha('execution-input-hash'),
    createdAt,
  }
  const reservation = {
    id: approval.reservationId,
    approvalId: approval.id,
    snapshotId: snapshot.snapshotId,
    estimateId: estimate.id,
    planId: plan.id,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    status: 'reserved' as const,
    reservedCredits: 500,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservedAt: createdAt,
    expiresAt: '2026-08-07T19:40:00.000Z',
    updatedAt: createdAt,
  }
  return { plan, estimate, approval, snapshot, approvedWork, reservation }
}

async function seedApprovedSettlementAuthority(input: {
  root: string
  ownerUserId: string
  fixtures: ReturnType<typeof buildSettlementFixtures>
}) {
  const { plan, estimate, approval, snapshot, approvedWork, reservation } =
    input.fixtures
  await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: input.root,
      workspaceId: snapshot.workspaceId,
      ownerUserId: input.ownerUserId,
    },
    now: plan.createdAt,
    mutation: (aggregate) => {
      aggregate.wallet.availableCredits -= reservation.reservedCredits
      aggregate.wallet.reservedCredits += reservation.reservedCredits
      aggregate.wallet.ledgerSequence += 1
      aggregate.plans.push(structuredClone(plan))
      aggregate.estimates.push(structuredClone(estimate))
      aggregate.approvals.push(structuredClone(approval))
      aggregate.snapshots.push(structuredClone(snapshot))
      aggregate.approvedWorkItems.push(structuredClone(approvedWork))
      aggregate.reservations.push(structuredClone(reservation))
      aggregate.ledgerEntries.push({
        id: 'ledger-reserve-1',
        sequence: aggregate.wallet.ledgerSequence,
        entryType: 'reserve',
        sourceType: 'canonical_plan_approval',
        sourceId: reservation.id,
        availableDelta: -reservation.reservedCredits,
        reservedDelta: reservation.reservedCredits,
        spentDelta: 0,
        balanceAfter: walletBalanceAfter(aggregate.wallet),
        idempotencyKey: approval.idempotencyKey,
        createdAt: plan.createdAt,
      })
      aggregate.reservationEvents.push({
        id: 'reservation-event-1',
        reservationId: reservation.id,
        snapshotId: snapshot.snapshotId,
        approvalId: approval.id,
        eventType: 'reserved',
        credits: reservation.reservedCredits,
        idempotencyKey: approval.idempotencyKey,
        createdAt: plan.createdAt,
      })
      return { result: undefined, changed: true }
    },
  })
}

function fixedPort(value: unknown, method = 'rereadPrivateTerminalCostContext') {
  return { [method]: async () => structuredClone(value) } as never
}

function ref(id: string, hash: string, version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}

function sha(value: string) {
  return sha256AuthorityValue({ value })
}
