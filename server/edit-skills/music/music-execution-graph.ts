import { hashMusicValue, type CanonicalMusicSkillRequest, type MusicRouteBinding } from '../../music/music-contracts'
import type { MusicCueSheetPayload, MusicNeedDecisionPayload } from '../../music/music-supervision'
import type { MusicArtifactEnvelope } from '../../music/music-contracts'
import { getMusicToolRouteManifest } from '../../music/music-tool-routes'
import { musicSkillCapabilityManifest } from './music-capability-manifest'

export type MusicExecutionUnitKind =
  | 'context_study' | 'music_need_decision' | 'narrative_arc_planning' | 'cue_grouping' | 'cue_planning'
  | 'acquisition' | 'provider_attempt' | 'candidate_ingest' | 'candidate_analysis'
  | 'candidate_selection' | 'music_editorial' | 'music_sync' | 'sound_support'
  | 'cue_qa' | 'continuity_qa' | 'revision' | 'handoff' | 'no_music' | 'planning_only'

export interface CompiledMusicOperationSpec {
  operationSpecVersion: 'music-operation-spec-v3'
  operationSpecHash: string
  unitKind: MusicExecutionUnitKind
  cueId?: string
  targetRange?: { rangeId: string; startFrame: number; endFrameExclusive: number }
  sourceArtifactIds: string[]
  routeKey: string
  routeVersion: string
  routeHash: string
  namedInputs: string[]
  expectedOutputs: string[]
  requiredOperations: string[]
  parameters: Record<string, string | number | boolean | string[]>
  parameterSourcePolicy: 'typed_sources_only'
  arbitraryArgumentsAccepted: false
  arbitraryPathsAccepted: false
  callerSelectedProviderAccepted: false
}

export interface MusicExecutionUnit {
  unitId: string
  cueId?: string
  unitKind: MusicExecutionUnitKind
  targetRange?: { rangeId: string; startFrame: number; endFrameExclusive: number }
  jobType: string
  capabilityKey: string
  route: { routeKey: string; routeVersion: string; routeHash: string }
  operationSpec: CompiledMusicOperationSpec
  inputArtifactIds: string[]
  inputArtifactHashes: string[]
  dependencyUnitIds: string[]
  idempotencyKey: string
  expectedOutputs: string[]
  attemptPolicyKey: string
  required: boolean
  failurePolicy: 'fail_graph' | 'block_dependents' | 'preserve_partial_success'
}

export interface MusicExecutionGraph {
  graphId: string
  graphVersion: '3.2.0'
  graphHash: string
  requestId: string
  parentJobType: string
  manifestHash: string
  timelineBinding: CanonicalMusicSkillRequest['timelineBinding']
  units: MusicExecutionUnit[]
  dependencyEdges: Array<{ fromUnitId: string; toUnitId: string }>
  expectedFinalOutputs: string[]
  completionPolicy: 'all_required_units_or_typed_partial_result'
}

function routeRef(routeKey: string): { routeKey: string; routeVersion: string; routeHash: string } {
  const route = getMusicToolRouteManifest(routeKey)
  if (!route) throw new Error(`Music execution graph cannot resolve ${routeKey}.`)
  return { routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash }
}

function operationSpec(input: Omit<CompiledMusicOperationSpec, 'operationSpecVersion' | 'operationSpecHash' |
  'parameterSourcePolicy' | 'arbitraryArgumentsAccepted' | 'arbitraryPathsAccepted' | 'callerSelectedProviderAccepted'>): CompiledMusicOperationSpec {
  const base = {
    operationSpecVersion: 'music-operation-spec-v3' as const,
    ...structuredClone(input),
    parameterSourcePolicy: 'typed_sources_only' as const,
    arbitraryArgumentsAccepted: false as const,
    arbitraryPathsAccepted: false as const,
    callerSelectedProviderAccepted: false as const,
  }
  return { ...base, operationSpecHash: hashMusicValue(base) }
}

function unit(input: Omit<MusicExecutionUnit, 'operationSpec'> & {
  namedInputs: string[]
  operations: string[]
  parameters?: Record<string, string | number | boolean | string[]>
}): MusicExecutionUnit {
  const { namedInputs, operations, parameters = {}, ...base } = input
  return {
    ...base,
    operationSpec: operationSpec({
      unitKind: base.unitKind,
      ...(base.cueId ? { cueId: base.cueId } : {}),
      ...(base.targetRange ? { targetRange: base.targetRange } : {}),
      sourceArtifactIds: base.inputArtifactIds,
      routeKey: base.route.routeKey,
      routeVersion: base.route.routeVersion,
      routeHash: base.route.routeHash,
      namedInputs,
      expectedOutputs: base.expectedOutputs,
      requiredOperations: operations,
      parameters,
    }),
  }
}

function acquisitionJobType(decision: MusicRouteBinding['acquisitionDecision'], routeKey?: string): string {
  if (decision === 'preserve_source_music') return 'fit_music_to_edit'
  if (decision === 'user_provided_music') return 'select_user_provided_music'
  if (decision === 'project_music') return 'search_project_music'
  if (decision === 'workspace_music') return 'search_workspace_music'
  if (decision === 'internal_music') return 'search_authorized_music_library'
  if (decision === 'generate_original_music') return routeKey?.includes('.variation.')
    ? 'generate_music_variation' : 'generate_original_music'
  return 'decide_music_need'
}

export function compileCanonicalMusicExecutionGraph(input: {
  request: CanonicalMusicSkillRequest
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  cueGrouping: MusicArtifactEnvelope
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: MusicRouteBinding[]
}): MusicExecutionGraph {
  const { request } = input
  const units: MusicExecutionUnit[] = []
  const add = (candidate: MusicExecutionUnit): void => {
    if (units.some((item) => item.unitId === candidate.unitId)) throw new Error(`Duplicate Music execution unit ${candidate.unitId}.`)
    units.push(candidate)
  }
  const globalRoute = routeRef('music.route.study.video_context.v3')
  add(unit({
    unitId: `music-unit-${request.requestId}-context`, unitKind: 'context_study', jobType: 'study_video_music_context',
    capabilityKey: 'music.study_video_music_context', route: globalRoute,
    inputArtifactIds: [], inputArtifactHashes: request.contextEvidence.map((item) => item.evidenceHash), dependencyUnitIds: [],
    idempotencyKey: `${request.idempotencyKey}:context`, expectedOutputs: ['music_context_study_v2'],
    attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'fail_graph',
    namedInputs: ['music_assignment_v2'], operations: ['study_video_music_context'],
  }))
  add(unit({
    unitId: `music-unit-${request.requestId}-need`, unitKind: 'music_need_decision', jobType: 'decide_music_need',
    capabilityKey: 'music.decide_music_need', route: routeRef('music.route.decide.need.v3'),
    inputArtifactIds: [input.need.artifactId], inputArtifactHashes: [input.need.artifactHash],
    dependencyUnitIds: [`music-unit-${request.requestId}-context`], idempotencyKey: `${request.idempotencyKey}:need`,
    expectedOutputs: ['music_need_decision_v2'], attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true,
    failurePolicy: 'fail_graph', namedInputs: ['music_context_study_v2'], operations: ['decide_music_need'],
  }))
  add(unit({
    unitId: `music-unit-${request.requestId}-cue-grouping`, unitKind: 'cue_grouping', jobType: 'create_music_cue_sheet',
    capabilityKey: 'music.create_music_cue_sheet', route: routeRef('music.route.plan.cue_grouping.v3'),
    inputArtifactIds: [input.cueGrouping.artifactId], inputArtifactHashes: [input.cueGrouping.artifactHash],
    dependencyUnitIds: [`music-unit-${request.requestId}-need`], idempotencyKey: `${request.idempotencyKey}:cue-grouping`,
    expectedOutputs: ['music_cue_grouping_plan_v3'], attemptPolicyKey: 'music.attempt.local_idempotent.v3', required: true,
    failurePolicy: 'fail_graph', namedInputs: ['music_assignment_v2'], operations: ['group_music_cues'],
  }))
  add(unit({
    unitId: `music-unit-${request.requestId}-cue-sheet`, unitKind: 'cue_planning', jobType: 'create_music_cue_sheet',
    capabilityKey: 'music.create_music_cue_sheet', route: routeRef('music.route.plan.cue_sheet.v3'),
    inputArtifactIds: [input.cueSheet.artifactId], inputArtifactHashes: [input.cueSheet.artifactHash],
    dependencyUnitIds: [`music-unit-${request.requestId}-cue-grouping`], idempotencyKey: `${request.idempotencyKey}:cue-sheet`,
    expectedOutputs: ['music_cue_sheet_v2', 'music_cue_constraint_resolution_v3'],
    attemptPolicyKey: 'music.attempt.local_idempotent.v3', required: true,
    failurePolicy: 'fail_graph', namedInputs: ['music_need_decision_v2'], operations: ['create_music_cue_sheet'],
  }))
  const terminalCueUnits: string[] = []
  for (const binding of input.routeBindings) {
    const cue = input.cueSheet.payload.cues.find((candidate) => candidate.cueId === binding.cueId)
    const targetRange = cue?.exactRange ?? request.scopeAuthority.authorizedMusicWriteRanges.find((range) =>
      binding.cueId.endsWith(range.rangeId))
    if (!targetRange) throw new Error(`Music graph cannot resolve exact cue range for ${binding.cueId}.`)
    const acquireId = `music-unit-${request.requestId}-${binding.cueId}-acquire`
    const noAction = binding.acquisitionDecision === 'no_music' || binding.acquisitionDecision === 'intentional_silence' ||
      binding.acquisitionDecision === 'ambience_only'
    add(unit({
      unitId: acquireId, cueId: binding.cueId, unitKind: noAction ? 'no_music' :
        binding.acquisitionDecision === 'generate_original_music' ? 'provider_attempt' : 'acquisition',
      targetRange, jobType: acquisitionJobType(binding.acquisitionDecision, binding.routeKey),
      capabilityKey: `music.${acquisitionJobType(binding.acquisitionDecision, binding.routeKey)}`,
      route: { routeKey: binding.routeKey, routeVersion: binding.routeVersion, routeHash: binding.routeHash },
      inputArtifactIds: binding.sourceBindings, inputArtifactHashes: request.inputAssetRefs.filter((asset) =>
        binding.sourceBindings.includes(asset.artifactId)).map((asset) => asset.checksumSha256),
      dependencyUnitIds: [`music-unit-${request.requestId}-cue-sheet`], idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:acquire`,
      expectedOutputs: getMusicToolRouteManifest(binding.routeKey, binding.routeVersion)?.producedArtifactTypes ?? [],
      attemptPolicyKey: binding.attemptPolicyKey, required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['music_assignment_v2'], operations: [binding.acquisitionDecision],
      parameters: { cueId: binding.cueId, rangeId: targetRange.rangeId },
    }))
    if (noAction || request.requestedExecutionMode === 'planning') {
      terminalCueUnits.push(acquireId)
      continue
    }
    if (!cue) throw new Error(`Executable Music route lacks canonical cue ${binding.cueId}.`)
    const analyzeId = `music-unit-${request.requestId}-${binding.cueId}-analyze`
    add(unit({
      unitId: analyzeId, cueId: binding.cueId, unitKind: 'candidate_analysis', targetRange,
      jobType: 'analyze_music_candidate', capabilityKey: 'music.analyze_music_candidate', route: routeRef('music.route.analyze.candidate.v3'),
      inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [acquireId],
      idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:analyze`, expectedOutputs: ['music_candidate_analysis_v2'],
      attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['untrusted_or_approved_music_candidate'], operations: ['analyze_audio_bytes'],
    }))
    const selectId = `music-unit-${request.requestId}-${binding.cueId}-select`
    add(unit({
      unitId: selectId, cueId: binding.cueId, unitKind: 'candidate_selection', targetRange,
      jobType: 'select_music_candidate', capabilityKey: 'music.select_music_candidate', route: routeRef('music.route.select.candidate.v3'),
      inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [analyzeId],
      idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:select`, expectedOutputs: ['music_candidate_selection_decision_v2'],
      attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['music_candidate_analysis_v2'], operations: ['select_qualified_candidate'],
    }))
    const syncId = `music-unit-${request.requestId}-${binding.cueId}-sync`
    add(unit({
      unitId: syncId, cueId: binding.cueId, unitKind: 'music_sync', targetRange,
      jobType: 'sync_music_to_picture', capabilityKey: 'music.sync_music_to_picture', route: routeRef('music.route.sync.picture.v3'),
      inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [selectId],
      idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:sync`,
      expectedOutputs: ['music_beat_phrase_map_v2', 'music_editorial_plan_v2', 'music_placement_manifest_v2',
        'music_anchor_alignment_decision_v3', 'music_mix_intent_manifest_v2'],
      attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['music_candidate_analysis_v2', 'music_cue_sheet_v2'], operations: ['compile_frame_accurate_music_placement'],
    }))
    if (cue.soundProcessingIntent.length === 0) {
      terminalCueUnits.push(syncId)
      continue
    }
    const soundId = `music-unit-${request.requestId}-${binding.cueId}-sound`
    add(unit({
      unitId: soundId, cueId: binding.cueId, unitKind: 'sound_support', targetRange,
      jobType: 'request_sound_processing', capabilityKey: 'music.request_sound_processing', route: routeRef('music.route.support.sound_processing.v3'),
      inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [syncId],
      idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:sound`,
      expectedOutputs: ['processed_music_audio_v2', 'music_stem_audio_v2', 'music_sound_support_receipt_v2'],
      attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['music_editorial_plan_v2', 'approved_private_music_audio'], operations: ['process_music_through_public_sound_service'],
    }))
    const qaId = `music-unit-${request.requestId}-${binding.cueId}-qa`
    add(unit({
      unitId: qaId, cueId: binding.cueId, unitKind: 'cue_qa', targetRange,
      jobType: 'qa_music', capabilityKey: 'music.qa_music', route: routeRef('music.route.qa.cue.v3'),
      inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [soundId],
      idempotencyKey: `${request.idempotencyKey}:${binding.cueId}:qa`, expectedOutputs: ['music_technical_qa_v2'],
      attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
      namedInputs: ['processed_music_audio_v2'], operations: ['analyze_audio_bytes'],
    }))
    terminalCueUnits.push(qaId)
  }
  const continuityId = `music-unit-${request.requestId}-continuity`
  add(unit({
    unitId: continuityId, unitKind: request.requestedExecutionMode === 'planning' ? 'planning_only' : 'continuity_qa',
    jobType: 'qa_music', capabilityKey: 'music.qa_music', route: routeRef('music.route.qa.continuity.v3'),
    inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: terminalCueUnits,
    idempotencyKey: `${request.idempotencyKey}:continuity`, expectedOutputs: ['music_qa_report_v2', 'music_continuity_report_v2'],
    attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
    namedInputs: ['cue_qa_receipts'], operations: ['qa_music'],
  }))
  const handoffId = `music-unit-${request.requestId}-handoff`
  add(unit({
    unitId: handoffId, unitKind: 'handoff', jobType: 'handoff_music_to_final_composition',
    capabilityKey: 'music.handoff_music_to_final_composition', route: routeRef('music.route.handoff.final_composition.v3'),
    inputArtifactIds: [], inputArtifactHashes: [], dependencyUnitIds: [continuityId],
    idempotencyKey: `${request.idempotencyKey}:handoff`, expectedOutputs: ['music_final_composition_handoff_v2'],
    attemptPolicyKey: 'music.attempt.local_idempotent.v2', required: true, failurePolicy: 'preserve_partial_success',
    namedInputs: ['music_placement_manifest_v2', 'music_qa_report_v2'], operations: ['create_final_music_handoff'],
  }))
  const dependencyEdges = units.flatMap((candidate) => candidate.dependencyUnitIds.map((dependency) => ({
    fromUnitId: dependency, toUnitId: candidate.unitId,
  })))
  const base = {
    graphId: `music.graph.${request.requestId}`,
    graphVersion: '3.2.0' as const,
    requestId: request.requestId,
    parentJobType: request.jobType,
    manifestHash: musicSkillCapabilityManifest.manifestHash,
    timelineBinding: request.timelineBinding,
    units,
    dependencyEdges,
    expectedFinalOutputs: ['music_final_composition_handoff_v2'],
    completionPolicy: 'all_required_units_or_typed_partial_result' as const,
  }
  return { ...base, graphHash: hashMusicValue(base) }
}

export function topologicalMusicExecutionUnits(graph: MusicExecutionGraph): MusicExecutionUnit[] {
  const units = new Map(graph.units.map((unit) => [unit.unitId, unit]))
  const ordered: MusicExecutionUnit[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (unit: MusicExecutionUnit): void => {
    if (visiting.has(unit.unitId)) throw new Error(`Music execution graph cycle at ${unit.unitId}.`)
    if (visited.has(unit.unitId)) return
    visiting.add(unit.unitId)
    for (const dependencyId of unit.dependencyUnitIds) {
      const dependency = units.get(dependencyId)
      if (!dependency) throw new Error(`Music execution graph missing dependency ${dependencyId}.`)
      visit(dependency)
    }
    visiting.delete(unit.unitId)
    visited.add(unit.unitId)
    ordered.push(unit)
  }
  graph.units.forEach(visit)
  return ordered
}
