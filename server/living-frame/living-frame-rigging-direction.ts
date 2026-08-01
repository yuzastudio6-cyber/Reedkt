import { z } from 'zod'

import type {
  LivingFrameRiggingDirection,
  LivingFrameRiggingDirectionAuthorityBoundary,
  LivingFrameRiggingDirectionCraftRules,
  LivingFrameRiggingDirectionDesignDecision,
  LivingFrameRiggingDirectionDraft,
  LivingFrameRiggingDirectionHeadIntelligenceEvidence,
  LivingFrameRiggingDirectionMotionArcPhase,
  LivingFrameRiggingDirectionNarrativeDecision,
  LivingFrameRiggingDirectionPerformanceDecision,
  LivingFrameRiggingDirectionRiskDecision,
  LivingFrameRiggingDirectionSourceBindings,
  LivingFrameRiggingDirectionToolKnowledge,
} from '../../src/types/living-frame-rigging-direction'
import {
  LIVING_FRAME_RIGGING_DIRECTION_ATTENTION_PRIORITIES,
  LIVING_FRAME_RIGGING_DIRECTION_CLASS,
  LIVING_FRAME_RIGGING_DIRECTION_IMPORTANCE_LEVELS,
  LIVING_FRAME_RIGGING_DIRECTION_MOTION_PHASES,
  LIVING_FRAME_RIGGING_DIRECTION_PROFILE,
  LIVING_FRAME_RIGGING_DIRECTION_PURPOSES,
  LIVING_FRAME_RIGGING_DIRECTION_REASONING_ROLES,
  LIVING_FRAME_RIGGING_DIRECTION_VERSION,
  LIVING_FRAME_RIGGING_DIRECTION_VISUAL_VERBS,
} from '../../src/types/living-frame-rigging-direction'
import type {
  LivingFrameComponentGeometryBundle,
  LivingFrameGeometryExpectationRef,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameComponentRigSpec,
} from '../../src/types/living-frame-component-rig'
import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_RIGGING_V2_BACKENDS,
  LIVING_FRAME_RIGGING_V2_CAPABILITIES,
  LIVING_FRAME_RIGGING_V2_MODES,
} from '../../src/types/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import {
  verifyLivingFrameComponentRigSpecDigest,
} from './living-frame-component-rig'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:+-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const FORBIDDEN_TEXT =
  /(?:https?:\/\/|file:\/\/|data:|javascript:|-----BEGIN|\$\(|`{3}|[{};])/iu

const MOTION_ARC_PURPOSES = [
  'prepare_space_and_attention',
  'begin_primary_action',
  'communicate_narrative_relationship',
  'complete_primary_action',
  'restore_or_hold_stable_state',
] as const

const expectationRefSchema = z.object({
  refId: z.string().regex(SAFE_ID),
  version: z.string().regex(SAFE_VERSION),
  digestSha256: z.string().regex(SHA256),
  currentAuthorityRevalidationRequired: z.literal(true),
}).strict()

const headIntelligenceEvidenceSchema = z.object({
  reasoningRole: z.enum(LIVING_FRAME_RIGGING_DIRECTION_REASONING_ROLES),
  reasoningAttemptRef: expectationRefSchema,
  structuredOutputRef: expectationRefSchema,
  visualUnderstandingEvidenceRefs:
    z.array(expectationRefSchema).min(1).max(32),
  rawChatPassedToRigWorker: z.literal(false),
  rawModelCodeExecutionAllowed: z.literal(false),
}).strict()

const narrativeDecisionSchema = z.object({
  purpose: z.enum(LIVING_FRAME_RIGGING_DIRECTION_PURPOSES),
  visualVerb: z.enum(LIVING_FRAME_RIGGING_DIRECTION_VISUAL_VERBS),
  directedMotionSummary: z.string().trim().min(8).max(500),
  importance: z.enum(LIVING_FRAME_RIGGING_DIRECTION_IMPORTANCE_LEVELS),
  attentionPriority:
    z.enum(LIVING_FRAME_RIGGING_DIRECTION_ATTENTION_PRIORITIES),
  primaryFocalComponentId: z.string().regex(SAFE_ID),
  animateMeaningNotVocabulary: z.literal(true),
  onePrimaryMotionAtATime: z.literal(true),
}).strict()

const motionArcSchema = z.object({
  order: z.number().int().min(0).max(4),
  phase: z.enum(LIVING_FRAME_RIGGING_DIRECTION_MOTION_PHASES),
  phasePurpose: z.enum(MOTION_ARC_PURPOSES),
  masterTimingOwnsExactFrames: z.literal(true),
}).strict()

const designDecisionSchema = z.object({
  rigMode: z.enum(LIVING_FRAME_RIGGING_V2_MODES),
  requiredCapabilities:
    z.array(z.enum(LIVING_FRAME_RIGGING_V2_CAPABILITIES)).min(1),
  recommendedBackend: z.enum(LIVING_FRAME_RIGGING_V2_BACKENDS),
  simplerNativeRouteConsidered: z.literal(true),
  simplerNativeRouteSufficient: z.boolean(),
  externalRuntimeJustification: z.enum([
    'not_required',
    'flat_2d_mesh_deformation_required',
    'armature_ik_skinning_or_2_5d_required',
  ]),
  partDecompositionRequired: z.boolean(),
  skeletalDeformationRequired: z.boolean(),
  inverseKinematicsRequired: z.boolean(),
  depthCameraRequired: z.boolean(),
  transparentComponentOutputRequired: z.boolean(),
  finalCanvasDelegatedToRigTool: z.literal(false),
}).strict()

const riskDecisionSchema = z.object({
  thinStructureRisk: z.enum(['none', 'low', 'medium', 'high']),
  occludedPartRisk: z.enum(['none', 'low', 'medium', 'high']),
  deformationRisk: z.enum(['none', 'low', 'medium', 'high']),
  identityOrSilhouetteRisk: z.enum(['none', 'low', 'medium', 'high']),
  manualRigReviewRequired: z.boolean(),
  lowConfidenceMayAutoExecute: z.literal(false),
}).strict()

const inputSchema = z.object({
  geometryBundle: z.custom<LivingFrameComponentGeometryBundle>(
    verifyLivingFrameComponentGeometryBundleDigest,
  ),
  motionBundle: z.custom<LivingFrameDeterministicMotionBundle>(
    verifyLivingFrameDeterministicMotionBundleDigest,
  ),
  componentRig: z.custom<LivingFrameComponentRigSpec>(
    verifyLivingFrameComponentRigSpecDigest,
  ),
  compiledIntentRef: expectationRefSchema,
  semanticScenePlanRef: expectationRefSchema,
  headIntelligenceEvidence: headIntelligenceEvidenceSchema,
  narrativeDecision: narrativeDecisionSchema,
  motionArc: z.array(motionArcSchema).length(5),
  designDecision: designDecisionSchema,
  riskDecision: riskDecisionSchema,
}).strict()

const CRAFT_RULES: LivingFrameRiggingDirectionCraftRules = Object.freeze({
  preserveRecognizableSilhouette: true,
  preserveApprovedPartBoundaries: true,
  usePhysicallyBelievablePivots: true,
  respectJointLimits: true,
  preventMeshFoldovers: true,
  avoidUnmotivatedMotion: true,
  avoidUniformWholeCharacterWobble: true,
  secondaryMotionMustFollowPrimaryMotion: true,
  stillnessRemainsAnIntentionalContrast: true,
  motionMustResolveOrSettle: true,
  preserveCaptionFaceGestureAndContactObjectSafety: true,
})

const TOOL_KNOWLEDGE:
  LivingFrameRiggingDirectionToolKnowledge = Object.freeze({
    nativeRemotionUse:
      'rigid_parts_hierarchy_pivots_tracks_and_mechanical_motion',
    blenderUse:
      'armatures_skinning_ik_constraints_mesh_deformation_and_2_5d_camera',
    openToonzPlasticUse:
      'flat_2d_triangular_mesh_skeleton_angle_rigidity_and_stacking',
    blenderNotRequiredForSimpleRigidMotion: true,
    openToonzNotUsedForFinalCanvas: true,
    remotionOwnsFinalComposition: true,
  })

const AUTHORITY_BOUNDARY:
  LivingFrameRiggingDirectionAuthorityBoundary = Object.freeze({
    headIntelligenceRigDirectionOnly: true,
    componentEvidenceAuthority: false,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    workerDispatchAuthority: false,
    runtimeExecutionAuthority: false,
    assetPersistenceAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    qaApprovalAuthority: false,
    rendererAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRiggingDirectionInput {
  readonly geometryBundle: LivingFrameComponentGeometryBundle
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly componentRig: LivingFrameComponentRigSpec
  readonly compiledIntentRef: LivingFrameGeometryExpectationRef
  readonly semanticScenePlanRef: LivingFrameGeometryExpectationRef
  readonly headIntelligenceEvidence:
    LivingFrameRiggingDirectionHeadIntelligenceEvidence
  readonly narrativeDecision:
    LivingFrameRiggingDirectionNarrativeDecision
  readonly motionArc:
    readonly LivingFrameRiggingDirectionMotionArcPhase[]
  readonly designDecision:
    LivingFrameRiggingDirectionDesignDecision
  readonly riskDecision: LivingFrameRiggingDirectionRiskDecision
}

export function compileLivingFrameRiggingDirection(
  rawInput: CompileLivingFrameRiggingDirectionInput,
): LivingFrameRiggingDirection {
  const input = inputSchema.parse(rawInput)
  assertSourceLineage(input)
  assertProfessionalDirection(input)
  const sourceBindings = compileSourceBindings(input)
  const performanceDecision = compilePerformanceDecision(
    input.designDecision,
  )
  const draft: LivingFrameRiggingDirectionDraft = {
    contractVersion: LIVING_FRAME_RIGGING_DIRECTION_VERSION,
    directionProfile: LIVING_FRAME_RIGGING_DIRECTION_PROFILE,
    directionClass: LIVING_FRAME_RIGGING_DIRECTION_CLASS,
    sourceBindings,
    headIntelligenceEvidence: clone(input.headIntelligenceEvidence),
    narrativeDecision: clone(input.narrativeDecision),
    motionArc: clone(input.motionArc),
    designDecision: clone(input.designDecision),
    craftRules: CRAFT_RULES,
    toolKnowledge: TOOL_KNOWLEDGE,
    riskDecision: clone(input.riskDecision),
    performanceDecision,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCodeCommandsPathsUrlsOrCredentials: false,
    containsRawChatTranscriptOrMediaBytes: false,
    deterministicRigCompilerValidationStillRequired: true,
    canonicalSnapshotWorkAssetAndReviewAdmissionStillRequired: true,
  }
  return {
    ...draft,
    directionDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameRiggingDirection(
  value: unknown,
): value is LivingFrameRiggingDirection {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'directionProfile',
      'directionClass',
      'sourceBindings',
      'headIntelligenceEvidence',
      'narrativeDecision',
      'motionArc',
      'designDecision',
      'craftRules',
      'toolKnowledge',
      'riskDecision',
      'performanceDecision',
      'authorityBoundary',
      'containsExecutableCodeCommandsPathsUrlsOrCredentials',
      'containsRawChatTranscriptOrMediaBytes',
      'deterministicRigCompilerValidationStillRequired',
      'canonicalSnapshotWorkAssetAndReviewAdmissionStillRequired',
      'directionDigestSha256',
    ])) return false
    const direction = value as unknown as LivingFrameRiggingDirection
    const { directionDigestSha256, ...draft } = direction
    return SHA256.test(directionDigestSha256)
      && directionDigestSha256 === sha256AuthorityValue(draft)
      && direction.contractVersion === LIVING_FRAME_RIGGING_DIRECTION_VERSION
      && direction.directionProfile === LIVING_FRAME_RIGGING_DIRECTION_PROFILE
      && direction.directionClass === LIVING_FRAME_RIGGING_DIRECTION_CLASS
      && validateSourceBindings(direction.sourceBindings)
      && headIntelligenceEvidenceSchema.safeParse(
        direction.headIntelligenceEvidence,
      ).success
      && narrativeDecisionSchema.safeParse(
        direction.narrativeDecision,
      ).success
      && !FORBIDDEN_TEXT.test(
        direction.narrativeDecision.directedMotionSummary,
      )
      && validateMotionArc(direction.motionArc)
      && designDecisionSchema.safeParse(direction.designDecision).success
      && validateDesignDecision(direction.designDecision)
      && stableAuthorityStringify(direction.craftRules)
        === stableAuthorityStringify(CRAFT_RULES)
      && stableAuthorityStringify(direction.toolKnowledge)
        === stableAuthorityStringify(TOOL_KNOWLEDGE)
      && riskDecisionSchema.safeParse(direction.riskDecision).success
      && validateRisk(direction.riskDecision)
      && stableAuthorityStringify(direction.performanceDecision)
        === stableAuthorityStringify(
          compilePerformanceDecision(direction.designDecision),
        )
      && stableAuthorityStringify(direction.authorityBoundary)
        === stableAuthorityStringify(AUTHORITY_BOUNDARY)
      && direction.containsExecutableCodeCommandsPathsUrlsOrCredentials
        === false
      && direction.containsRawChatTranscriptOrMediaBytes === false
      && direction.deterministicRigCompilerValidationStillRequired === true
      && direction.canonicalSnapshotWorkAssetAndReviewAdmissionStillRequired
        === true
  } catch {
    return false
  }
}

function assertSourceLineage(input: z.infer<typeof inputSchema>): void {
  const geometry = input.geometryBundle
  const motion = input.motionBundle
  const rig = input.componentRig
  if (
    rig.sourceBindings.geometryBundleDigestSha256
      !== geometry.bundleDigestSha256
    || rig.sourceBindings.motionBundleDigestSha256
      !== motion.bundleDigestSha256
    || rig.sourceBindings.sceneId !== motion.timingExpectation.sceneId
    || rig.sourceBindings.outputFrameId
      !== geometry.outputFrameExpectation.outputFrameId
    || rig.sourceBindings.outputFrameDigestSha256
      !== geometry.outputFrameExpectation.outputFrameDigestSha256
    || rig.sourceBindings.masterTimingPlanId
      !== motion.timingExpectation.masterTimingPlanId
    || rig.sourceBindings.masterTimingPlanDigestSha256
      !== motion.timingExpectation.masterTimingPlanDigestSha256
  ) {
    throw new Error(
      'Living Frame Rigging Direction source lineage is inconsistent.',
    )
  }
}

function assertProfessionalDirection(
  input: z.infer<typeof inputSchema>,
): void {
  if (FORBIDDEN_TEXT.test(input.narrativeDecision.directedMotionSummary)) {
    throw new Error(
      'Living Frame Rigging Direction summary contains unsafe material.',
    )
  }
  const visualComponentIds = new Set(
    input.componentRig.nodes
      .filter((node) => node.nodeKind !== 'virtual_camera')
      .map((node) => node.componentId),
  )
  if (!visualComponentIds.has(
    input.narrativeDecision.primaryFocalComponentId,
  )) {
    throw new Error(
      'Living Frame Rigging Direction focal component is not approved.',
    )
  }
  if (!validateMotionArc(input.motionArc)) {
    throw new Error(
      'Living Frame Rigging Direction motion arc is invalid.',
    )
  }
  if (!validateDesignDecision(input.designDecision)) {
    throw new Error(
      'Living Frame Rigging Direction design decision is inconsistent.',
    )
  }
  if (!validateRisk(input.riskDecision)) {
    throw new Error(
      'Living Frame Rigging Direction risk decision is inconsistent.',
    )
  }
  const evidenceIds = [
    input.headIntelligenceEvidence.reasoningAttemptRef.refId,
    input.headIntelligenceEvidence.structuredOutputRef.refId,
    ...input.headIntelligenceEvidence.visualUnderstandingEvidenceRefs
      .map((ref) => ref.refId),
  ]
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error(
      'Living Frame Rigging Direction evidence references must be unique.',
    )
  }
}

function validateMotionArc(
  value: readonly LivingFrameRiggingDirectionMotionArcPhase[],
): boolean {
  return value.length === 5
    && value.every((phase, index) =>
      motionArcSchema.safeParse(phase).success
      && phase.order === index
      && phase.phase === LIVING_FRAME_RIGGING_DIRECTION_MOTION_PHASES[index]
      && phase.phasePurpose === MOTION_ARC_PURPOSES[index])
}

function validateDesignDecision(
  value: LivingFrameRiggingDirectionDesignDecision,
): boolean {
  if (
    new Set(value.requiredCapabilities).size
      !== value.requiredCapabilities.length
    || stableAuthorityStringify(value.requiredCapabilities)
      !== stableAuthorityStringify(
        LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter((capability) =>
          value.requiredCapabilities.includes(capability)),
      )
  ) return false
  const has = (capability: typeof LIVING_FRAME_RIGGING_V2_CAPABILITIES[number]) =>
    value.requiredCapabilities.includes(capability)
  if (
    value.skeletalDeformationRequired
      !== (has('bone_chain') || has('mesh_deformation'))
    || value.inverseKinematicsRequired !== has('inverse_kinematics')
    || value.depthCameraRequired !== has('depth_camera')
    || value.transparentComponentOutputRequired
      !== (value.recommendedBackend !== 'reeditpro_native_remotion')
    || (
      value.rigMode !== 'native_rigid_transform'
      && !value.partDecompositionRequired
    )
  ) return false
  if (value.recommendedBackend === 'reeditpro_native_remotion') {
    return value.simplerNativeRouteSufficient
      && value.externalRuntimeJustification === 'not_required'
      && [
        'native_rigid_transform',
        'native_hierarchical_cutout',
        'mechanical_linkage',
      ].includes(value.rigMode)
  }
  if (
    value.recommendedBackend === 'opentoonz_plastic_candidate'
  ) {
    return !value.simplerNativeRouteSufficient
      && value.rigMode === 'deformable_2d_character'
      && !value.inverseKinematicsRequired
      && !value.depthCameraRequired
      && !has('skin_weights')
      && !has('mechanical_linkage')
      && value.externalRuntimeJustification
        === 'flat_2d_mesh_deformation_required'
  }
  return !value.simplerNativeRouteSufficient
    && value.recommendedBackend === 'blender_headless_candidate'
    && (
      value.rigMode === 'armature_2_5d_character'
      || (
        value.rigMode === 'deformable_2d_character'
        && (
          value.inverseKinematicsRequired
          || has('skin_weights')
        )
      )
    )
    && (
      value.inverseKinematicsRequired
      || value.depthCameraRequired
      || has('skin_weights')
    )
    && value.externalRuntimeJustification
      === 'armature_ik_skinning_or_2_5d_required'
}

function validateRisk(
  value: LivingFrameRiggingDirectionRiskDecision,
): boolean {
  const riskValues = [
    value.thinStructureRisk,
    value.occludedPartRisk,
    value.deformationRisk,
    value.identityOrSilhouetteRisk,
  ]
  return !riskValues.includes('high') || value.manualRigReviewRequired
}

function compileSourceBindings(
  input: z.infer<typeof inputSchema>,
): LivingFrameRiggingDirectionSourceBindings {
  return {
    sceneId: input.componentRig.sourceBindings.sceneId,
    outputFrameId: input.componentRig.sourceBindings.outputFrameId,
    outputFrameDigestSha256:
      input.componentRig.sourceBindings.outputFrameDigestSha256,
    masterTimingPlanId:
      input.componentRig.sourceBindings.masterTimingPlanId,
    masterTimingPlanDigestSha256:
      input.componentRig.sourceBindings.masterTimingPlanDigestSha256,
    geometryBundleDigestSha256: input.geometryBundle.bundleDigestSha256,
    motionBundleDigestSha256: input.motionBundle.bundleDigestSha256,
    componentRigDigestSha256: input.componentRig.rigDigestSha256,
    compiledIntentRef: clone(input.compiledIntentRef),
    semanticScenePlanRef: clone(input.semanticScenePlanRef),
  }
}

function compilePerformanceDecision(
  design: LivingFrameRiggingDirectionDesignDecision,
): LivingFrameRiggingDirectionPerformanceDecision {
  return {
    nativeRoutePreferredWhenProfessionallySufficient: true,
    externalRuntimeRunsSceneOnly: true,
    lowResolutionBlockingPreviewFirst:
      design.recommendedBackend !== 'reeditpro_native_remotion',
    exactRigDigestCacheRequired: true,
    unrelatedCaptionOrAudioChangeMayInvalidateRigCache: false,
    latencyClaimRequiresMeasuredBenchmark: true,
  }
}

function validateSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'sceneId',
    'outputFrameId',
    'outputFrameDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'geometryBundleDigestSha256',
    'motionBundleDigestSha256',
    'componentRigDigestSha256',
    'compiledIntentRef',
    'semanticScenePlanRef',
  ])) return false
  return SAFE_ID.test(String(value.sceneId))
    && SAFE_ID.test(String(value.outputFrameId))
    && SAFE_ID.test(String(value.masterTimingPlanId))
    && [
      value.outputFrameDigestSha256,
      value.masterTimingPlanDigestSha256,
      value.geometryBundleDigestSha256,
      value.motionBundleDigestSha256,
      value.componentRigDigestSha256,
    ].every((digest) => SHA256.test(String(digest)))
    && expectationRefSchema.safeParse(value.compiledIntentRef).success
    && expectationRefSchema.safeParse(value.semanticScenePlanRef).success
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return stableAuthorityStringify(Object.keys(value).sort())
    === stableAuthorityStringify([...keys].sort())
}
