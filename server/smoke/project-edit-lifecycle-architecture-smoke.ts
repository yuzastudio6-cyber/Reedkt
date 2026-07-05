import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildProjectEditPlanApprovalModel } from '../../src/lib/project-edit-plan-approval'
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
  'src/lib/project-edit-plan-approval.ts',
  'src/components/projects/ProjectEditLifecycleStatusCard.tsx',
  'src/components/projects/ProjectEditPlanApprovalCard.tsx',
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
  planApproved: false,
  planReady: false,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(initial.productReady, false)
assert.equal(initial.toolExecutionAllowed, false)
assert.equal(initial.finalExportAllowed, false)
assert.ok(initial.blockers.includes('source_video_required'))
assert.ok(initial.blockers.includes('approved_plan_snapshot_required'))
assert.ok(initial.blockers.includes('edit_plan_required'))
assert.ok(initial.blockers.includes('plan_credit_approval_required'))
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

const planBeforeBrief = buildProjectEditPlanApprovalModel({
  approved: false,
  backendUploadResult: uploaded,
  briefSaved: false,
  briefText: '',
  editSessionId: 'edit-session-youtube-wide',
  projectId: 'mock-project-edit-chat-foundation',
  sourceDurationSeconds: 76,
  sourceFileName: 'source.mp4',
})
assert.equal(planBeforeBrief.canApprove, false)
assert.ok(planBeforeBrief.blockers.includes('brief_save_required'))
assert.equal(planBeforeBrief.productReady, false)
assert.equal(planBeforeBrief.providerCallMade, false)
assert.equal(planBeforeBrief.creditReservedOrSpent, false)

const readyPlan = buildProjectEditPlanApprovalModel({
  approved: false,
  backendUploadResult: uploaded,
  briefSaved: true,
  briefText: 'Clean pacing and readable captions.',
  editSessionId: 'edit-session-youtube-wide',
  projectId: 'mock-project-edit-chat-foundation',
  sourceAspectRatio: '16:9',
  sourceDurationSeconds: 76,
  sourceFileName: 'source.mp4',
})
assert.equal(readyPlan.canApprove, true)
assert.equal(readyPlan.approved, false)
assert.equal(readyPlan.status, 'ready_for_approval')
assert.ok(readyPlan.blockers.includes('plan_credit_approval_required'))
assert.ok(readyPlan.creditEstimate.lowCredits <= readyPlan.creditEstimate.expectedCredits)
assert.ok(readyPlan.creditEstimate.expectedCredits <= readyPlan.creditEstimate.highCredits)
assert.equal(readyPlan.creditEstimate.serviceFeeIncluded, false)

const uploadedModel = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-youtube-wide',
  hasLocalSourceVideo: true,
  planApproved: false,
  planReady: true,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(uploadedModel.backendUploadAllowed, true)
assert.equal(uploadedModel.internalPreviewAllowed, false)
assert.equal(uploadedModel.toolExecutionAllowed, false)
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'backend_upload_completed')?.status, 'complete')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'brief_saved')?.status, 'complete')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'edit_plan_required')?.status, 'complete')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'credit_approval_required')?.status, 'ready')
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'internal_preview_ready')?.status, 'blocked')
assert.ok(uploadedModel.blockers.includes('plan_credit_approval_required'))
assert.equal(uploadedModel.stages.find((stage) => stage.id === 'final_export_blocked')?.status, 'blocked')
assert.ok(uploadedModel.blockers.includes('professional_qa_and_final_export_required'))

const approvedPlan = buildProjectEditPlanApprovalModel({
  approved: true,
  backendUploadResult: uploaded,
  briefSaved: true,
  briefText: 'Clean pacing and readable captions.',
  editSessionId: 'edit-session-youtube-wide',
  projectId: 'mock-project-edit-chat-foundation',
  sourceAspectRatio: '16:9',
  sourceDurationSeconds: 76,
  sourceFileName: 'source.mp4',
})
assert.equal(approvedPlan.approved, true)
assert.equal(approvedPlan.status, 'approved')
assert.equal(approvedPlan.blockers.includes('plan_credit_approval_required'), false)

const approvedModel = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-youtube-wide',
  hasLocalSourceVideo: true,
  planApproved: true,
  planReady: true,
  projectId: 'mock-project-edit-chat-foundation',
})
assert.equal(approvedModel.internalPreviewAllowed, true)
assert.equal(approvedModel.stages.find((stage) => stage.id === 'credit_approval_required')?.status, 'complete')
assert.equal(approvedModel.stages.find((stage) => stage.id === 'approved_snapshot_required')?.status, 'ready')

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
  planApproved: true,
  planReady: true,
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
  'ProjectEditPlanApprovalCard',
  'ProjectEditBriefLocalPreviewSmokeCard',
  'ProjectEditLifecycleStatusCard',
  'buildProjectEditPlanApprovalModel',
  'buildProjectEditLifecycleModel',
  'createProjectSourceVideoBackendUploadConfig',
  'createProjectSourceVideoLocalEditPreviewConfig',
]) {
  assert.match(workspace, new RegExp(phrase))
}
assert.doesNotMatch(workspace, /service_role|signedUrl|gcloud|supabase db|Stripe|production ready:\s*true/i)

const previewCard = read('src/components/projects/brief/ProjectEditBriefLocalPreviewSmokeCard.tsx')
assert.match(previewCard, /planApproved/)
assert.match(previewCard, /Approve plan first/)
assert.match(previewCard, /onPreviewReady/)
assert.doesNotMatch(previewCard, /product-ready/i)

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
