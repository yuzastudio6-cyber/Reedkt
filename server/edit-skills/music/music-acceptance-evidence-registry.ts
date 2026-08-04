import type { MusicJobType } from '../../music/music-contracts'

export type MusicAcceptanceMode = 'planning' | 'fixture' | 'private_internal' | 'production'

export interface MusicAcceptanceEvidence {
  evidenceKey: string
  sourceFile: `server/smoke/${string}.ts`
  mode: MusicAcceptanceMode
  coveredJobTypes: readonly MusicJobType[]
  evidenceKinds: readonly (
    | 'schema_validation'
    | 'route_execution'
    | 'private_audio_bytes'
    | 'provider_fixture_bytes'
    | 'sound_v4_receipt'
    | 'measured_qa'
    | 'authority_validation'
    | 'localized_revision'
    | 'typed_handoff'
  )[]
  limitations: readonly string[]
}

const planningJobs = [
  'study_video_music_context', 'study_existing_music', 'study_user_provided_music',
  'study_reference_music', 'create_music_reference_dna', 'decide_music_need',
  'decide_music_silence', 'plan_music_narrative_arc', 'plan_music_motif',
  'plan_scene_music', 'plan_boundary_music', 'full_video_music_pass',
  'create_music_cue_sheet', 'select_user_provided_music', 'search_project_music',
  'search_workspace_music', 'search_authorized_music_library', 'generate_original_music',
  'generate_music_variation', 'analyze_music_candidate', 'select_music_candidate',
  'fit_music_to_edit', 'sync_music_to_picture', 'prepare_music_stem',
  'plan_music_mix', 'request_sound_processing', 'support_motion_studio_music',
  'support_living_frame_music', 'support_3d_music', 'support_transition_music',
  'support_graphic_design_music', 'qa_music', 'revise_music',
  'promote_music_library_candidate', 'handoff_music_to_final_composition',
] as const satisfies readonly MusicJobType[]

const sourceAndRightsJobs = [
  'study_existing_music', 'study_user_provided_music', 'study_reference_music',
  'create_music_reference_dna', 'select_user_provided_music', 'search_project_music',
  'search_workspace_music', 'search_authorized_music_library',
] as const satisfies readonly MusicJobType[]

const analysisSoundAndHandoffJobs = [
  'analyze_music_candidate', 'select_music_candidate', 'fit_music_to_edit',
  'sync_music_to_picture', 'prepare_music_stem', 'plan_music_mix',
  'request_sound_processing', 'qa_music', 'handoff_music_to_final_composition',
] as const satisfies readonly MusicJobType[]

const peerJobs = [
  'support_motion_studio_music', 'support_living_frame_music', 'support_3d_music',
  'support_transition_music', 'support_graphic_design_music',
] as const satisfies readonly MusicJobType[]

export const MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY: readonly MusicAcceptanceEvidence[] = Object.freeze([
  {
    evidenceKey: 'music.acceptance.planning.all_supported_jobs.v1',
    sourceFile: 'server/smoke/canonical-music-supported-job-matrix-smoke.ts',
    mode: 'planning', coveredJobTypes: planningJobs,
    evidenceKinds: ['schema_validation', 'authority_validation'],
    limitations: ['Planning evidence does not authorize media execution.'],
  },
  {
    evidenceKey: 'music.acceptance.fixture.generated_candidates.v1',
    sourceFile: 'server/smoke/canonical-music-lyria-e2e-smoke.ts',
    mode: 'fixture',
    coveredJobTypes: ['generate_original_music', 'generate_music_variation',
      'analyze_music_candidate', 'select_music_candidate'],
    evidenceKinds: ['route_execution', 'provider_fixture_bytes', 'private_audio_bytes',
      'sound_v4_receipt', 'measured_qa', 'typed_handoff'],
    limitations: ['Injected transport is fixture evidence, not a live Google Lyria call.'],
  },
  {
    evidenceKey: 'music.acceptance.fixture.whole_video.v1',
    sourceFile: 'server/smoke/canonical-music-whole-video-continuity-smoke.ts',
    mode: 'fixture', coveredJobTypes: ['full_video_music_pass'],
    evidenceKinds: ['route_execution', 'provider_fixture_bytes', 'private_audio_bytes',
      'sound_v4_receipt', 'measured_qa', 'authority_validation', 'typed_handoff'],
    limitations: ['Subjective narrative findings remain confidence-scored or review-required.'],
  },
  {
    evidenceKey: 'music.acceptance.fixture.peer_support.v1',
    sourceFile: 'server/smoke/canonical-music-professional-scenarios-smoke.ts',
    mode: 'fixture', coveredJobTypes: peerJobs,
    evidenceKinds: ['route_execution', 'authority_validation', 'typed_handoff'],
    limitations: ['Peer calls are faithful standalone fixtures; global dispatch remains future Orchestra work.'],
  },
  {
    evidenceKey: 'music.acceptance.fixture.localized_revision.v1',
    sourceFile: 'server/smoke/canonical-music-localized-revision-smoke.ts',
    mode: 'fixture', coveredJobTypes: ['revise_music'],
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'localized_revision', 'typed_handoff'],
    limitations: [],
  },
  {
    evidenceKey: 'music.acceptance.fixture.source_rights.v1',
    sourceFile: 'server/smoke/canonical-music-professional-scenarios-smoke.ts',
    mode: 'fixture', coveredJobTypes: sourceAndRightsJobs,
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'measured_qa',
      'authority_validation', 'typed_handoff'],
    limitations: ['Library execution requires an actual rights-bound artifact; no synthetic library catalog is claimed.'],
  },
  {
    evidenceKey: 'music.acceptance.fixture.sound_and_handoff.v1',
    sourceFile: 'server/smoke/canonical-music-source-sound-e2e-smoke.ts',
    mode: 'fixture', coveredJobTypes: analysisSoundAndHandoffJobs,
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'authority_validation', 'typed_handoff'],
    limitations: [],
  },
  {
    evidenceKey: 'music.acceptance.private.source_rights.v1',
    sourceFile: 'server/smoke/canonical-music-professional-scenarios-smoke.ts',
    mode: 'private_internal', coveredJobTypes: sourceAndRightsJobs,
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'measured_qa',
      'authority_validation', 'typed_handoff'],
    limitations: ['Library execution requires an actual rights-bound artifact and exact project/workspace scope.'],
  },
  {
    evidenceKey: 'music.acceptance.private.analysis_sound_handoff.v1',
    sourceFile: 'server/smoke/canonical-music-source-sound-e2e-smoke.ts',
    mode: 'private_internal', coveredJobTypes: analysisSoundAndHandoffJobs,
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'authority_validation', 'typed_handoff'],
    limitations: [],
  },
  {
    evidenceKey: 'music.acceptance.private.whole_video.v1',
    sourceFile: 'server/smoke/canonical-music-whole-video-continuity-smoke.ts',
    mode: 'private_internal', coveredJobTypes: ['full_video_music_pass'],
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'authority_validation', 'typed_handoff'],
    limitations: ['The injected generated cue remains fixture-qualified inside an otherwise private graph.'],
  },
  {
    evidenceKey: 'music.acceptance.private.peer_support.v1',
    sourceFile: 'server/smoke/canonical-music-professional-scenarios-smoke.ts',
    mode: 'private_internal', coveredJobTypes: peerJobs,
    evidenceKinds: ['route_execution', 'authority_validation', 'typed_handoff'],
    limitations: ['Global peer scheduling and persistence remain future Orchestra responsibilities.'],
  },
  {
    evidenceKey: 'music.acceptance.private.localized_revision.v1',
    sourceFile: 'server/smoke/canonical-music-localized-revision-smoke.ts',
    mode: 'private_internal', coveredJobTypes: ['revise_music'],
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'localized_revision', 'typed_handoff'],
    limitations: [],
  },
])

export function resolveMusicAcceptanceEvidence(input: {
  jobType: string
  mode: MusicAcceptanceMode
}): readonly MusicAcceptanceEvidence[] {
  return MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY.filter((entry) =>
    entry.mode === input.mode && entry.coveredJobTypes.includes(input.jobType as MusicJobType))
}

export function validateMusicAcceptanceEvidenceRegistry(): void {
  const keys = new Set<string>()
  for (const evidence of MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY) {
    if (keys.has(evidence.evidenceKey)) throw new Error(`Duplicate Music acceptance evidence ${evidence.evidenceKey}.`)
    keys.add(evidence.evidenceKey)
    if (evidence.coveredJobTypes.length === 0) throw new Error(`${evidence.evidenceKey} covers no Music job.`)
    if (evidence.evidenceKinds.length === 0) throw new Error(`${evidence.evidenceKey} declares no evidence kind.`)
    if (evidence.mode === 'production') {
      throw new Error('Music must not publish production evidence before live provider and deployment qualification.')
    }
  }
  for (const jobType of planningJobs) {
    if (resolveMusicAcceptanceEvidence({ jobType, mode: 'planning' }).length === 0) {
      throw new Error(`Music planning job ${jobType} lacks exact acceptance evidence.`)
    }
  }
}
