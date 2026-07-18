import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Readable } from 'node:stream'
import { promisify } from 'node:util'
import { ApiError } from '../errors/api-error'
import {
  ensurePrivateDirectoryWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateStreamAtomicWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import type {
  JSONObject,
  ProfessionalSkillBackendIntent,
  ProfessionalSkillModelRoleTrace,
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from '../../src/types'
import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'
import {
  evaluateBetaLaunchStageGates,
  findBetaLaunchStageGate,
  type BetaLaunchGateEvidence,
} from '../beta-readiness'
import { createApprovedSnapshotService } from './approved-snapshot-service'
import { createProjectService } from './project-service'
import { createMockId, mockWarning, nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  createApprovedEditExecutionPackage,
  type ApprovedEditExecutionPackage,
} from '../edit-architecture/approved-edit-execution-package'
import {
  approvedToolWorkManifestRef,
  createApprovedToolOperationEvidence,
  requireApprovedCoreToolOperation,
  type ApprovedToolOperationEvidence,
  type ApprovedToolWorkManifest,
  type ApprovedToolWorkManifestRef,
} from '../edit-architecture/approved-tool-work-manifest'
import {
  createProfessionalToolAdapterBoundedExecutionRun,
  createProfessionalToolAdapterPrivateMediaRunnerRun,
  createProfessionalToolAdapterSourceTruthEvidenceReview,
  getProfessionalToolAdapterBinaryRunnerCommand,
  getProfessionalToolAdapterNodeRunnerPackage,
  getProfessionalToolAdapterPythonRunnerImport,
  runProfessionalToolAdapterRegisteredRunners,
  type ProfessionalToolAdapterBoundedExecutionRun,
  type ProfessionalToolAdapterModelWeightApprovalEvidence,
  type ProfessionalToolAdapterPackageReadinessEvidence,
  type ProfessionalToolAdapterPrivateMediaRunnerRun,
  type ProfessionalToolAdapterRegisteredRunnerRun,
  type ProfessionalToolAdapterSourceTruthEvidenceReview,
} from '../tool-registry'
import {
  getProductionWorkflowScenario,
  runProductionWorkflowScenario,
  type ProductionWorkflowReport,
  type ProductionWorkflowStage,
} from '../e2e/production-workflow'
import type { EditWorkItem, EditWorkItemStatus, EditWorkItemType, EditingAgentLayer } from '../../src/types/editing-agent-runtime'
import { collectWorkerGateChecks } from '../workers/worker-gates'
import type { WorkerJobRecord } from '../workers/worker-job-loader'
import type { WorkerGateCheckResult } from '../workers/worker-result'
import { createBasicPreview, createPrivateFinalRenderFromPreviewClips, probeMediaFile, type MediaProbeSummary } from '../media/ffmpeg-preview'
import { resolvePathInsideRoot } from '../workers/media/media-path-safety'
import { runCaptionExecution, type CaptionFileFormat } from '../workers/captions'
import type { TranscriptSegment, TranscriptWord } from '../workers/speech'
import { runAudioExecutionPipeline } from '../workers/audio-execution'
import type { AudioExecutionResult } from '../workers/audio'
import { createStorageAdapter, resolveBucketName } from '../storage/storage-adapter'
import type { StorageAdapter } from '../storage/storage-types'
import { runApprovedPrivatePlaywrightCapture } from '../workers/browser-capture/private-playwright-capture-runner'
import type { PrivatePlaywrightCaptureArtifact } from '../workers/browser-capture/private-playwright-capture-types'

const execFileAsync = promisify(execFile)

interface CreateApprovedEditExecutionPackageInput {
  workspaceId: string
  projectId?: string
  approvedPlanSnapshotId: string
  approvedSnapshot: Record<string, unknown>
  creditReservationId: string
  requestedAdapterToolNames?: string[]
  adapterCandidateScope?: 'approved_snapshot_plus_requested' | 'requested_only'
  packageReadyToolIds?: string[]
  modelWeightApprovedToolIds?: string[]
  idempotencyKey: string
  requestPath?: string
}

interface StoredApprovedEditExecutionPackage {
  requestHash: string
  approvedEditExecutionPackage: ApprovedEditExecutionPackage & {
    packageRecordId: string
    createdByUserId: string
    createdAt: string
    mockOnly: true
  }
}

interface ServerApprovedPlaywrightCaptureAuthorization {
  packageRecordId: string
  registryApprovedSnapshotId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  approvedByUserId: string
  approvedSnapshotSha256: string
  manifestFingerprintSha256: string
}

interface ApprovedEditExecutionReleaseEvidence extends BetaLaunchGateEvidence {
  privateInternalReady?: boolean
  publicDeliveryApproved?: boolean
  externalBetaReleaseApproved?: boolean
  productionReleaseApproved?: boolean
}

interface ApprovedEditExecutionReleaseReadiness {
  publicDeliveryReady: boolean
  externalBetaReady: boolean
  productionReady: boolean
  productionReadyAllowed: boolean
  blockers: string[]
}

function evaluateApprovedEditExecutionReleaseReadiness(
  evidence: ApprovedEditExecutionReleaseEvidence = {},
): ApprovedEditExecutionReleaseReadiness {
  const launchStageGates = evaluateBetaLaunchStageGates({
    e2eDryRunPassed: evidence.e2eDryRunPassed ?? true,
    safetyDocsExist: evidence.safetyDocsExist ?? true,
    costDocsExist: evidence.costDocsExist ?? true,
    approvedPlanSnapshotGatePresent: evidence.approvedPlanSnapshotGatePresent ?? true,
    creditEstimateGatePresent: evidence.creditEstimateGatePresent ?? true,
    creditReservationGatePresent: evidence.creditReservationGatePresent ?? true,
    idempotencyGatePresent: evidence.idempotencyGatePresent ?? true,
    rawPromptStorageBlocked: evidence.rawPromptStorageBlocked ?? true,
    secretScrubbingEnabled: evidence.secretScrubbingEnabled ?? true,
    signedUrlSourceTruthBlocked: evidence.signedUrlSourceTruthBlocked ?? true,
    licenseModelWeightReviewApproved: evidence.licenseModelWeightReviewApproved,
    productionReadinessBlocked: evidence.productionReadinessBlocked,
    deploymentApproved: evidence.deploymentApproved,
    securityApproved: evidence.securityApproved,
    storageApproved: evidence.storageApproved,
    modelLicensesApproved: evidence.modelLicensesApproved,
    privateMediaApproval: evidence.privateMediaApproval,
    artifactPrivacyEvidence: evidence.artifactPrivacyEvidence,
    productionDeploymentApproved: evidence.productionDeploymentApproved,
    billingLedgerPersistenceApproved: evidence.billingLedgerPersistenceApproved,
    costControlsApproved: evidence.costControlsApproved,
    incidentRunbookApproved: evidence.incidentRunbookApproved,
    observabilityApproved: evidence.observabilityApproved,
    legalApproval: evidence.legalApproval,
    checklist: evidence.checklist,
  })
  const externalBetaGate = findBetaLaunchStageGate(launchStageGates, 'external_beta')
  const paidProductionGate = findBetaLaunchStageGate(launchStageGates, 'paid_production')
  const privateInternalReady = evidence.privateInternalReady === true
  const publicDeliveryReady = privateInternalReady &&
    evidence.publicDeliveryApproved === true &&
    evidence.storageApproved === true &&
    evidence.artifactPrivacyEvidence === true
  const externalBetaReady = publicDeliveryReady &&
    evidence.externalBetaReleaseApproved === true &&
    externalBetaGate.allowed
  const productionReady = externalBetaReady &&
    evidence.productionReleaseApproved === true &&
    paidProductionGate.allowed

  return {
    publicDeliveryReady,
    externalBetaReady,
    productionReady,
    productionReadyAllowed: productionReady,
    blockers: [
      ...(privateInternalReady ? [] : ['Private internal QA/download evidence is not ready.']),
      ...(publicDeliveryReady ? [] : ['Public delivery approval, storage approval, and artifact privacy evidence are required.']),
      ...(externalBetaReady ? [] : externalBetaGate.blockers),
      ...(productionReady ? [] : paidProductionGate.blockers),
    ],
  }
}

interface ReviewApprovedEditExecutionBoundedAdapterSourceTruthInput {
  packageRecordId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  packageReadinessEvidence?: ProfessionalToolAdapterPackageReadinessEvidence[]
  modelWeightApprovals?: ProfessionalToolAdapterModelWeightApprovalEvidence[]
  privateArtifactRefs?: JSONObject[]
  idempotencyKey: string
  requestPath?: string
}

interface StoredApprovedEditExecutionBoundedAdapterSourceTruthReview {
  requestHash: string
  sourceTruthReview: ProfessionalToolAdapterSourceTruthEvidenceReview
  approvedEditExecutionPackage: StoredApprovedEditExecutionPackage['approvedEditExecutionPackage']
}

interface CreateApprovedEditExecutionBoundedAdapterExecutionRunInput {
  packageRecordId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  handoffOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface StoredApprovedEditExecutionBoundedAdapterExecutionRun {
  requestHash: string
  boundedAdapterExecutionRun: ProfessionalToolAdapterBoundedExecutionRun
}

interface RunApprovedEditExecutionRegisteredAdapterRunnersInput {
  boundedAdapterExecutionRunId: string
  workspaceId: string
  projectId: string
  importProbeOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface StoredApprovedEditExecutionRegisteredAdapterRunnerRun {
  requestHash: string
  registeredRunnerRun: ProfessionalToolAdapterRegisteredRunnerRun
}

interface RunApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerInput {
  registeredRunnerRunId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  privateMediaExecutionOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface StoredApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerRun {
  requestHash: string
  privateMediaRunnerRun: ProfessionalToolAdapterPrivateMediaRunnerRun
}

interface ReviewApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaInput {
  privateMediaRunnerRunId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  qaReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

type RegisteredAdapterBoundedPackageExecutionProof = {
  status: 'executed_bounded_node_package' | 'executed_bounded_python_package' | 'executed_bounded_binary_package' | 'not_applicable'
  runtime: 'node' | 'python' | 'binary' | 'none'
  packageName: string | null
  importName?: string | null
  runtimeBinary?: string | null
  operation: 'dynamic_import_api_shape_probe' | 'python_import_api_shape_probe' | 'binary_presence_probe' | 'none'
  actualToolPackageExecuted: boolean
  mediaProcessingExecuted: false
  productRuntimeExecuted: false
  frontendExecutionAllowed: false
  publicArtifact: false
  signedUrl: null
  exportSurfaceSample: string[]
  summary: string
}

interface RegisteredAdapterPrivateMediaRunnerQaArtifact {
  artifactId: string
  activityExecutionId: string
  canonicalToolId: string
  boundedPackageExecution: RegisteredAdapterBoundedPackageExecutionProof
  actualToolPackageExecuted: boolean
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact'
  sha256: string
  byteSize: number
  qaStatus: 'passed_private_runner_manifest_qa'
  finalRenderIntegrationEligible: false
  createdAt: string
}

interface RegisteredAdapterPrivateMediaRunnerQaReview {
  id: string
  privateMediaRunnerRunId: string
  registeredRunnerRunId: string
  boundedAdapterExecutionRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'private_adapter_result_qa_passed_waiting_final_render_integration' | 'blocked'
  qaReviewOnly: true
  reviewedActivityCount: number
  passedActivityCount: number
  blockedActivityCount: number
  artifactCount: number
  boundedNodePackageExecutionCount: number
  actualToolPackageExecutionCount: number
  mediaProcessingExecuted: false
  productRuntimeExecuted: false
  frontendExecutionAllowed: false
  productReady: false
  artifacts: RegisteredAdapterPrivateMediaRunnerQaArtifact[]
  blockers: string[]
  finalRenderIntegrationReadiness: {
    ready: false
    reason: string
    adapterQaArtifactCount: number
    nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render'
  }
  nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render'
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReview {
  requestHash: string
  privateMediaRunnerQaReview: RegisteredAdapterPrivateMediaRunnerQaReview
}

interface CreateApprovedEditExecutionAdapterWorkerArtifactIntegrationInput {
  privateMediaRunnerQaReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  integrationOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface AdapterWorkerArtifactIntegrationArtifact {
  artifactId: string
  sourceQaArtifactId: string
  activityExecutionId: string
  canonicalToolId: string
  boundedPackageExecution?: RegisteredAdapterBoundedPackageExecutionProof
  actualToolPackageExecuted?: boolean
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact'
  sha256: string
  byteSize: number
  qaStatus: 'passed_private_runner_manifest_qa'
  renderIntegrationStatus: 'attached_to_private_render_manifest'
  finalRenderIntegrationEligible: true
  mediaTransformOutputEligible: false
}

interface AdapterWorkerArtifactIntegrationManifestArtifact {
  artifactId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'adapter_worker_artifact_render_integration_manifest'
  sha256: string
  byteSize: number
  integratedArtifactCount: number
  previewAssemblyEligible: true
  finalRenderDecisionManifestEligible: true
}

interface ApprovedEditExecutionAdapterWorkerArtifactIntegration {
  id: string
  privateMediaRunnerQaReviewId: string
  privateMediaRunnerRunId: string
  registeredRunnerRunId: string
  boundedAdapterExecutionRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'adapter_worker_artifact_integration_passed_ready_for_render_preview'
  integrationOnly: true
  reviewedArtifactCount: number
  integratedArtifactCount: number
  blockedArtifactCount: 0
  mediaProcessingExecuted: false
  mediaTransformOutputCount: 0
  productRuntimeExecuted: false
  frontendExecutionAllowed: false
  productReady: false
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  renderPreviewIntegrationReady: true
  finalRenderDecisionManifestEligible: true
  mediaTransformOutputEligible: false
  artifacts: AdapterWorkerArtifactIntegrationArtifact[]
  integrationManifestArtifact: AdapterWorkerArtifactIntegrationManifestArtifact
  blockers: []
  nextRequiredGate: 'render_preview_assembly_with_private_adapter_integration'
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionAdapterWorkerArtifactIntegration {
  requestHash: string
  adapterWorkerArtifactIntegration: ApprovedEditExecutionAdapterWorkerArtifactIntegration
}

interface CreateApprovedEditExecutionJobBatchPlanInput {
  packageRecordId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  dryRunOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionMockQueueInput {
  jobBatchPlanId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  mockQueueOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionDispatchReadinessInput {
  mockQueueId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  dryRunOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionMockWorkerClaimsInput {
  dispatchReadinessId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  workerInstanceId?: string
  mockClaimsOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionHandlerDryRunInput {
  mockWorkerClaimsId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  handlerDryRunOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionResultReconciliationInput {
  handlerDryRunId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  reconcileDryRunOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionLocalWorkerOutputInput {
  resultReconciliationId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  localOutputOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionLocalWorkerOutputQaReviewInput {
  localWorkerOutputId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  qaReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionWorkflowRehearsalInput {
  localWorkerOutputId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  scenarioId?: string
  rehearsalOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface UploadedMediaSourceAssetInput {
  mediaAssetId: string
  sourceSequenceItemId?: string
  uploadedClipId?: string
  uploadedOrder: number
  storageProvider: 'local_mock' | 'local_private' | 'google_cloud_storage' | 'supabase_storage'
  storageBucket?: string
  storagePath: string
  fileName: string
  mimeType: string
  byteSize: number
  checksumSha256?: string
  privateArtifact: true
  publicUrl?: null
  signedUrl?: null
}

type LocalMediaProcessingMode = 'bounded_preview_render' | 'private_internal_review_render'

interface CreateApprovedEditExecutionUploadedMediaWorkerExecutionInput {
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  sourceMediaAssets: UploadedMediaSourceAssetInput[]
  uploadedMediaExecutionOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionPrivateWorkerArtifactQaReviewInput {
  uploadedMediaWorkerExecutionId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  qaReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionLocalMediaProcessingExecutionInput {
  privateWorkerArtifactQaReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  processingExecutionOnly: true
  processingMode?: LocalMediaProcessingMode
  maxDurationSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionPrivateMediaArtifactQaReviewInput {
  localMediaProcessingExecutionId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  qaReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionRenderPreviewAssemblyInput {
  privateMediaArtifactQaReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  assemblyOnly: true
  adapterWorkerArtifactIntegrationId?: string
  privateMediaRunnerQaReviewId?: string
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionUserPreviewReviewInput {
  renderPreviewAssemblyId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  reviewOnly: true
  reviewDecision: 'approved_for_final_render_readiness' | 'changes_requested'
  reviewerNote?: string
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionFinalRenderReadinessReviewInput {
  userPreviewReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  readinessReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionFinalRenderExecutionInput {
  finalRenderReadinessReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  renderExecutionOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionFinalDeliveryQaReviewInput {
  finalRenderExecutionId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  qaReviewOnly: true
  idempotencyKey: string
  requestPath?: string
}

interface CreateApprovedEditExecutionPrivateInternalDownloadDeliveryInput {
  finalDeliveryQaReviewId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  deliveryOnly: true
  idempotencyKey: string
  requestPath?: string
}

type PlannedWorkerJobStatus =
  | 'ready_to_queue'
  | 'waiting_dependency'
  | 'metadata_complete'
  | 'blocked'

interface PlannedWorkerJob {
  id: string
  packageRecordId: string
  jobBatchPlanId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  workItemId: string
  jobType: EditWorkItemType
  runtimeJobType: string
  workerType: string
  status: PlannedWorkerJobStatus
  idempotencyKey: string
  dependencyWorkItemIds: string[]
  expectedOutputIds: string[]
  linkedSegmentIds: string[]
  linkedRendererLayerIds: string[]
  qaChecks: string[]
  payloadJson: Record<string, unknown>
}

interface ApprovedEditExecutionJobBatchPlan {
  id: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'ready_for_mock_queue_review' | 'blocked_by_package_gates'
  dryRunOnly: true
  plannedJobs: PlannedWorkerJob[]
  plannedJobCount: number
  readyToQueueCount: number
  waitingDependencyCount: number
  blockedJobCount: number
  metadataCompleteCount: number
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionJobBatchPlan {
  requestHash: string
  jobBatchPlan: ApprovedEditExecutionJobBatchPlan
}

interface MockQueuedWorkerJob {
  id: string
  sourcePlannedJobId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  workItemId: string
  jobType: EditWorkItemType
  runtimeJobType: string
  workerType: string
  status: 'queued'
  idempotencyKey: string
  dependencyWorkItemIds: string[]
  expectedOutputIds: string[]
  qaChecks: string[]
  payloadJson: Record<string, unknown>
  createdAt: string
  mockOnly: true
}

interface ApprovedEditExecutionMockQueue {
  id: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'queued_for_mock_worker_review'
  mockQueueOnly: true
  queuedJobs: MockQueuedWorkerJob[]
  queuedJobCount: number
  waitingDependencyCount: number
  blockedJobCount: number
  metadataCompleteCount: number
  workersStarted: 0
  workerClaimsCreated: 0
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionMockQueue {
  requestHash: string
  mockQueue: ApprovedEditExecutionMockQueue
}

interface QueuedWorkerDispatchReadiness {
  queuedJobId: string
  workItemId: string
  jobType: EditWorkItemType
  runtimeJobType: string
  workerType: string
  idempotencyKey: string
  expectedOutputIds: string[]
  qaChecks: string[]
  status: 'ready_for_worker_claim' | 'blocked_by_gate'
  requiredGateCount: number
  passedRequiredGateCount: number
  failedRequiredGates: string[]
  gateChecks: WorkerGateCheckResult[]
}

interface ApprovedEditExecutionDispatchReadiness {
  id: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'ready_for_worker_claim_review' | 'blocked_by_worker_gates'
  dryRunOnly: true
  queuedJobCount: number
  readyForClaimCount: number
  blockedByGateCount: number
  workersStarted: 0
  workerClaimsCreated: 0
  readiness: QueuedWorkerDispatchReadiness[]
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionDispatchReadiness {
  requestHash: string
  dispatchReadiness: ApprovedEditExecutionDispatchReadiness
}

interface MockWorkerClaimLease {
  id: string
  dispatchReadinessId: string
  mockQueueId: string
  queuedJobId: string
  workItemId: string
  jobType: EditWorkItemType
  runtimeJobType: string
  workerType: string
  workerInstanceId: string
  claimStatus: 'claimed_mock_only'
  attemptNumber: 1
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  expectedOutputIds: string[]
  qaChecks: string[]
  leaseExpiresAt: string
  claimedAt: string
  createdAt: string
  mockOnly: true
}

interface ApprovedEditExecutionMockWorkerClaims {
  id: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'claimed_for_mock_worker_review'
  mockClaimsOnly: true
  claimCount: number
  readyForClaimCount: number
  blockedByGateCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  workerClaims: MockWorkerClaimLease[]
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionMockWorkerClaims {
  requestHash: string
  mockWorkerClaims: ApprovedEditExecutionMockWorkerClaims
}

interface HandlerDryRunArtifactRef {
  artifactId: string
  outputId: string
  workItemId: string
  storageProvider: 'local_mock'
  storageObjectPath: string
  privateArtifact: true
  sourceOfTruth: false
  qaStatus: 'not_checked'
}

interface HandlerDryRunWorkResult {
  id: string
  mockWorkerClaimsId: string
  workerClaimId: string
  queuedJobId: string
  workItemId: string
  runtimeJobType: string
  workerType: string
  status: 'dry_run_completed_mock_only'
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  billableToUser: false
  failureCategory: null
  expectedOutputIds: string[]
  resultArtifactRefs: HandlerDryRunArtifactRef[]
  qaChecks: string[]
  completedAt: string
  mockOnly: true
}

interface HandlerDryRunQAHandoffRecord {
  id: string
  workItemId: string
  workerClaimId: string
  qaStatus: 'qa_pending_after_dry_run'
  qaChecks: string[]
  blocksFinalRender: true
  reason: string
}

interface ApprovedEditExecutionHandlerDryRun {
  id: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'dry_run_completed_ready_for_result_reconciliation'
  handlerDryRunOnly: true
  claimCount: number
  workResultCount: number
  manifestUpdateCount: number
  qaHandoffCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaArtifactsCreated: 0
  liveExecutionReady: false
  finalExportReady: false
  workResults: HandlerDryRunWorkResult[]
  assetManifestUpdates: HandlerDryRunArtifactRef[]
  qaHandoffRecords: HandlerDryRunQAHandoffRecord[]
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionHandlerDryRun {
  requestHash: string
  handlerDryRun: ApprovedEditExecutionHandlerDryRun
}

interface ReconciledManifestItem {
  artifactId: string
  outputId: string
  workItemId: string
  storageProvider: 'local_mock'
  storageObjectPath: string
  privateArtifact: true
  sourceOfTruth: false
  mergeStatus: 'blocked_dry_run_placeholder'
  reconciliationDecision: 'await_real_worker_artifact'
  qaStatus: 'blocked_pending_real_artifact'
  finalRenderEligible: false
  reason: string
}

interface ReconciledQAGate {
  id: string
  workItemId: string
  workerClaimId: string
  qaStatus: 'blocked_pending_real_artifact'
  blocksFinalRender: true
  requiredBeforeFinalExport: true
  reason: string
}

interface ApprovedEditExecutionResultReconciliation {
  id: string
  handlerDryRunId: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'reconciled_dry_run_waiting_real_worker_outputs'
  reconcileDryRunOnly: true
  workResultCount: number
  manifestItemCount: number
  qaGateCount: number
  sourceOfTruthArtifactCount: 0
  finalRenderReady: false
  previewReviewReady: false
  liveExecutionReady: false
  reconciledManifestItems: ReconciledManifestItem[]
  reconciledQAGates: ReconciledQAGate[]
  finalRenderReadiness: {
    ready: false
    reason: string
    blockingWorkItemIds: string[]
    qaPendingArtifactIds: string[]
    dryRunArtifactIds: string[]
    sourceOfTruthArtifactCount: 0
  }
  nextRequiredGate: 'real_worker_handler_execution_with_private_artifact_persistence'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionResultReconciliation {
  requestHash: string
  resultReconciliation: ApprovedEditExecutionResultReconciliation
}

interface PersistedLocalWorkerArtifact {
  artifactId: string
  sourceArtifactId: string
  outputId: string
  workItemId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'local_worker_output_metadata_only'
  mediaArtifact: false
  sha256: string
  byteSize: number
  qaStatus: 'qa_pending_local_output_review'
  finalRenderEligible: false
  previewReviewEligible: true
  createdAt: string
}

interface LocalWorkerOutputQAHandoffRecord {
  id: string
  workItemId: string
  artifactId: string
  qaStatus: 'qa_pending_local_output_review'
  blocksFinalRender: true
  requiredBeforeFinalExport: true
  reason: string
}

interface ApprovedEditExecutionLocalWorkerOutput {
  id: string
  resultReconciliationId: string
  handlerDryRunId: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'local_worker_outputs_persisted_waiting_qa'
  localOutputOnly: true
  workResultCount: number
  persistedArtifactCount: number
  sourceOfTruthArtifactCount: number
  mediaArtifactCount: 0
  qaPendingCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: false
  finalRenderReady: false
  persistedArtifacts: PersistedLocalWorkerArtifact[]
  qaHandoffRecords: LocalWorkerOutputQAHandoffRecord[]
  finalRenderReadiness: {
    ready: false
    reason: string
    qaPendingArtifactIds: string[]
    sourceOfTruthArtifactCount: number
    mediaArtifactCount: 0
  }
  nextRequiredGate: 'local_worker_output_qa_review'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionLocalWorkerOutput {
  requestHash: string
  localWorkerOutput: ApprovedEditExecutionLocalWorkerOutput
}

interface LocalWorkerOutputQaCheck {
  check: 'private_metadata_record' | 'checksum_present' | 'no_signed_url' | 'no_public_artifact' | 'metadata_only_scope' | 'no_media_bytes_claim'
  passed: boolean
  message: string
}

interface LocalWorkerOutputQaReviewRecord {
  id: string
  artifactId: string
  workItemId: string
  qaStatus: 'passed_metadata_integrity_only' | 'blocked_metadata_integrity'
  metadataIntegrityPassed: boolean
  mediaQaRequired: true
  finalRenderEligible: false
  blocksFinalRender: true
  requiredBeforeFinalExport: true
  checks: LocalWorkerOutputQaCheck[]
  reason: string
}

interface ApprovedEditExecutionLocalWorkerOutputQaReview {
  id: string
  localWorkerOutputId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution' | 'local_worker_output_qa_blocked_metadata_integrity'
  qaReviewOnly: true
  reviewedArtifactCount: number
  passedArtifactCount: number
  blockedArtifactCount: number
  sourceOfTruthArtifactCount: number
  mediaArtifactCount: 0
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: boolean
  renderPreviewReady: false
  finalRenderReady: false
  qaResults: LocalWorkerOutputQaReviewRecord[]
  finalRenderReadiness: {
    ready: false
    reason: string
    metadataQaPassedArtifactIds: string[]
    mediaQaRequiredArtifactIds: string[]
    sourceOfTruthArtifactCount: number
    mediaArtifactCount: 0
  }
  nextRequiredGate: 'uploaded_media_worker_execution_with_private_artifact_outputs' | 'local_worker_output_metadata_integrity_fix'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionLocalWorkerOutputQaReview {
  requestHash: string
  localWorkerOutputQaReview: ApprovedEditExecutionLocalWorkerOutputQaReview
}

interface ApprovedEditExecutionWorkflowRehearsal {
  id: string
  localWorkerOutputId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'production_workflow_rehearsed_waiting_uploaded_media_worker_execution'
  rehearsalOnly: true
  workflowMode: 'dry_run'
  scenarioId: string
  stageCount: number
  completedStageCount: number
  blockedStageCount: number
  warningStageCount: number
  workflowStages: ProductionWorkflowStage[]
  artifactCount: number
  privateArtifactCount: number
  qaGateCount: number
  qaBlockedCount: number
  finalDeliveryAllowed: false
  productionReadyAllowed: boolean
  liveExecutionReady: false
  renderPreviewReady: false
  finalRenderReady: false
  localOutputQaStatus: 'pending' | 'passed_metadata_integrity_only'
  report: Pick<ProductionWorkflowReport, 'reportId' | 'scenarioId' | 'mode' | 'status' | 'artifactSummary' | 'qaSummary' | 'fallbackSummary' | 'readinessSummary' | 'blockers' | 'warnings' | 'nextActions'>
  nextRequiredGate: 'uploaded_media_worker_execution_with_private_artifact_outputs'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionWorkflowRehearsal {
  requestHash: string
  workflowRehearsal: ApprovedEditExecutionWorkflowRehearsal
}

interface UploadedMediaWorkerArtifactMetadata {
  artifactId: string
  sourceMediaAssetId: string
  sourceSequenceItemId?: string
  uploadedClipId?: string
  uploadedOrder: number
  outputId: string
  workItemId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'uploaded_media_worker_execution_metadata_only'
  mediaArtifact: false
  workerOutputArtifact: true
  sourceMediaBound: true
  sha256: string
  byteSize: number
  qaStatus: 'qa_pending_private_worker_artifact_review'
  finalRenderEligible: false
  previewReviewEligible: true
  createdAt: string
}

interface UploadedMediaWorkerArtifactQAHandoff {
  id: string
  artifactId: string
  sourceMediaAssetId: string
  workItemId: string
  qaStatus: 'qa_pending_private_worker_artifact_review'
  blocksFinalRender: true
  requiredBeforeFinalExport: true
  reason: string
}

interface ApprovedEditExecutionUploadedMediaWorkerExecution {
  id: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa'
  uploadedMediaExecutionOnly: true
  workerExecutionMode: 'metadata_only_no_media_processing'
  sourceMediaAssetCount: number
  privateWorkerArtifactCount: number
  sourceBoundArtifactCount: number
  mediaArtifactCount: 0
  qaPendingCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: false
  finalRenderReady: false
  sourceMediaAssets: UploadedMediaSourceAssetInput[]
  privateWorkerArtifacts: UploadedMediaWorkerArtifactMetadata[]
  qaHandoffRecords: UploadedMediaWorkerArtifactQAHandoff[]
  finalRenderReadiness: {
    ready: false
    reason: string
    qaPendingArtifactIds: string[]
    sourceMediaAssetCount: number
    privateWorkerArtifactCount: number
    mediaArtifactCount: 0
  }
  nextRequiredGate: 'private_worker_artifact_qa_review'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionUploadedMediaWorkerExecution {
  requestHash: string
  uploadedMediaWorkerExecution: ApprovedEditExecutionUploadedMediaWorkerExecution
}

interface PrivateWorkerArtifactQaCheck {
  check:
    | 'private_worker_output_metadata'
    | 'source_media_bound'
    | 'checksum_present'
    | 'no_signed_url'
    | 'no_public_artifact'
    | 'metadata_only_scope'
    | 'no_media_bytes_claim'
    | 'not_final_render_eligible'
  passed: boolean
  message: string
}

interface PrivateWorkerArtifactQaReviewRecord {
  id: string
  artifactId: string
  sourceMediaAssetId: string
  workItemId: string
  qaStatus: 'passed_private_worker_artifact_metadata_only' | 'blocked_private_worker_artifact_metadata'
  metadataIntegrityPassed: boolean
  sourceMediaBound: boolean
  mediaQaRequired: true
  finalRenderEligible: false
  blocksFinalRender: true
  requiredBeforeFinalExport: true
  checks: PrivateWorkerArtifactQaCheck[]
  reason: string
}

interface ApprovedEditExecutionPrivateWorkerArtifactQaReview {
  id: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'private_worker_artifact_qa_passed_waiting_real_media_processing' | 'private_worker_artifact_qa_blocked_metadata_integrity'
  qaReviewOnly: true
  reviewedArtifactCount: number
  passedArtifactCount: number
  blockedArtifactCount: number
  sourceBoundArtifactCount: number
  mediaArtifactCount: 0
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: boolean
  renderPreviewReady: false
  finalRenderReady: false
  qaResults: PrivateWorkerArtifactQaReviewRecord[]
  finalRenderReadiness: {
    ready: false
    reason: string
    metadataQaPassedArtifactIds: string[]
    mediaQaRequiredArtifactIds: string[]
    sourceBoundArtifactCount: number
    mediaArtifactCount: 0
  }
  nextRequiredGate: 'real_media_processing_worker_execution_with_private_media_artifacts' | 'private_worker_artifact_metadata_integrity_fix'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionPrivateWorkerArtifactQaReview {
  requestHash: string
  privateWorkerArtifactQaReview: ApprovedEditExecutionPrivateWorkerArtifactQaReview
}

interface ProcessedPrivateMediaArtifact {
  artifactId: string
  sourceArtifactId: string
  sourceMediaAssetId: string
  sourceChecksumSha256?: string
  sourceStorageProvider: UploadedMediaSourceAssetInput['storageProvider']
  sourceStorageBucket?: string
  sourceStoragePath: string
  sourceFileName: string
  sourceMimeType: string
  sourceByteSize: number
  sourceSequenceItemId?: string
  uploadedClipId?: string
  uploadedOrder: number
  workItemId: string
  outputId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'local_media_processing_execution_private_artifact'
  mediaArtifact: true
  processedMediaArtifact: true
  sourceMediaBound: true
  mimeType: 'video/mp4'
  sha256: string
  byteSize: number
  durationSeconds: number
  processingMode: LocalMediaProcessingMode
  audioExecutionReview?: PrivateAudioExecutionReview
  approvedSourceRange: ApprovedSourceMediaRange
  commandSummary: {
    tool: 'ffmpeg'
    maxDurationSeconds: number
    startSeconds: number
    videoCodec: string
    audioMode: string
    audioSource: string
    fitMode: string
    filters: string[]
  }
  toolOperationEvidence: ApprovedToolOperationEvidence
  qaStatus: 'qa_pending_private_media_artifact_review'
  previewReviewEligible: true
  finalRenderEligible: false
  createdAt: string
}

interface PrivateAudioExecutionReview {
  id: string
  sourceMediaAssetId: string
  sourceArtifactId: string
  processedArtifactId: string
  mode: AudioExecutionResult['mode']
  status: AudioExecutionResult['status']
  sourceAudioArtifactId: string
  toolExecutionPlanId: string
  loudnessStatus: 'planned' | 'completed' | 'skipped' | 'failed' | 'not_planned'
  normalizationStatus: 'planned' | 'completed' | 'skipped' | 'failed' | 'not_planned'
  cleanedAudioArtifactReady: boolean
  soundSyncArtifactReady: boolean
  artifactCount: number
  qaGateCount: number
  blockingQaGateCount: number
  warningQaGateCount: number
  skippedReasonCount: number
  warningCount: number
  blocksPreview: boolean
  blocksFinalExport: boolean
  finalMuxAllowed: false
  publicArtifact: false
  signedUrl: null
  productRuntimeExecuted: false
  frontendExecutionAllowed: false
  artifacts: Array<{
    id: string
    artifactType: string
    storageBucketPurpose: string
    storageObjectPath: string
    contentType: string
    isPrivate: boolean
    sourceOfTruth: boolean
    previewAllowed: boolean
  }>
  qaGates: Array<{
    id: string
    gateType: string
    status: string
    blocking: boolean
    blocksPreview: boolean
    blocksFinalExport: boolean
    issueCount: number
  }>
  skippedReasons: Array<{
    code: string
    tool?: string
  }>
  warnings: string[]
}

interface PrivateCaptionExecutionFileArtifact {
  format: CaptionFileFormat
  artifactId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/x-subrip' | 'text/vtt' | 'text/x-ssa'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'approved_caption_timing_private_caption_file'
  source: 'approved_caption_timing'
  transcriptWorkerOutput: false
  safeForPrivateReview: true
  sha256: string
  byteSize: number
  captionCount: number
}

interface PrivateCaptionExecutionPackage {
  id: string
  mode: 'local_dev'
  status: 'completed' | 'partial' | 'skipped' | 'failed'
  source: 'approved_caption_timing_private_caption_files'
  transcriptSource: 'approved_master_timing_caption_items_no_real_transcription'
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  transcriptWorkerOutput: false
  realSpeechModelExecution: false
  captionSegmentCount: number
  captionFileCount: number
  captionArtifactCount: number
  captionFormats: CaptionFileFormat[]
  captionFiles: PrivateCaptionExecutionFileArtifact[]
  qaGateCount: number
  qaPassed: boolean
  skippedReasonCount: number
  warnings: string[]
  safeForPrivateReview: true
  finalRenderEligible: false
}

type ApprovedSourceRangeSource =
  | 'source_cleanup_plan'
  | 'master_timing_plan'
  | 'segment_source_time_range'
  | 'bounded_preview_default'

interface ApprovedSourceMediaRange {
  source: ApprovedSourceRangeSource
  clipId?: string
  sourceSequenceItemId?: string
  startSeconds: number
  durationSeconds: number
  endSeconds: number
  requestedMaxDurationSeconds: number
  reason: string
}

interface ApprovedEditExecutionLocalMediaProcessingExecution {
  id: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'local_media_processing_execution_completed_waiting_private_media_artifact_qa'
  processingExecutionOnly: true
  processingMode: LocalMediaProcessingMode
  sourceMediaAssetCount: number
  inputArtifactCount: number
  processedArtifactCount: number
  privateMediaArtifactCount: number
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 1
  toolsExecuted: 1
  mediaBytesProcessed: true
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: false
  finalRenderReady: false
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  processedArtifacts: ProcessedPrivateMediaArtifact[]
  audioExecutionReviewCount: number
  audioExecutionQaGateCount: number
  audioExecutionBlockingQaGateCount: number
  captionExecutionPackage?: PrivateCaptionExecutionPackage
  finalRenderReadiness: {
    ready: false
    reason: string
    processedArtifactIds: string[]
    mediaQaRequiredArtifactIds: string[]
    privateMediaArtifactCount: number
  }
  nextRequiredGate: 'private_media_artifact_qa_review'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionLocalMediaProcessingExecution {
  requestHash: string
  localMediaProcessingExecution: ApprovedEditExecutionLocalMediaProcessingExecution
}

interface PrivateMediaArtifactQaCheck {
  check:
    | 'private_processed_media_artifact'
    | 'source_media_bound'
    | 'checksum_present'
    | 'local_file_exists'
    | 'no_signed_url'
    | 'no_public_artifact'
    | 'media_artifact_scope'
    | 'bounded_processing_policy'
    | 'ffprobe_video_stream_present'
    | 'ffprobe_duration_present'
    | 'approved_tool_operation_evidence_present'
    | 'not_final_render_eligible'
  passed: boolean
  message: string
}

interface PrivateMediaArtifactQaReviewRecord {
  id: string
  artifactId: string
  sourceMediaAssetId: string
  workItemId: string
  qaStatus: 'passed_private_media_artifact_qa' | 'blocked_private_media_artifact_qa'
  mediaArtifactQaPassed: boolean
  sourceMediaBound: boolean
  previewReviewEligible: true
  finalRenderEligible: false
  blocksFinalRender: true
  requiredBeforePreviewAssembly: true
  requiredBeforeFinalExport: true
  checks: PrivateMediaArtifactQaCheck[]
  mediaProbe?: MediaProbeSummary
  toolOperationEvidence?: ApprovedToolOperationEvidence
  reason: string
}

interface ApprovedEditExecutionPrivateMediaArtifactQaReview {
  id: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'private_media_artifact_qa_passed_waiting_render_preview_assembly' | 'private_media_artifact_qa_blocked'
  qaReviewOnly: true
  reviewedArtifactCount: number
  passedArtifactCount: number
  blockedArtifactCount: number
  privateMediaArtifactCount: number
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0 | 1
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: false
  finalRenderReady: false
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  qaResults: PrivateMediaArtifactQaReviewRecord[]
  finalRenderReadiness: {
    ready: false
    reason: string
    mediaQaPassedArtifactIds: string[]
    renderPreviewAssemblyRequiredArtifactIds: string[]
    privateMediaArtifactCount: number
  }
  nextRequiredGate: 'render_preview_assembly' | 'private_media_artifact_fix'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionPrivateMediaArtifactQaReview {
  requestHash: string
  privateMediaArtifactQaReview: ApprovedEditExecutionPrivateMediaArtifactQaReview
}

interface RenderPreviewAssemblyClipRef {
  clipRefId: string
  processedArtifactId: string
  sourceMediaAssetId: string
  sourceChecksumSha256?: string
  sourceStorageProvider: UploadedMediaSourceAssetInput['storageProvider']
  sourceStorageBucket?: string
  sourceStoragePath: string
  sourceFileName: string
  sourceMimeType: string
  sourceByteSize: number
  uploadedOrder: number
  segmentId?: string
  segmentOrder?: number
  segmentLabel?: string
  approvedReviewOverlay?: {
    title: string
    subtitle?: string
    source: 'approved_segment_metadata'
    safeForPrivateReview: true
  }
  approvedCaptionOverlay?: {
    text: string
    captionTimingItemId: string
    source: 'approved_caption_timing'
    safeForPrivateReview: true
    transcriptWorkerOutput: false
  }
  approvedTransitionPolish?: {
    fadeInSeconds?: number
    fadeOutSeconds?: number
    transitionTimingItemIds: string[]
    source: 'approved_transition_timing'
    safeForPrivateReview: true
  }
  approvedVisualPolish?: {
    colorPipelinePlanId: string
    colorGradeStyle: string
    intensity: 'subtle' | 'balanced' | 'strong' | 'stylized'
    operationIds: string[]
    operationLabels: string[]
    source: 'approved_color_pipeline_private_render'
    toolId: 'ffmpeg'
    fullColorPipelineExecuted: false
    safeForPrivateReview: true
  }
  approvedFinalTiming?: {
    finalTimingItemId: string
    startSeconds: number
    durationSeconds: number
    endSeconds: number
    fps: number
    source: 'approved_master_timing_final_range'
    safeForPrivateReview: true
  }
  approvedBrowserCapture?: {
    artifactId: string
    operationId: string
    storageObjectPath: string
    localFilePath: string
    mimeType: 'image/png'
    sha256: string
    byteSize: number
    width: 640
    height: 360
    sourceSpecSha256: string
    rendererLayerIds: string[]
    source: 'approved_playwright_private_capture'
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
  }
  assemblySource: 'approved_segment_order' | 'uploaded_source_order'
  workItemId: string
  storageProvider: string
  storageObjectPath: string
  localFilePath: string
  mimeType: string
  sha256: string
  byteSize: number
  durationSeconds: number
  processingMode: LocalMediaProcessingMode
  audioExecutionReview?: PrivateAudioExecutionReview
  approvedSourceRange: ApprovedSourceMediaRange
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  previewReviewEligible: true
  finalRenderEligible: false
}

interface RenderPreviewAssemblyManifestArtifact {
  artifactId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'render_preview_assembly_private_manifest'
  sha256: string
  byteSize: number
  clipCount: number
  previewReviewEligible: true
  finalRenderEligible: false
}

interface RenderPreviewAdapterQaIntegration {
  adapterWorkerArtifactIntegrationId: string | null
  privateMediaRunnerQaReviewId: string
  registeredRunnerRunId: string
  boundedAdapterExecutionRunId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'adapter_private_qa_evidence_attached_to_render_preview' | 'adapter_worker_artifact_integration_attached_to_render_preview'
  renderIntegrationManifestArtifactId: string | null
  reviewedActivityCount: number
  passedActivityCount: number
  artifactCount: number
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  renderPreviewIntegrationReady: true
  finalRenderDecisionManifestEligible: true
  mediaProcessingExecuted: false
  mediaTransformOutputEligible: false
  productRuntimeExecuted: false
  artifacts: Array<{
    artifactId: string
    activityExecutionId: string
    canonicalToolId: string
    actualToolPackageExecuted?: boolean
    storageProvider: 'local_private'
    storageObjectPath: string
    mimeType: 'application/json'
    sha256: string
    byteSize: number
    sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact'
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
  }>
}

interface ApprovedEditExecutionRenderPreviewAssembly {
  id: string
  privateMediaArtifactQaReviewId: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'render_preview_assembly_completed_waiting_user_preview_review'
  assemblyOnly: true
  previewClipCount: number
  privatePreviewArtifactCount: number
  privateBrowserCaptureCount: number
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: number
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: true
  finalRenderReady: false
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  privateBrowserCaptureArtifacts: PrivatePlaywrightCaptureArtifact[]
  previewClips: RenderPreviewAssemblyClipRef[]
  captionExecutionPackage?: PrivateCaptionExecutionPackage
  adapterQaIntegration?: RenderPreviewAdapterQaIntegration
  previewManifestArtifact: RenderPreviewAssemblyManifestArtifact
  finalRenderReadiness: {
    ready: false
    reason: string
    previewManifestArtifactId: string
    previewClipArtifactIds: string[]
    userPreviewReviewRequired: true
  }
  nextRequiredGate: 'user_preview_review'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionRenderPreviewAssembly {
  requestHash: string
  renderPreviewAssembly: ApprovedEditExecutionRenderPreviewAssembly
}

interface ApprovedEditExecutionUserPreviewReview {
  id: string
  renderPreviewAssemblyId: string
  privateMediaArtifactQaReviewId: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'user_preview_review_approved_waiting_final_render_readiness' | 'user_preview_review_changes_requested'
  reviewOnly: true
  reviewDecision: 'approved_for_final_render_readiness' | 'changes_requested'
  reviewerNote?: string
  previewClipCount: number
  privatePreviewArtifactCount: number
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: true
  finalRenderReady: false
  finalRenderReadiness: {
    ready: false
    reason: string
    renderPreviewAssemblyId: string
    previewApproved: boolean
    nextReviewRequired: 'final_render_readiness_review' | 'revision_plan'
  }
  nextRequiredGate: 'final_render_readiness_review' | 'preview_revision_plan'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionUserPreviewReview {
  requestHash: string
  userPreviewReview: ApprovedEditExecutionUserPreviewReview
}

interface ApprovedEditExecutionFinalRenderReadinessReview {
  id: string
  userPreviewReviewId: string
  renderPreviewAssemblyId: string
  privateMediaArtifactQaReviewId: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'final_render_readiness_passed_waiting_final_render_execution'
  readinessReviewOnly: true
  previewApproved: true
  previewClipCount: number
  privatePreviewArtifactCount: number
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaBytesProcessed: false
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: true
  finalRenderReady: true
  finalExportReady: false
  finalRenderReadiness: {
    ready: true
    reason: string
    userPreviewReviewId: string
    renderPreviewAssemblyId: string
    finalRenderExecutionRequired: true
  }
  nextRequiredGate: 'final_render_execution'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionFinalRenderReadinessReview {
  requestHash: string
  finalRenderReadinessReview: ApprovedEditExecutionFinalRenderReadinessReview
}

interface PrivateFinalRenderArtifact {
  artifactId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  privateStorageMirror?: PrivateStorageMirror
  mimeType: 'video/mp4'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'final_render_execution_private_artifact'
  mediaArtifact: true
  finalRenderArtifact: true
  durationSeconds: number
  width: number
  height: number
  sha256: string
  byteSize: number
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  commandSummary: {
    tool: 'ffmpeg'
    mode: 'concat_copy' | 'overlay_then_concat_copy' | 'concat_with_audio_polish' | 'overlay_then_concat_with_audio_polish'
    inputCount: number
    videoCodec: 'copy' | 'libx264'
    audioMode: 'copy' | 'aac'
    audioPolish: {
      applied: boolean
      source: 'private_final_render_voice_first_loudness'
      targetIntegratedLufs: -16
      truePeakDb: -1.5
      loudnessRangeLufs: 11
      limiter: true
      filterChain: string[]
    }
    approvedFinalTimingCount: number
    approvedFinalTimelineDurationSeconds: number
    reviewOverlayCount: number
    approvedCaptionOverlayCount: number
    approvedTransitionPolishCount: number
    approvedVisualPolishCount: number
    approvedBrowserCaptureOverlayCount: number
    visualPolish: {
      applied: boolean
      source: 'approved_color_pipeline_private_render'
      toolId: 'ffmpeg'
      fullColorPipelineExecuted: false
      clipCount: number
      colorGradeStyles: string[]
      operationLabels: string[]
      filterChain: string[]
    }
    privateCaptionArtifactCount: number
    privateCaptionFormats: CaptionFileFormat[]
    privateCaptionSource: 'approved_caption_timing_private_caption_files' | 'none'
  }
  editDecisionManifest: ProfessionalEditDecisionManifest
  editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifact
  deliveryQaRequired: true
  finalDeliveryEligible: false
}

interface ProfessionalEditDecisionManifestArtifact {
  artifactId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  privateStorageMirror?: PrivateStorageMirror
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'final_render_execution_edit_decision_manifest'
  sha256: string
  byteSize: number
  manifestVersion: 'private-internal-edit-decision-manifest-v1'
  finalRenderArtifactId: string
  safeForPrivateReview: true
  finalDeliveryEligible: false
}

interface PrivateStorageMirror {
  storageProvider: 'google_cloud_storage'
  bucketName: string
  objectPath: string
  mimeType: string
  byteSize: number
  sha256: string
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
}

interface ProfessionalEditDecisionManifest {
  manifestVersion: 'private-internal-edit-decision-manifest-v1'
  source: 'approved_snapshot_private_render_execution'
  approvedPlanSnapshotId: string
  approvedToolWorkManifest: ApprovedToolWorkManifestRef & {
    status: ApprovedToolWorkManifest['status']
    executableOperationCount: number
    degradedOperationCount: number
    blockedOperationCount: number
  }
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  approvedEditContext: {
    source: 'approved_plan_snapshot'
    projectId: string
    editSessionId: string
    editPlanVersionId: string
    creditEstimateId: string
    approvedAt: string | null
    approvedBy: string | null
    goalSummary: string
    editLevel: string | null
    editingCategory: string | null
    workflowType: string | null
    moodStyle: string | null
    aspectRatio: string | null
    aspectRatioConfirmed: boolean
    sourceOrderConfirmed: boolean
    cleanupPreferenceConfirmed: boolean
    timingBaseConfirmed: boolean
    professionalBaseline: true
    sourceSequenceItemCount: number
    segmentCount: number
    operationCount: number
    qaGateCount: number
    creditEstimateTotalCredits: number
    professionalSkillTrace: {
      source: 'professional_skill_plan'
      status: string
      selectedSkillCount: number
      selectedFamilies: string[]
      activityGroups: Array<{
        id: string
        label: string
        selectedActivityCount: number
        readyActivityCount: number
        reviewActivityCount: number
        blockedActivityCount: number
        status: string
        userFacingSummary: string
      }>
      selectionEvidence: Array<{
        skillId: string
        userFacingActivity: string
        sources: string[]
        summaries: string[]
      }>
      backendIntentCount: number
      backendIntentKinds: string[]
      backendIntents: Array<{
        intentId: string
        intentKind: ProfessionalSkillBackendIntent['intentKind']
        executionBoundary: ProfessionalSkillBackendIntent['executionBoundary']
        providerRoute?: string
        providerModel?: string
        modelRoleId?: ProfessionalSkillBackendIntent['modelRoleId']
        requestedModelUse?: ProfessionalSkillBackendIntent['requestedModelUse']
        generationType?: string
        outputAssetType?: string
        hiddenAdapterToolCount: number
        requiredApprovalGates: string[]
      }>
      modelRoleTrace?: ProfessionalSkillModelRoleTrace
      qaGateCount: number
      userFacingActivities: string[]
      warnings: string[]
      blockers: string[]
      editBriefOptional: true
      promptFirstPlanning: true
      noUserVisibleToolNames: true
    } | null
    planningContextTrace: {
      source: 'planning_context'
      planningContextId: string
      status: string
      editBriefReady: boolean
      editBriefDirectionCount: number
      cueUsageCount: number
      readyCueUsageCount: number
      blockedCueUsageCount: number
      unresolvedConflictCount: number
      sourceAssetCount: number
      mustUseAssetCount: number
      avoidAssetCount: number
    } | null
  }
  creditReservationId: string
  renderPreviewAssemblyId: string
  finalRenderArtifactId: string
  clipDecisionCount: number
  sourceMediaAssetCount: number
  uploadedSourceOrderTrace: {
    source: 'uploaded_media_source_order'
    sourceMediaAssetIds: string[]
    uploadedOrders: number[]
    sourceChecksumSha256ByMediaAssetId: Record<string, string>
    sourceStorageProviderByMediaAssetId: Record<string, UploadedMediaSourceAssetInput['storageProvider']>
    sourceStorageBucketByMediaAssetId: Record<string, string>
    sourceStoragePathByMediaAssetId: Record<string, string>
    sourceFileNameByMediaAssetId: Record<string, string>
    sourceMimeTypeByMediaAssetId: Record<string, string>
    sourceByteSizeByMediaAssetId: Record<string, number>
    uniqueUploadedOrderCount: number
    uniqueSourceMediaAssetCount: number
    firstAppearanceSourceMediaAssetIds: string[]
    firstAppearanceUploadedOrders: number[]
    sourceMediaCoverageComplete: boolean
    sourceOrderPreserved: boolean
    uploadedOrderMonotonic: boolean
  }
  privateCaptionPackage: {
    attached: boolean
    source: 'approved_caption_timing_private_caption_files' | 'none'
    artifactCount: number
    formats: CaptionFileFormat[]
  }
  audioQaIntegration: {
    attached: boolean
    source: 'private_uploaded_audio_execution' | 'none'
    reviewCount: number
    qaGateCount: number
    blockingQaGateCount: number
    warningQaGateCount: number
    warningsCount: number
    cleanedAudioArtifactReadyCount: number
    soundSyncArtifactReadyCount: number
    blocksPreview: boolean
    blocksFinalExport: boolean
    finalMuxAllowed: false
    productRuntimeExecuted: false
    publicArtifact: false
    signedUrl: null
  }
  adapterQaIntegration: {
    attached: boolean
    adapterWorkerArtifactIntegrationId: string | null
    privateMediaRunnerQaReviewId: string | null
    renderIntegrationManifestArtifactId: string | null
    reviewedActivityCount: number
    passedActivityCount: number
    artifactCount: number
    renderPreviewIntegrationReady: boolean
    finalRenderDecisionManifestEligible: boolean
    mediaProcessingExecuted: false
    mediaTransformOutputEligible: false
    productRuntimeExecuted: false
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
    artifacts: Array<{
      artifactId: string
      canonicalToolId: string
      storageObjectPath: string
      sha256: string
      byteSize: number
    }>
  }
  professionalLayerCounts: {
    reviewOverlays: number
    captionOverlays: number
    transitionPolish: number
    visualPolish: number
    browserCaptureOverlays: number
    finalTiming: number
    audioQa: number
    audioPolish: number
  }
  decisions: Array<{
    clipRefId: string
    processedArtifactId: string
    processedArtifact: {
      storageProvider: 'local_private'
      storageObjectPath: string
      mimeType: 'video/mp4'
      sha256: string
      byteSize: number
      durationSeconds: number
      processingMode: LocalMediaProcessingMode
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      toolOperationEvidence: ApprovedToolOperationEvidence[]
    }
    sourceMediaAssetId: string
    sourceChecksumSha256: string | null
    sourceStorageProvider: UploadedMediaSourceAssetInput['storageProvider']
    sourceStorageBucket: string | null
    sourceStoragePath: string
    sourceFileName: string
    sourceMimeType: string
    sourceByteSize: number
    uploadedOrder: number
    segment: {
      id: string | null
      order: number | null
      label: string | null
    }
    approvedSourceRange: {
      source: ApprovedSourceRangeSource
      clipId: string | null
      sourceSequenceItemId: string | null
      startSeconds: number
      durationSeconds: number
      endSeconds: number
      requestedMaxDurationSeconds: number
    }
    finalRenderTimeline: {
      source: 'final_render_execution_sequence'
      sequenceIndex: number
      startSeconds: number
      durationSeconds: number
      endSeconds: number
    }
    reviewOverlay: {
      present: boolean
      hasTitle: boolean
      hasSubtitle: boolean
      source: 'approved_segment_metadata' | 'none'
    }
    captionOverlay: {
      present: boolean
      captionTimingItemId: string | null
      textPresent: boolean
      textCharacterCount: number
      source: 'approved_caption_timing' | 'none'
    }
    transitionPolish: {
      present: boolean
      transitionTimingItemIds: string[]
      fadeInSeconds: number | null
      fadeOutSeconds: number | null
      source: 'approved_transition_timing' | 'none'
    }
    visualPolish: {
      present: boolean
      colorPipelinePlanId: string | null
      colorGradeStyle: string | null
      intensity: string | null
      operationCount: number
      source: 'approved_color_pipeline_private_render' | 'none'
      fullColorPipelineExecuted: false
    }
    browserCaptureOverlay: {
      present: boolean
      artifactId: string | null
      operationId: string | null
      sha256: string | null
      rendererLayerIds: string[]
      source: 'approved_playwright_private_capture' | 'none'
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
    }
    finalTiming: {
      present: boolean
      finalTimingItemId: string | null
      startSeconds: number | null
      durationSeconds: number | null
      endSeconds: number | null
      fps: number | null
      source: 'approved_master_timing_final_range' | 'none'
    }
    audioExecutionReview: {
      attached: boolean
      id: string | null
      status: AudioExecutionResult['status'] | null
      loudnessStatus: PrivateAudioExecutionReview['loudnessStatus'] | null
      normalizationStatus: PrivateAudioExecutionReview['normalizationStatus'] | null
      artifactCount: number
      qaGateCount: number
      blockingQaGateCount: number
      warningQaGateCount: number
      blocksPreview: boolean
      blocksFinalExport: boolean
      finalMuxAllowed: false
      productRuntimeExecuted: false
      publicArtifact: false
      signedUrl: null
    }
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
  }>
  gateState: {
    privateInternalReview: 'requires_delivery_qa'
    publicDeliveryReady: boolean
    externalBetaReady: boolean
    productionReady: boolean
  }
  blockedRuntimeScopes: {
    publicArtifactCreated: false
    signedUrlCreated: false
    supabaseOrGcsWrite: false
    externalBetaEnabled: false
    productionEnabled: false
    billingMutation: false
  }
}

interface ApprovedEditExecutionFinalRenderExecution {
  id: string
  finalRenderReadinessReviewId: string
  userPreviewReviewId: string
  renderPreviewAssemblyId: string
  privateMediaArtifactQaReviewId: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'final_render_execution_completed_waiting_delivery_qa'
  renderExecutionOnly: true
  previewClipCount: number
  finalRenderArtifactCount: 1
  mediaArtifactCount: number
  workersStarted: 0
  workerHandlersStarted: 1
  toolsExecuted: 1
  mediaBytesProcessed: true
  liveExecutionReady: false
  internalResultReviewReady: true
  previewReviewReady: true
  renderPreviewReady: true
  finalRenderReady: true
  finalExportReady: false
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  finalRenderArtifact: PrivateFinalRenderArtifact
  finalDeliveryReadiness: {
    ready: false
    reason: string
    finalRenderArtifactId: string
    deliveryQaRequired: true
  }
  nextRequiredGate: 'final_delivery_qa'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionFinalRenderExecution {
  requestHash: string
  finalRenderExecution: ApprovedEditExecutionFinalRenderExecution
}

interface FinalDeliveryQaCheck {
  check:
    | 'private_final_render_artifact'
    | 'local_file_exists'
    | 'checksum_matches'
    | 'final_render_not_source_passthrough'
    | 'video_stream_present'
    | 'audio_stream_present'
    | 'final_frame_dimensions_present'
    | 'duration_present'
    | 'no_signed_url'
    | 'no_public_artifact'
    | 'delivery_scope_private_internal'
    | 'approved_review_overlays_present'
    | 'approved_caption_overlays_present'
    | 'private_caption_package_attached'
    | 'approved_transition_polish_present'
    | 'approved_visual_polish_present'
    | 'approved_browser_capture_overlay_trace'
    | 'approved_final_timing_present'
    | 'voice_first_audio_polish_present'
    | 'professional_edit_decision_manifest_present'
    | 'uploaded_source_order_trace_present'
    | 'professional_edit_decision_timeline_trace_present'
    | 'professional_edit_decision_manifest_artifact_present'
    | 'professional_edit_decision_manifest_artifact_content_matches'
    | 'approved_tool_work_manifest_present'
    | 'approved_tool_operation_evidence_present'
    | 'full_color_pipeline_not_claimed'
  passed: boolean
  message: string
}

interface ProfessionalEditQaSummary {
  source: 'final_render_command_summary'
  approvedReviewOverlayCount: number
  approvedCaptionOverlayCount: number
  privateCaptionArtifactCount: number
  privateCaptionFormats: CaptionFileFormat[]
  approvedTransitionPolishCount: number
  approvedVisualPolishCount: number
  approvedBrowserCaptureOverlayCount: number
  approvedFinalTimingCount: number
  approvedFinalTimelineDurationSeconds: number
  audioPolishApplied: boolean
  visualPolishApplied: boolean
  visualPolishToolId: 'ffmpeg' | 'none'
  fullColorPipelineExecuted: false
  editDecisionManifestReady: boolean
  editDecisionManifestArtifactReady: boolean
  privateInternalQaReady: boolean
}

interface ApprovedEditExecutionFinalDeliveryQaReview {
  id: string
  finalRenderExecutionId: string
  finalRenderReadinessReviewId: string
  userPreviewReviewId: string
  renderPreviewAssemblyId: string
  privateMediaArtifactQaReviewId: string
  localMediaProcessingExecutionId: string
  privateWorkerArtifactQaReviewId: string
  uploadedMediaWorkerExecutionId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'final_delivery_qa_passed_ready_for_private_internal_download' | 'final_delivery_qa_blocked'
  qaReviewOnly: true
  finalArtifactQaPassed: boolean
  privateInternalDownloadReady: boolean
  publicDeliveryReady: boolean
  externalBetaReady: boolean
  productionReady: boolean
  finalExportReady: boolean
  finalRenderArtifactCount: 1
  mediaArtifactCount: number
  finalArtifactProbe?: MediaProbeSummary
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0 | 1
  mediaBytesProcessed: false
  liveExecutionReady: false
  renderPreviewReady: true
  finalRenderReady: true
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  qaChecks: FinalDeliveryQaCheck[]
  professionalEditQaSummary: ProfessionalEditQaSummary
  finalRenderArtifact: PrivateFinalRenderArtifact
  nextRequiredGate: 'private_internal_download_delivery' | 'final_delivery_fix'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionFinalDeliveryQaReview {
  requestHash: string
  finalDeliveryQaReview: ApprovedEditExecutionFinalDeliveryQaReview
}

interface ApprovedEditExecutionPrivateInternalDownloadDelivery {
  id: string
  createdByUserId: string
  finalDeliveryQaReviewId: string
  finalRenderExecutionId: string
  finalRenderReadinessReviewId: string
  userPreviewReviewId: string
  renderPreviewAssemblyId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'private_internal_download_delivery_ready'
  deliveryOnly: true
  privateInternalDownloadReady: true
  publicDeliveryReady: boolean
  externalBetaReady: boolean
  productionReady: boolean
  finalExportReady: true
  internalDownloadPath: string
  internalManifestPath: string
  professionalEditQaSummary: ProfessionalEditQaSummary
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  finalRenderArtifact: PrivateFinalRenderArtifact
  workersStarted: 0
  workerHandlersStarted: 0
  toolsExecuted: 0
  mediaBytesProcessed: false
  liveExecutionReady: false
  nextRequiredGate: 'external_beta_or_production_release_gates'
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdAt: string
  mockOnly: true
}

interface StoredApprovedEditExecutionPrivateInternalDownloadDelivery {
  requestHash: string
  privateInternalDownloadDelivery: ApprovedEditExecutionPrivateInternalDownloadDelivery
}

interface PrivateInternalDownloadFile {
  localFilePath?: string
  fileName: string
  mimeType: string
  byteSize: number
  createReadStream: () => Promise<Readable>
}

const mockPackagesByIdempotency = new Map<string, StoredApprovedEditExecutionPackage>()
const mockPackagesById = new Map<string, StoredApprovedEditExecutionPackage['approvedEditExecutionPackage']>()
const mockApprovedSnapshotsByPackageRecordId = new Map<string, ApprovedPlanSnapshot>()
const serverApprovedPlaywrightCaptureAuthorizationsByPackageRecordId = new Map<string, ServerApprovedPlaywrightCaptureAuthorization>()
const mockBoundedAdapterSourceTruthReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionBoundedAdapterSourceTruthReview>()
const mockBoundedAdapterExecutionRunsByIdempotency = new Map<string, StoredApprovedEditExecutionBoundedAdapterExecutionRun>()
const mockBoundedAdapterExecutionRunsById = new Map<string, ProfessionalToolAdapterBoundedExecutionRun>()
const mockRegisteredAdapterRunnerRunsByIdempotency = new Map<string, StoredApprovedEditExecutionRegisteredAdapterRunnerRun>()
const mockRegisteredAdapterRunnerRunsById = new Map<string, ProfessionalToolAdapterRegisteredRunnerRun>()
const mockRegisteredAdapterPrivateMediaRunnerRunsByIdempotency = new Map<string, StoredApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerRun>()
const mockRegisteredAdapterPrivateMediaRunnerRunsById = new Map<string, ProfessionalToolAdapterPrivateMediaRunnerRun>()
const mockRegisteredAdapterPrivateMediaRunnerQaReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReview>()
const mockRegisteredAdapterPrivateMediaRunnerQaReviewsById = new Map<string, RegisteredAdapterPrivateMediaRunnerQaReview>()
const mockRegisteredAdapterPrivateMediaRunnerQaReviewsByPrivateRunnerRunId = new Map<string, RegisteredAdapterPrivateMediaRunnerQaReview>()
const mockAdapterWorkerArtifactIntegrationsByIdempotency = new Map<string, StoredApprovedEditExecutionAdapterWorkerArtifactIntegration>()
const mockAdapterWorkerArtifactIntegrationsById = new Map<string, ApprovedEditExecutionAdapterWorkerArtifactIntegration>()
const mockAdapterWorkerArtifactIntegrationsByPrivateRunnerQaReviewId = new Map<string, ApprovedEditExecutionAdapterWorkerArtifactIntegration>()
const mockJobBatchPlansByIdempotency = new Map<string, StoredApprovedEditExecutionJobBatchPlan>()
const mockJobBatchPlansById = new Map<string, ApprovedEditExecutionJobBatchPlan>()
const mockQueuesByIdempotency = new Map<string, StoredApprovedEditExecutionMockQueue>()
const mockQueuesById = new Map<string, ApprovedEditExecutionMockQueue>()
const mockDispatchReadinessByIdempotency = new Map<string, StoredApprovedEditExecutionDispatchReadiness>()
const mockDispatchReadinessById = new Map<string, ApprovedEditExecutionDispatchReadiness>()
const mockWorkerClaimsByIdempotency = new Map<string, StoredApprovedEditExecutionMockWorkerClaims>()
const mockWorkerClaimsById = new Map<string, ApprovedEditExecutionMockWorkerClaims>()
const mockHandlerDryRunsByIdempotency = new Map<string, StoredApprovedEditExecutionHandlerDryRun>()
const mockHandlerDryRunsById = new Map<string, ApprovedEditExecutionHandlerDryRun>()
const mockResultReconciliationsByIdempotency = new Map<string, StoredApprovedEditExecutionResultReconciliation>()
const mockResultReconciliationsById = new Map<string, ApprovedEditExecutionResultReconciliation>()
const mockLocalWorkerOutputsByIdempotency = new Map<string, StoredApprovedEditExecutionLocalWorkerOutput>()
const mockLocalWorkerOutputsById = new Map<string, ApprovedEditExecutionLocalWorkerOutput>()
const mockLocalWorkerOutputQaReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionLocalWorkerOutputQaReview>()
const mockLocalWorkerOutputQaReviewsById = new Map<string, ApprovedEditExecutionLocalWorkerOutputQaReview>()
const mockLocalWorkerOutputQaReviewsByLocalOutputId = new Map<string, ApprovedEditExecutionLocalWorkerOutputQaReview>()
const mockWorkflowRehearsalsByIdempotency = new Map<string, StoredApprovedEditExecutionWorkflowRehearsal>()
const mockWorkflowRehearsalsById = new Map<string, ApprovedEditExecutionWorkflowRehearsal>()
const mockUploadedMediaWorkerExecutionsByIdempotency = new Map<string, StoredApprovedEditExecutionUploadedMediaWorkerExecution>()
const mockUploadedMediaWorkerExecutionsById = new Map<string, ApprovedEditExecutionUploadedMediaWorkerExecution>()
const mockPrivateWorkerArtifactQaReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionPrivateWorkerArtifactQaReview>()
const mockPrivateWorkerArtifactQaReviewsByUploadedExecutionId = new Map<string, ApprovedEditExecutionPrivateWorkerArtifactQaReview>()
const mockPrivateWorkerArtifactQaReviewsById = new Map<string, ApprovedEditExecutionPrivateWorkerArtifactQaReview>()
const mockLocalMediaProcessingExecutionsByIdempotency = new Map<string, StoredApprovedEditExecutionLocalMediaProcessingExecution>()
const mockLocalMediaProcessingExecutionsById = new Map<string, ApprovedEditExecutionLocalMediaProcessingExecution>()
const mockPrivateMediaArtifactQaReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionPrivateMediaArtifactQaReview>()
const mockPrivateMediaArtifactQaReviewsById = new Map<string, ApprovedEditExecutionPrivateMediaArtifactQaReview>()
const mockRenderPreviewAssembliesByIdempotency = new Map<string, StoredApprovedEditExecutionRenderPreviewAssembly>()
const mockRenderPreviewAssembliesById = new Map<string, ApprovedEditExecutionRenderPreviewAssembly>()
const mockUserPreviewReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionUserPreviewReview>()
const mockUserPreviewReviewsById = new Map<string, ApprovedEditExecutionUserPreviewReview>()
const mockFinalRenderReadinessReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionFinalRenderReadinessReview>()
const mockFinalRenderReadinessReviewsById = new Map<string, ApprovedEditExecutionFinalRenderReadinessReview>()
const mockFinalRenderExecutionsByIdempotency = new Map<string, StoredApprovedEditExecutionFinalRenderExecution>()
const mockFinalRenderExecutionsById = new Map<string, ApprovedEditExecutionFinalRenderExecution>()
const mockFinalDeliveryQaReviewsByIdempotency = new Map<string, StoredApprovedEditExecutionFinalDeliveryQaReview>()
const mockFinalDeliveryQaReviewsById = new Map<string, ApprovedEditExecutionFinalDeliveryQaReview>()
const mockPrivateInternalDownloadDeliveriesByIdempotency = new Map<string, StoredApprovedEditExecutionPrivateInternalDownloadDelivery>()
const mockPrivateInternalDownloadDeliveriesById = new Map<string, ApprovedEditExecutionPrivateInternalDownloadDelivery>()

export function clearApprovedEditExecutionPrivateDownloadMemoryForSmoke(): void {
  mockPrivateInternalDownloadDeliveriesByIdempotency.clear()
  mockPrivateInternalDownloadDeliveriesById.clear()
}

function requirePackageToolWorkManifest(packageRecordId: string): ApprovedToolWorkManifest {
  const manifest = mockPackagesById.get(packageRecordId)?.toolWorkManifest
  if (!manifest) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved tool-work manifest was not found for this execution package.', 409, {
      packageRecordId,
      requiredBackendGate: 'approved_tool_work_manifest',
    })
  }
  if (manifest.status === 'blocked_structural_inconsistency') {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Approved tool-work manifest is structurally blocked.', 409, {
      packageRecordId,
      manifestId: manifest.manifestId,
      blockers: manifest.blockers,
    })
  }
  return manifest
}

export function createApprovedEditExecutionPackageService(context: ServiceContext) {
  return {
    async createPackage(input: CreateApprovedEditExecutionPackageInput): Promise<{
      approvedEditExecutionPackage: StoredApprovedEditExecutionPackage['approvedEditExecutionPackage']
      warnings: string[]
    }> {
      void input
      return blockCallerAuthoredExecutionPackageCreation()
    },

    async getPackage(packageRecordId: string) {
      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution package reads require backend persistence before non-mock mode can serve them.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const approvedEditExecutionPackage = mockPackagesById.get(packageRecordId)
      if (!approvedEditExecutionPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved edit execution package was not found in mock storage.', 404)
      }
      assertApprovedEditExecutionPackageOwnedByCurrentUser(context, approvedEditExecutionPackage)

      return {
        approvedEditExecutionPackage,
        warnings: [mockWarning('Approved edit execution package read')],
      }
    },

    async getBoundedAdapterExecutionGate(packageRecordId: string) {
      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit bounded adapter execution gate reads require backend persistence before non-mock mode can serve them.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const approvedEditExecutionPackage = mockPackagesById.get(packageRecordId)
      if (!approvedEditExecutionPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved edit execution package was not found before bounded adapter gate readback.', 404)
      }
      assertApprovedEditExecutionPackageOwnedByCurrentUser(context, approvedEditExecutionPackage)

      return {
        boundedAdapterExecutionGate: approvedEditExecutionPackage.boundedAdapterExecutionGate ?? null,
        packageRecordId: approvedEditExecutionPackage.packageRecordId,
        approvedPlanSnapshotId: approvedEditExecutionPackage.approvedPlanSnapshotId,
        workspaceId: approvedEditExecutionPackage.workspaceId,
        projectId: approvedEditExecutionPackage.projectId,
        warnings: [
          mockWarning('Approved edit bounded adapter execution gate read'),
          'Bounded adapter execution gate readback does not execute tools, import packages, process media, render, write storage, or bill users.',
        ],
      }
    },

    async reviewBoundedAdapterSourceTruth(input: ReviewApprovedEditExecutionBoundedAdapterSourceTruthInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Bounded adapter source-truth review requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for bounded adapter source-truth review.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Bounded adapter source-truth reviews require backend persistence before non-mock mode can update package readiness.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const approvedEditExecutionPackage = mockPackagesById.get(input.packageRecordId)
      if (!approvedEditExecutionPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved edit execution package was not found before bounded adapter source-truth review.', 404)
      }
      assertApprovedEditExecutionPackageOwnedByCurrentUser(context, approvedEditExecutionPackage)

      if (approvedEditExecutionPackage.workspaceId !== input.workspaceId || approvedEditExecutionPackage.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Bounded adapter source-truth review must match the package workspace and project.', 400, {
          packageWorkspaceId: approvedEditExecutionPackage.workspaceId,
          packageProjectId: approvedEditExecutionPackage.projectId,
        })
      }

      if (approvedEditExecutionPackage.creditReservationId && approvedEditExecutionPackage.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Bounded adapter source-truth review must use the package credit reservation.', 409, {
          packageCreditReservationId: approvedEditExecutionPackage.creditReservationId,
        })
      }

      const approvedSnapshot = mockApprovedSnapshotsByPackageRecordId.get(input.packageRecordId)
      if (!approvedSnapshot) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot source record was not found for bounded adapter source-truth review.', 404)
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/packages/:packageRecordId/bounded-adapter-source-truth-review',
        packageRecordId: input.packageRecordId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        packageReadinessEvidence: input.packageReadinessEvidence ?? [],
        modelWeightApprovals: input.modelWeightApprovals ?? [],
        privateArtifactRefs: input.privateArtifactRefs ?? [],
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockBoundedAdapterSourceTruthReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different bounded adapter source-truth review request.', 409)
      }

      if (existing) {
        mockPackagesById.set(existing.approvedEditExecutionPackage.packageRecordId, existing.approvedEditExecutionPackage)
        mockApprovedSnapshotsByPackageRecordId.set(existing.approvedEditExecutionPackage.packageRecordId, approvedSnapshot)
        return {
          sourceTruthReview: existing.sourceTruthReview,
          approvedEditExecutionPackage: existing.approvedEditExecutionPackage,
          warnings: [
            mockWarning('Bounded adapter source-truth review'),
            'Idempotent bounded adapter source-truth review replay returned the original result without duplicate work.',
          ],
        }
      }

      const sourceTruthReview = createProfessionalToolAdapterSourceTruthEvidenceReview({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        requestedToolNames: approvedEditExecutionPackage.requestedAdapterToolNames,
        approvedPlanSnapshotId: approvedEditExecutionPackage.approvedPlanSnapshotId,
        creditEstimateId: approvedSnapshot.creditEstimateId,
        creditReservationId: input.creditReservationId,
        privateArtifactRefs: input.privateArtifactRefs?.length
          ? input.privateArtifactRefs
          : approvedEditExecutionPackage.rehearsal.executionPlan?.assetManifest
            ?.filter((asset) => Boolean(asset.storagePath || asset.storageBucket))
            .map((asset) => ({
              artifactId: asset.id,
              assetType: asset.assetType,
              storageProvider: asset.storageProvider,
              storageBucket: asset.storageBucket ?? null,
              storageObjectPath: asset.storagePath ?? `mock/edit-assets/${asset.id}`,
              sourceOfTruth: true,
              privateArtifact: true,
            })),
        packageReadinessEvidence: input.packageReadinessEvidence,
        modelWeightApprovals: input.modelWeightApprovals,
      })
      const refreshedPackage = {
        ...createApprovedEditExecutionPackage({
          workspaceId: approvedEditExecutionPackage.workspaceId,
          approvedSnapshot,
          requestedAdapterToolNames: approvedEditExecutionPackage.requestedAdapterToolNames,
          adapterCandidateScope: approvedEditExecutionPackage.adapterCandidateScope,
          creditReservationId: input.creditReservationId,
          packageReadyToolIds: sourceTruthReview.packageReadyToolIds,
          modelWeightApprovedToolIds: sourceTruthReview.modelWeightApprovedToolIds,
        }),
        packageRecordId: approvedEditExecutionPackage.packageRecordId,
        createdByUserId: approvedEditExecutionPackage.createdByUserId,
        createdAt: approvedEditExecutionPackage.createdAt,
        mockOnly: true as const,
        boundedAdapterSourceTruthReview: sourceTruthReview,
      }

      mockPackagesById.set(input.packageRecordId, refreshedPackage)
      for (const [packageCacheKey, stored] of mockPackagesByIdempotency.entries()) {
        if (stored.approvedEditExecutionPackage.packageRecordId === input.packageRecordId) {
          mockPackagesByIdempotency.set(packageCacheKey, {
            ...stored,
            approvedEditExecutionPackage: refreshedPackage,
          })
        }
      }
      mockBoundedAdapterSourceTruthReviewsByIdempotency.set(cacheKey, {
        requestHash,
        sourceTruthReview,
        approvedEditExecutionPackage: refreshedPackage,
      })

      return {
        sourceTruthReview,
        approvedEditExecutionPackage: refreshedPackage,
        warnings: [
          mockWarning('Bounded adapter source-truth review'),
          'Source-truth review accepted only backend-owned package/model evidence and did not execute tools, import packages, process media, render, write storage, or bill users.',
        ],
      }
    },

    async createBoundedAdapterExecutionRun(input: CreateApprovedEditExecutionBoundedAdapterExecutionRunInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Bounded adapter execution handoff requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for bounded adapter execution handoff.', 400)
      }

      if (input.handoffOnly !== true) {
        throw new ApiError('VALIDATION_FAILED', 'Bounded adapter execution handoff must be explicitly handoffOnly=true.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Bounded adapter execution handoff requires backend persistence before non-mock mode can create runner manifests.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const approvedEditExecutionPackage = mockPackagesById.get(input.packageRecordId)
      if (!approvedEditExecutionPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved edit execution package was not found before bounded adapter execution handoff.', 404)
      }
      assertApprovedEditExecutionPackageOwnedByCurrentUser(context, approvedEditExecutionPackage)

      if (approvedEditExecutionPackage.workspaceId !== input.workspaceId || approvedEditExecutionPackage.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Bounded adapter execution handoff must match the package workspace and project.', 400, {
          packageWorkspaceId: approvedEditExecutionPackage.workspaceId,
          packageProjectId: approvedEditExecutionPackage.projectId,
        })
      }

      if (approvedEditExecutionPackage.creditReservationId && approvedEditExecutionPackage.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Bounded adapter execution handoff must use the package credit reservation.', 409, {
          packageCreditReservationId: approvedEditExecutionPackage.creditReservationId,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/packages/:packageRecordId/bounded-adapter-execution-runs',
        packageRecordId: input.packageRecordId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        handoffOnly: input.handoffOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockBoundedAdapterExecutionRunsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different bounded adapter execution handoff request.', 409)
      }

      if (existing) {
        mockBoundedAdapterExecutionRunsById.set(existing.boundedAdapterExecutionRun.id, existing.boundedAdapterExecutionRun)
        return {
          boundedAdapterExecutionRun: existing.boundedAdapterExecutionRun,
          warnings: [
            mockWarning('Bounded adapter execution handoff'),
            'Idempotent bounded adapter execution handoff replay returned the original private manifest without duplicate work.',
          ],
        }
      }

      const boundedAdapterExecutionRun = createProfessionalToolAdapterBoundedExecutionRun({
        packageRecordId: input.packageRecordId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        approvedPlanSnapshotId: approvedEditExecutionPackage.approvedPlanSnapshotId,
        creditReservationId: input.creditReservationId,
        sourceTruthReviewReady: approvedEditExecutionPackage.boundedAdapterSourceTruthReview?.status === 'ready_for_bounded_execution',
        boundedAdapterExecutionGate: approvedEditExecutionPackage.boundedAdapterExecutionGate,
      })

      if (boundedAdapterExecutionRun.status !== 'completed_private_manifest_handoff') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Bounded adapter execution handoff is blocked until source-truth readiness and adapter gates pass.', 409, {
          blockers: boundedAdapterExecutionRun.blockers,
          nextRequiredGate: boundedAdapterExecutionRun.nextRequiredGate,
        })
      }

      mockBoundedAdapterExecutionRunsByIdempotency.set(cacheKey, {
        requestHash,
        boundedAdapterExecutionRun,
      })
      mockBoundedAdapterExecutionRunsById.set(boundedAdapterExecutionRun.id, boundedAdapterExecutionRun)

      return {
        boundedAdapterExecutionRun,
        warnings: [
          mockWarning('Bounded adapter execution handoff'),
          'Bounded adapter execution handoff created private result manifests only. Actual package/library execution remains the next registered backend runner gate.',
        ],
      }
    },

    async runRegisteredAdapterRunners(input: RunApprovedEditExecutionRegisteredAdapterRunnersInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Registered adapter runner probe requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for registered adapter runner probe.', 400)
      }

      if (input.importProbeOnly !== true) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter runner probe must be explicitly importProbeOnly=true.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Registered adapter runner probe requires backend persistence before non-mock mode can record runner results.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const boundedAdapterExecutionRun = mockBoundedAdapterExecutionRunsById.get(input.boundedAdapterExecutionRunId)
      if (!boundedAdapterExecutionRun) {
        throw new ApiError('JOB_NOT_FOUND', 'Bounded adapter execution handoff was not found before registered runner probe.', 404)
      }

      if (boundedAdapterExecutionRun.workspaceId !== input.workspaceId || boundedAdapterExecutionRun.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter runner probe must match the bounded execution workspace and project.', 400, {
          runWorkspaceId: boundedAdapterExecutionRun.workspaceId,
          runProjectId: boundedAdapterExecutionRun.projectId,
        })
      }

      if (boundedAdapterExecutionRun.status !== 'completed_private_manifest_handoff') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Registered adapter runner probe requires a completed bounded adapter handoff.', 409, {
          runStatus: boundedAdapterExecutionRun.status,
          blockers: boundedAdapterExecutionRun.blockers,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/bounded-adapter-execution-runs/:boundedAdapterExecutionRunId/registered-runner-probe',
        boundedAdapterExecutionRunId: input.boundedAdapterExecutionRunId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        importProbeOnly: input.importProbeOnly,
        adapterPythonRuntime: context.env.toolAdapterPythonBin,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockRegisteredAdapterRunnerRunsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different registered adapter runner probe request.', 409)
      }

      if (existing) {
        mockRegisteredAdapterRunnerRunsById.set(existing.registeredRunnerRun.id, existing.registeredRunnerRun)
        return {
          registeredRunnerRun: existing.registeredRunnerRun,
          warnings: [
            mockWarning('Registered adapter runner probe'),
            'Idempotent registered adapter runner probe replay returned the original result without duplicate work.',
          ],
        }
      }

      const registeredRunnerRun = await runProfessionalToolAdapterRegisteredRunners({
        boundedAdapterExecutionRun,
        allowImportProbe: true,
        pythonBin: context.env.toolAdapterPythonBin,
      })
      mockRegisteredAdapterRunnerRunsByIdempotency.set(cacheKey, {
        requestHash,
        registeredRunnerRun,
      })
      mockRegisteredAdapterRunnerRunsById.set(registeredRunnerRun.id, registeredRunnerRun)

      return {
        registeredRunnerRun,
        warnings: [
          mockWarning('Registered adapter runner probe'),
          'Registered runner probe checked backend package availability only. It did not process media, render, call providers, write storage, or bill users.',
        ],
      }
    },

    async runRegisteredAdapterPrivateMediaRunner(input: RunApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Registered adapter private runner execution requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for registered adapter private runner execution.', 400)
      }

      if (input.privateMediaExecutionOnly !== true) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter private runner execution must be explicitly privateMediaExecutionOnly=true.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Registered adapter private runner execution requires backend persistence before non-mock mode can record private runner manifests.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const registeredRunnerRun = mockRegisteredAdapterRunnerRunsById.get(input.registeredRunnerRunId)
      if (!registeredRunnerRun) {
        throw new ApiError('JOB_NOT_FOUND', 'Registered adapter runner probe was not found before private runner execution.', 404)
      }

      const boundedAdapterExecutionRun = mockBoundedAdapterExecutionRunsById.get(registeredRunnerRun.boundedAdapterExecutionRunId)
      if (!boundedAdapterExecutionRun) {
        throw new ApiError('JOB_NOT_FOUND', 'Bounded adapter execution handoff was not found before private runner execution.', 404)
      }

      if (registeredRunnerRun.workspaceId !== input.workspaceId || registeredRunnerRun.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter private runner execution must match the runner probe workspace and project.', 400, {
          runWorkspaceId: registeredRunnerRun.workspaceId,
          runProjectId: registeredRunnerRun.projectId,
        })
      }

      if (registeredRunnerRun.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Registered adapter private runner execution must use the runner probe credit reservation.', 409, {
          runnerCreditReservationId: registeredRunnerRun.creditReservationId,
        })
      }

      if (registeredRunnerRun.completedImportProbeCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Registered adapter private runner execution requires at least one completed import probe before partial private QA can continue.', 409, {
          runStatus: registeredRunnerRun.status,
          blockers: registeredRunnerRun.blockers,
          nextRequiredGate: registeredRunnerRun.nextRequiredGate,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/registered-runner-runs/:registeredRunnerRunId/private-media-runner-execution',
        registeredRunnerRunId: input.registeredRunnerRunId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        privateMediaExecutionOnly: input.privateMediaExecutionOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockRegisteredAdapterPrivateMediaRunnerRunsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different registered adapter private runner execution request.', 409)
      }

      if (existing) {
        mockRegisteredAdapterPrivateMediaRunnerRunsById.set(existing.privateMediaRunnerRun.id, existing.privateMediaRunnerRun)
        return {
          privateMediaRunnerRun: existing.privateMediaRunnerRun,
          warnings: [
            mockWarning('Registered adapter private runner execution'),
            'Idempotent registered adapter private runner execution replay returned the original result without duplicate work.',
          ],
        }
      }

      const privateMediaRunnerRun = createProfessionalToolAdapterPrivateMediaRunnerRun({
        registeredRunnerRun,
        boundedAdapterExecutionRun,
        privateMediaExecutionOnly: true,
      })

      if (privateMediaRunnerRun.status !== 'private_runner_manifest_ready') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Registered adapter private runner execution is blocked until runner and package lineage checks pass.', 409, {
          blockers: privateMediaRunnerRun.blockers,
          nextRequiredGate: privateMediaRunnerRun.nextRequiredGate,
        })
      }

      mockRegisteredAdapterPrivateMediaRunnerRunsByIdempotency.set(cacheKey, {
        requestHash,
        privateMediaRunnerRun,
      })
      mockRegisteredAdapterPrivateMediaRunnerRunsById.set(privateMediaRunnerRun.id, privateMediaRunnerRun)

      return {
        privateMediaRunnerRun,
        warnings: [
          mockWarning('Registered adapter private runner execution'),
          'Registered adapter private runner execution recorded backend runner/private manifest lineage only. Adapter-specific media transforms remain a later worker implementation gate.',
        ],
      }
    },

    async reviewRegisteredAdapterPrivateMediaRunnerQa(input: ReviewApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Registered adapter private runner QA review requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for registered adapter private runner QA review.', 400)
      }

      if (input.qaReviewOnly !== true) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter private runner QA review must be explicitly qaReviewOnly=true.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Registered adapter private runner QA review requires backend persistence before non-mock mode can record adapter QA artifacts.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const privateMediaRunnerRun = mockRegisteredAdapterPrivateMediaRunnerRunsById.get(input.privateMediaRunnerRunId)
      if (!privateMediaRunnerRun) {
        throw new ApiError('JOB_NOT_FOUND', 'Registered adapter private runner execution was not found before QA review.', 404)
      }

      if (privateMediaRunnerRun.workspaceId !== input.workspaceId || privateMediaRunnerRun.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Registered adapter private runner QA review must match the private runner workspace and project.', 400, {
          runWorkspaceId: privateMediaRunnerRun.workspaceId,
          runProjectId: privateMediaRunnerRun.projectId,
        })
      }

      if (privateMediaRunnerRun.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Registered adapter private runner QA review must use the private runner credit reservation.', 409, {
          runnerCreditReservationId: privateMediaRunnerRun.creditReservationId,
        })
      }

      if (privateMediaRunnerRun.status !== 'private_runner_manifest_ready') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Registered adapter private runner QA review requires private runner manifests to be ready.', 409, {
          runStatus: privateMediaRunnerRun.status,
          blockers: privateMediaRunnerRun.blockers,
          nextRequiredGate: privateMediaRunnerRun.nextRequiredGate,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/private-media-runner-runs/:privateMediaRunnerRunId/qa-review',
        privateMediaRunnerRunId: input.privateMediaRunnerRunId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        qaReviewOnly: input.qaReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockRegisteredAdapterPrivateMediaRunnerQaReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different registered adapter private runner QA review request.', 409)
      }

      if (existing) {
        mockRegisteredAdapterPrivateMediaRunnerQaReviewsById.set(existing.privateMediaRunnerQaReview.id, existing.privateMediaRunnerQaReview)
        mockRegisteredAdapterPrivateMediaRunnerQaReviewsByPrivateRunnerRunId.set(existing.privateMediaRunnerQaReview.privateMediaRunnerRunId, existing.privateMediaRunnerQaReview)
        return {
          privateMediaRunnerQaReview: existing.privateMediaRunnerQaReview,
          warnings: [
            mockWarning('Registered adapter private runner QA review'),
            'Idempotent registered adapter private runner QA review replay returned the original result without duplicate artifacts.',
          ],
        }
      }

      const privateMediaRunnerQaReview = await createRegisteredAdapterPrivateMediaRunnerQaReview({
        privateMediaRunnerRun,
        localStorageRoot: context.env.localStorageRoot,
        createdAt: nowIso(),
      })

      if (privateMediaRunnerQaReview.status !== 'private_adapter_result_qa_passed_waiting_final_render_integration') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Registered adapter private runner QA review is blocked until manifest artifacts pass private QA.', 409, {
          blockers: privateMediaRunnerQaReview.blockers,
          nextRequiredGate: privateMediaRunnerQaReview.nextRequiredGate,
        })
      }

      mockRegisteredAdapterPrivateMediaRunnerQaReviewsByIdempotency.set(cacheKey, {
        requestHash,
        privateMediaRunnerQaReview,
      })
      mockRegisteredAdapterPrivateMediaRunnerQaReviewsById.set(privateMediaRunnerQaReview.id, privateMediaRunnerQaReview)
      mockRegisteredAdapterPrivateMediaRunnerQaReviewsByPrivateRunnerRunId.set(privateMediaRunnerRun.id, privateMediaRunnerQaReview)

      return {
        privateMediaRunnerQaReview,
        warnings: [
          mockWarning('Registered adapter private runner QA review'),
          'Registered adapter private runner QA review persisted private JSON evidence only. Adapter-specific media transforms and final render integration remain later backend worker gates.',
        ],
      }
    },

    async createAdapterWorkerArtifactIntegration(input: CreateApprovedEditExecutionAdapterWorkerArtifactIntegrationInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Adapter worker artifact integration requires an authenticated backend caller.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for adapter worker artifact integration.', 400)
      }

      if (input.integrationOnly !== true) {
        throw new ApiError('VALIDATION_FAILED', 'Adapter worker artifact integration must be explicitly integrationOnly=true.', 400)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Adapter worker artifact integration requires backend persistence before non-mock mode can record private render integration manifests.',
          202,
          { requiredBackendGate: 'approved_edit_execution_package_persistence' },
        )
      }

      const privateMediaRunnerQaReview = mockRegisteredAdapterPrivateMediaRunnerQaReviewsById.get(input.privateMediaRunnerQaReviewId)
      if (!privateMediaRunnerQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Registered adapter private runner QA review was not found before artifact integration.', 404)
      }

      if (privateMediaRunnerQaReview.workspaceId !== input.workspaceId || privateMediaRunnerQaReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Adapter worker artifact integration must match the private runner QA workspace and project.', 400, {
          qaWorkspaceId: privateMediaRunnerQaReview.workspaceId,
          qaProjectId: privateMediaRunnerQaReview.projectId,
        })
      }

      if (privateMediaRunnerQaReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Adapter worker artifact integration must use the private runner QA credit reservation.', 409, {
          qaCreditReservationId: privateMediaRunnerQaReview.creditReservationId,
        })
      }

      if (privateMediaRunnerQaReview.status !== 'private_adapter_result_qa_passed_waiting_final_render_integration' || privateMediaRunnerQaReview.artifactCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Adapter worker artifact integration requires a passed private runner QA review with private artifacts.', 409, {
          qaStatus: privateMediaRunnerQaReview.status,
          artifactCount: privateMediaRunnerQaReview.artifactCount,
          nextRequiredGate: privateMediaRunnerQaReview.nextRequiredGate,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/private-runner-qa-reviews/:privateMediaRunnerQaReviewId/adapter-worker-artifact-integration',
        privateMediaRunnerQaReviewId: input.privateMediaRunnerQaReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        integrationOnly: input.integrationOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockAdapterWorkerArtifactIntegrationsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different adapter worker artifact integration request.', 409)
      }

      if (existing) {
        mockAdapterWorkerArtifactIntegrationsById.set(existing.adapterWorkerArtifactIntegration.id, existing.adapterWorkerArtifactIntegration)
        mockAdapterWorkerArtifactIntegrationsByPrivateRunnerQaReviewId.set(
          existing.adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId,
          existing.adapterWorkerArtifactIntegration,
        )
        return {
          adapterWorkerArtifactIntegration: existing.adapterWorkerArtifactIntegration,
          warnings: [
            mockWarning('Adapter worker artifact integration'),
            'Idempotent adapter worker artifact integration replay returned the original private render integration manifest without duplicate writes.',
          ],
        }
      }

      const adapterWorkerArtifactIntegration = await createAdapterWorkerArtifactIntegrationFromQaReview({
        privateMediaRunnerQaReview,
        localStorageRoot: context.env.localStorageRoot,
        createdAt: nowIso(),
      })

      mockAdapterWorkerArtifactIntegrationsByIdempotency.set(cacheKey, {
        requestHash,
        adapterWorkerArtifactIntegration,
      })
      mockAdapterWorkerArtifactIntegrationsById.set(adapterWorkerArtifactIntegration.id, adapterWorkerArtifactIntegration)
      mockAdapterWorkerArtifactIntegrationsByPrivateRunnerQaReviewId.set(privateMediaRunnerQaReview.id, adapterWorkerArtifactIntegration)

      return {
        adapterWorkerArtifactIntegration,
        warnings: [
          mockWarning('Adapter worker artifact integration'),
          'Adapter worker artifact integration verified private QA artifacts and wrote a private render integration manifest only. Media transforms, public delivery, and production remain blocked.',
        ],
      }
    },

    async createJobBatchPlan(input: CreateApprovedEditExecutionJobBatchPlanInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution job batch planning requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution job batch planning.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before job batch planning.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution job batch persistence is not available yet. Add transactional job batch storage before enabling non-mock job planning.',
          202,
          { requiredBackendGate: 'approved_edit_execution_job_batch_persistence' },
        )
      }

      const approvedEditExecutionPackage = mockPackagesById.get(input.packageRecordId)
      if (!approvedEditExecutionPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved edit execution package must exist before job batch planning.', 404)
      }

      if (approvedEditExecutionPackage.workspaceId !== input.workspaceId || approvedEditExecutionPackage.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Job batch planning workspace/project must match the approved edit execution package.', 400, {
          packageWorkspaceId: approvedEditExecutionPackage.workspaceId,
          packageProjectId: approvedEditExecutionPackage.projectId,
        })
      }

      if (approvedEditExecutionPackage.creditReservationId && approvedEditExecutionPackage.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Job batch planning credit reservation must match the approved edit execution package.', 409, {
          packageCreditReservationId: approvedEditExecutionPackage.creditReservationId,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/packages/:packageRecordId/job-batch-plan',
        packageRecordId: input.packageRecordId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        dryRunOnly: input.dryRunOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockJobBatchPlansByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different edit execution job batch planning request.', 409)
      }

      if (existing) {
        return {
          jobBatchPlan: existing.jobBatchPlan,
          warnings: [
            mockWarning('Approved edit execution job batch planning'),
            'Idempotent job batch planning replay returned the original plan without duplicate job records.',
          ],
        }
      }

      const jobBatchPlan = createJobBatchPlanFromPackage({
        packageRecordId: input.packageRecordId,
        approvedEditExecutionPackage,
        creditReservationId: input.creditReservationId,
      })
      const stored = { requestHash, jobBatchPlan }
      mockJobBatchPlansByIdempotency.set(cacheKey, stored)
      mockJobBatchPlansById.set(jobBatchPlan.id, jobBatchPlan)

      return {
        jobBatchPlan,
        warnings: [
          mockWarning('Approved edit execution job batch planning'),
          'No worker leases, handlers, providers, media processors, render jobs, Supabase/GCS writes, or billing mutations were started.',
        ],
      }
    },

    async createMockQueue(input: CreateApprovedEditExecutionMockQueueInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution mock queue creation requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution mock queue creation.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before mock queue creation.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution queue persistence is not available yet. Add transactional queue storage before enabling non-mock queue creation.',
          202,
          { requiredBackendGate: 'approved_edit_execution_queue_persistence' },
        )
      }

      const jobBatchPlan = mockJobBatchPlansById.get(input.jobBatchPlanId)
      if (!jobBatchPlan) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution job batch plan was not found in mock storage.', 404)
      }

      if (jobBatchPlan.workspaceId !== input.workspaceId || jobBatchPlan.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Mock queue workspace/project must match the job batch plan.', 400, {
          batchWorkspaceId: jobBatchPlan.workspaceId,
          batchProjectId: jobBatchPlan.projectId,
        })
      }

      if (jobBatchPlan.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Mock queue credit reservation must match the job batch plan.', 409, {
          batchCreditReservationId: jobBatchPlan.creditReservationId,
        })
      }

      if (jobBatchPlan.status !== 'ready_for_mock_queue_review') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Job batch plan is not ready for mock queue creation.', 409, {
          status: jobBatchPlan.status,
          blockers: jobBatchPlan.blockers,
        })
      }

      if (jobBatchPlan.readyToQueueCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No planned jobs are ready to queue yet.', 409, {
          waitingDependencyCount: jobBatchPlan.waitingDependencyCount,
          blockedJobCount: jobBatchPlan.blockedJobCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/job-batch-plans/:jobBatchPlanId/mock-queue',
        jobBatchPlanId: input.jobBatchPlanId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        mockQueueOnly: input.mockQueueOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockQueuesByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different edit execution mock queue request.', 409)
      }

      if (existing) {
        return {
          mockQueue: existing.mockQueue,
          warnings: [
            mockWarning('Approved edit execution mock queue creation'),
            'Idempotent mock queue replay returned the original queue without duplicate jobs.',
          ],
        }
      }

      const mockQueue = createMockQueueFromJobBatchPlan(jobBatchPlan)
      const stored = { requestHash, mockQueue }
      mockQueuesByIdempotency.set(cacheKey, stored)
      mockQueuesById.set(mockQueue.id, mockQueue)

      return {
        mockQueue,
        warnings: [
          mockWarning('Approved edit execution mock queue creation'),
          'Queued jobs are metadata only. No worker claim, handler, tool, provider, media, render, storage, or billing side effect occurred.',
        ],
      }
    },

    async createDispatchReadiness(input: CreateApprovedEditExecutionDispatchReadinessInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution dispatch readiness requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution dispatch readiness.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before dispatch readiness can be checked.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution dispatch readiness persistence is not available yet. Add backend queue/readiness storage before enabling non-mock dispatch readiness.',
          202,
          { requiredBackendGate: 'approved_edit_execution_dispatch_readiness_persistence' },
        )
      }

      const mockQueue = mockQueuesById.get(input.mockQueueId)
      if (!mockQueue) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution mock queue was not found in mock storage.', 404)
      }

      if (mockQueue.workspaceId !== input.workspaceId || mockQueue.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Dispatch readiness workspace/project must match the mock queue.', 400, {
          queueWorkspaceId: mockQueue.workspaceId,
          queueProjectId: mockQueue.projectId,
        })
      }

      if (mockQueue.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Dispatch readiness credit reservation must match the mock queue.', 409, {
          queueCreditReservationId: mockQueue.creditReservationId,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/mock-queues/:mockQueueId/dispatch-readiness',
        mockQueueId: input.mockQueueId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        dryRunOnly: input.dryRunOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockDispatchReadinessByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different dispatch readiness request.', 409)
      }

      if (existing) {
        mockDispatchReadinessById.set(existing.dispatchReadiness.id, existing.dispatchReadiness)
        return {
          dispatchReadiness: existing.dispatchReadiness,
          warnings: [
            mockWarning('Approved edit execution dispatch readiness'),
            'Idempotent dispatch readiness replay returned the original gate audit.',
          ],
        }
      }

      const dispatchReadiness = createDispatchReadinessFromMockQueue(mockQueue)
      mockDispatchReadinessByIdempotency.set(cacheKey, { requestHash, dispatchReadiness })
      mockDispatchReadinessById.set(dispatchReadiness.id, dispatchReadiness)

      return {
        dispatchReadiness,
        warnings: [
          mockWarning('Approved edit execution dispatch readiness'),
          'Gate audit completed without worker claims, worker handlers, tools, providers, media processing, rendering, storage writes, or billing mutations.',
        ],
      }
    },

    async createMockWorkerClaims(input: CreateApprovedEditExecutionMockWorkerClaimsInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution worker claims require an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution worker claim creation.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before worker claims can be created.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution worker claim persistence is not available yet. Add transactional claim storage before enabling non-mock worker claim creation.',
          202,
          { requiredBackendGate: 'approved_edit_execution_worker_claim_persistence' },
        )
      }

      const dispatchReadiness = mockDispatchReadinessById.get(input.dispatchReadinessId)
      if (!dispatchReadiness) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution dispatch readiness was not found in mock storage.', 404)
      }

      if (dispatchReadiness.workspaceId !== input.workspaceId || dispatchReadiness.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Worker claim workspace/project must match the dispatch readiness audit.', 400, {
          readinessWorkspaceId: dispatchReadiness.workspaceId,
          readinessProjectId: dispatchReadiness.projectId,
        })
      }

      if (dispatchReadiness.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Worker claim credit reservation must match the dispatch readiness audit.', 409, {
          readinessCreditReservationId: dispatchReadiness.creditReservationId,
        })
      }

      if (dispatchReadiness.status !== 'ready_for_worker_claim_review') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Dispatch readiness is blocked by required worker gates.', 409, {
          status: dispatchReadiness.status,
          blockers: dispatchReadiness.blockers,
        })
      }

      if (dispatchReadiness.readyForClaimCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No queued jobs are ready for worker claim review.', 409, {
          blockedByGateCount: dispatchReadiness.blockedByGateCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/dispatch-readiness/:dispatchReadinessId/mock-worker-claims',
        dispatchReadinessId: input.dispatchReadinessId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        workerInstanceId: input.workerInstanceId ?? context.env.workerInstanceId,
        mockClaimsOnly: input.mockClaimsOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockWorkerClaimsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different edit execution worker claim request.', 409)
      }

      if (existing) {
        mockWorkerClaimsById.set(existing.mockWorkerClaims.id, existing.mockWorkerClaims)
        return {
          mockWorkerClaims: existing.mockWorkerClaims,
          warnings: [
            mockWarning('Approved edit execution mock worker claims'),
            'Idempotent worker claim replay returned the original mock claim leases without duplicate claims.',
          ],
        }
      }

      const mockWorkerClaims = createMockWorkerClaimsFromDispatchReadiness({
        dispatchReadiness,
        workerInstanceId: input.workerInstanceId ?? context.env.workerInstanceId,
        leaseSeconds: context.env.workerClaimLeaseSeconds,
      })
      const stored = { requestHash, mockWorkerClaims }
      mockWorkerClaimsByIdempotency.set(cacheKey, stored)
      mockWorkerClaimsById.set(mockWorkerClaims.id, mockWorkerClaims)

      return {
        mockWorkerClaims,
        warnings: [
          mockWarning('Approved edit execution mock worker claims'),
          'Worker claim leases are mock metadata only. No worker handler, tool, provider, media processor, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createHandlerDryRun(input: CreateApprovedEditExecutionHandlerDryRunInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution handler dry-run requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution handler dry-run.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before handler dry-run can be created.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution handler result persistence is not available yet. Add transactional result, manifest, and QA storage before enabling non-mock handler execution.',
          202,
          { requiredBackendGate: 'approved_edit_execution_handler_result_persistence' },
        )
      }

      const mockWorkerClaims = mockWorkerClaimsById.get(input.mockWorkerClaimsId)
      if (!mockWorkerClaims) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution mock worker claims were not found in mock storage.', 404)
      }

      if (mockWorkerClaims.workspaceId !== input.workspaceId || mockWorkerClaims.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Handler dry-run workspace/project must match the mock worker claim group.', 400, {
          claimWorkspaceId: mockWorkerClaims.workspaceId,
          claimProjectId: mockWorkerClaims.projectId,
        })
      }

      if (mockWorkerClaims.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Handler dry-run credit reservation must match the mock worker claim group.', 409, {
          claimCreditReservationId: mockWorkerClaims.creditReservationId,
        })
      }

      if (mockWorkerClaims.status !== 'claimed_for_mock_worker_review' || mockWorkerClaims.claimCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Mock worker claims are not ready for handler dry-run.', 409, {
          status: mockWorkerClaims.status,
          claimCount: mockWorkerClaims.claimCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/mock-worker-claims/:mockWorkerClaimsId/handler-dry-run',
        mockWorkerClaimsId: input.mockWorkerClaimsId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        handlerDryRunOnly: input.handlerDryRunOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockHandlerDryRunsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different edit execution handler dry-run request.', 409)
      }

      if (existing) {
        mockHandlerDryRunsById.set(existing.handlerDryRun.id, existing.handlerDryRun)
        return {
          handlerDryRun: existing.handlerDryRun,
          warnings: [
            mockWarning('Approved edit execution handler dry-run'),
            'Idempotent handler dry-run replay returned the original work-result metadata without duplicate handler output.',
          ],
        }
      }

      const handlerDryRun = createHandlerDryRunFromMockWorkerClaims(mockWorkerClaims)
      mockHandlerDryRunsByIdempotency.set(cacheKey, { requestHash, handlerDryRun })
      mockHandlerDryRunsById.set(handlerDryRun.id, handlerDryRun)

      return {
        handlerDryRun,
        warnings: [
          mockWarning('Approved edit execution handler dry-run'),
          'Handler dry-run created result, manifest, and QA handoff metadata only. No worker handler, tool, provider, media processor, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createResultReconciliation(input: CreateApprovedEditExecutionResultReconciliationInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution result reconciliation requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit execution result reconciliation.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before result reconciliation can be created.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit execution result reconciliation persistence is not available yet. Add manifest, QA, and render-readiness storage before enabling non-mock reconciliation.',
          202,
          { requiredBackendGate: 'approved_edit_execution_result_reconciliation_persistence' },
        )
      }

      const handlerDryRun = mockHandlerDryRunsById.get(input.handlerDryRunId)
      if (!handlerDryRun) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution handler dry-run was not found in mock storage.', 404)
      }

      if (handlerDryRun.workspaceId !== input.workspaceId || handlerDryRun.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Result reconciliation workspace/project must match the handler dry-run.', 400, {
          handlerWorkspaceId: handlerDryRun.workspaceId,
          handlerProjectId: handlerDryRun.projectId,
        })
      }

      if (handlerDryRun.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Result reconciliation credit reservation must match the handler dry-run.', 409, {
          handlerCreditReservationId: handlerDryRun.creditReservationId,
        })
      }

      if (handlerDryRun.status !== 'dry_run_completed_ready_for_result_reconciliation') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Handler dry-run is not ready for result reconciliation.', 409, {
          status: handlerDryRun.status,
          blockers: handlerDryRun.blockers,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/handler-dry-runs/:handlerDryRunId/result-reconciliation',
        handlerDryRunId: input.handlerDryRunId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        reconcileDryRunOnly: input.reconcileDryRunOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockResultReconciliationsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different edit execution result reconciliation request.', 409)
      }

      if (existing) {
        mockResultReconciliationsById.set(existing.resultReconciliation.id, existing.resultReconciliation)
        return {
          resultReconciliation: existing.resultReconciliation,
          warnings: [
            mockWarning('Approved edit execution result reconciliation'),
            'Idempotent result reconciliation replay returned the original manifest and QA readiness metadata.',
          ],
        }
      }

      const resultReconciliation = createResultReconciliationFromHandlerDryRun(handlerDryRun)
      mockResultReconciliationsByIdempotency.set(cacheKey, { requestHash, resultReconciliation })
      mockResultReconciliationsById.set(resultReconciliation.id, resultReconciliation)

      return {
        resultReconciliation,
        warnings: [
          mockWarning('Approved edit execution result reconciliation'),
          'Result reconciliation reviewed dry-run metadata only. No worker handler, tool, provider, media processor, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createLocalWorkerOutput(input: CreateApprovedEditExecutionLocalWorkerOutputInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution local worker output persistence requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for local worker output persistence.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before local worker output persistence.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Local worker output persistence is not a production artifact store. Add private artifact storage tables and storage adapters before enabling non-mock persistence.',
          202,
          { requiredBackendGate: 'private_worker_artifact_persistence' },
        )
      }

      const resultReconciliation = mockResultReconciliationsById.get(input.resultReconciliationId)
      if (!resultReconciliation) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit execution result reconciliation was not found in mock storage.', 404)
      }

      if (resultReconciliation.workspaceId !== input.workspaceId || resultReconciliation.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Local worker output workspace/project must match the result reconciliation.', 400, {
          reconciliationWorkspaceId: resultReconciliation.workspaceId,
          reconciliationProjectId: resultReconciliation.projectId,
        })
      }

      if (resultReconciliation.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Local worker output credit reservation must match the result reconciliation.', 409, {
          reconciliationCreditReservationId: resultReconciliation.creditReservationId,
        })
      }

      if (resultReconciliation.status !== 'reconciled_dry_run_waiting_real_worker_outputs') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Result reconciliation is not ready for local worker output persistence.', 409, {
          status: resultReconciliation.status,
          blockers: resultReconciliation.blockers,
        })
      }

      if (resultReconciliation.manifestItemCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No reconciled manifest items are available for local worker output persistence.', 409, {
          manifestItemCount: resultReconciliation.manifestItemCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/result-reconciliations/:resultReconciliationId/local-worker-output',
        resultReconciliationId: input.resultReconciliationId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        localOutputOnly: input.localOutputOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockLocalWorkerOutputsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different local worker output persistence request.', 409)
      }

      if (existing) {
        mockLocalWorkerOutputsById.set(existing.localWorkerOutput.id, existing.localWorkerOutput)
        return {
          localWorkerOutput: existing.localWorkerOutput,
          warnings: [
            mockWarning('Approved edit execution local worker output persistence'),
            'Idempotent local worker output replay returned the original persisted private metadata records without duplicate writes.',
          ],
        }
      }

      const localWorkerOutput = await createLocalWorkerOutputFromResultReconciliation({
        resultReconciliation,
        localStorageRoot: context.env.localStorageRoot,
      })
      mockLocalWorkerOutputsByIdempotency.set(cacheKey, { requestHash, localWorkerOutput })
      mockLocalWorkerOutputsById.set(localWorkerOutput.id, localWorkerOutput)

      return {
        localWorkerOutput,
        warnings: [
          mockWarning('Approved edit execution local worker output persistence'),
          'Local worker output persistence wrote private metadata records only. No media processor, tool/provider call, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createLocalWorkerOutputQaReview(input: CreateApprovedEditExecutionLocalWorkerOutputQaReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution local worker output QA review requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for local worker output QA review.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before local worker output QA review.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Local worker output QA review requires persisted private artifact QA tables before non-mock mode can use it.',
          202,
          { requiredBackendGate: 'private_worker_artifact_qa_persistence' },
        )
      }

      const localWorkerOutput = mockLocalWorkerOutputsById.get(input.localWorkerOutputId)
      if (!localWorkerOutput) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit local worker output was not found in mock storage.', 404)
      }

      if (localWorkerOutput.workspaceId !== input.workspaceId || localWorkerOutput.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Local worker output QA workspace/project must match the local worker output.', 400, {
          localOutputWorkspaceId: localWorkerOutput.workspaceId,
          localOutputProjectId: localWorkerOutput.projectId,
        })
      }

      if (localWorkerOutput.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Local worker output QA credit reservation must match the local worker output.', 409, {
          localOutputCreditReservationId: localWorkerOutput.creditReservationId,
        })
      }

      if (localWorkerOutput.status !== 'local_worker_outputs_persisted_waiting_qa') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Local worker output is not ready for QA review.', 409, {
          status: localWorkerOutput.status,
          blockers: localWorkerOutput.blockers,
        })
      }

      if (localWorkerOutput.persistedArtifactCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No persisted local worker output metadata artifacts are available for QA review.', 409, {
          persistedArtifactCount: localWorkerOutput.persistedArtifactCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/local-worker-outputs/:localWorkerOutputId/qa-review',
        localWorkerOutputId: input.localWorkerOutputId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        qaReviewOnly: input.qaReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockLocalWorkerOutputQaReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different local worker output QA review request.', 409)
      }

      if (existing) {
        mockLocalWorkerOutputQaReviewsById.set(existing.localWorkerOutputQaReview.id, existing.localWorkerOutputQaReview)
        mockLocalWorkerOutputQaReviewsByLocalOutputId.set(existing.localWorkerOutputQaReview.localWorkerOutputId, existing.localWorkerOutputQaReview)
        return {
          localWorkerOutputQaReview: existing.localWorkerOutputQaReview,
          warnings: [
            mockWarning('Approved edit execution local worker output QA review'),
            'Idempotent local worker output QA replay returned the original metadata review without duplicate QA records.',
          ],
        }
      }

      const localWorkerOutputQaReview = createLocalWorkerOutputQaReviewFromLocalWorkerOutput(localWorkerOutput)
      mockLocalWorkerOutputQaReviewsByIdempotency.set(cacheKey, { requestHash, localWorkerOutputQaReview })
      mockLocalWorkerOutputQaReviewsById.set(localWorkerOutputQaReview.id, localWorkerOutputQaReview)
      mockLocalWorkerOutputQaReviewsByLocalOutputId.set(localWorkerOutput.id, localWorkerOutputQaReview)

      return {
        localWorkerOutputQaReview,
        warnings: [
          mockWarning('Approved edit execution local worker output QA review'),
          'Local worker output QA reviewed private metadata records only. No media processor, tool/provider call, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createWorkflowRehearsal(input: CreateApprovedEditExecutionWorkflowRehearsalInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit execution workflow rehearsal requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved edit workflow rehearsal.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before workflow rehearsal.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Approved edit workflow rehearsal is not production worker orchestration. Add persisted job graph execution before enabling non-mock workflow execution.',
          202,
          { requiredBackendGate: 'approved_edit_uploaded_media_worker_execution' },
        )
      }

      const localWorkerOutput = mockLocalWorkerOutputsById.get(input.localWorkerOutputId)
      if (!localWorkerOutput) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit local worker output was not found in mock storage.', 404)
      }

      if (localWorkerOutput.workspaceId !== input.workspaceId || localWorkerOutput.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Workflow rehearsal workspace/project must match the local worker output.', 400, {
          localOutputWorkspaceId: localWorkerOutput.workspaceId,
          localOutputProjectId: localWorkerOutput.projectId,
        })
      }

      if (localWorkerOutput.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Workflow rehearsal credit reservation must match the local worker output.', 409, {
          localOutputCreditReservationId: localWorkerOutput.creditReservationId,
        })
      }

      if (localWorkerOutput.status !== 'local_worker_outputs_persisted_waiting_qa') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Local worker output is not ready for production workflow rehearsal.', 409, {
          status: localWorkerOutput.status,
          blockers: localWorkerOutput.blockers,
        })
      }

      const scenarioId = input.scenarioId?.trim() || 'talking-head-clean-edit'
      try {
        getProductionWorkflowScenario(scenarioId)
      } catch (error) {
        throw new ApiError('VALIDATION_FAILED', `Unknown production workflow rehearsal scenario: ${scenarioId}`, 400, {
          scenarioId,
          message: error instanceof Error ? error.message : 'Unknown scenario',
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/local-worker-outputs/:localWorkerOutputId/workflow-rehearsal',
        localWorkerOutputId: input.localWorkerOutputId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        scenarioId,
        rehearsalOnly: input.rehearsalOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockWorkflowRehearsalsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different workflow rehearsal request.', 409)
      }

      if (existing) {
        mockWorkflowRehearsalsById.set(existing.workflowRehearsal.id, existing.workflowRehearsal)
        return {
          workflowRehearsal: existing.workflowRehearsal,
          warnings: [
            mockWarning('Approved edit workflow rehearsal'),
            'Idempotent workflow rehearsal replay returned the original dry-run report without duplicate stage execution.',
          ],
        }
      }

      const workflowRehearsal = await createWorkflowRehearsalFromLocalWorkerOutput({
        localWorkerOutput,
        localWorkerOutputQaReview: mockLocalWorkerOutputQaReviewsByLocalOutputId.get(localWorkerOutput.id),
        scenarioId,
      })
      mockWorkflowRehearsalsByIdempotency.set(cacheKey, { requestHash, workflowRehearsal })
      mockWorkflowRehearsalsById.set(workflowRehearsal.id, workflowRehearsal)

      return {
        workflowRehearsal,
        warnings: [
          mockWarning('Approved edit workflow rehearsal'),
          'Workflow rehearsal ran the production workflow in dry-run mode only. No uploaded media was processed and no worker/tool/render/Supabase/GCS/billing side effect occurred.',
        ],
      }
    },

    async createUploadedMediaWorkerExecution(input: CreateApprovedEditExecutionUploadedMediaWorkerExecutionInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit uploaded-media worker execution requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for uploaded-media worker execution.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before uploaded-media worker execution.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Uploaded-media worker execution currently persists metadata only. Add private media worker execution and artifact storage before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'uploaded_media_worker_execution_with_private_artifact_outputs' },
        )
      }

      const workflowRehearsal = mockWorkflowRehearsalsById.get(input.workflowRehearsalId)
      if (!workflowRehearsal) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit workflow rehearsal was not found in mock storage.', 404)
      }

      const localWorkerOutput = mockLocalWorkerOutputsById.get(input.localWorkerOutputId)
      if (!localWorkerOutput) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit local worker output was not found in mock storage.', 404)
      }

      const localWorkerOutputQaReview = mockLocalWorkerOutputQaReviewsById.get(input.localWorkerOutputQaReviewId)
      if (!localWorkerOutputQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit local worker output QA review was not found in mock storage.', 404)
      }

      if (workflowRehearsal.localWorkerOutputId !== input.localWorkerOutputId || localWorkerOutputQaReview.localWorkerOutputId !== input.localWorkerOutputId) {
        throw new ApiError('VALIDATION_FAILED', 'Uploaded-media worker execution must reference matching workflow, local output, and local output QA review records.', 400, {
          workflowLocalWorkerOutputId: workflowRehearsal.localWorkerOutputId,
          qaLocalWorkerOutputId: localWorkerOutputQaReview.localWorkerOutputId,
        })
      }

      if (workflowRehearsal.workspaceId !== input.workspaceId || workflowRehearsal.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Uploaded-media worker execution workspace/project must match the workflow rehearsal.', 400, {
          workflowWorkspaceId: workflowRehearsal.workspaceId,
          workflowProjectId: workflowRehearsal.projectId,
        })
      }

      if (workflowRehearsal.creditReservationId !== input.creditReservationId || localWorkerOutputQaReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Uploaded-media worker execution credit reservation must match workflow and QA records.', 409, {
          workflowCreditReservationId: workflowRehearsal.creditReservationId,
          qaCreditReservationId: localWorkerOutputQaReview.creditReservationId,
        })
      }

      if (localWorkerOutputQaReview.status !== 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Local worker output metadata QA must pass before uploaded-media worker execution metadata can be created.', 409, {
          status: localWorkerOutputQaReview.status,
          blockers: localWorkerOutputQaReview.blockers,
        })
      }

      if (workflowRehearsal.localOutputQaStatus !== 'passed_metadata_integrity_only') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Workflow rehearsal must see local output metadata QA as passed before uploaded-media worker execution.', 409, {
          localOutputQaStatus: workflowRehearsal.localOutputQaStatus,
        })
      }

      validateUploadedMediaSourceAssets(input.sourceMediaAssets)
      const approvedSnapshot = mockApprovedSnapshotsByPackageRecordId.get(workflowRehearsal.packageRecordId)
      validateUploadedMediaSourceAssetsAgainstApprovedSnapshot(input.sourceMediaAssets, approvedSnapshot)

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/workflow-rehearsals/:workflowRehearsalId/uploaded-media-worker-execution',
        workflowRehearsalId: input.workflowRehearsalId,
        localWorkerOutputId: input.localWorkerOutputId,
        localWorkerOutputQaReviewId: input.localWorkerOutputQaReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        uploadedMediaExecutionOnly: input.uploadedMediaExecutionOnly,
        sourceMediaAssets: input.sourceMediaAssets,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockUploadedMediaWorkerExecutionsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different uploaded-media worker execution request.', 409)
      }

      if (existing) {
        mockUploadedMediaWorkerExecutionsById.set(existing.uploadedMediaWorkerExecution.id, existing.uploadedMediaWorkerExecution)
        return {
          uploadedMediaWorkerExecution: existing.uploadedMediaWorkerExecution,
          warnings: [
            mockWarning('Approved edit uploaded-media worker execution'),
            'Idempotent uploaded-media worker execution replay returned the original private artifact metadata without duplicate writes.',
          ],
        }
      }

      const uploadedMediaWorkerExecution = await createUploadedMediaWorkerExecutionFromWorkflowRehearsal({
        workflowRehearsal,
        localWorkerOutput,
        localWorkerOutputQaReview,
        sourceMediaAssets: input.sourceMediaAssets,
        localStorageRoot: context.env.localStorageRoot,
      })
      mockUploadedMediaWorkerExecutionsByIdempotency.set(cacheKey, { requestHash, uploadedMediaWorkerExecution })
      mockUploadedMediaWorkerExecutionsById.set(uploadedMediaWorkerExecution.id, uploadedMediaWorkerExecution)

      return {
        uploadedMediaWorkerExecution,
        warnings: [
          mockWarning('Approved edit uploaded-media worker execution'),
          'Uploaded-media worker execution persisted source-bound private artifact metadata only. No media bytes were decoded, transformed, rendered, uploaded, or delivered.',
        ],
      }
    },

    async createPrivateWorkerArtifactQaReview(input: CreateApprovedEditExecutionPrivateWorkerArtifactQaReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit private worker artifact QA review requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for private worker artifact QA review.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before private worker artifact QA review.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Private worker artifact QA review currently validates metadata only. Add persisted media artifact QA tables before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'private_media_artifact_qa_persistence' },
        )
      }

      const uploadedMediaWorkerExecution = mockUploadedMediaWorkerExecutionsById.get(input.uploadedMediaWorkerExecutionId)
      if (!uploadedMediaWorkerExecution) {
        throw new ApiError('JOB_NOT_FOUND', 'Approved edit uploaded-media worker execution was not found in mock storage.', 404)
      }

      if (uploadedMediaWorkerExecution.workspaceId !== input.workspaceId || uploadedMediaWorkerExecution.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Private worker artifact QA workspace/project must match uploaded-media worker execution.', 400, {
          uploadedExecutionWorkspaceId: uploadedMediaWorkerExecution.workspaceId,
          uploadedExecutionProjectId: uploadedMediaWorkerExecution.projectId,
        })
      }

      if (uploadedMediaWorkerExecution.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Private worker artifact QA credit reservation must match uploaded-media worker execution.', 409, {
          uploadedExecutionCreditReservationId: uploadedMediaWorkerExecution.creditReservationId,
        })
      }

      if (uploadedMediaWorkerExecution.status !== 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Uploaded-media worker execution metadata is not ready for private worker artifact QA.', 409, {
          status: uploadedMediaWorkerExecution.status,
          blockers: uploadedMediaWorkerExecution.blockers,
        })
      }

      if (uploadedMediaWorkerExecution.privateWorkerArtifactCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No private worker-output metadata artifacts are available for QA review.', 409, {
          privateWorkerArtifactCount: uploadedMediaWorkerExecution.privateWorkerArtifactCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/uploaded-media-worker-executions/:uploadedMediaWorkerExecutionId/private-artifact-qa-review',
        uploadedMediaWorkerExecutionId: input.uploadedMediaWorkerExecutionId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        qaReviewOnly: input.qaReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockPrivateWorkerArtifactQaReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different private worker artifact QA review request.', 409)
      }

      if (existing) {
        mockPrivateWorkerArtifactQaReviewsByUploadedExecutionId.set(existing.privateWorkerArtifactQaReview.uploadedMediaWorkerExecutionId, existing.privateWorkerArtifactQaReview)
        mockPrivateWorkerArtifactQaReviewsById.set(existing.privateWorkerArtifactQaReview.id, existing.privateWorkerArtifactQaReview)
        return {
          privateWorkerArtifactQaReview: existing.privateWorkerArtifactQaReview,
          warnings: [
            mockWarning('Approved edit private worker artifact QA review'),
            'Idempotent private worker artifact QA replay returned the original metadata review without duplicate QA records.',
          ],
        }
      }

      const privateWorkerArtifactQaReview = createPrivateWorkerArtifactQaReviewFromUploadedMediaExecution(uploadedMediaWorkerExecution)
      mockPrivateWorkerArtifactQaReviewsByIdempotency.set(cacheKey, { requestHash, privateWorkerArtifactQaReview })
      mockPrivateWorkerArtifactQaReviewsByUploadedExecutionId.set(uploadedMediaWorkerExecution.id, privateWorkerArtifactQaReview)
      mockPrivateWorkerArtifactQaReviewsById.set(privateWorkerArtifactQaReview.id, privateWorkerArtifactQaReview)

      return {
        privateWorkerArtifactQaReview,
        warnings: [
          mockWarning('Approved edit private worker artifact QA review'),
          'Private worker artifact QA reviewed source-bound private metadata only. No media processor, tool/provider call, renderer, Supabase/GCS write, or billing mutation was started.',
        ],
      }
    },

    async createLocalMediaProcessingExecution(input: CreateApprovedEditExecutionLocalMediaProcessingExecutionInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit local media processing requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for local media processing execution.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before local media processing execution.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Local media processing execution currently writes local private artifacts only. Add persisted media artifact tables and worker orchestration before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'private_media_processing_persistence' },
        )
      }

      if (context.env.storageMode !== 'local' && context.env.storageMode !== 'gcs') {
        throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Local media processing execution requires local private storage or a GCS source adapter.', 202, {
          storageMode: context.env.storageMode,
          requiredBackendGate: 'private_media_processing_storage_adapter',
        })
      }

      const privateWorkerArtifactQaReview = mockPrivateWorkerArtifactQaReviewsById.get(input.privateWorkerArtifactQaReviewId)
      if (!privateWorkerArtifactQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Private worker artifact QA review was not found in mock storage.', 404)
      }

      if (privateWorkerArtifactQaReview.workspaceId !== input.workspaceId || privateWorkerArtifactQaReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Local media processing workspace/project must match private worker artifact QA review.', 400, {
          qaWorkspaceId: privateWorkerArtifactQaReview.workspaceId,
          qaProjectId: privateWorkerArtifactQaReview.projectId,
        })
      }

      if (privateWorkerArtifactQaReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Local media processing credit reservation must match private worker artifact QA review.', 409, {
          qaCreditReservationId: privateWorkerArtifactQaReview.creditReservationId,
        })
      }

      if (privateWorkerArtifactQaReview.status !== 'private_worker_artifact_qa_passed_waiting_real_media_processing') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private worker artifact metadata QA must pass before local media processing execution.', 409, {
          status: privateWorkerArtifactQaReview.status,
          blockers: privateWorkerArtifactQaReview.blockers,
        })
      }

      const uploadedMediaWorkerExecution = mockUploadedMediaWorkerExecutionsById.get(privateWorkerArtifactQaReview.uploadedMediaWorkerExecutionId)
      if (!uploadedMediaWorkerExecution) {
        throw new ApiError('JOB_NOT_FOUND', 'Uploaded-media worker execution for private artifact QA was not found in mock storage.', 404)
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/private-worker-artifact-qa-reviews/:privateWorkerArtifactQaReviewId/local-media-processing-execution',
        privateWorkerArtifactQaReviewId: input.privateWorkerArtifactQaReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        processingExecutionOnly: input.processingExecutionOnly,
        processingMode: input.processingMode ?? 'bounded_preview_render',
        maxDurationSeconds: input.maxDurationSeconds,
        targetWidth: input.targetWidth,
        targetHeight: input.targetHeight,
        fps: input.fps,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockLocalMediaProcessingExecutionsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different local media processing execution request.', 409)
      }

      if (existing) {
        mockLocalMediaProcessingExecutionsById.set(existing.localMediaProcessingExecution.id, existing.localMediaProcessingExecution)
        return {
          localMediaProcessingExecution: existing.localMediaProcessingExecution,
          warnings: [
            mockWarning('Approved edit local media processing execution'),
            'Idempotent local media processing replay returned the original private media artifacts without duplicate media writes.',
          ],
        }
      }

      const toolWorkManifest = requirePackageToolWorkManifest(privateWorkerArtifactQaReview.packageRecordId)
      requireApprovedCoreToolOperation(toolWorkManifest, 'source_media_private_process')
      const localMediaProcessingExecution = await createLocalMediaProcessingExecutionFromPrivateArtifactQa({
        privateWorkerArtifactQaReview,
        uploadedMediaWorkerExecution,
        approvedSnapshot: mockApprovedSnapshotsByPackageRecordId.get(privateWorkerArtifactQaReview.packageRecordId),
        toolWorkManifest,
        localStorageRoot: context.env.localStorageRoot,
        sourceStorageAdapter: context.storageAdapter ?? createStorageAdapter(context.env),
        sourceMediaBucketName: resolveBucketName(context.env, 'source_media'),
        ffmpegBin: context.env.ffmpegBin,
        ffprobeBin: context.env.ffprobeBin,
        processingMode: input.processingMode,
        maxDurationSeconds: input.maxDurationSeconds,
        targetWidth: input.targetWidth,
        targetHeight: input.targetHeight,
        fps: input.fps,
      })
      mockLocalMediaProcessingExecutionsByIdempotency.set(cacheKey, { requestHash, localMediaProcessingExecution })
      mockLocalMediaProcessingExecutionsById.set(localMediaProcessingExecution.id, localMediaProcessingExecution)

      return {
        localMediaProcessingExecution,
        warnings: [
          mockWarning('Approved edit local media processing execution'),
          'Local media processing created private bounded preview artifacts only. No public export, Supabase/GCS write, provider call, or billing mutation was started.',
        ],
      }
    },

    async createPrivateMediaArtifactQaReview(input: CreateApprovedEditExecutionPrivateMediaArtifactQaReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit private media artifact QA review requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for private media artifact QA review.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before private media artifact QA review.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Private media artifact QA currently reviews local private artifacts only. Add persisted media QA tables before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'private_media_artifact_qa_persistence' },
        )
      }

      const localMediaProcessingExecution = mockLocalMediaProcessingExecutionsById.get(input.localMediaProcessingExecutionId)
      if (!localMediaProcessingExecution) {
        throw new ApiError('JOB_NOT_FOUND', 'Local media processing execution was not found in mock storage.', 404)
      }

      if (localMediaProcessingExecution.workspaceId !== input.workspaceId || localMediaProcessingExecution.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Private media artifact QA workspace/project must match local media processing execution.', 400, {
          processingWorkspaceId: localMediaProcessingExecution.workspaceId,
          processingProjectId: localMediaProcessingExecution.projectId,
        })
      }

      if (localMediaProcessingExecution.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Private media artifact QA credit reservation must match local media processing execution.', 409, {
          processingCreditReservationId: localMediaProcessingExecution.creditReservationId,
        })
      }

      if (localMediaProcessingExecution.status !== 'local_media_processing_execution_completed_waiting_private_media_artifact_qa') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Local media processing execution is not ready for private media artifact QA.', 409, {
          status: localMediaProcessingExecution.status,
          blockers: localMediaProcessingExecution.blockers,
        })
      }

      if (localMediaProcessingExecution.processedArtifactCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No private processed media artifacts are available for QA review.', 409, {
          processedArtifactCount: localMediaProcessingExecution.processedArtifactCount,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/local-media-processing-executions/:localMediaProcessingExecutionId/private-media-artifact-qa-review',
        localMediaProcessingExecutionId: input.localMediaProcessingExecutionId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        qaReviewOnly: input.qaReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockPrivateMediaArtifactQaReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different private media artifact QA review request.', 409)
      }

      if (existing) {
        mockPrivateMediaArtifactQaReviewsById.set(existing.privateMediaArtifactQaReview.id, existing.privateMediaArtifactQaReview)
        return {
          privateMediaArtifactQaReview: existing.privateMediaArtifactQaReview,
          warnings: [
            mockWarning('Approved edit private media artifact QA review'),
            'Idempotent private media artifact QA replay returned the original review without duplicate QA records.',
          ],
        }
      }

      const toolWorkManifest = requirePackageToolWorkManifest(localMediaProcessingExecution.packageRecordId)
      requireApprovedCoreToolOperation(toolWorkManifest, 'processed_media_private_qa_probe')
      const privateMediaArtifactQaReview = await createPrivateMediaArtifactQaReviewFromLocalProcessing(
        localMediaProcessingExecution,
        toolWorkManifest,
        context.env.ffprobeBin,
      )
      mockPrivateMediaArtifactQaReviewsByIdempotency.set(cacheKey, { requestHash, privateMediaArtifactQaReview })
      mockPrivateMediaArtifactQaReviewsById.set(privateMediaArtifactQaReview.id, privateMediaArtifactQaReview)

      return {
        privateMediaArtifactQaReview,
        warnings: [
          mockWarning('Approved edit private media artifact QA review'),
          'Private media artifact QA reviewed local private processed media artifacts only. Render preview assembly and final export remain blocked.',
        ],
      }
    },

    async createRenderPreviewAssembly(input: CreateApprovedEditExecutionRenderPreviewAssemblyInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit render preview assembly requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for render preview assembly.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before render preview assembly.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Render preview assembly currently writes a local private preview manifest only. Add persisted preview tables and storage orchestration before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'render_preview_assembly_persistence' },
        )
      }

      if (context.env.storageMode !== 'local' && context.env.storageMode !== 'gcs') {
        throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Render preview assembly requires local private artifact storage or a GCS source adapter with local private outputs.', 202, {
          storageMode: context.env.storageMode,
          requiredBackendGate: 'render_preview_storage_adapter',
        })
      }

      const privateMediaArtifactQaReview = mockPrivateMediaArtifactQaReviewsById.get(input.privateMediaArtifactQaReviewId)
      if (!privateMediaArtifactQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Private media artifact QA review was not found in mock storage.', 404)
      }

      if (privateMediaArtifactQaReview.workspaceId !== input.workspaceId || privateMediaArtifactQaReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Render preview assembly workspace/project must match private media artifact QA review.', 400, {
          qaWorkspaceId: privateMediaArtifactQaReview.workspaceId,
          qaProjectId: privateMediaArtifactQaReview.projectId,
        })
      }

      if (privateMediaArtifactQaReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Render preview assembly credit reservation must match private media artifact QA review.', 409, {
          qaCreditReservationId: privateMediaArtifactQaReview.creditReservationId,
        })
      }

      if (privateMediaArtifactQaReview.status !== 'private_media_artifact_qa_passed_waiting_render_preview_assembly') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private media artifact QA must pass before render preview assembly.', 409, {
          status: privateMediaArtifactQaReview.status,
          blockers: privateMediaArtifactQaReview.blockers,
        })
      }

      const localMediaProcessingExecution = mockLocalMediaProcessingExecutionsById.get(privateMediaArtifactQaReview.localMediaProcessingExecutionId)
      if (!localMediaProcessingExecution) {
        throw new ApiError('JOB_NOT_FOUND', 'Local media processing execution for private media artifact QA was not found in mock storage.', 404)
      }

      if (privateMediaArtifactQaReview.passedArtifactCount < 1 || localMediaProcessingExecution.processedArtifactCount < 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No QA-passed private media artifacts are available for render preview assembly.', 409, {
          passedArtifactCount: privateMediaArtifactQaReview.passedArtifactCount,
          processedArtifactCount: localMediaProcessingExecution.processedArtifactCount,
        })
      }

      const adapterWorkerArtifactIntegration = input.adapterWorkerArtifactIntegrationId
        ? mockAdapterWorkerArtifactIntegrationsById.get(input.adapterWorkerArtifactIntegrationId)
        : undefined
      if (input.adapterWorkerArtifactIntegrationId && !adapterWorkerArtifactIntegration) {
        throw new ApiError('JOB_NOT_FOUND', 'Adapter worker artifact integration was not found before render preview assembly.', 404)
      }

      if (adapterWorkerArtifactIntegration) {
        if (
          adapterWorkerArtifactIntegration.workspaceId !== privateMediaArtifactQaReview.workspaceId ||
          adapterWorkerArtifactIntegration.projectId !== privateMediaArtifactQaReview.projectId ||
          adapterWorkerArtifactIntegration.approvedPlanSnapshotId !== privateMediaArtifactQaReview.approvedPlanSnapshotId
        ) {
          throw new ApiError('VALIDATION_FAILED', 'Adapter worker artifact integration must match render preview workspace, project, and approved snapshot lineage.', 400, {
            integrationWorkspaceId: adapterWorkerArtifactIntegration.workspaceId,
            integrationProjectId: adapterWorkerArtifactIntegration.projectId,
            integrationApprovedPlanSnapshotId: adapterWorkerArtifactIntegration.approvedPlanSnapshotId,
          })
        }

        if (adapterWorkerArtifactIntegration.creditReservationId !== privateMediaArtifactQaReview.creditReservationId) {
          throw new ApiError('CREDITS_NOT_RESERVED', 'Adapter worker artifact integration must use the same credit reservation as render preview assembly.', 409, {
            integrationCreditReservationId: adapterWorkerArtifactIntegration.creditReservationId,
            renderCreditReservationId: privateMediaArtifactQaReview.creditReservationId,
          })
        }

        if (input.privateMediaRunnerQaReviewId && input.privateMediaRunnerQaReviewId !== adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId) {
          throw new ApiError('VALIDATION_FAILED', 'Adapter worker artifact integration does not match the provided private runner QA review.', 400, {
            integrationPrivateMediaRunnerQaReviewId: adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId,
            requestedPrivateMediaRunnerQaReviewId: input.privateMediaRunnerQaReviewId,
          })
        }
      }

      const privateMediaRunnerQaReview = !adapterWorkerArtifactIntegration && input.privateMediaRunnerQaReviewId
        ? mockRegisteredAdapterPrivateMediaRunnerQaReviewsById.get(input.privateMediaRunnerQaReviewId)
        : undefined
      if (!adapterWorkerArtifactIntegration && input.privateMediaRunnerQaReviewId && !privateMediaRunnerQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Registered adapter private runner QA review was not found before render preview assembly.', 404)
      }

      if (privateMediaRunnerQaReview) {
        if (
          privateMediaRunnerQaReview.workspaceId !== privateMediaArtifactQaReview.workspaceId ||
          privateMediaRunnerQaReview.projectId !== privateMediaArtifactQaReview.projectId ||
          privateMediaRunnerQaReview.approvedPlanSnapshotId !== privateMediaArtifactQaReview.approvedPlanSnapshotId
        ) {
          throw new ApiError('VALIDATION_FAILED', 'Adapter QA integration must match render preview workspace, project, and approved snapshot lineage.', 400, {
            adapterWorkspaceId: privateMediaRunnerQaReview.workspaceId,
            adapterProjectId: privateMediaRunnerQaReview.projectId,
            adapterApprovedPlanSnapshotId: privateMediaRunnerQaReview.approvedPlanSnapshotId,
          })
        }

        if (privateMediaRunnerQaReview.creditReservationId !== privateMediaArtifactQaReview.creditReservationId) {
          throw new ApiError('CREDITS_NOT_RESERVED', 'Adapter QA integration must use the same credit reservation as render preview assembly.', 409, {
            adapterCreditReservationId: privateMediaRunnerQaReview.creditReservationId,
            renderCreditReservationId: privateMediaArtifactQaReview.creditReservationId,
          })
        }

        if (privateMediaRunnerQaReview.status !== 'private_adapter_result_qa_passed_waiting_final_render_integration' || privateMediaRunnerQaReview.artifactCount < 1) {
          throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Adapter QA integration requires a passed private runner QA review with private artifacts.', 409, {
            adapterQaStatus: privateMediaRunnerQaReview.status,
            adapterQaArtifactCount: privateMediaRunnerQaReview.artifactCount,
            nextRequiredGate: privateMediaRunnerQaReview.nextRequiredGate,
          })
        }
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/private-media-artifact-qa-reviews/:privateMediaArtifactQaReviewId/render-preview-assembly',
        privateMediaArtifactQaReviewId: input.privateMediaArtifactQaReviewId,
        adapterWorkerArtifactIntegrationId: input.adapterWorkerArtifactIntegrationId,
        privateMediaRunnerQaReviewId: input.privateMediaRunnerQaReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        assemblyOnly: input.assemblyOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockRenderPreviewAssembliesByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different render preview assembly request.', 409, {
          existingRequestHash: existing.requestHash,
          incomingRequestHash: requestHash,
          adapterWorkerArtifactIntegrationId: input.adapterWorkerArtifactIntegrationId ?? null,
          privateMediaRunnerQaReviewId: input.privateMediaRunnerQaReviewId ?? null,
        })
      }

      if (existing) {
        mockRenderPreviewAssembliesById.set(existing.renderPreviewAssembly.id, existing.renderPreviewAssembly)
        return {
          renderPreviewAssembly: existing.renderPreviewAssembly,
          warnings: [
            mockWarning('Approved edit render preview assembly'),
            'Idempotent render preview assembly replay returned the original private preview manifest without duplicate writes.',
          ],
        }
      }

      const toolWorkManifest = requirePackageToolWorkManifest(privateMediaArtifactQaReview.packageRecordId)
      await requireServerApprovedPlaywrightCaptureAuthorization({
        context,
        userId,
        packageRecordId: privateMediaArtifactQaReview.packageRecordId,
        manifest: toolWorkManifest,
        approvedSnapshot: mockApprovedSnapshotsByPackageRecordId.get(privateMediaArtifactQaReview.packageRecordId),
      })
      const renderPreviewAssembly = await createRenderPreviewAssemblyFromPrivateMediaArtifactQa({
        privateMediaArtifactQaReview,
        localMediaProcessingExecution,
        adapterWorkerArtifactIntegration,
        privateMediaRunnerQaReview,
        approvedSnapshot: mockApprovedSnapshotsByPackageRecordId.get(privateMediaArtifactQaReview.packageRecordId),
        toolWorkManifest,
        localStorageRoot: context.env.localStorageRoot,
      })
      mockRenderPreviewAssembliesByIdempotency.set(cacheKey, { requestHash, renderPreviewAssembly })
      mockRenderPreviewAssembliesById.set(renderPreviewAssembly.id, renderPreviewAssembly)

      return {
        renderPreviewAssembly,
        warnings: [
          mockWarning('Approved edit render preview assembly'),
          'Render preview assembly created a private internal preview manifest only. User review, final export, public delivery, and billing remain blocked.',
        ],
      }
    },

    async createUserPreviewReview(input: CreateApprovedEditExecutionUserPreviewReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit user preview review requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for user preview review.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before user preview review.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'User preview review currently records mock-safe local preview decisions only. Add persisted preview review tables before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'user_preview_review_persistence' },
        )
      }

      const renderPreviewAssembly = mockRenderPreviewAssembliesById.get(input.renderPreviewAssemblyId)
      if (!renderPreviewAssembly) {
        throw new ApiError('JOB_NOT_FOUND', 'Render preview assembly was not found in mock storage.', 404)
      }

      const owningPackage = mockPackagesById.get(renderPreviewAssembly.packageRecordId)
      if (!owningPackage) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'The approved execution package for this preview was not found.', 404)
      }
      assertApprovedEditExecutionPackageOwnedByCurrentUser(context, owningPackage)

      if (
        owningPackage.workspaceId !== renderPreviewAssembly.workspaceId ||
        owningPackage.projectId !== renderPreviewAssembly.projectId ||
        owningPackage.approvedPlanSnapshotId !== renderPreviewAssembly.approvedPlanSnapshotId
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Preview review scope does not match its approved execution package.', 400)
      }

      if (renderPreviewAssembly.workspaceId !== input.workspaceId || renderPreviewAssembly.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'User preview review workspace/project must match render preview assembly.', 400, {
          assemblyWorkspaceId: renderPreviewAssembly.workspaceId,
          assemblyProjectId: renderPreviewAssembly.projectId,
        })
      }

      if (renderPreviewAssembly.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'User preview review credit reservation must match render preview assembly.', 409, {
          assemblyCreditReservationId: renderPreviewAssembly.creditReservationId,
        })
      }

      if (renderPreviewAssembly.status !== 'render_preview_assembly_completed_waiting_user_preview_review') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Render preview assembly is not ready for user preview review.', 409, {
          status: renderPreviewAssembly.status,
          blockers: renderPreviewAssembly.blockers,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/render-preview-assemblies/:renderPreviewAssemblyId/user-preview-review',
        renderPreviewAssemblyId: input.renderPreviewAssemblyId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        reviewOnly: input.reviewOnly,
        reviewDecision: input.reviewDecision,
        reviewerNote: input.reviewerNote,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockUserPreviewReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different user preview review request.', 409)
      }

      if (existing) {
        mockUserPreviewReviewsById.set(existing.userPreviewReview.id, existing.userPreviewReview)
        return {
          userPreviewReview: existing.userPreviewReview,
          warnings: [
            mockWarning('Approved edit user preview review'),
            'Idempotent user preview review replay returned the original decision without duplicate review records.',
          ],
        }
      }

      const userPreviewReview = createUserPreviewReviewFromRenderPreviewAssembly({
        renderPreviewAssembly,
        reviewDecision: input.reviewDecision,
        reviewerNote: input.reviewerNote,
      })
      mockUserPreviewReviewsByIdempotency.set(cacheKey, { requestHash, userPreviewReview })
      mockUserPreviewReviewsById.set(userPreviewReview.id, userPreviewReview)

      return {
        userPreviewReview,
        warnings: [
          mockWarning('Approved edit user preview review'),
          'User preview review recorded a private preview decision only. Final render/export, public delivery, and billing remain blocked.',
        ],
      }
    },

    async createFinalRenderReadinessReview(input: CreateApprovedEditExecutionFinalRenderReadinessReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit final render readiness review requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for final render readiness review.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before final render readiness review.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Final render readiness review currently records mock-safe local readiness only. Add persisted final render readiness tables before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'final_render_readiness_persistence' },
        )
      }

      const userPreviewReview = mockUserPreviewReviewsById.get(input.userPreviewReviewId)
      if (!userPreviewReview) {
        throw new ApiError('JOB_NOT_FOUND', 'User preview review was not found in mock storage.', 404)
      }

      if (userPreviewReview.workspaceId !== input.workspaceId || userPreviewReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Final render readiness workspace/project must match user preview review.', 400, {
          reviewWorkspaceId: userPreviewReview.workspaceId,
          reviewProjectId: userPreviewReview.projectId,
        })
      }

      if (userPreviewReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Final render readiness credit reservation must match user preview review.', 409, {
          reviewCreditReservationId: userPreviewReview.creditReservationId,
        })
      }

      if (userPreviewReview.status !== 'user_preview_review_approved_waiting_final_render_readiness') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'User preview review must approve the private preview before final render readiness review.', 409, {
          status: userPreviewReview.status,
          blockers: userPreviewReview.blockers,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/user-preview-reviews/:userPreviewReviewId/final-render-readiness-review',
        userPreviewReviewId: input.userPreviewReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        readinessReviewOnly: input.readinessReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockFinalRenderReadinessReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different final render readiness review request.', 409)
      }

      if (existing) {
        mockFinalRenderReadinessReviewsById.set(existing.finalRenderReadinessReview.id, existing.finalRenderReadinessReview)
        return {
          finalRenderReadinessReview: existing.finalRenderReadinessReview,
          warnings: [
            mockWarning('Approved edit final render readiness review'),
            'Idempotent final render readiness replay returned the original readiness record without duplicate records.',
          ],
        }
      }

      const finalRenderReadinessReview = createFinalRenderReadinessReviewFromUserPreviewReview(userPreviewReview)
      mockFinalRenderReadinessReviewsByIdempotency.set(cacheKey, { requestHash, finalRenderReadinessReview })
      mockFinalRenderReadinessReviewsById.set(finalRenderReadinessReview.id, finalRenderReadinessReview)

      return {
        finalRenderReadinessReview,
        warnings: [
          mockWarning('Approved edit final render readiness review'),
          'Final render readiness passed for the private approved preview only. Final render execution, delivery QA, public artifacts, and billing remain blocked.',
        ],
      }
    },

    async createFinalRenderExecution(input: CreateApprovedEditExecutionFinalRenderExecutionInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit final render execution requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for final render execution.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before final render execution.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Final render execution currently writes local private render artifacts only. Add persisted render artifact tables and delivery QA before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'final_render_execution_persistence' },
        )
      }

      if (context.env.storageMode !== 'local' && context.env.storageMode !== 'gcs') {
        throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Final render execution requires local private artifact storage or a GCS source adapter with local private outputs.', 202, {
          storageMode: context.env.storageMode,
          requiredBackendGate: 'final_render_storage_adapter',
        })
      }

      const finalRenderReadinessReview = mockFinalRenderReadinessReviewsById.get(input.finalRenderReadinessReviewId)
      if (!finalRenderReadinessReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Final render readiness review was not found in mock storage.', 404)
      }

      if (finalRenderReadinessReview.workspaceId !== input.workspaceId || finalRenderReadinessReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Final render execution workspace/project must match final render readiness review.', 400, {
          readinessWorkspaceId: finalRenderReadinessReview.workspaceId,
          readinessProjectId: finalRenderReadinessReview.projectId,
        })
      }

      if (finalRenderReadinessReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Final render execution credit reservation must match final render readiness review.', 409, {
          readinessCreditReservationId: finalRenderReadinessReview.creditReservationId,
        })
      }

      if (finalRenderReadinessReview.status !== 'final_render_readiness_passed_waiting_final_render_execution') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Final render readiness must pass before final render execution.', 409, {
          status: finalRenderReadinessReview.status,
          blockers: finalRenderReadinessReview.blockers,
        })
      }

      const renderPreviewAssembly = mockRenderPreviewAssembliesById.get(finalRenderReadinessReview.renderPreviewAssemblyId)
      if (!renderPreviewAssembly) {
        throw new ApiError('JOB_NOT_FOUND', 'Render preview assembly for final render readiness was not found in mock storage.', 404)
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/final-render-readiness-reviews/:finalRenderReadinessReviewId/final-render-execution',
        finalRenderReadinessReviewId: input.finalRenderReadinessReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        renderExecutionOnly: input.renderExecutionOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockFinalRenderExecutionsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different final render execution request.', 409)
      }

      if (existing) {
        mockFinalRenderExecutionsById.set(existing.finalRenderExecution.id, existing.finalRenderExecution)
        return {
          finalRenderExecution: existing.finalRenderExecution,
          warnings: [
            mockWarning('Approved edit final render execution'),
            'Idempotent final render execution replay returned the original private render artifact without duplicate media writes.',
          ],
        }
      }

      const toolWorkManifest = requirePackageToolWorkManifest(finalRenderReadinessReview.packageRecordId)
      requireApprovedCoreToolOperation(toolWorkManifest, 'final_private_render')
      const finalRenderExecution = await createFinalRenderExecutionFromReadiness({
        finalRenderReadinessReview,
        renderPreviewAssembly,
        approvedSnapshot: mockApprovedSnapshotsByPackageRecordId.get(finalRenderReadinessReview.packageRecordId),
        toolWorkManifest,
        localStorageRoot: context.env.localStorageRoot,
        storageAdapter: context.storageAdapter ?? createStorageAdapter(context.env),
        exportBucketName: resolveBucketName(context.env, 'export'),
        qaArtifactBucketName: resolveBucketName(context.env, 'qa_artifact'),
        ffmpegBin: context.env.ffmpegBin,
        ffprobeBin: context.env.ffprobeBin,
      })
      mockFinalRenderExecutionsByIdempotency.set(cacheKey, { requestHash, finalRenderExecution })
      mockFinalRenderExecutionsById.set(finalRenderExecution.id, finalRenderExecution)

      return {
        finalRenderExecution,
        warnings: [
          mockWarning('Approved edit final render execution'),
          'Final render execution created a private final-render candidate only. Delivery QA, public artifacts, signed URLs, and billing remain blocked.',
        ],
      }
    },

    async createFinalDeliveryQaReview(input: CreateApprovedEditExecutionFinalDeliveryQaReviewInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit final delivery QA requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for final delivery QA.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before final delivery QA.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Final delivery QA currently reviews local private final-render artifacts only. Add persisted delivery QA tables and storage release policy before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'final_delivery_qa_persistence' },
        )
      }

      const finalRenderExecution = mockFinalRenderExecutionsById.get(input.finalRenderExecutionId)
      if (!finalRenderExecution) {
        throw new ApiError('JOB_NOT_FOUND', 'Final render execution was not found in mock storage.', 404)
      }

      if (finalRenderExecution.workspaceId !== input.workspaceId || finalRenderExecution.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Final delivery QA workspace/project must match final render execution.', 400, {
          executionWorkspaceId: finalRenderExecution.workspaceId,
          executionProjectId: finalRenderExecution.projectId,
        })
      }

      if (finalRenderExecution.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Final delivery QA credit reservation must match final render execution.', 409, {
          executionCreditReservationId: finalRenderExecution.creditReservationId,
        })
      }

      if (finalRenderExecution.status !== 'final_render_execution_completed_waiting_delivery_qa') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Final render execution must complete before final delivery QA.', 409, {
          status: finalRenderExecution.status,
          blockers: finalRenderExecution.blockers,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/final-render-executions/:finalRenderExecutionId/final-delivery-qa-review',
        finalRenderExecutionId: input.finalRenderExecutionId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        qaReviewOnly: input.qaReviewOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockFinalDeliveryQaReviewsByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different final delivery QA request.', 409)
      }

      if (existing) {
        mockFinalDeliveryQaReviewsById.set(existing.finalDeliveryQaReview.id, existing.finalDeliveryQaReview)
        return {
          finalDeliveryQaReview: existing.finalDeliveryQaReview,
          warnings: [
            mockWarning('Approved edit final delivery QA review'),
            'Idempotent final delivery QA replay returned the original QA record without duplicate review records.',
          ],
        }
      }

      const toolWorkManifest = requirePackageToolWorkManifest(finalRenderExecution.packageRecordId)
      requireApprovedCoreToolOperation(toolWorkManifest, 'final_delivery_private_qa_probe')
      const finalDeliveryQaReview = await createFinalDeliveryQaReviewFromExecution(finalRenderExecution, toolWorkManifest, {
        ffprobeBin: context.env.ffprobeBin,
      })
      mockFinalDeliveryQaReviewsByIdempotency.set(cacheKey, { requestHash, finalDeliveryQaReview })
      mockFinalDeliveryQaReviewsById.set(finalDeliveryQaReview.id, finalDeliveryQaReview)

      return {
        finalDeliveryQaReview,
        warnings: [
          mockWarning('Approved edit final delivery QA review'),
          'Final delivery QA passed only for private internal download/testing. Public delivery, signed URLs, external beta, production, and billing require approved release evidence gates.',
        ],
      }
    },

    async createPrivateInternalDownloadDelivery(input: CreateApprovedEditExecutionPrivateInternalDownloadDeliveryInput) {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit private internal download delivery requires an authenticated user.', 401)

      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for private internal download delivery.', 400)
      }

      if (!input.creditReservationId?.trim()) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'A credit reservation is required before private internal download delivery.', 409)
      }

      if (requiresApprovedEditExecutionBackendPersistence(context)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Private internal download delivery currently streams local private files only. Add persisted delivery ACLs before enabling non-mock mode.',
          202,
          { requiredBackendGate: 'private_internal_download_delivery_acl' },
        )
      }

      const finalDeliveryQaReview = mockFinalDeliveryQaReviewsById.get(input.finalDeliveryQaReviewId)
      if (!finalDeliveryQaReview) {
        throw new ApiError('JOB_NOT_FOUND', 'Final delivery QA review was not found in mock storage.', 404)
      }

      if (finalDeliveryQaReview.workspaceId !== input.workspaceId || finalDeliveryQaReview.projectId !== input.projectId) {
        throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery workspace/project must match final delivery QA.', 400, {
          qaWorkspaceId: finalDeliveryQaReview.workspaceId,
          qaProjectId: finalDeliveryQaReview.projectId,
        })
      }

      if (finalDeliveryQaReview.creditReservationId !== input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Private internal download delivery credit reservation must match final delivery QA.', 409, {
          qaCreditReservationId: finalDeliveryQaReview.creditReservationId,
        })
      }

      if (finalDeliveryQaReview.status !== 'final_delivery_qa_passed_ready_for_private_internal_download') {
        const failedQaChecks = finalDeliveryQaReview.qaChecks
          .filter((check) => !check.passed)
          .map((check) => check.check)
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Final delivery QA must pass before private internal download delivery.', 409, {
          status: finalDeliveryQaReview.status,
          blockers: finalDeliveryQaReview.blockers,
          failedQaChecks,
          professionalEditQaSummary: finalDeliveryQaReview.professionalEditQaSummary,
        })
      }

      const requestHash = hashPackageRequest({
        requestPath: input.requestPath ?? '/v1/edit-executions/final-delivery-qa-reviews/:finalDeliveryQaReviewId/private-internal-download-delivery',
        finalDeliveryQaReviewId: input.finalDeliveryQaReviewId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        deliveryOnly: input.deliveryOnly,
      })
      const cacheKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existing = mockPrivateInternalDownloadDeliveriesByIdempotency.get(cacheKey)
      if (existing && existing.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different private internal download delivery request.', 409)
      }

      if (existing) {
        await persistPrivateInternalDownloadDeliveryRecord({
          privateInternalDownloadDelivery: existing.privateInternalDownloadDelivery,
          localStorageRoot: context.env.localStorageRoot,
          storageAdapter: context.storageAdapter ?? createStorageAdapter(context.env),
          qaArtifactBucketName: resolveBucketName(context.env, 'qa_artifact'),
        })
        mockPrivateInternalDownloadDeliveriesById.set(existing.privateInternalDownloadDelivery.id, existing.privateInternalDownloadDelivery)
        return {
          privateInternalDownloadDelivery: existing.privateInternalDownloadDelivery,
          warnings: [
            mockWarning('Approved edit private internal download delivery'),
            'Idempotent private internal download delivery replay returned the original delivery record without duplicate delivery records.',
          ],
        }
      }

      const privateInternalDownloadDelivery = createPrivateInternalDownloadDeliveryFromFinalDeliveryQa(finalDeliveryQaReview, {
        createdByUserId: userId,
      })
      await persistPrivateInternalDownloadDeliveryRecord({
        privateInternalDownloadDelivery,
        localStorageRoot: context.env.localStorageRoot,
        storageAdapter: context.storageAdapter ?? createStorageAdapter(context.env),
        qaArtifactBucketName: resolveBucketName(context.env, 'qa_artifact'),
      })
      mockPrivateInternalDownloadDeliveriesByIdempotency.set(cacheKey, { requestHash, privateInternalDownloadDelivery })
      mockPrivateInternalDownloadDeliveriesById.set(privateInternalDownloadDelivery.id, privateInternalDownloadDelivery)

      return {
        privateInternalDownloadDelivery,
        warnings: [
          mockWarning('Approved edit private internal download delivery'),
          'Private internal download delivery is ready only for authenticated internal testing. Public artifacts, signed URLs, external beta, production, and billing require approved release evidence gates.',
        ],
      }
    },

    async getPrivateInternalDownloadFile(privateInternalDownloadDeliveryId: string): Promise<PrivateInternalDownloadFile> {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit private internal download file requires an authenticated user.', 401)

      const privateInternalDownloadDelivery = mockPrivateInternalDownloadDeliveriesById.get(privateInternalDownloadDeliveryId) ??
        await loadPrivateInternalDownloadDeliveryRecord({
          privateInternalDownloadDeliveryId,
          localStorageRoot: context.env.localStorageRoot,
          storageAdapter: context.storageAdapter ??
            (context.env.storageMode === 'gcs' ? createStorageAdapter(context.env) : undefined),
          qaArtifactBucketName: resolveBucketName(context.env, 'qa_artifact'),
        })
      if (!privateInternalDownloadDelivery) {
        throw new ApiError('JOB_NOT_FOUND', 'Private internal download delivery was not found in mock storage.', 404)
      }
      await assertPrivateInternalDownloadDeliveryAccessibleToCurrentUser(context, privateInternalDownloadDelivery)
      mockPrivateInternalDownloadDeliveriesById.set(privateInternalDownloadDelivery.id, privateInternalDownloadDelivery)

      if (privateInternalDownloadDelivery.status !== 'private_internal_download_delivery_ready') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private internal download delivery is not ready.', 409, {
          status: privateInternalDownloadDelivery.status,
          blockers: privateInternalDownloadDelivery.blockers,
        })
      }

      if (
        privateInternalDownloadDelivery.finalRenderArtifact.publicArtifact ||
        privateInternalDownloadDelivery.finalRenderArtifact.signedUrl ||
        privateInternalDownloadDelivery.finalRenderArtifact.storageProvider !== 'local_private'
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery can only stream private local artifacts.', 400)
      }

      const privateDownloadFile = await resolvePrivateArtifactDownload({
        localFilePath: privateInternalDownloadDelivery.finalRenderArtifact.localFilePath,
        byteSize: privateInternalDownloadDelivery.finalRenderArtifact.byteSize,
        sha256: privateInternalDownloadDelivery.finalRenderArtifact.sha256,
        mimeType: privateInternalDownloadDelivery.finalRenderArtifact.mimeType,
        privateStorageMirror: privateInternalDownloadDelivery.finalRenderArtifact.privateStorageMirror,
        storageAdapter: context.storageAdapter ??
          (privateInternalDownloadDelivery.finalRenderArtifact.privateStorageMirror ? createStorageAdapter(context.env) : undefined),
        unavailableMessage: 'Private internal download file is not available.',
        sizeMismatchMessage: 'Private internal download file size does not match the reviewed artifact metadata.',
        checksumMismatchMessage: 'Private internal download file checksum does not match the reviewed artifact metadata.',
      })

      return {
        localFilePath: privateDownloadFile.localFilePath,
        fileName: `${safePathPart(privateInternalDownloadDelivery.projectId)}-reeditpro-final.mp4`,
        mimeType: privateInternalDownloadDelivery.finalRenderArtifact.mimeType,
        byteSize: privateDownloadFile.byteSize,
        createReadStream: privateDownloadFile.createReadStream,
      }
    },

    async getPrivateInternalDownloadManifestFile(privateInternalDownloadDeliveryId: string): Promise<PrivateInternalDownloadFile> {
      const userId = context.auth?.userId
      if (!userId) throw new ApiError('AUTH_REQUIRED', 'Approved edit private internal download manifest requires an authenticated user.', 401)

      const privateInternalDownloadDelivery = mockPrivateInternalDownloadDeliveriesById.get(privateInternalDownloadDeliveryId) ??
        await loadPrivateInternalDownloadDeliveryRecord({
          privateInternalDownloadDeliveryId,
          localStorageRoot: context.env.localStorageRoot,
          storageAdapter: context.storageAdapter ??
            (context.env.storageMode === 'gcs' ? createStorageAdapter(context.env) : undefined),
          qaArtifactBucketName: resolveBucketName(context.env, 'qa_artifact'),
        })
      if (!privateInternalDownloadDelivery) {
        throw new ApiError('JOB_NOT_FOUND', 'Private internal download delivery was not found in mock storage.', 404)
      }
      await assertPrivateInternalDownloadDeliveryAccessibleToCurrentUser(context, privateInternalDownloadDelivery)
      mockPrivateInternalDownloadDeliveriesById.set(privateInternalDownloadDelivery.id, privateInternalDownloadDelivery)

      if (privateInternalDownloadDelivery.status !== 'private_internal_download_delivery_ready') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private internal download delivery is not ready.', 409, {
          status: privateInternalDownloadDelivery.status,
          blockers: privateInternalDownloadDelivery.blockers,
        })
      }

      const manifestArtifact = privateInternalDownloadDelivery.finalRenderArtifact.editDecisionManifestArtifact
      if (
        !manifestArtifact ||
        manifestArtifact.publicArtifact ||
        manifestArtifact.signedUrl ||
        manifestArtifact.storageProvider !== 'local_private' ||
        manifestArtifact.mimeType !== 'application/json' ||
        manifestArtifact.sourceOfTruth !== true ||
        manifestArtifact.sourceOfTruthScope !== 'final_render_execution_edit_decision_manifest'
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Private internal manifest download can only stream private source-of-truth JSON artifacts.', 400)
      }

      const privateManifestFile = await resolvePrivateArtifactDownload({
        localFilePath: manifestArtifact.localFilePath,
        byteSize: manifestArtifact.byteSize,
        sha256: manifestArtifact.sha256,
        mimeType: manifestArtifact.mimeType,
        privateStorageMirror: manifestArtifact.privateStorageMirror,
        storageAdapter: context.storageAdapter ??
          (manifestArtifact.privateStorageMirror ? createStorageAdapter(context.env) : undefined),
        unavailableMessage: 'Private internal edit decision manifest file is not available.',
        sizeMismatchMessage: 'Private internal edit decision manifest size does not match the reviewed artifact metadata.',
        checksumMismatchMessage: 'Private internal edit decision manifest checksum does not match the reviewed artifact metadata.',
      })

      return {
        localFilePath: privateManifestFile.localFilePath,
        fileName: `${safePathPart(privateInternalDownloadDelivery.projectId)}-edit-decision-manifest.json`,
        mimeType: manifestArtifact.mimeType,
        byteSize: privateManifestFile.byteSize,
        createReadStream: privateManifestFile.createReadStream,
      }
    },
  }
}

function blockCallerAuthoredExecutionPackageCreation(): never {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Caller-authored approved snapshots, credit reservations, tool selections, and readiness hints cannot create execution packages. Use canonical edit authority packaging.',
    503,
    { requiredGate: 'canonical_edit_authority_execution_package' },
  )
}

function requiresApprovedEditExecutionBackendPersistence(context: ServiceContext): boolean {
  return Boolean(
    context.clients.admin &&
    !context.env.mockOnly &&
    !context.env.allowInternalTestExecutionWithSupabase
  )
}

function assertApprovedEditExecutionPackageOwnedByCurrentUser(
  context: ServiceContext,
  approvedEditExecutionPackage: StoredApprovedEditExecutionPackage['approvedEditExecutionPackage'],
): void {
  const userId = context.auth?.userId
  if (!userId) {
    throw new ApiError('AUTH_REQUIRED', 'Approved edit execution package access requires an authenticated user.', 401)
  }

  if (approvedEditExecutionPackage.createdByUserId !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Approved edit execution package does not belong to the authenticated user.', 403, {
      packageRecordId: approvedEditExecutionPackage.packageRecordId,
      workspaceId: approvedEditExecutionPackage.workspaceId,
      projectId: approvedEditExecutionPackage.projectId,
    })
  }
}

async function persistPrivateInternalDownloadDeliveryRecord(input: {
  privateInternalDownloadDelivery: ApprovedEditExecutionPrivateInternalDownloadDelivery
  localStorageRoot: string
  storageAdapter?: StorageAdapter
  qaArtifactBucketName?: string
}): Promise<void> {
  assertPrivateInternalDownloadDeliveryRecordSafe(input.privateInternalDownloadDelivery)
  const objectPath = privateInternalDownloadDeliveryRegistryObjectPath(input.privateInternalDownloadDelivery.id)
  const content = `${JSON.stringify(stableJsonValue({
    recordVersion: 'private-internal-download-delivery-v1',
    source: 'approved_edit_execution_private_internal_download_delivery',
    persistedAt: nowIso(),
    privateInternalDownloadDelivery: input.privateInternalDownloadDelivery,
  }), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: objectPath,
    content,
  })

  if (input.storageAdapter?.mode === 'gcs') {
    if (!input.qaArtifactBucketName?.trim()) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private internal download delivery registry requires a configured private QA artifacts bucket.', 409)
    }
    await input.storageAdapter.putObject({
      bucketName: input.qaArtifactBucketName,
      objectPath,
      body: Buffer.from(content),
      mimeType: 'application/json',
    })
  }
}

async function loadPrivateInternalDownloadDeliveryRecord(input: {
  privateInternalDownloadDeliveryId: string
  localStorageRoot: string
  storageAdapter?: StorageAdapter
  qaArtifactBucketName?: string
}): Promise<ApprovedEditExecutionPrivateInternalDownloadDelivery | undefined> {
  const objectPath = privateInternalDownloadDeliveryRegistryObjectPath(input.privateInternalDownloadDeliveryId)

  const localContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: objectPath,
  })
  if (localContent) {
    return parsePrivateInternalDownloadDeliveryRecord(localContent, input.privateInternalDownloadDeliveryId)
  }

  if (!input.storageAdapter || input.storageAdapter.mode !== 'gcs' || !input.qaArtifactBucketName?.trim()) {
    return undefined
  }

  const metadata = await input.storageAdapter.getObjectMetadata(input.qaArtifactBucketName, objectPath)
  if (!metadata.exists) return undefined

  const stream = await input.storageAdapter.createReadStream(input.qaArtifactBucketName, objectPath)
  const content = await readStreamToUtf8(stream)
  return parsePrivateInternalDownloadDeliveryRecord(content, input.privateInternalDownloadDeliveryId)
}

async function readStreamToUtf8(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function parsePrivateInternalDownloadDeliveryRecord(
  content: string,
  expectedId: string,
): ApprovedEditExecutionPrivateInternalDownloadDelivery {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record is not valid JSON.', 400)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record is not an object.', 400)
  }

  const record = parsed as {
    recordVersion?: unknown
    privateInternalDownloadDelivery?: unknown
  }
  if (record.recordVersion !== 'private-internal-download-delivery-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record version is not supported.', 400)
  }

  const delivery = record.privateInternalDownloadDelivery
  if (!delivery || typeof delivery !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record is missing delivery metadata.', 400)
  }

  const privateInternalDownloadDelivery = delivery as ApprovedEditExecutionPrivateInternalDownloadDelivery
  if (privateInternalDownloadDelivery.id !== expectedId) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry ID does not match the requested delivery.', 400)
  }

  assertPrivateInternalDownloadDeliveryRecordSafe(privateInternalDownloadDelivery)
  return privateInternalDownloadDelivery
}

function assertPrivateInternalDownloadDeliveryRecordSafe(
  delivery: ApprovedEditExecutionPrivateInternalDownloadDelivery,
): void {
  if (!delivery.createdByUserId?.trim()) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record is missing owner metadata.', 400)
  }

  if (
    delivery.status !== 'private_internal_download_delivery_ready' ||
    delivery.privateInternalDownloadReady !== true ||
    delivery.publicDeliveryReady ||
    delivery.externalBetaReady ||
    delivery.productionReady ||
    delivery.finalExportReady !== true ||
    delivery.liveExecutionReady !== false
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record has unsafe delivery status.', 400)
  }

  const finalRenderArtifact = delivery.finalRenderArtifact
  if (
    !finalRenderArtifact ||
    finalRenderArtifact.storageProvider !== 'local_private' ||
    finalRenderArtifact.privateArtifact !== true ||
    finalRenderArtifact.publicArtifact !== false ||
    finalRenderArtifact.signedUrl !== null ||
    finalRenderArtifact.sourceOfTruth !== true ||
    finalRenderArtifact.sourceOfTruthScope !== 'final_render_execution_private_artifact' ||
    finalRenderArtifact.finalDeliveryEligible !== false
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record references an unsafe final render artifact.', 400)
  }

  assertPrivateStorageMirrorSafe(finalRenderArtifact.privateStorageMirror)

  const manifestArtifact = finalRenderArtifact.editDecisionManifestArtifact
  if (
    !manifestArtifact ||
    manifestArtifact.storageProvider !== 'local_private' ||
    manifestArtifact.privateArtifact !== true ||
    manifestArtifact.publicArtifact !== false ||
    manifestArtifact.signedUrl !== null ||
    manifestArtifact.sourceOfTruth !== true ||
    manifestArtifact.sourceOfTruthScope !== 'final_render_execution_edit_decision_manifest' ||
    manifestArtifact.mimeType !== 'application/json' ||
    manifestArtifact.finalDeliveryEligible !== false
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal download delivery registry record references an unsafe manifest artifact.', 400)
  }

  assertPrivateStorageMirrorSafe(manifestArtifact.privateStorageMirror)
}

async function assertPrivateInternalDownloadDeliveryAccessibleToCurrentUser(
  context: ServiceContext,
  delivery: ApprovedEditExecutionPrivateInternalDownloadDelivery,
): Promise<void> {
  const userId = context.auth?.userId
  if (!userId) {
    throw new ApiError('AUTH_REQUIRED', 'Approved edit private internal download delivery requires an authenticated user.', 401)
  }

  if (delivery.createdByUserId !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Private internal download delivery does not belong to the authenticated user.', 403, {
      privateInternalDownloadDeliveryId: delivery.id,
      workspaceId: delivery.workspaceId,
      projectId: delivery.projectId,
    })
  }

  // Ownership embedded in an old delivery record is not continuing access
  // authority. Re-check current membership for every stream so a removed user
  // cannot retain file or manifest access by keeping a delivery ID.
  await authorizeWorkspaceAccess(context, delivery.workspaceId, 'read')

  // In real authenticated runtimes, also bind the delivery back to the
  // current project record. Local mock tests use scoped per-user project files
  // and the record ownership + workspace authorization above.
  if (!context.auth?.isMockUser) {
    await createProjectService(context).getProject(delivery.projectId, delivery.workspaceId)
  }
}

function assertPrivateStorageMirrorSafe(mirror: PrivateStorageMirror | undefined): void {
  if (!mirror) return
  if (
    mirror.storageProvider !== 'google_cloud_storage' ||
    mirror.privateArtifact !== true ||
    mirror.publicArtifact !== false ||
    mirror.signedUrl !== null ||
    mirror.sourceOfTruth !== true ||
    !mirror.bucketName.trim() ||
    !mirror.objectPath.trim() ||
    mirror.byteSize <= 0 ||
    !/^[a-f0-9]{64}$/i.test(mirror.sha256)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private storage mirror metadata is unsafe.', 400)
  }
}

function privateInternalDownloadDeliveryRegistryObjectPath(privateInternalDownloadDeliveryId: string): string {
  return join(
    'edit-execution',
    'private-internal-download-delivery-registry',
    `${safePathPart(privateInternalDownloadDeliveryId)}.json`,
  ).split('/').join('/')
}

async function requireServerApprovedPlaywrightCaptureAuthorization(input: {
  context: ServiceContext
  userId: string
  packageRecordId: string
  manifest: ApprovedToolWorkManifest
  approvedSnapshot?: ApprovedPlanSnapshot
}): Promise<void> {
  const executableCaptureOperations = input.manifest.operations.filter((operation) =>
    operation.toolId === 'playwright' && operation.disposition === 'executable_private_internal')
  if (executableCaptureOperations.length < 1) return

  const authorization = serverApprovedPlaywrightCaptureAuthorizationsByPackageRecordId.get(input.packageRecordId)
  if (!authorization || !input.approvedSnapshot) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Executable Playwright capture requires server-owned approved snapshot authorization.', 409, {
      packageRecordId: input.packageRecordId,
      requiredBackendGate: 'server_owned_playwright_capture_snapshot_authorization',
    })
  }
  if (
    authorization.packageRecordId !== input.packageRecordId ||
    authorization.manifestFingerprintSha256 !== input.manifest.fingerprintSha256 ||
    authorization.workspaceId !== input.manifest.workspaceId ||
    authorization.projectId !== input.manifest.projectId ||
    authorization.approvedPlanSnapshotId !== input.manifest.approvedPlanSnapshotId ||
    authorization.creditReservationId !== input.manifest.creditReservationId ||
    authorization.approvedByUserId !== input.userId
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Playwright capture server authorization does not match the immutable package manifest.', 409)
  }

  const approvedSnapshotSha256 = await validateServerApprovedPlaywrightCaptureSnapshot({
    context: input.context,
    userId: input.userId,
    registryApprovedSnapshotId: authorization.registryApprovedSnapshotId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    creditReservationId: authorization.creditReservationId,
    expectedSnapshot: input.approvedSnapshot,
  })
  if (approvedSnapshotSha256 !== authorization.approvedSnapshotSha256) {
    throw new ApiError('VALIDATION_FAILED', 'Server-owned approved snapshot changed after Playwright capture package authorization.', 409)
  }
}

async function validateServerApprovedPlaywrightCaptureSnapshot(input: {
  context: ServiceContext
  userId: string
  registryApprovedSnapshotId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  expectedSnapshot: ApprovedPlanSnapshot
}): Promise<string> {
  const result = await createApprovedSnapshotService(input.context).getApprovedSnapshot(input.registryApprovedSnapshotId)
  const record = result.approvedPlanSnapshot as Record<string, unknown>
  if (
    record.id !== input.registryApprovedSnapshotId ||
    record.approvedByUserId !== input.userId ||
    record.workspaceId !== input.workspaceId ||
    record.projectId !== input.projectId ||
    record.creditReservationId !== input.creditReservationId ||
    record.creditEstimateId !== input.expectedSnapshot.creditEstimateId ||
    record.snapshotStatus !== 'approved'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Server-owned approved snapshot scope, approval, estimate, or reservation does not match Playwright capture.', 409)
  }
  const snapshotJson = isPlainRecord(record.snapshotJson) ? record.snapshotJson : undefined
  const storedExecutionSnapshot = snapshotJson && isPlainRecord(snapshotJson.executionApprovedSnapshot)
    ? snapshotJson.executionApprovedSnapshot
    : undefined
  if (!storedExecutionSnapshot) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Server-owned approved snapshot is missing the executable snapshot payload required for Playwright capture.', 409)
  }
  const storedSnapshotId = typeof storedExecutionSnapshot.id === 'string' ? storedExecutionSnapshot.id : undefined
  if (!storedSnapshotId) {
    throw new ApiError('VALIDATION_FAILED', 'Server-owned executable snapshot is missing its immutable source ID.', 409)
  }
  const reboundServerSnapshot = replaceExactJsonString(
    storedExecutionSnapshot,
    storedSnapshotId,
    input.registryApprovedSnapshotId,
  )
  const serverSnapshotSha256 = createHash('sha256').update(JSON.stringify(stableJsonValue(reboundServerSnapshot))).digest('hex')
  const expectedSnapshotSha256 = createHash('sha256').update(JSON.stringify(stableJsonValue(input.expectedSnapshot))).digest('hex')
  if (serverSnapshotSha256 !== expectedSnapshotSha256) {
    throw new ApiError('VALIDATION_FAILED', 'Client package snapshot does not match the authenticated server-owned approved snapshot hash.', 409, {
      registryApprovedSnapshotId: input.registryApprovedSnapshotId,
    })
  }
  return serverSnapshotSha256
}

function replaceExactJsonString(value: unknown, previousValue: string, nextValue: string): unknown {
  if (value === previousValue) return nextValue
  if (Array.isArray(value)) return value.map((item) => replaceExactJsonString(item, previousValue, nextValue))
  if (!isPlainRecord(value)) return value
  return Object.fromEntries(Object.entries(value)
    .map(([key, nested]) => [key, replaceExactJsonString(nested, previousValue, nextValue)]))
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hashPackageRequest(value: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(stableJsonValue(value))).digest('hex')
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, stableJsonValue(nestedValue)]),
    )
  }
  return value
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function uniqueToolOperationEvidence(
  evidence: ApprovedToolOperationEvidence[],
): ApprovedToolOperationEvidence[] {
  const byInstanceId = new Map<string, ApprovedToolOperationEvidence>()
  for (const item of evidence) byInstanceId.set(item.operationInstanceId, item)
  return [...byInstanceId.values()].sort((left, right) =>
    left.operationId.localeCompare(right.operationId) ||
    left.operationInstanceId.localeCompare(right.operationInstanceId))
}

function createJobBatchPlanFromPackage(input: {
  packageRecordId: string
  approvedEditExecutionPackage: StoredApprovedEditExecutionPackage['approvedEditExecutionPackage']
  creditReservationId: string
}): ApprovedEditExecutionJobBatchPlan {
  const pkg = input.approvedEditExecutionPackage
  const workItems = pkg.rehearsal.executionPlan?.workItems ?? []
  const jobBatchPlanId = createMockId('edit_execution_job_batch_plan')
  const packageBlockers = [...pkg.blockers]
  const status = pkg.agentCallReady && workItems.length > 0
    ? 'ready_for_mock_queue_review'
    : 'blocked_by_package_gates'
  const plannedJobs = workItems.map((workItem) => createPlannedWorkerJob({
    workItem,
    packageRecordId: input.packageRecordId,
    jobBatchPlanId,
    workspaceId: pkg.workspaceId,
    projectId: pkg.projectId,
    approvedPlanSnapshotId: pkg.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    forceBlocked: status === 'blocked_by_package_gates',
  }))
  const readyToQueueCount = plannedJobs.filter((job) => job.status === 'ready_to_queue').length
  const waitingDependencyCount = plannedJobs.filter((job) => job.status === 'waiting_dependency').length
  const blockedJobCount = plannedJobs.filter((job) => job.status === 'blocked').length
  const metadataCompleteCount = plannedJobs.filter((job) => job.status === 'metadata_complete').length

  return {
    id: jobBatchPlanId,
    packageRecordId: input.packageRecordId,
    workspaceId: pkg.workspaceId,
    projectId: pkg.projectId,
    approvedPlanSnapshotId: pkg.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status,
    dryRunOnly: true,
    plannedJobs,
    plannedJobCount: plannedJobs.length,
    readyToQueueCount,
    waitingDependencyCount,
    blockedJobCount,
    metadataCompleteCount,
    userFacingSummary: status === 'ready_for_mock_queue_review'
      ? 'The approved edit is organized into backend work batches for internal review. Nothing has started yet.'
      : 'The approved edit cannot be organized into runnable backend work until package blockers are resolved.',
    backendHandoffSummary: [
      `Package ${input.packageRecordId} produced ${plannedJobs.length} planned worker job record(s).`,
      `Ready: ${readyToQueueCount}; waiting: ${waitingDependencyCount}; blocked: ${blockedJobCount}; metadata complete: ${metadataCompleteCount}.`,
      'This plan preserves approved snapshot, credit reservation, idempotency, dependency, output, manifest, and QA metadata for future queue creation.',
    ].join(' '),
    blockers: status === 'blocked_by_package_gates'
      ? packageBlockers.length ? packageBlockers : ['Approved edit execution package is not agent-call ready.']
      : [],
    noRuntimeSideEffects: [
      'Job batch planning creates dry-run metadata only.',
      'No worker leases were claimed, no worker handlers ran, no media bytes were read, no tools/providers/renderers executed, no Supabase/GCS rows were written, and no billing mutation occurred.',
      'Future queue creation must re-check approved snapshot, credit reservation, idempotency, dependency readiness, private artifact manifests, and QA gates.',
    ],
    createdAt: nowIso(),
    mockOnly: true,
  }
}

function createPlannedWorkerJob(input: {
  workItem: EditWorkItem
  packageRecordId: string
  jobBatchPlanId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  forceBlocked: boolean
}): PlannedWorkerJob {
  const dependencyWorkItemIds = input.workItem.dependencies
    .map((dependency) => dependency.dependsOnWorkItemId)
    .filter((value): value is string => Boolean(value))
  const expectedOutputIds = input.workItem.expectedOutputs.map((output) => output.id)
  const status = input.forceBlocked ? 'blocked' : plannedWorkerJobStatus(input.workItem.status)

  return {
    id: `planned-job-${input.workItem.id}`,
    packageRecordId: input.packageRecordId,
    jobBatchPlanId: input.jobBatchPlanId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    workItemId: input.workItem.id,
    jobType: input.workItem.workItemType,
    runtimeJobType: runtimeJobTypeForWorkItem(input.workItem),
    workerType: workerTypeForWorkItem(input.workItem),
    status,
    idempotencyKey: input.workItem.idempotencyKey,
    dependencyWorkItemIds,
    expectedOutputIds,
    linkedSegmentIds: input.workItem.linkedSegmentIds,
    linkedRendererLayerIds: input.workItem.linkedRendererLayerIds,
    qaChecks: input.workItem.qaChecks,
    payloadJson: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      packageRecordId: input.packageRecordId,
      jobBatchPlanId: input.jobBatchPlanId,
      workItemId: input.workItem.id,
      workItemType: input.workItem.workItemType,
      runtimeJobType: runtimeJobTypeForWorkItem(input.workItem),
      expectedOutputIds,
      dependencyWorkItemIds,
      linkedSegmentIds: input.workItem.linkedSegmentIds,
      linkedVisualAssetPlanItemIds: input.workItem.linkedVisualAssetPlanItemIds,
      linkedTimingCueIds: input.workItem.linkedTimingCueIds,
      linkedRendererLayerIds: input.workItem.linkedRendererLayerIds,
      dryRunOnly: true,
    },
  }
}

function plannedWorkerJobStatus(status: EditWorkItemStatus): PlannedWorkerJobStatus {
  if (status === 'complete' || status === 'merged' || status === 'qa_passed') return 'metadata_complete'
  if (status === 'ready' || status === 'queued') return 'ready_to_queue'
  if (
    status === 'waiting_provider' ||
    status === 'waiting_worker' ||
    status === 'waiting_asset' ||
    status === 'waiting_user_review' ||
    status === 'planned' ||
    status === 'running' ||
    status === 'qa_pending' ||
    status === 'ready_to_merge'
  ) return 'waiting_dependency'
  return 'blocked'
}

function runtimeJobTypeForWorkItem(workItem: EditWorkItem): string {
  if (workItem.workItemType === 'render_remotion_preview') return 'render_preview'
  if (workItem.workItemType === 'render_final_export') return 'export'
  if (workItem.workItemType === 'generate_image_asset' || workItem.workItemType === 'generate_ai_video_asset') return 'generation'
  if (workItem.workItemType === 'capture_browser_asset') return 'browser_capture'
  if (
    workItem.workItemType === 'render_map_asset' ||
    workItem.workItemType === 'render_chart_asset' ||
    workItem.workItemType === 'run_audio_analysis' ||
    workItem.workItemType === 'run_audio_stretch' ||
    workItem.workItemType === 'process_image_asset' ||
    workItem.workItemType === 'process_video_asset' ||
    workItem.workItemType === 'generate_mask_asset'
  ) return 'tool_execution'
  if (workItem.workItemType === 'run_asset_qa' || workItem.workItemType === 'run_timing_qa' || workItem.workItemType === 'run_final_qa') return 'qa'
  return workItem.workItemType
}

function workerTypeForWorkItem(workItem: EditWorkItem): string {
  if (workItem.workItemType === 'render_remotion_preview' || workItem.workItemType === 'render_final_export') return 'render_worker'
  if (workItem.workItemType === 'prepare_remotion_layer') return 'render_planning_worker'
  if (workItem.workItemType === 'generate_image_asset' || workItem.workItemType === 'generate_ai_video_asset') return 'provider_asset_worker'
  if (
    workItem.workItemType === 'render_map_asset' ||
    workItem.workItemType === 'render_chart_asset' ||
    workItem.workItemType === 'capture_browser_asset' ||
    workItem.workItemType === 'run_audio_analysis' ||
    workItem.workItemType === 'run_audio_stretch' ||
    workItem.workItemType === 'process_image_asset' ||
    workItem.workItemType === 'process_video_asset' ||
    workItem.workItemType === 'generate_mask_asset'
  ) return 'tool_execution_worker'
  if (
    workItem.workItemType === 'prepare_caption_timing' ||
    workItem.workItemType === 'prepare_visual_cue_timing' ||
    workItem.workItemType === 'prepare_soundsync_timing' ||
    workItem.workItemType === 'run_timing_qa'
  ) return 'timing_worker'
  if (workItem.workItemType === 'run_asset_qa' || workItem.workItemType === 'run_final_qa') return 'qa_worker'
  if (workItem.agentLayer === 'editing_supervisor_agent') return 'editing_supervisor_worker'
  return workerTypeForAgentLayer(workItem.agentLayer)
}

function workerTypeForAgentLayer(agentLayer: EditingAgentLayer): string {
  if (agentLayer === 'asset_generation_agent') return 'provider_asset_worker'
  if (agentLayer === 'tool_execution_agent') return 'tool_execution_worker'
  if (agentLayer === 'renderer_agent') return 'render_worker'
  if (agentLayer === 'timing_agent') return 'timing_worker'
  if (agentLayer === 'qa_agent') return 'qa_worker'
  if (agentLayer === 'revision_agent') return 'revision_worker'
  if (agentLayer === 'editing_supervisor_agent') return 'editing_supervisor_worker'
  return 'planning_worker'
}

function createMockQueueFromJobBatchPlan(jobBatchPlan: ApprovedEditExecutionJobBatchPlan): ApprovedEditExecutionMockQueue {
  const mockQueueId = createMockId('edit_execution_mock_queue')
  const createdAt = nowIso()
  const queuedJobs = jobBatchPlan.plannedJobs
    .filter((job) => job.status === 'ready_to_queue')
    .map((job) => ({
      id: createMockId('queued_edit_job'),
      sourcePlannedJobId: job.id,
      jobBatchPlanId: jobBatchPlan.id,
      packageRecordId: jobBatchPlan.packageRecordId,
      workspaceId: job.workspaceId,
      projectId: job.projectId,
      approvedPlanSnapshotId: job.approvedPlanSnapshotId,
      creditReservationId: job.creditReservationId,
      workItemId: job.workItemId,
      jobType: job.jobType,
      runtimeJobType: job.runtimeJobType,
      workerType: job.workerType,
      status: 'queued' as const,
      idempotencyKey: job.idempotencyKey,
      dependencyWorkItemIds: job.dependencyWorkItemIds,
      expectedOutputIds: job.expectedOutputIds,
      qaChecks: job.qaChecks,
      payloadJson: {
        ...job.payloadJson,
        runtimeJobType: job.runtimeJobType,
        mockQueueId,
        queuedAt: createdAt,
        mockQueueOnly: true,
      },
      createdAt,
      mockOnly: true as const,
    }))

  return {
    id: mockQueueId,
    jobBatchPlanId: jobBatchPlan.id,
    packageRecordId: jobBatchPlan.packageRecordId,
    workspaceId: jobBatchPlan.workspaceId,
    projectId: jobBatchPlan.projectId,
    approvedPlanSnapshotId: jobBatchPlan.approvedPlanSnapshotId,
    creditReservationId: jobBatchPlan.creditReservationId,
    status: 'queued_for_mock_worker_review',
    mockQueueOnly: true,
    queuedJobs,
    queuedJobCount: queuedJobs.length,
    waitingDependencyCount: jobBatchPlan.waitingDependencyCount,
    blockedJobCount: jobBatchPlan.blockedJobCount,
    metadataCompleteCount: jobBatchPlan.metadataCompleteCount,
    workersStarted: 0,
    workerClaimsCreated: 0,
    userFacingSummary: 'The first ready edit tasks are queued for internal backend review. Editing work has not started yet.',
    backendHandoffSummary: [
      `${queuedJobs.length} ready job(s) were converted to mock queued job records.`,
      `${jobBatchPlan.waitingDependencyCount} job(s) remain waiting on dependencies; ${jobBatchPlan.blockedJobCount} blocked; ${jobBatchPlan.metadataCompleteCount} metadata-complete.`,
      'Worker dispatch remains a later gated step that must claim leases and re-check runtime/tool readiness.',
    ].join(' '),
    blockers: [],
    noRuntimeSideEffects: [
      'Mock queue creation stores queue metadata only.',
      'No worker lease was claimed, no worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, and no billing mutation happened.',
      'Future worker execution must re-check approved snapshot, credit reservation, dependency readiness, tool readiness, private artifact manifests, and QA gates.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createDispatchReadinessFromMockQueue(mockQueue: ApprovedEditExecutionMockQueue): ApprovedEditExecutionDispatchReadiness {
  const createdAt = nowIso()
  const readiness = mockQueue.queuedJobs.map(createQueuedJobDispatchReadiness)
  const readyForClaimCount = readiness.filter((item) => item.status === 'ready_for_worker_claim').length
  const blockedByGateCount = readiness.length - readyForClaimCount
  const status = blockedByGateCount > 0 ? 'blocked_by_worker_gates' : 'ready_for_worker_claim_review'
  const blockers = readiness.flatMap((item) =>
    item.failedRequiredGates.map((gate) => `${item.workItemId}: ${gate}`),
  )

  return {
    id: createMockId('edit_execution_dispatch_readiness'),
    mockQueueId: mockQueue.id,
    jobBatchPlanId: mockQueue.jobBatchPlanId,
    packageRecordId: mockQueue.packageRecordId,
    workspaceId: mockQueue.workspaceId,
    projectId: mockQueue.projectId,
    approvedPlanSnapshotId: mockQueue.approvedPlanSnapshotId,
    creditReservationId: mockQueue.creditReservationId,
    status,
    dryRunOnly: true,
    queuedJobCount: mockQueue.queuedJobCount,
    readyForClaimCount,
    blockedByGateCount,
    workersStarted: 0,
    workerClaimsCreated: 0,
    readiness,
    userFacingSummary: status === 'ready_for_worker_claim_review'
      ? 'The queued edit tasks passed dispatch-readiness checks for internal review. Editing work has not started yet.'
      : 'Some queued edit tasks still need gate fixes before worker claims can be attempted.',
    backendHandoffSummary: [
      `${readyForClaimCount} queued job(s) passed worker gate checks.`,
      `${blockedByGateCount} queued job(s) are blocked by worker gates.`,
      'This readiness audit does not claim workers; it only proves which queued jobs are eligible for a future claim attempt.',
    ].join(' '),
    blockers,
    noRuntimeSideEffects: [
      'Dispatch readiness runs gate checks against queued metadata only.',
      'No worker lease was claimed, no worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, and no billing mutation happened.',
      'Future worker claim and execution must still re-check idempotency, approved snapshot, credit reservation, dependency readiness, tool readiness, private artifact manifests, and QA gates.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createQueuedJobDispatchReadiness(queuedJob: MockQueuedWorkerJob): QueuedWorkerDispatchReadiness {
  const gateChecks = collectWorkerGateChecks({
    job: workerJobRecordFromQueuedJob(queuedJob),
    workerType: queuedJob.workerType,
    idempotencyKey: queuedJob.idempotencyKey,
    toolResults: [],
  })
  const requiredGateChecks = gateChecks.filter((gate) => gate.required)
  const failedRequiredGates = requiredGateChecks
    .filter((gate) => !gate.passed)
    .map((gate) => gate.gate)
  const status = failedRequiredGates.length > 0 ? 'blocked_by_gate' : 'ready_for_worker_claim'

  return {
    queuedJobId: queuedJob.id,
    workItemId: queuedJob.workItemId,
    jobType: queuedJob.jobType,
    runtimeJobType: queuedJob.runtimeJobType,
    workerType: queuedJob.workerType,
    idempotencyKey: queuedJob.idempotencyKey,
    expectedOutputIds: queuedJob.expectedOutputIds,
    qaChecks: queuedJob.qaChecks,
    status,
    requiredGateCount: requiredGateChecks.length,
    passedRequiredGateCount: requiredGateChecks.length - failedRequiredGates.length,
    failedRequiredGates,
    gateChecks,
  }
}

function createMockWorkerClaimsFromDispatchReadiness(input: {
  dispatchReadiness: ApprovedEditExecutionDispatchReadiness
  workerInstanceId: string
  leaseSeconds: number
}): ApprovedEditExecutionMockWorkerClaims {
  const createdAt = nowIso()
  const leaseExpiresAt = addSecondsIso(createdAt, input.leaseSeconds)
  const claimableReadiness = input.dispatchReadiness.readiness
    .filter((item) => item.status === 'ready_for_worker_claim')
  const workerClaims = claimableReadiness.map((item) => ({
    id: createMockId('mock_worker_claim'),
    dispatchReadinessId: input.dispatchReadiness.id,
    mockQueueId: input.dispatchReadiness.mockQueueId,
    queuedJobId: item.queuedJobId,
    workItemId: item.workItemId,
    jobType: item.jobType,
    runtimeJobType: item.runtimeJobType,
    workerType: item.workerType,
    workerInstanceId: input.workerInstanceId,
    claimStatus: 'claimed_mock_only' as const,
    attemptNumber: 1 as const,
    approvedPlanSnapshotId: input.dispatchReadiness.approvedPlanSnapshotId,
    creditReservationId: input.dispatchReadiness.creditReservationId,
    idempotencyKey: item.idempotencyKey,
    expectedOutputIds: item.expectedOutputIds,
    qaChecks: item.qaChecks,
    leaseExpiresAt,
    claimedAt: createdAt,
    createdAt,
    mockOnly: true as const,
  }))

  return {
    id: createMockId('edit_execution_mock_worker_claims'),
    dispatchReadinessId: input.dispatchReadiness.id,
    mockQueueId: input.dispatchReadiness.mockQueueId,
    jobBatchPlanId: input.dispatchReadiness.jobBatchPlanId,
    packageRecordId: input.dispatchReadiness.packageRecordId,
    workspaceId: input.dispatchReadiness.workspaceId,
    projectId: input.dispatchReadiness.projectId,
    approvedPlanSnapshotId: input.dispatchReadiness.approvedPlanSnapshotId,
    creditReservationId: input.dispatchReadiness.creditReservationId,
    status: 'claimed_for_mock_worker_review',
    mockClaimsOnly: true,
    claimCount: workerClaims.length,
    readyForClaimCount: input.dispatchReadiness.readyForClaimCount,
    blockedByGateCount: input.dispatchReadiness.blockedByGateCount,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    workerClaims,
    userFacingSummary: 'The edit tasks are reserved for internal worker review. Editing work has not started yet.',
    backendHandoffSummary: [
      `${workerClaims.length} mock worker claim lease(s) were created from dispatch-ready queued jobs.`,
      'The leases preserve worker type, queued job, approved snapshot, credit reservation, idempotency, and expiry metadata.',
      'No worker handler is invoked by this step; execution still requires a later backend handler gate.',
    ].join(' '),
    blockers: [],
    noRuntimeSideEffects: [
      'Mock worker claim creation stores claim lease metadata only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, and no billing mutation happened.',
      'Future handler execution must re-check active claim status, approved snapshot, credit reservation, dependency readiness, tool readiness, private artifact manifests, and QA gates.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createHandlerDryRunFromMockWorkerClaims(
  mockWorkerClaims: ApprovedEditExecutionMockWorkerClaims,
): ApprovedEditExecutionHandlerDryRun {
  const createdAt = nowIso()
  const workResults = mockWorkerClaims.workerClaims.map((claim) => createHandlerDryRunWorkResult({
    claim,
    mockWorkerClaims,
    completedAt: createdAt,
  }))
  const assetManifestUpdates = workResults.flatMap((result) => result.resultArtifactRefs)
  const qaHandoffRecords = workResults.map((result) => ({
    id: createMockId('handler_dry_run_qa_handoff'),
    workItemId: result.workItemId,
    workerClaimId: result.workerClaimId,
    qaStatus: 'qa_pending_after_dry_run' as const,
    qaChecks: result.qaChecks.length > 0
      ? result.qaChecks
      : ['Future QA must verify the real output before final render/export.'],
    blocksFinalRender: true as const,
    reason: 'Dry-run metadata is not a real output artifact, so final render remains blocked until a real worker result is produced and QA passes.',
  }))

  return {
    id: createMockId('edit_execution_handler_dry_run'),
    mockWorkerClaimsId: mockWorkerClaims.id,
    dispatchReadinessId: mockWorkerClaims.dispatchReadinessId,
    mockQueueId: mockWorkerClaims.mockQueueId,
    jobBatchPlanId: mockWorkerClaims.jobBatchPlanId,
    packageRecordId: mockWorkerClaims.packageRecordId,
    workspaceId: mockWorkerClaims.workspaceId,
    projectId: mockWorkerClaims.projectId,
    approvedPlanSnapshotId: mockWorkerClaims.approvedPlanSnapshotId,
    creditReservationId: mockWorkerClaims.creditReservationId,
    status: 'dry_run_completed_ready_for_result_reconciliation',
    handlerDryRunOnly: true,
    claimCount: mockWorkerClaims.claimCount,
    workResultCount: workResults.length,
    manifestUpdateCount: assetManifestUpdates.length,
    qaHandoffCount: qaHandoffRecords.length,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaArtifactsCreated: 0,
    liveExecutionReady: false,
    finalExportReady: false,
    workResults,
    assetManifestUpdates,
    qaHandoffRecords,
    userFacingSummary: 'The edit work has a safe internal result rehearsal. Real editing, QA, and export still need backend worker execution.',
    backendHandoffSummary: [
      `${workResults.length} mock handler work result(s) were created from claimed edit jobs.`,
      `${assetManifestUpdates.length} private placeholder artifact reference(s) were prepared for future manifest reconciliation.`,
      `${qaHandoffRecords.length} QA handoff record(s) remain pending because no real media/tool output exists yet.`,
      'Final render/export remains blocked until real worker outputs are stored privately and QA passes.',
    ].join(' '),
    blockers: [
      'Real worker handlers have not executed.',
      'Dry-run artifact references are not source-of-truth media outputs.',
      'QA handoff records are pending real artifact review.',
      'Final render/export remains blocked.',
    ],
    noRuntimeSideEffects: [
      'Handler dry-run stores deterministic result metadata only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, and no billing mutation happened.',
      'Future real execution must replace dry-run placeholders with private artifact references, QA results, cost events, and final render readiness evidence.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createResultReconciliationFromHandlerDryRun(
  handlerDryRun: ApprovedEditExecutionHandlerDryRun,
): ApprovedEditExecutionResultReconciliation {
  const createdAt = nowIso()
  const reconciledManifestItems = handlerDryRun.assetManifestUpdates.map((artifact) => ({
    artifactId: artifact.artifactId,
    outputId: artifact.outputId,
    workItemId: artifact.workItemId,
    storageProvider: artifact.storageProvider,
    storageObjectPath: artifact.storageObjectPath,
    privateArtifact: artifact.privateArtifact,
    sourceOfTruth: artifact.sourceOfTruth,
    mergeStatus: 'blocked_dry_run_placeholder' as const,
    reconciliationDecision: 'await_real_worker_artifact' as const,
    qaStatus: 'blocked_pending_real_artifact' as const,
    finalRenderEligible: false as const,
    reason: 'Dry-run placeholder refs prove shape only; they cannot be merged as final source-of-truth media artifacts.',
  }))
  const reconciledQAGates = handlerDryRun.qaHandoffRecords.map((record) => ({
    id: createMockId('result_reconciliation_qa_gate'),
    workItemId: record.workItemId,
    workerClaimId: record.workerClaimId,
    qaStatus: 'blocked_pending_real_artifact' as const,
    blocksFinalRender: true as const,
    requiredBeforeFinalExport: true as const,
    reason: record.reason,
  }))
  const blockingWorkItemIds = uniqueStrings([
    ...reconciledManifestItems.map((item) => item.workItemId),
    ...reconciledQAGates.map((gate) => gate.workItemId),
  ])
  const dryRunArtifactIds = reconciledManifestItems.map((item) => item.artifactId)

  return {
    id: createMockId('edit_execution_result_reconciliation'),
    handlerDryRunId: handlerDryRun.id,
    mockWorkerClaimsId: handlerDryRun.mockWorkerClaimsId,
    dispatchReadinessId: handlerDryRun.dispatchReadinessId,
    mockQueueId: handlerDryRun.mockQueueId,
    jobBatchPlanId: handlerDryRun.jobBatchPlanId,
    packageRecordId: handlerDryRun.packageRecordId,
    workspaceId: handlerDryRun.workspaceId,
    projectId: handlerDryRun.projectId,
    approvedPlanSnapshotId: handlerDryRun.approvedPlanSnapshotId,
    creditReservationId: handlerDryRun.creditReservationId,
    status: 'reconciled_dry_run_waiting_real_worker_outputs',
    reconcileDryRunOnly: true,
    workResultCount: handlerDryRun.workResultCount,
    manifestItemCount: reconciledManifestItems.length,
    qaGateCount: reconciledQAGates.length,
    sourceOfTruthArtifactCount: 0,
    finalRenderReady: false,
    previewReviewReady: false,
    liveExecutionReady: false,
    reconciledManifestItems,
    reconciledQAGates,
    finalRenderReadiness: {
      ready: false,
      reason: 'Final render waits for real private worker artifacts, source-of-truth manifest merge, QA pass records, and render/export readiness.',
      blockingWorkItemIds,
      qaPendingArtifactIds: dryRunArtifactIds,
      dryRunArtifactIds,
      sourceOfTruthArtifactCount: 0,
    },
    nextRequiredGate: 'real_worker_handler_execution_with_private_artifact_persistence',
    userFacingSummary: 'The edit pipeline has reconciled the internal dry-run. Real editing output, QA, and final export are still waiting on backend worker execution.',
    backendHandoffSummary: [
      `${handlerDryRun.workResultCount} dry-run result(s) were reconciled.`,
      `${reconciledManifestItems.length} placeholder artifact ref(s) are blocked from final merge until real private artifacts exist.`,
      `${reconciledQAGates.length} QA gate(s) remain blocked pending real artifacts.`,
      'The next gate is real worker handler execution with private artifact persistence.',
    ].join(' '),
    blockers: [
      'Dry-run placeholders are not source-of-truth media artifacts.',
      'Real worker handler execution has not produced private artifact refs.',
      'QA gates are blocked pending real artifacts.',
      'Preview review and final export remain blocked.',
    ],
    noRuntimeSideEffects: [
      'Result reconciliation stores deterministic manifest and QA readiness metadata only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, and no billing mutation happened.',
      'Future real execution must persist private artifacts, pass QA gates, emit cost events, and update final render readiness before export.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createHandlerDryRunWorkResult(input: {
  claim: MockWorkerClaimLease
  mockWorkerClaims: ApprovedEditExecutionMockWorkerClaims
  completedAt: string
}): HandlerDryRunWorkResult {
  const expectedOutputIds = input.claim.expectedOutputIds.length > 0
    ? input.claim.expectedOutputIds
    : [`${input.claim.workItemId}-status-output`]
  const resultArtifactRefs = expectedOutputIds.map((outputId) => ({
    artifactId: `dry-run-artifact-${input.claim.workItemId}-${outputId}`,
    outputId,
    workItemId: input.claim.workItemId,
    storageProvider: 'local_mock' as const,
    storageObjectPath: `mock/edit-execution/${input.mockWorkerClaims.packageRecordId}/${input.claim.workItemId}/${outputId}.json`,
    privateArtifact: true as const,
    sourceOfTruth: false as const,
    qaStatus: 'not_checked' as const,
  }))

  return {
    id: createMockId('handler_dry_run_work_result'),
    mockWorkerClaimsId: input.mockWorkerClaims.id,
    workerClaimId: input.claim.id,
    queuedJobId: input.claim.queuedJobId,
    workItemId: input.claim.workItemId,
    runtimeJobType: input.claim.runtimeJobType,
    workerType: input.claim.workerType,
    status: 'dry_run_completed_mock_only',
    approvedPlanSnapshotId: input.claim.approvedPlanSnapshotId,
    creditReservationId: input.claim.creditReservationId,
    idempotencyKey: input.claim.idempotencyKey,
    billableToUser: false,
    failureCategory: null,
    expectedOutputIds,
    resultArtifactRefs,
    qaChecks: input.claim.qaChecks,
    completedAt: input.completedAt,
    mockOnly: true,
  }
}

async function createLocalWorkerOutputFromResultReconciliation(input: {
  resultReconciliation: ApprovedEditExecutionResultReconciliation
  localStorageRoot: string
}): Promise<ApprovedEditExecutionLocalWorkerOutput> {
  const createdAt = nowIso()
  const id = createMockId('edit_execution_local_worker_output')
  const persistedArtifacts: PersistedLocalWorkerArtifact[] = []

  for (const artifact of input.resultReconciliation.reconciledManifestItems) {
    persistedArtifacts.push(await persistLocalWorkerArtifact({
      artifact,
      localStorageRoot: input.localStorageRoot,
      resultReconciliation: input.resultReconciliation,
      localWorkerOutputId: id,
      createdAt,
    }))
  }

  const qaHandoffRecords = persistedArtifacts.map((artifact) => ({
    id: createMockId('local_worker_output_qa_handoff'),
    workItemId: artifact.workItemId,
    artifactId: artifact.artifactId,
    qaStatus: 'qa_pending_local_output_review' as const,
    blocksFinalRender: true as const,
    requiredBeforeFinalExport: true as const,
    reason: 'Local worker output metadata exists, but media/tool output QA has not passed, so final render remains blocked.',
  }))
  const qaPendingArtifactIds = persistedArtifacts.map((artifact) => artifact.artifactId)

  return {
    id,
    resultReconciliationId: input.resultReconciliation.id,
    handlerDryRunId: input.resultReconciliation.handlerDryRunId,
    mockWorkerClaimsId: input.resultReconciliation.mockWorkerClaimsId,
    dispatchReadinessId: input.resultReconciliation.dispatchReadinessId,
    mockQueueId: input.resultReconciliation.mockQueueId,
    jobBatchPlanId: input.resultReconciliation.jobBatchPlanId,
    packageRecordId: input.resultReconciliation.packageRecordId,
    workspaceId: input.resultReconciliation.workspaceId,
    projectId: input.resultReconciliation.projectId,
    approvedPlanSnapshotId: input.resultReconciliation.approvedPlanSnapshotId,
    creditReservationId: input.resultReconciliation.creditReservationId,
    status: 'local_worker_outputs_persisted_waiting_qa',
    localOutputOnly: true,
    workResultCount: input.resultReconciliation.workResultCount,
    persistedArtifactCount: persistedArtifacts.length,
    sourceOfTruthArtifactCount: persistedArtifacts.length,
    mediaArtifactCount: 0,
    qaPendingCount: qaHandoffRecords.length,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: false,
    finalRenderReady: false,
    persistedArtifacts,
    qaHandoffRecords,
    finalRenderReadiness: {
      ready: false,
      reason: 'Private local output metadata exists for internal review, but final render waits for real media/tool artifacts, QA pass records, and render/export readiness.',
      qaPendingArtifactIds,
      sourceOfTruthArtifactCount: persistedArtifacts.length,
      mediaArtifactCount: 0,
    },
    nextRequiredGate: 'local_worker_output_qa_review',
    userFacingSummary: 'The edit has private internal output records ready for review. Final video export still waits for real media/tool processing and QA.',
    backendHandoffSummary: [
      `${persistedArtifacts.length} private local worker output metadata artifact(s) were written under LOCAL_STORAGE_ROOT.`,
      `${qaHandoffRecords.length} QA handoff record(s) remain pending before any render/export can be considered ready.`,
      'These files are source-of-truth metadata for internal worker-output review, not source media or final rendered video.',
    ].join(' '),
    blockers: [
      'Local worker outputs are metadata-only records, not processed media artifacts.',
      'Tool/media worker execution has not produced QA-passed media outputs.',
      'Final render/export remains blocked until real artifacts and QA pass.',
    ],
    noRuntimeSideEffects: [
      'Local worker output persistence writes private JSON metadata records only.',
      'No tool/provider/media/render operation executed, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future real execution must replace metadata-only records with private media artifacts, QA pass records, cost events, and render/export readiness evidence.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createLocalWorkerOutputQaReviewFromLocalWorkerOutput(
  localWorkerOutput: ApprovedEditExecutionLocalWorkerOutput,
): ApprovedEditExecutionLocalWorkerOutputQaReview {
  const createdAt = nowIso()
  const qaResults = localWorkerOutput.persistedArtifacts.map(createLocalWorkerOutputQaReviewRecord)
  const passedArtifactIds = qaResults
    .filter((result) => result.metadataIntegrityPassed)
    .map((result) => result.artifactId)
  const blockedArtifactIds = qaResults
    .filter((result) => !result.metadataIntegrityPassed)
    .map((result) => result.artifactId)
  const passedArtifactCount = passedArtifactIds.length
  const blockedArtifactCount = blockedArtifactIds.length
  const passed = blockedArtifactCount === 0

  return {
    id: createMockId('local_worker_output_qa_review'),
    localWorkerOutputId: localWorkerOutput.id,
    resultReconciliationId: localWorkerOutput.resultReconciliationId,
    handlerDryRunId: localWorkerOutput.handlerDryRunId,
    packageRecordId: localWorkerOutput.packageRecordId,
    workspaceId: localWorkerOutput.workspaceId,
    projectId: localWorkerOutput.projectId,
    approvedPlanSnapshotId: localWorkerOutput.approvedPlanSnapshotId,
    creditReservationId: localWorkerOutput.creditReservationId,
    status: passed
      ? 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution'
      : 'local_worker_output_qa_blocked_metadata_integrity',
    qaReviewOnly: true,
    reviewedArtifactCount: qaResults.length,
    passedArtifactCount,
    blockedArtifactCount,
    sourceOfTruthArtifactCount: localWorkerOutput.sourceOfTruthArtifactCount,
    mediaArtifactCount: 0,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: passed,
    renderPreviewReady: false,
    finalRenderReady: false,
    qaResults,
    finalRenderReadiness: {
      ready: false,
      reason: passed
        ? 'Local worker output metadata QA passed, but final render still waits for uploaded-media worker execution, private media artifacts, media QA, and render/export readiness.'
        : 'Local worker output metadata QA found integrity blockers that must be fixed before uploaded-media worker execution can proceed.',
      metadataQaPassedArtifactIds: passedArtifactIds,
      mediaQaRequiredArtifactIds: passed ? passedArtifactIds : blockedArtifactIds,
      sourceOfTruthArtifactCount: localWorkerOutput.sourceOfTruthArtifactCount,
      mediaArtifactCount: 0,
    },
    nextRequiredGate: passed
      ? 'uploaded_media_worker_execution_with_private_artifact_outputs'
      : 'local_worker_output_metadata_integrity_fix',
    userFacingSummary: passed
      ? 'The internal worker-output metadata passed review. Real uploaded-media editing still needs backend worker execution before preview or export.'
      : 'Some internal worker-output metadata failed review and needs to be fixed before real uploaded-media execution.',
    backendHandoffSummary: [
      `${qaResults.length} local worker output metadata artifact(s) were reviewed.`,
      `${passedArtifactCount} passed metadata integrity checks; ${blockedArtifactCount} blocked.`,
      'This QA review accepts private metadata integrity only and does not approve media output, render preview, final export, live runtime, Supabase/GCS writes, or billing.',
    ].join(' '),
    blockers: passed
      ? [
          'No uploaded user media has been processed by backend worker handlers.',
          'No private media artifacts or media QA pass records exist yet.',
          'Final render/export remains blocked until uploaded-media worker execution and QA pass.',
        ]
      : [
          'One or more local worker output metadata artifacts failed integrity checks.',
          'Uploaded-media worker execution must wait until metadata integrity blockers are resolved.',
          'Final render/export remains blocked.',
        ],
    noRuntimeSideEffects: [
      'Local worker output QA reviewed private metadata records only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future uploaded-media execution must persist private media artifacts, pass media QA, and update render/export readiness before any user-facing delivery.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createLocalWorkerOutputQaReviewRecord(
  artifact: PersistedLocalWorkerArtifact,
): LocalWorkerOutputQaReviewRecord {
  const checks: LocalWorkerOutputQaCheck[] = [
    {
      check: 'private_metadata_record',
      passed: artifact.privateArtifact === true && artifact.storageProvider === 'local_private',
      message: 'Artifact is stored as a private local metadata record.',
    },
    {
      check: 'checksum_present',
      passed: /^[a-f0-9]{64}$/i.test(artifact.sha256) && artifact.byteSize > 0,
      message: 'Artifact includes checksum and byte-size evidence.',
    },
    {
      check: 'no_signed_url',
      passed: artifact.signedUrl === null && !/^https?:\/\//i.test(artifact.storageObjectPath),
      message: 'Artifact does not expose signed URLs or public URL paths.',
    },
    {
      check: 'no_public_artifact',
      passed: artifact.publicArtifact === false,
      message: 'Artifact is not marked public.',
    },
    {
      check: 'metadata_only_scope',
      passed: artifact.sourceOfTruth === true && artifact.sourceOfTruthScope === 'local_worker_output_metadata_only',
      message: 'Artifact is source-of-truth metadata only.',
    },
    {
      check: 'no_media_bytes_claim',
      passed: artifact.mediaArtifact === false && artifact.finalRenderEligible === false,
      message: 'Artifact does not claim media bytes or final-render eligibility.',
    },
  ]
  const metadataIntegrityPassed = checks.every((check) => check.passed)

  return {
    id: createMockId('local_worker_output_qa_result'),
    artifactId: artifact.artifactId,
    workItemId: artifact.workItemId,
    qaStatus: metadataIntegrityPassed ? 'passed_metadata_integrity_only' : 'blocked_metadata_integrity',
    metadataIntegrityPassed,
    mediaQaRequired: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    checks,
    reason: metadataIntegrityPassed
      ? 'Metadata integrity passed. Media artifact production and media QA are still required before render/export.'
      : 'Metadata integrity failed. The artifact must be corrected before uploaded-media worker execution can continue.',
  }
}

async function persistLocalWorkerArtifact(input: {
  artifact: ReconciledManifestItem
  localStorageRoot: string
  resultReconciliation: ApprovedEditExecutionResultReconciliation
  localWorkerOutputId: string
  createdAt: string
}): Promise<PersistedLocalWorkerArtifact> {
  const artifactId = `local-output-${safePathPart(input.artifact.artifactId)}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.resultReconciliation.workspaceId),
    safePathPart(input.resultReconciliation.projectId),
    safePathPart(input.resultReconciliation.id),
    `${safePathPart(artifactId)}.json`,
  )
  const localFilePath = join(input.localStorageRoot, relativeObjectPath)
  const storageObjectPath = relativeObjectPath.split('/').join('/')
  const payload = {
    artifactId,
    sourceArtifactId: input.artifact.artifactId,
    outputId: input.artifact.outputId,
    workItemId: input.artifact.workItemId,
    packageRecordId: input.resultReconciliation.packageRecordId,
    approvedPlanSnapshotId: input.resultReconciliation.approvedPlanSnapshotId,
    creditReservationId: input.resultReconciliation.creditReservationId,
    resultReconciliationId: input.resultReconciliation.id,
    localWorkerOutputId: input.localWorkerOutputId,
    storageProvider: 'local_private',
    sourceOfTruthScope: 'local_worker_output_metadata_only',
    mediaArtifact: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    qaStatus: 'qa_pending_local_output_review',
    finalRenderEligible: false,
    previewReviewEligible: true,
    createdAt: input.createdAt,
    noRuntimeSideEffects: [
      'This record was created by local metadata persistence only.',
      'It does not contain source media bytes, rendered media bytes, raw prompts, secrets, signed URLs, or public artifact links.',
    ],
  }
  const content = `${JSON.stringify(stableJsonValue(payload), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content,
  })

  return {
    artifactId,
    sourceArtifactId: input.artifact.artifactId,
    outputId: input.artifact.outputId,
    workItemId: input.artifact.workItemId,
    storageProvider: 'local_private',
    storageObjectPath,
    localFilePath,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'local_worker_output_metadata_only',
    mediaArtifact: false,
    sha256: createHash('sha256').update(content).digest('hex'),
    byteSize: Buffer.byteLength(content),
    qaStatus: 'qa_pending_local_output_review',
    finalRenderEligible: false,
    previewReviewEligible: true,
    createdAt: input.createdAt,
  }
}

async function createRegisteredAdapterPrivateMediaRunnerQaReview(input: {
  privateMediaRunnerRun: ProfessionalToolAdapterPrivateMediaRunnerRun
  localStorageRoot: string
  createdAt: string
}): Promise<RegisteredAdapterPrivateMediaRunnerQaReview> {
  const privateMediaRunnerRun = input.privateMediaRunnerRun
  const id = createMockId('registered_adapter_private_runner_qa_review')
  const blockers = [
    ...(privateMediaRunnerRun.status !== 'private_runner_manifest_ready' ? ['Private runner manifests are not ready for QA review.'] : []),
    ...(privateMediaRunnerRun.activities.length === 0 ? ['No private runner activity manifests are available for QA review.'] : []),
  ]

  const artifacts = blockers.length
    ? []
    : await Promise.all(privateMediaRunnerRun.activities.map((activity, index) => persistRegisteredAdapterPrivateRunnerQaArtifact({
      privateMediaRunnerRun,
      reviewId: id,
      activity,
      index,
      localStorageRoot: input.localStorageRoot,
      createdAt: input.createdAt,
    })))

  const passedActivityCount = artifacts.length
  const blockedActivityCount = Math.max(0, privateMediaRunnerRun.activities.length - passedActivityCount)
  const boundedNodePackageExecutionCount = artifacts.filter((artifact) =>
    artifact.boundedPackageExecution.status === 'executed_bounded_node_package'
  ).length
  const actualToolPackageExecutionCount = artifacts.filter((artifact) => artifact.actualToolPackageExecuted).length
  const status = blockers.length || blockedActivityCount > 0
    ? 'blocked'
    : 'private_adapter_result_qa_passed_waiting_final_render_integration'

  return {
    id,
    privateMediaRunnerRunId: privateMediaRunnerRun.id,
    registeredRunnerRunId: privateMediaRunnerRun.registeredRunnerRunId,
    boundedAdapterExecutionRunId: privateMediaRunnerRun.boundedAdapterExecutionRunId,
    packageRecordId: privateMediaRunnerRun.packageRecordId,
    workspaceId: privateMediaRunnerRun.workspaceId,
    projectId: privateMediaRunnerRun.projectId,
    approvedPlanSnapshotId: privateMediaRunnerRun.approvedPlanSnapshotId,
    creditReservationId: privateMediaRunnerRun.creditReservationId,
    status,
    qaReviewOnly: true,
    reviewedActivityCount: privateMediaRunnerRun.activities.length,
    passedActivityCount,
    blockedActivityCount,
    artifactCount: artifacts.length,
    boundedNodePackageExecutionCount,
    actualToolPackageExecutionCount,
    mediaProcessingExecuted: false,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    artifacts,
    blockers: status === 'blocked'
      ? [
        ...blockers,
        ...(blockedActivityCount > 0 ? [`${blockedActivityCount} private runner activity manifest(s) did not produce QA evidence.`] : []),
      ]
      : [],
    finalRenderIntegrationReadiness: {
      ready: false,
      reason: 'Private adapter QA artifacts are recorded, but final render integration still requires an adapter-specific worker artifact integration gate.',
      adapterQaArtifactCount: artifacts.length,
      nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render',
    },
    nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render',
    userFacingSummary: status === 'private_adapter_result_qa_passed_waiting_final_render_integration'
      ? `Private QA recorded ${artifacts.length} verified edit activit${artifacts.length === 1 ? 'y' : 'ies'} for the next render-integration gate.`
      : 'Private QA could not verify every edit activity yet.',
    internalExecutionSummary: [
      `Private runner QA review ${id} reviewed ${privateMediaRunnerRun.activities.length} activity manifest(s).`,
      `Completed ${actualToolPackageExecutionCount} bounded backend package/binary check(s), including ${boundedNodePackageExecutionCount} Node package import/API-shape check(s).`,
      `Persisted ${artifacts.length} private JSON artifact(s) with checksums.`,
      'No media transform, render, provider call, Supabase/GCS write, public artifact, signed URL, product runtime, or billing mutation was performed.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Registered adapter private runner QA may perform bounded package import/API-shape or binary presence checks, but it does not execute adapter media transforms.',
      'Final render integration remains blocked until adapter-specific worker artifacts pass the next backend gate.',
      'The artifacts are private local storage records with checksums, no signed URLs, and no public delivery state.',
    ],
    createdAt: input.createdAt,
    mockOnly: true,
  }
}

async function createRegisteredAdapterBoundedPackageExecutionProof(
  activity: ProfessionalToolAdapterPrivateMediaRunnerRun['activities'][number],
): Promise<RegisteredAdapterBoundedPackageExecutionProof> {
  const toolId = activity.canonicalToolId
  const packageName = getProfessionalToolAdapterNodeRunnerPackage(toolId)
  if (!packageName) {
    const pythonImport = getProfessionalToolAdapterPythonRunnerImport(toolId)
    if (pythonImport) {
      const runtimeBinary = activity.runtimeBinary
      if (!runtimeBinary || activity.runnerRuntime !== 'python') {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Bounded adapter Python package execution requires a configured backend Python runtime from the registered import probe.', 409, {
          toolId,
          packageName: pythonImport.packageName,
          importName: pythonImport.importName,
          runnerRuntime: activity.runnerRuntime,
          runtimeBinary: runtimeBinary ?? null,
          mediaProcessingExecuted: false,
          productRuntimeExecuted: false,
          publicArtifact: false,
          signedUrl: null,
        })
      }

      try {
        const { stdout } = await execFileAsync(runtimeBinary, [
          '-c',
          createBoundedPythonImportApiShapeProbeScript(pythonImport.importName),
        ], { timeout: 15_000, maxBuffer: 1024 * 1024 })
        const apiShape = parseBoundedPythonApiShapeProbeOutput(stdout)

        return {
          status: 'executed_bounded_python_package',
          runtime: 'python',
          packageName: pythonImport.packageName,
          importName: pythonImport.importName,
          runtimeBinary,
          operation: 'python_import_api_shape_probe',
          actualToolPackageExecuted: true,
          mediaProcessingExecuted: false,
          productRuntimeExecuted: false,
          frontendExecutionAllowed: false,
          publicArtifact: false,
          signedUrl: null,
          exportSurfaceSample: apiShape.exportSurfaceSample,
          summary: `${toolId} completed a bounded Python package import/API-shape probe without media processing or product runtime execution.`,
        }
      } catch (error) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Bounded adapter Python package execution requires the worker package to import successfully.', 409, {
          toolId,
          packageName: pythonImport.packageName,
          importName: pythonImport.importName,
          runtimeBinary,
          operation: 'python_import_api_shape_probe',
          mediaProcessingExecuted: false,
          productRuntimeExecuted: false,
          publicArtifact: false,
          signedUrl: null,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const binaryCommand = getProfessionalToolAdapterBinaryRunnerCommand(toolId)
    if (binaryCommand) {
      const runtimeBinary = activity.runtimeBinary ?? binaryCommand.commandName
      try {
        const { stdout } = await execFileAsync('/usr/bin/env', [
          'sh',
          '-lc',
          `command -v ${binaryCommand.commandName}`,
        ], { timeout: 10_000, maxBuffer: 1024 * 1024 })
        const resolvedBinary = stdout.trim() || runtimeBinary

        return {
          status: 'executed_bounded_binary_package',
          runtime: 'binary',
          packageName: binaryCommand.packageName,
          importName: binaryCommand.commandName,
          runtimeBinary: resolvedBinary,
          operation: 'binary_presence_probe',
          actualToolPackageExecuted: true,
          mediaProcessingExecuted: false,
          productRuntimeExecuted: false,
          frontendExecutionAllowed: false,
          publicArtifact: false,
          signedUrl: null,
          exportSurfaceSample: [
            `${binaryCommand.packageName}:${binaryCommand.commandName}`,
            `binary_path:${resolvedBinary}`,
            ...binaryCommand.declaredWorkerImageRoles.map((role) => `worker:${role}`),
          ].slice(0, 16),
          summary: `${toolId} completed a bounded backend binary presence probe without media processing, render/export, or product runtime execution.`,
        }
      } catch (error) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Bounded adapter binary package execution requires the worker binary to resolve successfully.', 409, {
          toolId,
          packageName: binaryCommand.packageName,
          commandName: binaryCommand.commandName,
          runtimeBinary,
          operation: 'binary_presence_probe',
          mediaProcessingExecuted: false,
          productRuntimeExecuted: false,
          publicArtifact: false,
          signedUrl: null,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return {
      status: 'not_applicable',
      runtime: 'none',
      packageName: null,
      importName: null,
      runtimeBinary: null,
      operation: 'none',
      actualToolPackageExecuted: false,
      mediaProcessingExecuted: false,
      productRuntimeExecuted: false,
      frontendExecutionAllowed: false,
      publicArtifact: false,
      signedUrl: null,
      exportSurfaceSample: [],
      summary: `${toolId} has no registered package or binary runner for bounded private QA; media-transform execution remains backend-gated.`,
    }
  }

  try {
    const importedModule = await import(packageName)
    const exportSurfaceSample = Object.keys(importedModule)
      .filter((key) => key.length > 0 && key.length < 80)
      .slice(0, 12)

    return {
      status: 'executed_bounded_node_package',
      runtime: 'node',
      packageName,
      importName: packageName,
      runtimeBinary: null,
      operation: 'dynamic_import_api_shape_probe',
      actualToolPackageExecuted: true,
      mediaProcessingExecuted: false,
      productRuntimeExecuted: false,
      frontendExecutionAllowed: false,
      publicArtifact: false,
      signedUrl: null,
      exportSurfaceSample,
      summary: `${toolId} completed a bounded Node package dynamic import/API-shape probe without media processing or product runtime execution.`,
    }
  } catch (error) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Bounded adapter package execution requires the Node package to import successfully.', 409, {
      toolId,
      packageName,
      operation: 'dynamic_import_api_shape_probe',
      mediaProcessingExecuted: false,
      productRuntimeExecuted: false,
      publicArtifact: false,
      signedUrl: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  }
}

function createBoundedPythonImportApiShapeProbeScript(importName: string): string {
  const importNames = importName.split(',').map((name) => name.trim()).filter(Boolean)
  return [
    'import importlib, json',
    `import_names = ${JSON.stringify(importNames)}`,
    'modules = []',
    'for import_name in import_names:',
    '    module = importlib.import_module(import_name)',
    '    api_sample = [item for item in dir(module) if item and not item.startswith("_")][:12]',
    '    modules.append({',
    '        "importName": import_name,',
    '        "version": str(getattr(module, "__version__", "unknown"))[:80],',
    '        "apiSample": api_sample,',
    '    })',
    'print(json.dumps({"modules": modules}, sort_keys=True))',
  ].join('\n')
}

function parseBoundedPythonApiShapeProbeOutput(stdout: string): { exportSurfaceSample: string[] } {
  const parsed = JSON.parse(stdout.trim()) as {
    modules?: Array<{
      importName?: unknown
      version?: unknown
      apiSample?: unknown
    }>
  }
  const exportSurfaceSample = (parsed.modules ?? [])
    .flatMap((module) => {
      const importName = typeof module.importName === 'string' ? module.importName : 'unknown'
      const version = typeof module.version === 'string' ? module.version : 'unknown'
      const apiSample = Array.isArray(module.apiSample)
        ? module.apiSample.filter((item): item is string => typeof item === 'string')
        : []
      return [
        `${importName}@${version}`,
        ...apiSample.map((item) => `${importName}.${item}`),
      ]
    })
    .slice(0, 16)

  if (exportSurfaceSample.length === 0) {
    throw new Error('Python import probe did not return an API surface sample.')
  }

  return { exportSurfaceSample }
}

async function persistRegisteredAdapterPrivateRunnerQaArtifact(input: {
  privateMediaRunnerRun: ProfessionalToolAdapterPrivateMediaRunnerRun
  reviewId: string
  activity: ProfessionalToolAdapterPrivateMediaRunnerRun['activities'][number]
  index: number
  localStorageRoot: string
  createdAt: string
}): Promise<RegisteredAdapterPrivateMediaRunnerQaArtifact> {
  const boundedPackageExecution = await createRegisteredAdapterBoundedPackageExecutionProof(input.activity)
  const artifactId = `private-runner-qa-${safePathPart(input.activity.canonicalToolId)}-${String(input.index + 1).padStart(2, '0')}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.privateMediaRunnerRun.workspaceId),
    safePathPart(input.privateMediaRunnerRun.projectId),
    safePathPart(input.privateMediaRunnerRun.id),
    'registered-adapter-private-runner-qa',
    `${safePathPart(artifactId)}.json`,
  )
  const localFilePath = join(input.localStorageRoot, relativeObjectPath)
  const storageObjectPath = relativeObjectPath.split('/').join('/')
  const payload = {
    manifestVersion: 'registered-adapter-private-media-runner-qa-artifact-v1',
    artifactId,
    reviewId: input.reviewId,
    privateMediaRunnerRunId: input.privateMediaRunnerRun.id,
    registeredRunnerRunId: input.privateMediaRunnerRun.registeredRunnerRunId,
    boundedAdapterExecutionRunId: input.privateMediaRunnerRun.boundedAdapterExecutionRunId,
    packageRecordId: input.privateMediaRunnerRun.packageRecordId,
    workspaceId: input.privateMediaRunnerRun.workspaceId,
    projectId: input.privateMediaRunnerRun.projectId,
    approvedPlanSnapshotId: input.privateMediaRunnerRun.approvedPlanSnapshotId,
    creditReservationId: input.privateMediaRunnerRun.creditReservationId,
    activityExecutionId: input.activity.activityExecutionId,
    sourceActivityResultId: input.activity.sourceActivityResultId,
    canonicalToolId: input.activity.canonicalToolId,
    userFacingActivity: input.activity.userFacingActivity,
    status: input.activity.status,
    registeredImportProbeReady: input.activity.registeredImportProbeReady,
    runnerRuntime: input.activity.runnerRuntime,
    packageName: input.activity.packageName,
    importName: input.activity.importName,
    runtimeBinary: input.activity.runtimeBinary,
    privateInputManifestKinds: input.activity.privateInputManifestKinds,
    privateOutputManifestKinds: input.activity.privateOutputManifestKinds,
    qaGates: input.activity.qaGates,
    sourcePrivateRunnerResultManifest: input.activity.privateRunnerResultManifest,
    runnerBoundary: input.activity.runnerBoundary,
    boundedPackageExecution,
    storageProvider: 'local_private',
    sourceOfTruth: true,
    sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    mediaProcessingExecuted: false,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    finalRenderIntegrationEligible: false,
    qaStatus: 'passed_private_runner_manifest_qa',
    createdAt: input.createdAt,
    noRuntimeSideEffects: [
      'This artifact records private adapter QA evidence only.',
      'It contains no media bytes, raw prompts, secrets, signed URLs, public artifact links, Supabase/GCS writes, or billing mutations.',
    ],
  }
  const content = `${JSON.stringify(stableJsonValue(payload), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content,
  })

  return {
    artifactId,
    activityExecutionId: input.activity.activityExecutionId,
    canonicalToolId: input.activity.canonicalToolId,
    boundedPackageExecution,
    actualToolPackageExecuted: boundedPackageExecution.actualToolPackageExecuted,
    storageProvider: 'local_private',
    storageObjectPath,
    localFilePath,
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact',
    sha256: createHash('sha256').update(content).digest('hex'),
    byteSize: Buffer.byteLength(content),
    qaStatus: 'passed_private_runner_manifest_qa',
    finalRenderIntegrationEligible: false,
    createdAt: input.createdAt,
  }
}

async function createAdapterWorkerArtifactIntegrationFromQaReview(input: {
  privateMediaRunnerQaReview: RegisteredAdapterPrivateMediaRunnerQaReview
  localStorageRoot: string
  createdAt: string
}): Promise<ApprovedEditExecutionAdapterWorkerArtifactIntegration> {
  const privateMediaRunnerQaReview = input.privateMediaRunnerQaReview
  const id = createMockId('adapter_worker_artifact_integration')

  const integratedArtifacts: AdapterWorkerArtifactIntegrationArtifact[] = []
  const blockers: string[] = []

  for (const artifact of privateMediaRunnerQaReview.artifacts) {
    try {
      const [artifactStat, artifactBytes] = await Promise.all([
        stat(artifact.localFilePath),
        readFile(artifact.localFilePath),
      ])
      const actualSha256 = createHash('sha256').update(artifactBytes).digest('hex')
      if (!artifactStat.isFile()) {
        blockers.push(`${artifact.artifactId} is not a regular private QA artifact file.`)
        continue
      }
      if (artifactStat.size !== artifact.byteSize) {
        blockers.push(`${artifact.artifactId} byte size drifted before render integration.`)
        continue
      }
      if (actualSha256 !== artifact.sha256) {
        blockers.push(`${artifact.artifactId} checksum drifted before render integration.`)
        continue
      }
      integratedArtifacts.push({
        artifactId: `adapter-render-integration-${safePathPart(artifact.artifactId)}`,
        sourceQaArtifactId: artifact.artifactId,
        activityExecutionId: artifact.activityExecutionId,
        canonicalToolId: artifact.canonicalToolId,
        boundedPackageExecution: artifact.boundedPackageExecution,
        actualToolPackageExecuted: artifact.actualToolPackageExecuted,
        storageProvider: artifact.storageProvider,
        storageObjectPath: artifact.storageObjectPath,
        localFilePath: artifact.localFilePath,
        mimeType: artifact.mimeType,
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
        sourceOfTruth: true,
        sourceOfTruthScope: artifact.sourceOfTruthScope,
        sha256: artifact.sha256,
        byteSize: artifact.byteSize,
        qaStatus: artifact.qaStatus,
        renderIntegrationStatus: 'attached_to_private_render_manifest',
        finalRenderIntegrationEligible: true,
        mediaTransformOutputEligible: false,
      })
    } catch (error) {
      blockers.push(`${artifact.artifactId} could not be read before render integration: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (privateMediaRunnerQaReview.status !== 'private_adapter_result_qa_passed_waiting_final_render_integration') {
    blockers.push(`Private runner QA review status is ${privateMediaRunnerQaReview.status}.`)
  }
  if (integratedArtifacts.length !== privateMediaRunnerQaReview.artifactCount) {
    blockers.push(`Integrated ${integratedArtifacts.length} of ${privateMediaRunnerQaReview.artifactCount} private QA artifact(s).`)
  }
  if (blockers.length > 0) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Adapter worker artifact integration requires intact QA-passed private artifacts.', 409, {
      privateMediaRunnerQaReviewId: privateMediaRunnerQaReview.id,
      blockers,
    })
  }

  const manifestArtifactId = `adapter-worker-artifact-integration-manifest-${safePathPart(id)}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(privateMediaRunnerQaReview.workspaceId),
    safePathPart(privateMediaRunnerQaReview.projectId),
    safePathPart(privateMediaRunnerQaReview.id),
    'adapter-worker-artifact-integration',
    `${safePathPart(manifestArtifactId)}.json`,
  )
  const localFilePath = join(input.localStorageRoot, relativeObjectPath)
  const storageObjectPath = relativeObjectPath.split('/').join('/')
  const manifestPayload = {
    manifestVersion: 'adapter-worker-artifact-render-integration-v1',
    adapterWorkerArtifactIntegrationId: id,
    privateMediaRunnerQaReviewId: privateMediaRunnerQaReview.id,
    privateMediaRunnerRunId: privateMediaRunnerQaReview.privateMediaRunnerRunId,
    registeredRunnerRunId: privateMediaRunnerQaReview.registeredRunnerRunId,
    boundedAdapterExecutionRunId: privateMediaRunnerQaReview.boundedAdapterExecutionRunId,
    packageRecordId: privateMediaRunnerQaReview.packageRecordId,
    workspaceId: privateMediaRunnerQaReview.workspaceId,
    projectId: privateMediaRunnerQaReview.projectId,
    approvedPlanSnapshotId: privateMediaRunnerQaReview.approvedPlanSnapshotId,
    creditReservationId: privateMediaRunnerQaReview.creditReservationId,
    status: 'adapter_worker_artifact_integration_passed_ready_for_render_preview',
    integrationOnly: true,
    reviewedArtifactCount: privateMediaRunnerQaReview.artifactCount,
    integratedArtifactCount: integratedArtifacts.length,
    mediaProcessingExecuted: false,
    mediaTransformOutputCount: 0,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    renderPreviewIntegrationReady: true,
    finalRenderDecisionManifestEligible: true,
    mediaTransformOutputEligible: false,
    artifacts: integratedArtifacts.map((artifact) => ({
      sourceQaArtifactId: artifact.sourceQaArtifactId,
      canonicalToolId: artifact.canonicalToolId,
      boundedPackageExecutionStatus: artifact.boundedPackageExecution?.status,
      actualToolPackageExecuted: artifact.actualToolPackageExecuted === true,
      storageProvider: artifact.storageProvider,
      storageObjectPath: artifact.storageObjectPath,
      mimeType: artifact.mimeType,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
      renderIntegrationStatus: artifact.renderIntegrationStatus,
      finalRenderIntegrationEligible: artifact.finalRenderIntegrationEligible,
      mediaTransformOutputEligible: artifact.mediaTransformOutputEligible,
      privateArtifact: artifact.privateArtifact,
      publicArtifact: artifact.publicArtifact,
      signedUrl: artifact.signedUrl,
    })),
    nextRequiredGate: 'render_preview_assembly_with_private_adapter_integration',
    createdAt: input.createdAt,
    noRuntimeSideEffects: [
      'This manifest links private adapter QA evidence into the private render-preview decision path only.',
      'It does not create media-transform outputs, public artifacts, signed URLs, provider calls, Supabase/GCS writes, or billing mutations.',
    ],
  }
  const content = `${JSON.stringify(stableJsonValue(manifestPayload), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content,
  })
  const manifestStat = await stat(localFilePath)
  const integrationManifestArtifact: AdapterWorkerArtifactIntegrationManifestArtifact = {
    artifactId: manifestArtifactId,
    storageProvider: 'local_private',
    storageObjectPath,
    localFilePath,
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'adapter_worker_artifact_render_integration_manifest',
    sha256: createHash('sha256').update(content).digest('hex'),
    byteSize: manifestStat.size,
    integratedArtifactCount: integratedArtifacts.length,
    previewAssemblyEligible: true,
    finalRenderDecisionManifestEligible: true,
  }

  return {
    id,
    privateMediaRunnerQaReviewId: privateMediaRunnerQaReview.id,
    privateMediaRunnerRunId: privateMediaRunnerQaReview.privateMediaRunnerRunId,
    registeredRunnerRunId: privateMediaRunnerQaReview.registeredRunnerRunId,
    boundedAdapterExecutionRunId: privateMediaRunnerQaReview.boundedAdapterExecutionRunId,
    packageRecordId: privateMediaRunnerQaReview.packageRecordId,
    workspaceId: privateMediaRunnerQaReview.workspaceId,
    projectId: privateMediaRunnerQaReview.projectId,
    approvedPlanSnapshotId: privateMediaRunnerQaReview.approvedPlanSnapshotId,
    creditReservationId: privateMediaRunnerQaReview.creditReservationId,
    status: 'adapter_worker_artifact_integration_passed_ready_for_render_preview',
    integrationOnly: true,
    reviewedArtifactCount: privateMediaRunnerQaReview.artifactCount,
    integratedArtifactCount: integratedArtifacts.length,
    blockedArtifactCount: 0,
    mediaProcessingExecuted: false,
    mediaTransformOutputCount: 0,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    renderPreviewIntegrationReady: true,
    finalRenderDecisionManifestEligible: true,
    mediaTransformOutputEligible: false,
    artifacts: integratedArtifacts,
    integrationManifestArtifact,
    blockers: [],
    nextRequiredGate: 'render_preview_assembly_with_private_adapter_integration',
    userFacingSummary: `Verified ${integratedArtifacts.length} private edit activit${integratedArtifacts.length === 1 ? 'y' : 'ies'} for private preview assembly.`,
    internalExecutionSummary: [
      `Adapter worker artifact integration ${id} verified ${integratedArtifacts.length} private QA artifact(s).`,
      'The integration manifest is eligible for private render-preview and final edit-decision traceability only.',
      'No adapter media transform output, public delivery, signed URL, Supabase/GCS write, provider call, or billing mutation was created.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Adapter worker artifact integration verified private JSON artifact checksums and wrote one private JSON integration manifest only.',
      'No adapter package was executed for media transformation in this gate.',
      'No media bytes, public artifacts, signed URLs, Supabase/GCS writes, provider calls, beta, production, or billing mutation occurred.',
    ],
    createdAt: input.createdAt,
    mockOnly: true,
  }
}

function safePathPart(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 160)
  return cleaned || 'unknown'
}

function sanitizePrivateReviewCopy(value: string | undefined): string | undefined {
  if (!value) return undefined
  const cleaned = value
    .replace(/https?:\/\/\S+/gi, '[link removed]')
    .replace(/\b(?:api[_-]?key|service[_-]?role|token|secret|password)\b/gi, '[redacted]')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || undefined
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Number(value)))
}

function clampInteger(value: number | undefined, min: number, max: number, fallback: number): number {
  return Math.round(clampNumber(value, min, max, fallback))
}

function resolveLocalMediaProcessingProfile(input: {
  processingMode?: LocalMediaProcessingMode
  maxDurationSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
}): {
  processingMode: LocalMediaProcessingMode
  maxDurationSeconds: number
  targetWidth: number
  targetHeight: number
  fps: number
} {
  const processingMode = input.processingMode ?? 'bounded_preview_render'
  const maxDurationLimit = processingMode === 'private_internal_review_render' ? 60 : 10
  const fallbackDuration = processingMode === 'private_internal_review_render' ? 30 : 2
  const fallbackWidth = processingMode === 'private_internal_review_render' ? 960 : 320
  const fallbackHeight = processingMode === 'private_internal_review_render' ? 540 : 180
  const fallbackFps = processingMode === 'private_internal_review_render' ? 24 : 15

  return {
    processingMode,
    maxDurationSeconds: clampNumber(input.maxDurationSeconds, 1, maxDurationLimit, fallbackDuration),
    targetWidth: clampInteger(input.targetWidth, 96, 1920, fallbackWidth),
    targetHeight: clampInteger(input.targetHeight, 96, 1080, fallbackHeight),
    fps: clampInteger(input.fps, 8, 60, fallbackFps),
  }
}

async function createPrivateAudioExecutionReview(input: {
  processingExecutionId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  sourceMedia: UploadedMediaSourceAssetInput
  sourceArtifactId: string
  processedArtifactId: string
  sourceLocalPath: string
  localStorageRoot: string
  ffmpegBin?: string
  approvedSourceRange: ApprovedSourceMediaRange
}): Promise<PrivateAudioExecutionReview> {
  const id = `private-audio-execution-${safePathPart(input.processedArtifactId)}`
  const toolExecutionPlanId = `${id}-plan`
  const relativeOutputDirectory = join(
    'edit-execution',
    safePathPart(input.workspaceId),
    safePathPart(input.projectId),
    safePathPart(input.processingExecutionId),
    'private-audio-execution',
    safePathPart(input.processedArtifactId),
  )
  const outputDirectory = await ensurePrivateDirectoryWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeOutputDirectory,
  })

  const result = await runAudioExecutionPipeline({
    mode: 'local_dev',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.sourceMedia.mediaAssetId,
    approvedSnapshotId: input.approvedPlanSnapshotId,
    toolExecutionPlanId,
    idempotencyKey: `${id}:local-dev`,
    sourceAudioArtifactId: input.sourceArtifactId,
    sourceAudioStorageObjectPath: input.sourceMedia.storagePath,
    sourceAudioLocalPath: input.sourceLocalPath,
    outputDirectory,
    enableFfmpegAudioExecution: true,
    ffmpegBin: input.ffmpegBin,
    timeoutMs: 20_000,
    audioAnalysis: {
      durationSeconds: input.approvedSourceRange.durationSeconds,
      clippingDetected: false,
      silenceSegments: [],
      speechPresence: 'unknown',
      musicDetected: false,
      musicSpeechOverlap: false,
      advancedAnalysisRan: false,
      issues: [],
    },
  })
  const boundedToolWarning = 'Advanced music/audio package adapters remain gated by hydrated worker runtime; this private pass records FFmpeg-backed uploaded-audio QA evidence only.'
  const warnings = Array.from(new Set([
    ...result.warnings,
    boundedToolWarning,
  ].map((warning) => sanitizePrivateReviewCopy(warning)).filter((warning): warning is string => Boolean(warning))))

  return {
    id,
    sourceMediaAssetId: input.sourceMedia.mediaAssetId,
    sourceArtifactId: input.sourceArtifactId,
    processedArtifactId: input.processedArtifactId,
    mode: result.mode,
    status: result.status,
    sourceAudioArtifactId: input.sourceArtifactId,
    toolExecutionPlanId,
    loudnessStatus: result.loudnessResult?.status ?? 'not_planned',
    normalizationStatus: result.normalizationResult?.status ?? 'not_planned',
    cleanedAudioArtifactReady: Boolean(result.cleanedAudioArtifact),
    soundSyncArtifactReady: Boolean(result.soundSyncArtifact),
    artifactCount: result.artifacts.length,
    qaGateCount: result.qaResults.length,
    blockingQaGateCount: result.qaResults.filter((gate) => gate.blocking).length,
    warningQaGateCount: result.qaResults.filter((gate) => gate.status === 'warning').length,
    skippedReasonCount: result.skippedReasons.length,
    warningCount: warnings.length,
    blocksPreview: result.blocksPreview,
    blocksFinalExport: result.blocksFinalExport,
    finalMuxAllowed: false,
    publicArtifact: false,
    signedUrl: null,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    artifacts: result.artifacts.map((artifact) => ({
      id: artifact.id,
      artifactType: artifact.artifactType,
      storageBucketPurpose: artifact.storageBucketPurpose,
      storageObjectPath: artifact.storageObjectPath,
      contentType: artifact.contentType,
      isPrivate: artifact.isPrivate,
      sourceOfTruth: artifact.sourceOfTruth,
      previewAllowed: artifact.previewAllowed,
    })),
    qaGates: result.qaResults.map((gate) => ({
      id: gate.id,
      gateType: gate.gateType,
      status: gate.status,
      blocking: gate.blocking,
      blocksPreview: gate.blocksPreview,
      blocksFinalExport: gate.blocksFinalExport,
      issueCount: gate.issues.length,
    })),
    skippedReasons: result.skippedReasons.map((reason) => ({
      code: reason.code,
      ...(reason.tool ? { tool: reason.tool } : {}),
    })),
    warnings,
  }
}

function resolveApprovedSourceMediaRange(input: {
  approvedSnapshot?: ApprovedPlanSnapshot
  sourceMedia: UploadedMediaSourceAssetInput
  requestedMaxDurationSeconds: number
}): ApprovedSourceMediaRange {
  const requestedMaxDurationSeconds = clampNumber(input.requestedMaxDurationSeconds, 1, 60, 2)
  const sourceSequenceItemId = input.sourceMedia.sourceSequenceItemId
  const clipIds = approvedClipIdsForSourceMedia(input.sourceMedia, input.approvedSnapshot)
  const fallback = (reason: string): ApprovedSourceMediaRange => ({
    source: 'bounded_preview_default',
    clipId: clipIds[0],
    sourceSequenceItemId,
    startSeconds: 0,
    durationSeconds: requestedMaxDurationSeconds,
    endSeconds: requestedMaxDurationSeconds,
    requestedMaxDurationSeconds,
    reason,
  })

  if (!input.approvedSnapshot || clipIds.length < 1) {
    return fallback('No approved source timing metadata was available for this uploaded source; using the bounded internal preview default.')
  }

  const cleanupDecision = input.approvedSnapshot.sourceCleanupPlan?.decisions?.find((decision) =>
    clipIds.includes(decision.clipId) &&
    decision.finalUse !== 'removed' &&
    decision.finalUse !== 'user_review'
  )
  const cleanupRange = rangeFromUnknownRecord(
    unknownRecord(cleanupDecision)?.selectedRange ?? cleanupDecision?.sourceRange,
  )
  if (cleanupDecision && cleanupRange) {
    return boundedApprovedRange({
      source: 'source_cleanup_plan',
      clipId: cleanupDecision.clipId,
      sourceSequenceItemId,
      range: cleanupRange,
      requestedMaxDurationSeconds,
      reason: `Using approved SourceCleanupPlan decision ${cleanupDecision.id}.`,
    })
  }

  const timingItem = input.approvedSnapshot.masterTimingPlan?.sourceTimingItems?.find((item) => clipIds.includes(item.clipId))
  const timingRange = rangeFromUnknownRecord(timingItem?.selectedRange ?? timingItem?.sourceRange)
  if (timingItem && timingRange) {
    return boundedApprovedRange({
      source: 'master_timing_plan',
      clipId: timingItem.clipId,
      sourceSequenceItemId,
      range: timingRange,
      requestedMaxDurationSeconds,
      reason: `Using approved MasterTimingPlan source timing item ${timingItem.id}.`,
    })
  }

  const segment = input.approvedSnapshot.segments?.find((candidate) => {
    const sourceClipIds = Array.isArray(candidate.source_clip_ids_json)
      ? candidate.source_clip_ids_json.filter((id): id is string => typeof id === 'string')
      : []
    return sourceClipIds.some((clipId) => clipIds.includes(clipId))
  })
  const segmentRange = rangeFromUnknownRecord(segment?.source_time_range_json)
  if (segment && segmentRange) {
    return boundedApprovedRange({
      source: 'segment_source_time_range',
      clipId: clipIds[0],
      sourceSequenceItemId,
      range: segmentRange,
      requestedMaxDurationSeconds,
      reason: `Using approved segment source time range ${segment.id}.`,
    })
  }

  return fallback('Approved snapshot did not contain a usable selected source range for this uploaded source; using the bounded internal preview default.')
}

function approvedClipIdsForSourceMedia(
  sourceMedia: UploadedMediaSourceAssetInput,
  approvedSnapshot?: ApprovedPlanSnapshot,
): string[] {
  const directIds = [
    sourceMedia.uploadedClipId,
    sourceMedia.sourceSequenceItemId,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const sequenceIds = approvedSnapshot?.sourceSequence
    ?.filter((item) =>
      item.id === sourceMedia.sourceSequenceItemId ||
      item.uploaded_clip_id === sourceMedia.uploadedClipId ||
      item.source_order === sourceMedia.uploadedOrder
    )
    .flatMap((item) => [item.uploaded_clip_id, item.id])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? []

  return Array.from(new Set([...directIds, ...sequenceIds]))
}

function boundedApprovedRange(input: {
  source: ApprovedSourceRangeSource
  clipId?: string
  sourceSequenceItemId?: string
  range: { startSeconds: number; durationSeconds: number; endSeconds?: number }
  requestedMaxDurationSeconds: number
  reason: string
}): ApprovedSourceMediaRange {
  const requestedMaxDurationSeconds = clampNumber(input.requestedMaxDurationSeconds, 1, 60, 2)
  const startSeconds = clampNumber(input.range.startSeconds, 0, Number.MAX_SAFE_INTEGER, 0)
  const sourceDurationSeconds = input.range.durationSeconds > 0
    ? input.range.durationSeconds
    : typeof input.range.endSeconds === 'number'
      ? Math.max(0, input.range.endSeconds - startSeconds)
      : requestedMaxDurationSeconds
  const durationSeconds = clampNumber(sourceDurationSeconds, 0.1, requestedMaxDurationSeconds, requestedMaxDurationSeconds)
  const endSeconds = startSeconds + durationSeconds

  return {
    source: input.source,
    clipId: input.clipId,
    sourceSequenceItemId: input.sourceSequenceItemId,
    startSeconds,
    durationSeconds,
    endSeconds,
    requestedMaxDurationSeconds,
    reason: durationSeconds < sourceDurationSeconds
      ? `${input.reason} Range duration was capped to the bounded internal review limit.`
      : input.reason,
  }
}

function rangeFromUnknownRecord(value: unknown): { startSeconds: number; durationSeconds: number; endSeconds?: number } | undefined {
  const record = unknownRecord(value)
  if (!record) return undefined

  const startSeconds = numberFromUnknown(record.startSeconds)
  const durationSeconds = numberFromUnknown(record.durationSeconds)
  const endSeconds = numberFromUnknown(record.endSeconds)

  if (typeof startSeconds === 'number' && typeof durationSeconds === 'number' && durationSeconds > 0) {
    return { startSeconds, durationSeconds, endSeconds }
  }

  if (typeof startSeconds === 'number' && typeof endSeconds === 'number' && endSeconds > startSeconds) {
    return { startSeconds, durationSeconds: endSeconds - startSeconds, endSeconds }
  }

  return undefined
}

function unknownRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function numberFromUnknown(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : undefined
  }
  return undefined
}

async function createWorkflowRehearsalFromLocalWorkerOutput(input: {
  localWorkerOutput: ApprovedEditExecutionLocalWorkerOutput
  localWorkerOutputQaReview?: ApprovedEditExecutionLocalWorkerOutputQaReview
  scenarioId: string
}): Promise<ApprovedEditExecutionWorkflowRehearsal> {
  const createdAt = nowIso()
  const scenario = getProductionWorkflowScenario(input.scenarioId)
  const report = await runProductionWorkflowScenario({ scenario, mode: 'dry_run' })
  const workflowStages = report.stageResults.map((stage) => stage.stage)
  const blockedStageCount = report.stageResults.filter((stage) => stage.status === 'blocked').length
  const warningStageCount = report.stageResults.filter((stage) => stage.status === 'warning').length
  const completedStageCount = report.stageResults.filter((stage) => stage.status === 'passed').length
  const localOutputQaPassed = input.localWorkerOutputQaReview?.status === 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution'
  const releaseReadiness = evaluateApprovedEditExecutionReleaseReadiness()

  return {
    id: createMockId('approved_edit_workflow_rehearsal'),
    localWorkerOutputId: input.localWorkerOutput.id,
    resultReconciliationId: input.localWorkerOutput.resultReconciliationId,
    handlerDryRunId: input.localWorkerOutput.handlerDryRunId,
    packageRecordId: input.localWorkerOutput.packageRecordId,
    workspaceId: input.localWorkerOutput.workspaceId,
    projectId: input.localWorkerOutput.projectId,
    approvedPlanSnapshotId: input.localWorkerOutput.approvedPlanSnapshotId,
    creditReservationId: input.localWorkerOutput.creditReservationId,
    status: 'production_workflow_rehearsed_waiting_uploaded_media_worker_execution',
    rehearsalOnly: true,
    workflowMode: 'dry_run',
    scenarioId: report.scenarioId,
    stageCount: report.stageResults.length,
    completedStageCount,
    blockedStageCount,
    warningStageCount,
    workflowStages,
    artifactCount: report.artifactSummary.totalArtifacts,
    privateArtifactCount: report.artifactSummary.privateArtifactCount,
    qaGateCount: report.qaSummary.total,
    qaBlockedCount: report.qaSummary.blocked,
    finalDeliveryAllowed: false,
    productionReadyAllowed: releaseReadiness.productionReadyAllowed,
    liveExecutionReady: false,
    renderPreviewReady: false,
    finalRenderReady: false,
    localOutputQaStatus: localOutputQaPassed ? 'passed_metadata_integrity_only' : 'pending',
    report: {
      reportId: report.reportId,
      scenarioId: report.scenarioId,
      mode: report.mode,
      status: report.status,
      artifactSummary: report.artifactSummary,
      qaSummary: report.qaSummary,
      fallbackSummary: report.fallbackSummary,
      readinessSummary: report.readinessSummary,
      blockers: report.blockers,
      warnings: report.warnings,
      nextActions: report.nextActions,
    },
    nextRequiredGate: 'uploaded_media_worker_execution_with_private_artifact_outputs',
    userFacingSummary: 'The edit workflow has been rehearsed end to end with internal dry-run stages. Real uploaded-media editing still needs approved private worker execution.',
    backendHandoffSummary: [
      `Production workflow rehearsal ${report.reportId} ran ${report.stageResults.length} stage(s) in dry-run mode for scenario ${report.scenarioId}.`,
      `${report.artifactSummary.totalArtifacts} private artifact reference(s) and ${report.qaSummary.total} QA gate result(s) were produced as dry-run evidence.`,
      'The next gate is real uploaded-media worker execution with private artifact outputs and QA pass records.',
    ].join(' '),
    blockers: [
      'Production workflow rehearsal uses dry-run/generated fixture evidence, not uploaded user media.',
      ...(localOutputQaPassed ? [] : ['Local worker output QA is still pending.']),
      'Real worker handlers have not processed uploaded media into private artifacts.',
      'Final render/export remains blocked until real private artifacts and QA pass.',
    ],
    noRuntimeSideEffects: [
      'Workflow rehearsal uses dry-run production workflow stages only.',
      'No uploaded media bytes were processed, no tools/providers/renderers executed, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future execution must bind uploaded source media to worker handlers, persist private media artifacts, pass QA gates, and update render/export readiness.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function validateUploadedMediaSourceAssets(sourceMediaAssets: UploadedMediaSourceAssetInput[]): void {
  if (sourceMediaAssets.length < 1) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Uploaded-media worker execution requires at least one uploaded source media asset reference.', 409)
  }

  const invalidAssets = sourceMediaAssets.flatMap((asset, index) => {
    const errors = [
      !asset.mediaAssetId.trim() ? 'mediaAssetId' : undefined,
      asset.uploadedOrder < 1 || !Number.isInteger(asset.uploadedOrder) ? 'uploadedOrder' : undefined,
      asset.storageProvider === 'local_mock' ? 'storageProvider_mock_not_allowed_for_uploaded_execution_source' : undefined,
      asset.storageProvider !== 'local_private' && asset.storageProvider !== 'google_cloud_storage' && asset.storageProvider !== 'supabase_storage' ? 'storageProvider' : undefined,
      asset.storageBucket && /^https?:\/\//i.test(asset.storageBucket) ? 'storageBucket_public_url' : undefined,
      !asset.storagePath.trim() ? 'storagePath' : undefined,
      /^https?:\/\//i.test(asset.storagePath) ? 'storagePath_public_url' : undefined,
      !asset.fileName.trim() ? 'fileName' : undefined,
      !asset.mimeType.trim() ? 'mimeType' : undefined,
      asset.byteSize < 1 ? 'byteSize_positive_required_for_uploaded_execution_source' : undefined,
      !asset.checksumSha256 ? 'checksumSha256_required_for_uploaded_execution_source' : undefined,
      asset.checksumSha256 && !/^[a-f0-9]{64}$/i.test(asset.checksumSha256) ? 'checksumSha256' : undefined,
      asset.privateArtifact !== true ? 'privateArtifact' : undefined,
      asset.publicUrl !== null && asset.publicUrl !== undefined ? 'publicUrl' : undefined,
      asset.signedUrl !== null && asset.signedUrl !== undefined ? 'signedUrl' : undefined,
    ].filter(Boolean)

    return errors.length ? [{ index, mediaAssetId: asset.mediaAssetId, errors }] : []
  })

  if (invalidAssets.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Uploaded source media asset references must be private, ordered, checksumed, non-public, and free of signed URLs.', 400, {
      invalidAssets,
    })
  }
}

function validateUploadedMediaSourceAssetsAgainstApprovedSnapshot(
  sourceMediaAssets: UploadedMediaSourceAssetInput[],
  approvedSnapshot: ApprovedPlanSnapshot | undefined,
): void {
  if (!approvedSnapshot) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot source sequence is required before uploaded source media can execute.', 409)
  }

  const approvedSourceSequence = approvedSnapshot.sourceSequence ?? []
  if (approvedSourceSequence.length < 1) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot must include at least one source sequence item before uploaded source media can execute.', 409, {
      approvedPlanSnapshotId: approvedSnapshot.id,
    })
  }

  const duplicateAssetOrders = sourceMediaAssets
    .map((asset) => asset.uploadedOrder)
    .filter((order, index, orders) => orders.indexOf(order) !== index)
  const duplicateApprovedOrders = approvedSourceSequence
    .map((item) => item.source_order)
    .filter((order, index, orders) => orders.indexOf(order) !== index)
  const assetsByOrder = new Map(sourceMediaAssets.map((asset) => [asset.uploadedOrder, asset] as const))
  const mismatches = approvedSourceSequence.flatMap((item) => {
    const asset = assetsByOrder.get(item.source_order)
    const expectedChecksum = item.approved_source_checksum_sha256?.toLowerCase()
    const actualChecksum = asset?.checksumSha256?.toLowerCase()
    const errors = [
      !asset ? 'missing_uploaded_source_asset_for_approved_order' : undefined,
      asset && asset.uploadedClipId !== item.uploaded_clip_id ? 'uploadedClipId_mismatch' : undefined,
      asset && item.approved_media_asset_id && asset.mediaAssetId !== item.approved_media_asset_id ? 'mediaAssetId_mismatch' : undefined,
      asset && expectedChecksum && actualChecksum !== expectedChecksum ? 'checksumSha256_mismatch' : undefined,
      asset && item.approved_storage_provider && asset.storageProvider !== item.approved_storage_provider ? 'storageProvider_mismatch' : undefined,
      asset && item.approved_storage_bucket && asset.storageBucket !== item.approved_storage_bucket ? 'storageBucket_mismatch' : undefined,
      asset && item.approved_storage_path && asset.storagePath !== item.approved_storage_path ? 'storagePath_mismatch' : undefined,
      asset && item.approved_file_name && asset.fileName !== item.approved_file_name ? 'fileName_mismatch' : undefined,
      asset && item.approved_mime_type && asset.mimeType !== item.approved_mime_type ? 'mimeType_mismatch' : undefined,
      asset && typeof item.approved_byte_size === 'number' && asset.byteSize !== item.approved_byte_size ? 'byteSize_mismatch' : undefined,
    ].filter(Boolean)

    return errors.length
      ? [{
          sourceSequenceItemId: item.id,
          expectedUploadedClipId: item.uploaded_clip_id,
          expectedUploadedOrder: item.source_order,
          expectedMediaAssetId: item.approved_media_asset_id,
          expectedChecksumSha256: item.approved_source_checksum_sha256,
          expectedStorageProvider: item.approved_storage_provider,
          expectedStorageBucket: item.approved_storage_bucket,
          expectedStoragePath: item.approved_storage_path,
          expectedFileName: item.approved_file_name,
          expectedMimeType: item.approved_mime_type,
          expectedByteSize: item.approved_byte_size,
          actualUploadedClipId: asset?.uploadedClipId,
          actualUploadedOrder: asset?.uploadedOrder,
          actualMediaAssetId: asset?.mediaAssetId,
          actualChecksumSha256: asset?.checksumSha256,
          actualStorageProvider: asset?.storageProvider,
          actualStorageBucket: asset?.storageBucket,
          actualStoragePath: asset?.storagePath,
          actualFileName: asset?.fileName,
          actualMimeType: asset?.mimeType,
          actualByteSize: asset?.byteSize,
          errors,
        }]
      : []
  })
  const extraAssetOrders = sourceMediaAssets
    .filter((asset) => !approvedSourceSequence.some((item) => item.source_order === asset.uploadedOrder))
    .map((asset) => ({
      actualUploadedOrder: asset.uploadedOrder,
      actualUploadedClipId: asset.uploadedClipId,
      actualMediaAssetId: asset.mediaAssetId,
      errors: ['uploaded_source_asset_not_in_approved_source_sequence'],
    }))

  if (
    sourceMediaAssets.length !== approvedSourceSequence.length ||
    duplicateAssetOrders.length > 0 ||
    duplicateApprovedOrders.length > 0 ||
    mismatches.length > 0 ||
    extraAssetOrders.length > 0
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Uploaded source media assets must match the approved snapshot source sequence before execution.', 400, {
      approvedPlanSnapshotId: approvedSnapshot.id,
      expectedSourceMediaAssetCount: approvedSourceSequence.length,
      actualSourceMediaAssetCount: sourceMediaAssets.length,
      duplicateUploadedOrders: [...new Set(duplicateAssetOrders)],
      duplicateApprovedSourceOrders: [...new Set(duplicateApprovedOrders)],
      mismatches: [...mismatches, ...extraAssetOrders],
    })
  }
}

async function createUploadedMediaWorkerExecutionFromWorkflowRehearsal(input: {
  workflowRehearsal: ApprovedEditExecutionWorkflowRehearsal
  localWorkerOutput: ApprovedEditExecutionLocalWorkerOutput
  localWorkerOutputQaReview: ApprovedEditExecutionLocalWorkerOutputQaReview
  sourceMediaAssets: UploadedMediaSourceAssetInput[]
  localStorageRoot: string
}): Promise<ApprovedEditExecutionUploadedMediaWorkerExecution> {
  const createdAt = nowIso()
  const id = createMockId('uploaded_media_worker_execution')
  const privateWorkerArtifacts: UploadedMediaWorkerArtifactMetadata[] = []
  const qaResults = input.localWorkerOutputQaReview.qaResults.filter((result) => result.metadataIntegrityPassed)
  const sourceMediaAssets = input.sourceMediaAssets
    .slice()
    .sort((left, right) => left.uploadedOrder - right.uploadedOrder)

  for (const [index, qaResult] of qaResults.entries()) {
    const sourceAsset = sourceMediaAssets[index % sourceMediaAssets.length]
    privateWorkerArtifacts.push(await persistUploadedMediaWorkerArtifact({
      uploadedMediaWorkerExecutionId: id,
      workflowRehearsal: input.workflowRehearsal,
      qaResult,
      sourceAsset,
      localStorageRoot: input.localStorageRoot,
      createdAt,
      index,
    }))
  }

  const qaHandoffRecords = privateWorkerArtifacts.map((artifact) => ({
    id: createMockId('uploaded_media_worker_artifact_qa_handoff'),
    artifactId: artifact.artifactId,
    sourceMediaAssetId: artifact.sourceMediaAssetId,
    workItemId: artifact.workItemId,
    qaStatus: 'qa_pending_private_worker_artifact_review' as const,
    blocksFinalRender: true as const,
    requiredBeforeFinalExport: true as const,
    reason: 'Uploaded source media is bound to private worker-output metadata, but real media processing and artifact QA have not passed.',
  }))
  const qaPendingArtifactIds = privateWorkerArtifacts.map((artifact) => artifact.artifactId)

  return {
    id,
    workflowRehearsalId: input.workflowRehearsal.id,
    localWorkerOutputId: input.localWorkerOutput.id,
    localWorkerOutputQaReviewId: input.localWorkerOutputQaReview.id,
    resultReconciliationId: input.workflowRehearsal.resultReconciliationId,
    handlerDryRunId: input.workflowRehearsal.handlerDryRunId,
    packageRecordId: input.workflowRehearsal.packageRecordId,
    workspaceId: input.workflowRehearsal.workspaceId,
    projectId: input.workflowRehearsal.projectId,
    approvedPlanSnapshotId: input.workflowRehearsal.approvedPlanSnapshotId,
    creditReservationId: input.workflowRehearsal.creditReservationId,
    status: 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa',
    uploadedMediaExecutionOnly: true,
    workerExecutionMode: 'metadata_only_no_media_processing',
    sourceMediaAssetCount: sourceMediaAssets.length,
    privateWorkerArtifactCount: privateWorkerArtifacts.length,
    sourceBoundArtifactCount: privateWorkerArtifacts.filter((artifact) => artifact.sourceMediaBound).length,
    mediaArtifactCount: 0,
    qaPendingCount: qaHandoffRecords.length,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: false,
    finalRenderReady: false,
    sourceMediaAssets,
    privateWorkerArtifacts,
    qaHandoffRecords,
    finalRenderReadiness: {
      ready: false,
      reason: 'Uploaded media is source-bound to private worker-output metadata, but final render waits for real media processing, private media artifacts, artifact QA, and render/export readiness.',
      qaPendingArtifactIds,
      sourceMediaAssetCount: sourceMediaAssets.length,
      privateWorkerArtifactCount: privateWorkerArtifacts.length,
      mediaArtifactCount: 0,
    },
    nextRequiredGate: 'private_worker_artifact_qa_review',
    userFacingSummary: 'The edit now has uploaded source media bound to private internal worker-output records. Real processing and QA are still required before preview or export.',
    backendHandoffSummary: [
      `${sourceMediaAssets.length} uploaded source media asset reference(s) were validated and bound to execution metadata.`,
      `${privateWorkerArtifacts.length} private worker-output metadata artifact(s) were written under LOCAL_STORAGE_ROOT.`,
      'This gate does not decode, transform, render, upload, publicly expose, or deliver media bytes.',
    ].join(' '),
    blockers: [
      'This gate created private worker-output metadata only; no uploaded media bytes were decoded or transformed.',
      'Private media artifacts and artifact QA pass records do not exist yet.',
      'Final render/export remains blocked until real processing, media QA, and render readiness pass.',
    ],
    noRuntimeSideEffects: [
      'Uploaded-media worker execution persists source-bound private JSON metadata records only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future real worker execution must read approved uploaded media, produce private processed media artifacts, record cost events, pass artifact QA, and update render/export readiness.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createPrivateWorkerArtifactQaReviewFromUploadedMediaExecution(
  uploadedMediaWorkerExecution: ApprovedEditExecutionUploadedMediaWorkerExecution,
): ApprovedEditExecutionPrivateWorkerArtifactQaReview {
  const createdAt = nowIso()
  const qaResults = uploadedMediaWorkerExecution.privateWorkerArtifacts.map(createPrivateWorkerArtifactQaReviewRecord)
  const passedResults = qaResults.filter((result) => result.metadataIntegrityPassed)
  const blockedResults = qaResults.filter((result) => !result.metadataIntegrityPassed)
  const passedArtifactIds = passedResults.map((result) => result.artifactId)
  const blockedArtifactIds = blockedResults.map((result) => result.artifactId)
  const passed = blockedResults.length === 0 && qaResults.length > 0
  return {
    id: createMockId('private_worker_artifact_qa_review'),
    uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecution.id,
    workflowRehearsalId: uploadedMediaWorkerExecution.workflowRehearsalId,
    localWorkerOutputId: uploadedMediaWorkerExecution.localWorkerOutputId,
    localWorkerOutputQaReviewId: uploadedMediaWorkerExecution.localWorkerOutputQaReviewId,
    resultReconciliationId: uploadedMediaWorkerExecution.resultReconciliationId,
    handlerDryRunId: uploadedMediaWorkerExecution.handlerDryRunId,
    packageRecordId: uploadedMediaWorkerExecution.packageRecordId,
    workspaceId: uploadedMediaWorkerExecution.workspaceId,
    projectId: uploadedMediaWorkerExecution.projectId,
    approvedPlanSnapshotId: uploadedMediaWorkerExecution.approvedPlanSnapshotId,
    creditReservationId: uploadedMediaWorkerExecution.creditReservationId,
    status: passed
      ? 'private_worker_artifact_qa_passed_waiting_real_media_processing'
      : 'private_worker_artifact_qa_blocked_metadata_integrity',
    qaReviewOnly: true,
    reviewedArtifactCount: qaResults.length,
    passedArtifactCount: passedResults.length,
    blockedArtifactCount: blockedResults.length,
    sourceBoundArtifactCount: qaResults.filter((result) => result.sourceMediaBound).length,
    mediaArtifactCount: 0,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: passed,
    renderPreviewReady: false,
    finalRenderReady: false,
    qaResults,
    finalRenderReadiness: {
      ready: false,
      reason: passed
        ? 'Private worker artifact metadata QA passed, but preview/export still waits for real media processing, private media artifacts, media QA, and render readiness.'
        : 'Private worker artifact metadata QA found integrity blockers that must be fixed before real media processing can proceed.',
      metadataQaPassedArtifactIds: passedArtifactIds,
      mediaQaRequiredArtifactIds: passed ? passedArtifactIds : blockedArtifactIds,
      sourceBoundArtifactCount: qaResults.filter((result) => result.sourceMediaBound).length,
      mediaArtifactCount: 0,
    },
    nextRequiredGate: passed
      ? 'real_media_processing_worker_execution_with_private_media_artifacts'
      : 'private_worker_artifact_metadata_integrity_fix',
    userFacingSummary: passed
      ? 'Internal edit artifact records passed review. The system still needs real private media processing before it can show a preview or export.'
      : 'Some internal edit artifact records failed review and need to be fixed before real media processing.',
    backendHandoffSummary: [
      `${qaResults.length} source-bound private worker artifact metadata record(s) were reviewed.`,
      `${passedResults.length} passed metadata integrity checks; ${blockedResults.length} blocked.`,
      'This QA review accepts metadata integrity only and does not approve real media output, render preview, final export, live runtime, Supabase/GCS writes, or billing.',
    ].join(' '),
    blockers: passed
      ? [
          'No uploaded media bytes have been decoded, transformed, or rendered by real worker handlers.',
          'No private processed media artifacts or media QA pass records exist yet.',
          'Preview/export remains blocked until real media processing, media QA, and render readiness pass.',
        ]
      : [
          'One or more private worker artifact metadata records failed integrity checks.',
          'Real media processing must wait until metadata integrity blockers are resolved.',
          'Preview/export remains blocked.',
        ],
    noRuntimeSideEffects: [
      'Private worker artifact QA reviewed source-bound private metadata records only.',
      'No worker handler ran, no tool/provider/media/render operation executed, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future real worker execution must read approved uploaded media, produce private processed media artifacts, record cost events, pass media QA, and update preview/export readiness.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createPrivateWorkerArtifactQaReviewRecord(
  artifact: UploadedMediaWorkerArtifactMetadata,
): PrivateWorkerArtifactQaReviewRecord {
  const checks: PrivateWorkerArtifactQaCheck[] = [
    {
      check: 'private_worker_output_metadata',
      passed: artifact.privateArtifact === true && artifact.storageProvider === 'local_private' && artifact.workerOutputArtifact === true,
      message: 'Artifact is stored as private worker-output metadata.',
    },
    {
      check: 'source_media_bound',
      passed: artifact.sourceMediaBound === true && Boolean(artifact.sourceMediaAssetId) && artifact.uploadedOrder > 0,
      message: 'Artifact is bound to an uploaded source media reference.',
    },
    {
      check: 'checksum_present',
      passed: /^[a-f0-9]{64}$/i.test(artifact.sha256) && artifact.byteSize > 0,
      message: 'Artifact includes checksum and byte-size evidence.',
    },
    {
      check: 'no_signed_url',
      passed: artifact.signedUrl === null && !/^https?:\/\//i.test(artifact.storageObjectPath),
      message: 'Artifact does not expose signed URLs or public URL paths.',
    },
    {
      check: 'no_public_artifact',
      passed: artifact.publicArtifact === false,
      message: 'Artifact is not marked public.',
    },
    {
      check: 'metadata_only_scope',
      passed: artifact.sourceOfTruth === true && artifact.sourceOfTruthScope === 'uploaded_media_worker_execution_metadata_only',
      message: 'Artifact is source-of-truth metadata only.',
    },
    {
      check: 'no_media_bytes_claim',
      passed: artifact.mediaArtifact === false,
      message: 'Artifact does not claim processed media bytes.',
    },
    {
      check: 'not_final_render_eligible',
      passed: artifact.finalRenderEligible === false,
      message: 'Artifact is not eligible for final render/export.',
    },
  ]
  const metadataIntegrityPassed = checks.every((check) => check.passed)

  return {
    id: createMockId('private_worker_artifact_qa_result'),
    artifactId: artifact.artifactId,
    sourceMediaAssetId: artifact.sourceMediaAssetId,
    workItemId: artifact.workItemId,
    qaStatus: metadataIntegrityPassed
      ? 'passed_private_worker_artifact_metadata_only'
      : 'blocked_private_worker_artifact_metadata',
    metadataIntegrityPassed,
    sourceMediaBound: artifact.sourceMediaBound,
    mediaQaRequired: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    checks,
    reason: metadataIntegrityPassed
      ? 'Private metadata integrity passed. Real media processing and media QA are still required before preview/export.'
      : 'Private metadata integrity failed. The artifact must be corrected before real media processing can continue.',
  }
}

async function createLocalMediaProcessingExecutionFromPrivateArtifactQa(input: {
  privateWorkerArtifactQaReview: ApprovedEditExecutionPrivateWorkerArtifactQaReview
  uploadedMediaWorkerExecution: ApprovedEditExecutionUploadedMediaWorkerExecution
  approvedSnapshot?: ApprovedPlanSnapshot
  toolWorkManifest: ApprovedToolWorkManifest
  localStorageRoot: string
  sourceStorageAdapter: StorageAdapter
  sourceMediaBucketName: string
  ffmpegBin?: string
  ffprobeBin?: string
  processingMode?: LocalMediaProcessingMode
  maxDurationSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
}): Promise<ApprovedEditExecutionLocalMediaProcessingExecution> {
  const createdAt = nowIso()
  const id = createMockId('local_media_processing_execution')
  const sourceMediaById = new Map(input.uploadedMediaWorkerExecution.sourceMediaAssets.map((asset) => [asset.mediaAssetId, asset]))
  const artifactsToProcess = input.uploadedMediaWorkerExecution.privateWorkerArtifacts.filter((artifact) =>
    input.privateWorkerArtifactQaReview.qaResults.some((result) =>
      result.artifactId === artifact.artifactId &&
      result.metadataIntegrityPassed &&
      result.sourceMediaBound,
    ),
  )

  if (artifactsToProcess.length < 1) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'No source-bound private worker artifact metadata passed QA for local media processing.', 409)
  }

  const processingProfile = resolveLocalMediaProcessingProfile({
    processingMode: input.processingMode,
    maxDurationSeconds: input.maxDurationSeconds,
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    fps: input.fps,
  })
  const { processingMode, maxDurationSeconds, targetWidth, targetHeight, fps } = processingProfile
  const processedArtifacts: ProcessedPrivateMediaArtifact[] = []

  for (const [index, artifact] of artifactsToProcess.entries()) {
    const sourceMedia = sourceMediaById.get(artifact.sourceMediaAssetId)
    if (!sourceMedia) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Source media reference for private worker artifact was not found.', 409, {
        artifactId: artifact.artifactId,
        sourceMediaAssetId: artifact.sourceMediaAssetId,
      })
    }

    const sourceLocalPath = await resolveSourceMediaPathForProcessing({
      localStorageRoot: input.localStorageRoot,
      sourceStorageAdapter: input.sourceStorageAdapter,
      sourceMediaBucketName: input.sourceMediaBucketName,
      processingExecutionId: id,
      workspaceId: input.privateWorkerArtifactQaReview.workspaceId,
      projectId: input.privateWorkerArtifactQaReview.projectId,
      sourceMedia,
      index,
    })
    if (!sourceLocalPath) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded source media file was not found in local private storage.', 404, {
        sourceMediaAssetId: sourceMedia.mediaAssetId,
        storagePath: sourceMedia.storagePath,
      })
    }
    const sourceFileStat = await stat(sourceLocalPath)
    if (!sourceFileStat.isFile() || sourceFileStat.size < 1 || sourceMedia.byteSize < 1 || sourceFileStat.size !== sourceMedia.byteSize) {
      throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Uploaded source media file does not match finalized source metadata.', 409, {
        sourceMediaAssetId: sourceMedia.mediaAssetId,
        storagePath: sourceMedia.storagePath,
        expectedByteSize: sourceMedia.byteSize,
        actualByteSize: sourceFileStat.size,
      })
    }
    if (sourceMedia.checksumSha256) {
      const actualChecksumSha256 = await hashFileSha256(sourceLocalPath)
      if (actualChecksumSha256 !== sourceMedia.checksumSha256.toLowerCase()) {
        throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Uploaded source media file checksum does not match finalized source metadata.', 409, {
          sourceMediaAssetId: sourceMedia.mediaAssetId,
          storagePath: sourceMedia.storagePath,
          expectedChecksumSha256: sourceMedia.checksumSha256.toLowerCase(),
          actualChecksumSha256,
        })
      }
    }

    const processedArtifactId = `processed-media-${safePathPart(artifact.artifactId)}-${String(index + 1).padStart(2, '0')}`
    const relativeObjectPath = join(
      'edit-execution',
      safePathPart(input.privateWorkerArtifactQaReview.workspaceId),
      safePathPart(input.privateWorkerArtifactQaReview.projectId),
      safePathPart(input.privateWorkerArtifactQaReview.id),
      'local-media-processing',
      `${safePathPart(processedArtifactId)}.mp4`,
    )
    const outputPath = join(input.localStorageRoot, relativeObjectPath)
    const storageObjectPath = relativeObjectPath.split('/').join('/')
    const approvedSourceRange = resolveApprovedSourceMediaRange({
      approvedSnapshot: input.approvedSnapshot,
      sourceMedia,
      requestedMaxDurationSeconds: maxDurationSeconds,
    })
    const preview = await createBasicPreview(sourceLocalPath, outputPath, {
      localStorageRoot: input.localStorageRoot,
      ffmpegBin: input.ffmpegBin,
      ffprobeBin: input.ffprobeBin,
      maxDurationSeconds: approvedSourceRange.durationSeconds,
      startSeconds: approvedSourceRange.startSeconds,
      targetWidth,
      targetHeight,
      fps,
      audioMode: 'copy_or_transcode',
      fitMode: 'contain',
    })
    const audioExecutionReview = await createPrivateAudioExecutionReview({
      processingExecutionId: id,
      workspaceId: input.privateWorkerArtifactQaReview.workspaceId,
      projectId: input.privateWorkerArtifactQaReview.projectId,
      approvedPlanSnapshotId: input.privateWorkerArtifactQaReview.approvedPlanSnapshotId,
      sourceMedia,
      sourceArtifactId: artifact.artifactId,
      processedArtifactId,
      sourceLocalPath,
      localStorageRoot: input.localStorageRoot,
      ffmpegBin: input.ffmpegBin,
      approvedSourceRange,
    })
    const toolOperationEvidence = createApprovedToolOperationEvidence({
      manifest: input.toolWorkManifest,
      operationKind: 'source_media_private_process',
      operationInstanceId: `${input.toolWorkManifest.coreOperationIds.source_media_private_process}:artifact:${processedArtifactId}`,
      workspaceId: input.privateWorkerArtifactQaReview.workspaceId,
      projectId: input.privateWorkerArtifactQaReview.projectId,
      creditReservationId: input.privateWorkerArtifactQaReview.creditReservationId,
      outputArtifactId: processedArtifactId,
      outputSha256: preview.checksumSha256,
      outputByteSize: preview.sizeBytes,
      outputSeconds: preview.durationSeconds,
      megapixelFrames: (targetWidth * targetHeight * fps * preview.durationSeconds) / 1_000_000,
      mediaProcessingExecuted: true,
      mediaBytesProcessed: true,
      qaChecks: [
        'FFmpeg source processing completed after approved snapshot and credit reservation gates.',
        'Output is a private checksumed MP4 bound to approved source range and uploaded source identity.',
        `The bounded private audio review completed before evidence emission with status ${audioExecutionReview.status}.`,
      ],
      completedAt: nowIso(),
    })

    processedArtifacts.push({
      artifactId: processedArtifactId,
      sourceArtifactId: artifact.artifactId,
      sourceMediaAssetId: sourceMedia.mediaAssetId,
      sourceChecksumSha256: sourceMedia.checksumSha256?.toLowerCase(),
      sourceStorageProvider: sourceMedia.storageProvider,
      sourceStorageBucket: sourceMedia.storageBucket,
      sourceStoragePath: sourceMedia.storagePath,
      sourceFileName: sourceMedia.fileName,
      sourceMimeType: sourceMedia.mimeType,
      sourceByteSize: sourceMedia.byteSize,
      sourceSequenceItemId: sourceMedia.sourceSequenceItemId,
      uploadedClipId: sourceMedia.uploadedClipId,
      uploadedOrder: sourceMedia.uploadedOrder,
      workItemId: artifact.workItemId,
      outputId: artifact.outputId,
      storageProvider: 'local_private',
      storageObjectPath,
      localFilePath: preview.outputPath,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      sourceOfTruth: true,
      sourceOfTruthScope: 'local_media_processing_execution_private_artifact',
      mediaArtifact: true,
      processedMediaArtifact: true,
      sourceMediaBound: true,
      mimeType: 'video/mp4',
      sha256: preview.checksumSha256,
      byteSize: preview.sizeBytes,
      durationSeconds: preview.durationSeconds,
      processingMode,
      audioExecutionReview,
      approvedSourceRange,
      commandSummary: preview.commandSummary,
      toolOperationEvidence,
      qaStatus: 'qa_pending_private_media_artifact_review',
      previewReviewEligible: true,
      finalRenderEligible: false,
      createdAt,
    })
  }

  const processedArtifactIds = processedArtifacts.map((artifact) => artifact.artifactId)
  const audioExecutionReviews = processedArtifacts
    .map((artifact) => artifact.audioExecutionReview)
    .filter((review): review is PrivateAudioExecutionReview => Boolean(review))
  const audioExecutionQaGateCount = audioExecutionReviews.reduce((sum, review) => sum + review.qaGateCount, 0)
  const audioExecutionBlockingQaGateCount = audioExecutionReviews.reduce((sum, review) => sum + review.blockingQaGateCount, 0)
  const captionExecutionPackage = await createPrivateCaptionExecutionPackage({
    localMediaProcessingExecutionId: id,
    workspaceId: input.privateWorkerArtifactQaReview.workspaceId,
    projectId: input.privateWorkerArtifactQaReview.projectId,
    approvedPlanSnapshotId: input.privateWorkerArtifactQaReview.approvedPlanSnapshotId,
    approvedSnapshot: input.approvedSnapshot,
    processedArtifacts,
    localStorageRoot: input.localStorageRoot,
  })

  return {
    id,
    privateWorkerArtifactQaReviewId: input.privateWorkerArtifactQaReview.id,
    uploadedMediaWorkerExecutionId: input.privateWorkerArtifactQaReview.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: input.privateWorkerArtifactQaReview.workflowRehearsalId,
    localWorkerOutputId: input.privateWorkerArtifactQaReview.localWorkerOutputId,
    localWorkerOutputQaReviewId: input.privateWorkerArtifactQaReview.localWorkerOutputQaReviewId,
    resultReconciliationId: input.privateWorkerArtifactQaReview.resultReconciliationId,
    handlerDryRunId: input.privateWorkerArtifactQaReview.handlerDryRunId,
    packageRecordId: input.privateWorkerArtifactQaReview.packageRecordId,
    workspaceId: input.privateWorkerArtifactQaReview.workspaceId,
    projectId: input.privateWorkerArtifactQaReview.projectId,
    approvedPlanSnapshotId: input.privateWorkerArtifactQaReview.approvedPlanSnapshotId,
    creditReservationId: input.privateWorkerArtifactQaReview.creditReservationId,
    status: 'local_media_processing_execution_completed_waiting_private_media_artifact_qa',
    processingExecutionOnly: true,
    processingMode,
    sourceMediaAssetCount: input.uploadedMediaWorkerExecution.sourceMediaAssetCount,
    inputArtifactCount: artifactsToProcess.length,
    processedArtifactCount: processedArtifacts.length,
    privateMediaArtifactCount: processedArtifacts.length,
    mediaArtifactCount: processedArtifacts.length,
    workersStarted: 0,
    workerHandlersStarted: 1,
    toolsExecuted: 1,
    mediaBytesProcessed: true,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: false,
    finalRenderReady: false,
    toolWorkManifestRef: approvedToolWorkManifestRef(input.toolWorkManifest),
    toolOperationEvidence: processedArtifacts.map((artifact) => artifact.toolOperationEvidence),
    processedArtifacts,
    audioExecutionReviewCount: audioExecutionReviews.length,
    audioExecutionQaGateCount,
    audioExecutionBlockingQaGateCount,
    ...(captionExecutionPackage ? { captionExecutionPackage } : {}),
    finalRenderReadiness: {
      ready: false,
      reason: 'Private processed media artifacts now exist, but preview/export waits for private media artifact QA, render preview assembly, and final export readiness.',
      processedArtifactIds,
      mediaQaRequiredArtifactIds: processedArtifactIds,
      privateMediaArtifactCount: processedArtifacts.length,
    },
    nextRequiredGate: 'private_media_artifact_qa_review',
    userFacingSummary: 'The uploaded media has been processed into private internal preview artifacts. The system still needs QA before showing a preview or export.',
    backendHandoffSummary: [
      `${processedArtifacts.length} private processed media artifact(s) were created from approved uploaded source media.`,
      `${audioExecutionReviews.length} uploaded-source audio QA review(s) were attached from the backend audio execution pipeline with ${audioExecutionQaGateCount} QA gate result(s).`,
      captionExecutionPackage
        ? `${captionExecutionPackage.captionFileCount} private caption file artifact(s) were generated from approved caption timing for review/render handoff.`
        : 'No approved caption timing items were available for private caption file generation.',
      `Processing mode ${processingMode} bounded approved source ranges to ${maxDurationSeconds}s at ${targetWidth}x${targetHeight}/${fps}fps for internal testing.`,
      'This gate does not create public artifacts, signed URLs, final exports, Supabase/GCS writes, provider calls, or billing mutations.',
    ].join(' '),
    blockers: [
      'Private media artifact QA has not passed yet.',
      'Render preview assembly has not run.',
      'Final render/export remains blocked until media QA, render readiness, and final QA pass.',
    ],
    noRuntimeSideEffects: [
      'Local media processing read approved local/GCS private source files through backend-only storage adapters and wrote private processed artifacts under LOCAL_STORAGE_ROOT only.',
      'Caption package generation used approved caption timing metadata only; no real speech model, model download, provider call, raw prompt, or public URL was used.',
      'No provider call, Supabase/GCS write, signed URL/public artifact, final export, external beta, production delivery, or billing mutation occurred.',
      'Future gates must QA private media artifacts, assemble a render preview, and pass final export readiness before user-facing delivery.',
    ],
    createdAt,
    mockOnly: true,
  }
}

async function resolveExistingLocalSourceMediaPath(
  localStorageRoot: string,
  sourceMedia: UploadedMediaSourceAssetInput,
): Promise<string | undefined> {
  const candidatePaths = [
    sourceMedia.storagePath,
    sourceMedia.storageProvider === 'local_private' ? join('source-media', sourceMedia.storagePath) : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidatePaths) {
    const localPath = resolvePathInsideRoot(localStorageRoot, candidate)
    try {
      await stat(localPath)
      return localPath
    } catch {
      continue
    }
  }

  return undefined
}

async function resolveSourceMediaPathForProcessing(input: {
  localStorageRoot: string
  sourceStorageAdapter: StorageAdapter
  sourceMediaBucketName: string
  processingExecutionId: string
  workspaceId: string
  projectId: string
  sourceMedia: UploadedMediaSourceAssetInput
  index: number
}): Promise<string | undefined> {
  if (input.sourceMedia.storageProvider === 'local_private') {
    return resolveExistingLocalSourceMediaPath(input.localStorageRoot, input.sourceMedia)
  }

  if (input.sourceMedia.storageProvider === 'google_cloud_storage') {
    return stageGoogleCloudSourceMediaForProcessing(input)
  }

  if (input.sourceMedia.storageProvider === 'supabase_storage') {
    throw new ApiError('MOCK_ONLY', 'Supabase Storage source media processing requires a backend storage read adapter before execution can continue.', 202, {
      sourceMediaAssetId: input.sourceMedia.mediaAssetId,
      requiredBackendGate: 'supabase_storage_private_media_read_adapter',
    })
  }

  return undefined
}

async function stageGoogleCloudSourceMediaForProcessing(input: {
  localStorageRoot: string
  sourceStorageAdapter: StorageAdapter
  sourceMediaBucketName: string
  processingExecutionId: string
  workspaceId: string
  projectId: string
  sourceMedia: UploadedMediaSourceAssetInput
  index: number
}): Promise<string> {
  const bucketName = input.sourceMedia.storageBucket?.trim() || input.sourceMediaBucketName
  if (!bucketName) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'GCS source media bucket is missing from the finalized upload metadata.', 409, {
      sourceMediaAssetId: input.sourceMedia.mediaAssetId,
    })
  }

  const metadata = await input.sourceStorageAdapter.getObjectMetadata(bucketName, input.sourceMedia.storagePath)
  if (!metadata.exists) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded source media object was not found in GCS private storage.', 404, {
      sourceMediaAssetId: input.sourceMedia.mediaAssetId,
      storageBucket: bucketName,
      storagePath: input.sourceMedia.storagePath,
    })
  }

  if (metadata.sizeBytes !== input.sourceMedia.byteSize) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Uploaded GCS source media object size does not match finalized source metadata.', 409, {
      sourceMediaAssetId: input.sourceMedia.mediaAssetId,
      storageBucket: bucketName,
      storagePath: input.sourceMedia.storagePath,
      expectedByteSize: input.sourceMedia.byteSize,
      actualByteSize: metadata.sizeBytes,
    })
  }

  if (
    input.sourceMedia.checksumSha256 &&
    metadata.checksumSha256 &&
    metadata.checksumSha256.toLowerCase() !== input.sourceMedia.checksumSha256.toLowerCase()
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Uploaded GCS source media metadata checksum does not match finalized source metadata.', 409, {
      sourceMediaAssetId: input.sourceMedia.mediaAssetId,
      storageBucket: bucketName,
      storagePath: input.sourceMedia.storagePath,
      expectedChecksumSha256: input.sourceMedia.checksumSha256.toLowerCase(),
      actualChecksumSha256: metadata.checksumSha256.toLowerCase(),
    })
  }

  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.workspaceId),
    safePathPart(input.projectId),
    safePathPart(input.processingExecutionId),
    'source-staging',
    `${String(input.index + 1).padStart(2, '0')}-${safePathPart(input.sourceMedia.mediaAssetId)}-${safePathPart(input.sourceMedia.fileName)}`,
  )
  const readStream = await input.sourceStorageAdapter.createReadStream(bucketName, input.sourceMedia.storagePath)
  const localFilePath = await writePrivateStreamAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    stream: readStream,
  })

  return localFilePath
}

async function createPrivateCaptionExecutionPackage(input: {
  localMediaProcessingExecutionId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  approvedSnapshot?: ApprovedPlanSnapshot
  processedArtifacts: ProcessedPrivateMediaArtifact[]
  localStorageRoot: string
}): Promise<PrivateCaptionExecutionPackage | undefined> {
  const transcriptSegments = createApprovedCaptionTranscriptSegments(input.approvedSnapshot)
  const mediaAssetId = input.processedArtifacts[0]?.sourceMediaAssetId
  if (!mediaAssetId || transcriptSegments.length < 1) return undefined

  const id = createMockId('private_caption_execution')
  const relativeRoot = join(
    'edit-execution',
    safePathPart(input.workspaceId),
    safePathPart(input.projectId),
    safePathPart(input.localMediaProcessingExecutionId),
    'private-caption-execution',
    safePathPart(id),
  )
  const outputRoot = resolvePathInsideRoot(input.localStorageRoot, relativeRoot)
  const captionResult = await runCaptionExecution({
    mode: 'local_dev',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId,
    approvedSnapshotId: input.approvedPlanSnapshotId,
    toolExecutionPlanId: `private-caption-execution-${input.localMediaProcessingExecutionId}`,
    idempotencyKey: `private-caption-execution:${input.approvedPlanSnapshotId}:${input.localMediaProcessingExecutionId}`,
    transcriptSegments,
    outputDirectory: outputRoot,
    buildSrt: true,
    buildWebVtt: true,
    buildAss: true,
    buildPreview: false,
    enableCaptionPreview: false,
    captionStyle: 'clean_subtitle',
  })

  const captionFiles = await Promise.all(captionResult.captionFiles.flatMap((captionFile): Promise<PrivateCaptionExecutionFileArtifact>[] => {
    if (!captionFile.localFilePath || !captionFile.artifact) return []
    return [createPrivateCaptionExecutionFileArtifact(captionFile, captionResult.captionSegments.length)]
  }))

  return {
    id,
    mode: 'local_dev',
    status: captionResult.status === 'completed' || captionResult.status === 'partial' || captionResult.status === 'skipped' || captionResult.status === 'failed'
      ? captionResult.status
      : 'partial',
    source: 'approved_caption_timing_private_caption_files',
    transcriptSource: 'approved_master_timing_caption_items_no_real_transcription',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId,
    transcriptWorkerOutput: false,
    realSpeechModelExecution: false,
    captionSegmentCount: captionResult.captionSegments.length,
    captionFileCount: captionFiles.length,
    captionArtifactCount: captionFiles.length,
    captionFormats: captionFiles.map((file) => file.format),
    captionFiles,
    qaGateCount: captionResult.qaResults.length,
    qaPassed: captionResult.qaResults.every((gate) => gate.status === 'passed' || gate.status === 'warning'),
    skippedReasonCount: captionResult.skippedReasons.length,
    warnings: captionResult.warnings,
    safeForPrivateReview: true,
    finalRenderEligible: false,
  }
}

async function createPrivateCaptionExecutionFileArtifact(
  captionFile: {
    format: CaptionFileFormat
    artifact?: { id: string; storageObjectPath: string; contentType: string }
    localFilePath?: string
  },
  captionCount: number,
): Promise<PrivateCaptionExecutionFileArtifact> {
  if (!captionFile.localFilePath || !captionFile.artifact) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Caption execution did not produce a local private caption file artifact.', 409)
  }
  const [fileStat, bytes] = await Promise.all([
    stat(captionFile.localFilePath),
    readFile(captionFile.localFilePath),
  ])

  return {
    format: captionFile.format,
    artifactId: captionFile.artifact.id,
    storageProvider: 'local_private',
    storageObjectPath: captionFile.artifact.storageObjectPath,
    localFilePath: captionFile.localFilePath,
    mimeType: captionMimeType(captionFile.format),
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'approved_caption_timing_private_caption_file',
    source: 'approved_caption_timing',
    transcriptWorkerOutput: false,
    safeForPrivateReview: true,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteSize: fileStat.size,
    captionCount,
  }
}

function createApprovedCaptionTranscriptSegments(approvedSnapshot?: ApprovedPlanSnapshot): TranscriptSegment[] {
  const captionTimingItems = approvedSnapshot?.masterTimingPlan?.captionTimingItems ?? []
  return captionTimingItems.flatMap((caption, index): TranscriptSegment[] => {
    const text = sanitizePrivateReviewCopy(caption.captionText)
    if (!caption.id || !text) return []
    const fallbackStart = index * 2
    const startSeconds = numberFromUnknown(caption.timeRange?.startSeconds) ?? fallbackStart
    const durationSeconds = numberFromUnknown(caption.timeRange?.durationSeconds) ?? Math.max(1.2, text.split(/\s+/).length * 0.32)
    const endSeconds = numberFromUnknown(caption.timeRange?.endSeconds) ?? startSeconds + durationSeconds
    const safeEndSeconds = endSeconds > startSeconds ? endSeconds : startSeconds + Math.max(0.5, durationSeconds)

    return [{
      segmentId: caption.linkedTranscriptLineId || `approved-caption-${safePathPart(caption.id)}`,
      startSeconds,
      endSeconds: safeEndSeconds,
      text,
      confidence: 0.92,
      words: createApprovedCaptionWords({
        segmentId: caption.linkedTranscriptLineId || `approved-caption-${safePathPart(caption.id)}`,
        text,
        startSeconds,
        endSeconds: safeEndSeconds,
        emphasisWords: caption.emphasisWord ? [caption.emphasisWord] : [],
      }),
    }]
  })
}

function createApprovedCaptionWords(input: {
  segmentId: string
  text: string
  startSeconds: number
  endSeconds: number
  emphasisWords?: string[]
}): TranscriptWord[] {
  const tokens = input.text.split(/\s+/).filter(Boolean)
  if (tokens.length < 1) return []
  const durationSeconds = Math.max(0.2, input.endSeconds - input.startSeconds)
  const tokenDuration = durationSeconds / tokens.length
  const emphasis = new Set((input.emphasisWords ?? []).map((word) => word.toLowerCase()))

  return tokens.map((word, index) => ({
    word,
    startSeconds: Number((input.startSeconds + tokenDuration * index).toFixed(3)),
    endSeconds: Number((input.startSeconds + tokenDuration * (index + 1)).toFixed(3)),
    confidence: emphasis.has(word.toLowerCase().replace(/[^a-z0-9]+/gi, '')) ? 0.96 : 0.92,
    segmentId: input.segmentId,
  }))
}

function captionMimeType(format: CaptionFileFormat): PrivateCaptionExecutionFileArtifact['mimeType'] {
  if (format === 'srt') return 'application/x-subrip'
  if (format === 'webvtt') return 'text/vtt'
  return 'text/x-ssa'
}

async function createPrivateMediaArtifactQaReviewFromLocalProcessing(
  localMediaProcessingExecution: ApprovedEditExecutionLocalMediaProcessingExecution,
  toolWorkManifest: ApprovedToolWorkManifest,
  ffprobeBin?: string,
): Promise<ApprovedEditExecutionPrivateMediaArtifactQaReview> {
  const createdAt = nowIso()
  const qaResults = await Promise.all(localMediaProcessingExecution.processedArtifacts.map((artifact) =>
    createPrivateMediaArtifactQaReviewRecord({
      artifact,
      toolWorkManifest,
      workspaceId: localMediaProcessingExecution.workspaceId,
      projectId: localMediaProcessingExecution.projectId,
      creditReservationId: localMediaProcessingExecution.creditReservationId,
      ffprobeBin,
    })))
  const passedResults = qaResults.filter((result) => result.mediaArtifactQaPassed)
  const blockedResults = qaResults.filter((result) => !result.mediaArtifactQaPassed)
  const passedArtifactIds = passedResults.map((result) => result.artifactId)
  const blockedArtifactIds = blockedResults.map((result) => result.artifactId)
  const passed = blockedResults.length === 0 && qaResults.length > 0
  const toolOperationEvidence = qaResults.flatMap((result) => result.toolOperationEvidence ? [result.toolOperationEvidence] : [])

  return {
    id: createMockId('private_media_artifact_qa_review'),
    localMediaProcessingExecutionId: localMediaProcessingExecution.id,
    privateWorkerArtifactQaReviewId: localMediaProcessingExecution.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: localMediaProcessingExecution.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: localMediaProcessingExecution.workflowRehearsalId,
    localWorkerOutputId: localMediaProcessingExecution.localWorkerOutputId,
    localWorkerOutputQaReviewId: localMediaProcessingExecution.localWorkerOutputQaReviewId,
    resultReconciliationId: localMediaProcessingExecution.resultReconciliationId,
    handlerDryRunId: localMediaProcessingExecution.handlerDryRunId,
    packageRecordId: localMediaProcessingExecution.packageRecordId,
    workspaceId: localMediaProcessingExecution.workspaceId,
    projectId: localMediaProcessingExecution.projectId,
    approvedPlanSnapshotId: localMediaProcessingExecution.approvedPlanSnapshotId,
    creditReservationId: localMediaProcessingExecution.creditReservationId,
    status: passed
      ? 'private_media_artifact_qa_passed_waiting_render_preview_assembly'
      : 'private_media_artifact_qa_blocked',
    qaReviewOnly: true,
    reviewedArtifactCount: qaResults.length,
    passedArtifactCount: passedResults.length,
    blockedArtifactCount: blockedResults.length,
    privateMediaArtifactCount: localMediaProcessingExecution.privateMediaArtifactCount,
    mediaArtifactCount: localMediaProcessingExecution.mediaArtifactCount,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: toolOperationEvidence.length > 0 ? 1 : 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: false,
    finalRenderReady: false,
    toolWorkManifestRef: approvedToolWorkManifestRef(toolWorkManifest),
    toolOperationEvidence,
    qaResults,
    finalRenderReadiness: {
      ready: false,
      reason: passed
        ? 'Private media artifact QA passed, but preview/export waits for render preview assembly, user review, and final export readiness.'
        : 'Private media artifact QA found blockers that must be fixed before render preview assembly.',
      mediaQaPassedArtifactIds: passedArtifactIds,
      renderPreviewAssemblyRequiredArtifactIds: passed ? passedArtifactIds : blockedArtifactIds,
      privateMediaArtifactCount: localMediaProcessingExecution.privateMediaArtifactCount,
    },
    nextRequiredGate: passed ? 'render_preview_assembly' : 'private_media_artifact_fix',
    userFacingSummary: passed
      ? 'The private processed media passed internal QA. The system can now assemble a private preview for review.'
      : 'Some private processed media failed QA and needs to be fixed before preview assembly.',
    backendHandoffSummary: [
      `${qaResults.length} private processed media artifact(s) were reviewed.`,
      `${passedResults.length} passed artifact QA checks; ${blockedResults.length} blocked.`,
      'This QA review does not create public previews, signed URLs, final exports, Supabase/GCS writes, provider calls, or billing mutations.',
    ].join(' '),
    blockers: passed
      ? [
          'Render preview assembly has not run yet.',
          'User preview review has not passed yet.',
          'Final render/export remains blocked until render readiness and final QA pass.',
        ]
      : [
          'One or more private processed media artifacts failed QA.',
          'Render preview assembly must wait until private media artifact blockers are resolved.',
          'Final render/export remains blocked.',
        ],
    noRuntimeSideEffects: [
      'Private media artifact QA inspected existing local private processed artifacts only.',
      'No worker handler ran, no media processing command executed, no provider call occurred, no Supabase/GCS write occurred, no signed URL/public artifact was created, and no billing mutation happened.',
      'Future gates must assemble a private preview, collect user/internal review, and pass final export readiness before delivery.',
    ],
    createdAt,
    mockOnly: true,
  }
}

async function createPrivateMediaArtifactQaReviewRecord(
  input: {
    artifact: ProcessedPrivateMediaArtifact
    toolWorkManifest: ApprovedToolWorkManifest
    workspaceId: string
    projectId: string
    creditReservationId: string
    ffprobeBin?: string
  },
): Promise<PrivateMediaArtifactQaReviewRecord> {
  const { artifact } = input
  let localFileExists: boolean
  let localFileSizeMatches: boolean
  try {
    const fileStat = await stat(artifact.localFilePath)
    localFileExists = fileStat.isFile()
    localFileSizeMatches = fileStat.size === artifact.byteSize && fileStat.size > 0
  } catch {
    localFileExists = false
    localFileSizeMatches = false
  }
  const probeStartedAt = Date.now()
  let mediaProbe: MediaProbeSummary | undefined
  try {
    mediaProbe = await probeMediaFile(artifact.localFilePath, {
      ffprobeBin: input.ffprobeBin,
    })
  } catch {
    mediaProbe = undefined
  }
  const toolOperationEvidence = mediaProbe
    ? createApprovedToolOperationEvidence({
        manifest: input.toolWorkManifest,
        operationKind: 'processed_media_private_qa_probe',
        operationInstanceId: `${input.toolWorkManifest.coreOperationIds.processed_media_private_qa_probe}:artifact:${artifact.artifactId}`,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditReservationId: input.creditReservationId,
        outputArtifactId: artifact.artifactId,
        outputSha256: artifact.sha256,
        outputByteSize: artifact.byteSize,
        elapsedMilliseconds: Date.now() - probeStartedAt,
        mediaProcessingExecuted: false,
        mediaBytesProcessed: false,
        mediaProbe,
        qaChecks: [
          'ffprobe inspected the private processed artifact after FFmpeg work completed.',
          'Probe evidence is QA-only and did not transform media.',
        ],
        completedAt: nowIso(),
      })
    : undefined

  const allowedDurationSeconds = artifact.processingMode === 'private_internal_review_render' ? 60 : 10
  const checks: PrivateMediaArtifactQaCheck[] = [
    {
      check: 'private_processed_media_artifact',
      passed: artifact.privateArtifact === true && artifact.storageProvider === 'local_private' && artifact.processedMediaArtifact === true,
      message: 'Artifact is a private local processed media artifact.',
    },
    {
      check: 'source_media_bound',
      passed: artifact.sourceMediaBound === true && Boolean(artifact.sourceMediaAssetId) && artifact.uploadedOrder > 0,
      message: 'Artifact remains bound to an uploaded source media reference.',
    },
    {
      check: 'checksum_present',
      passed: /^[a-f0-9]{64}$/i.test(artifact.sha256) && artifact.byteSize > 0,
      message: 'Artifact includes checksum and byte-size evidence.',
    },
    {
      check: 'local_file_exists',
      passed: localFileExists && localFileSizeMatches,
      message: 'Artifact exists as a local private file and its size matches metadata.',
    },
    {
      check: 'no_signed_url',
      passed: artifact.signedUrl === null && !/^https?:\/\//i.test(artifact.storageObjectPath) && !/^https?:\/\//i.test(artifact.localFilePath),
      message: 'Artifact does not expose signed URLs or public URL paths.',
    },
    {
      check: 'no_public_artifact',
      passed: artifact.publicArtifact === false,
      message: 'Artifact is not marked public.',
    },
    {
      check: 'media_artifact_scope',
      passed: artifact.sourceOfTruth === true && artifact.sourceOfTruthScope === 'local_media_processing_execution_private_artifact' && artifact.mediaArtifact === true,
      message: 'Artifact is source-of-truth private media from local processing.',
    },
    {
      check: 'bounded_processing_policy',
      passed: (artifact.processingMode === 'bounded_preview_render' || artifact.processingMode === 'private_internal_review_render') &&
        artifact.durationSeconds > 0 &&
        artifact.durationSeconds <= allowedDurationSeconds,
      message: artifact.processingMode === 'private_internal_review_render'
        ? 'Artifact was produced by the private internal review render policy.'
        : 'Artifact was produced by the bounded preview processing policy.',
    },
    {
      check: 'ffprobe_video_stream_present',
      passed: mediaProbe?.hasVideo === true,
      message: 'ffprobe found a video stream in the private processed artifact.',
    },
    {
      check: 'ffprobe_duration_present',
      passed: typeof mediaProbe?.durationSeconds === 'number' && mediaProbe.durationSeconds > 0,
      message: 'ffprobe found a positive media duration in the private processed artifact.',
    },
    {
      check: 'approved_tool_operation_evidence_present',
      passed: toolOperationEvidence?.operationId === input.toolWorkManifest.coreOperationIds.processed_media_private_qa_probe &&
        toolOperationEvidence.toolId === 'ffprobe' &&
        toolOperationEvidence.actualToolExecuted === true &&
        toolOperationEvidence.mediaProcessingExecuted === false &&
        toolOperationEvidence.costEvidence.billableToUser === false &&
        toolOperationEvidence.costEvidence.walletMutationExecuted === false,
      message: 'Private media QA carries approved ffprobe operation and nonbillable internal cost evidence.',
    },
    {
      check: 'not_final_render_eligible',
      passed: artifact.finalRenderEligible === false,
      message: 'Artifact is not eligible for final render/export until later gates pass.',
    },
  ]
  const mediaArtifactQaPassed = checks.every((check) => check.passed)

  return {
    id: createMockId('private_media_artifact_qa_result'),
    artifactId: artifact.artifactId,
    sourceMediaAssetId: artifact.sourceMediaAssetId,
    workItemId: artifact.workItemId,
    qaStatus: mediaArtifactQaPassed ? 'passed_private_media_artifact_qa' : 'blocked_private_media_artifact_qa',
    mediaArtifactQaPassed,
    sourceMediaBound: artifact.sourceMediaBound,
    previewReviewEligible: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforePreviewAssembly: true,
    requiredBeforeFinalExport: true,
    checks,
    ...(mediaProbe ? { mediaProbe } : {}),
    ...(toolOperationEvidence ? { toolOperationEvidence } : {}),
    reason: mediaArtifactQaPassed
      ? 'Private media artifact QA passed. Render preview assembly is now the next gate.'
      : 'Private media artifact QA failed. The artifact must be fixed before preview assembly.',
  }
}

async function createRenderPreviewAssemblyFromPrivateMediaArtifactQa(input: {
  privateMediaArtifactQaReview: ApprovedEditExecutionPrivateMediaArtifactQaReview
  localMediaProcessingExecution: ApprovedEditExecutionLocalMediaProcessingExecution
  adapterWorkerArtifactIntegration?: ApprovedEditExecutionAdapterWorkerArtifactIntegration
  privateMediaRunnerQaReview?: RegisteredAdapterPrivateMediaRunnerQaReview
  approvedSnapshot?: ApprovedPlanSnapshot
  toolWorkManifest: ApprovedToolWorkManifest
  localStorageRoot: string
}): Promise<ApprovedEditExecutionRenderPreviewAssembly> {
  const createdAt = nowIso()
  const id = createMockId('render_preview_assembly')
  const passedArtifactIds = new Set(
    input.privateMediaArtifactQaReview.qaResults
      .filter((result) => result.mediaArtifactQaPassed)
      .map((result) => result.artifactId),
  )
  const passedArtifacts = input.localMediaProcessingExecution.processedArtifacts
    .filter((artifact) => passedArtifactIds.has(artifact.artifactId))
  const qaEvidenceByArtifactId = new Map(input.privateMediaArtifactQaReview.qaResults
    .flatMap((result) => result.toolOperationEvidence ? [[result.artifactId, result.toolOperationEvidence] as const] : []))
  const basePreviewClips = createRenderPreviewClips({
    processedArtifacts: passedArtifacts,
    approvedSnapshot: input.approvedSnapshot,
    qaEvidenceByArtifactId,
  })

  if (basePreviewClips.length < 1) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Render preview assembly requires at least one QA-passed private media artifact.', 409, {
      privateMediaArtifactQaReviewId: input.privateMediaArtifactQaReview.id,
    })
  }

  const executableCaptureOperations = input.toolWorkManifest.operations.filter((operation) =>
    operation.toolId === 'playwright' &&
    operation.disposition === 'executable_private_internal' &&
    operation.runner.runnerId === 'backend-private-playwright-approved-html-capture-runner')
  if (executableCaptureOperations.length > 4) {
    throw new ApiError('VALIDATION_FAILED', 'Private render preview supports at most four explicitly approved browser capture operations.', 409, {
      operationCount: executableCaptureOperations.length,
    })
  }
  const privateBrowserCaptureArtifacts: PrivatePlaywrightCaptureArtifact[] = []
  for (const operation of executableCaptureOperations) {
    privateBrowserCaptureArtifacts.push(await runApprovedPrivatePlaywrightCapture({
      manifest: input.toolWorkManifest,
      operationId: operation.operationId,
      localStorageRoot: input.localStorageRoot,
    }))
  }
  const captureBySegmentId = new Map<string, PrivatePlaywrightCaptureArtifact>()
  for (const artifact of privateBrowserCaptureArtifacts) {
    if (artifact.segmentIds.length !== 1 || artifact.rendererLayerIds.length < 1) {
      throw new ApiError('VALIDATION_FAILED', 'Approved browser capture must bind to exactly one segment and at least one renderer layer.', 409, {
        artifactId: artifact.artifactId,
      })
    }
    const segmentId = artifact.segmentIds[0]
    if (!basePreviewClips.some((clip) => clip.segmentId === segmentId)) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Approved browser capture has no matching private preview segment.', 409, {
        artifactId: artifact.artifactId,
        segmentId,
      })
    }
    if (captureBySegmentId.has(segmentId)) {
      throw new ApiError('VALIDATION_FAILED', 'Private render preview supports one approved browser capture per segment.', 409, { segmentId })
    }
    captureBySegmentId.set(segmentId, artifact)
  }
  const previewClips = basePreviewClips.map((clip): RenderPreviewAssemblyClipRef => {
    const capture = clip.segmentId ? captureBySegmentId.get(clip.segmentId) : undefined
    if (!capture) return clip
    return {
      ...clip,
      approvedBrowserCapture: {
        artifactId: capture.artifactId,
        operationId: capture.operationId,
        storageObjectPath: capture.storageObjectPath,
        localFilePath: capture.localFilePath,
        mimeType: capture.mimeType,
        sha256: capture.sha256,
        byteSize: capture.byteSize,
        width: 640,
        height: 360,
        sourceSpecSha256: capture.sourceSpecSha256,
        rendererLayerIds: [...capture.rendererLayerIds],
        source: 'approved_playwright_private_capture',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      },
    }
  })

  const assemblySource = previewClips.some((clip) => clip.assemblySource === 'approved_segment_order')
    ? 'approved_segment_order'
    : 'uploaded_source_order'
  const adapterQaIntegration = input.adapterWorkerArtifactIntegration
    ? createRenderPreviewAdapterQaIntegrationFromWorkerArtifactIntegration(input.adapterWorkerArtifactIntegration)
    : input.privateMediaRunnerQaReview
      ? createRenderPreviewAdapterQaIntegrationFromQaReview(input.privateMediaRunnerQaReview)
    : undefined
  const toolOperationEvidence = uniqueToolOperationEvidence([
    ...input.localMediaProcessingExecution.toolOperationEvidence,
    ...input.privateMediaArtifactQaReview.toolOperationEvidence,
    ...privateBrowserCaptureArtifacts.map((artifact) => artifact.toolOperationEvidence),
  ])

  const manifestArtifactId = `render-preview-manifest-${safePathPart(id)}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.privateMediaArtifactQaReview.workspaceId),
    safePathPart(input.privateMediaArtifactQaReview.projectId),
    safePathPart(input.privateMediaArtifactQaReview.id),
    'render-preview-assembly',
    `${safePathPart(manifestArtifactId)}.json`,
  )
  const localFilePath = resolvePathInsideRoot(input.localStorageRoot, relativeObjectPath)
  const manifest = {
    schemaVersion: 'reeditpro.render-preview-assembly.v1',
    renderPreviewAssemblyId: id,
    privateMediaArtifactQaReviewId: input.privateMediaArtifactQaReview.id,
    localMediaProcessingExecutionId: input.localMediaProcessingExecution.id,
    workspaceId: input.privateMediaArtifactQaReview.workspaceId,
    projectId: input.privateMediaArtifactQaReview.projectId,
    approvedPlanSnapshotId: input.privateMediaArtifactQaReview.approvedPlanSnapshotId,
    creditReservationId: input.privateMediaArtifactQaReview.creditReservationId,
    createdAt,
    assemblySource,
    previewPolicy: {
      privatePreviewOnly: true,
      publicArtifact: false,
      signedUrl: null,
      finalRenderEligible: false,
      userPreviewReviewRequired: true,
    },
    captionExecutionPackage: input.localMediaProcessingExecution.captionExecutionPackage,
    adapterQaIntegration,
    toolWorkManifestRef: input.localMediaProcessingExecution.toolWorkManifestRef,
    toolOperationEvidence,
    privateBrowserCaptures: privateBrowserCaptureArtifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      operationId: artifact.operationId,
      storageObjectPath: artifact.storageObjectPath,
      mimeType: artifact.mimeType,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
      width: artifact.width,
      height: artifact.height,
      sourceSpecSha256: artifact.sourceSpecSha256,
      rendererLayerIds: artifact.rendererLayerIds,
      segmentIds: artifact.segmentIds,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
    })),
    clips: previewClips.map((clip) => ({
      clipRefId: clip.clipRefId,
      processedArtifactId: clip.processedArtifactId,
      sourceMediaAssetId: clip.sourceMediaAssetId,
      sourceStorageProvider: clip.sourceStorageProvider,
      sourceStorageBucket: clip.sourceStorageBucket ?? null,
      sourceStoragePath: clip.sourceStoragePath,
      sourceFileName: clip.sourceFileName,
      sourceMimeType: clip.sourceMimeType,
      sourceByteSize: clip.sourceByteSize,
      uploadedOrder: clip.uploadedOrder,
      segmentId: clip.segmentId,
      segmentOrder: clip.segmentOrder,
      segmentLabel: clip.segmentLabel,
      approvedReviewOverlay: clip.approvedReviewOverlay,
      approvedCaptionOverlay: clip.approvedCaptionOverlay,
      approvedTransitionPolish: clip.approvedTransitionPolish,
      approvedFinalTiming: clip.approvedFinalTiming,
      approvedBrowserCapture: clip.approvedBrowserCapture
        ? {
            artifactId: clip.approvedBrowserCapture.artifactId,
            operationId: clip.approvedBrowserCapture.operationId,
            storageObjectPath: clip.approvedBrowserCapture.storageObjectPath,
            mimeType: clip.approvedBrowserCapture.mimeType,
            sha256: clip.approvedBrowserCapture.sha256,
            byteSize: clip.approvedBrowserCapture.byteSize,
            width: clip.approvedBrowserCapture.width,
            height: clip.approvedBrowserCapture.height,
            sourceSpecSha256: clip.approvedBrowserCapture.sourceSpecSha256,
            rendererLayerIds: clip.approvedBrowserCapture.rendererLayerIds,
            source: clip.approvedBrowserCapture.source,
            privateArtifact: true,
            publicArtifact: false,
            signedUrl: null,
          }
        : undefined,
      assemblySource: clip.assemblySource,
      workItemId: clip.workItemId,
      storageProvider: clip.storageProvider,
      storageObjectPath: clip.storageObjectPath,
      mimeType: clip.mimeType,
      sha256: clip.sha256,
      byteSize: clip.byteSize,
      durationSeconds: clip.durationSeconds,
      approvedSourceRange: clip.approvedSourceRange,
      toolOperationEvidence: clip.toolOperationEvidence,
      privateArtifact: clip.privateArtifact,
      publicArtifact: clip.publicArtifact,
      signedUrl: clip.signedUrl,
      previewReviewEligible: clip.previewReviewEligible,
      finalRenderEligible: clip.finalRenderEligible,
    })),
  }
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content: manifestJson,
  })
  const fileStat = await stat(localFilePath)
  const previewManifestArtifact: RenderPreviewAssemblyManifestArtifact = {
    artifactId: manifestArtifactId,
    storageProvider: 'local_private',
    storageObjectPath: relativeObjectPath.split('/').join('/'),
    localFilePath,
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'render_preview_assembly_private_manifest',
    sha256: createHash('sha256').update(manifestJson).digest('hex'),
    byteSize: fileStat.size,
    clipCount: previewClips.length,
    previewReviewEligible: true,
    finalRenderEligible: false,
  }

  return {
    id,
    privateMediaArtifactQaReviewId: input.privateMediaArtifactQaReview.id,
    localMediaProcessingExecutionId: input.privateMediaArtifactQaReview.localMediaProcessingExecutionId,
    privateWorkerArtifactQaReviewId: input.privateMediaArtifactQaReview.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: input.privateMediaArtifactQaReview.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: input.privateMediaArtifactQaReview.workflowRehearsalId,
    localWorkerOutputId: input.privateMediaArtifactQaReview.localWorkerOutputId,
    localWorkerOutputQaReviewId: input.privateMediaArtifactQaReview.localWorkerOutputQaReviewId,
    resultReconciliationId: input.privateMediaArtifactQaReview.resultReconciliationId,
    handlerDryRunId: input.privateMediaArtifactQaReview.handlerDryRunId,
    packageRecordId: input.privateMediaArtifactQaReview.packageRecordId,
    workspaceId: input.privateMediaArtifactQaReview.workspaceId,
    projectId: input.privateMediaArtifactQaReview.projectId,
    approvedPlanSnapshotId: input.privateMediaArtifactQaReview.approvedPlanSnapshotId,
    creditReservationId: input.privateMediaArtifactQaReview.creditReservationId,
    status: 'render_preview_assembly_completed_waiting_user_preview_review',
    assemblyOnly: true,
    previewClipCount: previewClips.length,
    privatePreviewArtifactCount: 1 + privateBrowserCaptureArtifacts.length,
    privateBrowserCaptureCount: privateBrowserCaptureArtifacts.length,
    mediaArtifactCount: input.privateMediaArtifactQaReview.mediaArtifactCount,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: privateBrowserCaptureArtifacts.length,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: false,
    toolWorkManifestRef: input.localMediaProcessingExecution.toolWorkManifestRef,
    toolOperationEvidence,
    privateBrowserCaptureArtifacts,
    previewClips,
    ...(input.localMediaProcessingExecution.captionExecutionPackage
      ? { captionExecutionPackage: input.localMediaProcessingExecution.captionExecutionPackage }
      : {}),
    ...(adapterQaIntegration ? { adapterQaIntegration } : {}),
    previewManifestArtifact,
    finalRenderReadiness: {
      ready: false,
      reason: 'A private render preview manifest is ready for review, but user preview approval and final export readiness have not passed.',
      previewManifestArtifactId: previewManifestArtifact.artifactId,
      previewClipArtifactIds: previewClips.map((clip) => clip.processedArtifactId),
      userPreviewReviewRequired: true,
    },
    nextRequiredGate: 'user_preview_review',
    userFacingSummary: 'A private preview package is ready for internal review. Final export is still locked until preview review passes.',
    backendHandoffSummary: [
      `${previewClips.length} QA-passed private media artifact(s) were assembled into a private preview manifest using ${assemblySource.replaceAll('_', ' ')}.`,
      input.localMediaProcessingExecution.captionExecutionPackage
        ? `${input.localMediaProcessingExecution.captionExecutionPackage.captionFileCount} private caption file artifact(s) are attached to the render preview manifest for review/render handoff.`
        : 'No private caption file package was attached because no approved caption timing items were available.',
      adapterQaIntegration
        ? `${adapterQaIntegration.artifactCount} private adapter QA artifact(s) are attached to the render preview manifest for final edit-decision traceability.`
        : 'No adapter QA artifacts were attached to this preview assembly.',
      privateBrowserCaptureArtifacts.length > 0
        ? `${privateBrowserCaptureArtifacts.length} fixed-template, zero-network private browser capture artifact(s) are attached to their approved segment and renderer layer.`
        : 'No browser capture strategy received explicit fixed-template authorization, so no Playwright capture ran.',
      'The preview assembly exposes no public URL, signed URL, final export, Supabase/GCS delivery, provider call, or billing mutation.',
      'The next gate is user/internal preview review before any final render/export readiness can pass.',
    ].join(' '),
    blockers: [
      'User/internal preview review has not passed yet.',
      'Final render/export remains blocked until preview review, final render readiness, and final QA pass.',
      'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
    ],
    noRuntimeSideEffects: [
      'Render preview assembly wrote a private JSON manifest under LOCAL_STORAGE_ROOT only.',
      'Caption files, when present, remain private source-of-truth artifacts generated from approved caption timing metadata.',
      'Adapter QA artifacts, when present, are private JSON evidence only and do not imply adapter media transforms ran inside this render preview gate.',
      privateBrowserCaptureArtifacts.length > 0
        ? 'Only explicitly approved fixed-template Playwright capture ran here; URL navigation, raw HTML, network access, credentials, provider calls, and public artifacts remained blocked.'
        : 'No optional browser capture operation ran because none was explicitly authorized.',
      'No media processing command, provider call, Supabase/GCS write, signed URL/public artifact, final export, or billing mutation occurred.',
      'Future gates must review the private preview, assemble final render readiness, and pass final delivery QA before release.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createRenderPreviewAdapterQaIntegrationFromWorkerArtifactIntegration(
  adapterWorkerArtifactIntegration: ApprovedEditExecutionAdapterWorkerArtifactIntegration,
): RenderPreviewAdapterQaIntegration {
  return {
    adapterWorkerArtifactIntegrationId: adapterWorkerArtifactIntegration.id,
    privateMediaRunnerQaReviewId: adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId,
    registeredRunnerRunId: adapterWorkerArtifactIntegration.registeredRunnerRunId,
    boundedAdapterExecutionRunId: adapterWorkerArtifactIntegration.boundedAdapterExecutionRunId,
    packageRecordId: adapterWorkerArtifactIntegration.packageRecordId,
    approvedPlanSnapshotId: adapterWorkerArtifactIntegration.approvedPlanSnapshotId,
    creditReservationId: adapterWorkerArtifactIntegration.creditReservationId,
    status: 'adapter_worker_artifact_integration_attached_to_render_preview',
    renderIntegrationManifestArtifactId: adapterWorkerArtifactIntegration.integrationManifestArtifact.artifactId,
    reviewedActivityCount: adapterWorkerArtifactIntegration.reviewedArtifactCount,
    passedActivityCount: adapterWorkerArtifactIntegration.integratedArtifactCount,
    artifactCount: adapterWorkerArtifactIntegration.integratedArtifactCount,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    renderPreviewIntegrationReady: true,
    finalRenderDecisionManifestEligible: true,
    mediaProcessingExecuted: false,
    mediaTransformOutputEligible: false,
    productRuntimeExecuted: false,
    artifacts: adapterWorkerArtifactIntegration.artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      activityExecutionId: artifact.activityExecutionId,
      canonicalToolId: artifact.canonicalToolId,
      actualToolPackageExecuted: artifact.actualToolPackageExecuted,
      storageProvider: artifact.storageProvider,
      storageObjectPath: artifact.storageObjectPath,
      mimeType: artifact.mimeType,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
      sourceOfTruthScope: artifact.sourceOfTruthScope,
      privateArtifact: artifact.privateArtifact,
      publicArtifact: artifact.publicArtifact,
      signedUrl: artifact.signedUrl,
    })),
  }
}

function createRenderPreviewAdapterQaIntegrationFromQaReview(
  privateMediaRunnerQaReview: RegisteredAdapterPrivateMediaRunnerQaReview,
): RenderPreviewAdapterQaIntegration {
  return {
    adapterWorkerArtifactIntegrationId: null,
    privateMediaRunnerQaReviewId: privateMediaRunnerQaReview.id,
    registeredRunnerRunId: privateMediaRunnerQaReview.registeredRunnerRunId,
    boundedAdapterExecutionRunId: privateMediaRunnerQaReview.boundedAdapterExecutionRunId,
    packageRecordId: privateMediaRunnerQaReview.packageRecordId,
    approvedPlanSnapshotId: privateMediaRunnerQaReview.approvedPlanSnapshotId,
    creditReservationId: privateMediaRunnerQaReview.creditReservationId,
    status: 'adapter_private_qa_evidence_attached_to_render_preview',
    renderIntegrationManifestArtifactId: null,
    reviewedActivityCount: privateMediaRunnerQaReview.reviewedActivityCount,
    passedActivityCount: privateMediaRunnerQaReview.passedActivityCount,
    artifactCount: privateMediaRunnerQaReview.artifactCount,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    renderPreviewIntegrationReady: true,
    finalRenderDecisionManifestEligible: true,
    mediaProcessingExecuted: false,
    mediaTransformOutputEligible: false,
    productRuntimeExecuted: false,
    artifacts: privateMediaRunnerQaReview.artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      activityExecutionId: artifact.activityExecutionId,
      canonicalToolId: artifact.canonicalToolId,
      actualToolPackageExecuted: artifact.actualToolPackageExecuted,
      storageProvider: artifact.storageProvider,
      storageObjectPath: artifact.storageObjectPath,
      mimeType: artifact.mimeType,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
      sourceOfTruthScope: artifact.sourceOfTruthScope,
      privateArtifact: artifact.privateArtifact,
      publicArtifact: artifact.publicArtifact,
      signedUrl: artifact.signedUrl,
    })),
  }
}

function createRenderPreviewClips(input: {
  processedArtifacts: ProcessedPrivateMediaArtifact[]
  approvedSnapshot?: ApprovedPlanSnapshot
  qaEvidenceByArtifactId: Map<string, ApprovedToolOperationEvidence>
}): RenderPreviewAssemblyClipRef[] {
  const sortedArtifacts = input.processedArtifacts
    .slice()
    .sort((left, right) => left.uploadedOrder - right.uploadedOrder || left.artifactId.localeCompare(right.artifactId))

  const segmentClips = createApprovedSegmentPreviewClips(sortedArtifacts, input.approvedSnapshot, input.qaEvidenceByArtifactId)
  if (segmentClips.length > 0) return segmentClips

  return sortedArtifacts.map((artifact, index) => createRenderPreviewClipRef({
    artifact,
    index,
    assemblySource: 'uploaded_source_order',
    qaToolOperationEvidence: input.qaEvidenceByArtifactId.get(artifact.artifactId),
  }))
}

function createApprovedSegmentPreviewClips(
  artifacts: ProcessedPrivateMediaArtifact[],
  approvedSnapshot?: ApprovedPlanSnapshot,
  qaEvidenceByArtifactId: Map<string, ApprovedToolOperationEvidence> = new Map(),
): RenderPreviewAssemblyClipRef[] {
  if (!approvedSnapshot?.segments?.length || artifacts.length < 1) return []

  const artifactByClipId = new Map<string, ProcessedPrivateMediaArtifact>()
  for (const artifact of artifacts) {
    for (const clipId of approvedClipIdsForSourceMedia({
      mediaAssetId: artifact.sourceMediaAssetId,
      sourceSequenceItemId: artifact.sourceSequenceItemId,
      uploadedClipId: artifact.uploadedClipId,
      uploadedOrder: artifact.uploadedOrder,
      storageProvider: artifact.sourceStorageProvider,
      storageBucket: artifact.sourceStorageBucket,
      storagePath: artifact.sourceStoragePath,
      fileName: artifact.sourceFileName,
      mimeType: artifact.sourceMimeType,
      byteSize: artifact.sourceByteSize,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }, approvedSnapshot)) {
      if (!artifactByClipId.has(clipId)) artifactByClipId.set(clipId, artifact)
    }
  }

  const sortedSegments = approvedSnapshot.segments
    .slice()
    .sort((left, right) => left.segment_order - right.segment_order)
  const segmentClips = sortedSegments.flatMap((segment, index): RenderPreviewAssemblyClipRef[] => {
      const sourceClipIds = Array.isArray(segment.source_clip_ids_json)
        ? segment.source_clip_ids_json.filter((clipId): clipId is string => typeof clipId === 'string' && clipId.trim().length > 0)
        : []
      const artifact = sourceClipIds
        .map((clipId) => artifactByClipId.get(clipId))
        .find((candidate): candidate is ProcessedPrivateMediaArtifact => Boolean(candidate))

      if (!artifact) return []

      return [createRenderPreviewClipRef({
        artifact,
        index,
        assemblySource: 'approved_segment_order',
        qaToolOperationEvidence: qaEvidenceByArtifactId.get(artifact.artifactId),
        segment: {
          id: segment.id,
          order: segment.segment_order,
          label: segment.label,
          storyPurpose: segment.story_purpose,
          spokenTextSummary: segment.spoken_text_summary,
        },
        approvedCaptionOverlay: createApprovedCaptionOverlay(segment, index, approvedSnapshot),
        approvedTransitionPolish: createApprovedTransitionPolish(segment, index, approvedSnapshot),
        approvedVisualPolish: createApprovedVisualPolish(segment, index, approvedSnapshot),
        approvedFinalTiming: createApprovedFinalTiming(segment, index, approvedSnapshot),
      })]
    })

  return segmentClips.length === sortedSegments.length ? segmentClips : []
}

function createRenderPreviewClipRef(input: {
  artifact: ProcessedPrivateMediaArtifact
  index: number
  assemblySource: 'approved_segment_order' | 'uploaded_source_order'
  qaToolOperationEvidence?: ApprovedToolOperationEvidence
  segment?: { id: string; order: number; label: string; storyPurpose?: string; spokenTextSummary?: string }
  approvedCaptionOverlay?: RenderPreviewAssemblyClipRef['approvedCaptionOverlay']
  approvedTransitionPolish?: RenderPreviewAssemblyClipRef['approvedTransitionPolish']
  approvedVisualPolish?: RenderPreviewAssemblyClipRef['approvedVisualPolish']
  approvedFinalTiming?: RenderPreviewAssemblyClipRef['approvedFinalTiming']
}): RenderPreviewAssemblyClipRef {
  const approvedReviewOverlay = input.segment
    ? createApprovedReviewOverlay(input.segment)
    : undefined

  return {
    clipRefId: input.segment
      ? `preview-segment-${String(input.segment.order).padStart(2, '0')}-${safePathPart(input.segment.id)}`
      : `preview-clip-${safePathPart(input.artifact.artifactId)}-${String(input.index + 1).padStart(2, '0')}`,
    processedArtifactId: input.artifact.artifactId,
    sourceMediaAssetId: input.artifact.sourceMediaAssetId,
    sourceChecksumSha256: input.artifact.sourceChecksumSha256,
    sourceStorageProvider: input.artifact.sourceStorageProvider,
    sourceStorageBucket: input.artifact.sourceStorageBucket,
    sourceStoragePath: input.artifact.sourceStoragePath,
    sourceFileName: input.artifact.sourceFileName,
    sourceMimeType: input.artifact.sourceMimeType,
    sourceByteSize: input.artifact.sourceByteSize,
    uploadedOrder: input.artifact.uploadedOrder,
    segmentId: input.segment?.id,
    segmentOrder: input.segment?.order,
    segmentLabel: input.segment?.label,
    approvedReviewOverlay,
    approvedCaptionOverlay: input.approvedCaptionOverlay,
    approvedTransitionPolish: input.approvedTransitionPolish,
    approvedVisualPolish: input.approvedVisualPolish,
    approvedFinalTiming: input.approvedFinalTiming,
    assemblySource: input.assemblySource,
    workItemId: input.artifact.workItemId,
    storageProvider: input.artifact.storageProvider,
    storageObjectPath: input.artifact.storageObjectPath,
    localFilePath: input.artifact.localFilePath,
    mimeType: input.artifact.mimeType,
    sha256: input.artifact.sha256,
    byteSize: input.artifact.byteSize,
    durationSeconds: input.artifact.durationSeconds,
    processingMode: input.artifact.processingMode,
    audioExecutionReview: input.artifact.audioExecutionReview,
    approvedSourceRange: input.artifact.approvedSourceRange,
    toolOperationEvidence: uniqueToolOperationEvidence([
      input.artifact.toolOperationEvidence,
      ...(input.qaToolOperationEvidence ? [input.qaToolOperationEvidence] : []),
    ]),
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    previewReviewEligible: true,
    finalRenderEligible: false,
  }
}

function createApprovedVisualPolish(
  segment: { id: string },
  index: number,
  approvedSnapshot: ApprovedPlanSnapshot,
): RenderPreviewAssemblyClipRef['approvedVisualPolish'] | undefined {
  const colorPipelinePlan = approvedSnapshot.colorPipelinePlan
  if (!colorPipelinePlan?.id || !colorPipelinePlan.colorGradeStyle || !colorPipelinePlan.intensity) return undefined
  const clipPlan = colorPipelinePlan.clipPlans.find((plan) => plan.clipId === segment.id) ??
    colorPipelinePlan.clipPlans[index] ??
    colorPipelinePlan.clipPlans[0]
  const operations = [
    ...colorPipelinePlan.projectOperations,
    ...(clipPlan?.correctionOperations ?? []),
    ...(clipPlan?.lookOperations ?? []),
  ]
    .filter((operation) => operation.toolId === 'ffmpeg' || operation.toolId === 'planning_only')
    .slice(0, 8)

  return {
    colorPipelinePlanId: colorPipelinePlan.id,
    colorGradeStyle: colorPipelinePlan.colorGradeStyle,
    intensity: colorPipelinePlan.intensity,
    operationIds: Array.from(new Set(operations.map((operation) => operation.operation))),
    operationLabels: Array.from(new Set(operations.map((operation) => operation.label))),
    source: 'approved_color_pipeline_private_render',
    toolId: 'ffmpeg',
    fullColorPipelineExecuted: false,
    safeForPrivateReview: true,
  }
}

function createApprovedFinalTiming(
  segment: { id: string; label?: string; source_clip_ids_json?: unknown; final_time_range_json?: unknown },
  index: number,
  approvedSnapshot: ApprovedPlanSnapshot,
): RenderPreviewAssemblyClipRef['approvedFinalTiming'] | undefined {
  const finalTiming = findApprovedFinalTimelineSegment(segment, index, approvedSnapshot)
  const finalTimingRange = rangeFromUnknownRecord(finalTiming?.finalRange)
  const segmentTimingRange = rangeFromUnknownRecord(segment.final_time_range_json)
  const range = finalTimingRange ? finalTiming?.finalRange : segment.final_time_range_json
  const finalRange = finalTimingRange ?? segmentTimingRange
  if (!finalRange) return undefined
  const durationSeconds = finalRange.durationSeconds
  const startSeconds = finalRange.startSeconds
  const endSeconds = finalRange.endSeconds ?? startSeconds + durationSeconds
  const fps = numberFromUnknown(unknownRecord(range)?.fps) ?? approvedSnapshot.masterTimingPlan?.timingBase.fps
  if (durationSeconds === undefined || startSeconds === undefined || endSeconds === undefined || fps === undefined) {
    return undefined
  }
  return {
    finalTimingItemId: finalTiming?.id ?? `approved-segment-final-timing-${segment.id}`,
    startSeconds,
    durationSeconds,
    endSeconds,
    fps,
    source: 'approved_master_timing_final_range',
    safeForPrivateReview: true,
  }
}

function createApprovedTransitionPolish(
  segment: { id: string; label?: string; source_clip_ids_json?: unknown; final_time_range_json?: unknown },
  index: number,
  approvedSnapshot: ApprovedPlanSnapshot,
): RenderPreviewAssemblyClipRef['approvedTransitionPolish'] | undefined {
  const transitionTimingItems = approvedSnapshot.masterTimingPlan?.transitionTimingItems ?? []
  const finalTiming = findApprovedFinalTimelineSegment(segment, index, approvedSnapshot)
  const segmentTimingIds = new Set([
    segment.id,
    finalTiming?.id,
    finalTiming?.segmentId,
  ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  const incoming = transitionTimingItems.find((item) => item.toSegmentId && segmentTimingIds.has(item.toSegmentId)) ??
    (index > 0 ? transitionTimingItems[index - 1] : undefined)
  const outgoing = transitionTimingItems.find((item) => item.fromSegmentId && segmentTimingIds.has(item.fromSegmentId)) ??
    transitionTimingItems[index]
  const transitionTimingItemIds = [incoming?.id, outgoing?.id].filter((id): id is string => Boolean(id))
  if (transitionTimingItemIds.length < 1) return undefined

  return {
    fadeInSeconds: incoming ? approvedTransitionDurationSeconds(incoming) : undefined,
    fadeOutSeconds: outgoing ? approvedTransitionDurationSeconds(outgoing) : undefined,
    transitionTimingItemIds,
    source: 'approved_transition_timing',
    safeForPrivateReview: true,
  }
}

type ApprovedFinalTimelineSegment = NonNullable<ApprovedPlanSnapshot['masterTimingPlan']>['finalTimelineSegments'][number]

function findApprovedFinalTimelineSegment(
  segment: { id: string; label?: string; source_clip_ids_json?: unknown },
  index: number,
  approvedSnapshot: ApprovedPlanSnapshot,
): ApprovedFinalTimelineSegment | undefined {
  const finalTimelineSegments = approvedSnapshot.masterTimingPlan?.finalTimelineSegments ?? []
  const bySegmentId = finalTimelineSegments.find((item) => item.segmentId === segment.id || item.id === segment.id)
  if (bySegmentId) return bySegmentId

  const sourceClipIds = segmentSourceClipIds(segment)
  const sourceTimingItemIds = approvedSnapshot.masterTimingPlan?.sourceTimingItems
    .filter((item) => sourceClipIds.includes(item.clipId))
    .map((item) => item.id) ?? []
  const bySourceTiming = sourceTimingItemIds.length
    ? finalTimelineSegments.find((item) => item.sourceTimingItemIds.some((sourceTimingItemId) =>
        sourceTimingItemIds.includes(sourceTimingItemId)))
    : undefined
  if (bySourceTiming) return bySourceTiming

  const byLabel = segment.label
    ? finalTimelineSegments.find((item) => item.label === segment.label)
    : undefined
  return byLabel ?? finalTimelineSegments[index]
}

function segmentSourceClipIds(segment: { source_clip_ids_json?: unknown }): string[] {
  return Array.isArray(segment.source_clip_ids_json)
    ? segment.source_clip_ids_json.filter((clipId): clipId is string => typeof clipId === 'string' && clipId.trim().length > 0)
    : []
}

function approvedTransitionDurationSeconds(transitionTimingItem: { timeRange?: { durationSeconds?: unknown } }): number {
  const durationSeconds = numberFromUnknown(transitionTimingItem.timeRange?.durationSeconds)
  if (!Number.isFinite(durationSeconds)) return 0.12
  return Math.min(0.2, Math.max(0.08, Number(durationSeconds)))
}

function createApprovedCaptionOverlay(
  segment: { id: string; final_time_range_json?: unknown },
  index: number,
  approvedSnapshot: ApprovedPlanSnapshot,
): RenderPreviewAssemblyClipRef['approvedCaptionOverlay'] | undefined {
  const captionTimingItems = approvedSnapshot.masterTimingPlan?.captionTimingItems ?? []
  const caption = captionTimingItems.find((item) => item.linkedTranscriptLineId?.includes(segment.id)) ??
    captionTimingItems[index]
  const text = sanitizePrivateReviewCopy(caption?.captionText)
  if (!caption?.id || !text) return undefined

  return {
    text,
    captionTimingItemId: caption.id,
    source: 'approved_caption_timing',
    safeForPrivateReview: true,
    transcriptWorkerOutput: false,
  }
}

function createApprovedReviewOverlay(segment: {
  order: number
  label: string
  storyPurpose?: string
  spokenTextSummary?: string
}): RenderPreviewAssemblyClipRef['approvedReviewOverlay'] {
  const label = sanitizePrivateReviewCopy(segment.label) || `Edit beat ${segment.order}`
  const purpose = sanitizePrivateReviewCopy(segment.storyPurpose) || sanitizePrivateReviewCopy(segment.spokenTextSummary)

  return {
    title: `Beat ${segment.order}: ${label}`,
    subtitle: purpose,
    source: 'approved_segment_metadata',
    safeForPrivateReview: true,
  }
}

function createUserPreviewReviewFromRenderPreviewAssembly(input: {
  renderPreviewAssembly: ApprovedEditExecutionRenderPreviewAssembly
  reviewDecision: 'approved_for_final_render_readiness' | 'changes_requested'
  reviewerNote?: string
}): ApprovedEditExecutionUserPreviewReview {
  const createdAt = nowIso()
  const approved = input.reviewDecision === 'approved_for_final_render_readiness'

  return {
    id: createMockId('user_preview_review'),
    renderPreviewAssemblyId: input.renderPreviewAssembly.id,
    privateMediaArtifactQaReviewId: input.renderPreviewAssembly.privateMediaArtifactQaReviewId,
    localMediaProcessingExecutionId: input.renderPreviewAssembly.localMediaProcessingExecutionId,
    privateWorkerArtifactQaReviewId: input.renderPreviewAssembly.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: input.renderPreviewAssembly.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: input.renderPreviewAssembly.workflowRehearsalId,
    localWorkerOutputId: input.renderPreviewAssembly.localWorkerOutputId,
    localWorkerOutputQaReviewId: input.renderPreviewAssembly.localWorkerOutputQaReviewId,
    resultReconciliationId: input.renderPreviewAssembly.resultReconciliationId,
    handlerDryRunId: input.renderPreviewAssembly.handlerDryRunId,
    packageRecordId: input.renderPreviewAssembly.packageRecordId,
    workspaceId: input.renderPreviewAssembly.workspaceId,
    projectId: input.renderPreviewAssembly.projectId,
    approvedPlanSnapshotId: input.renderPreviewAssembly.approvedPlanSnapshotId,
    creditReservationId: input.renderPreviewAssembly.creditReservationId,
    status: approved
      ? 'user_preview_review_approved_waiting_final_render_readiness'
      : 'user_preview_review_changes_requested',
    reviewOnly: true,
    reviewDecision: input.reviewDecision,
    reviewerNote: input.reviewerNote,
    previewClipCount: input.renderPreviewAssembly.previewClipCount,
    privatePreviewArtifactCount: input.renderPreviewAssembly.privatePreviewArtifactCount,
    mediaArtifactCount: input.renderPreviewAssembly.mediaArtifactCount,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: false,
    finalRenderReadiness: {
      ready: false,
      reason: approved
        ? 'Private preview review approved the preview, but final render/export still waits for final render readiness and delivery QA.'
        : 'Private preview review requested changes; a revision plan is required before final render readiness.',
      renderPreviewAssemblyId: input.renderPreviewAssembly.id,
      previewApproved: approved,
      nextReviewRequired: approved ? 'final_render_readiness_review' : 'revision_plan',
    },
    nextRequiredGate: approved ? 'final_render_readiness_review' : 'preview_revision_plan',
    userFacingSummary: approved
      ? 'The private preview was approved for final render readiness review.'
      : 'The private preview needs changes before final render can be considered.',
    backendHandoffSummary: [
      approved
        ? 'The private preview review approved the assembled preview for the final-render-readiness gate.'
        : 'The private preview review requested changes and keeps final render blocked.',
      'This review does not create a final export, public artifact, signed URL, Supabase/GCS delivery, provider call, or billing mutation.',
    ].join(' '),
    blockers: approved
      ? [
          'Final render readiness review has not passed yet.',
          'Final export and delivery QA remain blocked.',
          'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
        ]
      : [
          'Preview changes were requested.',
          'A revision plan is required before final render readiness can resume.',
          'Final render/export remains blocked.',
        ],
    noRuntimeSideEffects: [
      'User preview review recorded an approval/revision decision only.',
      'No media processing command, worker handler, provider call, Supabase/GCS write, signed URL/public artifact, final export, or billing mutation occurred.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createFinalRenderReadinessReviewFromUserPreviewReview(
  userPreviewReview: ApprovedEditExecutionUserPreviewReview,
): ApprovedEditExecutionFinalRenderReadinessReview {
  const createdAt = nowIso()

  return {
    id: createMockId('final_render_readiness_review'),
    userPreviewReviewId: userPreviewReview.id,
    renderPreviewAssemblyId: userPreviewReview.renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: userPreviewReview.privateMediaArtifactQaReviewId,
    localMediaProcessingExecutionId: userPreviewReview.localMediaProcessingExecutionId,
    privateWorkerArtifactQaReviewId: userPreviewReview.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: userPreviewReview.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: userPreviewReview.workflowRehearsalId,
    localWorkerOutputId: userPreviewReview.localWorkerOutputId,
    localWorkerOutputQaReviewId: userPreviewReview.localWorkerOutputQaReviewId,
    resultReconciliationId: userPreviewReview.resultReconciliationId,
    handlerDryRunId: userPreviewReview.handlerDryRunId,
    packageRecordId: userPreviewReview.packageRecordId,
    workspaceId: userPreviewReview.workspaceId,
    projectId: userPreviewReview.projectId,
    approvedPlanSnapshotId: userPreviewReview.approvedPlanSnapshotId,
    creditReservationId: userPreviewReview.creditReservationId,
    status: 'final_render_readiness_passed_waiting_final_render_execution',
    readinessReviewOnly: true,
    previewApproved: true,
    previewClipCount: userPreviewReview.previewClipCount,
    privatePreviewArtifactCount: userPreviewReview.privatePreviewArtifactCount,
    mediaArtifactCount: userPreviewReview.mediaArtifactCount,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: true,
    finalExportReady: false,
    finalRenderReadiness: {
      ready: true,
      reason: 'The approved private preview is ready for bounded final render execution. Export delivery still requires render execution and delivery QA.',
      userPreviewReviewId: userPreviewReview.id,
      renderPreviewAssemblyId: userPreviewReview.renderPreviewAssemblyId,
      finalRenderExecutionRequired: true,
    },
    nextRequiredGate: 'final_render_execution',
    userFacingSummary: 'The approved preview is ready for final render execution.',
    backendHandoffSummary: [
      'Final render readiness passed for the approved private preview.',
      'This gate does not run rendering, create final exports, publish artifacts, write Supabase/GCS, call providers, or bill users.',
      'The next gate is bounded final render execution using approved private artifacts.',
    ].join(' '),
    blockers: [
      'Final render execution has not run yet.',
      'Final delivery QA has not passed yet.',
      'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
    ],
    noRuntimeSideEffects: [
      'Final render readiness review recorded a readiness decision only.',
      'No render/export command, media processing command, worker handler, provider call, Supabase/GCS write, signed URL/public artifact, or billing mutation occurred.',
    ],
    createdAt,
    mockOnly: true,
  }
}

async function createFinalRenderExecutionFromReadiness(input: {
  finalRenderReadinessReview: ApprovedEditExecutionFinalRenderReadinessReview
  renderPreviewAssembly: ApprovedEditExecutionRenderPreviewAssembly
  approvedSnapshot?: ApprovedPlanSnapshot
  toolWorkManifest: ApprovedToolWorkManifest
  localStorageRoot: string
  storageAdapter?: StorageAdapter
  exportBucketName?: string
  qaArtifactBucketName?: string
  ffmpegBin?: string
  ffprobeBin?: string
}): Promise<ApprovedEditExecutionFinalRenderExecution> {
  const createdAt = nowIso()
  const id = createMockId('final_render_execution')
  const finalRenderArtifactId = `final-render-${safePathPart(id)}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.finalRenderReadinessReview.workspaceId),
    safePathPart(input.finalRenderReadinessReview.projectId),
    safePathPart(input.finalRenderReadinessReview.id),
    'final-render-execution',
    `${safePathPart(finalRenderArtifactId)}.mp4`,
  )
  const outputPath = resolvePathInsideRoot(input.localStorageRoot, relativeObjectPath)
  const previewClipPaths = input.renderPreviewAssembly.previewClips.map((clip) => clip.localFilePath)
  const finalRenderStartedAt = Date.now()
  const finalRender = await createPrivateFinalRenderFromPreviewClips(previewClipPaths, outputPath, {
    localStorageRoot: input.localStorageRoot,
    ffmpegBin: input.ffmpegBin,
    ffprobeBin: input.ffprobeBin,
    clipOverlays: input.renderPreviewAssembly.previewClips.map((clip) => ({
      title: clip.approvedReviewOverlay?.title,
      caption: clip.approvedCaptionOverlay?.text,
      subtitle: clip.approvedReviewOverlay?.subtitle,
      visualPolish: clip.approvedVisualPolish
        ? {
            source: 'approved_color_pipeline_private_render',
            colorGradeStyle: clip.approvedVisualPolish.colorGradeStyle,
            intensity: clip.approvedVisualPolish.intensity,
            operationIds: clip.approvedVisualPolish.operationIds,
            operationLabels: clip.approvedVisualPolish.operationLabels,
            toolId: 'ffmpeg',
            fullColorPipelineExecuted: false,
          }
        : undefined,
      transitionPolish: clip.approvedTransitionPolish
        ? {
            source: 'approved_transition_timing',
            fadeInSeconds: clip.approvedTransitionPolish.fadeInSeconds,
            fadeOutSeconds: clip.approvedTransitionPolish.fadeOutSeconds,
          }
        : undefined,
      approvedFinalTiming: clip.approvedFinalTiming
        ? {
            source: 'approved_master_timing_final_range',
            durationSeconds: clip.approvedFinalTiming.durationSeconds,
          }
        : undefined,
      approvedBrowserCapture: clip.approvedBrowserCapture
        ? {
            source: 'approved_playwright_private_capture',
            artifactId: clip.approvedBrowserCapture.artifactId,
            operationId: clip.approvedBrowserCapture.operationId,
            localFilePath: clip.approvedBrowserCapture.localFilePath,
            sha256: clip.approvedBrowserCapture.sha256,
            width: 640,
            height: 360,
            rendererLayerIds: clip.approvedBrowserCapture.rendererLayerIds,
          }
        : undefined,
    })),
  })
  const finalRenderToolOperationEvidence = createApprovedToolOperationEvidence({
    manifest: input.toolWorkManifest,
    operationKind: 'final_private_render',
    operationInstanceId: `${input.toolWorkManifest.coreOperationIds.final_private_render}:artifact:${finalRenderArtifactId}`,
    workspaceId: input.finalRenderReadinessReview.workspaceId,
    projectId: input.finalRenderReadinessReview.projectId,
    creditReservationId: input.finalRenderReadinessReview.creditReservationId,
    outputArtifactId: finalRenderArtifactId,
    outputSha256: finalRender.checksumSha256,
    outputByteSize: finalRender.sizeBytes,
    outputSeconds: finalRender.durationSeconds,
    megapixelFrames: (finalRender.width * finalRender.height * finalRender.fps * finalRender.durationSeconds) / 1_000_000,
    elapsedMilliseconds: Date.now() - finalRenderStartedAt,
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: [
      'FFmpeg final render completed from approved private preview clips.',
      'Output remained private, checksumed, and gated for final delivery QA.',
    ],
    completedAt: nowIso(),
  })
  const toolOperationEvidence = uniqueToolOperationEvidence([
    ...input.renderPreviewAssembly.toolOperationEvidence,
    finalRenderToolOperationEvidence,
  ])

  const commandSummary: PrivateFinalRenderArtifact['commandSummary'] = {
    ...finalRender.commandSummary,
    privateCaptionArtifactCount: input.renderPreviewAssembly.captionExecutionPackage?.captionArtifactCount ?? 0,
    privateCaptionFormats: input.renderPreviewAssembly.captionExecutionPackage?.captionFormats ?? [],
    privateCaptionSource: input.renderPreviewAssembly.captionExecutionPackage?.source ?? 'none',
  }
  const editDecisionManifest = createProfessionalEditDecisionManifest({
    approvedPlanSnapshotId: input.finalRenderReadinessReview.approvedPlanSnapshotId,
    approvedSnapshot: input.approvedSnapshot,
    creditReservationId: input.finalRenderReadinessReview.creditReservationId,
    renderPreviewAssemblyId: input.renderPreviewAssembly.id,
    finalRenderArtifactId,
    toolWorkManifest: input.toolWorkManifest,
    toolOperationEvidence,
    previewClips: input.renderPreviewAssembly.previewClips,
    commandSummary,
    ...(input.renderPreviewAssembly.captionExecutionPackage
      ? { captionExecutionPackage: input.renderPreviewAssembly.captionExecutionPackage }
      : {}),
    ...(input.renderPreviewAssembly.adapterQaIntegration
      ? { adapterQaIntegration: input.renderPreviewAssembly.adapterQaIntegration }
      : {}),
  })
  const editDecisionManifestArtifact = await persistProfessionalEditDecisionManifestArtifact({
    manifest: editDecisionManifest,
    finalRenderArtifactId,
    localStorageRoot: input.localStorageRoot,
    relativeDirectoryPath: dirname(relativeObjectPath),
    storageAdapter: input.storageAdapter,
    qaArtifactBucketName: input.qaArtifactBucketName,
  })
  const privateStorageMirror = await mirrorPrivateArtifactToStorage({
    storageAdapter: input.storageAdapter,
    bucketName: input.exportBucketName,
    objectPath: relativeObjectPath.split('/').join('/'),
    localFilePath: finalRender.outputPath,
    mimeType: 'video/mp4',
    expectedByteSize: finalRender.sizeBytes,
    expectedSha256: finalRender.checksumSha256,
  })

  const finalRenderArtifact: PrivateFinalRenderArtifact = {
    artifactId: finalRenderArtifactId,
    storageProvider: 'local_private',
    storageObjectPath: relativeObjectPath.split('/').join('/'),
    localFilePath: finalRender.outputPath,
    ...(privateStorageMirror ? { privateStorageMirror } : {}),
    mimeType: 'video/mp4',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'final_render_execution_private_artifact',
    mediaArtifact: true,
    finalRenderArtifact: true,
    durationSeconds: finalRender.durationSeconds,
    width: finalRender.width,
    height: finalRender.height,
    sha256: finalRender.checksumSha256,
    byteSize: finalRender.sizeBytes,
    toolWorkManifestRef: approvedToolWorkManifestRef(input.toolWorkManifest),
    toolOperationEvidence,
    commandSummary,
    editDecisionManifest,
    editDecisionManifestArtifact,
    deliveryQaRequired: true,
    finalDeliveryEligible: false,
  }

  return {
    id,
    finalRenderReadinessReviewId: input.finalRenderReadinessReview.id,
    userPreviewReviewId: input.finalRenderReadinessReview.userPreviewReviewId,
    renderPreviewAssemblyId: input.finalRenderReadinessReview.renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: input.finalRenderReadinessReview.privateMediaArtifactQaReviewId,
    localMediaProcessingExecutionId: input.finalRenderReadinessReview.localMediaProcessingExecutionId,
    privateWorkerArtifactQaReviewId: input.finalRenderReadinessReview.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: input.finalRenderReadinessReview.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: input.finalRenderReadinessReview.workflowRehearsalId,
    localWorkerOutputId: input.finalRenderReadinessReview.localWorkerOutputId,
    localWorkerOutputQaReviewId: input.finalRenderReadinessReview.localWorkerOutputQaReviewId,
    resultReconciliationId: input.finalRenderReadinessReview.resultReconciliationId,
    handlerDryRunId: input.finalRenderReadinessReview.handlerDryRunId,
    packageRecordId: input.finalRenderReadinessReview.packageRecordId,
    workspaceId: input.finalRenderReadinessReview.workspaceId,
    projectId: input.finalRenderReadinessReview.projectId,
    approvedPlanSnapshotId: input.finalRenderReadinessReview.approvedPlanSnapshotId,
    creditReservationId: input.finalRenderReadinessReview.creditReservationId,
    status: 'final_render_execution_completed_waiting_delivery_qa',
    renderExecutionOnly: true,
    previewClipCount: input.renderPreviewAssembly.previewClipCount,
    finalRenderArtifactCount: 1,
    mediaArtifactCount: input.finalRenderReadinessReview.mediaArtifactCount,
    workersStarted: 0,
    workerHandlersStarted: 1,
    toolsExecuted: 1,
    mediaBytesProcessed: true,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: true,
    finalExportReady: false,
    toolWorkManifestRef: approvedToolWorkManifestRef(input.toolWorkManifest),
    toolOperationEvidence,
    finalRenderArtifact,
    finalDeliveryReadiness: {
      ready: false,
      reason: 'A private final-render candidate exists, but delivery QA and public/export release checks have not passed.',
      finalRenderArtifactId: finalRenderArtifact.artifactId,
      deliveryQaRequired: true,
    },
    nextRequiredGate: 'final_delivery_qa',
    userFacingSummary: 'A private final-render candidate was created for delivery QA.',
    backendHandoffSummary: [
      `${input.renderPreviewAssembly.previewClipCount} private preview clip(s) were combined into one private final-render candidate.`,
      'This gate does not publish files, create signed URLs, write Supabase delivery records, approve external beta, or bill users. GCS-mode runs may create private storage mirrors for internal test durability only.',
      'The next gate is delivery QA before any user-facing export or public delivery can be released.',
    ].join(' '),
    blockers: [
      'Final delivery QA has not passed yet.',
      'Public delivery and signed URLs remain blocked.',
      'External beta and production require approved release evidence gates.',
    ],
    noRuntimeSideEffects: [
      'Final render execution wrote a private local MP4 candidate under LOCAL_STORAGE_ROOT and may mirror it to private configured storage in GCS mode.',
      'No provider call, Supabase delivery write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
    createdAt,
    mockOnly: true,
  }
}

async function mirrorPrivateArtifactToStorage(input: {
  storageAdapter?: StorageAdapter
  bucketName?: string
  objectPath: string
  localFilePath: string
  mimeType: string
  expectedByteSize: number
  expectedSha256: string
}): Promise<PrivateStorageMirror | undefined> {
  if (!input.storageAdapter || input.storageAdapter.mode !== 'gcs') return undefined
  if (!input.bucketName?.trim()) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private GCS artifact mirror requires a configured private bucket.', 409)
  }

  const body = await readFile(input.localFilePath)
  if (body.byteLength !== input.expectedByteSize) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private artifact mirror source byte size does not match artifact metadata.', 409)
  }

  const sha256 = createHash('sha256').update(body).digest('hex')
  if (sha256 !== input.expectedSha256) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private artifact mirror source checksum does not match artifact metadata.', 409)
  }

  const metadata = await input.storageAdapter.putObject({
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    body,
    mimeType: input.mimeType,
  })

  if (
    !metadata.exists ||
    metadata.sizeBytes !== input.expectedByteSize ||
    metadata.checksumSha256 !== input.expectedSha256
  ) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private artifact mirror metadata does not match the reviewed artifact.', 409, {
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      expectedByteSize: input.expectedByteSize,
      actualByteSize: metadata.sizeBytes,
      expectedSha256: input.expectedSha256,
      actualSha256: metadata.checksumSha256,
    })
  }

  return {
    storageProvider: 'google_cloud_storage',
    bucketName: metadata.bucketName,
    objectPath: metadata.objectPath,
    mimeType: metadata.mimeType ?? input.mimeType,
    byteSize: metadata.sizeBytes,
    sha256: metadata.checksumSha256,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
  }
}

async function resolvePrivateArtifactDownload(input: {
  localFilePath: string
  byteSize: number
  sha256: string
  mimeType: string
  privateStorageMirror?: PrivateStorageMirror
  storageAdapter?: StorageAdapter
  unavailableMessage: string
  sizeMismatchMessage: string
  checksumMismatchMessage: string
}): Promise<{
  localFilePath?: string
  byteSize: number
  createReadStream: () => Promise<Readable>
}> {
  try {
    const fileStat = await stat(input.localFilePath)
    if (!fileStat.isFile()) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.unavailableMessage, 409)
    }

    if (fileStat.size !== input.byteSize) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.sizeMismatchMessage, 409)
    }

    const sha256 = await hashFileSha256(input.localFilePath)
    if (sha256 !== input.sha256) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.checksumMismatchMessage, 409)
    }

    return {
      localFilePath: input.localFilePath,
      byteSize: fileStat.size,
      createReadStream: async () => createReadStream(input.localFilePath),
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (!input.privateStorageMirror) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.unavailableMessage, 409)
    }
  }

  const mirror = input.privateStorageMirror
  if (
    mirror.publicArtifact ||
    mirror.signedUrl ||
    mirror.storageProvider !== 'google_cloud_storage' ||
    mirror.mimeType !== input.mimeType ||
    mirror.byteSize !== input.byteSize ||
    mirror.sha256 !== input.sha256
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact mirror metadata is not safe for internal download fallback.', 400)
  }

  if (!input.storageAdapter || input.storageAdapter.mode !== 'gcs') {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private storage mirror is present but no GCS storage adapter is available.', 409)
  }

  const metadata = await input.storageAdapter.verifyUploadedObject({
    bucketName: mirror.bucketName,
    objectPath: mirror.objectPath,
    expectedSizeBytes: input.byteSize,
    checksumSha256: input.sha256,
  })
  if (!metadata.exists) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.unavailableMessage, 409)
  }

  if (metadata.sizeBytes !== input.byteSize || mirror.byteSize !== input.byteSize) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.sizeMismatchMessage, 409)
  }

  if (metadata.checksumSha256 !== input.sha256 || mirror.sha256 !== input.sha256) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', input.checksumMismatchMessage, 409)
  }

  return {
    byteSize: metadata.sizeBytes,
    createReadStream: () => input.storageAdapter!.createReadStream(
      mirror.bucketName,
      mirror.objectPath,
      { generation: metadata.generation, etag: metadata.etag },
    ),
  }
}

async function createFinalDeliveryQaReviewFromExecution(
  finalRenderExecution: ApprovedEditExecutionFinalRenderExecution,
  toolWorkManifest: ApprovedToolWorkManifest,
  options: { ffprobeBin?: string } = {},
): Promise<ApprovedEditExecutionFinalDeliveryQaReview> {
  const createdAt = nowIso()
  let localFileExists: boolean
  let byteSizeMatches: boolean
  let checksumMatches: boolean
  let editDecisionManifestArtifactExists: boolean
  let editDecisionManifestArtifactChecksumMatches: boolean
  let editDecisionManifestArtifactContentMatches: boolean
  let editDecisionManifestArtifactSafe: boolean
  let finalArtifactProbe: MediaProbeSummary | undefined
  let finalProbeOperationEvidence: ApprovedToolOperationEvidence | undefined
  try {
    const [fileStat, bytes, manifestFileStat, manifestBytes] = await Promise.all([
      stat(finalRenderExecution.finalRenderArtifact.localFilePath),
      readFile(finalRenderExecution.finalRenderArtifact.localFilePath),
      stat(finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.localFilePath),
      readFile(finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.localFilePath),
    ])
    localFileExists = fileStat.isFile()
    byteSizeMatches = fileStat.size === finalRenderExecution.finalRenderArtifact.byteSize && fileStat.size > 0
    checksumMatches = createHash('sha256').update(bytes).digest('hex') === finalRenderExecution.finalRenderArtifact.sha256
    editDecisionManifestArtifactExists = manifestFileStat.isFile() &&
      manifestFileStat.size === finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.byteSize &&
      manifestFileStat.size > 0
    editDecisionManifestArtifactChecksumMatches = createHash('sha256').update(manifestBytes).digest('hex') ===
      finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.sha256
    const manifestText = manifestBytes.toString('utf8')
    try {
      const parsedManifest = JSON.parse(manifestText)
      editDecisionManifestArtifactContentMatches = JSON.stringify(stableJsonValue(parsedManifest)) ===
        JSON.stringify(stableJsonValue(finalRenderExecution.finalRenderArtifact.editDecisionManifest))
      editDecisionManifestArtifactSafe = !/https?:\/\/|\/tmp\/|localFilePath|api[_-]?key|service[_-]?role|token|secret|password/i.test(manifestText)
    } catch {
      editDecisionManifestArtifactContentMatches = false
      editDecisionManifestArtifactSafe = false
    }
    const probeStartedAt = Date.now()
    finalArtifactProbe = await probeMediaFile(finalRenderExecution.finalRenderArtifact.localFilePath, {
      ffprobeBin: options.ffprobeBin,
    })
    finalProbeOperationEvidence = createApprovedToolOperationEvidence({
      manifest: toolWorkManifest,
      operationKind: 'final_delivery_private_qa_probe',
      operationInstanceId: `${toolWorkManifest.coreOperationIds.final_delivery_private_qa_probe}:artifact:${finalRenderExecution.finalRenderArtifact.artifactId}`,
      workspaceId: finalRenderExecution.workspaceId,
      projectId: finalRenderExecution.projectId,
      creditReservationId: finalRenderExecution.creditReservationId,
      outputArtifactId: finalRenderExecution.finalRenderArtifact.artifactId,
      outputSha256: finalRenderExecution.finalRenderArtifact.sha256,
      outputByteSize: finalRenderExecution.finalRenderArtifact.byteSize,
      elapsedMilliseconds: Date.now() - probeStartedAt,
      mediaProcessingExecuted: false,
      mediaBytesProcessed: false,
      mediaProbe: finalArtifactProbe,
      qaChecks: [
        'ffprobe inspected the checksumed private final-render artifact.',
        'Probe evidence is QA-only and does not authorize public delivery.',
      ],
      completedAt: nowIso(),
    })
  } catch {
    localFileExists = false
    byteSizeMatches = false
    checksumMatches = false
    editDecisionManifestArtifactExists = false
    editDecisionManifestArtifactChecksumMatches = false
    editDecisionManifestArtifactContentMatches = false
    editDecisionManifestArtifactSafe = false
    finalArtifactProbe = undefined
    finalProbeOperationEvidence = undefined
  }
  const toolOperationEvidence = uniqueToolOperationEvidence([
    ...finalRenderExecution.toolOperationEvidence,
    ...(finalProbeOperationEvidence ? [finalProbeOperationEvidence] : []),
  ])
  const professionalEditQaSummary = createProfessionalEditQaSummary(finalRenderExecution.finalRenderArtifact)
  const evidenceMatchesManifest = (evidence: ApprovedToolOperationEvidence): boolean =>
    evidence.manifestRef.manifestId === toolWorkManifest.manifestId &&
    evidence.manifestRef.fingerprintSha256 === toolWorkManifest.fingerprintSha256 &&
    evidence.manifestRef.approvedPlanSnapshotId === toolWorkManifest.approvedPlanSnapshotId &&
    evidence.manifestRef.creditReservationId === toolWorkManifest.creditReservationId &&
    evidence.manifestRef.immutable === true
  const processedArtifactEvidenceComplete = finalRenderExecution.finalRenderArtifact.editDecisionManifest.decisions.every((decision) => {
    const matchingEvidence = toolOperationEvidence.filter((evidence) =>
      evidence.outputArtifactId === decision.processedArtifactId &&
      evidence.outputSha256 === decision.processedArtifact.sha256 &&
      evidence.outputByteSize === decision.processedArtifact.byteSize &&
      evidenceMatchesManifest(evidence))
    const nestedEvidenceIds = new Set(decision.processedArtifact.toolOperationEvidence.map((evidence) => evidence.evidenceId))
    return matchingEvidence.some((evidence) =>
      evidence.operationId === toolWorkManifest.coreOperationIds.source_media_private_process &&
      evidence.toolId === 'ffmpeg' &&
      evidence.mediaProcessingExecuted === true &&
      nestedEvidenceIds.has(evidence.evidenceId)) &&
      matchingEvidence.some((evidence) =>
        evidence.operationId === toolWorkManifest.coreOperationIds.processed_media_private_qa_probe &&
        evidence.toolId === 'ffprobe' &&
        evidence.mediaProcessingExecuted === false &&
        nestedEvidenceIds.has(evidence.evidenceId))
  })
  const finalRenderEvidenceComplete = toolOperationEvidence.some((evidence) =>
    evidence.operationId === toolWorkManifest.coreOperationIds.final_private_render &&
    evidence.outputArtifactId === finalRenderExecution.finalRenderArtifact.artifactId &&
    evidence.outputSha256 === finalRenderExecution.finalRenderArtifact.sha256 &&
    evidence.outputByteSize === finalRenderExecution.finalRenderArtifact.byteSize &&
    evidence.toolId === 'ffmpeg' &&
    evidence.mediaProcessingExecuted === true &&
    evidenceMatchesManifest(evidence))
  const finalProbeEvidenceComplete = toolOperationEvidence.some((evidence) =>
    evidence.operationId === toolWorkManifest.coreOperationIds.final_delivery_private_qa_probe &&
    evidence.outputArtifactId === finalRenderExecution.finalRenderArtifact.artifactId &&
    evidence.outputSha256 === finalRenderExecution.finalRenderArtifact.sha256 &&
    evidence.outputByteSize === finalRenderExecution.finalRenderArtifact.byteSize &&
    evidence.toolId === 'ffprobe' &&
    evidence.mediaProcessingExecuted === false &&
    evidenceMatchesManifest(evidence))
  const requiredBrowserCaptureOperations = toolWorkManifest.operations.filter((operation) =>
    operation.toolId === 'playwright' && operation.disposition === 'executable_private_internal')
  const browserCaptureEvidenceComplete = requiredBrowserCaptureOperations.every((operation) =>
    toolOperationEvidence.some((evidence) =>
      evidence.operationId === operation.operationId &&
      evidence.toolId === 'playwright' &&
      evidence.status === 'actual_private_artifact_work_completed' &&
      evidence.artifactBytesProduced === true &&
      evidence.mediaProcessingExecuted === false &&
      evidence.imageProbe?.mimeType === 'image/png' &&
      evidence.imageProbe.pngSignatureValid === true &&
      evidence.imageProbe.width === 640 &&
      evidence.imageProbe.height === 360 &&
      evidence.imageProbe.networkRequestCount === 0 &&
      evidenceMatchesManifest(evidence))) &&
    finalRenderExecution.finalRenderArtifact.commandSummary.approvedBrowserCaptureOverlayCount === requiredBrowserCaptureOperations.length

  const qaChecks: FinalDeliveryQaCheck[] = [
    {
      check: 'private_final_render_artifact',
      passed: finalRenderExecution.finalRenderArtifact.privateArtifact === true &&
        finalRenderExecution.finalRenderArtifact.finalRenderArtifact === true &&
        finalRenderExecution.finalRenderArtifact.storageProvider === 'local_private',
      message: 'Final artifact is a private local final-render artifact.',
    },
    {
      check: 'local_file_exists',
      passed: localFileExists && byteSizeMatches,
      message: 'Final artifact exists as a local private file and byte size matches metadata.',
    },
    {
      check: 'checksum_matches',
      passed: checksumMatches,
      message: 'Final artifact checksum matches metadata.',
    },
    {
      check: 'final_render_not_source_passthrough',
      passed: finalRenderArtifactDiffersFromSourceArtifacts(finalRenderExecution.finalRenderArtifact),
      message: 'Final artifact checksum differs from every uploaded source and processed clip artifact checksum.',
    },
    {
      check: 'video_stream_present',
      passed: finalArtifactProbe?.hasVideo === true,
      message: 'Final artifact contains a playable video stream.',
    },
    {
      check: 'audio_stream_present',
      passed: finalArtifactProbe?.hasAudio === true,
      message: 'Final artifact contains an audio stream for private review playback.',
    },
    {
      check: 'final_frame_dimensions_present',
      passed: Number.isFinite(finalArtifactProbe?.width) &&
        Number.isFinite(finalArtifactProbe?.height) &&
        (finalArtifactProbe?.width ?? 0) > 0 &&
        (finalArtifactProbe?.height ?? 0) > 0,
      message: 'Final artifact includes valid video frame dimensions.',
    },
    {
      check: 'duration_present',
      passed: Number.isFinite(finalArtifactProbe?.durationSeconds) && (finalArtifactProbe?.durationSeconds ?? 0) > 0,
      message: 'Final artifact includes positive duration metadata.',
    },
    {
      check: 'no_signed_url',
      passed: finalRenderExecution.finalRenderArtifact.signedUrl === null &&
        !/^https?:\/\//i.test(finalRenderExecution.finalRenderArtifact.storageObjectPath) &&
        !/^https?:\/\//i.test(finalRenderExecution.finalRenderArtifact.localFilePath),
      message: 'Final artifact does not expose signed URLs or public URL paths.',
    },
    {
      check: 'no_public_artifact',
      passed: finalRenderExecution.finalRenderArtifact.publicArtifact === false,
      message: 'Final artifact is not marked public.',
    },
    {
      check: 'delivery_scope_private_internal',
      passed: finalRenderExecution.finalRenderArtifact.deliveryQaRequired === true &&
        finalRenderExecution.finalRenderArtifact.finalDeliveryEligible === false,
      message: 'Final artifact is approved only for private internal download/testing until release gates pass.',
    },
    {
      check: 'approved_review_overlays_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.reviewOverlayCount > 0,
      message: 'Final artifact includes approved private review overlays from segment metadata.',
    },
    {
      check: 'approved_caption_overlays_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.approvedCaptionOverlayCount > 0,
      message: 'Final artifact includes approved caption timing overlays.',
    },
    {
      check: 'private_caption_package_attached',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.privateCaptionArtifactCount > 0 &&
        finalRenderExecution.finalRenderArtifact.commandSummary.privateCaptionSource === 'approved_caption_timing_private_caption_files',
      message: 'Final artifact handoff includes private SRT/WebVTT/ASS caption files sourced from approved caption timing.',
    },
    {
      check: 'approved_transition_polish_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.inputCount <= 1 ||
        finalRenderExecution.finalRenderArtifact.commandSummary.approvedTransitionPolishCount > 0,
      message: finalRenderExecution.finalRenderArtifact.commandSummary.inputCount <= 1
        ? 'Final artifact is a single-clip edit, so no transition polish is required.'
        : 'Final artifact includes approved transition timing polish.',
    },
    {
      check: 'approved_visual_polish_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.approvedVisualPolishCount > 0 &&
        finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.applied === true &&
        finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.toolId === 'ffmpeg',
      message: 'Final artifact includes approved FFmpeg-native visual polish from the color plan.',
    },
    {
      check: 'approved_browser_capture_overlay_trace',
      passed: browserCaptureEvidenceComplete &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.browserCaptureOverlays ===
          finalRenderExecution.finalRenderArtifact.commandSummary.approvedBrowserCaptureOverlayCount,
      message: requiredBrowserCaptureOperations.length > 0
        ? 'Final artifact visibly composes each explicitly approved fixed-template private Playwright capture with zero-network evidence.'
        : 'No Playwright capture was authorized, so the final artifact correctly carries no browser-capture overlay.',
    },
    {
      check: 'approved_final_timing_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.approvedFinalTimingCount > 0 &&
        finalRenderExecution.finalRenderArtifact.commandSummary.approvedFinalTimelineDurationSeconds > 0,
      message: 'Final artifact includes approved final timing ranges.',
    },
    {
      check: 'voice_first_audio_polish_present',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish.applied === true &&
        finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish.source === 'private_final_render_voice_first_loudness',
      message: 'Final artifact includes voice-first loudness normalization and limiting.',
    },
    {
      check: 'professional_edit_decision_manifest_present',
      passed: finalRenderExecution.finalRenderArtifact.editDecisionManifest.manifestVersion === 'private-internal-edit-decision-manifest-v1' &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.clipDecisionCount === finalRenderExecution.finalRenderArtifact.commandSummary.inputCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.reviewOverlays === finalRenderExecution.finalRenderArtifact.commandSummary.reviewOverlayCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.captionOverlays === finalRenderExecution.finalRenderArtifact.commandSummary.approvedCaptionOverlayCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.transitionPolish === finalRenderExecution.finalRenderArtifact.commandSummary.approvedTransitionPolishCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.visualPolish === finalRenderExecution.finalRenderArtifact.commandSummary.approvedVisualPolishCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.browserCaptureOverlays === finalRenderExecution.finalRenderArtifact.commandSummary.approvedBrowserCaptureOverlayCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.finalTiming === finalRenderExecution.finalRenderArtifact.commandSummary.approvedFinalTimingCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.professionalLayerCounts.audioQa === finalRenderExecution.finalRenderArtifact.editDecisionManifest.audioQaIntegration.reviewCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.source === 'approved_plan_snapshot' &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.projectId === finalRenderExecution.projectId &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.editSessionId.trim().length > 0 &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.goalSummary.trim().length > 0 &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.professionalBaseline === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.aspectRatioConfirmed === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.sourceOrderConfirmed === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.cleanupPreferenceConfirmed === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.timingBaseConfirmed === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedEditContext.creditEstimateTotalCredits > 0 &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.blockedRuntimeScopes.signedUrlCreated === false &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.blockedRuntimeScopes.publicArtifactCreated === false,
      message: 'Final artifact carries a private edit decision manifest tying the MP4 to approved edit context, source, timing, caption, polish, and privacy decisions.',
    },
    {
      check: 'uploaded_source_order_trace_present',
      passed: finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.source === 'uploaded_media_source_order' &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.sourceOrderPreserved === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.sourceMediaCoverageComplete === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.sourceMediaAssetIds.length === finalRenderExecution.finalRenderArtifact.editDecisionManifest.clipDecisionCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.uploadedOrders.length === finalRenderExecution.finalRenderArtifact.editDecisionManifest.clipDecisionCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.uniqueSourceMediaAssetCount === finalRenderExecution.finalRenderArtifact.editDecisionManifest.sourceMediaAssetCount &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.uniqueUploadedOrderCount === finalRenderExecution.finalRenderArtifact.editDecisionManifest.sourceMediaAssetCount &&
        sourceChecksumTraceMatchesDecisions(finalRenderExecution.finalRenderArtifact.editDecisionManifest) &&
        sourceStorageIdentityTraceMatchesDecisions(finalRenderExecution.finalRenderArtifact.editDecisionManifest),
      message: 'Final artifact carries a private source-order, checksum, and storage identity trace proving the review MP4 remains bound to uploaded media order and source identity.',
    },
    {
      check: 'professional_edit_decision_timeline_trace_present',
      passed: decisionTimelineTraceMatchesFinalRender(
        finalRenderExecution.finalRenderArtifact.editDecisionManifest,
        finalRenderExecution.finalRenderArtifact.durationSeconds,
      ),
      message: 'Final artifact carries per-decision final-render timeline ranges that line up with the review MP4 duration.',
    },
    {
      check: 'professional_edit_decision_manifest_artifact_present',
      passed: editDecisionManifestArtifactExists &&
        editDecisionManifestArtifactChecksumMatches &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.privateArtifact === true &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.publicArtifact === false &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.signedUrl === null &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.manifestVersion === 'private-internal-edit-decision-manifest-v1' &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact.finalRenderArtifactId === finalRenderExecution.finalRenderArtifact.artifactId,
      message: 'Final artifact has a checksumed private JSON edit decision manifest artifact beside the MP4.',
    },
    {
      check: 'professional_edit_decision_manifest_artifact_content_matches',
      passed: editDecisionManifestArtifactContentMatches && editDecisionManifestArtifactSafe,
      message: 'Final artifact manifest sidecar parses as the approved edit decision manifest and contains no public URLs, local file paths, or secret-like fields.',
    },
    {
      check: 'approved_tool_work_manifest_present',
      passed: toolWorkManifest.status !== 'blocked_structural_inconsistency' &&
        finalRenderExecution.toolWorkManifestRef.manifestId === toolWorkManifest.manifestId &&
        finalRenderExecution.toolWorkManifestRef.fingerprintSha256 === toolWorkManifest.fingerprintSha256 &&
        finalRenderExecution.toolWorkManifestRef.creditReservationId === toolWorkManifest.creditReservationId &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedToolWorkManifest.manifestId === toolWorkManifest.manifestId &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedToolWorkManifest.fingerprintSha256 === toolWorkManifest.fingerprintSha256 &&
        finalRenderExecution.finalRenderArtifact.editDecisionManifest.approvedToolWorkManifest.creditReservationId === toolWorkManifest.creditReservationId,
      message: 'Final delivery remains bound to the immutable server-owned approved tool-work manifest.',
    },
    {
      check: 'approved_tool_operation_evidence_present',
      passed: processedArtifactEvidenceComplete &&
        finalRenderEvidenceComplete &&
        finalProbeEvidenceComplete &&
        browserCaptureEvidenceComplete &&
        toolOperationEvidence.every(evidenceMatchesManifest) &&
        toolOperationEvidence.every((evidence) =>
          evidence.costEvidence.billableToUser === false &&
          evidence.costEvidence.serviceFeeIncluded === false &&
          evidence.costEvidence.walletMutationExecuted === false &&
          evidence.costEvidence.settlementExecuted === false),
      message: 'Final delivery carries truthful FFmpeg processing and ffprobe QA evidence with nonbillable internal tool-cost records.',
    },
    {
      check: 'full_color_pipeline_not_claimed',
      passed: finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.fullColorPipelineExecuted === false,
      message: 'Final artifact does not claim full OpenColorIO/OpenImageIO color pipeline execution.',
    },
  ]
  const finalArtifactQaPassed = qaChecks.every((check) => check.passed)
  const releaseReadiness = evaluateApprovedEditExecutionReleaseReadiness({
    privateInternalReady: finalArtifactQaPassed,
  })

  return {
    id: createMockId('final_delivery_qa_review'),
    finalRenderExecutionId: finalRenderExecution.id,
    finalRenderReadinessReviewId: finalRenderExecution.finalRenderReadinessReviewId,
    userPreviewReviewId: finalRenderExecution.userPreviewReviewId,
    renderPreviewAssemblyId: finalRenderExecution.renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: finalRenderExecution.privateMediaArtifactQaReviewId,
    localMediaProcessingExecutionId: finalRenderExecution.localMediaProcessingExecutionId,
    privateWorkerArtifactQaReviewId: finalRenderExecution.privateWorkerArtifactQaReviewId,
    uploadedMediaWorkerExecutionId: finalRenderExecution.uploadedMediaWorkerExecutionId,
    workflowRehearsalId: finalRenderExecution.workflowRehearsalId,
    localWorkerOutputId: finalRenderExecution.localWorkerOutputId,
    localWorkerOutputQaReviewId: finalRenderExecution.localWorkerOutputQaReviewId,
    resultReconciliationId: finalRenderExecution.resultReconciliationId,
    handlerDryRunId: finalRenderExecution.handlerDryRunId,
    packageRecordId: finalRenderExecution.packageRecordId,
    workspaceId: finalRenderExecution.workspaceId,
    projectId: finalRenderExecution.projectId,
    approvedPlanSnapshotId: finalRenderExecution.approvedPlanSnapshotId,
    creditReservationId: finalRenderExecution.creditReservationId,
    status: finalArtifactQaPassed
      ? 'final_delivery_qa_passed_ready_for_private_internal_download'
      : 'final_delivery_qa_blocked',
    qaReviewOnly: true,
    finalArtifactQaPassed,
    privateInternalDownloadReady: finalArtifactQaPassed,
    publicDeliveryReady: releaseReadiness.publicDeliveryReady,
    externalBetaReady: releaseReadiness.externalBetaReady,
    productionReady: releaseReadiness.productionReady,
    finalExportReady: finalArtifactQaPassed,
    finalRenderArtifactCount: 1,
    mediaArtifactCount: finalRenderExecution.mediaArtifactCount,
    finalArtifactProbe,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: finalProbeOperationEvidence ? 1 : 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    renderPreviewReady: true,
    finalRenderReady: true,
    toolWorkManifestRef: approvedToolWorkManifestRef(toolWorkManifest),
    toolOperationEvidence,
    qaChecks,
    professionalEditQaSummary: {
      ...professionalEditQaSummary,
      privateInternalQaReady: finalArtifactQaPassed,
    },
    finalRenderArtifact: finalRenderExecution.finalRenderArtifact,
    nextRequiredGate: finalArtifactQaPassed ? 'private_internal_download_delivery' : 'final_delivery_fix',
    userFacingSummary: finalArtifactQaPassed
      ? 'The final video passed private delivery QA and is ready for internal testing download.'
      : 'The final video failed delivery QA and must be fixed before testing download.',
    backendHandoffSummary: [
      finalArtifactQaPassed
        ? 'The private final-render artifact passed local file, checksum, stream, dimension, duration, privacy, and private-internal delivery QA.'
        : 'The private final-render artifact failed one or more delivery QA checks.',
      'This gate does not create signed URLs, public artifacts, Supabase/GCS delivery records, external beta access, production release, or billing mutations.',
    ].join(' '),
    blockers: finalArtifactQaPassed
      ? [
          'Private internal download delivery must be created before the final file can be streamed.',
          'Public delivery and signed URLs remain blocked.',
          'External beta and production require approved release evidence gates.',
        ]
      : [
          'Final delivery QA failed one or more checks.',
          'Private internal download delivery remains blocked until final artifact QA passes.',
        ],
    noRuntimeSideEffects: [
      'Final delivery QA inspected an existing private local final-render artifact only.',
      'No media processing command, worker handler, provider call, Supabase/GCS write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createPrivateInternalDownloadDeliveryFromFinalDeliveryQa(
  finalDeliveryQaReview: ApprovedEditExecutionFinalDeliveryQaReview,
  options: { createdByUserId: string },
): ApprovedEditExecutionPrivateInternalDownloadDelivery {
  const id = createMockId('private_internal_download_delivery')
  const createdAt = nowIso()
  const releaseReadiness = evaluateApprovedEditExecutionReleaseReadiness({
    privateInternalReady: true,
  })

  return {
    id,
    createdByUserId: options.createdByUserId,
    finalDeliveryQaReviewId: finalDeliveryQaReview.id,
    finalRenderExecutionId: finalDeliveryQaReview.finalRenderExecutionId,
    finalRenderReadinessReviewId: finalDeliveryQaReview.finalRenderReadinessReviewId,
    userPreviewReviewId: finalDeliveryQaReview.userPreviewReviewId,
    renderPreviewAssemblyId: finalDeliveryQaReview.renderPreviewAssemblyId,
    workspaceId: finalDeliveryQaReview.workspaceId,
    projectId: finalDeliveryQaReview.projectId,
    approvedPlanSnapshotId: finalDeliveryQaReview.approvedPlanSnapshotId,
    creditReservationId: finalDeliveryQaReview.creditReservationId,
    status: 'private_internal_download_delivery_ready',
    deliveryOnly: true,
    privateInternalDownloadReady: true,
    publicDeliveryReady: releaseReadiness.publicDeliveryReady,
    externalBetaReady: releaseReadiness.externalBetaReady,
    productionReady: releaseReadiness.productionReady,
    finalExportReady: true,
    internalDownloadPath: `/v1/edit-executions/private-internal-downloads/${id}/file`,
    internalManifestPath: `/v1/edit-executions/private-internal-downloads/${id}/manifest`,
    professionalEditQaSummary: finalDeliveryQaReview.professionalEditQaSummary,
    toolWorkManifestRef: finalDeliveryQaReview.toolWorkManifestRef,
    toolOperationEvidence: finalDeliveryQaReview.toolOperationEvidence,
    finalRenderArtifact: finalDeliveryQaReview.finalRenderArtifact,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    nextRequiredGate: 'external_beta_or_production_release_gates',
    userFacingSummary: 'The final video is ready for authenticated private internal download/testing.',
    backendHandoffSummary: [
      'The private final-render artifact can now be streamed through an authenticated local file route for internal testing.',
      'This gate persists a private internal delivery registry record for authenticated readback but does not create signed URLs, public artifacts, Supabase delivery records, external beta access, production release, or billing mutations.',
    ].join(' '),
    blockers: [
      'Public delivery and signed URLs remain blocked.',
      'External beta and production release require approved launch evidence gates.',
      'Production storage ACLs and external delivery readback are not enabled by this internal-testing gate.',
    ],
    noRuntimeSideEffects: [
      'Private internal download delivery prepared an authenticated local file route plus a private registry record for restart-safe internal readback.',
      'No media processing command, worker handler, provider call, Supabase delivery write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
    createdAt,
    mockOnly: true,
  }
}

function createProfessionalEditQaSummary(finalRenderArtifact: PrivateFinalRenderArtifact): ProfessionalEditQaSummary {
  const commandSummary = finalRenderArtifact.commandSummary
  return {
    source: 'final_render_command_summary',
    approvedReviewOverlayCount: commandSummary.reviewOverlayCount,
    approvedCaptionOverlayCount: commandSummary.approvedCaptionOverlayCount,
    privateCaptionArtifactCount: commandSummary.privateCaptionArtifactCount,
    privateCaptionFormats: commandSummary.privateCaptionFormats,
    approvedTransitionPolishCount: commandSummary.approvedTransitionPolishCount,
    approvedVisualPolishCount: commandSummary.approvedVisualPolishCount,
    approvedBrowserCaptureOverlayCount: commandSummary.approvedBrowserCaptureOverlayCount,
    approvedFinalTimingCount: commandSummary.approvedFinalTimingCount,
    approvedFinalTimelineDurationSeconds: commandSummary.approvedFinalTimelineDurationSeconds,
    audioPolishApplied: commandSummary.audioPolish.applied,
    visualPolishApplied: commandSummary.visualPolish.applied,
    visualPolishToolId: commandSummary.visualPolish.applied ? commandSummary.visualPolish.toolId : 'none',
    fullColorPipelineExecuted: false,
    editDecisionManifestReady: finalRenderArtifact.editDecisionManifest.manifestVersion === 'private-internal-edit-decision-manifest-v1',
    editDecisionManifestArtifactReady: finalRenderArtifact.editDecisionManifestArtifact.manifestVersion === 'private-internal-edit-decision-manifest-v1',
    privateInternalQaReady: false,
  }
}

async function persistProfessionalEditDecisionManifestArtifact(input: {
  manifest: ProfessionalEditDecisionManifest
  finalRenderArtifactId: string
  localStorageRoot: string
  relativeDirectoryPath: string
  storageAdapter?: StorageAdapter
  qaArtifactBucketName?: string
}): Promise<ProfessionalEditDecisionManifestArtifact> {
  const artifactId = `${safePathPart(input.finalRenderArtifactId)}-edit-decision-manifest`
  const relativeObjectPath = join(
    input.relativeDirectoryPath,
    `${artifactId}.json`,
  )
  const localFilePath = resolvePathInsideRoot(input.localStorageRoot, relativeObjectPath)
  const content = `${JSON.stringify(stableJsonValue(input.manifest), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content,
  })
  const byteSize = Buffer.byteLength(content)
  const sha256 = createHash('sha256').update(content).digest('hex')
  const privateStorageMirror = await mirrorPrivateArtifactToStorage({
    storageAdapter: input.storageAdapter,
    bucketName: input.qaArtifactBucketName,
    objectPath: relativeObjectPath.split('/').join('/'),
    localFilePath,
    mimeType: 'application/json',
    expectedByteSize: byteSize,
    expectedSha256: sha256,
  })

  return {
    artifactId,
    storageProvider: 'local_private',
    storageObjectPath: relativeObjectPath.split('/').join('/'),
    localFilePath,
    ...(privateStorageMirror ? { privateStorageMirror } : {}),
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'final_render_execution_edit_decision_manifest',
    sha256,
    byteSize,
    manifestVersion: input.manifest.manifestVersion,
    finalRenderArtifactId: input.finalRenderArtifactId,
    safeForPrivateReview: true,
    finalDeliveryEligible: false,
  }
}

function createProfessionalEditDecisionManifest(input: {
  approvedPlanSnapshotId: string
  approvedSnapshot?: ApprovedPlanSnapshot
  creditReservationId: string
  renderPreviewAssemblyId: string
  finalRenderArtifactId: string
  toolWorkManifest: ApprovedToolWorkManifest
  toolOperationEvidence: ApprovedToolOperationEvidence[]
  previewClips: RenderPreviewAssemblyClipRef[]
  captionExecutionPackage?: PrivateCaptionExecutionPackage
  adapterQaIntegration?: RenderPreviewAdapterQaIntegration
  commandSummary: PrivateFinalRenderArtifact['commandSummary']
}): ProfessionalEditDecisionManifest {
  const uploadedSourceOrderTrace = createUploadedSourceOrderTrace(input.previewClips)
  const releaseReadiness = evaluateApprovedEditExecutionReleaseReadiness()

  return {
    manifestVersion: 'private-internal-edit-decision-manifest-v1',
    source: 'approved_snapshot_private_render_execution',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedToolWorkManifest: {
      ...approvedToolWorkManifestRef(input.toolWorkManifest),
      status: input.toolWorkManifest.status,
      executableOperationCount: input.toolWorkManifest.reconciliation.executableOperationCount,
      degradedOperationCount: input.toolWorkManifest.reconciliation.degradedOperationCount,
      blockedOperationCount: input.toolWorkManifest.reconciliation.blockedOperationCount,
    },
    toolOperationEvidence: uniqueToolOperationEvidence(input.toolOperationEvidence),
    approvedEditContext: createApprovedEditContext(input.approvedPlanSnapshotId, input.approvedSnapshot),
    creditReservationId: input.creditReservationId,
    renderPreviewAssemblyId: input.renderPreviewAssemblyId,
    finalRenderArtifactId: input.finalRenderArtifactId,
    clipDecisionCount: input.previewClips.length,
    sourceMediaAssetCount: new Set(input.previewClips.map((clip) => clip.sourceMediaAssetId)).size,
    uploadedSourceOrderTrace,
    privateCaptionPackage: {
      attached: (input.captionExecutionPackage?.captionArtifactCount ?? 0) > 0,
      source: input.captionExecutionPackage?.source ?? 'none',
      artifactCount: input.captionExecutionPackage?.captionArtifactCount ?? 0,
      formats: input.captionExecutionPackage?.captionFormats ?? [],
    },
    audioQaIntegration: createProfessionalEditAudioQaIntegration(input.previewClips),
    adapterQaIntegration: createProfessionalEditAdapterQaIntegration(input.adapterQaIntegration),
    professionalLayerCounts: {
      reviewOverlays: input.commandSummary.reviewOverlayCount,
      captionOverlays: input.commandSummary.approvedCaptionOverlayCount,
      transitionPolish: input.commandSummary.approvedTransitionPolishCount,
      visualPolish: input.commandSummary.approvedVisualPolishCount,
      browserCaptureOverlays: input.commandSummary.approvedBrowserCaptureOverlayCount,
      finalTiming: input.commandSummary.approvedFinalTimingCount,
      audioQa: input.previewClips.filter((clip) => Boolean(clip.audioExecutionReview)).length,
      audioPolish: input.commandSummary.audioPolish.applied ? 1 : 0,
    },
    decisions: createProfessionalEditDecisionEntries(input.previewClips),
    gateState: {
      privateInternalReview: 'requires_delivery_qa',
      publicDeliveryReady: releaseReadiness.publicDeliveryReady,
      externalBetaReady: releaseReadiness.externalBetaReady,
      productionReady: releaseReadiness.productionReady,
    },
    blockedRuntimeScopes: {
      publicArtifactCreated: false,
      signedUrlCreated: false,
      supabaseOrGcsWrite: false,
      externalBetaEnabled: false,
      productionEnabled: false,
      billingMutation: false,
    },
  }
}

function createProfessionalEditAudioQaIntegration(
  previewClips: RenderPreviewAssemblyClipRef[],
): ProfessionalEditDecisionManifest['audioQaIntegration'] {
  const reviews = previewClips
    .map((clip) => clip.audioExecutionReview)
    .filter((review): review is PrivateAudioExecutionReview => Boolean(review))
  if (reviews.length < 1) {
    return {
      attached: false,
      source: 'none',
      reviewCount: 0,
      qaGateCount: 0,
      blockingQaGateCount: 0,
      warningQaGateCount: 0,
      warningsCount: 0,
      cleanedAudioArtifactReadyCount: 0,
      soundSyncArtifactReadyCount: 0,
      blocksPreview: false,
      blocksFinalExport: false,
      finalMuxAllowed: false,
      productRuntimeExecuted: false,
      publicArtifact: false,
      signedUrl: null,
    }
  }

  return {
    attached: true,
    source: 'private_uploaded_audio_execution',
    reviewCount: reviews.length,
    qaGateCount: reviews.reduce((sum, review) => sum + review.qaGateCount, 0),
    blockingQaGateCount: reviews.reduce((sum, review) => sum + review.blockingQaGateCount, 0),
    warningQaGateCount: reviews.reduce((sum, review) => sum + review.warningQaGateCount, 0),
    warningsCount: reviews.reduce((sum, review) => sum + review.warningCount, 0),
    cleanedAudioArtifactReadyCount: reviews.filter((review) => review.cleanedAudioArtifactReady).length,
    soundSyncArtifactReadyCount: reviews.filter((review) => review.soundSyncArtifactReady).length,
    blocksPreview: reviews.some((review) => review.blocksPreview),
    blocksFinalExport: reviews.some((review) => review.blocksFinalExport),
    finalMuxAllowed: false,
    productRuntimeExecuted: false,
    publicArtifact: false,
    signedUrl: null,
  }
}

function createProfessionalEditDecisionEntries(
  previewClips: RenderPreviewAssemblyClipRef[],
): ProfessionalEditDecisionManifest['decisions'] {
  let timelineCursorSeconds = 0
  return previewClips.map((clip, index) => {
    const timelineStartSeconds = roundSeconds(timelineCursorSeconds)
    const timelineDurationSeconds = roundSeconds(clip.approvedFinalTiming?.durationSeconds ?? clip.durationSeconds)
    const timelineEndSeconds = roundSeconds(timelineStartSeconds + timelineDurationSeconds)
    timelineCursorSeconds = timelineEndSeconds

    return {
      clipRefId: clip.clipRefId,
      processedArtifactId: clip.processedArtifactId,
      processedArtifact: {
        storageProvider: 'local_private',
        storageObjectPath: clip.storageObjectPath,
        mimeType: 'video/mp4',
        sha256: clip.sha256,
        byteSize: clip.byteSize,
        durationSeconds: clip.durationSeconds,
        processingMode: clip.processingMode,
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
        toolOperationEvidence: clip.toolOperationEvidence,
      },
      sourceMediaAssetId: clip.sourceMediaAssetId,
      sourceChecksumSha256: clip.sourceChecksumSha256 ?? null,
      sourceStorageProvider: clip.sourceStorageProvider,
      sourceStorageBucket: clip.sourceStorageBucket ?? null,
      sourceStoragePath: clip.sourceStoragePath,
      sourceFileName: clip.sourceFileName,
      sourceMimeType: clip.sourceMimeType,
      sourceByteSize: clip.sourceByteSize,
      uploadedOrder: clip.uploadedOrder,
      segment: {
        id: clip.segmentId ?? null,
        order: clip.segmentOrder ?? null,
        label: clip.segmentLabel ?? null,
      },
      approvedSourceRange: {
        source: clip.approvedSourceRange.source,
        clipId: clip.approvedSourceRange.clipId ?? null,
        sourceSequenceItemId: clip.approvedSourceRange.sourceSequenceItemId ?? null,
        startSeconds: clip.approvedSourceRange.startSeconds,
        durationSeconds: clip.approvedSourceRange.durationSeconds,
        endSeconds: clip.approvedSourceRange.endSeconds,
        requestedMaxDurationSeconds: clip.approvedSourceRange.requestedMaxDurationSeconds,
      },
      finalRenderTimeline: {
        source: 'final_render_execution_sequence',
        sequenceIndex: index + 1,
        startSeconds: timelineStartSeconds,
        durationSeconds: timelineDurationSeconds,
        endSeconds: timelineEndSeconds,
      },
      reviewOverlay: {
        present: Boolean(clip.approvedReviewOverlay),
        hasTitle: Boolean(clip.approvedReviewOverlay?.title),
        hasSubtitle: Boolean(clip.approvedReviewOverlay?.subtitle),
        source: clip.approvedReviewOverlay?.source ?? 'none',
      },
      captionOverlay: {
        present: Boolean(clip.approvedCaptionOverlay),
        captionTimingItemId: clip.approvedCaptionOverlay?.captionTimingItemId ?? null,
        textPresent: Boolean(clip.approvedCaptionOverlay?.text),
        textCharacterCount: clip.approvedCaptionOverlay?.text.length ?? 0,
        source: clip.approvedCaptionOverlay?.source ?? 'none',
      },
      transitionPolish: {
        present: Boolean(clip.approvedTransitionPolish),
        transitionTimingItemIds: clip.approvedTransitionPolish?.transitionTimingItemIds ?? [],
        fadeInSeconds: clip.approvedTransitionPolish?.fadeInSeconds ?? null,
        fadeOutSeconds: clip.approvedTransitionPolish?.fadeOutSeconds ?? null,
        source: clip.approvedTransitionPolish?.source ?? 'none',
      },
      visualPolish: {
        present: Boolean(clip.approvedVisualPolish),
        colorPipelinePlanId: clip.approvedVisualPolish?.colorPipelinePlanId ?? null,
        colorGradeStyle: clip.approvedVisualPolish?.colorGradeStyle ?? null,
        intensity: clip.approvedVisualPolish?.intensity ?? null,
        operationCount: clip.approvedVisualPolish?.operationIds.length ?? 0,
        source: clip.approvedVisualPolish?.source ?? 'none',
        fullColorPipelineExecuted: false,
      },
      browserCaptureOverlay: {
        present: Boolean(clip.approvedBrowserCapture),
        artifactId: clip.approvedBrowserCapture?.artifactId ?? null,
        operationId: clip.approvedBrowserCapture?.operationId ?? null,
        sha256: clip.approvedBrowserCapture?.sha256 ?? null,
        rendererLayerIds: clip.approvedBrowserCapture?.rendererLayerIds ?? [],
        source: clip.approvedBrowserCapture?.source ?? 'none',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      },
      finalTiming: {
        present: Boolean(clip.approvedFinalTiming),
        finalTimingItemId: clip.approvedFinalTiming?.finalTimingItemId ?? null,
        startSeconds: clip.approvedFinalTiming?.startSeconds ?? null,
        durationSeconds: clip.approvedFinalTiming?.durationSeconds ?? null,
        endSeconds: clip.approvedFinalTiming?.endSeconds ?? null,
        fps: clip.approvedFinalTiming?.fps ?? null,
        source: clip.approvedFinalTiming?.source ?? 'none',
      },
      audioExecutionReview: createProfessionalEditDecisionAudioExecutionReview(clip.audioExecutionReview),
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
    }
  })
}

function createProfessionalEditDecisionAudioExecutionReview(
  review: PrivateAudioExecutionReview | undefined,
): ProfessionalEditDecisionManifest['decisions'][number]['audioExecutionReview'] {
  if (!review) {
    return {
      attached: false,
      id: null,
      status: null,
      loudnessStatus: null,
      normalizationStatus: null,
      artifactCount: 0,
      qaGateCount: 0,
      blockingQaGateCount: 0,
      warningQaGateCount: 0,
      blocksPreview: false,
      blocksFinalExport: false,
      finalMuxAllowed: false,
      productRuntimeExecuted: false,
      publicArtifact: false,
      signedUrl: null,
    }
  }

  return {
    attached: true,
    id: review.id,
    status: review.status,
    loudnessStatus: review.loudnessStatus,
    normalizationStatus: review.normalizationStatus,
    artifactCount: review.artifactCount,
    qaGateCount: review.qaGateCount,
    blockingQaGateCount: review.blockingQaGateCount,
    warningQaGateCount: review.warningQaGateCount,
    blocksPreview: review.blocksPreview,
    blocksFinalExport: review.blocksFinalExport,
    finalMuxAllowed: false,
    productRuntimeExecuted: false,
    publicArtifact: false,
    signedUrl: null,
  }
}

function createProfessionalEditAdapterQaIntegration(
  adapterQaIntegration: RenderPreviewAdapterQaIntegration | undefined,
): ProfessionalEditDecisionManifest['adapterQaIntegration'] {
  if (!adapterQaIntegration) {
    return {
      attached: false,
      adapterWorkerArtifactIntegrationId: null,
      privateMediaRunnerQaReviewId: null,
      renderIntegrationManifestArtifactId: null,
      reviewedActivityCount: 0,
      passedActivityCount: 0,
      artifactCount: 0,
      renderPreviewIntegrationReady: false,
      finalRenderDecisionManifestEligible: false,
      mediaProcessingExecuted: false,
      mediaTransformOutputEligible: false,
      productRuntimeExecuted: false,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      artifacts: [],
    }
  }

  return {
    attached: true,
    adapterWorkerArtifactIntegrationId: adapterQaIntegration.adapterWorkerArtifactIntegrationId,
    privateMediaRunnerQaReviewId: adapterQaIntegration.privateMediaRunnerQaReviewId,
    renderIntegrationManifestArtifactId: adapterQaIntegration.renderIntegrationManifestArtifactId,
    reviewedActivityCount: adapterQaIntegration.reviewedActivityCount,
    passedActivityCount: adapterQaIntegration.passedActivityCount,
    artifactCount: adapterQaIntegration.artifactCount,
    renderPreviewIntegrationReady: adapterQaIntegration.renderPreviewIntegrationReady,
    finalRenderDecisionManifestEligible: adapterQaIntegration.finalRenderDecisionManifestEligible,
    mediaProcessingExecuted: false,
    mediaTransformOutputEligible: false,
    productRuntimeExecuted: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    artifacts: adapterQaIntegration.artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      canonicalToolId: artifact.canonicalToolId,
      storageObjectPath: artifact.storageObjectPath,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
    })),
  }
}

function createApprovedEditContext(
  approvedPlanSnapshotId: string,
  approvedSnapshot?: ApprovedPlanSnapshot,
): ProfessionalEditDecisionManifest['approvedEditContext'] {
  const resolvedSettings = approvedSnapshot?.compiledIntent?.resolvedSettings
  const settingsSnapshot = unknownRecord(approvedSnapshot?.settingsSnapshot)
  const sourcePlan = unknownRecord(approvedSnapshot?.sourcePlan)
  const goalSummary = sanitizePrivateReviewCopy(typeof sourcePlan?.goalSummary === 'string' ? sourcePlan.goalSummary : undefined) ??
    sanitizePrivateReviewCopy(approvedSnapshot?.compiledIntent?.goalSummary) ??
    `Approved edit plan ${safePathPart(approvedPlanSnapshotId)}`
  const editLevel = resolvedSettings?.editLevel ??
    (typeof settingsSnapshot?.edit_level === 'string' ? settingsSnapshot.edit_level : null)
  const editingCategory = resolvedSettings?.editingCategory ??
    (typeof settingsSnapshot?.editing_category === 'string' ? settingsSnapshot.editing_category : null)
  const workflowType = typeof sourcePlan?.workflowType === 'string'
    ? sanitizePrivateReviewCopy(sourcePlan.workflowType)
    : null
  const moodStyle = resolvedSettings?.moodStyle ??
    (typeof settingsSnapshot?.mood_style === 'string' ? settingsSnapshot.mood_style : null)
  const aspectRatio = resolvedSettings?.aspectRatio ??
    (typeof settingsSnapshot?.aspect_ratio === 'string' ? settingsSnapshot.aspect_ratio : null)
  const creditEstimateTotalCredits = numberFromUnknown(approvedSnapshot?.creditEstimate?.total_credits) ??
    numberFromUnknown(unknownRecord(approvedSnapshot?.creditEstimateDomain)?.total) ??
    0

  return {
    source: 'approved_plan_snapshot',
    projectId: approvedSnapshot?.projectId ?? '',
    editSessionId: approvedSnapshot?.editSessionId ?? '',
    editPlanVersionId: approvedSnapshot?.editPlanVersionId ?? '',
    creditEstimateId: approvedSnapshot?.creditEstimateId ?? '',
    approvedAt: approvedSnapshot?.approvedAt ?? null,
    approvedBy: sanitizePrivateReviewCopy(approvedSnapshot?.approvedBy) ?? null,
    goalSummary,
    editLevel: sanitizePrivateReviewCopy(editLevel ?? undefined) ?? null,
    editingCategory: sanitizePrivateReviewCopy(editingCategory ?? undefined) ?? null,
    workflowType: workflowType ?? null,
    moodStyle: sanitizePrivateReviewCopy(moodStyle ?? undefined) ?? null,
    aspectRatio: sanitizePrivateReviewCopy(aspectRatio ?? undefined) ?? null,
    aspectRatioConfirmed: approvedSnapshot?.aspectRatioFramePlan?.status === 'confirmed' || Boolean(aspectRatio),
    sourceOrderConfirmed: settingsSnapshot?.source_order_confirmed === true || (approvedSnapshot?.sourceSequence?.length ?? 0) > 0,
    cleanupPreferenceConfirmed: approvedSnapshot?.sourceCleanupPlan?.status === 'confirmed' || Boolean(approvedSnapshot?.sourceCleanupPlan),
    timingBaseConfirmed: Boolean(approvedSnapshot?.masterTimingPlan?.timingBase) || Boolean(approvedSnapshot?.masterTimingPlan),
    professionalBaseline: true,
    sourceSequenceItemCount: approvedSnapshot?.sourceSequence?.length ?? 0,
    segmentCount: approvedSnapshot?.segments?.length ?? 0,
    operationCount: approvedSnapshot?.operations?.length ?? 0,
    qaGateCount: approvedSnapshot?.qaPlan ? 1 : 0,
    creditEstimateTotalCredits,
    professionalSkillTrace: createApprovedProfessionalSkillTrace(approvedSnapshot),
    planningContextTrace: createApprovedPlanningContextTrace(approvedSnapshot),
  }
}

function createApprovedProfessionalSkillTrace(
  approvedSnapshot?: ApprovedPlanSnapshot,
): ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace'] {
  const skillPlan = approvedSnapshot?.professionalSkillPlan
  if (!skillPlan || skillPlan.source !== 'professional_skill_planner') return null

  const selectedSkillCount = numberFromUnknown(skillPlan.selectedSkillCount) ?? 0
  const status = sanitizePrivateReviewCopy(skillPlan.status) ?? 'unknown'
  const selectedFamilies = uniqueStrings(
    (Array.isArray(skillPlan.selectedFamilies) ? skillPlan.selectedFamilies : [])
      .flatMap((family) => {
        const sanitized = sanitizePrivateReviewCopy(String(family))
        return sanitized ? [sanitized] : []
      }),
  )
  const qaGateCount = uniqueStrings(
    (Array.isArray(skillPlan.qaGateSummary) ? skillPlan.qaGateSummary : [])
      .flatMap((gate) => {
        const sanitized = sanitizePrivateReviewCopy(String(gate))
        return sanitized ? [sanitized] : []
      }),
  ).length
  const userFacingActivities = uniqueStrings(
    (Array.isArray(skillPlan.userFacingActivities) ? skillPlan.userFacingActivities : [])
      .flatMap((activity) => {
        const sanitized = sanitizePrivateReviewCopy(String(activity))
        return sanitized ? [sanitized] : []
      }),
  ).slice(0, 8)
  const warnings = uniqueStrings(
    (Array.isArray(skillPlan.warnings) ? skillPlan.warnings : [])
      .flatMap((warning) => {
        const sanitized = sanitizePrivateReviewCopy(String(warning))
        return sanitized ? [sanitized] : []
      }),
  ).slice(0, 4)
  const blockers = uniqueStrings(
    (Array.isArray(skillPlan.blockers) ? skillPlan.blockers : [])
      .flatMap((blocker) => {
        const sanitized = sanitizePrivateReviewCopy(String(blocker))
        return sanitized ? [sanitized] : []
      }),
  ).slice(0, 4)
  const activityGroups = createApprovedProfessionalSkillActivityGroups(skillPlan)
  const backendIntents = createApprovedProfessionalSkillBackendIntents(skillPlan)
  const selectionEvidence = createApprovedProfessionalSkillSelectionEvidence(skillPlan)

  if (selectedSkillCount < 1 || selectedFamilies.length < 1) return null

  return {
    source: 'professional_skill_plan',
    status,
    selectedSkillCount,
    selectedFamilies,
    activityGroups,
    selectionEvidence,
    backendIntentCount: backendIntents.length,
    backendIntentKinds: uniqueStrings(backendIntents.map((intent) => intent.intentKind)),
    backendIntents,
    modelRoleTrace: createApprovedProfessionalSkillModelRoleTrace(skillPlan),
    qaGateCount,
    userFacingActivities,
    warnings,
    blockers,
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

const allowedModelRoleIds: ReEditProModelRoleId[] = [
  'kimi_k3_main_edit_agent',
  'qwen_3_7_main_edit_agent',
  'qwen2_5_vl_visual_understanding',
  'deepseek_v4_tool_code_agent',
]

const allowedRequestedModelUses: ReEditProRequestedModelUse[] = [
  'user_reasoning',
  'edit_planning',
  'creative_edit_strategy',
  'edit_qa_reasoning',
  'visual_understanding',
  'tool_code',
  'remotion_draft',
  'provider_asset_generation',
]

function reasoningRouteRoleFromUnknown(
  value: unknown,
): ProfessionalSkillModelRoleTrace['roles'][number]['reasoningRouteRole'] | undefined {
  return value === 'primary' || value === 'fallback' || value === 'specialist'
    ? value
    : undefined
}

function reasoningRoutePriorityFromUnknown(value: unknown): number | null | undefined {
  if (value === null) return null
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined
}

function createApprovedProfessionalSkillModelRoleTrace(
  skillPlan: unknown,
): ProfessionalSkillModelRoleTrace | undefined {
  const skillRecord = unknownRecord(skillPlan)
  const traceRecord = unknownRecord(skillRecord?.modelRoleTrace)

  if (
    traceRecord?.source !== 'reeditpro_model_role_contract' ||
    typeof traceRecord.contractVersion !== 'string' ||
    typeof traceRecord.ok !== 'boolean' ||
    typeof traceRecord.blocked !== 'boolean' ||
    traceRecord.mockOnly !== true
  ) {
    return undefined
  }

  return {
    source: 'reeditpro_model_role_contract',
    contractVersion: sanitizePrivateReviewCopy(traceRecord.contractVersion) ?? 'unknown',
    ok: traceRecord.ok,
    blocked: traceRecord.blocked,
    checkedContractCount: numberFromUnknown(traceRecord.checkedContractCount) ?? 0,
    modelRoleIntentCount: numberFromUnknown(traceRecord.modelRoleIntentCount) ?? 0,
    roles: Array.isArray(traceRecord.roles)
      ? traceRecord.roles.flatMap((role) => {
          const roleRecord = unknownRecord(role)
          const modelRoleId = typeof roleRecord?.modelRoleId === 'string' && allowedModelRoleIds.includes(roleRecord.modelRoleId as ReEditProModelRoleId)
            ? roleRecord.modelRoleId as ReEditProModelRoleId
            : undefined
          const providerBoundary = sanitizePrivateReviewCopy(typeof roleRecord?.providerBoundary === 'string' ? roleRecord.providerBoundary : undefined)
          const canonicalProviderModel = sanitizePrivateReviewCopy(
            typeof roleRecord?.canonicalProviderModel === 'string' ? roleRecord.canonicalProviderModel : undefined,
          )
          const reasoningRouteRole = reasoningRouteRoleFromUnknown(roleRecord?.reasoningRouteRole)
          const reasoningRoutePriority = reasoningRoutePriorityFromUnknown(roleRecord?.reasoningRoutePriority)

          if (
            !modelRoleId ||
            !providerBoundary ||
            !canonicalProviderModel ||
            !reasoningRouteRole ||
            reasoningRoutePriority === undefined ||
            typeof roleRecord?.fallbackOnly !== 'boolean' ||
            typeof roleRecord?.userReasoningAllowed !== 'boolean' ||
            typeof roleRecord.editPlanningAllowed !== 'boolean' ||
            typeof roleRecord.creativeStrategyAllowed !== 'boolean' ||
            typeof roleRecord.editQaReasoningAllowed !== 'boolean' ||
            typeof roleRecord.visualUnderstandingAllowed !== 'boolean' ||
            typeof roleRecord.toolCodeAllowed !== 'boolean' ||
            typeof roleRecord.remotionDraftAllowed !== 'boolean'
          ) {
            return []
          }

          return [{
            modelRoleId,
            providerBoundary,
            canonicalProviderModel,
            requestedUses: uniqueStrings(Array.isArray(roleRecord.requestedUses) ? roleRecord.requestedUses : [])
              .filter((use): use is ReEditProRequestedModelUse => allowedRequestedModelUses.includes(use as ReEditProRequestedModelUse)),
            intentIds: uniqueStrings(Array.isArray(roleRecord.intentIds) ? roleRecord.intentIds : [])
              .flatMap((intentId) => {
                const sanitized = sanitizePrivateReviewCopy(intentId)
                return sanitized ? [sanitized] : []
              }),
            reasoningRouteRole,
            reasoningRoutePriority,
            fallbackOnly: roleRecord.fallbackOnly,
            userReasoningAllowed: roleRecord.userReasoningAllowed,
            editPlanningAllowed: roleRecord.editPlanningAllowed,
            creativeStrategyAllowed: roleRecord.creativeStrategyAllowed,
            editQaReasoningAllowed: roleRecord.editQaReasoningAllowed,
            visualUnderstandingAllowed: roleRecord.visualUnderstandingAllowed,
            toolCodeAllowed: roleRecord.toolCodeAllowed,
            remotionDraftAllowed: roleRecord.remotionDraftAllowed,
          }]
        }).slice(0, 8)
      : [],
    errors: uniqueStrings(Array.isArray(traceRecord.errors) ? traceRecord.errors : [])
      .flatMap((error) => {
        const sanitized = sanitizePrivateReviewCopy(error)
        return sanitized ? [sanitized] : []
      }),
    mockOnly: true,
  }
}

function createApprovedProfessionalSkillSelectionEvidence(
  skillPlan: unknown,
): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['selectionEvidence'] {
  const record = unknownRecord(skillPlan)
  const rawSkills = Array.isArray(record?.selectedSkills) ? record.selectedSkills : []

  return rawSkills.flatMap((skill): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['selectionEvidence'] => {
    const skillRecord = unknownRecord(skill)
    if (!skillRecord) return []

    const skillId = sanitizePrivateReviewCopy(typeof skillRecord.skillId === 'string' ? skillRecord.skillId : undefined)
    const userFacingActivity = sanitizePrivateReviewCopy(
      typeof skillRecord.userFacingActivity === 'string' ? skillRecord.userFacingActivity : undefined,
    )
    const sources = uniqueStrings(
      (Array.isArray(skillRecord.selectionSources) ? skillRecord.selectionSources : [])
        .flatMap((source) => {
          const sanitized = sanitizePrivateReviewCopy(typeof source === 'string' ? source : undefined)
          return sanitized ? [sanitized] : []
        }),
    )
    const summaries = uniqueStrings(
      (Array.isArray(skillRecord.selectionEvidence) ? skillRecord.selectionEvidence : [])
        .flatMap((evidence) => {
          const evidenceRecord = unknownRecord(evidence)
          const sanitized = sanitizePrivateReviewCopy(
            typeof evidenceRecord?.summary === 'string' ? evidenceRecord.summary : undefined,
          )
          return sanitized ? [sanitized] : []
        }),
    ).slice(0, 4)

    return skillId && userFacingActivity && sources.length > 0
      ? [{
          skillId,
          userFacingActivity,
          sources,
          summaries,
        }]
      : []
  }).slice(0, 12)
}

function createApprovedProfessionalSkillBackendIntents(
  skillPlan: unknown,
): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['backendIntents'] {
  const record = unknownRecord(skillPlan)
  const rawIntents = Array.isArray(record?.backendIntents) ? record.backendIntents : []

  return rawIntents.flatMap((intent): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['backendIntents'] => {
    const intentRecord = unknownRecord(intent)
    if (!intentRecord) return []

    const intentId = sanitizePrivateReviewCopy(typeof intentRecord.intentId === 'string' ? intentRecord.intentId : undefined)
    const intentKind = sanitizePrivateReviewCopy(typeof intentRecord.intentKind === 'string' ? intentRecord.intentKind : undefined)
    const executionBoundary = sanitizePrivateReviewCopy(
      typeof intentRecord.executionBoundary === 'string' ? intentRecord.executionBoundary : undefined,
    )
    if (!intentId || !intentKind || !executionBoundary) return []

    const optionalString = (value: unknown) => sanitizePrivateReviewCopy(typeof value === 'string' ? value : undefined) ?? undefined

    return [{
      intentId,
      intentKind: intentKind as ProfessionalSkillBackendIntent['intentKind'],
      executionBoundary: executionBoundary as ProfessionalSkillBackendIntent['executionBoundary'],
      providerRoute: optionalString(intentRecord.providerRoute),
      providerModel: optionalString(intentRecord.providerModel),
      modelRoleId: optionalString(intentRecord.modelRoleId) as ProfessionalSkillBackendIntent['modelRoleId'] | undefined,
      requestedModelUse: optionalString(intentRecord.requestedModelUse) as ProfessionalSkillBackendIntent['requestedModelUse'] | undefined,
      generationType: optionalString(intentRecord.generationType),
      outputAssetType: optionalString(intentRecord.outputAssetType),
      hiddenAdapterToolCount: Array.isArray(intentRecord.hiddenAdapterToolNames)
        ? intentRecord.hiddenAdapterToolNames.filter((toolName) => typeof toolName === 'string' && toolName.trim()).length
        : 0,
      requiredApprovalGates: uniqueStrings(
        (Array.isArray(intentRecord.requiredApprovalGates) ? intentRecord.requiredApprovalGates : [])
          .flatMap((gate) => {
            const sanitized = sanitizePrivateReviewCopy(typeof gate === 'string' ? gate : undefined)
            return sanitized ? [sanitized] : []
          }),
      ),
    }]
  }).slice(0, 64)
}

function createApprovedProfessionalSkillActivityGroups(skillPlan: unknown): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['activityGroups'] {
  const record = unknownRecord(skillPlan)
  const rawGroups = Array.isArray(record?.activityGroups) ? record.activityGroups : []

  return rawGroups.flatMap((group): NonNullable<ProfessionalEditDecisionManifest['approvedEditContext']['professionalSkillTrace']>['activityGroups'] => {
    const groupRecord = unknownRecord(group)
    if (!groupRecord) return []

    const id = sanitizePrivateReviewCopy(typeof groupRecord.id === 'string' ? groupRecord.id : undefined)
    const label = sanitizePrivateReviewCopy(typeof groupRecord.label === 'string' ? groupRecord.label : undefined)
    const status = sanitizePrivateReviewCopy(typeof groupRecord.status === 'string' ? groupRecord.status : undefined)
    const userFacingSummary = sanitizePrivateReviewCopy(
      typeof groupRecord.userFacingSummary === 'string' ? groupRecord.userFacingSummary : undefined,
    )
    const selectedActivityCount = numberFromUnknown(groupRecord.selectedActivityCount) ?? 0
    const readyActivityCount = numberFromUnknown(groupRecord.readyActivityCount) ?? 0
    const reviewActivityCount = numberFromUnknown(groupRecord.reviewActivityCount) ?? 0
    const blockedActivityCount = numberFromUnknown(groupRecord.blockedActivityCount) ?? 0

    if (!id || !label || !status || !userFacingSummary) return []

    return [{
      id,
      label,
      selectedActivityCount,
      readyActivityCount,
      reviewActivityCount,
      blockedActivityCount,
      status,
      userFacingSummary,
    }]
  }).slice(0, 12)
}

function createApprovedPlanningContextTrace(
  approvedSnapshot?: ApprovedPlanSnapshot,
): ProfessionalEditDecisionManifest['approvedEditContext']['planningContextTrace'] {
  const trace = unknownRecord(unknownRecord(approvedSnapshot?.sourcePlan)?.planningContextTrace)
  if (!trace || trace.source !== 'planning_context') return null

  const planningContextId = sanitizePrivateReviewCopy(
    typeof trace.planningContextId === 'string' ? trace.planningContextId : undefined,
  )
  const status = sanitizePrivateReviewCopy(typeof trace.status === 'string' ? trace.status : undefined)
  const editBriefDirectionCount = numberFromUnknown(trace.editBriefDirectionCount) ?? 0
  const cueUsageCount = numberFromUnknown(trace.cueUsageCount) ?? 0
  const readyCueUsageCount = numberFromUnknown(trace.readyCueUsageCount) ?? 0
  const blockedCueUsageCount = numberFromUnknown(trace.blockedCueUsageCount) ?? 0
  const unresolvedConflictCount = numberFromUnknown(trace.unresolvedConflictCount) ?? 0
  const sourceAssetCount = numberFromUnknown(trace.sourceAssetCount) ?? 0
  const mustUseAssetCount = numberFromUnknown(trace.mustUseAssetCount) ?? 0
  const avoidAssetCount = numberFromUnknown(trace.avoidAssetCount) ?? 0

  if (!planningContextId || !status) return null

  return {
    source: 'planning_context',
    planningContextId,
    status,
    editBriefReady: trace.editBriefReady === true,
    editBriefDirectionCount,
    cueUsageCount,
    readyCueUsageCount,
    blockedCueUsageCount,
    unresolvedConflictCount,
    sourceAssetCount,
    mustUseAssetCount,
    avoidAssetCount,
  }
}

function createUploadedSourceOrderTrace(previewClips: RenderPreviewAssemblyClipRef[]): ProfessionalEditDecisionManifest['uploadedSourceOrderTrace'] {
  const sourceMediaAssetIds = previewClips.map((clip) => clip.sourceMediaAssetId)
  const uploadedOrders = previewClips.map((clip) => clip.uploadedOrder)
  const sourceChecksumSha256ByMediaAssetId = previewClips.reduce<Record<string, string>>((checksums, clip) => {
    if (clip.sourceChecksumSha256 && /^[a-f0-9]{64}$/i.test(clip.sourceChecksumSha256)) {
      checksums[clip.sourceMediaAssetId] = clip.sourceChecksumSha256.toLowerCase()
    }
    return checksums
  }, {})
  const sourceStorageProviderByMediaAssetId = previewClips.reduce<Record<string, UploadedMediaSourceAssetInput['storageProvider']>>((providers, clip) => {
    providers[clip.sourceMediaAssetId] = clip.sourceStorageProvider
    return providers
  }, {})
  const sourceStorageBucketByMediaAssetId = previewClips.reduce<Record<string, string>>((buckets, clip) => {
    if (clip.sourceStorageBucket?.trim()) buckets[clip.sourceMediaAssetId] = clip.sourceStorageBucket.trim()
    return buckets
  }, {})
  const sourceStoragePathByMediaAssetId = previewClips.reduce<Record<string, string>>((paths, clip) => {
    paths[clip.sourceMediaAssetId] = clip.sourceStoragePath
    return paths
  }, {})
  const sourceFileNameByMediaAssetId = previewClips.reduce<Record<string, string>>((fileNames, clip) => {
    fileNames[clip.sourceMediaAssetId] = clip.sourceFileName
    return fileNames
  }, {})
  const sourceMimeTypeByMediaAssetId = previewClips.reduce<Record<string, string>>((mimeTypes, clip) => {
    mimeTypes[clip.sourceMediaAssetId] = clip.sourceMimeType
    return mimeTypes
  }, {})
  const sourceByteSizeByMediaAssetId = previewClips.reduce<Record<string, number>>((byteSizes, clip) => {
    byteSizes[clip.sourceMediaAssetId] = clip.sourceByteSize
    return byteSizes
  }, {})
  const uniqueUploadedOrderCount = new Set(uploadedOrders).size
  const uniqueSourceMediaAssetCount = new Set(sourceMediaAssetIds).size
  const firstAppearanceSourceMediaAssetIds: string[] = []
  const firstAppearanceUploadedOrders: number[] = []
  const seenSourceMediaAssetIds = new Set<string>()

  for (const clip of previewClips) {
    if (seenSourceMediaAssetIds.has(clip.sourceMediaAssetId)) continue
    seenSourceMediaAssetIds.add(clip.sourceMediaAssetId)
    firstAppearanceSourceMediaAssetIds.push(clip.sourceMediaAssetId)
    firstAppearanceUploadedOrders.push(clip.uploadedOrder)
  }

  const uploadedOrderMonotonic = uploadedOrders.every((order, index, all) =>
    Number.isInteger(order) &&
    order > 0 &&
    (index === 0 || order >= all[index - 1]),
  )
  const firstAppearanceOrderMonotonic = firstAppearanceUploadedOrders.every((order, index, all) =>
    Number.isInteger(order) &&
    order > 0 &&
    (index === 0 || order > all[index - 1]),
  )
  const sourceMediaCoverageComplete = previewClips.length > 0 &&
    uploadedOrders.every((order) => Number.isInteger(order) && order > 0) &&
    sourceMediaAssetIds.every((sourceMediaAssetId) => sourceMediaAssetId.trim().length > 0) &&
    firstAppearanceOrderMonotonic &&
    uniqueUploadedOrderCount === uniqueSourceMediaAssetCount
  const sourceOrderPreserved = sourceMediaCoverageComplete

  return {
    source: 'uploaded_media_source_order',
    sourceMediaAssetIds,
    uploadedOrders,
    sourceChecksumSha256ByMediaAssetId,
    sourceStorageProviderByMediaAssetId,
    sourceStorageBucketByMediaAssetId,
    sourceStoragePathByMediaAssetId,
    sourceFileNameByMediaAssetId,
    sourceMimeTypeByMediaAssetId,
    sourceByteSizeByMediaAssetId,
    uniqueUploadedOrderCount,
    uniqueSourceMediaAssetCount,
    firstAppearanceSourceMediaAssetIds,
    firstAppearanceUploadedOrders,
    sourceMediaCoverageComplete,
    sourceOrderPreserved,
    uploadedOrderMonotonic,
  }
}

function sourceChecksumTraceMatchesDecisions(manifest: ProfessionalEditDecisionManifest): boolean {
  const checksumEntries = Object.entries(manifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId)
  if (checksumEntries.length < 1) return true

  const firstAppearanceIds = manifest.uploadedSourceOrderTrace.firstAppearanceSourceMediaAssetIds
  if (
    checksumEntries.length !== manifest.sourceMediaAssetCount ||
    firstAppearanceIds.some((sourceMediaAssetId) => !/^[a-f0-9]{64}$/i.test(manifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId[sourceMediaAssetId] ?? ''))
  ) {
    return false
  }

  return manifest.decisions.every((decision) =>
    decision.sourceChecksumSha256 === manifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId[decision.sourceMediaAssetId],
  )
}

function sourceStorageIdentityTraceMatchesDecisions(manifest: ProfessionalEditDecisionManifest): boolean {
  const trace = manifest.uploadedSourceOrderTrace
  const firstAppearanceIds = trace.firstAppearanceSourceMediaAssetIds
  if (firstAppearanceIds.length !== manifest.sourceMediaAssetCount) return false

  const requiredMapsComplete = firstAppearanceIds.every((sourceMediaAssetId) =>
    typeof trace.sourceStorageProviderByMediaAssetId[sourceMediaAssetId] === 'string' &&
    trace.sourceStorageProviderByMediaAssetId[sourceMediaAssetId].trim().length > 0 &&
    typeof trace.sourceStoragePathByMediaAssetId[sourceMediaAssetId] === 'string' &&
    trace.sourceStoragePathByMediaAssetId[sourceMediaAssetId].trim().length > 0 &&
    typeof trace.sourceFileNameByMediaAssetId[sourceMediaAssetId] === 'string' &&
    trace.sourceFileNameByMediaAssetId[sourceMediaAssetId].trim().length > 0 &&
    typeof trace.sourceMimeTypeByMediaAssetId[sourceMediaAssetId] === 'string' &&
    trace.sourceMimeTypeByMediaAssetId[sourceMediaAssetId].trim().length > 0 &&
    Number.isFinite(trace.sourceByteSizeByMediaAssetId[sourceMediaAssetId]) &&
    trace.sourceByteSizeByMediaAssetId[sourceMediaAssetId] > 0,
  )
  if (!requiredMapsComplete) return false

  return manifest.decisions.every((decision) =>
    decision.sourceStorageProvider === trace.sourceStorageProviderByMediaAssetId[decision.sourceMediaAssetId] &&
    (decision.sourceStorageBucket ?? undefined) === trace.sourceStorageBucketByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceStoragePath === trace.sourceStoragePathByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceFileName === trace.sourceFileNameByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceMimeType === trace.sourceMimeTypeByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceByteSize === trace.sourceByteSizeByMediaAssetId[decision.sourceMediaAssetId],
  )
}

function finalRenderArtifactDiffersFromSourceArtifacts(finalRenderArtifact: PrivateFinalRenderArtifact): boolean {
  if (!/^[a-f0-9]{64}$/i.test(finalRenderArtifact.sha256)) return false
  const sourceChecksums = new Set<string>()
  for (const decision of finalRenderArtifact.editDecisionManifest.decisions) {
    const sourceChecksumSha256 = decision.sourceChecksumSha256
    const processedArtifactSha256 = decision.processedArtifact.sha256
    if (sourceChecksumSha256 && /^[a-f0-9]{64}$/i.test(sourceChecksumSha256)) {
      sourceChecksums.add(sourceChecksumSha256)
    }
    if (processedArtifactSha256 && /^[a-f0-9]{64}$/i.test(processedArtifactSha256)) {
      sourceChecksums.add(processedArtifactSha256)
    }
  }
  return sourceChecksums.size > 0 && !sourceChecksums.has(finalRenderArtifact.sha256)
}

function decisionTimelineTraceMatchesFinalRender(
  manifest: ProfessionalEditDecisionManifest,
  finalRenderDurationSeconds: number,
): boolean {
  if (
    manifest.decisions.length !== manifest.clipDecisionCount ||
    manifest.decisions.length < 1 ||
    !Number.isFinite(finalRenderDurationSeconds) ||
    finalRenderDurationSeconds <= 0
  ) {
    return false
  }

  let expectedStartSeconds = 0
  for (let index = 0; index < manifest.decisions.length; index += 1) {
    const timeline = manifest.decisions[index].finalRenderTimeline
    if (
      timeline.source !== 'final_render_execution_sequence' ||
      timeline.sequenceIndex !== index + 1 ||
      !Number.isFinite(timeline.startSeconds) ||
      !Number.isFinite(timeline.durationSeconds) ||
      !Number.isFinite(timeline.endSeconds) ||
      timeline.durationSeconds <= 0 ||
      Math.abs(timeline.startSeconds - expectedStartSeconds) > 0.05 ||
      Math.abs((timeline.startSeconds + timeline.durationSeconds) - timeline.endSeconds) > 0.05
    ) {
      return false
    }
    expectedStartSeconds = timeline.endSeconds
  }

  return Math.abs(expectedStartSeconds - finalRenderDurationSeconds) <= 0.75
}

async function persistUploadedMediaWorkerArtifact(input: {
  uploadedMediaWorkerExecutionId: string
  workflowRehearsal: ApprovedEditExecutionWorkflowRehearsal
  qaResult: LocalWorkerOutputQaReviewRecord
  sourceAsset: UploadedMediaSourceAssetInput
  localStorageRoot: string
  createdAt: string
  index: number
}): Promise<UploadedMediaWorkerArtifactMetadata> {
  const artifactId = `uploaded-worker-output-${safePathPart(input.qaResult.artifactId)}-${String(input.index + 1).padStart(2, '0')}`
  const relativeObjectPath = join(
    'edit-execution',
    safePathPart(input.workflowRehearsal.workspaceId),
    safePathPart(input.workflowRehearsal.projectId),
    safePathPart(input.workflowRehearsal.id),
    'uploaded-media-worker-execution',
    `${safePathPart(artifactId)}.json`,
  )
  const localFilePath = join(input.localStorageRoot, relativeObjectPath)
  const storageObjectPath = relativeObjectPath.split('/').join('/')
  const payload = {
    artifactId,
    sourceMediaAssetId: input.sourceAsset.mediaAssetId,
    sourceSequenceItemId: input.sourceAsset.sourceSequenceItemId,
    uploadedClipId: input.sourceAsset.uploadedClipId,
    uploadedOrder: input.sourceAsset.uploadedOrder,
    sourceStorageProvider: input.sourceAsset.storageProvider,
    sourceStoragePath: input.sourceAsset.storagePath,
    sourceFileName: input.sourceAsset.fileName,
    sourceMimeType: input.sourceAsset.mimeType,
    sourceByteSize: input.sourceAsset.byteSize,
    workItemId: input.qaResult.workItemId,
    outputId: `uploaded-media-output-${input.qaResult.workItemId}`,
    workflowRehearsalId: input.workflowRehearsal.id,
    uploadedMediaWorkerExecutionId: input.uploadedMediaWorkerExecutionId,
    approvedPlanSnapshotId: input.workflowRehearsal.approvedPlanSnapshotId,
    creditReservationId: input.workflowRehearsal.creditReservationId,
    storageProvider: 'local_private',
    sourceOfTruthScope: 'uploaded_media_worker_execution_metadata_only',
    mediaArtifact: false,
    workerOutputArtifact: true,
    sourceMediaBound: true,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    qaStatus: 'qa_pending_private_worker_artifact_review',
    finalRenderEligible: false,
    previewReviewEligible: true,
    createdAt: input.createdAt,
    noRuntimeSideEffects: [
      'This record binds uploaded source media metadata to a private worker-output artifact placeholder.',
      'It does not contain decoded media bytes, rendered media bytes, raw prompts, secrets, signed URLs, or public artifact links.',
    ],
  }
  const content = `${JSON.stringify(stableJsonValue(payload), null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeObjectPath,
    content,
  })

  return {
    artifactId,
    sourceMediaAssetId: input.sourceAsset.mediaAssetId,
    sourceSequenceItemId: input.sourceAsset.sourceSequenceItemId,
    uploadedClipId: input.sourceAsset.uploadedClipId,
    uploadedOrder: input.sourceAsset.uploadedOrder,
    outputId: `uploaded-media-output-${input.qaResult.workItemId}`,
    workItemId: input.qaResult.workItemId,
    storageProvider: 'local_private',
    storageObjectPath,
    localFilePath,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'uploaded_media_worker_execution_metadata_only',
    mediaArtifact: false,
    workerOutputArtifact: true,
    sourceMediaBound: true,
    sha256: createHash('sha256').update(content).digest('hex'),
    byteSize: Buffer.byteLength(content),
    qaStatus: 'qa_pending_private_worker_artifact_review',
    finalRenderEligible: false,
    previewReviewEligible: true,
    createdAt: input.createdAt,
  }
}

function addSecondsIso(sourceIso: string, seconds: number): string {
  const sourceMs = Date.parse(sourceIso)
  const safeSourceMs = Number.isFinite(sourceMs) ? sourceMs : Date.now()
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 300
  return new Date(safeSourceMs + safeSeconds * 1000).toISOString()
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}

function hashFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function workerJobRecordFromQueuedJob(queuedJob: MockQueuedWorkerJob): WorkerJobRecord {
  return {
    id: queuedJob.id,
    workspaceId: queuedJob.workspaceId,
    projectId: queuedJob.projectId,
    jobType: queuedJob.runtimeJobType,
    status: queuedJob.status,
    approvedPlanSnapshotId: queuedJob.approvedPlanSnapshotId,
    creditReservationId: queuedJob.creditReservationId,
    inputPayload: queuedJob.payloadJson,
    jobBatchId: queuedJob.jobBatchPlanId,
    mockOnly: true,
  }
}
