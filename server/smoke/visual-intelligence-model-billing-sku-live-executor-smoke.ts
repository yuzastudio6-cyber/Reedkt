import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GenerateContentConfig } from '@google/genai'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  parseVisualIntelligenceModelBillingContextEvidence,
  visualIntelligenceModelBillingContextEvidenceRef,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  createVisualIntelligenceModelBillingSkuLiveAdmission,
  createVisualIntelligenceModelBillingSkuLiveExecutor,
  parseVisualIntelligenceModelBillingSkuLiveAdmission,
  parseVisualIntelligenceModelBillingSkuLiveResult,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  visualIntelligenceModelBillingSkuLiveResultByteLength,
  visualIntelligenceModelBillingSkuLiveResultRef,
  type VisualIntelligenceModelBillingContextEvidenceRepository,
  type VisualIntelligenceModelBillingSkuLiveAttemptStore,
  type VisualIntelligenceModelBillingSkuLiveResultRepository,
  type VisualIntelligenceModelBillingSkuQualificationGeneratePort,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-executor'
import {
  visualIntelligenceProviderAuditCorrelationLabels,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-read-port'
import {
  createVisualIntelligenceGcsProviderTrafficGuard,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'
import {
  createControlledVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'

let now = new Date('2026-08-08T10:00:00.000Z')
const registry = routeRegistry()
const registryRef = visualIntelligenceCanonicalProviderRouteRegistryRef(
  registry,
)
const admission = liveAdmission()
const admissionRef = visualIntelligenceModelBillingSkuLiveAdmissionRef(
  admission,
)
const providerCalls: GenerateCall[] = []
const generatePort = exactGeneratePort(providerCalls)
const contextRepository = memoryContextRepository()
const attemptStore = memoryAttemptStore()
const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage: memoryStorage() as unknown as Storage,
  now: () => new Date(now),
})
const executor = createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: {
    async readExact(reference) {
      return key(reference) === key(admissionRef) ? admission : null
    },
  },
  providerTrafficGuardPort: guard,
  generatePort,
  contextEvidenceRepository: contextRepository,
  resultRepository: memoryResultRepository(),
  attemptStore,
  routeRegistryReadPort: {
    async readExact(reference) {
      return key(reference) === key(registryRef) ? registry : null
    },
  },
  now: () => new Date(now),
})
const result = await executor.execute({ admissionRef })

assert.deepEqual(parseVisualIntelligenceModelBillingSkuLiveAdmission(admission),
  admission)
assert.deepEqual(parseVisualIntelligenceModelBillingSkuLiveResult(result),
  result)
assert.equal(result.providerRequestCount, 4)
assert.equal(result.implicitCacheRequestPairCount, 2)
assert.equal(result.sanitizedCalls.length, 4)
assert.deepEqual(result.sanitizedCalls.map((call) => call.callOrdinal),
  [1, 2, 3, 4])
assert.deepEqual(result.sanitizedCalls.map((call) => call.contextClass), [
  'standard_le_200k', 'standard_le_200k', 'long_gt_200k', 'long_gt_200k',
])
assert.deepEqual(result.sanitizedCalls.map((call) => call.cachedTokenCount),
  [0, 9_000, 0, 200_001])
assert.equal(result.totalPromptTokenCount, 440_002)
assert.equal(result.totalOutputAndThinkingTokenCount, 12)
assert.equal(result.standardContextThresholdVerified, true)
assert.equal(result.longContextThresholdVerified, true)
assert.equal(result.measuredImplicitCacheTokensObservedForBothContexts, true)
assert.equal(result.providerGuardHeldAcrossEveryProviderCall, true)
assert.equal(result.providerAuditCorrelationLabelsEmittedForEveryRequest, true)
assert.equal(result.contextEvidenceCreateOnlyPersistedAndReread, true)
assert.equal(result.resultCreateOnlyPersistedAndReread, true)
assert.equal(result.providerCallMade, true)
assert.equal(result.actualProviderSpendReconciliationPending, true)
assert.equal(result.cloudAuditWindowReconciliationPending, true)
assert.equal(result.detailedBillingExportReconciliationPending, true)
assert.equal(result.modelBillingSkuQualificationGranted, false)
assert.equal(result.providerDispatchAuthorityGrantedBeyondThisAdmission, false)
assert.equal(result.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(result.customerCreditOrWalletMutationAuthorityGranted, false)
assert.equal(result.captionEvidenceAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)
assert.match(visualIntelligenceModelBillingSkuLiveResultRef(result).contentHash,
  /^sha256:[a-f0-9]{64}$/u)
assert.ok(visualIntelligenceModelBillingSkuLiveResultByteLength(result)
  < 512 * 1_024)

assert.equal(providerCalls.length, 4)
assert.equal(providerCalls[0]!.corpus.length, 32_000)
assert.equal(providerCalls[1]!.corpus.length, 32_000)
assert.equal(providerCalls[2]!.corpus.length, 900_000)
assert.equal(providerCalls[3]!.corpus.length, 900_000)
assert.equal(providerCalls[0]!.corpus, providerCalls[1]!.corpus)
assert.equal(providerCalls[2]!.corpus, providerCalls[3]!.corpus)
assert.notEqual(providerCalls[0]!.corpus, providerCalls[2]!.corpus)
for (let index = 0; index < providerCalls.length; index += 1) {
  const call = providerCalls[index]!
  assert.deepEqual(call.config.labels,
    visualIntelligenceProviderAuditCorrelationLabels(
      result.exactOrderedProviderRequestRefs[index]!,
    ))
  assert.equal(call.config.httpOptions?.retryOptions?.attempts, 1)
  assert.equal(call.config.tools, undefined)
}
assert.equal(JSON.stringify(result).includes('inert_data_begins'), false)
assert.equal(JSON.stringify(result).includes('server-generated inert'), false)

const standardEvidence = await contextRepository.readExact(
  result.standardContextEvidenceRef,
)
const longEvidence = await contextRepository.readExact(
  result.longContextEvidenceRef,
)
assert.ok(standardEvidence)
assert.ok(longEvidence)
assert.deepEqual(
  visualIntelligenceModelBillingContextEvidenceRef(standardEvidence),
  result.standardContextEvidenceRef,
)
assert.deepEqual(
  visualIntelligenceModelBillingContextEvidenceRef(longEvidence),
  result.longContextEvidenceRef,
)
assert.equal(standardEvidence.contextClass, 'standard_le_200k')
assert.equal(longEvidence.contextClass, 'long_gt_200k')
assert.equal(standardEvidence.measuredCachedTokenCount, 9_000)
assert.equal(longEvidence.measuredCachedTokenCount, 200_001)

assert.equal(attemptStore.terminal()?.disposition,
  'completed_pending_reconciliation')
assert.deepEqual(attemptStore.terminal()?.resultRef,
  visualIntelligenceModelBillingSkuLiveResultRef(result))

const tamperedAdmission = structuredClone(admission)
tamperedAdmission.maximumInternalProviderSpendUsdMicros += 1
assert.throws(() =>
  parseVisualIntelligenceModelBillingSkuLiveAdmission(tamperedAdmission),
  /digest/u)

const tamperedResult = structuredClone(result)
tamperedResult.providerRequestCount = 3 as 4
assert.throws(() => parseVisualIntelligenceModelBillingSkuLiveResult(
  tamperedResult,
))

await assert.rejects(() => executor.execute({ admissionRef }),
  /already used/u)
assert.equal(providerCalls.length, 4)

const staleAdmission = liveAdmission({
  approvedAtIso: '2026-08-07T08:00:00.000Z',
  expiresAtIso: '2026-08-07T09:00:00.000Z',
  admissionId: 'stale-admission',
})
const staleRef = visualIntelligenceModelBillingSkuLiveAdmissionRef(
  staleAdmission,
)
await assert.rejects(() => createExecutor({
  admission: staleAdmission,
  generatePort: exactGeneratePort([]),
}).execute({ admissionRef: staleRef }), /not current/u)

const missingCacheCalls: GenerateCall[] = []
const missingCachePort = exactGeneratePort(missingCacheCalls, {
  overrides: { 2: { cachedTokenCount: 0 } },
})
const missingCacheAdmission = liveAdmission({
  admissionId: 'missing-cache-admission',
  qualificationId: 'missing-cache-qualification',
})
const missingCacheAttemptStore = memoryAttemptStore()
await assert.rejects(() => createExecutor({
  admission: missingCacheAdmission,
  generatePort: missingCachePort,
  attemptStore: missingCacheAttemptStore,
}).execute({
  admissionRef:
    visualIntelligenceModelBillingSkuLiveAdmissionRef(missingCacheAdmission),
}), /provider evidence was rejected/u)
assert.equal(missingCacheCalls.length, 2)
assert.equal(missingCacheAttemptStore.terminal()?.disposition,
  'failed_no_retry')
assert.equal(missingCacheAttemptStore.terminal()?.sanitizedFailureCode,
  'provider_evidence_rejected')

const unknownCalls: GenerateCall[] = []
const unknownAdmission = liveAdmission({
  admissionId: 'unknown-outcome-admission',
  qualificationId: 'unknown-outcome-qualification',
})
const unknownAttemptStore = memoryAttemptStore()
await assert.rejects(() => createExecutor({
  admission: unknownAdmission,
  generatePort: exactGeneratePort(unknownCalls, { failAtCall: 3 }),
  attemptStore: unknownAttemptStore,
}).execute({
  admissionRef:
    visualIntelligenceModelBillingSkuLiveAdmissionRef(unknownAdmission),
}), /outcome is unknown/u)
assert.equal(unknownCalls.length, 3)
assert.equal(unknownAttemptStore.terminal()?.sanitizedFailureCode,
  'provider_outcome_unknown')

const missingRegistryAdmission = liveAdmission({
  admissionId: 'missing-registry-admission',
  qualificationId: 'missing-registry-qualification',
})
await assert.rejects(() => createExecutor({
  admission: missingRegistryAdmission,
  generatePort: exactGeneratePort([]),
  registryMissing: true,
}).execute({
  admissionRef:
    visualIntelligenceModelBillingSkuLiveAdmissionRef(
      missingRegistryAdmission,
    ),
}), /not current/u)

assert.throws(() => createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: null as never,
  providerTrafficGuardPort: guard,
  generatePort,
  contextEvidenceRepository: contextRepository,
  resultRepository: memoryResultRepository(),
  attemptStore,
  routeRegistryReadPort: { async readExact() { return registry } },
}), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-live-executor',
  checks: 76,
  status: 'passed',
  providerCallsInAcceptedFixture: 4,
  automaticProviderRetries: 0,
  rawProviderPayloadPersisted: false,
  cloudAuditReconciliationPending: true,
  billingExportReconciliationPending: true,
  modelBillingSkuQualified: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function createExecutor(input: {
  admission: ReturnType<typeof liveAdmission>
  generatePort: VisualIntelligenceModelBillingSkuQualificationGeneratePort
  attemptStore?: ReturnType<typeof memoryAttemptStore>
  registryMissing?: boolean
}) {
  now = new Date('2026-08-08T10:00:00.000Z')
  const localAdmissionRef =
    visualIntelligenceModelBillingSkuLiveAdmissionRef(input.admission)
  return createVisualIntelligenceModelBillingSkuLiveExecutor({
    admissionReadPort: {
      async readExact(reference) {
        return key(reference) === key(localAdmissionRef)
          ? input.admission : null
      },
    },
    providerTrafficGuardPort: createVisualIntelligenceGcsProviderTrafficGuard({
      projectId: 'reeditpro',
      bucketName: 'reeditpro-control-plane',
      storage: memoryStorage() as unknown as Storage,
      now: () => new Date(now),
    }),
    generatePort: input.generatePort,
    contextEvidenceRepository: memoryContextRepository(),
    resultRepository: memoryResultRepository(),
    attemptStore: input.attemptStore ?? memoryAttemptStore(),
    routeRegistryReadPort: {
      async readExact(reference) {
        return !input.registryMissing && key(reference) === key(registryRef)
          ? registry : null
      },
    },
    now: () => new Date(now),
  })
}

function exactGeneratePort(
  calls: GenerateCall[],
  options?: {
    failAtCall?: number
    overrides?: Record<number, Partial<GenerateResult>>
  },
): VisualIntelligenceModelBillingSkuQualificationGeneratePort {
  return {
    async generate(input) {
      const corpus = String(input.contents[0]?.parts?.[1]
        && Reflect.get(input.contents[0].parts[1]!, 'text'))
      calls.push({ corpus, config: input.config })
      const callNumber = calls.length
      now = new Date(now.getTime() + 60_000)
      if (options?.failAtCall === callNumber) {
        throw new Error('network details must not escape')
      }
      const base = callNumber <= 2
        ? {
          promptTokenCount: 10_000,
          cachedTokenCount: callNumber === 1 ? 0 : 9_000,
        }
        : {
          promptTokenCount: 210_001,
          cachedTokenCount: callNumber === 3 ? 0 : 200_001,
        }
      return {
        responseId: `provider-response-${callNumber}`,
        modelVersion: 'gemini-3.1-pro-preview',
        text: 'OK',
        finishReason: 'STOP',
        candidateCount: 1,
        ...base,
        candidateTokenCount: 2,
        thinkingTokenCount: 1,
        totalTokenCount: base.promptTokenCount + 3,
        ...options?.overrides?.[callNumber],
      }
    },
  }
}

interface GenerateResult {
  responseId: string
  modelVersion: string
  text: string
  finishReason: string
  candidateCount: number
  promptTokenCount: number
  cachedTokenCount: number
  candidateTokenCount: number
  thinkingTokenCount: number
  totalTokenCount: number
}

interface GenerateCall {
  corpus: string
  config: GenerateContentConfig
}

function liveAdmission(overrides: Partial<{
  admissionId: string
  qualificationId: string
  approvedAtIso: string
  expiresAtIso: string
}> = {}) {
  return createVisualIntelligenceModelBillingSkuLiveAdmission({
    schemaVersion: 'visual-intelligence-model-billing-sku-live-admission-v1',
    admissionId: overrides.admissionId ?? 'vi-live-qualification-admission',
    admissionVersion: 1,
    qualificationId:
      overrides.qualificationId ?? 'vi-model-sku-qualification',
    qualificationVersion: 1,
    evidenceClass:
      'explicit_single_use_internal_paid_provider_qualification_admission',
    projectId: 'reeditpro',
    exactModelId: 'gemini-3.1-pro-preview',
    vertexLocation: 'global',
    throughputClass: 'standard',
    providerServiceId: 'services/C7E2-9256-1C43',
    internalSpendApprovalRef: ref('internal-spend-approval'),
    approvedSourceReleaseRef: ref('approved-source-release'),
    providerRouteRegistryRef: registryRef,
    approvedAtIso: overrides.approvedAtIso
      ?? '2026-08-08T09:59:00.000Z',
    expiresAtIso: overrides.expiresAtIso
      ?? '2026-08-08T11:00:00.000Z',
    maximumProviderRequestCount: 4,
    maximumTotalPromptTokens: 2_097_152,
    maximumTotalOutputAndThinkingTokens: 64,
    maximumInternalProviderSpendUsdMicros: 10_000_000,
    exactStandardAndLongImplicitCachePairsApproved: true,
    operatorApprovedPaidProviderExecution: true,
    singleUseAdmission: true,
    automaticProviderRetryAllowed: false,
    providerToolsAllowed: false,
    groundingAllowed: false,
    urlContextAllowed: false,
    codeExecutionAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    customerCreditOrWalletMutationAuthorityGranted: false,
    captionEvidenceAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

function routeRegistry() {
  return createControlledVisualIntelligenceCanonicalProviderRouteRegistry({
    schemaVersion: 'visual-intelligence-canonical-provider-route-registry-v1',
    registryId: 'visual-intelligence-canonical-provider-routes',
    registryVersion: 1,
    evidenceClass:
      'exact_shared_visual_intelligence_provider_route_and_guard_registry',
    projectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    exactModelId: 'gemini-3.1-pro-preview',
    vertexLocation: 'global',
    throughputClass: 'standard',
    routes: [
      {
        routeClass: 'ordinary_visual_intelligence_request',
        ownerVersion: 'visual-intelligence-production-runtime-v19',
        providerAdapterVersion:
          'vertex-gemini-pro-visual-intelligence-adapter-v4',
        providerTrafficGuardVersion:
          'visual-intelligence-provider-traffic-guard-v1',
        providerTrafficGuardRequiredBeforeEveryProviderCall: true,
        directProviderCallOutsideGuardAllowed: false,
      },
      {
        routeClass: 'model_billing_sku_qualification',
        ownerVersion:
          'visual-intelligence-model-billing-sku-live-executor-v1',
        providerAdapterVersion:
          'vertex-gemini-pro-visual-intelligence-adapter-v4',
        providerTrafficGuardVersion:
          'visual-intelligence-provider-traffic-guard-v1',
        providerTrafficGuardRequiredBeforeEveryProviderCall: true,
        directProviderCallOutsideGuardAllowed: false,
      },
    ],
    allCanonicalProviderRoutesEnumerated: true,
    allCanonicalProviderRoutesUseOneSharedGuard: true,
    nonCanonicalProviderCredentialMountPresent: false,
    exactSourceAndDeploymentBindingsReread: true,
    callerAuthoredRouteClaimAccepted: false,
    providerCallMadeByRegistryReader: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

function memoryContextRepository() {
  const records = new Map<string, ReturnType<
    typeof parseVisualIntelligenceModelBillingContextEvidence
  >>()
  const repository: VisualIntelligenceModelBillingContextEvidenceRepository = {
    async persistCreateOnly(evidence) {
      const parsed =
        parseVisualIntelligenceModelBillingContextEvidence(evidence)
      const evidenceRef =
        visualIntelligenceModelBillingContextEvidenceRef(parsed)
      records.set(key(evidenceRef), parsed)
      return {
        evidenceRef,
        persistenceReceiptRef: ref(`${evidenceRef.id}.persistence`),
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },
    async readExact(reference) {
      return records.get(key(reference)) ?? null
    },
  }
  return repository
}

function memoryAttemptStore() {
  let started = false
  let terminal: Parameters<
    VisualIntelligenceModelBillingSkuLiveAttemptStore['markTerminal']
  >[0] | null = null
  const store: VisualIntelligenceModelBillingSkuLiveAttemptStore & {
    terminal(): typeof terminal
  } = {
    async beginCreateOnly(input) {
      if (started) return { status: 'already_exists' }
      started = true
      return {
        status: 'started',
        attemptRef: createVisualIntelligenceEvidenceRef(
          `${input.qualificationId}.attempt`,
          input,
        ),
      }
    },
    async markTerminal(input) { terminal = input },
    terminal: () => terminal,
  }
  return store
}

function memoryResultRepository() {
  const records = new Map<string, ReturnType<
    typeof parseVisualIntelligenceModelBillingSkuLiveResult
  >>()
  const repository: VisualIntelligenceModelBillingSkuLiveResultRepository = {
    async persistCreateOnly(result) {
      const parsed = parseVisualIntelligenceModelBillingSkuLiveResult(result)
      const resultRef = visualIntelligenceModelBillingSkuLiveResultRef(parsed)
      records.set(key(resultRef), parsed)
      return {
        resultRef,
        persistenceReceiptRef: ref(`${resultRef.id}.persistence`),
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },
    async readExact(reference) {
      return records.get(key(reference)) ?? null
    },
  }
  return repository
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function memoryStorage() {
  const objects = new Map<string, StoredObject>()
  let generation = 1
  const requireObject = (name: string) => {
    const stored = objects.get(name)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    bucket() {
      return {
        file(name: string, options?: { generation?: string }) {
          return {
            async save(body: Buffer, saveOptions: {
              contentType: string
              preconditionOpts: { ifGenerationMatch: number }
            }) {
              if (saveOptions.preconditionOpts.ifGenerationMatch !== 0) {
                throw new Error('Expected create-only persistence.')
              }
              if (objects.has(name)) {
                throw Object.assign(new Error('Exists.'), { code: 412 })
              }
              const next = String(generation++)
              objects.set(name, {
                body: Buffer.from(body),
                generation: next,
                etag: `etag-${next}`,
                contentType: saveOptions.contentType,
              })
            },
            async getMetadata() {
              const stored = requireObject(name)
              if (options?.generation
                && options.generation !== stored.generation) {
                throw Object.assign(new Error('Not found.'), { code: 404 })
              }
              return [{
                generation: stored.generation,
                etag: stored.etag,
                contentType: stored.contentType,
                size: String(stored.body.byteLength),
              }]
            },
            async download() {
              return [Buffer.from(requireObject(name).body)]
            },
            async delete(deleteOptions: { ifGenerationMatch: string }) {
              const stored = requireObject(name)
              if (deleteOptions.ifGenerationMatch !== stored.generation) {
                throw Object.assign(new Error('Conflict.'), { code: 412 })
              }
              objects.delete(name)
            },
          }
        },
      }
    },
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function key(reference: ReturnType<typeof ref>) {
  return `${reference.id}:${reference.version}:${reference.contentHash}`
}
