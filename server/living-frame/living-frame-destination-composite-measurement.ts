import { createHash } from 'node:crypto'

import type {
  LivingFrameAlphaMeasurementReport,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_DESTINATION_COMPOSITE_BLOCKING_FINDINGS,
  LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_CLASS,
  LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_VERSION,
  LIVING_FRAME_DESTINATION_COMPOSITE_OPEN_GATES,
  type LivingFrameDestinationCompositeBlockingFinding,
  type LivingFrameDestinationCompositeMeasurement,
  type LivingFrameDestinationCompositeMeasurementAuthority,
  type LivingFrameDestinationCompositeMeasurementDraft,
} from '../../src/types/living-frame-destination-composite-measurement'
import type {
  LivingFrameGeneratedStillArtifactQaProjection,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameGeneratedStillArtifactQaProjection,
} from './living-frame-generated-still-artifact-qa-projection'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_DIMENSION = 8192
const MAX_PIXEL_COUNT = 16_777_216
const EXPECTED_BACKGROUNDS = [
  'black',
  'white',
  'mid_gray',
  'saturated_red',
  'destination_raster',
] as const

const AUTHORITY_BOUNDARY:
  LivingFrameDestinationCompositeMeasurementAuthority =
  Object.freeze({
    measurementOnly: true,
    sourceTruthAuthority: false,
    identityAuthority: false,
    continuityQaAuthority: false,
    documentaryFactAuthority: false,
    artifactQaAuthority: false,
    finalQaAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    serviceFeeAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    dispatchAuthority: false,
    assetManifestAuthority: false,
    privateReviewAuthority: false,
    rendererAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface MeasureLivingFrameDestinationCompositeInput {
  readonly measurementId: string
  readonly artifactQaProjection:
    LivingFrameGeneratedStillArtifactQaProjection
  readonly baseAlphaMeasurementReport:
    LivingFrameAlphaMeasurementReport
  readonly sceneBinding: {
    readonly sceneId: string
    readonly componentId: string
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
    readonly masterTimingPlanId: string
    readonly masterTimingDigestSha256: string
    readonly destinationFrameIndex: number
  }
  readonly componentArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly width: number
    readonly height: number
    readonly rgbaBytes: Uint8Array
  }
  readonly destinationFrame: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly frameIndex: number
    readonly width: number
    readonly height: number
    readonly rgbBytes: Uint8Array
  }
}

export function measureLivingFrameDestinationComposite(
  input: MeasureLivingFrameDestinationCompositeInput,
): LivingFrameDestinationCompositeMeasurement {
  assertInput(input)
  const report = measureLivingFrameAlphaArtifact({
    artifactId: input.componentArtifact.artifactId,
    artifactDigestSha256:
      input.componentArtifact.artifactDigestSha256,
    frameIndex: input.destinationFrame.frameIndex,
    width: input.componentArtifact.width,
    height: input.componentArtifact.height,
    rgbaBytes: input.componentArtifact.rgbaBytes,
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
    destinationRgbBytes: input.destinationFrame.rgbBytes,
  })
  const destination = report.composites.find(
    (entry) =>
      entry.backgroundId === 'destination_raster',
  )
  if (
    !destination
    || stableAuthorityStringify(
      report.composites.map((entry) =>
        entry.backgroundId),
    ) !== stableAuthorityStringify(EXPECTED_BACKGROUNDS)
    || !report.compositeContext.destinationRasterProvided
    || report.compositeContext.destinationRgbDigestSha256
      !== sha256Bytes(input.destinationFrame.rgbBytes)
  ) {
    throw new Error(
      'Living Frame destination composite measurement is incomplete.',
    )
  }
  const blockingFindingCodes =
    report.findingCodes.filter(
      (code): code is
        LivingFrameDestinationCompositeBlockingFinding =>
        LIVING_FRAME_DESTINATION_COMPOSITE_BLOCKING_FINDINGS
          .includes(
            code as LivingFrameDestinationCompositeBlockingFinding,
          ),
    )
  const draft:
    LivingFrameDestinationCompositeMeasurementDraft = {
    contractVersion:
      LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_VERSION,
    evidenceClass:
      LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_CLASS,
    measurementId: input.measurementId,
    measurementState:
      blockingFindingCodes.length === 0
        ? 'measurement_clear_pending_canonical_qa'
        : 'blocked_by_destination_composite_findings',
    sceneBinding: {
      ...input.sceneBinding,
    },
    sourceBindings: {
      generatedStillArtifactQaProjectionId:
        input.artifactQaProjection.projectionId,
      generatedStillArtifactQaProjectionDigestSha256:
        input.artifactQaProjection.projectionDigestSha256,
      baseAlphaMeasurementReportDigestSha256:
        input.baseAlphaMeasurementReport.reportDigestSha256,
    },
    componentArtifact: {
      artifactId: input.componentArtifact.artifactId,
      artifactDigestSha256:
        input.componentArtifact.artifactDigestSha256,
      decodedRgbaDigestSha256:
        report.artifactIdentity.measuredRgbaDigestSha256,
      width: input.componentArtifact.width,
      height: input.componentArtifact.height,
      alphaMode: 'straight_alpha',
    },
    destinationFrame: {
      artifactId: input.destinationFrame.artifactId,
      artifactDigestSha256:
        input.destinationFrame.artifactDigestSha256,
      decodedRgbDigestSha256:
        report.compositeContext.destinationRgbDigestSha256!,
      width: input.destinationFrame.width,
      height: input.destinationFrame.height,
      frameIndex: input.destinationFrame.frameIndex,
    },
    destinationAlphaMeasurementReport: report,
    destinationComposite: {
      ...destination,
      backgroundId: 'destination_raster',
    },
    blockingFindingCodes,
    openGateCodes: [
      ...LIVING_FRAME_DESTINATION_COMPOSITE_OPEN_GATES,
    ],
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawPixelsPathsUrlsCredentialsPromptsOrCommands: false,
    canonicalQaPassed: false,
    assetManifestUpdated: false,
    sceneEvidenceReconciled: false,
    remotionAuthorized: false,
    productionReady: false,
  }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    measurementDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameDestinationCompositeMeasurement(
  value: unknown,
): value is LivingFrameDestinationCompositeMeasurement {
  if (!isRecord(value)) return false
  const digest = value.measurementDigestSha256
  if (typeof digest !== 'string' || !SHA256.test(digest)) {
    return false
  }
  const {
    measurementDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  try {
    assertDraft(
      draft as unknown as
        LivingFrameDestinationCompositeMeasurementDraft,
    )
    return sha256AuthorityValue(draft) === digest
  } catch {
    return false
  }
}

function assertInput(
  input: MeasureLivingFrameDestinationCompositeInput,
): void {
  if (
    !isSafeId(input.measurementId)
    || !verifyLivingFrameGeneratedStillArtifactQaProjection(
      input.artifactQaProjection,
    )
    || !verifyLivingFrameAlphaMeasurementReportDigest(
      input.baseAlphaMeasurementReport,
    )
    || input.baseAlphaMeasurementReport.reportDigestSha256
      !== input.artifactQaProjection.sourceBindings
        .alphaMeasurementReportDigestSha256
    || input.baseAlphaMeasurementReport.artifactIdentity.artifactId
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputArtifactId
    || input.baseAlphaMeasurementReport.artifactIdentity
      .artifactDigestSha256
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputContentSha256
    || input.baseAlphaMeasurementReport.artifactIdentity
      .measuredRgbaDigestSha256
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputDecodedRgbaSha256
    || input.baseAlphaMeasurementReport.compositeContext
      .destinationRasterProvided
    || input.componentArtifact.artifactId
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputArtifactId
    || input.componentArtifact.artifactDigestSha256
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputContentSha256
    || sha256Bytes(input.componentArtifact.rgbaBytes)
      !== input.artifactQaProjection.canonicalSharpExpectation
        .outputDecodedRgbaSha256
    || input.destinationFrame.frameIndex
      !== input.sceneBinding.destinationFrameIndex
    || ![
      input.sceneBinding.sceneId,
      input.sceneBinding.componentId,
      input.sceneBinding.outputFrameId,
      input.sceneBinding.masterTimingPlanId,
      input.destinationFrame.artifactId,
    ].every(isSafeId)
    || ![
      input.sceneBinding.outputFrameDigestSha256,
      input.sceneBinding.masterTimingDigestSha256,
      input.destinationFrame.artifactDigestSha256,
    ].every((value) => SHA256.test(value))
    || !validRaster(
      input.componentArtifact.width,
      input.componentArtifact.height,
    )
    || input.destinationFrame.width
      !== input.componentArtifact.width
    || input.destinationFrame.height
      !== input.componentArtifact.height
    || !(input.componentArtifact.rgbaBytes instanceof Uint8Array)
    || input.componentArtifact.rgbaBytes.byteLength
      !== input.componentArtifact.width
        * input.componentArtifact.height * 4
    || !(input.destinationFrame.rgbBytes instanceof Uint8Array)
    || input.destinationFrame.rgbBytes.byteLength
      !== input.destinationFrame.width
        * input.destinationFrame.height * 3
    || !Number.isSafeInteger(
      input.destinationFrame.frameIndex,
    )
    || input.destinationFrame.frameIndex < 0
  ) {
    throw new Error(
      'Living Frame destination composite input is invalid.',
    )
  }
}

function assertDraft(
  draft: LivingFrameDestinationCompositeMeasurementDraft,
): void {
  const report = draft.destinationAlphaMeasurementReport
  if (
    !hasExactKeys(draft, [
      'contractVersion',
      'evidenceClass',
      'measurementId',
      'measurementState',
      'sceneBinding',
      'sourceBindings',
      'componentArtifact',
      'destinationFrame',
      'destinationAlphaMeasurementReport',
      'destinationComposite',
      'blockingFindingCodes',
      'openGateCodes',
      'authorityBoundary',
      'containsRawPixelsPathsUrlsCredentialsPromptsOrCommands',
      'canonicalQaPassed',
      'assetManifestUpdated',
      'sceneEvidenceReconciled',
      'remotionAuthorized',
      'productionReady',
    ])
    || !hasExactKeys(draft.sceneBinding, [
      'sceneId',
      'componentId',
      'outputFrameId',
      'outputFrameDigestSha256',
      'masterTimingPlanId',
      'masterTimingDigestSha256',
      'destinationFrameIndex',
    ])
    || !hasExactKeys(draft.sourceBindings, [
      'generatedStillArtifactQaProjectionId',
      'generatedStillArtifactQaProjectionDigestSha256',
      'baseAlphaMeasurementReportDigestSha256',
    ])
    || !hasExactKeys(draft.componentArtifact, [
      'artifactId',
      'artifactDigestSha256',
      'decodedRgbaDigestSha256',
      'width',
      'height',
      'alphaMode',
    ])
    || !hasExactKeys(draft.destinationFrame, [
      'artifactId',
      'artifactDigestSha256',
      'decodedRgbDigestSha256',
      'width',
      'height',
      'frameIndex',
    ])
    || !hasExactKeys(draft.destinationComposite, [
      'backgroundId',
      'edgeSampleCount',
      'meanEdgeContrast',
      'lowContrastEdgeRatio',
    ])
    || !hasExactKeys(
      draft.authorityBoundary,
      Object.keys(AUTHORITY_BOUNDARY),
    )
    || draft.contractVersion !==
      LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_VERSION
    || draft.evidenceClass !==
      LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_CLASS
    || !isSafeId(draft.measurementId)
    || ![
      draft.sceneBinding.sceneId,
      draft.sceneBinding.componentId,
      draft.sceneBinding.outputFrameId,
      draft.sceneBinding.masterTimingPlanId,
      draft.sourceBindings.generatedStillArtifactQaProjectionId,
      draft.componentArtifact.artifactId,
      draft.destinationFrame.artifactId,
    ].every(isSafeId)
    || ![
      draft.sceneBinding.outputFrameDigestSha256,
      draft.sceneBinding.masterTimingDigestSha256,
      draft.sourceBindings
        .generatedStillArtifactQaProjectionDigestSha256,
      draft.sourceBindings
        .baseAlphaMeasurementReportDigestSha256,
      draft.componentArtifact.artifactDigestSha256,
      draft.componentArtifact.decodedRgbaDigestSha256,
      draft.destinationFrame.artifactDigestSha256,
      draft.destinationFrame.decodedRgbDigestSha256,
    ].every((value) => SHA256.test(value))
    || !validRaster(
      draft.componentArtifact.width,
      draft.componentArtifact.height,
    )
    || draft.destinationFrame.width
      !== draft.componentArtifact.width
    || draft.destinationFrame.height
      !== draft.componentArtifact.height
    || !Number.isSafeInteger(
      draft.sceneBinding.destinationFrameIndex,
    )
    || draft.sceneBinding.destinationFrameIndex < 0
    || draft.destinationFrame.frameIndex
      !== draft.sceneBinding.destinationFrameIndex
    || draft.componentArtifact.alphaMode
      !== 'straight_alpha'
    || !verifyLivingFrameAlphaMeasurementReportDigest(report)
    || !report.compositeContext.destinationRasterProvided
    || report.compositeContext.destinationRgbDigestSha256
      !== draft.destinationFrame.decodedRgbDigestSha256
    || report.artifactIdentity.artifactId
      !== draft.componentArtifact.artifactId
    || report.artifactIdentity.artifactDigestSha256
      !== draft.componentArtifact.artifactDigestSha256
    || report.artifactIdentity.measuredRgbaDigestSha256
      !== draft.componentArtifact.decodedRgbaDigestSha256
    || report.artifactIdentity.frameIndex
      !== draft.destinationFrame.frameIndex
    || stableAuthorityStringify(
      report.composites.map((entry) =>
        entry.backgroundId),
    ) !== stableAuthorityStringify(EXPECTED_BACKGROUNDS)
    || stableAuthorityStringify(
      draft.destinationComposite,
    ) !== stableAuthorityStringify(
      report.composites.find((entry) =>
        entry.backgroundId === 'destination_raster'),
    )
    || stableAuthorityStringify(
      draft.blockingFindingCodes,
    ) !== stableAuthorityStringify(
      report.findingCodes.filter((code) =>
        LIVING_FRAME_DESTINATION_COMPOSITE_BLOCKING_FINDINGS
          .includes(
            code as LivingFrameDestinationCompositeBlockingFinding,
          )),
    )
    || draft.measurementState !==
      (draft.blockingFindingCodes.length === 0
        ? 'measurement_clear_pending_canonical_qa'
        : 'blocked_by_destination_composite_findings')
    || stableAuthorityStringify(draft.openGateCodes)
      !== stableAuthorityStringify(
        LIVING_FRAME_DESTINATION_COMPOSITE_OPEN_GATES,
      )
    || Object.entries(draft.authorityBoundary)
      .some(([key, value]) =>
        key === 'measurementOnly'
          ? value !== true
          : value !== false)
    || draft.containsRawPixelsPathsUrlsCredentialsPromptsOrCommands
      !== false
    || draft.canonicalQaPassed
    || draft.assetManifestUpdated
    || draft.sceneEvidenceReconciled
    || draft.remotionAuthorized
    || draft.productionReady
  ) {
    throw new Error(
      'Living Frame destination composite measurement is invalid.',
    )
  }
}

function validRaster(width: number, height: number): boolean {
  return (
    Number.isSafeInteger(width)
    && Number.isSafeInteger(height)
    && width > 0
    && height > 0
    && width <= MAX_DIMENSION
    && height <= MAX_DIMENSION
    && width * height <= MAX_PIXEL_COUNT
  )
}

function isSafeId(value: string): boolean {
  return SAFE_ID.test(value)
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function isRecord(value: unknown):
  value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) return false
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return stableAuthorityStringify(actual)
    === stableAuthorityStringify(expected)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
