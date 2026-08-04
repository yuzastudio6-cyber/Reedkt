import { Storage } from '@google-cloud/storage'

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
  createCanonicalSourceAnalysisOrchestraCoordinator,
  type CanonicalSourceAnalysisOrchestraCoordinator,
  type CanonicalSourceAnalysisPlanningScopeReadPort,
} from '../orchestra/canonical-source-analysis-orchestra-coordinator'
import {
  createGoogleBatchA100JobInvocationPort,
} from '../services/canonical-a100-batch-job-invocation-service'
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
  createCanonicalSourceAnalysisL4VisualEvidenceRepository,
  type CanonicalSourceAnalysisL4VisualEvidenceRepository,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
  type CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
} from '../services/canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
  createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort,
} from '../services/canonical-source-analysis-l4-visual-evidence-admission-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
  createGoogleCloudRunL4VisualEvidenceExecutionPort,
  type CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
  type CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner,
  createGoogleCloudRunL4VisualEvidenceTerminalObservationPort,
  type CanonicalSourceAnalysisL4VisualEvidenceTerminalObservationPort,
  type CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-terminal-reconciliation-owner'
import {
  createCanonicalSourceAnalysisOrchestraWorkOwner,
  type CanonicalSourceAnalysisOrchestraAuthorityReadPort,
} from '../services/canonical-source-analysis-orchestra-work-owner'
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
  createCanonicalSourceLedContentAnalysisReasoner,
  createGpt56TerraSourceContentReasoningPort,
  createKimiK3SourceContentReasoningPort,
} from '../services/canonical-source-led-content-analysis-reasoner'
import {
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  createCanonicalSourceLedOrchestraPlanningReconciliationPort,
  type CanonicalSourceLedOrchestraPlanningReconciliationPort,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import {
  createCanonicalSourceTranscriptOrchestraRepository,
  type CanonicalSourceTranscriptOrchestraRepository,
} from '../services/canonical-source-transcript-orchestra-repository'
import {
  createCanonicalSourceTranscriptA100AttemptOwner,
  type CanonicalSourceTranscriptA100AttemptOwner,
  type CanonicalSourceTranscriptA100ReleaseReadPort,
  type CanonicalSourceTranscriptA100UsageCostReadPort,
  type CanonicalSourceTranscriptA100WorkerResultReadPort,
  type CanonicalSourceTranscriptAdmissionReadPort,
} from '../services/canonical-source-transcript-a100-attempt-owner'
import {
  createCanonicalSourceVisualIntelligenceOrchestraBindingStore,
  createCanonicalSourceVisualIntelligenceOrchestraConsumerBindingPort,
  createCanonicalSourceVisualIntelligenceOrchestraReadPort,
  type CanonicalSourceVisualIntelligenceOrchestraBindingStore,
  type CanonicalSourceVisualIntelligenceOrchestraReadPort,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
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
  createVisualIntelligenceCanonicalPreparedEvidenceStore,
  type VisualIntelligenceCanonicalPreparedEvidenceStore,
} from './visual-intelligence-canonical-prepared-evidence-store'
import {
  createVisualIntelligenceGcsConcurrencyPort,
} from './visual-intelligence-gcs-concurrency-port'
import {
  createVisualIntelligenceDurableLifecycleStore,
  type VisualIntelligenceDurableLifecycleStore,
} from './visual-intelligence-gcs-lifecycle-store'
import {
  createVisualIntelligenceLifecycleService,
  type VisualIntelligenceConcurrencyPort,
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
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createGoogleCloudAccountEffectiveGpuRateReadPort,
  createWeEditProGoogleCloudGpuRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-gpu-rate-read-port'

export const VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION =
  'visual-intelligence-production-runtime-v14' as const

export interface VisualIntelligenceProductionRuntime {
  readonly schemaVersion: typeof VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION
  readonly runtimeRelease: VisualIntelligenceRuntimeRelease
  readonly reportRepository: VisualIntelligenceDurableLifecycleStore
  readonly canonicalRequestPackageStore:
    VisualIntelligenceCanonicalRequestPackageStore
  readonly canonicalPreparedEvidenceStore:
    VisualIntelligenceCanonicalPreparedEvidenceStore
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
  readonly sourceAnalysisL4VisualEvidenceRepository:
    CanonicalSourceAnalysisL4VisualEvidenceRepository
  readonly sourceAnalysisL4VisualEvidenceAuthorityRepository:
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
  readonly sourceAnalysisL4VisualEvidenceWorkerBootstrapOwner:
    CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner
  readonly sourceAnalysisL4VisualEvidenceWorkerEvidenceOwner:
    CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner
  readonly sourceAnalysisL4VisualEvidenceToolArtifactOwner:
    CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner
  readonly sourceAnalysisL4VisualEvidenceToolchainQualificationOwner:
    CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner
  readonly sourceAnalysisL4VisualEvidenceTerminalReconciliationOwner:
    CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner
  readonly sourceTranscriptOrchestraRepository:
    CanonicalSourceTranscriptOrchestraRepository
  readonly sourceLedOrchestraPlanningReconciliationPort:
    CanonicalSourceLedOrchestraPlanningReconciliationPort
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
  readonly createSourceAnalysisL4VisualEvidenceAttemptOwner:
    () => CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner
  readonly createSourceAnalysisL4VisualEvidenceAdmissionOwner:
    (input: {
      readonly finalizedAuthorityReadPort:
        CanonicalSourceAnalysisFinalizedAuthorityReadPort
    }) => CanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner
  readonly createSourceTranscriptA100AttemptOwner: (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly admissionReadPort: CanonicalSourceTranscriptAdmissionReadPort
    readonly releaseReadPort: CanonicalSourceTranscriptA100ReleaseReadPort
    readonly workerResultReadPort:
      CanonicalSourceTranscriptA100WorkerResultReadPort
    readonly usageCostReadPort:
      CanonicalSourceTranscriptA100UsageCostReadPort
  }) => CanonicalSourceTranscriptA100AttemptOwner
  readonly createSourceAnalysisPreparationOwner: (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
  }) => CanonicalSourceAnalysisPreparationOwner
  readonly createSourceAnalysisOrchestraCoordinator: (input: {
    readonly planningScopeReadPort:
      CanonicalSourceAnalysisPlanningScopeReadPort
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly probeAdmissionReadPort:
      CanonicalSourceAnalysisL4ProbeAdmissionReadPort
    readonly probeRuntimeReleaseReadPort:
      CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
    readonly probeCloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
    readonly probeWorkerResultReadPort:
      CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
    readonly probeUsageCostReadPort:
      CanonicalSourceAnalysisL4ProbeUsageCostReadPort
    readonly transcriptAdmissionReadPort:
      CanonicalSourceTranscriptAdmissionReadPort
    readonly transcriptReleaseReadPort:
      CanonicalSourceTranscriptA100ReleaseReadPort
    readonly transcriptWorkerResultReadPort:
      CanonicalSourceTranscriptA100WorkerResultReadPort
    readonly transcriptUsageCostReadPort:
      CanonicalSourceTranscriptA100UsageCostReadPort
    readonly orchestraAuthorityReadPort:
      CanonicalSourceAnalysisOrchestraAuthorityReadPort
  }) => CanonicalSourceAnalysisOrchestraCoordinator
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
  readonly sourceAnalysisL4VisualEvidenceCurrentRateReadPort?:
    CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort
  readonly sourceAnalysisL4VisualEvidenceTerminalObservationPort?:
    CanonicalSourceAnalysisL4VisualEvidenceTerminalObservationPort
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
  const sourceAnalysisL4VisualEvidenceCurrentRateReadPort =
    dependencies.sourceAnalysisL4VisualEvidenceCurrentRateReadPort
    ?? createProductionL4VisualEvidenceCurrentRateReadPort({
      billingAccountResourceName:
        coordinates.billingAccountResourceName,
      ...(dependencies.now ? { now: dependencies.now } : {}),
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
  const sourceAnalysisL4VisualEvidenceRepository =
    createCanonicalSourceAnalysisL4VisualEvidenceRepository({ objectPort })
  const sourceAnalysisL4VisualEvidenceAuthorityRepository =
    createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
      objectPort,
    })
  const sourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort({
      objectPort,
    })
  const sourceAnalysisL4VisualEvidenceToolchainQualificationOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner({
      objectPort,
    })
  const sourceAnalysisL4VisualEvidenceWorkerBootstrapOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner({
      envelopeReadPort:
        sourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
      authorityRepository:
        sourceAnalysisL4VisualEvidenceAuthorityRepository,
      toolchainQualificationReadPort:
        sourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
    })
  const sourceAnalysisL4VisualEvidenceWorkerEvidenceOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner({
      objectPort,
    })
  const sourceAnalysisL4VisualEvidenceToolArtifactOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner({
      objectPort,
    })
  const sourceAnalysisL4VisualEvidenceTerminalReconciliationOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner({
      workerEnvelopeReadPort:
        sourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
      authorityRepository:
        sourceAnalysisL4VisualEvidenceAuthorityRepository,
      workerEvidenceOwner:
        sourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
      terminalObservationPort:
        dependencies.sourceAnalysisL4VisualEvidenceTerminalObservationPort
        ?? createGoogleCloudRunL4VisualEvidenceTerminalObservationPort(),
      currentRateReadPort:
        sourceAnalysisL4VisualEvidenceCurrentRateReadPort,
      objectPort,
    })
  const sourceTranscriptOrchestraRepository =
    createCanonicalSourceTranscriptOrchestraRepository({ objectPort })
  const canonicalRequestPackageStore =
    createVisualIntelligenceCanonicalRequestPackageStore({
      objectPort,
      runtimeRelease,
    })
  const canonicalPreparedEvidenceStore =
    createVisualIntelligenceCanonicalPreparedEvidenceStore({
      objectPort,
      runtimeRelease,
    })
  const orchestraDispatchPackageStore =
    createVisualIntelligenceOrchestraDispatchPackageStore({
      objectPort,
      canonicalRequestPackageStore,
      preparedEvidenceReadPort: canonicalPreparedEvidenceStore,
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
  const sourceLedContentAnalysisReasoner =
    createCanonicalSourceLedContentAnalysisReasoner({
      kimi: createKimiK3SourceContentReasoningPort({ env }),
      terra: createGpt56TerraSourceContentReasoningPort({ env }),
    })
  const sourceLedOrchestraPlanningReconciliationPort =
    createCanonicalSourceLedOrchestraPlanningReconciliationPort({
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    reconciliationPort:
      createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort({
        transcriptReadPort: sourceTranscriptOrchestraRepository,
        visualIntelligenceReadPort: sourceVideoUnderstandingReadPort,
        reasoner: sourceLedContentAnalysisReasoner,
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
  const createSourceTranscriptA100AttemptOwnerFactory = (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly admissionReadPort: CanonicalSourceTranscriptAdmissionReadPort
    readonly releaseReadPort: CanonicalSourceTranscriptA100ReleaseReadPort
    readonly workerResultReadPort:
      CanonicalSourceTranscriptA100WorkerResultReadPort
    readonly usageCostReadPort:
      CanonicalSourceTranscriptA100UsageCostReadPort
  }) => createCanonicalSourceTranscriptA100AttemptOwner({
    ...input,
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    invocationPort: createGoogleBatchA100JobInvocationPort(),
    transcriptRepository: sourceTranscriptOrchestraRepository,
    lifecycleObjectPort: objectPort,
    ...(dependencies.now ? { now: dependencies.now } : {}),
  })
  const createSourceAnalysisL4VisualEvidenceAttemptOwnerFactory = () =>
    createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    admissionReadPort:
      sourceAnalysisL4VisualEvidenceAuthorityRepository.admissionReadPort,
    releaseReadPort:
      sourceAnalysisL4VisualEvidenceAuthorityRepository.releaseReadPort,
    toolchainQualificationReadPort:
      sourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
    executionPort: createGoogleCloudRunL4VisualEvidenceExecutionPort({
      operationAuthorityPort:
        sourceAnalysisL4VisualEvidenceAuthorityRepository
          .cloudRunOperationAuthorityPort,
    }),
    terminalReadPort:
      sourceAnalysisL4VisualEvidenceAuthorityRepository.terminalReadPort,
    evidenceRepository: sourceAnalysisL4VisualEvidenceRepository,
    lifecycleObjectPort: objectPort,
    ...(dependencies.now ? { now: dependencies.now } : {}),
  })
  const createSourceAnalysisL4VisualEvidenceAdmissionOwnerFactory = (input: {
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
  }) => createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner({
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
    probeAuthorityReadPort: sourceAnalysisProbeAuthorityRepository,
    currentRateReadPort:
      sourceAnalysisL4VisualEvidenceCurrentRateReadPort,
    authorityRepository:
      sourceAnalysisL4VisualEvidenceAuthorityRepository,
    toolchainQualificationReadPort:
      sourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
    runtimeReleaseRef: runtimeRelease.sourceEvidencePreparationReleaseRef,
    ...(dependencies.now ? { now: dependencies.now } : {}),
  })
  const createSourceAnalysisOrchestraCoordinatorFactory = (input: {
    readonly planningScopeReadPort:
      CanonicalSourceAnalysisPlanningScopeReadPort
    readonly finalizedAuthorityReadPort:
      CanonicalSourceAnalysisFinalizedAuthorityReadPort
    readonly probeAdmissionReadPort:
      CanonicalSourceAnalysisL4ProbeAdmissionReadPort
    readonly probeRuntimeReleaseReadPort:
      CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
    readonly probeCloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
    readonly probeWorkerResultReadPort:
      CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
    readonly probeUsageCostReadPort:
      CanonicalSourceAnalysisL4ProbeUsageCostReadPort
    readonly transcriptAdmissionReadPort:
      CanonicalSourceTranscriptAdmissionReadPort
    readonly transcriptReleaseReadPort:
      CanonicalSourceTranscriptA100ReleaseReadPort
    readonly transcriptWorkerResultReadPort:
      CanonicalSourceTranscriptA100WorkerResultReadPort
    readonly transcriptUsageCostReadPort:
      CanonicalSourceTranscriptA100UsageCostReadPort
    readonly orchestraAuthorityReadPort:
      CanonicalSourceAnalysisOrchestraAuthorityReadPort
  }) => createCanonicalSourceAnalysisOrchestraCoordinator({
    planningScopeReadPort: input.planningScopeReadPort,
    probeAttemptOwner: createSourceAnalysisL4ProbeAttemptOwnerFactory({
      finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
      admissionReadPort: input.probeAdmissionReadPort,
      runtimeReleaseReadPort: input.probeRuntimeReleaseReadPort,
      cloudRunPort: input.probeCloudRunPort,
      workerResultReadPort: input.probeWorkerResultReadPort,
      usageCostReadPort: input.probeUsageCostReadPort,
    }),
    preparationOwner: createSourceAnalysisPreparationOwnerFactory({
      finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
    }),
    l4VisualEvidenceAdmissionOwner:
      createSourceAnalysisL4VisualEvidenceAdmissionOwnerFactory({
        finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
      }),
    l4VisualEvidenceAttemptOwner:
      createSourceAnalysisL4VisualEvidenceAttemptOwnerFactory(),
    transcriptAttemptOwner: createSourceTranscriptA100AttemptOwnerFactory({
      finalizedAuthorityReadPort: input.finalizedAuthorityReadPort,
      admissionReadPort: input.transcriptAdmissionReadPort,
      releaseReadPort: input.transcriptReleaseReadPort,
      workerResultReadPort: input.transcriptWorkerResultReadPort,
      usageCostReadPort: input.transcriptUsageCostReadPort,
    }),
    requestAuthorityReadPort: sourceAnalysisRequestAuthorityRepository,
    transcriptReadPort: sourceTranscriptOrchestraRepository,
    l4VisualEvidenceReadPort: sourceAnalysisL4VisualEvidenceRepository,
    orchestraWorkReadPort: createCanonicalSourceAnalysisOrchestraWorkOwner({
      authorityReadPort: input.orchestraAuthorityReadPort,
      l4VisualEvidenceReadPort: sourceAnalysisL4VisualEvidenceRepository,
      l4VisualEvidenceToolArtifactReadPort:
        sourceAnalysisL4VisualEvidenceToolArtifactOwner,
      transcriptReadPort: sourceTranscriptOrchestraRepository,
      preparedEvidenceStore: canonicalPreparedEvidenceStore,
      dispatchPackageStore: orchestraDispatchPackageStore,
    }),
    orchestraRuntime: orchestraJobRuntimePort,
    planningReconciliationPort:
      sourceLedOrchestraPlanningReconciliationPort,
    cleanupAuthorityReadPort: sourceCleanupAuthorityRepository,
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
  return Object.freeze({
    schemaVersion: VISUAL_INTELLIGENCE_PRODUCTION_RUNTIME_VERSION,
    runtimeRelease,
    reportRepository: durableStore,
    canonicalRequestPackageStore,
    canonicalPreparedEvidenceStore,
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
    sourceAnalysisL4VisualEvidenceRepository,
    sourceAnalysisL4VisualEvidenceAuthorityRepository,
    sourceAnalysisL4VisualEvidenceWorkerBootstrapOwner,
    sourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
    sourceAnalysisL4VisualEvidenceToolArtifactOwner,
    sourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
    sourceAnalysisL4VisualEvidenceTerminalReconciliationOwner,
    sourceTranscriptOrchestraRepository,
    sourceLedOrchestraPlanningReconciliationPort,
    createSourceAnalysisL4ProbeAttemptOwner:
      createSourceAnalysisL4ProbeAttemptOwnerFactory,
    createSourceAnalysisL4VisualEvidenceAttemptOwner:
      createSourceAnalysisL4VisualEvidenceAttemptOwnerFactory,
    createSourceAnalysisL4VisualEvidenceAdmissionOwner:
      createSourceAnalysisL4VisualEvidenceAdmissionOwnerFactory,
    createSourceTranscriptA100AttemptOwner:
      createSourceTranscriptA100AttemptOwnerFactory,
    createSourceAnalysisPreparationOwner:
      createSourceAnalysisPreparationOwnerFactory,
    createSourceAnalysisOrchestraCoordinator:
      createSourceAnalysisOrchestraCoordinatorFactory,
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

function createProductionL4VisualEvidenceCurrentRateReadPort(input: {
  readonly billingAccountResourceName: string
  readonly now?: () => Date
}): CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort {
  const readPort = createGoogleCloudAccountEffectiveGpuRateReadPort({
    configuration: createWeEditProGoogleCloudGpuRateReaderConfiguration({
      billingAccountResourceName: input.billingAccountResourceName,
    }),
    ...(input.now ? { now: input.now } : {}),
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
    async rereadCurrentL4StandardRate(
      request: Parameters<
        CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort[
          'rereadCurrentL4StandardRate'
        ]
      >[0],
    ) {
      if (
        request.routeId !== 'l4_standard_primary'
        || request.region !== 'us-central1'
        || request.currency !== 'USD'
        || !Number.isFinite(Date.parse(request.at))
      ) throw notReady('source_visual_evidence_gpu_rate_request_invalid')
      return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
        rateAuthorityId:
          'weeditpro-current-l4-standard-account-effective-rate',
        rateAuthorityVersion: 1,
        routeId: request.routeId,
        region: request.region,
        readPort,
      })
    },
  })
}

function requireCoordinates(env: RuntimeEnv): {
  projectId: 'reeditpro'
  controlPlaneBucket: string
  billingAccountResourceName: string
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
    || !env.googleCloudBillingAccountResourceName
  ) throw notReady('visual_intelligence_production_runtime_not_authorized')
  return {
    projectId: env.googleCloudProjectId,
    controlPlaneBucket: env.gcsControlPlaneStateBucket,
    billingAccountResourceName: env.googleCloudBillingAccountResourceName,
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
