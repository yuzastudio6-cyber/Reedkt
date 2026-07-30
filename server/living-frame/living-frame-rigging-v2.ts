import { z } from 'zod'

import type {
  LivingFrameRiggingV2ArtifactRef,
  LivingFrameRiggingV2AuthorityBoundary,
  LivingFrameRiggingV2Backend,
  LivingFrameRiggingV2BackendCandidate,
  LivingFrameRiggingV2Bone,
  LivingFrameRiggingV2Capability,
  LivingFrameRiggingV2Constraint,
  LivingFrameRiggingV2Control,
  LivingFrameRiggingV2FallbackPolicy,
  LivingFrameRiggingV2IkChain,
  LivingFrameRiggingV2Joint,
  LivingFrameRiggingV2MechanicalLinkage,
  LivingFrameRiggingV2MeshBinding,
  LivingFrameRiggingV2Metrics,
  LivingFrameRiggingV2Mode,
  LivingFrameRiggingV2PartBinding,
  LivingFrameRiggingV2PerformanceQualification,
  LivingFrameRiggingV2Plan,
  LivingFrameRiggingV2PlanDraft,
  LivingFrameRiggingV2QaPlan,
  LivingFrameRiggingV2RoutingRecommendation,
  LivingFrameRiggingV2SecondaryMotionGroup,
  LivingFrameRiggingV2SourceBindings,
} from '../../src/types/living-frame-rigging-v2'
import {
  LIVING_FRAME_RIGGING_V2_CAPABILITIES,
  LIVING_FRAME_RIGGING_V2_CLASS,
  LIVING_FRAME_RIGGING_V2_CONSTRAINT_KINDS,
  LIVING_FRAME_RIGGING_V2_CONTROL_KINDS,
  LIVING_FRAME_RIGGING_V2_MESH_TOPOLOGIES,
  LIVING_FRAME_RIGGING_V2_MODES,
  LIVING_FRAME_RIGGING_V2_PART_ROLES,
  LIVING_FRAME_RIGGING_V2_PROFILE,
  LIVING_FRAME_RIGGING_V2_SECONDARY_MOTION_PROFILES,
  LIVING_FRAME_RIGGING_V2_VERSION,
} from '../../src/types/living-frame-rigging-v2'
import type {
  LivingFrameComponentGeometryBundle,
} from '../../src/types/living-frame-component-geometry'
import {
  LIVING_FRAME_COMPONENT_GEOMETRY_VERSION,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameComponentRigSpec,
} from '../../src/types/living-frame-component-rig'
import {
  LIVING_FRAME_COMPONENT_RIG_VERSION,
} from '../../src/types/living-frame-component-rig'
import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_DETERMINISTIC_MOTION_VERSION,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameRiggingDirection,
} from '../../src/types/living-frame-rigging-direction'
import {
  LIVING_FRAME_RIGGING_DIRECTION_VERSION,
} from '../../src/types/living-frame-rigging-direction'
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
import {
  verifyLivingFrameRiggingDirection,
} from './living-frame-rigging-direction'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:+-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_PARTS = 128
const MAX_BONES = 256
const MAX_CONSTRAINTS = 512

const NATIVE_CAPABILITIES = [
  'rigid_transform',
  'parent_hierarchy',
  'mechanical_linkage',
  'secondary_motion',
  'depth_camera',
  'transparent_layer_output',
] as const satisfies readonly LivingFrameRiggingV2Capability[]

const BLENDER_CAPABILITIES = [
  ...LIVING_FRAME_RIGGING_V2_CAPABILITIES,
] as const satisfies readonly LivingFrameRiggingV2Capability[]

const OPENTOONZ_CAPABILITIES = [
  'rigid_transform',
  'parent_hierarchy',
  'bone_chain',
  'joint_limits',
  'mesh_deformation',
  'rigidity_map',
  'stacking_order',
  'secondary_motion',
  'transparent_layer_output',
] as const satisfies readonly LivingFrameRiggingV2Capability[]

const REQUIRED_PERFORMANCE_MEASUREMENTS = [
  'cold_start_duration_ms',
  'warm_start_duration_ms',
  'rig_compile_duration_ms',
  'preview_render_duration_ms',
  'full_quality_render_duration_ms',
  'peak_memory_bytes',
  'output_bytes',
  'cache_reuse_result',
] as const

const FALLBACK_POLICY: LivingFrameRiggingV2FallbackPolicy = Object.freeze({
  orderedFallbacks: [
    'approved_advanced_rig',
    'native_hierarchical_cutout',
    'native_rigid_transform',
    'static_living_frame_component',
    'no_extra_visual',
  ] as const,
  fallbackMayChangeMasterTiming: false,
  fallbackMayChangeFinalCanvasOwner: false,
  fallbackBeyondApprovedScopeRequiresNewApproval: true,
})

const AUTHORITY_BOUNDARY:
  LivingFrameRiggingV2AuthorityBoundary = Object.freeze({
    deterministicRigPlanCompilationOnly: true,
    componentDecompositionAuthority: false,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    runtimeSelectionAuthority: false,
    workerLeaseAuthority: false,
    dispatchAuthority: false,
    assetPersistenceAuthority: false,
    assetManifestAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    qaApprovalAuthority: false,
    rendererAuthority: false,
    finalCanvasAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

const pointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
}).strict()

const expectationRefSchema = z.object({
  refId: z.string().regex(SAFE_ID),
  version: z.string().regex(SAFE_VERSION),
  digestSha256: z.string().regex(SHA256),
  currentAuthorityRevalidationRequired: z.literal(true),
}).strict()

const artifactRefSchema = z.object({
  artifactId: z.string().regex(SAFE_ID),
  artifactVersion: z.string().regex(SAFE_VERSION),
  artifactDigestSha256: z.string().regex(SHA256),
  contentType: z.literal('application/json'),
  currentArtifactRevalidationRequired: z.literal(true),
}).strict()

const partSchema = z.object({
  order: z.number().int().nonnegative(),
  partId: z.string().regex(SAFE_ID),
  componentId: z.string().regex(SAFE_ID),
  partRole: z.enum(LIVING_FRAME_RIGGING_V2_PART_ROLES),
  deformable: z.boolean(),
  partProposalConfidence: z.number().finite().min(0).max(1),
  manualPartReviewRequired: z.boolean(),
  occludedAreaReconstructionRequired: z.boolean(),
  decompositionEvidenceRef: expectationRefSchema,
}).strict()

const boneSchema = z.object({
  order: z.number().int().nonnegative(),
  boneId: z.string().regex(SAFE_ID),
  componentId: z.string().regex(SAFE_ID),
  parentBoneId: z.string().regex(SAFE_ID).nullable(),
  head: pointSchema,
  tail: pointSchema,
  restLengthNormalized: z.number().finite().positive().max(2),
  restAngleDegrees: z.number().finite().min(-360).max(360),
  deformComponent: z.boolean(),
}).strict()

const jointSchema = z.object({
  order: z.number().int().nonnegative(),
  jointId: z.string().regex(SAFE_ID),
  boneId: z.string().regex(SAFE_ID),
  pivot: pointSchema,
  minimumAngleDegrees: z.number().finite().min(-720).max(720),
  maximumAngleDegrees: z.number().finite().min(-720).max(720),
  restAngleDegrees: z.number().finite().min(-720).max(720),
  allowStretching: z.boolean(),
  stiffnessNormalized: z.number().finite().min(0).max(1),
}).strict()

const controlSchema = z.object({
  order: z.number().int().nonnegative(),
  controlId: z.string().regex(SAFE_ID),
  kind: z.enum(LIVING_FRAME_RIGGING_V2_CONTROL_KINDS),
  targetBoneId: z.string().regex(SAFE_ID).nullable(),
  position: pointSchema,
}).strict()

const constraintSchema = z.object({
  order: z.number().int().nonnegative(),
  constraintId: z.string().regex(SAFE_ID),
  kind: z.enum(LIVING_FRAME_RIGGING_V2_CONSTRAINT_KINDS),
  sourceRefId: z.string().regex(SAFE_ID),
  targetRefId: z.string().regex(SAFE_ID),
  influenceNormalized: z.number().finite().min(0).max(1),
  minimumValue: z.number().finite().nullable(),
  maximumValue: z.number().finite().nullable(),
}).strict()

const ikChainSchema = z.object({
  order: z.number().int().nonnegative(),
  chainId: z.string().regex(SAFE_ID),
  rootBoneId: z.string().regex(SAFE_ID),
  effectorBoneId: z.string().regex(SAFE_ID),
  targetControlId: z.string().regex(SAFE_ID),
  poleControlId: z.string().regex(SAFE_ID).nullable(),
  chainLength: z.number().int().min(1).max(64),
  solverIterationLimit: z.number().int().min(1).max(256),
  toleranceNormalized: z.number().finite().positive().max(1),
}).strict()

const meshSchema = z.object({
  order: z.number().int().nonnegative(),
  meshId: z.string().regex(SAFE_ID),
  componentId: z.string().regex(SAFE_ID),
  topology: z.enum(LIVING_FRAME_RIGGING_V2_MESH_TOPOLOGIES),
  topologyArtifactRef: artifactRefSchema,
  vertexCount: z.number().int().min(3).max(1_000_000),
  triangleCount: z.number().int().min(1).max(2_000_000),
  weightMapArtifactRef: artifactRefSchema.nullable(),
  rigidityMapArtifactRef: artifactRefSchema.nullable(),
  animatedStackingOrderRequired: z.boolean(),
}).strict()

const linkageSchema = z.object({
  order: z.number().int().nonnegative(),
  linkageId: z.string().regex(SAFE_ID),
  driverComponentId: z.string().regex(SAFE_ID),
  driverMotionTrackId: z.string().regex(SAFE_ID),
  drivenComponentIds: z.array(z.string().regex(SAFE_ID)).min(1).max(64),
  relationship: z.enum([
    'rotation_ratio',
    'translation_ratio',
    'reciprocal_link',
  ]),
  ratio: z.number().finite().min(-100).max(100),
  phaseOffsetDegrees: z.number().finite().min(-360).max(360),
  exactPivotVerificationRequired: z.literal(true),
}).strict()

const secondaryMotionSchema = z.object({
  order: z.number().int().nonnegative(),
  groupId: z.string().regex(SAFE_ID),
  profile: z.enum(LIVING_FRAME_RIGGING_V2_SECONDARY_MOTION_PROFILES),
  driverPartId: z.string().regex(SAFE_ID),
  followerPartIds: z.array(z.string().regex(SAFE_ID)).min(1).max(64),
  stiffnessNormalized: z.number().finite().min(0).max(1),
  dampingNormalized: z.number().finite().min(0).max(1),
  maximumDisplacementNormalized: z.number().finite().positive().max(1),
  deterministicBakeRequired: z.literal(true),
}).strict()

const compileInputSchema = z.object({
  geometryBundle: z.custom<LivingFrameComponentGeometryBundle>(
    verifyLivingFrameComponentGeometryBundleDigest,
  ),
  motionBundle: z.custom<LivingFrameDeterministicMotionBundle>(
    verifyLivingFrameDeterministicMotionBundleDigest,
  ),
  componentRig: z.custom<LivingFrameComponentRigSpec>(
    verifyLivingFrameComponentRigSpecDigest,
  ),
  riggingDirection: z.custom<LivingFrameRiggingDirection>(
    verifyLivingFrameRiggingDirection,
  ),
  rigMode: z.enum(LIVING_FRAME_RIGGING_V2_MODES),
  partBindings: z.array(partSchema).min(1).max(MAX_PARTS),
  bones: z.array(boneSchema).max(MAX_BONES),
  joints: z.array(jointSchema).max(MAX_BONES),
  controls: z.array(controlSchema).max(MAX_BONES),
  constraints: z.array(constraintSchema).max(MAX_CONSTRAINTS),
  ikChains: z.array(ikChainSchema).max(MAX_BONES),
  meshBindings: z.array(meshSchema).max(MAX_PARTS),
  mechanicalLinkages: z.array(linkageSchema).max(MAX_PARTS),
  secondaryMotionGroups: z.array(secondaryMotionSchema).max(MAX_PARTS),
}).strict()

export interface CompileLivingFrameRiggingV2Input {
  readonly geometryBundle: LivingFrameComponentGeometryBundle
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly componentRig: LivingFrameComponentRigSpec
  readonly riggingDirection: LivingFrameRiggingDirection
  readonly rigMode: LivingFrameRiggingV2Mode
  readonly partBindings: readonly LivingFrameRiggingV2PartBinding[]
  readonly bones: readonly LivingFrameRiggingV2Bone[]
  readonly joints: readonly LivingFrameRiggingV2Joint[]
  readonly controls: readonly LivingFrameRiggingV2Control[]
  readonly constraints: readonly LivingFrameRiggingV2Constraint[]
  readonly ikChains: readonly LivingFrameRiggingV2IkChain[]
  readonly meshBindings: readonly LivingFrameRiggingV2MeshBinding[]
  readonly mechanicalLinkages:
    readonly LivingFrameRiggingV2MechanicalLinkage[]
  readonly secondaryMotionGroups:
    readonly LivingFrameRiggingV2SecondaryMotionGroup[]
}

export function compileLivingFrameRiggingV2Plan(
  rawInput: CompileLivingFrameRiggingV2Input,
): LivingFrameRiggingV2Plan {
  const input = compileInputSchema.parse(rawInput)
  assertSourceLineage(input)
  assertRigDefinition(input)
  const requiredCapabilities = deriveRequiredCapabilities(input)
  const backendCandidates = compileBackendCandidates(requiredCapabilities)
  const routingRecommendation = compileRoutingRecommendation(
    input.rigMode,
    requiredCapabilities,
    backendCandidates,
  )
  assertDirectionCompatibility(
    input,
    requiredCapabilities,
    routingRecommendation,
  )
  const sourceBindings = compileSourceBindings(input)
  const metrics = compileMetrics(input, requiredCapabilities)
  const draft: LivingFrameRiggingV2PlanDraft = {
    contractVersion: LIVING_FRAME_RIGGING_V2_VERSION,
    riggingProfile: LIVING_FRAME_RIGGING_V2_PROFILE,
    planClass: LIVING_FRAME_RIGGING_V2_CLASS,
    sourceBindings,
    rigMode: input.rigMode,
    requiredCapabilities,
    partBindings: clone(input.partBindings),
    bones: clone(input.bones),
    joints: clone(input.joints),
    controls: clone(input.controls),
    constraints: clone(input.constraints),
    ikChains: clone(input.ikChains),
    meshBindings: clone(input.meshBindings),
    mechanicalLinkages: clone(input.mechanicalLinkages),
    secondaryMotionGroups: clone(input.secondaryMotionGroups),
    backendCandidates,
    routingRecommendation,
    outputContract: {
      outputMode:
        routingRecommendation.recommendedBackend ===
          'reeditpro_native_remotion'
          ? 'native_transform_spec_json'
          : requiredCapabilities.includes('depth_camera')
            ? 'transparent_rgba_component_sequence_with_depth_and_mask'
            : 'transparent_rgba_component_sequence',
      widthPixels: input.geometryBundle.outputFrameExpectation.widthPixels,
      heightPixels: input.geometryBundle.outputFrameExpectation.heightPixels,
      startFrame: input.motionBundle.timingExpectation.sceneStartFrame,
      endFrameExclusive:
        input.motionBundle.timingExpectation.sceneEndFrame + 1,
      outputContainsOnlyApprovedComponentLayers: true,
      outputMayClaimFinalCanvas: false,
      transparentAlphaRequired:
        routingRecommendation.recommendedBackend !==
          'reeditpro_native_remotion',
      depthPassRequired: requiredCapabilities.includes('depth_camera'),
      maskPassRequired:
        requiredCapabilities.includes('mesh_deformation')
        || requiredCapabilities.includes('depth_camera'),
      remotionOwnsFinalComposition: true,
    },
    performanceQualification:
      compilePerformanceQualification(routingRecommendation),
    qaPlan: compileQaPlan(input, requiredCapabilities),
    fallbackPolicy: FALLBACK_POLICY,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCodeCommandsPathsUrlsOrCredentials: false,
    containsRawChatTranscriptOrMediaBytes: false,
    externalRuntimeExecutionAuthorized: false,
    toolRegistryMutationRequested: false,
    currentSourceLineageRevalidationStillRequired: true,
    canonicalWorkAssetAndReviewAdmissionStillRequired: true,
  }
  return {
    ...draft,
    planDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameRiggingV2Plan(
  value: unknown,
): value is LivingFrameRiggingV2Plan {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'riggingProfile',
      'planClass',
      'sourceBindings',
      'rigMode',
      'requiredCapabilities',
      'partBindings',
      'bones',
      'joints',
      'controls',
      'constraints',
      'ikChains',
      'meshBindings',
      'mechanicalLinkages',
      'secondaryMotionGroups',
      'backendCandidates',
      'routingRecommendation',
      'outputContract',
      'performanceQualification',
      'qaPlan',
      'fallbackPolicy',
      'metrics',
      'authorityBoundary',
      'containsExecutableCodeCommandsPathsUrlsOrCredentials',
      'containsRawChatTranscriptOrMediaBytes',
      'externalRuntimeExecutionAuthorized',
      'toolRegistryMutationRequested',
      'currentSourceLineageRevalidationStillRequired',
      'canonicalWorkAssetAndReviewAdmissionStillRequired',
      'planDigestSha256',
    ])) return false
    const plan = value as unknown as LivingFrameRiggingV2Plan
    const { planDigestSha256, ...draft } = plan
    if (
      !SHA256.test(planDigestSha256)
      || planDigestSha256 !== sha256AuthorityValue(draft)
      || plan.contractVersion !== LIVING_FRAME_RIGGING_V2_VERSION
      || plan.riggingProfile !== LIVING_FRAME_RIGGING_V2_PROFILE
      || plan.planClass !== LIVING_FRAME_RIGGING_V2_CLASS
      || !validateSourceBindings(plan.sourceBindings)
      || !LIVING_FRAME_RIGGING_V2_MODES.includes(plan.rigMode)
      || !validateOrdered(plan.partBindings, partSchema)
      || !validateOrdered(plan.bones, boneSchema)
      || !validateOrdered(plan.joints, jointSchema)
      || !validateOrdered(plan.controls, controlSchema)
      || !validateOrdered(plan.constraints, constraintSchema)
      || !validateOrdered(plan.ikChains, ikChainSchema)
      || !validateOrdered(plan.meshBindings, meshSchema)
      || !validateOrdered(plan.mechanicalLinkages, linkageSchema)
      || !validateOrdered(
        plan.secondaryMotionGroups,
        secondaryMotionSchema,
      )
      || !validateCapabilityList(plan.requiredCapabilities)
      || !validateBackendCandidates(
        plan.backendCandidates,
        plan.requiredCapabilities,
      )
      || !validateRoutingRecommendation(
        plan.routingRecommendation,
        plan.rigMode,
        plan.requiredCapabilities,
        plan.backendCandidates,
      )
      || !validateOutputContract(plan)
      || !validatePerformanceQualification(plan)
      || !validateQaPlan(plan)
      || stableAuthorityStringify(plan.fallbackPolicy)
        !== stableAuthorityStringify(FALLBACK_POLICY)
      || !validateMetrics(plan)
      || stableAuthorityStringify(plan.authorityBoundary)
        !== stableAuthorityStringify(AUTHORITY_BOUNDARY)
      || plan.containsExecutableCodeCommandsPathsUrlsOrCredentials !== false
      || plan.containsRawChatTranscriptOrMediaBytes !== false
      || plan.externalRuntimeExecutionAuthorized !== false
      || plan.toolRegistryMutationRequested !== false
      || plan.currentSourceLineageRevalidationStillRequired !== true
      || plan.canonicalWorkAssetAndReviewAdmissionStillRequired !== true
    ) return false
    assertStandaloneRigDefinition(plan)
    return stableAuthorityStringify(
      deriveCapabilitiesFromPlan(plan),
    ) === stableAuthorityStringify(plan.requiredCapabilities)
  } catch {
    return false
  }
}

function assertSourceLineage(
  input: z.infer<typeof compileInputSchema>,
): void {
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
    || input.riggingDirection.sourceBindings.geometryBundleDigestSha256
      !== geometry.bundleDigestSha256
    || input.riggingDirection.sourceBindings.motionBundleDigestSha256
      !== motion.bundleDigestSha256
    || input.riggingDirection.sourceBindings.componentRigDigestSha256
      !== rig.rigDigestSha256
    || input.riggingDirection.sourceBindings.sceneId
      !== rig.sourceBindings.sceneId
    || input.riggingDirection.sourceBindings.outputFrameDigestSha256
      !== rig.sourceBindings.outputFrameDigestSha256
    || input.riggingDirection.sourceBindings.masterTimingPlanDigestSha256
      !== rig.sourceBindings.masterTimingPlanDigestSha256
  ) {
    throw new Error('Living Frame Rigging v2 source lineage is inconsistent.')
  }
}

function assertRigDefinition(
  input: z.infer<typeof compileInputSchema>,
): void {
  const visualNodes = input.componentRig.nodes.filter(
    (node) => node.nodeKind !== 'virtual_camera',
  )
  const visualComponentIds = new Set(
    visualNodes.map((node) => node.componentId),
  )
  const motionTrackOwner = new Map<string, string>()
  for (const node of visualNodes) {
    for (const track of node.motionTracks) {
      motionTrackOwner.set(track.trackId, node.componentId)
    }
  }
  assertUniqueOrdered(
    input.partBindings,
    (part) => part.partId,
    'part',
  )
  if (
    input.partBindings.length !== visualNodes.length
    || input.partBindings.some((part) =>
      !visualComponentIds.has(part.componentId))
    || new Set(input.partBindings.map((part) => part.componentId)).size
      !== visualNodes.length
  ) {
    throw new Error(
      'Living Frame Rigging v2 parts must cover each visual component once.',
    )
  }
  for (const part of input.partBindings) {
    if (
      (part.partProposalConfidence < 0.9
        || part.occludedAreaReconstructionRequired)
      && !part.manualPartReviewRequired
    ) {
      throw new Error(
        'Living Frame Rigging v2 uncertain or reconstructed parts require review.',
      )
    }
    if (
      part.deformable
      !== ['deformable_part', 'secondary_motion_part'].includes(part.partRole)
    ) {
      throw new Error(
        'Living Frame Rigging v2 deformable part role is inconsistent.',
      )
    }
  }
  assertUniqueOrdered(input.bones, (bone) => bone.boneId, 'bone')
  assertUniqueOrdered(input.joints, (joint) => joint.jointId, 'joint')
  assertUniqueOrdered(
    input.controls,
    (control) => control.controlId,
    'control',
  )
  assertUniqueOrdered(
    input.constraints,
    (constraint) => constraint.constraintId,
    'constraint',
  )
  assertUniqueOrdered(input.ikChains, (chain) => chain.chainId, 'IK chain')
  assertUniqueOrdered(input.meshBindings, (mesh) => mesh.meshId, 'mesh')
  assertUniqueOrdered(
    input.mechanicalLinkages,
    (linkage) => linkage.linkageId,
    'mechanical linkage',
  )
  assertUniqueOrdered(
    input.secondaryMotionGroups,
    (group) => group.groupId,
    'secondary-motion group',
  )
  const partByComponent = new Map(
    input.partBindings.map((part) => [part.componentId, part]),
  )
  const partIds = new Set(input.partBindings.map((part) => part.partId))
  const boneById = new Map(input.bones.map((bone) => [bone.boneId, bone]))
  const jointBoneIds = new Set<string>()
  for (const bone of input.bones) {
    const part = partByComponent.get(bone.componentId)
    if (!part || (bone.deformComponent && !part.deformable)) {
      throw new Error('Living Frame Rigging v2 bone part binding is invalid.')
    }
    if (
      bone.parentBoneId !== null
      && !boneById.has(bone.parentBoneId)
    ) {
      throw new Error('Living Frame Rigging v2 bone parent is missing.')
    }
    const measuredLength = Math.hypot(
      bone.tail.x - bone.head.x,
      bone.tail.y - bone.head.y,
    )
    if (
      measuredLength === 0
      || Math.abs(measuredLength - bone.restLengthNormalized) > 0.000_001
    ) {
      throw new Error(
        'Living Frame Rigging v2 bone rest length is inconsistent.',
      )
    }
  }
  assertBoneAcyclic(input.bones)
  for (const joint of input.joints) {
    if (
      !boneById.has(joint.boneId)
      || jointBoneIds.has(joint.boneId)
      || joint.minimumAngleDegrees > joint.restAngleDegrees
      || joint.restAngleDegrees > joint.maximumAngleDegrees
    ) {
      throw new Error('Living Frame Rigging v2 joint definition is invalid.')
    }
    jointBoneIds.add(joint.boneId)
  }
  const controlById = new Map(
    input.controls.map((control) => [control.controlId, control]),
  )
  for (const control of input.controls) {
    if (
      control.targetBoneId !== null
      && !boneById.has(control.targetBoneId)
    ) {
      throw new Error('Living Frame Rigging v2 control target is missing.')
    }
  }
  const availableRefs = new Set([
    ...visualComponentIds,
    ...boneById.keys(),
    ...controlById.keys(),
  ])
  for (const constraint of input.constraints) {
    if (
      !availableRefs.has(constraint.sourceRefId)
      || !availableRefs.has(constraint.targetRefId)
      || constraint.sourceRefId === constraint.targetRefId
      || (
        constraint.minimumValue !== null
        && constraint.maximumValue !== null
        && constraint.minimumValue > constraint.maximumValue
      )
    ) {
      throw new Error(
        'Living Frame Rigging v2 constraint reference is invalid.',
      )
    }
  }
  for (const chain of input.ikChains) {
    const target = controlById.get(chain.targetControlId)
    const pole = chain.poleControlId === null
      ? null
      : controlById.get(chain.poleControlId)
    if (
      !boneById.has(chain.rootBoneId)
      || !boneById.has(chain.effectorBoneId)
      || target?.kind !== 'ik_target'
      || (chain.poleControlId !== null && pole?.kind !== 'pole_target')
      || chainLengthBetween(
        boneById,
        chain.rootBoneId,
        chain.effectorBoneId,
      ) !== chain.chainLength
    ) {
      throw new Error('Living Frame Rigging v2 IK chain is invalid.')
    }
  }
  const meshComponents = new Set<string>()
  for (const mesh of input.meshBindings) {
    const part = partByComponent.get(mesh.componentId)
    if (
      !part?.deformable
      || meshComponents.has(mesh.componentId)
      || (
        mesh.topology === 'skinned_plane_2_5d'
        && mesh.weightMapArtifactRef === null
      )
    ) {
      throw new Error(
        'Living Frame Rigging v2 mesh binding is invalid.',
      )
    }
    meshComponents.add(mesh.componentId)
  }
  for (const linkage of input.mechanicalLinkages) {
    if (
      !visualComponentIds.has(linkage.driverComponentId)
      || motionTrackOwner.get(linkage.driverMotionTrackId)
        !== linkage.driverComponentId
      || new Set(linkage.drivenComponentIds).size
        !== linkage.drivenComponentIds.length
      || linkage.drivenComponentIds.some((componentId) =>
        !visualComponentIds.has(componentId)
        || componentId === linkage.driverComponentId)
      || linkage.ratio === 0
    ) {
      throw new Error(
        'Living Frame Rigging v2 mechanical linkage is invalid.',
      )
    }
  }
  for (const group of input.secondaryMotionGroups) {
    if (
      !partIds.has(group.driverPartId)
      || new Set(group.followerPartIds).size
        !== group.followerPartIds.length
      || group.followerPartIds.some((partId) =>
        !partIds.has(partId) || partId === group.driverPartId)
    ) {
      throw new Error(
        'Living Frame Rigging v2 secondary-motion group is invalid.',
      )
    }
  }
  assertModeRequirements(input)
}

function assertModeRequirements(
  input: z.infer<typeof compileInputSchema>,
): void {
  assertModeDefinition({
    rigMode: input.rigMode,
    partBindings: input.partBindings,
    bones: input.bones,
    joints: input.joints,
    controls: input.controls,
    constraints: input.constraints,
    ikChains: input.ikChains,
    meshBindings: input.meshBindings,
    mechanicalLinkages: input.mechanicalLinkages,
    secondaryMotionGroups: input.secondaryMotionGroups,
    hasApprovedVirtualCamera: input.componentRig.nodes.some((node) =>
      node.nodeKind === 'virtual_camera'),
  })
}

interface LivingFrameRiggingModeDefinition {
  readonly rigMode: LivingFrameRiggingV2Mode
  readonly partBindings: readonly LivingFrameRiggingV2PartBinding[]
  readonly bones: readonly LivingFrameRiggingV2Bone[]
  readonly joints: readonly LivingFrameRiggingV2Joint[]
  readonly controls: readonly LivingFrameRiggingV2Control[]
  readonly constraints: readonly LivingFrameRiggingV2Constraint[]
  readonly ikChains: readonly LivingFrameRiggingV2IkChain[]
  readonly meshBindings: readonly LivingFrameRiggingV2MeshBinding[]
  readonly mechanicalLinkages:
    readonly LivingFrameRiggingV2MechanicalLinkage[]
  readonly secondaryMotionGroups:
    readonly LivingFrameRiggingV2SecondaryMotionGroup[]
  readonly hasApprovedVirtualCamera: boolean
}

function assertModeDefinition(
  value: LivingFrameRiggingModeDefinition,
): void {
  const skeletalCounts = value.bones.length
    + value.joints.length
    + value.controls.length
    + value.constraints.length
    + value.ikChains.length
    + value.meshBindings.length
  if (
    value.rigMode === 'native_rigid_transform'
    && (
      skeletalCounts !== 0
      || value.mechanicalLinkages.length !== 0
      || value.secondaryMotionGroups.length !== 0
    )
  ) {
    throw new Error(
      'Living Frame Rigging v2 rigid mode contains non-rigid rig data.',
    )
  }
  if (
    value.rigMode === 'native_hierarchical_cutout'
    && (
      skeletalCounts !== 0
      || value.mechanicalLinkages.length !== 0
    )
  ) {
    throw new Error(
      'Living Frame Rigging v2 cutout mode contains advanced rig data.',
    )
  }
  if (
    value.rigMode === 'mechanical_linkage'
    && (
      value.mechanicalLinkages.length < 1
      || skeletalCounts !== 0
    )
  ) {
    throw new Error(
      'Living Frame Rigging v2 mechanical mode is invalid.',
    )
  }
  if (value.rigMode === 'mechanical_linkage') {
    const partByComponent = new Map(
      value.partBindings.map((part) => [part.componentId, part]),
    )
    for (const linkage of value.mechanicalLinkages) {
      if (
        partByComponent.get(linkage.driverComponentId)?.partRole
          !== 'mechanical_driver'
        || linkage.drivenComponentIds.some((componentId) =>
          partByComponent.get(componentId)?.partRole
            !== 'mechanical_follower')
      ) {
        throw new Error(
          'Living Frame Rigging v2 mechanical part roles are invalid.',
        )
      }
    }
  }
  if (
    ['deformable_2d_character', 'armature_2_5d_character'].includes(
      value.rigMode,
    )
    && (
      value.bones.length < 1
      || value.joints.length < 1
      || value.meshBindings.length < 1
    )
  ) {
    throw new Error(
      'Living Frame Rigging v2 deformable mode requires bones, joints, and meshes.',
    )
  }
  if (
    value.rigMode === 'deformable_2d_character'
    && value.meshBindings.some((mesh) =>
      mesh.topology !== 'triangulated_2d')
  ) {
    throw new Error(
      'Living Frame Rigging v2 flat 2D mode requires triangular meshes.',
    )
  }
  if (
    value.rigMode === 'armature_2_5d_character'
    && (
      !value.hasApprovedVirtualCamera
      || value.meshBindings.some((mesh) =>
        mesh.topology !== 'skinned_plane_2_5d'
        || mesh.weightMapArtifactRef === null)
    )
  ) {
    throw new Error(
      'Living Frame Rigging v2 2.5D mode requires skinned meshes and the approved virtual camera.',
    )
  }
}

function deriveRequiredCapabilities(
  input: z.infer<typeof compileInputSchema>,
): LivingFrameRiggingV2Capability[] {
  const capabilities = new Set<LivingFrameRiggingV2Capability>([
    'rigid_transform',
    'parent_hierarchy',
    'transparent_layer_output',
  ])
  if (input.bones.length > 0) capabilities.add('bone_chain')
  if (input.joints.length > 0) capabilities.add('joint_limits')
  if (input.ikChains.length > 0) capabilities.add('inverse_kinematics')
  if (input.meshBindings.length > 0) capabilities.add('mesh_deformation')
  if (input.meshBindings.some((mesh) =>
    mesh.weightMapArtifactRef !== null)) capabilities.add('skin_weights')
  if (input.meshBindings.some((mesh) =>
    mesh.rigidityMapArtifactRef !== null)) capabilities.add('rigidity_map')
  if (input.meshBindings.some((mesh) =>
    mesh.animatedStackingOrderRequired)) capabilities.add('stacking_order')
  if (input.mechanicalLinkages.length > 0) {
    capabilities.add('mechanical_linkage')
  }
  if (input.secondaryMotionGroups.length > 0) {
    capabilities.add('secondary_motion')
  }
  if (input.rigMode === 'armature_2_5d_character') {
    capabilities.add('depth_camera')
  }
  return LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter((capability) =>
    capabilities.has(capability))
}

function compileBackendCandidates(
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
): LivingFrameRiggingV2BackendCandidate[] {
  return [
    compileBackendCandidate(
      0,
      'candidate.native-remotion',
      'reeditpro_native_remotion',
      NATIVE_CAPABILITIES,
      'native_deterministic_transform_and_cutout',
      false,
      requiredCapabilities,
    ),
    compileBackendCandidate(
      1,
      'candidate.blender-headless',
      'blender_headless_candidate',
      BLENDER_CAPABILITIES,
      'advanced_armature_ik_skinning_and_2_5d',
      true,
      requiredCapabilities,
    ),
    compileBackendCandidate(
      2,
      'candidate.opentoonz-plastic',
      'opentoonz_plastic_candidate',
      OPENTOONZ_CAPABILITIES,
      'specialized_flat_2d_plastic_deformation',
      true,
      requiredCapabilities,
    ),
  ]
}

function compileBackendCandidate(
  order: number,
  candidateId: string,
  backend: LivingFrameRiggingV2Backend,
  supportedCapabilities: readonly LivingFrameRiggingV2Capability[],
  purpose: LivingFrameRiggingV2BackendCandidate['purpose'],
  benchmarkRequiredBeforeRuntimeSelection: boolean,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
): LivingFrameRiggingV2BackendCandidate {
  const unsupportedRequiredCapabilities = requiredCapabilities.filter(
    (capability) => !supportedCapabilities.includes(capability),
  )
  return {
    order,
    candidateId,
    backend,
    disposition: unsupportedRequiredCapabilities.length > 0
      ? 'incompatible'
      : backend === 'reeditpro_native_remotion'
        ? 'selected_native'
        : 'evaluation_candidate',
    supportedCapabilities: [...supportedCapabilities],
    unsupportedRequiredCapabilities,
    purpose,
    benchmarkRequiredBeforeRuntimeSelection,
    toolIdentityCreationAuthority: false,
    operationRegistrationAuthority: false,
    runtimeExecutionAuthority: false,
    productionAuthority: false,
  }
}

function compileRoutingRecommendation(
  rigMode: LivingFrameRiggingV2Mode,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
  candidates: readonly LivingFrameRiggingV2BackendCandidate[],
): LivingFrameRiggingV2RoutingRecommendation {
  const native = candidate(candidates, 'reeditpro_native_remotion')
  if (native.unsupportedRequiredCapabilities.length === 0) {
    return {
      recommendedBackend: 'reeditpro_native_remotion',
      recommendationReason: 'native_capabilities_sufficient',
      externalBackendStillEvaluationOnly: false,
      runtimeSelectionStillRequired: false,
      remotionOwnsFinalCanvas: true,
    }
  }
  const openToonz = candidate(candidates, 'opentoonz_plastic_candidate')
  if (
    rigMode === 'deformable_2d_character'
    && openToonz.unsupportedRequiredCapabilities.length === 0
    && !requiredCapabilities.includes('inverse_kinematics')
    && !requiredCapabilities.includes('depth_camera')
  ) {
    return {
      recommendedBackend: 'opentoonz_plastic_candidate',
      recommendationReason: 'flat_2d_mesh_deformation_candidate',
      externalBackendStillEvaluationOnly: true,
      runtimeSelectionStillRequired: true,
      remotionOwnsFinalCanvas: true,
    }
  }
  const blender = candidate(candidates, 'blender_headless_candidate')
  if (blender.unsupportedRequiredCapabilities.length !== 0) {
    throw new Error('Living Frame Rigging v2 has no compatible backend.')
  }
  return {
    recommendedBackend: 'blender_headless_candidate',
    recommendationReason: 'advanced_armature_or_2_5d_candidate',
    externalBackendStillEvaluationOnly: true,
    runtimeSelectionStillRequired: true,
    remotionOwnsFinalCanvas: true,
  }
}

function assertDirectionCompatibility(
  input: z.infer<typeof compileInputSchema>,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
  routing: LivingFrameRiggingV2RoutingRecommendation,
): void {
  const direction = input.riggingDirection
  if (
    direction.designDecision.rigMode !== input.rigMode
    || stableAuthorityStringify(
      direction.designDecision.requiredCapabilities,
    ) !== stableAuthorityStringify(requiredCapabilities)
    || direction.designDecision.recommendedBackend
      !== routing.recommendedBackend
    || direction.designDecision.transparentComponentOutputRequired
      !== (
        routing.recommendedBackend !== 'reeditpro_native_remotion'
      )
    || direction.narrativeDecision.primaryFocalComponentId
      !== input.componentRig.nodes.find((node) =>
        node.focalRole === 'primary')?.componentId
  ) {
    throw new Error(
      'Living Frame Rigging v2 Head Intelligence direction is inconsistent.',
    )
  }
  const manualPartReviewRequired = input.partBindings.some((part) =>
    part.manualPartReviewRequired)
  if (
    manualPartReviewRequired
    && !direction.riskDecision.manualRigReviewRequired
  ) {
    throw new Error(
      'Living Frame Rigging v2 required manual review was not directed.',
    )
  }
}

function compileSourceBindings(
  input: z.infer<typeof compileInputSchema>,
): LivingFrameRiggingV2SourceBindings {
  return {
    sceneId: input.componentRig.sourceBindings.sceneId,
    outputFrameId: input.componentRig.sourceBindings.outputFrameId,
    outputFrameDigestSha256:
      input.componentRig.sourceBindings.outputFrameDigestSha256,
    masterTimingPlanId:
      input.componentRig.sourceBindings.masterTimingPlanId,
    masterTimingPlanDigestSha256:
      input.componentRig.sourceBindings.masterTimingPlanDigestSha256,
    geometryBundleVersion: LIVING_FRAME_COMPONENT_GEOMETRY_VERSION,
    geometryBundleDigestSha256: input.geometryBundle.bundleDigestSha256,
    motionBundleVersion: LIVING_FRAME_DETERMINISTIC_MOTION_VERSION,
    motionBundleDigestSha256: input.motionBundle.bundleDigestSha256,
    componentRigVersion: LIVING_FRAME_COMPONENT_RIG_VERSION,
    componentRigDigestSha256: input.componentRig.rigDigestSha256,
    riggingDirectionVersion: LIVING_FRAME_RIGGING_DIRECTION_VERSION,
    riggingDirectionDigestSha256:
      input.riggingDirection.directionDigestSha256,
  }
}

function compilePerformanceQualification(
  routing: LivingFrameRiggingV2RoutingRecommendation,
): LivingFrameRiggingV2PerformanceQualification {
  return {
    state: routing.recommendedBackend === 'reeditpro_native_remotion'
      ? 'bounded_native_fixture_evidence_only'
      : 'internal_benchmark_required',
    latencyClaimAllowed: false,
    requiredMeasurements: REQUIRED_PERFORMANCE_MEASUREMENTS,
    exactRigDigestCacheKeyRequired: true,
    lowResolutionBlockingPreviewRequiredForExternalRuntime:
      routing.recommendedBackend !== 'reeditpro_native_remotion',
    sceneOnlyExecutionRequired: true,
    unrelatedEditChangeMayInvalidateRigCache: false,
  }
}

function compileQaPlan(
  input: z.infer<typeof compileInputSchema>,
  capabilities: readonly LivingFrameRiggingV2Capability[],
): LivingFrameRiggingV2QaPlan {
  return {
    partBoundaryQaRequired: true,
    pivotAndJointQaRequired: true,
    jointLimitQaRequired: input.joints.length > 0,
    skinWeightQaRequired: capabilities.includes('skin_weights'),
    meshFoldoverQaRequired: capabilities.includes('mesh_deformation'),
    ikConvergenceQaRequired: capabilities.includes('inverse_kinematics'),
    mechanicalLinkageQaRequired:
      capabilities.includes('mechanical_linkage'),
    secondaryMotionQaRequired:
      capabilities.includes('secondary_motion'),
    temporalJitterQaRequired: true,
    alphaEdgeQaRequired: true,
    depthAndOcclusionQaRequired: capabilities.includes('depth_camera'),
    outputFrameQaRequired: true,
    captionAndProtectedRegionQaRequired: true,
    sourceLineageQaRequired: true,
    performanceBenchmarkQaRequired:
      capabilities.some((capability) =>
        !NATIVE_CAPABILITIES.includes(
          capability as typeof NATIVE_CAPABILITIES[number],
        )),
  }
}

function compileMetrics(
  input: z.infer<typeof compileInputSchema>,
  capabilities: readonly LivingFrameRiggingV2Capability[],
): LivingFrameRiggingV2Metrics {
  return {
    partCount: input.partBindings.length,
    deformablePartCount:
      input.partBindings.filter((part) => part.deformable).length,
    boneCount: input.bones.length,
    jointCount: input.joints.length,
    controlCount: input.controls.length,
    constraintCount: input.constraints.length,
    ikChainCount: input.ikChains.length,
    meshCount: input.meshBindings.length,
    mechanicalLinkageCount: input.mechanicalLinkages.length,
    secondaryMotionGroupCount: input.secondaryMotionGroups.length,
    manualPartReviewCount:
      input.partBindings.filter((part) =>
        part.manualPartReviewRequired).length,
    requiredCapabilityCount: capabilities.length,
  }
}

function validateSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'sceneId',
    'outputFrameId',
    'outputFrameDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'geometryBundleVersion',
    'geometryBundleDigestSha256',
    'motionBundleVersion',
    'motionBundleDigestSha256',
    'componentRigVersion',
    'componentRigDigestSha256',
    'riggingDirectionVersion',
    'riggingDirectionDigestSha256',
  ])) return false
  return SAFE_ID.test(String(value.sceneId))
    && SAFE_ID.test(String(value.outputFrameId))
    && SAFE_ID.test(String(value.masterTimingPlanId))
    && value.geometryBundleVersion === LIVING_FRAME_COMPONENT_GEOMETRY_VERSION
    && value.motionBundleVersion === LIVING_FRAME_DETERMINISTIC_MOTION_VERSION
    && value.componentRigVersion === LIVING_FRAME_COMPONENT_RIG_VERSION
    && value.riggingDirectionVersion === LIVING_FRAME_RIGGING_DIRECTION_VERSION
    && [
      value.outputFrameDigestSha256,
      value.masterTimingPlanDigestSha256,
      value.geometryBundleDigestSha256,
      value.motionBundleDigestSha256,
      value.componentRigDigestSha256,
      value.riggingDirectionDigestSha256,
    ].every((digest) => SHA256.test(String(digest)))
}

function validateCapabilityList(value: unknown): boolean {
  return Array.isArray(value)
    && value.length > 0
    && value.every((capability) =>
      typeof capability === 'string'
      && LIVING_FRAME_RIGGING_V2_CAPABILITIES.includes(
        capability as LivingFrameRiggingV2Capability,
      ))
    && new Set(value).size === value.length
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(
        LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter((capability) =>
          value.includes(capability)),
      )
}

function validateBackendCandidates(
  value: unknown,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
): value is readonly LivingFrameRiggingV2BackendCandidate[] {
  if (!Array.isArray(value) || value.length !== 3) return false
  const expected = compileBackendCandidates(requiredCapabilities)
  return stableAuthorityStringify(value) === stableAuthorityStringify(expected)
}

function validateRoutingRecommendation(
  value: unknown,
  rigMode: LivingFrameRiggingV2Mode,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
  candidates: readonly LivingFrameRiggingV2BackendCandidate[],
): value is LivingFrameRiggingV2RoutingRecommendation {
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(
      compileRoutingRecommendation(rigMode, requiredCapabilities, candidates),
    )
}

function validateOutputContract(plan: LivingFrameRiggingV2Plan): boolean {
  const value = plan.outputContract
  if (!isRecord(value) || !hasExactKeys(value, [
    'outputMode',
    'widthPixels',
    'heightPixels',
    'startFrame',
    'endFrameExclusive',
    'outputContainsOnlyApprovedComponentLayers',
    'outputMayClaimFinalCanvas',
    'transparentAlphaRequired',
    'depthPassRequired',
    'maskPassRequired',
    'remotionOwnsFinalComposition',
  ])) return false
  const external = plan.routingRecommendation.recommendedBackend
    !== 'reeditpro_native_remotion'
  const depth = plan.requiredCapabilities.includes('depth_camera')
  const mesh = plan.requiredCapabilities.includes('mesh_deformation')
  return Number.isInteger(value.widthPixels)
    && Number(value.widthPixels) > 0
    && Number.isInteger(value.heightPixels)
    && Number(value.heightPixels) > 0
    && Number.isInteger(value.startFrame)
    && Number.isInteger(value.endFrameExclusive)
    && Number(value.endFrameExclusive) > Number(value.startFrame)
    && value.outputMode === (
      external
        ? depth
          ? 'transparent_rgba_component_sequence_with_depth_and_mask'
          : 'transparent_rgba_component_sequence'
        : 'native_transform_spec_json'
    )
    && value.outputContainsOnlyApprovedComponentLayers === true
    && value.outputMayClaimFinalCanvas === false
    && value.transparentAlphaRequired === external
    && value.depthPassRequired === depth
    && value.maskPassRequired === (depth || mesh)
    && value.remotionOwnsFinalComposition === true
}

function validatePerformanceQualification(
  plan: LivingFrameRiggingV2Plan,
): boolean {
  const expected = compilePerformanceQualification(
    plan.routingRecommendation,
  )
  return stableAuthorityStringify(plan.performanceQualification)
    === stableAuthorityStringify(expected)
}

function validateQaPlan(plan: LivingFrameRiggingV2Plan): boolean {
  const capabilities = plan.requiredCapabilities
  const expected: LivingFrameRiggingV2QaPlan = {
    partBoundaryQaRequired: true,
    pivotAndJointQaRequired: true,
    jointLimitQaRequired: plan.joints.length > 0,
    skinWeightQaRequired: capabilities.includes('skin_weights'),
    meshFoldoverQaRequired: capabilities.includes('mesh_deformation'),
    ikConvergenceQaRequired: capabilities.includes('inverse_kinematics'),
    mechanicalLinkageQaRequired:
      capabilities.includes('mechanical_linkage'),
    secondaryMotionQaRequired:
      capabilities.includes('secondary_motion'),
    temporalJitterQaRequired: true,
    alphaEdgeQaRequired: true,
    depthAndOcclusionQaRequired: capabilities.includes('depth_camera'),
    outputFrameQaRequired: true,
    captionAndProtectedRegionQaRequired: true,
    sourceLineageQaRequired: true,
    performanceBenchmarkQaRequired:
      plan.routingRecommendation.recommendedBackend
        !== 'reeditpro_native_remotion',
  }
  return stableAuthorityStringify(plan.qaPlan)
    === stableAuthorityStringify(expected)
}

function validateMetrics(plan: LivingFrameRiggingV2Plan): boolean {
  const expected: LivingFrameRiggingV2Metrics = {
    partCount: plan.partBindings.length,
    deformablePartCount:
      plan.partBindings.filter((part) => part.deformable).length,
    boneCount: plan.bones.length,
    jointCount: plan.joints.length,
    controlCount: plan.controls.length,
    constraintCount: plan.constraints.length,
    ikChainCount: plan.ikChains.length,
    meshCount: plan.meshBindings.length,
    mechanicalLinkageCount: plan.mechanicalLinkages.length,
    secondaryMotionGroupCount: plan.secondaryMotionGroups.length,
    manualPartReviewCount:
      plan.partBindings.filter((part) =>
        part.manualPartReviewRequired).length,
    requiredCapabilityCount: plan.requiredCapabilities.length,
  }
  return stableAuthorityStringify(plan.metrics)
    === stableAuthorityStringify(expected)
}

function assertStandaloneRigDefinition(plan: LivingFrameRiggingV2Plan): void {
  if (
    plan.partBindings.length < 1
    || plan.partBindings.length > MAX_PARTS
    || plan.bones.length > MAX_BONES
    || plan.joints.length > MAX_BONES
    || plan.controls.length > MAX_BONES
    || plan.constraints.length > MAX_CONSTRAINTS
    || plan.ikChains.length > MAX_BONES
    || plan.meshBindings.length > MAX_PARTS
    || plan.mechanicalLinkages.length > MAX_PARTS
    || plan.secondaryMotionGroups.length > MAX_PARTS
  ) {
    throw new Error(
      'Living Frame Rigging v2 standalone collection bounds are invalid.',
    )
  }
  assertUniqueOrdered(plan.partBindings, (part) => part.partId, 'part')
  assertUniqueOrdered(plan.bones, (bone) => bone.boneId, 'bone')
  assertUniqueOrdered(plan.joints, (joint) => joint.jointId, 'joint')
  assertUniqueOrdered(
    plan.controls,
    (control) => control.controlId,
    'control',
  )
  assertUniqueOrdered(
    plan.constraints,
    (constraint) => constraint.constraintId,
    'constraint',
  )
  assertUniqueOrdered(
    plan.ikChains,
    (chain) => chain.chainId,
    'IK chain',
  )
  assertUniqueOrdered(plan.meshBindings, (mesh) => mesh.meshId, 'mesh')
  assertUniqueOrdered(
    plan.mechanicalLinkages,
    (linkage) => linkage.linkageId,
    'mechanical linkage',
  )
  assertUniqueOrdered(
    plan.secondaryMotionGroups,
    (group) => group.groupId,
    'secondary-motion group',
  )
  const partByComponent = new Map(
    plan.partBindings.map((part) => [part.componentId, part]),
  )
  if (partByComponent.size !== plan.partBindings.length) {
    throw new Error(
      'Living Frame Rigging v2 part component bindings are duplicated.',
    )
  }
  for (const part of plan.partBindings) {
    if (
      (
        part.partProposalConfidence < 0.9
        || part.occludedAreaReconstructionRequired
      )
      && !part.manualPartReviewRequired
    ) {
      throw new Error(
        'Living Frame Rigging v2 uncertain or reconstructed parts require review.',
      )
    }
    if (
      part.deformable
      !== ['deformable_part', 'secondary_motion_part'].includes(part.partRole)
    ) {
      throw new Error(
        'Living Frame Rigging v2 deformable part role is inconsistent.',
      )
    }
  }
  const boneById = new Map(plan.bones.map((bone) => [bone.boneId, bone]))
  for (const bone of plan.bones) {
    const part = partByComponent.get(bone.componentId)
    const measuredLength = Math.hypot(
      bone.tail.x - bone.head.x,
      bone.tail.y - bone.head.y,
    )
    if (
      !part
      || (bone.deformComponent && !part.deformable)
      || (
        bone.parentBoneId !== null
        && !boneById.has(bone.parentBoneId)
      )
      || measuredLength === 0
      || Math.abs(measuredLength - bone.restLengthNormalized) > 0.000_001
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone bone definition is invalid.',
      )
    }
  }
  assertBoneAcyclic(plan.bones)
  const jointBoneIds = new Set<string>()
  for (const joint of plan.joints) {
    if (
      !boneById.has(joint.boneId)
      || jointBoneIds.has(joint.boneId)
      || joint.minimumAngleDegrees > joint.restAngleDegrees
      || joint.restAngleDegrees > joint.maximumAngleDegrees
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone joint definition is invalid.',
      )
    }
    jointBoneIds.add(joint.boneId)
  }
  const controlById = new Map(
    plan.controls.map((control) => [control.controlId, control]),
  )
  for (const control of plan.controls) {
    if (
      control.targetBoneId !== null
      && !boneById.has(control.targetBoneId)
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone control target is invalid.',
      )
    }
  }
  const componentIds = new Set(partByComponent.keys())
  const availableRefs = new Set([
    ...componentIds,
    ...boneById.keys(),
    ...controlById.keys(),
  ])
  for (const constraint of plan.constraints) {
    if (
      !availableRefs.has(constraint.sourceRefId)
      || !availableRefs.has(constraint.targetRefId)
      || constraint.sourceRefId === constraint.targetRefId
      || (
        constraint.minimumValue !== null
        && constraint.maximumValue !== null
        && constraint.minimumValue > constraint.maximumValue
      )
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone constraint is invalid.',
      )
    }
  }
  for (const chain of plan.ikChains) {
    const target = controlById.get(chain.targetControlId)
    const pole = chain.poleControlId === null
      ? null
      : controlById.get(chain.poleControlId)
    if (
      !boneById.has(chain.rootBoneId)
      || !boneById.has(chain.effectorBoneId)
      || target?.kind !== 'ik_target'
      || (chain.poleControlId !== null && pole?.kind !== 'pole_target')
      || chainLengthBetween(
        boneById,
        chain.rootBoneId,
        chain.effectorBoneId,
      ) !== chain.chainLength
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone IK chain is invalid.',
      )
    }
  }
  const meshComponents = new Set<string>()
  for (const mesh of plan.meshBindings) {
    const part = partByComponent.get(mesh.componentId)
    if (
      !part?.deformable
      || meshComponents.has(mesh.componentId)
      || (
        mesh.topology === 'skinned_plane_2_5d'
        && mesh.weightMapArtifactRef === null
      )
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone mesh binding is invalid.',
      )
    }
    meshComponents.add(mesh.componentId)
  }
  for (const linkage of plan.mechanicalLinkages) {
    if (
      !componentIds.has(linkage.driverComponentId)
      || new Set(linkage.drivenComponentIds).size
        !== linkage.drivenComponentIds.length
      || linkage.drivenComponentIds.some((componentId) =>
        !componentIds.has(componentId)
        || componentId === linkage.driverComponentId)
      || linkage.ratio === 0
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone mechanical linkage is invalid.',
      )
    }
  }
  const partIds = new Set(plan.partBindings.map((part) => part.partId))
  for (const group of plan.secondaryMotionGroups) {
    if (
      !partIds.has(group.driverPartId)
      || new Set(group.followerPartIds).size
        !== group.followerPartIds.length
      || group.followerPartIds.some((partId) =>
        !partIds.has(partId) || partId === group.driverPartId)
    ) {
      throw new Error(
        'Living Frame Rigging v2 standalone secondary motion is invalid.',
      )
    }
  }
  assertModeDefinition({
    rigMode: plan.rigMode,
    partBindings: plan.partBindings,
    bones: plan.bones,
    joints: plan.joints,
    controls: plan.controls,
    constraints: plan.constraints,
    ikChains: plan.ikChains,
    meshBindings: plan.meshBindings,
    mechanicalLinkages: plan.mechanicalLinkages,
    secondaryMotionGroups: plan.secondaryMotionGroups,
    hasApprovedVirtualCamera:
      plan.rigMode !== 'armature_2_5d_character'
      || plan.requiredCapabilities.includes('depth_camera'),
  })
}

function deriveCapabilitiesFromPlan(
  plan: LivingFrameRiggingV2Plan,
): LivingFrameRiggingV2Capability[] {
  const capabilities = new Set<LivingFrameRiggingV2Capability>([
    'rigid_transform',
    'parent_hierarchy',
    'transparent_layer_output',
  ])
  if (plan.bones.length > 0) capabilities.add('bone_chain')
  if (plan.joints.length > 0) capabilities.add('joint_limits')
  if (plan.ikChains.length > 0) capabilities.add('inverse_kinematics')
  if (plan.meshBindings.length > 0) capabilities.add('mesh_deformation')
  if (plan.meshBindings.some((mesh) =>
    mesh.weightMapArtifactRef !== null)) capabilities.add('skin_weights')
  if (plan.meshBindings.some((mesh) =>
    mesh.rigidityMapArtifactRef !== null)) capabilities.add('rigidity_map')
  if (plan.meshBindings.some((mesh) =>
    mesh.animatedStackingOrderRequired)) capabilities.add('stacking_order')
  if (plan.mechanicalLinkages.length > 0) {
    capabilities.add('mechanical_linkage')
  }
  if (plan.secondaryMotionGroups.length > 0) {
    capabilities.add('secondary_motion')
  }
  if (plan.rigMode === 'armature_2_5d_character') {
    capabilities.add('depth_camera')
  }
  return LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter((capability) =>
    capabilities.has(capability))
}

function validateOrdered<T extends { order: number }>(
  value: unknown,
  schema: z.ZodType<T>,
): value is readonly T[] {
  if (!Array.isArray(value)) return false
  return value.every((entry, index) =>
    schema.safeParse(entry).success && entry.order === index)
}

function assertUniqueOrdered<T extends { order: number }>(
  items: readonly T[],
  id: (item: T) => string,
  label: string,
): void {
  if (
    items.some((item, index) => item.order !== index)
    || new Set(items.map(id)).size !== items.length
  ) {
    throw new Error(
      `Living Frame Rigging v2 ${label} IDs or order are invalid.`,
    )
  }
}

function assertBoneAcyclic(
  bones: readonly LivingFrameRiggingV2Bone[],
): void {
  const byId = new Map(bones.map((bone) => [bone.boneId, bone]))
  const permanent = new Set<string>()
  const temporary = new Set<string>()
  const visit = (boneId: string): void => {
    if (permanent.has(boneId)) return
    if (temporary.has(boneId)) {
      throw new Error('Living Frame Rigging v2 bone hierarchy is cyclic.')
    }
    const bone = byId.get(boneId)
    if (!bone) {
      throw new Error('Living Frame Rigging v2 bone is missing.')
    }
    temporary.add(boneId)
    if (bone.parentBoneId !== null) visit(bone.parentBoneId)
    temporary.delete(boneId)
    permanent.add(boneId)
  }
  for (const bone of bones) visit(bone.boneId)
}

function chainLengthBetween(
  byId: ReadonlyMap<string, LivingFrameRiggingV2Bone>,
  rootBoneId: string,
  effectorBoneId: string,
): number {
  let current = byId.get(effectorBoneId)
  let count = 0
  const visited = new Set<string>()
  while (current) {
    if (visited.has(current.boneId)) return -1
    visited.add(current.boneId)
    count += 1
    if (current.boneId === rootBoneId) return count
    current = current.parentBoneId === null
      ? undefined
      : byId.get(current.parentBoneId)
  }
  return -1
}

function candidate(
  candidates: readonly LivingFrameRiggingV2BackendCandidate[],
  backend: LivingFrameRiggingV2Backend,
): LivingFrameRiggingV2BackendCandidate {
  const value = candidates.find((item) => item.backend === backend)
  if (!value) {
    throw new Error('Living Frame Rigging v2 backend candidate is missing.')
  }
  return value
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

export type {
  LivingFrameRiggingV2ArtifactRef,
}
