import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { hashSkillValue } from '../edit-skills/core'
import {
  editSkillArtifactSchemaRegistry,
} from '../edit-skills/internal-fixture-runtime'
import {
  createCanonicalCaptionBrollApprovedPlanHarness,
} from '../internal-testing/canonical-caption-broll-approved-plan-harness'
import {
  CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION,
  createCanonicalBrollPrivateApprovedExecutionService,
} from '../services/canonical-broll-private-approved-execution-service'
import {
  createCanonicalPrivateEditSkillArtifactStore,
} from '../services/canonical-private-edit-skill-artifact-store'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution'

const root = await mkdtemp(join(
  tmpdir(),
  'reeditpro-approved-broll-execution-',
))
try {
  const sourcePath = join(root, 'approved-source.mp4')
  const captionPath = join(root, 'approved-caption.png')
  const sourceProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
    '-shortest', '-threads', '1', '-y', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(sourceProcess.status, 0, sourceProcess.stderr)
  const captionProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:s=640x360,format=rgba',
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png',
    '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(captionProcess.status, 0, captionProcess.stderr)

  const [sourceBytes, captionBytes] = await Promise.all([
    readFile(sourcePath),
    readFile(captionPath),
  ])
  const scope = {
    ownerUserId: 'owner.caption-broll.approved-execution',
    workspaceId: 'workspace.caption-broll.approved-execution',
    projectId: 'project.caption-broll.approved-execution',
  }
  const planned = await createCanonicalCaptionBrollApprovedPlanHarness({
    localStorageRoot: root,
    ...scope,
    editSessionId: 'edit.caption-broll.approved-execution',
    planningRequestId: 'planning.caption-broll.approved-execution',
    assignmentId: 'assignment.caption-broll.approved-execution',
    editPlanVersion: 1,
    canonicalMasterTimingPlan: {
      schemaVersion: 'canonical-master-timing-smoke-v1',
      masterTimingPlanId: 'master.caption-broll.approved-execution',
      fps: 24,
      totalFrames: 240,
    },
    canonicalTimingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 24,
      totalFrames: 240,
    },
    timelineRange: {
      startFrameInclusive: 0,
      endFrameExclusive: 240,
      fps: 24,
    },
    authorizedRange: {
      startFrameInclusive: 120,
      endFrameExclusive: 192,
      fps: 24,
    },
    segmentIds: ['scene.caption-broll.approved-execution'],
    confirmedAspectRatio: '16:9',
    approvedAt: '2026-08-07T17:00:00.000Z',
    source: {
      sourceSequenceItemId: 'source.caption-broll.approved-execution',
      objectSha256: sha256(sourceBytes),
      byteLength: sourceBytes.byteLength,
      durationFrames: 96,
      frameRateNumerator: 24,
      frameRateDenominator: 1,
      fps: 24,
      width: 320,
      height: 180,
      sourceRange: {
        startFrameInclusive: 12,
        endFrameExclusive: 84,
        fps: 24,
      },
    },
  })
  const componentRef = planned.persistedComponent.componentRefs.bRollSkill
  const executionGate = {
    approvedPlanSnapshotId: 'snapshot.caption-broll.approved-execution',
    snapshotHash: hashSkillValue({
      assignmentHash: planned.brollAssignment.assignmentHash,
      approvalHash: planned.publicApprovedWorkGraph.approval.approvalHash,
      approvedWorkGraphHash:
        planned.publicApprovedWorkGraph.approvedWorkGraphHash,
    }),
    reservationId: 'reservation.caption-broll.approved-execution',
    reservationStatus: 'reserved' as const,
    approved: true as const,
    privateInternalExecution: true as const,
    idempotencyKey: 'caption-broll-approved-execution-v1',
    componentRef,
    snapshotComponentRef: componentRef,
    executionPackageComponentRef: componentRef,
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: root,
  })
  const createArtifactStore = () =>
    createCanonicalPrivateEditSkillArtifactStore({
      objectPort,
      schemas: editSkillArtifactSchemaRegistry,
      prefix: 'private/edit-skills/approved-broll-runtime/v1',
    })
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const runtimeCalls: Array<{
    workItemKey: string
    runtime: 'media' | 'remotion'
    toolId: string
  }> = []
  let activeWorkItemKey = 'not-dispatching'
  const tracedMediaRuntime: typeof mediaRuntime = {
    ...mediaRuntime,
    execute: (async (request: unknown) => {
      const toolId = (
        typeof request === 'object' &&
        request !== null &&
        'toolId' in request &&
        typeof request.toolId === 'string'
      ) ? request.toolId : 'unknown'
      runtimeCalls.push({
        workItemKey: activeWorkItemKey,
        runtime: 'media',
        toolId,
      })
      return mediaRuntime.execute(request)
    }) as typeof mediaRuntime.execute,
  }
  const tracedRemotionRuntime: typeof remotionRuntime = {
    ...remotionRuntime,
    execute: async (request: unknown) => {
      runtimeCalls.push({
        workItemKey: activeWorkItemKey,
        runtime: 'remotion',
        toolId: 'remotion',
      })
      return remotionRuntime.execute(request)
    },
  }
  const serviceInput = {
    localStorageRoot: root,
    componentRef,
    canonicalWorkItems: planned.canonicalWorkItems,
    executionGate,
    sourceBytes,
    captionOverlay: {
      reference: {
        artifactType: 'caption_overlay_png_v1',
        sha256: sha256(captionBytes),
        byteLength: captionBytes.byteLength,
        ...scope,
      },
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    mediaRuntime: tracedMediaRuntime,
    remotionRuntime: tracedRemotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    now: () => '2026-08-07T17:05:00.000Z',
  }
  const firstService =
    await createCanonicalBrollPrivateApprovedExecutionService({
      ...serviceInput,
      artifactStore: createArtifactStore(),
    })
  assert.equal(
    firstService.schemaVersion,
    CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION,
  )
  const expectedRuntimeCalls = new Map<string, string[]>([
    ['inspect_b_roll_candidate_with_ffprobe', ['media:ffprobe']],
    ['normalize_b_roll_candidate_with_ffmpeg', ['media:ffmpeg']],
    ['prepare_b_roll_remotion_preview_proxy_with_ffmpeg', ['media:ffmpeg']],
    ['render_b_roll_preview', ['remotion:remotion']],
  ])
  for (const item of planned.publicApprovedWorkGraph.workItems) {
    activeWorkItemKey = item.workItemKey
    const before = runtimeCalls.length
    const outcome = await firstService.executeWorkItem(item.workItemKey)
    assert.equal(outcome.workResult.status, 'succeeded')
    assert.equal(outcome.dispatchReceipt.status, 'succeeded')
    assert.deepEqual(
      runtimeCalls.slice(before).map((call) =>
        `${call.runtime}:${call.toolId}`),
      expectedRuntimeCalls.get(item.jobType) ?? [],
      `Unexpected media runtime boundary for ${item.jobType}.`,
    )
  }
  activeWorkItemKey = 'not-dispatching'
  const runtimeCountAfterAtomicExecution = runtimeCalls.length
  const first = await firstService.executeAll()
  assert.equal(runtimeCalls.length, runtimeCountAfterAtomicExecution)
  assert.deepEqual(runtimeCalls.map((call) => call.workItemKey), [
    planned.publicApprovedWorkGraph.workItems.find((item) =>
      item.jobType === 'inspect_b_roll_candidate_with_ffprobe')!.workItemKey,
    planned.publicApprovedWorkGraph.workItems.find((item) =>
      item.jobType === 'normalize_b_roll_candidate_with_ffmpeg')!.workItemKey,
    planned.publicApprovedWorkGraph.workItems.find((item) =>
      item.jobType === 'prepare_b_roll_remotion_preview_proxy_with_ffmpeg')!
      .workItemKey,
    planned.publicApprovedWorkGraph.workItems.find((item) =>
      item.jobType === 'render_b_roll_preview')!.workItemKey,
  ])
  const proxyWorkItem = planned.canonicalWorkItems.find((item) =>
    item.workItemKey.includes('prepare_b_roll_remotion_preview_proxy_with_ffmpeg'))
  const renderWorkItem = planned.canonicalWorkItems.find((item) =>
    item.workItemKey.includes('render_b_roll_preview'))
  assert.deepEqual(proxyWorkItem?.approvedToolIds, ['ffmpeg'])
  assert.deepEqual(proxyWorkItem?.executionInput.approvedToolOperationIds, [
    'tool.ffmpeg.execute_approved_media_recipe.v1',
  ])
  assert.deepEqual(renderWorkItem?.approvedToolIds, ['remotion'])
  assert.deepEqual(renderWorkItem?.executionInput.approvedToolOperationIds, [
    'tool.remotion.render_approved_composition.v1',
  ])
  assert.equal(first.workResults.length, planned.canonicalWorkItems.length)
  assert.equal(first.dispatchReceipts.length, planned.canonicalWorkItems.length)
  assert.ok(first.workResults.every((result) => result.status === 'succeeded'))
  assert.ok(first.dispatchReceipts.every((receipt) =>
    receipt.status === 'succeeded'
    && receipt.providerRequestCount === 0
    && receipt.publicArtifactCount === 0
    && receipt.productionMutationCount === 0))
  assert.equal(
    first.runtimeSnapshot.completedWorkItemKeys.length,
    planned.canonicalWorkItems.length,
  )
  assert.equal(first.runtimeSnapshot.existingReceipt?.providerRequestCount, 0)
  assert.equal(first.runtimeSnapshot.integrationQa?.status, 'passed')
  assert.ok(first.runtimeSnapshot.resultReceipt)

  const restartedService =
    await createCanonicalBrollPrivateApprovedExecutionService({
      ...serviceInput,
      artifactStore: createArtifactStore(),
    })
  const replay = await restartedService.executeAll()
  assert.equal(
    hashSkillValue(replay.workResults),
    hashSkillValue(first.workResults),
  )
  assert.equal(
    hashSkillValue(replay.dispatchReceipts),
    hashSkillValue(first.dispatchReceipts),
  )
  assert.equal(
    replay.runtimeSnapshot.existingReceipt?.resultHash,
    first.runtimeSnapshot.existingReceipt?.resultHash,
  )
  await assert.rejects(
    () => createCanonicalBrollPrivateApprovedExecutionService({
      ...serviceInput,
      executionGate: {
        ...executionGate,
        snapshotComponentRef: {
          ...componentRef,
          sha256: '0'.repeat(64),
        },
      },
      artifactStore: createArtifactStore(),
    }),
    /component lineage is crossed/u,
  )

  console.log(JSON.stringify({
    smoke: 'canonical_broll_private_approved_execution_service',
    status: 'passed',
    checks: 20,
    canonicalWorkItems: first.workResults.length,
    actualMediaRuntimeExecuted: true,
    remotionRuntimeExecuted: true,
    exactApprovedComponentReread: true,
    createOnlyArtifactPersistence: true,
    restartReplayVerified: true,
    toolStagesBoundToExactWorkItems: true,
    providerRequestCount: 0,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
