import type { SkillQualificationFixtureDefinition } from '../core/skill-capability-manifest-types'

export const BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS = [
  'no_action_emotional_moment',
  'existing_source_cutaway_zero_provider_requests',
  'approved_user_asset_context',
  'generated_context_candidate_planning',
  'generated_proof_rejected',
  'outside_range_mutation_rejected',
  'whole_video_context_read_only',
  'primary_visual_conflict',
  'caption_collision_repair',
  'tracking_dependency_present',
  'tracking_dependency_missing',
  'repeated_concept_rejected',
  'region_ineligible_uploaded_video_edit',
  'unsupported_aspect_ratio_crop_safe_plan',
  'audio_disposition_handoff',
] as const

export const BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS = [
  'provider_unknown_outcome',
  'stale_rate_authority_block',
  'retired_provider_route_rejected',
  'idempotent_provider_replay',
  'one_failed_candidate_refinement',
  'refinement_limit_enforced',
  'historical_provider_v1_v4_hash_preservation',
  'cross_workspace_artifact_substitution',
  'source_checksum_substitution',
  'provider_route_substitution',
  'model_alias_substitution',
  'attempt_replay_modified_request',
  'forged_qa_pass',
  'forged_qualification_receipt',
  'stale_manifest_hash',
  'stale_assignment_range',
  'raw_credential_input',
  'raw_provider_url_persistence',
  'work_item_outside_range',
  'caller_selected_executable',
  'second_provider_submission_inside_attempt',
] as const

export const BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS = [
  'real_gemini_omni_private_canary',
  'live_credential_boundary',
  'account_effective_rate_authority',
  'live_private_output_ingest',
  'live_security_privacy_release_review',
] as const

export const BROLL_QUALIFICATION_FIXTURES: readonly SkillQualificationFixtureDefinition[] = [
  ...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
    fixtureKey,
    minimumStatus: 'planning_qualified' as const,
    description: `B-roll planning qualification: ${fixtureKey.replaceAll('_', ' ')}.`,
  })),
  ...BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
    fixtureKey,
    minimumStatus: 'internal_execution_qualified' as const,
    description: `B-roll internal execution qualification: ${fixtureKey.replaceAll('_', ' ')}.`,
  })),
  ...BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
    fixtureKey,
    minimumStatus: 'production_qualified' as const,
    description: `B-roll production qualification: ${fixtureKey.replaceAll('_', ' ')}.`,
  })),
]
