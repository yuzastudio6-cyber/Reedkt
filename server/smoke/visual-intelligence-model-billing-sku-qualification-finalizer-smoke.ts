import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceDetailedBillingExportObservationRepository,
  visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-observation-repository'
import {
  createVisualIntelligenceDetailedBillingExportReadPort,
  createVisualIntelligenceDetailedBillingExportReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-read-port'
import {
  createControlledVisualIntelligenceProviderTrafficIsolationAuthority,
  createVisualIntelligenceModelBillingContextEvidence,
  createVisualIntelligenceModelBillingSkuQualificationFinalizer,
  parseVisualIntelligenceModelBillingContextEvidence,
  parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult,
  parseVisualIntelligenceProviderTrafficIsolationAuthority,
  visualIntelligenceModelBillingContextEvidenceRef,
  visualIntelligenceProviderTrafficIsolationAuthorityRef,
  type VisualIntelligenceModelBillingSkuQualificationRepository,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  parseVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const isolationStartedAtIso = '2026-08-08T10:00:00.000Z'
const isolationFinishedAtIso = '2026-08-08T10:10:00.000Z'
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
assert.deepEqual(parseVisualIntelligenceModelBillingContextEvidence(standard),
  standard)
assert.deepEqual(parseVisualIntelligenceModelBillingContextEvidence(long),
  long)
const standardRef = visualIntelligenceModelBillingContextEvidenceRef(standard)
const longRef = visualIntelligenceModelBillingContextEvidenceRef(long)
const orderedProviderRequestRefs = [
  standard.warmupProviderRequestRef,
  standard.measuredProviderRequestRef,
  long.warmupProviderRequestRef,
  long.measuredProviderRequestRef,
]
const isolation = isolationAuthority({
  suffix: 'accepted',
  standardRef,
  longRef,
  orderedProviderRequestRefs,
})
assert.deepEqual(
  parseVisualIntelligenceProviderTrafficIsolationAuthority(isolation),
  isolation,
)
const isolationRef =
  visualIntelligenceProviderTrafficIsolationAuthorityRef(isolation)

const observation = await fixtureObservation()
const storage = createMemoryStorage()
const billingRepository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: storage as unknown as Storage,
  })
const billingReceipt = await billingRepository.persistCreateOnly(observation)
const billingReceiptRef =
  visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef(
    billingReceipt,
  )

const contextByRef = new Map([
  [key(standardRef), standard],
  [key(longRef), long],
])
const qualificationRepository = memoryQualificationRepository()
const finalizer = createVisualIntelligenceModelBillingSkuQualificationFinalizer({
  contextEvidenceReadPort: {
    async readExact(reference) {
      return contextByRef.get(key(reference)) ?? null
    },
  },
  billingObservationRepository: billingRepository,
  isolationAuthorityReadPort: {
    async readExact(reference) {
      return key(reference) === key(isolationRef) ? isolation : null
    },
  },
  qualificationRepository,
})
const result = await finalizer.finalize({
  qualificationId: 'gemini-3-1-pro-model-billing-sku-live-qualification',
  qualificationVersion: 1,
  standardContextEvidenceRef: standardRef,
  longContextEvidenceRef: longRef,
  billingObservationPublicationReceipt: billingReceipt,
  billingObservationPublicationReceiptRef: billingReceiptRef,
  providerTrafficIsolationAuthorityRef: isolationRef,
})
assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult(
    result,
  ),
  result,
)
assert.equal(result.exactContextEvidenceReread, true)
assert.equal(result.exactBillingObservationReread, true)
assert.equal(result.exactIsolationAuthorityReread, true)
assert.equal(result.exactQualificationCreateOnlyPersistedAndReread, true)
assert.equal(result.noOtherModelOrSkuTrafficVerified, true)
assert.equal(result.providerCallMadeByFinalizer, false)
assert.equal(result.billingExportQueriedByFinalizer, false)
assert.equal(result.providerDispatchAuthorityGranted, false)
assert.equal(result.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(result.walletOrCreditMutationAuthorityGranted, false)
assert.equal(result.runtimeReleaseAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)
const persistedQualification = qualificationRepository.current()
assert.ok(persistedQualification)
assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuQualification(persistedQualification),
  persistedQualification,
)
assert.deepEqual(result.qualificationRef,
  visualIntelligenceModelBillingSkuQualificationRef(persistedQualification))
assert.equal(
  persistedQualification.noOtherModelOrSkuTrafficInObservationWindow,
  true,
)
assert.deepEqual(persistedQualification.exactSkuIds,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map((term) =>
    term.skuId))
assert.deepEqual(persistedQualification.standardContextProviderRequestRef,
  standard.requestSetRef)
assert.deepEqual(persistedQualification.longContextProviderRequestRef,
  long.requestSetRef)

const tamperedResult = structuredClone(result)
tamperedResult.providerDispatchAuthorityGranted = true as false
assert.throws(() =>
  parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult(
    tamperedResult,
  ))

const tamperedContext = structuredClone(standard)
tamperedContext.measuredCachedTokenCount += 1
assert.throws(() =>
  parseVisualIntelligenceModelBillingContextEvidence(tamperedContext))

assert.throws(() => contextEvidence({
  prefix: 'invalid-standard',
  contextClass: 'standard_le_200k',
  startedAtIso: '2026-08-08T10:01:00.000Z',
  finishedAtIso: '2026-08-08T10:04:00.000Z',
  promptTokenCount: 210_001,
  cachedTokenCount: 200_001,
}))

const crossedIsolation = isolationAuthority({
  suffix: 'crossed',
  standardRef,
  longRef,
  orderedProviderRequestRefs: [
    long.warmupProviderRequestRef,
    long.measuredProviderRequestRef,
    standard.warmupProviderRequestRef,
    standard.measuredProviderRequestRef,
  ],
})
const crossedIsolationRef =
  visualIntelligenceProviderTrafficIsolationAuthorityRef(crossedIsolation)
await assert.rejects(() =>
  createVisualIntelligenceModelBillingSkuQualificationFinalizer({
    contextEvidenceReadPort: {
      async readExact(reference) {
        return contextByRef.get(key(reference)) ?? null
      },
    },
    billingObservationRepository: billingRepository,
    isolationAuthorityReadPort: {
      async readExact(reference) {
        return key(reference) === key(crossedIsolationRef)
          ? crossedIsolation
          : null
      },
    },
    qualificationRepository: memoryQualificationRepository(),
  }).finalize({
    qualificationId: 'crossed-isolation-qualification',
    qualificationVersion: 1,
    standardContextEvidenceRef: standardRef,
    longContextEvidenceRef: longRef,
    billingObservationPublicationReceipt: billingReceipt,
    billingObservationPublicationReceiptRef: billingReceiptRef,
    providerTrafficIsolationAuthorityRef: crossedIsolationRef,
  }), /lineage is inconsistent/u)

await assert.rejects(() =>
  createVisualIntelligenceModelBillingSkuQualificationFinalizer({
    contextEvidenceReadPort: { async readExact() { return null } },
    billingObservationRepository: billingRepository,
    isolationAuthorityReadPort: {
      async readExact() { return isolation }
    },
    qualificationRepository: memoryQualificationRepository(),
  }).finalize({
    qualificationId: 'missing-context-qualification',
    qualificationVersion: 1,
    standardContextEvidenceRef: standardRef,
    longContextEvidenceRef: longRef,
    billingObservationPublicationReceipt: billingReceipt,
    billingObservationPublicationReceiptRef: billingReceiptRef,
    providerTrafficIsolationAuthorityRef: isolationRef,
  }), /evidence is missing/u)

const mismatchedPersistence = memoryQualificationRepository({
  qualificationRef: ref('wrong-qualification-ref'),
})
await assert.rejects(() =>
  createVisualIntelligenceModelBillingSkuQualificationFinalizer({
    contextEvidenceReadPort: {
      async readExact(reference) {
        return contextByRef.get(key(reference)) ?? null
      },
    },
    billingObservationRepository: billingRepository,
    isolationAuthorityReadPort: {
      async readExact() { return isolation }
    },
    qualificationRepository: mismatchedPersistence,
  }).finalize({
    qualificationId: 'mismatched-persistence-qualification',
    qualificationVersion: 1,
    standardContextEvidenceRef: standardRef,
    longContextEvidenceRef: longRef,
    billingObservationPublicationReceipt: billingReceipt,
    billingObservationPublicationReceiptRef: billingReceiptRef,
    providerTrafficIsolationAuthorityRef: isolationRef,
  }), /persistence was not reconciled/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-qualification-finalizer',
  checks: 36,
  status: 'passed',
  exactGuardedProviderCallsRequired: 4,
  implicitCacheRequestPairsRequired: 2,
  detailedBillingSkuClassesRequired: 6,
  providerCallMadeByFinalizer: false,
  productionReady: false,
}))

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

function isolationAuthority(input: {
  suffix: string
  standardRef: ReturnType<
    typeof visualIntelligenceModelBillingContextEvidenceRef
  >
  longRef: ReturnType<
    typeof visualIntelligenceModelBillingContextEvidenceRef
  >
  orderedProviderRequestRefs: ReturnType<typeof ref>[]
}) {
  return createControlledVisualIntelligenceProviderTrafficIsolationAuthority({
    schemaVersion:
      'visual-intelligence-provider-traffic-isolation-authority-v1',
    authorityId: `visual-intelligence-traffic-isolation-${input.suffix}`,
    authorityVersion: 1,
    evidenceClass:
      'exclusive_provider_guard_plus_exact_cloud_audit_window_reread',
    projectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    exactModelId: 'gemini-3.1-pro-preview',
    vertexLocation: 'global',
    throughputClass: 'standard',
    qualificationWindowStartedAtIso: isolationStartedAtIso,
    qualificationWindowFinishedAtIso: isolationFinishedAtIso,
    standardContextEvidenceRef: input.standardRef,
    longContextEvidenceRef: input.longRef,
    exactOrderedProviderRequestRefs: input.orderedProviderRequestRefs,
    providerGuardLeaseRef: ref(`guard-lease-${input.suffix}`),
    providerGuardReleaseReceiptRef:
      ref(`guard-release-${input.suffix}`),
    cloudAuditWindowObservationRef: ref(`audit-window-${input.suffix}`),
    canonicalProviderRouteRegistryRef: ref(`route-registry-${input.suffix}`),
    observedProviderRequestCount: 4,
    guardHeldForWholeQualificationWindow: true,
    allCanonicalVisualIntelligenceProviderRoutesRequireGuard: true,
    nonCanonicalDirectProviderRouteAllowedByServiceAccount: false,
    exactCloudAuditWindowReread: true,
    sameSkuConcurrentTrafficObserved: false,
    noOtherModelOrSkuTrafficInObservationWindow: true,
    callerAuthoredIsolationClaimAccepted: false,
    providerCallMadeByAuthorityReader: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

async function fixtureObservation() {
  const configuration =
    createVisualIntelligenceDetailedBillingExportReaderConfiguration({
      schemaVersion:
        'visual-intelligence-detailed-billing-export-reader-configuration-v1',
      queryProjectId: 'reeditpro-billing-query',
      billingExportDatasetId: 'billing_export_private',
      billingExportTableId:
        'gcp_billing_export_resource_v1_012345_ABCDEF_987654',
      billedProjectId: 'reeditpro',
      providerServiceId: 'services/C7E2-9256-1C43',
      maximumBytesBilled: '10000000',
      timeoutMs: 15_000,
    })
  const auth = {
    async request() { return { data: exactBillingResponse() } },
  } as unknown as Pick<GoogleAuth, 'request'>
  return createVisualIntelligenceDetailedBillingExportReadPort({
    configuration,
    auth,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  }).readExact({
    observationId: 'vi-billing-finalizer-observation',
    observationVersion: 1,
    qualificationWindowStartedAtIso: isolationStartedAtIso,
    qualificationWindowFinishedAtIso: isolationFinishedAtIso,
  })
}

function exactBillingResponse() {
  const fields = [
    'sku_id', 'sku_description', 'usage_amount', 'usage_unit', 'cost',
    'currency', 'row_count', 'max_export_time',
  ]
  return {
    jobComplete: true,
    totalRows: '6',
    schema: { fields: fields.map((name) => ({ name })) },
    rows: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
      (term, index) => ({
        f: [
          term.skuId, term.expectedDisplayName, String(index + 1), 'count',
          `${index + 1}.00`, 'USD', '1', '2026-08-08T11:00:00.000Z',
        ].map((v) => ({ v })),
      }),
    ),
    errors: [],
  }
}

function memoryQualificationRepository(overrides?: {
  qualificationRef?: ReturnType<typeof ref>
}) {
  let current: ReturnType<
    typeof parseVisualIntelligenceModelBillingSkuQualification
  > | null = null
  const repository: VisualIntelligenceModelBillingSkuQualificationRepository & {
    current(): NonNullable<typeof current>
  } = {
    async persistCreateOnly(qualification) {
      current = parseVisualIntelligenceModelBillingSkuQualification(
        qualification,
      )
      return {
        qualificationRef: overrides?.qualificationRef
          ?? visualIntelligenceModelBillingSkuQualificationRef(current),
        persistenceReceiptRef: ref('qualification-persistence-receipt'),
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },
    async readExact(reference) {
      return current && key(reference)
        === key(visualIntelligenceModelBillingSkuQualificationRef(current))
        ? current
        : null
    },
    current() {
      assert.ok(current)
      return current
    },
  }
  return repository
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function key(reference: ReturnType<typeof ref>) {
  return `${reference.id}:${reference.version}:${reference.contentHash}`
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function createMemoryStorage() {
  const objects = new Map<string, StoredObject>()
  const requireObject = (objectName: string): StoredObject => {
    const stored = objects.get(objectName)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    bucket() {
      return {
        file: (objectName: string) => ({
          save: async (body: Buffer, options: {
            contentType: string
            preconditionOpts: { ifGenerationMatch: number }
          }) => {
            if (options.preconditionOpts.ifGenerationMatch !== 0) {
              throw new Error('Expected create-only persistence.')
            }
            if (objects.has(objectName)) {
              throw Object.assign(new Error('Already exists.'), { code: 412 })
            }
            objects.set(objectName, {
              body: Buffer.from(body),
              generation: '1',
              etag: 'etag-finalizer-observation-1',
              contentType: options.contentType,
            })
          },
          getMetadata: async () => {
            const stored = requireObject(objectName)
            return [{
              generation: stored.generation,
              etag: stored.etag,
              contentType: stored.contentType,
              size: String(stored.body.byteLength),
            }]
          },
          download: async () => [Buffer.from(requireObject(objectName).body)],
        }),
      }
    },
  }
}
