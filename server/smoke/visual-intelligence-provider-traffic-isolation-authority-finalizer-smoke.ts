import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingContextEvidence,
  parseVisualIntelligenceProviderTrafficIsolationAuthority,
  visualIntelligenceModelBillingContextEvidenceRef,
  visualIntelligenceProviderTrafficIsolationAuthorityRef,
  type VisualIntelligenceProviderTrafficIsolationAuthority,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  createVisualIntelligenceProviderAuditWindowObservationRepository,
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-observation-repository'
import {
  createVisualIntelligenceProviderAuditWindowReadPort,
  createVisualIntelligenceProviderAuditWindowReaderConfiguration,
  visualIntelligenceProviderAuditCorrelationLabels,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-read-port'
import {
  createVisualIntelligenceGcsProviderTrafficGuard,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'
import {
  createControlledVisualIntelligenceCanonicalProviderRouteRegistry,
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer,
  parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
  type VisualIntelligenceProviderTrafficIsolationAuthorityRepository,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'

const guardStartedAtIso = '2026-08-08T10:00:00.000Z'
const guardFinishedAtIso = '2026-08-08T10:10:00.000Z'
const qualificationOwnerId = 'vi-model-sku-qualification-20260808'
const standard = contextEvidence({
  prefix: 'standard',
  contextClass: 'standard_le_200k',
  startedAtIso: '2026-08-08T10:01:00.000Z',
  finishedAtIso: '2026-08-08T10:04:00.000Z',
  promptTokenCount: 10_000,
  cachedTokenCount: 9_000,
})
const long = contextEvidence({
  prefix: 'long',
  contextClass: 'long_gt_200k',
  startedAtIso: '2026-08-08T10:05:00.000Z',
  finishedAtIso: '2026-08-08T10:09:00.000Z',
  promptTokenCount: 210_001,
  cachedTokenCount: 200_001,
})
const standardRef = visualIntelligenceModelBillingContextEvidenceRef(standard)
const longRef = visualIntelligenceModelBillingContextEvidenceRef(long)
const requestRefs = [
  standard.warmupProviderRequestRef,
  standard.measuredProviderRequestRef,
  long.warmupProviderRequestRef,
  long.measuredProviderRequestRef,
] as const

let now = new Date(guardStartedAtIso)
const guardStorage = memoryStorage()
const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage: guardStorage.api as unknown as Storage,
  now: () => new Date(now),
})
const leaseResult = await guard.acquire({
  mode: 'model_billing_sku_qualification',
  ownerId: qualificationOwnerId,
  requestedLeaseTtlMs: 60 * 60 * 1_000,
})
assert.ok(leaseResult.status === 'acquired')
now = new Date(guardFinishedAtIso)
const guardRelease = await guard.release(leaseResult.lease)

const auditObservation = await fixtureAuditObservation()
const auditStorage = memoryStorage()
const auditRepository =
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: auditStorage.api as unknown as Storage,
  })
const auditReceipt = await auditRepository.persistCreateOnly(auditObservation)
const auditReceiptRef =
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef(
    auditReceipt,
  )
const registry = routeRegistry()
const registryRef = visualIntelligenceCanonicalProviderRouteRegistryRef(
  registry,
)
const contexts = new Map([
  [key(standardRef), standard],
  [key(longRef), long],
])
const authorityRepository = memoryAuthorityRepository()
const finalizer = createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer({
  contextEvidenceReadPort: {
    async readExact(reference) {
      return contexts.get(key(reference)) ?? null
    },
  },
  providerGuardEvidenceReadPort: guard,
  auditObservationRepository: auditRepository,
  routeRegistryReadPort: {
    async readExact(reference) {
      return key(reference) === key(registryRef) ? registry : null
    },
  },
  isolationAuthorityRepository: authorityRepository,
})
const result = await finalizer.finalize(finalizationInput())

assert.deepEqual(
  parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult(
    result,
  ),
  result,
)
assert.equal(result.exactContextEvidenceReread, true)
assert.equal(result.exactProviderGuardReleaseReceiptReread, true)
assert.equal(result.exactCloudAuditObservationReread, true)
assert.equal(result.exactProviderRouteRegistryReread, true)
assert.equal(result.exactIsolationAuthorityCreateOnlyPersistedAndReread, true)
assert.equal(result.noOtherModelOrSkuTrafficVerified, true)
assert.equal(result.providerCallMadeByFinalizer, false)
assert.equal(result.cloudAuditQueriedByFinalizer, false)
assert.equal(result.providerDispatchAuthorityGranted, false)
assert.equal(result.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(result.walletOrCreditMutationAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)

const authority = authorityRepository.current()
assert.deepEqual(
  parseVisualIntelligenceProviderTrafficIsolationAuthority(authority),
  authority,
)
assert.deepEqual(
  result.isolationAuthorityRef,
  visualIntelligenceProviderTrafficIsolationAuthorityRef(authority),
)
assert.equal(authority.qualificationWindowStartedAtIso, guardStartedAtIso)
assert.equal(authority.qualificationWindowFinishedAtIso, guardFinishedAtIso)
assert.deepEqual(authority.exactOrderedProviderRequestRefs, requestRefs)
assert.deepEqual(authority.providerGuardLeaseRef, guardRelease.leaseRef)
assert.deepEqual(authority.providerGuardReleaseReceiptRef,
  guardRelease.releaseReceiptRef)
assert.equal(authority.observedProviderRequestCount, 4)
assert.equal(authority.guardHeldForWholeQualificationWindow, true)
assert.equal(
  authority.allCanonicalVisualIntelligenceProviderRoutesRequireGuard,
  true,
)
assert.equal(
  authority.nonCanonicalDirectProviderRouteAllowedByServiceAccount,
  false,
)
assert.equal(authority.exactCloudAuditWindowReread, true)
assert.equal(authority.sameSkuConcurrentTrafficObserved, false)
assert.equal(authority.noOtherModelOrSkuTrafficInObservationWindow, true)
assert.equal(authority.callerAuthoredIsolationClaimAccepted, false)

const tamperedResult = structuredClone(result)
tamperedResult.noOtherModelOrSkuTrafficVerified = false as true
assert.throws(() =>
  parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult(
    tamperedResult,
  ))

await assert.rejects(() => finalizer.finalize({
  ...finalizationInput(),
  qualificationOwnerId: 'wrong-owner',
}), /lineage is inconsistent/u)

await assert.rejects(() => createFinalizer({
  contextRead: async () => null,
}).finalize(finalizationInput()), /evidence is missing/u)

const missingRegistryRef = ref('missing-registry')
await assert.rejects(() => finalizer.finalize({
  ...finalizationInput(),
  canonicalProviderRouteRegistryRef: missingRegistryRef,
}), /evidence is missing/u)

const mismatchedRepository = memoryAuthorityRepository(ref('wrong-authority'))
await assert.rejects(() => createFinalizer({
  authorityRepository: mismatchedRepository,
}).finalize(finalizationInput()), /persistence was not reconciled/u)

await assert.rejects(() => finalizer.finalize({
  ...finalizationInput(),
  providerGuardReleaseReceiptRef: ref('fabricated-release'),
}), /evidence is missing/u)

await assert.rejects(() => finalizer.finalize({
  ...finalizationInput(),
  cloudAuditWindowObservationPublicationReceiptRef:
    ref('wrong-audit-receipt'),
}), /lineage is inconsistent/u)

assert.throws(() =>
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer({
    contextEvidenceReadPort: null as never,
    providerGuardEvidenceReadPort: guard,
    auditObservationRepository: auditRepository,
    routeRegistryReadPort: { async readExact() { return registry } },
    isolationAuthorityRepository: authorityRepository,
  }), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-provider-traffic-isolation-authority-finalizer',
  checks: 41,
  status: 'passed',
  exactGuardedProviderCalls: 4,
  projectWideCloudAuditReread: true,
  createOnlyAuthorityPersistence: true,
  providerCallMadeByFinalizer: false,
  productionReady: false,
}))

function finalizationInput() {
  return {
    authorityId: 'vi-provider-isolation-authority-20260808',
    authorityVersion: 1,
    qualificationOwnerId,
    standardContextEvidenceRef: standardRef,
    longContextEvidenceRef: longRef,
    providerGuardReleaseReceiptRef: guardRelease.releaseReceiptRef,
    cloudAuditWindowObservationPublicationReceipt: auditReceipt,
    cloudAuditWindowObservationPublicationReceiptRef: auditReceiptRef,
    canonicalProviderRouteRegistryRef: registryRef,
  }
}

function createFinalizer(options?: {
  contextRead?: () => Promise<null>
  authorityRepository?: ReturnType<typeof memoryAuthorityRepository>
}) {
  return createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer({
    contextEvidenceReadPort: {
      async readExact(reference) {
        if (options?.contextRead) return options.contextRead()
        return contexts.get(key(reference)) ?? null
      },
    },
    providerGuardEvidenceReadPort: guard,
    auditObservationRepository: auditRepository,
    routeRegistryReadPort: {
      async readExact(reference) {
        return key(reference) === key(registryRef) ? registry : null
      },
    },
    isolationAuthorityRepository:
      options?.authorityRepository ?? memoryAuthorityRepository(),
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

function contextEvidence(input: {
  prefix: string
  contextClass: 'standard_le_200k' | 'long_gt_200k'
  startedAtIso: string
  finishedAtIso: string
  promptTokenCount: number
  cachedTokenCount: number
}) {
  return createVisualIntelligenceModelBillingContextEvidence({
    schemaVersion: 'visual-intelligence-model-billing-context-evidence-v1',
    evidenceId: `${input.prefix}-model-billing-context-evidence`,
    evidenceVersion: 1,
    evidenceClass:
      'live_guarded_implicit_cache_warmup_and_measured_request_pair',
    contextClass: input.contextClass,
    exactModelId: 'gemini-3.1-pro-preview',
    providerId: 'google_vertex_ai',
    providerAdapterId: 'vertex_gemini_pro',
    vertexLocation: 'global',
    throughputClass: 'standard',
    requestSetRef: ref(`${input.prefix}-request-set`),
    providerUsageSetRef: ref(`${input.prefix}-usage-set`),
    warmupProviderRequestRef: ref(`${input.prefix}-warmup-request`),
    measuredProviderRequestRef: ref(`${input.prefix}-measured-request`),
    warmupProviderUsageRef: ref(`${input.prefix}-warmup-usage`),
    measuredProviderUsageRef: ref(`${input.prefix}-measured-usage`),
    warmupProviderResponseRef: ref(`${input.prefix}-warmup-response`),
    measuredProviderResponseRef: ref(`${input.prefix}-measured-response`),
    qualificationWindowStartedAtIso: input.startedAtIso,
    qualificationWindowFinishedAtIso: input.finishedAtIso,
    warmupPromptTokenCount: input.promptTokenCount,
    warmupCachedTokenCount: 0,
    warmupCandidateTokenCount: 12,
    warmupThinkingTokenCount: 3,
    measuredPromptTokenCount: input.promptTokenCount,
    measuredCachedTokenCount: input.cachedTokenCount,
    measuredUncachedPromptTokenCount:
      input.promptTokenCount - input.cachedTokenCount,
    measuredCandidateTokenCount: 12,
    measuredThinkingTokenCount: 3,
    implicitCachingUsed: true,
    explicitCacheCreated: false,
    contextCacheStorageBillingExpected: false,
    liveProviderRequestCount: 2,
    exactReturnedModelIdVerifiedForEveryRequest: true,
    exactProviderUsageMetadataReread: true,
    requestBodiesServerOwned: true,
    rawProviderPayloadPersisted: false,
    providerToolsUsed: false,
    groundingUsed: false,
    urlContextUsed: false,
    codeExecutionUsed: false,
    automaticRetryAllowed: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

async function fixtureAuditObservation() {
  const configuration =
    createVisualIntelligenceProviderAuditWindowReaderConfiguration({
      schemaVersion:
        'visual-intelligence-provider-audit-window-reader-configuration-v1',
      projectId: 'reeditpro',
      expectedProviderPrincipalEmail:
        'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com',
      timeoutMs: 15_000,
    })
  const auth = {
    async request() { return { data: exactAuditResponse() } },
  } as unknown as Pick<GoogleAuth, 'request'>
  return createVisualIntelligenceProviderAuditWindowReadPort({
    configuration,
    auth,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  }).readExact({
    observationId: 'vi-provider-isolation-audit-window',
    observationVersion: 1,
    qualificationWindowStartedAtIso: guardStartedAtIso,
    qualificationWindowFinishedAtIso: guardFinishedAtIso,
    exactOrderedProviderRequestRefs: requestRefs,
  })
}

function exactAuditResponse() {
  const principal =
    'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com'
  const model = 'projects/reeditpro/locations/global/publishers/google/models/'
    + 'gemini-3.1-pro-preview'
  return {
    entries: requestRefs.map((requestRef, index) => ({
      insertId: `audit-${index + 1}`,
      timestamp: `2026-08-08T10:0${index + 1}:00.000Z`,
      logName:
        'projects/reeditpro/logs/cloudaudit.googleapis.com%2Fdata_access',
      resource: {
        type: 'audited_resource',
        labels: {
          project_id: 'reeditpro',
          service: 'aiplatform.googleapis.com',
          method:
            'google.cloud.aiplatform.v1.PredictionService.GenerateContent',
        },
      },
      protoPayload: {
        '@type': 'type.googleapis.com/google.cloud.audit.AuditLog',
        serviceName: 'aiplatform.googleapis.com',
        methodName:
          'google.cloud.aiplatform.v1.PredictionService.GenerateContent',
        resourceName: model,
        authenticationInfo: { principalEmail: principal },
        request: {
          model,
          labels: visualIntelligenceProviderAuditCorrelationLabels(requestRef),
        },
        response: {
          responseId: `provider-response-${index + 1}`,
          modelVersion: 'gemini-3.1-pro-preview',
        },
        status: {},
      },
    })),
  }
}

function memoryAuthorityRepository(
  overrideRef?: ReturnType<typeof ref>,
) {
  let current: VisualIntelligenceProviderTrafficIsolationAuthority | null = null
  const repository: VisualIntelligenceProviderTrafficIsolationAuthorityRepository
    & { current(): VisualIntelligenceProviderTrafficIsolationAuthority } = {
      async persistCreateOnly(authority) {
        current = parseVisualIntelligenceProviderTrafficIsolationAuthority(
          authority,
        )
        return {
          authorityRef: overrideRef
            ?? visualIntelligenceProviderTrafficIsolationAuthorityRef(current),
          persistenceReceiptRef: ref('isolation-persistence-receipt'),
          createOnlyPersisted: true,
          exactRereadVerified: true,
        }
      },
      async readExact(reference) {
        return current && key(reference)
          === key(visualIntelligenceProviderTrafficIsolationAuthorityRef(
            current,
          )) ? current : null
      },
      current() {
        assert.ok(current)
        return current
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
  let nextGeneration = 1
  const requireObject = (name: string) => {
    const stored = objects.get(name)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
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
                if (saveOptions.preconditionOpts.ifGenerationMatch !== 0) {
                  throw new Error('Expected create-only persistence.')
                }
                if (objects.has(name)) {
                  throw Object.assign(new Error('Exists.'), { code: 412 })
                }
                const generation = String(nextGeneration++)
                objects.set(name, {
                  body: Buffer.from(body),
                  generation,
                  etag: `etag-${generation}`,
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
                const stored = requireObject(name)
                if (options?.generation
                  && options.generation !== stored.generation) {
                  throw Object.assign(new Error('Not found.'), { code: 404 })
                }
                return [Buffer.from(stored.body)]
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
    },
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function key(reference: ReturnType<typeof ref>) {
  return `${reference.id}:${reference.version}:${reference.contentHash}`
}
