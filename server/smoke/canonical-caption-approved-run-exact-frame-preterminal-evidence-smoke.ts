import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
} from '../../src/types/caption-broll-approved-run-exact-frame-professional-inspection'
import type {
  CanonicalCaptionApprovedRunExactFramePreterminalEvidence,
} from '../../src/types/canonical-caption-approved-run-exact-frame-preterminal-evidence'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence,
  createCanonicalCaptionApprovedRunExactFramePreterminalRepository,
  isCanonicalCaptionApprovedRunExactFramePreterminalRepository,
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence,
} from '../services/canonical-caption-approved-run-exact-frame-preterminal-evidence-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'

let assertions = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
async function expectReject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = 'caption-preterminal-fixture-v1'):
CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}|${version}`) }
}
function memoryPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const current = objects.get(input.objectPath)
      if (current) {
        if (!current.equals(input.body)) throw new Error('create-only conflict')
        return 'already_exists'
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = objects.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

const snapshotRef = ref('caption.preterminal.snapshot',
  'private-edit-authority-approved-snapshot-v3')
const executionPackageRef = ref('caption.preterminal.execution-package',
  'canonical-approved-edit-execution-package-v5')
const frameRef = ref('caption.preterminal.confirmed-frame',
  'canonical-source-led-confirmed-output-frame-v1')
const scope = {
  ownerUserId: 'caption-preterminal-owner',
  workspaceId: 'caption-preterminal-workspace',
  projectId: 'caption-preterminal-project',
  editSessionId: 'caption-preterminal-edit',
  planVersionId: 'caption-preterminal-plan-v1',
  approvedSnapshotRef: snapshotRef,
  outputId: 'caption-preterminal-output',
  sceneId: 'caption-preterminal-scene',
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 127 }],
}
const sourceSha256 = hash('caption-preterminal-real-private-source')
const previewSha256 = hash('caption-preterminal-baseline-preview')

function rasterFixture(frameIndex: number, kind: string) {
  return {
    frameIndex,
    fileName: `${kind}-${String(frameIndex).padStart(3, '0')}.png`,
    sha256: hash(`${kind}|${frameIndex}`),
  }
}

const approvedRunPackageCore = {
  schemaVersion: 'caption-broll-approved-execution-inspection-package-v3',
  sourceEvidenceMode: 'real_private_media',
  sourceSha256,
  approvedSnapshotRef: snapshotRef,
  captionApprovedJobCount: 17,
  captionSupportResumeCount: 1,
  brollApprovedWorkItemCount: 13,
  canonicalCaptionReplayVerified: true,
  canonicalBrollRestartReplayVerified: true,
  captionOverlaySha256: hash('caption-preterminal-overlay'),
  previewSha256,
  previewFrameCount: 127,
  previewFps: 30,
  contactSheet: {
    fileName: 'all-frames-contact-sheet.png',
    sha256: hash('caption-preterminal-baseline-contact-sheet'),
    representsEveryFrame: true,
  },
  sampleFrames: [0, 31, 63, 94, 126].map((frame) =>
    rasterFixture(frame, 'frame')),
  captionSampleStrips: [0, 31, 63, 94, 126].map((frame) =>
    rasterFixture(frame, 'caption')),
  captionPixelCoverage: {
    crop: { x: 0, y: 260, width: 640, height: 100 },
    expectedVisiblePixelCount: 5_013,
    minimumCoverageBasisPoints: 9_293,
    maximumCoverageBasisPoints: 9_320,
    everyFrameCoverageVerified: true,
  },
  qualificationReadiness: {
    id: 'caption.preterminal.qualification-readiness',
    version: 'canonical-caption-qualification-run-readiness-v1',
    contentHash: hash('caption-preterminal-readiness'),
    disposition: 'blocked_missing_canonical_evidence',
    firstBlockerCode: 'postrender_visual_intelligence_evidence_missing',
    terminalStatusClaimed: false,
  },
  structuralVisualIntelligenceFixtureExcludedFromQualification: true,
  directRasterInspectionRequired: true,
  providerCalled: false,
  publicDeliveryCreated: false,
  productionAuthorityGranted: false,
} as const
const approvedRunInspectionPackage = {
  ...approvedRunPackageCore,
  packageSha256: hash(JSON.stringify(approvedRunPackageCore)),
}

function inspectionOutput(
  variant: 'full_motion' | 'reduced_motion',
): CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt[
  'outputs'][number] {
  const exactFrames = [0, 24, 49, 88, 126]
  const transitionFrames = [48, 52, 56, 60]
  return {
    variant,
    exactFrameReviewRef: ref(
      `caption.preterminal.${variant}.exact-frame-review`,
      'caption-remotion-broll-owner-approved-run-exact-frame-review-v1'),
    renderArtifactRef: ref(
      `caption.preterminal.${variant}.render`,
      'video-mp4-private-review-v1'),
    byteLength: variant === 'full_motion' ? 3_016_277 : 2_992_732,
    width: 3_840,
    height: 2_160,
    fps: 30,
    frameCount: 127,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    durationMilliseconds: 4_288,
    everyFrameContactSheet: {
      rasterRef: ref(`caption.preterminal.${variant}.contact-sheet`,
        'caption-direct-inspection-exact-frame-contact-sheet-v1'),
      representedFrameCount: 127,
      rasterWidth: 3_840,
      rasterHeight: 1_080,
      tileColumns: 16,
      tileRows: 8,
      thumbnailWidth: 240,
      thumbnailHeight: 135,
      actualRasterOpenedAndInspected: true,
    },
    exactResolutionSpotChecks: exactFrames.map((frameNumber) => ({
      frameNumber,
      rasterRef: ref(`caption.preterminal.${variant}.frame.${frameNumber}`,
        'caption-direct-inspection-exact-frame-raster-v1'),
      rasterWidth: 3_840 as const,
      rasterHeight: 2_160 as const,
      actualRasterOpenedAndInspected: true as const,
    })),
    transitionSpotChecks: transitionFrames.map((frameNumber) => ({
      frameNumber,
      rasterRef: ref(
        `caption.preterminal.${variant}.transition.${frameNumber}`,
        'caption-direct-inspection-exact-frame-raster-v1'),
      rasterWidth: 3_840 as const,
      rasterHeight: 2_160 as const,
      actualRasterOpenedAndInspected: true as const,
    })),
  }
}

const receiptWithoutDigest = {
  schemaVersion:
    'caption-broll-approved-run-exact-frame-professional-direct-inspection-v1',
  receiptId: 'caption.preterminal.exact-frame-inspection',
  observedAt: '2026-08-07T23:59:30.000Z',
  canonicalScope: scope,
  exactFrameInspectionPackageRef: ref(
    'caption.preterminal.exact-frame-package',
    'caption-broll-approved-run-exact-frame-review-inspection-package-v1'),
  sourceProxyReviewPackageRef: ref(
    'caption.preterminal.source-proxy-review-package',
    'caption-broll-approved-run-professional-review-inspection-package-v1'),
  approvedSnapshotRef: snapshotRef,
  executionPackageRef,
  confirmedOutputFrameRef: frameRef,
  outputs: [
    inspectionOutput('full_motion'),
    inspectionOutput('reduced_motion'),
  ],
  coverage: {
    frameCountPerVariant: 127,
    variantCount: 2,
    totalRenderedFramesRepresented: 254,
    everyRenderedFrameRepresentedExactlyOnce: true,
    everyFrameThumbnailInspectionPerformed: true,
    exactResolutionSpotChecksComplete: true,
    transitionEntranceHoldAndExitCoverageComplete: true,
    fullReducedMotionSemanticParityInspected: true,
    completeMotionPlaybackInspectionPerformed: false,
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
    exactFrameTypographyDefectObserved: false,
    exactFrameLayoutDefectObserved: false,
  },
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: true,
  sourceProxyUpscaleDisclosed: true,
  sourcePictureQualityQualified: false,
  finalCustomerCanvasClaimed: false,
  replacesCanonicalFinalCanvas: false,
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
} as const
const receipt = {
  ...receiptWithoutDigest,
  receiptDigestSha256: calculateSkillContractDigest({
    ...receiptWithoutDigest,
    receiptDigestSha256: '',
  }, 'receiptDigestSha256'),
} as unknown as CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt

const evidence =
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    evidenceId: 'caption.preterminal.evidence',
    approvedRunInspectionPackage,
    exactFrameInspectionReceipt: receipt,
  })
check(evidence.disposition === 'accepted_preterminal_evidence'
  && evidence.approvedRunCoverage.approvedCaptionJobCount === 17
  && evidence.approvedRunCoverage.approvedBrollWorkItemCount === 13
  && evidence.approvedRunCoverage.captionSupportResumeCount === 1,
'the exact approved run is retained as bounded preterminal evidence')
check(evidence.outputs.length === 2
  && evidence.outputs.every((output) => output.frameCount === 127)
  && evidence.approvedRunCoverage.exactFrameRenderedFrameCount === 254,
'both full and reduced exact-frame outputs remain bound')
check(evidence.acceptedForCaptionOwnedExactFrameTypographyAndLayout
  && evidence.sameApprovedSnapshotExecutionPackageOutputAndSourceBound
  && evidence.sourceProxyUpscaleDisclosed
  && !evidence.sourcePictureQualityQualified,
'accepted typography/layout does not overclaim proxy picture quality')
check(!evidence.terminalRunEvidenceEligible
  && !evidence.qualifiedSharedPostrenderAiReviewClaimed
  && !evidence.independentFinalQaClaimed
  && evidence.firstRemainingGateCode ===
    'postrender_visual_intelligence_evidence_missing',
'terminal, postrender, and final-QA gates remain closed')

const repository =
  createCanonicalCaptionApprovedRunExactFramePreterminalRepository({
    objectPort: memoryPort(),
  })
check(isCanonicalCaptionApprovedRunExactFramePreterminalRepository(repository),
  'only the admitted create-only repository is recognized')
check(await repository.persistEvidenceCreateOnly({ evidence }) === 'created',
  'preterminal evidence is persisted create-only')
check(await repository.persistEvidenceCreateOnly({ evidence })
  === 'identical_replay', 'identical preterminal replay is stable')
const reread = await repository.rereadEvidence({
  ownerUserId: scope.ownerUserId,
  workspaceId: scope.workspaceId,
  approvedSnapshotRef: snapshotRef,
  outputId: scope.outputId,
  exactFrameInspectionReceiptRef: evidence.exactFrameInspectionReceiptRef,
})
check(JSON.stringify(reread) === JSON.stringify(evidence),
  'create-only evidence rereads exactly')

const crossedPackage = structuredClone(approvedRunInspectionPackage)
crossedPackage.approvedSnapshotRef = ref('caption.preterminal.crossed-snapshot',
  'private-edit-authority-approved-snapshot-v3')
const crossedCore = structuredClone(crossedPackage) as
  unknown as Record<string, unknown>
delete crossedCore.packageSha256
crossedPackage.packageSha256 = hash(JSON.stringify(crossedCore))
expectThrow(() =>
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    evidenceId: 'caption.preterminal.crossed',
    approvedRunInspectionPackage: crossedPackage,
    exactFrameInspectionReceipt: receipt,
  }))
const staleReceipt = structuredClone(receipt)
staleReceipt.outputs[0].renderArtifactRef.contentHash = '0'.repeat(64)
expectThrow(() =>
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    evidenceId: 'caption.preterminal.stale-receipt',
    approvedRunInspectionPackage,
    exactFrameInspectionReceipt: staleReceipt,
  }))

function redigest(
  value: CanonicalCaptionApprovedRunExactFramePreterminalEvidence,
  edit: (record: Record<string, unknown>) => void,
): Record<string, unknown> {
  const changed = structuredClone(value) as unknown as Record<string, unknown>
  edit(changed)
  changed.evidenceDigestSha256 = calculateSkillContractDigest({
    ...changed,
    evidenceDigestSha256: '',
  }, 'evidenceDigestSha256')
  return changed
}
expectThrow(() =>
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
    redigest(evidence, (value) => {
      value.sourcePictureQualityQualified = true
    })))
expectThrow(() =>
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
    redigest(evidence, (value) => {
      value.terminalRunEvidenceEligible = true
    })))
expectThrow(() =>
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
    redigest(evidence, (value) => {
      value.qualifiedSharedPostrenderAiReviewClaimed = true
    })))
expectThrow(() =>
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    ...evidence,
    unknown: true,
  }))
const cyclic = structuredClone(evidence) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() =>
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(cyclic))

const conflicting = redigest(evidence, (value) => {
  value.evidenceId = 'caption.preterminal.evidence.conflict'
})
await expectReject(() => repository.persistEvidenceCreateOnly({
  evidence: conflicting as unknown as
    CanonicalCaptionApprovedRunExactFramePreterminalEvidence,
}))
check(await repository.rereadEvidence({
  ownerUserId: scope.ownerUserId,
  workspaceId: scope.workspaceId,
  approvedSnapshotRef: ref('caption.preterminal.other-snapshot'),
  outputId: scope.outputId,
  exactFrameInspectionReceiptRef: evidence.exactFrameInspectionReceiptRef,
}) === null, 'cross-snapshot lookup cannot reuse preterminal evidence')

console.log(JSON.stringify({
  smoke:
    'canonical_caption_approved_run_exact_frame_preterminal_evidence',
  assertions,
  evidenceDigestSha256: evidence.evidenceDigestSha256,
  approvedCaptionJobCount: evidence.approvedRunCoverage
    .approvedCaptionJobCount,
  approvedBrollWorkItemCount: evidence.approvedRunCoverage
    .approvedBrollWorkItemCount,
  exactFrameRenderedFrameCount: evidence.approvedRunCoverage
    .exactFrameRenderedFrameCount,
  disposition: evidence.disposition,
  firstRemainingGateCode: evidence.firstRemainingGateCode,
  terminalRunEvidenceEligible: evidence.terminalRunEvidenceEligible,
  result: 'passed',
}, null, 2))
