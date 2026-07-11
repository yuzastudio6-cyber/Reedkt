import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import type { ServiceContext } from '../types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import {
  boundedAudioMusicAdapterToolNames,
  boundedInternalAdapterToolNames,
} from '../../src/lib/professional-skills'
import type { PlannerInput } from '../../src/types/reeditpro'
import { resolveProfessionalToolAdapterContract } from '../tool-registry/professional-tool-adapter-contracts'
import {
  getProfessionalToolAdapterBinaryRunnerCommand,
  getProfessionalToolAdapterNodeRunnerPackage,
} from '../tool-registry/professional-tool-adapter-registered-runners'

const professionalAdapterToolNames = [...boundedInternalAdapterToolNames]
const privateInternalAdapterIntegrationContracts = professionalAdapterToolNames
  .map((toolName) => resolveProfessionalToolAdapterContract(toolName))
  .filter((contract): contract is NonNullable<ReturnType<typeof resolveProfessionalToolAdapterContract>> => {
    if (!contract) {
      return false
    }

    return (
      !contract.requiresModelWeightApproval &&
      contract.requiresPackageReadiness &&
      contract.modes.includes('bounded_execution')
    )
  })
const privateInternalStubbedBinaryToolIds = new Set([
  'streamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
])
const privateInternalRenderableAdapterCount = privateInternalAdapterIntegrationContracts.length
const privateInternalBoundedPackageCheckCount = privateInternalAdapterIntegrationContracts.filter((contract) =>
  Boolean(getProfessionalToolAdapterNodeRunnerPackage(contract.canonicalToolId)) ||
  (
    privateInternalStubbedBinaryToolIds.has(contract.canonicalToolId) &&
    Boolean(getProfessionalToolAdapterBinaryRunnerCommand(contract.canonicalToolId))
  )
).length
const audioAdapterToolNames = boundedAudioMusicAdapterToolNames.filter((toolName) => toolName !== 'rnnoise')
const privateInternalHydratedPythonBoundedPackageCheckCount = audioAdapterToolNames.length
const routeSourceTruthReadyAdapterToolNames = [
  'd3',
  'three',
  'streamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
] as const

type PrivateCaptionExecutionPackageSmoke = {
  id: string
  mode: 'local_dev'
  status: string
  source: string
  transcriptSource: string
  approvedPlanSnapshotId: string
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
  safeForPrivateReview: true
  finalRenderEligible: false
}

type RenderPreviewAdapterQaIntegrationSmoke = {
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
  mediaProcessingExecuted: false
  mediaTransformOutputEligible: false
  productRuntimeExecuted: false
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

type AdapterWorkerArtifactIntegrationSmoke = {
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
  status: string
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
  artifacts: Array<{
    artifactId: string
    sourceQaArtifactId: string
    activityExecutionId: string
    canonicalToolId: string
    storageProvider: string
    storageObjectPath: string
    localFilePath: string
    mimeType: string
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
    sourceOfTruth: true
    sourceOfTruthScope: string
    sha256: string
    byteSize: number
    renderIntegrationStatus: string
    finalRenderIntegrationEligible: true
    mediaTransformOutputEligible: false
  }>
  integrationManifestArtifact: {
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
    sha256: string
    byteSize: number
    integratedArtifactCount: number
    previewAssemblyEligible: true
    finalRenderDecisionManifestEligible: true
  }
  blockers: []
  nextRequiredGate: string
  noRuntimeSideEffects: string[]
}

type ProfessionalEditDecisionManifestSmoke = {
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
      source: string
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
      qaGateCount: number
      userFacingActivities: string[]
      warnings: string[]
      blockers: string[]
      editBriefOptional: true
      promptFirstPlanning: true
      noUserVisibleToolNames: true
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
    sourceChecksumSha256ByMediaAssetId: Record<string, string>
    sourceStorageProviderByMediaAssetId: Record<string, string>
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
    source: string
    artifactCount: number
    formats: string[]
  }
  audioQaIntegration: {
    attached: boolean
    source: string
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
    audioQa: number
    audioPolish: number
  }
  decisions: Array<{
    clipRefId: string
    processedArtifactId: string
    processedArtifact: {
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
    sourceStorageProvider: string
    sourceStorageBucket: string | null
    sourceStoragePath: string
    sourceFileName: string
    sourceMimeType: string
    sourceByteSize: number
    uploadedOrder: number
    segment: { id: string | null; order: number | null; label: string | null }
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
    audioExecutionReview: {
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

type ProfessionalEditDecisionManifestArtifactSmoke = {
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

type JsonResponse = {
  ok?: boolean
  data?: {
    approvedEditExecutionPackage?: {
      packageRecordId: string
      createdByUserId: string
      approvedPlanSnapshotId: string
      status: string
      agentCallReady: boolean
      liveExecutionReady: boolean
      resolvedAdapterToolCount: number
      requestedAdapterToolNames: string[]
      packageReadyToolIds: string[]
      modelWeightApprovedToolIds: string[]
      boundedAdapterExecutionReady: boolean
      boundedAdapterReadyToolCount: number
      boundedAdapterBlockedToolCount: number
      boundedAdapterBlockers: string[]
      privateArtifactRefCount: number
      boundedAdapterExecutionGate?: {
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
        noRuntimeSideEffects: string[]
      }
      userFacingSummary: string
      backendHandoffSummary: string
      noRuntimeSideEffects: string[]
    }
    boundedAdapterExecutionGate?: {
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
      noRuntimeSideEffects: string[]
    } | null
    sourceTruthReview?: {
      id: string
      status: string
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
      boundedAdapterExecutionGate: {
        status: string
        readyToolCount: number
        blockedToolCount: number
        clientReadinessHintsTrusted: false
        serverSourceTruthRequired: true
        frontendExecutionAllowed: false
        productReady: false
        noRuntimeSideEffects: string[]
      }
    }
    boundedAdapterExecutionRun?: {
      id: string
      packageRecordId: string
      status: string
      executionMode: string
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
      activityResults: Array<{
        activityResultId: string
        canonicalToolId: string
        status: string
        privateResultManifest: {
          privateArtifact: true
          publicArtifact: false
          signedUrl: null
        }
        runnerBinding: {
          registeredToolRunnerRequired: true
          actualToolPackageExecuted: false
        }
      }>
      nextRequiredGate: string
      userFacingSummary: string
      noRuntimeSideEffects: string[]
    }
    registeredRunnerRun?: {
      id: string
      boundedAdapterExecutionRunId: string
      packageRecordId: string
      workspaceId: string
      projectId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      probeOnly: true
      requestedActivityCount: number
      completedImportProbeCount: number
      blockedRunnerCount: number
      actualToolPackageExecutionCount: number
      mediaProcessingExecuted: false
      frontendExecutionAllowed: false
      productReady: false
      results: Array<{
        canonicalToolId: string
        runtime?: string
        runtimeBinary?: string
        importProbeOnly: true
        status: string
        packageResolved: boolean
        packageImported: boolean
        actualToolPackageExecuted: boolean
      }>
      blockers: string[]
      nextRequiredGate: string
      userFacingSummary: string
      noRuntimeSideEffects: string[]
    }
    privateMediaRunnerRun?: {
      id: string
      registeredRunnerRunId: string
      boundedAdapterExecutionRunId: string
      packageRecordId: string
      workspaceId: string
      projectId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      executionMode: string
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
      activities: Array<{
        canonicalToolId: string
        status: string
        registeredImportProbeReady: true
        privateRunnerResultManifest: {
          privateArtifact: true
          publicArtifact: false
          signedUrl: null
        }
        runnerBoundary: {
          mediaProcessingExecuted: false
          productRuntimeExecuted: false
        }
      }>
      nextRequiredGate: string
      userFacingSummary: string
      noRuntimeSideEffects: string[]
    }
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
      status: string
      qaReviewOnly: true
      reviewedActivityCount: number
      passedActivityCount: number
      blockedActivityCount: number
      artifactCount: number
      mediaProcessingExecuted: false
      productRuntimeExecuted: false
      frontendExecutionAllowed: false
      productReady: false
      artifacts: Array<{
        privateArtifact: true
        publicArtifact: false
        signedUrl: null
        sha256: string
        byteSize: number
        finalRenderIntegrationEligible: false
      }>
      finalRenderIntegrationReadiness: {
        ready: false
        nextRequiredGate: string
      }
      nextRequiredGate: string
      noRuntimeSideEffects: string[]
    }
    adapterWorkerArtifactIntegration?: AdapterWorkerArtifactIntegrationSmoke
    jobBatchPlan?: {
      id: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      dryRunOnly: true
      plannedJobCount: number
      readyToQueueCount: number
      waitingDependencyCount: number
      blockedJobCount: number
      metadataCompleteCount: number
      plannedJobs: Array<{
        id: string
        workItemId: string
        jobType: string
        workerType: string
        status: string
        approvedPlanSnapshotId: string
        creditReservationId: string
        idempotencyKey: string
        dependencyWorkItemIds: string[]
        expectedOutputIds: string[]
        qaChecks: string[]
        payloadJson: Record<string, unknown>
      }>
      noRuntimeSideEffects: string[]
    }
    mockQueue?: {
      id: string
      jobBatchPlanId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      mockQueueOnly: true
      queuedJobCount: number
      waitingDependencyCount: number
      blockedJobCount: number
      metadataCompleteCount: number
      workersStarted: number
      workerClaimsCreated: number
      queuedJobs: Array<{
        id: string
        sourcePlannedJobId: string
        workItemId: string
        status: string
        approvedPlanSnapshotId: string
        creditReservationId: string
        idempotencyKey: string
        payloadJson: Record<string, unknown>
      }>
      noRuntimeSideEffects: string[]
    }
    dispatchReadiness?: {
      id: string
      mockQueueId: string
      jobBatchPlanId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      dryRunOnly: true
      queuedJobCount: number
      readyForClaimCount: number
      blockedByGateCount: number
      workersStarted: number
      workerClaimsCreated: number
      readiness: Array<{
        queuedJobId: string
        workItemId: string
        runtimeJobType: string
        workerType: string
        idempotencyKey: string
        status: string
        requiredGateCount: number
        passedRequiredGateCount: number
        failedRequiredGates: string[]
        gateChecks: Array<{ gate: string; passed: boolean; required: boolean; message: string }>
      }>
      noRuntimeSideEffects: string[]
    }
    mockWorkerClaims?: {
      id: string
      dispatchReadinessId: string
      mockQueueId: string
      jobBatchPlanId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      mockClaimsOnly: true
      claimCount: number
      readyForClaimCount: number
      blockedByGateCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      workerClaims: Array<{
        id: string
        queuedJobId: string
        workItemId: string
        runtimeJobType: string
        workerType: string
        workerInstanceId: string
        claimStatus: string
        approvedPlanSnapshotId: string
        creditReservationId: string
        idempotencyKey: string
        expectedOutputIds: string[]
        qaChecks: string[]
        leaseExpiresAt: string
      }>
      noRuntimeSideEffects: string[]
    }
    handlerDryRun?: {
      id: string
      mockWorkerClaimsId: string
      dispatchReadinessId: string
      mockQueueId: string
      jobBatchPlanId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      handlerDryRunOnly: true
      claimCount: number
      workResultCount: number
      manifestUpdateCount: number
      qaHandoffCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaArtifactsCreated: number
      liveExecutionReady: false
      finalExportReady: false
      workResults: Array<{
        id: string
        workerClaimId: string
        queuedJobId: string
        workItemId: string
        runtimeJobType: string
        workerType: string
        status: string
        approvedPlanSnapshotId: string
        creditReservationId: string
        billableToUser: false
        expectedOutputIds: string[]
        resultArtifactRefs: Array<{
          artifactId: string
          outputId: string
          workItemId: string
          storageProvider: string
          storageObjectPath: string
          privateArtifact: true
          sourceOfTruth: false
          qaStatus: string
        }>
      }>
      assetManifestUpdates: Array<{
        artifactId: string
        outputId: string
        workItemId: string
        storageProvider: string
        storageObjectPath: string
        privateArtifact: true
        sourceOfTruth: false
        qaStatus: string
      }>
      qaHandoffRecords: Array<{
        id: string
        workItemId: string
        workerClaimId: string
        qaStatus: string
        blocksFinalRender: true
      }>
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    resultReconciliation?: {
      id: string
      handlerDryRunId: string
      mockWorkerClaimsId: string
      dispatchReadinessId: string
      mockQueueId: string
      jobBatchPlanId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      reconcileDryRunOnly: true
      workResultCount: number
      manifestItemCount: number
      qaGateCount: number
      sourceOfTruthArtifactCount: number
      finalRenderReady: false
      previewReviewReady: false
      liveExecutionReady: false
      reconciledManifestItems: Array<{
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
      reconciledQAGates: Array<{
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
        sourceOfTruthArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    localWorkerOutput?: {
      id: string
      resultReconciliationId: string
      handlerDryRunId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      localOutputOnly: true
      workResultCount: number
      persistedArtifactCount: number
      sourceOfTruthArtifactCount: number
      mediaArtifactCount: number
      qaPendingCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: false
      finalRenderReady: false
      persistedArtifacts: Array<{
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
      qaHandoffRecords: Array<{
        id: string
        workItemId: string
        artifactId: string
        qaStatus: string
        blocksFinalRender: true
        requiredBeforeFinalExport: true
      }>
      finalRenderReadiness: {
        ready: false
        reason: string
        qaPendingArtifactIds: string[]
        sourceOfTruthArtifactCount: number
        mediaArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    localWorkerOutputQaReview?: {
      id: string
      localWorkerOutputId: string
      resultReconciliationId: string
      handlerDryRunId: string
      packageRecordId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      qaReviewOnly: true
      reviewedArtifactCount: number
      passedArtifactCount: number
      blockedArtifactCount: number
      sourceOfTruthArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: false
      finalRenderReady: false
      qaResults: Array<{
        id: string
        artifactId: string
        workItemId: string
        qaStatus: string
        metadataIntegrityPassed: boolean
        mediaQaRequired: true
        finalRenderEligible: false
        blocksFinalRender: true
        requiredBeforeFinalExport: true
        checks: Array<{ check: string; passed: boolean; message: string }>
      }>
      finalRenderReadiness: {
        ready: false
        reason: string
        metadataQaPassedArtifactIds: string[]
        mediaQaRequiredArtifactIds: string[]
        sourceOfTruthArtifactCount: number
        mediaArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    workflowRehearsal?: {
      id: string
      localWorkerOutputId: string
      resultReconciliationId: string
      handlerDryRunId: string
      packageRecordId: string
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
      report: {
        reportId: string
        scenarioId: string
        mode: string
        status: string
        artifactSummary: {
          totalArtifacts: number
          privateArtifactCount: number
          sourceImmutable: boolean
          signedUrlRejectedCount: number
        }
        qaSummary: {
          total: number
          blocked: number
          finalDeliveryAllowed: boolean
        }
        blockers: string[]
        warnings: string[]
        nextActions: string[]
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    uploadedMediaWorkerExecution?: {
      id: string
      workflowRehearsalId: string
      localWorkerOutputId: string
      localWorkerOutputQaReviewId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      uploadedMediaExecutionOnly: true
      workerExecutionMode: string
      sourceMediaAssetCount: number
      privateWorkerArtifactCount: number
      sourceBoundArtifactCount: number
      mediaArtifactCount: number
      qaPendingCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: false
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: false
      finalRenderReady: false
      sourceMediaAssets: Array<{
        mediaAssetId: string
        storagePath: string
        checksumSha256?: string
        privateArtifact: true
        signedUrl?: null
      }>
      privateWorkerArtifacts: Array<{
        artifactId: string
        sourceMediaAssetId: string
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
      qaHandoffRecords: Array<{
        artifactId: string
        blocksFinalRender: true
        requiredBeforeFinalExport: true
      }>
      finalRenderReadiness: {
        ready: false
        reason: string
        qaPendingArtifactIds: string[]
        sourceMediaAssetCount: number
        privateWorkerArtifactCount: number
        mediaArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    privateWorkerArtifactQaReview?: {
      id: string
      uploadedMediaWorkerExecutionId: string
      workflowRehearsalId: string
      localWorkerOutputId: string
      localWorkerOutputQaReviewId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      qaReviewOnly: true
      reviewedArtifactCount: number
      passedArtifactCount: number
      blockedArtifactCount: number
      sourceBoundArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: false
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: boolean
      renderPreviewReady: false
      finalRenderReady: false
      qaResults: Array<{
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
        mediaArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    localMediaProcessingExecution?: {
      id: string
      privateWorkerArtifactQaReviewId: string
      uploadedMediaWorkerExecutionId: string
      workflowRehearsalId: string
      localWorkerOutputId: string
      localWorkerOutputQaReviewId: string
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
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: true
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: false
      finalRenderReady: false
      processedArtifacts: Array<{
        artifactId: string
        sourceArtifactId: string
        sourceMediaAssetId: string
        uploadedOrder: number
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
	          loudnessStatus: string
	          normalizationStatus: string
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
	      audioExecutionReviewCount: number
	      audioExecutionQaGateCount: number
	      audioExecutionBlockingQaGateCount: number
	      captionExecutionPackage?: PrivateCaptionExecutionPackageSmoke
      finalRenderReadiness: {
        ready: false
        reason: string
        processedArtifactIds: string[]
        mediaQaRequiredArtifactIds: string[]
        privateMediaArtifactCount: number
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    privateMediaArtifactQaReview?: {
      id: string
      localMediaProcessingExecutionId: string
      privateWorkerArtifactQaReviewId: string
      uploadedMediaWorkerExecutionId: string
      workflowRehearsalId: string
      localWorkerOutputId: string
      localWorkerOutputQaReviewId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      qaReviewOnly: true
      reviewedArtifactCount: number
      passedArtifactCount: number
      blockedArtifactCount: number
      privateMediaArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: false
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: false
      finalRenderReady: false
      qaResults: Array<{
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
      noRuntimeSideEffects: string[]
    }
    renderPreviewAssembly?: {
      id: string
      privateMediaArtifactQaReviewId: string
      localMediaProcessingExecutionId: string
      privateWorkerArtifactQaReviewId: string
      uploadedMediaWorkerExecutionId: string
      workflowRehearsalId: string
      localWorkerOutputId: string
      localWorkerOutputQaReviewId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      assemblyOnly: true
      previewClipCount: number
      privatePreviewArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: false
      liveExecutionReady: false
      internalResultReviewReady: true
      previewReviewReady: true
      renderPreviewReady: true
      finalRenderReady: false
      previewClips: Array<{
        clipRefId: string
        processedArtifactId: string
        sourceMediaAssetId: string
        uploadedOrder: number
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
        approvedFinalTiming?: {
          finalTimingItemId: string
          startSeconds: number
          durationSeconds: number
          endSeconds: number
          fps: number
          source: string
          safeForPrivateReview: true
        }
        assemblySource: string
        storageProvider: string
        storageObjectPath: string
        localFilePath: string
        mimeType: string
        sha256: string
        byteSize: number
        durationSeconds: number
        privateArtifact: true
        publicArtifact: false
        signedUrl: null
        previewReviewEligible: true
        finalRenderEligible: false
      }>
      captionExecutionPackage?: PrivateCaptionExecutionPackageSmoke
      adapterQaIntegration?: RenderPreviewAdapterQaIntegrationSmoke
      previewManifestArtifact: {
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
      noRuntimeSideEffects: string[]
    }
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
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      reviewOnly: true
      reviewDecision: string
      previewClipCount: number
      privatePreviewArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
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
      noRuntimeSideEffects: string[]
    }
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
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      readinessReviewOnly: true
      previewApproved: true
      previewClipCount: number
      privatePreviewArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
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
      noRuntimeSideEffects: string[]
    }
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
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      renderExecutionOnly: true
      previewClipCount: number
      finalRenderArtifactCount: number
      mediaArtifactCount: number
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: true
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
          approvedFinalTimingCount: number
          approvedFinalTimelineDurationSeconds: number
          approvedCaptionOverlayCount: number
          approvedTransitionPolishCount: number
          approvedVisualPolishCount: number
          visualPolish: {
            applied: boolean
            source: string
            toolId: string
            fullColorPipelineExecuted: false
            clipCount: number
            colorGradeStyles: string[]
            operationLabels: string[]
            filterChain: string[]
          }
          privateCaptionArtifactCount: number
          privateCaptionFormats: string[]
          privateCaptionSource: string
        }
        editDecisionManifest: ProfessionalEditDecisionManifestSmoke
        editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactSmoke
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
      noRuntimeSideEffects: string[]
    }
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
      finalArtifactProbe?: {
        hasVideo: boolean
        hasAudio: boolean
        width?: number
        height?: number
        durationSeconds?: number
      }
      workersStarted: number
      workerHandlersStarted: number
      toolsExecuted: number
      mediaBytesProcessed: false
      liveExecutionReady: false
      renderPreviewReady: true
      finalRenderReady: true
      qaChecks: Array<{ check: string; passed: boolean; message: string }>
      professionalEditQaSummary: {
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
          approvedFinalTimingCount: number
          approvedFinalTimelineDurationSeconds: number
          approvedCaptionOverlayCount: number
          approvedTransitionPolishCount: number
          approvedVisualPolishCount: number
          visualPolish: {
            applied: boolean
            source: string
            toolId: string
            fullColorPipelineExecuted: false
            clipCount: number
            colorGradeStyles: string[]
            operationLabels: string[]
            filterChain: string[]
          }
          privateCaptionArtifactCount: number
          privateCaptionFormats: string[]
          privateCaptionSource: string
        }
        editDecisionManifest: ProfessionalEditDecisionManifestSmoke
        editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactSmoke
        deliveryQaRequired: true
        finalDeliveryEligible: false
      }
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
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
      internalManifestPath: string
      professionalEditQaSummary: {
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
        sha256: string
        byteSize: number
        commandSummary: {
          tool: 'ffmpeg'
          mode: string
          inputCount: number
          videoCodec: string
          audioMode: string
          reviewOverlayCount: number
          approvedFinalTimingCount: number
          approvedFinalTimelineDurationSeconds: number
          approvedCaptionOverlayCount: number
          approvedTransitionPolishCount: number
          approvedVisualPolishCount: number
          visualPolish: {
            applied: boolean
            source: string
            toolId: string
            fullColorPipelineExecuted: false
            clipCount: number
            colorGradeStyles: string[]
            operationLabels: string[]
            filterChain: string[]
          }
          privateCaptionArtifactCount: number
          privateCaptionFormats: string[]
          privateCaptionSource: string
        }
        editDecisionManifest: ProfessionalEditDecisionManifestSmoke
        editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactSmoke
        deliveryQaRequired: true
        finalDeliveryEligible: false
      }
      workersStarted: 0
      workerHandlersStarted: 0
      toolsExecuted: 0
      mediaBytesProcessed: false
      liveExecutionReady: false
      nextRequiredGate: string
      blockers: string[]
      noRuntimeSideEffects: string[]
    }
    internalTestRun?: {
      id: string
      workspaceId: string
      projectId: string
      approvedPlanSnapshotId: string
      creditReservationId: string
      status: string
      internalTestRunOnly: true
      sourceMediaAssetCount: number
      adapterGateSummary: {
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
        privateRenderIntegrationStatus: string
        privateRenderIntegrationReady: boolean
        privateRenderIntegratedActivityCount: number
        backendIntegrationCandidateCount: number
        backendIntegrationPendingActivityCount: number
        backendIntegrationBlockedActivityCount: number
        backendIntegrationBlockers: string[]
        clientReadinessHintsTrusted: false
        serverSourceTruthRequiredForFullExecution: true
        frontendExecutionAllowed: false
        productReady: false
        userFacingSummary: string
        noRuntimeSideEffects: string[]
      }
      stageIds: Record<string, string | null>
      privateInternalDownloadDelivery: {
        id: string
        createdByUserId: string
        status: string
        privateInternalDownloadReady: true
        publicDeliveryReady: boolean
        externalBetaReady: boolean
        productionReady: boolean
        finalExportReady: true
        internalDownloadPath: string
        internalManifestPath: string
        professionalEditQaSummary: {
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
            approvedFinalTimingCount: number
            approvedFinalTimelineDurationSeconds: number
            approvedCaptionOverlayCount: number
            approvedTransitionPolishCount: number
            approvedVisualPolishCount: number
            visualPolish: {
              applied: boolean
              source: string
              toolId: string
              fullColorPipelineExecuted: false
              clipCount: number
              colorGradeStyles: string[]
              operationLabels: string[]
              filterChain: string[]
            }
            privateCaptionArtifactCount: number
            privateCaptionFormats: string[]
            privateCaptionSource: string
          }
          editDecisionManifest: ProfessionalEditDecisionManifestSmoke
          editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactSmoke
        }
      }
      privateInternalDownloadPath: string
      privateInternalManifestPath: string
      finalRenderArtifact: {
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
          approvedFinalTimingCount: number
          approvedFinalTimelineDurationSeconds: number
          approvedCaptionOverlayCount: number
          approvedTransitionPolishCount: number
          approvedVisualPolishCount: number
          visualPolish: {
            applied: boolean
            source: string
            toolId: string
            fullColorPipelineExecuted: false
            clipCount: number
            colorGradeStyles: string[]
            operationLabels: string[]
            filterChain: string[]
          }
          privateCaptionArtifactCount: number
          privateCaptionFormats: string[]
          privateCaptionSource: string
        }
        editDecisionManifest: ProfessionalEditDecisionManifestSmoke
        editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactSmoke
        finalDeliveryEligible: false
      }
      publicDeliveryReady: boolean
      externalBetaReady: boolean
      productionReady: boolean
      nextRequiredGate: string
      noRuntimeSideEffects: string[]
    }
  }
  error?: { code: string; message: string; status: number }
  warnings?: string[]
}

const localStorageRoot = '/tmp/reeditpro-edit-execution-package-route-smoke'
await rm(localStorageRoot, { force: true, recursive: true })
const stubBinaryRuntime = await createStubBinaryRuntime(['gst-launch-1.0', 'mkvmerge', 'MP4Box'])
const originalPath = process.env.PATH
process.env.PATH = `${stubBinaryRuntime.binDir}:${originalPath ?? ''}`

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const plannerInput: PlannerInput = {
  projectName: 'Route-level execution package edit',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'luxury',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: 'https://example.com/internal-reference',
  customInstructions: 'Create a clean professional edit from uploaded clips and keep implementation details out of the user copy.',
  creditPreference: 'balanced',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)
const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'mock-user',
  editSessionId: 'mock-edit-session-route',
  plan,
  projectId: 'mock-project-route',
})
const compactSnapshot = {
  id: snapshot.id,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  editPlanVersionId: snapshot.editPlanVersionId,
  creditEstimateId: snapshot.creditEstimateId,
  approvedAt: snapshot.approvedAt,
  approvedBy: snapshot.approvedBy,
  compiledIntent: snapshot.compiledIntent,
  sourceSequence: snapshot.sourceSequence,
  segments: snapshot.segments,
  operations: snapshot.operations,
  rendererLayers: snapshot.rendererLayers,
  sourceCleanupPlan: {
    ...snapshot.sourceCleanupPlan,
    decisions: snapshot.sourceCleanupPlan?.decisions.map((decision, index) => index === 0
      ? {
          ...decision,
          sourceRange: {
            ...decision.sourceRange,
            startSeconds: 0.5,
            endSeconds: 2.5,
            durationSeconds: 2,
            notes: [
              ...decision.sourceRange.notes,
              'Route smoke uses a non-zero approved source range to verify private internal processing follows approved trim metadata.',
            ],
          },
        }
      : decision),
  },
  masterTimingPlan: snapshot.masterTimingPlan,
  sourcePlan: {
    goalSummary: snapshot.sourcePlan.goalSummary,
  },
  creditEstimate: snapshot.creditEstimate,
  qaPlan: snapshot.qaPlan,
  colorPipelinePlan: snapshot.colorPipelinePlan,
  editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
  asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
  agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
  toolStrategyPlan: snapshot.toolStrategyPlan,
  professionalSkillPlan: snapshot.professionalSkillPlan,
}

const requestBody = {
  workspaceId: 'mock-workspace-route',
  projectId: snapshot.projectId,
  approvedPlanSnapshotId: snapshot.id,
  approvedSnapshot: compactSnapshot,
  creditReservationId: 'mock-credit-reservation-route',
  requestedAdapterToolNames: [...professionalAdapterToolNames],
  packageReadyToolIds: [...professionalAdapterToolNames],
  modelWeightApprovedToolIds: ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan'],
}

const uploadedSourceMediaAssets = snapshot.sourceSequence.map((item, index) => ({
  mediaAssetId: `media-asset-${item.uploaded_clip_id}`,
  sourceSequenceItemId: item.id,
  uploadedClipId: item.uploaded_clip_id,
  uploadedOrder: item.source_order,
  storageProvider: 'local_private' as const,
  storageBucket: undefined as string | undefined,
  storagePath: `private/source/${snapshot.projectId}/${String(item.source_order).padStart(2, '0')}-${item.uploaded_clip_id}.mp4`,
  fileName: `${String(item.source_order).padStart(2, '0')}-${item.uploaded_clip_id || `clip-${index + 1}`}.mp4`,
  mimeType: 'video/mp4',
  byteSize: 1024 * 1024 * (index + 1),
  checksumSha256: undefined as string | undefined,
  privateArtifact: true as const,
  publicUrl: null,
  signedUrl: null,
}))

for (const asset of uploadedSourceMediaAssets) {
  const fixture = await createSyntheticMp4Fixture({
    localStorageRoot,
    outputPath: join(localStorageRoot, asset.storagePath),
    durationSeconds: 3,
    width: 160,
    height: 90,
  })
  assert.equal(fixture.available, true, `Synthetic uploaded source media fixture should be available for ${asset.mediaAssetId}: ${fixture.warnings.join('; ')}`)
  assert.ok(fixture.sizeBytes && fixture.sizeBytes > 0, 'Synthetic uploaded source media fixture should contain bytes.')
  assert.ok(fixture.checksumSha256 && fixture.checksumSha256.length === 64, 'Synthetic uploaded source media fixture should include checksum evidence.')
  asset.byteSize = fixture.sizeBytes
  asset.checksumSha256 = fixture.checksumSha256
}

requestBody.approvedSnapshot = {
  ...compactSnapshot,
  sourceSequence: compactSnapshot.sourceSequence.map((item) => {
    const asset = uploadedSourceMediaAssets.find((sourceAsset) => sourceAsset.uploadedOrder === item.source_order)

    return {
      ...item,
      approved_media_asset_id: asset?.mediaAssetId,
      approved_source_checksum_sha256: asset?.checksumSha256,
      approved_storage_provider: asset?.storageProvider,
      approved_storage_path: asset?.storagePath,
      approved_file_name: asset?.fileName,
      approved_mime_type: asset?.mimeType,
      approved_byte_size: asset?.byteSize,
    }
  }),
}

const app = createReeditProApiApp(env)
const server = await listen(createServer(app))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const missingIdempotency = await postJson(`${baseUrl}/v1/edit-executions/packages`, requestBody)
  assert.equal(missingIdempotency.status, 400, `Package route must require idempotency: ${JSON.stringify(missingIdempotency.json)}`)
  assert.equal(missingIdempotency.json.error?.code, 'IDEMPOTENCY_KEY_REQUIRED')

  const missingReservation = await postJson(`${baseUrl}/v1/edit-executions/packages`, {
    ...requestBody,
    creditReservationId: '',
  }, 'route-package-missing-reservation')
  assert.equal(missingReservation.status, 400, 'Schema should reject missing credit reservation.')
  assert.equal(missingReservation.json.error?.code, 'VALIDATION_FAILED')

  const created = await postJson(`${baseUrl}/v1/edit-executions/packages`, requestBody, 'route-package-create')
  assert.equal(created.status, 201, 'Valid approved package route request should create a mock-safe package.')
  const createdPackage = created.json.data?.approvedEditExecutionPackage
  assert.ok(createdPackage, 'Created response should include approvedEditExecutionPackage.')
  assert.equal(createdPackage.createdByUserId, 'mock-user-runtime')
  assert.equal(createdPackage.approvedPlanSnapshotId, snapshot.id)
  assert.equal(createdPackage.agentCallReady, true, 'Agent/tool call package should be ready after approved snapshot and gate evidence.')
  assert.equal(createdPackage.liveExecutionReady, false, 'Live execution must stay disabled.')
  assert.equal(createdPackage.resolvedAdapterToolCount, professionalAdapterToolNames.length)
  assert.deepEqual(createdPackage.packageReadyToolIds, [], 'Frontend-safe package creation must not trust client package readiness hints as source truth.')
  assert.deepEqual(createdPackage.modelWeightApprovedToolIds, [], 'Frontend-safe package creation must not trust client model approval hints as source truth.')
  assert.equal(createdPackage.boundedAdapterExecutionReady, false, 'Package should expose bounded adapter execution as not ready until source-truth evidence passes.')
  assert.equal(createdPackage.boundedAdapterReadyToolCount, 0, 'Package should expose zero bounded-ready tools before source-truth review.')
  assert.ok(createdPackage.boundedAdapterBlockedToolCount > 0, 'Package should expose bounded blocked tool count before source-truth review.')
  assert.ok(createdPackage.boundedAdapterBlockers.length > 0, 'Package should expose bounded adapter blockers at the top level.')
  assert.ok(createdPackage.backendHandoffSummary.includes('Bounded adapter gate ready: 0; blocked:'), 'Backend handoff summary should include bounded readiness counts.')
  assert.equal(createdPackage.boundedAdapterExecutionGate?.status, 'blocked', 'Frontend-safe package creation should not mark bounded adapter execution ready without backend source-truth evidence.')
  assert.equal(createdPackage.boundedAdapterExecutionGate?.clientReadinessHintsTrusted, false)
  assert.equal(createdPackage.boundedAdapterExecutionGate?.serverSourceTruthRequired, true)
  assert.equal(createdPackage.boundedAdapterExecutionGate?.frontendExecutionAllowed, false)
  assert.equal(createdPackage.boundedAdapterExecutionGate?.productReady, false)
  assert.ok((createdPackage.boundedAdapterExecutionGate?.blockedToolCount ?? 0) > 0, 'Bounded adapter execution should show remaining server-owned blockers.')
  assert.ok(createdPackage.privateArtifactRefCount > 0, 'Package should include private artifact references for backend handoff.')
  assert.ok(!createdPackage.userFacingSummary.toLowerCase().includes('d3'), 'User copy should not expose implementation package names.')
  assert.ok(createdPackage.noRuntimeSideEffects.some((note) => /No workers|does not dispatch workers/i.test(note)))

  const otherUserPackageService = createApprovedEditExecutionPackageService({
    env,
    clients: { admin: null, public: null },
    requestId: 'route-smoke-package-other-user',
    auth: {
      userId: 'mock-user-other',
      isMockUser: true,
    },
  } satisfies ServiceContext)
  await assertServiceRejects(
    () => otherUserPackageService.getPackage(createdPackage.packageRecordId),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user approved execution package readback should be rejected.',
  )
  await assertServiceRejects(
    () => otherUserPackageService.getBoundedAdapterExecutionGate(createdPackage.packageRecordId),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user bounded adapter gate readback should be rejected.',
  )

  const replayed = await postJson(`${baseUrl}/v1/edit-executions/packages`, requestBody, 'route-package-create')
  assert.equal(replayed.status, 201, 'Idempotent replay should return the original package.')
  assert.equal(
    replayed.json.data?.approvedEditExecutionPackage?.packageRecordId,
    createdPackage.packageRecordId,
    'Idempotent replay should not create a second package record.',
  )

  const readBack = await fetchJson(`${baseUrl}/v1/edit-executions/packages/${createdPackage.packageRecordId}`)
  assert.equal(readBack.status, 200, 'Created package should be readable from mock storage.')
  assert.equal(readBack.json.data?.approvedEditExecutionPackage?.packageRecordId, createdPackage.packageRecordId)
  const boundedGateReadBack = await fetchJson(`${baseUrl}/v1/edit-executions/packages/${createdPackage.packageRecordId}/bounded-adapter-execution-gate`)
  assert.equal(boundedGateReadBack.status, 200, 'Created package bounded adapter execution gate should be readable from backend storage.')
  assert.equal(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.status, 'blocked')
  assert.equal(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.clientReadinessHintsTrusted, false)
  assert.equal(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.serverSourceTruthRequired, true)
  assert.equal(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.frontendExecutionAllowed, false)
  assert.equal(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.productReady, false)
  assert.ok((boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.blockedToolCount ?? 0) > 0, 'Gate readback should preserve blocked advanced tool count.')
  assert.ok(boundedGateReadBack.json.data?.boundedAdapterExecutionGate?.noRuntimeSideEffects.some((note) => /does not run adapters/i.test(note)), 'Gate readback should state that adapters did not execute.')

  const routeAdapterPackageBody = {
    ...requestBody,
    approvedSnapshot: {
      ...compactSnapshot,
      toolStrategyPlan: {
        ...(compactSnapshot.toolStrategyPlan as unknown as Record<string, unknown>),
        toolIdsUsed: [],
      },
      professionalSkillPlan: undefined,
    },
    requestedAdapterToolNames: ['d3', 'three'],
    packageReadyToolIds: ['d3', 'three'],
    modelWeightApprovedToolIds: [],
  }
  const routeAdapterPackageResponse = await postJson(`${baseUrl}/v1/edit-executions/packages`, routeAdapterPackageBody, 'route-adapter-package-create')
  assert.equal(routeAdapterPackageResponse.status, 201, 'Adapter route package should be created for bounded source-truth route coverage.')
  const routeAdapterPackage = routeAdapterPackageResponse.json.data?.approvedEditExecutionPackage
  assert.ok(routeAdapterPackage, 'Adapter route package response should include approvedEditExecutionPackage.')
  assert.equal(routeAdapterPackage.boundedAdapterExecutionGate?.status, 'blocked', 'Adapter route package should still require backend source-truth evidence.')
  assert.deepEqual(routeAdapterPackage.packageReadyToolIds, [], 'Adapter route package must ignore frontend package-ready hints.')
  await assertServiceRejects(
    () => otherUserPackageService.reviewBoundedAdapterSourceTruth({
      packageRecordId: routeAdapterPackage.packageRecordId,
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      packageReadinessEvidence: [],
      modelWeightApprovals: [],
      idempotencyKey: 'route-adapter-source-truth-review-other-user',
    }),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user bounded adapter source-truth review should be rejected.',
  )
  await assertServiceRejects(
    () => otherUserPackageService.createBoundedAdapterExecutionRun({
      packageRecordId: routeAdapterPackage.packageRecordId,
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      handoffOnly: true,
      idempotencyKey: 'route-adapter-execution-run-other-user',
    }),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user bounded adapter execution handoff should be rejected.',
  )

  const missingSourceTruthIdempotency = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-source-truth-review`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    packageReadinessEvidence: [],
    modelWeightApprovals: [],
  })
  assert.equal(missingSourceTruthIdempotency.status, 400, 'Bounded adapter source-truth review must require idempotency.')

  const invalidPackageSourceTruthReview = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-source-truth-review`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    packageReadinessEvidence: [{
      toolId: 'd3',
      status: 'passed',
      source: 'browser_client_hint',
      evidenceId: 'route-invalid-package-source-d3',
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: 'Untrusted route caller readiness claim must not pass source truth.',
    }],
    modelWeightApprovals: [],
  }, 'route-adapter-invalid-package-source-truth-review')
  assert.equal(invalidPackageSourceTruthReview.status, 400, 'Route must reject unapproved package readiness evidence sources.')

  const invalidModelSourceTruthReview = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-source-truth-review`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    packageReadinessEvidence: routeSourceTruthReadyAdapterToolNames.map((toolId) => ({
      toolId,
      status: 'passed',
      source: 'backend_tool_readiness_worker',
      evidenceId: `route-invalid-model-package-evidence-${toolId}`,
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: `${toolId} package readiness passed in backend-owned route smoke evidence.`,
    })),
    modelWeightApprovals: [{
      toolId: 'sam2',
      approvalStatus: 'approved',
      source: 'browser_client_hint',
      manifestId: 'route-invalid-model-source-sam2',
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: 'Untrusted route caller model approval claim must not pass source truth.',
    }],
  }, 'route-adapter-invalid-model-source-truth-review')
  assert.equal(invalidModelSourceTruthReview.status, 400, 'Route must reject unapproved model-weight approval sources.')

  const boundedSourceTruthReview = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-source-truth-review`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    packageReadinessEvidence: routeSourceTruthReadyAdapterToolNames.map((toolId) => ({
      toolId,
      status: 'passed',
      source: 'backend_tool_readiness_worker',
      evidenceId: `route-evidence-${toolId}`,
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: `${toolId} package readiness passed in backend-owned route smoke evidence.`,
    })),
    modelWeightApprovals: [],
  }, 'route-adapter-source-truth-review')
  assert.equal(boundedSourceTruthReview.status, 201, `Bounded adapter source-truth review should succeed: ${JSON.stringify(boundedSourceTruthReview.json)}`)
  const sourceTruthReview = boundedSourceTruthReview.json.data?.sourceTruthReview
  assert.ok(sourceTruthReview, 'Source-truth route should return sourceTruthReview.')
  assert.equal(sourceTruthReview.status, 'ready_for_bounded_execution', `Source-truth review blockers: ${JSON.stringify(sourceTruthReview.blockers)}`)
  assert.equal(sourceTruthReview.acceptedPackageEvidenceCount, routeSourceTruthReadyAdapterToolNames.length)
  assert.deepEqual(sourceTruthReview.packageReadyToolIds.sort(), [
    'd3',
    'gpac_mp4box_packaging_validation',
    'mkvtoolnix_container_validation',
    'streamer_render_pipeline_support',
    'three_js',
  ])
  assert.equal(sourceTruthReview.clientReadinessHintsTrusted, false)
  assert.equal(sourceTruthReview.serverSourceTruthRequired, true)
  assert.equal(sourceTruthReview.frontendExecutionAllowed, false)
  assert.equal(sourceTruthReview.productReady, false)
  assert.ok(sourceTruthReview.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)), 'Source-truth review must not execute adapters.')
  assert.equal(boundedSourceTruthReview.json.data?.approvedEditExecutionPackage?.boundedAdapterExecutionGate?.status, 'ready_for_bounded_execution')

  const boundedSourceTruthReviewReplay = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-source-truth-review`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    packageReadinessEvidence: routeSourceTruthReadyAdapterToolNames.map((toolId) => ({
      toolId,
      status: 'passed',
      source: 'backend_tool_readiness_worker',
      evidenceId: `route-evidence-${toolId}`,
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: `${toolId} package readiness passed in backend-owned route smoke evidence.`,
    })),
    modelWeightApprovals: [],
  }, 'route-adapter-source-truth-review')
  assert.equal(boundedSourceTruthReviewReplay.status, 201, 'Idempotent bounded adapter source-truth review replay should succeed.')
  assert.equal(boundedSourceTruthReviewReplay.json.data?.sourceTruthReview?.id, sourceTruthReview.id, 'Source-truth review replay should not duplicate source-truth records.')

  const boundedAdapterExecutionRun = await postJson(`${baseUrl}/v1/edit-executions/packages/${routeAdapterPackage.packageRecordId}/bounded-adapter-execution-runs`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    creditReservationId: routeAdapterPackageBody.creditReservationId,
    handoffOnly: true,
  }, 'route-adapter-execution-run')
  assert.equal(boundedAdapterExecutionRun.status, 201, `Bounded adapter execution handoff should succeed: ${JSON.stringify(boundedAdapterExecutionRun.json)}`)
  const adapterExecutionRun = boundedAdapterExecutionRun.json.data?.boundedAdapterExecutionRun
  assert.ok(adapterExecutionRun, 'Bounded adapter execution route should return boundedAdapterExecutionRun.')
  assert.equal(adapterExecutionRun.status, 'completed_private_manifest_handoff')
  assert.equal(adapterExecutionRun.packageRecordId, routeAdapterPackage.packageRecordId)
  assert.equal(adapterExecutionRun.preparedActivityCount, routeSourceTruthReadyAdapterToolNames.length)
  assert.equal(adapterExecutionRun.actualToolPackageExecutionCount, 0)
  assert.equal(adapterExecutionRun.frontendExecutionAllowed, false)
  assert.equal(adapterExecutionRun.productReady, false)
  assert.ok(adapterExecutionRun.activityResults.every((activity) => activity.privateResultManifest.privateArtifact === true), 'Adapter handoff must produce private result manifest contracts only.')
  assert.ok(adapterExecutionRun.activityResults.every((activity) => activity.privateResultManifest.publicArtifact === false), 'Adapter handoff must not produce public artifacts.')
  assert.ok(adapterExecutionRun.activityResults.every((activity) => activity.privateResultManifest.signedUrl === null), 'Adapter handoff must not create signed URLs.')
  assert.ok(adapterExecutionRun.activityResults.every((activity) => activity.runnerBinding.actualToolPackageExecuted === false), 'Adapter handoff must not execute package/library runners.')
  assert.ok(adapterExecutionRun.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)), 'Adapter handoff must not import packages.')

  const registeredRunnerProbe = await postJson(`${baseUrl}/v1/edit-executions/bounded-adapter-execution-runs/${adapterExecutionRun.id}/registered-runner-probe`, {
    workspaceId: routeAdapterPackageBody.workspaceId,
    projectId: routeAdapterPackageBody.projectId,
    importProbeOnly: true,
  }, 'route-adapter-registered-runner-probe')
  assert.equal(registeredRunnerProbe.status, 201, `Registered adapter runner probe route should succeed: ${JSON.stringify(registeredRunnerProbe.json)}`)
  const runnerProbe = registeredRunnerProbe.json.data?.registeredRunnerRun
  assert.ok(runnerProbe, 'Registered runner route should return registeredRunnerRun.')
  assert.equal(runnerProbe.probeOnly, true)
  assert.equal(runnerProbe.requestedActivityCount, adapterExecutionRun.completedActivityCount)
  assert.equal(runnerProbe.mediaProcessingExecuted, false)
  assert.equal(runnerProbe.frontendExecutionAllowed, false)
  assert.equal(runnerProbe.productReady, false)
  assert.ok(['completed_import_probe', 'blocked'].includes(runnerProbe.status), 'Runner probe may complete or block on local package availability, but the route must remain no-media safe.')
  assert.equal(runnerProbe.actualToolPackageExecutionCount, 0, 'Import probes must not be counted as actual tool execution.')
  assert.ok(runnerProbe.results.every((result) => result.importProbeOnly === true), 'Runner probe results must be explicitly marked import-probe-only.')
  assert.ok(runnerProbe.results.every((result) => result.actualToolPackageExecuted === false), 'Runner probe should report package availability without executing edit tools.')
  assert.ok(runnerProbe.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)), 'Runner probe must not process media.')

  let adapterWorkerArtifactIntegrationForRender: AdapterWorkerArtifactIntegrationSmoke | undefined
  if (runnerProbe.status === 'completed_import_probe') {
    const missingPrivateRunnerReservation = await postJson(`${baseUrl}/v1/edit-executions/registered-runner-runs/${runnerProbe.id}/private-media-runner-execution`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: '',
      privateMediaExecutionOnly: true,
    }, 'route-adapter-private-runner-missing-reservation')
    assert.equal(missingPrivateRunnerReservation.status, 400, 'Private adapter runner route should require credit reservation evidence.')
    assert.equal(missingPrivateRunnerReservation.json.error?.code, 'VALIDATION_FAILED')

    const privateMediaRunner = await postJson(`${baseUrl}/v1/edit-executions/registered-runner-runs/${runnerProbe.id}/private-media-runner-execution`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      privateMediaExecutionOnly: true,
    }, 'route-adapter-private-media-runner')
    assert.equal(privateMediaRunner.status, 201, `Private adapter runner route should succeed after completed import probe: ${JSON.stringify(privateMediaRunner.json)}`)
    const privateRunnerRun = privateMediaRunner.json.data?.privateMediaRunnerRun
    assert.ok(privateRunnerRun, 'Private adapter runner route should return privateMediaRunnerRun.')
    assert.equal(privateRunnerRun.status, 'private_runner_manifest_ready')
    assert.equal(privateRunnerRun.registeredRunnerRunId, runnerProbe.id)
    assert.equal(privateRunnerRun.boundedAdapterExecutionRunId, adapterExecutionRun.id)
    assert.equal(privateRunnerRun.creditReservationId, routeAdapterPackageBody.creditReservationId)
    assert.equal(privateRunnerRun.privateMediaExecutionOnly, true)
    assert.equal(privateRunnerRun.mediaProcessingExecuted, false)
    assert.equal(privateRunnerRun.productRuntimeExecuted, false)
    assert.equal(privateRunnerRun.frontendExecutionAllowed, false)
    assert.equal(privateRunnerRun.productReady, false)
    assert.equal(privateRunnerRun.preparedPrivateRunnerManifestCount, adapterExecutionRun.completedActivityCount)
    assert.ok(privateRunnerRun.activities.every((activity) => activity.privateRunnerResultManifest.privateArtifact === true), 'Private runner manifests must stay private.')
    assert.ok(privateRunnerRun.activities.every((activity) => activity.privateRunnerResultManifest.publicArtifact === false), 'Private runner manifests must not create public artifacts.')
    assert.ok(privateRunnerRun.activities.every((activity) => activity.privateRunnerResultManifest.signedUrl === null), 'Private runner manifests must not create signed URLs.')
    assert.ok(privateRunnerRun.activities.every((activity) => activity.runnerBoundary.mediaProcessingExecuted === false), 'Private runner route must not process media.')
    assert.ok(privateRunnerRun.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)), 'Private runner route should preserve no-media boundary.')

    const privateMediaRunnerReplay = await postJson(`${baseUrl}/v1/edit-executions/registered-runner-runs/${runnerProbe.id}/private-media-runner-execution`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      privateMediaExecutionOnly: true,
    }, 'route-adapter-private-media-runner')
    assert.equal(privateMediaRunnerReplay.status, 201, 'Idempotent private adapter runner replay should succeed.')
    assert.equal(privateMediaRunnerReplay.json.data?.privateMediaRunnerRun?.id, privateRunnerRun.id, 'Private adapter runner replay should not duplicate the run.')

    const privateRunnerQaMissingReservation = await postJson(`${baseUrl}/v1/edit-executions/private-media-runner-runs/${privateRunnerRun.id}/qa-review`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: '',
      qaReviewOnly: true,
    }, 'route-adapter-private-runner-qa-missing-reservation')
    assert.equal(privateRunnerQaMissingReservation.status, 400, 'Private adapter runner QA route should require credit reservation evidence.')
    assert.equal(privateRunnerQaMissingReservation.json.error?.code, 'VALIDATION_FAILED')

    const privateRunnerQa = await postJson(`${baseUrl}/v1/edit-executions/private-media-runner-runs/${privateRunnerRun.id}/qa-review`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      qaReviewOnly: true,
    }, 'route-adapter-private-runner-qa')
    assert.equal(privateRunnerQa.status, 201, `Private adapter runner QA route should succeed after private runner manifests: ${JSON.stringify(privateRunnerQa.json)}`)
    const privateRunnerQaReview = privateRunnerQa.json.data?.privateMediaRunnerQaReview
    assert.ok(privateRunnerQaReview, 'Private adapter runner QA route should return privateMediaRunnerQaReview.')
    assert.equal(privateRunnerQaReview.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
    assert.equal(privateRunnerQaReview.privateMediaRunnerRunId, privateRunnerRun.id)
    assert.equal(privateRunnerQaReview.registeredRunnerRunId, runnerProbe.id)
    assert.equal(privateRunnerQaReview.boundedAdapterExecutionRunId, adapterExecutionRun.id)
    assert.equal(privateRunnerQaReview.creditReservationId, routeAdapterPackageBody.creditReservationId)
    assert.equal(privateRunnerQaReview.artifactCount, privateRunnerRun.preparedPrivateRunnerManifestCount)
    assert.equal(privateRunnerQaReview.mediaProcessingExecuted, false)
    assert.equal(privateRunnerQaReview.productRuntimeExecuted, false)
    assert.equal(privateRunnerQaReview.frontendExecutionAllowed, false)
    assert.equal(privateRunnerQaReview.productReady, false)
    assert.equal(privateRunnerQaReview.finalRenderIntegrationReadiness.ready, false)
    assert.equal(privateRunnerQaReview.nextRequiredGate, 'adapter_specific_worker_artifact_integration_with_private_render')
    assert.ok(privateRunnerQaReview.artifacts.every((artifact) => artifact.privateArtifact === true), 'Private runner QA artifacts must stay private.')
    assert.ok(privateRunnerQaReview.artifacts.every((artifact) => artifact.publicArtifact === false), 'Private runner QA artifacts must not create public artifacts.')
    assert.ok(privateRunnerQaReview.artifacts.every((artifact) => artifact.signedUrl === null), 'Private runner QA artifacts must not create signed URLs.')
    assert.ok(privateRunnerQaReview.artifacts.every((artifact) => artifact.sha256.length === 64 && artifact.byteSize > 0), 'Private runner QA artifacts must include checksums and byte sizes.')
    assert.ok(privateRunnerQaReview.noRuntimeSideEffects.some((note) => /does not execute adapter media transforms/i.test(note)), 'Private runner QA route should preserve no-media boundary.')

    const privateRunnerQaReplay = await postJson(`${baseUrl}/v1/edit-executions/private-media-runner-runs/${privateRunnerRun.id}/qa-review`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      qaReviewOnly: true,
    }, 'route-adapter-private-runner-qa')
    assert.equal(privateRunnerQaReplay.status, 201, 'Idempotent private adapter runner QA replay should succeed.')
    assert.equal(privateRunnerQaReplay.json.data?.privateMediaRunnerQaReview?.id, privateRunnerQaReview.id, 'Private adapter runner QA replay should not duplicate artifacts.')
    const adapterIntegrationMissingReservation = await postJson(`${baseUrl}/v1/edit-executions/private-runner-qa-reviews/${privateRunnerQaReview.id}/adapter-worker-artifact-integration`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: '',
      integrationOnly: true,
    }, 'route-adapter-worker-artifact-integration-missing-reservation')
    assert.equal(adapterIntegrationMissingReservation.status, 400, 'Adapter artifact integration should require credit reservation evidence.')
    assert.equal(adapterIntegrationMissingReservation.json.error?.code, 'VALIDATION_FAILED')

    const adapterIntegration = await postJson(`${baseUrl}/v1/edit-executions/private-runner-qa-reviews/${privateRunnerQaReview.id}/adapter-worker-artifact-integration`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      integrationOnly: true,
    }, 'route-adapter-worker-artifact-integration')
    assert.equal(adapterIntegration.status, 201, `Adapter worker artifact integration route should succeed after private QA: ${JSON.stringify(adapterIntegration.json)}`)
    const adapterWorkerArtifactIntegration = adapterIntegration.json.data?.adapterWorkerArtifactIntegration
    assert.ok(adapterWorkerArtifactIntegration, 'Adapter worker artifact integration route should return adapterWorkerArtifactIntegration.')
    assert.equal(adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId, privateRunnerQaReview.id)
    assert.equal(adapterWorkerArtifactIntegration.privateMediaRunnerRunId, privateRunnerRun.id)
    assert.equal(adapterWorkerArtifactIntegration.registeredRunnerRunId, runnerProbe.id)
    assert.equal(adapterWorkerArtifactIntegration.creditReservationId, routeAdapterPackageBody.creditReservationId)
    assert.equal(adapterWorkerArtifactIntegration.status, 'adapter_worker_artifact_integration_passed_ready_for_render_preview')
    assert.equal(adapterWorkerArtifactIntegration.integrationOnly, true)
    assert.equal(adapterWorkerArtifactIntegration.reviewedArtifactCount, privateRunnerQaReview.artifactCount)
    assert.equal(adapterWorkerArtifactIntegration.integratedArtifactCount, privateRunnerQaReview.artifactCount)
    assert.equal(adapterWorkerArtifactIntegration.blockedArtifactCount, 0)
    assert.equal(adapterWorkerArtifactIntegration.mediaProcessingExecuted, false)
    assert.equal(adapterWorkerArtifactIntegration.mediaTransformOutputCount, 0)
    assert.equal(adapterWorkerArtifactIntegration.productRuntimeExecuted, false)
    assert.equal(adapterWorkerArtifactIntegration.frontendExecutionAllowed, false)
    assert.equal(adapterWorkerArtifactIntegration.productReady, false)
    assert.equal(adapterWorkerArtifactIntegration.privateArtifact, true)
    assert.equal(adapterWorkerArtifactIntegration.publicArtifact, false)
    assert.equal(adapterWorkerArtifactIntegration.signedUrl, null)
    assert.equal(adapterWorkerArtifactIntegration.renderPreviewIntegrationReady, true)
    assert.equal(adapterWorkerArtifactIntegration.finalRenderDecisionManifestEligible, true)
    assert.equal(adapterWorkerArtifactIntegration.mediaTransformOutputEligible, false)
    assert.equal(adapterWorkerArtifactIntegration.nextRequiredGate, 'render_preview_assembly_with_private_adapter_integration')
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.privateArtifact, true)
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.publicArtifact, false)
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.signedUrl, null)
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.sourceOfTruthScope, 'adapter_worker_artifact_render_integration_manifest')
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.previewAssemblyEligible, true)
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.finalRenderDecisionManifestEligible, true)
    assert.equal(adapterWorkerArtifactIntegration.integrationManifestArtifact.integratedArtifactCount, privateRunnerQaReview.artifactCount)
    assert.ok(adapterWorkerArtifactIntegration.artifacts.every((artifact) =>
      artifact.privateArtifact === true &&
      artifact.publicArtifact === false &&
      artifact.signedUrl === null &&
      artifact.finalRenderIntegrationEligible === true &&
      artifact.mediaTransformOutputEligible === false &&
      artifact.sha256.length === 64 &&
      artifact.byteSize > 0
    ), 'Adapter integration artifacts should be private render-manifest evidence only.')
    assert.ok(
      adapterWorkerArtifactIntegration.noRuntimeSideEffects.some((note) => /does not execute adapter media transforms|No adapter package was executed for media transformation/i.test(note)),
      'Adapter integration route should preserve no-media-transform boundary.',
    )

    const adapterIntegrationReplay = await postJson(`${baseUrl}/v1/edit-executions/private-runner-qa-reviews/${privateRunnerQaReview.id}/adapter-worker-artifact-integration`, {
      workspaceId: routeAdapterPackageBody.workspaceId,
      projectId: routeAdapterPackageBody.projectId,
      creditReservationId: routeAdapterPackageBody.creditReservationId,
      integrationOnly: true,
    }, 'route-adapter-worker-artifact-integration')
    assert.equal(adapterIntegrationReplay.status, 201, 'Idempotent adapter artifact integration replay should succeed.')
    assert.equal(adapterIntegrationReplay.json.data?.adapterWorkerArtifactIntegration?.id, adapterWorkerArtifactIntegration.id, 'Adapter artifact integration replay should not duplicate manifests.')
    adapterWorkerArtifactIntegrationForRender = adapterWorkerArtifactIntegration
  }

  const missingBatchReservation = await postJson(`${baseUrl}/v1/edit-executions/packages/${createdPackage.packageRecordId}/job-batch-plan`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    dryRunOnly: true,
  }, 'route-package-batch-missing-reservation')
  assert.equal(missingBatchReservation.status, 400, 'Job batch planning should require credit reservation evidence.')
  assert.equal(missingBatchReservation.json.error?.code, 'VALIDATION_FAILED')

  const batchPlan = await postJson(`${baseUrl}/v1/edit-executions/packages/${createdPackage.packageRecordId}/job-batch-plan`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    dryRunOnly: true,
  }, 'route-package-batch-plan')
  assert.equal(batchPlan.status, 201, `Job batch planning should succeed: ${JSON.stringify(batchPlan.json)}`)
  const plannedBatch = batchPlan.json.data?.jobBatchPlan
  assert.ok(plannedBatch, 'Job batch planning response should include a jobBatchPlan.')
  assert.equal(plannedBatch.packageRecordId, createdPackage.packageRecordId)
  assert.equal(plannedBatch.approvedPlanSnapshotId, snapshot.id)
  assert.equal(plannedBatch.creditReservationId, requestBody.creditReservationId)
  assert.equal(plannedBatch.dryRunOnly, true)
  assert.ok(plannedBatch.plannedJobCount > 0, 'Approved package should produce planned worker job records.')
  assert.ok(plannedBatch.plannedJobs.every((job) => job.approvedPlanSnapshotId === snapshot.id), 'Every planned job must carry approved snapshot lineage.')
  assert.ok(plannedBatch.plannedJobs.every((job) => job.creditReservationId === requestBody.creditReservationId), 'Every planned job must carry credit reservation evidence.')
  assert.ok(plannedBatch.plannedJobs.every((job) => job.idempotencyKey), 'Every planned job must preserve a work-item idempotency key.')
  assert.ok(plannedBatch.plannedJobs.every((job) => job.payloadJson.packageRecordId === createdPackage.packageRecordId), 'Every planned job payload must point to the package record.')
  assert.ok(plannedBatch.noRuntimeSideEffects.some((note) => /No worker leases were claimed/i.test(note)), 'Batch plan must state no worker execution occurred.')

  const batchReplay = await postJson(`${baseUrl}/v1/edit-executions/packages/${createdPackage.packageRecordId}/job-batch-plan`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    dryRunOnly: true,
  }, 'route-package-batch-plan')
  assert.equal(batchReplay.status, 201, 'Idempotent job batch replay should succeed.')
  assert.equal(batchReplay.json.data?.jobBatchPlan?.id, plannedBatch.id, 'Job batch replay should not create a second batch plan.')

  const missingQueueReservation = await postJson(`${baseUrl}/v1/edit-executions/job-batch-plans/${plannedBatch.id}/mock-queue`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    mockQueueOnly: true,
  }, 'route-package-queue-missing-reservation')
  assert.equal(missingQueueReservation.status, 400, 'Mock queue creation should require credit reservation evidence.')
  assert.equal(missingQueueReservation.json.error?.code, 'VALIDATION_FAILED')

  const mockQueue = await postJson(`${baseUrl}/v1/edit-executions/job-batch-plans/${plannedBatch.id}/mock-queue`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    mockQueueOnly: true,
  }, 'route-package-mock-queue')
  assert.equal(mockQueue.status, 201, `Mock queue creation should succeed: ${JSON.stringify(mockQueue.json)}`)
  const queued = mockQueue.json.data?.mockQueue
  assert.ok(queued, 'Mock queue response should include mockQueue.')
  assert.equal(queued.jobBatchPlanId, plannedBatch.id)
  assert.equal(queued.packageRecordId, createdPackage.packageRecordId)
  assert.equal(queued.approvedPlanSnapshotId, snapshot.id)
  assert.equal(queued.creditReservationId, requestBody.creditReservationId)
  assert.equal(queued.mockQueueOnly, true)
  assert.equal(queued.queuedJobCount, plannedBatch.readyToQueueCount, 'Only ready planned jobs should become queued jobs.')
  assert.equal(queued.workersStarted, 0, 'Mock queue creation must not start workers.')
  assert.equal(queued.workerClaimsCreated, 0, 'Mock queue creation must not claim worker leases.')
  assert.ok(queued.queuedJobs.every((job) => job.status === 'queued'), 'Queued jobs should be queued metadata only.')
  assert.ok(queued.queuedJobs.every((job) => job.approvedPlanSnapshotId === snapshot.id), 'Queued jobs must preserve approved snapshot lineage.')
  assert.ok(queued.queuedJobs.every((job) => job.creditReservationId === requestBody.creditReservationId), 'Queued jobs must preserve credit reservation evidence.')
  assert.ok(queued.queuedJobs.every((job) => job.payloadJson.mockQueueOnly === true), 'Queued job payloads must retain mockQueueOnly marker.')
  assert.ok(queued.noRuntimeSideEffects.some((note) => /No worker lease was claimed/i.test(note)), 'Queue response must state no worker lease was claimed.')

  const queueReplay = await postJson(`${baseUrl}/v1/edit-executions/job-batch-plans/${plannedBatch.id}/mock-queue`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    mockQueueOnly: true,
  }, 'route-package-mock-queue')
  assert.equal(queueReplay.status, 201, 'Idempotent mock queue replay should succeed.')
  assert.equal(queueReplay.json.data?.mockQueue?.id, queued.id, 'Mock queue replay should not create duplicate queued jobs.')

  const missingDispatchReservation = await postJson(`${baseUrl}/v1/edit-executions/mock-queues/${queued.id}/dispatch-readiness`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    dryRunOnly: true,
  }, 'route-package-dispatch-missing-reservation')
  assert.equal(missingDispatchReservation.status, 400, 'Dispatch readiness should require credit reservation evidence.')
  assert.equal(missingDispatchReservation.json.error?.code, 'VALIDATION_FAILED')

  const dispatch = await postJson(`${baseUrl}/v1/edit-executions/mock-queues/${queued.id}/dispatch-readiness`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    dryRunOnly: true,
  }, 'route-package-dispatch-readiness')
  assert.equal(dispatch.status, 201, `Dispatch readiness should succeed: ${JSON.stringify(dispatch.json)}`)
  const readiness = dispatch.json.data?.dispatchReadiness
  assert.ok(readiness, 'Dispatch readiness response should include dispatchReadiness.')
  assert.equal(readiness.mockQueueId, queued.id)
  assert.equal(readiness.jobBatchPlanId, plannedBatch.id)
  assert.equal(readiness.packageRecordId, createdPackage.packageRecordId)
  assert.equal(readiness.approvedPlanSnapshotId, snapshot.id)
  assert.equal(readiness.creditReservationId, requestBody.creditReservationId)
  assert.equal(readiness.dryRunOnly, true)
  assert.equal(readiness.queuedJobCount, queued.queuedJobCount)
  assert.equal(readiness.workersStarted, 0, 'Dispatch readiness must not start workers.')
  assert.equal(readiness.workerClaimsCreated, 0, 'Dispatch readiness must not claim worker leases.')
  assert.ok(readiness.readiness.every((item) => item.gateChecks.some((gate) => gate.gate === 'approved_snapshot')), 'Every dispatch audit must check approved snapshot gate.')
  assert.ok(readiness.readiness.every((item) => item.gateChecks.some((gate) => gate.gate === 'no_raw_chat_execution')), 'Every dispatch audit must check raw-chat execution gate.')
  assert.ok(readiness.readiness.every((item) => item.requiredGateCount >= item.passedRequiredGateCount), 'Gate counts should be coherent.')
  assert.ok(readiness.noRuntimeSideEffects.some((note) => /No worker lease was claimed/i.test(note)), 'Dispatch readiness must state no worker lease was claimed.')

  const dispatchReplay = await postJson(`${baseUrl}/v1/edit-executions/mock-queues/${queued.id}/dispatch-readiness`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    dryRunOnly: true,
  }, 'route-package-dispatch-readiness')
  assert.equal(dispatchReplay.status, 201, 'Idempotent dispatch readiness replay should succeed.')
  assert.equal(dispatchReplay.json.data?.dispatchReadiness?.id, readiness.id, 'Dispatch readiness replay should return the original audit.')

  const missingClaimReservation = await postJson(`${baseUrl}/v1/edit-executions/dispatch-readiness/${readiness.id}/mock-worker-claims`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    mockClaimsOnly: true,
  }, 'route-package-claims-missing-reservation')
  assert.equal(missingClaimReservation.status, 400, 'Mock worker claims should require credit reservation evidence.')
  assert.equal(missingClaimReservation.json.error?.code, 'VALIDATION_FAILED')

  const mockWorkerClaimsResponse = await postJson(`${baseUrl}/v1/edit-executions/dispatch-readiness/${readiness.id}/mock-worker-claims`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    workerInstanceId: 'route-smoke-worker-1',
    mockClaimsOnly: true,
  }, 'route-package-worker-claims')
  assert.equal(mockWorkerClaimsResponse.status, 201, `Mock worker claim creation should succeed: ${JSON.stringify(mockWorkerClaimsResponse.json)}`)
  const mockWorkerClaims = mockWorkerClaimsResponse.json.data?.mockWorkerClaims
  assert.ok(mockWorkerClaims, 'Mock worker claim response should include mockWorkerClaims.')
  assert.equal(mockWorkerClaims.dispatchReadinessId, readiness.id)
  assert.equal(mockWorkerClaims.mockQueueId, queued.id)
  assert.equal(mockWorkerClaims.packageRecordId, createdPackage.packageRecordId)
  assert.equal(mockWorkerClaims.approvedPlanSnapshotId, snapshot.id)
  assert.equal(mockWorkerClaims.creditReservationId, requestBody.creditReservationId)
  assert.equal(mockWorkerClaims.mockClaimsOnly, true)
  assert.equal(mockWorkerClaims.claimCount, readiness.readyForClaimCount, 'Mock worker claims should match the dispatch-ready job count.')
  assert.equal(mockWorkerClaims.workersStarted, 0, 'Mock worker claim creation must not start workers.')
  assert.equal(mockWorkerClaims.workerHandlersStarted, 0, 'Mock worker claim creation must not start handlers.')
  assert.equal(mockWorkerClaims.toolsExecuted, 0, 'Mock worker claim creation must not run tools.')
  assert.ok(mockWorkerClaims.workerClaims.every((claim) => claim.approvedPlanSnapshotId === snapshot.id), 'Every mock claim must preserve approved snapshot lineage.')
  assert.ok(mockWorkerClaims.workerClaims.every((claim) => claim.creditReservationId === requestBody.creditReservationId), 'Every mock claim must preserve credit reservation evidence.')
  assert.ok(mockWorkerClaims.workerClaims.every((claim) => claim.idempotencyKey), 'Every mock claim must preserve job idempotency evidence.')
  assert.ok(mockWorkerClaims.workerClaims.every((claim) => claim.workerInstanceId === 'route-smoke-worker-1'), 'Worker instance id should be recorded on every mock claim.')
  assert.ok(mockWorkerClaims.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Mock claims must state no handler ran.')

  const mockWorkerClaimsReplay = await postJson(`${baseUrl}/v1/edit-executions/dispatch-readiness/${readiness.id}/mock-worker-claims`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    workerInstanceId: 'route-smoke-worker-1',
    mockClaimsOnly: true,
  }, 'route-package-worker-claims')
  assert.equal(mockWorkerClaimsReplay.status, 201, 'Idempotent mock worker claim replay should succeed.')
  assert.equal(mockWorkerClaimsReplay.json.data?.mockWorkerClaims?.id, mockWorkerClaims.id, 'Mock worker claim replay should not create duplicate claim leases.')

  const missingHandlerReservation = await postJson(`${baseUrl}/v1/edit-executions/mock-worker-claims/${mockWorkerClaims.id}/handler-dry-run`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    handlerDryRunOnly: true,
  }, 'route-package-handler-missing-reservation')
  assert.equal(missingHandlerReservation.status, 400, 'Handler dry-run should require credit reservation evidence.')
  assert.equal(missingHandlerReservation.json.error?.code, 'VALIDATION_FAILED')

  const handlerDryRunResponse = await postJson(`${baseUrl}/v1/edit-executions/mock-worker-claims/${mockWorkerClaims.id}/handler-dry-run`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    handlerDryRunOnly: true,
  }, 'route-package-handler-dry-run')
  assert.equal(handlerDryRunResponse.status, 201, `Handler dry-run should succeed: ${JSON.stringify(handlerDryRunResponse.json)}`)
  const handlerDryRun = handlerDryRunResponse.json.data?.handlerDryRun
  assert.ok(handlerDryRun, 'Handler dry-run response should include handlerDryRun.')
  assert.equal(handlerDryRun.mockWorkerClaimsId, mockWorkerClaims.id)
  assert.equal(handlerDryRun.dispatchReadinessId, readiness.id)
  assert.equal(handlerDryRun.mockQueueId, queued.id)
  assert.equal(handlerDryRun.packageRecordId, createdPackage.packageRecordId)
  assert.equal(handlerDryRun.approvedPlanSnapshotId, snapshot.id)
  assert.equal(handlerDryRun.creditReservationId, requestBody.creditReservationId)
  assert.equal(handlerDryRun.handlerDryRunOnly, true)
  assert.equal(handlerDryRun.claimCount, mockWorkerClaims.claimCount)
  assert.equal(handlerDryRun.workResultCount, mockWorkerClaims.claimCount, 'Handler dry-run should produce one work result per mock claim.')
  assert.ok(handlerDryRun.manifestUpdateCount >= handlerDryRun.workResultCount, 'Handler dry-run should produce manifest update refs.')
  assert.equal(handlerDryRun.qaHandoffCount, handlerDryRun.workResultCount, 'Handler dry-run should produce QA handoffs for every work result.')
  assert.equal(handlerDryRun.workersStarted, 0, 'Handler dry-run must not start workers.')
  assert.equal(handlerDryRun.workerHandlersStarted, 0, 'Handler dry-run must not start real handlers.')
  assert.equal(handlerDryRun.toolsExecuted, 0, 'Handler dry-run must not execute tools.')
  assert.equal(handlerDryRun.mediaArtifactsCreated, 0, 'Handler dry-run must not create media artifacts.')
  assert.equal(handlerDryRun.liveExecutionReady, false, 'Handler dry-run must not enable live execution.')
  assert.equal(handlerDryRun.finalExportReady, false, 'Handler dry-run must not enable final export.')
  assert.ok(handlerDryRun.workResults.every((result) => result.billableToUser === false), 'Dry-run work results must not be billable.')
  assert.ok(handlerDryRun.workResults.every((result) => result.approvedPlanSnapshotId === snapshot.id), 'Dry-run work results must preserve approved snapshot lineage.')
  assert.ok(handlerDryRun.workResults.every((result) => result.creditReservationId === requestBody.creditReservationId), 'Dry-run work results must preserve credit reservation evidence.')
  assert.ok(handlerDryRun.assetManifestUpdates.every((artifact) => artifact.privateArtifact === true), 'Dry-run artifact refs must be private placeholders.')
  assert.ok(handlerDryRun.assetManifestUpdates.every((artifact) => artifact.sourceOfTruth === false), 'Dry-run artifact refs must not claim source-of-truth media output.')
  assert.ok(handlerDryRun.assetManifestUpdates.every((artifact) => !/^https?:\/\//i.test(artifact.storageObjectPath)), 'Dry-run artifact refs must not be public URLs or signed URLs.')
  assert.ok(handlerDryRun.qaHandoffRecords.every((record) => record.blocksFinalRender === true), 'QA handoff records must block final render until real QA passes.')
  assert.ok(handlerDryRun.blockers.some((blocker) => /Final render\/export remains blocked/i.test(blocker)), 'Handler dry-run must keep final render/export blocked.')
  assert.ok(handlerDryRun.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Handler dry-run must state no real handler ran.')

  const handlerDryRunReplay = await postJson(`${baseUrl}/v1/edit-executions/mock-worker-claims/${mockWorkerClaims.id}/handler-dry-run`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    handlerDryRunOnly: true,
  }, 'route-package-handler-dry-run')
  assert.equal(handlerDryRunReplay.status, 201, 'Idempotent handler dry-run replay should succeed.')
  assert.equal(handlerDryRunReplay.json.data?.handlerDryRun?.id, handlerDryRun.id, 'Handler dry-run replay should not create duplicate work results.')

  const missingReconciliationReservation = await postJson(`${baseUrl}/v1/edit-executions/handler-dry-runs/${handlerDryRun.id}/result-reconciliation`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    reconcileDryRunOnly: true,
  }, 'route-package-reconciliation-missing-reservation')
  assert.equal(missingReconciliationReservation.status, 400, 'Result reconciliation should require credit reservation evidence.')
  assert.equal(missingReconciliationReservation.json.error?.code, 'VALIDATION_FAILED')

  const resultReconciliationResponse = await postJson(`${baseUrl}/v1/edit-executions/handler-dry-runs/${handlerDryRun.id}/result-reconciliation`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    reconcileDryRunOnly: true,
  }, 'route-package-result-reconciliation')
  assert.equal(resultReconciliationResponse.status, 201, `Result reconciliation should succeed: ${JSON.stringify(resultReconciliationResponse.json)}`)
  const resultReconciliation = resultReconciliationResponse.json.data?.resultReconciliation
  assert.ok(resultReconciliation, 'Result reconciliation response should include resultReconciliation.')
  assert.equal(resultReconciliation.handlerDryRunId, handlerDryRun.id)
  assert.equal(resultReconciliation.mockWorkerClaimsId, mockWorkerClaims.id)
  assert.equal(resultReconciliation.mockQueueId, queued.id)
  assert.equal(resultReconciliation.packageRecordId, createdPackage.packageRecordId)
  assert.equal(resultReconciliation.approvedPlanSnapshotId, snapshot.id)
  assert.equal(resultReconciliation.creditReservationId, requestBody.creditReservationId)
  assert.equal(resultReconciliation.reconcileDryRunOnly, true)
  assert.equal(resultReconciliation.workResultCount, handlerDryRun.workResultCount)
  assert.equal(resultReconciliation.manifestItemCount, handlerDryRun.manifestUpdateCount)
  assert.equal(resultReconciliation.qaGateCount, handlerDryRun.qaHandoffCount)
  assert.equal(resultReconciliation.sourceOfTruthArtifactCount, 0, 'Dry-run reconciliation must not create source-of-truth artifacts.')
  assert.equal(resultReconciliation.liveExecutionReady, false, 'Result reconciliation must not enable live execution.')
  assert.equal(resultReconciliation.previewReviewReady, false, 'Result reconciliation must not enable preview review from dry-run placeholders.')
  assert.equal(resultReconciliation.finalRenderReady, false, 'Result reconciliation must keep final render blocked.')
  assert.equal(resultReconciliation.finalRenderReadiness.ready, false, 'Final render readiness must remain false.')
  assert.equal(resultReconciliation.finalRenderReadiness.sourceOfTruthArtifactCount, 0, 'Final render readiness must see zero source-of-truth artifacts.')
  assert.ok(resultReconciliation.finalRenderReadiness.blockingWorkItemIds.length > 0, 'Result reconciliation should identify blocking work items.')
  assert.ok(resultReconciliation.finalRenderReadiness.dryRunArtifactIds.length > 0, 'Result reconciliation should identify dry-run artifact refs.')
  assert.ok(resultReconciliation.reconciledManifestItems.every((item) => item.privateArtifact === true), 'Reconciled manifest refs must stay private.')
  assert.ok(resultReconciliation.reconciledManifestItems.every((item) => item.sourceOfTruth === false), 'Reconciled manifest refs must not become source of truth.')
  assert.ok(resultReconciliation.reconciledManifestItems.every((item) => item.finalRenderEligible === false), 'Dry-run placeholders must not be final-render eligible.')
  assert.ok(resultReconciliation.reconciledManifestItems.every((item) => item.reconciliationDecision === 'await_real_worker_artifact'), 'Reconciliation should wait for real worker artifacts.')
  assert.ok(resultReconciliation.reconciledQAGates.every((gate) => gate.blocksFinalRender === true), 'Reconciled QA gates must block final render.')
  assert.equal(resultReconciliation.nextRequiredGate, 'real_worker_handler_execution_with_private_artifact_persistence')
  assert.ok(resultReconciliation.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Result reconciliation must state no real handler ran.')

  const resultReconciliationReplay = await postJson(`${baseUrl}/v1/edit-executions/handler-dry-runs/${handlerDryRun.id}/result-reconciliation`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    reconcileDryRunOnly: true,
  }, 'route-package-result-reconciliation')
  assert.equal(resultReconciliationReplay.status, 201, 'Idempotent result reconciliation replay should succeed.')
  assert.equal(resultReconciliationReplay.json.data?.resultReconciliation?.id, resultReconciliation.id, 'Result reconciliation replay should not create duplicate readiness records.')

  const missingLocalOutputReservation = await postJson(`${baseUrl}/v1/edit-executions/result-reconciliations/${resultReconciliation.id}/local-worker-output`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    localOutputOnly: true,
  }, 'route-package-local-output-missing-reservation')
  assert.equal(missingLocalOutputReservation.status, 400, 'Local worker output persistence should require credit reservation evidence.')
  assert.equal(missingLocalOutputReservation.json.error?.code, 'VALIDATION_FAILED')

  const localWorkerOutputResponse = await postJson(`${baseUrl}/v1/edit-executions/result-reconciliations/${resultReconciliation.id}/local-worker-output`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localOutputOnly: true,
  }, 'route-package-local-worker-output')
  assert.equal(localWorkerOutputResponse.status, 201, `Local worker output persistence should succeed: ${JSON.stringify(localWorkerOutputResponse.json)}`)
  const localWorkerOutput = localWorkerOutputResponse.json.data?.localWorkerOutput
  assert.ok(localWorkerOutput, 'Local worker output response should include localWorkerOutput.')
  assert.equal(localWorkerOutput.resultReconciliationId, resultReconciliation.id)
  assert.equal(localWorkerOutput.handlerDryRunId, handlerDryRun.id)
  assert.equal(localWorkerOutput.packageRecordId, createdPackage.packageRecordId)
  assert.equal(localWorkerOutput.approvedPlanSnapshotId, snapshot.id)
  assert.equal(localWorkerOutput.creditReservationId, requestBody.creditReservationId)
  assert.equal(localWorkerOutput.localOutputOnly, true)
  assert.equal(localWorkerOutput.status, 'local_worker_outputs_persisted_waiting_qa')
  assert.equal(localWorkerOutput.workResultCount, resultReconciliation.workResultCount)
  assert.equal(localWorkerOutput.persistedArtifactCount, resultReconciliation.manifestItemCount)
  assert.equal(localWorkerOutput.sourceOfTruthArtifactCount, resultReconciliation.manifestItemCount)
  assert.equal(localWorkerOutput.mediaArtifactCount, 0, 'Local output persistence must not claim media artifacts.')
  assert.equal(localWorkerOutput.qaPendingCount, resultReconciliation.manifestItemCount)
  assert.equal(localWorkerOutput.workersStarted, 0, 'Local output persistence must not start workers.')
  assert.equal(localWorkerOutput.workerHandlersStarted, 0, 'Local output persistence must not start real handlers.')
  assert.equal(localWorkerOutput.toolsExecuted, 0, 'Local output persistence must not execute tools.')
  assert.equal(localWorkerOutput.liveExecutionReady, false, 'Local output persistence must not enable live execution.')
  assert.equal(localWorkerOutput.internalResultReviewReady, true, 'Persisted private metadata should be ready for internal result review.')
  assert.equal(localWorkerOutput.previewReviewReady, true, 'Persisted private metadata should unblock internal preview review.')
  assert.equal(localWorkerOutput.renderPreviewReady, false, 'Metadata-only records must not claim rendered preview readiness.')
  assert.equal(localWorkerOutput.finalRenderReady, false, 'Local output persistence must keep final render blocked.')
  assert.equal(localWorkerOutput.finalRenderReadiness.ready, false, 'Final render readiness must remain false.')
  assert.equal(localWorkerOutput.finalRenderReadiness.mediaArtifactCount, 0, 'Final render readiness must see zero media artifacts.')
  assert.ok(localWorkerOutput.finalRenderReadiness.qaPendingArtifactIds.length > 0, 'Local output persistence should list QA-pending artifacts.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.privateArtifact === true), 'Persisted local output refs must stay private.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.publicArtifact === false), 'Persisted local output refs must not be public.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.signedUrl === null), 'Persisted local output refs must not include signed URLs.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.sourceOfTruth === true), 'Persisted local output refs should be source-of-truth metadata records.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.sourceOfTruthScope === 'local_worker_output_metadata_only'), 'Persisted local output refs must scope source truth to metadata only.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.mediaArtifact === false), 'Persisted local output refs must not claim media bytes.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.sha256.length === 64), 'Persisted local output refs must include checksums.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.byteSize > 0), 'Persisted local output refs must include byte sizes.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.localFilePath.startsWith(localStorageRoot)), 'Persisted local output refs must stay under the local storage root.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => !/^https?:\/\//i.test(artifact.storageObjectPath)), 'Persisted local output refs must not be public URLs.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.finalRenderEligible === false), 'Persisted local output refs must not be final-render eligible before QA.')
  assert.ok(localWorkerOutput.persistedArtifacts.every((artifact) => artifact.previewReviewEligible === true), 'Persisted local output refs should be eligible for internal preview review.')
  assert.ok(localWorkerOutput.qaHandoffRecords.every((record) => record.blocksFinalRender === true), 'Local output QA handoff records must block final render.')
  assert.equal(localWorkerOutput.nextRequiredGate, 'local_worker_output_qa_review')
  assert.ok(localWorkerOutput.noRuntimeSideEffects.some((note) => /No tool\/provider\/media\/render operation executed/i.test(note)), 'Local output persistence must state no runtime tool/media execution.')

  const localWorkerOutputReplay = await postJson(`${baseUrl}/v1/edit-executions/result-reconciliations/${resultReconciliation.id}/local-worker-output`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localOutputOnly: true,
  }, 'route-package-local-worker-output')
  assert.equal(localWorkerOutputReplay.status, 201, 'Idempotent local worker output replay should succeed.')
  assert.equal(localWorkerOutputReplay.json.data?.localWorkerOutput?.id, localWorkerOutput.id, 'Local worker output replay should not duplicate persisted private records.')

  const missingQaReservation = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    qaReviewOnly: true,
  }, 'route-package-local-output-qa-missing-reservation')
  assert.equal(missingQaReservation.status, 400, 'Local worker output QA should require credit reservation evidence.')
  assert.equal(missingQaReservation.json.error?.code, 'VALIDATION_FAILED')

  const localWorkerOutputQaReviewResponse = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-local-output-qa')
  assert.equal(localWorkerOutputQaReviewResponse.status, 201, `Local worker output QA should succeed: ${JSON.stringify(localWorkerOutputQaReviewResponse.json)}`)
  const localWorkerOutputQaReview = localWorkerOutputQaReviewResponse.json.data?.localWorkerOutputQaReview
  assert.ok(localWorkerOutputQaReview, 'Local worker output QA response should include localWorkerOutputQaReview.')
  assert.equal(localWorkerOutputQaReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(localWorkerOutputQaReview.resultReconciliationId, resultReconciliation.id)
  assert.equal(localWorkerOutputQaReview.handlerDryRunId, handlerDryRun.id)
  assert.equal(localWorkerOutputQaReview.packageRecordId, createdPackage.packageRecordId)
  assert.equal(localWorkerOutputQaReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(localWorkerOutputQaReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(localWorkerOutputQaReview.qaReviewOnly, true)
  assert.equal(localWorkerOutputQaReview.status, 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution')
  assert.equal(localWorkerOutputQaReview.reviewedArtifactCount, localWorkerOutput.persistedArtifactCount)
  assert.equal(localWorkerOutputQaReview.passedArtifactCount, localWorkerOutput.persistedArtifactCount)
  assert.equal(localWorkerOutputQaReview.blockedArtifactCount, 0)
  assert.equal(localWorkerOutputQaReview.sourceOfTruthArtifactCount, localWorkerOutput.sourceOfTruthArtifactCount)
  assert.equal(localWorkerOutputQaReview.mediaArtifactCount, 0, 'Local output QA must not claim media artifacts.')
  assert.equal(localWorkerOutputQaReview.workersStarted, 0, 'Local output QA must not start workers.')
  assert.equal(localWorkerOutputQaReview.workerHandlersStarted, 0, 'Local output QA must not start handlers.')
  assert.equal(localWorkerOutputQaReview.toolsExecuted, 0, 'Local output QA must not execute tools.')
  assert.equal(localWorkerOutputQaReview.liveExecutionReady, false, 'Local output QA must not enable live execution.')
  assert.equal(localWorkerOutputQaReview.internalResultReviewReady, true, 'Local output QA should preserve internal result review readiness.')
  assert.equal(localWorkerOutputQaReview.previewReviewReady, true, 'Metadata QA pass should preserve internal preview review readiness.')
  assert.equal(localWorkerOutputQaReview.renderPreviewReady, false, 'Metadata QA pass must not enable rendered preview readiness.')
  assert.equal(localWorkerOutputQaReview.finalRenderReady, false, 'Metadata QA pass must keep final render blocked.')
  assert.equal(localWorkerOutputQaReview.finalRenderReadiness.ready, false, 'Final render readiness must stay false after metadata QA.')
  assert.equal(localWorkerOutputQaReview.finalRenderReadiness.mediaArtifactCount, 0, 'Final render readiness must still see zero media artifacts.')
  assert.equal(localWorkerOutputQaReview.finalRenderReadiness.metadataQaPassedArtifactIds.length, localWorkerOutput.persistedArtifactCount)
  assert.equal(localWorkerOutputQaReview.finalRenderReadiness.mediaQaRequiredArtifactIds.length, localWorkerOutput.persistedArtifactCount)
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.qaStatus === 'passed_metadata_integrity_only'), 'All metadata QA results should pass.')
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.metadataIntegrityPassed === true), 'All metadata integrity checks should pass.')
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.mediaQaRequired === true), 'All QA results should preserve media QA requirement.')
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.finalRenderEligible === false), 'QA results must not make artifacts final-render eligible.')
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.blocksFinalRender === true), 'QA results should still block final render.')
  assert.ok(localWorkerOutputQaReview.qaResults.every((result) => result.checks.every((check) => check.passed === true)), 'All metadata QA checks should pass.')
  assert.equal(localWorkerOutputQaReview.nextRequiredGate, 'uploaded_media_worker_execution_with_private_artifact_outputs')
  assert.ok(localWorkerOutputQaReview.blockers.some((blocker) => /uploaded user media/i.test(blocker)), 'Local output QA must explain uploaded-media execution is still pending.')
  assert.ok(localWorkerOutputQaReview.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Local output QA must state no worker handler ran.')

  const localWorkerOutputQaReviewReplay = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-local-output-qa')
  assert.equal(localWorkerOutputQaReviewReplay.status, 201, 'Idempotent local worker output QA replay should succeed.')
  assert.equal(localWorkerOutputQaReviewReplay.json.data?.localWorkerOutputQaReview?.id, localWorkerOutputQaReview.id, 'Local worker output QA replay should not duplicate QA records.')

  const missingWorkflowReservation = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/workflow-rehearsal`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    scenarioId: 'talking-head-clean-edit',
    rehearsalOnly: true,
  }, 'route-package-workflow-rehearsal-missing-reservation')
  assert.equal(missingWorkflowReservation.status, 400, 'Workflow rehearsal should require credit reservation evidence.')
  assert.equal(missingWorkflowReservation.json.error?.code, 'VALIDATION_FAILED')

  const workflowRehearsalResponse = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/workflow-rehearsal`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    scenarioId: 'talking-head-clean-edit',
    rehearsalOnly: true,
  }, 'route-package-workflow-rehearsal')
  assert.equal(workflowRehearsalResponse.status, 201, `Workflow rehearsal should succeed: ${JSON.stringify(workflowRehearsalResponse.json)}`)
  const workflowRehearsal = workflowRehearsalResponse.json.data?.workflowRehearsal
  assert.ok(workflowRehearsal, 'Workflow rehearsal response should include workflowRehearsal.')
  assert.equal(workflowRehearsal.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(workflowRehearsal.resultReconciliationId, resultReconciliation.id)
  assert.equal(workflowRehearsal.handlerDryRunId, handlerDryRun.id)
  assert.equal(workflowRehearsal.packageRecordId, createdPackage.packageRecordId)
  assert.equal(workflowRehearsal.approvedPlanSnapshotId, snapshot.id)
  assert.equal(workflowRehearsal.creditReservationId, requestBody.creditReservationId)
  assert.equal(workflowRehearsal.status, 'production_workflow_rehearsed_waiting_uploaded_media_worker_execution')
  assert.equal(workflowRehearsal.rehearsalOnly, true)
  assert.equal(workflowRehearsal.workflowMode, 'dry_run')
  assert.equal(workflowRehearsal.scenarioId, 'talking-head-clean-edit')
  assert.ok(workflowRehearsal.stageCount > 0, 'Workflow rehearsal should run production workflow stages.')
  assert.ok(workflowRehearsal.completedStageCount > 0, 'Workflow rehearsal should complete dry-run stages.')
  assert.ok(workflowRehearsal.workflowStages.includes('media_foundation'), 'Workflow rehearsal should include media foundation stage.')
  assert.ok(workflowRehearsal.workflowStages.includes('final_render_export_execution'), 'Workflow rehearsal should include final render/export stage planning.')
  assert.ok(workflowRehearsal.artifactCount > 0, 'Workflow rehearsal should produce private artifact references.')
  assert.ok(workflowRehearsal.privateArtifactCount > 0, 'Workflow rehearsal artifact refs should be private.')
  assert.ok(workflowRehearsal.qaGateCount > 0, 'Workflow rehearsal should produce QA gates.')
  assert.equal(workflowRehearsal.finalDeliveryAllowed, false, 'Workflow rehearsal must not allow final delivery.')
  assert.equal(workflowRehearsal.productionReadyAllowed, false, 'Workflow rehearsal must not claim production readiness.')
  assert.equal(workflowRehearsal.liveExecutionReady, false, 'Workflow rehearsal must not enable live execution.')
  assert.equal(workflowRehearsal.renderPreviewReady, false, 'Workflow rehearsal must not claim rendered preview readiness.')
  assert.equal(workflowRehearsal.finalRenderReady, false, 'Workflow rehearsal must keep final render blocked.')
  assert.equal(workflowRehearsal.localOutputQaStatus, 'passed_metadata_integrity_only', 'Workflow rehearsal should see local-output metadata QA as passed.')
  assert.equal(workflowRehearsal.report.mode, 'dry_run')
  assert.equal(workflowRehearsal.report.artifactSummary.sourceImmutable, true, 'Workflow rehearsal must preserve source immutability.')
  assert.equal(workflowRehearsal.report.qaSummary.finalDeliveryAllowed, false, 'Workflow rehearsal report must keep final delivery blocked.')
  assert.equal(workflowRehearsal.nextRequiredGate, 'uploaded_media_worker_execution_with_private_artifact_outputs')
  assert.ok(workflowRehearsal.blockers.some((blocker) => /uploaded user media/i.test(blocker)), 'Workflow rehearsal must explain uploaded-media execution is still pending.')
  assert.ok(workflowRehearsal.noRuntimeSideEffects.some((note) => /No uploaded media bytes were processed/i.test(note)), 'Workflow rehearsal must state no uploaded media was processed.')

  const workflowRehearsalReplay = await postJson(`${baseUrl}/v1/edit-executions/local-worker-outputs/${localWorkerOutput.id}/workflow-rehearsal`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    scenarioId: 'talking-head-clean-edit',
    rehearsalOnly: true,
  }, 'route-package-workflow-rehearsal')
  assert.equal(workflowRehearsalReplay.status, 201, 'Idempotent workflow rehearsal replay should succeed.')
  assert.equal(workflowRehearsalReplay.json.data?.workflowRehearsal?.id, workflowRehearsal.id, 'Workflow rehearsal replay should not duplicate dry-run stage reports.')

  const missingUploadedMediaReservation = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets,
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-missing-reservation')
  assert.equal(missingUploadedMediaReservation.status, 400, 'Uploaded-media worker execution should require credit reservation evidence.')
  assert.equal(missingUploadedMediaReservation.json.error?.code, 'VALIDATION_FAILED')

  const mockSourceUploadedMediaExecution = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset) => ({
      ...asset,
      storageProvider: 'local_mock',
    })),
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-mock-source-blocked')
  assert.equal(mockSourceUploadedMediaExecution.status, 400, 'Uploaded-media worker execution should reject mock source assets.')
  assert.equal(mockSourceUploadedMediaExecution.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(mockSourceUploadedMediaExecution.json.error), /storageProvider_mock_not_allowed_for_uploaded_execution_source/)

  const missingChecksumUploadedMediaExecution = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets.map(({ checksumSha256, ...asset }) => {
      void checksumSha256
      return asset
    }),
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-missing-source-checksum')
  assert.equal(missingChecksumUploadedMediaExecution.status, 400, 'Uploaded-media worker execution should reject source assets without finalized checksum evidence.')
  assert.equal(missingChecksumUploadedMediaExecution.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(missingChecksumUploadedMediaExecution.json.error), /checksumSha256/)

  const zeroByteUploadedMediaExecution = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset) => ({
      ...asset,
      byteSize: 0,
    })),
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-zero-byte-source')
  assert.equal(zeroByteUploadedMediaExecution.status, 400, 'Uploaded-media worker execution should reject zero-byte source assets before execution state is created.')
  assert.equal(zeroByteUploadedMediaExecution.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(zeroByteUploadedMediaExecution.json.error), /Too small: expected number to be >0|byteSize/)

  const mismatchedApprovedSourceUploadedMediaExecution = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset, index) => index === 0
      ? {
          ...asset,
          uploadedClipId: 'stale-uploaded-clip-after-approval',
        }
      : asset),
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-approved-source-mismatch')
  assert.equal(mismatchedApprovedSourceUploadedMediaExecution.status, 400, 'Uploaded-media worker execution should reject source assets that do not match the approved snapshot source sequence.')
  assert.equal(mismatchedApprovedSourceUploadedMediaExecution.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(mismatchedApprovedSourceUploadedMediaExecution.json.error), /uploadedClipId_mismatch|approved snapshot source sequence/)

  const swappedApprovedSourceUploadedMediaExecution = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset, index) => index === 0
      ? {
          ...asset,
          mediaAssetId: `${asset.mediaAssetId}-swapped-after-approval`,
          storagePath: `${asset.storagePath}.swapped`,
          checksumSha256: 'f'.repeat(64),
        }
      : asset),
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-execution-approved-source-identity-mismatch')
  assert.equal(swappedApprovedSourceUploadedMediaExecution.status, 400, 'Uploaded-media worker execution should reject source assets whose exact approved media identity changed after approval.')
  assert.equal(swappedApprovedSourceUploadedMediaExecution.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(swappedApprovedSourceUploadedMediaExecution.json.error), /mediaAssetId_mismatch|checksumSha256_mismatch|storagePath_mismatch/)

  const uploadedMediaWorkerExecutionResponse = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets,
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-worker-execution')
  assert.equal(uploadedMediaWorkerExecutionResponse.status, 201, `Uploaded-media worker execution metadata should succeed: ${JSON.stringify(uploadedMediaWorkerExecutionResponse.json)}`)
  const uploadedMediaWorkerExecution = uploadedMediaWorkerExecutionResponse.json.data?.uploadedMediaWorkerExecution
  assert.ok(uploadedMediaWorkerExecution, 'Uploaded-media worker execution response should include uploadedMediaWorkerExecution.')
  assert.equal(uploadedMediaWorkerExecution.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(uploadedMediaWorkerExecution.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(uploadedMediaWorkerExecution.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(uploadedMediaWorkerExecution.approvedPlanSnapshotId, snapshot.id)
  assert.equal(uploadedMediaWorkerExecution.creditReservationId, requestBody.creditReservationId)
  assert.equal(uploadedMediaWorkerExecution.status, 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa')
  assert.equal(uploadedMediaWorkerExecution.uploadedMediaExecutionOnly, true)
  assert.equal(uploadedMediaWorkerExecution.workerExecutionMode, 'metadata_only_no_media_processing')
  assert.equal(uploadedMediaWorkerExecution.sourceMediaAssetCount, uploadedSourceMediaAssets.length)
  assert.equal(uploadedMediaWorkerExecution.privateWorkerArtifactCount, localWorkerOutputQaReview.passedArtifactCount)
  assert.equal(uploadedMediaWorkerExecution.sourceBoundArtifactCount, uploadedMediaWorkerExecution.privateWorkerArtifactCount)
  assert.equal(uploadedMediaWorkerExecution.mediaArtifactCount, 0, 'Uploaded-media worker execution metadata must not claim media artifacts.')
  assert.equal(uploadedMediaWorkerExecution.qaPendingCount, uploadedMediaWorkerExecution.privateWorkerArtifactCount)
  assert.equal(uploadedMediaWorkerExecution.workersStarted, 0, 'Uploaded-media metadata gate must not start real workers.')
  assert.equal(uploadedMediaWorkerExecution.workerHandlersStarted, 0, 'Uploaded-media metadata gate must not start real handlers.')
  assert.equal(uploadedMediaWorkerExecution.toolsExecuted, 0, 'Uploaded-media metadata gate must not execute tools.')
  assert.equal(uploadedMediaWorkerExecution.mediaBytesProcessed, false, 'Uploaded-media metadata gate must not process media bytes.')
  assert.equal(uploadedMediaWorkerExecution.liveExecutionReady, false)
  assert.equal(uploadedMediaWorkerExecution.internalResultReviewReady, true)
  assert.equal(uploadedMediaWorkerExecution.previewReviewReady, true)
  assert.equal(uploadedMediaWorkerExecution.renderPreviewReady, false)
  assert.equal(uploadedMediaWorkerExecution.finalRenderReady, false)
  assert.equal(uploadedMediaWorkerExecution.finalRenderReadiness.ready, false)
  assert.equal(uploadedMediaWorkerExecution.finalRenderReadiness.sourceMediaAssetCount, uploadedSourceMediaAssets.length)
  assert.equal(uploadedMediaWorkerExecution.finalRenderReadiness.privateWorkerArtifactCount, uploadedMediaWorkerExecution.privateWorkerArtifactCount)
  assert.equal(uploadedMediaWorkerExecution.finalRenderReadiness.mediaArtifactCount, 0)
  assert.ok(uploadedMediaWorkerExecution.sourceMediaAssets.every((asset) => asset.privateArtifact === true), 'Source media assets must remain private.')
  assert.ok(uploadedMediaWorkerExecution.sourceMediaAssets.every((asset) => /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')), 'Source media assets must preserve finalized upload checksums.')
  assert.ok(uploadedMediaWorkerExecution.sourceMediaAssets.every((asset) => !/^https?:\/\//i.test(asset.storagePath)), 'Source media assets must not use public URLs.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.privateArtifact === true), 'Worker artifacts must stay private.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.publicArtifact === false), 'Worker artifacts must not be public.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.signedUrl === null), 'Worker artifacts must not include signed URLs.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.sourceOfTruth === true), 'Worker artifacts should be source-of-truth metadata.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.sourceOfTruthScope === 'uploaded_media_worker_execution_metadata_only'), 'Worker artifacts must scope source truth to metadata only.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.workerOutputArtifact === true), 'Worker artifacts must be marked as worker output artifacts.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.sourceMediaBound === true), 'Worker artifacts must be bound to source media.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.mediaArtifact === false), 'Worker artifacts must not claim media bytes.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.finalRenderEligible === false), 'Worker artifacts must not be final-render eligible.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.previewReviewEligible === true), 'Worker artifacts should be eligible for internal preview review.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.localFilePath.startsWith(localStorageRoot)), 'Worker artifacts must stay under local storage root.')
  assert.ok(uploadedMediaWorkerExecution.privateWorkerArtifacts.every((artifact) => artifact.sha256.length === 64), 'Worker artifacts must include checksums.')
  assert.ok(uploadedMediaWorkerExecution.qaHandoffRecords.every((record) => record.blocksFinalRender === true), 'Uploaded-media QA handoffs must block final render.')
  assert.equal(uploadedMediaWorkerExecution.nextRequiredGate, 'private_worker_artifact_qa_review')
  assert.ok(uploadedMediaWorkerExecution.blockers.some((blocker) => /no uploaded media bytes/i.test(blocker)), 'Uploaded-media metadata gate must explain media bytes were not processed.')
  assert.ok(uploadedMediaWorkerExecution.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Uploaded-media metadata gate must state no worker handler ran.')

  const uploadedMediaWorkerExecutionReplay = await postJson(`${baseUrl}/v1/edit-executions/workflow-rehearsals/${workflowRehearsal.id}/uploaded-media-worker-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    localWorkerOutputId: localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaReview.id,
    sourceMediaAssets: uploadedSourceMediaAssets,
    uploadedMediaExecutionOnly: true,
  }, 'route-package-uploaded-media-worker-execution')
  assert.equal(uploadedMediaWorkerExecutionReplay.status, 201, 'Idempotent uploaded-media worker execution replay should succeed.')
  assert.equal(uploadedMediaWorkerExecutionReplay.json.data?.uploadedMediaWorkerExecution?.id, uploadedMediaWorkerExecution.id, 'Uploaded-media worker execution replay should not duplicate private artifact metadata.')

  const missingPrivateArtifactQaReservation = await postJson(`${baseUrl}/v1/edit-executions/uploaded-media-worker-executions/${uploadedMediaWorkerExecution.id}/private-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    qaReviewOnly: true,
  }, 'route-package-private-worker-artifact-qa-missing-reservation')
  assert.equal(missingPrivateArtifactQaReservation.status, 400, 'Private worker artifact QA should require credit reservation evidence.')
  assert.equal(missingPrivateArtifactQaReservation.json.error?.code, 'VALIDATION_FAILED')

  const privateWorkerArtifactQaResponse = await postJson(`${baseUrl}/v1/edit-executions/uploaded-media-worker-executions/${uploadedMediaWorkerExecution.id}/private-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-private-worker-artifact-qa-review')
  assert.equal(privateWorkerArtifactQaResponse.status, 201, `Private worker artifact QA should succeed: ${JSON.stringify(privateWorkerArtifactQaResponse.json)}`)
  const privateWorkerArtifactQaReview = privateWorkerArtifactQaResponse.json.data?.privateWorkerArtifactQaReview
  assert.ok(privateWorkerArtifactQaReview, 'Private worker artifact QA response should include privateWorkerArtifactQaReview.')
  assert.equal(privateWorkerArtifactQaReview.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(privateWorkerArtifactQaReview.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(privateWorkerArtifactQaReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(privateWorkerArtifactQaReview.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(privateWorkerArtifactQaReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(privateWorkerArtifactQaReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(privateWorkerArtifactQaReview.status, 'private_worker_artifact_qa_passed_waiting_real_media_processing')
  assert.equal(privateWorkerArtifactQaReview.qaReviewOnly, true)
  assert.equal(privateWorkerArtifactQaReview.reviewedArtifactCount, uploadedMediaWorkerExecution.privateWorkerArtifactCount)
  assert.equal(privateWorkerArtifactQaReview.passedArtifactCount, uploadedMediaWorkerExecution.privateWorkerArtifactCount)
  assert.equal(privateWorkerArtifactQaReview.blockedArtifactCount, 0)
  assert.equal(privateWorkerArtifactQaReview.sourceBoundArtifactCount, uploadedMediaWorkerExecution.sourceBoundArtifactCount)
  assert.equal(privateWorkerArtifactQaReview.mediaArtifactCount, 0, 'Private worker artifact QA must not claim media artifacts.')
  assert.equal(privateWorkerArtifactQaReview.workersStarted, 0, 'Private worker artifact QA must not start real workers.')
  assert.equal(privateWorkerArtifactQaReview.workerHandlersStarted, 0, 'Private worker artifact QA must not start real handlers.')
  assert.equal(privateWorkerArtifactQaReview.toolsExecuted, 0, 'Private worker artifact QA must not execute tools.')
  assert.equal(privateWorkerArtifactQaReview.mediaBytesProcessed, false, 'Private worker artifact QA must not process media bytes.')
  assert.equal(privateWorkerArtifactQaReview.liveExecutionReady, false)
  assert.equal(privateWorkerArtifactQaReview.internalResultReviewReady, true)
  assert.equal(privateWorkerArtifactQaReview.previewReviewReady, true)
  assert.equal(privateWorkerArtifactQaReview.renderPreviewReady, false)
  assert.equal(privateWorkerArtifactQaReview.finalRenderReady, false)
  assert.equal(privateWorkerArtifactQaReview.finalRenderReadiness.ready, false)
  assert.equal(privateWorkerArtifactQaReview.finalRenderReadiness.sourceBoundArtifactCount, uploadedMediaWorkerExecution.sourceBoundArtifactCount)
  assert.equal(privateWorkerArtifactQaReview.finalRenderReadiness.mediaArtifactCount, 0)
  assert.ok(privateWorkerArtifactQaReview.qaResults.every((result) => result.metadataIntegrityPassed === true), 'Private worker artifact QA should pass metadata integrity.')
  assert.ok(privateWorkerArtifactQaReview.qaResults.every((result) => result.sourceMediaBound === true), 'Private worker artifact QA should confirm source media binding.')
  assert.ok(privateWorkerArtifactQaReview.qaResults.every((result) => result.mediaQaRequired === true), 'Private worker artifact QA should require media QA later.')
  assert.ok(privateWorkerArtifactQaReview.qaResults.every((result) => result.finalRenderEligible === false), 'Private worker artifact QA must not mark artifacts final-render eligible.')
  assert.equal(privateWorkerArtifactQaReview.nextRequiredGate, 'real_media_processing_worker_execution_with_private_media_artifacts')
  assert.ok(privateWorkerArtifactQaReview.blockers.some((blocker) => /No uploaded media bytes/i.test(blocker)), 'Private worker artifact QA must explain media bytes were not processed.')
  assert.ok(privateWorkerArtifactQaReview.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Private worker artifact QA must state no worker handler ran.')

  const privateWorkerArtifactQaReplay = await postJson(`${baseUrl}/v1/edit-executions/uploaded-media-worker-executions/${uploadedMediaWorkerExecution.id}/private-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-private-worker-artifact-qa-review')
  assert.equal(privateWorkerArtifactQaReplay.status, 201, 'Idempotent private worker artifact QA replay should succeed.')
  assert.equal(privateWorkerArtifactQaReplay.json.data?.privateWorkerArtifactQaReview?.id, privateWorkerArtifactQaReview.id, 'Private worker artifact QA replay should not duplicate review records.')

  const firstUploadedSourcePath = join(localStorageRoot, uploadedSourceMediaAssets[0].storagePath)
  const firstUploadedSourceBytes = await readFile(firstUploadedSourcePath)

  await rm(firstUploadedSourcePath, { force: true })
  try {
    const missingLocalFileProcessingResponse = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
      workspaceId: requestBody.workspaceId,
      projectId: requestBody.projectId,
      creditReservationId: requestBody.creditReservationId,
      processingExecutionOnly: true,
      processingMode: 'bounded_preview_render',
      maxDurationSeconds: 1,
      targetWidth: 160,
      targetHeight: 90,
      fps: 8,
    }, 'route-package-local-media-processing-missing-source-file')
    assert.equal(missingLocalFileProcessingResponse.status, 404, 'Local media processing should reject missing uploaded source bytes instead of rendering placeholders.')
    assert.equal(missingLocalFileProcessingResponse.json.error?.code, 'UPLOAD_NOT_FINALIZED')
  } finally {
    await writeFile(firstUploadedSourcePath, firstUploadedSourceBytes)
  }

  await writeFile(firstUploadedSourcePath, Buffer.concat([firstUploadedSourceBytes, Buffer.from('byte-size-drift')]))
  try {
    const mismatchedByteSizeProcessingResponse = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
      workspaceId: requestBody.workspaceId,
      projectId: requestBody.projectId,
      creditReservationId: requestBody.creditReservationId,
      processingExecutionOnly: true,
      processingMode: 'bounded_preview_render',
      maxDurationSeconds: 1,
      targetWidth: 160,
      targetHeight: 90,
      fps: 8,
    }, 'route-package-local-media-processing-byte-size-mismatch')
    assert.equal(mismatchedByteSizeProcessingResponse.status, 409, 'Local media processing should reject uploaded source files that do not match finalized byte metadata.')
    assert.equal(mismatchedByteSizeProcessingResponse.json.error?.code, 'UPLOAD_SOURCE_MISMATCH')
  } finally {
    await writeFile(firstUploadedSourcePath, firstUploadedSourceBytes)
  }

  const checksumDriftBytes = Buffer.from(firstUploadedSourceBytes)
  checksumDriftBytes[0] = checksumDriftBytes[0] === 0 ? 1 : checksumDriftBytes[0] - 1
  await writeFile(firstUploadedSourcePath, checksumDriftBytes)
  try {
    const mismatchedChecksumProcessingResponse = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
      workspaceId: requestBody.workspaceId,
      projectId: requestBody.projectId,
      creditReservationId: requestBody.creditReservationId,
      processingExecutionOnly: true,
      processingMode: 'bounded_preview_render',
      maxDurationSeconds: 1,
      targetWidth: 160,
      targetHeight: 90,
      fps: 8,
    }, 'route-package-local-media-processing-checksum-mismatch')
    assert.equal(mismatchedChecksumProcessingResponse.status, 409, 'Local media processing should reject uploaded source files that do not match finalized checksum metadata.')
    assert.equal(mismatchedChecksumProcessingResponse.json.error?.code, 'UPLOAD_SOURCE_MISMATCH')
  } finally {
    await writeFile(firstUploadedSourcePath, firstUploadedSourceBytes)
  }

  const missingLocalMediaProcessingReservation = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    processingExecutionOnly: true,
    processingMode: 'bounded_preview_render',
  }, 'route-package-local-media-processing-missing-reservation')
  assert.equal(missingLocalMediaProcessingReservation.status, 400, 'Local media processing should require credit reservation evidence.')
  assert.equal(missingLocalMediaProcessingReservation.json.error?.code, 'VALIDATION_FAILED')

  const localMediaProcessingResponse = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    processingExecutionOnly: true,
    processingMode: 'bounded_preview_render',
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
  }, 'route-package-local-media-processing-execution')
  assert.equal(localMediaProcessingResponse.status, 201, `Local media processing should succeed: ${JSON.stringify(localMediaProcessingResponse.json)}`)
  const localMediaProcessingExecution = localMediaProcessingResponse.json.data?.localMediaProcessingExecution
  assert.ok(localMediaProcessingExecution, 'Local media processing response should include localMediaProcessingExecution.')
  assert.equal(localMediaProcessingExecution.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(localMediaProcessingExecution.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(localMediaProcessingExecution.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(localMediaProcessingExecution.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(localMediaProcessingExecution.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(localMediaProcessingExecution.approvedPlanSnapshotId, snapshot.id)
  assert.equal(localMediaProcessingExecution.creditReservationId, requestBody.creditReservationId)
  assert.equal(localMediaProcessingExecution.status, 'local_media_processing_execution_completed_waiting_private_media_artifact_qa')
  assert.equal(localMediaProcessingExecution.processingExecutionOnly, true)
  assert.equal(localMediaProcessingExecution.processingMode, 'bounded_preview_render')
  assert.equal(localMediaProcessingExecution.inputArtifactCount, privateWorkerArtifactQaReview.passedArtifactCount)
  assert.equal(localMediaProcessingExecution.processedArtifactCount, privateWorkerArtifactQaReview.passedArtifactCount)
  assert.equal(localMediaProcessingExecution.privateMediaArtifactCount, localMediaProcessingExecution.processedArtifactCount)
  assert.equal(localMediaProcessingExecution.mediaArtifactCount, localMediaProcessingExecution.processedArtifactCount)
  assert.equal(localMediaProcessingExecution.workersStarted, 0, 'Local media processing should not start external worker infrastructure.')
  assert.equal(localMediaProcessingExecution.workerHandlersStarted, 1, 'Local media processing should record the bounded local handler execution.')
  assert.equal(localMediaProcessingExecution.toolsExecuted, 1, 'Local media processing should record the bounded local media processor.')
  assert.equal(localMediaProcessingExecution.mediaBytesProcessed, true, 'Local media processing should process real local media bytes.')
  assert.equal(localMediaProcessingExecution.liveExecutionReady, false)
  assert.equal(localMediaProcessingExecution.internalResultReviewReady, true)
  assert.equal(localMediaProcessingExecution.previewReviewReady, true)
  assert.equal(localMediaProcessingExecution.renderPreviewReady, false)
  assert.equal(localMediaProcessingExecution.finalRenderReady, false)
  assert.equal(localMediaProcessingExecution.finalRenderReadiness.ready, false)
  assert.equal(localMediaProcessingExecution.finalRenderReadiness.privateMediaArtifactCount, localMediaProcessingExecution.privateMediaArtifactCount)
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.privateArtifact === true), 'Processed artifacts must stay private.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.publicArtifact === false), 'Processed artifacts must not be public.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.signedUrl === null), 'Processed artifacts must not include signed URLs.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.sourceOfTruth === true), 'Processed artifacts should be source-of-truth private artifacts.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.sourceOfTruthScope === 'local_media_processing_execution_private_artifact'), 'Processed artifacts must use the local media processing source scope.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.mediaArtifact === true), 'Processed artifacts must be media artifacts.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.processedMediaArtifact === true), 'Processed artifacts must be marked as processed media artifacts.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.sourceMediaBound === true), 'Processed artifacts must stay source-media bound.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.finalRenderEligible === false), 'Processed artifacts must not be final-render eligible before QA/render gates.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.localFilePath.startsWith(localStorageRoot)), 'Processed artifacts must stay under local storage root.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.sha256.length === 64), 'Processed artifacts must include checksums.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.byteSize > 0), 'Processed artifacts must include media bytes.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.commandSummary.audioMode === 'copy_or_transcode'), 'Processed previews should preserve or transcode source audio when available.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.commandSummary.audioSource === 'generated_silence'), 'Synthetic silent fixtures should receive generated silence for concat-safe final rendering.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.commandSummary.fitMode === 'contain'), 'Processed previews should preserve source aspect ratio.')
  assert.equal(localMediaProcessingExecution.audioExecutionReviewCount, localMediaProcessingExecution.processedArtifacts.length, 'Local media processing should attach uploaded-source audio QA evidence for each processed artifact.')
  assert.ok(localMediaProcessingExecution.audioExecutionQaGateCount >= localMediaProcessingExecution.processedArtifacts.length, 'Audio QA review should include gate evidence.')
  assert.ok(localMediaProcessingExecution.audioExecutionBlockingQaGateCount >= 0)
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.sourceMediaAssetId === artifact.sourceMediaAssetId), 'Audio QA review should stay bound to the uploaded source media.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.sourceArtifactId === artifact.sourceArtifactId), 'Audio QA review should stay bound to the private worker artifact.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.processedArtifactId === artifact.artifactId), 'Audio QA review should stay bound to the processed media artifact.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.mode === 'local_dev'), 'Audio QA review should use backend local-dev execution mode only.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.artifactCount && artifact.audioExecutionReview.artifactCount >= 2), 'Audio QA review should write private analysis/QA artifacts.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.qaGateCount && artifact.audioExecutionReview.qaGateCount >= 1), 'Audio QA review should include QA gates.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.blocksFinalExport === true), 'Audio QA review must keep final export blocked until later gates.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.finalMuxAllowed === false), 'Audio QA review must not allow final mux.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.productRuntimeExecuted === false), 'Audio QA review must not claim product runtime execution.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.audioExecutionReview?.publicArtifact === false && artifact.audioExecutionReview.signedUrl === null), 'Audio QA review must remain private with no signed URL.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) =>
    artifact.commandSummary.filters.some((filter: string) => filter.includes('force_original_aspect_ratio=decrease') && filter.includes('pad=')),
  ), 'Processed previews should pad into the confirmed frame instead of stretching source footage.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.approvedSourceRange.source === 'source_cleanup_plan'), 'Processed previews should use approved source cleanup ranges when available.')
  assert.ok(localMediaProcessingExecution.processedArtifacts.every((artifact) => artifact.approvedSourceRange.requestedMaxDurationSeconds === 1), 'Processed previews should preserve the requested bounded review duration.')
  assert.ok(localMediaProcessingExecution.processedArtifacts
    .filter((artifact) => artifact.uploadedOrder === 1)
    .every((artifact) => artifact.commandSummary.startSeconds === 0.5 && artifact.approvedSourceRange.startSeconds === 0.5), 'Uploaded-order 1 previews should start from the approved non-zero source trim range.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage, 'Local media processing should create a private caption execution package from approved timing.')
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.source, 'approved_caption_timing_private_caption_files')
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.transcriptSource, 'approved_master_timing_caption_items_no_real_transcription')
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.approvedPlanSnapshotId, snapshot.id)
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.transcriptWorkerOutput, false)
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.realSpeechModelExecution, false)
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.captionFileCount, 3)
  assert.deepEqual(new Set(localMediaProcessingExecution.captionExecutionPackage?.captionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.ok((localMediaProcessingExecution.captionExecutionPackage?.captionSegmentCount ?? 0) > 0, 'Caption package should include generated caption segments.')
  assert.ok((localMediaProcessingExecution.captionExecutionPackage?.qaGateCount ?? 0) >= 4, 'Caption package should include timing/readability/safe-zone QA gates.')
  assert.equal(localMediaProcessingExecution.captionExecutionPackage?.qaPassed, true, 'Caption package QA should pass or warn without blocking the private review.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage?.captionFiles.every((file) => file.localFilePath.startsWith(localStorageRoot)), 'Caption files must stay under local storage root.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage?.captionFiles.every((file) => file.privateArtifact === true && file.publicArtifact === false && file.signedUrl === null), 'Caption files must stay private with no signed URL.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage?.captionFiles.every((file) => file.sourceOfTruth === true && file.sourceOfTruthScope === 'approved_caption_timing_private_caption_file'), 'Caption files must be source-of-truth private caption artifacts.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage?.captionFiles.every((file) => file.transcriptWorkerOutput === false), 'Caption files must not pretend real transcript-worker output exists.')
  assert.ok(localMediaProcessingExecution.captionExecutionPackage?.captionFiles.every((file) => file.sha256.length === 64 && file.byteSize > 0), 'Caption files must include checksums and bytes.')
  assert.equal(localMediaProcessingExecution.nextRequiredGate, 'private_media_artifact_qa_review')
  assert.ok(localMediaProcessingExecution.blockers.some((blocker) => /QA has not passed/i.test(blocker)), 'Local media processing must keep media QA explicit.')
  assert.ok(localMediaProcessingExecution.noRuntimeSideEffects.some((note) => /LOCAL_STORAGE_ROOT/i.test(note)), 'Local media processing must state local private storage scope.')

  const localMediaProcessingReplay = await postJson(`${baseUrl}/v1/edit-executions/private-worker-artifact-qa-reviews/${privateWorkerArtifactQaReview.id}/local-media-processing-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    processingExecutionOnly: true,
    processingMode: 'bounded_preview_render',
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
  }, 'route-package-local-media-processing-execution')
  assert.equal(localMediaProcessingReplay.status, 201, 'Idempotent local media processing replay should succeed.')
  assert.equal(localMediaProcessingReplay.json.data?.localMediaProcessingExecution?.id, localMediaProcessingExecution.id, 'Local media processing replay should not duplicate processed artifacts.')

  const missingPrivateMediaQaReservation = await postJson(`${baseUrl}/v1/edit-executions/local-media-processing-executions/${localMediaProcessingExecution.id}/private-media-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    qaReviewOnly: true,
  }, 'route-package-private-media-artifact-qa-missing-reservation')
  assert.equal(missingPrivateMediaQaReservation.status, 400, 'Private media artifact QA should require credit reservation evidence.')
  assert.equal(missingPrivateMediaQaReservation.json.error?.code, 'VALIDATION_FAILED')

  const privateMediaArtifactQaResponse = await postJson(`${baseUrl}/v1/edit-executions/local-media-processing-executions/${localMediaProcessingExecution.id}/private-media-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-private-media-artifact-qa-review')
  assert.equal(privateMediaArtifactQaResponse.status, 201, `Private media artifact QA should succeed: ${JSON.stringify(privateMediaArtifactQaResponse.json)}`)
  const privateMediaArtifactQaReview = privateMediaArtifactQaResponse.json.data?.privateMediaArtifactQaReview
  assert.ok(privateMediaArtifactQaReview, 'Private media artifact QA response should include privateMediaArtifactQaReview.')
  assert.equal(privateMediaArtifactQaReview.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(privateMediaArtifactQaReview.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(privateMediaArtifactQaReview.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(privateMediaArtifactQaReview.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(privateMediaArtifactQaReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(privateMediaArtifactQaReview.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(privateMediaArtifactQaReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(privateMediaArtifactQaReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(privateMediaArtifactQaReview.status, 'private_media_artifact_qa_passed_waiting_render_preview_assembly')
  assert.equal(privateMediaArtifactQaReview.qaReviewOnly, true)
  assert.equal(privateMediaArtifactQaReview.reviewedArtifactCount, localMediaProcessingExecution.processedArtifactCount)
  assert.equal(privateMediaArtifactQaReview.passedArtifactCount, localMediaProcessingExecution.processedArtifactCount)
  assert.equal(privateMediaArtifactQaReview.blockedArtifactCount, 0)
  assert.equal(privateMediaArtifactQaReview.privateMediaArtifactCount, localMediaProcessingExecution.privateMediaArtifactCount)
  assert.equal(privateMediaArtifactQaReview.mediaArtifactCount, localMediaProcessingExecution.mediaArtifactCount)
  assert.equal(privateMediaArtifactQaReview.workersStarted, 0)
  assert.equal(privateMediaArtifactQaReview.workerHandlersStarted, 0)
  assert.equal(privateMediaArtifactQaReview.toolsExecuted, 1, 'Private media artifact QA executes bounded ffprobe inspection without processing media.')
  assert.equal(privateMediaArtifactQaReview.mediaBytesProcessed, false, 'Private media artifact QA should inspect existing artifacts without reprocessing media.')
  assert.equal(privateMediaArtifactQaReview.liveExecutionReady, false)
  assert.equal(privateMediaArtifactQaReview.internalResultReviewReady, true)
  assert.equal(privateMediaArtifactQaReview.previewReviewReady, true)
  assert.equal(privateMediaArtifactQaReview.renderPreviewReady, false)
  assert.equal(privateMediaArtifactQaReview.finalRenderReady, false)
  assert.equal(privateMediaArtifactQaReview.finalRenderReadiness.ready, false)
  assert.equal(privateMediaArtifactQaReview.finalRenderReadiness.privateMediaArtifactCount, localMediaProcessingExecution.privateMediaArtifactCount)
  assert.ok(privateMediaArtifactQaReview.qaResults.every((result) => result.mediaArtifactQaPassed === true), 'Private media artifact QA should pass media artifact checks.')
  assert.ok(privateMediaArtifactQaReview.qaResults.every((result) => result.sourceMediaBound === true), 'Private media artifact QA should confirm source binding.')
  assert.ok(privateMediaArtifactQaReview.qaResults.every((result) => result.previewReviewEligible === true), 'Private media artifact QA should preserve preview eligibility.')
  assert.ok(privateMediaArtifactQaReview.qaResults.every((result) => result.finalRenderEligible === false), 'Private media artifact QA must not mark artifacts final-render eligible.')
  assert.equal(privateMediaArtifactQaReview.nextRequiredGate, 'render_preview_assembly')
  assert.ok(privateMediaArtifactQaReview.blockers.some((blocker) => /Render preview assembly/i.test(blocker)), 'Private media artifact QA must keep render preview assembly explicit.')
  assert.ok(privateMediaArtifactQaReview.noRuntimeSideEffects.some((note) => /No worker handler ran/i.test(note)), 'Private media artifact QA must state no worker handler ran.')

  const privateMediaArtifactQaReplay = await postJson(`${baseUrl}/v1/edit-executions/local-media-processing-executions/${localMediaProcessingExecution.id}/private-media-artifact-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-private-media-artifact-qa-review')
  assert.equal(privateMediaArtifactQaReplay.status, 201, 'Idempotent private media artifact QA replay should succeed.')
  assert.equal(privateMediaArtifactQaReplay.json.data?.privateMediaArtifactQaReview?.id, privateMediaArtifactQaReview.id, 'Private media artifact QA replay should not duplicate review records.')

  const missingRenderPreviewAssemblyReservation = await postJson(`${baseUrl}/v1/edit-executions/private-media-artifact-qa-reviews/${privateMediaArtifactQaReview.id}/render-preview-assembly`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    assemblyOnly: true,
  }, 'route-package-render-preview-assembly-missing-reservation')
  assert.equal(missingRenderPreviewAssemblyReservation.status, 400, 'Render preview assembly should require credit reservation evidence.')
  assert.equal(missingRenderPreviewAssemblyReservation.json.error?.code, 'VALIDATION_FAILED')

  const renderPreviewAssemblyResponse = await postJson(`${baseUrl}/v1/edit-executions/private-media-artifact-qa-reviews/${privateMediaArtifactQaReview.id}/render-preview-assembly`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    assemblyOnly: true,
    ...(adapterWorkerArtifactIntegrationForRender
      ? {
        adapterWorkerArtifactIntegrationId: adapterWorkerArtifactIntegrationForRender.id,
        privateMediaRunnerQaReviewId: adapterWorkerArtifactIntegrationForRender.privateMediaRunnerQaReviewId,
      }
      : {}),
  }, 'route-package-render-preview-assembly')
  assert.equal(renderPreviewAssemblyResponse.status, 201, `Render preview assembly should succeed: ${JSON.stringify(renderPreviewAssemblyResponse.json)}`)
  const renderPreviewAssembly = renderPreviewAssemblyResponse.json.data?.renderPreviewAssembly
  assert.ok(renderPreviewAssembly, 'Render preview assembly response should include renderPreviewAssembly.')
  assert.equal(renderPreviewAssembly.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.id)
  assert.equal(renderPreviewAssembly.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(renderPreviewAssembly.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(renderPreviewAssembly.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(renderPreviewAssembly.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(renderPreviewAssembly.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(renderPreviewAssembly.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(renderPreviewAssembly.approvedPlanSnapshotId, snapshot.id)
  assert.equal(renderPreviewAssembly.creditReservationId, requestBody.creditReservationId)
  assert.equal(renderPreviewAssembly.status, 'render_preview_assembly_completed_waiting_user_preview_review')
  assert.equal(renderPreviewAssembly.assemblyOnly, true)
  assert.equal(renderPreviewAssembly.previewClipCount, snapshot.segments.length, 'Preview assembly should follow approved segment count, not raw artifact count.')
  assert.equal(renderPreviewAssembly.privatePreviewArtifactCount, 1)
  assert.equal(renderPreviewAssembly.mediaArtifactCount, privateMediaArtifactQaReview.mediaArtifactCount)
  assert.ok(renderPreviewAssembly.captionExecutionPackage, 'Render preview assembly should carry the private caption execution package.')
  assert.equal(renderPreviewAssembly.captionExecutionPackage?.id, localMediaProcessingExecution.captionExecutionPackage?.id)
  assert.equal(renderPreviewAssembly.captionExecutionPackage?.source, 'approved_caption_timing_private_caption_files')
  assert.equal(renderPreviewAssembly.captionExecutionPackage?.transcriptWorkerOutput, false)
  assert.equal(renderPreviewAssembly.captionExecutionPackage?.realSpeechModelExecution, false)
  assert.equal(renderPreviewAssembly.captionExecutionPackage?.captionArtifactCount, localMediaProcessingExecution.captionExecutionPackage?.captionArtifactCount)
  assert.deepEqual(new Set(renderPreviewAssembly.captionExecutionPackage?.captionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.equal(renderPreviewAssembly.workersStarted, 0)
  assert.equal(renderPreviewAssembly.workerHandlersStarted, 0)
  assert.equal(renderPreviewAssembly.toolsExecuted, 0)
  assert.equal(renderPreviewAssembly.mediaBytesProcessed, false, 'Render preview assembly should write manifest metadata without reprocessing media.')
  assert.equal(renderPreviewAssembly.liveExecutionReady, false)
  assert.equal(renderPreviewAssembly.internalResultReviewReady, true)
  assert.equal(renderPreviewAssembly.previewReviewReady, true)
  assert.equal(renderPreviewAssembly.renderPreviewReady, true)
  assert.equal(renderPreviewAssembly.finalRenderReady, false)
  assert.equal(renderPreviewAssembly.finalRenderReadiness.ready, false)
  assert.equal(renderPreviewAssembly.finalRenderReadiness.userPreviewReviewRequired, true)
  assert.equal(renderPreviewAssembly.finalRenderReadiness.previewManifestArtifactId, renderPreviewAssembly.previewManifestArtifact.artifactId)
  assert.equal(renderPreviewAssembly.finalRenderReadiness.previewClipArtifactIds.length, renderPreviewAssembly.previewClipCount)
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.privateArtifact === true), 'Preview clips must stay private.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.publicArtifact === false), 'Preview clips must not be public.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.signedUrl === null), 'Preview clips must not expose signed URLs.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.previewReviewEligible === true), 'Preview clips should be eligible for internal preview review.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.finalRenderEligible === false), 'Preview clips must not be final-render eligible.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.approvedSourceRange.source === 'source_cleanup_plan'), 'Preview assembly should preserve approved source ranges for QA.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.assemblySource === 'approved_segment_order'), 'Preview assembly should use approved segment order when snapshot segment metadata is available.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.approvedReviewOverlay?.source === 'approved_segment_metadata'), 'Approved segment preview clips should include private review overlay metadata.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => clip.approvedReviewOverlay?.safeForPrivateReview === true), 'Private review overlays must be marked safe for private review.')
  assert.ok(renderPreviewAssembly.previewClips.every((clip) => /^Beat \d+: /.test(clip.approvedReviewOverlay?.title ?? '')), 'Private review overlays should use approved edit beat labels.')
  const approvedCaptionPreviewClips = renderPreviewAssembly.previewClips.filter((clip) => clip.approvedCaptionOverlay)
  assert.ok(approvedCaptionPreviewClips.length > 0, 'Preview assembly should carry approved caption timing overlays when caption cues exist.')
  assert.ok(approvedCaptionPreviewClips.every((clip) => clip.approvedCaptionOverlay?.source === 'approved_caption_timing'), 'Caption overlays must be sourced from approved caption timing metadata.')
  assert.ok(approvedCaptionPreviewClips.every((clip) => clip.approvedCaptionOverlay?.transcriptWorkerOutput === false), 'Caption overlays must not claim real transcript-worker output.')
  const approvedTransitionPreviewClips = renderPreviewAssembly.previewClips.filter((clip) => clip.approvedTransitionPolish)
  assert.ok(approvedTransitionPreviewClips.length > 0, 'Preview assembly should carry approved transition polish when transition timing cues exist.')
  assert.ok(approvedTransitionPreviewClips.every((clip) => clip.approvedTransitionPolish?.source === 'approved_transition_timing'), 'Transition polish must be sourced from approved transition timing metadata.')
  assert.ok(approvedTransitionPreviewClips.every((clip) => (clip.approvedTransitionPolish?.transitionTimingItemIds.length ?? 0) > 0), 'Transition polish must reference approved transition timing IDs.')
  const approvedVisualPolishPreviewClips = renderPreviewAssembly.previewClips.filter((clip) => clip.approvedVisualPolish)
  assert.equal(approvedVisualPolishPreviewClips.length, renderPreviewAssembly.previewClipCount, 'Preview assembly should carry approved visual polish for every approved segment clip.')
  assert.ok(approvedVisualPolishPreviewClips.every((clip) => clip.approvedVisualPolish?.source === 'approved_color_pipeline_private_render'), 'Visual polish must be sourced from the approved color pipeline plan.')
  assert.ok(approvedVisualPolishPreviewClips.every((clip) => clip.approvedVisualPolish?.toolId === 'ffmpeg'), 'Private visual polish must stay on FFmpeg-native filters.')
  assert.ok(approvedVisualPolishPreviewClips.every((clip) => clip.approvedVisualPolish?.fullColorPipelineExecuted === false), 'Private visual polish must not claim full OpenColorIO/OpenImageIO color pipeline execution.')
  assert.ok(approvedVisualPolishPreviewClips.every((clip) => (clip.approvedVisualPolish?.operationIds.length ?? 0) > 0), 'Visual polish should reference approved color operations.')
  const approvedFinalTimingPreviewClips = renderPreviewAssembly.previewClips.filter((clip) => clip.approvedFinalTiming)
  const expectedApprovedFinalDurationSeconds = snapshot.masterTimingPlan?.finalTimelineSegments
    .slice(0, renderPreviewAssembly.previewClipCount)
    .reduce((sum, segmentTiming) => sum + segmentTiming.finalRange.durationSeconds, 0) ?? 0
  assert.equal(approvedFinalTimingPreviewClips.length, renderPreviewAssembly.previewClipCount, 'Preview assembly should carry approved final timing for every approved segment clip.')
  assert.ok(approvedFinalTimingPreviewClips.every((clip) => clip.approvedFinalTiming?.source === 'approved_master_timing_final_range'), 'Final timing metadata must be sourced from the approved MasterTimingPlan final range.')
  assert.ok(approvedFinalTimingPreviewClips.every((clip) => clip.approvedFinalTiming?.safeForPrivateReview === true), 'Approved final timing metadata must be safe for private review.')
  assert.ok(approvedFinalTimingPreviewClips.every((clip) => (clip.approvedFinalTiming?.durationSeconds ?? 0) > 0), 'Approved final timing must include a positive duration.')
  assert.deepEqual(
    renderPreviewAssembly.previewClips.map((clip) => clip.segmentOrder),
    snapshot.segments.map((segment) => segment.segment_order),
    'Preview assembly segment order should match the approved plan.',
  )
  assert.equal(
    renderPreviewAssembly.previewClips.filter((clip) => clip.sourceMediaAssetId === 'media-asset-clip-1').length,
    2,
    'Preview assembly should intentionally reuse clip 1 for the approved opening and ending segments.',
  )
  assert.ok(renderPreviewAssembly.previewClips
    .filter((clip) => clip.uploadedOrder === 1)
    .every((clip) => clip.approvedSourceRange.startSeconds === 0.5), 'Preview assembly should keep the approved non-zero source trim range.')
  const serializedRenderPreviewAssembly = JSON.stringify(renderPreviewAssembly)
  assert.equal(serializedRenderPreviewAssembly.includes('localFilePath'), false, 'Render preview HTTP DTO must not expose absolute server file-path fields.')
  assert.equal(serializedRenderPreviewAssembly.includes(localStorageRoot), false, 'Render preview HTTP DTO must not expose LOCAL_STORAGE_ROOT.')
  const previewManifestLocalPath = join(localStorageRoot, renderPreviewAssembly.previewManifestArtifact.storageObjectPath)
  assert.ok(previewManifestLocalPath.startsWith(localStorageRoot), 'Server-side preview manifest path must stay under local storage root.')
  assert.equal(renderPreviewAssembly.previewManifestArtifact.privateArtifact, true)
  assert.equal(renderPreviewAssembly.previewManifestArtifact.publicArtifact, false)
  assert.equal(renderPreviewAssembly.previewManifestArtifact.signedUrl, null)
  assert.equal(renderPreviewAssembly.previewManifestArtifact.sourceOfTruthScope, 'render_preview_assembly_private_manifest')
  assert.equal(renderPreviewAssembly.previewManifestArtifact.clipCount, renderPreviewAssembly.previewClipCount)
  assert.equal(renderPreviewAssembly.previewManifestArtifact.finalRenderEligible, false)
  assert.equal(renderPreviewAssembly.nextRequiredGate, 'user_preview_review')
  assert.ok(renderPreviewAssembly.blockers.some((blocker) => /preview review/i.test(blocker)), 'Render preview assembly must keep user preview review explicit.')
  assert.ok(renderPreviewAssembly.noRuntimeSideEffects.some((note) => /private JSON manifest/i.test(note)), 'Render preview assembly must state private manifest-only behavior.')
  if (adapterWorkerArtifactIntegrationForRender) {
    assert.ok(renderPreviewAssembly.adapterQaIntegration, 'Render preview assembly should attach adapter QA evidence when provided.')
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegrationForRender.id)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.privateMediaRunnerQaReviewId, adapterWorkerArtifactIntegrationForRender.privateMediaRunnerQaReviewId)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.renderIntegrationManifestArtifactId, adapterWorkerArtifactIntegrationForRender.integrationManifestArtifact.artifactId)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.status, 'adapter_worker_artifact_integration_attached_to_render_preview')
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.reviewedActivityCount, adapterWorkerArtifactIntegrationForRender.reviewedArtifactCount)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.artifactCount, adapterWorkerArtifactIntegrationForRender.integratedArtifactCount)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.renderPreviewIntegrationReady, true)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.finalRenderDecisionManifestEligible, true)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.mediaTransformOutputEligible, false)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.productRuntimeExecuted, false)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.privateArtifact, true)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.publicArtifact, false)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.signedUrl, null)
    assert.equal(renderPreviewAssembly.adapterQaIntegration?.artifacts.length, adapterWorkerArtifactIntegrationForRender.integratedArtifactCount)
    assert.ok(renderPreviewAssembly.adapterQaIntegration?.artifacts.every((artifact) =>
      artifact.privateArtifact === true &&
      artifact.publicArtifact === false &&
      artifact.signedUrl === null &&
      artifact.sha256.length === 64 &&
      artifact.byteSize > 0
    ), 'Adapter QA integration should preserve private artifact evidence.')
    const previewManifestJson = JSON.parse(await readFile(previewManifestLocalPath, 'utf8')) as {
      adapterQaIntegration?: RenderPreviewAdapterQaIntegrationSmoke
    }
    assert.equal(previewManifestJson.adapterQaIntegration?.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegrationForRender.id)
    assert.equal(previewManifestJson.adapterQaIntegration?.privateMediaRunnerQaReviewId, adapterWorkerArtifactIntegrationForRender.privateMediaRunnerQaReviewId)
    assert.equal(previewManifestJson.adapterQaIntegration?.renderIntegrationManifestArtifactId, adapterWorkerArtifactIntegrationForRender.integrationManifestArtifact.artifactId)
    assert.equal(previewManifestJson.adapterQaIntegration?.finalRenderDecisionManifestEligible, true)
  }

  const renderPreviewAssemblyReplay = await postJson(`${baseUrl}/v1/edit-executions/private-media-artifact-qa-reviews/${privateMediaArtifactQaReview.id}/render-preview-assembly`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    assemblyOnly: true,
    ...(adapterWorkerArtifactIntegrationForRender
      ? {
        adapterWorkerArtifactIntegrationId: adapterWorkerArtifactIntegrationForRender.id,
        privateMediaRunnerQaReviewId: adapterWorkerArtifactIntegrationForRender.privateMediaRunnerQaReviewId,
      }
      : {}),
  }, 'route-package-render-preview-assembly')
  assert.equal(renderPreviewAssemblyReplay.status, 201, 'Idempotent render preview assembly replay should succeed.')
  assert.equal(renderPreviewAssemblyReplay.json.data?.renderPreviewAssembly?.id, renderPreviewAssembly.id, 'Render preview assembly replay should not duplicate preview manifests.')

  const missingUserPreviewReviewReservation = await postJson(`${baseUrl}/v1/edit-executions/render-preview-assemblies/${renderPreviewAssembly.id}/user-preview-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    reviewOnly: true,
    reviewDecision: 'approved_for_final_render_readiness',
  }, 'route-package-user-preview-review-missing-reservation')
  assert.equal(missingUserPreviewReviewReservation.status, 400, 'User preview review should require credit reservation evidence.')
  assert.equal(missingUserPreviewReviewReservation.json.error?.code, 'VALIDATION_FAILED')

  const userPreviewReviewResponse = await postJson(`${baseUrl}/v1/edit-executions/render-preview-assemblies/${renderPreviewAssembly.id}/user-preview-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    reviewOnly: true,
    reviewDecision: 'approved_for_final_render_readiness',
    reviewerNote: 'Internal smoke review approved the private preview package.',
  }, 'route-package-user-preview-review')
  assert.equal(userPreviewReviewResponse.status, 201, `User preview review should succeed: ${JSON.stringify(userPreviewReviewResponse.json)}`)
  const userPreviewReview = userPreviewReviewResponse.json.data?.userPreviewReview
  assert.ok(userPreviewReview, 'User preview review response should include userPreviewReview.')
  assert.equal(userPreviewReview.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(userPreviewReview.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.id)
  assert.equal(userPreviewReview.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(userPreviewReview.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(userPreviewReview.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(userPreviewReview.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(userPreviewReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(userPreviewReview.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(userPreviewReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(userPreviewReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(userPreviewReview.status, 'user_preview_review_approved_waiting_final_render_readiness')
  assert.equal(userPreviewReview.reviewOnly, true)
  assert.equal(userPreviewReview.reviewDecision, 'approved_for_final_render_readiness')
  assert.equal(userPreviewReview.previewClipCount, renderPreviewAssembly.previewClipCount)
  assert.equal(userPreviewReview.privatePreviewArtifactCount, renderPreviewAssembly.privatePreviewArtifactCount)
  assert.equal(userPreviewReview.mediaArtifactCount, renderPreviewAssembly.mediaArtifactCount)
  assert.equal(userPreviewReview.workersStarted, 0)
  assert.equal(userPreviewReview.workerHandlersStarted, 0)
  assert.equal(userPreviewReview.toolsExecuted, 0)
  assert.equal(userPreviewReview.mediaBytesProcessed, false)
  assert.equal(userPreviewReview.liveExecutionReady, false)
  assert.equal(userPreviewReview.internalResultReviewReady, true)
  assert.equal(userPreviewReview.previewReviewReady, true)
  assert.equal(userPreviewReview.renderPreviewReady, true)
  assert.equal(userPreviewReview.finalRenderReady, false)
  assert.equal(userPreviewReview.finalRenderReadiness.ready, false)
  assert.equal(userPreviewReview.finalRenderReadiness.previewApproved, true)
  assert.equal(userPreviewReview.finalRenderReadiness.nextReviewRequired, 'final_render_readiness_review')
  assert.equal(userPreviewReview.nextRequiredGate, 'final_render_readiness_review')
  assert.ok(userPreviewReview.blockers.some((blocker) => /Final render readiness review/i.test(blocker)), 'User preview review must keep final render readiness explicit.')
  assert.ok(userPreviewReview.noRuntimeSideEffects.some((note) => /decision only/i.test(note)), 'User preview review must state decision-only behavior.')

  const userPreviewReviewReplay = await postJson(`${baseUrl}/v1/edit-executions/render-preview-assemblies/${renderPreviewAssembly.id}/user-preview-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    reviewOnly: true,
    reviewDecision: 'approved_for_final_render_readiness',
    reviewerNote: 'Internal smoke review approved the private preview package.',
  }, 'route-package-user-preview-review')
  assert.equal(userPreviewReviewReplay.status, 201, 'Idempotent user preview review replay should succeed.')
  assert.equal(userPreviewReviewReplay.json.data?.userPreviewReview?.id, userPreviewReview.id, 'User preview review replay should not duplicate review records.')

  const missingFinalRenderReadinessReservation = await postJson(`${baseUrl}/v1/edit-executions/user-preview-reviews/${userPreviewReview.id}/final-render-readiness-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    readinessReviewOnly: true,
  }, 'route-package-final-render-readiness-missing-reservation')
  assert.equal(missingFinalRenderReadinessReservation.status, 400, 'Final render readiness should require credit reservation evidence.')
  assert.equal(missingFinalRenderReadinessReservation.json.error?.code, 'VALIDATION_FAILED')

  const finalRenderReadinessResponse = await postJson(`${baseUrl}/v1/edit-executions/user-preview-reviews/${userPreviewReview.id}/final-render-readiness-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    readinessReviewOnly: true,
  }, 'route-package-final-render-readiness')
  assert.equal(finalRenderReadinessResponse.status, 201, `Final render readiness should succeed: ${JSON.stringify(finalRenderReadinessResponse.json)}`)
  const finalRenderReadinessReview = finalRenderReadinessResponse.json.data?.finalRenderReadinessReview
  assert.ok(finalRenderReadinessReview, 'Final render readiness response should include finalRenderReadinessReview.')
  assert.equal(finalRenderReadinessReview.userPreviewReviewId, userPreviewReview.id)
  assert.equal(finalRenderReadinessReview.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(finalRenderReadinessReview.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.id)
  assert.equal(finalRenderReadinessReview.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(finalRenderReadinessReview.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(finalRenderReadinessReview.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(finalRenderReadinessReview.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(finalRenderReadinessReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(finalRenderReadinessReview.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(finalRenderReadinessReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(finalRenderReadinessReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(finalRenderReadinessReview.status, 'final_render_readiness_passed_waiting_final_render_execution')
  assert.equal(finalRenderReadinessReview.readinessReviewOnly, true)
  assert.equal(finalRenderReadinessReview.previewApproved, true)
  assert.equal(finalRenderReadinessReview.previewClipCount, renderPreviewAssembly.previewClipCount)
  assert.equal(finalRenderReadinessReview.privatePreviewArtifactCount, renderPreviewAssembly.privatePreviewArtifactCount)
  assert.equal(finalRenderReadinessReview.mediaArtifactCount, renderPreviewAssembly.mediaArtifactCount)
  assert.equal(finalRenderReadinessReview.workersStarted, 0)
  assert.equal(finalRenderReadinessReview.workerHandlersStarted, 0)
  assert.equal(finalRenderReadinessReview.toolsExecuted, 0)
  assert.equal(finalRenderReadinessReview.mediaBytesProcessed, false)
  assert.equal(finalRenderReadinessReview.liveExecutionReady, false)
  assert.equal(finalRenderReadinessReview.internalResultReviewReady, true)
  assert.equal(finalRenderReadinessReview.previewReviewReady, true)
  assert.equal(finalRenderReadinessReview.renderPreviewReady, true)
  assert.equal(finalRenderReadinessReview.finalRenderReady, true)
  assert.equal(finalRenderReadinessReview.finalExportReady, false)
  assert.equal(finalRenderReadinessReview.finalRenderReadiness.ready, true)
  assert.equal(finalRenderReadinessReview.finalRenderReadiness.userPreviewReviewId, userPreviewReview.id)
  assert.equal(finalRenderReadinessReview.finalRenderReadiness.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(finalRenderReadinessReview.finalRenderReadiness.finalRenderExecutionRequired, true)
  assert.equal(finalRenderReadinessReview.nextRequiredGate, 'final_render_execution')
  assert.ok(finalRenderReadinessReview.blockers.some((blocker) => /Final render execution/i.test(blocker)), 'Final render readiness must keep final render execution explicit.')
  assert.ok(finalRenderReadinessReview.noRuntimeSideEffects.some((note) => /readiness decision only/i.test(note)), 'Final render readiness must state decision-only behavior.')

  const finalRenderReadinessReplay = await postJson(`${baseUrl}/v1/edit-executions/user-preview-reviews/${userPreviewReview.id}/final-render-readiness-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    readinessReviewOnly: true,
  }, 'route-package-final-render-readiness')
  assert.equal(finalRenderReadinessReplay.status, 201, 'Idempotent final render readiness replay should succeed.')
  assert.equal(finalRenderReadinessReplay.json.data?.finalRenderReadinessReview?.id, finalRenderReadinessReview.id, 'Final render readiness replay should not duplicate review records.')

  const missingFinalRenderExecutionReservation = await postJson(`${baseUrl}/v1/edit-executions/final-render-readiness-reviews/${finalRenderReadinessReview.id}/final-render-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    renderExecutionOnly: true,
  }, 'route-package-final-render-execution-missing-reservation')
  assert.equal(missingFinalRenderExecutionReservation.status, 400, 'Final render execution should require credit reservation evidence.')
  assert.equal(missingFinalRenderExecutionReservation.json.error?.code, 'VALIDATION_FAILED')

  const finalRenderExecutionResponse = await postJson(`${baseUrl}/v1/edit-executions/final-render-readiness-reviews/${finalRenderReadinessReview.id}/final-render-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    renderExecutionOnly: true,
  }, 'route-package-final-render-execution')
  assert.equal(finalRenderExecutionResponse.status, 201, `Final render execution should succeed: ${JSON.stringify(finalRenderExecutionResponse.json)}`)
  const finalRenderExecution = finalRenderExecutionResponse.json.data?.finalRenderExecution
  assert.ok(finalRenderExecution, 'Final render execution response should include finalRenderExecution.')
  assert.equal(finalRenderExecution.finalRenderReadinessReviewId, finalRenderReadinessReview.id)
  assert.equal(finalRenderExecution.userPreviewReviewId, userPreviewReview.id)
  assert.equal(finalRenderExecution.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(finalRenderExecution.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.id)
  assert.equal(finalRenderExecution.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(finalRenderExecution.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(finalRenderExecution.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(finalRenderExecution.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(finalRenderExecution.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(finalRenderExecution.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(finalRenderExecution.approvedPlanSnapshotId, snapshot.id)
  assert.equal(finalRenderExecution.creditReservationId, requestBody.creditReservationId)
  assert.equal(finalRenderExecution.status, 'final_render_execution_completed_waiting_delivery_qa')
  assert.equal(finalRenderExecution.renderExecutionOnly, true)
  assert.equal(finalRenderExecution.previewClipCount, renderPreviewAssembly.previewClipCount)
  assert.equal(finalRenderExecution.finalRenderArtifactCount, 1)
  assert.equal(finalRenderExecution.mediaArtifactCount, renderPreviewAssembly.mediaArtifactCount)
  assert.equal(finalRenderExecution.workersStarted, 0)
  assert.equal(finalRenderExecution.workerHandlersStarted, 1)
  assert.equal(finalRenderExecution.toolsExecuted, 1)
  assert.equal(finalRenderExecution.mediaBytesProcessed, true)
  assert.equal(finalRenderExecution.liveExecutionReady, false)
  assert.equal(finalRenderExecution.internalResultReviewReady, true)
  assert.equal(finalRenderExecution.previewReviewReady, true)
  assert.equal(finalRenderExecution.renderPreviewReady, true)
  assert.equal(finalRenderExecution.finalRenderReady, true)
  assert.equal(finalRenderExecution.finalExportReady, false)
  assert.ok(finalRenderExecution.finalRenderArtifact.localFilePath.startsWith(localStorageRoot), 'Final render artifact must stay under local storage root.')
  assert.equal(finalRenderExecution.finalRenderArtifact.privateArtifact, true)
  assert.equal(finalRenderExecution.finalRenderArtifact.publicArtifact, false)
  assert.equal(finalRenderExecution.finalRenderArtifact.signedUrl, null)
  assert.equal(finalRenderExecution.finalRenderArtifact.sourceOfTruthScope, 'final_render_execution_private_artifact')
  assert.equal(finalRenderExecution.finalRenderArtifact.finalRenderArtifact, true)
  assert.ok(finalRenderExecution.finalRenderArtifact.durationSeconds > 0, 'Final render artifact should record probeable duration metadata.')
  assert.ok(finalRenderExecution.finalRenderArtifact.width > 0, 'Final render artifact should record probeable width metadata.')
  assert.ok(finalRenderExecution.finalRenderArtifact.height > 0, 'Final render artifact should record probeable height metadata.')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.mode, 'overlay_then_concat_with_audio_polish')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.videoCodec, 'libx264')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioMode, 'aac')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.applied, true)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.source, 'private_final_render_voice_first_loudness')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.targetIntegratedLufs, -16)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.truePeakDb, -1.5)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.loudnessRangeLufs, 11)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.limiter, true)
  assert.ok(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.filterChain.some((filter) => /loudnorm=I=-16:TP=-1\.5:LRA=11/.test(filter)), 'Private final render should apply approved loudness normalization.')
  assert.ok(finalRenderExecution.finalRenderArtifact.commandSummary.audioPolish?.filterChain.some((filter) => /alimiter=limit=0\.95/.test(filter)), 'Private final render should apply final audio limiting.')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.reviewOverlayCount, renderPreviewAssembly.previewClipCount)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.approvedFinalTimingCount, renderPreviewAssembly.previewClipCount)
  assert.ok(
    Math.abs(finalRenderExecution.finalRenderArtifact.commandSummary.approvedFinalTimelineDurationSeconds - expectedApprovedFinalDurationSeconds) < 0.01,
    'Final render summary should record the approved final timeline duration.',
  )
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.approvedCaptionOverlayCount, approvedCaptionPreviewClips.length)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.approvedTransitionPolishCount, approvedTransitionPreviewClips.length)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.approvedVisualPolishCount, approvedVisualPolishPreviewClips.length)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.applied, true)
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.source, 'approved_color_pipeline_private_render')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.toolId, 'ffmpeg')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.fullColorPipelineExecuted, false)
  assert.ok(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.filterChain.some((filter) => /eq=contrast=/.test(filter)), 'Private final render should include conservative approved visual polish filters.')
  assert.ok(finalRenderExecution.finalRenderArtifact.commandSummary.visualPolish.operationLabels.length > 0, 'Private final render should record approved visual operation labels.')
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.privateCaptionArtifactCount, renderPreviewAssembly.captionExecutionPackage?.captionArtifactCount)
  assert.deepEqual(new Set(finalRenderExecution.finalRenderArtifact.commandSummary.privateCaptionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.equal(finalRenderExecution.finalRenderArtifact.commandSummary.privateCaptionSource, 'approved_caption_timing_private_caption_files')
  const editDecisionManifest = finalRenderExecution.finalRenderArtifact.editDecisionManifest
  assert.equal(editDecisionManifest.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(editDecisionManifest.source, 'approved_snapshot_private_render_execution')
  assert.equal(editDecisionManifest.approvedPlanSnapshotId, snapshot.id)
  assert.equal(editDecisionManifest.approvedEditContext.source, 'approved_plan_snapshot')
  assert.equal(editDecisionManifest.approvedEditContext.projectId, snapshot.projectId)
  assert.equal(editDecisionManifest.approvedEditContext.editSessionId, snapshot.editSessionId)
  assert.equal(editDecisionManifest.approvedEditContext.editPlanVersionId, snapshot.editPlanVersionId)
  assert.equal(editDecisionManifest.approvedEditContext.creditEstimateId, snapshot.creditEstimateId)
  assert.equal(editDecisionManifest.approvedEditContext.goalSummary, snapshot.compiledIntent?.goalSummary)
  assert.equal(editDecisionManifest.approvedEditContext.editLevel, snapshot.compiledIntent?.resolvedSettings.editLevel)
  assert.equal(editDecisionManifest.approvedEditContext.editingCategory, snapshot.compiledIntent?.resolvedSettings.editingCategory)
  assert.equal(editDecisionManifest.approvedEditContext.moodStyle, snapshot.compiledIntent?.resolvedSettings.moodStyle)
  assert.equal(editDecisionManifest.approvedEditContext.aspectRatio, snapshot.compiledIntent?.resolvedSettings.aspectRatio)
  assert.equal(editDecisionManifest.approvedEditContext.aspectRatioConfirmed, true)
  assert.equal(editDecisionManifest.approvedEditContext.sourceOrderConfirmed, true)
  assert.equal(editDecisionManifest.approvedEditContext.cleanupPreferenceConfirmed, true)
  assert.equal(editDecisionManifest.approvedEditContext.timingBaseConfirmed, true)
  assert.equal(editDecisionManifest.approvedEditContext.professionalBaseline, true)
  assert.equal(editDecisionManifest.approvedEditContext.sourceSequenceItemCount, snapshot.sourceSequence.length)
  assert.equal(editDecisionManifest.approvedEditContext.segmentCount, snapshot.segments.length)
  assert.equal(editDecisionManifest.approvedEditContext.operationCount, snapshot.operations.length)
  assert.equal(editDecisionManifest.approvedEditContext.qaGateCount, 1)
  assert.equal(editDecisionManifest.approvedEditContext.creditEstimateTotalCredits, snapshot.creditEstimate.total_credits)
  assert.equal(editDecisionManifest.approvedEditContext.professionalSkillTrace?.source, 'professional_skill_plan')
  assert.equal(editDecisionManifest.approvedEditContext.professionalSkillTrace?.editBriefOptional, true)
  assert.equal(editDecisionManifest.approvedEditContext.professionalSkillTrace?.promptFirstPlanning, true)
  assert.ok(
    Array.isArray(editDecisionManifest.approvedEditContext.professionalSkillTrace?.warnings),
    'Edit decision manifest should preserve sanitized professional skill warnings.',
  )
  assert.ok(
    Array.isArray(editDecisionManifest.approvedEditContext.professionalSkillTrace?.blockers),
    'Edit decision manifest should preserve sanitized professional skill blockers.',
  )
  assert.ok(
    (editDecisionManifest.approvedEditContext.professionalSkillTrace?.activityGroups.length ?? 0) > 0,
    'Edit decision manifest should preserve grouped professional skill activity areas.',
  )
  assert.equal(
    /librosa|audioflux|d3|three|gpac|mkvtoolnix|streamer_render_pipeline_support/i.test(
      JSON.stringify(editDecisionManifest.approvedEditContext.professionalSkillTrace ?? {}),
    ),
    false,
    'Edit decision manifest professional skill trace should not expose internal package/tool names.',
  )
  assert.equal(/https?:\/\/|\/tmp\/|localFilePath|api[_-]?key|service[_-]?role|token|secret|password/i.test(JSON.stringify(editDecisionManifest.approvedEditContext)), false)
  assert.equal(editDecisionManifest.creditReservationId, requestBody.creditReservationId)
  assert.equal(editDecisionManifest.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(editDecisionManifest.finalRenderArtifactId, finalRenderExecution.finalRenderArtifact.artifactId)
  assert.equal(editDecisionManifest.clipDecisionCount, renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.decisions.length, renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.source, 'uploaded_media_source_order')
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceOrderPreserved, true)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceMediaAssetIds.length, editDecisionManifest.clipDecisionCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.uploadedOrders.length, editDecisionManifest.clipDecisionCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.uniqueSourceMediaAssetCount, editDecisionManifest.sourceMediaAssetCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.uniqueUploadedOrderCount, editDecisionManifest.sourceMediaAssetCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceMediaCoverageComplete, true)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.firstAppearanceSourceMediaAssetIds.length, editDecisionManifest.sourceMediaAssetCount)
  assert.equal(editDecisionManifest.uploadedSourceOrderTrace.firstAppearanceUploadedOrders.length, editDecisionManifest.sourceMediaAssetCount)
  assert.equal(typeof editDecisionManifest.uploadedSourceOrderTrace.uploadedOrderMonotonic, 'boolean')
  assert.deepEqual(editDecisionManifest.uploadedSourceOrderTrace.uploadedOrders, editDecisionManifest.decisions.map((decision) => decision.uploadedOrder))
  assert.deepEqual(editDecisionManifest.uploadedSourceOrderTrace.sourceMediaAssetIds, editDecisionManifest.decisions.map((decision) => decision.sourceMediaAssetId))
  for (const sourceAsset of uploadedSourceMediaAssets) {
    assert.equal(
      editDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId[sourceAsset.mediaAssetId],
      sourceAsset.checksumSha256,
      'Edit decision manifest should preserve finalized source checksums by media asset ID.',
    )
    assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.storageProvider)
    assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.storagePath)
    assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.fileName)
    assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.mimeType)
    assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.byteSize)
    if (sourceAsset.storageBucket) {
      assert.equal(editDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId[sourceAsset.mediaAssetId], sourceAsset.storageBucket)
    }
  }
  assert.ok(editDecisionManifest.decisions.every((decision) =>
    decision.sourceChecksumSha256 === editDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId[decision.sourceMediaAssetId],
  ), 'Every manifest clip decision should carry the matching finalized source checksum.')
  assert.ok(editDecisionManifest.decisions.every((decision) =>
    decision.sourceStorageProvider === editDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId[decision.sourceMediaAssetId] &&
    (decision.sourceStorageBucket ?? undefined) === editDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceStoragePath === editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceFileName === editDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceMimeType === editDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId[decision.sourceMediaAssetId] &&
    decision.sourceByteSize === editDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId[decision.sourceMediaAssetId],
  ), 'Every manifest clip decision should carry the matching finalized source storage identity.')
  assert.ok(editDecisionManifest.decisions.every((decision) => {
    const previewClip = renderPreviewAssembly.previewClips.find((clip) => clip.processedArtifactId === decision.processedArtifactId)

    return (
      Boolean(previewClip) &&
      decision.processedArtifact.storageProvider === 'local_private' &&
      decision.processedArtifact.storageObjectPath === previewClip?.storageObjectPath &&
      decision.processedArtifact.mimeType === 'video/mp4' &&
      decision.processedArtifact.sha256 === previewClip?.sha256 &&
      decision.processedArtifact.byteSize === previewClip?.byteSize &&
      decision.processedArtifact.durationSeconds === previewClip?.durationSeconds &&
      decision.processedArtifact.privateArtifact === true &&
      decision.processedArtifact.publicArtifact === false &&
      decision.processedArtifact.signedUrl === null
    )
  }), 'Every manifest clip decision should prove its processed private clip artifact checksum, size, and duration.')
  assert.equal(editDecisionManifest.privateCaptionPackage.attached, true)
  assert.equal(editDecisionManifest.privateCaptionPackage.artifactCount, renderPreviewAssembly.captionExecutionPackage?.captionArtifactCount)
  assert.deepEqual(new Set(editDecisionManifest.privateCaptionPackage.formats), new Set(['srt', 'webvtt', 'ass']))
  if (adapterWorkerArtifactIntegrationForRender) {
    assert.equal(editDecisionManifest.adapterQaIntegration.attached, true)
    assert.equal(editDecisionManifest.adapterQaIntegration.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegrationForRender.id)
    assert.equal(editDecisionManifest.adapterQaIntegration.privateMediaRunnerQaReviewId, adapterWorkerArtifactIntegrationForRender.privateMediaRunnerQaReviewId)
    assert.equal(editDecisionManifest.adapterQaIntegration.renderIntegrationManifestArtifactId, adapterWorkerArtifactIntegrationForRender.integrationManifestArtifact.artifactId)
    assert.equal(editDecisionManifest.adapterQaIntegration.reviewedActivityCount, adapterWorkerArtifactIntegrationForRender.reviewedArtifactCount)
    assert.equal(editDecisionManifest.adapterQaIntegration.passedActivityCount, adapterWorkerArtifactIntegrationForRender.integratedArtifactCount)
    assert.equal(editDecisionManifest.adapterQaIntegration.artifactCount, adapterWorkerArtifactIntegrationForRender.integratedArtifactCount)
    assert.equal(editDecisionManifest.adapterQaIntegration.renderPreviewIntegrationReady, true)
    assert.equal(editDecisionManifest.adapterQaIntegration.finalRenderDecisionManifestEligible, true)
    assert.equal(editDecisionManifest.adapterQaIntegration.mediaTransformOutputEligible, false)
    assert.equal(editDecisionManifest.adapterQaIntegration.productRuntimeExecuted, false)
    assert.equal(editDecisionManifest.adapterQaIntegration.privateArtifact, true)
    assert.equal(editDecisionManifest.adapterQaIntegration.publicArtifact, false)
    assert.equal(editDecisionManifest.adapterQaIntegration.signedUrl, null)
    assert.equal(editDecisionManifest.adapterQaIntegration.artifacts.length, adapterWorkerArtifactIntegrationForRender.integratedArtifactCount)
    assert.ok(editDecisionManifest.adapterQaIntegration.artifacts.every((artifact) => artifact.sha256.length === 64 && artifact.byteSize > 0), 'Edit decision manifest should preserve adapter QA artifact checksum evidence.')
  } else {
    assert.equal(editDecisionManifest.adapterQaIntegration.attached, false)
    assert.equal(editDecisionManifest.adapterQaIntegration.adapterWorkerArtifactIntegrationId, null)
    assert.equal(editDecisionManifest.adapterQaIntegration.artifactCount, 0)
  }
  assert.equal(editDecisionManifest.professionalLayerCounts.reviewOverlays, renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.professionalLayerCounts.captionOverlays, approvedCaptionPreviewClips.length)
  assert.equal(editDecisionManifest.professionalLayerCounts.transitionPolish, approvedTransitionPreviewClips.length)
  assert.equal(editDecisionManifest.professionalLayerCounts.visualPolish, approvedVisualPolishPreviewClips.length)
  assert.equal(editDecisionManifest.professionalLayerCounts.finalTiming, renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.professionalLayerCounts.audioQa, renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.professionalLayerCounts.audioPolish, 1)
  assert.equal(editDecisionManifest.audioQaIntegration.attached, true)
  assert.equal(editDecisionManifest.audioQaIntegration.source, 'private_uploaded_audio_execution')
  assert.equal(editDecisionManifest.audioQaIntegration.reviewCount, renderPreviewAssembly.previewClipCount)
  assert.ok(editDecisionManifest.audioQaIntegration.qaGateCount >= renderPreviewAssembly.previewClipCount)
  assert.equal(editDecisionManifest.audioQaIntegration.finalMuxAllowed, false)
  assert.equal(editDecisionManifest.audioQaIntegration.productRuntimeExecuted, false)
  assert.equal(editDecisionManifest.audioQaIntegration.publicArtifact, false)
  assert.equal(editDecisionManifest.audioQaIntegration.signedUrl, null)
  assert.equal(editDecisionManifest.decisions.every((decision) => decision.audioExecutionReview.attached === true), true)
  assert.equal(editDecisionManifest.decisions.every((decision) => decision.audioExecutionReview.finalMuxAllowed === false), true)
  assert.equal(editDecisionManifest.decisions.every((decision) => decision.audioExecutionReview.productRuntimeExecuted === false), true)
  assert.equal(editDecisionManifest.decisions.every((decision) => decision.audioExecutionReview.publicArtifact === false && decision.audioExecutionReview.signedUrl === null), true)
  assert.ok(editDecisionManifest.decisions.every((decision) => decision.privateArtifact === true && decision.publicArtifact === false && decision.signedUrl === null), 'Edit decision manifest must keep every clip private.')
  assert.ok(editDecisionManifest.decisions.every((decision) => decision.approvedSourceRange.durationSeconds > 0), 'Edit decision manifest must carry approved positive source ranges.')
  assert.ok(editDecisionManifest.decisions.some((decision) => decision.captionOverlay.present && decision.captionOverlay.textPresent && decision.captionOverlay.textCharacterCount > 0), 'Edit decision manifest should prove approved caption overlays without exposing caption text.')
  assert.equal(editDecisionManifest.gateState.privateInternalReview, 'requires_delivery_qa')
  assert.equal(editDecisionManifest.gateState.publicDeliveryReady, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.publicArtifactCreated, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.signedUrlCreated, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.supabaseOrGcsWrite, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.externalBetaEnabled, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.productionEnabled, false)
  assert.equal(editDecisionManifest.blockedRuntimeScopes.billingMutation, false)
  assert.equal(JSON.stringify(editDecisionManifest).includes(finalRenderExecution.finalRenderArtifact.localFilePath), false, 'Edit decision manifest must not leak local file paths.')
  const editDecisionManifestArtifact = finalRenderExecution.finalRenderArtifact.editDecisionManifestArtifact
  assert.equal(editDecisionManifestArtifact.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(editDecisionManifestArtifact.finalRenderArtifactId, finalRenderExecution.finalRenderArtifact.artifactId)
  assert.equal(editDecisionManifestArtifact.privateArtifact, true)
  assert.equal(editDecisionManifestArtifact.publicArtifact, false)
  assert.equal(editDecisionManifestArtifact.signedUrl, null)
  assert.equal(editDecisionManifestArtifact.mimeType, 'application/json')
  assert.equal(editDecisionManifestArtifact.sourceOfTruthScope, 'final_render_execution_edit_decision_manifest')
  assert.equal(editDecisionManifestArtifact.safeForPrivateReview, true)
  assert.equal(editDecisionManifestArtifact.finalDeliveryEligible, false)
  assert.ok(editDecisionManifestArtifact.localFilePath.startsWith(localStorageRoot), 'Edit decision manifest artifact must stay under local storage root.')
  const editDecisionManifestArtifactStat = await stat(editDecisionManifestArtifact.localFilePath)
  const editDecisionManifestArtifactBytes = await readFile(editDecisionManifestArtifact.localFilePath)
  assert.equal(editDecisionManifestArtifactStat.size, editDecisionManifestArtifact.byteSize)
  assert.equal(createHash('sha256').update(editDecisionManifestArtifactBytes).digest('hex'), editDecisionManifestArtifact.sha256)
  const persistedEditDecisionManifest = JSON.parse(editDecisionManifestArtifactBytes.toString('utf8')) as ProfessionalEditDecisionManifestSmoke
  assert.equal(persistedEditDecisionManifest.manifestVersion, editDecisionManifest.manifestVersion)
  assert.equal(persistedEditDecisionManifest.finalRenderArtifactId, editDecisionManifest.finalRenderArtifactId)
  assert.deepEqual(persistedEditDecisionManifest.approvedEditContext, editDecisionManifest.approvedEditContext)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.uploadedOrders, editDecisionManifest.uploadedSourceOrderTrace.uploadedOrders)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId)
  assert.deepEqual(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId)
  assert.equal(persistedEditDecisionManifest.uploadedSourceOrderTrace.sourceOrderPreserved, true)
  assert.deepEqual(persistedEditDecisionManifest.adapterQaIntegration, editDecisionManifest.adapterQaIntegration)
  assert.equal(JSON.stringify(persistedEditDecisionManifest).includes(finalRenderExecution.finalRenderArtifact.localFilePath), false, 'Persisted edit decision manifest must not leak local file paths.')
  assert.equal(finalRenderExecution.finalRenderArtifact.deliveryQaRequired, true)
  assert.equal(finalRenderExecution.finalRenderArtifact.finalDeliveryEligible, false)
  assert.equal(finalRenderExecution.finalDeliveryReadiness.ready, false)
  assert.equal(finalRenderExecution.finalDeliveryReadiness.deliveryQaRequired, true)
  assert.equal(finalRenderExecution.nextRequiredGate, 'final_delivery_qa')
  assert.ok(finalRenderExecution.blockers.some((blocker) => /Final delivery QA/i.test(blocker)), 'Final render execution must keep delivery QA explicit.')
  assert.ok(finalRenderExecution.noRuntimeSideEffects.some((note) => /private local MP4/i.test(note)), 'Final render execution must state private local output only.')

  const finalRenderExecutionReplay = await postJson(`${baseUrl}/v1/edit-executions/final-render-readiness-reviews/${finalRenderReadinessReview.id}/final-render-execution`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    renderExecutionOnly: true,
  }, 'route-package-final-render-execution')
  assert.equal(finalRenderExecutionReplay.status, 201, 'Idempotent final render execution replay should succeed.')
  assert.equal(finalRenderExecutionReplay.json.data?.finalRenderExecution?.id, finalRenderExecution.id, 'Final render execution replay should not duplicate private final renders.')

  const missingFinalDeliveryQaReservation = await postJson(`${baseUrl}/v1/edit-executions/final-render-executions/${finalRenderExecution.id}/final-delivery-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    qaReviewOnly: true,
  }, 'route-package-final-delivery-qa-missing-reservation')
  assert.equal(missingFinalDeliveryQaReservation.status, 400, 'Final delivery QA should require credit reservation evidence.')
  assert.equal(missingFinalDeliveryQaReservation.json.error?.code, 'VALIDATION_FAILED')

  const finalDeliveryQaResponse = await postJson(`${baseUrl}/v1/edit-executions/final-render-executions/${finalRenderExecution.id}/final-delivery-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-final-delivery-qa')
  assert.equal(finalDeliveryQaResponse.status, 201, `Final delivery QA should succeed: ${JSON.stringify(finalDeliveryQaResponse.json)}`)
  const finalDeliveryQaReview = finalDeliveryQaResponse.json.data?.finalDeliveryQaReview
  assert.ok(finalDeliveryQaReview, 'Final delivery QA response should include finalDeliveryQaReview.')
  assert.equal(finalDeliveryQaReview.finalRenderExecutionId, finalRenderExecution.id)
  assert.equal(finalDeliveryQaReview.finalRenderReadinessReviewId, finalRenderReadinessReview.id)
  assert.equal(finalDeliveryQaReview.userPreviewReviewId, userPreviewReview.id)
  assert.equal(finalDeliveryQaReview.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(finalDeliveryQaReview.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.id)
  assert.equal(finalDeliveryQaReview.localMediaProcessingExecutionId, localMediaProcessingExecution.id)
  assert.equal(finalDeliveryQaReview.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.id)
  assert.equal(finalDeliveryQaReview.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.id)
  assert.equal(finalDeliveryQaReview.workflowRehearsalId, workflowRehearsal.id)
  assert.equal(finalDeliveryQaReview.localWorkerOutputId, localWorkerOutput.id)
  assert.equal(finalDeliveryQaReview.localWorkerOutputQaReviewId, localWorkerOutputQaReview.id)
  assert.equal(finalDeliveryQaReview.approvedPlanSnapshotId, snapshot.id)
  assert.equal(finalDeliveryQaReview.creditReservationId, requestBody.creditReservationId)
  assert.equal(finalDeliveryQaReview.status, 'final_delivery_qa_passed_ready_for_private_internal_download')
  assert.equal(finalDeliveryQaReview.qaReviewOnly, true)
  assert.equal(finalDeliveryQaReview.finalArtifactQaPassed, true)
  assert.equal(finalDeliveryQaReview.privateInternalDownloadReady, true)
  assert.equal(finalDeliveryQaReview.publicDeliveryReady, false)
  assert.equal(finalDeliveryQaReview.externalBetaReady, false)
  assert.equal(finalDeliveryQaReview.productionReady, false)
  assert.equal(finalDeliveryQaReview.finalExportReady, true)
  assert.equal(finalDeliveryQaReview.finalRenderArtifactCount, 1)
  assert.equal(finalDeliveryQaReview.mediaArtifactCount, finalRenderExecution.mediaArtifactCount)
  assert.equal(finalDeliveryQaReview.workersStarted, 0)
  assert.equal(finalDeliveryQaReview.workerHandlersStarted, 0)
  assert.equal(finalDeliveryQaReview.toolsExecuted, 1, 'Final delivery QA executes bounded ffprobe inspection without processing media.')
  assert.equal(finalDeliveryQaReview.mediaBytesProcessed, false)
  assert.equal(finalDeliveryQaReview.liveExecutionReady, false)
  assert.equal(finalDeliveryQaReview.renderPreviewReady, true)
  assert.equal(finalDeliveryQaReview.finalRenderReady, true)
  assert.ok(finalDeliveryQaReview.qaChecks.every((check) => check.passed), 'Final delivery QA should pass all checks.')
  assert.ok(
    finalRenderExecution.finalRenderArtifact.editDecisionManifest.decisions.every((decision) =>
      finalRenderExecution.finalRenderArtifact.sha256 !== decision.sourceChecksumSha256 &&
      finalRenderExecution.finalRenderArtifact.sha256 !== decision.processedArtifact.sha256
    ),
    'Final render checksum should differ from uploaded source and processed clip artifacts.',
  )
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'video_stream_present'), 'Final delivery QA should probe for a video stream.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'audio_stream_present'), 'Final delivery QA should probe for an audio stream.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'final_render_not_source_passthrough'), 'Final delivery QA should reject source passthrough artifacts.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'final_frame_dimensions_present'), 'Final delivery QA should probe frame dimensions.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'duration_present'), 'Final delivery QA should probe duration metadata.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'approved_review_overlays_present'), 'Final delivery QA should verify approved review overlays.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'approved_caption_overlays_present'), 'Final delivery QA should verify approved caption overlays.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'private_caption_package_attached'), 'Final delivery QA should verify private caption files.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'approved_transition_polish_present'), 'Final delivery QA should verify transition polish.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'approved_visual_polish_present'), 'Final delivery QA should verify visual polish.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'approved_final_timing_present'), 'Final delivery QA should verify final timing.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'voice_first_audio_polish_present'), 'Final delivery QA should verify voice-first audio polish.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'professional_edit_decision_manifest_present'), 'Final delivery QA should verify the edit decision manifest.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'uploaded_source_order_trace_present'), 'Final delivery QA should verify uploaded source order trace.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'professional_edit_decision_manifest_artifact_present'), 'Final delivery QA should verify the persisted edit decision manifest artifact.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'professional_edit_decision_manifest_artifact_content_matches'), 'Final delivery QA should verify the persisted edit decision manifest content.')
  assert.ok(finalDeliveryQaReview.qaChecks.some((check) => check.check === 'full_color_pipeline_not_claimed'), 'Final delivery QA should verify no full color pipeline claim.')
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.source, 'final_render_command_summary')
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.approvedReviewOverlayCount, renderPreviewAssembly.previewClipCount)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.approvedCaptionOverlayCount, approvedCaptionPreviewClips.length)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.privateCaptionArtifactCount, 3)
  assert.deepEqual(new Set(finalDeliveryQaReview.professionalEditQaSummary.privateCaptionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.approvedTransitionPolishCount, approvedTransitionPreviewClips.length)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.approvedVisualPolishCount, approvedVisualPolishPreviewClips.length)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.approvedFinalTimingCount, renderPreviewAssembly.previewClipCount)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.audioPolishApplied, true)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.visualPolishApplied, true)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.visualPolishToolId, 'ffmpeg')
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.fullColorPipelineExecuted, false)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.editDecisionManifestReady, true)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.editDecisionManifestArtifactReady, true)
  assert.equal(finalDeliveryQaReview.professionalEditQaSummary.privateInternalQaReady, true)
  assert.equal(finalDeliveryQaReview.finalArtifactProbe?.hasVideo, true)
  assert.equal(finalDeliveryQaReview.finalArtifactProbe?.hasAudio, true)
  assert.ok((finalDeliveryQaReview.finalArtifactProbe?.width ?? 0) > 0, 'Final delivery QA should record final width.')
  assert.ok((finalDeliveryQaReview.finalArtifactProbe?.height ?? 0) > 0, 'Final delivery QA should record final height.')
  assert.ok((finalDeliveryQaReview.finalArtifactProbe?.durationSeconds ?? 0) > 0, 'Final delivery QA should record final duration.')
  assert.equal(finalDeliveryQaReview.finalRenderArtifact.localFilePath, finalRenderExecution.finalRenderArtifact.localFilePath)
  assert.equal(finalDeliveryQaReview.finalRenderArtifact.privateArtifact, true)
  assert.equal(finalDeliveryQaReview.finalRenderArtifact.publicArtifact, false)
  assert.equal(finalDeliveryQaReview.finalRenderArtifact.signedUrl, null)
  assert.equal(finalDeliveryQaReview.finalRenderArtifact.finalDeliveryEligible, false)
  assert.equal(finalDeliveryQaReview.nextRequiredGate, 'private_internal_download_delivery')
  assert.ok(finalDeliveryQaReview.blockers.some((blocker) => /Private internal download/i.test(blocker)), 'Final delivery QA must keep internal download delivery explicit.')
  assert.ok(finalDeliveryQaReview.noRuntimeSideEffects.some((note) => /inspected an existing private local/i.test(note)), 'Final delivery QA must state inspect-only behavior.')

  const finalDeliveryQaReplay = await postJson(`${baseUrl}/v1/edit-executions/final-render-executions/${finalRenderExecution.id}/final-delivery-qa-review`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    qaReviewOnly: true,
  }, 'route-package-final-delivery-qa')
  assert.equal(finalDeliveryQaReplay.status, 201, 'Idempotent final delivery QA replay should succeed.')
  assert.equal(finalDeliveryQaReplay.json.data?.finalDeliveryQaReview?.id, finalDeliveryQaReview.id, 'Final delivery QA replay should not duplicate review records.')

  const missingPrivateInternalDownloadReservation = await postJson(`${baseUrl}/v1/edit-executions/final-delivery-qa-reviews/${finalDeliveryQaReview.id}/private-internal-download-delivery`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: '',
    deliveryOnly: true,
  }, 'route-package-private-internal-download-missing-reservation')
  assert.equal(missingPrivateInternalDownloadReservation.status, 400, 'Private internal download delivery should require credit reservation evidence.')
  assert.equal(missingPrivateInternalDownloadReservation.json.error?.code, 'VALIDATION_FAILED')

  const privateInternalDownloadResponse = await postJson(`${baseUrl}/v1/edit-executions/final-delivery-qa-reviews/${finalDeliveryQaReview.id}/private-internal-download-delivery`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    deliveryOnly: true,
  }, 'route-package-private-internal-download-delivery')
  assert.equal(privateInternalDownloadResponse.status, 201, `Private internal download delivery should succeed: ${JSON.stringify(privateInternalDownloadResponse.json)}`)
  const privateInternalDownloadDelivery = privateInternalDownloadResponse.json.data?.privateInternalDownloadDelivery
  assert.ok(privateInternalDownloadDelivery, 'Private internal download delivery response should include privateInternalDownloadDelivery.')
  assert.equal(privateInternalDownloadDelivery.finalDeliveryQaReviewId, finalDeliveryQaReview.id)
  assert.equal(privateInternalDownloadDelivery.finalRenderExecutionId, finalRenderExecution.id)
  assert.equal(privateInternalDownloadDelivery.finalRenderReadinessReviewId, finalRenderReadinessReview.id)
  assert.equal(privateInternalDownloadDelivery.userPreviewReviewId, userPreviewReview.id)
  assert.equal(privateInternalDownloadDelivery.renderPreviewAssemblyId, renderPreviewAssembly.id)
  assert.equal(privateInternalDownloadDelivery.approvedPlanSnapshotId, snapshot.id)
  assert.equal(privateInternalDownloadDelivery.creditReservationId, requestBody.creditReservationId)
  assert.equal(privateInternalDownloadDelivery.status, 'private_internal_download_delivery_ready')
  assert.equal(privateInternalDownloadDelivery.createdByUserId, 'mock-user-runtime')
  assert.equal(privateInternalDownloadDelivery.deliveryOnly, true)
  assert.equal(privateInternalDownloadDelivery.privateInternalDownloadReady, true)
  assert.equal(privateInternalDownloadDelivery.professionalEditQaSummary.privateInternalQaReady, true)
  assert.equal(privateInternalDownloadDelivery.professionalEditQaSummary.approvedVisualPolishCount, approvedVisualPolishPreviewClips.length)
  assert.equal(privateInternalDownloadDelivery.professionalEditQaSummary.fullColorPipelineExecuted, false)
  assert.equal(privateInternalDownloadDelivery.professionalEditQaSummary.editDecisionManifestReady, true)
  assert.equal(privateInternalDownloadDelivery.professionalEditQaSummary.editDecisionManifestArtifactReady, true)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.editDecisionManifest.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.deepEqual(privateInternalDownloadDelivery.finalRenderArtifact.editDecisionManifest.adapterQaIntegration, editDecisionManifest.adapterQaIntegration)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.editDecisionManifestArtifact.sha256, editDecisionManifestArtifact.sha256)
  assert.equal(privateInternalDownloadDelivery.publicDeliveryReady, false)
  assert.equal(privateInternalDownloadDelivery.externalBetaReady, false)
  assert.equal(privateInternalDownloadDelivery.productionReady, false)
  assert.equal(privateInternalDownloadDelivery.finalExportReady, true)
  assert.equal(privateInternalDownloadDelivery.workersStarted, 0)
  assert.equal(privateInternalDownloadDelivery.workerHandlersStarted, 0)
  assert.equal(privateInternalDownloadDelivery.toolsExecuted, 0)
  assert.equal(privateInternalDownloadDelivery.mediaBytesProcessed, false)
  assert.equal(privateInternalDownloadDelivery.liveExecutionReady, false)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.localFilePath, finalDeliveryQaReview.finalRenderArtifact.localFilePath)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.privateArtifact, true)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.publicArtifact, false)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.signedUrl, null)
  assert.equal(privateInternalDownloadDelivery.finalRenderArtifact.finalDeliveryEligible, false)
  assert.equal(privateInternalDownloadDelivery.internalDownloadPath, `/v1/edit-executions/private-internal-downloads/${privateInternalDownloadDelivery.id}/file`)
  assert.equal(privateInternalDownloadDelivery.internalManifestPath, `/v1/edit-executions/private-internal-downloads/${privateInternalDownloadDelivery.id}/manifest`)
  assert.equal(privateInternalDownloadDelivery.nextRequiredGate, 'external_beta_or_production_release_gates')
  assert.ok(privateInternalDownloadDelivery.blockers.some((blocker) => /Public delivery/i.test(blocker)), 'Private internal download delivery must keep public delivery blocked.')
  assert.ok(privateInternalDownloadDelivery.noRuntimeSideEffects.some((note) => /authenticated local file route/i.test(note)), 'Private internal download delivery must state authenticated local route only.')

  const otherUserPrivateInternalDownloadService = createApprovedEditExecutionPackageService({
    env,
    clients: { admin: null, public: null },
    requestId: 'route-smoke-private-download-other-user',
    auth: {
      userId: 'mock-user-other',
      isMockUser: true,
    },
  } satisfies ServiceContext)
  await assertServiceRejects(
    () => otherUserPrivateInternalDownloadService.getPrivateInternalDownloadFile(privateInternalDownloadDelivery.id),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user private internal download file access should be rejected.',
  )
  await assertServiceRejects(
    () => otherUserPrivateInternalDownloadService.getPrivateInternalDownloadManifestFile(privateInternalDownloadDelivery.id),
    'WORKSPACE_ACCESS_DENIED',
    'Cross-user private internal manifest access should be rejected.',
  )

  const revokedMembershipAdminClient = {
    from(table: string) {
      assert.equal(table, 'workspace_members')
      return {
        select() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    async maybeSingle() {
                      return { data: null, error: null }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  } as unknown as NonNullable<ServiceContext['clients']['admin']>
  const revokedMembershipDownloadService = createApprovedEditExecutionPackageService({
    env,
    clients: { admin: revokedMembershipAdminClient, public: null },
    requestId: 'route-smoke-private-download-revoked-membership',
    auth: {
      userId: privateInternalDownloadDelivery.createdByUserId,
      accessToken: 'verified-revoked-membership-token',
      isMockUser: false,
    },
  } satisfies ServiceContext)
  await assertServiceRejects(
    () => revokedMembershipDownloadService.getPrivateInternalDownloadFile(privateInternalDownloadDelivery.id),
    'WORKSPACE_ACCESS_DENIED',
    'A delivery creator whose workspace membership was revoked must lose private file access.',
  )
  await assertServiceRejects(
    () => revokedMembershipDownloadService.getPrivateInternalDownloadManifestFile(privateInternalDownloadDelivery.id),
    'WORKSPACE_ACCESS_DENIED',
    'A delivery creator whose workspace membership was revoked must lose private manifest access.',
  )

  const privateInternalDownloadFile = await fetchBinary(`${baseUrl}${privateInternalDownloadDelivery.internalDownloadPath}`)
  assert.equal(privateInternalDownloadFile.status, 200, 'Private internal download file should stream successfully.')
  assert.match(privateInternalDownloadFile.headers.get('content-type') ?? '', /^video\/mp4\b/i)
  assert.match(privateInternalDownloadFile.headers.get('content-disposition') ?? '', /^attachment; filename=/i)
  assert.equal(privateInternalDownloadFile.headers.get('cache-control'), 'no-store', 'Private internal download file should disable browser/proxy caching.')
  assert.equal(Number(privateInternalDownloadFile.headers.get('content-length')), finalDeliveryQaReview.finalRenderArtifact.byteSize)
  assert.equal(privateInternalDownloadFile.bytes.byteLength, finalDeliveryQaReview.finalRenderArtifact.byteSize)

  const originalFinalRenderBytes = await readFile(privateInternalDownloadDelivery.finalRenderArtifact.localFilePath)
  const tamperedFinalRenderBytes = Buffer.from(originalFinalRenderBytes)
  tamperedFinalRenderBytes[0] = (tamperedFinalRenderBytes[0] ?? 0) ^ 0xff
  await writeFile(privateInternalDownloadDelivery.finalRenderArtifact.localFilePath, tamperedFinalRenderBytes)
  const tamperedPrivateInternalDownloadFile = await fetchBinary(`${baseUrl}${privateInternalDownloadDelivery.internalDownloadPath}`)
  assert.equal(tamperedPrivateInternalDownloadFile.status, 409, 'Private internal download should reject checksum drift before streaming.')
  await writeFile(privateInternalDownloadDelivery.finalRenderArtifact.localFilePath, originalFinalRenderBytes)

  const originalManifestBytes = await readFile(editDecisionManifestArtifact.localFilePath)
  const tamperedManifestBytes = Buffer.from(originalManifestBytes)
  tamperedManifestBytes[0] = (tamperedManifestBytes[0] ?? 0) ^ 0xff
  await writeFile(editDecisionManifestArtifact.localFilePath, tamperedManifestBytes)
  const tamperedPrivateInternalManifestFile = await fetchBinary(`${baseUrl}${privateInternalDownloadDelivery.internalManifestPath}`)
  assert.equal(tamperedPrivateInternalManifestFile.status, 409, 'Private internal manifest download should reject checksum drift before streaming.')
  await writeFile(editDecisionManifestArtifact.localFilePath, originalManifestBytes)

  const privateInternalManifestFile = await fetchBinary(`${baseUrl}${privateInternalDownloadDelivery.internalManifestPath}`)
  assert.equal(privateInternalManifestFile.status, 200, 'Private internal edit decision manifest should stream successfully.')
  assert.match(privateInternalManifestFile.headers.get('content-type') ?? '', /^application\/json\b/i)
  assert.match(privateInternalManifestFile.headers.get('content-disposition') ?? '', /^attachment; filename=/i)
  assert.equal(privateInternalManifestFile.headers.get('cache-control'), 'no-store', 'Private internal edit decision manifest should disable browser/proxy caching.')
  assert.equal(Number(privateInternalManifestFile.headers.get('content-length')), editDecisionManifestArtifact.byteSize)
  assert.equal(privateInternalManifestFile.bytes.byteLength, editDecisionManifestArtifact.byteSize)
  assert.equal(createHash('sha256').update(privateInternalManifestFile.bytes).digest('hex'), editDecisionManifestArtifact.sha256)
  const downloadedEditDecisionManifest = JSON.parse(Buffer.from(privateInternalManifestFile.bytes).toString('utf8')) as ProfessionalEditDecisionManifestSmoke
  assert.equal(downloadedEditDecisionManifest.manifestVersion, editDecisionManifest.manifestVersion)
  assert.equal(downloadedEditDecisionManifest.finalRenderArtifactId, finalRenderExecution.finalRenderArtifact.artifactId)
  assert.deepEqual(downloadedEditDecisionManifest.approvedEditContext, editDecisionManifest.approvedEditContext)
  assert.equal(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceOrderPreserved, true)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceMediaAssetIds, editDecisionManifest.uploadedSourceOrderTrace.sourceMediaAssetIds)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceChecksumSha256ByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStorageProviderByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStorageBucketByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceFileNameByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceMimeTypeByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceByteSizeByMediaAssetId)
  assert.deepEqual(downloadedEditDecisionManifest.decisions.map((decision) => decision.processedArtifact), editDecisionManifest.decisions.map((decision) => decision.processedArtifact))
  assert.deepEqual(downloadedEditDecisionManifest.adapterQaIntegration, editDecisionManifest.adapterQaIntegration)

  const privateInternalDownloadReplay = await postJson(`${baseUrl}/v1/edit-executions/final-delivery-qa-reviews/${finalDeliveryQaReview.id}/private-internal-download-delivery`, {
    workspaceId: requestBody.workspaceId,
    projectId: requestBody.projectId,
    creditReservationId: requestBody.creditReservationId,
    deliveryOnly: true,
  }, 'route-package-private-internal-download-delivery')
  assert.equal(privateInternalDownloadReplay.status, 201, 'Idempotent private internal download delivery replay should succeed.')
  assert.equal(privateInternalDownloadReplay.json.data?.privateInternalDownloadDelivery?.id, privateInternalDownloadDelivery.id, 'Private internal download delivery replay should not duplicate records.')

  const privateInternalTestRunMissingReservation = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    creditReservationId: '',
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets,
  }, 'route-package-private-internal-test-run-missing-reservation')
  assert.equal(privateInternalTestRunMissingReservation.status, 400, 'Private internal test run should require credit reservation evidence.')
  assert.equal(privateInternalTestRunMissingReservation.json.error?.code, 'VALIDATION_FAILED')

  const privateInternalTestRunMissingChecksum = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets.map(({ checksumSha256, ...asset }) => {
      void checksumSha256
      return asset
    }),
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
    reviewerNote: 'Route smoke should reject private internal test runs without finalized source checksums.',
  }, 'route-package-private-internal-test-run-missing-source-checksum')
  assert.equal(privateInternalTestRunMissingChecksum.status, 400, 'Private internal test run should reject source assets without finalized checksum evidence before execution state is created.')
  assert.equal(privateInternalTestRunMissingChecksum.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(privateInternalTestRunMissingChecksum.json.error), /checksumSha256/)

  const privateInternalTestRunZeroByteSource = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset) => ({
      ...asset,
      byteSize: 0,
    })),
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
    reviewerNote: 'Route smoke should reject private internal test runs with zero-byte source references.',
  }, 'route-package-private-internal-test-run-zero-byte-source')
  assert.equal(privateInternalTestRunZeroByteSource.status, 400, 'Private internal test run should reject zero-byte source assets before execution state is created.')
  assert.equal(privateInternalTestRunZeroByteSource.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(privateInternalTestRunZeroByteSource.json.error), /Too small: expected number to be >0|byteSize/)

  const privateInternalTestRunApprovedSourceMismatch = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset, index) => index === 0
      ? {
          ...asset,
          uploadedClipId: 'stale-uploaded-clip-after-approval',
        }
      : asset),
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
    reviewerNote: 'Route smoke should reject private internal test runs with source references that differ from the approved snapshot source sequence.',
  }, 'route-package-private-internal-test-run-approved-source-mismatch')
  assert.equal(privateInternalTestRunApprovedSourceMismatch.status, 400, 'Private internal test run should reject source assets that do not match the approved snapshot source sequence.')
  assert.equal(privateInternalTestRunApprovedSourceMismatch.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(privateInternalTestRunApprovedSourceMismatch.json.error), /uploadedClipId_mismatch|approved snapshot source sequence/)

  const privateInternalTestRunApprovedSourceIdentityMismatch = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets.map((asset, index) => index === 0
      ? {
          ...asset,
          mediaAssetId: `${asset.mediaAssetId}-swapped-after-approval`,
          storagePath: `${asset.storagePath}.swapped`,
          checksumSha256: 'e'.repeat(64),
        }
      : asset),
    maxDurationSeconds: 1,
    targetWidth: 160,
    targetHeight: 90,
    fps: 8,
    reviewerNote: 'Route smoke should reject private internal test runs whose exact approved source media identity changed after approval.',
  }, 'route-package-private-internal-test-run-approved-source-identity-mismatch')
  assert.equal(privateInternalTestRunApprovedSourceIdentityMismatch.status, 400, 'Private internal test run should reject source assets whose exact approved media identity changed after approval.')
  assert.equal(privateInternalTestRunApprovedSourceIdentityMismatch.json.error?.code, 'VALIDATION_FAILED')
  assert.match(JSON.stringify(privateInternalTestRunApprovedSourceIdentityMismatch.json.error), /mediaAssetId_mismatch|checksumSha256_mismatch|storagePath_mismatch/)

  const privateInternalTestRunResponse = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets,
    processingMode: 'private_internal_review_render',
    maxDurationSeconds: 30,
    targetWidth: 480,
    targetHeight: 270,
    fps: 24,
    reviewerNote: 'Route smoke approves the private internal review render for final-render readiness.',
  }, 'route-package-private-internal-test-run')
  assert.equal(privateInternalTestRunResponse.status, 201, `Private internal test run should succeed: ${JSON.stringify(privateInternalTestRunResponse.json)}`)
  const privateInternalTestRun = privateInternalTestRunResponse.json.data?.internalTestRun
  assert.ok(privateInternalTestRun, 'Private internal test run response should include internalTestRun.')
  assert.equal(privateInternalTestRun.status, 'private_internal_test_run_completed_ready_for_download')
  assert.equal(privateInternalTestRun.internalTestRunOnly, true)
  assert.equal(privateInternalTestRun.workspaceId, requestBody.workspaceId)
  assert.equal(privateInternalTestRun.projectId, requestBody.projectId)
  assert.equal(privateInternalTestRun.approvedPlanSnapshotId, snapshot.id)
  assert.equal(privateInternalTestRun.creditReservationId, requestBody.creditReservationId)
  assert.equal(privateInternalTestRun.sourceMediaAssetCount, uploadedSourceMediaAssets.length)
  assert.equal(
    privateInternalTestRun.finalRenderArtifact.editDecisionManifest.decisions.every((decision: ProfessionalEditDecisionManifestSmoke['decisions'][number]) =>
      decision.processedArtifact.processingMode === 'private_internal_review_render'
    ),
    true,
    'Private internal test run should carry the private review render mode into the edit decision manifest.',
  )
  assert.equal(privateInternalTestRun.adapterGateSummary.requestedActivityCount, professionalAdapterToolNames.length)
  assert.equal(privateInternalTestRun.adapterGateSummary.resolvedActivityCount, professionalAdapterToolNames.length)
  assert.equal(privateInternalTestRun.adapterGateSummary.readyActivityCount, professionalAdapterToolNames.length)
  assert.equal(privateInternalTestRun.adapterGateSummary.blockedActivityCount, 0)
  assert.equal(privateInternalTestRun.adapterGateSummary.editActivityCount, professionalAdapterToolNames.length - 2)
  assert.equal(privateInternalTestRun.adapterGateSummary.readinessCheckCount, 2)
  assert.equal(privateInternalTestRun.adapterGateSummary.executionMode, 'private_internal_dry_run_and_local_fallback')
  assert.equal(privateInternalTestRun.adapterGateSummary.toolsExecutedCount, privateInternalBoundedPackageCheckCount)
  assert.equal(privateInternalTestRun.adapterGateSummary.fullToolExecutionReady, false)
  assert.equal(privateInternalTestRun.adapterGateSummary.privateFallbackReviewOnly, true)
  assert.equal(
    privateInternalTestRun.adapterGateSummary.privateRenderIntegrationStatus,
    'backend_adapter_worker_artifacts_partially_integrated_for_private_render',
    JSON.stringify(privateInternalTestRun.adapterGateSummary, null, 2),
  )
  assert.equal(privateInternalTestRun.adapterGateSummary.privateRenderIntegrationReady, true)
  assert.equal(privateInternalTestRun.adapterGateSummary.privateRenderIntegratedActivityCount, privateInternalBoundedPackageCheckCount)
  assert.equal(privateInternalTestRun.adapterGateSummary.backendIntegrationCandidateCount, privateInternalRenderableAdapterCount)
  assert.equal(privateInternalTestRun.adapterGateSummary.backendIntegrationPendingActivityCount, professionalAdapterToolNames.length - privateInternalBoundedPackageCheckCount)
  assert.equal(privateInternalTestRun.adapterGateSummary.backendIntegrationBlockedActivityCount, professionalAdapterToolNames.length - privateInternalBoundedPackageCheckCount)
  assert.ok(privateInternalTestRun.adapterGateSummary.backendIntegrationBlockers.some((blocker) => /librosa.*hydrated worker Python runtime|librosa.*TOOL_ADAPTER_PYTHON_BIN|librosa.*not importable/i.test(blocker)), 'Private internal route should report missing Python adapter runtime hydration instead of claiming integration.')
  assert.ok(privateInternalTestRun.adapterGateSummary.backendIntegrationBlockers.some((blocker) => /audioflux.*hydrated worker Python runtime|audioflux.*TOOL_ADAPTER_PYTHON_BIN|audioflux.*not importable/i.test(blocker)), 'Private internal route should report missing AudioFlux runtime evidence.')
  assert.equal(privateInternalTestRun.adapterGateSummary.clientReadinessHintsTrusted, false)
  assert.equal(privateInternalTestRun.adapterGateSummary.serverSourceTruthRequiredForFullExecution, true)
  assert.equal(privateInternalTestRun.adapterGateSummary.frontendExecutionAllowed, false)
  assert.equal(privateInternalTestRun.adapterGateSummary.productReady, false)
  assert.equal(privateInternalTestRun.adapterGateSummary.userFacingSummary.toLowerCase().includes('librosa'), false)
  assert.equal(privateInternalTestRun.adapterGateSummary.userFacingSummary.toLowerCase().includes('d3'), false)
  const privateInternalActivityGroups = (privateInternalTestRun.adapterGateSummary as typeof privateInternalTestRun.adapterGateSummary & {
    activityGroups?: Array<{
      id: string
      label: string
      resolvedActivityCount: number
      integratedActivityCount: number
      pendingActivityCount: number
      status: string
      userFacingSummary: string
    }>
  }).activityGroups ?? []
  assert.ok(privateInternalActivityGroups.length >= 4, 'Private internal test run should return grouped user-facing edit activity readiness.')
  const privateInternalActivityGroupLabels = new Set(privateInternalActivityGroups.map((group: { label: string }) => group.label))
  assert.ok(privateInternalActivityGroupLabels.has('Audio preparation'), 'Grouped readiness should include audio preparation when audio skills are selected.')
  assert.ok(privateInternalActivityGroupLabels.has('Visual layers'), 'Grouped readiness should include visual layers when graphic/data skills are selected.')
  assert.ok(privateInternalActivityGroupLabels.has('Private review package'), 'Grouped readiness should include private review packaging checks.')
  assert.ok(
    privateInternalActivityGroups.some((group: { label: string, integratedActivityCount: number }) =>
      group.label === 'Private review package' && group.integratedActivityCount > 0
    ),
    'Private review package group should report attached backend evidence when packaging checks pass.',
  )
  assert.equal(
    /librosa|audioflux|d3|three|gpac|mkvtoolnix|streamer_render_pipeline_support/i.test(JSON.stringify(privateInternalActivityGroups)),
    false,
    'User-facing activity groups must not expose internal adapter/tool names.',
  )
  assert.ok(privateInternalTestRun.adapterGateSummary.noRuntimeSideEffects.some((note) => /client-supplied package\/model readiness hints are ignored/i.test(note)))
  assert.ok(privateInternalTestRun.stageIds.packageRecordId, 'Private internal test run should return package stage ID.')
  assert.match(privateInternalTestRun.stageIds.adapterIntegrationPackageRecordId ?? '', /^approved_edit_execution_package_/, 'Private internal test run should create a backend-scoped adapter integration package.')
  assert.match(privateInternalTestRun.stageIds.adapterSourceTruthReviewId ?? '', /^professional-tool-adapter-source-truth-review-/, 'Private internal test run should record backend adapter source-truth review evidence.')
  assert.match(privateInternalTestRun.stageIds.adapterBoundedExecutionRunId ?? '', /^bounded-adapter-execution-run-/, 'Private internal test run should record bounded adapter execution handoff evidence.')
  assert.match(privateInternalTestRun.stageIds.adapterRegisteredRunnerRunId ?? '', /^registered-runner-run-/, 'Private internal test run should record registered runner probe evidence.')
  assert.match(privateInternalTestRun.stageIds.adapterPrivateMediaRunnerRunId ?? '', /^private-media-runner-run-/, 'Private internal test run should create private runner manifests for the import-proven adapter subset.')
  assert.match(privateInternalTestRun.stageIds.adapterPrivateMediaRunnerQaReviewId ?? '', /^registered_adapter_private_runner_qa_review_/, 'Private internal test run should create private adapter QA for the import-proven adapter subset.')
  assert.match(privateInternalTestRun.stageIds.adapterWorkerArtifactIntegrationId ?? '', /^adapter_worker_artifact_integration_/, 'Private internal test run should integrate import-proven adapter QA into private render traceability.')
  assert.ok(privateInternalTestRun.stageIds.privateInternalDownloadDeliveryId, 'Private internal test run should return private download stage ID.')
  const privateInternalPackageReadBack = await fetchJson(`${baseUrl}/v1/edit-executions/packages/${privateInternalTestRun.stageIds.packageRecordId}`)
  assert.equal(privateInternalPackageReadBack.status, 200, 'Private internal package should be readable from mock storage.')
  const privateInternalPackage = privateInternalPackageReadBack.json.data?.approvedEditExecutionPackage
  assert.deepEqual(privateInternalPackage?.packageReadyToolIds ?? [], [], 'Private internal runs must not trust client package readiness hints as package evidence.')
  assert.deepEqual(privateInternalPackage?.modelWeightApprovedToolIds ?? [], [], 'Private internal runs must not trust client model approval hints as package evidence.')
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.status, 'private_internal_download_delivery_ready')
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.privateInternalDownloadReady, true)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.publicDeliveryReady, false)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.externalBetaReady, false)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.productionReady, false)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.finalExportReady, true)
  assert.equal(privateInternalTestRun.privateInternalDownloadPath, privateInternalTestRun.privateInternalDownloadDelivery.internalDownloadPath)
  assert.equal(privateInternalTestRun.privateInternalManifestPath, privateInternalTestRun.privateInternalDownloadDelivery.internalManifestPath)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.professionalEditQaSummary.privateInternalQaReady, true)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.professionalEditQaSummary.visualPolishApplied, true)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.professionalEditQaSummary.editDecisionManifestReady, true)
  assert.equal(privateInternalTestRun.privateInternalDownloadDelivery.professionalEditQaSummary.editDecisionManifestArtifactReady, true)
  assert.equal(privateInternalTestRun.finalRenderArtifact.privateArtifact, true)
  assert.equal(privateInternalTestRun.finalRenderArtifact.publicArtifact, false)
  assert.equal(privateInternalTestRun.finalRenderArtifact.signedUrl, null)
  assert.ok(privateInternalTestRun.finalRenderArtifact.durationSeconds > 0, 'Private internal test run final render should record duration metadata.')
  assert.ok(privateInternalTestRun.finalRenderArtifact.width > 0, 'Private internal test run final render should record width metadata.')
  assert.ok(privateInternalTestRun.finalRenderArtifact.height > 0, 'Private internal test run final render should record height metadata.')
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.reviewOverlayCount, privateInternalTestRun.privateInternalDownloadDelivery.finalRenderArtifact.commandSummary.reviewOverlayCount)
  assert.ok(privateInternalTestRun.finalRenderArtifact.commandSummary.approvedCaptionOverlayCount > 0, 'Private internal test run final render should include approved caption timing overlays.')
  assert.ok(privateInternalTestRun.finalRenderArtifact.commandSummary.approvedTransitionPolishCount > 0, 'Private internal test run final render should include approved transition polish.')
  assert.ok(privateInternalTestRun.finalRenderArtifact.commandSummary.approvedVisualPolishCount > 0, 'Private internal test run final render should include approved visual polish.')
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.visualPolish.applied, true)
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.visualPolish.fullColorPipelineExecuted, false)
  assert.ok(privateInternalTestRun.finalRenderArtifact.commandSummary.approvedFinalTimingCount > 0, 'Private internal test run final render should include approved final timeline timing.')
  assert.ok(privateInternalTestRun.finalRenderArtifact.commandSummary.approvedFinalTimelineDurationSeconds > 0, 'Private internal test run final render should record approved final timeline duration.')
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.privateCaptionArtifactCount, 3)
  assert.deepEqual(new Set(privateInternalTestRun.finalRenderArtifact.commandSummary.privateCaptionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.privateCaptionSource, 'approved_caption_timing_private_caption_files')
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.mode, 'overlay_then_concat_with_audio_polish')
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.audioPolish?.applied, true)
  assert.equal(privateInternalTestRun.finalRenderArtifact.commandSummary.audioPolish?.source, 'private_final_render_voice_first_loudness')
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.match(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.adapterQaIntegration.adapterWorkerArtifactIntegrationId ?? '', /^adapter_worker_artifact_integration_/, 'Private internal test run should attach partial adapter QA integration to the edit decision manifest.')
  assert.match(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.adapterQaIntegration.privateMediaRunnerQaReviewId ?? '', /^registered_adapter_private_runner_qa_review_/, 'Private internal test run should attach partial private runner QA to the edit decision manifest.')
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.adapterQaIntegration.artifactCount, privateInternalBoundedPackageCheckCount)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.adapterQaIntegration.mediaProcessingExecuted, false)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.adapterQaIntegration.productRuntimeExecuted, false)
  assert.deepEqual(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.approvedEditContext, editDecisionManifest.approvedEditContext)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.clipDecisionCount, privateInternalTestRun.finalRenderArtifact.commandSummary.inputCount)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.sourceOrderPreserved, true)
  assert.deepEqual(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.uploadedOrders, privateInternalTestRun.finalRenderArtifact.editDecisionManifest.decisions.map((decision) => decision.uploadedOrder))
  assert.deepEqual(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId, editDecisionManifest.uploadedSourceOrderTrace.sourceStoragePathByMediaAssetId)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifest.blockedRuntimeScopes.signedUrlCreated, false)
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifestArtifact.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(privateInternalTestRun.finalRenderArtifact.editDecisionManifestArtifact.privateArtifact, true)
  assert.equal(privateInternalTestRun.finalRenderArtifact.finalDeliveryEligible, false)
  assert.equal(privateInternalTestRun.publicDeliveryReady, false)
  assert.equal(privateInternalTestRun.externalBetaReady, false)
  assert.equal(privateInternalTestRun.productionReady, false)
  assert.equal(privateInternalTestRun.nextRequiredGate, 'backend_adapter_runtime_evidence_before_external_beta_or_production_release')
  assert.ok(privateInternalTestRun.noRuntimeSideEffects.some((note) => /approved snapshot and credit reservation/i.test(note)), 'Private internal test run must preserve approval and credit evidence.')
  assert.ok(privateInternalTestRun.noRuntimeSideEffects.some((note) => /bounded backend package evidence|media-transform worker execution remains gated/i.test(note)), 'Private internal test run must distinguish bounded package checks from full media-transform execution.')
  assert.ok(privateInternalTestRun.noRuntimeSideEffects.some((note) => /No public artifact/i.test(note)), 'Private internal test run must keep public delivery blocked.')

  const privateInternalTestRunFile = await fetchBinary(`${baseUrl}${privateInternalTestRun.privateInternalDownloadPath}`)
  assert.equal(privateInternalTestRunFile.status, 200, 'Private internal test run file should stream successfully.')
  assert.match(privateInternalTestRunFile.headers.get('content-type') ?? '', /^video\/mp4\b/i)
  assert.equal(Number(privateInternalTestRunFile.headers.get('content-length')), privateInternalTestRun.finalRenderArtifact.byteSize)

  const privateInternalTestRunManifest = await fetchBinary(`${baseUrl}${privateInternalTestRun.privateInternalManifestPath}`)
  assert.equal(privateInternalTestRunManifest.status, 200, 'Private internal test run manifest should stream successfully.')
  assert.match(privateInternalTestRunManifest.headers.get('content-type') ?? '', /^application\/json\b/i)
  assert.equal(createHash('sha256').update(privateInternalTestRunManifest.bytes).digest('hex'), privateInternalTestRun.finalRenderArtifact.editDecisionManifestArtifact.sha256)
  const downloadedPrivateInternalTestRunManifest = JSON.parse(Buffer.from(privateInternalTestRunManifest.bytes).toString('utf8')) as ProfessionalEditDecisionManifestSmoke
  assert.equal(downloadedPrivateInternalTestRunManifest.finalRenderArtifactId, privateInternalTestRun.finalRenderArtifact.artifactId)
  assert.deepEqual(downloadedPrivateInternalTestRunManifest.approvedEditContext, privateInternalTestRun.finalRenderArtifact.editDecisionManifest.approvedEditContext)
  assert.equal(downloadedPrivateInternalTestRunManifest.uploadedSourceOrderTrace.sourceOrderPreserved, true)
  assert.equal(
    downloadedPrivateInternalTestRunManifest.decisions.every((decision) =>
      decision.processedArtifact.processingMode === 'private_internal_review_render'
    ),
    true,
    'Downloaded private internal test run manifest should preserve private review render mode.',
  )
  assert.equal(privateInternalTestRunFile.bytes.byteLength, privateInternalTestRun.finalRenderArtifact.byteSize)

  const privateInternalTestRunReplay = await postJson(`${baseUrl}/v1/edit-executions/private-internal-test-runs`, {
    ...requestBody,
    internalTestRunOnly: true,
    sourceMediaAssets: uploadedSourceMediaAssets,
    processingMode: 'private_internal_review_render',
    maxDurationSeconds: 30,
    targetWidth: 480,
    targetHeight: 270,
    fps: 24,
    reviewerNote: 'Route smoke approves the private internal review render for final-render readiness.',
  }, 'route-package-private-internal-test-run')
  assert.equal(privateInternalTestRunReplay.status, 201, `Idempotent private internal test run replay should succeed: ${JSON.stringify(privateInternalTestRunReplay.json)}`)
  assert.equal(privateInternalTestRunReplay.json.data?.internalTestRun?.stageIds.privateInternalDownloadDeliveryId, privateInternalTestRun.stageIds.privateInternalDownloadDeliveryId, 'Private internal test run replay should not duplicate delivery records.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'route_registered',
      'auth_mock_mode_allowed',
      'idempotency_required',
      'credit_reservation_required',
      'approved_snapshot_package_created',
      'approved_execution_package_cross_user_readback_rejected',
      'approved_execution_package_cross_user_gate_readback_rejected',
      'approved_execution_package_cross_user_source_truth_review_rejected',
      'approved_execution_package_cross_user_execution_handoff_rejected',
      'idempotent_replay_no_duplicate_package',
      'package_readback_available',
      'bounded_adapter_execution_gate_readback_blocks_without_server_source_truth',
      'bounded_adapter_source_truth_route_rejects_unapproved_package_evidence_source',
      'bounded_adapter_source_truth_route_rejects_unapproved_model_evidence_source',
      'professional_adapters_resolved',
      'job_batch_plan_created',
      'job_batch_plan_preserves_snapshot_credit_dependencies_and_qa',
      'idempotent_job_batch_replay_no_duplicate_jobs',
      'mock_queue_created_for_ready_jobs_only',
      'mock_queue_preserves_snapshot_credit_and_idempotency',
      'idempotent_mock_queue_replay_no_duplicate_jobs',
      'dispatch_readiness_gate_audit_created',
      'dispatch_readiness_checks_worker_gates_without_claims',
      'idempotent_dispatch_readiness_replay',
      'mock_worker_claim_leases_created',
      'mock_worker_claims_preserve_snapshot_credit_worker_and_idempotency',
      'idempotent_mock_worker_claim_replay_no_duplicate_claims',
      'handler_dry_run_created_result_manifest_and_qa_handoff_metadata',
      'handler_dry_run_keeps_final_export_blocked',
      'idempotent_handler_dry_run_replay_no_duplicate_results',
      'result_reconciliation_created_manifest_and_qa_readiness',
      'result_reconciliation_keeps_dry_run_refs_non_final',
      'idempotent_result_reconciliation_replay_no_duplicate_records',
      'local_worker_output_persisted_private_metadata_records',
      'local_worker_output_unblocks_internal_preview_review_only',
      'idempotent_local_worker_output_replay_no_duplicate_records',
      'local_worker_output_metadata_qa_review_passed',
      'idempotent_local_worker_output_qa_replay_no_duplicate_records',
      'approved_edit_production_workflow_rehearsal_created',
      'workflow_rehearsal_covers_media_to_final_render_stages',
      'workflow_rehearsal_keeps_uploaded_media_execution_gate_explicit',
      'idempotent_workflow_rehearsal_replay_no_duplicate_reports',
      'uploaded_media_worker_execution_rejects_mock_source_assets',
      'uploaded_media_worker_execution_rejects_missing_source_checksums',
      'uploaded_media_worker_execution_rejects_zero_byte_source_assets',
      'uploaded_media_worker_execution_rejects_approved_source_sequence_mismatch',
      'uploaded_media_worker_execution_rejects_approved_source_asset_identity_mismatch',
      'uploaded_media_worker_execution_metadata_created',
      'uploaded_media_worker_execution_binds_private_source_media',
      'uploaded_media_worker_execution_keeps_media_processing_blocked',
      'idempotent_uploaded_media_worker_execution_replay_no_duplicate_records',
      'private_worker_artifact_metadata_qa_review_passed',
      'private_worker_artifact_qa_keeps_real_media_processing_gate_explicit',
      'idempotent_private_worker_artifact_qa_replay_no_duplicate_records',
      'local_media_processing_rejects_missing_uploaded_source_bytes',
      'local_media_processing_rejects_uploaded_source_byte_size_mismatch',
      'local_media_processing_rejects_uploaded_source_checksum_mismatch',
      'local_media_processing_execution_created_private_media_artifacts',
      'approved_caption_timing_private_files_created',
      'local_media_processing_keeps_private_media_artifact_qa_gate_explicit',
      'idempotent_local_media_processing_replay_no_duplicate_records',
      'private_media_artifact_qa_review_passed',
      'private_media_artifact_qa_keeps_render_preview_assembly_gate_explicit',
      'idempotent_private_media_artifact_qa_replay_no_duplicate_records',
      'render_preview_assembly_created_private_manifest',
      'approved_segment_order_private_preview_assembly',
      'approved_segment_metadata_private_review_overlays',
      'approved_caption_timing_private_review_overlays',
      'approved_transition_timing_private_review_polish',
      'approved_color_pipeline_private_visual_polish',
      'approved_master_timing_final_ranges_private_review',
      'render_preview_assembly_keeps_user_preview_review_gate_explicit',
      'idempotent_render_preview_assembly_replay_no_duplicate_records',
      'user_preview_review_approved',
      'user_preview_review_keeps_final_render_readiness_gate_explicit',
      'idempotent_user_preview_review_replay_no_duplicate_records',
      'final_render_readiness_passed',
      'final_render_readiness_keeps_final_render_execution_gate_explicit',
      'idempotent_final_render_readiness_replay_no_duplicate_records',
      'final_render_execution_created_private_candidate',
      'final_render_execution_burned_private_review_overlays',
      'final_render_execution_burned_approved_caption_overlays',
      'final_render_execution_attached_private_caption_file_package',
      'final_render_execution_applied_approved_transition_polish',
      'final_render_execution_applied_approved_visual_polish',
      'final_render_execution_applied_approved_final_timing',
      'final_render_execution_applied_voice_first_audio_polish',
      'final_render_execution_attached_professional_edit_decision_manifest',
      'final_render_execution_persisted_professional_edit_decision_manifest_artifact',
      'final_render_execution_keeps_delivery_qa_gate_explicit',
      'idempotent_final_render_execution_replay_no_duplicate_records',
      'final_delivery_qa_passed_private_internal_only',
      'final_delivery_qa_verified_professional_edit_layers',
      'final_delivery_qa_verified_professional_edit_decision_manifest',
      'final_delivery_qa_verified_uploaded_source_order_trace',
      'final_delivery_qa_verified_professional_edit_decision_manifest_artifact',
      'final_delivery_qa_verified_professional_edit_decision_manifest_artifact_content',
      'final_delivery_qa_rejects_source_passthrough_artifacts',
      'final_delivery_qa_probed_private_final_render_streams',
      'final_delivery_qa_keeps_private_download_delivery_gate_explicit',
      'idempotent_final_delivery_qa_replay_no_duplicate_records',
      'private_internal_download_delivery_created',
      'private_internal_download_delivery_preserves_edit_decision_manifest',
      'private_internal_download_delivery_preserves_edit_decision_manifest_artifact',
      'private_internal_download_file_cross_user_access_rejected',
      'private_internal_download_manifest_cross_user_access_rejected',
      'private_internal_download_file_streamed',
      'private_internal_download_rejects_checksum_drift',
      'private_internal_download_manifest_rejects_checksum_drift',
      'private_internal_download_manifest_streamed',
      'private_internal_download_keeps_public_beta_production_blocked',
      'idempotent_private_internal_download_replay_no_duplicate_records',
      'private_internal_test_run_rejects_missing_source_checksums',
      'private_internal_test_run_rejects_zero_byte_source_assets',
      'private_internal_test_run_rejects_approved_source_sequence_mismatch',
      'private_internal_test_run_rejects_approved_source_asset_identity_mismatch',
      'private_internal_test_run_completed',
      'private_internal_test_run_reports_backend_adapter_runtime_blockers',
      'private_internal_test_run_preserves_edit_decision_manifest',
      'private_internal_test_run_preserves_edit_decision_manifest_artifact',
      'private_internal_test_run_file_streamed',
      'private_internal_test_run_manifest_streamed',
      'private_internal_test_run_replay_no_duplicate_records',
      'frontend_copy_hides_tool_names',
      'live_execution_remains_disabled',
      'no_runtime_media_provider_worker_side_effects',
    ],
    packageRecordId: createdPackage.packageRecordId,
    adapterToolCount: createdPackage.resolvedAdapterToolCount,
    privateArtifactRefCount: createdPackage.privateArtifactRefCount,
    plannedJobCount: plannedBatch.plannedJobCount,
    readyToQueueCount: plannedBatch.readyToQueueCount,
    waitingDependencyCount: plannedBatch.waitingDependencyCount,
    queuedJobCount: queued.queuedJobCount,
    workersStarted: queued.workersStarted,
    readyForClaimCount: readiness.readyForClaimCount,
    blockedByGateCount: readiness.blockedByGateCount,
    mockClaimCount: mockWorkerClaims.claimCount,
    workerHandlersStarted: mockWorkerClaims.workerHandlersStarted,
    toolsExecuted: mockWorkerClaims.toolsExecuted,
    handlerDryRunWorkResultCount: handlerDryRun.workResultCount,
    manifestUpdateCount: handlerDryRun.manifestUpdateCount,
    qaHandoffCount: handlerDryRun.qaHandoffCount,
    finalExportReady: handlerDryRun.finalExportReady,
    resultReconciliationStatus: resultReconciliation.status,
    sourceOfTruthArtifactCount: resultReconciliation.sourceOfTruthArtifactCount,
    nextRequiredGate: resultReconciliation.nextRequiredGate,
    localWorkerOutputStatus: localWorkerOutput.status,
    persistedArtifactCount: localWorkerOutput.persistedArtifactCount,
    localOutputSourceOfTruthArtifactCount: localWorkerOutput.sourceOfTruthArtifactCount,
    previewReviewReady: localWorkerOutput.previewReviewReady,
    renderPreviewReady: localWorkerOutput.renderPreviewReady,
    localOutputNextRequiredGate: localWorkerOutput.nextRequiredGate,
    localWorkerOutputQaStatus: localWorkerOutputQaReview.status,
    metadataQaPassedArtifactCount: localWorkerOutputQaReview.passedArtifactCount,
    localOutputQaNextRequiredGate: localWorkerOutputQaReview.nextRequiredGate,
    workflowRehearsalStatus: workflowRehearsal.status,
    workflowLocalOutputQaStatus: workflowRehearsal.localOutputQaStatus,
    workflowStageCount: workflowRehearsal.stageCount,
    workflowArtifactCount: workflowRehearsal.artifactCount,
    workflowQaGateCount: workflowRehearsal.qaGateCount,
    workflowNextRequiredGate: workflowRehearsal.nextRequiredGate,
    uploadedMediaWorkerExecutionStatus: uploadedMediaWorkerExecution.status,
    uploadedSourceMediaAssetCount: uploadedMediaWorkerExecution.sourceMediaAssetCount,
    privateWorkerArtifactCount: uploadedMediaWorkerExecution.privateWorkerArtifactCount,
    uploadedMediaWorkerMediaArtifactCount: uploadedMediaWorkerExecution.mediaArtifactCount,
    uploadedMediaNextRequiredGate: uploadedMediaWorkerExecution.nextRequiredGate,
    privateWorkerArtifactQaStatus: privateWorkerArtifactQaReview.status,
    privateWorkerArtifactQaPassedCount: privateWorkerArtifactQaReview.passedArtifactCount,
    privateWorkerArtifactQaNextRequiredGate: privateWorkerArtifactQaReview.nextRequiredGate,
    localMediaProcessingStatus: localMediaProcessingExecution.status,
    processedPrivateMediaArtifactCount: localMediaProcessingExecution.processedArtifactCount,
    localMediaProcessingNextRequiredGate: localMediaProcessingExecution.nextRequiredGate,
    privateMediaArtifactQaStatus: privateMediaArtifactQaReview.status,
    privateMediaArtifactQaPassedCount: privateMediaArtifactQaReview.passedArtifactCount,
    privateMediaArtifactQaNextRequiredGate: privateMediaArtifactQaReview.nextRequiredGate,
    renderPreviewAssemblyStatus: renderPreviewAssembly.status,
    renderPreviewClipCount: renderPreviewAssembly.previewClipCount,
    renderPreviewAssemblyNextRequiredGate: renderPreviewAssembly.nextRequiredGate,
    userPreviewReviewStatus: userPreviewReview.status,
    userPreviewReviewNextRequiredGate: userPreviewReview.nextRequiredGate,
    finalRenderReadinessStatus: finalRenderReadinessReview.status,
    finalRenderReadinessNextRequiredGate: finalRenderReadinessReview.nextRequiredGate,
    finalRenderExecutionStatus: finalRenderExecution.status,
    finalRenderExecutionNextRequiredGate: finalRenderExecution.nextRequiredGate,
    finalDeliveryQaStatus: finalDeliveryQaReview.status,
    privateInternalDownloadReady: finalDeliveryQaReview.privateInternalDownloadReady,
    finalDeliveryQaNextRequiredGate: finalDeliveryQaReview.nextRequiredGate,
    privateInternalDownloadDeliveryStatus: privateInternalDownloadDelivery.status,
    privateInternalDownloadByteCount: privateInternalDownloadFile.bytes.byteLength,
    privateInternalDownloadNextRequiredGate: privateInternalDownloadDelivery.nextRequiredGate,
    privateInternalTestRunStatus: privateInternalTestRun.status,
    privateInternalTestRunByteCount: privateInternalTestRunFile.bytes.byteLength,
    privateInternalTestRunNextRequiredGate: privateInternalTestRun.nextRequiredGate,
  }, null, 2))
} finally {
  await close(server)
  process.env.PATH = originalPath
  await stubBinaryRuntime.cleanup()
  await rm(localStorageRoot, { force: true, recursive: true })
}

const hydratedPythonRuntime = await createStubHydratedPythonRuntime([
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
])
const hydratedPythonLocalStorageRoot = '/tmp/reeditpro-edit-execution-package-route-smoke-hydrated-python'
await rm(hydratedPythonLocalStorageRoot, { force: true, recursive: true })

try {
  const hydratedPythonEnv = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    API_PORT: '8788',
    LOCAL_STORAGE_ROOT: hydratedPythonLocalStorageRoot,
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    TOOL_ADAPTER_PYTHON_BIN: hydratedPythonRuntime.wrapperPath,
  })
  const hydratedPythonApp = createReeditProApiApp(hydratedPythonEnv)
  const hydratedPythonServer = await listen(createServer(hydratedPythonApp))

  try {
    const hydratedPythonBaseUrl = `http://127.0.0.1:${addressPort(hydratedPythonServer)}`
    const hydratedPythonPackageBody = {
      ...requestBody,
      workspaceId: 'mock-workspace-route-hydrated-python',
      creditReservationId: 'mock-credit-reservation-route-hydrated-python',
      requestedAdapterToolNames: [...audioAdapterToolNames],
      adapterCandidateScope: 'requested_only',
      packageReadyToolIds: [...audioAdapterToolNames],
      modelWeightApprovedToolIds: [],
    }
    const hydratedPythonPackageResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/packages`,
      hydratedPythonPackageBody,
      'route-hydrated-python-adapter-package-create',
    )
    assert.equal(hydratedPythonPackageResponse.status, 201, `Hydrated Python adapter package should be created: ${JSON.stringify(hydratedPythonPackageResponse.json)}`)
    const hydratedPythonPackage = hydratedPythonPackageResponse.json.data?.approvedEditExecutionPackage
    assert.ok(hydratedPythonPackage, 'Hydrated Python adapter package response should include approvedEditExecutionPackage.')
    assert.equal(hydratedPythonPackage.resolvedAdapterToolCount, audioAdapterToolNames.length)
    assert.deepEqual(hydratedPythonPackage.packageReadyToolIds, [], 'Hydrated Python route package must ignore client package hints.')

    const hydratedPythonSourceTruthReviewResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/packages/${hydratedPythonPackage.packageRecordId}/bounded-adapter-source-truth-review`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        creditReservationId: hydratedPythonPackageBody.creditReservationId,
        packageReadinessEvidence: audioAdapterToolNames.map((toolId) => ({
          toolId,
          status: 'passed',
          source: 'backend_tool_readiness_worker',
          evidenceId: `route-hydrated-python-evidence-${toolId}`,
          checkedAt: '2026-07-06T00:00:00.000Z',
          summary: `${toolId} package readiness passed in backend-owned hydrated Python route smoke evidence.`,
        })),
        modelWeightApprovals: [],
      },
      'route-hydrated-python-adapter-source-truth-review',
    )
    assert.equal(hydratedPythonSourceTruthReviewResponse.status, 201, `Hydrated Python source-truth review should pass: ${JSON.stringify(hydratedPythonSourceTruthReviewResponse.json)}`)
    const hydratedPythonSourceTruthReview = hydratedPythonSourceTruthReviewResponse.json.data?.sourceTruthReview
    assert.ok(hydratedPythonSourceTruthReview, 'Hydrated Python source-truth route should return sourceTruthReview.')
    assert.equal(hydratedPythonSourceTruthReview.status, 'ready_for_bounded_execution', `Hydrated Python source-truth blockers: ${hydratedPythonSourceTruthReview.blockers.join(' | ')}`)
    assert.equal(hydratedPythonSourceTruthReview.acceptedPackageEvidenceCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonSourceTruthReview.frontendExecutionAllowed, false)
    assert.equal(hydratedPythonSourceTruthReview.productReady, false)

    const hydratedPythonExecutionRunResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/packages/${hydratedPythonPackage.packageRecordId}/bounded-adapter-execution-runs`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        creditReservationId: hydratedPythonPackageBody.creditReservationId,
        handoffOnly: true,
      },
      'route-hydrated-python-adapter-execution-run',
    )
    assert.equal(hydratedPythonExecutionRunResponse.status, 201, `Hydrated Python bounded execution handoff should pass: ${JSON.stringify(hydratedPythonExecutionRunResponse.json)}`)
    const hydratedPythonExecutionRun = hydratedPythonExecutionRunResponse.json.data?.boundedAdapterExecutionRun
    assert.ok(hydratedPythonExecutionRun, 'Hydrated Python execution route should return boundedAdapterExecutionRun.')
    assert.equal(hydratedPythonExecutionRun.readyToolCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonExecutionRun.actualToolPackageExecutionCount, 0)

    const hydratedPythonRunnerProbeResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/bounded-adapter-execution-runs/${hydratedPythonExecutionRun.id}/registered-runner-probe`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        importProbeOnly: true,
      },
      'route-hydrated-python-registered-runner-probe',
    )
    assert.equal(hydratedPythonRunnerProbeResponse.status, 201, `Hydrated Python registered runner probe should pass: ${JSON.stringify(hydratedPythonRunnerProbeResponse.json)}`)
    const hydratedPythonRunnerProbe = hydratedPythonRunnerProbeResponse.json.data?.registeredRunnerRun
    assert.ok(hydratedPythonRunnerProbe, 'Hydrated Python runner probe route should return registeredRunnerRun.')
    assert.equal(hydratedPythonRunnerProbe.status, 'completed_import_probe')
    assert.equal(hydratedPythonRunnerProbe.completedImportProbeCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonRunnerProbe.blockedRunnerCount, 0)
    assert.equal(hydratedPythonRunnerProbe.actualToolPackageExecutionCount, 0)
    assert.ok(hydratedPythonRunnerProbe.results.every((result) =>
      result.runtime === 'python' &&
      result.runtimeBinary === hydratedPythonRuntime.wrapperPath &&
      result.packageImported === true &&
      result.actualToolPackageExecuted === false
    ), 'Hydrated Python runner probe should import every audio/music package without media processing.')

    const hydratedPythonPrivateRunnerResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/registered-runner-runs/${hydratedPythonRunnerProbe.id}/private-media-runner-execution`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        creditReservationId: hydratedPythonPackageBody.creditReservationId,
        privateMediaExecutionOnly: true,
      },
      'route-hydrated-python-private-runner',
    )
    assert.equal(hydratedPythonPrivateRunnerResponse.status, 201, `Hydrated Python private runner manifest should pass: ${JSON.stringify(hydratedPythonPrivateRunnerResponse.json)}`)
    const hydratedPythonPrivateRunner = hydratedPythonPrivateRunnerResponse.json.data?.privateMediaRunnerRun
    assert.ok(hydratedPythonPrivateRunner, 'Hydrated Python private runner route should return privateMediaRunnerRun.')
    assert.equal(hydratedPythonPrivateRunner.status, 'private_runner_manifest_ready')
    assert.equal(hydratedPythonPrivateRunner.preparedPrivateRunnerManifestCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonPrivateRunner.mediaProcessingExecuted, false)
    assert.equal(hydratedPythonPrivateRunner.productRuntimeExecuted, false)

    const hydratedPythonPrivateRunnerQaResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/private-media-runner-runs/${hydratedPythonPrivateRunner.id}/qa-review`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        creditReservationId: hydratedPythonPackageBody.creditReservationId,
        qaReviewOnly: true,
      },
      'route-hydrated-python-private-runner-qa',
    )
    assert.equal(hydratedPythonPrivateRunnerQaResponse.status, 201, `Hydrated Python private runner QA should pass: ${JSON.stringify(hydratedPythonPrivateRunnerQaResponse.json)}`)
    const hydratedPythonPrivateRunnerQa = hydratedPythonPrivateRunnerQaResponse.json.data?.privateMediaRunnerQaReview
    assert.ok(hydratedPythonPrivateRunnerQa, 'Hydrated Python private runner QA route should return privateMediaRunnerQaReview.')
    assert.equal(hydratedPythonPrivateRunnerQa.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
    assert.equal(hydratedPythonPrivateRunnerQa.reviewedActivityCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonPrivateRunnerQa.artifactCount, audioAdapterToolNames.length)
    assert.equal((hydratedPythonPrivateRunnerQa as { actualToolPackageExecutionCount?: number }).actualToolPackageExecutionCount, privateInternalHydratedPythonBoundedPackageCheckCount)
    assert.equal(hydratedPythonPrivateRunnerQa.mediaProcessingExecuted, false)
    assert.equal(hydratedPythonPrivateRunnerQa.productRuntimeExecuted, false)

    const hydratedPythonAdapterIntegrationResponse = await postJson(
      `${hydratedPythonBaseUrl}/v1/edit-executions/private-runner-qa-reviews/${hydratedPythonPrivateRunnerQa.id}/adapter-worker-artifact-integration`,
      {
        workspaceId: hydratedPythonPackageBody.workspaceId,
        projectId: hydratedPythonPackageBody.projectId,
        creditReservationId: hydratedPythonPackageBody.creditReservationId,
        integrationOnly: true,
      },
      'route-hydrated-python-adapter-integration',
    )
    assert.equal(hydratedPythonAdapterIntegrationResponse.status, 201, `Hydrated Python adapter artifact integration should pass: ${JSON.stringify(hydratedPythonAdapterIntegrationResponse.json)}`)
    const hydratedPythonAdapterIntegration = hydratedPythonAdapterIntegrationResponse.json.data?.adapterWorkerArtifactIntegration
    assert.ok(hydratedPythonAdapterIntegration, 'Hydrated Python adapter integration route should return adapterWorkerArtifactIntegration.')
    assert.equal(hydratedPythonAdapterIntegration.status, 'adapter_worker_artifact_integration_passed_ready_for_render_preview')
    assert.equal(hydratedPythonAdapterIntegration.integratedArtifactCount, audioAdapterToolNames.length)
    assert.equal(hydratedPythonAdapterIntegration.mediaProcessingExecuted, false)
    assert.equal(hydratedPythonAdapterIntegration.productRuntimeExecuted, false)
    assert.equal(hydratedPythonAdapterIntegration.publicArtifact, false)
    assert.equal(hydratedPythonAdapterIntegration.signedUrl, null)

    console.log(JSON.stringify({
      ok: true,
      checks: [
        'hydrated_python_route_package_created',
        'hydrated_python_source_truth_review_passed',
        'hydrated_python_registered_runner_import_probe_completed',
        'hydrated_python_private_runner_manifest_ready',
        'hydrated_python_private_runner_qa_attached_bounded_package_evidence',
        'hydrated_python_adapter_artifacts_integrated_for_private_render',
        'hydrated_python_route_keeps_media_runtime_product_scopes_blocked',
      ],
      completedImportProbeCount: hydratedPythonRunnerProbe.completedImportProbeCount,
      actualToolPackageExecutionCount: (hydratedPythonPrivateRunnerQa as { actualToolPackageExecutionCount?: number }).actualToolPackageExecutionCount,
      integratedArtifactCount: hydratedPythonAdapterIntegration.integratedArtifactCount,
      frontendExecutionAllowed: hydratedPythonSourceTruthReview.frontendExecutionAllowed,
      productReady: hydratedPythonSourceTruthReview.productReady,
    }, null, 2))
  } finally {
    await close(hydratedPythonServer)
  }
} finally {
  await hydratedPythonRuntime.cleanup()
  await rm(hydratedPythonLocalStorageRoot, { force: true, recursive: true })
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected server to listen on a TCP port.')
  return address.port
}

async function postJson(url: string, body: unknown, idempotencyKey?: string): Promise<{ status: number; json: JsonResponse }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
  return { status: response.status, json: await response.json() as JsonResponse }
}

async function fetchJson(url: string): Promise<{ status: number; json: JsonResponse }> {
  const response = await fetch(url)
  return { status: response.status, json: await response.json() as JsonResponse }
}

async function fetchBinary(url: string): Promise<{ status: number; bytes: Uint8Array; headers: Headers }> {
  const response = await fetch(url)
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer()),
    headers: response.headers,
  }
}

async function assertServiceRejects(
  action: () => Promise<unknown>,
  expectedCode: string,
  message: string,
): Promise<void> {
  try {
    await action()
  } catch (error) {
    assert.equal((error as { code?: unknown }).code, expectedCode, message)
    return
  }
  assert.fail(message)
}

async function createStubBinaryRuntime(commandNames: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-route-adapter-binary-runtime-'))
  const binDir = join(root, 'bin')
  await mkdir(binDir, { recursive: true })

  for (const commandName of commandNames) {
    const commandPath = join(binDir, commandName)
    await writeFile(commandPath, [
      '#!/bin/sh',
      'exit 0',
      '',
    ].join('\n'), 'utf8')
    await chmod(commandPath, 0o755)
  }

  return {
    root,
    binDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

async function createStubHydratedPythonRuntime(packageNames: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-route-adapter-python-runtime-'))
  const packageRoot = join(root, 'packages')
  await mkdir(packageRoot, { recursive: true })

  for (const packageName of packageNames) {
    const packagePath = join(packageRoot, packageName)
    await mkdir(packagePath, { recursive: true })
    await writeFile(join(packagePath, '__init__.py'), [
      `__version__ = "0.0.0-route-smoke-${packageName}"`,
      'def api_shape_probe():',
      `    return "${packageName}"`,
      '',
    ].join('\n'), 'utf8')
  }

  await writeFile(join(packageRoot, 'pydub', 'effects.py'), [
    '__version__ = "0.0.0-route-smoke-pydub-effects"',
    'def normalize(*args, **kwargs):',
    '    return {"status": "stubbed"}',
    '',
  ].join('\n'), 'utf8')

  const wrapperPath = join(root, 'python-wrapper.sh')
  await writeFile(wrapperPath, [
    '#!/bin/sh',
    `PYTHONPATH="${packageRoot}:$PYTHONPATH" exec python3 "$@"`,
    '',
  ].join('\n'), 'utf8')
  await chmod(wrapperPath, 0o755)

  return {
    root,
    wrapperPath,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}
