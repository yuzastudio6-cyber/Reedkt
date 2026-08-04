import { createHash } from 'node:crypto'
import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import { getToolOperationCapability } from '../tool-registry'
import './music-tool-capability-manifests'

export type MusicRouteRole = 'primary' | 'support' | 'qa' | 'fallback' | 'lower_cost' | 'no_music'

export interface MusicRouteStep {
  stepKey: string
  stepJobType: string
  toolKey: string
  toolVersion: string
  operationKey: string
  operationVersion: string
  operationProfileKey: string
  operationProfileVersion: string
  required: boolean
  dependencyStepKeys: string[]
  inputBindings: string[]
  outputBindings: string[]
  conditionKey?: string
  failureBehavior: 'fail_route' | 'block_dependents' | 'use_declared_fallback' | 'continue_optional'
}

export interface MusicToolRouteManifest {
  routeKey: string
  routeVersion: string
  routeHash: string
  supportedCapabilityKeys: string[]
  supportedJobTypes: string[]
  routeRole: MusicRouteRole
  qualificationStatus: SkillQualificationStatus
  qualificationByMode: {
    planning: SkillQualificationStatus
    fixtureExecution: SkillQualificationStatus
    privateInternalExecution: SkillQualificationStatus
    productionExecution: SkillQualificationStatus
  }
  qualificationEvidenceRefs: string[]
  requiredInputs: string[]
  producedArtifactTypes: string[]
  eligibilityRules: string[]
  steps: MusicRouteStep[]
  timeEstimatorKey: string
  creditEstimatorKey: string
  attemptPolicyKey: string
  fallbackRouteRefs: Array<{ routeKey: string; routeVersion: string }>
  automaticFallbackAllowed: false
  unknownOutcomeResubmissionAllowed: false
  freshApprovalRequiredForCostIncrease: true
  planningQa: string[]
  outputQa: string[]
  integrationQa: string[]
  invalidationRules: string[]
  knownLimitations: string[]
}

type UnpublishedMusicRoute = Omit<MusicToolRouteManifest, 'routeHash' | 'qualificationStatus' | 'qualificationByMode'>

const rank: Record<SkillQualificationStatus, number> = {
  blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
  planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
}

function lower(left: SkillQualificationStatus, right: SkillQualificationStatus): SkillQualificationStatus {
  return rank[left] <= rank[right] ? left : right
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]))
  }
  return value
}

export function calculateMusicRouteHash(route: Omit<MusicToolRouteManifest, 'routeHash'> | MusicToolRouteManifest): string {
  const { routeHash: _ignored, ...hashable } = route as MusicToolRouteManifest
  void _ignored
  return createHash('sha256').update(JSON.stringify(stableValue(hashable))).digest('hex')
}

function deriveQualification(steps: readonly MusicRouteStep[]): MusicToolRouteManifest['qualificationByMode'] {
  let planning: SkillQualificationStatus = 'production_qualified'
  let fixtureExecution: SkillQualificationStatus = 'production_qualified'
  let privateInternalExecution: SkillQualificationStatus = 'production_qualified'
  let productionExecution: SkillQualificationStatus = 'production_qualified'
  for (const step of steps.filter((candidate) => candidate.required)) {
    const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersion)
    if (!resolved || resolved.operation.operationVersion !== step.operationVersion) {
      throw new Error(`Music route references unknown operation ${step.toolKey}:${step.operationKey}@${step.operationVersion}.`)
    }
    planning = lower(planning, resolved.operation.qualificationByMode.planning)
    const fixture = resolved.operation.qualificationEvidenceLevel === 'fixture'
      ? 'planning_qualified' : resolved.operation.qualificationByMode.preview_execution
    fixtureExecution = lower(fixtureExecution, fixture)
    privateInternalExecution = lower(privateInternalExecution, resolved.operation.qualificationByMode.preview_execution)
    productionExecution = lower(productionExecution, resolved.operation.qualificationByMode.final_execution)
  }
  return { planning, fixtureExecution, privateInternalExecution, productionExecution }
}

export function publishMusicToolRouteManifest(input: UnpublishedMusicRoute): Readonly<MusicToolRouteManifest> {
  if (input.steps.length === 0) throw new Error(`Music route ${input.routeKey} must contain an executable step.`)
  const steps = new Map(input.steps.map((step) => [step.stepKey, step]))
  if (steps.size !== input.steps.length) throw new Error(`Music route ${input.routeKey} has duplicate step keys.`)
  const available = new Set(input.requiredInputs)
  const produced = new Set<string>()
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const visit = (step: MusicRouteStep): void => {
    if (visiting.has(step.stepKey)) throw new Error(`Music route ${input.routeKey} contains a dependency cycle.`)
    if (visited.has(step.stepKey)) return
    visiting.add(step.stepKey)
    for (const dependencyKey of step.dependencyStepKeys) {
      const dependency = steps.get(dependencyKey)
      if (!dependency) throw new Error(`Music route ${input.routeKey} references unknown dependency ${dependencyKey}.`)
      visit(dependency)
    }
    const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersion)
    if (!resolved || resolved.operation.operationVersion !== step.operationVersion) {
      throw new Error(`Music route ${input.routeKey} references unknown operation ${step.toolKey}:${step.operationKey}.`)
    }
    if (!resolved.operation.supportedJobTypes.includes(step.stepJobType)) {
      throw new Error(`Music route step ${step.stepKey} operation does not support ${step.stepJobType}.`)
    }
    const dependencyOutputs = new Set<string>()
    for (const dependencyKey of step.dependencyStepKeys) {
      steps.get(dependencyKey)!.outputBindings.forEach((output) => dependencyOutputs.add(output))
    }
    for (const binding of step.inputBindings) {
      if (!available.has(binding) && !dependencyOutputs.has(binding)) {
        throw new Error(`Music route step ${step.stepKey} has unresolved input ${binding}.`)
      }
    }
    for (const output of step.outputBindings) {
      if (!resolved.operation.producedArtifactTypes.includes(output)) {
        throw new Error(`Music route step ${step.stepKey} claims undeclared operation output ${output}.`)
      }
      produced.add(output)
      available.add(output)
    }
    if (step.failureBehavior === 'use_declared_fallback' && input.fallbackRouteRefs.length === 0) {
      throw new Error(`Music route step ${step.stepKey} requires an undeclared fallback.`)
    }
    visiting.delete(step.stepKey)
    visited.add(step.stepKey)
  }
  input.steps.forEach(visit)
  for (const output of input.producedArtifactTypes) {
    if (!produced.has(output)) throw new Error(`Music route ${input.routeKey} output ${output} is unreachable.`)
  }
  const qualificationByMode = deriveQualification(input.steps)
  const withoutHash = {
    ...structuredClone(input),
    qualificationStatus: qualificationByMode.productionExecution,
    qualificationByMode,
  }
  const result: MusicToolRouteManifest = {
    ...withoutHash,
    routeHash: calculateMusicRouteHash(withoutHash),
  }
  return Object.freeze(result)
}

function step(input: Omit<MusicRouteStep, 'operationVersion' | 'operationProfileVersion'>): MusicRouteStep {
  return { ...input, operationVersion: '1.0.0', operationProfileVersion: '1.0.0' }
}

function route(input: {
  key: string
  jobs: string[]
  role: MusicRouteRole
  requiredInputs: string[]
  outputs: string[]
  steps: MusicRouteStep[]
  fallback?: Array<{ routeKey: string; routeVersion: string }>
  limitations?: string[]
}): Readonly<MusicToolRouteManifest> {
  return publishMusicToolRouteManifest({
    routeKey: input.key,
    routeVersion: '1.0.0',
    supportedCapabilityKeys: input.jobs.map((job) => `music.${job}`),
    supportedJobTypes: input.jobs,
    routeRole: input.role,
    qualificationEvidenceRefs: input.steps.map((item) => `music.evidence.route.${item.operationKey}.v1`),
    requiredInputs: input.requiredInputs,
    producedArtifactTypes: input.outputs,
    eligibilityRules: ['exact_scope_authority', 'exact_timeline_binding', 'approved_snapshot', 'rights_when_media_used'],
    steps: input.steps,
    timeEstimatorKey: `music.route.time.${input.key}.v1`,
    creditEstimatorKey: `music.route.credit.${input.key}.v1`,
    attemptPolicyKey: input.key.includes('.lyria.') ? 'music.attempt.provider_reconciled.v1' : 'music.attempt.local_idempotent.v1',
    fallbackRouteRefs: input.fallback ?? [],
    automaticFallbackAllowed: false,
    unknownOutcomeResubmissionAllowed: false,
    freshApprovalRequiredForCostIncrease: true,
    planningQa: ['music.qa.planning.authority.v1', 'music.qa.planning.rights.v1', 'music.qa.planning.route.v1'],
    outputQa: ['music.qa.output.technical.v1', 'music.qa.output.subjective_needs_review.v1'],
    integrationQa: ['music.qa.integration.authority.v1', 'music.qa.integration.sound_boundary.v1'],
    invalidationRules: ['timeline_changed', 'source_changed', 'rights_changed', 'provider_profile_changed'],
    knownLimitations: input.limitations ?? [],
  })
}

function planningRoute(job: string, routeKey: string): Readonly<MusicToolRouteManifest> {
  const output = `music_${job}_artifact_v1`
  return route({
    key: routeKey, jobs: [job], role: 'primary', requiredInputs: ['music_assignment_v1'], outputs: [output],
    steps: [step({
      stepKey: 'plan', stepJobType: job, toolKey: 'music_supervision_engine', toolVersion: '1.0.0',
      operationKey: job, operationProfileKey: `music.profile.${job}.v1`, required: true,
      dependencyStepKeys: [], inputBindings: ['music_assignment_v1'], outputBindings: [output], failureBehavior: 'fail_route',
    })],
  })
}

const sourceStudyRoute = (input: {
  key: string; job: string; assetOperation: string; output: string
}): Readonly<MusicToolRouteManifest> => route({
  key: input.key, jobs: [input.job], role: 'primary', requiredInputs: ['approved_private_music_audio'],
  outputs: ['approved_music_selection_v1', 'music_candidate_analysis_v1'],
  steps: [
    step({
      stepKey: 'bind_asset', stepJobType: input.job, toolKey: 'music_private_asset_service', toolVersion: '1.0.0',
      operationKey: input.assetOperation, operationProfileKey: `music.profile.${input.assetOperation}.v1`, required: true,
      dependencyStepKeys: [], inputBindings: ['approved_private_music_audio'], outputBindings: ['approved_music_selection_v1'], failureBehavior: 'fail_route',
    }),
    step({
      stepKey: 'analyze', stepJobType: 'analyze_music_candidate', toolKey: 'music_private_audio_analysis', toolVersion: '1.0.0',
      operationKey: 'analyze_audio_bytes', operationProfileKey: 'music.profile.audio_analysis.v1', required: true,
      dependencyStepKeys: ['bind_asset'], inputBindings: ['approved_private_music_audio'], outputBindings: ['music_candidate_analysis_v1'], failureBehavior: 'fail_route',
    }),
  ],
})

const routes: Readonly<MusicToolRouteManifest>[] = [
  planningRoute('study_video_music_context', 'music.route.study.video_context.v1'),
  sourceStudyRoute({ key: 'music.route.study.existing_asset.v1', job: 'study_existing_music', assetOperation: 'preserve_source_music', output: 'music_existing_study_v1' }),
  sourceStudyRoute({ key: 'music.route.study.user_upload.v1', job: 'study_user_provided_music', assetOperation: 'use_user_uploaded_music', output: 'music_user_intake_v1' }),
  route({
    key: 'music.route.study.reference_dna.v1', jobs: ['study_reference_music', 'create_music_reference_dna'], role: 'primary',
    requiredInputs: ['approved_private_music_audio'], outputs: ['music_candidate_analysis_v1'], steps: [step({
      stepKey: 'analyze_reference', stepJobType: 'study_reference_music', toolKey: 'music_private_audio_analysis', toolVersion: '1.0.0',
      operationKey: 'analyze_audio_bytes', operationProfileKey: 'music.profile.reference_analysis.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['approved_private_music_audio'], outputBindings: ['music_candidate_analysis_v1'], failureBehavior: 'fail_route',
    })], limitations: ['Reference DNA is a measured structural risk screen, not copyright clearance.'],
  }),
  planningRoute('decide_music_need', 'music.route.decide.need.v1'),
  planningRoute('decide_music_silence', 'music.route.decide.silence.v1'),
  planningRoute('plan_music_narrative_arc', 'music.route.plan.narrative_arc.v1'),
  planningRoute('plan_music_motif', 'music.route.plan.motif.v1'),
  planningRoute('plan_scene_music', 'music.route.plan.scene.v1'),
  planningRoute('plan_boundary_music', 'music.route.plan.boundary.v1'),
  planningRoute('full_video_music_pass', 'music.route.plan.full_video.v1'),
  planningRoute('create_music_cue_sheet', 'music.route.plan.cue_sheet.v1'),
  sourceStudyRoute({ key: 'music.route.acquire.preserve_source.v1', job: 'fit_music_to_edit', assetOperation: 'preserve_source_music', output: 'approved_music_selection_v1' }),
  sourceStudyRoute({ key: 'music.route.acquire.user_upload.v1', job: 'select_user_provided_music', assetOperation: 'use_user_uploaded_music', output: 'approved_music_selection_v1' }),
  sourceStudyRoute({ key: 'music.route.acquire.project_library.v1', job: 'search_project_music', assetOperation: 'match_project_music', output: 'approved_music_selection_v1' }),
  sourceStudyRoute({ key: 'music.route.acquire.workspace_library.v1', job: 'search_workspace_music', assetOperation: 'match_workspace_music', output: 'approved_music_selection_v1' }),
  sourceStudyRoute({ key: 'music.route.acquire.internal_library.v1', job: 'search_authorized_music_library', assetOperation: 'match_internal_music', output: 'approved_music_selection_v1' }),
  route({
    key: 'music.route.generate.original.lyria.v1', jobs: ['generate_original_music'], role: 'primary',
    requiredInputs: ['music_composition_brief_v1'], outputs: ['untrusted_music_candidate'], steps: [step({
      stepKey: 'generate', stepJobType: 'generate_original_music', toolKey: 'google_lyria_3', toolVersion: '3.0.0-preview.20260325',
      operationKey: 'generate_original_music_injected', operationProfileKey: 'music.profile.lyria3_pro_preview.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_composition_brief_v1'], outputBindings: ['untrusted_music_candidate'], failureBehavior: 'fail_route',
    })], fallback: [{ routeKey: 'music.route.no_music.v1', routeVersion: '1.0.0' }],
    limitations: ['Fixture-qualified injected transport only; live provider is fail-closed.'],
  }),
  route({
    key: 'music.route.generate.variation.lyria.v1', jobs: ['generate_music_variation'], role: 'primary',
    requiredInputs: ['music_composition_brief_v1', 'approved_private_music_audio'], outputs: ['untrusted_music_candidate'], steps: [step({
      stepKey: 'generate_variation', stepJobType: 'generate_music_variation', toolKey: 'google_lyria_3', toolVersion: '3.0.0-preview.20260325',
      operationKey: 'generate_music_variation_injected', operationProfileKey: 'music.profile.lyria3_variation_preview.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_composition_brief_v1', 'approved_private_music_audio'], outputBindings: ['untrusted_music_candidate'], failureBehavior: 'fail_route',
    })], fallback: [{ routeKey: 'music.route.no_music.v1', routeVersion: '1.0.0' }],
  }),
  route({
    key: 'music.route.analyze.candidate.v1', jobs: ['analyze_music_candidate'], role: 'primary', requiredInputs: ['untrusted_music_candidate'],
    outputs: ['music_candidate_analysis_v1', 'music_technical_qa_v1'], steps: [step({
      stepKey: 'analyze', stepJobType: 'analyze_music_candidate', toolKey: 'music_private_audio_analysis', toolVersion: '1.0.0',
      operationKey: 'analyze_audio_bytes', operationProfileKey: 'music.profile.candidate_analysis.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['untrusted_music_candidate'], outputBindings: ['music_candidate_analysis_v1', 'music_technical_qa_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.select.candidate.v1', jobs: ['select_music_candidate'], role: 'primary', requiredInputs: ['music_candidate_analysis_v1'],
    outputs: ['music_candidate_selection_decision_v1'], steps: [step({
      stepKey: 'select', stepJobType: 'select_music_candidate', toolKey: 'music_private_audio_analysis', toolVersion: '1.0.0',
      operationKey: 'select_qualified_candidate', operationProfileKey: 'music.profile.candidate_selection.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_candidate_analysis_v1'], outputBindings: ['music_candidate_selection_decision_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.editorial.fit.v1', jobs: ['fit_music_to_edit'], role: 'primary', requiredInputs: ['music_candidate_analysis_v1', 'music_cue_sheet_v1'],
    outputs: ['music_beat_phrase_map_v1', 'music_editorial_plan_v1', 'music_placement_manifest_v1'], steps: [step({
      stepKey: 'fit', stepJobType: 'fit_music_to_edit', toolKey: 'music_sync_engine', toolVersion: '1.0.0',
      operationKey: 'compile_frame_accurate_music_placement', operationProfileKey: 'music.profile.editorial_fit.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_candidate_analysis_v1', 'music_cue_sheet_v1'],
      outputBindings: ['music_beat_phrase_map_v1', 'music_editorial_plan_v1', 'music_placement_manifest_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.sync.picture.v1', jobs: ['sync_music_to_picture'], role: 'primary', requiredInputs: ['music_candidate_analysis_v1', 'music_cue_sheet_v1'],
    outputs: ['music_beat_phrase_map_v1', 'music_editorial_plan_v1', 'music_placement_manifest_v1'], steps: [step({
      stepKey: 'sync', stepJobType: 'sync_music_to_picture', toolKey: 'music_sync_engine', toolVersion: '1.0.0',
      operationKey: 'compile_frame_accurate_music_placement', operationProfileKey: 'music.profile.music_sync.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_candidate_analysis_v1', 'music_cue_sheet_v1'],
      outputBindings: ['music_beat_phrase_map_v1', 'music_editorial_plan_v1', 'music_placement_manifest_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.support.sound_processing.v1', jobs: ['prepare_music_stem', 'request_sound_processing', 'plan_music_mix'], role: 'support',
    requiredInputs: ['music_editorial_plan_v1', 'approved_private_music_audio'],
    outputs: ['processed_music_audio_v1', 'music_stem_audio_v1', 'music_sound_support_receipt_v1'], steps: [step({
      stepKey: 'sound_support', stepJobType: 'request_sound_processing', toolKey: 'canonical_sound_v4_port', toolVersion: '4.0.0',
      operationKey: 'process_music_through_public_sound_service', operationProfileKey: 'music.profile.sound_v4_support.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_editorial_plan_v1', 'approved_private_music_audio'],
      outputBindings: ['processed_music_audio_v1', 'music_stem_audio_v1', 'music_sound_support_receipt_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.qa.cue.v1', jobs: ['qa_music'], role: 'qa', requiredInputs: ['approved_private_music_audio'],
    outputs: ['music_candidate_analysis_v1', 'music_technical_qa_v1'], steps: [step({
      stepKey: 'qa_audio', stepJobType: 'qa_music', toolKey: 'music_private_audio_analysis', toolVersion: '1.0.0',
      operationKey: 'analyze_audio_bytes', operationProfileKey: 'music.profile.cue_qa.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['approved_private_music_audio'], outputBindings: ['music_candidate_analysis_v1', 'music_technical_qa_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.qa.continuity.v1', jobs: ['qa_music'], role: 'qa',
    requiredInputs: ['music_candidate_analysis_v1', 'music_placement_manifest_v1', 'music_sound_support_receipt_v1'],
    outputs: ['music_qa_report_v1', 'music_continuity_report_v1'], steps: [step({
      stepKey: 'continuity_qa', stepJobType: 'qa_music', toolKey: 'music_qa_engine', toolVersion: '1.0.0',
      operationKey: 'run_music_continuity_qa', operationProfileKey: 'music.profile.continuity_qa.v1', required: true,
      dependencyStepKeys: [],
      inputBindings: ['music_candidate_analysis_v1', 'music_placement_manifest_v1', 'music_sound_support_receipt_v1'],
      outputBindings: ['music_qa_report_v1', 'music_continuity_report_v1'], failureBehavior: 'fail_route',
    })],
  }),
  planningRoute('revise_music', 'music.route.revise.localized.v1'),
  planningRoute('promote_music_library_candidate', 'music.route.promote.library_candidate.v1'),
  route({
    key: 'music.route.handoff.final_composition.v1', jobs: ['handoff_music_to_final_composition'], role: 'primary',
    requiredInputs: ['music_placement_manifest_v1', 'music_qa_report_v1'], outputs: ['music_final_composition_handoff_v1'], steps: [step({
      stepKey: 'handoff', stepJobType: 'handoff_music_to_final_composition', toolKey: 'music_handoff_service', toolVersion: '1.0.0',
      operationKey: 'create_final_music_handoff', operationProfileKey: 'music.profile.final_handoff.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_placement_manifest_v1', 'music_qa_report_v1'],
      outputBindings: ['music_final_composition_handoff_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.no_music.v1', jobs: [
      'decide_music_need', 'decide_music_silence', 'plan_scene_music', 'plan_boundary_music', 'full_video_music_pass',
      'support_motion_studio_music', 'support_living_frame_music', 'support_3d_music', 'support_transition_music', 'support_graphic_design_music',
    ], role: 'no_music', requiredInputs: ['music_assignment_v1'], outputs: ['intentional_no_music_handoff_v1'], steps: [step({
      stepKey: 'no_music', stepJobType: 'decide_music_need', toolKey: 'music_handoff_service', toolVersion: '1.0.0',
      operationKey: 'create_no_music_handoff', operationProfileKey: 'music.profile.no_music.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_assignment_v1'], outputBindings: ['intentional_no_music_handoff_v1'], failureBehavior: 'fail_route',
    })],
  }),
  route({
    key: 'music.route.ambience_only_handoff.v1', jobs: ['decide_music_need', 'decide_music_silence', 'plan_scene_music', 'plan_boundary_music', 'full_video_music_pass'],
    role: 'lower_cost', requiredInputs: ['music_assignment_v1'], outputs: ['music_ambience_only_handoff_v1'], steps: [step({
      stepKey: 'ambience_handoff', stepJobType: 'decide_music_need', toolKey: 'music_handoff_service', toolVersion: '1.0.0',
      operationKey: 'create_ambience_only_handoff', operationProfileKey: 'music.profile.ambience_only.v1', required: true,
      dependencyStepKeys: [], inputBindings: ['music_assignment_v1'], outputBindings: ['music_ambience_only_handoff_v1'], failureBehavior: 'fail_route',
    })], limitations: ['Non-musical ambience execution belongs to canonical Sound.'],
  }),
]

const routeRegistry = new Map<string, Readonly<MusicToolRouteManifest>>()
for (const item of routes) {
  const identity = `${item.routeKey}@${item.routeVersion}`
  const existing = routeRegistry.get(identity)
  if (existing && existing.routeHash !== item.routeHash) throw new Error(`Immutable Music route collision ${identity}.`)
  routeRegistry.set(identity, item)
}

export const MUSIC_TOOL_ROUTE_MANIFESTS = Object.freeze([...routeRegistry.values()])

export function getMusicToolRouteManifest(routeKey: string, routeVersion = '1.0.0'): Readonly<MusicToolRouteManifest> | undefined {
  return routeRegistry.get(`${routeKey}@${routeVersion}`)
}

export function assertMusicToolRouteManifestHash(route: Readonly<MusicToolRouteManifest>): void {
  if (calculateMusicRouteHash(route) !== route.routeHash) throw new Error(`Music route hash is stale: ${route.routeKey}.`)
}
