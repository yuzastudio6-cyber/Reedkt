import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createApprovedEditExecutionPackage } from '../edit-architecture/approved-edit-execution-package'
import {
  approvedCoreToolOperationId,
  createApprovedToolOperationEvidence,
  createApprovedToolWorkManifest,
  type ApprovedToolOperationEvidence,
} from '../edit-architecture/approved-tool-work-manifest'
import { createBasicPreview, createPrivateFinalRenderFromPreviewClips, probeMediaFile } from '../media/ffmpeg-preview'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { getProductionToolProfile, getToolQAPolicy, isProductionToolId } from '../tool-registry'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'
import type { PlannerInput } from '../../src/types/reeditpro'

const plannerInput: PlannerInput = {
  projectName: 'Approved tool work manifest private vertical slice',
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
  customInstructions: 'Create a clean professional internal test edit and only use bounded backend-approved tool activities.',
  creditPreference: 'balanced',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}
const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'approved-tool-work-manifest-smoke-user',
  editSessionId: 'approved-tool-work-manifest-smoke-edit',
  plan: createMockEditPlan(plannerInput),
  projectId: 'approved-tool-work-manifest-smoke-project',
})
const workspaceId = 'approved-tool-work-manifest-smoke-workspace'
const creditReservationId = 'approved-tool-work-manifest-smoke-reservation'
const sharedFfmpegProfile = getProductionToolProfile('ffmpeg')
const sharedFfmpegQaPolicy = getToolQAPolicy('ffmpeg')
assert.ok(sharedFfmpegProfile)
assert.equal(Object.isFrozen(sharedFfmpegProfile.inputTypes), false)
assert.equal(Object.isFrozen(sharedFfmpegQaPolicy.gateTypes), false)
const manifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: snapshot, creditReservationId })
const blankScopeManifest = createApprovedToolWorkManifest({
  workspaceId: ' ',
  approvedSnapshot: snapshot,
  creditReservationId: ' ',
})

assert.ok(
  snapshot.toolStrategyPlan?.toolIdsUsed.every(isProductionToolId),
  'Approved planner tool selection must stay inside the exact canonical 50-tool set.',
)
assert.notEqual(manifest.status, 'blocked_structural_inconsistency', manifest.blockers.join(' '))
assert.equal(blankScopeManifest.status, 'blocked_structural_inconsistency')
assert.ok(blankScopeManifest.blockers.some((blocker) => /workspace ID/i.test(blocker)))
assert.ok(blankScopeManifest.blockers.some((blocker) => /credit reservation ID/i.test(blocker)))
assert.equal(manifest.immutable, true)
assert.equal(Object.isFrozen(manifest), true, 'Canonical manifest should be runtime immutable.')
assert.equal(Object.isFrozen(manifest.operations), true, 'Canonical manifest operations should be runtime immutable.')
assert.equal(Object.isFrozen(sharedFfmpegProfile.inputTypes), false, 'Freezing a manifest must not freeze shared tool-registry arrays.')
assert.equal(Object.isFrozen(sharedFfmpegQaPolicy.gateTypes), false, 'Freezing a manifest must not freeze shared tool-QA policy arrays.')
assert.equal(manifest.approvedPlanSnapshotId, snapshot.id)
assert.equal(manifest.creditReservationId, creditReservationId)
assert.equal(manifest.reconciliation.executableOperationCount, 4)
assert.ok(manifest.reconciliation.degradedOperationCount > 0, 'Future approved tools/adapters should remain explicitly degraded.')
assert.equal(manifest.reconciliation.blockedOperationCount, 0)
assert.equal(manifest.coreOperationIds.source_media_private_process, approvedCoreToolOperationId(snapshot.id, 'source_media_private_process'))
assert.equal(manifest.coreOperationIds.processed_media_private_qa_probe, approvedCoreToolOperationId(snapshot.id, 'processed_media_private_qa_probe'))
assert.equal(manifest.coreOperationIds.final_private_render, approvedCoreToolOperationId(snapshot.id, 'final_private_render'))
assert.equal(manifest.coreOperationIds.final_delivery_private_qa_probe, approvedCoreToolOperationId(snapshot.id, 'final_delivery_private_qa_probe'))
assert.ok(manifest.operations.filter((operation) => operation.disposition === 'degraded_planning_only')
  .every((operation) => operation.runner.actualMediaOperationImplemented === false))
assert.throws(
  () => createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'source_media_private_process',
    operationInstanceId: 'spoofed-wrong-reservation-operation',
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId: 'wrong-credit-reservation',
    outputArtifactId: 'spoofed-output',
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: [],
    completedAt: new Date().toISOString(),
  }),
  /credit reservation does not match/i,
)
assert.throws(
  () => createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'processed_media_private_qa_probe',
    operationInstanceId: 'spoofed-ffprobe-processing-operation',
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'spoofed-output',
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: [],
    completedAt: new Date().toISOString(),
  }),
  /inspection-only and cannot claim media processing/i,
)
assert.throws(
  () => createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'source_media_private_process',
    operationInstanceId: 'spoofed-missing-artifact-proof-operation',
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'spoofed-output',
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: [],
    completedAt: new Date().toISOString(),
  }),
  /valid output SHA-256 artifact proof/i,
)

const executionPackage = createApprovedEditExecutionPackage({
  workspaceId,
  approvedSnapshot: snapshot,
  creditReservationId,
})
assert.equal(executionPackage.toolWorkManifest.manifestId, manifest.manifestId)
assert.equal(executionPackage.agentCallReady, true)

const invalidSnapshot = structuredClone(snapshot) as ApprovedPlanSnapshot
const invalidToolStrategyItem = invalidSnapshot.toolStrategyPlan?.items[0]
assert.ok(invalidToolStrategyItem, 'Fixture should include a tool strategy item for fail-closed coverage.')
invalidToolStrategyItem.segmentId = 'orphan-segment-for-fail-closed-smoke'
const invalidManifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: invalidSnapshot, creditReservationId })
assert.equal(invalidManifest.status, 'blocked_structural_inconsistency')
assert.ok(invalidManifest.blockers.some((blocker) => /orphan segment/i.test(blocker)))
const invalidPackage = createApprovedEditExecutionPackage({
  workspaceId,
  approvedSnapshot: invalidSnapshot,
  creditReservationId,
})
assert.equal(invalidPackage.agentCallReady, false)
assert.equal(invalidPackage.status, 'blocked_invalid_tool_work_manifest')

const missingExecutionGraphSnapshot = structuredClone(snapshot) as ApprovedPlanSnapshot
delete missingExecutionGraphSnapshot.editingAgentExecutionPlan
const missingExecutionGraphManifest = createApprovedToolWorkManifest({
  workspaceId,
  approvedSnapshot: missingExecutionGraphSnapshot,
  creditReservationId,
})
assert.equal(missingExecutionGraphManifest.status, 'blocked_structural_inconsistency')
assert.ok(missingExecutionGraphManifest.blockers.some((blocker) => /execution graph/i.test(blocker)))

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-approved-tool-work-manifest-'))
const evidence: ApprovedToolOperationEvidence[] = []
try {
  const sourceFixture = await createSyntheticMp4Fixture({
    localStorageRoot,
    outputPath: join(localStorageRoot, 'source.mp4'),
    durationSeconds: 1,
    width: 160,
    height: 90,
    includeAudio: true,
  })
  assert.equal(sourceFixture.available, true, sourceFixture.warnings.join('; '))
  assert.ok(sourceFixture.outputPath)

  const previewStartedAt = Date.now()
  const preview = await createBasicPreview(
    sourceFixture.outputPath,
    join(localStorageRoot, 'private-preview.mp4'),
    {
      localStorageRoot,
      maxDurationSeconds: 1,
      targetWidth: 160,
      targetHeight: 90,
      fps: 24,
      audioMode: 'copy_or_transcode',
      fitMode: 'contain',
    },
  )
  const sourceProcessingEvidenceInput: Parameters<typeof createApprovedToolOperationEvidence>[0] = {
    manifest,
    operationKind: 'source_media_private_process',
    operationInstanceId: `${manifest.coreOperationIds.source_media_private_process}:artifact:private-preview`,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'private-preview',
    outputSha256: preview.checksumSha256,
    outputByteSize: preview.sizeBytes,
    outputSeconds: preview.durationSeconds,
    megapixelFrames: 0.3456,
    elapsedMilliseconds: Date.now() - previewStartedAt,
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: ['Private FFmpeg preview completed.'],
    completedAt: new Date().toISOString(),
  }
  const sourceProcessingEvidence = createApprovedToolOperationEvidence(sourceProcessingEvidenceInput)
  const duplicateSourceProcessingEvidence = createApprovedToolOperationEvidence(sourceProcessingEvidenceInput)
  assert.equal(duplicateSourceProcessingEvidence.costEvidence.eventId, sourceProcessingEvidence.costEvidence.eventId)
  assert.equal(duplicateSourceProcessingEvidence.costEvidence.idempotencyKey, sourceProcessingEvidence.costEvidence.idempotencyKey)
  assert.match(sourceProcessingEvidence.costEvidence.idempotencyKey, /^tool-cost-evidence:[a-f0-9]{64}$/)
  evidence.push(sourceProcessingEvidence)

  const previewProbeStartedAt = Date.now()
  const previewProbe = await probeMediaFile(preview.outputPath)
  evidence.push(createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'processed_media_private_qa_probe',
    operationInstanceId: `${manifest.coreOperationIds.processed_media_private_qa_probe}:artifact:private-preview`,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'private-preview',
    outputSha256: preview.checksumSha256,
    outputByteSize: preview.sizeBytes,
    elapsedMilliseconds: Date.now() - previewProbeStartedAt,
    mediaProcessingExecuted: false,
    mediaBytesProcessed: false,
    mediaProbe: previewProbe,
    qaChecks: ['Private preview ffprobe QA completed.'],
    completedAt: new Date().toISOString(),
  }))

  const finalRenderStartedAt = Date.now()
  const finalRender = await createPrivateFinalRenderFromPreviewClips(
    [preview.outputPath],
    join(localStorageRoot, 'private-final.mp4'),
    { localStorageRoot },
  )
  evidence.push(createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'final_private_render',
    operationInstanceId: `${manifest.coreOperationIds.final_private_render}:artifact:private-final`,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'private-final',
    outputSha256: finalRender.checksumSha256,
    outputByteSize: finalRender.sizeBytes,
    outputSeconds: finalRender.durationSeconds,
    megapixelFrames: (finalRender.width * finalRender.height * 24 * finalRender.durationSeconds) / 1_000_000,
    elapsedMilliseconds: Date.now() - finalRenderStartedAt,
    mediaProcessingExecuted: true,
    mediaBytesProcessed: true,
    qaChecks: ['Private FFmpeg final render completed.'],
    completedAt: new Date().toISOString(),
  }))

  const finalProbeStartedAt = Date.now()
  const finalProbe = await probeMediaFile(finalRender.outputPath)
  evidence.push(createApprovedToolOperationEvidence({
    manifest,
    operationKind: 'final_delivery_private_qa_probe',
    operationInstanceId: `${manifest.coreOperationIds.final_delivery_private_qa_probe}:artifact:private-final`,
    workspaceId,
    projectId: snapshot.projectId,
    creditReservationId,
    outputArtifactId: 'private-final',
    outputSha256: finalRender.checksumSha256,
    outputByteSize: finalRender.sizeBytes,
    elapsedMilliseconds: Date.now() - finalProbeStartedAt,
    mediaProcessingExecuted: false,
    mediaBytesProcessed: false,
    mediaProbe: finalProbe,
    qaChecks: ['Private final ffprobe QA completed.'],
    completedAt: new Date().toISOString(),
  }))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

assert.equal(evidence.length, 4)
assert.equal(new Set(evidence.map((item) => item.costEvidence.idempotencyKey)).size, 4)
assert.deepEqual(new Set(evidence.map((item) => item.toolId)), new Set(['ffmpeg', 'ffprobe']))
assert.ok(evidence.filter((item) => item.toolId === 'ffmpeg').every((item) => item.mediaProcessingExecuted))
assert.ok(evidence.filter((item) => item.toolId === 'ffprobe').every((item) => !item.mediaProcessingExecuted))
assert.ok(evidence.every((item) => item.actualToolExecuted && item.privateInternalRuntimeExecuted))
assert.ok(evidence.every((item) => item.productionRuntimeExecuted === false))
assert.ok(evidence.every((item) => item.costEvidence.billableToUser === false))
assert.ok(evidence.every((item) => item.costEvidence.serviceFeeIncluded === false))
assert.ok(evidence.every((item) => item.costEvidence.walletMutationExecuted === false))
assert.ok(evidence.every((item) => item.costEvidence.settlementExecuted === false))
assert.ok(evidence.every((item) => item.costEvidence.nonBillableReason === 'private_internal_test_execution_no_wallet_settlement'))
assert.ok(evidence.every((item) => item.manifestRef.manifestId === manifest.manifestId))

console.log(JSON.stringify({
  ok: true,
  manifestId: manifest.manifestId,
  status: manifest.status,
  operationCount: manifest.operations.length,
  executableOperationCount: manifest.reconciliation.executableOperationCount,
  degradedOperationCount: manifest.reconciliation.degradedOperationCount,
  failClosedBlockerCount: invalidManifest.blockers.length,
  actualOperationEvidenceCount: evidence.length,
  actualFfmpegEvidenceCount: evidence.filter((item) => item.toolId === 'ffmpeg').length,
  actualFfprobeEvidenceCount: evidence.filter((item) => item.toolId === 'ffprobe').length,
  billableToolCostEventCount: evidence.filter((item) => item.costEvidence.billableToUser).length,
  walletMutationCount: evidence.filter((item) => item.costEvidence.walletMutationExecuted).length,
  externalBetaReady: false,
  productionReady: false,
}, null, 2))
