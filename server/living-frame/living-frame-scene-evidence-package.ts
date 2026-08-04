import { createHash } from 'node:crypto'

import type {
  LivingFrameComponentGeometryBundle,
  LivingFrameCompiledGeometryComponent,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameSceneComponentEvidenceBinding,
  LivingFrameSceneComponentEvidenceInput,
  LivingFrameSceneEvidenceBlockerCode,
  LivingFrameSceneEvidencePackage,
  LivingFrameSceneEvidencePackageAuthorityBoundary,
  LivingFrameSceneEvidencePackageDraft,
  LivingFrameSceneEvidencePackageMetrics,
  LivingFrameSceneEvidenceState,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES,
} from '../../src/types/living-frame-alpha-edge-decontamination'
import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_SCENE_ARTIFACT_KINDS,
  LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS,
  LIVING_FRAME_SCENE_EVIDENCE_BLOCKER_CODES,
  LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_CLASS,
  LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_PROFILE,
  LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_VERSION,
  LIVING_FRAME_SCENE_EVIDENCE_STATES,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES,
} from '../../src/types/living-frame-temporal-mask-measurement'
import {
  LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES,
} from '../../src/types/living-frame-visual-continuity-measurement'
import {
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest,
} from './living-frame-alpha-edge-decontamination'
import {
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  verifyLivingFrameTemporalMaskMeasurementReportDigest,
} from './living-frame-temporal-mask-measurement'
import {
  verifyLivingFrameVisualContinuityMeasurementReportDigest,
} from './living-frame-visual-continuity-measurement'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:-]{0,63}$/
const MAX_COMPONENT_COUNT = 128

const BLOCKING_ALPHA_FINDINGS = new Set([
  'alpha_channel_fully_opaque',
  'alpha_channel_fully_transparent',
  'opaque_rectangle_detected',
  'checkerboard_encoded_as_pixels_suspected',
  'matte_edge_contamination_suspected',
  'premultiplied_alpha_violation',
  'alpha_bounds_touch_all_edges',
  'insufficient_transparent_margin',
  'edge_discontinuity_high',
  'destination_edge_contrast_low',
])

const BLOCKING_DECONTAMINATION_FINDINGS = new Set([
  'excessive_channel_clamping_observed',
])

const AUTHORITY_BOUNDARY:
  LivingFrameSceneEvidencePackageAuthorityBoundary = Object.freeze({
    structuralEvidenceBindingOnly: true,
    selectedSceneAuthority: false,
    sourceTruthAuthority: false,
    identityVerificationAuthority: false,
    likenessSafetyAuthority: false,
    documentaryFactAuthority: false,
    artifactQaAuthority: false,
    continuityQaAuthority: false,
    alphaQaAuthority: false,
    temporalMaskQaAuthority: false,
    fallbackAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    renderExecutionAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameSceneEvidencePackageInput {
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly componentGeometryBundle: LivingFrameComponentGeometryBundle
  readonly componentEvidence:
    readonly LivingFrameSceneComponentEvidenceInput[]
}

export function compileLivingFrameSceneEvidencePackage(
  input: CompileLivingFrameSceneEvidencePackageInput,
): LivingFrameSceneEvidencePackage {
  assertInputShape(input)
  assertBundleLineage(input.motionBundle, input.componentGeometryBundle)
  const visualComponents = input.componentGeometryBundle.components.filter(
    (component) => component.kind === 'visual_component',
  )
  const evidenceByComponent = validateEvidenceCoverage(
    visualComponents,
    input.componentEvidence,
    input.motionBundle,
  )
  const componentEvidenceBindings = visualComponents.map((component, index) =>
    bindComponentEvidence(
      component,
      evidenceByComponent.get(component.componentId)!,
      index,
    ))
  const metrics = deriveMetrics(
    componentEvidenceBindings,
    input.componentGeometryBundle.metrics.unresolvedDepthTransitionCount,
  )
  const packageBlockerCodes = derivePackageBlockerCodes(
    componentEvidenceBindings,
    metrics.unresolvedDepthTransitionCount,
  )
  const packageState = derivePackageState(packageBlockerCodes)
  const draft: LivingFrameSceneEvidencePackageDraft = {
    contractVersion: LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_VERSION,
    bindingProfile: LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_PROFILE,
    evidenceClass: LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_CLASS,
    sceneId: input.motionBundle.timingExpectation.sceneId,
    outputFrameId:
      input.componentGeometryBundle.outputFrameExpectation.outputFrameId,
    outputFrameDigestSha256:
      input.componentGeometryBundle.outputFrameExpectation
        .outputFrameDigestSha256,
    motionBundleDigestSha256: input.motionBundle.bundleDigestSha256,
    componentGeometryBundleDigestSha256:
      input.componentGeometryBundle.bundleDigestSha256,
    componentEvidenceBindings,
    packageState,
    packageBlockerCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawMediaOrMaskBytes: false,
    containsPathUrlCredentialOrInstruction: false,
    containsProviderToolWorkOrAssetManifestRoute: false,
    currentEvidenceReReadStillRequired: true,
    canonicalArtifactQaStillRequired: true,
    approvedSnapshotProjectionStillRequired: true,
  }
  return {
    ...draft,
    packageDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameSceneEvidencePackageDigest(
  value: unknown,
): value is LivingFrameSceneEvidencePackage {
  if (!isPackageShape(value)) return false
  const { packageDigestSha256, ...draft } = value
  return packageDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInputShape(
  input: CompileLivingFrameSceneEvidencePackageInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'motionBundle',
      'componentGeometryBundle',
      'componentEvidence',
    ])
    || !verifyLivingFrameDeterministicMotionBundleDigest(input.motionBundle)
    || !verifyLivingFrameComponentGeometryBundleDigest(
      input.componentGeometryBundle,
    )
    || !Array.isArray(input.componentEvidence)
    || input.componentEvidence.length < 1
    || input.componentEvidence.length > MAX_COMPONENT_COUNT
  ) {
    throw new Error(
      'Living Frame scene evidence package input shape is invalid.',
    )
  }
}

function assertBundleLineage(
  motion: LivingFrameDeterministicMotionBundle,
  geometry: LivingFrameComponentGeometryBundle,
): void {
  if (
    geometry.motionBinding.motionBundleDigestSha256
      !== motion.bundleDigestSha256
    || geometry.motionBinding.motionSceneId
      !== motion.timingExpectation.sceneId
    || geometry.outputFrameExpectation.outputFrameId
      !== motion.timingExpectation.outputFrameId
    || geometry.outputFrameExpectation.outputFrameDigestSha256
      !== motion.timingExpectation.outputFrameDigestSha256
  ) {
    throw new Error(
      'Living Frame scene evidence package lineage is inconsistent.',
    )
  }
}

function validateEvidenceCoverage(
  visualComponents: readonly LivingFrameCompiledGeometryComponent[],
  evidence: readonly LivingFrameSceneComponentEvidenceInput[],
  motion: LivingFrameDeterministicMotionBundle,
): ReadonlyMap<string, LivingFrameSceneComponentEvidenceInput> {
  if (visualComponents.length !== evidence.length) {
    throw new Error(
      'Living Frame scene evidence must cover every visual component.',
    )
  }
  const visualIds = new Set(
    visualComponents.map((component) => component.componentId),
  )
  const byComponent = new Map<
    string,
    LivingFrameSceneComponentEvidenceInput
  >()
  for (const entry of evidence) {
    assertEvidenceInput(entry)
    if (
      !visualIds.has(entry.componentId)
      || byComponent.has(entry.componentId)
    ) {
      throw new Error(
        'Living Frame scene component evidence identity is invalid.',
      )
    }
    const component = visualComponents.find(
      (candidate) => candidate.componentId === entry.componentId,
    )!
    validateComponentEvidence(component, entry, motion)
    byComponent.set(entry.componentId, entry)
  }
  return byComponent
}

function assertEvidenceInput(
  entry: LivingFrameSceneComponentEvidenceInput,
): void {
  if (
    !hasExactKeysUnknown(entry, [
      'componentId',
      'artifactKind',
      'artifact',
      'maskArtifact',
      'continuityExpectation',
      'continuityReferenceArtifact',
      'alphaMeasurementReport',
      'temporalMaskMeasurementReport',
      'alphaEdgeDecontaminationReport',
      'visualContinuityMeasurementReport',
      'primitiveQaExpectationRef',
    ])
    || !SAFE_ID.test(entry.componentId)
    || !includesString(LIVING_FRAME_SCENE_ARTIFACT_KINDS, entry.artifactKind)
    || !includesString(
      LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS,
      entry.continuityExpectation,
    )
  ) {
    throw new Error(
      'Living Frame scene component evidence shape is invalid.',
    )
  }
  assertArtifactRef(entry.artifact)
  if (entry.maskArtifact != null) assertArtifactRef(entry.maskArtifact)
  if (
    entry.continuityReferenceArtifact != null
  ) assertArtifactRef(entry.continuityReferenceArtifact)
  if (
    entry.primitiveQaExpectationRef != null
  ) assertPrimitiveQaExpectation(entry.primitiveQaExpectationRef)
}

function validateComponentEvidence(
  component: LivingFrameCompiledGeometryComponent,
  entry: LivingFrameSceneComponentEvidenceInput,
  motion: LivingFrameDeterministicMotionBundle,
): void {
  switch (component.maskExpectation) {
    case 'opaque':
      requireOpaqueEvidence(entry)
      break
    case 'still_alpha_artifact_required':
      requireStillAlphaEvidence(entry)
      break
    case 'temporal_mask_artifact_required':
      requireTemporalMaskEvidence(entry, motion)
      break
    case 'procedural_alpha_artifact_required':
      requirePrimitiveEvidence(entry, 'procedural_alpha_primitive')
      break
    case 'additive_effect_artifact_required':
      requirePrimitiveEvidence(entry, 'additive_effect_primitive')
      break
    default:
      throw new Error(
        'Living Frame scene component mask expectation is invalid.',
      )
  }
  validateContinuityEvidence(entry)
}

function requireOpaqueEvidence(
  entry: LivingFrameSceneComponentEvidenceInput,
): void {
  if (
    entry.artifactKind !== 'opaque_raster'
    || entry.maskArtifact !== null
    || entry.alphaMeasurementReport !== null
    || entry.temporalMaskMeasurementReport !== null
    || entry.alphaEdgeDecontaminationReport !== null
    || entry.primitiveQaExpectationRef !== null
  ) {
    throw new Error(
      'Living Frame opaque component evidence is invalid.',
    )
  }
}

function requireStillAlphaEvidence(
  entry: LivingFrameSceneComponentEvidenceInput,
): void {
  if (
    entry.artifactKind !== 'still_rgba'
    || entry.maskArtifact !== null
    || entry.alphaMeasurementReport === null
    || !verifyLivingFrameAlphaMeasurementReportDigest(
      entry.alphaMeasurementReport,
    )
    || entry.alphaMeasurementReport.artifactIdentity.artifactId
      !== entry.artifact.artifactId
    || entry.alphaMeasurementReport.artifactIdentity.artifactDigestSha256
      !== entry.artifact.artifactDigestSha256
    || entry.alphaMeasurementReport.raster.alphaExpectation
      !== 'alpha_required'
    || !entry.alphaMeasurementReport.compositeContext
      .destinationRasterProvided
    || !hasAllAlphaCompositeBackgrounds(entry.alphaMeasurementReport)
    || entry.temporalMaskMeasurementReport !== null
    || entry.primitiveQaExpectationRef !== null
  ) {
    throw new Error(
      'Living Frame still-alpha component evidence is invalid.',
    )
  }
  if (entry.alphaEdgeDecontaminationReport != null) {
    if (
      !verifyLivingFrameAlphaEdgeDecontaminationReportDigest(
        entry.alphaEdgeDecontaminationReport,
      )
      || entry.alphaEdgeDecontaminationReport.outputArtifact
        .measuredOutputRgbaDigestSha256
        !== entry.alphaMeasurementReport.artifactIdentity
          .measuredRgbaDigestSha256
    ) {
      throw new Error(
        'Living Frame alpha decontamination lineage is invalid.',
      )
    }
  }
}

function requireTemporalMaskEvidence(
  entry: LivingFrameSceneComponentEvidenceInput,
  motion: LivingFrameDeterministicMotionBundle,
): void {
  if (
    !['source_a_roll', 'still_rgba'].includes(entry.artifactKind)
    || entry.maskArtifact === null
    || entry.temporalMaskMeasurementReport === null
    || !verifyLivingFrameTemporalMaskMeasurementReportDigest(
      entry.temporalMaskMeasurementReport,
    )
    || entry.temporalMaskMeasurementReport.sequenceIdentity.sequenceId
      !== entry.maskArtifact.artifactId
    || entry.temporalMaskMeasurementReport.sequenceIdentity
      .frameSetDigestSha256
      !== entry.maskArtifact.artifactDigestSha256
    || entry.temporalMaskMeasurementReport.sequenceIdentity.firstFrameIndex
      !== motion.timingExpectation.sceneStartFrame
    || entry.temporalMaskMeasurementReport.sequenceIdentity.lastFrameIndex
      !== motion.timingExpectation.sceneEndFrame
    || entry.alphaMeasurementReport !== null
    || entry.alphaEdgeDecontaminationReport !== null
    || entry.primitiveQaExpectationRef !== null
  ) {
    throw new Error(
      'Living Frame temporal-mask component evidence is invalid.',
    )
  }
}

function requirePrimitiveEvidence(
  entry: LivingFrameSceneComponentEvidenceInput,
  expectedKind:
    | 'procedural_alpha_primitive'
    | 'additive_effect_primitive',
): void {
  if (
    entry.artifactKind !== expectedKind
    || entry.maskArtifact !== null
    || entry.alphaMeasurementReport !== null
    || entry.temporalMaskMeasurementReport !== null
    || entry.alphaEdgeDecontaminationReport !== null
    || entry.primitiveQaExpectationRef === null
  ) {
    throw new Error(
      'Living Frame procedural component evidence is invalid.',
    )
  }
}

function validateContinuityEvidence(
  entry: LivingFrameSceneComponentEvidenceInput,
): void {
  if (entry.continuityExpectation === 'not_applicable') {
    if (
      entry.continuityReferenceArtifact !== null
      || entry.visualContinuityMeasurementReport !== null
    ) {
      throw new Error(
        'Living Frame non-continuity component evidence is invalid.',
      )
    }
    return
  }
  const report = entry.visualContinuityMeasurementReport
  const reference = entry.continuityReferenceArtifact
  if (
    report === null
    || reference === null
    || !verifyLivingFrameVisualContinuityMeasurementReportDigest(report)
    || report.candidateArtifact.artifactId !== entry.artifact.artifactId
    || report.candidateArtifact.artifactDigestSha256
      !== entry.artifact.artifactDigestSha256
    || report.referenceArtifact.artifactId !== reference.artifactId
    || report.referenceArtifact.artifactDigestSha256
      !== reference.artifactDigestSha256
    || (
      entry.alphaMeasurementReport != null
      && report.candidateArtifact.measuredRgbaDigestSha256
        !== entry.alphaMeasurementReport.artifactIdentity
          .measuredRgbaDigestSha256
    )
  ) {
    throw new Error(
      'Living Frame continuity component evidence is invalid.',
    )
  }
}

function bindComponentEvidence(
  component: LivingFrameCompiledGeometryComponent,
  entry: LivingFrameSceneComponentEvidenceInput,
  order: number,
): LivingFrameSceneComponentEvidenceBinding {
  const alphaFindingCodes =
    entry.alphaMeasurementReport?.findingCodes ?? []
  const temporalMaskFindingCodes =
    entry.temporalMaskMeasurementReport?.findingCodes ?? []
  const alphaEdgeDecontaminationFindingCodes =
    entry.alphaEdgeDecontaminationReport?.findingCodes ?? []
  const visualContinuityFindingCodes =
    entry.visualContinuityMeasurementReport?.findingCodes ?? []
  const componentBlockerCodes =
    deriveComponentBlockerCodes({
      component,
      alphaFindingCodes,
      temporalMaskFindingCodes,
      alphaEdgeDecontaminationFindingCodes,
      visualContinuityFindingCodes,
    })
  return {
    componentId: entry.componentId,
    order,
    artifactKind: entry.artifactKind,
    artifact: { ...entry.artifact },
    maskArtifact:
      entry.maskArtifact == null ? null : { ...entry.maskArtifact },
    continuityExpectation: entry.continuityExpectation,
    continuityReferenceArtifact:
      entry.continuityReferenceArtifact == null
        ? null
        : { ...entry.continuityReferenceArtifact },
    alphaMeasurementReportDigestSha256:
      entry.alphaMeasurementReport?.reportDigestSha256 ?? null,
    temporalMaskMeasurementReportDigestSha256:
      entry.temporalMaskMeasurementReport?.reportDigestSha256 ?? null,
    alphaEdgeDecontaminationReportDigestSha256:
      entry.alphaEdgeDecontaminationReport?.reportDigestSha256 ?? null,
    visualContinuityMeasurementReportDigestSha256:
      entry.visualContinuityMeasurementReport?.reportDigestSha256 ?? null,
    alphaFindingCodes: [...alphaFindingCodes],
    temporalMaskFindingCodes: [...temporalMaskFindingCodes],
    alphaEdgeDecontaminationFindingCodes: [
      ...alphaEdgeDecontaminationFindingCodes,
    ],
    visualContinuityFindingCodes: [...visualContinuityFindingCodes],
    primitiveQaExpectationRef:
      entry.primitiveQaExpectationRef == null
        ? null
        : { ...entry.primitiveQaExpectationRef },
    componentBlockerCodes,
  }
}

function deriveComponentBlockerCodes(input: {
  readonly component: LivingFrameCompiledGeometryComponent
  readonly alphaFindingCodes: readonly string[]
  readonly temporalMaskFindingCodes: readonly string[]
  readonly alphaEdgeDecontaminationFindingCodes: readonly string[]
  readonly visualContinuityFindingCodes: readonly string[]
}): LivingFrameSceneEvidenceBlockerCode[] {
  const blockers = new Set<LivingFrameSceneEvidenceBlockerCode>()
  if (
    input.alphaFindingCodes.some((code) =>
      BLOCKING_ALPHA_FINDINGS.has(code))
  ) blockers.add('alpha_measurement_findings_block')
  if (input.temporalMaskFindingCodes.length > 0) {
    blockers.add('temporal_mask_measurement_findings_block')
  }
  if (
    input.alphaEdgeDecontaminationFindingCodes.some((code) =>
      BLOCKING_DECONTAMINATION_FINDINGS.has(code))
  ) blockers.add('alpha_decontamination_findings_block')
  if (input.visualContinuityFindingCodes.length > 0) {
    blockers.add('visual_continuity_measurement_findings_block')
  }
  if (
    input.component.maskExpectation
      === 'procedural_alpha_artifact_required'
  ) blockers.add('procedural_alpha_qa_required')
  if (
    input.component.maskExpectation
      === 'additive_effect_artifact_required'
  ) blockers.add('additive_effect_qa_required')
  return sortBlockerCodes(blockers)
}

function derivePackageBlockerCodes(
  bindings: readonly LivingFrameSceneComponentEvidenceBinding[],
  unresolvedDepthTransitionCount: number,
): LivingFrameSceneEvidenceBlockerCode[] {
  const blockers = new Set<LivingFrameSceneEvidenceBlockerCode>(
    bindings.flatMap((binding) => binding.componentBlockerCodes),
  )
  if (unresolvedDepthTransitionCount > 0) {
    blockers.add('depth_transition_compilation_required')
  }
  blockers.add('canonical_artifact_qa_required')
  blockers.add('canonical_snapshot_revalidation_required')
  return sortBlockerCodes(blockers)
}

function derivePackageState(
  blockers: readonly LivingFrameSceneEvidenceBlockerCode[],
): LivingFrameSceneEvidenceState {
  if (
    blockers.some((code) => [
      'alpha_measurement_findings_block',
      'temporal_mask_measurement_findings_block',
      'alpha_decontamination_findings_block',
      'visual_continuity_measurement_findings_block',
    ].includes(code))
  ) return 'blocked_by_measurement_findings'
  if (
    blockers.some((code) => [
      'procedural_alpha_qa_required',
      'additive_effect_qa_required',
      'depth_transition_compilation_required',
    ].includes(code))
  ) return 'blocked_by_unresolved_primitive_qa'
  return 'evidence_bound_pending_canonical_qa'
}

function deriveMetrics(
  bindings: readonly LivingFrameSceneComponentEvidenceBinding[],
  unresolvedDepthTransitionCount: number,
): LivingFrameSceneEvidencePackageMetrics {
  return {
    visualComponentCount: bindings.length,
    componentEvidenceBindingCount: bindings.length,
    opaqueArtifactCount: countKind(bindings, 'opaque_raster'),
    stillAlphaArtifactCount: countKind(bindings, 'still_rgba'),
    temporalMaskArtifactCount: bindings.filter(
      (binding) => binding.temporalMaskMeasurementReportDigestSha256 != null,
    ).length,
    proceduralPrimitiveCount: countKind(
      bindings,
      'procedural_alpha_primitive',
    ),
    additivePrimitiveCount: countKind(
      bindings,
      'additive_effect_primitive',
    ),
    continuityMeasurementCount: bindings.filter(
      (binding) =>
        binding.visualContinuityMeasurementReportDigestSha256 != null,
    ).length,
    alphaMeasurementCount: bindings.filter(
      (binding) => binding.alphaMeasurementReportDigestSha256 != null,
    ).length,
    temporalMaskMeasurementCount: bindings.filter(
      (binding) =>
        binding.temporalMaskMeasurementReportDigestSha256 != null,
    ).length,
    decontaminationMeasurementCount: bindings.filter(
      (binding) =>
        binding.alphaEdgeDecontaminationReportDigestSha256 != null,
    ).length,
    blockedComponentCount: bindings.filter(
      (binding) => binding.componentBlockerCodes.length > 0,
    ).length,
    unresolvedDepthTransitionCount,
  }
}

function isPackageShape(
  value: unknown,
): value is LivingFrameSceneEvidencePackage {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'bindingProfile',
      'evidenceClass',
      'sceneId',
      'outputFrameId',
      'outputFrameDigestSha256',
      'motionBundleDigestSha256',
      'componentGeometryBundleDigestSha256',
      'componentEvidenceBindings',
      'packageState',
      'packageBlockerCodes',
      'metrics',
      'authorityBoundary',
      'containsRawMediaOrMaskBytes',
      'containsPathUrlCredentialOrInstruction',
      'containsProviderToolWorkOrAssetManifestRoute',
      'currentEvidenceReReadStillRequired',
      'canonicalArtifactQaStillRequired',
      'approvedSnapshotProjectionStillRequired',
      'packageDigestSha256',
    ])
    || value.contractVersion !== LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_VERSION
    || value.bindingProfile !== LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_PROFILE
    || value.evidenceClass !== LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_CLASS
    || !SAFE_ID.test(value.sceneId as string)
    || !SAFE_ID.test(value.outputFrameId as string)
    || !SHA256.test(value.outputFrameDigestSha256 as string)
    || !SHA256.test(value.motionBundleDigestSha256 as string)
    || !SHA256.test(value.componentGeometryBundleDigestSha256 as string)
    || !SHA256.test(value.packageDigestSha256 as string)
    || value.containsRawMediaOrMaskBytes !== false
    || value.containsPathUrlCredentialOrInstruction !== false
    || value.containsProviderToolWorkOrAssetManifestRoute !== false
    || value.currentEvidenceReReadStillRequired !== true
    || value.canonicalArtifactQaStillRequired !== true
    || value.approvedSnapshotProjectionStillRequired !== true
    || !isRecord(value.authorityBoundary)
    || canonicalJsonStringify(value.authorityBoundary)
      !== canonicalJsonStringify(AUTHORITY_BOUNDARY)
    || !includesString(
      LIVING_FRAME_SCENE_EVIDENCE_STATES,
      value.packageState,
    )
    || !isBlockerCodeArray(value.packageBlockerCodes)
    || !Array.isArray(value.componentEvidenceBindings)
    || value.componentEvidenceBindings.length < 1
    || value.componentEvidenceBindings.length > MAX_COMPONENT_COUNT
  ) return false
  try {
    const bindings =
      value.componentEvidenceBindings as LivingFrameSceneComponentEvidenceBinding[]
    assertOutputBindings(bindings)
    const metrics = value.metrics as LivingFrameSceneEvidencePackageMetrics
    assertMetricsShape(metrics)
    const expectedMetrics = deriveMetrics(
      bindings,
      metrics.unresolvedDepthTransitionCount,
    )
    if (
      canonicalJsonStringify(metrics)
      !== canonicalJsonStringify(expectedMetrics)
    ) return false
    const expectedBlockers = derivePackageBlockerCodes(
      bindings,
      metrics.unresolvedDepthTransitionCount,
    )
    if (
      canonicalJsonStringify(value.packageBlockerCodes)
      !== canonicalJsonStringify(expectedBlockers)
      || value.packageState !== derivePackageState(expectedBlockers)
    ) return false
    return true
  } catch {
    return false
  }
}

function assertOutputBindings(
  bindings: readonly LivingFrameSceneComponentEvidenceBinding[],
): void {
  const ids = new Set<string>()
  for (const [index, binding] of bindings.entries()) {
    if (
      !hasExactKeysUnknown(binding, [
        'componentId',
        'order',
        'artifactKind',
        'artifact',
        'maskArtifact',
        'continuityExpectation',
        'continuityReferenceArtifact',
        'alphaMeasurementReportDigestSha256',
        'temporalMaskMeasurementReportDigestSha256',
        'alphaEdgeDecontaminationReportDigestSha256',
        'visualContinuityMeasurementReportDigestSha256',
        'alphaFindingCodes',
        'temporalMaskFindingCodes',
        'alphaEdgeDecontaminationFindingCodes',
        'visualContinuityFindingCodes',
        'primitiveQaExpectationRef',
        'componentBlockerCodes',
      ])
      || !SAFE_ID.test(binding.componentId)
      || binding.order !== index
      || ids.has(binding.componentId)
      || !includesString(
        LIVING_FRAME_SCENE_ARTIFACT_KINDS,
        binding.artifactKind,
      )
      || !includesString(
        LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS,
        binding.continuityExpectation,
      )
      || !isNullableDigest(binding.alphaMeasurementReportDigestSha256)
      || !isNullableDigest(
        binding.temporalMaskMeasurementReportDigestSha256,
      )
      || !isNullableDigest(
        binding.alphaEdgeDecontaminationReportDigestSha256,
      )
      || !isNullableDigest(
        binding.visualContinuityMeasurementReportDigestSha256,
      )
      || !isClosedSortedStringArray(
        LIVING_FRAME_ALPHA_FINDING_CODES,
        binding.alphaFindingCodes,
      )
      || !isClosedSortedStringArray(
        LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES,
        binding.temporalMaskFindingCodes,
      )
      || !isClosedSortedStringArray(
        LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES,
        binding.alphaEdgeDecontaminationFindingCodes,
      )
      || !isClosedSortedStringArray(
        LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES,
        binding.visualContinuityFindingCodes,
      )
      || !isBlockerCodeArray(binding.componentBlockerCodes)
    ) {
      throw new Error(
        'Living Frame scene evidence output binding is invalid.',
      )
    }
    assertArtifactRef(binding.artifact)
    if (binding.maskArtifact != null) assertArtifactRef(binding.maskArtifact)
    if (
      binding.continuityReferenceArtifact != null
    ) assertArtifactRef(binding.continuityReferenceArtifact)
    if (
      binding.primitiveQaExpectationRef != null
    ) assertPrimitiveQaExpectation(binding.primitiveQaExpectationRef)
    assertOutputBindingEvidenceTuple(binding)
    const expectedBlockers = deriveOutputBindingBlockers(binding)
    if (
      canonicalJsonStringify(binding.componentBlockerCodes)
      !== canonicalJsonStringify(expectedBlockers)
    ) {
      throw new Error(
        'Living Frame scene evidence component blockers are invalid.',
      )
    }
    ids.add(binding.componentId)
  }
}

function assertOutputBindingEvidenceTuple(
  binding: LivingFrameSceneComponentEvidenceBinding,
): void {
  const hasAlpha = binding.alphaMeasurementReportDigestSha256 != null
  const hasTemporal =
    binding.temporalMaskMeasurementReportDigestSha256 != null
  const hasDecontamination =
    binding.alphaEdgeDecontaminationReportDigestSha256 != null
  const hasPrimitive = binding.primitiveQaExpectationRef != null
  if (binding.artifactKind === 'opaque_raster') {
    if (
      binding.maskArtifact != null
      || hasAlpha
      || hasTemporal
      || hasDecontamination
      || hasPrimitive
    ) throw new Error('Living Frame opaque evidence tuple is invalid.')
  } else if (binding.artifactKind === 'still_rgba') {
    const stillAlpha = binding.maskArtifact == null
      && hasAlpha
      && !hasTemporal
      && !hasPrimitive
    const temporal = binding.maskArtifact != null
      && !hasAlpha
      && hasTemporal
      && !hasDecontamination
      && !hasPrimitive
    if (!stillAlpha && !temporal) {
      throw new Error('Living Frame still-RGBA evidence tuple is invalid.')
    }
  } else if (binding.artifactKind === 'source_a_roll') {
    if (
      binding.maskArtifact == null
      || hasAlpha
      || !hasTemporal
      || hasDecontamination
      || hasPrimitive
    ) throw new Error('Living Frame source A-roll evidence tuple is invalid.')
  } else if (
    binding.artifactKind === 'procedural_alpha_primitive'
    || binding.artifactKind === 'additive_effect_primitive'
  ) {
    if (
      binding.maskArtifact != null
      || hasAlpha
      || hasTemporal
      || hasDecontamination
      || !hasPrimitive
    ) throw new Error('Living Frame primitive evidence tuple is invalid.')
  }
  if (hasDecontamination && !hasAlpha) {
    throw new Error('Living Frame decontamination evidence tuple is invalid.')
  }
  const hasContinuityReport =
    binding.visualContinuityMeasurementReportDigestSha256 != null
  if (
    binding.continuityExpectation === 'required'
      ? (
          binding.continuityReferenceArtifact == null
          || !hasContinuityReport
        )
      : (
          binding.continuityReferenceArtifact != null
          || hasContinuityReport
        )
  ) {
    throw new Error('Living Frame continuity evidence tuple is invalid.')
  }
}

function deriveOutputBindingBlockers(
  binding: LivingFrameSceneComponentEvidenceBinding,
): LivingFrameSceneEvidenceBlockerCode[] {
  const blockers = new Set<LivingFrameSceneEvidenceBlockerCode>()
  if (
    binding.alphaFindingCodes.some((code) =>
      BLOCKING_ALPHA_FINDINGS.has(code))
  ) blockers.add('alpha_measurement_findings_block')
  if (binding.temporalMaskFindingCodes.length > 0) {
    blockers.add('temporal_mask_measurement_findings_block')
  }
  if (
    binding.alphaEdgeDecontaminationFindingCodes.some((code) =>
      BLOCKING_DECONTAMINATION_FINDINGS.has(code))
  ) blockers.add('alpha_decontamination_findings_block')
  if (binding.visualContinuityFindingCodes.length > 0) {
    blockers.add('visual_continuity_measurement_findings_block')
  }
  if (binding.artifactKind === 'procedural_alpha_primitive') {
    blockers.add('procedural_alpha_qa_required')
  }
  if (binding.artifactKind === 'additive_effect_primitive') {
    blockers.add('additive_effect_qa_required')
  }
  return sortBlockerCodes(blockers)
}

function assertMetricsShape(
  metrics: LivingFrameSceneEvidencePackageMetrics,
): void {
  if (
    !hasExactKeysUnknown(metrics, [
      'visualComponentCount',
      'componentEvidenceBindingCount',
      'opaqueArtifactCount',
      'stillAlphaArtifactCount',
      'temporalMaskArtifactCount',
      'proceduralPrimitiveCount',
      'additivePrimitiveCount',
      'continuityMeasurementCount',
      'alphaMeasurementCount',
      'temporalMaskMeasurementCount',
      'decontaminationMeasurementCount',
      'blockedComponentCount',
      'unresolvedDepthTransitionCount',
    ])
    || Object.values(metrics).some(
      (value) =>
        !Number.isInteger(value)
        || value < 0
        || value > MAX_COMPONENT_COUNT,
    )
  ) {
    throw new Error('Living Frame scene evidence metrics are invalid.')
  }
}

function assertArtifactRef(
  value: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
  },
): void {
  if (
    !hasExactKeysUnknown(value, ['artifactId', 'artifactDigestSha256'])
    || !SAFE_ID.test(value.artifactId)
    || !SHA256.test(value.artifactDigestSha256)
  ) {
    throw new Error('Living Frame scene artifact reference is invalid.')
  }
}

function assertPrimitiveQaExpectation(
  value: NonNullable<
    LivingFrameSceneComponentEvidenceInput['primitiveQaExpectationRef']
  >,
): void {
  if (
    !hasExactKeysUnknown(value, [
      'refId',
      'version',
      'digestSha256',
      'currentCanonicalQaRevalidationRequired',
    ])
    || !SAFE_ID.test(value.refId)
    || !SAFE_VERSION.test(value.version)
    || !SHA256.test(value.digestSha256)
    || value.currentCanonicalQaRevalidationRequired !== true
  ) {
    throw new Error(
      'Living Frame primitive QA expectation reference is invalid.',
    )
  }
}

function hasAllAlphaCompositeBackgrounds(
  report: NonNullable<
    LivingFrameSceneComponentEvidenceInput['alphaMeasurementReport']
  >,
): boolean {
  const expected = [
    'black',
    'destination_raster',
    'mid_gray',
    'saturated_red',
    'white',
  ]
  return canonicalJsonStringify(
    report.composites.map((composite) => composite.backgroundId).sort(),
  ) === canonicalJsonStringify(expected)
}

function countKind(
  bindings: readonly LivingFrameSceneComponentEvidenceBinding[],
  kind: LivingFrameSceneComponentEvidenceBinding['artifactKind'],
): number {
  return bindings.filter((binding) => binding.artifactKind === kind).length
}

function sortBlockerCodes(
  values: ReadonlySet<LivingFrameSceneEvidenceBlockerCode>,
): LivingFrameSceneEvidenceBlockerCode[] {
  return [...values].sort()
}

function isBlockerCodeArray(
  value: unknown,
): value is LivingFrameSceneEvidenceBlockerCode[] {
  return Array.isArray(value)
    && value.every((entry) =>
      includesString(LIVING_FRAME_SCENE_EVIDENCE_BLOCKER_CODES, entry))
    && isSortedUniqueStrings(value)
}

function isNullableDigest(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && SHA256.test(value))
}

function isSortedUniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((entry) => typeof entry === 'string')
    && value.every(
      (entry, index) => index === 0 || value[index - 1]! < entry,
    )
}

function isClosedSortedStringArray<const T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number][] {
  return isSortedUniqueStrings(value)
    && value.every((entry) => includesString(allowed, entry))
}

function includesString<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number])
}

function hasExactKeysUnknown(
  value: unknown,
  keys: readonly string[],
): boolean {
  return isRecord(value) && hasExactKeys(value, keys)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
