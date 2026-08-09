import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionRealSourceCompleteTimeInspectionReceipt,
  CaptionRealSourceInspectionVariant,
} from '../../src/types/caption-real-source-complete-time-inspection'
import type {
  CaptionRealSourceMultiOutputInspectionReceipt,
  CaptionRealSourceMultiOutputInspectionVariant,
} from '../../src/types/caption-real-source-multi-output-inspection'
import type {
  CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import type {
  CaptionRemotionRealSourceReviewSpec,
} from '../../src/types/caption-remotion-real-source-review'
import type {
  CanonicalCaptionRealSourceInspectionAuthority,
  CanonicalCaptionRealSourceInspectionProjectionRequest,
  CanonicalCaptionRealSourceInspectionVariant,
} from '../../src/types/canonical-caption-real-source-inspection-projection'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from '../captions-specialist/caption-current-job-readiness'
import {
  createCaptionRealSourceCompleteTimeInspectionReceipt,
} from '../captions-specialist/caption-real-source-complete-time-inspection'
import {
  createCaptionRealSourceMultiOutputInspectionReceipt,
} from '../captions-specialist/caption-real-source-multi-output-inspection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  buildCap14RealSourceFixture,
} from './captions-specialist-cap-14-real-source-smoke'
import {
  buildCap18RealSourceMultiOutputFixture,
} from './captions-specialist-cap-18-real-source-multi-output-smoke'
import {
  createCanonicalCaptionDirectVisualInspectionRepository,
} from '../services/canonical-caption-direct-visual-inspection-evidence-service'
import {
  createCanonicalCaptionPrivateQualificationRunController,
  parseCanonicalCaptionPrivateQualificationRunOutcome,
} from '../services/canonical-caption-private-qualification-run-controller'
import {
  createCanonicalCaptionQualificationRunEvidenceAssembly,
  createCanonicalCaptionQualificationRunEvidenceReadPort,
  createCanonicalCaptionQualificationRunEvidenceRepository,
} from '../services/canonical-caption-qualification-run-evidence-reader'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCaptionRealSourceInspectionAuthority,
  createCanonicalCaptionRealSourceInspectionAuthorityReadPortV3,
  createCanonicalCaptionRealSourceInspectionBundleReadPortV2,
  createCanonicalCaptionRealSourceInspectionBundleRepository,
  createCanonicalCaptionRealSourceInspectionProjectionRequest,
  createCanonicalCaptionRealSourceInspectionProjectionServiceV3,
  parseCanonicalCaptionRealSourceInspectionProjectionRequest,
} from '../services/canonical-caption-real-source-inspection-projection-service'
import {
  createCanonicalCaptionTerminalQualificationRequest,
} from '../services/canonical-caption-terminal-qualification-service'

const OBSERVED_AT = '2026-08-05T20:45:00.000Z'
const SPOT_FRAMES = [8, 21, 80, 122] as const

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
function ref(
  id: string,
  version = 'canonical-caption-projection-fixture-v1',
): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}|${version}`) }
}
function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}
function specRef(spec: {
  reviewSpecId: string
  schemaVersion: string
  reviewSpecDigestSha256: string
}): CaptionDomainRef {
  return {
    id: spec.reviewSpecId,
    version: spec.schemaVersion,
    contentHash: spec.reviewSpecDigestSha256,
  }
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
        const existing = objects.get(input.objectPath)
        if (existing) {
          if (!existing.equals(input.body)) {
            throw new Error('Caption projection create-only conflict.')
          }
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

function verticalReceipt(input: {
  fullSpec: CaptionRemotionRealSourceReviewSpec
  reducedSpec: CaptionRemotionRealSourceReviewSpec
}): CaptionRealSourceCompleteTimeInspectionReceipt {
  const renders: CaptionRealSourceCompleteTimeInspectionReceipt[
    'renderArtifacts'] = [
      verticalRender('full_motion'),
      verticalRender('reduced_motion'),
    ]
  const contactSheets = renders.flatMap((render) =>
    Array.from({ length: 6 }, (_, sheetIndex) => {
      const startFrame = sheetIndex * 25
      const endFrameExclusive = Math.min(127, startFrame + 25)
      const raster = ref(
        `caption.projection.vertical.${render.variant}.sheet.${sheetIndex}`,
        'caption-complete-time-contact-sheet-raster-v1')
      return {
        sheetId:
          `caption.projection.vertical.${render.variant}.sheet.${sheetIndex}`,
        variant: render.variant,
        renderArtifactRef: render.artifactRef,
        sheetIndex,
        startFrame,
        endFrameExclusive,
        representedFrameCount: endFrameExclusive - startFrame,
        rasterRef: raster,
        rasterSha256: raster.contentHash,
        rasterWidth: 924 as const,
        rasterHeight: 1624 as const,
        tileColumns: 5 as const,
        tileRows: 5 as const,
        thumbnailWidth: 180 as const,
        thumbnailHeight: 320 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }))
  const originalResolutionSpotChecks = renders.flatMap((render) =>
    input.fullSpec.inspectionFrameNumbers.map((frameNumber) => {
      const raster = ref(
        `caption.projection.vertical.${render.variant}.frame.${frameNumber}`,
        'caption-original-resolution-inspection-raster-v1')
      return {
        inspectionItemId:
          `caption.projection.vertical.${render.variant}.frame.${frameNumber}`,
        variant: render.variant,
        renderArtifactRef: render.artifactRef,
        frameNumber,
        rasterRef: raster,
        rasterSha256: raster.contentHash,
        rasterWidth: 360 as const,
        rasterHeight: 640 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }))
  return createCaptionRealSourceCompleteTimeInspectionReceipt({
    inspectionId: 'caption.projection.vertical.inspection',
    observedAt: OBSERVED_AT,
    canonicalScope: input.fullSpec.canonicalScope,
    fullMotionReviewSpecRef: specRef(input.fullSpec),
    reducedMotionReviewSpecRef: specRef(input.reducedSpec),
    renderArtifacts: renders,
    contactSheets,
    originalResolutionSpotChecks,
    coverage: {
      frameCountPerVariant: 127,
      variantCount: 2,
      totalRenderedFramesRepresented: 254,
      everyFrameRepresentedExactlyOnce: true,
      contactSheetCoverageComplete: true,
      originalResolutionSpotChecksComplete: true,
      completeMotionPlaybackClaimed: false,
    },
    findings: clearVerticalFindings(),
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
  }, {
    fullMotionReviewSpec: input.fullSpec,
    reducedMotionReviewSpec: input.reducedSpec,
  })
}

function verticalRender<
  TVariant extends CaptionRealSourceInspectionVariant,
>(
  variant: TVariant,
): Extract<
CaptionRealSourceCompleteTimeInspectionReceipt['renderArtifacts'][number],
{ variant: TVariant }> {
  return {
    variant,
    artifactRef: ref(`caption.projection.vertical.render.${variant}`, '1'),
    mimeType: 'video/mp4',
    byteLength: 1_024,
    rasterWidth: 360,
    rasterHeight: 640,
    fpsNumerator: 30,
    fpsDenominator: 1,
    frameCount: 127,
  } as Extract<
  CaptionRealSourceCompleteTimeInspectionReceipt['renderArtifacts'][number],
  { variant: TVariant }>
}

function clearVerticalFindings() {
  return {
    faceObstructionObserved: false as const,
    gestureObstructionObserved: false as const,
    captionClippingObserved: false as const,
    phraseOverflowObserved: false as const,
    heroAndAccessiblePlateCollisionObserved: false as const,
    unstablePlacementObserved: false as const,
    unusableCueTransitionObserved: false as const,
    tailTruncationObserved: false as const,
  }
}

function multiOutputReceipt(input: {
  specs: [
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
  ]
}): CaptionRealSourceMultiOutputInspectionReceipt {
  const variants: CaptionRealSourceMultiOutputInspectionVariant[] = [
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ]
  const reviewSpecs = variants.map((variant, index) => {
    const spec = input.specs[index]!
    return {
      variant,
      outputFormat: spec.outputFormat,
      reducedMotion: spec.reducedMotion,
      reviewSpecRef: specRef(spec),
      canonicalScope: spec.canonicalScope,
      confirmedOutputFrameRef: spec.confirmedOutputFrame.frameRef,
      confirmedOutputWidth: spec.confirmedOutputFrame.width,
      confirmedOutputHeight: spec.confirmedOutputFrame.height,
    }
  })
  const renderArtifacts = variants.map((variant, index) => {
    const spec = input.specs[index]!
    const artifact = ref(`caption.projection.${variant}.render`, '1')
    return {
      variant,
      outputFormat: spec.outputFormat,
      reducedMotion: spec.reducedMotion,
      reviewSpecRef: specRef(spec),
      artifactRef: artifact,
      artifactSha256: artifact.contentHash,
      mimeType: 'video/mp4' as const,
      byteLength: 2_048,
      rasterWidth: spec.privateReviewFrame.width,
      rasterHeight: spec.privateReviewFrame.height,
      fpsNumerator: 30 as const,
      fpsDenominator: 1 as const,
      frameCount: 127,
    }
  })
  const contactSheets = variants.map((variant, index) => {
    const spec = input.specs[index]!
    const render = renderArtifacts[index]!
    const raster = ref(`caption.projection.${variant}.sheet`,
      'caption-complete-time-contact-sheet-raster-v1')
    const widescreen = spec.outputFormat === 'widescreen_16_9'
    return {
      sheetId: `caption.projection.${variant}.sheet`,
      variant,
      reviewSpecRef: specRef(spec),
      renderArtifactRef: render.artifactRef,
      startFrame: 0 as const,
      endFrameExclusive: 127,
      representedFrameCount: 127,
      rasterRef: raster,
      rasterSha256: raster.contentHash,
      rasterWidth: widescreen ? 1692 as const : 1276 as const,
      rasterHeight: widescreen ? 742 as const : 982 as const,
      tileColumns: 13 as const,
      tileRows: 10 as const,
      thumbnailWidth: widescreen ? 128 as const : 96 as const,
      thumbnailHeight: widescreen ? 72 as const : 96 as const,
      actualRasterOpenedAndInspected: true as const,
    }
  })
  const spotChecks = variants.flatMap((variant, index) => {
    const spec = input.specs[index]!
    const render = renderArtifacts[index]!
    return SPOT_FRAMES.map((frameNumber) => {
      const raster = ref(`caption.projection.${variant}.frame.${frameNumber}`,
        'caption-original-resolution-inspection-raster-v1')
      return {
        inspectionItemId:
          `caption.projection.${variant}.frame.${frameNumber}`,
        variant,
        reviewSpecRef: specRef(spec),
        renderArtifactRef: render.artifactRef,
        frameNumber,
        rasterRef: raster,
        rasterSha256: raster.contentHash,
        rasterWidth: spec.privateReviewFrame.width,
        rasterHeight: spec.privateReviewFrame.height,
        actualRasterOpenedAndInspected: true as const,
      }
    })
  })
  const first = input.specs[0]
  return createCaptionRealSourceMultiOutputInspectionReceipt({
    inspectionId: 'caption.projection.multi-output.inspection',
    observedAt: OBSERVED_AT,
    originalSourceRef: first.sourceEvidence.originalSourceRef,
    originalSourceSha256: first.sourceEvidence.originalSourceSha256,
    reviewSpecs: asTuple4(reviewSpecs),
    renderArtifacts: asTuple4(renderArtifacts),
    contactSheets: asTuple4(contactSheets),
    originalResolutionSpotChecks: spotChecks,
    coverage: {
      outputFormatCount: 2,
      motionVariantCountPerOutput: 2,
      renderArtifactCount: 4,
      frameCountPerRender: 127,
      totalRenderedFramesRepresented: 508,
      everyRenderedFrameRepresentedExactlyOnce: true,
      contactSheetCoverageComplete: true,
      originalResolutionSpotCheckFrames: [8, 21, 80, 122],
      originalResolutionSpotChecksComplete: true,
      outputSpecificRecompositionInspected: true,
      fullReducedMotionSemanticParityInspected: true,
      completeMotionPlaybackClaimed: false,
    },
    findings: clearMultiOutputFindings(),
    designFindings: {
      editorialSidecarReadable: true,
      speakerPanelRemainsVisuallyPrimary: true,
      fullReducedMotionSemanticParityAccepted: true,
      widescreenRecompositionAccepted: true,
      squareRecompositionAccepted: true,
    },
    inspectionMethod:
      'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1',
    inspectorClass: 'codex_agent_direct_visual_inspection',
    realSourcePixelsInspected: true,
    syntheticEngineeringFixtureUsed: false,
    syntheticEngineeringFixtureQualifiedProfessionalAppearance: false,
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
  }, {
    widescreenFullReviewSpec: input.specs[0],
    widescreenReducedReviewSpec: input.specs[1],
    squareFullReviewSpec: input.specs[2],
    squareReducedReviewSpec: input.specs[3],
  })
}

function clearMultiOutputFindings() {
  return {
    sourceSubstitutionObserved: false as const,
    sourceAspectDistortionObserved: false as const,
    crossCanvasEvidenceReuseObserved: false as const,
    faceObstructionObserved: false as const,
    gestureObstructionObserved: false as const,
    captionClippingObserved: false as const,
    phraseOverflowObserved: false as const,
    heroAndAccessiblePlateCollisionObserved: false as const,
    unstablePlacementObserved: false as const,
    unusableCueTransitionObserved: false as const,
    stuckCaptionLayerObserved: false as const,
    tailTruncationObserved: false as const,
  }
}

function asTuple4<T>(values: T[]): [T, T, T, T] {
  assert.equal(values.length, 4)
  return [values[0]!, values[1]!, values[2]!, values[3]!]
}

function receiptRef(receipt: {
  inspectionId: string
  schemaVersion: string
  inspectionDigestSha256: string
}): CaptionDomainRef {
  return {
    id: receipt.inspectionId,
    version: receipt.schemaVersion,
    contentHash: receipt.inspectionDigestSha256,
  }
}

function authority(input: {
  spec: CaptionRemotionRealSourceReviewSpec |
    CaptionRemotionRealSourceMultiOutputReviewSpec
  renderedArtifactRef: CaptionDomainRef
}): CanonicalCaptionRealSourceInspectionAuthority {
  const snapshot = input.spec.canonicalScope.approvedSnapshotRef
  assert.ok(snapshot)
  return createCanonicalCaptionRealSourceInspectionAuthority({
    authorityId:
      `caption.projection.authority.${input.renderedArtifactRef.contentHash}`,
    canonicalScope: {
      ownerUserId: input.spec.canonicalScope.ownerUserId,
      workspaceId: input.spec.canonicalScope.workspaceId,
      projectId: input.spec.canonicalScope.projectId,
      editSessionId: input.spec.canonicalScope.editSessionId,
      planVersionId: input.spec.canonicalScope.planVersionId,
      approvedSnapshotRef: snapshot,
      executionPackageRef: ref(
        `${snapshot.id}.${input.spec.canonicalScope.outputId}.execution-package`,
        'canonical-approved-edit-execution-package-v1'),
      outputId: input.spec.canonicalScope.outputId,
    },
    confirmedOutputFrameRef: input.spec.confirmedOutputFrame.frameRef,
    renderedArtifactRef: input.renderedArtifactRef,
    deterministicQaRef: ref(
      `${input.renderedArtifactRef.id}.deterministic-qa`,
      'canonical-caption-deterministic-qa-v1'),
    originalSourceRef: input.spec.sourceEvidence.originalSourceRef,
    sourceMediaAuthorityRef: ref(`${snapshot.id}.approved-source-media`,
      'private-approved-source-binding-manifest-v1'),
    sourceMediaBindingRefs: [
      ref(`${snapshot.id}.source-binding-a`,
        'private-approved-source-binding-v1'),
      ref(`${snapshot.id}.source-binding-b`,
        'private-approved-source-binding-v1'),
    ].sort((left, right) => refKey(left) < refKey(right) ? -1 : 1),
    exactApprovedSnapshotExecutionPackageOutputAndSourceReread: true,
  })
}

function projectionRequest(input: {
  requestId: string
  receiptKind: 'vertical_complete_time_v1' | 'multi_output_complete_time_v1'
  receiptRef: CaptionDomainRef
  variant: CanonicalCaptionRealSourceInspectionVariant
  authority: CanonicalCaptionRealSourceInspectionAuthority
}): CanonicalCaptionRealSourceInspectionProjectionRequest {
  return createCanonicalCaptionRealSourceInspectionProjectionRequest({
    requestId: input.requestId,
    receiptKind: input.receiptKind,
    receiptRef: input.receiptRef,
    variant: input.variant,
    canonicalScope: input.authority.canonicalScope,
    confirmedOutputFrameRef: input.authority.confirmedOutputFrameRef,
    renderedArtifactRef: input.authority.renderedArtifactRef,
    deterministicQaRef: input.authority.deterministicQaRef,
    expectedOriginalSourceRef: input.authority.originalSourceRef,
    exactCaptionReceiptRereadRequired: true,
    exactReviewSpecRereadRequired: true,
    canonicalApprovedRunAuthorityRereadRequired: true,
    canonicalQualificationReaderMustRevalidateAuthority: true,
    callerSuppliedReceiptAccepted: false,
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
}

async function run(): Promise<void> {
  const sourceBytes = Buffer.alloc(1_024)
  sourceBytes.write('ftyp', 4, 'ascii')
  const verticalFixture = buildCap14RealSourceFixture(sourceBytes)
  const vertical = verticalReceipt({
    fullSpec: verticalFixture.fullSpec,
    reducedSpec: verticalFixture.reducedSpec,
  })
  const multiFixture = buildCap18RealSourceMultiOutputFixture(sourceBytes)
  const multiSpecs: [
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
    CaptionRemotionRealSourceMultiOutputReviewSpec,
  ] = [
    multiFixture.widescreen.fullSpec,
    multiFixture.widescreen.reducedSpec,
    multiFixture.square.fullSpec,
    multiFixture.square.reducedSpec,
  ]
  const multi = multiOutputReceipt({ specs: multiSpecs })
  const bundles = new Map([
    [refKey(receiptRef(vertical)), {
      receiptKind: 'vertical_complete_time_v1' as const,
      receipt: vertical,
      reviewSpecs: [verticalFixture.fullSpec, verticalFixture.reducedSpec],
    }],
    [refKey(receiptRef(multi)), {
      receiptKind: 'multi_output_complete_time_v1' as const,
      receipt: multi,
      reviewSpecs: multiSpecs,
    }],
  ])
  const authorities = new Map<string,
  CanonicalCaptionRealSourceInspectionAuthority>()
  const cases: Array<{
    variant: CanonicalCaptionRealSourceInspectionVariant
    receiptKind: 'vertical_complete_time_v1' | 'multi_output_complete_time_v1'
    receiptRef: CaptionDomainRef
    authority: CanonicalCaptionRealSourceInspectionAuthority
    expectedContactSheets: number
    expectedSpotChecks: number
  }> = []
  for (const [variant, spec, render] of [
    ['vertical_full_motion', verticalFixture.fullSpec,
      vertical.renderArtifacts[0]],
    ['vertical_reduced_motion', verticalFixture.reducedSpec,
      vertical.renderArtifacts[1]],
  ] as const) {
    const canonicalAuthority = authority({
      spec,
      renderedArtifactRef: render.artifactRef,
    })
    authorities.set(refKey(render.artifactRef), canonicalAuthority)
    cases.push({
      variant,
      receiptKind: 'vertical_complete_time_v1',
      receiptRef: receiptRef(vertical),
      authority: canonicalAuthority,
      expectedContactSheets: 6,
      expectedSpotChecks: 12,
    })
  }
  const multiVariants = [
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ] as const
  for (const [index, variant] of multiVariants.entries()) {
    const render = multi.renderArtifacts[index]!
    const canonicalAuthority = authority({
      spec: multiSpecs[index]!,
      renderedArtifactRef: render.artifactRef,
    })
    authorities.set(refKey(render.artifactRef), canonicalAuthority)
    cases.push({
      variant,
      receiptKind: 'multi_output_complete_time_v1',
      receiptRef: receiptRef(multi),
      authority: canonicalAuthority,
      expectedContactSheets: 1,
      expectedSpotChecks: 4,
    })
  }
  const bundleMemory = memoryPort()
  const bundleReadPort =
    createCanonicalCaptionRealSourceInspectionBundleRepository({
      objectPort: bundleMemory.port,
      prefix: 'private-internal/caption-real-source-bundle-smoke',
    })
  const authorityReadPort =
    createCanonicalCaptionRealSourceInspectionAuthorityReadPortV3(
      async (input) => {
        const value = authorities.get(refKey(input.renderedArtifactRef))
        if (!value
          || JSON.stringify(value.canonicalScope) !==
            JSON.stringify(input.canonicalScope)
          || refKey(value.confirmedOutputFrameRef) !==
            refKey(input.confirmedOutputFrameRef)
          || refKey(value.deterministicQaRef) !==
            refKey(input.deterministicQaRef)
          || refKey(value.originalSourceRef) !==
            refKey(input.expectedOriginalSourceRef)) return null
        return structuredClone(value)
      })
  const evidenceMemory = memoryPort()
  const evidenceRepository =
    createCanonicalCaptionDirectVisualInspectionRepository({
      objectPort: evidenceMemory.port,
      prefix: 'private-internal/caption-real-source-projection-smoke',
    })
  const service =
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort,
      authorityReadPort,
      evidenceRepository,
    })

  const requests: CanonicalCaptionRealSourceInspectionProjectionRequest[] = []
  for (const [index, item] of cases.entries()) {
    const request = projectionRequest({
      requestId: `caption.projection.request.${index}`,
      receiptKind: item.receiptKind,
      receiptRef: item.receiptRef,
      variant: item.variant,
      authority: item.authority,
    })
    requests.push(request)
    const bundle = bundles.get(refKey(item.receiptRef))!
    check(await bundleReadPort.persistBundleCreateOnly({
      locator: {
        canonicalScope: request.canonicalScope,
        receiptRef: request.receiptRef,
        variant: request.variant,
      },
      bundle,
    }) === 'created',
    'Each tenant/output/variant inspection bundle must persist create-only.')
    const outcome = await service.project(request)
    check(outcome.canonicalApprovedRunAuthorityRereadTwice
      && outcome.evidencePersistedCreateOnlyAndReread,
    'Every projection must reread approved authority and persist create-only.')
    check(outcome.evidence.coverage.contactSheetCount ===
      item.expectedContactSheets
      && outcome.evidence.coverage.originalResolutionSpotCheckCount ===
        item.expectedSpotChecks,
    'Every output must preserve its exact inspected coverage.')
    check(refKey(outcome.evidence.inspectionArtifactSetRef) ===
      refKey(item.receiptRef)
      && refKey(outcome.evidence.sourceMediaAuthorityRef) ===
        refKey(item.authority.sourceMediaAuthorityRef)
      && outcome.canonicalApprovedRunAuthorityRef.contentHash ===
        item.authority.authorityDigestSha256,
    'The evidence must bind the exact Caption receipt and canonical source owner.')
    check(outcome.evidence.realUploadedSourcePixelsInspected
      && !outcome.evidence.syntheticEngineeringFixtureUsed
      && !outcome.evidence.sharedPostrenderModelReviewClaimed
      && !outcome.evidence.independentFinalQaClaimed
      && !outcome.publicOrProductionAuthorityGranted,
    'Projection must preserve real-source truth and every downstream closed gate.')
  }
  check(bundleMemory.objects.size === 6
    && evidenceMemory.objects.size === 6,
  'All six exact output variants must persist as separate evidence records.')
  const replay = await service.project(requests[0]!)
  check(replay.evidence.evidenceDigestSha256 ===
    (await service.project(requests[0]!)).evidence.evidenceDigestSha256,
  'Exact replay must remain byte-identical and idempotent.')
  const firstRequest = requests[0]!
  const terminalRequest =
    createCanonicalCaptionTerminalQualificationRequest({
      requestId: 'caption.projection.qualification-run.request',
      canonicalScope: {
        ownerUserId: firstRequest.canonicalScope.ownerUserId,
        workspaceId: firstRequest.canonicalScope.workspaceId,
        projectId: firstRequest.canonicalScope.projectId,
        editSessionId: firstRequest.canonicalScope.editSessionId,
        planVersionId: firstRequest.canonicalScope.planVersionId,
        approvedSnapshotRef:
          firstRequest.canonicalScope.approvedSnapshotRef,
      },
      executionPackageRef: firstRequest.canonicalScope.executionPackageRef,
      currentJobReadinessRef: {
        id: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerId,
        version: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.schemaVersion,
        contentHash:
          CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerDigestSha256,
      },
      requiredOutputIds: [firstRequest.canonicalScope.outputId],
      privateInternalQualificationRun: true,
      callerSuppliedEvidenceAccepted: false,
      browserLocalCompletionAccepted: false,
      rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false,
      operationOrRuntimeAuthorityGrantedToCaption: false,
      providerOrModelAuthorityGrantedToCaption: false,
      assetMutationAuthorityGrantedToCaption: false,
      finalQaApprovalAuthorityGrantedToCaption: false,
      creditOrBillingAuthorityGrantedToCaption: false,
      publicDeliveryAuthorityGrantedToCaption: false,
      productionAuthorityGrantedToCaption: false,
    })
  const runAssembly = createCanonicalCaptionQualificationRunEvidenceAssembly({
    sourceReadPort:
      createCanonicalCaptionQualificationRunEvidenceReadPort(async () => null),
    repository: createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort: memoryPort().port,
      prefix: 'private-internal/caption-projection-controller-run-smoke',
    }),
  })
  const controller = createCanonicalCaptionPrivateQualificationRunController({
    inspectionBundleRepository: bundleReadPort,
    inspectionProjectionService: service,
    runEvidenceAssembly: runAssembly,
  })
  expectThrow(() => createCanonicalCaptionPrivateQualificationRunController({
    inspectionBundleRepository: bundleReadPort,
    inspectionProjectionService: service,
    runEvidenceAssembly: { ...runAssembly },
  }))
  const controllerInput = {
    inspectionRequest: firstRequest,
    inspectionBundle: bundles.get(refKey(firstRequest.receiptRef))!,
    qualificationRequest: terminalRequest,
    captionOwnedClosedDirectInspectionReceiptProvided: true as const,
    exactApprovedRunRereadRequired: true as const,
    callerSuppliedCanonicalAuthorityAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  const pendingRun = await controller.reconcileApprovedRun(controllerInput)
  check(pendingRun.disposition ===
    'inspection_projected_waiting_for_complete_run'
    && pendingRun.qualificationRunEvidence === null
    && pendingRun.qualificationRunEvidenceRef === null
    && pendingRun.canonicalRunEvidenceSourceReadAttempted
    && !pendingRun.qualificationRunEvidencePersistedAndExactReread
    && !pendingRun.incompleteRunPromoted,
  'The controller must persist inspection evidence and wait for missing gates.')
  const pendingReplay = await controller.reconcileApprovedRun(controllerInput)
  check(pendingReplay.outcomeDigestSha256 === pendingRun.outcomeDigestSha256,
  'The incomplete approved-run replay must remain deterministic and idempotent.')
  const falselyPersisted = structuredClone(pendingRun) as unknown as
    Record<string, unknown>
  falselyPersisted.qualificationRunEvidencePersistedAndExactReread = true
  falselyPersisted.outcomeDigestSha256 = calculateSkillContractDigest(
    falselyPersisted, 'outcomeDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateQualificationRunOutcome(
    falselyPersisted))
  const crossedTerminalRequest =
    createCanonicalCaptionTerminalQualificationRequest({
      ...structuredClone(terminalRequest),
      requestId: 'caption.projection.qualification-run.crossed',
      requiredOutputIds: ['caption-projection-crossed-output'],
    })
  await expectReject(() => controller.reconcileApprovedRun({
    ...controllerInput,
    qualificationRequest: crossedTerminalRequest,
  }))
  check(await bundleReadPort.persistBundleCreateOnly({
    locator: {
      canonicalScope: requests[0]!.canonicalScope,
      receiptRef: requests[0]!.receiptRef,
      variant: requests[0]!.variant,
    },
    bundle: bundles.get(refKey(requests[0]!.receiptRef))!,
  }) === 'identical_replay',
  'The tenant-scoped receipt bundle replay must be byte-identical.')
  const crossedTenantLocator = {
    canonicalScope: {
      ...structuredClone(requests[0]!.canonicalScope),
      ownerUserId: 'caption-projection-other-owner',
    },
    receiptRef: requests[0]!.receiptRef,
    variant: requests[0]!.variant,
  }
  check(await bundleReadPort.readExact(crossedTenantLocator) === null,
  'A different tenant must not locate the persisted inspection bundle.')
  await expectReject(() => bundleReadPort.persistBundleCreateOnly({
    locator: crossedTenantLocator,
    bundle: bundles.get(refKey(requests[0]!.receiptRef))!,
  }))

  const stale = structuredClone(requests[0]!)
  stale.expectedOriginalSourceRef = ref('caption.projection.crossed.source')
  expectThrow(() => parseCanonicalCaptionRealSourceInspectionProjectionRequest(
    stale))

  const wrongKind = structuredClone(requests[0]!)
  wrongKind.variant = 'square_full_motion'
  wrongKind.requestDigestSha256 = calculateSkillContractDigest(
    wrongKind as unknown as Record<string, unknown>, 'requestDigestSha256')
  expectThrow(() => parseCanonicalCaptionRealSourceInspectionProjectionRequest(
    wrongKind))

  const unsafe = structuredClone(requests[0]!) as unknown as
    Record<string, unknown>
  unsafe.browserPath = '/Users/example/caption.png'
  unsafe.requestDigestSha256 = calculateSkillContractDigest(
    unsafe, 'requestDigestSha256')
  expectThrow(() => parseCanonicalCaptionRealSourceInspectionProjectionRequest(
    unsafe))

  const crossedSource = projectionRequest({
    requestId: 'caption.projection.crossed-source',
    receiptKind: cases[0]!.receiptKind,
    receiptRef: cases[0]!.receiptRef,
    variant: cases[0]!.variant,
    authority: {
      ...structuredClone(cases[0]!.authority),
      originalSourceRef: ref('caption.projection.wrong-original-source'),
    },
  })
  await expectReject(() => service.project(crossedSource))

  let bundleReads = 0
  const changingBundlePort =
    createCanonicalCaptionRealSourceInspectionBundleReadPortV2(async () => {
      bundleReads += 1
      const bundle = structuredClone(bundles.get(
        refKey(receiptRef(vertical)))!)
      if (bundleReads === 2) {
        (bundle.receipt as CaptionRealSourceCompleteTimeInspectionReceipt)
          .observedAt = '2026-08-05T20:46:00.000Z'
      }
      return bundle
    })
  await expectReject(() =>
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort: changingBundlePort,
      authorityReadPort,
      evidenceRepository,
    }).project(requests[0]!))

  let authorityReads = 0
  const changingAuthorityPort =
    createCanonicalCaptionRealSourceInspectionAuthorityReadPortV3(async () => {
      authorityReads += 1
      const value = structuredClone(cases[0]!.authority)
      if (authorityReads === 2) {
        value.deterministicQaRef = ref('caption.projection.changed.qa')
        value.authorityDigestSha256 = calculateSkillContractDigest(
          value as unknown as Record<string, unknown>,
          'authorityDigestSha256')
      }
      return value
    })
  await expectReject(() =>
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort,
      authorityReadPort: changingAuthorityPort,
      evidenceRepository,
    }).project(requests[0]!))

  const unsortedAuthorityPort =
    createCanonicalCaptionRealSourceInspectionAuthorityReadPortV3(async () => {
      const value = structuredClone(cases[0]!.authority)
      value.sourceMediaBindingRefs.reverse()
      value.authorityDigestSha256 = calculateSkillContractDigest(
        value as unknown as Record<string, unknown>,
        'authorityDigestSha256')
      return value
    })
  await expectReject(() =>
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort,
      authorityReadPort: unsortedAuthorityPort,
      evidenceRepository,
    }).project(requests[0]!))

  expectThrow(() =>
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort: {
        schemaVersion:
          'canonical-caption-real-source-inspection-bundle-read-port-v2',
        sourceAuthority:
          'caption_owned_tenant_scoped_persisted_real_source_inspection_bundle',
        callerSuppliedReceiptAccepted: false,
        async readExact() { return null },
      },
      authorityReadPort,
      evidenceRepository,
    }))
  expectThrow(() =>
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort,
      authorityReadPort: {
        schemaVersion:
          'canonical-caption-real-source-inspection-authority-read-port-v3',
        sourceAuthority: 'canonical_backend_approved_caption_run_authority',
        callerSuppliedAuthorityAccepted: false,
        exactOriginalSourceBindingRequired: true,
        async readExact() { return null },
      },
      evidenceRepository,
    }))

  console.log(JSON.stringify({
    smoke: 'canonical_caption_real_source_inspection_projection_service',
    status: 'passed',
    assertions,
    projectedOutputVariants: cases.length,
    sourceContractFixtureOnly: true,
    actualHistoricalInspectionReceiptsConsumedAtRuntime: false,
    canonicalApprovedRunAuthorityRereadTwice: true,
    exactOriginalSourceBindingRequired: true,
    inspectionToRunControllerPendingPathVerified: true,
    incompleteRunPromoted: false,
    actualQualificationCatalogPersisted: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    sharedPostrenderModelReviewClaimed: false,
    independentFinalQaClaimed: false,
    providerOrModelCallMade: false,
    publicOrProductionAuthorityGranted: false,
  }, null, 2))
}

void run()
