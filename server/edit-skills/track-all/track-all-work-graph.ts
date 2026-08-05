import type { SkillAssignment } from '../core/skill-assignment-types'
import {
  createSkillJobRuntimeBinding,
  type SkillJobRuntimeAdapter,
  type SkillJobRuntimeAdapterResult,
  type SkillJobRuntimeBinding,
  type SkillJobRuntimeBindingRegistry,
  type SkillWorkGraphJobDefinition,
} from '../core/edit-skill-runtime-binding'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { EditSkillPublicWorkItem } from '../core/edit-skill-plugin'
import {
  trackAllAtomicWorkItemSchema,
  trackAllWorkGraphArtifactSchema,
} from './track-all-active-artifact-contracts'
import type { TrackAllPlan } from './track-all-schemas'
import { TRACK_ALL_CAPABILITY_MANIFEST } from './track-all-capability-manifest'

export const TRACK_ALL_PUBLIC_WORK_DEFINITIONS = Object.freeze({
  'track_all.plan_assignment': { operationId: 'track_all.plan_assignment.v1', workerClass: 'track_all_planning_worker', output: 'track_all_plan_v1', phase: 'plan_validation' },
  'track_all.produce_selected_target_graph': { operationId: 'tool.sam3_1.track_masklets.v2', workerClass: 'track_all_private_gpu_worker', output: 'track_graph_v2', phase: 'model_execution' },
  'track_all.produce_concept_instance_graph': { operationId: 'tool.sam3_1.track_masklets.v2', workerClass: 'track_all_private_gpu_worker', output: 'track_graph_v2', phase: 'model_execution' },
  'track_all.produce_scene_geometry_graph': { operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1', workerClass: 'track_all_geometry_worker', output: 'camera_motion_graph_v1', phase: 'geometry_analysis' },
  'track_all.track_planar_region': { operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1', workerClass: 'track_all_geometry_worker', output: 'planar_track_graph_v1', phase: 'geometry_analysis' },
  'track_all.apply_privacy_redaction': { operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1', workerClass: 'track_all_private_media_worker', output: 'tracked_redaction_result_v1', phase: 'treatment_compilation' },
  'track_all.apply_tracked_focus': { operationId: 'tool.remotion.render_approved_composition.v1', workerClass: 'track_all_private_render_worker', output: 'tracked_focus_result_v1', phase: 'treatment_compilation' },
  'track_all.prepare_tracked_reframe': { operationId: 'track_all.prepare_tracked_reframe.v1', workerClass: 'track_all_geometry_worker', output: 'tracked_reframe_result_v1', phase: 'treatment_compilation' },
  'track_all.repair_track': { operationId: 'track_all.repair_track.v1', workerClass: 'track_all_repair_worker', output: 'track_all_repair_receipt_v1', phase: 'identity_reconciliation' },
  'track_all.validate_track_graph': { operationId: 'track_all.validate_track_graph.v1', workerClass: 'track_all_qa_worker', output: 'track_all_temporal_qa_report_v1', phase: 'skill_output_qa' },
  'track_all.prepare_composition_layer': { operationId: 'track_all.prepare_composition_layer.v1', workerClass: 'track_all_handoff_worker', output: 'track_all_cross_skill_handoff_v1', phase: 'treatment_compilation' },
  'track_all.integrate_preview': { operationId: 'track_all.integrate_private_preview.v1', workerClass: 'track_all_private_render_worker', output: 'track_all_integration_qa_report_v1', phase: 'private_preview_render' },
  'track_all.no_action': { operationId: 'track_all.no_action.v1', workerClass: 'track_all_no_action_worker', output: 'track_all_result_receipt_v1', phase: 'result_projection' },
  'track_all.project_result': { operationId: 'track_all.project_result.v1', workerClass: 'track_all_result_worker', output: 'track_all_result_receipt_v1', phase: 'result_projection' },
} as const)

export type TrackAllPublicJobType = keyof typeof TRACK_ALL_PUBLIC_WORK_DEFINITIONS
export type TrackAllPublicWorkDefinition =
  (typeof TRACK_ALL_PUBLIC_WORK_DEFINITIONS)[TrackAllPublicJobType]

export const TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS: readonly SkillWorkGraphJobDefinition[] =
  Object.entries(TRACK_ALL_PUBLIC_WORK_DEFINITIONS).map(([jobType, definition]) => ({
    skillKey: 'track_all',
    skillVersion: '1.0.0',
    contractVersion: 'track_all.skill_contract.v1',
    jobType,
    operationId: definition.operationId,
    workerClass: definition.workerClass,
    expectedOutputType: definition.output,
  }))

function operationKind(definition: TrackAllPublicWorkDefinition) {
  return definition.operationId === 'track_all.no_action.v1'
    ? 'no_action' as const
    : definition.operationId.startsWith('tool.')
      ? 'tool' as const
      : 'internal' as const
}

function internalAdapter(
  jobType: TrackAllPublicJobType,
  definition: TrackAllPublicWorkDefinition,
): SkillJobRuntimeAdapter {
  return async (input) => {
    if (
      input.mode !== 'internal_qualification_adapter' ||
      input.environmentClass !== 'internal_fixture' ||
      input.binding.adapterClass !== 'internal_qualification_adapter' ||
      input.binding.jobType !== jobType ||
      input.binding.operationId !== definition.operationId ||
      input.binding.workerClass !== definition.workerClass ||
      input.authorizedPhase !== definition.phase ||
      hashSkillValue(input.inputArtifactTypes) !==
        hashSkillValue(input.binding.inputArtifactTypes)
    ) throw new Error(`Track All runtime adapter ${jobType} rejected unbound fixture work.`)
    return {
      status: 'succeeded',
      outputArtifactTypes: input.binding.outputArtifactTypes,
      evidenceHashes: [hashSkillValue({
        schemaVersion: 'track_all_runtime_binding_fixture_evidence_v1',
        bindingHash: input.binding.bindingHash,
        assignmentHash: input.assignmentHash,
        workItemHash: input.workItemHash,
        authorizedPhase: input.authorizedPhase,
        inputArtifactTypes: input.inputArtifactTypes,
        injectedFixtureOnly: true,
        samInferenceExecuted: false,
        providerRequestCount: 0,
        publicArtifactCount: 0,
        productionMutationCount: 0,
      })],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
    }
  }
}

function createBinding(input: {
  jobType: TrackAllPublicJobType
  adapterClass: 'internal_qualification_adapter' | 'canonical_private_execution_adapter'
  handler: SkillJobRuntimeAdapter
}): SkillJobRuntimeBinding {
  const definition = TRACK_ALL_PUBLIC_WORK_DEFINITIONS[input.jobType]
  const capability = TRACK_ALL_CAPABILITY_MANIFEST.supportedJobTypes.find((job) =>
    job.jobType === input.jobType)
  if (!capability) {
    throw new Error(`Track All work definition ${input.jobType} lacks a manifest capability.`)
  }
  const canonicalPrivate = input.adapterClass === 'canonical_private_execution_adapter'
  const routeKey = canonicalPrivateRouteKey(input.jobType)
  return createSkillJobRuntimeBinding({
    definition: {
      schemaVersion: 'edit-skill-runtime-binding-v2',
      skillKey: 'track_all',
      skillVersion: '1.0.0',
      contractVersion: 'track_all.skill_contract.v1',
      manifestHash: TRACK_ALL_CAPABILITY_MANIFEST.manifestHash,
      jobType: input.jobType,
      operationId: definition.operationId,
      operationKind: operationKind(definition),
      workerClass: definition.workerClass,
      inputArtifactTypes: capability.requiredArtifactTypes,
      outputArtifactTypes: capability.producedArtifactTypes,
      allowedPhases: capability.allowedPhases,
      requiredQualification: capability.minimumQualificationStatus,
      adapterClass: input.adapterClass,
      environmentClass: canonicalPrivate ? 'canonical_private' : 'internal_fixture',
      runtimeAdapterId: canonicalPrivate
        ? `track_all.runtime.canonical_private.${input.jobType.split('.').at(-1)}.v1`
        : `track_all.runtime.internal_qualification.${input.jobType.split('.').at(-1)}.v1`,
      routeKey,
      approvalRequired: true,
      providerAuthorityRequired: false,
      toolAuthorityRequired: operationKind(definition) === 'tool',
      privateArtifactRequired: canonicalPrivate,
      callerSelectedExecutableAllowed: false,
      automaticRetryAllowed: false,
      alternateProviderFallbackAllowed: false,
      mutatesOnlyAssignmentRange: true,
      createsMedia: capability.primaryVisualOwnershipPossible,
    },
    handler: input.handler,
  })
}

function canonicalPrivateRouteKey(
  jobType: TrackAllPublicJobType,
): string {
  if (jobType === 'track_all.produce_selected_target_graph' ||
    jobType === 'track_all.produce_concept_instance_graph') return 'sam3_1_masklet_route'
  if (jobType === 'track_all.track_planar_region') return 'planar_tracking_route'
  if (jobType === 'track_all.repair_track') return 'existing_track_repair_route'
  if (jobType === 'track_all.apply_privacy_redaction') return 'privacy_redaction_route'
  if (jobType === 'track_all.apply_tracked_focus') return 'focus_route'
  if (jobType === 'track_all.prepare_tracked_reframe') return 'reframe_route'
  if (jobType === 'track_all.produce_scene_geometry_graph') return 'deterministic_geometry_route'
  if (jobType === 'track_all.plan_assignment' || jobType === 'track_all.no_action' ||
    jobType === 'track_all.project_result') {
    return 'planning_core_route'
  }
  return 'public_plugin_lifecycle_route'
}

export const TRACK_ALL_RUNTIME_BINDINGS: readonly SkillJobRuntimeBinding[] =
  (Object.keys(TRACK_ALL_PUBLIC_WORK_DEFINITIONS) as TrackAllPublicJobType[])
    .map((jobType) => createBinding({
      jobType,
      adapterClass: 'internal_qualification_adapter',
      handler: internalAdapter(jobType, TRACK_ALL_PUBLIC_WORK_DEFINITIONS[jobType]),
    }))

export interface TrackAllCanonicalPrivateWorkExecutor {
  execute(
    jobType: TrackAllPublicJobType,
    definition: TrackAllPublicWorkDefinition,
    input: Parameters<SkillJobRuntimeAdapter>[0],
  ): Promise<SkillJobRuntimeAdapterResult>
}

export interface TrackAllCompiledCanonicalWorkGraph {
  readonly schemaVersion: 'track_all_work_graph_v1'
  readonly artifactHash: string
  readonly assignmentHash: string
  readonly planHash: string
  readonly maximumCreditBudget: number
  readonly atomicWorkItems: readonly {
    readonly workItemKey: string
    readonly workItemHash: string
    readonly stageId: string
    readonly parentJobType: string
    readonly operationId: string
    readonly workerClass: string
    readonly dependencyKeys: readonly string[]
    readonly maximumCreditBudget: number
    readonly maximumAttempts: number
    readonly createsMedia: boolean
    readonly createsGpuWork: boolean
  }[]
  readonly workItemHashes: readonly string[]
  readonly dependencyRequestHashes: readonly string[]
  readonly callerSelectedExecutableAllowed: false
  readonly outsideAuthorizedRangeModified: false
}

export function createTrackAllCanonicalPrivateRuntimeBindings(
  executor: TrackAllCanonicalPrivateWorkExecutor,
): readonly SkillJobRuntimeBinding[] {
  return (Object.keys(TRACK_ALL_PUBLIC_WORK_DEFINITIONS) as TrackAllPublicJobType[])
    .map((jobType) => createBinding({
      jobType,
      adapterClass: 'canonical_private_execution_adapter',
      handler: (input) => executor.execute(
        jobType,
        TRACK_ALL_PUBLIC_WORK_DEFINITIONS[jobType],
        input,
      ),
    }))
}

export function registerTrackAllRuntimeBindings(
  registry: SkillJobRuntimeBindingRegistry,
): void {
  for (const binding of TRACK_ALL_RUNTIME_BINDINGS) registry.register(binding)
}

function jobsForPlan(plan: TrackAllPlan): TrackAllPublicJobType[] {
  if (nonExecutableDecision(plan.decision)) {
    return ['track_all.plan_assignment', 'track_all.no_action', 'track_all.project_result']
  }
  if (plan.decision === 'track_planar_region') {
    return [
      'track_all.plan_assignment',
      'track_all.produce_scene_geometry_graph',
      'track_all.track_planar_region',
      'track_all.project_result',
    ]
  }
  if (plan.decision === 'repair_existing_track') {
    return [
      'track_all.plan_assignment',
      'track_all.repair_track',
      'track_all.validate_track_graph',
      'track_all.prepare_composition_layer', 'track_all.project_result',
    ]
  }
  if (plan.decision === 'produce_track_graph' && !plan.samWorkPlanned) {
    return [
      'track_all.plan_assignment', 'track_all.validate_track_graph',
      'track_all.prepare_composition_layer', 'track_all.project_result',
    ]
  }
  if (['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(plan.decision) && !plan.samWorkPlanned) {
    const jobs: TrackAllPublicJobType[] = ['track_all.plan_assignment']
    if (plan.decision === 'apply_privacy_redaction') {
      jobs.push('track_all.produce_scene_geometry_graph')
    }
    if (plan.decision === 'apply_privacy_redaction') jobs.push('track_all.apply_privacy_redaction')
    if (plan.decision === 'apply_tracked_focus') jobs.push('track_all.apply_tracked_focus')
    if (plan.decision === 'prepare_tracked_reframe') jobs.push('track_all.prepare_tracked_reframe')
    jobs.push('track_all.prepare_composition_layer')
    jobs.push('track_all.project_result')
    return jobs
  }
  const graphJob: TrackAllPublicJobType =
    plan.requestedJobType === 'track_all.produce_concept_instance_graph'
      ? 'track_all.produce_concept_instance_graph'
      : 'track_all.produce_selected_target_graph'
  const jobs: TrackAllPublicJobType[] = [
    'track_all.plan_assignment',
    'track_all.produce_scene_geometry_graph',
    graphJob,
  ]
  if (plan.decision === 'apply_privacy_redaction') jobs.push('track_all.apply_privacy_redaction')
  if (plan.decision === 'apply_tracked_focus') jobs.push('track_all.apply_tracked_focus')
  if (plan.decision === 'prepare_tracked_reframe') jobs.push('track_all.prepare_tracked_reframe')
  jobs.push('track_all.validate_track_graph', 'track_all.prepare_composition_layer')
  if (plan.visibleTreatmentPlanned) jobs.push('track_all.integrate_preview')
  jobs.push('track_all.project_result')
  return jobs
}

export function compileTrackAllPublicWorkItems(input: {
  assignment: SkillAssignment
  plan: TrackAllPlan
}): EditSkillPublicWorkItem[] {
  const jobs = jobsForPlan(input.plan)
  const budgets = allocateIntegerBudget(input.plan.creditEstimate.maximumCredits, jobs.length)
  return jobs.map((jobType, index) => {
    const definition = TRACK_ALL_PUBLIC_WORK_DEFINITIONS[jobType]
    const workItemKey = `track-all-work-${index + 1}-${jobType.split('.').at(-1)}`
    const core = {
      workItemKey,
      jobType,
      operationId: definition.operationId,
      workerClass: definition.workerClass,
      assignmentId: input.assignment.assignmentId,
      assignmentHash: input.assignment.assignmentHash,
      manifestRef: input.assignment.manifestRef,
      authorizedRange: input.assignment.authorizedRange,
      dependencyKeys: index === 0
        ? []
        : [`track-all-work-${index}-${jobs[index - 1]!.split('.').at(-1)}`],
      expectedOutputType: definition.output,
      maximumCreditBudget: budgets[index]!,
      maximumAttempts: definition.operationId === 'tool.sam3_1.track_masklets.v2'
        ? input.plan.maximumAttempts
        : 1,
      required: true,
      qaLineageKeys: qaLineageForJob(jobType),
      callerSelectedExecutableAllowed: false as const,
      outsideAuthorizedRangeModified: false as const,
    }
    return { ...core, workItemHash: hashSkillValue(core) }
  })
}

interface AtomicTemplate {
  stageId: string
  parentJobType: TrackAllPublicJobType
  operationId: string
  workerClass: string
  inputArtifactTypes: string[]
  outputArtifactType: string
  dependencyStageIds: string[]
  createsMedia?: boolean
  createsGpuWork?: boolean
  maximumAttempts?: number
}

export function compileTrackAllCanonicalWorkGraph(input: {
  assignment: SkillAssignment
  plan: TrackAllPlan
  approvalHash: string
  dependencyRequestHashes: readonly string[]
  sourceSha256: string
}): TrackAllCompiledCanonicalWorkGraph {
  const templates = atomicTemplatesForPlan(input.plan)
  const budgets = allocateIntegerBudget(
    input.plan.creditEstimate.maximumCredits,
    templates.length,
  )
  const keyByStage = new Map(templates.map((template, index) => [
    template.stageId,
    `track-all-atomic-${String(index + 1).padStart(2, '0')}-${template.stageId}`,
  ]))
  const atomicWorkItems = templates.map((template, index) => {
    const core = {
      schemaVersion: 'track_all_atomic_work_item_v1' as const,
      workItemKey: keyByStage.get(template.stageId)!,
      stageId: template.stageId,
      parentJobType: template.parentJobType,
      operationId: template.operationId,
      workerClass: template.workerClass,
      authorizedRange: input.assignment.authorizedRange,
      dependencyKeys: template.dependencyStageIds.map((stageId) => {
        const key = keyByStage.get(stageId)
        if (!key) throw new Error(`Track All atomic stage ${template.stageId} has unknown dependency ${stageId}.`)
        return key
      }),
      inputArtifactTypes: template.inputArtifactTypes,
      outputArtifactType: template.outputArtifactType,
      maximumCreditBudget: budgets[index]!,
      maximumAttempts: template.maximumAttempts ?? 1,
      required: true,
      qaLineageKeys: qaLineageForJob(template.parentJobType),
      privateOutputRequired: true,
      createsMedia: template.createsMedia ?? false,
      createsGpuWork: template.createsGpuWork ?? false,
      callerSelectedExecutableAllowed: false as const,
      automaticRetryAllowed: false as const,
      alternateModelFallbackAllowed: false as const,
      mutatesOnlyAuthorizedRange: true as const,
    }
    return trackAllAtomicWorkItemSchema.parse({
      ...core,
      workItemHash: hashSkillValue(core),
    })
  })
  const specializedAssignment = input.assignment.contextArtifactRefs.find((value) =>
    value.artifactType === 'track_all_assignment_v1')
  if (!specializedAssignment) throw new Error('Track All canonical graph lacks its assignment artifact.')
  const core = {
    schemaVersion: 'track_all_work_graph_v1' as const,
    ownerUserId: input.assignment.ownerUserId,
    workspaceId: input.assignment.workspaceId,
    projectId: input.assignment.projectId,
    editSessionId: input.assignment.editSessionId,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planHash: input.plan.planHash,
    manifestRef: input.assignment.manifestRef,
    sourceSha256: input.sourceSha256,
    authorizedRange: input.assignment.authorizedRange,
    assignmentRef: specializedAssignment,
    approvedSnapshotHash: input.approvalHash,
    planningQaReportHash: input.plan.planningQaReportHash,
    executionDisposition: nonExecutableDecision(input.plan.decision)
      ? 'no_action' as const
      : 'selected' as const,
    maximumCreditBudget: input.plan.creditEstimate.maximumCredits,
    atomicWorkItems,
    workItemHashes: atomicWorkItems.map((item) => item.workItemHash),
    dependencyRequestHashes: [...input.dependencyRequestHashes],
    callerSelectedExecutableAllowed: false as const,
    outsideAuthorizedRangeModified: false as const,
  }
  return trackAllWorkGraphArtifactSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  }) as TrackAllCompiledCanonicalWorkGraph
}

function atomicTemplatesForPlan(plan: TrackAllPlan): AtomicTemplate[] {
  const root: AtomicTemplate[] = [
    stage('validate_assignment', 'track_all.plan_assignment', 'track_all.validate_assignment.v1', 'track_all_authority_worker', ['track_all_assignment_v1'], 'track_all_context_manifest_v1', []),
    stage('validate_target_authority', 'track_all.plan_assignment', 'track_all.validate_target_authority.v1', 'track_all_authority_worker', ['track_all_target_specification_v1'], 'track_all_target_qa_report_v1', ['validate_assignment']),
  ]
  if (nonExecutableDecision(plan.decision)) {
    return [
      ...root,
      stage('no_action', 'track_all.no_action', 'track_all.no_action.v1', 'track_all_no_action_worker', ['track_all_plan_v1'], 'track_all_result_receipt_v1', ['validate_assignment', 'validate_target_authority']),
      stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['track_all_plan_v1'], 'track_all_result_receipt_v1', ['no_action']),
    ]
  }
  const source: AtomicTemplate[] = [
    stage('inspect_source', 'track_all.produce_scene_geometry_graph', 'tool.ffprobe.inspect_approved_media.v1', 'track_all_source_inspection_worker', ['source_frame_authority_v1'], 'source_frame_authority_v1', ['validate_assignment']),
    stage('detect_shot_boundaries', 'track_all.produce_scene_geometry_graph', 'tool.pyscenedetect.detect_scene_boundaries.v1', 'track_all_geometry_worker', ['source_frame_authority_v1'], 'track_all_scene_context_v1', ['inspect_source']),
    stage('estimate_camera_motion', 'track_all.produce_scene_geometry_graph', 'tool.opencv.analyze_approved_visual_artifacts.v1', 'track_all_geometry_worker', ['source_frame_authority_v1'], 'camera_motion_graph_v1', ['inspect_source']),
  ]
  if (plan.decision === 'track_planar_region') {
    return [
      ...root,
      ...source,
      stage('choose_initialization_frame', 'track_all.track_planar_region', 'track_all.choose_initialization_frame.v1', 'track_all_geometry_worker', ['track_all_target_specification_v1', 'camera_motion_graph_v1'], 'track_all_plan_v1', ['validate_target_authority', 'detect_shot_boundaries', 'estimate_camera_motion']),
      stage('extract_planar_features', 'track_all.track_planar_region', 'tool.opencv.analyze_approved_visual_artifacts.v1', 'track_all_geometry_worker', ['source_frame_authority_v1', 'track_all_target_specification_v1'], 'planar_track_graph_v1', ['choose_initialization_frame']),
      stage('calculate_homography', 'track_all.track_planar_region', 'tool.opencv.analyze_approved_visual_artifacts.v1', 'track_all_geometry_worker', ['planar_track_graph_v1'], 'planar_track_graph_v1', ['extract_planar_features']),
      stage('validate_reprojection', 'track_all.validate_track_graph', 'track_all.validate_planar_reprojection.v1', 'track_all_qa_worker', ['planar_track_graph_v1'], 'track_all_integration_qa_report_v1', ['calculate_homography']),
      stage('build_planar_track_graph', 'track_all.track_planar_region', 'track_all.build_planar_track_graph.v1', 'track_all_geometry_worker', ['planar_track_graph_v1', 'track_all_integration_qa_report_v1'], 'planar_track_graph_v1', ['validate_reprojection']),
      stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['planar_track_graph_v1'], 'track_all_result_receipt_v1', ['build_planar_track_graph']),
    ]
  }
  if (plan.decision === 'repair_existing_track') {
    return [
      ...root,
      stage('direct_track_repair', 'track_all.repair_track', 'track_all.direct_repair.v1', 'track_all_repair_worker', ['track_graph_v2', 'prior_track_repair_evidence_v1'], 'track_all_repair_receipt_v1', ['validate_target_authority']),
      stage('run_repair_qa', 'track_all.validate_track_graph', 'track_all.validate_repaired_track.v1', 'track_all_qa_worker', ['track_all_repair_receipt_v1'], 'track_all_temporal_qa_report_v1', ['direct_track_repair']),
      stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['track_all_repair_receipt_v1', 'track_all_temporal_qa_report_v1'], 'track_all_result_receipt_v1', ['run_repair_qa']),
    ]
  }
  if (plan.decision === 'produce_track_graph' && !plan.samWorkPlanned) {
    return [
      ...root,
      stage('validate_existing_track_graph', 'track_all.validate_track_graph', 'track_all.validate_track_graph.v1', 'track_all_qa_worker', ['track_graph_v2'], 'track_all_temporal_qa_report_v1', ['validate_target_authority']),
      stage('prepare_composition_layer', 'track_all.prepare_composition_layer', 'track_all.prepare_composition_layer.v1', 'track_all_handoff_worker', ['track_graph_v2'], 'track_all_cross_skill_handoff_v1', ['validate_existing_track_graph']),
      stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['track_graph_v2'], 'track_all_result_receipt_v1', ['prepare_composition_layer']),
    ]
  }
  if (['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(plan.decision) && !plan.samWorkPlanned) {
    const treatment = treatmentTemplates(plan, 'validate_existing_track_graph')
    const finalDependency = treatment.at(-1)?.stageId ?? 'validate_existing_track_graph'
    return [
      ...root,
      ...(plan.decision === 'apply_privacy_redaction' ? source : []),
      stage('validate_existing_track_graph', 'track_all.validate_track_graph', 'track_all.validate_track_graph.v1', 'track_all_qa_worker', ['track_graph_v2'], 'track_all_temporal_qa_report_v1', ['validate_target_authority']),
      ...treatment,
      stage('prepare_composition_layer', 'track_all.prepare_composition_layer', 'track_all.prepare_composition_layer.v1', 'track_all_handoff_worker', ['track_graph_v2'], 'track_all_cross_skill_handoff_v1', ['validate_existing_track_graph']),
      stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['track_graph_v2'], 'track_all_result_receipt_v1', [finalDependency, 'prepare_composition_layer']),
    ]
  }
  const graphJob: TrackAllPublicJobType =
    plan.requestedJobType === 'track_all.produce_concept_instance_graph'
      ? 'track_all.produce_concept_instance_graph'
      : 'track_all.produce_selected_target_graph'
  const tracking: AtomicTemplate[] = [
    stage('choose_initialization_frame', graphJob, 'track_all.choose_initialization_frame.v1', 'track_all_geometry_worker', ['track_all_target_specification_v1', 'camera_motion_graph_v1'], 'track_all_plan_v1', ['validate_target_authority', 'detect_shot_boundaries', 'estimate_camera_motion']),
    stage('prepare_tracking_chunks', graphJob, 'track_all.prepare_tracking_chunks.v1', 'track_all_planning_worker', ['track_all_plan_v1', 'track_all_scene_context_v1'], 'track_all_plan_v1', ['detect_shot_boundaries', 'estimate_camera_motion']),
    stage('allocate_multiplex_buckets', graphJob, 'track_all.allocate_multiplex_buckets.v1', 'track_all_planning_worker', ['track_all_plan_v1'], 'track_all_plan_v1', ['prepare_tracking_chunks', 'validate_target_authority']),
    stage('execute_sam_masklet_session', graphJob, 'tool.sam3_1.track_masklets.v2', 'track_all_private_gpu_worker', ['track_all_plan_v1', 'track_all_target_specification_v1'], 'track_mask_chunk_manifest_v1', ['choose_initialization_frame', 'prepare_tracking_chunks', 'allocate_multiplex_buckets'], false, true, plan.maximumAttempts),
    stage('normalize_masklets', graphJob, 'track_all.normalize_masklets.v1', 'track_all_private_geometry_worker', ['track_mask_chunk_manifest_v1'], 'track_mask_sequence_v1', ['execute_sam_masklet_session']),
    stage('stitch_chunks', graphJob, 'tool.opencv.analyze_approved_visual_artifacts.v1', 'track_all_geometry_worker', ['track_mask_sequence_v1', 'track_all_plan_v1'], 'track_all_chunk_seam_qa_report_v1', ['normalize_masklets', 'prepare_tracking_chunks']),
    stage('associate_identities', graphJob, 'track_all.associate_anonymous_identities.v1', 'track_all_identity_worker', ['track_mask_sequence_v1', 'track_all_chunk_seam_qa_report_v1'], 'track_identity_lineage_v1', ['stitch_chunks']),
    stage('build_camera_motion_graph', 'track_all.produce_scene_geometry_graph', 'track_all.build_camera_motion_graph.v1', 'track_all_geometry_worker', ['camera_motion_graph_v1'], 'camera_motion_graph_v1', ['estimate_camera_motion']),
    stage('build_anchor_graph', graphJob, 'track_all.build_anchor_graph.v1', 'track_all_geometry_worker', ['track_identity_lineage_v1', 'camera_motion_graph_v1'], 'track_anchor_graph_v1', ['associate_identities', 'build_camera_motion_graph']),
    stage('run_target_qa', 'track_all.validate_track_graph', 'track_all.validate_target.v1', 'track_all_qa_worker', ['track_identity_lineage_v1'], 'track_all_target_qa_report_v1', ['associate_identities']),
    stage('run_temporal_qa', 'track_all.validate_track_graph', 'track_all.validate_temporal.v1', 'track_all_qa_worker', ['track_identity_lineage_v1', 'track_all_chunk_seam_qa_report_v1'], 'track_all_temporal_qa_report_v1', ['associate_identities', 'stitch_chunks']),
    stage('run_mask_qa', 'track_all.validate_track_graph', 'track_all.validate_mask.v1', 'track_all_qa_worker', ['track_mask_sequence_v1'], 'track_all_mask_qa_report_v1', ['normalize_masklets']),
    stage('build_track_graph', graphJob, 'track_all.build_track_graph.v2', 'track_all_graph_worker', ['track_identity_lineage_v1', 'track_anchor_graph_v1', 'camera_motion_graph_v1'], 'track_graph_v2', ['build_anchor_graph', 'run_target_qa', 'run_temporal_qa', 'run_mask_qa']),
  ]
  const treatment = treatmentTemplates(plan, 'build_track_graph')
  const finalDependency = treatment.at(-1)?.stageId ?? 'build_track_graph'
  return [
    ...root,
    ...source,
    ...tracking,
    ...treatment,
    stage('prepare_composition_layer', 'track_all.prepare_composition_layer', 'track_all.prepare_composition_layer.v1', 'track_all_handoff_worker', ['track_graph_v2'], 'track_all_cross_skill_handoff_v1', ['build_track_graph']),
    stage('project_track_all_result', 'track_all.project_result', 'track_all.project_result.v1', 'track_all_result_worker', ['track_graph_v2'], 'track_all_result_receipt_v1', [finalDependency, 'prepare_composition_layer']),
  ]
}

function treatmentTemplates(plan: TrackAllPlan, graphDependency: string): AtomicTemplate[] {
  if (plan.decision === 'apply_privacy_redaction') return [
    stage('build_redaction_plan', 'track_all.apply_privacy_redaction', 'track_all.build_redaction_plan.v1', 'track_all_treatment_worker', ['track_graph_v2', 'privacy_policy_snapshot_v1'], 'tracked_redaction_plan_v1', [graphDependency]),
    stage('compile_redaction_effect', 'track_all.apply_privacy_redaction', 'tool.ffmpeg.execute_approved_media_recipe.v1', 'track_all_private_media_worker', ['tracked_redaction_plan_v1'], 'tracked_redaction_result_v1', ['build_redaction_plan'], true),
    stage('render_private_redaction_preview', 'track_all.integrate_preview', 'tool.ffmpeg.execute_approved_media_recipe.v1', 'track_all_private_media_worker', ['tracked_redaction_plan_v1'], 'tracked_redaction_plan_v1', ['compile_redaction_effect'], true),
    stage('run_flattened_privacy_qa', 'track_all.validate_track_graph', 'track_all.validate_flattened_privacy.v1', 'track_all_qa_worker', ['tracked_redaction_plan_v1'], 'track_all_privacy_qa_report_v1', ['render_private_redaction_preview']),
    stage('project_redaction_result', 'track_all.apply_privacy_redaction', 'track_all.project_redaction_result.v1', 'track_all_result_worker', ['track_all_privacy_qa_report_v1'], 'tracked_redaction_result_v1', ['run_flattened_privacy_qa']),
  ]
  if (plan.decision === 'apply_tracked_focus') return [
    stage('compile_focus_treatment', 'track_all.apply_tracked_focus', 'track_all.compile_focus_treatment.v1', 'track_all_treatment_worker', ['track_graph_v2'], 'tracked_focus_plan_v1', [graphDependency]),
    stage('render_focus_preview', 'track_all.integrate_preview', 'tool.remotion.render_approved_composition.v1', 'track_all_private_render_worker', ['tracked_focus_plan_v1'], 'tracked_focus_result_v1', ['compile_focus_treatment'], true),
    stage('run_focus_integration_qa', 'track_all.validate_track_graph', 'track_all.validate_focus_integration.v1', 'track_all_qa_worker', ['tracked_focus_result_v1'], 'track_all_integration_qa_report_v1', ['render_focus_preview']),
    stage('project_focus_result', 'track_all.apply_tracked_focus', 'track_all.project_focus_result.v1', 'track_all_result_worker', ['track_all_integration_qa_report_v1'], 'tracked_focus_result_v1', ['run_focus_integration_qa']),
  ]
  if (plan.decision === 'prepare_tracked_reframe') return [
    stage('calculate_reframe_trajectory', 'track_all.prepare_tracked_reframe', 'track_all.calculate_reframe_trajectory.v1', 'track_all_geometry_worker', ['track_graph_v2', 'caption_reserved_zones_v1'], 'tracked_reframe_plan_v1', [graphDependency]),
    stage('validate_crop_and_safe_zones', 'track_all.validate_track_graph', 'track_all.validate_reframe_safe_zones.v1', 'track_all_qa_worker', ['tracked_reframe_plan_v1'], 'track_all_integration_qa_report_v1', ['calculate_reframe_trajectory']),
    stage('render_reframe_preview', 'track_all.integrate_preview', 'tool.remotion.render_approved_composition.v1', 'track_all_private_render_worker', ['tracked_reframe_plan_v1'], 'tracked_reframe_result_v1', ['validate_crop_and_safe_zones'], true),
    stage('run_reframe_integration_qa', 'track_all.validate_track_graph', 'track_all.validate_reframe_integration.v1', 'track_all_qa_worker', ['tracked_reframe_result_v1'], 'track_all_integration_qa_report_v1', ['render_reframe_preview']),
    stage('project_reframe_result', 'track_all.prepare_tracked_reframe', 'track_all.project_reframe_result.v1', 'track_all_result_worker', ['track_all_integration_qa_report_v1'], 'tracked_reframe_result_v1', ['run_reframe_integration_qa']),
  ]
  return []
}

function stage(
  stageId: string,
  parentJobType: TrackAllPublicJobType,
  operationId: string,
  workerClass: string,
  inputArtifactTypes: string[],
  outputArtifactType: string,
  dependencyStageIds: string[],
  createsMedia = false,
  createsGpuWork = false,
  maximumAttempts = 1,
): AtomicTemplate {
  return {
    stageId,
    parentJobType,
    operationId,
    workerClass,
    inputArtifactTypes,
    outputArtifactType,
    dependencyStageIds,
    createsMedia,
    createsGpuWork,
    maximumAttempts,
  }
}

function nonExecutableDecision(decision: TrackAllPlan['decision']): boolean {
  return [
    'use_no_tracking', 'needs_visual_intelligence', 'needs_user_selection',
    'needs_range_expansion', 'needs_manual_keyframe', 'needs_user_confirmation',
    'target_not_found', 'multiple_targets_ambiguous', 'identity_uncertain',
    'privacy_coverage_blocked', 'blocked',
    'needs_preflight_observation', 'needs_track_graph',
    'needs_route_qualification', 'blocked_external_sam_prerequisites',
  ].includes(decision)
}

function allocateIntegerBudget(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}

function qaLineageForJob(jobType: TrackAllPublicJobType): string[] {
  if (jobType === 'track_all.validate_track_graph') return [
    'track_all.qa.target', 'track_all.qa.temporal', 'track_all.qa.mask',
    'track_all.qa.identity', 'track_all.qa.camera_planar',
    'track_all.qa.chunk_seam',
  ]
  if (jobType === 'track_all.integrate_preview') return [
    'track_all.qa.exact_authorized_range',
    'track_all.qa.outside_range_unchanged',
    'track_all.qa.exact_source_timing',
    'track_all.qa.visual_ownership',
    'track_all.qa.safe_zones_layer_order',
    'track_all.qa.private_output',
    'track_all.qa.final_lineage',
  ]
  return [
    'track_all.qa.exact_authorized_range',
    'track_all.qa.outside_range_unchanged',
    'track_all.qa.final_lineage',
  ]
}
