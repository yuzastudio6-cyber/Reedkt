import { getToolOperationCapability } from '../../tool-registry'
import type { ToolExecutionMode } from '../../tool-registry'
import {
  listSoundToolRouteManifests,
  type SoundToolRouteManifest,
  type SoundToolRouteStep,
} from '../../sound/sound-tool-route-manifest'

export type SoundOperationHandlerKind =
  | 'media_inspection'
  | 'local_audio'
  | 'bounded_visual_proxy'
  | 'mirelo_provider'
  | 'synchronization'
  | 'private_artifact'
  | 'provider_attempt'
  | 'output_qa'
  | 'planning_receipt'
  | 'no_sound_decision'

export interface ExactSoundOperationHandlerRegistration {
  toolKey: string
  toolVersion: string
  operationKey: string
  operationVersion: string
  operationProfileKey: string
  operationProfileVersion: string
  inputSchemaKeys: string[]
  outputSchemaKeys: string[]
  allowedExecutionModes: ToolExecutionMode[]
  requiredEvidenceKeys: string[]
  handlerKind: SoundOperationHandlerKind
}

const handlerKindByOperationIdentity = new Map<string, SoundOperationHandlerKind>([
  ['ffprobe:inspect_validate_audio', 'media_inspection'],
  ['ffmpeg:analyze_audio_pcm', 'local_audio'],
  ['ffmpeg:extract_audio_pcm', 'local_audio'],
  ['ffmpeg:trim_fade_gain_audio', 'local_audio'],
  ['ffmpeg:normalize_audio_loudness', 'local_audio'],
  ['ffmpeg:resample_convert_channels', 'local_audio'],
  ['ffmpeg:loop_audio_crossfade', 'local_audio'],
  ['ffmpeg:crossfade_music_two_source', 'local_audio'],
  ['ffmpeg:stretch_pitch_audio', 'local_audio'],
  ['ffmpeg:mix_scene_stem', 'local_audio'],
  ['ffmpeg:sync_transient_qa', 'local_audio'],
  ['ffmpeg:cleanup_dialogue_gentle', 'local_audio'],
  ['mirelo_sfx:generate_video_conditioned_sfx', 'mirelo_provider'],
  ['mirelo_sfx:generate_text_conditioned_sfx', 'mirelo_provider'],
  ['sound_sync_service:align_sound_to_visual_event', 'synchronization'],
  ['sound_sync_service:create_speech_safe_mix_automation', 'synchronization'],
  ['sound_sync_service:create_timed_sound_cue', 'synchronization'],
  ['sound_private_artifact_store:prepare_bounded_private_visual_proxy', 'bounded_visual_proxy'],
  ['sound_private_artifact_store:ingest_untrusted_provider_output', 'private_artifact'],
  ['sound_private_artifact_store:commit_selected_sound_artifact', 'private_artifact'],
  ['sound_provider_attempt_service:record_provider_attempt', 'provider_attempt'],
  ['sound_provider_attempt_service:reconcile_provider_attempt', 'provider_attempt'],
  ['sound_qa_service:evaluate_final_sound', 'output_qa'],
  ['sound_planning_service:derive_reference_sound_dna', 'planning_receipt'],
  ['sound_planning_service:study_visual_sound_events', 'planning_receipt'],
  ['sound_planning_service:design_sound_plan', 'planning_receipt'],
  ['sound_planning_service:revise_sound_plan', 'planning_receipt'],
  ['sound_planning_service:create_sound_caller_receipt', 'planning_receipt'],
  ['sound_no_sound_decision:decide_intentional_no_sound', 'no_sound_decision'],
])

const exactRegistrations = new Map<string, Readonly<ExactSoundOperationHandlerRegistration>>()

function registrationIdentity(input: Pick<ExactSoundOperationHandlerRegistration,
  'toolKey' | 'toolVersion' | 'operationKey' | 'operationVersion' |
  'operationProfileKey' | 'operationProfileVersion'>): string {
  return [
    input.toolKey, input.toolVersion, input.operationKey, input.operationVersion,
    input.operationProfileKey, input.operationProfileVersion,
  ].join('@')
}

function registerExactStep(step: SoundToolRouteStep): Readonly<ExactSoundOperationHandlerRegistration> | undefined {
  const published = listSoundToolRouteManifests().some((route) => route.orderedOrGraphSteps.some((candidate) =>
    candidate.toolKey === step.toolKey &&
    candidate.toolVersionConstraint === step.toolVersionConstraint &&
    candidate.operationKey === step.operationKey &&
    candidate.operationProfileKey === step.operationProfileKey &&
    candidate.operationProfileVersion === step.operationProfileVersion &&
    JSON.stringify(candidate.inputBindings) === JSON.stringify(step.inputBindings) &&
    JSON.stringify(candidate.outputBindings) === JSON.stringify(step.outputBindings)))
  if (!published) return undefined
  const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersionConstraint)
  const handlerKind = handlerKindByOperationIdentity.get(`${step.toolKey}:${step.operationKey}`)
  if (!resolved || !handlerKind) return undefined
  const registration: ExactSoundOperationHandlerRegistration = {
    toolKey: resolved.manifest.toolKey,
    toolVersion: resolved.manifest.toolVersion,
    operationKey: resolved.operation.operationKey,
    operationVersion: resolved.operation.operationVersion,
    operationProfileKey: step.operationProfileKey,
    operationProfileVersion: step.operationProfileVersion,
    inputSchemaKeys: [...step.inputBindings],
    outputSchemaKeys: [...step.outputBindings],
    allowedExecutionModes: (['planning', 'preview_execution', 'final_execution'] as const)
      .filter((mode) => resolved.operation.qualificationByMode[mode] !== 'blocked'),
    requiredEvidenceKeys: [...new Set([
      ...resolved.manifest.qualificationEvidenceRefs,
      ...resolved.operation.qualificationEvidenceRefs,
    ])],
    handlerKind,
  }
  const identity = registrationIdentity(registration)
  const existing = exactRegistrations.get(identity)
  if (existing && (JSON.stringify(existing.inputSchemaKeys) !== JSON.stringify(registration.inputSchemaKeys) ||
    JSON.stringify(existing.outputSchemaKeys) !== JSON.stringify(registration.outputSchemaKeys))) {
    throw new Error(`Exact Sound handler ${identity} cannot publish conflicting input/output schemas.`)
  }
  exactRegistrations.set(identity, Object.freeze(registration))
  return exactRegistrations.get(identity)
}

export function resolveExactSoundOperationHandler(
  step: SoundToolRouteStep,
): Readonly<ExactSoundOperationHandlerRegistration> | undefined {
  const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersionConstraint)
  if (!resolved) return undefined
  const identity = registrationIdentity({
    toolKey: resolved.manifest.toolKey,
    toolVersion: resolved.manifest.toolVersion,
    operationKey: resolved.operation.operationKey,
    operationVersion: resolved.operation.operationVersion,
    operationProfileKey: step.operationProfileKey,
    operationProfileVersion: step.operationProfileVersion,
  })
  return exactRegistrations.get(identity) ?? registerExactStep(step)
}

export function resolveSoundOperationHandlerKind(
  step: SoundToolRouteStep,
): SoundOperationHandlerKind | undefined {
  return resolveExactSoundOperationHandler(step)?.handlerKind
}

export function validateSoundOperationHandlerCoverage(
  routes: readonly Readonly<SoundToolRouteManifest>[],
): void {
  for (const route of routes) {
    if (route.qualificationStatus === 'blocked') continue
    for (const step of route.orderedOrGraphSteps) {
      const registration = resolveExactSoundOperationHandler(step)
      if (!registration) {
        if (!step.required || step.requiredQualificationStatus === 'blocked') continue
        throw new Error(
          `Executable Sound route step ${route.routeKey}:${step.stepKey} has no exact operation/profile handler registration.`,
        )
      }
      if (registration.outputSchemaKeys.length === 0 ||
        JSON.stringify(registration.outputSchemaKeys) !== JSON.stringify(step.outputBindings)) {
        throw new Error(`Exact Sound handler output schema mismatch at ${route.routeKey}:${step.stepKey}.`)
      }
      if (registration.allowedExecutionModes.length === 0 && step.requiredQualificationStatus !== 'blocked') {
        throw new Error(`Exact Sound handler ${route.routeKey}:${step.stepKey} has no qualified execution mode.`)
      }
    }
  }
}

export function listExactSoundOperationHandlerRegistrations(): readonly Readonly<ExactSoundOperationHandlerRegistration>[] {
  return [...exactRegistrations.values()].sort((left, right) =>
    registrationIdentity(left).localeCompare(registrationIdentity(right)))
}
