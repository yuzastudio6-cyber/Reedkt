import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
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
  createBriefSavedCheckpointMetadata,
  createFinalExportReadyCheckpointMetadata,
  createPlanApprovedCheckpointMetadata,
  createPreviewReadyCheckpointMetadata,
  createPreviewReviewedCheckpointMetadata,
  createRestoredApprovedLocalPlan,
  createSourceUploadCheckpointMetadata,
  restoreBackendUploadResult,
  restoreFinalExportResult,
  restorePreviewResult,
  restorePreviewReviewResult,
} from '../../src/lib/project-edit-session-lifecycle-checkpoint-ui-adapter'
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
    aspectRatio: '16:9' as const,
    name: 'Backend-local E2E smoke edit',
    platformTarget: 'youtube_standard' as const,
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
    projectId: project.project.id,
    sourceAspectRatio: '16:9',
    sourceDurationSeconds: fixture.durationSeconds,
    sourceFileName: sourceFile.name,
  })
  assert.equal(plan.canApprove, true)
  assert.equal(plan.approved, true)

  const approvedPlan = await approveProjectEditPlanBackendLocal({
    apiBaseUrl,
    approvedLocalPlan: plan,
    editSessionId,
    projectId: project.project.id,
    sourceVideoUploadResult: upload,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  assert.equal(approvedPlan.localEditPlan.readbackVerified, true)
  assert.equal(approvedPlan.localEditPlan.productReady, false)

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
  assert.equal(preview.previewOnly, true)
  assert.equal(preview.productReady, false)
  assert.ok(preview.outputObjectPath?.includes('/previews/'))
  assert.equal(preview.editAssembly?.planId, approvedPlan.localEditPlan.editPlanId)
  assert.equal(preview.editAssembly?.mode, 'clean_internal_preview')
  assert.equal(preview.editAssembly?.planStepCount, approvedPlan.localEditPlan.approvedLocalPlan.steps.length)
  assert.ok(preview.editAssembly?.operationsApplied.includes('clean_fade_handles_applied'))

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
  assert.equal(professionalQA.productReady, false)
  assert.deepEqual(professionalQA.blockers, [])

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
  assert.ok(finalExport.editAssembly?.operationsApplied.includes('approved_preview_review_carried_forward'))
  assert.equal(finalExport.professionalQA?.status, 'passed')

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
  const restoredFinalExport = restoreFinalExportResult(finalSession.editSession)
  assert.equal(restoredUpload?.storageObjectRecordId, upload.storageObjectRecordId)
  assert.equal(restoredPreview?.status, 'preview_ready')
  assert.equal(restoredReview?.reviewStatus, 'approved')
  assert.equal(restoredFinalExport?.status, 'final_export_ready')
  assert.equal(restoredPreview?.editAssembly?.planId, approvedPlan.localEditPlan.editPlanId)
  assert.equal(restoredFinalExport?.editAssembly?.mode, 'private_final_export')

  const restoredBrief = await readProjectEditBriefBackendLocal({
    apiBaseUrl,
    editSessionId,
    projectId: project.project.id,
    workspaceId,
    getAccessToken: async () => undefined,
  })
  const restoredPlanModel = buildProjectEditPlanApprovalModel({
    approved: true,
    backendUploadResult: restoredUpload,
    briefSaved: true,
    briefText: restoredBrief.editBrief.briefText,
    editSessionId,
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
    hasLocalSourceVideo: true,
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
    restoredLifecycleStatus: finalSession.editSession.status,
    finalExportAllowed: lifecycle.finalExportAllowed,
    finalExportBlockers: lifecycle.finalExportReadiness.blockers,
    productReady: lifecycle.productReady,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
