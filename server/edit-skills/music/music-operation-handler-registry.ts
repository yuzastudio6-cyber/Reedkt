import { MUSIC_TOOL_ROUTE_MANIFESTS } from '../../music/music-tool-routes'

export type MusicOperationHandlerKind =
  | 'supervision' | 'private_audio_analysis' | 'private_asset_binding'
  | 'lyria_provider' | 'music_sync' | 'music_qa' | 'sound_public_port' | 'handoff'

const HANDLERS: Readonly<Record<string, MusicOperationHandlerKind>> = Object.freeze({
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
  create_final_music_handoff: 'handoff',
  create_no_music_handoff: 'handoff',
  create_ambience_only_handoff: 'handoff',
})

export function resolveMusicOperationHandlerKind(operationKey: string): MusicOperationHandlerKind | undefined {
  return HANDLERS[operationKey] ?? (operationKey.length > 0 && MUSIC_TOOL_ROUTE_MANIFESTS.some((route) =>
    route.steps.some((step) => step.operationKey === operationKey && step.toolKey === 'music_supervision_engine'))
    ? 'supervision' : undefined)
}

export function validateMusicOperationHandlerCoverage(): void {
  for (const route of MUSIC_TOOL_ROUTE_MANIFESTS) {
    for (const step of route.steps) {
      if (!resolveMusicOperationHandlerKind(step.operationKey)) {
        throw new Error(`Music route ${route.routeKey} lacks a handler for ${step.operationKey}.`)
      }
    }
  }
}
