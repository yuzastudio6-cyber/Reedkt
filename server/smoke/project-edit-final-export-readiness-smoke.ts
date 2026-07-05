import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runFinalRenderExecutionPipeline, type FinalRenderExecutionInput } from '../workers/final-render'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../src/backend/contracts/tool-artifact-contracts'
import { createProjectEditFinalExportEvidenceFromRenderPipeline } from '../../src/lib/project-edit-final-export-readiness'
import { buildProjectEditLifecycleModel } from '../../src/lib/project-edit-lifecycle'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
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

for (const path of [
  'src/lib/project-edit-final-export-readiness.ts',
  'src/lib/project-edit-lifecycle.ts',
  'server/workers/final-render/final-render-pipeline.ts',
  'server/workers/render/render-execution-runner.ts',
  'server/smoke/project-edit-final-export-readiness-smoke.ts',
]) {
  assertFile(path)
}

const renderInput: FinalRenderExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-project-edit-final-export-readiness',
  projectId: 'project-project-edit-final-export-readiness',
  mediaAssetId: 'media-project-edit-final-export-readiness',
  approvedSnapshotId: 'approved-snapshot-project-edit-final-export-readiness',
  toolExecutionPlanId: 'tool-execution-project-edit-final-export-readiness',
  idempotencyKey: 'idempotency-project-edit-final-export-readiness',
  timelineManifestId: 'timeline-manifest-project-edit-final-export-readiness',
  renderManifestId: 'render-manifest-project-edit-final-export-readiness',
  sourceVideoArtifactIds: ['source-video-artifact-project-edit-final-export-readiness'],
  proxyVideoArtifactIds: ['proxy-video-artifact-project-edit-final-export-readiness'],
  captionArtifactIds: ['caption-artifact-project-edit-final-export-readiness'],
  audioArtifactIds: ['audio-artifact-project-edit-final-export-readiness'],
  renderEngine: 'hybrid',
  renderMode: 'final_export',
  canvas: { width: 1920, height: 1080, aspectRatio: '16:9' },
  fps: 30,
  durationSeconds: 12,
  exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p' },
}

const dryRun = await runFinalRenderExecutionPipeline(renderInput)
const dryRunEvidence = createProjectEditFinalExportEvidenceFromRenderPipeline(dryRun)
assert.equal(dryRunEvidence.status, 'dry_run_ready_final_delivery_missing')
assert.equal(dryRunEvidence.finalExportEvidence.professionalQaPassed, true)
assert.equal(dryRunEvidence.finalExportEvidence.requiredAssetsReady, true)
assert.equal(dryRunEvidence.finalExportEvidence.artifactManifestReady, true)
assert.equal(dryRunEvidence.finalExportEvidence.finalRenderWorkerReady, true)
assert.equal(dryRunEvidence.finalExportEvidence.exportDeliveryPolicyReady, false)
assert.deepEqual(dryRunEvidence.blockers, ['export_delivery_policy_required'])
assert.equal(dryRun.finalDeliveryAllowed, false)
assert.equal(Boolean(dryRun.finalExportArtifact), false)

const uploaded: ProjectSourceVideoBackendUploadResult = {
  status: 'uploaded',
  uploadIntentId: 'upload-intent-final-export-readiness',
  storageObjectRecordId: 'source-storage-object-final-export-readiness',
  mediaAssetId: renderInput.mediaAssetId,
  bucketName: 'source-media',
  objectPath: 'workspaces/workspace-project-edit-final-export-readiness/projects/project-project-edit-final-export-readiness/source/source.mp4',
  fileName: 'source.mp4',
  mimeType: 'video/mp4',
  sizeBytes: 4096,
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

const preview: ProjectSourceVideoLocalEditPreviewResult = {
  status: 'preview_ready',
  editPlanId: 'edit-plan-final-export-readiness',
  creditEstimateId: 'credit-estimate-final-export-readiness',
  approvedPlanSnapshotId: renderInput.approvedSnapshotId as string,
  creditApprovalId: 'credit-approval-final-export-readiness',
  creditReservationId: 'credit-reservation-final-export-readiness',
  renderJobId: 'render-job-final-export-readiness',
  renderId: 'render-final-export-readiness',
  sourceStorageObjectRecordId: uploaded.storageObjectRecordId,
  qwenMainBrainLabel: 'Qwen 3.7 Max',
  approvedSnapshotCreated: true,
  mockCreditApprovalCreated: true,
  mockCreditReservationCreated: true,
  localPlanApproved: true,
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

const review: ProjectSourceVideoPreviewReviewResult = {
  id: 'preview-review-final-export-readiness',
  renderId: preview.renderId as string,
  workspaceId: renderInput.workspaceId,
  reviewStatus: 'approved',
  finalExportStarted: false,
  providerCallMade: false,
  workerJobCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  supabaseWriteMade: false,
  gcsWriteMade: false,
  productReady: false,
  warnings: [],
}

const dryRunLifecycle = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-final-export-readiness',
  finalExportEvidence: dryRunEvidence.finalExportEvidence,
  hasLocalSourceVideo: true,
  localPreviewResult: preview,
  planApproved: true,
  planReady: true,
  previewReviewResult: review,
  projectId: renderInput.projectId,
})
assert.equal(dryRunLifecycle.finalExportAllowed, false)
assert.equal(dryRunLifecycle.productReady, false)
assert.deepEqual(dryRunLifecycle.finalExportReadiness.blockers, ['export_delivery_policy_ready'])

const finalExportArtifact = createFinalExportArtifact(dryRun.renderArtifacts[0])
const finalDeliveryPassingQa = dryRun.qaResults.map((gate): QualityGateResult => gate.gateType === 'final_delivery'
  ? {
      ...gate,
      status: 'passed',
      score: 0.96,
      blocking: false,
      blocksFinalExport: false,
      fallbackRequired: false,
      humanReviewRequired: false,
      issues: [],
      outputArtifactIds: [finalExportArtifact.id],
    }
  : gate)
const deliveryEvidence = createProjectEditFinalExportEvidenceFromRenderPipeline({
  ...dryRun,
  finalDeliveryAllowed: true,
  finalExportArtifact,
  renderArtifacts: [...dryRun.renderArtifacts, finalExportArtifact],
  qaResults: finalDeliveryPassingQa,
  blocksFinalExport: false,
})
assert.equal(deliveryEvidence.status, 'final_export_ready')
assert.equal(deliveryEvidence.finalExportEvidence.exportDeliveryPolicyReady, true)
assert.equal(deliveryEvidence.blockers.length, 0)

const finalLifecycle = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-final-export-readiness',
  finalExportEvidence: deliveryEvidence.finalExportEvidence,
  hasLocalSourceVideo: true,
  localPreviewResult: preview,
  planApproved: true,
  planReady: true,
  previewReviewResult: review,
  projectId: renderInput.projectId,
})
assert.equal(finalLifecycle.finalExportAllowed, true)
assert.equal(finalLifecycle.productReady, false)
assert.equal(finalLifecycle.toolExecutionAllowed, true)
assert.equal(finalLifecycle.finalExportReadiness.blockers.length, 0)

const productReadyLifecycle = buildProjectEditLifecycleModel({
  backendUploadAvailable: true,
  backendUploadResult: uploaded,
  backendUploadStatus: 'uploaded',
  briefSaved: true,
  editSessionId: 'edit-session-final-export-readiness',
  finalExportEvidence: deliveryEvidence.finalExportEvidence,
  hasLocalSourceVideo: true,
  localPreviewResult: preview,
  planApproved: true,
  planReady: true,
  previewReviewResult: review,
  productReleaseEvidence: {
    productReadyApproved: true,
  },
  projectId: renderInput.projectId,
})
assert.equal(productReadyLifecycle.finalExportAllowed, true)
assert.equal(productReadyLifecycle.productReady, true)

const adapterSource = read('src/lib/project-edit-final-export-readiness.ts')
assert.match(adapterSource, /final_delivery/)
assert.match(adapterSource, /artifactManifestReady/)
assert.match(adapterSource, /exportDeliveryPolicyReady/)
assert.doesNotMatch(adapterSource, /service_role|Stripe|production ready:\s*true/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'project-edit-final-export-readiness',
  dryRunStatus: dryRunEvidence.status,
  dryRunBlockers: dryRunEvidence.blockers,
  commandPlanCount: dryRunEvidence.commandPlanCount,
  qaGateCount: dryRunEvidence.qaGateCount,
  deliveryReadyStatus: deliveryEvidence.status,
  finalLifecycleAllowed: finalLifecycle.finalExportAllowed,
}, null, 2))

function createFinalExportArtifact(seed: ToolArtifact | undefined): ToolArtifact {
  const createdAt = seed?.createdAt ?? '2026-07-05T00:00:00.000Z'
  return {
    id: 'final-export-artifact-project-edit-final-export-readiness',
    workspaceId: renderInput.workspaceId,
    projectId: renderInput.projectId,
    mediaAssetId: renderInput.mediaAssetId,
    artifactType: 'final_export',
    storageBucketPurpose: 'final_exports',
    storageObjectPath: 'workspaces/workspace-project-edit-final-export-readiness/projects/project-project-edit-final-export-readiness/exports/final-export.mp4',
    contentType: 'video/mp4',
    createdAt,
    isPrivate: true,
    metadata: { source: 'project_edit_final_export_readiness_smoke' },
    previewAllowed: false,
    sourceOfTruth: true,
  }
}
