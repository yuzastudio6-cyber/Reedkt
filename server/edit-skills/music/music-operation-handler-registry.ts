import { hashMusicValue } from '../../music/music-contracts'
import {
  MUSIC_TOOL_ROUTE_MANIFESTS,
  type MusicRouteStep,
} from '../../music/music-tool-routes'

export type MusicOperationHandlerKind =
  | 'supervision' | 'private_audio_analysis' | 'private_asset_binding'
  | 'lyria_provider' | 'music_sync' | 'music_qa' | 'sound_public_port' | 'handoff'

export interface MusicExactOperationHandler {
  handlerIdentity: string
  handlerVersion: '2.0.0'
  toolKey: string
  toolVersion: string
  operationKey: string
  operationVersion: string
  operationProfileKey: string
  operationProfileVersion: string
  kind: MusicOperationHandlerKind
  identityHash: string
}

const HANDLER_KINDS: Readonly<Record<string, MusicOperationHandlerKind>> = Object.freeze({
  group_music_cues: 'supervision',
  publish_cue_constraint_resolutions: 'supervision',
  analyze_audio_bytes: 'private_audio_analysis',
  select_qualified_candidate: 'private_audio_analysis',
  preserve_source_music: 'private_asset_binding',
  use_user_uploaded_music: 'private_asset_binding',
  match_project_music: 'private_asset_binding',
  match_workspace_music: 'private_asset_binding',
  match_internal_music: 'private_asset_binding',
  generate_original_music_injected: 'lyria_provider',
  generate_music_variation_injected: 'lyria_provider',
  compile_frame_accurate_music_placement: 'music_sync',
  run_music_continuity_qa: 'music_qa',
  process_music_through_public_sound_service: 'sound_public_port',
  crossfade_music_through_public_sound_service: 'sound_public_port',
  create_final_music_handoff: 'handoff',
  create_no_music_handoff: 'handoff',
  create_ambience_only_handoff: 'handoff',
})

function identity(step: MusicRouteStep): string {
  return [
    `${step.toolKey}@${step.toolVersion}`,
    `${step.operationKey}@${step.operationVersion}`,
    `${step.operationProfileKey}@${step.operationProfileVersion}`,
  ].join('/')
}

function handlerForStep(step: MusicRouteStep): MusicExactOperationHandler | undefined {
  const kind = HANDLER_KINDS[step.operationKey] ??
    (step.toolKey === 'music_supervision_engine' ? 'supervision' : undefined)
  if (!kind) return undefined
  const base = {
    handlerIdentity: identity(step), handlerVersion: '2.0.0' as const,
    toolKey: step.toolKey, toolVersion: step.toolVersion,
    operationKey: step.operationKey, operationVersion: step.operationVersion,
    operationProfileKey: step.operationProfileKey,
    operationProfileVersion: step.operationProfileVersion,
    kind,
  }
  return Object.freeze({ ...base, identityHash: hashMusicValue(base) })
}

const handlers = new Map<string, MusicExactOperationHandler>()
for (const route of MUSIC_TOOL_ROUTE_MANIFESTS) {
  for (const step of route.steps) {
    const handler = handlerForStep(step)
    if (!handler) continue
    const existing = handlers.get(handler.handlerIdentity)
    if (existing && existing.identityHash !== handler.identityHash) {
      throw new Error(`Immutable Music handler collision ${handler.handlerIdentity}.`)
    }
    handlers.set(handler.handlerIdentity, handler)
  }
}

export const MUSIC_EXACT_OPERATION_HANDLERS = Object.freeze([...handlers.values()])

export function resolveMusicExactOperationHandler(step: MusicRouteStep): MusicExactOperationHandler | undefined {
  return handlers.get(identity(step))
}

export function resolveMusicOperationHandlerKind(operationKey: string): MusicOperationHandlerKind | undefined {
  return MUSIC_EXACT_OPERATION_HANDLERS.find((handler) => handler.operationKey === operationKey)?.kind
}

export function validateMusicOperationHandlerCoverage(
  routes: readonly Pick<(typeof MUSIC_TOOL_ROUTE_MANIFESTS)[number], 'routeKey' | 'steps'>[] = MUSIC_TOOL_ROUTE_MANIFESTS,
): void {
  for (const route of routes) {
    for (const step of route.steps) {
      const handler = resolveMusicExactOperationHandler(step)
      if (!handler) throw new Error(`Music route ${route.routeKey} lacks an exact handler for ${step.operationKey}.`)
      if (handler.toolVersion !== step.toolVersion || handler.operationVersion !== step.operationVersion ||
        handler.operationProfileVersion !== step.operationProfileVersion) {
        throw new Error(`Music route ${route.routeKey} handler identity is stale for ${step.stepKey}.`)
      }
    }
  }
}
