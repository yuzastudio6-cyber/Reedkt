import type {
  LivingFrameBackgroundPlateArtifactExpectation,
  LivingFrameBackgroundPlateHoleExpectationInput,
  LivingFrameBackgroundPlateReconstructionAuthorityBoundary,
  LivingFrameBackgroundPlateReconstructionDecision,
  LivingFrameBackgroundPlateReconstructionMetrics,
  LivingFrameBackgroundPlateReconstructionSpec,
  LivingFrameBackgroundPlateReconstructionSpecDraft,
  LivingFrameBackgroundPlateSourceBindings,
  LivingFrameReconstructionBlockerCode,
  LivingFrameReconstructionProfile,
} from '../../src/types/living-frame-background-plate-reconstruction'
import {
  LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_CLASS,
  LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_VERSION,
  LIVING_FRAME_RECONSTRUCTION_BLOCKER_CODES,
  LIVING_FRAME_RECONSTRUCTION_FALLBACK_STEPS,
  LIVING_FRAME_RECONSTRUCTION_PROFILES,
  LIVING_FRAME_RECONSTRUCTION_QA_CODES,
  LIVING_FRAME_RECONSTRUCTION_SAFETY_CLASSES,
  LIVING_FRAME_RECONSTRUCTION_TEXTURE_CLASSES,
} from '../../src/types/living-frame-background-plate-reconstruction'
import type {
  LivingFrameComponentRigSpec,
  LivingFrameRigNode,
} from '../../src/types/living-frame-component-rig'
import {
  verifyLivingFrameComponentRigSpecDigest,
} from './living-frame-component-rig'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_HOLES = 32
const SMALL_HOLE_CEILING = 0.02
const BOUNDED_HOLE_CEILING = 0.05

const FALLBACK_LADDER =
  LIVING_FRAME_RECONSTRUCTION_FALLBACK_STEPS

const QA_EXPECTATIONS =
  LIVING_FRAME_RECONSTRUCTION_QA_CODES

const AUTHORITY_BOUNDARY:
  LivingFrameBackgroundPlateReconstructionAuthorityBoundary =
  Object.freeze({
    reconstructionPlanningOnly: true,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
    masterTimingAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    pixelExecutionAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    qaApprovalAuthority: false,
    rendererAuthority: false,
    renderExecutionAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

const ARTIFACT_EXPECTATION:
  LivingFrameBackgroundPlateArtifactExpectation =
  Object.freeze({
    workItemTypeExpectation: 'reconstruct_background_plate',
    artifactTypeExpectation:
      'living_frame_reconstructed_background_plate_png',
    assetRoleExpectation: 'processed',
    contentTypeExpectation: 'image/png',
    requiredDependencyArtifactKinds: [
      'opaque_source_plate',
      'component_alpha_mask',
    ] as const,
    canonicalWorkItemCreationStillRequired: true,
    canonicalAssetManifestEntryStillRequired: true,
    canonicalArtifactQaStillRequired: true,
  })

export interface CompileLivingFrameBackgroundPlateReconstructionInput {
  readonly componentRig: LivingFrameComponentRigSpec
  readonly holes:
    readonly LivingFrameBackgroundPlateHoleExpectationInput[]
}

export function compileLivingFrameBackgroundPlateReconstruction(
  input: CompileLivingFrameBackgroundPlateReconstructionInput,
): LivingFrameBackgroundPlateReconstructionSpec {
  assertInput(input)
  const decisions = input.holes.map((hole) =>
    compileDecision(hole))
  const draft:
    LivingFrameBackgroundPlateReconstructionSpecDraft = {
      contractVersion:
        LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_VERSION,
      reconstructionClass:
        LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_CLASS,
      sourceBindings: sourceBindings(input.componentRig),
      decisions,
      artifactExpectation: ARTIFACT_EXPECTATION,
      metrics: metrics(decisions),
      authorityBoundary: AUTHORITY_BOUNDARY,
      subjectSpecificRouting: false,
      createsPixels: false,
      containsExecutableCodeCommandsPathsUrlsOrCredentials: false,
      canonicalOperationAdmissionStillRequired: true,
      currentSourceAndMaskArtifactRevalidationStillRequired: true,
    }
  return {
    ...draft,
    reconstructionDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
  value: unknown,
): value is LivingFrameBackgroundPlateReconstructionSpec {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'reconstructionClass',
      'sourceBindings',
      'decisions',
      'artifactExpectation',
      'metrics',
      'authorityBoundary',
      'subjectSpecificRouting',
      'createsPixels',
      'containsExecutableCodeCommandsPathsUrlsOrCredentials',
      'canonicalOperationAdmissionStillRequired',
      'currentSourceAndMaskArtifactRevalidationStillRequired',
      'reconstructionDigestSha256',
    ])) return false
    const spec =
      value as unknown as LivingFrameBackgroundPlateReconstructionSpec
    const { reconstructionDigestSha256, ...draft } = spec
    if (
      !SHA256.test(reconstructionDigestSha256)
      || reconstructionDigestSha256 !== sha256AuthorityValue(draft)
      || spec.contractVersion
        !== LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_VERSION
      || spec.reconstructionClass
        !== LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_CLASS
      || !validateSourceBindings(spec.sourceBindings)
      || !validateDecisions(spec.decisions)
      || !validateArtifactExpectation(spec.artifactExpectation)
      || !validateAuthorityBoundary(spec.authorityBoundary)
      || spec.subjectSpecificRouting !== false
      || spec.createsPixels !== false
      || spec.containsExecutableCodeCommandsPathsUrlsOrCredentials
        !== false
      || spec.canonicalOperationAdmissionStillRequired !== true
      || spec.currentSourceAndMaskArtifactRevalidationStillRequired
        !== true
    ) return false
    return stableAuthorityStringify(spec.metrics)
      === stableAuthorityStringify(metrics(spec.decisions))
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameBackgroundPlateReconstructionInput,
): void {
  if (!isRecord(input) || !hasExactKeys(input, [
    'componentRig',
    'holes',
  ])) {
    throw new Error(
      'Living Frame background-plate input shape is invalid.',
    )
  }
  if (!verifyLivingFrameComponentRigSpecDigest(input.componentRig)) {
    throw new Error(
      'Living Frame background-plate component rig is invalid.',
    )
  }
  if (
    !Array.isArray(input.holes)
    || input.holes.length < 1
    || input.holes.length > MAX_HOLES
  ) {
    throw new Error(
      'Living Frame background-plate holes are outside bounds.',
    )
  }
  const ids = new Set<string>()
  const nodes = new Map(
    input.componentRig.nodes.map((node) => [
      node.componentId,
      node,
    ]),
  )
  input.holes.forEach((hole, index) => {
    validateHoleInput(hole, index, ids, nodes)
  })
}

function validateHoleInput(
  hole: LivingFrameBackgroundPlateHoleExpectationInput,
  index: number,
  ids: Set<string>,
  nodes: ReadonlyMap<string, LivingFrameRigNode>,
): void {
  if (!isRecord(hole) || !hasExactKeys(hole, [
    'holeId',
    'order',
    'plateComponentId',
    'removedComponentId',
    'normalizedBounds',
    'frameCoverageRatio',
    'touchesFrameBoundary',
    'textureClass',
    'safetyClass',
    'maskEvidenceExpectation',
  ])) {
    throw new Error(
      'Living Frame background-plate hole shape is invalid.',
    )
  }
  if (
    !safeId(hole.holeId)
    || ids.has(hole.holeId)
    || hole.order !== index
    || !safeId(hole.plateComponentId)
    || !safeId(hole.removedComponentId)
    || hole.plateComponentId === hole.removedComponentId
    || typeof hole.touchesFrameBoundary !== 'boolean'
    || !enumHas(
      LIVING_FRAME_RECONSTRUCTION_TEXTURE_CLASSES,
      hole.textureClass,
    )
    || !enumHas(
      LIVING_FRAME_RECONSTRUCTION_SAFETY_CLASSES,
      hole.safetyClass,
    )
    || hole.maskEvidenceExpectation
      !== 'future_qa_passed_component_alpha_artifact_required'
    || !boundedRatio(hole.frameCoverageRatio, false)
    || !validRect(hole.normalizedBounds)
    || hole.frameCoverageRatio
      > hole.normalizedBounds.width * hole.normalizedBounds.height
        + 1e-9
    || hole.touchesFrameBoundary
      !== rectTouchesFrameBoundary(hole.normalizedBounds)
  ) {
    throw new Error(
      'Living Frame background-plate hole values are invalid.',
    )
  }
  ids.add(hole.holeId)
  const plate = nodes.get(hole.plateComponentId)
  const removed = nodes.get(hole.removedComponentId)
  if (
    !plate
    || plate.nodeKind !== 'static_visual'
    || plate.role !== 'opaque_background_plate'
    || plate.transparencyExpectation !== 'opaque_plate'
    || plate.alphaSourceExpectation !== 'opaque_plate'
    || plate.maskExpectation !== 'opaque'
    || plate.rect === null
    || plate.motionTracks.length !== 0
  ) {
    throw new Error(
      'Living Frame reconstruction requires an opaque static plate.',
    )
  }
  if (
    !removed
    || removed.nodeKind === 'virtual_camera'
    || removed.rect === null
    || removed.transparencyExpectation
      !== 'still_alpha_required'
    || removed.alphaSourceExpectation
      !== 'postprocessed_still_mask_requires_qa'
    || removed.maskExpectation
      !== 'still_alpha_artifact_required'
    || !rectWithin(hole.normalizedBounds, removed.rect)
  ) {
    throw new Error(
      'Living Frame reconstruction requires a bounded removable component.',
    )
  }
}

function compileDecision(
  hole: LivingFrameBackgroundPlateHoleExpectationInput,
): LivingFrameBackgroundPlateReconstructionDecision {
  const blockers: LivingFrameReconstructionBlockerCode[] = [
    'canonical_openimageio_fillholes_profile_not_admitted',
    'qa_passed_plate_and_mask_artifacts_required',
  ]
  safetyBlockers(hole).forEach((code) => blockers.push(code))
  if (hole.touchesFrameBoundary) {
    blockers.push('hole_touches_frame_boundary')
  }
  if (hole.frameCoverageRatio > BOUNDED_HOLE_CEILING) {
    blockers.push('hole_area_exceeds_deterministic_ceiling')
  }
  if (
    hole.textureClass === 'high'
    || hole.textureClass === 'unknown'
  ) {
    blockers.push(
      'texture_complexity_exceeds_deterministic_ceiling',
    )
  }
  const eligible =
    hole.safetyClass === 'ordinary_visual_region'
    && !hole.touchesFrameBoundary
    && hole.frameCoverageRatio <= BOUNDED_HOLE_CEILING
    && (
      hole.textureClass === 'low'
      || hole.textureClass === 'medium'
    )
  const profile: LivingFrameReconstructionProfile =
    !eligible
      ? 'no_pixel_reconstruction_use_fallback'
      : hole.frameCoverageRatio <= SMALL_HOLE_CEILING
        && hole.textureClass === 'low'
        ? 'openimageio_pushpull_small_hole_candidate'
        : 'openimageio_pushpull_bounded_hole_candidate'
  return {
    holeId: hole.holeId,
    order: hole.order,
    plateComponentId: hole.plateComponentId,
    removedComponentId: hole.removedComponentId,
    normalizedBounds: { ...hole.normalizedBounds },
    frameCoverageRatio: hole.frameCoverageRatio,
    textureClass: hole.textureClass,
    safetyClass: hole.safetyClass,
    reconstructionProfile: profile,
    fillholesModeExpectation:
      profile === 'no_pixel_reconstruction_use_fallback'
        ? 'none'
        : 'pushpull',
    blockerCodes: blockers,
    fallbackLadder: FALLBACK_LADDER,
    qaExpectationCodes: QA_EXPECTATIONS,
    executablePixelOperationAdmitted: false,
    qaPassedInputArtifactsBound: false,
  }
}

function safetyBlockers(
  hole: LivingFrameBackgroundPlateHoleExpectationInput,
): LivingFrameReconstructionBlockerCode[] {
  if (hole.safetyClass === 'identity_or_likeness_sensitive_region') {
    return ['identity_or_likeness_reconstruction_prohibited']
  }
  if (hole.safetyClass === 'documentary_evidence_region') {
    return ['documentary_evidence_reconstruction_prohibited']
  }
  if (hole.safetyClass === 'exact_map_or_data_region') {
    return ['exact_map_or_data_reconstruction_prohibited']
  }
  if (hole.safetyClass === 'unknown_region') {
    return ['unknown_region_requires_review']
  }
  return []
}

function sourceBindings(
  rig: LivingFrameComponentRigSpec,
): LivingFrameBackgroundPlateSourceBindings {
  return {
    sceneId: rig.sourceBindings.sceneId,
    outputFrameId: rig.sourceBindings.outputFrameId,
    outputFrameDigestSha256:
      rig.sourceBindings.outputFrameDigestSha256,
    masterTimingPlanId:
      rig.sourceBindings.masterTimingPlanId,
    masterTimingPlanDigestSha256:
      rig.sourceBindings.masterTimingPlanDigestSha256,
    componentRigDigestSha256: rig.rigDigestSha256,
  }
}

function metrics(
  decisions:
    readonly LivingFrameBackgroundPlateReconstructionDecision[],
): LivingFrameBackgroundPlateReconstructionMetrics {
  return {
    holeCount: decisions.length,
    smallHoleCandidateCount: decisions.filter((decision) =>
      decision.reconstructionProfile
        === 'openimageio_pushpull_small_hole_candidate').length,
    boundedHoleCandidateCount: decisions.filter((decision) =>
      decision.reconstructionProfile
        === 'openimageio_pushpull_bounded_hole_candidate').length,
    fallbackOnlyCount: decisions.filter((decision) =>
      decision.reconstructionProfile
        === 'no_pixel_reconstruction_use_fallback').length,
    prohibitedSafetyRegionCount: decisions.filter((decision) =>
      decision.safetyClass !== 'ordinary_visual_region').length,
    maximumFrameCoverageRatio: Math.max(
      ...decisions.map((decision) =>
        decision.frameCoverageRatio),
    ),
  }
}

function validateSourceBindings(
  value: LivingFrameBackgroundPlateSourceBindings,
): boolean {
  return isRecord(value) && hasExactKeys(value, [
    'sceneId',
    'outputFrameId',
    'outputFrameDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'componentRigDigestSha256',
  ])
    && safeId(value.sceneId)
    && safeId(value.outputFrameId)
    && SHA256.test(value.outputFrameDigestSha256)
    && safeId(value.masterTimingPlanId)
    && SHA256.test(value.masterTimingPlanDigestSha256)
    && SHA256.test(value.componentRigDigestSha256)
}

function validateDecisions(
  decisions:
    readonly LivingFrameBackgroundPlateReconstructionDecision[],
): boolean {
  if (
    !Array.isArray(decisions)
    || decisions.length < 1
    || decisions.length > MAX_HOLES
  ) return false
  const ids = new Set<string>()
  return decisions.every((decision, index) => {
    if (!isRecord(decision as unknown) || !hasExactKeys(
      decision as unknown as Record<string, unknown>,
      [
      'holeId',
      'order',
      'plateComponentId',
      'removedComponentId',
      'normalizedBounds',
      'frameCoverageRatio',
      'textureClass',
      'safetyClass',
      'reconstructionProfile',
      'fillholesModeExpectation',
      'blockerCodes',
      'fallbackLadder',
      'qaExpectationCodes',
      'executablePixelOperationAdmitted',
      'qaPassedInputArtifactsBound',
      ],
    )) return false
    if (
      !safeId(decision.holeId)
      || ids.has(decision.holeId)
      || decision.order !== index
      || !safeId(decision.plateComponentId)
      || !safeId(decision.removedComponentId)
      || !validRect(decision.normalizedBounds)
      || !boundedRatio(decision.frameCoverageRatio, false)
      || !enumHas(
        LIVING_FRAME_RECONSTRUCTION_TEXTURE_CLASSES,
        decision.textureClass,
      )
      || !enumHas(
        LIVING_FRAME_RECONSTRUCTION_SAFETY_CLASSES,
        decision.safetyClass,
      )
      || !enumHas(
        LIVING_FRAME_RECONSTRUCTION_PROFILES,
        decision.reconstructionProfile,
      )
      || !['pushpull', 'none'].includes(
        decision.fillholesModeExpectation,
      )
      || !closedUniqueArray(
        decision.blockerCodes,
        LIVING_FRAME_RECONSTRUCTION_BLOCKER_CODES,
      )
      || stableAuthorityStringify(decision.fallbackLadder)
        !== stableAuthorityStringify(FALLBACK_LADDER)
      || stableAuthorityStringify(decision.qaExpectationCodes)
        !== stableAuthorityStringify(QA_EXPECTATIONS)
      || decision.executablePixelOperationAdmitted !== false
      || decision.qaPassedInputArtifactsBound !== false
    ) return false
    ids.add(decision.holeId)
    const expected = compileDecision({
      holeId: decision.holeId,
      order: decision.order,
      plateComponentId: decision.plateComponentId,
      removedComponentId: decision.removedComponentId,
      normalizedBounds: decision.normalizedBounds,
      frameCoverageRatio: decision.frameCoverageRatio,
      touchesFrameBoundary:
        decision.blockerCodes.includes(
          'hole_touches_frame_boundary',
        ),
      textureClass: decision.textureClass,
      safetyClass: decision.safetyClass,
      maskEvidenceExpectation:
        'future_qa_passed_component_alpha_artifact_required',
    })
    return stableAuthorityStringify(decision)
      === stableAuthorityStringify(expected)
  })
}

function validateArtifactExpectation(
  value: LivingFrameBackgroundPlateArtifactExpectation,
): boolean {
  return isRecord(value) && hasExactKeys(value, [
    'workItemTypeExpectation',
    'artifactTypeExpectation',
    'assetRoleExpectation',
    'contentTypeExpectation',
    'requiredDependencyArtifactKinds',
    'canonicalWorkItemCreationStillRequired',
    'canonicalAssetManifestEntryStillRequired',
    'canonicalArtifactQaStillRequired',
  ]) && stableAuthorityStringify(value)
    === stableAuthorityStringify(ARTIFACT_EXPECTATION)
}

function validateAuthorityBoundary(
  value:
    LivingFrameBackgroundPlateReconstructionAuthorityBoundary,
): boolean {
  return isRecord(value)
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function validRect(
  rect: {
    x: number
    y: number
    width: number
    height: number
  },
): boolean {
  return isRecord(rect) && hasExactKeys(rect, [
    'x',
    'y',
    'width',
    'height',
  ])
    && boundedRatio(rect.x, true)
    && boundedRatio(rect.y, true)
    && boundedRatio(rect.width, false)
    && boundedRatio(rect.height, false)
    && rect.x + rect.width <= 1
    && rect.y + rect.height <= 1
}

function rectWithin(
  inner: {
    x: number
    y: number
    width: number
    height: number
  },
  outer: {
    x: number
    y: number
    width: number
    height: number
  },
): boolean {
  const epsilon = 1e-9
  return inner.x + epsilon >= outer.x
    && inner.y + epsilon >= outer.y
    && inner.x + inner.width <= outer.x + outer.width + epsilon
    && inner.y + inner.height <= outer.y + outer.height + epsilon
}

function rectTouchesFrameBoundary(
  rect: {
    x: number
    y: number
    width: number
    height: number
  },
): boolean {
  const epsilon = 1e-9
  return rect.x <= epsilon
    || rect.y <= epsilon
    || rect.x + rect.width >= 1 - epsilon
    || rect.y + rect.height >= 1 - epsilon
}

function boundedRatio(value: number, allowZero: boolean): boolean {
  return Number.isFinite(value)
    && (allowZero ? value >= 0 : value > 0)
    && value <= 1
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && value === value.trim()
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function closedUniqueArray<T extends string>(
  values: readonly T[],
  allowed: readonly T[],
): boolean {
  return Array.isArray(values)
    && values.length > 0
    && new Set(values).size === values.length
    && values.every((value) => allowed.includes(value))
}

function enumHas<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === 'string'
    && values.includes(value as T)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value),
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}
