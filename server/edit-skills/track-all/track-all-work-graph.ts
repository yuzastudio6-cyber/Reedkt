import type { SkillAssignment } from '../core/skill-assignment-types'
import {
  createSkillJobRuntimeBinding,
  type SkillJobRuntimeBindingRegistry,
  type SkillWorkGraphJobDefinition,
} from '../core/edit-skill-runtime-binding'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { EditSkillPublicWorkItem } from '../core/edit-skill-plugin'
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
  'track_all.integrate_preview': { operationId: 'tool.remotion.render_approved_composition.v1', workerClass: 'track_all_private_render_worker', output: 'track_all_integration_qa_report_v1', phase: 'private_preview_render' },
  'track_all.no_action': { operationId: 'track_all.no_action.v1', workerClass: 'track_all_no_action_worker', output: 'track_all_result_receipt_v1', phase: 'result_projection' },
} as const)

export type TrackAllPublicJobType = keyof typeof TRACK_ALL_PUBLIC_WORK_DEFINITIONS

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

export function registerTrackAllRuntimeBindings(
  registry: SkillJobRuntimeBindingRegistry,
): void {
  for (const [jobType, definition] of Object.entries(TRACK_ALL_PUBLIC_WORK_DEFINITIONS)) {
    const capability = TRACK_ALL_CAPABILITY_MANIFEST.supportedJobTypes.find((job) =>
      job.jobType === jobType)
    if (!capability) throw new Error(`Track All work definition ${jobType} lacks a manifest capability.`)
    const operationKind = definition.operationId === 'track_all.no_action.v1'
      ? 'no_action' as const
      : definition.operationId.startsWith('tool.')
        ? 'tool' as const
        : 'internal' as const
    registry.register(createSkillJobRuntimeBinding({
      definition: {
        schemaVersion: 'edit-skill-runtime-binding-v2',
        skillKey: 'track_all', skillVersion: '1.0.0',
        contractVersion: 'track_all.skill_contract.v1',
        manifestHash: TRACK_ALL_CAPABILITY_MANIFEST.manifestHash,
        jobType, operationId: definition.operationId, operationKind,
        workerClass: definition.workerClass,
        inputArtifactTypes: capability.requiredArtifactTypes,
        outputArtifactTypes: capability.producedArtifactTypes,
        allowedPhases: capability.allowedPhases,
        requiredQualification: capability.minimumQualificationStatus,
        adapterClass: 'internal_qualification_adapter',
        environmentClass: 'internal_fixture',
        runtimeAdapterId: `track_all.fixture.${jobType.split('.').at(-1)}.v1`,
        approvalRequired: true,
        providerAuthorityRequired: false,
        toolAuthorityRequired: operationKind === 'tool',
        privateArtifactRequired: false,
        callerSelectedExecutableAllowed: false,
        automaticRetryAllowed: false,
        alternateProviderFallbackAllowed: false,
        mutatesOnlyAssignmentRange: true,
        createsMedia: capability.primaryVisualOwnershipPossible,
      },
      handler: async () => ({
        status: 'failed',
        outputArtifactTypes: capability.producedArtifactTypes,
        evidenceHashes: [hashSkillValue({ jobType, status: 'route_not_qualified' })],
        providerRequestCount: 0,
        publicArtifactCount: 0,
        productionMutationCount: 0,
        failureCode: 'track_all_route_not_qualified',
      }),
    }))
  }
}

function jobsForPlan(plan: TrackAllPlan): TrackAllPublicJobType[] {
  if (['use_no_tracking', 'needs_visual_intelligence', 'needs_user_selection', 'needs_range_expansion', 'needs_manual_keyframe', 'needs_user_confirmation', 'target_not_found', 'multiple_targets_ambiguous', 'identity_uncertain', 'privacy_coverage_blocked', 'blocked'].includes(plan.decision)) {
    return ['track_all.plan_assignment', 'track_all.no_action']
  }
  const main: TrackAllPublicJobType = plan.decision === 'produce_track_graph'
    ? plan.requestedJobType === 'track_all.produce_concept_instance_graph'
      ? 'track_all.produce_concept_instance_graph'
      : 'track_all.produce_selected_target_graph'
    : plan.decision === 'apply_privacy_redaction'
      ? 'track_all.apply_privacy_redaction'
      : plan.decision === 'apply_tracked_focus'
        ? 'track_all.apply_tracked_focus'
        : plan.decision === 'prepare_tracked_reframe'
          ? 'track_all.prepare_tracked_reframe'
          : plan.decision === 'track_planar_region'
            ? 'track_all.track_planar_region'
            : 'track_all.repair_track'
  const jobs: TrackAllPublicJobType[] = ['track_all.plan_assignment']
  if (main !== 'track_all.track_planar_region' && main !== 'track_all.repair_track' && main !== 'track_all.produce_selected_target_graph' && main !== 'track_all.produce_concept_instance_graph') {
    jobs.push(plan.requestedJobType === 'track_all.produce_concept_instance_graph' ? 'track_all.produce_concept_instance_graph' : 'track_all.produce_selected_target_graph')
  }
  jobs.push(main, 'track_all.validate_track_graph', 'track_all.prepare_composition_layer')
  if (plan.visibleTreatmentPlanned) jobs.push('track_all.integrate_preview')
  return [...new Set(jobs)]
}

export function compileTrackAllPublicWorkItems(input: {
  assignment: SkillAssignment
  plan: TrackAllPlan
}): EditSkillPublicWorkItem[] {
  const jobs = jobsForPlan(input.plan)
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
      dependencyKeys: index === 0 ? [] : [`track-all-work-${index}-${jobs[index - 1]!.split('.').at(-1)}`],
      expectedOutputType: definition.output,
      maximumCreditBudget: input.plan.creditEstimate.maximumCredits,
      maximumAttempts: input.plan.maximumAttempts,
      required: true,
      qaLineageKeys: ['track_all.qa.exact_authorized_range', 'track_all.qa.outside_range_unchanged', 'track_all.qa.final_lineage'],
      callerSelectedExecutableAllowed: false as const,
      outsideAuthorizedRangeModified: false as const,
    }
    return { ...core, workItemHash: hashSkillValue(core) }
  })
}

export function trackAllPublicWorkGraphHash(input: {
  plan: TrackAllPlan
  workItems: readonly EditSkillPublicWorkItem[]
}): string {
  return hashSkillValue({ schemaVersion: 'track_all_work_graph_v1', planHash: input.plan.planHash, workItems: input.workItems })
}
