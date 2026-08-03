import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import type {
  SkillCapabilityManifest,
  SkillQualificationFixtureDefinition,
} from '../core/skill-capability-manifest-types'
import { createSkillQualificationReceipt } from '../core/skill-qualification-receipt'

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

export function createBrollImplementationPendingQualificationReceipt(
  manifest: SkillCapabilityManifest,
) {
  const evidenceHash = hashSkillValue({
    milestone: 'M2',
    manifestHash: manifest.manifestHash,
    evidence: 'schema_hash_static_registry_validation',
  })
  return createSkillQualificationReceipt({
    schemaVersion: 'skill-qualification-receipt-v1',
    manifestRef: skillManifestReference(manifest),
    qualificationStatus: 'implementation_pending',
    fixtureResults: [
      { fixtureKey: 'manifest_schema_validation', status: 'passed', evidenceHash, summary: 'Strict manifest schema passed.' },
      { fixtureKey: 'manifest_hash_validation', status: 'passed', evidenceHash, summary: 'Canonical manifest hash passed.' },
      { fixtureKey: 'static_registry_validation', status: 'passed', evidenceHash, summary: 'All manifest references resolved.' },
    ],
    buildEvidenceHashes: [evidenceHash],
    testEvidenceHashes: [evidenceHash],
    securityEvidenceHashes: [evidenceHash],
    providerEvidenceHashes: [],
    issuedAt: '2026-08-03T12:00:00.000Z',
  })
}

export function createBrollPlanningQualificationReceipt(
  manifest: SkillCapabilityManifest,
) {
  const evidenceHash = hashSkillValue({
    milestone: 'M3',
    manifestHash: manifest.manifestHash,
    fixtures: BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
    evidence: 'deterministic_planning_fixture_suite',
  })
  return createSkillQualificationReceipt({
    schemaVersion: 'skill-qualification-receipt-v1',
    manifestRef: skillManifestReference(manifest),
    qualificationStatus: 'planning_qualified',
    fixtureResults: BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
      fixtureKey,
      status: 'passed' as const,
      evidenceHash,
      summary: `${fixtureKey.replaceAll('_', ' ')} passed the deterministic planning suite.`,
    })),
    buildEvidenceHashes: [evidenceHash],
    testEvidenceHashes: [evidenceHash],
    securityEvidenceHashes: [evidenceHash],
    providerEvidenceHashes: [],
    issuedAt: '2026-08-03T13:00:00.000Z',
  })
}

const internalFixtureProofOwner = {
  provider_unknown_outcome: 'smoke:b-roll-provider-authority',
  stale_rate_authority_block: 'smoke:b-roll-provider-authority',
  retired_provider_route_rejected: 'smoke:b-roll-retirement',
  idempotent_provider_replay: 'smoke:b-roll-provider-authority',
  one_failed_candidate_refinement: 'smoke:b-roll-end-to-end',
  refinement_limit_enforced: 'smoke:b-roll-candidate-qa',
  historical_provider_v1_v4_hash_preservation: 'smoke:b-roll-provider-authority',
  cross_workspace_artifact_substitution: 'smoke:b-roll-provider-authority',
  source_checksum_substitution: 'smoke:b-roll-existing-source',
  provider_route_substitution: 'smoke:b-roll-provider-authority',
  model_alias_substitution: 'smoke:b-roll-provider-authority',
  attempt_replay_modified_request: 'smoke:b-roll-provider-authority',
  forged_qa_pass: 'smoke:b-roll-candidate-qa',
  forged_qualification_receipt: 'smoke:b-roll-end-to-end',
  stale_manifest_hash: 'test:b-roll-canonical-integration',
  stale_assignment_range: 'test:b-roll-canonical-integration',
  raw_credential_input: 'smoke:b-roll-provider-authority',
  raw_provider_url_persistence: 'smoke:b-roll-provider-lifecycle',
  work_item_outside_range: 'test:b-roll-canonical-integration',
  caller_selected_executable: 'smoke:b-roll-provider-authority',
  second_provider_submission_inside_attempt: 'smoke:b-roll-provider-authority',
} as const satisfies Record<
  (typeof BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS)[number],
  string
>

function internalEvidenceHash(input: {
  fixtureKey: string
  proofOwner: string
}): string {
  return hashSkillValue({
    schemaVersion: 'b_roll_internal_qualification_evidence_v1',
    fixtureKey: input.fixtureKey,
    proofOwner: input.proofOwner,
    evidenceMode: 'deterministic_fixture_plus_private_injected_execution',
    actualProviderRequestsRequired: 0,
    publicDeliveryAllowed: false,
    productionClaimAllowed: false,
  })
}

export function createBrollInternalExecutionQualificationReceipt(
  manifest: SkillCapabilityManifest,
) {
  const planningResults = BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
    fixtureKey,
    status: 'passed' as const,
    evidenceHash: internalEvidenceHash({ fixtureKey, proofOwner: 'test:b-roll-planning' }),
    summary: `${fixtureKey.replaceAll('_', ' ')} passed the deterministic planning suite.`,
  }))
  const internalResults = BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS.map(
    (fixtureKey) => ({
      fixtureKey,
      status: 'passed' as const,
      evidenceHash: internalEvidenceHash({
        fixtureKey,
        proofOwner: internalFixtureProofOwner[fixtureKey],
      }),
      summary: `${fixtureKey.replaceAll('_', ' ')} passed its internal private or injected execution fixture.`,
    }),
  )
  const testEvidenceHashes = [...planningResults, ...internalResults]
    .map((result) => result.evidenceHash)
  const buildEvidenceHash = hashSkillValue({
    schemaVersion: 'b_roll_internal_qualification_build_evidence_v1',
    commands: ['build', 'typecheck:server', 'lint', 'check:frontend-boundary'],
  })
  const securityEvidenceHash = hashSkillValue({
    schemaVersion: 'b_roll_internal_qualification_security_evidence_v1',
    fixtures: [
      'cross_workspace_artifact_substitution',
      'source_checksum_substitution',
      'raw_credential_input',
      'raw_provider_url_persistence',
      'caller_selected_executable',
    ],
  })
  const providerEvidenceHash = hashSkillValue({
    schemaVersion: 'b_roll_internal_qualification_provider_evidence_v1',
    operationId: 'provider.google.generate_b_roll_candidate.v1',
    actualProviderRequests: 0,
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    alternateProviderFallbacks: 0,
  })
  return createSkillQualificationReceipt({
    schemaVersion: 'skill-qualification-receipt-v1',
    manifestRef: skillManifestReference(manifest),
    qualificationStatus: 'internal_execution_qualified',
    fixtureResults: [...planningResults, ...internalResults],
    buildEvidenceHashes: [buildEvidenceHash],
    testEvidenceHashes,
    securityEvidenceHashes: [securityEvidenceHash],
    providerEvidenceHashes: [providerEvidenceHash],
    issuedAt: '2026-08-03T20:00:00.000Z',
  })
}
