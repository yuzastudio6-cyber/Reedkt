import assert from 'node:assert/strict'

import {
  createCanonicalProfessionalGpuPreapprovalPricing,
  createCanonicalProfessionalGpuUsageQuote,
} from '../services/canonical-professional-gpu-preapproval-pricing-service'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalVertexA100RateFixture,
} from './fixtures/canonical-vertex-a100-rate-fixture'

const observedAt = '2026-08-02T16:00:00.000Z'
const createdAt = '2026-08-02T16:10:00.000Z'
const expiresAt = '2026-08-03T16:00:00.000Z'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string, version = 1) => ({
  id,
  version,
  contentHash: `sha256:${hash(character)}`,
})

const rates = {
  a100_80gb_heavy_primary:
    await observeCanonicalVertexA100RateFixture({ observedAt }),
  l4_heavy_fallback: await observeRate('l4_heavy_fallback'),
  l4_standard_primary: await observeRate('l4_standard_primary'),
}

const samScope = scope('sam3_1')
const samWorkload = workload(480_000, 14_400, 2160 * 3840)
const samQuote = createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'sam3-1-eight-minute-source-quote-v1',
  quoteVersion: 1,
  scope: samScope,
  workload: samWorkload,
  primary: measuredRoute({
    routeId: 'a100_80gb_heavy_primary',
    toolReleaseRef: samScope.exactToolOrModelReleaseRef,
    runtimeCharacter: 'd',
    benchmarkCharacter: 'e',
    activeGpuMilliseconds: [90_000, 150_000, 260_000],
  }),
  fallback: measuredRoute({
    routeId: 'l4_heavy_fallback',
    toolReleaseRef: samScope.exactToolOrModelReleaseRef,
    runtimeCharacter: 'f',
    benchmarkCharacter: '1',
    activeGpuMilliseconds: [180_000, 300_000, 450_000],
  }),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  observedAt,
  expiresAt,
})

let usageQuoteReadCount = 0
let rateReadCount = 0
const samPricing = await createCanonicalProfessionalGpuPreapprovalPricing({
  estimateId: 'sam3-1-eight-minute-estimate-v1',
  scope: samScope,
  workload: samWorkload,
  region: 'us-central1',
  usageQuoteReadPort: {
    async rereadCurrentQualifiedUsageQuote() {
      usageQuoteReadCount += 1
      return structuredClone(samQuote)
    },
  },
  currentRateAuthorityReadPort: {
    async rereadCurrentAccountEffectiveRateAuthority(input) {
      rateReadCount += 1
      return structuredClone(rates[input.routeId])
    },
  },
  createdAt,
})

assert.equal(usageQuoteReadCount, 1)
assert.equal(rateReadCount, 2)
assert.equal(samPricing.estimate.scope.toolId, 'sam3_1')
assert.equal(samPricing.estimate.primary.routeId,
  'a100_80gb_heavy_primary')
assert.equal(samPricing.estimate.fallback?.routeId, 'l4_heavy_fallback')
assert.equal(samPricing.estimate.maximumReservedToolCostCredits > 0, true)
assert.equal(samPricing.estimate.serviceFeeIncluded, false)
assert.equal(samPricing.estimate.runtimeAdmissionGranted, false)
assert.equal(samPricing.callerUsageDurationRateOrPriceAccepted, false)
assert.equal(samPricing.customerCreditsMutated, false)

const ffmpegScope = scope('ffmpeg')
const ffmpegWorkload = workload(480_000, 14_400, 1920 * 1080)
const ffmpegQuote = createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'ffmpeg-eight-minute-source-quote-v1',
  quoteVersion: 1,
  scope: ffmpegScope,
  workload: ffmpegWorkload,
  primary: measuredRoute({
    routeId: 'l4_standard_primary',
    toolReleaseRef: ffmpegScope.exactToolOrModelReleaseRef,
    runtimeCharacter: '2',
    benchmarkCharacter: '3',
    activeGpuMilliseconds: [40_000, 70_000, 110_000],
  }),
  observedAt,
  expiresAt,
})
const ffmpegPricing = await priceWithFixtures({
  estimateId: 'ffmpeg-eight-minute-estimate-v1',
  scope: ffmpegScope,
  workload: ffmpegWorkload,
  quote: ffmpegQuote,
})
assert.equal(ffmpegPricing.estimate.primary.routeId, 'l4_standard_primary')
assert.equal(ffmpegPricing.estimate.fallback, null)
assert.equal(ffmpegPricing.fallbackRateAuthority, null)
assert.equal(ffmpegPricing.usageQuote.primary.benchmarkRunCount, 30)

await rejects('workload mismatch', () => priceWithFixtures({
  estimateId: 'mismatched-workload-estimate',
  scope: samScope,
  workload: { ...samWorkload, sourceFrameCount: 14_399 },
  quote: samQuote,
}))
await rejects('stale quote', () => createCanonicalProfessionalGpuPreapprovalPricing({
  estimateId: 'stale-quote-estimate',
  scope: samScope,
  workload: samWorkload,
  region: 'us-central1',
  usageQuoteReadPort: {
    async rereadCurrentQualifiedUsageQuote() {
      return samQuote
    },
  },
  currentRateAuthorityReadPort: {
    async rereadCurrentAccountEffectiveRateAuthority(input) {
      return rates[input.routeId]
    },
  },
  createdAt: expiresAt,
}))

const sameHeavyRuntime = measuredRoute({
  routeId: 'l4_heavy_fallback',
  toolReleaseRef: samScope.exactToolOrModelReleaseRef,
  runtimeCharacter: 'd',
  benchmarkCharacter: '4',
  activeGpuMilliseconds: [180_000, 300_000, 450_000],
})
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'same-heavy-runtime-refused',
  quoteVersion: 1,
  scope: samScope,
  workload: samWorkload,
  primary: samQuote.primary,
  fallback: sameHeavyRuntime,
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'missing-heavy-fallback-refused',
  quoteVersion: 1,
  scope: samScope,
  workload: samWorkload,
  primary: samQuote.primary,
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'standard-with-fallback-refused',
  quoteVersion: 1,
  scope: ffmpegScope,
  workload: ffmpegWorkload,
  primary: ffmpegQuote.primary,
  fallback: samQuote.fallback!,
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'insufficient-benchmark-count-refused',
  quoteVersion: 1,
  scope: ffmpegScope,
  workload: ffmpegWorkload,
  primary: { ...ffmpegQuote.primary, benchmarkRunCount: 29 },
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'cross-release-refused',
  quoteVersion: 1,
  scope: ffmpegScope,
  workload: ffmpegWorkload,
  primary: {
    ...ffmpegQuote.primary,
    toolOrModelArtifactReleaseRef: ref('different-tool-release', '4'),
  },
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'historical-sam2-refused',
  quoteVersion: 1,
  scope: scope('sam2'),
  workload: samWorkload,
  primary: samQuote.primary,
  observedAt,
  expiresAt,
}))
assert.throws(() => createCanonicalProfessionalGpuUsageQuote({
  quoteId: 'unimplemented-successor-refused',
  quoteVersion: 1,
  scope: scope('libass'),
  workload: ffmpegWorkload,
  primary: ffmpegQuote.primary,
  observedAt,
  expiresAt,
}))

await rejects('wrong current route rate', () =>
  createCanonicalProfessionalGpuPreapprovalPricing({
    estimateId: 'wrong-current-rate-route',
    scope: ffmpegScope,
    workload: ffmpegWorkload,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedUsageQuote() {
        return ffmpegQuote
      },
    },
    currentRateAuthorityReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority() {
        return rates.a100_80gb_heavy_primary
      },
    },
    createdAt,
  }))

let accessorInvoked = false
await rejects('accessor-bearing quote', () =>
  createCanonicalProfessionalGpuPreapprovalPricing({
    estimateId: 'accessor-quote-refused',
    scope: ffmpegScope,
    workload: ffmpegWorkload,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedUsageQuote() {
        return Object.defineProperty({}, 'quoteHash', {
          enumerable: true,
          get() {
            accessorInvoked = true
            return hash('a')
          },
        })
      },
    },
    currentRateAuthorityReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        return rates[input.routeId]
      },
    },
    createdAt,
  }))
assert.equal(accessorInvoked, false)

let successorPortCalled = false
await rejects('GPU successor cannot reuse another tool usage quote', () =>
  createCanonicalProfessionalGpuPreapprovalPricing({
    estimateId: 'libass-successor-pending',
    scope: scope('libass'),
    workload: ffmpegWorkload,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedUsageQuote() {
        successorPortCalled = true
        return ffmpegQuote
      },
    },
    currentRateAuthorityReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        return rates[input.routeId]
      },
    },
    createdAt,
  }))
assert.equal(successorPortCalled, true)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-preapproval-pricing-service',
  checks: 34,
  sourceFixtureOnly: true,
  liveCloudRateRead: false,
  liveGpuRuntimeExecuted: false,
  samPrimaryRoute: samPricing.estimate.primary.routeId,
  samFallbackRoute: samPricing.estimate.fallback?.routeId,
  ffmpegPrimaryRoute: ffmpegPricing.estimate.primary.routeId,
  minimumMeasuredRunCount:
    samPricing.usageQuote.primary.benchmarkRunCount,
  currentBillingAccountRateRereadRequired:
    samPricing.estimate.currentSkuRegionCurrencyTierAndAccountPriceReread,
  userApprovalRequired: samPricing.estimate.userApprovalRequired,
  fundedReservationRequired:
    samPricing.estimate.fundedReservationRequiredBeforeGpuJobCreation,
  userTriggeredScaleFromZeroRequired:
    samPricing.estimate.userTriggeredScaleFromZeroRequired,
  terminalScaleToZeroRequired:
    samPricing.estimate.terminalAttemptScaleBackToZeroRequired,
  serviceFeeIncludedInToolEstimate:
    samPricing.estimate.serviceFeeIncluded,
  customerCreditsMutated: samPricing.customerCreditsMutated,
  gpuSuccessorRequiresOwnUsageQuote: successorPortCalled,
  estimateHashes: [
    samPricing.estimate.estimateHash,
    ffmpegPricing.estimate.estimateHash,
  ],
}))

async function priceWithFixtures(input: {
  estimateId: string
  scope: ReturnType<typeof scope>
  workload: ReturnType<typeof workload>
  quote: unknown
}) {
  return createCanonicalProfessionalGpuPreapprovalPricing({
    estimateId: input.estimateId,
    scope: input.scope,
    workload: input.workload,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedUsageQuote() {
        return structuredClone(input.quote)
      },
    },
    currentRateAuthorityReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(rateInput) {
        return structuredClone(rates[rateInput.routeId])
      },
    },
    createdAt,
  })
}

function scope(toolId: 'sam3_1' | 'ffmpeg' | 'sam2' | 'libass') {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    editPlanHash: hash('a'),
    outputId: 'output-1',
    operationId: `operation-${toolId}`,
    plannedWorkItemRef: ref(`work-${toolId}`, 'b'),
    toolId,
    exactToolOrModelReleaseRef: ref(`tool-release-${toolId}`, 'c'),
  }
}

function workload(
  sourceDurationMilliseconds: number,
  sourceFrameCount: number,
  framePixelCount: number,
) {
  return {
    workloadClass: 'source_video' as const,
    inputByteLength: 384 * 1024 * 1024,
    sourceDurationMilliseconds,
    sourceFrameCount,
    sourcePixelCount: sourceFrameCount * framePixelCount,
    outputFrameCount: sourceFrameCount,
    outputPixelCount: sourceFrameCount * framePixelCount,
    subjectAssetOrTrackCount: 1,
  }
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

async function observeRate(
  routeId:
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
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
      'gpu_second', 186_700, 'b'),
    rateComponent('cloud_run_vcpu_second',
      'vcpu_second', 18_000, 'c'),
    rateComponent('cloud_run_memory_gib_second',
      'gib_second', 2_000, 'd'),
    ...commonRateComponents(),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef:
      ref('billing-account-pricing-scope', '8'),
    pricingReaderConfigurationRef:
      ref('gpu-rate-reader-configuration', '7'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, '9'),
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
      'gib_month', 20_000_000, 'e'),
    rateComponent('network_egress_gib',
      'gib', 120_000_000, 'f'),
    rateComponent('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    rateComponent('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function rateComponent(
  componentClass:
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  usdNanosPerBillingUnit: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('cloud_run')
      ? 'cloud-run'
      : componentClass.startsWith('a2_')
        ? 'compute-engine'
        : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: usdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}

async function rejects(label: string, action: () => Promise<unknown>) {
  await assert.rejects(action, () => true, label)
}
