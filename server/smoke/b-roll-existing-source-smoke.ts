import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  BrollCanonicalPrivateExecutionCoordinator,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollCanonicalPrivateRuntimeBindings,
  createBrollPlanningContext,
  createSourceMediaArtifactV1,
  createBrollVisualOwnershipManifest,
  executeBrollExistingSource,
  projectBrollCanonicalWorkItems,
  type BrollSourceCandidate,
} from '../edit-skills/b-roll/index'
import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  canonicalSkillJson,
  createEditSkillPlanApproval,
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core'
import { GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT } from '../edit-skills/b-roll/generated/b-roll-internal-qualification.generated'
import {
  assertSkillQualificationReceipt,
  skillQualificationReceiptSchema,
} from '../edit-skills/core/skill-qualification-receipt'
import {
  editSkillArtifactSchemaRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillReferenceCatalog,
} from '../edit-skills/internal-fixture-runtime'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import { readCanonicalPrivateMediaArtifact } from '../services/canonical-private-media-artifact-storage'
import { readPrivateAuthorityJsonBlob } from '../services/private-edit-authority-store'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m5-'))
try {
  const fixturePath = join(localStorageRoot, 'existing-source-fixture.mp4')
  const captionPath = join(localStorageRoot, 'caption-overlay.png')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
    '-threads', '1', '-y', fixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const generatedCaption = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:s=640x360,format=rgba',
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png', '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(generatedCaption.status, 0, generatedCaption.stderr)
  const sourceBytes = await readFile(fixturePath)
  const captionBytes = await readFile(captionPath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
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
  const sourceMediaManifest = createSourceMediaArtifactV1({
    schemaVersion: 'source_media_artifact_v1',
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    sourceId: 'source-existing',
    privateObjectIdentityHash: hashSkillValue({ sourceSha256, storage: 'private-fixture' }),
    objectSha256: sourceSha256,
    byteLength: sourceBytes.byteLength,
    mimeType: 'video/mp4',
    container: 'mp4',
    durationFrames: 96,
    fps: 24,
    width: 320,
    height: 180,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofClassification: 'source_verified',
    checksumReadbackVerified: true,
    privateOnly: true,
    publicDeliveryAllowed: false,
    immutable: true,
  })
  const sourceArtifactRef = {
    artifactType: 'source_media_artifact_v1',
    sha256: hashSkillValue(sourceMediaManifest),
    byteLength: Buffer.byteLength(canonicalSkillJson(sourceMediaManifest), 'utf8'),
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
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
    editSessionId: assignment.editSessionId,
    assignmentId: assignment.assignmentId,
    editPlanVersion: assignment.editPlanVersion,
    manifestRef,
    assignmentRange: authorizedRange,
    requestedOwnership: 'primary',
    ownershipWindows: [],
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
    qualificationReceipt: assertSkillQualificationReceipt(
      skillQualificationReceiptSchema.parse(
        (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT as { receipt: unknown }).receipt,
      ),
    ),
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
      mediaManifest: sourceMediaManifest,
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

  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planId: compiled.plan.planId,
    planHash: compiled.plan.planHash,
    manifestRef,
    authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T13:00:00.000Z',
  })
  const coordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'existing_source',
    executionGate: gate,
    localStorageRoot,
    approvalHash: approval.approvalHash,
    component: persisted.component,
    componentRef,
    assignment,
    context,
    visualOwnership,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    approvedWorkGraphHash: workGraph.workGraphHash,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceArtifactRef,
      mediaManifest: sourceMediaManifest,
      mimeType: 'video/mp4',
      bytes: sourceBytes,
    },
    providerObserver,
    captionOverlay: {
      reference: {
        artifactType: 'caption_overlay_png_v1',
        sha256: createHash('sha256').update(captionBytes).digest('hex'),
        byteLength: captionBytes.byteLength,
        ownerUserId: 'user',
        workspaceId: 'workspace',
        projectId: 'project',
      },
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    mediaRuntime: runtime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    now: () => '2026-08-04T13:05:00.000Z',
  })
  const canonicalBindings = createBrollCanonicalPrivateRuntimeBindings(coordinator)
  const bindingRegistry = new SkillJobRuntimeBindingRegistry()
  for (const binding of canonicalBindings) bindingRegistry.register(binding)
  bindingRegistry.validateManifest({
    manifest: BROLL_CAPABILITY_MANIFEST,
    artifacts: editSkillArtifactSchemaRegistry,
    operations: editSkillReferenceCatalog,
    workGraphJobs: BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  })
  const dispatcher = new EditSkillRuntimeDispatcher(bindingRegistry, 'canonical_private')
  const bindingByJob = new Map(canonicalBindings.map((binding) => [
    binding.definition.jobType,
    binding.definition,
  ]))
  const dispatchReceipts = []
  for (const workItem of workGraph.workItems) {
    const binding = bindingByJob.get(workItem.jobType)
    assert.ok(binding)
    dispatchReceipts.push(await dispatcher.dispatchApprovedWorkItem({
      manifestRef,
      workItem,
      approval,
      authorizedPhase: binding.allowedPhases[0]!,
      inputArtifactTypes: binding.inputArtifactTypes,
      adapterClass: 'canonical_private_execution_adapter',
      environmentClass: 'canonical_private',
      runtimeQualification: 'internal_execution_qualified',
      artifactStorageClass: 'durable',
      privateArtifactAuthority: true,
      providerAuthorityOperations: editSkillReferenceCatalog.providerOperations,
      toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
    }))
  }
  const canonicalSnapshot = coordinator.snapshot()
  assert.equal(dispatchReceipts.length, workGraph.workItems.length)
  assert.equal(dispatchReceipts.reduce((total, receipt) =>
    total + receipt.providerRequestCount, 0), 0)
  assert.equal(
    canonicalSnapshot.existingReceipt?.selectedSourceArtifactRef.sha256,
    hashSkillValue(sourceMediaManifest),
  )
  assert.equal(canonicalSnapshot.integrationQa?.status, 'passed')
  assert.ok(canonicalSnapshot.resultReceipt && 'preview' in canonicalSnapshot.resultReceipt)
  if (canonicalSnapshot.resultReceipt && 'preview' in canonicalSnapshot.resultReceipt) {
    assert.equal(canonicalSnapshot.resultReceipt.preview.privateInternalOnly, true)
    assert.equal(canonicalSnapshot.resultReceipt.preview.frameCount, 72)
  }

  const replay = await executeBrollExistingSource({
    localStorageRoot,
    gate,
    component: persisted.component,
    canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceArtifactRef,
      mediaManifest: sourceMediaManifest,
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
      mediaManifest: sourceMediaManifest,
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
      mediaManifest: sourceMediaManifest,
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
    canonicalPrivateBindings: canonicalBindings.length,
    canonicalPrivateDispatches: dispatchReceipts.length,
    privateRemotionPreview: true,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

function record(value: Record<string, unknown> | unknown[]): Record<string, unknown> {
  assert.equal(Array.isArray(value), false)
  return value as Record<string, unknown>
}
