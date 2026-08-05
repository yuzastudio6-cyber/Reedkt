import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import type { SkillScopeLevel } from '../edit-skills/core/skill-capability-manifest-types'
import {
  publishToolCapabilityManifest,
  registerToolCapabilityManifest,
  type ToolCapabilityManifest,
  type ToolOperationCapability,
  type ToolOperationQualificationByMode,
  type UnpublishedToolCapabilityManifest,
} from '../tool-registry'
import { MUSIC_JOB_TYPES } from './music-contracts'

const ALL_SCOPES: SkillScopeLevel[] = ['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video']

type Preset = 'planning' | 'fixture' | 'private' | 'blocked'

function qualification(preset: Preset): ToolOperationQualificationByMode {
  if (preset === 'private') return {
    planning: 'internal_execution_qualified',
    preview_execution: 'internal_execution_qualified',
    final_execution: 'internal_execution_qualified',
  }
  if (preset === 'fixture') return {
    planning: 'planning_qualified', preview_execution: 'planning_qualified', final_execution: 'blocked',
  }
  if (preset === 'planning') return {
    planning: 'planning_qualified', preview_execution: 'blocked', final_execution: 'blocked',
  }
  return { planning: 'blocked', preview_execution: 'blocked', final_execution: 'blocked' }
}

interface OperationSeed {
  key: string
  jobs: string[]
  preset: Preset
  accepted?: string[]
  produced: string[]
  mutation?: ToolOperationCapability['mutationPolicy']
  determinism?: ToolOperationCapability['determinism']
  paid?: boolean
  license?: boolean
  limitations?: string[]
}

function operation(seed: OperationSeed): ToolOperationCapability {
  const execution = seed.preset === 'private' || seed.preset === 'fixture'
  return {
    operationKey: seed.key,
    operationVersion: '2.0.0',
    displayName: seed.key.replaceAll('_', ' '),
    description: `Canonical Music bounded operation for ${seed.key.replaceAll('_', ' ')}.`,
    supportedJobTypes: seed.jobs,
    conditioningModes: ['approved_structured_music_artifacts'],
    supportedScopes: ALL_SCOPES,
    requiredInputs: ['approved_snapshot', 'music_scope_authority', 'exact_timeline_rate'],
    optionalInputs: ['structured_story_evidence', 'speech_evidence', 'approved_private_music'],
    acceptedArtifactTypes: seed.accepted ?? ['music_assignment_v2'],
    producedArtifactTypes: seed.produced,
    mediaConstraints: {
      acceptedContentTypes: ['audio_wav', 'audio_mpeg', 'audio_flac', 'application_json'],
      maximumInputBytes: 1_073_741_824,
      maximumInputDurationSeconds: 21_600,
      maximumOutputBytes: 536_870_912,
      maximumOutputDurationSeconds: 21_600,
      allowedSampleRates: [44_100, 48_000],
      allowedChannelCounts: [1, 2],
      carrierVisualMayReplaceApprovedVisual: false,
    },
    mutationPolicy: seed.mutation ?? (seed.produced.length > 0
      ? 'coordination_record_only' : 'no_mutation'),
    determinism: seed.determinism ?? 'decision_deterministic',
    executionRequirements: {
      serverOwnedProfileRequired: true,
      approvedSnapshotRequired: execution,
      creditReservationRequired: seed.paid === true,
      privateArtifactInputsRequired: execution,
      privateArtifactOutputsRequired: execution && seed.produced.some((value) => value.includes('audio') || value.includes('candidate')),
      runtimeAvailabilityRequired: execution,
      licenseEvidenceRequired: seed.license === true,
      rateCardSnapshotRequired: seed.paid === true,
      arbitraryCommandAllowed: false,
      arbitraryArgumentsAllowed: false,
      arbitraryPathsAllowed: false,
      arbitraryNetworkTargetsAllowed: false,
      callerSuppliedCredentialsAllowed: false,
    },
    qualificationByMode: qualification(seed.preset),
    qualificationEvidenceLevel: seed.preset === 'fixture' ? 'fixture' :
      seed.preset === 'private' ? 'internal_execution' : seed.preset,
    qualificationEvidenceRefs: [`music.evidence.${seed.key}.v2`],
    timeEstimatorKey: `music.tool.time.${seed.key}.v2`,
    creditEstimatorKey: `music.tool.credit.${seed.key}.v2`,
    attemptPolicyKey: seed.paid ? 'music.attempt.provider_reconciled.v2' : 'music.attempt.local_idempotent.v2',
    requiredPlanningQa: ['music_scope_qa', 'music_rights_qa', 'music_timeline_qa'],
    requiredOutputQa: ['music_artifact_qa', 'music_qualification_qa'],
    requiredIntegrationQa: ['music_range_authority_qa', 'music_ownership_boundary_qa'],
    invalidationRules: ['timeline_hash_changed', 'source_hash_changed', 'rights_changed', 'manifest_hash_changed'],
    knownLimitations: seed.limitations ?? [],
  }
}

function manifest(input: {
  toolKey: string
  toolVersion: string
  toolClass: UnpublishedToolCapabilityManifest['toolClass']
  boundary: UnpublishedToolCapabilityManifest['executionBoundary']
  status: SkillQualificationStatus
  operations: OperationSeed[]
  provider?: boolean
  limitations?: string[]
}): Readonly<ToolCapabilityManifest> {
  return publishToolCapabilityManifest({
    manifestSchemaVersion: 'tool-capability-manifest-v1',
    toolManifestId: `tool.manifest.${input.toolKey}.v2`,
    toolKey: input.toolKey,
    toolVersion: input.toolVersion,
    adapterVersion: '2.0.0',
    contractVersion: '2.0.0',
    toolClass: input.toolClass,
    executionBoundary: input.boundary,
    owningSystem: 'music',
    qualificationStatus: input.status,
    qualificationEvidenceLevel: input.status === 'internal_execution_qualified'
      ? 'internal_execution' : input.status === 'blocked' ? 'blocked'
        : input.operations.some((item) => item.preset === 'fixture') ? 'fixture' : 'planning',
    qualificationEvidenceRefs: input.operations.map((item) => `music.evidence.${item.key}.v2`),
    operations: input.operations.map(operation),
    privacyPolicy: {
      policyKey: input.provider ? 'music.privacy.lyria3_preview.v2' : 'music.privacy.private_local.v2',
      privateInputsOnly: true,
      privateOutputsOnly: true,
      providerOutputUntrustedUntilIngestAndQa: input.provider === true,
      durableProviderUrlsAllowed: false,
      secretValuesAllowedInManifest: false,
      retentionApprovalRequired: input.provider === true,
    },
    securityPolicy: {
      policyKey: input.provider ? 'music.security.lyria3_preview.v2' : 'music.security.private_local.v2',
      serverOwnedProfilesOnly: true,
      sourceOverwriteAllowed: false,
      checksumValidationRequired: true,
      mediaValidationRequired: true,
      networkDenyByDefault: true,
      callerSelectedExecutableAllowed: false,
      callerSelectedArgumentsAllowed: false,
      callerSelectedPathsAllowed: false,
      callerSelectedProviderRouteAllowed: false,
    },
    licensePolicyRef: input.provider ? 'music.license.lyria3_preview_external_evidence_pending.v2' : 'music.license.project_private_media.v2',
    rateCardRef: input.provider ? 'music.rate.lyria3.official_2026_08_04.v2' : 'music.rate.local_infrastructure.v2',
    runtimeProbeKey: `music.runtime.${input.toolKey}.v2`,
    knownLimitations: input.limitations ?? [],
  })
}

const planningJobs = [...MUSIC_JOB_TYPES].filter((job) => ![
  'analyze_music_candidate', 'sync_music_to_picture', 'fit_music_to_edit',
  'prepare_music_stem', 'request_sound_processing', 'generate_original_music',
  'generate_music_variation', 'handoff_music_to_final_composition',
].includes(job))

const planningOperations: OperationSeed[] = planningJobs.map((job) => ({
  key: job,
  jobs: [job],
  preset: 'planning',
  produced: [({
    study_video_music_context: 'music_context_study_v2',
    decide_music_need: 'music_need_decision_v2',
    plan_music_narrative_arc: 'music_narrative_arc_v2',
    create_music_cue_sheet: 'music_cue_sheet_v2',
  } as Record<string, string>)[job] ?? `music_${job}_artifact_v2`],
}))

export const MUSIC_TOOL_CAPABILITY_MANIFESTS = Object.freeze([
  manifest({
    toolKey: 'music_supervision_engine', toolVersion: '2.0.0', toolClass: 'decision_route',
    boundary: 'private_coordination_service', status: 'planning_qualified', operations: planningOperations,
    limitations: ['Subjective narrative, emotional, cultural, and artistic findings remain confidence-scored or needs-review.'],
  }),
  manifest({
    toolKey: 'music_private_audio_analysis', toolVersion: '2.0.0', toolClass: 'internal_service',
    boundary: 'private_cpu_worker', status: 'internal_execution_qualified', operations: [
      {
        key: 'analyze_audio_bytes', jobs: [
          'study_existing_music', 'study_user_provided_music', 'study_reference_music',
          'create_music_reference_dna', 'analyze_music_candidate', 'qa_music',
        ], preset: 'private', accepted: ['approved_private_music_audio', 'untrusted_music_candidate'],
        produced: ['music_candidate_analysis_v2', 'music_technical_qa_v2', 'music_existing_study_v2',
          'music_user_intake_v2', 'music_reference_study_v2', 'music_reference_dna_v2'], mutation: 'read_only_analysis',
        determinism: 'deterministic',
        limitations: ['Key, vocals, semantic emotion, originality, and cultural fit are limited evidence and may require review.'],
      },
      {
        key: 'select_qualified_candidate', jobs: ['select_music_candidate'], preset: 'private',
        accepted: ['music_candidate_analysis_v2'], produced: ['music_candidate_selection_decision_v2'],
        mutation: 'coordination_record_only', determinism: 'deterministic',
      },
    ],
  }),
  manifest({
    toolKey: 'music_sync_engine', toolVersion: '2.0.0', toolClass: 'internal_service',
    boundary: 'private_cpu_worker', status: 'internal_execution_qualified', operations: [{
      key: 'compile_frame_accurate_music_placement', jobs: ['fit_music_to_edit', 'sync_music_to_picture'],
      preset: 'private', accepted: ['music_candidate_analysis_v2', 'music_cue_sheet_v2'],
      produced: ['music_beat_phrase_map_v2', 'music_editorial_plan_v2', 'music_placement_manifest_v2',
        'music_anchor_alignment_decision_v3', 'music_mix_intent_manifest_v2'],
      mutation: 'coordination_record_only', determinism: 'deterministic',
    }],
  }),
  manifest({
    toolKey: 'music_qa_engine', toolVersion: '2.0.0', toolClass: 'internal_service',
    boundary: 'private_coordination_service', status: 'internal_execution_qualified', operations: [{
      key: 'run_music_continuity_qa', jobs: ['qa_music'], preset: 'private',
      accepted: ['music_candidate_analysis_v2', 'music_placement_manifest_v2', 'music_sound_support_receipt_v2'],
      produced: ['music_qa_report_v2', 'music_continuity_report_v2'],
      mutation: 'coordination_record_only', determinism: 'deterministic',
      limitations: ['Subjective narrative, cultural, originality, and legal findings remain confidence-scored or review-required.'],
    }],
  }),
  manifest({
    toolKey: 'music_private_asset_service', toolVersion: '2.0.0', toolClass: 'internal_service',
    boundary: 'private_artifact_service', status: 'internal_execution_qualified', operations: [
      {
        key: 'preserve_source_music', jobs: ['study_existing_music', 'fit_music_to_edit'], preset: 'private',
        accepted: ['approved_private_music_audio'], produced: ['approved_music_selection_v2', 'music_existing_study_v2'],
        mutation: 'no_mutation', determinism: 'deterministic',
      },
      {
        key: 'use_user_uploaded_music', jobs: ['study_user_provided_music', 'select_user_provided_music'], preset: 'private',
        accepted: ['approved_private_music_audio'], produced: ['approved_music_selection_v2', 'music_user_intake_v2'],
        mutation: 'no_mutation', determinism: 'deterministic',
      },
      {
        key: 'match_project_music', jobs: ['search_project_music'], preset: 'private',
        accepted: ['approved_private_music_audio'], produced: ['approved_music_selection_v2'],
        mutation: 'no_mutation', determinism: 'deterministic',
      },
      {
        key: 'match_workspace_music', jobs: ['search_workspace_music'], preset: 'private',
        accepted: ['approved_private_music_audio'], produced: ['approved_music_selection_v2'],
        mutation: 'no_mutation', determinism: 'deterministic',
      },
      {
        key: 'match_internal_music', jobs: ['search_authorized_music_library'], preset: 'private',
        accepted: ['approved_private_music_audio'], produced: ['approved_music_selection_v2'],
        mutation: 'no_mutation', determinism: 'deterministic',
        limitations: ['Execution is blocked when no real rights-bound internal asset is supplied.'],
      },
    ],
  }),
  manifest({
    toolKey: 'canonical_sound_v4_port', toolVersion: '4.0.0', toolClass: 'internal_service',
    boundary: 'private_coordination_service', status: 'internal_execution_qualified', operations: [{
      key: 'process_music_through_public_sound_service',
      jobs: ['prepare_music_stem', 'request_sound_processing', 'plan_music_mix', 'qa_music'],
      preset: 'private', accepted: ['music_editorial_plan_v2', 'approved_private_music_audio'],
      produced: ['processed_music_audio_v2', 'music_stem_audio_v2', 'music_sound_support_receipt_v2'],
      mutation: 'create_versioned_private_artifact', determinism: 'deterministic',
      limitations: ['Admission derives from the exact selected canonical Sound v4 capability and route.'],
    }],
  }),
  manifest({
    toolKey: 'google_lyria_3', toolVersion: '3.0.0-preview.20260325', toolClass: 'external_provider',
    boundary: 'server_provider_adapter', status: 'planning_qualified', provider: true, operations: [
      {
        key: 'generate_original_music_injected', jobs: ['generate_original_music'], preset: 'fixture',
        accepted: ['music_composition_brief_v2'],
        produced: ['untrusted_music_candidate', 'music_composition_brief_v2', 'music_provider_attempt_v2'],
        mutation: 'private_provider_ingest', determinism: 'bounded_nondeterministic', paid: true, license: true,
        limitations: ['Injected transport is fixture-qualified; live Lyria 3 remains fail-closed without external evidence.'],
      },
      {
        key: 'generate_music_variation_injected', jobs: ['generate_music_variation'], preset: 'fixture',
        accepted: ['music_composition_brief_v2', 'approved_private_music_audio'],
        produced: ['untrusted_music_candidate', 'music_composition_brief_v2', 'music_provider_attempt_v2'],
        mutation: 'private_provider_ingest', determinism: 'bounded_nondeterministic', paid: true, license: true,
        limitations: ['Variation remains cue- and rights-bound and is fixture-qualified only.'],
      },
    ],
    limitations: [
      'Lyria 3 models are public preview; account, privacy, retention, commercial approval, deployment, and private canary evidence are absent.',
      'The current Interactions API stores by default unless store=false; canonical requests must explicitly disable storage.',
    ],
  }),
  manifest({
    toolKey: 'music_handoff_service', toolVersion: '2.0.0', toolClass: 'internal_service',
    boundary: 'private_artifact_service', status: 'internal_execution_qualified', operations: [
      {
        key: 'create_final_music_handoff', jobs: ['handoff_music_to_final_composition'], preset: 'private',
        accepted: ['music_placement_manifest_v2', 'music_qa_report_v2'],
        produced: ['music_final_composition_handoff_v2'], mutation: 'coordination_record_only', determinism: 'deterministic',
      },
      {
        key: 'create_no_music_handoff', jobs: [
          'decide_music_need', 'decide_music_silence', 'plan_scene_music', 'plan_boundary_music',
          'full_video_music_pass', 'support_motion_studio_music', 'support_living_frame_music',
          'support_3d_music', 'support_transition_music', 'support_graphic_design_music',
        ], preset: 'private', accepted: ['music_assignment_v2'],
        produced: ['intentional_no_music_handoff_v2'], mutation: 'no_mutation', determinism: 'deterministic',
      },
      {
        key: 'create_ambience_only_handoff', jobs: [
          'decide_music_need', 'decide_music_silence', 'plan_scene_music', 'plan_boundary_music',
          'full_video_music_pass',
        ], preset: 'private', accepted: ['music_assignment_v2'],
        produced: ['music_ambience_only_handoff_v2'], mutation: 'coordination_record_only', determinism: 'deterministic',
        limitations: ['Music requests non-musical ambience from Sound and never generates ambience directly.'],
      },
    ],
  }),
])

for (const item of MUSIC_TOOL_CAPABILITY_MANIFESTS) registerToolCapabilityManifest(item)

export function registerMusicToolCapabilityManifests(): void {
  for (const item of MUSIC_TOOL_CAPABILITY_MANIFESTS) registerToolCapabilityManifest(item)
}
