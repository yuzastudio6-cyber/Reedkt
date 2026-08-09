import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GenerateContentConfig } from '@google/genai'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingSkuLiveAdmission,
  createVisualIntelligenceModelBillingSkuLiveExecutor,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  visualIntelligenceModelBillingSkuLiveResultRef,
  type VisualIntelligenceModelBillingSkuQualificationGeneratePort,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-executor'
import {
  createVisualIntelligenceModelBillingSkuLiveGcsStore,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-gcs-store'
import {
  createVisualIntelligenceGcsProviderTrafficGuard,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'
import {
  createControlledVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'

let now = new Date('2026-08-08T10:00:00.000Z')
const memory = memoryStorage()
const storage = memory.api as unknown as Storage
const store = createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage,
  now: () => new Date(now),
})
const registry = routeRegistry()
const registryRef = visualIntelligenceCanonicalProviderRouteRegistryRef(
  registry,
)
const admission = liveAdmission(registryRef)
const admissionRef = visualIntelligenceModelBillingSkuLiveAdmissionRef(
  admission,
)

assert.deepEqual(
  await store.persistRouteRegistryCreateOnly(registry),
  registryRef,
)
assert.deepEqual(
  await store.persistAdmissionCreateOnly(admission),
  admissionRef,
)
assert.deepEqual(await store.routeRegistryReadPort.readExact(registryRef),
  registry)
assert.deepEqual(await store.admissionReadPort.readExact(admissionRef),
  admission)

const saveCountBeforeReplay = memory.saveCount()
assert.deepEqual(
  await store.persistRouteRegistryCreateOnly(registry),
  registryRef,
)
assert.deepEqual(
  await store.persistAdmissionCreateOnly(admission),
  admissionRef,
)
assert.equal(memory.saveCount(), saveCountBeforeReplay + 2)

const calls: GenerateCall[] = []
const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage,
  now: () => new Date(now),
})
const executor = createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: store.admissionReadPort,
  providerTrafficGuardPort: guard,
  generatePort: generatePort(calls),
  contextEvidenceRepository: store.contextEvidenceRepository,
  resultRepository: store.resultRepository,
  attemptStore: store.attemptStore,
  routeRegistryReadPort: store.routeRegistryReadPort,
  now: () => new Date(now),
})
const result = await executor.execute({ admissionRef })
const resultRef = visualIntelligenceModelBillingSkuLiveResultRef(result)

assert.equal(calls.length, 4)
assert.deepEqual(calls.map((call) => call.corpusLength), [
  32_000, 32_000, 900_000, 900_000,
])
assert.equal(result.providerRequestCount, 4)
assert.equal(result.resultCreateOnlyPersistedAndReread, true)
assert.equal(result.modelBillingSkuQualificationGranted, false)
assert.equal(result.captionEvidenceAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)
assert.deepEqual(await store.resultRepository.readExact(resultRef), result)
assert.ok(await store.contextEvidenceRepository.readExact(
  result.standardContextEvidenceRef,
))
assert.ok(await store.contextEvidenceRepository.readExact(
  result.longContextEvidenceRef,
))

const restarted = createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage,
  now: () => new Date(now),
})
assert.deepEqual(await restarted.admissionReadPort.readExact(admissionRef),
  admission)
assert.deepEqual(await restarted.routeRegistryReadPort.readExact(registryRef),
  registry)
assert.deepEqual(await restarted.resultRepository.readExact(resultRef), result)
assert.ok(await restarted.contextEvidenceRepository.readExact(
  result.standardContextEvidenceRef,
))

await assert.rejects(() => restarted.attemptStore.markTerminal({
  attemptRef: result.attemptRef,
  disposition: 'completed_pending_reconciliation',
  resultRef,
  sanitizedFailureCode: null,
}), /already terminal/u)

const callCountBeforeReplay = calls.length
await assert.rejects(() => createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: restarted.admissionReadPort,
  providerTrafficGuardPort: guard,
  generatePort: generatePort(calls),
  contextEvidenceRepository: restarted.contextEvidenceRepository,
  resultRepository: restarted.resultRepository,
  attemptStore: restarted.attemptStore,
  routeRegistryReadPort: restarted.routeRegistryReadPort,
  now: () => new Date(now),
}).execute({ admissionRef }), /already used/u)
assert.equal(calls.length, callCountBeforeReplay)

assert.equal(memory.names().filter((name) => name.endsWith('.start.json')).length,
  1)
assert.equal(memory.names().filter((name) =>
  name.endsWith('.terminal.json')).length, 1)
assert.ok(memory.names().every((name) => name.startsWith(
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/',
)))
const serializedPrivateEvidence = memory.bodies().join('\n')
assert.equal(serializedPrivateEvidence.includes('inert_data_begins'), false)
assert.equal(serializedPrivateEvidence.includes('server-generated inert'), false)
assert.equal(serializedPrivateEvidence.includes('https://'), false)
assert.equal(serializedPrivateEvidence.includes('gs://'), false)
assert.equal(serializedPrivateEvidence.includes('credential'), false)

assert.equal(await restarted.resultRepository.readExact(ref('missing')), null)
const tamperedRef = structuredClone(resultRef)
tamperedRef.id = 'cross-result'
await assert.rejects(() => restarted.resultRepository.readExact(tamperedRef),
  /changed/u)
memory.tamperBySuffix(resultRef.contentHash.slice(7), (body) => {
  const parsed = JSON.parse(body.toString('utf8')) as Record<string, unknown>
  parsed.providerRequestCount = 3
  return Buffer.from(JSON.stringify(parsed), 'utf8')
})
await assert.rejects(() => restarted.resultRepository.readExact(resultRef))

assert.throws(() => createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId: 'reeditpro',
  bucketName: '../unsafe',
}), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-live-gcs-store',
  checks: 39,
  status: 'passed',
  createOnlyDurableEvidence: true,
  restartRereadVerified: true,
  singleUseAttempt: true,
  exactSingleTerminal: true,
  promptCorpusPersisted: false,
  providerCallsInControlledFixture: 4,
  actualProviderCallMade: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function liveAdmission(
  registryRef: ReturnType<
    typeof visualIntelligenceCanonicalProviderRouteRegistryRef
  >,
) {
  return createVisualIntelligenceModelBillingSkuLiveAdmission({
    schemaVersion: 'visual-intelligence-model-billing-sku-live-admission-v1',
    admissionId: 'vi-live-gcs-store-admission',
    admissionVersion: 1,
    qualificationId: 'vi-live-gcs-store-qualification',
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
    approvedAtIso: '2026-08-08T09:59:00.000Z',
    expiresAtIso: '2026-08-08T11:00:00.000Z',
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

interface GenerateCall {
  corpusLength: number
  config: GenerateContentConfig
}

function generatePort(
  calls: GenerateCall[],
): VisualIntelligenceModelBillingSkuQualificationGeneratePort {
  return {
    async generate(input) {
      const corpus = String(input.contents[0]?.parts?.[1]
        && Reflect.get(input.contents[0].parts[1]!, 'text'))
      calls.push({ corpusLength: corpus.length, config: input.config })
      now = new Date(now.getTime() + 60_000)
      const ordinal = calls.length
      const promptTokenCount = ordinal <= 2 ? 10_000 : 210_001
      const cachedTokenCount = ordinal === 2
        ? 9_000
        : ordinal === 4 ? 200_001 : 0
      return {
        responseId: `provider-response-${ordinal}`,
        modelVersion: 'gemini-3.1-pro-preview',
        text: 'OK',
        finishReason: 'STOP',
        candidateCount: 1,
        promptTokenCount,
        cachedTokenCount,
        candidateTokenCount: 2,
        thinkingTokenCount: 1,
        totalTokenCount: promptTokenCount + 3,
      }
    },
  }
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
  let saves = 0
  const requireObject = (name: string, expectedGeneration?: string) => {
    const stored = objects.get(name)
    if (!stored || expectedGeneration
      && expectedGeneration !== stored.generation) {
      throw Object.assign(new Error('Not found.'), { code: 404 })
    }
    return stored
  }
  return {
    api: {
      bucket() {
        return {
          file(name: string, options?: { generation?: string }) {
            return {
              async save(body: Buffer, saveOptions: {
                contentType: string
                preconditionOpts: { ifGenerationMatch: number }
              }) {
                saves += 1
                if (saveOptions.preconditionOpts.ifGenerationMatch !== 0) {
                  throw new Error('Expected create-only persistence.')
                }
                if (objects.has(name)) throw Object.assign(
                  new Error('Exists.'), { code: 412 },
                )
                const next = String(generation++)
                objects.set(name, {
                  body: Buffer.from(body),
                  generation: next,
                  etag: `etag-${next}`,
                  contentType: saveOptions.contentType,
                })
              },
              async getMetadata() {
                const stored = requireObject(name, options?.generation)
                return [{
                  generation: stored.generation,
                  etag: stored.etag,
                  contentType: stored.contentType,
                  size: String(stored.body.byteLength),
                }]
              },
              async download() {
                return [Buffer.from(requireObject(
                  name, options?.generation,
                ).body)]
              },
              async delete(deleteOptions: { ifGenerationMatch: string }) {
                const stored = requireObject(name, options?.generation)
                if (deleteOptions.ifGenerationMatch !== stored.generation) {
                  throw Object.assign(new Error('Conflict.'), { code: 412 })
                }
                objects.delete(name)
              },
            }
          },
        }
      },
    },
    saveCount: () => saves,
    names: () => [...objects.keys()],
    bodies: () => [...objects.values()].map((value) =>
      value.body.toString('utf8')),
    tamperBySuffix(suffix: string, mutate: (body: Buffer) => Buffer) {
      const match = [...objects.entries()].find(([name]) =>
        name.endsWith(`${suffix}.json`))
      assert.ok(match)
      match[1].body = mutate(Buffer.from(match[1].body))
    },
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}
