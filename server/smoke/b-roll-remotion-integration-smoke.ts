import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  brollExistingSourceExecutionReceiptSchema,
  brollRemotionPreviewLayerForTreatment,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  executeBrollRemotionIntegration,
  trackGraphV1Schema,
} from '../edit-skills/b-roll'
import {
  canonicalSkillJson,
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'
import {
  persistCanonicalPrivateMediaArtifact,
} from '../services/canonical-private-media-artifact-storage'
import { putPrivateAuthorityJsonBlob } from '../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m9-'))
try {
  const sourcePath = join(root, 'source.mp4')
  const captionPath = join(root, 'caption.png')
  const generatedSource = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    'color=c=0x1858a8:s=1280x720:r=24:d=3,format=yuv420p,hue=H=2*t:s=1',
    '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-threads', '1', '-frames:v', '72', '-y', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(generatedSource.status, 0, generatedSource.stderr)
  const generatedCaption = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    'color=c=black@0.0:s=640x360,format=rgba,drawbox=x=120:y=290:w=400:h=42:color=white@0.9:t=fill,drawbox=x=150:y=302:w=340:h=10:color=black@0.75:t=fill',
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png', '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(generatedCaption.status, 0, generatedCaption.stderr)
  const sourceBytes = await readFile(sourcePath)
  const captionBytes = await readFile(captionPath)
  assert.ok(
    captionBytes.byteLength >= 1_024,
    `caption overlay fixture must exercise the validated PNG payload boundary; received ${captionBytes.byteLength} bytes`,
  )

  const scope = {
    ownerUserId: 'user-m9',
    workspaceId: 'workspace-m9',
    projectId: 'project-m9',
  }
  const sourceArtifactRef = {
    artifactType: 'source_media_artifact_v1',
    sha256: sha256(sourceBytes),
    byteLength: sourceBytes.byteLength,
    ...scope,
  }
  const captionRef = {
    artifactType: 'caption_overlay_png_v1',
    sha256: sha256(captionBytes),
    byteLength: captionBytes.byteLength,
    ...scope,
  }
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m9',
    orchestrationRunId: 'orchestration-m9',
    ...scope,
    editSessionId: 'session-m9',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-m9'],
    sourceSequenceIds: ['source-m9'],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [sourceArtifactRef, captionRef],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Use one concise source cutaway to clarify the workflow.',
    pointToProveClarifyCoverOrSupport: 'Clarify the visible workflow step.',
    expectedViewerBenefit: 'Understand the action without losing narration context.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not imply generated or unsupported proof.'],
    permittedSourceRoutes: ['use_existing_project_clip', 'use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 600,
    maximumCredits: 100,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const trackGraph = trackGraphV1Schema.parse({
    schemaVersion: 'track_graph_v1',
    modelNeutral: true,
    ...scope,
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    authorizedRange,
    authorizedRangeHash: hashSkillValue(authorizedRange),
    sourceSha256: sourceArtifactRef.sha256,
    fps: 24,
    tracks: [{
      trackId: 'speaker-track-m9',
      startFrameInclusive: authorizedRange.startFrameInclusive,
      endFrameExclusive: authorizedRange.endFrameExclusive,
      samplesArtifactHash: hashSkillValue({ samples: 'm9' }),
    }],
  })
  const trackGraphRef = {
    artifactType: 'track_graph_v1',
    sha256: hashSkillValue(trackGraph),
    byteLength: Buffer.byteLength(canonicalSkillJson(trackGraph), 'utf8'),
    ...scope,
  }
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: assignment.assignmentId,
    baseFootageStrength: 0.1,
    speakerEmotionImportance: 0.1,
    meaningfulVisualNeed: 0.95,
    userVisualPreference: 'balanced',
    claimSensitivity: 'none',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: true,
    trackGraphRef,
    sourceCandidates: [{
      sourceId: 'source-m9',
      sourceType: 'existing_project_clip',
      artifactRef: sourceArtifactRef,
      sourceRange: { startFrameInclusive: 0, endFrameExclusive: 72, fps: 24 },
      semanticRelevance: 0.99,
      visualQuality: 0.99,
      temporalFit: 0.99,
      storyContinuity: 0.99,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofSafe: true,
      repetitionRisk: 0.01,
      cropFeasibility: 1,
      speakerActionProtection: 1,
      audioUsefulness: 0,
      costCredits: 1,
      approvedByUser: true,
    }],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy reference-specific shot construction.'],
  })
  const compiled = compileBrollPlan({
    assignment,
    context,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(compiled.plan.decision, 'use_existing_project_clip')
  assert.equal(compiled.plan.coordination.trackingDependency, 'satisfied')
  assert.deepEqual(compiled.plan.coordination.trackGraphRef, trackGraphRef)

  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const normalized = await mediaRuntime.execute({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: 'approved_trim_transcode_v1',
      timestampPolicy: 'normalize_from_zero',
      overwriteExistingArtifact: false,
      allowUnreviewedCodec: false,
      trimStartFrame: 0,
      trimEndFrameExclusive: 72,
      frameRate: 24,
      mimeType: 'video/mp4',
      sourceByteLength: sourceBytes.byteLength,
      sourceSha256: sourceArtifactRef.sha256,
      sourceBytesBase64: sourceBytes.toString('base64'),
    },
  })
  assert.equal(normalized.resultArtifact.mimeType, 'video/x-nut')
  if (normalized.resultArtifact.mimeType !== 'video/x-nut') {
    throw new Error('M9 fixture normalization returned the wrong media type.')
  }
  const normalizedIdentity = hashSkillValue({
    domain: 'reeditpro:b-roll-m9-normalized-source:v1',
    sha256: normalized.resultArtifact.sha256,
  })
  await persistCanonicalPrivateMediaArtifact({
    localStorageRoot: root,
    privateObjectIdentityHash: normalizedIdentity,
    bytes: normalized.resultArtifact.bytes,
    expectedSha256: normalized.resultArtifact.sha256,
  })
  const assignmentRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: { ...assignment },
  })
  const planRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: { ...compiled.plan },
  })
  const sourceInspection = hashed({
    schemaVersion: 'b_roll_source_inspection_v1',
    sourceSha256: sourceArtifactRef.sha256,
    frameCount: 72,
    frameRate: 24,
    status: 'passed',
  }, 'sourceInspectionHash')
  const sourceInspectionRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: sourceInspection,
  })
  const sourceQa = hashed({
    schemaVersion: 'b_roll_source_qa_report_v1',
    manifestRef,
    assignmentId: assignment.assignmentId,
    sourceId: 'source-m9',
    sourceSha256: sourceArtifactRef.sha256,
    normalizedCandidateSha256: normalized.resultArtifact.sha256,
    checks: {
      sourceChecksumVerified: true,
      sourceScopeVerified: true,
      sourceProvenanceRightsPrivacyVerified: true,
      decodableVideoStreamVerified: true,
      exactTrimFrameCountVerified: true,
      outputProbeVerified: true,
      outputCodecApproved: true,
      audioRemovedForCrossSkillHandoff: true,
      providerRequestsVerifiedZero: true,
    },
    status: 'passed',
  }, 'sourceQaReportHash')
  const sourceQaReportRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: sourceQa,
  })
  const placeholderLayer = hashed({
    schemaVersion: 'b_roll_source_layer_preparation_v1',
    normalizedSha256: normalized.resultArtifact.sha256,
  }, 'layerManifestHash')
  const placeholderLayerRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: placeholderLayer,
  })
  const placeholderPreview = hashed({
    schemaVersion: 'b_roll_source_preview_preparation_v1',
    normalizedSha256: normalized.resultArtifact.sha256,
  }, 'previewManifestHash')
  const placeholderPreviewRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: placeholderPreview,
  })
  const receiptCore = {
    schemaVersion: 'b_roll_existing_source_execution_v1' as const,
    executionKey: hashSkillValue({ execution: 'm9-source' }),
    approvedPlanSnapshotId: 'snapshot-m9',
    reservationId: 'reservation-m9',
    manifestRef,
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planHash: compiled.plan.planHash,
    workGraphHash: hashSkillValue({ workGraph: 'm9' }),
    authorizedRange,
    selectedSourceId: 'source-m9',
    selectedSourceArtifactRef: sourceArtifactRef,
    sourceTrim: compiled.plan.sourceTrim!,
    sourceInspectionRef,
    sourceInspectionHash: sourceInspection.sourceInspectionHash,
    normalizedCandidate: {
      privateObjectIdentityHash: normalizedIdentity,
      sha256: normalized.resultArtifact.sha256,
      byteLength: normalized.resultArtifact.byteLength,
      mimeType: 'video/x-nut' as const,
      frameCount: 72,
      frameRate: 24,
      container: 'nut' as const,
      videoCodec: 'ffv1' as const,
    },
    sourceQaReportRef,
    sourceQaReportHash: sourceQa.sourceQaReportHash,
    layerManifestRef: placeholderLayerRef,
    layerManifestHash: placeholderLayer.layerManifestHash,
    previewManifestRef: placeholderPreviewRef,
    previewManifestHash: placeholderPreview.previewManifestHash,
    providerRequestCount: 0 as const,
    outsideAuthorizedRangeModified: false as const,
    executionCompletedAt: '2026-08-03T18:00:00.000Z',
  }
  const sourceReceipt = brollExistingSourceExecutionReceiptSchema.parse({
    ...receiptCore,
    resultHash: hashSkillValue(receiptCore),
  })
  const sourceReceiptRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: sourceReceipt,
  })

  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const result = await executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef,
    plan: compiled.plan,
    planRef,
    selection: {
      kind: 'existing_source',
      receipt: sourceReceipt,
      receiptRef: sourceReceiptRef,
      normalizedBytes: normalized.resultArtifact.bytes,
      attemptHistory: [],
    },
    captionOverlay: {
      reference: captionRef,
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    trackGraph: { reference: trackGraphRef, value: trackGraph },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m9',
    now: () => '2026-08-03T18:05:00.000Z',
  })
  assert.equal(result.replayed, false)
  assert.equal(result.receipt.outsideAuthorizedRangeModified, false)
  assert.equal(result.receipt.selectedArtifact.sourceRoute, 'existing_project_clip')
  assert.equal(result.receipt.selectedCandidateAutomatically, false)
  assert.equal(result.receipt.generatedAudioFinalMixAllowed, false)
  assert.equal(result.receipt.preview.privateInternalOnly, true)
  assert.equal(result.receipt.preview.frameCount, 72)
  assert.equal(result.layerManifest.trackGraphRef?.artifactType, 'track_graph_v1')
  assert.equal(result.layerManifest.rendererOwner, 'render')
  assert.equal(result.layerManifest.captionSafeBehavior.finalOwner, 'captions')
  assert.equal(result.layerManifest.soundHandoff.finalOwner, 'sound')
  assert.equal(result.layerManifest.colorHandoff.finalOwner, 'color')
  assert.equal(result.layerManifest.transitionHandoff.finalOwner, 'transition')
  assert.deepEqual(Object.values(result.integrationQa.checks), Array(11).fill(true))
  assert.equal(result.receipt.costEvidence.providerCostMicros, 0)
  assert.equal(result.receipt.costEvidence.integrationInfrastructureCostMicros, 7_500)
  assert.equal(result.receipt.attemptHistory.length, 0)

  const replay = await executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef,
    plan: compiled.plan,
    planRef,
    selection: {
      kind: 'existing_source',
      receipt: sourceReceipt,
      receiptRef: sourceReceiptRef,
      normalizedBytes: normalized.resultArtifact.bytes,
      attemptHistory: [],
    },
    captionOverlay: { reference: captionRef, bytes: captionBytes, reservedZoneCount: 1 },
    trackGraph: { reference: trackGraphRef, value: trackGraph },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m9',
  })
  assert.equal(replay.replayed, true)
  assert.equal(replay.receipt.resultHash, result.receipt.resultHash)

  const treatments = [
    'full_frame_takeover', 'full_frame_cutaway', 'inset', 'picture_in_picture',
    'split_screen', 'partial_overlay', 'background_layer',
  ] as const
  assert.deepEqual(
    treatments.map((treatment) =>
      brollRemotionPreviewLayerForTreatment(treatment).displayTreatment),
    treatments,
  )
  assert.throws(() => brollRemotionPreviewLayerForTreatment('no_display'))
  await assert.rejects(executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef,
    plan: compiled.plan,
    planRef,
    selection: {
      kind: 'existing_source',
      receipt: sourceReceipt,
      receiptRef: sourceReceiptRef,
      normalizedBytes: Buffer.from(normalized.resultArtifact.bytes).fill(0, 30, 31),
      attemptHistory: [],
    },
    captionOverlay: { reference: captionRef, bytes: captionBytes, reservedZoneCount: 1 },
    trackGraph: { reference: trackGraphRef, value: trackGraph },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m9-tampered',
  }), /QA-normalized artifact/u)
  await assert.rejects(executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef,
    plan: compiled.plan,
    planRef,
    selection: {
      kind: 'existing_source',
      receipt: sourceReceipt,
      receiptRef: sourceReceiptRef,
      normalizedBytes: normalized.resultArtifact.bytes,
      attemptHistory: [],
    },
    captionOverlay: { reference: captionRef, bytes: captionBytes, reservedZoneCount: 1 },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m9-no-track',
  }), /Track All dependency/u)

  console.log(JSON.stringify({
    smoke: 'b-roll-remotion-integration',
    sourceRoute: result.receipt.selectedArtifact.sourceRoute,
    treatment: result.layerManifest.displayTreatment,
    supportedTreatments: treatments.length,
    exactRange: result.receipt.exactTiming,
    preview: {
      width: result.receipt.preview.width,
      height: result.receipt.preview.height,
      fps: result.receipt.preview.frameRate,
      frames: result.receipt.preview.frameCount,
      privateInternalOnly: result.receipt.preview.privateInternalOnly,
    },
    trackGraphArtifactType: result.layerManifest.trackGraphRef?.artifactType,
    finalOwners: result.receipt.handoffs,
    integrationQaChecksPassed: Object.keys(result.integrationQa.checks).length,
    outsideAuthorizedRangeModified: false,
    actualProviderRequests: 0,
    replayed: replay.replayed,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function hashed<T extends Record<string, unknown>, K extends string>(
  core: T,
  key: K,
): T & Record<K, string> {
  return { ...core, [key]: hashSkillValue(core) } as T & Record<K, string>
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
