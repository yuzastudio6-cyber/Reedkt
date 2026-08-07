import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import type {
  CanonicalBrollCaptionInspectionSourceAuthority,
} from '../../src/types/canonical-broll-caption-inspection-source-authority'
import type {
  CanonicalCaptionBrollApprovedRunReviewAuthority,
} from '../internal-testing/canonical-caption-broll-approved-run-harness'
import {
  buildCanonicalCaptionBrollApprovedRunCreativeReview,
} from '../internal-testing/canonical-caption-broll-approved-run-creative-review'
import {
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { BROLL_CAPTION_OWNER_MANIFEST_REF } from
  '../edit-skills/b-roll/b-roll-caption-public-contract'
import {
  BROLL_CAPABILITY_MANIFEST,
  brollRemotionLayerManifestSchema,
  createBrollRemotionPreviewProxyManifest,
} from '../edit-skills/b-roll'
import type {
  BrollRemotionLayerManifest,
} from '../edit-skills/b-roll'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  parseCanonicalBrollCaptionInspectionSourceAuthority,
} from '../services/canonical-broll-caption-owner-service'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  verifyCanonicalSourceLedContentAnalysisEvidence,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createCanonicalCaptionTranscriptOwnerReadFixture,
  createCanonicalSourceAnalysisAuthorityFixture,
} from './fixtures/canonical-source-led-content-analysis-authority-fixture'

const DURATION_FRAMES = 120
const MASTER_START_FRAME = 300
const MASTER_END_FRAME_EXCLUSIVE = MASTER_START_FRAME + DURATION_FRAMES
const TRANSCRIPT =
  "Hey guys — today. I'm launching my new AI software."
let assertions = 0

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

function expectThrow(action: () => unknown, pattern: RegExp): void {
  assert.throws(action, pattern)
  assertions += 1
}

function sha(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string, version: string, contentHash = sha(
  `${id}:${version}`,
)) {
  return { id, version, contentHash }
}

function ownerResultFixture(
  layoutOccupancyDigestSha256: string,
): BrollCaptionOwnerReadResult {
  const approvedSnapshotRef = ref(
    'snapshot.caption-approved-run.v3',
    'private-edit-authority-approved-snapshot-v3',
  )
  const outputFrameRef = ref(
    'output-frame.caption-approved-run.4k',
    'canonical-confirmed-output-frame-authority-v1',
  )
  const masterTimingRef = ref(
    'master-timing.caption-approved-run.v1',
    'master_timing_plan_v1',
  )
  const request = createCaptionBrollOwnerReadRequest({
    requestId: 'request.caption-approved-run.broll.v1',
    brollManifestRef: structuredClone(
      BROLL_CAPTION_OWNER_MANIFEST_REF),
    canonicalScope: {
      ownerUserId: 'owner.caption-approved-run',
      workspaceId: 'workspace.caption-approved-run',
      projectId: 'project.caption-approved-run',
      editSessionId: 'edit.caption-approved-run',
      planVersionId: 'plan.caption-approved-run.v1',
      approvedSnapshotRef,
      outputId: 'output.caption-approved-run',
      outputFrameRef,
      sceneId: 'scene.caption-approved-run.001',
      authorizedFrameRange: {
        startFrameInclusive: MASTER_START_FRAME,
        endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
        fps: 30,
      },
      masterTimingRef,
      masterTimingHash: masterTimingRef.contentHash,
    },
    planningConstraintRef: ref(
      'constraint.caption-approved-run.broll.v1',
      'caption-broll-planning-constraint-v1',
    ),
  })
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: 'result.caption-approved-run.broll.v1',
    ownerSkillKey: 'b_roll',
    requestingSkillKey: 'captions',
    requestedJobType: 'provide_caption_broll_composition_constraints',
    mediationMode: 'hq_mediated_owner_read',
    brollManifestRef: structuredClone(request.brollManifestRef),
    canonicalScope: structuredClone(request.canonicalScope),
    ownerRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    brollResultReceiptRef: ref(
      'receipt.caption-approved-run.broll.v1',
      'b_roll_result_receipt_v1',
    ),
    selectedMediaManifestRef: ref(
      'manifest.caption-approved-run.broll.v1',
      'b_roll_candidate_media_manifest_v1',
    ),
    layoutOccupancyRef: ref(
      'layout.caption-approved-run.broll.v1',
      'b_roll_remotion_layer_manifest_v1',
      layoutOccupancyDigestSha256,
    ),
    cropTimingRef: ref(
      'crop.caption-approved-run.broll.v1',
      'b_roll_caption_crop_timing_projection_v1',
    ),
    visibleTextEvidenceRef: ref(
      'visible.caption-approved-run.broll.v1',
      'b_roll_caption_visible_text_evidence_v1',
    ),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'evidence.caption-approved-run.broll.v1',
      'b_roll_authenticated_owner_read_evidence_v1',
    ),
    exactPrivateOwnerRereadVerified: true,
    exactCanonicalScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactOutputFrameAndMasterTimingVerified: true,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    sourceSelectionAuthorityGranted: false,
    cropOrTimingMutationAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseBrollCaptionOwnerReadResult({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resultDigestSha256: '' },
      'resultDigestSha256',
    ),
  })
}

function remotionLayerManifestFixture(
  selectedNormalizedSha256: string,
): BrollRemotionLayerManifest {
  const assignmentHash = sha('assignment.caption-approved-run.broll.v1')
  const planHash = sha('plan.caption-approved-run.broll.v1')
  const sourceArtifact = {
    artifactType: 'source_media_artifact_v1',
    sha256: sha('source.caption-approved-run.v1'),
    byteLength: 4_096,
    ownerUserId: 'owner.caption-approved-run',
    workspaceId: 'workspace.caption-approved-run',
    projectId: 'project.caption-approved-run',
  }
  const handoff = (
    artifactType:
      | 'b_roll_sound_handoff_v1'
      | 'b_roll_color_handoff_v1'
      | 'b_roll_transition_handoff_v1',
    finalOwner: 'sound' | 'color' | 'transition',
  ) => ({
    artifactType,
    ref: { sha256: sha(`${artifactType}.ref`), byteLength: 128 },
    artifactHash: sha(`${artifactType}.artifact`),
    finalOwner,
  })
  const core = {
    schemaVersion: 'b_roll_remotion_layer_manifest_v1' as const,
    assignmentReference: {
      assignmentId: 'assignment.caption-approved-run.broll.v1',
      assignmentHash,
      artifactRef: { sha256: sha('assignment.ref'), byteLength: 128 },
    },
    manifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
    planReference: {
      planId: 'plan.caption-approved-run.broll.v1',
      planHash,
      artifactRef: { sha256: sha('plan.ref'), byteLength: 128 },
    },
    selectedArtifact: {
      sourceRoute: 'existing_project_clip' as const,
      sourceId: 'source.caption-approved-run.v1',
      sourceArtifactRef: sourceArtifact,
      candidateSetId: null,
      candidateVersionId: null,
      candidateVersionNumber: null,
      candidateVersionHash: null,
      audioReviewSource: {
        artifactType: 'source_media_artifact_v1',
        privateObjectIdentityHash: null,
        sha256: sourceArtifact.sha256,
        byteLength: sourceArtifact.byteLength,
      },
      normalizedArtifact: {
        privateObjectIdentityHash: sha('normalized-private-object'),
        sha256: selectedNormalizedSha256,
        byteLength: 8_192,
        mimeType: 'video/x-nut' as const,
        frameCount: DURATION_FRAMES,
        frameRate: 30 as const,
        audioRemoved: true as const,
      },
    },
    exactTimelineRange: {
      startFrameInclusive: MASTER_START_FRAME,
      endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
      fps: 30,
    },
    sourceTrim: {
      startFrameInclusive: 0,
      endFrameExclusive: DURATION_FRAMES,
      fps: 30,
    },
    crop: {
      mode: 'contain' as const,
      cropSafeSubjectArea:
        'Preserve the complete source subject inside the full-frame cutaway.',
      finalCropOwner: 'render' as const,
    },
    scale: 1 as const,
    position: {
      mode: 'absolute' as const,
      xPercent: 0 as const,
      yPercent: 0 as const,
      widthPercent: 100 as const,
      heightPercent: 100 as const,
      opacity: 1 as const,
    },
    displayTreatment: 'full_frame_cutaway' as const,
    speakerVisibilityIntent: 'temporarily_hidden' as const,
    captionSafeBehavior: {
      directive:
        'Respect every caption reserved zone; report any layout change to Captions.',
      captionOverlayRef: {
        artifactType: 'caption_overlay_png_v1',
        sha256: sha('caption-overlay'),
        byteLength: 4_096,
        ownerUserId: 'owner.caption-approved-run',
        workspaceId: 'workspace.caption-approved-run',
        projectId: 'project.caption-approved-run',
      },
      reservedZoneCount: 1,
      collisionPolicy: 'caption_reserved_zone_contract_v1' as const,
      captionLayerOrder: 100 as const,
      finalOwner: 'captions' as const,
      brollMayMutateCaptions: false as const,
    },
    layerOrder: 10 as const,
    audioDisposition: 'retain_source_audio' as const,
    transitionHandoff: handoff(
      'b_roll_transition_handoff_v1', 'transition'),
    colorHandoff: handoff('b_roll_color_handoff_v1', 'color'),
    soundHandoff: handoff('b_roll_sound_handoff_v1', 'sound'),
    trackGraphRef: null,
    outputQaRef: { sha256: sha('output-qa.ref'), byteLength: 128 },
    outputQaHash: sha('output-qa'),
    rendererOwner: 'render' as const,
    finalCompositionOwnedByBroll: false as const,
    privatePreviewOnly: true as const,
    outsideAuthorizedRangeModified: false as const,
  }
  return brollRemotionLayerManifestSchema.parse({
    ...core,
    layerManifestHash: hashSkillValue(core),
  })
}

function approvedRunAuthority(
  ownerResult: BrollCaptionOwnerReadResult,
): CanonicalCaptionBrollApprovedRunReviewAuthority {
  return {
    canonicalScope: {
      ownerUserId: ownerResult.canonicalScope.ownerUserId,
      workspaceId: ownerResult.canonicalScope.workspaceId,
      projectId: ownerResult.canonicalScope.projectId,
      editSessionId: ownerResult.canonicalScope.editSessionId,
      planVersionId: ownerResult.canonicalScope.planVersionId,
      approvedSnapshotRef: structuredClone(
        ownerResult.canonicalScope.approvedSnapshotRef,
      ),
      outputId: ownerResult.canonicalScope.outputId,
      sceneId: ownerResult.canonicalScope.sceneId,
      authorizedFrameRanges: [{
        startFrame: MASTER_START_FRAME,
        endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
      }],
    },
    approvedRunLineage: {
      approvedSnapshotRef: structuredClone(
        ownerResult.canonicalScope.approvedSnapshotRef,
      ),
      executionPackageRef: ref(
        'package.caption-approved-run.v5',
        'canonical-approved-edit-execution-package-v5',
      ),
      captionPlanningProjectionRef: ref(
        'caption.projection.approved-run.v3',
        'canonical-caption-specialist-planning-projection-v3',
      ),
      captionPlanningBindingRef: ref(
        'caption.binding.approved-run.v3',
        'canonical-caption-specialist-planning-binding-v3',
      ),
      captionRenderedMediaWorkBindingRef: ref(
        'caption.rendered-media.approved-run.v1',
        'canonical-caption-rendered-media-work-binding-v1',
      ),
      exactImmutableApprovedRunRereadVerified: true,
      creativeReviewSupplementsCanonicalFinalCanvas: true,
      creativeReviewReplacesCanonicalFinalCanvas: false,
    },
    confirmedOutputFrame: {
      frameRef: structuredClone(ownerResult.canonicalScope.outputFrameRef),
      outputId: ownerResult.canonicalScope.outputId,
      width: 3_840,
      height: 2_160,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      fpsNumerator: 30,
      fpsDenominator: 1,
    },
    masterTimingRef: structuredClone(
      ownerResult.canonicalScope.masterTimingRef,
    ),
    masterTimingHash: ownerResult.canonicalScope.masterTimingHash,
    exactAuthorityDerivedFromCanonicalApprovedRun: true,
  }
}

function inspectionSourceAuthority(
  ownerResult: BrollCaptionOwnerReadResult,
  selectedNormalizedSha256: string,
): CanonicalBrollCaptionInspectionSourceAuthority {
  const core = {
    schemaVersion:
      'canonical-broll-caption-inspection-source-authority-v1' as const,
    authorityId: 'broll.caption.inspection-source.approved-run.v1',
    canonicalScope: structuredClone(ownerResult.canonicalScope),
    ownerRequestRef: structuredClone(ownerResult.ownerRequestRef),
    ownerResultRef: ref(
      ownerResult.resultId,
      ownerResult.schemaVersion,
      ownerResult.resultDigestSha256,
    ),
    brollAssignmentRef: ref(
      'assignment.caption-approved-run.broll.v1',
      'b_roll_skill_assignment_v1',
      sha('assignment.caption-approved-run.broll.v1'),
    ),
    brollPlanRef: ref(
      'plan.caption-approved-run.broll.v1',
      'b_roll_plan_artifact_v1',
      sha('plan.caption-approved-run.broll.v1'),
    ),
    brollApprovedWorkGraphRef: ref(
      'graph.caption-approved-run.broll.public.v1',
      'edit_skill_approved_work_graph_v1',
    ),
    brollCanonicalWorkGraphRef: ref(
      'graph.caption-approved-run.broll.canonical.v1',
      'b_roll_canonical_work_graph_v1',
    ),
    brollResultReceiptRef: structuredClone(
      ownerResult.brollResultReceiptRef,
    ),
    selectedMediaManifestRef: structuredClone(
      ownerResult.selectedMediaManifestRef,
    ),
    layoutOccupancyRef: structuredClone(ownerResult.layoutOccupancyRef),
    privateVisualReviewRef: ref(
      'review.caption-approved-run.broll.v1',
      'b_roll_authenticated_owner_read_evidence_v1',
    ),
    previewArtifactRef: ref(
      'preview.caption-approved-run.broll.v1',
      'b_roll_private_preview_media_manifest_v1',
    ),
    integrationQaRef: ref(
      'qa.caption-approved-run.broll.v1',
      'b_roll_integration_qa_v1',
    ),
    selectedNormalizedArtifactRef: ref(
      'normalized.caption-approved-run.broll.v1',
      'b_roll_selected_normalized_media_v1',
      selectedNormalizedSha256,
    ),
    selectedNormalizedArtifact: {
      privateObjectIdentityDigestSha256: sha('normalized-private-object'),
      byteLength: 8_192,
      mimeType: 'video/x-nut' as const,
      frameCount: DURATION_FRAMES,
      frameRate: 30 as const,
      audioRemoved: true as const,
    },
    selectedSourceRoute: 'existing_project_clip' as const,
    exactCanonicalBrollWorkAndArtifactRereadVerified: true as const,
    exactPrivateVisualReviewRereadVerified: true as const,
    exactSelectedNormalizedArtifactIdentityVerified: true as const,
    persistedCreateOnlyAndExactReread: true as const,
    mediaBytesIncluded: false as const,
    mediaLocatorIncluded: false as const,
    rawChatIncluded: false as const,
    credentialsIncluded: false as const,
    sourceSelectionPerformedByCaption: false as const,
    cropOrTimingPerformedByCaption: false as const,
    runtimeOrDispatchAuthorityGranted: false as const,
    assetMutationAuthorityGranted: false as const,
    finalQaApprovalGranted: false as const,
    billingAuthorityGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalBrollCaptionInspectionSourceAuthority({
    ...core,
    authorityDigestSha256: hashSkillValue(core),
  })
}

async function run(): Promise<void> {
  const proxyBytes = Buffer.alloc(4_096)
  proxyBytes.set([0x1a, 0x45, 0xdf, 0xa3])
  const proxySha256 = sha(proxyBytes)
  const selectedNormalizedSha256 = sha('approved-run-selected-normalized')
  const layerManifest = remotionLayerManifestFixture(
    selectedNormalizedSha256,
  )
  const ownerResult = ownerResultFixture(layerManifest.layerManifestHash)
  const authority = approvedRunAuthority(ownerResult)
  const sourceAuthority = inspectionSourceAuthority(
    ownerResult,
    selectedNormalizedSha256,
  )
  const proxyManifest = createBrollRemotionPreviewProxyManifest({
    schemaVersion: 'b_roll_remotion_preview_proxy_manifest_v1',
    ownerUserId: ownerResult.canonicalScope.ownerUserId,
    workspaceId: ownerResult.canonicalScope.workspaceId,
    projectId: ownerResult.canonicalScope.projectId,
    editSessionId: ownerResult.canonicalScope.editSessionId,
    assignmentId: 'assignment.caption-approved-run.broll.v1',
    assignmentHash: sha('assignment.caption-approved-run.broll.v1'),
    manifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
    planId: 'plan.caption-approved-run.broll.v1',
    planHash: sha('plan.caption-approved-run.broll.v1'),
    approvedWorkGraphHash: sha('graph.caption-approved-run.broll.v1'),
    workItemKey: 'prepare-b-roll-remotion-preview-proxy',
    workItemHash: sha('prepare-b-roll-remotion-preview-proxy'),
    sourceNormalizedSha256: selectedNormalizedSha256,
    privateObjectIdentityHash: sha('proxy-private-object'),
    objectSha256: proxySha256,
    byteLength: proxyBytes.byteLength,
    mimeType: 'video/x-matroska',
    container: 'matroska',
    frameCount: DURATION_FRAMES,
    fps: 30,
    ffmpegRequestHash: sha('proxy-request'),
    ffmpegAttestationHash: sha('proxy-attestation'),
    checksumReadbackVerified: true,
    technicalProxyOnly: true,
    creativeColorTransformApplied: false,
    audioRemoved: true,
    privateOnly: true,
    publicDeliveryAllowed: false,
    finalCustomerExport: false,
    outsideAuthorizedRangeModified: false,
  })
  const sourceAnalysisAuthority = createCanonicalSourceAnalysisAuthorityFixture({
    hasSpeech: true,
    workspaceId: ownerResult.canonicalScope.workspaceId,
    projectId: ownerResult.canonicalScope.projectId,
    editSessionId: ownerResult.canonicalScope.editSessionId,
    sourceSequenceItemId: 'source.caption-approved-run.v1',
    mediaAssetId: 'media.caption-approved-run.v1',
    checksumSha256: sha('source.caption-approved-run.v1'),
    durationFrames: DURATION_FRAMES,
    transcriptText: TRANSCRIPT,
  })
  const sourceAnalysisEvidence =
    verifyCanonicalSourceLedContentAnalysisEvidence(
      sourceAnalysisAuthority.evidence,
    )
  const transcriptSource = sourceAnalysisEvidence.sources[0]
  assert.ok(transcriptSource)
  const planningExpectationDigest = sha256AuthorityValue([{
    sourceSequenceItemId: transcriptSource.sourceSequenceItemId,
    transcriptDigestSha256:
      transcriptSource.transcript.transcriptDigestSha256,
    transcriptCoverageDigestSha256:
      transcriptSource.transcript.coverage.coverageDigestSha256,
  }])
  const planningExpectationRef = ref(
    `caption-source-transcript.${planningExpectationDigest.slice(0, 48)}`,
    'canonical-source-transcript-planning-evidence-v1',
    planningExpectationDigest,
  )
  const transcriptOwner = createCanonicalCaptionTranscriptOwnerReadFixture({
    ownerUserId: ownerResult.canonicalScope.ownerUserId,
    readSourceAnalysisAuthority: () => sourceAnalysisAuthority,
  })
  const transcript = await transcriptOwner.readExact({
    canonicalReadScope: {
      ownerUserId: ownerResult.canonicalScope.ownerUserId,
      workspaceId: ownerResult.canonicalScope.workspaceId,
      projectId: ownerResult.canonicalScope.projectId,
      editSessionId: ownerResult.canonicalScope.editSessionId,
      planVersionId: ownerResult.canonicalScope.planVersionId,
      approvedSnapshotRef: structuredClone(
        ownerResult.canonicalScope.approvedSnapshotRef,
      ),
    },
    planningExpectationRef,
  })
  assert.ok(transcript, 'Canonical transcript fixture must resolve.')

  const built = buildCanonicalCaptionBrollApprovedRunCreativeReview({
    reviewIdSeed: 'caption.approved-run.creative-review.v1',
    approvedRunAuthority: authority,
    ownerResult,
    inspectionSourceAuthority: sourceAuthority,
    remotionLayerManifest: layerManifest,
    remotionProxyManifest: proxyManifest,
    remotionProxyBytes: proxyBytes,
    transcriptRecord: transcript.transcriptRecord,
    transcriptExpectationBinding: transcript.expectationBinding,
  })
  check(built.schemaVersion ===
    'canonical-caption-broll-approved-run-creative-review-v1',
  'The builder must use a distinct internal qualification identity.')
  check(built.cueWords.length === 2
    && built.cueWords[0].map((word) => word.text).join(' ')
      === 'Hey guys — today.'
    && built.cueWords[1].map((word) => word.text).join(' ')
      === "I'm launching my new AI software.",
  'The exact canonical transcript must split at its admitted phrase boundary.')
  check(built.cueRanges[0]?.startFrame === 0
    && built.cueRanges[0]?.endFrameExclusive === 48
    && built.cueRanges[1]?.startFrame === 48
    && built.cueRanges[1]?.endFrameExclusive === DURATION_FRAMES,
  'StoryTiming-local cue ranges must exactly cover the approved scene.')
  check(built.fullSpec.layers.length === 4
    && built.fullSpec.layers.filter((layer) =>
      layer.presentationKind === 'hero_typography').map((layer) => layer.text)
      .join('|') === 'TODAY|AI SOFTWARE',
  'The builder must derive two restrained semantic hero layers.')
  check(built.fullSpec.layers.every((layer) =>
    layer.exactSourceWordIds.length > 0)
    && built.fullSpec.wordingEvidence.exactSourceWordLineageBound,
  'Every displayed Caption layer must retain exact source-word lineage.')
  check(!built.fullSpec.reducedMotion && built.reducedSpec.reducedMotion
    && built.fullRequest.payload.reducedMotion === false
    && built.reducedRequest.payload.reducedMotion === true,
  'Full and reduced-motion variants must share one exact approved source.')
  check(built.fullRequest.payload.sourceSha256 === proxySha256
    && built.fullRequest.payload.approvedSnapshotDigestSha256
      === ownerResult.canonicalScope.approvedSnapshotRef.contentHash,
  'The render request must bind exact proxy bytes and immutable snapshot.')
  check(built.exactApprovedRunAuthorityConsumed
    && !built.directPeerDispatchPerformed
    && !built.finalCanvasAuthorityGranted
    && !built.finalQaApprovalGranted
    && !built.publicDeliveryGranted
    && !built.productionAuthorityGranted,
  'The internal builder must preserve every closed authority boundary.')

  const staleTranscript = structuredClone(transcript.transcriptRecord)
  staleTranscript.canonicalTranscript.words[0]!.text = 'Forged'
  expectThrow(() => buildCanonicalCaptionBrollApprovedRunCreativeReview({
    reviewIdSeed: 'caption.approved-run.creative-review.stale-transcript',
    approvedRunAuthority: authority,
    ownerResult,
    inspectionSourceAuthority: sourceAuthority,
    remotionLayerManifest: layerManifest,
    remotionProxyManifest: proxyManifest,
    remotionProxyBytes: proxyBytes,
    transcriptRecord: staleTranscript,
    transcriptExpectationBinding: transcript.expectationBinding,
  }), /digest|invalid|record/iu)

  const crossedProxy = structuredClone(proxyManifest)
  crossedProxy.objectSha256 = sha('crossed-proxy')
  expectThrow(() => buildCanonicalCaptionBrollApprovedRunCreativeReview({
    reviewIdSeed: 'caption.approved-run.creative-review.crossed-proxy',
    approvedRunAuthority: authority,
    ownerResult,
    inspectionSourceAuthority: sourceAuthority,
    remotionLayerManifest: layerManifest,
    remotionProxyManifest: crossedProxy,
    remotionProxyBytes: proxyBytes,
    transcriptRecord: transcript.transcriptRecord,
    transcriptExpectationBinding: transcript.expectationBinding,
  }), /hash|invalid|forged/iu)

  const crossedScope = structuredClone(sourceAuthority)
  crossedScope.canonicalScope.sceneId = 'scene.crossed'
  expectThrow(() => buildCanonicalCaptionBrollApprovedRunCreativeReview({
    reviewIdSeed: 'caption.approved-run.creative-review.crossed-scope',
    approvedRunAuthority: authority,
    ownerResult,
    inspectionSourceAuthority: crossedScope,
    remotionLayerManifest: layerManifest,
    remotionProxyManifest: proxyManifest,
    remotionProxyBytes: proxyBytes,
    transcriptRecord: transcript.transcriptRecord,
    transcriptExpectationBinding: transcript.expectationBinding,
  }), /digest|invalid|authority/iu)

  const {
    layerManifestHash: _fullFrameLayerHash,
    ...fullFrameLayerCore
  } = layerManifest
  void _fullFrameLayerHash
  const pictureInPictureLayerCore = {
    ...fullFrameLayerCore,
    position: {
      mode: 'absolute' as const,
      xPercent: 65 as const,
      yPercent: 6 as const,
      widthPercent: 30 as const,
      heightPercent: 30 as const,
      opacity: 1 as const,
    },
    displayTreatment: 'picture_in_picture' as const,
    speakerVisibilityIntent: 'preserve' as const,
  }
  const pictureInPictureLayer = brollRemotionLayerManifestSchema.parse({
    ...pictureInPictureLayerCore,
    layerManifestHash: hashSkillValue(pictureInPictureLayerCore),
  })
  const pictureInPictureOwner = ownerResultFixture(
    pictureInPictureLayer.layerManifestHash,
  )
  expectThrow(() => buildCanonicalCaptionBrollApprovedRunCreativeReview({
    reviewIdSeed: 'caption.approved-run.creative-review.pip-overreach',
    approvedRunAuthority: approvedRunAuthority(pictureInPictureOwner),
    ownerResult: pictureInPictureOwner,
    inspectionSourceAuthority: inspectionSourceAuthority(
      pictureInPictureOwner,
      selectedNormalizedSha256,
    ),
    remotionLayerManifest: pictureInPictureLayer,
    remotionProxyManifest: proxyManifest,
    remotionProxyBytes: proxyBytes,
    transcriptRecord: transcript.transcriptRecord,
    transcriptExpectationBinding: transcript.expectationBinding,
  }), /crossed owner, source, transcript, or timing authority/iu)

  console.log(JSON.stringify({
    smoke: 'canonical_caption_broll_approved_run_creative_review',
    status: 'passed',
    assertions,
    exactApprovedRunAuthorityConsumed: true,
    exactCanonicalTranscriptConsumed: true,
    exactBrollOwnerEvidenceConsumed: true,
    fullAndReducedRequestsBuilt: true,
    runtimeExecuted: false,
    finalCanvasAuthorityGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

await run()
