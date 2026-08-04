import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  executeBrollExistingSource,
  projectBrollCanonicalWorkItems,
  type BrollSourceCandidate,
} from '../edit-skills/b-roll/index'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { loadBrollGeneratedQualificationReceiptForCurrentSource } from '../edit-skills/b-roll/b-roll-qualification-evidence'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import { readCanonicalPrivateMediaArtifact } from '../services/canonical-private-media-artifact-storage'
import { readPrivateAuthorityJsonBlob } from '../services/private-edit-authority-store'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m5-'))
try {
  const fixturePath = join(localStorageRoot, 'existing-source-fixture.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
    '-threads', '1', '-y', fixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const sourceBytes = await readFile(fixturePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const sourceArtifactRef = {
    artifactType: 'source_media_artifact_v1',
    sha256: sourceSha256,
    byteLength: sourceBytes.byteLength,
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
  }
  const sourceCandidate: BrollSourceCandidate = {
    sourceId: 'source-existing',
    sourceType: 'existing_project_clip',
    artifactRef: sourceArtifactRef,
    sourceRange: { startFrameInclusive: 12, endFrameExclusive: 84, fps: 24 },
    semanticRelevance: 0.98,
    visualQuality: 0.95,
    temporalFit: 0.95,
    storyContinuity: 0.96,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofSafe: true,
    repetitionRisk: 0.02,
    cropFeasibility: 0.98,
    speakerActionProtection: 0.95,
    audioUsefulness: 0.5,
    costCredits: 1,
    approvedByUser: true,
  }
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m5',
    orchestrationRunId: 'orchestration-m5',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
    editSessionId: 'session',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-1'],
    sourceSequenceIds: ['source-existing'],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Use the exact approved project footage as a product-detail cutaway.',
    pointToProveClarifyCoverOrSupport: 'Clarify the physical product detail.',
    expectedViewerBenefit: 'See the exact product detail without fabricated footage.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate product proof.'],
    permittedSourceRoutes: ['use_existing_project_clip', 'use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 600,
    maximumCredits: 20,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
    assignmentId: assignment.assignmentId,
    baseFootageStrength: 0.4,
    speakerEmotionImportance: 0.1,
    meaningfulVisualNeed: 0.95,
    userVisualPreference: 'balanced',
    claimSensitivity: 'supporting',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: false,
    sourceCandidates: [sourceCandidate],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: [],
  })
  const compiled = compileBrollPlan({
    assignment,
    context,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(compiled.plan.decision, 'use_existing_project_clip')
  const workGraph = compileBrollCanonicalWorkGraph({ assignment, plan: compiled.plan })
  const canonicalWorkItems = projectBrollCanonicalWorkItems({ assignment, workGraph })
  assert.equal(canonicalWorkItems.some((item) => item.approvedProviderRoute), false)
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot,
    assignment,
    context,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    qualificationReceipt: loadBrollGeneratedQualificationReceiptForCurrentSource(BROLL_CAPABILITY_MANIFEST),
  })
  const componentRef = persisted.componentRefs.bRollSkill
  const providerObserver = {
    requests: 0,
    getRequestCount() { return this.requests },
  }
  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  const gate = {
    approvedPlanSnapshotId: 'snapshot-m5',
    snapshotHash: hashSkillValue({ snapshot: 'm5' }),
    reservationId: 'reservation-m5',
    reservationStatus: 'reserved' as const,
    approved: true as const,
    privateInternalExecution: true as const,
    idempotencyKey: 'b-roll-existing-source-m5',
    componentRef,
    snapshotComponentRef: componentRef,
    executionPackageComponentRef: componentRef,
  }
  const first = await executeBrollExistingSource({
    localStorageRoot,
    gate,
    component: persisted.component,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceArtifactRef,
      mimeType: 'video/mp4',
      bytes: sourceBytes,
    },
    mediaRuntime: runtime,
    providerObserver,
    now: () => '2026-08-03T17:30:00.000Z',
  })
  assert.equal(first.replayed, false)
  assert.equal(first.receipt.providerRequestCount, 0)
  assert.equal(providerObserver.requests, 0)
  assert.equal(first.receipt.normalizedCandidate.frameCount, 72)
  assert.equal(first.receipt.normalizedCandidate.mimeType, 'video/x-nut')
  assert.deepEqual(first.receipt.authorizedRange, authorizedRange)
  const storedCandidate = await readCanonicalPrivateMediaArtifact({
    localStorageRoot,
    privateObjectIdentityHash: first.receipt.normalizedCandidate.privateObjectIdentityHash,
  })
  assert.ok(storedCandidate)
  assert.equal(storedCandidate.sha256, first.receipt.normalizedCandidate.sha256)
  const qa = record(await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: first.receipt.sourceQaReportRef,
  }))
  assert.equal(qa.status, 'passed')
  assert.equal((qa.checks as Record<string, unknown>).providerRequestsVerifiedZero, true)
  const layer = record(await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: first.receipt.layerManifestRef,
  }))
  assert.deepEqual(layer.authorizedRange, authorizedRange)
  assert.equal(layer.finalCompositionOwnedByBroll, false)
  const preview = record(await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: first.receipt.previewManifestRef,
  }))
  assert.equal(preview.previewMode, 'private_source_trim_window')
  assert.equal(preview.isolatedSourcePlaybackReady, true)

  const replay = await executeBrollExistingSource({
    localStorageRoot,
    gate,
    component: persisted.component,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceArtifactRef,
      mimeType: 'video/mp4',
      bytes: sourceBytes,
    },
    mediaRuntime: runtime,
    providerObserver,
  })
  assert.equal(replay.replayed, true)
  assert.equal(replay.receipt.resultHash, first.receipt.resultHash)
  assert.equal(providerObserver.requests, 0)

  const substitutedBytes = Buffer.from(sourceBytes)
  substitutedBytes[substitutedBytes.byteLength - 1] ^= 1
  await assert.rejects(() => executeBrollExistingSource({
    localStorageRoot,
    gate: { ...gate, idempotencyKey: 'substituted-source-bytes' },
    component: persisted.component,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceArtifactRef,
      mimeType: 'video/mp4',
      bytes: substitutedBytes,
    },
    mediaRuntime: runtime,
    providerObserver,
  }), /do not match/)
  await assert.rejects(() => executeBrollExistingSource({
    localStorageRoot,
    gate: { ...gate, idempotencyKey: 'cross-workspace-source' },
    component: persisted.component,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: { ...sourceArtifactRef, workspaceId: 'foreign-workspace' },
      mimeType: 'video/mp4',
      bytes: sourceBytes,
    },
    mediaRuntime: runtime,
    providerObserver,
  }), /authority is invalid/)

  console.log(JSON.stringify({
    status: 'ok',
    manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
    sourceSha256,
    normalizedCandidateSha256: first.receipt.normalizedCandidate.sha256,
    normalizedFrameCount: first.receipt.normalizedCandidate.frameCount,
    providerRequests: providerObserver.requests,
    replayedResultHash: replay.receipt.resultHash,
    sourceQaStatus: qa.status,
    previewMode: preview.previewMode,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

function record(value: Record<string, unknown> | unknown[]): Record<string, unknown> {
  assert.equal(Array.isArray(value), false)
  return value as Record<string, unknown>
}
