import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildProjectEditLifecycleModel } from '../../src/lib/project-edit-lifecycle'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewResult,
} from '../../src/types/project-source-video'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'src/lib/project-edit-lifecycle.ts',
  'src/components/projects/ProjectEditLifecycleStatusCard.tsx',
  'src/components/projects/brief/ProjectEditBriefWorkspace.tsx',
  'src/components/projects/brief/ProjectEditBriefSourceVideoPicker.tsx',
  'src/components/projects/brief/ProjectEditBriefLocalPreviewSmokeCard.tsx',
  'src/lib/project-source-video-backend-upload.ts',
  'src/lib/project-source-video-local-edit-preview-smoke.ts',
  'server/smoke/project-edit-lifecycle-architecture-smoke.ts',
]

requiredFiles.forEach(assertFile)

const initial = buildProjectEditLifecycleModel({
  backendUploadAvailable: false,
  backendUploadStatus: 'unavailable',
  briefSaved: false,
  editSessionId: 'edit-session-youtube-wide',
  hasLocalSourceVideo: false,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(initial.productReady, false)
assert.equal(initial.toolExecutionAllowed, false)
assert.equal(initial.finalExportAllowed, false)
assert.ok(initial.blockers.includes('source_video_required'))
assert.ok(initial.blockers.includes('approved_plan_snapshot_required'))
assert.equal(initial.stages.find((stage) => stage.id === 'source_video_selected')?.status, 'ready')
assert.equal(initial.stages.find((stage) => stage.id === 'backend_upload_configured')?.status, 'blocked')

const uploaded: ProjectSourceVideoBackendUploadResult = {
  status: 'uploaded',
  uploadIntentId: 'upload-intent-1',
  storageObjectRecordId: 'storage-object-1',
  mediaAssetId: 'media-asset-1',
  bucketName: 'source-media',
  objectPath: 'workspaces/mock-workspace/projects/mock-project/source-media/source.mp4',
  fileName: 'source.mp4',
  mimeType: 'video/mp4',
  sizeBytes: 1024,
  uploadedAt: '2026-07-05T00:00:00.000Z',
  backendLocalUploadMade: true,
  browserFileBytesSent: true,
  fileBytesReadByBackend: true,
  storageWriteMade: true,
  supabaseWriteMade: false,
  gcsWriteMade: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  providerCallMade: false,
  renderJobCreated: false,
  exportJobCreated: false,
  creditReservedOrSpent: false,
  productReady: false,
  warnings: [],
}

const uploadedModel = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-youtube-wide',
  hasLocalSourceVideo: true,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(uploadedModel.backendUploadAllowed, true)
assert.equal(uploadedModel.internalPreviewAllowed, true)
assert.equal(uploadedModel.toolExecutionAllowed, false)
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'backend_upload_completed')?.status, 'complete')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'brief_saved')?.status, 'complete')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'edit_plan_required')?.status, 'blocked')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'credit_approval_required')?.status, 'blocked')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'final_export_blocked')?.status, 'blocked')
assert.ok(uploadedModel.blockers.includes('professional_qa_and_final_export_required'))

const preview: ProjectSourceVideoLocalEditPreviewResult = {
  status: 'preview_ready',
  approvedPlanSnapshotId: 'approved-snapshot-1',
  creditApprovalId: 'credit-approval-1',
  creditReservationId: 'credit-reservation-1',
  renderJobId: 'render-job-1',
  sourceStorageObjectRecordId: uploaded.storageObjectRecordId,
  qwenMainBrainLabel: 'Qwen 3.7 Max',
  approvedSnapshotCreated: true,
  mockCreditApprovalCreated: true,
  mockCreditReservationCreated: true,
  workerJobCreated: true,
  mediaProcessingStarted: true,
  renderJobCreated: true,
  previewOnly: true,
  providerCallMade: false,
  qwenCallMade: false,
  exportJobCreated: false,
  supabaseWriteMade: false,
  gcsWriteMade: false,
  productReady: false,
  warnings: [],
}

const previewModel = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-youtube-wide',
  hasLocalSourceVideo: true,
  localPreviewResult: preview,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(previewModel.stages.find((stage) => stage.id === 'internal_preview_ready')?.status, 'complete')
assert.equal(previewModel.productReady, false)
assert.equal(previewModel.toolExecutionAllowed, false)
assert.equal(previewModel.finalExportAllowed, false)

const workspace = read('src/components/projects/brief/ProjectEditBriefWorkspace.tsx')
for (const phrase of [
  'ProjectEditBriefSourceVideoPicker',
  'uploadProjectSourceVideoToBackend',
  'ProjectEditBriefLocalPreviewSmokeCard',
  'ProjectEditLifecycleStatusCard',
  'buildProjectEditLifecycleModel',
  'createProjectSourceVideoBackendUploadConfig',
  'createProjectSourceVideoLocalEditPreviewConfig',
]) {
  assert.match(workspace, new RegExp(phrase))
}
assert.doesNotMatch(workspace, /service_role|signedUrl|gcloud|supabase db|Stripe|production ready:\s*true/i)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:project-edit-lifecycle-architecture'],
  'tsx server/smoke/project-edit-lifecycle-architecture-smoke.ts',
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'project-edit-lifecycle-architecture',
  stages: previewModel.stages.length,
  backendUploadAllowed: uploadedModel.backendUploadAllowed,
  internalPreviewAllowed: uploadedModel.internalPreviewAllowed,
  productReady: previewModel.productReady,
  finalExportAllowed: previewModel.finalExportAllowed,
}, null, 2))
