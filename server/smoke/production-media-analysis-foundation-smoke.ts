import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  assertNoPathTraversal,
  buildMediaAnalysisReport,
  buildMediaArtifactRecord,
  buildStorageArtifactReference,
  createMediaFoundationFixture,
  probeMediaFile,
  resolvePathInsideRoot,
  runMediaAnalysisFoundation,
} from '../workers/media'
import type { MediaProbeResult } from '../workers/media'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

async function expectRejects(fn: () => Promise<unknown> | unknown, message: string): Promise<void> {
  let rejected = false
  try {
    await fn()
  } catch {
    rejected = true
  }
  check(rejected, message)
}

await expectRejects(
  () => probeMediaFile({
    localFilePath: path.join(os.tmpdir(), 'reeditpro-missing-media-foundation-file.mp4'),
    ffprobeBin: 'ffprobe',
    timeoutMs: 500,
  }),
  'FFprobe adapter must reject missing files before command execution.',
)

await expectRejects(
  () => resolvePathInsideRoot(os.tmpdir(), '../escape.mp4'),
  'Path safety must reject traversal outside the safe root.',
)
assertNoPathTraversal('workspaces/workspace-a/projects/project-a/source.mp4', 'safe path')

await expectRejects(
  () => buildStorageArtifactReference({
    storageBucketPurpose: 'source_media',
    storageObjectPath: 'https://storage.googleapis.com/bucket/object?X-Goog-Signature=abc',
  }),
  'Storage resolver must reject signed URL-like storage refs.',
)

const artifact = buildMediaArtifactRecord({
  workspaceId: 'workspace-media-smoke',
  projectId: 'project-media-smoke',
  mediaAssetId: 'media-media-smoke',
  artifactType: 'proxy_video',
  storageBucketPurpose: 'proxy_media',
  storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/media/media-media-smoke/proxy/proxy.mp4',
  contentType: 'video/mp4',
})
check(artifact.isPrivate, 'Media artifact records must be private by default.')
check(artifact.sourceOfTruth, 'Media artifact records must be source-of-truth storage refs by default.')
check(!artifact.storageObjectPath.includes('http'), 'Media artifact records must not store signed URLs.')

const mockProbe: MediaProbeResult = {
  durationSeconds: 1,
  width: 160,
  height: 90,
  fps: 10,
  codecName: 'h264',
  formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
  rotation: 0,
  aspectRatio: '16:9',
  sizeBytes: 1024,
  streamCount: 2,
  rawProbeSummary: { tool: 'ffprobe', summaryOnly: true },
  videoStreams: [{
    streamIndex: 0,
    codecName: 'h264',
    width: 160,
    height: 90,
    fps: 10,
    durationSeconds: 1,
  }],
  audioStreams: [{
    streamIndex: 1,
    codecName: 'aac',
    sampleRate: 48000,
    channels: 2,
    durationSeconds: 1,
  }],
}

const mockReport = buildMediaAnalysisReport({
  workspaceId: 'workspace-media-smoke',
  projectId: 'project-media-smoke',
  mediaAssetId: 'media-media-smoke',
  sourceStorageObjectId: 'source-storage-object-smoke',
  probe: mockProbe,
  proxy: {
    status: 'created',
    artifact: {
      artifactId: 'proxy-artifact-smoke',
      artifactType: 'proxy_video',
      storageBucketPurpose: 'proxy_media',
      storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/media/media-media-smoke/proxy/proxy.mp4',
      contentType: 'video/mp4',
      sourceOfTruth: true,
      isPrivate: true,
    },
  },
  audio: {
    status: 'created',
    artifact: {
      artifactId: 'audio-artifact-smoke',
      artifactType: 'extracted_audio',
      storageBucketPurpose: 'analysis_artifacts',
      storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/media/media-media-smoke/audio/audio.wav',
      contentType: 'audio/wav',
      sourceOfTruth: true,
      isPrivate: true,
    },
  },
  representativeFrames: {
    status: 'created',
    artifacts: [{
      artifactId: 'representative-frame-smoke',
      artifactType: 'representative_frame',
      storageBucketPurpose: 'analysis_artifacts',
      storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/media/media-media-smoke/representative/frame.jpg',
      contentType: 'image/jpeg',
      timeSeconds: 0,
      frameNumber: 1,
      sourceOfTruth: true,
      isPrivate: true,
    }],
  },
})
check(mockReport.status === 'partial', 'MediaAnalysisReport builder must create partial reports in Milestone 6.')
check(mockReport.speechAnalysis.speechDetected === false, 'Milestone 6 must not claim transcript/speech analysis.')
check(mockReport.colorAnalysis.issues.some((issue) => issue.code === 'color_analysis_not_run'), 'Milestone 6 report must mark color analysis as not run.')

const sourceRef = buildStorageArtifactReference({
  sourceStorageObjectId: 'source-storage-object-smoke',
  storageBucketPurpose: 'source_media',
  storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/source/source.mp4',
  contentType: 'video/mp4',
})

const dryRun = await runMediaAnalysisFoundation({
  mode: 'dry_run',
  workspaceId: 'workspace-media-smoke',
  projectId: 'project-media-smoke',
  mediaAssetId: 'media-media-smoke',
  sourceStorageObjectId: 'source-storage-object-smoke',
  source: sourceRef,
})
check(dryRun.status === 'dry_run', 'Dry-run media foundation must not require FFmpeg/FFprobe.')
check(dryRun.expectedActions.includes('probe'), 'Dry-run media foundation must report expected probe action.')

const productionBlocked = await runMediaAnalysisFoundation({
  mode: 'production_blocked',
  workspaceId: 'workspace-media-smoke',
  projectId: 'project-media-smoke',
  mediaAssetId: 'media-media-smoke',
  sourceStorageObjectId: 'source-storage-object-smoke',
  source: sourceRef,
})
check(productionBlocked.status === 'blocked', 'Production-blocked mode must refuse real media execution.')

const invalidPayload = buildPayload({
  metadata: { mediaFoundation: { mode: 'dry_run' }, rawPrompt: 'never execute raw chat' },
})
await expectRejects(
  () => runMediaAnalysisFoundation({
    mode: 'dry_run',
    workspaceId: invalidPayload.workspaceId,
    projectId: invalidPayload.projectId,
    mediaAssetId: invalidPayload.mediaAssetId ?? 'media-media-smoke',
    sourceStorageObjectId: 'source-storage-object-smoke',
    source: sourceRef,
    workerPayload: invalidPayload,
  }),
  'Media foundation runner must reject raw prompt payload fields.',
)

const signedPayload = buildPayload({
  storageReferenceIds: ['https://storage.googleapis.com/private/object?X-Goog-Signature=abc'],
})
await expectRejects(
  () => runMediaAnalysisFoundation({
    mode: 'dry_run',
    workspaceId: signedPayload.workspaceId,
    projectId: signedPayload.projectId,
    mediaAssetId: signedPayload.mediaAssetId ?? 'media-media-smoke',
    sourceStorageObjectId: 'source-storage-object-smoke',
    source: sourceRef,
    workerPayload: signedPayload,
  }),
  'Media foundation runner must reject signed URL payload fields.',
)

const routedPayload = buildPayload({
  metadata: {
    mediaFoundation: {
      mode: 'dry_run',
      sourceStorageObjectPath: sourceRef.storageObjectPath,
      sourceStorageObjectId: 'source-storage-object-smoke',
    },
  },
})
const routedResult = await runProductionWorkerRuntime({ payload: routedPayload })
check(routedResult.status === 'completed', 'Optional CPU worker media foundation dry-run route should complete.')
check(
  routedResult.output?.futureHandler === 'cpu_analysis_worker_media_foundation',
  'CPU worker integration must remain explicit and optional.',
)

const fixtureResult = await createMediaFoundationFixture()
let fixtureMode: 'processed' | 'skipped' = 'skipped'
const fixtureSkipReason = fixtureResult.ok ? undefined : fixtureResult.skipReason.message

if (fixtureResult.ok) {
  const { fixture } = fixtureResult
  try {
    const localResult = await runMediaAnalysisFoundation({
      mode: 'local_dev',
      workspaceId: 'workspace-media-smoke',
      projectId: 'project-media-smoke',
      mediaAssetId: 'media-media-smoke',
      sourceStorageObjectId: 'source-storage-object-smoke',
      source: buildStorageArtifactReference({
        sourceStorageObjectId: 'source-storage-object-smoke',
        storageBucketPurpose: 'source_media',
        storageObjectPath: 'workspaces/workspace-media-smoke/projects/project-media-smoke/source/fixture-source.mp4',
        localFilePath: fixture.sourceVideoPath,
        contentType: 'video/mp4',
      }),
      outputRoot: path.join(fixture.tempDir, 'outputs'),
      timeoutMs: 20_000,
      tasks: ['probe', 'create_proxy', 'extract_audio', 'extract_representative_frames', 'build_analysis_report'],
      maxRepresentativeFrameCount: 3,
    })
    check(localResult.probe?.durationSeconds !== undefined, 'Local fixture should be probed when FFmpeg/FFprobe are available.')
    check(localResult.proxy?.status === 'created', 'Local fixture should create a proxy.')
    check(localResult.audio?.status === 'created', 'Local fixture should extract audio.')
    check((localResult.representativeFrames?.artifacts.length ?? 0) > 0, 'Local fixture should extract representative frames.')
    check(localResult.mediaAnalysisReport?.status === 'partial', 'Local fixture should build a partial MediaAnalysisReport.')
    check(JSON.stringify(localResult).toLowerCase().includes('revideo') === false, 'Media foundation must not use Revideo.')
    check(JSON.stringify(localResult).toLowerCase().includes('faster_whisper') === false, 'Media foundation must not use GPU AI tools.')
    fixtureMode = 'processed'
  } finally {
    await fixture.cleanup()
    check(!existsSync(fixture.tempDir), 'Media fixture temp files must be cleaned up.')
  }
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'missing_file_rejected',
    'path_traversal_rejected',
    'signed_url_storage_ref_rejected',
    'private_artifact_record_created',
    'partial_media_analysis_report_built',
    'dry_run_without_binaries',
    'production_blocked_refuses_execution',
    'raw_prompt_payload_rejected',
    'signed_url_payload_rejected',
    'optional_cpu_worker_route',
    'no_revideo_or_gpu_tools',
  ],
  fixtureMode,
  fixtureSkipReason,
}))

function buildPayload(overrides: Partial<ProductionWorkerJobPayload>): ProductionWorkerJobPayload {
  const base: ProductionWorkerJobPayload = {
    jobId: 'prod-media-foundation-job',
    workspaceId: 'workspace-media-smoke',
    projectId: 'project-media-smoke',
    mediaAssetId: 'media-media-smoke',
    approvedSnapshotId: 'approved-snapshot-media-smoke',
    editPlanId: 'edit-plan-media-smoke',
    toolExecutionPlanId: 'tool-execution-media-smoke',
    workerType: 'cpu_analysis_worker',
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds: ['ffprobe'],
    requestedRecipeIds: ['smart_cut_recipe'],
    storageReferenceIds: ['workspaces/workspace-media-smoke/projects/project-media-smoke/source/source.mp4'],
    createdAt: new Date().toISOString(),
  }
  const payload = { ...base, ...overrides, idempotencyKey: '' }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
