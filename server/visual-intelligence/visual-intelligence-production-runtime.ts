import { Storage } from '@google-cloud/storage'

import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import type { RuntimeEnv } from '../config/env'
import {
  createEditReferenceVisualIntelligenceConsumerBindingPort,
  createEditReferenceVisualIntelligenceBindingStore,
  createEditReferenceVisualIntelligenceOrchestraReadPort,
  type EditReferenceVisualIntelligenceBindingStore,
  type EditReferenceVisualIntelligenceOrchestraReadPort,
} from '../edit-references/edit-reference-visual-intelligence-result-bridge'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceAnalysisRequestAuthorityRepository,
  type CanonicalSourceAnalysisRequestAuthorityRepository,
} from '../services/canonical-source-analysis-request-authority-repository'
import {
  createCanonicalSourceAnalysisL4ProbeAttemptOwner,
  type CanonicalSourceAnalysisL4ProbeAdmissionReadPort,
  type CanonicalSourceAnalysisL4ProbeAttemptOwner,
  type CanonicalSourceAnalysisL4ProbeCloudRunPort,
  type CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort,
  type CanonicalSourceAnalysisL4ProbeUsageCostReadPort,
  type CanonicalSourceAnalysisL4ProbeWorkerResultReadPort,
} from '../services/canonical-source-analysis-l4-probe-attempt-owner'
import {
  createCanonicalSourceAnalysisPreparationOwner,
  type CanonicalSourceAnalysisFinalizedAuthorityReadPort,
  type CanonicalSourceAnalysisPreparationOwner,
} from '../services/canonical-source-analysis-preparation-owner'
import {
  createCanonicalSourceAnalysisProbeAuthorityRepository,
  type CanonicalSourceAnalysisProbeAuthorityRepository,
} from '../services/canonical-source-analysis-probe-authority-repository'
import {
  createCanonicalSourceCleanupAuthorityRepository,
  type CanonicalSourceCleanupAuthorityRepository,
} from '../services/canonical-source-cleanup-authority-repository'
import {
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  createCanonicalSourceLedOrchestraPlanningReconciliationPort,
  type CanonicalSourceLedOrchestraPlanningReconciliationPort,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisReasoner,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createCanonicalSourceTranscriptOrchestraRepository,
  type CanonicalSourceTranscriptOrchestraRepository,
} from '../services/canonical-source-transcript-orchestra-repository'
import {
  createCanonicalSourceVisualIntelligenceOrchestraBindingStore,
  createCanonicalSourceVisualIntelligenceOrchestraConsumerBindingPort,
  createCanonicalSourceVisualIntelligenceOrchestraReadPort,
  type CanonicalSourceVisualIntelligenceOrchestraBindingStore,
  type CanonicalSourceVisualIntelligenceOrchestraReadPort,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  createCanonicalPlanningVisualIntelligenceOperationOwner,
  type VisualIntelligencePlanningOperationRequestOwner,
} from '../services/canonical-planning-visual-intelligence-operation-owner-service'
import {
  createVisualIntelligenceAccountEffectiveCostOwner,
  createVisualIntelligenceGcsAccountEffectiveRateReadPort,
  type VisualIntelligenceAccountEffectiveCostOwner,
} from './visual-intelligence-account-effective-cost-owner'
import {
  createVisualIntelligenceCanonicalRequestPackageStore,
  type VisualIntelligenceCanonicalRequestPackageStore,
} from './visual-intelligence-canonical-request-package-store'
import {
  parseVisualIntelligenceRequest,
} from './visual-intelligence-contract'
import {
  createVisualIntelligenceGcsConcurrencyPort,
} from './visual-intelligence-gcs-concurrency-port'
import {
  createVisualIntelligenceDurableLifecycleStore,
  type VisualIntelligenceDurableLifecycleStore,
} from './visual-intelligence-gcs-lifecycle-store'
import {
  createVisualIntelligenceInspectionCoordinator,
  type VisualIntelligenceInspectionCoordinator,
} from './visual-intelligence-inspection-coordinator'
import {
  createVisualIntelligenceLifecycleService,
  type VisualIntelligenceAdmissionVerificationPort,
  type VisualIntelligenceConcurrencyPort,
  type VisualIntelligenceEvidencePreparationPort,
  type VisualIntelligenceLifecycleService,
} from './visual-intelligence-lifecycle-service'
import {
  createVisualIntelligenceOrchestraDispatchPackageStore,
  type VisualIntelligenceOrchestraDispatchPackageStore,
} from './visual-intelligence-orchestra-dispatch-package-store'
import {
  createVisualIntelligenceOrchestraJobResultStore,
  type VisualIntelligenceOrchestraJobResultStore,
} from './visual-intelligence-orchestra-job-result-store'
import {
  createVisualIntelligenceOrchestraJobRuntime,
  type VisualIntelligenceOrchestraConsumerBindingPort,
  type VisualIntelligenceOrchestraJobRuntime,
} from './visual-intelligence-orchestra-job-runtime'
import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
  type VisualIntelligencePrivateObjectReadPort,
} from './visual-intelligence-private-object-read-port'
import {
  readVisualIntelligenceRuntimeRelease,
  type VisualIntelligenceRuntimeRelease,
} from './visual-intelligence-runtime-release'
import {
  createVertexGeminiProVisualIntelligenceAdapter,
  type VisualIntelligenceGeminiGeneratePort,
} from './vertex-gemini-pro-visual-intelligence-adapter'

export const VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION =
  'visual-intelligence-production-runtime-v1' as const

export interface VisualIntelligenceProductionRuntime {
  readonly schemaVersion: typeof VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION
  readonly runtimeRelease: VisualIntelligenceRuntimeRelease
  readonly lifecyclePort: VisualIntelligenceLifecycleService
  readonly reportRepository: VisualIntelligenceDurableLifecycleStore
  readonly inspectionCoordinatorPort: VisualIntelligenceInspectionCoordinator
  readonly planningOperationRequestOwnerPort:
    VisualIntelligencePlanningOperationRequestOwner
  readonly canonicalRequestPackageStore:
    VisualIntelligenceCanonicalRequestPackageStore
  readonly orchestraDispatchPackageStore:
    VisualIntelligenceOrchestraDispatchPackageStore
  readonly orchestraJobResultStore:
    VisualIntelligenceOrchestraJobResultStore
  readonly editReferenceBindingStore:
    EditReferenceVisualIntelligenceBindingStore
  readonly editReferenceReadPort:
    EditReferenceVisualIntelligenceOrchestraReadPort
  readonly sourceVideoUnderstandingBindingStore:
    CanonicalSourceVisualIntelligenceOrchestraBindingStore
  readonly sourceVideoUnderstandingReadPort:
    CanonicalSourceVisualIntelligenceOrchestraReadPort
  readonly orchestraJobRuntimePort: VisualIntelligenceOrchestraJobRuntime
  readonly costOwner: VisualIntelligenceAccountEffectiveCostOwner
  readonly sourceCleanupAuthorityRepository:
    CanonicalSourceCleanupAuthorityRepository
  readonly sourceAnalysisRequestAuthorityRepository:
    CanonicalSourceAnalysisRequestAuthorityRepository
  readonly sourceAnalysisProbeAuthorityRepository:
    CanonicalSourceAnalysisProbeAuthorityRepository
  readonly sourceTranscriptOrchestraRepository:
    CanonicalSourceTranscriptOrchestraRepository
  readonly createSourceAnalysisL4ProbeAttemptOwner: (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly admissionReadPort:
      CanonicalSourceAnalysisL4ProbeAdmissionReadPort
    readonly runtimeReleaseReadPort:
      CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
    readonly cloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
    readonly workerResultReadPort:
      CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
    readonly usageCostReadPort:
      CanonicalSourceAnalysisL4ProbeUsageCostReadPort
  }) => CanonicalSourceAnalysisL4ProbeAttemptOwner
  readonly createSourceAnalysisPreparationOwner: (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
  }) => CanonicalSourceAnalysisPreparationOwner
  readonly createSourceLedOrchestraPlanningReconciliationPort: (
    input: {
      readonly reasoner:
        CanonicalSourceLedProfessionalContentAnalysisReasoner
    },
  ) => CanonicalSourceLedOrchestraPlanningReconciliationPort
  readonly providerCapabilityId: 'visual_intelligence'
  readonly semanticEngine: 'gemini-3.1-pro-preview'
  readonly thinkingLevel: 'high'
  readonly mediaResolution: 'high'
  readonly applicationDefaultCredentialsUsed: true
  readonly apiKeyUsed: false
  readonly qwenFallbackAllowed: false
  readonly selfHostedVisualModelFallbackAllowed: false
  readonly substantiveCpuMediaProcessingAllowed: false
}

export interface VisualIntelligenceProductionRuntimeDependencies {
  readonly storage?: Storage
  readonly privateObjectReadPort?: VisualIntelligencePrivateObjectReadPort
  readonly objectPort?: CanonicalCreateOnlyJsonObjectPort
  readonly concurrencyPort?: VisualIntelligenceConcurrencyPort
  readonly generatePort?: VisualIntelligenceGeminiGeneratePort
  readonly now?: () => Date
}

/**
 * Hosted composition root for the provider-neutral Visual Intelligence skill.
 * A disabled runtime returns no ports. An enabled runtime performs exact GCS
 * release and account-price rereads before it creates a provider adapter, so
 * an incomplete deployment cannot degrade into Qwen, CPU processing, an API
 * key, a cheaper model, or browser/caller-authored completion.
 */
export async function createVisualIntelligenceProductionRuntime(
  env: RuntimeEnv,
  dependencies: VisualIntelligenceProductionRuntimeDependencies = {},
): Promise<VisualIntelligenceProductionRuntime | undefined> {
  if (env.visualIntelligenceRuntimeMode === 'disabled') return undefined
  const coordinates = requireCoordinates(env)
  let storage = dependencies.storage
  const requireStorage = () => {
    storage ??= new Storage({ projectId: coordinates.projectId })
    return storage
  }
  const privateObjectReadPort = dependencies.privateObjectReadPort
    ?? createVisualIntelligenceGcsPrivateObjectReadPort({
      projectId: coordinates.projectId,
      storage: requireStorage(),
    })
  const runtimeRelease = await readVisualIntelligenceRuntimeRelease({
    projectId: coordinates.projectId,
    bucketName: coordinates.controlPlaneBucket,
    objectName: coordinates.release.objectName,
    generation: coordinates.release.generation,
    etag: coordinates.release.etag,
    contentSha256: coordinates.release.contentSha256,
    objectPort: privateObjectReadPort,
  })
  const objectPort = dependencies.objectPort
    ?? createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: requireStorage(),
      bucketName: coordinates.controlPlaneBucket,
    })
  const rateReadPort = createVisualIntelligenceGcsAccountEffectiveRateReadPort({
    bucketName: coordinates.controlPlaneBucket,
    objectName: coordinates.rate.objectName,
    generation: coordinates.rate.generation,
    etag: coordinates.rate.etag,
    contentSha256: coordinates.rate.contentSha256,
    objectPort: privateObjectReadPort,
  })
  const costOwner = createVisualIntelligenceAccountEffectiveCostOwner({
    rateAuthorityRef: runtimeRelease.accountEffectivePricingAuthorityRef,
    rateReadPort,
    objectPort,
    ...(dependencies.now ? { now: dependencies.now } : {}),
  })
  const startupCostProof = await costOwner.createPreflight({
    requestId: 'visual-intelligence-runtime-startup-price-proof',
    maximumInputTokenCount: 1,
    maximumOutputAndThinkingTokenCount: 1,
    estimatedInputTokenCount: 1,
    estimatedOutputAndThinkingTokenCount: 1,
  })
  if (
    startupCostProof.publicListPriceUsedAsSettlementAuthority
    || !startupCostProof.preflightPassed
  ) throw notReady('visual_intelligence_account_rate_startup_proof_failed')

  const durableStore = createVisualIntelligenceDurableLifecycleStore({
    objectPort,
  })
  const sourceCleanupAuthorityRepository =
    createCanonicalSourceCleanupAuthorityRepository({ objectPort })
  const sourceAnalysisRequestAuthorityRepository =
    createCanonicalSourceAnalysisRequestAuthorityRepository({ objectPort })
  const sourceAnalysisProbeAuthorityRepository =
    createCanonicalSourceAnalysisProbeAuthorityRepository({ objectPort })
  const sourceTranscriptOrchestraRepository =
    createCanonicalSourceTranscriptOrchestraRepository({ objectPort })
  const canonicalRequestPackageStore =
    createVisualIntelligenceCanonicalRequestPackageStore({
      objectPort,
      runtimeRelease,
    })
  const orchestraDispatchPackageStore =
    createVisualIntelligenceOrchestraDispatchPackageStore({
      objectPort,
      canonicalRequestPackageStore,
    })
  const orchestraJobResultStore =
    createVisualIntelligenceOrchestraJobResultStore({ objectPort })
  const editReferenceBindingStore =
    createEditReferenceVisualIntelligenceBindingStore({ objectPort })
  const editReferenceReadPort =
    createEditReferenceVisualIntelligenceOrchestraReadPort({
      bindingStore: editReferenceBindingStore,
      resultStore: orchestraJobResultStore,
      reportRepository: durableStore,
    })
  const editReferenceConsumerBindingPort =
    createEditReferenceVisualIntelligenceConsumerBindingPort({
      bindingStore: editReferenceBindingStore,
      now: dependencies.now,
    })
  const sourceVideoUnderstandingBindingStore =
    createCanonicalSourceVisualIntelligenceOrchestraBindingStore({
      objectPort,
    })
  const sourceVideoUnderstandingReadPort =
    createCanonicalSourceVisualIntelligenceOrchestraReadPort({
      bindingStore: sourceVideoUnderstandingBindingStore,
      resultStore: orchestraJobResultStore,
      reportRepository: durableStore,
    })
  const createSourceLedOrchestraPlanningReconciliationPort = (
    input: {
      readonly reasoner:
        CanonicalSourceLedProfessionalContentAnalysisReasoner
    },
  ) => createCanonicalSourceLedOrchestraPlanningReconciliationPort({
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    reconciliationPort:
      createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort({
        transcriptReadPort: sourceTranscriptOrchestraRepository,
        visualIntelligenceReadPort: sourceVideoUnderstandingReadPort,
        reasoner: input.reasoner,
        authorityRepository: sourceCleanupAuthorityRepository,
      }),
  })
  const createSourceAnalysisPreparationOwnerFactory = (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
  }) => createCanonicalSourceAnalysisPreparationOwner({
    finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
    probeAuthorityReadPort: sourceAnalysisProbeAuthorityRepository,
    requestAuthorityRepository: sourceAnalysisRequestAuthorityRepository,
  })
  const createSourceAnalysisL4ProbeAttemptOwnerFactory = (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly admissionReadPort:
      CanonicalSourceAnalysisL4ProbeAdmissionReadPort
    readonly runtimeReleaseReadPort:
      CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
    readonly cloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
    readonly workerResultReadPort:
      CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
    readonly usageCostReadPort:
      CanonicalSourceAnalysisL4ProbeUsageCostReadPort
  }) => createCanonicalSourceAnalysisL4ProbeAttemptOwner({
    ...input,
    probeAuthorityRepository: sourceAnalysisProbeAuthorityRepository,
    lifecycleObjectPort: objectPort,
    ...(dependencies.now ? { now: dependencies.now } : {}),
  })
  const sourceVideoUnderstandingConsumerBindingPort =
    createCanonicalSourceVisualIntelligenceOrchestraConsumerBindingPort({
      bindingStore: sourceVideoUnderstandingBindingStore,
      now: dependencies.now,
    })
  const orchestraConsumerBindingPort = createOrchestraConsumerBindingRouter({
    editReference: editReferenceConsumerBindingPort,
    sourceVideoUnderstanding: sourceVideoUnderstandingConsumerBindingPort,
  })
  const planningOwner =
    createCanonicalPlanningVisualIntelligenceOperationOwner({
      upstreamAdmissionVerificationPort: canonicalRequestPackageStore,
      upstreamEvidencePreparationPort: canonicalRequestPackageStore,
      costOwner,
      runtimeRelease,
      objectPort,
    })
  const ownerPorts = createOwnerRoutingPorts({
    canonicalRequestPackageStore,
    planningOwner,
  })
  const provider = createVertexGeminiProVisualIntelligenceAdapter({
    projectId: coordinates.projectId,
    location: runtimeRelease.vertexLocation,
    ...(dependencies.generatePort
      ? { generatePort: dependencies.generatePort }
      : {}),
    costSettlementPort: costOwner,
  })
  const concurrencyPort = dependencies.concurrencyPort
    ?? createVisualIntelligenceGcsConcurrencyPort({
      projectId: coordinates.projectId,
      bucketName: coordinates.controlPlaneBucket,
      storage: requireStorage(),
    })
  const lifecyclePort = createVisualIntelligenceLifecycleService({
    provider,
    admissionPort: ownerPorts.admission,
    evidencePreparationPort: ownerPorts.evidence,
    attemptStore: durableStore,
    reportRepository: durableStore,
    concurrencyPort,
  })
  const orchestraLifecyclePort = createVisualIntelligenceLifecycleService({
    provider,
    admissionPort: canonicalRequestPackageStore,
    evidencePreparationPort: canonicalRequestPackageStore,
    attemptStore: durableStore,
    reportRepository: durableStore,
    concurrencyPort,
  })
  const orchestraJobRuntimePort =
    createVisualIntelligenceOrchestraJobRuntime({
      dispatchPackageStore: orchestraDispatchPackageStore,
      lifecycle: orchestraLifecyclePort,
      resultStore: orchestraJobResultStore,
      consumerBindingPort: orchestraConsumerBindingPort,
    })
  const inspectionCoordinatorPort =
    createVisualIntelligenceInspectionCoordinator({
      requestOwner: canonicalRequestPackageStore,
      lifecycle: lifecyclePort,
    })
  return Object.freeze({
    schemaVersion: VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION,
    runtimeRelease,
    lifecyclePort,
    reportRepository: durableStore,
    inspectionCoordinatorPort,
    planningOperationRequestOwnerPort: planningOwner.requestOwner,
    canonicalRequestPackageStore,
    orchestraDispatchPackageStore,
    orchestraJobResultStore,
    editReferenceBindingStore,
    editReferenceReadPort,
    sourceVideoUnderstandingBindingStore,
    sourceVideoUnderstandingReadPort,
    orchestraJobRuntimePort,
    costOwner,
    sourceCleanupAuthorityRepository,
    sourceAnalysisRequestAuthorityRepository,
    sourceAnalysisProbeAuthorityRepository,
    sourceTranscriptOrchestraRepository,
    createSourceAnalysisL4ProbeAttemptOwner:
      createSourceAnalysisL4ProbeAttemptOwnerFactory,
    createSourceAnalysisPreparationOwner:
      createSourceAnalysisPreparationOwnerFactory,
    createSourceLedOrchestraPlanningReconciliationPort,
    providerCapabilityId: 'visual_intelligence',
    semanticEngine: 'gemini-3.1-pro-preview',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    applicationDefaultCredentialsUsed: true,
    apiKeyUsed: false,
    qwenFallbackAllowed: false,
    selfHostedVisualModelFallbackAllowed: false,
    substantiveCpuMediaProcessingAllowed: false,
  })
}

function createOrchestraConsumerBindingRouter(input: {
  readonly editReference: VisualIntelligenceOrchestraConsumerBindingPort
  readonly sourceVideoUnderstanding:
    VisualIntelligenceOrchestraConsumerBindingPort
}): VisualIntelligenceOrchestraConsumerBindingPort {
  return Object.freeze({
    async bindBeforeProviderExecution(
      value: Parameters<
        VisualIntelligenceOrchestraConsumerBindingPort[
          'bindBeforeProviderExecution'
        ]
      >[0],
    ) {
      if (value.compiled.jobType === 'reference_preference_analysis') {
        return input.editReference.bindBeforeProviderExecution(value)
      }
      if (value.compiled.jobType === 'source_video_understanding') {
        return input.sourceVideoUnderstanding.bindBeforeProviderExecution(
          value,
        )
      }
      if (
        value.consumerBindingRequest !== null
        && value.consumerBindingRequest !== undefined
      ) throw notReady('visual_intelligence_consumer_binding_job_invalid')
      return null
    },
  })
}

function createOwnerRoutingPorts(input: {
  canonicalRequestPackageStore:
    VisualIntelligenceCanonicalRequestPackageStore
  planningOwner: ReturnType<
    typeof createCanonicalPlanningVisualIntelligenceOperationOwner
  >
}): {
  admission: VisualIntelligenceAdmissionVerificationPort
  evidence: VisualIntelligenceEvidencePreparationPort
} {
  const route = (untrustedRequest: unknown) => {
    const request = parseVisualIntelligenceRequest(untrustedRequest)
    const canonicalPackageOwner = request.operation === 'inspect_edit'
      || request.profile === 'source_edit_planning'
      || request.profile === 'reference_preference_dna'
    return {
      request,
      admission: canonicalPackageOwner
        ? input.canonicalRequestPackageStore
        : input.planningOwner.admissionVerificationPort,
      evidence: canonicalPackageOwner
        ? input.canonicalRequestPackageStore
        : input.planningOwner.evidencePreparationPort,
    }
  }
  const admission: VisualIntelligenceAdmissionVerificationPort =
    Object.freeze({
      async verifyAndRereadExact(
        untrustedRequest: VisualIntelligenceRequest,
      ) {
        const selected = route(untrustedRequest)
        return selected.admission.verifyAndRereadExact(selected.request)
      },
    })
  const evidence: VisualIntelligenceEvidencePreparationPort = Object.freeze({
    async prepare({ request, admissionRef }: {
      readonly request: VisualIntelligenceRequest
      readonly admissionRef: VisualIntelligenceEvidenceRef
    }) {
      const selected = route(request)
      return selected.evidence.prepare({
        request: selected.request,
        admissionRef,
      })
    },
  })
  return Object.freeze({ admission, evidence })
}

function requireCoordinates(env: RuntimeEnv): {
  projectId: 'reeditpro'
  controlPlaneBucket: string
  release: ExactObjectCoordinate
  rate: ExactObjectCoordinate
} {
  if (
    env.visualIntelligenceRuntimeMode !== 'cloud_run'
    || env.mode !== 'cloud_run'
    || env.storageMode !== 'gcs'
    || env.googleCloudProjectId !== 'reeditpro'
    || !env.internalServiceToken
    || !env.gcsControlPlaneStateBucket
  ) throw notReady('visual_intelligence_production_runtime_not_authorized')
  return {
    projectId: env.googleCloudProjectId,
    controlPlaneBucket: env.gcsControlPlaneStateBucket,
    release: exactCoordinate({
      objectName: env.visualIntelligenceReleaseObjectName,
      generation: env.visualIntelligenceReleaseGeneration,
      etag: env.visualIntelligenceReleaseEtag,
      contentSha256: env.visualIntelligenceReleaseContentSha256,
    }),
    rate: exactCoordinate({
      objectName: env.visualIntelligenceRateObjectName,
      generation: env.visualIntelligenceRateGeneration,
      etag: env.visualIntelligenceRateEtag,
      contentSha256: env.visualIntelligenceRateContentSha256,
    }),
  }
}

interface ExactObjectCoordinate {
  objectName: string
  generation: string
  etag: string
  contentSha256: string
}

function exactCoordinate(input: {
  objectName?: string
  generation?: string
  etag?: string
  contentSha256?: string
}): ExactObjectCoordinate {
  if (
    !input.objectName
    || !input.generation
    || !input.etag
    || !input.contentSha256
  ) throw notReady('visual_intelligence_exact_coordinate_missing')
  return {
    objectName: input.objectName,
    generation: input.generation,
    etag: input.etag,
    contentSha256: input.contentSha256,
  }
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The hosted Visual Intelligence runtime is not ready.',
    503,
    { requiredGate },
  )
}
