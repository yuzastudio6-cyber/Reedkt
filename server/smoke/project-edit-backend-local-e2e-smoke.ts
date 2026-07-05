import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { probeMediaFile } from '../media/ffprobe'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { checkBasicRenderSmokeTools } from '../services/render-smoke-service'
import { createProjectBackendLocal } from '../../src/lib/project-backend-local'
import {
  createProjectEditSessionBackendLocalFromNewEditForm,
  listProjectEditSessionsBackendLocal,
  readProjectEditSessionBackendLocal,
  recordProjectEditSessionLifecycleCheckpointBackendLocal,
} from '../../src/lib/project-edit-session-backend-local'
import {
  createBriefDraftChangedCheckpointMetadata,
  createBriefSavedCheckpointMetadata,
  createFinalExportReadyCheckpointMetadata,
  createPlanApprovedCheckpointMetadata,
  createProfessionalQACheckpointMetadata,
  createPreviewReadyCheckpointMetadata,
  createPreviewReviewedCheckpointMetadata,
  createRestoredApprovedLocalPlan,
  createSourceUploadCheckpointMetadata,
  restoreBackendUploadResult,
  restoreFinalExportResult,
  restoreProfessionalQAResult,
  restorePreviewResult,
  restorePreviewReviewResult,
} from '../../src/lib/project-edit-session-lifecycle-checkpoint-ui-adapter'
import {
  createProjectEditSessionHomeCardViewModelFromRecord,
  createProjectEditSessionHomeDetailViewModelFromRecord,
} from '../../src/lib/project-edit-session-project-home-ui-adapter'
import { createDefaultNewEditSessionFormState } from '../../src/lib/project-edit-session-create-flow-ui-adapter'
import {
  readProjectEditBriefBackendLocal,
  saveProjectEditBriefBackendLocal,
} from '../../src/lib/project-edit-brief-backend-local'
import { approveProjectEditPlanBackendLocal } from '../../src/lib/project-edit-plan-backend-local'
import { buildProjectEditPlanApprovalModel } from '../../src/lib/project-edit-plan-approval'
import { buildProjectEditLifecycleModel } from '../../src/lib/project-edit-lifecycle'
import { uploadProjectSourceVideoToBackend } from '../../src/lib/project-source-video-backend-upload'
import { runProjectSourceVideoLocalEditPreviewSmoke } from '../../src/lib/project-source-video-local-edit-preview-smoke'
import { runProjectSourceVideoLocalFinalExportSmoke } from '../../src/lib/project-source-video-local-final-export-smoke'
import { createProjectSourceVideoPreviewReview } from '../../src/lib/project-source-video-preview-review'
import { createProjectSourceVideoProfessionalQA } from '../../src/lib/project-source-video-professional-qa'

function localUrl(port: number): string {
  return `http://127.0.0.1:${port}`
}

async function assertPrivateReviewArtifact(input: {
  apiBaseUrl: string
  label: string
  storageObjectRecordId?: string
  workspaceId: string
}) {
  assert.ok(input.storageObjectRecordId, `${input.label} storage object id should be present`)
  const response = await fetch(`${input.apiBaseUrl}/v1/storage-objects/${encodeURIComponent(input.storageObjectRecordId)}/local-object?workspaceId=${encodeURIComponent(input.workspaceId)}`)
  assert.equal(response.ok, true, `${input.label} artifact should be privately readable`)
  assert.match(response.headers.get('content-type') ?? '', /video\/mp4/)
  assert.equal(response.headers.get('x-reeditpro-storage-object-id'), input.storageObjectRecordId)
  const bytes = await response.arrayBuffer()
  assert.ok(bytes.byteLength > 0, `${input.label} artifact should not be empty`)
  return bytes.byteLength
}

async function assertPrivateArtifactFrame(input: {
  bucketName?: string
  height: number
  label: string
  objectPath?: string
  width: number
}) {
  assert.ok(input.bucketName, `${input.label} bucket should be present`)
  assert.ok(input.objectPath, `${input.label} object path should be present`)
  const artifactPath = resolveLocalStorageObjectPath(localStorageRoot, input.bucketName, input.objectPath)
  const probe = await probeMediaFile(artifactPath, {
    ffprobeBin: env.ffprobeBin,
    timeoutMs: env.toolCheckTimeoutMs,
  })
  assert.equal(probe.width, input.width, `${input.label} should use the confirmed output frame width`)
  assert.equal(probe.height, input.height, `${input.label} should use the confirmed output frame height`)
  return probe
}

const workspaceId = 'mock-workspace'
const localStorageRoot = '.reeditpro-local-storage-backend-local-e2e-smoke'

await rm(localStorageRoot, { force: true, recursive: true })

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'mock',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  NODE_ENV: 'test',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
})

const tools = await checkBasicRenderSmokeTools({
  env,
  clients: { admin: null, public: null },
  requestId: 'project-edit-backend-local-e2e-smoke-tool-check',
  auth: { userId: 'internal-e2e-smoke-user', isMockUser: true },
})
assert.equal(tools.ready, true, `Project edit backend-local E2E smoke requires FFmpeg/FFprobe: ${tools.warnings.join('; ')}`)

const app = createReeditProApiApp(env)
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const apiBaseUrl = localUrl(address.port)

try {
  const project = await createProjectBackendLocal({
    apiBaseUrl,
    description: 'Backend-local full edit sequence smoke.',
    name: 'Backend-local E2E smoke project',
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(project.project.productReady, false)
  assert.equal(project.readback.id, project.project.id)

  const editForm = {
    ...createDefaultNewEditSessionFormState(),
    aspectRatio: '9:16' as const,
    name: 'Backend-local E2E smoke edit',
    platformTarget: 'instagram_reel' as const,
    selectedEditLevel: 'premium' as const,
  }
  const createdEdit = await createProjectEditSessionBackendLocalFromNewEditForm({
    apiBaseUrl,
    form: editForm,
    projectId: project.project.id,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(createdEdit.ok, true)
  assert.ok(createdEdit.session)
  const editSessionId = createdEdit.session.id

  const fixturePath = path.resolve(localStorageRoot, 'fixtures/backend-local-e2e-source.mp4')
  const fixture = await createSyntheticMp4Fixture({
    outputPath: fixturePath,
    localStorageRoot,
    durationSeconds: 2,
    width: 320,
    height: 180,
    ffmpegBin: env.ffmpegBin,
    timeoutMs: env.toolCheckTimeoutMs,
  })
  assert.equal(fixture.available, true, fixture.warnings.join('; '))
  assert.ok(fixture.outputPath)
  const fileBytes = await readFile(fixture.outputPath)
  const sourceFile = new File([fileBytes], 'backend-local-e2e-source.mp4', { type: 'video/mp4' })

  const upload = await uploadProjectSourceVideoToBackend({
    apiBaseUrl,
    editSessionId,
    file: sourceFile,
    projectId: project.project.id,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(upload.status, 'uploaded')
  assert.equal(upload.productReady, false)

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'source_uploaded',
    status: 'setup_ready',
    sourceMediaAssetId: upload.mediaAssetId,
    metadata: createSourceUploadCheckpointMetadata(upload),
    getAccessToken: async () => undefined,
  })

  const briefText = 'Create a clean professional first pass with readable captions, steady pacing, and natural audio.'
  const brief = await saveProjectEditBriefBackendLocal({
    apiBaseUrl,
    briefText,
    editSessionId,
    projectId: project.project.id,
    sourceMediaAssetId: upload.mediaAssetId,
    sourceStorageObjectRecordId: upload.storageObjectRecordId,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(brief.readback.briefText, briefText)
  assert.equal(brief.readback.readbackVerified, true)

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'brief_saved',
    status: 'awaiting_approval',
    sourceMediaAssetId: upload.mediaAssetId,
    metadata: createBriefSavedCheckpointMetadata({
      brief: brief.readback,
      sourceVideoUploadResult: upload,
    }),
    getAccessToken: async () => undefined,
  })

  const plan = buildProjectEditPlanApprovalModel({
    approved: true,
    backendUploadResult: upload,
    briefSaved: true,
    briefText: brief.readback.briefText,
    editSessionId,
    outputAspectRatio: editForm.aspectRatio,
    outputFrameConfirmed: createdEdit.session?.metadata?.outputFrameConfirmed === true,
    outputFrameConfirmationSource: 'new_edit_create_form',
    outputPlatformTarget: editForm.platformTarget,
    projectId: project.project.id,
    sourceAspectRatio: '16:9',
    sourceDurationSeconds: fixture.durationSeconds,
    sourceFileName: sourceFile.name,
  })
  assert.equal(plan.canApprove, true)
  assert.equal(plan.approved, true)
  assert.equal(plan.operationManifest.version, 'project-edit-operation-manifest-v1')
  assert.deepEqual(plan.operationManifest.outputFrame, {
    aspectRatio: editForm.aspectRatio,
    platformTarget: editForm.platformTarget,
    width: 540,
    height: 960,
    confirmed: true,
    source: 'new_edit_create_form',
  })
  assert.ok(plan.operationManifest.operations.length >= 7)
  assert.ok(plan.operationManifest.requiredQaChecks.includes('approved_snapshot_used'))

  const approvedPlan = await approveProjectEditPlanBackendLocal({
    apiBaseUrl,
    approvedLocalPlan: plan,
    editBrief: brief.readback,
    editSessionId,
    projectId: project.project.id,
    sourceVideoUploadResult: upload,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(approvedPlan.localEditPlan.readbackVerified, true)
  assert.equal(approvedPlan.localEditPlan.productReady, false)
  assert.equal(approvedPlan.localEditPlan.briefLineage.briefId, brief.readback.id)
  assert.equal(approvedPlan.localEditPlan.approvedLocalPlan.briefLineage.briefFingerprint, approvedPlan.localEditPlan.briefLineage.briefFingerprint)
  assert.equal(approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.operations.length, plan.operationManifest.operations.length)
  assert.equal(approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.workerExecutionReady, false)

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'plan_approved',
    status: 'approved',
    approvalStatus: 'approved',
    sourceMediaAssetId: upload.mediaAssetId,
    latestSnapshotId: approvedPlan.localEditPlan.id,
    metadata: createPlanApprovedCheckpointMetadata(approvedPlan),
    getAccessToken: async () => undefined,
  })

  const preview = await runProjectSourceVideoLocalEditPreviewSmoke({
    apiBaseUrl,
    editSessionId,
    projectId: project.project.id,
    workspaceId,
    approvedLocalPlan: approvedPlan.localEditPlan.approvedLocalPlan,
    sourceVideoUploadResult: upload,
    sourceVideoAspectRatio: '16:9',
    sourceVideoDurationSeconds: fixture.durationSeconds,
    getAccessToken: async () => undefined,
  })
  assert.equal(preview.status, 'preview_ready')
  assert.deepEqual(preview.briefLineage, approvedPlan.localEditPlan.briefLineage)
  assert.equal(preview.previewOnly, true)
  assert.equal(preview.productReady, false)
  assert.ok(preview.outputObjectPath?.includes('/previews/'))
  assert.equal(preview.editAssembly?.planId, approvedPlan.localEditPlan.editPlanId)
  assert.equal(preview.editAssembly?.mode, 'clean_internal_preview')
  assert.equal(preview.editAssembly?.planStepCount, approvedPlan.localEditPlan.approvedLocalPlan.steps.length)
  assert.equal(preview.editAssembly?.professionalOperationCount, approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.operations.length)
  assert.deepEqual(preview.editAssembly?.outputFrame, approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.outputFrame)
  assert.ok(preview.editAssembly?.professionalOperationLabels?.includes('Readable captions'))
  assert.ok(preview.editAssembly?.requiredQaChecks?.includes('caption_readability'))
  assert.ok(preview.editAssembly?.operationsApplied.includes('confirmed_output_frame:9:16:540x960'))
  assert.ok(preview.editAssembly?.operationsApplied.includes('light_color_balance_applied'))
  assert.ok(preview.editAssembly?.operationsApplied.includes('clean_fade_handles_applied'))
  const previewReviewBytes = await assertPrivateReviewArtifact({
    apiBaseUrl,
    label: 'Preview',
    storageObjectRecordId: preview.previewStorageObjectId,
    workspaceId,
  })
  await assertPrivateArtifactFrame({
    bucketName: preview.outputBucketName,
    height: 960,
    label: 'Preview',
    objectPath: preview.outputObjectPath,
    width: 540,
  })

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'preview_ready',
    status: 'preview_ready',
    approvalStatus: 'approved',
    latestSnapshotId: preview.approvedPlanSnapshotId,
    latestPreviewId: preview.renderId,
    latestPreviewUrl: preview.outputObjectPath ? `${preview.outputBucketName ?? 'preview'}/${preview.outputObjectPath}` : undefined,
    metadata: createPreviewReadyCheckpointMetadata(preview),
    getAccessToken: async () => undefined,
  })

  const review = await createProjectSourceVideoPreviewReview({
    apiBaseUrl,
    notes: 'Preview is acceptable for internal smoke coverage.',
    previewResult: preview,
    reviewStatus: 'approved',
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(review.reviewStatus, 'approved')
  assert.equal(review.productReady, false)

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'preview_reviewed',
    status: 'preview_ready',
    approvalStatus: 'approved',
    latestPreviewId: review.renderId,
    metadata: createPreviewReviewedCheckpointMetadata(review),
    getAccessToken: async () => undefined,
  })

  const professionalQA = createProjectSourceVideoProfessionalQA({
    previewResult: preview,
    previewReviewResult: review,
    sourceVideoUploadResult: upload,
    workspaceId,
  })
  assert.equal(professionalQA.status, 'passed')
  assert.equal(professionalQA.sourceStorageObjectRecordId, preview.sourceStorageObjectRecordId)
  assert.deepEqual(professionalQA.briefLineage, preview.briefLineage)
  assert.equal(professionalQA.productReady, false)
  assert.deepEqual(professionalQA.blockers, [])

  const mismatchedSourceUpload = {
    ...upload,
    storageObjectRecordId: `${upload.storageObjectRecordId}-mismatch`,
  }
  const mismatchedQA = createProjectSourceVideoProfessionalQA({
    previewResult: preview,
    previewReviewResult: review,
    sourceVideoUploadResult: mismatchedSourceUpload,
    workspaceId,
  })
  assert.equal(mismatchedQA.status, 'blocked')
  assert.ok(mismatchedQA.blockers.includes('source_preview_match'))
  await assert.rejects(
    () => runProjectSourceVideoLocalFinalExportSmoke({
      apiBaseUrl,
      editPlanId: approvedPlan.localEditPlan.editPlanId,
      projectId: project.project.id,
      workspaceId,
      previewResult: preview,
      previewReviewResult: review,
      professionalQAResult: professionalQA,
      sourceVideoUploadResult: mismatchedSourceUpload,
      getAccessToken: async () => undefined,
    }),
    /same source object/,
  )

  const stalePreviewReview = {
    ...review,
    id: 'preview-review-stale-render',
    renderId: `${review.renderId}-stale`,
  }
  const staleReviewQA = createProjectSourceVideoProfessionalQA({
    previewResult: preview,
    previewReviewResult: stalePreviewReview,
    sourceVideoUploadResult: upload,
    workspaceId,
  })
  assert.equal(staleReviewQA.status, 'blocked')
  assert.ok(staleReviewQA.blockers.includes('preview_review_approved'))
  await assert.rejects(
    () => runProjectSourceVideoLocalFinalExportSmoke({
      apiBaseUrl,
      editPlanId: approvedPlan.localEditPlan.editPlanId,
      projectId: project.project.id,
      workspaceId,
      previewResult: preview,
      previewReviewResult: stalePreviewReview,
      professionalQAResult: professionalQA,
      sourceVideoUploadResult: upload,
      getAccessToken: async () => undefined,
    }),
    /current preview render/,
  )

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'professional_qa_checked',
    status: 'preview_ready',
    approvalStatus: 'approved',
    latestSnapshotId: professionalQA.approvedPlanSnapshotId,
    latestPreviewId: professionalQA.renderId,
    metadata: createProfessionalQACheckpointMetadata(professionalQA),
    getAccessToken: async () => undefined,
  })
  const qaSession = await readProjectEditSessionBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  const restoredProfessionalQA = restoreProfessionalQAResult(qaSession.editSession)
  assert.equal(restoredProfessionalQA?.status, 'passed')
  assert.equal(restoredProfessionalQA?.previewReviewId, review.id)
  assert.equal(restoredProfessionalQA?.sourceStorageObjectRecordId, upload.storageObjectRecordId)
  assert.equal(restoredProfessionalQA?.productReady, false)

  const finalExport = await runProjectSourceVideoLocalFinalExportSmoke({
    apiBaseUrl,
    editPlanId: approvedPlan.localEditPlan.editPlanId,
    projectId: project.project.id,
    workspaceId,
    previewResult: preview,
    previewReviewResult: review,
    professionalQAResult: professionalQA,
    sourceVideoUploadResult: upload,
    getAccessToken: async () => undefined,
  })
  assert.equal(finalExport.status, 'final_export_ready')
  assert.equal(finalExport.finalExportStarted, true)
  assert.equal(finalExport.publicDeliveryEnabled, false)
  assert.equal(finalExport.productReady, false)
  assert.ok(finalExport.outputObjectPath?.includes('/exports/'))
  assert.equal(finalExport.editAssembly?.planId, approvedPlan.localEditPlan.editPlanId)
  assert.equal(finalExport.editAssembly?.mode, 'private_final_export')
  assert.deepEqual(finalExport.briefLineage, preview.briefLineage)
  assert.equal(finalExport.editAssembly?.professionalOperationCount, approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.operations.length)
  assert.deepEqual(finalExport.editAssembly?.outputFrame, approvedPlan.localEditPlan.approvedLocalPlan.operationManifest.outputFrame)
  assert.ok(finalExport.editAssembly?.requiredQaChecks?.includes('approved_snapshot_used'))
  assert.ok(finalExport.editAssembly?.operationsApplied.includes('confirmed_output_frame:9:16:540x960'))
  assert.ok(finalExport.editAssembly?.operationsApplied.includes('light_color_balance_applied'))
  assert.ok(finalExport.editAssembly?.operationsApplied.includes('approved_preview_review_carried_forward'))
  assert.equal(finalExport.professionalQA?.status, 'passed')
  const finalExportReviewBytes = await assertPrivateReviewArtifact({
    apiBaseUrl,
    label: 'Final export',
    storageObjectRecordId: finalExport.finalExportStorageObjectId,
    workspaceId,
  })
  await assertPrivateArtifactFrame({
    bucketName: finalExport.outputBucketName,
    height: 960,
    label: 'Final export',
    objectPath: finalExport.outputObjectPath,
    width: 540,
  })

  await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'final_export_ready',
    status: 'final_export_ready',
    approvalStatus: 'approved',
    sourceMediaAssetId: upload.mediaAssetId,
    latestSnapshotId: finalExport.approvedPlanSnapshotId,
    latestPreviewId: finalExport.renderId,
    latestPreviewUrl: finalExport.outputObjectPath ? `${finalExport.outputBucketName ?? 'export'}/${finalExport.outputObjectPath}` : undefined,
    metadata: createFinalExportReadyCheckpointMetadata(finalExport),
    getAccessToken: async () => undefined,
  })

  const finalSession = await readProjectEditSessionBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(finalSession.editSession.status, 'final_export_ready')
  assert.equal(finalSession.editSession.approvalStatus, 'approved')
  assert.equal(finalSession.editSession.previewCount, 1)
  assert.equal(finalSession.editSession.productReady, false)
  assert.ok(finalSession.editSession.metadata?.backendLocalSourceUpload)
  assert.ok(finalSession.editSession.metadata?.backendLocalBrief)
  assert.ok(finalSession.editSession.metadata?.backendLocalPlan)
  assert.ok(finalSession.editSession.metadata?.backendLocalPreview)
  assert.ok(finalSession.editSession.metadata?.backendLocalPreviewReview)
  assert.ok(finalSession.editSession.metadata?.backendLocalFinalExport)

  const listed = await listProjectEditSessionsBackendLocal({
    apiBaseUrl,
    projectId: project.project.id,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(listed.editSessions.some((session) => session.id === editSessionId && session.status === 'final_export_ready'), true)

  const restoredUpload = restoreBackendUploadResult(finalSession.editSession)
  const restoredPreview = restorePreviewResult(finalSession.editSession)
  const restoredReview = restorePreviewReviewResult(finalSession.editSession)
  const restoredStandaloneQA = restoreProfessionalQAResult(finalSession.editSession)
  const restoredFinalExport = restoreFinalExportResult(finalSession.editSession)
  assert.equal(restoredUpload?.storageObjectRecordId, upload.storageObjectRecordId)
  assert.equal(restoredPreview?.status, 'preview_ready')
  assert.equal(restoredReview?.reviewStatus, 'approved')
  assert.equal(restoredStandaloneQA?.status, 'passed')
  assert.equal(restoredFinalExport?.status, 'final_export_ready')
  assert.equal(restoredPreview?.editAssembly?.planId, approvedPlan.localEditPlan.editPlanId)
  assert.equal(restoredFinalExport?.editAssembly?.mode, 'private_final_export')

  const homeCard = createProjectEditSessionHomeCardViewModelFromRecord(finalSession.editSession)
  const homeDetail = createProjectEditSessionHomeDetailViewModelFromRecord(finalSession.editSession)
  assert.equal(homeCard.progressLabel, 'Private export ready')
  assert.equal(homeCard.latestPreviewLabel, 'Private export ready')
  assert.equal(homeCard.progressItems.every((item) => item.complete), true)
  assert.equal(homeDetail?.readinessLabel, 'Private export ready')
  assert.equal(homeDetail?.progressItems.every((item) => item.complete), true)
  assert.match(homeDetail?.artifactSummaryLines.join('\n') ?? '', /Private final export is ready/)

  const restoredBrief = await readProjectEditBriefBackendLocal({
    apiBaseUrl,
    editSessionId,
    projectId: project.project.id,
    workspaceId,
    getAccessToken: async () => undefined,
  })

  const briefDraftChangedCheckpoint = await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'brief_draft_changed',
    status: 'setup_ready',
    approvalStatus: 'not_requested',
    sourceMediaAssetId: upload.mediaAssetId,
    metadata: createBriefDraftChangedCheckpointMetadata({
      previousBrief: restoredBrief.editBrief,
      sourceVideoUploadResult: upload,
    }),
    getAccessToken: async () => undefined,
  })
  assert.equal(briefDraftChangedCheckpoint.editSession.status, 'setup_ready')
  assert.equal(briefDraftChangedCheckpoint.editSession.approvalStatus, 'not_requested')
  assert.deepEqual(briefDraftChangedCheckpoint.editSession.sourceMediaAssetIds, [upload.mediaAssetId])
  assert.equal(briefDraftChangedCheckpoint.editSession.previewCount, 0)
  assert.equal(briefDraftChangedCheckpoint.editSession.versionCount, 0)
  assert.equal(briefDraftChangedCheckpoint.editSession.latestPreviewId, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.latestPreviewUrl, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.latestSnapshotId, undefined)
  assert.ok(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalSourceUpload)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalBrief, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalPlan, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalPreview, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalPreviewReview, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalProfessionalQA, undefined)
  assert.equal(briefDraftChangedCheckpoint.editSession.metadata?.backendLocalFinalExport, undefined)
  assert.equal(restoreBackendUploadResult(briefDraftChangedCheckpoint.editSession)?.storageObjectRecordId, upload.storageObjectRecordId)
  assert.equal(restorePreviewResult(briefDraftChangedCheckpoint.editSession), undefined)
  assert.equal(restorePreviewReviewResult(briefDraftChangedCheckpoint.editSession), undefined)
  assert.equal(restoreProfessionalQAResult(briefDraftChangedCheckpoint.editSession), undefined)
  assert.equal(restoreFinalExportResult(briefDraftChangedCheckpoint.editSession), undefined)
  const draftChangedHomeCard = createProjectEditSessionHomeCardViewModelFromRecord(briefDraftChangedCheckpoint.editSession)
  const draftChangedHomeDetail = createProjectEditSessionHomeDetailViewModelFromRecord(briefDraftChangedCheckpoint.editSession)
  assert.equal(draftChangedHomeCard.progressLabel, 'Source attached')
  assert.equal(draftChangedHomeCard.latestPreviewLabel, 'No preview yet')
  assert.equal(draftChangedHomeCard.progressItems.find((item) => item.id === 'source_attached')?.complete, true)
  assert.equal(draftChangedHomeCard.progressItems.find((item) => item.id === 'brief_saved')?.complete, false)
  assert.equal(draftChangedHomeCard.progressItems.find((item) => item.id === 'private_export_ready')?.complete, false)
  assert.equal(draftChangedHomeDetail?.readinessLabel, 'Source attached')
  assert.match(draftChangedHomeDetail?.artifactSummaryLines.join('\n') ?? '', /No preview or export artifact/)

  const revisedBriefCheckpoint = await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'brief_saved',
    status: 'awaiting_approval',
    sourceMediaAssetId: upload.mediaAssetId,
    metadata: createBriefSavedCheckpointMetadata({
      brief: restoredBrief.editBrief,
      sourceVideoUploadResult: upload,
    }),
    getAccessToken: async () => undefined,
  })
  assert.equal(revisedBriefCheckpoint.editSession.status, 'awaiting_approval')
  assert.equal(revisedBriefCheckpoint.editSession.approvalStatus, 'requested')
  assert.equal(revisedBriefCheckpoint.editSession.previewCount, 0)
  assert.equal(revisedBriefCheckpoint.editSession.versionCount, 0)
  assert.equal(revisedBriefCheckpoint.editSession.latestPreviewId, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.latestPreviewUrl, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.latestSnapshotId, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.metadata?.backendLocalPlan, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.metadata?.backendLocalPreview, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.metadata?.backendLocalPreviewReview, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.metadata?.backendLocalProfessionalQA, undefined)
  assert.equal(revisedBriefCheckpoint.editSession.metadata?.backendLocalFinalExport, undefined)
  assert.equal(restorePreviewResult(revisedBriefCheckpoint.editSession), undefined)
  assert.equal(restorePreviewReviewResult(revisedBriefCheckpoint.editSession), undefined)
  assert.equal(restoreProfessionalQAResult(revisedBriefCheckpoint.editSession), undefined)
  assert.equal(restoreFinalExportResult(revisedBriefCheckpoint.editSession), undefined)
  const resetHomeCard = createProjectEditSessionHomeCardViewModelFromRecord(revisedBriefCheckpoint.editSession)
  const resetHomeDetail = createProjectEditSessionHomeDetailViewModelFromRecord(revisedBriefCheckpoint.editSession)
  assert.equal(resetHomeCard.progressLabel, 'Brief saved')
  assert.equal(resetHomeCard.latestPreviewLabel, 'No preview yet')
  assert.equal(resetHomeCard.progressItems.find((item) => item.id === 'private_export_ready')?.complete, false)
  assert.equal(resetHomeDetail?.readinessLabel, 'Brief saved')
  assert.match(resetHomeDetail?.artifactSummaryLines.join('\n') ?? '', /No preview or export artifact/)

  const setupResetCheckpoint = await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId,
    workspaceId,
    checkpointKind: 'setup_reset',
    status: 'draft',
    approvalStatus: 'not_requested',
    metadata: {
      resetReason: 'source_cleared',
      noMediaProcessingStarted: true,
      noProviderCallMade: true,
      noRenderStarted: true,
      noCreditReservedOrSpent: true,
      productReady: false,
    },
    getAccessToken: async () => undefined,
  })
  assert.equal(setupResetCheckpoint.editSession.status, 'draft')
  assert.equal(setupResetCheckpoint.editSession.approvalStatus, 'not_requested')
  assert.deepEqual(setupResetCheckpoint.editSession.sourceMediaAssetIds, [])
  assert.equal(setupResetCheckpoint.editSession.previewCount, 0)
  assert.equal(setupResetCheckpoint.editSession.versionCount, 0)
  assert.equal(setupResetCheckpoint.editSession.metadata?.backendLocalSourceUpload, undefined)
  assert.equal(setupResetCheckpoint.editSession.metadata?.backendLocalBrief, undefined)
  assert.equal(setupResetCheckpoint.editSession.metadata?.backendLocalPlan, undefined)
  assert.equal(setupResetCheckpoint.editSession.metadata?.backendLocalFinalExport, undefined)
  assert.equal(createProjectEditSessionHomeCardViewModelFromRecord(setupResetCheckpoint.editSession).progressLabel, 'Setup needed')

  const restoredPlanModel = buildProjectEditPlanApprovalModel({
    approved: true,
    backendUploadResult: restoredUpload,
    briefSaved: true,
    briefText: restoredBrief.editBrief.briefText,
    editSessionId,
    outputAspectRatio: finalSession.editSession.aspectRatio,
    outputFrameConfirmed: finalSession.editSession.metadata?.outputFrameConfirmed === true,
    outputFrameConfirmationSource: 'edit_session_metadata',
    outputPlatformTarget: finalSession.editSession.platformTarget,
    projectId: project.project.id,
    sourceAspectRatio: '16:9',
    sourceDurationSeconds: fixture.durationSeconds,
    sourceFileName: sourceFile.name,
  })
  const restoredPlan = restoredUpload
    ? createRestoredApprovedLocalPlan({
        approvedPlan: restoredPlanModel,
        sourceVideoUploadResult: restoredUpload,
        session: finalSession.editSession,
      })
    : undefined
  assert.equal(restoredPlan?.localEditPlan.readbackVerified, true)

  const lifecycle = buildProjectEditLifecycleModel({
    backendUploadAvailable: true,
    backendUploadResult: restoredUpload,
    backendUploadStatus: restoredUpload ? 'uploaded' : 'failed',
    briefSaved: restoredBrief.editBrief.readbackVerified === true,
    editSessionId,
    hasLocalSourceVideo: Boolean(restoredUpload),
    localFinalExportResult: restoredFinalExport,
    localPreviewResult: restoredPreview,
    planApproved: Boolean(restoredPlan?.localEditPlan.readbackVerified),
    planReady: true,
    previewReviewResult: restoredReview,
    projectId: project.project.id,
    finalExportEvidence: {
      professionalQaPassed: restoredFinalExport?.professionalQA?.status === 'passed',
      requiredAssetsReady: restoredFinalExport?.professionalQA?.status === 'passed',
      artifactManifestReady: Boolean(restoredFinalExport),
      finalRenderWorkerReady: Boolean(restoredFinalExport),
      exportDeliveryPolicyReady: Boolean(restoredFinalExport),
    },
  })
  assert.equal(lifecycle.stages.find((stage) => stage.id === 'preview_review_required')?.status, 'complete')
  assert.equal(lifecycle.finalExportAllowed, true)
  assert.equal(lifecycle.productReady, false)
  assert.equal(lifecycle.toolExecutionAllowed, true)
  assert.equal(lifecycle.finalExportReadiness.allowed, true)
  assert.deepEqual(lifecycle.finalExportReadiness.blockers, [])

  console.log(JSON.stringify({
    ok: true,
    smoke: 'project-edit-backend-local-e2e',
    projectId: project.project.id,
    editSessionId,
    uploadVerified: upload.status === 'uploaded',
    briefReadbackVerified: restoredBrief.editBrief.readbackVerified === true,
    planReadbackVerified: approvedPlan.localEditPlan.readbackVerified === true,
    previewStatus: preview.status,
    previewAssemblyMode: preview.editAssembly?.mode,
    reviewStatus: review.reviewStatus,
    professionalQAStatus: professionalQA.status,
    finalExportStatus: finalExport.status,
    finalExportAssemblyMode: finalExport.editAssembly?.mode,
    previewReviewBytes,
    finalExportReviewBytes,
    restoredLifecycleStatus: finalSession.editSession.status,
    finalExportAllowed: lifecycle.finalExportAllowed,
    finalExportBlockers: lifecycle.finalExportReadiness.blockers,
    productReady: lifecycle.productReady,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
