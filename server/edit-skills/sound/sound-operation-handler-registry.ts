import type { SoundToolRouteManifest, SoundToolRouteStep } from '../../sound/sound-tool-route-manifest'

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

const handlerByTool = new Map<string, SoundOperationHandlerKind>([
  ['ffprobe', 'media_inspection'],
  ['ffmpeg', 'local_audio'],
  ['mirelo_sfx', 'mirelo_provider'],
  ['sound_sync_service', 'synchronization'],
  ['sound_private_artifact_store', 'private_artifact'],
  ['sound_provider_attempt_service', 'provider_attempt'],
  ['sound_qa_service', 'output_qa'],
  ['sound_planning_service', 'planning_receipt'],
  ['sound_no_sound_decision', 'no_sound_decision'],
])

export function resolveSoundOperationHandlerKind(
  step: Pick<SoundToolRouteStep, 'toolKey' | 'operationKey'>,
): SoundOperationHandlerKind | undefined {
  if (step.operationKey === 'prepare_bounded_private_visual_proxy') return 'bounded_visual_proxy'
  return handlerByTool.get(step.toolKey)
}

export function validateSoundOperationHandlerCoverage(
  routes: readonly Readonly<SoundToolRouteManifest>[],
): void {
  for (const route of routes) {
    if (route.qualificationStatus === 'blocked') continue
    for (const step of route.orderedOrGraphSteps) {
      if (resolveSoundOperationHandlerKind(step)) continue
      if (!step.required || step.requiredQualificationStatus === 'blocked') continue
      throw new Error(
        `Executable Sound route step ${route.routeKey}:${step.stepKey} has no registered operation handler.`,
      )
    }
  }
}
