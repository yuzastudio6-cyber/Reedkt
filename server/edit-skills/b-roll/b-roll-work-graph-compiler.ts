import { z } from 'zod'

import type { CanonicalWorkItemInput } from '../../validation/edit-planning-authority-schemas'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import { isFrameRangeContained } from '../core/skill-range-authority'
import type { BrollPlanArtifact, BrollSkillAssignment } from './b-roll-contracts'
import { assertBrollPlanRuntimeInvariants } from './b-roll-plan-compiler'

const workItemSchema = z.object({
  workItemKey: z.string().trim().min(1).max(180),
  jobType: z.string().trim().min(1).max(180),
  operationId: z.string().trim().min(1).max(240),
  workerClass: z.string().trim().min(1).max(180),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  dependencyKeys: z.array(z.string().trim().min(1).max(180)).max(100),
  expectedOutputType: z.string().trim().min(1).max(180),
  maximumCreditBudget: z.number().int().nonnegative().max(100_000),
  maximumAttempts: z.number().int().positive().max(2),
  required: z.boolean(),
  qaLineageKeys: z.array(z.string().trim().min(1).max(180)).min(1).max(100),
  providerRouteId: z.literal('gemini_omni_flash').optional(),
  callerSelectedExecutableAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  workItemHash: skillSha256Schema,
}).strict()

export type BrollCanonicalWorkItem = z.infer<typeof workItemSchema>

const workGraphCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_canonical_work_graph_v1'),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  planningQaReportHash: skillSha256Schema,
  route: z.enum(['no_action', 'existing_source', 'approved_user_asset', 'gemini_omni']),
  workItems: z.array(workItemSchema).min(1).max(32),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const brollCanonicalWorkGraphSchema = workGraphCoreSchema.extend({
  workGraphHash: skillSha256Schema,
}).strict()

export type BrollCanonicalWorkGraph = z.infer<typeof brollCanonicalWorkGraphSchema>

export const BROLL_CANONICAL_WORK_ITEM_AUTHORITY_VERSION =
  'b_roll_canonical_atomic_work_item_authority_v1' as const

export interface BrollCanonicalWorkDefinition {
  jobType: string
  operationId: string
  workerClass: string
  output: string
  inputArtifactTypes: readonly string[]
  allowedPhase: string
  toolOrProviderCredits: number
  qa: readonly string[]
  provider?: true
}

export const BROLL_CANONICAL_WORK_DEFINITIONS: readonly BrollCanonicalWorkDefinition[] = [
  {
    jobType: 'validate_b_roll_assignment', operationId: 'b_roll.internal.validate_assignment.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_assignment_v1'],
    output: 'b_roll_assignment_v1', allowedPhase: 'plan_validation', toolOrProviderCredits: 0,
    qa: ['b_roll.planning.range_authority'],
  },
  {
    jobType: 'validate_b_roll_range_authority', operationId: 'b_roll.internal.validate_range.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_assignment_v1', 'b_roll_plan_v1', 'b_roll_planning_qa_report_v1'],
    output: 'b_roll_plan_v1', allowedPhase: 'plan_validation', toolOrProviderCredits: 0,
    qa: ['b_roll.integration.exact_authorized_range'],
  },
  {
    jobType: 'validate_b_roll_source', operationId: 'b_roll.internal.validate_source.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_plan_v1', 'source_media_artifact_v1'],
    output: 'source_media_artifact_v1', allowedPhase: 'plan_validation', toolOrProviderCredits: 0,
    qa: ['b_roll.planning.source_safety'],
  },
  {
    jobType: 'prepare_b_roll_source', operationId: 'b_roll.internal.prepare_source.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_plan_v1', 'source_media_artifact_v1'],
    output: 'b_roll_candidate_media_manifest_v1', allowedPhase: 'media_normalization', toolOrProviderCredits: 0,
    qa: ['b_roll.output.private_artifact_integrity'],
  },
  {
    jobType: 'generate_b_roll_candidate', operationId: 'provider.google.generate_b_roll_candidate.v1',
    workerClass: 'provider_worker', inputArtifactTypes: ['b_roll_plan_v1', 'b_roll_provider_request_specification_v1'],
    output: 'b_roll_candidate_media_manifest_v1', allowedPhase: 'provider_generation', toolOrProviderCredits: 20,
    qa: ['b_roll.output.semantic_alignment'], provider: true,
  },
  {
    jobType: 'inspect_b_roll_candidate_with_ffprobe', operationId: 'tool.ffprobe.inspect_approved_media.v1',
    workerClass: 'media_processing_worker', inputArtifactTypes: ['b_roll_candidate_media_manifest_v1'],
    output: 'b_roll_candidate_manifest_v1', allowedPhase: 'media_inspection', toolOrProviderCredits: 1,
    qa: ['b_roll.output.valid_mp4', 'b_roll.output.decodable_streams'],
  },
  {
    jobType: 'normalize_b_roll_candidate_with_ffmpeg', operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    workerClass: 'media_processing_worker', inputArtifactTypes: ['b_roll_candidate_media_manifest_v1', 'b_roll_candidate_manifest_v1'],
    output: 'b_roll_candidate_version_v1', allowedPhase: 'media_normalization', toolOrProviderCredits: 2,
    qa: ['b_roll.output.duration', 'b_roll.output.frame_rate', 'b_roll.output.resolution'],
  },
  {
    jobType: 'run_b_roll_technical_qa', operationId: 'b_roll.internal.run_technical_qa.v1',
    workerClass: 'qa_worker', inputArtifactTypes: ['b_roll_candidate_version_v1'],
    output: 'b_roll_qa_report_v1', allowedPhase: 'skill_output_qa', toolOrProviderCredits: 1,
    qa: ['b_roll.output.not_truncated', 'b_roll.output.not_frozen_or_black'],
  },
  {
    jobType: 'run_b_roll_semantic_visual_qa', operationId: 'b_roll.internal.run_semantic_visual_qa.v1',
    workerClass: 'qa_worker', inputArtifactTypes: ['b_roll_candidate_version_v1', 'visual_intelligence_candidate_qa_v1'],
    output: 'b_roll_qa_report_v1', allowedPhase: 'skill_output_qa', toolOrProviderCredits: 2,
    qa: ['b_roll.output.semantic_alignment', 'b_roll.output.no_proof_misrepresentation'],
  },
  {
    jobType: 'prepare_b_roll_remotion_layer', operationId: 'b_roll.internal.prepare_remotion_layer.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_plan_v1', 'b_roll_candidate_version_v1', 'b_roll_qa_report_v1'],
    output: 'b_roll_remotion_layer_manifest_v1', allowedPhase: 'layer_preparation', toolOrProviderCredits: 0,
    qa: ['b_roll.integration.layer_order'],
  },
  {
    jobType: 'render_b_roll_preview', operationId: 'tool.remotion.render_approved_composition.v1',
    workerClass: 'render_worker', inputArtifactTypes: ['b_roll_candidate_version_v1', 'b_roll_remotion_layer_manifest_v1'],
    output: 'b_roll_private_preview_media_manifest_v1', allowedPhase: 'private_preview_render', toolOrProviderCredits: 3,
    qa: ['b_roll.integration.preview_integrity'],
  },
  {
    jobType: 'run_b_roll_preview_qa', operationId: 'b_roll.internal.run_preview_qa.v1',
    workerClass: 'qa_worker', inputArtifactTypes: ['b_roll_candidate_version_v1', 'b_roll_remotion_layer_manifest_v1'],
    output: 'b_roll_qa_report_v1', allowedPhase: 'integration_qa', toolOrProviderCredits: 1,
    qa: ['b_roll.integration.caption_collision', 'b_roll.integration.preview_integrity'],
  },
  {
    jobType: 'project_b_roll_result_receipt', operationId: 'b_roll.internal.project_result.v1',
    workerClass: 'control_plane_worker', inputArtifactTypes: ['b_roll_plan_v1', 'b_roll_planning_qa_report_v1'],
    output: 'b_roll_result_receipt_v1', allowedPhase: 'result_projection', toolOrProviderCredits: 0,
    qa: ['b_roll.integration.result_lineage'],
  },
] as const

const definitionByJob = new Map(BROLL_CANONICAL_WORK_DEFINITIONS.map((definition) => [definition.jobType, definition]))

function definitionsFor(jobTypes: readonly string[]): readonly BrollCanonicalWorkDefinition[] {
  return jobTypes.map((jobType) => {
    const definition = definitionByJob.get(jobType)
    if (!definition) throw new Error(`Unknown canonical B-roll work definition ${jobType}.`)
    return definition
  })
}

const generatedDefinitions = definitionsFor([
  'validate_b_roll_assignment',
  'validate_b_roll_range_authority',
  'generate_b_roll_candidate',
  'inspect_b_roll_candidate_with_ffprobe',
  'normalize_b_roll_candidate_with_ffmpeg',
  'run_b_roll_technical_qa',
  'run_b_roll_semantic_visual_qa',
  'prepare_b_roll_remotion_layer',
  'render_b_roll_preview',
  'run_b_roll_preview_qa',
  'project_b_roll_result_receipt',
])

const existingDefinitions = definitionsFor([
  'validate_b_roll_assignment',
  'validate_b_roll_range_authority',
  'validate_b_roll_source',
  'prepare_b_roll_source',
  'inspect_b_roll_candidate_with_ffprobe',
  'normalize_b_roll_candidate_with_ffmpeg',
  'run_b_roll_technical_qa',
  'prepare_b_roll_remotion_layer',
  'render_b_roll_preview',
  'run_b_roll_preview_qa',
  'project_b_roll_result_receipt',
])

const noActionDefinitions = definitionsFor([
  'validate_b_roll_assignment',
  'validate_b_roll_range_authority',
  'project_b_roll_result_receipt',
])

function routeFor(plan: BrollPlanArtifact): BrollCanonicalWorkGraph['route'] {
  if (plan.decision === 'use_existing_project_clip') return 'existing_source'
  if (plan.decision === 'use_uploaded_user_asset') return 'approved_user_asset'
  if ([
    'generate_with_gemini_omni',
    'edit_uploaded_video_with_gemini_omni',
    'refine_generated_omni_candidate',
  ].includes(plan.decision)) return 'gemini_omni'
  return 'no_action'
}

const MEDIA_CREATING_JOB_TYPES = new Set([
  'prepare_b_roll_source',
  'generate_b_roll_candidate',
  'normalize_b_roll_candidate_with_ffmpeg',
  'render_b_roll_preview',
])

export function assertBrollWorkGraphDecisionInvariants(input: {
  plan: BrollPlanArtifact
  workGraph: BrollCanonicalWorkGraph
}): void {
  if (input.workGraph.planningQaReportHash !== input.plan.planningQaReportHash) {
    throw new Error('B-roll work graph lost its planning QA report lineage.')
  }
  const providerItems = input.workGraph.workItems.filter((item) =>
    item.operationId === 'provider.google.generate_b_roll_candidate.v1')
  const mediaItems = input.workGraph.workItems.filter((item) =>
    MEDIA_CREATING_JOB_TYPES.has(item.jobType))
  const inert = [
    'use_no_broll',
    'needs_other_skill',
    'needs_user_confirmation',
    'blocked',
  ].includes(input.plan.decision)
  const source = [
    'use_existing_project_clip',
    'use_uploaded_user_asset',
  ].includes(input.plan.decision)
  const provider = [
    'generate_with_gemini_omni',
    'edit_uploaded_video_with_gemini_omni',
    'refine_generated_omni_candidate',
  ].includes(input.plan.decision)
  if (inert && (
    input.workGraph.route !== 'no_action' ||
    providerItems.length !== 0 ||
    mediaItems.length !== 0 ||
    input.workGraph.workItems.some((item) => item.maximumCreditBudget !== 0)
  )) throw new Error('Non-executable B-roll plan emitted media, provider, or credit-bearing work.')
  if (source && (
    !['existing_source', 'approved_user_asset'].includes(input.workGraph.route) ||
    providerItems.length !== 0
  )) throw new Error('Existing-source B-roll plan emitted provider work.')
  if (provider && (
    input.workGraph.route !== 'gemini_omni' ||
    providerItems.length !== 1 ||
    providerItems[0]?.providerRouteId !== 'gemini_omni_flash'
  )) throw new Error('Gemini Omni B-roll plan must emit exactly one qualified provider job.')
}

export function compileBrollCanonicalWorkGraph(input: {
  assignment: BrollSkillAssignment
  plan: BrollPlanArtifact
}): BrollCanonicalWorkGraph {
  assertBrollPlanRuntimeInvariants({ assignment: input.assignment, plan: input.plan })
  if (
    input.plan.assignmentId !== input.assignment.assignmentId ||
    input.plan.assignmentHash !== input.assignment.assignmentHash ||
    hashSkillValue(input.plan.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(input.plan.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange)
  ) throw new Error('B-roll work graph received stale assignment, manifest, or range authority.')
  const route = routeFor(input.plan)
  const definitions = route === 'no_action'
    ? noActionDefinitions
    : route === 'gemini_omni' ? generatedDefinitions : existingDefinitions
  let priorKey: string | undefined
  const workItems = definitions.map((definition, index): BrollCanonicalWorkItem => {
    const workItemKey = `broll-${input.assignment.assignmentHash.slice(0, 12)}-${String(index + 1).padStart(2, '0')}-${definition.jobType}`
    const core = {
      workItemKey,
      jobType: definition.jobType,
      operationId: definition.operationId,
      workerClass: definition.workerClass,
      manifestRef: input.assignment.manifestRef,
      assignmentId: input.assignment.assignmentId,
      assignmentHash: input.assignment.assignmentHash,
      authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
      dependencyKeys: priorKey ? [priorKey] : [],
      expectedOutputType: definition.output,
      maximumCreditBudget: definition.toolOrProviderCredits,
      maximumAttempts: 1,
      required: true,
      qaLineageKeys: definition.qa,
      ...(definition.provider ? { providerRouteId: 'gemini_omni_flash' as const } : {}),
      callerSelectedExecutableAllowed: false as const,
      outsideAuthorizedRangeModified: false as const,
    }
    priorKey = workItemKey
    return workItemSchema.parse({ ...core, workItemHash: hashSkillValue(core) })
  })
  for (const item of workItems) {
    if (!isFrameRangeContained(item.authorizedRange, input.assignment.writeRangeAuthority.authorizedRange)) {
      throw new Error(`B-roll work item ${item.workItemKey} extends outside range authority.`)
    }
  }
  const core = workGraphCoreSchema.parse({
    schemaVersion: 'b_roll_canonical_work_graph_v1',
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    manifestRef: input.assignment.manifestRef,
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    planningQaReportHash: input.plan.planningQaReportHash,
    route,
    workItems,
    outsideAuthorizedRangeModified: false,
  })
  const workGraph = brollCanonicalWorkGraphSchema.parse({
    ...core,
    workGraphHash: hashSkillValue(core),
  })
  assertBrollWorkGraphDecisionInvariants({ plan: input.plan, workGraph })
  return workGraph
}

export function assertBrollCanonicalWorkGraph(
  value: BrollCanonicalWorkGraph,
): BrollCanonicalWorkGraph {
  const parsed = brollCanonicalWorkGraphSchema.parse(value)
  for (const workItem of parsed.workItems) {
    const { workItemHash, ...core } = workItem
    if (hashSkillValue(core) !== workItemHash) {
      throw new Error(`B-roll work item ${workItem.workItemKey} hash is stale or forged.`)
    }
    if (
      workItem.assignmentId !== parsed.assignmentId ||
      workItem.assignmentHash !== parsed.assignmentHash ||
      hashSkillValue(workItem.manifestRef) !== hashSkillValue(parsed.manifestRef) ||
      hashSkillValue(workItem.authorizedRange) !== hashSkillValue(parsed.authorizedRange)
    ) throw new Error(`B-roll work item ${workItem.workItemKey} lost graph lineage.`)
  }
  const { workGraphHash, ...core } = parsed
  if (hashSkillValue(core) !== workGraphHash) {
    throw new Error('B-roll canonical work graph hash is stale or forged.')
  }
  return parsed
}

function canonicalToolId(operationId: string): string | undefined {
  if (operationId === 'tool.ffprobe.inspect_approved_media.v1') return 'ffprobe'
  if (operationId === 'tool.ffmpeg.execute_approved_media_recipe.v1') return 'ffmpeg'
  if (operationId === 'tool.remotion.render_approved_composition.v1') return 'remotion'
  return undefined
}

function canonicalWorkItemType(item: BrollCanonicalWorkItem): CanonicalWorkItemInput['workItemType'] {
  if (item.jobType === 'render_b_roll_preview') return 'render_remotion_preview'
  if (item.jobType.includes('_qa')) return 'run_asset_qa'
  return 'custom'
}

function canonicalAssetRole(item: BrollCanonicalWorkItem): CanonicalWorkItemInput['expectedOutputs'][number]['assetRole'] {
  if (item.jobType === 'generate_b_roll_candidate') return 'generated'
  if (item.jobType === 'render_b_roll_preview') return 'preview'
  if (item.jobType.includes('_qa')) return 'qa'
  return 'processed'
}

function canonicalContentType(item: BrollCanonicalWorkItem): string {
  void item
  return 'application/json'
}

export function projectBrollCanonicalWorkItems(input: {
  assignment: BrollSkillAssignment
  workGraph: BrollCanonicalWorkGraph
}): CanonicalWorkItemInput[] {
  if (
    input.workGraph.assignmentId !== input.assignment.assignmentId ||
    input.workGraph.assignmentHash !== input.assignment.assignmentHash ||
    hashSkillValue(input.workGraph.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(input.workGraph.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange) ||
    input.workGraph.workItems.some((item) =>
      item.assignmentHash !== input.assignment.assignmentHash ||
      hashSkillValue(item.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
      hashSkillValue(item.authorizedRange) !==
        hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange))
  ) throw new Error('B-roll canonical projection received stale work graph authority.')

  return input.workGraph.workItems.map((item): CanonicalWorkItemInput => {
    const toolId = canonicalToolId(item.operationId)
    const outputKey = `${item.workItemKey}.output`
    return {
      workItemKey: item.workItemKey,
      workItemType: canonicalWorkItemType(item),
      workerClass: item.workerClass,
      executionInput: {
        bRollAtomicAuthority: {
          schemaVersion: BROLL_CANONICAL_WORK_ITEM_AUTHORITY_VERSION,
          operationId: item.operationId,
          manifestRef: item.manifestRef,
          assignmentId: item.assignmentId,
          assignmentHash: item.assignmentHash,
          authorizedRange: item.authorizedRange,
          workItemHash: item.workItemHash,
          qaLineageKeys: item.qaLineageKeys,
          planningQaReportHash: input.workGraph.planningQaReportHash,
          callerSelectedExecutableAllowed: false,
          outsideAuthorizedRangeModified: false,
        },
        ...(toolId ? { approvedToolOperationIds: [item.operationId] } : {}),
      },
      sourceSequenceItemIds: [...input.assignment.sourceSequenceIds],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey,
        artifactType: item.expectedOutputType,
        assetRole: canonicalAssetRole(item),
        required: item.required,
        previewPlaceholderAllowed: false,
        contentType: canonicalContentType(item),
        segmentIds: [...input.assignment.segmentIds],
        timingIds: [input.assignment.masterTimingHash],
        rendererLayerIds: item.jobType.includes('remotion') || item.jobType.includes('preview')
          ? [`broll-layer-${input.assignment.assignmentHash.slice(0, 12)}`]
          : [],
      }],
      dependencyKeys: [...item.dependencyKeys],
      approvedToolIds: toolId ? [toolId] : [],
      ...(item.providerRouteId ? { approvedProviderRoute: item.providerRouteId } : {}),
      providerExecutionMode: item.providerRouteId ? 'primary' : 'none',
      fallbackPolicy: {
        schemaVersion: 'b_roll_manifest_gated_fallback_policy_v1',
        automaticProviderRetryAllowed: false,
        alternateProviderFallbackAllowed: false,
        lowerCostDecisions: ['use_existing_project_clip', 'use_no_broll'],
        manifestHash: item.manifestRef.manifestHash,
      },
      maxAttempts: item.maximumAttempts,
      attemptTimeoutSeconds: Math.max(30, Math.min(14_400, input.assignment.maximumTimeSeconds)),
      scheduledDelaySeconds: 0,
      maximumCreditBudget: item.maximumCreditBudget,
      required: item.required,
    }
  })
}
