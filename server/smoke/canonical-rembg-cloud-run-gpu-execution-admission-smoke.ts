import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'

import {
  assertCanonicalRembgExactSourceFrameArtifactBinding,
  assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
  assertCanonicalRembgGpuRuntimeRequestCandidate,
  assertCanonicalRembgGpuRuntimeResultCandidate,
  assertCanonicalRembgModelArtifactRequirementSet,
  createCanonicalRembgExactSourceFrameArtifactBinding,
  createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
  createCanonicalRembgGpuRuntimeRequestCandidate,
  createCanonicalRembgGpuRuntimeResultCandidate,
  createCanonicalRembgGpuPrivateOutputReader,
  createCanonicalRembgGpuVerifiedOutputConsumer,
  getCanonicalRembgModelArtifactRequirementSet,
  projectCanonicalRembgGpuBundleRequirements,
  verifyCanonicalRembgGpuPrivateOutputs,
  verifyCanonicalRembgGray8MaskPng,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
  type CanonicalModelArtifactLocator,
  type CanonicalRembgGpuPrivateOutputFiles,
  type CanonicalRembgGpuVerifiedOutputPayload,
} from '../model-artifacts'
import {
  persistCanonicalPrivateImageArtifact,
} from '../services/canonical-private-image-artifact-storage'
import {
  verifyCanonicalPrivateImageArtifact,
} from '../services/canonical-private-image-artifact-verifier'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getProductionToolProfile,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution'
import type {
  CanonicalLivingFrameSourceAssetBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import {
  persistedArtifactResultSchema,
} from '../validation/private-artifact-qa-authority-schemas'

const SHA = {
  artifactRecord: 'a'.repeat(64),
  manifest: 'b'.repeat(64),
  descriptor: 'c'.repeat(64),
  objectIdentity: 'd'.repeat(64),
  dispatchBinding: 'e'.repeat(64),
  attemptPlan: 'f'.repeat(64),
  handoffManifest: '1'.repeat(64),
  manifestEntry: '2'.repeat(64),
  queueDefinition: '3'.repeat(64),
  regionAuthority: '4'.repeat(64),
  target: '5'.repeat(64),
  cloudRunRequest: '6'.repeat(64),
  sourceMedia: '7'.repeat(64),
  sourceBinding: '8'.repeat(64),
  storageIdentity: '9'.repeat(64),
  frameSelection: '0'.repeat(64),
  snapshot: '2'.repeat(64),
  workItem: '3'.repeat(64),
  extractionLease: '4'.repeat(64),
  dependencyRead: '5'.repeat(64),
}
const CONTROLLED_MASK_VALUES: Buffer = Buffer.from([
  0, 0, 0,
  32, 64, 96, 128, 192,
  255, 255, 255, 255,
])

const requirementSet =
  getCanonicalRembgModelArtifactRequirementSet()
const locator: CanonicalModelArtifactLocator = {
  locatorVersion: 'canonical-model-artifact-locator-v1',
  artifactRecordId:
    `model-artifact-${SHA.artifactRecord}`,
  artifactId: requirementSet.descriptor.artifactId,
  revision: requirementSet.descriptor.revision,
  contentSha256: requirementSet.descriptor.contentSha256,
  manifestDigestSha256: SHA.manifest,
}
const projection =
  projectCanonicalRembgGpuBundleRequirements({
    requirementSet,
    locator,
  })
const gpuBundle = controlledRembgGpuBundle()
const framePng = makeRgbaPng(4, 3)
const nonOpaqueFramePng = makeRgbaPng(4, 3, 128)
const frameArtifactSha256 = sha256(framePng)
const sourceAssetBinding:
CanonicalLivingFrameSourceAssetBinding = {
  assetIntentId: 'asset-intent-source-0001',
  sceneId: 'scene-0001',
  componentId: 'component-0001',
  sourceSequenceItemId: 'source-item-0001',
  mediaAssetId: 'media-asset-0001',
  uploadedOrder: 0,
  sourceCleanupDecisionId: 'cleanup-decision-0001',
  masterFrameIndex: 12,
  sourceFrameIndex: 12,
  frameRate: 30,
  frameSelectionPolicy: 'scene_start_meaning_anchor_v1',
  sourceFrameSelectionDigestSha256: SHA.frameSelection,
  checksumSha256: SHA.sourceMedia,
  mimeType: 'video/mp4',
  sizeBytes: 24_000_000,
  sourceBindingHash: SHA.sourceBinding,
  storageIdentityHash: SHA.storageIdentity,
  required: true,
  authorityState:
    'exact_verified_source_media_and_cleanup_bound',
}
const extractionWorkItem: CanonicalWorkItemInput = {
  workItemKey:
    'living-frame-mask-0001-exact-source-frame-png',
  workItemType: 'process_image_asset',
  workerClass: 'media_processing_worker',
  executionInput: {
    operation: 'extract_approved_exact_source_frame_png',
    approvedToolOperationIds: [
      'tool.ffmpeg.execute_approved_media_recipe.v1',
    ],
    expectedOutputKeys: [
      'living-frame-source-frame-output-0001',
    ],
    structuredPayload: {
      recipeProfileId:
        'approved_exact_source_frame_png_v1',
      timestampPolicy:
        'select_exact_decoded_source_frame',
      overwriteExistingArtifact: false,
      allowUnreviewedCodec: false,
      sourceSequenceItemId:
        sourceAssetBinding.sourceSequenceItemId,
      sourceCleanupDecisionId:
        sourceAssetBinding.sourceCleanupDecisionId,
      masterFrameIndex:
        sourceAssetBinding.masterFrameIndex,
      sourceFrameIndex:
        sourceAssetBinding.sourceFrameIndex,
      frameRate: sourceAssetBinding.frameRate,
      sourceFrameSelectionDigestSha256:
        sourceAssetBinding
          .sourceFrameSelectionDigestSha256,
      frameSelectionPolicy:
        'approved_source_frame_ordinal_v1',
      outputContainer: 'png',
      outputCodec: 'png',
      outputPixelFormat: 'rgba',
      metadataPolicy: 'strip_all',
      preserveAudio: false,
      maximumWidth: 4096,
      maximumHeight: 4096,
      maximumPixelCount: 16_777_216,
      maximumOutputBytes: 16_777_216,
    },
  },
  sourceSequenceItemIds: [
    sourceAssetBinding.sourceSequenceItemId,
  ],
  sourceCleanupDecisionIds: [
    sourceAssetBinding.sourceCleanupDecisionId,
  ],
  expectedOutputs: [{
    outputKey:
      'living-frame-source-frame-output-0001',
    artifactType: 'approved_exact_source_frame_png',
    assetRole: 'processed',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'image/png',
    segmentIds: ['segment-0001'],
    timingIds: ['timing-0001'],
    rendererLayerIds: ['layer-0001'],
  }],
  dependencyKeys: [],
  approvedToolIds: ['ffmpeg'],
  providerExecutionMode: 'none',
  fallbackPolicy: {
    policy:
      'block_living_frame_mask_until_exact_source_frame_exists',
    unapprovedFallbackAllowed: false,
    finalRenderBlockedWhilePending: true,
  },
  maxAttempts: 2,
  attemptTimeoutSeconds: 300,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 0,
  required: true,
}
const dependencyRead = {
  bytes: framePng,
  contentType: 'image/png' as const,
  sha256: frameArtifactSha256,
  byteLength: framePng.byteLength,
  dependencyJobId: 'source-frame-job-0001',
  expectedAssetId: 'source-frame-asset-0001',
  artifactId: 'source-frame-artifact-0001',
  artifactVersion: 1,
  sourceExecutionAttemptId:
    'source-frame-attempt-0001',
  sourceLeaseImmutableHash: SHA.extractionLease,
  dependencyReadEvidenceHash: SHA.dependencyRead,
}
const sourceArtifactBinding =
  createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding,
    extractionWorkItem,
    dependencyRead,
  })
const source = sourceArtifactBinding.source
const operationRequest = {
  operationId: 'tool.rembg.remove_image_background.v1',
  approvedSnapshotId: 'approved_snapshot_0001',
  approvedSnapshotHash: SHA.snapshot,
  workItemId: 'approved_work_item_0001',
  workItemHash: SHA.workItem,
  creditEstimateId: 'credit_estimate_0001',
  creditReservationId: 'credit_reservation_0001',
  workerLeaseId: 'worker_lease_0001',
  idempotencyKey: 'rembg_operation_attempt_0001',
  artifactBindings: [{
    artifactId: source.frameArtifactId,
    kind: 'image',
    sha256: source.frameArtifactSha256,
    byteLength: source.frameArtifactByteLength,
  }],
  settings: {
    confidenceThreshold: 0.5,
    alphaMatteMode: 'straight',
    edgeRefinementProfileId:
      'approved_u2netp_default_v1',
    maximumSubjects: 1,
  },
  modelManifestId: `modelmanifest_${SHA.manifest}`,
}

const candidate =
  createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
  })
const runtimeRequestCandidate =
  await createCanonicalRembgGpuRuntimeRequestCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
  })
const controlledPrivateOutputs =
  makeControlledPrivateOutputs(
    runtimeRequestCandidate.runnerRequest,
  )
const runtimeWireResponse =
  controlledRuntimeWireResponse(
    runtimeRequestCandidate.runnerRequest,
    controlledPrivateOutputs,
  )
const runtimeResultCandidate =
  await createCanonicalRembgGpuRuntimeResultCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
  })
let consumedVerifiedOutput:
  CanonicalRembgGpuVerifiedOutputPayload | undefined
const outputReader =
  createCanonicalRembgGpuPrivateOutputReader({
    evidenceClass: 'controlled_source_fixture',
    runtimeRequest: runtimeRequestCandidate.runnerRequest,
    runtimeWireResponse,
    readServerOwnedOutputs: async () =>
      clonePrivateOutputs(controlledPrivateOutputs),
  })
const outputConsumer =
  createCanonicalRembgGpuVerifiedOutputConsumer(
    async (payload) => {
      consumedVerifiedOutput = {
        maskPng: Buffer.from(payload.maskPng),
        maskAnalysisJson:
          Buffer.from(payload.maskAnalysisJson),
        maskQaMeasurementJson:
          Buffer.from(payload.maskQaMeasurementJson),
        verification: payload.verification,
      }
    },
  )
const privateOutputVerification =
  await verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader,
    outputConsumer,
  })

assert.equal(
  candidate.admissionClass,
  'controlled_non_executable_rembg_gpu_source_frame_preflight',
)
assert.equal(candidate.identity.approvedToolId, 'rembg')
assert.equal(
  candidate.identity.approvedOperationId,
  'tool.rembg.remove_image_background.v1',
)
assert.equal(
  candidate.modelArtifactBinding.modelFamily,
  'u2netp',
)
assert.equal(
  candidate.modelArtifactBinding.executionTarget,
  'google_cloud_run_gpu',
)
assert.equal(
  candidate.modelArtifactBinding.cloudRunAccelerator,
  'nvidia_l4',
)
assert.equal(candidate.modelArtifactBinding.cpuFallbackAllowed, false)
assert.equal(candidate.source.masterFrameIndex, 12)
assert.equal(candidate.source.sourceFrameIndex, 12)
assert.equal(candidate.source.frameWidth, 4)
assert.equal(candidate.source.frameHeight, 3)
assert.equal(candidate.source.frameOpaquePixelCount, 12)
assert.equal(
  candidate.source.frameArtifactType,
  'approved_exact_source_frame_png',
)
assert.equal(candidate.settings.device, 'cuda')
assert.equal(candidate.settings.outputMode, 'mask_only_png')
assert.equal(candidate.expectedOutputs.length, 1)
assert.equal(candidate.processBoundEvidenceReceipts.length, 2)
assert.equal(
  candidate.expectedOutputs[0].artifactKind,
  'mask_image',
)
assert.equal(
  candidate.expectedOutputs[0].contentType,
  'image/png',
)
assert.deepEqual(candidate.requiredQaGates, [
  'mask_edge_quality',
  'mask_subject_coverage',
])
assert.equal(
  candidate.boundaries.existingCpuFixtureProductionAuthority,
  false,
)
assert.equal(candidate.boundaries.cpuExecutionAccepted, false)
assert.equal(
  candidate.boundaries
    .sourceFrameExtractionArtifactAdmissionVerified,
  true,
)
assert.equal(candidate.boundaries.cloudDispatchAuthorized, false)
assert.equal(candidate.boundaries.modelInferenceAuthority, false)
assert.equal(candidate.boundaries.workGraphAuthority, false)
assert.equal(candidate.boundaries.productionReady, false)
assert.deepEqual(
  assertCanonicalRembgExactSourceFrameArtifactBinding(
    structuredClone(sourceArtifactBinding),
  ),
  sourceArtifactBinding,
)
assert.deepEqual(
  assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet: structuredClone(requirementSet),
    requirementProjection: structuredClone(projection),
    gpuBundle: structuredClone(gpuBundle),
    sourceArtifactBinding:
      structuredClone(sourceArtifactBinding),
    operationRequest: structuredClone(operationRequest),
  }),
  candidate,
)
assert.deepEqual(
  await assertCanonicalRembgGpuRuntimeRequestCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    candidate: structuredClone(runtimeRequestCandidate),
  }),
  runtimeRequestCandidate,
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.operationId,
  'tool.rembg.remove_image_background.v1',
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.source.contentSha256,
  frameArtifactSha256,
)
assert.equal(runtimeResultCandidate.outputCandidates.length, 1)
assert.equal(
  runtimeResultCandidate.outputCandidates[0].width,
  source.frameWidth,
)
assert.equal(
  runtimeResultCandidate.outputCandidates[0].height,
  source.frameHeight,
)
assert.deepEqual(
  runtimeResultCandidate.outputCandidates[0].requiredQaGates,
  ['mask_edge_quality', 'mask_subject_coverage'],
)
assert.equal(
  runtimeResultCandidate.processEvidenceCandidates.length,
  2,
)
assert.equal(
  runtimeResultCandidate.boundaries.outputArtifactCommitAuthority,
  false,
)
assert.equal(
  runtimeResultCandidate.boundaries.maskEdgeQualityQaAuthority,
  false,
)
assert.equal(
  privateOutputVerification.boundaries.outputBytesRereadVerified,
  true,
)
assert.equal(
  privateOutputVerification.boundaries.maskPngIntegrityVerified,
  true,
)
assert.equal(
  privateOutputVerification.boundaries.outputArtifactCommitAuthority,
  false,
)
assert.equal(
  privateOutputVerification.boundaries.qaPassAuthority,
  false,
)
assert.equal(
  privateOutputVerification.boundaries.controlledFixtureOnly,
  true,
)
assert.equal(
  privateOutputVerification.maskVerification
    .foregroundPixelCountAtThreshold,
  6,
)
assert.equal(
  privateOutputVerification.maskVerification.uniqueMaskValueCount,
  7,
)
assert.equal(
  privateOutputVerification.processEvidenceVerification
    .qaPassAuthority,
  false,
)
assert.equal(
  consumedVerifiedOutput?.maskPng.equals(
    controlledPrivateOutputs.maskPng,
  ),
  true,
)
assert.equal(
  consumedVerifiedOutput?.verification.decodedMaskSha256,
  sha256(CONTROLLED_MASK_VALUES),
)
assert.deepEqual(
  await assertCanonicalRembgGpuRuntimeResultCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: structuredClone(runtimeResultCandidate),
  }),
  runtimeResultCandidate,
)

const rembgProfile = getProductionToolProfile('rembg')
assert.equal(rembgProfile?.workerType, 'gpu_ai_worker')
assert.equal(rembgProfile?.gpuRequired, true)
assert.equal(rembgProfile?.cpuAllowed, false)
assert.equal(
  resolveProfessionalToolOperationSpec('rembg')
    ?.allowedOperationIds[0],
  'tool.rembg.remove_image_background.v1',
)

const privateArtifactRoot = await mkdtemp(join(
  tmpdir(),
  'weeditpro-rembg-exact-frame-',
))
try {
  await persistCanonicalPrivateImageArtifact({
    localStorageRoot: privateArtifactRoot,
    privateObjectIdentityHash: SHA.objectIdentity,
    contentType: 'image/png',
    bytes: framePng,
    expectedSha256: frameArtifactSha256,
  })
  const persistedSourceFrameArtifact =
    persistedArtifactResultSchema.parse({
      artifactId: dependencyRead.artifactId,
      identity: {
        workspaceId: 'workspace_0001',
        projectId: 'project_0001',
        editSessionId: 'edit_session_0001',
        snapshotId: operationRequest.approvedSnapshotId,
        jobId: dependencyRead.dependencyJobId,
        expectedAssetId: dependencyRead.expectedAssetId,
      },
      lineage: {
        assetId: dependencyRead.expectedAssetId,
        outputKey:
          extractionWorkItem.expectedOutputs[0]!.outputKey,
        artifactType: 'approved_exact_source_frame_png',
        assetRole: 'processed',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/png',
        segmentIds: ['segment-0001'],
        timingIds: ['timing-0001'],
        rendererLayerIds: ['layer-0001'],
        approvedWorkItemId: operationRequest.workItemId,
        workItemKey: extractionWorkItem.workItemKey,
        jobType: 'process_image_asset',
        jobAuthorityHash: SHA.extractionLease,
        snapshotHash: operationRequest.approvedSnapshotHash,
        approvedAssetManifestHash: SHA.manifest,
      },
      artifactVersion: 1,
      attemptKind: 'initial',
      content: {
        sha256: frameArtifactSha256,
        byteLength: framePng.byteLength,
        contentType: 'image/png',
      },
      storageIdentity: {
        storageKind: 'private_local_test',
        opaqueObjectIdentityHash: SHA.objectIdentity,
      },
      placeholder: {
        isPlaceholder: false,
        scope: 'none',
      },
      actualRunEvidence: {
        state: 'actual_run_evidence_verified_v2',
        executionAttemptId:
          dependencyRead.sourceExecutionAttemptId,
        runnerClass: 'offline_media_binary_execution_v1',
        runnerEvidenceHash: SHA.dependencyRead,
        startedAt: '2026-07-28T12:00:00.000Z',
        finishedAt: '2026-07-28T12:00:01.000Z',
        exitCode: 0,
        toolIds: ['ffmpeg'],
        actualRunVerified: true,
        dispatchGrantId: 'dispatch_grant_0001',
        runtimeAuthorityHash: SHA.attemptPlan,
        runtimeImageIdentityHash: SHA.target,
        executionAttestationHash: SHA.cloudRunRequest,
      },
      resultEvidenceRef: {
        sha256: SHA.descriptor,
        byteLength: 64,
      },
      resultEvidenceHash: SHA.descriptor,
      evidenceClass: 'private_internal_test_attested',
      liveRuntimeEligible: false,
      createdAt: '2026-07-28T12:00:02.000Z',
    })
  const verifiedPrivateSourceFrame =
    await verifyCanonicalPrivateImageArtifact({
      localStorageRoot: privateArtifactRoot,
      artifact: persistedSourceFrameArtifact,
    })
  assert.equal(
    verifiedPrivateSourceFrame.sha256,
    frameArtifactSha256,
  )
  assert.equal(
    verifiedPrivateSourceFrame.runnerClass,
    'offline_media_binary_execution_v1',
  )
  await assert.rejects(
    () => verifyCanonicalPrivateImageArtifact({
      localStorageRoot: privateArtifactRoot,
      artifact: {
        ...persistedSourceFrameArtifact,
        lineage: {
          ...persistedSourceFrameArtifact.lineage,
          artifactType: 'generic_image_png',
        },
      },
    }),
    /canonical FFmpeg source-frame artifact/u,
  )
  await persistCanonicalPrivateImageArtifact({
    localStorageRoot: privateArtifactRoot,
    privateObjectIdentityHash: SHA.storageIdentity,
    contentType: 'image/png',
    bytes: nonOpaqueFramePng,
    expectedSha256: sha256(nonOpaqueFramePng),
  })
  await assert.rejects(
    () => verifyCanonicalPrivateImageArtifact({
      localStorageRoot: privateArtifactRoot,
      artifact: {
        ...persistedSourceFrameArtifact,
        content: {
          ...persistedSourceFrameArtifact.content,
          sha256: sha256(nonOpaqueFramePng),
          byteLength: nonOpaqueFramePng.byteLength,
        },
        storageIdentity: {
          ...persistedSourceFrameArtifact.storageIdentity,
          opaqueObjectIdentityHash: SHA.storageIdentity,
        },
      },
    }),
    /non-opaque source pixels/u,
  )
} finally {
  await rm(privateArtifactRoot, {
    recursive: true,
    force: true,
  })
}

let adversarialAssertions = 0

expectRejects(
  () => verifyCanonicalRembgGray8MaskPng(
    flipByte(controlledPrivateOutputs.maskPng, 40),
    {
      expectedWidth: source.frameWidth,
      expectedHeight: source.frameHeight,
      maximumPixelCount: 16_777_216,
    },
  ),
  'private mask CRC tamper',
  'rembg_mask_png_chunk_crc_invalid',
)
expectRejects(
  () => verifyCanonicalRembgGray8MaskPng(
    Buffer.concat([
      controlledPrivateOutputs.maskPng.subarray(0, 33),
      pngChunk('ABCD', Buffer.alloc(0)),
      controlledPrivateOutputs.maskPng.subarray(33),
    ]),
    {
      expectedWidth: source.frameWidth,
      expectedHeight: source.frameHeight,
      maximumPixelCount: 16_777_216,
    },
  ),
  'private mask unknown critical chunk',
  'rembg_mask_png_unsupported_critical_chunk',
)
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader,
    outputConsumer:
      createCanonicalRembgGpuVerifiedOutputConsumer(
        async () => undefined,
      ),
  }),
  'private output reader replay',
  'rembg_private_output_reader_not_admitted',
)
const copiedReader =
  createCanonicalRembgGpuPrivateOutputReader({
    evidenceClass: 'controlled_source_fixture',
    runtimeRequest: runtimeRequestCandidate.runnerRequest,
    runtimeWireResponse,
    readServerOwnedOutputs: async () =>
      clonePrivateOutputs(controlledPrivateOutputs),
  })
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader: {
      ...copiedReader,
    },
    outputConsumer:
      createCanonicalRembgGpuVerifiedOutputConsumer(
        async () => undefined,
      ),
  }),
  'copied private output reader',
  'rembg_private_output_reader_not_admitted',
)
const wrongMaskReader =
  createCanonicalRembgGpuPrivateOutputReader({
    evidenceClass: 'controlled_source_fixture',
    runtimeRequest: runtimeRequestCandidate.runnerRequest,
    runtimeWireResponse,
    readServerOwnedOutputs: async () => ({
      ...clonePrivateOutputs(controlledPrivateOutputs),
      maskPng: flipByte(
        controlledPrivateOutputs.maskPng,
        controlledPrivateOutputs.maskPng.byteLength - 5,
      ),
    }),
  })
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader: wrongMaskReader,
    outputConsumer:
      createCanonicalRembgGpuVerifiedOutputConsumer(
        async () => undefined,
      ),
  }),
  'private mask receipt mismatch',
  'rembg_private_output_mask_receipt_mismatch',
)
const forgedConsumer =
  createCanonicalRembgGpuVerifiedOutputConsumer(
    async () => undefined,
  )
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader:
      createCanonicalRembgGpuPrivateOutputReader({
        evidenceClass: 'controlled_source_fixture',
        runtimeRequest:
          runtimeRequestCandidate.runnerRequest,
        runtimeWireResponse,
        readServerOwnedOutputs: async () =>
          clonePrivateOutputs(controlledPrivateOutputs),
      }),
    outputConsumer: {
      ...forgedConsumer,
    },
  }),
  'copied verified output consumer',
  'rembg_verified_output_consumer_not_admitted',
)
const failingConsumer =
  createCanonicalRembgGpuVerifiedOutputConsumer(
    async () => {
      throw new Error('controlled consumer failure')
    },
  )
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: runtimeResultCandidate,
    outputReader:
      createCanonicalRembgGpuPrivateOutputReader({
        evidenceClass: 'controlled_source_fixture',
        runtimeRequest:
          runtimeRequestCandidate.runnerRequest,
        runtimeWireResponse,
        readServerOwnedOutputs: async () =>
          clonePrivateOutputs(controlledPrivateOutputs),
      }),
    outputConsumer: failingConsumer,
  }),
  'verified output consumer failure',
  'rembg_verified_output_consumer_failed',
)
const promotedQaOutputs =
  makeControlledPrivateOutputs(
    runtimeRequestCandidate.runnerRequest,
    { qaPassAuthority: true },
  )
const promotedQaWireResponse =
  controlledRuntimeWireResponse(
    runtimeRequestCandidate.runnerRequest,
    promotedQaOutputs,
  )
const promotedQaResultCandidate =
  await createCanonicalRembgGpuRuntimeResultCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse: promotedQaWireResponse,
  })
await expectRejectsAsync(
  () => verifyCanonicalRembgGpuPrivateOutputs({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse: promotedQaWireResponse,
    resultCandidate: promotedQaResultCandidate,
    outputReader:
      createCanonicalRembgGpuPrivateOutputReader({
        evidenceClass: 'controlled_source_fixture',
        runtimeRequest:
          runtimeRequestCandidate.runnerRequest,
        runtimeWireResponse: promotedQaWireResponse,
        readServerOwnedOutputs: async () =>
          clonePrivateOutputs(promotedQaOutputs),
      }),
    outputConsumer:
      createCanonicalRembgGpuVerifiedOutputConsumer(
        async () => undefined,
      ),
  }),
  'process QA authority promotion',
  'rembg_private_output_qa_measurement_invalid',
)

await expectRejectsAsync(
  () => createCanonicalRembgGpuRuntimeResultCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse: {
      ...runtimeWireResponse,
      outputs: [{
        ...runtimeWireResponse.outputs[0],
        width: source.frameWidth + 1,
      }],
    },
  }),
  'runtime mask dimension substitution',
  'rembg_gpu_runtime_result_request_lineage_mismatch',
)
await expectRejectsAsync(
  () => assertCanonicalRembgGpuRuntimeRequestCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    candidate: {
      ...structuredClone(runtimeRequestCandidate),
      boundaries: {
        ...runtimeRequestCandidate.boundaries,
        cloudDispatchAuthorized: true,
      },
    },
  }),
  'runtime request authority forgery',
  'rembg_gpu_runtime_request_candidate_mismatch',
)
await expectRejectsAsync(
  () => assertCanonicalRembgGpuRuntimeResultCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
    runtimeRequestCandidate,
    runtimeWireResponse,
    resultCandidate: {
      ...structuredClone(runtimeResultCandidate),
      boundaries: {
        ...runtimeResultCandidate.boundaries,
        outputArtifactCommitAuthority: true,
      },
    },
  }),
  'runtime result authority forgery',
  'rembg_gpu_runtime_result_candidate_mismatch',
)

expectRejects(
  () => assertCanonicalRembgModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    rawModelPath: '/tmp/u2netp.onnx',
  }),
  'unknown model path',
  'rembg_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalRembgModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    requirementSetDigestSha256: 'f'.repeat(64),
  }),
  'requirement digest',
  'rembg_model_artifact_requirement_set_mismatch',
)
expectRejects(
  () => projectCanonicalRembgGpuBundleRequirements({
    requirementSet,
    locator: {
      ...locator,
      contentSha256: 'f'.repeat(64),
    },
  }),
  'wrong locator checksum',
  'rembg_model_artifact_locator_invalid',
)
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding: {
      ...sourceAssetBinding,
      sourceFrameSelectionDigestSha256: 'bad',
    },
    extractionWorkItem,
    dependencyRead,
  }),
  'invalid frame selection digest',
  'rembg_exact_source_frame_artifact_lineage_mismatch',
)
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding: {
      ...sourceAssetBinding,
      mimeType: 'video/avi',
    },
    extractionWorkItem,
    dependencyRead,
  }),
  'unsupported source content type',
  'rembg_exact_source_frame_artifact_lineage_mismatch',
)
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding,
    extractionWorkItem,
    dependencyRead: {
      ...dependencyRead,
      sha256: 'f'.repeat(64),
    },
  }),
  'source PNG digest mismatch',
  'rembg_exact_source_frame_artifact_lineage_mismatch',
)
const corruptedFramePng = Buffer.from(framePng)
corruptedFramePng[20] = corruptedFramePng[20]! ^ 1
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding,
    extractionWorkItem,
    dependencyRead: {
      ...dependencyRead,
      bytes: corruptedFramePng,
      byteLength: corruptedFramePng.byteLength,
      sha256: sha256(corruptedFramePng),
    },
  }),
  'invalid source PNG CRC',
  'Exact source-frame PNG chunk checksum is invalid',
)
const unknownCriticalChunkPng = Buffer.concat([
  framePng.subarray(0, 33),
  pngChunk('ABCD', Buffer.alloc(0)),
  framePng.subarray(33),
])
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding,
    extractionWorkItem,
    dependencyRead: {
      ...dependencyRead,
      bytes: unknownCriticalChunkPng,
      byteLength: unknownCriticalChunkPng.byteLength,
      sha256: sha256(unknownCriticalChunkPng),
    },
  }),
  'unknown critical PNG chunk',
  'Exact source-frame PNG contains an unsupported critical chunk',
)
expectRejects(
  () => createCanonicalRembgExactSourceFrameArtifactBinding({
    sourceAssetBinding,
    extractionWorkItem,
    dependencyRead: {
      ...dependencyRead,
      bytes: nonOpaqueFramePng,
      byteLength: nonOpaqueFramePng.byteLength,
      sha256: sha256(nonOpaqueFramePng),
    },
  }),
  'non-opaque source frame',
  'Exact source-frame PNG contains non-opaque source pixels',
)
expectRejects(
  () => assertCanonicalRembgExactSourceFrameArtifactBinding({
    ...structuredClone(sourceArtifactBinding),
    bindingDigestSha256: 'f'.repeat(64),
  }),
  'source binding digest',
  'rembg_exact_source_frame_artifact_binding_digest_mismatch',
)
expectRejects(
  () => assertCanonicalRembgExactSourceFrameArtifactBinding(
    rehashSourceBinding({
      ...structuredClone(sourceArtifactBinding),
      source: {
        ...sourceArtifactBinding.source,
        callerPath: '/tmp/frame.png',
      },
    }),
  ),
  'source binding caller path',
  'rembg_exact_source_frame_artifact_binding_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      artifactBindings: [{
        ...operationRequest.artifactBindings[0],
        sha256: 'f'.repeat(64),
      }],
    },
  }),
  'frame artifact checksum mismatch',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      settings: {
        ...operationRequest.settings,
        maximumSubjects: 2,
      },
    },
  }),
  'maximum subjects drift',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      modelManifestId: 'modelmanifest_forged',
    },
  }),
  'model manifest mismatch',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      device: 'cpu',
    },
  }),
  'caller CPU field',
  'rembg_professional_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      url: 'https://example.com/input.png',
    },
  }),
  'caller URL',
  'rembg_professional_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      consumerScope: 'sam2.private-inference',
    }),
  }),
  'wrong GPU consumer',
  'rembg_gpu_bundle_identity_mismatch',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      summary: {
        ...gpuBundle.summary,
        cpuFallbackAllowed: true,
      },
    }),
  }),
  'CPU fallback substitution',
  'rembg_gpu_bundle_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      expectedOutputs: [{
        ...candidate.expectedOutputs[0],
        contentType: 'application/json',
      }, ...candidate.expectedOutputs.slice(1)],
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
  }),
  'output contract substitution',
  'rembg_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      boundaries: {
        ...candidate.boundaries,
        cloudDispatchAuthorized: true,
      },
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding,
    operationRequest,
  }),
  'authority forgery',
  'rembg_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    sourceArtifactBinding: rehashSourceBinding({
      ...structuredClone(sourceArtifactBinding),
      source: {
        ...sourceArtifactBinding.source,
        sourceFrameIndex: 13,
      },
    }),
    operationRequest,
  }),
  'source parent drift',
  'rembg_gpu_execution_admission_parent_or_derived_lineage_mismatch',
)

console.log(JSON.stringify({
  ok: true,
  admissionVersion: candidate.admissionVersion,
  approvedOperationId: candidate.identity.approvedOperationId,
  modelFamily: candidate.modelArtifactBinding.modelFamily,
  modelByteLength: candidate.modelArtifactBinding.byteLength,
  masterFrameIndex: candidate.source.masterFrameIndex,
  sourceFrameIndex: candidate.source.sourceFrameIndex,
  sourceFrameContentType:
    candidate.source.frameArtifactContentType,
  outputProfile:
    candidate.expectedOutputs[0].encodingProfile,
  runtimeRequestVersion:
    runtimeRequestCandidate.runnerRequest.schemaVersion,
  runtimeResultVersion:
    runtimeResultCandidate.resultCandidateVersion,
  privateOutputVerificationVersion:
    privateOutputVerification.verificationVersion,
  privateOutputBytesRereadVerified:
    privateOutputVerification.boundaries.outputBytesRereadVerified,
  privateOutputQaPassAuthority:
    privateOutputVerification.boundaries.qaPassAuthority,
  executionTarget:
    candidate.modelArtifactBinding.executionTarget,
  cloudRunAccelerator:
    candidate.modelArtifactBinding.cloudRunAccelerator,
  cpuFallbackAllowed:
    candidate.modelArtifactBinding.cpuFallbackAllowed,
  exactProductionToolRegistryCountPreserved:
    candidate.boundaries.exactFiftyToolRegistryPreserved,
  sourceFrameExtractionArtifactAdmissionVerified:
    candidate.boundaries
      .sourceFrameExtractionArtifactAdmissionVerified,
  canonicalOperationArtifactSetVerified:
    candidate.boundaries.canonicalOperationArtifactSetVerified,
  cloudDispatchAuthorized:
    candidate.boundaries.cloudDispatchAuthorized,
  modelInferenceAuthority:
    candidate.boundaries.modelInferenceAuthority,
  productionReady: candidate.boundaries.productionReady,
  adversarialAssertions,
}, null, 2))

function createCandidate(
  overrides: Partial<{
    readonly sourceArtifactBinding:
      typeof sourceArtifactBinding
    readonly operationRequest: unknown
    readonly gpuBundle: CanonicalModelArtifactGpuBundle
  }>,
) {
  return createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle: overrides.gpuBundle ?? gpuBundle,
    sourceArtifactBinding:
      overrides.sourceArtifactBinding
      ?? sourceArtifactBinding,
    operationRequest:
      overrides.operationRequest ?? operationRequest,
  })
}

function controlledRuntimeWireResponse(
  request: typeof runtimeRequestCandidate.runnerRequest,
  outputs: CanonicalRembgGpuPrivateOutputFiles,
) {
  const maskVerification =
    verifyCanonicalRembgGray8MaskPng(outputs.maskPng, {
      expectedWidth: request.source.width,
      expectedHeight: request.source.height,
      maximumPixelCount: 16_777_216,
    })
  return {
    schemaVersion:
      'canonical-rembg-gpu-runtime-response-v1' as const,
    ok: true as const,
    status:
      'controlled_rembg_gpu_inference_completed' as const,
    operationId: request.operationId,
    admissionDigestSha256: request.admissionDigestSha256,
    requestBindingSha256: request.requestBindingSha256,
    dispatchIntentId: request.dispatch.dispatchIntentId,
    runtimeIdentity: {
      rembgVersion: '2.0.76' as const,
      onnxRuntimeGpuVersion: '1.27.0' as const,
      executionProvider: 'CUDAExecutionProvider' as const,
      providerCount: 1,
      device: 'cuda' as const,
      runtimeRegion: 'europe-west1' as const,
      cpuFallbackDisabled: true as const,
    },
    outputs: [{
      canonicalOrder: 0 as const,
      artifactKind: 'mask_image' as const,
      fileName: 'mask.png' as const,
      contentType: 'image/png' as const,
      encodingProfile: 'gray8_mask_png_v1' as const,
      byteLength: outputs.maskPng.byteLength,
      contentSha256: sha256(outputs.maskPng),
      width: request.source.width,
      height: request.source.height,
      minimumMaskValue:
        maskVerification.minimumMaskValue,
      maximumMaskValue:
        maskVerification.maximumMaskValue,
      uniqueMaskValueCount:
        maskVerification.uniqueMaskValueCount,
      transparentPixelCount:
        maskVerification.transparentPixelCount,
      partialPixelCount:
        maskVerification.partialPixelCount,
      opaquePixelCount:
        maskVerification.opaquePixelCount,
    }] as const,
    processEvidence: [
      {
        canonicalOrder: 0 as const,
        evidenceKind: 'mask_analysis_receipt' as const,
        fileName: 'mask-analysis.json' as const,
        byteLength: outputs.maskAnalysisJson.byteLength,
        contentSha256: sha256(outputs.maskAnalysisJson),
      },
      {
        canonicalOrder: 1 as const,
        evidenceKind:
          'mask_qa_measurement_receipt' as const,
        fileName: 'mask-qa-measurement.json' as const,
        byteLength: outputs.maskQaMeasurementJson.byteLength,
        contentSha256:
          sha256(outputs.maskQaMeasurementJson),
      },
    ] as const,
    receiptBoundaries: {
      outputBytesIncluded: false as const,
      sourceBytesIncluded: false as const,
      modelBytesIncluded: false as const,
      pathsIncluded: false as const,
      urlsIncluded: false as const,
      credentialsIncluded: false as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      artifactCommitAuthority: false as const,
      qaPassAuthority: false as const,
      productionReady: false as const,
    },
  }
}

function makeControlledPrivateOutputs(
  request: typeof runtimeRequestCandidate.runnerRequest,
  overrides: Partial<{
    readonly qaPassAuthority: boolean
  }> = {},
): CanonicalRembgGpuPrivateOutputFiles {
  const maskPng = makeGray8Png(
    request.source.width,
    request.source.height,
    CONTROLLED_MASK_VALUES,
  )
  const maskSha256 = sha256(maskPng)
  const analysis = {
    schemaVersion: 'rembg-u2netp-mask-analysis-v1',
    sourceArtifactSha256: request.source.contentSha256,
    sourceDecodedRgbaSha256:
      request.source.decodedRgbaSha256,
    maskSha256,
    width: request.source.width,
    height: request.source.height,
    minimumMaskValue: 0,
    maximumMaskValue: 255,
    uniqueMaskValueCount: 7,
    transparentPixelCount: 3,
    partialPixelCount: 5,
    opaquePixelCount: 4,
    confidenceThreshold: 0.5,
    thresholdMaskValue: 128,
    foregroundPixelCountAtThreshold: 6,
    maskVariationObserved: true,
  }
  const maskAnalysisJson = Buffer.from(
    stableAuthorityStringify(analysis),
    'utf8',
  )
  const qaMeasurement = {
    schemaVersion: 'rembg-mask-qa-measurement-v1',
    analysisSha256: sha256(maskAnalysisJson),
    maskSha256,
    requiredQaGates: [
      'mask_edge_quality',
      'mask_subject_coverage',
    ],
    findingCodes: [],
    measurementOnly: true,
    qaPassAuthority: overrides.qaPassAuthority ?? false,
  }
  return {
    maskPng,
    maskAnalysisJson,
    maskQaMeasurementJson: Buffer.from(
      stableAuthorityStringify(qaMeasurement),
      'utf8',
    ),
  }
}

function clonePrivateOutputs(
  value: CanonicalRembgGpuPrivateOutputFiles,
): CanonicalRembgGpuPrivateOutputFiles {
  return {
    maskPng: Buffer.from(value.maskPng),
    maskAnalysisJson: Buffer.from(value.maskAnalysisJson),
    maskQaMeasurementJson:
      Buffer.from(value.maskQaMeasurementJson),
  }
}

function controlledRembgGpuBundle():
CanonicalModelArtifactGpuBundle {
  const descriptor = requirementSet.descriptor
  const artifactDraft = {
    canonicalOrder: 0,
    slotId: 'rembg_u2netp_onnx',
    locator,
    descriptorDigestSha256: SHA.descriptor,
    objectIdentityDigestSha256: SHA.objectIdentity,
    artifactId: descriptor.artifactId,
    revision: descriptor.revision,
    artifactFormat: descriptor.artifactFormat,
    artifactRole: descriptor.artifactRole,
    modelFamily: descriptor.modelFamily,
    byteLength: descriptor.byteLength,
    contentSha256: descriptor.contentSha256,
    repositoryAdmission: descriptor.repositoryAdmission,
    sourceObservationDigestSha256:
      descriptor.sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      descriptor.reviewEvidenceDigestSha256,
    securityReviewDigestSha256:
      descriptor.securityReviewDigestSha256,
    licensePolicyDigestSha256:
      sha256AuthorityValue(descriptor.licensePolicy),
    commercialUseStatus:
      descriptor.licensePolicy.commercialUseStatus,
    reviewStatus: descriptor.licensePolicy.reviewStatus,
    paidProductionUseApproved:
      descriptor.licensePolicy.paidProductionUseApproved,
    consumerScopeVerified: true as const,
    executionClass: 'gpu_required' as const,
    requiredExecutionTarget:
      'google_cloud_run_gpu' as const,
    accelerator: 'cuda' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    fullRepositoryChecksumVerified: true as const,
    required: true as const,
  }
  const artifact:
  CanonicalModelArtifactGpuBundleArtifact = {
    ...artifactDraft,
    artifactBindingDigestSha256:
      sha256AuthorityValue(artifactDraft),
  }
  const identity = {
    dispatchIntentId: 'dispatch_intent_rembg_0001',
    dispatchBindingHash: SHA.dispatchBinding,
    attemptPlanHash: SHA.attemptPlan,
    handoffManifestHash: SHA.handoffManifest,
    manifestEntryHash: SHA.manifestEntry,
    queueDefinitionHash: SHA.queueDefinition,
    regionAuthorityHash: SHA.regionAuthority,
    jobId: 'gpu_job_rembg_0001',
    deliveryAttempt: 1,
    approvedToolId: 'rembg',
    approvedToolOperationId:
      'tool.rembg.remove_image_background.v1',
    runtimeRegion: 'us-east1' as const,
    targetHash: SHA.target,
    cloudRunJobResourceName:
      'projects/weeditpro-internal/locations/us-east1/jobs/weeditpro-gpu-ai-worker',
    cloudRunJobRequestSha256: SHA.cloudRunRequest,
    workerServiceAccountEmail:
      'gpu-worker@weeditpro-internal.iam.gserviceaccount.com',
  }
  const requirementsDigestSha256 =
    sha256AuthorityValue([requirementProjection(artifact)])
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity,
      consumerScope: 'rembg.private-inference',
      requirementsDigestSha256,
    }).slice(0, 32)}`
  const bundleDraft = {
    bundleVersion:
      'canonical-model-artifact-gpu-bundle-v1' as const,
    bundleClass:
      'verified_server_resolved_model_artifact_gpu_bundle' as const,
    source:
      'canonical_model_artifact_repository_and_cloud_dispatch_attempt' as const,
    bundleId,
    identity,
    consumerScope: 'rembg.private-inference',
    requirementsDigestSha256,
    artifacts: [artifact],
    summary: {
      artifactCount: 1,
      totalByteLength: descriptor.byteLength,
      allArtifactsRequired: true as const,
      allArtifactIdentitiesUnique: true as const,
      allArtifactSlotsUnique: true as const,
      allArtifactsRepositoryVerified: true as const,
      allArtifactsGpuOnly: true as const,
      allArtifactsCudaRequired: true as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    execution: {
      workerType: 'gpu_ai_worker' as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      cloudRunAccelerator: 'nvidia_l4' as const,
      modelAccelerator: 'cuda' as const,
      gpuCount: 1 as const,
      noGpuZonalRedundancy: true as const,
      taskCount: 1 as const,
      parallelism: 1 as const,
      cloudRunInternalMaxRetries: 0 as const,
      packageQueueOwnsApprovedAttempts: true as const,
      workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    },
    blockers: [
      'canonical_operation_model_artifact_set_not_verified',
      'cloud_run_gpu_job_deployment_not_verified',
      'cloud_run_read_only_model_mount_not_verified',
      'deployed_gpu_capacity_not_verified',
      'distributed_model_artifact_repository_not_implemented',
      'model_artifact_paid_production_license_not_approved',
      'model_artifact_repository_admission_not_production_reviewed',
      'private_generation_bound_model_artifact_distribution_not_verified',
      'worker_service_identity_and_iam_not_verified',
    ],
    boundaries: {
      exactApprovedPackageAttemptBound: true as const,
      cloudTaskBodyContainsModelArtifactData: false as const,
      cloudRunEnvironmentContainsModelArtifactData: false as const,
      callerBytesAccepted: false as const,
      callerPathAccepted: false as const,
      callerUrlAccepted: false as const,
      credentialsIncluded: false as const,
      canonicalOperationArtifactSetVerified: false as const,
      privateGcsDistributionVerified: false as const,
      cloudRunReadOnlyMountVerified: false as const,
      workerServiceIdentityVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      deployedGpuCapacityVerified: false as const,
      remoteMutationAuthorized: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      operationAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      customerPriceAuthority: false as const,
      customerCreditAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...bundleDraft,
    bundleDigestSha256: sha256AuthorityValue(bundleDraft),
  }
}

function requirementProjection(
  artifact: CanonicalModelArtifactGpuBundleArtifact,
): CanonicalModelArtifactGpuBundleRequirement {
  return {
    canonicalOrder: artifact.canonicalOrder,
    slotId: artifact.slotId,
    locator: artifact.locator,
    expectedArtifactId: artifact.artifactId,
    expectedRevision: artifact.revision,
    expectedArtifactFormat: artifact.artifactFormat,
    expectedArtifactRole: artifact.artifactRole,
    expectedModelFamily: artifact.modelFamily,
    expectedByteLength: artifact.byteLength,
    expectedContentSha256: artifact.contentSha256,
    required: true,
  }
}

function rehashBundle(
  value: Record<string, unknown>,
): CanonicalModelArtifactGpuBundle {
  const draft = { ...value }
  delete draft.bundleDigestSha256
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  } as unknown as CanonicalModelArtifactGpuBundle
}

function rehashCandidate(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.admissionDigestSha256
  return {
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  }
}

function rehashSourceBinding(
  value: Record<string, unknown>,
): typeof sourceArtifactBinding {
  const draft = { ...value }
  delete draft.bindingDigestSha256
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  } as unknown as typeof sourceArtifactBinding
}

function makeRgbaPng(
  width: number,
  height: number,
  alpha = 255,
): Buffer {
  const rowBytes = width * 4
  const scanlines = Buffer.alloc((rowBytes + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (rowBytes + 1)
    scanlines[rowOffset] = 0
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + (x * 4)
      scanlines[pixelOffset] =
        (x * 61 + y * 17) & 0xff
      scanlines[pixelOffset + 1] =
        (x * 23 + y * 83) & 0xff
      scanlines[pixelOffset + 2] =
        (x * 97 + y * 31) & 0xff
      scanlines[pixelOffset + 3] = alpha
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function makeGray8Png(
  width: number,
  height: number,
  pixels: Buffer,
): Buffer {
  assert.equal(pixels.byteLength, width * height)
  const scanlines = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width + 1)
    scanlines[rowOffset] = 0
    pixels.copy(
      scanlines,
      rowOffset + 1,
      y * width,
      (y + 1) * width,
    )
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 0
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function flipByte(bytes: Buffer, offset: number): Buffer {
  const copy = Buffer.from(bytes)
  copy[offset] = copy[offset]! ^ 1
  return copy
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.length)
  chunk.writeUInt32BE(data.length, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.length,
  )
  return chunk
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function expectRejects(
  operation: () => unknown,
  label: string,
  code: string,
): void {
  assert.throws(
    operation,
    (error: unknown) => {
      assert.equal(error instanceof Error, true, `${label}: Error`)
      assert.equal(
        (error as Error).message.includes(code),
        true,
        `${label}: ${String((error as Error).message)}`,
      )
      return true
    },
    label,
  )
  adversarialAssertions += 1
}

async function expectRejectsAsync(
  operation: () => Promise<unknown>,
  label: string,
  code: string,
): Promise<void> {
  await assert.rejects(
    operation,
    (error: unknown) => {
      assert.equal(error instanceof Error, true, `${label}: Error`)
      assert.equal(
        (error as Error).message.includes(code),
        true,
        `${label}: ${String((error as Error).message)}`,
      )
      return true
    },
    label,
  )
  adversarialAssertions += 1
}
