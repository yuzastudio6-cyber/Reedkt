import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionDirectVisualInspectionEvidence,
  createCanonicalCaptionDirectVisualInspectionRepository,
  isCanonicalCaptionDirectVisualInspectionRepository,
  parseCanonicalCaptionDirectVisualInspectionEvidence,
} from '../services/canonical-caption-direct-visual-inspection-evidence-service'
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
function ref(id: string, version = 'canonical-fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}|${version}`) }
}
function memoryPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  objects: Map<string, Buffer>
} {
  const objects = new Map<string, Buffer>()
  return {
    objects,
    port: {
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
    },
  }
}

const snapshotRef = ref('caption.direct-inspection.snapshot',
  'private-edit-authority-approved-snapshot-v3')
const renderRef = ref('caption.direct-inspection.rendered-output', '1')
const evidence = createCanonicalCaptionDirectVisualInspectionEvidence({
  evidenceId: 'caption.direct-inspection.evidence',
  observedAt: '2026-08-05T23:45:00.000Z',
  canonicalScope: {
    ownerUserId: 'caption-direct-inspection-owner',
    workspaceId: 'caption-direct-inspection-workspace',
    projectId: 'caption-direct-inspection-project',
    editSessionId: 'caption-direct-inspection-edit',
    planVersionId: 'caption-direct-inspection-plan-v1',
    approvedSnapshotRef: snapshotRef,
    executionPackageRef: ref('caption.direct-inspection.package'),
    outputId: 'caption-direct-inspection-output',
  },
  confirmedOutputFrameRef: ref('caption.direct-inspection.frame'),
  renderedArtifactRef: renderRef,
  deterministicQaRef: ref('caption.direct-inspection.technical-qa'),
  sourceMediaAuthorityRef: ref('caption.direct-inspection.source-authority'),
  sourceMediaBindingRefs: [
    ref('caption.direct-inspection.source-binding-a'),
    ref('caption.direct-inspection.source-binding-b'),
  ].sort((left, right) => left.id < right.id ? -1 : 1),
  inspectionArtifactSetRef: ref(
    'caption.direct-inspection.raster-evidence-set'),
  coverage: {
    renderedFrameCount: 127,
    representedFrameCount: 127,
    contactSheetCount: 6,
    originalResolutionSpotCheckCount: 12,
    everyRenderedFrameRepresentedExactlyOnce: true,
    contactSheetCoverageComplete: true,
    originalResolutionTransitionAndTailChecksComplete: true,
    completeMotionPlaybackClaimed: false,
  },
  findings: {
    faceObstructionObserved: false,
    gestureObstructionObserved: false,
    captionClippingObserved: false,
    phraseOverflowObserved: false,
    inaccessibleReadingStateObserved: false,
    importantSourceTextCollisionObserved: false,
    unstablePlacementObserved: false,
    unusableCueTransitionObserved: false,
    tailTruncationObserved: false,
    unprofessionalVisualTreatmentObserved: false,
  },
  inspectionMethod:
    'every_rendered_frame_contact_sheets_plus_original_resolution_checks_v1',
  inspectorClass: 'codex_agent_direct_visual_inspection',
  disposition: 'passed_caption_owned_professional_appearance',
  realUploadedSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  exactApprovedRenderAndSourceAuthorityBound: true,
  deterministicTechnicalQaReplaced: false,
  sharedPostrenderModelReviewClaimed: false,
  independentFinalQaClaimed: false,
  browserLocalCompletionClaimed: false,
  mediaBytesSerialized: false,
  localPathsOrUrlsSerialized: false,
  rawChatOrCredentialsSerialized: false,
  providerCallMadeByCaption: false,
  operationDispatchAuthorityGranted: false,
  repairExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

async function run(): Promise<void> {
  check(parseCanonicalCaptionDirectVisualInspectionEvidence(evidence)
    .evidenceDigestSha256 === evidence.evidenceDigestSha256,
  'The exact real-source direct-inspection record must parse.')
  check(evidence.realUploadedSourcePixelsInspected
    && !evidence.syntheticEngineeringFixtureUsed
    && evidence.acceptedForCaptionOwnedProfessionalAppearance,
  'Professional appearance must come from actual uploaded-source pixels.')

  const synthetic = structuredClone(evidence) as unknown as Record<
    string, unknown>
  synthetic.syntheticEngineeringFixtureUsed = true
  synthetic.evidenceDigestSha256 = calculateSkillContractDigest(
    synthetic, 'evidenceDigestSha256')
  expectThrow(() => parseCanonicalCaptionDirectVisualInspectionEvidence(
    synthetic))

  const incomplete = structuredClone(evidence)
  incomplete.coverage.representedFrameCount -= 1
  incomplete.evidenceDigestSha256 = calculateSkillContractDigest(
    incomplete as unknown as Record<string, unknown>,
    'evidenceDigestSha256')
  expectThrow(() => parseCanonicalCaptionDirectVisualInspectionEvidence(
    incomplete))

  const unsafe = structuredClone(evidence)
  unsafe.evidenceId = 'https://unsafe.invalid/evidence'
  unsafe.evidenceDigestSha256 = calculateSkillContractDigest(
    unsafe as unknown as Record<string, unknown>, 'evidenceDigestSha256')
  expectThrow(() => parseCanonicalCaptionDirectVisualInspectionEvidence(
    unsafe))

  const memory = memoryPort()
  const repository = createCanonicalCaptionDirectVisualInspectionRepository({
    objectPort: memory.port,
    prefix: 'private-internal/caption-direct-inspection-smoke',
  })
  check(isCanonicalCaptionDirectVisualInspectionRepository(repository),
  'Only the admitted create-only repository must satisfy the reader boundary.')
  check(await repository.persistEvidenceCreateOnly({ evidence }) === 'created',
  'Direct-inspection evidence must persist create-only.')
  check(await repository.persistEvidenceCreateOnly({ evidence }) ===
    'identical_replay',
  'Direct-inspection evidence replay must be byte-identical.')
  const reread = await repository.rereadEvidence({
    ownerUserId: evidence.canonicalScope.ownerUserId,
    workspaceId: evidence.canonicalScope.workspaceId,
    approvedSnapshotRef: snapshotRef,
    outputId: evidence.canonicalScope.outputId,
    renderedArtifactRef: renderRef,
  })
  check(reread?.evidenceDigestSha256 === evidence.evidenceDigestSha256,
  'The repository must exact-reread the persisted professional evidence.')
  check(await repository.rereadEvidence({
    ownerUserId: evidence.canonicalScope.ownerUserId,
    workspaceId: evidence.canonicalScope.workspaceId,
    approvedSnapshotRef: snapshotRef,
    outputId: 'caption-direct-inspection-other-output',
    renderedArtifactRef: renderRef,
  }) === null,
  'A different output identity must not reuse the inspection record.')

  const path = [...memory.objects.keys()][0]!
  const tampered = structuredClone(evidence)
  tampered.coverage.contactSheetCount += 1
  memory.objects.set(path, Buffer.from(JSON.stringify(tampered), 'utf8'))
  await expectReject(() => repository.rereadEvidence({
    ownerUserId: evidence.canonicalScope.ownerUserId,
    workspaceId: evidence.canonicalScope.workspaceId,
    approvedSnapshotRef: snapshotRef,
    outputId: evidence.canonicalScope.outputId,
    renderedArtifactRef: renderRef,
  }))

  console.log(JSON.stringify({
    smoke: 'canonical_caption_direct_visual_inspection_evidence',
    status: 'passed',
    assertions,
    realUploadedSourcePixelsRequired: true,
    everyRenderedFrameRepresented: true,
    syntheticEngineeringFixtureAccepted: false,
    sharedPostrenderModelReviewClaimed: false,
    independentFinalQaClaimed: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

void run()
