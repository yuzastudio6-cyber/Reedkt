import { z } from 'zod'

import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
  type LivingFrameAlphaMeasurementReport,
} from '../../src/types/living-frame-alpha-measurement'
import type {
  LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-alpha-bridge'
import type {
  LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-gpu-runtime'
import {
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_ISSUE_CODES,
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_CLASS,
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_STATE,
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_VERSION,
  type LivingFrameGeneratedStillArtifactQaAuthorityBoundary,
  type LivingFrameGeneratedStillArtifactQaIssue,
  type LivingFrameGeneratedStillArtifactQaIssueCode,
  type LivingFrameGeneratedStillArtifactQaProjection,
  type LivingFrameGeneratedStillArtifactQaProjectionDraft,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt,
} from './living-frame-controlled-sdxl-rembg-alpha-bridge'
import {
  verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from './living-frame-controlled-sdxl-rembg-gpu-runtime'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const FORBIDDEN_SERIALIZED_KEYS = [
  '"bytes"',
  '"path"',
  '"url"',
  '"credential"',
  '"prompt"',
  '"command"',
  '"provider"',
] as const

const AUTHORITY_BOUNDARY:
  LivingFrameGeneratedStillArtifactQaAuthorityBoundary =
  Object.freeze({
    structuralProjectionOnly: true,
    sourceTruthAuthority: false,
    selectedSceneAuthority: false,
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
    workerLeaseAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    dispatchAuthority: false,
    artifactPersistenceAuthority: false,
    artifactQaAuthority: false,
    assetManifestAuthority: false,
    continuityQaAuthority: false,
    documentaryFactAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const inputSchema = z.object({
  projectionId: z.string().regex(SAFE_ID),
}).strict()

const dependencySchema = z.object({
  order: z.union([z.literal(0), z.literal(1)]),
  role: z.enum([
    'opaque_generated_source',
    'verified_alpha_mask',
  ]),
  artifactId: z.string().regex(SAFE_ID),
  contentSha256: z.string().regex(SHA256),
  expectedArtifactType: z.enum([
    'living_frame_generated_opaque_still_png',
    'living_frame_alpha_mask_png',
  ]),
  contentType: z.literal('image/png'),
  serverRereadRequired: z.literal(true),
  qaReconciliationRequired: z.literal(true),
}).strict()

const authoritySchema = z.object({
  structuralProjectionOnly: z.literal(true),
  ...Object.fromEntries(
    Object.keys(AUTHORITY_BOUNDARY)
      .filter((key) => key !== 'structuralProjectionOnly')
      .map((key) => [key, z.literal(false)]),
  ),
}).strict()

const draftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_CLASS,
  ),
  projectionId: z.string().regex(SAFE_ID),
  projectionState: z.literal(
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_STATE,
  ),
  sourceBindings: z.object({
    bridgeObservationId: z.string().regex(SAFE_ID),
    bridgeObservationDigestSha256: z.string().regex(SHA256),
    rembgRuntimeObservationDigestSha256:
      z.string().regex(SHA256),
    approvedPlanSnapshotId: z.string().regex(SAFE_ID),
    expectedMaskAssetId: z.string().regex(SAFE_ID),
    expectedAlphaComponentAssetId: z.string().regex(SAFE_ID),
    alphaMeasurementReportDigestSha256: z.string().regex(SHA256),
    measuredRgbaDigestSha256: z.string().regex(SHA256),
  }).strict(),
  dependencyProjection: z.tuple([
    dependencySchema,
    dependencySchema,
  ]),
  canonicalSharpExpectation: z.object({
    canonicalToolId: z.literal('sharp'),
    operationId: z.literal(
      'tool.sharp.prepare_approved_image_asset.v1',
    ),
    imageRecipeId: z.literal(
      'approved_living_frame_alpha_component_v1',
    ),
    runnerClass: z.literal(
      'offline_sharp_structured_execution_v1',
    ),
    outputArtifactId: z.string().regex(SAFE_ID),
    outputArtifactType: z.literal(
      'living_frame_component_rgba_png',
    ),
    outputContentType: z.literal('image/png'),
    outputContentSha256: z.string().regex(SHA256),
    outputDecodedRgbaSha256: z.string().regex(SHA256),
    alphaMode: z.literal('straight_alpha'),
    transparentRgbCleared: z.literal(true),
    sourcePixelsUnmodified: z.literal(true),
    canonicalDispatchRereadRequired: z.literal(true),
    canonicalWorkerLeaseRequired: z.literal(true),
    canonicalExecutionStillRequired: z.literal(true),
  }).strict(),
  canonicalQaExpectation: z.object({
    requiredGateIds: z.tuple([
      z.literal('asset_received_gate'),
      z.literal('asset_quality_gate'),
    ]),
    alphaMeasurementFindingCodes: z.array(
      z.enum(LIVING_FRAME_ALPHA_FINDING_CODES),
    ).length(1),
    onlyNonBlockingAlphaVariationFindingPresent: z.literal(true),
    multiBackgroundMeasurementPresent: z.literal(true),
    destinationCompositeMeasurementPresent: z.literal(false),
    canonicalArtifactQaStillRequired: z.literal(true),
    destinationCompositeQaStillRequired: z.literal(true),
  }).strict(),
  existingAuthorityReuse: z.object({
    canonicalWorkerLeaseAuthorityReused: z.literal(true),
    canonicalPrivateImageArtifactStorageReused: z.literal(true),
    canonicalPrivateArtifactQaAuthorityReused: z.literal(true),
    canonicalAssetManifestReconciliationReused: z.literal(true),
    canonicalPrivateReviewReused: z.literal(true),
    duplicateTimingSystemCreated: z.literal(false),
    duplicateWorkerSystemCreated: z.literal(false),
    duplicateCreditSystemCreated: z.literal(false),
    duplicateApprovalSystemCreated: z.literal(false),
    duplicateQaSystemCreated: z.literal(false),
    duplicateRendererCreated: z.literal(false),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
  )).length(
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES.length,
  ),
  authorityBoundary: authoritySchema,
  containsRawImageMaskOrAlphaBytes: z.literal(false),
  containsPathUrlCredentialPromptOrCommand: z.literal(false),
  artifactPersisted: z.literal(false),
  artifactQaPassed: z.literal(false),
  assetManifestUpdated: z.literal(false),
  renderAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const projectionSchema = draftSchema.extend({
  projectionDigestSha256: z.string().regex(SHA256),
}).strict()

export interface ProjectLivingFrameGeneratedStillArtifactQaInput {
  readonly projectionId: string
  readonly bridgeReceipt:
    LivingFrameControlledSdxlRembgAlphaBridgeReceipt
  readonly rembgRuntimeReceipt:
    LivingFrameControlledSdxlRembgGpuRuntimeReceipt
  readonly alphaMeasurementReport:
    LivingFrameAlphaMeasurementReport
}

export class LivingFrameGeneratedStillArtifactQaProjectionError
  extends Error {
  readonly issues:
    readonly LivingFrameGeneratedStillArtifactQaIssue[]

  constructor(
    issues: readonly LivingFrameGeneratedStillArtifactQaIssue[],
  ) {
    super(
      'Living Frame generated-still artifact-QA projection failed.',
    )
    this.name =
      'LivingFrameGeneratedStillArtifactQaProjectionError'
    this.issues = issues
  }
}

export function projectLivingFrameGeneratedStillArtifactQa(
  input: ProjectLivingFrameGeneratedStillArtifactQaInput,
): LivingFrameGeneratedStillArtifactQaProjection {
  const parsed = inputSchema.safeParse({
    projectionId: input?.projectionId,
  })
  if (!parsed.success) {
    throw issue('input_invalid', '$.projectionId')
  }
  if (
    !verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt(
      input.bridgeReceipt,
    )
  ) throw issue('bridge_receipt_invalid', '$.bridgeReceipt')
  if (
    !verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt(
      input.rembgRuntimeReceipt,
    )
    || input.rembgRuntimeReceipt.hostObservation.terminalState
      !== 'completed'
    || !input.rembgRuntimeReceipt.maskOutput
  ) throw issue(
    'rembg_runtime_receipt_invalid',
    '$.rembgRuntimeReceipt',
  )
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(
      input.alphaMeasurementReport,
    )
  ) throw issue(
    'alpha_measurement_invalid',
    '$.alphaMeasurementReport',
  )
  assertMeasurementLineage(
    input.bridgeReceipt,
    input.alphaMeasurementReport,
  )
  if (
    input.bridgeReceipt.sourceBindings
      .rembgRuntimeObservationDigestSha256
      !== input.rembgRuntimeReceipt
        .runtimeObservationDigestSha256
    || input.bridgeReceipt.sourceBindings
      .generatedOpaqueSourceArtifactId
      !== input.rembgRuntimeReceipt.sourceBindings
        .generatedOpaqueSourceArtifactId
    || input.bridgeReceipt.sourceBindings
      .generatedOpaqueSourceContentSha256
      !== input.rembgRuntimeReceipt.sourceBindings
        .generatedOpaqueSourceContentSha256
    || input.bridgeReceipt.sourceBindings
      .rembgMaskContentSha256
      !== input.rembgRuntimeReceipt.maskOutput
        .contentSha256
    || input.bridgeReceipt.sourceBindings
      .approvedPlanSnapshotId
      !== input.rembgRuntimeReceipt.sourceBindings
        .approvedPlanSnapshotId
  ) throw issue(
    'bridge_measurement_lineage_mismatch',
    '$.rembgRuntimeReceipt',
  )
  assertNonBlockingAlphaMeasurement(
    input.alphaMeasurementReport,
  )

  const bridge = input.bridgeReceipt
  const report = input.alphaMeasurementReport
  const draft:
    LivingFrameGeneratedStillArtifactQaProjectionDraft = {
    contractVersion:
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_VERSION,
    resultClass:
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_CLASS,
    projectionId: parsed.data.projectionId,
    projectionState:
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_STATE,
    sourceBindings: {
      bridgeObservationId: bridge.bridgeObservationId,
      bridgeObservationDigestSha256:
        bridge.bridgeObservationDigestSha256,
      rembgRuntimeObservationDigestSha256:
        input.rembgRuntimeReceipt
          .runtimeObservationDigestSha256,
      approvedPlanSnapshotId:
        bridge.sourceBindings.approvedPlanSnapshotId,
      expectedMaskAssetId:
        input.rembgRuntimeReceipt.sourceBindings
          .expectedMaskAssetId,
      expectedAlphaComponentAssetId:
        bridge.sourceBindings.expectedAlphaComponentAssetId,
      alphaMeasurementReportDigestSha256:
        report.reportDigestSha256,
      measuredRgbaDigestSha256:
        report.artifactIdentity.measuredRgbaDigestSha256,
    },
    dependencyProjection: [{
      order: 0,
      role: 'opaque_generated_source',
      artifactId:
        bridge.sourceBindings.generatedOpaqueSourceArtifactId,
      contentSha256:
        bridge.sourceBindings.generatedOpaqueSourceContentSha256,
      expectedArtifactType:
        'living_frame_generated_opaque_still_png',
      contentType: 'image/png',
      serverRereadRequired: true,
      qaReconciliationRequired: true,
    }, {
      order: 1,
      role: 'verified_alpha_mask',
      artifactId:
        input.rembgRuntimeReceipt.sourceBindings
          .expectedMaskAssetId,
      contentSha256:
        bridge.sourceBindings.rembgMaskContentSha256,
      expectedArtifactType:
        'living_frame_alpha_mask_png',
      contentType: 'image/png',
      serverRereadRequired: true,
      qaReconciliationRequired: true,
    }],
    canonicalSharpExpectation: {
      canonicalToolId: 'sharp',
      operationId:
        'tool.sharp.prepare_approved_image_asset.v1',
      imageRecipeId:
        'approved_living_frame_alpha_component_v1',
      runnerClass:
        'offline_sharp_structured_execution_v1',
      outputArtifactId:
        bridge.sourceBindings.expectedAlphaComponentAssetId,
      outputArtifactType:
        'living_frame_component_rgba_png',
      outputContentType: 'image/png',
      outputContentSha256: bridge.alphaOutput.contentSha256,
      outputDecodedRgbaSha256:
        bridge.alphaOutput.decodedRgbaSha256,
      alphaMode: 'straight_alpha',
      transparentRgbCleared: true,
      sourcePixelsUnmodified: true,
      canonicalDispatchRereadRequired: true,
      canonicalWorkerLeaseRequired: true,
      canonicalExecutionStillRequired: true,
    },
    canonicalQaExpectation: {
      requiredGateIds: [
        'asset_received_gate',
        'asset_quality_gate',
      ],
      alphaMeasurementFindingCodes: [
        ...report.findingCodes,
      ],
      onlyNonBlockingAlphaVariationFindingPresent: true,
      multiBackgroundMeasurementPresent: true,
      destinationCompositeMeasurementPresent: false,
      canonicalArtifactQaStillRequired: true,
      destinationCompositeQaStillRequired: true,
    },
    existingAuthorityReuse: {
      canonicalWorkerLeaseAuthorityReused: true,
      canonicalPrivateImageArtifactStorageReused: true,
      canonicalPrivateArtifactQaAuthorityReused: true,
      canonicalAssetManifestReconciliationReused: true,
      canonicalPrivateReviewReused: true,
      duplicateTimingSystemCreated: false,
      duplicateWorkerSystemCreated: false,
      duplicateCreditSystemCreated: false,
      duplicateApprovalSystemCreated: false,
      duplicateQaSystemCreated: false,
      duplicateRendererCreated: false,
    },
    openGateCodes: [
      ...LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
    ],
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawImageMaskOrAlphaBytes: false,
    containsPathUrlCredentialPromptOrCommand: false,
    artifactPersisted: false,
    artifactQaPassed: false,
    assetManifestUpdated: false,
    renderAuthorized: false,
    productionReady: false,
  }
  assertProjectionSemantics(draft)
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameGeneratedStillArtifactQaProjection(
  value: unknown,
): value is LivingFrameGeneratedStillArtifactQaProjection {
  const parsed = projectionSchema.safeParse(value)
  if (!parsed.success) return false
  const {
    projectionDigestSha256,
    ...draft
  } = parsed.data
  try {
    assertProjectionSemantics(
      draft as unknown as
        LivingFrameGeneratedStillArtifactQaProjectionDraft,
    )
    assertSafe(draft)
    return projectionDigestSha256 === sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

function assertMeasurementLineage(
  bridge: LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
  report: LivingFrameAlphaMeasurementReport,
): void {
  if (
    report.reportDigestSha256
      !== bridge.alphaMeasurement.reportDigestSha256
    || report.artifactIdentity.artifactId
      !== bridge.sourceBindings.expectedAlphaComponentAssetId
    || report.artifactIdentity.artifactDigestSha256
      !== bridge.alphaOutput.contentSha256
    || report.artifactIdentity.measuredRgbaDigestSha256
      !== bridge.alphaOutput.decodedRgbaSha256
    || report.raster.width !== bridge.operation.widthPixels
    || report.raster.height !== bridge.operation.heightPixels
    || report.raster.alphaMode !== 'straight_alpha'
    || report.raster.alphaExpectation !== 'alpha_required'
    || report.compositeContext.destinationRasterProvided
    || report.compositeContext.destinationRgbDigestSha256 !== null
  ) throw issue(
    'bridge_measurement_lineage_mismatch',
    '$.alphaMeasurementReport',
  )
}

function assertNonBlockingAlphaMeasurement(
  report: LivingFrameAlphaMeasurementReport,
): void {
  if (
    report.findingCodes.length !== 1
    || report.findingCodes[0]
      !== 'alpha_channel_variation_present'
    || report.composites.length !== 4
    || report.composites.some((entry) =>
      entry.backgroundId === 'destination_raster')
  ) throw issue(
    'blocking_alpha_finding_present',
    '$.alphaMeasurementReport.findingCodes',
  )
}

function assertProjectionSemantics(
  draft: LivingFrameGeneratedStillArtifactQaProjectionDraft,
): void {
  const [source, mask] = draft.dependencyProjection
  if (
    source.order !== 0
    || source.role !== 'opaque_generated_source'
    || source.expectedArtifactType
      !== 'living_frame_generated_opaque_still_png'
    || mask.order !== 1
    || mask.role !== 'verified_alpha_mask'
    || mask.expectedArtifactType
      !== 'living_frame_alpha_mask_png'
    || source.artifactId === mask.artifactId
    || source.contentSha256 === mask.contentSha256
  ) throw issue(
    'dependency_projection_invalid',
    '$.dependencyProjection',
  )
  if (
    draft.canonicalSharpExpectation.outputArtifactId
      !== draft.sourceBindings.expectedAlphaComponentAssetId
    || draft.canonicalSharpExpectation.outputDecodedRgbaSha256
      !== draft.sourceBindings.measuredRgbaDigestSha256
  ) throw issue(
    'canonical_execution_projection_invalid',
    '$.canonicalSharpExpectation',
  )
  if (
    draft.canonicalQaExpectation.alphaMeasurementFindingCodes.length
      !== 1
    || draft.canonicalQaExpectation
      .alphaMeasurementFindingCodes[0]
        !== 'alpha_channel_variation_present'
  ) throw issue(
    'blocking_alpha_finding_present',
    '$.canonicalQaExpectation.alphaMeasurementFindingCodes',
  )
  if (
    JSON.stringify(draft.openGateCodes)
      !== JSON.stringify(
        LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
      )
    || Object.entries(draft.authorityBoundary)
      .some(([key, value]) =>
        key === 'structuralProjectionOnly'
          ? value !== true
          : value !== false)
  ) throw issue(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
}

function assertSafe(value: unknown): void {
  const serialized = JSON.stringify(value)
  if (
    FORBIDDEN_SERIALIZED_KEYS.some((key) =>
      serialized.toLowerCase().includes(key))
  ) throw issue('unsafe_payload_forbidden', '$')
}

function issue(
  code: LivingFrameGeneratedStillArtifactQaIssueCode,
  path: string,
): LivingFrameGeneratedStillArtifactQaProjectionError {
  if (
    !LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_ISSUE_CODES
      .includes(code)
  ) {
    throw new Error('Unknown Living Frame artifact-QA issue.')
  }
  return new LivingFrameGeneratedStillArtifactQaProjectionError([
    { code, path },
  ])
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
