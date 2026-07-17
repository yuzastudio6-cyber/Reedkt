import { createApiErrorResponse, createApiSuccessResponse } from '../backend/api/api-response'
import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { getBackendApiBaseUrl, getBackendRuntimeStatus } from '../backend/api/backend-runtime-config'
import {
  applyReeditProApiAuthorizationHeaders,
  callReeditProApi,
} from '../backend/api/frontend-api-client'
import type {
  BoundedAdapterModelWeightApprovalSource,
  BoundedAdapterModelWeightApprovalStatus,
  BoundedAdapterPackageReadinessEvidenceSource,
  BoundedAdapterPackageReadinessStatus,
} from '../types/bounded-adapter-source-truth'
import type { ApprovedPlanSnapshot } from '../types/edit-planning-db'
import type { ProfessionalSkillModelRoleTrace } from '../types/professional-skills'
import type { SourceMediaMetadata } from '../types/upload'

const EXECUTION_IRRELEVANT_APPROVED_SNAPSHOT_KEYS = new Set([
  'migrationDraftPlan',
  'migrationReviewPlan',
  'planningSystemAuditReport',
  'supabaseProductionReadinessPlan',
  'supabaseSchemaPlan',
])

const EXECUTION_IRRELEVANT_POLICY_MARKER_KEYS = new Set([
  'signedUrlRecommended',
])

export interface ProfessionalEditDecisionManifestClientModel {
  manifestVersion: string
  source: string
  approvedPlanSnapshotId: string
  approvedEditContext: {
    source: string
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
    professionalSkillTrace?: {
      source: 'professional_skill_plan'
      status: string
      selectedSkillCount: number
      selectedFamilies: string[]
      activityGroups: ApprovedEditProfessionalSkillActivityGroup[]
      selectionEvidence?: Array<{
        skillId: string
        userFacingActivity: string
        sources: string[]
        summaries: string[]
      }>
      backendIntentCount?: number
      backendIntentKinds?: string[]
      backendIntents?: ApprovedEditExecutionPackageBackendIntentTraceClientModel[]
      modelRoleTrace?: ProfessionalSkillModelRoleTrace
      qaGateCount: number
      userFacingActivities: string[]
      warnings: string[]
      blockers: string[]
      editBriefOptional: true
      promptFirstPlanning: true
      noUserVisibleToolNames: true
    } | null
    planningContextTrace?: {
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
    source: string
    sourceMediaAssetIds: string[]
    uploadedOrders: number[]
    sourceChecksumSha256ByMediaAssetId?: Record<string, string>
    sourceStorageProviderByMediaAssetId?: Record<string, string>
    sourceStorageBucketByMediaAssetId?: Record<string, string>
    sourceStoragePathByMediaAssetId?: Record<string, string>
    sourceFileNameByMediaAssetId?: Record<string, string>
    sourceMimeTypeByMediaAssetId?: Record<string, string>
    sourceByteSizeByMediaAssetId?: Record<string, number>
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
    source: string
    artifactCount: number
    formats: string[]
  }
  audioQaIntegration?: {
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
    finalTiming: number
    audioQa?: number
    audioPolish: number
  }
  decisions: Array<{
    clipRefId: string
    processedArtifactId: string
    processedArtifact?: {
      storageProvider: string
      storageObjectPath: string
      mimeType: string
      sha256: string
      byteSize: number
      durationSeconds: number
      processingMode?: 'bounded_preview_render' | 'private_internal_review_render'
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
    }
    sourceMediaAssetId: string
    sourceChecksumSha256?: string | null
    sourceStorageProvider?: string
    sourceStorageBucket?: string | null
    sourceStoragePath?: string
    sourceFileName?: string
    sourceMimeType?: string
    sourceByteSize?: number
    uploadedOrder: number
    segment: {
      id: string | null
      order: number | null
      label: string | null
    }
    approvedSourceRange: {
      source: string
      clipId: string | null
      sourceSequenceItemId: string | null
      startSeconds: number
      durationSeconds: number
      endSeconds: number
      requestedMaxDurationSeconds: number
    }
    reviewOverlay: { present: boolean; hasTitle: boolean; hasSubtitle: boolean; source: string }
    captionOverlay: { present: boolean; captionTimingItemId: string | null; textPresent: boolean; textCharacterCount: number; source: string }
    transitionPolish: { present: boolean; transitionTimingItemIds: string[]; fadeInSeconds: number | null; fadeOutSeconds: number | null; source: string }
    visualPolish: { present: boolean; colorPipelinePlanId: string | null; colorGradeStyle: string | null; intensity: string | null; operationCount: number; source: string; fullColorPipelineExecuted: false }
    finalTiming: { present: boolean; finalTimingItemId: string | null; startSeconds: number | null; durationSeconds: number | null; endSeconds: number | null; fps: number | null; source: string }
    audioExecutionReview?: {
      attached: boolean
      id: string | null
      status: string | null
      loudnessStatus: string | null
      normalizationStatus: string | null
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
    privateInternalReview: string
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

export interface ProfessionalEditDecisionManifestArtifactClientModel {
  artifactId: string
  storageProvider: string
  storageObjectPath: string
  localFilePath: string
  mimeType: 'application/json'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: string
  sha256: string
  byteSize: number
  manifestVersion: string
  finalRenderArtifactId: string
  safeForPrivateReview: true
  finalDeliveryEligible: false
}

export interface ApprovedEditExecutionPackageClientInput {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  approvedSnapshot: ApprovedPlanSnapshot | Record<string, unknown>
  creditReservationId: string
  requestedAdapterToolNames?: string[]
  adapterCandidateScope?: 'approved_snapshot_plus_requested' | 'requested_only'
  packageReadyToolIds?: string[]
  modelWeightApprovedToolIds?: string[]
  userId?: string
}

export interface ApprovedEditExecutionBoundedAdapterExecutionGateClientModel {
  status: string
  requestedToolCount: number
  resolvedToolCount: number
  readyToolCount: number
  blockedToolCount: number
  clientReadinessHintsTrusted: false
  serverSourceTruthRequired: true
  frontendExecutionAllowed: false
  productReady: false
  userFacingSummary: string
  userFacingReadinessSummary?: string
  sourceTruthIssues?: Array<{
    requestedToolName: string
    canonicalToolId?: string
    sourceTruthStatus?: string
    sourceTruthAuthority?: string
    nextGate: string
    category: string
    userFacingSummary: string
    internalBlocker: string
  }>
  noRuntimeSideEffects: string[]
}

export interface ApprovedEditExecutionPackageProfessionalSkillTraceClientModel {
  source: 'approved_professional_skill_plan'
  status: string
  selectedSkillCount: number
  selectedFamilies: string[]
  activityGroups: ApprovedEditProfessionalSkillActivityGroup[]
  selectionEvidence?: Array<{
    skillId: string
    userFacingActivity: string
    sources: string[]
    summaries: string[]
  }>
  backendIntentCount: number
  backendIntentKinds: string[]
  backendIntents: ApprovedEditExecutionPackageBackendIntentTraceClientModel[]
  modelRoleTrace: ProfessionalSkillModelRoleTrace
  qaGateCount: number
  warnings: string[]
  blockers: string[]
  editBriefOptional: true
  promptFirstPlanning: true
  noUserVisibleToolNames: true
}

export interface ApprovedEditExecutionPackageBackendIntentTraceClientModel {
  intentId: string
  intentKind: string
  executionBoundary: string
  providerRoute?: string
  providerModel?: string
  modelRoleId?: string
  requestedModelUse?: string
  generationType?: string
  outputAssetType?: string
  hiddenAdapterToolCount: number
  requiredApprovalGates: string[]
}

export interface ApprovedEditExecutionPackageClientResult {
  approvedEditExecutionPackage?: {
    packageRecordId: string
    createdByUserId: string
    workspaceId: string
    projectId?: string
    approvedPlanSnapshotId: string
    status: string
    agentCallReady: boolean
    liveExecutionReady: false
    sourceClipCount?: number
    segmentCount?: number
    operationCount?: number
    plannedWorkItemCount?: number
    privateArtifactRefCount: number
    requestedAdapterToolNames: string[]
    adapterCandidateScope?: 'approved_snapshot_plus_requested' | 'requested_only'
    packageReadyToolIds: string[]
    modelWeightApprovedToolIds: string[]
    resolvedAdapterToolCount: number
    boundedAdapterExecutionReady: boolean
    boundedAdapterReadyToolCount: number
    boundedAdapterBlockedToolCount: number
    boundedAdapterBlockers: string[]
    boundedAdapterExecutionGate?: ApprovedEditExecutionBoundedAdapterExecutionGateClientModel
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    userFacingSummary: string
    blockers: string[]
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionBoundedAdapterExecutionGateClientInput {
  workspaceId: string
  projectId: string
  packageRecordId: string
  userId?: string
}

export interface ApprovedEditExecutionBoundedAdapterExecutionGateClientResult {
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  boundedAdapterExecutionGate: ApprovedEditExecutionBoundedAdapterExecutionGateClientModel | null
  warnings?: string[]
}

export interface ApprovedEditExecutionPackageReadinessEvidenceClientModel {
  toolId: string
  status: BoundedAdapterPackageReadinessStatus
  source: BoundedAdapterPackageReadinessEvidenceSource
  evidenceId: string
  checkedAt: string
  summary?: string
}

export interface ApprovedEditExecutionModelWeightApprovalEvidenceClientModel {
  toolId: string
  approvalStatus: BoundedAdapterModelWeightApprovalStatus
  source: BoundedAdapterModelWeightApprovalSource
  manifestId: string
  checkedAt: string
  summary?: string
}

export interface ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientInput {
  workspaceId: string
  projectId: string
  packageRecordId: string
  creditReservationId: string
  packageReadinessEvidence?: ApprovedEditExecutionPackageReadinessEvidenceClientModel[]
  modelWeightApprovals?: ApprovedEditExecutionModelWeightApprovalEvidenceClientModel[]
  userId?: string
}

export interface ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientResult {
  sourceTruthReview?: {
    id: string
    workspaceId: string
    projectId: string
    status: 'ready_for_bounded_execution' | 'blocked'
    requestedToolCount: number
    resolvedToolCount: number
    packageReadyToolIds: string[]
    modelWeightApprovedToolIds: string[]
    acceptedPackageEvidenceCount: number
    acceptedModelWeightApprovalCount: number
    rejectedEvidenceCount: number
    blockers: string[]
    clientReadinessHintsTrusted: false
    serverSourceTruthRequired: true
    frontendExecutionAllowed: false
    productReady: false
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
    boundedAdapterExecutionGate: ApprovedEditExecutionBoundedAdapterExecutionGateClientModel
  }
  approvedEditExecutionPackage?: ApprovedEditExecutionPackageClientResult['approvedEditExecutionPackage']
  warnings?: string[]
}

export interface ApprovedEditExecutionBoundedAdapterExecutionRunClientInput {
  workspaceId: string
  projectId: string
  packageRecordId: string
  creditReservationId: string
  handoffOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionBoundedAdapterExecutionRunClientResult {
  boundedAdapterExecutionRun?: {
    id: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: 'completed_private_manifest_handoff' | 'blocked'
    executionMode: 'backend_bounded_adapter_private_manifest_handoff'
    requestedToolCount: number
    readyToolCount: number
    blockedToolCount: number
    preparedActivityCount: number
    completedActivityCount: number
    actualToolPackageExecutionCount: 0
    privateResultManifestCount: number
    sourceTruthReviewRequired: true
    sourceTruthReviewReady: boolean
    frontendExecutionAllowed: false
    productReady: false
    blockers: string[]
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    activityResults: Array<{
      activityResultId: string
      canonicalToolId: string
      workerType: string
      userFacingActivity: string
      status: 'completed_private_manifest_handoff'
      privateInputManifestKinds: string[]
      privateOutputManifestKinds: string[]
      qaGates: string[]
      privateResultManifest: {
        artifactId: string
        storageProvider: 'local_private'
        storageObjectPath: string
        mimeType: 'application/json'
        sourceOfTruth: true
        sourceOfTruthScope: string
        privateArtifact: true
        publicArtifact: false
        signedUrl: null
      }
      runnerBinding: {
        registeredToolRunnerRequired: true
        actualToolPackageExecuted: false
        summary: string
      }
    }>
    privateArtifactManifest: Record<string, unknown>
    nextRequiredGate: string
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionRegisteredAdapterRunnerProbeClientInput {
  workspaceId: string
  projectId: string
  boundedAdapterExecutionRunId: string
  importProbeOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionRegisteredAdapterRunnerProbeClientResult {
  registeredRunnerRun?: {
    id: string
    boundedAdapterExecutionRunId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: 'completed_import_probe' | 'blocked'
    probeOnly: true
    requestedActivityCount: number
    completedImportProbeCount: number
    blockedRunnerCount: number
    actualToolPackageExecutionCount: number
    mediaProcessingExecuted: false
    frontendExecutionAllowed: false
    productReady: false
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    results: Array<{
      activityResultId: string
      canonicalToolId: string
      runtime: 'node' | 'python' | 'binary' | 'none'
      packageName?: string
      importName?: string
      importProbeOnly?: true
      runtimeBinary?: string
      runtimeReadinessScope?: string
      declaredWorkerImageRoles?: string[]
      declaredRequirementsFiles?: string[]
      status: string
      packageResolved: boolean
      packageImported: boolean
      actualToolPackageExecuted: boolean
      summary: string
      errorMessage?: string
    }>
    blockers: string[]
    nextRequiredGate: string
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientInput {
  workspaceId: string
  projectId: string
  registeredRunnerRunId: string
  creditReservationId: string
  privateMediaExecutionOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientResult {
  privateMediaRunnerRun?: {
    id: string
    registeredRunnerRunId: string
    boundedAdapterExecutionRunId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: 'private_runner_manifest_ready' | 'blocked'
    executionMode: 'backend_registered_runner_private_manifest_execution'
    privateMediaExecutionOnly: true
    requestedActivityCount: number
    registeredRunnerReadyCount: number
    blockedRunnerCount: number
    preparedPrivateRunnerManifestCount: number
    mediaProcessingExecuted: false
    productRuntimeExecuted: false
    frontendExecutionAllowed: false
    productReady: false
    blockers: string[]
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    activities: Array<{
      activityExecutionId: string
      sourceActivityResultId: string
      canonicalToolId: string
      userFacingActivity: string
      status: 'private_runner_manifest_ready'
      registeredImportProbeReady: true
      privateInputManifestKinds: string[]
      privateOutputManifestKinds: string[]
      qaGates: string[]
      privateRunnerResultManifest: {
        artifactId: string
        storageProvider: 'local_private'
        storageObjectPath: string
        mimeType: 'application/json'
        sourceOfTruth: true
        sourceOfTruthScope: string
        privateArtifact: true
        publicArtifact: false
        signedUrl: null
      }
      runnerBoundary: {
        backendRegisteredRunnerRequired: true
        importProbeCompleted: true
        packageAvailabilityProven: true
        mediaProcessingExecuted: false
        productRuntimeExecuted: false
        summary: string
      }
    }>
    privateArtifactManifest: Record<string, unknown>
    nextRequiredGate: string
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientInput {
  workspaceId: string
  projectId: string
  privateMediaRunnerRunId: string
  creditReservationId: string
  qaReviewOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientResult {
  privateMediaRunnerQaReview?: {
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
    boundedNodePackageExecutionCount?: number
    actualToolPackageExecutionCount?: number
    mediaProcessingExecuted: false
    productRuntimeExecuted: false
    frontendExecutionAllowed: false
    productReady: false
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    artifacts: Array<{
      artifactId: string
      activityExecutionId: string
      canonicalToolId: string
      boundedPackageExecution?: {
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
      actualToolPackageExecuted?: boolean
      storageProvider: 'local_private'
      storageObjectPath: string
      localFilePath: string
      mimeType: 'application/json'
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      sha256: string
      byteSize: number
      qaStatus: 'passed_private_runner_manifest_qa'
      finalRenderIntegrationEligible: false
      createdAt: string
    }>
    blockers: string[]
    finalRenderIntegrationReadiness: {
      ready: false
      reason: string
      adapterQaArtifactCount: number
      nextRequiredGate: string
    }
    nextRequiredGate: string
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
    createdAt: string
    mockOnly: true
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientInput {
  workspaceId: string
  projectId: string
  privateMediaRunnerQaReviewId: string
  creditReservationId: string
  integrationOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientResult {
  adapterWorkerArtifactIntegration?: {
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
    professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
    artifacts: Array<{
      artifactId: string
      sourceQaArtifactId: string
      activityExecutionId: string
      canonicalToolId: string
      actualToolPackageExecuted?: boolean
      storageProvider: 'local_private'
      storageObjectPath: string
      localFilePath: string
      mimeType: 'application/json'
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      sha256: string
      byteSize: number
      qaStatus: 'passed_private_runner_manifest_qa'
      renderIntegrationStatus: 'attached_to_private_render_manifest'
      finalRenderIntegrationEligible: true
      mediaTransformOutputEligible: false
    }>
    integrationManifestArtifact: {
      artifactId: string
      storageProvider: 'local_private'
      storageObjectPath: string
      localFilePath: string
      mimeType: 'application/json'
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      sha256: string
      byteSize: number
      integratedArtifactCount: number
      previewAssemblyEligible: true
      finalRenderDecisionManifestEligible: true
    }
    blockers: []
    nextRequiredGate: string
    userFacingSummary: string
    internalExecutionSummary: string
    noRuntimeSideEffects: string[]
    createdAt: string
    mockOnly: true
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionJobBatchPlanClientInput {
  workspaceId: string
  projectId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  dryRunOnly?: true
  workItems?: Array<{
    id: string
    workItemType: string
    status: string
    idempotencyKey: string
    dependencies?: Array<{ dependsOnWorkItemId?: string }>
    expectedOutputs?: Array<{ id?: string }>
    qaChecks?: string[]
  }>
  userId?: string
}

export interface ApprovedEditExecutionJobBatchPlanClientResult {
  jobBatchPlan?: {
    id: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    dryRunOnly: true
    plannedJobCount: number
    readyToQueueCount: number
    waitingDependencyCount: number
    blockedJobCount: number
    userFacingSummary: string
    noRuntimeSideEffects: string[]
    plannedJobs?: Array<{
      id: string
      workItemId: string
      jobType: string
      workerType: string
      status: string
      idempotencyKey: string
      dependencyWorkItemIds: string[]
      expectedOutputIds: string[]
      qaChecks: string[]
    }>
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionMockQueueClientInput {
  workspaceId: string
  projectId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  mockQueueOnly?: true
  plannedJobs?: Array<{
    id: string
    workItemId: string
    jobType: string
    workerType: string
    status: string
    idempotencyKey: string
    dependencyWorkItemIds?: string[]
    expectedOutputIds?: string[]
    qaChecks?: string[]
  }>
  userId?: string
}

export interface ApprovedEditExecutionMockQueueClientResult {
  mockQueue?: {
    id: string
    jobBatchPlanId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    mockQueueOnly: true
    queuedJobCount: number
    workersStarted: 0
    workerClaimsCreated: 0
    userFacingSummary: string
    noRuntimeSideEffects: string[]
    queuedJobs?: Array<{
      id: string
      workItemId: string
      jobType: string
      runtimeJobType?: string
      workerType: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      idempotencyKey: string
    }>
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionDispatchReadinessClientInput {
  workspaceId: string
  projectId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  dryRunOnly?: true
  queuedJobs?: Array<{
    id: string
    workItemId: string
    jobType: string
    runtimeJobType?: string
    workerType: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    idempotencyKey: string
  }>
  userId?: string
}

export interface ApprovedEditExecutionDispatchReadinessClientResult {
  dispatchReadiness?: {
    id: string
    mockQueueId: string
    jobBatchPlanId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    dryRunOnly: true
    queuedJobCount: number
    readyForClaimCount: number
    blockedByGateCount: number
    workersStarted: 0
    workerClaimsCreated: 0
    readiness?: Array<{
      queuedJobId: string
      workItemId: string
      jobType?: string
      runtimeJobType?: string
      workerType: string
      idempotencyKey?: string
      status: string
    }>
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionMockWorkerClaimsClientInput {
  workspaceId: string
  projectId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  workerInstanceId?: string
  mockClaimsOnly?: true
  readiness?: Array<{
    queuedJobId: string
    workItemId: string
    jobType?: string
    runtimeJobType?: string
    workerType: string
    idempotencyKey?: string
    status: string
  }>
  userId?: string
}

export interface ApprovedEditExecutionMockWorkerClaimsClientResult {
  mockWorkerClaims?: {
    id: string
    dispatchReadinessId: string
    mockQueueId: string
    jobBatchPlanId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    mockClaimsOnly: true
    claimCount: number
    workersStarted: 0
    workerHandlersStarted: 0
    toolsExecuted: 0
    workerClaims?: Array<{
      id: string
      queuedJobId: string
      workItemId: string
      runtimeJobType?: string
      workerType: string
      workerInstanceId: string
      claimStatus: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      idempotencyKey: string
      expectedOutputIds?: string[]
      qaChecks?: string[]
      leaseExpiresAt: string
    }>
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionHandlerDryRunClientInput {
  workspaceId: string
  projectId: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  handlerDryRunOnly?: true
  workerClaims?: Array<{
    id: string
    queuedJobId: string
    workItemId: string
    runtimeJobType?: string
    workerType: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    idempotencyKey: string
    expectedOutputIds?: string[]
    qaChecks?: string[]
  }>
  userId?: string
}

export interface ApprovedEditExecutionHandlerDryRunClientResult {
  handlerDryRun?: {
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
    status: string
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
    workResults?: Array<{
      id: string
      workerClaimId: string
      queuedJobId: string
      workItemId: string
      runtimeJobType: string
      workerType: string
      status: string
      billableToUser: false
      expectedOutputIds: string[]
    }>
    assetManifestUpdates?: Array<{
      artifactId: string
      outputId: string
      workItemId: string
      storageProvider: string
      storageObjectPath: string
      privateArtifact: true
      sourceOfTruth: false
      qaStatus: string
    }>
    qaHandoffRecords?: Array<{
      id: string
      workItemId: string
      workerClaimId: string
      qaStatus: string
      blocksFinalRender: true
    }>
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionResultReconciliationClientInput {
  workspaceId: string
  projectId: string
  handlerDryRunId: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  reconcileDryRunOnly?: true
  workResultCount?: number
  assetManifestUpdates?: Array<{
    artifactId: string
    outputId: string
    workItemId: string
    storageProvider: string
    storageObjectPath: string
    privateArtifact: true
    sourceOfTruth: false
  }>
  qaHandoffRecords?: Array<{
    id: string
    workItemId: string
    workerClaimId: string
    reason?: string
  }>
  userId?: string
}

export interface ApprovedEditExecutionResultReconciliationClientResult {
  resultReconciliation?: {
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
    status: string
    reconcileDryRunOnly: true
    workResultCount: number
    manifestItemCount: number
    qaGateCount: number
    sourceOfTruthArtifactCount: 0
    finalRenderReady: false
    previewReviewReady: false
    liveExecutionReady: false
    reconciledManifestItems?: Array<{
      artifactId: string
      outputId: string
      workItemId: string
      storageProvider: string
      storageObjectPath: string
      privateArtifact: true
      sourceOfTruth: false
      mergeStatus: string
      reconciliationDecision: string
      qaStatus: string
      finalRenderEligible: false
    }>
    reconciledQAGates?: Array<{
      id: string
      workItemId: string
      workerClaimId: string
      qaStatus: string
      blocksFinalRender: true
      requiredBeforeFinalExport: true
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      blockingWorkItemIds: string[]
      qaPendingArtifactIds: string[]
      dryRunArtifactIds: string[]
      sourceOfTruthArtifactCount: 0
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionLocalWorkerOutputClientInput {
  workspaceId: string
  projectId: string
  resultReconciliationId: string
  handlerDryRunId: string
  mockWorkerClaimsId: string
  dispatchReadinessId: string
  mockQueueId: string
  jobBatchPlanId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  localOutputOnly?: true
  workResultCount?: number
  reconciledManifestItems?: Array<{
    artifactId: string
    outputId: string
    workItemId: string
  }>
  userId?: string
}

export interface ApprovedEditExecutionLocalWorkerOutputClientResult {
  localWorkerOutput?: {
    id: string
    resultReconciliationId: string
    handlerDryRunId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
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
    persistedArtifacts?: Array<{
      artifactId: string
      sourceArtifactId: string
      outputId: string
      workItemId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: false
      sha256: string
      byteSize: number
      qaStatus: string
      finalRenderEligible: false
      previewReviewEligible: true
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      qaPendingArtifactIds: string[]
      sourceOfTruthArtifactCount: number
      mediaArtifactCount: 0
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionLocalWorkerOutputQaReviewClientInput {
  workspaceId: string
  projectId: string
  localWorkerOutputId: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  qaReviewOnly?: true
  persistedArtifacts?: Array<{
    artifactId: string
    workItemId: string
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
    sourceOfTruth: true
    sourceOfTruthScope: string
    mediaArtifact: false
    sha256: string
    byteSize: number
    finalRenderEligible: false
  }>
  userId?: string
}

export interface ApprovedEditExecutionLocalWorkerOutputQaReviewClientResult {
  localWorkerOutputQaReview?: {
    id: string
    localWorkerOutputId: string
    resultReconciliationId: string
    handlerDryRunId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
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
    previewReviewReady: true
    renderPreviewReady: false
    finalRenderReady: false
    qaResults?: Array<{
      id: string
      artifactId: string
      workItemId: string
      qaStatus: string
      metadataIntegrityPassed: boolean
      mediaQaRequired: true
      finalRenderEligible: false
      blocksFinalRender: true
      requiredBeforeFinalExport: true
      checks?: Array<{ check: string; passed: boolean; message: string }>
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      metadataQaPassedArtifactIds: string[]
      mediaQaRequiredArtifactIds: string[]
      sourceOfTruthArtifactCount: number
      mediaArtifactCount: 0
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionWorkflowRehearsalClientInput {
  workspaceId: string
  projectId: string
  localWorkerOutputId: string
  localOutputQaReviewId?: string
  resultReconciliationId: string
  handlerDryRunId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  scenarioId?: string
  rehearsalOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionWorkflowRehearsalClientResult {
  workflowRehearsal?: {
    id: string
    localWorkerOutputId: string
    resultReconciliationId: string
    handlerDryRunId: string
    packageRecordId: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    rehearsalOnly: true
    workflowMode: string
    scenarioId: string
    stageCount: number
    completedStageCount: number
    blockedStageCount: number
    warningStageCount: number
    workflowStages: string[]
    artifactCount: number
    privateArtifactCount: number
    qaGateCount: number
    qaBlockedCount: number
    finalDeliveryAllowed: false
    productionReadyAllowed: boolean
    liveExecutionReady: false
    renderPreviewReady: false
    finalRenderReady: false
    localOutputQaStatus: string
    report?: {
      reportId: string
      scenarioId: string
      mode: string
      status: string
      blockers: string[]
      warnings: string[]
      nextActions: string[]
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionUploadedMediaSourceAssetClientInput {
  mediaAssetId: string
  sourceSequenceItemId?: string
  uploadedClipId?: string
  uploadedOrder: number
  storageProvider: 'local_private' | 'google_cloud_storage' | 'supabase_storage'
  storageBucket?: string
  storagePath: string
  fileName: string
  mimeType: string
  byteSize: number
  checksumSha256?: string
  sourceMetadata?: SourceMediaMetadata
  privateArtifact?: true
  publicUrl?: null
  signedUrl?: null
}

export interface ApprovedEditExecutionPrivateInternalTestRunClientInput {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  approvedSnapshot: Record<string, unknown>
  creditReservationId: string
  requestedAdapterToolNames?: string[]
  packageReadyToolIds?: string[]
  modelWeightApprovedToolIds?: string[]
  internalTestRunOnly?: true
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  processingMode?: 'bounded_preview_render' | 'private_internal_review_render'
  maxDurationSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
  reviewerNote?: string
  userId?: string
}

export interface ApprovedEditExecutionAdapterGateActivityGroup {
  id: string
  label: string
  resolvedActivityCount: number
  integratedActivityCount: number
  pendingActivityCount: number
  status: 'ready' | 'partial' | 'pending' | 'blocked'
  userFacingSummary: string
}

export interface ApprovedEditProfessionalSkillActivityGroup {
  id: string
  label: string
  selectedActivityCount: number
  readyActivityCount: number
  reviewActivityCount: number
  blockedActivityCount: number
  status: string
  userFacingSummary: string
}

export interface ApprovedEditExecutionPrivateInternalTestRunClientResult {
  internalTestRun?: {
    id: string
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    status: string
    internalTestRunOnly: true
    sourceMediaAssetCount: number
    adapterGateSummary?: {
      status: string
      executionMode: string
      requestedActivityCount: number
      resolvedActivityCount: number
      readyActivityCount: number
      blockedActivityCount: number
      editActivityCount: number
      readinessCheckCount: number
      toolsExecutedCount: number
      fullToolExecutionReady: false
      privateFallbackReviewOnly: true
      privateRenderIntegrationStatus?: string
      privateRenderIntegrationReady?: boolean
      privateRenderIntegratedActivityCount?: number
      backendIntegrationCandidateCount?: number
      backendIntegrationPendingActivityCount?: number
      backendIntegrationBlockedActivityCount?: number
      backendIntegrationBlockers?: string[]
      clientReadinessHintsTrusted: false
      serverSourceTruthRequiredForFullExecution: true
      frontendExecutionAllowed: false
      productReady: false
      userFacingSummary: string
      userFacingReadinessSummary?: string
      noRuntimeSideEffects: string[]
      activityGroups?: ApprovedEditExecutionAdapterGateActivityGroup[]
    }
    stageIds: Record<string, string | null>
    privateInternalDownloadPath: string
    privateInternalManifestPath?: string
    privateInternalDownloadDelivery?: {
      id: string
      createdByUserId: string
      status: string
      privateInternalDownloadReady: true
      publicDeliveryReady: boolean
      externalBetaReady: boolean
      productionReady: boolean
      finalExportReady: true
      internalDownloadPath: string
      internalManifestPath?: string
      professionalEditQaSummary?: {
        source: string
        approvedReviewOverlayCount: number
        approvedCaptionOverlayCount: number
        privateCaptionArtifactCount: number
        privateCaptionFormats: string[]
        approvedTransitionPolishCount: number
        approvedVisualPolishCount: number
        approvedFinalTimingCount: number
        approvedFinalTimelineDurationSeconds: number
        audioPolishApplied: boolean
        visualPolishApplied: boolean
        visualPolishToolId: string
        fullColorPipelineExecuted: false
        editDecisionManifestReady: boolean
        editDecisionManifestArtifactReady: boolean
        privateInternalQaReady: boolean
      }
    }
    finalRenderArtifact?: {
      artifactId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      mimeType: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      durationSeconds: number
      width: number
      height: number
      sha256: string
      byteSize: number
      commandSummary?: {
        tool: 'ffmpeg'
        mode: string
        inputCount: number
        videoCodec: string
        audioMode: string
        audioPolish?: {
          applied: boolean
          source: string
          targetIntegratedLufs: number
          truePeakDb: number
          loudnessRangeLufs: number
          limiter: boolean
          filterChain: string[]
        }
        reviewOverlayCount: number
        approvedFinalTimingCount?: number
        approvedFinalTimelineDurationSeconds?: number
        approvedCaptionOverlayCount: number
        approvedTransitionPolishCount: number
        approvedVisualPolishCount?: number
        visualPolish?: {
          applied: boolean
          source: string
          toolId: string
          fullColorPipelineExecuted: false
          clipCount: number
          colorGradeStyles: string[]
          operationLabels: string[]
          filterChain: string[]
        }
        privateCaptionArtifactCount?: number
        privateCaptionFormats?: string[]
        privateCaptionSource?: string
      }
      editDecisionManifest?: ProfessionalEditDecisionManifestClientModel
      editDecisionManifestArtifact?: ProfessionalEditDecisionManifestArtifactClientModel
      finalDeliveryEligible: false
    }
    publicDeliveryReady: boolean
    externalBetaReady: boolean
    productionReady: boolean
    nextRequiredGate: string
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionPrivateInternalDownloadFileClientResult {
  blob: Blob
  fileName: string
  mimeType: string
  byteSize: number
  privateInternalDownloadPath: string
}

export interface ApprovedEditExecutionPrivateInternalDownloadManifestClientResult {
  manifest: ProfessionalEditDecisionManifestClientModel
  blob: Blob
  fileName: string
  mimeType: string
  byteSize: number
  privateInternalManifestPath: string
}

export interface ApprovedEditExecutionPrivateCaptionPackageClientModel {
  id: string
  mode: 'local_dev'
  status: string
  source: string
  transcriptSource: string
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  transcriptWorkerOutput: false
  realSpeechModelExecution: false
  captionSegmentCount: number
  captionFileCount: number
  captionArtifactCount: number
  captionFormats: string[]
  captionFiles: Array<{
    format: string
    artifactId: string
    storageProvider: string
    storageObjectPath: string
    localFilePath: string
    mimeType: string
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
    sourceOfTruth: true
    sourceOfTruthScope: string
    source: string
    transcriptWorkerOutput: false
    safeForPrivateReview: true
    sha256: string
    byteSize: number
    captionCount: number
  }>
  qaGateCount: number
  qaPassed: boolean
  skippedReasonCount: number
  warnings: string[]
  safeForPrivateReview: true
  finalRenderEligible: false
}

export interface ApprovedEditExecutionUploadedMediaWorkerExecutionClientInput {
  workspaceId: string
  projectId: string
  workflowRehearsalId: string
  localWorkerOutputId: string
  localWorkerOutputQaReviewId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  uploadedMediaExecutionOnly?: true
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  userId?: string
}

export interface ApprovedEditExecutionUploadedMediaWorkerExecutionClientResult {
  uploadedMediaWorkerExecution?: {
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
    status: string
    uploadedMediaExecutionOnly: true
    workerExecutionMode: string
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
    sourceMediaAssets?: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
    privateWorkerArtifacts?: Array<{
      artifactId: string
      sourceMediaAssetId: string
      sourceSequenceItemId?: string
      uploadedClipId?: string
      uploadedOrder: number
      outputId: string
      workItemId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: false
      workerOutputArtifact: true
      sourceMediaBound: true
      sha256: string
      byteSize: number
      qaStatus: string
      finalRenderEligible: false
      previewReviewEligible: true
    }>
    qaHandoffRecords?: Array<{
      id: string
      artifactId: string
      sourceMediaAssetId: string
      workItemId: string
      qaStatus: string
      blocksFinalRender: true
      requiredBeforeFinalExport: true
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      qaPendingArtifactIds: string[]
      sourceMediaAssetCount: number
      privateWorkerArtifactCount: number
      mediaArtifactCount: 0
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientInput {
  workspaceId: string
  projectId: string
  uploadedMediaWorkerExecutionId: string
  creditReservationId: string
  qaReviewOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientResult {
  privateWorkerArtifactQaReview?: {
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
    status: string
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
    qaResults?: Array<{
      id: string
      artifactId: string
      sourceMediaAssetId: string
      workItemId: string
      qaStatus: string
      metadataIntegrityPassed: boolean
      sourceMediaBound: boolean
      mediaQaRequired: true
      finalRenderEligible: false
      blocksFinalRender: true
      requiredBeforeFinalExport: true
      reason: string
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      metadataQaPassedArtifactIds: string[]
      mediaQaRequiredArtifactIds: string[]
      sourceBoundArtifactCount: number
      mediaArtifactCount: 0
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionLocalMediaProcessingExecutionClientInput {
  workspaceId: string
  projectId: string
  privateWorkerArtifactQaReviewId: string
  creditReservationId: string
  processingExecutionOnly?: true
  processingMode?: 'bounded_preview_render' | 'private_internal_review_render'
  maxDurationSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
  userId?: string
}

export interface ApprovedEditExecutionLocalMediaProcessingExecutionClientResult {
  localMediaProcessingExecution?: {
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
    status: string
    processingExecutionOnly: true
    processingMode: string
    sourceMediaAssetCount: number
    inputArtifactCount: number
    processedArtifactCount: number
    privateMediaArtifactCount: number
    mediaArtifactCount: number
    workersStarted: 0
    workerHandlersStarted: number
    toolsExecuted: number
    mediaBytesProcessed: boolean
    liveExecutionReady: false
    internalResultReviewReady: true
    previewReviewReady: true
    renderPreviewReady: false
    finalRenderReady: false
    processedArtifacts?: Array<{
      artifactId: string
      sourceArtifactId: string
      sourceMediaAssetId: string
      uploadedOrder: number
      workItemId: string
      outputId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: true
      processedMediaArtifact: true
      sourceMediaBound: true
      mimeType: string
      sha256: string
	      byteSize: number
	      durationSeconds: number
	      processingMode: string
	      audioExecutionReview?: {
	        id: string
	        sourceMediaAssetId: string
	        sourceArtifactId: string
	        processedArtifactId: string
	        mode: string
	        status: string
	        sourceAudioArtifactId: string
	        toolExecutionPlanId: string
	        loudnessStatus: string
	        normalizationStatus: string
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
	      }
	      approvedSourceRange: {
        source: string
        clipId?: string
        sourceSequenceItemId?: string
        startSeconds: number
        durationSeconds: number
        endSeconds: number
        requestedMaxDurationSeconds: number
        reason: string
      }
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
      qaStatus: string
	      previewReviewEligible: true
	      finalRenderEligible: false
	    }>
	    audioExecutionReviewCount?: number
	    audioExecutionQaGateCount?: number
	    audioExecutionBlockingQaGateCount?: number
	    captionExecutionPackage?: ApprovedEditExecutionPrivateCaptionPackageClientModel
    finalRenderReadiness: {
      ready: false
      reason: string
      processedArtifactIds: string[]
      mediaQaRequiredArtifactIds: string[]
      privateMediaArtifactCount: number
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionPrivateMediaArtifactQaReviewClientInput {
  workspaceId: string
  projectId: string
  localMediaProcessingExecutionId: string
  creditReservationId: string
  qaReviewOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionPrivateMediaArtifactQaReviewClientResult {
  privateMediaArtifactQaReview?: {
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
    status: string
    qaReviewOnly: true
    reviewedArtifactCount: number
    passedArtifactCount: number
    blockedArtifactCount: number
    privateMediaArtifactCount: number
    mediaArtifactCount: number
    workersStarted: 0
    workerHandlersStarted: 0
    toolsExecuted: 0
    mediaBytesProcessed: false
    liveExecutionReady: false
    internalResultReviewReady: true
    previewReviewReady: true
    renderPreviewReady: false
    finalRenderReady: false
    qaResults?: Array<{
      id: string
      artifactId: string
      sourceMediaAssetId: string
      workItemId: string
      qaStatus: string
      mediaArtifactQaPassed: boolean
      sourceMediaBound: boolean
      previewReviewEligible: true
      finalRenderEligible: false
      blocksFinalRender: true
      requiredBeforePreviewAssembly: true
      requiredBeforeFinalExport: true
      reason: string
    }>
    finalRenderReadiness: {
      ready: false
      reason: string
      mediaQaPassedArtifactIds: string[]
      renderPreviewAssemblyRequiredArtifactIds: string[]
      privateMediaArtifactCount: number
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionRenderPreviewAssemblyClientInput {
  workspaceId: string
  projectId: string
  privateMediaArtifactQaReviewId: string
  creditReservationId: string
  assemblyOnly?: true
  adapterWorkerArtifactIntegrationId?: string
  privateMediaRunnerQaReviewId?: string
  userId?: string
}

export interface ApprovedEditExecutionRenderPreviewAssemblyClientResult {
  renderPreviewAssembly?: {
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
    status: string
    assemblyOnly: true
    previewClipCount: number
    privatePreviewArtifactCount: number
    privateBrowserCaptureCount?: number
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
    previewClips?: Array<{
      clipRefId: string
      processedArtifactId: string
      sourceMediaAssetId: string
      uploadedOrder: number
      segmentId?: string
      segmentOrder?: number
      segmentLabel?: string
      approvedReviewOverlay?: {
        title: string
        subtitle?: string
        source: string
        safeForPrivateReview: true
      }
      approvedCaptionOverlay?: {
        text: string
        captionTimingItemId: string
        source: string
        safeForPrivateReview: true
        transcriptWorkerOutput: false
      }
      approvedTransitionPolish?: {
        fadeInSeconds?: number
        fadeOutSeconds?: number
        transitionTimingItemIds: string[]
        source: string
        safeForPrivateReview: true
      }
      approvedVisualPolish?: {
        colorPipelinePlanId: string
        colorGradeStyle: string
        intensity: string
        operationIds: string[]
        operationLabels: string[]
        source: string
        toolId: string
        fullColorPipelineExecuted: false
        safeForPrivateReview: true
      }
      approvedBrowserCapture?: {
        artifactId: string
        operationId: string
        storageObjectPath: string
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
      assemblySource: string
      workItemId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath?: never
      mimeType: string
      sha256: string
      byteSize: number
      durationSeconds: number
      approvedSourceRange: {
        source: string
        clipId?: string
        sourceSequenceItemId?: string
        startSeconds: number
        durationSeconds: number
        endSeconds: number
        requestedMaxDurationSeconds: number
        reason: string
      }
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      previewReviewEligible: true
      finalRenderEligible: false
    }>
    captionExecutionPackage?: ApprovedEditExecutionPrivateCaptionPackageClientModel
    adapterQaIntegration?: {
      adapterWorkerArtifactIntegrationId: string | null
      privateMediaRunnerQaReviewId: string
      registeredRunnerRunId: string
      boundedAdapterExecutionRunId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      renderIntegrationManifestArtifactId: string | null
      reviewedActivityCount: number
      passedActivityCount: number
      artifactCount: number
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      renderPreviewIntegrationReady: true
      finalRenderDecisionManifestEligible: true
      mediaTransformOutputEligible: false
      productRuntimeExecuted: false
      professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTraceClientModel | null
      artifacts: Array<{
        artifactId: string
        activityExecutionId: string
        canonicalToolId: string
        storageProvider: string
        storageObjectPath: string
        mimeType: string
        sha256: string
        byteSize: number
        sourceOfTruthScope: string
        privateArtifact: true
        publicArtifact: false
        signedUrl: null
      }>
    }
    privateBrowserCaptureArtifacts?: Array<{
      artifactId: string
      operationId: string
      storageObjectPath: string
      mimeType: 'image/png'
      sha256: string
      byteSize: number
      width: 640
      height: 360
      sourceSpecSha256: string
      rendererLayerIds: string[]
      segmentIds: string[]
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
    }>
    previewManifestArtifact: {
      artifactId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath?: never
      mimeType: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      sha256: string
      byteSize: number
      clipCount: number
      previewReviewEligible: true
      finalRenderEligible: false
    }
    finalRenderReadiness: {
      ready: false
      reason: string
      previewManifestArtifactId: string
      previewClipArtifactIds: string[]
      userPreviewReviewRequired: true
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionUserPreviewReviewClientInput {
  workspaceId: string
  projectId: string
  renderPreviewAssemblyId: string
  creditReservationId: string
  reviewOnly?: true
  reviewDecision: 'approved_for_final_render_readiness' | 'changes_requested'
  reviewerNote?: string
  userId?: string
}

export interface ApprovedEditExecutionUserPreviewReviewClientResult {
  userPreviewReview?: {
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
    status: string
    reviewOnly: true
    reviewDecision: string
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
      nextReviewRequired: string
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionFinalRenderReadinessReviewClientInput {
  workspaceId: string
  projectId: string
  userPreviewReviewId: string
  creditReservationId: string
  readinessReviewOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionFinalRenderReadinessReviewClientResult {
  finalRenderReadinessReview?: {
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
    status: string
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
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionFinalRenderExecutionClientInput {
  workspaceId: string
  projectId: string
  finalRenderReadinessReviewId: string
  creditReservationId: string
  renderExecutionOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionFinalRenderExecutionClientResult {
  finalRenderExecution?: {
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
    status: string
    renderExecutionOnly: true
    previewClipCount: number
    finalRenderArtifactCount: number
    mediaArtifactCount: number
    workersStarted: 0
    workerHandlersStarted: number
    toolsExecuted: number
    mediaBytesProcessed: boolean
    liveExecutionReady: false
    internalResultReviewReady: true
    previewReviewReady: true
    renderPreviewReady: true
    finalRenderReady: true
    finalExportReady: false
    finalRenderArtifact: {
      artifactId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      mimeType: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: true
      finalRenderArtifact: true
      durationSeconds: number
      width: number
      height: number
      sha256: string
      byteSize: number
      commandSummary: {
        tool: 'ffmpeg'
        mode: string
        inputCount: number
        videoCodec: string
        audioMode: string
        audioPolish?: {
          applied: boolean
          source: string
          targetIntegratedLufs: number
          truePeakDb: number
          loudnessRangeLufs: number
          limiter: boolean
          filterChain: string[]
        }
        reviewOverlayCount: number
        approvedFinalTimingCount?: number
        approvedFinalTimelineDurationSeconds?: number
        approvedCaptionOverlayCount: number
        approvedTransitionPolishCount: number
        approvedVisualPolishCount?: number
        visualPolish?: {
          applied: boolean
          source: string
          toolId: string
          fullColorPipelineExecuted: false
          clipCount: number
          colorGradeStyles: string[]
          operationLabels: string[]
          filterChain: string[]
        }
        privateCaptionArtifactCount?: number
        privateCaptionFormats?: string[]
        privateCaptionSource?: string
      }
      editDecisionManifest?: ProfessionalEditDecisionManifestClientModel
      editDecisionManifestArtifact?: ProfessionalEditDecisionManifestArtifactClientModel
      deliveryQaRequired: true
      finalDeliveryEligible: false
    }
    finalDeliveryReadiness: {
      ready: false
      reason: string
      finalRenderArtifactId: string
      deliveryQaRequired: true
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionFinalDeliveryQaReviewClientInput {
  workspaceId: string
  projectId: string
  finalRenderExecutionId: string
  creditReservationId: string
  qaReviewOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionFinalDeliveryQaReviewClientResult {
  finalDeliveryQaReview?: {
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
    status: string
    qaReviewOnly: true
    finalArtifactQaPassed: boolean
    privateInternalDownloadReady: boolean
    publicDeliveryReady: boolean
    externalBetaReady: boolean
    productionReady: boolean
    finalExportReady: boolean
    finalRenderArtifactCount: number
    mediaArtifactCount: number
    workersStarted: 0
    workerHandlersStarted: 0
    toolsExecuted: 0
    mediaBytesProcessed: false
    liveExecutionReady: false
    renderPreviewReady: true
    finalRenderReady: true
    professionalEditQaSummary?: {
      source: string
      approvedReviewOverlayCount: number
      approvedCaptionOverlayCount: number
      privateCaptionArtifactCount: number
      privateCaptionFormats: string[]
      approvedTransitionPolishCount: number
      approvedVisualPolishCount: number
      approvedFinalTimingCount: number
      approvedFinalTimelineDurationSeconds: number
      audioPolishApplied: boolean
      visualPolishApplied: boolean
      visualPolishToolId: string
      fullColorPipelineExecuted: false
      editDecisionManifestReady: boolean
      editDecisionManifestArtifactReady: boolean
      privateInternalQaReady: boolean
    }
    finalRenderArtifact: {
      artifactId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      mimeType: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: true
      finalRenderArtifact: true
      durationSeconds: number
      width: number
      height: number
      sha256: string
      byteSize: number
      commandSummary: {
        tool: 'ffmpeg'
        mode: string
        inputCount: number
        videoCodec: string
        audioMode: string
        audioPolish?: {
          applied: boolean
          source: string
          targetIntegratedLufs: number
          truePeakDb: number
          loudnessRangeLufs: number
          limiter: boolean
          filterChain: string[]
        }
        reviewOverlayCount: number
        approvedFinalTimingCount?: number
        approvedFinalTimelineDurationSeconds?: number
        approvedCaptionOverlayCount: number
        approvedTransitionPolishCount: number
        approvedVisualPolishCount?: number
        visualPolish?: {
          applied: boolean
          source: string
          toolId: string
          fullColorPipelineExecuted: false
          clipCount: number
          colorGradeStyles: string[]
          operationLabels: string[]
          filterChain: string[]
        }
        privateCaptionArtifactCount?: number
        privateCaptionFormats?: string[]
        privateCaptionSource?: string
      }
      editDecisionManifest?: ProfessionalEditDecisionManifestClientModel
      editDecisionManifestArtifact?: ProfessionalEditDecisionManifestArtifactClientModel
      deliveryQaRequired: true
      finalDeliveryEligible: false
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export interface ApprovedEditExecutionPrivateInternalDownloadDeliveryClientInput {
  workspaceId: string
  projectId: string
  finalDeliveryQaReviewId: string
  creditReservationId: string
  deliveryOnly?: true
  userId?: string
}

export interface ApprovedEditExecutionPrivateInternalDownloadDeliveryClientResult {
  privateInternalDownloadDelivery?: {
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
    status: string
    deliveryOnly: true
    privateInternalDownloadReady: true
    publicDeliveryReady: boolean
    externalBetaReady: boolean
    productionReady: boolean
    finalExportReady: true
    internalDownloadPath: string
    internalManifestPath?: string
    professionalEditQaSummary?: {
      source: string
      approvedReviewOverlayCount: number
      approvedCaptionOverlayCount: number
      privateCaptionArtifactCount: number
      privateCaptionFormats: string[]
      approvedTransitionPolishCount: number
      approvedVisualPolishCount: number
      approvedFinalTimingCount: number
      approvedFinalTimelineDurationSeconds: number
      audioPolishApplied: boolean
      visualPolishApplied: boolean
      visualPolishToolId: string
      fullColorPipelineExecuted: false
      editDecisionManifestReady: boolean
      editDecisionManifestArtifactReady: boolean
      privateInternalQaReady: boolean
    }
    finalRenderArtifact: {
      artifactId: string
      storageProvider: string
      storageObjectPath: string
      localFilePath: string
      mimeType: string
      privateArtifact: true
      publicArtifact: false
      signedUrl: null
      sourceOfTruth: true
      sourceOfTruthScope: string
      mediaArtifact: true
      finalRenderArtifact: true
      durationSeconds: number
      width: number
      height: number
      sha256: string
      byteSize: number
      commandSummary: {
        tool: 'ffmpeg'
        mode: string
        inputCount: number
        videoCodec: string
        audioMode: string
        audioPolish?: {
          applied: boolean
          source: string
          targetIntegratedLufs: number
          truePeakDb: number
          loudnessRangeLufs: number
          limiter: boolean
          filterChain: string[]
        }
        reviewOverlayCount: number
        approvedFinalTimingCount?: number
        approvedFinalTimelineDurationSeconds?: number
        approvedCaptionOverlayCount: number
        approvedTransitionPolishCount: number
        approvedVisualPolishCount?: number
        visualPolish?: {
          applied: boolean
          source: string
          toolId: string
          fullColorPipelineExecuted: false
          clipCount: number
          colorGradeStyles: string[]
          operationLabels: string[]
          filterChain: string[]
        }
        privateCaptionArtifactCount?: number
        privateCaptionFormats?: string[]
        privateCaptionSource?: string
      }
      editDecisionManifest?: ProfessionalEditDecisionManifestClientModel
      editDecisionManifestArtifact?: ProfessionalEditDecisionManifestArtifactClientModel
      deliveryQaRequired: true
      finalDeliveryEligible: false
    }
    nextRequiredGate: string
    blockers: string[]
    userFacingSummary: string
    noRuntimeSideEffects: string[]
  }
  warnings?: string[]
}

export async function createApprovedEditExecutionPackageClient(
  input: ApprovedEditExecutionPackageClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPackageClientResult>> {
  const approvedSnapshot = createExecutionSafeApprovedSnapshotPayload(input.approvedSnapshot)
  return callReeditProApi<ApprovedEditExecutionPackageClientInput, ApprovedEditExecutionPackageClientResult>(
    'editExecution.package.create',
    {
      ...input,
      approvedSnapshot,
    },
    {
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function getApprovedEditExecutionBoundedAdapterExecutionGateClient(
  input: ApprovedEditExecutionBoundedAdapterExecutionGateClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionBoundedAdapterExecutionGateClientResult>> {
  return callReeditProApi<undefined, ApprovedEditExecutionBoundedAdapterExecutionGateClientResult>(
    'editExecution.boundedAdapterExecutionGate.get',
    undefined,
    {
      params: { packageRecordId: input.packageRecordId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionBoundedAdapterSourceTruthReviewClient(
  input: ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientInput, ApprovedEditExecutionBoundedAdapterSourceTruthReviewClientResult>(
    'editExecution.boundedAdapterSourceTruthReview.create',
    {
      ...input,
      packageReadinessEvidence: input.packageReadinessEvidence ?? [],
      modelWeightApprovals: input.modelWeightApprovals ?? [],
    },
    {
      params: { packageRecordId: input.packageRecordId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionBoundedAdapterExecutionRunClient(
  input: ApprovedEditExecutionBoundedAdapterExecutionRunClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionBoundedAdapterExecutionRunClientResult>> {
  return callReeditProApi<ApprovedEditExecutionBoundedAdapterExecutionRunClientInput, ApprovedEditExecutionBoundedAdapterExecutionRunClientResult>(
    'editExecution.boundedAdapterExecutionRun.create',
    {
      ...input,
      handoffOnly: true,
    },
    {
      params: { packageRecordId: input.packageRecordId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionRegisteredAdapterRunnerProbeClient(
  input: ApprovedEditExecutionRegisteredAdapterRunnerProbeClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionRegisteredAdapterRunnerProbeClientResult>> {
  return callReeditProApi<ApprovedEditExecutionRegisteredAdapterRunnerProbeClientInput, ApprovedEditExecutionRegisteredAdapterRunnerProbeClientResult>(
    'editExecution.registeredAdapterRunnerProbe.create',
    {
      ...input,
      importProbeOnly: true,
    },
    {
      params: { boundedAdapterExecutionRunId: input.boundedAdapterExecutionRunId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClient(
  input: ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientResult>> {
  return callReeditProApi<ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientInput, ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClientResult>(
    'editExecution.registeredAdapterPrivateMediaRunner.create',
    {
      ...input,
      privateMediaExecutionOnly: true,
    },
    {
      params: { registeredRunnerRunId: input.registeredRunnerRunId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClient(
  input: ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientInput, ApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClientResult>(
    'editExecution.registeredAdapterPrivateMediaRunnerQa.review',
    {
      ...input,
      qaReviewOnly: true,
    },
    {
      params: { privateMediaRunnerRunId: input.privateMediaRunnerRunId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionAdapterWorkerArtifactIntegrationClient(
  input: ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientResult>> {
  return callReeditProApi<ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientInput, ApprovedEditExecutionAdapterWorkerArtifactIntegrationClientResult>(
    'editExecution.adapterWorkerArtifactIntegration.create',
    {
      ...input,
      integrationOnly: true,
    },
    {
      params: { privateMediaRunnerQaReviewId: input.privateMediaRunnerQaReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionPrivateInternalTestRunClient(
  input: ApprovedEditExecutionPrivateInternalTestRunClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalTestRunClientResult>> {
  const approvedSnapshot = createExecutionSafeApprovedSnapshotPayload(input.approvedSnapshot)
  return callReeditProApi<ApprovedEditExecutionPrivateInternalTestRunClientInput, ApprovedEditExecutionPrivateInternalTestRunClientResult>(
    'editExecution.privateInternalTestRun.create',
    {
      ...input,
      approvedSnapshot,
      requestedAdapterToolNames: input.requestedAdapterToolNames ?? [],
      packageReadyToolIds: [],
      modelWeightApprovedToolIds: [],
      internalTestRunOnly: true,
      processingMode: input.processingMode ?? 'private_internal_review_render',
    },
    {
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export function createExecutionSafeApprovedSnapshotPayload(
  approvedSnapshot: ApprovedPlanSnapshot | Record<string, unknown>,
): Record<string, unknown> {
  return stripExecutionIrrelevantApprovedSnapshotMetadata(cloneJsonRecord(approvedSnapshot)) as Record<string, unknown>
}

function cloneJsonRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function stripExecutionIrrelevantApprovedSnapshotMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripExecutionIrrelevantApprovedSnapshotMetadata(item))
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) =>
        !EXECUTION_IRRELEVANT_APPROVED_SNAPSHOT_KEYS.has(key) &&
        !EXECUTION_IRRELEVANT_POLICY_MARKER_KEYS.has(key)
      )
      .map(([key, nested]) => [key, stripExecutionIrrelevantApprovedSnapshotMetadata(nested)]),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function fetchApprovedEditExecutionPrivateInternalDownloadFileClient(
  privateInternalDownloadPath: string,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>> {
  const runtime = getBackendRuntimeStatus()
  const apiBaseUrl = getBackendApiBaseUrl()

  if (runtime.mockOnly || !apiBaseUrl) {
    return createApiErrorResponse(
      'backend_api_base_url_missing',
      'Private review downloads require the reviewed backend HTTP runtime.',
      {
        statusCode: 503,
        warnings: [
          'No private download fetch was attempted.',
          ...runtime.warnings,
        ],
        mockOnly: true,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
  }

  if (!isPrivateInternalDownloadPath(privateInternalDownloadPath)) {
    return createApiErrorResponse(
      'invalid_private_download_path',
      'Private review download path is not a reviewed internal edit-execution download route.',
      {
        statusCode: 400,
        warnings: ['Signed URLs, public URLs, and arbitrary file paths are not accepted as source truth.'],
        mockOnly: false,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
  }

  try {
    const headers = new Headers()
    headers.set('accept', 'video/mp4,application/octet-stream')
    headers.set('x-request-id', `private-internal-download-${Date.now().toString(36)}`)

    await applyReeditProApiAuthorizationHeaders(headers)

    const response = await fetch(resolveBackendFileUrl(apiBaseUrl, privateInternalDownloadPath), {
      method: 'GET',
      credentials: 'omit',
      headers,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return createApiErrorResponse(
        'private_internal_download_failed',
        text.trim() || `Private review download failed with status ${response.status}.`,
        {
          statusCode: response.status,
          warnings: ['No public artifact, signed URL, or production delivery was created.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
    }

    if (!responseHasNoStoreCachePolicy(response)) {
      return createApiErrorResponse(
        'private_internal_download_cache_policy_failed',
        'Private review download response is missing the required no-store cache policy.',
        {
          statusCode: 502,
          warnings: ['The private review MP4 was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
    }

    if (!responseContentTypeMatches(response, /^video\/mp4\b/i)) {
      return createApiErrorResponse(
        'private_internal_download_content_type_failed',
        'Private review download response is not an MP4 review file.',
        {
          statusCode: 502,
          warnings: ['The private review MP4 was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
    }

    if (!responseHasAttachmentDisposition(response)) {
      return createApiErrorResponse(
        'private_internal_download_disposition_failed',
        'Private review download response is missing an attachment disposition.',
        {
          statusCode: 502,
          warnings: ['The private review MP4 was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
    }

    const blob = await response.blob()
    const mimeType = (response.headers.get('content-type') ?? blob.type) || 'video/mp4'
    const contentLength = Number(response.headers.get('content-length'))
    const byteSize = Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : blob.size

    return createApiSuccessResponse<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>({
      blob,
      fileName: parseContentDispositionFileName(response.headers.get('content-disposition')) ?? 'reeditpro-private-review.mp4',
      mimeType,
      byteSize,
      privateInternalDownloadPath,
    }, {
      warnings: ['Private review download fetched through authenticated backend transport. Public delivery remains blocked.'],
      mockOnly: false,
    })
  } catch (error) {
    return createApiErrorResponse(
      'private_internal_download_transport_failed',
      error instanceof Error ? error.message : 'Private review download transport failed.',
      {
        statusCode: 503,
        warnings: ['No public artifact, signed URL, or production delivery was created.'],
        mockOnly: false,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadFileClientResult>
  }
}

export async function fetchApprovedEditExecutionPrivateInternalDownloadManifestClient(
  privateInternalManifestPath: string,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>> {
  const runtime = getBackendRuntimeStatus()
  const apiBaseUrl = getBackendApiBaseUrl()

  if (runtime.mockOnly || !apiBaseUrl) {
    return createApiErrorResponse(
      'backend_api_base_url_missing',
      'Private edit decision manifest downloads require the reviewed backend HTTP runtime.',
      {
        statusCode: 503,
        warnings: [
          'No private manifest fetch was attempted.',
          ...runtime.warnings,
        ],
        mockOnly: true,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
  }

  if (!isPrivateInternalManifestPath(privateInternalManifestPath)) {
    return createApiErrorResponse(
      'invalid_private_manifest_path',
      'Private edit decision manifest path is not a reviewed internal edit-execution manifest route.',
      {
        statusCode: 400,
        warnings: ['Signed URLs, public URLs, and arbitrary file paths are not accepted as source truth.'],
        mockOnly: false,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
  }

  try {
    const headers = new Headers()
    headers.set('accept', 'application/json')
    headers.set('x-request-id', `private-internal-manifest-${Date.now().toString(36)}`)

    await applyReeditProApiAuthorizationHeaders(headers)

    const response = await fetch(resolveBackendFileUrl(apiBaseUrl, privateInternalManifestPath), {
      method: 'GET',
      credentials: 'omit',
      headers,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return createApiErrorResponse(
        'private_internal_manifest_download_failed',
        text.trim() || `Private edit decision manifest download failed with status ${response.status}.`,
        {
          statusCode: response.status,
          warnings: ['No public artifact, signed URL, or production delivery was created.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
    }

    if (!responseHasNoStoreCachePolicy(response)) {
      return createApiErrorResponse(
        'private_internal_manifest_cache_policy_failed',
        'Private edit decision manifest response is missing the required no-store cache policy.',
        {
          statusCode: 502,
          warnings: ['The private edit decision manifest was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
    }

    if (!responseContentTypeMatches(response, /^application\/json\b/i)) {
      return createApiErrorResponse(
        'private_internal_manifest_content_type_failed',
        'Private edit decision manifest response is not JSON.',
        {
          statusCode: 502,
          warnings: ['The private edit decision manifest was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
    }

    if (!responseHasAttachmentDisposition(response)) {
      return createApiErrorResponse(
        'private_internal_manifest_disposition_failed',
        'Private edit decision manifest response is missing an attachment disposition.',
        {
          statusCode: 502,
          warnings: ['The private edit decision manifest was not accepted by the browser client.'],
          mockOnly: false,
        },
      ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
    }

    const text = await response.text()
    const manifest = JSON.parse(text) as ProfessionalEditDecisionManifestClientModel
    const blob = new Blob([text], { type: (response.headers.get('content-type') ?? 'application/json') || 'application/json' })
    const contentLength = Number(response.headers.get('content-length'))
    const byteSize = Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : blob.size

    return createApiSuccessResponse<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>({
      manifest,
      blob,
      fileName: parseContentDispositionFileName(response.headers.get('content-disposition')) ?? 'reeditpro-edit-decision-manifest.json',
      mimeType: blob.type || 'application/json',
      byteSize,
      privateInternalManifestPath,
    }, {
      warnings: ['Private edit decision manifest fetched through authenticated backend transport. Public delivery remains blocked.'],
      mockOnly: false,
    })
  } catch (error) {
    return createApiErrorResponse(
      'private_internal_manifest_transport_failed',
      error instanceof Error ? error.message : 'Private edit decision manifest transport failed.',
      {
        statusCode: 503,
        warnings: ['No public artifact, signed URL, or production delivery was created.'],
        mockOnly: false,
      },
    ) as ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadManifestClientResult>
  }
}

export async function createApprovedEditExecutionLocalWorkerOutputClient(
  input: ApprovedEditExecutionLocalWorkerOutputClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionLocalWorkerOutputClientResult>> {
  return callReeditProApi<ApprovedEditExecutionLocalWorkerOutputClientInput, ApprovedEditExecutionLocalWorkerOutputClientResult>(
    'editExecution.localWorkerOutput.persist',
    {
      ...input,
      localOutputOnly: true,
    },
    {
      params: { resultReconciliationId: input.resultReconciliationId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionLocalWorkerOutputQaReviewClient(
  input: ApprovedEditExecutionLocalWorkerOutputQaReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionLocalWorkerOutputQaReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionLocalWorkerOutputQaReviewClientInput, ApprovedEditExecutionLocalWorkerOutputQaReviewClientResult>(
    'editExecution.localWorkerOutputQa.review',
    {
      ...input,
      qaReviewOnly: true,
    },
    {
      params: { localWorkerOutputId: input.localWorkerOutputId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionWorkflowRehearsalClient(
  input: ApprovedEditExecutionWorkflowRehearsalClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionWorkflowRehearsalClientResult>> {
  return callReeditProApi<ApprovedEditExecutionWorkflowRehearsalClientInput, ApprovedEditExecutionWorkflowRehearsalClientResult>(
    'editExecution.workflowRehearsal.run',
    {
      ...input,
      rehearsalOnly: true,
    },
    {
      params: { localWorkerOutputId: input.localWorkerOutputId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionUploadedMediaWorkerExecutionClient(
  input: ApprovedEditExecutionUploadedMediaWorkerExecutionClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionUploadedMediaWorkerExecutionClientResult>> {
  return callReeditProApi<ApprovedEditExecutionUploadedMediaWorkerExecutionClientInput, ApprovedEditExecutionUploadedMediaWorkerExecutionClientResult>(
    'editExecution.uploadedMediaWorkerExecution.create',
    {
      ...input,
      uploadedMediaExecutionOnly: true,
      sourceMediaAssets: input.sourceMediaAssets.map((asset) => ({
        ...asset,
        privateArtifact: true,
        publicUrl: null,
        signedUrl: null,
      })),
    },
    {
      params: { workflowRehearsalId: input.workflowRehearsalId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionPrivateWorkerArtifactQaReviewClient(
  input: ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientInput, ApprovedEditExecutionPrivateWorkerArtifactQaReviewClientResult>(
    'editExecution.privateWorkerArtifactQa.review',
    {
      ...input,
      qaReviewOnly: true,
    },
    {
      params: { uploadedMediaWorkerExecutionId: input.uploadedMediaWorkerExecutionId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionLocalMediaProcessingExecutionClient(
  input: ApprovedEditExecutionLocalMediaProcessingExecutionClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionLocalMediaProcessingExecutionClientResult>> {
  return callReeditProApi<ApprovedEditExecutionLocalMediaProcessingExecutionClientInput, ApprovedEditExecutionLocalMediaProcessingExecutionClientResult>(
    'editExecution.localMediaProcessingExecution.create',
    {
      ...input,
      processingExecutionOnly: true,
      processingMode: input.processingMode ?? 'bounded_preview_render',
    },
    {
      params: { privateWorkerArtifactQaReviewId: input.privateWorkerArtifactQaReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionPrivateMediaArtifactQaReviewClient(
  input: ApprovedEditExecutionPrivateMediaArtifactQaReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateMediaArtifactQaReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionPrivateMediaArtifactQaReviewClientInput, ApprovedEditExecutionPrivateMediaArtifactQaReviewClientResult>(
    'editExecution.privateMediaArtifactQa.review',
    {
      ...input,
      qaReviewOnly: true,
    },
    {
      params: { localMediaProcessingExecutionId: input.localMediaProcessingExecutionId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionRenderPreviewAssemblyClient(
  input: ApprovedEditExecutionRenderPreviewAssemblyClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionRenderPreviewAssemblyClientResult>> {
  return callReeditProApi<ApprovedEditExecutionRenderPreviewAssemblyClientInput, ApprovedEditExecutionRenderPreviewAssemblyClientResult>(
    'editExecution.renderPreviewAssembly.create',
    {
      ...input,
      assemblyOnly: true,
    },
    {
      params: { privateMediaArtifactQaReviewId: input.privateMediaArtifactQaReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionUserPreviewReviewClient(
  input: ApprovedEditExecutionUserPreviewReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionUserPreviewReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionUserPreviewReviewClientInput, ApprovedEditExecutionUserPreviewReviewClientResult>(
    'editExecution.userPreviewReview.create',
    {
      ...input,
      reviewOnly: true,
    },
    {
      params: { renderPreviewAssemblyId: input.renderPreviewAssemblyId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionFinalRenderReadinessReviewClient(
  input: ApprovedEditExecutionFinalRenderReadinessReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionFinalRenderReadinessReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionFinalRenderReadinessReviewClientInput, ApprovedEditExecutionFinalRenderReadinessReviewClientResult>(
    'editExecution.finalRenderReadinessReview.create',
    {
      ...input,
      readinessReviewOnly: true,
    },
    {
      params: { userPreviewReviewId: input.userPreviewReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionFinalRenderExecutionClient(
  input: ApprovedEditExecutionFinalRenderExecutionClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionFinalRenderExecutionClientResult>> {
  return callReeditProApi<ApprovedEditExecutionFinalRenderExecutionClientInput, ApprovedEditExecutionFinalRenderExecutionClientResult>(
    'editExecution.finalRenderExecution.create',
    {
      ...input,
      renderExecutionOnly: true,
    },
    {
      params: { finalRenderReadinessReviewId: input.finalRenderReadinessReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionFinalDeliveryQaReviewClient(
  input: ApprovedEditExecutionFinalDeliveryQaReviewClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionFinalDeliveryQaReviewClientResult>> {
  return callReeditProApi<ApprovedEditExecutionFinalDeliveryQaReviewClientInput, ApprovedEditExecutionFinalDeliveryQaReviewClientResult>(
    'editExecution.finalDeliveryQa.review',
    {
      ...input,
      qaReviewOnly: true,
    },
    {
      params: { finalRenderExecutionId: input.finalRenderExecutionId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionPrivateInternalDownloadDeliveryClient(
  input: ApprovedEditExecutionPrivateInternalDownloadDeliveryClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionPrivateInternalDownloadDeliveryClientResult>> {
  return callReeditProApi<ApprovedEditExecutionPrivateInternalDownloadDeliveryClientInput, ApprovedEditExecutionPrivateInternalDownloadDeliveryClientResult>(
    'editExecution.privateInternalDownloadDelivery.create',
    {
      ...input,
      deliveryOnly: true,
    },
    {
      params: { finalDeliveryQaReviewId: input.finalDeliveryQaReviewId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionResultReconciliationClient(
  input: ApprovedEditExecutionResultReconciliationClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionResultReconciliationClientResult>> {
  return callReeditProApi<ApprovedEditExecutionResultReconciliationClientInput, ApprovedEditExecutionResultReconciliationClientResult>(
    'editExecution.resultReconciliation.create',
    {
      ...input,
      reconcileDryRunOnly: true,
    },
    {
      params: { handlerDryRunId: input.handlerDryRunId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionHandlerDryRunClient(
  input: ApprovedEditExecutionHandlerDryRunClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionHandlerDryRunClientResult>> {
  return callReeditProApi<ApprovedEditExecutionHandlerDryRunClientInput, ApprovedEditExecutionHandlerDryRunClientResult>(
    'editExecution.handlerDryRun.create',
    {
      ...input,
      handlerDryRunOnly: true,
    },
    {
      params: { mockWorkerClaimsId: input.mockWorkerClaimsId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionMockWorkerClaimsClient(
  input: ApprovedEditExecutionMockWorkerClaimsClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionMockWorkerClaimsClientResult>> {
  return callReeditProApi<ApprovedEditExecutionMockWorkerClaimsClientInput, ApprovedEditExecutionMockWorkerClaimsClientResult>(
    'editExecution.mockWorkerClaims.create',
    {
      ...input,
      mockClaimsOnly: true,
    },
    {
      params: { dispatchReadinessId: input.dispatchReadinessId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionJobBatchPlanClient(
  input: ApprovedEditExecutionJobBatchPlanClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionJobBatchPlanClientResult>> {
  return callReeditProApi<ApprovedEditExecutionJobBatchPlanClientInput, ApprovedEditExecutionJobBatchPlanClientResult>(
    'editExecution.jobBatchPlan.create',
    {
      ...input,
      dryRunOnly: true,
    },
    {
      params: { packageRecordId: input.packageRecordId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionMockQueueClient(
  input: ApprovedEditExecutionMockQueueClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionMockQueueClientResult>> {
  return callReeditProApi<ApprovedEditExecutionMockQueueClientInput, ApprovedEditExecutionMockQueueClientResult>(
    'editExecution.mockQueue.create',
    {
      ...input,
      mockQueueOnly: true,
    },
    {
      params: { jobBatchPlanId: input.jobBatchPlanId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

export async function createApprovedEditExecutionDispatchReadinessClient(
  input: ApprovedEditExecutionDispatchReadinessClientInput,
): Promise<ApiResponseEnvelope<ApprovedEditExecutionDispatchReadinessClientResult>> {
  return callReeditProApi<ApprovedEditExecutionDispatchReadinessClientInput, ApprovedEditExecutionDispatchReadinessClientResult>(
    'editExecution.dispatchReadiness.check',
    {
      ...input,
      dryRunOnly: true,
    },
    {
      params: { mockQueueId: input.mockQueueId },
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )
}

function isPrivateInternalDownloadPath(path: string): boolean {
  if (!path.startsWith('/v1/edit-executions/private-internal-downloads/')) {
    return false
  }

  if (!path.endsWith('/file')) {
    return false
  }

  return !/^https?:\/\//i.test(path) && !path.includes('..') && !path.includes('?')
}

function isPrivateInternalManifestPath(path: string): boolean {
  if (!path.startsWith('/v1/edit-executions/private-internal-downloads/')) {
    return false
  }

  if (!path.endsWith('/manifest')) {
    return false
  }

  return !/^https?:\/\//i.test(path) && !path.includes('..') && !path.includes('?')
}

function resolveBackendFileUrl(apiBaseUrl: string, path: string): string {
  return new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`).toString()
}

function responseHasNoStoreCachePolicy(response: Response): boolean {
  return response.headers.get('cache-control')?.split(',').some((directive) =>
    directive.trim().toLowerCase() === 'no-store'
  ) === true
}

function responseContentTypeMatches(response: Response, pattern: RegExp): boolean {
  return pattern.test(response.headers.get('content-type') ?? '')
}

function responseHasAttachmentDisposition(response: Response): boolean {
  return /^attachment(?:;|$)/i.test(response.headers.get('content-disposition') ?? '')
}

function parseContentDispositionFileName(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) {
    return undefined
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  const bareMatch = contentDisposition.match(/filename=([^;]+)/i)
  return bareMatch?.[1]?.trim()
}
