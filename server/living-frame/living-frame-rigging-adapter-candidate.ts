import { z } from 'zod'

import type {
  LivingFrameRiggingAdapterCandidateAuthorityBoundary,
  LivingFrameRiggingAdapterCandidateRequest,
  LivingFrameRiggingAdapterCandidateRequestDraft,
  LivingFrameRiggingAdapterCandidateSourceBindings,
  LivingFrameRiggingAdapterOutputSelection,
  LivingFrameRiggingAdapterQualificationPlan,
  LivingFrameRiggingFixedAdapterBinding,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import {
  LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_BACKENDS,
  LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_CLASS,
  LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_VERSION,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import type {
  LivingFrameGeometryExpectationRef,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameRiggingDirection,
} from '../../src/types/living-frame-rigging-direction'
import type {
  LivingFrameRiggingV2Plan,
} from '../../src/types/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRiggingDirection,
} from './living-frame-rigging-direction'
import {
  verifyLivingFrameRiggingV2Plan,
} from './living-frame-rigging-v2'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:+-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const expectationRefSchema = z.object({
  refId: z.string().regex(SAFE_ID),
  version: z.string().regex(SAFE_VERSION),
  digestSha256: z.string().regex(SHA256),
  currentAuthorityRevalidationRequired: z.literal(true),
}).strict()

const inputSchema = z.object({
  approvedSnapshotRef: expectationRefSchema,
  selectedSceneRef: expectationRefSchema,
  plannedWorkItemRef: expectationRefSchema,
  riggingDirection: z.custom<LivingFrameRiggingDirection>(
    verifyLivingFrameRiggingDirection,
  ),
  riggingPlan: z.custom<LivingFrameRiggingV2Plan>(
    verifyLivingFrameRiggingV2Plan,
  ),
}).strict()

const COMMON_REQUIRED_EVIDENCE =
  [
    'pinned_source_and_license_disposition',
    'signed_scanned_non_root_offline_image',
    'fixed_adapter_source_review_and_digest',
    'cold_and_warm_start_measurement',
    'rig_compile_measurement',
    'blocking_preview_measurement',
    'full_quality_component_render_measurement',
    'peak_memory_and_output_byte_measurement',
    'exact_rig_digest_cache_reuse_measurement',
    'transparent_alpha_output_evidence',
    'part_boundary_pivot_joint_and_mesh_qa',
    'temporal_jitter_and_deformation_qa',
    'private_artifact_persistence_and_reread',
    'canonical_cost_resource_receipt',
  ] as const

const BLENDER_EVIDENCE =
  [
    'background_headless_execution',
    'python_api_armature_creation',
    'bone_constraints_and_inverse_kinematics',
    'mesh_skinning_and_weight_binding',
    'transparent_component_and_depth_pass_render',
  ] as const

const OPENTOONZ_EVIDENCE =
  [
    'plastic_triangular_mesh_creation',
    'plastic_skeleton_and_angle_bounds',
    'plastic_rigidity_and_stacking_order',
    'fixed_scene_materialization',
    'batch_transparent_component_render',
  ] as const

const QUALIFICATION_PLAN:
  LivingFrameRiggingAdapterQualificationPlan = Object.freeze({
    state: 'internal_source_and_runtime_qualification_required',
    requiredEvidence: COMMON_REQUIRED_EVIDENCE,
    blenderCapabilityEvidenceRequired: BLENDER_EVIDENCE,
    openToonzCapabilityEvidenceRequired: OPENTOONZ_EVIDENCE,
    latencyClaimAllowed: false,
    internalPrivateBenchmarkOnly: true,
    candidateFailureReturnsToApprovedFallbackResolver: true,
  })

const AUTHORITY_BOUNDARY:
  LivingFrameRiggingAdapterCandidateAuthorityBoundary = Object.freeze({
    materializationCandidateOnly: true,
    toolIdentityCreationAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    approvedSnapshotAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    workerLeaseAuthority: false,
    dispatchAuthority: false,
    runtimeExecutionAuthority: false,
    assetPersistenceAuthority: false,
    assetManifestAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    qaApprovalAuthority: false,
    rendererAuthority: false,
    finalCanvasAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRiggingAdapterCandidateInput {
  readonly approvedSnapshotRef: LivingFrameGeometryExpectationRef
  readonly selectedSceneRef: LivingFrameGeometryExpectationRef
  readonly plannedWorkItemRef: LivingFrameGeometryExpectationRef
  readonly riggingDirection: LivingFrameRiggingDirection
  readonly riggingPlan: LivingFrameRiggingV2Plan
}

export function compileLivingFrameRiggingAdapterCandidate(
  rawInput: CompileLivingFrameRiggingAdapterCandidateInput,
): LivingFrameRiggingAdapterCandidateRequest {
  const input = inputSchema.parse(rawInput)
  assertCandidateLineage(input)
  const adapterBinding = compileAdapterBinding(
    input.riggingPlan.routingRecommendation.recommendedBackend,
  )
  const outputSelection = compileOutputSelection(input.riggingPlan)
  const sourceBindings = compileSourceBindings(input)
  const draft: LivingFrameRiggingAdapterCandidateRequestDraft = {
    contractVersion: LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_VERSION,
    requestClass: LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_CLASS,
    sourceBindings,
    riggingDirection: structuredClone(input.riggingDirection),
    riggingPlan: structuredClone(input.riggingPlan),
    adapterBinding,
    outputSelection,
    qualificationPlan: QUALIFICATION_PLAN,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCodeScriptCommandOrArguments: false,
    containsCallerPathsUrlsEnvironmentCredentialsOrMediaBytes: false,
    currentSnapshotSceneWorkTimingAndFrameRevalidationRequired: true,
    runtimeImageAdapterAndToolEvidenceStillRequired: true,
    canonicalAdmissionDispatchAssetCostAndReviewStillRequired: true,
  }
  return {
    ...draft,
    requestDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameRiggingAdapterCandidate(
  value: unknown,
): value is LivingFrameRiggingAdapterCandidateRequest {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'requestClass',
      'sourceBindings',
      'riggingDirection',
      'riggingPlan',
      'adapterBinding',
      'outputSelection',
      'qualificationPlan',
      'authorityBoundary',
      'containsExecutableCodeScriptCommandOrArguments',
      'containsCallerPathsUrlsEnvironmentCredentialsOrMediaBytes',
      'currentSnapshotSceneWorkTimingAndFrameRevalidationRequired',
      'runtimeImageAdapterAndToolEvidenceStillRequired',
      'canonicalAdmissionDispatchAssetCostAndReviewStillRequired',
      'requestDigestSha256',
    ])) return false
    const request =
      value as unknown as LivingFrameRiggingAdapterCandidateRequest
    const { requestDigestSha256, ...draft } = request
    if (
      !SHA256.test(requestDigestSha256)
      || requestDigestSha256 !== sha256AuthorityValue(draft)
      || request.contractVersion
        !== LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_VERSION
      || request.requestClass
        !== LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_CLASS
      || !validateSourceBindings(request.sourceBindings)
      || !verifyLivingFrameRiggingDirection(request.riggingDirection)
      || !verifyLivingFrameRiggingV2Plan(request.riggingPlan)
    ) return false
    assertCandidateLineage({
      approvedSnapshotRef: request.sourceBindings.approvedSnapshotRef,
      selectedSceneRef: request.sourceBindings.selectedSceneRef,
      plannedWorkItemRef: request.sourceBindings.plannedWorkItemRef,
      riggingDirection: request.riggingDirection,
      riggingPlan: request.riggingPlan,
    })
    return stableAuthorityStringify(request.sourceBindings)
        === stableAuthorityStringify(compileSourceBindings({
          approvedSnapshotRef: request.sourceBindings.approvedSnapshotRef,
          selectedSceneRef: request.sourceBindings.selectedSceneRef,
          plannedWorkItemRef: request.sourceBindings.plannedWorkItemRef,
          riggingDirection: request.riggingDirection,
          riggingPlan: request.riggingPlan,
        }))
      && stableAuthorityStringify(request.adapterBinding)
        === stableAuthorityStringify(compileAdapterBinding(
          request.riggingPlan.routingRecommendation.recommendedBackend,
        ))
      && stableAuthorityStringify(request.outputSelection)
        === stableAuthorityStringify(
          compileOutputSelection(request.riggingPlan),
        )
      && stableAuthorityStringify(request.qualificationPlan)
        === stableAuthorityStringify(QUALIFICATION_PLAN)
      && stableAuthorityStringify(request.authorityBoundary)
        === stableAuthorityStringify(AUTHORITY_BOUNDARY)
      && request.containsExecutableCodeScriptCommandOrArguments === false
      && request.containsCallerPathsUrlsEnvironmentCredentialsOrMediaBytes
        === false
      && request.currentSnapshotSceneWorkTimingAndFrameRevalidationRequired
        === true
      && request.runtimeImageAdapterAndToolEvidenceStillRequired === true
      && request.canonicalAdmissionDispatchAssetCostAndReviewStillRequired
        === true
  } catch {
    return false
  }
}

function assertCandidateLineage(
  input: z.infer<typeof inputSchema>,
): void {
  const plan = input.riggingPlan
  const direction = input.riggingDirection
  if (
    plan.sourceBindings.riggingDirectionDigestSha256
      !== direction.directionDigestSha256
    || plan.sourceBindings.sceneId !== direction.sourceBindings.sceneId
    || plan.sourceBindings.outputFrameId
      !== direction.sourceBindings.outputFrameId
    || plan.sourceBindings.outputFrameDigestSha256
      !== direction.sourceBindings.outputFrameDigestSha256
    || plan.sourceBindings.masterTimingPlanId
      !== direction.sourceBindings.masterTimingPlanId
    || plan.sourceBindings.masterTimingPlanDigestSha256
      !== direction.sourceBindings.masterTimingPlanDigestSha256
    || plan.routingRecommendation.externalBackendStillEvaluationOnly
      !== true
    || plan.routingRecommendation.runtimeSelectionStillRequired !== true
    || !LIVING_FRAME_RIGGING_ADAPTER_CANDIDATE_BACKENDS.includes(
      plan.routingRecommendation.recommendedBackend as never,
    )
    || plan.externalRuntimeExecutionAuthorized !== false
    || plan.outputContract.outputMayClaimFinalCanvas !== false
    || plan.outputContract.remotionOwnsFinalComposition !== true
  ) {
    throw new Error(
      'Living Frame fixed rigging adapter candidate lineage is invalid.',
    )
  }
}

function compileSourceBindings(
  input: z.infer<typeof inputSchema>,
): LivingFrameRiggingAdapterCandidateSourceBindings {
  return {
    approvedSnapshotRef: structuredClone(input.approvedSnapshotRef),
    selectedSceneRef: structuredClone(input.selectedSceneRef),
    plannedWorkItemRef: structuredClone(input.plannedWorkItemRef),
    sceneId: input.riggingPlan.sourceBindings.sceneId,
    outputFrameId: input.riggingPlan.sourceBindings.outputFrameId,
    outputFrameDigestSha256:
      input.riggingPlan.sourceBindings.outputFrameDigestSha256,
    masterTimingPlanId:
      input.riggingPlan.sourceBindings.masterTimingPlanId,
    masterTimingPlanDigestSha256:
      input.riggingPlan.sourceBindings.masterTimingPlanDigestSha256,
    riggingDirectionDigestSha256:
      input.riggingDirection.directionDigestSha256,
    riggingPlanDigestSha256: input.riggingPlan.planDigestSha256,
  }
}

function compileAdapterBinding(
  backend: LivingFrameRiggingV2Plan[
    'routingRecommendation'
  ]['recommendedBackend'],
): LivingFrameRiggingFixedAdapterBinding {
  if (backend === 'blender_headless_candidate') {
    return {
      backend,
      candidateToolId: 'blender',
      candidateOperationId:
        'tool.blender.render_living_frame_component_rig.v1',
      adapterKnowledgeProfile:
        'blender_armature_ik_skinning_2_5d_knowledge_v1',
      fixedAdapterProfile: 'server_owned_fixed_bpy_rig_adapter_v1',
      structuredInputMode: 'strict_typed_rig_plan_json',
      blenderPythonAdapterMode: 'fixed_reviewed_bpy_adapter',
      openToonzAdapterMode: 'not_applicable',
      serverDerivedAdapterSelection: true,
      callerScriptAllowed: false,
      callerCommandOrArgumentsAllowed: false,
      callerPathsUrlsEnvironmentOrCredentialsAllowed: false,
      modelGeneratedExecutableCodeAllowed: false,
      arbitraryNodesPluginsOrExtensionsAllowed: false,
      finalCanvasDelegationAllowed: false,
    }
  }
  if (backend === 'opentoonz_plastic_candidate') {
    return {
      backend,
      candidateToolId: 'opentoonz',
      candidateOperationId:
        'tool.opentoonz.render_living_frame_plastic_component_rig.v1',
      adapterKnowledgeProfile:
        'opentoonz_plastic_mesh_skeleton_knowledge_v1',
      fixedAdapterProfile:
        'server_owned_fixed_opentoonz_scene_adapter_v1',
      structuredInputMode: 'strict_typed_rig_plan_json',
      blenderPythonAdapterMode: 'not_applicable',
      openToonzAdapterMode:
        'fixed_reviewed_scene_and_batch_adapter',
      serverDerivedAdapterSelection: true,
      callerScriptAllowed: false,
      callerCommandOrArgumentsAllowed: false,
      callerPathsUrlsEnvironmentOrCredentialsAllowed: false,
      modelGeneratedExecutableCodeAllowed: false,
      arbitraryNodesPluginsOrExtensionsAllowed: false,
      finalCanvasDelegationAllowed: false,
    }
  }
  throw new Error(
    'Living Frame native rigging does not use an external adapter candidate.',
  )
}

function compileOutputSelection(
  plan: LivingFrameRiggingV2Plan,
): LivingFrameRiggingAdapterOutputSelection {
  const approvedRiggedComponentIds = plan.partBindings
    .filter((part) => part.partRole !== 'static_anchor')
    .map((part) => part.componentId)
  const excludedStaticAnchorComponentIds = plan.partBindings
    .filter((part) => part.partRole === 'static_anchor')
    .map((part) => part.componentId)
  if (
    approvedRiggedComponentIds.length < 1
    || excludedStaticAnchorComponentIds.some((componentId) =>
      approvedRiggedComponentIds.includes(componentId))
  ) {
    throw new Error(
      'Living Frame fixed adapter output component selection is invalid.',
    )
  }
  return {
    approvedRiggedComponentIds,
    excludedStaticAnchorComponentIds,
    outputLayerGrouping:
      'one_confirmed_frame_sized_transparent_sequence_per_component',
    sourceOrBackgroundPlateIncluded: false,
    fullFrameOpaqueOutputAllowed: false,
    confirmedFrameSizedTransparentCanvasRequired: true,
    alphaRequired: true,
    depthAndMaskPassesFollowRigPlan: true,
  }
}

function validateSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'approvedSnapshotRef',
    'selectedSceneRef',
    'plannedWorkItemRef',
    'sceneId',
    'outputFrameId',
    'outputFrameDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'riggingDirectionDigestSha256',
    'riggingPlanDigestSha256',
  ])) return false
  return expectationRefSchema.safeParse(value.approvedSnapshotRef).success
    && expectationRefSchema.safeParse(value.selectedSceneRef).success
    && expectationRefSchema.safeParse(value.plannedWorkItemRef).success
    && SAFE_ID.test(String(value.sceneId))
    && SAFE_ID.test(String(value.outputFrameId))
    && SAFE_ID.test(String(value.masterTimingPlanId))
    && [
      value.outputFrameDigestSha256,
      value.masterTimingPlanDigestSha256,
      value.riggingDirectionDigestSha256,
      value.riggingPlanDigestSha256,
    ].every((digest) => SHA256.test(String(digest)))
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
