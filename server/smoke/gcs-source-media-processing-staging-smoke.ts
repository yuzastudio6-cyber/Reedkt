import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import type { ServiceContext } from '../types'
import type { ObjectMetadata, StorageAdapter } from '../storage/storage-types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'

class FakeGcsStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  metadataReadCount = 0
  readStreamCount = 0
  writeAttemptCount = 0
  signedUrlAttemptCount = 0

  private readonly bucketName: string
  private readonly objectPath: string
  private readonly body: Buffer
  private readonly checksumSha256: string
  private readonly mimeType: string

  constructor(input: {
    bucketName: string
    objectPath: string
    body: Buffer
    checksumSha256: string
    mimeType: string
  }) {
    this.bucketName = input.bucketName
    this.objectPath = input.objectPath
    this.body = input.body
    this.checksumSha256 = input.checksumSha256
    this.mimeType = input.mimeType
  }

  async createUploadTarget(): Promise<never> {
    this.signedUrlAttemptCount += 1
    throw new Error('Fake GCS smoke does not create upload targets.')
  }

  async putObject(): Promise<never> {
    this.writeAttemptCount += 1
    throw new Error('Fake GCS smoke does not write objects.')
  }

  async verifyUploadedObject(): Promise<never> {
    throw new Error('Fake GCS smoke should not finalize uploads.')
  }

  async createDownloadTarget(): Promise<never> {
    this.signedUrlAttemptCount += 1
    throw new Error('Fake GCS smoke does not create download targets.')
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    this.metadataReadCount += 1
    if (bucketName !== this.bucketName || objectPath !== this.objectPath) {
      return {
        bucketName,
        objectPath,
        sizeBytes: 0,
        checksumSha256: '',
        exists: false,
        integrityVerified: false,
        checksumSource: 'unavailable',
      }
    }

    return {
      bucketName,
      objectPath,
      sizeBytes: this.body.byteLength,
      checksumSha256: this.checksumSha256,
      mimeType: this.mimeType,
      exists: true,
      generation: '3001',
      etag: 'etag-3001',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async createReadStream(bucketName: string, objectPath: string): Promise<Readable> {
    this.readStreamCount += 1
    const metadata = await this.getObjectMetadata(bucketName, objectPath)
    if (!metadata.exists) throw new Error('Fake GCS object not found.')
    return Readable.from([this.body])
  }

  async deleteObject(): Promise<never> {
    this.writeAttemptCount += 1
    throw new Error('Fake GCS smoke does not delete objects.')
  }
}

const localStorageRoot = '/tmp/reeditpro-gcs-source-media-processing-staging-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-source-media-smoke',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'gcs-uploaded-source.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
})
assert.equal(sourceFixture.available, true, `Synthetic GCS source fixture should be available: ${sourceFixture.warnings.join('; ')}`)
assert.ok(sourceFixture.outputPath, 'Synthetic GCS source fixture should expose its local file path.')

const sourceBytes = await readFile(sourceFixture.outputPath)
const sourceChecksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const sourceBucket = 'reeditpro-source-media-smoke'
const sourceObjectPath = 'workspaces/workspace-gcs-processing-smoke/projects/project-gcs-processing-smoke/source-media/gcs-uploaded-source.mp4'
const fakeGcsStorageAdapter = new FakeGcsStorageAdapter({
  bucketName: sourceBucket,
  objectPath: sourceObjectPath,
  body: sourceBytes,
  checksumSha256: sourceChecksumSha256,
  mimeType: 'video/mp4',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'gcs-source-media-processing-staging-smoke',
  auth: {
    userId: 'mock-user-gcs-source-processing',
    email: 'gcs-source-processing-smoke@example.test',
    isMockUser: true,
  },
  storageAdapter: fakeGcsStorageAdapter,
}

const plannerInput: PlannerInput = {
  projectName: 'GCS source media processing smoke edit',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Create a clean private test edit from the uploaded GCS source clip.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'gcs-uploaded-source-clip',
      fileName: 'gcs-uploaded-source.mp4',
      duration: '1s',
      detectedType: 'Talking head source',
      notes: 'Uploaded through backend private GCS storage for staging smoke.',
      previewLabel: 'GCS uploaded source clip',
      thumbnailHint: 'Synthetic private GCS source',
      sourceRole: 'main_story',
      uploadedOrder: 1,
    },
  ],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)
const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'mock-user-gcs-source-processing',
  editSessionId: 'edit-session-gcs-source-processing-smoke',
  projectId: 'project-gcs-processing-smoke',
  plan,
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
  masterTimingPlan: snapshot.masterTimingPlan,
  captionVisualCueTimingPlan: snapshot.captionVisualCueTimingPlan,
  sourceCleanupPlan: snapshot.sourceCleanupPlan,
  sourcePlan: {
    goalSummary: snapshot.sourcePlan.goalSummary,
  },
  creditEstimate: snapshot.creditEstimate,
  colorPipelinePlan: snapshot.colorPipelinePlan,
  editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
  asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
  agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
  qaPlan: snapshot.qaPlan,
  toolStrategyPlan: snapshot.toolStrategyPlan,
}
const service = createApprovedEditExecutionPackageService(context)
const workspaceId = 'workspace-gcs-processing-smoke'
const creditReservationId = 'credit-reservation-gcs-processing-smoke'
const stageKey = (stage: string) => `gcs-source-media-processing-smoke:${stage}`
const requestPath = (stage: string) => `/smoke/gcs-source-media-processing#${stage}`

try {
  const packageResult = await service.createPackage({
    workspaceId,
    projectId: snapshot.projectId,
    approvedPlanSnapshotId: snapshot.id,
    approvedSnapshot: compactSnapshot,
    creditReservationId,
    requestedAdapterToolNames: ['d3', 'three', 'sam3_1'],
    packageReadyToolIds: ['d3', 'three', 'sam3_1'],
    modelWeightApprovedToolIds: ['sam3_1'],
    idempotencyKey: stageKey('package'),
    requestPath: requestPath('package'),
  })

  const jobBatchResult = await service.createJobBatchPlan({
    packageRecordId: packageResult.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    dryRunOnly: true,
    idempotencyKey: stageKey('job-batch-plan'),
    requestPath: requestPath('job-batch-plan'),
  })

  const mockQueueResult = await service.createMockQueue({
    jobBatchPlanId: jobBatchResult.jobBatchPlan.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    mockQueueOnly: true,
    idempotencyKey: stageKey('mock-queue'),
    requestPath: requestPath('mock-queue'),
  })

  const dispatchReadinessResult = await service.createDispatchReadiness({
    mockQueueId: mockQueueResult.mockQueue.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    dryRunOnly: true,
    idempotencyKey: stageKey('dispatch-readiness'),
    requestPath: requestPath('dispatch-readiness'),
  })

  const mockWorkerClaimsResult = await service.createMockWorkerClaims({
    dispatchReadinessId: dispatchReadinessResult.dispatchReadiness.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    mockClaimsOnly: true,
    idempotencyKey: stageKey('mock-worker-claims'),
    requestPath: requestPath('mock-worker-claims'),
  })

  const handlerDryRunResult = await service.createHandlerDryRun({
    mockWorkerClaimsId: mockWorkerClaimsResult.mockWorkerClaims.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    handlerDryRunOnly: true,
    idempotencyKey: stageKey('handler-dry-run'),
    requestPath: requestPath('handler-dry-run'),
  })

  const resultReconciliationResult = await service.createResultReconciliation({
    handlerDryRunId: handlerDryRunResult.handlerDryRun.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    reconcileDryRunOnly: true,
    idempotencyKey: stageKey('result-reconciliation'),
    requestPath: requestPath('result-reconciliation'),
  })

  const localWorkerOutputResult = await service.createLocalWorkerOutput({
    resultReconciliationId: resultReconciliationResult.resultReconciliation.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    localOutputOnly: true,
    idempotencyKey: stageKey('local-worker-output'),
    requestPath: requestPath('local-worker-output'),
  })

  const localWorkerOutputQaResult = await service.createLocalWorkerOutputQaReview({
    localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    qaReviewOnly: true,
    idempotencyKey: stageKey('local-worker-output-qa'),
    requestPath: requestPath('local-worker-output-qa'),
  })

  const workflowRehearsalResult = await service.createWorkflowRehearsal({
    localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    rehearsalOnly: true,
    idempotencyKey: stageKey('workflow-rehearsal'),
    requestPath: requestPath('workflow-rehearsal'),
  })

  const uploadedMediaWorkerExecutionResult = await service.createUploadedMediaWorkerExecution({
    workflowRehearsalId: workflowRehearsalResult.workflowRehearsal.id,
    localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
    localWorkerOutputQaReviewId: localWorkerOutputQaResult.localWorkerOutputQaReview.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    uploadedMediaExecutionOnly: true,
    sourceMediaAssets: [
      {
        mediaAssetId: 'gcs-media-asset-001',
        sourceSequenceItemId: snapshot.sourceSequence[0]?.id,
        uploadedClipId: 'gcs-uploaded-source-clip',
        uploadedOrder: 1,
        storageProvider: 'google_cloud_storage',
        storageBucket: sourceBucket,
        storagePath: sourceObjectPath,
        fileName: 'gcs-uploaded-source.mp4',
        mimeType: 'video/mp4',
        byteSize: sourceBytes.byteLength,
        checksumSha256: sourceChecksumSha256,
        privateArtifact: true,
        publicUrl: null,
        signedUrl: null,
      },
    ],
    idempotencyKey: stageKey('uploaded-media-worker-execution'),
    requestPath: requestPath('uploaded-media-worker-execution'),
  })

  const privateWorkerArtifactQaResult = await service.createPrivateWorkerArtifactQaReview({
    uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecutionResult.uploadedMediaWorkerExecution.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    qaReviewOnly: true,
    idempotencyKey: stageKey('private-worker-artifact-qa'),
    requestPath: requestPath('private-worker-artifact-qa'),
  })

  const localMediaProcessingResult = await service.createLocalMediaProcessingExecution({
    privateWorkerArtifactQaReviewId: privateWorkerArtifactQaResult.privateWorkerArtifactQaReview.id,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    processingExecutionOnly: true,
    processingMode: 'bounded_preview_render',
    maxDurationSeconds: 2,
    targetWidth: 320,
    targetHeight: 568,
    fps: 24,
    idempotencyKey: stageKey('local-media-processing'),
    requestPath: requestPath('local-media-processing'),
  })

  const localMediaProcessing = localMediaProcessingResult.localMediaProcessingExecution
  assert.equal(localMediaProcessing.status, 'local_media_processing_execution_completed_waiting_private_media_artifact_qa')
  assert.equal(localMediaProcessing.sourceMediaAssetCount, 1)
  assert.ok(localMediaProcessing.processedArtifactCount > 0, 'GCS source media should produce private processed artifacts.')
  assert.equal(
    fakeGcsStorageAdapter.readStreamCount,
    localMediaProcessing.inputArtifactCount,
    'Each source-bound private artifact should read the private GCS object through the backend adapter.',
  )
  assert.equal(
    fakeGcsStorageAdapter.metadataReadCount,
    localMediaProcessing.inputArtifactCount * 2,
    'Each GCS source staging read should validate metadata before streaming and inside the fake stream guard.',
  )
  assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 0, 'Smoke must not write back to GCS.')
  assert.equal(fakeGcsStorageAdapter.signedUrlAttemptCount, 0, 'Smoke must not request signed URLs.')

  for (const processedArtifact of localMediaProcessing.processedArtifacts) {
    assert.equal(processedArtifact.sourceMediaAssetId, 'gcs-media-asset-001')
    assert.equal(processedArtifact.sourceChecksumSha256, sourceChecksumSha256)
    assert.equal(processedArtifact.storageProvider, 'local_private')
    assert.equal(processedArtifact.privateArtifact, true)
    assert.equal(processedArtifact.publicArtifact, false)
    assert.equal(processedArtifact.signedUrl, null)
    assert.equal(processedArtifact.mimeType, 'video/mp4')
    assert.match(processedArtifact.sha256, /^[a-f0-9]{64}$/)
    assert.ok(processedArtifact.byteSize > 0, 'Processed private artifact should contain bytes.')
    assert.ok(processedArtifact.durationSeconds > 0, 'Processed private artifact should include duration evidence.')
    const processedStat = await stat(processedArtifact.localFilePath)
    assert.equal(processedStat.size, processedArtifact.byteSize)
  }

  assert.ok(
    localMediaProcessing.noRuntimeSideEffects.some((line) => line.includes('approved local/GCS private source files')),
    'Processing summary should state that local/GCS private source reads are backend-only.',
  )
  assert.equal(localMediaProcessing.renderPreviewReady, false)
  assert.equal(localMediaProcessing.finalRenderReady, false)
  assert.equal(localMediaProcessing.nextRequiredGate, 'private_media_artifact_qa_review')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'fake_gcs_source_metadata_read_without_real_credentials',
      'fake_gcs_source_stream_staged_into_local_private_processing',
      'approved_execution_chain_preserves_google_cloud_storage_source_provider',
      'bounded_local_media_processing_created_private_artifacts',
      'no_gcs_write_signed_url_public_artifact_or_delivery_scope',
    ],
    gcsObjectByteCount: sourceBytes.byteLength,
    processedArtifactCount: localMediaProcessing.processedArtifactCount,
    nextRequiredGate: localMediaProcessing.nextRequiredGate,
  }))
} catch (error) {
  const apiError = error as { code?: string; details?: { requiredGate?: string } }
  assert.equal(
    apiError.code,
    'TOOL_NOT_READY',
    'The deprecated caller-authored execution chain must fail at the canonical package boundary.',
  )
  assert.equal(
    apiError.details?.requiredGate,
    'canonical_edit_authority_execution_package',
    'GCS media staging must wait for a server-derived canonical execution package.',
  )
  assert.equal(fakeGcsStorageAdapter.metadataReadCount, 0, 'A blocked legacy chain must not inspect the GCS object.')
  assert.equal(fakeGcsStorageAdapter.readStreamCount, 0, 'A blocked legacy chain must not read GCS bytes.')
  assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 0, 'A blocked legacy chain must not mutate GCS.')
  assert.equal(fakeGcsStorageAdapter.signedUrlAttemptCount, 0, 'A blocked legacy chain must not mint signed URLs.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'caller_authored_execution_package_rejected_before_gcs_access',
      'canonical_edit_authority_package_required_for_gcs_staging',
      'no_gcs_metadata_read_stream_write_or_signed_url_side_effect',
      'canonical_gcs_worker_staging_remains_fail_closed_until_job_scoped_adapter_exists',
    ],
    nextRequiredGate: 'canonical_edit_authority_execution_package',
  }))
} finally {
  await rm(localStorageRoot, { force: true, recursive: true })
}
