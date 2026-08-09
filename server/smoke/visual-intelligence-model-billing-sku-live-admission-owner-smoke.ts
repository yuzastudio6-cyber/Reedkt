import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type {
  VisualIntelligenceCostPreflight,
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository,
  createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort,
  createVisualIntelligenceModelBillingSkuLiveAdmissionOwner,
  parseVisualIntelligenceModelBillingSkuAdmissionPublicationResult,
  parseVisualIntelligenceModelBillingSkuInternalSpendApproval,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-admission-owner'
import {
  parseVisualIntelligenceModelBillingSkuLiveAdmission,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  type VisualIntelligenceModelBillingSkuLiveAdmission,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-executor'
import type {
  VisualIntelligenceModelBillingSkuLiveGcsStore,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-gcs-store'
import {
  parseVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
  type VisualIntelligenceCanonicalProviderRouteRegistry,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'
import {
  createControlledVisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'

const root = process.cwd()
const nowIso = '2026-08-08T14:00:00.000Z'
const rateRef = ref('vi-live-admission-rate')
const release = runtimeRelease()
const objectPort = memoryObjectPort()
const approvalRepository =
  createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository({
    objectPort,
  })
const liveStore = memoryLiveStore()
let preflightCalls = 0
let lastPreflightInput: Record<string, unknown> | null = null
const costPreflightOwner = {
  rateAuthorityRef: rateRef,
  async createPreflight(input: Record<string, unknown>) {
    preflightCalls += 1
    lastPreflightInput = input
    return preflight({
      pricingSnapshotRef: ref('vi-live-admission-cost-preflight'),
      rateAuthorityRef: rateRef,
      maximumAuthorizedCostMicros: 12_000_000,
    })
  },
}
const owner = createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
  costPreflightOwner,
  approvalRepository,
  liveStore,
  now: () => new Date(nowIso),
})
const input = {
  authorizationId: 'vi-live-authorization-a',
  authorizationVersion: 1,
  qualificationId: 'vi-model-sku-qualification-a',
  qualificationVersion: 1,
  issuedAtIso: '2026-08-08T13:59:00.000Z',
  expiresAtIso: '2026-08-08T14:30:00.000Z',
  maximumInternalProviderSpendUsdMicros: 15_000_000,
  providerPrincipalEmail:
    'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com' as const,
  currentProcessExplicitConfirmationObserved: true as const,
  runtimeRelease: release,
}

const result = await owner.publish(input)
assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuAdmissionPublicationResult(result),
  result,
)
assert.equal(result.providerCallMade, false)
assert.equal(result.providerDispatchGranted, false)
assert.equal(result.customerCreditOrWalletMutationAuthorityGranted, false)
assert.equal(result.captionEvidenceAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)
assert.equal(result.exactAdmittedRuntimeReleaseReread, true)
assert.equal(
  result.currentAccountEffectiveRateRereadAndCostPreflightCreated,
  true,
)
assert.equal(preflightCalls, 1)
assert.deepEqual(lastPreflightInput, {
  requestId: 'vi-live-authorization-a.model-sku-cost-preflight',
  maximumInputTokenCount: 2_097_152,
  maximumOutputAndThinkingTokenCount: 64,
  estimatedInputTokenCount: 2_097_152,
  estimatedOutputAndThinkingTokenCount: 64,
})

const approval = await approvalRepository.readExact(
  result.internalSpendApprovalRef,
)
assert.ok(approval)
assert.equal(approval.operatorApprovedMaximumSpendUsdMicros, 15_000_000)
assert.equal(approval.rateDerivedMaximumCostUsdMicros, 12_000_000)
assert.equal(approval.qualificationId, input.qualificationId)
assert.equal(approval.qualificationVersion, input.qualificationVersion)
assert.equal(approval.currentProcessExplicitConfirmationObserved, true)
assert.equal(
  approval.canonicalServicePrincipalEmail,
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
)
assert.equal(approval.canonicalServiceIdentityVerified, true)
assert.equal(approval.customerCreditOrWalletMutationAuthorityGranted, false)
assert.equal(approval.productionReleaseAuthorityGranted, false)

const admission = await liveStore.admissionReadPort.readExact(
  result.admissionRef,
)
assert.ok(admission)
assert.equal(admission.maximumProviderRequestCount, 4)
assert.equal(admission.maximumTotalPromptTokens, 2_097_152)
assert.equal(admission.maximumTotalOutputAndThinkingTokens, 64)
assert.equal(admission.maximumInternalProviderSpendUsdMicros, 15_000_000)
assert.equal(admission.operatorApprovedPaidProviderExecution, true)
assert.equal(admission.singleUseAdmission, true)
assert.equal(admission.automaticProviderRetryAllowed, false)
assert.equal(admission.captionEvidenceAuthorityGranted, false)
const admissionAuthorityVerificationPort =
  createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort({
    approvalRepository,
    now: () => new Date(nowIso),
  })
assert.equal(
  await admissionAuthorityVerificationPort.verifyAndRereadExact(admission),
  true,
)
assert.equal(
  await createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort({
    approvalRepository,
    now: () => new Date('2026-08-08T14:31:00.000Z'),
  }).verifyAndRereadExact(admission),
  false,
)

const registry = await liveStore.routeRegistryReadPort.readExact(
  result.providerRouteRegistryRef,
)
assert.ok(registry)
assert.deepEqual(registry.routes.map((route) => route.routeClass), [
  'ordinary_visual_intelligence_request',
  'model_billing_sku_qualification',
])
assert.equal(registry.allCanonicalProviderRoutesUseOneSharedGuard, true)
assert.equal(registry.providerDispatchAuthorityGranted, false)

const replay = await owner.publish(input)
assert.deepEqual(replay, result)
assert.equal(preflightCalls, 2)
assert.equal(liveStore.metrics.routeRegistryCreates, 2)
assert.equal(liveStore.metrics.admissionCreates, 2)

await assert.rejects(
  () => owner.publish({
    ...input,
    issuedAtIso: '2026-08-08T13:40:00.000Z',
  }),
  /authorization is stale/u,
)
await assert.rejects(
  () => owner.publish({
    ...input,
    expiresAtIso: '2026-08-08T15:30:00.000Z',
  }),
  /authorization is stale/u,
)
await assert.rejects(
  () => owner.publish({
    ...input,
    maximumInternalProviderSpendUsdMicros: 10_000_000,
  }),
  /cost preflight is invalid/u,
)
await assert.rejects(
  () => owner.publish({
    ...input,
    providerPrincipalEmail: 'other@reeditpro.iam.gserviceaccount.com',
  } as never),
)
await assert.rejects(
  () => owner.publish({
    ...input,
    currentProcessExplicitConfirmationObserved: false,
  } as never),
)
await assert.rejects(
  () => owner.publish({
    ...input,
    runtimeRelease: { ...release },
  }),
  /not ready|not_exact_reread/u,
)

const crossedRateOwner = createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
  costPreflightOwner: {
    rateAuthorityRef: rateRef,
    async createPreflight() {
      return preflight({
        pricingSnapshotRef: ref('crossed-rate-preflight'),
        rateAuthorityRef: ref('crossed-rate'),
        maximumAuthorizedCostMicros: 1_000_000,
      })
    },
  },
  approvalRepository,
  liveStore,
  now: () => new Date(nowIso),
})
await assert.rejects(
  () => crossedRateOwner.publish({ ...input, authorizationId: 'crossed-rate' }),
  /cost preflight is invalid/u,
)

const publicPriceOwner = createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
  costPreflightOwner: {
    rateAuthorityRef: rateRef,
    async createPreflight() {
      return {
        ...preflight({
          pricingSnapshotRef: ref('public-price-preflight'),
          rateAuthorityRef: rateRef,
          maximumAuthorizedCostMicros: 1_000_000,
        }),
        publicListPriceUsedAsSettlementAuthority: true,
      } as unknown as VisualIntelligenceCostPreflight
    },
  },
  approvalRepository,
  liveStore,
  now: () => new Date(nowIso),
})
await assert.rejects(
  () => publicPriceOwner.publish({ ...input, authorizationId: 'public-price' }),
  /cost preflight is invalid/u,
)

const missingRegistryStore = memoryLiveStore({ omitRegistryReread: true })
await assert.rejects(
  () => createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
    costPreflightOwner,
    approvalRepository,
    liveStore: missingRegistryStore,
    now: () => new Date(nowIso),
  }).publish({ ...input, authorizationId: 'missing-registry' }),
  /route registry publication failed/u,
)

const missingAdmissionStore = memoryLiveStore({ omitAdmissionReread: true })
await assert.rejects(
  () => createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
    costPreflightOwner,
    approvalRepository,
    liveStore: missingAdmissionStore,
    now: () => new Date(nowIso),
  }).publish({ ...input, authorizationId: 'missing-admission' }),
  /admission publication failed/u,
)

assert.throws(
  () => parseVisualIntelligenceModelBillingSkuAdmissionPublicationResult({
    ...result,
    providerCallMade: true,
  }),
)
assert.throws(
  () => parseVisualIntelligenceModelBillingSkuInternalSpendApproval({
    ...approval,
    operatorApprovedMaximumSpendUsdMicros: 50_000_000,
  }),
  /digest is invalid/u,
)

const cliPath =
  'server/cli/publish-visual-intelligence-model-billing-sku-live-admission.ts'
const cli = readFileSync(join(root, cliPath), 'utf8')
for (const phrase of [
  'I_APPROVE_ONE_EXPIRING_INTERNAL_GEMINI_QUALIFICATION_ADMISSION_NO_PROVIDER_CALL',
  "process.argv[2] !== '--execute'",
  'getCredentials()',
  'providerCredentials.client_email !== EXACT_PROVIDER_PRINCIPAL',
  'readVisualIntelligenceRuntimeRelease',
  'createVisualIntelligenceGcsAccountEffectiveRateReadPort',
  'createVisualIntelligenceAccountEffectiveCostOwner',
  'createVisualIntelligenceModelBillingSkuLiveAdmissionOwner',
] as const) assert.equal(cli.includes(phrase), true,
  `Admission operator should contain ${phrase}`)
assert.doesNotMatch(cli,
  /GoogleGenAI|generateContent|dotenv|customerCredits?\.(?:reserve|spend|release|refund)|productionReady\s*:\s*true/u)
const cleanEnv = { ...process.env }
delete cleanEnv.REEDITPRO_CONFIRM_VI_MODEL_SKU_ADMISSION
const blocked = spawnSync(
  join(root, 'node_modules', '.bin', 'tsx'),
  [cliPath],
  { cwd: root, env: cleanEnv, encoding: 'utf8' },
)
assert.equal(blocked.status, 1)
assert.match(blocked.stderr,
  /requires exact internal-spend confirmation/u)
assert.equal(blocked.stdout, '')

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-live-admission-owner',
  checks: 55,
  status: 'passed',
  replayStable: true,
  liveProviderCallMade: false,
  auditOrBillingQueryMade: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function preflight(input: {
  pricingSnapshotRef: VisualIntelligenceEvidenceRef
  rateAuthorityRef: VisualIntelligenceEvidenceRef
  maximumAuthorizedCostMicros: number
}): VisualIntelligenceCostPreflight {
  return {
    pricingSnapshotRef: input.pricingSnapshotRef,
    accountEffectiveRateAuthorityRef: input.rateAuthorityRef,
    currency: 'USD',
    maximumAuthorizedCostMicros: input.maximumAuthorizedCostMicros,
    estimatedMinimumCostMicros: 0,
    estimatedMaximumCostMicros: input.maximumAuthorizedCostMicros,
    serviceFeeIncluded: false,
    publicListPriceUsedAsSettlementAuthority: false,
    preflightPassed: true,
  }
}

function memoryLiveStore(options: {
  omitRegistryReread?: boolean
  omitAdmissionReread?: boolean
} = {}): VisualIntelligenceModelBillingSkuLiveGcsStore & {
  metrics: { routeRegistryCreates: number; admissionCreates: number }
} {
  const registries = new Map<string, VisualIntelligenceCanonicalProviderRouteRegistry>()
  const admissions = new Map<string, VisualIntelligenceModelBillingSkuLiveAdmission>()
  const metrics = { routeRegistryCreates: 0, admissionCreates: 0 }
  return {
    metrics,
    routeRegistryReadPort: {
      async readExact(reference) {
        if (options.omitRegistryReread) return null
        return registries.get(refKey(reference)) ?? null
      },
    },
    admissionReadPort: {
      async readExact(reference) {
        if (options.omitAdmissionReread) return null
        return admissions.get(refKey(reference)) ?? null
      },
    },
    async persistRouteRegistryCreateOnly(value) {
      const parsed = parseVisualIntelligenceCanonicalProviderRouteRegistry(value)
      const reference = visualIntelligenceCanonicalProviderRouteRegistryRef(parsed)
      metrics.routeRegistryCreates += 1
      const existing = registries.get(refKey(reference))
      if (existing) assert.deepEqual(existing, parsed)
      else registries.set(refKey(reference), parsed)
      return reference
    },
    async persistAdmissionCreateOnly(value) {
      const parsed = parseVisualIntelligenceModelBillingSkuLiveAdmission(value)
      const reference = visualIntelligenceModelBillingSkuLiveAdmissionRef(parsed)
      metrics.admissionCreates += 1
      const existing = admissions.get(refKey(reference))
      if (existing) assert.deepEqual(existing, parsed)
      else admissions.set(refKey(reference), parsed)
      return reference
    },
    contextEvidenceRepository: unusedRepository() as never,
    resultRepository: unusedRepository() as never,
    attemptStore: unusedRepository() as never,
  }
}

function unusedRepository() {
  return new Proxy({}, {
    get() {
      throw new Error('Unexpected live execution repository use.')
    },
  })
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const values = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      assert.equal(sha(input.body), input.contentSha256)
      const existing = values.get(input.objectPath)
      if (existing) {
        assert.deepEqual(existing, input.body)
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = values.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function runtimeRelease() {
  return createControlledVisualIntelligenceRuntimeRelease({
    schemaVersion: 'visual-intelligence-runtime-release-v1',
    evidenceClass:
      'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
    projectId: 'reeditpro',
    vertexLocation: 'global',
    lifecycleBucketName: 'reeditpro-private-lifecycle',
    runtimeReleaseIdentityRef: ref('vi-live-admission-runtime-release'),
    lifecycleRepositoryReleaseRef: ref('vi-live-admission-lifecycle'),
    concurrencyOwnerReleaseRef: ref('vi-live-admission-concurrency'),
    sourceEvidencePreparationReleaseRef: ref('vi-live-admission-preparation'),
    providerModelAccessQualificationRef: ref('vi-live-admission-model-access'),
    providerTransportQualificationRef: ref('vi-live-admission-transport'),
    providerPrivacyRetentionReviewRef: ref('vi-live-admission-privacy'),
    promptInjectionSafetyQualificationRef: ref('vi-live-admission-prompt'),
    structuredOutputQualificationRef: ref('vi-live-admission-structured'),
    professionalHighQualityBenchmarkRef: ref('vi-live-admission-quality'),
    accountEffectivePricingAuthorityRef: rateRef,
    accountEffectiveCostSettlementOwnerRef: ref('vi-live-admission-cost-owner'),
    capabilityId: 'visual_intelligence',
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    exactModelId: 'gemini-3.1-pro-preview',
    qualityProfile: 'professional_high',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    providerAuthentication: 'vertex_application_default_credentials',
    providerSdkPackage: '@google/genai',
    providerSdkVersion: '2.15.0',
    providerApiVersion: 'v1alpha',
    providerAdapterVersion:
      'vertex-gemini-pro-visual-intelligence-adapter-v4',
    profileRegistryVersion: 'visual-intelligence-profile-registry-v2',
    promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
    responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
    deterministicEvidenceVersion:
      VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
    exactModelAccessQualified: true,
    vertexAdcAndServiceAccountIamQualified: true,
    professionalHighThinkingAndMediaResolutionQualified: true,
    completeSourceNativeVideoTransportQualified: true,
    strictStructuredOutputQualified: true,
    promptInjectionSafetyQualified: true,
    privateMediaPrivacyAndRetentionQualified: true,
    lifecycleRepositoryCreateOnlyAndRereadQualified: true,
    durableAttemptConsumptionQualified: true,
    distributedConcurrencyQualified: true,
    deterministicGpuEvidencePreparationQualified: true,
    accountEffectivePricingAuthorityQualified: true,
    accountEffectiveCostSettlementQualified: true,
    authenticatedUserTriggerRequired: true,
    automaticProviderRetryAllowed: false,
    uncertainProviderOutcomeRetryAllowed: false,
    apiKeyAuthenticationAllowed: false,
    providerToolsAllowed: false,
    searchGroundingAllowed: false,
    urlContextAllowed: false,
    codeExecutionAllowed: false,
    flashFallbackAllowed: false,
    cheaperModelFallbackAllowed: false,
    qwenVisualFallbackAllowed: false,
    selfHostedVisualModelFallbackAllowed: false,
    publicListPriceSettlementAllowed: false,
    callerReleaseObservationAccepted: false,
    directTimelineMutationAllowed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

function ref(id: string): VisualIntelligenceEvidenceRef {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function refKey(reference: VisualIntelligenceEvidenceRef): string {
  return `${reference.id}:${reference.version}:${reference.contentHash}`
}

function sha(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
