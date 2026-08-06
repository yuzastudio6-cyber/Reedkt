import { MUSIC_JOB_TYPES, type MusicJobType } from '../../music/music-contracts'

export type MusicAcceptanceMode = 'planning' | 'fixture' | 'private_internal' | 'production'

export interface MusicAcceptanceEvidence {
  evidenceKey: string
  schemaVersion: 'music-acceptance-evidence-v3'
  sourceFile: `server/smoke/${string}.ts`
  mode: MusicAcceptanceMode
  jobType: MusicJobType
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
  assertionKeys: readonly string[]
  resultHashBindingRequired: true
  limitations: readonly string[]
}

function exactEvidence(input: Omit<MusicAcceptanceEvidence,
  'schemaVersion' | 'resultHashBindingRequired'> & { resultHashBindingRequired?: true }): MusicAcceptanceEvidence {
  return Object.freeze({
    schemaVersion: 'music-acceptance-evidence-v3',
    resultHashBindingRequired: true,
    ...input,
  })
}

const planningEvidence = MUSIC_JOB_TYPES.map((jobType) => exactEvidence({
  evidenceKey: `music.acceptance.planning.${jobType}.v3`,
  sourceFile: 'server/smoke/canonical-music-supported-job-matrix-smoke.ts',
  mode: 'planning',
  jobType,
  evidenceKinds: ['schema_validation', 'authority_validation'],
  assertionKeys: [
    'request_job_type_exact',
    'capability_key_exact',
    'route_identity_exact',
    'planning_outputs_hash_bound',
    'authoritative_v3_artifacts_declared',
    'production_mode_fail_closed',
    'result_hash_bound',
  ],
  limitations: ['Planning evidence does not authorize direct media execution.'],
}))

const exactExecutionEvidence: readonly MusicAcceptanceEvidence[] = Object.freeze([
  exactEvidence({
    evidenceKey: 'music.acceptance.fixture.generate_original_music.v3',
    sourceFile: 'server/smoke/canonical-music-lyria-e2e-smoke.ts',
    mode: 'fixture', jobType: 'generate_original_music',
    evidenceKinds: ['route_execution', 'provider_fixture_bytes', 'private_audio_bytes',
      'sound_v4_receipt', 'measured_qa', 'typed_handoff'],
    assertionKeys: ['exact_job_request', 'one_interaction_per_candidate', 'all_candidates_processed',
      'sound_receipt_validated', 'real_private_handoff_artifact', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Injected transport is fixture evidence, not a live Google Lyria call.'],
  }),
  exactEvidence({
    evidenceKey: 'music.acceptance.fixture.generate_music_variation.v3',
    sourceFile: 'server/smoke/canonical-music-lyria-e2e-smoke.ts',
    mode: 'fixture', jobType: 'generate_music_variation',
    evidenceKinds: ['route_execution', 'provider_fixture_bytes', 'private_audio_bytes',
      'sound_v4_receipt', 'measured_qa', 'typed_handoff'],
    assertionKeys: ['exact_job_request', 'variation_identity_bound', 'all_candidates_processed',
      'sound_receipt_validated', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Injected transport is fixture evidence, not a live Google Lyria call.'],
  }),
  exactEvidence({
    evidenceKey: 'music.acceptance.fixture.full_video_music_pass.v3',
    sourceFile: 'server/smoke/canonical-music-whole-video-continuity-smoke.ts',
    mode: 'fixture', jobType: 'full_video_music_pass',
    evidenceKinds: ['route_execution', 'provider_fixture_bytes', 'private_audio_bytes',
      'sound_v4_receipt', 'measured_qa', 'authority_validation', 'typed_handoff'],
    assertionKeys: ['exact_job_request', 'atomic_segment_coverage', 'cue_routes_executed',
      'whole_video_continuity_measured', 'bounded_mutations', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Subjective narrative findings remain confidence-scored or review-required.'],
  }),
  exactEvidence({
    evidenceKey: 'music.acceptance.fixture.revise_music.v3',
    sourceFile: 'server/smoke/canonical-music-localized-revision-smoke.ts',
    mode: 'fixture', jobType: 'revise_music',
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'localized_revision', 'typed_handoff'],
    assertionKeys: ['exact_revision_job', 'unaffected_artifacts_preserved', 'affected_provider_attempt_new',
      'affected_sound_rerun_only', 'handoff_updated', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: [],
  }),
  exactEvidence({
    evidenceKey: 'music.acceptance.private.create_music_reference_dna.v3',
    sourceFile: 'server/smoke/canonical-music-professional-scenarios-smoke.ts',
    mode: 'private_internal', jobType: 'create_music_reference_dna',
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'measured_qa',
      'authority_validation', 'typed_handoff'],
    assertionKeys: ['exact_job_request', 'reference_bytes_analyzed', 'measured_inferred_declared_separated',
      'do_not_copy_rules_present', 'source_not_reused', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Copy-risk screening is not legal copyright clearance.'],
  }),
  ...([
    ['support_motion_studio_music', 'motion_studio'],
    ['support_living_frame_music', 'living_frame'],
    ['support_3d_music', 'three_d'],
    ['support_transition_music', 'transitions'],
    ['support_graphic_design_music', 'graphic_design'],
  ] as const).map(([jobType, caller]) => exactEvidence({
    evidenceKey: `music.acceptance.private.${jobType}.v3`,
    sourceFile: 'server/smoke/canonical-music-v3-integrity-regression-smoke.ts',
    mode: 'private_internal', jobType,
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'authority_validation', 'typed_handoff'],
    assertionKeys: ['exact_peer_job', `caller_${caller}_exact`, 'delegated_authority_subset',
      'real_music_output_or_typed_no_music', 'sound_receipt_validated', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Global peer scheduling and persistence remain future Orchestra responsibilities.'],
  })),
  exactEvidence({
    evidenceKey: 'music.acceptance.private.full_video_music_pass.v3',
    sourceFile: 'server/smoke/canonical-music-source-sound-e2e-smoke.ts',
    mode: 'private_internal', jobType: 'full_video_music_pass',
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'authority_validation', 'typed_handoff'],
    assertionKeys: ['exact_job_request', 'all_atomic_segments_executed', 'actual_sound_receipts',
      'measured_output_qa', 'operation_receipts_parameter_bound', 'acceptance_receipt_artifact_bound',
      'bounded_mutations', 'real_handoff_artifact', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: ['Subjective Music judgment remains review-aware.'],
  }),
  exactEvidence({
    evidenceKey: 'music.acceptance.private.revise_music.v3',
    sourceFile: 'server/smoke/canonical-music-localized-revision-smoke.ts',
    mode: 'private_internal', jobType: 'revise_music',
    evidenceKinds: ['route_execution', 'private_audio_bytes', 'sound_v4_receipt',
      'measured_qa', 'localized_revision', 'typed_handoff'],
    assertionKeys: ['exact_revision_job', 'unaffected_artifacts_preserved', 'affected_sound_rerun_only',
      'affected_qa_rerun', 'handoff_updated', 'result_hash_bound'],
    resultHashBindingRequired: true,
    limitations: [],
  }),
])

export const MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY: readonly MusicAcceptanceEvidence[] = Object.freeze([
  ...planningEvidence,
  ...exactExecutionEvidence,
])

export function resolveMusicAcceptanceEvidence(input: {
  jobType: string
  mode: MusicAcceptanceMode
}): readonly MusicAcceptanceEvidence[] {
  return MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY.filter((entry) =>
    entry.mode === input.mode && entry.jobType === input.jobType)
}

export function requireExactMusicAcceptanceEvidence(input: {
  jobType: MusicJobType
  mode: MusicAcceptanceMode
}): MusicAcceptanceEvidence {
  const matches = resolveMusicAcceptanceEvidence(input)
  if (matches.length !== 1) {
    throw new Error(`Music ${input.mode} job ${input.jobType} requires exactly one acceptance evidence record.`)
  }
  return matches[0]!
}

export function validateMusicAcceptanceEvidenceRegistry(): void {
  const keys = new Set<string>()
  const jobModes = new Set<string>()
  for (const evidence of MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY) {
    if (keys.has(evidence.evidenceKey)) throw new Error(`Duplicate Music acceptance evidence ${evidence.evidenceKey}.`)
    keys.add(evidence.evidenceKey)
    const jobMode = `${evidence.jobType}:${evidence.mode}`
    if (jobModes.has(jobMode)) throw new Error(`Music ${jobMode} has grouped or duplicate acceptance attribution.`)
    jobModes.add(jobMode)
    if (evidence.evidenceKinds.length === 0 || evidence.assertionKeys.length === 0) {
      throw new Error(`${evidence.evidenceKey} declares incomplete exact evidence.`)
    }
    if (!evidence.assertionKeys.includes('result_hash_bound')) {
      throw new Error(`${evidence.evidenceKey} must bind its exact result hash.`)
    }
    if (evidence.mode === 'production') {
      throw new Error('Music must not publish production evidence before live provider and deployment qualification.')
    }
  }
  for (const jobType of MUSIC_JOB_TYPES) requireExactMusicAcceptanceEvidence({ jobType, mode: 'planning' })
}
