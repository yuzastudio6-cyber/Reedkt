import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceDetailedBillingExportObservationRepository,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-observation-repository'
import {
  createVisualIntelligenceDetailedBillingExportReadPort,
  createVisualIntelligenceDetailedBillingExportReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-read-port'
import {
  createVisualIntelligenceModelBillingSkuQualificationFinalizer,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
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
  createVisualIntelligenceModelBillingSkuQualificationRepository,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-repository'
import {
  createVisualIntelligenceModelBillingSkuReconciliationService,
  parseVisualIntelligenceModelBillingSkuReconciliationResult,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-reconciliation-service'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'
import {
  createVisualIntelligenceProviderAuditWindowObservationRepository,
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
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer,
  createControlledVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'
import {
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-repository'

let now = new Date('2026-08-08T10:00:00.000Z')
const memory = memoryStorage()
const storage = memory.api as unknown as Storage
const liveStore = createVisualIntelligenceModelBillingSkuLiveGcsStore({
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
await liveStore.persistRouteRegistryCreateOnly(registry)
await liveStore.persistAdmissionCreateOnly(admission)

const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage,
  now: () => new Date(now),
})
let controlledProviderCalls = 0
const executor = createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: liveStore.admissionReadPort,
  providerTrafficGuardPort: guard,
  generatePort: generatePort(() => { controlledProviderCalls += 1 }),
  contextEvidenceRepository: liveStore.contextEvidenceRepository,
  resultRepository: liveStore.resultRepository,
  attemptStore: liveStore.attemptStore,
  routeRegistryReadPort: liveStore.routeRegistryReadPort,
  now: () => new Date(now),
})
const liveResult = await executor.execute({ admissionRef })
const liveResultRef = visualIntelligenceModelBillingSkuLiveResultRef(
  liveResult,
)
const guardRelease = await guard.readExactReleaseReceipt(
  liveResult.providerGuardReleaseReceiptRef,
)
assert.ok(guardRelease)

const auditReadPort = createVisualIntelligenceProviderAuditWindowReadPort({
  configuration: createVisualIntelligenceProviderAuditWindowReaderConfiguration({
    schemaVersion:
      'visual-intelligence-provider-audit-window-reader-configuration-v1',
    projectId: 'reeditpro',
    expectedProviderPrincipalEmail:
      'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com',
    timeoutMs: 15_000,
  }),
  auth: {
    async request() {
      return { data: exactAuditResponse(liveResult.exactOrderedProviderRequestRefs) }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  now: () => new Date('2026-08-08T12:00:00.000Z'),
})
const auditRepository =
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage,
  })
const isolationRepository =
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage,
  })
const isolationFinalizer =
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer({
    contextEvidenceReadPort: liveStore.contextEvidenceRepository,
    providerGuardEvidenceReadPort: guard,
    auditObservationRepository: auditRepository,
    routeRegistryReadPort: liveStore.routeRegistryReadPort,
    isolationAuthorityRepository: isolationRepository,
  })

const billingConfiguration =
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
const billingReadPort = billingPort(false)
const billingRepository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage,
  })
const qualificationRepository =
  createVisualIntelligenceModelBillingSkuQualificationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage,
  })
const qualificationFinalizer =
  createVisualIntelligenceModelBillingSkuQualificationFinalizer({
    contextEvidenceReadPort: liveStore.contextEvidenceRepository,
    billingObservationRepository: billingRepository,
    isolationAuthorityReadPort: isolationRepository,
    qualificationRepository,
  })
const service = createVisualIntelligenceModelBillingSkuReconciliationService({
  admissionReadPort: liveStore.admissionReadPort,
  liveResultRepository: liveStore.resultRepository,
  providerGuardEvidenceReadPort: guard,
  providerAuditReadPort: auditReadPort,
  providerAuditObservationRepository: auditRepository,
  isolationFinalizer,
  billingExportReadPort: billingReadPort,
  billingObservationRepository: billingRepository,
  qualificationFinalizer,
})
const result = await service.reconcile({
  admissionRef,
  liveExecutionResultRef: liveResultRef,
})

assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuReconciliationResult(result),
  result,
)
assert.equal(result.actualProviderSpendUsdMicros, 21_000)
assert.equal(result.admittedMaximumProviderSpendUsdMicros, 10_000_000)
assert.equal(result.actualProviderSpendWithinAdmission, true)
assert.equal(result.exactLiveExecutionResultReread, true)
assert.equal(result.exactAdmissionReread, true)
assert.equal(result.exactGuardReleaseReread, true)
assert.equal(result.projectWideCloudAuditQueriedAndPersisted, true)
assert.equal(result.providerTrafficIsolationFinalizedAndReread, true)
assert.equal(result.detailedBillingExportQueriedAndPersisted, true)
assert.equal(result.modelBillingSkuQualificationFinalizedAndReread, true)
assert.equal(result.rawProviderPayloadPersisted, false)
assert.equal(result.automaticProviderRetryAllowed, false)
assert.equal(result.providerCallMadeByReconciliationService, false)
assert.equal(result.providerDispatchAuthorityGranted, false)
assert.equal(result.customerCreditOrWalletMutationAuthorityGranted, false)
assert.equal(result.captionEvidenceAuthorityGranted, false)
assert.equal(result.runtimeReleaseAuthorityGranted, false)
assert.equal(result.productionReleaseAuthorityGranted, false)
assert.equal(controlledProviderCalls, 4)
assert.ok(await qualificationRepository.readExact(
  result.modelBillingSkuQualificationRef,
))
assert.ok(await isolationRepository.readExact(
  result.providerTrafficIsolationAuthorityRef,
))

const tampered = structuredClone(result)
tampered.actualProviderSpendUsdMicros += 1
assert.throws(() =>
  parseVisualIntelligenceModelBillingSkuReconciliationResult(tampered),
  /invalid|inconsistent/u)

const overCapService =
  createVisualIntelligenceModelBillingSkuReconciliationService({
    admissionReadPort: liveStore.admissionReadPort,
    liveResultRepository: liveStore.resultRepository,
    providerGuardEvidenceReadPort: guard,
    providerAuditReadPort: auditReadPort,
    providerAuditObservationRepository: auditRepository,
    isolationFinalizer,
    billingExportReadPort: billingPort(true),
    billingObservationRepository:
      createVisualIntelligenceDetailedBillingExportObservationRepository({
        projectId: 'reeditpro',
        bucketName: 'reeditpro-control-plane-over-cap',
        storage: memoryStorage().api as unknown as Storage,
      }),
    qualificationFinalizer,
  })
await assert.rejects(() => overCapService.reconcile({
  admissionRef,
  liveExecutionResultRef: liveResultRef,
}), /exceeded admitted internal spend/u)
assert.equal(controlledProviderCalls, 4)

await assert.rejects(() => service.reconcile({
  admissionRef,
  liveExecutionResultRef: ref('missing-live-result'),
}), /source evidence is missing/u)

assert.throws(() =>
  createVisualIntelligenceModelBillingSkuReconciliationService({
    admissionReadPort: null as never,
    liveResultRepository: liveStore.resultRepository,
    providerGuardEvidenceReadPort: guard,
    providerAuditReadPort: auditReadPort,
    providerAuditObservationRepository: auditRepository,
    isolationFinalizer,
    billingExportReadPort: billingReadPort,
    billingObservationRepository: billingRepository,
    qualificationFinalizer,
  }), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-reconciliation-service',
  checks: 38,
  status: 'passed',
  controlledExecutorProviderCalls: controlledProviderCalls,
  actualLiveProviderCalls: false,
  cloudAuditReadStageComposed: true,
  detailedBillingReadStageComposed: true,
  internalSpendCeilingEnforced: true,
  finalQualificationDurable: true,
  automaticProviderRetries: 0,
  customerCreditsMutated: false,
  productionReady: false,
}))

function billingPort(overCap: boolean) {
  return createVisualIntelligenceDetailedBillingExportReadPort({
    configuration: billingConfiguration,
    auth: {
      async request() {
        return { data: exactBillingResponse(overCap) }
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  })
}

function generatePort(
  called: () => void,
): VisualIntelligenceModelBillingSkuQualificationGeneratePort {
  let ordinal = 0
  return {
    async generate() {
      called()
      ordinal += 1
      now = new Date(now.getTime() + 60_000)
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
        candidateTokenCount: 2,
        thinkingTokenCount: 1,
        cachedTokenCount,
        totalTokenCount: promptTokenCount + 3,
      }
    },
  }
}

function liveAdmission(
  registryRef: ReturnType<
    typeof visualIntelligenceCanonicalProviderRouteRegistryRef
  >,
) {
  return createVisualIntelligenceModelBillingSkuLiveAdmission({
    schemaVersion: 'visual-intelligence-model-billing-sku-live-admission-v1',
    admissionId: 'vi-reconciliation-admission',
    admissionVersion: 1,
    qualificationId: 'vi-reconciliation-qualification',
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

function exactAuditResponse(
  refs: readonly ReturnType<typeof ref>[],
) {
  const principal =
    'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com'
  const model = 'projects/reeditpro/locations/global/publishers/google/models/'
    + 'gemini-3.1-pro-preview'
  return {
    entries: refs.map((requestRef, index) => ({
      insertId: `audit-${index + 1}`,
      timestamp: `2026-08-08T10:0${index}:30.000Z`,
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

function exactBillingResponse(overCap: boolean) {
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
          term.skuId,
          term.expectedDisplayName,
          String(index + 1),
          'count',
          overCap ? '2.00' : `0.00${index + 1}`,
          'USD',
          '1',
          '2026-08-08T11:00:00.000Z',
        ].map((value) => ({ v: value })),
      }),
    ),
    errors: [],
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
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}
