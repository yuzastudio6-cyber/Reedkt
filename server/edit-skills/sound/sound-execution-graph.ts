import { createHash } from 'node:crypto'
import type {
  CanonicalSoundCue,
  CanonicalSoundRequest,
  CompositeSoundExecutionPolicy,
  SoundArtifactRef,
  SoundFrameRange,
  SoundMixAutomation,
} from '../../sound/sound-contracts'
import type { SoundControllerResponse } from '../../sound/sound-controller'
import { getSoundToolRouteManifest } from '../../sound/sound-tool-route-manifest'
import { rationalSecondsToFrames } from '../core/timeline-rate'
import { validateSoundExecutionGraphMode } from './sound-capability-mode-matrix'

export type SoundExecutionUnitKind =
  | 'audio_operation'
  | 'provider_generation'
  | 'synchronization'
  | 'analysis'
  | 'mix_stem'
  | 'qa_handoff'
  | 'no_sound'
  | 'planning_only'

export type SoundOperationParameterSource =
  | 'caller_directive'
  | 'request_quality_policy'
  | 'approved_timeline_rate'
  | 'approved_range'
  | 'planned_cue'
  | 'planned_mix_automation'
  | 'music_technical_automation_extension'
  | 'published_operation_policy'

export interface CompiledSoundParameterBinding {
  parameterKey: string
  source: SoundOperationParameterSource
  sourceRef: string
  value: string | number | boolean | number[]
}

export interface CompiledSoundOperationSpec {
  schemaVersion: 'compiled-sound-operation-spec-v1'
  operationSpecId: string
  operation: string
  sourceArtifactIds: string[]
  targetRange: SoundFrameRange
  cueId?: string
  eventAnchorId?: string
  mixAutomationId?: string
  parameterBindings: CompiledSoundParameterBinding[]
  timelineRate: CanonicalSoundRequest['timelineRate']
  parameterSourcePolicy: 'typed_sources_only'
  arbitraryArgumentsAccepted: false
  operationSpecHash: string
}

export interface SoundExecutionUnit {
  unitId: string
  unitKind: SoundExecutionUnitKind
  requestedJobType: string
  capabilityKey: string
  routeJobType: string
  route: {
    routeKey: string
    routeVersion: string
    routeHash: string
  }
  cue?: CanonicalSoundCue
  targetRange: SoundFrameRange
  sourceArtifacts: SoundArtifactRef[]
  visualDependencyArtifactId?: string
  automation?: SoundMixAutomation
  operationSpec: CompiledSoundOperationSpec
  dependsOnUnitIds: string[]
  planningLimitation?: string
}

export interface SoundExecutionDependencyEdge {
  prerequisiteUnitId: string
  dependentUnitId: string
  artifactFlow: 'all_selected_artifacts'
}

export interface SoundExecutionGraph {
  schemaVersion: 'sound-execution-graph-v2'
  graphId: string
  requestId: string
  manifestHash: string
  timelineManifestHash: string
  timelineRate: CanonicalSoundRequest['timelineRate']
  compositeExecutionPolicy?: CompositeSoundExecutionPolicy
  completionPolicy: 'all_required_units_or_typed_partial_result'
  dependencyEdges: SoundExecutionDependencyEdge[]
  units: SoundExecutionUnit[]
  graphHash: string
}

const compositeJobs = new Set([
  'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
  'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
  'support_transition_sound', 'support_graphic_design_sound',
])

const planningOnlyJobs = new Set(['study_visual_sound_events', 'search_sound_library', 'revise_sound'])

const providerJobs = new Set([
  'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
  'generate_foley', 'generate_ambience',
])

const syncJobs = new Set(['sync_audio_to_visual', 'align_sound_transient'])
const analysisJobs = new Set(['study_source_audio', 'study_reference_sound', 'create_sound_dna'])
const qaJobs = new Set(['qa_sound', 'handoff_sound_to_final_composition'])

export function compileCanonicalSoundExecutionGraph(input: {
  request: CanonicalSoundRequest
  controller: SoundControllerResponse
}): SoundExecutionGraph {
  const { request, controller } = input
  const units = compositeJobs.has(request.requestedJobType) && request.requiredQualificationMode !== 'planning'
    ? compileCompositeUnits(request, controller)
    : compileDirectUnits(request, controller)
  if (units.length === 0) throw new Error('Sound execution graph contains no independently executable unit.')
  validateUnitDependencies(units)
  const dependencyEdges = units.flatMap((dependent) => dependent.dependsOnUnitIds.map((prerequisiteUnitId) => ({
    prerequisiteUnitId,
    dependentUnitId: dependent.unitId,
    artifactFlow: 'all_selected_artifacts' as const,
  })))
  const compositeExecutionPolicy: CompositeSoundExecutionPolicy | undefined = compositeJobs.has(request.requestedJobType)
    ? {
        schemaVersion: 'composite-sound-execution-policy-v1',
        parentJobType: request.requestedJobType,
        parentMayExecuteDirectly: false,
        childRoutesMustBeExactAndModeQualified: true,
        privateInternalExecution: 'admit_only_when_every_required_child_route_is_qualified',
        fixtureExecution: 'admit_fixture_routes_and_internal_routes',
        productionExecution: 'admit_only_production_qualified_child_routes',
        completionPolicy: 'all_required_units_or_typed_partial_result',
      }
    : undefined
  const core = {
    schemaVersion: 'sound-execution-graph-v2' as const,
    graphId: stableId('sound-graph', request.requestId, request.soundManifestHash),
    requestId: request.requestId,
    manifestHash: request.soundManifestHash,
    timelineManifestHash: request.timelineManifestHash,
    timelineRate: request.timelineRate,
    compositeExecutionPolicy,
    completionPolicy: 'all_required_units_or_typed_partial_result' as const,
    dependencyEdges,
    units,
  }
  validateSoundExecutionGraphMode({
    jobType: request.requestedJobType,
    mode: request.requiredQualificationMode,
    compositePolicy: compositeExecutionPolicy,
    units,
  })
  return { ...core, graphHash: hash(core) }
}

function compileCompositeUnits(
  request: CanonicalSoundRequest,
  controller: SoundControllerResponse,
): SoundExecutionUnit[] {
  const result = controller.result
  if (result.cueManifest.cues.length === 0) {
    const range = request.assignmentScope.authorizedAudioWriteRanges[0] ?? request.assignmentScope.inspectRanges[0]
    if (!range) throw new Error('Composite No-Sound execution requires a bounded range.')
    return [createUnit({
      request, index: 0, kind: 'no_sound', route: exactRoute('sound.route.no_sound.v1'),
      capabilityKey: `sound.${request.requestedJobType}`, routeJobType: request.requestedJobType,
      range, sources: [],
    })]
  }
  const automations = new Map(result.mixAutomationManifest.automations.map((item) => [item.cueId, item]))
  const approvedSources = allApprovedSources(request, result.selectedAssetVersions)
  const acquisitionUnits = result.cueManifest.cues.map((cue, index) => {
    const child = controller.childWorkItems.find((item) => item.eventAnchorId === cue.eventAnchorId)
    if (!child) throw new Error(`Composite Sound cue ${cue.cueId} has no exact child route binding.`)
    const routeJobType = child.routeBinding.routeKey === 'sound.route.generate.video_sfx.mirelo.v1'
      ? 'generate_video_conditioned_sfx'
      : child.routeBinding.routeKey === 'sound.route.generate.text_sfx.v1'
        ? 'generate_text_conditioned_sfx'
        : child.routeBinding.routeKey === 'sound.route.acquire.internal_library.v1'
          ? 'search_sound_library'
          : 'extract_project_owned_sound'
    const capabilityKey = `sound.${routeJobType}`
    const selectedSource = cue.selectedSourceArtifactId
      ? approvedSources.get(cue.selectedSourceArtifactId)
      : undefined
    const provider = cue.acquisitionDecision === 'generate_original'
    return createUnit({
      request, index, kind: provider ? 'provider_generation' : 'audio_operation',
      route: {
        routeKey: child.routeBinding.routeKey,
        routeVersion: child.routeBinding.routeVersion,
        routeHash: child.routeBinding.routeHash,
      },
      capabilityKey, routeJobType,
      range: rangeForCue(cue), cue, automation: automations.get(cue.cueId),
      sources: selectedSource ? [selectedSource] : provider ? [] : sourceForIndex(request.sourceAudioRefs, index),
      visualDependencyArtifactId: visualForCue(request, cue)?.artifact.artifactId,
    })
  })
  const units: SoundExecutionUnit[] = [...acquisitionUnits]
  for (const [rangeIndex, range] of request.assignmentScope.authorizedAudioWriteRanges.entries()) {
    const prerequisites = acquisitionUnits.filter((candidate) => overlaps(range, candidate.targetRange))
    if (prerequisites.length === 0) continue
    const representativeCue = prerequisites.find((item) => item.cue)?.cue
    const mix = createUnit({
      request, index: 10_000 + rangeIndex, kind: 'mix_stem',
      route: exactRoute('sound.route.mix.scene.v1'),
      capabilityKey: 'sound.create_sound_stem', routeJobType: 'create_sound_stem',
      range, cue: representativeCue,
      automation: representativeCue ? automations.get(representativeCue.cueId) : undefined,
      sources: [], dependsOnUnitIds: prerequisites.map((item) => item.unitId),
    })
    units.push(mix)
    units.push(createUnit({
      request, index: 20_000 + rangeIndex, kind: 'qa_handoff',
      route: exactRoute('sound.route.qa.final_sound.v1'),
      capabilityKey: 'sound.handoff_sound_to_final_composition',
      routeJobType: 'handoff_sound_to_final_composition', range,
      sources: [], dependsOnUnitIds: [mix.unitId],
    }))
  }
  return units
}

function compileDirectUnits(
  request: CanonicalSoundRequest,
  controller: SoundControllerResponse,
): SoundExecutionUnit[] {
  const result = controller.result
  const primary = result.toolRouteBindings[0]
  if (!primary) throw new Error('Cannot compile Sound execution without an exact route binding.')
  const route = { routeKey: primary.routeKey, routeVersion: primary.routeVersion, routeHash: primary.routeHash }
  const automations = new Map(result.mixAutomationManifest.automations.map((item) => [item.cueId, item]))
  const units: SoundExecutionUnit[] = []
  const common = {
    capabilityKey: result.capabilityEntryKey,
    routeJobType: request.requestedJobType,
  }
  if (primary.routeKey === 'sound.route.no_sound.v1') {
    const range = request.assignmentScope.authorizedAudioWriteRanges[0] ?? request.assignmentScope.inspectRanges[0]
    if (!range) throw new Error('No-Sound execution still requires a bounded read or write range.')
    units.push(createUnit({ request, index: 0, kind: 'no_sound', route, range, sources: [], ...common }))
  } else if (planningOnlyJobs.has(request.requestedJobType) ||
    (compositeJobs.has(request.requestedJobType) && request.requiredQualificationMode === 'planning')) {
    for (const [index, range] of executionRanges(request, result.cueManifest.cues).entries()) {
      units.push(createUnit({
        request, index, kind: 'planning_only', route, range, sources: [], ...common,
        limitation: 'This parent capability is planning-qualified; execution is admitted only through exact child routes.',
      }))
    }
  } else if (providerJobs.has(request.requestedJobType)) {
    for (const [index, cue] of result.cueManifest.cues.entries()) {
      units.push(createUnit({
        request, index, kind: 'provider_generation', route,
        range: request.requestedJobType === 'generate_ambience'
          ? request.assignmentScope.authorizedAudioWriteRanges.find((candidate) =>
            cue.startFrame >= candidate.startFrame && cue.endFrameExclusive <= candidate.endFrameExclusive) ?? rangeForCue(cue)
          : rangeForCue(cue),
        cue, automation: automations.get(cue.cueId), sources: [],
        visualDependencyArtifactId: visualForCue(request, cue)?.artifact.artifactId,
        ...common,
      }))
    }
  } else if (syncJobs.has(request.requestedJobType)) {
    const cues = result.cueManifest.cues.length > 0
      ? result.cueManifest.cues
      : request.eventAnchors.map((event, index) => syntheticCue(request, event, index))
    for (const [index, cue] of cues.entries()) {
      units.push(createUnit({
        request, index, kind: 'synchronization', route, range: rangeForCue(cue), cue,
        automation: automations.get(cue.cueId), sources: sourceForIndex(request.sourceAudioRefs, index),
        visualDependencyArtifactId: visualForCue(request, cue)?.artifact.artifactId, ...common,
      }))
    }
  } else if (analysisJobs.has(request.requestedJobType)) {
    const sources = request.requestedJobType === 'study_reference_sound' || request.requestedJobType === 'create_sound_dna'
      ? request.referenceSoundInputs : request.sourceAudioRefs
    const range = executionRanges(request, result.cueManifest.cues)[0]
    if (!range) throw new Error('Sound analysis requires an approved inspection range.')
    sources.forEach((source, index) => units.push(createUnit({
      request, index, kind: 'analysis', route, range, sources: [source], ...common,
    })))
  } else if (qaJobs.has(request.requestedJobType)) {
    const sources = request.sourceAudioRefs.length > 0
      ? request.sourceAudioRefs : request.completedSkillWork.map((item) => item.artifact)
    const range = executionRanges(request, result.cueManifest.cues)[0]
    if (!range) throw new Error('Sound QA requires an approved inspection range.')
    sources.forEach((source, index) => units.push(createUnit({
      request, index, kind: 'qa_handoff', route, range, sources: [source], ...common,
    })))
  } else {
    for (const [index, range] of executionRanges(request, result.cueManifest.cues).entries()) {
      const cue = result.cueManifest.cues.find((item) => overlaps(range, rangeForCue(item)))
      const plannedAutomation = cue ? automations.get(cue.cueId) : undefined
      const automation = request.musicTechnicalAutomationExtension
        ? musicTechnicalAutomation(request, cue?.cueId ?? request.musicTechnicalAutomationExtension.musicCueId)
        : plannedAutomation
      units.push(createUnit({
        request, index, kind: ['mix_sound_layers', 'create_sound_stem', 'edit_music_technical_automation'].includes(request.requestedJobType)
          ? 'mix_stem' : 'audio_operation',
        route, range, cue, automation,
        sources: ['mix_sound_layers', 'create_sound_stem', 'edit_music_technical_automation'].includes(request.requestedJobType)
          ? request.sourceAudioRefs : sourceForIndex(request.sourceAudioRefs, index),
        ...common,
      }))
    }
  }
  return units
}

function musicTechnicalAutomation(
  request: CanonicalSoundRequest,
  cueId: string,
): SoundMixAutomation {
  const extension = request.musicTechnicalAutomationExtension
  if (!extension) throw new Error('Music technical automation extension is missing.')
  return {
    cueId,
    baseGainDb: extension.baseGainDb,
    gainEnvelope: structuredClone(extension.gainEnvelope),
    fadeInFrames: extension.fadeInFrames,
    fadeOutFrames: extension.fadeOutFrames,
    dialogueDuckingDb: extension.dialogueDucking.attenuationDb,
    duckAttackFrames: extension.dialogueDucking.attackFrames,
    duckReleaseFrames: extension.dialogueDucking.releaseFrames,
    protectedSpeechRanges: structuredClone(extension.dialogueDucking.protectedSpeechRanges),
    musicInteractionPolicy: 'none',
    eqProfile: extension.eqProfile,
    dynamicsProfile: extension.dynamicsProfile,
    pan: extension.pan,
    distance: extension.distance,
    roomMatch: extension.roomMatch,
    headroomDb: extension.headroomDb,
  }
}

function createUnit(input: {
  request: CanonicalSoundRequest
  index: number
  kind: SoundExecutionUnitKind
  route: SoundExecutionUnit['route']
  capabilityKey: string
  routeJobType: string
  range: SoundFrameRange
  sources: SoundArtifactRef[]
  dependsOnUnitIds?: string[]
  cue?: CanonicalSoundCue
  automation?: SoundMixAutomation
  visualDependencyArtifactId?: string
  limitation?: string
}): SoundExecutionUnit {
  const directives = applicableDirectives(input)
  const directedSourceIds = [...new Set(directives.flatMap((directive) => directive.sourceArtifactIds ?? []))]
  const approvedSources = allApprovedSources(input.request)
  const sources = directedSourceIds.length > 0
    ? directedSourceIds.map((artifactId) => approvedSources.get(artifactId)!)
    : input.sources
  if (directedSourceIds.length > 1 && !['mix_sound_layers', 'create_sound_stem', 'edit_music_technical_automation'].includes(input.routeJobType)) {
    throw new Error('A non-mix Sound execution unit cannot select more than one source artifact.')
  }
  const operationSpecCore = {
    schemaVersion: 'compiled-sound-operation-spec-v1' as const,
    operationSpecId: stableId('sound-operation-spec', input.request.requestId, input.index),
    operation: input.routeJobType,
    sourceArtifactIds: sources.map((source) => source.artifactId),
    targetRange: structuredClone(input.range),
    ...(input.cue ? { cueId: input.cue.cueId, eventAnchorId: input.cue.eventAnchorId } : {}),
    ...(input.automation ? { mixAutomationId: `automation:${input.automation.cueId}` } : {}),
    parameterBindings: compileParameterBindings({ ...input, sources }, directives),
    timelineRate: structuredClone(input.request.timelineRate),
    parameterSourcePolicy: 'typed_sources_only' as const,
    arbitraryArgumentsAccepted: false as const,
  }
  const operationSpec = { ...operationSpecCore, operationSpecHash: hash(operationSpecCore) }
  return {
    unitId: stableId('sound-unit', input.request.requestId, input.index, input.range.rangeId, input.cue?.cueId ?? input.kind),
    unitKind: input.kind,
    requestedJobType: input.request.requestedJobType,
    capabilityKey: input.capabilityKey,
    routeJobType: input.routeJobType,
    route: structuredClone(input.route),
    cue: input.cue ? structuredClone(input.cue) : undefined,
    targetRange: structuredClone(input.range),
    sourceArtifacts: structuredClone(sources),
    visualDependencyArtifactId: input.visualDependencyArtifactId,
    automation: input.automation ? structuredClone(input.automation) : undefined,
    operationSpec,
    dependsOnUnitIds: [...(input.dependsOnUnitIds ?? [])],
    planningLimitation: input.limitation,
  }
}

function compileParameterBindings(
  input: Parameters<typeof createUnit>[0],
  directives: NonNullable<CanonicalSoundRequest['operationDirectives']>,
): CompiledSoundParameterBinding[] {
  const bindings: CompiledSoundParameterBinding[] = [
    binding('startFrame', 'approved_range', input.range.rangeId, input.range.startFrame),
    binding('endFrameExclusive', 'approved_range', input.range.rangeId, input.range.endFrameExclusive),
    binding('timelineRateNumerator', 'approved_timeline_rate', 'request.timelineRate.numerator', input.request.timelineRate.numerator),
    binding('timelineRateDenominator', 'approved_timeline_rate', 'request.timelineRate.denominator', input.request.timelineRate.denominator),
    binding('sampleRate', 'request_quality_policy', 'request.qualityPolicy.sampleRate', input.request.qualityPolicy.sampleRate),
    binding('channels', 'request_quality_policy', 'request.qualityPolicy.channelLayout', input.request.qualityPolicy.channelLayout === 'mono' ? 1 : 2),
    binding('targetLoudnessLufs', 'request_quality_policy', 'request.qualityPolicy.targetLoudnessLufs', input.request.qualityPolicy.targetLoudnessLufs),
    binding('maximumTruePeakDbtp', 'request_quality_policy', 'request.qualityPolicy.maximumTruePeakDbtp', input.request.qualityPolicy.maximumTruePeakDbtp),
  ]
  if (input.cue) bindings.push(binding('hitFrame', 'planned_cue', `cue:${input.cue.cueId}`, input.cue.hitFrame ?? input.cue.startFrame))
  if (input.automation) {
    bindings.push(
      binding('gainDb', 'planned_mix_automation', `automation:${input.automation.cueId}:baseGainDb`, input.automation.baseGainDb),
      binding('fadeInFrames', 'planned_mix_automation', `automation:${input.automation.cueId}:fadeInFrames`, input.automation.fadeInFrames),
      binding('fadeOutFrames', 'planned_mix_automation', `automation:${input.automation.cueId}:fadeOutFrames`, input.automation.fadeOutFrames),
      binding('dialogueDuckingDb', 'planned_mix_automation', `automation:${input.automation.cueId}:dialogueDuckingDb`, input.automation.dialogueDuckingDb),
      binding('duckAttackFrames', 'planned_mix_automation', `automation:${input.automation.cueId}:duckAttackFrames`, input.automation.duckAttackFrames),
      binding('duckReleaseFrames', 'planned_mix_automation', `automation:${input.automation.cueId}:duckReleaseFrames`, input.automation.duckReleaseFrames),
      binding('pan', 'planned_mix_automation', `automation:${input.automation.cueId}:pan`, input.automation.pan),
      binding('headroomDb', 'planned_mix_automation', `automation:${input.automation.cueId}:headroomDb`, input.automation.headroomDb),
    )
  } else {
    bindings.push(
      binding('gainDb', 'published_operation_policy', 'sound.policy.neutral_gain.v1', 0),
      binding('fadeInFrames', 'published_operation_policy', 'sound.policy.edge_fade.v1', 1),
      binding('fadeOutFrames', 'published_operation_policy', 'sound.policy.edge_fade.v1', 1),
    )
  }
  const musicTechnical = input.request.musicTechnicalAutomationExtension
  if (musicTechnical) {
    const exactBindings: Array<[string, string | number | boolean]> = [
      ['musicTechnicalBindingId', musicTechnical.bindingId],
      ['musicTechnicalExtensionHash', musicTechnical.extensionHash],
      ['musicTechnicalOperationParametersHash', musicTechnical.operationParametersHash],
      ['musicCueId', musicTechnical.musicCueId],
      ['sourceStartFrame', musicTechnical.sourceStartFrame],
      ['sourceEndFrameExclusive', musicTechnical.sourceEndFrameExclusive],
      ['targetStartFrame', musicTechnical.targetStartFrame],
      ['targetEndFrameExclusive', musicTechnical.targetEndFrameExclusive],
      ['crossfadeFrames', musicTechnical.crossfadeFrames],
      ['normalizationEnabled', musicTechnical.normalization.enabled],
      ['targetLoudnessLufs', musicTechnical.normalization.targetLoudnessLufs],
      ['maximumTruePeakDbtp', musicTechnical.maximumTruePeakDbtp],
      ['loopCrossfadeFrames', musicTechnical.loopCrossfadeFrames],
      ['tempoRatio', musicTechnical.tempoRatio],
      ['pitchSemitones', musicTechnical.pitchSemitones],
      ['sampleRate', musicTechnical.sampleRate],
      ['channels', musicTechnical.channelLayout === 'mono' ? 1 : 2],
      ['renderStem', musicTechnical.renderStem],
    ]
    for (const [parameterKey, value] of exactBindings) {
      const existing = bindings.findIndex((item) => item.parameterKey === parameterKey)
      const compiled = binding(parameterKey, 'music_technical_automation_extension',
        `music-extension:${musicTechnical.bindingId}`, value)
      if (existing >= 0) bindings[existing] = compiled
      else bindings.push(compiled)
    }
  }
  const operationPolicies: Array<[string, number, string]> = [
    ['trimSourceStartFrame', 0, 'sound.policy.source_offset_zero.v1'],
    ['targetDurationFrames', input.range.endFrameExclusive - input.range.startFrame, 'sound.policy.target_range_duration.v1'],
    ['loopCrossfadeFrames', Math.max(1, rationalSecondsToFrames({ secondsNumerator: 2, secondsDenominator: 25, rate: input.request.timelineRate, rounding: 'nearest_half_up' })), 'sound.policy.loop_crossfade_80ms.v1'],
    ['tempoRatio', input.routeJobType === 'time_stretch_audio' ? 1.05 : 1, 'sound.policy.time_stretch_subtle.v1'],
    ['pitchSemitones', input.routeJobType === 'pitch_shift_audio' ? 1 : 0, 'sound.policy.pitch_shift_subtle.v1'],
    ['syncToleranceFrames', 2, 'sound.policy.sync_tolerance_two_frames.v1'],
    ['dialogueDuckingDb', -9, 'sound.policy.speech_ducking_gentle.v1'],
    ['duckAttackFrames', Math.max(1, rationalSecondsToFrames({ secondsNumerator: 3, secondsDenominator: 100, rate: input.request.timelineRate, rounding: 'nearest_half_up' })), 'sound.policy.duck_attack_30ms.v1'],
    ['duckReleaseFrames', Math.max(1, rationalSecondsToFrames({ secondsNumerator: 4, secondsDenominator: 25, rate: input.request.timelineRate, rounding: 'nearest_half_up' })), 'sound.policy.duck_release_160ms.v1'],
    ['headroomDb', 6, 'sound.policy.mix_headroom_six_db.v1'],
    ['proxyPreRollFrames', 0, 'sound.policy.proxy_no_handle.v1'],
    ['proxyPostRollFrames', 0, 'sound.policy.proxy_no_handle.v1'],
  ]
  for (const [parameterKey, value, policy] of operationPolicies) {
    if (!bindings.some((item) => item.parameterKey === parameterKey)) bindings.push(binding(parameterKey, 'published_operation_policy', policy, value))
  }
  const callerOwners = new Map<string, string>()
  for (const directive of directives) {
    for (const [parameterKey, value] of Object.entries(directive.parameters)) {
      if (value === undefined || parameterKey === 'sourceGainDb' || typeof value === 'object') continue
      const previousOwner = callerOwners.get(parameterKey)
      if (previousOwner) throw new Error(`Sound parameter ${parameterKey} is ambiguously owned by directives ${previousOwner} and ${directive.directiveId}.`)
      callerOwners.set(parameterKey, directive.directiveId)
      const existing = bindings.findIndex((item) => item.parameterKey === parameterKey)
      const compiled = binding(parameterKey, 'caller_directive', `directive:${directive.directiveId}`, value)
      if (existing >= 0) bindings[existing] = compiled
      else bindings.push(compiled)
    }
    for (const [artifactId, gain] of Object.entries(directive.parameters.sourceGainDb ?? {})) {
      const parameterKey = `sourceGainDb:${artifactId}`
      const previousOwner = callerOwners.get(parameterKey)
      if (previousOwner) throw new Error(`Sound parameter ${parameterKey} is ambiguously owned by directives ${previousOwner} and ${directive.directiveId}.`)
      callerOwners.set(parameterKey, directive.directiveId)
      bindings.push(binding(parameterKey, 'caller_directive', `directive:${directive.directiveId}`, gain))
    }
  }
  return bindings
}

function applicableDirectives(input: Parameters<typeof createUnit>[0]) {
  return (input.request.operationDirectives ?? []).filter((directive) =>
    (!directive.targetRangeId || directive.targetRangeId === input.range.rangeId) &&
    (!directive.eventAnchorId || directive.eventAnchorId === input.cue?.eventAnchorId))
}

function binding(parameterKey: string, source: SoundOperationParameterSource, sourceRef: string, value: CompiledSoundParameterBinding['value']): CompiledSoundParameterBinding {
  return { parameterKey, source, sourceRef, value }
}

function exactRoute(routeKey: string): SoundExecutionUnit['route'] {
  const route = getSoundToolRouteManifest(routeKey)
  if (!route) throw new Error(`Sound execution graph references unpublished route ${routeKey}.`)
  return { routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash }
}

function validateUnitDependencies(units: SoundExecutionUnit[]): void {
  const byId = new Map(units.map((unit) => [unit.unitId, unit]))
  for (const unit of units) {
    for (const dependency of unit.dependsOnUnitIds) {
      if (!byId.has(dependency)) throw new Error(`Sound unit ${unit.unitId} references unknown dependency ${dependency}.`)
      if (dependency === unit.unitId) throw new Error(`Sound unit ${unit.unitId} cannot depend on itself.`)
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (unitId: string) => {
    if (visiting.has(unitId)) throw new Error('Sound execution graph contains a cross-unit dependency cycle.')
    if (visited.has(unitId)) return
    visiting.add(unitId)
    for (const dependency of byId.get(unitId)!.dependsOnUnitIds) visit(dependency)
    visiting.delete(unitId)
    visited.add(unitId)
  }
  for (const unit of units) visit(unit.unitId)
}

export function topologicalSoundExecutionUnits(graph: SoundExecutionGraph): SoundExecutionUnit[] {
  validateUnitDependencies(graph.units)
  const ordered: SoundExecutionUnit[] = []
  const remaining = new Map(graph.units.map((unit) => [unit.unitId, unit]))
  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter((unit) =>
      unit.dependsOnUnitIds.every((dependency) => ordered.some((candidate) => candidate.unitId === dependency)))
    if (ready.length === 0) throw new Error('Sound execution graph contains a cross-unit dependency cycle.')
    ready.sort((left, right) => left.unitId.localeCompare(right.unitId))
    for (const unit of ready) { ordered.push(unit); remaining.delete(unit.unitId) }
  }
  return ordered
}

function allApprovedSources(request: CanonicalSoundRequest, extra: SoundArtifactRef[] = []): Map<string, SoundArtifactRef> {
  return new Map([
    ...request.sourceAudioRefs,
    ...request.referenceSoundInputs,
    ...request.completedSkillWork.map((item) => item.artifact),
    ...extra,
  ].map((source) => [source.artifactId, source]))
}

function executionRanges(request: CanonicalSoundRequest, cues: CanonicalSoundCue[]): SoundFrameRange[] {
  const affected = request.assignmentScope.authorizedAudioWriteRanges.filter((range) =>
    cues.length > 0 ? cues.some((cue) => overlaps(range, rangeForCue(cue)))
      : request.eventAnchors.length > 0 ? request.eventAnchors.some((event) => event.frame < range.endFrameExclusive && (event.endFrameExclusive ?? event.frame + 1) > range.startFrame)
        : true)
  if (affected.length > 0) return affected
  return request.assignmentScope.inspectRanges.length > 0
    ? request.assignmentScope.inspectRanges.map((range) => structuredClone(range))
    : request.assignmentScope.authorizedAudioWriteRanges.map((range) => structuredClone(range))
}

function rangeForCue(cue: CanonicalSoundCue): SoundFrameRange {
  return { rangeId: `cue-range:${cue.cueId}`, startFrame: cue.startFrame, endFrameExclusive: cue.endFrameExclusive }
}

function overlaps(left: SoundFrameRange, right: SoundFrameRange): boolean {
  return left.startFrame < right.endFrameExclusive && left.endFrameExclusive > right.startFrame
}

function sourceForIndex(sources: SoundArtifactRef[], index: number): SoundArtifactRef[] {
  if (sources.length === 0) return []
  return [sources[Math.min(index, sources.length - 1)]!]
}

function visualForCue(request: CanonicalSoundRequest, cue: CanonicalSoundCue) {
  return request.visualDependencies.find((item) => item.artifact.artifactId === cue.sourceVisualArtifactId) ??
    request.visualDependencies.find((item) => item.timelineRange && cue.startFrame >= item.timelineRange.startFrame && cue.endFrameExclusive <= item.timelineRange.endFrameExclusive) ??
    (request.visualDependencies.length === 1 ? request.visualDependencies[0] : undefined)
}

function syntheticCue(request: CanonicalSoundRequest, event: CanonicalSoundRequest['eventAnchors'][number], index: number): CanonicalSoundCue {
  const authority = request.assignmentScope.authorizedAudioWriteRanges.find((range) => event.frame >= range.startFrame && event.frame < range.endFrameExclusive)
  if (!authority) throw new Error(`Sound sync event ${event.anchorId} is outside exact write authority.`)
  return {
    cueId: stableId('sound-sync-cue', request.requestId, event.anchorId, index), eventAnchorId: event.anchorId,
    startFrame: authority.startFrame, hitFrame: event.frame,
    endFrameExclusive: Math.min(authority.endFrameExclusive, event.endFrameExclusive ?? event.frame + 1),
    acquisitionDecision: 'preserve_project_source', miniSkillKey: 'soundsync', layerRole: 'subtle_support',
    storyReason: 'Align the approved Sound transient to the exact visual event frame.', staleIfVisualChanges: true,
  }
}

function stableId(prefix: string, ...values: Array<string | number>): string {
  return `${prefix}.${createHash('sha256').update(values.join('|')).digest('hex').slice(0, 24)}`
}

function hash(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
  return JSON.stringify(value)
}
