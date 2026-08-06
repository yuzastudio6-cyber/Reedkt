import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionBrollOwnerProfessionalInspectionReceipt } from
  '../../src/types/caption-broll-owner-professional-inspection'
import type { CaptionRemotionBrollOwnerReviewSpec } from
  '../../src/types/caption-remotion-broll-owner-review'
import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCaptionBrollOwnerProfessionalInspectionReceipt,
} from '../captions-specialist/caption-broll-owner-professional-inspection'
import {
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import {
  createCaptionRemotionBrollOwnerReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-review'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { createCaptionsHarnessCall } from
  '../internal-testing/captions-specialist-harness'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
  createCanonicalCaptionBrollOwnerReadPort,
  createCanonicalCaptionBrollSupportService,
} from '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionBrollOwnerEvidenceReadPort,
  createCanonicalCaptionBrollOwnerInspectionAuthority,
  createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort,
  createCanonicalCaptionBrollOwnerInspectionBundleReadPort,
  createCanonicalCaptionBrollOwnerInspectionBundleRepository,
  createCanonicalCaptionBrollOwnerInspectionProjectionRequest,
  createCanonicalCaptionBrollOwnerInspectionProjectionService,
  parseCanonicalCaptionBrollOwnerInspectionAuthority,
} from '../services/canonical-caption-broll-owner-inspection-projection-service'
import {
  createCanonicalCaptionDirectVisualInspectionRepository,
} from '../services/canonical-caption-direct-visual-inspection-evidence-service'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import {
  buildCaptionBrollOwnerProfessionalReviewFixture,
} from './captions-specialist-broll-owner-professional-review-smoke'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}
async function reject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  checks += 1
}
function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function ref(
  id: string,
  version = `${id}.v1`,
  contentHash = hash(id),
): CaptionDomainRef {
  return { id, version, contentHash }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}

const values = new Map<string, Buffer>()
const objectPort = memoryObjectPort(values)
const supportResumeRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: 'private/smoke/caption-broll-inspection/resume/v1',
  })
const brollEvidenceRepository = createCanonicalCaptionBrollEvidenceRepository({
  objectPort,
  prefix: 'private/smoke/caption-broll-inspection/owner-evidence/v1',
})
const directEvidenceRepository =
  createCanonicalCaptionDirectVisualInspectionRepository({
    objectPort,
    prefix: 'private/smoke/caption-broll-inspection/direct-evidence/v1',
  })
const bundleRepository =
  createCanonicalCaptionBrollOwnerInspectionBundleRepository({
    objectPort,
    prefix: 'private/smoke/caption-broll-inspection/bundles/v1',
  })

const approvedSnapshotRef = ref(
  'snapshot.broll.inspection.1', 'approved-plan-snapshot-v1')
const initialCall = createCaptionsHarnessCall({
  callId: 'caption.broll.inspection.1',
  jobType: 'provide_caption_broll_composition_constraints',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  approvedSnapshotRef,
  outputId: 'output.broll.inspection.1',
  sceneId: 'scene.broll.inspection.1',
})
const call = redigest({
  ...initialCall,
  canonicalScope: {
    ...initialCall.canonicalScope,
    authorizedFrameRanges: [{
      startFrame: 120,
      endFrameExclusive: 192,
    }],
  },
} as unknown as Record<string, unknown>, 'callDigestSha256') as
  unknown as typeof initialCall
const outputFrameArtifact = call.inputArtifactRefs.find((artifact) =>
  artifact.artifactType === 'confirmed_output_frame')
const masterTimingArtifact = call.inputArtifactRefs.find((artifact) =>
  artifact.artifactType === 'master_timing_or_planning_timing')
assert.ok(outputFrameArtifact && masterTimingArtifact)
const planningConstraintRef = ref(
  'constraint.broll.inspection.1',
  'caption-broll-planning-constraint-v1')
const ownerRequest = createCaptionBrollOwnerReadRequest({
  requestId: 'request.broll.inspection.1',
  canonicalScope: {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId: 'plan.broll.inspection.1',
    approvedSnapshotRef,
    outputId: call.canonicalScope.outputId!,
    outputFrameRef: contractRef(outputFrameArtifact),
    sceneId: call.canonicalScope.sceneId!,
    authorizedFrameRange: {
      startFrameInclusive: 120,
      endFrameExclusive: 192,
      fps: 24,
    },
    masterTimingRef: contractRef(masterTimingArtifact),
    masterTimingHash: masterTimingArtifact.contentHash,
  },
  planningConstraintRef,
})
const initialResult = runCaptionsSpecialistJob({
  call,
  brollOwnerReadRequest: ownerRequest,
})
assert.equal(initialResult.disposition, 'needs_followup')
const supportRequest = initialResult.supportRequests[0]!
const supportRequestRef = {
  id: supportRequest.requestId,
  version: supportRequest.schemaVersion,
  contentHash: supportRequest.requestDigestSha256,
}
const pair = createCanonicalSpecialistCallResultPair({
  call,
  result: initialResult,
  persistedAt: '2026-08-06T18:00:00.000Z',
})
await supportResumeRepository.persistCallResultPairCreateOnly({ pair })

const ownerResult = ownerResultFixture(ownerRequest)
const brollSupportService = createCanonicalCaptionBrollSupportService({
  supportResumeRepository,
  evidenceRepository: brollEvidenceRepository,
  ownerReadPort: createCanonicalCaptionBrollOwnerReadPort(async () =>
    structuredClone(ownerResult)),
  approvedSnapshotReadPort:
    createCanonicalCaptionBrollApprovedSnapshotReadPort(async () => ({
      canonicalScope: structuredClone(ownerRequest.canonicalScope),
      planningConstraintRef: structuredClone(planningConstraintRef),
    })),
  now: () => new Date('2026-08-06T18:01:00.000Z'),
})
const brollOutcome = await brollSupportService
  .projectAndResumeAuthenticatedEvidence({
    authenticatedOwnerUserId: call.canonicalScope.ownerUserId,
    priorCallRef: {
      id: call.callId,
      version: call.schemaVersion,
      contentHash: call.callDigestSha256,
    },
    selectedSupportRequestRef: supportRequestRef,
  })

const proxyBytes = Buffer.alloc(2_048)
proxyBytes.set([0x1a, 0x45, 0xdf, 0xa3])
const selectedBytes = Buffer.alloc(4_096, 0x52)
const selectedNormalizedArtifactRef = ref(
  'artifact.broll.inspection.selected-normalized.1',
  'b_roll_selected_normalized_media_v1', hash(selectedBytes))
const reviewFixture = buildCaptionBrollOwnerProfessionalReviewFixture({
  ownerResult,
  selectedNormalizedArtifactRef,
  selectedNormalizedArtifactByteLength: selectedBytes.byteLength,
  selectedNormalizedArtifactFrameCount: 72,
  selectedNormalizedArtifactFps: 24,
  remotionProxyRef: ref(
    'artifact.broll.inspection.proxy.1',
    'b_roll_remotion_preview_proxy_matroska_v1', hash(proxyBytes)),
  remotionProxyBytes: proxyBytes,
})
const rejectedFull = rejectedSpec(reviewFixture.fullSpec, ownerResult)
const rejectedReduced = rejectedSpec(reviewFixture.reducedSpec, ownerResult)
const acceptedFullArtifact = renderArtifact(
  'full_motion', reviewFixture.fullSpec)
const acceptedReducedArtifact = renderArtifact(
  'reduced_motion', reviewFixture.reducedSpec)
const inspectionContext = {
  ownerResult,
  acceptedFullMotionSpec: reviewFixture.fullSpec,
  acceptedReducedMotionSpec: reviewFixture.reducedSpec,
  rejectedFullMotionSpec: rejectedFull,
  rejectedReducedMotionSpec: rejectedReduced,
}
const receipt = createCaptionBrollOwnerProfessionalInspectionReceipt({
  inspectionId: 'caption.broll.inspection.receipt.1',
  observedAt: '2026-08-06T18:02:00.000Z',
  canonicalScope: structuredClone(reviewFixture.fullSpec.canonicalScope),
  ownerResultRef: ownerResultReference(ownerResult),
  acceptedReviewSpecRefs: [
    { variant: 'full_motion',
      reviewSpecRef: reviewSpecReference(reviewFixture.fullSpec) },
    { variant: 'reduced_motion',
      reviewSpecRef: reviewSpecReference(reviewFixture.reducedSpec) },
  ],
  rejectedAttempt: {
    fullMotionReviewSpecRef: reviewSpecReference(rejectedFull),
    reducedMotionReviewSpecRef: reviewSpecReference(rejectedReduced),
    fullMotionRenderArtifactRef: ref(
      'artifact.broll.inspection.rejected.full.1',
      'caption-private-remotion-review-artifact-v1'),
    reducedMotionRenderArtifactRef: ref(
      'artifact.broll.inspection.rejected.reduced.1',
      'caption-private-remotion-review-artifact-v1'),
    inspectedFrameEvidence: [5, 11, 30, 47].map((frameNumber) => {
      const rasterSha256 = hash(`rejected:${frameNumber}`)
      return {
        frameNumber,
        rasterRef: ref(
          `raster.broll.inspection.rejected.${frameNumber}`,
          'caption-rejected-professional-inspection-raster-v1',
          rasterSha256),
        rasterSha256,
        rasterWidth: 640 as const,
        rasterHeight: 360 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }),
    rejectionReasonCodes: ['face_obstruction_by_hero_typography'],
    deterministicTechnicalPassNotSufficient: true,
    professionalAppearanceAccepted: false,
    retainedAsFailedEvidence: true,
  },
  acceptedRenderArtifacts: [acceptedFullArtifact, acceptedReducedArtifact],
  contactSheets: [
    contactSheet('full_motion', acceptedFullArtifact.artifactRef),
    contactSheet('reduced_motion', acceptedReducedArtifact.artifactRef),
  ],
  originalResolutionSpotChecks: [
    ...spotChecks('full_motion', reviewFixture.fullSpec,
      acceptedFullArtifact.artifactRef),
    ...spotChecks('reduced_motion', reviewFixture.reducedSpec,
      acceptedReducedArtifact.artifactRef),
  ],
  coverage: {
    frameCountPerVariant: 72,
    variantCount: 2,
    totalRenderedFramesRepresented: 144,
    everyRenderedFrameRepresentedExactlyOnce: true,
    contactSheetCoverageComplete: true,
    originalResolutionSpotChecksComplete: true,
    cueEntranceHoldAndExitCoverageComplete: true,
    fullReducedMotionSemanticParityInspected: true,
    completeMotionPlaybackClaimed: false,
  },
  findings: {
    sourceSubstitutionObserved: false,
    sourceAspectDistortionObserved: false,
    faceObstructionObserved: false,
    gestureObstructionObserved: false,
    captionClippingObserved: false,
    phraseOverflowObserved: false,
    heroAndAccessiblePlateCollisionObserved: false,
    unstablePlacementObserved: false,
    unusableCueTransitionObserved: false,
    stuckCaptionLayerObserved: false,
    tailTruncationObserved: false,
  },
  repair: {
    repairReason: 'hero_typography_obscured_speaker_face',
    repairAction:
      'reposition_hero_typography_to_open_left_side_outside_face_and_gesture',
    rejectedAndAcceptedArtifactsVersionSeparated: true,
    acceptedHeroPlacement: 'open_left_side',
    acceptedStableCaptionPlacement: 'lower_safe_band',
    repairDidNotChangeOwnerSelectionCropOrTiming: true,
  },
  inspectionMethod:
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1',
  inspectorClass: 'codex_agent_direct_visual_inspection',
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  deterministicTechnicalQaReplaced: false,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  browserLocalCompletionClaimed: false,
  mediaBytesSerialized: false,
  localPathsSerialized: false,
  providerCallMade: false,
  operationDispatchAuthorityGranted: false,
  repairExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, inspectionContext)

const receiptRef = {
  id: receipt.inspectionId,
  version: receipt.schemaVersion,
  contentHash: receipt.inspectionDigestSha256,
}
const executionPackageRef = ref(
  'package.broll.inspection.1',
  'canonical-approved-edit-execution-package-v1')
const deterministicQaRef = ref(
  'qa.broll.inspection.1', 'caption-deterministic-render-qa-v1')
const evidenceRecordRef = {
  id: brollOutcome.evidenceRecord.recordId,
  version: brollOutcome.evidenceRecord.schemaVersion,
  contentHash: brollOutcome.evidenceRecord.recordDigestSha256,
}
const request =
  createCanonicalCaptionBrollOwnerInspectionProjectionRequest({
    requestId: 'projection.broll.inspection.full.1',
    variant: 'full_motion',
    receiptRef,
    acceptedReviewSpecRef: reviewSpecReference(reviewFixture.fullSpec),
    canonicalScope: {
      ownerUserId: ownerResult.canonicalScope.ownerUserId,
      workspaceId: ownerResult.canonicalScope.workspaceId,
      projectId: ownerResult.canonicalScope.projectId,
      editSessionId: ownerResult.canonicalScope.editSessionId,
      planVersionId: ownerResult.canonicalScope.planVersionId,
      approvedSnapshotRef: structuredClone(
        ownerResult.canonicalScope.approvedSnapshotRef),
      executionPackageRef,
      outputId: ownerResult.canonicalScope.outputId,
      sceneId: ownerResult.canonicalScope.sceneId,
      authorizedFrameRange: {
        startFrame:
          ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive,
        endFrameExclusive:
          ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive,
        fps: ownerResult.canonicalScope.authorizedFrameRange.fps,
      },
      masterTimingRef: structuredClone(
        ownerResult.canonicalScope.masterTimingRef),
      masterTimingHash: ownerResult.canonicalScope.masterTimingHash,
    },
    confirmedOutputFrameRef: structuredClone(
      ownerResult.canonicalScope.outputFrameRef),
    renderedArtifactRef: acceptedFullArtifact.artifactRef,
    deterministicQaRef,
    supportRequestRef,
    expectedBrollEvidenceRecordRef: evidenceRecordRef,
    expectedOwnerResultRef: ownerResultReference(ownerResult),
    expectedSelectedNormalizedArtifactRef: selectedNormalizedArtifactRef,
    exactCaptionReceiptAndReviewSpecsRereadRequired: true,
    exactBrollOwnerEvidenceRereadRequired: true,
    canonicalApprovedRunAuthorityRereadRequired: true,
    canonicalQualificationReaderMustRevalidateAuthority: true,
    callerSuppliedReceiptAccepted: false,
    callerSuppliedOwnerEvidenceAccepted: false,
    callerSuppliedAuthorityAccepted: false,
    browserLocalCompletionAccepted: false,
    mediaBytesAccepted: false,
    pathsUrlsOrCredentialsAccepted: false,
    providerCallRequested: false,
    operationDispatchAuthorityGranted: false,
    repairExecutionAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
const bundle = {
  receipt,
  acceptedFullMotionSpec: reviewFixture.fullSpec,
  acceptedReducedMotionSpec: reviewFixture.reducedSpec,
  rejectedFullMotionSpec: rejectedFull,
  rejectedReducedMotionSpec: rejectedReduced,
}
const locator = {
  canonicalScope: structuredClone(request.canonicalScope),
  receiptRef,
  variant: request.variant,
}
check(await bundleRepository.persistBundleCreateOnly({ locator, bundle })
  === 'created',
'The complete inspected B-roll bundle must persist create-only.')
check(await bundleRepository.persistBundleCreateOnly({ locator, bundle })
  === 'identical_replay',
'The exact inspection bundle replay must be idempotent.')

const sourceMediaBindingRefs = [
  ref('source.binding.broll.inspection.1',
    'private-approved-source-binding-v1'),
  ref('source.binding.broll.inspection.2',
    'private-approved-source-binding-v1'),
].sort((left, right) => refKey(left).localeCompare(refKey(right)))
const authority = createCanonicalCaptionBrollOwnerInspectionAuthority({
  authorityId: 'authority.broll.inspection.full.1',
  canonicalScope: structuredClone(request.canonicalScope),
  confirmedOutputFrameRef: structuredClone(request.confirmedOutputFrameRef),
  renderedArtifactRef: structuredClone(request.renderedArtifactRef),
  deterministicQaRef: structuredClone(request.deterministicQaRef),
  supportRequestRef: structuredClone(request.supportRequestRef),
  brollEvidenceRecordRef: evidenceRecordRef,
  ownerResultRef: ownerResultReference(ownerResult),
  selectedNormalizedArtifactRef,
  sourceMediaAuthorityRef: ref(
    'source.authority.broll.inspection.1',
    'private-approved-source-binding-manifest-v1'),
  sourceMediaBindingRefs,
  exactApprovedSnapshotExecutionPackageOutputAndBrollWorkReread: true,
  exactBrollOwnerEvidenceAndSelectedArtifactReread: true,
  exactMasterTimingFrameAndSceneReread: true,
  exactApprovedSourceManifestReread: true,
})

let bundleReads = 0
const bundleReadPort =
  createCanonicalCaptionBrollOwnerInspectionBundleReadPort(async (input) => {
    bundleReads += 1
    return bundleRepository.readExact(input)
  })
let ownerEvidenceReads = 0
const ownerEvidenceReadPort = createCanonicalCaptionBrollOwnerEvidenceReadPort(
  async (input) => {
    ownerEvidenceReads += 1
    const persistedOwnerResult = await brollEvidenceRepository
      .rereadOwnerResult(input)
    const evidenceRecord = await brollEvidenceRepository
      .rereadEvidenceRecord(input)
    return persistedOwnerResult && evidenceRecord
      ? { ownerResult: persistedOwnerResult, evidenceRecord } : null
  })
let authorityReads = 0
const authorityReadPort =
  createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(async () => {
    authorityReads += 1
    return structuredClone(authority)
  })
const service = createCanonicalCaptionBrollOwnerInspectionProjectionService({
  bundleReadPort,
  ownerEvidenceReadPort,
  authorityReadPort,
  evidenceRepository: directEvidenceRepository,
})
const outcome = await service.project(request)
check(bundleReads === 2 && ownerEvidenceReads === 2 && authorityReads === 2,
'The bundle, B-roll owner evidence, and approved-run authority must each be '
  + 'reread twice.')
check(outcome.evidence.renderedArtifactRef.contentHash
  === acceptedFullArtifact.artifactSha256
  && outcome.evidence.inspectionArtifactSetRef.contentHash
    === receipt.inspectionDigestSha256,
'The canonical evidence must bind the exact accepted render and inspection.')
check(outcome.evidence.sourceMediaAuthorityRef.contentHash
  === authority.sourceMediaAuthorityRef.contentHash
  && outcome.evidence.sourceMediaBindingRefs.length === 2,
'The projection must preserve the canonical approved-source authority.')
check(outcome.evidence.coverage.renderedFrameCount === 72
  && outcome.evidence.coverage.representedFrameCount === 72
  && outcome.evidence.coverage.originalResolutionSpotCheckCount === 7,
'The selected variant must retain all-frame and spot-check coverage.')
check(outcome.evidence.acceptedForCaptionOwnedProfessionalAppearance
  && !outcome.evidence.sharedPostrenderModelReviewClaimed
  && !outcome.evidence.independentFinalQaClaimed,
'Caption inspection must not claim model review or independent final QA.')
check(!outcome.publicOrProductionAuthorityGranted
  && !outcome.evidence.operationDispatchAuthorityGranted
  && !outcome.evidence.assetMutationAuthorityGranted
  && !outcome.evidence.finalQaApprovalGranted,
'The adapter must grant no dispatch, asset, QA, public, or production authority.')
const replay = await service.project(request)
check(replay.evidence.evidenceDigestSha256
  === outcome.evidence.evidenceDigestSha256,
'Exact projection replay must reread byte-identical canonical evidence.')

const crossedSource = redigest({
  ...request,
  expectedSelectedNormalizedArtifactRef: ref(
    'artifact.broll.inspection.crossed',
    'b_roll_selected_normalized_media_v1'),
} as unknown as Record<string, unknown>, 'requestDigestSha256')
await reject(() => service.project(crossedSource as never))
const crossedSpec = redigest({
  ...request,
  acceptedReviewSpecRef: reviewSpecReference(reviewFixture.reducedSpec),
} as unknown as Record<string, unknown>, 'requestDigestSha256')
await reject(() => service.project(crossedSpec as never))
await reject(() => service.project({ ...request, receipt: bundle } as never))

let driftOwnerRead = 0
const driftOwnerService =
  createCanonicalCaptionBrollOwnerInspectionProjectionService({
    bundleReadPort,
    ownerEvidenceReadPort:
      createCanonicalCaptionBrollOwnerEvidenceReadPort(async () => {
        driftOwnerRead += 1
        return driftOwnerRead === 1
          ? { ownerResult, evidenceRecord: brollOutcome.evidenceRecord }
          : null
      }),
    authorityReadPort,
    evidenceRepository: directEvidenceRepository,
  })
await reject(() => driftOwnerService.project(request))

let driftAuthorityRead = 0
const changedAuthority = createCanonicalCaptionBrollOwnerInspectionAuthority({
  ...structuredClone(authority),
  authorityId: 'authority.broll.inspection.changed.1',
})
const driftAuthorityService =
  createCanonicalCaptionBrollOwnerInspectionProjectionService({
    bundleReadPort,
    ownerEvidenceReadPort,
    authorityReadPort:
      createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(
        async () => {
          driftAuthorityRead += 1
          return driftAuthorityRead === 1 ? authority : changedAuthority
        }),
    evidenceRepository: directEvidenceRepository,
  })
await reject(() => driftAuthorityService.project(request))

assert.throws(() => parseCanonicalCaptionBrollOwnerInspectionAuthority({
  ...authority,
  sourceMediaBindingRefs: [...authority.sourceMediaBindingRefs].reverse(),
}))
checks += 1
await reject(() => bundleRepository.persistBundleCreateOnly({
  locator,
  bundle: {
    ...bundle,
    rejectedFullMotionSpec: {
      ...rejectedFull,
      reviewSpecId: 'caption.broll.inspection.colliding-spec',
    },
  },
}))

console.log(JSON.stringify({
  smoke: 'canonical-caption-broll-owner-inspection-projection-service',
  status: 'passed',
  checks,
  bundleReads,
  ownerEvidenceReads,
  authorityReads,
  evidenceDigestSha256: outcome.evidence.evidenceDigestSha256,
  ownerEvidenceRecordDigestSha256:
    brollOutcome.evidenceRecord.recordDigestSha256,
  renderedFrameCount: outcome.evidence.coverage.renderedFrameCount,
  representedFrameCount: outcome.evidence.coverage.representedFrameCount,
  canonicalQualificationReaderMustRevalidateAuthority: true,
  providerCallMade: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function ownerResultFixture(
  request: typeof ownerRequest,
): BrollCaptionOwnerReadResult {
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: 'result.broll.inspection.1',
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
      'receipt.broll.inspection.owner.1', 'b_roll_result_receipt_v1'),
    selectedMediaManifestRef: ref(
      'manifest.broll.inspection.1', 'b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: ref(
      'layout.broll.inspection.1', 'b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: ref(
      'crop.broll.inspection.1', 'b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: ref(
      'text.broll.inspection.1',
      'b_roll_caption_visible_text_evidence_v1'),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'evidence.broll.inspection.1',
      'b_roll_authenticated_owner_read_evidence_v1'),
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
      'resultDigestSha256'),
  })
}

function rejectedSpec(
  accepted: CaptionRemotionBrollOwnerReviewSpec,
  owner: BrollCaptionOwnerReadResult,
): CaptionRemotionBrollOwnerReviewSpec {
  const reduced = accepted.reducedMotion
  return createCaptionRemotionBrollOwnerReviewSpec({
    reviewSpecId: `caption.broll.inspection.rejected.${
      reduced ? 'reduced' : 'full'}.1`,
    canonicalScope: structuredClone(accepted.canonicalScope),
    sceneGroupRef: ref(
      `scene-group.broll.inspection.rejected.${reduced ? 'reduced' : 'full'}`,
      'caption-remotion-broll-owner-scene-group-v1'),
    motionLockRef: structuredClone(accepted.motionLockRef),
    storyTimingResolutionRef:
      structuredClone(accepted.storyTimingResolutionRef),
    sourceEvidence: structuredClone(accepted.sourceEvidence),
    wordingEvidence: structuredClone(accepted.wordingEvidence),
    confirmedOutputFrame: structuredClone(accepted.confirmedOutputFrame),
    reducedMotion: reduced,
    inspectionFrameNumbers:
      structuredClone(accepted.inspectionFrameNumbers),
    layers: accepted.layers.map((layer) => layer.presentationKind
      === 'hero_typography' ? {
        ...structuredClone(layer),
        layoutBasisPoints: {
          ...structuredClone(layer.layoutBasisPoints),
          x: 800,
          width: 8_400,
        },
        typography: {
          ...structuredClone(layer.typography),
          textAlign: 'center' as const,
        },
      } : structuredClone(layer)),
    ownerResult: owner,
  })
}

function renderArtifact(
  variant: 'full_motion',
  spec: CaptionRemotionBrollOwnerReviewSpec,
): CaptionBrollOwnerProfessionalInspectionReceipt[
  'acceptedRenderArtifacts'][0]
function renderArtifact(
  variant: 'reduced_motion',
  spec: CaptionRemotionBrollOwnerReviewSpec,
): CaptionBrollOwnerProfessionalInspectionReceipt[
  'acceptedRenderArtifacts'][1]
function renderArtifact(
  variant: 'full_motion' | 'reduced_motion',
  spec: CaptionRemotionBrollOwnerReviewSpec,
): CaptionBrollOwnerProfessionalInspectionReceipt[
  'acceptedRenderArtifacts'][number] {
  const artifactSha256 = hash(`accepted-render:${variant}`)
  return {
    variant,
    reviewSpecRef: reviewSpecReference(spec),
    artifactRef: ref(
      `artifact.broll.inspection.accepted.${variant}`,
      'caption-private-remotion-review-artifact-v1', artifactSha256),
    artifactSha256,
    mimeType: 'video/mp4',
    byteLength: 8_192,
    rasterWidth: 640,
    rasterHeight: 360,
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 72,
  }
}

function contactSheet(
  variant: 'full_motion',
  renderArtifactRef: CaptionDomainRef,
): CaptionBrollOwnerProfessionalInspectionReceipt['contactSheets'][0]
function contactSheet(
  variant: 'reduced_motion',
  renderArtifactRef: CaptionDomainRef,
): CaptionBrollOwnerProfessionalInspectionReceipt['contactSheets'][1]
function contactSheet(
  variant: 'full_motion' | 'reduced_motion',
  renderArtifactRef: CaptionDomainRef,
): CaptionBrollOwnerProfessionalInspectionReceipt['contactSheets'][number] {
  const rasterSha256 = hash(`contact-sheet:${variant}`)
  return {
    variant,
    renderArtifactRef,
    startFrame: 0,
    endFrameExclusive: 72,
    representedFrameCount: 72,
    rasterRef: ref(
      `raster.broll.inspection.contact-sheet.${variant}`,
      'caption-all-frame-contact-sheet-v1', rasterSha256),
    rasterSha256,
    rasterWidth: 1_536,
    rasterHeight: 432,
    tileColumns: 12,
    tileRows: 6,
    thumbnailWidth: 128,
    thumbnailHeight: 72,
    actualRasterOpenedAndInspected: true,
  }
}

function spotChecks(
  variant: 'full_motion' | 'reduced_motion',
  spec: CaptionRemotionBrollOwnerReviewSpec,
  renderArtifactRef: CaptionDomainRef,
): CaptionBrollOwnerProfessionalInspectionReceipt[
  'originalResolutionSpotChecks'] {
  return spec.inspectionFrameNumbers.map((frameNumber) => {
    const rasterSha256 = hash(`spot:${variant}:${frameNumber}`)
    return {
      inspectionItemId:
        `caption.broll.inspection.${variant}.frame.${frameNumber}`,
      variant,
      reviewSpecRef: reviewSpecReference(spec),
      renderArtifactRef,
      frameNumber,
      rasterRef: ref(
        `raster.broll.inspection.${variant}.${frameNumber}`,
        'caption-original-resolution-inspection-raster-v1', rasterSha256),
      rasterSha256,
      rasterWidth: 640,
      rasterHeight: 360,
      actualRasterOpenedAndInspected: true,
    }
  })
}

function reviewSpecReference(
  spec: CaptionRemotionBrollOwnerReviewSpec,
): CaptionDomainRef {
  return {
    id: spec.reviewSpecId,
    version: spec.schemaVersion,
    contentHash: spec.reviewSpecDigestSha256,
  }
}

function ownerResultReference(
  result: BrollCaptionOwnerReadResult,
): CaptionDomainRef {
  return {
    id: result.resultId,
    version: result.schemaVersion,
    contentHash: result.resultDigestSha256,
  }
}

function contractRef(value: {
  id: string
  version: string
  contentHash: string
}): CaptionDomainRef {
  return { id: value.id, version: value.version,
    contentHash: value.contentHash }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function memoryObjectPort(
  store: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hash(input.body), input.contentSha256)
      const prior = store.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) {
          throw new Error('create-only collision')
        }
        return 'already_exists'
      }
      store.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = store.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
